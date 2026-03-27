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
  glb:"#3b82f6", gltf:"#3b82f6",
  obj:"#10b981", fbx:"#10b981",
  dwg:"#f59e0b", dxf:"#f59e0b",
};

function MarqueeRow({ items, reverse = false }: { items: Model[]; reverse?: boolean }) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden w-full">
      <motion.div
        className="flex gap-4"
        animate={{ x: reverse ? ["0%","-50%"] : ["-50%","0%"] }}
        transition={{ duration: items.length * 4, repeat:Infinity, ease:"linear" }}
        style={{ willChange:"transform", width:"max-content" }}
      >
        {doubled.map((m,i) => {
          const ext   = m.fileType?.toLowerCase() ?? "glb";
          const color = FILE_COLORS[ext] ?? "#3b82f6";
          return (
            <Link key={`${m.id}-${i}`} href={`/gallery/${m.id}`}>
              <motion.div
                whileHover={{ y:-4 }}
                transition={{ type:"spring", stiffness:400, damping:25 }}
                style={{ willChange:"transform", width:220, flexShrink:0 }}
                className="relative rounded-2xl border border-[#2A2A3E] bg-[#141420] overflow-hidden cursor-pointer hover:border-[#5B4BDB]/40 hover:shadow-[0_8px_30px_rgba(91,75,219,0.15)] transition duration-300 group"
              >
                {/* Thumbnail */}
                <div className="relative h-36 overflow-hidden bg-[#0A0A0F]">
                  {m.thumbnailUrl ? (
                    <img src={m.thumbnailUrl} alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#07060B]">
                      <svg className="w-10 h-10 text-[#2A2A3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase shadow-[0_4px_10px_rgba(0,0,0,0.5)] bg-[#141420]/90 backdrop-blur-md text-white border border-[#2A2A3E]/50">
                    {ext.toUpperCase()}
                  </div>
                  <div className="absolute top-2 right-2">
                    {m.isPaid ? (
                      <div className="px-2 py-0.5 rounded text-[9px] font-bold border border-green-500/30 bg-green-500/10 text-green-400 shadow-[0_4px_10px_rgba(0,0,0,0.5)] backdrop-blur-md">
                        ₹{m.price}
                      </div>
                    ) : (
                      <div className="px-2 py-0.5 rounded text-[9px] font-bold border border-[#2A2A3E]/50 bg-[#141420]/90 text-[#9494AD] shadow-[0_4px_10px_rgba(0,0,0,0.5)] backdrop-blur-md">
                        Free
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3">
                  <p className="text-white text-xs font-bold line-clamp-1 mb-0.5">{m.title}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[#6B6B85] font-medium text-[10px] truncate max-w-[100px]">{m.authorName}</p>
                    <span className="flex items-center gap-1 text-[#9494AD] font-bold text-[10px]">
                      <svg className="w-3 h-3 text-[#A594FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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
          <div key={i} className="w-[220px] h-[168px] rounded-2xl border border-[#2A2A3E] bg-[#141420] animate-pulse flex-shrink-0" />
        ))}
      </div>
    </section>
  );

  if (models.length === 0) return null;

  const mid  = Math.ceil(models.length / 2);
  const row1 = models.slice(0, mid);
  const row2 = models.slice(mid);

  return (
    <section className="relative overflow-hidden w-full bg-transparent" id="gallery-strip">
      {/* Edge fades */}
      <div className="absolute inset-y-0 left-0 w-8 md:w-32 z-10 pointer-events-none"
        style={{ background:"linear-gradient(90deg,#0A0A0F,transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-8 md:w-32 z-10 pointer-events-none"
        style={{ background:"linear-gradient(270deg,#0A0A0F,transparent)" }} />

      <div className="mb-8 px-4 flex py-2 items-center justify-between max-w-7xl mx-auto w-full">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Latest{" "}
            <span className="text-[#A594FF]">
              Models
            </span>
          </h2>
        </div>
        <Link href="/gallery">
          <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} style={{ willChange:"transform" }}
            className="text-xs font-bold text-[#7C6EF6] hover:text-[#A594FF] transition duration-200 cursor-pointer flex items-center gap-1">
            View all →
          </motion.div>
        </Link>
      </div>

      <div className="flex flex-col gap-5 w-full">
        <MarqueeRow items={row1} reverse={false} />
        {row2.length > 0 && <MarqueeRow items={row2} reverse={true} />}
      </div>
    </section>
  );
}