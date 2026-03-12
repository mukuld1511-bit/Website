"use client";

import { useState, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
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
      const mRef = ref(storage, `models/${user.uid}/${Date.now()}_${modelFile.name}`);
      const mUpload = uploadBytesResumable(mRef, modelFile);
      const modelUrl: string = await new Promise((resolve, reject) => {
        mUpload.on("state_changed",
          (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 80)),
          reject,
          async () => resolve(await getDownloadURL(mUpload.snapshot.ref))
        );
      });

      let thumbnailUrl = "";
      if (thumbnailFile) {
        setProgress(85);
        const tRef = ref(storage, `thumbnails/${user.uid}/${Date.now()}_thumb`);
        const tUp = uploadBytesResumable(tRef, thumbnailFile);
        await new Promise<void>((res, rej) => tUp.on("state_changed", undefined, rej, res));
        thumbnailUrl = await getDownloadURL(tRef);
      }

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
      setError("Upload failed: " + (e instanceof Error ? e.message : String(e)));
    }
    setUploading(false);
  }

  const inputCls = "w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-violet-500/40 focus:shadow-[0_0_16px_rgba(139,92,246,0.08)] transition duration-200 placeholder:text-white/20";
  const pillCls = (active: boolean, color = "violet") =>
    `py-3 rounded-xl font-bold text-sm border transition duration-200 ${active
      ? color === "cyan" ? "bg-cyan-500/12 border-cyan-500/30 text-cyan-300" : "bg-violet-500/18 border-violet-500/40 text-violet-300"
      : "bg-white/[0.03] border-white/8 text-white/40 hover:border-white/15"}`;

  const steps = ["Select File", "Details", "Pricing", "Done!"];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />

        <motion.div
          className="relative z-10 w-full max-w-lg rounded-3xl border border-white/8 bg-[#07000e] shadow-[0_40px_100px_rgba(0,0,0,0.7)] overflow-hidden"
          initial={{ scale: 0.9, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          {/* Glow */}
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.2) 0%, transparent 70%)", filter: "blur(40px)" }} />

          {/* Top shimmer */}
          <div className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.5), rgba(34,211,238,0.3), transparent)" }} />

          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-400/70 mb-1">Upload to Gallery</p>
                <h2 className="text-xl font-black text-white">
                  {steps[(step - 1)]}
                </h2>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl border border-white/8 bg-white/[0.04] text-white/35 hover:text-white/70 hover:border-white/20 transition duration-200 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step indicators */}
            {step < 4 && (
              <div className="flex gap-1.5">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="relative h-1 flex-1 rounded-full bg-white/8 overflow-hidden">
                    <motion.div
                      animate={{ width: s <= step ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ background: "linear-gradient(90deg, #7c3aed, #0891b2)" }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-8 py-7 max-h-[70vh] overflow-y-auto">
            <AnimatePresence mode="wait">

              {/* STEP 1 — file drop */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-white/10 hover:border-violet-500/35 rounded-2xl p-14 text-center cursor-pointer transition duration-200 group"
                  >
                    <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} onChange={handleModelFile} className="hidden" />
                    <div className="w-14 h-14 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center mx-auto mb-5 group-hover:border-violet-500/30 group-hover:bg-violet-500/5 transition duration-200">
                      <svg className="w-7 h-7 text-white/25 group-hover:text-violet-400 transition duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <p className="text-white/55 font-bold mb-2">Drop your 3D file here</p>
                    <p className="text-white/25 text-sm">GLB · GLTF · OBJ · FBX · DWG · DXF</p>
                    {error && <p className="text-rose-400 text-xs mt-4 flex items-center justify-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </p>}
                  </div>
                </motion.div>
              )}

              {/* STEP 2 — details */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-4">
                  <p className="text-xs text-violet-400/60 font-bold uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {modelFile?.name}
                  </p>

                  {/* Thumbnail */}
                  <div
                    onClick={() => thumbRef.current?.click()}
                    className="relative aspect-video rounded-xl border-2 border-dashed border-white/8 hover:border-violet-500/25 overflow-hidden cursor-pointer transition duration-200 flex items-center justify-center group"
                  >
                    <input ref={thumbRef} type="file" accept="image/*" onChange={handleThumbnail} className="hidden" />
                    {thumbnailPreview
                      ? <img src={thumbnailPreview} className="w-full h-full object-cover" alt="thumb" />
                      : <div className="text-center">
                          <div className="w-8 h-8 rounded-xl border border-white/8 bg-white/[0.02] flex items-center justify-center mx-auto mb-2 group-hover:border-violet-500/25 transition duration-200">
                            <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-white/25 text-xs">Add thumbnail</p>
                        </div>
                    }
                  </div>

                  <input value={form.title} onChange={(e) => setF("title", e.target.value)} placeholder="Model title *" className={inputCls} />
                  <textarea value={form.description} onChange={(e) => setF("description", e.target.value)} rows={2} placeholder="Description" className={inputCls + " resize-none"} />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <select value={form.category} onChange={(e) => setF("category", e.target.value)} className={inputCls + " appearance-none pr-8"}>
                        {CATEGORIES.map((c) => <option key={c} className="bg-[#080012]">{c}</option>)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <input value={form.polygons} onChange={(e) => setF("polygons", e.target.value)} placeholder="Polygon count" className={inputCls} />
                  </div>
                  <input value={form.tags} onChange={(e) => setF("tags", e.target.value)} placeholder="Tags — comma separated" className={inputCls} />

                  <motion.button
                    onClick={() => setStep(3)}
                    disabled={!form.title}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ willChange: "transform", background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}
                    className="w-full py-4 rounded-2xl font-black text-white text-sm disabled:opacity-40 transition mt-2"
                  >
                    Continue →
                  </motion.button>
                </motion.div>
              )}

              {/* STEP 3 — pricing */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-5">

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25 mb-3">Pricing Model</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setF("isPaid", false)} className={pillCls(!form.isPaid)}>
                        🔓 Free
                      </button>
                      <button onClick={() => setF("isPaid", true)} className={pillCls(form.isPaid)}>
                        💰 Paid
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
                        className="space-y-4"
                      >
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25 mb-2">Price (₹)</p>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-bold">₹</span>
                            <input
                              type="number"
                              value={form.price}
                              onChange={(e) => setF("price", e.target.value)}
                              placeholder="e.g. 499"
                              className={inputCls + " pl-8"}
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25 mb-2">Access Type</p>
                          <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setF("accessType", "purchase")} className={pillCls(form.accessType === "purchase", "cyan") + " text-xs"}>
                              Direct Purchase
                            </button>
                            <button onClick={() => setF("accessType", "request")} className={pillCls(form.accessType === "request", "cyan") + " text-xs"}>
                              Request Access
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && (
                    <p className="text-rose-400 text-xs flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </p>
                  )}

                  {uploading && (
                    <div>
                      <div className="flex justify-between text-xs text-white/35 mb-2">
                        <span>Uploading...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                        <motion.div
                          animate={{ width: `${progress}%` }}
                          transition={{ ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: "linear-gradient(90deg, #7c3aed, #22d3ee)" }}
                        />
                      </div>
                    </div>
                  )}

                  <motion.button
                    onClick={handleUpload}
                    disabled={uploading || (form.isPaid && !form.price)}
                    whileHover={{ scale: uploading ? 1 : 1.01 }}
                    whileTap={{ scale: uploading ? 1 : 0.98 }}
                    style={{ willChange: "transform", background: uploading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #7c3aed, #0891b2)" }}
                    className="w-full py-4 rounded-2xl font-black text-white text-sm disabled:opacity-40 transition relative overflow-hidden"
                  >
                    {!uploading && (
                      <motion.div
                        animate={{ x: ["-200%", "200%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "linear" }}
                        style={{ willChange: "transform", position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", transform: "skewX(-20deg)", pointerEvents: "none" }}
                      />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {uploading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Uploading...
                        </>
                      ) : "🚀 Publish Model"}
                    </span>
                  </motion.button>
                </motion.div>
              )}

              {/* STEP 4 — done */}
              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center py-10">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6 }}
                    className="w-20 h-20 rounded-3xl border border-emerald-500/20 bg-emerald-500/8 flex items-center justify-center mx-auto mb-6"
                  >
                    <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                  <h3 className="text-2xl font-black text-white mb-2">Model Published!</h3>
                  <p className="text-white/35 text-sm mb-8">Your model is now live in the SYNTHÉ gallery.</p>
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ willChange: "transform", background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}
                    className="px-8 py-3.5 rounded-2xl font-black text-white text-sm"
                  >
                    View Gallery →
                  </motion.button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}