"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { OBJLoader } from "three-stdlib";
import { OrbitControls } from "three-stdlib";
import { motion, AnimatePresence } from "framer-motion";

interface ViewerProps {
  modelUrl: string;
  fileType?: "glb" | "gltf" | "obj";
  height?: number;
}

export default function Viewer({ modelUrl, fileType = "glb", height = 520 }: ViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controlsRef = useRef<any>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const animRef = useRef<number>(0);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !modelUrl) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / height, 0.01, 1000);
    camera.position.set(0, 1.2, 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.4);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);
    const violetLight = new THREE.PointLight(0xa78bfa, 2.5, 12);
    violetLight.position.set(-3, 3, -2);
    scene.add(violetLight);
    const cyanLight = new THREE.PointLight(0x22d3ee, 2, 12);
    cyanLight.position.set(3, -1, 3);
    scene.add(cyanLight);
    scene.add(new THREE.HemisphereLight(0x7c3aed, 0x0891b2, 0.4));

    // Grid
    const grid = new THREE.GridHelper(10, 20, 0x4c1d95, 0x1e1b4b);
    (grid.material as THREE.Material).opacity = 0.25;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 0.5;
    controls.maxDistance = 20;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Load
    const isOBJ = fileType === "obj";
    const loader: any = isOBJ ? new OBJLoader() : new GLTFLoader();

    loader.load(
      modelUrl,
      (result: any) => {
        const object: THREE.Object3D = isOBJ ? result : result.scene;

        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.2 / maxDim;

        object.scale.setScalar(scale);
        object.position.sub(center.multiplyScalar(scale));
        object.position.y -= (size.y * scale) / 2 - 0.01;

        object.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(object);
        modelRef.current = object;
        camera.position.set(0, size.y * scale * 0.5, maxDim * scale * 2);
        controls.target.set(0, size.y * scale * 0.3, 0);
        controls.update();
        setIsLoading(false);
      },
      (xhr: { loaded: number; total: number }) => {
        if (xhr.total) setProgress(Math.round((xhr.loaded / xhr.total) * 100));
      },
      (err: any) => {
        console.error(err);
        setLoadError("Failed to load model. Check the URL or file format.");
        setIsLoading(false);
      }
    );

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [modelUrl, fileType, height]);

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    modelRef.current?.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material;
        if (Array.isArray(mat)) {
          mat.forEach((m: any) => { if (m.wireframe !== undefined) m.wireframe = wireframe; });
        } else if ((mat as any).wireframe !== undefined) {
          (mat as any).wireframe = wireframe;
        }
      }
    });
  }, [wireframe]);

  // ── Tool button component ──
  const ToolBtn = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      title={title}
      style={{ willChange: "transform" }}
      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition duration-200 ${
        active
          ? "border-violet-400/50 bg-violet-500/20 text-violet-300"
          : "border-white/8 bg-white/[0.04] text-white/40 hover:text-white/70 hover:border-white/20"
      }`}
    >
      {children}
    </motion.button>
  );

  // ── Render ──
  return (
    <div
      className="relative rounded-3xl overflow-hidden border border-white/6 bg-[#08000f]"
      style={{ height }}
    >
      {/* Top shimmer */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(167,139,250,0.4), rgba(34,211,238,0.3), transparent)",
        }}
      />

      {/* Canvas mount */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#08000f] z-20"
          >
            <div className="relative">
              {/* Pulsing glow — style only, no css prop */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  willChange: "transform, opacity",
                  position: "absolute",
                  inset: -12,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)",
                  filter: "blur(8px)",
                  pointerEvents: "none",
                }}
              />
              <div
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}
              >
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <p className="text-white/60 text-sm font-semibold mb-3">Loading model...</p>
              <div className="w-48 h-1 rounded-full bg-white/6 overflow-hidden">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #7c3aed, #22d3ee)" }}
                />
              </div>
              {progress > 0 && (
                <p className="text-white/25 text-xs mt-2">{progress}%</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error overlay */}
      <AnimatePresence>
        {loadError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#08000f] z-20 p-8"
          >
            <div className="w-14 h-14 rounded-2xl border border-rose-500/20 bg-rose-500/8 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-rose-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-white/60 font-semibold text-center text-sm">{loadError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar — only shown when loaded and no error */}
      {!isLoading && !loadError && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/8 z-10"
          style={{
            background: "rgba(5,0,8,0.75)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Auto-rotate */}
          <ToolBtn
            onClick={() => setAutoRotate((v) => !v)}
            active={autoRotate}
            title="Auto Rotate"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </ToolBtn>

          <div className="w-[1px] h-5 bg-white/8" />

          {/* Wireframe */}
          <ToolBtn
            onClick={() => setWireframe((v) => !v)}
            active={wireframe}
            title="Wireframe"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
          </ToolBtn>

          <div className="w-[1px] h-5 bg-white/8" />

          <span className="text-white/20 text-[10px] font-medium tracking-wide px-1">
            Drag · Scroll · Pinch
          </span>
        </motion.div>
      )}

      {/* File type corner label */}
      {!isLoading && !loadError && (
        <div className="absolute top-4 left-4 z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 backdrop-blur-sm text-violet-300/80">
            {fileType.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}