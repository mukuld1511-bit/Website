"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadContext, clearContext } from "@/lib/services/adaptiveEngine";
import type { FinalizedOutput, FinalizedStep, AdaptiveContext } from "@/lib/services/types";
import Footer from "../components/Footer";
import Link from "next/link";

const PRIORITY_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  P0: { label: "Must Do", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  P1: { label: "Important", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  P2: { label: "Nice to Have", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
};

export default function FinalizePage() {
  const [input, setInput] = useState("");
  const [plan, setPlan] = useState<FinalizedOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [adaptive, setAdaptive] = useState<AdaptiveContext | null>(null);
  const [latency, setLatency] = useState<Record<string, number>>({});

  useEffect(() => {
    setAdaptive(loadContext());
  }, []);

  const handleFinalize = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setPlan(null);

    try {
      const ctx = loadContext();
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "finalize",
          raw: input,
          context: ctx,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || "Pipeline failed. Please try again.");
        setLoading(false);
        return;
      }

      setPlan(result.output as FinalizedOutput);
      setAdaptive(result.adaptive);
      setLatency(result.metadata?.layers ?? {});
      setExpandedStep(0);
    } catch (e) {
      setError("Failed to generate action plan. Please try again.");
      console.error(e);
    }
    setLoading(false);
  };

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalChecklistItems = plan?.steps.reduce((s, step) => s + step.checklist.length, 0) ?? 0;
  const completedItems = checkedItems.size;
  const progressPercent = totalChecklistItems > 0 ? Math.round((completedItems / totalChecklistItems) * 100) : 0;

  const copyPlan = () => {
    if (!plan) return;
    const text = plan.steps
      .map((s) => `## Step ${s.order} [${s.priority}]: ${s.title}\n${s.description}\n\nChecklist:\n${s.checklist.map((c) => `- [ ] ${c}`).join("\n")}`)
      .join("\n\n");
    navigator.clipboard.writeText(`# ${plan.title}\n\n${plan.summary}\n\n${text}`);
  };

  // Reorder steps by execution order if available
  const orderedSteps: FinalizedStep[] = plan
    ? (plan.executionOrder ?? plan.steps.map(s => s.order))
        .map(order => plan.steps.find(s => s.order === order))
        .filter(Boolean) as FinalizedStep[]
    : [];

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col font-sans">
      <div className="max-w-4xl mx-auto px-4 py-12 flex-grow w-full pt-24">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/learn/roadmap"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-semibold mb-4 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Roadmap
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#5B4BDB] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Finalize Your Plan</h1>
              <p className="text-gray-500 text-sm">AI Execution Pipeline — structured, priority-ranked action plans</p>
            </div>
          </div>

          {/* Adaptive context indicator */}
          {adaptive && adaptive.queryCount > 1 && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-700">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-semibold">Adaptive mode</span>
              <span className="text-violet-500">·</span>
              <span>Level: {adaptive.skillLevel}</span>
              <span className="text-violet-500">·</span>
              <span>{adaptive.queryCount} queries tracked</span>
              {adaptive.patterns.length > 0 && (
                <>
                  <span className="text-violet-500">·</span>
                  <span>{adaptive.patterns.length} patterns detected</span>
                </>
              )}
              <button onClick={() => { clearContext(); setAdaptive(loadContext()); }} className="ml-auto text-violet-400 hover:text-violet-600 transition">Reset</button>
            </div>
          )}
        </div>

        {/* Input area */}
        {!plan && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={"Paste your roadmap, AI recommendation, or any plan here...\n\nThe pipeline will:\n1. Sanitize & structure your input\n2. Generate execution steps via Gemini AI\n3. Assign priorities (P0/P1/P2) and dependencies\n4. Adapt based on your learning history"}
                rows={10}
                className="w-full px-6 py-5 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none leading-relaxed"
              />
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-400">{input.length} characters</p>
                <button
                  onClick={handleFinalize}
                  disabled={!input.trim() || loading}
                  className="px-6 py-2.5 rounded-xl bg-[#5B4BDB] text-white text-sm font-bold hover:bg-[#4c3ec7] transition-all disabled:opacity-40 disabled:cursor-not-allowed border-b-[3px] border-[#4438b8] active:translate-y-[1px]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Running pipeline...
                    </span>
                  ) : (
                    "✨ Execute Pipeline"
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
            )}

            {/* Pipeline diagram */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Data Flow</p>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                {["Your Input", "Prompt Controller", "Gemini AI", "Finalizer", "Priority Ranking", "Structured Output"].map((label, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-lg font-semibold ${i === 0 ? "bg-gray-900 text-white" : i === 2 ? "bg-[#5B4BDB] text-white" : "bg-gray-100 text-gray-700"}`}>
                      {label}
                    </span>
                    {i < 5 && <span className="text-gray-300">→</span>}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Output */}
        {plan && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Plan header */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900 mb-1">{plan.title}</h2>
                  <p className="text-gray-500 text-sm leading-relaxed">{plan.summary}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={copyPlan}
                    className="px-3 py-2 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => { setPlan(null); setCheckedItems(new Set()); setAdaptive(loadContext()); }}
                    className="px-3 py-2 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    ↺ New
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-[#5B4BDB]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-500 flex-shrink-0">{progressPercent}%</span>
              </div>

              <div className="flex gap-4 mt-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="font-bold text-gray-900">{plan.totalSteps}</span> steps
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="font-bold text-gray-900">{plan.estimatedDuration}</span> estimated
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="font-bold text-[#5B4BDB]">{completedItems}/{totalChecklistItems}</span> tasks done
                </div>
                {/* Priority summary */}
                {plan.priorities && (
                  <div className="flex items-center gap-2 text-xs">
                    {plan.priorities.p0.length > 0 && <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold">{plan.priorities.p0.length} P0</span>}
                    {plan.priorities.p1.length > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">{plan.priorities.p1.length} P1</span>}
                    {plan.priorities.p2.length > 0 && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">{plan.priorities.p2.length} P2</span>}
                  </div>
                )}
              </div>

              {/* Pipeline latency */}
              {Object.keys(latency).length > 0 && (
                <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  {Object.entries(latency).map(([layer, ms]) => (
                    <span key={layer}>{layer}: {ms}ms</span>
                  ))}
                </div>
              )}
            </div>

            {/* Steps — ordered by execution order */}
            <div className="space-y-3">
              {orderedSteps.map((step, idx) => {
                const isExpanded = expandedStep === idx;
                const stepChecked = step.checklist.filter((_, ci) => checkedItems.has(`${idx}-${ci}`)).length;
                const stepComplete = stepChecked === step.checklist.length;
                const badge = PRIORITY_BADGES[step.priority] ?? PRIORITY_BADGES.P1;

                return (
                  <motion.div
                    key={step.order}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors ${stepComplete ? "border-green-200" : "border-gray-200"}`}
                  >
                    {/* Step header */}
                    <button
                      onClick={() => setExpandedStep(isExpanded ? null : idx)}
                      className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-black ${stepComplete ? "bg-green-100 text-green-600" : "bg-[#5B4BDB]/10 text-[#5B4BDB]"}`}>
                        {stepComplete ? "✓" : step.order}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`font-bold text-sm ${stepComplete ? "text-green-700 line-through" : "text-gray-900"}`}>{step.title}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${badge.bg} ${badge.color}`}>{step.priority}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {step.duration} · {stepChecked}/{step.checklist.length} tasks
                          {step.dependsOn.length > 0 && ` · depends on step ${step.dependsOn.join(", ")}`}
                        </p>
                      </div>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 space-y-4 border-t border-gray-100 pt-4">
                            <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>

                            {/* Checklist */}
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Checklist</p>
                              {step.checklist.map((item, ci) => {
                                const key = `${idx}-${ci}`;
                                const checked = checkedItems.has(key);
                                return (
                                  <button
                                    key={ci}
                                    onClick={() => toggleCheck(key)}
                                    className="w-full flex items-start gap-3 text-left group"
                                  >
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${checked ? "bg-[#5B4BDB] border-[#5B4BDB]" : "border-gray-300 group-hover:border-[#5B4BDB]"}`}>
                                      {checked && (
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                    <span className={`text-sm leading-relaxed ${checked ? "text-gray-400 line-through" : "text-gray-700"}`}>{item}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Resources */}
                            {step.resources && step.resources.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Resources</p>
                                <div className="flex flex-wrap gap-2">
                                  {step.resources.map((r, ri) => (
                                    <a
                                      key={ri}
                                      href={r.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-600 hover:border-[#5B4BDB] hover:text-[#5B4BDB] transition-colors"
                                    >
                                      {r.type === "tool" ? "🔧" : r.type === "tutorial" ? "📺" : "📄"} {r.name}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Tips */}
                            {step.tips && (
                              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                                <span className="text-sm">💡</span>
                                <p className="text-xs text-amber-800 leading-relaxed">{step.tips}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Quick wins & long term */}
            <div className="grid md:grid-cols-2 gap-4">
              {plan.quickWins && plan.quickWins.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                  <p className="font-bold text-green-800 text-sm mb-3">⚡ Quick Wins</p>
                  <ul className="space-y-1.5">
                    {plan.quickWins.map((qw, i) => (
                      <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span> {qw}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.longTermGoals && plan.longTermGoals.length > 0 && (
                <div className="bg-[#5B4BDB]/5 border border-[#5B4BDB]/20 rounded-2xl p-5">
                  <p className="font-bold text-[#5B4BDB] text-sm mb-3">🎯 Long-term Goals</p>
                  <ul className="space-y-1.5">
                    {plan.longTermGoals.map((g, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-[#5B4BDB] mt-0.5">•</span> {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Powered by */}
            <div className="text-center text-xs text-gray-400 py-4">
              Powered by <span className="font-bold text-[#5B4BDB]">Gemini AI</span> · Synthé Execution Pipeline
              {adaptive && adaptive.queryCount > 1 && (
                <span> · Adapted for your <span className="font-semibold text-violet-500">{adaptive.skillLevel}</span> level</span>
              )}
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}
