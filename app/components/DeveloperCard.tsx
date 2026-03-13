"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function DeveloperCard({ dev }: any) {
  const isCertified = dev.certified;
  const skills = Array.isArray(dev.skills) ? dev.skills.join(", ") : dev.skills;

  return (
    <Link href={`/developer/${dev.userId || dev.id}`} style={{ textDecoration: "none" }}>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 350, damping: 24 }}
        style={{ willChange: "transform" }}
        className="group relative cursor-pointer"
      >
        {/* Outer glow */}
        <div className={`absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition duration-400 blur-sm pointer-events-none ${
          isCertified
            ? "bg-gradient-to-r from-yellow-400/25 to-amber-400/15"
            : "bg-gradient-to-r from-violet-500/20 to-cyan-500/15"
        }`} />

        <div className={`relative rounded-2xl border bg-white/[0.025] backdrop-blur-sm p-5 flex items-center gap-5 transition duration-300 overflow-hidden ${
          isCertified
            ? "border-yellow-400/20 group-hover:border-yellow-400/40"
            : "border-white/6 group-hover:border-violet-500/25"
        }`}>

          {/* Top shimmer */}
          <div className={`absolute top-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition duration-400 ${
            isCertified
              ? "bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent"
              : "bg-gradient-to-r from-transparent via-violet-400/30 to-transparent"
          }`} />

          {/* Gradient bg fade on hover */}
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-400 pointer-events-none ${
            isCertified ? "bg-yellow-400/[0.025]" : "bg-violet-500/[0.03]"
          }`} />

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className={`absolute -inset-[2px] rounded-full blur-[5px] opacity-50 group-hover:opacity-80 transition duration-300 ${
              isCertified
                ? "bg-gradient-to-br from-yellow-400 to-amber-500"
                : "bg-gradient-to-br from-violet-400 to-cyan-500"
            }`} />
            <img
              src={dev.profileImage || "/avatar.png"}
              alt={dev.name}
              className="relative w-14 h-14 rounded-full object-cover border-2 border-black/30"
            />
            {isCertified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-[10px] border-2 border-[#050008]">
                ⭐
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 relative z-10">
            {isCertified && (
              <span className="inline-block text-[9px] font-black uppercase tracking-[0.2em] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full mb-1.5">
                ⭐ Synthé Certified
              </span>
            )}
            <h3 className="text-white font-bold text-base leading-tight truncate group-hover:text-white transition duration-200">
              {dev.name}
            </h3>
            <p className="text-white/35 text-xs mt-0.5 truncate">{skills}</p>
            {dev.rating && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-2.5 h-2.5 ${i < Math.round(dev.rating) ? "text-yellow-400" : "text-white/10"}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  ))}
                </div>
                <span className="text-white/40 text-xs">{Number(dev.rating).toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 relative z-10">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition duration-300 ${
              isCertified
                ? "border-yellow-400/15 bg-yellow-400/5 group-hover:border-yellow-400/35 group-hover:bg-yellow-400/10"
                : "border-white/6 bg-white/[0.03] group-hover:border-violet-500/30 group-hover:bg-violet-500/8"
            }`}>
              <svg className={`w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200 ${
                isCertified ? "text-yellow-400/60 group-hover:text-yellow-300" : "text-white/30 group-hover:text-violet-300"
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Bottom accent */}
          <div className={`absolute bottom-0 left-0 right-0 h-[1px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ${
            isCertified
              ? "bg-gradient-to-r from-yellow-400/40 to-amber-400/20"
              : "bg-gradient-to-r from-violet-400/40 to-cyan-400/20"
          }`} />
        </div>
      </motion.div>
    </Link>
  );
}