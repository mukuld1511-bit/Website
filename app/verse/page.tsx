"use client";
import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, limit, startAfter } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Footer from "../components/Footer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import VideoBackground from "../components/VideoBackground";
import GlowCard from "../components/GlowCard";
import TextReveal from "../components/TextReveal";
import MagneticButton from "../components/MagneticButton";

interface Model {
  id: string; title: string; thumbnailUrl: string; fileType: string;
  isPaid: boolean; price: number; authorName: string; authorPhoto: string;
  description: string; tags: string[]; views: number; downloads: number;
  engagementScore: number; uploadedAt: any;
}

const FILE_TYPES = ["All", "WebXR", "GLB", "GLTF", "OBJ", "FBX"];
const SORT_OPTIONS = [
  { label: "Newest",    value: "uploadedAt"      },
  { label: "Popular",   value: "engagementScore" },
  { label: "Downloads", value: "downloads"       },
];
const AURA: Record<string, string> = {
  hot:  "ring-2 ring-amber-500/40 shadow-[0_0_20px_rgba(239,159,39,0.15)]",
  mid:  "ring-2 ring-violet-500/30 shadow-[0_0_20px_rgba(91,75,219,0.1)]",
  cold: "ring-2 ring-blue-500/20",
};
function aura(score: number) {
  if (score >= 70) return AURA.hot;
  if (score >= 30) return AURA.mid;
  return AURA.cold;
}

function isImageUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".jpg") || lower.endsWith(".jpeg") ||
    lower.endsWith(".png") || lower.endsWith(".webp") ||
    lower.endsWith(".gif") || lower.includes("dicebear") ||
    lower.includes("firebasestorage") && !lower.includes(".glb") ||
    lower.includes("imagedelivery") || lower.includes("r2.dev") && !lower.includes(".glb")
  );
}

