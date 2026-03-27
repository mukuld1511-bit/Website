"use client";
import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, limit, doc, getDoc, addDoc, updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Footer from "../components/Footer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Project {
  id: string; title: string; description: string; budget: number;
  budgetType: "fixed" | "negotiable"; skills: string[]; deadline: string;
  status: "open" | "in_progress" | "completed"; authorId: string;
  authorName: string; authorPhoto: string; createdAt: any;
  bids: Bid[]; assignedTo?: string;
}
interface Bid {
  userId: string; userName: string; userPhoto: string;
  amount: number; message: string; createdAt: any; status: "pending" | "accepted" | "rejected" | "negotiating";
}

const HUB_CARDS = [
  { label: "Post a Project", desc: "Describe your XR/3D project and receive bids", href: "/requests/post", icon: "M12 4v16m8-8H4", color: "#5B4BDB", bg: "#EEEDFE" },
  { label: "Browse Projects", desc: "Find open projects and submit your bid", href: "#projects", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "#185FA5", bg: "#E6F1FB" },
  { label: "Hire a Developer", desc: "Browse verified XR developers and book directly", href: "/freelance/hire", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "#0F6E56", bg: "#E1F5EE" },
  { label: "My Projects", desc: "Track your active projects and bids", href: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", color: "#B45309", bg: "#FAEEDA" },
];

const SKILLS_FILTER = ["All", "Unity", "Unreal", "WebXR", "Blender", "ARCore", "ARKit", "Three.js", "React Native"];

function BudgetBadge({ type, amount }: { type: string; amount: number }) {
  if (type === "negotiable") return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      ~₹{amount.toLocaleString()} · Negotiable
    </span>
  );
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
      ₹{amount.toLocaleString()} Fixed
    </span>
  );
}

