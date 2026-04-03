import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Marble Ruins (Sàn đấu bằng đá cẩm thạch cổ đại) ─────────
function ArenaTile({ position, delay, isDark }: { position: [number, number, number], delay: number, isDark: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startY = position[1] - 15;
  const targetY = position[1];
  const startTime = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (startTime.current === null) startTime.current = clock.elapsedTime;
    const elapsed = clock.elapsedTime - startTime.current - delay;
    if (elapsed < 0) return;

    const t = Math.min(elapsed / 1.5, 1);
    // ease out qua dạng đàn hồi nhẹ
    const ease = 1 - Math.pow(1 - t, 4);
    meshRef.current.position.y = startY + (targetY - startY) * ease;

    // Lúc bê lên xoay nhẹ đá vỡ
    if (t < 1) {
      meshRef.current.rotation.x = (1 - t) * Math.sin(elapsed * 2) * 0.2;
      meshRef.current.rotation.z = (1 - t) * Math.cos(elapsed * 2) * 0.2;
    } else {
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.1);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 0.1);
    }
  });

  return (
    <mesh ref={meshRef} position={[position[0], startY, position[2]]}>
      {/* Box vát giả làm đá cắt */}
      <boxGeometry args={[0.95, 0.25, 0.95]} />
      <meshStandardMaterial 
        color={isDark ? "#2a2a30" : "#d1d5db"} 
        roughness={0.9} 
        metalness={0.1} 
      />
    </mesh>
  );
}

// ── Golden Pillars (Nâng lên từ dưới sâu) ─────────
function ArenaColumn({ position, delay }: { position: [number, number, number], delay: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (startTime.current === null) startTime.current = clock.elapsedTime;
    const elapsed = clock.elapsedTime - startTime.current - delay;
    if (elapsed < 0) {
      meshRef.current.scale.y = 0;
      return;
    }
    const t = Math.min(elapsed / 1.5, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    meshRef.current.scale.y = ease;
  });

  return (
    <mesh ref={meshRef} position={position} scale={[1, 0, 1]}>
      {/* Trụ Gothic chia đốt */}
      <cylinderGeometry args={[0.3, 0.4, 5, 12]} />
      <meshStandardMaterial color="#c0a060" roughness={0.4} metalness={0.8} />
    </mesh>
  );
}

// ── God Rays (Tia sáng từ trời rọi xuống) ────────
function PulsingLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    lightRef.current.intensity = 4.0 + Math.sin(clock.elapsedTime * 1.5) * 1.5;
  });
  return (
    <pointLight
      ref={lightRef}
      position={[0, 8, 0]}
      color="#ffd700"
      intensity={4.0}
      distance={30}
    />
  );
}

// ── Vụn ma thuật (Cosmic / Magic Force) ────────
function MysticDust() {
  const count = 150;
  const positions = useRef<Float32Array>(
    new Float32Array(
      Array.from({ length: count * 3 }, (_, i) => {
        const axis = i % 3;
        if (axis === 0) return (Math.random() - 0.5) * 15;
        if (axis === 1) return Math.random() * 10 - 5;
        return (Math.random() - 0.5) * 15;
      }),
    ),
  );
  const speeds = useRef(Array.from({ length: count }, () => 0.2 + Math.random() * 0.5));
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = positions.current;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds.current[i] * delta * 0.8;
      if (pos[i * 3 + 1] > 8) {
        pos[i * 3 + 1] = -5;
        pos[i * 3] = (Math.random() - 0.5) * 15;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
      }
    }
    (pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions.current, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#c084fc"
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function ArenaScene() {
  const tiles: { pos: [number, number, number]; delay: number; isDark: boolean }[] = [];
  for (let x = -3; x <= 3; x++) {
    for (let z = -3; z <= 3; z++) {
      const dist = Math.sqrt(x * x + z * z);
      tiles.push({
        pos: [x * 1.05, 0, z * 1.05], // Tạo rãnh giữa các block đá
        delay: dist * 0.15 + Math.random() * 0.2, // Lan từ tâm ra
        isDark: (x + z) % 2 !== 0,
      });
    }
  }

  const columns: { pos: [number, number, number]; delay: number }[] = [
    { pos: [-4, 2.5, -4], delay: 1.5 },
    { pos: [4, 2.5, -4], delay: 1.6 },
    { pos: [-4, 2.5, 4], delay: 1.7 },
    { pos: [4, 2.5, 4], delay: 1.8 },
  ];

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 12, 5]} intensity={1.5} color="#ffffff" shadow-bias={-0.001} />
      <directionalLight position={[-5, 5, -5]} intensity={0.8} color="#a78bfa" />
      <PulsingLight />
      <MysticDust />
      {tiles.map((t, i) => (
        <ArenaTile key={i} position={t.pos} delay={t.delay} isDark={t.isDark} />
      ))}
      {columns.map((c, i) => (
        <ArenaColumn key={i} position={c.pos} delay={c.delay} />
      ))}
      {/* Nền tím Void bên dưới soi lên các kẽ nứt */}
      <pointLight position={[0, -2, 0]} color="#7c3aed" intensity={2} distance={10} />
    </>
  );
}

function BlinkingDots() {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 500);
    return () => clearInterval(id);
  }, []);
  return <span className="inline-block w-6 text-left">{dots}</span>;
}

export function ArenaLoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Radial Void overlay gradient */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 20%, #050010 100%)", zIndex: 1, pointerEvents: "none" }} />
      
      {/* Three.js canvas */}
      <div className="absolute inset-0 w-full" style={{ height: "100%", zIndex: 0 }}>
        <Canvas camera={{ position: [0, 8, 12], fov: 55 }} gl={{ antialias: true }}>
          <ArenaScene />
        </Canvas>
      </div>

      {/* Text UI Overlaid at the bottom */}
      <div className="relative z-10 flex flex-col items-center gap-4 mt-auto mb-20 text-center">
        <p className="text-yellow-300 text-lg sm:text-xl font-bold tracking-[0.2em] font-serif uppercase" style={{ textShadow: "0 0 10px rgba(255,215,0,0.8)" }}>
          Summoning the Astral Arena from the Void <BlinkingDots />
        </p>
        <div className="w-80 h-1.5 bg-gray-900/80 rounded-full overflow-hidden border border-yellow-900/50 shadow-lg shadow-yellow-500/20">
          <div
            className="h-full bg-gradient-to-r from-yellow-700 via-yellow-300 to-yellow-600 rounded-full"
            style={{ animation: "arena-progress 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite" }}
          />
        </div>
      </div>

      <style>{`
        @keyframes arena-progress {
          0% { width: 0%; transform: translateX(-10%); }
          50% { width: 85%; }
          100% { width: 100%; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
