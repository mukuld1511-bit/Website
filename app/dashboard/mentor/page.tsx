"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection, query, where, orderBy,
  getDocs, doc, getDoc, updateDoc,
} from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Workshop, MentorSession } from "../../../types/gallery";

function formatDate(ts: any): string {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function MentorDashboard() {
  const router = useRouter();
  const [user,      setUser]      = useState<any>(null);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [sessions,  setSessions]  = useState<MentorSession[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<"sessions" | "bookings">("sessions");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (!snap.exists() || !["mentor","admin"].includes(snap.data().role)) {
        router.push("/dashboard");
        return;
      }
      await Promise.all([fetchWorkshops(u.uid), fetchSessions(u.uid)]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchWorkshops = async (uid: string) => {
    const q = query(
      collection(db, "workshops"),
      where("hostId", "==", uid),
      orderBy("date", "desc")
    );
    const snap = await getDocs(q);
    setWorkshops(snap.docs.map(d => ({ id: d.id, ...d.data() } as Workshop)));
  };

  const fetchSessions = async (uid: string) => {
    const q = query(
      collection(db, "mentorSessions"),
      where("mentorId", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as MentorSession)));
  };

  const handleSessionAction = async (sessionId: string, action: "confirmed" | "cancelled") => {
    try {
      await updateDoc(doc(db, "mentorSessions", sessionId), { status: action });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: action } : s));
    } catch (err) { console.error(err); }
  };

  const totalRegistrations = workshops.reduce((sum, w) => sum + (w.registeredUsers?.length ?? 0), 0);
  const pendingBookings    = sessions.filter(s => s.status === "pending").length;
  const totalEarnings      = sessions
    .filter(s => s.status === "completed")
    .reduce((sum, s) => sum + (s.price || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-16 space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-12 flex-grow w-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-1">Mentor dashboard</p>
            <h1 className="text-3xl font-black text-gray-900">
              Welcome, {user?.displayName?.split(" ")[0] || "Mentor"}
            </h1>
          </div>
          <Link href="/learn/workshops/create">
            <button className="px-5 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all active:translate-y-[1px]">
              + Create session
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Sessions hosted",    value: workshops.length            },
            { label: "Total registrations",value: totalRegistrations          },
            { label: "Pending bookings",   value: pendingBookings, alert: pendingBookings > 0 },
            { label: "Earnings",           value: `₹${totalEarnings}`        },
          ].map(({ label, value, alert }) => (
            <div key={label}
              className={`bg-white border rounded-2xl p-4 text-center shadow-sm ${alert ? "border-amber-200" : "border-gray-100"}`}>
              <p className={`text-2xl font-black ${alert ? "text-amber-600" : "text-gray-900"}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 w-fit mb-6">
          {([
            { key: "sessions",  label: "My sessions" },
            { key: "bookings",  label: `1-on-1 bookings${pendingBookings > 0 ? ` (${pendingBookings})` : ""}` },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Sessions tab */}
        {tab === "sessions" && (
          <div className="space-y-3">
            {workshops.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-4xl mb-4">📅</p>
                <p className="font-bold text-gray-900 mb-2">No sessions yet</p>
                <p className="text-gray-500 text-sm mb-5">Create your first live session for the community</p>
                <Link href="/learn/workshops/create">
                  <button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8]">
                    Create session
                  </button>
                </Link>
              </div>
            ) : workshops.map(w => (
              <motion.div key={w.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-sm">{w.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      w.status === "live"     ? "bg-red-50 text-red-600 border border-red-200" :
                      w.status === "ended"    ? "bg-gray-100 text-gray-500" :
                      "bg-green-50 text-green-700 border border-green-200"
                    }`}>{w.status}</span>
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(w.date)} · {w.duration} min</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {w.registeredUsers?.length ?? 0}/{w.maxSeats} registered ·{" "}
                    {w.price === 0 ? "Free" : `₹${w.price}`}
                  </p>
                </div>
                <Link href={`/learn/workshops/${w.id}`}>
                  <button className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-all">
                    View
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Bookings tab */}
        {tab === "bookings" && (
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-4xl mb-4">📋</p>
                <p className="font-bold text-gray-900 mb-1">No bookings yet</p>
                <p className="text-gray-500 text-sm">Learners will book 1-on-1 sessions with you from your profile</p>
              </div>
            ) : sessions.map(s => (
              <motion.div key={s.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl border shadow-sm p-5 ${
                  s.status === "pending" ? "border-amber-200" : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900 text-sm">{s.learnerName}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        s.status === "pending"   ? "bg-amber-50 text-amber-700 border border-amber-200" :
                        s.status === "confirmed" ? "bg-green-50 text-green-700 border border-green-200" :
                        s.status === "completed" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        "bg-gray-100 text-gray-500"
                      }`}>{s.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      <span className="font-semibold">Topic:</span> {s.topic}
                    </p>
                    {s.message && (
                      <p className="text-xs text-gray-400 italic">"{s.message}"</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {s.price === 0 ? "Free" : `₹${s.price}`} · {formatDate(s.createdAt)}
                    </p>
                  </div>
                  {s.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSessionAction(s.id, "cancelled")}
                        className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleSessionAction(s.id, "confirmed")}
                        className="px-3 py-1.5 rounded-lg bg-[#5B4BDB] text-white text-xs font-bold hover:bg-[#4c3ec7] transition-all"
                      >
                        Accept
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}