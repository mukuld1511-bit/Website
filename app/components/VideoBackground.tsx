"use client";

import { useRef, useEffect, useCallback } from "react";
import { useScroll, useMotionValue } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

interface VideoBackgroundProps {
  variant?: "particles" | "mesh" | "grid" | "aurora";
  intensity?: number;
  color?: string;
  scrollAccelerate?: boolean;
  className?: string;
}

export default function VideoBackground({
  variant = "particles",
  intensity = 0.5,
  color = "#5B4BDB",
  scrollAccelerate = true,
  className = "",
}: VideoBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const scrollSpeed = useMotionValue(0);

  const { scrollYProgress } = useScroll();

  // Track scroll velocity
  useEffect(() => {
    let lastY = 0;
    const unsubscribe = scrollYProgress.on("change", (v) => {
      const delta = Math.abs(v - lastY);
      scrollSpeed.set(delta * 100);
      lastY = v;
    });
    return () => unsubscribe();
  }, [scrollYProgress, scrollSpeed]);

  const initParticles = useCallback(
    (width: number, height: number) => {
      const count = Math.floor(100 * intensity);
      const particles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const isViolet = Math.random() > 0.4;
        const isCyan = Math.random() > 0.8;
        const pColor = variant === "aurora" 
          ? (isCyan ? "#0eebe6" : isViolet ? color : "#ff00aa") 
          : (isViolet ? color : "rgba(255,255,255,0.8)");
        
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          radius: Math.random() * 2.5 + 1,
          color: pColor,
          alpha: Math.random() * 0.6 + 0.3,
        });
      }
      particlesRef.current = particles;
    },
    [intensity, color]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const container = containerRef.current;
      if (!container) return;
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      if (particlesRef.current.length === 0) {
        initParticles(width, height);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      if (!canvas || !ctx) return;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const sVel = scrollAccelerate ? 1 + scrollSpeed.get() * 2 : 1;

      // Draw particles
      if (variant === "particles" || variant === "mesh" || variant === "aurora") {
        particlesRef.current.forEach((p) => {
          p.x += p.vx * sVel;
          p.y += p.vy * sVel;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * intensity;
          ctx.fill();
          ctx.globalAlpha = 1;
        });
      }

      // Grid variant: faint grid lines
      if (variant === "grid") {
        ctx.strokeStyle = `${color}15`;
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        // Draw fewer particles on top
        particlesRef.current.slice(0, 30).forEach((p) => {
          p.x += p.vx * sVel * 0.5;
          p.y += p.vy * sVel * 0.5;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * 0.6;
          ctx.fill();
          ctx.globalAlpha = 1;
        });
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [variant, intensity, color, scrollAccelerate, scrollSpeed, initParticles]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    >
      {/* Gradient mesh layer */}
      {(variant === "mesh" || variant === "particles" || variant === "aurora") && (
        <>
          <div
            className="absolute inset-0 animate-conic-spin mix-blend-color-dodge transition-opacity duration-1000"
            style={{
              opacity: variant === "aurora" ? 0.45 * intensity : 0.25 * intensity,
              background: `conic-gradient(from var(--angle), ${color}, transparent, #0eebe6, transparent, ${color})`,
              filter: "blur(50px)",
            }}
          />
          <div
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              opacity: variant === "aurora" ? 0.3 * intensity : 0.15 * intensity,
              background: `radial-gradient(circle at 50% 50%, ${color}80 0%, transparent 70%)`,
              filter: "blur(80px)",
              mixBlendMode: "screen",
            }}
          />
        </>
      )}

      {/* Scan lines layer */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)`,
          animation: "scan-line 4s linear infinite",
          opacity: 0.5,
        }}
      />

      {/* Canvas for particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ willChange: "transform" }}
      />
    </div>
  );
}
