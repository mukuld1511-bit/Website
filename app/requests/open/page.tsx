"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, getDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

interface ProjectRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  timeline: string;
  skills: string[];
  userId: string;
  userName: string;
  userPhoto: string;
  status: string;
  createdAt: Timestamp;
  fundedAmount?: number;
  paymentId?: string;
}

const BUDGET_COLORS: Record<string, string> = {
  "Flexible":       "#a78bfa",
  "Under $100":     "#34d399",
  "$100 - $500":    "#22d3ee",
  "$500 - $1000":   "#fb923c",
  "$1000+":         "#f472b6",
};

const CATEGORY_ICONS: Record<string, string> = {
  "3D Modeling":    "📦",
  "AR App":         "📱",
  "VR Experience":  "🥽",
  "WebXR":          "🌐",
  "Game Asset":     "🎮",
  "Other":          "✨",
};

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [filtered, setFiltered] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [initiatingChat, setInitiatingChat] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        // Fetch all (no compound filter to avoid index requirement) and filter client-side
        const q = query(collection(db, "projectRequests"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as ProjectRequest))
          .filter(r => r.status === "open" || r.status === undefined);
        setRequests(list);
        setFiltered(list);
      } catch (error) {
        console.error("Error loading requests:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    if (!q) { setFiltered(requests); return; }
    setFiltered(requests.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q) ||
      r.skills?.some(s => s.toLowerCase().includes(q))
    ));
  }, [search, requests]);

  const timeAgo = (date: Date) => {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 60)    return `${s}s ago`;
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  async function startChat(req: ProjectRequest) {
    if (!user) { router.push("/login"); return; }
    if (user.uid === req.userId) return; // Can't chat with yourself
    setInitiatingChat(req.id);
    try {
      // Check if a chat already exists for this pair
      const chatsRef = collection(db, "projectChats");
      const existingSnap = await getDocs(chatsRef);
      const existing = existingSnap.docs.find(d => {
        const data = d.data();
        return data.requestId === req.id && data.developerId === user.uid;
      });

      if (existing) {
        router.push(`/project-chat/${existing.id}`);
        return;
      }

      // Create new chat session
      const chatDoc = await addDoc(chatsRef, {
        requestId:     req.id,
        requestTitle:  req.title,
        clientId:      req.userId,
        clientName:    req.userName,
        clientPhoto:   req.userPhoto,
        developerId:   user.uid,
        developerName: user.displayName || "Developer",
        developerPhoto: user.photoURL || "/avatar.png",
        status:        "active",
        funded:        false,
        fundedAmount:  0,
        createdAt:     serverTimestamp(),
        lastMessage:   "",
        lastMessageAt: serverTimestamp(),
      });

      // System message
      await addDoc(collection(db, "projectChats", chatDoc.id, "messages"), {
        type:      "system",
        text:      `💼 ${user.displayName || "A developer"} is interested in "${req.title}"`,
        createdAt: serverTimestamp(),
      });

      router.push(`/project-chat/${chatDoc.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setInitiatingChat(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#050008] flex flex-col">
      <Navbar />

      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle,#a78bfa,transparent 65%)", filter: "blur(90px)" }} />
        <div className="absolute bottom-[15%] right-[2%] w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle,#34d399,transparent 65%)", filter: "blur(80px)" }} />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle,#f472b6,transparent 65%)", filter: "blur(120px)" }} />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: "linear-gradient(rgba(167,139,250,1) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="relative z-10 pt-28 pb-24 px-4 flex-grow">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="mb-16">
            <div className="flex flex-col lg:flex-row gap-8 justify-between items-start">
              <div>
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm mb-6">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-violet-300/90 text-xs font-black uppercase tracking-[0.2em]">Live Requests</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none mb-4">
                  Open{" "}
                  <span style={{ backgroundImage: "linear-gradient(90deg,#a78bfa,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    Projects
                  </span>
                </h1>
                <p className="text-white/40 text-lg max-w-lg leading-relaxed">
                  Browse client project requests and connect directly to start building. Chat, negotiate, and get paid.
                </p>
              </div>
              <div className="flex flex-col items-start lg:items-end gap-4">
                <Link href="/requests/post">
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm text-white"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)", boxShadow: "0 0 40px rgba(124,58,237,0.35)" }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Post a Request
                  </motion.button>
                </Link>
                <p className="text-white/25 text-xs font-semibold">{filtered.length} active {filtered.length === 1 ? "project" : "projects"}</p>
              </div>
            </div>

            {/* Search */}
            <div className="mt-10 relative max-w-xl">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title, skill, or category…"
                className="w-full bg-white/[0.04] border border-white/8 text-white placeholder-white/25 text-sm rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-violet-500/40 transition duration-200"
              />
            </div>
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-violet-500/20 border-t-violet-400 animate-spin" />
                <div className="absolute inset-2 rounded-full border-2 border-cyan-500/20 border-b-cyan-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
              </div>
              <p className="text-white/30 text-xs font-black tracking-[0.3em] uppercase">Loading Requests...</p>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-28 border border-white/6 rounded-3xl bg-white/[0.02] backdrop-blur-xl">
              <div className="w-20 h-20 rounded-3xl border border-white/8 bg-white/[0.04] flex items-center justify-center mx-auto mb-6">
                <svg className="w-9 h-9 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-white mb-3">No open requests</h3>
              <p className="text-white/35 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
                {search ? `No results for "${search}". Try a different keyword.` : "Check back later or be the first to post your project."}
              </p>
              <Link href="/requests/post">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="px-8 py-3.5 rounded-2xl text-white font-black text-sm"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)" }}>
                  Post a Project Request
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {filtered.map((req, i) => {
                  const paidColor = (req.status === "funded") ? "#34d399" : BUDGET_COLORS[req.budget] ?? "#a78bfa";
                  const icon = CATEGORY_ICONS[req.category] ?? "✨";
                  const isMine = user?.uid === req.userId;

                  return (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 32 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.45, delay: i * 0.06 }}
                      className="group relative rounded-3xl overflow-hidden flex flex-col"
                      style={{
                        background: "linear-gradient(160deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01))",
                        border: "1px solid rgba(255,255,255,0.07)",
                        backdropFilter: "blur(20px)",
                        boxShadow: "0 4px 40px rgba(0,0,0,0.4)",
                      }}
                    >
                      {/* Top shimmer */}
                      <div className="absolute top-0 left-0 right-0 h-[1px] transition-all duration-500"
                        style={{ background: `linear-gradient(90deg,transparent,${paidColor}55,transparent)` }} />
                      {/* Hover glow */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
                        style={{ boxShadow: `inset 0 0 60px ${paidColor}08` }} />

                      {req.status === "funded" && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Funded</span>
                        </div>
                      )}

                      <div className="p-6 flex flex-col flex-grow">
                        {/* Category + time */}
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-2xl">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
                              style={{ background: `${paidColor}15`, color: paidColor, border: `1px solid ${paidColor}30` }}>
                              {req.category || "Project"}
                            </span>
                          </div>
                          {req.createdAt && (
                            <span className="text-white/25 text-[10px] font-semibold flex-shrink-0">
                              {timeAgo(req.createdAt.toDate())}
                            </span>
                          )}
                        </div>

                        {/* Title + Desc */}
                        <h3 className="text-white font-black text-lg tracking-tight mb-2 line-clamp-2 group-hover:text-violet-200 transition duration-300">
                          {req.title}
                        </h3>
                        <p className="text-white/40 text-sm leading-relaxed line-clamp-3 flex-grow mb-5">
                          {req.description}
                        </p>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-2.5 mb-5">
                          <div className="p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <p className="text-white/25 text-[9px] font-black uppercase tracking-widest mb-1">Budget</p>
                            <p className="font-bold text-sm truncate" style={{ color: paidColor }}>
                              {req.budget || "Flexible"}
                            </p>
                          </div>
                          <div className="p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <p className="text-white/25 text-[9px] font-black uppercase tracking-widest mb-1">Timeline</p>
                            <p className="text-white font-bold text-sm truncate">{req.timeline || "Flexible"}</p>
                          </div>
                        </div>

                        {/* Skills */}
                        {req.skills && req.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-5">
                            {req.skills.slice(0, 4).map((skill, j) => (
                              <span key={j} className="text-[11px] text-white/45 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg font-semibold">
                                {skill}
                              </span>
                            ))}
                            {req.skills.length > 4 && (
                              <span className="text-[11px] text-white/30 bg-white/[0.02] border border-white/[0.04] px-2.5 py-1 rounded-lg font-semibold">
                                +{req.skills.length - 4}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="pt-4 border-t border-white/[0.06] flex items-center gap-3">
                          <img
                            src={req.userPhoto || "/avatar.png"}
                            onError={e => { (e.target as any).src = "/avatar.png"; }}
                            className="w-8 h-8 rounded-full flex-shrink-0 ring-1 ring-white/10 object-cover"
                            alt={req.userName}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white/90 text-xs font-bold truncate">{req.userName || "Anonymous"}</p>
                            <p className="text-white/30 text-[10px] font-semibold">Client</p>
                          </div>

                          {isMine ? (
                            <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                              Your Post
                            </span>
                          ) : user ? (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => startChat(req)}
                              disabled={initiatingChat === req.id}
                              className="flex items-center gap-1.5 px-4 py-2 text-white text-xs font-black rounded-xl transition duration-200 disabled:opacity-60 flex-shrink-0"
                              style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)", boxShadow: "0 0 20px rgba(124,58,237,0.25)" }}
                            >
                              {initiatingChat === req.id ? (
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              )}
                              {initiatingChat === req.id ? "Opening…" : "Chat"}
                            </motion.button>
                          ) : (
                            <Link href="/login">
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                                className="px-4 py-2 bg-white/8 hover:bg-white/15 text-white text-xs font-black rounded-xl transition duration-200 whitespace-nowrap border border-white/10">
                                Login to Chat
                              </motion.button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}
