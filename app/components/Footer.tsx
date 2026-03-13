"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { name: "3D Galleria", href: "/gallery" },
  { name: "Connect & Learn", href: "/connect" },
  { name: "Public Requests", href: "/requests/open" },
  { name: "Developer Profiles", href: "/connect" }
];

export default function Footer() {
  const pathname = usePathname();
  // Don't render footer on chat pages to maximize chat height
  if (pathname?.startsWith("/project-chat") || pathname?.startsWith("/dashboard/messages")) return null;

  return (
    <footer className="bg-gray-50 border-t border-gray-200 text-gray-700 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-16">

          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="font-extrabold text-2xl tracking-tighter text-gray-900">
                SYNTHÉ
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
              A collaborative ecosystem where creators share immersive 3D, AR and VR experiences while clients connect with experts to build the future of spatial technology.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-xs">Platform</h3>
            <ul className="space-y-4">
              {links.map((item, i) => (
                <li key={i}>
                  <Link href={item.href} className="text-gray-500 text-sm hover:text-blue-600 font-medium transition duration-200">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Collaborators */}
          <div>
            <h3 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-xs">Collaborators</h3>
            <p className="text-gray-500 text-sm mb-4">Developed in collaboration with</p>
            <div className="p-5 rounded-xl border border-gray-200 bg-white inline-block shadow-sm">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <strong className="text-gray-900 text-sm font-bold">AR / VR Studio @ PIET</strong>
              </div>
              <span className="text-gray-500 text-xs block">Piet Innovation & Emerging Technology Lab</span>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-gray-200 mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-xs font-medium">© {new Date().getFullYear()} SYNTHÉ. All rights reserved.</p>
          <p className="text-gray-400 text-xs font-medium">Built for the future of immersive technology</p>
        </div>
      </div>
    </footer>
  );
}