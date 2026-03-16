 
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
 
type ApplyType = "learner" | "developer" | "mentor";
 
const ROLE_INFO: Record<ApplyType, {
  icon: string;
  title: string;
  color: string;
  bg: string;
  border: string;
  desc: string;
  perks: string[];
  earnings?: string;
  badge?: string;
  fields: string;
}> = {
  learner: {
    icon: "🎓",
    title: "Become a Learner",
    color: "#185FA5",
    bg: "#E6F1FB",
    border: "#378ADD44",
    desc: "Join live AR/VR sessions, book 1-on-1 mentors, unlock certificates.",
    badge: "SCHOLAR",
    perks: [
      "Register for 100+ live workshops monthly",
      "Book mentors (₹300-1000/hr rates)",
      "Access exclusive learning resources",
      "Earn learning certificates & badges",
      "Join study groups & peer networks",
      "Get personalized learning paths",
    ],
    fields: "why",
  },
  developer: {
    icon: "⚡",
    title: "Become a Developer",
    color: "#5B4BDB",
    bg: "#EEEDFE",
    border: "#5B4BDB44",
    desc: "Upload 3D models, AR/VR builds, earn 85% commission per sale.",
    earnings: "₹50,000+ monthly potential",
    badge: "CREATOR",
    perks: [
      "Upload GLB, GLTF, OBJ, FBX, ZIP, DWG files",
      "Earn 85% commission (SYNTHÉ takes 15%)",
      "Reach 10,000+ monthly active buyers",
      "Professional creator dashboard with analytics",
      "Featured in trending creators section",
      "Direct commission payouts via UPI/Bank",
    ],
    fields: "portfolio",
  },
  mentor: {
    icon: "🧑‍🏫",
    title: "Become a Mentor",
    color: "#0F6E56",
    bg: "#E1F5EE",
    border: "#1D9E7544",
    desc: "Host live workshops (free) + 1-on-1 sessions (you set rates).",
    earnings: "₹80,000+ monthly potential",
    badge: "EDUCATOR",
    perks: [
      "Host unlimited free live workshops",
      "Set your own 1-on-1 session rates",
      "Earn 85% commission (SYNTHÉ takes 15%)",
      "Teach 50+ students simultaneously",
      "Access mentor analytics & impact metrics",
      "Verified mentor badge on profile",
    ],
    fields: "expertise",
  },
};
 
