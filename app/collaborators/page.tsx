"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const HOD = {
  name: "Dr. Rajesh Kumar",
  role: "Head of Department",
  dept: "Computer Science & Engineering",
  color: "blue",
  initial: "R",
};

const MENTORS = [
  { name: "Prof. Amit Sharma",  role: "AR/VR Lab Mentor",    dept: "CSE Department",      color: "cyan", initial: "A" },
  { name: "Prof. Neha Gupta",   role: "3D Design Faculty",   dept: "Design & Innovation", color: "emerald", initial: "N" },
  { name: "Prof. Vikas Yadav",  role: "Research Coordinator",dept: "MCA Department",      color: "amber", initial: "V" },
  { name: "Prof. Sonal Mittal", role: "Industry Liaison",    dept: "IT Department",       color: "indigo", initial: "S" },
];

const OUR_TEAM = [
  { name: "Mukul",  role: "Platform Lead",     dept: "Full Stack + AR/VR", color: "blue", initial: "M" },
  { name: "Priya",  role: "3D Artist",         dept: "3D Modeling",        color: "cyan", initial: "P" },
  { name: "Rohit",  role: "AR Developer",      dept: "Unity + ARCore",     color: "emerald", initial: "R" },
  { name: "Anjali", role: "UI/UX Designer",    dept: "Design Lead",        color: "rose", initial: "A" },
  { name: "Karan",  role: "Backend Developer", dept: "Firebase + Node",    color: "amber", initial: "K" },
  { name: "Sneha",  role: "VR Developer",      dept: "Unreal + WebXR",     color: "indigo", initial: "S" },
];

const STATS = [
  { val:"500+", label:"Students Impacted", color:"indigo" },
  { val:"3",    label:"Active Labs",        color:"cyan" },
  { val:"12+",  label:"Joint Projects",    color:"emerald" },
  { val:"2022", label:"Partnership Since", color:"amber" },
];

const TAGS = ["AR/VR Labs","3D Design","Research","Internships","Live Projects","Workshops"];

function Avatar({ initial, color, size = "md" }: { initial: string; color: string; size?: "sm"|"md"|"lg" }) {
  const sz = size === "lg"
    ? "w-20 h-20 text-3xl rounded-3xl"
    : size === "md"
    ? "w-14 h-14 text-xl rounded-2xl"
    : "w-10 h-10 text-base rounded-xl";
  return (
    <div className={`${sz} flex items-center justify-center font-black flex-shrink-0 mx-auto transition duration-300 group-hover:scale-110 bg-${color}-50 text-${color}-600 border border-${color}-100`}>
      {initial}
    </div>
  );
}

type FormStatus = "idle" | "loading" | "success" | "error";

