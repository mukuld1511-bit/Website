"use client";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, orderBy, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../../components/Navbar";
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
  pending:  { label:"Pending",   cls:"bg-amber-50 text-amber-700 border-amber-200" },
  accepted: { label:"Confirmed", cls:"bg-green-50 text-green-700 border-green-200" },
  rejected: { label:"Declined",  cls:"bg-red-50 text-red-600 border-red-200" },
  completed:{ label:"Completed", cls:"bg-gray-100 text-gray-600 border-gray-200" },
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
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
      <div className="text-center bg-white p-10 rounded-2xl border border-gray-200">
        <p className="font-black text-gray-900 mb-4">Sign in required</p>
        <Link href="/login"><button className="px-8 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold">Sign in</button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col font-sans">
      <Navbar/>
      <div className="max-w-4xl mx-auto px-4 py-14 flex-grow w-full">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-2">Learner Dashboard</p>
          <h1 className="text-3xl font-black text-gray-900 mb-1">My Learning</h1>
          <p className="text-gray-500 text-sm">Track your sessions and registered workshops.</p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link href="/hire">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-[#5B4BDB]/10 flex items-center justify-center mb-3 group-hover:bg-[#5B4BDB] transition-colors">
                <svg className="w-5 h-5 text-[#5B4BDB] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p className="font-black text-gray-900 text-sm mb-1">Book a Mentor</p>
              <p className="text-xs text-gray-400">1-on-1 private session</p>
            </div>
          </Link>
          <Link href="/learn">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mb-3 group-hover:bg-teal-500 transition-colors">
                <svg className="w-5 h-5 text-teal-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              </div>
              <p className="font-black text-gray-900 text-sm mb-1">Browse Workshops</p>
              <p className="text-xs text-gray-400">Live group sessions</p>
            </div>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-xl w-fit mb-8">
          {(["sessions","workshops"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all capitalize ${tab===t?"bg-gray-900 text-white":"text-gray-500 hover:text-gray-800"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab==="sessions" && (
          <div className="space-y-4">
            {loading ? (
              [...Array(3)].map((_,i)=><div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse h-28"/>)
            ) : sessions.length===0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <p className="text-4xl mb-3">📚</p>
                <p className="font-bold text-gray-900 mb-1">No sessions booked yet</p>
                <p className="text-gray-400 text-sm mb-5">Book a 1-on-1 session with a mentor</p>
                <Link href="/hire"><button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm hover:bg-[#4c3ec7] transition-colors">Browse Mentors</button></Link>
              </div>
            ) : sessions.map(s=>(
              <motion.div key={s.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                      {s.mentorPhoto ? <img src={s.mentorPhoto} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center font-black text-gray-400">{s.mentorName?.[0]}</div>}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">{s.mentorName}</p>
                      <p className="text-xs text-gray-400">{formatDate(s.scheduledDate)} · {s.duration} min</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${SESSION_STATUS[s.status]?.cls}`}>
                    {SESSION_STATUS[s.status]?.label}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-700 mt-3">{s.topic}</p>
                {s.status==="accepted" && s.meetLink && (
                  <div className="mt-3 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-xs font-bold text-green-700">Session confirmed — meet link ready</p>
                    <a href={s.meetLink} target="_blank" rel="noopener noreferrer">
                      <button className="px-4 py-1.5 rounded-lg bg-[#5B4BDB] text-white text-xs font-bold hover:bg-[#4c3ec7] transition-colors">
                        Join →
                      </button>
                    </a>
                  </div>
                )}
                {s.status==="pending" && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">⏳ Waiting for mentor to confirm and share meet link</p>
                )}
                {s.status==="rejected" && (
                  <div className="mt-3 flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs text-red-600 font-medium">Session declined by mentor</p>
                    <Link href="/hire"><button className="text-xs font-bold text-[#5B4BDB] hover:underline">Book another →</button></Link>
                  </div>
                )}
                {s.totalAmount > 0 && (
                  <p className="text-xs text-gray-400 mt-2">Paid: ₹{s.totalAmount.toLocaleString()}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {tab==="workshops" && (
          <div className="space-y-4">
            {workshops.length===0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <p className="text-4xl mb-3">🎓</p>
                <p className="font-bold text-gray-900 mb-1">No workshops registered yet</p>
                <p className="text-gray-400 text-sm mb-5">Browse and register for live sessions</p>
                <Link href="/learn"><button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm hover:bg-[#4c3ec7] transition-colors">Browse Workshops</button></Link>
              </div>
            ) : workshops.map(w=>(
              <motion.div key={w.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {w.status==="live" && <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>Live</span>}
                      {w.tags?.slice(0,2).map(t=><span key={t} className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">{t}</span>)}
                    </div>
                    <p className="font-black text-gray-900 text-sm">{w.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{w.hostName} · {w.duration} min</p>
                  </div>
                  {w.meetLink && w.status!=="ended" && (
                    <a href={w.meetLink} target="_blank" rel="noopener noreferrer">
                      <button className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${w.status==="live"?"bg-red-500 hover:bg-red-600 text-white":"bg-[#5B4BDB] hover:bg-[#4c3ec7] text-white"}`}>
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