 
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
 
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
 
    if (!name.trim()) { setError("Please enter your name."); return; }
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
 
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        displayName: name.trim(),
        email: email.trim().toLowerCase(),
        role: role,
        photoURL: "/avatar.png",
        certified: false,
        
        // Profile completeness tracking
        profileCompletion: 20,
        
        // User stats
        stats: {
          views: 0,
          downloads: 0,
          collaborations: 0,
          rating: 0,
          reviews: 0,
        },
        
        // Achievements/Badges
        badges: ["MEMBER"],
        
        // Account metadata
        joinedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
 
      router.push(role === "developer" ? "/join/developer" : "/dashboard");
    } catch (err: any) {
      const map: Record<string, string> = {
        "auth/email-already-in-use": "Email already in use.",
        "auth/invalid-email": "Invalid email address.",
        "auth/weak-password": "Password too weak.",
        "auth/network-request-failed": "Network error.",
      };
      setError(map[err.code] ?? err.message);
    }
    setLoading(false);
  };
 
  const inputCls = "w-full bg-white border-2 border-indigo-100 text-gray-900 placeholder-gray-400 font-bold text-base rounded-2xl pl-12 pr-5 py-4 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition shadow-sm";
 
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
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex items-center justify-center px-4 py-24 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0" />
 
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link href="/">
            <div className="inline-flex items-center gap-3 mb-7 cursor-pointer">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#5B4BDB] shadow-lg">
                <span className="text-xl font-black text-white">S</span>
              </div>
              <span className="font-black text-3xl text-gray-900">Synthé</span>
            </div>
          </Link>
          <h1 className="text-5xl font-black text-gray-900 mb-3">Create Account</h1>
          <p className="text-gray-500 font-bold">Join 5,000+ creators today</p>
        </div>
 
        <div className="rounded-3xl border-4 border-indigo-50 bg-white/80 backdrop-blur-md shadow-2xl p-10">
          <form onSubmit={handleSignup} className="space-y-6">
 
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 font-semibold"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
 
            <div>
              <label className="block text-xs font-black text-indigo-400 uppercase mb-2">Full Name</label>
              <div className="relative">
                <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
              </div>
            </div>
 
            <div>
              <label className="block text-xs font-black text-indigo-400 uppercase mb-2">Email</label>
              <div className="relative">
                <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
              </div>
            </div>
 
            <div>
              <label className="block text-xs font-black text-indigo-400 uppercase mb-2">Password</label>
              <div className="relative">
                <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input type={showPass ? "text" : "password"} placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputCls + " pr-12"} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition">
                  <EyeIcon open={showPass} />
                </button>
              </div>
              {password.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <motion.div animate={{ width: i <= strength ? "100%" : "0%" }} className="h-full" style={{ background: strengthColor }} />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-black uppercase" style={{ color: strengthColor }}>{strengthLabel}</p>
                </motion.div>
              )}
            </div>
 
            <div>
              <label className="block text-xs font-black text-indigo-400 uppercase mb-2">Confirm Password</label>
              <div className="relative">
                <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <input
                  type={showConf ? "text" : "password"}
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className={
                    inputCls + " pr-12" +
                    (confirm && confirm !== password ? " !border-red-300 !bg-red-50" : "") +
                    (confirm && confirm === password ? " !border-green-300 !bg-green-50" : "")
                  }
                />
                <button type="button" onClick={() => setShowConf(!showConf)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">
                  <EyeIcon open={showConf} />
                </button>
              </div>
            </div>
 
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-lg hover:shadow-xl disabled:opacity-50 transition-all mt-6"
            >
              {loading ? "Creating..." : "Create Account 🚀"}
            </motion.button>
 
            <p className="text-center text-gray-600 font-medium text-sm">
              Already have account?{" "}
              <Link href="/login" className="text-indigo-600 font-black hover:text-pink-500 transition">
                Sign In
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
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" /></div>}>
      <SignupContent />
    </Suspense>
  );
}