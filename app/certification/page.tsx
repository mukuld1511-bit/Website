"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
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
    `w-full bg-white border ${errors[key] ? "border-red-300" : "border-gray-200"} text-gray-900 placeholder-gray-400 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition duration-200`;
  const lbl = "block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2";

  if (authLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <div className="relative pt-32 pb-24 px-4 overflow-x-hidden">
        <div className="relative z-10 max-w-2xl mx-auto">

          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-blue-700 text-xs font-bold uppercase tracking-widest">Synthé Certification</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-none mb-4">
              Get{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Certified
              </span>
            </h1>
            <p className="text-gray-500 text-base max-w-lg mx-auto font-medium leading-relaxed">
              Apply to become a Synthé-verified developer. Certified developers get a badge on their profile, appear first on the Connect page, and are trusted by clients across the platform.
            </p>
          </motion.div>

          {/* Benefits strip */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="relative rounded-3xl border border-gray-200 bg-white p-6 mb-10 overflow-hidden shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { icon: "⭐", label: "Verified Badge",    desc: "Shown on your profile & developer cards" },
                { icon: "🔝", label: "Top Listing",       desc: "Appear first in Connect page searches" },
                { icon: "💰", label: "More Earnings",     desc: "Clients prefer certified developers" },
                { icon: "🛡️", label: "Platform Trust",    desc: "Vetted quality mark from Synthé team" },
              ].map((b, i) => (
                <div key={i}>
                  <div className="text-2xl mb-3">{b.icon}</div>
                  <p className="text-gray-900 font-extrabold text-xs mb-1">{b.label}</p>
                  <p className="text-gray-500 text-[10px] font-medium leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Already certified / pending */}
          {alreadyDone && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`relative rounded-3xl border p-10 text-center mb-10 shadow-sm ${
                alreadyDone === "approved"
                  ? "border-green-200 bg-green-50"
                  : "border-yellow-200 bg-yellow-50"
              }`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border ${
                alreadyDone === "approved" ? "bg-green-100 border-green-200" : "bg-yellow-100 border-yellow-200"
              }`}>
                <span className="text-3xl">{alreadyDone === "approved" ? "⭐" : "⏳"}</span>
              </div>
              <h3 className={`font-extrabold text-xl mb-2 ${alreadyDone === "approved" ? "text-green-900" : "text-yellow-900"}`}>
                {alreadyDone === "approved" ? "You Are Certified!" : "Application Under Review"}
              </h3>
              <p className={`text-sm font-medium leading-relaxed mb-8 ${alreadyDone === "approved" ? "text-green-700" : "text-yellow-700"}`}>
                {alreadyDone === "approved"
                  ? "Your Synthé certification is active. You appear as a verified developer across the platform."
                  : "We're reviewing your application. You'll hear back within 48 hours."
                }
              </p>
              <Link href="/dashboard">
                <button className={`px-8 py-3.5 rounded-2xl font-bold text-white shadow-sm transition ${
                  alreadyDone === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                }`}>
                  Go to Dashboard →
                </button>
              </Link>
            </motion.div>
          )}

          {/* Application Form */}
          {!submitted && !alreadyDone && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <div className="relative rounded-3xl border border-gray-200 bg-white overflow-hidden p-8 shadow-sm">
                
                <h2 className="text-xl font-extrabold text-gray-900 mb-2">Apply for Certification</h2>
                <p className="text-gray-500 font-medium text-sm mb-8">
                  Fill in the form below. Our team reviews every application manually.
                </p>

                {!user && (
                  <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50 text-center mb-6 shadow-sm">
                    <p className="text-blue-800 font-medium text-sm">
                      <Link href="/login" className="underline font-bold hover:text-blue-600">Log in</Link>
                      {" "}or{" "}
                      <Link href="/signup" className="underline font-bold hover:text-blue-600">sign up</Link>
                      {" "}to apply for certification.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className={lbl}>Full Name *</label>
                      <input value={form.name} onChange={e => set("name", e.target.value)}
                        placeholder="Your full name" className={inp("name")} />
                      {errors.name && <p className="text-red-500 font-bold text-xs mt-1.5">{errors.name}</p>}
                    </div>
                    <div>
                      <label className={lbl}>Email</label>
                      <input value={form.email} onChange={e => set("email", e.target.value)}
                        placeholder="your@email.com" className={inp("email")} />
                    </div>
                  </div>

                  <div>
                    <label className={lbl}>Portfolio URL *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">www.</span>
                      <input value={form.portfolio} onChange={e => set("portfolio", e.target.value)}
                        placeholder="yourportfolio.com" className={inp("portfolio") + " pl-12"} />
                    </div>
                    {errors.portfolio && <p className="text-red-500 font-bold text-xs mt-1.5">{errors.portfolio}</p>}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className={lbl}>LinkedIn</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">in/</span>
                        <input value={form.linkedin} onChange={e => set("linkedin", e.target.value)}
                          placeholder="linkedin.com/in/name" className={inp("linkedin") + " pl-10"} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>GitHub</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">@</span>
                        <input value={form.github} onChange={e => set("github", e.target.value)}
                          placeholder="username" className={inp("github") + " pl-8"} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={lbl}>Experience in AR/VR/3D *</label>
                    <input value={form.experience} onChange={e => set("experience", e.target.value)}
                      placeholder="e.g. 2 years in Blender, Unity, and WebXR" className={inp("experience")} />
                    {errors.experience && <p className="text-red-500 font-bold text-xs mt-1.5">{errors.experience}</p>}
                  </div>

                  <div>
                    <label className={lbl}>Project Links</label>
                    <textarea value={form.projectLinks} onChange={e => set("projectLinks", e.target.value)} rows={2}
                      placeholder="Links to your best work (one per line)…"
                      className={inp("projectLinks") + " resize-none"} />
                  </div>

                  <div>
                    <label className={lbl}>Why should you be certified? *</label>
                    <textarea value={form.reason} onChange={e => set("reason", e.target.value)} rows={4}
                      placeholder="Tell us about your work, skills, and what makes you stand out on Synthé…"
                      className={inp("reason") + " resize-none"} />
                    {errors.reason && <p className="text-red-500 font-bold text-xs mt-1.5">{errors.reason}</p>}
                  </div>

                  {errors.submit && (
                    <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold text-sm shadow-sm">
                      {errors.submit}
                    </div>
                  )}

                  <button type="submit" disabled={submitting || !user}
                    className="w-full py-3.5 rounded-xl font-bold text-white shadow-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {submitting ? "Submitting…" : "Apply for Synthé Certification →"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Success */}
          <AnimatePresence>
            {submitted && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-gray-200 bg-white shadow-sm mt-8">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-blue-200 bg-blue-50">
                  <span className="text-4xl text-blue-600">✓</span>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Application Submitted!</h2>
                <p className="text-gray-500 font-medium text-sm max-w-sm mx-auto leading-relaxed mb-8">
                  Your certification application is under review. We'll notify you within 48 hours once a decision is made.
                </p>
                <Link href="/dashboard">
                  <button className="px-8 py-3.5 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition">
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