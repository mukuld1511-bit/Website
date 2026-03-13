"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import DeveloperCard from "../components/DeveloperCard";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 relative pt-28 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">

        <div className="relative z-10 max-w-4xl mx-auto">

          {/* ── HEADER ── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-14 text-center md:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 mb-6 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-blue-700 text-xs font-bold uppercase tracking-widest">
                Mentorship · Collaboration · Growth
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight mb-5">
              Connect &{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Learn
              </span>
            </h1>

            <p className="text-gray-600 text-lg md:text-xl max-w-2xl leading-relaxed font-medium mx-auto md:mx-0">
              Explore SYNTHÉ developers. Connect for mentorship,
              collaboration or guidance in immersive technologies.
            </p>

            {/* Stats row */}
            {!loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex items-center justify-center md:justify-start gap-4 mt-8 flex-wrap"
              >
                {[
                  { val: developers.length, label: "Developers", colorClass: "text-blue-600" },
                  { val: certifiedCount, label: "Synthé Certified", colorClass: "text-yellow-600" },
                  { val: developers.length - certifiedCount, label: "Community Members", colorClass: "text-indigo-600" },
                ].map((s, i) => (
                  <div key={i}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm"
                  >
                    <span className={`text-xl font-black ${s.colorClass}`}>{s.val}</span>
                    <span className="text-gray-600 text-xs font-bold">{s.label}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* ── SEARCH + FILTER ── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10 flex flex-col gap-5 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm"
          >
            {/* Search input */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name or skill — Unity, AR, Blender, WebXR..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-base font-medium rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-inner transition duration-200"
              />
              {/* Clear button */}
              <AnimatePresence>
                {search && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition duration-200"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Filter pills */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 scrollbar-hide">
                {[
                  { val: "all", label: "All Developers" },
                  { val: "certified", label: "⭐ Certified Only" },
                ].map((f) => (
                  <button
                    key={f.val}
                    onClick={() => setFilter(f.val as any)}
                    className={`px-5 py-2.5 text-sm font-bold rounded-xl border shadow-sm whitespace-nowrap transition duration-200 ${
                      filter === f.val
                        ? f.val === "certified"
                          ? "border-yellow-300 bg-yellow-50 text-yellow-800"
                          : "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Results count */}
              {!loading && (
                <span className="text-gray-500 font-semibold text-sm whitespace-nowrap">
                  <span className="text-gray-900 font-black">{sorted.length}</span>{" "}
                  developer{sorted.length !== 1 ? "s" : ""}
                  {search && (
                    <> found</>
                  )}
                </span>
              )}
            </div>
          </motion.div>

          {/* ── LOADING SKELETONS ── */}
          {loading && (
            <div className="flex flex-col gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i}
                  className="rounded-3xl p-6 flex items-center gap-6 animate-pulse border border-gray-200 bg-white shadow-sm"
                >
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="h-4 bg-gray-100 rounded-full w-1/3" />
                    <div className="h-3 bg-gray-50 rounded-full w-1/2" />
                    <div className="h-3 bg-gray-50 rounded-full w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── DEVELOPER LIST ── */}
          {!loading && sorted.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col gap-6"
            >
              {/* Certified section divider */}
              {sorted.some((d) => d.certified) && filter === "all" && (
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-yellow-700 flex items-center gap-1.5 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-200 shadow-sm">
                    ⭐ Synthé Certified
                  </span>
                  <div className="flex-1 h-[1px] bg-gray-200" />
                </div>
              )}

              {sorted.map((dev, i) => {
                const showUncertifiedLabel =
                  filter === "all" && i > 0 && !dev.certified && sorted[i - 1]?.certified;
                return (
                  <div key={dev.id}>
                    {showUncertifiedLabel && (
                      <div className="flex items-center gap-4 my-8">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                          Community Developers
                        </span>
                        <div className="flex-1 h-[1px] bg-gray-200" />
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
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
              className="flex flex-col items-center justify-center py-24 gap-5 rounded-3xl border border-gray-200 bg-white shadow-sm mt-6"
            >
              <div className="w-20 h-20 rounded-3xl border border-gray-200 bg-gray-50 shadow-sm flex items-center justify-center">
                <svg className="w-9 h-9 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-gray-900 font-extrabold text-xl mb-1">No developers found</p>
                <p className="text-gray-500 text-sm font-medium">
                  {filter === "certified"
                    ? "No certified developers match your search"
                    : "Try a different name or skill"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="px-6 py-3 text-sm font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 shadow-sm text-gray-700 transition duration-200"
                  >
                    Clear search
                  </button>
                )}
                {filter !== "all" && (
                  <button
                    onClick={() => setFilter("all")}
                    className="px-6 py-3 text-sm font-bold text-blue-700 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 shadow-sm transition duration-200"
                  >
                    Show all
                  </button>
                )}
              </div>
            </motion.div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}