"use client";

import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import {
  collection, getDocs, updateDoc, deleteDoc,
  doc, query, orderBy, addDoc, serverTimestamp,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Footer from "../../components/Footer";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview"|"models"|"users"|"applications"|"certifications"|"mentorApps">("overview");
  const [models,       setModels]       = useState<any[]>([]);
  const [users,        setUsers]        = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [certRequests, setCertRequests] = useState<any[]>([]);
  const [mentorApps,   setMentorApps]   = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState("");

  // Mentor app detail modal
  const [selectedApp, setSelectedApp]     = useState<any | null>(null);
  const [rejectReason, setRejectReason]   = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [mSnap, uSnap, aSnap, cSnap, raSnap] = await Promise.all([
        getDocs(query(collection(db, "models"), orderBy("uploadedAt", "desc"))),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "developerApplications")),
        getDocs(collection(db, "certificationRequests")),
        getDocs(query(collection(db, "roleApplications"), orderBy("createdAt", "desc"))),
      ]);
      setModels(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setApplications(aSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCertRequests(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setMentorApps(raSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3500); }

  async function deleteModel(id: string) {
    if (!confirm("Delete this model?")) return;
    await deleteDoc(doc(db, "models", id));
    setModels(p => p.filter(m => m.id !== id));
    showToast("Model deleted.");
  }

  async function promoteUser(id: string) {
    await updateDoc(doc(db, "users", id), { role: "developer" });
    setUsers(p => p.map(u => u.id === id ? { ...u, role: "developer" } : u));
    showToast("User promoted to developer.");
  }
  async function demoteUser(id: string) {
    await updateDoc(doc(db, "users", id), { role: "user" });
    setUsers(p => p.map(u => u.id === id ? { ...u, role: "user" } : u));
    showToast("Developer demoted to user.");
  }

  async function approveApplication(app: any) {
    await updateDoc(doc(db, "developerApplications", app.id), { status: "approved" });
    if (app.userId) await updateDoc(doc(db, "users", app.userId), { role: "developer" });
    setApplications(p => p.map(a => a.id === app.id ? { ...a, status: "approved" } : a));
    showToast("Application approved.");
  }
  async function rejectApplication(id: string) {
    await updateDoc(doc(db, "developerApplications", id), { status: "rejected" });
    setApplications(p => p.map(a => a.id === id ? { ...a, status: "rejected" } : a));
    showToast("Application rejected.");
  }

  async function approveCert(id: string, userId: string) {
    await updateDoc(doc(db, "certificationRequests", id), { status: "approved" });
    if (userId) await updateDoc(doc(db, "users", userId), { certified: true });
    setCertRequests(p => p.map(c => c.id === id ? { ...c, status: "approved" } : c));
    showToast("Certification approved ⭐");
  }
  async function rejectCert(id: string) {
    await updateDoc(doc(db, "certificationRequests", id), { status: "rejected" });
    setCertRequests(p => p.map(c => c.id === id ? { ...c, status: "rejected" } : c));
    showToast("Certification rejected.");
  }

  // ── Mentor app actions ─────────────────────────────────────────────────
  async function approveMentorApp(app: any) {
    if ((app.certificates?.length ?? 0) < 2) {
      showToast("Cannot approve — less than 2 certificates"); return;
    }
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "roleApplications", app.id), { status: "approved", reviewedAt: serverTimestamp() });
      await updateDoc(doc(db, "users", app.userId), {
        role: "mentor",
        hourlyRate:       app.hourlyRate ?? 500,
        expertise:        app.expertise ?? "",
        experience:       app.experience ?? "",
        bio:              app.bio ?? "",
        linkedin:         app.linkedin ?? "",
        skills:           app.skills ?? [],
        certificates:     app.certificates ?? [],
        isVerifiedMentor: true,
        mentorApprovedAt: serverTimestamp(),
        updatedAt:        serverTimestamp(),
      });
      await addDoc(collection(db, "notifications"), {
        userId:    app.userId,
        message:   `🎉 Congratulations! Your mentor application has been approved. Start hosting sessions now!`,
        read:      false,
        createdAt: serverTimestamp(),
      });
      setMentorApps(prev => prev.map(a => a.id === app.id ? { ...a, status: "approved" } : a));
      setSelectedApp(null);
      showToast(`✅ ${app.userName} approved as Mentor`);
    } catch (e: any) { showToast(e.message); }
    finally { setActionLoading(false); }
  }

  async function rejectMentorApp(app: any) {
    if (!rejectReason.trim()) { showToast("Enter a rejection reason first"); return; }
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "roleApplications", app.id), { status: "rejected", rejectReason: rejectReason.trim(), reviewedAt: serverTimestamp() });
      await addDoc(collection(db, "notifications"), {
        userId:    app.userId,
        message:   `Your mentor application was not approved. Reason: ${rejectReason.trim()}. You may re-apply after addressing these issues.`,
        read:      false,
        createdAt: serverTimestamp(),
      });
      setMentorApps(prev => prev.map(a => a.id === app.id ? { ...a, status: "rejected" } : a));
      setSelectedApp(null);
      setRejectReason("");
      showToast(`❌ ${app.userName} rejected`);
    } catch (e: any) { showToast(e.message); }
    finally { setActionLoading(false); }
  }

  // ── Stats ──
  const developers   = users.filter(u => u.role === "developer");
  const freeModels   = models.filter(m => !m.isPaid);
  const paidModels   = models.filter(m => m.isPaid);
  const pendingApps  = applications.filter(a => a.status === "pending");
  const pendingCerts = certRequests.filter(c => c.status === "pending");
  const pendingMentor = mentorApps.filter(a => a.status === "pending");

  const STATS = [
    { label: "Total Models",    val: models.length,         colorClass: "text-blue-600",    bgClass: "bg-blue-50",    borderClass: "border-blue-200",    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
    { label: "Total Users",     val: users.length,          colorClass: "text-cyan-600",    bgClass: "bg-cyan-50",    borderClass: "border-cyan-200",    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { label: "Developers",      val: developers.length,     colorClass: "text-emerald-600", bgClass: "bg-emerald-50", borderClass: "border-emerald-200", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
    { label: "Pending Actions", val: pendingApps.length + pendingCerts.length + pendingMentor.length, colorClass: "text-amber-600", bgClass: "bg-amber-50", borderClass: "border-amber-200", icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  const TABS: { id: typeof activeTab; label: string; badge?: number }[] = [
    { id: "overview",     label: "Overview" },
    { id: "models",       label: "Models",        badge: models.length },
    { id: "users",        label: "Users",          badge: users.length },
    { id: "applications", label: "Applications",   badge: pendingApps.length || undefined },
    { id: "certifications", label: "Certifications", badge: pendingCerts.length || undefined },
    { id: "mentorApps",   label: "Mentor Apps",   badge: pendingMentor.length || undefined },
  ];

  const FILE_COLORS: Record<string, { colorClass: string; bgClass: string; borderClass: string }> = {
    glb:  { colorClass: "text-indigo-600", bgClass: "bg-indigo-50",  borderClass: "border-indigo-200" },
    gltf: { colorClass: "text-indigo-600", bgClass: "bg-indigo-50",  borderClass: "border-indigo-200" },
    obj:  { colorClass: "text-cyan-600",   bgClass: "bg-cyan-50",    borderClass: "border-cyan-200"   },
    fbx:  { colorClass: "text-cyan-600",   bgClass: "bg-cyan-50",    borderClass: "border-cyan-200"   },
    dwg:  { colorClass: "text-amber-600",  bgClass: "bg-amber-50",   borderClass: "border-amber-200"  },
    dxf:  { colorClass: "text-amber-600",  bgClass: "bg-amber-50",   borderClass: "border-amber-200"  },
  };
  const getFileStyle = (ext: string) => FILE_COLORS[ext] ?? FILE_COLORS.glb;

  function timeAgo(ts: any): string {
    if (!ts) return "";
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  const statusPill = (s: string) => {
    const m: Record<string, string> = {
      pending: "border-amber-200 bg-amber-50 text-amber-700",
      approved: "border-green-200 bg-green-50 text-green-700",
      rejected: "border-red-200 bg-red-50 text-red-700",
    };
    return `px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest uppercase border shadow-sm ${m[s] ?? "border-gray-200 bg-[#0A0A0F] text-gray-500"}`;
  };

  const rolePill = (r: string) => {
    const m: Record<string, string> = {
      admin: "border-red-200 bg-red-50 text-red-700",
      developer: "border-blue-200 bg-blue-50 text-blue-700",
      mentor: "border-teal-200 bg-teal-50 text-teal-700",
      user: "border-gray-200 bg-white text-gray-500",
    };
    return `px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest uppercase border shadow-sm ${m[r] ?? m.user}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center font-sans">
      <div className="w-12 h-12 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F] font-sans">
      {/* Mentor app detail modal */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) { setSelectedApp(null); setRejectReason(""); } }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0F6E56]/10 overflow-hidden flex items-center justify-center">
                    {selectedApp.userPhoto
                      ? <img src={selectedApp.userPhoto} className="w-full h-full object-cover" alt="" />
                      : <span className="text-[#0F6E56] font-bold">{selectedApp.userName?.charAt(0)}</span>}
                  </div>
                  <div>
                    <p className="font-bold text-white">{selectedApp.userName}</p>
                    <p className="text-xs text-gray-400">{selectedApp.userEmail}</p>
                  </div>
                </div>
                <span className={statusPill(selectedApp.status)}>{selectedApp.status}</span>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Expertise",   value: selectedApp.expertise },
                    { label: "Experience",  value: selectedApp.experience },
                    { label: "Hourly Rate", value: selectedApp.hourlyRate ? `₹${selectedApp.hourlyRate}/hr` : null },
                    { label: "LinkedIn",    value: selectedApp.linkedin, isLink: true },
                  ].filter(i => i.value).map(item => (
                    <div key={item.label} className="bg-[#0A0A0F] rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                      {item.isLink
                        ? <a href={item.value!} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#5B4BDB] hover:underline truncate block">{item.value}</a>
                        : <p className="text-sm font-semibold text-gray-800">{item.value}</p>}
                    </div>
                  ))}
                </div>

                {selectedApp.bio && (
                  <div className="bg-[#0A0A0F] rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1.5">Professional Bio</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedApp.bio}</p>
                  </div>
                )}

                {selectedApp.skills?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApp.skills.map((s: string) => (
                        <span key={s} className="text-xs bg-[#5B4BDB]/10 text-[#5B4BDB] px-2 py-0.5 rounded-full font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApp.certificates?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs text-gray-400">Certificates ({selectedApp.certificates.length})</p>
                      {selectedApp.certificates.length < 2 && (
                        <span className="text-xs text-red-500 font-bold">⚠️ Less than 2 — cannot approve</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {selectedApp.certificates.map((cert: any, i: number) => (
                        <a key={i} href={cert.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-[#5B4BDB] hover:bg-[#5B4BDB]/5 transition group">
                          <span className="text-lg">📄</span>
                          <span className="text-sm font-semibold text-gray-700 group-hover:text-[#5B4BDB] flex-1 truncate">{cert.name}</span>
                          <span className="text-xs text-[#5B4BDB] font-bold">View →</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApp.status === "pending" && (
                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Rejection Reason</label>
                      <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2}
                        placeholder="e.g. Insufficient certificates, need more experience..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 transition resize-none" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => rejectMentorApp(selectedApp)} disabled={actionLoading}
                        className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition disabled:opacity-50">
                        {actionLoading ? "…" : "❌ Reject"}
                      </button>
                      <button onClick={() => approveMentorApp(selectedApp)}
                        disabled={actionLoading || (selectedApp.certificates?.length ?? 0) < 2}
                        className="flex-1 py-3 rounded-xl bg-[#0F6E56] text-white font-bold text-sm border-b-[3px] border-[#0a5240] hover:opacity-90 transition disabled:opacity-40">
                        {actionLoading ? "…" : "✅ Approve as Mentor"}
                      </button>
                    </div>
                    {(selectedApp.certificates?.length ?? 0) < 2 && (
                      <p className="text-xs text-center text-red-500">Cannot approve — minimum 2 certificates required</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-20">

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-200 bg-red-50 mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-red-700 text-[10px] font-black uppercase tracking-widest">Control Panel</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm font-medium">Manage models, users, applications, certifications and mentor approvals.</p>
        </motion.div>

        {/* Main stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {STATS.map((s, i) => (
            <div key={i} className={`p-6 rounded-3xl border-2 shadow-sm ${s.bgClass} ${s.borderClass}`}>
              <svg className={`w-8 h-8 mb-4 ${s.colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
              </svg>
              <p className={`text-4xl font-black mb-1 ${s.colorClass}`}>{s.val}</p>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Secondary stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">
          {[
            { label: "Free Models",    val: freeModels.length,    colorClass: "text-green-600",   bgClass: "bg-green-50",   borderClass: "border-green-200"   },
            { label: "Paid Models",    val: paidModels.length,    colorClass: "text-yellow-600",  bgClass: "bg-yellow-50",  borderClass: "border-yellow-200"  },
            { label: "Pending Apps",   val: pendingApps.length,   colorClass: "text-blue-600",    bgClass: "bg-blue-50",    borderClass: "border-blue-200"    },
            { label: "Pending Certs",  val: pendingCerts.length,  colorClass: "text-indigo-600",  bgClass: "bg-indigo-50",  borderClass: "border-indigo-200"  },
            { label: "Mentor Reviews", val: pendingMentor.length, colorClass: "text-teal-600",    bgClass: "bg-teal-50",    borderClass: "border-teal-200"    },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-2xl border-2 border-indigo-50 bg-white shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-sm ${s.bgClass} ${s.borderClass}`}>
                <span className={`text-xl font-black ${s.colorClass}`}>{s.val}</span>
              </div>
              <div>
                <p className="text-white font-extrabold text-sm">{s.val}</p>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-8 overflow-x-auto pb-px">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition duration-200 border-b-2 ${
                activeTab === t.id ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg" : "border-transparent text-gray-500 hover:text-white hover:bg-[#0A0A0F] rounded-t-lg"
              }`}>
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${activeTab === t.id ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-600"}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-3xl border-2 border-indigo-50 bg-white shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-white text-sm">Recent Uploads</h3>
                    <button onClick={() => setActiveTab("models")} className="text-blue-600 font-black text-xs hover:underline">View all →</button>
                  </div>
                  {models.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-indigo-100 rounded-3xl bg-indigo-50/30">
                      <span className="text-3xl">📦</span>
                      <p className="text-gray-500 font-bold text-sm mt-2">No models yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {models.slice(0, 5).map(m => {
                        const ext   = m.fileType?.toLowerCase() ?? "glb";
                        const style = getFileStyle(ext);
                        return (
                          <div key={m.id} className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl overflow-hidden border flex-shrink-0 flex items-center justify-center ${style.bgClass} ${style.borderClass} shadow-sm`}>
                              {m.thumbnailUrl
                                ? <img src={m.thumbnailUrl} className="w-full h-full object-cover" />
                                : <svg className={`w-5 h-5 ${style.colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-extrabold truncate">{m.title || "Untitled"}</p>
                              <p className="text-gray-500 text-[10px]">{m.authorName} · {timeAgo(m.uploadedAt)}</p>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-1 rounded-md border shadow-sm ${style.bgClass} ${style.borderClass} ${style.colorClass}`}>{ext.toUpperCase()}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border-2 border-indigo-50 bg-white shadow-sm p-6 hover:shadow-md transition-shadow">
                  <h3 className="font-black text-white text-sm mb-6">Pending Actions</h3>
                  {pendingApps.length === 0 && pendingCerts.length === 0 && pendingMentor.length === 0 ? (
                    <div className="text-center py-10 rounded-3xl border-2 border-emerald-100 bg-emerald-50/50">
                      <div className="w-14 h-14 rounded-2xl border-2 border-emerald-200 bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                        <span className="text-emerald-600 text-2xl font-black">✓</span>
                      </div>
                      <p className="text-emerald-800 font-black">All clear!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingMentor.slice(0, 3).map(a => (
                        <div key={a.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-teal-200 bg-teal-50 shadow-sm cursor-pointer hover:shadow-md transition"
                          onClick={() => setSelectedApp(a)}>
                          <div className="min-w-0">
                            <p className="text-teal-900 text-xs font-bold truncate">{a.userName}</p>
                            <p className="text-teal-700 font-medium text-[10px]">Mentor application · {a.certCount ?? 0} certs</p>
                          </div>
                          <span className="text-xs text-teal-600 font-bold">Review →</span>
                        </div>
                      ))}
                      {pendingApps.slice(0, 2).map(a => (
                        <div key={a.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50 shadow-sm">
                          <div className="min-w-0">
                            <p className="text-blue-900 text-xs font-bold truncate">{a.name}</p>
                            <p className="text-blue-700 font-medium text-[10px]">Developer application</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => approveApplication(a)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-green-200 bg-green-50 text-green-600 hover:bg-green-100 font-black transition">✓</button>
                            <button onClick={() => rejectApplication(a.id)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 font-black transition">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* MODELS */}
          {activeTab === "models" && (
            <motion.div key="models" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-500 text-sm">{models.length} model{models.length !== 1 ? "s" : ""}</p>
                <Link href="/upload"><button className="px-5 py-2.5 rounded-xl font-bold text-white text-xs bg-blue-600 hover:bg-blue-700 shadow-sm transition">+ Upload Model</button></Link>
              </div>
              {models.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed border-indigo-100 rounded-3xl bg-indigo-50/30"><span className="text-4xl">📦</span><p className="text-white font-black text-xl mt-4">No models uploaded yet</p></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {models.map((m, i) => {
                    const ext = m.fileType?.toLowerCase() ?? "glb";
                    const style = getFileStyle(ext);
                    return (
                      <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition flex flex-col overflow-hidden">
                        <div className={`relative h-40 flex-shrink-0 ${style.bgClass}`}>
                          {m.thumbnailUrl
                            ? <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover border-b border-gray-100" />
                            : <div className="w-full h-full flex items-center justify-center border-b border-gray-100"><svg className={`w-10 h-10 ${style.colorClass} opacity-50`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>}
                          <div className={`absolute top-3 left-3 px-2 py-1 rounded text-[9px] font-black uppercase border bg-white ${style.borderClass} ${style.colorClass}`}>{ext}</div>
                          {m.isPaid && <div className="absolute top-3 right-3 px-2 py-1 rounded text-[9px] font-black border border-green-200 bg-green-50 text-green-700">₹{m.price}</div>}
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <p className="text-white text-sm font-extrabold truncate mb-1">{m.title || "Untitled"}</p>
                          <div className="flex justify-between text-gray-500 text-xs mb-4"><span className="truncate">{m.authorName}</span><span>{timeAgo(m.uploadedAt)}</span></div>
                          <div className="flex gap-3 mt-auto">
                            <Link href={`/gallery/${m.id}`} className="flex-1"><div className="py-2.5 rounded-xl text-center text-xs font-bold border border-gray-200 text-gray-700 hover:bg-[#0A0A0F] shadow-sm transition cursor-pointer">View</div></Link>
                            <button onClick={() => deleteModel(m.id)} className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 shadow-sm transition">Delete</button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* USERS */}
          {activeTab === "users" && (
            <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-gray-500 text-sm mb-6">{users.length} registered users</p>
              <div className="space-y-3">
                {users.map((u, i) => (
                  <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-4 p-5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
                    <div className={`w-12 h-12 rounded-2xl overflow-hidden border shadow-sm flex items-center justify-center flex-shrink-0 font-black text-sm uppercase ${u.role === "developer" ? "border-blue-200 bg-blue-50 text-blue-700" : u.role === "admin" ? "border-red-200 bg-red-50 text-red-700" : u.role === "mentor" ? "border-teal-200 bg-teal-50 text-teal-700" : "border-gray-200 bg-[#0A0A0F] text-gray-500"}`}>
                      {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : (u.displayName?.[0] ?? u.email?.[0] ?? "?")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-extrabold truncate">{u.displayName || "No name"}</p>
                      <p className="text-gray-500 text-xs truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 flex-wrap justify-end">
                      <span className={rolePill(u.role)}>{u.role}</span>
                      {u.role === "user" && (
                        <button onClick={() => promoteUser(u.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 shadow-sm transition">Promote to Dev</button>
                      )}
                      {u.role === "developer" && (
                        <button onClick={() => demoteUser(u.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 shadow-sm transition">Demote</button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* APPLICATIONS */}
          {activeTab === "applications" && (
            <motion.div key="applications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-gray-500 text-sm mb-6">{applications.length} total · {pendingApps.length} pending</p>
              {applications.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed border-indigo-100 rounded-3xl bg-indigo-50/30"><span className="text-4xl">📝</span><p className="text-white font-black text-xl mt-4">No applications yet</p></div>
              ) : (
                <div className="space-y-4">
                  {applications.map((a, i) => (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className={`p-6 rounded-2xl border shadow-sm ${a.status === "pending" ? "border-blue-200 bg-blue-50/50" : "border-gray-200 bg-white"}`}>
                      <div className="flex items-start justify-between gap-5 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <p className="text-white font-extrabold text-lg">{a.name}</p>
                            <span className={statusPill(a.status)}>{a.status}</span>
                          </div>
                          {a.skills && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {(Array.isArray(a.skills) ? a.skills : a.skills.split(",")).slice(0, 6).map((s: string) => (
                                <span key={s} className="px-2.5 py-1 rounded-md text-[10px] font-bold border shadow-sm border-gray-200 bg-white text-gray-600">{s.trim()}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-4 mt-2 text-sm font-bold">
                            {a.portfolio && <a href={a.portfolio} target="_blank" className="text-indigo-600 hover:underline">Portfolio ↗</a>}
                            {a.linkedin && <a href={a.linkedin} target="_blank" className="text-cyan-600 hover:underline">LinkedIn ↗</a>}
                          </div>
                        </div>
                        {a.status === "pending" && (
                          <div className="flex gap-3">
                            <button onClick={() => approveApplication(a)} className="px-5 py-2.5 rounded-xl font-bold text-white text-xs bg-green-600 hover:bg-green-700 shadow-sm transition">✓ Approve</button>
                            <button onClick={() => rejectApplication(a.id)} className="px-5 py-2.5 rounded-xl font-bold text-red-600 text-xs border border-red-200 bg-red-50 hover:bg-red-100 shadow-sm transition">✕ Reject</button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* CERTIFICATIONS */}
          {activeTab === "certifications" && (
            <motion.div key="certifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-gray-500 text-sm mb-6">{certRequests.length} total · {pendingCerts.length} pending</p>
              {certRequests.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed border-indigo-100 rounded-3xl bg-indigo-50/30"><span className="text-4xl">🎓</span><p className="text-white font-black text-xl mt-4">No certification requests yet</p></div>
              ) : (
                <div className="space-y-4">
                  {certRequests.map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className={`p-6 rounded-2xl border shadow-sm ${c.status === "pending" ? "border-indigo-200 bg-indigo-50/50" : "border-gray-200 bg-white"}`}>
                      <div className="flex items-start justify-between gap-5 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <p className="text-white font-extrabold text-lg">{c.name}</p>
                            <span className={statusPill(c.status)}>{c.status}</span>
                          </div>
                          <p className="text-gray-500 text-sm mb-3">{c.email}</p>
                          {c.reason && <div className="mb-4 bg-[#0A0A0F] rounded-xl p-4 border border-gray-100"><p className="text-gray-700 text-sm leading-relaxed">{c.reason}</p></div>}
                          <div className="flex gap-4 text-sm font-bold">
                            {c.portfolio && <a href={c.portfolio} target="_blank" className="text-indigo-600 hover:underline">Portfolio ↗</a>}
                            {c.linkedin && <a href={c.linkedin} target="_blank" className="text-cyan-600 hover:underline">LinkedIn ↗</a>}
                          </div>
                        </div>
                        {c.status === "pending" && (
                          <div className="flex gap-3">
                            <button onClick={() => approveCert(c.id, c.userId)} className="px-5 py-2.5 rounded-xl font-bold text-white text-xs bg-indigo-600 hover:bg-indigo-700 shadow-sm transition">⭐ Certify</button>
                            <button onClick={() => rejectCert(c.id)} className="px-5 py-2.5 rounded-xl font-bold text-red-600 text-xs border border-red-200 bg-red-50 hover:bg-red-100 shadow-sm transition">✕ Reject</button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* MENTOR APPS */}
          {activeTab === "mentorApps" && (
            <motion.div key="mentorApps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-500 text-sm">{mentorApps.length} total · <span className="text-amber-600 font-bold">{pendingMentor.length} pending review</span></p>
              </div>
              {mentorApps.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed border-teal-100 rounded-3xl bg-teal-50/30">
                  <span className="text-4xl">🧑‍🏫</span>
                  <p className="text-white font-black text-xl mt-4">No mentor applications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mentorApps.map((app, i) => (
                    <motion.div key={app.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedApp(app)}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:border-[#0F6E56]/30 hover:shadow-md transition">
                      <div className="w-12 h-12 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {app.userPhoto
                          ? <img src={app.userPhoto} className="w-full h-full object-cover" alt="" />
                          : <span className="text-[#0F6E56] font-bold text-lg">{app.userName?.charAt(0)}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-white">{app.userName}</p>
                          <span className="text-xs text-gray-400">{app.userEmail}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{app.expertise} · {app.experience} · ₹{app.hourlyRate}/hr</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${(app.certCount ?? 0) >= 2 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                          📄 {app.certCount ?? 0} certs
                        </div>
                        <span className={statusPill(app.status)}>{app.status}</span>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-gray-300"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl border border-green-200 bg-green-50 text-green-800 text-sm font-bold shadow-lg flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-200 text-green-700 flex items-center justify-center text-xs">✓</span> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}