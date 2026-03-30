"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, getDoc, Timestamp, where } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Footer from "../../components/Footer";
import VideoBackground from "../../components/VideoBackground";

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
  "Industrial Design": "📐",
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
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans text-white">
      <VideoBackground variant="aurora" color="#5B4BDB" intensity={0.4} />
      <div className="relative z-10 pt-28 pb-24 px-4 flex-grow">
        
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
                Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C6EF6] to-[#06B6D4]">Learn & Build</span>
              </h1>
              <p className="text-[#9494AD] text-lg md:text-xl font-bold max-w-xl">
                Find exciting collaborative projects, connect with peers, and start building AR/VR learning experiences today!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/requests/post">
                <button className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white bg-[#5B4BDB] hover:bg-[#4c3ec7] border-b-[3px] border-[#4438b8] active:border-b-0 active:translate-y-[3px] transition-all shadow-[0_10px_30px_rgba(91,75,219,0.3)] text-lg group">
                  <svg className="w-6 h-6 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Post a Project 💡
                </button>
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="mb-12 relative group">
            <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#6B6B85] group-focus-within:text-[#5B4BDB] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, skill, or AR/VR category..."
              className="w-full bg-[#1A1A2E]/50 border border-white/5 text-white font-bold placeholder-[#6B6B85] text-lg rounded-3xl pl-16 pr-6 py-5 focus:outline-none focus:border-[#5B4BDB]/50 focus:bg-[#1A1A2E]/80 focus:ring-4 focus:ring-[#5B4BDB]/10 transition-all backdrop-blur-md shadow-inner"
            />
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              <p className="text-blue-600 text-lg font-black animate-pulse">Loading amazing projects... 🚀</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-32 border-2 border-dashed border-white/10 rounded-[3rem] bg-[#1A1A2E]/30 backdrop-blur-md shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[#5B4BDB]/5 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="text-6xl mb-6 drop-shadow-lg">🏜️</div>
                <h3 className="text-3xl font-black text-white mb-4">No projects right now</h3>
                <p className="text-[#9494AD] font-bold mb-8 max-w-md mx-auto text-lg">
                  {search ? `We couldn't find anything matching "${search}". Try a different keyword.` : "Check back later or be the first to post a new learning project."}
                </p>
                <Link href="/requests/post">
                  <button className="px-8 py-4 rounded-2xl text-white font-black text-lg bg-[#5B4BDB] hover:bg-[#4c3ec7] border-b-[3px] border-[#4438b8] active:border-b-0 active:translate-y-[3px] transition-all shadow-[0_10px_30px_rgba(91,75,219,0.3)]">
                    Create the first project ✨
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {filtered.map((req, i) => {
                  const icon = CATEGORY_ICONS[req.category] ?? "✨";
                  const isMine = user?.uid === req.userId;

                  return (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4, delay: i * 0.05, type: "spring", bounce: 0.4 }}
                      className="group relative bg-[#141420]/60 backdrop-blur-xl rounded-[2.5rem] p-2 hover:-translate-y-2 transition-all duration-500 shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-white/5 hover:border-white/20 hover:shadow-[0_20px_50px_rgba(91,75,219,0.2)] flex flex-col overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#5B4BDB]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />
                      <div className="bg-[#1A1A2E]/50 border border-white/5 rounded-[2rem] p-6 lg:p-8 flex flex-col flex-grow relative overflow-hidden z-20">
                        {/* Header: Category & Time */}
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center gap-2">
                            <span className="text-3xl bg-[#0A0A0F]/50 border border-white/5 p-2 rounded-2xl shadow-sm">{icon}</span>
                            <span className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#5B4BDB] to-[#7C6EF6] text-white shadow-[0_0_15px_rgba(91,75,219,0.3)] border border-[#5B4BDB]/50">
                              {req.category || "Project"}
                            </span>
                          </div>
                          {req.createdAt && (
                            <span className="text-[#6B6B85] text-xs font-bold bg-[#0A0A0F]/50 border border-white/5 px-2.5 py-1 rounded-lg shadow-sm">
                              {timeAgo(req.createdAt.toDate())}
                            </span>
                          )}
                        </div>

                        {/* Title & Desc */}
                        <h3 className="text-white font-black text-2xl mb-4 line-clamp-2 leading-tight group-hover:text-[#A594FF] transition-colors drop-shadow-md">
                          {req.title}
                        </h3>
                        <p className="text-[#9494AD] text-sm leading-relaxed line-clamp-3 mb-6 flex-grow font-semibold">
                          {req.description}
                        </p>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="p-4 rounded-2xl bg-[#0A0A0F]/50 shadow-inner border border-white/5 group-hover:border-[#5B4BDB]/40 transition-colors">
                            <p className="text-[#A594FF] text-[10px] font-black uppercase tracking-widest mb-1.5">Commitment ⏳</p>
                            <p className="font-extrabold text-white text-sm md:text-base truncate">
                              {req.budget || "Flexible"}
                            </p>
                          </div>
                          <div className="p-4 rounded-2xl bg-[#0A0A0F]/50 shadow-inner border border-white/5 group-hover:border-[#5B4BDB]/40 transition-colors">
                            <p className="text-[#A594FF] text-[10px] font-black uppercase tracking-widest mb-1.5">Timeline ⏱️</p>
                            <p className="font-extrabold text-white text-sm md:text-base truncate">
                              {req.timeline || "Flexible"}
                            </p>
                          </div>
                        </div>

                        {/* Skills */}
                        {req.skills && req.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-8">
                            {req.skills.slice(0, 3).map((skill, j) => (
                              <span key={j} className="text-xs font-black text-[#A594FF] bg-[#5B4BDB]/10 shadow-[0_0_10px_rgba(91,75,219,0.1)] border border-[#5B4BDB]/30 px-3 py-1.5 rounded-xl">
                                {skill}
                              </span>
                            ))}
                            {req.skills.length > 3 && (
                              <span className="text-xs font-black text-[#6B6B85] bg-[#1A1A2E]/50 border border-white/5 px-3 py-1.5 rounded-xl shadow-inner">
                                +{req.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer User Info & CTA */}
                        <div className="pt-6 border-t border-white/10 border-dashed flex items-center justify-between mt-auto gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <img
                              src={req.userPhoto || "/avatar.png"}
                              onError={e => { (e.target as any).src = "/avatar.png"; }}
                              className="w-10 h-10 rounded-full object-cover border-2 border-white/10 shadow-md bg-[#0A0A0F] p-0.5 flex-shrink-0"
                              alt={req.userName}
                            />
                            <div>
                              <p className="text-white text-sm font-black break-words max-w-[150px] sm:max-w-[200px] drop-shadow-sm">{req.userName || "Anonymous"}</p>
                              <p className="text-[#7C6EF6] text-[10px] font-black uppercase tracking-wider">Creator</p>
                            </div>
                          </div>

                          {isMine ? (
                            <button
                              onClick={() => openApplicants(req)}
                              className="px-5 py-3 border border-white/20 hover:border-[#5B4BDB]/50 bg-[#1A1A2E]/50 text-[#A594FF] text-[11px] font-black uppercase tracking-wide rounded-2xl transition shadow-inner whitespace-nowrap"
                            >
                              Connections
                            </button>
                          ) : user ? (
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => chatWithClient(req)}
                                  disabled={initiatingChatWithClient === req.id}
                                  className="w-10 h-10 flex items-center justify-center border border-white/20 bg-[#1A1A2E]/50 hover:bg-[#5B4BDB]/20 hover:border-[#5B4BDB]/40 text-[#A594FF] rounded-xl transition shadow-inner disabled:opacity-50"
                                  title="Chat with Creator"
                                >
                                  {initiatingChatWithClient === req.id ? "..." : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>}
                                </button>
                                <button
                                  onClick={() => setApplyingTo(req)}
                                  className="px-5 py-3 bg-[#5B4BDB] hover:bg-[#4c3ec7] text-white text-[12px] font-black uppercase tracking-wide rounded-2xl border-b-[3px] border-[#4438b8] active:border-b-0 active:translate-y-[3px] transition-all shadow-[0_0_15px_rgba(91,75,219,0.3)] whitespace-nowrap"
                                >
                                  Join Project 🚀
                                </button>
                            </div>
                          ) : (
                            <Link href="/login">
                              <button className="px-5 py-3 bg-white/5 hover:bg-white/10 text-[#9494AD] hover:text-white border border-white/10 text-[11px] font-black uppercase tracking-wide rounded-2xl transition whitespace-nowrap shadow-inner">
                                Login
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
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-xl" onClick={() => !isApplying && setApplyingTo(null)} />
            <motion.div initial={{ opacity:0, scale:0.9, y:30 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:20 }} transition={{ type: "spring", bounce: 0.5 }}
              className="relative w-full max-w-md bg-[#141420]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden p-0.5">
              <div className="absolute inset-0 bg-gradient-to-b from-[#5B4BDB]/10 to-transparent pointer-events-none" />
              <div className="relative z-10 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl drop-shadow-md">🚀</span>
                  <h2 className="text-3xl font-black text-white tracking-tight">Connect on this Project</h2>
                </div>
                <p className="text-[#9494AD] font-bold mb-6 pb-6 border-b border-white/10 border-dashed">Joining: <span className="text-[#A594FF] drop-shadow-sm">"{applyingTo.title}"</span></p>
                
                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#6B6B85] mb-2">Your Pitch / Points</label>
                    <input type="number" placeholder="50" value={applyBid} onChange={e=>setApplyBid(e.target.value)}
                      className="w-full bg-[#1A1A2E]/50 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold text-lg placeholder-[#6B6B85] focus:outline-none focus:border-[#5B4BDB]/50 focus:bg-[#1A1A2E]/80 focus:ring-4 focus:ring-[#5B4BDB]/10 transition-all shadow-inner" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#6B6B85] mb-2">Why do you want to collaborate?</label>
                    <textarea placeholder="Share your experience and what you hope to learn or contribute..." rows={5} value={applyMessage} onChange={e=>setApplyMessage(e.target.value)}
                      className="w-full bg-[#1A1A2E]/50 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold placeholder-[#6B6B85] focus:outline-none focus:border-[#5B4BDB]/50 focus:bg-[#1A1A2E]/80 focus:ring-4 focus:ring-[#5B4BDB]/10 transition-all resize-none shadow-inner" />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setApplyingTo(null)} disabled={isApplying} className="flex-1 py-4 bg-[#1A1A2E]/50 border border-white/10 text-[#9494AD] hover:text-white font-bold rounded-2xl hover:bg-white/10 transition-all shadow-sm">Cancel</button>
                  <button onClick={submitApplication} disabled={isApplying || !applyBid || !applyMessage} 
                    className="flex-1 py-4 text-white font-black text-lg bg-[#5B4BDB] hover:bg-[#4c3ec7] border-b-[3px] border-[#4438b8] active:border-b-0 active:translate-y-[3px] rounded-2xl transition-all shadow-[0_0_20px_rgba(91,75,219,0.3)] disabled:opacity-50">
                    {isApplying ? "Sending..." : "Submit Pitch"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/** View Applicants Modal */}
        {viewingApplicantsFor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-xl" onClick={() => setViewingApplicantsFor(null)} />
            <motion.div initial={{ opacity:0, scale:0.9, y:30 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:20 }} transition={{ type: "spring", bounce: 0.4 }}
              className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#141420]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[#5B4BDB]/10 to-transparent pointer-events-none" />
              <div className="relative z-10 p-6 md:p-8 flex flex-col h-full m-2">
                <div className="flex justify-between items-start mb-6 pb-6 border-b border-white/10 border-dashed">
                  <div>
                    <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                      Connections 
                      <span className="text-[#A594FF] bg-[#5B4BDB]/20 border border-[#5B4BDB]/30 shadow-[0_0_15px_rgba(91,75,219,0.2)] px-3 py-1 rounded-xl text-2xl">{applicants.length}</span>
                    </h2>
                    <p className="text-[#9494AD] font-bold">"{viewingApplicantsFor.title}"</p>
                  </div>
                  <button onClick={() => setViewingApplicantsFor(null)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[#6B6B85] hover:bg-white/10 hover:border-white/20 hover:text-white transition-all font-bold text-xl">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                  {loadingApplicants ? (
                    <div className="flex flex-col items-center justify-center py-20">
                       <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-[#5B4BDB] animate-spin mb-4" />
                       <p className="text-[#7C6EF6] font-bold text-center animate-pulse">Loading talent...</p>
                    </div>
                  ) : applicants.length === 0 ? (
                    <div className="text-center py-20 px-4 bg-[#1A1A2E]/30 rounded-3xl border border-white/5 shadow-inner">
                      <div className="text-5xl mb-4 drop-shadow-md">👀</div>
                      <p className="text-white font-black text-xl mb-2">No connections yet</p>
                      <p className="text-[#6B6B85] font-semibold">When peers want to collaborate, they'll appear here.</p>
                    </div>
                  ) : (
                    applicants.map((app) => (
                      <div key={app.id} className="p-6 rounded-3xl border border-white/5 bg-[#141420]/60 backdrop-blur-md hover:border-[#5B4BDB]/40 transition-colors flex flex-col sm:flex-row gap-6 shadow-sm group relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(91,75,219,0.05)_0%,transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1 relative z-10">
                          <div className="flex items-start gap-4 mb-4">
                            <img src={app.developerPhoto || "/avatar.png"} alt={app.developerName} className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-sm bg-[#0A0A0F]" />
                            <div className="flex-1 mt-1">
                              <div className="flex items-center justify-between">
                                <Link href={`/developer/${app.developerId}`} className="text-white font-black text-lg hover:text-[#7C6EF6] transition tracking-tight">{app.developerName}</Link>
                                <span className="text-[#A594FF] bg-[#5B4BDB]/10 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide border border-[#5B4BDB]/30 shadow-inner">Pitch: {app.bidAmount}</span>
                              </div>
                              <p className="text-[#6B6B85] text-xs font-bold mt-1 bg-[#1A1A2E]/50 border border-white/5 inline-block px-2 py-1 rounded-md">{timeAgo(app.createdAt?.toDate())}</p>
                            </div>
                          </div>
                          <div className="p-5 rounded-2xl bg-[#1A1A2E]/50 border border-white/5 text-[#9494AD] shadow-inner font-semibold text-sm leading-relaxed">
                            {app.message}
                          </div>
                        </div>
                        <div className="flex flex-col justify-end pt-2 sm:pt-0 relative z-10">
                          <button
                            onClick={() => approveApplicant(app, viewingApplicantsFor)}
                            disabled={initiatingChat === app.id}
                            className="w-full sm:w-auto px-6 py-4 rounded-2xl font-black text-white bg-[#5B4BDB] hover:bg-[#4c3ec7] border-b-[3px] border-[#4438b8] active:border-b-0 active:translate-y-[3px] transition-all shadow-[0_0_15px_rgba(91,75,219,0.3)] disabled:opacity-50 whitespace-nowrap"
                          >
                            {initiatingChat === app.id ? "Opening..." : "Approve Match 🤝"}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
