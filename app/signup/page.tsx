"use client";

import { useState, Suspense } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export const dynamic = "force-dynamic";

const ROLES = [
  {
    id: "user",
    label: "Just browsing",
    icon: "👤",
    desc: "Explore the platform, browse 3D models, attend free workshops.",
    color: "#6B6B85",
    bg: "#141420", // or rgba(255,255,255,0.05)
    approvalNote: null,
  },
  {
    id: "learner",
    label: "Learner",
    icon: "🎓",
    desc: "Learn AR/VR with AI roadmaps, live sessions, and 1-on-1 mentors.",
    color: "#3B82F6",
    bg: "rgba(59, 130, 246, 0.08)",
    approvalNote: "⚡ Instant activation after signup",
  },
  {
    id: "developer",
    label: "Developer",
    icon: "⚡",
    desc: "Sell 3D models and AR/VR builds. Earn 85% commission on every sale.",
    color: "#5B4BDB",
    bg: "rgba(91, 75, 219, 0.08)",
    approvalNote: "⚡ Instant activation — complete profile after signup",
  },
  {
    id: "mentor",
    label: "Mentor",
    icon: "🧑‍🏫",
    desc: "Host free live workshops and paid 1-on-1 sessions. Set your own rates.",
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.08)",
    approvalNote: "🔍 Requires admin review — role locked until approved",
  },
];

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [step, setStep] = useState<"role" | "details">("role");
  const [selectedRole, setSelectedRole] = useState<string>(
    ROLES.find(r => r.id === roleParam)?.id ?? "user"
  );
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#10b981", "#06b6d4"][strength];

  const roleInfo = ROLES.find(r => r.id === selectedRole)!;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim())          { setError("Please enter your name."); return; }
    if (password.length < 6)   { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm)  { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name.trim(), photoURL: "/avatar.png" });

      // ── CRITICAL: mentor & developer are ALWAYS saved as role:"user" at signup ──
      // Their actual role only activates after they complete the apply flow:
      //   developer → /join/developer  (instant on form submit)
      //   mentor    → /join/mentor     (pending until admin approves)
      const savedRole = (selectedRole === "mentor" || selectedRole === "developer")
        ? "user"
        : selectedRole;

      await setDoc(doc(db, "users", cred.user.uid), {
        userId:            cred.user.uid,
        displayName:       name.trim(),
        email:             email.trim().toLowerCase(),
        role:              savedRole,          // never "mentor" or "developer" at signup
        intendedRole:      selectedRole,       // remember what they wanted — used to pre-select on join page
        photoURL:          "/avatar.png",
        certified:         false,
        profileCompletion: 20,
        stats:             { views: 0, downloads: 0, collaborations: 0, rating: 0, reviews: 0 },
        badges:            ["MEMBER"],
        joinedAt:          serverTimestamp(),
        createdAt:         serverTimestamp(),
      });

      // ── Redirect based on intended role ──
      if (selectedRole === "developer") router.push("/join/developer");
      else if (selectedRole === "mentor")  router.push("/join/mentor");
      else if (selectedRole === "learner") router.push("/join/learner");
      else router.push("/dashboard");

    } catch (err: any) {
      const map: Record<string, string> = {
        "auth/email-already-in-use":    "Email already in use.",
        "auth/invalid-email":           "Invalid email address.",
        "auth/weak-password":           "Password too weak.",
        "auth/network-request-failed":  "Network error.",
      };
      setError(map[err.code] ?? err.message);
    }
    setLoading(false);
  };

  const EyeIcon = ({ open }: { open: boolean }) => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {open ? (
        <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></>
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
      )}
    </svg>
  );

  return (
    <main className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4 py-16 font-sans">
      <div className="w-full max-w-5xl">

        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#5B4BDB] flex items-center justify-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>
              </svg>
            </div>
            <span className="font-black text-2xl text-white">SYNTHÉ</span>
          </Link>
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: ROLE PICKER ── */}
          {step === "role" && (
            <motion.div key="role" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="text-center mb-10">
                <h1 className="text-4xl font-black text-white mb-3">Join SYNTHÉ</h1>
                <p className="text-gray-500 text-base">Pick your role — you can upgrade anytime after joining.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {ROLES.map((role) => (
                  <button key={role.id} onClick={() => setSelectedRole(role.id)}
                    className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                      selectedRole === role.id
                        ? "shadow-[0_4px_30px_rgba(0,0,0,0.5)] scale-[1.02]"
                        : "bg-[#141420] border-[#2A2A3E] hover:border-[#5B4BDB]/40 hover:shadow-[0_8px_30px_rgba(91,75,219,0.15)]"
                    }`}
                    style={selectedRole === role.id ? { borderColor: role.color, background: role.bg } : {}}>

                    {selectedRole === role.id && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: role.color }}>
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    )}

                    <div className="text-4xl mb-4">{role.icon}</div>
                    <p className="font-black text-white text-base mb-1">{role.label}</p>
                    <p className="text-xs text-[#9494AD] leading-relaxed mb-3">{role.desc}</p>

                    {/* Approval note */}
                    {role.approvalNote && (
                      <div className={`text-[10px] font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                        role.approvalNote.startsWith("🔍")
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {role.approvalNote}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Role comparison table */}
              <div className="bg-[#141420] border border-[#2A2A3E] rounded-2xl overflow-hidden mb-8 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                <div className="grid grid-cols-5 text-xs font-bold text-[#6B6B85] uppercase tracking-wide px-6 py-3 border-b border-[#2A2A3E] bg-[#0A0A0F]/80">
                  <div>Feature</div>
                  <div className="text-center text-white">User</div>
                  <div className="text-center text-blue-400">Learner</div>
                  <div className="text-center text-[#7C6EF6]">Developer</div>
                  <div className="text-center text-teal-400">Mentor</div>
                </div>
                {[
                  ["Browse gallery",          true,  true,  true,  true ],
                  ["Attend free workshops",   false, true,  false, true ],
                  ["AI learning roadmap",     false, true,  false, false],
                  ["Book 1-on-1 mentors",     false, true,  false, false],
                  ["Upload & sell 3D models", false, false, true,  false],
                  ["Host live workshops",     false, false, false, true ],
                  ["Earn 85% commission",     false, false, true,  true ],
                  ["Set your own rates",      false, false, true,  true ],
                  ["Verified role badge",     false, true,  true,  true ],
                ].map(([label, u, l, d, m]) => (
                  <div key={label as string} className="grid grid-cols-5 px-6 py-3 border-b border-[#2A2A3E]/50 hover:bg-[#2A2A3E]/30 transition-colors">
                    <div className="text-sm text-[#9494AD] font-medium">{label as string}</div>
                    {[u, l, d, m].map((v, i) => (
                      <div key={i} className="flex justify-center">
                        {v ? <span className="text-emerald-400 font-black tracking-widest text-[#7C6EF6]">✓</span> : <span className="text-[#3A3A52]">—</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Mentor warning banner */}
              {selectedRole === "mentor" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 mb-4 flex items-start gap-3 glass-synthe">
                  <span className="text-amber-500 text-lg mt-0.5">🔍</span>
                  <div>
                    <p className="text-sm font-black text-amber-500 mb-1">Mentor role requires admin approval</p>
                    <p className="text-xs text-amber-500/80 leading-relaxed">
                      After creating your account, you'll complete a mentor application (min 2 certificates, bio, LinkedIn).
                      Your account will be created as a regular user — <span className="font-bold text-amber-400">mentor access only activates after an admin reviews and approves your application</span>.
                    </p>
                  </div>
                </motion.div>
              )}

              <button onClick={() => setStep("details")}
                className="w-full py-4 rounded-2xl font-black text-white text-base transition-all hover:opacity-90 active:scale-[0.99]"
                style={{ background: roleInfo.color }}>
                Continue as {roleInfo.label} →
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                Already have an account?{" "}
                <Link href="/login" className="font-black text-[#5B4BDB] hover:underline">Sign in</Link>
              </p>
            </motion.div>
          )}

          {/* ── STEP 2: DETAILS FORM ── */}
          {step === "details" && (
            <motion.div key="details" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="max-w-md mx-auto">

              <button onClick={() => setStep("role")} className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8 transition-colors">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Back to role selection
              </button>

              {/* Selected role badge */}
              <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl border" style={{ background: roleInfo.bg, borderColor: roleInfo.color + "33" }}>
                <span className="text-2xl">{roleInfo.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: roleInfo.color }}>Joining as</p>
                  <p className="font-black text-white">{roleInfo.label}</p>
                  {roleInfo.approvalNote && (
                    <p className={`text-[10px] font-bold mt-0.5 ${roleInfo.approvalNote.startsWith("🔍") ? "text-amber-600" : "text-green-600"}`}>
                      {roleInfo.approvalNote}
                    </p>
                  )}
                </div>
                <button onClick={() => setStep("role")} className="text-xs font-bold underline" style={{ color: roleInfo.color }}>
                  Change
                </button>
              </div>

              {/* Mentor notice in details step */}
              {selectedRole === "mentor" && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 mb-6 text-xs text-amber-500/80 leading-relaxed">
                  <span className="font-bold text-amber-500">Note:</span> Account will be created as a regular user. After signup you'll fill out the mentor application — role activates only after admin approval.
                </div>
              )}

              <h1 className="text-3xl font-black text-white mb-8">Create your account</h1>

              <div className="bg-[#141420] rounded-2xl border border-[#2A2A3E] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                <form onSubmit={handleSignup} className="space-y-5">

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#6B6B85] uppercase tracking-wide mb-2">Full name</label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B85]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required
                        className="w-full bg-[#0A0A0F] border border-[#2A2A3E] focus:border-[#5B4BDB] focus:bg-[#0A0A0F] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#4A4A60] outline-none transition-all shadow-inner" />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-[#6B6B85] uppercase tracking-wide mb-2">Email</label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B85]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                      <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required
                        className="w-full bg-[#0A0A0F] border border-[#2A2A3E] focus:border-[#5B4BDB] focus:bg-[#0A0A0F] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#4A4A60] outline-none transition-all shadow-inner" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-[#6B6B85] uppercase tracking-wide mb-2">Password</label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B85]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                      <input type={showPass ? "text" : "password"} placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required
                        className="w-full bg-[#0A0A0F] border border-[#2A2A3E] focus:border-[#5B4BDB] focus:bg-[#0A0A0F] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-[#4A4A60] outline-none transition-all shadow-inner" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6B85] hover:text-[#7C6EF6]">
                        <EyeIcon open={showPass} />
                      </button>
                    </div>
                    {password.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1,2,3,4].map(i => (
                            <div key={i} className="flex-1 h-1.5 rounded-full bg-[#2A2A3E] overflow-hidden">
                              <div className="h-full transition-all" style={{ width: i <= strength ? "100%" : "0%", background: strengthColor }} />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs font-bold" style={{ color: strengthColor }}>{strengthLabel}</p>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="block text-xs font-bold text-[#6B6B85] uppercase tracking-wide mb-2">Confirm password</label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B85]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <input type={showConf ? "text" : "password"} placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                        className={`w-full bg-[#0A0A0F] border focus:bg-[#0A0A0F] shadow-inner rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-[#4A4A60] outline-none transition-all ${
                          confirm && confirm !== password ? "border-red-500/50 bg-red-500/10" :
                          confirm && confirm === password ? "border-emerald-500/50 bg-emerald-500/10" :
                          "border-[#2A2A3E] focus:border-[#5B4BDB]"
                        }`} />
                      <button type="button" onClick={() => setShowConf(!showConf)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6B85] hover:text-[#7C6EF6]">
                        <EyeIcon open={showConf} />
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-4 rounded-xl font-black text-white text-sm transition-all hover:opacity-90 disabled:opacity-50 mt-2"
                    style={{ background: roleInfo.color }}>
                    {loading ? "Creating account..." : `Create account →`}
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link href="/login" className="font-black text-[#5B4BDB] hover:underline">Sign in</Link>
                  </p>
                </form>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center"><div className="w-10 h-10 border-4 border-gray-200 border-t-[#5B4BDB] rounded-full animate-spin" /></div>}>
      <SignupContent />
    </Suspense>
  );
}