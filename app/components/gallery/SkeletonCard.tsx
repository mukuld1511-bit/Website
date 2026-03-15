"use client";

interface Props { dark?: boolean }

export default function SkeletonCard({ dark = false }: Props) {
  const shimmerClass = dark ? "skeleton-shimmer-dark" : "skeleton-shimmer";
  const base         = dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100";

  return (
    <div className={`rounded-2xl border ${base} overflow-hidden`}>
      <div className={`aspect-square w-full ${shimmerClass}`} />
      <div className={`p-4 space-y-2.5 ${dark ? "bg-gray-900" : "bg-white"}`}>
        <div className={`h-4 rounded-lg w-4/5 ${shimmerClass}`} />
        <div className={`h-3 rounded-lg w-1/2 ${shimmerClass}`} />
        <div className="flex items-center gap-2 pt-1">
          <div className={`w-2 h-2 rounded-full ${shimmerClass}`} />
          <div className={`h-3 rounded-lg w-16 ${shimmerClass}`} />
        </div>
      </div>
    </div>
  );
}
