"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection, getDocs, query, orderBy, limit,
  getCountFromServer, where,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, useSpring, useMotionValue, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HeroComponent from "./components/HeroComponent";

const ScrollingGallery = dynamic(() => import("./components/ScrollingGallery"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────
interface RecentModel {
  id: string; title: string; thumbnailUrl: string;
  fileType: string; isPaid: boolean; price: number; authorName: string;
}
interface Collaborator {
  id: string; name: string; role: string; dept: string; avatar: string; color: string;
}
interface TutorProfile {
  id: string; name: string; avatar: string; skills: string[];
  hourlyRate: number; currency: string; rating: number; totalSessions: number; color: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FILE_COLORS: Record<string, string> = {
  glb:"#3b82f6", gltf:"#3b82f6", obj:"#10b981", fbx:"#10b981", dwg:"#f59e0b", dxf:"#f59e0b",
};

const FEATURES = [
  { title:"3D Gallery",          href:"/gallery",           color:"blue",   tag:"4 formats",
    desc:"Browse, preview and download GLB, GLTF, OBJ & FBX models with live 3D viewer.",
    icon:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { title:"XR Games & Apps",     href:"/gallery?mode=ar&genre=game",   color:"green",  tag:"Spatial",
    desc:"Download fully interactive AR/VR Games and Utility Apps ready for deployment.",
    icon:"M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" },
  { title:"AutoCAD Hub",         href:"/autocad",           color:"amber",  tag:"CAD",
    desc:"Engineering DWG and DXF drawings — upload, download and preview CAD files online.",
    icon:"M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" },
  { title:"Unity Asset Library",  href:"/asset-library",   color:"violet", tag:"Unity",
    desc:"Download free & premium Unity packages — characters, environments, VFX shaders and complete projects.",
    icon:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { title:"Live Workshops",       href:"/learn",            color:"pink",   tag:"Community",
    desc:"Join community-run workshops on 3D, AR/VR, Unity and CAD — free and with seat tracking.",
    icon:"M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
  { title:"Connect & Learn",     href:"/connect",           color:"cyan",   tag:"Live sessions",
    desc:"Book 1-on-1 lessons with certified developers. Use their personal booking link — zero platform fees.",
    icon:"M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
  { title:"Certification",       href:"/certification",     color:"indigo", tag:"Verified",
    desc:"Apply for developer certification. Unlock verified badge, priority listing and exclusive opportunities.",
    icon:"M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
  { title:"Public Requests",     href:"/requests/open",     color:"sky",    tag:"Open projects",
    desc:"Publicly request a custom 3D model. Developers apply with proposals — you pick the best.",
    icon:"M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
  { title:"PIET Collaboration",  href:"/collaborators",     color:"purple", tag:"Research",
    desc:"Academic partnership with PIET — students and faculty co-building the future of 3D/AR/VR.",
    icon:"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
];

// ─── Counter ──────────────────────────────────────────────────────────────────
function Counter({ target, suffix="" }: { target:number; suffix?:string }) {
  const [val, setVal] = useState(0);
  const ran = useRef(false);
  useEffect(() => {
    if (target === 0 || ran.current) return;
    ran.current = true;
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 50));
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(cur);
      if (cur >= target) clearInterval(t);
    }, 28);
    return () => clearInterval(t);
  }, [target]);
  return <>{target === 0 ? "—" : `${val}${suffix}`}</>;
}

// ─── Tilt model card ──────────────────────────────────────────────────────────
function FloatingModelCard({ m, i }: { m:RecentModel; i:number }) {
  const ext   = m.fileType?.toLowerCase() ?? "glb";
  const ref   = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx:0, ry:0 });

  return (
    <motion.div ref={ref}
      initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
      transition={{ duration:0.4, delay:i*0.05 }}
      onMouseMove={e => {
        const r = ref.current!.getBoundingClientRect();
        setTilt({ rx:-(((e.clientY-r.top)/r.height)-0.5)*10, ry:(((e.clientX-r.left)/r.width)-0.5)*10 });
      }}
      onMouseLeave={() => setTilt({ rx:0, ry:0 })}
      style={{ willChange:"transform", transform:`perspective(600px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`, transition:"transform 0.1s ease" }}>
      <Link href={`/gallery/${m.id}`}>
        <div className="group relative rounded-2xl bg-white border border-gray-200 overflow-hidden hover:shadow-md transition duration-300 cursor-pointer shadow-sm flex flex-col h-full">
          <div className="relative aspect-square overflow-hidden bg-white border-b border-gray-100 flex items-center justify-center p-2">
            {m.thumbnailUrl
              ? <img src={m.thumbnailUrl} alt={m.title} className="max-w-full max-h-full object-contain group-hover:scale-105 transition duration-500 rounded" />
              : <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
            }
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white text-gray-700 shadow-sm border border-gray-100">
              {ext.toUpperCase()}
            </div>
            {m.isPaid
              ? <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 shadow-sm">₹{m.price}</div>
              : <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-600 border border-gray-200 shadow-sm">Free</div>
            }
          </div>
          <div className="p-4 flex-1 flex flex-col justify-end">
            <p className="text-gray-900 text-sm font-bold line-clamp-1">{m.title}</p>
            <p className="text-gray-500 font-medium text-[10px] truncate mt-1">{m.authorName}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ f, i }: { f:typeof FEATURES[0]; i:number }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
      transition={{ duration:0.4, delay:i*0.05 }}
      onHoverStart={() => setHover(true)} onHoverEnd={() => setHover(false)}>
      <Link href={f.href}>
        <div className="group relative h-full p-6 rounded-2xl bg-white border border-gray-200 hover:shadow-md transition duration-300 cursor-pointer overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1 bg-${f.color}-500 opacity-0 group-hover:opacity-100 transition`} />
          <div className="flex items-start justify-between mb-5">
            <motion.div animate={{ scale:hover?1.05:1 }}
              transition={{ type:"spring", stiffness:400, damping:20 }}
              className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${f.color}-50 border border-${f.color}-100`}>
              <svg className={`w-5 h-5 text-${f.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
              </svg>
            </motion.div>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-${f.color}-50 text-${f.color}-700 border-${f.color}-200`}>
              {f.tag}
            </span>
          </div>
          <h3 className="text-gray-900 font-extrabold text-lg mb-2">{f.title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
          <motion.div animate={{ x:hover?4:0, opacity:hover?1:0.5 }} transition={{ duration:0.2 }}
            className={`absolute bottom-6 right-6 text-${f.color}-600`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Tutor card ───────────────────────────────────────────────────────────────
function TutorCard({ t, i }: { t:TutorProfile & { certified?: boolean }; i:number }) {
  const isC = t.certified;
  return (
    <motion.div initial={{ opacity:0, y:10 }} whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true }} transition={{ delay:i*0.05 }}>
      <Link href="/connect">
        <div className={`group flex items-center gap-3 p-3 rounded-xl border transition duration-200 cursor-pointer overflow-hidden relative ${
          isC 
            ? "border-2 border-[#5B4BDB] bg-[#141414] shadow-[0_0_15px_rgba(91,75,219,0.2)] hover:shadow-[0_0_25px_rgba(91,75,219,0.3)] transform hover:-translate-y-1" 
            : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
        }`}>
          {isC && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5B4BDB] to-purple-400" />}
          
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold overflow-hidden border ${
            isC ? "bg-[#5B4BDB]/10 text-[#5B4BDB] border-[#5B4BDB]/20" : "bg-gray-100 text-gray-500 border-gray-200"
          }`}>
            {t.avatar
              ? <img src={t.avatar} className="w-full h-full object-cover" />
              : t.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2)
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-sm font-bold truncate ${isC ? "text-white group-hover:text-[#5B4BDB]" : "text-gray-900"}`}>{t.name}</p>
              {isC && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-[#5B4BDB]/20 text-[#5B4BDB] border border-[#5B4BDB]/30">
                  Certified
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <span className={`text-xs font-bold ${isC ? "text-gray-300" : "text-gray-700"}`}>{t.rating || "New"}</span>
              <span className={`text-[10px] ${isC ? "text-gray-500" : "text-gray-400"}`}>· {t.totalSessions || 0} sessions</span>
            </div>
          </div>
          <span className={`text-sm font-extrabold flex-shrink-0 ${isC ? "text-white" : "text-blue-600"}`}>
            {t.currency||"₹"}{t.hourlyRate||0}<span className={`text-xs font-medium ${isC ? "text-gray-500" : "text-gray-400"}`}>/hr</span>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [user,          setUser]          = useState<any>(null);
  const [recentModels,  setRecentModels]  = useState<RecentModel[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [tutors,        setTutors]        = useState<TutorProfile[]>([]);
  const [stats,         setStats]         = useState({ models:0, developers:0, downloads:0, certifications:0 });
  const [statsLoading,  setStatsLoading]  = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  // Firestore stats
  useEffect(() => {
    async function load() {
      setStatsLoading(true);
      try {
        const [mSnap, pSnap, cSnap, uSnap] = await Promise.all([
          getCountFromServer(collection(db,"models")),
          getCountFromServer(collection(db,"purchases")),
          getCountFromServer(collection(db,"certificationRequests")),
          getDocs(query(collection(db,"users"))),
        ]);
        setStats({
          models:         mSnap.data().count,
          developers:     uSnap.docs.filter(d=>d.data().role==="developer").length,
          downloads:      pSnap.data().count,
          certifications: cSnap.data().count,
        });
      } catch(e) { console.error(e); }
      setStatsLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    getDocs(query(collection(db,"models"), orderBy("uploadedAt","desc"), limit(8)))
      .then(s => setRecentModels(s.docs.map(d=>({id:d.id,...d.data()} as RecentModel))))
      .catch(console.error);
  }, []);

  useEffect(() => {
    getDocs(query(collection(db,"collaborators"), orderBy("createdAt","desc"), limit(6)))
      .then(s => setCollaborators(s.docs.map(d=>({id:d.id,...d.data()} as Collaborator))))
      .catch(console.error);
  }, []);

  useEffect(() => {
    getDocs(query(collection(db,"tutorProfiles"), where("isAvailable","==",true), limit(4)))
      .then(s => setTutors(s.docs.map(d=>({id:d.id,...d.data()} as TutorProfile))))
      .catch(console.error);
  }, []);


  const STATS_CFG = [
    { label:"3D Models",     val:stats.models,        color:"blue-600" },
    { label:"Developers",    val:stats.developers,    color:"indigo-600" },
    { label:"Downloads",     val:stats.downloads,     color:"green-600" },
    { label:"Certifications",val:stats.certifications,color:"amber-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <div className="relative z-10 flex-grow pt-24">

        {/* HERO */}
        <HeroComponent user={user} stats={stats} statsLoading={statsLoading} />

        {/* SCROLLING GALLERY */}
        <div className="bg-white border-y border-gray-200 py-16">
          <ScrollingGallery />
        </div>

        {/* ── LIVE PLATFORM ACTIVITY ── */}
        <section className="py-24 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              className="flex items-center gap-3 mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-200 bg-green-50 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-800 text-xs font-bold uppercase tracking-widest">Live Activity</span>
              </div>
              <div className="h-px flex-1 bg-gray-200" />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Recent uploads */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-gray-900 text-lg font-bold">Recent Uploads</h3>
                  <Link href="/gallery"><span className="text-blue-600 text-sm font-bold hover:text-blue-700 transition duration-200">View Gallery →</span></Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentModels.slice(0,6).length > 0
                    ? recentModels.slice(0,6).map((m,i) => {
                        const ext = m.fileType?.toLowerCase()??"glb";
                        return (
                          <motion.div key={m.id} initial={{ opacity:0, y:10 }} whileInView={{ opacity:1, y:0 }}
                            viewport={{ once:true }} transition={{ delay:i*0.05 }}>
                            <Link href={`/gallery/${m.id}`}>
                              <div className="group flex items-center gap-4 p-3 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-sm bg-gray-50 hover:bg-white transition duration-200 cursor-pointer">
                                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 bg-white">
                                  {m.thumbnailUrl
                                    ? <img src={m.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-105 transition" />
                                    : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400 bg-gray-100">{ext.toUpperCase()}</div>
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-900 text-sm font-bold truncate group-hover:text-blue-600 transition">{m.title}</p>
                                  <p className="text-gray-500 text-xs mt-0.5 truncate">{m.authorName}</p>
                                </div>
                                <div className="flex-shrink-0">
                                  {m.isPaid
                                    ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">₹{m.price}</span>
                                    : <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-lg text-xs font-bold">Free</span>
                                  }
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                        );
                      })
                    : Array.from({length:6}).map((_,i) => (
                        <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
                      ))
                  }
                </div>
              </div>

              {/* Live tutors */}
              <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-gray-900 text-lg font-bold">Available Collaborators</h3>
                  <Link href="/connect"><span className="text-blue-600 text-sm font-bold hover:text-blue-700 transition duration-200">View all →</span></Link>
                </div>
                <div className="space-y-3 flex-grow">
                  {tutors.length > 0
                    ? tutors.map((t,i) => <TutorCard key={t.id} t={t} i={i} />)
                    : Array.from({length:4}).map((_,i) => (
                        <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                      ))
                  }
                </div>
                <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} transition={{ delay:0.2 }}
                  className="mt-6 border-t border-gray-100 pt-6">
                  <Link href="/connect">
                    <div className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition duration-200 cursor-pointer text-center text-gray-500 hover:text-blue-600 font-bold text-sm">
                      + Become a Collaborator
                    </div>
                  </Link>
                </motion.div>
              </div>

            </div>
          </div>
        </section>

        {/* ── FEATURES GRID ── */}
        <section className="py-24 px-4 bg-white border-y border-gray-200" id="features">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-4">
                The AR/VR Ecosystem
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                One unified platform for 3D creators, AR/VR developers, engineers and global collaborators.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-cols-4 gap-6">
              {FEATURES.map((f,i) => <FeatureCard key={f.href} f={f} i={i} />)}
            </div>
          </div>
        </section>

        {/* ── RECENT MODEL GALLERY ── */}
        {recentModels.length > 0 && (
          <section className="py-24 px-4 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                className="flex items-center justify-between mb-10 pb-4 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">
                    Featured Models
                  </h2>
                </div>
                <Link href="/gallery">
                  <button className="px-5 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold shadow-sm hover:bg-gray-50 transition">
                    View Gallery →
                  </button>
                </Link>
              </motion.div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {recentModels.map((m,i) => <FloatingModelCard key={m.id} m={m} i={i} />)}
              </div>
            </div>
          </section>
        )}

        {/* ── ECOSYSTEM STATS ── */}
        <section className="w-full bg-[#5B4BDB] py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 md:gap-y-0 divide-x-0 md:divide-x border-gray-400/30">
              
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-col items-center text-center px-4">
                <div className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight">
                  {statsLoading ? "—" : <Counter target={stats.models} suffix="+" />}
                </div>
                <div className="text-white/80 text-sm md:text-base font-medium">3D Models Uploaded</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="flex flex-col items-center text-center px-4 md:border-l border-white/20">
                <div className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight">
                  {statsLoading ? "—" : <Counter target={stats.developers} suffix="+" />}
                </div>
                <div className="text-white/80 text-sm md:text-base font-medium">Verified Developers</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col items-center text-center px-4 md:border-l border-white/20">
                <div className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight">
                  {statsLoading ? "—" : <Counter target={stats.downloads} suffix="+" />}
                </div>
                <div className="text-white/80 text-sm md:text-base font-medium">Model Downloads</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }} className="flex flex-col items-center text-center px-4 md:border-l border-white/20">
                <div className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight">
                  {statsLoading ? "—" : <Counter target={stats.certifications} />}
                </div>
                <div className="text-white/80 text-sm md:text-base font-medium">Certifications Issued</div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ── COLLABORATORS ── */}
        {collaborators.length > 0 && (
          <section className="py-24 px-4 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                className="text-center mb-12">
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-2">Academic Partners</p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
                  Our Collaborators
                </h2>
              </motion.div>
              <div className="flex flex-wrap justify-center gap-6">
                {collaborators.map((c,i) => (
                  <motion.div key={c.id} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
                    viewport={{ once:true }} transition={{ duration:0.4, delay:i*0.06 }}>
                    <Link href="/collaborators">
                      <div className="w-40 p-6 rounded-2xl bg-white border border-gray-200 hover:shadow-md transition duration-300 cursor-pointer text-center group">
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition shadow-sm text-xl font-bold text-gray-400">
                          {c.avatar
                            ? <img src={c.avatar} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                            : c.name?.[0]
                          }
                        </div>
                        <p className="text-gray-900 text-sm font-bold truncate">{c.name}</p>
                        <p className="text-gray-500 text-xs truncate mt-1">{c.role}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="py-24 px-4 bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              className="p-12 md:p-20">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900 mb-6">
                Start Creating Today
              </h2>
              <p className="text-gray-500 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                Join the network. Upload your 3D models, collaborate globally, and excel in your creative work on SYNTHÉ.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {user ? (
                  <>
                    <Link href="/upload">
                      <button className="px-10 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload a Project
                      </button>
                    </Link>
                    <Link href="/dashboard">
                      <button className="px-10 py-4 rounded-xl font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm transition">
                        Go to Dashboard →
                      </button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/signup">
                      <button className="px-10 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition">
                        Get Started Free
                      </button>
                    </Link>
                    <Link href="/gallery">
                      <button className="px-10 py-4 rounded-xl font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm transition">
                        Explore Gallery →
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </section>

      </div>
      <Footer />
    </div>
  );
}
