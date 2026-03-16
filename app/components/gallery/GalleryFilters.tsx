"use client";

import { motion } from "framer-motion";
import type { GalleryFiltersState, PriceRange, SortOption } from "@/types/gallery";

const CATEGORIES = ["All", "Architecture", "Mechanical", "Character", "Environment", "Product", "AutoCAD"];
const FILE_TYPES = ["All Types", "GLB/GLTF", "OBJ/FBX", "DWG/DXF"];
const SORT_OPTIONS: SortOption[] = ["newest", "popular", "downloads", "price-low", "price-high"];
const PRICE_OPTIONS: PriceRange[] = ["all", "free", "paid"];

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Latest",
  popular: "Most Viewed",
  downloads: "Most Liked",
  "price-low": "Price: Low",
  "price-high": "Price: High"
};

const PRICE_LABELS: Record<PriceRange, string> = {
  all: "All",
  free: "Free",
  paid: "Paid"
};

interface GalleryFiltersProps {
  filters: GalleryFiltersState;
  onChange: (filters: GalleryFiltersState) => void;
}

export default function GalleryFilters({ filters, onChange }: GalleryFiltersProps) {
  const { category, fileType, sortBy, priceRange, search } = filters;

  function set<K extends keyof GalleryFiltersState>(key: K, val: GalleryFiltersState[K]) {
    onChange({ ...filters, [key]: val });
  }

  const sectionLabel = (text: string) => (
    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25 mb-3">{text}</p>
  );

  const pillBase = "px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer";
  const pillInactive = "bg-white/[0.03] border-white/8 text-white/40 hover:border-white/15 hover:text-white/65";

  return (
    <div className="space-y-7">

      {/* Search */}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-violet-400 transition duration-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search models, tags, authors..."
          className="w-full bg-white/[0.03] border border-white/8 rounded-xl pl-10 pr-10 py-3.5 text-white text-sm outline-none focus:border-violet-500/40 focus:shadow-[0_0_16px_rgba(139,92,246,0.08)] transition duration-200 placeholder:text-white/20"
        />
        {search && (
          <button
            onClick={() => set("search", "")}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition duration-200"
          >
            <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-white/5" />

      {/* Category */}
      <div>
        {sectionLabel("Category")}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.94 }}
              onClick={() => set("category", cat)}
              className={`${pillBase} ${
                category === cat
                  ? "bg-violet-500/18 border-violet-500/40 text-violet-300"
                  : pillInactive
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </div>

      {/* File Type */}
      <div>
        {sectionLabel("File Type")}
        <div className="flex flex-wrap gap-2">
          {FILE_TYPES.map((ft) => (
            <motion.button
              key={ft}
              whileTap={{ scale: 0.94 }}
              onClick={() => set("fileType", ft)}
              className={`${pillBase} ${
                fileType === ft
                  ? "bg-cyan-500/12 border-cyan-500/30 text-cyan-300"
                  : pillInactive
              }`}
            >
              {ft}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        {sectionLabel("Price")}
        <div className="grid grid-cols-3 gap-2">
            {PRICE_OPTIONS.map((p) => (
            <motion.button
              key={p}
              whileTap={{ scale: 0.94 }}
              onClick={() => set("priceRange", p)}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
                priceRange === p
                  ? p === "free"
                    ? "bg-emerald-500/12 border-emerald-500/30 text-emerald-300"
                    : p === "paid"
                    ? "bg-amber-500/12 border-amber-500/30 text-amber-300"
                    : "bg-violet-500/18 border-violet-500/40 text-violet-300"
                  : pillInactive
              }`}
            >
              {PRICE_LABELS[p]}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        {sectionLabel("Sort By")}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => set("sortBy", e.target.value as SortOption)}
            className="w-full appearance-none bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-violet-500/40 transition duration-200 cursor-pointer pr-10"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s} className="bg-[#0a0010]">{SORT_LABELS[s]}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Reset */}
      {(search || category !== "All" || fileType !== "All Types" || priceRange !== "all" || sortBy !== "newest") && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => onChange({ search: "", category: "All", fileType: "All Types", priceRange: "all", sortBy: "newest", tags: [] })}
          className="w-full py-2.5 text-xs font-bold text-white/35 border border-white/6 rounded-xl hover:border-white/15 hover:text-white/55 transition duration-200"
        >
          Clear all filters
        </motion.button>
      )}
    </div>
  );
}