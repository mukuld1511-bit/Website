"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Footer from "../components/Footer";

export default function CertificationPage() {
  const [user,        setUser]        = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [submitted,   setSubmitted]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [alreadyDone, setAlreadyDone] = useState<"pending" | "approved" | null>(null);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name:         "",
    email:        "",
    portfolio:    "",
    linkedin:     "",
    github:       "",
    experience:   "",
    reason:       "",
    projectLinks: "",
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null);
      setAuthLoading(false);
      if (u) {
        setForm(f => ({ ...f, name: u.displayName ?? "", email: u.email ?? "" }));

        // Duplicate check
        const snap = await getDocs(query(
          collection(db, "certificationRequests"),
          where("userId", "==", u.uid)
        ));
        if (!snap.empty) {
          const status = snap.docs[0].data().status as "pending" | "approved" | "rejected";
          if (status === "pending" || status === "approved") setAlreadyDone(status);
        }
      }
    });
    return () => unsub();
  }, []);

  function set(key: string, val: any) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim())       e.name       = "Name required";
    if (!form.portfolio.trim())  e.portfolio  = "Portfolio URL required";
    if (!form.experience.trim()) e.experience = "Experience required";
    if (!form.reason.trim())     e.reason     = "Please tell us why you deserve certification";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !validate()) return;
    setSubmitting(true);
    try {
      // Final duplicate check
      const snap = await getDocs(query(
        collection(db, "certificationRequests"),
        where("userId", "==", user.uid)
      ));
      if (!snap.empty) {
        setAlreadyDone(snap.docs[0].data().status as "pending" | "approved");
        setSubmitting(false);
        return;
      }

      const portfolioUrl = form.portfolio.startsWith("http")
        ? form.portfolio : `https://${form.portfolio}`;

      await addDoc(collection(db, "certificationRequests"), {
        userId:       user.uid,
        name:         form.name.trim(),
        email:        form.email || user.email,
        portfolio:    portfolioUrl,
        linkedin:     form.linkedin
          ? (form.linkedin.startsWith("http") ? form.linkedin : `https://${form.linkedin}`)
          : "",
        github: form.github
          ? `https://github.com/${form.github.replace("@", "").replace("github.com/", "")}`
          : "",
        experience:   form.experience.trim(),
        reason:       form.reason.trim(),
        projectLinks: form.projectLinks.trim(),
        tier:         "Synthe Certified",   // single tier kept for schema compat
        status:       "pending",
        createdAt:    serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err: any) {
      setErrors({ submit: err.message });
    }
    setSubmitting(false);
  }

  const inp = (key: string) =>
    `w-full bg-white border ${errors[key] ? "border-red-300" : "border-gray-200"} text-white placeholder-gray-400 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition duration-200`;
  const lbl = "block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2";

  if (authLoading) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F] font-sans flex flex-col relative">
      <div className="relative flex-grow pt-32 pb-24 px-4 overflow-x-hidden z-10">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 z-[-1]" />
        <div className="absolute top-60 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 z-[-1]" />
        
        <div className="relative z-10 max-w-3xl mx-auto">

          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl border-4 border-white bg-blue-50 mb-8 shadow-md">
              <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-blue-700 text-xs font-black uppercase tracking-widest">Synthé Certification</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight mb-6 drop-shadow-sm">
              Get{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500">
                Certified
              </span>
            </h1>
            <p className="text-gray-600 text-lg md:text-xl max-w-xl mx-auto font-bold leading-relaxed">
              Apply to become a Synthé-verified creator. Certified creators get a badge on their profile, appear first on the Connect page, and are trusted by clients across the platform.
            </p>
          </motion.div>

          {/* Benefits strip */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="relative rounded-[2rem] border-4 border-indigo-50 bg-white/60 backdrop-blur-md p-8 mb-12 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { icon: "⭐", label: "Verified Badge",    desc: "Shown on your profile & creator cards" },
                { icon: "🔝", label: "Top Listing",       desc: "Appear first in Connect page searches" },
                { icon: "💰", label: "More Earnings",     desc: "Clients prefer certified creators" },
                { icon: "🛡️", label: "Platform Trust",    desc: "Vetted quality mark from Synthé team" },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="text-3xl mb-4 w-14 h-14 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center shadow-sm">{b.icon}</div>
                  <p className="text-white font-black text-sm mb-2">{b.label}</p>
                  <p className="text-gray-600 text-xs font-bold leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Already certified / pending */}
          {alreadyDone && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`relative rounded-[2.5rem] border-4 p-12 text-center mb-10 shadow-md backdrop-blur-md ${
                alreadyDone === "approved"
                  ? "border-emerald-100 bg-emerald-50/80"
                  : "border-amber-100 bg-amber-50/80"
              }`}>
              <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm border-4 ${
                alreadyDone === "approved" ? "bg-emerald-100 border-emerald-200" : "bg-amber-100 border-amber-200"
              }`}>
                <span className="text-4xl">{alreadyDone === "approved" ? "⭐" : "⏳"}</span>
              </div>
              <h3 className={`font-black text-3xl mb-4 ${alreadyDone === "approved" ? "text-emerald-900" : "text-amber-900"}`}>
                {alreadyDone === "approved" ? "You Are Certified!" : "Application Under Review"}
              </h3>
              <p className={`text-base font-bold leading-relaxed mb-10 max-w-md mx-auto ${alreadyDone === "approved" ? "text-emerald-700" : "text-amber-700"}`}>
                {alreadyDone === "approved"
                  ? "Your Synthé certification is active. You appear as a verified creator across the platform."
                  : "We're reviewing your application. You'll hear back within 48 hours."
                }
              </p>
              <Link href="/dashboard">
                <button className={`px-10 py-5 rounded-2xl font-black text-white text-base shadow-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all ${
                  alreadyDone === "approved" ? "bg-emerald-500 hover:bg-emerald-400 border-emerald-700" : "bg-blue-600 hover:bg-blue-500 border-blue-800"
                }`}>
                  Go to Dashboard →
                </button>
              </Link>
            </motion.div>
          )}

          {/* Application Form */}
          {!submitted && !alreadyDone && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <div className="relative rounded-[2.5rem] border-4 border-indigo-50 bg-white/80 backdrop-blur overflow-hidden p-8 md:p-12 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] mb-10">
                
                <h2 className="text-3xl font-black text-white mb-4">Apply for Certification</h2>
                <p className="text-gray-500 font-bold text-base mb-10">
                  Fill in the form below. Our team reviews every application manually.
                </p>

                {!user && (
                  <div className="p-6 rounded-2xl border-2 border-indigo-200 bg-indigo-50 text-center mb-8 shadow-sm">
                    <p className="text-indigo-800 font-bold text-base">
                      <Link href="/login" className="underline font-black hover:text-blue-600">Log in</Link>
                      {" "}or{" "}
                      <Link href="/signup" className="underline font-black hover:text-blue-600">sign up</Link>
                      {" "}to apply for certification.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-indigo-400 mb-2">Full Name *</label>
                      <input value={form.name} onChange={e => set("name", e.target.value)}
                        placeholder="Your full name" className="w-full bg-white border-2 border-indigo-100 text-white font-bold placeholder-gray-400 text-lg rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition shadow-sm" />
                      {errors.name && <p className="text-red-500 font-black text-xs mt-2">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-indigo-400 mb-2">Email</label>
                      <input value={form.email} onChange={e => set("email", e.target.value)}
                        placeholder="your@email.com" className="w-full bg-white border-2 border-indigo-100 text-white font-bold placeholder-gray-400 text-lg rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition shadow-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-pink-400 mb-2">Portfolio URL *</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-pink-300 font-black text-base">www.</span>
                      <input value={form.portfolio} onChange={e => set("portfolio", e.target.value)}
                        placeholder="yourportfolio.com" className="w-full bg-white border-2 border-pink-100 text-white font-bold placeholder-gray-400 text-lg rounded-2xl pl-16 pr-5 py-4 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition shadow-sm" />
                    </div>
                    {errors.portfolio && <p className="text-red-500 font-black text-xs mt-2">{errors.portfolio}</p>}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-blue-400 mb-2">LinkedIn</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-300 font-black text-base">in/</span>
                        <input value={form.linkedin} onChange={e => set("linkedin", e.target.value)}
                          placeholder="linkedin.com/in/name" className="w-full bg-white border-2 border-blue-100 text-white font-bold placeholder-gray-400 text-lg rounded-2xl pl-12 pr-5 py-4 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition shadow-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">GitHub</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-base">@</span>
                        <input value={form.github} onChange={e => set("github", e.target.value)}
                          placeholder="username" className="w-full bg-white border-2 border-gray-200 text-white font-bold placeholder-gray-400 text-lg rounded-2xl pl-10 pr-5 py-4 focus:outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-100 transition shadow-sm" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-emerald-400 mb-2">Experience in AR/VR/3D *</label>
                    <input value={form.experience} onChange={e => set("experience", e.target.value)}
                      placeholder="e.g. 2 years in Blender, Unity, and WebXR" className="w-full bg-white border-2 border-emerald-100 text-white font-bold placeholder-gray-400 text-lg rounded-2xl p-5 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition shadow-sm" />
                    {errors.experience && <p className="text-red-500 font-black text-xs mt-2">{errors.experience}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-indigo-400 mb-2">Project Links</label>
                    <textarea value={form.projectLinks} onChange={e => set("projectLinks", e.target.value)} rows={2}
                      placeholder="Links to your best work (one per line)…"
                      className="w-full bg-white border-2 border-indigo-100 text-white font-bold placeholder-gray-400 text-lg rounded-2xl p-5 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition shadow-sm resize-none" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-amber-400 mb-2">Why should you be certified? *</label>
                    <textarea value={form.reason} onChange={e => set("reason", e.target.value)} rows={4}
                      placeholder="Tell us about your work, skills, and what makes you stand out on Synthé…"
                      className="w-full bg-white border-2 border-amber-100 text-white font-bold placeholder-gray-400 text-lg rounded-2xl p-5 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition shadow-sm resize-none" />
                    {errors.reason && <p className="text-red-500 font-black text-xs mt-2">{errors.reason}</p>}
                  </div>

                  {errors.submit && (
                    <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 font-black text-sm shadow-sm flex items-center gap-2">
                       <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {errors.submit}
                    </div>
                  )}

                  <button type="submit" disabled={submitting || !user}
                    className="w-full py-5 rounded-3xl bg-blue-600 hover:bg-blue-500 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 text-white font-black text-xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
                  >
                    {submitting ? "Submitting…" : "Apply for Synthé Certification 🚀"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Success */}
          <AnimatePresence>
            {submitted && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-12 text-center rounded-[2.5rem] border-4 border-emerald-100 bg-emerald-50/80 backdrop-blur-md shadow-md mt-10">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-sm border-4 border-emerald-200 bg-emerald-100">
                  <span className="text-5xl text-emerald-600">✓</span>
                </div>
                <h2 className="text-3xl font-black text-white mb-4">Application Submitted!</h2>
                <p className="text-emerald-700 font-bold text-base max-w-sm mx-auto leading-relaxed mb-10">
                  Your certification application is under review. We'll notify you within 48 hours once a decision is made.
                </p>
                <Link href="/dashboard">
                  <button className="px-10 py-5 rounded-3xl font-black text-white text-lg bg-emerald-500 hover:bg-emerald-400 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 shadow-xl transition-all">
                    Go to Dashboard →
                  </button>
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