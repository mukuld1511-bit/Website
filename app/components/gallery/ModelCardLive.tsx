"use client";
import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import AuraGlow from "../AuraGlow";

// Dynamically import the Canvas-based preview (no SSR)
const ModelCardPreview = dynamic(
  () => import("./ModelCardPreview"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    ),
  }
);

export interface ModelData {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  modelUrl: string;
  fileType?: string;
  category?: string;
  tags?: string[];
  isPaid?: boolean;
  price?: number;
  authorName?: string;
  authorId?: string;
  engagementScore?: number;
  downloads?: number;
  likes?: number;
  views?: number;
  fileSize?: number;
}

interface Props {
  model: ModelData;
  auraMode?: boolean;
}

/**
 * ModelCardLive — gallery card with:
 *  - Thumbnail that fades to live 3D on first hover (GLB/GLTF only)
 *  - AuraGlow ring based on engagementScore
 *  - File type + price badges
 *  - "Live 3D" indicator while previewing
 */
export default function ModelCardLive({ model, auraMode = false }: Props) {
  const [hovered,        setHovered]        = useState(false);
  const [previewMounted, setPreviewMounted] = useState(false);

  const score   = model.engagementScore ?? 0;
  const canLive = ["glb", "gltf"].includes((model.fileType ?? "").toLowerCase());

  const handleEnter = () => {
    setHovered(true);
    if (canLive) setPreviewMounted(true);
  };

  const trendLabel =
    score >= 70 ? "🔥 Trending"
    : score >= 30 ? "⚡ Popular"
    : score >  0  ? "✨ New"
    : null;

  const trendColor =
    score >= 70 ? "text-amber-500"
    : score >= 30 ? "text-purple-500"
    : "text-blue-500";

  return (
    <Link href={`/gallery/${model.id}`} className="block block group">
      <div
        className={`relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300
          ${auraMode
            ? "border-gray-700 bg-gray-900 group-hover:border-gray-500 group-hover:shadow-lg group-hover:shadow-purple-900/20"
            : "border-gray-100 bg-white group-hover:shadow-xl group-hover:-translate-y-1"}`}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={handleEnter}
      >
        {/* Aura glow ring */}
        <AuraGlow score={score} />

        {/* Media area */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {/* Thumbnail */}
          {model.thumbnailUrl ? (
            <img
              src={model.thumbnailUrl}
              alt={model.title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500
                ${hovered && canLive && previewMounted ? "opacity-0" : "opacity-100"}`}
            />
          ) : (
            <div className={`absolute inset-0 flex items-center justify-center text-5xl
              ${auraMode ? "bg-gray-800" : "bg-gradient-to-br from-gray-100 to-gray-200"}`}>
              📦
            </div>
          )}

          {/* Live 3D canvas — mounts once on first hover, stays mounted */}
          {previewMounted && (
            <div className={`absolute inset-0 transition-opacity duration-500
              ${hovered ? "opacity-100" : "opacity-0"}`}>
              <ModelCardPreview url={model.modelUrl} />
            </div>
          )}

          {/* File type badge */}
          <div className="absolute top-2 left-2 z-20">
            <span className="px-2 py-1 rounded-lg bg-black/70 text-white text-xs font-bold uppercase tracking-wide">
              {model.fileType ?? "3D"}
            </span>
          </div>

          {/* Price badge */}
          <div className="absolute top-2 right-2 z-20">
            {model.isPaid && model.price ? (
              <span className="px-2 py-1 rounded-lg bg-green-500 text-white text-xs font-bold">
                ₹{model.price}
              </span>
            ) : (
              <span className="px-2 py-1 rounded-lg bg-blue-500 text-white text-xs font-bold">
                Free
              </span>
            )}
          </div>

          {/* Live 3D indicator */}
          {hovered && canLive && previewMounted && (
            <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/70">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white text-xs font-medium">Live 3D</span>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className={`p-4 transition-colors duration-200 ${auraMode ? "bg-gray-900 group-hover:bg-gray-800" : "bg-white group-hover:bg-gray-50"}`}>
          <h3 className={`font-bold text-sm truncate mb-0.5
            ${auraMode ? "text-white" : "text-gray-900"}`}>
            {model.title}
          </h3>
          <p className={`text-xs truncate ${auraMode ? "text-gray-400" : "text-gray-500"}`}>
            {model.authorName ?? "Unknown"}
          </p>
          {trendLabel && (
            <div className={`flex items-center gap-1.5 mt-2 text-xs font-semibold ${trendColor}`}>
              {trendLabel}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
