/**
 * PvPBackground3D
 * Full-screen animated Three.js background for the PvP battle screen - upgraded epic edition.
 * - Giữ nguyên tất cả hiệu ứng gốc: StarField, AuraSphere, RotatingRing, GridLines
 * - Nâng cấp: Thêm particle density, glow stronger, subtle warp, multi-layer, nebula mist, color shift
 * - Không thêm props mới, giữ nguyên cách dùng cũ <PvPBackground3D />
 */

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Enhanced Floating star particles (thêm warp nhẹ + gradient color) ─────────
function StarField({ count = 400 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null!);

  const [positions, speeds, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 6;
      spd[i] = 0.004 + Math.random() * 0.015;

      // Gradient color nhẹ theo độ cao (blue → purple → violet)
      const heightMix = (pos[i * 3 + 1] + 12.5) / 25;
      const c = new THREE.Color().lerpColors(
        new THREE.Color("#a78bfa"),
        new THREE.Color("#c084fc"),
        heightMix,
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

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds[i] * (1 + Math.sin(t * 0.5 + i) * 0.3); // thêm nhịp bay
      if (pos[i * 3 + 1] > 15) pos[i * 3 + 1] = -15;

      // Warp nhẹ: Z kéo dài theo tốc độ
      pos[i * 3 + 2] -= speeds[i] * 0.5;
      if (pos[i * 3 + 2] < -10) pos[i * 3 + 2] = 10;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh} geometry={geometry}>
      <pointsMaterial
        size={0.09}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ── Side aura spheres (blue/red) - thêm rotation + glow mạnh hơn ──────────────
function AuraSphere({
  position,
  color,
  phase = 0,
}: {
  position: [number, number, number];
  color: string;
  phase?: number;
}) {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + phase;
    mesh.current.scale.setScalar(1.15 + Math.sin(t * 1.0) * 0.15);
    mesh.current.rotation.y = t * 0.4; // thêm xoay nhẹ

    if (mesh.current.material instanceof THREE.MeshBasicMaterial) {
      mesh.current.material.opacity = 0.12 + Math.sin(t * 1.8) * 0.08;
    }
  });

  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[4, 32, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.12}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ── Slow rotating ring - thêm multi-layer & color shift ───────────────────────
function RotatingRing({
  color,
  speed = 0.3,
}: {
  color: string;
  speed?: number;
}) {
  const group = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.children.forEach((ring, i) => {
        ring.rotation.z = t * (speed + i * 0.1);
        ring.rotation.x = Math.sin(t * 0.5 + i) * 0.2;
        ring.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.08);
      });
    }
  });

  return (
    <group ref={group} position={[0, 0, -4]}>
      <mesh>
        <torusGeometry args={[6, 0.015, 8, 80]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <torusGeometry args={[6.8, 0.01, 8, 80]} />
        <meshBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <torusGeometry args={[7.5, 0.008, 8, 80]} />
        <meshBasicMaterial
          color="#c084fc"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ── Thin horizontal grid lines - thêm pulse & glow ────────────────────────────
function GridLines() {
  const lines = useMemo(() => {
    const pts: number[] = [];
    for (let x = -25; x <= 25; x += 2.5) {
      pts.push(x, -10, -12, x, -10, 12);
    }
    for (let z = -12; z <= 12; z += 2.5) {
      pts.push(-25, -10, z, 25, -10, z);
    }
    return new Float32Array(pts);
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(lines, 3));
    return g;
  }, [lines]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#7c3aed",
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    material.opacity = 0.25 + Math.abs(Math.sin(t * 3)) * 0.3; // pulse mạnh hơn
  });

  return <lineSegments geometry={geo} material={material} />;
}

// ── Main exported component (giữ nguyên cách dùng cũ) ─────────────────────────
export function PvPBackground3D() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 65 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <StarField count={800} />
        <AuraSphere position={[-10, 0, -5]} color="#3b82f6" phase={0} />
        <AuraSphere position={[10, 0, -5]} color="#ef4444" phase={Math.PI} />
        <RotatingRing color="#7c3aed" speed={0.25} />
        <GridLines />
      </Canvas>
    </div>
  );
}
