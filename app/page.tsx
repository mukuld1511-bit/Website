"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection, getDocs, query, orderBy, limit,
  getCountFromServer, where,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import Footer from "./components/Footer";
import VideoBackground from "./components/VideoBackground";
import CountUp from "./components/CountUp";
import GlowCard from "./components/GlowCard";
import TextReveal from "./components/TextReveal";
import MagneticButton from "./components/MagneticButton";

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

// ─── Platform sections ────────────────────────────────────────────────────────
const PLATFORM_SECTIONS = [
  {
    title: "3D Verse",
    href: "/verse",
    tag: "GLB · GLTF · OBJ · FBX",
    tagColor: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    accent: "#3B82F6",
    desc: "Browse and buy precision 3D models. Hover any card — it spins live in WebGL.",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    cta: "Browse 3D Verse",
  },
  {
    title: "XR Zone",
    href: "/xr-zone",
    tag: "AR · VR · WebXR",
    tagColor: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
    accent: "#5B4BDB",
    desc: "Immersive AR/VR builds from real developers. Place 3D objects in your room instantly.",
    icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2",
    cta: "Enter XR Zone",
  },
  {
    title: "AutoCAD Hub",
    href: "/autocad",
    tag: "DWG · DXF",
    tagColor: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    accent: "#F59E0B",
    desc: "Professional blueprints and engineering drawings for industrial and architectural design.",
    icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
    cta: "Open AutoCAD Hub",
  },
  {
    title: "Learn",
    href: "/learn",
    tag: "Live · AI Roadmap",
    tagColor: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    accent: "#10B981",
    desc: "Live workshops, AI-generated XR roadmaps. Book 1-on-1 sessions. 48 curated tools.",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    cta: "Start Learning",
  },
  {
    title: "Freelance",
    href: "/freelance",
    tag: "Projects · Bids",
    tagColor: "bg-pink-500/15 text-pink-400 border border-pink-500/20",
    accent: "#EC4899",
    desc: "Post projects, get bids, hire verified XR developers. 85% goes to the developer.",
    icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    cta: "Browse Freelance",
  },
  {
    title: "Connect",
    href: "/connect",
    tag: "Network · Chat",
    tagColor: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20",
    accent: "#06B6D4",
    desc: "Find collaborators, send project requests, and chat directly. Gemini AI matches you.",
    icon: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z",
    cta: "Connect Now",
  },
];

// ─── Gemini features ──────────────────────────────────────────────────────────
const GEMINI_FEATURES = [
  {
    title: "XR Roadmap Generator",
    href: "/learn/roadmap",
    desc: "Enter your age, goal, and experience — get a personalised 4-6 phase AR/VR learning path.",
    icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  },
  {
    title: "XR Concept Chat",
    href: "/learn",
    desc: "Ask anything — WebXR, SLAM, ARKit, Unity. Gemini answers based on your role.",
    icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  },
  {
    title: "AI Creator Matcher",
    href: "/connect",
    desc: "Describe what you need — Gemini recommends the best 2-3 creators with reasoning.",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    title: "Model Meta Writer",
    href: "/verse/upload",
    desc: "Upload any 3D file — Gemini auto-generates title, description, tags, and price.",
    icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
  },
];

// ─── Demo steps ───────────────────────────────────────────────────────────────
const DEMO_STEPS = [
  { step: "01", text: "Browse 3D Verse", sub: "Models glow based on popularity" },
  { step: "02", text: "Hover any card", sub: "Model spins live — no click needed" },
  { step: "03", text: "Open cinematic mode", sub: "Studio lighting, bloom, auto-orbit" },
  { step: "04", text: "Tap AR on phone", sub: "Model appears in your real room" },
];

// ─── Hero Title with per-letter animation ─────────────────────────────────────
function AnimatedTitle() {
  const letters = "SYNTHÉ".split("");
  return (
    <h1 className="text-[5rem] md:text-[8rem] lg:text-[10rem] font-black tracking-tighter leading-none mb-6 flex justify-center">
      {letters.map((letter, i) => {
        const startY = i % 2 === 0 ? -100 : 100;
        const startRot = (i % 3 === 0 ? -15 : 15);
        return (
          <motion.span
            key={i}
            className="inline-block bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent filter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            initial={{ y: startY, opacity: 0, rotateZ: startRot, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, rotateZ: 0, scale: 1 }}
            transition={{
              duration: 1,
              delay: 0.2 + i * 0.1,
              type: "spring",
              stiffness: 120,
              damping: 14,
            }}
          >
            <motion.span
              className="inline-block"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
            >
              {letter}
            </motion.span>
          </motion.span>
        );
      })}
    </h1>
  );
}

