"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────
interface HeroProps {
  user: any;
  stats: { models:number; developers:number; downloads:number; certifications:number };
  statsLoading: boolean;
}

// ─── Typewriter hook ────────────────────────────────────────────────────────
const WORDS = ["3D Models","AR Worlds","VR Realms","CAD Files","Shader Art","3D Artists"];

function useTypewriter() {
  const [wordIdx,   setWordIdx]   = useState(0);
  const [charIdx,   setCharIdx]   = useState(0);
  const [deleting,  setDeleting]  = useState(false);
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    const word = WORDS[wordIdx];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting) {
      setDisplayed(word.slice(0, charIdx));
      if (charIdx < word.length) {
        t = setTimeout(() => setCharIdx(c => c + 1), 72);
      } else {
        t = setTimeout(() => setDeleting(true), 1800);
      }
    } else {
      setDisplayed(word.slice(0, charIdx));
      if (charIdx > 0) {
        t = setTimeout(() => setCharIdx(c => c - 1), 36);
      } else {
        setDeleting(false);
        setWordIdx(i => (i + 1) % WORDS.length);
        t = setTimeout(() => setCharIdx(1), 200);
      }
    }
    return () => clearTimeout(t);
  }, [charIdx, deleting, wordIdx]);

  return displayed;
}

// ─── Floating badge ─────────────────────────────────────────────────────────
function FloatBadge({ label, icon, color, x, y, delay, rotate = 0 }: {
  label:string; icon:string; color:string;
  x:string; y:string; delay:number; rotate?:number;
}) {
  return (
    <motion.div
      className="absolute hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-2xl border backdrop-blur-xl select-none pointer-events-none z-10"
      style={{ left:x, top:y, background:`${color}12`, borderColor:`${color}30`, willChange:"transform" }}
      initial={{ opacity:0, scale:0.6, rotate:rotate - 15 }}
      animate={{ opacity:1, scale:1, rotate, y:[0,-10,0] }}
      transition={{
        opacity:{ duration:0.6, delay },
        scale:  { duration:0.6, delay },
        rotate: { duration:0.6, delay },
        y:{ duration:3.6 + delay * 0.4, repeat:Infinity, ease:"easeInOut", delay:delay + 0.8 },
      }}>
      <span className="text-base leading-none">{icon}</span>
      <span className="text-xs font-black" style={{ color }}>{label}</span>
    </motion.div>
  );
}

// ─── (OrbitalRing and BeamScan removed per handoff v8 requirements) ──────────

