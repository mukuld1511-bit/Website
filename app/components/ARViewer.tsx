"use client";
import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import { createXRStore, XR } from "@react-three/xr";
import * as THREE from "three";

const store = createXRStore();

function HitTestModel({ url }: { url: string }) {
  const ref = useRef<THREE.Group>(null!);
  const { scene } = useGLTF(url);
  useEffect(() => {
    if (!scene) return;
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) scene.scale.setScalar(0.3 / maxDim);
  }, [scene]);
  return <group ref={ref}><primitive object={scene.clone()} dispose={null} /></group>;
}

interface ARViewerProps { modelUrl: string; fileType?: string; }

export default function ARViewer({ modelUrl, fileType = "glb" }: ARViewerProps) {
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if ("xr" in navigator) {
      (navigator as any).xr.isSessionSupported("immersive-ar")
        .then((ok: boolean) => setArSupported(ok))
        .catch(() => setArSupported(false));
    } else { setArSupported(false); }
  }, []);

  const canAR = ["glb", "gltf"].includes((fileType ?? "").toLowerCase());
  if (!canAR) return null;

  if (arSupported === null) return (
    <div className="p-4 rounded-2xl border border-white/5 bg-[#1A1A2E]/50 backdrop-blur-md text-center">
      <div className="w-4 h-4 border-2 border-white/10 border-t-[#5B4BDB] rounded-full animate-spin mx-auto shadow-[0_0_10px_rgba(91,75,219,0.5)]" />
    </div>
  );

  if (!arSupported) return (
    <div className="rounded-2xl border border-[#5B4BDB]/20 bg-[#5B4BDB]/5 backdrop-blur-md p-5 shadow-inner">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#5B4BDB]/20 border border-[#5B4BDB]/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(91,75,219,0.3)]">
          <svg className="w-5 h-5 text-[#A594FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2"/>
          </svg>
        </div>
        <div>
          <p className="font-bold text-white text-sm mb-1">WebXR AR Available on Mobile</p>
          <p className="text-[#9494AD] text-xs leading-relaxed">Open this page on <strong className="text-white">Chrome (Android)</strong> or <strong className="text-white">Safari (iOS 16+)</strong> to place this model in your real environment — no app needed.</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-[#5B4BDB]/20">
        <span className="text-[9px] font-black uppercase tracking-widest text-[#6B6B85]">Powered by</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-[#7C6EF6]">WebXR API</span>
        <span className="ml-auto text-[10px] text-[#6B6B85]">No app install required</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {/* Main AR button */}
      <button onClick={() => { store.enterAR(); setEntered(true); }}
        className="w-full flex items-center gap-3 py-4 px-5 rounded-2xl bg-gradient-to-r from-[#5B4BDB] to-[#7C6EF6] text-white font-bold text-sm border-b-[3px] border-[#4438b8] hover:brightness-110 transition-all active:translate-y-[3px] active:border-b-0 group shadow-[0_10px_30px_rgba(91,75,219,0.3)]">
        <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-white/30 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2"/>
          </svg>
        </div>
        <div className="text-left flex-1">
          <p className="font-black leading-tight text-white text-[15px] drop-shadow-sm">View in your room</p>
          <p className="text-white/80 text-[11px] font-medium mt-0.5">Point camera at flat surface to place</p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/20 border border-white/20 text-white shadow-inner">WebXR</span>
      </button>

      {/* WebXR info strip */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#1A1A2E]/50 border border-white/5 backdrop-blur-sm">
        <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
        </svg>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B85]">No app needed · Browser AR</span>
        {entered && <span className="ml-auto text-[10px] uppercase tracking-wider text-green-400 font-black animate-pulse">AR active ✓</span>}
      </div>

      {/* Hidden canvas */}
      <div className="fixed inset-0 z-[200] pointer-events-none" style={{position:"absolute",width:0,height:0,overflow:"hidden"}}>
        <Canvas>
          <XR store={store}>
            <ambientLight intensity={1}/>
            <Suspense fallback={null}>
              <HitTestModel url={modelUrl}/>
            </Suspense>
          </XR>
        </Canvas>
      </div>
    </div>
  );
}