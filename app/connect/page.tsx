"use client";

import { useEffect, useState } from "react";
import {
  collection, getDocs, query, where,
  addDoc, serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

interface Developer {
  id: string;
  name: string;
  bio: string;
  skills: string[];
  profileImage: string;
  portfolio: string;
  linkedin: string;
  userId: string;
  certified: boolean;
  color?: string;
  bookingLink?: string;
  bookingPlatform?: string;
  subjects?: string[];
  hourlyRate?: number;
  createdAt: any;
}

const SKILL_FILTERS = [
  "All","Unity","Blender","Three.js","WebXR","AR Foundation",
  "Unreal Engine","React Three Fiber","Maya","ZBrush","AutoCAD",
];

const COLORS = ["blue","cyan","emerald","amber","rose","indigo"];

// ── Request Modal ─────────────────────────────────────────────────────────────
function RequestModal({ dev, user, onClose, onSuccess }: {
  dev: Developer; user: any;
  onClose: ()=>void; onSuccess: (id:string)=>void;
}) {
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
        tutorId:          dev.id,
        tutorUserId:      dev.userId || dev.id,
        tutorName:        dev.name,
        tutorAvatar:      dev.profileImage ?? "",
        tutorColor:       dev.color ?? "blue",
        tutorBookingLink: dev.bookingLink ?? "",
        tutorPlatform:    dev.bookingPlatform ?? "Calendly",
        studentId:        user.uid,
        studentName:      user.displayName ?? "Student",
        studentAvatar:    user.photoURL ?? "",
        subject:          subject.trim(),
        message:          message.trim(),
        status:           "active",
        createdAt:        serverTimestamp(),
      });
      onSuccess(ref.id);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  }

  const inp = "w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition duration-200 shadow-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
        transition={{ duration:0.3 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl">
        
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center text-lg font-bold flex-shrink-0 bg-${color}-50 text-${color}-600 border border-${color}-100`}>
            {dev.profileImage
              ? <img src={dev.profileImage} className="w-full h-full object-cover" />
              : dev.name.slice(0,2).toUpperCase()
            }
          </div>
          <div className="flex-1">
            <p className="text-gray-900 font-extrabold text-base">{dev.name}</p>
            <p className="text-gray-500 text-xs font-semibold">Send Project Request</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h3 className="text-xl font-black text-gray-900 mb-5">Request a Project</h3>

        {error && (
          <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 font-semibold text-sm mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Project / Subject *</label>
            <input value={subject} onChange={e=>setSubject(e.target.value)}
              placeholder="e.g. AR Product Visualizer, Unity VR Game…"
              className={inp} />
            {dev.subjects && dev.subjects.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {dev.subjects.map(s => (
                  <button key={s} type="button" onClick={()=>setSubject(s)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition duration-150 ${
                      subject === s ? `bg-${color}-50 border-${color}-200 text-${color}-700` : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >{s}</button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Project Details *</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4} required
              placeholder="Describe your project — what you need, timeline, budget, references…"
              className={inp + " resize-none"} />
          </div>

          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50 text-xs text-blue-800 font-medium leading-relaxed">
            📩 Your request goes directly to the developer. They'll respond via chat with next steps.
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-50 transition duration-200">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className={`flex-1 py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition shadow-sm ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
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
  const color = dev.color ?? "blue";

  return (
    <div className="group relative rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition duration-300 h-full flex flex-col overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-${color}-500 opacity-0 group-hover:opacity-100 transition duration-300`} />

      <div className="p-6 md:p-8 flex flex-col flex-1">

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 overflow-hidden bg-${color}-50 text-${color}-600 border border-${color}-100`}>
            {dev.profileImage
              ? <img src={dev.profileImage} className="w-full h-full object-cover"
                  onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
              : dev.name.slice(0,2).toUpperCase()
            }
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-start gap-2 flex-wrap mb-1">
              <Link href={`/developer/${dev.userId || dev.id}`}>
                <h3 className="text-gray-900 font-extrabold text-lg hover:text-blue-600 transition duration-150 cursor-pointer leading-tight truncate">{dev.name}</h3>
              </Link>
            </div>
            {dev.certified && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-green-200 bg-green-50 mt-1">
                <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-700 text-[10px] font-bold uppercase tracking-wider">Certified</span>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {dev.bio && (
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-5 font-medium">{dev.bio}</p>
        )}

        {/* Skills */}
        {dev.skills?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {dev.skills.slice(0,5).map(s => (
              <span key={s} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-gray-50 text-gray-600">{s}</span>
            ))}
            {dev.skills.length > 5 && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 bg-white border border-gray-100">+{dev.skills.length-5}</span>
            )}
          </div>
        )}

        {/* Links */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          {dev.portfolio && (
            <a href={dev.portfolio.startsWith("http") ? dev.portfolio : `https://${dev.portfolio}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 transition duration-150">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Portfolio
            </a>
          )}
          {dev.linkedin && (
            <a href={dev.linkedin.startsWith("http") ? dev.linkedin : `https://${dev.linkedin}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 transition duration-150">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
          )}
        </div>

        {/* Footer buttons — pinned to bottom */}
        <div className="mt-auto pt-5 border-t border-gray-100 flex flex-col gap-2">
          {user ? (
            <div className="flex flex-wrap gap-2 w-full">
              <button onClick={() => onConnect(dev)} className={`flex-1 min-w-[30%] py-2.5 rounded-lg font-bold text-white text-[11px] bg-blue-600 hover:bg-blue-700 shadow-sm transition`}>
                Request
              </button>
              <button onClick={() => onChat(dev)} className={`flex-1 min-w-[30%] py-2.5 rounded-lg font-bold text-blue-700 text-[11px] bg-blue-50 border border-blue-200 hover:bg-blue-100 shadow-sm transition`}>
                Chat
              </button>
              {dev.bookingLink ? (
                <button onClick={() => onTute(dev)} className={`flex-1 min-w-[30%] py-2.5 rounded-lg font-bold text-gray-700 text-[11px] bg-gray-50 border border-gray-200 hover:bg-gray-100 shadow-sm transition`}>
                  Tute
                </button>
              ) : null}
            </div>
          ) : (
            <Link href="/login" className="w-full">
              <button className="w-full py-2.5 rounded-lg font-bold text-gray-700 text-sm bg-gray-100 hover:bg-gray-200 transition">
                Sign In to Connect
              </button>
            </Link>
          )}
          <Link href={`/developer/${dev.userId || dev.id}`} className="w-full">
            <button className="w-full py-2.5 rounded-lg border border-gray-300 text-gray-700 text-[11px] font-bold text-center hover:bg-gray-50 transition duration-200">
              View Profile
            </button>
          </Link>
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
  const [filtered,    setFiltered]    = useState<Developer[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [skillFilter, setSkillFilter] = useState("All");
  const [certOnly,    setCertOnly]    = useState(false);
  const [bookingDev,  setBookingDev]  = useState<Developer | null>(null);
  const [initiatingChatWithDev, setInitiatingChatWithDev] = useState<string|null>(null);
  const [toast,       setToast]       = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetchDevs() {
      setLoading(true);
      try {
        const snap = await getDocs(query(
          collection(db,"developerApplications"),
          where("status","==","approved")
        ));
        const data = snap.docs.map((d, i) => ({
          id:     d.id,
          color:  COLORS[i % COLORS.length],
          userId: d.data().userId ?? d.id,
          ...d.data(),
        } as Developer));
        // Sort client-side by createdAt desc
        data.sort((a,b) => (b.createdAt?.seconds??0) - (a.createdAt?.seconds??0));
        setDevs(data);
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    fetchDevs();
  }, []);

  useEffect(() => {
    let out = [...devs];
    if (search.trim()) {
      const s = search.toLowerCase();
      out = out.filter(d =>
        d.name?.toLowerCase().includes(s) ||
        d.bio?.toLowerCase().includes(s) ||
        d.skills?.some(sk => sk.toLowerCase().includes(s)) ||
        d.subjects?.some(su => su.toLowerCase().includes(s))
      );
    }
    if (skillFilter !== "All") {
      out = out.filter(d => d.skills?.some(sk => sk.toLowerCase().includes(skillFilter.toLowerCase())));
    }
    if (certOnly) out = out.filter(d => d.certified);
    // Certified first
    out.sort((a,b) => (b.certified ? 1 : 0) - (a.certified ? 1 : 0));
    setFiltered(out);
  }, [devs, search, skillFilter, certOnly]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  function handleRequestSuccess(reqId: string) {
    setBookingDev(null);
    showToast("Request sent! Opening chat…");
    if (!reqId) return;
    router.push(`/project-chat/${reqId}`);
  }

  async function handleChat(dev: Developer) {
    if (!user) { router.push("/login"); return; }
    setInitiatingChatWithDev(dev.id);
    try {
      // Check if chat already exists
      const q = query(
        collection(db, "projectChats"), 
        where("developerId", "==", dev.userId || dev.id), 
        where("clientId", "==", user.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        router.push(`/project-chat/${snap.docs[0].id}`);
        return;
      }

      // Create new direct message chat
      const chatsRef = collection(db, "projectChats");
      const chatDoc = await addDoc(chatsRef, {
        requestId:     "direct",
        requestTitle:  "Direct Message",
        clientId:      user.uid,
        clientName:    user.displayName || "Client",
        clientPhoto:   user.photoURL || "/avatar.png",
        developerId:   dev.userId || dev.id,
        developerName: dev.name,
        developerPhoto: dev.profileImage || "/avatar.png",
        status:        "active",
        funded:        false,
        fundedAmount:  0,
        createdAt:     serverTimestamp(),
        lastMessage:   "",
        lastMessageAt: serverTimestamp(),
      });

      await addDoc(collection(db, "projectChats", chatDoc.id, "messages"), {
        type:      "system",
        text:      `💬 ${user.displayName || 'A client'} started a direct chat with you.`,
        createdAt: serverTimestamp(),
      });

      router.push(`/project-chat/${chatDoc.id}`);
    } catch (e) {
      console.error(e);
      alert("Failed to initiate chat.");
    } finally {
       setInitiatingChatWithDev(null);
    }
  }

  function handleTute(dev: Developer) {
    if (!dev.bookingLink) { alert("This developer has not provided a booking link."); return; }
    window.open(dev.bookingLink, "_blank");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <div className="flex-grow pb-24 pt-[100px] px-4">
        
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-12 text-center mt-10">
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-800 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">Find a Developer</span>
            </motion.div>

            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900 mb-6">
                Hire an Expert
              </h1>
              <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Browse verified AR/VR/3D developers. Send a direct project request and collaborate one-on-one.
              </p>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.2 }}
            className="grid grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto">
            {[
              { label:"Verified Devs",  val: devs.length,                                                      color:"blue" },
              { label:"Certified",      val: devs.filter(d=>d.certified).length,                              color:"green" },
              { label:"Skills Covered", val: [...new Set(devs.flatMap(d=>d.skills??[]))].length,              color:"purple" },
            ].map((s,i) => (
              <div key={i} className={`p-5 rounded-2xl border border-gray-200 bg-white shadow-sm text-center`}>
                <p className={`text-3xl font-black mb-1 text-${s.color}-600`}>
                  {loading ? "—" : s.val}
                </p>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Filters */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.25 }}
            className="mb-10 space-y-5 bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search by name, skill, subject…"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm md:text-base rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition duration-200 shadow-inner" />
              </div>
              <button onClick={()=>setCertOnly(!certOnly)}
                className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition duration-200 border whitespace-nowrap ${
                  certOnly ? "bg-green-50 border-green-200 text-green-700 shadow-sm" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Certified Only
              </button>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
              {SKILL_FILTERS.map(s=>(
                <button key={s} onClick={()=>setSkillFilter(s)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition duration-200 whitespace-nowrap ${
                    skillFilter === s ? "bg-blue-600 border-blue-600 text-white shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}>{s}</button>
              ))}
            </div>
            
            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
              <p className="text-gray-500 font-semibold text-sm">
                {loading ? "Loading developers…" : `${filtered.length} developer${filtered.length!==1?"s":""} available`}
              </p>
              {(search || skillFilter !== "All" || certOnly) && (
                 <button onClick={()=>{ setSearch(""); setSkillFilter("All"); setCertOnly(false); }} className="text-blue-600 text-sm font-bold hover:underline">Clear Filters</button>
              )}
            </div>
          </motion.div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_,i) => (
                <div key={i} className="rounded-3xl border border-gray-200 bg-white p-8 h-80 animate-pulse shadow-sm" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity:0, y: 20 }} animate={{ opacity:1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-gray-200 shadow-sm">
              <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-gray-900 font-extrabold text-2xl mb-2">No developers found</h3>
              <p className="text-gray-500 text-base mb-8 max-w-sm">We couldn't find any developers matching your current search criteria.</p>
              <button onClick={()=>{ setSearch(""); setSkillFilter("All"); setCertOnly(false); }}
                className="px-8 py-3.5 rounded-xl bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 transition duration-200 shadow-sm">
                Clear all filters
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {filtered.map((dev, i) => (
                <motion.div key={dev.id} initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-50px" }}
                  transition={{ duration:0.5, delay: i * 0.05 }} className="flex">
                  <div className="w-full">
                    <DevCard dev={dev} user={user} onConnect={setBookingDev} onChat={handleChat} onTute={handleTute} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA */}
          <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            transition={{ duration:0.6 }}
            className="mt-24 rounded-3xl overflow-hidden border border-gray-200 bg-white p-12 md:p-16 text-center shadow-lg relative">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-50 opacity-50 blur-3xl pointer-events-none" />
            
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">For Developers</p>
            <h2 className="text-4xl font-black tracking-tight text-gray-900 mb-4">
              Want to Take Projects?
            </h2>
            <p className="text-gray-500 text-lg max-w-lg mx-auto mb-10 leading-relaxed font-medium">
              Join as a verified developer. Get hired directly, receive project requests, and build your reputation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/join/developer">
                <button className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition">
                  Apply as Developer
                </button>
              </Link>
              <Link href="/certification">
                <button className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm transition">
                  Get Certified →
                </button>
              </Link>
            </div>
          </motion.div>

        </div>
      </div>

      <Footer />

      <AnimatePresence>
        {bookingDev && (
        <RequestModal dev={bookingDev} user={user}
          onClose={()=>setBookingDev(null)}
          onSuccess={handleRequestSuccess} />
      )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:20, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:20, scale:0.95 }} transition={{ duration:0.3 }}
            className="fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl border border-green-200 bg-green-50 shadow-lg text-green-700 text-sm font-bold flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}