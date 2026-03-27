"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { askAI } from "@/lib/ai";

interface Message { role: "user" | "ai"; text: string; }

interface Tool {
  name: string; desc: string; level: string;
  tags: string[]; pricing: string; link: string;
}

const QUICK_QUESTIONS = (toolName: string) => [
  `How do I get started with ${toolName}?`,
  `Is ${toolName} good for beginners?`,
  `What can I build with ${toolName}?`,
  `Does ${toolName} work with Unity?`,
  `Is ${toolName} free to use?`,
  `${toolName} vs alternatives?`,
];

async function askAboutTool(question: string, tool: Tool): Promise<string> {
  return askAI({
    system: `You are an XR tool expert on SYNTHÉ. The user is asking about: ${tool.name}.
Tool details: ${tool.desc}. Level: ${tool.level}. Tags: ${tool.tags.join(", ")}. Pricing: ${tool.pricing}.
Answer specifically about ${tool.name}. Be concise (under 100 words). Friendly tone. End with one actionable tip.`,
    user: question,
    temperature: 0.6,
    maxTokens: 250,
  });
}

interface Props { tool: Tool; onClose: () => void; }

export default function GeminiToolChat({ tool, onClose }: Props) {
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
    setMessages(p => [...p, { role: "user", text: q }]);
    setLoading(true);
    try {
      const answer = await askAboutTool(q, tool);
      setMessages(p => [...p, { role: "ai", text: answer }]);
    } catch {
      setMessages(p => [...p, { role: "ai", text: "Something went wrong. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 bg-gray-50 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 truncate">Ask about {tool.name}</p>
          <p className="text-xs text-gray-400">Gemini AI · tool expert</p>
        </div>
        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live
        </span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 transition-colors ml-1">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <p className="text-xs text-gray-400 text-center">Ask anything about {tool.name}</p>
            <div className="grid grid-cols-1 gap-1.5">
              {QUICK_QUESTIONS(tool.name).map(q => (
                <button key={q} onClick={() => send(q)}
                  className="text-left text-xs bg-gray-50 hover:bg-violet-50 border border-gray-200 hover:border-violet-300 rounded-lg px-3 py-2 text-gray-600 hover:text-violet-700 transition-all leading-snug">
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
              {m.role === "ai" && (
                <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center shrink-0 mt-1">
                  <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
              )}
              <div className={`max-w-[85%] rounded-xl px-3 py-2.5 text-xs leading-relaxed ${
                m.role === "user" ? "bg-violet-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}>{m.text}</div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center shrink-0">
              <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div className="bg-gray-100 rounded-xl rounded-bl-sm px-3 py-2.5">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.12}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
        <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder={`Ask about ${tool.name}...`}
            className="flex-1 bg-white border border-gray-200 focus:border-violet-400 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 outline-none transition-colors" />
          <button type="submit" disabled={!input.trim() || loading}
            className="px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 rounded-lg text-white text-xs font-semibold transition-colors">
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}