// ─── Stat pill ───────────────────────────────────────────────────────────────
function StatPill({ val, label, color, loading, delay }:{
  val:number; label:string; color:string; loading:boolean; delay:number;
}) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (loading || val === 0) return;
    let cur = 0;
    const step = Math.max(1, Math.ceil(val / 40));
    const t = setInterval(() => {
      cur = Math.min(cur + step, val);
      setCount(cur);
      if (cur >= val) clearInterval(t);
    }, 28);
    return () => clearInterval(t);
  }, [val, loading]);

  return (
    <motion.div
      initial={{ opacity:0, y:14, scale:0.9 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ duration:0.5, delay }}
      className="flex flex-col items-center gap-1 px-5 py-3.5 rounded-2xl border border-white/6 bg-white/[0.03] backdrop-blur-sm min-w-[80px]">
      {loading
        ? <div className="h-7 w-14 rounded-lg bg-white/[0.06] animate-pulse" />
        : <span className="text-2xl sm:text-3xl font-black leading-none"
            style={{ backgroundImage:`linear-gradient(135deg,${color},white)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
            {val > 0 ? `${count}+` : "—"}
          </span>
      }
      <span className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HeroComponent({ user, stats, statsLoading }: HeroProps) {
  const typed     = useTypewriter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Perspective grid
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width  = c.offsetWidth;
    c.height = c.offsetHeight;
    const { width:w, height:h } = c;
    const STEP = 55;
    ctx.clearRect(0, 0, w, h);
    for (let x = 0; x <= w; x += STEP) {
      const dist = Math.abs(x - w / 2) / (w / 2);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h);
      ctx.strokeStyle = `rgba(124,58,237,${0.07 - dist * 0.05})`; ctx.lineWidth = 0.5; ctx.stroke();
    }
    for (let y = 0; y <= h; y += STEP) {
      const dist = Math.abs(y - h / 2) / (h / 2);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y);
      ctx.strokeStyle = `rgba(8,145,178,${0.055 - dist * 0.03})`; ctx.lineWidth = 0.5; ctx.stroke();
    }
  }, []);

  const BADGES = [
    { label:"GLB / GLTF",   icon:"📦", color:"#a78bfa", x:"4%",  y:"22%", delay:0.7,  rotate:-4 },
    { label:"AR Ready",     icon:"📱", color:"#34d399", x:"3%",  y:"54%", delay:0.9,  rotate: 3 },
    { label:"AutoCAD DWG",  icon:"📐", color:"#fbbf24", x:"4%",  y:"76%", delay:1.1,  rotate:-3 },
    { label:"VR Ready",     icon:"🥽", color:"#22d3ee", x:"77%", y:"22%", delay:0.8,  rotate: 5 },
    { label:"Certified ✓",  icon:"🏅", color:"#818cf8", x:"79%", y:"52%", delay:1.0,  rotate:-5 },
    { label:"Live 3D View", icon:"🔭", color:"#fb7185", x:"77%", y:"75%", delay:1.2,  rotate: 4 },
  ];

  const CHIPS = [
    { label:"3D Gallery",    color:"#a78bfa", href:"/gallery"         },
    { label:"AR / VR",       color:"#34d399", href:"/gallery?mode=ar" },
    { label:"AutoCAD Hub",   color:"#fbbf24", href:"/autocad"         },
    { label:"Freelance",     color:"#fb7185", href:"/freelance"       },
    { label:"Certification", color:"#818cf8", href:"/certification"   },
    { label:"PIET Collab",   color:"#22d3ee", href:"/collaborators"   },
    { label:"Requests",      color:"#38bdf8", href:"/requests"        },
  ];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-28 pb-20 text-center overflow-hidden">

      {/* Grid canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-90" />



      {/* Floating badges */}
      {BADGES.map(b => <FloatBadge key={b.label} {...b} />)}

      {/* Central nebula glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[320px] pointer-events-none"
        style={{ background:"radial-gradient(ellipse,rgba(124,58,237,0.2) 0%,transparent 70%)", filter:"blur(50px)" }} />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center max-w-6xl mx-auto w-full">

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-violet-500/25 bg-violet-500/8 backdrop-blur-sm mb-8">
          <motion.span animate={{ scale:[1,1.4,1] }} transition={{ duration:2, repeat:Infinity }}
            className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
          <span className="text-violet-300/90 text-sm font-bold uppercase tracking-[0.2em]">SYNTHÉ</span>
          <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-black border border-violet-500/25">BETA</span>
        </motion.div>

        {/* Static headline */}
        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.1 }}>
          <h1 className="text-[clamp(3rem,9vw,7.5rem)] font-black tracking-tighter text-white leading-[0.88]">
            The Future of
          </h1>
        </motion.div>

        {/* Typewriter headline */}
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.4, delay:0.5 }}
          className="min-h-[1.05em] flex items-center justify-center mb-6">
          <h1 className="text-[clamp(3rem,9vw,7.5rem)] font-black tracking-tighter leading-[0.88]"
            style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#22d3ee,#fbbf24)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
            {typed}
            <motion.span
              animate={{ opacity:[1,0,1] }} transition={{ duration:0.75, repeat:Infinity }}
              style={{ WebkitTextFillColor:"#a78bfa", color:"#a78bfa" }}>|</motion.span>
          </h1>
        </motion.div>

        {/* Sub */}
        <motion.p
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, delay:0.25 }}
          className="text-white/45 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Upload, discover, buy and sell AR/VR/3D models and AutoCAD files on SYNTHÉ.
          Connect with certified developers and collaborate with academic partners.
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, delay:0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">

          <Link href={user ? "/upload" : "/join"}>
            <motion.div
              whileHover={{ scale:1.04, boxShadow:"0 0 50px rgba(124,58,237,0.5)" }}
              whileTap={{ scale:0.97 }}
              style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
              className="flex items-center gap-2.5 px-9 py-4 rounded-2xl font-black text-white text-base cursor-pointer relative overflow-hidden">
              <motion.div animate={{ x:["-200%","200%"] }}
                transition={{ duration:2.5, repeat:Infinity, repeatDelay:5, ease:"linear" }}
                style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
              <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={user
                    ? "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    : "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  } />
              </svg>
              <span className="relative z-10">{user ? "Upload a Model" : "Join as Creator"}</span>
            </motion.div>
          </Link>

          <Link href="/gallery">
            <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }} style={{ willChange:"transform" }}
              className="flex items-center gap-2.5 px-9 py-4 rounded-2xl font-black text-white/70 text-base border border-white/12 hover:border-white/25 hover:text-white/90 transition duration-200 cursor-pointer backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Explore Gallery
            </motion.div>
          </Link>

          <Link href="/connect">
            <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }} style={{ willChange:"transform" }}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-emerald-300/70 text-sm border border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 hover:text-emerald-300 transition duration-200 cursor-pointer">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              Connect &amp; Learn
            </motion.div>
          </Link>
        </motion.div>

        {/* Live stats */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, delay:0.45 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <StatPill val={stats.models}        label="Models"     color="#a78bfa" loading={statsLoading} delay={0.55} />
          <StatPill val={stats.developers}    label="Developers" color="#22d3ee" loading={statsLoading} delay={0.65} />
          <StatPill val={stats.downloads}     label="Downloads"  color="#34d399" loading={statsLoading} delay={0.75} />
          <StatPill val={stats.certifications}label="Certified"  color="#fbbf24" loading={statsLoading} delay={0.85} />
          <motion.div
            initial={{ opacity:0, y:14, scale:0.9 }} animate={{ opacity:1, y:0, scale:1 }}
            transition={{ duration:0.5, delay:0.95 }}
            className="flex flex-col items-center gap-1 px-5 py-3.5 rounded-2xl border border-white/6 bg-white/[0.03] backdrop-blur-sm min-w-[80px]">
            <span className="text-2xl sm:text-3xl font-black leading-none"
              style={{ backgroundImage:"linear-gradient(135deg,#fbbf24,white)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              Free
            </span>
            <span className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em]">To Start</span>
          </motion.div>
        </motion.div>

        {/* Platform chips */}
        <motion.div
          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.6 }}
          className="flex flex-wrap items-center justify-center gap-2">
          {CHIPS.map((chip, i) => (
            <motion.div key={chip.label}
              initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
              transition={{ delay:0.65 + i * 0.05 }}
              whileHover={{ scale:1.1, y:-2 }}
              style={{ willChange:"transform" }}>
              <Link href={chip.href}>
                <div className="px-3.5 py-1.5 rounded-full text-[11px] font-black border cursor-pointer opacity-70 hover:opacity-100 transition-opacity duration-200"
                  style={{ background:`${chip.color}10`, borderColor:`${chip.color}28`, color:chip.color }}>
                  {chip.label}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:1, delay:1.3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer group"
        onClick={() => document.getElementById("features")?.scrollIntoView({ behavior:"smooth" })}>
        <motion.div animate={{ y:[0,8,0] }} transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }}
          style={{ willChange:"transform" }} className="flex flex-col items-center gap-1.5">
          <div className="w-6 h-9 rounded-full border border-white/15 flex items-start justify-center pt-1.5 group-hover:border-violet-500/40 transition duration-300">
            <motion.div animate={{ y:[0,10,0], opacity:[1,0,1] }} transition={{ duration:2, repeat:Infinity }}
              style={{ willChange:"transform" }} className="w-1 h-2 rounded-full bg-white/30" />
          </div>
          <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.25em] group-hover:text-white/40 transition duration-300">Scroll</p>
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
        style={{ background:"linear-gradient(to bottom,transparent,#050008)" }} />
    </section>
  );
}