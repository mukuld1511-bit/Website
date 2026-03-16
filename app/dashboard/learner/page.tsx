"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection, query, where, getDocs,
  doc, getDoc, orderBy,
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

export default function LearnerDashboard() {
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
      if (!snap.exists() || !["learner","developer","mentor","admin"].includes(snap.data().role)) {
        router.push("/dashboard");
        return;
      }
      await Promise.all([fetchRegisteredWorkshops(u.uid), fetchBookedSessions(u.uid)]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchRegisteredWorkshops = async (uid: string) => {
    const q = query(
      collection(db, "workshops"),
      where("registeredUsers", "array-contains", uid),
      orderBy("date", "asc")
    );
    const snap = await getDocs(q);
    setWorkshops(snap.docs.map(d => ({ id: d.id, ...d.data() } as Workshop)));
  };

  const fetchBookedSessions = async (uid: string) => {
    const q = query(
      collection(db, "mentorSessions"),
      where("learnerId", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as MentorSession)));
  };

  const upcomingWorkshops = workshops.filter(w => w.status !== "ended");
  const pastWorkshops     = workshops.filter(w => w.status === "ended");
  const confirmedSessions = sessions.filter(s => s.status === "confirmed");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-16 space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />)}
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
            <p className="text-xs font-bold uppercase tracking-widest text-[#378ADD] mb-1">Learner dashboard</p>
            <h1 className="text-3xl font-black text-gray-900">
              Hey, {user?.displayName?.split(" ")[0] || "Learner"} 👋
            </h1>
          </div>
          <Link href="/learn">
            <button className="px-5 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all active:translate-y-[1px]">
              Browse sessions
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Registered sessions", value: workshops.length      },
            { label: "Upcoming",            value: upcomingWorkshops.length },
            { label: "1-on-1 booked",       value: sessions.length       },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 w-fit mb-6">
          {([
            { key: "sessions",  label: "My sessions" },
            { key: "bookings",  label: "1-on-1 bookings" },
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
          <div>
            {workshops.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-4xl mb-4">📚</p>
                <p className="font-bold text-gray-900 mb-2">No sessions registered yet</p>
                <p className="text-gray-500 text-sm mb-5">Browse upcoming live sessions and register</p>
                <Link href="/learn">
                  <button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8]">
                    Browse sessions
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingWorkshops.length > 0 && (
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">Upcoming</p>
                )}
                {upcomingWorkshops.map(w => (
                  <motion.div key={w.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-sm">{w.title}</h3>
                          {w.status === "live" && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Live
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{w.hostName} · {formatDate(w.date)} · {w.duration} min</p>
                        {w.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {w.tags.slice(0, 3).map(t => (
                              <span key={t} className="px-2 py-0.5 rounded-full bg-[#5B4BDB]/10 text-[#5B4BDB] text-xs font-semibold">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Link href={`/learn/workshops/${w.id}`}>
                        <button className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-b-[2px] ${
                          w.status === "live"
                            ? "bg-red-500 text-white border-red-700 hover:bg-red-600"
                            : "bg-[#5B4BDB] text-white border-[#4438b8] hover:bg-[#4c3ec7]"
                        }`}>
                          {w.status === "live" ? "Join now" : "View & join link"}
                        </button>
                      </Link>
                    </div>
                  </motion.div>
                ))}

                {pastWorkshops.length > 0 && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1 pt-4">Past sessions</p>
                    {pastWorkshops.map(w => (
                      <div key={w.id}
                        className="bg-gray-50 rounded-2xl border border-gray-100 p-4 opacity-70"
                      >
                        <p className="font-bold text-gray-700 text-sm">{w.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{w.hostName} · {formatDate(w.date)}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bookings tab */}
        {tab === "bookings" && (
          <div>
            {sessions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-4xl mb-4">🧑‍🏫</p>
                <p className="font-bold text-gray-900 mb-2">No bookings yet</p>
                <p className="text-gray-500 text-sm mb-5">Book a 1-on-1 session with a verified mentor</p>
                <Link href="/hire">
                  <button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8]">
                    Browse mentors
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map(s => (
                  <motion.div key={s.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-900 text-sm">{s.mentorName}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            s.status === "pending"   ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            s.status === "confirmed" ? "bg-green-50 text-green-700 border border-green-200" :
                            s.status === "completed" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                            "bg-gray-100 text-gray-500"
                          }`}>{s.status}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          <span className="font-semibold">Topic:</span> {s.topic}
                        </p>
                        {s.status === "confirmed" && s.meetLink && (
                          <a href={s.meetLink} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-bold hover:bg-green-100 transition-all">
                            Join session →
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 flex-shrink-0">{formatDate(s.createdAt)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}