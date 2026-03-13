"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";

interface Booking {
  id:          string;
  tutorId:     string;
  tutorName:   string;
  clientId:    string;
  clientName:  string;
  clientEmail: string;
  amount:      number;
  currency:    string;
  status:      "booked" | "completed" | "cancelled";
  message:     string;
  bookedAt:    any;
}

export default function BookingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      try {
        // Find bookings where the current user is the tutor
        const snap = await getDocs(query(collection(db, "tutorBookings"), where("tutorId", "==", u.uid)));
        const list: Booking[] = snap.docs.map(d => ({
          id: d.id, ...d.data()
        } as Booking));
        
        list.sort((a, b) => (b.bookedAt?.seconds ?? 0) - (a.bookedAt?.seconds ?? 0));
        setBookings(list);
      } catch (e) { console.error(e); }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  async function handleComplete(bookingId: string) {
    try {
      await updateDoc(doc(db, "tutorBookings", bookingId), { status: "completed" });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "completed" } : b));
    } catch (e) { console.error(e); }
  }

  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />

      <div className="relative z-10 pt-32 pb-24 px-4 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <Link href="/dashboard/developer">
            <p className="text-white/35 text-sm font-black mb-3 hover:text-white/60 transition">← Developer Dashboard</p>
          </Link>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-2">
            Mentorship <span className="text-cyan-400">Bookings</span>
          </h1>
          <p className="text-white/35 text-base">
            Manage your paid 1-on-1 sessions. Contact your clients to schedule the video call.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-black text-white mb-2">No Bookings Yet</h3>
            <p className="text-white/40 text-sm max-w-sm mx-auto">
              When clients book a session with you from the Connect page, they will appear here.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {bookings.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-6 rounded-2xl border border-white/6 bg-white/[0.02] hover:border-white/10 transition">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {b.status === "booked" && <span className="px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest">Action Required</span>}
                        {b.status === "completed" && <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-[10px] font-black uppercase tracking-widest">Completed</span>}
                        <span className="text-white/30 text-xs">
                          {b.bookedAt?.seconds ? new Date(b.bookedAt.seconds*1000).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <h3 className="text-white font-black text-lg">{b.clientName}</h3>
                      <p className="text-white/40 text-sm font-medium">{b.clientEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-white">{b.currency === "INR" ? "₹" : "$"}{b.amount}</p>
                      <p className="text-white/30 text-xs font-black uppercase tracking-widest">Paid via Razorpay</p>
                    </div>
                  </div>

                  {b.message && (
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] mb-5">
                      <p className="text-white/30 text-[10px] uppercase font-black tracking-widest mb-1.5">What they want to learn/build:</p>
                      <p className="text-white/80 text-sm leading-relaxed">{b.message}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <a href={`mailto:${b.clientEmail}`} className="flex-1 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-center text-sm font-bold text-white hover:bg-white/[0.08] transition">
                      ✉️ Email Client
                    </a>
                    {b.status === "booked" && (
                      <button onClick={() => handleComplete(b.id)} className="flex-1 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-bold hover:bg-cyan-500/20 transition">
                        ✓ Mark Completed
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
