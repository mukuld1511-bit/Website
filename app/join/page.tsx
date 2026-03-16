"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { UserRole } from "../../types/gallery";

type ApplyType = "learner" | "developer" | "mentor";

const ROLE_INFO: Record<ApplyType, {
  icon:    string;
  title:   string;
  color:   string;
  bg:      string;
  border:  string;
  desc:    string;
  perks:   string[];
  fields:  string;
}> = {
  learner: {
    icon:   "🎓",
    title:  "Become a Learner",
    color:  "#185FA5",
    bg:     "#E6F1FB",
    border: "#378ADD44",
    desc:   "Join live AR/VR sessions, book 1-on-1 mentors, and learn from the XR community.",
    perks:  [
      "Register for live workshops and sessions",
      "Book 1-on-1 sessions with verified mentors",
      "Access learning resources and guides",
      "Get a Learner badge on your profile",
    ],
    fields: "why",
  },
  developer: {
    icon:   "⚡",
    title:  "Become a Developer",
    color:  "#5B4BDB",
    bg:     "#EEEDFE",
    border: "#5B4BDB44",
    desc:   "Upload and sell 3D models, AR/VR builds, and AutoCAD files on the SYNTHÉ marketplace.",
    perks:  [
      "Upload GLB, GLTF, OBJ, FBX, ZIP, DWG files",
      "Sell models with Razorpay payments",
      "Listed on the Connect developer marketplace",
      "Developer dashboard with earnings analytics",
    ],
    fields: "portfolio",
  },
  mentor: {
    icon:   "🧑‍🏫",
    title:  "Become a Mentor",
    color:  "#0F6E56",
    bg:     "#E1F5EE",
    border: "#1D9E7544",
    desc:   "Host live workshops and 1-on-1 sessions. Teach AR/VR development to the community.",
    perks:  [
      "Host live workshops for the community",
      "Accept 1-on-1 mentorship bookings",
      "Set your own rates (free or paid)",
      "Verified Mentor badge on your profile",
    ],
    fields: "expertise",
  },
};

export default function JoinPage() {
  const router  = useRouter();
  const [user,    setUser]    = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selected, setSelected] = useState<ApplyType | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  // form fields
  const [why,       setWhy]       = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [expertise, setExpertise] = useState("");
  const [experience,setExperience]= useState("");
  const [skills,    setSkills]    = useState("");

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
        userId:     user.uid,
        userName:   user.displayName || user.email,
        userPhoto:  user.photoURL || "",
        userEmail:  user.email,
        applyType:  selected,
        status:     "pending",
        createdAt:  serverTimestamp(),
      };

      if (selected === "learner")   data.why       = why.trim();
      if (selected === "developer") data.portfolio = portfolio.trim();
      if (selected === "mentor") {
        data.expertise  = expertise.trim();
        data.experience = experience.trim();
        data.skills     = skills.split(",").map(s => s.trim()).filter(Boolean);
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
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-grow flex items-center justify-center px-4 py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center"
          >
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6"
              style={{ background: info.bg }}>
              {info.icon}
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3">Application submitted!</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Your {selected} application is under review. Admin will approve it shortly.
              You'll be notified once your role is updated.
            </p>
            <Link href="/">
              <button className="px-8 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all active:translate-y-[1px]">
                Back to home
              </button>
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16 flex-grow w-full">

        <div className="mb-10">
          <p className="text-sm font-semibold text-[#5B4BDB] mb-2">Upgrade your account</p>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-3">
            What do you want to do?
          </h1>
          <p className="text-gray-500">
            Choose a role. Admin reviews your application and approves it.
          </p>
        </div>

        {/* Role selector cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {(["learner", "developer", "mentor"] as ApplyType[]).map(type => {
            const info      = ROLE_INFO[type];
            const isSelected = selected === type;
            const hasRole   = alreadyHasRole(type);

            return (
              <button
                key={type}
                disabled={hasRole}
                onClick={() => setSelected(type)}
                className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:-translate-y-1
                  ${hasRole ? "opacity-50 cursor-not-allowed border-gray-100 bg-white" :
                    isSelected ? "shadow-md" : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                  }`}
                style={isSelected ? { borderColor: info.color, background: info.bg } : {}}
              >
                <div className="text-3xl mb-3">{info.icon}</div>
                <h3 className="font-black text-gray-900 mb-1" style={isSelected ? { color: info.color } : {}}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                  {hasRole && <span className="ml-2 text-xs font-semibold text-gray-400">(current)</span>}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">{info.desc}</p>
                <ul className="mt-3 space-y-1">
                  {info.perks.map(p => (
                    <li key={p} className="text-xs text-gray-500 flex items-start gap-1.5">
                      <span style={{ color: info.color }} className="mt-0.5 flex-shrink-0">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Application form */}
        <AnimatePresence>
          {selected && !alreadyHasRole(selected) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: ROLE_INFO[selected].bg }}>
                  {ROLE_INFO[selected].icon}
                </div>
                <div>
                  <h2 className="font-black text-gray-900">{ROLE_INFO[selected].title}</h2>
                  <p className="text-xs text-gray-400">Tell us a bit about yourself</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Learner fields */}
                {selected === "learner" && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      Why do you want to learn AR/VR? *
                    </label>
                    <textarea
                      value={why}
                      onChange={e => setWhy(e.target.value)}
                      required
                      rows={3}
                      placeholder="Tell us what you want to learn and why..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/30 focus:border-[#5B4BDB] transition-all resize-none"
                    />
                  </div>
                )}

                {/* Developer fields */}
                {selected === "developer" && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Portfolio / GitHub / Behance link *
                      </label>
                      <input
                        type="url"
                        value={portfolio}
                        onChange={e => setPortfolio(e.target.value)}
                        required
                        placeholder="https://github.com/yourname"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/30 focus:border-[#5B4BDB] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Skills (comma separated)
                      </label>
                      <input
                        type="text"
                        value={skills}
                        onChange={e => setSkills(e.target.value)}
                        placeholder="Unity, Blender, WebXR, ARCore"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/30 focus:border-[#5B4BDB] transition-all"
                      />
                    </div>
                  </>
                )}

                {/* Mentor fields */}
                {selected === "mentor" && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Area of expertise *
                      </label>
                      <input
                        type="text"
                        value={expertise}
                        onChange={e => setExpertise(e.target.value)}
                        required
                        placeholder="e.g. Unity AR development, WebXR, Unreal Engine VR"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/30 focus:border-[#5B4BDB] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Years of experience *
                      </label>
                      <input
                        type="text"
                        value={experience}
                        onChange={e => setExperience(e.target.value)}
                        required
                        placeholder="e.g. 3 years in Unity, 2 years in WebXR"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/30 focus:border-[#5B4BDB] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Skills (comma separated)
                      </label>
                      <input
                        type="text"
                        value={skills}
                        onChange={e => setSkills(e.target.value)}
                        placeholder="Unity, ARCore, ARKit, Blender, Unreal"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/30 focus:border-[#5B4BDB] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        Portfolio / LinkedIn / YouTube *
                      </label>
                      <input
                        type="url"
                        value={portfolio}
                        onChange={e => setPortfolio(e.target.value)}
                        required
                        placeholder="https://linkedin.com/in/yourname"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/30 focus:border-[#5B4BDB] transition-all"
                      />
                    </div>
                  </>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm border-b-[3px] transition-all active:translate-y-[1px] disabled:opacity-50"
                    style={{
                      background: ROLE_INFO[selected].color,
                      borderColor: ROLE_INFO[selected].color + "cc",
                    }}
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
