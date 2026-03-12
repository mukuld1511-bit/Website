"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type CertStatus = "idle" | "already_pending" | "already_approved" | "submitted";

const PERKS = [
  { icon:"⭐", label:"Certified Badge",    desc:"Verified badge on your public developer profile" },
  { icon:"🔍", label:"Priority Listing",   desc:"Appear at the top of developer search results" },
  { icon:"📈", label:"More Visibility",    desc:"Increased reach to potential clients & teams" },
  { icon:"💼", label:"Exclusive Projects", desc:"Access to high-value freelance project requests" },
];

export default function SynthéCertificationPage() {
  const [user,         setUser]         = useState<any>(null);
  const [portfolio,    setPortfolio]    = useState("");
  const [reason,       setReason]       = useState("");
  const [experience,   setExperience]   = useState("");
  const [linkedin,     setLinkedin]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [checkLoading, setCheckLoading] = useState(true);
  const [error,        setError]        = useState("");
  const [certStatus,   setCertStatus]   = useState<CertStatus>("idle");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u ?? null);
      if (u) {
        try {
          const q    = query(collection(db, "certificationRequests"), where("userId", "==", u.uid));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const data = snap.docs[0].data();
            setCertStatus(data.status === "approved" ? "already_approved" : "already_pending");
          }
        } catch(e) { console.error(e); }
      }
      setCheckLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!reason.trim()) { setError("Please explain why you should be certified."); return; }
    setLoading(true);
    setError("");
    try {
      await addDoc(collection(db, "certificationRequests"), {
        userId:     user.uid,
        name:       user.displayName ?? "",
        email:      user.email ?? "",
        portfolio:  portfolio.trim(),
        reason:     reason.trim(),
        experience: experience.trim(),
        linkedin:   linkedin.trim(),
        status:     "pending",
        createdAt:  serverTimestamp(),
      });
      setCertStatus("submitted");
    } catch(e: any) {
      setError(e.message ?? "Submission failed. Please try again.");
    }
    setLoading(false);
  }

  const inputCls = "w-full bg-white/[0.03] border border-white/8 text-white placeholder-white/25 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-amber-500/50 focus:shadow-[0_0_20px_rgba(217,119,6,0.08)] transition duration-200";

  // ── Loading spinner ──
  if (checkLoading) return (
    <div className="min-h-screen bg-[#050008] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
    </div>
  );

  // ── Not logged in ──
  if (!user) return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen px-4">
        <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
          className="w-full max-w-md text-center">
          <div className="relative rounded-3xl overflow-hidden border border-amber-500/20 bg-white/[0.025] backdrop-blur-xl p-12">
            <div className="absolute top-0 left-0 right-0 h-[1px]"
              style={{ background:"linear-gradient(90deg,transparent,rgba(251,191,36,0.4),transparent)" }} />
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Sign in Required</h2>
            <p className="text-white/35 text-sm mb-8">You need an account to apply for SYNTHÉ Certification.</p>
            <div className="flex flex-col gap-3">
              <Link href="/login">
                <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                  className="w-full py-3.5 rounded-2xl font-black text-white text-sm cursor-pointer text-center relative overflow-hidden">
                  <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:5, ease:"linear" }}
                    style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                  <span className="relative z-10">Sign In →</span>
                </motion.div>
              </Link>
              <Link href="/join">
                <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} style={{ willChange:"transform" }}
                  className="w-full py-3.5 rounded-2xl font-black text-white/40 text-sm border border-white/8 hover:border-white/20 cursor-pointer text-center transition duration-200">
                  Create Account
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );

  // ── Already approved ──
  if (certStatus === "already_approved") return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen px-4">
        <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.5 }}
          className="w-full max-w-md text-center">
          <div className="relative rounded-3xl overflow-hidden border border-amber-500/20 bg-white/[0.025] backdrop-blur-xl p-12">
            <div className="absolute top-0 left-0 right-0 h-[1px]"
              style={{ background:"linear-gradient(90deg,transparent,rgba(251,191,36,0.5),transparent)" }} />
            <motion.div animate={{ scale:[1,1.06,1] }} transition={{ duration:2, repeat:Infinity, repeatDelay:3 }}
              style={{ willChange:"transform" }}
              className="w-24 h-24 rounded-3xl border border-amber-500/30 bg-amber-500/15 flex items-center justify-center mx-auto mb-6 text-5xl">
              ⭐
            </motion.div>
            <h2 className="text-3xl font-black text-white mb-2">You're Certified!</h2>
            <p className="text-white/40 text-sm mb-2">Congratulations — your verified badge is active on your profile.</p>
            <p className="text-amber-400/60 text-xs font-bold uppercase tracking-widest mb-8">SYNTHÉ Certified Developer</p>
            <Link href="/dashboard">
              <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                style={{ willChange:"transform", background:"linear-gradient(135deg,#d97706,#dc2626)" }}
                className="inline-block px-8 py-3.5 rounded-2xl font-black text-white text-sm cursor-pointer">
                Go to Dashboard →
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );

  // ── Already pending ──
  if (certStatus === "already_pending") return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen px-4">
        <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
          className="w-full max-w-md text-center">
          <div className="relative rounded-3xl overflow-hidden border border-amber-500/20 bg-white/[0.025] backdrop-blur-xl p-12">
            <div className="absolute top-0 left-0 right-0 h-[1px]"
              style={{ background:"linear-gradient(90deg,transparent,rgba(251,191,36,0.4),transparent)" }} />
            <div className="w-20 h-20 rounded-3xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mx-auto mb-6 text-4xl">⏳</div>
            <h2 className="text-2xl font-black text-white mb-3">Application Under Review</h2>
            <p className="text-white/40 text-sm mb-2">We have received your application.</p>
            <p className="text-white/25 text-xs mb-8">Our team will review and notify you within 2–3 business days.</p>
            <Link href="/dashboard">
              <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} style={{ willChange:"transform" }}
                className="inline-block px-8 py-3.5 rounded-2xl font-black text-white/60 text-sm border border-white/12 hover:border-white/25 hover:text-white/80 cursor-pointer transition duration-200">
                Back to Dashboard
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );

  // ── Just submitted ──
  if (certStatus === "submitted") return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen px-4">
        <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.5 }}
          className="w-full max-w-md text-center">
          <div className="relative rounded-3xl overflow-hidden border border-emerald-500/20 bg-white/[0.025] backdrop-blur-xl p-12">
            <div className="absolute top-0 left-0 right-0 h-[1px]"
              style={{ background:"linear-gradient(90deg,transparent,rgba(52,211,153,0.4),transparent)" }} />
            <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
              transition={{ type:"spring", stiffness:300, damping:20, delay:0.2 }}
              style={{ willChange:"transform" }}
              className="w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h2 className="text-3xl font-black text-white mb-3">Application Submitted! 🎉</h2>
            <p className="text-white/40 text-sm mb-8">We'll review and notify you via email within 2–3 business days.</p>
            <Link href="/dashboard">
              <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                className="inline-block px-8 py-3.5 rounded-2xl font-black text-white text-sm cursor-pointer">
                Back to Dashboard →
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );

  // ── Main form ──
  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full opacity-[0.08]"
          style={{ background:"radial-gradient(circle,#d97706,transparent 70%)", filter:"blur(80px)" }} />
        <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] rounded-full opacity-[0.06]"
          style={{ background:"radial-gradient(circle,#7c3aed,transparent 70%)", filter:"blur(80px)" }} />
      </div>

      <div className="relative z-10 pt-28 pb-24 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 mb-5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300/80 text-xs font-black uppercase tracking-widest">Developer Certification</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white leading-none mb-4">
              Get{" "}
              <span style={{ backgroundImage:"linear-gradient(90deg,#fbbf24,#f97316)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                Certified
              </span>
            </h1>
            <p className="text-white/40 text-lg max-w-xl leading-relaxed">
              Apply for the SYNTHÉ Developer Certification. Unlock exclusive benefits, priority visibility, and a verified badge on your profile.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left — perks + user card */}
            <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.5, delay:0.1 }}
              className="lg:col-span-1 space-y-4">

              <div className="p-6 rounded-3xl border border-white/6 bg-white/[0.025]">
                <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.25em] mb-5">What you get</p>
                <div className="space-y-4">
                  {PERKS.map((p,i) => (
                    <motion.div key={i} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                      transition={{ delay:0.2+i*0.08 }} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/12 border border-amber-500/20 flex items-center justify-center text-lg flex-shrink-0">
                        {p.icon}
                      </div>
                      <div>
                        <p className="text-white font-black text-sm">{p.label}</p>
                        <p className="text-white/30 text-xs mt-0.5">{p.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
                className="flex items-center gap-3 p-4 rounded-2xl border border-white/6 bg-white/[0.02]">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-white/[0.05] flex items-center justify-center text-sm font-black text-white/50 flex-shrink-0">
                  {user.photoURL
                    ? <img src={user.photoURL} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                    : user.displayName?.[0] ?? "U"
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm truncate">{user.displayName ?? "Anonymous"}</p>
                  <p className="text-white/30 text-xs truncate">{user.email}</p>
                </div>
                <div className="px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/8 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                  Applying
                </div>
              </motion.div>
            </motion.div>

            {/* Right — form */}
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.2 }}
              className="lg:col-span-2">
              <div className="relative rounded-3xl overflow-hidden border border-white/6 bg-white/[0.025] backdrop-blur-xl">
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background:"linear-gradient(90deg,transparent,rgba(251,191,36,0.4),rgba(251,191,36,0.2),transparent)" }} />

                <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-500/20 bg-rose-500/8 overflow-hidden">
                        <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-rose-400 text-sm">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Portfolio */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Portfolio Link</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-amber-400 transition duration-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                      <input type="url" value={portfolio} onChange={e=>setPortfolio(e.target.value)}
                        placeholder="https://yourportfolio.com" className={`${inputCls} pl-11`} />
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">LinkedIn Profile</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-amber-400 transition duration-200">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </div>
                      <input type="url" value={linkedin} onChange={e=>setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/yourprofile" className={`${inputCls} pl-11`} />
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Years of Experience & Background</label>
                    <input value={experience} onChange={e=>setExperience(e.target.value)}
                      placeholder="e.g. 4 years in AR/VR development, Unity Certified Developer…"
                      className={inputCls} />
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">
                      Why should you be certified? <span className="text-amber-400">*</span>
                    </label>
                    <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={5}
                      placeholder="Describe your skills, notable projects, contributions to the AR/VR/3D community…"
                      className={`${inputCls} resize-none`} />
                    <div className="flex justify-between mt-1.5">
                      <p className="text-white/20 text-xs">{reason.length}/500 characters</p>
                      {reason.length > 450 && <p className="text-amber-400/60 text-xs">{500 - reason.length} left</p>}
                    </div>
                  </div>

                  {/* Info box */}
                  <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-500/15 bg-amber-500/5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-amber-300 text-xs font-bold mb-1">Review Process</p>
                      <p className="text-white/30 text-xs leading-relaxed">
                        Applications are manually reviewed within 2–3 business days. You'll receive an email notification once a decision has been made.
                      </p>
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.button type="submit" disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    style={{ willChange:"transform", background: loading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#d97706,#dc2626)" }}
                    className="relative w-full py-4 font-black text-white rounded-2xl overflow-hidden disabled:opacity-50 text-sm cursor-pointer">
                    {!loading && (
                      <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                        style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          Submitting…
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          Submit Certification Request
                        </>
                      )}
                    </span>
                  </motion.button>

                  <p className="text-center text-white/20 text-xs">
                    Not a developer yet?{" "}
                    <Link href="/join/developer">
                      <span className="text-violet-400/70 hover:text-violet-300 cursor-pointer transition duration-200 font-semibold">
                        Apply to join as developer →
                      </span>
                    </Link>
                  </p>
                </form>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}