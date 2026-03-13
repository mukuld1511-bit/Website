"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const TIERS = [
  {
    name:  "Associate",
    color: "#22d3ee",
    icon:  "🎯",
    desc:  "Entry-level certification for developers with foundational AR/VR/3D skills.",
    reqs:  ["1+ completed projects","Basic 3D modeling or AR/VR experience","Portfolio with at least 2 works"],
  },
  {
    name:  "Professional",
    color: "#a78bfa",
    icon:  "⚡",
    desc:  "Mid-level certification for developers with proven client delivery experience.",
    reqs:  ["3+ completed projects","Client testimonials or reviews","Advanced tool proficiency"],
  },
  {
    name:  "Expert",
    color: "#fbbf24",
    icon:  "✦",
    desc:  "Top-tier certification reserved for industry-leading AR/VR/3D specialists.",
    reqs:  ["5+ high-quality projects","Published work or notable clients","Community contribution"],
  },
];

export default function CertificationPage() {
  const [user,          setUser]          = useState<any>(null);
  const [authLoading,   setAuthLoading]   = useState(true);
  const [submitted,     setSubmitted]     = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [alreadyDone,   setAlreadyDone]   = useState<"pending"|"approved"|null>(null);
  const [errors,        setErrors]        = useState<Record<string,string>>({});

  const [form, setForm] = useState({
    name:         "",
    email:        "",
    portfolio:    "",
    linkedin:     "",
    github:       "",
    experience:   "",
    reason:       "",
    tier:         "Professional",
    projectLinks: "",
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null);
      setAuthLoading(false);
      if (u) {
        setForm(f => ({
          ...f,
          name:  u.displayName ?? "",
          email: u.email ?? "",
        }));
        // Check existing request
        const snap = await getDocs(query(
          collection(db,"certificationRequests"),
          where("userId","==",u.uid)
        ));
        if (!snap.empty) {
          const status = snap.docs[0].data().status as "pending"|"approved"|"rejected";
          if (status === "pending" || status === "approved") {
            setAlreadyDone(status);
          }
        }
        // Also check if already certified in users collection
        const userSnap = await getDocs(query(
          collection(db,"users"),
          where("uid","==",u.uid)
        ));
        if (!userSnap.empty && userSnap.docs[0].data().certified) {
          setAlreadyDone("approved");
        }
      }
    });
    return () => unsub();
  }, []);

  function set(key: string, val: any) {
    setForm(f => ({ ...f, [key]:val }));
    setErrors(e => { const n={...e}; delete n[key]; return n; });
  }

  function validate(): boolean {
    const e: Record<string,string> = {};
    if (!form.name.trim())      e.name      = "Name required";
    if (!form.portfolio.trim()) e.portfolio = "Portfolio URL required";
    if (!form.experience.trim()) e.experience = "Experience required";
    if (!form.reason.trim())    e.reason    = "Please tell us why you deserve certification";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !validate()) return;
    setSubmitting(true);
    try {
      // Final check
      const snap = await getDocs(query(
        collection(db,"certificationRequests"),
        where("userId","==",user.uid)
      ));
      if (!snap.empty) {
        setAlreadyDone(snap.docs[0].data().status as "pending"|"approved");
        setSubmitting(false);
        return;
      }

      const portfolioUrl = form.portfolio.startsWith("http")
        ? form.portfolio : `https://${form.portfolio}`;

      await addDoc(collection(db,"certificationRequests"), {
        userId:       user.uid,
        name:         form.name.trim(),
        email:        form.email || user.email,
        portfolio:    portfolioUrl,
        linkedin:     form.linkedin ? (form.linkedin.startsWith("http") ? form.linkedin : `https://${form.linkedin}`) : "",
        github:       form.github ? `https://github.com/${form.github.replace("@","").replace("github.com/","")}` : "",
        experience:   form.experience.trim(),
        reason:       form.reason.trim(),
        tier:         form.tier,
        projectLinks: form.projectLinks.trim(),
        status:       "pending",
        createdAt:    serverTimestamp(),
      });
      setSubmitted(true);
    } catch(err: any) {
      setErrors({ submit: err.message });
    }
    setSubmitting(false);
  }

  const inp = (key: string) =>
    `w-full bg-white/[0.04] border ${errors[key]?"border-rose-500/50":"border-white/8"} text-white placeholder-white/20 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-violet-500/50 transition duration-200`;
  const lbl = "block text-[10px] font-black uppercase tracking-[0.25em] text-white/35 mb-2";

  if (authLoading) return (
    <div className="min-h-screen bg-[#050008] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />

      <div className="relative pt-28 pb-24 px-4 overflow-x-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
          style={{ background:"radial-gradient(ellipse,rgba(251,191,36,0.08) 0%,transparent 70%)", filter:"blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.018] pointer-events-none"
          style={{ backgroundImage:"linear-gradient(rgba(251,191,36,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(251,191,36,0.5) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />

        <div className="relative z-10 max-w-5xl mx-auto">

          {/* Hero */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
            className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-amber-500/25 bg-amber-500/8 backdrop-blur-sm mb-6">
              <span className="text-amber-400 text-sm">✦</span>
              <span className="text-amber-300/90 text-sm font-semibold uppercase tracking-widest">Synthé Certification</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none mb-5">
              Get{" "}
              <span style={{ backgroundImage:"linear-gradient(90deg,#fbbf24,#fb7185,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                Certified
              </span>
            </h1>
            <p className="text-white/40 text-lg max-w-xl mx-auto leading-relaxed">
              Synthé Certification is a mark of excellence. Certified developers are featured prominently, trusted by clients, and earn more.
            </p>
          </motion.div>

          {/* Tiers */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}
            className="grid md:grid-cols-3 gap-5 mb-16">
            {TIERS.map((tier, i) => (
              <motion.div key={tier.name} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:0.1 + i*0.08 }}
                className={`relative rounded-3xl border overflow-hidden p-6 cursor-pointer transition duration-200 ${
                  form.tier === tier.name
                    ? "border-opacity-60 scale-[1.02]"
                    : "border-white/6 hover:border-white/12"
                }`}
                style={{
                  borderColor: form.tier === tier.name ? `${tier.color}50` : undefined,
                  background: form.tier === tier.name ? `${tier.color}08` : "rgba(255,255,255,0.025)",
                }}
                onClick={() => set("tier", tier.name)}>
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background:`linear-gradient(90deg,transparent,${tier.color}${form.tier===tier.name?"70":"30"},transparent)` }} />

                {form.tier === tier.name && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background:`${tier.color}25`, border:`1px solid ${tier.color}50` }}>
                    <svg className="w-3 h-3" style={{ color:tier.color }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                <div className="text-3xl mb-3">{tier.icon}</div>
                <h3 className="font-black text-white text-lg mb-1">{tier.name}</h3>
                <p className="text-white/35 text-xs leading-relaxed mb-4">{tier.desc}</p>
                <div className="space-y-1.5">
                  {tier.reqs.map((r,j) => (
                    <div key={j} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background:tier.color }} />
                      <p className="text-white/30 text-[11px] leading-snug">{r}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Already certified/pending */}
          {alreadyDone && (
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
              className={`relative rounded-3xl border p-8 text-center mb-10 ${
                alreadyDone === "approved"
                  ? "border-emerald-500/25 bg-emerald-500/5"
                  : "border-amber-500/20 bg-amber-500/5"
              }`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                alreadyDone === "approved" ? "bg-emerald-500/15" : "bg-amber-500/15"
              }`}>
                <span className="text-3xl">{alreadyDone === "approved" ? "✦" : "⏳"}</span>
              </div>
              <h3 className="text-white font-black text-xl mb-2">
                {alreadyDone === "approved" ? "You Are Certified!" : "Application Under Review"}
              </h3>
              <p className={`text-sm leading-relaxed mb-4 ${alreadyDone === "approved" ? "text-emerald-300/70" : "text-white/40"}`}>
                {alreadyDone === "approved"
                  ? "Your certification is active. You appear as a certified developer across the platform."
                  : "We're reviewing your application. You'll be notified within 48 hours once a decision is made."
                }
              </p>
              <Link href="/dashboard">
                <motion.div whileHover={{ scale:1.03 }} style={{ willChange:"transform",
                  background: alreadyDone === "approved"
                    ? "linear-gradient(135deg,#059669,#0891b2)"
                    : "linear-gradient(135deg,#d97706,#7c3aed)"
                }}
                  className="inline-flex px-6 py-3 rounded-2xl font-black text-white text-sm cursor-pointer">
                  Go to Dashboard →
                </motion.div>
              </Link>
            </motion.div>
          )}

          {/* Benefits strip */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.2 }}
            className="relative rounded-3xl border border-white/6 bg-white/[0.02] p-6 mb-12 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px]"
              style={{ background:"linear-gradient(90deg,transparent,rgba(251,191,36,0.4),rgba(167,139,250,0.3),transparent)" }} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/25 mb-4 text-center">Why Get Certified</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { icon:"✦", label:"Featured Badge",      desc:"Certified badge on your profile and cards" },
                { icon:"🔝", label:"Priority Listing",    desc:"Appear first in developer searches" },
                { icon:"💰", label:"Higher Earnings",     desc:"Clients prefer and pay more for certified devs" },
                { icon:"🛡️", label:"Platform Trust",      desc:"Verified quality mark from Synthé team" },
              ].map((b,i) => (
                <div key={i}>
                  <div className="text-2xl mb-2">{b.icon}</div>
                  <p className="text-white/70 font-black text-xs mb-1">{b.label}</p>
                  <p className="text-white/25 text-[10px] leading-snug">{b.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Form */}
          {!submitted && !alreadyDone && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.3 }}>
              <div className="relative rounded-3xl border border-white/8 bg-white/[0.025] overflow-hidden p-8">
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background:"linear-gradient(90deg,transparent,rgba(251,191,36,0.5),rgba(167,139,250,0.3),transparent)" }} />

                <h2 className="text-2xl font-black text-white mb-1">Apply for Certification</h2>
                <p className="text-white/30 text-sm mb-7">
                  Applying for: <span className="font-black"
                    style={{ color: TIERS.find(t=>t.name===form.tier)?.color }}>
                    {form.tier} Tier
                  </span>
                </p>

                {!user && (
                  <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center mb-6">
                    <p className="text-amber-300/80 text-sm">
                      <Link href="/login" className="underline text-amber-300 font-bold hover:text-amber-200">Log in</Link>
                      {" "}or{" "}
                      <Link href="/signup" className="underline text-amber-300 font-bold hover:text-amber-200">sign up</Link>
                      {" "}to apply for certification.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Full Name *</label>
                      <input value={form.name} onChange={e=>set("name",e.target.value)}
                        placeholder="Your full name" className={inp("name")} />
                      {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className={lbl}>Email</label>
                      <input value={form.email} onChange={e=>set("email",e.target.value)}
                        placeholder="your@email.com" className={inp("email")} />
                    </div>
                  </div>

                  <div>
                    <label className={lbl}>Portfolio URL *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xs">www.</span>
                      <input value={form.portfolio} onChange={e=>set("portfolio",e.target.value)}
                        placeholder="yourportfolio.com" className={inp("portfolio") + " pl-12"} />
                    </div>
                    {errors.portfolio && <p className="text-rose-400 text-xs mt-1">{errors.portfolio}</p>}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>LinkedIn</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xs">www.</span>
                        <input value={form.linkedin} onChange={e=>set("linkedin",e.target.value)}
                          placeholder="linkedin.com/in/name" className={inp("linkedin") + " pl-12"} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>GitHub</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xs">github.com/</span>
                        <input value={form.github} onChange={e=>set("github",e.target.value)}
                          placeholder="username" className={inp("github") + " pl-24"} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={lbl}>Years of Experience *</label>
                    <input value={form.experience} onChange={e=>set("experience",e.target.value)}
                      placeholder="e.g. 3 years in Unity and WebXR development" className={inp("experience")} />
                    {errors.experience && <p className="text-rose-400 text-xs mt-1">{errors.experience}</p>}
                  </div>

                  <div>
                    <label className={lbl}>Project Links</label>
                    <textarea value={form.projectLinks} onChange={e=>set("projectLinks",e.target.value)} rows={2}
                      placeholder="Links to your best projects (one per line)…"
                      className={inp("projectLinks") + " resize-none"} />
                  </div>

                  <div>
                    <label className={lbl}>Why do you deserve certification? *</label>
                    <textarea value={form.reason} onChange={e=>set("reason",e.target.value)} rows={4} required
                      placeholder="Describe your expertise, notable projects, client work, and what makes you stand out…"
                      className={inp("reason") + " resize-none"} />
                    {errors.reason && <p className="text-rose-400 text-xs mt-1">{errors.reason}</p>}
                  </div>

                  {errors.submit && (
                    <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/8 text-rose-400 text-sm">
                      {errors.submit}
                    </div>
                  )}

                  <motion.button type="submit" disabled={submitting || !user}
                    whileHover={{ scale:submitting?1:1.02 }} whileTap={{ scale:submitting?1:0.98 }}
                    style={{ willChange:"transform", background:submitting?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#fbbf24,#a78bfa)" }}
                    className="w-full py-4 rounded-2xl font-black text-white text-sm disabled:opacity-50 relative overflow-hidden">
                    <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                      style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                    <span className="relative z-10">{submitting ? "Submitting…" : "✦ Apply for Certification →"}</span>
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Success */}
          <AnimatePresence>
            {submitted && (
              <motion.div initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }}
                className="flex flex-col items-center justify-center py-20 text-center">
                <motion.div animate={{ scale:[1,1.1,1] }} transition={{ duration:0.6, delay:0.2 }}
                  className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8"
                  style={{ background:"linear-gradient(135deg,#fbbf24,#a78bfa)", boxShadow:"0 0 60px rgba(251,191,36,0.3)" }}>
                  <span className="text-4xl">✦</span>
                </motion.div>
                <h2 className="text-4xl font-black text-white mb-3">Application Submitted!</h2>
                <p className="text-white/40 text-base max-w-md leading-relaxed mb-8">
                  Your certification application is under review. We'll notify you within 48 hours.
                </p>
                <Link href="/dashboard">
                  <motion.div whileHover={{ scale:1.04 }} style={{ willChange:"transform", background:"linear-gradient(135deg,#fbbf24,#a78bfa)" }}
                    className="px-8 py-3.5 rounded-2xl font-black text-white text-sm cursor-pointer">
                    Go to Dashboard →
                  </motion.div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
      <Footer />
    </div>
  );
}