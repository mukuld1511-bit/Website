"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import {
  collection, query, where, orderBy, getDocs,
  limit, startAfter, QueryDocumentSnapshot, DocumentData,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ModelCardLive, { ModelData } from "../components/gallery/ModelCardLive";
import SkeletonCard from "../components/gallery/SkeletonCard";
import Link from "next/link";
import { motion } from "framer-motion";
import { useGalleryFilters, SortBy, FormatFilter } from "../../hooks/useGalleryFilters";

export const dynamic = "force-dynamic";

type TabMode  = "3d" | "ar" | "vr" | "autocad";
type ViewMode = "grid" | "aura";

const TABS: { key: TabMode; label: string; emoji: string }[] = [
  { key: "3d",      label: "3D Models", emoji: "🧊" },
  { key: "ar",      label: "AR",        emoji: "📱" },
  { key: "vr",      label: "VR",        emoji: "🥽" },
  { key: "autocad", label: "AutoCAD",   emoji: "📐" },
];

const FORMATS: FormatFilter[] = ["all", "glb", "gltf", "obj", "fbx", "zip", "dwg"];
const PAGE_SIZE = 12;

function GalleryContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [tab,         setTab]         = useState<TabMode>((searchParams.get("mode") as TabMode) ?? "3d");
  const [view,        setView]        = useState<ViewMode>("grid");
  const [models,      setModels]      = useState<ModelData[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore,     setHasMore]     = useState(false);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  const [filters, setFilters] = useGalleryFilters();

  const sortField: Record<SortBy, string> = {
    newest:    "uploadedAt",
    popular:   "engagementScore",
    downloads: "downloads",
  };

  const fetchModels = async (append = false) => {
    if (!append) { setLoading(true); setModels([]); lastDocRef.current = null; }
    else setLoadingMore(true);

    try {
      const baseConstraints = [
        where("status", "==", "published"),
        orderBy(sortField[filters.sort], "desc"),
        limit(PAGE_SIZE),
        ...(append && lastDocRef.current ? [startAfter(lastDocRef.current)] : []),
      ];

      const genre = searchParams.get("genre");

      let q;
      if (tab === "3d") {
        const constraints = [...baseConstraints];
        if (genre) constraints.push(where("category", "==", genre.charAt(0).toUpperCase() + genre.slice(1)));
        q = query(collection(db, "models"), where("fileType", "in", ["glb","gltf","obj","fbx"]), ...constraints);
      } else if (tab === "ar") {
        q = query(collection(db, "models"), where("category", "==", "AR Build"), ...baseConstraints);
      } else if (tab === "vr") {
        q = query(collection(db, "models"), where("category", "==", "VR Build"), ...baseConstraints);
      } else {
        q = query(collection(db, "models"), where("category", "==", "AutoCAD"), ...baseConstraints);
      }

      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ModelData));

      if (snap.docs.length > 0) lastDocRef.current = snap.docs[snap.docs.length - 1];
      setHasMore(snap.docs.length === PAGE_SIZE);
      setModels(prev => append ? [...prev, ...docs] : docs);
    } catch (err) {
      console.error("Gallery fetch error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchModels(); }, [tab, filters.sort]);

  // Client-side filters (format, price, search) applied on top
  const displayed = models.filter(m => {
    if (filters.format !== "all" && m.fileType !== filters.format) return false;
    if (filters.price  === "free" && m.isPaid)                     return false;
    if (filters.price  === "paid" && !m.isPaid)                    return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      return m.title.toLowerCase().includes(q) ||
             (m.tags ?? []).some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const handleTabChange = (t: TabMode) => {
    setTab(t);
    router.push(`/gallery?mode=${t}`, { scroll: false });
  };

  const dark = view === "aura";

  const pill = (active: boolean) =>
    `px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${active
      ? "bg-[#5B4BDB] text-white border-[#4438b8]"
      : dark ? "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
             : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${dark ? "bg-gray-950" : "bg-gradient-to-br from-indigo-50 via-white to-pink-50"}`}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12 flex-grow w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className={`text-3xl font-black tracking-tight ${dark ? "text-white" : "text-gray-900"}`}>
              Gallery
            </h1>
            <p className={`text-sm mt-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>
              {loading ? "Loading..." : `${displayed.length}${hasMore ? "+" : ""} models`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Grid / Aura toggle */}
            {(["grid", "aura"] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)} className={pill(view === v)}>
                {v === "grid" ? "⊞ Grid" : "✦ Aura"}
              </button>
            ))}
            <Link href="/upload">
              <button className="px-4 py-2 rounded-xl bg-[#5B4BDB] text-white text-sm font-bold border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all active:translate-y-[1px]">
                + Upload
              </button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 mb-5 p-1 rounded-2xl w-fit ${dark ? "bg-gray-800" : "bg-gray-100"}`}>
          {TABS.map(({ key, label, emoji }) => (
            <button key={key} onClick={() => handleTabChange(key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                tab === key
                  ? dark ? "bg-gray-700 text-white shadow-sm" : "bg-white text-gray-900 shadow-sm"
                  : dark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
              }`}>
              <span>{emoji}</span> {label}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={filters.search}
              onChange={e => setFilters({ search: e.target.value })}
              placeholder="Search models, tags..."
              className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/30 ${
                dark ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                     : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
              }`}
            />
          </div>

          {/* Format filter pills */}
          <div className="flex gap-1 flex-wrap">
            {FORMATS.map(f => (
              <button key={f} onClick={() => setFilters({ format: f })} className={pill(filters.format === f)}>
                {f === "all" ? "All" : f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Price filter */}
          <div className="flex gap-1">
            {(["all", "free", "paid"] as const).map(p => (
              <button key={p} onClick={() => setFilters({ price: p })} className={`${pill(filters.price === p)} capitalize`}>
                {p}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={e => setFilters({ sort: e.target.value as SortBy })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/30 ${
              dark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-700"
            }`}
          >
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="downloads">Most Downloaded</option>
          </select>
        </div>

        {/* Content grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(PAGE_SIZE)].map((_, i) => <SkeletonCard key={i} dark={dark} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-6
              ${dark ? "bg-gray-800" : "bg-gray-100"}`}>
              {filters.search ? "🔍" : "📦"}
            </div>
            <p className={`text-lg font-bold mb-2 ${dark ? "text-white" : "text-gray-900"}`}>
              {filters.search ? `No results for "${filters.search}"` : "Nothing here yet"}
            </p>
            <p className={`text-sm mb-6 ${dark ? "text-gray-500" : "text-gray-400"}`}>
              {filters.search ? "Try a different search or clear the filter" : "Be the first to upload something great"}
            </p>
            {!filters.search && (
              <Link href="/upload">
                <button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all active:translate-y-[1px]">
                  Upload a model
                </button>
              </Link>
            )}
            {filters.search && (
              <button
                onClick={() => setFilters({ search: "" })}
                className={`px-6 py-3 rounded-xl text-sm font-bold border transition-all ${
                  dark ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-700 border-gray-200"
                }`}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
            >
              {displayed.map((model, i) => (
                <motion.div key={model.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.28) }}>
                  <ModelCardLive model={model} auraMode={dark} />
                </motion.div>
              ))}
              {loadingMore && [...Array(4)].map((_, i) => <SkeletonCard key={`sk${i}`} dark={dark} />)}
            </motion.div>

            {/* Load more */}
            {hasMore && !loadingMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => fetchModels(true)}
                  className={`px-8 py-3 rounded-xl text-sm font-bold border-b-[3px] transition-all active:translate-y-[1px] ${
                    dark
                      ? "bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}>
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <GalleryContent />
    </Suspense>
  );
}