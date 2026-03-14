"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, where, Timestamp } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

interface ProjectApplication {
  id: string; requestId: string; developerId: string; developerName: string; developerPhoto: string;
  message: string; bidAmount: number; status: "pending" | "approved" | "rejected"; createdAt: Timestamp;
}

interface ProjectRequest {
  id: string; title: string; description: string; category: string; budget: string; timeline: string;
  skills: string[]; userId: string; userName: string; userPhoto: string; status: string;
  createdAt: Timestamp; fundedAmount?: number; paymentId?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  "3D Modeling": "🎨", "AR App": "📱", "VR Experience": "🥽", "WebXR": "🌐", "Game Asset": "🎮", "Other": "✨",
};
const CATEGORIES = ["All", "3D Modeling", "AR App", "VR Experience", "WebXR", "Game Asset", "Other"];
const BUDGET_RANGES = ["All", "Under ₹5,000", "₹5,000 - ₹20,000", "₹20,000 - ₹50,000", "Above ₹50,000", "Flexible"];

function parseBudget(budgetStr: string) {
  const b = budgetStr.toLowerCase();
  if (b.includes("flexible")) return -1;
  const match = b.match(/(\d+)/g);
  if (match) return parseInt(match.join(""), 10);
  return -1;
}

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [budgetFilter, setBudgetFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // States
  const [initiatingChat, setInitiatingChat] = useState<string | null>(null);
  const [applyingTo, setApplyingTo] = useState<ProjectRequest | null>(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyBid, setApplyBid] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [viewingApplicantsFor, setViewingApplicantsFor] = useState<ProjectRequest | null>(null);
  const [applicants, setApplicants] = useState<ProjectApplication[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(query(collection(db, "projectRequests"), orderBy("createdAt", "desc")));
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectRequest)).filter(r => r.status === "open" || r.status === undefined));
      } catch (error) { console.error(error); } finally { setLoading(false); }
    }
    load();
  }, []);

  const timeAgo = (date: Date) => {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  const filtered = useMemo(() => {
    let out = requests;
    if (categoryFilter !== "All") out = out.filter(r => r.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.skills?.some(s => s.toLowerCase().includes(q)));
    }
    if (budgetFilter !== "All") {
      out = out.filter(r => {
        const val = parseBudget(r.budget);
        if (budgetFilter === "Flexible") return r.budget.toLowerCase().includes("flexible");
        if (budgetFilter === "Under ₹5,000") return val > 0 && val < 5000;
        if (budgetFilter === "₹5,000 - ₹20,000") return val >= 5000 && val <= 20000;
        if (budgetFilter === "₹20,000 - ₹50,000") return val > 20000 && val <= 50000;
        if (budgetFilter === "Above ₹50,000") return val > 50000;
        return true;
      });
    }
    out.sort((a,b) => {
      if (sortBy === "newest") return (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0);
      if (sortBy === "oldest") return (a.createdAt?.seconds||0) - (b.createdAt?.seconds||0);
      return 0;
    });
    return out;
  }, [requests, search, categoryFilter, budgetFilter, sortBy]);

  async function submitApplication() {
    if (!user || !applyingTo || !applyMessage || !applyBid) return;
    setIsApplying(true);
    try {
      await addDoc(collection(db, "projectApplications"), {
        requestId: applyingTo.id, developerId: user.uid, developerName: user.displayName || "Developer",
        developerPhoto: user.photoURL || "/avatar.png", message: applyMessage, bidAmount: Number(applyBid),
        status: "pending", createdAt: serverTimestamp(),
      });
      alert("Application sent successfully!");
      setApplyingTo(null); setApplyMessage(""); setApplyBid("");
    } catch (e) { alert("Failed to apply."); } finally { setIsApplying(false); }
  }

  async function openApplicants(req: ProjectRequest) {
    setViewingApplicantsFor(req); setLoadingApplicants(true);
    try {
      const snap = await getDocs(query(collection(db, "projectApplications"), where("requestId", "==", req.id)));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectApplication));
      list.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
      setApplicants(list);
    } catch (e) { console.error(e); } finally { setLoadingApplicants(false); }
  }

  async function approveApplicant(app: ProjectApplication, req: ProjectRequest) {
    if (!user) return;
    setInitiatingChat(app.id);
    try {
      const chatDoc = await addDoc(collection(db, "projectChats"), {
        requestId: req.id, requestTitle: req.title, clientId: req.userId, clientName: req.userName, clientPhoto: req.userPhoto,
        developerId: app.developerId, developerName: app.developerName, developerPhoto: app.developerPhoto,
        status: "active", funded: false, fundedAmount: 0, createdAt: serverTimestamp(), lastMessage: "", lastMessageAt: serverTimestamp(),
      });
      await addDoc(collection(db, "projectChats", chatDoc.id, "messages"), { type: "system", text: `✅ You approved ${app.developerName}'s application. Their bid was ₹${app.bidAmount}.`, createdAt: serverTimestamp() });
      router.push(`/project-chat/${chatDoc.id}`);
    } catch (e) { alert("Failed to approve."); } finally { setInitiatingChat(null); }
  }

  async function chatWithClient(req: ProjectRequest) {
    if (!user) return;
    setInitiatingChat(req.id);
    try {
      const snap = await getDocs(query(collection(db, "projectChats"), where("requestId", "==", req.id), where("developerId", "==", user.uid)));
      if (!snap.empty) { router.push(`/project-chat/${snap.docs[0].id}`); return; }
      const chatDoc = await addDoc(collection(db, "projectChats"), {
        requestId: req.id, requestTitle: req.title, clientId: req.userId, clientName: req.userName, clientPhoto: req.userPhoto,
        developerId: user.uid, developerName: user.displayName || "Developer", developerPhoto: user.photoURL || "/avatar.png",
        status: "active", funded: false, fundedAmount: 0, createdAt: serverTimestamp(), lastMessage: "", lastMessageAt: serverTimestamp(),
      });
      await addDoc(collection(db, "projectChats", chatDoc.id, "messages"), { type: "system", text: `💬 ${user.displayName || 'A developer'} started a chat regarding your project "${req.title}".`, createdAt: serverTimestamp() });
      router.push(`/project-chat/${chatDoc.id}`);
    } catch (e) { alert("Failed to initiate chat."); } finally { setInitiatingChat(null); }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-28 pb-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">Project Requests</h1>
            <p className="text-gray-500 font-medium text-lg mt-2">Connect directly with clients to build spatial experiences.</p>
          </div>
          <Link href="/requests/post">
            <button className="px-8 py-3.5 rounded-xl text-white font-bold bg-[#5B4BDB] hover:bg-[#4a3bc7] transition shadow border border-[#5B4BDB] flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              Post a Request
            </button>
          </Link>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 w-full flex flex-col lg:flex-row gap-8 flex-grow">
        
        {/* Mobile Filter Toggle */}
        <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="lg:hidden w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 flex justify-between items-center shadow-sm">
          Filters & Search {showMobileFilters ? "▴" : "▾"}
        </button>

        {/* LEFT SIDEBAR (FILTERS) */}
        <aside className={`w-full lg:w-72 flex-shrink-0 space-y-6 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
          
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-xs font-black tracking-widest text-gray-400 uppercase mb-4">Search</h3>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Keywords..." className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#5B4BDB]" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black tracking-widest text-gray-400 uppercase">Category</h3>
              {categoryFilter !== "All" && <button onClick={()=>setCategoryFilter("All")} className="text-[10px] font-bold text-[#5B4BDB]">Clear</button>}
            </div>
            <div className="space-y-1">
              {CATEGORIES.map(c => (
                <button key={c} onClick={()=>setCategoryFilter(c)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition ${categoryFilter===c ? 'bg-[#5B4BDB]/10 text-[#5B4BDB]' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black tracking-widest text-gray-400 uppercase">Budget</h3>
              {budgetFilter !== "All" && <button onClick={()=>setBudgetFilter("All")} className="text-[10px] font-bold text-[#5B4BDB]">Clear</button>}
            </div>
            <div className="space-y-1">
              {BUDGET_RANGES.map(b => (
                <label key={b} className="flex items-center gap-3 px-2 py-1.5 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${budgetFilter===b ? 'border-[#5B4BDB] bg-[#5B4BDB]' : 'border-gray-300 group-hover:border-[#5B4BDB]'}`}>
                    {budgetFilter===b && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span className={`text-sm font-semibold ${budgetFilter===b ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>{b}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-xs font-black tracking-widest text-gray-400 uppercase mb-4">Sort By</h3>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#5B4BDB]">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

        </aside>

        {/* RIGHT FEED (PROJECT LIST) */}
        <div className="flex-1 w-full min-w-0">
          
          <div className="flex justify-between items-center mb-6">
            <p className="font-bold text-gray-900">
              {loading ? "Searching..." : `${filtered.length} project${filtered.length!==1?'s':''} found`}
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
               {Array.from({length:5}).map((_,i) => (
                 <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 h-48 animate-pulse flex flex-col justify-between">
                    <div><div className="w-1/2 h-5 bg-gray-200 rounded mb-3" /><div className="w-full h-3 bg-gray-100 rounded mb-2" /><div className="w-3/4 h-3 bg-gray-100 rounded" /></div>
                    <div className="flex justify-between"><div className="w-24 h-8 bg-gray-100 rounded" /><div className="w-32 h-8 bg-gray-200 rounded" /></div>
                 </div>
               ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl py-24 flex flex-col items-center text-center px-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No projects match criteria</h3>
              <p className="text-gray-500 max-w-sm mb-6 font-medium">Try broadening your search or adjusting the filters on the left.</p>
              <button onClick={()=>{setCategoryFilter("All");setBudgetFilter("All");setSearch("");}} className="px-6 py-2.5 rounded-lg border border-gray-200 font-bold hover:bg-gray-50 transition">Clear Filters</button>
            </div>
          ) : (
            <div className="space-y-5">
              <AnimatePresence>
                {filtered.map((req, i) => {
                  const isMine = user?.uid === req.userId;
                  return (
                    <motion.div key={req.id} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: i*0.05}}
                      className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-[#5B4BDB]/40 hover:shadow-lg hover:shadow-[#5B4BDB]/5 transition-all duration-300 relative">
                      
                      {/* Left color accent bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#5B4BDB] to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="p-6 md:p-8 flex flex-col h-full">
                        {/* Header Row */}
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                          <h2 className="text-xl font-black text-gray-900 leading-tight pr-4 hover:text-[#5B4BDB] transition cursor-pointer">{req.title}</h2>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm font-black text-green-600 bg-green-50 px-3 py-1 rounded-md border border-green-200 whitespace-nowrap">{req.budget}</span>
                          </div>
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center gap-3 text-xs font-semibold text-gray-500 mb-4 whitespace-nowrap overflow-x-auto pb-1 scrollbar-hide">
                          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100"><span className="text-base">{CATEGORY_ICONS[req.category]||"✨"}</span> {req.category}</span>
                          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">⏱ {req.timeline}</span>
                          <span className="text-gray-400">•</span>
                          <span>Posted {timeAgo(req.createdAt?.toDate())}</span>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-2 md:line-clamp-3 font-medium">
                          {req.description}
                        </p>

                        {/* Skills */}
                        {req.skills && req.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            {req.skills.map(s => (
                              <span key={s} className="px-2.5 py-1 text-[11px] font-bold text-gray-600 bg-gray-100 rounded border border-gray-200">{s}</span>
                            ))}
                          </div>
                        )}

                        {/* Footer (User + Actions) */}
                        <div className="pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-auto">
                          
                          <div className="flex items-center gap-3">
                            <img src={req.userPhoto || "/avatar.png"} onError={(e:any)=>e.target.src="/avatar.png"} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                            <div>
                              <p className="text-gray-900 text-sm font-bold">{req.userName || "Client"}</p>
                              <div className="flex items-center gap-1">
                                <svg className="w-3 h-3 text-[#5B4BDB]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                                <p className="text-gray-400 focus text-[11px] font-bold uppercase tracking-wider">Client</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            {isMine ? (
                              <button onClick={()=>openApplicants(req)} className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition">
                                Review Applicants
                              </button>
                            ) : user ? (
                              <div className="flex w-full sm:w-auto gap-3">
                                <button onClick={()=>chatWithClient(req)} disabled={initiatingChat === req.id} className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 font-bold text-sm hover:border-[#5B4BDB] hover:text-[#5B4BDB] transition disabled:opacity-50">
                                  {initiatingChat === req.id ? "Opening..." : "Chat"}
                                </button>
                                <button onClick={()=>setApplyingTo(req)} className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm hover:bg-[#4a3bc7] shadow transition whitespace-nowrap">
                                  Submit Proposal
                                </button>
                              </div>
                            ) : (
                              <Link href="/login" className="w-full sm:w-auto">
                                <button className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-300 font-bold text-sm hover:bg-gray-50 transition">
                                  Log in to Apply
                                </button>
                              </Link>
                            )}
                          </div>

                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <Footer />
      
      {/* MODALS */}
      <AnimatePresence>
        {/** Apply Modal */}
        {applyingTo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isApplying && setApplyingTo(null)} />
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}}
              className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-black text-gray-900 mb-1">Submit Proposal</h2>
              <p className="text-gray-500 font-medium mb-6">"{applyingTo.title}"</p>
              
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Your Bid (₹)</label>
                  <input type="number" placeholder="Enter amount..." value={applyBid} onChange={e=>setApplyBid(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:border-[#5B4BDB] focus:ring-1 focus:ring-[#5B4BDB] outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Cover Letter</label>
                  <textarea placeholder="Explain why you're perfect for this project..." rows={4} value={applyMessage} onChange={e=>setApplyMessage(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:border-[#5B4BDB] focus:ring-1 focus:ring-[#5B4BDB] outline-none transition resize-none" />
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setApplyingTo(null)} disabled={isApplying} className="flex-1 py-3.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition">Cancel</button>
                <button onClick={submitApplication} disabled={isApplying || !applyBid || !applyMessage} className="flex-1 py-3.5 bg-[#5B4BDB] text-white font-bold rounded-xl hover:bg-[#4a3bc7] transition shadow disabled:opacity-50 disabled:cursor-not-allowed">
                  {isApplying ? "Sending..." : "Submit Proposal"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/** View Applicants Modal */}
        {viewingApplicantsFor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setViewingApplicantsFor(null)} />
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}}
              className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-white rounded-3xl p-6 md:p-8 shadow-2xl">
              <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Review Proposals</h2>
                  <p className="text-gray-500 font-medium mt-1">"{viewingApplicantsFor.title}"</p>
                </div>
                <button onClick={() => setViewingApplicantsFor(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition text-gray-500">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {loadingApplicants ? (
                  <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#5B4BDB] animate-spin" /></div>
                ) : applicants.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-4xl mb-4">📭</div>
                    <p className="text-gray-900 font-bold">No proposals yet</p>
                    <p className="text-gray-500 text-sm">When developers apply, their bids will appear here.</p>
                  </div>
                ) : (
                  applicants.map((app) => (
                    <div key={app.id} className="p-5 rounded-2xl border border-gray-200 hover:border-[#5B4BDB]/40 transition bg-white flex flex-col md:flex-row gap-5">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex gap-3 items-center">
                            <img src={app.developerPhoto || "/avatar.png"} className="w-10 h-10 rounded-full object-cover" />
                            <div>
                              <Link href={`/developer/${app.developerId}`} className="font-bold text-gray-900 hover:text-[#5B4BDB]">{app.developerName}</Link>
                              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{timeAgo(app.createdAt?.toDate())}</p>
                            </div>
                          </div>
                          <span className="bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-md text-xs font-black">Bid: ₹{app.bidAmount}</span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed p-4 bg-gray-50 rounded-xl border border-gray-100">
                          {app.message}
                        </p>
                      </div>
                      <div className="flex items-end justify-end">
                        <button onClick={()=>approveApplicant(app, viewingApplicantsFor)} disabled={initiatingChat === app.id}
                          className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm hover:bg-[#4a3bc7] transition shadow disabled:opacity-50">
                          {initiatingChat === app.id ? "Opening..." : "Approve & Chat"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
