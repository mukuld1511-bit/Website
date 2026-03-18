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

const ROLES: Record<ApplyType, {
  icon: string; title: string; color: string; bg: string; border: string;
  tagline: string; desc: string; earnings?: string; badge: string; perks: string[];
  notFor: string; fields: string;
}> = {
  learner: {
    icon: "🎓", title: "Learner", color: "#185FA5", bg: "#E6F1FB", border: "#378ADD33",
    tagline: "Learn XR from scratch — guided, structured, AI-powered.",
    desc: "Get a personalised AI roadmap, attend free live workshops by mentors, and book 1-on-1 sessions. Built for complete beginners to advanced learners.",
    badge: "SCHOLAR",
    perks: [
      "AI-generated personalised XR roadmap (Gemini)",
      "Register for 100+ free live workshops monthly",
      "Book verified mentors at ₹300–₹1000/hr",
      "Access exclusive learning resources & guides",
      "Earn learning certificates and badges",
      "Join peer study groups and community",
    ],
    notFor: "Not for creators who want to sell models — apply as Developer instead.",
    fields: "why",
  },
  developer: {
    icon: "⚡", title: "Developer", color: "#5B4BDB", bg: "#EEEDFE", border: "#5B4BDB33",
    tagline: "Upload 3D models and AR/VR builds. Earn 85% on every sale.",
    desc: "List your GLB, GLTF, OBJ, FBX, ZIP, or DWG files on SYNTHÉ's marketplace. Set your own price. SYNTHÉ takes 15%, you keep 85% — always.",
    earnings: "₹50,000+ monthly potential",
    badge: "CREATOR",
    perks: [
      "Upload GLB, GLTF, OBJ, FBX, ZIP, DWG files",
      "Earn 85% commission on every sale",
      "Reach 10,000+ active buyers monthly",
      "Pro creator dashboard with analytics",
      "AI auto-writes titles, tags & pricing (Gemini)",
      "Direct payout via UPI/Bank transfer",
    ],
    notFor: "Not for teaching — apply as Mentor if you want to host sessions.",
    fields: "portfolio",
  },
  mentor: {
    icon: "🧑‍🏫", title: "Mentor", color: "#0F6E56", bg: "#E1F5EE", border: "#1D9E7533",
    tagline: "Host free workshops. Run paid 1-on-1 sessions. Set your own rates.",
    desc: "Create live workshops (always free to learners) and offer paid 1-on-1 bookings at rates you set. SYNTHÉ handles payments — you focus on teaching.",
    earnings: "₹80,000+ monthly potential",
    badge: "EDUCATOR",
    perks: [
      "Host unlimited free live workshops",
      "Set your own 1-on-1 hourly rate",
      "Earn 85% on every paid session",
      "Teach up to 50 students simultaneously",
      "Mentor analytics and impact dashboard",
      "Verified mentor badge on your profile",
    ],
    notFor: "Not for selling 3D assets — apply as Developer for that.",
    fields: "expertise",
  },
};

