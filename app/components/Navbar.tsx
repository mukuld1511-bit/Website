"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

const GALLERY_DROPDOWN = [
  { label: "All Models", href: "/gallery",           color: "#a78bfa", desc: "Browse everything" },
  { label: "3D Models",  href: "/gallery?mode=3d",   color: "#22d3ee", desc: "GLB · GLTF · OBJ · FBX" },
  { label: "AR",         href: "/gallery?mode=ar",   color: "#34d399", desc: "Augmented Reality" },
  { label: "VR",         href: "/gallery?mode=vr",   color: "#818cf8", desc: "Virtual Reality" },
  { label: "AutoCAD",    href: "/autocad",           color: "#fbbf24", desc: "DWG · DXF Files" },
];


const MOBILE_PLATFORM = [
  { label: "AutoCAD",      href: "/autocad",       icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",                                                                                                                                                                                                                                                          color: "#fbbf24" },
  { label: "Developers",   href: "/connect",       icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",                                                                                                                                                  color: "#22d3ee" },
  { label: "GYOP",         href: "/gyop",          icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",                                                                                                                                                                                                     color: "#fb7185" },
  { label: "Certification",href: "/certification", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", color: "#fbbf24" },
  { label: "Upload Model", href: "/upload",        icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",                                                                                                                                                                                                                                                                                                color: "#34d399" },
  { label: "PIET Collab",  href: "/collaborators", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",                                                                                                         color: "#818cf8" },
];

export default function Navbar() {
  const [user,          setUser]          = useState<any>(null);
  const [scrolled,      setScrolled]      = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [galleryOpen,   setGalleryOpen]   = useState(false);

  const [profileOpen,   setProfileOpen]   = useState(false);

  const pathname     = usePathname();
  const router       = useRouter();
  const galleryRef   = useRef<HTMLDivElement>(null);

  const profileRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (galleryRef.current   && !galleryRef.current.contains(e.target as Node))   setGalleryOpen(false);
      if (profileRef.current   && !profileRef.current.contains(e.target as Node))   setProfileOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function logout() {
    await signOut(auth);
    router.push("/");
  }

  const navBg: React.CSSProperties = scrolled
    ? { background: "rgba(5,0,8,0.88)", backdropFilter: "blur(20px)", borderColor: "rgba(167,139,250,0.12)" }
    : { background: "transparent",      backdropFilter: "blur(12px)",  borderColor: "transparent" };

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(href.split("?")[0]));
  }

  const linkCls = (active: boolean, accent = "violet") =>
    `px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition duration-200 ${
      active
        ? accent === "amber"   ? "text-amber-300 bg-amber-500/10"
        : accent === "cyan"    ? "text-cyan-300 bg-cyan-500/10"
        : accent === "rose"    ? "text-rose-300 bg-rose-500/10"
        : accent === "emerald" ? "text-emerald-300 bg-emerald-500/10"
        : "text-violet-300 bg-violet-500/12"
        : "text-white/50 hover:text-white/80 hover:bg-white/5"
    }`;

  function DropItem({ item, onClose }: { item: typeof GALLERY_DROPDOWN[0]; onClose: () => void }) {
    return (
      <Link href={item.href} onClick={onClose}>
        <motion.div whileHover={{ x: 3 }} style={{ willChange: "transform" }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition duration-150 cursor-pointer group">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${item.color}18`, border: `1px solid ${item.color}25` }}>
            <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
          </div>
          <div>
            <p className="text-white/80 text-xs font-bold group-hover:text-white transition duration-150">{item.label}</p>
            <p className="text-white/25 text-[10px]">{item.desc}</p>
          </div>
        </motion.div>
      </Link>
    );
  }

  const dropPanel = "absolute top-full mt-2 left-0 w-64 rounded-2xl border border-white/8 bg-[#0a0012] backdrop-blur-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-50";
  const dropAnim  = { initial: { opacity:0, y:-8, scale:0.97 }, animate: { opacity:1, y:0, scale:1 }, exit: { opacity:0, y:-8, scale:0.97 }, transition: { duration:0.2 } };

  return (
    <>
      <nav className="fixed top-4 left-4 right-4 z-50 rounded-2xl border transition-all duration-500" style={navBg}>
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">

          {/* Logo - Yellow/Gold SYNTHÉ */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="h-8 flex items-center justify-center flex-shrink-0">
              <span className="font-black text-2xl tracking-tight" style={{
                color: "#FFD700",
                textShadow: "0 0 20px rgba(255, 215, 0, 0.4)",
                letterSpacing: "0.05em",
                fontStyle: "italic"
              }}>
                SYNTHÉ
              </span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">

            {/* Gallery dropdown */}
            <div ref={galleryRef} className="relative">
              <button onClick={() => { setGalleryOpen(v => !v); }}
                className={`flex items-center gap-1.5 ${linkCls(isActive("/gallery"))}`}>
                Gallery
                <svg className={`w-3 h-3 transition-transform duration-200 ${galleryOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <AnimatePresence>
                {galleryOpen && (
                  <motion.div {...dropAnim} className={dropPanel}>
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.4),transparent)" }} />
                    <div className="p-2">
                      {GALLERY_DROPDOWN.map(item => <DropItem key={item.href} item={item} onClose={() => setGalleryOpen(false)} />)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* AutoCAD standalone button */}
            <Link href="/autocad">
              <button className={`flex items-center gap-1.5 ${linkCls(isActive("/autocad"), "amber")}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                </svg>
                AutoCAD
              </button>
            </Link>



            {/* Public Requests */}
            <Link href="/requests/open">
              <button className={linkCls(isActive("/requests/open"), "emerald")}>
                Public Requests
              </button>
            </Link>

            {/* Post Request */}
            <Link href="/requests/post">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-white"
                style={{ background: "linear-gradient(135deg,#7c3aed,#0891b2)", boxShadow: "0 0 16px rgba(124,58,237,0.25)" }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Post Request
              </motion.button>
            </Link>

            {/* Developers */}
            <Link href="/connect">
              <button className={linkCls(isActive("/connect"), "cyan")}>Developers</button>
            </Link>

            {/* GYOP */}
            <Link href="/gyop">
              <button className={linkCls(isActive("/gyop"), "rose")}>GYOP</button>
            </Link>

            {/* Certification */}
            <Link href="/certification">
              <button className={`flex items-center gap-1.5 ${linkCls(isActive("/certification"), "amber")}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Certification
              </button>
            </Link>

            {/* PIET */}
            <Link href="/collaborators">
              <button className={linkCls(isActive("/collaborators"), "cyan")}>PIET</button>
            </Link>
          </div>

          {/* Auth */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div ref={profileRef} className="relative">
                <button onClick={() => setProfileOpen(v => !v)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-white/8 hover:border-violet-500/30 hover:bg-violet-500/8 transition duration-200">
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 bg-white/[0.05] flex-shrink-0 flex items-center justify-center">
                    {user.photoURL
                      ? <img src={user.photoURL} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : <span className="text-white/40 text-[10px] font-black">{user.displayName?.[0] ?? "U"}</span>
                    }
                  </div>
                  <span className="text-white/70 text-xs font-semibold max-w-[100px] truncate">{user.displayName ?? "User"}</span>
                  <svg className={`w-3 h-3 text-white/30 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div {...dropAnim}
                      className="absolute top-full mt-2 right-0 w-56 rounded-2xl border border-white/8 bg-[#0a0012] backdrop-blur-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-50">
                      <div className="absolute top-0 left-0 right-0 h-[1px]"
                        style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.4),transparent)" }} />
                      <div className="p-2">
                        {[
                          { label:"Dashboard",    href:"/dashboard",     icon:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
                          { label:"Profile",      href:"/profile",       icon:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                          { label:"Upload Model", href:"/upload",        icon:"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
                          { label:"Public Requests", href:"/requests/open", icon:"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
                          { label:"GYOP",         href:"/gyop",          icon:"M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
                        ].map(item => (
                          <Link key={item.href} href={item.href} onClick={() => setProfileOpen(false)}>
                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition duration-150 cursor-pointer group">
                              <svg className="w-4 h-4 text-white/25 group-hover:text-violet-400 transition duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                              </svg>
                              <span className="text-white/60 text-xs font-semibold group-hover:text-white transition duration-150">{item.label}</span>
                            </div>
                          </Link>
                        ))}
                        <div className="h-[1px] bg-white/5 my-1" />
                        <button onClick={logout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-500/8 transition duration-150 group">
                          <svg className="w-4 h-4 text-white/25 group-hover:text-rose-400 transition duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span className="text-white/60 text-xs font-semibold group-hover:text-rose-400 transition duration-150">Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} style={{ willChange:"transform" }}
                    className="px-4 py-2 rounded-xl text-white/60 text-xs font-bold hover:text-white transition duration-200 cursor-pointer">
                    Sign In
                  </motion.div>
                </Link>
                <Link href="/join">
                  <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                    style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                    className="px-4 py-2 rounded-xl text-white text-xs font-black relative overflow-hidden cursor-pointer">
                    <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2, repeat:Infinity, repeatDelay:5, ease:"linear" }}
                      style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                    <span className="relative z-10">Get Started</span>
                  </motion.div>
                </Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button onClick={() => setMobileOpen(v => !v)}
            className="lg:hidden w-10 h-10 rounded-xl border border-white/8 flex flex-col items-center justify-center gap-1.5 hover:border-violet-500/30 hover:bg-violet-500/8 transition duration-200">
            <motion.div animate={mobileOpen ? { rotate:45, y:7 }   : { rotate:0, y:0 }}   style={{ willChange:"transform" }} className="w-4 h-[1.5px] bg-white/70 rounded-full" />
            <motion.div animate={mobileOpen ? { opacity:0 }        : { opacity:1 }}        style={{ willChange:"opacity" }}    className="w-4 h-[1.5px] bg-white/70 rounded-full" />
            <motion.div animate={mobileOpen ? { rotate:-45, y:-7 } : { rotate:0, y:0 }}   style={{ willChange:"transform" }} className="w-4 h-[1.5px] bg-white/70 rounded-full" />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            transition={{ duration:0.3 }}
            className="fixed top-24 left-4 right-4 z-40 rounded-2xl border border-white/8 bg-[#080010] backdrop-blur-xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
            <div className="absolute top-0 left-0 right-0 h-[1px]"
              style={{ background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.3),transparent)" }} />

            <div className="p-4 flex flex-col gap-1 max-h-[80vh] overflow-y-auto">

              {/* Gallery section */}
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 px-3 pt-1 pb-2">Gallery</p>
              {GALLERY_DROPDOWN.map((item, i) => (
                <motion.div key={item.href} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.25, delay:i*0.04 }}>
                  <Link href={item.href} onClick={() => setMobileOpen(false)}>
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition duration-150 cursor-pointer">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:`${item.color}18` }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background:item.color }} />
                      </div>
                      <div>
                        <p className="text-white/80 text-sm font-bold">{item.label}</p>
                        <p className="text-white/25 text-[10px]">{item.desc}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}

              <div className="h-[1px] bg-white/5 my-1" />

              {/* Requests section */}
              <motion.div initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.25, delay:0.18 }}>
                <Link href="/requests/open" onClick={() => setMobileOpen(false)}>
                  <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition duration-150 cursor-pointer">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:"#a78bfa18" }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background:"#a78bfa" }} />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm font-bold">Public Requests</p>
                      <p className="text-white/25 text-[10px]">Browse open client projects</p>
                    </div>
                  </div>
                </Link>
              </motion.div>

              <div className="h-[1px] bg-white/5 my-1" />

              {/* Platform section */}
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 px-3 pt-1 pb-2">Platform</p>
              {MOBILE_PLATFORM.map((item, i) => (
                <motion.div key={item.href} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.25, delay:0.36+i*0.04 }}>
                  <Link href={item.href} onClick={() => setMobileOpen(false)}>
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition duration-150 cursor-pointer">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background:`${item.color}18`, border:`1px solid ${item.color}20` }}>
                        <svg className="w-3.5 h-3.5" style={{ color:item.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                      </div>
                      <span className="text-white/70 text-sm font-semibold">{item.label}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}

              <div className="h-[1px] bg-white/5 my-2" />

              {/* Auth */}
              {user ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3 px-3 py-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                      {user.photoURL
                        ? <img src={user.photoURL} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        : <div className="w-full h-full bg-violet-500/20 flex items-center justify-center text-violet-300 text-xs font-black">{user.displayName?.[0]}</div>
                      }
                    </div>
                    <div>
                      <p className="text-white/80 text-sm font-bold">{user.displayName}</p>
                      <p className="text-white/30 text-xs">{user.email}</p>
                    </div>
                  </div>
                  {[
                    { href:"/dashboard",    label:"Dashboard" },
                    { href:"/profile",      label:"Profile" },
                    { href:"/upload",       label:"Upload Model" },
                    { href:"/requests/post",label:"Post Request" },
                    { href:"/gyop",         label:"GYOP" },
                  ].map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                      <div className="px-3 py-2.5 rounded-xl hover:bg-white/5 text-white/60 text-sm font-semibold cursor-pointer transition duration-150">
                        {item.label}
                      </div>
                    </Link>
                  ))}
                  <button onClick={logout}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-rose-500/8 text-rose-400/80 text-sm font-semibold transition duration-150">
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <div className="px-4 py-3 rounded-xl border border-white/8 text-white/60 text-sm font-bold text-center cursor-pointer hover:border-white/15 transition duration-200">
                      Sign In
                    </div>
                  </Link>
                  <Link href="/join" onClick={() => setMobileOpen(false)}>
                    <motion.div whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                      style={{ willChange:"transform", background:"linear-gradient(135deg,#7c3aed,#0891b2)" }}
                      className="px-4 py-3 rounded-xl text-white text-sm font-black text-center cursor-pointer relative overflow-hidden">
                      <motion.div animate={{ x:["-200%","200%"] }} transition={{ duration:2, repeat:Infinity, repeatDelay:5, ease:"linear" }}
                        style={{ willChange:"transform", position:"absolute", inset:0, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)", transform:"skewX(-20deg)", pointerEvents:"none" }} />
                      <span className="relative z-10">Get Started Free</span>
                    </motion.div>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
    </>
  );
}