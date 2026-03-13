"use client";

import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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
    if (image) {
      try {
        const safeName = image.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const avatarPath = `${user.uid}/${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(avatarPath, image, { cacheControl: "3600", upsert: true });
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
          imageUrl = publicUrl;
        }
      } catch { /* keep existing image on error */ }
    }
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

  const inputClass = "w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition duration-200";

  const roleBadge: Record<string, { label: string; cls: string }> = {
    developer: { label: "Developer", cls: "text-violet-700 bg-violet-50 border-violet-200" },
    admin: { label: "Admin", cls: "text-rose-700 bg-rose-50 border-rose-200" },
    user: { label: "Member", cls: "text-cyan-700 bg-cyan-50 border-cyan-200" },
  };

  if (!profile) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
        <p className="text-gray-500 font-bold text-sm tracking-widest uppercase">Loading profile...</p>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 relative pt-28 pb-24 px-4 overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto">

          {/* Profile header card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="rounded-3xl border border-gray-200 bg-white shadow-sm p-8 mb-6"
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

              {/* Avatar */}
              <div className="flex flex-col items-center gap-3 flex-shrink-0">
                <div className="relative group">
                  <img
                    src={preview || profile.profileImage || "/avatar.png"}
                    className="relative w-24 h-24 rounded-full object-cover border border-gray-200 shadow-sm"
                    alt={profile.name}
                  />
                  {editing && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center cursor-pointer">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                {editing && (
                  <label className="cursor-pointer text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition shadow-sm">
                    Upload Photo
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) { setImage(f); setPreview(URL.createObjectURL(f)); }
                    }} />
                  </label>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">{profile.name}</h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {profile.role && roleBadge[profile.role] && (
                    <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border shadow-sm ${roleBadge[profile.role].cls}`}>
                      {roleBadge[profile.role].label}
                    </span>
                  )}
                  {profile.certified && (
                    <span className="text-[10px] font-black tracking-widest uppercase text-yellow-800 bg-yellow-100 border border-yellow-200 px-3 py-1 rounded-full shadow-sm">
                      ⭐ Certified
                    </span>
                  )}
                </div>
                {profile.email && (
                  <p className="text-gray-500 font-medium text-sm mt-3">{profile.email}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Profile info / edit */}
          <AnimatePresence mode="wait">
            {!editing ? (
              <motion.div key="view"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
                className="rounded-3xl border border-gray-200 bg-white p-8 mb-6 shadow-sm"
              >
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Profile Details</h3>

                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Bio</p>
                    <p className="text-gray-700 text-sm font-medium leading-relaxed">
                      {profile.bio || <span className="text-gray-400 italic font-normal">No bio added yet</span>}
                    </p>
                  </div>
                  <div className="h-[1px] bg-gray-100" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Portfolio</p>
                    {profile.portfolio
                      ? <a href={profile.portfolio} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-600 font-bold text-sm hover:text-blue-700 hover:underline transition">
                          Visit Portfolio
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      : <p className="text-gray-400 text-sm italic">Not added</p>
                    }
                  </div>
                </div>

                <div className="mt-8 border-t border-gray-100 pt-6">
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-gray-700 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 shadow-sm transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                </div>
              </motion.div>

            ) : (

              <motion.div key="edit"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
                className="rounded-3xl border border-blue-200 bg-blue-50/50 p-8 mb-6 shadow-sm"
              >
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-6">Edit Profile</h3>

                <div className="flex flex-col gap-5">
                  {[
                    { label: "Name", val: name, set: setName, placeholder: "Your name", type: "input" },
                    { label: "Bio", val: bio, set: setBio, placeholder: "Tell the community about yourself...", type: "textarea" },
                    { label: "Portfolio Link", val: portfolio, set: setPortfolio, placeholder: "https://yourportfolio.com", type: "input" },
                  ].map((f, i) => (
                    <div key={i}>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">{f.label}</label>
                      {f.type === "textarea"
                        ? <textarea value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} rows={4} className={inputClass + " resize-none"} />
                        : <input value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} className={inputClass} />
                      }
                    </div>
                  ))}

                  <div className="flex gap-3 pt-4 border-t border-blue-100 mt-2">
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="px-8 py-3.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm disabled:opacity-50 transition flex items-center gap-2"
                    >
                      {saving ? (
                        <><svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Saving...</>
                      ) : (
                        <>Save Changes <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></>
                      )}
                    </button>
                    <button onClick={() => setEditing(false)}
                      className="px-6 py-3.5 text-sm font-bold text-gray-600 border border-gray-300 bg-white rounded-xl hover:bg-gray-50 shadow-sm transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-col gap-3">
            {profile.role === "user" && (
              <button
                onClick={() => router.push("/join/developer")}
                className="w-full px-6 py-4 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Become a Developer
              </button>
            )}

            {profile.role === "developer" && !profile.certified && (
              <button
                onClick={applyCertification}
                className="w-full px-6 py-4 text-sm font-bold text-yellow-800 border border-yellow-200 bg-yellow-100 rounded-2xl hover:bg-yellow-200 transition flex items-center justify-center gap-2 shadow-sm"
              >
                ⭐ Apply for Synthé Certification
              </button>
            )}

            {profile.role === "admin" && (
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full px-6 py-4 text-sm font-bold text-white bg-gray-900 border border-gray-800 rounded-2xl hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-sm"
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

      <Footer />
    </div>
  );
}