const COMPARE_ROWS: [string, boolean, boolean, boolean][] = [
  ["Browse 3D gallery",          true,  true,  false],
  ["Attend free live workshops", true,  false, true ],
  ["AI personalised roadmap",    true,  false, false],
  ["Book 1-on-1 mentors",        true,  false, false],
  ["Upload & sell 3D models",    false, true,  false],
  ["Host live workshops",        false, false, true ],
  ["Earn 85% commission",        false, true,  true ],
  ["Set your own rates",         false, true,  true ],
  ["Verified role badge",        true,  true,  true ],
];

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
    if (Array.isArray(profile.roles) && profile.roles.includes(type)) return true;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selected) return;
    setLoading(true);
    setError("");
    try {
      const data: Record<string, any> = {
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL || "",
        userEmail: user.email,
        applyType: selected,
        status: "pending",
        createdAt: serverTimestamp(),
      };
      if (selected === "learner") data.why = why.trim();
      if (selected === "developer") { data.portfolio = portfolio.trim(); data.skills = skills.split(",").map((s: string) => s.trim()).filter(Boolean); }
      if (selected === "mentor") { data.expertise = expertise.trim(); data.experience = experience.trim(); data.skills = skills.split(",").map((s: string) => s.trim()).filter(Boolean); data.portfolio = portfolio.trim(); }
      await addDoc(collection(db, "roleApplications"), data);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ── SUCCESS STATE ──
  if (submitted && selected) {
    const info = ROLES[selected];
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex flex-col font-sans">
        <Navbar />
        <div className="flex-grow flex items-center justify-center px-4 py-24">
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-12 max-w-md w-full text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm"
              style={{ background: info.bg }}>
              {info.icon}
            </motion.div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Application submitted!</h2>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{info.badge}</p>
            <p className="text-gray-600 text-sm leading-relaxed mb-8">
              Your {selected} application is under review. Admin will verify and approve within 24–48 hours. You'll be notified.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-8 text-left">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Next steps</p>
              <ul className="space-y-2">
                {["Check your email for updates", "Complete your profile once approved", selected === "developer" || selected === "mentor" ? "Start earning immediately" : "Join your first live session"].map(s => (
                  <li key={s} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-green-500 font-black flex-shrink-0">✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/dashboard">
              <button className="w-full py-3.5 rounded-xl font-black text-white text-sm transition hover:opacity-90" style={{ background: info.color }}>
                Go to dashboard →
              </button>
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col font-sans text-gray-900">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-20 flex-grow w-full">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5B4BDB]/10 border border-[#5B4BDB]/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BDB] animate-pulse" />
            <span className="text-xs font-bold text-[#5B4BDB] uppercase tracking-widest">Upgrade your account</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-gray-900 mb-4">Choose your role</h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Already a member? Pick a role to unlock new features. Admin approves within 24 hrs.
          </p>
        </motion.div>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {(["learner", "developer", "mentor"] as ApplyType[]).map((type, i) => {
            const info = ROLES[type];
            const isSelected = selected === type;
            const hasRole = alreadyHasRole(type);

            return (
              <motion.div key={type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <button
                  disabled={hasRole}
                  onClick={() => setSelected(isSelected ? null : type)}
                  className={`relative w-full p-7 rounded-2xl border-2 text-left transition-all duration-200 group ${
                    hasRole ? "opacity-50 cursor-not-allowed bg-white border-gray-100" :
                    isSelected ? "shadow-xl -translate-y-1" :
                    "bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5"
                  }`}
                  style={isSelected ? { borderColor: info.color, background: info.bg } : {}}
                >
                  {/* Badge */}
                  <div className="absolute -top-3 left-6 px-3 py-1 rounded-full text-white text-[10px] font-black shadow-sm" style={{ background: info.color }}>
                    {hasRole ? "CURRENT ROLE" : info.badge}
                  </div>

                  {isSelected && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: info.color }}>
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  )}

                  <div className="text-4xl mb-4 mt-2">{info.icon}</div>
                  <h3 className="font-black text-xl text-gray-900 mb-1" style={isSelected ? { color: info.color } : {}}>
                    {info.title}
                  </h3>
                  {info.earnings && (
                    <p className="text-sm font-black mb-3" style={{ color: info.color }}>{info.earnings}</p>
                  )}
                  <p className="text-sm text-gray-500 leading-relaxed mb-5">{info.tagline}</p>

                  <ul className="space-y-2.5">
                    {info.perks.map((p, j) => (
                      <li key={j} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0 font-black" style={{ color: info.color }}>✓</span>
                        {p}
                      </li>
                    ))}
                  </ul>

                  <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100 italic">{info.notFor}</p>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Compare table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-10">
          <div className="grid grid-cols-4 text-xs font-bold text-gray-400 uppercase tracking-wide px-6 py-3 bg-gray-50 border-b border-gray-100">
            <div>Feature</div>
            <div className="text-center text-blue-600">Learner</div>
            <div className="text-center text-violet-600">Developer</div>
            <div className="text-center text-teal-600">Mentor</div>
          </div>
          {COMPARE_ROWS.map(([label, l, d, m]) => (
            <div key={label} className="grid grid-cols-4 px-6 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <div className="text-sm text-gray-700 font-medium">{label}</div>
              {[l, d, m].map((v, i) => (
                <div key={i} className="flex justify-center">
                  {v ? <span className="text-green-500 font-black text-sm">✓</span> : <span className="text-gray-300 text-sm">—</span>}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Application form */}
        <AnimatePresence>
          {selected && !alreadyHasRole(selected) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-10 max-w-2xl mx-auto">

              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: ROLES[selected].bg }}>
                  {ROLES[selected].icon}
                </div>
                <div>
                  <h2 className="font-black text-xl text-gray-900">{ROLES[selected].title} Application</h2>
                  <p className="text-sm text-gray-400">{ROLES[selected].desc}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {selected === "learner" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Why do you want to learn AR/VR? *</label>
                    <textarea value={why} onChange={e => setWhy(e.target.value)} required rows={4}
                      placeholder="Tell us your learning goals and what you want to build..."
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#185FA5] focus:ring-2 focus:ring-blue-100 text-sm text-gray-900 outline-none transition resize-none" />
                  </div>
                )}

                {selected === "developer" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Portfolio / GitHub link *</label>
                      <input type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)} required
                        placeholder="https://github.com/yourname or https://yourportfolio.com"
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#5B4BDB] focus:ring-2 focus:ring-violet-100 text-sm text-gray-900 outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Skills (comma-separated)</label>
                      <input type="text" value={skills} onChange={e => setSkills(e.target.value)}
                        placeholder="Unity, Blender, WebXR, ARCore, Three.js"
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#5B4BDB] focus:ring-2 focus:ring-violet-100 text-sm text-gray-900 outline-none transition" />
                    </div>
                  </>
                )}

                {selected === "mentor" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Area of expertise *</label>
                        <input type="text" value={expertise} onChange={e => setExpertise(e.target.value)} required
                          placeholder="Unity AR, WebXR, Blender..."
                          className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#0F6E56] focus:ring-2 focus:ring-teal-100 text-sm text-gray-900 outline-none transition" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Years of experience *</label>
                        <input type="text" value={experience} onChange={e => setExperience(e.target.value)} required
                          placeholder="e.g. 5 years in Unity"
                          className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#0F6E56] focus:ring-2 focus:ring-teal-100 text-sm text-gray-900 outline-none transition" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Skills (comma-separated)</label>
                      <input type="text" value={skills} onChange={e => setSkills(e.target.value)}
                        placeholder="Unity, ARCore, Blender, Three.js"
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#0F6E56] focus:ring-2 focus:ring-teal-100 text-sm text-gray-900 outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Portfolio / LinkedIn *</label>
                      <input type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)} required
                        placeholder="https://linkedin.com/in/yourname"
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#0F6E56] focus:ring-2 focus:ring-teal-100 text-sm text-gray-900 outline-none transition" />
                    </div>
                  </>
                )}

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">{error}</div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setSelected(null)}
                    className="px-6 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition">
                    Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-3.5 rounded-xl text-white font-black text-sm transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: ROLES[selected].color }}>
                    {loading ? "Submitting..." : `Apply as ${ROLES[selected].title}`}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Not logged in fallback */}
        {!user && (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">You need an account first</p>
            <Link href="/signup">
              <button className="px-8 py-3.5 rounded-xl bg-[#5B4BDB] text-white font-black text-sm">
                Create account →
              </button>
            </Link>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}