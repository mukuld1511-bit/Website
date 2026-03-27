"use client";
import { useState, useEffect, Suspense } from "react";
import {
  collection, query, where, orderBy,
  getDocs, limit,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import Footer from "../../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";

interface ShowcaseModel {
  id:           string;
  title:        string;
  thumbnailUrl?: string;
  modelUrl:     string;
  fileType:     string;
  authorName:   string;
  authorPhoto?: string;
  tags:         string[];
  uploadedAt?:  any;
  category?:    string;
  engagementScore?: number;
}

function ModelCard({ m }: { m: ShowcaseModel }) {
  const isChallengeSubmission = m.tags?.includes("challenge-submission");

  return (
    <Link href={`/gallery/${m.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
      >
        <div className="relative aspect-square bg-gray-100">
          {m.thumbnailUrl ? (
            <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className="px-2 py-0.5 rounded-lg bg-black/70 text-white text-xs font-bold uppercase">
              {m.fileType}
            </span>
            {isChallengeSubmission && (
              <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white text-xs font-bold">
                Challenge
              </span>
            )}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-white text-sm truncate mb-0.5">{m.title}</h3>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#5B4BDB]/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {m.authorPhoto
                ? <img src={m.authorPhoto} className="w-full h-full object-cover" alt="" />
                : <span className="text-[#5B4BDB] text-xs font-bold">{m.authorName?.charAt(0)}</span>
              }
            </div>
            <p className="text-xs text-gray-500 truncate">{m.authorName}</p>
          </div>
          {m.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {m.tags.filter(t => t !== "showcase" && t !== "challenge-submission").slice(0, 2).map(t => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">{t}</span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

function ShowcaseContent() {
  const [models,   setModels]   = useState<ShowcaseModel[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<"all" | "showcase" | "challenge">("all");

  useEffect(() => {
    const fetchShowcase = async () => {
      setLoading(true);
      try {
        // Fetch models tagged with "showcase" or "challenge-submission"
        const [showcaseSnap, challengeSnap] = await Promise.all([
          getDocs(query(
            collection(db, "models"),
            where("status",   "==", "published"),
            where("tags",     "array-contains", "showcase"),
            orderBy("uploadedAt", "desc"),
            limit(48)
          )),
          getDocs(query(
            collection(db, "models"),
            where("status",   "==", "published"),
            where("tags",     "array-contains", "challenge-submission"),
            orderBy("uploadedAt", "desc"),
            limit(48)
          )),
        ]);

        const all = new Map<string, ShowcaseModel>();
        showcaseSnap.docs.forEach(d  => all.set(d.id, { id: d.id, ...d.data() } as ShowcaseModel));
        challengeSnap.docs.forEach(d => all.set(d.id, { id: d.id, ...d.data() } as ShowcaseModel));
        setModels([...all.values()]);
      } catch (err) {
        console.error("Showcase fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchShowcase();
  }, []);

  const filtered = models.filter(m => {
    if (filter === "showcase")  return m.tags?.includes("showcase");
    if (filter === "challenge") return m.tags?.includes("challenge-submission");
    return true;
  });

  const showcaseCount  = models.filter(m => m.tags?.includes("showcase")).length;
  const challengeCount = models.filter(m => m.tags?.includes("challenge-submission")).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-14 flex-grow w-full">

      <div className="mb-10">
        <Link href="/learn" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-semibold mb-5 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back to Learn
        </Link>
        <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-2">Community</p>
        <h1 className="text-4xl font-black tracking-tight text-white mb-3">Student showcase</h1>
        <p className="text-gray-500 text-lg max-w-xl">
          Real AR/VR work built by SYNTHÉ learners and developers.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total featured",        value: models.length      },
          { label: "Showcase picks",         value: showcaseCount      },
          { label: "Challenge submissions",  value: challengeCount     },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 w-fit mb-6">
        {([
          { key: "all",       label: "All"                                  },
          { key: "showcase",  label: `Showcase picks (${showcaseCount})`    },
          { key: "challenge", label: `Challenge (${challengeCount})`        },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === key ? "bg-white text-white shadow-sm" : "text-gray-500"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-4 bg-white space-y-2">
                <div className="h-4 bg-gray-200 rounded w-4/5" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-4">🎨</p>
          <p className="font-black text-white text-lg mb-2">Nothing here yet</p>
          <p className="text-gray-500 text-sm mb-5">
            Upload a model to the gallery with the tag "showcase" and it'll appear here
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/upload">
              <button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all">
                Upload your work
              </button>
            </Link>
            <Link href="/learn/challenges">
              <button className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-[#0A0A0F] transition-all">
                View challenges
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(m => <ModelCard key={m.id} m={m} />)}
        </div>
      )}

      {/* CTA */}
      {filtered.length > 0 && (
        <div className="mt-10 p-6 rounded-2xl border border-gray-100 bg-white shadow-sm text-center">
          <p className="font-black text-white mb-2">Want to be featured here?</p>
          <p className="text-gray-500 text-sm mb-4">
            Upload your AR/VR work to the gallery and add the tag{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 text-xs">showcase</code>{" "}
            or participate in a challenge
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/upload">
              <button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all active:translate-y-[1px]">
                Upload your work
              </button>
            </Link>
            <Link href="/learn/challenges">
              <button className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-[#0A0A0F] transition-all">
                View challenges
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans text-white">      <Suspense fallback={
        <div className="flex-grow flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#5B4BDB]/30 border-t-[#5B4BDB] rounded-full animate-spin" />
        </div>
      }>
        <ShowcaseContent />
      </Suspense>
      <Footer />
    </div>
  );
}