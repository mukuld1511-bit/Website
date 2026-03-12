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
  color: "#a78bfa",
  initial: "R",
};

const MENTORS = [
  { name: "Prof. Amit Sharma",  role: "AR/VR Lab Mentor",    dept: "CSE Department",      color: "#22d3ee", initial: "A" },
  { name: "Prof. Neha Gupta",   role: "3D Design Faculty",   dept: "Design & Innovation", color: "#34d399", initial: "N" },
  { name: "Prof. Vikas Yadav",  role: "Research Coordinator",dept: "MCA Department",      color: "#fbbf24", initial: "V" },
  { name: "Prof. Sonal Mittal", role: "Industry Liaison",    dept: "IT Department",       color: "#818cf8", initial: "S" },
];

const OUR_TEAM = [
  { name: "Mukul",  role: "Platform Lead",     dept: "Full Stack + AR/VR", color: "#a78bfa", initial: "M" },
  { name: "Priya",  role: "3D Artist",         dept: "3D Modeling",        color: "#22d3ee", initial: "P" },
  { name: "Rohit",  role: "AR Developer",      dept: "Unity + ARCore",     color: "#34d399", initial: "R" },
  { name: "Anjali", role: "UI/UX Designer",    dept: "Design Lead",        color: "#fb7185", initial: "A" },
  { name: "Karan",  role: "Backend Developer", dept: "Firebase + Node",    color: "#fbbf24", initial: "K" },
  { name: "Sneha",  role: "VR Developer",      dept: "Unreal + WebXR",     color: "#818cf8", initial: "S" },
];

const STATS = [
  { val:"500+", label:"Students Impacted", color:"#818cf8" },
  { val:"3",    label:"Active Labs",        color:"#22d3ee" },
  { val:"12+",  label:"Joint Projects",    color:"#34d399" },
  { val:"2022", label:"Partnership Since", color:"#fbbf24" },
];

const TAGS = ["AR/VR Labs","3D Design","Research","Internships","Live Projects","Workshops"];

