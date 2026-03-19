"use client";
import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const XR_TAGS = ["AR","VR","Unity","Unreal","WebXR","Blender","ARCore","ARKit","Three.js","React Three Fiber","Meta Quest","HoloLens"];

export default function CreateWorkshopPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState(60);
  const [maxSeats, setMaxSeats] = useState(20);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [meetLink, setMeetLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u??null);
      if (u) {
        const snap = await getDoc(doc(db,"users",u.uid));
        if (snap.exists()) setUserRole(snap.data().role||"");
      }
    });
    return ()=>unsub();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()||!date||!meetLink.trim()) { setError("Fill all required fields including meet link"); return; }
    if (isPaid && price<=0) { setError("Enter a valid price"); return; }
    setSubmitting(true); setError("");
    try {
      const userSnap = await getDoc(doc(db,"users",user.uid));
      const userData = userSnap.exists() ? userSnap.data() : { displayName:"Mentor", photoURL:"" };
      await addDoc(collection(db,"workshops"), {
        title: title.trim(), description: description.trim(),
        date: new Date(date), duration, maxSeats,
        price: isPaid ? price : 0, isPaid,
        tags, meetLink: meetLink.trim(),
        hostId: user.uid, hostName: userData.displayName || user.email,
        hostPhoto: userData.photoURL || "",
        status: "upcoming", registeredUsers: [],
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(()=>router.push("/learn"), 2000);
    } catch(e) { setError((e as Error).message); }
    setSubmitting(false);
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#5B4BDB] transition-colors bg-white";

  if (success) return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
      <div className="text-center bg-white p-10 rounded-2xl border border-gray-200 shadow-xl max-w-sm w-full mx-4">
        <div className="text-5xl mb-4">🎓</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Workshop Created!</h2>
        <p className="text-gray-500 text-sm">Redirecting to Learn page...</p>
      </div>
    </div>
  );

  if (user && !["mentor","admin"].includes(userRole)) return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
      <div className="text-center bg-white p-10 rounded-2xl border border-gray-200">
        <p className="text-4xl mb-4">🔒</p>
        <p className="font-black text-gray-900 mb-2">Mentors only</p>
        <p className="text-gray-500 text-sm mb-5">Apply as a Mentor to create workshops</p>
        <Link href="/join"><button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm">Apply as Mentor</button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col font-sans">
      <Navbar/>
      <div className="max-w-2xl mx-auto px-4 py-14 flex-grow w-full">
        <div className="mb-8">
          <Link href="/learn" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-semibold mb-5 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to Learn
          </Link>
          <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-2">Mentor</p>
          <h1 className="text-3xl font-black text-gray-900 mb-1">Create a Workshop</h1>
          <p className="text-gray-500 text-sm">Host a live group session for learners on SYNTHÉ</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-5">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Workshop Title *</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Intro to WebXR Development" className={inputCls}/>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Description</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4}
              placeholder="What will learners gain? Prerequisites? Tools needed?"
              className={inputCls+" resize-none"}/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Date & Time *</label>
              <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} min={new Date().toISOString().slice(0,16)} className={inputCls}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Duration (minutes)</label>
              <select value={duration} onChange={e=>setDuration(Number(e.target.value))} className={inputCls}>
                {[30,45,60,90,120].map(d=><option key={d} value={d}>{d} minutes</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Max Seats</label>
            <input type="number" value={maxSeats} onChange={e=>setMaxSeats(Number(e.target.value))} min={1} max={500} className={inputCls}/>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {XR_TAGS.map(t=>(
                <button key={t} type="button" onClick={()=>setTags(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t])}
                  className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-all ${tags.includes(t)?"bg-[#5B4BDB] text-white border-[#5B4BDB]":"bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Meet link */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Session Link * (Google Meet / Jitsi)</label>
            <input value={meetLink} onChange={e=>setMeetLink(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              className={inputCls}/>
            <p className="text-xs text-gray-400 mt-1.5">Tip: Create a Jitsi room at meet.jit.si — free, no account needed</p>
          </div>

          {/* Pricing */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:border-gray-300 transition" onClick={()=>setIsPaid(!isPaid)}>
              <input type="checkbox" checked={isPaid} onChange={e=>setIsPaid(e.target.checked)} onClick={e=>e.stopPropagation()} className="w-4 h-4"/>
              <p className="font-bold text-gray-900 text-sm">Paid workshop (charge learners)</p>
            </div>
            {isPaid && (
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} className="pt-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Price per seat (₹ INR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                  <input type="number" value={price||""} onChange={e=>setPrice(Number(e.target.value))} placeholder="299" min="0" className={inputCls+" pl-8"}/>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">You keep 85% · SYNTHÉ takes 15%</p>
              </motion.div>
            )}
          </div>

          <button onClick={handleCreate} disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] text-white font-bold text-sm disabled:opacity-50 transition-colors border-b-[3px] border-[#4438b8] active:translate-y-[1px]">
            {submitting ? "Creating..." : "Create Workshop"}
          </button>
        </div>
      </div>
      <Footer/>
    </div>
  );
}