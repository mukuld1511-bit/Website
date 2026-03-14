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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex flex-col font-sans text-gray-900">
      <Navbar />

      <div className="relative z-10 pt-28 pb-24 px-4 flex-grow">
        {/* Decorative colorful background elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 z-[-1]" />
        <div className="absolute top-60 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 z-[-1]" />
        
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-gray-900 mb-4 leading-tight">
                Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500">Open Requests</span>
              </h1>
              <p className="text-gray-600 text-lg md:text-xl font-bold max-w-xl">
                Find exciting client projects, pitch your amazing ideas, and start building AR/VR experiences today!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/requests/post">
                <button className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-500 border-b-4 border-blue-800 hover:border-blue-600 active:border-b-0 active:translate-y-1 transition-all shadow-xl text-lg group">
                  <svg className="w-6 h-6 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Post a Request 💡
                </button>
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="mb-12 relative">
            <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, skill, or AR/VR category..."
              className="w-full bg-white border-2 border-indigo-100 text-gray-900 font-bold placeholder-gray-400 text-lg rounded-3xl pl-16 pr-6 py-5 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition shadow-lg"
            />
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              <p className="text-blue-600 text-lg font-black animate-pulse">Loading amazing projects... 🚀</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-32 border-4 border-dashed border-indigo-100 rounded-[3rem] bg-white/50 backdrop-blur-sm">
              <div className="text-6xl mb-6">🏜️</div>
              <h3 className="text-3xl font-black text-gray-900 mb-4">No open requests right now</h3>
              <p className="text-gray-500 font-bold mb-8 max-w-md mx-auto text-lg">
                {search ? `We couldn't find anything matching "${search}". Try a different keyword.` : "Check back later or be the first to post a new project idea."}
              </p>
              <Link href="/requests/post">
                <button className="px-8 py-4 rounded-2xl text-white font-black text-lg bg-pink-500 hover:bg-pink-400 border-b-4 border-pink-700 active:border-b-0 active:translate-y-1 transition-all shadow-xl">
                  Create the first request ✨
                </button>
              </Link>
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
                      className="group bg-white rounded-[2.5rem] p-2 hover:-translate-y-2 transition-transform duration-300 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_-15px_rgba(59,130,246,0.3)] flex flex-col border-2 border-transparent hover:border-blue-100"
                    >
                      <div className="bg-indigo-50/50 rounded-[2rem] p-6 lg:p-8 flex flex-col flex-grow relative overflow-hidden">
                        {/* Header: Category & Time */}
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center gap-2">
                            <span className="text-3xl bg-white p-2 rounded-2xl shadow-sm">{icon}</span>
                            <span className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md">
                              {req.category || "Project"}
                            </span>
                          </div>
                          {req.createdAt && (
                            <span className="text-gray-500 text-xs font-bold bg-white px-2.5 py-1 rounded-lg shadow-sm">
                              {timeAgo(req.createdAt.toDate())}
                            </span>
                          )}
                        </div>

                        {/* Title & Desc */}
                        <h3 className="text-gray-900 font-black text-2xl mb-4 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                          {req.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow font-semibold">
                          {req.description}
                        </p>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="p-4 rounded-2xl bg-white shadow-sm border border-indigo-50 group-hover:border-blue-100 transition-colors">
                            <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-1.5">Budget 💰</p>
                            <p className="font-extrabold text-gray-900 text-sm md:text-base truncate">
                              {req.budget || "Flexible"}
                            </p>
                          </div>
                          <div className="p-4 rounded-2xl bg-white shadow-sm border border-indigo-50 group-hover:border-blue-100 transition-colors">
                            <p className="text-pink-500 text-[10px] font-black uppercase tracking-widest mb-1.5">Timeline ⏱️</p>
                            <p className="font-extrabold text-gray-900 text-sm md:text-base truncate">
                              {req.timeline || "Flexible"}
                            </p>
                          </div>
                        </div>

                        {/* Skills */}
                        {req.skills && req.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-8">
                            {req.skills.slice(0, 3).map((skill, j) => (
                              <span key={j} className="text-xs font-black text-indigo-600 bg-white shadow-sm border border-indigo-100 px-3 py-1.5 rounded-xl">
                                {skill}
                              </span>
                            ))}
                            {req.skills.length > 3 && (
                              <span className="text-xs font-black text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl">
                                +{req.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer User Info & CTA */}
                        <div className="pt-6 border-t-[3px] border-indigo-100 border-dashed flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <img
                              src={req.userPhoto || "/avatar.png"}
                              onError={e => { (e.target as any).src = "/avatar.png"; }}
                              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md bg-white p-0.5"
                              alt={req.userName}
                            />
                            <div className="min-w-0">
                              <p className="text-gray-900 text-sm font-black truncate">{req.userName || "Anonymous"}</p>
                              <p className="text-blue-500 text-[10px] font-black uppercase tracking-wider">Client</p>
                            </div>
                          </div>

                          {isMine ? (
                            <button
                              onClick={() => openApplicants(req)}
                              className="px-5 py-3 border-2 border-indigo-200 hover:border-indigo-400 bg-white text-indigo-600 text-[11px] font-black uppercase tracking-wide rounded-2xl transition shadow-sm whitespace-nowrap"
                            >
                              Applicants
                            </button>
                          ) : user ? (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => chatWithClient(req)}
                                disabled={initiatingChatWithClient === req.id}
                                className="w-10 h-10 flex items-center justify-center border-2 border-blue-200 bg-white hover:bg-blue-50 text-blue-600 rounded-xl transition shadow-sm disabled:opacity-50"
                                title="Chat with Client"
                              >
                                {initiatingChatWithClient === req.id ? "..." : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>}
                              </button>
                              <button
                                onClick={() => setApplyingTo(req)}
                                className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-black uppercase tracking-wide rounded-2xl border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all shadow-md whitespace-nowrap"
                              >
                                Apply 🚀
                              </button>
                            </div>
                          ) : (
                            <Link href="/login">
                              <button className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-black uppercase tracking-wide rounded-2xl transition whitespace-nowrap">
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
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="absolute inset-0 bg-blue-900/20 backdrop-blur-md" onClick={() => !isApplying && setApplyingTo(null)} />
            <motion.div initial={{ opacity:0, scale:0.9, y:30 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:20 }} transition={{ type: "spring", bounce: 0.5 }}
              className="relative w-full max-w-md bg-white border-4 border-white rounded-[2.5rem] shadow-2xl p-2">
              <div className="bg-indigo-50/50 rounded-[2rem] p-6 md:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">🚀</span>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Pitch Your Idea</h2>
                </div>
                <p className="text-gray-600 font-bold mb-6 pb-6 border-b-2 border-indigo-100 border-dashed">Applying for: <span className="text-blue-600">"{applyingTo.title}"</span></p>
                
                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">Your Bid (₹)</label>
                    <input type="number" placeholder="5000" value={applyBid} onChange={e=>setApplyBid(e.target.value)}
                      className="w-full bg-white border-2 border-indigo-100 rounded-2xl px-5 py-4 text-gray-900 font-bold text-lg placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">Why are you a fit?</label>
                    <textarea placeholder="Share your experience and how you plan to tackle this project..." rows={5} value={applyMessage} onChange={e=>setApplyMessage(e.target.value)}
                      className="w-full bg-white border-2 border-indigo-100 rounded-2xl px-5 py-4 text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition resize-none shadow-sm" />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setApplyingTo(null)} disabled={isApplying} className="flex-1 py-4 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition shadow-sm">Cancel</button>
                  <button onClick={submitApplication} disabled={isApplying || !applyBid || !applyMessage} 
                    className="flex-1 py-4 text-white font-black text-lg bg-blue-600 hover:bg-blue-500 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 rounded-2xl transition-all shadow-lg disabled:opacity-50">
                    {isApplying ? "Sending..." : "Submit"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/** View Applicants Modal */}
        {viewingApplicantsFor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="absolute inset-0 bg-blue-900/20 backdrop-blur-md" onClick={() => setViewingApplicantsFor(null)} />
            <motion.div initial={{ opacity:0, scale:0.9, y:30 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:20 }} transition={{ type: "spring", bounce: 0.4 }}
              className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white border-4 border-white rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="bg-indigo-50/30 p-6 md:p-8 flex flex-col h-full border-2 border-indigo-50 rounded-[2rem] m-2">
                <div className="flex justify-between items-start mb-6 pb-6 border-b-2 border-indigo-100 border-dashed">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Applicants <span className="text-blue-600 bg-blue-100 px-3 py-1 rounded-xl text-2xl">{applicants.length}</span></h2>
                    <p className="text-gray-600 font-bold">"{viewingApplicantsFor.title}"</p>
                  </div>
                  <button onClick={() => setViewingApplicantsFor(null)} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition font-bold text-xl">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {loadingApplicants ? (
                    <div className="flex flex-col items-center justify-center py-20">
                       <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mb-4" />
                       <p className="text-blue-600 font-bold text-center">Loading talent...</p>
                    </div>
                  ) : applicants.length === 0 ? (
                    <div className="text-center py-20 px-4 bg-white rounded-3xl border border-indigo-50">
                      <div className="text-5xl mb-4">👀</div>
                      <p className="text-gray-900 font-black text-xl mb-2">No applications yet</p>
                      <p className="text-gray-500 font-semibold">When developers pitch their ideas, they'll appear here.</p>
                    </div>
                  ) : (
                    applicants.map((app) => (
                      <div key={app.id} className="p-6 rounded-3xl border-2 border-indigo-50 bg-white hover:border-blue-200 transition-colors flex flex-col sm:flex-row gap-6 shadow-sm group">
                        <div className="flex-1">
                          <div className="flex items-start gap-4 mb-4">
                            <img src={app.developerPhoto || "/avatar.png"} alt={app.developerName} className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-50 shadow-sm" />
                            <div className="flex-1 mt-1">
                              <div className="flex items-center justify-between">
                                <Link href={`/developer/${app.developerId}`} className="text-gray-900 font-black text-lg hover:text-blue-600 transition tracking-tight">{app.developerName}</Link>
                                <span className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide border border-indigo-100">Bid: ₹{app.bidAmount}</span>
                              </div>
                              <p className="text-gray-500 text-xs font-bold mt-1 bg-gray-50 inline-block px-2 py-1 rounded-md">{timeAgo(app.createdAt?.toDate())}</p>
                            </div>
                          </div>
                          <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-gray-700 font-semibold text-sm leading-relaxed">
                            {app.message}
                          </div>
                        </div>
                        <div className="flex flex-col justify-end pt-2 sm:pt-0">
                          <button
                            onClick={() => approveApplicant(app, viewingApplicantsFor)}
                            disabled={initiatingChat === app.id}
                            className="w-full sm:w-auto px-6 py-4 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-500 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all shadow-md disabled:opacity-70 whitespace-nowrap"
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
