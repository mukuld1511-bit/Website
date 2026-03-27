"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../lib/firebase";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setSent(true);
    } catch (err: any) {
      const map: Record<string, string> = {
        "auth/user-not-found":         "No account found with this email.",
        "auth/invalid-email":          "Invalid email address.",
        "auth/network-request-failed": "Network error. Check your connection.",
        "auth/too-many-requests":      "Too many attempts. Try again later.",
      };
      setError(map[err.code] ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4 py-16 font-sans">
      <div className="w-full max-w-md">

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

          {/* ── Sent state ── */}
          {sent ? (
            <motion.div key="sent" initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl border border-gray-200 shadow-xl p-10 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring" }}
                className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </motion.div>
              <h2 className="text-2xl font-black text-white mb-2">Check your email</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-2">
                We sent a password reset link to
              </p>
              <p className="font-black text-[#5B4BDB] text-sm mb-6 break-all">{email}</p>
              <p className="text-xs text-gray-400 mb-8 leading-relaxed">
                Didn't receive it? Check your spam folder, or wait a minute and try again.
              </p>
              <div className="space-y-3">
                <button onClick={() => { setSent(false); setEmail(""); }}
                  className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-[#0A0A0F] transition">
                  Try a different email
                </button>
                <Link href="/login">
                  <button className="w-full py-3 rounded-xl bg-[#5B4BDB] text-white font-black text-sm hover:opacity-90 transition">
                    Back to Sign in →
                  </button>
                </Link>
              </div>
            </motion.div>

          ) : (

            /* ── Form state ── */
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-white mb-2">Forgot password?</h1>
                <p className="text-gray-500 text-sm">Enter your email and we'll send you a reset link.</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                <form onSubmit={handleSubmit} className="space-y-5">

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

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Email address</label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                        placeholder="you@example.com" autoFocus
                        className="w-full bg-[#0A0A0F] border border-gray-200 focus:border-[#5B4BDB] focus:bg-white rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-400 outline-none transition-all" />
                    </div>
                  </div>

                  <button type="submit" disabled={loading || !email.trim()}
                    className="w-full py-3.5 rounded-xl font-black text-white text-sm bg-[#5B4BDB] hover:opacity-90 transition disabled:opacity-50">
                    {loading ? "Sending…" : "Send reset link →"}
                  </button>

                  <Link href="/login">
                    <button type="button" className="w-full py-3 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-[#0A0A0F] transition flex items-center justify-center gap-2">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                      </svg>
                      Back to Sign in
                    </button>
                  </Link>

                </form>
              </div>

              <p className="text-center text-xs text-gray-400 mt-6">
                Don't have an account?{" "}
                <Link href="/signup" className="font-bold text-[#5B4BDB] hover:underline">Sign up free</Link>
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}