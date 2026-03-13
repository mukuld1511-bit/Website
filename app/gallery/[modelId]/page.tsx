"use client";

import { useEffect, useState } from "react";
import {
  doc, getDoc, updateDoc, increment,
  collection, addDoc, getDocs, query,
  orderBy, serverTimestamp, where,
  setDoc, deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { initiatePayment } from "../../../lib/razorpay";
import { useEffect as useViewerEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { OBJLoader } from "three-stdlib";
import { OrbitControls } from "three-stdlib";

// ── Commission ────────────────────────────────────────────────────────────────
const PLATFORM_FEE = 0.15;
const RAZORPAY_FEE = 0.02;
const DIVISOR      = 0.83;
function getBuyerPrice(x: number)  { return Math.ceil(x / DIVISOR); }
function getPlatformFee(x: number) { return Math.ceil(x * PLATFORM_FEE); }
function getRazorpayFee(x: number) { return Math.ceil(x * RAZORPAY_FEE); }
// ── Types ─────────────────────────────────────────────────────────────────────
interface Model {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  fileType: string;
  modelUrl: string;
  thumbnailUrl: string;
  isPaid: boolean;
  price: number;
  displayPrice?: number;
  platformFee?: number;
  accessType: "free" | "request" | "purchase";
  authorId: string;
  authorName: string;
  authorPhoto: string;
  views: number;
  likes: number;
  downloads: number;
  polygons?: string;
  uploadedAt: any;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  createdAt: any;
}

const FILE_COLORS: Record<string, string> = {
  glb: "#a78bfa", gltf: "#a78bfa",
  obj: "#22d3ee", fbx: "#22d3ee",
  dwg: "#fbbf24", dxf: "#fbbf24",
};

function timeAgo(ts: any): string {
  if (!ts) return "";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── 3D Viewer ─────────────────────────────────────────────────────────────────
function ModelViewer({ modelUrl, fileType }: { modelUrl: string; fileType: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const isCad = ["dwg","dxf"].includes(fileType?.toLowerCase());

  useViewerEffect(() => {
    if (!mountRef.current || !modelUrl || isCad) return;
    const container = mountRef.current;
    const W = container.clientWidth;
    const H = container.clientHeight;
    const scene    = new THREE.Scene();
    scene.background = new THREE.Color(0x050008);
    const camera   = new THREE.PerspectiveCamera(60, W / H, 0.01, 1000);
    camera.position.set(0, 1.5, 4);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 8, 5); dir.castShadow = true; scene.add(dir);
    const v = new THREE.PointLight(0xa78bfa, 1.5, 20); v.position.set(-4,3,-2); scene.add(v);
    const c = new THREE.PointLight(0x22d3ee, 1.0, 20); c.position.set(4,-2,3); scene.add(c);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.05;
    controls.minDistance = 0.5; controls.maxDistance = 50;
    const ext = fileType?.toLowerCase();
    function centerModel(model: THREE.Object3D) {
      const box  = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const ctr  = box.getCenter(new THREE.Vector3());
      const maxD = Math.max(size.x, size.y, size.z);
      const scale = 3 / maxD;
      model.scale.setScalar(scale);
      model.position.sub(ctr.multiplyScalar(scale));
      camera.position.set(0, size.y * scale * 0.5, maxD * scale * 1.8);
      controls.target.set(0,0,0); controls.update();
      setIsLoading(false);
    }
    if (ext === "glb" || ext === "gltf") {
      new GLTFLoader().load(modelUrl, (gltf) => { scene.add(gltf.scene); centerModel(gltf.scene); },
        undefined, () => { setIsLoading(false); setLoadError(true); });
    } else if (ext === "obj") {
      new OBJLoader().load(modelUrl, (obj) => {
        const mat = new THREE.MeshStandardMaterial({ color: 0xa78bfa, roughness: 0.5, metalness: 0.3 });
        obj.traverse(c => { if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).material = mat; });
        scene.add(obj); centerModel(obj);
      }, undefined, () => { setIsLoading(false); setLoadError(true); });
    } else { setIsLoading(false); }
    let raf: number;
    const animate = () => { raf = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
    animate();
    const onResize = () => {
      const w = container.clientWidth; const h = container.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf); controls.dispose(); renderer.dispose();
      window.removeEventListener("resize", onResize);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [modelUrl, fileType]);

  if (isCad) return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4"
      style={{ background:"linear-gradient(135deg,rgba(251,191,36,0.06),rgba(0,0,0,0))" }}>
      <svg className="w-16 h-16 text-amber-400/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
      <p className="text-amber-400/60 text-sm font-bold">{fileType?.toUpperCase()} Drawing</p>
      <p className="text-white/25 text-xs">In-browser preview not available for CAD files</p>
    </div>
  );

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#050008]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
            <p className="text-white/30 text-xs font-semibold">Loading model…</p>
          </div>
        </div>
      )}
      {loadError && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#050008]">
          <svg className="w-12 h-12 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-white/25 text-sm">Preview unavailable</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ModelDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const modelId = params?.modelId as string;

  const [isMounted,   setIsMounted]   = useState(false);

  const [model,       setModel]       = useState<Model | null>(null);
  const [user,        setUser]        = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [hasAccess,   setHasAccess]   = useState(false);
  const [comments,    setComments]    = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commenting,  setCommenting]  = useState(false);
  const [liked,       setLiked]       = useState(false);
  const [likeCount,   setLikeCount]   = useState(0);
  const [paying,      setPaying]      = useState(false);
  const [requesting,  setRequesting]  = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [useCase,     setUseCase]     = useState("");
  const [toast,       setToast]       = useState("");
  const [activeTab,   setActiveTab]   = useState<"details"|"comments">("details");

  useEffect(() => {
    setIsMounted(true);
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!modelId) return;
    async function loadModel() {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "models", modelId));
        if (!snap.exists()) { setLoading(false); return; }
        const data = { id: snap.id, ...snap.data() } as Model;
        setModel(data);
        setLikeCount(data.likes ?? 0);
        await updateDoc(doc(db, "models", modelId), { views: increment(1) });
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    loadModel();
  }, [modelId]);

  // Check if current user has already liked this model
  useEffect(() => {
    if (!user || !modelId) return;
    async function checkLike() {
      try {
        const likeRef = doc(db, "models", modelId, "likes", user.uid);
        const likeSnap = await getDoc(likeRef);
        setLiked(likeSnap.exists());
      } catch(e) { /* ignore */ }
    }
    checkLike();
  }, [user, modelId]);

  useEffect(() => {
    if (!model || !user) return;
    async function checkAccess() {
      if (!model!.isPaid || model!.accessType === "free") { setHasAccess(true); return; }
      try {
        const q = query(collection(db,"purchases"), where("modelId","==",modelId), where("userId","==",user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) { setHasAccess(true); return; }
        if (model!.accessType === "request") {
          const rq = query(collection(db,"accessRequests"), where("modelId","==",modelId), where("userId","==",user.uid), where("status","==","approved"));
          const rSnap = await getDocs(rq);
          if (!rSnap.empty) setHasAccess(true);
        }
      } catch(e) { console.error(e); }
    }
    checkAccess();
  }, [model, user]);

  useEffect(() => {
    if (!modelId) return;
    async function loadComments() {
      try {
        const snap = await getDocs(query(collection(db,"models",modelId,"comments"), orderBy("createdAt","desc")));
        setComments(snap.docs.map(d => ({ id:d.id, ...d.data() } as Comment)));
      } catch(e) { console.error(e); }
    }
    loadComments();
  }, [modelId]);

  async function handleLike() {
    if (!user) { router.push("/login"); return; }
    const likeRef = doc(db, "models", modelId, "likes", user.uid);
    if (liked) {
      // Unlike
      setLiked(false);
      setLikeCount(n => Math.max(0, n - 1));
      await deleteDoc(likeRef);
      await updateDoc(doc(db, "models", modelId), { likes: increment(-1) });
    } else {
      // Like (only once per user)
      setLiked(true);
      setLikeCount(n => n + 1);
      await setDoc(likeRef, { userId: user.uid, createdAt: serverTimestamp() });
      await updateDoc(doc(db, "models", modelId), { likes: increment(1) });
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    setCommenting(true);
    try {
      const newComment = {
        userId: user.uid, userName: user.displayName ?? "User",
        userPhoto: user.photoURL ?? "", text: commentText.trim(), createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db,"models",modelId,"comments"), newComment);
      setComments(p => [{ id:ref.id, ...newComment, createdAt:{ seconds: Date.now()/1000 } }, ...p]);
      setCommentText("");
    } catch(e) { console.error(e); }
    setCommenting(false);
  }

  async function handleDownload() {
    if (!model) return;
    if (model.isPaid && !hasAccess) { showToast("Purchase required to download."); return; }
    try {
      // Inject fl_attachment into the Cloudinary URL so the browser downloads
      // the file directly instead of opening it (no CORS fetch needed)
      let downloadUrl = model.modelUrl;
      if (downloadUrl.includes("cloudinary.com")) {
        downloadUrl = downloadUrl.replace("/upload/", "/upload/fl_attachment/");
      }
      const ext      = downloadUrl.split("?")[0].split(".").pop() ?? "glb";
      const filename = (model.title || "model").replace(/\s+/g, "_") + "." + ext;
      const a        = document.createElement("a");
      a.href         = downloadUrl;
      a.download     = filename;
      a.target       = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      await updateDoc(doc(db, "models", modelId), { downloads: increment(1) });
      showToast("Download started!");
    } catch (e) {
      console.error(e);
      showToast("Download failed. Try again.");
    }
  }

  async function handlePurchase() {
    if (!user) { router.push("/login"); return; }
    if (!model) return;
    setPaying(true);
    try {
      const buyerPrice  = model.displayPrice ?? getBuyerPrice(model.price);
      const buyerAmount = buyerPrice * 100;

      const res = await fetch("/api/create-order", {
        method:  "POST",
        headers: { "Content-Type":"application/json" },
        body:    JSON.stringify({ amount: buyerAmount, modelId }),
      });
      const { id: orderId } = await res.json();

      initiatePayment({
        orderId,
        amount:      buyerAmount,
        currency:    "INR",
        description: model.title,
        prefill:     { name: user.displayName ?? "", email: user.email ?? "" },
        onSuccess: async (data: any) => {
          await addDoc(collection(db,"purchases"), {
            modelId,
            userId:              user.uid,
            userEmail:           user.email,
            amount:              buyerPrice,
            sellerAmount:        model.price,
            platformFee:         getPlatformFee(model.price),
            razorpayFee:         getRazorpayFee(model.price),
            status:              "completed",
            razorpay_payment_id: data.razorpay_payment_id,
            createdAt:           serverTimestamp(),
          });
          setHasAccess(true);
          showToast("Purchase successful! 🎉");
          setPaying(false);
        },
        onFailure: () => { showToast("Payment cancelled."); setPaying(false); },
      });
    } catch(e) {
      console.error(e);
      showToast("Payment failed. Try again.");
      setPaying(false);
    }
  }

  async function handleRequestAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { router.push("/login"); return; }
    if (!model || !useCase.trim()) return;
    try {
      await addDoc(collection(db,"accessRequests"), {
        modelId: modelId, userId: user.uid, userEmail: user.email,
        authorId: model.authorId, useCase: useCase.trim(),
        status: "pending", requestedAt: serverTimestamp(),
      });
      setRequestSent(true); setRequesting(false);
      showToast("Access request sent!");
    } catch(e) { console.error(e); }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  const ext        = model?.fileType?.toLowerCase() ?? "glb";
  const badgeColor = FILE_COLORS[ext] ?? "#a78bfa";
  const buyerPrice = model ? (model.displayPrice ?? getBuyerPrice(model.price)) : 0;

  if (loading) return (
    <div className="min-h-screen bg-[#050008] flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
    </div>
  );

  if (!model) return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-3xl font-black text-white mb-3">Model not found</h2>
          <Link href="/gallery">
            <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
              style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
              className="inline-flex px-6 py-3 rounded-2xl text-white font-black text-sm cursor-pointer mt-4">
              ← Back to Gallery
            </motion.div>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  const canDownload = !model.isPaid || hasAccess;

  return (
    <div className="min-h-screen bg-[#050008]">
      <Navbar />

      <div className="relative pt-24 pb-20 px-4 overflow-x-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
          style={{ background:`radial-gradient(ellipse,${badgeColor}12 0%,transparent 70%)`, filter:"blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.018] pointer-events-none"
          style={{ backgroundImage:"linear-gradient(rgba(167,139,250,1) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,1) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />

        <div className="relative z-10 max-w-7xl mx-auto">

          {/* Breadcrumb */}
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
            className="flex items-center gap-2 mb-6 text-white/30 text-xs font-semibold">
            <Link href="/gallery" className="hover:text-white/60 transition duration-150">Gallery</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white/60">{model.title}</span>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Left: Viewer ── */}
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
                className="relative rounded-3xl border border-white/8 bg-white/[0.02] overflow-hidden" style={{ height:520 }}>
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background:`linear-gradient(90deg,transparent,${badgeColor}40,transparent)` }} />
                {model.modelUrl ? (
                  isMounted && <ModelViewer modelUrl={model.modelUrl} fileType={model.fileType} />
                ) : model.thumbnailUrl ? (
                  <img src={model.thumbnailUrl} alt={model.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-white/8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
                {model.modelUrl && !["dwg","dxf"].includes(ext) && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-black/50 border border-white/8 backdrop-blur-sm text-white/30 text-[10px] font-semibold">
                    Drag to rotate · Scroll to zoom · Right-click to pan
                  </div>
                )}
              </motion.div>

              {/* Tabs */}
              <div className="flex gap-1 mt-5 border-b border-white/6">
                {(["details","comments"] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest transition duration-200 border-b-2 ${
                      activeTab===t ? "border-violet-500 text-violet-300" : "border-transparent text-white/30 hover:text-white/60"
                    }`}>
                    {t === "comments" ? `Comments (${comments.length})` : "Details"}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "details" && (
                  <motion.div key="details" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}
                    className="mt-6 space-y-5">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label:"Views",     val: model.views ?? 0,     icon:"M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
                        { label:"Downloads", val: model.downloads ?? 0, icon:"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" },
                        { label:"Likes",     val: likeCount,            icon:"M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
                      ].map((s,i) => (
                        <div key={i} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                          <svg className="w-4 h-4 text-white/25 mx-auto mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                          </svg>
                          <p className="text-white font-black text-lg">{s.val.toLocaleString()}</p>
                          <p className="text-white/25 text-[10px] uppercase tracking-widest">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    {model.description && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/25 mb-2">Description</p>
                        <p className="text-white/50 text-sm leading-relaxed">{model.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label:"File Format", val: model.fileType?.toUpperCase() },
                        { label:"Category",    val: model.category },
                        { label:"Polygons",    val: model.polygons || "N/A" },
                        { label:"Uploaded",    val: timeAgo(model.uploadedAt) },
                      ].map((m,i) => (
                        <div key={i} className="p-3 rounded-xl border border-white/5 bg-white/[0.015]">
                          <p className="text-white/25 text-[9px] font-black uppercase tracking-widest mb-1">{m.label}</p>
                          <p className="text-white/70 text-xs font-bold">{m.val}</p>
                        </div>
                      ))}
                    </div>
                    {model.tags?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/25 mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {model.tags.map(t => (
                            <span key={t} className="px-3 py-1 rounded-xl border border-white/8 bg-white/[0.03] text-white/45 text-xs font-bold">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "comments" && (
                  <motion.div key="comments" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}
                    className="mt-6">
                    {user ? (
                      <form onSubmit={handleComment} className="flex gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white/[0.05] flex-shrink-0 flex items-center justify-center">
                          {user.photoURL
                            ? <img src={user.photoURL} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                            : <span className="text-white/30 text-[9px] font-black">{user.displayName?.[0]}</span>}
                        </div>
                        <div className="flex-1 flex gap-2">
                          <input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Add a comment…"
                            className="flex-1 bg-white/[0.03] border border-white/8 text-white placeholder-white/25 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition duration-200" />
                          <motion.button type="submit" disabled={!commentText.trim() || commenting}
                            whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                            style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                            className="px-4 py-2.5 rounded-xl font-black text-white text-xs disabled:opacity-40 flex-shrink-0">
                            {commenting ? "…" : "Post"}
                          </motion.button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-4 rounded-2xl border border-white/6 bg-white/[0.02] text-center mb-6">
                        <p className="text-white/30 text-sm mb-3">Sign in to comment</p>
                        <Link href="/login">
                          <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                            style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                            className="inline-flex px-5 py-2 rounded-xl text-white text-xs font-black cursor-pointer">
                            Sign In →
                          </motion.div>
                        </Link>
                      </div>
                    )}
                    {comments.length === 0 ? (
                      <div className="text-center py-12 text-white/20 text-sm">No comments yet. Be the first!</div>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((c,i) => (
                          <motion.div key={c.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                            className="flex gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white/[0.05] flex-shrink-0 flex items-center justify-center">
                              {c.userPhoto
                                ? <img src={c.userPhoto} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                                : <span className="text-white/30 text-[9px] font-black">{c.userName?.[0]}</span>}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white/70 text-xs font-black">{c.userName}</span>
                                <span className="text-white/20 text-[10px]">{timeAgo(c.createdAt)}</span>
                              </div>
                              <p className="text-white/50 text-sm leading-relaxed">{c.text}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Right: Info + CTA ── */}
            <div className="lg:col-span-1 space-y-5">

              {/* Title card */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.1 }}
                className="relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl overflow-hidden p-6">
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background:`linear-gradient(90deg,transparent,${badgeColor}40,transparent)` }} />
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span className="px-2.5 py-1 rounded-lg border text-[10px] font-black"
                    style={{ color:badgeColor, background:`${badgeColor}18`, borderColor:`${badgeColor}35` }}>
                    {ext.toUpperCase()}
                  </span>
                  {model.isPaid ? (
                    <span className="px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 text-[10px] font-black">
                      ₹{buyerPrice}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.04] text-white/50 text-[10px] font-black">Free</span>
                  )}
                  {model.category && (
                    <span className="px-2.5 py-1 rounded-lg border border-violet-500/20 bg-violet-500/8 text-violet-300 text-[10px] font-black">{model.category}</span>
                  )}
                </div>
                <h1 className="text-2xl font-black text-white leading-snug mb-4">{model.title}</h1>
                <Link href={`/developer/${model.authorId}`}>
                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-white/6 hover:border-white/14 transition duration-200 cursor-pointer group">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                      {model.authorPhoto
                        ? <img src={model.authorPhoto} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                        : <span className="text-white/30 text-xs font-black">{model.authorName?.[0]}</span>}
                    </div>
                    <div>
                      <p className="text-white/70 text-sm font-black group-hover:text-white transition duration-150">{model.authorName}</p>
                      <p className="text-white/25 text-xs">View Profile →</p>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* CTA card */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.15 }}
                className="relative rounded-3xl border border-white/6 bg-white/[0.025] backdrop-blur-xl overflow-hidden p-6 space-y-3">
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.3),transparent)" }} />

                {model.isPaid && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold ${
                    hasAccess ? "border border-emerald-500/20 bg-emerald-500/8 text-emerald-300" : "border border-white/6 bg-white/[0.02] text-white/30"
                  }`}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={hasAccess
                        ? "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                        : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"} />
                    </svg>
                    {hasAccess ? "You have access" : "Purchase required"}
                  </div>
                )}

                {canDownload ? (
                  <motion.button onClick={handleDownload}
                    whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                    style={{ willChange:"transform", background:"linear-gradient(135deg,#059669,#0891b2)" }}
                    className="w-full py-4 rounded-2xl font-black text-white text-sm relative overflow-hidden">
                    <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                      style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download {model.fileType?.toUpperCase()}
                    </span>
                  </motion.button>
                ) : model.accessType === "purchase" ? (
                  <>
                    {/* Commission breakdown */}
                    <div className="relative p-4 rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden space-y-2.5">
                      <div className="absolute top-0 left-0 right-0 h-[1px]"
                        style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.3),transparent)" }} />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">Price Breakdown</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-violet-400/60 inline-block" />Seller price
                        </span>
                        <span className="text-white/50 font-bold">₹{model.price}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400/60 inline-block" />Platform + Razorpay
                        </span>
                        <span className="text-white/40">₹{buyerPrice - model.price}</span>
                      </div>
                      <div className="h-[1px] bg-white/6" />
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70 font-black">You pay</span>
                        <span className="text-white font-black text-base">₹{buyerPrice}</span>
                      </div>
                    </div>
                    <motion.button onClick={handlePurchase} disabled={paying}
                      whileHover={{ scale:paying?1:1.02 }} whileTap={{ scale:paying?1:0.98 }}
                      style={{ willChange:"transform", background:paying?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                      className="w-full py-4 rounded-2xl font-black text-white text-sm relative overflow-hidden disabled:opacity-50">
                      {!paying && <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                        style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />}
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {paying ? (
                          <><svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Processing…</>
                        ) : (
                          <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>Buy for ₹{buyerPrice}</>
                        )}
                      </span>
                    </motion.button>
                  </>
                ) : requestSent ? (
                  <div className="w-full py-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 text-emerald-300 font-black text-sm text-center">
                    ✓ Request Sent — Awaiting Approval
                  </div>
                ) : (
                  <motion.button onClick={() => setRequesting(true)}
                    whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                    style={{ willChange:"transform", background:"linear-gradient(135deg,#d97706,#7c3aed)" }}
                    className="w-full py-4 rounded-2xl font-black text-white text-sm relative overflow-hidden">
                    <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2.5, repeat:Infinity, repeatDelay:4, ease:"linear" }}
                      style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Request Access
                    </span>
                  </motion.button>
                )}

                <motion.button onClick={handleLike}
                  whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} style={{ willChange:"transform" }}
                  className={`w-full py-3 rounded-2xl font-bold text-sm border flex items-center justify-center gap-2 transition duration-200 ${
                    liked ? "border-rose-500/40 bg-rose-500/12 text-rose-300" : "border-white/8 bg-white/[0.02] text-white/40 hover:border-rose-500/25 hover:text-rose-300/70"
                  }`}>
                  <svg className="w-4 h-4" fill={liked?"currentColor":"none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {liked ? "Liked" : "Like"} · {likeCount}
                </motion.button>

                {model.isPaid && (
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <svg className="w-3 h-3 text-emerald-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-white/20 text-[10px]">Secure payment via Razorpay</span>
                  </div>
                )}
              </motion.div>

              {/* Share */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.2 }}
                className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); showToast("Link copied!"); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/8 hover:border-white/16 text-white/40 hover:text-white/70 text-xs font-bold transition duration-200">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </button>
                <Link href="/gallery" className="flex-1">
                  <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/8 hover:border-white/16 text-white/40 hover:text-white/70 text-xs font-bold transition duration-200 cursor-pointer h-full">
                    ← Back
                  </div>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Access Modal */}
      <AnimatePresence>
        {requesting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setRequesting(false)} />
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              transition={{ duration:0.3 }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0012] backdrop-blur-xl p-8">
              <div className="absolute top-0 left-0 right-0 h-[1px]"
                style={{ background:"linear-gradient(90deg,transparent,rgba(251,191,36,0.5),rgba(167,139,250,0.3),transparent)" }} />
              <h3 className="text-xl font-black text-white mb-2">Request Access</h3>
              <p className="text-white/35 text-sm mb-5 line-clamp-1">{model.title}</p>
              <form onSubmit={handleRequestAccess} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.25em] text-white/30 mb-2">How will you use this? *</label>
                  <textarea value={useCase} onChange={e=>setUseCase(e.target.value)} rows={4} required
                    placeholder="Describe your use case and why you need access to this model…"
                    className="w-full bg-white/[0.04] border border-white/8 text-white placeholder-white/25 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition duration-200 resize-none" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setRequesting(false)}
                    className="flex-1 py-3 rounded-xl border border-white/8 text-white/40 text-sm font-bold hover:border-white/15 transition duration-200">
                    Cancel
                  </button>
                  <motion.button type="submit"
                    whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                    style={{ willChange:"transform", background:"linear-gradient(135deg,#d97706,#7c3aed)" }}
                    className="flex-1 py-3 rounded-xl font-black text-white text-sm">
                    Send Request →
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:20, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:20, scale:0.95 }}
            transition={{ duration:0.3 }}
            className="fixed bottom-6 right-6 z-50 px-6 py-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 backdrop-blur-xl text-emerald-300 text-sm font-bold shadow-[0_8px_32px_rgba(52,211,153,0.2)]">
            ✓ {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}