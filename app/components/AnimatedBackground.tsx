"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.1,
      speed: Math.random() * 0.008 + 0.003,
    }));

    let frame: number;
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t++;
      stars.forEach((s) => {
        const a = 0.2 + 0.8 * Math.abs(Math.sin(t * s.speed));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${a * 0.65})`;
        ctx.fill();
      });
      frame = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050008]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ willChange: "transform" }} />

      <motion.div
        animate={{ x: [0, 100, -80, 0], y: [0, -80, 50, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{
          willChange: "transform",
          position: "absolute",
          top: "-8%", left: "-5%",
          width: 700, height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 70%)",
          filter: "blur(90px)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        animate={{ x: [0, -100, 70, 0], y: [0, 70, -90, 0] }}
        transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
        style={{
          willChange: "transform",
          position: "absolute",
          top: "5%", right: "-10%",
          width: 800, height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)",
          filter: "blur(110px)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        animate={{ x: [0, 50, -60, 0], y: [0, -50, 40, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear", delay: 5 }}
        style={{
          willChange: "transform",
          position: "absolute",
          bottom: "5%", left: "15%",
          width: 500, height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        animate={{ x: [0, -40, 50, 0], y: [0, 50, -60, 0] }}
        transition={{ duration: 42, repeat: Infinity, ease: "linear", delay: 12 }}
        style={{
          willChange: "transform",
          position: "absolute",
          bottom: "-8%", right: "10%",
          width: 600, height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(244,114,182,0.07) 0%, transparent 70%)",
          filter: "blur(100px)",
          pointerEvents: "none",
        }}
      />

      {/* scan line and grid removed */}
    </div>
  );
}