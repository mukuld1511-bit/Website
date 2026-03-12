"use client";

import { motion } from "framer-motion";
import FeatureCard from "./FeatureCard";

const cards = [
  { title: "Explore 3D Projects", desc: "Discover immersive 3D, AR and VR experiences built by talented developers worldwide. Browse, preview and download." },
  { title: "Learn From Experts", desc: "Connect with Synthé Certified developers. Request mentorship, book sessions and grow your immersive tech skills." },
  { title: "Build Custom Projects", desc: "Post your idea, get matched with expert developers, and bring your AR/VR vision to life with real collaborators." },
];

export default function FeatureSection() {
  return (
    <section className="relative max-w-7xl mx-auto pt-20 pb-16 px-4 sm:px-6 lg:px-8">

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.07) 0%, transparent 70%)", filter: "blur(80px)" }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm mb-7"
        >
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-violet-300/90 text-sm font-semibold uppercase tracking-widest">Why Choose Us</span>
        </motion.span>

        <h2 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white mb-5 leading-none">
          Why Use{" "}
          <span style={{ backgroundImage: "linear-gradient(90deg, #a78bfa, #22d3ee, #fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Synthé
          </span>
        </h2>

        <p className="text-white/40 text-xl max-w-xl mx-auto font-light">
          Everything you need to create, share and grow in immersive tech.
        </p>

        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-10 h-[2px] bg-violet-500/30 rounded-full" />
          <div className="w-28 h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, #a78bfa, #22d3ee)" }} />
          <div className="w-10 h-[2px] bg-cyan-500/30 rounded-full" />
        </div>
      </motion.div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-5">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <FeatureCard title={card.title} desc={card.desc} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}