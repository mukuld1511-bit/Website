"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type ApplyType = "learner" | "developer" | "mentor";

async function uploadCertToR2(file: File, userId: string): Promise<string> {
  const key = `certificates/${userId}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const res = await fetch("/api/r2-presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, contentType: file.type || "application/octet-stream" }),
  });
  if (!res.ok) throw new Error("Failed to get upload URL");
  const { url, publicUrl } = await res.json();
  const upload = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  if (!upload.ok) throw new Error("Upload failed");
  return publicUrl;
}

const ROLES: Record<ApplyType, {
  icon: string; title: string; color: string; bg: string;
  tagline: string; badge: string; badgeColor: string;
  approval: "instant" | "manual";
  perks: string[]; notFor: string; earnings?: string;
}> = {
  learner: {
    icon: "🎓", title: "Learner", color: "#185FA5", bg: "#E6F1FB",
    tagline: "Learn XR from scratch — guided, structured, AI-powered.",
    badge: "INSTANT", badgeColor: "#16a34a", approval: "instant",
    perks: [
      "AI-generated personalised XR roadmap",
      "Register for 100+ free live workshops monthly",
      "Book verified mentors at ₹300–₹1000/hr",
      "Earn learning certificates and badges",
    ],
    notFor: "Not for creators who want to sell models — apply as Developer instead.",
  },
  developer: {
    icon: "⚡", title: "Developer", color: "#5B4BDB", bg: "#EEEDFE",
    tagline: "Upload 3D models and AR/VR builds. Earn 85% on every sale.",
    badge: "INSTANT", badgeColor: "#16a34a", approval: "instant",
    earnings: "₹50,000+ monthly potential",
    perks: [
      "Upload GLB, GLTF, OBJ, FBX, ZIP, DWG files",
      "Earn 85% commission on every sale",
      "AI auto-writes titles, tags & pricing",
      "Direct payout via UPI/Bank transfer",
    ],
    notFor: "Not for teaching — apply as Mentor if you want to host sessions.",
  },
  mentor: {
    icon: "🧑‍🏫", title: "Mentor", color: "#0F6E56", bg: "#E1F5EE",
    tagline: "Host workshops. Run 1-on-1 & group sessions. Set your own rates.",
    badge: "REVIEWED", badgeColor: "#B45309", approval: "manual",
    earnings: "₹80,000+ monthly potential",
    perks: [
      "Host unlimited free & paid workshops",
      "Set your own 1-on-1 + group session rates",
      "On-demand doubt sessions (instant booking)",
      "Earn 85% on every paid session",
      "Verified mentor badge on your profile",
    ],
    notFor: "Manual review required — min 2 certificates, full profile.",
  },
};

interface CertFile { file: File; name: string; uploading: boolean; url: string; error: string; }

function CertUploader({ userId, certs, setCerts }: {
  userId: string; certs: CertFile[]; setCerts: (c: CertFile[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setCerts([...certs, ...Array.from(files).map(f => ({ file: f, name: f.name, uploading: false, url: "", error: "" }))].slice(0, 5));
  };
  const uploadOne = async (idx: number) => {
    const cert = certs[idx];
    if (cert.uploading || cert.url) return;
    const updated = [...certs];
    updated[idx] = { ...cert, uploading: true, error: "" };
    setCerts(updated);
    try {
      const url = await uploadCertToR2(cert.file, userId);
      updated[idx] = { ...updated[idx], uploading: false, url };
      setCerts([...updated]);
    } catch (e: any) {
      updated[idx] = { ...updated[idx], uploading: false, error: e.message };
      setCerts([...updated]);
    }
  };
  const remove = (idx: number) => setCerts(certs.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Certificates <span className="text-red-500">(min 2 required)</span>
        </label>
        <span className={`text-xs font-bold ${certs.filter(c => c.url).length >= 2 ? "text-green-600" : "text-gray-400"}`}>
          {certs.filter(c => c.url).length}/2 uploaded
        </span>
      </div>
      <div onClick={() => inputRef.current?.click()} onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-[#0F6E56] hover:bg-[#E1F5EE]/30 transition-all">
        <div className="text-2xl mb-1">📄</div>
        <p className="text-sm font-semibold text-gray-700">Drop certificates here or click to browse</p>
        <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG · Max 10MB · Up to 5 files</p>
        <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={e => addFiles(e.target.files)} className="hidden" />
      </div>
      {certs.map((cert, idx) => (
        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
          <span className="text-lg">{cert.url ? "✅" : cert.uploading ? "⏳" : cert.error ? "❌" : "📄"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{cert.name}</p>
            {cert.error && <p className="text-xs text-red-500">{cert.error}</p>}
            {cert.url && <p className="text-xs text-green-600 font-semibold">Uploaded ✓</p>}
            {cert.uploading && <div className="mt-1 h-1 bg-gray-200 rounded-full"><div className="h-full bg-[#0F6E56] animate-pulse rounded-full w-2/3" /></div>}
          </div>
          <div className="flex gap-1.5">
            {!cert.url && !cert.uploading && (
              <button onClick={() => uploadOne(idx)} type="button" className="px-3 py-1 bg-[#0F6E56] text-white text-xs font-bold rounded-lg hover:opacity-90">Upload</button>
            )}
            <button onClick={() => remove(idx)} type="button" className="px-2 py-1 border border-gray-200 text-gray-400 text-xs rounded-lg hover:bg-red-50 hover:text-red-500">✕</button>
          </div>
        </div>
      ))}
      <p className="text-xs text-gray-400">e.g. Coursera, Udemy, Unity Certified, Google ARCore, Meta XR certifications</p>
    </div>
  );
}

export default function JoinPage() {
  const router = useRouter();
  const [user, setUser]             = useState<any>(null);
  const [profile, setProfile]       = useState<any>(null);
  const [selected, setSelected]     = useState<ApplyType | null>(null);
  const [submitted, setSubmitted]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const [why, setWhy]               = useState("");
  const [portfolio, setPortfolio]   = useState("");
  const [devSkills, setDevSkills]   = useState("");
  const [expertise, setExpertise]   = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio]               = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [linkedin, setLinkedin]     = useState("");
  const [skills, setSkills]         = useState("");
  const [certs, setCerts]           = useState<CertFile[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) setProfile(snap.data());
    });
    return () => unsub();
  }, []);

  const alreadyHasRole = (type: ApplyType) => {
    if (!profile) return false;
    return profile.role === type || (Array.isArray(profile.roles) && profile.roles.includes(type));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selected) return;
    setError(""); setLoading(true);

    try {
      // ── INSTANT for learner & developer ──────────────────────────────
      if (selected === "learner" || selected === "developer") {
        const updateData: Record<string, any> = {
          role: selected,
          roleActivatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (selected === "developer") {
          updateData.portfolio = portfolio.trim();
          updateData.skills    = devSkills.split(",").map(s => s.trim()).filter(Boolean);
        } else {
          updateData.why = why.trim();
        }
        await updateDoc(doc(db, "users", user.uid), updateData);
        await addDoc(collection(db, "notifications"), {
          userId:    user.uid,
          message:   `🎉 Welcome! You're now a ${selected === "learner" ? "Learner" : "Developer"} on SYNTHÉ. Your role is active immediately.`,
          read:      false,
          createdAt: serverTimestamp(),
        });
        setSubmitted(true);
        return;
      }

      // ── MENTOR — strict manual review ─────────────────────────────────
      const uploadedCerts = certs.filter(c => c.url);
      if (uploadedCerts.length < 2) { setError("Please upload at least 2 certificates."); setLoading(false); return; }
      if (bio.trim().length < 50)   { setError("Bio must be at least 50 characters."); setLoading(false); return; }
      if (!expertise.trim())        { setError("Area of expertise is required."); setLoading(false); return; }
      if (!experience.trim())       { setError("Years of experience is required."); setLoading(false); return; }
      if (Number(hourlyRate) < 100) { setError("Hourly rate must be at least ₹100."); setLoading(false); return; }
      if (!linkedin.trim())         { setError("LinkedIn URL is required."); setLoading(false); return; }

      await addDoc(collection(db, "roleApplications"), {
        userId:    user.uid,
        userName:  user.displayName || user.email,
        userPhoto: user.photoURL || "",
        userEmail: user.email,
        applyType: "mentor",
        status:    "pending",
        expertise, experience,
        bio:       bio.trim(),
        hourlyRate: Number(hourlyRate),
        linkedin:  linkedin.trim(),
        portfolio: portfolio.trim(),
        skills:    skills.split(",").map(s => s.trim()).filter(Boolean),
        certificates: uploadedCerts.map(c => ({ name: c.name, url: c.url })),
        certCount: uploadedCerts.length,
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0F6E56] transition-colors bg-white";

  if (submitted && selected) {
    const info    = ROLES[selected];
    const instant = info.approval === "instant";
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center px-4 py-24">
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-12 max-w-md w-full text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6" style={{ background: info.bg }}>
              {info.icon}
            </motion.div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">
              {instant ? "Role Activated! 🎉" : "Application Submitted!"}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-8">
              {instant
                ? `Your ${info.title} role is active immediately. Go explore!`
                : "Your mentor application is under review. Admin will verify your certificates within 24–48 hours."}
            </p>
            {!instant && selected === "mentor" && (
              <div className="bg-[#E1F5EE] border border-[#1D9E7533] rounded-2xl p-4 mb-6 text-left">
                <p className="text-xs font-bold text-[#0F6E56] mb-2">Certificates submitted</p>
                {certs.filter(c => c.url).map((c, i) => (
                  <p key={i} className="text-xs text-gray-600 flex gap-2"><span className="text-green-500">✓</span>{c.name}</p>
                ))}
              </div>
            )}
            <Link href="/dashboard">
              <button className="w-full py-3.5 rounded-xl font-black text-white text-sm hover:opacity-90 transition" style={{ background: info.color }}>
                Go to dashboard →
              </button>
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col font-sans text-gray-900">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-20 flex-grow w-full">

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5B4BDB]/10 border border-[#5B4BDB]/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BDB] animate-pulse" />
            <span className="text-xs font-bold text-[#5B4BDB] uppercase tracking-widest">Upgrade your account</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-gray-900 mb-4">Choose your role</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Learner & Developer activate <span className="font-bold text-green-600">instantly</span>. Mentor requires manual review.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {(["learner", "developer", "mentor"] as ApplyType[]).map((type, i) => {
            const info       = ROLES[type];
            const isSelected = selected === type;
            const hasRole    = alreadyHasRole(type);
            return (
              <motion.div key={type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <button disabled={hasRole} onClick={() => setSelected(isSelected ? null : type)}
                  className={`relative w-full p-7 rounded-2xl border-2 text-left transition-all duration-200 ${
                    hasRole ? "opacity-50 cursor-not-allowed bg-white border-gray-100" :
                    isSelected ? "shadow-xl -translate-y-1" :
                    "bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg hover:-translate-y-0.5"
                  }`}
                  style={isSelected ? { borderColor: info.color, background: info.bg } : {}}>

                  <div className="absolute -top-3 left-6 px-3 py-1 rounded-full text-white text-[10px] font-black shadow-sm"
                    style={{ background: hasRole ? "#6b7280" : info.badgeColor }}>
                    {hasRole ? "CURRENT ROLE" : info.badge}
                  </div>
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: info.color }}>
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  )}
                  <div className="text-4xl mb-4 mt-2">{info.icon}</div>
                  <h3 className="font-black text-xl mb-1" style={{ color: isSelected ? info.color : "#111827" }}>{info.title}</h3>
                  {"earnings" in info && <p className="text-sm font-black mb-3" style={{ color: info.color }}>{(info as any).earnings}</p>}
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{info.tagline}</p>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold mb-4 ${
                    info.approval === "instant" ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {info.approval === "instant" ? "⚡ Instant activation" : "🔍 Manual review (24-48hr)"}
                  </div>
                  <ul className="space-y-2">
                    {info.perks.map((p, j) => (
                      <li key={j} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0 font-black" style={{ color: info.color }}>✓</span>{p}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100 italic">{info.notFor}</p>
                </button>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {selected && !alreadyHasRole(selected) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-10 max-w-2xl mx-auto">

              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: ROLES[selected].bg }}>
                  {ROLES[selected].icon}
                </div>
                <div>
                  <h2 className="font-black text-xl text-gray-900">{ROLES[selected].title} Application</h2>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                    ROLES[selected].approval === "instant" ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {ROLES[selected].approval === "instant" ? "⚡ Activates immediately" : "🔍 Admin review required"}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {selected === "learner" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Why do you want to learn AR/VR? *</label>
                    <textarea value={why} onChange={e => setWhy(e.target.value)} required rows={3}
                      placeholder="Tell us your learning goals and what you want to build..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#185FA5] text-sm text-gray-900 outline-none transition resize-none" />
                  </div>
                )}

                {selected === "developer" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Portfolio / GitHub *</label>
                      <input type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)} required
                        placeholder="https://github.com/yourname"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5B4BDB] text-sm text-gray-900 outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Skills (comma-separated)</label>
                      <input value={devSkills} onChange={e => setDevSkills(e.target.value)}
                        placeholder="Unity, Blender, WebXR, Three.js"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#5B4BDB] text-sm text-gray-900 outline-none transition" />
                    </div>
                  </>
                )}

                {selected === "mentor" && (
                  <>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                      <p className="font-bold mb-1">⚠️ Strict verification</p>
                      <p className="text-xs">Min 2 certificates, 50+ char bio, LinkedIn, and hourly rate required. Incomplete applications are rejected.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Expertise *</label>
                        <input value={expertise} onChange={e => setExpertise(e.target.value)} required placeholder="Unity AR, WebXR..." className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Years of experience *</label>
                        <input value={experience} onChange={e => setExperience(e.target.value)} required placeholder="e.g. 5 years" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                        Professional Bio * <span className="text-gray-400 font-normal normal-case">(min 50 chars)</span>
                      </label>
                      <textarea value={bio} onChange={e => setBio(e.target.value)} required rows={4}
                        placeholder="Describe your XR experience, what you've built, and how you help learners..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#0F6E56] text-sm text-gray-900 outline-none transition resize-none" />
                      <p className={`text-xs mt-1 ${bio.length >= 50 ? "text-green-600 font-semibold" : "text-gray-400"}`}>{bio.length}/50</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Skills *</label>
                      <input value={skills} onChange={e => setSkills(e.target.value)} required placeholder="Unity, ARCore, Blender, WebXR, Meta Quest" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Hourly Rate (₹) *</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                          <input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} required min="100" placeholder="500" className={inputCls + " pl-8"} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">You keep 85%</p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">LinkedIn *</label>
                        <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)} required placeholder="https://linkedin.com/in/yourname" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Portfolio (optional)</label>
                      <input type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)} placeholder="https://yourportfolio.com" className={inputCls} />
                    </div>
                    {user && (
                      <div className="pt-4 border-t border-gray-100">
                        <CertUploader userId={user.uid} certs={certs} setCerts={setCerts} />
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Completeness</p>
                      {[
                        { label: "Expertise & experience", done: !!expertise && !!experience },
                        { label: "Bio (50+ chars)", done: bio.length >= 50 },
                        { label: "Skills listed", done: skills.trim().length > 0 },
                        { label: "Hourly rate (₹100+)", done: Number(hourlyRate) >= 100 },
                        { label: "LinkedIn URL", done: !!linkedin.trim() },
                        { label: "2+ certificates uploaded", done: certs.filter(c => c.url).length >= 2 },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-2">
                          <span className={`text-sm ${item.done ? "text-green-500" : "text-gray-300"}`}>{item.done ? "✓" : "○"}</span>
                          <span className={`text-xs ${item.done ? "text-gray-700 font-semibold" : "text-gray-400"}`}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">{error}</div>}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setSelected(null)} className="px-6 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition">Back</button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-3.5 rounded-xl text-white font-black text-sm transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: ROLES[selected].color }}>
                    {loading ? "Processing..." :
                      ROLES[selected].approval === "instant"
                        ? `Activate ${ROLES[selected].title} Role →`
                        : "Submit for Review"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}