"use client";

import { useState, useEffect } from "react";
import {
  collection, addDoc, getDocs, query,
  orderBy, serverTimestamp, updateDoc, doc,
} from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// ── Commission ────────────────────────────────────────────────────────────────
const PLATFORM_FEE = 0.15;
const DIVISOR      = 0.83;
function getBuyerPrice(x: number)  { return Math.ceil(x / DIVISOR); }
function getPlatformFee(x: number) { return Math.ceil(x * PLATFORM_FEE); }
function getDevEarnings(x: number) { return Math.floor(x * (1 - PLATFORM_FEE)); }

// ── Types ─────────────────────────────────────────────────────────────────────
interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  budgetType: "fixed" | "hourly";
  skills: string[];
  deadline: string;
  clientId: string;
  clientName: string;
  clientPhoto: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  bidsCount: number;
  createdAt: any;
  isPremium?: boolean;
}

const CATEGORIES = [
  "All","AR Development","VR Development","3D Modeling","Unity Development",
  "Unreal Engine","WebXR","Mobile AR","CAD/Technical","Animation","Game Dev",
];

const SKILL_OPTIONS = [
  "Unity","Unreal Engine","Blender","Three.js","WebXR","AR Foundation",
  "Vuforia","React Three Fiber","Maya","ZBrush","MRTK","Spark AR","C#","TypeScript",
];

const BUDGET_RANGES = [
  { label:"All Budgets", min:0,     max:Infinity },
  { label:"₹0 – ₹5K",   min:0,     max:5000 },
  { label:"₹5K – ₹20K", min:5000,  max:20000 },
  { label:"₹20K – ₹50K",min:20000, max:50000 },
  { label:"₹50K+",       min:50000, max:Infinity },
];

