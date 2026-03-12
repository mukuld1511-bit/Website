"use client";

import { useEffect, useRef, useState } from "react";
import { auth, db, storage } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const ACCEPTED   = ".glb,.gltf,.obj,.fbx,.dwg,.dxf";
const CATEGORIES = ["Architecture","Mechanical","Character","Environment","Product","AutoCAD","Other"];

const PLATFORM_FEE = 0.15; // 15%
const RAZORPAY_FEE = 0.02; // 2%
const DIVISOR      = 1 - PLATFORM_FEE - RAZORPAY_FEE; // 0.83

function getBuyerPrice(sellerPrice: number)   { return Math.ceil(sellerPrice / DIVISOR); }
function getPlatformFee(sellerPrice: number)  { return Math.ceil(sellerPrice * PLATFORM_FEE); }
function getRazorpayFee(sellerPrice: number)  { return Math.ceil(sellerPrice * RAZORPAY_FEE); }

const FILE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  glb:  { text:"text-violet-300", bg:"bg-violet-500/10", border:"border-violet-500/25" },
  gltf: { text:"text-violet-300", bg:"bg-violet-500/10", border:"border-violet-500/25" },
  obj:  { text:"text-cyan-300",   bg:"bg-cyan-500/10",   border:"border-cyan-500/25" },
  fbx:  { text:"text-cyan-300",   bg:"bg-cyan-500/10",   border:"border-cyan-500/25" },
  dwg:  { text:"text-amber-300",  bg:"bg-amber-500/10",  border:"border-amber-500/25" },
  dxf:  { text:"text-amber-300",  bg:"bg-amber-500/10",  border:"border-amber-500/25" },
};

