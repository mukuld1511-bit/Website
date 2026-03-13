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

const COLORS = ["#a78bfa","#22d3ee","#34d399","#fbbf24","#fb7185","#818cf8"];

// ── Request Modal ─────────────────────────────────────────────────────────────
function RequestModal({ dev, user, onClose, onSuccess }: {
  dev: Developer; user: any;
  onClose: ()=>void; onSuccess: (id:string)=>void;
}) {
  const [subject,  setSubject]  = useState("");
  const [message,  setMessage]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const color = dev.color ?? "#a78bfa";

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
        tutorColor:       dev.color ?? "#a78bfa",
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

  const inp = "w-full bg-white/[0.04] border border-white/8 text-white placeholder-white/25 text-sm rounded-xl px-4 py-3 focus:outline-none transition duration-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
        transition={{ duration:0.3 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0012] p-8">
        <div className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background:`linear-gradient(90deg,transparent,${color}50,transparent)` }} />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center text-base font-black flex-shrink-0"
            style={{ background:`${color}25`, border:`1px solid ${color}40`, color }}>
            {dev.profileImage
              ? <img src={dev.profileImage} className="w-full h-full object-cover" />
              : dev.name.slice(0,2).toUpperCase()
            }
          </div>
          <div>
            <p className="text-white font-black text-sm">{dev.name}</p>
            <p className="text-white/30 text-xs">Send Project Request</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-lg border border-white/8 flex items-center justify-center text-white/40 hover:text-white/70 transition duration-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h3 className="text-xl font-black text-white mb-5">Request a Project</h3>

        {error && (
          <div className="px-4 py-3 rounded-xl border border-rose-500/20 bg-rose-500/8 text-rose-400 text-sm mb-4">{error}</div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Project / Subject *</label>
            <input value={subject} onChange={e=>setSubject(e.target.value)}
              placeholder="e.g. AR Product Visualizer, Unity VR Game…"
              className={inp} style={{ borderColor: subject ? `${color}40` : undefined }} />
            {dev.subjects && dev.subjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {dev.subjects.map(s => (
                  <button key={s} type="button" onClick={()=>setSubject(s)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition duration-150"
                    style={subject===s
                      ? { background:`${color}18`, borderColor:`${color}40`, color }
                      : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)" }
                    }>{s}</button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Project Details *</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4} required
              placeholder="Describe your project — what you need, timeline, budget, references…"
              className={inp + " resize-none"} />
          </div>

          <div className="p-3 rounded-xl border border-white/6 bg-white/[0.02] text-xs text-white/30 leading-relaxed">
            📩 Your request goes directly to the developer. They'll respond via chat with next steps.
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/8 text-white/40 text-sm font-bold hover:border-white/15 transition duration-200">
              Cancel
            </button>
            <motion.button type="submit" disabled={loading}
              whileHover={{ scale:loading?1:1.03 }} whileTap={{ scale:loading?1:0.97 }}
              style={{ willChange:"transform", background:loading?"rgba(255,255,255,0.05)":`linear-gradient(135deg,${color},#0891b2)` }}
              className="flex-1 py-3 rounded-xl font-black text-white text-sm disabled:opacity-50">
              {loading ? "Sending…" : "Send Request →"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Dev Card ──────────────────────────────────────────────────────────────────
function DevCard({ dev, user, onConnect }: { dev:Developer; user:any; onConnect:(d:Developer)=>void }) {
  const color = dev.color ?? "#a78bfa";

  return (
    <div className="group relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-sm overflow-hidden hover:border-white/12 transition duration-300 h-full flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-[1px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
        style={{ background:`linear-gradient(90deg,transparent,${color}50,transparent)` }} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"
        style={{ background:`radial-gradient(ellipse at top,${color}06,transparent 65%)` }} />

      <div className="p-6 flex flex-col flex-1">

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0 overflow-hidden"
            style={{ background:`${color}20`, border:`1px solid ${color}35`, color }}>
            {dev.profileImage
              ? <img src={dev.profileImage} className="w-full h-full object-cover"
                  onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
              : dev.name.slice(0,2).toUpperCase()
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap mb-1">
              <Link href={`/developer/${dev.userId}`}>
                <h3 className="text-white font-black text-base hover:text-violet-300 transition duration-150 cursor-pointer leading-tight">{dev.name}</h3>
              </Link>
            </div>
            {dev.certified && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 mt-1">
                <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-emerald-300 text-[9px] font-black uppercase tracking-wider">Certified</span>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {dev.bio && (
          <p className="text-white/40 text-xs leading-relaxed line-clamp-2 mb-4">{dev.bio}</p>
        )}

        {/* Skills */}
        {dev.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {dev.skills.slice(0,5).map(s => (
              <span key={s} className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-white/8 bg-white/[0.03] text-white/45">{s}</span>
            ))}
            {dev.skills.length > 5 && (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white/25">+{dev.skills.length-5}</span>
            )}
          </div>
        )}

        {/* Links */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {dev.portfolio && (
            <a href={dev.portfolio.startsWith("http") ? dev.portfolio : `https://${dev.portfolio}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-[10px] font-bold text-white/30 hover:text-violet-300 transition duration-150">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Portfolio
            </a>
          )}
          {dev.linkedin && (
            <a href={dev.linkedin.startsWith("http") ? dev.linkedin : `https://${dev.linkedin}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-[10px] font-bold text-white/30 hover:text-cyan-300 transition duration-150">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
          )}
        </div>

        {/* Footer buttons — pinned to bottom */}
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2">
          <Link href={`/developer/${dev.userId}`} className="flex-1">
            <motion.div whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} style={{ willChange:"transform" }}
              className="py-2.5 rounded-xl border border-white/8 text-white/40 text-xs font-bold text-center hover:border-white/16 hover:text-white/60 transition duration-200 cursor-pointer">
              View Profile
            </motion.div>
          </Link>
          {user ? (
            <motion.button onClick={() => onConnect(dev)}
              whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
              style={{ willChange:"transform", background:`linear-gradient(135deg,${color},#0891b2)` }}
              className="flex-1 py-2.5 rounded-xl font-black text-white text-xs relative overflow-hidden">
              <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
              <span className="relative z-10">Request Project →</span>
            </motion.button>
          ) : (
            <Link href="/login" className="flex-1">
              <div style={{ background:`linear-gradient(135deg,${color},#0891b2)` }}
                className="py-2.5 rounded-xl font-black text-white text-xs text-center cursor-pointer">
                Sign In →
              </div>
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
  const [filtered,    setFiltered]    = useState<Developer[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [skillFilter, setSkillFilter] = useState("All");
  const [certOnly,    setCertOnly]    = useState(false);
  const [connectDev,  setConnectDev]  = useState<Developer | null>(null);
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

  function handleSessionCreated(sessionId: string) {
    setConnectDev(null);
    showToast("Request sent! Opening chat…");
    setTimeout(() => router.push(`/connect/${sessionId}`), 800);
  }

  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />

      <div className="relative pt-28 pb-24 px-4 overflow-x-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
          style={{ background:"radial-gradient(ellipse,rgba(167,139,250,0.1) 0%,transparent 70%)", filter:"blur(80px)" }} />

        <div className="relative z-10 max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm mb-5">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-violet-300/90 text-sm font-semibold uppercase tracking-widest">Find a Developer</span>
            </motion.div>

            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none mb-4">
                Hire an{" "}
                <span style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#22d3ee,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                  Expert
                </span>
              </h1>
              <p className="text-white/35 text-lg max-w-xl leading-relaxed">
                Browse verified AR/VR/3D developers. Send a direct project request and collaborate one-on-one.
              </p>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.2 }}
            className="grid grid-cols-3 gap-4 mb-8 max-w-lg">
            {[
              { label:"Verified Devs",  val: devs.length,                                                      color:"#a78bfa" },
              { label:"Certified",      val: devs.filter(d=>d.certified).length,                              color:"#34d399" },
              { label:"Skills Covered", val: [...new Set(devs.flatMap(d=>d.skills??[]))].length,              color:"#22d3ee" },
            ].map((s,i) => (
              <div key={i} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                <p className="text-2xl font-black mb-0.5"
                  style={{ backgroundImage:`linear-gradient(135deg,${s.color},white)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                  {loading ? "—" : s.val}
                </p>
                <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Filters */}
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.25 }}
            className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-violet-400 transition duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search by name, skill, subject…"
                  className="w-full bg-white/[0.03] border border-white/8 text-white placeholder-white/25 text-sm rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-violet-500/50 transition duration-200" />
              </div>
              <button onClick={()=>setCertOnly(!certOnly)}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border text-sm font-black transition duration-200"
                style={certOnly
                  ? { background:"rgba(52,211,153,0.12)", borderColor:"rgba(52,211,153,0.35)", color:"#34d399" }
                  : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.35)" }
                }>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Certified Only
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {SKILL_FILTERS.map(s=>(
                <button key={s} onClick={()=>setSkillFilter(s)}
                  className="flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border transition duration-200"
                  style={skillFilter===s
                    ? { background:"rgba(167,139,250,0.12)", borderColor:"rgba(167,139,250,0.35)", color:"#a78bfa" }
                    : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.35)" }
                  }>{s}</button>
              ))}
            </div>
            <p className="text-white/20 text-xs">
              {loading ? "Loading…" : `${filtered.length} developer${filtered.length!==1?"s":""} available`}
            </p>
          </motion.div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_,i) => (
                <div key={i} className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 h-64 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 rounded-3xl border border-white/8 bg-white/[0.03] flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-white/60 font-black text-xl mb-2">No developers found</h3>
              <p className="text-white/25 text-sm mb-6">Try a different search or filter</p>
              <button onClick={()=>{ setSearch(""); setSkillFilter("All"); setCertOnly(false); }}
                className="px-5 py-2.5 rounded-xl border border-white/8 text-white/40 text-sm font-bold hover:border-white/20 hover:text-white/60 transition duration-200">
                Clear Filters
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
              {filtered.map((dev, i) => (
                <motion.div key={dev.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay: i * 0.05 }} className="flex">
                  <div className="w-full">
                    <DevCard dev={dev} user={user} onConnect={setConnectDev} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA */}
          <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            transition={{ duration:0.6 }}
            className="mt-20 relative rounded-3xl overflow-hidden border border-white/6 bg-white/[0.025] backdrop-blur-xl p-10 text-center">
            <div className="absolute top-0 left-0 right-0 h-[1px]"
              style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.3),transparent)" }} />
            <div className="absolute inset-0 pointer-events-none"
              style={{ background:"radial-gradient(ellipse at center,rgba(124,58,237,0.06),transparent 70%)" }} />
            <p className="text-white/25 text-xs font-black uppercase tracking-[0.3em] mb-3">For Developers</p>
            <h2 className="text-3xl font-black tracking-tighter text-white mb-3">
              Want to{" "}
              <span style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                Take Projects?
              </span>
            </h2>
            <p className="text-white/35 text-sm max-w-md mx-auto mb-7 leading-relaxed">
              Join as a verified developer. Get hired directly, receive project requests, and build your reputation.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/join/developer">
                <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                  style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white text-sm cursor-pointer relative overflow-hidden">
                  <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                    style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                  <span className="relative z-10">Apply as Developer →</span>
                </motion.div>
              </Link>
              <Link href="/certification">
                <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} style={{ willChange:"transform" }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white/50 text-sm border border-white/10 hover:border-white/20 hover:text-white/70 transition duration-200 cursor-pointer">
                  Get Certified →
                </motion.div>
              </Link>
            </div>
          </motion.div>

        </div>
      </div>

      <Footer />

      <AnimatePresence>
        {connectDev && user && (
          <RequestModal dev={connectDev} user={user}
            onClose={() => setConnectDev(null)}
            onSuccess={handleSessionCreated} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:20, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:20, scale:0.95 }} transition={{ duration:0.3 }}
            className="fixed bottom-6 right-6 z-50 px-6 py-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 backdrop-blur-xl text-emerald-300 text-sm font-bold">
            ✓ {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}