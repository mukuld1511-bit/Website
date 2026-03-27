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
  pending:  "text-yellow-700 bg-yellow-100 border-yellow-300",
  approved: "text-green-700 bg-green-100 border-green-300",
  rejected: "text-red-700 bg-red-100 border-red-300",
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
  }, [router]);

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
    <div className="min-h-screen bg-[#0A0A0F] font-sans">
      <div className="relative z-10 pt-32 pb-24 px-4 max-w-4xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <Link href="/dashboard/developer">
            <p className="text-gray-500 text-sm font-bold mb-3 hover:text-white transition flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Developer Dashboard
            </p>
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
            Access <span className="text-blue-600">Requests</span>
          </h1>
          <p className="text-gray-500 font-medium text-base">
            Approve or reject requests from users who want access to your restricted models.
          </p>
        </motion.div>

        {/* Filter tabs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8 flex-wrap">
          {(["all", "pending", "approved", "rejected"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition duration-200 shadow-sm border ${
                filter === f
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-200 text-gray-500 hover:text-white hover:bg-[#0A0A0F]"
              }`}>
              {f} <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${filter === f ? "bg-blue-100" : "bg-gray-100"}`}>{counts[f]}</span>
            </button>
          ))}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-5 text-center rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#0A0A0F] border border-gray-200 shadow-sm flex items-center justify-center text-3xl">
              📬
            </div>
            <p className="text-gray-500 font-bold text-sm">No {filter === "all" ? "" : filter} access requests yet.</p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-5">
            <AnimatePresence>
              {filtered.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 hover:shadow-md transition duration-200"
                >
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-[9px] font-black tracking-widest px-2.5 py-1 rounded-md border shadow-sm ${STATUS_STYLES[req.status]}`}>
                          {req.status.toUpperCase()}
                        </span>
                        <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                          {req.requestedAt?.seconds
                            ? new Date(req.requestedAt.seconds * 1000).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })
                            : ""}
                        </span>
                      </div>
                      <p className="text-white font-extrabold text-sm truncate">{req.userName || req.userEmail}</p>
                      <p className="text-gray-500 font-medium text-xs truncate mt-0.5">{req.userEmail}</p>
                    </div>

                    <Link href={`/gallery/${req.modelId}`}
                      className="flex-shrink-0 text-[10px] font-black px-3 py-1.5 rounded-lg bg-[#0A0A0F] border border-gray-200 text-gray-500 shadow-sm hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition">
                      {req.modelTitle || "View Model"} →
                    </Link>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-5">
                    <div className="rounded-xl bg-[#0A0A0F] border border-gray-200 shadow-sm px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Use Case</p>
                      <p className="text-gray-700 font-medium text-sm">{req.useCase}</p>
                    </div>
                    {req.message && (
                      <div className="rounded-xl bg-[#0A0A0F] border border-gray-200 shadow-sm px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Message</p>
                        <p className="text-gray-700 font-medium text-sm leading-relaxed">{req.message}</p>
                      </div>
                    )}
                  </div>

                  {req.status === "pending" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction(req.id, req.modelId, "approved")}
                        disabled={updating === req.id}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold shadow-sm bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50"
                      >
                        {updating === req.id ? "..." : "✓ Approve Request"}
                      </button>
                      <button
                        onClick={() => handleAction(req.id, req.modelId, "rejected")}
                        disabled={updating === req.id}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold shadow-sm border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                      >
                        {updating === req.id ? "..." : "✕ Reject"}
                      </button>
                    </div>
                  )}

                  {req.status !== "pending" && (
                    <p className={`text-[10px] font-black uppercase tracking-widest py-1 ${req.status === "approved" ? "text-green-600" : "text-red-600"}`}>
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
