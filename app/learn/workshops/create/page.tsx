"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";

const TAGS_OPTIONS = ["AR","VR","Unity","Unreal","WebXR","Blender","ARCore","ARKit","3D Modelling","AutoCAD"];

export default function CreateWorkshopPage() {
  const router = useRouter();
  const [user,    setUser]    = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [date,        setDate]        = useState("");
  const [time,        setTime]        = useState("");
  const [duration,    setDuration]    = useState("60");
  const [maxSeats,    setMaxSeats]    = useState("20");
  const [meetLink,    setMeetLink]    = useState("");
  const [tags,        setTags]        = useState<string[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists() && !["mentor","admin"].includes(snap.data().role)) router.push("/learn");
    });
    return () => unsub();
  }, []);

  const toggleTag = (tag: string) =>
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !date || !time || !meetLink) { setError("Please fill all required fields."); return; }
    setLoading(true); setError("");
    try {
      await addDoc(collection(db, "workshops"), {
        title:           title.trim(),
        description:     description.trim(),
        hostId:          user.uid,
        hostName:        user.displayName || user.email,
        hostPhoto:       user.photoURL || "",
        date:            new Date(`${date}T${time}`),
        duration:        parseInt(duration),
        maxSeats:        parseInt(maxSeats),
        price:           0,
        meetLink:        meetLink.trim(),
        tags,
        registeredUsers: [],
        status:          "upcoming",
        createdAt:       serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(() => router.push("/learn"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create session.");
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4">
        <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}
          className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-3xl mx-auto mb-5">✅</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Session created!</h2>
          <p className="text-gray-500 text-sm">Redirecting to Learn page...</p>
        </motion.div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-16 flex-grow w-full">
        <div className="mb-8">
          <Link href="/learn" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-semibold mb-5 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to Learn
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-3">Create a live session</h1>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-xs font-bold text-green-700">Live sessions are always free for participants</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Session title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required
              placeholder="e.g. Getting started with ARCore in Unity"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/30 focus:border-[#5B4BDB] transition-all" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="What will participants learn? What should they bring?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/30 focus:border-[#5B4BDB] transition-all resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/30 focus:border-[#5B4BDB] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Time *</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/30 focus:border-[#5B4BDB] transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Duration</label>
              <select value={duration} onChange={e => setDuration(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/30 focus:border-[#5B4BDB] transition-all bg-white">
                {["30","45","60","90","120"].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Max seats</label>
              <input type="number" value={maxSeats} onChange={e => setMaxSeats(e.target.value)} min="1" max="500"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/30 focus:border-[#5B4BDB] transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Topics</label>
            <div className="flex flex-wrap gap-2">
              {TAGS_OPTIONS.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${tags.includes(tag) ? "bg-[#5B4BDB] text-white border-[#4438b8]" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Meet / Zoom link *
              <span className="text-gray-400 font-normal ml-1">(shown only to registered participants)</span>
            </label>
            <input type="url" value={meetLink} onChange={e => setMeetLink(e.target.value)} required
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/30 focus:border-[#5B4BDB] transition-all" />
            <p className="text-xs text-gray-400 mt-1.5">Google Meet, Zoom, or any video link works</p>
          </div>

          {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all active:translate-y-[1px] disabled:opacity-50">
            {loading ? "Creating..." : "Create free session"}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}