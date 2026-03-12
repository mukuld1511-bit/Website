"use client";

import { useState, useRef } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { uploadToCloudinary } from "../../../lib/cloudinary";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SKILL_SUGGESTIONS = [
  "Unity", "Blender", "Unreal Engine", "WebXR", "Three.js",
  "AR Foundation", "Vuforia", "Maya", "ZBrush", "Houdini",
  "React Three Fiber", "A-Frame", "MRTK", "Spark AR",
];

const QUALIFICATIONS = [
  "Self-taught",
  "Bachelor's in CS / IT",
  "Bachelor's in Design",
  "Master's in CS / IT",
  "Master's in Design",
  "PhD",
  "Bootcamp Graduate",
  "Industry Professional (2+ yrs)",
  "Industry Professional (5+ yrs)",
  "Other",
];

export default function JoinDeveloper() {
  const router = useRouter();

  const [name,          setName]          = useState("");
  const [skills,        setSkills]        = useState<string[]>([]);
  const [skillInput,    setSkillInput]    = useState("");
  const [portfolio,     setPortfolio]     = useState("");
  const [linkedin,      setLinkedin]      = useState("");
  const [qualification, setQualification] = useState("");
  const [bio,           setBio]           = useState("");
  const [image,         setImage]         = useState<File | null>(null);
  const [preview,       setPreview]       = useState<string | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [submitted,     setSubmitted]     = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── skill tag helpers ──
  function addSkill(s: string) {
    const trimmed = s.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 12) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setSkillInput("");
  }
  function removeSkill(s: string) {
    setSkills((prev) => prev.filter((x) => x !== s));
  }
  function onSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && skillInput.trim()) {
      e.preventDefault();
      addSkill(skillInput);
    }
    if (e.key === "Backspace" && !skillInput && skills.length) {
      setSkills((prev) => prev.slice(0, -1));
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5 MB."); return; }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim())         { setError("Please enter your full name."); return; }
    if (skills.length === 0)  { setError("Add at least one skill."); return; }
    if (!qualification)       { setError("Please select your qualification."); return; }

    setLoading(true);
    try {
      let profileImage = "";
      if (image) profileImage = await uploadToCloudinary(image);

      await addDoc(collection(db, "developerApplications"), {
        name:          name.trim(),
        skills,
        portfolio:     portfolio.trim(),
        linkedin:      linkedin.trim(),
        qualification,
        bio:           bio.trim(),
        profileImage,
        status:        "pending",
        createdAt:     new Date(),
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message ?? "Submission failed. Please try again.");
    }
    setLoading(false);
  }

  const inputCls =
    "w-full bg-white/[0.03] border border-white/8 text-white placeholder-white/25 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-violet-500/50 focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition duration-200";

  const gradBtnStyle: React.CSSProperties = {
    willChange: "transform",
    background: loading
      ? "rgba(255,255,255,0.05)"
      : "linear-gradient(135deg, #7c3aed, #0891b2)",
  };

  // ── Success screen ──
  if (submitted) return (
    <main className="min-h-screen bg-[#050008] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)", filter: "blur(100px)" }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md text-center"
      >
        <div className="relative rounded-3xl overflow-hidden border border-violet-500/20 bg-white/[0.025] backdrop-blur-xl p-12">
          <div className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.5), rgba(34,211,238,0.3), transparent)" }} />

          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 0.7 }}
            className="w-24 h-24 rounded-3xl border border-violet-500/25 bg-violet-500/10 flex items-center justify-center mx-auto mb-6"
          >
            <svg className="w-12 h-12 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </motion.div>

          <h2 className="text-3xl font-black text-white mb-3">Application Submitted!</h2>
          <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
            Your developer application is under review. We'll notify you once it's been approved — usually within 48 hours.
          </p>

          <div className="flex flex-col gap-3">
            <motion.button
              onClick={() => router.push("/dashboard")}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ willChange: "transform", background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}
              className="w-full py-3.5 rounded-2xl font-black text-white text-sm"
            >
              Go to Dashboard →
            </motion.button>
            <motion.button
              onClick={() => router.push("/")}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ willChange: "transform" }}
              className="w-full py-3.5 rounded-2xl font-black text-white/40 text-sm border border-white/8 hover:border-white/20 hover:text-white/60 transition duration-200"
            >
              Back to Home
            </motion.button>
          </div>
        </div>
      </motion.div>
    </main>
  );

  // ── Form ──
  return (
    <main className="min-h-screen bg-[#050008] px-4 py-28 relative overflow-hidden">

      {/* Ambient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.13) 0%, transparent 70%)", filter: "blur(100px)" }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="absolute inset-0 opacity-[0.018] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(167,139,250,1) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 max-w-xl mx-auto">

        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <Link href="/join">
            <div className="inline-flex items-center gap-2 text-white/35 hover:text-white/60 text-xs font-semibold transition duration-200 mb-8 cursor-pointer">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Join
            </div>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-300/90 text-sm font-semibold uppercase tracking-widest">Developer Application</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white leading-none mb-3">
            Join as a{" "}
            <span style={{ backgroundImage: "linear-gradient(90deg, #a78bfa, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Developer
            </span>
          </h1>
          <p className="text-white/35 text-sm leading-relaxed max-w-md">
            Apply to upload models, earn from your work, and get featured in the SYNTHÉ developer network.
          </p>
        </motion.div>

        {/* Perks strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {[
            { icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12", label: "Upload Models",  color: "#a78bfa" },
            { icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Earn Revenue",   color: "#22d3ee" },
            { icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", label: "Get Certified", color: "#fbbf24" },
          ].map((p) => (
            <div key={p.label} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/6 bg-white/[0.02] text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${p.color}18`, border: `1px solid ${p.color}25` }}>
                <svg className="w-4.5 h-4.5" style={{ color: p.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={p.icon} />
                </svg>
              </div>
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">{p.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative rounded-3xl overflow-hidden border border-white/6 bg-white/[0.025] backdrop-blur-xl"
        >
          <div className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.4), rgba(34,211,238,0.3), transparent)" }} />

          <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-500/20 bg-rose-500/8 overflow-hidden"
                >
                  <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-rose-400 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Profile photo */}
            <div>
              <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-3">
                Profile Photo <span className="text-white/20 font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-5">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-white/10 hover:border-violet-500/35 cursor-pointer transition duration-200 flex-shrink-0 group"
                >
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  {preview ? (
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <svg className="w-6 h-6 text-white/20 group-hover:text-violet-400 transition duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                  {/* glow ring when preview */}
                  {preview && (
                    <div className="absolute -inset-[2px] rounded-2xl pointer-events-none"
                      style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.4), rgba(34,211,238,0.3))", zIndex: -1 }} />
                  )}
                </div>
                <div>
                  <p className="text-white/50 text-sm font-semibold mb-1">Click to upload</p>
                  <p className="text-white/25 text-xs">JPG, PNG or WebP · max 5 MB</p>
                  {preview && (
                    <button
                      type="button"
                      onClick={() => { setImage(null); setPreview(null); }}
                      className="mt-2 text-xs text-rose-400/70 hover:text-rose-300 transition duration-200"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Personal info */}
            <div className="h-[1px] bg-white/5" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25 -mb-2">Personal Info</p>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Full Name *</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-violet-400 transition duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mukul Sharma" required className={inputCls + " pl-11"} />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Short Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell us about yourself, your experience and what you build..."
                className={inputCls + " resize-none"}
              />
            </div>

            {/* Qualification */}
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Qualification / Experience *</label>
              <div className="relative">
                <select
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className={inputCls + " appearance-none pr-10 cursor-pointer"}
                >
                  <option value="" disabled className="bg-[#0a0010]">Select your qualification…</option>
                  {QUALIFICATIONS.map((q) => (
                    <option key={q} value={q} className="bg-[#0a0010]">{q}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Section: Skills */}
            <div className="h-[1px] bg-white/5" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25 -mb-2">Skills & Tools</p>

            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                Skills * <span className="text-white/20 font-normal normal-case tracking-normal">— type and press Enter or comma</span>
              </label>

              {/* Tag input */}
              <div
                className="min-h-[52px] w-full bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2.5 flex flex-wrap gap-2 cursor-text focus-within:border-violet-500/50 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition duration-200"
                onClick={() => document.getElementById("skill-input")?.focus()}
              >
                {skills.map((s) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-violet-500/30 bg-violet-500/15 text-violet-300 text-xs font-bold"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeSkill(s); }}
                      className="text-violet-400/60 hover:text-violet-200 transition duration-150"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </motion.div>
                ))}
                <input
                  id="skill-input"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={onSkillKeyDown}
                  onBlur={() => skillInput.trim() && addSkill(skillInput)}
                  placeholder={skills.length === 0 ? "Unity, Blender, WebXR…" : ""}
                  className="flex-1 min-w-[120px] bg-transparent text-white text-sm outline-none placeholder-white/20"
                />
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSkill(s)}
                    className="px-2.5 py-1 rounded-lg border border-white/8 bg-white/[0.02] text-white/35 text-[10px] font-bold hover:border-violet-500/30 hover:text-violet-300 hover:bg-violet-500/8 transition duration-150"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Section: Links */}
            <div className="h-[1px] bg-white/5" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25 -mb-2">Links</p>

            {/* Portfolio */}
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Portfolio URL</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-violet-400 transition duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <input
                  type="url"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="https://yourportfolio.com"
                  className={inputCls + " pl-11"}
                />
              </div>
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">LinkedIn Profile</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-violet-400 transition duration-200">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className={inputCls + " pl-11"}
                />
              </div>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-500/15 bg-amber-500/5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-amber-300 text-xs font-bold mb-1">Review process</p>
                <p className="text-white/30 text-xs leading-relaxed">
                  Applications are reviewed within 48 hours. Once approved, you'll be able to upload models, set pricing, and appear in the developer network.
                </p>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={gradBtnStyle}
              className="relative w-full py-4 text-base font-black text-white rounded-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Submit Developer Application
                  </>
                )}
              </span>
            </motion.button>

            <p className="text-center text-white/20 text-xs">
              Already a developer?{" "}
              <Link href="/login">
                <span className="text-violet-400/70 hover:text-violet-300 cursor-pointer transition duration-200 font-semibold">
                  Sign in
                </span>
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </main>
  );
}