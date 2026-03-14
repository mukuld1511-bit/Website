"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";

interface HeroProps {
  user: any;
  stats: { models: number; developers: number; downloads: number; certifications: number };
  statsLoading: boolean;
}

// A simple spinning geometry for the placeholder card
function RotatingShape() {
  const meshRef = useRef<any>(null);
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[1, 0.3, 100, 16]} />
      <meshStandardMaterial color="#5B4BDB" wireframe={true} />
    </mesh>
  );
}

export default function HeroComponent({ user, stats, statsLoading }: HeroProps) {
  // Format stats with fallbacks
  const displayModels = statsLoading ? "2,400+" : `${stats.models.toLocaleString()}+`;
  const displayDevs = statsLoading ? "180+" : `${stats.developers.toLocaleString()}+`;
  const displayDownloads = statsLoading ? "12,000+" : `${stats.downloads.toLocaleString()}+`;

  return (
    <section className="relative w-full bg-[#0A0A0A] overflow-hidden min-h-[90vh] flex items-center pt-24 pb-20">
      
      {/* Subtle Dot Pattern Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />
      
      {/* Subtle gradient glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#5B4BDB] rounded-full blur-[150px] opacity-10 pointer-events-none -translate-y-1/2" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
        
        {/* LEFT COLUMN (60%) */}
        <div className="w-full lg:w-[60%] flex flex-col items-start text-left">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#5B4BDB] text-white text-[10px] font-black tracking-[0.2em] uppercase mb-8 shadow-lg shadow-[#5B4BDB]/20"
          >
            SYNTHÉ BETA
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6"
          >
            The Operating System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">Spatial Creators</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-400 text-lg sm:text-xl font-medium max-w-2xl mb-10 leading-relaxed"
          >
            Upload, discover, and commission AR/VR/3D work. Connect with
            certified developers globally.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-10 w-full sm:w-auto"
          >
            <Link href="/gallery" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-[#5B4BDB] hover:bg-[#4a3bc7] shadow-[0_0_30px_-5px_#5B4BDB] transition duration-300">
                Explore Gallery
              </button>
            </Link>
            <Link href="/requests/post" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-transparent border border-gray-600 hover:border-white hover:bg-white/5 transition duration-300">
                Post a Project
              </button>
            </Link>
          </motion.div>

          {/* Inline Stats */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center flex-wrap gap-x-3 gap-y-2 text-sm font-semibold text-gray-400"
          >
            <span>{displayModels} 3D Models</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>{displayDevs} Developers</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>{displayDownloads} Downloads</span>
          </motion.div>

        </div>

        {/* RIGHT COLUMN (40%) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full lg:w-[40%] flex justify-center lg:justify-end"
        >
          <div className="relative w-full max-w-sm aspect-[4/5] bg-[#141414] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl flex flex-col group">
            
            {/* 3D Canvas Area */}
            <div className="flex-1 w-full relative cursor-grab active:cursor-grabbing">
              <Canvas camera={{ position: [0, 0, 4] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <RotatingShape />
              </Canvas>
              
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Bottom Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-5 flex items-center justify-between border-t border-gray-800/50 bg-[#141414]/90 backdrop-blur-md">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#0A0A0A] border border-gray-800">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-gray-300 font-mono tracking-wider uppercase">Live Preview &middot; GLB</span>
              </div>
              <Link href="/upload">
                <span className="text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer">
                  Upload yours &rarr;
                </span>
              </Link>
            </div>
            
          </div>
        </motion.div>

      </div>
    </section>
  );
}