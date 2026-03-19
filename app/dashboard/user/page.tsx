"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";

export default function UserDashboard() {
  const router = useRouter();
  const [requests,     setRequests]     = useState<any[]>([]);
  const [saved,        setSaved]        = useState<any[]>([]);
  const [reviews,      setReviews]      = useState<any[]>([]);
  const [projectChats, setProjectChats] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
const [roleAppStatus, setRoleAppStatus] = useState<string | null>(null);
  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const appSnap = await getDocs(
    query(collection(db, "roleApplications"), where("userId", "==", user.uid))
  );
  if (!appSnap.empty) {
    setRoleAppStatus(appSnap.docs[0].data().status ?? null);
  }

      const reqQuery   = query(collection(db, "tutorialRequests"), where("userId",   "==", user.uid));
      const revQuery   = query(collection(db, "reviews"),          where("userId",   "==", user.uid));
      const savedQuery = query(collection(db, "savedProjects"),    where("userId",   "==", user.uid));
      const chatQuery  = query(collection(db, "projectChats"),     where("clientId", "==", user.uid));

      const [reqSnap, revSnap, savedSnap, chatSnap] = await Promise.all([
        getDocs(reqQuery), getDocs(revQuery), getDocs(savedQuery), getDocs(chatQuery),
      ]);

      const reqList:  any[] = []; reqSnap.forEach  (d => reqList.push(d.data()));
      const revList:  any[] = []; revSnap.forEach  (d => revList.push(d.data()));
      const savedList:any[] = []; savedSnap.forEach(d => savedList.push(d.data()));
      const chatList: any[] = []; chatSnap.forEach (d => chatList.push({ id: d.id, ...d.data() }));

      setRequests(reqList);
      setReviews(revList);
      setSaved(savedList);
      setProjectChats(chatList.sort((a,b) => (b.lastMessageAt?.seconds ?? 0) - (a.lastMessageAt?.seconds ?? 0)));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-cyan-500 animate-spin" />
        <p className="text-gray-500 text-sm font-bold tracking-widest uppercase">Loading dashboard...</p>
      </div>
    </main>
  );

  const statCards = [
    { label: "Tutorial Requests", value: requests.length, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    { label: "Saved Projects", value: saved.length, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" },
    { label: "Reviews Given", value: reviews.length, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
  ];

  const quickActions = [
    { label: "Find Developers",      href: "/connect",        bg: "bg-cyan-600 hover:bg-cyan-700",   icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { label: "Explore 3D Galleria",  href: "/gallery",        bg: "bg-blue-600 hover:bg-blue-700",  icon: "M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" },
    { label: "Post a Project Request",href: "/requests/post", bg: "bg-violet-600 hover:bg-violet-700",  icon: "M12 4v16m8-8H4" },
    { label: "View Open Projects",   href: "/requests/open",  bg: "bg-emerald-600 hover:bg-emerald-700", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-28 relative overflow-hidden font-sans">
      <div className="relative z-10 max-w-5xl mx-auto">

        {/* PAGE HEADER */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <p className="text-cyan-600 text-xs uppercase tracking-widest font-bold mb-2">My Space</p>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">User Dashboard</h1>
          <p className="text-gray-500 text-sm mt-3 font-medium">Track your requests, saved projects and activity.</p>
        </motion.div>
        {roleAppStatus === "payment_pending" && (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-8 p-5 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-center justify-between gap-4 flex-wrap shadow-sm"
  >
    <div>
      <p className="font-black text-blue-900 text-sm">Your application was approved! 🎉</p>
      <p className="text-xs text-blue-700 mt-0.5">
        Complete the ₹999 one-time joining fee to activate your mentor/developer profile on SYNTHE.
      </p>
    </div>
    <a href="/join/pay">
      <button className="px-5 py-2.5 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm hover:bg-[#4c3ec7] transition-colors flex-shrink-0">
        Pay ₹999 to Activate →
      </button>
    </a>
  </motion.div>
)}

{roleAppStatus === "pending" && (
  <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
    <span className="text-lg">⏳</span>
    <p className="text-sm text-amber-800 font-medium">
      Your application is under review. We will notify you once approved.
    </p>
  </div>
)}

{roleAppStatus === "rejected" && (
  <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
    <span className="text-lg">❌</span>
    <p className="text-sm text-red-700 font-medium">
      Your application was not approved. You can re-apply after 30 days.
    </p>
  </div>
)}

        {/* STATS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
        >
          {statCards.map((s, i) => (
            <div key={i} className={`rounded-3xl p-6 border ${s.border} bg-white shadow-sm transition duration-300`}>
              <div className={`w-12 h-12 ${s.bg} rounded-xl mb-4 flex items-center justify-center`}>
                <svg className={`w-6 h-6 ${s.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                </svg>
              </div>
              <p className={`text-4xl font-black ${s.color} mb-1`}>{s.value}</p>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* QUICK ACTIONS */}
        <UserSection title="Quick Actions" subtitle="Jump to key areas of the platform" delay={0.2} accent="bg-cyan-500">
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action, i) => (
              <a key={i} href={action.href}>
                <button className={`flex items-center gap-2 px-6 py-3 text-sm font-bold text-white ${action.bg} rounded-xl shadow-sm transition duration-200`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                  </svg>
                  {action.label}
                </button>
              </a>
            ))}
          </div>
        </UserSection>

        {/* MY TUTORIAL REQUESTS */}
        <UserSection title="My Tutorial Requests" subtitle="Tutorials you've requested from developers" delay={0.3} accent="bg-pink-500">
          {requests.length === 0
            ? <Empty text="You haven't requested any tutorials yet." icon="📚" />
            : <div className="grid gap-4">
              {requests.map((r, index) => (
                <div key={index} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-indigo-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-pink-300 transition-all duration-300">
                  <div>
                    <p className="text-gray-900 font-black text-base mb-1 group-hover:text-pink-600 transition-colors">{r.topic}</p>
                    <p className="text-gray-500 text-sm font-medium">Level: <span className="text-gray-700 font-bold">{r.level}</span></p>
                  </div>
                  <span className={`self-start sm:self-auto text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border shadow-sm ${
                    r.status === "pending"  ? "text-amber-700 bg-amber-50 border-amber-200"
                    : r.status === "accepted" ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-rose-700 bg-rose-50 border-rose-200"
                  }`}>{r.status}</span>
                </div>
              ))}
            </div>
          }
        </UserSection>

        {/* PROJECT MESSAGES */}
        <UserSection title="Project Chats" subtitle="Conversations with developers on your requests" delay={0.4} accent="bg-violet-500">
          {projectChats.length === 0 ? (
            <div className="w-full py-12 text-center flex flex-col items-center gap-4 border-2 border-indigo-100 border-dashed rounded-[2.5rem] bg-white shadow-sm">
              <div className="w-20 h-20 rounded-[1.5rem] bg-violet-50 border-2 border-violet-100 flex items-center justify-center mb-2 shadow-sm">
                <svg className="w-10 h-10 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-600 font-bold text-base">No project chats yet.</p>
              <Link href="/requests/open">
                <button className="px-8 py-4 mt-2 text-sm font-black rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  Browse Open Projects →
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {projectChats.slice(0, 5).map((c) => (
                <div key={c.id} onClick={() => router.push(`/project-chat/${c.id}`)}
                  className="group cursor-pointer flex items-center gap-5 bg-white border border-indigo-100 hover:border-violet-300 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                  {c.developerPhoto
                    ? <img src={c.developerPhoto} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border-2 border-indigo-50 shadow-sm" />
                    : <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-violet-700 bg-violet-50 border-2 border-violet-100 flex-shrink-0 shadow-sm">
                        {c.developerName?.[0] ?? "D"}
                      </div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-black text-base truncate mb-1 group-hover:text-violet-600 transition-colors">{c.requestTitle || "Project Chat"}</p>
                    <p className="text-gray-500 font-semibold text-sm">with <span className="text-gray-700">{c.developerName}</span></p>
                  </div>
                  {c.funded && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border-2 text-emerald-700 bg-emerald-50 border-emerald-200 flex-shrink-0 shadow-sm">
                      Funded ₹{c.fundedAmount?.toLocaleString("en-IN")}
                    </span>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-violet-600 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </UserSection>

        {/* SAVED PROJECTS */}
        <UserSection title="Saved Projects" subtitle="Projects you've bookmarked for later" delay={0.5} accent="bg-purple-500">
          {saved.length === 0
            ? <Empty text="You haven't saved any projects yet." icon="🔖" />
            : <div className="grid sm:grid-cols-2 gap-4">
                {saved.map((p, i) => (
                  <div key={i} className="group bg-white border border-gray-200 shadow-sm rounded-3xl p-6 hover:border-cyan-300 transition duration-200">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 transition group-hover:bg-blue-100">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <h3 className="text-gray-900 font-bold text-sm mb-2">{p.title || "Untitled Project"}</h3>
                    {p.shortDescription && <p className="text-gray-500 text-xs font-medium line-clamp-2 leading-relaxed">{p.shortDescription}</p>}
                    <div className="mt-5 h-[2px] w-0 group-hover:w-full bg-blue-500 transition-all duration-300 rounded-full opacity-60" />
                  </div>
                ))}
              </div>
          }
        </UserSection>

        {/* RECENT ACTIVITY */}
        <UserSection title="Recent Activity" subtitle="Notifications and platform updates" delay={0.6} accent="bg-emerald-500">
          <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-2">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium text-sm">Notifications and updates will appear here.</p>
          </div>
        </UserSection>

      </div>
    </main>
  );
}

function UserSection({ title, subtitle, delay, children, accent = "bg-cyan-500" }: { title: string; subtitle: string; delay: number; children: React.ReactNode; accent?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="mb-12"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-1.5 h-7 ${accent} rounded-sm`} />
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
          <p className="text-gray-500 text-xs font-medium mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="w-full">{children}</div>
    </motion.div>
  );
}

function Empty({ text, icon = "📭" }: { text: string; icon?: string }) {
  return (
    <div className="w-full py-16 text-center border-2 border-indigo-100 border-dashed rounded-[2.5rem] bg-white flex flex-col items-center gap-4 shadow-sm">
      <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center mb-2 shadow-sm">
        <span className="text-4xl filter hue-rotate-15">{icon}</span>
      </div>
      <p className="text-gray-600 font-bold text-base tracking-wide max-w-xs">{text}</p>
    </div>
  );
}// ─────────────────────────────────────────────────────────────────────────────
// PATCH for existing app/dashboard/user/page.tsx
// Add these 3 things to your existing UserDashboard:
// ─────────────────────────────────────────────────────────────────────────────

// 1. Add these imports at the top:
// import { collection, getDocs, query, where } from "firebase/firestore";

// 2. Add this state inside the component:
// const [roleAppStatus, setRoleAppStatus] = useState<string | null>(null);

// 3. Inside your useEffect load function, add:
/*
  const appSnap = await getDocs(
    query(collection(db, "roleApplications"), where("userId", "==", user.uid))
  );
  if (!appSnap.empty) {
    setRoleAppStatus(appSnap.docs[0].data().status ?? null);
  }
*/

// 4. Add this banner right after your opening <main> or top section, BEFORE stats:
// ─── COPY THIS JSX BLOCK ────────────────────────────────────────────────────

/*
{roleAppStatus === "payment_pending" && (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-8 p-5 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-center justify-between gap-4 flex-wrap shadow-sm"
  >
    <div>
      <p className="font-black text-blue-900 text-sm">Your application was approved! 🎉</p>
      <p className="text-xs text-blue-700 mt-0.5">
        Complete the ₹999 one-time joining fee to activate your mentor/developer profile on SYNTHE.
      </p>
    </div>
    <a href="/join/pay">
      <button className="px-5 py-2.5 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm hover:bg-[#4c3ec7] transition-colors flex-shrink-0">
        Pay ₹999 to Activate →
      </button>
    </a>
  </motion.div>
)}

{roleAppStatus === "pending" && (
  <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
    <span className="text-lg">⏳</span>
    <p className="text-sm text-amber-800 font-medium">
      Your application is under review. We will notify you once approved.
    </p>
  </div>
)}

{roleAppStatus === "rejected" && (
  <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
    <span className="text-lg">❌</span>
    <p className="text-sm text-red-700 font-medium">
      Your application was not approved. You can re-apply after 30 days.
    </p>
  </div>
)}
*/

// ─── END OF PATCH ────────────────────────────────────────────────────────────
// No other changes needed. Rest of your existing dashboard stays the same.

export {};