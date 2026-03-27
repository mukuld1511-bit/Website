"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateModelMeta } from "@/lib/ai";

interface ModelMeta {
  fileName: string; fileType: string; category: string; tags: string[];
}
interface GeneratedMeta {
  title: string; description: string; suggestedTags: string[]; suggestedPrice: number;
}
interface Props {
  modelMeta: ModelMeta;
  onApply: (meta: GeneratedMeta) => void;
}

export default function GeminiMetaWriter({ modelMeta, onApply }: Props) {
  const [result,  setResult]  = useState<GeneratedMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const generate = async () => {
    setLoading(true); setError(null); setApplied(false);
    try {
      const meta = await generateModelMeta(modelMeta);
      setResult(meta);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApply(result);
    setApplied(true);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 bg-gray-50">
        <div className="w-7 h-7 rounded-lg bg-[#5B4BDB] flex items-center justify-center">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-900">AI Description Writer</p>
          <p className="text-xs text-gray-400">Gemini AI · auto-fills title, tags & price</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-xs space-y-0.5">
          {[["File", modelMeta.fileName], ["Type", modelMeta.fileType], ["Category", modelMeta.category]].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-gray-400">{k}</span>
              <span className="font-medium text-gray-700 truncate max-w-[60%]">{v}</span>
            </div>
          ))}
        </div>

        {!result && (
          <button onClick={generate} disabled={loading}
            className="w-full py-2.5 bg-[#5B4BDB] border-b-[3px] border-[#4438b8] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? (
              <><div className="flex gap-0.5">{[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-white animate-bounce" style={{ animationDelay: `${i*0.12}s` }} />)}</div>Generating…</>
            ) : (
              <><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>Generate with AI</>
            )}
          </button>
        )}

        {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2.5">
              <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                <p className="text-xs text-gray-400 mb-0.5">Title</p>
                <p className="text-sm font-semibold text-gray-800">{result.title}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                <p className="text-xs text-gray-400 mb-0.5">Description</p>
                <p className="text-xs text-gray-700 leading-relaxed">{result.description}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                <p className="text-xs text-gray-400 mb-1.5">Suggested Tags</p>
                <div className="flex flex-wrap gap-1">
                  {result.suggestedTags.map(tag => (
                    <span key={tag} className="text-xs bg-[#5B4BDB]/10 text-[#5B4BDB] px-2 py-0.5 rounded-full font-medium">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex justify-between items-center">
                <p className="text-xs text-amber-700 font-medium">Suggested price</p>
                <p className="text-sm font-bold text-amber-900">{result.suggestedPrice === 0 ? "Free" : `₹${result.suggestedPrice}`}</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={generate} className="flex-1 py-2 border border-gray-200 text-xs font-semibold text-gray-600 rounded-xl hover:bg-gray-50 transition-all">Regenerate</button>
                <button onClick={handleApply} disabled={applied}
                  className="flex-1 py-2 bg-[#5B4BDB] border-b-[3px] border-[#4438b8] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-60">
                  {applied ? "Applied ✓" : "Apply to form"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}