function ProjectCard({ p, userId, userRole }: { p: Project; userId: string | null; userRole: string }) {
  const [showBid, setShowBid] = useState(false);
  const [bidAmount, setBidAmount] = useState(p.budget);
  const [bidMessage, setBidMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const myBid = p.bids?.find(b => b.userId === userId);
  const canBid = userId && ["developer", "mentor", "admin"].includes(userRole) && !myBid && p.status === "open";
  const isOwner = userId === p.authorId;
  const daysLeft = p.deadline ? Math.max(0, Math.ceil((new Date(p.deadline).getTime() - Date.now()) / 86400000)) : null;

  const submitBid = async () => {
    if (!userId || !bidMessage.trim()) return;
    setSubmitting(true);
    try {
      const userSnap = await getDoc(doc(db, "users", userId));
      const userData = userSnap.exists() ? userSnap.data() : { displayName: "Developer", photoURL: "" };
      const newBid: Bid = {
        userId, userName: userData.displayName || "Developer", userPhoto: userData.photoURL || "",
        amount: bidAmount, message: bidMessage.trim(),
        createdAt: new Date(), status: "pending",
      };
      await updateDoc(doc(db, "requests", p.id), { bids: arrayUnion(newBid) });
      setSubmitted(true); setShowBid(false);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${p.status === "open" ? "bg-green-50 text-green-700 border-green-200" : p.status === "in_progress" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                {p.status === "open" ? "Open" : p.status === "in_progress" ? "In Progress" : "Completed"}
              </span>
              {daysLeft !== null && daysLeft <= 3 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                  {daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
                </span>
              )}
            </div>
            <h3 className="font-black text-white text-base leading-snug">{p.title}</h3>
          </div>
          <BudgetBadge type={p.budgetType} amount={p.budget} />
        </div>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{p.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {p.skills?.map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 font-medium">{s}</span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 flex items-center justify-between gap-4 bg-[#0A0A0F]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-xs font-bold text-gray-600">
            {p.authorPhoto ? <img src={p.authorPhoto} className="w-full h-full object-cover" alt="" /> : p.authorName?.[0]}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">{p.authorName}</p>
            <p className="text-xs text-gray-400">{p.bids?.length ?? 0} bids · {daysLeft !== null ? `${daysLeft}d left` : "No deadline"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isOwner ? (
            <Link href={`/requests/${p.id}`}>
              <button className="text-xs font-bold px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors">
                Manage bids ({p.bids?.length ?? 0})
              </button>
            </Link>
          ) : submitted || myBid ? (
            <span className="text-xs font-bold px-4 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200">
              Bid submitted ✓
            </span>
          ) : canBid ? (
            <button onClick={() => setShowBid(!showBid)}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] text-white transition-colors border-b-[2px] border-[#4438b8]">
              {p.budgetType === "negotiable" ? "Place bid" : "Apply"}
            </button>
          ) : !userId ? (
            <Link href="/login">
              <button className="text-xs font-bold px-4 py-2 rounded-xl bg-[#5B4BDB] text-white hover:bg-[#4c3ec7] transition-colors">
                Sign in to bid
              </button>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Bid form */}
      <AnimatePresence>
        {showBid && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-200">
            <div className="p-5 bg-white space-y-4">
              <p className="text-sm font-bold text-white">Submit your bid</p>
              {p.budgetType === "negotiable" && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Your price (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                    <input type="number" value={bidAmount} onChange={e => setBidAmount(Number(e.target.value))} min={0}
                      className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-white focus:outline-none focus:border-[#5B4BDB] transition-colors" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Client budget: ~₹{p.budget.toLocaleString()}</p>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Cover message *</label>
                <textarea value={bidMessage} onChange={e => setBidMessage(e.target.value)} rows={3} placeholder="Explain your approach, timeline, and relevant experience..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-white focus:outline-none focus:border-[#5B4BDB] transition-colors resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowBid(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-[#0A0A0F] transition-colors">Cancel</button>
                <button onClick={submitBid} disabled={submitting || !bidMessage.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#5B4BDB] text-white text-xs font-bold hover:bg-[#4c3ec7] disabled:opacity-50 transition-colors border-b-[2px] border-[#4438b8]">
                  {submitting ? "Submitting..." : p.budgetType === "negotiable" ? `Submit bid · ₹${bidAmount.toLocaleString()}` : "Submit application"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FreelancePage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState("user");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSkill, setActiveSkill] = useState("All");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "fixed" | "negotiable">("all");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u ?? null);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setUserRole(snap.data().role ?? "user");
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "requests"), where("status", "in", ["open", "in_progress"]), orderBy("createdAt", "desc"), limit(24));
        const snap = await getDocs(q);
        setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  const filtered = projects.filter(p => {
    const skillMatch = activeSkill === "All" || p.skills?.includes(activeSkill);
    const searchMatch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const typeMatch = filter === "all" || p.budgetType === filter;
    return skillMatch && searchMatch && typeMatch;
  });

  const stats = {
    open: projects.filter(p => p.status === "open").length,
    total: projects.length,
    avgBudget: projects.length ? Math.round(projects.reduce((a, p) => a + (p.budget || 0), 0) / projects.length) : 0,
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans">      <div className="max-w-7xl mx-auto px-4 flex-grow w-full">

        {/* Hero */}
        <div className="py-14 border-b border-gray-200">
          <div className="flex items-end justify-between flex-wrap gap-6 mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-3">Freelance Hub</p>
              <h1 className="text-4xl font-black tracking-tight text-white mb-3">XR & 3D Project Marketplace</h1>
              <p className="text-gray-500 max-w-xl">Post projects, receive bids, negotiate, and get work done by verified XR specialists.</p>
            </div>
            <Link href="/requests/post">
              <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm transition-all border-b-[3px] border-black/30 active:translate-y-[1px]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                Post a project
              </button>
            </Link>
          </div>

          {/* Hub cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {HUB_CARDS.map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <Link href={card.href}>
                  <div className="group p-5 rounded-2xl border border-gray-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: card.bg }}>
                      <svg className="w-5 h-5" fill="none" stroke={card.color} viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={card.icon}/>
                      </svg>
                    </div>
                    <p className="font-black text-white text-sm mb-1 group-hover:text-[#5B4BDB] transition-colors">{card.label}</p>
                    <p className="text-xs text-gray-400 leading-snug">{card.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Open projects", value: stats.open },
              { label: "Total posted",  value: stats.total },
              { label: "Avg. budget",   value: `₹${stats.avgBudget.toLocaleString()}` },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Projects section */}
        <div id="projects" className="py-10">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-xl font-black text-white">Open Projects</h2>
            <div className="flex gap-2">
              {(["all", "fixed", "negotiable"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all capitalize ${filter === f ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                  {f === "all" ? "All types" : f === "fixed" ? "Fixed price" : "Negotiable"}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#5B4BDB] transition-colors" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {SKILLS_FILTER.map(s => (
                <button key={s} onClick={() => setActiveSkill(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${activeSkill === s ? "bg-[#5B4BDB] text-white border-[#5B4BDB]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-3"/>
                  <div className="h-3 bg-gray-100 rounded mb-2"/>
                  <div className="h-3 bg-gray-100 rounded w-2/3"/>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
              <p className="text-4xl mb-4">📋</p>
              <p className="font-bold text-white mb-2">No projects found</p>
              <p className="text-gray-400 text-sm mb-6">Be the first to post one</p>
              <Link href="/requests/post">
                <button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm hover:bg-[#4c3ec7] transition-colors">
                  Post a project
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map(p => <ProjectCard key={p.id} p={p} userId={user?.uid ?? null} userRole={userRole} />)}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}