"use client";

interface Props { dark?: boolean }

export default function SkeletonCard({ dark = false }: Props) {
  const shimmer = dark ? "bg-gray-700" : "bg-gray-200";
  const base    = dark ? "bg-gray-900" : "bg-white";
  const border  = dark ? "border-gray-800" : "border-gray-100";
  return (
    <div className={`rounded-2xl border ${border} ${base} overflow-hidden animate-pulse`}>
      <div className={`aspect-square ${dark ? "bg-gray-800" : "bg-gray-200"}`} />
      <div className="p-4 space-y-2.5">
        <div className={`h-4 rounded ${shimmer} w-4/5`} />
        <div className={`h-3 rounded ${shimmer} w-1/2`} />
        <div className="flex items-center gap-1.5 pt-1">
          <div className={`w-1.5 h-1.5 rounded-full ${shimmer}`} />
          <div className={`h-3 rounded ${shimmer} w-16`} />
        </div>
      </div>
    </div>
  );
}
