"use client";

import { useState, Suspense } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export const dynamic = "force-dynamic";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<"user" | "developer">(
    roleParam === "developer" ? "developer" : "user"
  );
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Password strength
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
  const strengthColor = ["", "#ef4444", "#f59e0b", "#10b981", "#06b6d4"][strength]; // red, amber, emerald, cyan

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Please enter your full name."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

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
        userId: user.uid,
        name: name.trim(),
        displayName: name.trim(),
        email: email.trim().toLowerCase(),
        role: role,
        profileImage: "/avatar.png",
        photoURL: "/avatar.png",
        certified: false,
        createdAt: serverTimestamp(),
      });

      // ✅ Route based on selected role
      if (role === "developer") {
        router.push("/join/developer");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      const map: Record<string, string> = {
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Password is too weak. Use at least 6 characters.",
        "auth/network-request-failed": "Network error. Check your connection.",
      };
      setError(map[err.code] ?? err.message ?? "Sign up failed. Please try again.");
    }
    setLoading(false);
  };

  const inputCls = "w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition duration-200 shadow-sm";

  const EyeIcon = ({ open }: { open: boolean }) => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-24 relative overflow-hidden font-sans">
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
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 shadow-sm shadow-blue-500/30">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 5h16l-6 7 6 7H4l6-7-6-7z" />
                </svg>
              </div>
              <span className="font-extrabold text-2xl text-gray-900 tracking-tight">Synthé</span>
            </div>
          </Link>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 leading-none mb-3">
            Create your account
          </h1>
          <p className="text-gray-500 font-medium text-sm">Join the SYNTHÉ community for free.</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
          <form onSubmit={handleSignup} className="p-8 flex flex-col gap-6">

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 overflow-hidden text-red-700 font-semibold"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input type="text" placeholder="Mukul Sharma" value={name}
                  onChange={(e) => setName(e.target.value)} required className={inputCls + " pl-11"} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input type="email" placeholder="you@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required className={inputCls + " pl-11"} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input type={showPass ? "text" : "password"} placeholder="Min. 6 characters" value={password}
                  onChange={(e) => setPassword(e.target.value)} required className={inputCls + " pl-11 pr-12"} />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition duration-200">
                  <EyeIcon open={showPass} />
                </button>
              </div>
              {password.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                  <div className="flex gap-1.5 mb-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
                        <motion.div animate={{ width: i <= strength ? "100%" : "0%" }} transition={{ duration: 0.3 }}
                          className="h-full rounded-full" style={{ background: strengthColor }} />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: strengthColor }}>{strengthLabel}</p>
                </motion.div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Confirm Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    (confirm && confirm !== password ? " border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20" : "") +
                    (confirm && confirm === password ? " border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-500/20" : "")
                  }
                />
                <button type="button" onClick={() => setShowConf((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition duration-200">
                  <EyeIcon open={showConf} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-4 text-sm font-bold text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-sm transition-all bg-blue-600 hover:bg-blue-700"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </motion.button>

            <p className="text-center text-gray-500 font-medium text-sm mt-2">
              Already have an account?{" "}
              <Link href="/login">
                <span className="font-bold cursor-pointer text-blue-600 hover:text-blue-700 transition-colors duration-200">
                  Sign In
                </span>
              </Link>
            </p>

          </form>
        </div>
      </motion.div>
    </main>
  );
}

// Ensure suspense boundary is present
export default function Signup() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans"><span className="w-10 h-10 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></span></div>}>
      <SignupContent />
    </Suspense>
  );
}