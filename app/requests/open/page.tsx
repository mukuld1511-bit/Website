"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

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
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, "projectRequests"),
          where("status", "==", "open"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProjectRequest));
        setRequests(list);
      } catch (error) {
        console.error("Error loading requests:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div className="min-h-screen bg-[#050008] flex flex-col">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle,#a78bfa,transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-[20%] right-[5%] w-[400px] h-[400px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle,#34d399,transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage: "linear-gradient(rgba(167,139,250,1) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="relative z-10 pt-28 pb-24 px-4 flex-grow">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row gap-6 justify-between items-center mb-16">
            <div>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm mb-6">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-violet-300/90 text-sm font-semibold uppercase tracking-widest">Public Requests</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none mb-4">
                Open{" "}
                <span style={{ backgroundImage: "linear-gradient(90deg,#a78bfa,#34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  Projects
                </span>
              </h1>
              <p className="text-white/40 text-lg max-w-lg leading-relaxed">
                Connect with clients building the future of AR/VR and 3D.
              </p>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin mb-4" />
              <p className="text-white/40 text-sm font-black tracking-widest uppercase">Loading Requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 border border-white/6 rounded-3xl bg-white/[0.02]">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
              </div>
              <h3 className="text-xl font-black text-white mb-2">No open requests</h3>
              <p className="text-white/40">Check back later or post your own project request.</p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {requests.map((req, i) => (
                  <motion.div key={req.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className="group relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl overflow-hidden hover:border-violet-500/30 transition duration-500 flex flex-col p-6">
                    
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{ background: "linear-gradient(90deg,transparent,rgba(167,139,250,0.3),transparent)" }} />
                    
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <span className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-lg text-xs font-black tracking-wide">
                        {req.category || "3D/AR/VR"}
                      </span>
                      {req.createdAt && (
                        <span className="text-white/30 text-xs font-semibold">
                          {timeAgo(req.createdAt.toDate())}
                        </span>
                      )}
                    </div>

                    <h3 className="text-white font-black text-xl tracking-tight mb-2 line-clamp-2">{req.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">{req.description}</p>
                    
                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <p className="text-white/30 text-[10px] uppercase font-black tracking-widest mb-1">Budget</p>
                        <p className="text-emerald-400 font-bold text-sm truncate">{req.budget || "Open"}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <p className="text-white/30 text-[10px] uppercase font-black tracking-widest mb-1">Timeline</p>
                        <p className="text-white font-bold text-sm truncate">{req.timeline || "Flexible"}</p>
                      </div>
                    </div>

                    {/* Skills */}
                    {req.skills && req.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {req.skills.slice(0, 3).map((skill, j) => (
                          <span key={j} className="text-xs text-white/50 bg-white/5 px-2 py-1 rounded-md">
                            {skill}
                          </span>
                        ))}
                        {req.skills.length > 3 && (
                          <span className="text-xs text-white/50 bg-white/5 px-2 py-1 rounded-md">+{req.skills.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Footer: User + Action */}
                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3 w-full">
                        <img src={req.userPhoto || "/avatar.png"} onError={(e)=>{(e.target as any).src="/avatar.png"}} className="w-8 h-8 rounded-full bg-white/10" alt={req.userName} />
                        <div className="min-w-0 mr-auto">
                          <p className="text-white text-sm font-bold truncate">{req.userName || "Anonymous"}</p>
                          <p className="text-white/30 text-[10px] uppercase tracking-wider">Client</p>
                        </div>
                        {user ? (
                          <Link href={`/connect/chat/${req.userId}`}>
                            <button className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-black rounded-xl transition duration-200 whitespace-nowrap">
                              Contact
                            </button>
                          </Link>
                        ) : (
                          <Link href="/login">
                            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-black rounded-xl transition duration-200 whitespace-nowrap">
                              Login to Contact
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
