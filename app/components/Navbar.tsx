"use client";
 
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from "firebase/firestore";
 
// Navigation categories
const NAV_ITEMS = [
  {
    label: "Browse",
    links: [
      { label: "3D Gallery", href: "/gallery", icon: "📦" },
      { label: "Marketplace", href: "/gallery", icon: "🛍️" },
    ]
  },
  {
    label: "Learn",
    links: [
      { label: "Workshops", href: "/learn", icon: "🎓" },
      { label: "Book Mentor", href: "/hire", icon: "👨‍🏫" },
    ]
  },
  {
    label: "Create",
    links: [
      { label: "Upload Model", href: "/upload", icon: "⚡" },
      { label: "Scene Composer", href: "/scene-composer", icon: "🎨" },
    ]
  },
];
 
export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
 
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
 
  // Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return () => unsub();
  }, []);
 
  // Notifications
  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );
 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: any) => !n.read).length);
    });
 
    return () => unsubscribe();
  }, [user]);
 
  // Scroll effect
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
 
  // Close menus on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
 
  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };
 
  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200" : "bg-white border-b border-gray-100"
        } h-16 flex items-center`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
 
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-lg">S</span>
            </div>
            <span className="font-black text-2xl text-gray-900 hidden sm:inline">Synthé</span>
          </Link>
 
          {/* CENTER NAV */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <div key={item.label} className="relative group">
                <button className="text-gray-700 font-bold text-sm hover:text-gray-900 transition flex items-center gap-1">
                  {item.label}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
 
                {/* Dropdown */}
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl border border-gray-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2">
                  {item.links.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <div className="px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition">
                        <span className="text-lg">{link.icon}</span>
                        <span className="text-gray-900 font-bold text-sm">{link.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
 
          {/* RIGHT SECTION */}
          <div className="flex items-center gap-4">
 
            {/* NOTIFICATIONS */}
            {user && (
              <div ref={notifRef} className="relative hidden md:block">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-black flex items-center justify-center">
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
                      className="absolute top-full mt-3 right-0 w-80 rounded-2xl bg-white border border-gray-200 shadow-xl z-50"
                    >
                      <div className="p-4 border-b sticky top-0 bg-white rounded-t-2xl">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        <p className="text-xs text-gray-500">{unreadCount} unread</p>
                      </div>
 
                      <div className="max-h-96 overflow-y-auto p-2">
                        {notifications.length === 0 ? (
                          <p className="text-center text-gray-500 text-sm py-6">No notifications</p>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-3 rounded-lg mb-2 cursor-pointer transition ${
                                notif.read ? "bg-gray-50" : "bg-blue-50"
                              }`}
                              onClick={async () => {
                                if (!notif.read) {
                                  await updateDoc(doc(db, "notifications", notif.id), { read: true });
                                }
                              }}
                            >
                              <p className="font-bold text-gray-900 text-sm truncate">{notif.title}</p>
                              <p className="text-gray-600 text-xs mt-1">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
 
                      {notifications.length > 0 && (
                        <div className="p-3 border-t bg-gray-50 rounded-b-2xl">
                          <Link href="/notifications" className="text-center block text-sm font-bold text-blue-600 hover:text-blue-700">
                            View All →
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
 
            {/* PROFILE */}
            {user ? (
              <div ref={profileRef} className="relative hidden md:block">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition"
                >
                  <img 
                    src={user.photoURL || "/avatar.png"} 
                    className="w-8 h-8 rounded-full object-cover" 
                    alt="Profile" 
                  />
                  <span className="text-gray-800 text-sm font-bold max-w-[80px] truncate hidden sm:inline">
                    {user.displayName ?? "User"}
                  </span>
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
 
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full mt-3 right-0 w-56 rounded-2xl bg-white border border-gray-200 shadow-lg z-50 p-2"
                    >
                      {[
                        { label: "Dashboard", href: "/dashboard", icon: "📊" },
                        { label: "Profile", href: "/profile", icon: "👤" },
                        { label: "Upload", href: "/upload", icon: "📤" },
                        { label: "Apply Role", href: "/join", icon: "✨" },
                      ].map((item) => (
                        <Link key={item.href} href={item.href} onClick={() => setProfileOpen(false)}>
                          <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition text-gray-700 hover:text-gray-900 font-bold">
                            <span className="text-lg">{item.icon}</span>
                            <span className="text-sm">{item.label}</span>
                          </div>
                        </Link>
                      ))}
 
                      <div className="h-px bg-gray-100 my-2" />
 
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-lg transition text-red-600 hover:text-red-700 font-bold"
                      >
                        <span className="text-lg">🚪</span>
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link href="/login">
                  <button className="px-4 py-2 text-gray-600 font-bold text-sm hover:text-gray-900 transition">
                    Sign In
                  </button>
                </Link>
                <Link href="/join">
                  <button className="px-5 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition">
                    Join Free 🚀
                  </button>
                </Link>
              </div>
            )}
 
            {/* MOBILE MENU */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
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
 
      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 z-40 bg-white pt-20 pb-10 overflow-y-auto md:hidden"
          >
            <div className="px-6 space-y-8">
              {/* Navigation items */}
              {NAV_ITEMS.map((category) => (
                <div key={category.label}>
                  <p className="text-xs font-black text-gray-400 uppercase mb-4">{category.label}</p>
                  {category.links.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 py-3 text-gray-900 hover:text-blue-600 transition">
                        <span className="text-lg">{link.icon}</span>
                        <span className="font-bold">{link.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
 
              <div className="h-px bg-gray-100" />
 
              {/* Auth buttons */}
              {!user && (
                <div className="space-y-3">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full py-3 border border-gray-200 text-gray-900 font-bold rounded-lg hover:bg-gray-50 transition">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/join" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">
                      Join Free 🚀
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* SPACER */}
      <div className="h-16" />
    </>
  );
}