function timeAgo(ts: any): string {
  if (!ts) return "";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

// ── Post Project Modal ────────────────────────────────────────────────────────
function PostProjectModal({ user, onClose, onSuccess }: { user:any; onClose:()=>void; onSuccess:()=>void }) {
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [category,    setCategory]    = useState("AR Development");
  const [budget,      setBudget]      = useState("");
  const [budgetType,  setBudgetType]  = useState<"fixed"|"hourly">("fixed");
  const [skills,      setSkills]      = useState<string[]>([]);
  const [deadline,    setDeadline]    = useState("");
  const [skillInput,  setSkillInput]  = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  function addSkill(s: string) {
    const t = s.trim();
    if (t && !skills.includes(t) && skills.length < 10) setSkills(p => [...p, t]);
    setSkillInput("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !description || !budget) { setError("Fill all required fields."); return; }
    setLoading(true); setError("");
    try {
      const budgetNum  = parseFloat(budget);
      const clientPays = getBuyerPrice(budgetNum);
      await addDoc(collection(db,"freelanceProjects"), {
        title:       title.trim(),
        description: description.trim(),
        category,
        budget:      budgetNum,
        clientPays,
        budgetType,
        skills,
        deadline,
        clientId:    user.uid,
        clientName:  user.displayName ?? "Anonymous",
        clientPhoto: user.photoURL ?? "",
        status:      "open",
        bidsCount:   0,
        createdAt:   serverTimestamp(),
      });
      onSuccess();
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  }

  const inputCls = "w-full bg-white/[0.04] border border-white/8 text-white placeholder-white/25 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition duration-200";
  const budgetNum = parseFloat(budget) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
        transition={{ duration:0.3 }}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0a0012] backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.5),rgba(34,211,238,0.3),transparent)" }} />
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-white">Post a Project</h2>
              <p className="text-white/35 text-sm mt-1">Get bids from verified developers</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl border border-white/8 flex items-center justify-center hover:border-white/20 transition duration-200 text-white/40 hover:text-white/70">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-500/20 bg-rose-500/8 mb-5 overflow-hidden">
                <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-rose-400 text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Project Title *</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Build an AR Try-On App for E-Commerce" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Description *</label>
              <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4}
                placeholder="Describe what you need, key deliverables, tech requirements..."
                className={inputCls + " resize-none"} />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Category</label>
              <div className="relative">
                <select value={category} onChange={e=>setCategory(e.target.value)} className={inputCls + " appearance-none pr-10 cursor-pointer"}>
                  {CATEGORIES.filter(c=>c!=="All").map(c=><option key={c} className="bg-[#0a0012]">{c}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Budget (₹) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 text-sm">₹</span>
                  <input type="number" min="0" value={budget} onChange={e=>setBudget(e.target.value)} placeholder="e.g. 25000" className={inputCls + " pl-8"} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Budget Type</label>
                <div className="grid grid-cols-2 gap-2 h-[50px]">
                  {(["fixed","hourly"] as const).map(t => (
                    <button key={t} type="button" onClick={()=>setBudgetType(t)}
                      className={`rounded-xl text-xs font-bold border transition duration-200 ${
                        budgetType===t ? "bg-violet-500/15 border-violet-500/40 text-violet-300" : "bg-white/[0.03] border-white/8 text-white/40"
                      }`}>
                      {t==="fixed"?"Fixed":"Per Hour"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Commission breakdown for client */}
            <AnimatePresence>
              {budgetNum > 0 && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                  className="relative p-4 rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[1px]"
                    style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.3),rgba(34,211,238,0.2),transparent)" }} />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">Budget Breakdown</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400/60" />Developer receives</span>
                      <span className="text-emerald-400 font-black">₹{budgetNum.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-violet-400/60" />Platform fee (15%)</span>
                      <span className="text-white/40">₹{getPlatformFee(budgetNum).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400/60" />Razorpay (~2%)</span>
                      <span className="text-white/40">₹{Math.ceil(budgetNum * 0.02).toLocaleString()}</span>
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
              <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Deadline</label>
              <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)}
                min={new Date().toISOString().split("T")[0]} className={inputCls + " cursor-pointer"} />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Required Skills</label>
              <div className="min-h-[52px] bg-white/[0.04] border border-white/8 rounded-xl px-3 py-2.5 flex flex-wrap gap-2 focus-within:border-violet-500/50 transition duration-200"
                onClick={()=>document.getElementById("fl-skill-input")?.focus()}>
                {skills.map(s => (
                  <div key={s} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-violet-500/30 bg-violet-500/15 text-violet-300 text-xs font-bold">
                    {s}
                    <button type="button" onClick={()=>setSkills(p=>p.filter(x=>x!==s))} className="text-violet-400/60 hover:text-violet-200">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <input id="fl-skill-input" value={skillInput} onChange={e=>setSkillInput(e.target.value)}
                  onKeyDown={e=>{ if((e.key==="Enter"||e.key===",")&&skillInput.trim()){e.preventDefault();addSkill(skillInput);}}}
                  placeholder={skills.length===0?"Unity, WebXR, Blender…":""}
                  className="flex-1 min-w-[120px] bg-transparent text-white text-sm outline-none placeholder-white/20" />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SKILL_OPTIONS.filter(s=>!skills.includes(s)).slice(0,6).map(s=>(
                  <button key={s} type="button" onClick={()=>addSkill(s)}
                    className="px-2 py-1 rounded-lg border border-white/8 bg-white/[0.02] text-white/30 text-[10px] font-bold hover:border-violet-500/30 hover:text-violet-300 hover:bg-violet-500/8 transition duration-150">
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale:loading?1:1.02 }} whileTap={{ scale:loading?1:0.98 }}
              style={{ willChange:"transform", background:loading?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#7c3aed,#0891b2)" }}
              className="w-full py-4 rounded-2xl font-black text-white text-sm disabled:opacity-50 relative overflow-hidden mt-2">
              {!loading && (
                <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                  style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Posting…</>
                ) : "🚀 Post Project"}
              </span>
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ── Bid Modal ─────────────────────────────────────────────────────────────────
function BidModal({ project, user, onClose, onSuccess }: { project:Project; user:any; onClose:()=>void; onSuccess:()=>void }) {
  const [amount,   setAmount]   = useState("");
  const [timeline, setTimeline] = useState("");
  const [proposal, setProposal] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !proposal.trim()) { setError("Fill all required fields."); return; }
    setLoading(true); setError("");
    try {
      const bidAmount  = parseFloat(amount);
      const devEarns   = getDevEarnings(bidAmount);
      const platFee    = getPlatformFee(bidAmount);
      const clientPays = getBuyerPrice(bidAmount);
      await addDoc(collection(db,"freelanceBids"), {
        projectId:      project.id,
        developerId:    user.uid,
        developerName:  user.displayName ?? "Developer",
        developerPhoto: user.photoURL ?? "",
        amount:         bidAmount,
        developerEarns: devEarns,
        platformFee:    platFee,
        clientPays,
        timeline:       timeline.trim(),
        proposal:       proposal.trim(),
        status:         "pending",
        createdAt:      serverTimestamp(),
      });
      await updateDoc(doc(db,"freelanceProjects",project.id), {
        bidsCount: (project.bidsCount ?? 0) + 1,
      });
      onSuccess();
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  }

  const inputCls = "w-full bg-white/[0.04] border border-white/8 text-white placeholder-white/25 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500/50 transition duration-200";
  const bidNum = parseFloat(amount) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
        transition={{ duration:0.3 }}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0a0012] backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background:"linear-gradient(90deg,transparent,rgba(34,211,238,0.5),rgba(167,139,250,0.3),transparent)" }} />
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-white">Submit Your Bid</h2>
              <p className="text-white/35 text-xs mt-1 line-clamp-1">{project.title}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg border border-white/8 flex items-center justify-center hover:border-white/20 text-white/40 hover:text-white/70 transition duration-200">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-3 rounded-2xl border border-cyan-500/15 bg-cyan-500/5 mb-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-cyan-300/70 text-xs">Client budget: <span className="font-black text-cyan-300">₹{project.budget.toLocaleString()}</span> ({project.budgetType})</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/8 mb-4">
              <p className="text-rose-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Your Bid (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 text-sm">₹</span>
                  <input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="20000" className={inputCls + " pl-7"} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Timeline</label>
                <input value={timeline} onChange={e=>setTimeline(e.target.value)} placeholder="e.g. 2 weeks" className={inputCls} />
              </div>
            </div>

            {/* Earnings breakdown */}
            <AnimatePresence>
              {bidNum > 0 && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                  className="relative p-4 rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[1px]"
                    style={{ background:"linear-gradient(90deg,transparent,rgba(34,211,238,0.3),transparent)" }} />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">Your Earnings Breakdown</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400/60" />Your bid</span>
                      <span className="text-emerald-400 font-black">₹{bidNum.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-violet-400/60" />Platform fee (15%)</span>
                      <span className="text-white/40">- ₹{getPlatformFee(bidNum).toLocaleString()}</span>
                    </div>
                    <div className="h-[1px] bg-white/6" />
                    <div className="flex justify-between text-xs">
                      <span className="text-white/70 font-black">You receive</span>
                      <span className="text-white font-black">₹{getDevEarnings(bidNum).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] mt-1">
                      <span className="text-white/25">Client pays (incl. fees)</span>
                      <span className="text-white/40 font-bold">₹{getBuyerPrice(bidNum).toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Proposal *</label>
              <textarea value={proposal} onChange={e=>setProposal(e.target.value)} rows={4}
                placeholder="Explain your approach, relevant experience, why you're the best fit..."
                className={inputCls + " resize-none"} />
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale:loading?1:1.02 }} whileTap={{ scale:loading?1:0.98 }}
              style={{ willChange:"transform", background:loading?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#0891b2,#7c3aed)" }}
              className="w-full py-3.5 rounded-2xl font-black text-white text-sm disabled:opacity-50">
              <span className="flex items-center justify-center gap-2">
                {loading ? "Submitting…" : "Submit Bid →"}
              </span>
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ p, user, onBid }: { p:Project; user:any; onBid:(p:Project)=>void }) {
  const statusColors: Record<string,string> = {
    open:"#34d399", in_progress:"#fbbf24", completed:"#a78bfa", cancelled:"#fb7185",
  };
  const sc = statusColors[p.status] ?? "#34d399";

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      className="group relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-sm overflow-hidden hover:border-white/12 transition duration-300">
      <div className="absolute top-0 left-0 right-0 h-[1px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
        style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.5),transparent)" }} />
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black border"
                style={{ color:sc, background:`${sc}15`, borderColor:`${sc}30` }}>
                ● {p.status.replace("_"," ").toUpperCase()}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black border border-violet-500/20 bg-violet-500/8 text-violet-300">
                {p.category}
              </span>
            </div>
            <Link href={`/freelance/${p.id}`}>
              <h3 className="text-white font-black text-base leading-snug hover:text-violet-300 transition duration-200 cursor-pointer line-clamp-2">{p.title}</h3>
            </Link>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-black"
              style={{ backgroundImage:"linear-gradient(135deg,#34d399,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              ₹{p.budget.toLocaleString()}
            </p>
            <p className="text-white/30 text-[10px] font-semibold">{p.budgetType}</p>
          </div>
        </div>

        <p className="text-white/40 text-sm leading-relaxed line-clamp-2 mb-4">{p.description}</p>

        {p.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {p.skills.slice(0,4).map(s=>(
              <span key={s} className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-white/8 bg-white/[0.03] text-white/45">{s}</span>
            ))}
            {p.skills.length > 4 && <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white/25">+{p.skills.length-4}</span>}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 bg-white/[0.05] flex items-center justify-center flex-shrink-0">
              {p.clientPhoto
                ? <img src={p.clientPhoto} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                : <span className="text-white/30 text-[9px] font-black">{p.clientName?.[0]}</span>
              }
            </div>
            <div>
              <p className="text-white/50 text-xs font-bold">{p.clientName}</p>
              <p className="text-white/20 text-[10px]">{timeAgo(p.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-white/30 text-xs">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              <span>{p.bidsCount ?? 0} bids</span>
            </div>
            {p.deadline && (
              <div className="flex items-center gap-1 text-white/30 text-xs">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{new Date(p.deadline).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>
              </div>
            )}
            {user && p.status === "open" && user.uid !== p.clientId && (
              <motion.button onClick={() => onBid(p)}
                whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                className="px-4 py-2 rounded-xl font-black text-white text-xs relative overflow-hidden">
                <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                  style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                <span className="relative z-10">Bid Now</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FreelancePage() {
  const [user,         setUser]         = useState<any>(null);
  const [projects,     setProjects]     = useState<Project[]>([]);
  const [filtered,     setFiltered]     = useState<Project[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [category,     setCategory]     = useState("All");
  const [budgetRange,  setBudgetRange]  = useState(0);
  const [sortBy,       setSortBy]       = useState("newest");
  const [statusFilter, setStatusFilter] = useState("open");
  const [showPost,     setShowPost]     = useState(false);
  const [bidTarget,    setBidTarget]    = useState<Project | null>(null);
  const [toast,        setToast]        = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db,"freelanceProjects"), orderBy("createdAt","desc")));
      setProjects(snap.docs.map(d=>({ id:d.id, ...d.data() } as Project)));
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { fetchProjects(); }, []);

  useEffect(() => {
    let out = [...projects];
    if (search.trim()) {
      const s = search.toLowerCase();
      out = out.filter(p => p.title?.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s) || p.skills?.some(sk=>sk.toLowerCase().includes(s)));
    }
    if (category !== "All") out = out.filter(p => p.category === category);
    if (statusFilter !== "all") out = out.filter(p => p.status === statusFilter);
    const range = BUDGET_RANGES[budgetRange];
    out = out.filter(p => p.budget >= range.min && p.budget <= range.max);
    out.sort((a,b) => {
      if (sortBy==="newest")   return (b.createdAt?.seconds??0)-(a.createdAt?.seconds??0);
      if (sortBy==="budget_h") return b.budget-a.budget;
      if (sortBy==="budget_l") return a.budget-b.budget;
      if (sortBy==="bids")     return (b.bidsCount??0)-(a.bidsCount??0);
      return 0;
    });
    setFiltered(out);
  }, [projects, search, category, statusFilter, budgetRange, sortBy]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  const STATS = [
    { label:"Open Projects",  val:projects.filter(p=>p.status==="open").length,       color:"#34d399" },
    { label:"Total Projects", val:projects.length,                                     color:"#a78bfa" },
    { label:"In Progress",    val:projects.filter(p=>p.status==="in_progress").length, color:"#fbbf24" },
    { label:"Completed",      val:projects.filter(p=>p.status==="completed").length,   color:"#22d3ee" },
  ];

  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />

      <div className="relative pt-28 pb-24 px-4 overflow-x-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
          style={{ background:"radial-gradient(ellipse,rgba(124,58,237,0.12) 0%,transparent 70%)", filter:"blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.018] pointer-events-none"
          style={{ backgroundImage:"linear-gradient(rgba(167,139,250,1) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,1) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />

        <div className="relative z-10 max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm mb-5">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-violet-300/90 text-sm font-semibold uppercase tracking-widest">Freelance Marketplace</span>
            </motion.div>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none mb-3">
                  Find AR/VR{" "}
                  <span style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#22d3ee,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                    Projects
                  </span>
                </h1>
                <p className="text-white/35 text-lg max-w-xl">
                  Connect with clients who need AR/VR development, 3D modeling, and immersive experience design.
                </p>
              </motion.div>

              {user ? (
                <motion.button onClick={() => setShowPost(true)}
                  whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                  style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-white text-sm relative overflow-hidden flex-shrink-0">
                  <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                    style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                  <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="relative z-10">Post a Project</span>
                </motion.button>
              ) : (
                <Link href="/login">
                  <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                    style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-white text-sm cursor-pointer">
                    Sign in to Post →
                  </motion.div>
                </Link>
              )}
            </div>
          </div>

          {/* Stats */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {STATS.map((s,i) => (
              <div key={i} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                <p className="text-2xl font-black mb-1"
                  style={{ backgroundImage:`linear-gradient(135deg,${s.color},white)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                  {loading ? "—" : s.val}
                </p>
                <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">{s.label}</p>
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
                  placeholder="Search projects, skills, keywords…"
                  className="w-full bg-white/[0.03] border border-white/8 text-white placeholder-white/25 text-sm rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-violet-500/50 transition duration-200" />
              </div>
              <div className="relative">
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                  className="bg-white/[0.03] border border-white/8 text-white text-sm rounded-2xl px-4 py-3.5 pr-10 focus:outline-none appearance-none cursor-pointer min-w-[180px]">
                  <option value="newest"   className="bg-[#0a0010]">Newest First</option>
                  <option value="budget_h" className="bg-[#0a0010]">Budget: High to Low</option>
                  <option value="budget_l" className="bg-[#0a0010]">Budget: Low to High</option>
                  <option value="bids"     className="bg-[#0a0010]">Most Bids</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {(["all","open","in_progress","completed"] as const).map(s=>(
                <button key={s} onClick={()=>setStatusFilter(s)}
                  className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition duration-200"
                  style={statusFilter===s
                    ? { background:"rgba(167,139,250,0.15)", borderColor:"rgba(167,139,250,0.4)", color:"#a78bfa" }
                    : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.35)" }}>
                  {s==="all"?"All":s==="in_progress"?"In Progress":s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
              <div className="w-[1px] h-6 bg-white/8" />
              {BUDGET_RANGES.map((r,i)=>(
                <button key={i} onClick={()=>setBudgetRange(i)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border transition duration-200"
                  style={budgetRange===i
                    ? { background:"rgba(52,211,153,0.12)", borderColor:"rgba(52,211,153,0.35)", color:"#34d399" }
                    : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.35)" }}>
                  {r.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map(c=>(
                <button key={c} onClick={()=>setCategory(c)}
                  className="flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border transition duration-200"
                  style={category===c
                    ? { background:"rgba(34,211,238,0.12)", borderColor:"rgba(34,211,238,0.35)", color:"#22d3ee" }
                    : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.35)" }}>
                  {c}
                </button>
              ))}
            </div>

            <p className="text-white/20 text-xs">
              {loading ? "Loading…" : `${filtered.length} project${filtered.length!==1?"s":""} found`}
            </p>
          </motion.div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {[...Array(4)].map((_,i)=>(
                <div key={i} className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 h-52 animate-pulse" />
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
              <p className="text-white/25 text-sm mb-6">Be the first to post a project!</p>
              {user && (
                <motion.button onClick={()=>setShowPost(true)}
                  whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                  className="px-6 py-3 rounded-2xl font-black text-white text-sm">
                  Post a Project →
                </motion.button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filtered.map((p) => (
                <ProjectCard key={p.id} p={p} user={user} onBid={setBidTarget} />
              ))}
            </div>
          )}

          {/* How it works */}
          <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}
            className="mt-20 relative rounded-3xl overflow-hidden border border-white/6 bg-white/[0.025] backdrop-blur-xl p-10">
            <div className="absolute top-0 left-0 right-0 h-[1px]"
              style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.3),transparent)" }} />
            <div className="text-center mb-10">
              <p className="text-white/25 text-xs font-black uppercase tracking-[0.3em] mb-2">How It Works</p>
              <h2 className="text-3xl font-black tracking-tighter text-white">
                Simple. Fast.{" "}
                <span style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                  Secure.
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step:"01", icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", title:"Post Your Project", desc:"Describe what you need, set your budget, and required skills. It's free to post.", color:"#a78bfa" },
                { step:"02", icon:"M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z", title:"Receive Bids", desc:"Verified AR/VR developers submit proposals. Review their portfolio and experience.", color:"#22d3ee" },
                { step:"03", icon:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", title:"Hire & Pay Securely", desc:"Choose your developer. Payment is processed securely via Razorpay with escrow protection.", color:"#34d399" },
              ].map((s,i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm"
                      style={{ background:`${s.color}18`, border:`1px solid ${s.color}25`, color:s.color }}>
                      {s.step}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4" style={{ color:s.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={s.icon} />
                      </svg>
                      <h3 className="text-white font-black text-sm">{s.title}</h3>
                    </div>
                    <p className="text-white/35 text-xs leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-emerald-300 text-xs font-bold mb-1">🔒 Secure Payments via Razorpay</p>
                <p className="text-white/30 text-xs leading-relaxed">
                  All payments are processed securely through Razorpay. Clients release funds only after work is approved.
                  Platform takes 15% commission. Supports UPI, Cards, Net Banking, and Wallets.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />

      <AnimatePresence>
        {showPost && user && (
          <PostProjectModal
            user={user}
            onClose={() => setShowPost(false)}
            onSuccess={() => { setShowPost(false); fetchProjects(); showToast("Project posted successfully!"); }}
          />
        )}
        {bidTarget && user && (
          <BidModal
            project={bidTarget}
            user={user}
            onClose={() => setBidTarget(null)}
            onSuccess={() => { setBidTarget(null); fetchProjects(); showToast("Bid submitted!"); }}
          />
        )}
      </AnimatePresence>

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