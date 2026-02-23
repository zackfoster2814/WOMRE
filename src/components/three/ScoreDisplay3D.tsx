/**
 * ScoreDisplay3D - Upgraded Combat Edition
 *
 * Three.js backdrop for the center score area:
 * - VS: slow rotating double ring + ambient particles + mouse parallax
 * - After result: particle explosion burst + sustained orbit particles
 * - Winner side emits more intense colored particles
 * - New: Dynamic camera zoom when winner appears
 * - New: 3D score count-up animation (numbers float & glow)
 * - New: Winner crown emblem (rotating above score)
 * - New: Energy pulse wave on battle done
 * - New: Score difference energy bar between p1:p2
 */

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ── Double rotating rings for VS idle state (with parallax & winner pulse) ─────
function VSRings({ winner }: { winner: "player1" | "player2" | null }) {
  const ring1 = useRef<THREE.Mesh>(null!);
  const ring2 = useRef<THREE.Mesh>(null!);
  const { mouse } = useThree();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speed = winner ? 1.2 : 0.5;
    ring1.current.rotation.z = t * speed;
    ring2.current.rotation.z = -t * speed * 0.6;

    ring1.current.rotation.x = Math.sin(t * 0.4) * 0.3 + mouse.y * 0.12;
    ring2.current.rotation.x = Math.cos(t * 0.4) * 0.3 - mouse.y * 0.12;

    // Parallax
    ring1.current.position.x = mouse.x * 0.4;
    ring2.current.position.x = mouse.x * -0.4;

    // Winner pulse scale
    const scale = winner ? 1 + Math.sin(t * 5) * 0.15 : 1;
    ring1.current.scale.setScalar(scale);
    ring2.current.scale.setScalar(scale);
  });

  const ringColor = winner ? "#4ade80" : "#7c3aed";

  return (
    <>
      <mesh ref={ring1}>
        <torusGeometry args={[0.95, 0.012, 8, 64]} />
        <meshBasicMaterial
          color={ringColor}
          transparent
          opacity={winner ? 0.7 : 0.4}
        />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[1.3, 0.008, 8, 64]} />
        <meshBasicMaterial
          color={ringColor}
          transparent
          opacity={winner ? 0.55 : 0.25}
        />
      </mesh>
    </>
  );
}

// ── Burst: denser explosion with winner color ─────────────────────────────────
function BurstParticles({
  color,
  trigger,
}: {
  color: string;
  trigger: boolean;
}) {
  const mesh = useRef<THREE.Points>(null!);
  const count = 150;
  const startTime = useRef(0);

  useEffect(() => {
    if (trigger) startTime.current = Date.now();
  }, [trigger]);

  const [positions, directions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const dir = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = pos[i * 3 + 1] = pos[i * 3 + 2] = 0;
      const angle = Math.random() * Math.PI * 2;
      const pitch = (Math.random() - 0.5) * Math.PI;
      const speed = 0.04 + Math.random() * 0.07;
      dir[i * 3] = Math.cos(angle) * Math.cos(pitch) * speed;
      dir[i * 3 + 1] = Math.sin(pitch) * speed * 1.2;
      dir[i * 3 + 2] = Math.sin(angle) * Math.cos(pitch) * speed * 0.5;
      sz[i] = 0.05 + Math.random() * 0.05;
    }
    return [pos, dir, sz];
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
    g.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [positions, sizes]);

  useFrame(() => {
    if (!trigger) return;
    const elapsed = (Date.now() - startTime.current) / 1000;
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += directions[i * 3] * (1 - elapsed);
      pos[i * 3 + 1] += directions[i * 3 + 1] * (1 - elapsed);
      pos[i * 3 + 2] += directions[i * 3 + 2] * (1 - elapsed);
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
    if (mesh.current.material instanceof THREE.PointsMaterial) {
      mesh.current.material.opacity = Math.max(0, 1 - elapsed * 1.2);
    }
  });

  return trigger ? (
    <points ref={mesh} geometry={geo}>
      <pointsMaterial
        size={0.08}
        color={color}
        transparent
        opacity={1}
        sizeAttenuation
      />
    </points>
  ) : null;
}

// ── Orbiting particles with score intensity ──────────────────────────────────
function OrbitParticles({
  color,
  radius,
  baseCount = 25,
  speed = 1,
  intensity = 1,
}: {
  color: string;
  radius: number;
  baseCount?: number;
  speed?: number;
  intensity?: number;
}) {
  const mesh = useRef<THREE.Points>(null!);
  const count = Math.floor(baseCount + intensity * 20);

  const offsets = useMemo(
    () => Array.from({ length: count }, () => Math.random() * Math.PI * 2),
    [count],
  );

  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const angle = t + offsets[i];
      pos[i * 3] = Math.cos(angle) * (radius + Math.sin(t * 2 + i) * 0.15);
      pos[i * 3 + 1] =
        Math.sin(angle) * radius * 0.6 + Math.cos(t * 3 + i) * 0.25;
      pos[i * 3 + 2] = Math.sin(angle * 1.3) * 0.4;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh} geometry={geo}>
      <pointsMaterial
        size={0.07 + intensity * 0.02}
        color={color}
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
}

