"use client";
import { useEffect, useState, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Footer from "../../../components/Footer";

// This file is used for BOTH AR and VR — mode is passed via props or detected from pathname
// Drop at: app/xr-zone/ar/upload/page.tsx  AND  app/xr-zone/vr/upload/page.tsx
// Change the `DEFAULT_MODE` constant accordingly

const DEFAULT_MODE: "AR" | "VR" = "VR"; // ← change to "VR" for VR upload page

const PLATFORMS = ["Windows", "Android", "iOS", "macOS", "Linux", "WebGL"];
const AR_GENRES = ["Professional", "Utility", "Education", "Industrial", "AR Tool", "Simulation", "Enterprise"];
const VR_GENRES = ["VR Showcase", "Simulation", "Professional", "Education", "Enterprise", "Utility"];

async function uploadToR2(file: File, userId: string, onProgress?: (pct: number) => void): Promise<string> {
  const res = await fetch("/api/r2-presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, fileType: file.type || "application/octet-stream", userId }),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to get upload URL"); }
  const { presignedUrl, publicUrl } = await res.json();
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = e => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => xhr.status === 200 ? resolve() : reject(new Error("Upload failed"));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
  return publicUrl;
}

async function uploadThumbnailToSupabase(file: File, userId: string): Promise<string> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `thumbs/${userId}/${Date.now()}_${safeName}`;
  const { error } = await supabase.storage.from("models").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from("models").getPublicUrl(path).data.publicUrl;
}

