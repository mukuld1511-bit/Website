"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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
  { icon:"M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18", title:"DWG Files", desc:"Industry-standard AutoCAD drawing files, ready to open in AutoCAD, BricsCAD or LibreCAD.", color:"amber" },
  { icon:"M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z", title:"DXF Format", desc:"Universal exchange format compatible with virtually all CAD software including CATIA and SolidWorks.", color:"rose" },
  { icon:"M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2", title:"Verified Drawings", desc:"All CAD files are reviewed for layer structure, scale accuracy, and drawing standards compliance.", color:"green" },
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
      <div className="rounded-3xl border border-[#2A2A3E] bg-[#141420] overflow-hidden shadow-sm">
        <div className="aspect-video bg-[#2A2A3E]/40 animate-pulse" />
        <div className="p-6 space-y-4">
          <div className="h-4 bg-[#2A2A3E] rounded-full animate-pulse w-3/4" />
          <div className="h-3 bg-[#2A2A3E]/50 rounded-full animate-pulse w-1/2" />
          <div className="h-10 bg-[#2A2A3E] rounded-xl animate-pulse mt-4" />
        </div>
      </div>
    );
  }

  function CADCard({ m, i }: { m:Model; i:number }) {
    const isDWG = m.fileType?.toLowerCase() === "dwg";
    const badgeColor = isDWG ? "amber" : "rose";

    return (
      <motion.div
        initial={{ opacity:0, y:30 }}
        whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true, margin:"-50px" }}
        transition={{ duration:0.5, delay: i * 0.05 }}
        whileHover={{ y: -4 }}
        className="group relative rounded-[2rem] border-2 border-[#2A2A3E] bg-[#141420] hover:shadow-[0_8px_30px_rgba(91,75,219,0.15)] hover:border-[#5B4BDB]/40 transition duration-300 overflow-hidden flex flex-col h-full"
      >
        <div className={`absolute top-0 left-0 right-0 h-1 bg-${badgeColor}-500/50 opacity-0 group-hover:opacity-100 transition duration-300`} />

        {/* thumbnail / CAD preview */}
        <div className="relative aspect-video overflow-hidden bg-[#0A0A0F] border-b border-[#2A2A3E]">
          {m.thumbnailUrl ? (
            <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100" />
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center gap-2 bg-[#141420]`}>
              <svg className={`w-12 h-12 text-[#2A2A3E]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
              <p className={`text-${badgeColor}-400 text-xs font-bold uppercase tracking-wider`}>{m.fileType?.toUpperCase()} Drawing</p>
            </div>
          )}

          <div className="absolute top-4 left-4">
            <div className={`px-3 py-1 rounded-xl bg-[#0A0A0F]/90 backdrop-blur-md border border-[#2A2A3E] text-[10px] font-black uppercase text-${badgeColor}-400 shadow-[0_4px_15px_rgba(0,0,0,0.5)]`}>
              .{m.fileType?.toUpperCase()}
            </div>
          </div>

          <div className="absolute top-4 right-4">
            {m.isPaid ? (
              <div className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-black shadow-[0_4px_15px_rgba(0,0,0,0.5)] backdrop-blur-md">₹{m.price}</div>
            ) : (
              <div className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-black shadow-[0_4px_15px_rgba(0,0,0,0.5)]">Free</div>
            )}
          </div>

          <div className="absolute inset-0 bg-[#0A0A0F]/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center z-10">
            <Link href={`/gallery/${m.id}`}>
              <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#5B4BDB] text-white border-b-4 border-[#4438b8] hover:bg-[#4c3ec7] active:border-b-0 active:translate-y-1 text-sm font-black shadow-xl transition-all">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                View & Download
              </button>
            </Link>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-1 relative bg-[#141420] z-0">
          <h3 className="text-white font-black text-xl mb-2 line-clamp-1 group-hover:text-[#7C6EF6] transition-colors">{m.title}</h3>
          {m.description && <p className="text-[#9494AD] text-xs leading-relaxed line-clamp-2 mb-5 font-semibold">{m.description}</p>}

          <div className="flex items-center justify-between mb-6 mt-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#5B4BDB]/30 bg-[#141420] flex items-center justify-center flex-shrink-0 shadow-sm">
                {m.authorPhoto
                  ? <img src={m.authorPhoto} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                  : <span className="text-[#7C6EF6] text-[10px] font-black uppercase">{m.authorName?.[0]}</span>
                }
              </div>
              <span className="text-[#9494AD] text-xs font-black uppercase tracking-wider max-w-[120px] truncate">{m.authorName}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#5B4BDB]/10 px-2.5 py-1.5 rounded-xl text-[#7C6EF6] border border-[#5B4BDB]/20 font-black text-xs">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {m.downloads??0}
              </span>
            </div>
          </div>

          {m.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {m.tags.slice(0,3).map(t=>(
                <span key={t} className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide border border-[#2A2A3E] bg-[#0A0A0F] text-[#6B6B85] shadow-sm">{t}</span>
              ))}
            </div>
          )}

          <Link href={`/gallery/${m.id}`}>
            <button className={`w-full py-4 rounded-2xl font-black text-sm text-center transition-all shadow-[0_0_15px_rgba(91,75,219,0.1)] active:translate-y-[1px] ${
              m.isPaid 
                ? 'bg-[#1A1A2E] text-[#9494AD] border-2 border-[#5B4BDB]/40 hover:bg-[#5B4BDB]/10 border-b-4' 
                : 'bg-[#5B4BDB] text-white border-b-4 border-[#4438b8] hover:bg-[#4c3ec7]'
            }`}>
              <span className="flex items-center justify-center gap-2 uppercase tracking-wide">
                {m.isPaid ? `Buy for ₹${m.price}` : "Download Free"}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </span>
            </button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] font-sans flex flex-col relative">
      <div className="flex-grow pt-[100px] pb-24 px-4 overflow-x-hidden relative z-10">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#5B4BDB] rounded-full filter blur-[100px] opacity-20 z-[-1]" />
        <div className="absolute top-60 right-10 w-72 h-72 bg-[#5B4BDB] rounded-full filter blur-[100px] opacity-20 z-[-1]" />

        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-14 text-center mt-12">
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#5B4BDB]/30 bg-[#5B4BDB]/10 text-[#7C6EF6] shadow-md mb-8 glass-synthe">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C6EF6] animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest">AutoCAD Hub</span>
            </motion.div>

            <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}
              className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6 drop-shadow-sm">
              AutoCAD <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C6EF6] via-purple-400 to-[#5B4BDB]">Drawings</span>
            </motion.h1>

            <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.2 }}
              className="text-[#9494AD] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-bold">
              Professional DWG and DXF files for Architecture, Mechanical, Structural and more. All verified and ready to use.
            </motion.p>

            <div className="flex justify-center items-center gap-4 flex-wrap">
              {user && (
                <Link href="/upload">
                  <button className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-wider text-white text-sm bg-[#5B4BDB] hover:bg-[#4c3ec7] border-b-4 border-[#4438b8] active:border-b-0 active:translate-y-[2px] shadow-[0_0_20px_rgba(91,75,219,0.3)] transition-all">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                    Upload CAD File
                  </button>
                </Link>
              )}
              <Link href="/gallery">
                <button className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-wider text-white text-sm bg-[#141420] border-2 border-[#2A2A3E] hover:border-[#5B4BDB]/40 hover:bg-[#2A2A3E]/50 shadow-md transition-all active:translate-y-[1px]">
                  ← All Models
                </button>
              </Link>
            </div>
          </div>

          {/* Features strip */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.25 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {CAD_FEATURES.map((f,i) => (
              <div key={i} className="flex items-start gap-4 p-8 rounded-[2rem] border border-[#2A2A3E] bg-[#141420] shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(91,75,219,0.15)] hover:border-[#5B4BDB]/40 hover:-translate-y-1 transition duration-300">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#5B4BDB]/20 border border-[#5B4BDB]/30 text-[#7C6EF6]`}>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={f.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-black text-xl mb-2">{f.title}</p>
                  <p className="text-[#9494AD] text-sm leading-relaxed font-bold">{f.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Filters */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.3 }}
            className="mb-10 p-6 md:p-8 rounded-[2.5rem] border border-[#2A2A3E] bg-[#141420] shadow-[0_4px_30px_rgba(0,0,0,0.5)] space-y-6 relative z-20">

            {/* Search + Sort */}
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="relative flex-1">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#7C6EF6]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search drawings, categories, tags…"
                  className="w-full bg-[#0A0A0F] border-2 border-[#2A2A3E] text-white placeholder-[#6B6B85] font-bold text-base md:text-lg rounded-3xl pl-16 pr-6 py-5 focus:outline-none focus:ring-2 focus:ring-[#5B4BDB] focus:border-[#5B4BDB] transition shadow-inner" />
              </div>
              <div className="relative">
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                  className="bg-[#0A0A0F] border-2 border-[#2A2A3E] text-white font-black text-sm md:text-base tracking-wide rounded-3xl pl-6 pr-14 py-5 focus:outline-none focus:ring-2 focus:ring-[#5B4BDB] focus:border-[#5B4BDB] appearance-none cursor-pointer w-full sm:min-w-[200px] shadow-inner uppercase">
                  <option value="newest">Sort by: Newest</option>
                  <option value="popular">Sort by: Most Viewed</option>
                  <option value="downloads">Sort by: Most Downloaded</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[#7C6EF6] pointer-events-none">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* File type + Category + Price */}
            <div className="flex flex-wrap gap-5 items-center bg-[#0A0A0F] p-3 rounded-3xl border-2 border-[#2A2A3E] shadow-inner">
              {/* File type tabs */}
              <div className="flex gap-2 flex-wrap">
                {(["all","dwg","dxf"] as const).map(t => (
                  <button key={t} onClick={()=>setFileType(t)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      fileType===t ? "bg-[#5B4BDB] text-white shadow-sm" : "bg-transparent text-[#6B6B85] hover:text-white hover:bg-[#2A2A3E]/50"
                    }`}>
                    {t === "all" ? "All Formats" : `.${t.toUpperCase()}`}
                  </button>
                ))}
              </div>
              <div className="w-px h-8 bg-[#2A2A3E] hidden md:block"></div>

              {/* Price */}
              <div className="flex gap-2 flex-wrap">
                {(["all","free","paid"] as const).map(p => (
                  <button key={p} onClick={()=>setPriceFilter(p)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      priceFilter===p ? "bg-emerald-500 text-white shadow-sm" : "bg-transparent text-[#6B6B85] hover:text-white hover:bg-[#2A2A3E]/50"
                    }`}>
                    {p==="all"?"All Pricing":p==="free"?"Free Only":"Paid Only"}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-wrap gap-3 pt-2 pl-2">
              {CAD_CATEGORIES.slice(0,8).map(c => (
                <button key={c} onClick={()=>setCategory(c)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wide border-2 transition-all duration-200 shadow-sm ${
                    category===c ? "bg-[#5B4BDB] border-[#4438b8] text-white" : "bg-[#0A0A0F] border-[#2A2A3E] text-[#6B6B85] hover:text-white hover:border-[#5B4BDB]/50"
                  }`}>
                  {c}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t-2 border-[#2A2A3E] border-dashed flex justify-between items-center px-2">
              <p className="text-[#6B6B85] font-bold text-sm tracking-wide">
                {loading ? "Loading drawings…" : `${filtered.length} drawing${filtered.length!==1?"s":""} found`}
              </p>
              {(search || category !== "All" || fileType !== "all" || priceFilter !== "all" || sortBy !== "newest") && (
                <button onClick={()=>{ setSearch(""); setCategory("All"); setFileType("all"); setPriceFilter("all"); setSortBy("newest"); }} className="text-[#7C6EF6] text-sm font-black hover:underline uppercase tracking-wide">Reset Filters</button>
              )}
            </div>
          </motion.div>

          {/* Grid */}
          <div className="relative z-10 w-full mb-10">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({length:8}).map((_,i)=><Skeleton key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <motion.div initial={{ opacity:0, y: 20 }} animate={{ opacity:1, y: 0 }} className="flex flex-col items-center justify-center py-24 text-center bg-[#141420] rounded-[3rem] border-2 border-dashed border-[#2A2A3E] shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                <div className="w-24 h-24 rounded-full bg-[#0A0A0F] border-2 border-[#2A2A3E] flex items-center justify-center mb-6">
                  <span className="text-5xl opacity-80">📐</span>
                </div>
                <h3 className="text-white font-black text-2xl mb-2">No CAD drawings found</h3>
                <p className="text-[#6B6B85] text-lg font-bold mb-8 max-w-md">Try adjusting your filters or be the first to upload a drawing.</p>
                <div className="flex gap-4">
                  <button onClick={()=>{ setSearch(""); setCategory("All"); setFileType("all"); setPriceFilter("all"); }}
                    className="px-8 py-4 rounded-2xl bg-[#2A2A3E]/50 text-[#9494AD] font-black tracking-widest uppercase text-xs hover:bg-[#2A2A3E] hover:text-white transition shadow-sm border border-[#2A2A3E]">
                    Clear Filters
                  </button>
                  {user && (
                    <Link href="/upload">
                      <button className="px-8 py-4 rounded-2xl bg-[#5B4BDB] text-white font-black tracking-widest uppercase text-xs hover:bg-[#4c3ec7] border-b-4 border-[#4438b8] active:border-b-0 active:translate-y-[2px] transition-all shadow-md">
                        Upload CAD
                      </button>
                    </Link>
                  )}
                </div>
              </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
              {filtered.map((m,i)=><CADCard key={m.id} m={m} i={i} />)}
            </div>
          )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
