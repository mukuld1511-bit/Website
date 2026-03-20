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

type SessionCategory = "workshop" | "group" | "doubt_open";

const SESSION_CATEGORIES: { type: SessionCategory; icon: string; label: string; desc: string; color: string; bg: string }[] = [
  {
    type: "workshop",
    icon: "🎓",
    label: "Live Workshop",
    desc: "Open lecture-style session for many learners. You set price per seat.",
    color: "#5B4BDB", bg: "#EEEDFE",
  },
  {
    type: "group",
    icon: "👥",
    label: "Group Session",
    desc: "Small group, focused learning. Price auto-splits per head from your hourly rate.",
    color: "#0F6E56", bg: "#E1F5EE",
  },
  {
    type: "doubt_open",
    icon: "⚡",
    label: "Open Doubt Slot",
    desc: "Publish an available slot for doubt sessions. Learners can claim it.",
    color: "#B45309", bg: "#FAEEDA",
  },
];

export default function CreateSessionPage() {
  const router = useRouter();
  const [user, setUser]         = useState<any>(null);
  const [userRole, setUserRole] = useState("");
  const [mentorData, setMentorData] = useState<any>(null);

  // Session category
  const [category, setCategory] = useState<SessionCategory>("workshop");

  // Common fields
  const [title, setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate]         = useState("");
  const [duration, setDuration] = useState(60);
  const [tags, setTags]         = useState<string[]>([]);
  const [meetLink, setMeetLink] = useState("");

  // Workshop specific
  const [maxSeats, setMaxSeats] = useState(20);
  const [isPaid, setIsPaid]     = useState(false);
  const [price, setPrice]       = useState(0);

  // Group session specific
  const [groupMaxSeats, setGroupMaxSeats] = useState(5);
  // group price is auto-calculated from mentor's hourlyRate

  // Doubt slot specific
  const [doubtDuration, setDoubtDuration] = useState(30);
  const [doubtSlots, setDoubtSlots]       = useState([{ date: "", available: true }]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u ?? null);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          setUserRole(snap.data().role || "");
          setMentorData(snap.data());
        }
      }
    });
    return () => unsub();
  }, []);

  const hourlyRate = mentorData?.hourlyRate ?? 500;

  // Group session per-head price
  const groupPricePerHead = Math.round((hourlyRate * duration) / 60 / groupMaxSeats);
  const groupMentorEarns  = Math.round(groupPricePerHead * groupMaxSeats * 0.85);

  const handleCreate = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!date && category !== "doubt_open") { setError("Date & time is required"); return; }

    if (category === "workshop" && isPaid && price <= 0) { setError("Enter a valid price"); return; }
    if (category === "group" && groupMaxSeats < 2) { setError("Group needs at least 2 seats"); return; }

    setSubmitting(true); setError("");
    try {
      const userSnap  = await getDoc(doc(db, "users", user.uid));
      const userData  = userSnap.exists() ? userSnap.data() : { displayName: "Mentor", photoURL: "" };
      const autoMeet  = `https://meet.jit.si/synthe-${user.uid.slice(0, 6)}-${Date.now()}`;

      if (category === "workshop") {
        await addDoc(collection(db, "workshops"), {
          title: title.trim(), description: description.trim(),
          date: new Date(date), duration, maxSeats,
          price: isPaid ? price : 0, isPaid, tags,
          meetLink: meetLink.trim() || autoMeet,
          hostId: user.uid, hostName: userData.displayName || user.email,
          hostPhoto: userData.photoURL || "",
          sessionCategory: "workshop",
          status: "upcoming", registeredUsers: [],
          createdAt: serverTimestamp(),
        });
      } else if (category === "group") {
        await addDoc(collection(db, "mentorSessions"), {
          title: title.trim(), description: description.trim(),
          sessionType: "group",
          scheduledAt: new Date(date),
          duration, maxSeats: groupMaxSeats,
          pricePerHead: groupPricePerHead,
          mentorEarns: groupMentorEarns,
          tags, meetLink: meetLink.trim() || autoMeet,
          mentorId: user.uid, mentorName: userData.displayName || user.email,
          mentorPhoto: userData.photoURL || "",
          hourlyRate,
          status: "upcoming",
          registeredLearners: [],
          createdAt: serverTimestamp(),
        });
      } else if (category === "doubt_open") {
        // Create one open doubt slot per date added
        const validSlots = doubtSlots.filter(s => s.date.trim());
        for (const slot of validSlots) {
          await addDoc(collection(db, "doubtSlots"), {
            mentorId:   user.uid,
            mentorName: userData.displayName || user.email,
            mentorPhoto: userData.photoURL || "",
            hourlyRate,
            duration:   doubtDuration,
            pricePerSession: Math.round((hourlyRate * doubtDuration) / 60),
            scheduledAt: new Date(slot.date),
            topic:       title.trim(),
            description: description.trim(),
            tags,
            status:      "available",
            createdAt:   serverTimestamp(),
          });
        }
      }

      setSuccess(true);
      setTimeout(() => router.push("/learn"), 2000);
    } catch (e) { setError((e as Error).message); }
    setSubmitting(false);
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#5B4BDB] transition-colors bg-white";

  if (success) return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
      <div className="text-center bg-white p-10 rounded-2xl border border-gray-200 shadow-xl max-w-sm w-full mx-4">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Session Created!</h2>
        <p className="text-gray-500 text-sm">Redirecting to Learn page...</p>
      </div>
    </div>
  );

  if (user && !["mentor", "admin"].includes(userRole)) return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
      <div className="text-center bg-white p-10 rounded-2xl border border-gray-200">
        <p className="text-4xl mb-4">🔒</p>
        <p className="font-black text-gray-900 mb-2">Mentors only</p>
        <p className="text-gray-500 text-sm mb-5">Apply as a Mentor to create sessions</p>
        <Link href="/join"><button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm">Apply as Mentor</button></Link>
      </div>
    </div>
  );

  const activeCat = SESSION_CATEGORIES.find(c => c.type === category)!;

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col font-sans">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-14 flex-grow w-full">

        {/* Back */}
        <Link href="/learn" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-semibold mb-6 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back to Learn
        </Link>

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-2">Mentor Dashboard</p>
          <h1 className="text-3xl font-black text-gray-900 mb-1">Create a Session</h1>
          <p className="text-gray-500 text-sm">Your hourly rate: <span className="font-bold text-gray-700">₹{hourlyRate}/hr</span></p>
        </div>

        {/* Category selector */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {SESSION_CATEGORIES.map(cat => (
            <button key={cat.type} onClick={() => setCategory(cat.type)}
              className={`p-4 rounded-2xl border-2 text-center transition-all ${
                category === cat.type
                  ? "shadow-md -translate-y-0.5"
                  : "bg-white border-gray-200 hover:border-gray-300 hover:-translate-y-0.5"
              }`}
              style={category === cat.type ? { borderColor: cat.color, background: cat.bg } : {}}>
              <div className="text-2xl mb-1.5">{cat.icon}</div>
              <p className={`text-xs font-black ${category === cat.type ? "" : "text-gray-700"}`}
                style={category === cat.type ? { color: cat.color } : {}}>{cat.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{cat.desc}</p>
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-5">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              {category === "doubt_open" ? "Topic / Subject *" : "Session Title *"}
            </label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder={
                category === "workshop" ? "e.g. Intro to WebXR Development" :
                category === "group"    ? "e.g. Unity AR Foundations — Small Group" :
                "e.g. Unity AR Doubt Clearing"
              }
              className={inputCls} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="What will learners gain? What to prepare?"
              className={inputCls + " resize-none"} />
          </div>

          {/* Date & Duration — workshop and group */}
          {category !== "doubt_open" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Date & Time *</label>
                <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Duration</label>
                <select value={duration} onChange={e => setDuration(Number(e.target.value))} className={inputCls}>
                  {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </div>
            </div>
          )}

          {/* ── WORKSHOP SPECIFIC ── */}
          {category === "workshop" && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Max Seats</label>
                <input type="number" value={maxSeats} onChange={e => setMaxSeats(Number(e.target.value))} min={1} max={500} className={inputCls} />
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer" onClick={() => setIsPaid(!isPaid)}>
                  <input type="checkbox" checked={isPaid} onChange={e => setIsPaid(e.target.checked)} onClick={e => e.stopPropagation()} className="w-4 h-4" />
                  <p className="font-bold text-gray-900 text-sm">Paid workshop (charge per seat)</p>
                </div>
                {isPaid && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-3 space-y-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Price per seat (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                      <input type="number" value={price || ""} onChange={e => setPrice(Number(e.target.value))} placeholder="299" min="0" className={inputCls + " pl-8"} />
                    </div>
                    <p className="text-xs text-gray-400">You keep 85% · SYNTHÉ takes 15%</p>
                    {price > 0 && maxSeats > 0 && (
                      <div className="bg-[#E1F5EE] border border-[#1D9E7533] rounded-xl p-3 mt-2">
                        <p className="text-xs font-bold text-[#0F6E56]">If full ({maxSeats} seats)</p>
                        <p className="text-xs text-gray-600">Total revenue: ₹{price * maxSeats} · You earn: ₹{Math.round(price * maxSeats * 0.85)}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </>
          )}

          {/* ── GROUP SESSION SPECIFIC ── */}
          {category === "group" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Max Group Size *</label>
                <div className="flex items-center gap-4">
                  <input type="number" value={groupMaxSeats} onChange={e => setGroupMaxSeats(Math.max(2, Number(e.target.value)))}
                    min={2} max={20} className="w-24 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#0F6E56] transition bg-white" />
                  <div className="flex gap-2">
                    {[3, 5, 8, 10].map(n => (
                      <button key={n} type="button" onClick={() => setGroupMaxSeats(n)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          groupMaxSeats === n ? "bg-[#0F6E56] text-white border-[#0F6E56]" : "bg-white text-gray-500 border-gray-200"
                        }`}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price breakdown preview */}
              <div className="bg-[#E1F5EE] border border-[#1D9E7533] rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-[#0F6E56] uppercase tracking-wide">Auto pricing breakdown</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                  <div className="bg-white rounded-lg p-2.5">
                    <p className="text-gray-400 mb-0.5">Your hourly rate × duration</p>
                    <p className="font-bold text-gray-900">₹{Math.round(hourlyRate * duration / 60)} total</p>
                  </div>
                  <div className="bg-white rounded-lg p-2.5">
                    <p className="text-gray-400 mb-0.5">÷ {groupMaxSeats} learners</p>
                    <p className="font-bold text-[#0F6E56] text-base">₹{groupPricePerHead}/head</p>
                  </div>
                  <div className="bg-white rounded-lg p-2.5">
                    <p className="text-gray-400 mb-0.5">If {groupMaxSeats} join</p>
                    <p className="font-bold text-gray-900">₹{groupPricePerHead * groupMaxSeats} revenue</p>
                  </div>
                  <div className="bg-white rounded-lg p-2.5">
                    <p className="text-gray-400 mb-0.5">You earn (85%)</p>
                    <p className="font-bold text-gray-900">₹{groupMentorEarns}</p>
                  </div>
                </div>
                <p className="text-xs text-[#0F6E56]">Price per head adjusts automatically based on seats filled.</p>
              </div>
            </div>
          )}

          {/* ── DOUBT SLOT SPECIFIC ── */}
          {category === "doubt_open" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Session Duration</label>
                <div className="flex gap-2">
                  {[30, 45, 60, 90].map(d => (
                    <button key={d} type="button" onClick={() => setDoubtDuration(d)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        doubtDuration === d ? "bg-[#B45309] text-white border-[#B45309]" : "bg-white text-gray-600 border-gray-200"
                      }`}>{d}m</button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Price per doubt session: <span className="font-bold text-gray-700">₹{Math.round(hourlyRate * doubtDuration / 60)}</span>
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Available Slots *</label>
                  <button type="button"
                    onClick={() => setDoubtSlots([...doubtSlots, { date: "", available: true }])}
                    className="text-xs text-[#5B4BDB] font-bold hover:underline">
                    + Add slot
                  </button>
                </div>
                <div className="space-y-2">
                  {doubtSlots.map((slot, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input type="datetime-local" value={slot.date}
                        onChange={e => {
                          const updated = [...doubtSlots];
                          updated[idx] = { ...slot, date: e.target.value };
                          setDoubtSlots(updated);
                        }}
                        min={new Date().toISOString().slice(0, 16)}
                        className={inputCls + " flex-1"} />
                      {doubtSlots.length > 1 && (
                        <button type="button" onClick={() => setDoubtSlots(doubtSlots.filter((_, i) => i !== idx))}
                          className="p-2 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 transition">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Each slot = one available doubt session. Learners will book and pay to claim a slot.</p>
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {XR_TAGS.map(t => (
                <button key={t} type="button" onClick={() => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                  className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-all ${
                    tags.includes(t) ? "text-white border-transparent" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                  style={tags.includes(t) ? { background: activeCat.color } : {}}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Meet link */}
          {category !== "doubt_open" && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Session Link (optional)</label>
              <input value={meetLink} onChange={e => setMeetLink(e.target.value)}
                placeholder="Leave blank to auto-generate a Jitsi link"
                className={inputCls} />
              <p className="text-xs text-gray-400 mt-1.5">Auto-generated: meet.jit.si — free, no account needed</p>
            </div>
          )}

          <button onClick={handleCreate} disabled={submitting}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-colors border-b-[3px] active:translate-y-[1px]"
            style={{ background: activeCat.color, borderBottomColor: "rgba(0,0,0,0.2)" }}>
            {submitting ? "Creating..." : `Create ${activeCat.label}`}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}