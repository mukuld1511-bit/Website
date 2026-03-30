"use client";

import { useState, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { uploadToSupabase } from "@/lib/supabase";
import type { User } from "firebase/auth";
import type { AccessType, FileType } from "@/types/gallery";

const ACCEPTED_TYPES = ".glb,.gltf,.obj,.fbx,.dwg,.dxf";
const CATEGORIES = ["Architecture", "Mechanical", "Character", "Environment", "Product", "AutoCAD", "Other"];

type UploadStep = 1 | 2 | 3 | 4;

interface UploadForm {
  title: string; description: string; category: string; tags: string;
  polygons: string; isPaid: boolean; price: string; accessType: AccessType; license: string;
}

interface UploadModelProps { user: User; onClose: () => void; onUploaded?: () => void; }

export default function UploadModel({ user, onClose, onUploaded }: UploadModelProps) {
  const [step, setStep] = useState<UploadStep>(1);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<UploadForm>({
    title: "", description: "", category: "Architecture",
    tags: "", polygons: "", isPaid: false, price: "",
    accessType: "purchase", license: "standard",
  });

  function setF<K extends keyof UploadForm>(key: K, val: UploadForm[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function handleModelFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) { setError("Unsupported file type."); return; }
    setModelFile(file); setError(null); setStep(2);
  }

  function handleThumbnail(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }

  async function handleUpload() {
    if (!modelFile || !form.title) return;
    setUploading(true); setError(null);
    try {
      // 1. Upload Model via direct REST API (no JWT)
      const safeName = modelFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const modelPath = `${user.uid}/${Date.now()}_${safeName}`;
      const modelUrl = await uploadToSupabase("models", modelPath, modelFile, setProgress);

      setProgress(50);

      // 2. Upload Thumbnail
      let thumbnailUrl = "";
      if (thumbnailFile) {
        const safeThumbName = thumbnailFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const thumbPath = `${user.uid}/${Date.now()}_thumb_${safeThumbName}`;
        thumbnailUrl = await uploadToSupabase("thumbnails", thumbPath, thumbnailFile);
      }

      setProgress(85);

      setProgress(95);
      const fileExt = modelFile.name.split(".").pop()?.toLowerCase() as FileType;
      await addDoc(collection(db, "models"), {
        title: form.title, description: form.description, category: form.category,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        polygons: form.polygons || null, fileType: fileExt, modelUrl, thumbnailUrl,
        isPaid: form.isPaid, price: form.isPaid ? parseFloat(form.price) || 0 : 0,
        accessType: form.isPaid ? form.accessType : "free", license: form.license,
        authorId: user.uid, authorName: user.displayName ?? "Unknown",
        authorPhoto: user.photoURL ?? "", views: 0, likes: 0, downloads: 0,
        status: "published", uploadedAt: serverTimestamp(),
      });

      setProgress(100); setStep(4); onUploaded?.();
    } catch (e: unknown) {
      console.error("Supabase Upload Error:", e);
      setError("Upload failed: " + (e instanceof Error ? e.message : String(e)));
    }
    setUploading(false);
  }

  const inputCls = "w-full bg-[#1A1A2E]/50 backdrop-blur-md border border-white/5 rounded-2xl px-5 py-3.5 text-white text-sm outline-none focus:border-[#5B4BDB]/50 focus:bg-[#1A1A2E]/80 focus:ring-4 focus:ring-[#5B4BDB]/10 transition duration-300 placeholder-[#6B6B85] shadow-inner";
  const pillCls = (active: boolean, color = "blue") =>
    `py-3.5 rounded-2xl font-bold text-sm border transition-all ${active
      ? "bg-[#5B4BDB] border-[#4438b8] text-white shadow-[0_0_15px_rgba(91,75,219,0.3)]"
      : "bg-[#1A1A2E]/50 border-white/5 text-[#9494AD] hover:border-white/20 hover:text-white"}`;

  const steps = ["Select File", "Details", "Pricing", "Done!"];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-xl" onClick={onClose} />

        <motion.div
          className="relative z-10 w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-[#141420]/80 backdrop-blur-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden"
          initial={{ scale: 0.9, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/5 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#5B4BDB]/5 to-transparent pointer-events-none" />
            <div className="flex items-start justify-between mb-5 relative z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A594FF] mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BDB] animate-pulse"/>
                  Upload to Synthe
                </p>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {steps[(step - 1)]}
                </h2>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl border border-white/10 bg-white/5 text-[#9494AD] hover:text-white hover:bg-white/10 hover:border-white/20 shadow-sm transition-all flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step indicators */}
            {step < 4 && (
              <div className="flex gap-2 relative z-10">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="relative h-1.5 flex-1 rounded-full bg-[#1A1A2E]/50 border border-white/5 overflow-hidden shadow-inner">
                    <motion.div
                      animate={{ width: s <= step ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0 rounded-full bg-[#5B4BDB] shadow-[0_0_10px_rgba(91,75,219,0.8)]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-8 py-7 max-h-[70vh] overflow-y-auto scrollbar-hide bg-transparent relative">
            <AnimatePresence mode="wait">

              {/* STEP 1 — file drop */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-white/10 bg-[#1A1A2E]/30 hover:bg-[#5B4BDB]/5 hover:border-[#5B4BDB]/40 rounded-3xl p-14 text-center cursor-pointer transition-all duration-300 group flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(91,75,219,0.05)_0%,transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} onChange={handleModelFile} className="hidden" />
                    <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:border-[#5B4BDB]/40 group-hover:bg-[#5B4BDB]/20 group-hover:shadow-[0_0_20px_rgba(91,75,219,0.3)] transition-all duration-300 relative z-10">
                      <svg className="w-8 h-8 text-[#6B6B85] group-hover:text-[#A594FF] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <p className="text-white font-black text-lg mb-2 group-hover:text-[#A594FF] transition-colors relative z-10">Drop your 3D file here</p>
                    <p className="text-[#6B6B85] font-bold text-xs uppercase tracking-widest relative z-10">GLB · GLTF · OBJ · FBX · DWG · DXF</p>
                    
                    {error && (
                      <div className="mt-6 relative z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 2 — details */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-[#A594FF] border border-[#5B4BDB]/30 bg-[#5B4BDB]/10 px-2.5 py-1 rounded-md shadow-[0_0_10px_rgba(91,75,219,0.2)] font-black uppercase tracking-widest inline-flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {modelFile?.name}
                    </p>
                  </div>

                  {/* Thumbnail */}
                  <div
                    onClick={() => thumbRef.current?.click()}
                    className="relative aspect-video rounded-2xl border-2 border-dashed border-white/10 bg-[#1A1A2E]/30 hover:bg-[#5B4BDB]/5 hover:border-[#5B4BDB]/40 overflow-hidden cursor-pointer transition-all duration-300 flex items-center justify-center group"
                  >
                    <input ref={thumbRef} type="file" accept="image/*" onChange={handleThumbnail} className="hidden" />
                    {thumbnailPreview
                      ? <img src={thumbnailPreview} className="w-full h-full object-cover" alt="thumb" />
                      : <div className="text-center">
                          <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:border-[#5B4BDB]/40 group-hover:bg-[#5B4BDB]/20 transition-all duration-300">
                            <svg className="w-5 h-5 text-[#6B6B85] group-hover:text-[#A594FF] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-[#6B6B85] font-bold text-xs uppercase tracking-widest group-hover:text-[#A594FF] transition">Add Thumbnail Image</p>
                        </div>
                    }
                  </div>

                  <div className="space-y-4">
                    <input value={form.title} onChange={(e) => setF("title", e.target.value)} placeholder="Model Title *" className={inputCls} />
                    <textarea value={form.description} onChange={(e) => setF("description", e.target.value)} rows={3} placeholder="Description (Optional)" className={inputCls + " resize-none"} />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <select value={form.category} onChange={(e) => setF("category", e.target.value)} className={inputCls + " appearance-none cursor-pointer pr-10 bg-[#1A1A2E]"}>
                          {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#101015] text-white">{c}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6B85] pointer-events-none">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <input value={form.polygons} onChange={(e) => setF("polygons", e.target.value)} placeholder="Polygons (e.g. 15k)" className={inputCls} />
                    </div>
                    
                    <input value={form.tags} onChange={(e) => setF("tags", e.target.value)} placeholder="Tags — separated by commas" className={inputCls} />
                  </div>

                  <button
                    onClick={() => setStep(3)}
                    disabled={!form.title}
                    className="w-full py-4 rounded-xl font-black text-white text-sm bg-[#5B4BDB] hover:bg-[#4c3ec7] disabled:opacity-40 transition-all border-b-[3px] border-[#4438b8] active:border-b-0 active:translate-y-[3px] mt-4 shadow-[0_0_20px_rgba(91,75,219,0.3)]"
                  >
                    Continue →
                  </button>
                </motion.div>
              )}

              {/* STEP 3 — pricing */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-6">

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6B6B85] mb-3 block border-b border-white/5 pb-2">Pricing Structure</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => { setF("isPaid", false); setF("price", ""); }} className={pillCls(!form.isPaid, "gray")}>
                        🔓 Free Access
                      </button>
                      <button onClick={() => setF("isPaid", true)} className={pillCls(form.isPaid, "green")}>
                        💰 Paid Model
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {form.isPaid && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6 overflow-hidden"
                      >
                        <div className="pt-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6B6B85] mb-3 block border-b border-white/5 pb-2">Set Price</p>
                          <div className="relative flex items-center">
                            <span className="absolute left-5 text-[#9494AD] font-black text-lg">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={form.price}
                              onChange={(e) => setF("price", e.target.value)}
                              placeholder="0.00"
                              className="w-full border border-white/10 bg-[#1A1A2E]/50 rounded-2xl py-4 pl-10 pr-4 text-white text-xl font-black placeholder-[#6B6B85] outline-none focus:border-[#5B4BDB]/50 focus:bg-[#1A1A2E]/80 focus:ring-4 focus:ring-[#5B4BDB]/10 transition duration-300 shadow-inner"
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6B6B85] mb-3 block border-b border-white/5 pb-2">Access Type</p>
                          <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setF("accessType", "purchase")} className={pillCls(form.accessType === "purchase", "indigo")}>
                              Instant Purchase
                            </button>
                            <button onClick={() => setF("accessType", "request")} className={pillCls(form.accessType === "request", "indigo")}>
                              Request Access
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold shadow-sm mt-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <div className="mt-8 pt-4 border-t border-white/5">
                    <button
                      onClick={handleUpload}
                      disabled={uploading || (form.isPaid && !form.price) || (form.isPaid && parseFloat(form.price) <= 0)}
                      className="relative w-full py-4 rounded-xl font-black text-white text-sm bg-[#5B4BDB] hover:bg-[#4c3ec7] disabled:opacity-40 transition-all border-b-[3px] border-[#4438b8] active:border-b-0 active:translate-y-[3px] shadow-[0_0_20px_rgba(91,75,219,0.3)] overflow-hidden flex items-center justify-center gap-2"
                    >
                      {uploading && (
                        <div className="absolute inset-y-0 left-0 bg-white/20 backdrop-blur-sm" style={{ width: `${progress}%`, transition: 'width 0.2s ease-out' }} />
                      )}
                      
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {uploading ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Uploading... {progress}%
                          </>
                        ) : "🚀 Publish Model"}
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4 — done */}
              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center py-12">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="w-24 h-24 rounded-full border border-[#5B4BDB]/30 bg-[#5B4BDB]/10 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(91,75,219,0.3)]"
                  >
                    <svg className="w-12 h-12 text-[#A594FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Model Published!</h3>
                  <p className="text-[#9494AD] font-medium text-sm mb-8">Your 3D model is now live in the Synthe Gallery.</p>
                  <button
                    onClick={onClose}
                    className="px-8 py-3.5 rounded-xl font-bold text-white text-sm bg-[#1A1A2E]/50 border border-white/10 hover:bg-[#5B4BDB] hover:border-[#5B4BDB] shadow-sm transition-all"
                  >
                    Back to Gallery →
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}