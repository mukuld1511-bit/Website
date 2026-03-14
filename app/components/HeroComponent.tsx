"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import { TorusKnot, MeshDistortMaterial, Environment } from "@react-three/drei";

function RotatingModel() {
  const groupRef = useRef<any>(null);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
    }
  });

  return (
    <group ref={groupRef} scale={1.6}>
      {/* Main Vision Pro Frame (Silver/Aluminum edge) */}
      <mesh position={[0, 0, 0.4]}>
        <boxGeometry args={[1.5, 0.82, 0.4]} />
        <meshStandardMaterial color="#E5E7EB" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Curved Laminated Glass Front */}
      <mesh position={[0, 0, 0.62]}>
        {/* We use a thin cylinder scaled/rotated to fake the curved glass */}
        <cylinderGeometry args={[1.6, 1.6, 0.85, 32, 1, false, Math.PI * 0.35, Math.PI * 0.3]} />
        <meshPhysicalMaterial 
          color="#0f172a" 
          roughness={0.05} 
          metalness={0.9} 
          transmission={0.4}
          ior={1.5}
          envMapIntensity={2.5} 
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Internal "EyeSight" display screen behind glass */}
      <mesh position={[0, 0, 0.60]}>
        <boxGeometry args={[1.4, 0.7, 0.05]} />
        <meshStandardMaterial color="#2d1b4e" emissive="#6d28d9" emissiveIntensity={0.6} />
      </mesh>

      {/* Camera/Sensor Domes on the front glass */}
      <mesh position={[-0.4, -0.2, 0.64]}>
        <capsuleGeometry args={[0.06, 0.05, 16, 16]} />
        <meshStandardMaterial color="#000000" roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[0.4, -0.2, 0.64]}>
        <capsuleGeometry args={[0.06, 0.05, 16, 16]} />
        <meshStandardMaterial color="#000000" roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[0, -0.3, 0.64]}>
        <circleGeometry args={[0.04, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Light Seal (Black padding behind frame) */}
      <mesh position={[0, 0, 0.15]}>
        <boxGeometry args={[1.48, 0.8, 0.3]} />
        <meshStandardMaterial color="#1f2937" roughness={0.8} />
      </mesh>

      {/* Audio Straps (Side arms) */}
      <mesh position={[-0.78, 0, 0]}>
        <boxGeometry args={[0.1, 0.15, 0.8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      <mesh position={[0.78, 0, 0]}>
        <boxGeometry args={[0.1, 0.15, 0.8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>

      {/* Solo Knit Band (Thick 3D Fabric Strap at back) */}
      <mesh position={[0, 0, -0.45]}>
        <torusGeometry args={[0.82, 0.22, 32, 64, Math.PI]} />
        <meshStandardMaterial color="#f9fafb" roughness={1} />
        {/* Subtle orange accent on band */}
        <mesh position={[0.82, 0, 0]}>
          <boxGeometry args={[0.45, 0.05, 0.05]} />
          <meshStandardMaterial color="#f97316" roughness={0.5} />
        </mesh>
      </mesh>

      {/* Digital Crown (Top Right) */}
      <mesh position={[0.65, 0.42, 0.35]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.15, 32]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.4} metalness={0.9} />
      </mesh>
      
      {/* Top Button (Top Left) */}
      <mesh position={[-0.65, 0.42, 0.35]}>
        <boxGeometry args={[0.2, 0.05, 0.1]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.4} metalness={0.9} />
      </mesh>
    </group>
  );
}

interface HeroProps {
  user: any;
  stats: { models:number; developers:number; downloads:number; certifications:number };
  statsLoading: boolean;
}

export default function HeroComponent({ user, stats, statsLoading }: HeroProps) {
  const mCount = statsLoading ? "2,400+" : `${stats.models}+`;
  const dCount = statsLoading ? "180+" : `${stats.developers}+`;
  const dlCount = statsLoading ? "12,000+" : `${stats.downloads}+`;

  return (
    <section className="relative w-full bg-gradient-to-br from-blue-50 via-white to-pink-50 overflow-hidden min-h-screen flex items-center pt-24 pb-16">
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />
      
      {/* Decorative colorful blobs */}
      <motion.div 
        animate={{ y: [0, -30, 0], x: [0, 20, 0], scale: [1, 1.1, 1] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-10 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 z-0" 
      />
      <motion.div 
        animate={{ y: [0, 40, 0], x: [0, -20, 0], scale: [1, 1.2, 1] }} 
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-40 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 z-0" 
      />
      <motion.div 
        animate={{ y: [0, -20, 0], x: [0, 30, 0], scale: [1, 1.1, 1] }} 
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute -bottom-8 left-1/2 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 z-0" 
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-10">
          
          <div className="w-full lg:w-[55%] flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase bg-gradient-to-r from-pink-500 to-orange-400 text-white mb-6 shadow-lg transform hover:scale-105 transition cursor-default">
                🎉 SYNTHÉ INTERACTIVE
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-gray-900 leading-[1.1] mb-6"
            >
              Learn & Build with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500">AR & VR</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-600 text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-bold"
            >
              Your playful, interactive hub for 3D Models, spatial computing, and connecting with genius developers. Dive in!
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 mb-12 w-full sm:w-auto"
            >
              <Link href="/gallery" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-500 border-b-4 border-blue-800 hover:border-blue-600 active:border-b-0 active:translate-y-1 transition-all shadow-xl text-lg">
                  Explore Gallery 🚀
                </button>
              </Link>
              <Link href="/requests/open" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-blue-600 bg-white border-2 border-blue-200 border-b-4 hover:border-blue-300 hover:bg-blue-50 active:border-b-2 active:translate-y-1 transition-all shadow-md text-lg">
                  Post a Project 💡
                </button>
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
              className="flex items-center gap-4 text-sm font-black text-gray-500 bg-white/50 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/60"
            >
              <span className="text-pink-600">{mCount} <span className="text-gray-500">3D Models</span></span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              <span className="text-blue-600">{dCount} <span className="text-gray-500">Developers</span></span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              <span className="text-purple-600">{dlCount} <span className="text-gray-500">Downloads</span></span>
            </motion.div>
          </div>

          <div className="w-full lg:w-[45%]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }} animate={{ opacity: 1, scale: 1, rotate: -2 }} transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.5 }}
              className="relative w-full aspect-square rounded-[3rem] bg-white border-4 border-white shadow-[0_20px_60px_-15px_rgba(59,130,246,0.5)] p-2 overflow-hidden group flex flex-col hover:rotate-0 transition-transform duration-500"
            >
              <div className="flex-1 relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-100 to-pink-100">
                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                  <ambientLight intensity={0.8} />
                  <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
                  <pointLight position={[-10, -10, -10]} intensity={1.5} color="#ec4899" />
                  <pointLight position={[0, -10, 10]} intensity={1.5} color="#3b82f6" />
                  <RotatingModel />
                  <Environment preset="city" />
                </Canvas>
              </div>
              
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-lg border border-white/50">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                  </span>
                  <span className="text-gray-800 text-sm font-bold tracking-wide">Interactive VR Prototype</span>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}