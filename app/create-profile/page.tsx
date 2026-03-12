"use client";

import { useState } from "react";
import { getAuth } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import app from "../../lib/firebase";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateProfile() {
  const auth = getAuth(app);
  const router = useRouter();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: any) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) { setError("Please login first."); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, "profiles"), {
        name, bio, skills, userId: user.uid,
      });
      router.push("/dashboard");
    } catch {
      setError("Failed to save profile. Try again.");
    }
    setLoading(false);
  };

  const inputClass = "w-full bg-white/[0.03] border border-white/8 text-white placeholder-white/25 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-violet-500/50 focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition duration-200";

  const fields = [
    { label: "Your Name", placeholder: "e.g. Mukul Sharma", value: name, set: setName, icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", type: "input" },
    { label: "Short Bio", placeholder: "Tell the community about yourself...", value: bio, set: setBio, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", type: "textarea" },
    { label: "Skills", placeholder: "Unity, Blender, AR, VR, WebXR...", value: skills, set: setSkills, icon: "M13 10V3L4 14h7v7l9-11h-7z", hint: "Separate with commas", type: "input" },
  ];

  return (
    <main className="min-h-screen bg-[#050008] flex items-center justify-center px-4 py-24 relative overflow-hidden">

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.13) 0%, transparent 70%)", filter: "blur(100px)" }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="absolute inset-0 opacity-[0.018] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(167,139,250,1) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-300/90 text-sm font-semibold uppercase tracking-widest">Developer Profile</span>
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter text-white leading-none mb-3">
            Create Your{" "}
            <span style={{ backgroundImage: "linear-gradient(90deg, #a78bfa, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Profile
            </span>
          </h1>
          <p className="text-white/35 text-sm">Set up your developer identity on SYNTHÉ.</p>
        </div>

        {/* Card */}
        <div className="relative rounded-3xl overflow-hidden border border-white/6 bg-white/[0.025] backdrop-blur-xl">
          <div className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.4), rgba(34,211,238,0.3), transparent)" }} />

          <form onSubmit={handleSave} className="p-8 flex flex-col gap-6">

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-500/20 bg-rose-500/8"
              >
                <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-rose-400 text-sm">{error}</p>
              </motion.div>
            )}

            {fields.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
              >
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">{f.label}</label>
                <div className="relative group">
                  <div className="absolute left-4 top-4 text-white/25 group-focus-within:text-violet-400 transition duration-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                    </svg>
                  </div>
                  {f.type === "textarea" ? (
                    <textarea
                      placeholder={f.placeholder}
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      rows={4}
                      className={inputClass + " pl-10 resize-none"}
                    />
                  ) : (
                    <input
                      placeholder={f.placeholder}
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      className={inputClass + " pl-10"}
                    />
                  )}
                </div>
                {f.hint && <p className="text-white/20 text-xs mt-1.5 pl-1">{f.hint}</p>}
              </motion.div>
            ))}

            <motion.button
              type="submit"
              disabled={loading || !name}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{ willChange: "transform", background: loading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #7c3aed, #0891b2)" }}
              className="relative w-full py-4 text-base font-black text-white rounded-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {!loading && (
                <motion.div
                  animate={{ x: ["-200%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "linear" }}
                  style={{ willChange: "transform", position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", transform: "skewX(-20deg)", pointerEvents: "none" }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Saving...</>
                ) : (
                  <>Save Profile <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>
                )}
              </span>
            </motion.button>

            <p className="text-center text-white/20 text-xs">
              Already have a profile?{" "}
              <Link href="/profile"><span className="text-violet-400/70 hover:text-violet-300 cursor-pointer transition duration-200">View it here</span></Link>
            </p>
          </form>
        </div>
      </motion.div>
    </main>
  );
}