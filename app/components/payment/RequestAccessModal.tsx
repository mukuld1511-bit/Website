"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { GalleryModel } from "@/types/gallery";
import type { User } from "firebase/auth";

interface RequestAccessModalProps {
  model: GalleryModel;
  user: User;
  onClose: () => void;
}

const USE_CASES = ["Personal / Learning", "Commercial Project", "Research", "Portfolio", "Game Development", "Architecture Visualization", "Other"];

export default function RequestAccessModal({ model, user, onClose }: RequestAccessModalProps) {
  const [useCase, setUseCase] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!useCase) { setError("Please select a use case."); return; }
    setSubmitting(true); setError("");
    try {
      await addDoc(collection(db, "accessRequests"), {
        modelId: model.id,
        modelTitle: model.title,
        authorId: model.authorId,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName ?? "",
        useCase,
        message: message.trim(),
        status: "pending",
        requestedAt: serverTimestamp(),
      });

      // Notify the author
      await addDoc(collection(db, "notifications"), {
        userId: model.authorId,
        type: "accessRequest",
        message: `${user.email} requested access to "${model.title}"`,
        modelId: model.id,
        createdAt: serverTimestamp(),
        read: false,
      });

      setDone(true);
    } catch (e: any) {
      setError(e.message || "Failed to send request.");
    }
    setSubmitting(false);
  };

  const inputClass = "w-full bg-white/[0.03] border border-white/8 text-white placeholder-white/25 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-violet-500/50 focus:shadow-[0_0_16px_rgba(139,92,246,0.08)] transition duration-200";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

        <motion.div
          className="relative z-10 w-full max-w-md rounded-3xl border border-white/8 bg-[#07000e] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-32 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.2) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.5), rgba(34,211,238,0.3), transparent)" }} />

          <div className="p-8">
            <AnimatePresence mode="wait">

              {!done ? (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                  {/* Header */}
                  <div className="flex items-start justify-between mb-7">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-400/70 mb-1">Access Required</p>
                      <h2 className="text-xl font-black text-white">Request Access</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl border border-white/8 bg-white/[0.03] text-white/35 hover:text-white/70 hover:border-white/20 transition duration-200 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Model info */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/6 bg-white/[0.02] mb-6">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/[0.03] flex-shrink-0">
                      {model.thumbnailUrl
                        ? <img src={model.thumbnailUrl} className="w-full h-full object-cover" alt={model.title} />
                        : <div className="w-full h-full flex items-center justify-center text-xl text-white/10">◈</div>
                      }
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{model.title}</p>
                      <p className="text-white/35 text-xs">by {model.authorName}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">

                    {/* Use case */}
                    <div>
                      <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">How will you use this? *</label>
                      <div className="flex flex-wrap gap-2">
                        {USE_CASES.map((uc) => (
                          <button
                            key={uc}
                            onClick={() => setUseCase(uc)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition duration-200 ${
                              useCase === uc
                                ? "border-violet-500/40 bg-violet-500/15 text-violet-300"
                                : "border-white/8 bg-white/[0.02] text-white/35 hover:border-white/15 hover:text-white/60"
                            }`}
                          >
                            {uc}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Message to Developer <span className="text-white/20 normal-case font-normal tracking-normal">(optional)</span></label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Briefly describe your project or why you need access..."
                        rows={3}
                        className={inputClass + " resize-none"}
                      />
                    </div>

                    {error && (
                      <p className="text-rose-400 text-xs flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                      </p>
                    )}

                    <motion.button
                      onClick={handleSubmit}
                      disabled={submitting || !useCase}
                      whileHover={{ scale: submitting ? 1 : 1.02 }}
                      whileTap={{ scale: submitting ? 1 : 0.98 }}
                      style={{ willChange: "transform", background: submitting ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #7c3aed, #0891b2)" }}
                      className="w-full py-4 rounded-2xl font-black text-white text-sm disabled:opacity-50 relative overflow-hidden"
                    >
                      {!submitting && (
                        <motion.div animate={{ x: ["-200%", "200%"] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "linear" }}
                          style={{ willChange: "transform", position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", transform: "skewX(-20deg)", pointerEvents: "none" }} />
                      )}
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {submitting ? (
                          <><svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Sending...</>
                        ) : (
                          <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> Send Request</>
                        )}
                      </span>
                    </motion.button>

                    <p className="text-center text-white/20 text-xs">
                      The developer will review and respond to your request
                    </p>
                  </div>

                </motion.div>
              ) : (

                <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-5 py-8 text-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6 }}
                    className="w-20 h-20 rounded-3xl border border-violet-500/25 bg-violet-500/10 flex items-center justify-center"
                  >
                    <svg className="w-10 h-10 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-black text-white mb-2">Request Sent!</h3>
                    <p className="text-white/40 text-sm leading-relaxed">
                      The developer has been notified. You'll receive a notification once they approve or deny your request.
                    </p>
                  </div>
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    style={{ willChange: "transform", background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}
                    className="px-8 py-3.5 rounded-2xl font-black text-white text-sm"
                  >
                    Back to Gallery
                  </motion.button>
                </motion.div>

              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}