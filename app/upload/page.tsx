"use client";
import { useEffect, useState, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const MODEL_EXTENSIONS = ["glb", "gltf", "obj", "fbx"];
const AUTOCAD_EXTENSIONS = ["dwg", "dxf"];

// ─── R2 upload — model files ─────────────────────────────────────────────────
async function uploadToR2(
  file: File,
  userId: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const res = await fetch("/api/r2-presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      userId,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to get R2 upload URL");
  }
  const { presignedUrl, publicUrl } = await res.json();
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => xhr.status === 200 ? resolve() : reject(new Error("R2 upload failed"));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
  return publicUrl;
}

// ─── Supabase upload — thumbnails only ───────────────────────────────────────
async function uploadThumbnailToSupabase(file: File, userId: string): Promise<string> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const thumbPath = `thumbs/${userId}/${Date.now()}_${safeName}`;
  const { error } = await supabase.storage.from("models").upload(thumbPath, file, {
    cacheControl: "3600", upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("models").getPublicUrl(thumbPath);
  return data.publicUrl;
}

export default function UploadContent() {
  const [user, setUser] = useState<any>(null);
  const [uploadType, setUploadType] = useState<"model" | "autocad" | "xr-build">("model");
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // XR-build specific
  const [version, setVersion] = useState("1.0.0");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [genre, setGenre] = useState("");
  const [targetMedium, setTargetMedium] = useState<"AR" | "VR">("AR");
  const [minimumSpecs, setMinimumSpecs] = useState({ ram: "2GB", storage: "100MB", os: "Android 8.0+" });
  const [changelog, setChangelog] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return () => unsub();
  }, []);

  const PLATFORMS = ["Windows", "Android", "iOS", "macOS", "Linux", "WebGL"];
  const BUILD_GENRES = ["Professional", "Utility", "Education", "Industrial", "VR Showcase", "AR Tool", "Simulation", "Enterprise"];
  const MODEL_CATEGORIES = ["Jewellery", "Character", "Environment", "Prop", "Vehicle", "Animation", "Architecture", "Abstract", "Other"];
  const AR_VR_TAGS = targetMedium === "AR"
    ? ["arcore", "arkit", "webxr", "vuforia", "spark-ar", "8thwall", "nianticlabs"]
    : ["oculus", "webxr", "metaverse", "quest", "steamvr", "htc-vive", "psvr"];

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-gray-200">
        <h1 className="text-gray-900 text-3xl font-extrabold mb-4">Sign in required</h1>
        <p className="text-gray-500 mb-8">You must be signed in to upload content.</p>
        <Link href="/login">
          <button className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white font-bold shadow-sm">Sign In</button>
        </Link>
      </div>
    </div>
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (uploadType === "xr-build") {
      if (ext !== "zip") { setError("XR builds must be uploaded as a .zip file"); return; }
    } else if (uploadType === "autocad") {
      if (!AUTOCAD_EXTENSIONS.includes(ext ?? "")) { setError("AutoCAD files must be .dwg or .dxf"); return; }
    } else {
      if (!MODEL_EXTENSIONS.includes(ext ?? "")) { setError(`Only ${MODEL_EXTENSIONS.join(", ")} files allowed`); return; }
    }
    setFile(f);
    setError("");
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Thumbnail must be an image file"); return; }
    if (f.size > 5 * 1024 * 1024) { setError("Thumbnail must be smaller than 5MB"); return; }
    setThumbnail(f);
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => setThumbnailPreview(ev.target?.result as string ?? "");
    reader.readAsDataURL(f);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handlePublish = async () => {
    if (!file || !title) { setError("Please fill all required fields."); return; }
    if (uploadType === "xr-build" && (!platforms.length || !genre)) {
      setError("Please select platforms and genre."); return;
    }
    setUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      // 1 — Model → R2
      setUploadStage("Uploading to Cloudflare R2...");
      const modelUrl = await uploadToR2(file, user.uid, (pct) => {
        setUploadProgress(Math.round(pct * 0.7));
      });

      // 2 — Thumbnail → Supabase
      let finalThumbnailUrl = "";
      if (thumbnail) {
        setUploadStage("Uploading thumbnail...");
        setUploadProgress(70);
        finalThumbnailUrl = await uploadThumbnailToSupabase(thumbnail, user.uid);
        setUploadProgress(85);
      }

      // 3 — Metadata → Firestore
      setUploadStage("Saving to database...");
      setUploadProgress(90);

      const { doc: dbDoc, getDoc } = await import("firebase/firestore");
      const userSnap = await getDoc(dbDoc(db, "users", user.uid));
      const userData = userSnap.exists() ? userSnap.data() : { displayName: "Anonymous", photoURL: "" };
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "glb";

      const baseData = {
        title, description,
        fileSize: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        modelUrl,
        thumbnailUrl: finalThumbnailUrl,
        isPaid,
        price: isPaid ? price : 0,
        authorId: user.uid,
        authorName: userData.displayName || user.email,
        authorPhoto: userData.photoURL || "/avatar.png",
        tags,
        status: "published",
        uploadedAt: serverTimestamp(),
        storageProvider: "r2",
        engagementScore: 0,
        views: 0, likes: 0, downloads: 0,
      };

      if (uploadType === "model" || uploadType === "autocad") {
        const fileType = ["dwg", "dxf"].includes(ext) ? ext : ["obj", "fbx"].includes(ext) ? ext : "glb";
        await addDoc(collection(db, "models"), {
          ...baseData,
          category: uploadType === "autocad" ? "AutoCAD" : category,
          fileType,
        });
      } else {
        const allTags = [...new Set([...tags, ...AR_VR_TAGS.slice(0, 2)])];
        await addDoc(collection(db, "models"), {
          ...baseData,
          category: targetMedium === "AR" ? "AR Build" : "VR Build",
          fileType: "build",
          version, platforms, genre, minimumSpecs, changelog,
          tags: allTags,
        });
      }

      setUploadProgress(100);
      setSuccess(true);
      setTimeout(() => {
        const gotoMode = uploadType === "xr-build" ? (targetMedium === "AR" ? "ar" : "vr") : uploadType === "autocad" ? "autocad" : "3d";
        window.location.href = `/gallery?mode=${gotoMode}`;
      }, 2000);
    } catch (e) {
      console.error("Upload Error:", e);
      setError((e as Error).message);
      setUploading(false);
      setUploadStage("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-24 flex-grow w-full">

        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900/40 backdrop-blur-sm">
              <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center shadow-2xl max-w-sm w-full mx-4">
                <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                  <motion.svg className="w-10 h-10 text-green-500" animate={{ scale: [0.8, 1.1, 1] }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </motion.svg>
                </div>
                <h2 className="text-gray-900 text-2xl font-black mb-2">Published!</h2>
                <p className="text-gray-500 text-sm">Redirecting to gallery...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-10 lg:pl-4">
          <Link href="/gallery" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm font-semibold mb-6 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Gallery
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Upload Content</h1>
          <p className="text-gray-500 text-lg">Share 3D models, AutoCAD drawings, AR or VR builds with the world.</p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-orange-700">Powered by Cloudflare R2 — no file size limits</span>
          </div>
        </div>

        {/* ── STEP 0: Type ── */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="lg:pl-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-10 shadow-sm">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Choose Upload Type</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-10">
                {[
                  { type: "model" as const,    title: "3D Model",    desc: "GLB, GLTF, OBJ, FBX",  icon: "📦", accent: "blue"   },
                  { type: "autocad" as const,  title: "AutoCAD",     desc: "DWG & DXF drawings",    icon: "📐", accent: "orange" },
                  { type: "xr-build" as const, title: "XR Application", desc: "AR & VR .zip builds",   icon: "🥽", accent: "purple" },
                ].map(({ type, title, desc, icon, accent }) => {
                  const isSel = uploadType === type;
                  const sel: Record<string,string> = { blue:"border-blue-500 bg-blue-50", orange:"border-orange-500 bg-orange-50", purple:"border-purple-500 bg-purple-50" };
                  const bg:  Record<string,string> = { blue:"bg-blue-100", orange:"bg-orange-100", purple:"bg-purple-100" };
                  return (
                    <button key={type} onClick={() => { setUploadType(type); setStep(1); }}
                      className={`p-6 rounded-3xl border-[3px] transition-all duration-200 text-center flex flex-col items-center justify-center h-full shadow-sm hover:shadow-md hover:-translate-y-1 ${isSel ? sel[accent]+" shadow-md" : "border-gray-100 bg-white hover:border-gray-200"}`}>
                      <span className={`text-3xl mb-4 w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm ${isSel ? bg[accent] : "bg-gray-50"}`}>{icon}</span>
                      <p className="font-black text-base mb-1 text-gray-900">{title}</p>
                      <p className="text-xs text-gray-500 font-medium">{desc}</p>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end">
                <button onClick={() => setStep(1)} className="px-10 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-sm text-white font-bold transition">Continue</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 1: Files ── */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="lg:pl-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-10 shadow-sm">
              <div className="mb-8 flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Step 1 of {uploadType === "model" ? "3" : "4"}</p>
                  <h2 className="text-3xl font-extrabold text-gray-900">Upload Media</h2>
                </div>
                {uploadType === "xr-build" && <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-purple-200">XR builds require .zip</span>}
                {uploadType === "autocad" && <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-orange-200">AutoCAD: .dwg or .dxf only</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Main file */}
                <div onClick={() => fileInputRef.current?.click()}
                  className="group border-2 border-dashed border-gray-300 rounded-2xl p-8 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition text-center flex flex-col justify-center min-h-[220px]">
                  <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden"
                    accept={uploadType === "autocad" ? AUTOCAD_EXTENSIONS.map(e=>`.${e}`).join(",") : uploadType === "xr-build" ? ".zip" : MODEL_EXTENSIONS.map(e=>`.${e}`).join(",")} />
                  <div className="w-16 h-16 rounded-full bg-gray-50 group-hover:bg-white flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm transition">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  {file ? (
                    <div>
                      <p className="text-gray-900 font-bold text-sm truncate px-4">{file.name}</p>
                      <p className="text-gray-500 text-xs mt-1 font-medium">{(file.size/(1024*1024)).toFixed(2)} MB</p>
                      <p className="text-orange-600 text-xs mt-1 font-semibold">→ Cloudflare R2</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-900 font-bold text-sm mb-1">Upload Main File</p>
                      <p className="text-gray-500 text-xs">
                        {uploadType === "model" ? "GLB, GLTF, OBJ, FBX" : uploadType === "autocad" ? "DWG or DXF" : ".zip packages only"}
                      </p>
                      <p className="text-orange-600 text-xs mt-2 font-semibold">No size limit via R2</p>
                    </div>
                  )}
                </div>
                {/* Thumbnail */}
                <div onClick={() => thumbnailInputRef.current?.click()}
                  className={`group relative border-2 border-dashed rounded-2xl p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition text-center flex flex-col justify-center min-h-[220px] overflow-hidden ${uploadType !== "model" && !thumbnailPreview ? "border-amber-300 bg-amber-50/30" : "border-gray-300"}`}>
                  <input ref={thumbnailInputRef} type="file" onChange={handleThumbnailSelect} className="hidden" accept="image/*" />
                  {thumbnailPreview && <img src={thumbnailPreview} className="w-full h-full object-cover rounded-xl shadow-sm absolute inset-0 z-0" alt="thumbnail" />}
                  <div className={`relative z-10 w-full h-full flex flex-col items-center justify-center ${thumbnailPreview ? "absolute inset-0 bg-white/80 p-4 rounded-xl opacity-0 hover:opacity-100 transition" : ""}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border shadow-sm transition ${thumbnailPreview ? "bg-white border-gray-200" : "bg-gray-50 group-hover:bg-white border-gray-100"}`}>
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    {thumbnailPreview
                      ? <p className="text-gray-900 font-bold text-sm">Replace Thumbnail</p>
                      : <><p className="text-gray-900 font-bold text-sm mb-1">Upload Thumbnail {uploadType !== "model" && <span className="text-amber-600">*</span>}</p><p className="text-gray-500 text-xs">High quality images only<br/>(Max 5MB)</p></>
                    }
                  </div>
                </div>
              </div>
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {error}
                </div>
              )}
              <div className="flex gap-4 justify-between border-t border-gray-100 pt-6">
                <button onClick={() => setStep(0)} className="px-8 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-bold shadow-sm hover:bg-gray-50 transition">← Back</button>
                <button onClick={() => setStep(2)} disabled={!file}
                  className="px-10 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:bg-gray-400 text-white font-bold transition">Continue</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Details ── */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="lg:pl-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-10 shadow-sm space-y-6">
              <div className="mb-8 border-b border-gray-100 pb-6">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Step 2 of {uploadType === "model" ? "3" : "4"}</p>
                <h2 className="text-3xl font-extrabold text-gray-900">Content Details</h2>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Title *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder={uploadType === "model" ? "e.g. Low Poly Industrial Warehouse" : uploadType === "xr-build" ? "e.g. AR Interior Designer" : "e.g. Floor Plan"}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm" />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                  placeholder="Describe your content..."
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm resize-none" />
              </div>
              {uploadType === "model" && (
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm">
                    <option value="">Select a sub-category</option>
                    {MODEL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              {uploadType === "autocad" && (
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                  <p className="text-orange-800 text-sm font-bold">📐 AutoCAD DWG/DXF — listed under AutoCAD Hub automatically.</p>
                </div>
              )}
              {uploadType === "xr-build" && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">Target Medium *</label>
                      <div className="flex gap-2">
                        {(["AR","VR"] as const).map((m) => (
                          <button key={m} onClick={() => setTargetMedium(m)}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition border ${targetMedium === m ? (m==="AR" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-indigo-500 bg-indigo-50 text-indigo-700") : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                            {m} {m==="AR" ? "(Augmented)" : "(Virtual)"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">Content Genre *</label>
                      <select value={genre} onChange={(e) => setGenre(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm">
                        <option value="">Select genre</option>
                        {BUILD_GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Version</label>
                    <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-3">Supported Platforms *</label>
                    <div className="flex flex-wrap gap-2">
                      {PLATFORMS.map((p) => {
                        const sel = platforms.includes(p);
                        return (
                          <button key={p} onClick={() => setPlatforms(sel ? platforms.filter(x=>x!==p) : [...platforms,p])}
                            className={`px-4 py-2 rounded-lg font-bold text-xs transition border shadow-sm ${sel ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}>
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              {/* Tags */}
              <div className="pt-2">
                <label className="block text-gray-700 text-sm font-bold mb-3">Tags</label>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {tags.map((t) => (
                    <button key={t} onClick={() => setTags(tags.filter(x=>x!==t))}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition whitespace-nowrap">
                      {t} <span className="ml-1 opacity-60">✕</span>
                    </button>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    placeholder="Add tags (e.g. low-poly, scifi)"
                    className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm shadow-sm" />
                  <button onClick={handleAddTag} className="px-6 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-200 transition shadow-sm whitespace-nowrap">Add Tag</button>
                </div>
                {uploadType === "xr-build" && (
                  <p className="text-gray-400 font-medium text-xs mt-3">
                    Suggested: {AR_VR_TAGS.map(t => (
                      <span key={t} onClick={() => { if(!tags.includes(t)) setTags([...tags,t]); }}
                        className="cursor-pointer hover:text-blue-500 mr-2">#{t}</span>
                    ))}
                  </p>
                )}
              </div>
              {/* Pricing */}
              <div className="pt-2 border-t border-gray-100 mt-4">
                <div className="flex items-center gap-4 p-5 rounded-xl border border-gray-200 bg-gray-50 hover:border-gray-300 transition cursor-pointer mt-4" onClick={() => setIsPaid(!isPaid)}>
                  <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" onClick={(e) => e.stopPropagation()} />
                  <label className="text-gray-900 font-bold text-base cursor-pointer">Monetize this content (Razorpay)</label>
                </div>
                {isPaid && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Price (₹ INR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                      <input type="number" value={price || ""} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                        placeholder="99" min="0"
                        className="w-full bg-white border border-gray-300 rounded-xl pl-8 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm font-semibold" />
                    </div>
                    <p className="text-gray-500 text-xs font-semibold mt-2">15% platform fee + ~2% Razorpay fee applies.</p>
                  </motion.div>
                )}
              </div>
              <div className="flex gap-4 justify-between border-t border-gray-100 pt-8 mt-4">
                <button onClick={() => setStep(1)} className="px-8 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-bold shadow-sm hover:bg-gray-50 transition">← Back</button>
                <button onClick={() => setStep(3)}
                  disabled={!title || (uploadType === "xr-build" && (!genre || !platforms.length)) || (isPaid && (!price || price <= 0))}
                  className="px-10 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:bg-gray-400 text-white font-bold transition">Continue</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Build specs (XR only) ── */}
        {step === 3 && uploadType === "xr-build" && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="lg:pl-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-10 shadow-sm space-y-6">
              <div className="mb-8 border-b border-gray-100 pb-6">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Step 3 of 4</p>
                <h2 className="text-3xl font-extrabold text-gray-900">Minimum Specifications</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: "Minimum RAM",  key: "ram",     placeholder: "e.g. 4GB"        },
                  { label: "Storage Req.", key: "storage", placeholder: "e.g. 500MB"       },
                  { label: "OS Level",     key: "os",      placeholder: "e.g. Android 10+" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>
                    <input value={minimumSpecs[key as keyof typeof minimumSpecs]}
                      onChange={(e) => setMinimumSpecs({ ...minimumSpecs, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm" />
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">Release Notes / Changelog</label>
                <textarea value={changelog} onChange={(e) => setChangelog(e.target.value)}
                  placeholder="What's new in this version?" rows={4}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm resize-none" />
              </div>
              <div className="flex gap-4 justify-between border-t border-gray-100 pt-8 mt-4">
                <button onClick={() => setStep(2)} className="px-8 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-bold shadow-sm hover:bg-gray-50 transition">← Back</button>
                <button onClick={() => setStep(4)} className="px-10 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-sm text-white font-bold transition">Continue</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── FINAL STEP: Review & Publish ── */}
        {step === (uploadType === "model" || uploadType === "autocad" ? 3 : 4) && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="lg:pl-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 md:p-10 shadow-sm space-y-6">
              <div className="mb-8 border-b border-gray-100 pb-6">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Final Step</p>
                <h2 className="text-3xl font-extrabold text-gray-900">Distribution & Publish</h2>
              </div>
              <div className="p-6 rounded-xl border border-gray-200 bg-gray-50">
                <p className="text-gray-900 font-black mb-4">Summary Configuration</p>
                <div className="grid grid-cols-2 gap-y-3 font-medium text-sm">
                  <p className="text-gray-500">Asset Title</p>  <p className="text-gray-900 text-right truncate font-bold">{title || "Untitled"}</p>
                  <p className="text-gray-500">Class</p>        <p className="text-gray-900 text-right font-bold">{uploadType === "model" ? "3D Model" : uploadType === "autocad" ? "AutoCAD Drawing" : targetMedium === "AR" ? "AR Application" : "VR Application"}</p>
                  <p className="text-gray-500">Payload</p>      <p className="text-gray-900 text-right font-bold">{file ? (file.size/(1024*1024)).toFixed(2) : 0} MB</p>
                  <p className="text-gray-500">Storage</p>      <p className="text-orange-600 text-right font-bold">Cloudflare R2</p>
                  <p className="text-gray-500">Listing</p>      <p className={`text-right font-bold ${isPaid ? "text-green-600" : "text-blue-600"}`}>{isPaid ? `Premium (₹${price})` : "Free Access"}</p>
                </div>
              </div>
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {error}
                </div>
              )}
              {uploading && (
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-blue-600">{uploadStage}</span>
                    <span className="text-gray-500">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shadow-inner">
                    <motion.div animate={{ width: `${uploadProgress}%` }} className="h-full bg-blue-500 transition-all ease-out" />
                  </div>
                </div>
              )}
              <div className="flex gap-4 justify-between border-t border-gray-100 pt-8 mt-4">
                <button onClick={() => setStep(uploadType === "model" || uploadType === "autocad" ? 2 : 3)} disabled={uploading}
                  className="px-8 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-bold shadow-sm hover:bg-gray-50 transition disabled:opacity-50">← Edit</button>
                <button onClick={handlePublish} disabled={uploading}
                  className="px-10 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-400 text-white font-bold transition shadow-sm w-48">
                  {uploading ? "Publishing..." : "Publish Content"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </div>
      <Footer />
    </div>
  );
}
