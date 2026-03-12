"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import {
  collection, doc, addDoc, getDoc, onSnapshot,
  serverTimestamp, updateDoc, query, orderBy, Timestamp
} from "firebase/firestore";
import { db, auth } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatSession {
  id: string;
  requestId: string;
  tutorId: string;
  tutorUserId: string;
  tutorName: string;
  tutorAvatar: string;
  tutorColor: string;
  tutorBookingLink: string;
  tutorPlatform: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  subject: string;
  status: "active" | "closed";
  createdAt: any;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  type: "text" | "booking_link" | "system";
  createdAt: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(ts: any): string {
  if (!ts) return "";
  const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
}

function formatDate(ts: any): string {
  if (!ts) return "";
  const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
  const today = new Date();
  if (d.toDateString()===today.toDateString()) return "Today";
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
  if (d.toDateString()===yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day:"numeric", month:"short" });
}

// ─── Component ────────────────────────────────────────────────────────────────
function ChatContent() {
  const params       = useParams();
  const router       = useRouter();
  const sessionId    = params?.sessionId as string;

  const [user,        setUser]        = useState<any>(null);
  const [session,     setSession]     = useState<ChatSession | null>(null);
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(true);
  const [denied,      setDenied]      = useState(false);
  const [sending,     setSending]     = useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u ?? null);
      if (!u) router.replace("/login");
    });
    return () => unsub();
  }, []);

  // Load session
  useEffect(() => {
    if (!sessionId || !user) return;
    async function load() {
      const snap = await getDoc(doc(db,"chatSessions",sessionId));
      if (!snap.exists()) { setDenied(true); setLoading(false); return; }
      const data = { id:snap.id, ...snap.data() } as ChatSession;
      // Access control — only tutor or student can view
      if (data.tutorUserId!==user.uid && data.studentId!==user.uid) {
        setDenied(true); setLoading(false); return;
      }
      setSession(data);
      setLoading(false);
    }
    load();
  }, [sessionId, user]);

  // Real-time messages listener
  useEffect(() => {
    if (!sessionId || !session) return;
    const q = query(collection(db,"chatSessions",sessionId,"messages"), orderBy("createdAt","asc"));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id:d.id, ...d.data() } as Message)));
    });
    return () => unsub();
  }, [sessionId, session]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  async function sendMessage(text?: string, type: Message["type"] = "text") {
    const msg = (text ?? input).trim();
    if (!msg || !user || !session || sending) return;
    setSending(true);
    setInput("");
    try {
      await addDoc(collection(db,"chatSessions",sessionId,"messages"), {
        senderId:    user.uid,
        senderName:  user.displayName ?? "You",
        senderAvatar:user.photoURL ?? "",
        text:        msg,
        type,
        createdAt:   serverTimestamp(),
      });
    } catch(e) { console.error(e); }
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  async function shareBookingLink() {
    if (!session?.tutorBookingLink) return;
    const msg = `📅 Here's my booking link to schedule our session: ${session.tutorBookingLink} (via ${session.tutorPlatform})`;
    await sendMessage(msg, "booking_link");
  }

  // ── Group messages by date
  const grouped: { date:string; msgs:Message[] }[] = [];
  let lastDate = "";
  for (const m of messages) {
    const d = formatDate(m.createdAt);
    if (d!==lastDate) { grouped.push({ date:d, msgs:[] }); lastDate=d; }
    grouped[grouped.length-1].msgs.push(m);
  }

  const isMe = (m: Message) => m.senderId === user?.uid;
  const isTutor = session && user?.uid === session.tutorUserId;
  const otherName = session ? (isTutor ? session.studentName : session.tutorName) : "";
  const otherAvatar = session ? (isTutor ? session.studentAvatar : session.tutorAvatar) : "";
  const accentColor = session?.tutorColor ?? "#a78bfa";

  // ────────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#050008] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg className="w-8 h-8 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p className="text-white/40 text-sm font-semibold">Loading session…</p>
      </div>
    </div>
  );

  if (denied || !session) return (
    <div className="min-h-screen bg-[#050008] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-3xl border border-rose-500/20 bg-rose-500/8 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-rose-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-white font-black text-2xl mb-3">Session Not Found</h2>
      <p className="text-white/35 text-sm mb-8 max-w-sm leading-relaxed">This chat session doesn't exist or you don't have access. Sessions are unlocked when a tutor accepts your lesson request.</p>
      <Link href="/connect">
        <motion.div whileHover={{ scale:1.04 }} style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
          className="px-6 py-3 rounded-2xl font-black text-white text-sm cursor-pointer">
          Back to Connect & Learn
        </motion.div>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050008] flex flex-col">
      <Navbar />

      {/* ── Chat layout */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pt-20 pb-0">

        {/* Session header */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
          className="flex items-center justify-between py-4 border-b border-white/6 mb-0">
          <div className="flex items-center gap-3">
            <Link href="/connect">
              <button className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/8 flex items-center justify-center text-white/40 hover:text-white/80 transition duration-200 mr-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
            </Link>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
              style={{ background:`${accentColor}25`, border:`1px solid ${accentColor}40`, color:accentColor }}>
              {otherAvatar ? <img src={otherAvatar} className="w-full h-full rounded-xl object-cover" /> : otherName.split(" ").map((n:string)=>n[0]).join("").slice(0,2)}
            </div>
            <div>
              <p className="text-white font-black text-sm">{otherName}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-white/30 text-[10px]">{session.subject}</p>
              </div>
            </div>
          </div>

          {/* Tutor actions */}
          <div className="flex items-center gap-2">
            {/* Booking link button — tutor shares, student sees */}
            {session.tutorBookingLink && (
              isTutor ? (
                <motion.button onClick={shareBookingLink} whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                  style={{ willChange:"transform", background:`${accentColor}18`, border:`1px solid ${accentColor}35`, color:accentColor }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black cursor-pointer transition duration-200">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Share Booking Link
                </motion.button>
              ) : (
                <a href={session.tutorBookingLink} target="_blank" rel="noopener noreferrer">
                  <motion.div whileHover={{ scale:1.04 }} style={{ willChange:"transform", background:`${accentColor}18`, border:`1px solid ${accentColor}35`, color:accentColor }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black cursor-pointer transition duration-200">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Book Session ({session.tutorPlatform})
                  </motion.div>
                </a>
              )
            )}
          </div>
        </motion.div>

        {/* Subject badge */}
        <div className="py-4 flex justify-center">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold"
            style={{ borderColor:`${accentColor}25`, background:`${accentColor}08`, color:`${accentColor}` }}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Session: {session.subject}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto space-y-1 pb-4" style={{ minHeight:0, maxHeight:"calc(100vh - 280px)" }}>
          {messages.length===0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background:`${accentColor}18`, border:`1px solid ${accentColor}30` }}>
                <svg className="w-7 h-7" style={{ color:accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-white/50 font-black text-base mb-2">Start the conversation!</p>
              <p className="text-white/25 text-sm max-w-xs leading-relaxed">
                {isTutor
                  ? "Welcome! Share your booking link so the student can schedule a slot."
                  : "Say hi to your tutor! Ask your questions and discuss your learning goals."
                }
              </p>
            </div>
          )}

          {grouped.map(group => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/[0.05]" />
                <span className="text-white/25 text-[10px] font-semibold px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02]">
                  {group.date}
                </span>
                <div className="flex-1 h-px bg-white/[0.05]" />
              </div>

              {group.msgs.map((m, idx) => {
                const mine = isMe(m);
                const showAvatar = !mine && (idx===0 || group.msgs[idx-1]?.senderId!==m.senderId);

                if (m.type==="system") return (
                  <div key={m.id} className="flex justify-center my-3">
                    <span className="text-white/25 text-[10px] font-semibold px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02]">{m.text}</span>
                  </div>
                );

                if (m.type==="booking_link") return (
                  <motion.div key={m.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                    className={`flex ${mine?"justify-end":"justify-start"} mb-2`}>
                    <div className="max-w-sm p-4 rounded-2xl border"
                      style={{ background:`${accentColor}12`, borderColor:`${accentColor}30` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 flex-shrink-0" style={{ color:accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-black" style={{ color:accentColor }}>Booking Link Shared</span>
                      </div>
                      <p className="text-white/60 text-xs leading-relaxed mb-3">{m.text}</p>
                      {session.tutorBookingLink && !mine && (
                        <a href={session.tutorBookingLink} target="_blank" rel="noopener noreferrer">
                          <motion.div whileHover={{ scale:1.03 }} style={{ willChange:"transform", background:`linear-gradient(135deg,${accentColor},#0891b2)` }}
                            className="w-full py-2 rounded-xl text-xs font-black text-white text-center cursor-pointer">
                            Open Booking Page →
                          </motion.div>
                        </a>
                      )}
                      <p className="text-white/20 text-[10px] mt-2 text-right">{formatTime(m.createdAt)}</p>
                    </div>
                  </motion.div>
                );

                return (
                  <motion.div key={m.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                    className={`flex items-end gap-2 mb-1 ${mine?"justify-end":"justify-start"}`}>

                    {!mine && (
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0 mb-0.5"
                        style={showAvatar
                          ? { background:`${accentColor}25`, border:`1px solid ${accentColor}40`, color:accentColor }
                          : { background:"transparent", border:"none" }
                        }>
                        {showAvatar && (m.senderAvatar ? <img src={m.senderAvatar} className="w-full h-full rounded-xl object-cover" /> : m.senderName[0])}
                      </div>
                    )}

                    <div className={`max-w-xs sm:max-w-sm lg:max-w-md`}>
                      {showAvatar && !mine && (
                        <p className="text-white/30 text-[10px] font-semibold mb-1 ml-1">{m.senderName}</p>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        mine
                          ? "rounded-br-md text-white"
                          : "rounded-bl-md text-white/80 bg-white/[0.06] border border-white/[0.06]"
                      }`}
                        style={mine ? { background:"linear-gradient(135deg,#7c3aed,#0891b2)" } : {}}>
                        {m.text}
                      </div>
                      <p className={`text-white/20 text-[9px] mt-1 ${mine?"text-right mr-1":"ml-1"}`}>
                        {formatTime(m.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* ── Input bar */}
        <div className="border-t border-white/6 py-4 bg-[#050008] sticky bottom-0">
          {session.status==="closed" ? (
            <div className="flex items-center justify-center py-3">
              <span className="text-white/30 text-xs font-semibold">This session has ended.</span>
            </div>
          ) : (
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  className="w-full bg-white/[0.04] border border-white/8 text-white placeholder-white/20 text-sm rounded-2xl px-4 py-3.5 pr-12 focus:outline-none focus:border-violet-500/40 transition duration-200 resize-none"
                />
                {input.length > 0 && (
                  <button onClick={()=>setInput("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition duration-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
              <motion.button
                onClick={()=>sendMessage()}
                disabled={!input.trim() || sending}
                whileHover={{ scale:1.06 }}
                whileTap={{ scale:0.94 }}
                style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)", opacity:(!input.trim()||sending)?0.5:1 }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 cursor-pointer transition duration-200">
                {sending
                  ? <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                }
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050008]" />}>
      <ChatContent />
    </Suspense>
  );
}
