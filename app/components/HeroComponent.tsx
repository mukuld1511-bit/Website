"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface HeroProps {
  user: any;
  stats: { models:number; developers:number; downloads:number; certifications:number };
  statsLoading: boolean;
}

export default function HeroComponent({ user, stats, statsLoading }: HeroProps) {
  const CHIPS = [
    { label:"3D Gallery",    href:"/gallery" },
    { label:"AR / VR",       href:"/gallery?mode=ar" },
    { label:"AutoCAD Hub",   href:"/autocad" },
    { label:"Certification", href:"/certification" },
    { label:"PIET Collab",   href:"/collaborators" },
    { label:"Open Projects", href:"/requests/open" },
  ];

  return (
    <section className="relative px-4 pt-20 pb-16 md:pt-32 md:pb-24 text-center max-w-5xl mx-auto font-sans">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none -z-10" />

      {/* Pill */}
      <motion.div
        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-800 mb-8 mx-auto shadow-sm">
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-widest">SYNTHÉ BETA</span>
      </motion.div>

      {/* Headline */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.1 }}>
        <h1 className="text-5xl md:text-7xl lg:text-[80px] font-black tracking-tight text-gray-900 leading-tight mb-6">
          The Hub for <br className="hidden md:block" />
          <span className="text-blue-600">Spatial Computing</span>
        </h1>
      </motion.div>

      {/* Description */}
      <motion.p
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }}
        className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
        Upload, discover, and collaborate on AR/VR builds, 3D models, and architectural files. Connect with certified developers globally.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.3 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
        <Link href={user ? "/upload" : "/join"}>
          <button className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition">
            {user ? "Upload Content" : "Join Platform"}
          </button>
        </Link>
        <Link href="/gallery">
          <button className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm transition">
            Explore Gallery
          </button>
        </Link>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.4 }}
        className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
        {CHIPS.map((chip, i) => (
          <Link key={chip.label} href={chip.href}>
            <div className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition shadow-sm cursor-pointer">
              {chip.label}
            </div>
          </Link>
        ))}
      </motion.div>

    </section>
  );
}