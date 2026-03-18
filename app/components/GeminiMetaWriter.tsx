"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModelMeta { fileName: string; fileType: string; category: string; tags: string[]; }
interface GeneratedMeta { title: string; description: string; suggestedTags: string[]; suggestedPrice: string; }

async function generateModelMeta(meta: ModelMeta): Promise<GeneratedMeta> {
  const prompt = `You are a copywriter for SYNTHÉ, a 3D model marketplace for AR/VR creators.
Based on the file details below, generate polished marketplace metadata.
File name: ${meta.fileName}
File type: ${meta.fileType}
Category: ${meta.category}
Tags: ${meta.tags.join(", ") || "none"}
Return ONLY valid JSON (no markdown, no extra text):
{
  "title": "compelling product title, max 8 words, no quotes",
  "description": "2-3 sentence product description highlighting use cases for AR/VR/3D projects",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedPrice": "a fair price range in INR e.g. ₹299 – ₹499 based on file type complexity"
}`;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
      process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    }
  );
  if (!response.ok) throw new Error("Gemini error");
  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

interface Props {
  fileName: string; fileType: string; category: string; tags: string[];
  onAccept: (title: string, description: string, tags: string[]) => void;
}

export default function GeminiMetaWriter({ fileName, fileType, category, tags, onAccept }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<GeneratedMeta | null>(null);

  const generate = async () => {
    setState("loading");
    try {
      const meta = await generateModelMeta({ fileName, fileType, category, tags });
      setResult(meta);
      setState("done");
    } catch {
      setState("idle");
    }
  };

  return (
    <div className="bg-white border-2 border-dashed border-violet-200 rounded-2xl p-5 hover:border-violet-300 transition-colors">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-900">AI Description Writer</p>
        </div>
        <span className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-full font-medium">
          Gemini
        </span>
      </div>

      <AnimatePresence mode="wait">

        {/* Idle */}
        {state === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Let Gemini write a polished title, description, and tags based on your file — one click, instant results.
            </p>
            <button onClick={generate}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Auto-write with AI →
            </button>
          </motion.div>
        )}

        {/* Loading */}
        {state === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 py-3">
            <div className="w-5 h-5 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin shrink-0" />
            <p className="text-sm text-gray-500">Gemini is writing your description...</p>
          </motion.div>
        )}

        {/* Done */}
        {state === "done" && result && (
          <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Title</p>
              <p className="text-sm font-semibold text-gray-900">{result.title}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{result.description}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {result.suggestedTags.map((t) => (
                  <span key={t} className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-full font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-amber-700 font-medium">Suggested price</p>
              <p className="text-sm font-bold text-amber-900">{result.suggestedPrice}</p>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => onAccept(result.title, result.description, result.suggestedTags)}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
                Use this →
              </button>
              <button onClick={generate}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 text-sm rounded-xl transition-colors">
                Retry
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}