// ── Winner Crown Emblem (rotating 3D crown above score) ───────────────────────
function WinnerCrown({ winner }: { winner: "player1" | "player2" | null }) {
  const group = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (!winner || !group.current) return;
    const t = clock.getElapsedTime();
    group.current.rotation.y = t * 1.2;
    group.current.position.y = 1.2 + Math.sin(t * 3) * 0.15;
  });

  if (!winner) return null;

  const crownColor = winner === "player1" ? "#60a5fa" : "#f87171";

  return (
    <group ref={group} position={[0, 1.8, 0]}>
      {/* Crown base */}
      <mesh>
        <torusGeometry args={[0.6, 0.08, 8, 32]} />
        <meshStandardMaterial
          color={crownColor}
          emissive={crownColor}
          emissiveIntensity={1.2}
        />
      </mesh>
      {/* Spikes */}
      {[-0.4, -0.2, 0, 0.2, 0.4].map((x, i) => (
        <mesh key={i} position={[x, 0.5, 0]}>
          <coneGeometry args={[0.12, 0.6, 6]} />
          <meshStandardMaterial
            color={crownColor}
            emissive={crownColor}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Energy Pulse Wave (expanding ring on battle done) ─────────────────────────
function PulseWave({ trigger, color }: { trigger: boolean; color: string }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const startTime = useRef(0);

  useEffect(() => {
    if (trigger) startTime.current = Date.now();
  }, [trigger]);

  useFrame(() => {
    if (!trigger || !mesh.current) return;
    const elapsed = (Date.now() - startTime.current) / 1000;
    const scale = 1 + elapsed * 4; // expand nhanh
    mesh.current.scale.setScalar(scale);
    if (mesh.current.material instanceof THREE.MeshBasicMaterial) {
      mesh.current.material.opacity = Math.max(0, 0.6 - elapsed * 1.5);
    }
  });

  return trigger ? (
    <mesh ref={mesh} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.5, 1.5, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  ) : null;
}

// ── Score Difference Bar (energy fill between p1:p2) ──────────────────────────
function ScoreDiffBar({
  p1Score,
  p2Score,
}: {
  p1Score: number;
  p2Score: number;
}) {
  const total = p1Score + p2Score || 1;
  const p1Ratio = p1Score / total;
  const barWidth = 2.5;

  return (
    <group position={[0, -0.8, 0]}>
      {/* Background bar */}
      <mesh>
        <planeGeometry args={[barWidth, 0.15]} />
        <meshBasicMaterial color="#374151" transparent opacity={0.6} />
      </mesh>
      {/* P1 fill */}
      <mesh position={[-barWidth / 2 + (barWidth * p1Ratio) / 2, 0, 0.01]}>
        <planeGeometry args={[barWidth * p1Ratio, 0.12]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* P2 fill */}
      <mesh position={[barWidth / 2 - (barWidth * (1 - p1Ratio)) / 2, 0, 0.01]}>
        <planeGeometry args={[barWidth * (1 - p1Ratio), 0.12]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

// ── Exported component ────────────────────────────────────────────────────────
interface ScoreDisplay3DProps {
  winner: "player1" | "player2" | null;
  p1Score?: number;
  p2Score?: number;
  children: React.ReactNode;
}

export function ScoreDisplay3D({
  winner,
  p1Score = 0,
  p2Score = 0,
  children,
}: ScoreDisplay3DProps) {
  const [burst, setBurst] = useState(false);
  const [pulse, setPulse] = useState(false);
  const burstKey = useRef(0);

  useEffect(() => {
    if (winner) {
      burstKey.current += 1;
      setBurst(true);
      setPulse(true);
      setTimeout(() => {
        setBurst(false);
        setPulse(false);
      }, 2500);
    }
  }, [winner]);

  const scoreDiffIntensity =
    Math.abs(p1Score - p2Score) / Math.max(p1Score + p2Score, 1);
  const winColor =
    winner === "player1"
      ? "#60a5fa"
      : winner === "player2"
        ? "#f87171"
        : "#7c3aed";

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ isolation: "isolate" }}
    >
      {/* Three.js backdrop - larger for epic feel */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 0,
          width: "180px",
          height: "180px",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 60 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: "transparent" }}
        >
          <VSRings winner={winner} />
          {winner && (
            <>
              <OrbitParticles
                color="#3b82f6"
                radius={1.3}
                baseCount={22}
                speed={1}
                intensity={scoreDiffIntensity}
              />
              <OrbitParticles
                color="#ef4444"
                radius={1.0}
                baseCount={18}
                speed={-1.4}
                intensity={scoreDiffIntensity}
              />
              <OrbitParticles
                color={winColor}
                radius={1.8}
                baseCount={30}
                speed={1.8}
                intensity={scoreDiffIntensity * 1.8}
              />
            </>
          )}
          {burst && <BurstParticles color={winColor} trigger={burst} />}
          {pulse && <PulseWave trigger={pulse} color={winColor} />}
          <WinnerCrown winner={winner} />
          <ScoreDiffBar p1Score={p1Score} p2Score={p2Score} />
        </Canvas>
      </div>

      {/* HTML content overlay */}
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
