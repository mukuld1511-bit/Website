"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, increment, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

import Footer from "../../components/Footer";
import dynamic from "next/dynamic";
import ARViewer from "../../components/ARViewer";
import Link from "next/link";
import { motion } from "framer-motion";

const Viewer = dynamic(() => import("../../components/Viewer"), { ssr: false });

interface Model {
  id: string; title: string; description?: string; modelUrl: string;
  thumbnailUrl?: string; fileType: string; category?: string; tags?: string[];
  isPaid: boolean; price?: number; authorId: string; authorName: string;
  authorPhoto?: string; uploadedAt?: any; views?: number; likes?: number;
  downloads?: number; engagementScore?: number; fileSize?: number;
  version?: string; platforms?: string[]; genre?: string;
  minimumSpecs?: { ram: string; storage: string; os: string };
  changelog?: string; storageProvider?: string;
}
interface Comment {
  id: string; text: string; authorName: string; authorPhoto?: string; createdAt?: any;
}

export default function ModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const modelId = params?.modelId as string;

  const [model, setModel] = useState<Model | null>(null);
  const [user, setUser] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { const unsub = onAuthStateChanged(auth, u => setUser(u ?? null)); return () => unsub(); }, []);

  useEffect(() => {
    if (!modelId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "models", modelId));
        if (!snap.exists()) { router.push("/verse"); return; }
        const data = { id: snap.id, ...snap.data() } as Model;
        setModel(data); setLikeCount(data.likes ?? 0);
        updateDoc(doc(db, "models", modelId), { views: increment(1) }).catch(() => {});
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [modelId]);

  useEffect(() => {
    if (!modelId) return;
    const q = query(collection(db, "models", modelId, "comments"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => { setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment))); });
  }, [modelId]);

  useEffect(() => {
    if (!user || !model || !model.isPaid) return;
    getDoc(doc(db, "purchases", `${user.uid}_${modelId}`)).then(snap => { if (snap.exists()) setPurchased(true); }).catch(() => {});
  }, [user, model, modelId]);

  const handleLike = async () => {
    if (!user) { router.push("/login"); return; }
    if (liked) return;
    setLiked(true); setLikeCount(c => c + 1);
    await updateDoc(doc(db, "models", modelId), { likes: increment(1), engagementScore: increment(3) }).catch(() => {});
  };

  const handleDownload = async () => {
    if (!model) return;
    window.open(model.modelUrl, "_blank");
    await updateDoc(doc(db, "models", modelId), { downloads: increment(1), engagementScore: increment(5) }).catch(() => {});
  };

  const handleBuy = async () => {
    if (!user) { router.push("/login"); return; }
    if (!model) return;
    setPurchasing(true); setError("");
    try {
      const orderRes = await fetch("/api/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: model.price, modelId }) });
      if (!orderRes.ok) throw new Error("Failed to create order");
      const { orderId, amount, currency } = await orderRes.json();
      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount, currency, name: "SYNTHÉ", description: model.title, order_id: orderId,
        handler: async (response: any) => {
          const v = await fetch("/api/verify-payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...response, modelId, userId: user.uid }) });
          if (v.ok) { setPurchased(true); await updateDoc(doc(db, "models", modelId), { downloads: increment(1), engagementScore: increment(5) }).catch(() => {}); }
        },
        prefill: { email: user.email ?? "" }, theme: { color: "#5B4BDB" },
      });
      rzp.open();
    } catch (e) { setError((e as Error).message); }
    finally { setPurchasing(false); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push("/login"); return; }
    if (!commentText.trim()) return;
    await addDoc(collection(db, "models", modelId, "comments"), { text: commentText.trim(), authorId: user.uid, authorName: user.displayName ?? user.email ?? "Anonymous", authorPhoto: user.photoURL ?? "", createdAt: serverTimestamp() }).catch(err => console.error(err));
    setCommentText("");
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="max-w-6xl mx-auto px-4 py-28 grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3"><div className="aspect-video rounded-3xl bg-[#141420] border-2 border-[#2A2A3E] animate-pulse"/></div>
        <div className="md:col-span-2 space-y-4"><div className="h-8 bg-[#141420] rounded-xl border-2 border-[#2A2A3E] animate-pulse w-3/4"/><div className="h-4 bg-[#2A2A3E] rounded animate-pulse w-1/2"/></div>
      </div>
    </div>
  );

  if (!model) return null;

  const isDownloadable = !model.isPaid || purchased;
  const isXRBuild = ["zip", "build"].includes(model.fileType);
  const isWebXRReady = ["glb", "gltf"].includes(model.fileType?.toLowerCase());
  const engScore = model.engagementScore ?? 0;
  const trendBadge = engScore >= 70 ? { label: "🔥 Trending", cls: "bg-amber-500/15 text-amber-400 border border-amber-500/30" } : engScore >= 30 ? { label: "⚡ Popular", cls: "bg-purple-500/15 text-purple-400 border border-purple-500/30" } : null;

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans text-white">

      <div className="max-w-6xl mx-auto px-4 py-28 flex-grow w-full">

        {/* Back */}
        <Link href="/verse" className="inline-flex items-center gap-2 text-[#9494AD] hover:text-white text-sm font-bold mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back to 3D Verse
        </Link>

        {/* WebXR highlight banner — only for WebXR-ready models */}
        {isWebXRReady && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
            className="mb-8 flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#5B4BDB]/20 to-[#141420] border md:border-2 border-[#5B4BDB]/30 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-[#5B4BDB] flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(91,75,219,0.5)]">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2"/>
              </svg>
            </div>
            <div className="flex-1">
              <span className="text-sm font-black text-white">WebXR Ready</span>
              <span className="text-sm text-[#9494AD] ml-2">— View this model in your real environment, no app needed</span>
            </div>
            <span className="text-xs font-bold text-[#7C6EF6] hidden sm:block animate-pulse">Scroll down to launch AR →</span>
          </motion.div>
        )}

        <div className="grid md:grid-cols-5 gap-8">

          {/* Left */}
          <div className="md:col-span-3 space-y-6">
            {!isXRBuild ? (
              <div className="rounded-3xl border border-[#2A2A3E] overflow-hidden bg-[#141420]">
                <Viewer modelUrl={model.modelUrl} fileType={model.fileType} fileSize={model.fileSize} title={model.title}/>
              </div>
            ) : (
              <div className="aspect-video rounded-3xl bg-gradient-to-br from-[#1A1A2E] to-[#0A0A0F] border-2 border-[#2A2A3E] flex flex-col items-center justify-center gap-3 shadow-inner">
                <span className="text-6xl filter hue-rotate-15">🥽</span>
                <p className="text-white font-black text-lg">XR Build Package</p>
                <p className="text-[#9494AD] text-sm font-medium">.zip file — download to install on your headset</p>
              </div>
            )}

            {/* WebXR AR Viewer — prominent placement */}
            {isWebXRReady && isDownloadable && (
              <div className="p-6 rounded-3xl border-2 border-[#2A2A3E] bg-[#141420] shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-black uppercase tracking-widest text-[#7C6EF6]">WebXR</span>
                  <div className="flex-1 h-px bg-[#2A2A3E]"/>
                  <span className="text-xs text-[#9494AD] font-bold">Augmented Reality</span>
                </div>
                <ARViewer modelUrl={model.modelUrl} fileType={model.fileType}/>
              </div>
            )}

            {/* Locked AR — show teaser for paid models */}
            {isWebXRReady && !isDownloadable && (
              <div className="rounded-3xl border-2 border-dashed border-[#5B4BDB]/30 bg-[#5B4BDB]/5 p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#5B4BDB]/15 border border-[#5B4BDB]/30 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-[#7C6EF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <p className="text-sm font-black text-white mb-1">WebXR AR — Purchase to unlock</p>
                <p className="text-xs text-[#9494AD] font-medium">Buy this model to place it in your real environment via WebXR</p>
              </div>
            )}

            {/* Tags */}
            {(model.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {model.tags!.map(tag => (
                  <span key={tag} className={`px-3 py-1.5 rounded-full text-[10px] uppercase font-bold border ${tag.toLowerCase() === "webxr" ? "bg-[#5B4BDB] text-white border-[#5B4BDB] shadow-[0_0_10px_rgba(91,75,219,0.3)]" : "bg-[#5B4BDB]/15 text-[#7C6EF6] border-[#5B4BDB]/30"}`}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Comments */}
            <div className="bg-[#141420] rounded-3xl border-2 border-[#2A2A3E] p-6 shadow-sm">
              <h3 className="font-black text-white mb-5 text-lg">Comments {comments.length > 0 && <span className="text-[#6B6B85] font-bold">({comments.length})</span>}</h3>
              {user ? (
                <form onSubmit={handleComment} className="flex gap-3 mb-6">
                  <input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Add a comment..."
                    className="flex-1 px-5 py-3 rounded-xl border border-[#2A2A3E] bg-[#0A0A0F] text-sm text-white focus:outline-none focus:border-[#5B4BDB] transition-colors"/>
                  <button type="submit" disabled={!commentText.trim()} className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white text-sm font-bold disabled:opacity-50 hover:bg-[#4c3ec7] shadow-[0_0_15px_rgba(91,75,219,0.3)] disabled:shadow-none transition-all">Post</button>
                </form>
              ) : (
                <Link href="/login"><p className="text-sm text-[#7C6EF6] font-bold mb-5 hover:underline cursor-pointer">Sign in to comment</p></Link>
              )}
              <div className="space-y-5 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {comments.length === 0
                  ? <p className="text-[#9494AD] text-sm text-center py-6 font-medium">No comments yet — be the first</p>
                  : comments.map(c => (
                    <div key={c.id} className="flex gap-4">
                      <div className="w-10 h-10 rounded-2xl border border-[#2A2A3E] bg-[#0A0A0F] flex items-center justify-center flex-shrink-0">
                        {c.authorPhoto ? <img src={c.authorPhoto} className="w-full h-full rounded-2xl object-cover" alt=""/> : <span className="text-[#7C6EF6] text-sm font-black">{c.authorName.charAt(0)}</span>}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white mb-0.5">{c.authorName}</p>
                        <p className="text-sm text-[#9494AD] font-medium leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          {/* Right */}
          <motion.div className="md:col-span-2 space-y-6" initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} transition={{duration:0.3}}>

            {/* Title */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-3xl font-black text-white leading-tight">{model.title}</h1>
                <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${model.isPaid?"bg-green-500/15 text-green-400 border-green-500/30":"bg-blue-500/15 text-blue-400 border-blue-500/30"}`}>{model.fileType}</span>
                  {isWebXRReady && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#5B4BDB] text-white">WebXR</span>}
                  {trendBadge && <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${trendBadge.cls}`}>{trendBadge.label}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#0A0A0F] border border-[#2A2A3E] flex items-center justify-center overflow-hidden">
                  {model.authorPhoto ? <img src={model.authorPhoto} className="w-full h-full object-cover" alt=""/> : <span className="text-[#7C6EF6] text-sm font-black">{model.authorName?.charAt(0)}</span>}
                </div>
                <span className="text-[#9494AD] text-sm font-bold">{model.authorName}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[{label:"Views",value:model.views??0,icon:"👁"},{label:"Likes",value:likeCount,icon:"❤️"},{label:"Downloads",value:model.downloads??0,icon:"⬇️"}].map(({label,value,icon})=>(
                <div key={label} className="bg-[#141420] border-2 border-[#2A2A3E] rounded-2xl p-4 text-center shadow-sm">
                  <p className="text-xl mb-1 filter hue-rotate-15">{icon}</p>
                  <p className="text-xl font-black text-white">{value.toLocaleString()}</p>
                  <p className="text-[10px] font-bold uppercase text-[#6B6B85] mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* WebXR capability card in sidebar */}
            {isWebXRReady && (
              <div className="bg-gradient-to-br from-[#141420] to-[#1A1A2E] border-2 border-[#5B4BDB]/30 rounded-3xl p-5 shadow-[0_0_20px_rgba(91,75,219,0.05)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#5B4BDB]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-[#5B4BDB] flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(91,75,219,0.4)]">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2"/></svg>
                    </div>
                    <p className="text-sm font-black text-white">WebXR Compatible</p>
                  </div>
                  <p className="text-xs text-[#9494AD] leading-relaxed mb-4 font-medium">This model can be placed in your real environment using your phone's camera — powered by the WebXR Device API.</p>
                  <div className="flex flex-wrap gap-2">
                    {["Chrome Android","Safari iOS 16+","No app needed","Hit-test placement"].map(f=>(
                      <span key={f} className="text-[9px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#5B4BDB]/15 text-[#7C6EF6] border border-[#5B4BDB]/30">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {model.description && (
              <div className="bg-[#141420] border-2 border-[#2A2A3E] rounded-3xl p-5 shadow-sm">
                <p className="text-[#9494AD] text-sm leading-relaxed font-medium">{model.description}</p>
              </div>
            )}

            {/* Build specs */}
            {isXRBuild && model.platforms && (
              <div className="bg-[#141420] border-2 border-[#2A2A3E] rounded-3xl p-5 shadow-sm space-y-4">
                <p className="font-black text-white text-sm">Build Specs</p>
                {model.genre && <div className="flex justify-between text-sm"><span className="text-[#6B6B85] font-bold">Genre</span><span className="font-bold text-white">{model.genre}</span></div>}
                {model.version && <div className="flex justify-between text-sm"><span className="text-[#6B6B85] font-bold">Version</span><span className="font-bold text-white">{model.version}</span></div>}
                {(model.platforms?.length??0)>0&&(
                  <div><p className="text-[#6B6B85] text-xs font-bold uppercase mb-2">Platforms</p>
                    <div className="flex flex-wrap gap-2">{model.platforms!.map(p=><span key={p} className="px-3 py-1 rounded border border-[#2A2A3E] bg-[#0A0A0F] text-white text-xs font-bold">{p}</span>)}</div>
                  </div>
                )}
                {model.minimumSpecs&&(
                  <div className="space-y-2 pt-3 border-t border-[#2A2A3E]">
                    {Object.entries(model.minimumSpecs).map(([k,v])=>(
                      <div key={k} className="flex justify-between text-xs"><span className="text-[#6B6B85] font-bold capitalize">{k}</span><span className="font-bold text-white">{v as string}</span></div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold">{error}</div>}

            {/* Actions */}
            <div className="space-y-4 pt-2">
              {model.isPaid && !purchased ? (
                <>
                  <button onClick={handleBuy} disabled={purchasing}
                    className="w-full py-4 rounded-xl bg-[#5B4BDB] text-white font-black hover:bg-[#4c3ec7] shadow-[0_0_20px_rgba(91,75,219,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 text-base">
                    {purchasing?"Processing...":`Buy for ₹${model.price}`}
                  </button>
                  {isWebXRReady && <p className="text-xs text-center text-[#7C6EF6] font-bold">Includes WebXR AR viewer</p>}
                  <p className="text-[10px] text-center text-[#6B6B85] font-bold uppercase tracking-wide">Secure payment via Razorpay · 15% platform fee</p>
                </>
              ) : (
                <button onClick={handleDownload}
                  className="w-full py-4 rounded-xl bg-white text-black font-black shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:bg-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Download{model.fileSize?` (${model.fileSize.toFixed(1)} MB)`:""}
                </button>
              )}
              <button onClick={handleLike} disabled={liked}
                className={`w-full py-3.5 rounded-xl text-sm font-bold border-2 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${liked?"bg-red-500/15 text-red-400 border-red-500/30 cursor-default shadow-[0_0_15px_rgba(239,68,68,0.2)]":"bg-[#141420] text-white border-[#2A2A3E] hover:border-[#5B4BDB]/50 hover:text-[#7C6EF6]"}`}>
                {liked?"❤️":"🤍"} {liked?"Liked":"Like"} · {likeCount.toLocaleString()}
              </button>
            </div>

            {/* Metadata */}
            <div className="bg-[#141420] border-2 border-[#2A2A3E] rounded-3xl p-5 space-y-3 shadow-sm">
              {[
                {label:"Category", value:model.category??"—"},
                {label:"Format", value:(model.fileType??"").toUpperCase()},
                ...(isWebXRReady?[{label:"WebXR", value:"AR Ready ✓"}]:[]),
                ...(model.fileSize?[{label:"File size", value:`${model.fileSize.toFixed(1)} MB`}]:[]),
                {label:"Storage", value:model.storageProvider==="r2"?"Cloudflare R2":"Supabase"},
              ].map(({label,value})=>(
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-[#6B6B85] font-bold uppercase tracking-wide">{label}</span>
                  <span className={`font-black ${label==="WebXR"?"text-[#7C6EF6]":"text-white"}`}>{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}