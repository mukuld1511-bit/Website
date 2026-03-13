"use client";

import { useState, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { supabase } from "@/lib/supabase";
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
      // 1. Upload Model to Supabase
      const safeName = modelFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const modelPath = `${user.uid}/${Date.now()}_${safeName}`;
      const { error: modelError } = await supabase.storage
        .from("models")
        .upload(modelPath, modelFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (modelError) throw new Error("Model upload failed: " + modelError.message);
      
      const { data: { publicUrl: modelUrl } } = supabase.storage
        .from("models")
        .getPublicUrl(modelPath);

      setProgress(50);

      // 2. Upload Thumbnail to Supabase
      let thumbnailUrl = "";
      if (thumbnailFile) {
        const safeThumbName = thumbnailFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const thumbPath = `${user.uid}/${Date.now()}_thumb_${safeThumbName}`;
        const { error: thumbError } = await supabase.storage
          .from("thumbnails")
          .upload(thumbPath, thumbnailFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (thumbError) throw new Error("Thumbnail upload failed: " + thumbError.message);

        const { data: { publicUrl: tUrl } } = supabase.storage
          .from("thumbnails")
          .getPublicUrl(thumbPath);
          
        thumbnailUrl = tUrl;
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

  const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10 transition duration-200 placeholder:text-gray-400 font-medium shadow-inner";
  const pillCls = (active: boolean, color = "blue") =>
    `py-3 rounded-xl font-extrabold text-sm border shadow-sm transition duration-200 ${active
      ? color === "cyan" ? "bg-cyan-50 border-cyan-200 text-cyan-700" : "bg-blue-50 border-blue-200 text-blue-700"
      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`;

  const steps = ["Select File", "Details", "Pricing", "Done!"];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative z-10 w-full max-w-lg rounded-[2rem] border border-gray-200 bg-white shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mb-1.5">Upload to Gallery</p>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  {steps[(step - 1)]}
                </h2>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-50 shadow-sm transition duration-200 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step indicators */}
            {step < 4 && (
              <div className="flex gap-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="relative h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden shadow-inner">
                    <motion.div
                      animate={{ width: s <= step ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0 rounded-full bg-blue-600"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-8 py-7 max-h-[70vh] overflow-y-auto bg-white">
            <AnimatePresence mode="wait">

              {/* STEP 1 — file drop */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 hover:shadow-inner rounded-3xl p-14 text-center cursor-pointer transition duration-200 group flex flex-col items-center justify-center min-h-[300px]"
                  >
                    <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} onChange={handleModelFile} className="hidden" />
                    <div className="w-16 h-16 rounded-2xl border border-gray-200 bg-white flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:border-blue-200 group-hover:bg-blue-100 transition duration-200">
                      <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <p className="text-gray-900 font-extrabold text-lg mb-2 group-hover:text-blue-700 transition">Drop your 3D file here</p>
                    <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">GLB · GLTF · OBJ · FBX · DWG · DXF</p>
                    
                    {error && (
                      <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-bold shadow-sm">
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
                    <p className="text-[10px] text-blue-600 border border-blue-200 bg-blue-50 px-2.5 py-1 rounded-md shadow-sm font-black uppercase tracking-widest inline-flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {modelFile?.name}
                    </p>
                  </div>

                  {/* Thumbnail */}
                  <div
                    onClick={() => thumbRef.current?.click()}
                    className="relative aspect-video rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 hover:shadow-inner overflow-hidden cursor-pointer transition duration-200 flex items-center justify-center group"
                  >
                    <input ref={thumbRef} type="file" accept="image/*" onChange={handleThumbnail} className="hidden" />
                    {thumbnailPreview
                      ? <img src={thumbnailPreview} className="w-full h-full object-cover" alt="thumb" />
                      : <div className="text-center">
                          <div className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:border-blue-200 group-hover:bg-blue-100 transition duration-200">
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest group-hover:text-blue-600 transition">Add Thumbnail Image</p>
                        </div>
                    }
                  </div>

                  <div className="space-y-4">
                    <input value={form.title} onChange={(e) => setF("title", e.target.value)} placeholder="Model Title *" className={inputCls} />
                    <textarea value={form.description} onChange={(e) => setF("description", e.target.value)} rows={3} placeholder="Description (Optional)" className={inputCls + " resize-none"} />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <select value={form.category} onChange={(e) => setF("category", e.target.value)} className={inputCls + " appearance-none cursor-pointer pr-10"}>
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
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
                    className="w-full py-4 rounded-xl font-extrabold text-white text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition shadow-sm mt-4"
                  >
                    Continue →
                  </button>
                </motion.div>
              )}

              {/* STEP 3 — pricing */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-6">

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 block border-b border-gray-100 pb-2">Pricing Structure</p>
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
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 block border-b border-gray-100 pb-2">Set Price</p>
                          <div className="relative flex items-center">
                            <span className="absolute left-5 text-gray-500 font-black text-lg">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={form.price}
                              onChange={(e) => setF("price", e.target.value)}
                              placeholder="0.00"
                              className="w-full border-2 border-green-200 bg-green-50 rounded-xl py-4 pl-10 pr-4 text-green-800 text-xl font-black placeholder-green-300 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-500/10 transition duration-200 shadow-inner"
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 block border-b border-gray-100 pb-2">Access Type</p>
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
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-bold shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <div className="mt-8 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleUpload}
                      disabled={uploading || (form.isPaid && !form.price) || (form.isPaid && parseFloat(form.price) <= 0)}
                      className="relative w-full py-4 rounded-xl font-black text-white text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition shadow-sm overflow-hidden flex items-center justify-center gap-2"
                    >
                      {uploading && (
                        <div className="absolute inset-y-0 left-0 bg-blue-500/50" style={{ width: `${progress}%`, transition: 'width 0.2s ease-out' }} />
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
                    className="w-24 h-24 rounded-full border-4 border-green-100 bg-green-50 flex items-center justify-center mx-auto mb-6 shadow-sm"
                  >
                    <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Model Published!</h3>
                  <p className="text-gray-500 font-medium text-sm mb-8">Your 3D model is now live in the Synthe Gallery.</p>
                  <button
                    onClick={onClose}
                    className="px-8 py-3.5 rounded-xl font-extrabold text-white text-sm bg-blue-600 hover:bg-blue-700 shadow-sm transition"
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