"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
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
  { id: "all",     label: "All Models", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "#a78bfa", desc: "Everything" },
  { id: "3d",      label: "3D Models",  icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "#22d3ee", desc: "GLB · GLTF · OBJ · FBX" },
  { id: "ar",      label: "AR",         icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2", color: "#34d399", desc: "Augmented Reality" },
  { id: "vr",      label: "VR",         icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z", color: "#818cf8", desc: "Virtual Reality" },
  { id: "autocad", label: "AutoCAD",    icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18", color: "#fbbf24", desc: "DWG · DXF" },
];

const CATEGORIES = ["All", "Architecture", "Mechanical", "Character", "Environment", "Product", "Other"];
const SORT_OPTIONS = [
  { value: "newest",    label: "Newest" },
  { value: "popular",   label: "Most Viewed" },
  { value: "downloads", label: "Most Downloaded" },
];

const FILE_COLOR: Record<string, { text: string; bg: string; border: string }> = {
  glb:  { text: "text-violet-300", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  gltf: { text: "text-violet-300", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  obj:  { text: "text-cyan-300",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20"   },
  fbx:  { text: "text-cyan-300",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20"   },
  dwg:  { text: "text-amber-300",  bg: "bg-amber-500/10",  border: "border-amber-500/20"  },
  dxf:  { text: "text-amber-300",  bg: "bg-amber-500/10",  border: "border-amber-500/20"  },
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
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="aspect-[4/3] bg-white/[0.04] animate-pulse" />
        <div className="p-5 space-y-3">
          <div className="h-4 bg-white/[0.04] rounded-full animate-pulse w-3/4" />
          <div className="h-3 bg-white/[0.03] rounded-full animate-pulse w-1/2" />
          <div className="h-9 bg-white/[0.03] rounded-xl animate-pulse mt-4" />
        </div>
      </div>
    );
  }

  function ModelCard({ m, i }: { m: Model; i: number }) {
    const ext = m.fileType?.toLowerCase() ?? "";
    const fc = FILE_COLOR[ext] ?? FILE_COLOR.glb;
    const modeTag = isCAD(m) ? { label:"CAD", color:"#fbbf24" }
      : isAR(m)  ? { label:"AR",  color:"#34d399" }
      : isVR(m)  ? { label:"VR",  color:"#818cf8" }
      : null;

    // ✅ single merged style objects — no duplicate style props
    const ctaBtnStyle: React.CSSProperties = {
      willChange: "transform",
      background: m.isPaid
        ? "linear-gradient(135deg,#059669,#0891b2)"
        : "linear-gradient(135deg,#7c3aed,#0891b2)",
    };
    const shimmerStyle: React.CSSProperties = {
      willChange: "transform", position: "absolute", inset: 0,
      background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)",
      transform: "skewX(-20deg)", pointerEvents: "none",
    };

    return (
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:i*0.035 }}
        className="group relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-sm overflow-hidden hover:border-white/14 transition duration-300">
        <div className="relative aspect-[4/3] overflow-hidden bg-white/[0.03]">
          {m.thumbnailUrl ? (
            <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white/8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase ${fc.text} ${fc.bg} ${fc.border}`}>
              {ext.toUpperCase() || "3D"}
            </div>
            {modeTag && (
              <div className="px-2.5 py-1 rounded-lg border text-[10px] font-black"
                style={{ color:modeTag.color, background:`${modeTag.color}18`, borderColor:`${modeTag.color}35` }}>
                {modeTag.label}
              </div>
            )}
          </div>
          <div className="absolute top-3 right-3">
            {m.isPaid ? (
              <div className="px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 text-[10px] font-black">₹{m.price}</div>
            ) : (
              <div className="px-2.5 py-1 rounded-lg border border-white/10 bg-black/50 text-white/60 text-[10px] font-black backdrop-blur-sm">Free</div>
            )}
          </div>
          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
            <Link href={`/gallery/${m.id}`}>
              <motion.div whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} style={{ willChange:"transform" }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 border border-white/20 backdrop-blur-sm text-white text-xs font-bold cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </motion.div>
            </Link>
          </div>
        </div>
        <div className="p-5">
          <h3 className="text-white font-black text-sm leading-snug line-clamp-1 mb-1">{m.title}</h3>
          {m.description && <p className="text-white/35 text-xs leading-relaxed line-clamp-2 mb-3">{m.description}</p>}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                {m.authorPhoto
                  ? <img src={m.authorPhoto} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                  : <span className="text-white/30 text-[9px] font-black">{m.authorName?.[0]}</span>}
              </div>
              <span className="text-white/35 text-xs font-semibold truncate max-w-[100px]">{m.authorName}</span>
            </div>
            <div className="flex items-center gap-3 text-white/20 text-[10px]">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {m.views??0}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {m.downloads??0}
              </span>
            </div>
          </div>
          {m.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {m.tags.slice(0,3).map(t => (
                <span key={t} className="px-2 py-0.5 rounded-md bg-white/[0.04] text-white/25 text-[10px] border border-white/5">{t}</span>
              ))}
            </div>
          )}
          {/* ✅ CTA — single style prop, no duplicates */}
          <Link href={`/gallery/${m.id}`}>
            <motion.div whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} style={ctaBtnStyle}
              className="w-full py-3 rounded-2xl font-black text-white text-xs text-center relative overflow-hidden cursor-pointer">
              <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:5, ease:"linear" }} style={shimmerStyle} />
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                {m.isPaid ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    {m.accessType === "request" ? "Request Access" : `Buy ₹${m.price}`}
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    View & Download
                  </>
                )}
              </span>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />
      <div className="relative pt-28 pb-24 px-4 overflow-x-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
          style={{ background:`radial-gradient(ellipse,${activeMode.color}14 0%,transparent 70%)`, filter:"blur(80px)", transition:"background 0.5s" }} />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="mb-8">
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm mb-5">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-violet-300/90 text-sm font-semibold uppercase tracking-widest">Gallery</span>
            </motion.div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none">
                  {mode==="all"     ? <>3D Model <span style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#22d3ee,#fbbf24)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Gallery</span></>
                  : mode==="3d"     ? <><span style={{ backgroundImage:"linear-gradient(90deg,#22d3ee,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>3D</span> Models</>
                  : mode==="ar"     ? <>Augmented <span style={{ backgroundImage:"linear-gradient(90deg,#34d399,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Reality</span></>
                  : mode==="vr"     ? <>Virtual <span style={{ backgroundImage:"linear-gradient(90deg,#818cf8,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Reality</span></>
                  : <><span style={{ backgroundImage:"linear-gradient(90deg,#fbbf24,#fb7185)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>AutoCAD</span> Files</>}
                </h1>
                <p className="text-white/35 text-base mt-2">{loading ? "Loading…" : `${filtered.length} model${filtered.length!==1?"s":""} available`}</p>
              </motion.div>
              {user && (
                <Link href="/upload">
                  <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                    style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-white text-xs cursor-pointer relative overflow-hidden">
                    <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                      style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                    <svg className="w-3.5 h-3.5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    <span className="relative z-10">Upload Model</span>
                  </motion.div>
                </Link>
              )}
            </div>
          </div>

          {/* Mode tabs */}
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.15 }}
            className="flex gap-2 overflow-x-auto pb-1 mb-7 scrollbar-hide">
            {MODES.map(m => (
              <button key={m.id} onClick={() => changeMode(m.id)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-widest transition duration-200"
                style={mode===m.id
                  ? { background:`${m.color}18`, borderColor:`${m.color}45`, color:m.color }
                  : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)" }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={m.icon} />
                </svg>
                {m.label}
                {mode===m.id && (
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
                    style={{ background:`${m.color}30`, color:m.color }}>
                    {filterByMode(models, m.id).length}
                  </span>
                )}
              </button>
            ))}
          </motion.div>

          {/* Mode banner */}
          {mode !== "all" && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}
              className="flex items-center gap-3 p-4 rounded-2xl border mb-6"
              style={{ borderColor:`${activeMode.color}25`, background:`${activeMode.color}08` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:`${activeMode.color}20`, border:`1px solid ${activeMode.color}30` }}>
                <svg className="w-4 h-4" style={{ color:activeMode.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={activeMode.icon} />
                </svg>
              </div>
              <div>
                <p className="font-black text-xs" style={{ color:activeMode.color }}>{activeMode.label}</p>
                <p className="text-white/30 text-xs">{activeMode.desc} files</p>
              </div>
              {mode === "autocad" && (
                <Link href="/autocad" className="ml-auto">
                  {/* ✅ FIXED: single merged style prop */}
                  <motion.div whileHover={{ scale:1.03 }}
                    style={{ willChange:"transform", borderColor:"#fbbf2440", color:"#fbbf24", background:"#fbbf2410" }}
                    className="text-xs font-black px-3 py-1.5 rounded-xl border cursor-pointer transition duration-200">
                    AutoCAD Hub →
                  </motion.div>
                </Link>
              )}
            </motion.div>
          )}

          {/* Search + filters */}
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.2 }} className="mb-8">
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="relative flex-1 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-violet-400 transition duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search models, authors, tags…"
                  className="w-full bg-white/[0.03] border border-white/8 text-white placeholder-white/25 text-sm rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-violet-500/50 transition duration-200" />
                {search && (
                  <button onClick={()=>setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition duration-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
              <div className="relative">
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                  className="bg-white/[0.03] border border-white/8 text-white text-sm rounded-2xl px-4 py-3.5 pr-10 focus:outline-none focus:border-violet-500/50 transition duration-200 appearance-none cursor-pointer min-w-[160px]">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-[#0a0010]">{o.label}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <button onClick={()=>setShowFilters(v=>!v)}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold border transition duration-200 ${showFilters ? "border-violet-500/40 bg-violet-500/12 text-violet-300" : "border-white/8 bg-white/[0.03] text-white/50 hover:border-white/15"}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Filters
              </button>
            </div>
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} transition={{ duration:0.3 }} className="overflow-hidden">
                  <div className="p-5 rounded-2xl border border-white/6 bg-white/[0.02] space-y-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 mb-3">Category</p>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(c => (
                          <button key={c} onClick={()=>setCategory(c)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition duration-200 ${category===c ? "border-violet-500/40 bg-violet-500/15 text-violet-300" : "border-white/8 bg-white/[0.02] text-white/40 hover:border-white/15 hover:text-white/60"}`}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 mb-3">Pricing</p>
                      <div className="flex gap-2">
                        {(["all","free","paid"] as const).map(p => (
                          <button key={p} onClick={()=>setPriceFilter(p)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition duration-200 ${priceFilter===p ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : "border-white/8 bg-white/[0.02] text-white/40 hover:border-white/15 hover:text-white/60"}`}>
                            {p==="all"?"All":p==="free"?"🔓 Free":"💰 Paid"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={()=>{setCategory("All");setPriceFilter("all");setSearch("");}}
                      className="text-xs font-bold text-rose-400/70 hover:text-rose-300 transition duration-200">
                      ✕ Clear all filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({length:8}).map((_,i)=><Skeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 rounded-3xl border border-white/8 bg-white/[0.03] flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-white/60 font-black text-xl mb-2">No models found</h3>
              <p className="text-white/25 text-sm mb-6">
                {mode !== "all" ? `No ${activeMode.label} models yet. Be the first to upload!` : "Try adjusting your search or filters."}
              </p>
              {user && (
                <Link href="/upload">
                  <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                    style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                    className="px-6 py-3 rounded-2xl font-black text-white text-sm cursor-pointer">
                    Upload the First →
                  </motion.div>
                </Link>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
    <Suspense fallback={<div className="min-h-screen bg-[#050008]" />}>
      <GalleryContent />
    </Suspense>
  );
}