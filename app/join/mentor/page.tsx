"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
      <p className="text-xs text-gray-400">e.g. Coursera, Udemy, Unity Certified, Google ARCore, Meta XR</p>
    </div>
  );
}

const STEPS = ["Your Profile", "Certifications", "Review & Submit"];

export default function JoinMentorPage() {
  const router = useRouter();
  const [user, setUser]               = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [alreadyMentor, setAlreadyMentor]   = useState(false);
  const [alreadyPending, setAlreadyPending] = useState(false);
  const [step, setStep]               = useState(1);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [error, setError]             = useState("");
  const [certs, setCerts]             = useState<CertFile[]>([]);

  const [form, setForm] = useState({
    expertise: "", experience: "", bio: "",
    skills: "", hourlyRate: "", linkedin: "", portfolio: "",
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      setAuthLoading(false);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (data.role === "mentor" || (Array.isArray(data.roles) && data.roles.includes("mentor"))) {
          setAlreadyMentor(true); return;
        }
      }
      // Check pending application
      const appSnap = await getDocs(query(
        collection(db, "roleApplications"),
        where("userId", "==", u.uid),
        where("applyType", "==", "mentor"),
        where("status", "==", "pending")
      ));
      if (!appSnap.empty) setAlreadyPending(true);
    });
    return () => unsub();
  }, []);

  const set = (key: string, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setError("");
  };

  const validateStep1 = () => {
    if (!form.expertise.trim()) { setError("Area of expertise is required."); return false; }
    if (!form.experience.trim()) { setError("Years of experience is required."); return false; }
    if (form.bio.trim().length < 50) { setError("Bio must be at least 50 characters."); return false; }
    if (!form.skills.trim()) { setError("Skills are required."); return false; }
    if (Number(form.hourlyRate) < 100) { setError("Hourly rate must be at least ₹100."); return false; }
    if (!form.linkedin.trim()) { setError("LinkedIn URL is required."); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (certs.filter(c => c.url).length < 2) { setError("Please upload at least 2 certificates."); return false; }
    return true;
  };

  const nextStep = () => {
    setError("");
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setError(""); setSubmitting(true);
    try {
      const uploadedCerts = certs.filter(c => c.url);

      // Save to roleApplications — status: "pending" — NO role update on user
      await addDoc(collection(db, "roleApplications"), {
        userId:    user.uid,
        userName:  user.displayName || user.email,
        userPhoto: user.photoURL || "",
        userEmail: user.email,
        applyType: "mentor",
        status:    "pending",          // ← locked until admin approves
        expertise: form.expertise,
        experience: form.experience,
        bio:       form.bio.trim(),
        hourlyRate: Number(form.hourlyRate),
        linkedin:  form.linkedin.trim(),
        portfolio: form.portfolio.trim(),
        skills:    form.skills.split(",").map(s => s.trim()).filter(Boolean),
        certificates: uploadedCerts.map(c => ({ name: c.name, url: c.url })),
        certCount: uploadedCerts.length,
        createdAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
      });

      // Notify admin
      await addDoc(collection(db, "notifications"), {
        userId:      "ADMIN",
        message:     `📋 New mentor application from ${user.displayName || user.email}. Review in Admin Dashboard.`,
        read:        false,
        createdAt:   serverTimestamp(),
        type:        "mentor_application",
        applicantId: user.uid,
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0F6E56] transition bg-white";

  const completeness = [
    { label: "Expertise & experience", done: !!form.expertise && !!form.experience },
    { label: "Bio (50+ chars)",        done: form.bio.length >= 50 },
    { label: "Skills listed",          done: form.skills.trim().length > 0 },
    { label: "Hourly rate (₹100+)",    done: Number(form.hourlyRate) >= 100 },
    { label: "LinkedIn URL",           done: !!form.linkedin.trim() },
    { label: "2+ certificates",        done: certs.filter(c => c.url).length >= 2 },
  ];

  if (authLoading) return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#0F6E56]/30 border-t-[#0F6E56] animate-spin" />
    </div>
  );

  // Already a mentor
  if (alreadyMentor) return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 py-24">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-green-200 shadow-2xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#E1F5EE] flex items-center justify-center text-4xl mx-auto mb-6">🧑‍🏫</div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">You're already a Mentor!</h2>
          <p className="text-gray-500 text-sm mb-8">Your mentor role is active. Head to your dashboard to manage sessions.</p>
          <Link href="/dashboard">
            <button className="w-full py-3.5 rounded-xl font-black text-white text-sm bg-[#0F6E56] hover:opacity-90 transition">Go to Dashboard →</button>
          </Link>
        </motion.div>
      </div>
      <Footer />
    </div>
  );

  // Already pending
  if (alreadyPending && !submitted) return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 py-24">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-amber-200 shadow-2xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center text-4xl mx-auto mb-6">⏳</div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Application Under Review</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Your mentor application is being reviewed by our admin team. You'll be notified once approved — typically within <span className="font-bold text-amber-700">24–48 hours</span>.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left space-y-1">
            <p className="text-xs font-bold text-amber-700 mb-2">What happens next?</p>
            {["Admin reviews your certificates & profile", "You get a notification on approval", "Your Mentor role activates automatically", "You can start hosting sessions immediately"].map((s, i) => (
              <p key={i} className="text-xs text-gray-600 flex gap-2"><span className="text-amber-500 font-bold">{i + 1}.</span>{s}</p>
            ))}
          </div>
          <Link href="/dashboard">
            <button className="w-full py-3.5 rounded-xl font-black text-white text-sm bg-[#0F6E56] hover:opacity-90 transition">Go to Dashboard →</button>
          </Link>
        </motion.div>
      </div>
      <Footer />
    </div>
  );

  // Submitted success
  if (submitted) return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 py-24">
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-12 max-w-md w-full text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 rounded-2xl bg-[#E1F5EE] flex items-center justify-center text-4xl mx-auto mb-6">🧑‍🏫</motion.div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Application Submitted! ⏳</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Your application is pending admin review. Your role will <span className="font-black text-red-600">NOT</span> be active until an admin approves it (24–48 hrs).
          </p>
          <div className="bg-[#E1F5EE] border border-[#0F6E56]/20 rounded-2xl p-4 mb-6 text-left">
            <p className="text-xs font-bold text-[#0F6E56] mb-2">Certificates submitted for review</p>
            {certs.filter(c => c.url).map((c, i) => (
              <p key={i} className="text-xs text-gray-600 flex gap-2"><span className="text-green-500">✓</span>{c.name}</p>
            ))}
            <p className="text-xs text-amber-700 font-semibold mt-3">⚠️ Mentor role activates only after admin approval.</p>
          </div>
          <Link href="/dashboard">
            <button className="w-full py-3.5 rounded-xl font-black text-white text-sm bg-[#0F6E56] hover:opacity-90 transition">Go to Dashboard →</button>
          </Link>
        </motion.div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col font-sans text-gray-900">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-20 flex-grow w-full">

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">🔍 Manual Review Required</span>
          </div>
          <div className="text-5xl mb-4">🧑‍🏫</div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-3">Join as Mentor</h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            Host workshops, run 1-on-1 & group sessions. Set your own rates. Earn 85% per session.
            <span className="block mt-1 font-bold text-amber-700">Requires admin approval — role is locked until reviewed.</span>
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, idx) => {
            const n = idx + 1;
            return (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-300 ${
                  step > n ? "bg-[#0F6E56] text-white" :
                  step === n ? "bg-[#0F6E56] text-white shadow-md shadow-[#0F6E56]/30" :
                  "border-2 border-gray-200 text-gray-400"
                }`}>
                  {step > n ? "✓" : n}
                </div>
                <span className={`text-xs font-bold hidden sm:block ${step === n ? "text-[#0F6E56]" : "text-gray-400"}`}>{label}</span>
                {n < STEPS.length && <div className={`flex-1 h-[2px] rounded-full transition-all duration-500 ${step > n ? "bg-[#0F6E56]" : "bg-gray-200"}`} />}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }} className="p-8">

              {/* Step 1 — Profile */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 mb-1">Your Mentor Profile</h2>
                    <p className="text-gray-400 text-sm">This is what learners see. Be thorough — incomplete profiles are rejected.</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-amber-700 mb-1">⚠️ Strict verification</p>
                    <p className="text-xs text-amber-700">Min 2 certificates, 50+ char bio, LinkedIn, and hourly rate required. Your mentor role will only activate after an admin manually approves your application.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Expertise *</label>
                      <input value={form.expertise} onChange={e => set("expertise", e.target.value)} placeholder="Unity AR, WebXR..." className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Years of Experience *</label>
                      <input value={form.experience} onChange={e => set("experience", e.target.value)} placeholder="e.g. 5 years" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                      Professional Bio * <span className="text-gray-400 font-normal normal-case">(min 50 chars)</span>
                    </label>
                    <textarea value={form.bio} onChange={e => set("bio", e.target.value)} rows={4}
                      placeholder="Describe your XR experience, what you've built, and how you help learners..."
                      className={inputCls + " resize-none"} />
                    <p className={`text-xs mt-1 ${form.bio.length >= 50 ? "text-green-600 font-semibold" : "text-gray-400"}`}>{form.bio.length}/50</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Skills *</label>
                    <input value={form.skills} onChange={e => set("skills", e.target.value)} placeholder="Unity, ARCore, Blender, WebXR, Meta Quest" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Hourly Rate (₹) *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                        <input type="number" value={form.hourlyRate} onChange={e => set("hourlyRate", e.target.value)} min="100" placeholder="500" className={inputCls + " pl-8"} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">You keep 85%</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">LinkedIn *</label>
                      <input type="url" value={form.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/yourname" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Portfolio (optional)</label>
                    <input type="url" value={form.portfolio} onChange={e => set("portfolio", e.target.value)} placeholder="https://yourportfolio.com" className={inputCls} />
                  </div>
                </div>
              )}

              {/* Step 2 — Certificates */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 mb-1">Upload Certificates</h2>
                    <p className="text-gray-400 text-sm">Admin will verify these. Min 2 required — no exceptions.</p>
                  </div>
                  {user && <CertUploader userId={user.uid} certs={certs} setCerts={setCerts} />}
                  <div className="bg-[#E1F5EE] border border-[#0F6E56]/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-[#0F6E56] mb-1">Accepted certificates</p>
                    <p className="text-xs text-gray-500">Coursera, Udemy, Unity Certified, Google ARCore, Meta XR, AWS, Microsoft, or any accredited institution.</p>
                  </div>
                </div>
              )}

              {/* Step 3 — Review */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 mb-1">Review & Submit</h2>
                    <p className="text-gray-400 text-sm">Check everything before submitting for admin review.</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Expertise",    val: form.expertise },
                      { label: "Experience",   val: form.experience },
                      { label: "Hourly Rate",  val: form.hourlyRate ? `₹${form.hourlyRate}/hr` : "—" },
                      { label: "LinkedIn",     val: form.linkedin || "—" },
                      { label: "Skills",       val: form.skills || "—" },
                      { label: "Certificates", val: `${certs.filter(c => c.url).length} uploaded` },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                        <p className="text-gray-400 text-xs w-24 flex-shrink-0">{item.label}</p>
                        <p className="text-gray-700 text-xs font-semibold break-all">{item.val}</p>
                      </div>
                    ))}
                  </div>
                  {/* Completeness */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Completeness</p>
                    {completeness.map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className={`text-sm ${item.done ? "text-green-500" : "text-gray-300"}`}>{item.done ? "✓" : "○"}</span>
                        <span className={`text-xs ${item.done ? "text-gray-700 font-semibold" : "text-gray-400"}`}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-amber-500 font-black text-lg mt-0.5">🔍</span>
                    <div>
                      <p className="text-xs font-bold text-amber-700 mb-0.5">Admin review required</p>
                      <p className="text-xs text-amber-700">Your role will NOT be active until admin approves. This typically takes 24–48 hours.</p>
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">{error}</div>}

              {/* Navigation */}
              <div className="flex gap-3 mt-7">
                {step > 1 ? (
                  <button onClick={() => { setStep(s => s - 1); setError(""); }}
                    className="px-6 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition">← Back</button>
                ) : (
                  <Link href="/join" className="px-6 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition flex items-center">← Back</Link>
                )}
                {step < 3 ? (
                  <button onClick={nextStep}
                    className="flex-1 py-3.5 rounded-xl text-white font-black text-sm bg-[#0F6E56] hover:opacity-90 transition">
                    Next →
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting || completeness.some(c => !c.done)}
                    className="flex-1 py-3.5 rounded-xl text-white font-black text-sm bg-[#0F6E56] hover:opacity-90 transition disabled:opacity-40">
                    {submitting ? "Submitting…" : "Submit for Review →"}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </div>
  );
}