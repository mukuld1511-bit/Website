"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function DashboardRouter() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) {
          router.replace("/create-profile");
          return;
        }
        const role = snap.data().role;
        switch (role) {
          case "admin":
            router.replace("/dashboard/admin");
            break;
          case "developer":
            router.replace("/dashboard/developer");
            break;
          case "mentor":
            router.replace("/dashboard/mentor");
            break;
          case "learner":
            router.replace("/dashboard/learner");
            break;
          default:
            router.replace("/dashboard/user");
            break;
        }
      } catch (err) {
        console.error("Dashboard router error:", err);
        router.replace("/dashboard/user");
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#5B4BDB]/30 border-t-[#5B4BDB] rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );
}