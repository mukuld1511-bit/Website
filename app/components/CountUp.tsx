"use client";

import { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";

interface CountUpProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
  showRing?: boolean;
  ringColor?: string;
}

export default function CountUp({
  target,
  suffix = "",
  prefix = "",
  duration = 2000,
  decimals = 0,
  showRing = false,
  ringColor = "#5B4BDB",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const [value, setValue] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isInView || hasRun.current || target === 0) return;
    hasRun.current = true;

    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setValue(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };
    requestAnimationFrame(step);
  }, [isInView, target, duration]);

  const displayValue =
    target === 0 ? "—" : `${prefix}${decimals > 0 ? value.toFixed(decimals) : Math.round(value)}${suffix}`;

  const circumference = 2 * Math.PI * 36;
  const progress = target > 0 ? value / target : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <span ref={ref} className="relative inline-flex items-center justify-center">
      {showRing && (
        <svg
          className="absolute -inset-3"
          viewBox="0 0 80 80"
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke={ringColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.1s ease-out" }}
          />
        </svg>
      )}
      {displayValue}
    </span>
  );
}
