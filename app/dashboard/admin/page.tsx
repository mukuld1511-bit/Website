"use client";

import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import {
  collection, getDocs, updateDoc, deleteDoc,
  doc, query, orderBy,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function AdminDashboard() {
  const [activeTab,     setActiveTab]     = useState<"overview"|"models"|"users"|"applications"|"certifications">("overview");
  const [models,        setModels]        = useState<any[]>([]);
  const [users,         setUsers]         = useState<any[]>([]);
  const [applications,  setApplications]  = useState<any[]>([]);
  const [certRequests,  setCertRequests]  = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [toast,         setToast]         = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [mSnap, uSnap, aSnap, cSnap] = await Promise.all([
        getDocs(query(collection(db, "models"), orderBy("uploadedAt", "desc"))),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "developerApplications")),
        getDocs(collection(db, "certificationRequests")),
      ]);
      setModels(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setApplications(aSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCertRequests(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

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

  // ── Derived stats ──
  const developers  = users.filter(u => u.role === "developer");
  const admins      = users.filter(u => u.role === "admin");
  const freeModels  = models.filter(m => !m.isPaid);
  const paidModels  = models.filter(m => m.isPaid);
  const pendingApps = applications.filter(a => a.status === "pending");
  const pendingCerts= certRequests.filter(c => c.status === "pending");

  const STATS = [
    { label:"Total Models",    val: models.length,       colorClass:"text-blue-600", bgClass:"bg-blue-50", borderClass:"border-blue-200", icon:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
    { label:"Total Users",     val: users.length,        colorClass:"text-cyan-600", bgClass:"bg-cyan-50", borderClass:"border-cyan-200", icon:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { label:"Developers",      val: developers.length,   colorClass:"text-emerald-600", bgClass:"bg-emerald-50", borderClass:"border-emerald-200", icon:"M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
    { label:"Pending Actions", val: pendingApps.length + pendingCerts.length, colorClass:"text-amber-600", bgClass:"bg-amber-50", borderClass:"border-amber-200", icon:"M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  const TABS: { id: typeof activeTab; label: string; badge?: number }[] = [
    { id:"overview",      label:"Overview" },
    { id:"models",        label:"Models",       badge: models.length },
    { id:"users",         label:"Users",        badge: users.length },
    { id:"applications",  label:"Applications", badge: pendingApps.length || undefined },
    { id:"certifications",label:"Certifications",badge: pendingCerts.length || undefined },
  ];

  const FILE_COLORS: Record<string, { colorClass: string; bgClass: string; borderClass: string; hex: string }> = {
    glb:  { colorClass: "text-indigo-600", bgClass: "bg-indigo-50", borderClass: "border-indigo-200", hex: "#4f46e5" },
    gltf: { colorClass: "text-indigo-600", bgClass: "bg-indigo-50", borderClass: "border-indigo-200", hex: "#4f46e5" },
    obj:  { colorClass: "text-cyan-600", bgClass: "bg-cyan-50", borderClass: "border-cyan-200", hex: "#0891b2" },
    fbx:  { colorClass: "text-cyan-600", bgClass: "bg-cyan-50", borderClass: "border-cyan-200", hex: "#0891b2" },
    dwg:  { colorClass: "text-amber-600", bgClass: "bg-amber-50", borderClass: "border-amber-200", hex: "#d97706" },
    dxf:  { colorClass: "text-amber-600", bgClass: "bg-amber-50", borderClass: "border-amber-200", hex: "#d97706" },
  };

  const getFileStyle = (ext: string) => FILE_COLORS[ext] ?? FILE_COLORS.glb;

  function timeAgo(ts: any): string {
    if (!ts) return "";
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  }

  const statusPill = (s: string) => {
    const m: Record<string, string> = {
      pending: "border-amber-200 bg-amber-50 text-amber-700",
      approved:"border-green-200 bg-green-50 text-green-700",
      rejected:"border-red-200 bg-red-50 text-red-700",
    };
    return `px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest uppercase border shadow-sm ${m[s] ?? "border-gray-200 bg-gray-50 text-gray-500"}`;
  };

  const rolePill = (r: string) => {
    const m: Record<string, string> = {
      admin:    "border-red-200 bg-red-50 text-red-700",
      developer:"border-blue-200 bg-blue-50 text-blue-700",
      user:     "border-gray-200 bg-white text-gray-500",
    };
    return `px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest uppercase border shadow-sm ${m[r] ?? m.user}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="w-12 h-12 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-20">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-200 bg-red-50 mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-red-700 text-[10px] font-black uppercase tracking-widest">Control Panel</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-2">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm font-medium">Manage models, users, applications and certifications.</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {STATS.map((s,i) => (
            <div key={i} className="relative p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition duration-200">
              <svg className={`w-6 h-6 mb-4 ${s.colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
              </svg>
              <p className={`text-3xl font-black mb-1 ${s.colorClass}`}>{s.val}</p>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Secondary stats row */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.15 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label:"Free Models",    val: freeModels.length,   colorClass:"text-green-600", bgClass:"bg-green-50", borderClass:"border-green-200" },
            { label:"Paid Models",    val: paidModels.length,   colorClass:"text-yellow-600", bgClass:"bg-yellow-50", borderClass:"border-yellow-200" },
            { label:"Pending Apps",   val: pendingApps.length,  colorClass:"text-blue-600", bgClass:"bg-blue-50", borderClass:"border-blue-200" },
            { label:"Pending Certs",  val: pendingCerts.length, colorClass:"text-indigo-600", bgClass:"bg-indigo-50", borderClass:"border-indigo-200" },
          ].map((s,i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${s.bgClass} ${s.borderClass}`}>
                <span className={`text-lg font-black ${s.colorClass}`}>{s.val}</span>
              </div>
              <div>
                <p className="text-gray-900 font-extrabold text-sm">{s.val}</p>
                <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-8 overflow-x-auto pb-px">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition duration-200 border-b-2 ${
                activeTab===t.id ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg" : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg"
              }`}>
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                  activeTab===t.id ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-600"
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Recent models */}
                <div className="relative rounded-3xl border border-gray-200 bg-white shadow-sm p-6 overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-extrabold text-gray-900 text-sm">Recent Uploads</h3>
                    <button onClick={() => setActiveTab("models")} className="text-blue-600 font-bold text-xs hover:text-blue-700 hover:underline transition duration-150">View all →</button>
                  </div>
                  {models.length === 0 ? (
                    <p className="text-gray-500 font-medium text-sm text-center py-8">No models yet</p>
                  ) : (
                    <div className="space-y-4">
                      {models.slice(0,5).map(m => {
                        const ext = m.fileType?.toLowerCase() ?? "glb";
                        const style = getFileStyle(ext);
                        return (
                          <div key={m.id} className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl overflow-hidden border flex-shrink-0 flex items-center justify-center ${style.bgClass} ${style.borderClass} shadow-sm`}>
                              {m.thumbnailUrl
                                ? <img src={m.thumbnailUrl} className="w-full h-full object-cover" />
                                : <svg className={`w-5 h-5 ${style.colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 text-sm font-extrabold truncate mb-0.5">{m.title || "Untitled"}</p>
                              <p className="text-gray-500 font-medium text-[10px]">{m.authorName} · {timeAgo(m.uploadedAt)}</p>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-1 rounded-md border shadow-sm ${style.bgClass} ${style.borderClass} ${style.colorClass}`}>
                              {ext.toUpperCase()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Pending actions */}
                <div className="relative rounded-3xl border border-gray-200 bg-white shadow-sm p-6 overflow-hidden">
                  <h3 className="font-extrabold text-gray-900 text-sm mb-6">Pending Actions</h3>
                  <div className="space-y-4">
                    {pendingApps.length === 0 && pendingCerts.length === 0 ? (
                      <div className="text-center py-12 rounded-2xl border border-green-200 bg-green-50 shadow-sm">
                        <div className="w-12 h-12 rounded-full border border-green-200 bg-green-100 flex items-center justify-center mx-auto mb-3">
                          <span className="text-green-600 text-xl">✓</span>
                        </div>
                        <p className="text-green-800 text-sm font-bold">All clear!</p>
                        <p className="text-green-600 font-medium text-xs mt-1">No pending actions</p>
                      </div>
                    ) : (
                      <>
                        {pendingApps.slice(0,3).map(a => (
                          <div key={a.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50 shadow-sm">
                            <div className="min-w-0">
                              <p className="text-blue-900 text-xs font-bold truncate mb-0.5">{a.name}</p>
                              <p className="text-blue-700 font-medium text-[10px]">Developer application</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button onClick={() => approveApplication(a)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center font-black shadow-sm border border-green-200 bg-green-50 text-green-600 hover:bg-green-100 transition duration-150">
                                ✓
                              </button>
                              <button onClick={() => rejectApplication(a.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center font-black shadow-sm border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition duration-150">
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                        {pendingCerts.slice(0,3).map(c => (
                          <div key={c.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-indigo-200 bg-indigo-50 shadow-sm">
                            <div className="min-w-0">
                              <p className="text-indigo-900 text-xs font-bold truncate mb-0.5">{c.name}</p>
                              <p className="text-indigo-700 font-medium text-[10px]">Certification request</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button onClick={() => approveCert(c.id, c.userId)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center font-black shadow-sm border border-green-200 bg-green-50 text-green-600 hover:bg-green-100 transition duration-150">
                                ✓
                              </button>
                              <button onClick={() => rejectCert(c.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center font-black shadow-sm border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition duration-150">
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── MODELS ── */}
          {activeTab === "models" && (
            <motion.div key="models" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-500 font-medium text-sm">{models.length} model{models.length!==1?"s":""} on platform</p>
                <Link href="/upload">
                  <button className="px-5 py-2.5 rounded-xl font-bold text-white text-xs bg-blue-600 hover:bg-blue-700 shadow-sm transition">
                    + Upload Model
                  </button>
                </Link>
              </div>

              {models.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center border border-gray-200 rounded-3xl bg-white shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-3xl mb-4 shadow-sm">
                    📦
                  </div>
                  <p className="text-gray-900 font-extrabold text-lg">No models uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {models.map((m,i) => {
                    const ext = m.fileType?.toLowerCase() ?? "glb";
                    const style = getFileStyle(ext);
                    return (
                      <motion.div key={m.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}
                        className="relative rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition duration-200 flex flex-col overflow-hidden">
                        
                        {/* Thumb */}
                        <div className={`relative h-40 overflow-hidden flex-shrink-0 ${style.bgClass}`}>
                          {m.thumbnailUrl
                            ? <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover border-b border-gray-100" />
                            : <div className="w-full h-full flex items-center justify-center border-b border-gray-100">
                                <svg className={`w-10 h-10 ${style.colorClass} opacity-50`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                          }
                          <div className={`absolute top-3 left-3 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-sm border bg-white ${style.borderClass} ${style.colorClass}`}>
                            {ext}
                          </div>
                          {m.isPaid && (
                            <div className="absolute top-3 right-3 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-green-200 bg-green-50 text-green-700 shadow-sm">
                              ₹{m.price}
                            </div>
                          )}
                        </div>

                        <div className="p-5 flex-1 flex flex-col">
                          <p className="text-gray-900 text-sm font-extrabold truncate mb-1">{m.title || "Untitled"}</p>
                          <div className="flex items-center justify-between text-gray-500 font-medium text-xs mb-4">
                            <span className="truncate mr-2">{m.authorName}</span>
                            <span className="flex-shrink-0">{timeAgo(m.uploadedAt)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-gray-400 font-bold text-[10px] mb-5">
                            <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> {m.views ?? 0}</span>
                            <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> {m.downloads ?? 0}</span>
                            <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> {m.likes ?? 0}</span>
                          </div>
                          <div className="flex gap-3 mt-auto">
                            <Link href={`/gallery/${m.id}`} className="flex-1">
                              <div className="py-2.5 rounded-xl text-center text-xs font-bold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition duration-200 cursor-pointer">
                                View
                              </div>
                            </Link>
                            <button onClick={() => deleteModel(m.id)}
                              className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 shadow-sm transition duration-200">
                              Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── USERS ── */}
          {activeTab === "users" && (
            <motion.div key="users" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
              <p className="text-gray-500 font-medium text-sm mb-6">{users.length} registered users</p>
              {users.length === 0 ? (
                <div className="text-center py-24 text-gray-400 font-medium">No users yet</div>
              ) : (
                <div className="space-y-3">
                  {users.map((u,i) => (
                    <motion.div key={u.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.02 }}
                      className="flex items-center gap-4 p-5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition duration-200">
                      <div className={`w-12 h-12 rounded-2xl overflow-hidden border shadow-sm flex items-center justify-center flex-shrink-0 font-black text-sm uppercase ${
                        u.role === "developer" ? "border-blue-200 bg-blue-50 text-blue-700" :
                        u.role === "admin" ? "border-red-200 bg-red-50 text-red-700" :
                        "border-gray-200 bg-gray-50 text-gray-500"
                      }`}>
                        {u.profileImage && u.profileImage !== "/avatar.png"
                          ? <img src={u.profileImage} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                          : (u.name?.[0] ?? u.email?.[0] ?? "?")
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 text-sm font-extrabold truncate mb-0.5">{u.name || "No name"}</p>
                        <p className="text-gray-500 font-medium text-xs truncate">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 flex-wrap justify-end">
                        <span className={rolePill(u.role)}>{u.role}</span>
                        {u.certified && <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-yellow-300 bg-yellow-50 text-yellow-700 shadow-sm">⭐ Certified</span>}
                        {u.role === "user" && (
                          <button onClick={() => promoteUser(u.id)}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 shadow-sm transition duration-200">
                            Promote to Dev
                          </button>
                        )}
                        {u.role === "developer" && (
                          <button onClick={() => demoteUser(u.id)}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 shadow-sm transition duration-200">
                            Demote to User
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── APPLICATIONS ── */}
          {activeTab === "applications" && (
            <motion.div key="applications" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
              <p className="text-gray-500 font-medium text-sm mb-6">{applications.length} total · {pendingApps.length} pending</p>
              {applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border border-gray-200 bg-white shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-3xl mb-4 shadow-sm">
                    📝
                  </div>
                  <p className="text-gray-900 font-extrabold text-lg">No applications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((a,i) => (
                    <motion.div key={a.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}
                      className={`p-6 rounded-2xl border shadow-sm transition duration-200 ${
                        a.status==="pending" ? "border-blue-200 bg-blue-50/50" : "border-gray-200 bg-white"
                      }`}>
                      <div className="flex items-start justify-between gap-5 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <p className="text-gray-900 font-extrabold text-lg">{a.name}</p>
                            <span className={statusPill(a.status)}>{a.status}</span>
                          </div>
                          {a.skills && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {(Array.isArray(a.skills) ? a.skills : a.skills.split(",")).slice(0,6).map((s: string) => (
                                <span key={s} className="px-2.5 py-1 rounded-md text-[10px] font-bold border shadow-sm border-gray-200 bg-white text-gray-600">{s.trim()}</span>
                              ))}
                            </div>
                          )}
                          {a.bio && (
                            <div className="mb-4 bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-inner">
                              <p className="text-gray-700 text-sm font-medium leading-relaxed">{a.bio}</p>
                            </div>
                          )}
                          <div className="flex gap-4 mt-2 text-sm font-bold">
                            {a.portfolio && <a href={a.portfolio} target="_blank" className="text-indigo-600 hover:text-indigo-700 hover:underline transition">Portfolio ↗</a>}
                            {a.linkedin && <a href={a.linkedin} target="_blank" className="text-cyan-600 hover:text-cyan-700 hover:underline transition">LinkedIn ↗</a>}
                          </div>
                        </div>
                        {a.status === "pending" && (
                          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0 w-full sm:w-auto">
                            <button onClick={() => approveApplication(a)}
                              className="px-5 py-2.5 rounded-xl font-bold text-white text-xs bg-green-600 hover:bg-green-700 shadow-sm transition">
                              ✓ Approve
                            </button>
                            <button onClick={() => rejectApplication(a.id)}
                              className="px-5 py-2.5 rounded-xl font-bold text-red-600 text-xs border border-red-200 bg-red-50 hover:bg-red-100 shadow-sm transition">
                              ✕ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── CERTIFICATIONS ── */}
          {activeTab === "certifications" && (
            <motion.div key="certifications" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
              <p className="text-gray-500 font-medium text-sm mb-6">{certRequests.length} total · {pendingCerts.length} pending</p>
              {certRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border border-gray-200 bg-white shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-3xl mb-4 shadow-sm">
                    🎓
                  </div>
                  <p className="text-gray-900 font-extrabold text-lg">No certification requests yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {certRequests.map((c,i) => (
                    <motion.div key={c.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}
                      className={`p-6 rounded-2xl border shadow-sm transition duration-200 ${
                        c.status==="pending" ? "border-indigo-200 bg-indigo-50/50" : "border-gray-200 bg-white"
                      }`}>
                      <div className="flex items-start justify-between gap-5 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <p className="text-gray-900 font-extrabold text-lg">{c.name}</p>
                            <span className={statusPill(c.status)}>{c.status}</span>
                          </div>
                          <p className="text-gray-500 font-medium text-sm mb-4">{c.email}</p>
                          
                          {c.reason && (
                            <div className="mb-4 bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-inner">
                              <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1.5">Why they should be certified</p>
                              <p className="text-gray-700 text-sm font-medium leading-relaxed">{c.reason}</p>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm font-bold mt-4">
                            {c.portfolio && <a href={c.portfolio} target="_blank" className="text-indigo-600 hover:text-indigo-700 hover:underline transition">Portfolio ↗</a>}
                            {c.linkedin && <a href={c.linkedin} target="_blank" className="text-cyan-600 hover:text-cyan-700 hover:underline transition">LinkedIn ↗</a>}
                            {c.experience && <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-600 text-[10px] uppercase tracking-widest border border-gray-200 shadow-sm">{c.experience} yrs exp</span>}
                          </div>
                        </div>
                        {c.status === "pending" && (
                          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0 w-full sm:w-auto">
                            <button onClick={() => approveCert(c.id, c.userId)}
                              className="px-5 py-2.5 rounded-xl font-bold text-white text-xs bg-indigo-600 hover:bg-indigo-700 shadow-sm transition flex items-center justify-center gap-1.5">
                              ⭐ Certify
                            </button>
                            <button onClick={() => rejectCert(c.id)}
                              className="px-5 py-2.5 rounded-xl font-bold text-red-600 text-xs border border-red-200 bg-red-50 hover:bg-red-100 shadow-sm transition">
                              ✕ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity:0, y:20, scale:0.95 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:20, scale:0.95 }}
            transition={{ duration:0.3 }}
            className="fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl border border-green-200 bg-green-50 text-green-800 text-sm font-bold shadow-lg flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-200 text-green-700 flex items-center justify-center text-xs">✓</span> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}