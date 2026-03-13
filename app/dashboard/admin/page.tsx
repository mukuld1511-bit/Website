"use client";

import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import {
  collection, getDocs, updateDoc, deleteDoc,
  doc, query, where, orderBy,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

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
    { label:"Total Models",    val: models.length,       color:"#a78bfa", icon:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
    { label:"Total Users",     val: users.length,        color:"#22d3ee", icon:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { label:"Developers",      val: developers.length,   color:"#34d399", icon:"M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
    { label:"Pending Actions", val: pendingApps.length + pendingCerts.length, color:"#fbbf24", icon:"M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  const TABS: { id: typeof activeTab; label: string; badge?: number }[] = [
    { id:"overview",      label:"Overview" },
    { id:"models",        label:"Models",       badge: models.length },
    { id:"users",         label:"Users",        badge: users.length },
    { id:"applications",  label:"Applications", badge: pendingApps.length || undefined },
    { id:"certifications",label:"Certifications",badge: pendingCerts.length || undefined },
  ];

  const FILE_COLORS: Record<string,string> = {
    glb:"#a78bfa", gltf:"#a78bfa", obj:"#22d3ee", fbx:"#22d3ee", dwg:"#fbbf24", dxf:"#fbbf24",
  };

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
    const m: Record<string,string> = {
      pending: "border-amber-500/25 bg-amber-500/10 text-amber-300",
      approved:"border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
      rejected:"border-rose-500/25 bg-rose-500/10 text-rose-300",
    };
    return `px-2.5 py-1 rounded-lg text-[9px] font-black border ${m[s] ?? "border-white/10 bg-white/5 text-white/30"}`;
  };

  const rolePill = (r: string) => {
    const m: Record<string,string> = {
      admin:    "border-rose-500/25 bg-rose-500/10 text-rose-300",
      developer:"border-violet-500/25 bg-violet-500/10 text-violet-300",
      user:     "border-white/10 bg-white/5 text-white/30",
    };
    return `px-2.5 py-1 rounded-lg text-[9px] font-black border ${m[r] ?? m.user}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050008] flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050008]">

      {/* Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
        style={{ background:"radial-gradient(ellipse,rgba(124,58,237,0.1) 0%,transparent 70%)", filter:"blur(80px)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-28 pb-20">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-500/20 bg-rose-500/5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-rose-300/80 text-[10px] font-black uppercase tracking-widest">Control Panel</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">Admin Dashboard</h1>
          <p className="text-white/30 text-sm">Manage models, users, applications and certifications.</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STATS.map((s,i) => (
            <div key={i} className="relative p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition duration-200">
              <div className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                style={{ background:`linear-gradient(90deg,transparent,${s.color}30,transparent)` }} />
              <svg className="w-5 h-5 mb-3 opacity-50" style={{ color:s.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={s.icon} />
              </svg>
              <p className="text-2xl font-black mb-0.5"
                style={{ backgroundImage:`linear-gradient(135deg,${s.color},white)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                {s.val}
              </p>
              <p className="text-white/25 text-[9px] font-semibold uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Secondary stats row */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.15 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label:"Free Models",    val: freeModels.length,   color:"#34d399" },
            { label:"Paid Models",    val: paidModels.length,   color:"#fbbf24" },
            { label:"Pending Apps",   val: pendingApps.length,  color:"#fb7185" },
            { label:"Pending Certs",  val: pendingCerts.length, color:"#818cf8" },
          ].map((s,i) => (
            <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.015] flex items-center gap-3">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:s.color, boxShadow:`0 0 6px ${s.color}` }} />
              <div>
                <p className="text-white font-black text-lg leading-none">{s.val}</p>
                <p className="text-white/25 text-[9px] uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/6 mb-8 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest whitespace-nowrap transition duration-200 border-b-2 ${
                activeTab===t.id ? "border-violet-500 text-violet-300" : "border-transparent text-white/30 hover:text-white/60"
              }`}>
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
                  style={{ background: activeTab===t.id?"rgba(167,139,250,0.3)":"rgba(251,113,133,0.2)", color: activeTab===t.id?"#a78bfa":"#fb7185" }}>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Recent models */}
                <div className="relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl p-6">
                  <div className="absolute top-0 left-0 right-0 h-[1px]"
                    style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.3),transparent)" }} />
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-black text-white text-sm">Recent Uploads</h3>
                    <button onClick={() => setActiveTab("models")} className="text-violet-400/60 text-xs hover:text-violet-300 transition duration-150">View all →</button>
                  </div>
                  {models.length === 0 ? (
                    <p className="text-white/20 text-sm text-center py-8">No models yet</p>
                  ) : (
                    <div className="space-y-3">
                      {models.slice(0,5).map(m => {
                        const ext = m.fileType?.toLowerCase() ?? "glb";
                        const c = FILE_COLORS[ext] ?? "#a78bfa";
                        return (
                          <div key={m.id} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/8 bg-white/[0.03] flex-shrink-0 flex items-center justify-center"
                              style={{ background:`${c}10` }}>
                              {m.thumbnailUrl
                                ? <img src={m.thumbnailUrl} className="w-full h-full object-cover" />
                                : <svg className="w-4 h-4 opacity-30" style={{ color:c }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white/70 text-xs font-bold truncate">{m.title || "Untitled"}</p>
                              <p className="text-white/25 text-[10px]">{m.authorName} · {timeAgo(m.uploadedAt)}</p>
                            </div>
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md" style={{ color:c, background:`${c}18`, border:`1px solid ${c}30` }}>
                              {ext.toUpperCase()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Pending actions */}
                <div className="relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl p-6">
                  <div className="absolute top-0 left-0 right-0 h-[1px]"
                    style={{ background:"linear-gradient(90deg,transparent,rgba(251,191,36,0.3),transparent)" }} />
                  <h3 className="font-black text-white text-sm mb-5">Pending Actions</h3>
                  <div className="space-y-3">
                    {pendingApps.length === 0 && pendingCerts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-emerald-400/60 text-sm font-bold">✓ All clear!</p>
                        <p className="text-white/20 text-xs mt-1">No pending actions</p>
                      </div>
                    ) : (
                      <>
                        {pendingApps.slice(0,3).map(a => (
                          <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-amber-500/15 bg-amber-500/5">
                            <div className="min-w-0">
                              <p className="text-white/70 text-xs font-bold truncate">{a.name}</p>
                              <p className="text-amber-400/60 text-[10px]">Developer application</p>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                              <button onClick={() => approveApplication(a)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-black border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition duration-150">
                                ✓
                              </button>
                              <button onClick={() => rejectApplication(a.id)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-black border border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition duration-150">
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                        {pendingCerts.slice(0,3).map(c => (
                          <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-violet-500/15 bg-violet-500/5">
                            <div className="min-w-0">
                              <p className="text-white/70 text-xs font-bold truncate">{c.name}</p>
                              <p className="text-violet-400/60 text-[10px]">Certification request</p>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                              <button onClick={() => approveCert(c.id, c.userId)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-black border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition duration-150">
                                ✓
                              </button>
                              <button onClick={() => rejectCert(c.id)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-black border border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition duration-150">
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
              <div className="flex items-center justify-between mb-5">
                <p className="text-white/30 text-sm">{models.length} model{models.length!==1?"s":""} on platform</p>
                <Link href="/upload">
                  <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                    style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                    className="px-4 py-2 rounded-xl font-black text-white text-xs cursor-pointer relative overflow-hidden">
                    <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                      style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                    <span className="relative z-10">+ Upload Model</span>
                  </motion.div>
                </Link>
              </div>

              {models.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center border border-white/5 rounded-3xl bg-white/[0.01]">
                  <p className="text-white/30 font-black text-lg">No models uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {models.map((m,i) => {
                    const ext = m.fileType?.toLowerCase() ?? "glb";
                    const c = FILE_COLORS[ext] ?? "#a78bfa";
                    return (
                      <motion.div key={m.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}
                        className="relative rounded-2xl border border-white/6 bg-white/[0.025] overflow-hidden hover:border-white/12 transition duration-200">
                        <div className="h-[1px]" style={{ background:`linear-gradient(90deg,transparent,${c}35,transparent)` }} />

                        {/* Thumb */}
                        <div className="relative h-36 overflow-hidden" style={{ background:`${c}10` }}>
                          {m.thumbnailUrl
                            ? <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-8 h-8 opacity-15" style={{ color:c }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                          }
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-black"
                            style={{ color:c, background:`${c}25`, border:`1px solid ${c}40` }}>
                            {ext.toUpperCase()}
                          </div>
                          {m.isPaid && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-black border border-emerald-500/30 bg-emerald-500/20 text-emerald-300">
                              ₹{m.price}
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <p className="text-white/80 text-sm font-black truncate mb-1">{m.title || "Untitled"}</p>
                          <div className="flex items-center justify-between text-white/25 text-xs mb-3">
                            <span>{m.authorName}</span>
                            <span>{timeAgo(m.uploadedAt)}</span>
                          </div>
                          <div className="flex items-center gap-3 text-white/20 text-[10px] mb-4">
                            <span>👁 {m.views ?? 0}</span>
                            <span>⬇ {m.downloads ?? 0}</span>
                            <span>♥ {m.likes ?? 0}</span>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/gallery/${m.id}`} className="flex-1">
                              <div className="py-2 rounded-xl text-center text-xs font-bold border border-white/8 text-white/40 hover:border-white/16 hover:text-white/60 transition duration-200 cursor-pointer">
                                View →
                              </div>
                            </Link>
                            <button onClick={() => deleteModel(m.id)}
                              className="flex-1 py-2 rounded-xl text-xs font-bold border border-rose-500/20 bg-rose-500/8 text-rose-400 hover:bg-rose-500/15 transition duration-200">
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
              <p className="text-white/30 text-sm mb-5">{users.length} registered users</p>
              {users.length === 0 ? (
                <div className="text-center py-24 text-white/20">No users yet</div>
              ) : (
                <div className="space-y-2">
                  {users.map((u,i) => (
                    <motion.div key={u.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.02 }}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition duration-200">
                      <div className="w-10 h-10 rounded-2xl overflow-hidden border border-white/8 bg-white/[0.03] flex items-center justify-center flex-shrink-0 font-black text-white/25 text-sm"
                        style={{ background: u.role==="developer"?"rgba(124,58,237,0.1)":u.role==="admin"?"rgba(251,113,133,0.1)":"rgba(255,255,255,0.02)" }}>
                        {u.profileImage && u.profileImage !== "/avatar.png"
                          ? <img src={u.profileImage} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                          : (u.name?.[0] ?? u.email?.[0] ?? "?")
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-sm font-bold truncate">{u.name || "No name"}</p>
                        <p className="text-white/25 text-xs truncate">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={rolePill(u.role)}>{u.role}</span>
                        {u.certified && <span className="px-2.5 py-1 rounded-lg text-[9px] font-black border border-amber-500/25 bg-amber-500/10 text-amber-300">⭐ Certified</span>}
                        {u.role === "user" && (
                          <button onClick={() => promoteUser(u.id)}
                            className="px-3 py-1.5 rounded-xl text-[10px] font-black border border-violet-500/20 bg-violet-500/8 text-violet-300 hover:bg-violet-500/15 transition duration-200">
                            Promote
                          </button>
                        )}
                        {u.role === "developer" && (
                          <button onClick={() => demoteUser(u.id)}
                            className="px-3 py-1.5 rounded-xl text-[10px] font-black border border-white/8 text-white/30 hover:border-rose-500/20 hover:text-rose-400 transition duration-200">
                            Demote
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
              <p className="text-white/30 text-sm mb-5">{applications.length} total · {pendingApps.length} pending</p>
              {applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <p className="text-white/30 font-black text-lg">No applications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((a,i) => (
                    <motion.div key={a.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}
                      className={`p-5 rounded-2xl border transition duration-200 ${
                        a.status==="pending" ? "border-amber-500/15 bg-amber-500/[0.03]" : "border-white/5 bg-white/[0.02]"
                      }`}>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <p className="text-white/80 font-black text-sm">{a.name}</p>
                            <span className={statusPill(a.status)}>{a.status.toUpperCase()}</span>
                          </div>
                          {a.skills && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {(Array.isArray(a.skills) ? a.skills : a.skills.split(",")).slice(0,6).map((s: string) => (
                                <span key={s} className="px-2 py-0.5 rounded-md text-[9px] font-bold border border-violet-500/20 bg-violet-500/8 text-violet-300/70">{s.trim()}</span>
                              ))}
                            </div>
                          )}
                          {a.bio && <p className="text-white/30 text-xs line-clamp-2">{a.bio}</p>}
                          <div className="flex gap-3 mt-2 text-white/20 text-xs">
                            {a.portfolio && <a href={a.portfolio} target="_blank" className="text-violet-400/50 hover:text-violet-300 transition duration-150">Portfolio ↗</a>}
                            {a.linkedin && <a href={a.linkedin} target="_blank" className="text-cyan-400/50 hover:text-cyan-300 transition duration-150">LinkedIn ↗</a>}
                          </div>
                        </div>
                        {a.status === "pending" && (
                          <div className="flex gap-2 flex-shrink-0">
                            <motion.button onClick={() => approveApplication(a)}
                              whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                              style={{ willChange:"transform", background:"linear-gradient(135deg,#059669,#0891b2)" }}
                              className="px-4 py-2 rounded-xl font-black text-white text-xs">
                              ✓ Approve
                            </motion.button>
                            <button onClick={() => rejectApplication(a.id)}
                              className="px-4 py-2 rounded-xl font-bold text-rose-400 text-xs border border-rose-500/20 hover:bg-rose-500/8 transition duration-200">
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
              <p className="text-white/30 text-sm mb-5">{certRequests.length} total · {pendingCerts.length} pending</p>
              {certRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <p className="text-white/30 font-black text-lg">No certification requests yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {certRequests.map((c,i) => (
                    <motion.div key={c.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}
                      className={`p-5 rounded-2xl border transition duration-200 ${
                        c.status==="pending" ? "border-violet-500/15 bg-violet-500/[0.03]" : "border-white/5 bg-white/[0.02]"
                      }`}>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <p className="text-white/80 font-black text-sm">{c.name}</p>
                            <span className={statusPill(c.status)}>{c.status.toUpperCase()}</span>
                          </div>
                          <p className="text-white/30 text-xs mb-1">{c.email}</p>
                          {c.reason && (
                            <p className="text-white/40 text-xs leading-relaxed line-clamp-2 mb-2">"{c.reason}"</p>
                          )}
                          <div className="flex gap-3 text-xs">
                            {c.portfolio && <a href={c.portfolio} target="_blank" className="text-violet-400/50 hover:text-violet-300 transition duration-150">Portfolio ↗</a>}
                            {c.linkedin && <a href={c.linkedin} target="_blank" className="text-cyan-400/50 hover:text-cyan-300 transition duration-150">LinkedIn ↗</a>}
                            {c.experience && <span className="text-white/20">{c.experience} yrs exp</span>}
                          </div>
                        </div>
                        {c.status === "pending" && (
                          <div className="flex gap-2 flex-shrink-0">
                            <motion.button onClick={() => approveCert(c.id, c.userId)}
                              whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                              style={{ willChange:"transform", background:"linear-gradient(135deg,#d97706,#7c3aed)" }}
                              className="px-4 py-2 rounded-xl font-black text-white text-xs">
                              ⭐ Certify
                            </motion.button>
                            <button onClick={() => rejectCert(c.id)}
                              className="px-4 py-2 rounded-xl font-bold text-rose-400 text-xs border border-rose-500/20 hover:bg-rose-500/8 transition duration-200">
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
            className="fixed bottom-6 right-6 z-50 px-6 py-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 backdrop-blur-xl text-emerald-300 text-sm font-bold shadow-[0_8px_32px_rgba(52,211,153,0.2)]">
            ✓ {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}