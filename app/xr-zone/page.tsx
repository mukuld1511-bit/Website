"use client";
import { useEffect, useState, useCallback } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import Footer from "../components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import VideoBackground from "../components/VideoBackground";
import GlowCard from "../components/GlowCard";
import MagneticButton from "../components/MagneticButton";
import CountUp from "../components/CountUp";
import type { Model, UserRole } from "../../types/gallery";

type Mode = "AR" | "VR";

const CATEGORIES = ["All", "Professional", "Education", "AR Tool", "Utility", "Industrial", "Enterprise"];
const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Most Popular", value: "popular" },
  { label: "Price: Low", value: "price-low" },
  { label: "Price: High", value: "price-high" },
];

const AR_STATS = [
  { label: "AR Projects", value: 124, suffix: "+", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { label: "VR Builds", value: 89, suffix: "+", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" },
  { label: "Verified Creators", value: 47, suffix: "", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { label: "WebXR Ready", value: 100, suffix: "%", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" },
];

function ModelCard({ model, index }: { model: Model; index: number }) {
  const isWebXR = model.webxrReady || ["glb", "gltf"].includes((model.fileType ?? "").toLowerCase());
  const isFree = !model.isPaid && (model.price ?? 0) === 0;

  return (
    <GlowCard glowColor="rgba(91, 75, 219, 0.3)">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.35 }}
      >
        <Link href={`/gallery/${model.id}`}>
          <div className="group relative bg-[#141420]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)] hover:border-white/20 hover:-translate-y-1.5 transition-all duration-500 cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-[#5B4BDB]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />
            {/* Thumbnail */}
            <div className="relative aspect-[4/3] bg-[#0A0A0F] overflow-hidden">
              {model.thumbnailUrl ? (
                <img src={model.thumbnailUrl} alt={model.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#5B4BDB]/10 to-[#141420]">
                  <svg className="w-12 h-12 text-[#2A2A3E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                  </svg>
                </div>
              )}
              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-1.5">
                {isWebXR && (
                  <span className="px-2 py-0.5 rounded-md bg-[#5B4BDB] text-white text-[10px] font-bold shadow-sm animate-pulse">
                    WebXR
                  </span>
                )}
                {model.category && (
                  <span className="px-2 py-0.5 rounded-md bg-[#141420]/80 text-[#9494AD] text-[10px] font-bold border border-[#2A2A3E] backdrop-blur-sm">
                    {model.category}
                  </span>
                )}
              </div>
              <div className="absolute top-3 right-3">
                {isFree ? (
                  <span className="px-2 py-0.5 rounded-md bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-bold backdrop-blur-sm">Free</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold backdrop-blur-sm">₹{model.price}</span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="font-bold text-white text-sm mb-1 line-clamp-1 group-hover:text-[#7C6EF6] transition-colors">
                {model.title}
              </h3>
              <p className="text-[#6B6B85] text-xs truncate">{model.authorName ?? model.uploaderName ?? "—"}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2A2A3E]">
                <div className="flex items-center gap-1.5 text-xs text-[#6B6B85]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  {model.downloads ?? 0} downloads
                </div>
                <span className="text-[10px] font-bold text-[#6B6B85] uppercase tracking-wide">
                  {(model.fileType ?? "").toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </GlowCard>
  );
}

function EmptyState({ mode }: { mode: Mode }) {
  return (
    <div className="col-span-full py-20 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl glass-synthe flex items-center justify-center mb-4 text-3xl">
        {mode === "AR" ? "📱" : "🥽"}
      </div>
      <p className="font-bold text-white mb-1">No {mode} projects yet</p>
      <p className="text-[#6B6B85] text-sm mb-5">Be the first to upload an {mode} build</p>
      <MagneticButton href={`/xr-zone/${mode.toLowerCase()}/upload`} variant="primary">
        Upload {mode} Build
      </MagneticButton>
    </div>
  );
}

export default function XRZonePage() {
  const [mode,     setMode]     = useState<Mode>("AR");
  const [models,   setModels]   = useState<Model[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");
  const [sort,     setSort]     = useState("newest");
  const [user,     setUser]     = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>("user");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null);
      if (u) {
        const { doc, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setUserRole(snap.data().role as UserRole ?? "user");
      }
    });
    return () => unsub();
  }, []);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "models"),
        where("category", "==", mode === "AR" ? "AR" : "VR"),
        orderBy("uploadedAt", "desc")
      );
      const snap = await getDocs(q);
      setModels(snap.docs.map(d => ({ id: d.id, ...d.data() } as Model)));
    } catch (err) {
      console.error("XR Zone fetch:", err);
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const filtered = models
    .filter(m => {
      const matchSearch = !search || m.title?.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All" || m.category === category;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sort === "price-low")  return (a.price ?? 0) - (b.price ?? 0);
      if (sort === "price-high") return (b.price ?? 0) - (a.price ?? 0);
      if (sort === "popular")    return (b.downloads ?? 0) - (a.downloads ?? 0);
      return 0;
    });

  const canUpload = ["developer", "mentor", "admin"].includes(userRole);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans">

      {/* ═══ PORTAL HERO ═══ */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <VideoBackground variant="aurora" color="#5B4BDB" intensity={0.65} />



        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B4BDB]/15 border border-[#5B4BDB]/25 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BDB] animate-pulse" />
                <span className="text-[#7C6EF6] text-[11px] font-bold uppercase tracking-widest">XR Zone</span>
              </motion.div>
              <motion.h1
                className="text-4xl md:text-6xl font-black text-white tracking-tight mb-2"
                initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                AR & VR <span className="text-shimmer">Marketplace</span>
              </motion.h1>
              <motion.p className="text-[#9494AD] text-base max-w-lg"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                Buy, sell and discover immersive AR and VR applications built by real creators.
              </motion.p>
            </div>

            {/* Upload buttons */}
            <motion.div className="flex gap-3 shrink-0"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              {canUpload ? (
                <>
                  <MagneticButton href="/xr-zone/ar/upload" variant="primary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload AR
                  </MagneticButton>
                  <MagneticButton href="/xr-zone/vr/upload" variant="secondary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload VR
                  </MagneticButton>
                </>
              ) : user ? (
                <MagneticButton href="/join" variant="outline">Apply as Developer to upload</MagneticButton>
              ) : (
                <MagneticButton href="/login" variant="primary">Sign in to upload</MagneticButton>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-20 w-full flex-grow">

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 -mt-8 relative z-10">
          {AR_STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.06 }}
              className="bg-[#141420]/60 backdrop-blur-2xl border border-white/5 shadow-lg rounded-[2rem] p-5 flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-[#5B4BDB]/10 border border-[#5B4BDB]/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(91,75,219,0.2)]">
                <svg className="w-6 h-6 text-[#A594FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </div>
              <div className="relative z-10">
                <p className="text-2xl font-black text-white drop-shadow-md">
                  <CountUp target={s.value} suffix={s.suffix} duration={1500} />
                </p>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#6B6B85] mt-0.5">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── WebXR Banner ── */}
        <div className="mb-8 rounded-2xl glass-synthe border border-[#5B4BDB]/20 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5B4BDB]/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(91,75,219,0.2)]">
              <svg className="w-4 h-4 text-[#7C6EF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-bold">WebXR Powered Platform</p>
              <p className="text-[#6B6B85] text-xs">3D models support in-browser AR — place them in your real environment, no app needed</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Chrome Android", "Safari iOS 16+", "No app install", "WebXR Device API"].map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-lg glass-synthe text-[#9494AD] text-[11px] font-semibold">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── AR / VR TABS with layoutId ── */}
        <div className="flex gap-1.5 p-1.5 rounded-[1.5rem] bg-[#1A1A2E]/50 backdrop-blur-md border border-white/5 w-fit mb-8 shadow-inner">
          {(["AR", "VR"] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`relative flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all ${
                mode === m ? "text-white" : "text-[#6B6B85] hover:text-white"
              }`}>
              {mode === m && (
                <motion.div
                  layoutId="xr-tab-indicator"
                  className="absolute inset-0 rounded-2xl bg-[#5B4BDB] shadow-[0_0_20px_rgba(91,75,219,0.4)] border-b-[3px] border-[#4438b8]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2 drop-shadow-sm">
                <span className="text-base">{m === "AR" ? "📱" : "🥽"}</span>
                {m === "AR" ? "Augmented Reality" : "Virtual Reality"}
              </span>
            </button>
          ))}
        </div>

        {/* ── SEARCH + FILTERS ── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 group">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B85] group-focus-within:text-[#5B4BDB] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${mode} projects...`}
              className="w-full pl-12 pr-5 py-3.5 bg-[#1A1A2E]/50 backdrop-blur-md border border-white/5 rounded-2xl text-sm text-white placeholder-[#6B6B85] outline-none focus:border-[#5B4BDB]/50 focus:bg-[#1A1A2E]/80 focus:ring-4 focus:ring-[#5B4BDB]/10 transition-all shadow-inner"
            />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="px-5 py-3.5 bg-[#1A1A2E]/50 backdrop-blur-md border border-white/5 rounded-2xl text-sm text-white font-semibold outline-none focus:border-[#5B4BDB]/50 focus:bg-[#1A1A2E]/80 focus:ring-4 focus:ring-[#5B4BDB]/10 transition-all shadow-inner appearance-none pr-10">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-[#101015]">{o.label}</option>)}
          </select>
        </div>

        {/* Category pills */}
        <div className="flex gap-2.5 flex-wrap mb-10">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                category === cat
                  ? "bg-[#5B4BDB] text-white border-[#4438b8] shadow-[0_0_15px_rgba(91,75,219,0.3)]"
                  : "bg-[#1A1A2E]/50 border-white/5 text-[#9494AD] hover:border-white/20 hover:text-white shadow-sm"
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* ── GRID ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-[#141420] border border-[#2A2A3E] overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-[#1A1A2E]" />
                  <div className="p-4 space-y-2">
                    <div className="h-3.5 bg-[#1A1A2E] rounded w-3/4" />
                    <div className="h-3 bg-[#1A1A2E] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div key={`grid-${mode}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filtered.length === 0
                ? <EmptyState mode={mode} />
                : filtered.map((m, i) => <ModelCard key={m.id} model={m} index={i} />)
              }
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}