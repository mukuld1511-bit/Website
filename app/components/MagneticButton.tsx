"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface MagneticButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  disabled?: boolean;
}

export default function MagneticButton({
  children,
  href,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
}: MagneticButtonProps) {
  const btnRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent) {
    if (!btnRef.current || disabled) return;
    const rect = btnRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setOffset({
      x: (e.clientX - cx) * 0.2,
      y: (e.clientY - cy) * 0.2,
    });
  }

  function handleMouseLeave() {
    setOffset({ x: 0, y: 0 });
    setIsHovered(false);
  }

  const baseStyles = {
    primary:
      "bg-[#5B4BDB] text-white border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] shadow-[0_0_20px_rgba(91,75,219,0.2)] hover:shadow-[0_0_40px_rgba(91,75,219,0.4)]",
    secondary:
      "bg-[#141420] text-[#9494AD] border border-[#2A2A3E] hover:bg-[#1A1A2E] hover:text-white hover:border-[#5B4BDB]/40",
    outline:
      "bg-transparent text-white border-2 border-[#5B4BDB]/50 hover:border-[#5B4BDB] hover:bg-[#5B4BDB]/10",
  };

  const content = (
    <motion.div
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm
        transition-all duration-200 active:translate-y-[1px] cursor-pointer overflow-hidden
        ${baseStyles[variant]} ${disabled ? "opacity-40 pointer-events-none" : ""} ${className}`}
    >
      {/* Shimmer sweep on hover */}
      {isHovered && variant === "primary" && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
          }}
        />
      )}

      {/* Border draw on hover for outline variant */}
      {isHovered && variant === "outline" && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-[#5B4BDB] pointer-events-none"
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        />
      )}

      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}