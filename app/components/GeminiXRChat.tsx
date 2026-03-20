"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { askAI } from "@/lib/openai";

interface Message { role: "user" | "ai"; text: string; }

const QUICK_QUESTIONS = [
  "What is WebXR?",
  "How does AR work on phones?",
  "AR vs VR — what's the difference?",
  "What is SLAM tracking?",
  "Best free tool to start VR?",
  "What is a GLB file?",
];

interface Props { userRole?: string; }

async function xrConceptChat(question: string, userRole: string): Promise<string> {
  return askAI({
    system: `You are an XR education assistant on SYNTHÉ. Answer in simple, friendly language.
${userRole === "learner" || userRole === "user"
  ? "The user is a beginner — avoid jargon, use real-world analogies."
  : "The user is a developer — be technical and precise."}
Keep answers under 80 words. End with one practical tip.`,
    user: question,
    temperature: 0.6,
    maxTokens: 200,
  });
}

export default function AIXRChat({ userRole = "user" }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const q = text.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const answer = await xrConceptChat(q, userRole);
      setMessages(prev => [...prev, { role: "ai", text: answer }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden h-[540px] shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0 bg-gray-50">
        <div className="w-9 h-9 rounded-xl bg-[#5B4BDB] flex items-center justify-center">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Ask anything about XR</p>
          <p className="text-xs text-gray-400">Gemini AI · instant answers</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <p className="text-sm text-gray-500 text-center">Ask me anything about AR, VR, or XR</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="text-left text-xs bg-gray-50 hover:bg-[#5B4BDB]/5 border border-gray-200 hover:border-[#5B4BDB]/30 rounded-xl px-3 py-3 text-gray-600 hover:text-[#5B4BDB] transition-all leading-snug">
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
              {m.role === "ai" && (
                <div className="w-6 h-6 rounded-lg bg-[#5B4BDB] flex items-center justify-center shrink-0 mt-1">
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user" ? "bg-[#5B4BDB] text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}>{m.text}</div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#5B4BDB] flex items-center justify-center shrink-0">
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#5B4BDB]/60 animate-bounce" style={{ animationDelay: `${i * 0.12}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-gray-100 shrink-0 bg-gray-50">
        <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            placeholder="What is spatial computing?"
            className="flex-1 bg-white border border-gray-200 focus:border-[#5B4BDB] rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors" />
          <button type="submit" disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-[#5B4BDB] hover:bg-[#4c3ec7] disabled:opacity-40 rounded-xl text-white text-sm font-semibold transition-colors">
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}