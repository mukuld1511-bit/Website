"use client";

import { useEffect, useState } from "react";
import {
  collection, getDocs, query, where,
  addDoc, serverTimestamp, orderBy,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// ── Commission ────────────────────────────────────────────────────────────────
const PLATFORM_FEE = 0.15;
const RAZORPAY_FEE = 0.02;
const DIVISOR      = 0.83;
function getBuyerPrice(x: number)  { return Math.ceil(x / DIVISOR); }
function getPlatformFee(x: number) { return Math.ceil(x * PLATFORM_FEE); }
function getRazorpayFee(x: number) { return Math.ceil(x * RAZORPAY_FEE); }
function getDevEarnings(x: number) { return Math.floor(x * (1 - PLATFORM_FEE)); }

// ── Types ─────────────────────────────────────────────────────────────────────
interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  clientPays?: number;
  budgetType: "fixed" | "hourly";
  skills: string[];
  deadline: string;
  clientId: string;
  clientName: string;
  clientPhoto: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  bidsCount: number;
  createdAt: any;
}

const CATEGORIES = [
  "All","AR Development","VR Development","3D Modeling",
  "AutoCAD","Game Development","Animation","Architecture Viz","Other",
];

const SORT_OPTIONS = [
  { val:"newest",  label:"Newest First" },
  { val:"budget_high", label:"Budget: High→Low" },
  { val:"budget_low",  label:"Budget: Low→High" },
  { val:"bids_low",    label:"Fewest Bids" },
];

