"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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
  accessType: "free"|"request"|"purchase";
  authorId: string;
  authorName: string;
  authorPhoto: string;
  views: number;
  downloads: number;
  uploadedAt: any;
}

const CAD_CATEGORIES = ["All","Architecture","Mechanical","Structural","Electrical","Plumbing","Interior","Civil","Other"];

const CAD_FEATURES = [
  { icon:"M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18", title:"DWG Files", desc:"Industry-standard AutoCAD drawing files, ready to open in AutoCAD, BricsCAD or LibreCAD.", color:"#fbbf24" },
  { icon:"M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z", title:"DXF Format", desc:"Universal exchange format compatible with virtually all CAD software including CATIA and SolidWorks.", color:"#fb7185" },
  { icon:"M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2", title:"Verified Drawings", desc:"All CAD files are reviewed for layer structure, scale accuracy, and drawing standards compliance.", color:"#34d399" },
];

export default function AutoCADPage() {
  const [models,      setModels]      = useState<Model[]>([]);
  const [filtered,    setFiltered]    = useState<Model[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [user,        setUser]        = useState<any>(null);
  const [search,      setSearch]      = useState("");
  const [category,    setCategory]    = useState("All");
  const [fileType,    setFileType]    = useState<"all"|"dwg"|"dxf">("all");
  const [priceFilter, setPriceFilter] = useState<"all"|"free"|"paid">("all");
  const [sortBy,      setSortBy]      = useState("newest");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const q = query(collection(db,"models"), where("status","==","published"), orderBy("uploadedAt","desc"));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id:d.id, ...d.data() } as Model));
        const cad = all.filter(m => ["dwg","dxf"].includes(m.fileType?.toLowerCase()));
        setModels(cad);
        setFiltered(cad);
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    fetch();
  }, []);

  useEffect(() => {
    let out = [...models];
    if (search.trim()) {
      const s = search.toLowerCase();
      out = out.filter(m =>
        m.title?.toLowerCase().includes(s) ||
        m.description?.toLowerCase().includes(s) ||
        m.tags?.some(t => t.toLowerCase().includes(s))
      );
    }
    if (category !== "All") out = out.filter(m => m.category === category);
    if (fileType !== "all")  out = out.filter(m => m.fileType?.toLowerCase() === fileType);
    if (priceFilter==="free") out = out.filter(m => !m.isPaid);
    if (priceFilter==="paid") out = out.filter(m =>  m.isPaid);
    out.sort((a,b) => {
      if (sortBy==="newest")    return (b.uploadedAt?.seconds??0)-(a.uploadedAt?.seconds??0);
      if (sortBy==="popular")   return (b.views??0)-(a.views??0);
      if (sortBy==="downloads") return (b.downloads??0)-(a.downloads??0);
      return 0;
    });
    setFiltered(out);
  }, [search, category, fileType, priceFilter, sortBy, models]);

  function Skeleton() {
    return (
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="aspect-video bg-white/[0.04] animate-pulse" />
        <div className="p-5 space-y-3">
          <div className="h-4 bg-white/[0.04] rounded-full animate-pulse w-3/4" />
          <div className="h-3 bg-white/[0.03] rounded-full animate-pulse w-1/2" />
          <div className="h-9 bg-white/[0.03] rounded-xl animate-pulse mt-4" />
        </div>
      </div>
    );
  }

  function CADCard({ m, i }: { m:Model; i:number }) {
    const isDWG = m.fileType?.toLowerCase() === "dwg";
    const badgeColor = isDWG ? "#fbbf24" : "#fb7185";

    const ctaStyle: React.CSSProperties = {
      willChange: "transform",
      background: m.isPaid ? "linear-gradient(135deg,#d97706,#dc2626)" : "linear-gradient(135deg,#d97706,#0891b2)",
    };

    return (
      <motion.div
        initial={{ opacity:0, y:20 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.4, delay:i*0.04 }}
        className="group relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-sm overflow-hidden hover:border-amber-500/20 transition duration-300"
      >
        <div className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background:"linear-gradient(90deg,transparent,rgba(251,191,36,0.3),transparent)" }} />

        {/* thumbnail / CAD preview */}
        <div className="relative aspect-video overflow-hidden bg-white/[0.03]">
          {m.thumbnailUrl ? (
            <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background:"linear-gradient(135deg,rgba(251,191,36,0.04),rgba(0,0,0,0))" }}>
              <svg className="w-12 h-12" style={{ color:"rgba(251,191,36,0.2)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
              <p className="text-amber-400/30 text-xs font-bold">{m.fileType?.toUpperCase()} Drawing</p>
            </div>
          )}

          <div className="absolute top-3 left-3">
            <div className="px-2.5 py-1 rounded-lg border text-[10px] font-black"
              style={{ color:badgeColor, background:`${badgeColor}18`, borderColor:`${badgeColor}35` }}>
              .{m.fileType?.toUpperCase()}
            </div>
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
              <motion.div whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                style={{ willChange:"transform" }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 border border-white/20 backdrop-blur-sm text-white text-xs font-bold cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </motion.div>
            </Link>
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-white font-black text-sm mb-1 line-clamp-1">{m.title}</h3>
          {m.description && <p className="text-white/35 text-xs leading-relaxed line-clamp-2 mb-3">{m.description}</p>}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                {m.authorPhoto
                  ? <img src={m.authorPhoto} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                  : <span className="text-white/30 text-[9px] font-black">{m.authorName?.[0]}</span>
                }
              </div>
              <span className="text-white/35 text-xs truncate max-w-[90px]">{m.authorName}</span>
            </div>
            <div className="flex items-center gap-2 text-white/20 text-[10px]">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {m.downloads??0}
              </span>
            </div>
          </div>

          {m.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {m.tags.slice(0,3).map(t=>(
                <span key={t} className="px-2 py-0.5 rounded-md text-[10px] border" style={{ background:"rgba(251,191,36,0.05)", borderColor:"rgba(251,191,36,0.15)", color:"rgba(251,191,36,0.5)" }}>{t}</span>
              ))}
            </div>
          )}

          <Link href={`/gallery/${m.id}`}>
            <motion.div whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
              style={ctaStyle}
              className="w-full py-3 rounded-2xl font-black text-white text-xs text-center relative overflow-hidden cursor-pointer">
              <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:5, ease:"linear" }}
                style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                {m.isPaid ? `Buy ₹${m.price}` : "Download Free"}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
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

        {/* Amber ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
          style={{ background:"radial-gradient(ellipse,rgba(251,191,36,0.1) 0%,transparent 70%)", filter:"blur(80px)" }} />

        <div className="relative z-10 max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm mb-5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300/90 text-sm font-semibold uppercase tracking-widest">AutoCAD Hub</span>
            </motion.div>

            <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}
              className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none mb-4">
              AutoCAD{" "}
              <span style={{ backgroundImage:"linear-gradient(90deg,#fbbf24,#fb7185)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                Drawings
              </span>
            </motion.h1>

            <motion.p initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.15 }}
              className="text-white/35 text-lg max-w-xl mb-6">
              Professional DWG and DXF files for Architecture, Mechanical, Structural and more. All verified and ready to use.
            </motion.p>

            <div className="flex items-center gap-3 flex-wrap">
              {user && (
                <Link href="/upload">
                  <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                    style={{ willChange:"transform", background:"linear-gradient(135deg,#d97706,#dc2626)" }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-white text-xs cursor-pointer relative overflow-hidden">
                    <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                      style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                    <svg className="w-3.5 h-3.5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="relative z-10">Upload CAD File</span>
                  </motion.div>
                </Link>
              )}
              <Link href="/gallery">
                <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} style={{ willChange:"transform" }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-white/40 text-xs border border-white/8 hover:border-white/20 hover:text-white/60 transition duration-200 cursor-pointer">
                  ← All Models
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Features strip */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {CAD_FEATURES.map((f,i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-2xl border border-white/6 bg-white/[0.02]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background:`${f.color}18`, border:`1px solid ${f.color}25` }}>
                  <svg className="w-5 h-5" style={{ color:f.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={f.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-black text-sm mb-1">{f.title}</p>
                  <p className="text-white/30 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Filters */}
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.25 }}
            className="mb-8 space-y-4">

            {/* Search + Sort */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-amber-400 transition duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search drawings, categories, tags…"
                  className="w-full bg-white/[0.03] border border-white/8 text-white placeholder-white/25 text-sm rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-amber-500/50 transition duration-200" />
              </div>
              <div className="relative">
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                  className="bg-white/[0.03] border border-white/8 text-white text-sm rounded-2xl px-4 py-3.5 pr-10 focus:outline-none appearance-none cursor-pointer min-w-[160px]">
                  <option value="newest" className="bg-[#0a0010]">Newest</option>
                  <option value="popular" className="bg-[#0a0010]">Most Viewed</option>
                  <option value="downloads" className="bg-[#0a0010]">Most Downloaded</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* File type + Category + Price */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* File type tabs */}
              <div className="flex gap-2">
                {(["all","dwg","dxf"] as const).map(t => (
                  <button key={t} onClick={()=>setFileType(t)}
                    className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition duration-200"
                    style={fileType===t ? { background:"rgba(251,191,36,0.15)", borderColor:"rgba(251,191,36,0.4)", color:"#fbbf24" } : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.35)" }}>
                    {t === "all" ? "All Formats" : `.${t.toUpperCase()}`}
                  </button>
                ))}
              </div>

              <div className="w-[1px] h-6 bg-white/8" />

              {/* Category */}
              <div className="flex flex-wrap gap-2">
                {CAD_CATEGORIES.slice(0,6).map(c => (
                  <button key={c} onClick={()=>setCategory(c)}
                    className="px-3 py-2 rounded-xl text-xs font-bold border transition duration-200"
                    style={category===c ? { background:"rgba(251,191,36,0.12)", borderColor:"rgba(251,191,36,0.35)", color:"#fbbf24" } : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.35)" }}>
                    {c}
                  </button>
                ))}
              </div>

              <div className="w-[1px] h-6 bg-white/8" />

              {/* Price */}
              <div className="flex gap-2">
                {(["all","free","paid"] as const).map(p => (
                  <button key={p} onClick={()=>setPriceFilter(p)}
                    className="px-3 py-2 rounded-xl text-xs font-bold border transition duration-200"
                    style={priceFilter===p ? { background:"rgba(52,211,153,0.12)", borderColor:"rgba(52,211,153,0.35)", color:"#34d399" } : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.35)" }}>
                    {p==="all"?"All":p==="free"?"Free":"Paid"}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-white/20 text-xs">
              {loading ? "Loading…" : `${filtered.length} drawing${filtered.length!==1?"s":""} found`}
            </p>
          </motion.div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({length:8}).map((_,i)=><Skeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 rounded-3xl border border-amber-500/15 bg-amber-500/5 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-amber-400/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                </svg>
              </div>
              <h3 className="text-white/60 font-black text-xl mb-2">No CAD drawings yet</h3>
              <p className="text-white/25 text-sm mb-6">Be the first to upload DWG or DXF files to the platform.</p>
              {user && (
                <Link href="/upload">
                  <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                    style={{ willChange:"transform", background:"linear-gradient(135deg,#d97706,#dc2626)" }}
                    className="px-6 py-3 rounded-2xl font-black text-white text-sm cursor-pointer">
                    Upload CAD File →
                  </motion.div>
                </Link>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((m,i)=><CADCard key={m.id} m={m} i={i} />)}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
