"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// ── Commission info (no exact math — budget is a range string here) ───────────
const PLATFORM_FEE_PCT = 15;
const RAZORPAY_FEE_PCT = 2;

const CATEGORIES = [
  "3D Modeling","AR App","VR Experience","AutoCAD / CAD",
  "Game Asset","Animation","Architecture Viz","Product Design","Other",
];

const BUDGET_RANGES = [
  "Under ₹2,000","₹2,000–₹5,000","₹5,000–₹15,000",
  "₹15,000–₹50,000","₹50,000+","Negotiable",
];

const TIMELINES = [
  "< 1 week","1–2 weeks","2–4 weeks","1–3 months","3+ months","Flexible",
];

export default function PostRequestPage() {
  const [user,       setUser]       = useState<any>(null);
  const [submitted,  setSubmitted]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors,     setErrors]     = useState<Record<string,string>>({});

  const [form, setForm] = useState({
    title:"", description:"", category:"", budget:"", timeline:"",
    skills:"", files:"", isPublic:true,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  function set(key: string, val: any) {
    setForm(f => ({ ...f, [key]:val }));
    setErrors(e => { const n={...e}; delete n[key]; return n; });
  }

  function validate(): boolean {
    const e: Record<string,string> = {};
    if (!form.title.trim())       e.title       = "Project title required";
    if (!form.description.trim()) e.description = "Description required";
    if (!form.category)           e.category    = "Select a category";
    if (!form.budget)             e.budget      = "Select a budget range";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !user) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db,"projectRequests"), {
        title:          form.title,
        description:    form.description,
        category:       form.category,
        budget:         form.budget,
        timeline:       form.timeline,
        skills:         form.skills.split(",").map(s=>s.trim()).filter(Boolean),
        isPublic:       form.isPublic,
        userId:         user.uid,
        userName:       user.displayName ?? "Anonymous",
        userPhoto:      user.photoURL ?? "",
        status:         "open",
        bidsCount:      0,
        platformFee:    PLATFORM_FEE_PCT,
        razorpayFee:    RAZORPAY_FEE_PCT,
        createdAt:      serverTimestamp(),
      });
      setSubmitted(true);
    } catch(e) { console.error(e); }
    setSubmitting(false);
  }

  const inp = (key: string) =>
    `w-full bg-white/[0.03] border ${errors[key]?"border-rose-500/50":"border-white/8"} text-white placeholder-white/20 text-sm rounded-2xl px-4 py-3.5 focus:outline-none focus:border-cyan-500/50 transition duration-200`;
  const lbl = "block text-[10px] font-black uppercase tracking-[0.22em] text-white/35 mb-2";

  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />
      <div className="relative pt-28 pb-24 px-4 overflow-x-hidden">

        {/* Ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
          style={{ background:"radial-gradient(ellipse,#22d3ee10 0%,transparent 70%)", filter:"blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{ backgroundImage:"linear-gradient(rgba(34,211,238,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,0.5) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />

        <div className="relative z-10 max-w-5xl mx-auto">

          {/* Badge + Hero */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-300/90 text-sm font-semibold uppercase tracking-widest">G.Y.O.P — Get Your Own Project</span>
          </motion.div>

          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }} className="mb-10">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none mb-4">
              Post a{" "}
              <span style={{ backgroundImage:"linear-gradient(90deg,#22d3ee,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                Request
              </span>
            </h1>
            <p className="text-white/40 text-lg max-w-xl leading-relaxed">
              Describe your project and let verified Synthé developers apply with proposals. You pick the best fit.
            </p>
          </motion.div>

          {/* Success */}
          <AnimatePresence>
            {submitted && (
              <motion.div initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                className="flex flex-col items-center justify-center py-24 text-center">
                <motion.div animate={{ scale:[1,1.12,1] }} transition={{ duration:0.6, delay:0.2 }}
                  className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8"
                  style={{ background:"linear-gradient(135deg,#22d3ee,#7c3aed)", boxShadow:"0 0 60px #22d3ee40" }}>
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h2 className="text-4xl font-black text-white mb-3">Request Posted!</h2>
                <p className="text-white/40 text-base max-w-md leading-relaxed mb-8">
                  Your project request is now live. Developers can see it and send proposals. You'll be notified when bids come in.
                </p>
                <div className="flex gap-3">
                  <Link href="/requests">
                    <motion.div whileHover={{ scale:1.04 }} style={{ willChange:"transform", background:"linear-gradient(135deg,#22d3ee,#7c3aed)" }}
                      className="px-6 py-3 rounded-2xl font-black text-white text-sm cursor-pointer">
                      View All Requests →
                    </motion.div>
                  </Link>
                  <button onClick={()=>{setSubmitted(false);setForm({title:"",description:"",category:"",budget:"",timeline:"",skills:"",files:"",isPublic:true});}}>
                    <motion.div whileHover={{ scale:1.04 }} style={{ willChange:"transform" }}
                      className="px-6 py-3 rounded-2xl font-black text-white/60 text-sm border border-white/10 cursor-pointer hover:border-white/20 hover:text-white/80 transition duration-200">
                      Post Another
                    </motion.div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!submitted && (
            <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">

              {/* ── Form ── */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.2 }}
                className="p-7 rounded-3xl border border-white/8 bg-white/[0.025] space-y-6">

                {/* Title */}
                <div>
                  <label className={lbl}>Project Title *</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan-400 transition duration-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <input value={form.title} onChange={e=>set("title",e.target.value)}
                      placeholder="e.g. AR Product Visualizer for E-commerce"
                      className={`${inp("title")} pl-11`} />
                  </div>
                  {errors.title && <p className="text-rose-400 text-xs mt-1">{errors.title}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className={lbl}>Description *</label>
                  <textarea value={form.description} onChange={e=>set("description",e.target.value)} rows={5}
                    placeholder="Describe what you want built — platform, features, style, references, file formats, delivery requirements…"
                    className={`${inp("description")} resize-none`} />
                  {errors.description && <p className="text-rose-400 text-xs mt-1">{errors.description}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className={lbl}>Category *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIES.map(c=>(
                      <button key={c} onClick={()=>set("category",c)}
                        className="px-3 py-2.5 rounded-xl text-xs font-bold border transition duration-200 text-left"
                        style={form.category===c
                          ? { background:"#22d3ee18", borderColor:"#22d3ee45", color:"#22d3ee" }
                          : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)" }
                        }>{c}</button>
                    ))}
                  </div>
                  {errors.category && <p className="text-rose-400 text-xs mt-1">{errors.category}</p>}
                </div>

                {/* Budget + Timeline */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className={lbl}>Budget *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {BUDGET_RANGES.map(b=>(
                        <button key={b} onClick={()=>set("budget",b)}
                          className="px-2 py-2.5 rounded-xl text-xs font-bold border transition duration-200 text-center"
                          style={form.budget===b
                            ? { background:"#34d39918", borderColor:"#34d39945", color:"#34d399" }
                            : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)" }
                          }>{b}</button>
                      ))}
                    </div>
                    {errors.budget && <p className="text-rose-400 text-xs mt-1">{errors.budget}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Timeline</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TIMELINES.map(t=>(
                        <button key={t} onClick={()=>set("timeline",t)}
                          className="px-2 py-2.5 rounded-xl text-xs font-bold border transition duration-200 text-center"
                          style={form.timeline===t
                            ? { background:"#a78bfa18", borderColor:"#a78bfa45", color:"#a78bfa" }
                            : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)" }
                          }>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className={lbl}>Skills / Tools Wanted</label>
                  <input value={form.skills} onChange={e=>set("skills",e.target.value)}
                    placeholder="e.g. Unity, Blender, ARCore, Three.js (comma-separated)"
                    className={inp("skills")} />
                  <p className="text-white/20 text-[10px] mt-1">Comma-separate multiple skills</p>
                </div>

                {/* Commission notice */}
                <div className="relative p-4 rounded-2xl border border-violet-500/15 bg-violet-500/5 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[1px]"
                    style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.3),transparent)" }} />
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-violet-300 text-xs font-black mb-1">Platform Commission ({PLATFORM_FEE_PCT}%)</p>
                      <p className="text-white/30 text-xs leading-relaxed">
                        When you accept a bid and pay, SYNTHÉ charges a <span className="text-violet-300/80 font-bold">{PLATFORM_FEE_PCT}% platform fee</span> + Razorpay processing (~{RAZORPAY_FEE_PCT}%).
                        The developer receives their quoted amount. You pay the total inclusive price shown at checkout.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visibility toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/6 bg-white/[0.02]">
                  <div>
                    <p className="text-white text-xs font-black">Public Request</p>
                    <p className="text-white/30 text-[11px] mt-0.5">Visible to all verified Synthé developers</p>
                  </div>
                  <button onClick={()=>set("isPublic",!form.isPublic)}
                    className={`w-11 h-6 rounded-full transition duration-300 relative ${form.isPublic?"bg-cyan-500":"bg-white/10"}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${form.isPublic?"left-5":"left-0.5"}`} />
                  </button>
                </div>

                {/* Submit */}
                {!user ? (
                  <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/8 text-center">
                    <p className="text-amber-300/80 text-xs font-semibold">
                      <Link href="/login" className="underline text-amber-300 hover:text-amber-200 transition">Log in</Link>
                      {" "}or{" "}
                      <Link href="/signup" className="underline text-amber-300 hover:text-amber-200 transition">sign up</Link>
                      {" "}to post your request.
                    </p>
                  </div>
                ) : (
                  <motion.button onClick={handleSubmit} disabled={submitting}
                    whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                    style={{ willChange:"transform", background:"linear-gradient(135deg,#22d3ee,#7c3aed)", opacity:submitting?0.7:1 }}
                    className="w-full py-4 rounded-2xl font-black text-white text-sm cursor-pointer flex items-center justify-center gap-2 relative overflow-hidden">
                    <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                      style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                    {submitting ? (
                      <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg><span className="relative z-10">Posting…</span></>
                    ) : (
                      <><svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg><span className="relative z-10">Post Request →</span></>
                    )}
                  </motion.button>
                )}
              </motion.div>

              {/* ── Sidebar ── */}
              <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.5, delay:0.3 }}
                className="space-y-4 lg:sticky lg:top-28">

                {/* How it works */}
                <div className="p-5 rounded-3xl border border-white/6 bg-white/[0.025]">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30 mb-4">How It Works</p>
                  {[
                    { n:"01", t:"Post Your Request",  d:"Fill in project details, budget and timeline.",                  c:"#22d3ee" },
                    { n:"02", t:"Developers Apply",   d:"Verified devs send you proposals with price breakdowns.",        c:"#a78bfa" },
                    { n:"03", t:"Review & Choose",    d:"Compare bids, check portfolios and pick your dev.",              c:"#34d399" },
                    { n:"04", t:"Pay & Receive",      d:"15% platform fee + ~2% Razorpay applied at checkout.",          c:"#fbbf24" },
                  ].map((s,i)=>(
                    <div key={i} className="flex gap-3 mb-4 last:mb-0">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black"
                        style={{ background:`${s.c}18`, color:s.c, border:`1px solid ${s.c}30` }}>{s.n}</div>
                      <div>
                        <p className="text-white text-xs font-black mb-0.5">{s.t}</p>
                        <p className="text-white/30 text-[11px] leading-snug">{s.d}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Commission breakdown card */}
                <div className="relative p-5 rounded-3xl border border-white/6 bg-white/[0.025] overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[1px]"
                    style={{ background:"linear-gradient(90deg,transparent,rgba(52,211,153,0.4),transparent)" }} />
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30 mb-4">Fee Structure</p>
                  <div className="space-y-3">
                    {[
                      { label:"Developer receives", val:"Your quoted bid",      color:"#34d399" },
                      { label:"Platform fee",        val:`${PLATFORM_FEE_PCT}% of bid`, color:"#a78bfa" },
                      { label:"Razorpay processing", val:`~${RAZORPAY_FEE_PCT}% of bid`, color:"#22d3ee" },
                    ].map((row,i)=>(
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:row.color }} />
                          <span className="text-white/40 text-xs">{row.label}</span>
                        </div>
                        <span className="text-xs font-black" style={{ color:row.color }}>{row.val}</span>
                      </div>
                    ))}
                    <div className="h-[1px] bg-white/6" />
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-xs font-black">You pay total</span>
                      <span className="text-white text-xs font-black">Bid ÷ 0.83</span>
                    </div>
                    <p className="text-white/20 text-[10px] leading-relaxed pt-1">
                      Example: ₹10,000 bid → you pay ₹12,048. Developer gets ₹10,000.
                    </p>
                  </div>
                </div>

                {/* Tips */}
                <div className="p-5 rounded-3xl border border-white/6 bg-white/[0.025]">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30 mb-3">Tips for Better Proposals</p>
                  {[
                    "Be specific about file formats needed",
                    "Include reference images or links",
                    "Specify platform (web, mobile, desktop)",
                    "Mention if you need source files",
                    "Set a realistic timeline",
                  ].map((tip,i)=>(
                    <div key={i} className="flex items-start gap-2 mb-2.5 last:mb-0">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background:"#22c55e18", border:"1px solid #22c55e35" }}>
                        <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-white/35 text-xs leading-snug">{tip}</p>
                    </div>
                  ))}
                </div>

                {/* Alt options */}
                <div className="p-5 rounded-3xl border border-white/6 bg-white/[0.025]">
                  <p className="text-white font-black text-sm mb-3">Other options</p>
                  <div className="space-y-2">
                    <Link href="/connect">
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/8 text-white/40 text-xs font-bold hover:border-violet-500/30 hover:text-violet-300 transition duration-200 cursor-pointer">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Find & direct hire →
                      </div>
                    </Link>
                    <Link href="/freelance">
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/8 text-white/40 text-xs font-bold hover:border-emerald-500/30 hover:text-emerald-300 transition duration-200 cursor-pointer">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Post on Freelance Market →
                      </div>
                    </Link>
                  </div>
                </div>

              </motion.div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}