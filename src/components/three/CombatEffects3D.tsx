/**
 * CombatEffects3D
 * Global 3D effects for combat events:
 * - Stat boost: Green upward particles
 * - Debuff: Red downward smoke
 * - Critical hit: Screen shake + white flash
 */

import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Stat Boost Particles (green upward) ───────────────────────────────────────
function StatBoostEffect({
  position,
  trigger,
}: {
  position: [number, number, number];
  trigger: boolean;
}) {
  const mesh = useRef<THREE.Points>(null!);
  const count = 30;
  const startTime = useRef(0);

  useEffect(() => {
    if (trigger) startTime.current = Date.now();
  }, [trigger]);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = position[0] + (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 1] = position[1];
      pos[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 0.5;
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = 0.02 + Math.random() * 0.03;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    return [pos, vel];
  }, [position]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
    return g;
  }, [positions]);

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    if (elapsed > 0 && elapsed < 2) {
      const pos = mesh.current.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < count; i++) {
        pos[i * 3] += velocities[i * 3];
        pos[i * 3 + 1] += velocities[i * 3 + 1];
        pos[i * 3 + 2] += velocities[i * 3 + 2];
      }
      mesh.current.geometry.attributes.position.needsUpdate = true;
      if (mesh.current.material instanceof THREE.PointsMaterial) {
        mesh.current.material.opacity = Math.max(0, 1 - elapsed / 2);
      }
    }
  });

  return (
    <points ref={mesh} geometry={geo}>
      <pointsMaterial
        size={0.05}
        color="#10b981"
        transparent
        opacity={1}
        sizeAttenuation
      />
    </points>
  );
}

// ── Debuff Smoke (red downward) ───────────────────────────────────────────────
function DebuffEffect({
  position,
  trigger,
}: {
  position: [number, number, number];
  trigger: boolean;
}) {
  const mesh = useRef<THREE.Points>(null!);
  const count = 40;
  const startTime = useRef(0);

  useEffect(() => {
    if (trigger) startTime.current = Date.now();
  }, [trigger]);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = position[0] + (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 1] = position[1];
      pos[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 0.5;
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = -0.015 - Math.random() * 0.02;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    return [pos, vel];
  }, [position]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
    return g;
  }, [positions]);

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    if (elapsed > 0 && elapsed < 2) {
      const pos = mesh.current.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < count; i++) {
        pos[i * 3] += velocities[i * 3];
        pos[i * 3 + 1] += velocities[i * 3 + 1];
        pos[i * 3 + 2] += velocities[i * 3 + 2];
      }
      mesh.current.geometry.attributes.position.needsUpdate = true;
      if (mesh.current.material instanceof THREE.PointsMaterial) {
        mesh.current.material.opacity = Math.max(0, 1 - elapsed / 2);
      }
    }
  });

  return (
    <points ref={mesh} geometry={geo}>
      <pointsMaterial
        size={0.06}
        color="#ef4444"
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ── Critical Hit Screen Shake + Flash ─────────────────────────────────────────
function CriticalHitEffect({ trigger }: { trigger: boolean }) {
  const flashRef = useRef<THREE.Mesh>(null!);
  const startTime = useRef(0);

  useEffect(() => {
    if (trigger) startTime.current = Date.now();
  }, [trigger]);

  useFrame(({ camera }) => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    if (elapsed > 0 && elapsed < 0.5) {
      camera.position.x = Math.random() * 0.1 - 0.05;
      camera.position.y = Math.random() * 0.1 - 0.05;
      if (
        flashRef.current &&
        flashRef.current.material instanceof THREE.MeshBasicMaterial
      ) {
        flashRef.current.material.opacity = Math.max(0, 0.5 - elapsed);
      }
    } else {
      camera.position.x = 0;
      camera.position.y = 0;
    }
  });

  return (
    <mesh ref={flashRef} position={[0, 0, 5]}>
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0} />
    </mesh>
  );
}

// ── Exported Wrapper ──────────────────────────────────────────────────────────
interface CombatEffects3DProps {
  boostTrigger: boolean;
  debuffTrigger: boolean;
  criticalTrigger: boolean;
  position: [number, number, number]; // e.g. player position in scene
}

export function CombatEffects3D({
  boostTrigger,
  debuffTrigger,
  criticalTrigger,
  position,
}: CombatEffects3DProps) {
  return (
    <>
      {boostTrigger && (
        <StatBoostEffect position={position} trigger={boostTrigger} />
      )}
      {debuffTrigger && (
        <DebuffEffect position={position} trigger={debuffTrigger} />
      )}
      {criticalTrigger && <CriticalHitEffect trigger={criticalTrigger} />}
    </>
  );
}
