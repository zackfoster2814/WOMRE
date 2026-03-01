/**
 * BracketBackground3D
 * Lightweight Three.js animated background cho bracket tree view.
 * Nhẹ hơn PvPBackground3D: ít particles, opacity thấp, không gây lag khi hiện 64+ cards.
 */

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Subtle drifting stars (ít và mờ hơn PvPBackground3D) ─────────────────────
function BracketStarField({ count = 150 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null!);

  const [positions, speeds, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 8;
      spd[i] = 0.001 + Math.random() * 0.003; // rất chậm

      const c = new THREE.Color().lerpColors(
        new THREE.Color("#5b21b6"),
        new THREE.Color("#7c3aed"),
        Math.random(),
      );
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, spd, col];
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  useFrame(() => {
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds[i];
      if (pos[i * 3 + 1] > 15) pos[i * 3 + 1] = -15;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh} geometry={geometry}>
      <pointsMaterial
        size={0.07}
        vertexColors
        transparent
        opacity={0.45}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ── Faint scan lines (grid tournament feel) ──────────────────────────────────
function ScanLines() {
  const matRef = useRef<THREE.LineBasicMaterial>(null!);

  const geo = useMemo(() => {
    const pts: number[] = [];
    // Horizontal lines
    for (let y = -15; y <= 15; y += 3) {
      pts.push(-30, y, -12, 30, y, -12);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
    return g;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (matRef.current) {
      matRef.current.opacity = 0.04 + Math.abs(Math.sin(t * 0.4)) * 0.06;
    }
  });

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial
        ref={matRef}
        color="#4c1d95"
        transparent
        opacity={0.05}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

// ── Ambient glow orb (center-bottom, rất mờ) ─────────────────────────────────
function AmbientGlow() {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (mesh.current.material instanceof THREE.MeshBasicMaterial) {
      mesh.current.material.opacity = 0.03 + Math.sin(t * 0.5) * 0.02;
    }
  });

  return (
    <mesh ref={mesh} position={[0, -8, -15]}>
      <sphereGeometry args={[12, 16, 16]} />
      <meshBasicMaterial
        color="#7c3aed"
        transparent
        opacity={0.04}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export function BracketBackground3D() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        style={{ background: "transparent" }}
        dpr={[1, 1.5]}
        frameloop="always"
      >
        <BracketStarField count={150} />
        <ScanLines />
        <AmbientGlow />
      </Canvas>
    </div>
  );
}
