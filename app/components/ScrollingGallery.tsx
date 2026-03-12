"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Link from "next/link";

interface Model {
  id: string;
  title: string;
  thumbnailUrl: string;
  fileType: string;
  isPaid: boolean;
  price: number;
  authorName: string;
  likes: number;
  views: number;
}

const FILE_COLORS: Record<string, string> = {
  glb:"#a78bfa", gltf:"#a78bfa",
  obj:"#22d3ee", fbx:"#22d3ee",
  dwg:"#fbbf24", dxf:"#fbbf24",
};

function MarqueeRow({ items, reverse = false }: { items: Model[]; reverse?: boolean }) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex gap-4"
        animate={{ x: reverse ? ["0%","50%"] : ["0%","-50%"] }}
        transition={{ duration: items.length * 4, repeat:Infinity, ease:"linear" }}
        style={{ willChange:"transform", width:"max-content" }}
      >
        {doubled.map((m,i) => {
          const ext   = m.fileType?.toLowerCase() ?? "glb";
          const color = FILE_COLORS[ext] ?? "#a78bfa";
          return (
            <Link key={`${m.id}-${i}`} href={`/gallery/${m.id}`}>
              <motion.div
                whileHover={{ y:-4, scale:1.02 }}
                transition={{ type:"spring", stiffness:400, damping:25 }}
                style={{ willChange:"transform", width:220, flexShrink:0 }}
                className="relative rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden cursor-pointer hover:border-white/16 transition duration-300 group"
              >
                {/* Thumbnail */}
                <div className="relative h-36 overflow-hidden"
                  style={{ background:`linear-gradient(135deg,${color}18,rgba(0,0,0,0.4))` }}>
                  {m.thumbnailUrl ? (
                    <img src={m.thumbnailUrl} alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-10 h-10 opacity-20" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase"
                    style={{ background:`${color}25`, border:`1px solid ${color}40`, color }}>
                    {ext.toUpperCase()}
                  </div>
                  <div className="absolute top-2 right-2">
                    {m.isPaid ? (
                      <div className="px-2 py-0.5 rounded-md text-[9px] font-black border border-emerald-500/40 bg-emerald-500/20 text-emerald-300">
                        ₹{m.price}
                      </div>
                    ) : (
                      <div className="px-2 py-0.5 rounded-md text-[9px] font-black border border-white/10 bg-black/50 text-white/50">
                        Free
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3">
                  <p className="text-white/80 text-xs font-bold line-clamp-1 mb-0.5">{m.title}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-white/30 text-[10px] truncate max-w-[100px]">{m.authorName}</p>
                    <span className="flex items-center gap-1 text-white/20 text-[10px]">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {m.likes ?? 0}
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}

export default function ScrollingGallery() {
  const [models,  setModels]  = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchModels() {
      try {
        const snap = await getDocs(
          query(collection(db,"models"), orderBy("uploadedAt","desc"), limit(24))
        );
        setModels(snap.docs.map(d => ({ id:d.id, ...d.data() } as Model)));
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    fetchModels();
  }, []);

  if (loading) return (
    <section className="py-16 overflow-hidden">
      <div className="flex gap-4 px-4">
        {[...Array(6)].map((_,i) => (
          <div key={i} className="w-[220px] h-[168px] rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse flex-shrink-0" />
        ))}
      </div>
    </section>
  );

  if (models.length === 0) return null;

  const mid  = Math.ceil(models.length / 2);
  const row1 = models.slice(0, mid);
  const row2 = models.slice(mid);

  return (
    <section className="relative py-16 overflow-hidden" id="gallery-strip">
      {/* Edge fades */}
      <div className="absolute inset-y-0 left-0 w-32 z-10 pointer-events-none"
        style={{ background:"linear-gradient(90deg,#050008,transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-32 z-10 pointer-events-none"
        style={{ background:"linear-gradient(270deg,#050008,transparent)" }} />

      <div className="mb-6 px-4 flex items-center justify-between max-w-7xl mx-auto">
        <div>
          <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Live from the platform</p>
          <h2 className="text-2xl font-black tracking-tighter text-white">
            Latest{" "}
            <span style={{ backgroundImage:"linear-gradient(90deg,#a78bfa,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              Models
            </span>
          </h2>
        </div>
        <Link href="/gallery">
          <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} style={{ willChange:"transform" }}
            className="text-xs font-black text-violet-400/70 hover:text-violet-300 transition duration-200 cursor-pointer">
            View all →
          </motion.div>
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <MarqueeRow items={row1} reverse={false} />
        {row2.length > 0 && <MarqueeRow items={row2} reverse={true} />}
      </div>
    </section>
  );
}