"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

// ── Category-specific dropdowns replacing the old single 'Explore' ────────────
const JEWELLERY_LINKS = [
  { label: "High-end Jewellery", href: "/gallery?mode=3d&genre=jewellery", desc: "View VR Try-On rings & necklaces", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  { label: "Upload Design", href: "/upload", desc: "Sell your luxury CAD designs", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
];

const XR_DEV_LINKS = [
  { label: "Spatial Apps",    href: "/gallery?mode=ar&genre=app",  desc: "AR utilities & Enterprise tools", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { label: "Architecture",    href: "/gallery?mode=vr&genre=app",  desc: "VR walkthroughs & training",    icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "Commission App",  href: "/requests/post",              desc: "Request a custom XR solution",  icon: "M12 4v16m8-8H4" },
];

const GALLERY_3D_LINKS = [
  { label: "3D Model Gallery",  href: "/gallery",              desc: "GLB, GLTF, OBJ & FBX models",     icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { label: "Upload 3D Model",   href: "/upload",               desc: "Share GLB, OBJ, FBX files",        icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
  { label: "Open Requests",     href: "/requests/open",        desc: "Commission a custom 3D model",    icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
];

const AUTOCAD_LINKS = [
  { label: "AutoCAD Hub",       href: "/autocad",              desc: "Browse DWG & DXF blueprints",     icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" },
  { label: "Upload CAD File",   href: "/upload",               desc: "Upload your DWG / DXF file",      icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
  { label: "PIET Collaboration", href: "/collaborators",       desc: "Academic CAD partnership",        icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" },
];

const LEARN_CONNECT_LINKS = [
  { label: "Connect & Learn",  href: "/connect",        desc: "Network with peers",           icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "Project Board",    href: "/requests/open",  desc: "Find collaborations",          icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { label: "Post a Project",   href: "/requests/post",  desc: "Start a new collaboration",    icon: "M12 4v16m8-8H4" },
  { label: "Mentorship",       href: "/hire",           desc: "Book 1-on-1 sessions",         icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Live Workshops",   href: "/learn",          desc: "Join online learning events",  icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" }
];

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  
  const navRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
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
    setMobileMenuOpen(false); 
    setActiveDropdown(null);
    setProfileOpen(false);
  }, [pathname]);

  async function logout() {
    await signOut(auth);
    router.push("/");
  }

  function DropdownPanel({ title, links }: { title: string, links: { label: string; href: string; desc: string; icon: string }[] }) {
    const isOpen = activeDropdown === title;
    return (
      <div className="relative">
        <button 
          onClick={() => setActiveDropdown(isOpen ? null : title)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${isOpen ? "text-[#5B4BDB]" : "text-gray-600 hover:text-gray-900"}`}
        >
          {title}
          <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-80 rounded-xl bg-white border border-gray-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden z-50 p-2"
            >
              <div className="flex flex-col gap-1">
                {links.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setActiveDropdown(null)}>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer group">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#5B4BDB]/10 group-hover:text-[#5B4BDB] text-gray-500 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon}/></svg>
                      </div>
                      <div>
                        <p className="text-gray-900 text-sm font-bold group-hover:text-[#5B4BDB] transition">{item.label}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <>
      <nav 
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200" : "bg-white border-b border-gray-100"} h-14 md:h-16 flex items-center`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          
          {/* LEFT: Logo area */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
            <span className="font-black text-3xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-pink-500 group-hover:from-pink-500 group-hover:to-orange-400 transition-colors duration-500">SYNTHÉ</span>
            <span className="hidden sm:inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-[10px] font-black tracking-widest uppercase bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-sm transform -rotate-3 hover:rotate-0 transition-transform">
              <span className="relative z-10">BETA</span>
            </span>
          </Link>

          {/* CENTER: Separate section dropdowns */}
          <div className="hidden lg:flex items-center gap-0.5">
            {/* 💍 Jewellery Models */}
            <DropdownPanel title="Jewellery Models" links={JEWELLERY_LINKS} />
            {/* 📱 XR Dev */}
            <DropdownPanel title="XR Development" links={XR_DEV_LINKS} />
            {/* Divider */}
            <span className="w-px h-4 bg-gray-200 mx-1" />
            {/* 📦 3D Gallery */}
            <DropdownPanel title="3D Gallery" links={GALLERY_3D_LINKS} />
            {/* 📐 AutoCAD */}
            <DropdownPanel title="AutoCAD" links={AUTOCAD_LINKS} />
            {/* Divider */}
            <span className="w-px h-4 bg-gray-200 mx-1" />
            <DropdownPanel title="Learn & Connect" links={LEARN_CONNECT_LINKS} />
            <Link href="/collaborators" className="px-3 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">PIET</Link>
          </div>

            {/* RIGHT: Auth & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            {user ? (
              <div ref={profileRef} className="relative hidden lg:block">
                <button onClick={() => setProfileOpen(v => !v)}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border-2 border-transparent hover:border-gray-200 hover:bg-gray-50 transition duration-200 active:scale-95">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-pink-400 flex-shrink-0 flex items-center justify-center shadow-inner">
                    {user.photoURL
                      ? <img src={user.photoURL} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : <span className="text-white text-xs font-bold">{user.displayName?.[0] ?? "U"}</span>
                    }
                  </div>
                  <span className="text-gray-800 text-sm font-bold max-w-[100px] truncate">{user.displayName ?? "User"}</span>
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div initial={{ opacity:0, y:5, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:5, scale:0.95 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="absolute top-full mt-3 right-0 w-60 rounded-2xl border-2 border-gray-100 bg-white shadow-2xl overflow-hidden z-50 p-2">
                      {[
                        { label:"Dashboard",       href:"/dashboard",     icon:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", color: "text-blue-500",   bg: "bg-blue-50" },
                        { label:"Profile",         href:"/profile",       icon:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",                                                                                    color: "text-purple-500", bg: "bg-purple-50" },
                        { label:"Notifications",   href:"/notifications", icon:"M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", color: "text-amber-500",  bg: "bg-amber-50" },
                        { label:"Upload Model",    href:"/upload",        icon:"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",                                                                                          color: "text-pink-500",   bg: "bg-pink-50" },
                        { label:"⭐ Certification", href:"/certification", icon:"M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", color: "text-yellow-500", bg: "bg-yellow-50" },
                        { label:"🏛️ PIET Collab",   href:"/collaborators", icon:"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5",             color: "text-violet-500", bg: "bg-violet-50" },
                      ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setProfileOpen(false)}>
                          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition cursor-pointer text-gray-700 hover:text-gray-900 group font-bold">
                            <div className={`p-1.5 rounded-lg ${item.bg} group-hover:scale-110 transition-transform`}>
                              <svg className={`w-4 h-4 ${item.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} /></svg>
                            </div>
                            <span className="text-sm">{item.label}</span>
                          </div>
                        </Link>
                      ))}
                      <div className="h-[2px] bg-gray-50 my-2 mx-2" />
                      <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition cursor-pointer text-gray-700 hover:text-red-600 group font-bold">
                        <div className="p-1.5 rounded-lg bg-red-50 group-hover:scale-110 transition-transform">
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </div>
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <Link href="/login">
                  <button className="px-5 py-2.5 rounded-xl text-gray-600 text-sm font-bold hover:text-gray-900 transition hover:bg-gray-100 active:scale-95">
                    Sign In
                  </button>
                </Link>
                <Link href="/join">
                  <button className="px-6 py-2.5 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-500 border-b-[3px] border-blue-800 hover:border-blue-600 active:border-b-0 active:translate-y-[3px] shadow-sm text-sm transition-all transform hover:scale-105">
                    Get Started 🚀
                  </button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Trigger */}
            <button onClick={() => setMobileMenuOpen(v => !v)} className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-in Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 bg-white flex flex-col pt-16 h-[100dvh]"
          >
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Mobile Menu Sections */}
              <div className="space-y-6">
                {/* 💍 Jewellery */}
                <div>
                  <p className="text-xs font-black tracking-[0.2em] text-[#5B4BDB] uppercase mb-4">Jewellery Models</p>
                  {JEWELLERY_LINKS.map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-4 group mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#5B4BDB]/10 group-hover:text-[#5B4BDB]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon}/></svg></div>
                        <div>
                          <p className="text-base font-bold text-gray-900 group-hover:text-[#5B4BDB]">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* 📱 XR Dev */}
                <div>
                  <p className="text-xs font-black tracking-[0.2em] text-[#5B4BDB] uppercase mb-4">XR Development</p>
                  {XR_DEV_LINKS.map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-4 group mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#5B4BDB]/10 group-hover:text-[#5B4BDB]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon}/></svg></div>
                        <div>
                          <p className="text-base font-bold text-gray-900 group-hover:text-[#5B4BDB]">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* 📦 3D Gallery */}
                <div>
                  <p className="text-xs font-black tracking-[0.2em] text-[#5B4BDB] uppercase mb-4">3D Gallery</p>
                  {GALLERY_3D_LINKS.map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-4 group mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#5B4BDB]/10 group-hover:text-[#5B4BDB]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon}/></svg></div>
                        <div>
                          <p className="text-base font-bold text-gray-900 group-hover:text-[#5B4BDB]">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* 📐 AutoCAD */}
                <div>
                  <p className="text-xs font-black tracking-[0.2em] text-[#5B4BDB] uppercase mb-4">AutoCAD</p>
                  {AUTOCAD_LINKS.map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-4 group mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#5B4BDB]/10 group-hover:text-[#5B4BDB]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon}/></svg></div>
                        <div>
                          <p className="text-base font-bold text-gray-900 group-hover:text-[#5B4BDB]">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="h-[1px] bg-gray-100" />

              <div className="space-y-4">
                <p className="text-xs font-black tracking-[0.2em] text-[#5B4BDB] uppercase">Learn & Connect</p>
                {LEARN_CONNECT_LINKS.map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center gap-4 group mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#5B4BDB]/10 group-hover:text-[#5B4BDB]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon}/></svg></div>
                      <div>
                        <p className="text-base font-bold text-gray-900 group-hover:text-[#5B4BDB]">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="h-[1px] bg-gray-100" />

              <div className="h-[1px] bg-gray-100" />
              <Link href="/collaborators" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-4 group py-2">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#5B4BDB]/10 group-hover:text-[#5B4BDB]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5"/></svg></div>
                  <div>
                    <p className="text-base font-bold text-gray-900 group-hover:text-[#5B4BDB]">PIET</p>
                    <p className="text-xs text-gray-500">Academic Collaboration</p>
                  </div>
                </div>
              </Link>

            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 pb-10">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                        {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-300"></div>}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{user.displayName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}><button className="w-full py-3.5 rounded-xl font-bold bg-white border border-gray-200 text-gray-900 shadow-sm mb-3">Dashboard</button></Link>
                  <button onClick={logout} className="w-full py-3.5 rounded-xl font-bold bg-white border border-red-200 text-red-600 shadow-sm">Sign Out</button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/join" onClick={() => setMobileMenuOpen(false)}><button className="w-full py-4 rounded-xl font-bold bg-[#5B4BDB] text-white shadow-sm">Get Started</button></Link>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}><button className="w-full py-4 rounded-xl font-bold bg-white border border-gray-200 text-gray-900 shadow-sm">Sign In</button></Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}