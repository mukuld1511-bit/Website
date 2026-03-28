"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Footer from "../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";
import VideoBackground from "../components/VideoBackground";
import GlowCard from "../components/GlowCard";
import TextReveal from "../components/TextReveal";
import MagneticButton from "../components/MagneticButton";

const ROLES = [
  {
    type: "learner", icon: "🎓", title: "Learner",
    color: "#5B4BDB", bg: "#5B4BDB",
    badgeColor: "#16a34a", badge: "INSTANT", approval: "instant" as const,
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
    type: "developer", icon: "⚡", title: "Developer",
    color: "#7C6EF6", bg: "#7C6EF6",
    badgeColor: "#16a34a", badge: "INSTANT", approval: "instant" as const,
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
    type: "mentor", icon: "🧑‍🏫", title: "Mentor",
    color: "#10B981", bg: "#10B981",
    badgeColor: "#B45309", badge: "REVIEWED", approval: "manual" as const,
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
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

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
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col font-sans text-white">

      {/* Hero */}
      <section className="relative py-24 px-4 overflow-hidden">
        <VideoBackground variant="particles" color="#5B4BDB" intensity={0.3} />
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5B4BDB]/15 border border-[#5B4BDB]/25 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BDB] animate-pulse" />
              <span className="text-xs font-bold text-[#7C6EF6] uppercase tracking-widest">Upgrade your account</span>
            </div>
          </motion.div>
          <TextReveal as="h1" className="text-5xl md:text-6xl font-black tracking-tight text-white mb-4">
            Choose your role
          </TextReveal>
          <motion.p className="text-[#9494AD] max-w-xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            Learner & Developer activate <span className="font-bold text-green-400">instantly</span>.{" "}
            Mentor requires <span className="font-bold text-amber-400">manual admin review</span>.
          </motion.p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-20 flex-grow w-full -mt-8 relative z-10">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ROLES.map((role, i) => {
            const active = hasRole(role.type);
            const isSelected = selectedRole === role.type;
            return (
              <GlowCard key={role.type} glowColor={`${role.color}40`} className="h-full">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{
                    opacity: active ? 0.6 : selectedRole && !isSelected ? 0.4 : 1,
                    y: 0,
                    scale: isSelected ? 1.02 : 1,
                  }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 25 }}
                  whileHover={!active ? { scale: 1.02 } : undefined}
                  onHoverStart={() => !active && setSelectedRole(role.type)}
                  onHoverEnd={() => setSelectedRole(null)}
                >
                  <div className={`relative w-full p-7 rounded-2xl border-2 text-left transition-all duration-300 bg-[#141420] ${
                    active ? "border-[#2A2A3E]"
                    : isSelected ? "border-[#5B4BDB] shadow-[0_0_30px_rgba(91,75,219,0.2)]"
                    : "border-[#2A2A3E] hover:border-[#5B4BDB]/50"
                  }`}>

                    {/* Badge */}
                    <div className="absolute -top-3 left-6 px-3 py-1 rounded-full text-white text-[10px] font-black shadow-sm"
                      style={{ background: active ? "#6b7280" : role.badgeColor }}>
                      {active ? "CURRENT ROLE" : role.badge}
                    </div>

                    {/* Aura glow on selection */}
                    {isSelected && !active && (
                      <motion.div
                        className="absolute -inset-1 rounded-2xl pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          background: `radial-gradient(circle at 50% 100%, ${role.color}20, transparent 60%)`,
                        }}
                      />
                    )}

                    <div className="text-4xl mb-4 mt-2">{role.icon}</div>
                    <h3 className="font-black text-xl mb-1 text-white">{role.title}</h3>
                    {role.earnings && <p className="text-sm font-black mb-3" style={{ color: role.color }}>{role.earnings}</p>}
                    <p className="text-sm text-[#9494AD] leading-relaxed mb-4">{role.tagline}</p>

                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold mb-5 ${
                      role.approval === "instant"
                        ? "bg-green-500/15 text-green-400 border border-green-500/30"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    }`}>
                      {role.approval === "instant" ? "⚡ Instant activation" : "🔍 Manual review (24–48hr)"}
                    </div>

                    <ul className="space-y-2 mb-5">
                      {role.perks.map((p, j) => (
                        <li key={j} className="text-xs text-[#9494AD] flex items-start gap-2">
                          <span className="mt-0.5 flex-shrink-0 font-black" style={{ color: role.color }}>✓</span>{p}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-[#6B6B85] mb-6 pb-4 border-t border-[#2A2A3E] italic pt-4">{role.notFor}</p>

                    {active ? (
                      <div className="w-full py-3 rounded-xl bg-[#1A1A2E] text-[#6B6B85] font-black text-sm text-center cursor-not-allowed border border-[#2A2A3E]">
                        Already Active
                      </div>
                    ) : (
                      <Link href={role.href}>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          className="w-full py-3.5 rounded-xl text-white font-black text-sm hover:opacity-90 transition shadow-lg"
                          style={{ background: role.color, boxShadow: `0 0 20px ${role.color}40` }}>
                          Apply as {role.title} →
                        </motion.button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              </GlowCard>
            );
          })}
        </div>

        {/* Info bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-10 glass-synthe rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-sm font-black text-white">You can hold multiple roles</p>
              <p className="text-xs text-[#6B6B85]">Be a Learner + Developer, or Developer + Mentor simultaneously.</p>
            </div>
          </div>
          <MagneticButton href="/dashboard" variant="secondary">Back to Dashboard</MagneticButton>
        </motion.div>

      </div>
      <Footer />
    </div>
  );
}