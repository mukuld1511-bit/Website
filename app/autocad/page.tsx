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
      <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="aspect-video bg-gray-100 animate-pulse" />
        <div className="p-6 space-y-4">
          <div className="h-4 bg-gray-200 rounded-full animate-pulse w-3/4" />
          <div className="h-3 bg-gray-100 rounded-full animate-pulse w-1/2" />
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse mt-4" />
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
        className="group relative rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition duration-300 overflow-hidden flex flex-col h-full"
      >
        <div className={`absolute top-0 left-0 right-0 h-1 bg-${badgeColor}-500 opacity-0 group-hover:opacity-100 transition duration-300`} />

        {/* thumbnail / CAD preview */}
        <div className="relative aspect-video overflow-hidden bg-gray-50 border-b border-gray-100">
          {m.thumbnailUrl ? (
            <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center gap-2 bg-${badgeColor}-50`}>
              <svg className={`w-12 h-12 text-${badgeColor}-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
              <p className={`text-${badgeColor}-600 text-xs font-bold`}>{m.fileType?.toUpperCase()} Drawing</p>
            </div>
          )}

          <div className="absolute top-3 left-3">
            <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-black bg-${badgeColor}-50 text-${badgeColor}-700 border-${badgeColor}-200 shadow-sm`}>
              .{m.fileType?.toUpperCase()}
            </div>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                View & Download
              </button>
            </Link>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-gray-900 font-extrabold text-lg mb-1.5 line-clamp-1">{m.title}</h3>
          {m.description && <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-4 font-medium">{m.description}</p>}

          <div className="flex items-center justify-between mb-5 mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
                {m.authorPhoto
                  ? <img src={m.authorPhoto} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                  : <span className="text-gray-500 text-[9px] font-bold">{m.authorName?.[0]}</span>
                }
              </div>
              <span className="text-gray-600 text-xs font-semibold truncate max-w-[90px]">{m.authorName}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {m.downloads??0}
              </span>
            </div>
          </div>

          {m.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {m.tags.slice(0,3).map(t=>(
                <span key={t} className="px-2.5 py-1 rounded-md text-[10px] font-bold border border-gray-200 bg-gray-50 text-gray-600">{t}</span>
              ))}
            </div>
          )}

          <Link href={`/gallery/${m.id}`}>
            <button className={`w-full py-3.5 rounded-xl font-bold text-sm text-center transition shadow-sm border ${
              m.isPaid ? 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50' : 'bg-blue-600 text-white border-transparent hover:bg-blue-700'
            }`}>
              <span className="flex items-center justify-center gap-2">
                {m.isPaid ? `Buy for ₹${m.price}` : "Download Free"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
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
          <div className="mb-12 text-center mt-10">
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-800 shadow-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">AutoCAD Hub</span>
            </motion.div>

            <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}
              className="text-4xl md:text-6xl font-black tracking-tight text-gray-900 mb-6">
              AutoCAD Drawings
            </motion.h1>

            <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.2 }}
              className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
              Professional DWG and DXF files for Architecture, Mechanical, Structural and more. All verified and ready to use.
            </motion.p>

            <div className="flex justify-center items-center gap-4 flex-wrap">
              {user && (
                <Link href="/upload">
                  <button className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white text-sm bg-blue-600 hover:bg-blue-700 shadow-sm transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Upload CAD File
                  </button>
                </Link>
              )}
              <Link href="/gallery">
                <button className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-gray-700 text-sm border border-gray-300 bg-white hover:bg-gray-50 shadow-sm transition">
                  ← All Models
                </button>
              </Link>
            </div>
          </div>

          {/* Features strip */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.25 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
            {CAD_FEATURES.map((f,i) => (
              <div key={i} className="flex items-start gap-4 p-6 rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-${f.color}-50 border border-${f.color}-100 text-${f.color}-600`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-900 font-extrabold text-base mb-1.5">{f.title}</p>
                  <p className="text-gray-500 text-sm leading-relaxed font-medium">{f.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Filters */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.3 }}
            className="mb-10 p-6 md:p-8 rounded-3xl border border-gray-200 bg-white shadow-sm space-y-5">

            {/* Search + Sort */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search drawings, categories, tags…"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm md:text-base rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-inner" />
              </div>
              <div className="relative">
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-700 font-bold text-sm md:text-base rounded-2xl pl-5 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer w-full sm:min-w-[180px] shadow-sm">
                  <option value="newest">Sort by: Newest</option>
                  <option value="popular">Sort by: Most Viewed</option>
                  <option value="downloads">Sort by: Most Downloaded</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* File type + Category + Price */}
            <div className="flex flex-wrap gap-4 items-center">
              {/* File type tabs */}
              <div className="flex gap-2.5 bg-gray-50 p-1 rounded-xl border border-gray-200 flex-wrap">
                {(["all","dwg","dxf"] as const).map(t => (
                  <button key={t} onClick={()=>setFileType(t)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                      fileType===t ? "bg-white text-blue-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent"
                    }`}>
                    {t === "all" ? "All Formats" : `.${t.toUpperCase()}`}
                  </button>
                ))}
              </div>

              {/* Price */}
              <div className="flex gap-2.5 bg-gray-50 p-1 rounded-xl border border-gray-200 flex-wrap">
                {(["all","free","paid"] as const).map(p => (
                  <button key={p} onClick={()=>setPriceFilter(p)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      priceFilter===p ? "bg-white text-blue-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent"
                    }`}>
                    {p==="all"?"All Pricing":p==="free"?"Free Only":"Paid Only"}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              {CAD_CATEGORIES.slice(0,8).map(c => (
                <button key={c} onClick={()=>setCategory(c)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition duration-200 ${
                    category===c ? "bg-blue-600 border-blue-600 text-white shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}>
                  {c}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
              <p className="text-gray-500 font-semibold text-sm">
                {loading ? "Loading drawings…" : `${filtered.length} drawing${filtered.length!==1?"s":""} found`}
              </p>
              {(search || category !== "All" || fileType !== "all" || priceFilter !== "all" || sortBy !== "newest") && (
                <button onClick={()=>{ setSearch(""); setCategory("All"); setFileType("all"); setPriceFilter("all"); setSortBy("newest"); }} className="text-blue-600 text-sm font-bold hover:underline">Reset Filters</button>
              )}
            </div>
          </motion.div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({length:8}).map((_,i)=><Skeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity:0, y: 20 }} animate={{ opacity:1, y: 0 }} className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-gray-200 shadow-sm">
              <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                </svg>
              </div>
              <h3 className="text-gray-900 font-extrabold text-2xl mb-2">No CAD drawings found</h3>
              <p className="text-gray-500 text-base mb-8 max-w-sm">Try adjusting your filters or be the first to upload a drawing.</p>
              <div className="flex gap-4">
                <button onClick={()=>{ setSearch(""); setCategory("All"); setFileType("all"); setPriceFilter("all"); }}
                  className="px-6 py-3.5 rounded-xl bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 transition shadow-sm">
                  Clear Filters
                </button>
                {user && (
                  <Link href="/upload">
                    <button className="px-6 py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-sm">
                      Upload CAD File
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
      <Footer />
    </div>
  );
}
