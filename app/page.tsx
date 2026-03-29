"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection, getDocs, query, orderBy, limit,
  getCountFromServer, where,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import Footer from "./components/Footer";
import VideoBackground from "./components/VideoBackground";
import CountUp from "./components/CountUp";
import TextReveal from "./components/TextReveal";
import MagneticButton from "./components/MagneticButton";
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
  hourlyRate: number; currency: string; rating: number; totalSessions: number;
  color: string; certified?: boolean;
}

// ─── Data Constants ────────────────────────────────────────────────────────
const PLATFORM_SECTIONS = [
  {
    title: "3D Verse",
    href: "/verse",
    tag: "GLB · FBX",
    accent: "#3B82F6",
    hoverBorder: "hover:border-blue-500/40",
    desc: "Browse and buy precision 3D models. Hover to interact live in WebGL. Experience spatial assets like never before.",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    gridSpan: "md:col-span-2 md:row-span-2",
  },
  {
    title: "XR Zone",
    href: "/xr-zone",
    tag: "AR · VR",
    accent: "#5B4BDB",
    hoverBorder: "hover:border-violet-500/40",
    desc: "Immersive AR/VR builds from real developers.",
    icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2",
    gridSpan: "md:col-span-1 md:row-span-1",
  },
  {
    title: "AutoCAD",
    href: "/autocad",
    tag: "DWG",
    accent: "#F59E0B",
    hoverBorder: "hover:border-amber-500/40",
    desc: "Professional blueprints and drawings.",
    icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
    gridSpan: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Connect",
    href: "/connect",
    tag: "Network",
    accent: "#06B6D4",
    hoverBorder: "hover:border-cyan-500/40",
    desc: "Find collaborators and send requests.",
    icon: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586",
    gridSpan: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Learn & Build",
    href: "/learn",
    tag: "Academy & Freelance",
    accent: "#10B981",
    hoverBorder: "hover:border-emerald-500/40",
    desc: "Live workshops, AI-driven roadmaps, and freelance projects available all in one ecosystem.",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253",
    gridSpan: "md:col-span-3 md:row-span-1",
  },
];

const GEMINI_FEATURES = [
  {
    title: "XR Roadmap Generator",
    href: "/learn/roadmap",
    desc: "Personalised 4-6 phase AR/VR learning path based on your exact goals.",
    icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4",
  },
  {
    title: "XR Concept Chat",
    href: "/learn",
    desc: "Ask anything — WebXR, SLAM, ARKit. Gemini provides role-specific answers.",
    icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  },
  {
    title: "AI Creator Matcher",
    href: "/connect",
    desc: "Describe what you need — get recommended the best 2-3 creators with reasoning.",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857",
  },
  {
    title: "Model Meta Writer",
    href: "/verse/upload",
    desc: "Upload any 3D file — AI auto-generates title, tags, and reasonable pricing.",
    icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
  },
];

const DEMO_STEPS = [
  { step: "01", text: "Browse 3D Verse", sub: "Models glow based on popularity" },
  { step: "02", text: "Hover any card", sub: "Model spins live — no click needed" },
  { step: "03", text: "Open cinematic mode", sub: "Studio lighting, bloom, auto-orbit" },
  { step: "04", text: "Tap AR on phone", sub: "Model appears in your real room" },
];

