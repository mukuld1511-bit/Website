"use client";

import { useEffect, useState } from "react";
import {
  collection, query, where, onSnapshot,
  updateDoc, doc, writeBatch, orderBy,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

interface Notification {
  id: string;
  userId: string;
  message: string;
  type: "purchase" | "access" | "bid" | "certification" | "system" | string;
  read: boolean;
  link?: string;
  createdAt: any;
}

function timeAgo(ts: any): string {
  if (!ts) return "";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const TYPE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  purchase: {
    color: "#34d399",
    label: "Purchase",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  },
  access: {
    color: "#fbbf24",
    label: "Access",
    icon: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z",
  },
  bid: {
    color: "#22d3ee",
    label: "Bid",
    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  certification: {
    color: "#fbbf24",
    label: "Certification",
    icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  },
  system: {
    color: "#a78bfa",
    label: "System",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.system;
}

type Filter = "all" | "unread" | "purchase" | "bid" | "access" | "certification";

export default function NotificationsPage() {
  const [user,    setUser]    = useState<any>(null);
  const [notes,   setNotes]   = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<Filter>("all");
  const [marking, setMarking] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  // Live Firestore listener
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  async function markAsRead(id: string) {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (e) { console.error(e); }
  }

  async function markAllRead() {
    const unread = notes.filter(n => !n.read);
    if (!unread.length) return;
    setMarking(true);
    try {
      const batch = writeBatch(db);
      unread.forEach(n => batch.update(doc(db, "notifications", n.id), { read: true }));
      await batch.commit();
    } catch (e) { console.error(e); }
    setMarking(false);
  }

  const FILTERS: { id: Filter; label: string }[] = [
    { id: "all",           label: "All" },
    { id: "unread",        label: "Unread" },
    { id: "purchase",      label: "Purchases" },
    { id: "bid",           label: "Bids" },
    { id: "access",        label: "Access" },
    { id: "certification", label: "Certification" },
  ];

  const filtered = notes.filter(n => {
    if (filter === "all")    return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const unreadCount = notes.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />

      <div className="relative pt-28 pb-24 px-4 overflow-x-hidden">

        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse,rgba(124,58,237,0.1) 0%,transparent 70%)", filter: "blur(80px)" }} />

        <div className="relative z-10 max-w-2xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-violet-300/80 text-[10px] font-semibold uppercase tracking-widest">Inbox</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                Notifications
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black text-white"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)" }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </motion.span>
                )}
              </h1>
            </div>

            {unreadCount > 0 && (
              <motion.button onClick={markAllRead} disabled={marking}
                whileHover={{ scale: marking ? 1 : 1.04 }} whileTap={{ scale: marking ? 1 : 0.97 }}
                style={{ willChange: "transform" }}
                className="px-4 py-2 rounded-xl border border-violet-500/25 bg-violet-500/8 text-violet-300 text-xs font-black hover:bg-violet-500/15 transition duration-200 disabled:opacity-50 flex items-center gap-2">
                {marking ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {marking ? "Marking…" : "Mark all read"}
              </motion.button>
            )}
          </motion.div>

          {/* Filter tabs */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-hide">
            {FILTERS.map(f => {
              const count = f.id === "unread"
                ? unreadCount
                : f.id === "all"
                ? notes.length
                : notes.filter(n => n.type === f.id).length;
              return (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition duration-200 border ${
                    filter === f.id
                      ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                      : "border-white/6 bg-white/[0.02] text-white/30 hover:text-white/60 hover:border-white/12"
                  }`}>
                  {f.label}
                  {count > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md text-[9px] font-black ${
                      filter === f.id ? "bg-violet-500/30 text-violet-200" : "bg-white/6 text-white/25"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>

          {/* Not logged in */}
          {!user && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl p-12 text-center">
              <div className="absolute top-0 left-0 right-0 h-[1px]"
                style={{ background: "linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.3),transparent)" }} />
              <div className="w-16 h-16 rounded-3xl border border-white/8 bg-white/[0.03] flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-white/60 font-black text-lg mb-2">Sign in to see notifications</h3>
              <p className="text-white/25 text-sm mb-6">Stay updated on purchases, bids, and access requests.</p>
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  style={{ willChange: "transform", background: "linear-gradient(135deg,#7c3aed,#0891b2)" }}
                  className="inline-flex px-7 py-3 rounded-2xl font-black text-white text-sm cursor-pointer relative overflow-hidden">
                  <motion.div animate={{ x: ["-200%", "200%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "linear" }}
                    style={{ willChange: "transform", position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform: "skewX(-20deg)", pointerEvents: "none" }} />
                  <span className="relative z-10">Sign In →</span>
                </motion.div>
              </Link>
            </motion.div>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && user && filtered.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl p-16 text-center">
              <div className="absolute top-0 left-0 right-0 h-[1px]"
                style={{ background: "linear-gradient(90deg,transparent,rgba(167,139,250,0.3),transparent)" }} />
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="absolute -inset-[1px] rounded-3xl opacity-30 blur-sm"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)" }} />
                <div className="relative w-16 h-16 rounded-3xl border border-white/8 bg-white/[0.03] flex items-center justify-center">
                  <svg className="w-7 h-7 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>
              <h3 className="text-white/50 font-black text-lg mb-2">
                {filter === "unread" ? "All caught up!" : "No notifications yet"}
              </h3>
              <p className="text-white/25 text-sm">
                {filter === "unread"
                  ? "You've read everything. Check back later."
                  : "Notifications for purchases, bids and access requests will appear here."}
              </p>
              {filter !== "all" && (
                <button onClick={() => setFilter("all")}
                  className="mt-5 text-violet-400/60 text-xs font-bold hover:text-violet-300 transition duration-150">
                  Show all notifications →
                </button>
              )}
            </motion.div>
          )}

          {/* Notification list */}
          {!loading && user && filtered.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
              className="space-y-2">
              <AnimatePresence initial={false}>
                {filtered.map((n, i) => {
                  const cfg = getTypeConfig(n.type);
                  return (
                    <motion.div key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20, scale: 0.97 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}>

                      <div
                        onClick={() => { if (!n.read) markAsRead(n.id); }}
                        className={`relative rounded-2xl border transition duration-200 cursor-pointer group overflow-hidden ${
                          n.read
                            ? "border-white/5 bg-white/[0.015] hover:border-white/10"
                            : "border-white/10 bg-white/[0.035] hover:border-violet-500/25"
                        }`}>

                        {/* Unread left accent bar */}
                        {!n.read && (
                          <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                            style={{ background: cfg.color }} />
                        )}

                        <div className="flex items-start gap-4 px-5 py-4 pl-6">

                          {/* Icon */}
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition duration-200"
                            style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}>
                            <svg className="w-4 h-4" style={{ color: cfg.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={cfg.icon} />
                            </svg>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border"
                                style={{ color: cfg.color, background: `${cfg.color}12`, borderColor: `${cfg.color}25` }}>
                                {cfg.label}
                              </span>
                              {!n.read && (
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                  style={{ background: cfg.color }} />
                              )}
                            </div>
                            <p className={`text-sm leading-snug mt-1 ${n.read ? "text-white/40" : "text-white/80"}`}>
                              {n.message}
                            </p>
                            <p className="text-white/20 text-[10px] mt-1.5">{timeAgo(n.createdAt)}</p>
                          </div>

                          {/* Read indicator / arrow */}
                          <div className="flex-shrink-0 self-center">
                            {n.link ? (
                              <Link href={n.link} onClick={e => e.stopPropagation()}>
                                <div className="w-7 h-7 rounded-lg border border-white/8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 hover:border-violet-500/30 hover:bg-violet-500/8">
                                  <svg className="w-3.5 h-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </div>
                              </Link>
                            ) : !n.read ? (
                              <div className="w-7 h-7 rounded-lg border border-white/6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 hover:border-emerald-500/30 hover:bg-emerald-500/8"
                                title="Mark as read">
                                <svg className="w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Count footer */}
              <p className="text-center text-white/15 text-xs pt-4 pb-2">
                Showing {filtered.length} of {notes.length} notifications
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}