function timeAgo(ts: any): string {
  if (!ts) return "";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

const statusColors: Record<string,string> = {
  open:"#34d399", in_progress:"#fbbf24", completed:"#a78bfa", cancelled:"#fb7185",
};

// ── Post Project Modal ────────────────────────────────────────────────────────
function PostProjectModal({ user, onClose, onPosted }: {
  user: any; onClose: ()=>void; onPosted: ()=>void;
}) {
  const [form, setForm] = useState({
    title:"", description:"", category:"AR Development",
    budget:"", budgetType:"fixed" as "fixed"|"hourly",
    skills:"", deadline:"",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors,     setErrors]     = useState<Record<string,string>>({});

  function set(k: string, v: any) {
    setForm(f => ({ ...f, [k]:v }));
    setErrors(e => { const n={...e}; delete n[k]; return n; });
  }

  function validate() {
    const e: Record<string,string> = {};
    if (!form.title.trim())       e.title       = "Title required";
    if (!form.description.trim()) e.description = "Description required";
    if (!form.budget)             e.budget      = "Budget required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !user) return;
    setSubmitting(true);
    try {
      const budgetNum  = parseFloat(form.budget);
      const clientPays = getBuyerPrice(budgetNum);
      await addDoc(collection(db,"freelanceProjects"), {
        title:       form.title.trim(),
        description: form.description.trim(),
        category:    form.category,
        budget:      budgetNum,
        clientPays,
        platformFee: getPlatformFee(budgetNum),
        budgetType:  form.budgetType,
        skills:      form.skills.split(",").map(s=>s.trim()).filter(Boolean),
        deadline:    form.deadline,
        clientId:    user.uid,
        clientName:  user.displayName ?? "Client",
        clientPhoto: user.photoURL ?? "",
        status:      "open",
        bidsCount:   0,
        createdAt:   serverTimestamp(),
      });
      onPosted();
    } catch(e) { console.error(e); }
    setSubmitting(false);
  }

  const inp = (k: string) =>
    `w-full bg-white/[0.04] border ${errors[k]?"border-rose-500/50":"border-white/8"} text-white placeholder-white/25 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition duration-200`;
  const lbl = "block text-[10px] font-black uppercase tracking-[0.25em] text-white/30 mb-2";
  const budgetNum = parseFloat(form.budget) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
        transition={{ duration:0.3 }}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0a0012] backdrop-blur-xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.5),rgba(34,211,238,0.3),transparent)" }} />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-white">Post a Project</h3>
            <p className="text-white/35 text-xs mt-1">Get bids from verified developers</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg border border-white/8 flex items-center justify-center hover:border-white/20 text-white/40 hover:text-white/70 transition duration-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={lbl}>Project Title *</label>
            <input value={form.title} onChange={e=>set("title",e.target.value)}
              placeholder="e.g. AR Product Visualizer for E-commerce" className={inp("title")} />
            {errors.title && <p className="text-rose-400 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className={lbl}>Description *</label>
            <textarea value={form.description} onChange={e=>set("description",e.target.value)} rows={3}
              placeholder="Describe what you need built, platforms, features, references…"
              className={inp("description") + " resize-none"} />
            {errors.description && <p className="text-rose-400 text-xs mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Category</label>
              <select value={form.category} onChange={e=>set("category",e.target.value)}
                className={inp("category")}>
                {CATEGORIES.filter(c=>c!=="All").map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Deadline</label>
              <input type="date" value={form.deadline} onChange={e=>set("deadline",e.target.value)}
                className={inp("deadline")} />
            </div>
          </div>

          <div>
            <label className={lbl}>Budget (₹) * — Developer receives</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 text-sm">₹</span>
                <input type="number" min="0" value={form.budget} onChange={e=>set("budget",e.target.value)}
                  placeholder="15000" className={inp("budget") + " pl-7"} />
              </div>
              <div className="flex rounded-xl overflow-hidden border border-white/8">
                {(["fixed","hourly"] as const).map(t => (
                  <button key={t} type="button" onClick={()=>set("budgetType",t)}
                    className="px-4 py-2.5 text-xs font-black capitalize transition duration-200"
                    style={form.budgetType===t
                      ? { background:"linear-gradient(135deg,#7c3aed,#0891b2)", color:"white" }
                      : { background:"rgba(255,255,255,0.02)", color:"rgba(255,255,255,0.3)" }
                    }>{t === "fixed" ? "Fixed" : "Per Hour"}</button>
                ))}
              </div>
            </div>
            {errors.budget && <p className="text-rose-400 text-xs mt-1">{errors.budget}</p>}
          </div>

          {/* Live budget breakdown */}
          <AnimatePresence>
            {budgetNum > 0 && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
                exit={{ opacity:0, height:0 }}
                className="relative p-4 rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background:"linear-gradient(90deg,transparent,rgba(52,211,153,0.3),transparent)" }} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">Budget Breakdown</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400/60" />Developer receives
                    </span>
                    <span className="text-emerald-400 font-black">₹{budgetNum.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-violet-400/60" />Platform fee (15%)
                    </span>
                    <span className="text-white/40">₹{getPlatformFee(budgetNum).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400/60" />Razorpay (~2%)
                    </span>
                    <span className="text-white/40">₹{getRazorpayFee(budgetNum).toLocaleString()}</span>
                  </div>
                  <div className="h-[1px] bg-white/6" />
                  <div className="flex justify-between text-xs">
                    <span className="text-white/70 font-black">You pay total</span>
                    <span className="text-white font-black">₹{getBuyerPrice(budgetNum).toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className={lbl}>Skills Required</label>
            <input value={form.skills} onChange={e=>set("skills",e.target.value)}
              placeholder="Unity, Blender, ARCore, Three.js (comma-separated)" className={inp("skills")} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border border-white/8 text-white/40 text-sm font-bold hover:border-white/15 transition duration-200">
              Cancel
            </button>
            <motion.button type="submit" disabled={submitting}
              whileHover={{ scale:submitting?1:1.02 }} whileTap={{ scale:submitting?1:0.98 }}
              style={{ willChange:"transform", background:submitting?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#7c3aed,#0891b2)" }}
              className="flex-1 py-3.5 rounded-2xl font-black text-white text-sm disabled:opacity-50 relative overflow-hidden">
              <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
              <span className="relative z-10">{submitting ? "Posting…" : "Post Project →"}</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const sc = statusColors[project.status] ?? "#34d399";

  return (
    <Link href={`/freelance/${project.id}`}>
      <motion.div whileHover={{ y:-2 }} transition={{ type:"spring", stiffness:300, damping:25 }}
        style={{ willChange:"transform" }}
        className="group relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-sm overflow-hidden hover:border-white/12 transition duration-300 cursor-pointer h-full flex flex-col p-6">
        <div className="absolute top-0 left-0 right-0 h-[1px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
          style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.3),transparent)" }} />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black border"
              style={{ color:sc, background:`${sc}12`, borderColor:`${sc}25` }}>
              ● {project.status.replace("_"," ").toUpperCase()}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black border border-violet-500/20 bg-violet-500/8 text-violet-300">
              {project.category}
            </span>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-base font-black"
              style={{ backgroundImage:"linear-gradient(135deg,#34d399,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              ₹{project.budget.toLocaleString()}
            </p>
            <p className="text-white/20 text-[9px]">{project.budgetType}</p>
          </div>
        </div>

        <h3 className="text-white font-black text-base leading-snug mb-2 group-hover:text-violet-200 transition duration-200">
          {project.title}
        </h3>
        <p className="text-white/35 text-xs leading-relaxed line-clamp-2 flex-grow mb-4">
          {project.description}
        </p>

        {/* Skills */}
        {project.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.skills.slice(0,4).map(s => (
              <span key={s} className="px-2 py-1 rounded-lg text-[9px] font-bold border border-white/6 bg-white/[0.02] text-white/35">{s}</span>
            ))}
            {project.skills.length > 4 && (
              <span className="px-2 py-1 rounded-lg text-[9px] font-bold text-white/20">+{project.skills.length-4}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 bg-white/[0.05] flex items-center justify-center">
              {project.clientPhoto
                ? <img src={project.clientPhoto} className="w-full h-full object-cover"
                    onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                : <span className="text-white/30 text-[8px] font-black">{project.clientName?.[0]}</span>
              }
            </div>
            <span className="text-white/30 text-[10px] font-semibold">{project.clientName}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-white/25">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {project.bidsCount ?? 0} bids
            </span>
            <span>{timeAgo(project.createdAt)}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FreelancePage() {
  const [user,        setUser]        = useState<any>(null);
  const [projects,    setProjects]    = useState<Project[]>([]);
  const [filtered,    setFiltered]    = useState<Project[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showPost,    setShowPost]    = useState(false);
  const [search,      setSearch]      = useState("");
  const [category,    setCategory]    = useState("All");
  const [sortBy,      setSortBy]      = useState("newest");
  const [statusFilter,setStatusFilter]= useState("open");
  const [toast,       setToast]       = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const snap = await getDocs(query(
        collection(db,"freelanceProjects"),
        orderBy("createdAt","desc")
      ));
      setProjects(snap.docs.map(d => ({ id:d.id, ...d.data() } as Project)));
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { fetchProjects(); }, []);

  useEffect(() => {
    let out = [...projects];

    if (statusFilter !== "all") {
      out = out.filter(p => p.status === statusFilter);
    }
    if (category !== "All") {
      out = out.filter(p => p.category === category);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      out = out.filter(p =>
        p.title?.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s) ||
        p.skills?.some(sk => sk.toLowerCase().includes(s))
      );
    }

    // Sort
    if (sortBy === "budget_high") out.sort((a,b) => b.budget - a.budget);
    else if (sortBy === "budget_low") out.sort((a,b) => a.budget - b.budget);
    else if (sortBy === "bids_low") out.sort((a,b) => (a.bidsCount??0) - (b.bidsCount??0));
    else out.sort((a,b) => (b.createdAt?.seconds??0) - (a.createdAt?.seconds??0));

    setFiltered(out);
  }, [projects, search, category, sortBy, statusFilter]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  const openCount      = projects.filter(p=>p.status==="open").length;
  const inProgressCount= projects.filter(p=>p.status==="in_progress").length;
  const totalBudget    = projects.filter(p=>p.status==="open").reduce((s,p)=>s+p.budget,0);

  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />

      <div className="relative pt-28 pb-24 px-4 overflow-x-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
          style={{ background:"radial-gradient(ellipse,rgba(124,58,237,0.1) 0%,transparent 70%)", filter:"blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.018] pointer-events-none"
          style={{ backgroundImage:"linear-gradient(rgba(167,139,250,1) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,1) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />

        <div className="relative z-10 max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm mb-5">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-violet-300/90 text-sm font-semibold uppercase tracking-widest">Freelance Market</span>
              </motion.div>
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none mb-3">
                  Find{" "}
                  <span style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#22d3ee,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                    Projects
                  </span>
                </h1>
                <p className="text-white/35 text-lg max-w-xl leading-relaxed">
                  Browse open projects, submit competitive bids, and get hired by top clients.
                </p>
              </motion.div>
            </div>

            {user && (
              <motion.button onClick={() => setShowPost(true)}
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.2 }}
                whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                className="flex-shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-white text-sm relative overflow-hidden">
                <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                  style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="relative z-10">Post a Project</span>
              </motion.button>
            )}
          </div>

          {/* Stats */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.15 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label:"Open Projects",   val: loading ? "—" : openCount,                                      color:"#34d399" },
              { label:"In Progress",     val: loading ? "—" : inProgressCount,                               color:"#fbbf24" },
              { label:"Total Budget",    val: loading ? "—" : `₹${(totalBudget/1000).toFixed(0)}K`,          color:"#a78bfa" },
              { label:"Total Projects",  val: loading ? "—" : projects.length,                               color:"#22d3ee" },
            ].map((s,i) => (
              <div key={i} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                <p className="text-xl font-black mb-0.5"
                  style={{ backgroundImage:`linear-gradient(135deg,${s.color},white)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                  {s.val}
                </p>
                <p className="text-white/25 text-[9px] font-semibold uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Filters */}
          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.2 }}
            className="mb-8 space-y-4">

            {/* Search + Sort */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-violet-400 transition duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search projects, skills, categories…"
                  className="w-full bg-white/[0.03] border border-white/8 text-white placeholder-white/25 text-sm rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-violet-500/50 transition duration-200" />
              </div>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                className="bg-white/[0.03] border border-white/8 text-white/60 text-sm rounded-2xl px-4 py-3.5 focus:outline-none focus:border-violet-500/50 transition duration-200">
                {SORT_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
              </select>
            </div>

            {/* Status filter */}
            <div className="flex gap-2 flex-wrap">
              {[
                { val:"open",        label:"Open",        color:"#34d399" },
                { val:"in_progress", label:"In Progress", color:"#fbbf24" },
                { val:"completed",   label:"Completed",   color:"#a78bfa" },
                { val:"all",         label:"All",         color:"#818cf8" },
              ].map(s => (
                <button key={s.val} onClick={()=>setStatusFilter(s.val)}
                  className="px-3.5 py-2 rounded-xl text-xs font-black border transition duration-200"
                  style={statusFilter===s.val
                    ? { background:`${s.color}15`, borderColor:`${s.color}40`, color:s.color }
                    : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.35)" }
                  }>{s.label}</button>
              ))}
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map(c => (
                <button key={c} onClick={()=>setCategory(c)}
                  className="flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border transition duration-200"
                  style={category===c
                    ? { background:"rgba(167,139,250,0.12)", borderColor:"rgba(167,139,250,0.35)", color:"#a78bfa" }
                    : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.35)" }
                  }>{c}</button>
              ))}
            </div>

            <p className="text-white/20 text-xs">
              {loading ? "Loading…" : `${filtered.length} project${filtered.length!==1?"s":""} found`}
            </p>
          </motion.div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_,i) => (
                <div key={i} className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 h-56 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 rounded-3xl border border-white/8 bg-white/[0.03] flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white/60 font-black text-xl mb-2">No projects found</h3>
              <p className="text-white/25 text-sm mb-6">Try different filters or be the first to post!</p>
              <div className="flex gap-3">
                <button onClick={()=>{ setSearch(""); setCategory("All"); setStatusFilter("open"); }}
                  className="px-5 py-2.5 rounded-xl border border-white/8 text-white/40 text-sm font-bold hover:border-white/20 hover:text-white/60 transition duration-200">
                  Clear Filters
                </button>
                {user && (
                  <motion.button onClick={() => setShowPost(true)}
                    whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                    style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                    className="px-5 py-2.5 rounded-xl font-black text-white text-sm">
                    Post a Project →
                  </motion.button>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
              {filtered.map((p,i) => (
                <motion.div key={p.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay: i * 0.04 }} className="flex">
                  <div className="w-full">
                    <ProjectCard project={p} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA for non-logged in */}
          {!user && (
            <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              transition={{ duration:0.6 }}
              className="mt-20 relative rounded-3xl overflow-hidden border border-white/6 bg-white/[0.025] backdrop-blur-xl p-10 text-center">
              <div className="absolute top-0 left-0 right-0 h-[1px]"
                style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.3),transparent)" }} />
              <h2 className="text-3xl font-black tracking-tighter text-white mb-3">
                Ready to{" "}
                <span style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                  Get Started?
                </span>
              </h2>
              <p className="text-white/35 text-sm max-w-md mx-auto mb-7 leading-relaxed">
                Sign up to post projects or bid on open ones. Join hundreds of developers and clients.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link href="/signup">
                  <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                    style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white text-sm cursor-pointer">
                    Create Account →
                  </motion.div>
                </Link>
                <Link href="/login">
                  <motion.div whileHover={{ scale:1.03 }} style={{ willChange:"transform" }}
                    className="inline-flex px-6 py-3 rounded-2xl font-black text-white/50 text-sm border border-white/10 hover:border-white/20 hover:text-white/70 transition duration-200 cursor-pointer">
                    Sign In
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      <Footer />

      <AnimatePresence>
        {showPost && user && (
          <PostProjectModal
            user={user}
            onClose={() => setShowPost(false)}
            onPosted={() => {
              setShowPost(false);
              showToast("Project posted!");
              fetchProjects();
            }}
          />
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