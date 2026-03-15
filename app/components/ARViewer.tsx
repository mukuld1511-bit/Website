"use client";
import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { ARButton, XR, useHitTest } from "@react-three/xr";
import * as THREE from "three";

function HitTestModel({ url }: { url: string }) {
  const ref       = useRef<THREE.Group>(null!);
  const { scene } = useGLTF(url);

  useEffect(() => {
    if (!scene) return;
    const box    = new THREE.Box3().setFromObject(scene);
    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) scene.scale.setScalar(0.3 / maxDim);
  }, [scene]);

  useHitTest((hitMatrix: THREE.Matrix4) => {
    if (ref.current) {
      hitMatrix.decompose(ref.current.position, ref.current.quaternion, new THREE.Vector3());
      ref.current.scale.setScalar(0.3);
      ref.current.visible = true;
    }
  });

  return (
    <group ref={ref} visible={false}>
      <primitive object={scene.clone()} dispose={null} />
    </group>
  );
}

interface ARViewerProps {
  modelUrl:  string;
  fileType?: string;
}

export default function ARViewer({ modelUrl, fileType = "glb" }: ARViewerProps) {
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [active,      setActive]      = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if ("xr" in navigator) {
      (navigator as any).xr
        .isSessionSupported("immersive-ar")
        .then((ok: boolean) => setArSupported(ok))
        .catch(() => setArSupported(false));
    } else {
      setArSupported(false);
    }
  }, []);

  const canAR = ["glb", "gltf"].includes((fileType ?? "").toLowerCase());
  if (!canAR) return null;

  if (arSupported === null) {
    return (
      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-center">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!arSupported) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-center">
        <p className="text-gray-500 text-sm font-medium">📱 AR requires Chrome on Android or Safari on iOS 16+</p>
        <p className="text-gray-400 text-xs mt-1">Open this page on your phone to place this model in your room</p>
      </div>
    );
  }

  return (
    <div>
      {!active ? (
        <button
          onClick={() => setActive(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#5B4BDB] to-blue-600 text-white font-bold text-sm border-b-[3px] border-[#4438b8] transition-all hover:brightness-110 active:translate-y-[1px]"
        >
          <span className="text-base">📱</span>
          View in your room
        </button>
      ) : (
        <div className="fixed inset-0 z-[200]" style={{ height: "100dvh", touchAction: "none" }}>
          <ARButton
            style={{
              position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
              padding: "12px 28px", background: "#5B4BDB", color: "#fff", border: "none",
              borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", zIndex: 10,
            }}
          />
          <button
            onClick={() => setActive(false)}
            className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-black/70 text-white font-bold text-lg flex items-center justify-center"
          >
            ×
          </button>
          <Canvas>
            <XR>
              <ambientLight intensity={1} />
              <Suspense fallback={null}>
                <HitTestModel url={modelUrl} />
              </Suspense>
            </XR>
          </Canvas>
        </div>
      )}
    </div>
  );
}