const STEPS = ["Model File","Project Info","Pricing & Access"];

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(0);

  const [modelFile,    setModelFile]    = useState<File | null>(null);
  const [thumbFile,    setThumbFile]    = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [category,    setCategory]    = useState("Architecture");
  const [tags,        setTags]        = useState("");
  const [polygons,    setPolygons]    = useState("");
  const [isPaid,      setIsPaid]      = useState(false);
  const [price,       setPrice]       = useState("");
  const [accessType,  setAccessType]  = useState<"purchase"|"request">("purchase");

  const [uploading,     setUploading]     = useState(false);
  const [progress,      setProgress]      = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [error,         setError]         = useState("");
  const [published,     setPublished]     = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
    });
    return () => unsub();
  }, []);

  const inputCls = "w-full bg-white/[0.03] border border-white/8 text-white placeholder-white/25 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-violet-500/50 focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition duration-200";

  function pillCls(active: boolean, accent: "violet"|"cyan" = "violet") {
    return `py-3.5 rounded-2xl font-bold text-sm border transition duration-200 ${
      active
        ? accent === "cyan"
          ? "bg-cyan-500/12 border-cyan-500/30 text-cyan-300"
          : "bg-violet-500/15 border-violet-500/40 text-violet-300"
        : "bg-white/[0.03] border-white/8 text-white/40 hover:border-white/15 hover:text-white/60"
    }`;
  }

  function handleModelFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["glb","gltf","obj","fbx","dwg","dxf"].includes(ext)) {
      setError("Unsupported type. Use GLB, GLTF, OBJ, FBX, DWG or DXF."); return;
    }
    setModelFile(file); setError(""); setStep(1);
  }

  function handleThumb(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  }

  async function handlePublish() {
    if (!modelFile || !title || !user) return;
    setUploading(true); setError("");
    try {
      setProgressLabel("Uploading 3D model…");
      const mRef = ref(storage, `models/${user.uid}/${Date.now()}_${modelFile.name}`);
      const mUp  = uploadBytesResumable(mRef, modelFile);
      const modelUrl: string = await new Promise((resolve, reject) => {
        mUp.on(
          "state_changed",
          (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 75)),
          reject,
          async () => resolve(await getDownloadURL(mUp.snapshot.ref))
        );
      });

      let thumbnailUrl = "";
      if (thumbFile) {
        setProgressLabel("Uploading thumbnail…"); setProgress(80);
        const tRef = ref(storage, `thumbnails/${user.uid}/${Date.now()}_thumb`);
        const tUp  = uploadBytesResumable(tRef, thumbFile);
        await new Promise<void>((res, rej) => tUp.on("state_changed", undefined, rej, res));
        thumbnailUrl = await getDownloadURL(tRef);
      }

      setProgressLabel("Saving to database…"); setProgress(92);

      const sellerPrice  = isPaid ? parseFloat(price) || 0 : 0;
      const displayPrice = isPaid ? getBuyerPrice(sellerPrice) : 0;
      const platformFee  = isPaid ? getPlatformFee(sellerPrice) : 0;

      await addDoc(collection(db, "models"), {
        title:        title.trim(),
        description:  description.trim(),
        category,
        tags:         tags.split(",").map(t => t.trim()).filter(Boolean),
        polygons:     polygons || null,
        fileType:     modelFile.name.split(".").pop()?.toLowerCase(),
        modelUrl,
        thumbnailUrl,
        isPaid,
        price:        sellerPrice,    // seller receives this
        displayPrice,                 // buyer pays this
        platformFee,                  // platform cut
        accessType:   isPaid ? accessType : "free",
        authorId:     user.uid,
        authorName:   user.displayName ?? "Unknown",
        authorPhoto:  user.photoURL ?? "",
        views: 0, likes: 0, downloads: 0,
        uploadedAt:   serverTimestamp(),
      });

      setProgress(100); setProgressLabel("Published!"); setPublished(true);
    } catch (e: any) {
      setError("Upload failed: " + (e?.message ?? "Unknown error"));
    }
    setUploading(false);
  }

  function resetForm() {
    setStep(0); setModelFile(null); setThumbFile(null); setThumbPreview(null);
    setTitle(""); setDescription(""); setTags(""); setPolygons(""); setPrice("");
    setIsPaid(false); setAccessType("purchase"); setProgress(0); setError(""); setPublished(false);
  }

  if (!user) return (
    <main className="min-h-screen bg-[#050008] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
    </main>
  );

  const fileExt = modelFile?.name.split(".").pop()?.toLowerCase() ?? "";
  const fc = FILE_COLORS[fileExt];
  const sellerNum = parseFloat(price) || 0;

  return (
    <main className="min-h-screen bg-[#050008] px-4 py-28 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background:"radial-gradient(ellipse,rgba(124,58,237,0.12) 0%,transparent 70%)", filter:"blur(100px)" }} />
      <div className="absolute inset-0 opacity-[0.018] pointer-events-none"
        style={{ backgroundImage:"linear-gradient(rgba(167,139,250,1) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,1) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />

      <div className="relative z-10 max-w-2xl mx-auto">

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 mb-5">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-300/90 text-sm font-semibold uppercase tracking-widest">Upload</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white mb-2">
            Add Your{" "}
            <span style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              Project
            </span>
          </h1>
          <p className="text-white/35 text-sm">Upload your 3D model to the SYNTHÉ gallery.</p>
        </motion.div>

        {!published && (
          <div className="flex items-center gap-2 mb-2">
            {STEPS.map((_,i) => (
              <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-white/8">
                <motion.div animate={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }} transition={{ duration:0.4 }}
                  className="h-full rounded-full" style={{ background:"linear-gradient(90deg,#7c3aed,#0891b2)" }} />
              </div>
            ))}
          </div>
        )}
        {!published && (
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25 mb-6">
            Step {step+1} of {STEPS.length} — <span className="text-violet-400/70">{STEPS[step]}</span>
          </p>
        )}

        {/* ── PUBLISHED ── */}
        {published && (
          <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.4 }}
            className="relative rounded-3xl overflow-hidden border border-emerald-500/20 bg-emerald-500/[0.03] backdrop-blur-xl p-12 text-center">
            <div className="absolute top-0 left-0 right-0 h-[1px]"
              style={{ background:"linear-gradient(90deg,transparent,rgba(52,211,153,0.5),transparent)" }} />
            <motion.div animate={{ scale:[1,1.1,1] }} transition={{ duration:0.6 }}
              className="w-24 h-24 rounded-3xl border border-emerald-500/25 bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            <h2 className="text-3xl font-black text-white mb-2">Project Published!</h2>
            <p className="text-white/40 text-sm mb-8 max-w-sm mx-auto">
              <span className="text-white/70 font-bold">"{title}"</span> is now live in the SYNTHÉ gallery.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.button onClick={() => router.push("/gallery")}
                whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                className="px-8 py-3.5 rounded-2xl font-black text-white text-sm">
                View in Gallery →
              </motion.button>
              <motion.button onClick={resetForm}
                whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} style={{ willChange:"transform" }}
                className="px-8 py-3.5 rounded-2xl font-black text-white/50 text-sm border border-white/10 hover:border-white/20 hover:text-white/70 transition duration-200">
                Upload Another
              </motion.button>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">

          {/* ── STEP 0 ── */}
          {!published && step === 0 && (
            <motion.div key="s0" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.25 }}>
              <div className="relative rounded-3xl overflow-hidden border border-white/6 bg-white/[0.025] backdrop-blur-xl p-8">
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.3),transparent)" }} />
                <div onClick={() => modelInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 hover:border-violet-500/35 rounded-2xl p-14 text-center cursor-pointer transition duration-200 group">
                  <input ref={modelInputRef} type="file" accept={ACCEPTED} onChange={handleModelFile} className="hidden" />
                  <motion.div whileHover={{ scale:1.05, rotate:3 }} transition={{ type:"spring", stiffness:400, damping:20 }}
                    className="w-16 h-16 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center mx-auto mb-6 group-hover:border-violet-500/30 group-hover:bg-violet-500/8 transition duration-200">
                    <svg className="w-8 h-8 text-white/25 group-hover:text-violet-400 transition duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </motion.div>
                  <p className="text-white/60 font-bold text-lg mb-2">Drop your 3D file here</p>
                  <p className="text-white/25 text-sm mb-1">or click to browse</p>
                  <p className="text-white/15 text-xs">GLB · GLTF · OBJ · FBX · DWG · DXF</p>
                </div>
                {error && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                    className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl border border-rose-500/20 bg-rose-500/8">
                    <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-rose-400 text-sm">{error}</p>
                  </motion.div>
                )}
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {["GLB / GLTF","OBJ / FBX","DWG / DXF"].map(fmt => (
                    <div key={fmt} className="text-center py-2.5 rounded-xl border border-white/6 bg-white/[0.02]">
                      <p className="text-white/35 text-xs font-bold">{fmt}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 1 ── */}
          {!published && step === 1 && (
            <motion.div key="s1" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.25 }}>
              <div className="relative rounded-3xl overflow-hidden border border-white/6 bg-white/[0.025] backdrop-blur-xl p-8 space-y-5">
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.3),transparent)" }} />

                {fc && (
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${fc.text} ${fc.bg} ${fc.border}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {modelFile?.name}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">
                    Thumbnail <span className="text-white/20 font-normal normal-case tracking-normal">(optional)</span>
                  </label>
                  <div onClick={() => thumbInputRef.current?.click()}
                    className="relative aspect-video rounded-2xl border-2 border-dashed border-white/8 hover:border-violet-500/25 overflow-hidden cursor-pointer transition duration-200 flex items-center justify-center group">
                    <input ref={thumbInputRef} type="file" accept="image/*" onChange={handleThumb} className="hidden" />
                    {thumbPreview ? (
                      <img src={thumbPreview} className="w-full h-full object-cover" alt="thumb" />
                    ) : (
                      <div className="text-center">
                        <svg className="w-8 h-8 text-white/15 group-hover:text-violet-400/50 transition duration-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-white/25 text-xs">Click to add thumbnail</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Title *</label>
                  <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Sci-Fi Helmet v2" className={inputCls} />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Description</label>
                  <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3}
                    placeholder="Describe your model, use case, technical details…" className={inputCls + " resize-none"} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Category</label>
                    <div className="relative">
                      <select value={category} onChange={e=>setCategory(e.target.value)} className={inputCls + " appearance-none pr-8 cursor-pointer"}>
                        {CATEGORIES.map(c => <option key={c} className="bg-[#080012]">{c}</option>)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Polygon Count</label>
                    <input value={polygons} onChange={e=>setPolygons(e.target.value)} placeholder="e.g. 12,400" className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Tags</label>
                  <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="ar, vr, character, low-poly" className={inputCls} />
                  <p className="text-white/20 text-xs mt-1.5">Separate with commas</p>
                </div>

                <motion.button onClick={() => setStep(2)} disabled={!title}
                  whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                  className="w-full py-4 rounded-2xl font-black text-white text-sm disabled:opacity-40 transition mt-2">
                  Continue to Pricing →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2 — PRICING ── */}
          {!published && step === 2 && (
            <motion.div key="s2" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.25 }}>
              <div className="relative rounded-3xl overflow-hidden border border-white/6 bg-white/[0.025] backdrop-blur-xl p-8 space-y-6">
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.3),transparent)" }} />

                {/* Free / Paid */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-3">Pricing Model</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setIsPaid(false)} className={pillCls(!isPaid)}>🔓 Free</button>
                    <button onClick={() => setIsPaid(true)}  className={pillCls(isPaid)}>💰 Paid</button>
                  </div>
                </div>

                <AnimatePresence>
                  {isPaid && (
                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                      transition={{ duration:0.3 }} className="space-y-5 overflow-hidden">

                      {/* Price input */}
                      <div>
                        <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">
                          Your Selling Price (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">₹</span>
                          <input type="number" min="1" value={price} onChange={e=>setPrice(e.target.value)}
                            placeholder="e.g. 499" className={inputCls + " pl-8"} />
                        </div>
                      </div>

                      {/* ── COMMISSION BREAKDOWN ── */}
                      <AnimatePresence>
                        {sellerNum > 0 && (
                          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
                            className="relative rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden p-4 space-y-3">
                            <div className="absolute top-0 left-0 right-0 h-[1px]"
                              style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.3),rgba(34,211,238,0.2),transparent)" }} />

                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25 mb-3">
                              Price Breakdown
                            </p>

                            <div className="space-y-2.5">
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400/60 inline-block" />
                                  Your earnings
                                </span>
                                <span className="text-emerald-400 font-black text-sm">₹{sellerNum}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-violet-400/60 inline-block" />
                                  Platform fee (15%)
                                </span>
                                <span className="text-white/40 text-sm">₹{getPlatformFee(sellerNum)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-white/40 text-xs flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-cyan-400/60 inline-block" />
                                  Razorpay fee (~2%)
                                </span>
                                <span className="text-white/40 text-sm">₹{getRazorpayFee(sellerNum)}</span>
                              </div>

                              <div className="h-[1px] bg-white/6" />

                              <div className="flex justify-between items-center">
                                <span className="text-white/70 text-xs font-black">Buyer pays</span>
                                <span className="text-white font-black text-base">₹{getBuyerPrice(sellerNum)}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Access type */}
                      <div>
                        <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-3">Access Type</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => setAccessType("purchase")} className={pillCls(accessType==="purchase","cyan") + " text-xs"}>
                            ⚡ Direct Purchase
                          </button>
                          <button onClick={() => setAccessType("request")} className={pillCls(accessType==="request","cyan") + " text-xs"}>
                            🔐 Request Access
                          </button>
                        </div>
                        <p className="text-white/20 text-xs mt-2 leading-relaxed">
                          {accessType === "purchase"
                            ? "Buyers pay instantly via Razorpay and get immediate download access."
                            : "Buyers submit a request — you manually approve or deny each one from your dashboard."}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Storage info */}
                <div className="flex items-start gap-3 p-4 rounded-2xl border border-violet-500/15 bg-violet-500/5">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-violet-300 text-xs font-bold mb-1">Secure file storage</p>
                    <p className="text-white/30 text-xs leading-relaxed">
                      Your file is uploaded to Firebase Storage. A secure download link is generated automatically. No external URL required.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-500/20 bg-rose-500/8">
                    <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-rose-400 text-sm">{error}</p>
                  </div>
                )}

                {uploading && (
                  <div>
                    <div className="flex justify-between text-xs text-white/35 mb-2">
                      <span>{progressLabel}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                      <motion.div animate={{ width:`${progress}%` }} transition={{ ease:"easeOut" }}
                        className="h-full rounded-full" style={{ background:"linear-gradient(90deg,#7c3aed,#22d3ee)" }} />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(1)} disabled={uploading}
                    className="px-5 py-3.5 text-sm font-bold text-white/40 border border-white/8 rounded-2xl hover:border-white/20 hover:text-white/60 transition duration-200 disabled:opacity-30">
                    ← Back
                  </button>
                  <motion.button onClick={handlePublish}
                    disabled={uploading || (isPaid && !price)}
                    whileHover={{ scale: uploading ? 1 : 1.02 }}
                    whileTap={{ scale: uploading ? 1 : 0.98 }}
                    style={{ willChange:"transform", background: uploading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#7c3aed,#0891b2)" }}
                    className="flex-1 py-3.5 rounded-2xl font-black text-white text-sm disabled:opacity-40 relative overflow-hidden">
                    {!uploading && (
                      <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                        style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {uploading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Uploading…
                        </>
                      ) : "🚀 Publish Project"}
                    </span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}