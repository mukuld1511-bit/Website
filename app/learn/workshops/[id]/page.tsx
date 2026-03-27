"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, addDoc, collection } from "firebase/firestore";
import { db, auth } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

import Footer from "../../../components/Footer";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Workshop {
  id: string; title: string; description: string; date: any; duration: number;
  maxSeats: number; price: number; isPaid: boolean; status: "upcoming"|"live"|"ended";
  registeredUsers: string[]; tags: string[]; meetLink: string;
  hostId: string; hostName: string; hostPhoto: string;
}

export default function WorkshopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState("");
  const [workshop, setWorkshop] = useState<Workshop|null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u??null);
      if (u) { const snap = await getDoc(doc(db,"users",u.uid)); if(snap.exists()) setUserRole(snap.data().role||""); }
    });
    return ()=>unsub();
  }, []);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db,"workshops",id)).then(snap => {
      if (!snap.exists()) { router.push("/learn"); return; }
      setWorkshop({id:snap.id,...snap.data()} as Workshop);
      setLoading(false);
    });
  }, [id]);

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  const handleRegister = async () => {
    if (!user) { router.push("/login"); return; }
    if (!workshop) return;
    setRegistering(true);
    try {
      if (workshop.isPaid && workshop.price > 0) {
        // Razorpay
        const orderRes = await fetch("/api/create-order", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ amount: workshop.price, type:"workshop", workshopId: id }),
        });
        if (!orderRes.ok) throw new Error("Payment setup failed");
        const { orderId, amount, currency } = await orderRes.json();
        const rzp = new (window as any).Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount, currency, name:"SYNTHÉ Workshop",
          description: workshop.title, order_id: orderId,
          handler: async () => {
            await updateDoc(doc(db,"workshops",id), { registeredUsers: arrayUnion(user.uid) });
            await addDoc(collection(db,"notifications"), {
              userId: user.uid, type:"workshop_registered",
              message: `You're registered for "${workshop.title}". Meet link: ${workshop.meetLink}`,
              read: false, createdAt: serverTimestamp(),
            });
            setWorkshop(prev=>prev?{...prev,registeredUsers:[...prev.registeredUsers,user.uid]}:prev);
            showToast("Registered! Meet link sent to notifications ✓");
          },
          prefill: { email: user.email??"" }, theme:{ color:"#5B4BDB" },
        });
        rzp.open();
      } else {
        await updateDoc(doc(db,"workshops",id), { registeredUsers: arrayUnion(user.uid) });
        await addDoc(collection(db,"notifications"), {
          userId: user.uid, type:"workshop_registered",
          message: `You're registered for "${workshop.title}". Meet link: ${workshop.meetLink}`,
          read: false, createdAt: serverTimestamp(),
        });
        setWorkshop(prev=>prev?{...prev,registeredUsers:[...prev.registeredUsers,user.uid]}:prev);
        showToast("Registered! Meet link sent to notifications ✓");
      }
    } catch(e) { showToast((e as Error).message); }
    setRegistering(false);
  };

  if (loading) return <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#5B4BDB] border-t-transparent rounded-full animate-spin"/></div>;
  if (!workshop) return null;

  const isRegistered = user && workshop.registeredUsers?.includes(user.uid);
  const isFull = workshop.registeredUsers?.length >= workshop.maxSeats;
  const isHost = user?.uid === workshop.hostId;
  const seatsLeft = workshop.maxSeats - (workshop.registeredUsers?.length||0);
  const canRegister = user && ["learner","developer","mentor","admin"].includes(userRole);

  const formatDate = (ts: any) => {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", hour:"2-digit", minute:"2-digit" });
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col font-sans">

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-14 flex-grow w-full">
        <Link href="/learn" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-semibold mb-6 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back to Learn
        </Link>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main */}
          <div className="md:col-span-2 space-y-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">
              <div className="flex flex-wrap gap-2 mb-4">
                {workshop.status==="live" && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>Live now
                  </span>
                )}
                {workshop.tags?.map(t=><span key={t} className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 text-xs font-semibold">{t}</span>)}
              </div>

              <h1 className="text-2xl font-black text-gray-900 mb-4">{workshop.title}</h1>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  {workshop.hostPhoto ? <img src={workshop.hostPhoto} className="w-full h-full object-cover" alt=""/> : <div className="w-full h-full flex items-center justify-center font-black text-gray-400 text-sm">{workshop.hostName?.[0]}</div>}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{workshop.hostName}</p>
                  <p className="text-xs text-gray-400">{workshop.duration} min · {workshop.isPaid ? `₹${workshop.price}` : "Free"}</p>
                </div>
              </div>

              {workshop.description && (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-600 leading-relaxed">{workshop.description}</p>
                </div>
              )}
            </div>

            {/* Host manage section */}
            {isHost && (
              <div className="bg-white border border-[#5B4BDB]/20 rounded-2xl p-6 shadow-sm">
                <h3 className="font-black text-gray-900 mb-3">Manage Workshop</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-bold text-gray-700">Registered learners</span>
                    <span className="text-sm font-black text-[#5B4BDB]">{workshop.registeredUsers?.length||0}/{workshop.maxSeats}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-bold text-gray-700">Session link</span>
                    <a href={workshop.meetLink} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#5B4BDB] hover:underline truncate max-w-xs">Open →</a>
                  </div>
                  <div className="flex gap-2">
                    {workshop.status==="upcoming" && (
                      <button onClick={async()=>{await updateDoc(doc(db,"workshops",id),{status:"live"});setWorkshop(prev=>prev?{...prev,status:"live"}:prev);showToast("Workshop is now live!");}}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors">
                        Go Live 🔴
                      </button>
                    )}
                    {workshop.status==="live" && (
                      <button onClick={async()=>{await updateDoc(doc(db,"workshops",id),{status:"ended"});setWorkshop(prev=>prev?{...prev,status:"ended"}:prev);showToast("Workshop ended");}}
                        className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-bold text-sm transition-colors">
                        End Session
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Join section for registered learners */}
            {isRegistered && workshop.meetLink && workshop.status !== "ended" && (
              <div className="bg-gradient-to-r from-[#5B4BDB]/10 to-violet-50 border border-[#5B4BDB]/20 rounded-2xl p-6">
                <p className="font-black text-[#5B4BDB] mb-1">You're registered! 🎉</p>
                <p className="text-sm text-gray-500 mb-4">Session link is ready. Join when the host goes live.</p>
                <a href={workshop.meetLink} target="_blank" rel="noopener noreferrer">
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] text-white font-bold text-sm transition-colors border-b-[2px] border-[#4438b8]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    Join Session
                  </button>
                </a>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date</span>
                  <span className="font-bold text-gray-900 text-right text-xs">{formatDate(workshop.date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-bold text-gray-900">{workshop.duration} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Seats left</span>
                  <span className={`font-bold ${seatsLeft===0?"text-red-500":seatsLeft<=3?"text-amber-500":"text-green-600"}`}>
                    {seatsLeft===0?"Full":`${seatsLeft} / ${workshop.maxSeats}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Price</span>
                  <span className="font-black text-gray-900">{workshop.isPaid?`₹${workshop.price}`:"Free"}</span>
                </div>
              </div>

              {/* Seats bar */}
              <div className="h-2 bg-gray-100 rounded-full mb-5 overflow-hidden">
                <div className="h-full rounded-full bg-[#5B4BDB] transition-all"
                  style={{width:`${Math.min(((workshop.registeredUsers?.length||0)/workshop.maxSeats)*100,100)}%`}}/>
              </div>

              {!isRegistered && !isHost && workshop.status!=="ended" && (
                !user ? (
                  <Link href="/login"><button className="w-full py-3.5 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm hover:bg-[#4c3ec7] transition-colors">Sign in to register</button></Link>
                ) : !canRegister ? (
                  <Link href="/join"><button className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors">Apply as Learner to register</button></Link>
                ) : isFull ? (
                  <button disabled className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed">Session Full</button>
                ) : (
                  <button onClick={handleRegister} disabled={registering}
                    className="w-full py-3.5 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] text-white font-bold text-sm disabled:opacity-50 transition-colors border-b-[3px] border-[#4438b8] active:translate-y-[1px]">
                    {registering ? "Processing..." : workshop.isPaid ? `Register · ₹${workshop.price}` : "Register Free"}
                  </button>
                )
              )}
              {isRegistered && <div className="w-full py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 font-bold text-sm text-center">Registered ✓</div>}
              {workshop.status==="ended" && <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm text-center">Session ended</div>}
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}