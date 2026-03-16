"use client";
import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";

const ROADMAP = [
  {
    phase: "Phase 1",
    title: "3D Basics",
    duration: "2–4 weeks",
    color: "#1D9E75",
    bg: "#E1F5EE",
    steps: [
      { title: "Learn 3D concepts", desc: "Understand vertices, meshes, polygons, UV mapping, materials, and PBR textures." },
      { title: "Blender fundamentals", desc: "Modelling, sculpting, rigging, animation basics. Export to GLB/GLTF format." },
      { title: "3D file formats", desc: "GLB, GLTF, OBJ, FBX — differences, use cases, and when to use each." },
      { title: "Upload to SYNTHÉ", desc: "Upload your first 3D model. Test it in the live viewer." },
    ],
    tools: ["Blender", "SYNTHÉ gallery"],
  },
  {
    phase: "Phase 2",
    title: "Unity Basics",
    duration: "4–6 weeks",
    color: "#5B4BDB",
    bg: "#EEEDFE",
    steps: [
      { title: "Unity editor basics", desc: "Scenes, GameObjects, components, physics, scripting with C#." },
      { title: "Import 3D models", desc: "Import GLB/FBX into Unity, set up materials, PBR shaders." },
      { title: "First Unity project", desc: "Build a simple interactive 3D scene. Add lighting and post-processing." },
      { title: "Build & deploy", desc: "Build for Android/iOS. Test on a real device." },
    ],
    tools: ["Unity", "C#", "Android/iOS device"],
  },
  {
    phase: "Phase 3",
    title: "AR Development",
    duration: "4–6 weeks",
    color: "#EF9F27",
    bg: "#FAEEDA",
    steps: [
      { title: "AR Foundation in Unity", desc: "Set up AR Foundation. Understand hit testing, plane detection, anchors." },
      { title: "ARCore & ARKit", desc: "Platform differences. AR Foundation handles both — one codebase for Android + iOS." },
      { title: "Place objects in AR", desc: "Tap to place a 3D model on a detected surface. Add interaction." },
      { title: "Build your first AR app", desc: "Package as APK/IPA. Submit to SYNTHÉ as an XR build." },
    ],
    tools: ["Unity", "AR Foundation", "ARCore", "ARKit"],
  },
  {
    phase: "Phase 4",
    title: "VR Development",
    duration: "4–6 weeks",
    color: "#D85A30",
    bg: "#FAECE7",
    steps: [
      { title: "VR concepts", desc: "6DOF vs 3DOF, comfort guidelines, locomotion patterns, performance budgets." },
      { title: "Meta Quest setup", desc: "Set up Unity for Quest. XR Interaction Toolkit for controllers and hand tracking." },
      { title: "VR interactions", desc: "Grabbing objects, UI in VR, spatial audio, teleportation locomotion." },
      { title: "Deploy to Quest", desc: "Build and sideload APK to Meta Quest. Test standing and room-scale." },
    ],
    tools: ["Unity", "XR Interaction Toolkit", "Meta Quest"],
  },
  {
    phase: "Phase 5",
    title: "WebXR",
    duration: "3–4 weeks",
    color: "#185FA5",
    bg: "#E6F1FB",
    steps: [
      { title: "Three.js basics", desc: "3D in the browser. Scenes, cameras, lights, geometries, materials." },
      { title: "WebXR API", desc: "Immersive AR and VR sessions. Hit testing, anchors, controllers in browser." },
      { title: "@react-three/fiber", desc: "React wrapper for Three.js. Build 3D scenes as React components." },
      { title: "AR in browser", desc: "Place models in physical world using phone camera. No app download needed." },
    ],
    tools: ["Three.js", "@react-three/fiber", "WebXR API", "A-Frame"],
  },
  {
    phase: "Phase 6",
    title: "Publish & Earn",
    duration: "Ongoing",
    color: "#444441",
    bg: "#F1EFE8",
    steps: [
      { title: "Upload to SYNTHÉ", desc: "Upload your AR/VR builds as ZIP files. Set free or paid pricing." },
      { title: "Get certified", desc: "Apply for Developer Certification. Verified badge increases trust and sales." },
      { title: "Mentor others", desc: "Apply as a Mentor. Host live sessions and teach what you've learned." },
      { title: "Take on projects", desc: "Accept project requests from clients on SYNTHÉ's marketplace." },
    ],
    tools: ["SYNTHÉ marketplace", "SYNTHÉ Learn"],
  },
];

export default function RoadmapPage() {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-14 flex-grow w-full">

        <div className="mb-10">
          <Link href="/learn" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-semibold mb-5 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to Learn
          </Link>
          <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-2">Learning Path</p>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-3">XR developer roadmap</h1>
          <p className="text-gray-500 text-lg max-w-xl">
            Zero to XR developer. Follow this path from 3D basics to publishing your own AR/VR apps.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-4">
            {ROADMAP.map((phase, i) => (
              <div key={i} className="relative pl-16">
                {/* Phase dot */}
                <div
                  className="absolute left-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-sm"
                  style={{ background: phase.color, top: "16px" }}
                >
                  {i + 1}
                </div>

                {/* Card */}
                <div
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  <div className="p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: phase.bg, color: phase.color }}>
                          {phase.phase}
                        </span>
                        <span className="text-xs text-gray-400">{phase.duration}</span>
                      </div>
                      <h3 className="font-black text-gray-900 text-lg">{phase.title}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {phase.tools.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">{t}</span>
                        ))}
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${expanded === i ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>

                  {expanded === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {phase.steps.map((step, j) => (
                          <div key={j} className="rounded-xl p-4" style={{ background: phase.bg }}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                style={{ background: phase.color }}>
                                {j + 1}
                              </span>
                              <p className="font-bold text-gray-900 text-sm">{step.title}</p>
                            </div>
                            <p className="text-gray-500 text-xs leading-relaxed pl-7">{step.desc}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/learn" className="block">
            <div className="p-5 rounded-2xl border border-[#5B4BDB]/20 bg-[#5B4BDB]/5 hover:bg-[#5B4BDB]/10 transition-colors cursor-pointer">
              <p className="font-black text-gray-900 mb-1">Find a mentor</p>
              <p className="text-gray-500 text-sm">Get help at any phase with a 1-on-1 session</p>
            </div>
          </Link>
          <Link href="/learn/tools" className="block">
            <div className="p-5 rounded-2xl border border-gray-100 bg-white hover:shadow-sm transition-shadow cursor-pointer">
              <p className="font-black text-gray-900 mb-1">Browse tools</p>
              <p className="text-gray-500 text-sm">All the AR/VR tools from this roadmap in one place</p>
            </div>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}