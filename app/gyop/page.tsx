"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const OPTIONS = [
  {
    num:   "01",
    title: "Post Public Request",
    desc:  "Post your project openly and let talented developers apply. Compare proposals, review portfolios and choose the best fit for your vision.",
    href:  "/requests/post",
    color: "#22d3ee",
    gradient: "linear-gradient(135deg,#0891b2,#22d3ee)",
    tags:  ["Open Bidding","Compare Proposals","Best Price"],
    icon:  "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
    cta:   "Post a Request →",
  },
  {
    num:   "02",
    title: "Find a Developer",
    desc:  "Browse verified SYNTHÉ developers directly. Review their 3D work, skills and ratings then send a direct project enquiry.",
    href:  "/connect",
    color: "#a78bfa",
    gradient: "linear-gradient(135deg,#7c3aed,#a78bfa)",
    tags:  ["Verified Profiles","Direct Hire","Portfolio Review"],
    icon:  "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    cta:   "Browse Developers →",
  },
  {
    num:   "03",
    title: "Freelance Marketplace",
    desc:  "Browse open freelance projects posted by clients. Bid on projects that match your skills, submit proposals and get hired.",
    href:  "/freelance",
    color: "#34d399",
    gradient: "linear-gradient(135deg,#059669,#34d399)",
    tags:  ["Open Projects","Submit Bids","Escrow Payments"],
    icon:  "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    cta:   "View Projects →",
  },
];

export default function RequestsPage() {
  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background:"radial-gradient(circle,#22d3ee,transparent 70%)", filter:"blur(80px)" }} />
        <div className="absolute bottom-[20%] right-[5%] w-[400px] h-[400px] rounded-full opacity-[0.06]"
          style={{ background:"radial-gradient(circle,#7c3aed,transparent 70%)", filter:"blur(80px)" }} />
        <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full opacity-[0.04]"
          style={{ background:"radial-gradient(circle,#34d399,transparent 70%)", filter:"blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage:"linear-gradient(rgba(167,139,250,1) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,1) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />
      </div>

      <div className="relative z-10 pt-28 pb-24 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
            className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-300/90 text-sm font-semibold uppercase tracking-widest">Commission Your Vision</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none mb-4">
              Get Your Own{" "}
              <span style={{ backgroundImage:"linear-gradient(90deg,#22d3ee,#a78bfa,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                Project
              </span>
            </h1>
            <p className="text-white/40 text-lg max-w-lg mx-auto leading-relaxed">
              Three ways to bring your AR/VR/3D idea to life. Pick what works best for you.
            </p>
          </motion.div>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {OPTIONS.map((opt, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.5, delay:0.1 + i*0.1 }}>
                <Link href={opt.href}>
                  <div className="group relative h-full rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl overflow-hidden hover:border-white/14 transition duration-300 cursor-pointer p-7 flex flex-col">

                    {/* Top shimmer */}
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{ background:`linear-gradient(90deg,transparent,${opt.color}50,transparent)` }} />

                    {/* Hover glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"
                      style={{ background:`radial-gradient(ellipse at top,${opt.color}08,transparent 65%)` }} />

                    {/* Number */}
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4" style={{ color:`${opt.color}60` }}>
                      Option {opt.num}
                    </p>

                    {/* Icon */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 flex-shrink-0 transition duration-300 group-hover:scale-110"
                      style={{ background:`${opt.color}18`, border:`1px solid ${opt.color}30` }}>
                      <svg className="w-5 h-5" style={{ color:opt.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={opt.icon} />
                      </svg>
                    </div>

                    <h3 className="text-white font-black text-xl tracking-tight mb-3">{opt.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed flex-grow mb-5">{opt.desc}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {opt.tags.map((tag, j) => (
                        <span key={j} className="px-2.5 py-1 rounded-lg text-[10px] font-black border"
                          style={{ color:opt.color, background:`${opt.color}10`, borderColor:`${opt.color}25` }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-sm font-black group-hover:gap-3 transition-all duration-200"
                      style={{ color:opt.color }}>
                      {opt.cta}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>

                    {/* Bottom slide line */}
                    <div className="mt-4 h-[1px] w-0 group-hover:w-full transition-all duration-500 rounded-full"
                      style={{ background:`linear-gradient(90deg,${opt.color},transparent)` }} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Bottom info strip */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.5 }}
            className="relative rounded-3xl border border-white/6 bg-white/[0.02] backdrop-blur-xl overflow-hidden p-8">
            <div className="absolute top-0 left-0 right-0 h-[1px]"
              style={{ background:"linear-gradient(90deg,transparent,rgba(34,211,238,0.3),rgba(167,139,250,0.3),rgba(52,211,153,0.3),transparent)" }} />

            <div className="grid sm:grid-cols-3 gap-6 text-center">
              {[
                { icon:"🔒", label:"Secure Payments",  desc:"All transactions via Razorpay escrow" },
                { icon:"⭐", label:"Verified Developers", desc:"Every developer is reviewed & rated" },
                { icon:"⚡", label:"Fast Turnaround",  desc:"Most projects completed within 7 days" },
              ].map((item,i) => (
                <motion.div key={i} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6+i*0.08 }}>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-white/80 font-black text-sm mb-1">{item.label}</p>
                  <p className="text-white/30 text-xs">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footnote */}
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }}
            className="text-center text-white/20 text-xs mt-8">
            Not sure which to choose?{" "}
            <Link href="/requests/post">
              <span className="text-cyan-400/60 hover:text-cyan-300 transition duration-200 font-semibold cursor-pointer">
                Post a public request for the widest reach.
              </span>
            </Link>
          </motion.p>

        </div>
      </div>

      <Footer />
    </div>
  );
}