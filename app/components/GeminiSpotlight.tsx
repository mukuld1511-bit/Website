"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const AI_FEATURES = [
  {
    id: "roadmap",
    title: "Custom XR Roadmap",
    short: "Personalised 4–6 phase learning path",
    desc: "Tell the AI your age, goal, and experience level. Get a step-by-step XR roadmap with tools, milestones, and a first action for today — in under 5 seconds.",
    href: "/learn/roadmap",
    cta: "Generate roadmap",
    color: "#5B4BDB",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
  {
    id: "chat",
    title: "XR Concept Chat",
    short: "Ask anything about AR, VR, WebXR",
    desc: "A live AI chat on the Learn page. Ask 'what is SLAM?', 'how does WebXR work?', 'best tool for Unity AR?' — GPT-4o mini answers in plain language, tuned to your role.",
    href: "/learn",
    cta: "Ask a question",
    color: "#0F6E56",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
  {
    id: "tools",
    title: "AI Tool Recommender",
    short: "Best tool for your specific goal",
    desc: "Type what you want to build inside the Tools Directory. AI reads all 48 tools and recommends the best 2–3 with reasons. No more guessing.",
    href: "/learn/tools",
    cta: "Find my tool",
    color: "#B45309",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    id: "writer",
    title: "Model Description Writer",
    short: "Auto-write title, tags & price",
    desc: "When uploading a 3D model, AI reads your filename and category then writes a polished title, description, 5 tags, and a suggested price — one click.",
    href: "/verse/upload",
    cta: "Try on upload",
    color: "#9D174D",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
];

export default function AISpotlight() {
  const [active, setActive] = useState(0);
  const f = AI_FEATURES[active];

  return (
    <section className="py-20 px-4 bg-gray-950 border-y border-gray-800">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
              <div className="w-4 h-4 rounded-md bg-violet-600 flex items-center justify-center">
                <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <span className="text-xs font-bold text-violet-300 uppercase tracking-widest">GPT-4o mini built-in</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              AI that actually helps<br />you learn XR
            </h2>
          </div>
          <p className="text-gray-500 text-sm max-w-xs leading-relaxed sm:text-right">
            4 AI-powered features across SYNTHÉ — roadmaps, chat, tool recommendations, and auto-descriptions.
          </p>
        </motion.div>

        {/* Tab selector */}
        <div className="flex gap-2 flex-wrap mb-8">
          {AI_FEATURES.map((feat, i) => (
            <button key={feat.id} onClick={() => setActive(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                active === i
                  ? "bg-white text-gray-900"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200 border border-white/10"
              }`}>
              {feat.title}
            </button>
          ))}
        </div>

        {/* Feature panel */}
        <AnimatePresence mode="wait">
          <motion.div key={f.id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 grid sm:grid-cols-2 gap-8 items-center">

            {/* Left — text */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">{f.short}</p>
              <h3 className="text-2xl font-black text-white mb-4">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">{f.desc}</p>
              <Link href={f.href}>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: f.color }}>
                  {f.cta}
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </button>
              </Link>
            </div>

            {/* Right — mock UI preview */}
            <div className={`${f.bg} ${f.border} border rounded-xl p-5 space-y-3`}>
              {f.id === "roadmap" && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center">
                      <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <p className="text-xs font-bold text-violet-700">Your XR Roadmap — 4 months</p>
                  </div>
                  {["Phase 1 — Fundamentals · 2 weeks","Phase 2 — A-Frame & WebXR · 3 weeks","Phase 3 — Unity AR · 4 weeks","Phase 4 — Ship your app · 2 weeks"].map((p, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2.5 border border-violet-100">
                      <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i+1}</div>
                      <p className="text-xs text-gray-700 font-medium">{p}</p>
                    </div>
                  ))}
                </>
              )}
              {f.id === "chat" && (
                <>
                  <div className="flex justify-start mb-1">
                    <div className="bg-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-gray-700 max-w-[80%]">What is WebXR and how does it work?</div>
                  </div>
                  <div className="flex justify-start">
                    <div className="flex gap-2 max-w-[90%]">
                      <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      </div>
                      <div className="bg-white border border-teal-200 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-gray-700 leading-relaxed">
                        WebXR is a browser API that lets you build AR and VR directly in Chrome or Safari — no app download needed. Think of it like HTML but for 3D space. <span className="font-semibold text-teal-700">Tip: Start with A-Frame to learn the basics in 1 hour.</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-1">
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-400">Ask about AR, VR, or XR tools...</div>
                  </div>
                </>
              )}
              {f.id === "tools" && (
                <>
                  <div className="bg-white rounded-lg border border-amber-200 px-3 py-2 text-xs text-gray-600 flex items-center gap-2">
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    I want to build AR for Android without an app...
                  </div>
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-xs text-violet-900 leading-relaxed">
                    <span className="font-bold">AI recommends:</span> Use <span className="font-bold">WebXR API</span> for zero-install browser AR, or <span className="font-bold">8th Wall</span> for advanced tracking. Both run in Chrome on Android with no download required.
                  </div>
                </>
              )}
              {f.id === "writer" && (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">File: astronaut_v2.glb</p>
                  <div className="space-y-2">
                    <div className="bg-white border border-rose-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-400 mb-0.5">Title</p>
                      <p className="text-xs font-semibold text-gray-800">Astronaut Space Explorer GLB Model</p>
                    </div>
                    <div className="bg-white border border-rose-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-400 mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {["astronaut","space","character","GLB","AR-ready"].map(t => (
                          <span key={t} className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex justify-between items-center">
                      <p className="text-xs text-amber-700">Suggested price</p>
                      <p className="text-xs font-bold text-amber-900">₹299 – ₹499</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}