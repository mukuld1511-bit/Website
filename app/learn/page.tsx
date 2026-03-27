"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  collection, query, where, orderBy,
  getDocs, addDoc, updateDoc, doc,
  serverTimestamp, arrayUnion, getDoc,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Footer from "../components/Footer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Workshop, UserRole } from "../../types/gallery";

// ─── Razorpay type declaration ─────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: any;
  }
}

// ─── Razorpay loader ───────────────────────────────────────────────────────
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── Tags & hub cards ─────────────────────────────────────────────────────
const TAGS = ["All", "AR", "VR", "Unity", "Unreal", "WebXR", "Blender", "ARCore", "ARKit"];

const HUB_CARDS = [
  {
    label: "XR Roadmap",
    desc: "AI-personalised learning path",
    href: "/learn/roadmap",
    icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
    badge: "AI", badgeStyle: "bg-violet-100 text-violet-700 border border-violet-200",
    color: "#5B4BDB", bg: "#EEEDFE",
  },
  {
    label: "Tools Directory",
    desc: "48 tools incl. WebXR, Unity, Blender",
    href: "/learn/tools",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    badge: "New", badgeStyle: "bg-amber-100 text-amber-700 border border-amber-200",
    color: "#B45309", bg: "#FAEEDA",
  },
  {
    label: "1-on-1 Mentors",
    desc: "Book private paid sessions",
    href: "/hire",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    badge: null, badgeStyle: "", color: "#185FA5", bg: "#E6F1FB",
  },
  {
    label: "XR Challenges",
    desc: "Build projects, earn badges",
    href: "/learn/challenges",
    icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
    badge: null, badgeStyle: "", color: "#0F6E56", bg: "#E1F5EE",
  },
  {
    label: "Student Showcase",
    desc: "See community work",
    href: "/learn/showcase",
    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    badge: null, badgeStyle: "", color: "#9D174D", bg: "#FBEAF0",
  },
];

// ─── Gemini chat ─────────────────────────────────────────────────────────
interface Message { role: "user" | "ai"; text: string; }

const QUICK_QUESTIONS = [
  "What is WebXR?",
  "How does AR work on phones?",
  "AR vs VR — what's the difference?",
  "What is SLAM tracking?",
  "Best free tool to start VR?",
  "What is a GLB file?",
];

