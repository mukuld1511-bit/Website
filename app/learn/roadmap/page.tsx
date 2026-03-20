"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateRoadmap as generateRoadmapAI } from "@/lib/openai";

interface RoadmapPhase {
  phase:       number;
  title:       string;
  duration:    string;
  description: string;
  topics:      string[];
  tools:       string[];
  milestone:   string;
}

interface GeneratedRoadmap {
  title:         string;
  summary:       string;
  totalDuration: string;
  phases:        RoadmapPhase[];
  nextStep:      string;
}

const GOALS = [
  { id: "hobby",   label: "Hobby & fun",     sub: "Explore for joy",        color: "from-orange-400 to-pink-500" },
  { id: "career",  label: "Career switch",   sub: "Land a new role",        color: "from-blue-500 to-violet-600" },
  { id: "college", label: "College project", sub: "Ace your submission",    color: "from-teal-400 to-cyan-500" },
  { id: "startup", label: "Build a product", sub: "Ship something real",    color: "from-violet-500 to-purple-700" },
];

const LEVELS = [
  { id: "zero", label: "Complete beginner", desc: "Never coded before" },
  { id: "some", label: "Some background",   desc: "Know the basics" },
  { id: "dev",  label: "Experienced dev",   desc: "Ready to go deep" },
];

const STYLES = [
  { id: "visual",  label: "Watch & learn",  icon: "▶" },
  { id: "handson", label: "Build projects", icon: "⚒" },
  { id: "reading", label: "Docs & reading", icon: "◎" },
  { id: "mixed",   label: "Mix of all",     icon: "◈" },
];

const AGE_GROUPS = [
  { id: "under14", label: "Under 14" },
  { id: "14to18",  label: "14 – 18" },
  { id: "18to25",  label: "18 – 25" },
  { id: "25plus",  label: "25+" },
];

const PHASE_ACCENTS = [
  { num: "bg-violet-600", bar: "bg-violet-500", chip: "bg-violet-50 text-violet-700 border-violet-200" },
  { num: "bg-teal-600",   bar: "bg-teal-500",   chip: "bg-teal-50 text-teal-700 border-teal-200"     },
  { num: "bg-orange-500", bar: "bg-orange-400",  chip: "bg-orange-50 text-orange-700 border-orange-200" },
  { num: "bg-blue-600",   bar: "bg-blue-500",    chip: "bg-blue-50 text-blue-700 border-blue-200"     },
  { num: "bg-pink-600",   bar: "bg-pink-500",    chip: "bg-pink-50 text-pink-700 border-pink-200"     },
  { num: "bg-green-600",  bar: "bg-green-500",   chip: "bg-green-50 text-green-700 border-green-200"  },
];

