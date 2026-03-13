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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />

      <div className="relative z-10 pt-28 pb-24 px-4 flex-grow">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="mb-12 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-3">
                Open Requests
              </h1>
              <p className="text-gray-500 text-lg max-w-xl">
                Browse client project requests and connect directly to start building. Chat, negotiate, and get paid.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/requests/post">
                <button className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm">
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
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, skill, or category..."
              className="w-full bg-white border border-gray-200 text-gray-900 placeholder-gray-400 text-base rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
            />
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
              <p className="text-gray-400 text-sm font-medium">Loading Requests...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-gray-300 rounded-2xl bg-white">
              <h3 className="text-xl font-bold text-gray-900 mb-2">No open requests</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">
                {search ? `No results for "${search}". Try a different keyword.` : "Check back later or be the first to post your project."}
              </p>
              <Link href="/requests/post">
                <button className="px-6 py-2.5 rounded-lg text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 transition">
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
                      className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col hover:border-gray-300 hover:shadow-md transition-all duration-300"
                    >
                      <div className="p-6 flex flex-col flex-grow">
                        {/* Header: Category & Time */}
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{icon}</span>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700">
                              {req.category || "Project"}
                            </span>
                          </div>
                          {req.createdAt && (
                            <span className="text-gray-400 text-xs">
                              {timeAgo(req.createdAt.toDate())}
                            </span>
                          )}
                        </div>

                        {/* Title & Desc */}
                        <h3 className="text-gray-900 font-bold text-lg mb-2 line-clamp-2">
                          {req.title}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">
                          {req.description}
                        </p>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Budget</p>
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {req.budget || "Flexible"}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Timeline</p>
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {req.timeline || "Flexible"}
                            </p>
                          </div>
                        </div>

                        {/* Skills */}
                        {req.skills && req.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            {req.skills.slice(0, 4).map((skill, j) => (
                              <span key={j} className="text-[11px] text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md font-medium">
                                {skill}
                              </span>
                            ))}
                            {req.skills.length > 4 && (
                              <span className="text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md font-medium">
                                +{req.skills.length - 4}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer User Info & CTA */}
                        <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <img
                              src={req.userPhoto || "/avatar.png"}
                              onError={e => { (e.target as any).src = "/avatar.png"; }}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200"
                              alt={req.userName}
                            />
                            <div className="min-w-0">
                              <p className="text-gray-900 text-sm font-semibold truncate">{req.userName || "Anonymous"}</p>
                              <p className="text-gray-500 text-[11px]">Client</p>
                            </div>
                          </div>

                          {isMine ? (
                            <button
                              onClick={() => openApplicants(req)}
                              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition whitespace-nowrap"
                            >
                              Review Applicants
                            </button>
                          ) : user ? (
                            <button
                              onClick={() => setApplyingTo(req)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition flex-shrink-0"
                            >
                              Apply
                            </button>
                          ) : (
                            <Link href="/login">
                              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition whitespace-nowrap">
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
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !isApplying && setApplyingTo(null)} />
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:20 }}
              className="relative w-full max-w-md bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Apply for Project</h2>
              <p className="text-gray-500 text-sm mb-6 pb-4 border-b border-gray-100 line-clamp-2">"{applyingTo.title}"</p>
              
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Your Bid (₹)</label>
                  <input type="number" placeholder="e.g. 5000" value={applyBid} onChange={e=>setApplyBid(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Cover Letter</label>
                  <textarea placeholder="Why are you a good fit? Share your relevant experience..." rows={4} value={applyMessage} onChange={e=>setApplyMessage(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none" />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setApplyingTo(null)} disabled={isApplying} className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button onClick={submitApplication} disabled={isApplying || !applyBid || !applyMessage} 
                  className="flex-1 py-3 text-white font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50">
                  {isApplying ? "Sending..." : "Submit Proposal"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/** View Applicants Modal */}
        {viewingApplicantsFor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setViewingApplicantsFor(null)} />
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:20 }}
              className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
              <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Applicants ({applicants.length})</h2>
                  <p className="text-gray-500 text-sm line-clamp-1">"{viewingApplicantsFor.title}"</p>
                </div>
                <button onClick={() => setViewingApplicantsFor(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {loadingApplicants ? (
                  <div className="flex items-center justify-center py-12">
                     <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
                  </div>
                ) : applicants.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="text-gray-900 font-semibold mb-1">No applications yet</p>
                    <p className="text-gray-500 text-sm">When developers apply to this project, they will appear here.</p>
                  </div>
                ) : (
                  applicants.map((app) => (
                    <div key={app.id} className="p-5 rounded-xl border border-gray-200 bg-white hover:border-blue-200 transition-colors flex flex-col sm:flex-row gap-5">
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-3">
                          <img src={app.developerPhoto || "/avatar.png"} alt={app.developerName} className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-sm" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <Link href={`/developer/${app.developerId}`} className="text-gray-900 font-bold text-base hover:text-blue-600 transition">{app.developerName}</Link>
                              <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-100">Bid: ₹{app.bidAmount}</span>
                            </div>
                            <p className="text-gray-500 text-xs mt-1">{timeAgo(app.createdAt?.toDate())}</p>
                          </div>
                        </div>
                        <div className="mt-3 p-4 rounded-lg bg-gray-50 border border-gray-100 text-gray-600 text-sm leading-relaxed">
                          {app.message}
                        </div>
                      </div>
                      <div className="flex flex-col justify-end pt-2 sm:pt-0 sm:pl-2">
                        <button
                          onClick={() => approveApplicant(app, viewingApplicantsFor)}
                          disabled={initiatingChat === app.id}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-70 whitespace-nowrap"
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
