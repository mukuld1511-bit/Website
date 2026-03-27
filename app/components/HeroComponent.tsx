"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface HeroProps {
  user: any;
  stats: { models: number; developers: number; downloads: number; certifications: number };
  statsLoading: boolean;
}

export default function HeroComponent({ user, stats, statsLoading }: HeroProps) {
  const mCount = statsLoading ? "—" : `${stats.models}+`;
  const dCount = statsLoading ? "—" : `${stats.developers}+`;
  const dlCount = statsLoading ? "—" : `${stats.downloads}+`;

  return (
    <section className="relative w-full overflow-hidden min-h-[92vh] flex items-center pt-24 pb-16">

      {/* ── Aurora Background ── */}
      <div className="aurora-bg" />

      {/* ── Animated gradient mesh ── */}
      <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70">
        <motion.div
          animate={{ y: [0, -40, 0], x: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#5B4BDB]/20 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{ y: [0, 50, 0], x: [0, -30, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[30%] left-[-5%] w-[400px] h-[400px] bg-[#7C6EF6]/15 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute bottom-[10%] right-[20%] w-[300px] h-[300px] bg-rose-500/10 rounded-full blur-[100px]"
        />
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#07060B_90%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-10">

          <div className="w-full lg:w-[55%] flex flex-col items-center lg:items-start text-center lg:text-left">

            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.15em] uppercase bg-[#5B4BDB]/15 text-[#A594FF] border border-[#5B4BDB]/25 mb-6 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-[#7C6EF6] animate-pulse" />
                SYNTHÉ INTERACTIVE
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-[-0.03em] text-white leading-[1.05] mb-6"
            >
              Learn &amp; Build
              <br />
              with{" "}
              <span className="bg-gradient-to-r from-[#5B4BDB] via-[#7C6EF6] to-[#A594FF] bg-clip-text text-transparent">
                AR &amp; VR
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
              className="text-[#9494AD] text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-medium"
            >
              Your interactive hub for 3D models, spatial computing, and connecting with XR developers. Build the future.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="flex flex-col sm:flex-row items-center gap-4 mb-12 w-full sm:w-auto"
            >
              <Link href="/gallery" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-white bg-[#5B4BDB] hover:bg-[#4c3ec7] border-b-[3px] border-[#4438b8] shadow-[0_0_30px_rgba(91,75,219,0.25)] hover:shadow-[0_0_50px_rgba(91,75,219,0.35)] transition-all active:translate-y-[1px] text-lg flex items-center justify-center gap-2">
                  Explore Gallery
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </Link>
              <Link href="/requests/open" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-[#9494AD] bg-[#141420] border border-[#2A2A3E] hover:bg-[#1A1A2E] hover:text-white hover:border-[#5B4BDB]/40 transition-all text-lg">
                  Post a Project
                </button>
              </Link>
            </motion.div>

            {/* Live stats strip */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
              className="flex items-center gap-4 text-sm font-bold bg-[#141420]/60 backdrop-blur-md p-4 rounded-2xl border border-[#2A2A3E]"
            >
              <span className="text-[#7C6EF6]">{mCount} <span className="text-[#6B6B85]">Models</span></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#2A2A3E]" />
              <span className="text-[#A594FF]">{dCount} <span className="text-[#6B6B85]">Developers</span></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#2A2A3E]" />
              <span className="text-[#7C6EF6]">{dlCount} <span className="text-[#6B6B85]">Downloads</span></span>
            </motion.div>
          </div>

          {/* Right — Visual card */}
          <div className="w-full lg:w-[45%]">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, rotate: 3 }}
              animate={{ opacity: 1, scale: 1, rotate: -1 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
              className="relative w-full aspect-square rounded-3xl bg-[#141420] border border-[#2A2A3E] shadow-[0_20px_60px_-15px_rgba(91,75,219,0.2)] p-2 overflow-hidden group hover:rotate-0 transition-transform duration-500"
            >
              {/* Animated border glow */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ boxShadow: "inset 0 0 0 1px rgba(91,75,219,0.4), 0 0 30px rgba(91,75,219,0.1)" }}
              />

              <div className="flex-1 relative rounded-[1.25rem] overflow-hidden bg-gradient-to-br from-[#1A1A2E] to-[#0E0E18] flex items-center justify-center p-8 h-full">
                <motion.img
                  animate={{ y: [0, -15, 0], rotate: [0, 2, -1, 0] }}
                  transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
                  src="/vr-headset.png"
                  alt="VR Headset Prototype"
                  className="w-full h-full object-contain filter drop-shadow-[0_20px_40px_rgba(91,75,219,0.3)]"
                />
              </div>

              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between bg-[#141420]/90 backdrop-blur-xl px-6 py-4 rounded-2xl border border-[#2A2A3E]">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7C6EF6] opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#5B4BDB]" />
                  </span>
                  <span className="text-white text-sm font-bold tracking-wide">Interactive VR Prototype</span>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}