"use client";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, orderBy, onSnapshot, serverTimestamp, getDoc } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Footer from "../../components/Footer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Session {
  id: string; learnerId: string; learnerName: string; learnerPhoto: string;
  topic: string; message: string; scheduledDate: string; duration: number;
  totalAmount: number; mentorEarns: number; status: "pending"|"accepted"|"rejected"|"completed";
  meetLink?: string; createdAt: any;
}
interface Workshop {
  id: string; title: string; description: string; date: any; duration: number;
  maxSeats: number; price: number; status: "upcoming"|"live"|"ended";
  registeredUsers: string[]; tags: string[];
}

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
  completed:"bg-gray-100 text-gray-600 border-gray-200",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
}

export default function MentorDashboard() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<"bookings"|"workshops"|"earnings">("bookings");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetInput, setMeetInput] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");

  useEffect(() => { const unsub = onAuthStateChanged(auth, u=>setUser(u??null)); return ()=>unsub(); }, []);

  useEffect(() => {
    if (!user) return;
    // Real-time sessions listener
    const q = query(collection(db,"mentorshipSessions"), where("mentorId","==",user.uid), orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, snap => {
      setSessions(snap.docs.map(d=>({id:d.id,...d.data()} as Session)));
      setLoading(false);
    });
    return ()=>unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDocs(query(collection(db,"workshops"), where("hostId","==",user.uid), orderBy("date","desc")));
      setWorkshops(snap.docs.map(d=>({id:d.id,...d.data()} as Workshop)));
    })();
  }, [user]);

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  const handleAccept = async (session: Session) => {
    const meet = meetInput[session.id]?.trim();
    if (!meet) { showToast("Please enter a Google Meet or Jitsi link first"); return; }
    await updateDoc(doc(db,"mentorshipSessions",session.id), { status:"accepted", meetLink: meet });
    // Notify learner
    await addDoc(collection(db,"notifications"), {
      userId: session.learnerId, type:"session_accepted",
      message: `Your session with ${user.displayName} has been confirmed! Meet link: ${meet}`,
      read: false, createdAt: serverTimestamp(),
    });
    showToast("Session accepted — learner notified ✓");
  };

  const handleReject = async (session: Session) => {
    await updateDoc(doc(db,"mentorshipSessions",session.id), { status:"rejected" });
    await addDoc(collection(db,"notifications"), {
      userId: session.learnerId, type:"session_rejected",
      message: `Unfortunately your session request was declined. Please try booking another mentor.`,
      read: false, createdAt: serverTimestamp(),
    });
    showToast("Session rejected");
  };

  const handleComplete = async (session: Session) => {
    await updateDoc(doc(db,"mentorshipSessions",session.id), { status:"completed" });
    showToast("Marked as completed ✓");
  };

  const totalEarnings = sessions.filter(s=>s.status==="completed").reduce((a,s)=>a+(s.mentorEarns||0),0);
  const pendingEarnings = sessions.filter(s=>s.status==="accepted").reduce((a,s)=>a+(s.mentorEarns||0),0);

  if (!user) return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
      <div className="text-center bg-white p-10 rounded-2xl border border-gray-200">
        <h1 className="text-xl font-black text-gray-900 mb-4">Sign in required</h1>
        <Link href="/login"><button className="px-8 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold">Sign in</button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col font-sans">      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl shadow-xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 py-14 flex-grow w-full">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-2">Mentor Dashboard</p>
          <h1 className="text-3xl font-black text-gray-900 mb-1">Welcome, {user.displayName?.split(" ")[0]}</h1>
          <p className="text-gray-500 text-sm">Manage your sessions, workshops and earnings.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {label:"Total sessions",   value:sessions.length},
            {label:"Pending requests", value:sessions.filter(s=>s.status==="pending").length},
            {label:"Earned (completed)",value:`₹${totalEarnings.toLocaleString()}`},
            {label:"Upcoming earnings", value:`₹${pendingEarnings.toLocaleString()}`},
          ].map(s=>(
            <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-2xl font-black text-gray-900 mb-1">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-xl w-fit mb-8">
          {(["bookings","workshops","earnings"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all capitalize ${tab===t?"bg-gray-900 text-white":"text-gray-500 hover:text-gray-800"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Bookings tab */}
        {tab==="bookings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-black text-gray-900">Session Requests</h2>
              <Link href="/learn/workshops/create">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5B4BDB] text-white text-sm font-bold hover:bg-[#4c3ec7] transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                  Create Workshop
                </button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse h-32"/>)}</div>
            ) : sessions.length===0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <p className="text-4xl mb-3">📋</p>
                <p className="font-bold text-gray-900 mb-1">No session requests yet</p>
                <p className="text-gray-400 text-sm">Learners will appear here when they book you</p>
              </div>
            ) : (
              sessions.map(s=>(
                <motion.div key={s.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                          {s.learnerPhoto ? <img src={s.learnerPhoto} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center font-black text-gray-400 text-sm">{s.learnerName?.[0]}</div>}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-sm">{s.learnerName}</p>
                          <p className="text-xs text-gray-400">{formatDate(s.scheduledDate)} · {s.duration} min</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[s.status]}`}>
                          {s.status.charAt(0).toUpperCase()+s.status.slice(1)}
                        </span>
                        <span className="text-sm font-black text-gray-900">₹{(s.mentorEarns||0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-bold text-gray-900">{s.topic}</p>
                      {s.message && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.message}</p>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-4 bg-gray-50">
                    {s.status==="pending" && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">Meet link (required to accept)</label>
                          <input
                            value={meetInput[s.id]||""}
                            onChange={e=>setMeetInput(prev=>({...prev,[s.id]:e.target.value}))}
                            placeholder="https://meet.google.com/xxx-xxxx-xxx or Jitsi room link"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#5B4BDB] transition-colors bg-white"/>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={()=>handleAccept(s)}
                            className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors">
                            Accept & Share Link
                          </button>
                          <button onClick={()=>handleReject(s)}
                            className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 transition-colors">
                            Decline
                          </button>
                        </div>
                      </div>
                    )}
                    {s.status==="accepted" && (
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <p className="text-xs font-bold text-gray-500 mb-1">Meet link shared</p>
                          <p className="text-xs text-[#5B4BDB] font-medium truncate max-w-xs">{s.meetLink}</p>
                        </div>
                        <div className="flex gap-2">
                          <a href={s.meetLink} target="_blank" rel="noopener noreferrer">
                            <button className="px-4 py-2 rounded-xl bg-[#5B4BDB] text-white text-xs font-bold hover:bg-[#4c3ec7] transition-colors">
                              Join Session →
                            </button>
                          </a>
                          <button onClick={()=>handleComplete(s)}
                            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-colors">
                            Mark Complete
                          </button>
                        </div>
                      </div>
                    )}
                    {s.status==="completed" && (
                      <p className="text-xs text-green-600 font-bold">✓ Session completed · ₹{(s.mentorEarns||0).toLocaleString()} earned</p>
                    )}
                    {s.status==="rejected" && (
                      <p className="text-xs text-gray-400 font-medium">Session declined</p>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Workshops tab */}
        {tab==="workshops" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Your Workshops</h2>
              <Link href="/learn/workshops/create">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B4BDB] text-white text-sm font-bold hover:bg-[#4c3ec7] transition-colors border-b-[2px] border-[#4438b8]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                  New Workshop
                </button>
              </Link>
            </div>
            {workshops.length===0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <p className="text-4xl mb-3">🎓</p>
                <p className="font-bold text-gray-900 mb-1">No workshops yet</p>
                <p className="text-gray-400 text-sm mb-5">Create your first live session</p>
                <Link href="/learn/workshops/create">
                  <button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm hover:bg-[#4c3ec7] transition-colors">Create Workshop</button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {workshops.map(w=>(
                  <div key={w.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${w.status==="live"?"bg-red-50 text-red-600 border-red-200":w.status==="upcoming"?"bg-green-50 text-green-700 border-green-200":"bg-gray-100 text-gray-500 border-gray-200"}`}>
                            {w.status==="live"?"🔴 Live":w.status==="upcoming"?"Upcoming":"Ended"}
                          </span>
                          {w.price===0 ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Free</span> : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">₹{w.price}</span>}
                        </div>
                        <p className="font-black text-gray-900 text-sm">{w.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{w.registeredUsers?.length||0}/{w.maxSeats} seats · {w.duration} min</p>
                      </div>
                      <Link href={`/learn/workshops/${w.id}`}>
                        <button className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors">Manage</button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Earnings tab */}
        {tab==="earnings" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {label:"Total earned",value:`₹${totalEarnings.toLocaleString()}`,desc:"From completed sessions",color:"text-green-600"},
                {label:"Pending",value:`₹${pendingEarnings.toLocaleString()}`,desc:"From accepted sessions",color:"text-amber-600"},
                {label:"Platform fee (15%)",value:`₹${Math.round(totalEarnings/0.85*0.15).toLocaleString()}`,desc:"SYNTHÉ's cut",color:"text-gray-600"},
              ].map(s=>(
                <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <p className={`text-3xl font-black mb-1 ${s.color}`}>{s.value}</p>
                  <p className="text-sm font-bold text-gray-900">{s.label}</p>
                  <p className="text-xs text-gray-400">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-black text-gray-900 mb-4">Session History</h3>
              <div className="space-y-3">
                {sessions.filter(s=>s.status==="completed"||s.status==="accepted").map(s=>(
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{s.topic}</p>
                      <p className="text-xs text-gray-400">{s.learnerName} · {formatDate(s.scheduledDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-green-600">+₹{(s.mentorEarns||0).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{s.status}</p>
                    </div>
                  </div>
                ))}
                {sessions.filter(s=>s.status==="completed"||s.status==="accepted").length===0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No completed sessions yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
}