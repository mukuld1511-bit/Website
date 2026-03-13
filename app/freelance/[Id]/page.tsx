"use client";

import { useEffect, useState } from "react";
import {
  doc, getDoc, collection, getDocs, query,
  where, updateDoc, serverTimestamp, addDoc,
} from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// ── Commission ────────────────────────────────────────────────────────────────
const PLATFORM_FEE = 0.15;
const DIVISOR      = 0.83;
function getBuyerPrice(x: number)  { return Math.ceil(x / DIVISOR); }
function getPlatformFee(x: number) { return Math.ceil(x * PLATFORM_FEE); }
function getDevEarnings(x: number) { return Math.floor(x * (1 - PLATFORM_FEE)); }

// ── Types ─────────────────────────────────────────────────────────────────────
interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  budgetType: "fixed" | "hourly";
  skills: string[];
  deadline: string;
  clientId: string;
  clientName: string;
  clientPhoto: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  bidsCount: number;
  createdAt: any;
}

interface Bid {
  id: string;
  developerId: string;
  developerName: string;
  developerPhoto: string;
  amount: number;
  developerEarns?: number;
  platformFee?: number;
  clientPays?: number;
  timeline: string;
  proposal: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: any;
}

function timeAgo(ts: any): string {
  if (!ts) return "";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function FreelanceProjectPage() {
  const params    = useParams();
  const projectId = (params?.Id || params?.id) as string;

  const [project,    setProject]    = useState<Project | null>(null);
  const [bids,       setBids]       = useState<Bid[]>([]);
  const [user,       setUser]       = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [showBid,    setShowBid]    = useState(false);
  const [amount,     setAmount]     = useState("");
  const [timeline,   setTimeline]   = useState("");
  const [proposal,   setProposal]   = useState("");
  const [bidding,    setBidding]    = useState(false);
  const [alreadyBid, setAlreadyBid] = useState(false);
  const [toast,      setToast]      = useState("");
  const [sortBy,     setSortBy]     = useState<"newest"|"lowest"|"highest">("newest");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!projectId) return;
    async function load() {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db,"freelanceProjects",projectId));
        if (snap.exists()) setProject({ id:snap.id, ...snap.data() } as Project);

        // No orderBy — sort client side (avoids index requirement)
        const bSnap = await getDocs(query(
          collection(db,"freelanceBids"),
          where("projectId","==",projectId)
        ));
        const raw = bSnap.docs.map(d => ({ id:d.id, ...d.data() } as Bid));
        setBids(raw);
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [projectId]);

  useEffect(() => {
    if (!user || bids.length === 0) return;
    setAlreadyBid(bids.some(b => b.developerId === user.uid));
  }, [bids, user]);

  // Sorted bids based on sortBy
  const sortedBids = [...bids].sort((a,b) => {
    if (sortBy === "lowest")  return a.amount - b.amount;
    if (sortBy === "highest") return b.amount - a.amount;
    // newest
    return (b.createdAt?.seconds??0) - (a.createdAt?.seconds??0);
  });

  async function submitBid(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !project || !amount || !proposal.trim()) return;
    setBidding(true);
    try {
      const bidAmount  = parseFloat(amount);
      const devEarns   = getDevEarnings(bidAmount);
      const platFee    = getPlatformFee(bidAmount);
      const clientPays = getBuyerPrice(bidAmount);

      await addDoc(collection(db,"freelanceBids"), {
        projectId,
        developerId:    user.uid,
        developerName:  user.displayName ?? "Developer",
        developerPhoto: user.photoURL ?? "",
        amount:         bidAmount,
        developerEarns: devEarns,
        platformFee:    platFee,
        clientPays,
        timeline:       timeline.trim(),
        proposal:       proposal.trim(),
        status:         "pending",
        createdAt:      serverTimestamp(),
      });
      await updateDoc(doc(db,"freelanceProjects",projectId), {
        bidsCount: (project.bidsCount ?? 0) + 1,
      });

      // Refresh bids
      const bSnap = await getDocs(query(
        collection(db,"freelanceBids"),
        where("projectId","==",projectId)
      ));
      const raw = bSnap.docs.map(d => ({ id:d.id, ...d.data() } as Bid));
      setBids(raw);
      setShowBid(false);
      setAmount(""); setTimeline(""); setProposal("");
      setAlreadyBid(true);
      showToast("Bid submitted!");
    } catch(e) { console.error(e); }
    setBidding(false);
  }

  async function acceptBid(bid: Bid) {
    try {
      await updateDoc(doc(db,"freelanceBids",bid.id), { status:"accepted" });
      // Reject all others
      await Promise.all(
        bids
          .filter(b => b.id !== bid.id && b.status === "pending")
          .map(b => updateDoc(doc(db,"freelanceBids",b.id), { status:"rejected" }))
      );
      await updateDoc(doc(db,"freelanceProjects",projectId), { status:"in_progress" });
      setBids(p => p.map(b => ({
        ...b,
        status: b.id === bid.id ? "accepted" : b.status === "pending" ? "rejected" : b.status,
      })));
      if (project) setProject({ ...project, status:"in_progress" });
      showToast(`Bid accepted! ₹${(bid.clientPays ?? getBuyerPrice(bid.amount)).toLocaleString()} will be charged.`);
    } catch(e) { console.error(e); }
  }

  async function rejectBid(bidId: string) {
    await updateDoc(doc(db,"freelanceBids",bidId), { status:"rejected" });
    setBids(p => p.map(b => b.id===bidId ? { ...b, status:"rejected" as const } : b));
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 4000); }

  const statusColors: Record<string,string> = {
    open:"#34d399", in_progress:"#fbbf24", completed:"#a78bfa", cancelled:"#fb7185",
  };

  const inputCls = "w-full bg-white/[0.04] border border-white/8 text-white placeholder-white/25 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition duration-200";
  const bidNum   = parseFloat(amount) || 0;

  if (loading) return (
    <div className="min-h-screen bg-[#050008] flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white mb-3">Project not found</h2>
          <Link href="/freelance">
            <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
              style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
              className="inline-flex px-6 py-3 rounded-2xl text-white font-black text-sm cursor-pointer mt-3">
              ← Browse Projects
            </motion.div>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  const sc       = statusColors[project.status] ?? "#34d399";
  const isClient = user?.uid === project.clientId;
  const canBid   = user && !isClient && project.status === "open" && !alreadyBid;

  // Bid stats
  const pendingBids  = bids.filter(b => b.status === "pending");
  const lowestBid    = pendingBids.length ? Math.min(...pendingBids.map(b=>b.amount)) : null;
  const highestBid   = pendingBids.length ? Math.max(...pendingBids.map(b=>b.amount)) : null;
  const avgBid       = pendingBids.length ? Math.round(pendingBids.reduce((s,b)=>s+b.amount,0)/pendingBids.length) : null;

  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />

      <div className="relative pt-24 pb-20 px-4 overflow-x-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
          style={{ background:"radial-gradient(ellipse,rgba(124,58,237,0.1) 0%,transparent 70%)", filter:"blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.018] pointer-events-none"
          style={{ backgroundImage:"linear-gradient(rgba(167,139,250,1) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,1) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />

        <div className="relative z-10 max-w-5xl mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-white/30 text-xs font-semibold">
            <Link href="/freelance" className="hover:text-white/60 transition duration-150">Freelance</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white/50 truncate max-w-[200px]">{project.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

            {/* ── Left ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Project card */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
                className="relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl overflow-hidden p-7">
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.3),transparent)" }} />

                <div className="flex items-start gap-3 flex-wrap mb-5">
                  <div className="flex items-center gap-2 flex-wrap flex-1">
                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-black border"
                      style={{ color:sc, background:`${sc}15`, borderColor:`${sc}30` }}>
                      ● {project.status.replace("_"," ").toUpperCase()}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-black border border-violet-500/20 bg-violet-500/8 text-violet-300">
                      {project.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black"
                      style={{ backgroundImage:"linear-gradient(135deg,#34d399,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                      ₹{project.budget.toLocaleString()}
                    </p>
                    <p className="text-white/30 text-xs">{project.budgetType} · dev receives</p>
                  </div>
                </div>

                <h1 className="text-2xl font-black text-white mb-4 leading-snug">{project.title}</h1>
                <p className="text-white/45 text-sm leading-relaxed mb-6">{project.description}</p>

                {project.skills?.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/25 mb-3">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map(s => (
                        <span key={s} className="px-3 py-1.5 rounded-xl border border-white/8 bg-white/[0.03] text-white/50 text-xs font-bold">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-5 border-t border-white/5">
                  {[
                    { label:"Posted by",    val: project.clientName },
                    { label:"Posted",       val: timeAgo(project.createdAt) },
                    { label:"Deadline",     val: project.deadline ? new Date(project.deadline).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "Flexible" },
                    { label:"Total Bids",   val: `${bids.length}` },
                    { label:"Budget",       val: `₹${project.budget.toLocaleString()} (${project.budgetType})` },
                    { label:"Client pays",  val: `₹${getBuyerPrice(project.budget).toLocaleString()} incl. fees` },
                  ].map((m,i) => (
                    <div key={i}>
                      <p className="text-white/20 text-[9px] font-black uppercase tracking-widest mb-0.5">{m.label}</p>
                      <p className="text-white/60 text-xs font-bold">{m.val}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Bid stats (client only) */}
              {isClient && bids.length > 0 && (
                <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.05 }}
                  className="relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl overflow-hidden p-6">
                  <div className="absolute top-0 left-0 right-0 h-[1px]"
                    style={{ background:"linear-gradient(90deg,transparent,rgba(52,211,153,0.3),transparent)" }} />
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25 mb-4">Bid Overview</p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label:"Total Bids",   val: bids.length,                               color:"#a78bfa" },
                      { label:"Lowest Bid",   val: lowestBid  ? `₹${lowestBid.toLocaleString()}`  : "—", color:"#34d399" },
                      { label:"Highest Bid",  val: highestBid ? `₹${highestBid.toLocaleString()}` : "—", color:"#fb7185" },
                      { label:"Average Bid",  val: avgBid     ? `₹${avgBid.toLocaleString()}`     : "—", color:"#22d3ee" },
                    ].map((s,i) => (
                      <div key={i} className="p-3 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                        <p className="font-black text-sm mb-0.5" style={{ color:s.color }}>{s.val}</p>
                        <p className="text-white/25 text-[9px] uppercase tracking-widest">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Commission card */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.07 }}
                className="relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl overflow-hidden p-6">
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background:"linear-gradient(90deg,transparent,rgba(52,211,153,0.3),transparent)" }} />
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25 mb-4">Fee Structure</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label:"Dev receives",   val:`₹${project.budget.toLocaleString()}`,                  color:"#34d399" },
                    { label:"Platform (15%)", val:`₹${getPlatformFee(project.budget).toLocaleString()}`,  color:"#a78bfa" },
                    { label:"Client pays",    val:`₹${getBuyerPrice(project.budget).toLocaleString()}`,   color:"#22d3ee" },
                  ].map((s,i) => (
                    <div key={i} className="p-3 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                      <p className="font-black text-sm mb-0.5" style={{ color:s.color }}>{s.val}</p>
                      <p className="text-white/25 text-[9px] uppercase tracking-widest">{s.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Bids list */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}
                className="relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl overflow-hidden p-7">
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background:"linear-gradient(90deg,transparent,rgba(34,211,238,0.3),transparent)" }} />

                <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                  <h2 className="text-lg font-black text-white">
                    Proposals <span className="text-white/30 text-base">({bids.length})</span>
                  </h2>

                  {/* Sort controls */}
                  {bids.length > 1 && (
                    <div className="flex items-center gap-2">
                      {(["newest","lowest","highest"] as const).map(s => (
                        <button key={s} onClick={() => setSortBy(s)}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-black border transition duration-200 capitalize"
                          style={sortBy===s
                            ? { background:"rgba(167,139,250,0.12)", borderColor:"rgba(167,139,250,0.35)", color:"#a78bfa" }
                            : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.3)" }
                          }>
                          {s === "newest" ? "Newest" : s === "lowest" ? "↑ Lowest" : "↓ Highest"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {bids.length === 0 ? (
                  <div className="text-center py-12 text-white/20 text-sm">No proposals yet — be the first!</div>
                ) : (isClient || user) ? (
                  <div className="space-y-4">
                    {sortedBids.map((b,i) => (
                      <motion.div key={b.id}
                        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                        transition={{ delay:i*0.04 }}
                        className={`p-5 rounded-2xl border transition duration-200 ${
                          b.status==="accepted"
                            ? "border-emerald-500/25 bg-emerald-500/5"
                            : b.status==="rejected"
                            ? "border-white/4 bg-white/[0.01] opacity-50"
                            : "border-white/6 bg-white/[0.02]"
                        }`}>
                        <div className="flex items-start gap-4">
                          <Link href={`/developer/${b.developerId}`}>
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-white/[0.05] flex items-center justify-center flex-shrink-0 cursor-pointer hover:border-violet-500/30 transition duration-150">
                              {b.developerPhoto
                                ? <img src={b.developerPhoto} className="w-full h-full object-cover"
                                    onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                                : <span className="text-white/30 text-xs font-black">{b.developerName?.[0]}</span>
                              }
                            </div>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <Link href={`/developer/${b.developerId}`}>
                                  <span className="text-white/80 text-sm font-black hover:text-violet-300 transition duration-150 cursor-pointer">
                                    {b.developerName}
                                  </span>
                                </Link>
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border ${
                                  b.status==="accepted" ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-300" :
                                  b.status==="rejected" ? "border-rose-500/25 bg-rose-500/12 text-rose-300" :
                                  "border-white/10 bg-white/[0.04] text-white/30"
                                }`}>{b.status.toUpperCase()}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-emerald-300 font-black text-sm">₹{b.amount.toLocaleString()}</p>
                                {b.timeline && <p className="text-white/25 text-[10px]">{b.timeline}</p>}
                              </div>
                            </div>

                            <p className="text-white/45 text-sm leading-relaxed mb-3">{b.proposal}</p>

                            {/* Commission breakdown per bid */}
                            <div className="flex items-center gap-3 flex-wrap text-[10px] mb-2">
                              <span className="text-white/25">Dev earns: <span className="text-emerald-400/70 font-bold">₹{(b.developerEarns ?? getDevEarnings(b.amount)).toLocaleString()}</span></span>
                              <span className="text-white/15">·</span>
                              <span className="text-white/25">Platform: <span className="text-violet-400/70 font-bold">₹{(b.platformFee ?? getPlatformFee(b.amount)).toLocaleString()}</span></span>
                              <span className="text-white/15">·</span>
                              <span className="text-white/25">Client pays: <span className="text-cyan-400/70 font-bold">₹{(b.clientPays ?? getBuyerPrice(b.amount)).toLocaleString()}</span></span>
                            </div>

                            <p className="text-white/20 text-[10px]">{timeAgo(b.createdAt)}</p>
                          </div>
                        </div>

                        {isClient && project.status === "open" && b.status === "pending" && (
                          <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                            <motion.button onClick={() => acceptBid(b)}
                              whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                              style={{ willChange:"transform", background:"linear-gradient(135deg,#059669,#0891b2)" }}
                              className="flex-1 py-2.5 rounded-xl font-black text-white text-xs">
                              ✓ Accept — Pay ₹{(b.clientPays ?? getBuyerPrice(b.amount)).toLocaleString()}
                            </motion.button>
                            <motion.button onClick={() => rejectBid(b.id)}
                              whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} style={{ willChange:"transform" }}
                              className="flex-1 py-2.5 rounded-xl font-bold text-rose-400/70 text-xs border border-rose-500/20 hover:bg-rose-500/8 transition duration-200">
                              ✕ Reject
                            </motion.button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-white/25 text-sm">
                    <Link href="/login" className="text-violet-400/70 hover:text-violet-300 transition duration-150 font-semibold">Sign in</Link>
                    {" "}to view proposals
                  </div>
                )}
              </motion.div>
            </div>

            {/* ── Sidebar ── */}
            <div className="lg:col-span-1 space-y-4">

              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}
                className="relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl overflow-hidden p-6 space-y-3">
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.3),transparent)" }} />

                <div className="text-center pb-2">
                  <p className="text-3xl font-black mb-0.5"
                    style={{ backgroundImage:"linear-gradient(135deg,#34d399,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                    ₹{project.budget.toLocaleString()}
                  </p>
                  <p className="text-white/30 text-xs">{project.budgetType} budget</p>
                  <p className="text-white/20 text-[10px] mt-1">Client pays ₹{getBuyerPrice(project.budget).toLocaleString()} incl. fees</p>
                </div>

                {canBid ? (
                  <motion.button onClick={() => setShowBid(true)}
                    whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                    style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                    className="w-full py-4 rounded-2xl font-black text-white text-sm relative overflow-hidden">
                    <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                      style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                    <span className="relative z-10">Submit Proposal →</span>
                  </motion.button>
                ) : alreadyBid ? (
                  <div className="w-full py-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 text-emerald-300 font-black text-sm text-center">
                    ✓ Proposal Submitted
                  </div>
                ) : !user ? (
                  <Link href="/login">
                    <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                      style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                      className="w-full py-4 rounded-2xl font-black text-white text-sm cursor-pointer text-center">
                      Sign In to Bid →
                    </motion.div>
                  </Link>
                ) : isClient ? (
                  <div className="py-3 rounded-xl border border-amber-500/20 bg-amber-500/8 text-amber-300 font-black text-xs text-center">
                    You posted this project
                  </div>
                ) : (
                  <div className="py-3 rounded-xl border border-white/8 bg-white/[0.02] text-white/30 font-bold text-xs text-center">
                    {project.status === "in_progress" ? "Project in progress" : "Project closed"}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { label:"Bids",    val: bids.length },
                    { label:"Budget",  val: `₹${(project.budget/1000).toFixed(0)}K` },
                  ].map((s,i) => (
                    <div key={i} className="p-3 rounded-xl border border-white/5 bg-white/[0.02] text-center">
                      <p className="text-white font-black text-lg">{s.val}</p>
                      <p className="text-white/25 text-[9px] uppercase tracking-widest">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <svg className="w-3 h-3 text-emerald-400/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-white/20 text-[10px]">Payment secured via Razorpay</p>
                </div>
              </motion.div>

              <Link href="/freelance">
                <motion.div whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} style={{ willChange:"transform" }}
                  className="w-full py-3 rounded-2xl border border-white/8 font-bold text-white/40 text-xs hover:border-white/16 hover:text-white/60 transition duration-200 cursor-pointer text-center">
                  ← All Projects
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bid modal */}
      <AnimatePresence>
        {showBid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowBid(false)} />
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
              transition={{ duration:0.3 }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0012] backdrop-blur-xl p-8">
              <div className="absolute top-0 left-0 right-0 h-[1px]"
                style={{ background:"linear-gradient(90deg,transparent,rgba(34,211,238,0.5),rgba(167,139,250,0.3),transparent)" }} />

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-white">Submit Proposal</h3>
                  <p className="text-white/35 text-xs mt-1">
                    Client budget: <span className="text-emerald-300 font-black">₹{project.budget.toLocaleString()}</span>
                  </p>
                </div>
                <button onClick={() => setShowBid(false)}
                  className="w-8 h-8 rounded-lg border border-white/8 flex items-center justify-center hover:border-white/20 text-white/40 hover:text-white/70 transition duration-200">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={submitBid} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Your Bid (₹) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 text-sm">₹</span>
                      <input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)}
                        required placeholder="20000" className={inputCls + " pl-7"} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Timeline</label>
                    <input value={timeline} onChange={e=>setTimeline(e.target.value)}
                      placeholder="e.g. 2 weeks" className={inputCls} />
                  </div>
                </div>

                {/* Live earnings breakdown */}
                <AnimatePresence>
                  {bidNum > 0 && (
                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
                      exit={{ opacity:0, height:0 }}
                      className="relative p-4 rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[1px]"
                        style={{ background:"linear-gradient(90deg,transparent,rgba(34,211,238,0.3),transparent)" }} />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">Your Earnings</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400/60" />Your bid
                          </span>
                          <span className="text-emerald-400 font-black">₹{bidNum.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-violet-400/60" />Platform (15%)
                          </span>
                          <span className="text-white/40">- ₹{getPlatformFee(bidNum).toLocaleString()}</span>
                        </div>
                        <div className="h-[1px] bg-white/6" />
                        <div className="flex justify-between text-xs">
                          <span className="text-white/70 font-black">You receive</span>
                          <span className="text-white font-black">₹{getDevEarnings(bidNum).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-white/25">Client pays (incl. fees)</span>
                          <span className="text-white/40 font-bold">₹{getBuyerPrice(bidNum).toLocaleString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">Proposal *</label>
                  <textarea value={proposal} onChange={e=>setProposal(e.target.value)} rows={4} required
                    placeholder="Describe your approach, experience, and why you're the best fit…"
                    className={inputCls + " resize-none"} />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowBid(false)}
                    className="flex-1 py-3 rounded-xl border border-white/8 text-white/40 text-sm font-bold hover:border-white/15 transition duration-200">
                    Cancel
                  </button>
                  <motion.button type="submit" disabled={bidding}
                    whileHover={{ scale:bidding?1:1.03 }} whileTap={{ scale:bidding?1:0.97 }}
                    style={{ willChange:"transform", background:bidding?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#0891b2,#7c3aed)" }}
                    className="flex-1 py-3 rounded-xl font-black text-white text-sm disabled:opacity-50">
                    {bidding ? "Submitting…" : "Submit →"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:20, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:20, scale:0.95 }} transition={{ duration:0.3 }}
            className="fixed bottom-6 right-6 z-50 px-6 py-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 backdrop-blur-xl text-emerald-300 text-sm font-bold shadow-[0_8px_32px_rgba(52,211,153,0.2)]">
            ✓ {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}