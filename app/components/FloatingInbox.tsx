"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FloatingInbox() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setChats([]);
      return;
    }

    // Query chats where user is client
    const qClient = query(collection(db, "projectChats"), where("clientId", "==", user.uid));
    const unsubClient = onSnapshot(qClient, (snap) => {
      const clientChats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Query chats where user is developer
      const qDev = query(collection(db, "projectChats"), where("developerId", "==", user.uid));
      const unsubDev = onSnapshot(qDev, (snapDev) => {
        const devChats = snapDev.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Merge & Sort
        const allChats = [...clientChats, ...devChats];
        // Remove duplicates if any (rare edge case where client = dev)
        const unique = Array.from(new Map(allChats.map(c => [c.id, c])).values());
        
        unique.sort((a: any, b: any) => (b.lastMessageAt?.seconds ?? 0) - (a.lastMessageAt?.seconds ?? 0));
        setChats(unique);
      });
      return () => unsubDev();
    });

    return () => unsubClient();
  }, [user]);

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute bottom-16 right-0 w-[340px] max-h-[500px] flex flex-col bg-[#0a0012] border border-white/10 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.5), transparent)" }} />
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-md">
              <h3 className="font-black text-white text-sm">Direct Messages</h3>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-2">
              {chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                  <div className="w-12 h-12 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center text-xl">
                    💬
                  </div>
                  <p className="text-white/40 text-xs mt-2 font-medium">No messages yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {chats.map(chat => {
                    const isDev = user.uid === chat.developerId;
                    const name = isDev ? chat.clientName : chat.developerName;
                    const photo = isDev ? chat.clientPhoto : chat.developerPhoto;
                    
                    return (
                      <Link key={chat.id} href={`/project-chat/${chat.id}`} onClick={() => setIsOpen(false)}>
                        <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.05] transition duration-200 cursor-pointer">
                          <div className="relative">
                            {photo 
                              ? <img src={photo} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                              : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm border border-white/10">
                                  {name?.charAt(0) || "U"}
                                </div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-bold truncate leading-tight">{name || "User"}</p>
                            <p className="text-white/40 text-[11px] truncate mt-0.5">
                              {chat.lastMessage ? chat.lastMessage : chat.requestTitle ? `Project: ${chat.requestTitle}` : "New Chat"}
                            </p>
                          </div>
                          {chat.funded && (
                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-400" title="Funded" />
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* Footer action */}
            <div className="p-3 border-t border-white/5 bg-white/[0.01]">
               <Link href="/requests/open" onClick={() => setIsOpen(false)}>
                 <div className="w-full py-2.5 rounded-xl border border-white/5 text-white/50 text-xs font-bold text-center hover:bg-white/[0.05] hover:text-white transition">
                   Browse Open Requests
                 </div>
               </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl relative"
        style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          ) : (
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          )}
        </svg>
        {unread > 0 && !isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 border-2 border-[#0a0012] flex items-center justify-center text-[9px] font-black text-white">
            {unread}
          </div>
        )}
      </motion.button>
    </div>
  );
}