export default function JoinPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selected, setSelected] = useState<ApplyType | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
 
  const [why, setWhy] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [expertise, setExpertise] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
 
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) setProfile(snap.data());
    });
    return () => unsub();
  }, []);
 
  const alreadyHasRole = (type: ApplyType) => {
    if (!profile) return false;
    if (profile.role === type) return true;
    if (profile.roles?.includes(type)) return true;
    return false;
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selected) return;
    setLoading(true);
    setError("");
 
    try {
      const data: any = {
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL || "",
        userEmail: user.email,
        applyType: selected,
        status: "pending",
        createdAt: serverTimestamp(),
      };
 
      if (selected === "learner") data.why = why.trim();
      if (selected === "developer") data.portfolio = portfolio.trim();
      if (selected === "mentor") {
        data.expertise = expertise.trim();
        data.experience = experience.trim();
        data.skills = skills.split(",").map(s => s.trim()).filter(Boolean);
      }
 
      await addDoc(collection(db, "roleApplications"), data);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
 
  if (submitted && selected) {
    const info = ROLE_INFO[selected];
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-grow flex items-center justify-center px-4 py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-12 max-w-md w-full text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-8 shadow-lg"
              style={{ background: info.bg }}>
              {info.icon}
            </motion.div>
            
            <h2 className="text-3xl font-black text-gray-900 mb-2">🎉 Application Submitted!</h2>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{info.badge}</p>
            
            <p className="text-gray-600 text-base leading-relaxed mb-8">
              Your {selected} application is under review. Admin will verify your details and approve within 24-48 hours.
            </p>
 
            <div className="bg-blue-50 rounded-2xl p-6 mb-8 border border-blue-100">
              <p className="text-sm font-bold text-blue-900 mb-3">✨ Next Steps:</p>
              <ul className="text-xs text-blue-800 space-y-2">
                <li>✓ Check your email for updates</li>
                <li>✓ Complete your profile once approved</li>
                <li>✓ Start earning immediately</li>
              </ul>
            </div>
 
            <Link href="/">
              <button className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-base hover:shadow-xl transition shadow-lg">
                Back to Home
              </button>
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex flex-col font-sans text-gray-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-20 flex-grow w-full">
 
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <p className="text-sm font-black text-indigo-600 uppercase mb-3">Upgrade Your Account</p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-gray-900 mb-4">
            What's your role?
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose your path. Get verified. Start earning or learning today.
          </p>
        </motion.div>
 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {(["learner", "developer", "mentor"] as ApplyType[]).map((type, i) => {
            const info = ROLE_INFO[type];
            const isSelected = selected === type;
            const hasRole = alreadyHasRole(type);
 
            return (
              <motion.button
                key={type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                disabled={hasRole}
                onClick={() => setSelected(type)}
                className={`relative p-8 rounded-3xl border-2 text-left transition-all duration-300 group ${
                  hasRole ? "opacity-50 cursor-not-allowed border-gray-100 bg-white" :
                    isSelected ? "shadow-2xl transform scale-105" : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg hover:-translate-y-1"
                }`}
                style={isSelected ? { borderColor: info.color, background: info.bg } : {}}
              >
                <div className="absolute -top-4 -right-4 px-4 py-1 rounded-full text-white text-[10px] font-black" style={{ background: info.color }}>
                  {hasRole ? "CURRENT" : "NEW"}
                </div>
 
                <div className="text-5xl mb-4">{info.icon}</div>
                
                <h3 className="font-black text-2xl text-gray-900 mb-2" style={isSelected ? { color: info.color } : {}}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </h3>
 
                {info.earnings && (
                  <p className="text-sm font-black mb-4" style={{ color: info.color }}>
                    {info.earnings}
                  </p>
                )}
 
                <p className="text-sm text-gray-600 leading-relaxed mb-6">{info.desc}</p>
 
                <ul className="space-y-3">
                  {info.perks.map((p, j) => (
                    <li key={j} className="text-xs text-gray-600 flex items-start gap-2">
                      <span style={{ color: info.color }} className="mt-1 flex-shrink-0 font-black">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.button>
            );
          })}
        </div>
 
        <AnimatePresence>
          {selected && !alreadyHasRole(selected) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl border-2 border-gray-200 shadow-2xl p-10 max-w-3xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: ROLE_INFO[selected].bg }}>
                  {ROLE_INFO[selected].icon}
                </div>
                <div>
                  <h2 className="font-black text-2xl text-gray-900">{ROLE_INFO[selected].title}</h2>
                  <p className="text-sm text-gray-500">Tell us about yourself</p>
                </div>
              </div>
 
              <form onSubmit={handleSubmit} className="space-y-6">
 
                {selected === "learner" && (
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase mb-2">Why learn AR/VR? *</label>
                    <textarea
                      value={why}
                      onChange={e => setWhy(e.target.value)}
                      required
                      rows={4}
                      placeholder="Tell us your learning goals..."
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition resize-none"
                    />
                  </div>
                )}
 
                {selected === "developer" && (
                  <>
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase mb-2">Portfolio Link *</label>
                      <input
                        type="url"
                        value={portfolio}
                        onChange={e => setPortfolio(e.target.value)}
                        required
                        placeholder="https://github.com/yourname"
                        className="w-full px-5 py-4 rounded-2xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase mb-2">Skills</label>
                      <input
                        type="text"
                        value={skills}
                        onChange={e => setSkills(e.target.value)}
                        placeholder="Unity, Blender, WebXR, ARCore"
                        className="w-full px-5 py-4 rounded-2xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                      />
                    </div>
                  </>
                )}
 
                {selected === "mentor" && (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black text-gray-700 uppercase mb-2">Expertise *</label>
                        <input
                          type="text"
                          value={expertise}
                          onChange={e => setExpertise(e.target.value)}
                          required
                          placeholder="Unity AR, WebXR"
                          className="w-full px-5 py-4 rounded-2xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-700 uppercase mb-2">Experience *</label>
                        <input
                          type="text"
                          value={experience}
                          onChange={e => setExperience(e.target.value)}
                          required
                          placeholder="5 years in Unity"
                          className="w-full px-5 py-4 rounded-2xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase mb-2">Skills</label>
                      <input
                        type="text"
                        value={skills}
                        onChange={e => setSkills(e.target.value)}
                        placeholder="Unity, ARCore, Blender"
                        className="w-full px-5 py-4 rounded-2xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 uppercase mb-2">Portfolio / LinkedIn *</label>
                      <input
                        type="url"
                        value={portfolio}
                        onChange={e => setPortfolio(e.target.value)}
                        required
                        placeholder="https://linkedin.com/in/yourname"
                        className="w-full px-5 py-4 rounded-2xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                      />
                    </div>
                  </>
                )}
 
                {error && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold">
                    {error}
                  </div>
                )}
 
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="px-8 py-4 rounded-2xl border border-gray-200 text-gray-600 font-black hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 rounded-2xl text-white font-black transition disabled:opacity-50"
                    style={{ background: ROLE_INFO[selected].color }}
                  >
                    {loading ? "Submitting..." : `Apply as ${selected.charAt(0).toUpperCase() + selected.slice(1)}`}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
 
      </div>
      <Footer />
    </div>
  );
}