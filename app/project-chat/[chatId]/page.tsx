"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import {
  collection, doc, addDoc, getDoc, onSnapshot,
  serverTimestamp, updateDoc, query, orderBy, Timestamp
} from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { initiatePayment } from "../../../lib/razorpay";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProjectChat {
  id: string;
  requestId: string;
  requestTitle: string;
  clientId: string;
  clientName: string;
  clientPhoto: string;
  developerId: string;
  developerName: string;
  developerPhoto: string;
  status: "active" | "closed";
  funded: boolean;
  fundedAmount: number;
}

interface Message {
  id: string;
  senderId?: string;
  senderName?: string;
  senderPhoto?: string;
  text: string;
  type: "text" | "system" | "payment";
  createdAt: any;
}

function formatTime(ts: any) {
  if (!ts) return "";
  const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ─── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ onClose, onPay, chat }: { onClose: () => void; onPay: (amt: number) => void; chat: ProjectChat }) {
  const [amount, setAmount] = useState<number | "">(500);
  const [paying, setPaying] = useState(false);

  async function handlePay() {
    if (!amount || Number(amount) <= 0) return;
    setPaying(true);
    try { await onPay(Number(amount)); } finally { setPaying(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="relative w-full max-w-sm rounded-3xl p-6 z-10"
        style={{ background: "linear-gradient(160deg,rgba(20,10,40,0.98),rgba(5,0,8,0.98))", border: "1px solid rgba(167,139,250,0.2)", boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-[1px] rounded-t-3xl"
          style={{ background: "linear-gradient(90deg,transparent,rgba(167,139,250,0.6),transparent)" }} />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)" }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-black text-base">Fund Project</p>
            <p className="text-white/40 text-xs">{chat.requestTitle}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-white/30 hover:text-white/70 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-white/50 text-xs font-black uppercase tracking-widest mb-2">Amount (₹)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">₹</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value ? parseFloat(e.target.value) : "")}
              min={1}
              placeholder="Enter amount"
              className="w-full bg-white/[0.04] border border-white/10 text-white text-lg font-black rounded-2xl pl-8 pr-4 py-4 focus:outline-none focus:border-violet-500/50 transition duration-200"
            />
          </div>
          <p className="text-white/25 text-xs mt-2">This amount will be charged via Razorpay.</p>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 mb-6">
          {[500, 1000, 2500, 5000].map(v => (
            <button key={v} onClick={() => setAmount(v)}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition duration-200 border ${amount === v ? "bg-violet-600/30 border-violet-500/50 text-violet-300" : "bg-white/[0.03] border-white/8 text-white/40 hover:text-white/70"}`}>
              ₹{v}
            </button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handlePay}
          disabled={!amount || Number(amount) <= 0 || paying}
          className="w-full py-4 rounded-2xl text-white font-black text-sm disabled:opacity-50 transition duration-200"
          style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)", boxShadow: "0 0 30px rgba(124,58,237,0.35)" }}
        >
          {paying ? "Processing…" : `Pay ₹${amount || "—"} via Razorpay`}
        </motion.button>
        <p className="text-center text-white/20 text-[10px] mt-3">Secured by Razorpay · 256-bit SSL</p>
      </motion.div>
    </div>
  );
}

// ─── Main Chat ─────────────────────────────────────────────────────────────────
function ProjectChatContent() {
  const params   = useParams();
  const router   = useRouter();
  const chatId   = params?.chatId as string;

  const [user,       setUser]       = useState<any>(null);
  const [chat,       setChat]       = useState<ProjectChat | null>(null);
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(true);
  const [denied,     setDenied]     = useState(false);
  const [sending,    setSending]    = useState(false);
  const [showPay,    setShowPay]    = useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u ?? null);
      if (!u) router.replace("/login");
    });
    return () => unsub();
  }, []);

  // Load chat
  useEffect(() => {
    if (!chatId || !user) return;
    async function load() {
      const snap = await getDoc(doc(db, "projectChats", chatId));
      if (!snap.exists()) { setDenied(true); setLoading(false); return; }
      const data = { id: snap.id, ...snap.data() } as ProjectChat;
      if (data.clientId !== user.uid && data.developerId !== user.uid) {
        setDenied(true); setLoading(false); return;
      }
      setChat(data);
      setLoading(false);
    }
    load();
  }, [chatId, user]);

  // Real-time messages
  useEffect(() => {
    if (!chatId || !chat) return;
    const q = query(collection(db, "projectChats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });
    return () => unsub();
  }, [chatId, chat]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string, type: Message["type"] = "text") {
    const msg = (text ?? input).trim();
    if (!msg || !user || !chat || sending) return;
    setSending(true);
    setInput("");
    try {
      await addDoc(collection(db, "projectChats", chatId, "messages"), {
        senderId:    user.uid,
        senderName:  user.displayName ?? "You",
        senderPhoto: user.photoURL ?? "",
        text:        msg,
        type,
        createdAt:   serverTimestamp(),
      });
      await updateDoc(doc(db, "projectChats", chatId), {
        lastMessage:   msg,
        lastMessageAt: serverTimestamp(),
      });
    } catch (e) { console.error(e); }
    setSending(false);
    inputRef.current?.focus();
  }

  async function handleFundProject(amount: number) {
    if (!chat) return;
    // Create order
    const orderRes = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amount * 100 }), // paise
    });
    const order = await orderRes.json();
    if (order.error) throw new Error(order.error);

    const paymentResponse: any = await initiatePayment({
      key:     process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount:  order.amount,
      currency:"INR",
      name:    "Synthe — Project Funding",
      description: chat.requestTitle,
      order_id: order.id,
      prefill: {
        name:  user.displayName,
        email: user.email,
      },
      theme: { color: "#7c3aed" },
    });

    // Mark as funded
    await updateDoc(doc(db, "projectChats", chatId), {
      funded:       true,
      fundedAmount: amount,
      paymentId:    paymentResponse.razorpay_payment_id,
    });
    await updateDoc(doc(db, "projectRequests", chat.requestId), {
      status:       "funded",
      fundedAmount: amount,
      paymentId:    paymentResponse.razorpay_payment_id,
    });
    // System message
    await addDoc(collection(db, "projectChats", chatId, "messages"), {
      type:      "payment",
      text:      `🎉 Project funded for ₹${amount.toLocaleString("en-IN")}! Payment ID: ${paymentResponse.razorpay_payment_id}`,
      createdAt: serverTimestamp(),
    });
    setChat(prev => prev ? { ...prev, funded: true, fundedAmount: amount } : prev);
    setShowPay(false);
  }

  const isClient    = chat && user?.uid === chat.clientId;
  const isMe        = (m: Message) => m.senderId === user?.uid;
  const otherName   = chat ? (isClient ? chat.developerName : chat.clientName) : "";
  const otherPhoto  = chat ? (isClient ? chat.developerPhoto : chat.clientPhoto) : "";

  if (loading) return (
    <div className="min-h-screen bg-[#050008] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-cyan-500/20 border-b-cyan-400 animate-spin" style={{ animationDirection: "reverse" }} />
        </div>
        <p className="text-white/30 text-xs font-black tracking-widest uppercase">Loading Chat…</p>
      </div>
    </div>
  );

  if (denied || !chat) return (
    <div className="min-h-screen bg-[#050008] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-3xl border border-rose-500/25 bg-rose-500/8 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-rose-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-white font-black text-2xl mb-3">Chat Not Found</h2>
      <p className="text-white/35 text-sm mb-8 max-w-sm leading-relaxed">This chat session doesn't exist or you don't have access.</p>
      <Link href="/requests/open">
        <motion.button whileHover={{ scale: 1.04 }} className="px-6 py-3 rounded-2xl text-white font-black text-sm"
          style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)" }}>
          Back to Open Projects
        </motion.button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050008] flex flex-col">
      <Navbar />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle,#7c3aed,transparent 65%)", filter: "blur(90px)" }} />
      </div>

      <AnimatePresence>
        {showPay && (
          <PaymentModal
            chat={chat}
            onClose={() => setShowPay(false)}
            onPay={handleFundProject}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pt-20 pb-0 relative z-10">
        {/* Chat header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between py-4 border-b border-white/6">
          <div className="flex items-center gap-3">
            <Link href="/requests/open">
              <button className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/8 flex items-center justify-center text-white/40 hover:text-white/80 transition duration-200 mr-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </Link>
            {otherPhoto ? (
              <img src={otherPhoto} className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10" alt={otherName} />
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)" }}>
                {otherName?.[0] ?? "?"}
              </div>
            )}
            <div>
              <p className="text-white font-black text-sm">{otherName}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-white/30 text-[10px] truncate max-w-[180px]">{chat.requestTitle}</p>
              </div>
            </div>
          </div>

          {/* Funded badge OR Pay button */}
          <div className="flex items-center gap-2">
            {chat.funded ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-emerald-400 text-xs font-black">Funded ₹{chat.fundedAmount?.toLocaleString("en-IN")}</span>
              </div>
            ) : isClient && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowPay(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-black transition duration-200"
                style={{ background: "linear-gradient(135deg,#059669,#0891b2)", boxShadow: "0 0 20px rgba(5,150,105,0.3)" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Fund Project
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-1 py-6" style={{ maxHeight: "calc(100vh - 240px)" }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <svg className="w-8 h-8 text-violet-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-white/50 font-black text-base mb-2">Start the conversation!</p>
              <p className="text-white/25 text-sm max-w-xs leading-relaxed">
                {isClient
                  ? "Welcome! Describe your vision and negotiate timelines with the developer."
                  : "Introduce yourself and discuss project requirements with the client."}
              </p>
            </div>
          )}

          {messages.map(m => {
            if (m.type === "system") return (
              <div key={m.id} className="flex justify-center my-4">
                <span className="text-white/30 text-[11px] font-semibold px-4 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02]">{m.text}</span>
              </div>
            );

            if (m.type === "payment") return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex justify-center my-5">
                <div className="flex items-start gap-3 max-w-sm p-4 rounded-2xl"
                  style={{ background: "rgba(5,150,105,0.1)", border: "1px solid rgba(5,150,105,0.25)" }}>
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-emerald-300 text-sm font-semibold leading-relaxed">{m.text}</p>
                </div>
              </motion.div>
            );

            const mine = isMe(m);
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex items-end gap-2 mb-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && (
                  <div className="w-7 h-7 rounded-xl overflow-hidden flex-shrink-0 mb-0.5 ring-1 ring-white/10">
                    {m.senderPhoto
                      ? <img src={m.senderPhoto} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white"
                          style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)" }}>
                          {m.senderName?.[0] ?? "?"}
                        </div>
                    }
                  </div>
                )}
                <div className="max-w-xs sm:max-w-sm lg:max-w-md">
                  {!mine && <p className="text-white/30 text-[10px] font-semibold mb-1 ml-1">{m.senderName}</p>}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    mine
                      ? "rounded-br-md text-white"
                      : "rounded-bl-md text-white/80 bg-white/[0.06] border border-white/[0.06]"
                  }`}
                    style={mine ? { background: "linear-gradient(135deg,#7c3aed,#0891b2)" } : {}}>
                    {m.text}
                  </div>
                  <p className={`text-white/20 text-[9px] mt-1 ${mine ? "text-right mr-1" : "ml-1"}`}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </motion.div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-white/6 py-4 bg-[#050008] sticky bottom-0">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder="Type a message…"
                className="w-full bg-white/[0.04] border border-white/8 text-white placeholder-white/20 text-sm rounded-2xl px-4 py-3.5 pr-12 focus:outline-none focus:border-violet-500/40 transition duration-200"
              />
              {input.length > 0 && (
                <button onClick={() => setInput("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <motion.button
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition duration-200"
              style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)", opacity: (!input.trim() || sending) ? 0.5 : 1 }}>
              {sending
                ? <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              }
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050008]" />}>
      <ProjectChatContent />
    </Suspense>
  );
}