// ─── Typewriter subtitle ──────────────────────────────────────────────────────
function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(timer);
      }
    }, 40);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <p className="text-lg md:text-xl text-[#9494AD] max-w-xl mx-auto leading-relaxed">
      {displayed}
      {!done && <span className="inline-block w-0.5 h-5 bg-[#5B4BDB] ml-1 animate-pulse" />}
    </p>
  );
}

// ─── Model card ───────────────────────────────────────────────────────────────
function ModelCard({ m, i }: { m: RecentModel; i: number }) {
  const ext = m.fileType?.toLowerCase() ?? "glb";

  return (
    <GlowCard glowColor="rgba(91, 75, 219, 0.3)" className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        transition={{ duration: 0.4, delay: i * 0.05 }}
      >
        <Link href={`/gallery/${m.id}`}>
          <div className="group relative rounded-2xl bg-[#141420] border border-[#2A2A3E] overflow-hidden hover:shadow-[0_8px_30px_rgba(91,75,219,0.15)] hover:border-[#5B4BDB]/40 transition duration-300 cursor-pointer shadow-sm flex flex-col h-full">
            <div className="relative aspect-square overflow-hidden bg-[#0A0A0F] border-b border-[#2A2A3E] flex items-center justify-center p-2">
              {m.thumbnailUrl
                ? <img src={m.thumbnailUrl} alt={m.title} className="max-w-full max-h-full object-contain group-hover:scale-105 transition duration-500 rounded" />
                : <div className="w-full h-full flex items-center justify-center bg-[#07060B] rounded">
                    <svg className="w-8 h-8 text-[#2A2A3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
              }
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase backdrop-blur-md bg-[#141420]/90 text-white shadow-[0_4px_10px_rgba(0,0,0,0.5)] border border-[#2A2A3E]/50">{ext.toUpperCase()}</div>
              {m.isPaid
                ? <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/30 shadow-[0_4px_10px_rgba(0,0,0,0.5)] backdrop-blur-md">₹{m.price}</div>
                : <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-bold bg-[#141420]/90 text-[#9494AD] border border-[#2A2A3E]/50 shadow-[0_4px_10px_rgba(0,0,0,0.5)] backdrop-blur-md">Free</div>
              }
            </div>
            <div className="p-4 flex-1 flex flex-col justify-end">
              <p className="text-white text-sm font-bold line-clamp-1">{m.title}</p>
              <p className="text-[#6B6B85] font-medium text-[10px] truncate mt-1">{m.authorName}</p>
            </div>
          </div>
        </Link>
      </motion.div>
    </GlowCard>
  );
}

// ─── Tutor card ───────────────────────────────────────────────────────────────
function TutorCard({ t, i }: { t: TutorProfile; i: number }) {
  const isC = t.certified;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
      <Link href="/connect">
        <div className={`group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden relative hover:-translate-y-0.5 ${
          isC ? "border-[#5B4BDB]/30 bg-[#141420] shadow-[0_4px_20px_rgba(91,75,219,0.15)] hover:border-[#5B4BDB]"
              : "bg-[#141420] border-[#2A2A3E] hover:border-[#5B4BDB]/40 hover:shadow-[0_4px_20px_rgba(91,75,219,0.15)]"
        }`}>
          {isC && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5B4BDB] to-[#A594FF]" />}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold overflow-hidden border ${
            isC ? "bg-[#5B4BDB]/10 text-[#A594FF] border-[#5B4BDB]/20" : "bg-white/5 text-[#9494AD] border-[#2A2A3E]"
          }`}>
            {t.avatar ? <img src={t.avatar} className="w-full h-full object-cover" alt="" /> : t.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold truncate text-white">{t.name}</p>
              {isC && <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-[#5B4BDB]/20 text-[#A594FF] border border-[#5B4BDB]/30">Certified</span>}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-bold text-white">{t.rating || "New"}</span>
              <span className="text-[10px] text-[#6B6B85]">· {t.totalSessions || 0} sessions</span>
            </div>
          </div>
          <span className="text-sm font-extrabold flex-shrink-0 text-[#A594FF]">
            {t.currency || "₹"}{t.hourlyRate || 0}<span className="text-xs font-medium text-[#6B6B85]">/hr</span>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Section Card with 3D flip entrance ───────────────────────────────────────
function SectionCard({ s, i }: { s: typeof PLATFORM_SECTIONS[0]; i: number }) {
  return (
    <GlowCard glowColor={`${s.accent}40`} className="h-full">
      <motion.div
        initial={{ opacity: 0, rotateY: 60 }}
        whileInView={{ opacity: 1, rotateY: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: i * 0.08, ease: [0.0, 0.0, 0.2, 1.0] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <Link href={s.href}>
          <div className="group h-full rounded-2xl p-6 cursor-pointer overflow-hidden relative transition-all duration-300
            bg-[#141420] border border-[#2A2A3E] hover:border-[#5B4BDB]/60 hover:shadow-[0_0_30px_rgba(91,75,219,0.15)] hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#5B4BDB] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-3xl"
              style={{ background: s.accent }} />

            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#1A1A2E] border border-[#2A2A3E] group-hover:border-[#5B4BDB]/40 group-hover:bg-[#5B4BDB]/10 transition-all duration-300">
                <svg className="w-5 h-5 transition-colors duration-300" fill="none" stroke={s.accent} viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${s.tagColor}`}>{s.tag}</span>
            </div>

            <h3 className="text-white font-black text-lg mb-2 tracking-tight group-hover:text-[#7C6EF6] transition-colors">{s.title}</h3>
            <p className="text-[#9494AD] text-sm leading-relaxed mb-5">{s.desc}</p>

            <div className="flex items-center gap-1.5 text-sm font-bold transition-all duration-200 group-hover:translate-x-1 group-hover:gap-2.5" style={{ color: s.accent }}>
              {s.cta}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </Link>
      </motion.div>
    </GlowCard>
  );
}

