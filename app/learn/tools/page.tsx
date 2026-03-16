"use client";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";

const TOOLS = [
  {
    category: "Game Engines",
    items: [
      { name: "Unity",          desc: "Most popular engine for AR/VR. AR Foundation supports ARCore + ARKit in one codebase.", tags: ["AR","VR","Mobile","PC"],              link: "https://unity.com",                          color: "#1a1a1a", level: "Beginner friendly" },
      { name: "Unreal Engine",  desc: "Best for high-fidelity VR. Photorealistic graphics, used in AAA games and enterprise VR.", tags: ["VR","PC","Enterprise"],              link: "https://unrealengine.com",                    color: "#0d0d0d", level: "Intermediate"      },
    ],
  },
  {
    category: "AR Frameworks",
    items: [
      { name: "ARCore",   desc: "Google's AR platform for Android. Motion tracking, environment understanding, light estimation.", tags: ["Android","Mobile","AR"], link: "https://developers.google.com/ar",             color: "#4285F4", level: "Intermediate"      },
      { name: "ARKit",    desc: "Apple's AR framework for iOS. Best AR on iPhone and iPad. World tracking + face tracking.",      tags: ["iOS","Mobile","AR"],     link: "https://developer.apple.com/augmented-reality",color: "#555555", level: "Intermediate"      },
      { name: "Vuforia",  desc: "Image target and object recognition AR. Great for industrial and educational applications.",      tags: ["Android","iOS","Unity"], link: "https://developer.vuforia.com",                color: "#e67e22", level: "Beginner friendly" },
    ],
  },
  {
    category: "WebXR & Browser AR/VR",
    items: [
      { name: "WebXR",    desc: "W3C standard for AR/VR in the browser. No app install. Works in Chrome Android + Safari iOS 16+.",tags: ["Browser","AR","VR","No install"],  link: "https://immersiveweb.dev",   color: "#5B4BDB", level: "Intermediate"      },
      { name: "A-Frame",  desc: "HTML framework for building VR on the web. Easiest entry point to WebVR development.",           tags: ["Browser","VR","HTML"],             link: "https://aframe.io",          color: "#ef2d5e", level: "Beginner friendly" },
      { name: "8th Wall", desc: "WebAR in any mobile browser, no app needed. Surface tracking, image targets, face effects.",     tags: ["Browser","AR","No install"],       link: "https://8thwall.com",        color: "#00c4b3", level: "Beginner friendly" },
      { name: "Spark AR", desc: "Meta's AR platform for Instagram and Facebook filters. Largest AR creator community.",           tags: ["Social AR","Instagram"],           link: "https://sparkar.facebook.com",color: "#1877F2",level: "Beginner friendly" },
    ],
  },
  {
    category: "3D Modelling",
    items: [
      { name: "Blender",         desc: "Free and open source 3D creation suite. Modelling, animation, rendering, VFX.",        tags: ["3D","Free","Open source"],  link: "https://blender.org",          color: "#E87D0D", level: "Intermediate"      },
      { name: "Gravity Sketch",  desc: "VR-native 3D design tool. Design directly in virtual reality. Product and character design.", tags: ["VR","Design","3D"],     link: "https://gravitysketch.com",    color: "#6B48FF", level: "Beginner friendly" },
    ],
  },
  {
    category: "Headsets & Platforms",
    items: [
      { name: "Meta Quest",        desc: "Standalone VR by Meta. No PC needed. Most popular VR platform. Quest 3 supports mixed reality.",    tags: ["VR","MR","Standalone"], link: "https://meta.com/quest",                  color: "#0064E0", level: "Consumer device" },
      { name: "Apple Vision Pro",  desc: "Spatial computing headset. visionOS apps with SwiftUI and RealityKit. Passthrough mixed reality.", tags: ["MR","visionOS"],        link: "https://apple.com/apple-vision-pro",      color: "#1d1d1f", level: "Advanced"         },
    ],
  },
];

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  "Beginner friendly": { bg: "#E1F5EE", text: "#0F6E56" },
  "Intermediate":      { bg: "#EEEDFE", text: "#3C3489" },
  "Advanced":          { bg: "#FAECE7", text: "#712B13" },
  "Consumer device":   { bg: "#E6F1FB", text: "#0C447C" },
};

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-14 flex-grow w-full">

        <div className="mb-10">
          <Link href="/learn" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm font-semibold mb-5 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to Learn
          </Link>
          <p className="text-xs font-bold uppercase tracking-widest text-[#5B4BDB] mb-2">Tools & Resources</p>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-3">AR/VR tools directory</h1>
          <p className="text-gray-500 text-lg max-w-xl">Every tool you need to build AR and VR — from beginner to professional.</p>
        </div>

        <div className="space-y-10">
          {TOOLS.map(section => (
            <div key={section.category}>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{section.category}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.items.map(tool => {
                  const lc = LEVEL_COLORS[tool.level] ?? { bg: "#F1EFE8", text: "#444441" };
                  return (
                    <a key={tool.name} href={tool.link} target="_blank" rel="noopener noreferrer"
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 block">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                            style={{ background: tool.color }}>
                            {tool.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900">{tool.name}</h3>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: lc.bg, color: lc.text }}>
                              {tool.level}
                            </span>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm leading-relaxed mb-3">{tool.desc}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tool.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">{t}</span>
                        ))}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-2xl border border-[#5B4BDB]/20 bg-[#5B4BDB]/5 text-center">
          <p className="font-black text-gray-900 mb-2">Want to learn any of these?</p>
          <p className="text-gray-500 text-sm mb-4">Join a live session or book a 1-on-1 mentor on SYNTHÉ</p>
          <Link href="/learn">
            <button className="px-6 py-3 rounded-xl bg-[#5B4BDB] text-white font-bold text-sm border-b-[3px] border-[#4438b8] hover:bg-[#4c3ec7] transition-all active:translate-y-[1px]">
              Browse sessions
            </button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}