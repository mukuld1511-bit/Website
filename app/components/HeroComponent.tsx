"use client";

import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";

// ─── 3D Starfield / Globe ──────────────────────────────────────────────────────
function ParticleSphere(props: any) {
  const ref = useRef<any>(null);
  
  // Generate points on a sphere
  const sphere = useMemo(() => {
    const numPoints = 2000;
    const positions = new Float32Array(numPoints * 3);
    for (let i = 0; i < numPoints; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = 1.5; // radius
        const sinPhi = Math.sin(phi);
        positions[i * 3] = r * sinPhi * Math.cos(theta);
        positions[i * 3 + 1] = r * sinPhi * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#3b82f6" // blue-500
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

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
    <section className="relative px-4 pt-20 pb-16 md:pt-32 md:pb-24 text-center max-w-5xl mx-auto font-sans min-h-[500px] flex flex-col justify-center">
      
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none -z-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-blue-50/80 to-transparent" />
      </div>

      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden flex items-center justify-center opacity-40">
        <Canvas camera={{ position: [0, 0, 3] }}>
          <ParticleSphere />
        </Canvas>
      </div>

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