// ─── Demo Strip ───────────────────────────────────────────────────────────────
function DemoStrip() {
  return (
    <div className="w-full bg-[#07060B] py-14 px-4 border-y border-[#2A2A3E] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />
      <div className="max-w-6xl mx-auto relative">
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6B85] mb-10">
          The 30-second demo
        </motion.p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#2A2A3E] rounded-2xl overflow-hidden border border-[#2A2A3E]">
          {DEMO_STEPS.map((s, i) => (
            <motion.div key={s.step} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              className="bg-[#0A0A0F] px-6 py-7 flex flex-col gap-3 hover:bg-[#141420] transition-colors duration-200">
              <span className="text-[11px] font-black tracking-widest text-[#7C6EF6]">{s.step}</span>
              <p className="text-white text-sm font-bold leading-snug">{s.text}</p>
              <p className="text-[#6B6B85] text-xs leading-relaxed">{s.sub}</p>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
          className="flex justify-center mt-8">
          <MagneticButton href="/verse" variant="primary">
            <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
            Try it live
          </MagneticButton>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [user,          setUser]          = useState<any>(null);
  const [recentModels,  setRecentModels]  = useState<RecentModel[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [tutors,        setTutors]        = useState<TutorProfile[]>([]);
  const [stats,         setStats]         = useState({ models: 0, developers: 0, downloads: 0, certifications: 0 });
  const [statsLoading,  setStatsLoading]  = useState(true);

  // Scroll-driven hero parallax
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const smoothScale = useSpring(heroScale, { stiffness: 150, damping: 25 });
  const smoothOpacity = useSpring(heroOpacity, { stiffness: 150, damping: 25 });

  // Scroll indicator fade
  const scrollIndicatorOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

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
  }, []);

  useEffect(() => {
    getDocs(query(collection(db, "models"), orderBy("uploadedAt", "desc"), limit(8)))
      .then(s => setRecentModels(s.docs.map(d => ({ id: d.id, ...d.data() } as RecentModel))))
      .catch(console.error);
  }, []);

  useEffect(() => {
    getDocs(query(collection(db, "collaborators"), orderBy("createdAt", "desc"), limit(6)))
      .then(s => setCollaborators(s.docs.map(d => ({ id: d.id, ...d.data() } as Collaborator))))
      .catch(console.error);
  }, []);

  useEffect(() => {
    getDocs(query(collection(db, "tutorProfiles"), where("isAvailable", "==", true), limit(4)))
      .then(s => setTutors(s.docs.map(d => ({ id: d.id, ...d.data() } as TutorProfile))))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans">
      <div className="relative z-10 flex-grow">

        {/* ═══ HERO ═══ */}
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <VideoBackground variant="aurora" color="#5B4BDB" intensity={0.85} scrollAccelerate />

          <motion.div
            className="relative z-10 text-center px-4 pt-24"
            style={{ scale: smoothScale, opacity: smoothOpacity }}
          >
            <AnimatedTitle />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <TypewriterText text="The unified platform for AR/VR creators, developers, and learners." />
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
            >
              {user ? (
                <>
                  <MagneticButton href="/verse" variant="primary">Browse 3D Verse</MagneticButton>
                  <MagneticButton href="/dashboard" variant="outline">Dashboard →</MagneticButton>
                </>
              ) : (
                <>
                  <MagneticButton href="/signup" variant="primary">Get Started Free</MagneticButton>
                  <MagneticButton href="/verse" variant="outline">Explore 3D Verse →</MagneticButton>
                </>
              )}
            </motion.div>

            {/* Live Stats Strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.6 }}
              className="flex flex-wrap justify-center items-center gap-4 md:gap-8 mt-12 text-sm md:text-base font-bold bg-[#141420]/60 backdrop-blur-md px-8 py-4 rounded-3xl border border-[#2A2A3E] shadow-[0_4px_30px_rgba(0,0,0,0.5)] mx-auto w-fit"
            >
              <div className="flex items-center gap-2">
                <span className="text-white text-lg md:text-xl font-black">{statsLoading ? "—" : `${stats.models}+`}</span>
                <span className="text-[#6B6B85] uppercase tracking-widest text-[10px]">3D Models</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BDB]/50" />
              <div className="flex items-center gap-2">
                <span className="text-white text-lg md:text-xl font-black">{statsLoading ? "—" : `${stats.developers}+`}</span>
                <span className="text-[#6B6B85] uppercase tracking-widest text-[10px]">Developers</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BDB]/50" />
              <div className="flex items-center gap-2">
                <span className="text-white text-lg md:text-xl font-black">{statsLoading ? "—" : `${stats.downloads}+`}</span>
                <span className="text-[#6B6B85] uppercase tracking-widest text-[10px]">Downloads</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            style={{ opacity: scrollIndicatorOpacity }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B85]">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <svg className="w-5 h-5 text-[#6B6B85]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </motion.div>
        </section>

        {/* ═══ PLATFORM SECTIONS ═══ */}
        <section className="py-20 px-4 bg-[#0A0A0F] relative overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#5B4BDB]/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/8 rounded-full blur-[120px]" style={{ animationDelay: '2s' }} />

          <div className="max-w-7xl mx-auto relative">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#7C6EF6] mb-2">Everything in one place</p>
                <TextReveal as="h2" className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  The AR/VR Ecosystem
                </TextReveal>
              </div>
              <p className="text-[#9494AD] text-sm max-w-xs">One unified platform for creators, developers, engineers and learners.</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {PLATFORM_SECTIONS.map((s, i) => <SectionCard key={s.title} s={s} i={i} />)}
            </div>
          </div>
        </section>

        {/* ═══ DEMO STRIP ═══ */}
        <DemoStrip />

        {/* ═══ SCROLLING GALLERY ═══ */}
        <div className="bg-[#0E0E18] border-b border-[#2A2A3E] py-16">
          <ScrollingGallery />
        </div>

        {/* ═══ GEMINI AI SECTION ═══ */}
        <section className="py-20 px-4 bg-gray-950 relative overflow-hidden">
          <VideoBackground variant="grid" color="#5B4BDB" intensity={0.3} />

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B4BDB]/20 border border-[#5B4BDB]/30 mb-3">
                  <svg className="w-3.5 h-3.5 text-[#5B4BDB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-[#5B4BDB] text-[11px] font-bold uppercase tracking-widest">Powered by Gemini AI</span>
                </div>
                <TextReveal as="h2" className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  AI built into everything
                </TextReveal>
              </div>
              <MagneticButton href="/learn/roadmap" variant="primary">Try AI Roadmap →</MagneticButton>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {GEMINI_FEATURES.map((f, i) => (
                <GlowCard key={f.title} glowColor="rgba(91, 75, 219, 0.3)">
                  <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                    <Link href={f.href}>
                      <div className="group h-full glass-synthe rounded-2xl p-5 hover:bg-white/10 hover:border-[#5B4BDB]/50 transition-all duration-200 cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-[#5B4BDB]/20 flex items-center justify-center mb-4">
                          <svg className="w-5 h-5 text-[#5B4BDB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                          </svg>
                        </div>
                        <h3 className="text-white font-bold text-sm mb-2 group-hover:text-[#5B4BDB] transition-colors">{f.title}</h3>
                        <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
                      </div>
                    </Link>
                  </motion.div>
                </GlowCard>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ LIVE ACTIVITY ═══ */}
        <section className="py-24 px-4 bg-[#0A0A0F] relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0E0E18] via-transparent to-[#0E0E18] pointer-events-none" />
          <div className="max-w-7xl mx-auto relative">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="flex items-center gap-3 mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs font-bold uppercase tracking-widest">Live Activity</span>
              </div>
              <div className="h-px flex-1 bg-[#2A2A3E]" />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent uploads */}
              <div className="lg:col-span-2 bg-[#141420] rounded-3xl p-8 border border-[#2A2A3E] shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white text-lg font-bold">Recent Uploads</h3>
                  <Link href="/verse"><span className="text-[#7C6EF6] text-sm font-bold hover:text-[#A594FF] transition">View 3D Verse →</span></Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentModels.slice(0, 6).length > 0
                    ? recentModels.slice(0, 6).map((m, i) => {
                        const ext = m.fileType?.toLowerCase() ?? "glb";
                        return (
                          <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                            <Link href={`/gallery/${m.id}`}>
                              <div className="group flex items-center gap-4 p-3 rounded-2xl border border-[#2A2A3E] hover:border-[#5B4BDB]/40 bg-white/5 hover:bg-white/8 transition duration-200 cursor-pointer">
                                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-[#2A2A3E] bg-[#1A1A2E]">
                                  {m.thumbnailUrl
                                    ? <img src={m.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-105 transition" alt="" />
                                    : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#6B6B85] bg-[#1A1A2E]">{ext.toUpperCase()}</div>
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-bold truncate group-hover:text-[#7C6EF6] transition">{m.title}</p>
                                  <p className="text-[#6B6B85] text-xs mt-0.5 truncate">{m.authorName}</p>
                                </div>
                                <div className="flex-shrink-0">
                                  {m.isPaid
                                    ? <span className="bg-green-500/15 text-green-400 px-2 py-1 rounded-lg text-xs font-bold border border-green-500/20">₹{m.price}</span>
                                    : <span className="bg-white/10 text-[#9494AD] px-2 py-1 rounded-lg text-xs font-bold border border-white/10">Free</span>
                                  }
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                        );
                      })
                    : Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl bg-[#1A1A2E] animate-pulse" />
                      ))
                  }
                </div>
              </div>

              {/* Mentors */}
              <div className="bg-[#141420] rounded-3xl p-8 border border-[#2A2A3E] shadow-lg flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white text-lg font-bold">Available Mentors</h3>
                  <Link href="/hire"><span className="text-[#7C6EF6] text-sm font-bold hover:text-[#A594FF] transition">View all →</span></Link>
                </div>
                <div className="space-y-3 flex-grow">
                  {tutors.length > 0
                    ? tutors.map((t, i) => <TutorCard key={t.id} t={t} i={i} />)
                    : Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-16 rounded-xl bg-[#1A1A2E] animate-pulse" />
                      ))
                  }
                </div>
                <div className="mt-6 border-t border-[#2A2A3E] pt-6">
                  <Link href="/connect">
                    <div className="w-full py-3 rounded-xl border-2 border-dashed border-[#2A2A3E] hover:border-[#5B4BDB]/50 hover:bg-[#5B4BDB]/5 transition duration-200 cursor-pointer text-center text-[#6B6B85] hover:text-[#7C6EF6] font-bold text-sm">
                      + Become a Collaborator
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FEATURED MODELS ═══ */}
        {recentModels.length > 0 && (
          <section className="py-24 px-4 bg-[#0E0E18] border-y border-[#2A2A3E]">
            <div className="max-w-7xl mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="flex items-center justify-between mb-10 pb-4 border-b border-[#2A2A3E]">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">Featured Models</h2>
                <MagneticButton href="/verse" variant="secondary">Browse 3D Verse →</MagneticButton>
              </motion.div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {recentModels.map((m, i) => <ModelCard key={m.id} m={m} i={i} />)}
              </div>
            </div>
          </section>
        )}

        {/* ═══ STATS ═══ */}
        <section className="w-full py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#4c3ec7] via-[#5B4BDB] to-[#7C6EF6]" />
          <VideoBackground variant="mesh" color="#ffffff" intensity={0.2} className="opacity-30" />
          <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 md:gap-y-0">
              {[
                { label: "3D Models Uploaded",  val: stats.models,         suffix: "+" },
                { label: "Verified Developers", val: stats.developers,     suffix: "+" },
                { label: "Model Downloads",     val: stats.downloads,      suffix: "+" },
                { label: "Certifications",      val: stats.certifications, suffix: "" },
              ].map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`flex flex-col items-center text-center px-4 ${i > 0 ? "md:border-l border-white/20" : ""}`}>
                  <div className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight drop-shadow-lg">
                    {statsLoading ? "—" : <CountUp target={s.val} suffix={s.suffix} showRing ringColor="rgba(255,255,255,0.5)" />}
                  </div>
                  <div className="text-white/70 text-sm md:text-base font-medium">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ COLLABORATORS ═══ */}
        {collaborators.length > 0 && (
          <section className="py-24 px-4 bg-[#0A0A0F] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#5B4BDB]/8 rounded-full blur-[100px]" />
            <div className="max-w-7xl mx-auto relative">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="text-center mb-12">
                <p className="text-[#7C6EF6] text-xs font-bold uppercase tracking-widest mb-2">Academic Partners</p>
                <TextReveal as="h2" className="text-3xl md:text-4xl font-black tracking-tight text-white">
                  Our Collaborators
                </TextReveal>
              </motion.div>
              <div className="flex flex-wrap justify-center gap-6">
                {collaborators.map((c, i) => (
                  <GlowCard key={c.id} glowColor="rgba(91, 75, 219, 0.3)">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}>
                      <Link href="/collaborators">
                        <div className="w-40 p-6 rounded-2xl bg-[#141420] border border-[#2A2A3E] hover:border-[#5B4BDB]/40 hover:shadow-[0_0_25px_rgba(91,75,219,0.1)] transition duration-300 cursor-pointer text-center group">
                          <div className="w-16 h-16 rounded-full overflow-hidden border border-[#2A2A3E] bg-[#1A1A2E] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 group-hover:border-[#5B4BDB]/40 transition text-xl font-bold text-[#6B6B85]">
                            {c.avatar
                              ? <img src={c.avatar} className="w-full h-full object-cover" alt="" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              : c.name?.[0]
                            }
                          </div>
                          <p className="text-white text-sm font-bold truncate">{c.name}</p>
                          <p className="text-[#6B6B85] text-xs truncate mt-1">{c.role}</p>
                        </div>
                      </Link>
                    </motion.div>
                  </GlowCard>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ CTA ═══ */}
        <section className="py-24 px-4 bg-[#0E0E18] border-t border-[#2A2A3E] relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[500px] h-[500px] bg-[#5B4BDB]/10 rounded-full blur-[150px]" />
          </div>
          <div className="max-w-4xl mx-auto text-center relative">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-xs font-bold uppercase tracking-widest text-[#7C6EF6] mb-4">Ready to start?</p>
              <motion.h2
                className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6"
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                whileInView={{ clipPath: "inset(0 0% 0 0)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              >
                Build the future <span className="bg-gradient-to-r from-[#5B4BDB] via-[#7C6EF6] to-[#A594FF] bg-clip-text text-transparent">of XR.</span>
              </motion.h2>
              <p className="text-[#9494AD] text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                Join the network. Upload your 3D models, attend live workshops, and collaborate with XR developers on SYNTHÉ.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {user ? (
                  <>
                    <MagneticButton href="/verse/upload" variant="primary">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload a Model
                    </MagneticButton>
                    <MagneticButton href="/dashboard" variant="secondary">Go to Dashboard →</MagneticButton>
                  </>
                ) : (
                  <>
                    <MagneticButton href="/signup" variant="primary">Get Started Free</MagneticButton>
                    <MagneticButton href="/verse" variant="secondary">Explore 3D Verse →</MagneticButton>
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