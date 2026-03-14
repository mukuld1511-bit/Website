"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

interface Developer {
  id: string; name: string; bio: string; skills: string[]; profileImage: string;
  portfolio: string; linkedin: string; userId: string; certified: boolean;
  color?: string; bookingLink?: string; bookingPlatform?: string; subjects?: string[];
  hourlyRate?: number; createdAt: any;
}

const SKILL_FILTERS = ["All", "Unity", "Blender", "Three.js", "WebXR", "ARKit", "Unreal", "React Three Fiber"];
const COLORS = ["blue", "purple", "emerald", "amber", "rose", "indigo"];

// ── Request Modal ─────────────────────────────────────────────────────────────
function RequestModal({ dev, user, onClose, onSuccess }: { dev: Developer; user: any; onClose: ()=>void; onSuccess: (id:string)=>void; }) {
  const [subject,  setSubject]  = useState("");
  const [message,  setMessage]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const color = dev.color ?? "blue";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) { setError("Enter a subject"); return; }
    setLoading(true); setError("");
    try {
      const ref = await addDoc(collection(db,"chatSessions"), {
        tutorId: dev.id, tutorUserId: dev.userId || dev.id, tutorName: dev.name, tutorAvatar: dev.profileImage ?? "",
        tutorColor: dev.color ?? "blue", tutorBookingLink: dev.bookingLink ?? "", tutorPlatform: dev.bookingPlatform ?? "Calendly",
        studentId: user.uid, studentName: user.displayName ?? "Student", studentAvatar: user.photoURL ?? "",
        subject: subject.trim(), message: message.trim(), status: "active", createdAt: serverTimestamp(),
      });
      onSuccess(ref.id);
    } catch(e: any) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-lg font-bold flex-shrink-0 bg-blue-50 text-blue-600 border border-blue-100">
            {dev.profileImage ? <img src={dev.profileImage} className="w-full h-full object-cover" /> : dev.name.slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-gray-900 font-black text-xl">{dev.name}</p>
            <p className="text-[#5B4BDB] text-xs font-bold uppercase tracking-widest">Send Request</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition">✕</button>
        </div>

        {error && <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold text-sm mb-6">{error}</div>}

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Project Subject</label>
            <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Configurator App..."
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-4 text-sm focus:border-[#5B4BDB] focus:ring-1 focus:ring-[#5B4BDB] outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Project Details</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4} required placeholder="Describe what you need built, timeline, budget..."
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-4 text-sm focus:border-[#5B4BDB] focus:ring-1 focus:ring-[#5B4BDB] outline-none transition resize-none" />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-xl border border-gray-200 text-gray-600 shadow-sm font-bold hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={loading} className={`flex-1 py-4 rounded-xl font-bold text-white shadow-md transition disabled:opacity-50 ${loading ? 'bg-gray-400' : 'bg-[#5B4BDB] hover:bg-[#4a3bc7]'}`}>
              {loading ? "Sending…" : "Send Request"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Dev Card ──────────────────────────────────────────────────────────────────
function DevCard({ dev, user, onConnect, onChat, onTute }: { dev:Developer; user:any; onConnect:(d:Developer)=>void; onChat:(d:Developer)=>void; onTute:(d:Developer)=>void; }) {
  return (
    <div className="group bg-white rounded-3xl border border-gray-200 overflow-hidden hover:border-[#5B4BDB]/40 hover:shadow-xl hover:shadow-[#5B4BDB]/5 transition-all duration-300 flex flex-col h-full relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5B4BDB] to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="p-6 md:p-8 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-5">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0 flex items-center justify-center text-xl font-black text-gray-400">
            {dev.profileImage ? <img src={dev.profileImage} className="w-full h-full object-cover" onError={(e:any)=>e.target.style.display="none"} /> : dev.name.slice(0,2).toUpperCase()}
          </div>
          {dev.certified && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#5B4BDB] text-white rounded-full shadow-sm shadow-[#5B4BDB]/30 border border-[#5B4BDB]">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              <span className="text-[10px] font-black uppercase tracking-wider">Certified</span>
            </div>
          )}
        </div>

        <Link href={`/developer/${dev.userId || dev.id}`}>
          <h3 className="text-xl font-black text-gray-900 hover:text-[#5B4BDB] transition line-clamp-1">{dev.name}</h3>
        </Link>
        <p className="text-gray-500 text-sm mt-3 mb-6 font-medium leading-relaxed line-clamp-3 flex-grow">{dev.bio || "Spatial computing developer focusing on cutting-edge 3D technologies."}</p>

        {dev.skills?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {dev.skills.slice(0,4).map(s => <span key={s} className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] font-bold rounded-md">{s}</span>)}
            {dev.skills.length > 4 && <span className="px-2.5 py-1 bg-white border border-gray-100 text-gray-400 text-[11px] font-bold rounded-md">+{dev.skills.length-4}</span>}
          </div>
        )}

        {/* Buttons */}
        <div className="pt-5 border-t border-gray-100 flex flex-col gap-3 mt-auto">
          {user ? (
            <div className="flex gap-2">
              <button onClick={()=>onConnect(dev)} className="flex-1 py-3 bg-[#5B4BDB] text-white text-xs font-bold rounded-xl hover:bg-[#4a3bc7] transition shadow border border-[#5B4BDB]">Request</button>
              <button onClick={()=>onChat(dev)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:border-[#5B4BDB] hover:text-[#5B4BDB] transition shadow-sm">Chat</button>
            </div>
          ) : (
            <Link href="/login" className="w-full">
               <button className="w-full py-3 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition">Sign in to Connect</button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ConnectPage() {
  const router = useRouter();
  const [user,        setUser]        = useState<any>(null);
  const [devs,        setDevs]        = useState<Developer[]>([]);
  const [loading,     setLoading]     = useState(true);
  
  // Filters
  const [search,      setSearch]      = useState("");
  const [skillFilter, setSkillFilter] = useState("All");
  const [certOnly,    setCertOnly]    = useState(false);
  
  // Modals
  const [bookingDev,  setBookingDev]  = useState<Developer | null>(null);
  const [initiatingChat, setInitiatingChat] = useState<string|null>(null);
  const [toast,       setToast]       = useState("");

  useEffect(() => { const unsub = onAuthStateChanged(auth, u => setUser(u ?? null)); return () => unsub(); }, []);

  useEffect(() => {
    async function fetchDevs() {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db,"developerApplications"), where("status","==","approved")));
        const data = snap.docs.map(d => ({ id: d.id, userId: d.data().userId ?? d.id, ...d.data() } as Developer));
        setDevs(data);
      } catch(e) { console.error(e); } finally { setLoading(false); }
    }
    fetchDevs();
  }, []);

  const filtered = useMemo(() => {
    let out = devs;
    if (search.trim()) {
      const s = search.toLowerCase();
      out = out.filter(d => d.name?.toLowerCase().includes(s) || d.bio?.toLowerCase().includes(s) || d.skills?.some(sk => sk.toLowerCase().includes(s)));
    }
    if (skillFilter !== "All") out = out.filter(d => d.skills?.some(sk => sk.toLowerCase().includes(skillFilter.toLowerCase())));
    if (certOnly) out = out.filter(d => d.certified);
    out.sort((a,b) => (b.certified ? 1 : 0) - (a.certified ? 1 : 0));
    return out;
  }, [devs, search, skillFilter, certOnly]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }
  function handleRequestSuccess(reqId: string) { setBookingDev(null); showToast("Request sent!"); if (reqId) router.push(`/project-chat/${reqId}`); }

  async function handleChat(dev: Developer) {
    if (!user) { router.push("/login"); return; }
    setInitiatingChat(dev.id);
    try {
      const q = query(collection(db, "projectChats"), where("developerId", "==", dev.userId || dev.id), where("clientId", "==", user.uid));
      const snap = await getDocs(q);
      if (!snap.empty) { router.push(`/project-chat/${snap.docs[0].id}`); return; }
      
      const chatDoc = await addDoc(collection(db, "projectChats"), {
        requestId: "direct", requestTitle: "Direct Message", clientId: user.uid, clientName: user.displayName || "Client",
        clientPhoto: user.photoURL || "/avatar.png", developerId: dev.userId || dev.id, developerName: dev.name,
        developerPhoto: dev.profileImage || "/avatar.png", status: "active", funded: false, fundedAmount: 0,
        createdAt: serverTimestamp(), lastMessage: "", lastMessageAt: serverTimestamp(),
      });
      await addDoc(collection(db, "projectChats", chatDoc.id, "messages"), { type: "system", text: `💬 ${user.displayName || 'A client'} started a direct chat with you.`, createdAt: serverTimestamp() });
      router.push(`/project-chat/${chatDoc.id}`);
    } catch (e) { alert("Failed to initiate chat."); } finally { setInitiatingChat(null); }
  }

  function handleTute(dev: Developer) { if (dev.bookingLink) window.open(dev.bookingLink, "_blank"); else alert("No booking link."); }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#5B4BDB]/20 bg-[#5B4BDB]/5 text-[#5B4BDB] mb-6 font-black uppercase text-[10px] tracking-widest shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#5B4BDB] animate-pulse" /> Connect & Build
          </motion.div>
          <motion.h1 initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-6">
            Hire <span className="text-[#5B4BDB]">Top Developers</span>
          </motion.h1>
          <motion.p initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="text-gray-500 font-medium text-lg max-w-2xl mx-auto">
            Find certified experts in AR/VR, WebXR, and 3D modeling. Send project requests and chat directly to build your vision.
          </motion.p>
        </div>
      </div>

      <div className="flex-grow px-6 lg:px-8 py-12 max-w-7xl mx-auto w-full">
        
        {/* Filters Top Bar */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm mb-12 flex flex-col xl:flex-row gap-6 items-center">
          <div className="relative w-full xl:w-96 flex-shrink-0">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search developers, skills..." 
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold outline-none focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/20 transition" />
          </div>

          <div className="flex-1 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide flex items-center gap-2">
            {SKILL_FILTERS.map(s => (
              <button key={s} onClick={()=>setSkillFilter(s)}
                className={`px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition border ${skillFilter===s ? 'bg-[#5B4BDB] text-white border-[#5B4BDB] shadow shadow-[#5B4BDB]/20' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {s}
              </button>
            ))}
          </div>

          <button onClick={()=>setCertOnly(!certOnly)} className={`w-full xl:w-auto px-6 py-4 rounded-xl font-bold text-sm border transition flex items-center justify-center gap-2 whitespace-nowrap ${certOnly ? 'bg-[#5B4BDB]/10 text-[#5B4BDB] border-[#5B4BDB]/30' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            Certified Only
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({length:6}).map((_,i) => <div key={i} className="bg-white rounded-3xl border border-gray-200 h-80 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-3xl py-24 px-6 flex flex-col items-center text-center">
            <svg className="w-16 h-16 text-gray-300 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No developers found</h3>
            <p className="text-gray-500 font-medium mb-8">Try adjusting your filters or clearing the search query.</p>
            <button onClick={()=>{setSearch("");setSkillFilter("All");setCertOnly(false);}} className="px-6 py-3 border border-gray-200 rounded-xl font-bold bg-gray-50 text-gray-700 hover:bg-gray-100 transition">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((dev, i) => (
                <motion.div key={dev.id} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i*0.05}} className="flex">
                  <div className="w-full">
                    <DevCard dev={dev} user={user} onConnect={setBookingDev} onChat={handleChat} onTute={handleTute} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>
      <Footer />

      <AnimatePresence>
        {bookingDev && <RequestModal dev={bookingDev} user={user} onClose={()=>setBookingDev(null)} onSuccess={handleRequestSuccess} />}
        {toast && (
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:20}} className="fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl border border-[#5B4BDB] bg-[#5B4BDB] text-white shadow-xl shadow-[#5B4BDB]/20 text-sm font-bold flex items-center gap-3">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}