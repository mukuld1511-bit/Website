"use client";
 
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
 
interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string;
  role: "user" | "developer" | "mentor";
  bio?: string;
  portfolio?: string;
  location?: string;
  hourlyRate?: number;
  skills?: string[];
  rating?: number;
}
 
interface UserStats {
  views: number;
  downloads: number;
  rating: string;
  earnings: number;
}
 
const ACHIEVEMENTS = [
  { icon: "🌟", label: "5-Star Mentor", check: (stats: UserStats, _profile: UserProfile) => parseFloat(stats.rating) >= 4.8 },
  { icon: "🏆", label: "Top Creator", check: (stats: UserStats, _profile: UserProfile) => stats.downloads > 100 },
  { icon: "🚀", label: "Rising Star", check: (stats: UserStats, _profile: UserProfile) => stats.views > 1000 },
  { icon: "💎", label: "Premium Member", check: (_stats: UserStats, profile: UserProfile) => profile.role === "mentor" },
  { icon: "💰", label: "Earned ₹10k+", check: (stats: UserStats, _profile: UserProfile) => stats.earnings > 10000 },
];
 
export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
 
  const [bio, setBio] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [location, setLocation] = useState("");
  const [hourlyRate, setHourlyRate] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
 
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile(data);
        setBio(data.bio || "");
        setPortfolio(data.portfolio || "");
        setLocation(data.location || "");
        setHourlyRate(data.hourlyRate || 0);
        setSkills(data.skills || []);
 
        // Generate mock stats based on role
        setStats({
          views: Math.floor(Math.random() * 5000),
          downloads: Math.floor(Math.random() * 300),
          rating: (Math.random() * 2 + 3).toFixed(1),
          earnings: Math.floor(Math.random() * 100000),
        });
      }
    });
    return () => unsub();
  }, []);
 
  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        bio,
        portfolio,
        location,
        hourlyRate,
        skills,
      });
      setProfile(p => p ? { ...p, bio, portfolio, location, hourlyRate, skills } : null);
      setEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };
 
  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };
 
  if (!profile || !stats) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-blue-600 font-black text-xs uppercase">Loading Profile...</p>
        </div>
      </main>
    );
  }
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col font-sans">
      <Navbar />
 
      <main className="flex-1 pt-32 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* SIDEBAR */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 space-y-6"
            >
              {/* Profile Card */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-8 text-center sticky top-32">
                <div className="relative inline-block mb-6">
                  <img 
                    src={profile.photoURL || "/avatar.png"} 
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-xl" 
                    alt={profile.displayName} 
                  />
                  <span className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white" />
                </div>
 
                <h2 className="text-2xl font-black text-gray-900 mb-1">{profile.displayName}</h2>
                <p className="text-gray-500 text-sm mb-6 font-bold">{profile.email}</p>
 
                <div className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-black text-xs uppercase mb-8">
                  {profile.role === "developer" ? "Creator" : profile.role === "mentor" ? "Educator" : "Member"}
                </div>
 
                {!editing && (
                  <button 
                    onClick={() => setEditing(true)}
                    className="w-full py-3 bg-black text-white rounded-2xl font-black text-sm hover:bg-gray-900 transition"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
 
              {/* Stats Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl shadow-xl p-8 text-white">
                <h3 className="text-xs font-black uppercase tracking-widest mb-6 opacity-80">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Views</span>
                    <span className="text-2xl font-black">{stats.views.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Downloads</span>
                    <span className="text-2xl font-black">{stats.downloads}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-white/20">
                    <span className="font-bold">Rating</span>
                    <span className="text-2xl font-black">⭐ {stats.rating}</span>
                  </div>
                </div>
              </div>
 
              {/* Achievements */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-8">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Achievements</h3>
                <div className="grid grid-cols-2 gap-4">
                  {ACHIEVEMENTS.map((ach, i) => {
                    const unlocked = ach.check(stats, profile);
                    return (
                      <div 
                        key={i} 
                        className={`p-4 rounded-2xl text-center transition-all ${
                          unlocked ? "bg-yellow-100 border-2 border-yellow-300" : "bg-gray-100 opacity-50"
                        }`}
                      >
                        <div className="text-2xl mb-2">{ach.icon}</div>
                        <p className="text-[10px] font-black">{ach.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
 
            {/* MAIN CONTENT */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 space-y-8"
            >
              <AnimatePresence mode="wait">
                {editing ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-3xl border border-gray-200 shadow-xl p-10"
                  >
                    <h3 className="text-3xl font-black text-gray-900 mb-10">Edit Profile</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-black text-gray-500 uppercase mb-2">Bio</label>
                        <textarea 
                          value={bio} 
                          onChange={e => setBio(e.target.value)} 
                          rows={4}
                          className="w-full px-6 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition resize-none" 
                        />
                      </div>
 
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase mb-2">Location</label>
                          <input 
                            value={location} 
                            onChange={e => setLocation(e.target.value)} 
                            placeholder="City / Country"
                            className="w-full px-6 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase mb-2">Hourly Rate (₹)</label>
                          <input 
                            type="number" 
                            value={hourlyRate} 
                            onChange={e => setHourlyRate(Number(e.target.value))}
                            className="w-full px-6 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition" 
                          />
                        </div>
                      </div>
 
                      <div>
                        <label className="block text-xs font-black text-gray-500 uppercase mb-2">Portfolio Link</label>
                        <input 
                          value={portfolio} 
                          onChange={e => setPortfolio(e.target.value)} 
                          placeholder="https://..."
                          className="w-full px-6 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition" 
                        />
                      </div>
 
                      <div>
                        <label className="block text-xs font-black text-gray-500 uppercase mb-3">Skills</label>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {skills.map(s => (
                            <span key={s} className="px-4 py-2 bg-blue-100 text-blue-700 font-black text-xs rounded-xl flex items-center gap-2">
                              {s} 
                              <button 
                                onClick={() => setSkills(skills.filter(x => x !== s))} 
                                className="hover:text-red-600"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input 
                            value={skillInput} 
                            onChange={e => setSkillInput(e.target.value)} 
                            onKeyDown={e => e.key === "Enter" && addSkill()}
                            placeholder="Add skill..." 
                            className="flex-1 px-6 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition" 
                          />
                          <button 
                            onClick={addSkill} 
                            className="px-6 py-4 bg-gray-200 rounded-2xl font-black text-sm hover:bg-gray-300 transition"
                          >
                            Add
                          </button>
                        </div>
                      </div>
 
                      <div className="flex gap-4 pt-6 border-t">
                        <button 
                          onClick={saveProfile} 
                          disabled={saving} 
                          className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button 
                          onClick={() => setEditing(false)} 
                          className="px-8 py-4 border border-gray-200 text-gray-600 rounded-2xl font-black hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    {/* Bio Section */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-10">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">About</h3>
                      <p className="text-gray-800 text-lg leading-relaxed font-bold">
                        {bio || "No bio added yet. Click Edit to add one."}
                      </p>
                    </div>
 
                    {/* Skills & Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-10">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {skills.length > 0 ? skills.map(s => (
                            <span key={s} className="px-4 py-2 bg-blue-100 text-blue-700 font-black text-xs rounded-xl">
                              {s}
                            </span>
                          )) : <p className="text-gray-500 font-bold italic">No skills added</p>}
                        </div>
                      </div>
 
                      <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-10">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Details</h3>
                        <div className="space-y-4 text-sm font-bold text-gray-700">
                          <p>📍 {location || "Remote"}</p>
                          <p>💰 ₹{hourlyRate}/hour</p>
                          {portfolio && (
                            <p>
                              <a href={portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                🔗 View Portfolio
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </main>
 
      <Footer />
    </div>
  );
}