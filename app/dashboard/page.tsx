"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function DashboardRouter() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading"|"redirecting"|"error">("loading");
  const [msg,    setMsg]    = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        // 1. Check users collection for role
        const userSnap = await getDoc(doc(db, "users", user.uid));

        if (userSnap.exists()) {
          const role = userSnap.data().role;
          if (role === "admin") {
            router.replace("/dashboard/admin");
          } else if (role === "developer") {
            router.replace("/dashboard/developer");
          } else {
            router.replace("/dashboard/user");
          }
          setStatus("redirecting");
          return;
        }

        // 2. Fallback — check developerApplications
        const devSnap = await getDocs(query(
          collection(db, "developerApplications"),
          where("userId", "==", user.uid),
          where("status", "==", "approved")
        ));

        if (!devSnap.empty) {
          router.replace("/dashboard/developer");
          setStatus("redirecting");
          return;
        }

        // 3. Default — user dashboard
        router.replace("/dashboard/user");
        setStatus("redirecting");

      } catch(e: any) {
        console.error(e);
        setStatus("error");
        setMsg(e.message);
      }
    });
    return () => unsub();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        {status === "error" ? (
          <>
            <p className="text-red-500 text-sm mb-3 font-semibold">Something went wrong</p>
            <p className="text-gray-500 text-xs mb-5 font-medium">{msg}</p>
            <button onClick={() => router.push("/")}
              className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition duration-200 shadow-sm">
              Go Home
            </button>
          </>
        ) : (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ willChange:"transform" }}
              className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-blue-500 mx-auto mb-4"
            />
            <p className="text-gray-500 text-sm font-medium">Loading your dashboard…</p>
          </>
        )}
      </div>
    </div>
  );
}