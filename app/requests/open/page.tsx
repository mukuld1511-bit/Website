"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, getDoc, Timestamp, where } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

interface ProjectApplication {
  id: string;
  requestId: string;
  developerId: string;
  developerName: string;
  developerPhoto: string;
  message: string;
  bidAmount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
}

interface ProjectRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  timeline: string;
  skills: string[];
  userId: string;
  userName: string;
  userPhoto: string;
  status: string;
  createdAt: Timestamp;
  fundedAmount?: number;
  paymentId?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  "3D Modeling":    "📦",
  "AR App":         "📱",
  "VR Experience":  "🥽",
  "WebXR":          "🌐",
  "Game Asset":     "🎮",
  "Other":          "✨",
};

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [filtered, setFiltered] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [initiatingChat, setInitiatingChat] = useState<string | null>(null);
  const [initiatingChatWithClient, setInitiatingChatWithClient] = useState<string | null>(null);

  // Application flow state
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
        const q = query(collection(db, "projectRequests"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as ProjectRequest))
          .filter(r => r.status === "open" || r.status === undefined);
        setRequests(list);
        setFiltered(list);
      } catch (error) {
        console.error("Error loading requests:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    if (!q) { setFiltered(requests); return; }
    setFiltered(requests.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q) ||
      r.skills?.some(s => s.toLowerCase().includes(q))
    ));
  }, [search, requests]);

  const timeAgo = (date: Date) => {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 60)    return `${s}s ago`;
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  async function submitApplication() {
    if (!user || !applyingTo || !applyMessage || !applyBid) return;
    setIsApplying(true);
    try {
      await addDoc(collection(db, "projectApplications"), {
        requestId: applyingTo.id,
        developerId: user.uid,
        developerName: user.displayName || "Developer",
        developerPhoto: user.photoURL || "/avatar.png",
        message: applyMessage,
        bidAmount: Number(applyBid),
        status: "pending",
        createdAt: serverTimestamp(),
      });
      alert("Application sent successfully!");
      setApplyingTo(null);
      setApplyMessage("");
      setApplyBid("");
    } catch (e) {
      console.error(e);
      alert("Failed to submit application.");
    } finally {
      setIsApplying(false);
    }
  }

  async function openApplicants(req: ProjectRequest) {
    setViewingApplicantsFor(req);
    setLoadingApplicants(true);
    try {
      const q = query(collection(db, "projectApplications"), where("requestId", "==", req.id));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectApplication));
      list.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
      setApplicants(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingApplicants(false);
    }
  }

  async function approveApplicant(app: ProjectApplication, req: ProjectRequest) {
    if (!user) return;
    setInitiatingChat(app.id);
    try {
      const chatsRef = collection(db, "projectChats");
      const chatDoc = await addDoc(chatsRef, {
        requestId:     req.id,
        requestTitle:  req.title,
        clientId:      req.userId,
        clientName:    req.userName,
        clientPhoto:   req.userPhoto,
        developerId:   app.developerId,
        developerName: app.developerName,
        developerPhoto: app.developerPhoto,
        status:        "active",
        funded:        false,
        fundedAmount:  0,
        createdAt:     serverTimestamp(),
        lastMessage:   "",
        lastMessageAt: serverTimestamp(),
      });

      await addDoc(collection(db, "projectChats", chatDoc.id, "messages"), {
        type:      "system",
        text:      `✅ You approved ${app.developerName}'s application. Their bid was ₹${app.bidAmount}.`,
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, "projectChats", chatDoc.id, "messages"), {
        type:      "text",
        text:      `Cover Letter: ${app.message}`,
        senderId:  app.developerId,
        createdAt: serverTimestamp(),
      });

      router.push(`/project-chat/${chatDoc.id}`);
    } catch (e) {
      console.error(e);
      alert("Failed to approve application.");
    } finally {
      setInitiatingChat(null);
    }
  }

  async function chatWithClient(req: ProjectRequest) {
    if (!user) return;
    setInitiatingChatWithClient(req.id);
    try {
      // Check if chat already exists
      const q = query(
        collection(db, "projectChats"), 
        where("requestId", "==", req.id), 
        where("developerId", "==", user.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        router.push(`/project-chat/${snap.docs[0].id}`);
        return;
      }

      const chatsRef = collection(db, "projectChats");
      const chatDoc = await addDoc(chatsRef, {
        requestId:     req.id,
        requestTitle:  req.title,
        clientId:      req.userId,
        clientName:    req.userName,
        clientPhoto:   req.userPhoto,
        developerId:   user.uid,
        developerName: user.displayName || "Developer",
        developerPhoto: user.photoURL || "/avatar.png",
        status:        "active",
        funded:        false,
        fundedAmount:  0,
        createdAt:     serverTimestamp(),
        lastMessage:   "",
        lastMessageAt: serverTimestamp(),
      });

      await addDoc(collection(db, "projectChats", chatDoc.id, "messages"), {
        type:      "system",
        text:      `💬 ${user.displayName || 'A developer'} started a chat regarding your project "${req.title}".`,
        createdAt: serverTimestamp(),
      });

      router.push(`/project-chat/${chatDoc.id}`);
    } catch (e) {
      console.error(e);
      alert("Failed to initiate chat.");
    } finally {
      setInitiatingChatWithClient(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col font-sans text-white">
      <Navbar />

      <div className="relative z-10 pt-28 pb-24 px-4 flex-grow">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="mb-12 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
                Open Requests
              </h1>
              <p className="text-gray-400 text-lg max-w-xl">
                Browse client project requests and connect directly to start building. Chat, negotiate, and get paid.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/requests/post">
                <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#5B4BDB] hover:bg-[#4a3bc7] transition shadow-[0_0_15px_rgba(91,75,219,0.3)] hover:shadow-[0_0_25px_rgba(91,75,219,0.5)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post a Request
                </button>
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="mb-10 relative">
            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, skill, or category..."
              className="w-full bg-[#141414] border border-gray-800 text-white placeholder-gray-500 text-base rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-1 focus:ring-[#5B4BDB] focus:border-[#5B4BDB] transition shadow-inner"
            />
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-gray-800 border-t-[#5B4BDB] animate-spin" />
              <p className="text-gray-400 text-sm font-medium">Loading Requests...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-gray-800 rounded-3xl bg-[#141414]">
              <h3 className="text-xl font-bold text-white mb-2">No open requests</h3>
              <p className="text-gray-400 mb-6 max-w-sm mx-auto text-sm">
                {search ? `No results for "${search}". Try a different keyword.` : "Check back later or be the first to post your project."}
              </p>
              <Link href="/requests/post">
                <button className="px-6 py-2.5 rounded-xl text-white font-bold text-sm bg-[#5B4BDB] hover:bg-[#4a3bc7] transition shadow-[0_0_15px_rgba(91,75,219,0.3)]">
                  Post a Project Request
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filtered.map((req, i) => {
                  const icon = CATEGORY_ICONS[req.category] ?? "✨";
                  const isMine = user?.uid === req.userId;

                  return (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="group bg-[#141414] rounded-3xl border border-gray-800 overflow-hidden flex flex-col hover:border-[#5B4BDB]/50 hover:shadow-[0_0_30px_rgba(91,75,219,0.1)] transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="p-6 md:p-8 flex flex-col flex-grow relative">
                        {/* Subtle top glow */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#5B4BDB]/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
                        
                        {/* Header: Category & Time */}
                        <div className="flex justify-between items-center mb-5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-[#5B4BDB]/10 text-[#5B4BDB] border border-[#5B4BDB]/20">
                              {req.category || "Project"}
                            </span>
                          </div>
                          {req.createdAt && (
                            <span className="text-gray-500 text-xs font-bold">
                              {timeAgo(req.createdAt.toDate())}
                            </span>
                          )}
                        </div>

                        {/* Title & Desc */}
                        <h3 className="text-white font-black text-xl mb-3 line-clamp-2 leading-tight group-hover:text-[#5B4BDB] transition-colors">
                          {req.title}
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow font-medium">
                          {req.description}
                        </p>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="p-3.5 rounded-2xl bg-black/40 border border-gray-800">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1.5">Budget</p>
                            <p className="font-bold text-white text-sm truncate">
                              {req.budget || "Flexible"}
                            </p>
                          </div>
                          <div className="p-3.5 rounded-2xl bg-black/40 border border-gray-800">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1.5">Timeline</p>
                            <p className="font-bold text-white text-sm truncate">
                              {req.timeline || "Flexible"}
                            </p>
                          </div>
                        </div>

                        {/* Skills */}
                        {req.skills && req.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            {req.skills.slice(0, 4).map((skill, j) => (
                              <span key={j} className="text-xs font-bold text-gray-300 bg-gray-800/50 border border-gray-700/50 px-3 py-1.5 rounded-xl">
                                {skill}
                              </span>
                            ))}
                            {req.skills.length > 4 && (
                              <span className="text-xs font-bold text-gray-500 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-xl">
                                +{req.skills.length - 4}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer User Info & CTA */}
                        <div className="pt-5 border-t border-gray-800 flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <img
                              src={req.userPhoto || "/avatar.png"}
                              onError={e => { (e.target as any).src = "/avatar.png"; }}
                              className="w-9 h-9 rounded-full object-cover border border-gray-700"
                              alt={req.userName}
                            />
                            <div className="min-w-0">
                              <p className="text-white text-sm font-bold truncate">{req.userName || "Anonymous"}</p>
                              <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">Client</p>
                            </div>
                          </div>

                          {isMine ? (
                            <button
                              onClick={() => openApplicants(req)}
                              className="px-4 py-2.5 border border-gray-700 hover:border-gray-500 hover:bg-gray-800 text-white text-[11px] font-bold uppercase tracking-wide rounded-xl transition whitespace-nowrap"
                            >
                              Review Applicants
                            </button>
                          ) : user ? (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => chatWithClient(req)}
                                disabled={initiatingChatWithClient === req.id}
                                className="px-4 py-2.5 border border-gray-700 bg-gray-800 hover:bg-gray-700 text-white text-[11px] font-bold uppercase tracking-wide rounded-xl transition whitespace-nowrap disabled:opacity-50"
                              >
                                {initiatingChatWithClient === req.id ? "Opening..." : "Chat"}
                              </button>
                              <button
                                onClick={() => setApplyingTo(req)}
                                className="px-4 py-2.5 bg-[#5B4BDB] hover:bg-[#4a3bc7] text-white text-[11px] font-bold uppercase tracking-wide rounded-xl transition whitespace-nowrap shadow-[0_0_10px_rgba(91,75,219,0.3)] hover:shadow-[0_0_15px_rgba(91,75,219,0.5)]"
                              >
                                Apply
                              </button>
                            </div>
                          ) : (
                            <Link href="/login">
                              <button className="px-4 py-2.5 border border-gray-700 bg-gray-800 hover:bg-gray-700 text-white text-[11px] font-bold uppercase tracking-wide rounded-xl transition whitespace-nowrap">
                                Login to Apply
                              </button>
                            </Link>
                          )}
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

      {/* --- MODALS --- */}
      <AnimatePresence>
        {/** Apply Modal */}
        {applyingTo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isApplying && setApplyingTo(null)} />
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:20 }}
              className="relative w-full max-w-md bg-[#141414] border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl">
              <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Apply for Project</h2>
              <p className="text-gray-400 text-sm mb-6 pb-6 border-b border-gray-800 line-clamp-2">"{applyingTo.title}"</p>
              
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Your Bid (₹)</label>
                  <input type="number" placeholder="e.g. 5000" value={applyBid} onChange={e=>setApplyBid(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#5B4BDB] focus:border-[#5B4BDB] transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Cover Letter</label>
                  <textarea placeholder="Why are you a good fit? Share your relevant experience..." rows={5} value={applyMessage} onChange={e=>setApplyMessage(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#5B4BDB] focus:border-[#5B4BDB] transition resize-none" />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setApplyingTo(null)} disabled={isApplying} className="flex-1 py-3 bg-transparent border border-gray-700 text-gray-300 font-bold rounded-xl hover:bg-gray-800 transition">Cancel</button>
                <button onClick={submitApplication} disabled={isApplying || !applyBid || !applyMessage} 
                  className="flex-1 py-3 text-white font-bold bg-[#5B4BDB] hover:bg-[#4a3bc7] rounded-xl transition disabled:opacity-50 shadow-[0_0_15px_rgba(91,75,219,0.3)]">
                  {isApplying ? "Sending..." : "Submit Proposal"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/** View Applicants Modal */}
        {viewingApplicantsFor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setViewingApplicantsFor(null)} />
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:20 }}
              className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#141414] border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl">
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-800">
                <div>
                  <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Applicants ({applicants.length})</h2>
                  <p className="text-gray-400 text-sm line-clamp-1">"{viewingApplicantsFor.title}"</p>
                </div>
                <button onClick={() => setViewingApplicantsFor(null)} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {loadingApplicants ? (
                  <div className="flex items-center justify-center py-12">
                     <div className="w-8 h-8 rounded-full border-2 border-gray-800 border-t-[#5B4BDB] animate-spin" />
                  </div>
                ) : applicants.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 bg-[#0A0A0A] border border-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="text-white font-bold mb-1">No applications yet</p>
                    <p className="text-gray-500 text-sm">When developers apply to this project, they will appear here.</p>
                  </div>
                ) : (
                  applicants.map((app) => (
                    <div key={app.id} className="p-6 rounded-2xl border border-gray-800 bg-[#0A0A0A] hover:border-[#5B4BDB]/50 transition-colors flex flex-col sm:flex-row gap-5 group">
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-4">
                          <img src={app.developerPhoto || "/avatar.png"} alt={app.developerName} className="w-12 h-12 rounded-full object-cover border border-gray-700" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <Link href={`/developer/${app.developerId}`} className="text-white font-black text-base hover:text-[#5B4BDB] transition">{app.developerName}</Link>
                              <span className="text-[#5B4BDB] bg-[#5B4BDB]/10 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wide border border-[#5B4BDB]/20">Bid: ₹{app.bidAmount}</span>
                            </div>
                            <p className="text-gray-500 text-xs font-bold mt-1">{timeAgo(app.createdAt?.toDate())}</p>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-[#141414] border border-gray-800 text-gray-300 text-sm leading-relaxed font-medium">
                          {app.message}
                        </div>
                      </div>
                      <div className="flex flex-col justify-end pt-2 sm:pt-0 sm:pl-2">
                        <button
                          onClick={() => approveApplicant(app, viewingApplicantsFor)}
                          disabled={initiatingChat === app.id}
                          className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#5B4BDB] hover:bg-[#4a3bc7] transition shadow-[0_0_15px_rgba(91,75,219,0.2)] disabled:opacity-70 whitespace-nowrap"
                        >
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
