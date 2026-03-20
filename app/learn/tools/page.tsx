"use client";
import { useState, useMemo } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { recommendTools } from "@/lib/openai";

// ─── TOOL DATA ────────────────────────────────────────────────────────────────
const TOOLS = [
  {
    category: "Game Engines",
    emoji: "🎮",
    items: [
      {
        id: "unity",
        name: "Unity",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/unity/unity-original.svg",
        desc: "Most popular engine for AR/VR. AR Foundation supports ARCore + ARKit in one codebase. 60%+ of all AR/VR apps built with Unity.",
        longDesc: "Unity is the go-to engine for XR development with the largest ecosystem of assets, tutorials, and community support. Its AR Foundation layer abstracts ARCore and ARKit, letting you target Android and iOS from one codebase.",
        tags: ["AR", "VR", "Mobile", "PC", "Cross-platform"],
        link: "https://unity.com",
        color: "#1a1a1a",
        level: "Beginner friendly",
        pricing: "Free",
        rating: 4.8,
        users: "3M+",
        featured: true,
        pros: ["Largest community", "Free tier available", "AR Foundation", "Asset Store"],
        cons: ["Heavy runtime", "Licensing fees at scale"],
        useCases: ["Mobile AR apps", "VR games", "Training simulations"],
      },
      {
        id: "unreal",
        name: "Unreal Engine",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/unrealengine/unrealengine-original.svg",
        desc: "Best for high-fidelity VR. Photorealistic graphics, used in AAA games and enterprise VR.",
        longDesc: "Unreal Engine 5 brings Nanite and Lumen to XR — photorealistic rendering at real-time framerates. Used by Epic's own VR experiences and major studios worldwide.",
        tags: ["VR", "PC", "Enterprise", "High-fidelity"],
        link: "https://unrealengine.com",
        color: "#0d0d0d",
        level: "Intermediate",
        pricing: "Free",
        rating: 4.7,
        users: "2M+",
        featured: false,
        pros: ["Photorealistic graphics", "Blueprint visual scripting", "MetaHuman", "Free to use"],
        cons: ["Steep learning curve", "Heavy system requirements"],
        useCases: ["Enterprise VR", "Architectural viz", "Film production"],
      },
    ],
  },
  {
    category: "WebXR & Browser",
    emoji: "🌐",
    items: [
      {
        id: "webxr",
        name: "WebXR API",
        logo: null, logoText: "XR", logoColor: "#5B4BDB",
        desc: "W3C standard for AR/VR in the browser. No app install needed. Works on Chrome Android + Safari iOS 16+.",
        longDesc: "WebXR Device API is the native browser standard for immersive experiences. Supports both AR (hit testing, anchors) and VR (6DOF controllers). Already used on SYNTHÉ for in-browser AR previews.",
        tags: ["Browser", "AR", "VR", "No install", "W3C Standard"],
        link: "https://immersiveweb.dev",
        color: "#5B4BDB", level: "Intermediate", pricing: "Free", rating: 4.5, users: "500K+", featured: true,
        pros: ["No app install", "Cross-platform", "Native browser support", "Used on SYNTHÉ"],
        cons: ["Limited device support", "No offline"],
        useCases: ["In-browser AR", "WebVR demos", "Product visualization"],
      },
      {
        id: "aframe",
        name: "A-Frame",
        logo: null, logoText: "AF", logoColor: "#ef2d5e",
        desc: "HTML framework for building VR on the web. Easiest entry into WebVR — just HTML tags.",
        longDesc: "A-Frame by Mozilla lets you build VR scenes with HTML. Built on Three.js, so you get full access when needed.",
        tags: ["Browser", "VR", "HTML", "Three.js"],
        link: "https://aframe.io",
        color: "#ef2d5e", level: "Beginner friendly", pricing: "Free / Open source", rating: 4.6, users: "200K+", featured: false,
        pros: ["HTML syntax", "Zero setup", "Great for beginners", "Three.js underneath"],
        cons: ["Performance limits", "Less active development"],
        useCases: ["VR prototypes", "Educational demos", "360° experiences"],
      },
      {
        id: "babylonjs",
        name: "Babylon.js",
        logo: null, logoText: "BJS", logoColor: "#e0703c",
        desc: "Microsoft-backed 3D engine for the web. Production-grade WebGL with built-in WebXR support.",
        longDesc: "Babylon.js is the most powerful open-source 3D engine for the web, backed by Microsoft. Full WebXR support, PBR materials, physics engines, and a Playground for live coding.",
        tags: ["Browser", "VR", "AR", "WebGL", "Microsoft"],
        link: "https://babylonjs.com",
        color: "#e0703c", level: "Intermediate", pricing: "Free / Open source", rating: 4.7, users: "150K+", featured: false,
        pros: ["Microsoft backing", "Full WebXR", "Inspector tool", "TypeScript native"],
        cons: ["Larger bundle size", "Steeper than A-Frame"],
        useCases: ["Web 3D apps", "WebXR games", "Product configurators"],
      },
      {
        id: "8thwall",
        name: "8th Wall",
        logo: null, logoText: "8W", logoColor: "#00c4b3",
        desc: "WebAR in any mobile browser. Surface tracking, image targets, face effects — no app needed.",
        longDesc: "8th Wall's proprietary SLAM runs entirely in the browser via WebAssembly. Powers campaigns for Nike, Pepsi, and thousands of brands.",
        tags: ["Browser", "AR", "SLAM", "No install", "Enterprise"],
        link: "https://8thwall.com",
        color: "#00c4b3", level: "Intermediate", pricing: "Paid", rating: 4.5, users: "50K+", featured: false,
        pros: ["Best WebAR tracking", "Works in Safari", "No app install", "Enterprise support"],
        cons: ["Paid subscription", "Proprietary platform"],
        useCases: ["Brand AR campaigns", "Product try-on", "Marketing experiences"],
      },
    ],
  },
  {
    category: "AR Frameworks",
    emoji: "📱",
    items: [
      {
        id: "arcore",
        name: "ARCore",
        logo: null, logoText: "AC", logoColor: "#4285F4",
        desc: "Google's AR platform for Android. Motion tracking, environment understanding, light estimation.",
        longDesc: "ARCore provides motion tracking, environmental understanding (planes, depth), and light estimation. Supports 400M+ Android devices.",
        tags: ["Android", "Mobile", "AR", "Google"],
        link: "https://developers.google.com/ar",
        color: "#4285F4", level: "Intermediate", pricing: "Free", rating: 4.4, users: "400M devices", featured: false,
        pros: ["400M+ device support", "Depth API", "Cloud Anchors", "Scene Semantics"],
        cons: ["Android only", "Requires setup"],
        useCases: ["Android AR apps", "Navigation", "Industrial AR"],
      },
      {
        id: "arkit",
        name: "ARKit",
        logo: null, logoText: "AK", logoColor: "#555",
        desc: "Apple's AR framework for iOS. Best-in-class tracking on iPhone and iPad.",
        longDesc: "ARKit 6 brings LiDAR scanning, reality anchors, and collaborative sessions. The most accurate AR tracking on mobile.",
        tags: ["iOS", "Mobile", "AR", "Apple", "LiDAR"],
        link: "https://developer.apple.com/augmented-reality",
        color: "#555", level: "Intermediate", pricing: "Free", rating: 4.6, users: "1B+ devices", featured: false,
        pros: ["LiDAR support", "Best tracking accuracy", "1B+ devices", "RealityKit"],
        cons: ["iOS only", "Requires Apple hardware"],
        useCases: ["iOS AR apps", "LiDAR scanning", "Spatial experiences"],
      },
      {
        id: "vuforia",
        name: "Vuforia",
        logo: null, logoText: "VF", logoColor: "#e67e22",
        desc: "Image target and object recognition AR. Great for industrial and educational applications.",
        longDesc: "Vuforia is the enterprise AR standard. Used by BMW, Boeing, and major manufacturers for AR-assisted assembly.",
        tags: ["Android", "iOS", "Unity", "Industrial", "Enterprise"],
        link: "https://developer.vuforia.com",
        color: "#e67e22", level: "Beginner friendly", pricing: "Freemium", rating: 4.3, users: "75K+", featured: false,
        pros: ["Object recognition", "Unity plugin", "Enterprise support", "Model targets"],
        cons: ["Watermark on free tier", "Paid for production"],
        useCases: ["Industrial AR", "Print AR", "Education"],
      },
    ],
  },
  {
    category: "3D Modelling",
    emoji: "🧊",
    items: [
      {
        id: "blender",
        name: "Blender",
        logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/blender/blender-original.svg",
        desc: "Free and open source 3D creation suite. Modelling, rigging, animation, rendering, and VFX.",
        longDesc: "Blender is the industry-standard free 3D tool. Exports to GLB/GLTF natively — the format used throughout SYNTHÉ.",
        tags: ["3D", "Free", "Open source", "GLB", "Animation"],
        link: "https://blender.org",
        color: "#E87D0D", level: "Intermediate", pricing: "Free / Open source", rating: 4.9, users: "5M+", featured: true,
        pros: ["Completely free", "GLB export", "Full pipeline", "Active development"],
        cons: ["Learning curve", "UI non-standard"],
        useCases: ["3D modelling", "Animation", "GLB creation for SYNTHÉ"],
      },
      {
        id: "spline",
        name: "Spline",
        logo: null, logoText: "SP", logoColor: "#0D6EFD",
        desc: "Browser-based 3D design tool. Easiest way to create 3D for the web — no install required.",
        longDesc: "Spline lets you design, animate, and export 3D in the browser. Exports to GLTF. Perfect for UI/UX designers making their first 3D models.",
        tags: ["Browser", "3D", "Design", "No install", "GLTF"],
        link: "https://spline.design",
        color: "#0D6EFD", level: "Beginner friendly", pricing: "Freemium", rating: 4.5, users: "300K+", featured: false,
        pros: ["Browser-based", "No install", "GLTF export", "Beginner friendly"],
        cons: ["Limited complexity", "Paid for some exports"],
        useCases: ["Web 3D assets", "UI animations", "Quick prototypes"],
      },
      {
        id: "gravitysketch",
        name: "Gravity Sketch",
        logo: null, logoText: "GS", logoColor: "#6B48FF",
        desc: "VR-native 3D design. Model directly inside virtual reality using your hands as tools.",
        longDesc: "Gravity Sketch is used by car designers at Ford, Volkswagen, and Nike footwear designers.",
        tags: ["VR", "Design", "3D", "Professional"],
        link: "https://gravitysketch.com",
        color: "#6B48FF", level: "Beginner friendly", pricing: "Freemium", rating: 4.6, users: "100K+", featured: false,
        pros: ["Intuitive in VR", "Industry used", "Collaborative", "Exports GLTF"],
        cons: ["Requires VR headset", "Paid for teams"],
        useCases: ["Product design", "Character design", "Concept art in VR"],
      },
    ],
  },
  {
    category: "Headsets & Platforms",
    emoji: "🥽",
    items: [
      {
        id: "metaquest",
        name: "Meta Quest 3",
        logo: null, logoText: "MQ", logoColor: "#0064E0",
        desc: "Standalone VR/MR headset by Meta. No PC needed. Most popular XR platform with mixed reality passthrough.",
        longDesc: "Quest 3 is the current king of standalone XR. Full-colour passthrough enables mixed reality. Runs Android-based OS, develop with Unity or Unreal.",
        tags: ["VR", "MR", "Standalone", "Android", "Popular"],
        link: "https://meta.com/quest",
        color: "#0064E0", level: "Consumer device", pricing: "₹40,000+", rating: 4.7, users: "20M+ units", featured: true,
        pros: ["No PC needed", "Mixed reality", "Large library", "Hand tracking"],
        cons: ["Battery life", "Facebook account"],
        useCases: ["VR gaming", "MR development", "Enterprise training"],
      },
      {
        id: "visionpro",
        name: "Apple Vision Pro",
        logo: null, logoText: "VP", logoColor: "#1d1d1f",
        desc: "Spatial computing headset. visionOS with SwiftUI and RealityKit. Passthrough mixed reality at highest fidelity.",
        longDesc: "Vision Pro runs visionOS — a new paradigm of computing. Eye tracking, hand gestures, and voice replace traditional input.",
        tags: ["MR", "visionOS", "Apple", "Spatial", "Premium"],
        link: "https://apple.com/apple-vision-pro",
        color: "#1d1d1f", level: "Advanced", pricing: "₹3,00,000+", rating: 4.4, users: "500K+ units", featured: false,
        pros: ["Best display quality", "Eye/hand tracking", "Spatial audio", "visionOS ecosystem"],
        cons: ["Very expensive", "Limited apps", "Heavy"],
        useCases: ["Spatial computing", "Professional tools", "Premium experiences"],
      },
    ],
  },
  {
    category: "AI & Generation",
    emoji: "✨",
    items: [
      {
        id: "openai",
        name: "OpenAI GPT-4o",
        logo: null, logoText: "AI", logoColor: "#10a37f",
        desc: "OpenAI's multimodal AI. Powers SYNTHÉ's roadmap generator, XR chat, tool recommender and model descriptions.",
        longDesc: "GPT-4o mini is used on SYNTHÉ for personalised roadmaps, XR concept chat, tool recommendations, creator matching, and auto-description generation. Free tier via OpenAI API.",
        tags: ["AI", "Multimodal", "API", "Used on SYNTHÉ"],
        link: "https://platform.openai.com",
        color: "#10a37f", level: "Intermediate", pricing: "Free tier", rating: 4.8, users: "2M+ devs", featured: true,
        pros: ["Fast inference", "Multimodal", "Free tier", "Used on SYNTHÉ"],
        cons: ["Rate limits on free", "No offline"],
        useCases: ["AI features", "Content generation", "XR education"],
      },
      {
        id: "meshy",
        name: "Meshy AI",
        logo: null, logoText: "M", logoColor: "#7c3aed",
        desc: "Text-to-3D and image-to-3D AI. Generate GLB models from a text prompt in seconds.",
        longDesc: "Meshy is the leading text-to-3D platform. Type 'a wooden medieval chair' and get a GLB file in under 60 seconds. Outputs are compatible with SYNTHÉ's gallery directly.",
        tags: ["AI", "Text-to-3D", "GLB", "Generation"],
        link: "https://meshy.ai",
        color: "#7c3aed", level: "Beginner friendly", pricing: "Freemium", rating: 4.4, users: "200K+", featured: false,
        pros: ["Text-to-3D", "GLB output", "Fast", "No modelling skills needed"],
        cons: ["Quality varies", "Credits system"],
        useCases: ["Rapid prototyping", "Asset generation", "Concept models"],
      },
    ],
  },
];

