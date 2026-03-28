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
  pending:  "bg-amber-500/15 text-amber-400 border-amber-500/30",
  accepted: "bg-green-500/15 text-green-400 border-green-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  completed:"bg-[#2A2A3E]/50 text-[#9494AD] border-[#2A2A3E]",
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
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center font-sans text-white">
      <div className="text-center bg-[#141420] p-10 rounded-[2rem] border border-[#2A2A3E] shadow-xl">
        <h1 className="text-xl font-black text-white mb-4">Sign in required</h1>
        <Link href="/login"><button className="px-8 py-3 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] transition-all shadow-[0_0_15px_rgba(91,75,219,0.3)] text-white font-bold">Sign in</button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans text-white">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-[#5B4BDB] text-white text-sm font-bold rounded-xl shadow-[0_0_20px_rgba(91,75,219,0.4)]">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 py-28 flex-grow w-full relative z-10">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5B4BDB]/15 border border-[#5B4BDB]/25 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BDB] animate-pulse" />
            <span className="text-xs font-bold text-[#7C6EF6] uppercase tracking-widest">Mentor Dashboard</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">Welcome, {user.displayName?.split(" ")[0]}</h1>
          <p className="text-[#9494AD] text-sm font-medium">Manage your sessions, workshops and earnings.</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            {label:"Total sessions",   value:sessions.length, color:"#7C6EF6"},
            {label:"Pending requests", value:sessions.filter(s=>s.status==="pending").length, color:"#F59E0B"},
            {label:"Earned (completed)",value:`₹${totalEarnings.toLocaleString()}`, color:"#10B981"},
            {label:"Upcoming earnings", value:`₹${pendingEarnings.toLocaleString()}`, color:"#06B6D4"},
          ].map(s=>(
            <div key={s.label} className="bg-[#141420] border-2 border-[#2A2A3E] rounded-3xl p-6 text-center shadow-sm">
              <p className="text-3xl font-black mb-1" style={{color:s.color}}>{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9494AD]">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="flex gap-1 p-1.5 bg-[#141420] border border-[#2A2A3E] rounded-2xl w-fit mb-8 shadow-sm">
          {(["bookings","workshops","earnings"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${tab===t?"bg-[#5B4BDB] text-white shadow-[0_0_15px_rgba(91,75,219,0.3)]":"text-[#9494AD] hover:text-white hover:bg-[#2A2A3E]/50"}`}>
              {t}
            </button>
          ))}
        </motion.div>

        {/* Bookings tab */}
        {tab==="bookings" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-white">Session Requests</h2>
              <Link href="/learn/workshops/create">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] transition-all shadow-[0_0_15px_rgba(91,75,219,0.3)] text-white text-sm font-bold">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                  Create Workshop
                </button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="bg-[#141420] rounded-[2rem] border-2 border-[#2A2A3E] p-6 animate-pulse h-32"/>)}</div>
            ) : sessions.length===0 ? (
              <div className="text-center py-16 bg-[#141420] rounded-[2.5rem] border-2 border-[#2A2A3E] border-dashed">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-[#0A0A0F] border-2 border-[#2A2A3E] flex items-center justify-center mb-4">
                  <span className="text-4xl">📋</span>
                </div>
                <p className="font-bold text-white text-lg mb-1">No session requests yet</p>
                <p className="text-[#9494AD] text-sm">Learners will appear here when they book you</p>
              </div>
            ) : (
              sessions.map(s=>(
                <motion.div key={s.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                  className="bg-[#141420] border-2 border-[#2A2A3E] rounded-[2rem] overflow-hidden shadow-sm hover:border-[#5B4BDB]/30 transition-colors">
                  <div className="p-6 border-b border-[#2A2A3E]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#0A0A0F] border border-[#2A2A3E] flex-shrink-0">
                          {s.learnerPhoto ? <img src={s.learnerPhoto} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center font-black text-[#5B4BDB] text-lg">{s.learnerName?.[0]}</div>}
                        </div>
                        <div>
                          <p className="font-black text-white text-base">{s.learnerName}</p>
                          <p className="text-xs text-[#9494AD] font-medium mt-0.5">{formatDate(s.scheduledDate)} · {s.duration} min</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-[10px] uppercase tracking-wide font-bold px-3 py-1 rounded-full border ${STATUS_STYLES[s.status]}`}>
                          {s.status}
                        </span>
                        <span className="text-lg font-black text-[#10B981]">₹{(s.mentorEarns||0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-5 bg-[#0A0A0F]/50 p-4 rounded-xl border border-[#2A2A3E]">
                      <p className="text-sm font-bold text-white">{s.topic}</p>
                      {s.message && <p className="text-xs text-[#9494AD] mt-1.5 leading-relaxed">{s.message}</p>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-6 py-5 bg-[#0A0A0F]">
                    {s.status==="pending" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-[#6B6B85] mb-2 uppercase tracking-wide">Meet link (required to accept)</label>
                          <input
                            value={meetInput[s.id]||""}
                            onChange={e=>setMeetInput(prev=>({...prev,[s.id]:e.target.value}))}
                            placeholder="https://meet.google.com/xxx-xxxx-xxx or Jitsi room link"
                            className="w-full border border-[#2A2A3E] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#5B4BDB] bg-[#141420] transition-colors"/>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={()=>handleAccept(s)}
                            className="flex-1 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] shadow-[0_0_15px_rgba(16,185,129,0.3)] text-white text-sm font-bold transition-all">
                            Accept & Share Link
                          </button>
                          <button onClick={()=>handleReject(s)}
                            className="px-6 py-3 rounded-xl border border-[#F43F5E]/30 text-[#F43F5E] text-sm font-bold hover:bg-[#F43F5E]/10 transition-colors">
                            Decline
                          </button>
                        </div>
                      </div>
                    )}
                    {s.status==="accepted" && (
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <p className="text-xs font-bold text-[#6B6B85] mb-1.5 uppercase tracking-wide">Meet link shared</p>
                          <p className="text-xs text-[#5B4BDB] font-medium truncate max-w-sm bg-[#5B4BDB]/10 px-3 py-1.5 rounded-lg border border-[#5B4BDB]/20">{s.meetLink}</p>
                        </div>
                        <div className="flex gap-3">
                          <a href={s.meetLink} target="_blank" rel="noopener noreferrer">
                            <button className="px-5 py-2.5 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] shadow-[0_0_15px_rgba(91,75,219,0.3)] text-white text-xs font-bold transition-all">
                              Join Session →
                            </button>
                          </a>
                          <button onClick={()=>handleComplete(s)}
                            className="px-5 py-2.5 rounded-xl border-2 border-[#2A2A3E] text-[#9494AD] text-xs font-bold hover:bg-[#2A2A3E]/50 transition-colors">
                            Mark Complete
                          </button>
                        </div>
                      </div>
                    )}
                    {s.status==="completed" && (
                      <div className="flex items-center gap-2 text-xs text-[#10B981] font-bold">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#10B981]/20 border border-[#10B981]/30">✓</span>
                        Session completed · ₹{(s.mentorEarns||0).toLocaleString()} earned
                      </div>
                    )}
                    {s.status==="rejected" && (
                      <p className="text-xs text-[#F43F5E] font-medium flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E]"></span> Session declined
                      </p>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Workshops tab */}
        {tab==="workshops" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-white">Your Workshops</h2>
              <Link href="/learn/workshops/create">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] shadow-[0_0_15px_rgba(91,75,219,0.3)] transition-all text-white text-sm font-bold">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                  New Workshop
                </button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">{[...Array(2)].map((_,i)=><div key={i} className="bg-[#141420] rounded-[2rem] border-2 border-[#2A2A3E] p-6 animate-pulse h-32"/>)}</div>
            ) : workshops.length===0 ? (
              <div className="text-center py-16 bg-[#141420] rounded-[2.5rem] border-2 border-[#2A2A3E] border-dashed">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-[#0A0A0F] border-2 border-[#2A2A3E] flex items-center justify-center mb-4">
                  <span className="text-4xl">🎓</span>
                </div>
                <p className="font-bold text-white text-lg mb-1">No workshops hosted yet</p>
                <p className="text-[#9494AD] text-sm">Create a workshop to teach multiple learners at once</p>
              </div>
            ) : (
              workshops.map(w=>(
                <motion.div key={w.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                  className="bg-[#141420] border-2 border-[#2A2A3E] rounded-[2rem] p-6 shadow-sm hover:border-[#5B4BDB]/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {w.status==="live" && <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-red-400 bg-red-500/15 border border-red-500/30 px-3 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"/>Live</span>}
                        {w.status==="ended" && <span className="text-[10px] uppercase font-bold px-3 py-1 rounded-full bg-[#2A2A3E]/50 text-[#9494AD] border border-[#2A2A3E]">Ended</span>}
                        {w.status==="upcoming" && <span className="text-[10px] uppercase font-bold px-3 py-1 rounded-full bg-[#5B4BDB]/15 text-[#7C6EF6] border border-[#5B4BDB]/30">Upcoming</span>}
                      </div>
                      <p className="font-black text-white text-base leading-tight">{w.title}</p>
                      <p className="text-sm text-[#9494AD] font-medium mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                        <span>{formatDate(w.date)}</span>
                        <span>·</span>
                        <span>{w.duration} min</span>
                        <span>·</span>
                        <span>{w.registeredUsers?.length||0} / {w.maxSeats} registered</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-black text-[#10B981]">₹{w.price===0?"Free":w.price.toLocaleString()}</p>
                      <p className="text-[10px] tracking-wide uppercase font-bold text-[#6B6B85] mt-1">Earnings: ₹{((w.price*0.8)*(w.registeredUsers?.length||0)).toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Earnings tab */}
        {tab==="earnings" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-[#141420] rounded-[2.5rem] p-8 border-2 border-[#2A2A3E] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-sm font-bold text-[#9494AD] uppercase tracking-wide">Available for withdrawal</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h2 className="text-5xl font-black text-white">₹{totalEarnings.toLocaleString()}</h2>
                  <span className="text-sm font-bold text-[#10B981]">+₹{pendingEarnings.toLocaleString()} pending</span>
                </div>
              </div>
              <button disabled={totalEarnings===0} className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-[#5B4BDB] disabled:bg-[#2A2A3E] disabled:text-[#6B6B85] hover:bg-[#4c3ec7] shadow-[0_0_15px_rgba(91,75,219,0.3)] disabled:shadow-none transition-all text-white font-bold text-sm">
                Withdraw Funds
              </button>
            </div>

            <h3 className="text-lg font-black text-white mt-10 mb-4">Recent Transactions</h3>
            {totalEarnings===0 ? (
              <div className="text-center py-16 bg-[#141420] border-2 border-[#2A2A3E] border-dashed rounded-[2.5rem]">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-[#0A0A0F] border-2 border-[#2A2A3E] flex items-center justify-center mb-4">
                  <span className="text-2xl">💸</span>
                </div>
                <p className="text-[#9494AD] font-medium text-sm">No completed sessions yet to show earnings.</p>
              </div>
            ) : (
              <div className="bg-[#141420] rounded-[2rem] border-2 border-[#2A2A3E] shadow-sm divide-y divide-[#2A2A3E]">
                {sessions.filter(s=>s.status==="completed").map(s=>(
                  <div key={s.id} className="p-5 flex items-center justify-between hover:bg-[#2A2A3E]/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#0A0A0F] border border-[#2A2A3E] flex items-center justify-center text-xl">🤝</div>
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">1-on-1 Session: {s.learnerName}</p>
                        <p className="text-xs text-[#9494AD] font-medium mt-1">{formatDate(s.scheduledDate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-[#10B981]">+₹{(s.mentorEarns||0).toLocaleString()}</p>
                      <p className="text-[10px] uppercase tracking-wide font-bold text-[#6B6B85] mt-1">Completed</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
      <Footer/>
    </div>
  );
}