"use client";

import { motion } from "framer-motion";

const config: Record<string, { gradient: string; glow: string; icon: string }> = {
  "Explore 3D Projects": {
    gradient: "linear-gradient(135deg, #7c3aed, #0891b2)",
    glow: "rgba(124,58,237,0.3)",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  "Learn From Experts": {
    gradient: "linear-gradient(135deg, #0891b2, #2563eb)",
    glow: "rgba(6,182,212,0.3)",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  "Build Custom Projects": {
    gradient: "linear-gradient(135deg, #d97706, #db2777)",
    glow: "rgba(217,119,6,0.3)",
    icon: "M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z",
  },
};

const fallback = { gradient: "linear-gradient(135deg, #7c3aed, #0891b2)", glow: "rgba(124,58,237,0.3)", icon: "M13 10V3L4 14h7v7l9-11h-7z" };

export default function FeatureCard({ title, desc }: { title: string; desc: string }) {
  const c = config[title] ?? fallback;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group relative h-full"
      style={{ willChange: "transform" }}
    >
      {/* Hover glow */}
      <div
        className="absolute -inset-[1px] rounded-3xl opacity-0 group-hover:opacity-100 transition duration-500 blur-md pointer-events-none"
        style={{ background: c.gradient }}
      />

      <div className="relative h-full rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl p-8 flex flex-col overflow-hidden group-hover:border-white/10 transition duration-300">

        {/* Top shimmer */}
        <div className="absolute top-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition duration-500"
          style={{ background: `linear-gradient(90deg, transparent, ${c.glow.replace("0.3", "0.5")}, transparent)` }}
        />

        {/* BG gradient overlay on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none rounded-3xl"
          style={{ background: `radial-gradient(ellipse at top left, ${c.glow.replace("0.3", "0.06")}, transparent 70%)` }}
        />

        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.08, rotate: 3 }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
          style={{ willChange: "transform", width: 56, height: 56, borderRadius: "1rem", background: c.gradient, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem", flexShrink: 0 }}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={c.icon} />
          </svg>
        </motion.div>

        <h3 className="font-black text-xl text-white mb-3 tracking-tight leading-tight">{title}</h3>
        <p className="text-white/40 text-sm leading-relaxed flex-1">{desc}</p>

        {/* Bottom accent */}
        <div
          className="mt-6 h-[2px] w-0 group-hover:w-full transition-all duration-500 rounded-full"
          style={{ background: c.gradient }}
        />
      </div>
    </motion.div>
  );
}