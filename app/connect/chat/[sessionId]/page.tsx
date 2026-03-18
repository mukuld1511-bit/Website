"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { collection, doc, addDoc, getDoc, onSnapshot, serverTimestamp, query, orderBy, Timestamp } from "firebase/firestore";
import { db, auth } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";

interface ChatSession {
  id:string; tutorId:string; tutorUserId:string; tutorName:string;
  tutorAvatar:string; tutorColor:string; tutorBookingLink:string;
  tutorPlatform:string; studentId:string; studentName:string;
  studentAvatar:string; subject:string; status:"active"|"closed"; createdAt:any;
}
interface Message {
  id:string; senderId:string; senderName:string; senderAvatar:string;
  text:string; type:"text"|"booking_link"|"system"; createdAt:any;
}

function fmtTime(ts:any):string {
  if (!ts) return "";
  const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
}
function fmtDate(ts:any):string {
  if (!ts) return "";
  const d = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
  const today = new Date();
  if (d.toDateString()===today.toDateString()) return "Today";
  const yest = new Date(today); yest.setDate(today.getDate()-1);
  if (d.toDateString()===yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN",{day:"numeric",month:"short"});
}

// ─── Gemini smart replies ─────────────────────────────────────────────────────
async function getSmartReplies(lastMsg:string, context:string): Promise<string[]> {
  const prompt = `You are a chat assistant on SYNTHÉ, an XR/3D platform.
Last message in conversation: "${lastMsg}"
Conversation context: "${context}"
Generate exactly 3 short, natural reply suggestions (under 10 words each). Return only a JSON array of 3 strings. No preamble.`;
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.7,maxOutputTokens:100}}) }
    );
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
    return JSON.parse(raw.replace(/```json|```/g,"").trim());
  } catch { return []; }
}

// ─── Gemini message drafter ───────────────────────────────────────────────────
async function draftMessage(rough:string, context:string): Promise<string> {
  const prompt = `You are helping someone write a professional message on SYNTHÉ, an XR/3D collaboration platform.
Conversation context: "${context}"
User's rough idea: "${rough}"
Write a clear, professional message. Under 60 words. Return only the message text.`;
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.7,maxOutputTokens:120}}) }
  );
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

