"use client";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, orderBy, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Footer from "../../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";

interface Session {
  id: string; mentorId: string; mentorName: string; mentorPhoto: string;
  topic: string; scheduledDate: string; duration: number;
  totalAmount: number; status: "pending"|"accepted"|"rejected"|"completed";
  meetLink?: string; createdAt: any;
}
interface Workshop {
  id: string; title: string; date: any; duration: number;
  price: number; status: string; hostName: string; meetLink: string; tags: string[];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
}

const SESSION_STATUS: Record<string, { label:string; cls:string }> = {
  pending:  { label:"Pending",   cls:"bg-amber-500/15 text-amber-400 border-amber-500/30" },
  accepted: { label:"Confirmed", cls:"bg-green-500/15 text-green-400 border-green-500/30" },
  rejected: { label:"Declined",  cls:"bg-red-500/15 text-red-400 border-red-500/30" },
  completed:{ label:"Completed", cls:"bg-[#2A2A3E]/50 text-[#9494AD] border-[#2A2A3E]" },
};

export default function LearnerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<"sessions"|"workshops">("sessions");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { const unsub = onAuthStateChanged(auth, u=>setUser(u??null)); return ()=>unsub(); }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db,"mentorshipSessions"), where("learnerId","==",user.uid), orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, snap => {
      setSessions(snap.docs.map(d=>({id:d.id,...d.data()} as Session)));
      setLoading(false);
    });
    return ()=>unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDocs(query(collection(db,"workshops"), where("registeredUsers","array-contains",user.uid)));
      setWorkshops(snap.docs.map(d=>({id:d.id,...d.data()} as Workshop)));
    })();
  }, [user]);

  if (!user) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center font-sans text-white">
      <div className="text-center bg-[#141420] p-10 rounded-[2rem] border border-[#2A2A3E] shadow-xl">
        <p className="font-black text-white mb-4">Sign in required</p>
        <Link href="/login"><button className="px-8 py-3 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] transition-all shadow-[0_0_15px_rgba(91,75,219,0.3)] text-white font-bold">Sign in</button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans text-white">
      <div className="max-w-4xl mx-auto px-4 py-28 flex-grow w-full relative z-10">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5B4BDB]/15 border border-[#5B4BDB]/25 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BDB] animate-pulse" />
            <span className="text-xs font-bold text-[#7C6EF6] uppercase tracking-widest">Learner Dashboard</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">My Learning</h1>
          <p className="text-[#9494AD] text-sm font-medium">Track your sessions and registered workshops.</p>
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-4 mb-10">
          <Link href="/hire">
            <div className="bg-[#141420] border-2 border-[#2A2A3E] rounded-[2rem] p-6 hover:border-[#5B4BDB]/50 hover:shadow-[0_0_20px_rgba(91,75,219,0.15)] transition-all cursor-pointer group flex flex-col items-start h-full">
              <div className="w-12 h-12 rounded-2xl bg-[#5B4BDB]/15 border border-[#5B4BDB]/30 flex items-center justify-center mb-4 group-hover:bg-[#5B4BDB] transition-colors">
                <svg className="w-6 h-6 text-[#7C6EF6] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p className="font-black text-lg text-white mb-1 group-hover:text-[#7C6EF6] transition-colors">Book a Mentor</p>
              <p className="text-xs text-[#9494AD] font-medium">1-on-1 private session</p>
            </div>
          </Link>
          <Link href="/learn">
            <div className="bg-[#141420] border-2 border-[#2A2A3E] rounded-[2rem] p-6 hover:border-teal-500/50 hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] transition-all cursor-pointer group flex flex-col items-start h-full">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center mb-4 group-hover:bg-teal-500 transition-colors">
                <svg className="w-6 h-6 text-teal-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              </div>
              <p className="font-black text-lg text-white mb-1 group-hover:text-teal-400 transition-colors">Browse Workshops</p>
              <p className="text-xs text-[#9494AD] font-medium">Live group sessions</p>
            </div>
          </Link>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="flex gap-1 p-1.5 bg-[#141420] border border-[#2A2A3E] rounded-2xl w-fit mb-8 shadow-sm">
          {(["sessions","workshops"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${tab===t?"bg-[#5B4BDB] text-white shadow-[0_0_15px_rgba(91,75,219,0.3)]":"text-[#9494AD] hover:text-white hover:bg-[#2A2A3E]/50"}`}>
              {t}
            </button>
          ))}
        </motion.div>

        {tab==="sessions" && (
          <div className="space-y-4">
            {loading ? (
              [...Array(3)].map((_,i)=><div key={i} className="bg-[#141420] rounded-3xl border border-[#2A2A3E] p-6 animate-pulse h-28"/>)
            ) : sessions.length===0 ? (
              <div className="text-center py-16 bg-[#141420] rounded-[2.5rem] border-2 border-[#2A2A3E] border-dashed">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-[#0A0A0F] border-2 border-[#2A2A3E] flex items-center justify-center mb-4">
                  <span className="text-4xl">📚</span>
                </div>
                <p className="font-bold text-white text-lg mb-1">No sessions booked yet</p>
                <p className="text-[#9494AD] text-sm mb-6">Book a 1-on-1 session with a mentor</p>
                <Link href="/hire"><button className="px-8 py-3.5 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm hover:bg-[#4c3ec7] transition-all shadow-[0_0_15px_rgba(91,75,219,0.3)]">Browse Mentors</button></Link>
              </div>
            ) : sessions.map(s=>(
              <motion.div key={s.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                className="bg-[#141420] border-2 border-[#2A2A3E] rounded-[2rem] p-6 shadow-sm hover:border-[#5B4BDB]/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#0A0A0F] border border-[#2A2A3E] flex-shrink-0">
                      {s.mentorPhoto ? <img src={s.mentorPhoto} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center font-black text-[#5B4BDB]">{s.mentorName?.[0]}</div>}
                    </div>
                    <div>
                      <p className="font-black text-white text-base">{s.mentorName}</p>
                      <p className="text-xs text-[#9494AD] font-medium mt-0.5">{formatDate(s.scheduledDate)} · {s.duration} min</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border flex-shrink-0 ${SESSION_STATUS[s.status]?.cls}`}>
                    {SESSION_STATUS[s.status]?.label}
                  </span>
                </div>
                <p className="text-sm font-bold text-white mt-4 bg-[#0A0A0F]/50 p-3 rounded-xl border border-[#2A2A3E]">{s.topic}</p>
                {s.status==="accepted" && s.meetLink && (
                  <div className="mt-4 flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                    <p className="text-xs font-bold text-green-400">Session confirmed — meet link ready</p>
                    <a href={s.meetLink} target="_blank" rel="noopener noreferrer">
                      <button className="px-5 py-2.5 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                        Join →
                      </button>
                    </a>
                  </div>
                )}
                {s.status==="pending" && (
                  <p className="text-xs text-amber-500 mt-3 font-medium bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">⏳ Waiting for mentor to confirm and share meet link</p>
                )}
                {s.status==="rejected" && (
                  <div className="mt-4 flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <p className="text-xs text-red-500 font-medium">Session declined by mentor</p>
                    <Link href="/hire"><button className="text-xs font-bold text-red-400 hover:text-red-300 hover:underline">Book another →</button></Link>
                  </div>
                )}
                {s.totalAmount > 0 && (
                  <p className="text-xs text-[#6B6B85] mt-4 pt-3 border-t border-[#2A2A3E]">Paid: ₹{s.totalAmount.toLocaleString()}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {tab==="workshops" && (
          <div className="space-y-4">
            {workshops.length===0 ? (
              <div className="text-center py-16 bg-[#141420] rounded-[2.5rem] border-2 border-[#2A2A3E] border-dashed">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-[#0A0A0F] border-2 border-[#2A2A3E] flex items-center justify-center mb-4">
                  <span className="text-4xl">🎓</span>
                </div>
                <p className="font-bold text-white text-lg mb-1">No workshops registered yet</p>
                <p className="text-[#9494AD] text-sm mb-6">Browse and register for live sessions</p>
                <Link href="/learn"><button className="px-8 py-3.5 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm hover:bg-[#4c3ec7] transition-all shadow-[0_0_15px_rgba(91,75,219,0.3)]">Browse Workshops</button></Link>
              </div>
            ) : workshops.map(w=>(
              <motion.div key={w.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                className="bg-[#141420] border-2 border-[#2A2A3E] rounded-[2rem] p-6 shadow-sm hover:border-[#5B4BDB]/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {w.status==="live" && <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-red-400 bg-red-500/15 border border-red-500/30 px-3 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"/>Live</span>}
                      {w.tags?.slice(0,2).map(t=><span key={t} className="text-[10px] uppercase font-bold px-3 py-1 rounded-full bg-[#5B4BDB]/15 text-[#7C6EF6] border border-[#5B4BDB]/30">{t}</span>)}
                    </div>
                    <p className="font-black text-white text-base leading-tight">{w.title}</p>
                    <p className="text-sm text-[#9494AD] font-medium mt-1.5">{w.hostName} <span className="text-[#6B6B85]">· {w.duration} min</span></p>
                  </div>
                  {w.meetLink && w.status!=="ended" && (
                    <a href={w.meetLink} target="_blank" rel="noopener noreferrer">
                      <button className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${w.status==="live"?"bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)]":"bg-[#5B4BDB] hover:bg-[#4c3ec7] shadow-[0_0_15px_rgba(91,75,219,0.3)]"}`}>
                        {w.status==="live"?"Join now →":"Open link →"}
                      </button>
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
}