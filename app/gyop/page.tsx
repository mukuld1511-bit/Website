"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const OPTIONS = [
  {
    num: "01",
    title: "Hire a Developer",
    desc: "Browse verified Synthé developers. Review their AR/VR/3D portfolio and send a direct project request. One-on-one collaboration from idea to delivery.",
    href: "/connect",
    colorClass: "text-indigo-600",
    bgClass: "bg-indigo-50",
    borderClass: "border-indigo-200",
    tags: ["Direct Hire", "Portfolio Review", "1-on-1 Project"],
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    cta: "Browse Developers →",
  },
  {
    num: "02",
    title: "Post a Request",
    desc: "Describe your project publicly. Verified developers apply with proposals, timelines and pricing. Review, choose the best fit, and build.",
    href: "/requests/post",
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
    tags: ["Open Proposals", "Compare Bids", "Secure Payments"],
    icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
    cta: "Post a Request →",
  },
];

export default function RequestsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 relative z-10 pt-32 pb-24 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto">

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-blue-700 text-xs font-bold uppercase tracking-widest">Get Your Own Project</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight mb-4">
              Build Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Vision
              </span>
            </h1>
            <p className="text-gray-500 font-medium text-lg max-w-lg mx-auto leading-relaxed">
              Two ways to bring your AR/VR/3D idea to life. Pick what works best for you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {OPTIONS.map((opt, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}>
                <Link href={opt.href}>
                  <div className="group relative h-full rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md hover:border-gray-300 transition duration-300 p-8 flex flex-col">
                    
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-5 ${opt.colorClass} opacity-60`}>
                      Option {opt.num}
                    </p>

                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 flex-shrink-0 transition duration-300 group-hover:scale-105 border shadow-sm ${opt.bgClass} ${opt.borderClass} ${opt.colorClass}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={opt.icon} />
                      </svg>
                    </div>

                    <h3 className="text-gray-900 font-extrabold text-2xl tracking-tight mb-3">{opt.title}</h3>
                    <p className="text-gray-500 font-medium text-sm leading-relaxed flex-grow mb-6">{opt.desc}</p>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {opt.tags.map((tag, j) => (
                        <span key={j} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${opt.bgClass} ${opt.borderClass} ${opt.colorClass}`}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className={`flex items-center gap-2 text-sm font-bold group-hover:gap-3 transition-all duration-200 ${opt.colorClass}`}>
                      {opt.cta}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-3xl border border-gray-200 bg-white overflow-hidden p-8 shadow-sm">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              {[
                { icon: "🔒", label: "Secure Payments", desc: "All transactions via Razorpay escrow" },
                { icon: "✦", label: "Verified Developers", desc: "Every developer is reviewed & certified" },
                { icon: "⚡", label: "Fast Delivery", desc: "Most projects completed within 7 days" },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <p className="text-gray-900 font-extrabold text-sm mb-1">{item.label}</p>
                  <p className="text-gray-500 font-medium text-xs">{item.desc}</p>
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