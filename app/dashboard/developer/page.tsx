"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import {
  collection, getDocs, query, where, updateDoc, doc
} from "firebase/firestore";
import { motion } from "framer-motion";

export default function DeveloperDashboard() {

  const [requests, setRequests] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [userId, setUserId] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    setUserId(user.uid);
    loadRequests(user.uid);
    loadProjects(user.uid);
    loadReviews(user.uid);
    loadAccessRequests(user.uid);
  }, []);

  const loadRequests = async (uid: string) => {
    const q = query(collection(db, "tutorialRequests"), where("developerId", "==", uid));
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
    setRequests(list);
  };

  const loadProjects = async (uid: string) => {
    const q = query(collection(db, "projects"), where("developerId", "==", uid));
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
    setProjects(list);
  };

  const loadReviews = async (uid: string) => {
    const q = query(collection(db, "reviews"), where("developerId", "==", uid));
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach((doc) => list.push(doc.data()));
    setReviews(list);
  };

  const loadAccessRequests = async (uid: string) => {
    const q = query(collection(db, "accessRequests"), where("developerId", "==", uid));
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    // Sort: pending first
    list.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return 0;
    });
    setAccessRequests(list);
  };

  const acceptRequest = async (id: string) => {
    await updateDoc(doc(db, "tutorialRequests", id), { status: "accepted" });
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "accepted" } : r));
  };

  const rejectRequest = async (id: string) => {
    await updateDoc(doc(db, "tutorialRequests", id), { status: "rejected" });
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "rejected" } : r));
  };

  const handleAccessDecision = async (id: string, decision: "approved" | "denied", req: any) => {
    setUpdating(id);
    await updateDoc(doc(db, "accessRequests", id), { status: decision });
    // Notify the user
    await import("firebase/firestore").then(({ addDoc }) =>
      addDoc(collection(db, "notifications"), {
        userId: req.userId,
        message: decision === "approved"
          ? `Your access request for "${req.projectTitle}" was approved! You can now download it.`
          : `Your access request for "${req.projectTitle}" was denied.`,
        type: "accessDecision",
        createdAt: new Date(),
        read: false,
      })
    );
    setAccessRequests((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: decision } : r)
    );
    setUpdating(null);
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : "—";

  const pendingAccess = accessRequests.filter((r) => r.status === "pending").length;

  const inputClass = "w-full bg-white/[0.03] border border-white/8 text-white placeholder-white/20 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-violet-500/50 transition duration-200";

  const statusBadge = (s: string) => {
    if (s === "pending") return "text-amber-300 bg-amber-400/10 border-amber-400/20";
    if (s === "accepted" || s === "approved") return "text-emerald-300 bg-emerald-400/10 border-emerald-400/20";
    return "text-rose-300 bg-rose-500/10 border-rose-500/20";
  };

  return (
    <main className="min-h-screen bg-[#050008] px-4 sm:px-6 lg:px-8 py-28 relative overflow-hidden">

      {/* Ambient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)", filter: "blur(80px)" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-10"
        >
          <p className="text-violet-400/70 text-xs uppercase tracking-[0.3em] font-semibold mb-2">Developer Portal</p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white leading-none mb-3">
            Your{" "}
            <span style={{ backgroundImage: "linear-gradient(90deg, #a78bfa, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Dashboard
            </span>
          </h1>
        </motion.div>

        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10"
        >
          {[
            { label: "Projects", val: projects.length, color: "#a78bfa" },
            { label: "Tutorial Requests", val: requests.length, color: "#22d3ee" },
            { label: "Reviews", val: reviews.length, color: "#fbbf24" },
            { label: "Avg Rating", val: avgRating, color: "#fb7185" },
            {
              label: "Access Requests",
              val: pendingAccess > 0 ? `${pendingAccess} pending` : accessRequests.length,
              color: pendingAccess > 0 ? "#f59e0b" : "#a78bfa",
              highlight: pendingAccess > 0,
            },
          ].map((s, i) => (
            <div
              key={i}
              className={`rounded-2xl p-5 border transition duration-200 ${s.highlight ? "border-amber-400/30 bg-amber-400/5" : "border-white/6 bg-white/[0.025]"}`}
            >
              <p className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.val}</p>
              <p className="text-white/35 text-xs font-medium">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── ACCESS REQUESTS ── */}
        <DashSection title="Access Requests" subtitle="Approve or deny download access to your projects" delay={0.15} accent="#f59e0b">
          {accessRequests.length === 0 ? (
            <Empty icon="🔐" text="No access requests yet." />
          ) : (
            <div className="flex flex-col gap-3">
              {accessRequests.map((req) => (
                <div
                  key={req.id}
                  className={`relative rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition duration-200 ${
                    req.status === "pending" ? "border-amber-400/20 bg-amber-400/[0.03]" : "border-white/6 bg-white/[0.02]"
                  }`}
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white font-bold text-sm truncate">{req.userEmail}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusBadge(req.status)}`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs">
                      Requested access to{" "}
                      <span className="text-violet-300 font-semibold">"{req.projectTitle}"</span>
                    </p>
                    {req.createdAt?.toDate && (
                      <p className="text-white/20 text-xs mt-0.5">
                        {req.createdAt.toDate().toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {req.status === "pending" && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAccessDecision(req.id, "approved", req)}
                        disabled={updating === req.id}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white rounded-xl transition duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
                      >
                        {updating === req.id ? (
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAccessDecision(req.id, "denied", req)}
                        disabled={updating === req.id}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-rose-300 rounded-xl border border-rose-500/25 bg-rose-500/8 hover:bg-rose-500/15 transition duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Deny
                      </button>
                    </div>
                  )}

                  {/* Already decided */}
                  {req.status !== "pending" && (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${statusBadge(req.status)}`}>
                      {req.status === "approved" ? "✓ Approved" : "✕ Denied"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </DashSection>

        {/* ── TUTORIAL REQUESTS ── */}
        <DashSection title="Tutorial Requests" subtitle="Incoming mentorship and learning requests" delay={0.2} accent="#22d3ee">
          {requests.length === 0 ? (
            <Empty icon="📚" text="No tutorial requests yet." />
          ) : (
            <div className="flex flex-col gap-3">
              {requests.map((r) => (
                <div key={r.id} className="rounded-2xl border border-white/6 bg-white/[0.02] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white font-bold text-sm">{r.topic}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs">Level: {r.level}</p>
                    {r.message && <p className="text-white/30 text-xs mt-1 line-clamp-1">{r.message}</p>}
                  </div>
                  {r.status === "pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => acceptRequest(r.id)}
                        className="px-4 py-2 text-xs font-black text-white rounded-xl transition hover:scale-[1.02]"
                        style={{ background: "linear-gradient(135deg, #059669, #0891b2)" }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => rejectRequest(r.id)}
                        className="px-4 py-2 text-xs font-black text-rose-300 rounded-xl border border-rose-500/25 bg-rose-500/8 hover:bg-rose-500/15 transition hover:scale-[1.02]"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DashSection>

        {/* ── PROJECTS ── */}
        <DashSection title="My Projects" subtitle="All your uploaded immersive work" delay={0.25} accent="#a78bfa">
          {projects.length === 0 ? (
            <Empty icon="🚀" text="No projects uploaded yet." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {projects.map((p) => (
                <div key={p.id} className="group bg-white/[0.025] border border-white/6 rounded-2xl p-5 hover:border-violet-500/25 transition duration-200">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-sm truncate">{p.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                          p.accessType === "free"
                            ? "text-emerald-300 bg-emerald-400/10 border-emerald-400/20"
                            : "text-amber-300 bg-amber-400/10 border-amber-400/20"
                        }`}>
                          {p.accessType === "free" ? "🔓 Free" : "🔐 Request"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-white/35 text-xs line-clamp-2">{p.shortDescription}</p>
                </div>
              ))}
            </div>
          )}
        </DashSection>

        {/* ── REVIEWS ── */}
        <DashSection title="Reviews" subtitle="Feedback from your learners and collaborators" delay={0.3} accent="#fbbf24">
          {reviews.length === 0 ? (
            <Empty icon="⭐" text="No reviews yet." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {reviews.map((r, i) => (
                <div key={i} className="bg-white/[0.025] border border-white/6 rounded-2xl p-5">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className={`w-4 h-4 ${j < r.rating ? "text-amber-400" : "text-white/10"}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    ))}
                    <span className="text-white/30 text-xs ml-1">{r.rating}/5</span>
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </DashSection>

      </div>
    </main>
  );
}

function DashSection({ title, subtitle, delay, children, accent = "#a78bfa" }: {
  title: string; subtitle: string; delay: number; children: React.ReactNode; accent?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="mb-10"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1.5 h-7 rounded-full" style={{ background: `linear-gradient(to bottom, ${accent}, ${accent}88)` }} />
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
          <p className="text-white/30 text-xs mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="w-full py-10 text-center border border-white/5 rounded-2xl bg-white/[0.01] flex flex-col items-center gap-3">
      <span className="text-3xl">{text.startsWith("No") ? icon : "📭"}</span>
      <p className="text-white/25 text-sm">{text}</p>
    </div>
  );
}