"use client";

import { uploadToCloudinary } from "../../lib/cloudinary";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function Profile() {
  const router = useRouter();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [portfolio, setPortfolio] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const data: any = snap.data();
        setProfile(data);
        setName(data.name || ""); setBio(data.bio || ""); setPortfolio(data.portfolio || "");
      }
    });
    return () => unsub();
  }, []);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    let imageUrl = profile.profileImage;
    if (image) imageUrl = await uploadToCloudinary(image);
    await updateDoc(doc(db, "users", user.uid), { name, bio, portfolio, profileImage: imageUrl });
    setProfile((p: any) => ({ ...p, name, bio, portfolio, profileImage: imageUrl }));
    setSaving(false);
    setEditing(false);
  };

  const applyCertification = async () => {
    if (!user) return;
    await addDoc(collection(db, "certificationRequests"), {
      userId: user.uid, name: profile.name, email: profile.email,
      createdAt: new Date(), status: "pending",
    });
    alert("Certification request submitted!");
  };

  const inputClass = "w-full bg-white/[0.03] border border-white/8 text-white placeholder-white/25 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-violet-500/50 focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition duration-200";

  const roleBadge: Record<string, { label: string; cls: string }> = {
    developer: { label: "Developer", cls: "text-violet-300 bg-violet-500/10 border-violet-500/20" },
    admin: { label: "Admin", cls: "text-rose-300 bg-rose-500/10 border-rose-500/20" },
    user: { label: "Member", cls: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20" },
  };

  if (!profile) return (
    <main className="min-h-screen bg-[#050008] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
        <p className="text-white/30 text-sm">Loading profile...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#050008] px-4 py-28 relative overflow-hidden">

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)", filter: "blur(100px)" }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)", filter: "blur(80px)" }} />

      <div className="relative z-10 max-w-2xl mx-auto">

        {/* Profile header card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative rounded-3xl overflow-hidden border border-white/6 bg-white/[0.025] backdrop-blur-xl mb-5 p-8"
        >
          <div className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.4), rgba(34,211,238,0.3), transparent)" }} />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 flex-shrink-0">
              <div className="relative group">
                <div className="absolute -inset-[2px] rounded-full blur-[5px] opacity-60"
                  style={{ background: "linear-gradient(135deg, #a78bfa, #22d3ee)" }} />
                <img
                  src={preview || profile.profileImage || "/avatar.png"}
                  className="relative w-24 h-24 rounded-full object-cover border-2 border-black/30"
                  alt={profile.name}
                />
                {editing && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                )}
              </div>
              {editing && (
                <label className="cursor-pointer text-xs font-semibold border border-violet-500/25 bg-violet-500/8 text-violet-300 px-3 py-1.5 rounded-xl hover:bg-violet-500/15 transition duration-200">
                  Upload Photo
                  <input type="file" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setImage(f); setPreview(URL.createObjectURL(f)); }
                  }} />
                </label>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-black text-white tracking-tight mb-3">{profile.name}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {profile.role && roleBadge[profile.role] && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border capitalize ${roleBadge[profile.role].cls}`}>
                    {roleBadge[profile.role].label}
                  </span>
                )}
                {profile.certified && (
                  <span className="text-xs font-bold text-yellow-300 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 rounded-full">
                    ⭐ Synthé Certified
                  </span>
                )}
              </div>
              {profile.email && (
                <p className="text-white/30 text-sm mt-3">{profile.email}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Profile info / edit */}
        <AnimatePresence mode="wait">
          {!editing ? (
            <motion.div key="view"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-3xl overflow-hidden border border-white/6 bg-white/[0.025] backdrop-blur-xl p-8 mb-5"
            >
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/4" />
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-white/25 mb-6">Profile Info</h3>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-2">Bio</p>
                  <p className="text-white/55 text-sm leading-relaxed">
                    {profile.bio || <span className="text-white/20 italic">No bio added yet</span>}
                  </p>
                </div>
                <div className="h-[1px] bg-white/5" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-2">Portfolio</p>
                  {profile.portfolio
                    ? <a href={profile.portfolio} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-violet-400 text-sm hover:text-violet-300 transition duration-200">
                        Visit Portfolio
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    : <p className="text-white/20 text-sm italic">Not added</p>
                  }
                </div>
              </div>

              <button
                onClick={() => setEditing(true)}
                className="mt-8 flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white/50 border border-white/8 rounded-xl hover:border-violet-500/35 hover:text-violet-300 hover:bg-violet-500/5 transition duration-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>
            </motion.div>

          ) : (

            <motion.div key="edit"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-3xl overflow-hidden border border-violet-500/20 bg-white/[0.025] backdrop-blur-xl p-8 mb-5"
            >
              <div className="absolute top-0 left-0 right-0 h-[1px]"
                style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)" }} />
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-violet-400/60 mb-6">Edit Profile</h3>

              <div className="flex flex-col gap-5">
                {[
                  { label: "Name", val: name, set: setName, placeholder: "Your name", type: "input" },
                  { label: "Bio", val: bio, set: setBio, placeholder: "Tell the community about yourself...", type: "textarea" },
                  { label: "Portfolio Link", val: portfolio, set: setPortfolio, placeholder: "https://yourportfolio.com", type: "input" },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">{f.label}</label>
                    {f.type === "textarea"
                      ? <textarea value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} rows={4} className={inputClass + " resize-none"} />
                      : <input value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} className={inputClass} />
                    }
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <motion.button
                    onClick={saveProfile}
                    disabled={saving}
                    whileHover={{ scale: saving ? 1 : 1.02 }}
                    whileTap={{ scale: saving ? 1 : 0.98 }}
                    style={{ willChange: "transform", background: saving ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #7c3aed, #0891b2)" }}
                    className="flex-1 py-3.5 text-sm font-black text-white rounded-2xl overflow-hidden disabled:opacity-50 relative"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {saving ? <><svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Saving...</> : <>Save Changes <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></>}
                    </span>
                  </motion.button>
                  <button onClick={() => setEditing(false)}
                    className="px-5 py-3.5 text-sm font-semibold text-white/40 border border-white/8 rounded-2xl hover:border-white/20 hover:text-white/60 transition duration-200">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col gap-3"
        >
          {profile.role === "user" && (
            <motion.button
              onClick={() => router.push("/join/developer")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ willChange: "transform", background: "linear-gradient(135deg, #7c3aed, #db2777)" }}
              className="w-full px-6 py-4 text-sm font-black text-white rounded-2xl flex items-center justify-center gap-2 relative overflow-hidden"
            >
              <motion.div animate={{ x: ["-200%", "200%"] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "linear" }}
                style={{ willChange: "transform", position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)", transform: "skewX(-20deg)", pointerEvents: "none" }} />
              <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="relative z-10">Become a Developer</span>
            </motion.button>
          )}

          {profile.role === "developer" && !profile.certified && (
            <button
              onClick={applyCertification}
              className="w-full px-6 py-4 text-sm font-black text-yellow-300 border border-yellow-400/25 bg-yellow-400/5 rounded-2xl hover:bg-yellow-400/10 hover:border-yellow-400/40 transition duration-200 flex items-center justify-center gap-2"
            >
              ⭐ Apply for Synthé Certification
            </button>
          )}

          {profile.role === "admin" && (
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full px-6 py-4 text-sm font-black text-rose-300 border border-rose-500/25 bg-rose-500/5 rounded-2xl hover:bg-rose-500/10 hover:border-rose-400/40 transition duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Open Admin Dashboard
            </button>
          )}
        </motion.div>

      </div>
    </main>
  );
}