function ChatContent() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;

  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<ChatSession|null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [sending, setSending] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [smartLoading, setSmartLoading] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [roughDraft, setRoughDraft] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{ const unsub=onAuthStateChanged(auth,u=>{setUser(u??null);if(!u)router.replace("/login");});return()=>unsub(); },[]);

  useEffect(()=>{
    if (!sessionId||!user) return;
    (async()=>{
      const snap = await getDoc(doc(db,"chatSessions",sessionId));
      if (!snap.exists()) { setDenied(true); setLoading(false); return; }
      const data = {id:snap.id,...snap.data()} as ChatSession;
      if (data.tutorUserId!==user.uid&&data.studentId!==user.uid) { setDenied(true); setLoading(false); return; }
      setSession(data); setLoading(false);
    })();
  },[sessionId,user]);

  useEffect(()=>{
    if (!sessionId||!session) return;
    const q = query(collection(db,"chatSessions",sessionId,"messages"),orderBy("createdAt","asc"));
    const unsub = onSnapshot(q,snap=>{
      setMessages(snap.docs.map(d=>({id:d.id,...d.data()} as Message)));
    });
    return()=>unsub();
  },[sessionId,session]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  // Fetch smart replies when new message arrives
  useEffect(()=>{
    if (!messages.length) return;
    const last = messages[messages.length-1];
    if (last.senderId===user?.uid) return; // Only suggest after receiving
    const ctx = messages.slice(-4).map(m=>`${m.senderName}: ${m.text}`).join("\n");
    setSmartLoading(true);
    getSmartReplies(last.text, ctx).then(r=>{ setSmartReplies(r); setSmartLoading(false); }).catch(()=>setSmartLoading(false));
  },[messages]);

  async function sendMessage(text?:string, type:Message["type"]="text") {
    const msg = (text??input).trim();
    if (!msg||!user||!session||sending) return;
    setSending(true); setInput(""); setSmartReplies([]);
    try {
      await addDoc(collection(db,"chatSessions",sessionId,"messages"),{
        senderId:user.uid, senderName:user.displayName??"You", senderAvatar:user.photoURL??"",
        text:msg, type, createdAt:serverTimestamp(),
      });
    } catch(e){console.error(e);}
    setSending(false); inputRef.current?.focus();
  }

  async function handleDraft() {
    if (!roughDraft.trim()) return;
    setDraftLoading(true);
    const ctx = messages.slice(-3).map(m=>`${m.senderName}: ${m.text}`).join("\n");
    try {
      const drafted = await draftMessage(roughDraft, ctx);
      setInput(drafted); setShowDraft(false); setRoughDraft("");
    } catch {}
    setDraftLoading(false);
  }

  async function shareBookingLink() {
    if (!session?.tutorBookingLink) return;
    await sendMessage(`📅 Booking link: ${session.tutorBookingLink} (via ${session.tutorPlatform})`, "booking_link");
  }

  // Group by date
  const grouped: {date:string;msgs:Message[]}[] = [];
  let lastDate = "";
  for (const m of messages) {
    const d = fmtDate(m.createdAt);
    if (d!==lastDate) { grouped.push({date:d,msgs:[]}); lastDate=d; }
    grouped[grouped.length-1].msgs.push(m);
  }

  const isMe = (m:Message) => m.senderId===user?.uid;
  const isTutor = session&&user?.uid===session.tutorUserId;
  const otherName = session?(isTutor?session.studentName:session.tutorName):"";
  const otherAvatar = session?(isTutor?session.studentAvatar:session.tutorAvatar):"";

  if (loading) return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#5B4BDB] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (denied||!session) return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
      </div>
      <h2 className="font-black text-gray-900 text-xl mb-2">Session not found</h2>
      <p className="text-gray-400 text-sm mb-6">This chat doesn't exist or you don't have access.</p>
      <Link href="/connect"><button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm">Back to Connect</button></Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col font-sans">
      <Navbar/>
      <div className="max-w-3xl mx-auto w-full px-4 pt-20 pb-6 flex flex-col flex-1" style={{height:"100vh"}}>

        {/* Chat container */}
        <div className="flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex-1 mt-4">

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-white">
            <Link href="/connect">
              <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
            </Link>
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
              {otherAvatar ? <img src={otherAvatar} className="w-full h-full object-cover" alt=""/> : <span className="font-black text-gray-400 text-sm">{otherName?.[0]}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-900 text-sm truncate">{otherName}</p>
              <p className="text-xs text-gray-400 truncate">{session.subject}</p>
            </div>
            <div className="flex items-center gap-2">
              {session.tutorBookingLink && isTutor && (
                <button onClick={shareBookingLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 text-xs font-bold hover:bg-violet-100 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  Share booking
                </button>
              )}
              {session.tutorBookingLink && !isTutor && (
                <a href={session.tutorBookingLink} target="_blank" rel="noopener noreferrer">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-bold hover:bg-green-100 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    Book session
                  </button>
                </a>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-1" style={{minHeight:0}}>
            {messages.length===0 && (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                </div>
                <p className="font-bold text-gray-900 mb-1">Start the conversation</p>
                <p className="text-sm text-gray-400 max-w-xs">{isTutor?"Share your booking link to schedule a session.":"Say hi and describe your project!"}</p>
              </div>
            )}

            {grouped.map(group=>(
              <div key={group.date}>
                <div className="flex items-center justify-center gap-3 my-5">
                  <div className="h-px flex-1 bg-gray-100"/>
                  <span className="text-xs text-gray-400 font-semibold px-3 py-1 bg-gray-50 rounded-full border border-gray-100">{group.date}</span>
                  <div className="h-px flex-1 bg-gray-100"/>
                </div>

                {group.msgs.map((m,idx)=>{
                  const mine = isMe(m);
                  const showAvatar = !mine&&(idx===0||group.msgs[idx-1]?.senderId!==m.senderId);

                  if (m.type==="system") return (
                    <div key={m.id} className="flex justify-center my-3">
                      <span className="text-xs text-gray-400 font-medium px-4 py-1.5 bg-gray-100 rounded-full">{m.text}</span>
                    </div>
                  );

                  if (m.type==="booking_link") return (
                    <motion.div key={m.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                      className={`flex ${mine?"justify-end":"justify-start"} mb-3`}>
                      <div className="max-w-sm bg-white border border-violet-200 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          <span className="text-sm font-bold text-violet-700">Booking Link</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{m.text}</p>
                        {session.tutorBookingLink&&!mine&&(
                          <a href={session.tutorBookingLink} target="_blank" rel="noopener noreferrer">
                            <button className="w-full py-2 rounded-xl bg-[#5B4BDB] text-white text-xs font-bold hover:bg-[#4c3ec7] transition-colors">
                              Open booking page →
                            </button>
                          </a>
                        )}
                        <p className="text-xs text-gray-300 mt-2 text-right">{fmtTime(m.createdAt)}</p>
                      </div>
                    </motion.div>
                  );

                  return (
                    <motion.div key={m.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
                      className={`flex items-end gap-2 mb-1.5 ${mine?"justify-end":"justify-start"}`}>
                      {!mine&&showAvatar&&(
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0 mb-1">
                          {m.senderAvatar ? <img src={m.senderAvatar} className="w-full h-full object-cover" alt=""/> : m.senderName?.[0]}
                        </div>
                      )}
                      {!mine&&!showAvatar&&<div className="w-7 flex-shrink-0"/>}
                      <div className="max-w-xs sm:max-w-sm">
                        {showAvatar&&!mine&&<p className="text-xs text-gray-400 font-semibold mb-1 ml-1">{m.senderName}</p>}
                        <div className={`px-4 py-2.5 text-sm leading-relaxed ${mine
                          ?"rounded-2xl rounded-br-sm bg-[#5B4BDB] text-white"
                          :"rounded-2xl rounded-bl-sm bg-gray-100 text-gray-800"}`}>
                          {m.text}
                        </div>
                        <p className={`text-xs text-gray-300 mt-1 ${mine?"text-right mr-1":"ml-1"}`}>{fmtTime(m.createdAt)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>

          {/* Smart replies */}
          <AnimatePresence>
            {smartReplies.length>0&&!smartLoading&&(
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
                className="px-4 py-3 border-t border-gray-100 bg-gray-50 overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-3 h-3 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  <span className="text-xs font-bold text-violet-500">Gemini suggestions</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {smartReplies.map((r,i)=>(
                    <button key={i} onClick={()=>sendMessage(r)}
                      className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 font-medium hover:border-[#5B4BDB] hover:text-[#5B4BDB] transition-all">
                      {r}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gemini draft */}
          <AnimatePresence>
            {showDraft&&(
              <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
                className="overflow-hidden border-t border-gray-100">
                <div className="px-4 py-3 bg-violet-50 space-y-2">
                  <p className="text-xs font-bold text-violet-700">Describe your idea — Gemini will write it professionally</p>
                  <div className="flex gap-2">
                    <input value={roughDraft} onChange={e=>setRoughDraft(e.target.value)}
                      onKeyDown={e=>e.key==="Enter"&&handleDraft()}
                      placeholder="e.g. Ask about timeline for the AR project..."
                      className="flex-1 border border-violet-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-violet-500 transition-colors"/>
                    <button onClick={handleDraft} disabled={draftLoading||!roughDraft.trim()}
                      className="px-3 py-2 bg-violet-600 text-white text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-violet-700 transition-colors">
                      {draftLoading?"...":"Draft"}
                    </button>
                    <button onClick={()=>setShowDraft(false)} className="px-2 py-2 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="px-4 py-4 border-t border-gray-100 bg-white">
            {session.status==="closed" ? (
              <div className="text-center py-2">
                <span className="text-xs text-gray-400 font-medium px-4 py-2 bg-gray-100 rounded-full">This session has ended</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={()=>setShowDraft(!showDraft)} title="Draft with AI"
                  className={`p-2.5 rounded-xl border transition-colors flex-shrink-0 ${showDraft?"bg-violet-100 border-violet-300 text-violet-600":"border-gray-200 text-gray-400 hover:text-violet-500 hover:border-violet-200"}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </button>
                <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} }}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#5B4BDB] transition-colors"/>
                <button onClick={()=>sendMessage()} disabled={!input.trim()||sending}
                  className="w-10 h-10 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] disabled:opacity-40 flex items-center justify-center text-white transition-colors flex-shrink-0">
                  {sending
                    ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <svg className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F6F3]"/>}>
      <ChatContent/>
    </Suspense>
  );
}