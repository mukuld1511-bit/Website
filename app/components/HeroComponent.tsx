"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, TorusKnot } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import MagneticButton from "./MagneticButton";
import TextReveal from "./TextReveal";
import VideoBackground from "./VideoBackground";

interface HeroProps {
  user: any;
  stats: { models: number; developers: number; downloads: number; certifications: number };
  statsLoading: boolean;
}

function SpatialShape() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock, pointer }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.2 + pointer.y * 1.5;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.3 + pointer.x * 1.5;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
      <TorusKnot ref={meshRef} args={[1.5, 0.4, 256, 64]}>
        <MeshDistortMaterial
          color="#5B4BDB"
          emissive="#7C6EF6"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.8}
          distort={0.4}
          speed={2}
          wireframe={true}
        />
      </TorusKnot>
    </Float>
  );
}

export default function HeroComponent({ user, stats, statsLoading }: HeroProps) {
  const mCount = statsLoading ? "—" : `${stats.models}+`;
  const dCount = statsLoading ? "—" : `${stats.developers}+`;
  const dlCount = statsLoading ? "—" : `${stats.downloads}+`;

  return (
    <section className="relative w-full overflow-hidden min-h-screen flex items-center pt-24 pb-16">

      {/* ── Video Background ── */}
      <VideoBackground variant="aurora" color="#5B4BDB" intensity={0.8} scrollAccelerate />

      {/* ── Animated gradient mesh overlay ── */}
      <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-50 z-0">
        <motion.div
          animate={{ y: [0, -40, 0], x: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#5B4BDB]/15 rounded-full blur-[180px]"
        />
        <motion.div
          animate={{ y: [0, 50, 0], x: [0, -30, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[30%] left-[-5%] w-[500px] h-[500px] bg-[#7C6EF6]/15 rounded-full blur-[150px]"
        />
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#0A0A0F_95%)]" />
      </div>

      <div className="max-w-[90rem] mx-auto px-6 md:px-12 w-full relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
        
        {/* Left Content Area */}
        <div className="w-full lg:w-[50%] flex flex-col items-center lg:items-start text-center lg:text-left">
          
          <motion.div initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase bg-[#141420]/80 text-[#A594FF] border border-[#5B4BDB]/40 mb-8 backdrop-blur-xl shadow-[0_0_20px_rgba(91,75,219,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C6EF6] animate-ping" />
              Synthé Spatial Computing
            </span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40, rotateX: 20 }} 
            animate={{ opacity: 1, y: 0, rotateX: 0 }} 
            transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
            style={{ perspective: 1000 }}
          >
            <h1 className="text-[4rem] md:text-[5.5rem] lg:text-[7rem] font-black tracking-[-0.04em] text-white leading-[0.9] mb-8 drop-shadow-2xl">
              Build the 
              <br />
              <span className="bg-gradient-to-r from-[#5B4BDB] via-[#A594FF] to-[#06B6D4] bg-clip-text text-transparent relative">
                Future XR.
                <motion.span 
                  className="absolute inset-0 bg-white/20 blur-2xl z-[-1]" 
                  animate={{ opacity: [0, 0.5, 0] }} 
                  transition={{ duration: 4, repeat: Infinity }} 
                />
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, filter: "blur(10px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ duration: 0.8, delay: 0.4 }}
            className="text-[#9494AD] text-lg md:text-xl lg:text-2xl max-w-xl mb-12 leading-relaxed font-medium"
          >
            The premier platform for 3D creators and spatial engineers. Upload models, book mentors, and innovate.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto"
          >
            <MagneticButton href="/verse" variant="primary">
              <span className="px-6 py-2 text-lg">Enter 3D Verse</span>
            </MagneticButton>
            <MagneticButton href="/dashboard" variant="outline">
              <span className="px-6 py-2 text-lg">My Dashboard</span>
            </MagneticButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.8 }}
            className="flex items-center gap-6 mt-16 text-sm md:text-base font-black tracking-wider uppercase text-[#6B6B85]"
          >
            <div className="flex flex-col items-start gap-1">
              <span className="text-white text-2xl md:text-3xl">{mCount}</span>
              <span className="text-[10px]">3D Models</span>
            </div>
            <div className="w-px h-10 bg-[#2A2A3E]" />
            <div className="flex flex-col items-start gap-1">
              <span className="text-[#A594FF] text-2xl md:text-3xl drop-shadow-[0_0_10px_rgba(165,148,255,0.5)]">{dCount}</span>
              <span className="text-[10px]">Developers</span>
            </div>
            <div className="w-px h-10 bg-[#2A2A3E]" />
            <div className="flex flex-col items-start gap-1">
              <span className="text-white text-2xl md:text-3xl">{dlCount}</span>
              <span className="text-[10px]">Downloads</span>
            </div>
          </motion.div>
        </div>

        {/* Right 3D Spatial Area */}
        <div className="w-full lg:w-[50%] h-[50vh] lg:h-[80vh] relative z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
            className="w-full h-full relative"
          >
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }} className="w-full h-full cursor-crosshair">
              <ambientLight intensity={0.2} />
              <directionalLight position={[10, 10, 5]} intensity={2} color="#A594FF" />
              <directionalLight position={[-10, -10, -5]} intensity={1} color="#06B6D4" />
              <SpatialShape />
            </Canvas>
          </motion.div>

          {/* Hologram base effect */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 h-8 bg-[#5B4BDB]/20 rounded-[100%] blur-xl" />
        </div>

      </div>
    </section>
  );
}