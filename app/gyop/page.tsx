"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import VideoBackground from "../components/VideoBackground";
import TextReveal from "../components/TextReveal";
import MagneticButton from "../components/MagneticButton";

const OPTIONS = [
  {
    num: "01",
    title: "Hire a Developer",
    desc: "Browse verified Synthé developers. Review their AR/VR/3D portfolio and send a direct project request. One-on-one collaboration from idea to delivery.",
    href: "/connect",
    colorClass: "text-[#A594FF]",
    bgClass: "bg-[#5B4BDB]/10",
    borderClass: "border-[#5B4BDB]/30",
    glowColor: "group-hover:shadow-[0_0_30px_rgba(91,75,219,0.2)]",
    tags: ["Direct Hire", "Portfolio Review", "1-on-1 Project"],
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    cta: "Browse Developers",
  },
  {
    num: "02",
    title: "Post a Request",
    desc: "Describe your project publicly. Verified developers apply with proposals, timelines and pricing. Review, choose the best fit, and build.",
    href: "/requests/post",
    colorClass: "text-[#06B6D4]",
    bgClass: "bg-[#06B6D4]/10",
    borderClass: "border-[#06B6D4]/30",
    glowColor: "group-hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]",
    tags: ["Open Proposals", "Compare Bids", "Secure Payments"],
    icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
    cta: "Post a Request",
  },
];

export default function RequestsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans">
      <VideoBackground variant="aurora" color="#5B4BDB" intensity={0.4} />
      <main className="flex-1 relative z-10 pt-32 pb-24 px-4 overflow-hidden">
        <div className="max-w-5xl mx-auto">

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] relative uppercase bg-[#141420]/80 text-[#A594FF] border border-[#5B4BDB]/40 mb-8 backdrop-blur-xl shadow-[0_0_20px_rgba(91,75,219,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C6EF6] animate-ping" />
              Get Your Own Project
            </div>
            <TextReveal as="h1" className="text-5xl md:text-7xl font-black tracking-[-0.04em] text-white leading-[0.9] mb-6 drop-shadow-2xl">
              Build Your Vision.
            </TextReveal>
            <p className="text-[#9494AD] font-medium text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Two pathways to bring your specific AR/VR/3D idea to life. Post a request for proposals or hire directly.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {OPTIONS.map((opt, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.1, type: "spring" }}>
                <Link href={opt.href}>
                  <div className={`group relative h-full rounded-3xl border border-[#2A2A3E] bg-[#141420]/80 backdrop-blur-md overflow-hidden hover:border-[#5B4BDB]/50 transition duration-500 p-8 flex flex-col ${opt.glowColor}`}>
                    
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-5 ${opt.colorClass} opacity-60`}>
                      Option {opt.num}
                    </p>

                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 flex-shrink-0 transition duration-500 group-hover:scale-110 border backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] ${opt.bgClass} ${opt.borderClass} ${opt.colorClass}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={opt.icon} />
                      </svg>
                    </div>

                    <h3 className="text-white font-black text-3xl tracking-tight mb-3 group-hover:text-white transition-colors">{opt.title}</h3>
                    <p className="text-[#6B6B85] font-medium text-sm leading-relaxed flex-grow mb-8 group-hover:text-[#9494AD] transition-colors">{opt.desc}</p>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {opt.tags.map((tag, j) => (
                        <span key={j} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#2A2A3E] bg-[#0A0A0F]/50 text-[#9494AD] group-hover:border-[#5B4BDB]/30 transition-colors`}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className={`flex items-center gap-2 text-sm font-bold group-hover:translate-x-1 transition-all duration-300 ${opt.colorClass}`}>
                      {opt.cta}
                      <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-synthe rounded-3xl overflow-hidden p-8 hover:border-[#5B4BDB]/40 transition-colors">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              {[
                { icon: "🔒", label: "Secure Payments", desc: "All transactions via Razorpay escrow" },
                { icon: "✦", label: "Verified Developers", desc: "Every developer is reviewed & certified" },
                { icon: "⚡", label: "Fast Delivery", desc: "Most projects completed within 7 days" },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.1 }}>
                  <div className="text-3xl mb-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{item.icon}</div>
                  <p className="text-white font-black text-sm mb-1">{item.label}</p>
                  <p className="text-[#6B6B85] font-medium text-[11px] uppercase tracking-widest">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </main>
      <Footer />
    </div>
  );
}