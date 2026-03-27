"use client";
import { useState, useEffect } from "react";
import {
  collection, query, where, getDocs, addDoc,
  serverTimestamp, doc, getDoc,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Footer from "../components/Footer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────
interface Mentor {
  id: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  skills?: string[];
  hourlyRate?: number;
  rating?: number;
  totalSessions?: number;
  expertise?: string;
  experience?: string;
  linkedin?: string;
}

type SessionType = "1on1" | "group" | "doubt";

declare global { interface Window { Razorpay: any; } }

function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// ─── Pricing helpers ──────────────────────────────────────────────────────
function calc1on1Price(hourlyRate: number, durationMin: number) {
  return Math.round((hourlyRate * durationMin) / 60);
}

function calcGroupPerHead(hourlyRate: number, durationMin: number, seats: number) {
  const total = Math.round((hourlyRate * durationMin) / 60);
  return Math.round(total / seats);
}

// ─── Session booking modal ─────────────────────────────────────────────────
function BookingModal({ mentor, user, onClose, onSuccess }: {
  mentor: Mentor; user: any; onClose: () => void; onSuccess: (msg: string) => void;
}) {
  const [sessionType, setSessionType] = useState<SessionType>("1on1");
  const [topic,    setTopic]    = useState("");
  const [date,     setDate]     = useState("");
  const [duration, setDuration] = useState(60);
  const [message,  setMessage]  = useState("");
  const [loading,  setLoading]  = useState(false);

  // Group specific
  const [maxSeats,  setMaxSeats]  = useState(5);
  const [meetLink,  setMeetLink]  = useState("");

  const rate = mentor.hourlyRate ?? 500;
  const fee  = 0.15;

  const price = sessionType === "group"
    ? calcGroupPerHead(rate, duration, maxSeats)
    : calc1on1Price(rate, duration);

  const platformFee  = Math.round(price * fee);
  const mentorEarns  = price - platformFee;
  const totalGroupRevenue = sessionType === "group" ? price * maxSeats : price;

  const handleBook = async () => {
    if (!topic.trim()) return;
    if (sessionType !== "doubt" && !date) return;
    setLoading(true);

    try {
      const ok = await loadRazorpay();
      if (!ok) { onSuccess("Payment gateway failed to load."); setLoading(false); return; }

      const options = {
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      price * 100,
        currency:    "INR",
        name:        "SYNTHÉ",
        description: `${sessionType === "group" ? "Group" : sessionType === "doubt" ? "Doubt" : "1-on-1"} session with ${mentor.displayName}`,
        image:       "/logo.png",
        prefill: { name: user.displayName || "", email: user.email || "" },
        theme: { color: "#5B4BDB" },
        handler: async (response: any) => {
          const sessionData: Record<string, any> = {
            mentorId:    mentor.id,
            mentorName:  mentor.displayName,
            learnerId:   user.uid,
            learnerName: user.displayName || user.email,
            learnerEmail: user.email,
            sessionType,
            topic, duration, message,
            price, platformFee, mentorEarns,
            status:       "pending",
            paymentId:    response.razorpay_payment_id,
            paymentStatus: "paid",
            createdAt:    serverTimestamp(),
          };

          if (sessionType !== "doubt") sessionData.scheduledAt = new Date(date);
          if (sessionType === "group") {
            sessionData.maxSeats    = maxSeats;
            sessionData.pricePerHead = price;
            sessionData.totalRevenue = totalGroupRevenue;
            sessionData.registeredLearners = [{ uid: user.uid, name: user.displayName, email: user.email }];
            sessionData.meetLink = meetLink.trim() || `https://meet.jit.si/synthe-${mentor.id}-${Date.now()}`;
          }
          if (sessionType === "doubt") {
            sessionData.isOnDemand = true;
          }

          await addDoc(collection(db, "mentorSessions"), sessionData);
          await addDoc(collection(db, "notifications"), {
            userId:    user.uid,
            message:   `${sessionType === "group" ? "Group session" : sessionType === "doubt" ? "Doubt session" : "1-on-1 session"} booked with ${mentor.displayName}! ₹${price} paid.`,
            read:      false,
            createdAt: serverTimestamp(),
          });

          onSuccess(`Booked! ₹${price} paid. ${mentor.displayName} will confirm and share meet link shortly.`);
          onClose();
        },
        modal: { ondismiss: () => setLoading(false) },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      console.error("Booking error:", err);
      onSuccess("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 16);

  const SESSION_TYPES: { type: SessionType; label: string; icon: string; desc: string }[] = [
    { type: "1on1",  icon: "👤", label: "1-on-1 Private",   desc: "Private session, full attention" },
    { type: "group", icon: "👥", label: "Group Session",     desc: "Multiple learners, shared cost" },
    { type: "doubt", icon: "⚡", label: "Doubt Session",     desc: "Quick help, on-demand scheduled" },
  ];

  const DURATIONS = [30, 45, 60, 90];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] overflow-y-auto">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#5B4BDB]/10 flex items-center justify-center overflow-hidden">
                {mentor.photoURL
                  ? <img src={mentor.photoURL} className="w-full h-full object-cover" alt="" />
                  : <span className="text-[#5B4BDB] font-bold text-sm">{mentor.displayName?.charAt(0)}</span>}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{mentor.displayName}</p>
                <p className="text-xs text-gray-400">₹{rate}/hr · {mentor.experience}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">

            {/* Session type selector */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Session Type</label>
              <div className="grid grid-cols-3 gap-2">
                {SESSION_TYPES.map(st => (
                  <button key={st.type} type="button" onClick={() => setSessionType(st.type)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      sessionType === st.type
                        ? "border-[#5B4BDB] bg-[#5B4BDB]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <div className="text-xl mb-1">{st.icon}</div>
                    <p className={`text-xs font-bold ${sessionType === st.type ? "text-[#5B4BDB]" : "text-gray-700"}`}>{st.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{st.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Topic *</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder={sessionType === "doubt" ? "e.g. AR tracking issue in Unity..." : "e.g. Unity AR Foundation basics"}
                className="w-full border border-gray-200 focus:border-[#5B4BDB] rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors" />
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {DURATIONS.map(d => (
                  <button key={d} type="button" onClick={() => setDuration(d)}
                    className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                      duration === d ? "bg-[#5B4BDB] text-white border-[#4438b8]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}>{d}m</button>
                ))}
              </div>
            </div>

            {/* Group specific: max seats */}
            {sessionType === "group" && (
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Max Seats (you set group size)
                </label>
                <div className="flex items-center gap-3">
                  <input type="number" value={maxSeats} onChange={e => setMaxSeats(Math.max(2, Number(e.target.value)))}
                    min={2} max={50}
                    className="w-24 border border-gray-200 focus:border-[#5B4BDB] rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none transition-colors" />
                  <p className="text-xs text-gray-400">Learners can join until seats fill up</p>
                </div>
                <div className="mt-2 bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-800">
                  <p className="font-bold">Price breakdown for {maxSeats} seats:</p>
                  <p>Mentor total: ₹{calc1on1Price(rate, duration)} → Per head: ₹{calcGroupPerHead(rate, duration, maxSeats)}</p>
                </div>
              </div>
            )}

            {/* Date & time (not for doubt) */}
            {sessionType !== "doubt" && (
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  {sessionType === "group" ? "Session Date & Time *" : "Preferred Date & Time *"}
                </label>
                <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} min={minDate}
                  className="w-full border border-gray-200 focus:border-[#5B4BDB] rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none transition-colors" />
              </div>
            )}

            {sessionType === "doubt" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <p className="font-bold">⚡ On-demand doubt session</p>
                <p className="mt-0.5">Mentor will respond and schedule at their earliest availability. Usually within a few hours.</p>
              </div>
            )}

            {/* Meet link for group */}
            {sessionType === "group" && (
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Meet Link (optional)</label>
                <input value={meetLink} onChange={e => setMeetLink(e.target.value)}
                  placeholder="Leave blank to auto-generate Jitsi link"
                  className="w-full border border-gray-200 focus:border-[#5B4BDB] rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors" />
              </div>
            )}

            {/* Message */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Message (optional)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2}
                placeholder="Share your background or specific questions..."
                className="w-full border border-gray-200 focus:border-[#5B4BDB] rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors resize-none" />
            </div>

            {/* Price summary */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-1.5 text-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Price breakdown</p>
              {sessionType === "group" ? (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>Mentor rate ({duration}min)</span>
                    <span>₹{calc1on1Price(rate, duration)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>÷ {maxSeats} learners</span>
                    <span className="font-bold text-[#5B4BDB]">₹{price} per head</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-xs">
                    <span>Platform fee (15%)</span>
                    <span>₹{platformFee}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-xs">
                    <span>Mentor earns (if full)</span>
                    <span>₹{Math.round(mentorEarns * maxSeats)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>Session ({duration} min)</span>
                    <span>₹{price}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-xs">
                    <span>Platform fee (15%)</span>
                    <span>₹{platformFee}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-xs">
                    <span>Mentor earns</span>
                    <span>₹{mentorEarns}</span>
                  </div>
                </>
              )}
              <div className="h-px bg-gray-200 my-1" />
              <div className="flex justify-between font-black text-gray-900">
                <span>You pay</span>
                <span className="text-[#5B4BDB]">₹{price}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition">Cancel</button>
            <button onClick={handleBook} disabled={loading || !topic.trim() || (sessionType !== "doubt" && !date)}
              className="flex-1 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] disabled:opacity-40 transition active:translate-y-[1px]">
              {loading ? "Processing…" : `Pay ₹${price}`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Mentor card ──────────────────────────────────────────────────────────
function MentorCard({ mentor, onBook, canBook }: {
  mentor: Mentor; onBook: () => void; canBook: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div whileHover={{ y: -2 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-[#5B4BDB]/10 overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl">
          {mentor.photoURL
            ? <img src={mentor.photoURL} alt={mentor.displayName} className="w-full h-full object-cover" />
            : <span>👤</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-black text-gray-900">{mentor.displayName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{mentor.expertise}</p>
            </div>
            <span className="text-sm font-black text-[#5B4BDB] shrink-0">₹{mentor.hourlyRate}/hr</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {mentor.rating && (
              <span className="text-xs text-amber-600 font-bold">⭐ {mentor.rating.toFixed(1)}</span>
            )}
            <span className="text-xs text-gray-400">{mentor.totalSessions ?? 0} sessions</span>
            {mentor.experience && (
              <span className="text-xs text-gray-400">· {mentor.experience}</span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <p className={`text-xs text-gray-600 leading-relaxed mb-3 ${expanded ? "" : "line-clamp-2"}`}>{mentor.bio}</p>
      {mentor.bio && mentor.bio.length > 100 && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-[#5B4BDB] font-semibold mb-3 text-left">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {/* Skills */}
      <div className="flex flex-wrap gap-1 mb-4">
        {mentor.skills?.slice(0, 5).map(s => (
          <span key={s} className="text-xs bg-[#5B4BDB]/8 text-[#5B4BDB] px-2 py-0.5 rounded-full font-medium border border-[#5B4BDB]/15">{s}</span>
        ))}
      </div>

      {/* Session type quick prices */}
      <div className="bg-gray-50 rounded-xl p-3 mb-4 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "1-on-1", price: calc1on1Price(mentor.hourlyRate ?? 500, 60) },
          { label: "Group/head", price: calcGroupPerHead(mentor.hourlyRate ?? 500, 60, 5) },
          { label: "Doubt", price: calc1on1Price(mentor.hourlyRate ?? 500, 30) },
        ].map(item => (
          <div key={item.label}>
            <p className="text-xs text-gray-400">{item.label}</p>
            <p className="text-sm font-bold text-gray-800">₹{item.price}</p>
          </div>
        ))}
      </div>

      {canBook ? (
        <button onClick={onBook}
          className="w-full py-2.5 bg-[#5B4BDB] border-b-[3px] border-[#4438b8] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all">
          Book a Session
        </button>
      ) : (
        <Link href="/join">
          <button className="w-full py-2.5 bg-gray-100 text-gray-500 text-sm font-bold rounded-xl hover:bg-gray-200 transition-all">
            Apply as Learner to book
          </button>
        </Link>
      )}
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function HirePage() {
  const [user, setUser]         = useState<any>(null);
  const [userRole, setUserRole] = useState("");
  const [mentors, setMentors]   = useState<Mentor[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [bookingMentor, setBookingMentor] = useState<Mentor | null>(null);
  const [toast, setToast]       = useState("");
  const [skillFilter, setSkillFilter] = useState("All");

  const ALL_SKILLS = ["All", "Unity", "WebXR", "Blender", "ARCore", "ARKit", "Unreal", "Three.js", "Meta Quest"];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u ?? null);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setUserRole(snap.data().role ?? "");
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "mentor"));
        const snap = await getDocs(q);
        setMentors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Mentor)));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch_();
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 5000); };

  const canBook = ["learner", "developer", "admin"].includes(userRole);

  const filtered = mentors.filter(m => {
    const matchSearch = !search || m.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      m.expertise?.toLowerCase().includes(search.toLowerCase()) ||
      m.skills?.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchSkill = skillFilter === "All" || m.skills?.includes(skillFilter);
    return matchSearch && matchSkill;
  });

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col font-sans">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl max-w-sm text-center">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking modal */}
      {bookingMentor && user && (
        <BookingModal mentor={bookingMentor} user={user}
          onClose={() => setBookingMentor(null)} onSuccess={showToast} />
      )}

      {/* Hero */}
      <section className="pt-28 pb-12 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-3">Verified Mentors</p>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Book a Session
          </h1>
          <p className="text-gray-500 text-lg max-w-lg mx-auto mb-8">
            1-on-1 private coaching, group sessions (shared cost), or instant doubt sessions — all with verified XR experts.
          </p>

          {/* Session type explainer */}
          <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto mb-6">
            {[
              { icon: "👤", type: "1-on-1 Private", desc: "Full attention, your pace" },
              { icon: "👥", type: "Group Session", desc: "Learn together, split cost" },
              { icon: "⚡", type: "Doubt Session", desc: "Quick help, on-demand" },
            ].map(item => (
              <div key={item.type} className="bg-white border border-gray-200 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
                <span className="text-2xl">{item.icon}</span>
                <div className="text-left">
                  <p className="text-sm font-black text-gray-900">{item.type}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-16 flex-grow w-full">

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, skill, or expertise..."
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#5B4BDB] transition-colors" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {ALL_SKILLS.map(s => (
              <button key={s} onClick={() => setSkillFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  skillFilter === s ? "bg-[#5B4BDB] text-white border-[#4438b8]" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">🧑‍🏫</p>
            <p className="font-black text-gray-900 mb-2">{mentors.length === 0 ? "No mentors yet" : "No mentors match"}</p>
            <p className="text-gray-500 text-sm">Check back soon — we're onboarding verified XR mentors.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(m => (
              <MentorCard key={m.id} mentor={m} canBook={canBook}
                onBook={() => { setBookingMentor(m); }} />
            ))}
          </div>
        )}

        {/* Become a mentor CTA */}
        <div className="mt-16 bg-[#0F6E56] rounded-3xl p-8 md:p-12 text-white text-center">
          <div className="text-5xl mb-4">🧑‍🏫</div>
          <h2 className="text-2xl font-black mb-2">Are you an XR expert?</h2>
          <p className="text-[#E1F5EE] mb-6 max-w-md mx-auto text-sm">Join SYNTHÉ as a verified mentor. Set your own rates, host 1-on-1 and group sessions, and earn 85% on every booking.</p>
          <Link href="/join">
            <button className="px-8 py-3.5 bg-white text-[#0F6E56] font-black rounded-xl hover:bg-gray-50 transition-all">
              Apply as Mentor →
            </button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}