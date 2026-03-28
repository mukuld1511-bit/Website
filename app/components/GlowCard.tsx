"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface GlowCardProps {
  children: React.ReactNode;
  glowColor?: string;
  intensity?: number;
  className?: string;
}

export default function GlowCard({
  children,
  glowColor = "rgba(91, 75, 219, 0.4)",
  intensity = 1,
  className = "",
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setTilt({
      rx: -((y - 0.5) * 10 * intensity),
      ry: (x - 0.5) * 10 * intensity,
    });
    setGlowPos({ x: x * 100, y: y * 100 });
  }

  function handleMouseLeave() {
    setTilt({ rx: 0, ry: 0 });
    setIsHovered(false);
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        willChange: "transform",
        transform: `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: "transform 0.15s ease-out",
      }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Glow overlay */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${glowColor}, transparent 60%)`,
            opacity: 0.6 * intensity,
          }}
        />
      )}
      {children}
    </motion.div>
  );
}
