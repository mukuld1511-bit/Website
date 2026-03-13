"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const OPTIONS = [
  {
    num:   "01",
    title: "Hire a Developer",
    desc:  "Browse verified Synthé developers. Review their AR/VR/3D portfolio and send a direct project request. One-on-one collaboration from idea to delivery.",
    href:  "/connect",
    color: "#a78bfa",
    tags:  ["Direct Hire","Portfolio Review","1-on-1 Project"],
    icon:  "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    cta:   "Browse Developers →",
  },
  {
    num:   "02",
    title: "Freelance Market",
    desc:  "Post your project publicly. Verified developers submit competitive bids with proposals and timelines. Compare, choose, and build.",
    href:  "/freelance",
    color: "#34d399",
    tags:  ["Open Bidding","Compare Proposals","Escrow Payments"],
    icon:  "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    cta:   "View Projects →",
  },
];

export default function RequestsPage() {
  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background:"radial-gradient(circle,#a78bfa,transparent 70%)", filter:"blur(80px)" }} />
        <div className="absolute bottom-[20%] right-[5%] w-[400px] h-[400px] rounded-full opacity-[0.06]"
          style={{ background:"radial-gradient(circle,#34d399,transparent 70%)", filter:"blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage:"linear-gradient(rgba(167,139,250,1) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,1) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />
      </div>

      <div className="relative z-10 pt-28 pb-24 px-4">
        <div className="max-w-4xl mx-auto">

          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
            className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-violet-300/90 text-sm font-semibold uppercase tracking-widest">Get Your Own Project</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none mb-4">
              Build Your{" "}
              <span style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                Vision
              </span>
            </h1>
            <p className="text-white/40 text-lg max-w-lg mx-auto leading-relaxed">
              Two ways to bring your AR/VR/3D idea to life. Pick what works best for you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {OPTIONS.map((opt, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.5, delay:0.1 + i*0.1 }}>
                <Link href={opt.href}>
                  <div className="group relative h-full rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl overflow-hidden hover:border-white/14 transition duration-300 cursor-pointer p-8 flex flex-col">
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{ background:`linear-gradient(90deg,transparent,${opt.color}50,transparent)` }} />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"
                      style={{ background:`radial-gradient(ellipse at top,${opt.color}08,transparent 65%)` }} />

                    <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-5" style={{ color:`${opt.color}60` }}>
                      Option {opt.num}
                    </p>

                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 flex-shrink-0 transition duration-300 group-hover:scale-110"
                      style={{ background:`${opt.color}18`, border:`1px solid ${opt.color}30` }}>
                      <svg className="w-6 h-6" style={{ color:opt.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={opt.icon} />
                      </svg>
                    </div>

                    <h3 className="text-white font-black text-2xl tracking-tight mb-3">{opt.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed flex-grow mb-6">{opt.desc}</p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {opt.tags.map((tag, j) => (
                        <span key={j} className="px-3 py-1.5 rounded-xl text-[10px] font-black border"
                          style={{ color:opt.color, background:`${opt.color}10`, borderColor:`${opt.color}25` }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-sm font-black group-hover:gap-3 transition-all duration-200"
                      style={{ color:opt.color }}>
                      {opt.cta}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>

                    <div className="mt-5 h-[1px] w-0 group-hover:w-full transition-all duration-500 rounded-full"
                      style={{ background:`linear-gradient(90deg,${opt.color},transparent)` }} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.4 }}
            className="relative rounded-3xl border border-white/6 bg-white/[0.02] backdrop-blur-xl overflow-hidden p-8">
            <div className="absolute top-0 left-0 right-0 h-[1px]"
              style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.3),rgba(52,211,153,0.3),transparent)" }} />
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              {[
                { icon:"🔒", label:"Secure Payments",     desc:"All transactions via Razorpay escrow" },
                { icon:"✦",  label:"Verified Developers", desc:"Every developer is reviewed & certified" },
                { icon:"⚡", label:"Fast Delivery",        desc:"Most projects completed within 7 days" },
              ].map((item,i) => (
                <motion.div key={i} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5+i*0.08 }}>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-white/80 font-black text-sm mb-1">{item.label}</p>
                  <p className="text-white/30 text-xs">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
      <Footer />
    </div>
  );
}