async function askGemini(question: string, userRole: string): Promise<string> {
  const prompt = `You are an XR education assistant on SYNTHÉ. Answer in simple, friendly language.
${userRole === "learner" || userRole === "user" ? "Beginner — avoid jargon, use analogies." : "Developer — be technical."}
Under 100 words. End with one tip.

Question: ${question}`;

  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_GEMINI_API_KEY not set");

  const res = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 250 },
      }),
    }
  );
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    console.error("Gemini error:", res.status, errData);
    throw new Error(errData?.error?.message ?? `API error ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, try again.";
}

function GeminiChat({ userRole }: { userRole: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const q = text.trim();
    setInput("");
    setMessages(p => [...p, { role: "user", text: q }]);
    setLoading(true);
    try {
      const answer = await askGemini(q, userRole);
      setMessages(p => [...p, { role: "ai", text: answer }]);
    } catch {
      setMessages(p => [...p, { role: "ai", text: "Something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  }, [loading, userRole]);

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm" style={{ height: 480 }}>
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-[#0A0A0F] shrink-0">
        <div className="w-8 h-8 rounded-xl bg-[#5B4BDB] flex items-center justify-center">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Ask anything about XR</p>
          <p className="text-xs text-gray-400">Gemini AI · instant answers</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-xs text-gray-400 text-center">Ask me anything about AR, VR, or XR development</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="text-left text-xs bg-[#0A0A0F] hover:bg-[#5B4BDB]/5 border border-gray-200 hover:border-[#5B4BDB]/30 rounded-xl px-3 py-2.5 text-gray-600 hover:text-[#5B4BDB] transition-all leading-snug">
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
              {m.role === "ai" && (
                <div className="w-6 h-6 rounded-lg bg-[#5B4BDB] flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
              )}
              <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user" ? "bg-[#5B4BDB] text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}>
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#5B4BDB] flex items-center justify-center shrink-0">
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#5B4BDB] animate-bounce" style={{ animationDelay: `${i * 0.12}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-gray-100 bg-[#0A0A0F] shrink-0">
        <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="What is spatial computing?"
            className="flex-1 bg-white border border-gray-200 focus:border-[#5B4BDB] rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors" />
          <button type="submit" disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-[#5B4BDB] hover:bg-[#4c3ec7] disabled:opacity-40 rounded-xl text-white text-sm font-bold transition-colors">
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Mentor Booking Modal ─────────────────────────────────────────────────
interface Mentor {
  id: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  skills?: string[];
  hourlyRate?: number;
  rating?: number;
  totalSessions?: number;
}

interface BookingModalProps {
  mentor: Mentor;
  user: any;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
  { label: "90 min", value: 90 },
];

function BookingModal({ mentor, user, onClose, onSuccess }: BookingModalProps) {
  const [topic,    setTopic]    = useState("");
  const [date,     setDate]     = useState("");
  const [duration, setDuration] = useState(45);
  const [message,  setMessage]  = useState("");
  const [loading,  setLoading]  = useState(false);

  const rate     = mentor.hourlyRate ?? 500;
  const price    = Math.round((rate * duration) / 60);
  const fee      = Math.round(price * 0.15);
  const mentorEarns = price - fee;

  const handleBook = async () => {
    if (!topic.trim() || !date) return;
    setLoading(true);

    try {
      // Free session → direct Firestore save
      if (price === 0) {
        await addDoc(collection(db, "mentorshipSessions"), {
          mentorId:    mentor.id,
          mentorName:  mentor.displayName,
          learnerId:   user.uid,
          learnerName: user.displayName || user.email,
          topic,
          date:        new Date(date),
          duration,
          price:       0,
          status:      "pending",
          message,
          createdAt:   serverTimestamp(),
        });
        onSuccess("Booking sent! Mentor will confirm shortly.");
        onClose();
        return;
      }

      // Paid session → Razorpay
      const ok = await loadRazorpay();
      if (!ok) { onSuccess("Payment gateway failed to load. Try again."); setLoading(false); return; }

      const options = {
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      price * 100,
        currency:    "INR",
        name:        "SYNTHÉ",
        description: `1-on-1 with ${mentor.displayName} · ${duration} min`,
        image:       "/logo.png",
        prefill: {
          name:  user.displayName || "",
          email: user.email || "",
        },
        theme: { color: "#5B4BDB" },
        handler: async (response: any) => {
          // Payment success → save session
          await addDoc(collection(db, "mentorshipSessions"), {
            mentorId:        mentor.id,
            mentorName:      mentor.displayName,
            learnerId:       user.uid,
            learnerName:     user.displayName || user.email,
            topic,
            date:            new Date(date),
            duration,
            price,
            platformFee:     fee,
            mentorEarns,
            status:          "pending",
            message,
            paymentId:       response.razorpay_payment_id,
            paymentStatus:   "paid",
            createdAt:       serverTimestamp(),
          });
          // Notify learner
          await addDoc(collection(db, "notifications"), {
            userId:    user.uid,
            message:   `Booking sent to ${mentor.displayName}! You'll get a meet link once confirmed.`,
            read:      false,
            createdAt: serverTimestamp(),
          });
          onSuccess(`Booked! ₹${price} paid. ${mentor.displayName} will confirm shortly.`);
          onClose();
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#5B4BDB]/10 flex items-center justify-center overflow-hidden">
                {mentor.photoURL
                  ? <img src={mentor.photoURL} className="w-full h-full object-cover" alt="" />
                  : <span className="text-[#5B4BDB] font-bold text-sm">{mentor.displayName?.charAt(0)}</span>
                }
              </div>
              <div>
                <p className="font-bold text-white text-sm">{mentor.displayName}</p>
                <p className="text-xs text-gray-400">₹{rate}/hr · {mentor.totalSessions ?? 0} sessions</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Form */}
          <div className="px-6 py-5 space-y-4">
            {/* Topic */}
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Topic *</label>
              <input
                value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Unity AR Foundation basics"
                className="w-full border border-gray-200 focus:border-[#5B4BDB] rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {DURATIONS.map(d => (
                  <button key={d.value} onClick={() => setDuration(d.value)}
                    className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                      duration === d.value ? "bg-[#5B4BDB] text-white border-[#4438b8]" : "bg-white text-gray-600 border-gray-200 hover:bg-[#0A0A0F]"
                    }`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Preferred date & time *</label>
              <input
                type="datetime-local" value={date} onChange={e => setDate(e.target.value)} min={minDate}
                className="w-full border border-gray-200 focus:border-[#5B4BDB] rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none transition-colors"
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Message (optional)</label>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)} rows={2}
                placeholder="Share your background or specific goals..."
                className="w-full border border-gray-200 focus:border-[#5B4BDB] rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors resize-none"
              />
            </div>

            {/* Price summary */}
            <div className="bg-[#0A0A0F] border border-gray-100 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Session ({duration} min)</span>
                <span className="font-semibold">₹{price}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-xs">
                <span>Platform fee (15%)</span>
                <span>₹{fee}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-xs">
                <span>Mentor earns</span>
                <span>₹{mentorEarns}</span>
              </div>
              <div className="h-px bg-gray-200 my-1" />
              <div className="flex justify-between font-black text-white">
                <span>You pay</span>
                <span className="text-[#5B4BDB]">₹{price}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-[#0A0A0F] transition-all">
              Cancel
            </button>
            <button
              onClick={handleBook}
              disabled={!topic.trim() || !date || loading}
              className="flex-1 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] disabled:opacity-40 transition-all active:translate-y-[1px]">
              {loading ? "Processing…" : price === 0 ? "Book free" : `Pay ₹${price}`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function formatDate(ts: any): string {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function SeatsBar({ registered, max }: { registered: number; max: number }) {
  const pct  = Math.min((registered / max) * 100, 100);
  const left = Math.max(max - registered, 0);
  const color = left === 0 ? "#E24B4A" : left <= 3 ? "#EF9F27" : "#1D9E75";
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color }} className="font-semibold">{left === 0 ? "Full" : `${left} seats left`}</span>
        <span className="text-gray-400">{registered}/{max}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Workshop Card ────────────────────────────────────────────────────────
function WorkshopCard({ w, user, userRole, onRegister }: {
  w: Workshop; user: any; userRole: UserRole; onRegister: (id: string) => void;
}) {
  const isRegistered = user && w.registeredUsers?.includes(user.uid);
  const isFull       = (w.registeredUsers?.length ?? 0) >= w.maxSeats;
  const isPast       = w.status === "ended";
  const isLive       = w.status === "live";
  const canRegister  = ["learner", "developer", "mentor", "admin"].includes(userRole);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      <div className="flex flex-wrap gap-1.5 mb-3">
        {isLive && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />Live now
          </span>
        )}
        {w.tags?.slice(0, 3).map(t => (
          <span key={t} className="px-2 py-0.5 rounded-full bg-[#5B4BDB]/10 text-[#5B4BDB] text-xs font-semibold">{t}</span>
        ))}
      </div>
      <h3 className="font-black text-white text-base mb-1 leading-snug">{w.title}</h3>
      <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">{w.description}</p>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-[#5B4BDB]/10 flex items-center justify-center overflow-hidden flex-shrink-0">
          {w.hostPhoto
            ? <img src={w.hostPhoto} className="w-full h-full object-cover" alt="" />
            : <span className="text-[#5B4BDB] text-xs font-bold">{w.hostName?.charAt(0)}</span>
          }
        </div>
        <div>
          <p className="text-xs font-semibold text-white">{w.hostName}</p>
          <p className="text-xs text-gray-400">{w.duration} min · {w.price === 0 ? "Free" : `₹${w.price}`}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {formatDate(w.date)}
      </div>
      <SeatsBar registered={w.registeredUsers?.length ?? 0} max={w.maxSeats} />

      {/* ── Live join button ── */}
      {isLive && isRegistered && w.meetLink && (
        <a href={w.meetLink} target="_blank" rel="noopener noreferrer"
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold border-b-[3px] border-red-700 hover:bg-red-600 transition-all active:translate-y-[1px]">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Join live session
        </a>
      )}

      <div className="mt-4">
        {isPast ? (
          <div className="text-center text-xs text-gray-400 py-2">Session ended</div>
        ) : isRegistered ? (
          <div className="w-full py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-bold text-center">
            {isLive && w.meetLink ? null : "Registered ✓"}
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
          <button disabled className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm font-bold cursor-not-allowed">Session full</button>
        ) : (
          <button onClick={() => onRegister(w.id)}
            className="w-full py-2.5 rounded-xl bg-[#5B4BDB] text-white text-sm font-bold border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all active:translate-y-[1px]">
            {w.price === 0 ? "Register free" : `Register · ₹${w.price}`}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function LearnPage() {
  const [user,          setUser]          = useState<any>(null);
  const [userRole,      setUserRole]      = useState<UserRole>("user");
  const [workshops,     setWorkshops]     = useState<Workshop[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTag,     setActiveTag]     = useState("All");
  const [tab,           setTab]           = useState<"upcoming" | "registered">("upcoming");
  const [toast,         setToast]         = useState("");
  const [bookingMentor, setBookingMentor] = useState<Mentor | null>(null);
  const [mentors,       setMentors]       = useState<Mentor[]>([]);

  // ── Auth ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setUserRole((snap.data().role as UserRole) ?? "user");
      }
    });
    return () => unsub();
  }, []);

  // ── Fetch workshops ──
  useEffect(() => { fetchWorkshops(); }, []);

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
    } catch (err) { console.error("Workshops fetch error:", err); }
    finally { setLoading(false); }
  };

  // ── Fetch mentors (for booking flow) ──
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "mentor"));
        const snap = await getDocs(q);
        setMentors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Mentor)));
      } catch (err) { console.error("Mentors fetch:", err); }
    };
    fetchMentors();
  }, []);

  // ── Workshop registration (free) ──
  const handleRegister = async (workshopId: string) => {
    if (!user) return;

    const workshop = workshops.find(w => w.id === workshopId);
    if (!workshop) return;

    // Paid workshop → Razorpay
    if (workshop.price > 0) {
      const ok = await loadRazorpay();
      if (!ok) { showToast("Payment gateway failed to load."); return; }

      const options = {
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      workshop.price * 100,
        currency:    "INR",
        name:        "SYNTHÉ",
        description: workshop.title,
        image:       "/logo.png",
        prefill: { name: user.displayName || "", email: user.email || "" },
        theme: { color: "#5B4BDB" },
        handler: async (response: any) => {
          try {
            await updateDoc(doc(db, "workshops", workshopId), {
              registeredUsers: arrayUnion(user.uid),
            });
            await addDoc(collection(db, "workshopPayments"), {
              workshopId,
              userId:    user.uid,
              amount:    workshop.price,
              paymentId: response.razorpay_payment_id,
              createdAt: serverTimestamp(),
            });
            setWorkshops(prev => prev.map(w =>
              w.id === workshopId
                ? { ...w, registeredUsers: [...(w.registeredUsers ?? []), user.uid] }
                : w
            ));
            showToast(`Registered! ₹${workshop.price} paid. Meet link shared before session.`);
          } catch {
            showToast("Payment done but registration failed. Contact support.");
          }
        },
        modal: { ondismiss: () => {} },
      };
      new window.Razorpay(options).open();
      return;
    }

    // Free workshop → direct register
    try {
      await updateDoc(doc(db, "workshops", workshopId), {
        registeredUsers: arrayUnion(user.uid),
      });
      setWorkshops(prev => prev.map(w =>
        w.id === workshopId
          ? { ...w, registeredUsers: [...(w.registeredUsers ?? []), user.uid] }
          : w
      ));
      showToast("Registered! Meet link will be shared before the session.");
    } catch (err) {
      console.error("Register error:", err);
      showToast("Something went wrong. Please try again.");
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const filtered = workshops.filter(w => {
    const tagMatch = activeTag === "All" || w.tags?.includes(activeTag);
    const tabMatch = tab === "upcoming" ? true : user && w.registeredUsers?.includes(user.uid);
    return tagMatch && tabMatch;
  });

  const myRegistered = workshops.filter(w => user && w.registeredUsers?.includes(user.uid));

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans text-white">
      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl max-w-sm text-center">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Booking Modal ── */}
      {bookingMentor && user && (
        <BookingModal
          mentor={bookingMentor}
          user={user}
          onClose={() => setBookingMentor(null)}
          onSuccess={showToast}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-14 flex-grow w-full">

        {/* ── HERO ── */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-3">SYNTHÉ Learning Hub</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
            Learn AR & VR<br />from real developers
          </h1>
          <p className="text-gray-500 text-lg max-w-xl">
            Join live sessions hosted by verified mentors, or book a private 1-on-1 session for hands-on guidance.
          </p>
          {user && userRole === "user" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-center justify-between gap-4 p-4 rounded-2xl border border-[#5B4BDB]/30 bg-[#5B4BDB]/5">
              <div>
                <p className="text-sm font-bold text-white">Unlock learning features</p>
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

        {/* ── HUB NAV CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          {HUB_CARDS.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Link href={card.href}>
                <div className="group p-4 rounded-2xl border border-gray-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: card.bg }}>
                    <svg className="w-4 h-4" fill="none" stroke={card.color} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-sm font-black text-white group-hover:text-[#5B4BDB] transition-colors leading-tight">{card.label}</p>
                    {card.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${card.badgeStyle}`}>{card.badge}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 leading-snug">{card.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ── GEMINI CHAT + STATS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-12">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-[#5B4BDB] flex items-center justify-center">
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-white">XR Concept Chat</p>
              <span className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-semibold">Gemini AI</span>
            </div>
            <GeminiChat userRole={userRole} />
          </div>

          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Live now",  value: workshops.filter(w => w.status === "live").length || "—" },
                { label: "Upcoming",  value: workshops.filter(w => w.status === "upcoming").length },
                { label: "Joined",    value: myRegistered.length },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Quick links</p>
              <div className="space-y-2">
                {[
                  { label: "Generate my XR roadmap",     href: "/learn/roadmap",           badge: "AI" },
                  { label: "WebXR tools & resources",    href: "/learn/tools?filter=WebXR", badge: "WebXR" },
                  { label: "Find the right tool",        href: "/learn/tools",              badge: "48 tools" },
                  { label: "Book a 1-on-1 mentor",       href: "/hire",                     badge: null },
                  { label: "Join a challenge",           href: "/learn/challenges",         badge: null },
                ].map(item => (
                  <Link key={item.href} href={item.href}>
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#0A0A0F] transition-colors group cursor-pointer">
                      <p className="text-sm font-semibold text-gray-700 group-hover:text-[#5B4BDB] transition-colors">{item.label}</p>
                      <div className="flex items-center gap-2">
                        {item.badge && <span className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-semibold">{item.badge}</span>}
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-gray-300 group-hover:text-[#5B4BDB] transition-colors">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS + FILTERS ── */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex gap-1 p-1 rounded-2xl bg-gray-100 w-fit">
            {(["upcoming", "registered"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
                  tab === t ? "bg-white text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                {t === "registered" ? "My sessions" : "Upcoming"}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {TAGS.map(tag => (
              <button key={tag} onClick={() => setActiveTag(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  activeTag === tag ? "bg-[#5B4BDB] text-white border-[#4438b8]" : "bg-white text-gray-500 border-gray-200 hover:bg-[#0A0A0F]"
                }`}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* ── WORKSHOP GRID ── */}
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
            <p className="font-bold text-white mb-2">
              {tab === "registered" ? "No sessions registered yet" : "No sessions available"}
            </p>
            <p className="text-gray-500 text-sm">
              {tab === "registered" ? "Register for upcoming sessions to see them here" : "Check back soon — mentors post new sessions regularly"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(w => (
              <WorkshopCard key={w.id} w={w} user={user} userRole={userRole} onRegister={handleRegister} />
            ))}
          </div>
        )}

        {/* ── 1-ON-1 SECTION ── */}
        <div className="mt-16 rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-8 md:p-10">
              <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-3">1-on-1 Sessions</p>
              <h2 className="text-2xl font-black text-white mb-3 leading-tight">Need personal guidance?</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Browse verified mentors and book a private session. You choose the topic, they bring the expertise.
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

              {/* Mentor quick-book cards */}
              {mentors.length > 0 && (
                <div className="mb-6 space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Book directly</p>
                  {mentors.slice(0, 3).map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-[#5B4BDB]/30 hover:bg-[#5B4BDB]/5 transition-all">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#5B4BDB]/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {m.photoURL
                            ? <img src={m.photoURL} className="w-full h-full object-cover" alt="" />
                            : <span className="text-[#5B4BDB] text-xs font-bold">{m.displayName?.charAt(0)}</span>
                          }
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{m.displayName}</p>
                          <p className="text-xs text-gray-400">₹{m.hourlyRate ?? 500}/hr</p>
                        </div>
                      </div>
                      {user && ["learner", "developer", "admin"].includes(userRole) ? (
                        <button
                          onClick={() => setBookingMentor(m)}
                          className="px-3 py-1.5 rounded-lg bg-[#5B4BDB] text-white text-xs font-bold hover:bg-[#4c3ec7] transition-colors">
                          Book
                        </button>
                      ) : (
                        <Link href="/hire">
                          <button className="px-3 py-1.5 rounded-lg border border-[#5B4BDB] text-[#5B4BDB] text-xs font-bold hover:bg-[#5B4BDB]/5 transition-colors">
                            View
                          </button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Link href="/hire">
                <button className="px-7 py-3.5 rounded-xl bg-gray-900 text-white font-bold text-sm border-b-[3px] border-black/40 hover:bg-gray-800 transition-all active:translate-y-[1px]">
                  Browse all mentors
                </button>
              </Link>
            </div>
            <div className="hidden md:flex items-center justify-center p-10 bg-gradient-to-br from-[#5B4BDB]/5 to-blue-50">
              <div className="text-center">
                <div className="text-7xl mb-4">🧑‍🏫</div>
                <p className="font-black text-white text-lg">Verified mentors</p>
                <p className="text-gray-500 text-sm mt-1">Real XR developers, teaching live</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── TEACH CTA ── */}
        {user && !["mentor", "admin"].includes(userRole) && (
          <div className="mt-8 p-6 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-black text-white mb-1">Want to teach?</p>
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