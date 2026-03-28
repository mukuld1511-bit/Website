"use client";
import { useEffect, useState, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Footer from "../../components/Footer";

const AUTOCAD_EXTENSIONS = ["dwg", "dxf"];
const AUTOCAD_CATEGORIES = ["Floor Plan","Electrical","Structural","Mechanical","Site Plan","Elevation","Section","Detail","Isometric","Other"];

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

export default function AutoCADUploadPage() {
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1);
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
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  if (!user) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center font-sans">
      <div className="text-center bg-[#141420] p-10 rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-[#2A2A3E]">
        <h1 className="text-2xl font-black text-white mb-4">Sign in required</h1>
        <Link href="/login"><button className="px-8 py-4 rounded-2xl bg-[#5B4BDB] text-white font-black hover:bg-[#4c3ec7] border-b-4 border-[#4438b8] active:border-b-0 active:translate-y-[2px] shadow-lg transition-all text-sm uppercase tracking-wider">Sign in</button></Link>
      </div>
    </div>
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!AUTOCAD_EXTENSIONS.includes(ext ?? "")) { setError("Only .dwg or .dxf files allowed"); return; }
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
    if (!file || !title) { setError("Please fill all required fields."); return; }
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
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "dwg";
      await addDoc(collection(db, "models"), {
        title, description, category: category || "AutoCAD",
        fileType: ext, fileSize: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        modelUrl, thumbnailUrl, isPaid, price: isPaid ? price : 0,
        authorId: user.uid, authorName: userData.displayName || user.email, authorPhoto: userData.photoURL || "/avatar.png",
        tags, status: "published", uploadedAt: serverTimestamp(),
        storageProvider: "r2", engagementScore: 0, views: 0, likes: 0, downloads: 0,
      });
      setUploadProgress(100); setSuccess(true);
      setTimeout(() => { window.location.href = "/autocad"; }, 2000);
    } catch (e) { setError((e as Error).message); setUploading(false); setUploadStage(""); }
  };

  const inputCls = "w-full bg-[#0A0A0F] border border-[#2A2A3E] rounded-xl px-4 py-3 text-sm text-white placeholder-[#6B6B85] focus:outline-none focus:border-[#5B4BDB] focus:ring-1 focus:ring-[#5B4BDB] transition-all shadow-inner";

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans">
      <div className="max-w-2xl mx-auto px-4 py-14 flex-grow w-full">

        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="fixed inset-0 flex items-center justify-center z-50 bg-[#0A0A0F]/80 backdrop-blur-md">
              <div className="bg-[#141420] rounded-3xl p-10 text-center shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-[#2A2A3E] max-w-sm w-full mx-4">
                <div className="text-6xl mb-6 drop-shadow-lg">📐</div>
                <h2 className="text-2xl font-black text-white mb-2">Published!</h2>
                <p className="text-[#9494AD] font-bold text-sm">Redirecting to AutoCAD hub...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-10 text-center">
          <Link href="/autocad" className="inline-flex items-center gap-2 text-[#7C6EF6] hover:text-white text-sm font-bold mb-6 transition uppercase tracking-wide">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to AutoCAD Hub
          </Link>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#7C6EF6] bg-[#5B4BDB]/10 border border-[#5B4BDB]/30 px-3 py-1.5 rounded-full inline-flex items-center gap-2 shadow-sm glass-synthe">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C6EF6] animate-pulse" /> AutoCAD
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">Upload Drawing</h1>
          <p className="text-[#6B6B85] font-bold text-sm md:text-base">DWG or DXF files only — no size limit via Cloudflare R2</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center items-center gap-2 mb-10">
          {["Files", "Details", "Publish"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all shadow-md ${
                step > i + 1 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                : step === i + 1 ? "bg-[#5B4BDB] text-white shadow-[0_0_15px_rgba(91,75,219,0.5)] border border-[#7C6EF6]/50" 
                : "bg-[#141420] text-[#4A4A60] border border-[#2A2A3E]"
              }`}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={`text-sm font-bold uppercase tracking-wide hidden sm:block ${step === i + 1 ? "text-white" : "text-[#4A4A60]"}`}>{s}</span>
              {i < 2 && <div className={`flex-1 h-0.5 w-6 sm:w-10 rounded-full ${step > i + 1 ? "bg-emerald-500/30" : "bg-[#2A2A3E]"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#141420] rounded-3xl border border-[#2A2A3E] p-8 space-y-6 shadow-[0_4px_30px_rgba(0,0,0,0.4)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#5B4BDB]/10 rounded-full filter blur-[80px] z-0 pointer-events-none" />
            
            <h2 className="text-xl font-black text-white relative z-10 flex items-center gap-3">
              <span className="text-[#5B4BDB]">01</span> Upload files
            </h2>

            <div onClick={() => fileRef.current?.click()}
              className="relative z-10 border-2 border-dashed border-[#2A2A3E] bg-[#0A0A0F]/50 rounded-2xl p-10 cursor-pointer hover:border-[#5B4BDB] hover:bg-[#5B4BDB]/5 transition-all duration-300 text-center group">
              <input ref={fileRef} type="file" onChange={handleFile} className="hidden" accept=".dwg,.dxf" />
              <div className="w-16 h-16 rounded-2xl bg-[#141420] border border-[#2A2A3E] group-hover:border-[#5B4BDB]/50 flex items-center justify-center mx-auto mb-5 transition-colors shadow-inner">
                <span className="text-3xl opacity-80 group-hover:opacity-100 transition-opacity">📐</span>
              </div>
              {file ? (
                <div>
                  <p className="font-black text-white text-base mb-1">{file.name}</p>
                  <p className="text-xs font-bold text-[#5B4BDB] uppercase tracking-widest mt-2">{((file.size / (1024 * 1024))).toFixed(2)} MB · Cloudflare R2</p>
                </div>
              ) : (
                <div>
                  <p className="font-black text-white text-base mb-2">Select CAD file</p>
                  <p className="text-xs font-bold text-[#6B6B85] uppercase tracking-widest">DWG or DXF only · No limit</p>
                </div>
              )}
            </div>

            <div onClick={() => thumbRef.current?.click()}
              className="relative z-10 border-2 border-dashed border-[#2A2A3E] bg-[#0A0A0F]/50 rounded-2xl p-8 cursor-pointer hover:border-[#5B4BDB] hover:bg-[#5B4BDB]/5 transition-all duration-300 text-center group overflow-hidden">
              <input ref={thumbRef} type="file" onChange={handleThumb} className="hidden" accept="image/*" />
              {thumbnailPreview && <img src={thumbnailPreview} alt="thumb" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen" />}
              <div className="relative">
                <p className="font-black text-white text-sm mb-2">{thumbnail ? thumbnail.name : "Preview image (optional)"}</p>
                <p className="text-[10px] font-bold text-[#6B6B85] uppercase tracking-widest">PNG, JPG · Max 5MB</p>
              </div>
            </div>

            {error && <p className="text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">{error}</p>}

            <div className="flex justify-end pt-4 border-t border-[#2A2A3E]">
              <button onClick={() => setStep(2)} disabled={!file}
                className="px-8 py-4 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] border-b-4 border-[#4438b8] text-white font-black text-xs uppercase tracking-widest disabled:opacity-40 disabled:hover:bg-[#5B4BDB] disabled:border-b-4 transition-all active:translate-y-[2px] active:border-b-0 shadow-lg relative z-10">
                Continue →
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#141420] rounded-3xl border border-[#2A2A3E] p-8 space-y-6 shadow-[0_4px_30px_rgba(0,0,0,0.4)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-pink-500/5 rounded-full filter blur-[80px] z-0 pointer-events-none" />
            
            <h2 className="text-xl font-black text-white relative z-10 flex items-center gap-3">
              <span className="text-pink-500">02</span> Drawing details
            </h2>

            <div className="relative z-10 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-[#6B6B85] uppercase tracking-[0.2em] mb-2 pl-1">Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Modern Residential Floor Plan" className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#6B6B85] uppercase tracking-[0.2em] mb-2 pl-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe the drawing format, layers, scale..." className={inputCls + " resize-none"} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#6B6B85] uppercase tracking-[0.2em] mb-2 pl-1">Drawing category</label>
                <div className="relative">
                  <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls + " appearance-none cursor-pointer pr-10"}>
                    <option value="">Select category</option>
                    {AUTOCAD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <svg className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6B85] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[10px] font-black text-[#6B6B85] uppercase tracking-[0.2em] mb-2 pl-1">Tags (Press Enter)</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map(t => (
                    <button key={t} onClick={() => setTags(tags.filter(x => x !== t))}
                      className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#5B4BDB]/10 text-[#7C6EF6] border border-[#5B4BDB]/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition shadow-sm glass-synthe">
                      {t} <span className="opacity-60 ml-1">✕</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (tagInput.trim() && !tags.includes(tagInput.trim())) { setTags([...tags, tagInput.trim()]); setTagInput(""); } } }}
                    placeholder="E.g. architecture, 2d, residential..." className={inputCls + " flex-1"} />
                  <button onClick={() => { if (tagInput.trim() && !tags.includes(tagInput.trim())) { setTags([...tags, tagInput.trim()]); setTagInput(""); } }}
                    className="px-6 py-3 rounded-xl bg-[#2A2A3E] text-white font-black text-xs uppercase tracking-widest hover:bg-[#3A3A52] transition shadow-sm">
                    Add
                  </button>
                </div>
              </div>

              {/* Pricing */}
              <div className="pt-4 border-t border-[#2A2A3E]">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#0A0A0F] border border-[#2A2A3E] cursor-pointer hover:border-[#5B4BDB]/50 transition shadow-inner group" onClick={() => setIsPaid(!isPaid)}>
                  <div className={`w-6 h-6 rounded flex flex-shrink-0 items-center justify-center transition-colors border ${isPaid ? 'bg-emerald-500 border-emerald-500' : 'bg-[#141420] border-[#4A4A60] group-hover:border-[#5B4BDB]'}`}>
                    {isPaid && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div>
                    <p className="font-black text-white text-sm">Sell this drawing (Paid Listing)</p>
                    <p className="text-xs font-bold text-[#6B6B85] mt-0.5">Earn 85% on every download</p>
                  </div>
                </div>
                {isPaid && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-4">
                    <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2 pl-1">Price (₹ INR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-base">₹</span>
                      <input type="number" value={price || ""} onChange={e => setPrice(parseFloat(e.target.value) || 0)} placeholder="199" min="0" className={inputCls + " pl-10 border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20 bg-emerald-500/5"} />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-between pt-6 border-t border-[#2A2A3E] relative z-10">
              <button onClick={() => setStep(1)} className="px-6 py-4 rounded-xl border border-[#2A2A3E] text-[#9494AD] font-black text-xs uppercase tracking-widest hover:bg-[#2A2A3E] hover:text-white transition shadow-sm">← Back</button>
              <button onClick={() => setStep(3)} disabled={!title || (isPaid && price <= 0)}
                className="px-8 py-4 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] border-b-4 border-[#4438b8] text-white font-black text-xs uppercase tracking-widest disabled:opacity-40 disabled:hover:bg-[#5B4BDB] disabled:border-b-4 transition-all active:translate-y-[2px] active:border-b-0 shadow-lg">
                Continue →
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3 — Publish */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#141420] rounded-3xl border border-[#2A2A3E] p-8 space-y-6 shadow-[0_4px_30px_rgba(0,0,0,0.4)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full filter blur-[80px] z-0 pointer-events-none" />
            
            <h2 className="text-xl font-black text-white relative z-10 flex items-center gap-3">
              <span className="text-emerald-500">03</span> Review & Publish
            </h2>

            <div className="bg-[#0A0A0F] border border-[#2A2A3E] rounded-2xl p-6 space-y-4 shadow-inner relative z-10">
              {[
                { label: "Title",   value: title, color: "text-[#5B4BDB]" },
                { label: "File",    value: `${file?.name} · ${(file!.size/(1024*1024)).toFixed(2)} MB`, color: "text-[#6B6B85]" },
                { label: "Type",    value: file?.name.split(".").pop()?.toUpperCase(), color: "text-[#6B6B85]" },
                { label: "Storage", value: "Cloudflare R2", color: "text-[#6B6B85]" },
                { label: "Listing", value: isPaid ? `₹${price} (Paid)` : "Free", color: isPaid ? "text-emerald-400" : "text-[#9494AD]" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-sm py-1 border-b border-[#2A2A3E]/50 last:border-0 items-center">
                  <span className="text-[#6B6B85] font-black uppercase tracking-widest text-[10px]">{label}</span>
                  <span className={`font-black text-right max-w-[60%] truncate ${color}`}>{value}</span>
                </div>
              ))}
            </div>

            {error && <p className="text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">{error}</p>}

            {uploading && (
              <div className="space-y-3 p-5 rounded-2xl bg-[#0A0A0F] border border-[#2A2A3E] shadow-inner relative z-10">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                  <span className="text-[#5B4BDB] animate-pulse">{uploadStage}</span>
                  <span className="text-white">{uploadProgress}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-[#141420] overflow-hidden border border-[#2A2A3E]">
                  <motion.div animate={{ width: `${uploadProgress}%` }} className="h-full bg-gradient-to-r from-[#5B4BDB] to-[#7C6EF6] rounded-full shadow-[0_0_10px_rgba(91,75,219,0.5)]" />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-between pt-6 border-t border-[#2A2A3E] relative z-10">
              <button onClick={() => setStep(2)} disabled={uploading} className="px-6 py-4 rounded-xl border border-[#2A2A3E] text-[#9494AD] font-black text-xs uppercase tracking-widest hover:bg-[#2A2A3E] hover:text-white transition shadow-sm disabled:opacity-40">← Back</button>
              <button onClick={handlePublish} disabled={uploading}
                className="px-10 py-4 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] border-b-4 border-[#4438b8] text-white font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:border-b-4 transition-all active:translate-y-[2px] active:border-b-0 shadow-[0_0_20px_rgba(91,75,219,0.4)]">
                {uploading ? "Publishing..." : "Launch to Hub 🚀"}
              </button>
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}