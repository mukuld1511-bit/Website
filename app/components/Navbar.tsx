"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from "firebase/firestore";

const ASSET_LINKS = [
  { label: "3D Models", href: "/gallery", desc: "Browse high-end assets", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { label: "Upload Asset", href: "/upload", desc: "Sell your 3D designs", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
  { label: "Scene Composer", href: "/scene-composer", desc: "Stage multiple models", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
];

const XR_DEV_LINKS = [
  { label: "Spatial Apps", href: "/gallery?mode=ar&genre=app", desc: "AR & Enterprise tools", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { label: "Architecture", href: "/gallery?mode=vr&genre=app", desc: "VR walkthroughs", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "Commission", href: "/requests/post", desc: "Request XR solution", icon: "M12 4v16m8-8H4" },
];

const GALLERY_3D_LINKS = [
  { label: "3D Gallery", href: "/gallery", desc: "GLB, GLTF, OBJ & FBX", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { label: "Upload Model", href: "/upload", desc: "Share GLB, OBJ, FBX", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
  { label: "Requests", href: "/requests/open", desc: "Custom model commissions", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
];

const AUTOCAD_LINKS = [
  { label: "AutoCAD Hub", href: "/autocad", desc: "DWG & DXF blueprints", icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" },
  { label: "Upload CAD", href: "/upload", desc: "Upload DWG / DXF", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
  { label: "PIET Partner", href: "/collaborators", desc: "Academic collaboration", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" },
];

const LEARN_CONNECT_LINKS = [
  { label: "Learn Hub", href: "/learn", desc: "Free workshops & mentorship", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
  { label: "Book Mentor", href: "/hire", desc: "1-on-1 sessions", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Forge", href: "/forge", desc: "Live collaboration", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { label: "Connect", href: "/connect", desc: "Network with peers", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { label: "Challenges", href: "/learn/challenges", desc: "Coding & design challenges", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
];

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(8)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: any) => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setActiveDropdown(null);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotificationsOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    setProfileOpen(false);
  }, [pathname]);

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/gallery?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", !darkMode ? "dark" : "light");
  };

  function DropdownPanel({ title, links }: { title: string; links: any[] }) {
    const isOpen = activeDropdown === title;
    return (
      <div className="relative">
        <button
          onClick={() => setActiveDropdown(isOpen ? null : title)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${
            isOpen ? "text-[#5B4BDB]" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {title}
          <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-80 rounded-xl bg-white border border-gray-100 shadow-lg z-50 p-2"
            >
              {links.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setActiveDropdown(null)}>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#5B4BDB]/10 text-gray-500 group-hover:text-[#5B4BDB] transition">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-900 text-sm font-bold">{item.label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200" : "bg-white border-b border-gray-100"
        } h-16 flex items-center`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">

          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <span className="font-black text-3xl tracking-tighter bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">
              SYNTHÉ
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-gradient-to-r from-pink-500 to-orange-400 text-white transform -rotate-3">
              BETA
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-0.5">
            <DropdownPanel title="3D Assets" links={ASSET_LINKS} />
            <DropdownPanel title="XR Dev" links={XR_DEV_LINKS} />
            <span className="w-px h-4 bg-gray-200 mx-1" />
            <DropdownPanel title="3D Gallery" links={GALLERY_3D_LINKS} />
            <DropdownPanel title="AutoCAD" links={AUTOCAD_LINKS} />
            <span className="w-px h-4 bg-gray-200 mx-1" />
            <DropdownPanel title="Learn" links={LEARN_CONNECT_LINKS} />
            <Link href="/collaborators" className="px-3 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
              PIET
            </Link>
          </div>

          <div className="flex items-center gap-3">

            {user && (
              <div ref={searchRef} className="relative hidden md:block">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute top-full mt-3 right-0 w-80 rounded-xl border border-gray-200 bg-white shadow-lg z-50"
                    >
                      <form onSubmit={handleSearch} className="p-4 border-b">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search models, people, workshops..."
                          autoFocus
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/10 text-sm"
                        />
                      </form>
                      <div className="p-4">
                        {searchQuery ? (
                          <p className="text-center text-gray-500 text-sm py-6">
                            Searching for "{searchQuery}"...
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 text-center">Type to search</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {user && (
              <div ref={notifRef} className="relative hidden md:block">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition relative"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full mt-3 right-0 w-96 max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg z-50"
                    >
                      <div className="p-4 border-b sticky top-0 bg-white">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        <p className="text-xs text-gray-500">{unreadCount} unread</p>
                      </div>
                      <div className="p-2 space-y-2">
                        {notifications.length === 0 ? (
                          <p className="text-center text-gray-500 text-sm py-8">No notifications</p>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`flex items-start gap-3 p-3 rounded-lg transition cursor-pointer hover:bg-gray-50 ${
                                notif.read ? "bg-gray-50" : "bg-blue-50"
                              }`}
                              onClick={async () => {
                                if (!notif.read) {
                                  await updateDoc(doc(db, "notifications", notif.id), { read: true });
                                }
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 text-sm truncate">{notif.title}</p>
                                <p className="text-gray-600 text-xs mt-0.5">{notif.message}</p>
                              </div>
                              {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-3 border-t bg-gray-50">
                          <Link href="/notifications" className="text-center block text-sm font-bold text-[#5B4BDB]">
                            View All →
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {user && (
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition hidden md:block"
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v1m0 16v1m9-9h-1m-16 0H1m15.364 1.636l.707-.707M6.343 17.657l-.707-.707m12.728 0l-.707.707M6.343 6.343l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
            )}

            {user ? (
              <div ref={profileRef} className="relative hidden lg:block">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full border border-transparent hover:border-gray-300 transition"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-pink-400 flex items-center justify-center">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold">{user.displayName?.[0] ?? "U"}</span>
                    )}
                  </div>
                  <span className="text-gray-800 text-sm font-bold truncate max-w-[100px]">
                    {user.displayName ?? "User"}
                  </span>
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full mt-3 right-0 w-60 rounded-xl border border-gray-100 bg-white shadow-lg z-50 p-2"
                    >
                      {[
                        { label: "Dashboard", href: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", color: "text-blue-500", bg: "bg-blue-50" },
                        { label: "Profile", href: "/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "text-purple-500", bg: "bg-purple-50" },
                        { label: "Upload", href: "/upload", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12", color: "text-pink-500", bg: "bg-pink-50" },
                        { label: "Scene", href: "/scene-composer", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z", color: "text-teal-500", bg: "bg-teal-50" },
                      ].map((item) => (
                        <Link key={item.href} href={item.href} onClick={() => setProfileOpen(false)}>
                          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition group font-bold">
                            <div className={`p-1.5 rounded-lg ${item.bg}`}>
                              <svg className={`w-4 h-4 ${item.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
                              </svg>
                            </div>
                            <span className="text-sm">{item.label}</span>
                          </div>
                        </Link>
                      ))}
                      <div className="h-[1px] bg-gray-100 my-2" />
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition text-gray-700 hover:text-red-600 font-bold"
                      >
                        <div className="p-1.5 rounded-lg bg-red-50">
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
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
                  <button className="px-5 py-2 rounded-lg text-gray-600 font-bold hover:bg-gray-100 text-sm transition">
                    Sign In
                  </button>
                </Link>
                <Link href="/join">
                  <button className="px-6 py-2 rounded-lg font-black text-white bg-blue-600 hover:bg-blue-700 text-sm shadow-sm active:scale-95 transition">
                    Get Started 🚀
                  </button>
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 bg-white pt-20 pb-10 overflow-y-auto"
          >
            <div className="p-6 space-y-8">
              {[
                { title: "3D Assets", links: ASSET_LINKS },
                { title: "XR Dev", links: XR_DEV_LINKS },
                { title: "3D Gallery", links: GALLERY_3D_LINKS },
                { title: "AutoCAD", links: AUTOCAD_LINKS },
                { title: "Learn", links: LEARN_CONNECT_LINKS },
              ].map((section) => (
                <div key={section.title}>
                  <p className="text-xs font-black text-[#5B4BDB] uppercase mb-4">{section.title}</p>
                  {section.links.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 mb-4 group">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-[#5B4BDB]/10 group-hover:text-[#5B4BDB] transition">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}

              <div className="h-[1px] bg-gray-100" />

              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-pink-400">
                      {user.photoURL && <img src={user.photoURL} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{user.displayName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full py-3 rounded-lg font-bold bg-white border border-gray-200 text-gray-900">
                      Dashboard
                    </button>
                  </Link>
                  <button onClick={logout} className="w-full py-3 rounded-lg font-bold bg-white border border-red-200 text-red-600">
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link href="/join" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full py-3 rounded-lg font-bold bg-blue-600 text-white">
                      Get Started
                    </button>
                  </Link>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full py-3 rounded-lg font-bold bg-white border border-gray-200 text-gray-900">
                      Sign In
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-16" />
    </>
  );
}