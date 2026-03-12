"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const OPTIONS = [
  {
    n: "01",
    href: "/requests/post",
    title: "Post Public Request",
    desc: "Post your project publicly and let talented developers apply. Compare proposals and choose the best fit for your vision.",
    action: "Post a Request →",
    color: "#22d3ee",
    icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
    perks: ["Widest developer reach", "Compare multiple proposals", "Set your own budget"],
  },
  {
    n: "02",
    href: "/connect",
    title: "Find & Direct Hire",
    desc: "Browse certified Synthé developers directly. Review their portfolio, skills and ratings then send a direct enquiry or book a session.",
    action: "Browse Developers →",
    color: "#a78bfa",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    perks: ["Vetted certified devs", "Direct communication", "Book 1-on-1 sessions"],
  },
  {
    n: "03",
    href: "/freelance",
    title: "Freelance Market",
    desc: "Post a milestone-based project on the freelance marketplace. Receive structured bids with timelines and pay via escrow.",
    action: "Post a Project →",
    color: "#34d399",
    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    perks: ["Milestone payments", "Escrow protection", "Structured proposals"],
  },
];

export default function RequestsPage() {
  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />
      <div className="relative pt-28 pb-24 px-4 overflow-x-hidden">
        {/* Ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
          style={{ background:"radial-gradient(ellipse,#22d3ee10 0%,transparent 70%)", filter:"blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{ backgroundImage:"linear-gradient(rgba(34,211,238,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,0.6) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />

        <div className="relative z-10 max-w-5xl mx-auto">

          {/* Badge + Hero */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-300/90 text-sm font-semibold uppercase tracking-widest">Commission Your Vision</span>
          </motion.div>

          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }} className="mb-14">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none mb-4">
              Get Your Own{" "}
              <span style={{ backgroundImage:"linear-gradient(90deg,#22d3ee,#a78bfa,#fbbf24)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                Project
              </span>
            </h1>
            <p className="text-white/40 text-lg max-w-xl leading-relaxed">
              Choose how you want to bring your immersive 3D, AR or VR project to life.
            </p>
          </motion.div>

          {/* Option cards */}
          <div className="grid sm:grid-cols-3 gap-5 mb-12">
            {OPTIONS.map((o,i) => (
              <motion.div key={o.n} initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.15+i*0.1 }}>
                <Link href={o.href}>
                  <motion.div whileHover={{ y:-4, scale:1.01 }} whileTap={{ scale:0.98 }}
                    style={{ willChange:"transform" }}
                    className="group relative h-full p-7 rounded-3xl border border-white/6 bg-white/[0.025] hover:border-white/14 transition duration-300 cursor-pointer overflow-hidden flex flex-col">

                    {/* Spectrum top accent */}
                    <div className="absolute top-0 left-0 right-0 h-[1.5px]"
                      style={{ background:`linear-gradient(90deg,transparent,${o.color}50,transparent)` }} />

                    {/* Hover glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-400 pointer-events-none"
                      style={{ background:`radial-gradient(ellipse at top,${o.color}08,transparent 65%)` }} />

                    {/* Number */}
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20">Option {o.n}</span>
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{ background:`${o.color}18`, border:`1px solid ${o.color}30` }}>
                        <svg className="w-5 h-5" style={{ color:o.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={o.icon} />
                        </svg>
                      </div>
                    </div>

                    <h3 className="text-white font-black text-lg mb-2">{o.title}</h3>
                    <p className="text-white/35 text-sm leading-relaxed mb-5 flex-1">{o.desc}</p>

                    {/* Perks */}
                    <div className="space-y-1.5 mb-5">
                      {o.perks.map(p => (
                        <div key={p} className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background:`${o.color}20`, border:`1px solid ${o.color}35` }}>
                            <svg className="w-2 h-2" style={{ color:o.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-white/35 text-xs">{p}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 text-sm font-black group-hover:gap-3 transition-all duration-200"
                      style={{ color:o.color }}>
                      {o.action}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.5, delay:0.55 }}
            className="text-center text-white/20 text-xs">
            Not sure which to choose? Post a public request for the widest developer reach.
          </motion.p>
        </div>
      </div>
      <Footer />
    </div>
  );
}