// ─── Redesigned Bento Feature Card ──────────────────────────────────────────
function BentoCard({ s, i }: { s: typeof PLATFORM_SECTIONS[0]; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      className={`relative group rounded-[2.5rem] overflow-hidden bg-[#101015] border border-white/5 ${s.hoverBorder} transition-colors duration-500 ${s.gridSpan}`}
    >
      <Link href={s.href} className="absolute inset-0 z-20" />
      
      {/* Dynamic Background Glows */}
      <div 
        className="absolute w-[300px] h-[300px] rounded-full blur-[100px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none -right-20 -top-20"
        style={{ backgroundColor: s.accent }}
      />
      <div 
        className="absolute w-[250px] h-[250px] rounded-full blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none -left-20 -bottom-20"
        style={{ backgroundColor: s.accent }}
      />
      
      {/* Card Content Structure */}
      <div className="relative h-full p-8 md:p-10 flex flex-col justify-between z-10 min-h-[250px] md:min-h-[300px]">
        
        {/* Top: Icon & Tag */}
        <div className="flex justify-between items-start w-full">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-xl"
            style={{ color: s.accent }}
          >
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
               <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
             </svg>
          </div>
          <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 border border-white/10 text-white/50 group-hover:bg-white/10 group-hover:text-white transition-all shadow-sm">
            {s.tag}
          </span>
        </div>
        
        {/* Bottom: Text & Interaction */}
        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out mt-12 md:mt-20">
          <h3 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white transition-all duration-300">
            {s.title}
          </h3>
          <p className="text-[#9494AD] font-medium text-lg leading-relaxed max-w-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75 hidden md:block">
            {s.desc}
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm font-bold opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-500 delay-150" style={{ color: s.accent }}>
            Explore Section 
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

// ─── Redesigned AI Feature Box ──────────────────────────────────────────────
function AIFeatureBox({ f, i }: { f: typeof GEMINI_FEATURES[0]; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: i * 0.1 }}
      className="group relative bg-[#141420]/50 backdrop-blur-xl border border-[#2A2A3E] hover:border-[#5B4BDB]/50 rounded-[2rem] p-8 overflow-hidden transition-all duration-500"
    >
      <Link href={f.href} className="absolute inset-0 z-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#5B4BDB]/0 to-[#5B4BDB]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="w-12 h-12 rounded-[1rem] bg-[#5B4BDB]/10 border border-[#5B4BDB]/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-[0_0_15px_rgba(91,75,219,0.2)]">
        <svg className="w-6 h-6 text-[#A594FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
        </svg>
      </div>
      
      <h3 className="text-xl font-black text-white mb-3 group-hover:text-[#A594FF] transition-colors">{f.title}</h3>
      <p className="text-[#9494AD] font-semibold leading-relaxed text-sm">{f.desc}</p>
    </motion.div>
  );
}

// ─── Demo Strip Redesigned ──────────────────────────────────────────────────
function DemoStrip() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 0.9, 1], [0, 1, 1, 0]);

  return (
    <div ref={containerRef} className="w-full relative h-[250vh] bg-[#05050A]">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden border-y border-white/5">
        <VideoBackground variant="mesh" color="#5B4BDB" intensity={0.15} className="opacity-50" />
        <motion.div 
          style={{ scale, opacity }}
          className="max-w-7xl mx-auto px-6 w-full flex flex-col lg:flex-row items-center gap-16 relative z-10"
        >
          <div className="w-full lg:w-5/12 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full w-max">
              <span className="w-2 h-2 rounded-full bg-[#A594FF] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A594FF]">Interactive Workflow</span>
            </div>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tighter drop-shadow-2xl">
              Upload.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B4BDB] to-[#06B6D4]">Visualize.</span><br/>Deploy.
            </h2>
          </div>
          <div className="w-full lg:w-7/12 grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(91,75,219,0.1)_0%,transparent_60%)] pointer-events-none" />
            {DEMO_STEPS.map((s, i) => (
              <motion.div 
                key={s.step} 
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }} 
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="group relative p-8 bg-[#101015] border border-white/10 hover:border-[#5B4BDB]/40 transition duration-500 rounded-[2rem] overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity font-black text-5xl text-white">
                  {s.step}
                </div>
                <div className="relative z-10">
                  <p className="text-2xl font-black text-white mb-2">{s.text}</p>
                  <p className="text-[#9494AD] text-sm leading-relaxed font-semibold">{s.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Main Page Structure ──────────────────────────────────────────────────────
export default function HomePage() {
  const [user,          setUser]          = useState<any>(null);
  const [stats,         setStats]         = useState({ models: 0, developers: 0, downloads: 0, certifications: 0 });
  const [statsLoading,  setStatsLoading]  = useState(true);
  const [recentModels,  setRecentModels]  = useState<RecentModel[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function load() {
      setStatsLoading(true);
      try {
        const [mSnap, pSnap, cSnap, uSnap] = await Promise.all([
          getCountFromServer(collection(db, "models")),
          getCountFromServer(collection(db, "purchases")),
          getCountFromServer(collection(db, "certificationRequests")),
          getDocs(query(collection(db, "users"))),
        ]);
        setStats({
          models:         mSnap.data().count,
          developers:     uSnap.docs.filter(d => d.data().role === "developer").length,
          downloads:      pSnap.data().count,
          certifications: cSnap.data().count,
        });
      } catch (e) { console.error(e); }
      setStatsLoading(false);
    }
    load();
    
    // Load just models for the gallery strip
    getDocs(query(collection(db, "models"), orderBy("uploadedAt", "desc"), limit(8)))
      .then(s => setRecentModels(s.docs.map(d => ({ id: d.id, ...d.data() } as RecentModel))))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#05050A] flex flex-col font-sans selection:bg-[#5B4BDB]/40">
      <div className="relative z-10 flex-grow">

        {/* ═══ HERO ═══ */}
        <HeroComponent user={user} stats={stats} statsLoading={statsLoading} />

        {/* ═══ NEW BENTO GRID PLATFORM SECTIONS ═══ */}
        <section className="py-32 px-4 bg-[#05050A] relative overflow-hidden">
          <div className="max-w-[1400px] mx-auto relative px-4 md:px-8">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
                The ecosystem,<br/><span className="text-[#6B6B85]">unlocked.</span>
              </motion.h2>
              <p className="text-[#9494AD] font-semibold text-lg max-w-xl border-l-2 border-[#5B4BDB] pl-4">
                Everything you need to build, learn, and collaborate in the spatial internet, housed seamlessly under one roof.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[150px] md:auto-rows-[180px]">
              {PLATFORM_SECTIONS.map((s, i) => (
                <BentoCard key={s.title} s={s} i={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ REDESIGNED SCROLLING GALLERY ═══ */}
        <div className="bg-[#0A0A10] border-y border-white/5 py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(91,75,219,0.05)_0%,transparent_100%)] pointer-events-none" />
          <p className="text-center text-sm font-black uppercase tracking-[0.3em] text-[#6B6B85] mb-12">Latest spatial assets deployed</p>
          <ScrollingGallery />
        </div>

        {/* ═══ REDESIGNED DEMO STRIP ═══ */}
        <DemoStrip />

        {/* ═══ REDESIGNED GEMINI AI SECTION ═══ */}
        <section className="py-32 px-4 bg-[#0A0A0F] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#5B4BDB]/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
          
          <div className="max-w-[1400px] mx-auto relative z-10 px-4 md:px-8">
            <div className="flex flex-col lg:flex-row justify-between items-end gap-10 mb-20">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#5B4BDB]/30 bg-[#5B4BDB]/10 mb-6 backdrop-blur-md">
                  <svg className="w-4 h-4 text-[#A594FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-[#A594FF] text-xs font-black uppercase tracking-[0.1em]">Engineered with Gemini 2.0</span>
                </div>
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                  className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[1.1]">
                  AI woven into<br/>every pixel.
                </motion.h2>
              </div>
              <MagneticButton href="/learn/roadmap" variant="primary" className="shrink-0 bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                Try AI Architect →
              </MagneticButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {GEMINI_FEATURES.map((f, i) => (
                <AIFeatureBox key={f.title} f={f} i={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ REDESIGNED STATS ═══ */}
        <section className="w-full py-32 px-4 relative overflow-hidden bg-[#05050A]">
          <VideoBackground variant="particles" color="#5B4BDB" intensity={0.4} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-transparent to-[#05050A] pointer-events-none" />
          
          <div className="max-w-[1400px] mx-auto relative z-20 px-4 md:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 gap-y-16">
              {[
                { label: "Assets Uploaded",  val: stats.models,         suffix: "+" },
                { label: "Elite Devs",       val: stats.developers,     suffix: "+" },
                { label: "Global Downloads", val: stats.downloads,      suffix: "k" },
                { label: "Certifications",   val: stats.certifications, suffix: "" },
              ].map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1, type: "spring", bounce: 0.4 }}
                  className="flex flex-col items-center justify-center text-center group">
                  <div className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter drop-shadow-2xl group-hover:scale-110 transition-transform duration-500 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                    {statsLoading ? "—" : <CountUp target={s.val} suffix={s.suffix} showRing={false} />}
                  </div>
                  <div className="text-[#9494AD] font-bold text-sm tracking-widest uppercase">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ REDESIGNED CTA ═══ */}
        <section className="py-40 px-4 bg-[#0A0A10] relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[800px] h-[800px] bg-gradient-to-r from-[#5B4BDB]/20 to-[#06B6D4]/20 rounded-full blur-[200px]" />
          </div>
          <div className="max-w-4xl mx-auto text-center relative z-20">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <div className="mb-10 w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-[#5B4BDB] to-[#A594FF] p-[2px] shadow-[0_0_50px_rgba(91,75,219,0.4)]">
                <div className="w-full h-full bg-[#0A0A10] rounded-3xl flex items-center justify-center">
                   <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                   </svg>
                </div>
              </div>
              
              <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-8 leading-[0.9]">
                Deploy your<br/>imagination.
              </h2>
              <p className="text-[#9494AD] text-xl md:text-2xl font-semibold mb-12 max-w-2xl mx-auto leading-relaxed">
                Join the ultimate global network of 3D engineers, XR developers, and spatial computing pioneers.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {user ? (
                  <>
                    <MagneticButton href="/verse/upload" variant="primary" className="bg-[#5B4BDB] hover:bg-[#4C3EC7] text-white py-5 px-10 rounded-2xl text-lg shadow-[0_0_40px_rgba(91,75,219,0.5)] border-b-4 border-[#3A2E9F] active:border-b-0 active:translate-y-[4px]">
                      Upload to Verse →
                    </MagneticButton>
                  </>
                ) : (
                  <>
                    <MagneticButton href="/signup" variant="primary" className="bg-white hover:bg-gray-200 text-black py-5 px-10 rounded-2xl text-lg shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                      Create Infinity Account
                    </MagneticButton>
                    <MagneticButton href="/verse" variant="secondary" className="border border-white/20 text-white hover:bg-white/5 py-5 px-10 rounded-2xl text-lg">
                      Explore the Hub
                    </MagneticButton>
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