export default function CollaboratorsPage() {
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [org,        setOrg]        = useState("");
  const [message,    setMessage]    = useState("");
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [formError,  setFormError]  = useState("");

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setFormError("Please fill in all required fields.");
      return;
    }
    setFormStatus("loading");
    setFormError("");
    try {
      await addDoc(collection(db, "collaborationRequests"), {
        name:      name.trim(),
        email:     email.trim(),
        org:       org.trim(),
        message:   message.trim(),
        type:      "piet_collab",
        status:    "pending",
        createdAt: serverTimestamp(),
      });
      setFormStatus("success");
      setName(""); setEmail(""); setOrg(""); setMessage("");
    } catch(e: any) {
      setFormError("Something went wrong. Please try again.");
      setFormStatus("error");
    }
  }

  const inputCls = "w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition duration-200";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <div className="flex-grow relative z-10 pt-28 pb-24 px-4">
        <div className="max-w-7xl mx-auto">

          {/* ── HEADER ── */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} className="mb-14 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 mb-5 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-blue-800 text-xs font-bold uppercase tracking-widest">Academic Partnership</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900 leading-tight mb-6">
              PIET Panipat <span className="text-blue-600">Collaboration</span>
            </h1>
            <p className="text-gray-500 text-lg md:text-xl leading-relaxed mb-8">
              SYNTHÉ partners with PIET Panipat to bridge the gap between academia and industry in AR/VR/3D technology.
            </p>
            <a href="https://www.piet.co.in" target="_blank" rel="noopener noreferrer">
              <motion.div whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} style={{ willChange:"transform" }}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-gray-200 bg-white shadow-sm text-gray-700 text-sm font-bold cursor-pointer hover:bg-gray-50 hover:text-blue-600 transition duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Visit PIET Panipat Official Website →
              </motion.div>
            </a>
          </motion.div>

          {/* ── ABOUT CARD ── */}
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}
            className="rounded-3xl border border-gray-200 bg-white overflow-hidden p-8 md:p-12 mb-16 shadow-sm">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-3">About the Partnership</p>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-4">
                  Bridging Academia & <span className="text-blue-600">Industry</span>
                </h2>
                <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-6 font-medium">
                  PIET (Panipat Institute of Engineering & Technology) collaborates with SYNTHÉ to give students real-world exposure to AR/VR development, 3D modeling, and emerging spatial technologies. Together we run live projects, labs and internship pipelines.
                </p>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((tag,i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-xs font-bold">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {STATS.map((s,i) => (
                  <motion.div key={i} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
                    viewport={{ once:true }} transition={{ delay:i*0.1 }}
                    className="p-5 rounded-2xl border border-gray-100 bg-gray-50 text-center flex flex-col items-center justify-center">
                    <p className={`text-4xl font-black mb-2 text-${s.color}-600`}>
                      {s.val}
                    </p>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{s.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── HOD ── */}
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }} className="mb-16">
            <div className="text-center mb-10">
              <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Leadership</p>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                Head of Department
              </h2>
            </div>
            <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              className="group mx-auto max-w-sm p-8 rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
              <Avatar initial={HOD.initial} color={HOD.color} size="lg" />
              <div className="mt-5 text-center">
                <p className="text-gray-900 font-black text-xl mb-1">{HOD.name}</p>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1.5 text-${HOD.color}-600`}>{HOD.role}</p>
                <p className="text-gray-500 text-sm font-medium">{HOD.dept}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* ── MENTORS ── */}
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }} className="mb-16">
            <div className="text-center mb-10">
              <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Faculty</p>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                Our Mentors
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {MENTORS.map((m,i) => (
                <motion.div key={i}
                  initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
                  viewport={{ once:true }} transition={{ duration:0.4, delay:i*0.08 }}
                  className="group p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition duration-300 text-center flex flex-col items-center">
                  <div className="mb-5">
                    <Avatar initial={m.initial} color={m.color} size="md" />
                  </div>
                  <p className="text-gray-900 font-extrabold text-base mb-1">{m.name}</p>
                  <p className={`text-xs font-bold mb-1.5 text-${m.color}-600`}>{m.role}</p>
                  <p className="text-gray-500 text-[11px] font-medium">{m.dept}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── OUR TEAM FROM PIET ── */}
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }} className="mb-20">
            <div className="text-center mb-10">
              <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Student Team</p>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
                Our Team from PIET
              </h2>
              <p className="text-gray-500 text-sm max-w-md mx-auto">Students building SYNTHÉ from PIET Panipat campus.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {OUR_TEAM.map((t,i) => (
                <motion.div key={i}
                  initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
                  viewport={{ once:true }} transition={{ duration:0.4, delay:i*0.06 }}
                  className="group p-5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition duration-300 text-center flex flex-col items-center">
                  <div className="mb-4">
                    <Avatar initial={t.initial} color={t.color} size="sm" />
                  </div>
                  <p className="text-gray-900 text-sm font-bold line-clamp-1 mb-0.5">{t.name}</p>
                  <p className={`text-[10px] font-bold mb-1 text-${t.color}-600`}>{t.role}</p>
                  <p className="text-gray-500 text-[10px] font-medium line-clamp-1">{t.dept}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── CONTACT FORM ── */}
          <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}
            className="rounded-3xl border border-gray-200 bg-white shadow-sm p-8 md:p-14 overflow-hidden">
            
            <div className="grid lg:grid-cols-2 gap-12 items-start">

              {/* Left — copy */}
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 mb-6 shadow-sm">
                  <span className="text-blue-800 text-xs font-bold uppercase tracking-widest">Want to Partner?</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 mb-6 leading-tight">
                  Collaborate with <span className="text-blue-600">SYNTHÉ</span>
                </h2>
                <p className="text-gray-500 text-base leading-relaxed mb-8">
                  Are you an institution, lab, or organisation looking to collaborate on AR/VR/3D initiatives? Fill the form and we'll get back to you within 48 hours.
                </p>

                {/* What we offer */}
                <div className="space-y-5">
                  {[
                    { icon:"🏛️", label:"Lab Setup Support",    desc:"Help setting up AR/VR labs at your campus", color: "blue" },
                    { icon:"🎓", label:"Student Internships",  desc:"Pipeline for your students into live projects", color: "emerald" },
                    { icon:"🔬", label:"Joint Research",       desc:"Co-publish research on spatial technologies", color: "amber" },
                    { icon:"🌐", label:"Platform Access",      desc:"Free institutional access to SYNTHÉ", color: "indigo" },
                  ].map((item,i) => (
                    <motion.div key={i} initial={{ opacity:0, x:-12 }} whileInView={{ opacity:1, x:0 }}
                      viewport={{ once:true }} transition={{ delay:i*0.08 }}
                      className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl bg-${item.color}-50 border border-${item.color}-100 flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
                        {item.icon}
                      </div>
                      <div className="pt-1">
                        <p className="text-gray-900 font-extrabold text-sm">{item.label}</p>
                        <p className="text-gray-500 text-sm mt-0.5 font-medium">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right — form */}
              <div className="relative bg-gray-50 border border-gray-200 rounded-3xl p-6 md:p-8">
                <AnimatePresence mode="wait">
                  {formStatus === "success" ? (
                    <motion.div key="success"
                      initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                      transition={{ duration:0.3 }}
                      className="flex flex-col items-center justify-center py-16 text-center">
                      <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                        transition={{ type:"spring", stiffness:300, damping:20, delay:0.1 }}
                        className="w-16 h-16 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center mb-5 shadow-sm">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                      <h3 className="text-2xl font-black text-gray-900 mb-2">Message Sent!</h3>
                      <p className="text-gray-500 text-sm mb-8 font-medium">We'll get back to you within 48 hours.</p>
                      <button onClick={() => setFormStatus("idle")}
                        className="text-blue-600 hover:text-blue-700 text-sm font-bold transition duration-200 bg-white border border-gray-200 px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md">
                        Send another message
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form key="form" onSubmit={handleContact} className="flex flex-col gap-5">
                      <h3 className="text-xl font-black text-gray-900 mb-1">Send a Message</h3>
                      <AnimatePresence>
                        {formError && (
                          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 overflow-hidden shadow-sm">
                            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-700 font-semibold text-xs">{formError}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                          Your Name <span className="text-red-500">*</span>
                        </label>
                        <input value={name} onChange={e=>setName(e.target.value)}
                          placeholder="Dr. / Prof. / Your full name"
                          className={inputCls} />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                          placeholder="you@institution.ac.in"
                          className={inputCls} />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                          Organisation / Institution
                        </label>
                        <input value={org} onChange={e=>setOrg(e.target.value)}
                          placeholder="e.g. PIET Panipat, IIT Delhi…"
                          className={inputCls} />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                          Message <span className="text-red-500">*</span>
                        </label>
                        <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4}
                          placeholder="Tell us about your collaboration idea, what you need, and how we can work together…"
                          className={`${inputCls} resize-none`} />
                      </div>

                      <motion.button type="submit" disabled={formStatus === "loading"}
                        whileHover={{ scale: formStatus === "loading" ? 1 : 1.01 }}
                        whileTap={{ scale: formStatus === "loading" ? 1 : 0.99 }}
                        className={`relative w-full py-4 font-bold text-white rounded-xl shadow-sm overflow-hidden disabled:opacity-60 text-sm cursor-pointer transition ${formStatus==="loading" ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}>
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {formStatus === "loading" ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                              Sending…
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Send Message
                            </>
                          )}
                        </span>
                      </motion.button>

                      <p className="text-center text-gray-400 font-medium text-xs mt-2">
                        Or visit{" "}
                        <a href="https://www.piet.co.in" target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 transition duration-200 font-bold">
                          piet.co.in
                        </a>{" "}
                        for more info
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
      <Footer />
    </div>
  );
}