"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "../components/Footer";

interface Developer {
  id: string; name: string; bio: string; skills: string[];
  profileImage: string; portfolio: string; linkedin: string;
  userId: string; certified: boolean; color?: string;
  bookingLink?: string; bookingPlatform?: string;
  subjects?: string[]; hourlyRate?: number; createdAt: any;
  availability?: "available" | "busy" | "unavailable";
  totalSessions?: number; rating?: number;
}

const SKILL_FILTERS = ["All","Unity","Blender","Three.js","WebXR","AR Foundation","Unreal Engine","React Three Fiber","Maya","ZBrush","AutoCAD"];
const COLORS = ["blue","cyan","emerald","amber","rose","indigo"];
const AVAIL_DOT: Record<string, string> = { available:"bg-green-500", busy:"bg-amber-400", unavailable:"bg-gray-300" };

// ─── Gemini matcher ───────────────────────────────────────────────────────────
async function geminiMatch(goal: string, devs: Developer[]): Promise<string> {
  const devList = devs.map(d => `${d.name} (skills: ${d.skills?.slice(0,4).join(", ")})`).join("; ");
  const prompt = `You are a creator-matching assistant on SYNTHÉ, an XR/3D platform.
User needs: "${goal}"
Available creators: ${devList}
Recommend the best 2-3 creators by name with a single-sentence reason each. Be direct and concise. Under 80 words total.`;
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.5,maxOutputTokens:200} }) }
  );
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ─── Gemini brief writer ──────────────────────────────────────────────────────
async function geminiBrief(rough: string): Promise<string> {
  const prompt = `You are a professional project brief writer for SYNTHÉ, an XR/3D platform.
User's rough idea: "${rough}"
Write a polished, professional project request in 3-4 sentences. Cover: what they need, the goal, any key requirements. Keep it under 80 words. Return only the brief text, no preamble.`;
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.7,maxOutputTokens:150} }) }
  );
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ─── Request Modal ────────────────────────────────────────────────────────────
function RequestModal({ dev, user, onClose, onSuccess }: { dev:Developer; user:any; onClose:()=>void; onSuccess:(id:string)=>void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [roughIdea, setRoughIdea] = useState("");
  const [showAiHelper, setShowAiHelper] = useState(false);

  const handleAiWrite = async () => {
    if (!roughIdea.trim()) return;
    setAiLoading(true);
    try {
      const brief = await geminiBrief(roughIdea);
      setMessage(brief);
      setShowAiHelper(false);
      setRoughIdea("");
    } catch { }
    setAiLoading(false);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) { setError("Fill all fields"); return; }
    setLoading(true); setError("");
    try {
      const ref = await addDoc(collection(db,"chatSessions"), {
        tutorId: dev.id, tutorUserId: dev.userId || dev.id,
        tutorName: dev.name, tutorAvatar: dev.profileImage ?? "",
        tutorColor: dev.color ?? "blue", tutorBookingLink: dev.bookingLink ?? "",
        tutorPlatform: dev.bookingPlatform ?? "Calendly",
        studentId: user.uid, studentName: user.displayName ?? "Student",
        studentAvatar: user.photoURL ?? "", subject: subject.trim(),
        message: message.trim(), status: "active", createdAt: serverTimestamp(),
      });
      onSuccess(ref.id);
    } catch(e:any) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{opacity:0,scale:0.96,y:16}} animate={{opacity:1,scale:1,y:0}}
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              {dev.profileImage
                ? <img src={dev.profileImage} className="w-full h-full object-cover" alt=""/>
                : <div className="w-full h-full flex items-center justify-center font-black text-gray-400 text-sm">{dev.name?.[0]}</div>
              }
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm">{dev.name}</p>
              <p className="text-xs text-gray-400">Send project request</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Project / Subject *</label>
            <input value={subject} onChange={e=>setSubject(e.target.value)} required
              placeholder="e.g. AR Product Visualizer for iOS"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#5B4BDB] transition-colors placeholder-gray-400"/>
            {dev.subjects?.length ? (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {dev.subjects.map(s => (
                  <button key={s} type="button" onClick={()=>setSubject(s)}
                    className="text-xs px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 font-medium hover:bg-violet-100 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Project Details *</label>
              <button type="button" onClick={()=>setShowAiHelper(!showAiHelper)}
                className="flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Draft with Gemini
              </button>
            </div>

            <AnimatePresence>
              {showAiHelper && (
                <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
                  className="overflow-hidden mb-3">
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-violet-700">Describe your idea roughly — Gemini will write it professionally</p>
                    <input value={roughIdea} onChange={e=>setRoughIdea(e.target.value)}
                      placeholder="I need someone to build an AR app that..."
                      className="w-full border border-violet-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-violet-500 transition-colors"/>
                    <button type="button" onClick={handleAiWrite} disabled={aiLoading||!roughIdea.trim()}
                      className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold disabled:opacity-40 transition-colors">
                      {aiLoading ? "Writing..." : "Generate brief →"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <textarea value={message} onChange={e=>setMessage(e.target.value)} required rows={4}
              placeholder="Describe your project — scope, timeline, references..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#5B4BDB] transition-colors resize-none placeholder-gray-400"/>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 font-medium">
            Your request goes directly to {dev.name}. They'll respond via chat.
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] text-white font-bold text-sm disabled:opacity-50 transition-colors border-b-[2px] border-[#4438b8]">
              {loading ? "Sending..." : "Send Request"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Dev Card ─────────────────────────────────────────────────────────────────
function DevCard({ dev, user, onRequest, onChat }: { dev:Developer; user:any; onRequest:(d:Developer)=>void; onChat:(d:Developer)=>void }) {
  const avail = dev.availability ?? "available";
  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
      className={`bg-white border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col ${dev.certified ? "border-[#5B4BDB]/30 shadow-[0_0_0_1px_#5B4BDB20]" : "border-gray-200"}`}>
      {dev.certified && <div className="h-1 bg-gradient-to-r from-[#5B4BDB] to-violet-400"/>}

      <div className="p-6 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
              {dev.profileImage
                ? <img src={dev.profileImage} className="w-full h-full object-cover" alt=""
                    onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                : <div className="w-full h-full flex items-center justify-center font-black text-gray-400 text-lg">{dev.name?.[0]}</div>
              }
            </div>
            <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${AVAIL_DOT[avail]}`}/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/developer/${dev.userId||dev.id}`}>
                  <p className="font-black text-gray-900 hover:text-[#5B4BDB] transition-colors cursor-pointer text-sm leading-tight">{dev.name}</p>
                </Link>
                {dev.certified && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-[#5B4BDB] text-white mt-1">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                    CERTIFIED
                  </span>
                )}
              </div>
              {dev.hourlyRate ? (
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-gray-900 text-sm">₹{dev.hourlyRate.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">/hr</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 mb-3">
          {dev.rating ? (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <span className="text-xs font-bold text-gray-600">{dev.rating.toFixed(1)}</span>
            </div>
          ) : null}
          {dev.totalSessions ? <span className="text-xs text-gray-400">{dev.totalSessions} sessions</span> : null}
          <span className={`text-xs font-medium ml-auto ${avail==="available"?"text-green-600":avail==="busy"?"text-amber-600":"text-gray-400"}`}>
            {avail==="available"?"Available":avail==="busy"?"Busy":"Unavailable"}
          </span>
        </div>

        {/* Bio */}
        {dev.bio && <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{dev.bio}</p>}

        {/* Skills */}
        {dev.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {dev.skills.slice(0,5).map(s => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium border border-gray-200">{s}</span>
            ))}
            {dev.skills.length > 5 && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">+{dev.skills.length-5}</span>}
          </div>
        )}

        {/* Links */}
        <div className="flex gap-3 mb-5">
          {dev.portfolio && (
            <a href={dev.portfolio.startsWith("http")?dev.portfolio:`https://${dev.portfolio}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-[#5B4BDB] transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              Portfolio
            </a>
          )}
          {dev.linkedin && (
            <a href={dev.linkedin.startsWith("http")?dev.linkedin:`https://${dev.linkedin}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-[#5B4BDB] transition-colors">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </a>
          )}
        </div>
      </div>

      {/* CTAs */}
      <div className="px-6 pb-6 flex flex-col gap-2 mt-auto">
        {user ? (
          <>
            <button onClick={()=>onRequest(dev)}
              className="w-full py-2.5 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] text-white font-bold text-sm transition-colors border-b-[2px] border-[#4438b8] active:translate-y-[1px]">
              Send Request
            </button>
            <div className="flex gap-2">
              <button onClick={()=>onChat(dev)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors">
                Message
              </button>
              <Link href={`/developer/${dev.userId||dev.id}`} className="flex-1">
                <button className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors">
                  Profile
                </button>
              </Link>
            </div>
          </>
        ) : (
          <Link href="/login">
            <button className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors">
              Sign in to connect
            </button>
          </Link>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConnectPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [devs, setDevs] = useState<Developer[]>([]);
  const [filtered, setFiltered] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("All");
  const [certOnly, setCertOnly] = useState(false);
  const [requestDev, setRequestDev] = useState<Developer|null>(null);
  const [toast, setToast] = useState("");
  const [aiGoal, setAiGoal] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u??null));
    return ()=>unsub();
  }, []);

  useEffect(() => {
    async function fetchDevs() {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db,"developerApplications"), where("status","==","approved")));
        const data = snap.docs.map((d,i)=>({ id:d.id, color:COLORS[i%COLORS.length], userId:d.data().userId??d.id, ...d.data() } as Developer));
        data.sort((a,b)=>(b.certified?1:0)-(a.certified?1:0));
        setDevs(data);
      } catch(e){console.error(e);}
      setLoading(false);
    }
    fetchDevs();
  }, []);

  useEffect(() => {
    let out = [...devs];
    if (search.trim()) {
      const s = search.toLowerCase();
      out = out.filter(d => d.name?.toLowerCase().includes(s)||d.bio?.toLowerCase().includes(s)||d.skills?.some(sk=>sk.toLowerCase().includes(s)));
    }
    if (skillFilter!=="All") out = out.filter(d=>d.skills?.some(sk=>sk.toLowerCase().includes(skillFilter.toLowerCase())));
    if (certOnly) out = out.filter(d=>d.certified);
    setFiltered(out);
  }, [devs, search, skillFilter, certOnly]);

  const showToast = (msg:string)=>{ setToast(msg); setTimeout(()=>setToast(""),3000); };

  const handleRequestSuccess = (id:string) => { setRequestDev(null); showToast("Request sent!"); router.push(`/connect/chat/${id}`); };

  const handleChat = async (dev:Developer) => {
    if (!user) { router.push("/login"); return; }
    try {
      const q = query(collection(db,"chatSessions"), where("tutorUserId","==",dev.userId||dev.id), where("studentId","==",user.uid));
      const snap = await getDocs(q);
      if (!snap.empty) { router.push(`/connect/chat/${snap.docs[0].id}`); return; }
      const ref = await addDoc(collection(db,"chatSessions"), {
        tutorId:dev.id, tutorUserId:dev.userId||dev.id, tutorName:dev.name, tutorAvatar:dev.profileImage??"",
        tutorColor:dev.color??"blue", tutorBookingLink:dev.bookingLink??"", tutorPlatform:dev.bookingPlatform??"Calendly",
        studentId:user.uid, studentName:user.displayName??"User", studentAvatar:user.photoURL??"",
        subject:"Direct Message", status:"active", createdAt:serverTimestamp(),
      });
      router.push(`/connect/chat/${ref.id}`);
    } catch(e){ console.error(e); }
  };

  const handleAiMatch = async () => {
    if (!aiGoal.trim()||!devs.length) return;
    setAiLoading(true); setAiResult("");
    try {
      const res = await geminiMatch(aiGoal, devs);
      setAiResult(res);
    } catch { setAiResult("Something went wrong. Try again."); }
    setAiLoading(false);
  };

  const stats = {
    total: devs.length,
    certified: devs.filter(d=>d.certified).length,
    skills: [...new Set(devs.flatMap(d=>d.skills??[]))].length,
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col font-sans">
      <div className="max-w-7xl mx-auto px-4 py-14 flex-grow w-full">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-3">Connect</p>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">Find a Creator</h1>
              <p className="text-gray-500 max-w-lg">Browse verified AR/VR/3D creators. Send a request to collaborate, or message directly.</p>
            </div>
            <div className="flex gap-4">
              {[
                {label:"Creators", value:stats.total},
                {label:"Certified", value:stats.certified},
                {label:"Skills", value:stats.skills},
              ].map(s=>(
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-black text-gray-900">{loading?"—":s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gemini matcher */}
        <div className="bg-white border border-violet-200 rounded-2xl p-5 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-[#5B4BDB] flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <p className="text-sm font-bold text-gray-900">AI Creator Matcher</p>
            <span className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-semibold">Gemini</span>
          </div>
          <div className="flex gap-2">
            <input value={aiGoal} onChange={e=>setAiGoal(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleAiMatch()}
              placeholder="What do you need? e.g. AR app for Android, VR game in Unity..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#5B4BDB] transition-colors"/>
            <button onClick={handleAiMatch} disabled={!aiGoal.trim()||aiLoading}
              className="px-4 py-2.5 bg-[#5B4BDB] hover:bg-[#4c3ec7] disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-colors shrink-0">
              {aiLoading?"...":"Match →"}
            </button>
          </div>
          <AnimatePresence>
            {aiResult && (
              <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
                className="mt-3 bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-violet-900 leading-relaxed whitespace-pre-wrap">
                {aiResult}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or skill..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#5B4BDB] transition-colors"/>
            </div>
            <button onClick={()=>setCertOnly(!certOnly)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${certOnly?"bg-[#5B4BDB] border-[#5B4BDB] text-white":"bg-white border-gray-200 text-gray-600 hover:border-gray-400"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
              Certified only
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {SKILL_FILTERS.map(s=>(
              <button key={s} onClick={()=>setSkillFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${skillFilter===s?"bg-[#5B4BDB] text-white border-[#5B4BDB]":"bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-gray-100 text-xs text-gray-400 font-medium">
            <span>{filtered.length} creator{filtered.length!==1?"s":""}</span>
            {(search||skillFilter!=="All"||certOnly)&&(
              <button onClick={()=>{setSearch("");setSkillFilter("All");setCertOnly(false);}} className="text-[#5B4BDB] font-bold hover:underline">Clear filters</button>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_,i)=>(
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse h-64"/>
            ))}
          </div>
        ) : filtered.length===0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-200">
            <p className="text-4xl mb-4">👀</p>
            <p className="font-bold text-gray-900 mb-2">No creators found</p>
            <button onClick={()=>{setSearch("");setSkillFilter("All");setCertOnly(false);}}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm hover:bg-[#4c3ec7] transition-colors">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((dev,i)=>(
              <motion.div key={dev.id} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"-40px"}} transition={{duration:0.4,delay:i*0.04}}>
                <DevCard dev={dev} user={user} onRequest={setRequestDev} onChat={handleChat}/>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-gray-900 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-black text-white mb-3">Want to join as a creator?</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">Get verified, appear on this page, and start receiving project requests from clients worldwide.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/join"><button className="px-7 py-3 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] text-white font-bold text-sm transition-colors border-b-[2px] border-[#4438b8]">Apply as Developer</button></Link>
            <Link href="/certification"><button className="px-7 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors border border-white/20">Get Certified →</button></Link>
          </div>
        </div>
      </div>

      <Footer/>

      <AnimatePresence>
        {requestDev&&(
          <RequestModal dev={requestDev} user={user} onClose={()=>setRequestDev(null)} onSuccess={handleRequestSuccess}/>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast&&(
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:16}}
            className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-bold shadow-lg flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}