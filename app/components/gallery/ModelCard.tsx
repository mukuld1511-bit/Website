"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { GalleryModel, FileType } from "@/types/gallery";

const FILE_ICONS: Record<FileType, string> = {
  glb: "◈", gltf: "◈", obj: "⬡", fbx: "⬡", dwg: "⊞", dxf: "⊞",
};
const FILE_COLORS: Record<FileType, { text: string; bg: string; border: string }> = {
  glb:  { text: "text-violet-300", bg: "bg-violet-500/10",  border: "border-violet-500/25" },
  gltf: { text: "text-violet-300", bg: "bg-violet-500/10",  border: "border-violet-500/25" },
  obj:  { text: "text-cyan-300",   bg: "bg-cyan-500/10",    border: "border-cyan-500/25" },
  fbx:  { text: "text-cyan-300",   bg: "bg-cyan-500/10",    border: "border-cyan-500/25" },
  dwg:  { text: "text-amber-300",  bg: "bg-amber-500/10",   border: "border-amber-500/25" },
  dxf:  { text: "text-amber-300",  bg: "bg-amber-500/10",   border: "border-amber-500/25" },
};

interface ModelCardProps {
  model: GalleryModel;
  hasAccess?: boolean;
  isLoggedIn?: boolean;
  onPurchase?: (model: GalleryModel) => void;
  onRequestAccess?: (model: GalleryModel) => void;
}

export default function ModelCard({ model, hasAccess = false, isLoggedIn = false, onPurchase, onRequestAccess }: ModelCardProps) {
  const [hovered, setHovered] = useState(false);

  const fileExt = (model.fileType?.toLowerCase() as FileType) ?? "glb";
  const fc = FILE_COLORS[fileExt] ?? FILE_COLORS.glb;
  const isLocked = model.isPaid && !hasAccess;
  const isRequestOnly = model.accessType === "request";

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 350, damping: 24 }}
      style={{ willChange: "transform" }}
      className="group relative rounded-2xl border border-white/6 bg-white/[0.025] overflow-hidden flex flex-col"
    >
      {/* Outer hover glow */}
      <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition duration-400 blur-sm pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.1))" }} />

      {/* Thumbnail */}
      <Link href={`/gallery/${model.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-[#07000f] flex-shrink-0">
          {model.thumbnailUrl ? (
            <img
              src={model.thumbnailUrl}
              alt={model.title}
              className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-106"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className={`text-6xl opacity-10 ${fc.text}`}>{FILE_ICONS[fileExt]}</span>
            </div>
          )}

          {/* Hover CTA overlay */}
          <motion.div
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ willChange: "opacity" }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-center pb-4"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 border border-white/20 rounded-full px-4 py-1.5 bg-black/40 backdrop-blur-sm">
              View Model →
            </span>
          </motion.div>

          {/* Lock blur overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px] flex items-center justify-center">
              <div className="w-12 h-12 rounded-2xl border border-white/15 bg-white/8 flex items-center justify-center">
                <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          )}

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border backdrop-blur-sm ${fc.text} ${fc.bg} ${fc.border}`}>
              {FILE_ICONS[fileExt]} {fileExt.toUpperCase()}
            </span>
            {model.isPaid ? (
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 backdrop-blur-sm">
                {isRequestOnly ? "🔐 Request" : `₹${model.price}`}
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 backdrop-blur-sm">
                🔓 Free
              </span>
            )}
          </div>

          {/* Owned badge */}
          {hasAccess && model.isPaid && (
            <div className="absolute top-3 right-3">
              <span className="text-[10px] font-black px-2 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 backdrop-blur-sm">
                ✓ Owned
              </span>
            </div>
          )}

          {/* Bottom shimmer */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
            style={{ background: "linear-gradient(90deg, #a78bfa, #22d3ee)" }} />
        </div>
      </Link>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/gallery/${model.id}`}>
          <h3 className="font-bold text-white text-sm mb-1 truncate group-hover:text-violet-300 transition-colors duration-200">
            {model.title}
          </h3>
          <p className="text-xs text-white/30 truncate mb-3">{model.description}</p>
        </Link>

        {/* Stats */}
        <div className="flex items-center justify-between mb-3">
          {[
            { icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z", val: (model.views ?? 0).toLocaleString() },
            { icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", val: (model.likes ?? 0).toLocaleString() },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-1 text-white/25">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
              </svg>
              <span className="text-[10px] font-medium">{s.val}</span>
            </div>
          ))}
          {model.polygons && (
            <span className="text-[10px] text-white/20">{model.polygons} polys</span>
          )}
        </div>

        {/* Author */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-full flex-shrink-0 overflow-hidden"
            style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
            {model.authorPhoto
              ? <img src={model.authorPhoto} className="w-full h-full object-cover" />
              : <span className="w-full h-full flex items-center justify-center text-white text-[8px] font-black">{model.authorName?.[0]}</span>
            }
          </div>
          <span className="text-xs text-white/35 truncate">{model.authorName ?? "Unknown"}</span>
        </div>

        {/* CTA button */}
        <div className="mt-auto">
          {isLocked && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => isRequestOnly ? onRequestAccess?.(model) : onPurchase?.(model)}
              style={{ willChange: "transform", background: "linear-gradient(135deg, #7c3aed88, #2563eb88)" }}
              className="w-full py-2.5 rounded-xl text-xs font-black text-white border border-violet-500/30 hover:border-violet-400/50 transition duration-200 relative overflow-hidden group/btn"
            >
              <motion.div
                animate={{ x: ["-200%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "linear" }}
                style={{ willChange: "transform", position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)", transform: "skewX(-20deg)", pointerEvents: "none" }}
              />
              <span className="relative z-10">
                {isRequestOnly ? "🔐 Request Access" : `Unlock · ₹${model.price}`}
              </span>
            </motion.button>
          )}

          {!isLocked && model.isPaid && (
            <Link href={`/gallery/${model.id}`}>
              <div className="w-full py-2.5 rounded-xl text-xs font-black text-center text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition duration-200">
                ✓ Open Model
              </div>
            </Link>
          )}

          {!model.isPaid && (
            <Link href={`/gallery/${model.id}`}>
              <div className="w-full py-2.5 rounded-xl text-xs font-black text-center text-white/45 border border-white/8 bg-white/[0.02] hover:border-violet-400/30 hover:text-violet-300 hover:bg-violet-500/5 transition duration-200">
                View Free Model →
              </div>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}