function Avatar({ initial, color, size = "md" }: { initial: string; color: string; size?: "sm"|"md"|"lg" }) {
  const sz = size === "lg"
    ? "w-20 h-20 text-3xl rounded-3xl"
    : size === "md"
    ? "w-14 h-14 text-xl rounded-2xl"
    : "w-10 h-10 text-base rounded-xl";
  return (
    <div className={`${sz} flex items-center justify-center font-black flex-shrink-0 mx-auto transition duration-300 group-hover:scale-110`}
      style={{ background:`${color}18`, border:`1.5px solid ${color}30`, color }}>
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

  const inputCls = "w-full bg-white/[0.03] border border-white/8 text-white placeholder-white/25 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_20px_rgba(129,140,248,0.08)] transition duration-200";

  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background:"radial-gradient(circle,#818cf8,transparent 70%)", filter:"blur(80px)" }} />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full opacity-[0.06]"
          style={{ background:"radial-gradient(circle,#22d3ee,transparent 70%)", filter:"blur(80px)" }} />
        <div className="absolute top-[60%] left-[50%] w-[300px] h-[300px] rounded-full opacity-[0.04]"
          style={{ background:"radial-gradient(circle,#a78bfa,transparent 70%)", filter:"blur(80px)" }} />
      </div>

      <div className="relative z-10 pt-28 pb-24 px-4">
        <div className="max-w-7xl mx-auto">

          {/* ── HEADER ── */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} className="mb-14">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm mb-5">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-indigo-300/90 text-sm font-semibold uppercase tracking-widest">Academic Partnership</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none mb-4">
              PIET Panipat{" "}
              <span style={{ backgroundImage:"linear-gradient(90deg,#818cf8,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                Collaboration
              </span>
            </h1>
            <p className="text-white/40 text-lg max-w-2xl leading-relaxed mb-6">
              SYNTHÉ partners with PIET Panipat to bridge the gap between academia and industry in AR/VR/3D technology.
            </p>
            <a href="https://www.piet.co.in" target="_blank" rel="noopener noreferrer">
              <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }} style={{ willChange:"transform" }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-black cursor-pointer hover:border-indigo-500/50 transition duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Visit PIET Panipat Official Website →
              </motion.div>
            </a>
          </motion.div>

          {/* ── ABOUT CARD ── */}
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}
            className="relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl overflow-hidden p-8 md:p-12 mb-14">
            <div className="absolute top-0 left-0 right-0 h-[1px]"
              style={{ background:"linear-gradient(90deg,transparent,rgba(129,140,248,0.5),rgba(34,211,238,0.4),transparent)" }} />
            <div className="absolute inset-0 pointer-events-none"
              style={{ background:"radial-gradient(ellipse at top left,rgba(129,140,248,0.06),transparent 60%)" }} />

            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-3">About the Partnership</p>
                <h2 className="text-3xl font-black text-white tracking-tighter mb-4">
                  Bridging Academia &{" "}
                  <span style={{ backgroundImage:"linear-gradient(90deg,#818cf8,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                    Industry
                  </span>
                </h2>
                <p className="text-white/40 text-sm leading-relaxed mb-6">
                  PIET (Panipat Institute of Engineering & Technology) collaborates with SYNTHÉ to give students real-world exposure to AR/VR development, 3D modeling, and emerging spatial technologies. Together we run live projects, labs and internship pipelines.
                </p>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((tag,i) => (
                    <span key={i} className="px-3 py-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/8 text-indigo-300 text-xs font-bold">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {STATS.map((s,i) => (
                  <motion.div key={i} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
                    viewport={{ once:true }} transition={{ delay:i*0.1 }}
                    className="relative p-5 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                    <div className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                      style={{ background:`linear-gradient(90deg,transparent,${s.color}40,transparent)` }} />
                    <p className="text-3xl font-black mb-1"
                      style={{ backgroundImage:`linear-gradient(135deg,${s.color},white)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                      {s.val}
                    </p>
                    <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">{s.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── HOD ── */}
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }} className="mb-14">
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Leadership</p>
            <h2 className="text-3xl font-black text-white tracking-tighter mb-8">
              Head of{" "}
              <span style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                Department
              </span>
            </h2>
            <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              className="group relative max-w-xs p-8 rounded-3xl border border-violet-500/20 bg-white/[0.025] backdrop-blur-xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px]"
                style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.5),transparent)" }} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"
                style={{ background:"radial-gradient(ellipse at top,rgba(167,139,250,0.06),transparent 70%)" }} />
              <Avatar initial={HOD.initial} color={HOD.color} size="lg" />
              <div className="mt-5 text-center">
                <p className="text-white font-black text-lg mb-1">{HOD.name}</p>
                <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color:HOD.color }}>{HOD.role}</p>
                <p className="text-white/30 text-xs">{HOD.dept}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* ── MENTORS ── */}
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }} className="mb-14">
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Faculty</p>
            <h2 className="text-3xl font-black text-white tracking-tighter mb-8">
              Our{" "}
              <span style={{ backgroundImage:"linear-gradient(90deg,#22d3ee,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                Mentors
              </span>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {MENTORS.map((m,i) => (
                <motion.div key={i}
                  initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
                  viewport={{ once:true }} transition={{ duration:0.4, delay:i*0.08 }}
                  className="group relative p-6 rounded-2xl border border-white/6 bg-white/[0.025] hover:border-white/14 transition duration-300 text-center overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[1px]"
                    style={{ background:`linear-gradient(90deg,transparent,${m.color}35,transparent)` }} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"
                    style={{ background:`radial-gradient(ellipse at top,${m.color}08,transparent 70%)` }} />
                  <div className="mb-4 flex justify-center">
                    <Avatar initial={m.initial} color={m.color} size="md" />
                  </div>
                  <p className="text-white font-black text-sm mb-1">{m.name}</p>
                  <p className="text-xs font-bold mb-1" style={{ color:m.color }}>{m.role}</p>
                  <p className="text-white/25 text-[10px]">{m.dept}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── OUR TEAM FROM PIET ── */}
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }} className="mb-14">
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Student Team</p>
            <h2 className="text-3xl font-black text-white tracking-tighter mb-2">
              Our Team{" "}
              <span style={{ backgroundImage:"linear-gradient(90deg,#fb7185,#818cf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                from PIET
              </span>
            </h2>
            <p className="text-white/30 text-sm mb-8">Students building SYNTHÉ from PIET Panipat campus.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {OUR_TEAM.map((t,i) => (
                <motion.div key={i}
                  initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
                  viewport={{ once:true }} transition={{ duration:0.4, delay:i*0.06 }}
                  className="group relative p-5 rounded-2xl border border-white/6 bg-white/[0.025] hover:border-white/14 transition duration-300 text-center overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[1px]"
                    style={{ background:`linear-gradient(90deg,transparent,${t.color}25,transparent)` }} />
                  <div className="mb-3 flex justify-center">
                    <Avatar initial={t.initial} color={t.color} size="sm" />
                  </div>
                  <p className="text-white/80 text-xs font-black line-clamp-1 mb-0.5">{t.name}</p>
                  <p className="text-[10px] font-bold mb-0.5" style={{ color:t.color }}>{t.role}</p>
                  <p className="text-white/20 text-[9px] line-clamp-1">{t.dept}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── CONTACT FORM ── */}
          <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}
            className="relative rounded-3xl border border-indigo-500/15 bg-white/[0.025] backdrop-blur-xl overflow-hidden p-8 md:p-14">
            <div className="absolute top-0 left-0 right-0 h-[1px]"
              style={{ background:"linear-gradient(90deg,transparent,rgba(129,140,248,0.5),transparent)" }} />
            <div className="absolute inset-0 pointer-events-none"
              style={{ background:"radial-gradient(ellipse at center,rgba(129,140,248,0.05),transparent 70%)" }} />

            <div className="grid md:grid-cols-2 gap-12 items-start">

              {/* Left — copy */}
              <div>
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 mb-6">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-indigo-300/90 text-sm font-semibold uppercase tracking-widest">Want to Partner?</span>
                </div>
                <h2 className="text-4xl font-black tracking-tighter text-white mb-4 leading-none">
                  Collaborate with{" "}
                  <span style={{ backgroundImage:"linear-gradient(90deg,#818cf8,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                    SYNTHÉ
                  </span>
                </h2>
                <p className="text-white/40 text-sm leading-relaxed mb-8">
                  Are you an institution, lab, or organisation looking to collaborate on AR/VR/3D initiatives? Fill the form and we'll get back to you within 48 hours.
                </p>

                {/* What we offer */}
                <div className="space-y-4">
                  {[
                    { icon:"🏛️", label:"Lab Setup Support",    desc:"Help setting up AR/VR labs at your campus" },
                    { icon:"🎓", label:"Student Internships",  desc:"Pipeline for your students into live projects" },
                    { icon:"🔬", label:"Joint Research",       desc:"Co-publish research on spatial technologies" },
                    { icon:"🌐", label:"Platform Access",      desc:"Free institutional access to SYNTHÉ" },
                  ].map((item,i) => (
                    <motion.div key={i} initial={{ opacity:0, x:-12 }} whileInView={{ opacity:1, x:0 }}
                      viewport={{ once:true }} transition={{ delay:i*0.08 }}
                      className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/12 border border-indigo-500/20 flex items-center justify-center text-base flex-shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-white font-black text-sm">{item.label}</p>
                        <p className="text-white/30 text-xs mt-0.5">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right — form */}
              <div className="relative">
                <AnimatePresence mode="wait">
                  {formStatus === "success" ? (
                    <motion.div key="success"
                      initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                      transition={{ duration:0.4 }}
                      className="flex flex-col items-center justify-center py-16 text-center">
                      <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                        transition={{ type:"spring", stiffness:300, damping:20, delay:0.1 }}
                        style={{ willChange:"transform" }}
                        className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-5">
                        <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                      <h3 className="text-2xl font-black text-white mb-2">Message Sent! 🎉</h3>
                      <p className="text-white/40 text-sm mb-6">We'll get back to you within 48 hours.</p>
                      <button onClick={() => setFormStatus("idle")}
                        className="text-indigo-400/70 hover:text-indigo-300 text-sm font-bold transition duration-200">
                        Send another message →
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form key="form" onSubmit={handleContact} className="flex flex-col gap-4">

                      <AnimatePresence>
                        {formError && (
                          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-500/20 bg-rose-500/8 overflow-hidden">
                            <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-rose-400 text-sm">{formError}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-2">
                          Your Name <span className="text-indigo-400">*</span>
                        </label>
                        <input value={name} onChange={e=>setName(e.target.value)}
                          placeholder="Dr. / Prof. / Your full name"
                          className={inputCls} />
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-2">
                          Email Address <span className="text-indigo-400">*</span>
                        </label>
                        <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                          placeholder="you@institution.ac.in"
                          className={inputCls} />
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-2">
                          Organisation / Institution
                        </label>
                        <input value={org} onChange={e=>setOrg(e.target.value)}
                          placeholder="e.g. PIET Panipat, IIT Delhi…"
                          className={inputCls} />
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-2">
                          Message <span className="text-indigo-400">*</span>
                        </label>
                        <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4}
                          placeholder="Tell us about your collaboration idea, what you need, and how we can work together…"
                          className={`${inputCls} resize-none`} />
                      </div>

                      <motion.button type="submit" disabled={formStatus === "loading"}
                        whileHover={{ scale: formStatus === "loading" ? 1 : 1.02 }}
                        whileTap={{ scale: formStatus === "loading" ? 1 : 0.98 }}
                        style={{ willChange:"transform", background: formStatus === "loading" ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#818cf8,#22d3ee)" }}
                        className="relative w-full py-4 font-black text-white rounded-2xl overflow-hidden disabled:opacity-60 text-sm cursor-pointer">
                        {formStatus !== "loading" && (
                          <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                            style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                        )}
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

                      <p className="text-center text-white/20 text-xs">
                        Or visit{" "}
                        <a href="https://www.piet.co.in" target="_blank" rel="noopener noreferrer"
                          className="text-indigo-400/70 hover:text-indigo-300 transition duration-200 font-semibold">
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