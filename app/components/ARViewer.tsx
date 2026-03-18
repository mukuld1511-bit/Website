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
    <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 text-center">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-[#5B4BDB] rounded-full animate-spin mx-auto" />
    </div>
  );

  if (!arSupported) return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#5B4BDB]/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-[#5B4BDB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2"/>
          </svg>
        </div>
        <div>
          <p className="font-bold text-violet-900 text-sm mb-1">WebXR AR Available on Mobile</p>
          <p className="text-violet-700 text-xs leading-relaxed">Open this page on <strong>Chrome (Android)</strong> or <strong>Safari (iOS 16+)</strong> to place this model in your real environment — no app needed.</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-violet-200">
        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-500">Powered by</span>
        <span className="text-xs font-black text-[#5B4BDB]">WebXR Device API</span>
        <span className="ml-auto text-[10px] text-violet-400">No app install required</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {/* Main AR button */}
      <button onClick={() => { store.enterAR(); setEntered(true); }}
        className="w-full flex items-center gap-3 py-4 px-5 rounded-2xl bg-gradient-to-r from-[#5B4BDB] to-violet-600 text-white font-bold text-sm border-b-[3px] border-[#4438b8] hover:brightness-110 transition-all active:translate-y-[1px] group">
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-2"/>
          </svg>
        </div>
        <div className="text-left flex-1">
          <p className="font-black leading-tight">View in your room</p>
          <p className="text-white/70 text-xs font-normal">Point camera at flat surface to place</p>
        </div>
        <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-white/20 text-white/90 tracking-widest">WebXR</span>
      </button>

      {/* WebXR info strip */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
        <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
        </svg>
        <span className="text-xs text-gray-500 font-medium">No app needed · Runs in browser · WebXR Device API</span>
        {entered && <span className="ml-auto text-xs text-green-600 font-bold">AR active ✓</span>}
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