export default function RoadmapPage() {
  const [step,          setStep]          = useState<"form" | "loading" | "result">("form");
  const [ageGroup,      setAgeGroup]      = useState("");
  const [goal,          setGoal]          = useState("");
  const [level,         setLevel]         = useState("");
  const [style,         setStyle]         = useState("");
  const [interests,     setInterests]     = useState("");
  const [roadmap,       setRoadmap]       = useState<GeneratedRoadmap | null>(null);
  const [error,         setError]         = useState("");
  const [loadingText,   setLoadingText]   = useState("Analysing your profile...");
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);

  const canGenerate = ageGroup && goal && level && style;
  const progress    = [ageGroup, goal, level, style].filter(Boolean).length;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setStep("loading");
    setError("");

    const messages = [
      "Analysing your profile...",
      "Mapping the XR ecosystem...",
      "Selecting tools for you...",
      "Building your path...",
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoadingText(messages[i]);
    }, 1200);

    try {
      // generateRoadmap from lib/openai.ts returns JSON string — parse it
      const raw = await generateRoadmapAI({
        age:        ageGroup,
        goal:       `${goal}${interests ? ` — interests: ${interests}` : ""}`,
        experience: level,
        style,
      });
      clearInterval(interval);
      const result: GeneratedRoadmap = typeof raw === "string" ? JSON.parse(raw) : raw;
      setRoadmap(result);
      setStep("result");
      setExpandedPhase(0);
    } catch {
      clearInterval(interval);
      setError("Something went wrong. Please try again.");
      setStep("form");
    }
  };

  const reset = () => {
    setStep("form"); setRoadmap(null);
    setAgeGroup(""); setGoal(""); setLevel(""); setStyle(""); setInterests("");
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3]">

      {/* ── TOP BAR ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-none">XR Roadmap</p>
              <p className="text-xs text-gray-400 mt-0.5">Powered by GPT-4o mini</p>
            </div>
          </div>
          {step === "result" && (
            <button onClick={reset} className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 transition-all">
              ← Start over
            </button>
          )}
          {step === "form" && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[0,1,2,3].map(i => (
                  <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i < progress ? "bg-violet-500" : "bg-gray-200"}`} />
                ))}
              </div>
              <span className="text-xs text-gray-400">{progress}/4</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">

          {/* ── FORM ── */}
          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="mb-10">
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                  Your personal<br />
                  <span className="text-violet-600">XR learning path</span>
                </h1>
                <p className="text-gray-500 mt-3 text-base max-w-md">
                  Answer 4 questions. AI builds a step-by-step roadmap made exactly for you.
                </p>
              </div>

              <div className="space-y-10">

                {/* Age */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-semibold">1</span>
                    <p className="text-sm font-semibold text-gray-800">How old are you?</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {AGE_GROUPS.map(a => (
                      <button key={a.id} onClick={() => setAgeGroup(a.id)}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium border-2 transition-all ${
                          ageGroup === a.id ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                        }`}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goal */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-semibold">2</span>
                    <p className="text-sm font-semibold text-gray-800">What is your goal?</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {GOALS.map(g => (
                      <button key={g.id} onClick={() => setGoal(g.id)}
                        className={`relative p-4 rounded-2xl border-2 text-left transition-all overflow-hidden ${
                          goal === g.id ? "border-violet-500" : "bg-white border-gray-200 hover:border-gray-300"
                        }`}>
                        {goal === g.id && <div className={`absolute inset-0 bg-gradient-to-br ${g.color} opacity-10`} />}
                        <p className="text-sm font-semibold text-gray-900 relative">{g.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5 relative">{g.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-semibold">3</span>
                    <p className="text-sm font-semibold text-gray-800">Your experience level</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {LEVELS.map(l => (
                      <button key={l.id} onClick={() => setLevel(l.id)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                          level === l.id ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}>
                        <p className="text-sm font-semibold">{l.label}</p>
                        <p className={`text-xs mt-0.5 ${level === l.id ? "text-violet-200" : "text-gray-400"}`}>{l.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-semibold">4</span>
                    <p className="text-sm font-semibold text-gray-800">How do you learn best?</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {STYLES.map(s => (
                      <button key={s.id} onClick={() => setStyle(s.id)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                          style === s.id ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}>
                        <p className="text-lg mb-1">{s.icon}</p>
                        <p className="text-sm font-medium">{s.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    Any specific interests? <span className="text-gray-400 font-normal">(optional)</span>
                  </p>
                  <input type="text" value={interests} onChange={e => setInterests(e.target.value)}
                    placeholder="e.g. games, architecture, medical VR, WebXR..."
                    className="w-full bg-white border-2 border-gray-200 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors" />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
                )}

                <button onClick={handleGenerate} disabled={!canGenerate}
                  className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all ${
                    canGenerate
                      ? "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}>
                  {canGenerate ? "Generate my roadmap →" : `Complete ${4 - progress} more step${4 - progress !== 1 ? "s" : ""} to continue`}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── LOADING ── */}
          {step === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-40 gap-8">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
                <div className="absolute inset-0 rounded-full border-4 border-t-violet-600 animate-spin" />
                <div className="absolute inset-3 rounded-full border-4 border-t-violet-300 animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.7s" }} />
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-gray-900">{loadingText}</p>
                <p className="text-gray-400 text-sm mt-2">AI is crafting your personal XR path</p>
              </div>
            </motion.div>
          )}

          {/* ── RESULT ── */}
          {step === "result" && roadmap && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

              {/* Hero banner */}
              <div className="bg-gray-900 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3 py-1 rounded-full">AI Generated</span>
                    <span className="text-xs text-gray-500">{roadmap.phases.length} phases · {roadmap.totalDuration}</span>
                  </div>
                  <h2 className="text-3xl font-bold text-white leading-tight mb-3">{roadmap.title}</h2>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">{roadmap.summary}</p>
                  <div className="flex gap-6 mt-6 pt-6 border-t border-white/10">
                    <div>
                      <p className="text-2xl font-bold text-white">{roadmap.totalDuration}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Total duration</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{roadmap.phases.length}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Phases</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {roadmap.phases.reduce((a, p) => a + p.tools.length, 0)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Tools covered</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline phases */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Your learning phases</p>
                <div className="relative">
                  <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gray-200" />
                  <div className="space-y-3">
                    {roadmap.phases.map((phase, idx) => {
                      const accent = PHASE_ACCENTS[idx % PHASE_ACCENTS.length];
                      const isOpen = expandedPhase === idx;
                      return (
                        <motion.div key={phase.phase} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.07 }} className="relative pl-14">
                          <div className={`absolute left-2.5 top-4 w-5 h-5 rounded-full ${accent.num} flex items-center justify-center z-10`}>
                            <span className="text-white text-xs font-bold">{phase.phase}</span>
                          </div>
                          <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all hover:border-gray-300 ${isOpen ? "border-gray-300" : ""}`}>
                            <button className="w-full flex items-center gap-4 px-5 py-4 text-left"
                              onClick={() => setExpandedPhase(isOpen ? null : idx)}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-sm font-semibold text-gray-900">{phase.title}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${accent.chip}`}>{phase.duration}</span>
                                </div>
                                <p className="text-xs text-gray-500 truncate">{phase.description}</p>
                              </div>
                              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                                className={`text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                  <div className="px-5 pb-5 border-t border-gray-100 pt-4 grid sm:grid-cols-3 gap-5">
                                    <div>
                                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Topics</p>
                                      <ul className="space-y-2">
                                        {phase.topics.map((t, i) => (
                                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${accent.bar}`} />{t}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Tools</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {phase.tools.map((t, i) => (
                                          <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg font-medium">{t}</span>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Milestone</p>
                                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                                        <div className={`w-6 h-6 rounded-lg ${accent.num} flex items-center justify-center mb-2`}>
                                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                          </svg>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-snug">{phase.milestone}</p>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Next step */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-1">Start today</p>
                  <p className="text-sm text-amber-800 leading-relaxed">{roadmap.nextStep}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 flex-wrap">
                <a href="/learn" className="flex-1 text-center py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors">
                  Browse live sessions →
                </a>
                <a href="/hire" className="flex-1 text-center py-3.5 rounded-xl bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-800 text-sm font-semibold transition-colors">
                  Book a mentor
                </a>
                <button onClick={reset} className="px-5 py-3.5 rounded-xl bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-500 text-sm transition-colors">
                  Regenerate
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}