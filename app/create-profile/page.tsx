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

  const inputClass = "w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition duration-200";

  const fields = [
    { label: "Your Name", placeholder: "e.g. Mukul Sharma", value: name, set: setName, icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", type: "input" },
    { label: "Short Bio", placeholder: "Tell the community about yourself...", value: bio, set: setBio, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", type: "textarea" },
    { label: "Skills", placeholder: "Unity, Blender, AR, VR, WebXR...", value: skills, set: setSkills, icon: "M13 10V3L4 14h7v7l9-11h-7z", hint: "Separate with commas", type: "input" },
  ];

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-24 relative overflow-hidden font-sans">      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg mt-12"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 mb-6 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-blue-700 text-xs font-bold uppercase tracking-widest">Developer Profile</span>
          </motion.div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 leading-none mb-3">
            Create Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Profile
            </span>
          </h1>
          <p className="text-gray-500 text-sm font-medium">Set up your developer identity on SYNTHÉ.</p>
        </div>

        {/* Card */}
        <div className="relative rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-sm p-8">
          
          <form onSubmit={handleSave} className="flex flex-col gap-6">

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50"
              >
                <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 font-bold text-sm">{error}</p>
              </motion.div>
            )}

            {fields.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
              >
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{f.label}</label>
                <div className="relative group">
                  <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-600 transition duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                    </svg>
                  </div>
                  {f.type === "textarea" ? (
                    <textarea
                      placeholder={f.placeholder}
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      rows={4}
                      className={inputClass + " pl-12 resize-none"}
                    />
                  ) : (
                    <input
                      placeholder={f.placeholder}
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      className={inputClass + " pl-12"}
                    />
                  )}
                </div>
                {f.hint && <p className="text-gray-400 font-medium text-[10px] tracking-widest uppercase mt-1.5 pl-1">{f.hint}</p>}
              </motion.div>
            ))}

            <motion.button
              type="submit"
              disabled={loading || !name}
              className="relative w-full py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-sm transition"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Saving...</>
                ) : (
                  <>Save Profile <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>
                )}
              </span>
            </motion.button>

            <p className="text-center text-gray-500 font-medium text-sm mt-2">
              Already have a profile?{" "}
              <Link href="/profile"><span className="text-blue-600 font-bold hover:text-blue-700 hover:underline cursor-pointer transition duration-200">View it here</span></Link>
            </p>
          </form>
        </div>
      </motion.div>
    </main>
  );
}