"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Join() {
  const [hovered, setHovered] = useState<string | null>(null);

  const cards = [
    {
      id: "signup",
      href: "/signup",
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, #0891b2, #2563eb)",
      glowColor: "rgba(6,182,212,0.45)",
      borderHover: "#0891b2",
      tag: "Explorer",
      title: "Sign Up",
      desc: "Create an account to explore immersive projects, connect with developers and collaborate on the future of 3D, AR and VR.",
      perks: ["Browse the full gallery", "Request tutorials", "Save favourite projects", "Leave reviews"],
      cta: "Create Account",
      ctaGradient: "linear-gradient(135deg, #0891b2, #2563eb)",
    },
    {
      id: "developer",
      href: "/join/developer",
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, #7c3aed, #db2777)",
      glowColor: "rgba(139,92,246,0.45)",
      borderHover: "#7c3aed",
      tag: "Builder",
      title: "Join as Developer",
      desc: "Apply to become a verified SYNTHÉ developer. Upload projects, offer mentorship and earn Synthé Certified status.",
      perks: ["Upload 3D / AR / VR projects", "Offer tutorials & mentorship", "Earn Synthé Certified badge", "Manage access & downloads"],
      cta: "Apply as Developer",
      ctaGradient: "linear-gradient(135deg, #7c3aed, #db2777)",
      featured: true,
    },
  ];

  return (
    <main className="min-h-screen bg-[#050008] px-4 sm:px-6 lg:px-8 py-28 relative overflow-hidden flex flex-col items-center">

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.13) 0%, transparent 70%)", filter: "blur(100px)" }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(219,39,119,0.07) 0%, transparent 70%)", filter: "blur(80px)" }} />

      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.018] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(167,139,250,1) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-5xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm mb-7"
          >
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-300/90 text-sm font-semibold uppercase tracking-widest">
              Join SYNTHÉ
            </span>
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-none mb-5">
            Choose Your{" "}
            <span style={{
              backgroundImage: "linear-gradient(90deg, #a78bfa, #22d3ee, #f472b6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              Path
            </span>
          </h1>

          <p className="text-white/40 text-xl max-w-xl mx-auto font-light leading-relaxed">
            Become part of the SYNTHÉ creator ecosystem. Explore, build and collaborate on immersive experiences.
          </p>

          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-10 h-[2px] bg-violet-500/30 rounded-full" />
            <div className="w-28 h-[2px] rounded-full"
              style={{ background: "linear-gradient(90deg, #a78bfa, #22d3ee)" }} />
            <div className="w-10 h-[2px] bg-cyan-500/30 rounded-full" />
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              onMouseEnter={() => setHovered(card.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ willChange: "transform" }}
              className="relative group"
            >
              {/* Developer featured label */}
              {card.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full text-white shadow-lg"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}
                  >
                    ⭐ Recommended
                  </span>
                </div>
              )}

              {/* Outer glow */}
              <motion.div
                animate={{ opacity: hovered === card.id ? 0.6 : 0 }}
                transition={{ duration: 0.35 }}
                style={{
                  willChange: "opacity",
                  position: "absolute", inset: "-2px",
                  borderRadius: "1.5rem",
                  background: card.gradient,
                  filter: "blur(16px)",
                  pointerEvents: "none",
                }}
              />

              {/* Card */}
              <div
                className="relative h-full rounded-3xl overflow-hidden border flex flex-col transition-colors duration-300"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderColor: hovered === card.id ? card.borderHover : "rgba(255,255,255,0.07)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {/* Gradient overlay */}
                <motion.div
                  animate={{ opacity: hovered === card.id ? 0.08 : 0 }}
                  transition={{ duration: 0.35 }}
                  style={{
                    willChange: "opacity",
                    position: "absolute", inset: 0,
                    background: card.gradient,
                    pointerEvents: "none",
                  }}
                />

                {/* Top shimmer */}
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${card.glowColor}, transparent)` }}
                />

                <div className="relative z-10 p-8 md:p-10 flex flex-col h-full">

                  {/* Icon + tag row */}
                  <div className="flex items-start justify-between mb-8">
                    <motion.div
                      animate={{ scale: hovered === card.id ? 1.08 : 1 }}
                      transition={{ type: "spring", stiffness: 350, damping: 22 }}
                      style={{ willChange: "transform", width: "64px", height: "64px", borderRadius: "1rem", background: card.gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    >
                      {card.icon}
                    </motion.div>

                    <span
                      className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border"
                      style={{
                        background: `${card.glowColor.replace("0.45", "0.1")}`,
                        borderColor: `${card.glowColor.replace("0.45", "0.25")}`,
                        color: card.id === "developer" ? "#c084fc" : "#22d3ee",
                      }}
                    >
                      {card.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none mb-4">
                    {card.title}
                  </h2>

                  {/* Description */}
                  <p className="text-white/40 text-base leading-relaxed mb-8 font-light">
                    {card.desc}
                  </p>

                  {/* Perks */}
                  <div className="flex flex-col gap-2.5 mb-10 flex-1">
                    {card.perks.map((perk, j) => (
                      <motion.div
                        key={j}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 + j * 0.06 }}
                        className="flex items-center gap-3"
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: card.gradient }}
                        >
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-white/55 text-sm font-medium">{perk}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Link href={card.href}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      style={{ willChange: "transform", background: card.ctaGradient }}
                      className="relative w-full py-4 rounded-2xl overflow-hidden cursor-pointer group/btn"
                    >
                      {/* Shimmer */}
                      <motion.div
                        animate={{ x: ["-200%", "200%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "linear" }}
                        style={{
                          willChange: "transform",
                          position: "absolute", inset: 0,
                          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                          transform: "skewX(-20deg)",
                          pointerEvents: "none",
                        }}
                      />
                      <span className="relative z-10 flex items-center justify-center gap-2 text-white font-black text-base">
                        {card.cta}
                        <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </motion.div>
                  </Link>

                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Already have an account */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-white/25 text-sm mt-10"
        >
          Already have an account?{" "}
          <Link href="/login">
            <span
              className="font-semibold cursor-pointer hover:text-violet-300 transition-colors duration-200"
              style={{ color: "#a78bfa" }}
            >
              Log in here
            </span>
          </Link>
        </motion.p>

      </div>
    </main>
  );
}