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
          className="bg-[#141420] border-2 border-[#2A2A3E] rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden max-h-[92vh] overflow-y-auto custom-scrollbar">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b-2 border-[#2A2A3E] sticky top-0 bg-[#141420]/95 backdrop-blur-sm z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0A0A0F] border border-[#2A2A3E] flex items-center justify-center overflow-hidden">
                {mentor.photoURL
                  ? <img src={mentor.photoURL} className="w-full h-full object-cover" alt="" />
                  : <span className="text-[#7C6EF6] font-black">{mentor.displayName?.charAt(0)}</span>}
              </div>
              <div>
                <p className="font-black text-white text-base leading-tight">{mentor.displayName}</p>
                <p className="text-xs text-[#9494AD] font-bold mt-0.5">₹{rate}/hr · {mentor.experience}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#0A0A0F] border border-[#2A2A3E] hover:border-[#5B4BDB]/50 hover:text-white text-[#9494AD] transition-colors">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="px-6 py-6 space-y-6">

            {/* Session type selector */}
            <div>
              <label className="text-[10px] font-black text-[#6B6B85] uppercase tracking-widest mb-3 block">Session Type</label>
              <div className="grid grid-cols-3 gap-3">
                {SESSION_TYPES.map(st => (
                  <button key={st.type} type="button" onClick={() => setSessionType(st.type)}
                    className={`p-3 rounded-2xl border-2 text-center transition-all ${
                      sessionType === st.type
                        ? "border-[#5B4BDB] bg-[#5B4BDB]/10 shadow-[0_0_15px_rgba(91,75,219,0.15)]"
                        : "border-[#2A2A3E] bg-[#0A0A0F] hover:border-[#5B4BDB]/50"
                    }`}>
                    <div className="text-2xl mb-2 filter hue-rotate-15">{st.icon}</div>
                    <p className={`text-xs font-black ${sessionType === st.type ? "text-white" : "text-[#9494AD]"}`}>{st.label}</p>
                    <p className="text-[9px] text-[#6B6B85] font-bold mt-1 leading-tight">{st.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="text-[10px] font-black text-[#6B6B85] uppercase tracking-widest mb-2 block">Topic *</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder={sessionType === "doubt" ? "e.g. AR tracking issue in Unity..." : "e.g. Unity AR Foundation basics"}
                className="w-full bg-[#0A0A0F] border-2 border-[#2A2A3E] focus:border-[#5B4BDB] rounded-xl px-5 py-3 text-sm text-white placeholder-[#6B6B85] outline-none transition-all shadow-inner" />
            </div>

            {/* Duration */}
            <div>
              <label className="text-[10px] font-black text-[#6B6B85] uppercase tracking-widest mb-2 block">Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {DURATIONS.map(d => (
                  <button key={d} type="button" onClick={() => setDuration(d)}
                    className={`py-2.5 rounded-xl text-sm font-black border-2 transition-all ${
                      duration === d ? "bg-[#5B4BDB] text-white border-[#5B4BDB] shadow-[0_0_10px_rgba(91,75,219,0.3)]" : "bg-[#0A0A0F] text-[#9494AD] border-[#2A2A3E] hover:border-[#5B4BDB]/50"
                    }`}>{d}m</button>
                ))}
              </div>
            </div>

            {/* Group specific: max seats */}
            {sessionType === "group" && (
              <div>
                <label className="text-[10px] font-black text-[#6B6B85] uppercase tracking-widest mb-2 block">
                  Max Seats (you set group size)
                </label>
                <div className="flex items-center gap-4">
                  <input type="number" value={maxSeats} onChange={e => setMaxSeats(Math.max(2, Number(e.target.value)))}
                    min={2} max={50}
                    className="w-24 bg-[#0A0A0F] border-2 border-[#2A2A3E] focus:border-[#5B4BDB] rounded-xl px-4 py-3 text-sm text-white font-bold outline-none transition-colors" />
                  <p className="text-xs text-[#9494AD] font-medium">Learners can join until seats fill up</p>
                </div>
                <div className="mt-3 bg-teal-500/10 border border-teal-500/30 rounded-xl p-3 text-xs text-teal-400">
                  <p className="font-black mb-0.5">Price breakdown for {maxSeats} seats:</p>
                  <p className="font-medium">Mentor total: ₹{calc1on1Price(rate, duration)} → Per head: ₹{calcGroupPerHead(rate, duration, maxSeats)}</p>
                </div>
              </div>
            )}

            {/* Date & time (not for doubt) */}
            {sessionType !== "doubt" && (
              <div>
                <label className="text-[10px] font-black text-[#6B6B85] uppercase tracking-widest mb-2 block">
                  {sessionType === "group" ? "Session Date & Time *" : "Preferred Date & Time *"}
                </label>
                <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} min={minDate}
                  className="w-full bg-[#0A0A0F] border-2 border-[#2A2A3E] focus:border-[#5B4BDB] rounded-xl px-5 py-3 text-sm text-white outline-none transition-all shadow-inner [color-scheme:dark]" />
              </div>
            )}

            {sessionType === "doubt" && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-400 flex items-start gap-3">
                <span className="text-xl">⚡</span>
                <div>
                  <p className="font-black mb-0.5">On-demand doubt session</p>
                  <p className="font-medium leading-relaxed">Mentor will respond and schedule at their earliest availability. Usually within a few hours.</p>
                </div>
              </div>
            )}

            {/* Meet link for group */}
            {sessionType === "group" && (
              <div>
                <label className="text-[10px] font-black text-[#6B6B85] uppercase tracking-widest mb-2 block">Meet Link (optional)</label>
                <input value={meetLink} onChange={e => setMeetLink(e.target.value)}
                  placeholder="Leave blank to auto-generate Jitsi link"
                  className="w-full bg-[#0A0A0F] border-2 border-[#2A2A3E] focus:border-[#5B4BDB] rounded-xl px-5 py-3 text-sm text-white placeholder-[#6B6B85] outline-none transition-all shadow-inner" />
              </div>
            )}

            {/* Message */}
            <div>
              <label className="text-[10px] font-black text-[#6B6B85] uppercase tracking-widest mb-2 block">Message (optional)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2}
                placeholder="Share your background or specific questions..."
                className="w-full bg-[#0A0A0F] border-2 border-[#2A2A3E] focus:border-[#5B4BDB] rounded-xl px-5 py-3 text-sm text-white placeholder-[#6B6B85] outline-none transition-all shadow-inner resize-none" />
            </div>

            {/* Price summary */}
            <div className="bg-[#0A0A0F] border-2 border-[#2A2A3E] rounded-2xl p-5 space-y-2 text-sm">
              <p className="text-[10px] font-black text-[#6B6B85] uppercase tracking-widest mb-3">Price breakdown</p>
              {sessionType === "group" ? (
                <>
                  <div className="flex justify-between text-[#9494AD] font-medium">
                    <span>Mentor rate ({duration}min)</span>
                    <span>₹{calc1on1Price(rate, duration)}</span>
                  </div>
                  <div className="flex justify-between text-[#9494AD] font-medium">
                    <span>÷ {maxSeats} learners</span>
                    <span className="font-black text-[#7C6EF6]">₹{price} per head</span>
                  </div>
                  <div className="flex justify-between text-[#6B6B85] text-xs font-medium">
                    <span>Platform fee (15%)</span>
                    <span>₹{platformFee}</span>
                  </div>
                  <div className="flex justify-between text-[#6B6B85] text-xs font-medium">
                    <span>Mentor earns (if full)</span>
                    <span>₹{Math.round(mentorEarns * maxSeats)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-[#9494AD] font-medium">
                    <span>Session ({duration} min)</span>
                    <span>₹{price}</span>
                  </div>
                  <div className="flex justify-between text-[#6B6B85] text-xs font-medium">
                    <span>Platform fee (15%)</span>
                    <span>₹{platformFee}</span>
                  </div>
                  <div className="flex justify-between text-[#6B6B85] text-xs font-medium">
                    <span>Mentor earns</span>
                    <span>₹{mentorEarns}</span>
                  </div>
                </>
              )}
              <div className="h-px bg-[#2A2A3E] my-3" />
              <div className="flex justify-between font-black text-white text-base">
                <span>You pay</span>
                <span className="text-[#10B981]">₹{price}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3.5 rounded-xl border-2 border-[#2A2A3E] bg-[#0A0A0F] text-[#9494AD] font-black text-sm hover:text-white transition-colors">Cancel</button>
            <button onClick={handleBook} disabled={loading || !topic.trim() || (sessionType !== "doubt" && !date)}
              className="flex-[2] py-3.5 rounded-xl bg-[#5B4BDB] text-white font-black text-sm hover:bg-[#4c3ec7] disabled:bg-[#2A2A3E] disabled:text-[#6B6B85] shadow-[0_0_20px_rgba(91,75,219,0.3)] disabled:shadow-none transition-all active:scale-[0.98]">
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
    <motion.div whileHover={{ y: -4, borderColor: "rgba(91,75,219,0.5)" }} transition={{ duration: 0.2 }}
      className="bg-[#141420] rounded-3xl border-2 border-[#2A2A3E] shadow-sm p-6 flex flex-col group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#5B4BDB]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"/>
      
      <div className="flex items-start gap-4 mb-5 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-[#0A0A0F] border-2 border-[#2A2A3E] overflow-hidden flex-shrink-0 flex items-center justify-center text-3xl shadow-inner group-hover:border-[#5B4BDB]/30 transition-colors">
          {mentor.photoURL
            ? <img src={mentor.photoURL} alt={mentor.displayName} className="w-full h-full object-cover" />
            : <span className="text-[#7C6EF6] font-black text-xl">{mentor.displayName?.charAt(0)}</span>}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-black text-white text-lg leading-tight truncate">{mentor.displayName}</p>
              <p className="text-xs font-bold text-[#5B4BDB] uppercase tracking-wide mt-1 truncate">{mentor.expertise}</p>
            </div>
            <span className="text-sm font-black text-[#10B981] shrink-0 bg-[#10B981]/10 px-2.5 py-1 rounded-lg border border-[#10B981]/20">₹{mentor.hourlyRate}/h</span>
          </div>
          <div className="flex items-center gap-2.5 mt-2.5">
            {mentor.rating && (
              <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">⭐ {mentor.rating.toFixed(1)}</span>
            )}
            <span className="text-[10px] uppercase font-bold text-[#6B6B85]">{mentor.totalSessions ?? 0} sessions</span>
            {mentor.experience && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#2A2A3E]" />
                <span className="text-[10px] uppercase font-bold text-[#6B6B85]">{mentor.experience}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <p className={`text-sm text-[#9494AD] font-medium leading-relaxed mb-4 relative z-10 ${expanded ? "" : "line-clamp-2"}`}>{mentor.bio}</p>
      {mentor.bio && mentor.bio.length > 100 && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-[#7C6EF6] font-black mb-4 text-left hover:underline w-fit relative z-10">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-5 relative z-10">
        {mentor.skills?.slice(0, 5).map(s => (
          <span key={s} className="text-[10px] font-bold uppercase tracking-wide bg-[#2A2A3E]/50 text-white px-2.5 py-1 rounded-lg border border-[#2A2A3E]">{s}</span>
        ))}
      </div>

      {/* Session type quick prices */}
      <div className="bg-[#0A0A0F] border border-[#2A2A3E] rounded-2xl p-4 mb-5 grid grid-cols-3 gap-2 text-center relative z-10 group-hover:border-[#5B4BDB]/20 transition-colors">
        {[
          { label: "1-on-1", price: calc1on1Price(mentor.hourlyRate ?? 500, 60), icon: "👤" },
          { label: "Group/hd", price: calcGroupPerHead(mentor.hourlyRate ?? 500, 60, 5), icon: "👥" },
          { label: "Doubt", price: calc1on1Price(mentor.hourlyRate ?? 500, 30), icon: "⚡" },
        ].map(item => (
          <div key={item.label}>
            <p className="text-[10px] font-bold text-[#6B6B85] uppercase tracking-wide mb-1 flex items-center justify-center gap-1"><span className="text-xs">{item.icon}</span> {item.label}</p>
            <p className="text-sm font-black text-white">₹{item.price}</p>
          </div>
        ))}
      </div>

      {canBook ? (
        <button onClick={onBook}
          className="w-full mt-auto py-3.5 bg-[#5B4BDB] text-white text-sm font-black rounded-xl hover:bg-[#4c3ec7] shadow-[0_0_15px_rgba(91,75,219,0.3)] transition-all active:scale-[0.98] relative z-10">
          Book a Session
        </button>
      ) : (
        <Link href="/join" className="w-full mt-auto relative z-10">
          <button className="w-full py-3.5 bg-[#0A0A0F] border-2 border-[#2A2A3E] text-[#9494AD] text-sm font-black rounded-xl hover:border-[#5B4BDB]/50 hover:text-white transition-all">
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
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#141420] border-2 border-[#5B4BDB]/30 text-white text-sm font-black px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(91,75,219,0.3)] max-w-md text-center">
            <span className="mr-2 filter hue-rotate-15">✨</span>
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
      <section className="pt-36 pb-16 px-4 text-center relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#5B4BDB]/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-block px-4 py-1.5 rounded-full border border-[#5B4BDB]/30 bg-[#5B4BDB]/5 text-[#7C6EF6] text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            Verified Mentors
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
            Book a Session
          </h1>
          <p className="text-[#9494AD] text-lg max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            1-on-1 private coaching, group sessions (shared cost), or instant doubt resolution — all with verified XR industry professionals.
          </p>

          {/* Session type explainer */}
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {[
              { icon: "👤", type: "1-on-1 Private", desc: "Full attention, your pace" },
              { icon: "👥", type: "Group Session", desc: "Learn together, split cost" },
              { icon: "⚡", type: "Doubt Session", desc: "Quick help, on-demand" },
            ].map((item, i) => (
              <motion.div key={item.type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-[#141420] border-2 border-[#2A2A3E] rounded-3xl px-6 py-4 flex items-center gap-4 shadow-sm hover:border-[#5B4BDB]/30 transition-colors group">
                <div className="w-12 h-12 rounded-2xl bg-[#0A0A0F] border border-[#2A2A3E] flex items-center justify-center text-2xl filter hue-rotate-15 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-white mb-0.5">{item.type}</p>
                  <p className="text-[10px] font-bold text-[#6B6B85] uppercase tracking-wide">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-24 flex-grow w-full relative z-10">

        {/* Search + filter */}
        <div className="flex flex-col lg:flex-row gap-4 mb-10 items-center justify-between bg-[#141420] p-4 rounded-3xl border-2 border-[#2A2A3E] shadow-xl">
          <div className="relative w-full lg:max-w-md">
            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B85]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, skill, or expertise..."
              className="w-full bg-[#0A0A0F] border-2 border-[#2A2A3E] rounded-2xl pl-12 pr-5 py-3.5 text-sm text-white font-medium placeholder-[#6B6B85] outline-none focus:border-[#5B4BDB] transition-all shadow-inner" />
          </div>
          <div className="flex gap-2.5 flex-wrap justify-end w-full lg:w-auto">
            {ALL_SKILLS.map(s => (
              <button key={s} onClick={() => setSkillFilter(s)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-[0.95] ${
                  skillFilter === s 
                    ? "bg-[#5B4BDB] text-white border-[#5B4BDB] shadow-[0_0_15px_rgba(91,75,219,0.3)]" 
                    : "bg-[#0A0A0F] text-[#9494AD] border-[#2A2A3E] hover:border-[#5B4BDB]/50 hover:text-white"
                }`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-72 bg-[#141420] border-2 border-[#2A2A3E] rounded-3xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 bg-[#141420] rounded-[3rem] border-2 border-[#2A2A3E] border-dashed">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-[#0A0A0F] border-2 border-[#2A2A3E] flex items-center justify-center mb-6 shadow-inner">
              <span className="text-5xl filter hue-rotate-15">🧑‍🏫</span>
            </div>
            <p className="text-2xl font-black text-white mb-2">{search || skillFilter!=="All" ? "No mentors match" : "No mentors yet"}</p>
            <p className="text-[#9494AD] font-medium max-w-md mx-auto">Check back soon or try adjusting your filters — we're constantly onboarding verified XR mentors.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(m => (
              <MentorCard key={m.id} mentor={m} canBook={canBook}
                onBook={() => { setBookingMentor(m); }} />
            ))}
          </div>
        )}

        {/* Become a mentor CTA */}
        <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}}
          className="mt-24 relative rounded-[3rem] overflow-hidden bg-[#141420] border-2 border-[#2A2A3E] group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#5B4BDB]/20 to-cyan-500/10 opacity-50"/>
          
          <div className="relative px-8 py-16 md:py-24 text-center z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-[#0A0A0F] border-2 border-[#2A2A3E] flex items-center justify-center text-4xl shadow-inner mb-6 filter hue-rotate-15 group-hover:scale-110 transition-transform duration-500">
              🧑‍🏫
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Are you an XR expert?</h2>
            <p className="text-[#9494AD] mb-10 max-w-xl mx-auto text-lg font-medium leading-relaxed">
              Join SYNTHÉ as a verified mentor. Set your own rates, host 1-on-1 and group sessions, and keep <span className="text-white font-black">85%</span> of every booking.
            </p>
            <Link href="/join">
              <button className="px-10 py-5 bg-[#5B4BDB] text-white font-black text-lg rounded-2xl hover:bg-[#4c3ec7] shadow-[0_0_30px_rgba(91,75,219,0.3)] hover:shadow-[0_0_50px_rgba(91,75,219,0.5)] hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-3">
                Apply as Mentor
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
            </Link>
          </div>
          
          {/* Decorative gradients */}
          <div className="absolute -bottom-1/2 -left-1/4 w-[500px] h-[500px] bg-[#5B4BDB]/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
        </motion.div>

      </div>
      <Footer />
    </div>
  );
}