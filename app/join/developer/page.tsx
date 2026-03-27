"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Footer from "../../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";

const GOALS = [
  "Build AR apps", "Learn VR development", "3D modelling", "Game development",
  "Architectural visualisation", "Product design", "Career switch into XR", "Just exploring",
];

export default function JoinLearnerPage() {
  const router = useRouter();
  const [user, setUser]           = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [alreadyActive, setAlreadyActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState("");

  const [why, setWhy]             = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [experience, setExperience] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      setAuthLoading(false);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (data.role === "learner" || (Array.isArray(data.roles) && data.roles.includes("learner"))) {
          setAlreadyActive(true);
        }
      }
    });
    return () => unsub();
  }, []);

  const toggleGoal = (g: string) =>
    setSelectedGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!why.trim()) { setError("Please tell us your learning goal."); return; }
    setError(""); setSubmitting(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        role: "learner",
        roleActivatedAt: serverTimestamp(),
        learnerGoals: selectedGoals,
        learnerWhy: why.trim(),
        learnerExperience: experience,
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        message: "🎓 Welcome to SYNTHÉ! Your Learner role is now active. Start your XR journey!",
        read: false,
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#185FA5]/30 border-t-[#185FA5] animate-spin" />
    </div>
  );

  if (alreadyActive) return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">      <div className="flex-grow flex items-center justify-center px-4 py-24">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-blue-200 shadow-2xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-4xl mx-auto mb-6">🎓</div>
          <h2 className="text-2xl font-black text-white mb-3">You're already a Learner!</h2>
          <p className="text-gray-500 text-sm mb-8">Your learner role is active. Head to your dashboard to continue learning.</p>
          <Link href="/dashboard">
            <button className="w-full py-3.5 rounded-xl font-black text-white text-sm bg-[#185FA5] hover:opacity-90 transition">Go to Dashboard →</button>
          </Link>
        </motion.div>
      </div>
      <Footer />
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">      <div className="flex-grow flex items-center justify-center px-4 py-24">
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-12 max-w-md w-full text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-4xl mx-auto mb-6">🎓</motion.div>
          <h2 className="text-3xl font-black text-white mb-2">Role Activated! 🎉</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">
            You're now a <span className="font-black text-[#185FA5]">Learner</span> on SYNTHÉ. Your XR journey starts now.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-8 text-left space-y-2">
            {["Browse 100+ XR workshops", "Get your AI-powered learning roadmap", "Book verified mentors from ₹300/hr", "Earn certificates as you learn"].map((s, i) => (
              <p key={i} className="text-xs text-gray-700 flex gap-2"><span className="text-[#185FA5] font-black">✓</span>{s}</p>
            ))}
          </div>
          <Link href="/dashboard">
            <button className="w-full py-3.5 rounded-xl font-black text-white text-sm bg-[#185FA5] hover:opacity-90 transition">Go to Dashboard →</button>
          </Link>
        </motion.div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans text-white">      <div className="max-w-2xl mx-auto px-4 py-20 flex-grow w-full">

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#185FA5]/10 border border-[#185FA5]/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#185FA5] animate-pulse" />
            <span className="text-xs font-bold text-[#185FA5] uppercase tracking-widest">⚡ Instant Activation</span>
          </div>
          <div className="text-5xl mb-4">🎓</div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-3">Join as Learner</h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            Learn XR from scratch — AI-powered roadmaps, live workshops, and verified mentors. Role activates instantly.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { icon: "🗺️", label: "AI Roadmap" },
            { icon: "🎥", label: "Live Workshops" },
            { icon: "🧑‍🏫", label: "1-on-1 Mentors" },
            { icon: "🏆", label: "Certificates" },
          ].map(f => (
            <div key={f.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <div className="text-2xl mb-1">{f.icon}</div>
              <p className="text-xs font-bold text-gray-700">{f.label}</p>
            </div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8">

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">What do you want to learn? *</label>
              <textarea value={why} onChange={e => setWhy(e.target.value)} required rows={3}
                placeholder="e.g. I want to build AR apps for architecture. I'm a designer looking to add XR to my skills..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#185FA5] text-sm text-white outline-none transition resize-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Your goals (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {GOALS.map(g => (
                  <button key={g} type="button" onClick={() => toggleGoal(g)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition duration-200 ${
                      selectedGoals.includes(g)
                        ? "bg-[#185FA5]/10 border-[#185FA5]/40 text-[#185FA5]"
                        : "bg-[#0A0A0F] border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}>{g}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Prior experience with XR / 3D?</label>
              <select value={experience} onChange={e => setExperience(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#185FA5] transition bg-white">
                <option value="">Select…</option>
                <option value="none">None — complete beginner</option>
                <option value="some">Some — tried Unity/Blender briefly</option>
                <option value="intermediate">Intermediate — built small projects</option>
                <option value="advanced">Advanced — professional experience</option>
              </select>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <span className="text-green-500 font-black text-lg mt-0.5">⚡</span>
              <div>
                <p className="text-xs font-bold text-green-700 mb-0.5">Instant activation</p>
                <p className="text-xs text-green-600">No review needed. Your Learner role goes live the moment you submit.</p>
              </div>
            </div>

            {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">{error}</div>}

            <div className="flex gap-3">
              <Link href="/join" className="px-6 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-[#0A0A0F] transition flex items-center">← Back</Link>
              <button type="submit" disabled={submitting}
                className="flex-1 py-3.5 rounded-xl text-white font-black text-sm bg-[#185FA5] hover:opacity-90 transition disabled:opacity-50">
                {submitting ? "Activating…" : "Activate Learner Role →"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}