"use client";

import { useEffect, useState } from "react";
import {
  collection, getDocs, addDoc, serverTimestamp,
  query, where, orderBy, doc, getDoc,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import DeveloperCard from "../components/DeveloperCard";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Workshop {
  id: string;
  title: string;
  instructor: string;
  instructorRole: string;
  date: string;          // ISO date string e.g. "2026-03-22"
  time: string;          // display string e.g. "4:00 PM IST"
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  seats: number;
  registered: number;    // count of registrations stored in Firestore
  tags: string[];
  color: string;         // e.g. "blue"
  emoji: string;
  desc: string;
  meetLink?: string;     // optional Google Meet / Zoom link
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; pill: string }> = {
  blue:    { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    pill: "bg-blue-100 text-blue-700" },
  orange:  { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200",  pill: "bg-orange-100 text-orange-700" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", pill: "bg-emerald-100 text-emerald-700" },
  amber:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   pill: "bg-amber-100 text-amber-700" },
  purple:  { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200",  pill: "bg-purple-100 text-purple-700" },
  pink:    { bg: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200",    pill: "bg-pink-100 text-pink-700" },
  green:   { bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200",   pill: "bg-green-100 text-green-700" },
  violet:  { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200",  pill: "bg-violet-100 text-violet-700" },
};

const LEVEL_COLORS: Record<string, string> = {
  Beginner:     "bg-green-100 text-green-700",
  Intermediate: "bg-blue-100 text-blue-700",
  Advanced:     "bg-red-100 text-red-700",
};

export default function Learn() {
  const [user, setUser] = useState<any>(null);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "certified">("all");
  const [loading, setLoading] = useState(true);
  const [workshopsLoading, setWorkshopsLoading] = useState(true);
  const [tab, setTab] = useState<"workshops" | "mentors">("workshops");
  const [registering, setRegistering] = useState<string | null>(null);
  const [registered, setRegistered] = useState<string[]>([]);
  const [workshopFilter, setWorkshopFilter] = useState("All");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return () => unsub();
  }, []);

  // Fetch workshops from Firestore
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, "workshops"), orderBy("date", "asc")));
        setWorkshops(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Workshop)));
      } catch {
        // If index not ready, fetch without ordering
        const snap = await getDocs(collection(db, "workshops"));
        setWorkshops(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Workshop)));
      } finally {
        setWorkshopsLoading(false);
      }
    };
    load();
  }, []);

  // Fetch developers
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "developers"));
      setDevelopers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, []);

  // Load existing registrations for this user
  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, "workshopRegistrations"), where("userId", "==", user.uid)))
      .then((snap) => setRegistered(snap.docs.map((d) => d.data().workshopId)));
  }, [user]);

  const handleRegister = async (ws: Workshop) => {
    if (!user) return;
    if (registered.includes(ws.id)) return;
    const remaining = ws.seats - (ws.registered ?? 0);
    if (remaining <= 0) return;
    setRegistering(ws.id);
    try {
      await addDoc(collection(db, "workshopRegistrations"), {
        workshopId: ws.id,
        userId: user.uid,
        userName: user.displayName || user.email,
        userEmail: user.email,
        registeredAt: serverTimestamp(),
      });
      setRegistered((prev) => [...prev, ws.id]);
      // Optimistically update local count
      setWorkshops((prev) =>
        prev.map((w) => w.id === ws.id ? { ...w, registered: (w.registered ?? 0) + 1 } : w)
      );
    } finally {
      setRegistering(null);
    }
  };

  const filtered = developers.filter((dev) => {
    const matchSearch =
      dev.skills?.toLowerCase().includes(search.toLowerCase()) ||
      dev.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "certified" && dev.certified);
    return matchSearch && matchFilter;
  });
  const sorted = [...filtered].sort((a, b) => (b.certified ? 1 : 0) - (a.certified ? 1 : 0));
  const certifiedCount = developers.filter((d) => d.certified).length;

  // Compute filter tags from live workshop data
  const allTags = ["All", ...Array.from(new Set(workshops.flatMap((w) => w.tags ?? [])))];
  const visibleWorkshops = workshopFilter === "All"
    ? workshops
    : workshops.filter((w) => w.tags?.includes(workshopFilter));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex flex-col font-sans">
      <Navbar />

      <div className="fixed top-0 right-0 w-96 h-96 bg-blue-200/30 rounded-full filter blur-3xl opacity-40 pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-pink-200/30 rounded-full filter blur-3xl opacity-40 pointer-events-none z-0" />

      <main className="flex-1 relative z-10 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">

          {/* ── HEADER ── */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-indigo-700 text-xs font-black uppercase tracking-widest">Workshops · Mentorship · Growth</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 leading-tight mb-4">
              Learn & Connect
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto font-medium">
              Live workshops from the community, plus mentors to guide you in AR, VR, 3D and CAD.
            </p>
          </motion.div>

          {/* ── TAB SWITCHER ── */}
          <div className="flex items-center gap-2 mb-10 p-1.5 bg-white rounded-2xl border-2 border-indigo-50 shadow-sm w-fit mx-auto">
            {[
              { key: "workshops", label: "🗓️ Live Workshops" },
              { key: "mentors",   label: "👥 Find Mentors" },
            ].map((t) => (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                className={`px-6 py-3 rounded-xl font-black text-sm transition-all ${tab === t.key ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" : "text-gray-500 hover:text-gray-900"}`}>
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

          {/* ─────────── TAB: WORKSHOPS ─────────── */}
          {tab === "workshops" && (
            <motion.div key="workshops" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>

              {workshopsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-[2rem] border-2 border-gray-100 p-6 animate-pulse bg-white h-72">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 mb-4" />
                      <div className="h-5 bg-gray-100 rounded-full w-2/3 mb-3" />
                      <div className="h-3 bg-gray-50 rounded-full w-full mb-2" />
                      <div className="h-3 bg-gray-50 rounded-full w-4/5" />
                    </div>
                  ))}
                </div>
              ) : workshops.length === 0 ? (
                <div className="text-center py-24 flex flex-col items-center gap-4">
                  <div className="text-5xl">🗓️</div>
                  <p className="text-gray-900 font-black text-xl">No workshops yet</p>
                  <p className="text-gray-500 text-sm">Check back soon — the community is setting things up!</p>
                  <Link href="/asset-library">
                    <button className="mt-4 px-6 py-3 rounded-xl bg-indigo-600 text-white font-black shadow-md">Browse Unity Assets →</button>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Tag filter */}
                  <div className="flex flex-wrap gap-2 mb-8 justify-center">
                    {allTags.map((tag) => (
                      <button key={tag} onClick={() => setWorkshopFilter(tag)}
                        className={`px-4 py-2 rounded-full text-xs font-black border transition-all ${workshopFilter === tag ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
                        {tag}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {visibleWorkshops.map((ws, i) => {
                      const c = COLOR_MAP[ws.color] ?? COLOR_MAP.blue;
                      const regCount = ws.registered ?? 0;
                      const remaining = ws.seats - regCount;
                      const isFull = remaining <= 0;
                      const isReg = registered.includes(ws.id);
                      const pct = Math.min(100, Math.round((regCount / ws.seats) * 100));

                      return (
                        <motion.div key={ws.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                          className={`rounded-[2rem] border-2 ${c.border} bg-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] p-6 flex flex-col gap-4 hover:shadow-xl hover:-translate-y-1 transition-all`}>

                          <div className="flex items-start justify-between">
                            <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center text-2xl shadow-sm`}>{ws.emoji || "🎓"}</div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${LEVEL_COLORS[ws.level] ?? "bg-gray-100 text-gray-700"}`}>{ws.level}</span>
                              {isFull && <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">Full</span>}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-gray-900 font-black text-lg leading-tight mb-1">{ws.title}</h3>
                            <p className="text-gray-500 text-xs font-medium leading-relaxed">{ws.desc}</p>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {(ws.tags ?? []).map((t) => (
                              <span key={t} className={`text-[10px] font-black px-2 py-0.5 rounded-full ${c.pill}`}>{t}</span>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                              {ws.date ? new Date(ws.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "TBA"} · {ws.time}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                              {ws.duration}
                            </div>
                            <div className="flex items-center gap-1.5 col-span-2">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                              {ws.instructor}{ws.instructorRole ? ` — ${ws.instructorRole}` : ""}
                            </div>
                          </div>

                          {/* Seat progress */}
                          <div>
                            <div className="flex justify-between text-[10px] font-black text-gray-400 mb-1">
                              <span>{regCount} registered</span>
                              <span>{Math.max(0, remaining)} seats left</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${pct > 80 ? "bg-red-400" : pct > 50 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>

                          {/* CTA */}
                          {!user ? (
                            <Link href="/login">
                              <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                Sign in to Register
                              </button>
                            </Link>
                          ) : isReg ? (
                            <div className="w-full py-3 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 font-black text-sm text-center flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                              Registered!{ws.meetLink && <a href={ws.meetLink} target="_blank" rel="noreferrer" className="ml-2 text-indigo-600 underline">Join Link</a>}
                            </div>
                          ) : (
                            <button onClick={() => handleRegister(ws)} disabled={isFull || registering === ws.id}
                              className={`w-full py-3 rounded-2xl font-black text-sm transition-all ${isFull ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-0.5"}`}>
                              {registering === ws.id ? "Registering..." : isFull ? "Workshop Full" : "Register Free →"}
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ─────────── TAB: MENTORS ─────────── */}
          {tab === "mentors" && (
            <motion.div key="mentors" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              {!loading && (
                <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
                  {[
                    { val: developers.length, label: "Developers", colorClass: "text-blue-600" },
                    { val: certifiedCount, label: "Synthé Certified", colorClass: "text-yellow-600" },
                    { val: developers.length - certifiedCount, label: "Community", colorClass: "text-indigo-600" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm">
                      <span className={`text-xl font-black ${s.colorClass}`}>{s.val}</span>
                      <span className="text-gray-600 text-xs font-bold">{s.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-8 flex flex-col gap-4 bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  </div>
                  <input type="text" placeholder="Search by name or skill — Unity, AR, Blender..."
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-base font-medium rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-inner transition"/>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {[{ val: "all", label: "All Developers" }, { val: "certified", label: "⭐ Certified Only" }].map((f) => (
                    <button key={f.val} onClick={() => setFilter(f.val as any)}
                      className={`px-5 py-2.5 text-sm font-bold rounded-xl border shadow-sm whitespace-nowrap transition ${filter === f.val ? (f.val === "certified" ? "border-yellow-300 bg-yellow-50 text-yellow-800" : "border-blue-300 bg-blue-50 text-blue-700") : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {loading && (
                <div className="flex flex-col gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-3xl p-6 flex items-center gap-6 animate-pulse border border-gray-200 bg-white shadow-sm">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex-shrink-0"/>
                      <div className="flex-1 flex flex-col gap-3"><div className="h-4 bg-gray-100 rounded-full w-1/3"/><div className="h-3 bg-gray-50 rounded-full w-1/2"/></div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && sorted.length > 0 && (
                <div className="flex flex-col gap-5">
                  {sorted.some((d) => d.certified) && filter === "all" && (
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-200">⭐ Synthé Certified</span>
                      <div className="flex-1 h-[1px] bg-gray-200"/>
                    </div>
                  )}
                  {sorted.map((dev, i) => {
                    const showUnlabel = filter === "all" && i > 0 && !dev.certified && sorted[i - 1]?.certified;
                    return (
                      <div key={dev.id}>
                        {showUnlabel && (
                          <div className="flex items-center gap-4 my-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">Community Developers</span>
                            <div className="flex-1 h-[1px] bg-gray-200"/>
                          </div>
                        )}
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <DeveloperCard dev={dev}/>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && sorted.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-3xl border border-gray-200 bg-white shadow-sm">
                  <div className="text-4xl">🔍</div>
                  <p className="text-gray-900 font-black text-lg">No developers found</p>
                  <p className="text-gray-500 text-sm">{filter === "certified" ? "No certified developers match your search" : "Try a different name or skill"}</p>
                  {search && <button onClick={() => setSearch("")} className="px-6 py-3 text-sm font-bold rounded-xl border border-gray-200 bg-white text-gray-700">Clear search</button>}
                </div>
              )}
            </motion.div>
          )}

          </AnimatePresence>
        </div>
      </main>
      <Footer/>
    </div>
  );
}