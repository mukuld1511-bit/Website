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
        const uSnap = await getDoc(doc(db, "users", devId));

        // Fallback: also check developerApplications if not in users
        if (uSnap.exists()) {
          setDev({ id: uSnap.id, ...uSnap.data() } as Developer);
        } else {
          let appData: any = null;
          let appId = "";

          const directAppSnap = await getDoc(doc(db, "developerApplications", devId));
          if (directAppSnap.exists()) {
            appData = directAppSnap.data();
            appId = directAppSnap.id;
          } else {
            const appSnap = await getDocs(query(collection(db, "developerApplications"), where("userId", "==", devId)));
            if (!appSnap.empty) {
              appData = appSnap.docs[0].data();
              appId = appSnap.docs[0].id;
            }
          }

          if (appData) {
            setDev({
              id: appId,
              name: appData.fullName ?? appData.name ?? "Creator",
              email: appData.email ?? "",
              role: "creator",
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
    glb: "#8b5cf6", gltf: "#8b5cf6", obj: "#0ea5e9", fbx: "#0ea5e9",
    dwg: "#f59e0b", dxf: "#f59e0b", build: "#10b981",
  };

  const totalDownloads = models.reduce((s, m) => s + (m.downloads ?? 0), 0);
  const totalViews     = models.reduce((s, m) => s + (m.views ?? 0), 0);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
    </div>
  );

  if (!dev) return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] pt-20">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6 shadow-sm">
             <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Creator not found</h2>
          <p className="text-gray-500 mb-6 font-medium">We couldn't locate this creator profile.</p>
          <Link href="/connect">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex px-8 py-3.5 rounded-xl text-white font-bold text-sm bg-blue-600 hover:bg-blue-700 shadow-sm transition"
            >
              ← Browse Creators
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
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 relative pt-28 pb-24 px-4 overflow-x-hidden">
        <div className="relative z-10 max-w-5xl mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8 text-gray-500 text-xs font-bold uppercase tracking-widest">
            <Link href="/connect" className="hover:text-gray-900 transition duration-150">Creators</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900">{dev.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: Profile card */}
            <div className="lg:col-span-1 space-y-6">

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm"
              >
                {/* Avatar */}
                <div className="relative w-28 h-28 mx-auto mb-6">
                  {dev.certified && (
                     <div className="absolute -inset-1.5 rounded-full border-2 border-[#5B4BDB] shadow-[0_0_20px_rgba(91,75,219,0.5)] opacity-80 pointer-events-none" />
                  )}
                  <div className={`relative w-28 h-28 rounded-full overflow-hidden border-4 border-white ${dev.certified ? 'bg-[#5B4BDB]/10 text-[#5B4BDB]' : 'bg-gray-100 text-blue-700'} flex items-center justify-center text-4xl font-extrabold shadow-md`}>
                    {dev.profileImage && dev.profileImage !== "/avatar.png"
                      ? <img src={dev.profileImage} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : dev.name?.[0]
                    }
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-1">
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">{dev.name}</h1>
                  {dev.certified && (
                    <div className="w-5 h-5 rounded-full bg-[#5B4BDB]/10 flex items-center justify-center flex-shrink-0" title="Synthé Certified">
                      <svg className="w-3 h-3 text-[#5B4BDB]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  )}
                </div>

                <p className="text-gray-500 text-sm mb-2 font-bold capitalize">{dev.role}</p>

                {dev.certified && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5B4BDB] shadow-[0_0_15px_rgba(91,75,219,0.4)] text-white text-[10px] font-black uppercase tracking-widest mb-4">
                    ⭐ Certified Spatial Creator
                  </div>
                )}

                <p className="text-gray-400 text-xs font-semibold mb-6">Member since {timeAgo(dev.createdAt)}</p>

                {dev.bio && <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium">{dev.bio}</p>}

                {/* Links */}
                <div className="flex flex-col gap-3">
                  {dev.portfolio && (
                    <a
                      href={formatLink(dev.portfolio)}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-xs font-bold transition duration-200 w-full"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Portfolio
                    </a>
                  )}
                  {dev.linkedin && (
                    <a
                      href={formatLink(dev.linkedin)}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-xs font-bold transition duration-200 w-full"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      LinkedIn
                    </a>
                  )}
                  {dev.github && (
                    <a
                      href={`https://github.com/${dev.github.replace("github.com/", "").replace("https://", "").replace("http://", "")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 hover:border-gray-800 hover:bg-gray-100 text-gray-700 hover:text-gray-900 text-xs font-bold transition duration-200 w-full"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
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
                  className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {dev.skills.map((s) => (
                      <span key={s} className="px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50 text-gray-700 text-xs font-bold shadow-sm">{s}</span>
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
                  { label: "Models",    val: models.length,  color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Downloads", val: totalDownloads, color: "text-cyan-600", bg: "bg-cyan-50" },
                  { label: "Views",     val: totalViews,     color: "text-green-600", bg: "bg-green-50" },
                ].map((s, i) => (
                  <div key={i} className={`p-4 rounded-2xl border border-gray-100 ${s.bg} text-center shadow-sm`}>
                    <p className={`text-xl font-black mb-1 ${s.color}`}>
                      {s.val.toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-[9px] uppercase tracking-widest font-bold">{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Models */}
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    Published Models
                  </h2>
                  <p className="text-gray-500 font-bold text-sm bg-gray-100 px-3 py-1 rounded-full">{models.length} total</p>
                </div>

                {models.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-white shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-gray-900 font-black text-lg mb-1">No models published</p>
                    <p className="text-gray-500 text-sm font-medium">This creator hasn't published any models yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                    {models.map((m, i) => {
                      const ext   = m.fileType?.toLowerCase() ?? "glb";
                      const color = FILE_COLORS[ext] ?? "#4f46e5";
                      return (
                        <motion.div key={m.id}
                          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: i * 0.05 }}
                          className="group"
                        >
                          <Link href={`/gallery/${m.id}`}>
                            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-blue-300 hover:shadow-md transition duration-300 cursor-pointer shadow-sm">
                              <div className="relative aspect-square overflow-hidden bg-gray-50/50 flex items-center justify-center border-b border-gray-100">
                                {m.thumbnailUrl
                                  ? <img src={m.thumbnailUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                  : (
                                    <svg className="w-8 h-8" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                  )
                                }
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/90 backdrop-blur shadow-sm border border-gray-200"
                                  style={{ color }}>
                                  {ext}
                                </div>
                                {m.isPaid && (
                                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-green-200 bg-green-50 text-green-700 shadow-sm">
                                    ₹{m.price}
                                  </div>
                                )}
                              </div>
                              <div className="p-4">
                                <p className="text-gray-900 text-sm font-bold line-clamp-1 mb-2 group-hover:text-blue-600 transition">{m.title}</p>
                                <div className="flex items-center gap-3 text-gray-500 text-[11px] font-bold">
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    {m.downloads ?? 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </main>

      <Footer />
    </div>
  );
}