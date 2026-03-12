"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function MagneticButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18 });
  const sy = useSpring(y, { stiffness: 200, damping: 18 });

  const handleMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left - rect.width / 2) * 0.35);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.35);
  };

  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      style={{ x: sx, y: sy, willChange: "transform", background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}
      className="relative px-7 py-3.5 rounded-2xl text-white font-black text-sm overflow-hidden group cursor-pointer border-0 outline-none"
    >
      {/* Shimmer */}
      <motion.div
        animate={{ x: ["-200%", "200%"] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3.5, ease: "linear" }}
        style={{ willChange: "transform", position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)", transform: "skewX(-20deg)", pointerEvents: "none" }}
      />
      {/* Glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none rounded-2xl"
        style={{ boxShadow: "inset 0 0 20px rgba(255,255,255,0.08)" }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}