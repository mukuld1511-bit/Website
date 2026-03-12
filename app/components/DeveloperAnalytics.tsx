"use client";

import { motion } from "framer-motion";

export default function DeveloperAnalytics({ dev }: { dev: any }) {
  const stats = [
    { label: "Projects", value: dev.projects ?? 0, color: "#a78bfa", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
    { label: "Reviews", value: dev.reviews ?? 0, color: "#22d3ee", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    { label: "Avg Rating", value: dev.rating ? Number(dev.rating).toFixed(1) : "—", color: "#fbbf24", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-3xl overflow-hidden border border-white/6 bg-white/[0.025] backdrop-blur-xl p-8 mt-6"
    >
      {/* Top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.4), rgba(34,211,238,0.3), transparent)" }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-violet-400/70 text-xs uppercase tracking-[0.3em] font-semibold mb-1">Developer</p>
          <h2 className="text-2xl font-black text-white tracking-tight">{dev.name}</h2>
        </div>
        {dev.certified && (
          <span className="flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-400/25 bg-yellow-400/8 text-yellow-300 text-xs font-black uppercase tracking-widest">
            ⭐ Synthé Certified
          </span>
        )}
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="relative rounded-2xl border border-white/6 bg-white/[0.03] p-5 flex flex-col gap-2 overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${s.color}18 0%, transparent 70%)`, filter: "blur(12px)" }}
            />
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${s.color}18`, border: `1px solid ${s.color}25` }}>
              <svg className="w-4 h-4" fill="none" stroke={s.color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={s.icon} />
              </svg>
            </div>
            <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-white/35 text-xs font-medium">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Rating bar */}
      {dev.rating && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/40 text-xs font-medium uppercase tracking-widest">Rating Score</span>
            <span className="text-yellow-300 font-black text-sm">{Number(dev.rating).toFixed(1)} / 5.0</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(Number(dev.rating) / 5) * 100}%` }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #a78bfa, #22d3ee, #fbbf24)" }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}