function ModelCard({ m, i }: { m: Model; i: number }) {
  const isWebXR = ["glb", "gltf"].includes(m.fileType?.toLowerCase());
  const hasRealThumbnail = isImageUrl(m.thumbnailUrl);

  return (
    <GlowCard glowColor="rgba(91, 75, 219, 0.3)" className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: i * 0.04, duration: 0.4, ease: [0, 0, 0.2, 1] }}
      >
        <Link href={`/gallery/${m.id}`}>
          <div className={`group bg-[#141420] rounded-2xl border border-[#2A2A3E] overflow-hidden hover:shadow-[0_8px_30px_rgba(91,75,219,0.15)] hover:border-[#5B4BDB]/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${aura(m.engagementScore ?? 0)}`}>

            {/* Thumbnail */}
            <div className="relative aspect-square overflow-hidden bg-[#0A0A0F] flex items-center justify-center">
              {hasRealThumbnail ? (
                <img src={m.thumbnailUrl} alt={m.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#5B4BDB]/10 to-[#141420]">
                  <div className="w-14 h-14 rounded-2xl glass-synthe flex items-center justify-center mb-3 group-hover:scale-110 transition duration-300">
                    <svg className="w-7 h-7 text-[#5B4BDB]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>
                    </svg>
                  </div>
                  <span className="text-[10px] font-black text-[#5B4BDB] uppercase tracking-widest">3D Model</span>
                  <span className="text-[9px] text-[#6B6B85] mt-0.5">{m.fileType?.toUpperCase()}</span>
                </div>
              )}

              {isWebXR && (
                <div className="absolute top-2 right-2">
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[#5B4BDB] text-white tracking-wider shadow-sm animate-pulse">
                    WebXR
                  </span>
                </div>
              )}

              <div className="absolute top-2 left-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-[#141420]/80 text-[#9494AD] border border-[#2A2A3E] backdrop-blur-sm">
                  {m.fileType?.toUpperCase()}
                </span>
              </div>

              <div className="absolute bottom-2 right-2">
                {m.isPaid
                  ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 shadow-sm backdrop-blur-sm">₹{m.price}</span>
                  : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#9494AD] border border-white/10 shadow-sm backdrop-blur-sm">Free</span>
                }
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <p className="font-bold text-white text-sm truncate mb-1">{m.title}</p>
              <p className="text-xs text-[#6B6B85] truncate">{m.authorName}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-[#6B6B85]">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  {(m.views ?? 0).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  {(m.downloads ?? 0).toLocaleString()}
                </span>
                {(m.engagementScore ?? 0) >= 70 && (
                  <span className="ml-auto text-amber-400 font-black text-[10px]">🔥 Trending</span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </GlowCard>
  );
}

export default function VersePage() {
  const [user, setUser]         = useState<any>(null);
  const [models, setModels]     = useState<Model[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filterType, setFilterType] = useState("All");
  const [sort, setSort]         = useState("engagementScore");
  const [search, setSearch]     = useState("");
  const [lastDoc, setLastDoc]   = useState<any>(null);
  const [hasMore, setHasMore]   = useState(true);
  const PAGE = 12;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  useEffect(() => { fetchModels(true); }, [filterType, sort]);

  const fetchModels = async (reset = false) => {
    setLoading(true);
    try {
      const allowed = ["glb", "gltf", "obj", "fbx"];
      const types = filterType === "All" ? allowed
        : filterType === "WebXR" ? ["glb", "gltf"]
        : [filterType.toLowerCase()];

      const q = query(
        collection(db, "models"),
        where("fileType", "in", types),
        where("status", "==", "published"),
        orderBy(sort, "desc"),
        ...(reset || !lastDoc ? [] : [startAfter(lastDoc)]),
        limit(PAGE)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Model));
      setModels(reset ? docs : prev => [...prev, ...docs]);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === PAGE);
    } catch (e) {
      console.error("fetchModels error:", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = search
    ? models.filter(m =>
        m.title?.toLowerCase().includes(search.toLowerCase()) ||
        m.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
    : models;

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans">

      {/* ═══ PARALLAX HEADER ═══ */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <VideoBackground variant="aurora" color="#5B4BDB" intensity={0.6} />
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5B4BDB]/10 border border-[#5B4BDB]/30 mb-6 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0eebe6] animate-pulse shadow-[0_0_10px_#0eebe6]" />
                <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">The 3D Verse</span>
              </span>
            </motion.div>

            <motion.h1
              className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-6 leading-none"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 100 }}
            >
              Discover <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C6EF6] via-[#0eebe6] to-white drop-shadow-[0_0_30px_rgba(124,110,246,0.3)]">
                Next-Gen 3D
              </span>
            </motion.h1>

            <motion.p
              className="text-[#9494AD] text-lg font-medium leading-relaxed max-w-xl"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            >
              Browse, buy, and sell pro-grade GLB, GLTF, OBJ, and FBX models. Real-time WebXR previews directly in your browser.
            </motion.p>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <MagneticButton href="/verse/upload" variant="primary">
              <span className="flex items-center gap-2 px-4 py-1 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                Upload Model
              </span>
            </MagneticButton>
          </motion.div>
        </div>
        
        {/* Subtle bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0F] to-transparent pointer-events-none" />
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-20 flex-grow w-full relative z-10 -mt-6">

        {/* Aura legend */}
        <div className="flex gap-4 mb-6">
          {[
            { label: "Trending (70+)", color: "bg-amber-400" },
            { label: "Popular (30–70)", color: "bg-violet-400" },
            { label: "New (0–30)", color: "bg-blue-400" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-[#6B6B85]">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} />{label}
            </div>
          ))}
        </div>

        {/* WebXR banner */}
        <div className="flex items-center gap-3 px-5 py-3 mb-6 rounded-2xl glass-synthe border border-[#5B4BDB]/20">
          <div className="w-8 h-8 rounded-xl bg-[#5B4BDB] flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(91,75,219,0.3)]">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2"/>
            </svg>
          </div>
          <div className="flex-1">
            <span className="text-sm font-black text-[#7C6EF6]">WebXR Ready Models</span>
            <span className="text-sm text-[#9494AD] ml-2">— GLB & GLTF models can be placed in your real environment via browser AR</span>
          </div>
          <button
            onClick={() => setFilterType("WebXR")}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#5B4BDB] text-white hover:bg-[#4c3ec7] transition-colors flex-shrink-0 shadow-[0_0_15px_rgba(91,75,219,0.2)]">
            Filter WebXR →
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B85]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search models..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#141420] border border-[#2A2A3E] rounded-xl text-sm text-white placeholder-[#6B6B85] focus:outline-none focus:border-[#5B4BDB]/60 transition-colors" />
          </div>

          <div className="flex gap-1 p-1 bg-[#141420] border border-[#2A2A3E] rounded-xl relative">
            {FILE_TYPES.map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === t
                    ? "bg-[#5B4BDB] text-white shadow-[0_0_15px_rgba(91,75,219,0.3)]"
                    : "text-[#6B6B85] hover:text-white"
                }`}>
                {t}
              </button>
            ))}
          </div>

          <select value={sort} onChange={e => setSort(e.target.value)}
            className="bg-[#141420] border border-[#2A2A3E] rounded-xl px-3 py-2.5 text-sm text-white font-semibold outline-none focus:border-[#5B4BDB]/60 transition-colors">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {loading && models.length === 0 ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-[#141420] border border-[#2A2A3E] overflow-hidden animate-pulse">
                  <div className="aspect-square bg-[#1A1A2E]" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-[#1A1A2E] rounded w-3/4" />
                    <div className="h-3 bg-[#1A1A2E] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-24">
              <div className="text-5xl mb-4">🧊</div>
              <p className="font-bold text-white mb-2">No models found</p>
              <p className="text-[#6B6B85] text-sm">Try a different filter or upload the first one</p>
            </motion.div>
          ) : (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {filtered.map((m, i) => <ModelCard key={m.id} m={m} i={i} />)}
              </div>
              {hasMore && !search && (
                <div className="flex justify-center mt-10">
                  <MagneticButton onClick={() => fetchModels(false)} variant="secondary">
                    {loading ? "Loading..." : "Load more"}
                  </MagneticButton>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}