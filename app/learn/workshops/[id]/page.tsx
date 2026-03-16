"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc, getDoc, updateDoc, arrayUnion, serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Workshop, UserRole } from "../../../../types/gallery";

function formatDate(ts: any): string {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function WorkshopDetailPage() {
  const params    = useParams();
  const router    = useRouter();
  const id        = params?.id as string;

  const [workshop,  setWorkshop]  = useState<Workshop | null>(null);
  const [user,      setUser]      = useState<any>(null);
  const [userRole,  setUserRole]  = useState<UserRole>("user");
  const [loading,   setLoading]   = useState(true);
  const [working,   setWorking]   = useState(false);
  const [toast,     setToast]     = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setUserRole(snap.data().role as UserRole ?? "user");
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, "workshops", id));
        if (!snap.exists()) { router.push("/learn"); return; }
        setWorkshop({ id: snap.id, ...snap.data() } as Workshop);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const isRegistered  = user && workshop?.registeredUsers?.includes(user.uid);
  const isFull        = (workshop?.registeredUsers?.length ?? 0) >= (workshop?.maxSeats ?? 0);
  const isPast        = workshop?.status === "ended";
  const isHost        = user && workshop?.hostId === user.uid;
  const canRegister   = ["learner", "developer", "mentor", "admin"].includes(userRole);
  const seatsLeft     = Math.max((workshop?.maxSeats ?? 0) - (workshop?.registeredUsers?.length ?? 0), 0);

  const handleRegister = async () => {
    if (!user || !workshop) return;
    setWorking(true);
    try {
      await updateDoc(doc(db, "workshops", workshop.id), {
        registeredUsers: arrayUnion(user.uid),
      });
      setWorkshop(prev => prev ? {
        ...prev,
        registeredUsers: [...(prev.registeredUsers ?? []), user.uid],
      } : prev);
      showToast("Registered! Meet link is now visible below.");
    } catch (err) {
      showToast("Something went wrong. Try again.");
    } finally {
      setWorking(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-2/3" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
          <div className="h-48 bg-gray-200 rounded-2xl animate-pulse mt-6" />
        </div>
      </div>
    );
  }

  if (!workshop) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl"
        >
          {toast}
        </motion.div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-14 flex-grow w-full">

        <Link href="/learn"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-semibold mb-6 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to Learn
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-5">

          {/* Status badges + tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {workshop.status === "live" && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live now
              </span>
            )}
            {workshop.status === "ended" && (
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">Ended</span>
            )}
            {workshop.tags?.map(t => (
              <span key={t} className="px-2.5 py-1 rounded-full bg-[#5B4BDB]/10 text-[#5B4BDB] text-xs font-semibold">
                {t}
              </span>
            ))}
          </div>

          <h1 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{workshop.title}</h1>
          {workshop.description && (
            <p className="text-gray-500 text-sm leading-relaxed mb-5">{workshop.description}</p>
          )}

          {/* Host */}
          <div className="flex items-center gap-3 pb-5 border-b border-gray-100 mb-5">
            <div className="w-10 h-10 rounded-full bg-[#5B4BDB]/10 flex items-center justify-center overflow-hidden">
              {workshop.hostPhoto
                ? <img src={workshop.hostPhoto} className="w-full h-full object-cover" alt="" />
                : <span className="text-[#5B4BDB] font-bold">{workshop.hostName?.charAt(0)}</span>
              }
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{workshop.hostName}</p>
              <p className="text-xs text-gray-400">Session host</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Date & time",  value: formatDate(workshop.date) },
              { label: "Duration",     value: `${workshop.duration} min` },
              { label: "Seats left",   value: isPast ? "—" : `${seatsLeft} / ${workshop.maxSeats}` },
              { label: "Price",        value: workshop.price === 0 ? "Free" : `₹${workshop.price}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Meet link — only visible after registration */}
        {isRegistered && workshop.meetLink && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-600 text-lg">🔗</span>
              <p className="font-black text-green-800">You're registered — here's your link</p>
            </div>
            <a href={workshop.meetLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-all">
              Join session
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
            <p className="text-green-700 text-xs mt-2">Don't share this link publicly</p>
          </motion.div>
        )}

        {/* CTA card */}
        {!isPast && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {!user ? (
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-4">Sign in to register for this session</p>
                <Link href="/login">
                  <button className="px-8 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8]">
                    Sign in
                  </button>
                </Link>
              </div>
            ) : !canRegister ? (
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-4">Apply as a Learner to join sessions</p>
                <Link href="/join">
                  <button className="px-8 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8]">
                    Apply as Learner
                  </button>
                </Link>
              </div>
            ) : isRegistered ? (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-2xl mx-auto mb-3">✅</div>
                <p className="font-bold text-gray-900 mb-1">You're registered</p>
                <p className="text-gray-500 text-sm">Meet link is shown above. See you there!</p>
              </div>
            ) : isFull ? (
              <div className="text-center">
                <p className="text-gray-500 text-sm">This session is full</p>
              </div>
            ) : isHost ? (
              <div className="text-center">
                <p className="font-bold text-gray-900 mb-1">You're hosting this session</p>
                <p className="text-gray-500 text-sm">
                  {workshop.registeredUsers?.length ?? 0} participant{workshop.registeredUsers?.length !== 1 ? "s" : ""} registered
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-black text-gray-900 text-lg">
                      {workshop.price === 0 ? "Free session" : `₹${workshop.price}`}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">{seatsLeft} seats remaining</p>
                  </div>
                  <button
                    onClick={handleRegister}
                    disabled={working}
                    className="px-7 py-3.5 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all active:translate-y-[1px] disabled:opacity-50"
                  >
                    {working ? "Registering..." : workshop.price === 0 ? "Register free" : `Register · ₹${workshop.price}`}
                  </button>
                </div>
                {/* Seats bar */}
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#5B4BDB] transition-all"
                    style={{ width: `${Math.min(((workshop.registeredUsers?.length ?? 0) / workshop.maxSeats) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}