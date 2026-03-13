"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
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
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <div className="relative z-10 pt-32 pb-24 px-4 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <Link href="/dashboard/developer">
            <p className="text-gray-500 text-sm font-bold mb-3 hover:text-gray-900 transition flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Developer Dashboard
            </p>
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            Mentorship <span className="text-blue-600">Bookings</span>
          </h1>
          <p className="text-gray-500 text-base font-medium">
            Manage your paid 1-on-1 sessions. Contact your clients to schedule the video call.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white border border-gray-200 shadow-sm rounded-3xl">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 mx-auto text-3xl mb-5 shadow-sm">
              📅
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">No Bookings Yet</h3>
            <p className="text-gray-500 font-medium text-sm max-w-sm mx-auto">
              When clients book a session with you from the Connect page, they will appear here.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-5">
            <AnimatePresence>
              {bookings.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition duration-200">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {b.status === "booked" && <span className="px-2.5 py-1 rounded-md border border-green-200 bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-widest shadow-sm">Action Required</span>}
                        {b.status === "completed" && <span className="px-2.5 py-1 rounded-md border border-gray-200 bg-gray-50 text-gray-500 text-[9px] font-black uppercase tracking-widest shadow-sm">Completed</span>}
                        <span className="text-gray-400 font-bold text-xs">
                          {b.bookedAt?.seconds ? new Date(b.bookedAt.seconds*1000).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <h3 className="text-gray-900 font-extrabold text-lg">{b.clientName}</h3>
                      <p className="text-gray-500 text-sm font-medium">{b.clientEmail}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-2xl font-black text-gray-900">{b.currency === "INR" ? "₹" : "$"}{b.amount}</p>
                      <span className="px-2 py-0.5 mt-1 rounded bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-widest border border-blue-100">Paid via Razorpay</span>
                    </div>
                  </div>

                  {b.message && (
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 mb-5 shadow-sm">
                      <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1.5">What they want to learn/build:</p>
                      <p className="text-gray-700 text-sm font-medium leading-relaxed">{b.message}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <a href={`mailto:${b.clientEmail}`} className="flex-1 py-3 rounded-xl bg-gray-50 border border-gray-200 text-center text-sm font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900 shadow-sm transition">
                      ✉️ Email Client
                    </a>
                    {b.status === "booked" && (
                      <button onClick={() => handleComplete(b.id)} className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 border border-green-700 shadow-sm text-white text-sm font-bold transition">
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
