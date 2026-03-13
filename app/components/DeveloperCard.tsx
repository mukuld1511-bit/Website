"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function DeveloperCard({ dev, index = 0 }: any) {
  const isCertified = dev.certified;
  const skills = Array.isArray(dev.skills) ? dev.skills.join(", ") : dev.skills;

  return (
    <Link href={`/developer/${dev.userId || dev.id}`} style={{ textDecoration: "none" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay: index * 0.05 }}
        whileHover={{ y: -4 }}
        className="group relative cursor-pointer block h-full"
      >
        <div className={`relative rounded-3xl border bg-white p-6 flex flex-col gap-5 transition duration-300 shadow-sm hover:shadow-md h-full ${
          isCertified
            ? "border-green-200"
            : "border-gray-200"
        }`}>

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden border-2 bg-gray-50 ${isCertified ? 'border-green-100' : 'border-gray-100'}`}>
                <img
                  src={dev.profileImage || "/avatar.png"}
                  alt={dev.name}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = "/avatar.png" }}
                />
              </div>
              {isCertified && (
                <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-[12px] border-2 border-white shadow-sm font-bold text-white">
                  ✓
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {isCertified && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-lg mb-1.5 border border-green-200">
                  Certified
                </span>
              )}
              <h3 className="text-gray-900 font-extrabold text-lg leading-tight truncate group-hover:text-blue-600 transition duration-200">
                {dev.name}
              </h3>
              {dev.rating && (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-3.5 h-3.5 ${i < Math.round(dev.rating) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-600 font-semibold text-sm">{Number(dev.rating).toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
             <p className="text-gray-600 font-medium text-sm line-clamp-2 leading-relaxed">
               {dev.bio || skills}
             </p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-gray-500 text-sm font-semibold">View Profile</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition duration-300 bg-gray-50 text-gray-400 group-hover:bg-blue-600 group-hover:text-white`}>
              <svg className={`w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}