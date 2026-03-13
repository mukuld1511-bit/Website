"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />

      <div className="relative pt-28 pb-24 px-4 overflow-x-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
          style={{ background:"radial-gradient(ellipse,rgba(124,58,237,0.12) 0%,transparent 70%)", filter:"blur(80px)" }} />

        <div className="relative z-10 max-w-4xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
            className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-violet-300/90 text-sm font-semibold uppercase tracking-widest">Join Synthé</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none mb-5">
              Who Are{" "}
              <span style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                You?
              </span>
            </h1>
            <p className="text-white/40 text-lg max-w-md mx-auto leading-relaxed">
              Choose your path. Each has its own features, dashboard, and opportunities.
            </p>
          </motion.div>

          {/* Two cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">

            {/* User / Client */}
            <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.5, delay:0.1 }}>
              <Link href="/signup?role=user">
                <div className="group relative h-full rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl overflow-hidden hover:border-cyan-500/25 transition duration-300 cursor-pointer p-8 flex flex-col min-h-[420px]">
                  <div className="absolute top-0 left-0 right-0 h-[1px]"
                    style={{ background:"linear-gradient(90deg,transparent,rgba(34,211,238,0.5),transparent)" }} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"
                    style={{ background:"radial-gradient(ellipse at top,rgba(34,211,238,0.06),transparent 65%)" }} />

                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-5 text-cyan-400/60">Path 01</p>

                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition duration-300 group-hover:scale-110"
                    style={{ background:"rgba(34,211,238,0.12)", border:"1px solid rgba(34,211,238,0.25)" }}>
                    <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>

                  <h3 className="text-white font-black text-2xl tracking-tight mb-3">I'm a Client</h3>
                  <p className="text-white/40 text-sm leading-relaxed flex-grow mb-6">
                    Browse and download 3D models, AR/VR builds. Hire developers, post projects, and bring your ideas to life.
                  </p>

                  <div className="space-y-2.5 mb-7">
                    {[
                      "Browse & download 3D/AR/VR content",
                      "Hire developers directly",
                      "Access AutoCAD files and designs",
                    ].map((f,i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background:"rgba(34,211,238,0.12)", border:"1px solid rgba(34,211,238,0.25)" }}>
                          <svg className="w-2.5 h-2.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-white/45 text-xs">{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-sm font-black text-cyan-400 group-hover:gap-3 transition-all duration-200">
                      Join as Client
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-white/20 font-semibold">Free forever</span>
                  </div>

                  <div className="mt-5 h-[1px] w-0 group-hover:w-full transition-all duration-500 rounded-full"
                    style={{ background:"linear-gradient(90deg,rgba(34,211,238,0.6),transparent)" }} />
                </div>
              </Link>
            </motion.div>

            {/* Developer */}
            <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.5, delay:0.2 }}>
              <Link href="/join/developer">
                <div className="group relative h-full rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl overflow-hidden hover:border-violet-500/25 transition duration-300 cursor-pointer p-8 flex flex-col min-h-[420px]">
                  <div className="absolute top-0 left-0 right-0 h-[1px]"
                    style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.5),transparent)" }} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"
                    style={{ background:"radial-gradient(ellipse at top,rgba(167,139,250,0.06),transparent 65%)" }} />

                  {/* Recommended badge */}
                  <div className="absolute top-4 right-4 px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10">
                    <span className="text-amber-300 text-[9px] font-black uppercase tracking-wider">✦ Earn Revenue</span>
                  </div>

                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-5 text-violet-400/60">Path 02</p>

                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition duration-300 group-hover:scale-110"
                    style={{ background:"rgba(167,139,250,0.12)", border:"1px solid rgba(167,139,250,0.25)" }}>
                    <svg className="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>

                  <h3 className="text-white font-black text-2xl tracking-tight mb-3">I'm a Developer</h3>
                  <p className="text-white/40 text-sm leading-relaxed flex-grow mb-6">
                    Upload your 3D models, AR/VR builds and AutoCAD files. Get hired, earn revenue, and build your reputation on Synthé.
                  </p>

                  <div className="space-y-2.5 mb-7">
                    {[
                      "Upload & sell 3D models and AR/VR builds",
                      "Receive direct project requests from clients",
                      "Get certified — earn more & rank higher",
                    ].map((f,i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background:"rgba(167,139,250,0.12)", border:"1px solid rgba(167,139,250,0.25)" }}>
                          <svg className="w-2.5 h-2.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-white/45 text-xs">{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-sm font-black text-violet-400 group-hover:gap-3 transition-all duration-200">
                      Apply as Developer
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-white/20 font-semibold">Reviewed in 48h</span>
                  </div>

                  <div className="mt-5 h-[1px] w-0 group-hover:w-full transition-all duration-500 rounded-full"
                    style={{ background:"linear-gradient(90deg,rgba(167,139,250,0.6),transparent)" }} />
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Already have account */}
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
            className="text-center text-white/20 text-sm">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-violet-400/70 hover:text-violet-300 transition duration-200 font-bold cursor-pointer">
                Sign in →
              </span>
            </Link>
          </motion.p>

        </div>
      </div>
      <Footer />
    </div>
  );
}