"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc, getDoc, updateDoc, increment,
  collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import dynamic from "next/dynamic";
import ARViewer from "../../components/ARViewer";
import Link from "next/link";
import { motion } from "framer-motion";

// Dynamically import (no SSR — Three.js / WebGL)
const Viewer = dynamic(() => import("../../components/Viewer"), { ssr: false });

interface Model {
  id:               string;
  title:            string;
  description?:     string;
  modelUrl:         string;
  thumbnailUrl?:    string;
  fileType:         string;
  category?:        string;
  tags?:            string[];
  isPaid:           boolean;
  price?:           number;
  authorId:         string;
  authorName:       string;
  authorPhoto?:     string;
  uploadedAt?:      any;
  views?:           number;
  likes?:           number;
  downloads?:       number;
  engagementScore?: number;
  fileSize?:        number;
  version?:         string;
  platforms?:       string[];
  genre?:           string;
  minimumSpecs?:    { ram: string; storage: string; os: string };
  changelog?:       string;
  storageProvider?: string;
}

interface Comment {
  id:           string;
  text:         string;
  authorName:   string;
  authorPhoto?: string;
  createdAt?:   any;
}

export default function ModelDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const modelId = params?.modelId as string;

  const [model,       setModel]       = useState<Model | null>(null);
  const [user,        setUser]        = useState<any>(null);
  const [comments,    setComments]    = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [liked,       setLiked]       = useState(false);
  const [likeCount,   setLikeCount]   = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [purchasing,  setPurchasing]  = useState(false);
  const [purchased,   setPurchased]   = useState(false);
  const [error,       setError]       = useState("");

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  // Fetch model
  useEffect(() => {
    if (!modelId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "models", modelId));
        if (!snap.exists()) { router.push("/gallery"); return; }
        const data = { id: snap.id, ...snap.data() } as Model;
        setModel(data);
        setLikeCount(data.likes ?? 0);
        updateDoc(doc(db, "models", modelId), { views: increment(1) }).catch(() => {});
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [modelId]);

  // Real-time comments
  useEffect(() => {
    if (!modelId) return;
    const q = query(collection(db, "models", modelId, "comments"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment)));
    });
  }, [modelId]);

  // Purchase status
  useEffect(() => {
    if (!user || !model || !model.isPaid) return;
    getDoc(doc(db, "purchases", `${user.uid}_${modelId}`))
      .then(snap => { if (snap.exists()) setPurchased(true); })
      .catch(() => {});
  }, [user, model, modelId]);

  const handleLike = async () => {
    if (!user) { router.push("/login"); return; }
    if (liked) return;
    setLiked(true);
    setLikeCount(c => c + 1);
    await updateDoc(doc(db, "models", modelId), {
      likes: increment(1),
      engagementScore: increment(3),
    }).catch(() => {});
  };

  const handleDownload = async () => {
    if (!model) return;
    window.open(model.modelUrl, "_blank");
    await updateDoc(doc(db, "models", modelId), {
      downloads: increment(1),
      engagementScore: increment(5),
    }).catch(() => {});
  };

  const handleBuy = async () => {
    if (!user) { router.push("/login"); return; }
    if (!model) return;
    setPurchasing(true); setError("");
    try {
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: model.price, modelId }),
      });
      if (!orderRes.ok) throw new Error("Failed to create order");
      const { orderId, amount, currency } = await orderRes.json();
      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount, currency, name: "SYNTHÉ", description: model.title, order_id: orderId,
        handler: async (response: any) => {
          const v = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, modelId, userId: user.uid }),
          });
          if (v.ok) {
            setPurchased(true);
            await updateDoc(doc(db, "models", modelId), {
              downloads: increment(1),
              engagementScore: increment(5),
            }).catch(() => {});
          }
        },
        prefill: { email: user.email ?? "" },
        theme: { color: "#5B4BDB" },
      });
      rzp.open();
    } catch (e) { setError((e as Error).message); }
    finally { setPurchasing(false); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push("/login"); return; }
    if (!commentText.trim()) return;
    await addDoc(collection(db, "models", modelId, "comments"), {
      text:         commentText.trim(),
      authorId:     user.uid,
      authorName:   user.displayName ?? user.email ?? "Anonymous",
      authorPhoto:  user.photoURL ?? "",
      createdAt:    serverTimestamp(),
    }).catch(err => console.error(err));
    setCommentText("");
  };

  // ─── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
            <div className="aspect-video rounded-2xl bg-gray-200 animate-pulse" />
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!model) return null;

  const isDownloadable = !model.isPaid || purchased;
  const isXRBuild      = ["zip", "build"].includes(model.fileType);
  const engScore       = model.engagementScore ?? 0;
  const trendBadge     =
    engScore >= 70 ? { label: "🔥 Trending",  cls: "bg-amber-100 text-amber-700"  }
    : engScore >= 30 ? { label: "⚡ Popular",  cls: "bg-purple-100 text-purple-700" }
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10 flex-grow w-full">

        {/* Back link */}
        <Link href="/gallery"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm font-semibold mb-6 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Gallery
        </Link>

        <div className="grid md:grid-cols-5 gap-8">

          {/* ── Left: Viewer + Comments ─────────────────────────────────────── */}
          <div className="md:col-span-3 space-y-4">

            {/* 3D viewer or XR placeholder */}
            {!isXRBuild ? (
              <Viewer
                modelUrl={model.modelUrl}
                fileType={model.fileType}
                fileSize={model.fileSize}
                title={model.title}
              />
            ) : (
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-900 flex flex-col items-center justify-center gap-3">
                <span className="text-6xl">🥽</span>
                <p className="text-white font-bold">XR Build Package</p>
                <p className="text-purple-200 text-sm">.zip file — download to install on your headset</p>
              </div>
            )}

            {/* AR button — GLB/GLTF only when downloadable */}
            {["glb", "gltf"].includes(model.fileType) && isDownloadable && (
              <ARViewer modelUrl={model.modelUrl} fileType={model.fileType} />
            )}

            {/* Tags */}
            {(model.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {model.tags!.map(tag => (
                  <span key={tag}
                    className="px-3 py-1.5 rounded-full bg-[#5B4BDB]/10 text-[#5B4BDB] text-xs font-semibold border border-[#5B4BDB]/20">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Comments */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">
                Comments{" "}
                {comments.length > 0 && (
                  <span className="text-gray-400 font-normal">({comments.length})</span>
                )}
              </h3>

              {user ? (
                <form onSubmit={handleComment} className="flex gap-2 mb-6">
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BDB]/30 focus:border-[#5B4BDB]"
                  />
                  <button type="submit" disabled={!commentText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#5B4BDB] text-white text-sm font-bold disabled:opacity-50">
                    Post
                  </button>
                </form>
              ) : (
                <Link href="/login">
                  <p className="text-sm text-[#5B4BDB] font-semibold mb-4 hover:underline cursor-pointer">
                    Sign in to comment
                  </p>
                </Link>
              )}

              <div className="space-y-4 max-h-64 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No comments yet — be the first</p>
                ) : comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#5B4BDB]/10 flex items-center justify-center flex-shrink-0">
                      {c.authorPhoto
                        ? <img src={c.authorPhoto} className="w-full h-full rounded-full object-cover" alt="" />
                        : <span className="text-[#5B4BDB] text-xs font-bold">{c.authorName.charAt(0).toUpperCase()}</span>
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{c.authorName}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Info panel ───────────────────────────────────────────── */}
          <motion.div
            className="md:col-span-2 space-y-5"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Title + badges */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h1 className="text-2xl font-black text-gray-900 leading-tight">{model.title}</h1>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                    model.isPaid ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  }`}>{model.fileType}</span>
                  {trendBadge && (
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${trendBadge.cls}`}>
                      {trendBadge.label}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#5B4BDB]/10 flex items-center justify-center overflow-hidden">
                  {model.authorPhoto
                    ? <img src={model.authorPhoto} className="w-full h-full object-cover" alt="" />
                    : <span className="text-[#5B4BDB] text-xs font-bold">{model.authorName?.charAt(0)}</span>
                  }
                </div>
                <span className="text-gray-600 text-sm font-medium">{model.authorName}</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Views",     value: model.views     ?? 0, icon: "👁" },
                { label: "Likes",     value: likeCount,             icon: "❤️" },
                { label: "Downloads", value: model.downloads ?? 0, icon: "⬇️" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm hover:border-[#5B4BDB]/30 transition-colors">
                  <p className="text-base mb-0.5">{icon}</p>
                  <p className="text-lg font-black text-gray-900">{value.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {model.description && (
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <p className="text-gray-700 text-sm leading-relaxed">{model.description}</p>
              </div>
            )}

            {/* Build specs (XR zip) */}
            {isXRBuild && model.platforms && (
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
                <p className="font-bold text-gray-900 text-sm">Build Specs</p>
                {model.genre   && <div className="flex justify-between text-sm"><span className="text-gray-500">Genre</span><span className="font-semibold">{model.genre}</span></div>}
                {model.version && <div className="flex justify-between text-sm"><span className="text-gray-500">Version</span><span className="font-semibold">{model.version}</span></div>}
                {(model.platforms?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-gray-500 text-sm mb-2">Platforms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {model.platforms!.map(p => (
                        <span key={p} className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                {model.minimumSpecs && (
                  <div className="space-y-1.5 pt-1 border-t border-gray-100">
                    {Object.entries(model.minimumSpecs).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-gray-500 capitalize">{k}</span>
                        <span className="font-semibold text-gray-700">{v as string}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {model.isPaid && !purchased ? (
                <>
                  <button onClick={handleBuy} disabled={purchasing}
                    className="w-full py-4 rounded-xl bg-[#5B4BDB] text-white font-bold border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all active:translate-y-[1px] disabled:opacity-50">
                    {purchasing ? "Processing..." : `Buy for ₹${model.price}`}
                  </button>
                  <p className="text-xs text-center text-gray-400">Secure payment via Razorpay · 15% platform fee</p>
                </>
              ) : (
                <button onClick={handleDownload}
                  className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold border-b-[3px] border-black/50 hover:bg-gray-800 transition-all active:translate-y-[1px] flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download{model.fileSize ? ` (${model.fileSize.toFixed(1)} MB)` : ""}
                </button>
              )}

              <button onClick={handleLike} disabled={liked}
                className={`w-full py-3 rounded-xl text-sm font-bold border-b-[3px] transition-all active:translate-y-[1px] flex items-center justify-center gap-2 ${
                  liked
                    ? "bg-red-50 text-red-500 border-red-200 cursor-default"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}>
                {liked ? "❤️" : "🤍"} {liked ? "Liked" : "Like"} · {likeCount.toLocaleString()}
              </button>
            </div>

            {/* Metadata */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2.5 text-xs">
              {[
                { label: "Category", value: model.category ?? "—" },
                { label: "Format",   value: (model.fileType ?? "").toUpperCase() },
                ...(model.fileSize ? [{ label: "File size", value: `${model.fileSize.toFixed(1)} MB` }] : []),
                { label: "Storage", value: model.storageProvider === "r2" ? "Cloudflare R2" : "Supabase" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}