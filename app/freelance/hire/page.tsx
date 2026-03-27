"use client";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Footer from "../../components/Footer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Mentor {
  id: string; displayName: string; photoURL: string; bio: string;
  skills: string[]; hourlyRate: number; rating: number;
  totalSessions: number; certified: boolean;
  availability: "available" | "busy" | "unavailable";
  portfolio: string; experience: string; expertise: string;
}

const EXPERTISE_FILTERS = ["All","Unity","Unreal","WebXR","Blender","ARCore","ARKit","Three.js","Career","Portfolio Review"];
const DURATIONS = [30, 45, 60, 90, 120];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 20 20" fill={i <= Math.round(rating) ? "#f59e0b" : "#e5e7eb"}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">{(rating||0).toFixed(1)}</span>
    </div>
  );
}

function BookingModal({ mentor, user, onClose }: { mentor: Mentor; user: any; onClose: () => void }) {
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState(60);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const total = Math.round((mentor.hourlyRate * duration) / 60);
  const mentorEarns = Math.round(total * 0.85);
  const platformFee = total - mentorEarns;

  const handleBook = async () => {
    if (!topic.trim() || !date) { setError("Fill all required fields"); return; }
    setSubmitting(true); setError("");
    try {
      if (total > 0) {
        // Razorpay payment
        setPaying(true);
        const orderRes = await fetch("/api/create-order", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: total, type: "mentorship" }),
        });
        if (!orderRes.ok) throw new Error("Order creation failed");
        const { orderId, amount, currency } = await orderRes.json();
        const rzp = new (window as any).Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount, currency, name: "SYNTHÉ Mentorship",
          description: `${duration} min session with ${mentor.displayName}`,
          order_id: orderId,
          handler: async (response: any) => {
            await createSession(response.razorpay_order_id, response.razorpay_payment_id, total);
          },
          prefill: { email: user.email ?? "" },
          theme: { color: "#5B4BDB" },
        });
        rzp.open();
        setPaying(false);
      } else {
        await createSession("free", "free", 0);
      }
    } catch (e) { setError((e as Error).message); }
    setSubmitting(false); setPaying(false);
  };

  const createSession = async (orderId: string, paymentId: string, amount: number) => {
    const userSnap = await getDoc(doc(db, "users", user.uid));
    const userData = userSnap.exists() ? userSnap.data() : { displayName: "Learner", photoURL: "" };
    await addDoc(collection(db, "mentorshipSessions"), {
      mentorId: mentor.id, mentorName: mentor.displayName, mentorPhoto: mentor.photoURL,
      learnerId: user.uid, learnerName: userData.displayName || user.email, learnerPhoto: userData.photoURL || "",
      topic: topic.trim(), message: message.trim(),
      scheduledDate: date, duration,
      totalAmount: amount, mentorEarns: Math.round(amount * 0.85),
      paymentId, orderId,
      status: "pending", createdAt: serverTimestamp(),
    });
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{opacity:0,scale:0.96,y:16}} animate={{opacity:1,scale:1,y:0}}
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        {done ? (
          <div className="p-10 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-black text-white mb-2">Session Requested!</h3>
            <p className="text-gray-500 text-sm mb-2">{mentor.displayName} will confirm your session.</p>
            <p className="text-gray-400 text-xs mb-6">You'll get a notification once accepted. Meet link will be shared before the session.</p>
            <button onClick={onClose} className="px-8 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm hover:bg-[#4c3ec7] transition-colors">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  {mentor.photoURL ? <img src={mentor.photoURL} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center font-black text-gray-400">{mentor.displayName?.[0]}</div>}
                </div>
                <div>
                  <p className="font-black text-white text-sm">{mentor.displayName}</p>
                  <p className="text-xs text-gray-400">₹{mentor.hourlyRate}/hr · 1-on-1 session</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">What do you want to learn? *</label>
                <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Unity AR setup for Android, WebXR basics..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#5B4BDB] transition-colors"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Date & Time *</label>
                  <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} min={new Date().toISOString().slice(0,16)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#5B4BDB] transition-colors"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Duration</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DURATIONS.map(d => (
                      <button key={d} onClick={()=>setDuration(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${duration===d?"bg-[#5B4BDB] text-white border-[#5B4BDB]":"bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Additional context (optional)</label>
                <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={3}
                  placeholder="Your current level, specific questions, what you've tried..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#5B4BDB] transition-colors resize-none"/>
              </div>

              {/* Price summary */}
              <div className="bg-[#0A0A0F] border border-gray-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{duration} min session</span>
                  <span className="font-bold text-white">₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Platform fee (15%)</span>
                  <span>₹{platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-green-600 border-t border-gray-200 pt-2">
                  <span className="font-semibold">Mentor receives</span>
                  <span className="font-bold">₹{mentorEarns.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400">Payment via Razorpay · Charged after mentor confirms</p>
              </div>

              <button onClick={handleBook} disabled={submitting || paying}
                className="w-full py-3.5 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] text-white font-bold text-sm disabled:opacity-50 transition-colors border-b-[3px] border-[#4438b8] active:translate-y-[1px]">
                {paying ? "Opening payment..." : submitting ? "Booking..." : total > 0 ? `Book & Pay ₹${total.toLocaleString()}` : "Book Free Session"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function MentorCard({ mentor, onBook }: { mentor: Mentor; onBook: () => void }) {
  const avail = mentor.availability || "available";
  const availColor = avail === "available" ? "bg-green-500" : avail === "busy" ? "bg-amber-400" : "bg-gray-300";
  const availLabel = avail === "available" ? "Available" : avail === "busy" ? "Busy" : "Unavailable";

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
      className={`bg-white border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col ${mentor.certified?"border-[#5B4BDB]/30":"border-gray-200"}`}>
      {mentor.certified && <div className="h-1 bg-gradient-to-r from-[#5B4BDB] to-violet-400"/>}
      <div className="p-6 flex-1">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
              {mentor.photoURL ? <img src={mentor.photoURL} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-gray-300">{mentor.displayName?.[0]}</div>}
            </div>
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${availColor}`}/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="font-black text-white">{mentor.displayName}</p>
                  {mentor.certified && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#5B4BDB] text-white">PRO</span>}
                </div>
                <StarRating rating={mentor.rating || 0}/>
                <p className="text-xs text-gray-400 mt-0.5">{mentor.totalSessions||0} sessions · {mentor.experience||"XR Expert"}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xl font-black text-white">₹{(mentor.hourlyRate||0).toLocaleString()}</p>
                <p className="text-xs text-gray-400">/hour</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{mentor.bio||"XR mentor on SYNTHÉ."}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {mentor.skills?.slice(0,4).map(s => <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100 font-medium">{s}</span>)}
          {(mentor.skills?.length??0) > 4 && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">+{mentor.skills.length-4}</span>}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5 p-3 bg-[#0A0A0F] rounded-xl">
          <div className="text-center"><p className="text-sm font-black text-white">{mentor.totalSessions||0}</p><p className="text-xs text-gray-400">Sessions</p></div>
          <div className="text-center border-x border-gray-200"><p className="text-sm font-black text-white">{(mentor.rating||0).toFixed(1)}</p><p className="text-xs text-gray-400">Rating</p></div>
          <div className="text-center"><p className="text-sm font-black text-green-600">85%</p><p className="text-xs text-gray-400">Earns</p></div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${avail==="available"?"bg-green-50 text-green-700 border-green-200":avail==="busy"?"bg-amber-50 text-amber-700 border-amber-200":"bg-gray-100 text-gray-500 border-gray-200"}`}>
            {availLabel}
          </span>
        </div>
      </div>

      <div className="px-6 pb-6">
        <button onClick={onBook} disabled={avail==="unavailable"}
          className="w-full py-3 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors border-b-[2px] border-[#4438b8] active:translate-y-[1px]">
          {avail==="unavailable" ? "Unavailable" : "Book Session"}
        </button>
      </div>
    </motion.div>
  );
}

export default function HirePage() {
  const [user, setUser] = useState<any>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [bookingMentor, setBookingMentor] = useState<Mentor|null>(null);

  useEffect(() => { const unsub = onAuthStateChanged(auth, u=>setUser(u??null)); return ()=>unsub(); }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db,"users"), where("role","==","mentor")));
        setMentors(snap.docs.map(d=>({id:d.id,...d.data()} as Mentor)));
      } catch(e){console.error(e);}
      setLoading(false);
    })();
  }, []);

  const filtered = mentors.filter(m => {
    const skillMatch = activeFilter==="All" || m.skills?.includes(activeFilter);
    const searchMatch = !search || m.displayName?.toLowerCase().includes(search.toLowerCase()) || m.expertise?.toLowerCase().includes(search.toLowerCase());
    return skillMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans">      {bookingMentor && user && <BookingModal mentor={bookingMentor} user={user} onClose={()=>setBookingMentor(null)}/>}
      {bookingMentor && !user && (typeof window!=="undefined" && (window.location.href="/login"))}

      <div className="max-w-7xl mx-auto px-4 py-14 flex-grow w-full">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-3">1-on-1 Mentorship</p>
          <h1 className="text-4xl font-black tracking-tight text-white mb-3">Book a Mentor</h1>
          <p className="text-gray-500 max-w-xl">Learn from verified XR professionals. Pick a topic, choose a time, pay after confirmation.</p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            {step:"01",title:"Pick a mentor",desc:"Browse by skill and rate"},
            {step:"02",title:"Set your topic",desc:"What do you want to learn?"},
            {step:"03",title:"Choose a time",desc:"Pick date and duration"},
            {step:"04",title:"Pay & confirm",desc:"Razorpay · Mentor earns 85%"},
          ].map(s=>(
            <div key={s.step} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-black text-[#5B4BDB] tracking-widest mb-2">{s.step}</p>
              <p className="font-black text-white text-sm mb-1">{s.title}</p>
              <p className="text-xs text-gray-400 leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search mentors..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#5B4BDB] transition-colors"/>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EXPERTISE_FILTERS.map(f=>(
              <button key={f} onClick={()=>setActiveFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${activeFilter===f?"bg-[#5B4BDB] text-white border-[#5B4BDB]":"bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_,i)=><div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse h-64"/>)}
          </div>
        ) : filtered.length===0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-4xl mb-4">🧑‍🏫</p>
            <p className="font-bold text-white mb-2">No mentors found</p>
            <p className="text-gray-400 text-sm">Try a different filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(m=>(
              <MentorCard key={m.id} mentor={m} onBook={()=>{
                if (!user) { window.location.href="/login"; return; }
                setBookingMentor(m);
              }}/>
            ))}
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
}