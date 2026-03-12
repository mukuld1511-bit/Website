"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import DeveloperCard from "../components/DeveloperCard";
import { motion, AnimatePresence } from "framer-motion";

export default function Learn() {
  const [developers, setDevelopers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "certified">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDevelopers = async () => {
      const snapshot = await getDocs(collection(db, "developers"));
      const list: any[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setDevelopers(list);
      setLoading(false);
    };
    loadDevelopers();
  }, []);

  const filtered = developers.filter((dev) => {
    const matchSearch =
      dev.skills?.toLowerCase().includes(search.toLowerCase()) ||
      dev.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "certified" && dev.certified);
    return matchSearch && matchFilter;
  });

  const sorted = [...filtered].sort((a, b) =>
    (b.certified ? 1 : 0) - (a.certified ? 1 : 0)
  );

  const certifiedCount = developers.filter((d) => d.certified).length;

  return (
    <main className="min-h-screen bg-[#050008] px-4 sm:px-6 lg:px-8 py-28 relative overflow-hidden">

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)", filter: "blur(100px)" }} />
      <div className="absolute top-1/3 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(219,39,119,0.06) 0%, transparent 70%)", filter: "blur(80px)" }} />

      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.018] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(167,139,250,1) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm mb-7"
          >
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-300/90 text-sm font-semibold uppercase tracking-widest">
              Mentorship · Collaboration · Growth
            </span>
          </motion.div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-none mb-5">
            Connect &{" "}
            <span style={{
              backgroundImage: "linear-gradient(90deg, #a78bfa, #22d3ee, #f472b6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              Learn
            </span>
          </h1>

          <p className="text-white/40 text-xl max-w-xl leading-relaxed font-light">
            Explore SYNTHÉ developers. Connect for mentorship,
            collaboration or guidance in immersive technologies.
          </p>

          <div className="flex items-center gap-2 mt-6">
            <div className="w-10 h-[2px] bg-violet-500/30 rounded-full" />
            <div className="w-28 h-[2px] rounded-full"
              style={{ background: "linear-gradient(90deg, #a78bfa, #22d3ee)" }} />
            <div className="w-10 h-[2px] bg-cyan-500/30 rounded-full" />
          </div>

          {/* Stats row */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex items-center gap-4 mt-8 flex-wrap"
            >
              {[
                { val: developers.length, label: "Developers", color: "#a78bfa" },
                { val: certifiedCount, label: "Synthé Certified", color: "#fbbf24" },
                { val: developers.length - certifiedCount, label: "Community Members", color: "#22d3ee" },
              ].map((s, i) => (
                <div key={i}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/6 bg-white/[0.025]"
                >
                  <span className="text-xl font-black" style={{ color: s.color }}>{s.val}</span>
                  <span className="text-white/35 text-xs font-medium">{s.label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* ── SEARCH + FILTER ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-8 flex flex-col gap-4"
        >
          {/* Search input */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-violet-400 transition duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name or skill — Unity, AR, Blender, WebXR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/8 text-white placeholder-white/25 text-sm rounded-2xl pl-10 pr-4 py-4 focus:outline-none focus:border-violet-500/50 focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition duration-200"
            />
            {/* Clear button */}
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition duration-200"
                >
                  <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { val: "all", label: "All Developers" },
              { val: "certified", label: "⭐ Certified Only" },
            ].map((f) => (
              <button
                key={f.val}
                onClick={() => setFilter(f.val as any)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl border transition duration-200 ${
                  filter === f.val
                    ? f.val === "certified"
                      ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-300"
                      : "border-violet-400/40 bg-violet-500/10 text-violet-300"
                    : "border-white/8 bg-white/[0.02] text-white/40 hover:text-white/65 hover:border-white/15"
                }`}
              >
                {f.label}
              </button>
            ))}

            {/* Results count */}
            {!loading && (
              <span className="text-white/25 text-xs ml-auto">
                <span className="text-white/50 font-semibold">{sorted.length}</span>{" "}
                developer{sorted.length !== 1 ? "s" : ""}
                {search && (
                  <> for <span style={{ color: "#a78bfa" }}>"{search}"</span></>
                )}
              </span>
            )}
          </div>
        </motion.div>

        {/* ── LOADING SKELETONS ── */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i}
                className="rounded-2xl p-5 flex items-center gap-5 animate-pulse border border-white/5 bg-white/[0.02]"
              >
                <div className="w-14 h-14 rounded-full bg-white/[0.05] flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2.5">
                  <div className="h-3 bg-white/[0.06] rounded-full w-1/3" />
                  <div className="h-2.5 bg-white/[0.04] rounded-full w-1/2" />
                  <div className="h-2 bg-white/[0.03] rounded-full w-1/4" />
                </div>
                <div className="w-6 h-6 rounded-full bg-white/[0.04] flex-shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* ── DEVELOPER LIST ── */}
        {!loading && sorted.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col gap-3"
          >
            {/* Certified section divider */}
            {sorted.some((d) => d.certified) && filter === "all" && (
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400/70 flex items-center gap-1.5">
                  ⭐ Synthé Certified
                </span>
                <div className="flex-1 h-[1px]"
                  style={{ background: "linear-gradient(90deg, rgba(251,191,36,0.2), transparent)" }} />
              </div>
            )}

            {sorted.map((dev, i) => {
              const showUncertifiedLabel =
                filter === "all" && i > 0 && !dev.certified && sorted[i - 1]?.certified;
              return (
                <div key={dev.id}>
                  {showUncertifiedLabel && (
                    <div className="flex items-center gap-3 my-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                        Community Developers
                      </span>
                      <div className="flex-1 h-[1px] bg-white/6" />
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                  >
                    <DeveloperCard dev={dev} />
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading && sorted.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-32 gap-5"
          >
            <div className="w-20 h-20 rounded-3xl border border-white/8 bg-white/[0.025] flex items-center justify-center">
              <svg className="w-9 h-9 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white/50 font-bold text-lg mb-1">No developers found</p>
              <p className="text-white/25 text-sm">
                {filter === "certified"
                  ? "No certified developers match your search"
                  : "Try a different name or skill"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 transition duration-200"
                  style={{ color: "#a78bfa" }}
                >
                  Clear search
                </button>
              )}
              {filter !== "all" && (
                <button
                  onClick={() => setFilter("all")}
                  className="px-5 py-2.5 text-sm font-semibold text-white/50 rounded-xl border border-white/8 bg-white/[0.02] hover:border-white/15 hover:text-white/70 transition duration-200"
                >
                  Show all
                </button>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </main>
  );
}