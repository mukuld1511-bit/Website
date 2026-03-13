"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const SKILLS = [
  "Unity","Unreal Engine","Blender","Maya","ZBrush","Three.js",
  "React Three Fiber","WebXR","AR Foundation","ARCore","ARKit",
  "Vuforia","8thWall","AutoCAD","Revit","SketchUp","Cinema 4D",
  "Houdini","Substance Painter","Figma",
];

const QUALIFICATIONS = [
  "High School","Diploma","B.Tech / B.E.","B.Sc","MCA","M.Tech","MBA","Self-Taught","Other",
];

export default function JoinDeveloperPage() {
  const router = useRouter();
  const [user,        setUser]        = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [step,        setStep]        = useState(1);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [errors,      setErrors]      = useState<Record<string,string>>({});

  const [form, setForm] = useState({
    name:          "",
    bio:           "",
    qualification: "",
    experience:    "",
    skills:        [] as string[],
    portfolio:     "",
    linkedin:      "",
    github:        "",
    profileImage:  "",
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null);
      setAuthLoading(false);
      if (u) {
        // Check if already applied
        const snap = await getDocs(query(
          collection(db,"developerApplications"),
          where("userId","==",u.uid)
        ));
        if (!snap.empty) {
          const status = snap.docs[0].data().status;
          setAlreadyApplied(true);
          if (status === "approved") setSubmitted(true);
        }
        // Pre-fill name
        setForm(f => ({ ...f, name: u.displayName ?? "" }));
      }
    });
    return () => unsub();
  }, []);

  function set(key: string, val: any) {
    setForm(f => ({ ...f, [key]:val }));
    setErrors(e => { const n={...e}; delete n[key]; return n; });
  }

  function toggleSkill(s: string) {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(s)
        ? f.skills.filter(x => x !== s)
        : [...f.skills, s],
    }));
  }

  function validate1(): boolean {
    const e: Record<string,string> = {};
    if (!form.name.trim())          e.name          = "Name required";
    if (!form.qualification)        e.qualification = "Select qualification";
    if (!form.experience.trim())    e.experience    = "Experience required";
    if (form.skills.length === 0)   e.skills        = "Select at least one skill";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validate2(): boolean {
    const e: Record<string,string> = {};
    if (!form.portfolio.trim()) e.portfolio = "Portfolio URL required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (step === 1 && validate1()) setStep(2);
    if (step === 2 && validate2()) setStep(3);
  }

  async function handleSubmit() {
    if (!user) { router.push("/login"); return; }
    setSubmitting(true);
    try {
      // Double-check no existing application
      const snap = await getDocs(query(
        collection(db,"developerApplications"),
        where("userId","==",user.uid)
      ));
      if (!snap.empty) {
        setAlreadyApplied(true);
        setSubmitting(false);
        return;
      }

      const portfolioUrl = form.portfolio.startsWith("http")
        ? form.portfolio
        : `https://${form.portfolio}`;

      const linkedinUrl = form.linkedin
        ? form.linkedin.startsWith("http") ? form.linkedin : `https://${form.linkedin}`
        : "";

      const githubUrl = form.github
        ? form.github.startsWith("http") ? form.github : `https://github.com/${form.github.replace("@","")}`
        : "";

      await addDoc(collection(db,"developerApplications"), {
        userId:        user.uid,
        email:         user.email,
        name:          form.name.trim(),
        bio:           form.bio.trim(),
        qualification: form.qualification,
        experience:    form.experience.trim(),
        skills:        form.skills,
        portfolio:     portfolioUrl,
        linkedin:      linkedinUrl,
        github:        githubUrl,
        profileImage:  form.profileImage || user.photoURL || "",
        status:        "pending",
        createdAt:     serverTimestamp(),
      });
      setSubmitted(true);
    } catch(e: any) {
      setErrors({ submit: e.message });
    }
    setSubmitting(false);
  }

  const inp = (key: string) =>
    `w-full bg-white border ${errors[key]?"border-red-300 ring-4 ring-red-50":"border-gray-300"} text-gray-900 placeholder-gray-400 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition duration-200 shadow-sm`;
  
  const lbl = "block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2";

  if (authLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="relative pt-28 pb-24 px-4 overflow-x-hidden flex-1 flex flex-col items-center justify-center">

        <div className="relative z-10 max-w-2xl mx-auto w-full">

          {/* Header */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
            className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-200 bg-violet-50 mb-5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
              <span className="text-violet-800 text-xs font-bold uppercase tracking-widest">Join as Developer</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-3">
              Build Your Career
            </h1>
            <p className="text-gray-500 text-base max-w-md mx-auto leading-relaxed font-medium">
              Join the Synthé developer network. Get hired, earn revenue, and get certified.
            </p>
          </motion.div>

          {/* Already applied state */}
          {alreadyApplied && !submitted && (
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
              className="relative rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center mb-8 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-gray-900 font-extrabold text-2xl mb-2">Application Under Review</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium">
                You've already submitted a developer application. We're reviewing it — you'll be notified once approved.
              </p>
              <Link href="/dashboard">
                <motion.div whileHover={{ scale:1.03 }}
                  className="inline-flex px-8 py-3.5 rounded-xl font-bold text-white text-sm cursor-pointer shadow-sm bg-blue-600 hover:bg-blue-700 transition">
                  Go to Dashboard →
                </motion.div>
              </Link>
            </motion.div>
          )}

          {/* Submitted success */}
          {submitted && (
            <motion.div initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }}
              className="flex flex-col items-center justify-center py-20 text-center">
              <motion.div animate={{ scale:[1,1.1,1] }} transition={{ duration:0.6, delay:0.2 }}
                className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 bg-blue-600 shadow-lg shadow-blue-500/30">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Application Submitted!</h2>
              <p className="text-gray-500 font-medium text-base max-w-md leading-relaxed mb-8">
                We'll review your application within 48 hours. You'll receive a notification once approved.
              </p>
              <Link href="/dashboard">
                <motion.div whileHover={{ scale:1.04 }}
                  className="px-8 py-3.5 rounded-xl font-bold text-white text-sm cursor-pointer shadow-sm bg-blue-600 hover:bg-blue-700 transition">
                  Go to Dashboard →
                </motion.div>
              </Link>
            </motion.div>
          )}

          {/* Form */}
          {!submitted && !alreadyApplied && (
            <>
              {/* Progress */}
              <div className="flex items-center gap-2 mb-8">
                {[1,2,3].map(n => (
                  <div key={n} className="flex items-center gap-2 flex-1">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition duration-300 ${
                      step >= n
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-gray-300 bg-gray-50 text-gray-400"
                    }`}>
                      {step > n ? "✓" : n}
                    </div>
                    {n < 3 && (
                      <div className={`flex-1 h-1 rounded-full transition duration-500 ${step > n ? "bg-blue-600" : "bg-gray-200"}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Not logged in */}
              {!user && (
                <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50 text-center mb-6 shadow-sm">
                  <p className="text-amber-700 font-medium text-sm">
                    <Link href="/login" className="underline text-amber-800 font-bold hover:text-amber-900">Log in</Link>
                    {" "}or{" "}
                    <Link href="/signup" className="underline text-amber-800 font-bold hover:text-amber-900">sign up</Link>
                    {" "}to apply as a developer.
                  </p>
                </div>
              )}

              <motion.div key={step} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                transition={{ duration:0.3 }}
                className="relative rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 overflow-hidden p-8 md:p-10">

                {/* Step 1 — Personal Info */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-100 pb-4 mb-2">
                      <h2 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">Personal Information</h2>
                      <p className="text-gray-500 font-medium text-sm">Tell us about yourself and your experience.</p>
                    </div>

                    <div>
                      <label className={lbl}>Full Name *</label>
                      <input value={form.name} onChange={e=>set("name",e.target.value)}
                        placeholder="Your full name" className={inp("name")} />
                      {errors.name && <p className="text-red-500 font-semibold text-xs mt-2">{errors.name}</p>}
                    </div>

                    <div>
                      <label className={lbl}>Short Bio</label>
                      <textarea value={form.bio} onChange={e=>set("bio",e.target.value)} rows={3}
                        placeholder="e.g. AR/VR developer with 3 years experience in Unity and WebXR…"
                        className={inp("bio") + " resize-none"} />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className={lbl}>Qualification *</label>
                        <select value={form.qualification} onChange={e=>set("qualification",e.target.value)}
                          className={inp("qualification")}>
                          <option value="">Select…</option>
                          {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                        </select>
                        {errors.qualification && <p className="text-red-500 font-semibold text-xs mt-2">{errors.qualification}</p>}
                      </div>
                      <div>
                        <label className={lbl}>Years of Experience *</label>
                        <input value={form.experience} onChange={e=>set("experience",e.target.value)}
                          placeholder="e.g. 2 years" className={inp("experience")} />
                        {errors.experience && <p className="text-red-500 font-semibold text-xs mt-2">{errors.experience}</p>}
                      </div>
                    </div>

                    <div>
                      <label className={lbl}>Skills * <span className="text-gray-400 normal-case font-medium">({form.skills.length} selected)</span></label>
                      <div className="flex flex-wrap gap-2">
                        {SKILLS.map(s => (
                          <button key={s} type="button" onClick={()=>toggleSkill(s)}
                            className="px-4 py-2 rounded-xl text-xs font-bold border transition duration-200 shadow-sm"
                            style={form.skills.includes(s)
                              ? { background:"#e0e7ff", borderColor:"#c7d2fe", color:"#4f46e5" }
                              : { background:"#f9fafb", borderColor:"#e5e7eb", color:"#6b7280" }
                            }>{s}</button>
                        ))}
                      </div>
                      {errors.skills && <p className="text-red-500 font-semibold text-xs mt-2">{errors.skills}</p>}
                    </div>
                  </div>
                )}

                {/* Step 2 — Links */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-100 pb-4 mb-2">
                      <h2 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">Portfolio & Links</h2>
                      <p className="text-gray-500 font-medium text-sm">Show us your work. Portfolio is required.</p>
                    </div>

                    <div>
                      <label className={lbl}>Portfolio URL *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">www.</span>
                        <input value={form.portfolio} onChange={e=>set("portfolio",e.target.value)}
                          placeholder="yourportfolio.com" className={inp("portfolio") + " pl-14"} />
                      </div>
                      {errors.portfolio && <p className="text-red-500 font-semibold text-xs mt-2">{errors.portfolio}</p>}
                    </div>

                    <div>
                      <label className={lbl}>LinkedIn URL</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">www.</span>
                        <input value={form.linkedin} onChange={e=>set("linkedin",e.target.value)}
                          placeholder="linkedin.com/in/yourname" className={inp("linkedin") + " pl-14"} />
                      </div>
                    </div>

                    <div>
                      <label className={lbl}>GitHub Username</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">github.com/</span>
                        <input value={form.github} onChange={e=>set("github",e.target.value)}
                          placeholder="yourusername" className={inp("github") + " pl-28"} />
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50 shadow-sm">
                      <p className="text-blue-800 text-sm font-extrabold mb-1">💡 Tip</p>
                      <p className="text-blue-700/80 text-xs font-medium leading-relaxed">
                        A strong portfolio significantly increases your chances of approval. Include your best AR/VR/3D work.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3 — Review */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="border-b border-gray-100 pb-4 mb-2">
                      <h2 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">Review & Submit</h2>
                      <p className="text-gray-500 font-medium text-sm">Check your details before submitting.</p>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label:"Name",          val: form.name },
                        { label:"Qualification", val: form.qualification },
                        { label:"Experience",    val: form.experience },
                        { label:"Skills",        val: form.skills.join(", ") || "None selected" },
                        { label:"Portfolio",     val: form.portfolio || "—" },
                        { label:"LinkedIn",      val: form.linkedin || "—" },
                        { label:"GitHub",        val: form.github ? `github.com/${form.github}` : "—" },
                      ].map((item,i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 shadow-sm">
                          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] w-24 flex-shrink-0 pt-0.5">{item.label}</p>
                          <p className="text-gray-900 text-sm font-bold break-all">{item.val}</p>
                        </div>
                      ))}
                    </div>

                    {errors.submit && (
                      <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 font-semibold text-sm shadow-sm">
                        {errors.submit}
                      </div>
                    )}

                    <div className="p-5 rounded-2xl border border-green-200 bg-green-50 text-sm font-medium text-green-800 leading-relaxed shadow-sm">
                      ✓ Applications are reviewed within 48 hours. You'll be notified via the platform once approved.
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                  {step > 1 && (
                    <button onClick={() => setStep(s => s-1)}
                      className="flex-1 py-3.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 shadow-sm transition duration-200">
                      ← Back
                    </button>
                  )}
                  {step < 3 ? (
                    <motion.button onClick={nextStep}
                      whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                      className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm relative overflow-hidden shadow-md bg-blue-600 hover:bg-blue-700 transition">
                      <span className="relative z-10">Next →</span>
                    </motion.button>
                  ) : (
                    <motion.button onClick={handleSubmit} disabled={submitting || !user}
                      whileHover={{ scale:submitting?1:1.02 }} whileTap={{ scale:submitting?1:0.98 }}
                      className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 relative overflow-hidden shadow-md bg-blue-600 hover:bg-blue-700 transition">
                      <span className="relative z-10">{submitting ? "Submitting…" : "Submit Application →"}</span>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}