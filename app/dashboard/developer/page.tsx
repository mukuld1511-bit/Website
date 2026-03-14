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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading your dashboard…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-28 relative overflow-hidden font-sans">

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-10"
        >
          <p className="text-blue-600 text-xs uppercase tracking-[0.2em] font-bold mb-2">Developer Portal</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 leading-tight mb-3">
            Your Dashboard
          </h1>
          <p className="text-gray-500 text-sm font-medium">Track your uploads, earnings, bids, and connect sessions.</p>
        </motion.div>

        {/* Payout Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-10 bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1">
            <h2 className="text-xl font-black text-gray-900 mb-1">Payout Details</h2>
            <p className="text-sm font-medium text-gray-500">Enter your UPI ID or Bank Details to receive payments for your models.</p>
          </div>
          <div className="flex-1 w-full flex gap-3">
            <input 
              type="text" 
              placeholder="UPI ID or Account Number & IFSC..." 
              value={paymentInfo}
              onChange={(e) => setPaymentInfo(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            />
            <button 
              onClick={savePaymentInfo}
              disabled={savingPayment || !paymentInfo.trim()}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition focus:ring-4 focus:ring-blue-600/20 disabled:opacity-50 whitespace-nowrap"
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
            { label: "Uploads",          val: uploads.length,               color: "blue" },
            { label: "Net Earnings",     val: `₹${netEarnings.toFixed(0)}`, color: "emerald" },
            { label: "Connect Sessions", val: activeSessions,               color: "cyan", highlight: activeSessions > 0 },
          ].map((s, i) => (
            <div
              key={i}
              className={`rounded-3xl p-6 border-2 shadow-sm transition duration-300 ${
                s.highlight ? "border-amber-200 bg-amber-50" : "border-indigo-50 bg-white"
              }`}
            >
              <p className={`text-4xl font-black mb-1 text-${s.color}-600`}>{s.val}</p>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{s.label}</p>
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
            { label: "Upload Model",    icon: "⬆", href: "/upload",        border: "border-blue-200", bg: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
            { label: "Public Requests", icon: "📋", href: "/requests/open", border: "border-indigo-200", bg: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
            { label: "Connect Page",    icon: "🔗", href: "/connect",       border: "border-cyan-200", bg: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100" },
            { label: "Get Certified",   icon: "🎓", href: "/certification", border: "border-amber-200", bg: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
          ].map((q, i) => (
            <motion.button
              key={i}
              onClick={() => router.push(q.href)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`rounded-xl px-4 py-3.5 text-sm font-bold text-left flex items-center gap-2.5 border shadow-sm transition duration-200 ${q.border} ${q.bg}`}
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
              { label: "Gross Revenue",      val: `₹${grossRevenue.toFixed(2)}`,                   sub: "Total paid by buyers",  color: "cyan" },
              { label: "Platform Fee (15%)", val: `−₹${(grossRevenue * PLATFORM_FEE).toFixed(2)}`, sub: "Synthe commission",     color: "rose" },
              { label: "Net Earnings",       val: `₹${netEarnings.toFixed(2)}`,                    sub: "You receive",           color: "emerald" },
            ].map((e, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
                <p className={`text-2xl font-black mb-1 text-${e.color}-600`}>{e.val}</p>
                <p className="text-gray-900 font-bold text-sm">{e.label}</p>
                <p className="text-gray-500 text-xs mt-0.5 font-medium">{e.sub}</p>
              </div>
            ))}
          </div>
          {purchases.length === 0 && <Empty icon="💰" text="No purchases yet. Share your models to start earning!" />}
        </DashSection>

        {/* My Uploads */}
        <DashSection title="My Uploads" subtitle="Models you've published to the gallery" delay={0.2} accent="bg-violet-500">
          {uploads.length === 0 ? (
            <Empty icon="🚀" text="No models uploaded yet." />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {uploads.map((m) => (
                <div
                  key={m.id}
                  onClick={() => router.push(`/gallery/${m.id}`)}
                  className="group cursor-pointer bg-white border-2 border-indigo-50 shadow-sm rounded-3xl p-6 hover:border-violet-300 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    {m.thumbnailUrl ? (
                      <img src={m.thumbnailUrl} alt={m.title} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border-2 border-indigo-50 shadow-sm" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 bg-indigo-50 border-2 border-indigo-100 shadow-sm">
                        <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 font-bold text-sm truncate group-hover:text-violet-600 transition">{m.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[9px] font-bold uppercase py-0.5 px-2 rounded bg-violet-50 text-violet-700 border border-violet-200">
                          {m.category ?? "3D"}
                        </span>
                        {m.price > 0
                          ? <span className="text-[9px] font-bold py-0.5 px-2 rounded bg-amber-50 text-amber-700 border border-amber-200">₹{m.price}</span>
                          : <span className="text-[9px] font-bold py-0.5 px-2 rounded bg-green-50 text-green-700 border border-green-200">Free</span>
                        }
                      </div>
                      <p className="text-gray-500 font-medium text-xs mt-1.5 line-clamp-1">{m.description}</p>
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
                  className="group cursor-pointer rounded-3xl border-2 border-indigo-50 bg-white shadow-sm hover:border-cyan-300 hover:shadow-md p-6 flex items-center gap-5 transition-all duration-300 hover:-translate-y-0.5"
                >
                  {s.studentAvatar
                    ? <img src={s.studentAvatar} alt={s.studentName} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border-2 border-indigo-50 shadow-sm" />
                    : (
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-black text-cyan-700 bg-cyan-50 border-2 border-cyan-100 shadow-sm">
                        {s.studentName?.[0]?.toUpperCase() ?? "S"}
                      </div>
                    )
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-gray-900 font-bold text-sm">{s.studentName}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${statusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </div>
                    <p className="text-gray-500 font-medium text-xs truncate">Subject: {s.subject}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-cyan-500 flex-shrink-0 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="group cursor-pointer rounded-3xl border-2 border-indigo-50 bg-white shadow-sm hover:border-pink-300 hover:shadow-md p-5 flex items-center gap-5 transition-all duration-300 hover:-translate-y-0.5"
                >
                  {c.clientPhoto
                    ? <img src={c.clientPhoto} alt={c.clientName} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border-2 border-indigo-50 shadow-sm" />
                    : (
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-black text-pink-700 bg-pink-50 border-2 border-pink-100 shadow-sm">
                        {c.clientName?.[0]?.toUpperCase() ?? "C"}
                      </div>
                    )
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-bold text-sm truncate">{c.requestTitle || "Project Chat"}</p>
                    <p className="text-gray-500 font-medium text-xs truncate">with {c.clientName}</p>
                  </div>
                  {c.funded && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-green-700 bg-green-50 border-green-200">
                      Funded ₹{c.fundedAmount?.toLocaleString("en-IN")}
                    </span>
                  )}
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-pink-500 flex-shrink-0 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </DashSection>

        {/* Certification */}

        <DashSection title="Certification" subtitle="Your developer certification status on Synthe" delay={0.32} accent="bg-indigo-500">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🎓</span>
                <div>
                  <p className="text-gray-900 font-bold text-sm">Certification Status</p>
                  <p className="text-gray-500 font-medium text-xs">Certified developers appear first on the Connect page</p>
                </div>
              </div>
              <span className={`inline-block text-xs font-bold uppercase px-3 py-1 rounded border mt-2 ${certBadge().color}`}>
                {certBadge().label}
              </span>
            </div>
            {certStatus !== "approved" && (
              <motion.button
                onClick={() => router.push("/certification")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition"
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

function DashSection({ title, subtitle, delay, children, accent = "bg-blue-500" }: {
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
        <div className={`w-1.5 h-7 rounded-sm ${accent}`} />
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
          <p className="text-gray-500 font-medium text-xs mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="w-full py-16 text-center border-2 border-indigo-100 border-dashed rounded-[2.5rem] bg-white flex flex-col items-center gap-4 shadow-sm">
      <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center mb-2 shadow-sm">
        <span className="text-4xl filter hue-rotate-15">{icon}</span>
      </div>
      <p className="text-gray-600 font-bold text-base tracking-wide max-w-xs">{text}</p>
    </div>
  );
}