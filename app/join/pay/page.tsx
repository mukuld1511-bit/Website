"use client";
import { useState, useEffect, Suspense } from "react";
import { doc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

const MENTOR_PERKS = [
  "Verified mentor badge on your profile",
  "Host paid & free live sessions",
  "1-on-1 session bookings with Razorpay",
  "85% revenue on all sessions",
  "Listed on Hire a Mentor page",
];

const DEV_PERKS = [
  "Verified developer badge",
  "Upload & sell 3D models (85% revenue)",
  "Bid on client projects",
  "Developer profile page",
  "Listed on Connect page",
];

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
    </svg>
  );
}

function PayContent() {
  const [user, setUser] = useState<any>(null);
  const [appRole, setAppRole] = useState("mentor");
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const role = searchParams.get("role") || "mentor";
    setAppRole(role);
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  const handlePay = async () => {
    if (!user) return;
    setPaying(true);
    setError("");
    try {
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 999, type: "joining_fee", role: appRole }),
      });
      if (!orderRes.ok) throw new Error("Payment setup failed");
      const { orderId, amount, currency } = await orderRes.json();

      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: "SYNTHÉ Platform",
        description: `${appRole.charAt(0).toUpperCase() + appRole.slice(1)} Joining Fee`,
        order_id: orderId,
        handler: async (response: any) => {
          const appSnap = await getDocs(
            query(collection(db, "roleApplications"), where("userId", "==", user.uid))
          );
          if (!appSnap.empty) {
            await updateDoc(doc(db, "roleApplications", appSnap.docs[0].id), {
              paymentId: response.razorpay_payment_id,
              paymentOrderId: response.razorpay_order_id,
              paymentDone: true,
              status: "payment_pending",
            });
          }
          setDone(true);
        },
        prefill: { email: user.email ?? "" },
        theme: { color: "#5B4BDB" },
      });
      rzp.open();
    } catch (e) {
      setError((e as Error).message);
    }
    setPaying(false);
  };

  const perks = appRole === "mentor" ? MENTOR_PERKS : DEV_PERKS;
  const emoji = appRole === "mentor" ? "🧑‍🏫" : "💻";
  const roleLabel = appRole.charAt(0).toUpperCase() + appRole.slice(1);

  if (done) return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
      <div className="text-center bg-white p-10 rounded-2xl border border-gray-200 shadow-xl max-w-sm w-full mx-4">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Payment successful!</h2>
        <p className="text-gray-500 text-sm mb-2">
          Our team will activate your {appRole} profile within 24 hours.
        </p>
        <p className="text-gray-400 text-xs mb-6">
          You will receive a notification once activated.
        </p>
        <Link href="/dashboard">
          <button className="px-8 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm hover:bg-[#4c3ec7] transition-colors">
            Go to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col font-sans">      <div className="max-w-lg mx-auto px-4 py-20 flex-grow w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"
        >
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">{emoji}</div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">{roleLabel} Joining Fee</h1>
            <p className="text-gray-500 text-sm">
              Your application has been approved! Complete payment to go live on SYNTHE.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Role</span>
              <span className="font-bold text-gray-900 capitalize">{appRole}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Joining fee</span>
              <span className="font-bold text-gray-900">999 one-time</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Validity</span>
              <span className="font-bold text-gray-900">Lifetime</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-200 pt-3">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-black text-gray-900">999</span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">What you get:</p>
            {perks.map((perk, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckIcon />
                <span>{perk}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={paying || !user}
            className="w-full py-4 rounded-xl bg-[#5B4BDB] hover:bg-[#4c3ec7] text-white font-bold disabled:opacity-50 transition-colors border-b-[3px] border-[#4438b8] active:translate-y-[1px]"
          >
            {paying ? "Opening payment..." : "Pay 999 via Razorpay"}
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">
            Secure payment · Lifetime access · No renewal
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function JoinPayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F6F3]" />}>
      <PayContent />
    </Suspense>
  );
}