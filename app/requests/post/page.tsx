"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../../lib/firebase";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const CATEGORIES = ["3D Modeling", "AR App", "VR Experience", "WebXR", "Game Asset", "Other"];
const CATEGORY_ICONS: Record<string, string> = { "3D Modeling": "🎨", "AR App": "📱", "VR Experience": "🥽", "WebXR": "🌐", "Game Asset": "🎮", "Other": "✨" };
const BUDGET_RANGES = ["Flexible", "Under ₹5,000", "₹5,000 - ₹20,000", "₹20,000 - ₹50,000", "Above ₹50,000"];
const TIMELINES = ["Flexible", "ASAP (1-3 days)", "1-2 weeks", "1 month", "Ongoing"];

export default function PostRequestPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("3D Modeling");
  const [budget, setBudget] = useState("Flexible");
  const [timeline, setTimeline] = useState("Flexible");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthChecked(true); });
    return () => unsub();
  }, []);

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills(prev => [...prev, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (sk: string) => {
    setSkills(prev => prev.filter(s => s !== sk));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!title.trim() || !description.trim()) { setError("Title and description are required."); return; }
    }
    setError("");
    setStep(s => s + 1);
  };

  const handleBack = () => { setError(""); setStep(s => Math.max(1, s - 1)); };

  const handleSubmit = async () => {
    if (!user) { setError("You must be logged in to post a request."); return; }
    setLoading(true); setError("");

    try {
      await addDoc(collection(db, "projectRequests"), {
        title: title.trim(), description: description.trim(), category, budget, timeline, skills,
        userId: user.uid, userName: user.displayName || "Anonymous User", userPhoto: user.photoURL || "/avatar.png",
        status: "open", createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(() => router.push("/requests/open"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to post request.");
      setLoading(false);
    }
  };

  if (authChecked && !user) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center font-sans px-4">
        <div className="text-center p-10 bg-white rounded-3xl border border-gray-200 shadow-xl max-w-sm w-full">
           <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
           </div>
          <h1 className="text-gray-900 text-2xl font-black mb-3">Sign in required</h1>
          <p className="text-gray-500 mb-8 font-medium">Log in to post your project and connect with global spatial builders.</p>
          <Link href="/login">
            <button className="w-full px-6 py-4 rounded-xl bg-[#5B4BDB] text-white font-bold hover:bg-[#4a3bc7] transition shadow-md">
              Sign In to Post
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 })
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans flex flex-col">
      <Navbar />

      <main className="relative z-10 pt-28 pb-24 px-4 w-full flex-grow flex flex-col items-center">
        
        {/* Success Modal */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900/40 backdrop-blur-md px-4 pointer-events-none">
              <motion.div initial={{scale:0.9, y:20}} animate={{scale:1, y:0}} className="bg-white rounded-3xl p-10 text-center shadow-2xl max-w-sm border border-gray-100 pointer-events-auto">
                <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6 border border-green-100">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-gray-900 text-2xl font-black mb-2">Project Posted!</h2>
                <p className="text-gray-500 font-medium text-sm">Now redirecting to the global board...</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full max-w-3xl">
          
          <div className="mb-10 w-full">
            <Link href="/requests/open">
              <button className="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-900 transition mb-6 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Back to Requests
              </button>
            </Link>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-8">Post a Project</h1>
            
            {/* Stepper Header */}
            <div className="flex items-center justify-between relative mb-8">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full -z-10" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#5B4BDB] transition-all duration-300 rounded-full -z-10" style={{width: `${(step-1)*50}%`}} />
              
              {[1,2,3].map(num => (
                <div key={num} className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${step >= num ? 'bg-[#5B4BDB] text-white shadow-lg shadow-[#5B4BDB]/30 border-2 border-white' : 'bg-gray-100 text-gray-400 border-2 border-white'}`}>
                    {step > num ? '✓' : num}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest absolute -bottom-6 ${step >= num ? 'text-[#5B4BDB]' : 'text-gray-400'}`}>
                    {num===1 ? 'Basics' : num===2 ? 'Details' : 'Review'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 md:p-12 mt-12 overflow-hidden relative min-h-[400px]">
            
            {error && (
              <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <AnimatePresence mode="wait" custom={1}>
              {step === 1 && (
                <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" custom={1} transition={{duration:0.3}} className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-6">1. Let's start with the basics</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Project Title *</label>
                        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Need a low-poly character model..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 font-semibold text-base focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/20 outline-none transition" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Description *</label>
                        <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={5} placeholder="Describe exactly what you need built, provide reference links if any..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 font-medium text-base focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/20 outline-none transition resize-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Category *</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {CATEGORIES.map(c => (
                            <div key={c} onClick={()=>setCategory(c)}
                              className={`p-4 rounded-xl border cursor-pointer transition flex flex-col items-center justify-center text-center gap-2 ${category===c ? 'border-[#5B4BDB] bg-[#5B4BDB]/5 text-[#5B4BDB]' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'}`}>
                              <span className="text-2xl">{CATEGORY_ICONS[c]||"✨"}</span>
                              <span className="text-xs font-bold">{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button onClick={handleNext} className="px-8 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition shadow">Next Step →</button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" custom={1} transition={{duration:0.3}} className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-6">2. Budget, Timeline & Skills</h2>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Budget Estimate</label>
                          <div className="relative">
                            <select value={budget} onChange={e=>setBudget(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 font-semibold text-base focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/20 outline-none transition cursor-pointer">
                              {BUDGET_RANGES.map(b=><option key={b} value={b}>{b}</option>)}
                            </select>
                            <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Timeline</label>
                          <div className="relative">
                            <select value={timeline} onChange={e=>setTimeline(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 font-semibold text-base focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/20 outline-none transition cursor-pointer">
                              {TIMELINES.map(t=><option key={t} value={t}>{t}</option>)}
                            </select>
                            <svg className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100">
                         <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Required Skills (Optional)</label>
                         {skills.length > 0 && (
                           <div className="flex flex-wrap gap-2 mb-4">
                             {skills.map(s => (
                               <div key={s} className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center gap-2">
                                 {s} <button onClick={()=>removeSkill(s)} className="hover:text-red-500 opacity-60 hover:opacity-100">✕</button>
                               </div>
                             ))}
                           </div>
                         )}
                         <div className="flex gap-3">
                           <input value={skillInput} onChange={e=>setSkillInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();handleAddSkill();}}} placeholder="e.g. Blender, Unity, React..."
                             className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 font-semibold text-sm focus:border-[#5B4BDB] outline-none transition" />
                           <button onClick={handleAddSkill} type="button" className="px-6 py-3.5 bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">Add</button>
                         </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <button onClick={handleBack} className="px-8 py-4 text-gray-500 font-bold hover:text-gray-900 transition flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg> Back</button>
                    <button onClick={handleNext} className="px-8 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition shadow">Next Step →</button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" custom={1} transition={{duration:0.3}} className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-6">3. Review and Post</h2>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">{CATEGORY_ICONS[category]||"✨"}</span>
                        <span className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-md text-[10px] font-bold uppercase tracking-widest">{category}</span>
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 mb-3">{title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed font-medium mb-6 whitespace-pre-wrap">{description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-200 mb-6">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Budget</p>
                          <p className="text-sm font-bold text-gray-900">{budget}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Timeline</p>
                          <p className="text-sm font-bold text-gray-900">{timeline}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Skills Needed</p>
                        {skills.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                             {skills.map(s => <span key={s} className="px-2.5 py-1 text-[11px] font-bold text-gray-700 bg-gray-200 rounded border border-gray-300">{s}</span>)}
                          </div>
                        ) : <p className="text-sm font-medium text-gray-500">None specified</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <button onClick={handleBack} disabled={loading} className="px-6 py-4 text-gray-500 font-bold hover:text-gray-900 transition flex items-center gap-2 disabled:opacity-50"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg> Back</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-10 py-4 bg-[#5B4BDB] text-white font-bold rounded-xl hover:bg-[#4a3bc7] transition shadow-lg disabled:opacity-50 flex items-center gap-2">
                      {loading ? <><svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Posting...</> : "Submit Request ✓"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
