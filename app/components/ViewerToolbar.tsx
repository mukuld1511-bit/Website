"use client";
import { motion } from "framer-motion";

export type LightingPreset   = "studio" | "outdoor" | "dark" | "city";
export type BackgroundPreset = "white" | "gray" | "black";

interface ViewerToolbarProps {
  lighting:           LightingPreset;
  background:         BackgroundPreset;
  wireframe:          boolean;
  cinematic:          boolean;
  statsOpen:          boolean;
  onLightingChange:   (v: LightingPreset) => void;
  onBackgroundChange: (v: BackgroundPreset) => void;
  onWireframeToggle:  () => void;
  onCinematicToggle:  () => void;
  onStatsToggle:      () => void;
  onScreenshot:       () => void;
  onFullscreen:       () => void;
  onResetCamera:      () => void;
}

const LIGHTING: { key: LightingPreset; icon: string; label: string }[] = [
  { key: "studio",  icon: "💡", label: "Studio"  },
  { key: "outdoor", icon: "☀️", label: "Outdoor" },
  { key: "dark",    icon: "🌑", label: "Dark"    },
  { key: "city",    icon: "🌆", label: "City"    },
];

const BACKGROUNDS: { key: BackgroundPreset; color: string }[] = [
  { key: "white", color: "#f9fafb" },
  { key: "gray",  color: "#374151" },
  { key: "black", color: "#0a0a0a" },
];

export default function ViewerToolbar({
  lighting, background, wireframe, cinematic, statsOpen,
  onLightingChange, onBackgroundChange, onWireframeToggle,
  onCinematicToggle, onStatsToggle, onScreenshot, onFullscreen, onResetCamera,
}: ViewerToolbarProps) {
  const btn = (active: boolean, onClick: () => void, children: React.ReactNode, title: string) => (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
        active
          ? "bg-[#5B4BDB] text-white"
          : "text-white/60 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-3 py-2 rounded-2xl bg-gray-900/90 backdrop-blur-sm border border-white/10 shadow-2xl select-none"
      style={{ whiteSpace: "nowrap" }}
    >
      {/* Lighting presets */}
      <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-white/10">
        {LIGHTING.map(({ key, icon, label }) => (
          <button key={key} onClick={() => onLightingChange(key)} title={label}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
              lighting === key ? "bg-white/20 ring-1 ring-white/30" : "hover:bg-white/10"
            }`}>
            {icon}
          </button>
        ))}
      </div>

      {/* Background colour pickers */}
      <div className="flex items-center gap-1.5 px-2 mr-1 border-r border-white/10">
        {BACKGROUNDS.map(({ key, color }) => (
          <button key={key} onClick={() => onBackgroundChange(key)} title={`Background: ${key}`}
            className={`w-5 h-5 rounded-full border-2 transition-all ${
              background === key ? "border-[#5B4BDB] scale-125" : "border-white/20 hover:border-white/50"
            }`}
            style={{ background: color }}
          />
        ))}
      </div>

      {/* Tool buttons */}
      <div className="flex items-center gap-0.5 pl-1">
        <button
          onClick={onCinematicToggle}
          title="Cinematic mode"
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all relative ${
            cinematic ? "bg-[#5B4BDB] text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          🎬
          {cinematic && (
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          )}
        </button>
        {btn(wireframe, onWireframeToggle, (
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="8,2 14,12 2,12" />
          </svg>
        ), "Wireframe")}
        {btn(statsOpen, onStatsToggle, (
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
            <rect x="2" y="10" width="3" height="4" rx="0.5"/>
            <rect x="6.5" y="6" width="3" height="8" rx="0.5"/>
            <rect x="11" y="2" width="3" height="12" rx="0.5"/>
          </svg>
        ), "Model stats")}
        {btn(false, onResetCamera, (
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="5.5"/>
            <path d="M8 4v4l3 1"/>
          </svg>
        ), "Reset camera")}
        {btn(false, onScreenshot, "📸", "Screenshot")}
        {btn(false, onFullscreen, (
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/>
          </svg>
        ), "Fullscreen")}
      </div>
    </motion.div>
  );
}
