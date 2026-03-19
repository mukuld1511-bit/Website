"use client";
import { useState, useEffect, useRef } from "react";
import { collection, query, where, orderBy, getDocs, limit, startAfter } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
const TYPE_COLORS: Record<string, string> = {
  glb: "bg-blue-100 text-blue-700", gltf: "bg-blue-100 text-blue-700",
  obj: "bg-teal-100 text-teal-700", fbx: "bg-violet-100 text-violet-700",
};
const AURA: Record<string, string> = {
  hot:  "shadow-[0_0_0_2px_#EF9F27]",
  mid:  "shadow-[0_0_0_2px_#7F77DD]",
  cold: "shadow-[0_0_0_2px_#378ADD]",
};
function aura(score: number) {
  if (score >= 70) return AURA.hot;
  if (score >= 30) return AURA.mid;
  return AURA.cold;
}

function ModelCard({ m }: { m: Model }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}>
      <Link href={`/gallery/${m.id}`}>
        <div className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${aura(m.engagementScore ?? 0)}`}>
          <div className="relative aspect-square overflow-hidden bg-gray-50 flex items-center justify-center">
            {m.thumbnailUrl
              ? <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              : <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
            }
            {(m.fileType?.toLowerCase()==="glb"||m.fileType?.toLowerCase()==="gltf") && (
              <div className="absolute top-2 right-2">
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[#5B4BDB] text-white tracking-wider">WebXR</span>
              </div>
            )}
            <div className="absolute top-2 left-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${TYPE_COLORS[m.fileType?.toLowerCase()] ?? "bg-gray-100 text-gray-600"}`}>
                {m.fileType?.toUpperCase()}
              </span>
            </div>
            <div className="absolute top-2 right-2">
              {m.isPaid
                ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">₹{m.price}</span>
                : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Free</span>
              }
            </div>
          </div>
          <div className="p-4">
            <p className="font-bold text-gray-900 text-sm truncate mb-1">{m.title}</p>
            <p className="text-xs text-gray-400 truncate">{m.authorName}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                {m.views ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                {m.downloads ?? 0}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function VersePage() {
  const [user, setUser] = useState<any>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("All");
  const [sort, setSort] = useState("uploadedAt");
  const [search, setSearch] = useState("");
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE = 12;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  useEffect(() => { fetchModels(true); }, [filterType, sort]);

  const fetchModels = async (reset = false) => {
    setLoading(true);
    try {
      const allowed = ["glb","gltf","obj","fbx"];
      const types = filterType === "All" ? allowed : [filterType.toLowerCase()];
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
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = search
    ? models.filter(m => m.title?.toLowerCase().includes(search.toLowerCase()) || m.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())))
    : models;

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-14 flex-grow w-full">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-600 bg-violet-50 border border-violet-200 px-3 py-1 rounded-full">3D Verse</span>
          </div>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">3D Model Marketplace</h1>
              <p className="text-gray-500">Browse, buy and sell GLB, GLTF, OBJ and FBX models.</p>
            </div>
            <Link href="/verse/upload">
              <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm transition-all border-b-[3px] border-black/30 active:translate-y-[1px]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                Upload model
              </button>
            </Link>
          </div>
        </div>

        {/* Aura legend */}
        <div className="flex gap-4 mb-6">
          {[
            { label: "Trending (70+)", color: "bg-amber-400" },
            { label: "Popular (30–70)", color: "bg-violet-400" },
            { label: "New (0–30)", color: "bg-blue-400" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} />{label}
            </div>
          ))}
        </div>

        {/* WebXR banner */}
        <div className="flex items-center gap-3 px-5 py-3 mb-6 rounded-2xl bg-gradient-to-r from-[#5B4BDB]/10 to-violet-50 border border-[#5B4BDB]/20">
          <div className="w-8 h-8 rounded-xl bg-[#5B4BDB] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2"/>
            </svg>
          </div>
          <div className="flex-1">
            <span className="text-sm font-black text-[#5B4BDB]">WebXR Ready Models</span>
            <span className="text-sm text-gray-500 ml-2">— GLB & GLTF models can be placed in your real environment via browser AR</span>
          </div>
          <button onClick={()=>setFilterType("WebXR")} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#5B4BDB] text-white hover:bg-[#4c3ec7] transition-colors flex-shrink-0">
            Filter WebXR →
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search models..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-violet-400 transition-colors" />
          </div>

          {/* File type tabs */}
          <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-xl">
            {FILE_TYPES.map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === t ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-800"}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 font-semibold outline-none focus:border-violet-400 transition-colors">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Grid */}
        {loading && models.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🧊</div>
            <p className="font-bold text-gray-900 mb-2">No models found</p>
            <p className="text-gray-400 text-sm">Try a different filter or upload the first one</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {filtered.map(m => <ModelCard key={m.id} m={m} />)}
            </div>
            {hasMore && !search && (
              <div className="flex justify-center mt-10">
                <button onClick={() => fetchModels(false)} disabled={loading}
                  className="px-8 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50">
                  {loading ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}