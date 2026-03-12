"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const links = ["3D Galleria", "Connect & Learn", "G.Y.O.P", "Developer Profiles"];

export default function Footer() {
  return (
    <footer className="relative bg-[#050008] text-white overflow-hidden">

      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.4), rgba(34,211,238,0.25), transparent)" }}
      />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[250px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)", filter: "blur(80px)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto py-16 px-6">
        <div className="grid md:grid-cols-3 gap-10 mb-12">

          {/* About */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 5h16l-6 7 6 7H4l6-7-6-7z" />
                </svg>
              </div>
              <span className="font-black text-lg text-white tracking-tight">
                Synthé{" "}
                <span style={{ backgroundImage: "linear-gradient(90deg, #a78bfa, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  
                </span>
              </span>
            </div>
            <p className="text-white/35 text-sm leading-relaxed">
              A collaborative ecosystem where creators share immersive 3D, AR and VR experiences while learners connect with experts to build the future of spatial technology.
            </p>
          </motion.div>

          {/* Platform */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(to bottom, #a78bfa, #22d3ee)" }} />
              <h3 className="font-black text-white tracking-tight">Platform</h3>
            </div>
            <ul className="space-y-3">
              {links.map((item, i) => (
                <li key={i}>
                  <span className="flex items-center gap-2.5 text-white/35 text-sm hover:text-white/70 transition duration-200 cursor-pointer group">
                    <span className="w-1 h-1 rounded-full bg-violet-500/40 group-hover:bg-violet-400 transition duration-200" />
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Collaborators */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(to bottom, #22d3ee, #a78bfa)" }} />
              <h3 className="font-black text-white tracking-tight">Collaborators</h3>
            </div>
            <p className="text-white/30 text-sm mb-4">Developed in collaboration with</p>
            <div className="p-4 rounded-2xl border border-white/6 bg-white/[0.025] backdrop-blur-sm inline-block">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <strong className="text-cyan-300 text-sm font-black">AR / VR Studio @ PIET</strong>
              </div>
              <span className="text-white/25 text-xs">Piet Innovation & Emerging Technology Lab</span>
            </div>
          </motion.div>
        </div>

        <div className="h-[1px] mb-6" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />

        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-2"
        >
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} SYNTHÉ. All rights reserved.</p>
          <p className="text-white/15 text-xs">Built for the future of immersive technology</p>
        </motion.div>
      </div>
    </footer>
  );
}