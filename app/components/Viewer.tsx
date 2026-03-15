"use client";
import { useRef, useState, useCallback, Suspense, useEffect } from "react";
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Html, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three-stdlib";
import ViewerToolbar, { LightingPreset, BackgroundPreset } from "./ViewerToolbar";
import ModelStatsPanel, { ModelStats } from "./ModelStatsPanel";

// ─── Loading indicator ────────────────────────────────────────────────────────
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <span className="text-white text-sm font-medium tabular-nums">{Math.round(progress)}%</span>
      </div>
    </Html>
  );
}

// ─── Scene setup (background + lighting) ─────────────────────────────────────
function SceneSetup({
  background,
  lighting,
  cinematic,
}: {
  background: BackgroundPreset;
  lighting:   LightingPreset;
  cinematic:  boolean;
}) {
  const { scene } = useThree();

  const bgColor: Record<BackgroundPreset, string> = {
    white: "#f9fafb",
    gray:  "#1f2937",
    black: "#080808",
  };

  const envPreset: Record<LightingPreset, string> = {
    studio:  "studio",
    outdoor: "sunset",
    dark:    "night",
    city:    "city",
  };

  useEffect(() => {
    scene.background = new THREE.Color(bgColor[background]);
  }, [background]);

  return (
    <>
      <Environment preset={envPreset[lighting] as any} background={false} />
      {cinematic ? (
        <>
          <ambientLight intensity={0.2} />
          <directionalLight position={[8, 10, 6]} intensity={3} castShadow />
          <pointLight position={[-6, -4, -6]} intensity={0.8} color="#4466ff" />
          <pointLight position={[0, 8, 0]}   intensity={0.4} color="#ff8844" />
        </>
      ) : (
        <>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
        </>
      )}
    </>
  );
}

// ─── GLB / GLTF model ─────────────────────────────────────────────────────────
function GltfModel({
  url,
  wireframe,
  explode,
  onStats,
}: {
  url:       string;
  wireframe: boolean;
  explode:   number;
  onStats:   (s: ModelStats) => void;
}) {
  const { scene }    = useGLTF(url);
  const reported     = useRef(false);
  const explodeBases = useRef<{ uuid: string; pos: THREE.Vector3; dir: THREE.Vector3 }[]>([]);

  // Centre, scale, collect stats + explode bases
  useEffect(() => {
    if (!scene || reported.current) return;
    reported.current = true;

    const box    = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) scene.scale.setScalar(2 / maxDim);
    scene.position.sub(center.multiplyScalar(2 / maxDim));

    let polyCount = 0, vertexCount = 0, meshCount = 0;
    const mats   = new Set<string>();
    const meshes: THREE.Mesh[] = [];
    const scCenter = new THREE.Vector3();

    scene.traverse(obj => {
      if (!(obj instanceof THREE.Mesh)) return;
      meshes.push(obj);
      meshCount++;
      const geo = obj.geometry;
      if (geo.index)                   polyCount   += geo.index.count / 3;
      else if (geo.attributes.position) polyCount  += geo.attributes.position.count / 3;
      if (geo.attributes.position)     vertexCount += geo.attributes.position.count;
      const m = obj.material;
      if (Array.isArray(m)) m.forEach(x => x && mats.add(x.uuid));
      else if (m) mats.add((m as any).uuid);
      scCenter.add(obj.position);
    });

    if (meshes.length) scCenter.divideScalar(meshes.length);
    explodeBases.current = meshes.map(m => ({
      uuid: m.uuid,
      pos:  m.position.clone(),
      dir:  m.position.clone().sub(scCenter).normalize(),
    }));

    onStats({ polyCount: Math.round(polyCount), vertexCount, meshCount, materialCount: mats.size, fileSize: 0 });
  }, [scene]);

  // Wireframe toggle
  useEffect(() => {
    scene.traverse(obj => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(m => { if (m) (m as any).wireframe = wireframe; });
    });
  }, [wireframe, scene]);

  // Explode view
  useFrame(() => {
    scene.traverse(obj => {
      if (!(obj instanceof THREE.Mesh)) return;
      const base = explodeBases.current.find(b => b.uuid === obj.uuid);
      if (base) obj.position.copy(base.pos).addScaledVector(base.dir, explode);
    });
  });

  return <primitive object={scene} dispose={null} />;
}

// ─── OBJ model ───────────────────────────────────────────────────────────────
function ObjModel({ url, wireframe }: { url: string; wireframe: boolean }) {
  const obj = useLoader(OBJLoader, url);
  useEffect(() => {
    const box    = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) obj.scale.setScalar(2 / maxDim);
    obj.position.sub(center.multiplyScalar(2 / maxDim));
    obj.traverse(c => {
      if (!(c instanceof THREE.Mesh)) return;
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach(m => { if (m) (m as any).wireframe = wireframe; });
    });
  }, [obj, wireframe]);
  return <primitive object={obj} dispose={null} />;
}

