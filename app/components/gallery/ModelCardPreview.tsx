"use client";
import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

function AutoScaledModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    if (!scene) return;
    const box    = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) scene.scale.setScalar(1.8 / maxDim);
    scene.position.sub(center.multiplyScalar(1.8 / maxDim));
  }, [scene]);

  return <primitive object={scene} dispose={null} />;
}

function DarkBackground() {
  const { scene } = useThree();
  useEffect(() => { scene.background = new THREE.Color("#111111"); }, []);
  return null;
}

/** Rendered inside a dynamically-imported wrapper (no SSR) */
export default function ModelCardPreview({ url }: { url: string }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 45 }}
      gl={{ antialias: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <DarkBackground />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <Suspense fallback={null}>
        <AutoScaledModel url={url} />
        <Environment preset="city" background={false} />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={3}
        makeDefault
      />
    </Canvas>
  );
}
