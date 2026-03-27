"use client";
import { useState, useEffect } from "react";
import {
  collection, query, orderBy, getDocs,
  addDoc, serverTimestamp, doc, getDoc,
} from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Footer from "../../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";

interface Challenge {
  id:          string;
  title:       string;
  description: string;
  brief:       string;
  prize:       string;
  deadline:    any;
  tags:        string[];
  status:      "active" | "ended";
  submissions: number;
  createdAt:   any;
}

// Static challenges — admin can add real ones to Firestore later
const STATIC_CHALLENGES: Omit<Challenge, "id" | "createdAt">[] = [
  {
    title:       "AR Furniture Placement App",
    description: "Build an AR app that lets users place furniture in their room before buying.",
    brief:       "Use ARCore or ARKit (or WebXR) to detect floor surfaces. Let users browse at least 3 furniture models and place them in their environment. Models must be GLB format.",
    prize:       "Verified Developer badge + featured on homepage",
    deadline:    null,
    tags:        ["AR","Unity","WebXR","ARCore"],
    status:      "active",
    submissions: 4,
  },
  {
    title:       "VR Museum Experience",
    description: "Create a VR museum with at least 5 exhibits — 3D models with information panels.",
    brief:       "Build in Unity for Meta Quest (or WebXR). Each exhibit must have a 3D model, a label, and a short description panel. Locomotion must be comfortable (teleport or smooth with vignette).",
    prize:       "Featured showcase + Mentor review session",
    deadline:    null,
    tags:        ["VR","Unity","Meta Quest"],
    status:      "active",
    submissions: 2,
  },
  {
    title:       "WebXR 'Try Before You Buy'",
    description: "Build a product AR try-on experience using WebXR — no app download needed.",
    brief:       "Pick any product category (shoes, glasses, watches, furniture). Build a WebXR experience that works in Chrome on Android. User can place the product in their environment or try it on.",
    prize:       "Verified badge + featured in gallery",
    deadline:    null,
    tags:        ["WebXR","Browser","AR","No install"],
    status:      "active",
    submissions: 1,
  },
];

function formatDeadline(ts: any): string {
  if (!ts) return "Open-ended";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function ChallengesPage() {
  const [user,    setUser]    = useState<any>(null);
  const [userRole,setUserRole]= useState<string>("user");
  const [dbChallenges, setDbChallenges] = useState<Challenge[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setUserRole(snap.data().role ?? "user");
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const q = query(collection(db, "challenges"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setDbChallenges(snap.docs.map(d => ({ id: d.id, ...d.data() } as Challenge)));
      } catch {
        // Collection may not exist yet — use static data
      }
    };
    fetchChallenges();
  }, []);

  // Show DB challenges if they exist, else static
  const challenges = dbChallenges.length > 0
    ? dbChallenges
    : STATIC_CHALLENGES.map((c, i) => ({ ...c, id: `static-${i}`, createdAt: null }));

  const active = challenges.filter(c => c.status === "active");
  const ended  = challenges.filter(c => c.status === "ended");

  const canSubmit = ["learner","developer","mentor","admin"].includes(userRole);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">      <div className="max-w-4xl mx-auto px-4 py-14 flex-grow w-full">

        <div className="mb-10">
          <Link href="/learn" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-semibold mb-5 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to Learn
          </Link>
          <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-2">Community</p>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-3">XR Challenges</h1>
          <p className="text-gray-500 text-lg max-w-xl">
            Build something real. Win recognition. Get featured.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { step: "1", title: "Pick a challenge", desc: "Read the brief. Pick one that matches your skill level." },
            { step: "2", title: "Build it",         desc: "Build your AR/VR app. Use any tool from the roadmap." },
            { step: "3", title: "Submit on SYNTHÉ", desc: "Upload your build to the gallery with tag 'challenge-submission'." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="w-8 h-8 rounded-xl bg-[#5B4BDB] text-white flex items-center justify-center text-sm font-black mb-3">
                {step}
              </div>
              <p className="font-black text-gray-900 mb-1">{title}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Active challenges */}
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
          Active challenges ({active.length})
        </p>
        <div className="space-y-4 mb-10">
          {active.map(c => (
            <motion.div key={c.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div
                className="p-6 cursor-pointer"
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        Active
                      </span>
                      {c.tags.slice(0, 3).map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-full bg-[#5B4BDB]/10 text-[#5B4BDB] text-xs font-semibold">{t}</span>
                      ))}
                    </div>
                    <h3 className="font-black text-gray-900 text-lg mb-1">{c.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{c.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span>🏆 {c.prize}</span>
                      <span>📅 {formatDeadline(c.deadline)}</span>
                      <span>📦 {c.submissions} submission{c.submissions !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 mt-1 transition-transform ${expanded === c.id ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
              </div>

              {expanded === c.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="border-t border-gray-100"
                >
                  <div className="p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Brief</p>
                    <p className="text-gray-700 text-sm leading-relaxed mb-5">{c.brief}</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {!user ? (
                        <Link href="/login">
                          <button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8]">
                            Sign in to submit
                          </button>
                        </Link>
                      ) : !canSubmit ? (
                        <Link href="/join">
                          <button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8]">
                            Apply as Learner to submit
                          </button>
                        </Link>
                      ) : (
                        <Link href="/upload">
                          <button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all active:translate-y-[1px]">
                            Submit your build →
                          </button>
                        </Link>
                      )}
                      <Link href="/learn/tools">
                        <button className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">
                          Browse tools
                        </button>
                      </Link>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      Upload to gallery → add tag "challenge-submission" → admin will review and award prizes
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Ended challenges */}
        {ended.length > 0 && (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Past challenges</p>
            <div className="space-y-3 opacity-60">
              {ended.map(c => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <p className="font-bold text-gray-700 text-sm">{c.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.submissions} submissions · Ended</p>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
      <Footer />
    </div>
  );
}