// ─── Camera controls with reset ref ──────────────────────────────────────────
function Controls({ autoRotate, controlsRef }: { autoRotate: boolean; controlsRef: React.MutableRefObject<any> }) {
  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotate ? 1.2 : 0}
      enableDamping
      dampingFactor={0.06}
      makeDefault
    />
  );
}

// ─── Screenshot capture ───────────────────────────────────────────────────────
function ScreenshotCapture({ trigger }: { trigger: number }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    if (!trigger) return;
    gl.render(scene, camera);
    const url = gl.domElement.toDataURL("image/png");
    const a   = document.createElement("a");
    a.href     = url;
    a.download = "synthe-model.png";
    a.click();
  }, [trigger]);
  return null;
}

// ─── Main Viewer export ───────────────────────────────────────────────────────
interface ViewerProps {
  url?:      string;
  modelUrl?: string;
  fileType?: string;
  fileSize?: number;
  title?:    string;
}

export default function Viewer({ url, modelUrl, fileType = "glb", fileSize = 0, title }: ViewerProps) {
  const src          = url ?? modelUrl ?? "";
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef  = useRef<any>(null);

  const [lighting,   setLighting]   = useState<LightingPreset>("studio");
  const [background, setBackground] = useState<BackgroundPreset>("gray");
  const [wireframe,  setWireframe]  = useState(false);
  const [cinematic,  setCinematic]  = useState(false);
  const [statsOpen,  setStatsOpen]  = useState(false);
  const [stats,      setStats]      = useState<ModelStats | null>(null);
  const [explode,    setExplode]    = useState(0);
  const [screenshot, setScreenshot] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);

  const handleCinematic = () => {
    const next = !cinematic;
    setCinematic(next);
    setAutoRotate(next);
    setBackground(next ? "black" : "gray");
    if (next) setLighting("studio");
  };

  const handleStats = useCallback((s: ModelStats) => {
    setStats({ ...s, fileSize });
  }, [fileSize]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  const isGltf = ["glb", "gltf"].includes(fileType.toLowerCase());
  const isObj  = fileType.toLowerCase() === "obj";

  if (!src) {
    return (
      <div className="w-full rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center gap-3" style={{ height: 420 }}>
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">📦</div>
        <p className="text-gray-400 text-sm font-medium">No model to preview</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl bg-gray-900"
      style={{ minHeight: 420 }}
    >
      <Canvas
        camera={{ position: [0, 0.5, 4], fov: 45, near: 0.01, far: 2000 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        shadows
        style={{ height: 420 }}
      >
        <SceneSetup background={background} lighting={lighting} cinematic={cinematic} />
        <Controls autoRotate={autoRotate} controlsRef={controlsRef} />
        <Suspense fallback={<Loader />}>
          {isGltf && (
            <GltfModel
              url={src}
              wireframe={wireframe}
              explode={explode}
              onStats={handleStats}
            />
          )}
          {isObj && <ObjModel url={src} wireframe={wireframe} />}
        </Suspense>
        <ScreenshotCapture trigger={screenshot} />
      </Canvas>

      {/* Cinematic vignette */}
      {cinematic && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Cinematic title overlay */}
      {cinematic && title && (
        <div className="absolute top-4 left-4 z-20">
          <span className="text-white text-sm font-bold bg-black/50 px-3 py-1.5 rounded-lg tracking-wide">
            {title}
          </span>
        </div>
      )}

      {/* Stats panel */}
      <ModelStatsPanel
        open={statsOpen}
        stats={stats}
        wireframe={wireframe}
        onWireframeToggle={() => setWireframe(w => !w)}
        onClose={() => setStatsOpen(false)}
      />

      {/* Explode slider — GLB/GLTF only */}
      {isGltf && (
        <div className="absolute bottom-[68px] left-4 right-4 z-30 max-w-xs mx-auto">
          <div className="bg-gray-900/90 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
            <div className="flex justify-between mb-2">
              <span className="text-white text-xs font-bold">Explode view</span>
              <span className="text-gray-400 text-xs font-mono">{explode.toFixed(1)}</span>
            </div>
            <input
              type="range" min={0} max={2.5} step={0.05} value={explode}
              onChange={e => setExplode(parseFloat(e.target.value))}
              className="w-full accent-[#5B4BDB]"
            />
          </div>
        </div>
      )}

      {/* Floating toolbar */}
      <ViewerToolbar
        lighting={lighting}
        background={background}
        wireframe={wireframe}
        cinematic={cinematic}
        statsOpen={statsOpen}
        onLightingChange={setLighting}
        onBackgroundChange={setBackground}
        onWireframeToggle={() => setWireframe(w => !w)}
        onCinematicToggle={handleCinematic}
        onStatsToggle={() => setStatsOpen(s => !s)}
        onScreenshot={() => setScreenshot(t => t + 1)}
        onFullscreen={handleFullscreen}
        onResetCamera={() => controlsRef.current?.reset()}
      />
    </div>
  );
}