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
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to post a request.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await addDoc(collection(db, "projectRequests"), {
        title: title.trim(),
        description: description.trim(),
        category,
        budget,
        timeline,
        skills,
        userId: user.uid,
        userName: user.displayName || "Anonymous User",
        userPhoto: user.photoURL || "/avatar.png",
        status: "open",
        createdAt: serverTimestamp()
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/requests/open");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to post request.");
      setLoading(false);
    }
  };

  if (user === null && !loading && !success) {
    return (
      <div className="min-h-screen bg-[#050008] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-3xl font-black mb-4">Sign in required</h1>
          <p className="text-white/40 mb-6">You need to log in to post a project request.</p>
          <Link href="/login">
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 outline-none text-white font-black hover:from-pink-500 hover:to-rose-500 transition">
              Sign In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const inp = "w-full bg-white/[0.03] border border-white/8 text-white placeholder-white/20 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-pink-500/50 transition duration-200";

  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />

      <div className="relative z-10 pt-32 pb-24 px-4 max-w-3xl mx-auto">
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-[#050008] border border-emerald-500/30 rounded-3xl p-8 text-center pointer-events-auto">
                <motion.svg className="w-16 h-16 mx-auto mb-4 text-emerald-400" animate={{ scale:[0.8,1.1,1] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </motion.svg>
                <h2 className="text-white text-2xl font-black mb-2">Request Posted!</h2>
                <p className="text-white/50 text-sm">Redirecting to public feed...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-10">
            <Link href="/requests/open">
              <p className="text-white/40 text-sm font-black mb-3 hover:text-white/60 transition">
                ← Back to Feed
              </p>
            </Link>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-none mb-3">
              Post a{" "}
              <span className="text-pink-500">
                Request
              </span>
            </h1>
            <p className="text-white/40 text-lg">Describe what you need built and let developers come to you.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl p-8">
              {error && (
                <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm font-bold">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-2">Project Title *</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} required
                    placeholder="e.g. Need a 3D character for Unity game" className={inp} />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-2">Description *</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4}
                    placeholder="Describe exactly what you need built, references, specific requirements, etc." className={inp + " resize-none"} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-2">Category</label>
                    <div className="relative">
                      <select value={category} onChange={(e) => setCategory(e.target.value)}
                        className={inp + " appearance-none cursor-pointer"}>
                        {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#050008] text-white">{c}</option>)}
                      </select>
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-2">Budget</label>
                    <div className="relative">
                      <select value={budget} onChange={(e) => setBudget(e.target.value)}
                        className={inp + " appearance-none cursor-pointer"}>
                        {BUDGET_RANGES.map(b => <option key={b} value={b} className="bg-[#050008] text-white">{b}</option>)}
                      </select>
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-2">Timeline</label>
                  <div className="relative">
                    <select value={timeline} onChange={(e) => setTimeline(e.target.value)}
                      className={inp + " appearance-none cursor-pointer"}>
                      {TIMELINES.map(t => <option key={t} value={t} className="bg-[#050008] text-white">{t}</option>)}
                    </select>
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-2">Required Skills / tech (Optional)</label>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {skills.map(s => (
                      <button key={s} type="button" onClick={() => setSkills(skills.filter(x => x !== s))}
                        className="px-3 py-1.5 rounded-lg text-xs font-black bg-white/5 border border-white/10 text-white/60 hover:text-white transition">
                        {s} ✕
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                      placeholder="e.g. Unity, Blender, WebXR..." className={inp} />
                    <button type="button" onClick={handleAddSkill} className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-black text-xs hover:bg-white/10 hover:text-white transition">
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <button type="submit" disabled={loading || success}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-lg disabled:opacity-50 transition duration-200">
              {loading ? "Posting..." : "Post Request →"}
            </button>
          </form>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