const ALL_TAGS    = Array.from(new Set(TOOLS.flatMap(s => s.items.flatMap(t => t.tags)))).sort();
const ALL_LEVELS  = ["Beginner friendly", "Intermediate", "Advanced", "Consumer device"];

const LEVEL_STYLES: Record<string, string> = {
  "Beginner friendly": "bg-green-50 text-green-700 border-green-200",
  "Intermediate":      "bg-violet-50 text-violet-700 border-violet-200",
  "Advanced":          "bg-orange-50 text-orange-700 border-orange-200",
  "Consumer device":   "bg-blue-50 text-blue-700 border-blue-200",
};

const PRICING_STYLES: Record<string, string> = {
  "Free":              "bg-teal-50 text-teal-700",
  "Free / Open source":"bg-teal-50 text-teal-700",
  "Freemium":          "bg-amber-50 text-amber-700",
  "Paid":              "bg-red-50 text-red-700",
  "Free tier":         "bg-teal-50 text-teal-700",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? "#f59e0b" : "#e5e7eb"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating}</span>
    </div>
  );
}

function ToolLogo({ tool }: { tool: any }) {
  if (tool.logo) {
    return (
      <img src={tool.logo} alt={tool.name} width={28} height={28} className="w-7 h-7 object-contain"
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
    );
  }
  return (
    <span className="text-sm font-black text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
      {tool.logoText || tool.name.charAt(0)}
    </span>
  );
}

