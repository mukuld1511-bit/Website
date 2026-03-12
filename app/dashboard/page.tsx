"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import UserDashboard from "./user/page";
import DeveloperDashboard from "./developer/page";
import AdminDashboard from "./admin/page";

export default function Dashboard() {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        const data: any = snap.data();

        console.log("Auth UID:", user.uid);
        console.log("Firestore data:", data);

        const r = String(data.role || "user").trim().toLowerCase();
        console.log("Resolved role:", r);

        setRole(r);

        if (snap.exists()) {
          const data: any = snap.data();
          const r = (data.role || "user").toLowerCase();
          setRole(r);
        } else {
          setRole("user");
        }
      } catch (err) {
        console.error(err);
        setRole("user");
      }
    });

    return () => unsub();
  }, [router]);

  if (role === null) {
    return (
      <main className="min-h-screen bg-[#020818] flex items-center justify-center relative overflow-hidden">

        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(34,211,238,1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-cyan-400"
          />
          <p className="text-slate-500 text-sm">Loading dashboard...</p>
        </motion.div>
      </main>
    );
  }

  if (role === "admin") return <AdminDashboard />;
  if (role === "developer") return <DeveloperDashboard />;
  return <UserDashboard />;
}