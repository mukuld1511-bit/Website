"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";

export default function UserDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [saved, setSaved] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const reqQuery = query(collection(db, "tutorialRequests"), where("userId", "==", user.uid));
      const revQuery = query(collection(db, "reviews"), where("userId", "==", user.uid));
      const savedQuery = query(collection(db, "savedProjects"), where("userId", "==", user.uid));

      const reqSnap = await getDocs(reqQuery);
      const revSnap = await getDocs(revQuery);
      const savedSnap = await getDocs(savedQuery);

      const reqList: any[] = []; reqSnap.forEach((doc) => reqList.push(doc.data()));
      const revList: any[] = []; revSnap.forEach((doc) => revList.push(doc.data()));
      const savedList: any[] = []; savedSnap.forEach((doc) => savedList.push(doc.data()));

      setRequests(reqList);
      setReviews(revList);
      setSaved(savedList);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <main className="min-h-screen bg-[#020818] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-cyan-400"
        />
        <p className="text-slate-500 text-sm">Loading dashboard...</p>
      </div>
    </main>
  );

  const statCards = [
    { label: "Tutorial Requests", value: requests.length, gradient: "from-cyan-400 to-blue-500", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    { label: "Saved Projects", value: saved.length, gradient: "from-blue-400 to-purple-500", icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" },
    { label: "Reviews Given", value: reviews.length, gradient: "from-purple-400 to-pink-500", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
  ];

  const quickActions = [
    { label: "Find Developers", href: "/connect", gradient: "from-cyan-500 to-blue-600", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { label: "Explore 3D Galleria", href: "/gallery", gradient: "from-blue-500 to-purple-600", icon: "M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" },
    { label: "Request Custom Project", href: "/gyop", gradient: "from-purple-500 to-pink-600", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  ];

  return (
    <main className="min-h-screen bg-[#020818] px-4 py-24 relative overflow-hidden">

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(34,211,238,1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* PAGE HEADER */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
          <p className="text-cyan-400/80 text-xs uppercase tracking-[0.3em] font-medium mb-2">My Space</p>
          <h1 className="text-4xl font-bold text-white tracking-tight">User Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Track your requests, saved projects and activity.</p>
        </motion.div>

        {/* STATS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
        >
          {statCards.map((s, i) => (
            <div key={i} className="group relative">
              <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/80 backdrop-blur-xl rounded-xl p-5 border border-slate-700/40 group-hover:border-slate-600/50 transition duration-300">
                <div className={`w-9 h-9 bg-gradient-to-br ${s.gradient} rounded-lg mb-3 flex items-center justify-center`}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* QUICK ACTIONS */}
        <UserSection title="Quick Actions" subtitle="Jump to key areas of the platform" delay={0.2}>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action, i) => (
              <a key={i} href={action.href}>
                <button className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r ${action.gradient} rounded-xl hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] active:scale-[0.98] transition duration-200`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                  </svg>
                  {action.label}
                </button>
              </a>
            ))}
          </div>
        </UserSection>

        {/* MY TUTORIAL REQUESTS */}
        <UserSection title="My Tutorial Requests" subtitle="Tutorials you've requested from developers" delay={0.3}>
          {requests.length === 0
            ? <Empty text="You haven't requested any tutorials yet." />
            : requests.map((r, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/40 border border-slate-700/40 rounded-xl p-5 hover:border-slate-600/50 transition duration-200">
                <div>
                  <p className="text-white font-semibold">{r.topic}</p>
                  <p className="text-slate-400 text-sm mt-0.5">Level: {r.level}</p>
                </div>
                <span className={`self-start sm:self-auto text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                  r.status === "pending"  ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
                  : r.status === "accepted" ? "text-green-400 bg-green-400/10 border-green-400/20"
                  : "text-red-400 bg-red-400/10 border-red-400/20"
                }`}>{r.status}</span>
              </div>
            ))
          }
        </UserSection>

        {/* SAVED PROJECTS */}
        <UserSection title="Saved Projects" subtitle="Projects you've bookmarked for later" delay={0.4}>
          {saved.length === 0
            ? <Empty text="You haven't saved any projects yet." />
            : <div className="grid sm:grid-cols-2 gap-4">
                {saved.map((p, i) => (
                  <div key={i} className="group bg-slate-800/40 border border-slate-700/40 rounded-xl p-5 hover:border-cyan-500/30 transition duration-200">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mb-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <h3 className="text-white font-semibold">{p.title || "Untitled Project"}</h3>
                    {p.shortDescription && <p className="text-slate-400 text-sm mt-1 line-clamp-2">{p.shortDescription}</p>}
                    <div className="mt-3 h-[1px] w-0 group-hover:w-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500 rounded-full opacity-40" />
                  </div>
                ))}
              </div>
          }
        </UserSection>

        {/* RECENT ACTIVITY */}
        <UserSection title="Recent Activity" subtitle="Notifications and platform updates" delay={0.5}>
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">Notifications and updates will appear here.</p>
          </div>
        </UserSection>

      </div>
    </main>
  );
}

function UserSection({ title, subtitle, delay, children }: { title: string; subtitle: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="mb-10"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1.5 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </motion.div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="w-full py-10 text-center text-slate-600 text-sm border border-slate-700/30 rounded-xl bg-slate-800/20">
      {text}
    </div>
  );
}