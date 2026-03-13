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
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar />
      <div className="flex-grow pt-[100px] pb-24 px-4 overflow-x-hidden">

        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-10 mt-6 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-800 shadow-sm mb-5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest">Gallery</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 leading-none">
                {mode==="all"     ? "3D Model Gallery"
                : mode==="3d"     ? "3D Models"
                : mode==="ar"     ? "Augmented Reality"
                : mode==="vr"     ? "Virtual Reality"
                : "AutoCAD Files"}
              </h1>
              <p className="text-gray-500 font-medium text-lg mt-4">
                {loading ? "Loading…" : `${filtered.length} model${filtered.length!==1?"s":""} available`}
              </p>
            </motion.div>

            {user && (
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }} className="flex justify-center">
                <Link href="/upload">
                  <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white text-sm bg-blue-600 hover:bg-blue-700 shadow-sm transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    Upload Model
                  </button>
                </Link>
              </motion.div>
            )}
          </div>

          {/* Mode tabs */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.15 }}
            className="flex gap-3 overflow-x-auto pb-2 mb-8 scrollbar-hide">
            {MODES.map(m => (
              <button key={m.id} onClick={() => changeMode(m.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl border text-xs font-bold uppercase tracking-widest transition shadow-sm whitespace-nowrap ${
                  mode === m.id ? `bg-${m.color}-50 border-${m.color}-200 text-${m.color}-700 ring-1 ring-${m.color}-200` : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={m.icon} />
                </svg>
                {m.label}
                {mode===m.id && (
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-${m.color}-100 text-${m.color}-800`}>
                    {filterByMode(models, m.id).length}
                  </span>
                )}
              </button>
            ))}
          </motion.div>

          {/* Mode banner */}
          {mode !== "all" && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} transition={{ duration:0.3 }}
              className={`flex items-center gap-4 p-5 rounded-2xl border mb-8 bg-${activeMode.color}-50 border-${activeMode.color}-100 shadow-sm`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white border border-${activeMode.color}-100`}>
                <svg className={`w-5 h-5 text-${activeMode.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activeMode.icon} />
                </svg>
              </div>
              <div>
                <p className={`font-extrabold text-sm text-${activeMode.color}-800`}>{activeMode.label}</p>
                <p className={`text-${activeMode.color}-600 font-medium text-xs mt-0.5`}>{activeMode.desc} files</p>
              </div>
              {mode === "autocad" && (
                <Link href="/autocad" className="ml-auto">
                  <button className="text-xs font-bold px-4 py-2 rounded-xl border bg-white border-amber-200 text-amber-700 hover:bg-amber-100 transition shadow-sm whitespace-nowrap">
                    AutoCAD Hub →
                  </button>
                </Link>
              )}
            </motion.div>
          )}

          {/* Search + filters */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.2 }} className="mb-10 bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search models, authors, tags…"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm md:text-base rounded-2xl pl-12 pr-10 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-inner" />
                {search && (
                  <button onClick={()=>setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition bg-white rounded-full p-1 shadow-sm border border-gray-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
              
              <div className="relative">
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-700 font-bold text-sm md:text-base rounded-2xl pl-5 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer w-full sm:min-w-[200px] shadow-sm">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              
              <button onClick={()=>setShowFilters(v=>!v)}
                className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold border transition duration-200 whitespace-nowrap shadow-sm ${showFilters ? "border-blue-200 bg-blue-50 text-blue-700 ring-1 ring-blue-200" : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Filters
                {(category !== "All" || priceFilter !== "all") && <span className="w-2 h-2 rounded-full bg-blue-600 ml-1"></span>}
              </button>
            </div>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} transition={{ duration:0.3 }} className="overflow-hidden">
                  <div className="p-6 mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 space-y-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Category</p>
                      <div className="flex flex-wrap gap-2.5">
                        {CATEGORIES.map(c => (
                          <button key={c} onClick={()=>setCategory(c)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition duration-200 ${category===c ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"}`}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Pricing</p>
                      <div className="flex gap-2.5">
                        {(["all","free","paid"] as const).map(p => (
                          <button key={p} onClick={()=>setPriceFilter(p)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition duration-200 ${priceFilter===p ? "border-green-600 bg-green-600 text-white shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"}`}>
                            {p==="all"?"All Pricing":p==="free"?"🔓 Free Only":"💰 Paid Only"}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-2">
                       <button onClick={()=>{setCategory("All");setPriceFilter("all");setSearch("");}}
                         className="text-xs font-bold text-gray-500 hover:text-gray-800 transition underline">
                         Reset all filters
                       </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({length:8}).map((_,i)=><Skeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-gray-200 shadow-sm">
              <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-gray-900 font-extrabold text-2xl mb-2">No models found</h3>
              <p className="text-gray-500 text-base mb-8 max-w-sm">
                {mode !== "all" ? `No ${activeMode.label} models yet. Be the first to upload!` : "Try adjusting your search or filters."}
              </p>
              
              <div className="flex gap-4">
                {(search || category !== "All" || priceFilter !== "all") && (
                  <button onClick={()=>{setCategory("All");setPriceFilter("all");setSearch("");}}
                    className="px-6 py-3.5 rounded-xl bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 transition shadow-sm">
                    Clear Filters
                  </button>
                )}
                
                {user && (
                  <Link href="/upload">
                    <button className="px-6 py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-sm">
                      Upload the First
                    </button>
                  </Link>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
              {filtered.map((m,i)=><ModelCard key={m.id} m={m} i={i} />)}
            </div>
          )}
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