export default function ToolsPage() {
  const [search,            setSearch]            = useState("");
  const [activeTag,         setActiveTag]         = useState<string | null>(null);
  const [activeLevel,       setActiveLevel]       = useState<string | null>(null);
  const [activePricing,     setActivePricing]     = useState<string | null>(null);
  const [viewMode,          setViewMode]          = useState<"grid" | "list">("grid");
  const [bookmarks,         setBookmarks]         = useState<Set<string>>(new Set());
  const [compareList,       setCompareList]       = useState<string[]>([]);
  const [detailTool,        setDetailTool]        = useState<any | null>(null);
  const [aiRec,             setAiRec]             = useState<string>("");
  const [aiLoading,         setAiLoading]         = useState(false);
  const [aiGoal,            setAiGoal]            = useState("");
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);

  const allTools = TOOLS.flatMap(s => s.items);

  const filtered = useMemo(() => {
    return TOOLS.map(section => ({
      ...section,
      items: section.items.filter(tool => {
        const matchSearch   = !search || tool.name.toLowerCase().includes(search.toLowerCase()) || tool.desc.toLowerCase().includes(search.toLowerCase()) || tool.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
        const matchTag      = !activeTag || tool.tags.includes(activeTag);
        const matchLevel    = !activeLevel || tool.level === activeLevel;
        const matchPricing  = !activePricing || tool.pricing.includes(activePricing);
        const matchBookmark = !showOnlyBookmarks || bookmarks.has(tool.id);
        return matchSearch && matchTag && matchLevel && matchPricing && matchBookmark;
      }),
    })).filter(s => s.items.length > 0);
  }, [search, activeTag, activeLevel, activePricing, bookmarks, showOnlyBookmarks]);

  const totalFiltered = filtered.reduce((a, s) => a + s.items.length, 0);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setBookmarks(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleCompare = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCompareList(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  // ── AI Tool Recommender ───────────────────────────────────────────────────
  const getAiRec = async () => {
    if (!aiGoal.trim()) return;
    setAiLoading(true);
    setAiRec("");
    try {
      const toolNames = allTools.map(t => `${t.name}: ${t.desc}`).join("\n");
      const raw = await recommendTools(aiGoal, toolNames);
      try {
        const parsed = JSON.parse(raw);
        const recs: Array<{ name: string; reason: string }> = parsed.recommendations ?? [];
        setAiRec(
          recs.length > 0
            ? recs.map(r => `${r.name}: ${r.reason}`).join("\n\n")
            : raw
        );
      } catch {
        setAiRec(raw);
      }
    } catch {
      setAiRec("Something went wrong. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const compareTools = compareList.map(id => allTools.find(t => t.id === id)).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col font-sans text-gray-900">
      <Navbar />

      {/* ── HERO ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <Link href="/learn" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-medium mb-6 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to Learn
          </Link>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-violet-600 bg-violet-50 border border-violet-200 px-3 py-1 rounded-full">Tools & Resources</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{allTools.length} tools</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-3">AR/VR Tools Directory</h1>
              <p className="text-gray-500 text-lg max-w-xl">Every tool you need to build spatial experiences — curated, rated, and explained.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-xl border transition-all ${viewMode === "grid" ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-200 text-gray-400"}`}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              </button>
              <button onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-xl border transition-all ${viewMode === "list" ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-200 text-gray-400"}`}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
            </div>
          </div>
          <div className="flex gap-6 mt-8 pt-6 border-t border-gray-100">
            {[
              { label: "Tools",             value: allTools.length },
              { label: "Free tools",        value: allTools.filter(t => t.pricing.includes("Free")).length },
              { label: "Beginner friendly", value: allTools.filter(t => t.level === "Beginner friendly").length },
              { label: "Categories",        value: TOOLS.length },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 w-full flex-grow">
        <div className="flex gap-8">

          {/* ── SIDEBAR ── */}
          <div className="w-56 shrink-0 space-y-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Search</p>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Unity, WebXR..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-violet-400 transition-colors" />
              </div>
            </div>

            <button onClick={() => setShowOnlyBookmarks(!showOnlyBookmarks)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${showOnlyBookmarks ? "bg-amber-50 border-amber-300 text-amber-700 font-semibold" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>
              <svg width="14" height="14" fill={showOnlyBookmarks ? "#d97706" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
              Saved ({bookmarks.size})
            </button>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Level</p>
              <div className="space-y-1">
                {ALL_LEVELS.map(l => (
                  <button key={l} onClick={() => setActiveLevel(activeLevel === l ? null : l)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeLevel === l ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Pricing</p>
              <div className="space-y-1">
                {["Free", "Freemium", "Paid"].map(p => (
                  <button key={p} onClick={() => setActivePricing(activePricing === p ? null : p)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${activePricing === p ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TAGS.slice(0, 20).map(tag => (
                  <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    className={`text-xs px-2 py-1 rounded-full border transition-all ${activeTag === tag ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-gray-200 text-gray-500 hover:border-violet-300"}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {(search || activeTag || activeLevel || activePricing || showOnlyBookmarks) && (
              <button onClick={() => { setSearch(""); setActiveTag(null); setActiveLevel(null); setActivePricing(null); setShowOnlyBookmarks(false); }}
                className="w-full text-xs text-gray-400 hover:text-gray-700 py-2 border border-gray-200 rounded-lg transition-colors">
                Clear all filters
              </button>
            )}
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="flex-1 min-w-0 space-y-10">

            {/* ── AI Tool Recommender ── */}
            <div className="bg-white border border-violet-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900">AI Tool Recommender</p>
                <span className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full">GPT-4o mini</span>
              </div>
              <div className="flex gap-2">
                <input value={aiGoal} onChange={e => setAiGoal(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && getAiRec()}
                  placeholder="What do you want to build? e.g. AR app for Android..."
                  className="flex-1 bg-gray-50 border border-gray-200 focus:border-violet-400 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors" />
                <button onClick={getAiRec} disabled={!aiGoal.trim() || aiLoading}
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors shrink-0">
                  {aiLoading ? "..." : "Recommend →"}
                </button>
              </div>
              <AnimatePresence>
                {aiRec && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3 bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-violet-900 leading-relaxed whitespace-pre-line">
                    {aiRec}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {totalFiltered === allTools.length ? `All ${allTools.length} tools` : `${totalFiltered} of ${allTools.length} tools`}
                {compareList.length > 0 && <span className="ml-3 text-violet-600 font-semibold">{compareList.length} selected to compare</span>}
              </p>
              {compareList.length >= 2 && (
                <button onClick={() => setDetailTool({ compare: true })}
                  className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-violet-700 transition-colors">
                  Compare {compareList.length} tools →
                </button>
              )}
            </div>

            {/* Tool sections */}
            {filtered.map(section => (
              <div key={section.category}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">{section.emoji}</span>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{section.category}</p>
                  <span className="text-xs text-gray-300">({section.items.length})</span>
                </div>

                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.items.map((tool, idx) => (
                      <motion.div key={tool.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                        <div onClick={() => setDetailTool(tool)}
                          className={`bg-white rounded-2xl border cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${compareList.includes(tool.id) ? "border-violet-400 ring-2 ring-violet-200" : "border-gray-200"} ${tool.featured ? "ring-1 ring-amber-200" : ""}`}>
                          {tool.featured && (
                            <div className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 text-center tracking-wide">★ FEATURED</div>
                          )}
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 p-1" style={{ background: tool.color }}>
                                  <ToolLogo tool={tool} />
                                </div>
                                <div>
                                  <h3 className="font-black text-gray-900 text-sm">{tool.name}</h3>
                                  <StarRating rating={tool.rating} />
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={e => toggleBookmark(tool.id, e)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                  <svg width="14" height="14" fill={bookmarks.has(tool.id) ? "#f59e0b" : "none"} viewBox="0 0 24 24" stroke={bookmarks.has(tool.id) ? "#f59e0b" : "#9ca3af"} strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                                </button>
                                <button onClick={e => toggleCompare(tool.id, e)}
                                  className={`p-1.5 rounded-lg transition-colors ${compareList.includes(tool.id) ? "bg-violet-100" : "hover:bg-gray-100"}`}>
                                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={compareList.includes(tool.id) ? "#7c3aed" : "#9ca3af"} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                                </button>
                              </div>
                            </div>
                            <div className="flex gap-2 mb-3 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${LEVEL_STYLES[tool.level]}`}>{tool.level}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRICING_STYLES[tool.pricing] ?? "bg-gray-100 text-gray-600"}`}>{tool.pricing}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{tool.users}</span>
                            </div>
                            <p className="text-gray-500 text-xs leading-relaxed mb-3">{tool.desc}</p>
                            <div className="flex flex-wrap gap-1">
                              {tool.tags.slice(0, 4).map(t => (
                                <span key={t} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {section.items.map(tool => (
                      <div key={tool.id} onClick={() => setDetailTool(tool)}
                        className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 p-1" style={{ background: tool.color }}>
                          <ToolLogo tool={tool} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm text-gray-900">{tool.name}</p>
                            {tool.featured && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">Featured</span>}
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${LEVEL_STYLES[tool.level]}`}>{tool.level}</span>
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{tool.desc}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <StarRating rating={tool.rating} />
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRICING_STYLES[tool.pricing] ?? "bg-gray-100 text-gray-600"}`}>{tool.pricing}</span>
                          <button onClick={e => toggleBookmark(tool.id, e)} className="p-1 rounded hover:bg-gray-100">
                            <svg width="14" height="14" fill={bookmarks.has(tool.id) ? "#f59e0b" : "none"} viewBox="0 0 24 24" stroke={bookmarks.has(tool.id) ? "#f59e0b" : "#9ca3af"} strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {totalFiltered === 0 && (
              <div className="text-center py-20">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-gray-400 font-medium">No tools match your filters</p>
                <button onClick={() => { setSearch(""); setActiveTag(null); setActiveLevel(null); setActivePricing(null); }} className="mt-3 text-sm text-violet-600 hover:underline">Clear filters</button>
              </div>
            )}

            <div className="bg-gray-900 rounded-2xl p-8 text-center">
              <p className="text-xl font-black text-white mb-2">Want to learn any of these?</p>
              <p className="text-gray-400 text-sm mb-5">Join a live session or book a 1-on-1 mentor on SYNTHÉ</p>
              <div className="flex gap-3 justify-center">
                <Link href="/learn" className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-colors">Browse sessions</Link>
                <Link href="/hire" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors border border-white/20">Book mentor</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      <AnimatePresence>
        {detailTool && !detailTool.compare && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setDetailTool(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center p-1.5" style={{ background: detailTool.color }}>
                    <ToolLogo tool={detailTool} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">{detailTool.name}</h2>
                    <StarRating rating={detailTool.rating} />
                  </div>
                </div>
                <button onClick={() => setDetailTool(null)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="flex gap-2 mb-4 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${LEVEL_STYLES[detailTool.level]}`}>{detailTool.level}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PRICING_STYLES[detailTool.pricing] ?? "bg-gray-100 text-gray-600"}`}>{detailTool.pricing}</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{detailTool.users} users</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">{detailTool.longDesc}</p>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-green-700 mb-2">Pros</p>
                  {detailTool.pros?.map((p: string) => <p key={p} className="text-xs text-green-800 flex gap-1.5 mb-1"><span>✓</span>{p}</p>)}
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-red-700 mb-2">Cons</p>
                  {detailTool.cons?.map((c: string) => <p key={c} className="text-xs text-red-800 flex gap-1.5 mb-1"><span>✗</span>{c}</p>)}
                </div>
              </div>
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Use cases</p>
                <div className="flex flex-wrap gap-2">
                  {detailTool.useCases?.map((u: string) => <span key={u} className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-full">{u}</span>)}
                </div>
              </div>
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {detailTool.tags.map((t: string) => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>)}
                </div>
              </div>
              <div className="flex gap-2">
                <a href={detailTool.link} target="_blank" rel="noopener noreferrer"
                  className="flex-1 text-center py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors">
                  Visit {detailTool.name} →
                </a>
                <button onClick={e => toggleBookmark(detailTool.id, e)}
                  className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${bookmarks.has(detailTool.id) ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  {bookmarks.has(detailTool.id) ? "Saved ★" : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COMPARE MODAL ── */}
      <AnimatePresence>
        {detailTool?.compare && compareTools.length >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setDetailTool(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-gray-900">Compare tools</h2>
                <button onClick={() => setDetailTool(null)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className={`grid gap-4 ${compareTools.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {compareTools.map((tool: any) => (
                  <div key={tool.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center p-1" style={{ background: tool.color }}>
                        <ToolLogo tool={tool} />
                      </div>
                      <p className="font-black text-sm text-gray-900">{tool.name}</p>
                    </div>
                    <StarRating rating={tool.rating} />
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-gray-400">Level</span><span className="font-medium text-gray-700">{tool.level}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Pricing</span><span className="font-medium text-gray-700">{tool.pricing}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Users</span><span className="font-medium text-gray-700">{tool.users}</span></div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-bold text-gray-400 mb-1.5">Pros</p>
                      {tool.pros?.slice(0, 3).map((p: string) => <p key={p} className="text-xs text-gray-600 flex gap-1 mb-0.5"><span className="text-green-500">✓</span>{p}</p>)}
                    </div>
                    <a href={tool.link} target="_blank" rel="noopener noreferrer"
                      className="mt-3 block text-center text-xs py-2 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition-colors">
                      Visit →
                    </a>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}