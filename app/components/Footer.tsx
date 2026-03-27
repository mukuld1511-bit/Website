"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  // Don't render footer on chat pages to maximize chat height
  if (pathname?.startsWith("/project-chat") || pathname?.startsWith("/dashboard/messages")) return null;

  return (
    <footer className="bg-[#07060B] border-t border-[#2A2A3E] text-[#6B6B85] py-20 px-6 relative z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* TOP SECTION: 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          
          {/* Column 1: Brand & Socials */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="inline-block group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#5B4BDB] shadow-[0_0_20px_rgba(91,75,219,0.3)] border border-[#7C6EF6]/30 group-hover:shadow-[0_0_30px_rgba(91,75,219,0.5)] transition-shadow">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 5h16l-6 7 6 7H4l6-7-6-7z" />
                  </svg>
                </div>
                <span className="font-display font-extrabold text-2xl tracking-tighter text-white">
                  SYNTHÉ
                </span>
              </div>
            </Link>
            <p className="text-[#9494AD] text-sm leading-relaxed max-w-sm font-medium">
              The operating system for spatial creators and AR/VR developers. Build the future.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-[#141420] border border-[#2A2A3E] flex items-center justify-center text-[#6B6B85] hover:border-[#5B4BDB]/40 hover:text-[#A594FF] transition-all group">
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#141420] border border-[#2A2A3E] flex items-center justify-center text-[#6B6B85] hover:border-[#5B4BDB]/40 hover:text-[#A594FF] transition-all group">
                <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#141420] border border-[#2A2A3E] flex items-center justify-center text-[#6B6B85] hover:border-[#5B4BDB]/40 hover:text-[#A594FF] transition-all group">
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#141420] border border-[#2A2A3E] flex items-center justify-center text-[#6B6B85] hover:border-[#5B4BDB]/40 hover:text-[#A594FF] transition-all group">
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              </a>
            </div>
          </div>

          {/* Column 2: Platform */}
          <div>
            <h3 className="font-bold text-white mb-6 uppercase tracking-[0.15em] text-xs">Platform</h3>
            <ul className="space-y-3">
              <li><Link href="/gallery" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">3D Gallery</Link></li>
              <li><Link href="/autocad" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">AutoCAD Hub</Link></li>
              <li><Link href="/gallery?mode=ar&genre=game" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">XR Games & Apps</Link></li>
              <li><Link href="/asset-library" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">Unity Asset Library</Link></li>
              <li><Link href="/learn" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">Live Workshops</Link></li>
              <li><Link href="/requests/open" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">Open Projects</Link></li>
              <li><Link href="/upload" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">Upload Creation</Link></li>
            </ul>
          </div>

          {/* Column 3: Learn */}
          <div>
            <h3 className="font-bold text-white mb-6 uppercase tracking-[0.15em] text-xs">Learn</h3>
            <ul className="space-y-3">
              <li><Link href="/learn" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">Learning Paths</Link></li>
              <li><Link href="/connect" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">Connect & Network</Link></li>
              <li><Link href="/certification" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">Get Certified</Link></li>
              <li><Link href="/collaborators" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">PIET Collaboration</Link></li>
              <li><Link href="/gyop" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">Start a Project</Link></li>
              <li><Link href="/join?role=developer" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">Apply as Creator</Link></li>
            </ul>
          </div>

          {/* Column 4: Account */}
          <div>
            <h3 className="font-bold text-white mb-6 uppercase tracking-[0.15em] text-xs">Account</h3>
            <ul className="space-y-3">
              <li><Link href="/dashboard" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">Dashboard</Link></li>
              <li><Link href="/profile" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">My Profile</Link></li>
              <li><Link href="/notifications" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">Notifications</Link></li>
              <li><Link href="/login" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">Sign In</Link></li>
              <li><Link href="/join" className="text-[#6B6B85] text-sm hover:text-[#A594FF] font-medium transition duration-200">Join Free</Link></li>
            </ul>
          </div>

        </div>

        {/* DIVIDER */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#2A2A3E] to-transparent mb-8" />

        {/* BOTTOM BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#4A4A60] text-xs font-semibold">
            © 2026 SYNTHÉ. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B4BDB] shadow-[0_0_10px_rgba(91,75,219,0.5)]" />
            <p className="text-[#4A4A60] text-[11px] font-bold uppercase tracking-[0.2em]">
              Built in collaboration with AR/VR Studio @ PIET
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}