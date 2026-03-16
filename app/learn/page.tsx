"use client";
import { useState, useEffect } from "react";
import {
  collection, query, where, orderBy,
  getDocs, addDoc, updateDoc, doc,
  serverTimestamp, arrayUnion,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Workshop, UserRole } from "../../types/gallery";

const TAGS = ["All", "AR", "VR", "Unity", "Unreal", "WebXR", "Blender", "ARCore", "ARKit"];

function formatDate(ts: any): string {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function SeatsBar({ registered, max }: { registered: number; max: number }) {
  const pct   = Math.min((registered / max) * 100, 100);
  const left  = Math.max(max - registered, 0);
  const color = left === 0 ? "#E24B4A" : left <= 3 ? "#EF9F27" : "#1D9E75";
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color }} className="font-semibold">
          {left === 0 ? "Full" : `${left} seats left`}
        </span>
        <span className="text-gray-400">{registered}/{max}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function WorkshopCard({
  w, user, userRole, onRegister,
}: {
  w: Workshop;
  user: any;
  userRole: UserRole;
  onRegister: (id: string) => void;
}) {
  const isRegistered = user && w.registeredUsers?.includes(user.uid);
  const isFull       = (w.registeredUsers?.length ?? 0) >= w.maxSeats;
  const isPast       = w.status === "ended";
  const canRegister  = ["learner", "developer", "mentor", "admin"].includes(userRole);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {w.status === "live" && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Live now
          </span>
        )}
        {w.tags?.slice(0, 3).map(t => (
          <span key={t} className="px-2 py-0.5 rounded-full bg-[#5B4BDB]/10 text-[#5B4BDB] text-xs font-semibold">
            {t}
          </span>
        ))}
      </div>

      <h3 className="font-black text-gray-900 text-base mb-1 leading-snug">{w.title}</h3>
      <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">{w.description}</p>

      {/* Host */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-[#5B4BDB]/10 flex items-center justify-center overflow-hidden flex-shrink-0">
          {w.hostPhoto
            ? <img src={w.hostPhoto} className="w-full h-full object-cover" alt="" />
            : <span className="text-[#5B4BDB] text-xs font-bold">{w.hostName?.charAt(0)}</span>
          }
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900">{w.hostName}</p>
          <p className="text-xs text-gray-400">{w.duration} min · {w.price === 0 ? "Free" : `₹${w.price}`}</p>
        </div>
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {formatDate(w.date)}
      </div>

      <SeatsBar registered={w.registeredUsers?.length ?? 0} max={w.maxSeats} />

      {/* Action */}
      <div className="mt-4">
        {isPast ? (
          <div className="text-center text-xs text-gray-400 py-2">Session ended</div>
        ) : isRegistered ? (
          <div className="w-full py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-bold text-center">
            Registered ✓
          </div>
        ) : !user ? (
          <Link href="/login">
            <button className="w-full py-2.5 rounded-xl bg-[#5B4BDB] text-white text-sm font-bold border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all active:translate-y-[1px]">
              Sign in to register
            </button>
          </Link>
        ) : !canRegister ? (
          <Link href="/join">
            <button className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold border-b-[3px] border-gray-200 hover:bg-gray-200 transition-all active:translate-y-[1px]">
              Apply as Learner to register
            </button>
          </Link>
        ) : isFull ? (
          <button disabled className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm font-bold cursor-not-allowed">
            Session full
          </button>
        ) : (
          <button
            onClick={() => onRegister(w.id)}
            className="w-full py-2.5 rounded-xl bg-[#5B4BDB] text-white text-sm font-bold border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all active:translate-y-[1px]"
          >
            {w.price === 0 ? "Register free" : `Register · ₹${w.price}`}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function LearnPage() {
  const [user,      setUser]      = useState<any>(null);
  const [userRole,  setUserRole]  = useState<UserRole>("user");
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTag, setActiveTag] = useState("All");
  const [tab,       setTab]       = useState<"upcoming" | "registered">("upcoming");
  const [toast,     setToast]     = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null);
      if (u) {
        const { doc: d, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(d(db, "users", u.uid));
        if (snap.exists()) setUserRole(snap.data().role as UserRole ?? "user");
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "workshops"),
        where("status", "in", ["upcoming", "live"]),
        orderBy("date", "asc")
      );
      const snap = await getDocs(q);
      setWorkshops(snap.docs.map(d => ({ id: d.id, ...d.data() } as Workshop)));
    } catch (err) {
      console.error("Workshops fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (workshopId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "workshops", workshopId), {
        registeredUsers: arrayUnion(user.uid),
      });
      setWorkshops(prev =>
        prev.map(w => w.id === workshopId
          ? { ...w, registeredUsers: [...(w.registeredUsers ?? []), user.uid] }
          : w
        )
      );
      showToast("Registered! Meet link will be shared before the session.");
    } catch (err) {
      console.error("Register error:", err);
      showToast("Something went wrong. Please try again.");
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const filtered = workshops.filter(w => {
    const tagMatch = activeTag === "All" || w.tags?.includes(activeTag);
    const tabMatch = tab === "upcoming"
      ? true
      : user && w.registeredUsers?.includes(user.uid);
    return tagMatch && tabMatch;
  });

  const myRegistered = workshops.filter(w => user && w.registeredUsers?.includes(user.uid));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 py-14 flex-grow w-full">

        {/* Hero */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-3">
            SYNTHÉ Learning Hub
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-4 leading-tight">
            Learn AR & VR<br />from real developers
          </h1>
          <p className="text-gray-500 text-lg max-w-xl">
            Join live sessions hosted by verified mentors, or book a private 1-on-1 session
            for hands-on guidance.
          </p>

          {/* Role upgrade banner */}
          {user && userRole === "user" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-center justify-between gap-4 p-4 rounded-2xl border border-[#5B4BDB]/30 bg-[#5B4BDB]/5"
            >
              <div>
                <p className="text-sm font-bold text-gray-900">Unlock learning features</p>
                <p className="text-xs text-gray-500 mt-0.5">Apply as a Learner to register for sessions and book mentors</p>
              </div>
              <Link href="/join">
                <button className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-[#5B4BDB] text-white text-sm font-bold border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all active:translate-y-[1px]">
                  Apply as Learner
                </button>
              </Link>
            </motion.div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Live sessions", value: workshops.filter(w => w.status === "live").length || "—" },
            { label: "Upcoming",      value: workshops.filter(w => w.status === "upcoming").length },
            { label: "My sessions",   value: myRegistered.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex gap-1 p-1 rounded-2xl bg-gray-100 w-fit">
            {(["upcoming", "registered"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
                  tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                {t === "registered" ? "My sessions" : "Upcoming"}
              </button>
            ))}
          </div>

          {/* Tag filters */}
          <div className="flex gap-1.5 flex-wrap">
            {TAGS.map(tag => (
              <button key={tag} onClick={() => setActiveTag(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  activeTag === tag
                    ? "bg-[#5B4BDB] text-white border-[#4438b8]"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Workshop grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded mb-1.5" />
                <div className="h-3 bg-gray-100 rounded w-4/5 mb-4" />
                <div className="h-8 bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl mx-auto mb-4">
              {tab === "registered" ? "📋" : "📅"}
            </div>
            <p className="font-bold text-gray-900 mb-2">
              {tab === "registered" ? "No sessions registered yet" : "No sessions available"}
            </p>
            <p className="text-gray-500 text-sm">
              {tab === "registered"
                ? "Register for upcoming sessions to see them here"
                : "Check back soon — mentors post new sessions regularly"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(w => (
              <WorkshopCard
                key={w.id}
                w={w}
                user={user}
                userRole={userRole}
                onRegister={handleRegister}
              />
            ))}
          </div>
        )}

        {/* 1-on-1 mentor section */}
        <div className="mt-16 rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-8 md:p-10">
              <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-3">1-on-1 Sessions</p>
              <h2 className="text-2xl font-black text-gray-900 mb-3 leading-tight">
                Need personal guidance?
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Browse verified mentors and book a private session.
                You choose the topic, they bring the expertise.
                Paid or free — depends on the mentor.
              </p>
              <div className="space-y-2 mb-6">
                {[
                  "Pick your topic — Unity, WebXR, Blender, anything",
                  "Choose a mentor whose work you admire",
                  "Send your request with your goal",
                  "Mentor confirms → Meet link shared",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#5B4BDB]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#5B4BDB] text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-600">{step}</p>
                  </div>
                ))}
              </div>
              <Link href="/hire">
                <button className="px-7 py-3.5 rounded-xl bg-gray-900 text-white font-bold text-sm border-b-[3px] border-black/40 hover:bg-gray-800 transition-all active:translate-y-[1px]">
                  Browse mentors
                </button>
              </Link>
            </div>
            <div className="hidden md:flex items-center justify-center p-10 bg-gradient-to-br from-[#5B4BDB]/5 to-blue-50">
              <div className="text-center">
                <div className="text-7xl mb-4">🧑‍🏫</div>
                <p className="font-black text-gray-900 text-lg">Verified mentors</p>
                <p className="text-gray-500 text-sm mt-1">Real XR developers, teaching live</p>
              </div>
            </div>
          </div>
        </div>

        {/* Become a mentor CTA */}
        {user && !["mentor", "admin"].includes(userRole) && (
          <div className="mt-8 p-6 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-black text-gray-900 mb-1">Want to teach?</p>
              <p className="text-gray-500 text-sm">Apply as a Mentor and host your own sessions on SYNTHÉ.</p>
            </div>
            <Link href="/join">
              <button className="flex-shrink-0 px-6 py-3 rounded-xl border-2 border-[#5B4BDB] text-[#5B4BDB] font-bold text-sm hover:bg-[#5B4BDB]/5 transition-all">
                Apply as Mentor
              </button>
            </Link>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}
