"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

interface NavLink {
  label: string;
  href: string;
  desc: string;
  icon: string;
  badge?: string;
}

const GALLERY_LINKS: NavLink[] = [
  { label: "Browse 3D Verse", href: "/verse",         desc: "GLB, GLTF, OBJ, FBX marketplace", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { label: "Upload Model",    href: "/verse/upload",  desc: "Sell your 3D models on SYNTHÉ",   icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
  { label: "Post a Request",  href: "/requests/post", desc: "Commission a custom 3D model",    icon: "M12 4v16m8-8H4" },
];

const XR_ZONE_LINKS: NavLink[] = [
  { label: "AR Projects",  href: "/xr-zone",           desc: "Browse augmented reality builds", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { label: "VR Projects",  href: "/xr-zone",           desc: "Browse virtual reality builds",   icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2" },
  { label: "Upload AR",    href: "/xr-zone/ar/upload", desc: "Publish your AR application",     icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12", badge: "AR" },
  { label: "Upload VR",    href: "/xr-zone/vr/upload", desc: "Publish your VR application",     icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12", badge: "VR" },
];

const LEARN_LINKS: NavLink[] = [
  { label: "Live Sessions",   href: "/learn",            desc: "Free AR/VR workshops by mentors",   icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z", badge: "Free" },
  { label: "XR Roadmap",      href: "/learn/roadmap",    desc: "AI-personalised learning path",      icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7", badge: "AI" },
  { label: "Tools Directory", href: "/learn/tools",      desc: "48 AR/VR tools, rated & filtered",   icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", badge: "New" },
  { label: "1-on-1 Mentors",  href: "/hire",             desc: "Book a private paid session",        icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "XR Challenges",   href: "/learn/challenges", desc: "Build projects, earn badges",         icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
  { label: "Student Showcase",href: "/learn/showcase",   desc: "Community work gallery",              icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
];

const FREELANCE_LINKS: NavLink[] = [
  { label: "Post a Project",   href: "/requests/post", desc: "Get bids from XR specialists",     icon: "M12 4v16m8-8H4" },
  { label: "Open Requests",    href: "/requests/open", desc: "Browse client project requests",   icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { label: "Hire a Developer", href: "/hire",          desc: "Book verified XR specialists",     icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
];

const CONNECT_LINKS: NavLink[] = [
  { label: "Connect",        href: "/connect",       desc: "Chat and network with creators",   icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { label: "Certification",  href: "/certification", desc: "Get verified, earn badge",          icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
];

const BADGE_STYLES: Record<string, string> = {
  "AI":   "bg-violet-100 text-violet-700 border border-violet-200",
  "New":  "bg-amber-100 text-amber-700 border border-amber-200",
  "Free": "bg-green-100 text-green-700 border border-green-200",
  "AR":   "bg-teal-100 text-teal-700 border border-teal-200",
  "VR":   "bg-violet-100 text-violet-700 border border-violet-200",
};

interface DropdownProps {
  title: string;
  links: NavLink[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  showGeminiBadge?: boolean;
}

function Dropdown({ title, links, isOpen, onToggle, onClose, showGeminiBadge }: DropdownProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
          isOpen ? "text-[#5B4BDB]" : "text-gray-600 hover:text-gray-900"
        }`}
      >
        {title}
        {showGeminiBadge && <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
        <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-72 rounded-xl bg-white border border-gray-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.12)] z-50 p-2"
          >
            {links.map((item) => (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400 group-hover:bg-[#5B4BDB]/10 group-hover:text-[#5B4BDB] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-gray-900 text-sm font-bold group-hover:text-[#5B4BDB] transition-colors">
                        {item.label}
                      </p>
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${BADGE_STYLES[item.badge] ?? ""}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              </Link>
            ))}

            {showGeminiBadge && (
              <div className="mx-2 mb-1 mt-1 p-3 rounded-lg bg-violet-50 border border-violet-100">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-violet-700">Gemini AI is built into Learn</p>
                </div>
                <p className="text-xs text-violet-500 mt-1 ml-7">Roadmaps, tool chat, and XR Q&A</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const [user,           setUser]           = useState<any>(null);
  const [scrolled,       setScrolled]       = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [profileOpen,    setProfileOpen]    = useState(false);

  const pathname   = usePathname();
  const router     = useRouter();
  const navRef     = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setActiveDropdown(null);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
    setProfileOpen(false);
  }, [pathname]);

  async function logout() {
    await signOut(auth);
    router.push("/");
  }

  const toggle = (name: string) =>
    setActiveDropdown((prev) => (prev === name ? null : name));

  // Mobile — all sections flat
  const ALL_MOBILE_SECTIONS = [
    { section: "3D Verse",  links: GALLERY_LINKS   },
    { section: "Freelance",   links: FREELANCE_LINKS },
    { section: "Connect",     links: CONNECT_LINKS   },
  ];

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 h-14 md:h-16 flex items-center transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200"
            : "bg-white border-b border-gray-100"
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="font-black text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-pink-500">
              SYNTHÉ
            </span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-pink-500 to-orange-400 text-white -rotate-3">
              BETA
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">

            {/* 3D Gallery dropdown */}
            <Dropdown
              title="3D Verse"
              links={GALLERY_LINKS}
              isOpen={activeDropdown === "3D Verse"}
              onToggle={() => toggle("3D Verse")}
              onClose={() => setActiveDropdown(null)}
            />

            {/* AutoCAD — direct link, no dropdown */}
            <Link href="/autocad">
              <button className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                AutoCAD
              </button>
            </Link>

            {/* XR Zone dropdown */}
            <Dropdown
              title="XR Zone"
              links={XR_ZONE_LINKS}
              isOpen={activeDropdown === "XR Zone"}
              onToggle={() => toggle("XR Zone")}
              onClose={() => setActiveDropdown(null)}
            />

            {/* Learn — direct link, no dropdown */}
            <Link href="/learn">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                Learn
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              </button>
            </Link>

            {/* Freelance — direct link, no dropdown */}
            <Link href="/freelance">
              <button className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                Freelance
              </button>
            </Link>

            {/* Connect dropdown */}
            <Dropdown
              title="Connect"
              links={CONNECT_LINKS}
              isOpen={activeDropdown === "Connect"}
              onToggle={() => toggle("Connect")}
              onClose={() => setActiveDropdown(null)}
            />

            {/* PIET — direct link, no dropdown */}
            <Link href="/collaborators">
              <button className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                PIET
              </button>
            </Link>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {user ? (
              <div ref={profileRef} className="relative hidden lg:block">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-pink-400 flex-shrink-0 flex items-center justify-center">
                    {user.photoURL
                      ? <img src={user.photoURL} className="w-full h-full object-cover" alt="" />
                      : <span className="text-white text-xs font-bold">{user.displayName?.[0] ?? "U"}</span>
                    }
                  </div>
                  <span className="text-gray-800 text-sm font-bold max-w-[90px] truncate">
                    {user.displayName?.split(" ")[0] ?? "User"}
                  </span>
                  <svg className={`w-3 h-3 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.96 }}
                      transition={{ duration: 0.14 }}
                      className="absolute top-full mt-3 right-0 w-52 rounded-2xl border border-gray-100 bg-white shadow-xl z-50 p-2"
                    >
                      {[
                        { label: "Dashboard",   href: "/dashboard",         icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
                        { label: "Profile",     href: "/profile",           icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                        { label: "Upload",      href: "/upload",            icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
                        { label: "My sessions", href: "/dashboard/learner", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
                      ].map((item) => (
                        <Link key={item.href} href={item.href} onClick={() => setProfileOpen(false)}>
                          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-[#5B4BDB] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                            </svg>
                            <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                          </div>
                        </Link>
                      ))}
                      <div className="h-px bg-gray-100 my-1.5 mx-2" />
                      <button onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors group">
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-red-600">Sign out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link href="/login">
                  <button className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all">
                    Sign in
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-[#5B4BDB] hover:bg-[#4c3ec7] border-b-[3px] border-[#4438b8] transition-all active:translate-y-[1px]">
                    Get started
                  </button>
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 bg-white flex flex-col pt-16 h-[100dvh] overflow-y-auto"
          >
            <div className="p-6 space-y-8 flex-1">

              {/* AutoCAD direct */}
              <div>
                <p className="text-[10px] font-black tracking-[0.18em] text-[#5B4BDB] uppercase mb-3">AutoCAD</p>
                <Link href="/autocad" onClick={() => setMobileOpen(false)}>
                  <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#5B4BDB] group-hover:bg-[#5B4BDB]/10 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">AutoCAD Files</p>
                      <p className="text-xs text-gray-400">Browse DWG and DXF blueprints</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Learn direct */}
              <div>
                <p className="text-[10px] font-black tracking-[0.18em] text-[#5B4BDB] uppercase mb-3">Learn</p>
                <Link href="/learn" onClick={() => setMobileOpen(false)}>
                  <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#5B4BDB] group-hover:bg-[#5B4BDB]/10 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">Learning Hub</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 border border-violet-200">AI</span>
                      </div>
                      <p className="text-xs text-gray-400">Sessions, roadmap, tools & more</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* PIET direct */}
              <div>
                <p className="text-[10px] font-black tracking-[0.18em] text-[#5B4BDB] uppercase mb-3">PIET</p>
                <Link href="/collaborators" onClick={() => setMobileOpen(false)}>
                  <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#5B4BDB] group-hover:bg-[#5B4BDB]/10 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">PIET Collaborators</p>
                      <p className="text-xs text-gray-400">Academic collaboration</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Other sections */}
              {ALL_MOBILE_SECTIONS.map(({ section, links }) => (
                <div key={section}>
                  <p className="text-[10px] font-black tracking-[0.18em] text-[#5B4BDB] uppercase mb-3">{section}</p>
                  <div className="space-y-0.5">
                    {links.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                        <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400 group-hover:text-[#5B4BDB] group-hover:bg-[#5B4BDB]/10 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-gray-900">{item.label}</p>
                              {item.badge && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${BADGE_STYLES[item.badge] ?? ""}`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">{item.desc}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 pb-10">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-pink-400 flex-shrink-0">
                      {user.photoURL
                        ? <img src={user.photoURL} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">{user.displayName?.[0] ?? "U"}</div>
                      }
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{user.displayName}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    <button className="w-full py-3 rounded-xl font-bold text-sm bg-[#5B4BDB] text-white border-b-[3px] border-[#4438b8] mb-2">Dashboard</button>
                  </Link>
                  <button onClick={logout} className="w-full py-3 rounded-xl font-bold text-sm bg-white border border-red-200 text-red-600">Sign out</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link href="/join" onClick={() => setMobileOpen(false)}>
                    <button className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#5B4BDB] text-white border-b-[3px] border-[#4438b8]">Get started</button>
                  </Link>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <button className="w-full py-3.5 rounded-xl font-bold text-sm bg-white border border-gray-200 text-gray-700">Sign in</button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}