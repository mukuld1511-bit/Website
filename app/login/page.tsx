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

  const inputClass = "w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition duration-200 shadow-sm";

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex items-center justify-center px-4 py-24 relative overflow-hidden font-sans">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-[0]" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-[0]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/">
            <div className="inline-flex items-center gap-3 mb-6 cursor-pointer">
              <div className="w-12 h-12 rounded-[1rem] flex items-center justify-center bg-[#5B4BDB] shadow-lg shadow-[#5B4BDB]/30 border-2 border-[#5B4BDB]/50">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 5h16l-6 7 6 7H4l6-7-6-7z" />
                </svg>
              </div>
              <span className="font-black text-3xl text-gray-900 tracking-tight">
                Synthé
              </span>
            </div>
          </Link>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 leading-tight mb-3">
            Welcome back
          </h1>
          <p className="text-gray-500 font-bold text-base">Sign in to your SYNTHÉ account</p>
        </div>

        {/* Card */}
        <div className="rounded-[2.5rem] border-4 border-indigo-50 bg-white/80 backdrop-blur-md shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)]">
          <form onSubmit={handleLogin} className="p-8 md:p-10 flex flex-col gap-6">

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 font-semibold"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">{error}</p>
              </motion.div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-2">Email</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white border-2 border-indigo-100 text-gray-900 placeholder-gray-400 font-bold text-base rounded-2xl pl-12 pr-5 py-4 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition shadow-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-black text-indigo-400 uppercase tracking-widest">Password</label>
                <Link href="/forgot-password">
                  <span className="text-[11px] text-blue-600 font-black tracking-wider uppercase hover:text-blue-700 transition duration-200 cursor-pointer">Forgot password?</span>
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white border-2 border-indigo-100 text-gray-900 placeholder-gray-400 font-bold text-base rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition duration-200"
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
              className="w-full py-5 rounded-3xl bg-blue-600 hover:bg-blue-500 text-white font-black text-lg border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In 🚀
                  </>
                )}
              </span>
            </motion.button>

            <p className="text-center text-gray-600 font-medium text-sm mt-4">
              Don't have an account?{" "}
              <Link href="/join">
                <span className="font-black cursor-pointer text-indigo-500 hover:text-pink-500 transition-colors duration-200">
                  Join SYNTHÉ
                </span>
              </Link>
            </p>

          </form>
        </div>
      </motion.div>
    </main>
  );
}