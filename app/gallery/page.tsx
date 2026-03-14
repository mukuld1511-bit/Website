"use client";

import { useEffect, useState, Suspense, useRef, useCallback } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Canvas, useFrame } from "@react-three/fiber";

export const dynamic = "force-dynamic";

interface Model {
  id: string; title: string; description: string; category: string; tags: string[];
  fileType: string; thumbnailUrl: string; modelUrl: string; isPaid: boolean;
  price: number; accessType: "free"|"request"|"purchase";
  authorId: string; authorName: string; authorPhoto: string;
  views: number; likes: number; downloads: number; uploadedAt: any;
}

const CATEGORIES = ["All", "Architecture", "Mechanical", "Character", "Environment", "Product"];
const SORT_OPTIONS = [
  { value: "newest",    label: "Sort by: Newest" },
  { value: "popular",   label: "Sort by: Most Viewed" },
  { value: "downloads", label: "Sort by: Most Downloaded" },
];

const AR_TAGS  = ["ar", "augmented reality", "arcore", "arkit", "vuforia", "spark ar"];

// 3D Placeholder for hover (Instead of heavy GLTF loading on grid, we just render a tiny spinning mesh)
function HoverModel() {
  const ref = useRef<any>(null);
  useFrame((_, delta) => { if(ref.current) { ref.current.rotation.y += delta; ref.current.rotation.x += delta*0.5; }});
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1,1,1]} />
      <meshStandardMaterial color="#5B4BDB" wireframe />
    </mesh>
  );
}

function GalleryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryMode = searchParams.get("mode") || "all";

  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [fileFormat, setFileFormat] = useState("all");
  const [arOnly, setArOnly] = useState(queryMode === "ar");
  const [mobileFilters, setMobileFilters] = useState(false);

  // Infinite Scroll state
  const [visibleCount, setVisibleCount] = useState(12);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetchModels() {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db,"models"), orderBy("uploadedAt","desc")));
        let data = snap.docs.map(d => ({ id:d.id, ...d.data() } as Model));
        if (queryMode === "autocad") data = data.filter(m => ["dwg","dxf"].includes(m.fileType?.toLowerCase()));
        setModels(data);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchModels();
  }, [queryMode]);

  useEffect(() => { setVisibleCount(12); }, [search, category, sortBy, fileFormat, arOnly]);

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisibleCount(v => v + 12);
    });
    if (node) observerRef.current.observe(node);
  }, [loading]);

  const filtered = (() => {
    let out = models;
    if (arOnly) out = out.filter(m => m.tags?.some(t => AR_TAGS.includes(t.toLowerCase())));
    if (fileFormat !== "all") out = out.filter(m => m.fileType?.toLowerCase() === fileFormat);
    if (category !== "All") out = out.filter(m => m.category === category);
    
    if (search.trim()) {
      const s = search.toLowerCase();
      out = out.filter(m =>
        m.title?.toLowerCase().includes(s) ||
        m.authorName?.toLowerCase().includes(s) ||
        m.tags?.some(t => t.toLowerCase().includes(s))
      );
    }
    
    out.sort((a, b) => {
      if (sortBy === "newest") return (b.uploadedAt?.seconds||0) - (a.uploadedAt?.seconds||0);
      if (sortBy === "popular") return (b.views||0) - (a.views||0);
      if (sortBy === "downloads") return (b.downloads||0) - (a.downloads||0);
      return 0;
    });
    return out;
  })();

  const visibleModels = filtered.slice(0, visibleCount);

  function ModelCard({ m }: { m: Model }) {
    const isAR = m.tags?.some(t => AR_TAGS.includes(t.toLowerCase()));
    const ext = (m.fileType || "3D").toUpperCase();
    const [hovered, setHovered] = useState(false);

    return (
      <Link href={`/gallery/${m.id}`}>
        <motion.div 
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          className="group relative flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-gray-300"
        >
          {/* Thumbnail / 3D Viewer */}
          <div className="relative aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100">
            {m.thumbnailUrl ? (
              <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
            )}
            
            {hovered && !m.thumbnailUrl && (
              <div className="absolute inset-0 z-10 bg-gray-900/10 backdrop-blur-sm">
                <Canvas camera={{ position: [0, 0, 3] }}>
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} />
                  <HoverModel />
                </Canvas>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/90 backdrop-blur border border-gray-200 text-gray-700 shadow-sm">
              {ext}
            </div>
            {isAR && (
              <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded text-[10px] font-black uppercase text-white bg-[#5B4BDB] shadow-md shadow-[#5B4BDB]/20 border border-[#5B4BDB]">
                AR Ready
              </div>
            )}
            
            <div className="absolute bottom-3 right-3">
              {m.isPaid ? (
                <div className="px-2.5 py-1 rounded bg-white text-gray-900 text-xs font-black shadow border border-gray-200">
                  ₹{m.price}
                </div>
              ) : (
                <div className="px-2.5 py-1 rounded bg-green-500 text-white text-xs font-black shadow border border-green-600">
                  Free
                </div>
              )}
            </div>
          </div>

          {/* Model Info */}
          <div className="p-4 flex flex-col flex-1">
            <h3 className="text-gray-900 font-bold text-base line-clamp-1 mb-3 group-hover:text-[#5B4BDB] transition">{m.title}</h3>
            
            <div className="mt-auto flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                  {m.authorPhoto ? <img src={m.authorPhoto} className="w-full h-full object-cover" /> : <span className="text-gray-500 text-[9px] font-bold">{m.authorName?.[0]}</span>}
                </div>
                <span className="text-gray-600 text-xs font-semibold truncate">{m.authorName}</span>
              </div>
              
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-gray-400 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>{m.views || 0} views</span>
                <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>{m.downloads || 0} dl</span>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans flex flex-col">
      <Navbar />
      
      {/* Header */}
      <div className="pt-28 pb-8 px-4 md:px-8 max-w-[1600px] mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 mb-2">3D Gallery</h1>
          <p className="text-gray-500 font-medium text-sm md:text-base">Discover world-class models for spatial computing.</p>
        </div>
        {user && (
          <Link href="/upload">
            <button className="px-6 py-3.5 rounded-xl font-bold text-white bg-[#5B4BDB] hover:bg-[#4a3bc7] shadow border border-[#5B4BDB] transition duration-200">
              + Upload Model
            </button>
          </Link>
        )}
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-14 md:top-16 z-30 bg-white/80 backdrop-blur-md border-y border-gray-200 px-4 md:px-8 py-3 w-full shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          
          <div className="flex w-full lg:w-auto items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 lg:w-80">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search models, creators, formats…"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/20 focus:border-[#5B4BDB] transition" />
            </div>
            
            {/* Mobile Filter Toggle */}
            <button onClick={()=>setMobileFilters(!mobileFilters)} className="lg:hidden px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-700 border border-gray-200">
               Filters ▾
            </button>
          </div>

          <div className={`w-full lg:w-auto flex-col lg:flex-row items-center gap-4 ${mobileFilters ? 'flex' : 'hidden lg:flex'}`}>
            
            {/* Pills */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100 rounded-lg border border-gray-200">
              {['all','glb','gltf','obj','fbx'].map(fmt => (
                <button key={fmt} onClick={()=>setFileFormat(fmt)}
                  className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition ${fileFormat===fmt ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {fmt}
                </button>
              ))}
            </div>

            {/* Dropdowns */}
            <select value={category} onChange={e=>setCategory(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#5B4BDB]">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select disabled className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-400 focus:outline-none cursor-not-allowed">
              <option>Any License</option>
            </select>

            <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#5B4BDB]">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Switch */}
            <label className="flex items-center gap-2 cursor-pointer ml-2">
              <div className={`relative w-10 h-6 rounded-full transition-colors ${arOnly ? 'bg-[#5B4BDB]' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${arOnly ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-sm font-bold text-gray-700">AR/VR Ready</span>
              <input type="checkbox" className="hidden" checked={arOnly} onChange={e=>setArOnly(e.target.checked)} />
            </label>
            
          </div>
        </div>
      </div>

      <div className="flex-grow px-4 md:px-8 max-w-[1600px] mx-auto w-full py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({length:8}).map((_,i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm h-72 animate-pulse flex flex-col">
                <div className="h-40 bg-gray-100" />
                <div className="p-4 flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-200 shadow-sm">
            <svg className="w-24 h-24 text-gray-200 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No models found</h3>
            <p className="text-gray-500 mb-8 max-w-sm text-center">We couldn't find any models matching your exact filters. Try tweaking them or clear to see everything.</p>
            <div className="flex gap-4">
              <button onClick={()=>{setSearch("");setCategory("All");setFileFormat("all");setArOnly(false);}} className="px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 font-bold text-gray-700 transition">
                Clear Filters
              </button>
              {user && (
                <Link href="/upload">
                  <button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold hover:bg-[#4a3bc7] shadow transition">
                    Upload a Model
                  </button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleModels.map(m => <ModelCard key={m.id} m={m} />)}
            </div>
            {visibleCount < filtered.length && (
              <div ref={lastElementRef} className="py-12 flex justify-center">
                <div className="flex items-center gap-2 text-gray-400 font-bold text-sm">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Loading more models...
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function GalleryPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#F9FAFB]"/>}><GalleryContent /></Suspense>;
}