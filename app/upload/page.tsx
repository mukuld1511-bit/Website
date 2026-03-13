"use client";
import { useEffect, useState, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { uploadToCloudinary } from "../../lib/cloudinary";

const MODEL_EXTENSIONS = ["glb", "gltf", "obj", "fbx", "dwg", "dxf"];
const BUILD_EXTENSIONS = ["zip"];

export default function UploadContent() {
  const [user, setUser] = useState<any>(null);
  const [uploadType, setUploadType] = useState<"model" | "ar-build" | "vr-build">("model");
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Build-specific fields
  const [version, setVersion] = useState("1.0.0");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [genre, setGenre] = useState("");
  const [minimumSpecs, setMinimumSpecs] = useState({ ram: "2GB", storage: "100MB", os: "Android 8.0+" });
  const [changelog, setChangelog] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return () => unsub();
  }, []);

  const PLATFORMS = ["Windows", "Android", "iOS", "macOS", "Linux", "WebGL"];
  const BUILD_GENRES = ["Game", "Utility", "Education", "Tool", "VR", "AR", "Simulation", "Social"];
  const MODEL_CATEGORIES = ["Character", "Environment", "Prop", "Vehicle", "Animation", "Architecture", "Abstract", "Other"];
  const AR_VR_TAGS = uploadType === "ar-build"
    ? ["arcore", "arkit", "webxr", "vuforia", "spark-ar", "8thwall", "nianticlabs"]
    : uploadType === "vr-build"
    ? ["oculus", "webxr", "metaverse", "quest", "steamvr", "htc-vive", "psvr"]
    : [];

  if (!user) return (
    <div className="min-h-screen bg-[#050008] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-white text-3xl font-black mb-4">Sign in required</h1>
        <Link href="/login">
          <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-black">Sign In</button>
        </Link>
      </div>
    </div>
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();

    if (uploadType !== "model") {
      // AR/VR: ZIP only
      if (ext !== "zip") {
        setError("AR/VR builds must be uploaded as a .zip file");
        return;
      }
    } else {
      if (!MODEL_EXTENSIONS.includes(ext ?? "")) {
        setError(`Only ${MODEL_EXTENSIONS.join(", ")} files allowed`);
        return;
      }
    }

    const maxSize = uploadType === "model" ? 500 * 1024 * 1024 : 2 * 1024 * 1024 * 1024;
    if (f.size > maxSize) {
      setError(`File must be smaller than ${uploadType === "model" ? "500MB" : "2GB"}`);
      return;
    }
    setFile(f);
    setError("");
  };

  const handleThumbnailSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Thumbnail must be an image");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Thumbnail must be smaller than 5MB");
      return;
    }
    setThumbnail(f);
    const reader = new FileReader();
    reader.onload = (e) => setThumbnailPreview(e.target?.result as string);
    reader.readAsDataURL(f);

    try {
      setUploadProgress(25);
      const url = await uploadToCloudinary(f, (pct) => setUploadProgress(Math.round(pct * 0.25)));
      setThumbnailUrl(url);
      setUploadProgress(0);
    } catch {
      setError("Failed to upload thumbnail");
      setThumbnail(null);
      setThumbnailPreview("");
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handlePublish = async () => {
    if (!file || !title) {
      setError("Fill all required fields");
      return;
    }
    if (uploadType !== "model" && (!platforms.length || !genre)) {
      setError("Select platforms and genre");
      return;
    }
    // AR/VR thumbnail mandatory
    if (uploadType !== "model" && !thumbnailUrl) {
      setError("Thumbnail is required for AR/VR builds");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileUrl = await uploadToCloudinary(file, (pct) => setUploadProgress(Math.round(pct * 0.6)));
      setUploadProgress(60);

      let finalThumbnailUrl = thumbnailUrl;
      if (thumbnail && !thumbnailUrl) {
        finalThumbnailUrl = await uploadToCloudinary(thumbnail);
      }
      setUploadProgress(80);

      const { doc: dbDoc, getDoc } = await import("firebase/firestore");
      const userSnap = await getDoc(dbDoc(db, "users", user.uid));
      const userData = userSnap.exists() ? userSnap.data() : { displayName: "Anonymous", photoURL: "" };

      const baseData = {
        title,
        description,
        fileSize: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        fileUrl,
        thumbnailUrl: finalThumbnailUrl,
        isPaid,
        price: isPaid ? price : 0,
        authorId: user.uid,
        authorName: userData.displayName || user.email,
        authorPhoto: userData.photoURL || "/avatar.png",
        tags,
        status: "published",
        uploadedAt: serverTimestamp(),
      };

      if (uploadType === "model") {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "glb";
        const fileType = ["dwg", "dxf"].includes(ext) ? ext : ["obj", "fbx"].includes(ext) ? ext : "glb";
        await addDoc(collection(db, "models"), {
          ...baseData,
          category,
          fileType,
          views: 0,
          likes: 0,
          downloads: 0,
        });
      } else {
        const arTags = AR_VR_TAGS.slice(0, 2);
        const allTags = [...new Set([...tags, ...arTags])];
        await addDoc(collection(db, "models"), {
          ...baseData,
          category: uploadType === "ar-build" ? "AR Build" : "VR Build",
          fileType: "build",
          version,
          platforms,
          genre,
          minimumSpecs,
          changelog,
          tags: allTags,
          views: 0,
          likes: 0,
          downloads: 0,
        });
      }

      setUploadProgress(100);
      setSuccess(true);
      setTimeout(() => {
        window.location.href = `/gallery?mode=${uploadType === "ar-build" ? "ar" : uploadType === "vr-build" ? "vr" : "3d"}`;
      }, 2000);
    } catch (e) {
      setError((e as Error).message);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-20">

        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50">
              <div className="bg-[#050008] border border-emerald-500/30 rounded-3xl p-8 text-center">
                <motion.svg
                  className="w-16 h-16 mx-auto mb-4 text-emerald-400"
                  animate={{ scale: [0.8, 1.1, 1] }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </motion.svg>
                <h2 className="text-white text-2xl font-black mb-2">Published!</h2>
                <p className="text-white/50 text-sm">Redirecting to gallery...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-10">
          <Link href="/gallery"><p className="text-white/40 text-sm font-black mb-3 hover:text-white/60 transition">← Back to Gallery</p></Link>
          <h1 className="text-5xl font-black text-white mb-2">Upload Content</h1>
          <p className="text-white/40">Share 3D models, AR builds, or VR builds</p>
        </div>

        {/* Step 0 — Type selector */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-3xl border border-white/6 bg-white/[0.025] p-8 backdrop-blur-xl">
              <p className="text-white/50 text-xs font-black uppercase tracking-widest mb-6">What are you uploading?</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  { type: "model" as const,    title: "3D Model",    desc: "GLB, GLTF, OBJ, FBX, DWG, DXF", icon: "📦", color: "#a78bfa" },
                  { type: "ar-build" as const, title: "AR Build",    desc: "ZIP package only",               icon: "📱", color: "#34d399" },
                  { type: "vr-build" as const, title: "VR Build",    desc: "ZIP package only",               icon: "🥽", color: "#22d3ee" },
                ].map(({ type, title, desc, icon, color }) => (
                  <button key={type} onClick={() => { setUploadType(type); setStep(1); }}
                    className="p-6 rounded-2xl border-2 transition duration-300 text-center"
                    style={{ borderColor: uploadType === type ? color : "rgba(255,255,255,0.1)", background: uploadType === type ? `${color}10` : "rgba(255,255,255,0.02)" }}>
                    <p className="text-3xl mb-2">{icon}</p>
                    <p className="text-white font-black">{title}</p>
                    <p className="text-white/40 text-xs mt-1">{desc}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black transition duration-200">
                Next →
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 1 — File upload */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-3xl border border-white/6 bg-white/[0.025] p-8 backdrop-blur-xl">
              <div className="mb-6">
                <p className="text-white/50 text-xs font-black uppercase tracking-widest mb-4">STEP 1</p>
                <h2 className="text-3xl font-black text-white">Upload File</h2>
                {uploadType !== "model" && (
                  <p className="text-amber-300/70 text-xs mt-2 font-semibold">⚠ AR/VR builds must be a .zip file. Thumbnail is required.</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/20 rounded-2xl p-8 cursor-pointer hover:border-violet-500/50 transition duration-300 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept={uploadType === "model"
                      ? MODEL_EXTENSIONS.map((e) => `.${e}`).join(",")
                      : ".zip"
                    }
                  />
                  <svg className="w-12 h-12 mx-auto mb-3 text-violet-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {file ? (
                    <div>
                      <p className="text-emerald-400 font-black text-sm">{file.name}</p>
                      <p className="text-white/30 text-xs mt-1">{(file.size / (1024 * 1024)).toFixed(2)}MB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white/60 font-black text-sm">Click to upload</p>
                      <p className="text-white/30 text-xs mt-1">
                        {uploadType === "model" ? "GLB, GLTF, OBJ, FBX, DWG, DXF — max 500MB" : ".zip only — max 2GB"}
                      </p>
                    </div>
                  )}
                </div>

                <div onClick={() => thumbnailInputRef.current?.click()} className="border-2 border-dashed border-white/20 rounded-2xl p-8 cursor-pointer hover:border-cyan-500/50 transition duration-300 text-center flex flex-col items-center justify-center"
                  style={{ borderColor: uploadType !== "model" && !thumbnailPreview ? "rgba(251,191,36,0.3)" : undefined }}>
                  <input ref={thumbnailInputRef} type="file" onChange={handleThumbnailSelect} className="hidden" accept="image/*" />
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} className="w-full h-40 object-cover rounded-xl" alt="thumbnail" />
                  ) : (
                    <>
                      <svg className="w-12 h-12 mb-3 text-cyan-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-white/60 font-black text-sm">
                        Thumbnail {uploadType !== "model" ? <span className="text-amber-300">*Required</span> : "(Optional)"}
                      </p>
                      <p className="text-white/30 text-xs mt-1">max 5MB</p>
                    </>
                  )}
                </div>
              </div>
              {error && <p className="text-rose-400 text-sm mt-4 font-black">{error}</p>}
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-xl border border-white/12 text-white font-black transition duration-200 hover:border-white/25">← Back</button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!file || (uploadType !== "model" && !thumbnailUrl)}
                  className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black transition duration-200"
                >
                  Next →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2 — Details */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-3xl border border-white/6 bg-white/[0.025] p-8 backdrop-blur-xl space-y-5">
              <div>
                <p className="text-white/50 text-xs font-black uppercase tracking-widest mb-4">STEP 2</p>
                <h2 className="text-3xl font-black text-white">Details</h2>
              </div>

              <div>
                <label className="block text-white/70 text-xs font-black mb-2">Title *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder={uploadType === "model" ? "My 3D Model" : uploadType === "ar-build" ? "AR Game" : "VR Experience"}
                  className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50" />
              </div>

              <div>
                <label className="block text-white/70 text-xs font-black mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                  className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50" />
              </div>

              {uploadType === "model" ? (
                <div>
                  <label className="block text-white/70 text-xs font-black mb-2">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50">
                    <option value="">Select category</option>
                    {MODEL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 text-xs font-black mb-2">Version</label>
                      <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0"
                        className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50" />
                    </div>
                    <div>
                      <label className="block text-white/70 text-xs font-black mb-2">Genre *</label>
                      <select value={genre} onChange={(e) => setGenre(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50">
                        <option value="">Select genre</option>
                        {BUILD_GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/70 text-xs font-black mb-2">Platforms *</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {PLATFORMS.map((p) => (
                        <button key={p}
                          onClick={() => setPlatforms(platforms.includes(p) ? platforms.filter((x) => x !== p) : [...platforms, p])}
                          className={`p-2 rounded-lg font-black text-xs transition duration-200 border ${platforms.includes(p) ? "border-violet-500/50 bg-violet-600/20 text-violet-300" : "border-white/10 bg-white/[0.02] text-white/50"}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-white/70 text-xs font-black mb-3">Tags</label>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {tags.map((t) => (
                    <button key={t} onClick={() => setTags(tags.filter((x) => x !== t))}
                      className="px-3 py-1 rounded-lg text-xs font-black bg-violet-600/30 text-violet-300 hover:bg-rose-600/30 hover:text-rose-300 transition">
                      {t} ✕
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mb-2">
                  <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                    placeholder="Add tag..."
                    className="flex-1 bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 text-sm" />
                  <button onClick={handleAddTag} className="px-4 py-3 rounded-xl bg-violet-600/30 text-violet-300 font-black text-xs hover:bg-violet-600/50 transition">Add</button>
                </div>
                {AR_VR_TAGS.length > 0 && (
                  <p className="text-white/30 text-[10px]">Suggested: {AR_VR_TAGS.join(", ")}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-white/12 text-white font-black transition duration-200 hover:border-white/25">← Back</button>
                <button onClick={() => setStep(3)}
                  disabled={!title || (uploadType !== "model" && !genre) || (uploadType !== "model" && !platforms.length)}
                  className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black transition duration-200">
                  Next →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3 — Build specs (builds only) */}
        {step === 3 && uploadType !== "model" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-3xl border border-white/6 bg-white/[0.025] p-8 backdrop-blur-xl space-y-5">
              <div>
                <p className="text-white/50 text-xs font-black uppercase tracking-widest mb-4">STEP 3</p>
                <h2 className="text-3xl font-black text-white">Build Specs</h2>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Min RAM",     key: "ram",     placeholder: "2GB" },
                  { label: "Min Storage", key: "storage", placeholder: "100MB" },
                  { label: "Min OS",      key: "os",      placeholder: "Android 8.0+" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-white/70 text-xs font-black mb-2">{label}</label>
                    <input
                      value={minimumSpecs[key as keyof typeof minimumSpecs]}
                      onChange={(e) => setMinimumSpecs({ ...minimumSpecs, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-white/70 text-xs font-black mb-2">Changelog</label>
                <textarea value={changelog} onChange={(e) => setChangelog(e.target.value)}
                  placeholder="v1.0.0 - Initial release..." rows={3}
                  className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-white/12 text-white font-black transition duration-200 hover:border-white/25">← Back</button>
                <button onClick={() => setStep(4)} className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black transition duration-200">Next →</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Final step — Pricing & Publish */}
        {step === (uploadType === "model" ? 3 : 4) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-3xl border border-white/6 bg-white/[0.025] p-8 backdrop-blur-xl space-y-5">
              <div>
                <p className="text-white/50 text-xs font-black uppercase tracking-widest mb-4">FINAL STEP</p>
                <h2 className="text-3xl font-black text-white">Pricing & Publish</h2>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/8">
                <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} className="w-5 h-5" />
                <label className="text-white font-black text-sm">Make this paid</label>
              </div>

              {isPaid && (
                <div>
                  <label className="block text-white/70 text-xs font-black mb-2">Price (₹)</label>
                  <input type="number" value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} placeholder="99"
                    className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50" />
                </div>
              )}

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-amber-300/90 text-xs font-black mb-2">Summary</p>
                <p className="text-white/50 text-xs"><strong>Title:</strong> {title}</p>
                <p className="text-white/50 text-xs"><strong>Type:</strong> {uploadType === "model" ? "3D Model" : uploadType === "ar-build" ? "AR Build" : "VR Build"}</p>
                <p className="text-white/50 text-xs"><strong>Size:</strong> {file ? (file.size / (1024 * 1024)).toFixed(2) : 0}MB</p>
                <p className="text-white/50 text-xs"><strong>Storage:</strong> ✅ Cloudinary</p>
                <p className="text-white/50 text-xs"><strong>Price:</strong> {isPaid ? `₹${price}` : "Free"}</p>
              </div>

              {uploading && (
                <div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-2">
                    <motion.div animate={{ width: `${uploadProgress}%` }} className="h-full bg-gradient-to-r from-violet-600 to-cyan-600" />
                  </div>
                  <p className="text-white/50 text-xs text-center">{uploadProgress}%</p>
                </div>
              )}

              {error && <p className="text-rose-400 text-sm font-black">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep(uploadType === "model" ? 2 : 3)} disabled={uploading}
                  className="flex-1 py-3 rounded-xl border border-white/12 text-white font-black transition duration-200 hover:border-white/25 disabled:opacity-50">
                  ← Back
                </button>
                <button onClick={handlePublish} disabled={uploading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 disabled:opacity-50 text-white font-black transition duration-200">
                  {uploading ? "Publishing..." : "Publish →"}
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