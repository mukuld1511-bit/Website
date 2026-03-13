"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { motion } from "framer-motion";

const PLATFORM_FEE = 0.15;

type FirestoreDoc = {
  id: string;
  createdAt?: Timestamp;
  [key: string]: any;
};

export default function DeveloperDashboard() {
  const router = useRouter();

  const [uploads, setUploads]           = useState<FirestoreDoc[]>([]);
  const [sessions, setSessions]         = useState<FirestoreDoc[]>([]);
  const [purchases, setPurchases]       = useState<FirestoreDoc[]>([]);
  const [projectChats, setProjectChats] = useState<FirestoreDoc[]>([]);
  const [certStatus, setCertStatus]     = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) { router.push("/login"); return; }
      loadAll(user.uid);
    });
    return () => unsub();
  }, []);

  const loadAll = async (uid: string) => {
    await Promise.all([
      loadUploads(uid),
      loadSessions(uid),
      loadPurchases(uid),
      loadCert(uid),
      loadProjectChats(uid),
    ]);
    setLoading(false);
  };

  const loadProjectChats = async (uid: string) => {
    const q = query(collection(db, "projectChats"), where("developerId", "==", uid));
    const snap = await getDocs(q);
    const list: FirestoreDoc[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreDoc));
    list.sort((a, b) => (b.lastMessageAt?.seconds ?? 0) - (a.lastMessageAt?.seconds ?? 0));
    setProjectChats(list);
  };

  const loadUploads = async (uid: string) => {
    const q = query(collection(db, "models"), where("authorId", "==", uid));
    const snap = await getDocs(q);
    setUploads(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreDoc)));
  };


  const loadSessions = async (uid: string) => {
    const q = query(collection(db, "chatSessions"), where("tutorUserId", "==", uid));
    const snap = await getDocs(q);
    const list: FirestoreDoc[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreDoc));
    list.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    setSessions(list);
  };

  const loadPurchases = async (uid: string) => {
    const q = query(collection(db, "purchases"), where("authorId", "==", uid));
    const snap = await getDocs(q);
    setPurchases(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreDoc)));
  };

  const loadCert = async (uid: string) => {
    const q = query(collection(db, "certificationRequests"), where("userId", "==", uid));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      setCertStatus(data.status ?? "pending");
    }
  };

  const grossRevenue = purchases.reduce((s, p) => s + (p.amount ?? 0), 0);
  const netEarnings  = purchases.reduce((s, p) => {
    const gross = p.amount ?? 0;
    return s + gross * (1 - PLATFORM_FEE);

  }, 0);

  const activeSessions = sessions.filter((s) => s.status === "active").length;

  const statusBadge = (s: string) => {
    if (s === "pending") return "text-amber-300 bg-amber-400/10 border-amber-400/20";
    if (s === "accepted" || s === "approved" || s === "active" || s === "in_progress")
      return "text-emerald-300 bg-emerald-400/10 border-emerald-400/20";
    return "text-rose-300 bg-rose-500/10 border-rose-500/20";
  };

  const certBadge = () => {
    if (!certStatus)                return { label: "Not Applied",      color: "text-white/30 bg-white/5 border-white/10" };
    if (certStatus === "approved")  return { label: "✓ Certified",      color: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20" };
    if (certStatus === "pending")   return { label: "⏳ Pending Review", color: "text-amber-300 bg-amber-400/10 border-amber-400/20" };
    return { label: "✕ Rejected", color: "text-rose-300 bg-rose-500/10 border-rose-500/20" };
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050008] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
          <p className="text-white/30 text-sm">Loading your dashboard…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050008] px-4 sm:px-6 lg:px-8 py-28 relative overflow-hidden">

      {/* Ambient glow */}
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
            <span style={{ backgroundImage: "linear-gradient(90deg,#a78bfa,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Dashboard
            </span>
          </h1>
          <p className="text-white/30 text-sm">Track your uploads, earnings, bids, and connect sessions.</p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
          {[
            { label: "Uploads",          val: uploads.length,               color: "#a78bfa" },
            { label: "Net Earnings",     val: `₹${netEarnings.toFixed(0)}`, color: "#34d399" },
            { label: "Connect Sessions", val: activeSessions,               color: "#22d3ee", highlight: activeSessions > 0 },
          ].map((s, i) => (
            <div
              key={i}
              className={`rounded-2xl p-5 border transition duration-200 ${
                s.highlight ? "border-amber-400/30 bg-amber-400/[0.04]" : "border-white/6 bg-white/[0.025]"
              }`}
            >
              <p className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.val}</p>
              <p className="text-white/35 text-xs font-medium">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10"
        >
          {[
            { label: "Upload Model",    icon: "⬆", href: "/upload",        gradient: "linear-gradient(135deg,#7c3aed,#0891b2)" },
            { label: "Public Requests", icon: "📋", href: "/requests/open", cascade: "linear-gradient(135deg,#0891b2,#0369a1)" },
            { label: "Connect Page",    icon: "🔗", href: "/connect",       gradient: "linear-gradient(135deg,#0891b2,#22d3ee88)" },
            { label: "Get Certified",   icon: "🎓", href: "/certification", gradient: "linear-gradient(135deg,#d97706,#f59e0b)" },
          ].map((q, i) => (
            <motion.button
              key={i}
              onClick={() => router.push(q.href)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{ willChange: "transform", background: q.gradient }}
              className="relative overflow-hidden rounded-2xl px-4 py-3.5 text-sm font-black text-white text-left flex items-center gap-2.5"
            >
              <span className="text-base">{q.icon}</span>
              {q.label}
              <motion.div
                animate={{ x: ["-200%", "200%"] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "linear" }}
                style={{ willChange: "transform", position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform: "skewX(-20deg)", pointerEvents: "none" }}
              />
            </motion.button>
          ))}
        </motion.div>

        {/* Earnings Summary */}
        <DashSection title="Earnings Summary" subtitle="Revenue from model purchases (after platform & payment fees)" delay={0.16} accent="#34d399">
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            {[
              { label: "Gross Revenue",      val: `₹${grossRevenue.toFixed(2)}`,                   sub: "Total paid by buyers",  color: "#22d3ee" },
              { label: "Platform Fee (15%)", val: `−₹${(grossRevenue * PLATFORM_FEE).toFixed(2)}`, sub: "Synthe commission",     color: "#fb7185" },
              { label: "Net Earnings",       val: `₹${netEarnings.toFixed(2)}`,                    sub: "You receive",           color: "#34d399" },
            ].map((e, i) => (
              <div key={i} className="rounded-2xl border border-white/6 bg-white/[0.025] p-5">
                <p className="text-2xl font-black mb-1" style={{ color: e.color }}>{e.val}</p>
                <p className="text-white font-semibold text-sm">{e.label}</p>
                <p className="text-white/30 text-xs mt-0.5">{e.sub}</p>
              </div>
            ))}
          </div>
          {purchases.length === 0 && <Empty icon="💰" text="No purchases yet. Share your models to start earning!" />}
        </DashSection>

        {/* My Uploads */}
        <DashSection title="My Uploads" subtitle="Models you've published to the gallery" delay={0.2} accent="#a78bfa">
          {uploads.length === 0 ? (
            <Empty icon="🚀" text="No models uploaded yet." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {uploads.map((m) => (
                <div
                  key={m.id}
                  onClick={() => router.push(`/gallery/${m.id}`)}
                  className="group cursor-pointer bg-white/[0.025] border border-white/6 rounded-2xl p-5 hover:border-violet-500/25 transition duration-200"
                >
                  <div className="flex items-start gap-3">
                    {m.thumbnailUrl ? (
                      <img src={m.thumbnailUrl} alt={m.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)" }}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-sm truncate group-hover:text-violet-300 transition">{m.title}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border text-violet-300 bg-violet-400/10 border-violet-400/20">
                          {m.category ?? "3D"}
                        </span>
                        {m.price > 0
                          ? <span className="text-[9px] font-black px-2 py-0.5 rounded-full border text-amber-300 bg-amber-400/10 border-amber-400/20">₹{m.price}</span>
                          : <span className="text-[9px] font-black px-2 py-0.5 rounded-full border text-emerald-300 bg-emerald-400/10 border-emerald-400/20">Free</span>
                        }
                      </div>
                      <p className="text-white/30 text-xs mt-1.5 line-clamp-1">{m.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashSection>

        {/* Connect Sessions -> Project Requests */}
        <DashSection title="My Project Requests" subtitle="Incoming project requests assigned directly to you" delay={0.28} accent="#22d3ee">
          {sessions.length === 0 ? (
            <Empty icon="📋" text="No project requests received yet." />
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => router.push(`/connect/${s.id}`)}
                  className="group cursor-pointer rounded-2xl border border-white/6 bg-white/[0.02] hover:border-cyan-500/25 p-5 flex items-center gap-4 transition duration-200"
                >
                  {s.studentAvatar
                    ? <img src={s.studentAvatar} alt={s.studentName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black text-white"
                        style={{ background: "linear-gradient(135deg,#0891b2,#7c3aed)" }}>
                        {s.studentName?.[0]?.toUpperCase() ?? "S"}
                      </div>
                    )
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-white font-bold text-sm">{s.studentName}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs truncate">Subject: {s.subject}</p>
                  </div>
                  <svg className="w-4 h-4 text-white/20 group-hover:text-cyan-400 flex-shrink-0 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </DashSection>

        {/* Project Messages */}
        <DashSection title="Project Messages" subtitle="Active chats from public project requests" delay={0.3} accent="#f472b6">
          {projectChats.length === 0 ? (
            <Empty icon="💬" text="No project chats yet. Browse Public Requests to start one." />
          ) : (
            <div className="flex flex-col gap-3">
              {projectChats.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  onClick={() => router.push(`/project-chat/${c.id}`)}
                  className="group cursor-pointer rounded-2xl border border-white/6 bg-white/[0.02] hover:border-pink-500/25 p-4 flex items-center gap-4 transition duration-200"
                >
                  {c.clientPhoto
                    ? <img src={c.clientPhoto} alt={c.clientName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black text-white"
                        style={{ background: "linear-gradient(135deg,#f472b6,#7c3aed)" }}>
                        {c.clientName?.[0]?.toUpperCase() ?? "C"}
                      </div>
                    )
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{c.requestTitle || "Project Chat"}</p>
                    <p className="text-white/35 text-xs truncate">with {c.clientName}</p>
                  </div>
                  {c.funded && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full border text-emerald-300 bg-emerald-400/10 border-emerald-400/20">
                      Funded ₹{c.fundedAmount?.toLocaleString("en-IN")}
                    </span>
                  )}
                  <svg className="w-4 h-4 text-white/20 group-hover:text-pink-400 flex-shrink-0 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </DashSection>

        {/* Certification */}

        <DashSection title="Certification" subtitle="Your developer certification status on Synthe" delay={0.32} accent="#818cf8">
          <div className="rounded-2xl border border-white/6 bg-white/[0.025] p-6 flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🎓</span>
                <div>
                  <p className="text-white font-bold text-sm">Certification Status</p>
                  <p className="text-white/30 text-xs">Certified developers appear first on the Connect page</p>
                </div>
              </div>
              <span className={`inline-block text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${certBadge().color}`}>
                {certBadge().label}
              </span>
            </div>
            {certStatus !== "approved" && (
              <motion.button
                onClick={() => router.push("/certification")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                style={{ willChange: "transform", background: "linear-gradient(135deg,#7c3aed,#0891b2)" }}
                className="relative overflow-hidden px-6 py-3 rounded-xl text-sm font-black text-white flex-shrink-0"
              >
                {certStatus === "pending" ? "View Application" : "Apply Now"}
                <motion.div
                  animate={{ x: ["-200%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "linear" }}
                  style={{ willChange: "transform", position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform: "skewX(-20deg)", pointerEvents: "none" }}
                />
              </motion.button>
            )}
          </div>
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
      <span className="text-3xl">{icon}</span>
      <p className="text-white/25 text-sm">{text}</p>
    </div>
  );
}