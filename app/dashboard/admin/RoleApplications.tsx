// ============================================================
//  SYNTHÉ — Admin role applications panel
//  File: app/dashboard/admin/RoleApplications.tsx  (NEW)
//
//  Add this component inside app/dashboard/admin/page.tsx
//  Import it at the top and render it inside the admin panel.
//
//  WHAT TO ADD IN admin/page.tsx:
//
//  1. At the top, add import:
//     import RoleApplications from "./RoleApplications";
//
//  2. Inside the admin panel JSX, add a new tab or section:
//     <RoleApplications />
// ============================================================

"use client";
import { useState, useEffect } from "react";
import {
  collection, query, where, orderBy,
  getDocs, updateDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import type { UserRole } from "../../../types/gallery";

interface Application {
  id:          string;
  userId:      string;
  userName:    string;
  userEmail:   string;
  userPhoto:   string;
  applyType:   "learner" | "developer" | "mentor";
  status:      "pending" | "approved" | "rejected";
  why?:        string;
  portfolio?:  string;
  expertise?:  string;
  experience?: string;
  skills?:     string[];
  createdAt?:  any;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  learner:   { bg: "#E6F1FB", text: "#0C447C", border: "#378ADD44" },
  developer: { bg: "#EEEDFE", text: "#3C3489", border: "#5B4BDB44" },
  mentor:    { bg: "#E1F5EE", text: "#085041", border: "#1D9E7544" },
};

export default function RoleApplications() {
  const [apps,    setApps]    = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [working, setWorking] = useState<string | null>(null);
  const [toast,   setToast]   = useState("");

  useEffect(() => { fetchApps(); }, []);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "roleApplications"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setApps(snap.docs.map(d => ({ id: d.id, ...d.data() } as Application)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (app: Application, decision: "approved" | "rejected") => {
    setWorking(app.id);
    try {
      // Update application status
      await updateDoc(doc(db, "roleApplications", app.id), {
        status:     decision,
        decidedAt:  serverTimestamp(),
      });

      // If approved, update user's role in Firestore
      if (decision === "approved") {
        await updateDoc(doc(db, "users", app.userId), {
          role: app.applyType as UserRole,
        });
      }

      setApps(prev => prev.map(a =>
        a.id === app.id ? { ...a, status: decision } : a
      ));

      showToast(
        decision === "approved"
          ? `${app.userName} is now a ${app.applyType}`
          : `${app.userName}'s application rejected`
      );
    } catch (err) {
      console.error(err);
      showToast("Something went wrong. Please try again.");
    } finally {
      setWorking(null);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const filtered = apps.filter(a => filter === "all" || a.status === filter);
  const pendingCount = apps.filter(a => a.status === "pending").length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black text-gray-900">Role Applications</h2>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">
              {pendingCount} pending
            </span>
          )}
        </div>
        <button onClick={fetchApps}
          className="text-xs text-gray-400 hover:text-gray-700 font-semibold transition-colors">
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 w-fit mb-5">
        {(["pending", "all", "approved", "rejected"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
              filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Applications list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">No {filter === "all" ? "" : filter} applications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const colors = TYPE_COLORS[app.applyType];
            const isPending = app.status === "pending";
            return (
              <motion.div key={app.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`rounded-xl border p-4 ${isPending ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-[#5B4BDB]/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {app.userPhoto
                        ? <img src={app.userPhoto} className="w-full h-full object-cover" alt="" />
                        : <span className="text-[#5B4BDB] text-sm font-bold">{app.userName?.charAt(0)}</span>
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm">{app.userName}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                          {app.applyType}
                        </span>
                        {app.status !== "pending" && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            app.status === "approved"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}>
                            {app.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{app.userEmail}</p>

                      {/* Application details */}
                      <div className="mt-2 space-y-1">
                        {app.why && (
                          <p className="text-xs text-gray-600 italic">"{app.why}"</p>
                        )}
                        {app.expertise && (
                          <p className="text-xs text-gray-600">
                            <span className="font-semibold">Expertise:</span> {app.expertise}
                          </p>
                        )}
                        {app.experience && (
                          <p className="text-xs text-gray-600">
                            <span className="font-semibold">Experience:</span> {app.experience}
                          </p>
                        )}
                        {app.portfolio && (
                          <a href={app.portfolio} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-[#5B4BDB] hover:underline">
                            {app.portfolio}
                          </a>
                        )}
                        {app.skills && app.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {app.skills.map(s => (
                              <span key={s} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons — only for pending */}
                  {isPending && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDecision(app, "rejected")}
                        disabled={working === app.id}
                        className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleDecision(app, "approved")}
                        disabled={working === app.id}
                        className="px-3 py-1.5 rounded-lg bg-[#5B4BDB] text-white text-xs font-bold hover:bg-[#4c3ec7] transition-all disabled:opacity-50"
                      >
                        {working === app.id ? "..." : "Approve"}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
