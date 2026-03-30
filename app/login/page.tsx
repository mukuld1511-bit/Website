"use client";

import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import app from "../../lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Login() {
  const auth = getAuth(app);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      const map: Record<string, string> = {
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password. Try again.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/too-many-requests": "Too many attempts. Please wait a moment.",
      };
      setError(map[err.code] || "Login failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#07060B] flex items-center justify-center px-4 py-24 relative overflow-hidden font-sans">

      {/* ── Animated gradient mesh background ── */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary orb — large, slow drift */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#5B4BDB]/20 blur-[150px] animate-pulse" />
        {/* Secondary orb */}
        <div className="absolute bottom-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#7C6EF6]/12 blur-[120px]" style={{ animationDelay: '2s', animationDuration: '6s' }} />
        {/* Accent orb — warm */}
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-rose-500/6 blur-[100px]" />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        {/* Diagonal accent line */}
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-[#5B4BDB]/20 to-transparent rotate-12 origin-top" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* Logo + heading */}
        <div className="text-center mb-10">
          <Link href="/">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-3 mb-8 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#5B4BDB] shadow-[0_0_30px_rgba(91,75,219,0.4)] border border-[#7C6EF6]/30 group-hover:shadow-[0_0_50px_rgba(91,75,219,0.5)] transition-shadow duration-500">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 5h16l-6 7 6 7H4l6-7-6-7z" />
                </svg>
              </div>
              <span className="font-display font-extrabold text-3xl text-white tracking-tight">
                Synthé
              </span>
            </motion.div>
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.1] mb-3"
          >
            Welcome<br />
            <span className="bg-gradient-to-r from-[#5B4BDB] via-[#7C6EF6] to-[#A594FF] bg-clip-text text-transparent">back.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-[#6B6B85] font-medium text-base"
          >
            Sign in to your SYNTHÉ account
          </motion.p>
        </div>

        {/* ── Glassmorphism card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="rounded-[2.5rem] border border-white/10 bg-[#101015]/40 backdrop-blur-3xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.8)] overflow-hidden relative"
        >
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#5B4BDB]/10 to-transparent opacity-50 pointer-events-none" />
          <form onSubmit={handleLogin} className="p-8 md:p-10 flex flex-col gap-6 relative z-10">

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 font-semibold"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">{error}</p>
              </motion.div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#9494AD] mb-2.5">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B85] group-focus-within:text-[#A594FF] transition duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#1A1A2E]/50 backdrop-blur-md border border-white/5 text-white placeholder-[#4A4A60] font-medium text-sm rounded-2xl pl-12 pr-5 py-4 focus:outline-none focus:border-[#5B4BDB]/50 focus:bg-[#1A1A2E]/80 focus:ring-4 focus:ring-[#5B4BDB]/10 transition duration-300 hover:border-white/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-semibold text-[#9494AD]">Password</label>
                <Link href="/forgot-password">
                  <span className="text-[11px] text-[#6B6B85] font-bold tracking-wider hover:text-[#A594FF] transition duration-300 cursor-pointer">Recover</span>
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B85] group-focus-within:text-[#A594FF] transition duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#1A1A2E]/50 backdrop-blur-md border border-white/5 text-white placeholder-[#4A4A60] font-medium text-sm rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:border-[#5B4BDB]/50 focus:bg-[#1A1A2E]/80 focus:ring-4 focus:ring-[#5B4BDB]/10 transition duration-300 hover:border-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6B85] hover:text-[#A594FF] transition duration-200"
                >
                  {showPass ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] text-white font-bold text-base border-b-[3px] border-[#4438b8] shadow-[0_0_30px_rgba(91,75,219,0.25)] hover:shadow-[0_0_50px_rgba(91,75,219,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-2"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </span>
            </motion.button>

            {/* Separator */}
            <div className="flex items-center gap-4 my-1">
              <div className="flex-1 h-px bg-[#2A2A3E]" />
              <span className="text-[10px] font-bold tracking-widest text-[#4A4A60] uppercase">or</span>
              <div className="flex-1 h-px bg-[#2A2A3E]" />
            </div>

            <p className="text-center text-[#6B6B85] font-medium text-sm">
              Don't have an account?{" "}
              <Link href="/join">
                <span className="font-bold cursor-pointer text-[#7C6EF6] hover:text-[#A594FF] transition-colors duration-300">
                  Join SYNTHÉ →
                </span>
              </Link>
            </p>

          </form>
        </motion.div>

        {/* Bottom subtle branding */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8 text-[11px] text-[#3A3A52] font-medium tracking-wider"
        >
          SYNTHÉ — The AR/VR Creator Platform
        </motion.p>
      </motion.div>
    </main>
  );
}