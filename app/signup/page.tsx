"use client";

import { useState, Suspense } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

function SignupContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const roleParam    = searchParams.get("role");

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [role,     setRole]     = useState<"user" | "developer">(
    roleParam === "developer" ? "developer" : "user"
  );
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  // Password strength
  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8)          s++;
    if (/[A-Z]/.test(password))        s++;
    if (/[0-9]/.test(password))        s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#fb7185", "#fbbf24", "#34d399", "#22d3ee"][strength];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim())         { setError("Please enter your full name."); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm)  { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      await updateProfile(user, {
        displayName: name.trim(),
        photoURL: "/avatar.png",
      });

      // ✅ Save to Firestore with userId field for querying
      await setDoc(doc(db, "users", user.uid), {
        userId:       user.uid,
        name:         name.trim(),
        displayName:  name.trim(),
        email:        email.trim().toLowerCase(),
        role:         role,
        profileImage: "/avatar.png",
        photoURL:     "/avatar.png",
        certified:    false,
        createdAt:    new Date(),
      });

      // ✅ Route based on selected role
      if (role === "developer") {
        router.push("/join/developer");
      } else {
        router.push("/profile");
      }
    } catch (err: any) {
      const map: Record<string, string> = {
        "auth/email-already-in-use":   "An account with this email already exists.",
        "auth/invalid-email":          "Please enter a valid email address.",
        "auth/weak-password":          "Password is too weak. Use at least 6 characters.",
        "auth/network-request-failed": "Network error. Check your connection.",
      };
      setError(map[err.code] ?? err.message ?? "Sign up failed. Please try again.");
    }
    setLoading(false);
  };

  const inputCls =
    "w-full bg-white/[0.03] border border-white/8 text-white placeholder-white/25 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-violet-500/50 focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition duration-200";

  const EyeIcon = ({ open }: { open: boolean }) => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {open ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </>
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      )}
    </svg>
  );

  return (
    <main className="min-h-screen bg-[#050008] flex items-center justify-center px-4 py-24 relative overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.14) 0%, transparent 70%)", filter: "blur(100px)" }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="absolute inset-0 opacity-[0.018] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(167,139,250,1) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo + heading */}
        <div className="text-center mb-10">
          <Link href="/">
            <div className="inline-flex items-center gap-3 mb-7 cursor-pointer">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)" }}>
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 5h16l-6 7 6 7H4l6-7-6-7z" />
                </svg>
              </div>
              <span className="font-black text-xl text-white tracking-tight">Synthé</span>
            </div>
          </Link>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-none mb-3">
            Create your{" "}
            <span style={{ backgroundImage: "linear-gradient(90deg,#a78bfa,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              account
            </span>
          </h1>
          <p className="text-white/35 text-sm">Join the SYNTHÉ community for free.</p>
        </div>

        {/* Card */}
        <div className="relative rounded-3xl overflow-hidden border border-white/6 bg-white/[0.025] backdrop-blur-xl">
          <div className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: "linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.3),transparent)" }} />

          <form onSubmit={handleSignup} className="p-8 flex flex-col gap-5">

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
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

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Full Name</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-violet-400 transition duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input type="text" placeholder="Mukul Sharma" value={name}
                  onChange={(e) => setName(e.target.value)} required className={inputCls + " pl-11"} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-violet-400 transition duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input type="email" placeholder="you@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required className={inputCls + " pl-11"} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-violet-400 transition duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input type={showPass ? "text" : "password"} placeholder="Min. 6 characters" value={password}
                  onChange={(e) => setPassword(e.target.value)} required className={inputCls + " pl-11 pr-12"} />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition duration-200">
                  <EyeIcon open={showPass} />
                </button>
              </div>
              {password.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2.5">
                  <div className="flex gap-1 mb-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-white/8">
                        <motion.div animate={{ width: i <= strength ? "100%" : "0%" }} transition={{ duration: 0.3 }}
                          className="h-full rounded-full" style={{ background: strengthColor }} />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-semibold" style={{ color: strengthColor }}>{strengthLabel}</p>
                </motion.div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Confirm Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-violet-400 transition duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input
                  type={showConf ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className={
                    inputCls + " pl-11 pr-12" +
                    (confirm && confirm !== password ? " border-rose-500/40" : "") +
                    (confirm && confirm === password ? " border-emerald-500/40" : "")
                  }
                />
                <button type="button" onClick={() => setShowConf((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition duration-200">
                  <EyeIcon open={showConf} />
                </button>
                {confirm.length > 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-12 top-1/2 -translate-y-1/2">
                    {confirm === password
                      ? <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      : <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    }
                  </motion.div>
                )}
              </div>
            </div>

            {/* ✅ Role selector — fully clickable */}
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
                I am joining as
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: "user"      as const, label: "👤 User",      desc: "Browse & download models",  color: "#22d3ee" },
                  { val: "developer" as const, label: "⚡ Developer", desc: "Upload & sell models",      color: "#a78bfa" },
                ].map((r) => (
                  <button
                    key={r.val}
                    type="button"
                    onClick={() => setRole(r.val)}
                    className="relative p-4 rounded-2xl border-2 text-center transition duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      borderColor: role === r.val ? r.color : "rgba(255,255,255,0.06)",
                      background:  role === r.val ? `${r.color}12` : "rgba(255,255,255,0.02)",
                      willChange:  "transform",
                    }}
                  >
                    {/* Selected indicator */}
                    {role === r.val && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: r.color }}>
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <p className="text-white font-black text-sm mb-0.5">{r.label}</p>
                    <p className="text-white/30 text-[10px]">{r.desc}</p>
                  </button>
                ))}
              </div>
              <p className="text-white/20 text-xs mt-2">
                {role === "developer"
                  ? "You'll be taken to complete your developer profile after signup."
                  : "You can apply to become a developer later from your profile."}
              </p>
            </div>

            {/* Terms */}
            <p className="text-white/20 text-xs text-center leading-relaxed">
              By creating an account you agree to our{" "}
              <span className="text-violet-400/70 cursor-pointer hover:text-violet-300 transition duration-200">Terms of Service</span>
              {" "}and{" "}
              <span className="text-violet-400/70 cursor-pointer hover:text-violet-300 transition duration-200">Privacy Policy</span>.
            </p>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{
                willChange: "transform",
                background: loading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#7c3aed,#0891b2)",
              }}
              className="relative w-full py-4 text-base font-black text-white rounded-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!loading && (
                <motion.div
                  animate={{ x: ["-200%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "linear" }}
                  style={{ willChange: "transform", position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform: "skewX(-20deg)", pointerEvents: "none" }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Creating account…
                  </>
                ) : (
                  <>
                    {role === "developer" ? "Sign Up as Developer" : "Create Account"}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </motion.button>

            <p className="text-center text-white/25 text-sm">
              Already have an account?{" "}
              <Link href="/login">
                <span className="font-semibold cursor-pointer hover:text-violet-300 transition-colors duration-200" style={{ color: "#a78bfa" }}>
                  Sign in
                </span>
              </Link>
            </p>

          </form>
        </div>
      </motion.div>
    </main>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050008] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" /></div>}>
      <SignupContent />
    </Suspense>
  );
}