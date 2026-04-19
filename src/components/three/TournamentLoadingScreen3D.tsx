import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

// ── Particles: Astral Vortex ─────────────────────────────────────────────────
function AstralVortex({
  count = 3000,
  isExiting,
}: {
  count?: number;
  isExiting: boolean;
}) {
  const meshRef = useRef<THREE.Points>(null!);
  const { mouse, viewport } = useThree();

  // Create particles in a spiral pattern
  const [positions, initialPositions, randomness, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const initial = new Float32Array(count * 3);
    const random = new Float32Array(count);
    const vels = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 25;
      const r = (i / count) * 10;
      const x = Math.cos(theta) * r;
      const y = Math.sin(theta) * r;
      const z = (Math.random() - 0.5) * 5;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      initial[i * 3] = x;
      initial[i * 3 + 1] = y;
      initial[i * 3 + 2] = z;

      random[i] = Math.random();
      vels[i] = 0.5 + Math.random() * 2;
    }
    return [pos, initial, random, vels];
  }, [count]);

  const warpFactor = useRef(0);

  useFrame(({ clock, camera }) => {
    const time = clock.getElapsedTime();
    const posAttr = meshRef.current.geometry.attributes.position
      .array as Float32Array;

    if (isExiting) {
      warpFactor.current = THREE.MathUtils.lerp(warpFactor.current, 1, 0.03);
      // Speed up rotation
      meshRef.current.rotation.z += warpFactor.current * 0.5;
      // Increase FOV for warp effect
      const cam = camera as THREE.PerspectiveCamera;
      if (cam.fov) cam.fov = 50 + warpFactor.current * 40;
      cam.updateProjectionMatrix();
    } else {
      meshRef.current.rotation.z = time * 0.1;
    }

    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      mouse.y * 0.2,
      0.05,
    );
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      mouse.x * 0.2,
      0.05,
    );

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      if (isExiting) {
        // Warp Drive: Particles rush towards the camera
        posAttr[i3 + 2] += velocities[i] * warpFactor.current * 2;
        // Reset particles that go past the camera to create infinite tunnel if needed,
        // but since we fade out soon, just letting them fly is fine.
      } else {
        const pulse = Math.sin(time + randomness[i] * 10) * 0.05;
        posAttr[i3] = initialPositions[i3] * (1 + pulse);
        posAttr[i3 + 1] = initialPositions[i3 + 1] * (1 + pulse);

        const mouseX = (mouse.x * viewport.width) / 2;
        const mouseY = (mouse.y * viewport.height) / 2;
        const dx = posAttr[i3] - mouseX;
        const dy = posAttr[i3 + 1] - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 2) {
          const force = (2 - dist) / 2;
          posAttr[i3] += (dx / dist) * force * 0.5;
          posAttr[i3 + 1] += (dy / dist) * force * 0.5;
        }
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#a78bfa"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ── Central Sigil ────────────────────────────────────────────────────────────
function CentralSigil({ isExiting }: { isExiting: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const burstRef = useRef(0);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (isExiting) {
      burstRef.current = THREE.MathUtils.lerp(burstRef.current, 1, 0.05);
      meshRef.current.scale.setScalar(1.5 + burstRef.current * 15);
      (
        meshRef.current.material as THREE.MeshStandardMaterial
      ).emissiveIntensity = 1 + burstRef.current * 10;
      (meshRef.current.material as THREE.MeshStandardMaterial).opacity =
        0.8 * (1 - burstRef.current);
    } else {
      meshRef.current.rotation.y = t * 0.5;
      meshRef.current.rotation.z = t * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} scale={1.5}>
      <octahedronGeometry args={[1, 0]} />
      <MeshDistortMaterial
        color="#fbbf24"
        speed={2}
        distort={0.4}
        radius={1}
        emissive="#f59e0b"
        emissiveIntensity={1}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

// ── Background ───────────────────────────────────────────────────
function Background({ isExiting }: { isExiting: boolean }) {
  const starsRef = useRef<any>(null!);
  const colorRef = useRef(new THREE.Color("#050010"));

  useFrame(() => {
    if (isExiting) {
      // Fade background color to true black
      colorRef.current.lerp(new THREE.Color("#000000"), 0.05);
    }
  });

  return (
    <>
      <color attach="background" args={[colorRef.current.getHex()]} />
      <Stars
        ref={starsRef}
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
      <ambientLight intensity={0.2} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        intensity={1}
        color="#7c3aed"
      />
    </>
  );
}

interface TournamentLoadingScreen3DProps {
  loading: boolean;
  onSkip: () => void;
}

export function TournamentLoadingScreen3D({
  loading,
  onSkip,
}: TournamentLoadingScreen3DProps) {
  const [showSkip, setShowSkip] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowSkip(true), 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleSkip = () => {
    setIsExiting(true);
    try {
      const audio = new Audio("/assets/combatSFX/warp_jump.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}

    setTimeout(() => {
      onSkip();
    }, 1200);
  };

  return (
    <div
      className={`fixed inset-0 z-[1000] bg-[#050010] flex flex-col items-center justify-center transition-all duration-1000 ${isExiting ? "bg-black opacity-0 scale-110" : "opacity-100 scale-100"}`}
    >
      {/* 3D Canvas */}
      <div className="absolute inset-0 w-full h-full">
        <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
          <Background isExiting={isExiting} />
          <AstralVortex isExiting={isExiting} />
          <CentralSigil isExiting={isExiting} />
        </Canvas>
      </div>

      {/* Overlay UI */}
      <div
        className={`relative z-10 flex flex-col items-center gap-8 mt-auto mb-20 transition-all duration-500 ${isExiting ? "opacity-0 scale-125" : "opacity-100"}`}
      >
        <div className="flex flex-col items-center gap-2">
          <p className="text-primary font-display uppercase tracking-[0.4em] text-sm font-black animate-pulse drop-shadow-[0_0_15px_rgba(255,209,108,0.5)]">
            SVIT ĐANG NẤU...
          </p>
          <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        {showSkip && (
          <button
            onClick={handleSkip}
            className="group relative px-10 py-3 overflow-hidden transition-all duration-300 transform hover:scale-105"
          >
            <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/20 skew-x-[-12deg] group-hover:bg-white/20 transition-colors" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity skew-x-[-12deg]" />
            <span className="relative text-white font-display font-bold tracking-widest uppercase">
              Bắt đầu ngay
            </span>
          </button>
        )}
      </div>

      <div
        className={`absolute top-10 left-10 opacity-30 pointer-events-none transition-opacity ${isExiting ? "opacity-0" : ""}`}
      >
        <p className="text-white/50 text-[10px] font-mono tracking-tighter uppercase">
          [ Interactive Core: Click & Drag ]
        </p>
      </div>
    </div>
  );
}