export default function XRUploadPage() {
  const mode = DEFAULT_MODE;
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [minimumSpecs, setMinimumSpecs] = useState({ ram: "2GB", storage: "100MB", os: mode === "AR" ? "Android 8.0+" : "Windows 10" });
  const [changelog, setChangelog] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  if (!user) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center font-sans">
      <div className="text-center bg-white/5 border border-white/10 p-10 rounded-2xl">
        <h1 className="text-2xl font-black text-white mb-4">Sign in required</h1>
        <Link href="/login"><button className="px-8 py-3.5 rounded-xl bg-white text-white font-bold">Sign in</button></Link>
      </div>
    </div>
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "zip") { setError("XR builds must be uploaded as a .zip file"); return; }
    setFile(f); setError("");
  };

  const handleThumb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Thumbnail must be an image"); return; }
    if (f.size > 5 * 1024 * 1024) { setError("Thumbnail must be under 5MB"); return; }
    setThumbnail(f); setError("");
    const reader = new FileReader();
    reader.onload = ev => setThumbnailPreview(ev.target?.result as string ?? "");
    reader.readAsDataURL(f);
  };

  const handlePublish = async () => {
    if (!file || !title || !genre || !platforms.length) { setError("Please fill all required fields and select platforms."); return; }
    setUploading(true); setUploadProgress(0); setError("");
    try {
      setUploadStage("Uploading to Cloudflare R2...");
      const modelUrl = await uploadToR2(file, user.uid, pct => setUploadProgress(Math.round(pct * 0.7)));
      let thumbnailUrl = "";
      if (thumbnail) {
        setUploadStage("Uploading thumbnail..."); setUploadProgress(70);
        thumbnailUrl = await uploadThumbnailToSupabase(thumbnail, user.uid);
        setUploadProgress(85);
      }
      setUploadStage("Saving to database..."); setUploadProgress(90);
      const { doc: dbDoc, getDoc } = await import("firebase/firestore");
      const userSnap = await getDoc(dbDoc(db, "users", user.uid));
      const userData = userSnap.exists() ? userSnap.data() : { displayName: "Anonymous", photoURL: "" };
      await addDoc(collection(db, "models"), {
        title, description, genre, version, platforms, minimumSpecs, changelog,
        category: mode === "AR" ? "AR Build" : "VR Build",
        fileType: "build",
        fileSize: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        modelUrl, thumbnailUrl, isPaid, price: isPaid ? price : 0,
        authorId: user.uid, authorName: userData.displayName || user.email, authorPhoto: userData.photoURL || "/avatar.png",
        tags, status: "published", uploadedAt: serverTimestamp(),
        storageProvider: "r2", engagementScore: 0, views: 0, likes: 0, downloads: 0,
      });
      setUploadProgress(100); setSuccess(true);
      setTimeout(() => { window.location.href = "/xr-zone"; }, 2000);
    } catch (e) { setError((e as Error).message); setUploading(false); setUploadStage(""); }
  };

  const accentColor = mode === "AR" ? "teal" : "violet";
  const accentClass = mode === "AR" ? "bg-teal-500 hover:bg-teal-400 border-teal-700" : "bg-violet-600 hover:bg-violet-500 border-violet-800";
  const genres = mode === "AR" ? AR_GENRES : VR_GENRES;
  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors";

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans">      <div className="max-w-2xl mx-auto px-4 py-14 flex-grow w-full">

        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
              <div className="bg-gray-900 border border-white/10 rounded-3xl p-10 text-center max-w-sm w-full mx-4">
                <div className="text-6xl mb-4">{mode === "AR" ? "📱" : "🥽"}</div>
                <h2 className="text-2xl font-black text-white mb-2">Published!</h2>
                <p className="text-gray-400 text-sm">Redirecting to XR Zone...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-8">
          <Link href="/xr-zone" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-200 text-sm font-semibold mb-5 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to XR Zone
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${mode === "AR" ? "text-teal-400 bg-teal-500/10 border-teal-500/20" : "text-violet-400 bg-violet-500/10 border-violet-500/20"}`}>
              {mode === "AR" ? "📱 AR Upload" : "🥽 VR Upload"}
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mb-1">Upload {mode} Project</h1>
          <p className="text-gray-500 text-sm">ZIP package only — no size limit via Cloudflare R2</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {["Files", "Details", "Specs", "Publish"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-white text-white" : "bg-white/10 text-gray-500"}`}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={`text-sm font-semibold ${step === i + 1 ? "text-white" : "text-gray-600"}`}>{s}</span>
              {i < 3 && <div className="flex-1 h-px bg-white/10 w-6" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Files */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5">
            <h2 className="text-lg font-black text-white">Upload files</h2>

            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-xl p-8 cursor-pointer hover:border-white/30 hover:bg-white/5 transition-all text-center group">
              <input ref={fileRef} type="file" onChange={handleFile} className="hidden" accept=".zip" />
              <div className="w-12 h-12 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center mx-auto mb-3 transition-colors">
                <span className="text-2xl">{mode === "AR" ? "📱" : "🥽"}</span>
              </div>
              {file ? (
                <div>
                  <p className="font-bold text-white text-sm">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB · Cloudflare R2</p>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-white text-sm mb-1">Upload {mode} build (.zip)</p>
                  <p className="text-xs text-gray-500">ZIP packages only · No size limit</p>
                </div>
              )}
            </div>

            <div onClick={() => thumbRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-xl p-6 cursor-pointer hover:border-white/30 hover:bg-white/5 transition-all text-center group relative overflow-hidden">
              <input ref={thumbRef} type="file" onChange={handleThumb} className="hidden" accept="image/*" />
              {thumbnailPreview && <img src={thumbnailPreview} alt="thumb" className="absolute inset-0 w-full h-full object-cover opacity-10" />}
              <div className="relative">
                <p className="font-bold text-white text-sm mb-1">{thumbnail ? thumbnail.name : "Upload thumbnail"}</p>
                <p className="text-xs text-gray-500">PNG, JPG · Max 5MB</p>
              </div>
            </div>

            {error && <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3">{error}</p>}

            <div className="flex justify-end">
              <button onClick={() => setStep(2)} disabled={!file}
                className={`px-8 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all border-b-[3px] active:translate-y-[1px] ${accentClass}`}>
                Continue →
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2 — Details */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5">
            <h2 className="text-lg font-black text-white">Project details</h2>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder={`e.g. ${mode === "AR" ? "AR Interior Designer" : "VR Training Simulator"}`} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe your project..." className={inputCls + " resize-none"} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Genre *</label>
              <div className="flex flex-wrap gap-2">
                {genres.map(g => (
                  <button key={g} onClick={() => setGenre(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${genre === g ? (mode === "AR" ? "bg-teal-500 border-teal-600 text-white" : "bg-violet-600 border-violet-700 text-white") : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Version</label>
              <input value={version} onChange={e => setVersion(e.target.value)} placeholder="1.0.0" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Supported Platforms *</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button key={p} onClick={() => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${platforms.includes(p) ? "bg-white text-white border-white" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(t => (
                  <button key={t} onClick={() => setTags(tags.filter(x => x !== t))}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/10 text-gray-300 hover:bg-red-900/30 hover:text-red-400 transition">
                    {t} ✕
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (tagInput.trim() && !tags.includes(tagInput.trim())) { setTags([...tags, tagInput.trim()]); setTagInput(""); } } }}
                  placeholder="Add tag, press Enter" className={inputCls + " flex-1"} />
                <button onClick={() => { if (tagInput.trim() && !tags.includes(tagInput.trim())) { setTags([...tags, tagInput.trim()]); setTagInput(""); } }}
                  className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-gray-300 font-bold text-sm hover:bg-white/20 transition">
                  Add
                </button>
              </div>
            </div>

            {/* Pricing */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-white/20 transition" onClick={() => setIsPaid(!isPaid)}>
                <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} onClick={e => e.stopPropagation()} className="w-4 h-4" />
                <p className="font-bold text-white text-sm">Sell this project (paid listing)</p>
              </div>
              {isPaid && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-3">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Price (₹ INR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                    <input type="number" value={price || ""} onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                      placeholder="499" min="0" className={inputCls + " pl-8"} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">You keep 85% — SYNTHÉ takes 15%</p>
                </motion.div>
              )}
            </div>

            <div className="flex gap-3 justify-between pt-2">
              <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 font-bold text-sm hover:bg-white/5 transition">← Back</button>
              <button onClick={() => setStep(3)} disabled={!title || !genre || !platforms.length || (isPaid && price <= 0)}
                className={`px-8 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all border-b-[3px] active:translate-y-[1px] ${accentClass}`}>
                Continue →
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3 — Specs */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5">
            <h2 className="text-lg font-black text-white">Minimum specifications</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "RAM",     key: "ram",     placeholder: "e.g. 4GB" },
                { label: "Storage", key: "storage", placeholder: "e.g. 500MB" },
                { label: "OS",      key: "os",      placeholder: "e.g. Android 10+" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{label}</label>
                  <input value={minimumSpecs[key as keyof typeof minimumSpecs]}
                    onChange={e => setMinimumSpecs({ ...minimumSpecs, [key]: e.target.value })}
                    placeholder={placeholder} className={inputCls} />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Release notes</label>
              <textarea value={changelog} onChange={e => setChangelog(e.target.value)} rows={3}
                placeholder="What's new in this version?" className={inputCls + " resize-none"} />
            </div>
            <div className="flex gap-3 justify-between pt-2">
              <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 font-bold text-sm hover:bg-white/5 transition">← Back</button>
              <button onClick={() => setStep(4)}
                className={`px-8 py-3 rounded-xl text-white font-bold text-sm transition-all border-b-[3px] active:translate-y-[1px] ${accentClass}`}>
                Continue →
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4 — Publish */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-5">
            <h2 className="text-lg font-black text-white">Review & publish</h2>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
              {[
                { label: "Title",     value: title },
                { label: "Mode",      value: `${mode} Build` },
                { label: "Genre",     value: genre },
                { label: "Platforms", value: platforms.join(", ") },
                { label: "File",      value: `${file?.name} · ${(file!.size/(1024*1024)).toFixed(2)} MB` },
                { label: "Storage",   value: "Cloudflare R2" },
                { label: "Listing",   value: isPaid ? `₹${price} (paid)` : "Free" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">{label}</span>
                  <span className="font-bold text-white text-right max-w-[60%] truncate">{value}</span>
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-3">{error}</p>}

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className={mode === "AR" ? "text-teal-400" : "text-violet-400"}>{uploadStage}</span>
                  <span className="text-gray-400">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div animate={{ width: `${uploadProgress}%` }}
                    className={`h-full rounded-full ${mode === "AR" ? "bg-teal-500" : "bg-violet-500"}`} />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-between pt-2">
              <button onClick={() => setStep(3)} disabled={uploading} className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 font-bold text-sm hover:bg-white/5 transition disabled:opacity-40">← Back</button>
              <button onClick={handlePublish} disabled={uploading}
                className={`px-10 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-all border-b-[3px] active:translate-y-[1px] ${accentClass}`}>
                {uploading ? "Publishing..." : `Publish to XR Zone`}
              </button>
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}