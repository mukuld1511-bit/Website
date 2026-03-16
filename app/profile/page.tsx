"use client";

import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form States
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("available"); // available, busy, away
  const [hourlyRate, setHourlyRate] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Stats / Analytics Mock
  const [stats] = useState({
    views: 1240,
    downloads: 85,
    collaborations: 12,
    rating: 4.9
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const data: any = snap.data();
        setProfile(data);
        setName(data.name || "");
        setBio(data.bio || "");
        setPortfolio(data.portfolio || "");
        setLocation(data.location || "");
        setAvailability(data.availability || "available");
        setHourlyRate(data.hourlyRate || 0);
        setSkills(data.skills || []);
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
      } catch (e) { console.error(e); }
    }

    const updatedData = {
      name, bio, portfolio, location, availability, hourlyRate, skills,
      profileImage: imageUrl,
      updatedAt: new Date()
    };

    await updateDoc(doc(db, "users", user.uid), updatedData);
    setProfile((p: any) => ({ ...p, ...updatedData }));
    setSaving(false);
    setEditing(false);
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const roleBadge: Record<string, { label: string; cls: string }> = {
    developer: { label: "Professional Creator", cls: "text-[#5B4BDB] bg-[#5B4BDB]/10 border-[#5B4BDB]/20" },
    admin: { label: "System Admin", cls: "text-rose-700 bg-rose-50 border-rose-200" },
    user: { label: "Standard Member", cls: "text-gray-600 bg-gray-100 border-gray-200" },
  };

  if (!profile) return (
    <main className="min-h-screen bg-[#FDFDFF] flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#5B4BDB]/10 border-t-[#5B4BDB] animate-spin" />
        <p className="text-[#5B4BDB] font-extrabold text-xs tracking-widest uppercase">Fetching Profile...</p>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex flex-col font-sans selection:bg-[#5B4BDB]/10">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar / Profile Card */}
            <div className="lg:col-span-4 space-y-6">
              <motion.div 
                initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-10 text-center"
              >
                <div className="relative inline-block mb-6">
                  <img
                    src={preview || profile.profileImage || "/avatar.png"}
                    className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white shadow-xl"
                    alt={profile.name}
                  />
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white shadow-md ${
                    profile.availability === "available" ? "bg-green-500" : profile.availability === "busy" ? "bg-amber-500" : "bg-gray-400"
                  }`} />
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-1">{profile.name}</h2>
                <p className="text-gray-400 text-sm font-bold mb-6">{profile.email}</p>
                
                <div className="flex justify-center mb-8">
                  <span className={`px-4 py-1.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest shadow-sm ${roleBadge[profile.role]?.cls}`}>
                    {roleBadge[profile.role]?.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-8">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Location</p>
                    <p className="text-sm font-extrabold text-gray-800">{profile.location || "Remote"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rate / hr</p>
                    <p className="text-sm font-extrabold text-gray-800">₹{profile.hourlyRate || 0}</p>
                  </div>
                </div>

                {!editing && (
                  <button 
                    onClick={() => setEditing(true)}
                    className="w-full mt-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-black transition shadow-lg"
                  >
                    Edit Profile Details
                  </button>
                )}
              </motion.div>

              {/* Analytics Section */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Performance</h3>
                <div className="space-y-6">
                  {[
                    { label: "Profile Views", val: stats.views, icon: "👁️", color: "text-blue-500" },
                    { label: "Total Downloads", val: stats.downloads, icon: "📥", color: "text-green-500" },
                    { label: "Collaborations", val: stats.collaborations, icon: "🤝", color: "text-[#5B4BDB]" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{s.icon}</span>
                        <span className="text-xs font-bold text-gray-500">{s.label}</span>
                      </div>
                      <span className={`text-lg font-black ${s.color}`}>{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-8">
              
              <AnimatePresence mode="wait">
                {editing ? (
                  <motion.div 
                    initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
                    className="bg-white rounded-[3rem] border-2 border-[#5B4BDB]/10 shadow-xl p-10 md:p-14"
                  >
                    <h3 className="text-2xl font-black text-gray-900 mb-10">Configure Premium Profile</h3>
                    
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Professional Name</label>
                          <input value={name} onChange={e => setName(e.target.value)}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#5B4BDB]/5 focus:border-[#5B4BDB] transition" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Location / Timezone</label>
                          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. New Delhi / IST"
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#5B4BDB]/5 focus:border-[#5B4BDB] transition" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Professional Bio</label>
                        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#5B4BDB]/5 focus:border-[#5B4BDB] transition resize-none" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Availability Status</label>
                          <select value={availability} onChange={e => setAvailability(e.target.value)}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 font-black text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#5B4BDB]/5 focus:border-[#5B4BDB] transition appearance-none">
                            <option value="available">🟢 Available for Work</option>
                            <option value="busy">🟡 Busy with Projects</option>
                            <option value="away">🔴 Away / Unavailable</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Hourly Rate (₹ INR)</label>
                          <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400">₹</span>
                            <input type="number" value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))}
                              className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-12 pr-6 py-4 font-black text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#5B4BDB]/5 focus:border-[#5B4BDB] transition" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Skills & Expertise</label>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {skills.map(s => (
                            <span key={s} className="px-4 py-1.5 bg-[#5B4BDB]/10 text-[#5B4BDB] font-black text-[10px] rounded-xl flex items-center gap-2">
                              {s} <button onClick={() => setSkills(skills.filter(x=>x!==s))} className="hover:text-red-500 transition">✕</button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-4">
                          <input value={skillInput} onChange={e => setSkillInput(e.target.value)} 
                            onKeyDown={e => e.key === "Enter" && handleAddSkill()}
                            placeholder="Add skill (e.g. Unity, CAD, XR)"
                            className="flex-1 bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#5B4BDB]/5 focus:border-[#5B4BDB] transition" />
                          <button onClick={handleAddSkill} className="px-8 py-4 bg-gray-100 rounded-2xl font-black text-sm hover:bg-gray-200 transition">Add</button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Profile Snapshot</label>
                        <div className="flex items-center gap-6">
                           <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                             <img src={preview || profile.profileImage || "/avatar.png"} className="w-full h-full object-cover" />
                             <label className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition">
                               <input type="file" className="hidden" accept="image/*" onChange={e => {
                                 const f = e.target.files?.[0];
                                 if (f) { setImage(f); setPreview(URL.createObjectURL(f)); }
                               }} />
                               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>
                             </label>
                           </div>
                           <p className="text-xs text-gray-400 font-bold max-w-[200px]">Update your display photo. Premium creators with avatars get 40% more visibility.</p>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-10 border-t border-gray-50">
                        <button onClick={saveProfile} disabled={saving}
                          className="px-10 py-5 bg-[#5B4BDB] text-white rounded-[2rem] font-black text-base hover:bg-[#4A39C2] transition shadow-xl disabled:opacity-50">
                          {saving ? "Deploying Changes..." : "Apply Profile Updates"}
                        </button>
                        <button onClick={() => setEditing(false)}
                          className="px-10 py-5 bg-white border border-gray-200 text-gray-500 rounded-[2rem] font-black text-base hover:bg-gray-50 transition">
                          Discard
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                    className="space-y-8"
                  >
                    {/* Bio & Skills Dashboard */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">About Me</h3>
                      <p className="text-gray-800 font-bold text-lg leading-relaxed mb-10">
                        {profile.bio || "No description provided yet. Complete your profile to attract collaborators."}
                      </p>
                      
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills?.length > 0 ? profile.skills.map((s:string) => (
                          <span key={s} className="px-5 py-2 bg-gray-50 text-gray-700 font-black text-xs rounded-2xl border border-gray-100">
                            {s}
                          </span>
                        )) : <p className="text-gray-400 text-sm font-bold italic">No skills listed</p>}
                      </div>
                    </div>

                    {/* Resources & Portfolios */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-[#141414] rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[#5B4BDB]/20 filter blur-3xl rounded-full" />
                          <h4 className="text-xl font-black mb-4 group-hover:text-[#5B4BDB] transition">External Portfolio</h4>
                          <p className="text-gray-500 text-sm font-bold mb-8">View my high-end case studies and live deployments.</p>
                          {profile.portfolio ? (
                            <a href={profile.portfolio} target="_blank" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white text-white hover:text-black rounded-xl font-black text-xs transition">
                              Visit Link <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                            </a>
                          ) : <span className="text-gray-600 font-black text-xs">NO LINK PROVIDED</span>}
                       </div>

                       <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xl font-black text-gray-900 mb-4">Availability</h4>
                            <div className="flex items-center gap-3">
                              <span className={`w-3 h-3 rounded-full ${profile.availability === "available" ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                              <span className="text-gray-800 font-black text-sm uppercase tracking-widest">{profile.availability || "Standard"}</span>
                            </div>
                          </div>
                          {profile.role === "user" ? (
                            <Link href="/join/developer" className="mt-8 px-6 py-4 bg-[#5B4BDB] text-white rounded-2xl font-black text-xs text-center hover:shadow-xl transition shadow-[#5B4BDB]/20">
                              Become Creator
                            </Link>
                          ) : (
                            <p className="mt-8 text-gray-400 text-xs font-bold">Standard Professional Access</p>
                          )}
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}