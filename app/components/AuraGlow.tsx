"use client";

interface AuraGlowProps {
  score: number;
}

/**
 * AuraGlow — renders an animated box-shadow glow ring around a parent card
 * based on engagementScore. Higher score = warmer/faster glow.
 *
 * Score ≥ 70 → amber  (Trending)
 * Score ≥ 30 → purple (Popular)
 * Score  > 0 → blue   (New)
 */
export default function AuraGlow({ score }: AuraGlowProps) {
  if (score <= 0) return null;

  const glow =
    score >= 70
      ? "0 0 8px 2px #EF9F2766, 0 0 24px 6px #EF9F2733"
      : score >= 30
      ? "0 0 6px 2px #5B4BDB55, 0 0 18px 5px #5B4BDB22"
      : "0 0 5px 1px #378ADD44, 0 0 14px 4px #378ADD1A";

  const duration =
    score >= 70 ? "1.4s" : score >= 30 ? "2.2s" : "3.2s";

  return (
    <div
      className="absolute inset-0 rounded-2xl pointer-events-none"
      style={{
        boxShadow: glow,
        animation: `aura-pulse ${duration} ease-in-out infinite`,
        zIndex: 1,
        borderRadius: "inherit",
      }}
    />
  );
}
