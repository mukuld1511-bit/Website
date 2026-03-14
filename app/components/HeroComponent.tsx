"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import { TorusKnot, MeshDistortMaterial, Environment } from "@react-three/drei";

function RotatingModel() {
  const meshRef = useRef<any>(null);
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <TorusKnot ref={meshRef} args={[1.5, 0.4, 128, 32]} scale={0.8}>
      <MeshDistortMaterial color="#5B4BDB" roughness={0.2} metalness={0.8} shadowSide={2} distort={0.2} speed={1.5} />
    </TorusKnot>
  );
}

interface HeroProps {
  user: any;
  stats: { models:number; developers:number; downloads:number; certifications:number };
  statsLoading: boolean;
}

export default function HeroComponent({ user, stats, statsLoading }: HeroProps) {
  // Fallbacks if stats aren't loaded yet
  const mCount = statsLoading ? "2,400+" : `${stats.models}+`;
  const dCount = statsLoading ? "180+" : `${stats.developers}+`;
  const dlCount = statsLoading ? "12,000+" : `${stats.downloads}+`;

  return (
    <section className="relative w-full bg-[#0A0A0A] overflow-hidden min-h-screen flex items-center pt-24 pb-16">
      {/* Subtle Pattern Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
          
          {/* LEFT COLUMN */}
          <div className="w-full lg:w-[60%] flex flex-col items-start text-left">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-black tracking-[0.15em] uppercase bg-[#5B4BDB] text-white overflow-hidden mb-6 shadow-[0_0_20px_rgba(91,75,219,0.4)]">
                SYNTHÉ BETA
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-[72px] font-extrabold tracking-tight text-white leading-[1.05] mb-6"
            >
              The Operating System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Spatial Creators</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-400 text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-light"
            >
              Upload, discover, and commission AR/VR/3D work. Connect with certified developers globally.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 mb-10 w-full sm:w-auto"
            >
              <Link href="/gallery" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-[#5B4BDB] hover:bg-[#4a3bc7] transition shadow-[0_4px_20px_-4px_rgba(91,75,219,0.5)]">
                  Explore Gallery
                </button>
              </Link>
              <Link href="/requests/open" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-transparent border border-gray-600 hover:border-white hover:bg-white/5 transition">
                  Post a Project
                </button>
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
              className="flex items-center gap-3 text-xs md:text-sm font-semibold text-gray-400"
            >
              <span className="text-white">{mCount} 3D Models</span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span className="text-white">{dCount} Developers</span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span className="text-white">{dlCount} Downloads</span>
            </motion.div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-full lg:w-[40%]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
              className="relative w-full aspect-[4/5] rounded-3xl bg-[#141414] border border-gray-800 shadow-2xl p-4 overflow-hidden group flex flex-col"
            >
              <div className="flex-1 relative rounded-2xl overflow-hidden bg-black/40">
                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} intensity={1.5} />
                  <pointLight position={[-10, -10, -10]} intensity={0.5} color="#5B4BDB" />
                  <RotatingModel />
                  <Environment preset="city" />
                </Canvas>
              </div>
              
              <div className="flex items-center justify-between pt-4 px-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-gray-400 text-xs font-mono">Live Preview · GLB</span>
                </div>
                <Link href="/upload" className="text-[#5B4BDB] text-xs font-bold hover:text-[#7667eb] transition flex items-center gap-1">
                  Upload yours <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </Link>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}