"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="relative pt-28 pb-24 px-4 overflow-x-hidden flex-1 flex flex-col items-center justify-center">

        <div className="relative z-10 max-w-4xl mx-auto w-full">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-blue-800 text-xs font-bold uppercase tracking-widest">Join Synthé</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-gray-900 leading-none mb-5">
              Who Are You?
            </h1>
            <p className="text-gray-500 text-lg max-w-md mx-auto leading-relaxed font-medium">
              Choose your path. Each has its own features, dashboard, and opportunities.
            </p>
          </motion.div>

          {/* Two cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">

            {/* User / Client */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }} className="h-full">
              <Link href="/signup?role=user">
                <div className="group relative h-full rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:border-cyan-300 transition-all duration-300 cursor-pointer p-8 flex flex-col min-h-[420px]">
                  
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-5 text-cyan-600">Path 01</p>

                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition duration-300 group-hover:scale-110 bg-cyan-50 border border-cyan-100">
                    <svg className="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>

                  <h3 className="text-gray-900 font-extrabold text-2xl tracking-tight mb-3">I'm a Client</h3>
                  <p className="text-gray-500 text-sm leading-relaxed flex-grow mb-6 font-medium">
                    Browse and download 3D models, AR/VR builds. Hire developers, post projects, and bring your ideas to life.
                  </p>

                  <div className="space-y-3 mb-8">
                    {[
                      "Browse & download 3D/AR/VR content",
                      "Hire developers directly",
                      "Access AutoCAD files and designs",
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-cyan-100/50 border border-cyan-200">
                          <svg className="w-2.5 h-2.5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-600 text-sm font-semibold">{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm font-bold text-cyan-600 group-hover:gap-3 transition-all duration-200">
                      Join as Client
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Free</span>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Developer */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }} className="h-full">
              <Link href="/join/developer">
                <div className="group relative h-full rounded-3xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:border-violet-300 transition-all duration-300 cursor-pointer p-8 flex flex-col min-h-[420px]">
                  
                  {/* Recommended badge */}
                  <div className="absolute top-6 right-6 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50">
                    <span className="text-amber-700 text-[10px] font-black uppercase tracking-widest">✦ Earn Revenue</span>
                  </div>

                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-5 text-violet-600">Path 02</p>

                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition duration-300 group-hover:scale-110 bg-violet-50 border border-violet-100">
                    <svg className="w-7 h-7 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>

                  <h3 className="text-gray-900 font-extrabold text-2xl tracking-tight mb-3">I'm a Developer</h3>
                  <p className="text-gray-500 text-sm leading-relaxed flex-grow mb-6 font-medium">
                    Upload your 3D models, AR/VR builds and AutoCAD files. Get hired, earn revenue, and build your reputation on Synthé.
                  </p>

                  <div className="space-y-3 mb-8">
                    {[
                      "Upload & sell 3D models and AR/VR builds",
                      "Receive direct project requests from clients",
                      "Get certified — earn more & rank higher",
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-violet-100/50 border border-violet-200">
                          <svg className="w-2.5 h-2.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-600 text-sm font-semibold">{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm font-bold text-violet-600 group-hover:gap-3 transition-all duration-200">
                      Apply as Developer
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Approval</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Already have account */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-center text-gray-500 font-medium text-sm">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-blue-600 hover:text-blue-700 transition duration-200 font-bold cursor-pointer">
                Sign in →
              </span>
            </Link>
          </motion.p>

        </div>
      </main>
      <Footer />
    </div>
  );
}