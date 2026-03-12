"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GalleryModel } from "@/types/gallery";
import type { User } from "firebase/auth";
import { loadRazorpayScript, initiateRazorpayPayment } from "@/lib/razorpay";
import { recordPurchase } from "@/lib/checkAccess";

interface PurchaseModalProps {
  model: GalleryModel;
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

type PurchaseState = "idle" | "loading" | "processing" | "success" | "error" | "coming_soon";

export default function PurchaseModal({ model, user, onClose, onSuccess }: PurchaseModalProps) {
  const [state, setState] = useState<PurchaseState>("idle");
  const [errMsg, setErrMsg] = useState("");

  const handlePurchase = async () => {
    setState("loading");
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { setState("coming_soon"); return; }

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: model.price, modelId: model.id }),
      });

      if (!orderRes.ok) { setState("coming_soon"); return; }

      const { orderId, amount, currency } = await orderRes.json();
      setState("processing");

      // ✅ Only properties defined in InitiatePaymentOptions
      await initiateRazorpayPayment({
        orderId,
        amount,
        currency,
        description: `Purchase: ${model.title}`,
        email: user.email ?? "",
        contact: "",
        prefill: { name: user.displayName ?? "" },
        onSuccess: async (paymentData) => {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...paymentData, modelId: model.id, userId: user.uid }),
          });
          if (verifyRes.ok) {
            await recordPurchase(user.uid, model.id, paymentData);
            setState("success");
            setTimeout(() => { onSuccess(); onClose(); }, 2000);
          } else {
            setState("error");
            setErrMsg("Payment verification failed. Contact support.");
          }
        },
        onFailure: () => {
          setState("error");
          setErrMsg("Payment was cancelled or failed.");
        },
      });
    } catch (e: any) {
      setState("error");
      setErrMsg(e.message || "Something went wrong.");
    }
  };

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
            style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.25) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.5), rgba(34,211,238,0.3), transparent)" }} />

          <div className="p-8">
            <div className="flex items-start justify-between mb-7">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-400/70 mb-1">Unlock Model</p>
                <h2 className="text-xl font-black text-white">Purchase Access</h2>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-xl border border-white/8 bg-white/[0.03] text-white/35 hover:text-white/70 hover:border-white/20 transition duration-200 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Model row */}
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/6 bg-white/[0.025] mb-7">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/[0.03] flex-shrink-0">
                {model.thumbnailUrl
                  ? <img src={model.thumbnailUrl} className="w-full h-full object-cover" alt={model.title} />
                  : <div className="w-full h-full flex items-center justify-center text-2xl text-white/10">◈</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate mb-1">{model.title}</p>
                <p className="text-white/35 text-xs">{model.authorName}</p>
                <p className="text-xs text-white/20 mt-1 uppercase tracking-widest">{model.fileType?.toUpperCase()}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-black text-white">₹{model.price}</p>
                <p className="text-white/25 text-xs">one-time</p>
              </div>
            </div>

            {/* Perks */}
            <div className="space-y-2.5 mb-7">
              {["Full model download access", "Lifetime ownership", "Commercial use license", "Future updates included"].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/50 text-sm">{item}</span>
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {state === "idle" && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.button onClick={handlePurchase} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    style={{ willChange: "transform", background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}
                    className="w-full py-4 rounded-2xl font-black text-white text-base relative overflow-hidden">
                    <motion.div animate={{ x: ["-200%", "200%"] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "linear" }}
                      style={{ willChange: "transform", position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", transform: "skewX(-20deg)", pointerEvents: "none" }} />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Pay ₹{model.price}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </motion.button>
                  <p className="text-center text-white/20 text-xs mt-3">Secured by Razorpay · 256-bit encryption</p>
                </motion.div>
              )}

              {(state === "loading" || state === "processing") && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 py-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
                    <svg className="w-6 h-6 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-white/60 text-sm font-semibold">
                    {state === "loading" ? "Setting up payment..." : "Processing payment..."}
                  </p>
                </motion.div>
              )}

              {state === "success" && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 py-6">
                  <div className="w-14 h-14 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 flex items-center justify-center">
                    <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-emerald-400 font-black text-lg">Payment Successful!</p>
                  <p className="text-white/35 text-sm">You now have full access to this model.</p>
                </motion.div>
              )}

              {state === "coming_soon" && (
                <motion.div key="soon" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-4 py-4">
                  <div className="w-12 h-12 rounded-2xl border border-amber-500/25 bg-amber-500/10 flex items-center justify-center text-2xl">🚧</div>
                  <div className="text-center">
                    <p className="text-amber-300 font-black mb-1">Payments Coming Soon</p>
                    <p className="text-white/35 text-sm">Razorpay integration is being activated.</p>
                  </div>
                  <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-white/50 border border-white/8 rounded-xl hover:border-white/20 hover:text-white/70 transition duration-200">Close</button>
                </motion.div>
              )}

              {state === "error" && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-500/20 bg-rose-500/8">
                    <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-rose-400 text-sm">{errMsg}</p>
                  </div>
                  <button onClick={() => setState("idle")}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white border border-violet-500/30 hover:bg-violet-500/10 transition duration-200">
                    Try Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}