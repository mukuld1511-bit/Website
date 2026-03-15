"use client";
import { motion, AnimatePresence } from "framer-motion";

export interface ModelStats {
  polyCount:     number;
  vertexCount:   number;
  meshCount:     number;
  materialCount: number;
  fileSize:      number;
}

interface Props {
  open:              boolean;
  stats:             ModelStats | null;
  wireframe:         boolean;
  onWireframeToggle: () => void;
  onClose:           () => void;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000)      return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

function ComplexityBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color =
    pct > 80 ? "bg-red-500"
    : pct > 50 ? "bg-amber-400"
    : "bg-emerald-400";
  return (
    <div className="w-full h-1 rounded-full bg-white/10 mt-0.5">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function ModelStatsPanel({ open, stats, wireframe, onWireframeToggle, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.18 }}
          className="absolute top-4 right-4 z-30 w-56 rounded-2xl bg-gray-900/95 backdrop-blur-sm border border-white/10 p-4 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-white text-sm font-bold">Model Stats</span>
            <button onClick={onClose}
              className="text-white/40 hover:text-white/80 transition-colors w-6 h-6 flex items-center justify-center text-xl">×</button>
          </div>

          {stats ? (
            <div className="space-y-3">
              {[
                { label: "Polygons",   value: stats.polyCount,     max: 500_000 },
                { label: "Vertices",   value: stats.vertexCount,   max: 500_000 },
                { label: "Meshes",     value: stats.meshCount,     max: 100     },
                { label: "Materials",  value: stats.materialCount, max: 50      },
              ].map(({ label, value, max }) => (
                <div key={label}>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">{label}</span>
                    <span className="text-white text-xs font-mono font-bold">{fmt(value)}</span>
                  </div>
                  <ComplexityBar value={value} max={max} />
                </div>
              ))}

              {stats.fileSize > 0 && (
                <div className="flex justify-between items-center pt-1 border-t border-white/10">
                  <span className="text-gray-400 text-xs">File size</span>
                  <span className="text-white text-xs font-mono font-bold">{stats.fileSize.toFixed(1)} MB</span>
                </div>
              )}

              <div className="pt-2 border-t border-white/10">
                <button onClick={onWireframeToggle}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    wireframe
                      ? "bg-[#5B4BDB] text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  }`}>
                  {wireframe ? "✦ Wireframe ON" : "Wireframe OFF"}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-20 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
