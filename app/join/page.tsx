"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Footer from "../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";

const ROLES = [
  {
    type: "learner",
    icon: "🎓",
    title: "Learner",
    color: "#185FA5",
    bg: "#E6F1FB",
    badgeColor: "#16a34a",
    badge: "INSTANT",
    approval: "instant" as const,
    tagline: "Learn XR from scratch — guided, structured, AI-powered.",
    earnings: null,
    perks: [
      "AI-generated personalised XR roadmap",
      "Register for 100+ free live workshops monthly",
      "Book verified mentors at ₹300–₹1000/hr",
      "Earn learning certificates and badges",
    ],
    notFor: "Not for creators who want to sell models — apply as Developer instead.",
    href: "/join/learner",
  },
  {
    type: "developer",
    icon: "⚡",
    title: "Developer",
    color: "#5B4BDB",
    bg: "#EEEDFE",
    badgeColor: "#16a34a",
    badge: "INSTANT",
    approval: "instant" as const,
    tagline: "Upload 3D models and AR/VR builds. Earn 85% on every sale.",
    earnings: "₹50,000+ monthly potential",
    perks: [
      "Upload GLB, GLTF, OBJ, FBX, ZIP, DWG files",
      "Earn 85% commission on every sale",
      "AI auto-writes titles, tags & pricing",
      "Direct payout via UPI/Bank transfer",
    ],
    notFor: "Not for teaching — apply as Mentor if you want to host sessions.",
    href: "/join/developer",
  },
  {
    type: "mentor",
    icon: "🧑‍🏫",
    title: "Mentor",
    color: "#0F6E56",
    bg: "#E1F5EE",
    badgeColor: "#B45309",
    badge: "REVIEWED",
    approval: "manual" as const,
    tagline: "Host workshops. Run 1-on-1 & group sessions. Set your own rates.",
    earnings: "₹80,000+ monthly potential",
    perks: [
      "Host unlimited free & paid workshops",
      "Set your own 1-on-1 + group session rates",
      "On-demand doubt sessions (instant booking)",
      "Earn 85% on every paid session",
      "Verified mentor badge on your profile",
    ],
    notFor: "Manual review required — min 2 certificates, full profile.",
    href: "/join/mentor",
  },
];

export default function JoinHubPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) return;
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) setProfile(snap.data());
    });
    return () => unsub();
  }, []);

  const hasRole = (type: string) => {
    if (!profile) return false;
    return profile.role === type || (Array.isArray(profile.roles) && profile.roles.includes(type));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans text-white">      <div className="max-w-5xl mx-auto px-4 py-20 flex-grow w-full">

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5B4BDB]/10 border border-[#5B4BDB]/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BDB] animate-pulse" />
            <span className="text-xs font-bold text-[#5B4BDB] uppercase tracking-widest">Upgrade your account</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white mb-4">Choose your role</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Learner & Developer activate <span className="font-bold text-green-600">instantly</span>.{" "}
            Mentor requires <span className="font-bold text-amber-600">manual admin review</span>.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ROLES.map((role, i) => {
            const active = hasRole(role.type);
            return (
              <motion.div key={role.type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <div className={`relative w-full p-7 rounded-2xl border-2 text-left transition-all duration-200 bg-white ${
                  active ? "opacity-60 border-gray-100" : "border-gray-200 hover:border-gray-300 hover:shadow-xl hover:-translate-y-1"
                }`}>

                  {/* Badge */}
                  <div className="absolute -top-3 left-6 px-3 py-1 rounded-full text-white text-[10px] font-black shadow-sm"
                    style={{ background: active ? "#6b7280" : role.badgeColor }}>
                    {active ? "CURRENT ROLE" : role.badge}
                  </div>

                  <div className="text-4xl mb-4 mt-2">{role.icon}</div>
                  <h3 className="font-black text-xl mb-1 text-white">{role.title}</h3>
                  {role.earnings && <p className="text-sm font-black mb-3" style={{ color: role.color }}>{role.earnings}</p>}
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{role.tagline}</p>

                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold mb-5 ${
                    role.approval === "instant"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {role.approval === "instant" ? "⚡ Instant activation" : "🔍 Manual review (24–48hr)"}
                  </div>

                  <ul className="space-y-2 mb-5">
                    {role.perks.map((p, j) => (
                      <li key={j} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0 font-black" style={{ color: role.color }}>✓</span>{p}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-400 mb-6 pb-4 border-t border-gray-100 italic pt-4">{role.notFor}</p>

                  {active ? (
                    <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-black text-sm text-center cursor-not-allowed">
                      Already Active
                    </div>
                  ) : (
                    <Link href={role.href}>
                      <button className="w-full py-3.5 rounded-xl text-white font-black text-sm hover:opacity-90 transition"
                        style={{ background: role.color }}>
                        Apply as {role.title} →
                      </button>
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-10 bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-sm font-black text-white">You can hold multiple roles</p>
              <p className="text-xs text-gray-400">Be a Learner + Developer, or Developer + Mentor simultaneously.</p>
            </div>
          </div>
          <Link href="/dashboard">
            <button className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-[#0A0A0F] transition whitespace-nowrap">
              Back to Dashboard
            </button>
          </Link>
        </motion.div>

      </div>
      <Footer />
    </div>
  );
}