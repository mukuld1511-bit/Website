"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

const GALLERY_DROPDOWN = [
  { label: "All Models", href: "/gallery",           desc: "Browse everything" },
  { label: "3D Models",  href: "/gallery?mode=3d",   desc: "GLB · GLTF · OBJ · FBX" },
  { label: "AR",         href: "/gallery?mode=ar",   desc: "Augmented Reality" },
  { label: "VR",         href: "/gallery?mode=vr",   desc: "Virtual Reality" },
  { label: "AutoCAD",    href: "/autocad",           desc: "DWG · DXF Files" },
];

const MOBILE_PLATFORM = [
  { label: "AutoCAD",      href: "/autocad",       icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" },
  { label: "Connect",      href: "/connect",       icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "GYOP",         href: "/gyop",          icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { label: "Certification",href: "/certification", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
  { label: "Upload Model", href: "/upload",        icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
  { label: "PIET Collab",  href: "/collaborators", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
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
    const fn = () => setScrolled(window.scrollY > 10);
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

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(href.split("?")[0]));
  }

  const linkCls = (active: boolean) =>
    `px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition duration-200 ${
      active
        ? "text-blue-700 bg-blue-50"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    }`;

  function DropItem({ item, onClose }: { item: typeof GALLERY_DROPDOWN[0]; onClose: () => void }) {
    return (
      <Link href={item.href} onClick={onClose}>
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition duration-150 cursor-pointer">
          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <div>
            <p className="text-gray-900 text-sm font-semibold">{item.label}</p>
            <p className="text-gray-500 text-[11px]">{item.desc}</p>
          </div>
        </div>
      </Link>
    );
  }

  const dropPanel = "absolute top-full mt-2 left-0 w-64 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-50 py-2";
  const dropAnim  = { initial: { opacity:0, y:-4, scale:0.98 }, animate: { opacity:1, y:0, scale:1 }, exit: { opacity:0, y:-4, scale:0.98 }, transition: { duration:0.15 } };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200" : "bg-white border-b border-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900">
              SYNTHÉ
            </span>
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
                    {GALLERY_DROPDOWN.map(item => <DropItem key={item.href} item={item} onClose={() => setGalleryOpen(false)} />)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/autocad"><button className={linkCls(isActive("/autocad"))}>AutoCAD</button></Link>
            <Link href="/requests/open"><button className={linkCls(isActive("/requests/open"))}>Public Requests</button></Link>

            <Link href="/connect"><button className={linkCls(isActive("/connect"))}>Connect</button></Link>
            <Link href="/gyop"><button className={linkCls(isActive("/gyop"))}>GYOP</button></Link>
            <Link href="/certification"><button className={linkCls(isActive("/certification"))}>Certification</button></Link>
            <Link href="/collaborators"><button className={linkCls(isActive("/collaborators"))}>PIET</button></Link>
          </div>

          {/* Auth */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div ref={profileRef} className="relative">
                <button onClick={() => setProfileOpen(v => !v)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-gray-200 hover:bg-gray-50 transition duration-200">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    {user.photoURL
                      ? <img src={user.photoURL} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : <span className="text-gray-500 text-xs font-bold">{user.displayName?.[0] ?? "U"}</span>
                    }
                  </div>
                  <span className="text-gray-700 text-sm font-semibold max-w-[100px] truncate">{user.displayName ?? "User"}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div {...dropAnim}
                      className="absolute top-full mt-2 right-0 w-56 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-50 py-1">
                      {[
                        { label:"Dashboard",    href:"/dashboard",     icon:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
                        { label:"Profile",      href:"/profile",       icon:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                        { label:"Upload Model", href:"/upload",        icon:"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
                        { label:"Public Requests", href:"/requests/open", icon:"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
                        { label:"GYOP",         href:"/gyop",          icon:"M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
                      ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setProfileOpen(false)}>
                          <div className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition cursor-pointer text-gray-700 hover:text-blue-600 group">
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                            </svg>
                            <span className="text-sm font-medium">{item.label}</span>
                          </div>
                        </Link>
                      ))}
                      <div className="h-[1px] bg-gray-100 my-1" />
                      <button onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition cursor-pointer text-gray-700 hover:text-red-600 group">
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-sm font-medium">Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <button className="px-4 py-2 rounded-lg text-gray-600 text-sm font-semibold hover:text-gray-900 transition hover:bg-gray-50">
                    Sign In
                  </button>
                </Link>
                <Link href="/join">
                  <button className="px-5 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm text-sm font-bold transition">
                    Get Started Free
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button onClick={() => setMobileOpen(v => !v)}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            transition={{ duration:0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-lg">
            <div className="p-4 flex flex-col gap-2 max-h-[80vh] overflow-y-auto">

              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 pt-2 pb-1">Menu</p>

              {GALLERY_DROPDOWN.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition cursor-pointer text-gray-700">
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                </Link>
              ))}

              <Link href="/requests/open" onClick={() => setMobileOpen(false)}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition cursor-pointer text-gray-700">
                  <span className="text-sm font-semibold">Public Requests</span>
                </div>
              </Link>

              {MOBILE_PLATFORM.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition cursor-pointer text-gray-700">
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                </Link>
              ))}

              <div className="h-[1px] bg-gray-100 my-2" />

              {/* Auth */}
              {user ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3 px-3 py-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      {user.photoURL
                        ? <img src={user.photoURL} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        : <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">{user.displayName?.[0]}</div>
                      }
                    </div>
                    <div>
                      <p className="text-gray-900 text-sm font-bold">{user.displayName}</p>
                      <p className="text-gray-500 text-xs">{user.email}</p>
                    </div>
                  </div>
                  {[
                    { href:"/dashboard",    label:"Dashboard" },
                    { href:"/profile",      label:"Profile" },
                    { href:"/upload",       label:"Upload Model" },
                  ].map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                      <div className="px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium transition">
                        {item.label}
                      </div>
                    </Link>
                  ))}
                  <button onClick={logout}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-600 text-sm font-medium transition">
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 py-3 px-3">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <div className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold text-center hover:bg-gray-50 transition">
                      Sign In
                    </div>
                  </Link>
                  <Link href="/join" onClick={() => setMobileOpen(false)}>
                    <div className="w-full py-3 rounded-lg bg-blue-600 text-white text-sm font-bold text-center hover:bg-blue-700 transition shadow-sm">
                      Get Started Free
                    </div>
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