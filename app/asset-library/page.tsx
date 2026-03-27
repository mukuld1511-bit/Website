"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { uploadToSupabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Footer from "../components/Footer";

const UNITY_CATEGORIES = ["Character", "Environment", "VFX", "Shader", "Tool", "UI", "Audio", "Animation", "Physics", "Complete Project", "Other"];
const UNITY_EXTENSIONS = ["unitypackage", "zip"];

interface UnityAsset {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  thumbnailUrl: string;
  unityVersion: string;
  fileSize: number;
  isPaid: boolean;
  price: number;
  authorName: string;
  authorPhoto: string;
  tags: string[];
  downloads: number;
  uploadedAt: any;
}

export default function AssetLibrary() {
  const [user, setUser] = useState<any>(null);
  const [assets, setAssets] = useState<UnityAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [unityVersion, setUnityVersion] = useState("2022.3 LTS");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(query(collection(db, "unityAssets"), orderBy("uploadedAt", "desc")));
      setAssets(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UnityAsset)));
      setLoading(false);
    };
    load();
  }, [success]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!UNITY_EXTENSIONS.includes(ext ?? "")) {
      setError("Only .unitypackage or .zip files are allowed");
      return;
    }
    if (f.size > 2 * 1024 * 1024 * 1024) {
      setError("File must be smaller than 2GB");
      return;
    }
    setFile(f);
    setError("");
  };

  const handleThumbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    if (f.size > 5 * 1024 * 1024) { setError("Thumbnail must be < 5MB"); return; }
    setThumbnail(f);
    const reader = new FileReader();
    reader.onload = (ev) => setThumbPreview(ev.target?.result as string ?? "");
    reader.readAsDataURL(f);
    setError("");
  };

  const handlePublish = async () => {
    if (!file || !title || !category) { setError("Fill all required fields."); return; }
    if (!user) { setError("Sign in to publish."); return; }
    setUploading(true); setError("");

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const filePath = `${user.uid}/${Date.now()}_${safeName}`;
      const fileUrl = await uploadToSupabase("models", filePath, file, setUploadProgress);
      setUploadProgress(60);

      let finalThumb = "";
      if (thumbnail) {
        const safeThumb = thumbnail.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const thumbPath = `${user.uid}/${Date.now()}_thumb_${safeThumb}`;
        finalThumb = await uploadToSupabase("thumbnails", thumbPath, thumbnail);
      }
      setUploadProgress(80);

      const { doc: dbDoc, getDoc } = await import("firebase/firestore");
      const userSnap = await getDoc(dbDoc(db, "users", user.uid));
      const userData = userSnap.exists() ? userSnap.data() : {};

      await addDoc(collection(db, "unityAssets"), {
        title, description, category, unityVersion, tags,
        isPaid, price: isPaid ? price : 0,
        fileUrl, thumbnailUrl: finalThumb,
        fileSize: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        authorId: user.uid,
        authorName: userData.displayName || user.email,
        authorPhoto: userData.photoURL || "",
        downloads: 0,
        uploadedAt: serverTimestamp(),
      });

      setUploadProgress(100);
      setSuccess(true);
      setShowUpload(false);
      // Reset
      setFile(null); setThumbnail(null); setThumbPreview(""); setTitle(""); setDescription("");
      setCategory(""); setTags([]); setTagInput(""); setIsPaid(false); setPrice(0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const visible = assets.filter((a) => {
    const matchSearch = a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = catFilter === "All" || a.category === catFilter;
    return matchSearch && matchCat;
  });

  const inputCls = "w-full bg-white border-2 border-indigo-100 text-gray-900 placeholder-gray-400 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition shadow-sm text-sm font-medium";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex flex-col font-sans">
      {/* Blobs */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-indigo-200/30 rounded-full filter blur-3xl opacity-40 pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-violet-200/30 rounded-full filter blur-3xl opacity-40 pointer-events-none z-0" />

      {/* Success toast */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white font-black px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
            Asset published successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 relative z-10 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-200 bg-violet-50 mb-4 shadow-sm">
                <span className="text-violet-600 text-xs font-black uppercase tracking-widest">🎮 Unity Asset Library</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 leading-tight mb-2">
                Unity Assets
              </h1>
              <p className="text-gray-500 font-medium">Download free & premium Unity packages shared by the SYNTHÉ community.</p>
            </div>
            {user ? (
              <button onClick={() => setShowUpload((v) => !v)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all border-b-4 border-indigo-800 active:border-b-0 active:translate-y-0.5 whitespace-nowrap">
                {showUpload ? "✕ Cancel" : "+ Upload Asset"}
              </button>
            ) : (
              <Link href="/login"><button className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black shadow-lg">Sign in to Upload</button></Link>
            )}
          </div>

          {/* ── UPLOAD FORM ── */}
          <AnimatePresence>
            {showUpload && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mb-10 rounded-[2rem] border-4 border-indigo-100 bg-white/90 shadow-2xl p-8 overflow-hidden">
                <h2 className="text-2xl font-black text-gray-900 mb-6">Upload Unity Asset</h2>

                {error && (
                  <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold">{error}</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Package file drop */}
                  <div onClick={() => document.getElementById("pkg-input")?.click()}
                    className="group col-span-1 border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition min-h-[140px] flex flex-col items-center justify-center">
                    <input id="pkg-input" type="file" className="hidden" accept=".unitypackage,.zip" onChange={handleFileSelect}/>
                    <div className="text-3xl mb-2">{file ? "📦" : "⬆️"}</div>
                    <p className="font-black text-sm text-gray-900">{file ? file.name : "Click to upload .unitypackage or .zip"}</p>
                    {file && <p className="text-xs text-gray-400 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
                    {!file && <p className="text-xs text-gray-400 mt-1">Max 2GB</p>}
                  </div>

                  {/* Thumbnail */}
                  <div onClick={() => document.getElementById("thumb-input")?.click()}
                    className="group col-span-1 border-2 border-dashed border-indigo-200 rounded-2xl p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition min-h-[140px] flex flex-col items-center justify-center overflow-hidden relative">
                    <input id="thumb-input" type="file" className="hidden" accept="image/*" onChange={handleThumbSelect}/>
                    {thumbPreview ? (
                      <img src={thumbPreview} className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-80" alt="thumb"/>
                    ) : null}
                    <div className="relative z-10 text-3xl mb-2">{thumbPreview ? "🖼️" : "📸"}</div>
                    <p className="relative z-10 font-black text-sm text-gray-900">{thumbPreview ? "Change thumbnail" : "Upload thumbnail"}</p>
                    {!thumbPreview && <p className="relative z-10 text-xs text-gray-400 mt-1">JPG, PNG, WEBP (max 5MB)</p>}
                  </div>

                  {/* Title */}
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-2">Title *</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Low Poly Forest Pack" className={inputCls}/>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-2">Category *</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                      <option value="">Select category</option>
                      {UNITY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Unity Version */}
                  <div>
                    <label className="block text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-2">Minimum Unity Version</label>
                    <input value={unityVersion} onChange={(e) => setUnityVersion(e.target.value)} placeholder="e.g. 2022.3 LTS" className={inputCls}/>
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="block text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-2">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What's included in this package?"
                      className={inputCls + " resize-none"}/>
                  </div>

                  {/* Tags */}
                  <div className="col-span-2">
                    <label className="block text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-2">Tags</label>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {tags.map((t) => (
                        <span key={t} onClick={() => setTags(tags.filter((x) => x !== t))}
                          className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-700 cursor-pointer hover:bg-red-100 hover:text-red-600 transition">
                          {t} ✕
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => { if (e.key === "Enter" && tagInput.trim()) { setTags([...tags, tagInput.trim()]); setTagInput(""); }}}
                        placeholder="Add tags (press Enter)" className={inputCls + " flex-1"}/>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer" onClick={() => setIsPaid(!isPaid)}>
                      <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} className="w-5 h-5" onClick={(e) => e.stopPropagation()}/>
                      <span className="font-bold text-gray-900">Monetize this asset (Razorpay)</span>
                    </div>
                    {isPaid && (
                      <div className="mt-3 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                        <input type="number" value={price || ""} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                          placeholder="299" className={inputCls + " pl-8"}/>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {uploading && (
                  <div className="mt-6">
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div animate={{ width: `${uploadProgress}%` }} className="h-full bg-indigo-500 rounded-full"/>
                    </div>
                    <p className="text-xs text-gray-500 font-bold text-right mt-1">{uploadProgress}% uploaded</p>
                  </div>
                )}

                <div className="flex gap-4 justify-end mt-8 border-t border-gray-100 pt-6">
                  <button onClick={() => setShowUpload(false)} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition">Cancel</button>
                  <button onClick={handlePublish} disabled={uploading}
                    className="px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black shadow-md disabled:opacity-50 border-b-4 border-indigo-800 hover:-translate-y-0.5 transition-all">
                    {uploading ? "Publishing..." : "Publish Asset"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SEARCH & FILTER ── */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4 bg-white/80 p-4 rounded-2xl border border-indigo-100 shadow-sm">
            <input placeholder="Search assets or tags..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"/>
            <div className="flex gap-2 flex-wrap">
              {["All", ...UNITY_CATEGORIES.slice(0, 5)].map((c) => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className={`px-3 py-2 rounded-xl text-xs font-black border transition whitespace-nowrap ${catFilter === c ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* ── ASSET GRID ── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-100"/>
                  <div className="p-4 flex flex-col gap-3">
                    <div className="h-4 bg-gray-100 rounded-full w-2/3"/>
                    <div className="h-3 bg-gray-50 rounded-full w-1/2"/>
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-24 flex flex-col items-center gap-4">
              <div className="text-5xl">📦</div>
              <p className="text-gray-900 font-black text-xl">No assets found</p>
              <p className="text-gray-500 text-sm">Be the first to upload a Unity package!</p>
              {user && (
                <button onClick={() => setShowUpload(true)}
                  className="mt-4 px-6 py-3 rounded-xl bg-indigo-600 text-white font-black shadow-md">
                  Upload Asset
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visible.map((asset, i) => (
                <motion.div key={asset.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="rounded-[1.5rem] border-2 border-indigo-50 bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col">
                  <div className="h-40 bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center relative overflow-hidden">
                    {asset.thumbnailUrl
                      ? <img src={asset.thumbnailUrl} className="w-full h-full object-cover" alt={asset.title}/>
                      : <span className="text-5xl">🎮</span>}
                    {asset.isPaid && (
                      <span className="absolute top-3 right-3 bg-green-500 text-white font-black text-[10px] px-2 py-1 rounded-lg">₹{asset.price}</span>
                    )}
                    {!asset.isPaid && (
                      <span className="absolute top-3 right-3 bg-blue-500 text-white font-black text-[10px] px-2 py-1 rounded-lg">FREE</span>
                    )}
                  </div>
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <div>
                      <p className="font-black text-gray-900 text-base leading-tight mb-1">{asset.title}</p>
                      <p className="text-gray-500 text-xs font-medium line-clamp-2">{asset.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{asset.category}</span>
                      {asset.unityVersion && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Unity {asset.unityVersion}+</span>}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 font-bold mt-auto pt-3 border-t border-gray-100">
                      <span>📥 {asset.downloads || 0} downloads</span>
                      <span>{asset.fileSize?.toFixed(1)} MB</span>
                    </div>
                    <a href={asset.fileUrl} target="_blank" rel="noreferrer"
                      className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-sm shadow hover:shadow-md hover:-translate-y-0.5 transition-all">
                      {asset.isPaid ? `Buy ₹${asset.price}` : "Download Free"}
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer/>
    </div>
  );
}
