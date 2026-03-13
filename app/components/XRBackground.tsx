"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function XRBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2,
      speed: Math.random() * 0.006 + 0.002,
    }));

    let frame: number;
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 1;
      stars.forEach((s) => {
        const flicker = 0.35 + 0.65 * Math.abs(Math.sin(t * s.speed));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${flicker * 0.7})`;
        ctx.fill();
      });
      frame = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050008]">

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ willChange: "transform" }} />

      <motion.div
        animate={{ x: [0, 80, -60, 0], y: [0, -60, 40, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
        style={{
          willChange: "transform",
          position: "absolute",
          top: "-10%", left: "-5%",
          width: 700, height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        animate={{ x: [0, -80, 60, 0], y: [0, 60, -80, 0] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        style={{
          willChange: "transform",
          position: "absolute",
          top: "10%", right: "-10%",
          width: 800, height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
          filter: "blur(100px)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        animate={{ x: [0, 40, -40, 0], y: [0, -40, 60, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear", delay: 6 }}
        style={{
          willChange: "transform",
          position: "absolute",
          bottom: 0, left: "20%",
          width: 500, height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(251,146,60,0.07) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        animate={{ y: ["0vh", "100vh"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        style={{
          willChange: "transform",
          position: "absolute", left: 0, right: 0,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.15), rgba(34,211,238,0.1), transparent)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}