"use client";

import { useEffect, useState } from "react";
import {
  collection, getDocs, query, orderBy,
  addDoc, serverTimestamp, where, doc, getDoc,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// ── Types ─────────────────────────────────────────────────────────────────────
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
  rating?: number;
  sessionsCount?: number;
  createdAt: any;
}

const SKILL_FILTERS = [
  "All","Unity","Blender","Three.js","WebXR","AR Foundation",
  "Unreal Engine","React Three Fiber","Maya","ZBrush","AutoCAD",
];

const COLORS = [
  "#a78bfa","#22d3ee","#34d399","#fbbf24","#fb7185","#818cf8",
];

function timeAgo(ts: any): string {
  if (!ts) return "";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 86400) return "Today";
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return `${Math.floor(s/604800)}w ago`;
}

// ── Request Session Modal ─────────────────────────────────────────────────────
function RequestModal({ dev, user, onClose, onSuccess }: {
  dev: Developer; user: any; onClose: ()=>void; onSuccess: (sessionId: string)=>void;
}) {
  const [subject,   setSubject]   = useState("");
  const [message,   setMessage]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const accentColor = dev.color ?? "#a78bfa";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) { setError("Enter a subject"); return; }
    setLoading(true); setError("");
    try {
      // Create chat session
      const sessionRef = await addDoc(collection(db,"chatSessions"), {
        tutorId:          dev.id,
        tutorUserId:      dev.userId,
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
      onSuccess(sessionRef.id);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  }

  const inputCls = "w-full bg-white/[0.04] border border-white/8 text-white placeholder-white/25 text-sm rounded-xl px-4 py-3 focus:outline-none transition duration-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
        transition={{ duration:0.3 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0012] backdrop-blur-xl p-8">
        <div className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background:`linear-gradient(90deg,transparent,${accentColor}50,transparent)` }} />

        {/* Dev info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black flex-shrink-0"
            style={{ background:`${accentColor}25`, border:`1px solid ${accentColor}40`, color:accentColor }}>
            {dev.profileImage
              ? <img src={dev.profileImage} className="w-full h-full rounded-2xl object-cover" />
              : dev.name.split(" ").map(n=>n[0]).join("").slice(0,2)
            }
          </div>
          <div>
            <p className="text-white font-black text-sm">{dev.name}</p>
            <p className="text-white/30 text-xs">Connect & Learn Session</p>
          </div>
        </div>

        <h3 className="text-xl font-black text-white mb-5">Start a Session</h3>

        {error && (
          <div className="px-4 py-3 rounded-xl border border-rose-500/20 bg-rose-500/8 text-rose-400 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Subject / Topic *</label>
            <input value={subject} onChange={e=>setSubject(e.target.value)}
              placeholder="e.g. AR Foundation for Unity, Blender modeling basics…"
              className={inputCls}
              style={{ borderColor: subject ? `${accentColor}40` : undefined }}
            />

            {/* Quick subject chips */}
            {dev.subjects && dev.subjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {dev.subjects.map(s => (
                  <button key={s} type="button" onClick={()=>setSubject(s)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition duration-150"
                    style={subject===s
                      ? { background:`${accentColor}18`, borderColor:`${accentColor}40`, color:accentColor }
                      : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)" }
                    }>{s}</button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Message (optional)</label>
            <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={3}
              placeholder="Tell the developer what you're working on or what you need help with…"
              className={inputCls + " resize-none"} />
          </div>

          <div className="p-3 rounded-xl border border-white/6 bg-white/[0.02] text-xs text-white/30 leading-relaxed">
            💬 A chat session will open immediately. The developer will share their booking link to schedule a video call.
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/8 text-white/40 text-sm font-bold hover:border-white/15 transition duration-200">
              Cancel
            </button>
            <motion.button type="submit" disabled={loading}
              whileHover={{ scale:loading?1:1.03 }} whileTap={{ scale:loading?1:0.97 }}
              style={{ willChange:"transform", background:loading?"rgba(255,255,255,0.05)":`linear-gradient(135deg,${accentColor},#0891b2)` }}
              className="flex-1 py-3 rounded-xl font-black text-white text-sm disabled:opacity-50">
              {loading ? "Starting…" : "Start Session →"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Developer Card ────────────────────────────────────────────────────────────
function DevCard({ dev, user, onConnect }: { dev:Developer; user:any; onConnect:(dev:Developer)=>void }) {
  const color = dev.color ?? "#a78bfa";

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      className="group relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-sm overflow-hidden hover:border-white/12 transition duration-300">
      <div className="absolute top-0 left-0 right-0 h-[1px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
        style={{ background:`linear-gradient(90deg,transparent,${color}50,transparent)` }} />

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"
        style={{ background:`radial-gradient(ellipse at top,${color}06,transparent 65%)` }} />

      <div className="p-6 relative">

        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0 overflow-hidden"
            style={{ background:`${color}20`, border:`1px solid ${color}35`, color }}>
            {dev.profileImage
              ? <img src={dev.profileImage} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
              : dev.name.split(" ").map(n=>n[0]).join("").slice(0,2)
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Link href={`/developer/${dev.userId}`}>
                <h3 className="text-white font-black text-base hover:text-violet-300 transition duration-150 cursor-pointer">{dev.name}</h3>
              </Link>
              {dev.certified && (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black border border-emerald-500/30 bg-emerald-500/12 text-emerald-300">
                  ✓ Certified
                </span>
              )}
            </div>
            {dev.hourlyRate && (
              <p className="text-xs font-black" style={{ color }}>₹{dev.hourlyRate}/hr</p>
            )}
            {dev.sessionsCount !== undefined && dev.sessionsCount > 0 && (
              <p className="text-white/25 text-[10px]">{dev.sessionsCount} sessions completed</p>
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

        {/* Subjects */}
        {dev.subjects && dev.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {dev.subjects.slice(0,3).map(s => (
              <span key={s} className="px-2.5 py-1 rounded-lg text-[10px] font-bold border"
                style={{ color, background:`${color}10`, borderColor:`${color}25` }}>{s}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 pt-4 border-t border-white/5">
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
              <span className="relative z-10">Connect →</span>
            </motion.button>
          ) : (
            <Link href="/login" className="flex-1">
              <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                style={{ willChange:"transform", background:`linear-gradient(135deg,${color},#0891b2)` }}
                className="py-2.5 rounded-xl font-black text-white text-xs text-center cursor-pointer">
                Sign In →
              </motion.div>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ConnectPage() {
  const router = useRouter();
  const [user,       setUser]       = useState<any>(null);
  const [devs,       setDevs]       = useState<Developer[]>([]);
  const [filtered,   setFiltered]   = useState<Developer[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [skillFilter,setSkillFilter]= useState("All");
  const [certOnly,   setCertOnly]   = useState(false);
  const [connectDev, setConnectDev] = useState<Developer | null>(null);
  const [toast,      setToast]      = useState("");

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
          where("status","==","approved"),
          orderBy("createdAt","desc")
        ));
        const data = snap.docs.map((d, i) => ({
          id:    d.id,
          color: COLORS[i % COLORS.length],
          ...d.data(),
        } as Developer));
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
    setFiltered(out);
  }, [devs, search, skillFilter, certOnly]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  function handleSessionCreated(sessionId: string) {
    setConnectDev(null);
    showToast("Session started! Opening chat…");
    setTimeout(() => router.push(`/connect/${sessionId}/chat`), 800);
  }

  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />

      <div className="relative pt-28 pb-24 px-4 overflow-x-hidden">

        {/* Ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
          style={{ background:"radial-gradient(ellipse,rgba(167,139,250,0.1) 0%,transparent 70%)", filter:"blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.018] pointer-events-none"
          style={{ backgroundImage:"linear-gradient(rgba(167,139,250,1) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,1) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />

        <div className="relative z-10 max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm mb-5">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-violet-300/90 text-sm font-semibold uppercase tracking-widest">Connect & Learn</span>
            </motion.div>

            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none mb-4">
                Learn From{" "}
                <span style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#22d3ee,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                  Experts
                </span>
              </h1>
              <p className="text-white/35 text-lg max-w-xl leading-relaxed">
                Connect directly with verified AR/VR/3D developers. Start a chat, book a session, and level up your skills.
              </p>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.2 }}
            className="grid grid-cols-3 gap-4 mb-8 max-w-lg">
            {[
              { label:"Verified Devs",  val: devs.length,                              color:"#a78bfa" },
              { label:"Certified",      val: devs.filter(d=>d.certified).length,       color:"#34d399" },
              { label:"Skills Covered", val: [...new Set(devs.flatMap(d=>d.skills??[]))].length, color:"#22d3ee" },
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

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((dev, i) => (
                <motion.div key={dev.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay: i * 0.05 }}>
                  <DevCard dev={dev} user={user} onConnect={setConnectDev} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Are you a dev CTA */}
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
                Teach & Earn?
              </span>
            </h2>
            <p className="text-white/35 text-sm max-w-md mx-auto mb-7 leading-relaxed">
              Join as a verified developer. Share your knowledge, connect with learners, and earn by teaching AR/VR/3D skills.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/join/developer">
                <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                  style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white text-sm cursor-pointer relative overflow-hidden">
                  <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                    style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                  <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="relative z-10">Apply as Developer</span>
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

      {/* Connect Modal */}
      <AnimatePresence>
        {connectDev && user && (
          <RequestModal
            dev={connectDev}
            user={user}
            onClose={() => setConnectDev(null)}
            onSuccess={handleSessionCreated}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity:0, y:20, scale:0.95 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:20, scale:0.95 }}
            transition={{ duration:0.3 }}
            className="fixed bottom-6 right-6 z-50 px-6 py-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 backdrop-blur-xl text-emerald-300 text-sm font-bold shadow-[0_8px_32px_rgba(52,211,153,0.2)]">
            ✓ {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}