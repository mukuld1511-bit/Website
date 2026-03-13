"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

interface Developer {
  id: string;
  name: string;
  email: string;
  role: string;
  certified: boolean;
  profileImage: string;
  bio?: string;
  skills?: string[];
  portfolio?: string;
  linkedin?: string;
  github?: string;
  createdAt: any;
}

interface Model {
  id: string;
  title: string;
  thumbnailUrl: string;
  fileType: string;
  isPaid: boolean;
  price: number;
  views: number;
  downloads: number;
}

function timeAgo(ts: any): string {
  if (!ts) return "";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function DeveloperProfilePage() {
  const params = useParams();
  const devId  = params?.id as string;

  const [dev,     setDev]     = useState<Developer | null>(null);
  const [models,  setModels]  = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!devId) return;
    async function load() {
      setLoading(true);
      try {
        // ✅ FIX: users/{uid} — doc ID IS the user's uid, use getDoc
        const uSnap = await getDoc(doc(db, "users", devId));

        // Fallback: also check developerApplications if not in users
        if (uSnap.exists()) {
          setDev({ id: uSnap.id, ...uSnap.data() } as Developer);
        } else {
          let appData: any = null;
          let appId = "";

          // Try getting by document ID first (for older links)
          const directAppSnap = await getDoc(doc(db, "developerApplications", devId));
          if (directAppSnap.exists()) {
            appData = directAppSnap.data();
            appId = directAppSnap.id;
          } else {
            // Check if devId is the userId field
            const appSnap = await getDocs(query(collection(db, "developerApplications"), where("userId", "==", devId)));
            if (!appSnap.empty) {
              appData = appSnap.docs[0].data();
              appId = appSnap.docs[0].id;
            }
          }

          if (appData) {
            setDev({
              id: appId,
              name: appData.fullName ?? appData.name ?? "Developer",
              email: appData.email ?? "",
              role: "developer",
              certified: appData.status === "approved",
              profileImage: appData.profileImage ?? "",
              bio: appData.bio ?? "",
              skills: appData.skills ?? [],
              portfolio: appData.portfolio ?? "",
              linkedin: appData.linkedin ?? "",
              github: appData.github ?? "",
              createdAt: appData.createdAt,
            } as Developer);
          }
        }

        // ✅ FIX: NO where("status") — models have no status filter per conventions
        const mSnap = await getDocs(
          query(
            collection(db, "models"),
            where("authorId", "==", devId),
            orderBy("uploadedAt", "desc"),
            limit(12)
          )
        );
        setModels(mSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Model)));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, [devId]);

  const FILE_COLORS: Record<string, string> = {
    glb: "#a78bfa", gltf: "#a78bfa", obj: "#22d3ee", fbx: "#22d3ee",
    dwg: "#fbbf24", dxf: "#fbbf24", build: "#34d399",
  };

  const totalDownloads = models.reduce((s, m) => s + (m.downloads ?? 0), 0);
  const totalViews     = models.reduce((s, m) => s + (m.views ?? 0), 0);

  if (loading) return (
    <div className="min-h-screen bg-[#050008] flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
    </div>
  );

  if (!dev) return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white mb-3">Developer not found</h2>
          <Link href="/connect">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{ willChange: "transform", background: "linear-gradient(135deg,#7c3aed,#0891b2)" }}
              className="inline-flex px-6 py-3 rounded-2xl text-white font-black text-sm cursor-pointer mt-3"
            >
              ← Browse Developers
            </motion.div>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  // Format portfolio/linkedin links with www prefix
  const formatLink = (url: string) => {
    if (!url) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  };

  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />

      <div className="relative pt-24 pb-20 px-4 overflow-x-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse,rgba(124,58,237,0.1) 0%,transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.018] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(rgba(167,139,250,1) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="relative z-10 max-w-5xl mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-white/30 text-xs font-semibold">
            <Link href="/connect" className="hover:text-white/60 transition duration-150">Developers</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white/50">{dev.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

            {/* Left: Profile card */}
            <div className="lg:col-span-1 space-y-5">

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl overflow-hidden p-7 text-center"
              >
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background: "linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.3),transparent)" }} />

                {/* Avatar */}
                <div className="relative w-24 h-24 mx-auto mb-5">
                  <div className="absolute -inset-[2px] rounded-3xl opacity-70 blur"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)" }} />
                  <div className="relative w-24 h-24 rounded-3xl overflow-hidden border border-white/10 bg-white/[0.05] flex items-center justify-center text-3xl font-black text-white/30">
                    {dev.profileImage && dev.profileImage !== "/avatar.png"
                      ? <img src={dev.profileImage} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : dev.name?.[0]
                    }
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-1">
                  <h1 className="text-xl font-black text-white">{dev.name}</h1>
                  {dev.certified && (
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0" title="Synthé Certified">
                      <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  )}
                </div>

                <p className="text-white/35 text-xs mb-1 capitalize">{dev.role}</p>

                {dev.certified && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/25 bg-amber-500/8 text-amber-300 text-[10px] font-black mb-4">
                    ⭐ Synthé Certified
                  </div>
                )}

                <p className="text-white/35 text-xs mb-5">Member since {timeAgo(dev.createdAt)}</p>

                {dev.bio && <p className="text-white/45 text-sm leading-relaxed mb-5">{dev.bio}</p>}

                {/* Links */}
                <div className="flex flex-col gap-2">
                  {dev.portfolio && (
                    <a
                      href={formatLink(dev.portfolio)}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/8 hover:border-violet-500/30 hover:bg-violet-500/8 text-white/50 hover:text-violet-300 text-xs font-bold transition duration-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Portfolio
                    </a>
                  )}
                  {dev.linkedin && (
                    <a
                      href={formatLink(dev.linkedin)}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/8 hover:border-cyan-500/30 hover:bg-cyan-500/8 text-white/50 hover:text-cyan-300 text-xs font-bold transition duration-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      LinkedIn
                    </a>
                  )}
                  {dev.github && (
                    <a
                      href={`https://github.com/${dev.github.replace("github.com/", "").replace("https://", "").replace("http://", "")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/8 hover:border-violet-500/30 hover:bg-violet-500/8 text-white/50 hover:text-violet-300 text-xs font-bold transition duration-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                      </svg>
                      GitHub
                    </a>
                  )}
                </div>
              </motion.div>

              {/* Skills */}
              {dev.skills && dev.skills.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                  className="rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl p-6"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/25 mb-4">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {dev.skills.map((s) => (
                      <span key={s} className="px-3 py-1.5 rounded-xl border border-violet-500/20 bg-violet-500/8 text-violet-300 text-xs font-bold">{s}</span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
                className="grid grid-cols-3 gap-3"
              >
                {[
                  { label: "Models",    val: models.length,  color: "#a78bfa" },
                  { label: "Downloads", val: totalDownloads, color: "#22d3ee" },
                  { label: "Views",     val: totalViews,     color: "#34d399" },
                ].map((s, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                    <p className="text-xl font-black mb-0.5"
                      style={{ backgroundImage: `linear-gradient(135deg,${s.color},white)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                      {s.val.toLocaleString()}
                    </p>
                    <p className="text-white/25 text-[9px] uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Models */}
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-white">
                    Published{" "}
                    <span style={{ backgroundImage: "linear-gradient(90deg,#a78bfa,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                      Models
                    </span>
                  </h2>
                  <p className="text-white/25 text-xs">{models.length} total</p>
                </div>

                {models.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center border border-white/5 rounded-3xl bg-white/[0.01]">
                    <svg className="w-12 h-12 text-white/10 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-white/30 font-black text-lg">No models published yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {models.map((m, i) => {
                      const ext   = m.fileType?.toLowerCase() ?? "glb";
                      const color = FILE_COLORS[ext] ?? "#a78bfa";
                      return (
                        <motion.div key={m.id}
                          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: i * 0.05 }}>
                          <Link href={`/gallery/${m.id}`}>
                            <div className="group relative rounded-2xl border border-white/6 bg-white/[0.025] overflow-hidden hover:border-violet-500/25 transition duration-300 cursor-pointer">
                              <div className="relative aspect-square overflow-hidden"
                                style={{ background: `linear-gradient(135deg,${color}10,rgba(0,0,0,0))` }}>
                                {m.thumbnailUrl
                                  ? <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                  : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <svg className="w-8 h-8 opacity-15" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                      </svg>
                                    </div>
                                  )
                                }
                                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-black"
                                  style={{ color, background: `${color}22`, border: `1px solid ${color}35` }}>
                                  {ext.toUpperCase()}
                                </div>
                                {m.isPaid && (
                                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-black border border-emerald-500/30 bg-emerald-500/20 text-emerald-300">
                                    ₹{m.price}
                                  </div>
                                )}
                              </div>
                              <div className="p-3">
                                <p className="text-white/80 text-xs font-bold line-clamp-1 mb-1">{m.title}</p>
                                <div className="flex items-center gap-2 text-white/25 text-[10px]">
                                  <span className="flex items-center gap-0.5">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    {m.downloads ?? 0}
                                  </span>
                                  <span className="flex items-center gap-0.5">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    {m.views ?? 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}