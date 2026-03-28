"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface TextRevealProps {
  children: string;
  delay?: number;
  stagger?: number;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export default function TextReveal({
  children,
  delay = 0,
  stagger = 0.04,
  className = "",
  as: Tag = "p",
}: TextRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-15%" });

  const words = children.split(" ");

  return (
    <Tag ref={ref as any} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
          <motion.span
            className="inline-block"
            initial={{ y: "100%", opacity: 0 }}
            animate={isInView ? { y: "0%", opacity: 1 } : { y: "100%", opacity: 0 }}
            transition={{
              duration: 0.5,
              delay: delay + i * stagger,
              ease: [0.0, 0.0, 0.2, 1.0],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
