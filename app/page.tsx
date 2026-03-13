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
  glb:"#a78bfa", gltf:"#a78bfa", obj:"#22d3ee", fbx:"#22d3ee", dwg:"#fbbf24", dxf:"#fbbf24",
};

const PLATFORM_TICKER = [
  "3D Models","AR Ready","VR Ready","AutoCAD","Requests","Certification",
  "Connect & Learn","PIET Collab","Shader Art","Real-time 3D",
];

const FEATURES = [
  { title:"3D Gallery",        href:"/gallery",           color:"#a78bfa", tag:"4 formats",
    desc:"Browse, preview and download GLB, GLTF, OBJ & FBX models with live 3D viewer.",
    icon:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { title:"AR / VR Ready",     href:"/gallery?mode=ar",   color:"#34d399", tag:"WebXR",
    desc:"Models tagged and optimized for ARCore, ARKit, WebXR, Oculus and mixed reality platforms.",
    icon:"M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" },
  { title:"AutoCAD Hub",       href:"/autocad",           color:"#fbbf24", tag:"CAD",
    desc:"Engineering DWG and DXF drawings — upload, download and preview CAD files online.",
    icon:"M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" },
  { title:"Connect & Learn",   href:"/connect",           color:"#22d3ee", tag:"Live sessions",
    desc:"Book 1-on-1 lessons with certified developers. Use their personal booking link — zero platform fees.",
    icon:"M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
  { title:"Certification",     href:"/certification",     color:"#818cf8", tag:"Verified",
    desc:"Apply for developer certification. Unlock verified badge, priority listing and exclusive opportunities.",
    icon:"M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
  { title:"Public Requests",   href:"/requests",          color:"#38bdf8", tag:"Open bids",
    desc:"Publicly request a custom 3D model. Developers apply with proposals — you pick the best.",
    icon:"M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
  { title:"PIET Collaboration", href:"/collaborators",   color:"#c084fc", tag:"Research",
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

// ─── Ticker ───────────────────────────────────────────────────────────────────
function Ticker() {
  const items = [...PLATFORM_TICKER, ...PLATFORM_TICKER];
  return (
    <div className="overflow-hidden py-3 border-y border-white/[0.04] bg-white/[0.01] select-none">
      <motion.div animate={{ x:["0%","-50%"] }} transition={{ duration:28, repeat:Infinity, ease:"linear" }}
        style={{ willChange:"transform" }} className="flex gap-0 whitespace-nowrap">
        {items.map((item,i) => (
          <span key={i} className="inline-flex items-center gap-3 px-6 text-[10px] font-black uppercase tracking-[0.25em] text-white/20">
            <span className="w-1 h-1 rounded-full bg-violet-400/50 flex-shrink-0" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── 3D Cube Animation ─────────────────────────────────────────────────────────
function RotatingCube() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div
        animate={{ rotateX: 360, rotateY: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ willChange: "transform", perspective: "1200px" }}
        className="relative w-32 h-32">
        {/* Cube faces */}
        {[
          { bg: "rgba(167, 139, 250, 0.15)", transform: "translateZ(64px)" },
          { bg: "rgba(34, 211, 238, 0.15)", transform: "rotateY(180deg) translateZ(64px)" },
          { bg: "rgba(251, 191, 36, 0.15)", transform: "rotateY(90deg) translateZ(64px)" },
          { bg: "rgba(52, 211, 153, 0.15)", transform: "rotateY(-90deg) translateZ(64px)" },
          { bg: "rgba(251, 113, 133, 0.15)", transform: "rotateX(90deg) translateZ(64px)" },
          { bg: "rgba(129, 140, 248, 0.15)", transform: "rotateX(-90deg) translateZ(64px)" },
        ].map((face, i) => (
          <div
            key={i}
            className="absolute w-32 h-32 border border-white/10"
            style={{
              background: face.bg,
              transform: face.transform,
              backfaceVisibility: "hidden",
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ─── Revolving Dots ───────────────────────────────────────────────────────────
function RevolvingDots() {
  const dotColors = ["#a78bfa", "#22d3ee", "#34d399", "#fbbf24"];
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Outer ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{ willChange: "transform" }}
        className="absolute w-96 h-96 border border-white/5 rounded-full">
        {dotColors.map((color, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: color,
              boxShadow: `0 0 20px ${color}`,
              left: "50%",
              top: "0%",
              transform: `translateX(-50%) rotate(${(i * 90)}deg) translateY(-192px)`,
            }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </motion.div>

      {/* Middle ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        style={{ willChange: "transform" }}
        className="absolute w-64 h-64 border border-white/3 rounded-full">
        {dotColors.map((color, i) => (
          <div
            key={`mid-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: color,
              opacity: 0.5,
              left: "50%",
              top: "0%",
              transform: `translateX(-50%) rotate(${(i * 90) + 45}deg) translateY(-128px)`,
            }}
          />
        ))}
      </motion.div>

      {/* Inner ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{ willChange: "transform" }}
        className="absolute w-40 h-40 border border-white/5 rounded-full">
        {dotColors.map((color, i) => (
          <div
            key={`in-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: color,
              left: "50%",
              top: "0%",
              transform: `translateX(-50%) rotate(${(i * 90) + 22.5}deg) translateY(-80px)`,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ─── Tilt model card ──────────────────────────────────────────────────────────
function FloatingModelCard({ m, i }: { m:RecentModel; i:number }) {
  const ext   = m.fileType?.toLowerCase() ?? "glb";
  const color = FILE_COLORS[ext] ?? "#a78bfa";
  const ref   = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx:0, ry:0 });

  return (
    <motion.div ref={ref}
      initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
      transition={{ duration:0.45, delay:i*0.07 }}
      onMouseMove={e => {
        const r = ref.current!.getBoundingClientRect();
        setTilt({ rx:-(((e.clientY-r.top)/r.height)-0.5)*14, ry:(((e.clientX-r.left)/r.width)-0.5)*14 });
      }}
      onMouseLeave={() => setTilt({ rx:0, ry:0 })}
      style={{ willChange:"transform", transform:`perspective(600px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`, transition:"transform 0.18s ease" }}>
      <Link href={`/gallery/${m.id}`}>
        <div className="group relative rounded-2xl border border-white/6 bg-white/[0.025] overflow-hidden hover:border-white/15 transition duration-300 cursor-pointer"
          style={{ boxShadow: tilt.rx !== 0 ? `0 20px 60px ${color}22` : "none" }}>
          <div className="relative aspect-square overflow-hidden" style={{ background:`linear-gradient(135deg,${color}14,rgba(0,0,0,0))` }}>
            {m.thumbnailUrl
              ? <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
              : <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-8 h-8 opacity-10" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
            }
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-400 pointer-events-none"
              style={{ background:`linear-gradient(135deg,${color}08,transparent 50%,${color}06)` }} />
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-black"
              style={{ color, background:`${color}25`, border:`1px solid ${color}40` }}>
              {ext.toUpperCase()}
            </div>
            {m.isPaid
              ? <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-black border border-emerald-500/30 bg-emerald-500/20 text-emerald-300">₹{m.price}</div>
              : <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-black border border-white/10 bg-black/40 text-white/40">Free</div>
            }
          </div>
          <div className="p-3">
            <p className="text-white/70 text-[10px] font-bold line-clamp-1">{m.title}</p>
            <p className="text-white/25 text-[9px] truncate mt-0.5">{m.authorName}</p>
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
    <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
      transition={{ duration:0.5, delay:i*0.06 }}
      onHoverStart={() => setHover(true)} onHoverEnd={() => setHover(false)}>
      <Link href={f.href}>
        <div className="group relative h-full p-6 rounded-3xl border border-white/6 bg-white/[0.025] hover:border-white/12 transition duration-300 cursor-pointer overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background:`linear-gradient(90deg,transparent,${f.color}40,transparent)` }} />
          <AnimatePresence>
            {hover && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="absolute inset-0 pointer-events-none"
                style={{ background:`radial-gradient(ellipse at top left,${f.color}10,transparent 65%)` }} />
            )}
          </AnimatePresence>
          <div className="flex items-start justify-between mb-5">
            <motion.div animate={{ scale:hover?1.12:1, rotate:hover?6:0 }}
              transition={{ type:"spring", stiffness:400, damping:20 }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background:`${f.color}15`, border:`1px solid ${f.color}25` }}>
              <svg className="w-5 h-5" style={{ color:f.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={f.icon} />
              </svg>
            </motion.div>
            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black border"
              style={{ background:`${f.color}12`, color:f.color, borderColor:`${f.color}30` }}>
              {f.tag}
            </span>
          </div>
          <h3 className="text-white font-black text-base mb-2 relative z-10">{f.title}</h3>
          <p className="text-white/35 text-sm leading-relaxed relative z-10">{f.desc}</p>
          <motion.div animate={{ x:hover?0:-4, opacity:hover?1:0 }} transition={{ duration:0.2 }}
            className="absolute bottom-5 right-5" style={{ color:f.color }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}


// ─── Tutor card ───────────────────────────────────────────────────────────────
function TutorCard({ t, i }: { t:TutorProfile; i:number }) {
  return (
    <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true }} transition={{ delay:i*0.08 }}>
      <Link href="/connect">
        <div className="group flex items-center gap-3 p-4 rounded-2xl border border-white/6 bg-white/[0.025] hover:border-white/14 transition duration-200 cursor-pointer">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black overflow-hidden"
            style={{ background:`${t.color}25`, border:`1px solid ${t.color}40`, color:t.color }}>
            {t.avatar
              ? <img src={t.avatar} className="w-full h-full object-cover" />
              : t.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2)
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-black truncate">{t.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <span className="text-amber-300 text-[10px] font-black">{t.rating || "New"}</span>
              <span className="text-white/20 text-[10px]">· {t.totalSessions || 0} sessions</span>
            </div>
          </div>
          <span className="text-white/60 text-xs font-black flex-shrink-0">{t.currency||"₹"}{t.hourlyRate||0}/hr</span>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseX    = useMotionValue(0);
  const mouseY    = useMotionValue(0);
  const springX   = useSpring(mouseX, { stiffness:24, damping:26, mass:1.4 });
  const springY   = useSpring(mouseY, { stiffness:24, damping:26, mass:1.4 });

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

  // Starfield
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    type Star = { x:number; y:number; r:number; o:number; speed:number };
    const stars: Star[] = [];
    const resize = () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    for (let i=0; i<260; i++) stars.push({
      x:Math.random()*canvas.width, y:Math.random()*canvas.height,
      r:Math.random()*1.3+0.2, o:Math.random()*0.55+0.1, speed:Math.random()*0.18+0.04,
    });
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      stars.forEach(s => {
        s.y -= s.speed;
        if (s.y < 0) { s.y = canvas.height; s.x = Math.random()*canvas.width; }
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${s.o})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  }, []);

  // Mouse parallax
  useEffect(() => {
    const h = (e: MouseEvent) => {
      mouseX.set((e.clientX/window.innerWidth-0.5)*44);
      mouseY.set((e.clientY/window.innerHeight-0.5)*44);
    };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
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
    { label:"3D Models",     val:stats.models,        color:"#a78bfa" },
    { label:"Developers",    val:stats.developers,    color:"#22d3ee" },
    { label:"Downloads",     val:stats.downloads,     color:"#34d399" },
    { label:"Certifications",val:stats.certifications,color:"#fbbf24" },
  ];

  return (
    <div className="min-h-screen bg-[#050008] overflow-x-hidden">
      <Navbar />

      {/* Starfield */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-55" />

      {/* Nebula orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div style={{ x:springX, y:springY, willChange:"transform" }}
          className="absolute top-[12%] left-[8%] w-[520px] h-[520px] opacity-[0.22]"
          animate={{ scale:[1,1.06,1] }} transition={{ duration:9, repeat:Infinity }}>
          <div className="w-full h-full rounded-full" style={{ background:"radial-gradient(circle,#7c3aed,transparent 70%)", filter:"blur(80px)" }} />
        </motion.div>
        <motion.div style={{ x:springX, y:springY, willChange:"transform" }}
          className="absolute top-[42%] right-[4%] w-[420px] h-[420px] opacity-[0.16]"
          animate={{ scale:[1,1.09,1] }} transition={{ duration:11, repeat:Infinity, delay:2 }}>
          <div className="w-full h-full rounded-full" style={{ background:"radial-gradient(circle,#0891b2,transparent 70%)", filter:"blur(80px)" }} />
        </motion.div>
        <motion.div className="absolute bottom-[18%] left-[22%] w-[320px] h-[320px] opacity-[0.13]"
          animate={{ scale:[1,1.07,1] }} transition={{ duration:13, repeat:Infinity, delay:4 }}
          style={{ willChange:"transform" }}>
          <div className="w-full h-full rounded-full" style={{ background:"radial-gradient(circle,#fbbf24,transparent 70%)", filter:"blur(80px)" }} />
        </motion.div>
        <motion.div style={{ x:springX, y:springY, willChange:"transform" }}
          className="absolute top-[65%] left-[60%] w-[280px] h-[280px] opacity-[0.10]"
          animate={{ scale:[1,1.1,1] }} transition={{ duration:15, repeat:Infinity, delay:6 }}>
          <div className="w-full h-full rounded-full" style={{ background:"radial-gradient(circle,#fb7185,transparent 70%)", filter:"blur(70px)" }} />
        </motion.div>
      </div>

      {/* 3D Cube + Revolving Dots */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <RotatingCube />
        <RevolvingDots />
      </div>

      <div className="relative z-10">

        {/* HERO */}
        <HeroComponent user={user} stats={stats} statsLoading={statsLoading} />

        {/* TICKER */}
        <Ticker />

        {/* SCROLLING GALLERY */}
        <ScrollingGallery />

        {/* ── LIVE PLATFORM ACTIVITY ── */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              className="flex items-center gap-3 mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300/80 text-xs font-black uppercase tracking-widest">Live Activity</span>
              </div>
              <div className="h-px flex-1 bg-white/[0.04]" />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Recent uploads */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white/50 text-xs font-black uppercase tracking-widest">Recent Uploads</p>
                  <Link href="/gallery"><span className="text-violet-400/70 text-xs font-black hover:text-violet-300 transition duration-200">View all →</span></Link>
                </div>
                <div className="space-y-2">
                  {recentModels.slice(0,5).length > 0
                    ? recentModels.slice(0,5).map((m,i) => {
                        const ext = m.fileType?.toLowerCase()??"glb";
                        const color = FILE_COLORS[ext]??"#a78bfa";
                        return (
                          <motion.div key={m.id} initial={{ opacity:0, x:-12 }} whileInView={{ opacity:1, x:0 }}
                            viewport={{ once:true }} transition={{ delay:i*0.06 }}>
                            <Link href={`/gallery/${m.id}`}>
                              <div className="group flex items-center gap-3 p-3 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/12 transition duration-200 cursor-pointer">
                                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-white/8"
                                  style={{ background:`${color}12` }}>
                                  {m.thumbnailUrl
                                    ? <img src={m.thumbnailUrl} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-[8px] font-black" style={{ color }}>{ext.toUpperCase()}</div>
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white/75 text-xs font-bold truncate">{m.title}</p>
                                  <p className="text-white/25 text-[10px] mt-0.5">{m.authorName}</p>
                                </div>
                                <div className="flex-shrink-0">
                                  {m.isPaid
                                    ? <span className="text-emerald-400 text-[10px] font-black">₹{m.price}</span>
                                    : <span className="text-white/25 text-[10px] font-black">Free</span>
                                  }
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                        );
                      })
                    : Array.from({length:5}).map((_,i) => (
                        <div key={i} className="h-16 rounded-2xl bg-white/[0.02] border border-white/4 animate-pulse" />
                      ))
                  }
                </div>
              </div>

              {/* Open requests */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white/50 text-xs font-black uppercase tracking-widest">Open Requests</p>
                  <Link href="/requests"><span className="text-pink-400/70 text-xs font-black hover:text-pink-300 transition duration-200">Post one →</span></Link>
                </div>
                <div className="space-y-2">
                  <motion.div initial={{ opacity:0, x:-12 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }}>
                    <Link href="/requests/post">
                      <div className="group flex items-center gap-3 p-4 rounded-2xl border border-dashed border-white/10 hover:border-pink-500/30 transition duration-200 cursor-pointer">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black" style={{ background:"#fb718518", border:"1px solid #fb718530", color:"#fb7185" }}>+</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/60 text-xs font-black group-hover:text-white transition duration-200">Post a Project Request</p>
                          <p className="text-white/25 text-[10px] mt-0.5">Developers will apply with proposals</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                  <motion.div initial={{ opacity:0, x:-12 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:0.08 }}>
                    <Link href="/connect">
                      <div className="group flex items-center gap-3 p-4 rounded-2xl border border-white/6 bg-white/[0.025] hover:border-white/14 transition duration-200 cursor-pointer">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black" style={{ background:"#a78bfa18", border:"1px solid #a78bfa30", color:"#a78bfa" }}>↗</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-black truncate">Hire a Developer Directly</p>
                          <p className="text-white/30 text-[10px] mt-0.5">Browse verified 3D/AR/VR developers</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                </div>
              </div>

              {/* Live tutors */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white/50 text-xs font-black uppercase tracking-widest">Available Tutors</p>
                  <Link href="/connect"><span className="text-cyan-400/70 text-xs font-black hover:text-cyan-300 transition duration-200">View all →</span></Link>
                </div>
                <div className="space-y-2">
                  {tutors.length > 0
                    ? tutors.map((t,i) => <TutorCard key={t.id} t={t} i={i} />)
                    : Array.from({length:4}).map((_,i) => (
                        <div key={i} className="h-16 rounded-2xl bg-white/[0.02] border border-white/4 animate-pulse" />
                      ))
                  }
                </div>
                <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} transition={{ delay:0.3 }}
                  className="mt-4">
                  <Link href="/connect">
                    <div className="group p-4 rounded-2xl border border-dashed border-white/10 hover:border-cyan-500/30 transition duration-200 cursor-pointer text-center">
                      <p className="text-white/25 text-xs font-black group-hover:text-cyan-300/70 transition duration-200">+ Become a tutor →</p>
                    </div>
                  </Link>
                </motion.div>
              </div>

            </div>
          </div>
        </section>

        {/* ── FEATURES GRID ── */}
        <section className="py-24 px-4" id="features">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 mb-5">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-violet-300/90 text-sm font-semibold uppercase tracking-widest">Powerful Features</span>
              </div>
              <h2 className="text-5xl font-black tracking-tighter text-white mb-3">
                Everything You{" "}
                <span style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                  Need
                </span>
              </h2>
              <p className="text-white/35 text-base max-w-xl mx-auto">
                One unified platform for 3D creators, AR/VR developers, engineers and global collaborators.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {FEATURES.map((f,i) => <FeatureCard key={f.href} f={f} i={i} />)}
            </div>
          </div>
        </section>

        {/* ── RECENT MODEL GALLERY ── */}
        {recentModels.length > 0 && (
          <section className="py-16 px-4">
            <div className="max-w-7xl mx-auto">
              <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Fresh uploads</p>
                  <h2 className="text-3xl font-black tracking-tighter text-white">
                    Recently{" "}
                    <span style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                      Added
                    </span>
                  </h2>
                </div>
                <Link href="/gallery">
                  <motion.div whileHover={{ scale:1.03 }} style={{ willChange:"transform" }}
                    className="text-sm font-black text-violet-400/70 hover:text-violet-300 transition duration-200 cursor-pointer">
                    View all →
                  </motion.div>
                </Link>
              </motion.div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                {recentModels.map((m,i) => <FloatingModelCard key={m.id} m={m} i={i} />)}
              </div>
            </div>
          </section>
        )}

        {/* ── ECOSYSTEM STATS ── */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              className="relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl overflow-hidden p-10 md:p-14">
              <div className="absolute top-0 left-0 right-0 h-[1.5px]"
                style={{ background:"linear-gradient(90deg,transparent,#a78bfa60,#22d3ee50,#fbbf2440,#34d39940,transparent)" }} />
              <div className="absolute inset-0 pointer-events-none"
                style={{ background:"radial-gradient(ellipse at 50% 0%,rgba(124,58,237,0.07) 0%,transparent 70%)" }} />

              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-cyan-300/90 text-sm font-semibold uppercase tracking-widest">Platform Stats</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-3">
                  SYNTHÉ{" "}
                  <span style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#22d3ee,#fbbf24)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                    Ecosystem
                  </span>
                </h2>
                <p className="text-white/35 text-base max-w-lg mx-auto">Live data from our community, updated in real-time.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
                {STATS_CFG.map((s,i) => (
                  <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
                    viewport={{ once:true }} transition={{ duration:0.5, delay:i*0.1 }}
                    className="relative text-center p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition duration-300">
                    <div className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                      style={{ background:`linear-gradient(90deg,transparent,${s.color}45,transparent)` }} />
                    {statsLoading
                      ? <div className="h-12 bg-white/[0.05] rounded-xl animate-pulse mb-3 mx-auto w-24" />
                      : (
                        <motion.p initial={{ scale:0.8, opacity:0 }} whileInView={{ scale:1, opacity:1 }}
                          viewport={{ once:true }} transition={{ type:"spring", stiffness:300, damping:20, delay:i*0.1+0.2 }}
                          className="text-4xl md:text-5xl font-black tracking-tighter mb-1"
                          style={{ backgroundImage:`linear-gradient(135deg,${s.color},white)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                          <Counter target={s.val} />
                        </motion.p>
                      )
                    }
                    <p className="text-white/35 text-xs font-semibold uppercase tracking-[0.2em]">{s.label}</p>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {[
                  { label:"Browse Gallery",  href:"/gallery",       color:"#a78bfa" },
                  { label:"Find Developers", href:"/connect",       color:"#22d3ee" },
                  { label:"AutoCAD Hub",     href:"/autocad",       color:"#fbbf24" },
                  { label:"Post a Request",  href:"/requests/post", color:"#34d399" },
                  { label:"PIET Collab",     href:"/collaborators", color:"#818cf8" },
                  { label:"Get Certified",   href:"/certification", color:"#fb7185" },
                ].map((l,i) => (
                  <Link href={l.href} key={i}>
                    <motion.div whileHover={{ scale:1.05, y:-2 }} whileTap={{ scale:0.97 }}
                      style={{ willChange:"transform", borderColor:`${l.color}30`, background:`${l.color}10`, color:l.color } as React.CSSProperties}
                      className="px-5 py-2.5 rounded-xl border text-xs font-black transition duration-200 cursor-pointer">
                      {l.label}
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── COLLABORATORS ── */}
        {collaborators.length > 0 && (
          <section className="py-16 px-4">
            <div className="max-w-7xl mx-auto">
              <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Academic Partners</p>
                  <h2 className="text-3xl font-black tracking-tighter text-white">
                    Our{" "}
                    <span style={{ backgroundImage:"linear-gradient(90deg,#818cf8,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                      Collaborators
                    </span>
                  </h2>
                </div>
                <Link href="/collaborators">
                  <motion.div whileHover={{ scale:1.03 }} style={{ willChange:"transform" }}
                    className="text-sm font-black text-indigo-400/70 hover:text-indigo-300 transition duration-200 cursor-pointer">
                    View all →
                  </motion.div>
                </Link>
              </motion.div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {collaborators.map((c,i) => (
                  <motion.div key={c.id} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
                    viewport={{ once:true }} transition={{ duration:0.4, delay:i*0.06 }}>
                    <Link href="/collaborators">
                      <div className="group p-5 rounded-2xl border border-white/6 bg-white/[0.025] hover:border-indigo-500/25 transition duration-300 cursor-pointer text-center">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center mx-auto mb-3 font-black text-lg group-hover:scale-110 transition duration-300"
                          style={{ background:`${c.color ?? "#818cf8"}15`, color:c.color ?? "#818cf8" }}>
                          {c.avatar
                            ? <img src={c.avatar} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                            : c.name?.[0]
                          }
                        </div>
                        <p className="text-white/70 text-xs font-black line-clamp-1">{c.name}</p>
                        <p className="text-white/25 text-[10px] line-clamp-1 mt-0.5">{c.role}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              className="relative rounded-3xl border border-white/8 bg-white/[0.025] backdrop-blur-xl overflow-hidden p-12 md:p-20">
              <div className="absolute top-0 left-0 right-0 h-[1.5px]"
                style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.6),rgba(34,211,238,0.5),transparent)" }} />
              <div className="absolute inset-0 pointer-events-none"
                style={{ background:"radial-gradient(ellipse at center,rgba(124,58,237,0.08) 0%,transparent 70%)" }} />
              {[...Array(6)].map((_,i) => (
                <motion.div key={i} className="absolute w-1 h-1 rounded-full pointer-events-none"
                  style={{ left:`${15+i*14}%`, top:`${20+i*10}%`, background:["#a78bfa","#22d3ee","#34d399","#fbbf24","#fb7185","#818cf8"][i], opacity:0.4 }}
                  animate={{ y:[-10,10,-10], opacity:[0.2,0.6,0.2] }}
                  transition={{ duration:3+i, repeat:Infinity, delay:i*0.5 }} />
              ))}
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 mb-6">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-violet-300/90 text-sm font-semibold uppercase tracking-widest">Join SYNTHÉ</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-4 leading-none">
                Start Creating<br />
                <span style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#22d3ee,#fbbf24)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                  Today
                </span>
              </h2>
              <p className="text-white/40 text-base mb-10 max-w-lg mx-auto leading-relaxed">
                Upload your 3D models, collaborate globally, and earn from your creative work on SYNTHÉ.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {user ? (
                  <>
                    <Link href="/upload">
                      <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                        style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white cursor-pointer relative overflow-hidden">
                        <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                          style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                        <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="relative z-10">Upload a Project</span>
                      </motion.div>
                    </Link>
                    <Link href="/dashboard">
                      <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }} style={{ willChange:"transform" }}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white/60 border border-white/12 hover:border-white/25 hover:text-white/80 transition duration-200 cursor-pointer">
                        Go to Dashboard →
                      </motion.div>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/signup">
                      <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                        style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white cursor-pointer relative overflow-hidden">
                        <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                          style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                        <span className="relative z-10">Get Started Free →</span>
                      </motion.div>
                    </Link>
                    <Link href="/gallery">
                      <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }} style={{ willChange:"transform" }}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white/60 border border-white/12 hover:border-white/25 hover:text-white/80 transition duration-200 cursor-pointer">
                        Explore Gallery →
                      </motion.div>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
