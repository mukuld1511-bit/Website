"use client";
import { useEffect, useState, useCallback } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import Footer from "../components/Footer";
import { motion, AnimatePresence } from "framer-motion";
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
  { label: "AR Projects", value: "124+", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { label: "VR Builds", value: "89+", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" },
  { label: "Verified Creators", value: "47", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { label: "WebXR Ready", value: "100%", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" },
];

function ModelCard({ model, index }: { model: Model; index: number }) {
  const isWebXR = model.webxrReady || ["glb", "gltf"].includes((model.fileType ?? "").toLowerCase());
  const isFree = !model.isPaid && (model.price ?? 0) === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Link href={`/gallery/${model.id}`}>
        <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">
          {/* Thumbnail */}
          <div className="relative aspect-[4/3] bg-[#0A0A0F] overflow-hidden">
            {model.thumbnailUrl ? (
              <img src={model.thumbnailUrl} alt={model.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                </svg>
              </div>
            )}
            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-1.5">
              {isWebXR && (
                <span className="px-2 py-0.5 rounded-md bg-[#5B4BDB] text-white text-[10px] font-bold shadow-sm">
                  WebXR
                </span>
              )}
              {model.category && (
                <span className="px-2 py-0.5 rounded-md bg-white/90 text-gray-700 text-[10px] font-bold border border-gray-100 shadow-sm">
                  {model.category}
                </span>
              )}
            </div>
            <div className="absolute top-3 right-3">
              {isFree ? (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">Free</span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">₹{model.price}</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            <h3 className="font-bold text-white text-sm mb-1 line-clamp-1 group-hover:text-[#5B4BDB] transition-colors">
              {model.title}
            </h3>
            <p className="text-gray-400 text-xs truncate">{model.authorName ?? model.uploaderName ?? "—"}</p>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                {model.downloads ?? 0} downloads
              </div>
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wide">
                {(model.fileType ?? "").toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyState({ mode }: { mode: Mode }) {
  return (
    <div className="col-span-full py-20 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-3xl">
        {mode === "AR" ? "📱" : "🥽"}
      </div>
      <p className="font-bold text-white mb-1">No {mode} projects yet</p>
      <p className="text-gray-400 text-sm mb-5">Be the first to upload an {mode} build</p>
      <Link href={`/xr-zone/${mode.toLowerCase()}/upload`}>
        <button className="px-5 py-2.5 rounded-xl bg-[#5B4BDB] text-white text-sm font-bold border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all">
          Upload {mode} Build
        </button>
      </Link>
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

  // Client-side filter + sort
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
      return 0; // newest — already ordered by Firestore
    });

  const canUpload = ["developer", "mentor", "admin"].includes(userRole);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans">
      <div className="max-w-7xl mx-auto px-4 pt-10 pb-20 w-full flex-grow">

        {/* ── HEADER ── */}
        <div className="mb-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
            <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-600 font-semibold">XR Zone</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B4BDB]/10 border border-[#5B4BDB]/20 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BDB] animate-pulse" />
                <span className="text-[#5B4BDB] text-[11px] font-bold uppercase tracking-widest">XR Zone</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                AR & VR Marketplace
              </h1>
              <p className="text-gray-500 text-base max-w-lg">
                Buy, sell and discover immersive AR and VR applications built by real creators.
              </p>
            </div>

            {/* Upload buttons */}
            <div className="flex gap-3 shrink-0">
              {canUpload ? (
                <>
                  <Link href="/xr-zone/ar/upload">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B4BDB] text-white text-sm font-bold border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all active:translate-y-[1px]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload AR
                    </button>
                  </Link>
                  <Link href="/xr-zone/vr/upload">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold border-b-[3px] border-black/40 hover:bg-gray-800 transition-all active:translate-y-[1px]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload VR
                    </button>
                  </Link>
                </>
              ) : user ? (
                <Link href="/join">
                  <button className="px-5 py-2.5 rounded-xl border-2 border-[#5B4BDB] text-[#5B4BDB] text-sm font-bold hover:bg-[#5B4BDB]/5 transition-all">
                    Apply as Developer to upload
                  </button>
                </Link>
              ) : (
                <Link href="/login">
                  <button className="px-5 py-2.5 rounded-xl bg-[#5B4BDB] text-white text-sm font-bold border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all">
                    Sign in to upload
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {AR_STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-[#5B4BDB]/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#5B4BDB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </div>
              <div>
                <p className="text-base font-black text-white">{s.value}</p>
                <p className="text-[11px] text-gray-400">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── WebXR Banner ── */}
        <div className="mb-8 rounded-2xl bg-gray-900 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5B4BDB]/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-[#5B4BDB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-bold">WebXR Powered Platform</p>
              <p className="text-gray-400 text-xs">3D models support in-browser AR — place them in your real environment, no app needed</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Chrome Android", "Safari iOS 16+", "No app install", "WebXR Device API"].map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-lg bg-white/10 text-gray-300 text-[11px] font-semibold border border-white/10">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── AR / VR TABS ── */}
        <div className="flex gap-1 p-1 rounded-2xl bg-gray-200/60 w-fit mb-8">
          {(["AR", "VR"] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === m
                  ? "bg-white text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              <span className="text-base">{m === "AR" ? "📱" : "🥽"}</span>
              {m === "AR" ? "Augmented Reality" : "Virtual Reality"}
            </button>
          ))}
        </div>

        {/* ── SEARCH + FILTERS ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${mode} projects...`}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#5B4BDB] transition-colors shadow-sm"
            />
          </div>

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-semibold outline-none focus:border-[#5B4BDB] transition-colors shadow-sm">
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                category === cat
                  ? "bg-[#5B4BDB] text-white border-[#4438b8]"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-[#0A0A0F] hover:text-gray-700"
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
                <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
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