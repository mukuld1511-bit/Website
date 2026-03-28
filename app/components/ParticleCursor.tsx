"use client";

import { useEffect, useRef, useState } from "react";

interface CursorParticle {
  x: number;
  y: number;
  alpha: number;
  born: number;
}

export default function ParticleCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<CursorParticle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const [isTouchDevice, setIsTouchDevice] = useState(true);

  useEffect(() => {
    // Detect touch device
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    if (isTouchDevice) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      particlesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        alpha: 1,
        born: performance.now(),
      });
      // Cap at 40 particles
      if (particlesRef.current.length > 40) {
        particlesRef.current.shift();
      }
    };
    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = performance.now();
      particlesRef.current = particlesRef.current.filter((p) => {
        const age = now - p.born;
        if (age > 600) return false;
        p.alpha = 1 - age / 600;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 * p.alpha, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(91, 75, 219, ${p.alpha * 0.6})`;
        ctx.fill();
        return true;
      });

      // Main cursor dot
      ctx.beginPath();
      ctx.arc(mouseRef.current.x, mouseRef.current.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(91, 75, 219, 0.8)";
      ctx.fill();

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animRef.current);
    };
  }, [isTouchDevice]);

  if (isTouchDevice) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9998] pointer-events-none"
      style={{ willChange: "transform" }}
    />
  );
}
