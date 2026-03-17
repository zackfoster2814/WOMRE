import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Các mảnh vỡ bay lên tạo thành sàn đấu
function ArenaTile({
  position,
  delay,
  color,
}: {
  position: [number, number, number];
  delay: number;
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startY = position[1] - 12;
  const targetY = position[1];
  const startTime = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (startTime.current === null) startTime.current = clock.elapsedTime;
    const elapsed = clock.elapsedTime - startTime.current - delay;
    if (elapsed < 0) return;

    const t = Math.min(elapsed / 1.2, 1);
    // ease out cubic
    const ease = 1 - Math.pow(1 - t, 3);
    meshRef.current.position.y = startY + (targetY - startY) * ease;

    // Xoay nhẹ khi bay lên rồi dừng
    if (t < 1) {
      meshRef.current.rotation.x = (1 - t) * Math.sin(elapsed * 3) * 0.4;
      meshRef.current.rotation.z = (1 - t) * Math.cos(elapsed * 2) * 0.3;
    } else {
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        0,
        0.1,
      );
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z,
        0,
        0.1,
      );
    }
  });

  return (
    <mesh ref={meshRef} position={[position[0], startY, position[2]]}>
      <boxGeometry args={[0.9, 0.12, 0.9]} />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} />
    </mesh>
  );
}

// Các cột trụ góc sân
function ArenaColumn({
  position,
  delay,
}: {
  position: [number, number, number];
  delay: number;
}) {
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
    const t = Math.min(elapsed / 1.0, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    meshRef.current.scale.y = ease;
  });

  return (
    <mesh ref={meshRef} position={position} scale={[1, 0, 1]}>
      <cylinderGeometry args={[0.15, 0.2, 4, 8]} />
      <meshStandardMaterial color="#c0a060" roughness={0.3} metalness={0.7} />
    </mesh>
  );
}

// Hiệu ứng ánh sáng nhấp nháy
function PulsingLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    lightRef.current.intensity = 3.0 + Math.sin(clock.elapsedTime * 2) * 1.0;
  });
  return (
    <pointLight
      ref={lightRef}
      position={[0, 5, 0]}
      color="#ffd080"
      intensity={3.0}
      distance={25}
    />
  );
}

// Hạt bụi bay lên
function DustParticles() {
  const count = 120;
  const positions = useRef<Float32Array>(
    new Float32Array(
      Array.from({ length: count * 3 }, (_, i) => {
        const axis = i % 3;
        if (axis === 0) return (Math.random() - 0.5) * 14;
        if (axis === 1) return Math.random() * 8 - 2;
        return (Math.random() - 0.5) * 14;
      }),
    ),
  );
  const speeds = useRef(
    Array.from({ length: count }, () => 0.3 + Math.random() * 0.7),
  );
  const pointsRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = positions.current;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds.current[i] * delta * 0.6;
      if (pos[i * 3 + 1] > 8) {
        pos[i * 3 + 1] = -2;
        pos[i * 3] = (Math.random() - 0.5) * 14;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
      }
    }
    (
      pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    ).needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions.current, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#ffd080"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function ArenaScene() {
  // Grid sàn đấu 7x7
  const tiles: {
    pos: [number, number, number];
    delay: number;
    color: string;
  }[] = [];
  const cols1 = "#4a4a6a";
  const cols2 = "#3a3a55";
  for (let x = -3; x <= 3; x++) {
    for (let z = -3; z <= 3; z++) {
      const dist = Math.sqrt(x * x + z * z);
      tiles.push({
        pos: [x, 0, z],
        delay: dist * 0.12 + Math.random() * 0.1,
        color: (x + z) % 2 === 0 ? cols1 : cols2,
      });
    }
  }

  const columns: { pos: [number, number, number]; delay: number }[] = [
    { pos: [-3.5, 2, -3.5], delay: 1.0 },
    { pos: [3.5, 2, -3.5], delay: 1.1 },
    { pos: [-3.5, 2, 3.5], delay: 1.2 },
    { pos: [3.5, 2, 3.5], delay: 1.3 },
  ];

  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, 8, -5]} intensity={0.8} color="#ffe0a0" />
      <PulsingLight />
      <DustParticles />
      {tiles.map((t, i) => (
        <ArenaTile key={i} position={t.pos} delay={t.delay} color={t.color} />
      ))}
      {columns.map((c, i) => (
        <ArenaColumn key={i} position={c.pos} delay={c.delay} />
      ))}
      {/* Ánh sáng nền dưới sàn */}
      <pointLight
        position={[0, -1, 0]}
        color="#4040ff"
        intensity={0.8}
        distance={8}
      />
    </>
  );
}

// Chữ nhấp nháy
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
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      {/* Three.js canvas */}
      <div className="w-full" style={{ height: "60vh" }}>
        <Canvas camera={{ position: [0, 6, 10], fov: 50 }} gl={{ antialias: true }}>
          <ArenaScene />
        </Canvas>
      </div>

      {/* Text bên dưới */}
      <div className="flex flex-col items-center gap-3 mt-4">
        <p className="text-yellow-300 text-2xl font-bold tracking-widest uppercase">
          Đang xây dựng đấu trường
          <BlinkingDots />
        </p>
        <div className="w-64 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-600 to-yellow-300 rounded-full"
            style={{ animation: "arena-progress 3s ease-in-out infinite" }}
          />
        </div>
      </div>

      <style>{`
        @keyframes arena-progress {
          0% { width: 0%; }
          60% { width: 85%; }
          90% { width: 95%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
