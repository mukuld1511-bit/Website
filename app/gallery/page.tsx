"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const dynamic = "force-dynamic";

interface Model {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  fileType: string;
  thumbnailUrl: string;
  modelUrl: string;
  isPaid: boolean;
  price: number;
  accessType: "free" | "request" | "purchase";
  authorId: string;
  authorName: string;
  authorPhoto: string;
  views: number;
  likes: number;
  downloads: number;
  uploadedAt: any;
}

type Mode = "all" | "3d" | "ar" | "vr" | "autocad";

const MODES: { id: Mode; label: string; icon: string; color: string; desc: string }[] = [
  { id: "all",     label: "All Models", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "blue", desc: "Everything" },
  { id: "3d",      label: "3D Models",  icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "cyan", desc: "GLB · GLTF · OBJ · FBX" },
  { id: "ar",      label: "AR",         icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2", color: "emerald", desc: "Augmented Reality" },
  { id: "vr",      label: "VR",         icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z", color: "indigo", desc: "Virtual Reality" },
  { id: "autocad", label: "AutoCAD",    icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18", color: "amber", desc: "DWG · DXF" },
];

const CATEGORIES = ["All", "Architecture", "Mechanical", "Character", "Environment", "Product", "Other"];
const SORT_OPTIONS = [
  { value: "newest",    label: "Sort: Newest" },
  { value: "popular",   label: "Sort: Most Viewed" },
  { value: "downloads", label: "Sort: Most Downloaded" },
];

const FILE_COLOR: Record<string, { text: string; bg: string; border: string }> = {
  glb:  { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  gltf: { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  obj:  { text: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200" },
  fbx:  { text: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200" },
  dwg:  { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  dxf:  { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
};

const AR_TAGS  = ["ar", "augmented reality", "arcore", "arkit", "vuforia", "spark ar", "8thwall"];
const VR_TAGS  = ["vr", "virtual reality", "oculus", "webxr", "metaverse", "quest", "steamvr", "htc vive"];
const CAD_EXTS = ["dwg", "dxf"];
const D3_EXTS  = ["glb", "gltf", "obj", "fbx"];

function isAR(m: Model)  { return m.tags?.some(t => AR_TAGS.includes(t.toLowerCase())); }
function isVR(m: Model)  { return m.tags?.some(t => VR_TAGS.includes(t.toLowerCase())); }
function isCAD(m: Model) { return CAD_EXTS.includes(m.fileType?.toLowerCase()); }
function is3D(m: Model)  { return D3_EXTS.includes(m.fileType?.toLowerCase()) && !isAR(m) && !isVR(m); }

function filterByMode(models: Model[], mode: Mode): Model[] {
  if (mode === "all")     return models;
  if (mode === "3d")      return models.filter(is3D);
  if (mode === "ar")      return models.filter(isAR);
  if (mode === "vr")      return models.filter(isVR);
  if (mode === "autocad") return models.filter(isCAD);
  return models;
}

function GalleryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const modeParam = (searchParams.get("mode") ?? "all") as Mode;

  const [models,      setModels]      = useState<Model[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [user,        setUser]        = useState<any>(null);
  const [mode,        setMode]        = useState<Mode>(modeParam);
  const [search,      setSearch]      = useState("");
  const [category,    setCategory]    = useState("All");
  const [priceFilter, setPriceFilter] = useState<"all"|"free"|"paid">("all");
  const [sortBy,      setSortBy]      = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetchModels() {
      setLoading(true);
      try {
        const q = query(collection(db,"models"), orderBy("uploadedAt","desc"));
        const snap = await getDocs(q);
        setModels(snap.docs.map(d => ({ id:d.id, ...d.data() } as Model)));
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    fetchModels();
  }, []);

  function changeMode(m: Mode) {
    setMode(m);
    router.replace(m === "all" ? "/gallery" : `/gallery?mode=${m}`, { scroll: false });
  }

  const filtered = (() => {
    let out = filterByMode(models, mode);
    if (search.trim()) {
      const s = search.toLowerCase();
      out = out.filter(m =>
        m.title?.toLowerCase().includes(s) ||
        m.description?.toLowerCase().includes(s) ||
        m.authorName?.toLowerCase().includes(s) ||
        m.tags?.some(t => t.toLowerCase().includes(s))
      );
    }
    if (category !== "All") out = out.filter(m => m.category === category);
    if (priceFilter === "free") out = out.filter(m => !m.isPaid);
    if (priceFilter === "paid") out = out.filter(m =>  m.isPaid);
    out.sort((a, b) => {
      if (sortBy === "newest")    return (b.uploadedAt?.seconds??0) - (a.uploadedAt?.seconds??0);
      if (sortBy === "popular")   return (b.views??0)     - (a.views??0);
      if (sortBy === "downloads") return (b.downloads??0) - (a.downloads??0);
      return 0;
    });
    return out;
  })();

  const activeMode = MODES.find(m => m.id === mode)!;

  function Skeleton() {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
        <div className="p-6 space-y-4">
          <div className="h-4 bg-gray-200 rounded-full animate-pulse w-3/4" />
          <div className="h-3 bg-gray-100 rounded-full animate-pulse w-1/2" />
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse mt-4" />
        </div>
      </div>
    );
  }

  function ModelCard({ m, i }: { m: Model; i: number }) {
    const ext = m.fileType?.toLowerCase() ?? "";
    const fc = FILE_COLOR[ext] ?? FILE_COLOR.glb;
    const modeTag = isCAD(m) ? { label:"CAD", color:"amber" }
      : isAR(m)  ? { label:"AR",  color:"emerald" }
      : isVR(m)  ? { label:"VR",  color:"indigo" }
      : null;

    return (
      <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-50px" }}
        transition={{ duration:0.5, delay: i * 0.05 }} whileHover={{ y: -4 }}
        className="group relative rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition duration-300 overflow-hidden flex flex-col h-full">

        <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 border-b border-gray-100">
          {m.thumbnailUrl ? (
            <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
          
          <div className="absolute top-3 left-3 flex gap-2">
            <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase shadow-sm ${fc.text} ${fc.bg} ${fc.border}`}>
              {ext.toUpperCase() || "3D"}
            </div>
            {modeTag && (
              <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-black shadow-sm bg-${modeTag.color}-50 text-${modeTag.color}-700 border-${modeTag.color}-200`}>
                {modeTag.label}
              </div>
            )}
          </div>
          
          <div className="absolute top-3 right-3">
            {m.isPaid ? (
              <div className="px-2.5 py-1 rounded-lg border border-green-200 bg-green-50 text-green-700 text-[10px] font-black shadow-sm">₹{m.price}</div>
            ) : (
              <div className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 text-[10px] font-black shadow-sm">Free</div>
            )}
          </div>
          
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
            <Link href={`/gallery/${m.id}`}>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm font-bold shadow-lg hover:scale-105 transition">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview Mode
              </button>
            </Link>
          </div>
        </div>
        
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-gray-900 font-extrabold text-lg leading-snug line-clamp-1 mb-1.5">{m.title}</h3>
          {m.description && <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-4 font-medium">{m.description}</p>}
          
          <div className="flex items-center justify-between mb-5 mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
                {m.authorPhoto
                  ? <img src={m.authorPhoto} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                  : <span className="text-gray-500 text-[9px] font-bold">{m.authorName?.[0]}</span>}
              </div>
              <span className="text-gray-600 text-xs font-semibold truncate max-w-[100px]">{m.authorName}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400 text-xs font-semibold">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {m.views??0}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {m.downloads??0}
              </span>
            </div>
          </div>
          
          {m.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {m.tags.slice(0,3).map(t => (
                <span key={t} className="px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 font-bold text-[10px] border border-gray-200">{t}</span>
              ))}
            </div>
          )}
          
          <Link href={`/gallery/${m.id}`}>
            <button className={`w-full py-3.5 rounded-xl font-bold text-sm text-center transition shadow-sm border ${
              m.isPaid ? 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50' : 'bg-blue-600 text-white border-transparent hover:bg-blue-700'
            }`}>
              <span className="flex items-center justify-center gap-2">
                {m.isPaid ? (
                  <>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    {m.accessType === "request" ? "Request Access" : `Buy for ₹${m.price}`}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download Free
                  </>
                )}
              </span>
            </button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans flex flex-col">
      <Navbar />
      <div className="flex-grow pt-[100px] pb-24 px-4 overflow-x-hidden relative z-10">

        <div className="max-w-7xl mx-auto flex flex-col items-center">
          
          {/* Centered Large Search & Filters */}
          <div className="w-full max-w-3xl text-center mb-10 mt-6">
            <motion.h1 initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none mb-6">
              {mode==="all"     ? "3D Model Gallery"
              : mode==="3d"     ? "3D Models"
              : mode==="ar"     ? "Augmented Reality"
              : mode==="vr"     ? "Virtual Reality"
              : "AutoCAD Files"}
            </motion.h1>

            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }} className="relative w-full max-w-2xl mx-auto mb-6">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search models, authors, tags…"
                className="w-full bg-[#1A1A1A] border border-gray-800 text-white placeholder-gray-500 text-sm md:text-base rounded-2xl pl-12 pr-10 py-4 focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/50 focus:border-[#5B4BDB] transition shadow-inner" />
              {search && (
                <button onClick={()=>setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </motion.div>

            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.5, delay:0.2 }} className="flex flex-wrap items-center justify-center gap-2">
              <button onClick={()=>setCategory("All")} className={`px-4 py-2 rounded-full text-xs font-bold transition border ${category==="All" ? "bg-[#5B4BDB] text-white border-transparent" : "bg-[#141414] text-gray-400 border-gray-800 hover:bg-[#1A1A1A] hover:text-gray-300"}`}>All</button>
              <button onClick={()=>setCategory("Architecture")} className={`px-4 py-2 rounded-full text-xs font-bold transition border ${category==="Architecture" ? "bg-[#5B4BDB] text-white border-transparent" : "bg-[#141414] text-gray-400 border-gray-800 hover:bg-[#1A1A1A] hover:text-gray-300"}`}>Architecture</button>
              <button onClick={()=>setCategory("Vehicles")} className={`px-4 py-2 rounded-full text-xs font-bold transition border ${category==="Vehicles" ? "bg-[#5B4BDB] text-white border-transparent" : "bg-[#141414] text-gray-400 border-gray-800 hover:bg-[#1A1A1A] hover:text-gray-300"}`}>Vehicles</button>
              <button onClick={()=>setCategory("Character")} className={`px-4 py-2 rounded-full text-xs font-bold transition border ${category==="Character" ? "bg-[#5B4BDB] text-white border-transparent" : "bg-[#141414] text-gray-400 border-gray-800 hover:bg-[#1A1A1A] hover:text-gray-300"}`}>Characters</button>
              <button onClick={()=>setCategory("Environment")} className={`px-4 py-2 rounded-full text-xs font-bold transition border ${category==="Environment" ? "bg-[#5B4BDB] text-white border-transparent" : "bg-[#141414] text-gray-400 border-gray-800 hover:bg-[#1A1A1A] hover:text-gray-300"}`}>Environment</button>
            </motion.div>

            <div className="mt-8 flex items-center justify-between w-full max-w-7xl mx-auto border-t border-gray-800 pt-6">
              <p className="text-gray-500 font-medium text-sm">
                {loading ? "Loading…" : `${filtered.length} model${filtered.length!==1?"s":""}`}
              </p>
              
              <div className="flex items-center gap-3">
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                  className="bg-[#141414] border border-gray-800 text-gray-300 font-bold text-xs rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#5B4BDB] appearance-none cursor-pointer">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {user && (
                  <Link href="/upload">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-xs bg-[#5B4BDB] hover:bg-[#4a3bc7] transition">
                      Upload
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="w-full">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({length:8}).map((_,i) => (
                  <div key={i} className="rounded-2xl border border-gray-800 bg-[#141414] overflow-hidden">
                    <div className="aspect-[4/3] bg-gray-800/50 animate-pulse" />
                    <div className="p-5 space-y-4">
                      <div className="h-4 bg-gray-800 rounded-full animate-pulse w-3/4" />
                      <div className="h-3 bg-gray-800/50 rounded-full animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="flex flex-col items-center justify-center py-20 text-center w-full max-w-lg mx-auto bg-[#141414] rounded-3xl border border-gray-800">
                <svg className="w-12 h-12 text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-white font-bold text-xl mb-2">No models found <span className="text-gray-500">matching your search.</span></h3>
                <div className="flex gap-4 mt-6">
                  {(search || category !== "All" || priceFilter !== "all") && (
                    <button onClick={()=>{setCategory("All");setPriceFilter("all");setSearch("");}}
                      className="px-6 py-2.5 rounded-xl bg-gray-800 text-gray-300 font-bold hover:bg-gray-700 transition text-sm">
                      Clear Filters
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
                {filtered.map((m,i)=>(
                  <motion.div key={m.id} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-50px" }}
                    transition={{ duration:0.4, delay: i * 0.05 }}
                    className="group relative rounded-2xl border border-gray-800 bg-[#141414] hover:shadow-[0_0_20px_rgba(91,75,219,0.3)] hover:border-[#5B4BDB]/50 transition duration-300 overflow-hidden flex flex-col h-full hover:-translate-y-1">

                    <div className="relative aspect-[4/3] overflow-hidden bg-[#0A0A0A] border-b border-gray-800">
                      {m.thumbnailUrl ? (
                        <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80 group-hover:opacity-100" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                      )}
                      
                      <div className="absolute top-3 left-3 flex gap-2">
                        <div className="px-2.5 py-1 rounded bg-[#0A0A0A]/80 backdrop-blur-sm border border-gray-700 text-[9px] font-black uppercase text-gray-300">
                          {m.fileType?.toUpperCase() || "3D"}
                        </div>
                      </div>
                      
                      <div className="absolute top-3 right-3">
                        {m.isPaid ? (
                          <div className="px-2.5 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold">₹{m.price}</div>
                        ) : (
                          <div className="px-2.5 py-1 rounded bg-white/10 border border-white/20 text-white text-[10px] font-bold">Free</div>
                        )}
                      </div>
                      
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                        <Link href={`/gallery/${m.id}`}>
                          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B4BDB] text-white text-sm font-bold shadow-lg hover:scale-105 transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Preview
                          </button>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1 relative">
                      <h3 className="text-white font-bold text-base leading-snug line-clamp-1 mb-1">{m.title}</h3>
                      <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-4">
                        <span>by {m.authorName || "Anonymous"}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800 text-gray-500 text-xs font-semibold">
                        <span className="flex items-center gap-1.5 hover:text-gray-300 transition">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          {m.views??0}
                        </span>
                        <span className="flex items-center gap-1.5 hover:text-gray-300 transition">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          {m.downloads??0}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <GalleryContent />
    </Suspense>
  );
}