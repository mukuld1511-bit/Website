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
const BUDGET_RANGES = ["Flexible", "Under $100", "$100 - $500", "$500 - $1000", "$1000+"];
const TIMELINES = ["Flexible", "ASAP (1-3 days)", "1-2 weeks", "1 month", "Ongoing"];

export default function PostRequestPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

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
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills(prev => [...prev, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setError("You must be logged in to post a request."); return; }
    if (!title.trim() || !description.trim()) { setError("Title and description are required."); return; }

    setLoading(true);
    setError("");

    try {
      await addDoc(collection(db, "projectRequests"), {
        title:       title.trim(),
        description: description.trim(),
        category,
        budget,
        timeline,
        skills,
        userId:    user.uid,
        userName:  user.displayName || "Anonymous User",
        userPhoto: user.photoURL    || "/avatar.png",
        status:    "open",
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => router.push("/requests/open"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to post request.");
      setLoading(false);
    }
  };

  const inp = "w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition duration-200 shadow-sm";

  if (authChecked && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="text-center p-10 bg-white rounded-3xl border border-gray-200 shadow-sm max-w-sm w-full mx-4">
          <h1 className="text-gray-900 text-3xl font-extrabold mb-3">Sign in required</h1>
          <p className="text-gray-500 mb-8 font-medium">You need to log in to post a project request.</p>
          <Link href="/login">
            <button className="w-full px-6 py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-sm">
              Sign In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar />

      <main className="relative z-10 pt-32 pb-24 px-4 max-w-3xl mx-auto w-full flex-grow">
        <AnimatePresence>
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none bg-gray-900/40 backdrop-blur-sm"
            >
              <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center pointer-events-auto shadow-2xl max-w-sm mx-4">
                <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                  <motion.svg
                    className="w-10 h-10 text-green-500"
                    animate={{ scale: [0.8, 1.1, 1] }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </motion.svg>
                </div>
                <h2 className="text-gray-900 text-2xl font-black mb-2">Request Posted!</h2>
                <p className="text-gray-500 font-medium text-sm">Redirecting to public feed...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-10 text-center">
            <Link href="/requests/open">
              <p className="inline-flex items-center gap-2 text-gray-500 text-sm font-bold mb-6 hover:text-gray-900 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Feed
              </p>
            </Link>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-4">
              Post a Project
            </h1>
            <p className="text-gray-500 text-base font-medium max-w-xl mx-auto">
              Describe what you want to build and connect with peers to collaborate.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 md:p-10 shadow-sm">
              {error && (
                <div className="mb-8 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Project Title *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} required
                    placeholder="e.g. Need a 3D character for Unity game" className={inp} />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Description *</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4}
                    placeholder="Describe exactly what you need built, references, requirements…" className={inp + " resize-none"} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Category</label>
                    <div className="relative">
                      <select value={category} onChange={e => setCategory(e.target.value)} className={inp + " appearance-none cursor-pointer"}>
                        {CATEGORIES.map(c => <option key={c} value={c} className="bg-white text-gray-900">{c}</option>)}
                      </select>
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Budget</label>
                    <div className="relative">
                      <select value={budget} onChange={e => setBudget(e.target.value)} className={inp + " appearance-none cursor-pointer"}>
                        {BUDGET_RANGES.map(b => <option key={b} value={b} className="bg-white text-gray-900">{b}</option>)}
                      </select>
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Timeline</label>
                  <div className="relative">
                    <select value={timeline} onChange={e => setTimeline(e.target.value)} className={inp + " appearance-none cursor-pointer"}>
                      {TIMELINES.map(t => <option key={t} value={t} className="bg-white text-gray-900">{t}</option>)}
                    </select>
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Required Skills (Optional)</label>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {skills.map(s => (
                      <button key={s} type="button" onClick={() => setSkills(skills.filter(x => x !== s))}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition">
                        {s} <span className="ml-1 opacity-60">✕</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                      placeholder="e.g. Unity, Blender, WebXR…" className={inp} />
                    <button type="button" onClick={handleAddSkill}
                      className="px-6 py-3.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition whitespace-nowrap">
                      Add Skill
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading || success}
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 mt-2">
              {loading ? (
                 <span className="flex items-center justify-center gap-2">
                   <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   Posting...
                 </span>
              ) : "Post Project →"}
            </button>
          </form>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
