"use client";

import { motion } from "framer-motion";

interface CardProps {
  children:   React.ReactNode;
  className?: string;
  hover?:     boolean;
  padding?:   "none" | "sm" | "md" | "lg";
  onClick?:   () => void;
}

const paddingStyles = {
  none: "",
  sm:   "p-4",
  md:   "p-6",
  lg:   "p-8",
};

export default function Card({ children, className = "", hover = true, padding = "md", onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white border border-gray-200 rounded-2xl shadow-sm
        ${hover ? "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${paddingStyles[padding]}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}
