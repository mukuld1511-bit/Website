"use client";
import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, limit, startAfter } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface XRProject {
  id: string; title: string; thumbnailUrl: string; category: string;
  isPaid: boolean; price: number; authorName: string; authorPhoto: string;
  description: string; tags: string[]; views: number; downloads: number;
  platforms: string[]; genre: string; version: string; engagementScore: number; uploadedAt: any;
}

type Tab = "AR" | "VR";
const SORT_OPTIONS = [
  { label: "Newest",    value: "uploadedAt"      },
  { label: "Popular",   value: "engagementScore" },
  { label: "Downloads", value: "downloads"       },
];
const AR_GENRES = ["All", "Professional", "Education", "AR Tool", "Utility", "Industrial", "Enterprise"];
const VR_GENRES = ["All", "VR Showcase", "Simulation", "Professional", "Education", "Enterprise"];

function ProjectCard({ p, tab }: { p: XRProject; tab: Tab }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Link href={`/gallery/${p.id}`}>
        <div className={`group bg-white rounded-2xl border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${tab === "AR" ? "border-teal-100 hover:border-teal-300" : "border-violet-100 hover:border-violet-300"}`}>
          <div className="relative aspect-video overflow-hidden bg-gray-900 flex items-center justify-center">
            {p.thumbnailUrl
              ? <img src={p.thumbnailUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90" />
              : <div className="text-5xl">{tab === "AR" ? "📱" : "🥽"}</div>
            }
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tab === "AR" ? "bg-teal-500 text-white" : "bg-violet-600 text-white"}`}>
                {p.category}
              </span>
              {p.isPaid
                ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">₹{p.price}</span>
                : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">Free</span>
              }
            </div>
          </div>
          <div className="p-4">
            <p className="font-bold text-gray-900 text-sm truncate mb-1">{p.title}</p>
            <p className="text-xs text-gray-400 truncate mb-2">{p.authorName}</p>
            {p.genre && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{p.genre}</span>}
            {p.platforms?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {p.platforms.slice(0, 3).map(pl => (
                  <span key={pl} className="text-[10px] bg-gray-50 border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded">{pl}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
              <span>👁 {p.views ?? 0}</span>
              <span>⬇ {p.downloads ?? 0}</span>
              {p.version && <span className="ml-auto text-gray-300">v{p.version}</span>}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function XRZonePage() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("AR");
  const [projects, setProjects] = useState<XRProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("uploadedAt");
  const [genre, setGenre] = useState("All");
  const [search, setSearch] = useState("");
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE = 12;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  useEffect(() => { setGenre("All"); fetchProjects(true); }, [tab, sort]);
  useEffect(() => { if (genre !== "All") fetchProjects(true); }, [genre]);

  const fetchProjects = async (reset = false) => {
    setLoading(true);
    try {
      const category = tab === "AR" ? "AR Build" : "VR Build";
      const q = query(
        collection(db, "models"),
        where("category", "==", category),
        where("status", "==", "published"),
        orderBy(sort, "desc"),
        ...(reset || !lastDoc ? [] : [startAfter(lastDoc)]),
        limit(PAGE)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as XRProject));
      const filtered = genre !== "All" ? docs.filter(p => p.genre === genre) : docs;
      setProjects(reset ? filtered : prev => [...prev, ...filtered]);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === PAGE);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const displayed = search
    ? projects.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()) || p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())))
    : projects;

  const genres = tab === "AR" ? AR_GENRES : VR_GENRES;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans">
      <Navbar />

      {/* Hero */}
      <div className="relative border-b border-gray-800 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="max-w-7xl mx-auto px-6 py-14 relative">
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full">XR Zone</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white mb-2">AR & VR Marketplace</h1>
              <p className="text-gray-400 max-w-xl">Buy, sell and discover immersive AR and VR applications built by real creators.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/xr-zone/ar/upload">
                <button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all border-b-[3px] active:translate-y-[1px] ${tab === "AR" ? "bg-teal-500 hover:bg-teal-400 text-white border-teal-700" : "bg-white/10 hover:bg-white/20 text-white border-white/20"}`}>
                  Upload AR
                </button>
              </Link>
              <Link href="/xr-zone/vr/upload">
                <button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all border-b-[3px] active:translate-y-[1px] ${tab === "VR" ? "bg-violet-500 hover:bg-violet-400 text-white border-violet-700" : "bg-white/10 hover:bg-white/20 text-white border-white/20"}`}>
                  Upload VR
                </button>
              </Link>
            </div>
          </div>

          {/* AR / VR tabs */}
          <div className="flex gap-2 mt-8">
            {(["AR", "VR"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                  tab === t
                    ? t === "AR" ? "bg-teal-500 text-white" : "bg-violet-600 text-white"
                    : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
                }`}>
                <span>{t === "AR" ? "📱" : "🥽"}</span>
                {t === "AR" ? "Augmented Reality" : "Virtual Reality"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 flex-grow w-full">

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab} projects...`}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors" />
          </div>

          <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
            {genres.map(g => (
              <button key={g} onClick={() => setGenre(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${genre === g ? "bg-white text-gray-900" : "text-gray-400 hover:text-white"}`}>
                {g}
              </button>
            ))}
          </div>

          <select value={sort} onChange={e => setSort(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 font-semibold outline-none focus:border-white/30 transition-colors">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Grid */}
        {loading && projects.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden animate-pulse">
                <div className="aspect-video bg-white/5" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">{tab === "AR" ? "📱" : "🥽"}</div>
            <p className="font-bold text-white mb-2">No {tab} projects yet</p>
            <p className="text-gray-500 text-sm mb-6">Be the first to upload one</p>
            <Link href={tab === "AR" ? "/xr-zone/ar/upload" : "/xr-zone/vr/upload"}>
              <button className={`px-6 py-3 rounded-xl font-bold text-sm text-white ${tab === "AR" ? "bg-teal-500 hover:bg-teal-400" : "bg-violet-600 hover:bg-violet-500"} transition-colors`}>
                Upload {tab} project
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {displayed.map(p => <ProjectCard key={p.id} p={p} tab={tab} />)}
            </div>
            {hasMore && !search && (
              <div className="flex justify-center mt-10">
                <button onClick={() => fetchProjects(false)} disabled={loading}
                  className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-sm transition-colors disabled:opacity-50">
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