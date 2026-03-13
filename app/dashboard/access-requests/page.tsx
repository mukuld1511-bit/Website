"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import {
  collection, query, where, getDocs, doc,
  updateDoc, serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";

interface AccessRequest {
  id:          string;
  modelId:     string;
  modelTitle:  string;
  userId:      string;
  userEmail:   string;
  userName:    string;
  useCase:     string;
  message:     string;
  status:      "pending" | "approved" | "rejected";
  requestedAt: any;
}

const STATUS_STYLES: Record<string, string> = {
  pending:  "text-amber-300  bg-amber-400/10  border-amber-400/20",
  approved: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  rejected: "text-rose-300   bg-rose-400/10   border-rose-400/20",
};

export default function AccessRequestsPage() {
  const router  = useRouter();
  const [user,     setUser]     = useState<any>(null);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter,   setFilter]   = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      try {
        const snap = await getDocs(
          query(collection(db, "accessRequests"), where("authorId", "==", u.uid))
        );
        const list: AccessRequest[] = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<AccessRequest, "id">),
        }));
        list.sort((a, b) => (b.requestedAt?.seconds ?? 0) - (a.requestedAt?.seconds ?? 0));
        setRequests(list);
      } catch (e) { console.error(e); }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleAction(reqId: string, modelId: string, action: "approved" | "rejected") {
    setUpdating(reqId);
    try {
      await updateDoc(doc(db, "accessRequests", reqId), {
        status: action, respondedAt: serverTimestamp(),
      });
      // Also update model access if approved
      if (action === "approved") {
        await updateDoc(doc(db, "models", modelId), { accessGranted: true });
      }
      setRequests(prev =>
        prev.map(r => r.id === reqId ? { ...r, status: action } : r)
      );
    } catch (e) { console.error(e); }
    setUpdating(null);
  }

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);
  const counts   = {
    all:      requests.length,
    pending:  requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />

      <div className="relative z-10 pt-32 pb-24 px-4 max-w-4xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <Link href="/dashboard/developer">
            <p className="text-white/35 text-sm font-black mb-3 hover:text-white/60 transition">← Developer Dashboard</p>
          </Link>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-2">
            Access <span className="text-violet-400">Requests</span>
          </h1>
          <p className="text-white/35 text-base">
            Approve or reject requests from users who want access to your restricted models.
          </p>
        </motion.div>

        {/* Filter tabs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8 flex-wrap">
          {(["all", "pending", "approved", "rejected"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition duration-200 ${
                filter === f
                  ? "bg-violet-600 text-white"
                  : "border border-white/10 bg-white/[0.03] text-white/40 hover:text-white/70"
              }`}>
              {f} ({counts[f]})
            </button>
          ))}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/6 flex items-center justify-center text-3xl">
              📬
            </div>
            <p className="text-white/40 text-sm">No {filter === "all" ? "" : filter} access requests yet.</p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {filtered.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-white/6 bg-white/[0.02] p-6 hover:border-white/10 transition duration-200"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${STATUS_STYLES[req.status]}`}>
                          {req.status.toUpperCase()}
                        </span>
                        <span className="text-white/25 text-xs">
                          {req.requestedAt?.seconds
                            ? new Date(req.requestedAt.seconds * 1000).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })
                            : ""}
                        </span>
                      </div>
                      <p className="text-white font-bold text-sm truncate">{req.userName || req.userEmail}</p>
                      <p className="text-white/35 text-xs">{req.userEmail}</p>
                    </div>

                    <Link href={`/gallery/${req.modelId}`}
                      className="flex-shrink-0 text-[10px] font-black px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/8 text-white/50 hover:text-white hover:border-white/20 transition">
                      {req.modelTitle || "View Model"}
                    </Link>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <div className="rounded-xl bg-white/[0.02] border border-white/6 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">Use Case</p>
                      <p className="text-white/70 text-sm">{req.useCase}</p>
                    </div>
                    {req.message && (
                      <div className="rounded-xl bg-white/[0.02] border border-white/6 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">Message</p>
                        <p className="text-white/70 text-sm leading-relaxed">{req.message}</p>
                      </div>
                    )}
                  </div>

                  {req.status === "pending" && (
                    <div className="flex gap-3">
                      <motion.button
                        onClick={() => handleAction(req.id, req.modelId, "approved")}
                        disabled={updating === req.id}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-black text-white transition disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#059669,#0891b2)" }}
                      >
                        {updating === req.id ? "..." : "✓ Approve"}
                      </motion.button>
                      <motion.button
                        onClick={() => handleAction(req.id, req.modelId, "rejected")}
                        disabled={updating === req.id}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-black border border-rose-500/25 bg-rose-500/8 text-rose-300 hover:bg-rose-500/15 transition disabled:opacity-50"
                      >
                        {updating === req.id ? "..." : "✕ Reject"}
                      </motion.button>
                    </div>
                  )}

                  {req.status !== "pending" && (
                    <p className="text-xs text-white/25 font-black uppercase tracking-wider">
                      {req.status === "approved" ? "✓ You approved this request" : "✕ You rejected this request"}
                    </p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
