"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import { collection, getDocs, getDoc, doc, updateDoc, query, where, Timestamp } from "firebase/firestore";
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
  const [paymentInfo, setPaymentInfo]   = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) { router.push("/login"); return; }
      loadAll(user.uid);
    });
    return () => unsub();
  }, []);

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

  const loadAll = async (uid: string) => {
    setLoading(true);
    await Promise.all([
      loadUploads(uid),
      loadSessions(uid),
      loadPurchases(uid),
      loadCert(uid),
      loadProjectChats(uid),
      getDoc(doc(db, "users", uid)).then(snap => {
        if (snap.exists() && snap.data().paymentInfo) setPaymentInfo(snap.data().paymentInfo);
      }),
    ]);
    setLoading(false);
  };

  const savePaymentInfo = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setSavingPayment(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { paymentInfo });
      alert("Payment details saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save payment details.");
    }
    setSavingPayment(false);
  };
  const grossRevenue = purchases.reduce((s, p) => s + (p.amount ?? 0), 0);
  const netEarnings  = purchases.reduce((s, p) => {
    const gross = p.amount ?? 0;
    return s + gross * (1 - PLATFORM_FEE);

  }, 0);

  const activeSessions = sessions.filter((s) => s.status === "active").length;

  const statusBadge = (s: string) => {
    if (s === "pending") return "text-amber-700 bg-amber-50 border-amber-200";
    if (s === "accepted" || s === "approved" || s === "active" || s === "in_progress")
      return "text-green-700 bg-green-50 border-green-200";
    return "text-red-700 bg-red-50 border-red-200";
  };

  const certBadge = () => {
    if (!certStatus)                return { label: "Not Applied",      color: "text-gray-600 bg-gray-100 border-gray-200" };
    if (certStatus === "approved")  return { label: "✓ Certified",      color: "text-green-700 bg-green-50 border-green-200" };
    if (certStatus === "pending")   return { label: "⏳ Pending Review", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { label: "✕ Rejected", color: "text-red-700 bg-red-50 border-red-200" };
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0A0A0F] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading your dashboard…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0F] px-4 sm:px-6 lg:px-8 py-28 relative overflow-hidden font-sans text-white">

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5B4BDB]/15 border border-[#5B4BDB]/25 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BDB] animate-pulse" />
            <span className="text-xs font-bold text-[#7C6EF6] uppercase tracking-widest">Developer Portal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
            Your Dashboard
          </h1>
          <p className="text-[#9494AD] text-sm font-medium">Track your uploads, earnings, bids, and connect sessions.</p>
        </motion.div>

        {/* Payout Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-10 bg-[#141420] p-6 rounded-[2rem] border border-[#2A2A3E] shadow-sm flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1">
            <h2 className="text-xl font-black text-white mb-1">Payout Details</h2>
            <p className="text-sm font-medium text-[#9494AD]">Enter your UPI ID or Bank Details to receive payments for your models.</p>
          </div>
          <div className="flex-1 w-full flex gap-3">
            <input 
              type="text" 
              placeholder="UPI ID or Account Number & IFSC..." 
              value={paymentInfo}
              onChange={(e) => setPaymentInfo(e.target.value)}
              className="flex-1 bg-[#0A0A0F] border border-[#2A2A3E] rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-[#5B4BDB] transition"
            />
            <button 
              onClick={savePaymentInfo}
              disabled={savingPayment || !paymentInfo.trim()}
              className="px-6 py-3 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] text-white font-bold text-sm transition shadow-[0_0_15px_rgba(91,75,219,0.3)] disabled:opacity-50 whitespace-nowrap"
            >
              {savingPayment ? "Saving..." : "Save Details"}
            </button>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
          {[
            { label: "Uploads",          val: uploads.length,               color: "#7C6EF6" },
            { label: "Net Earnings",     val: `₹${netEarnings.toFixed(0)}`, color: "#10B981" },
            { label: "Connect Sessions", val: activeSessions,               color: "#06B6D4", highlight: activeSessions > 0 },
          ].map((s, i) => (
            <div
              key={i}
              className={`rounded-3xl p-6 border-2 transition duration-300 bg-[#141420] ${
                s.highlight ? "border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "border-[#2A2A3E]"
              }`}
            >
              <p className="text-4xl font-black mb-1" style={{ color: s.color }}>{s.val}</p>
              <p className="text-[#9494AD] text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
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
            { label: "Upload Model",    icon: "⬆", href: "/upload",        border: "border-blue-500/30", bg: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" },
            { label: "Public Requests", icon: "📋", href: "/requests/open", border: "border-indigo-500/30", bg: "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20" },
            { label: "Connect Page",    icon: "🔗", href: "/connect",       border: "border-cyan-500/30", bg: "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20" },
            { label: "Get Certified",   icon: "🎓", href: "/certification", border: "border-amber-500/30", bg: "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" },
          ].map((q, i) => (
            <motion.button
              key={i}
              onClick={() => router.push(q.href)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`rounded-xl px-4 py-3.5 text-sm font-bold text-left flex items-center gap-2.5 border transition duration-200 ${q.border} ${q.bg}`}
            >
              <span className="text-base">{q.icon}</span>
              {q.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Earnings Summary */}
        <DashSection title="Earnings Summary" subtitle="Revenue from model purchases (after platform & payment fees)" delay={0.16} accent="bg-emerald-500">
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            {[
              { label: "Gross Revenue",      val: `₹${grossRevenue.toFixed(2)}`,                   sub: "Total paid by buyers",  color: "#06B6D4" },
              { label: "Platform Fee (15%)", val: `−₹${(grossRevenue * PLATFORM_FEE).toFixed(2)}`, sub: "Synthe commission",     color: "#F43F5E" },
              { label: "Net Earnings",       val: `₹${netEarnings.toFixed(2)}`,                    sub: "You receive",           color: "#10B981" },
            ].map((e, i) => (
              <div key={i} className="rounded-2xl border border-[#2A2A3E] bg-[#141420] p-5">
                <p className="text-2xl font-black mb-1" style={{ color: e.color }}>{e.val}</p>
                <p className="text-white font-bold text-sm">{e.label}</p>
                <p className="text-[#9494AD] text-[10px] mt-0.5 font-bold uppercase">{e.sub}</p>
              </div>
            ))}
          </div>
          {purchases.length === 0 && <Empty icon="💰" text="No purchases yet. Share your models to start earning!" />}
        </DashSection>

        {/* My Uploads */}
        <DashSection title="My Uploads" subtitle="Models you've published to the gallery" delay={0.2} accent="bg-[#7C6EF6]">
          {uploads.length === 0 ? (
            <Empty icon="🚀" text="No models uploaded yet." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {uploads.map((m) => (
                <div
                  key={m.id}
                  onClick={() => router.push(`/gallery/${m.id}`)}
                  className="group cursor-pointer bg-[#141420] border-2 border-[#2A2A3E] shadow-sm rounded-3xl p-6 hover:border-[#7C6EF6]/50 hover:shadow-[0_0_20px_rgba(124,110,246,0.15)] transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    {m.thumbnailUrl ? (
                      <img src={m.thumbnailUrl} alt={m.title} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border-2 border-[#2A2A3E] shadow-sm bg-[#0A0A0F]" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#0A0A0F] border-2 border-[#2A2A3E] shadow-sm">
                        <svg className="w-6 h-6 text-[#5B4BDB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-sm truncate group-hover:text-[#7C6EF6] transition-colors">{m.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[9px] font-bold uppercase py-0.5 px-2 rounded-full bg-[#5B4BDB]/15 text-[#7C6EF6] border border-[#5B4BDB]/30">
                          {m.category ?? "3D"}
                        </span>
                        {m.price > 0
                          ? <span className="text-[9px] font-bold py-0.5 px-2 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">₹{m.price}</span>
                          : <span className="text-[9px] font-bold py-0.5 px-2 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">Free</span>
                        }
                      </div>
                      <p className="text-[#9494AD] font-medium text-xs mt-1.5 line-clamp-1">{m.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashSection>

        {/* Connect Sessions -> Project Requests */}
        <DashSection title="My Project Requests" subtitle="Incoming project requests assigned directly to you" delay={0.28} accent="bg-cyan-500">
          {sessions.length === 0 ? (
            <Empty icon="📋" text="No project requests received yet." />
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => router.push(`/connect/${s.id}`)}
                  className="group cursor-pointer rounded-3xl border-2 border-[#2A2A3E] bg-[#141420] shadow-sm hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] p-6 flex items-center gap-5 transition-all duration-300 hover:-translate-y-0.5"
                >
                  {s.studentAvatar
                    ? <img src={s.studentAvatar} alt={s.studentName} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border-2 border-[#2A2A3E] shadow-sm bg-[#0A0A0F]" />
                    : (
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-black text-cyan-400 bg-cyan-500/10 border-2 border-cyan-500/20 shadow-sm">
                        {s.studentName?.[0]?.toUpperCase() ?? "S"}
                      </div>
                    )
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-white font-bold text-sm">{s.studentName}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        s.status === "pending" ? "text-amber-400 bg-amber-500/15 border-amber-500/30" :
                        s.status === "rejected" ? "text-red-400 bg-red-500/15 border-red-500/30" :
                        "text-green-400 bg-green-500/15 border-green-500/30"
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <p className="text-[#9494AD] font-medium text-xs truncate">Subject: {s.subject}</p>
                  </div>
                  <svg className="w-4 h-4 text-[#6B6B85] group-hover:text-cyan-400 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </DashSection>

        {/* Project Messages */}
        <DashSection title="Project Messages" subtitle="Active chats from public project requests" delay={0.3} accent="bg-pink-500">
          {projectChats.length === 0 ? (
            <Empty icon="💬" text="No project chats yet. Browse Public Requests to start one." />
          ) : (
            <div className="flex flex-col gap-3">
              {projectChats.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  onClick={() => router.push(`/project-chat/${c.id}`)}
                  className="group cursor-pointer rounded-3xl border-2 border-[#2A2A3E] bg-[#141420] shadow-sm hover:border-pink-500/50 hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] p-5 flex items-center gap-5 transition-all duration-300 hover:-translate-y-0.5"
                >
                  {c.clientPhoto
                    ? <img src={c.clientPhoto} alt={c.clientName} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border-2 border-[#2A2A3E] shadow-sm bg-[#0A0A0F]" />
                    : (
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-black text-pink-400 bg-pink-500/10 border-2 border-pink-500/20 shadow-sm">
                        {c.clientName?.[0]?.toUpperCase() ?? "C"}
                      </div>
                    )
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{c.requestTitle || "Project Chat"}</p>
                    <p className="text-[#9494AD] font-medium text-xs truncate">with {c.clientName}</p>
                  </div>
                  {c.funded && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-green-400 bg-green-500/15 border-green-500/30">
                      Funded ₹{c.fundedAmount?.toLocaleString("en-IN")}
                    </span>
                  )}
                  <svg className="w-4 h-4 text-[#6B6B85] group-hover:text-pink-400 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </DashSection>

        {/* Certification */}
        <DashSection title="Certification" subtitle="Your developer certification status on Synthe" delay={0.32} accent="bg-[#7C6EF6]">
          <div className="rounded-2xl border border-[#2A2A3E] bg-[#141420] p-6 flex flex-col sm:flex-row sm:items-center gap-6 shadow-sm">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🎓</span>
                <div>
                  <p className="text-white font-bold text-sm">Certification Status</p>
                  <p className="text-[#9494AD] font-medium text-xs">Certified developers appear first on the Connect page</p>
                </div>
              </div>
              <span className={`inline-block text-[10px] font-bold uppercase px-3 py-1 rounded-full border mt-2 ${
                !certStatus ? "text-[#9494AD] bg-[#2A2A3E]/50 border-[#2A2A3E]" :
                certStatus === "approved" ? "text-green-400 bg-green-500/15 border-green-500/30" :
                certStatus === "pending" ? "text-amber-400 bg-amber-500/15 border-amber-500/30" :
                "text-red-400 bg-red-500/15 border-red-500/30"
              }`}>
                {!certStatus ? "Not Applied" : certStatus === "approved" ? "✓ Certified" : certStatus === "pending" ? "⏳ Pending Review" : "✕ Rejected"}
              </span>
            </div>
            {certStatus !== "approved" && (
              <motion.button
                onClick={() => router.push("/certification")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] text-white text-sm font-bold shadow-[0_0_15px_rgba(91,75,219,0.3)] transition"
              >
                {certStatus === "pending" ? "View Application" : "Apply Now"}
              </motion.button>
            )}
          </div>
        </DashSection>

      </div>
    </main>
  );
}

function DashSection({ title, subtitle, delay, children, accent = "bg-[#7C6EF6]" }: {
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
        <div className={`w-1.5 h-7 rounded-sm ${accent} shadow-[0_0_10px_currentColor]`} />
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          <p className="text-[#9494AD] font-medium text-xs mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="w-full py-16 text-center border-2 border-[#2A2A3E] border-dashed rounded-[2.5rem] bg-[#141420] flex flex-col items-center gap-4">
      <div className="w-20 h-20 rounded-[1.5rem] bg-[#0A0A0F] border-2 border-[#2A2A3E] flex items-center justify-center mb-2 shadow-sm">
        <span className="text-4xl filter hue-rotate-15">{icon}</span>
      </div>
      <p className="text-[#9494AD] font-bold text-sm max-w-xs">{text}</p>
    </div>
  );
}