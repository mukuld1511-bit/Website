"use client";
import { useState, useEffect } from "react";
// Yeh line dhundo:

// Isko yeh karo:
import { collection, query, where, getDocs, doc, getDoc, limit } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";

interface Developer {
  id: string; displayName: string; photoURL: string; bio: string;
  skills: string[]; hourlyRate: number; currency: string;
  rating: number; totalSessions: number; certified: boolean;
  availability: "available" | "busy" | "unavailable"; portfolio: string;
  completedProjects: number; role: string;
}

const SKILL_FILTERS = ["All", "Unity", "Unreal", "WebXR", "Blender", "ARCore", "ARKit", "Three.js", "Babylon.js", "A-Frame"];
const SORT_OPTIONS = [
  { label: "Top rated",  value: "rating"     },
  { label: "Most hired", value: "totalSessions" },
  { label: "Lowest rate",value: "hourlyRate"  },
];

const AVAIL_STYLES: Record<string, string> = {
  available:   "bg-green-100 text-green-700 border-green-200",
  busy:        "bg-amber-100 text-amber-700 border-amber-200",
  unavailable: "bg-gray-100 text-gray-500 border-gray-200",
};
const AVAIL_DOT: Record<string, string> = {
  available: "bg-green-500", busy: "bg-amber-400", unavailable: "bg-gray-400",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? "#f59e0b" : "#e5e7eb"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1 font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

function DeveloperCard({ dev }: { dev: Developer }) {
  const avail = dev.availability || "available";
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      {dev.certified && (
        <div className="h-1 bg-gradient-to-r from-[#5B4BDB] to-violet-400" />
      )}
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
              {dev.photoURL
                ? <img src={dev.photoURL} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center text-xl font-black text-gray-400">{dev.displayName?.[0]}</div>
              }
            </div>
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${AVAIL_DOT[avail]}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-black text-gray-900 text-base truncate">{dev.displayName}</p>
              {dev.certified && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#5B4BDB]/10 text-[#5B4BDB] border border-[#5B4BDB]/20 flex-shrink-0">
                  CERTIFIED
                </span>
              )}
            </div>
            <StarRating rating={dev.rating || 0} />
            <p className="text-xs text-gray-400 mt-1">{dev.totalSessions || 0} projects completed</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xl font-black text-gray-900">₹{(dev.hourlyRate || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-400">/hour</p>
          </div>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">{dev.bio || "XR & 3D developer on SYNTHÉ."}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {dev.skills?.slice(0, 5).map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 font-medium">{s}</span>
          ))}
          {(dev.skills?.length ?? 0) > 5 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">+{dev.skills.length - 5} more</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${AVAIL_STYLES[avail]}`}>
            {avail === "available" ? "Available now" : avail === "busy" ? "Busy" : "Unavailable"}
          </span>
          <div className="flex gap-2">
            {dev.portfolio && (
              <a href={dev.portfolio} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            )}
            <Link href={`/developer/${dev.id}`}>
              <button className="px-4 py-2 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] text-white text-xs font-bold transition-colors border-b-[2px] border-[#4438b8] active:translate-y-[1px]">
                View & hire
              </button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function HireDeveloperPage() {
  const [user, setUser] = useState<any>(null);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSkill, setActiveSkill] = useState("All");
  const [sort, setSort] = useState("rating");
  const [search, setSearch] = useState("");
  const [availOnly, setAvailOnly] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "users"), where("role", "in", ["developer", "mentor"]), limit(50));
        const snap = await getDocs(q);
        setDevelopers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Developer)));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = developers
    .filter(d => {
      const skillMatch = activeSkill === "All" || d.skills?.includes(activeSkill);
      const searchMatch = !search || d.displayName?.toLowerCase().includes(search.toLowerCase()) || d.skills?.some(s => s.toLowerCase().includes(search.toLowerCase()));
      const availMatch = !availOnly || d.availability === "available";
      return skillMatch && searchMatch && availMatch;
    })
    .sort((a, b) => {
      if (sort === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sort === "totalSessions") return (b.totalSessions || 0) - (a.totalSessions || 0);
      if (sort === "hourlyRate") return (a.hourlyRate || 0) - (b.hourlyRate || 0);
      return 0;
    });

  const availCount = developers.filter(d => d.availability === "available").length;

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-14 flex-grow w-full">

        {/* Header */}
        <div className="mb-10">
          <Link href="/freelance" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-semibold mb-5 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Freelance Hub
          </Link>
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-3">Hire a Developer</p>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-3">Verified XR Specialists</h1>
              <p className="text-gray-500 max-w-xl">Browse developers and mentors. View their portfolio, check availability, and book directly.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-200">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-bold text-green-700">{availCount} available now</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 shadow-sm">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or skill..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#5B4BDB] transition-colors" />
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 font-semibold bg-white outline-none focus:border-[#5B4BDB] transition-colors">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => setAvailOnly(!availOnly)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${availOnly ? "bg-green-600 border-green-600 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"}`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              Available only
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {SKILL_FILTERS.map(s => (
              <button key={s} onClick={() => setActiveSkill(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${activeSkill === s ? "bg-[#5B4BDB] text-white border-[#5B4BDB]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500 font-medium">{filtered.length} developer{filtered.length !== 1 ? "s" : ""} found</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="flex gap-3 mb-4"><div className="w-14 h-14 rounded-2xl bg-gray-100"/><div className="flex-1 space-y-2 pt-1"><div className="h-4 bg-gray-100 rounded w-2/3"/><div className="h-3 bg-gray-100 rounded w-1/2"/></div></div>
                <div className="h-3 bg-gray-100 rounded mb-2"/><div className="h-3 bg-gray-100 rounded w-4/5"/>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-bold text-gray-900 mb-2">No developers found</p>
            <p className="text-gray-400 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(dev => <DeveloperCard key={dev.id} dev={dev} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}