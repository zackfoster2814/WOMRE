/**
 * PlayerCard3D
 *
 * Wraps the HTML player card in a Three.js scene that adds:
 * - Animated border glow (blue/red neon ring)
 * - Floating particle halo when isWinner
 * - Card "breathe" scale animation
 * - Damage taken effect (screen shake + red flash when losing)
 * - Stat-dependent particles (fire for STR, wind for SPD, etc.)
 * - Mouse hover tilt interaction
 *
 * The HTML content (stats, name, etc.) is overlaid via CSS absolute positioning.
 * The Three.js Canvas is the visual backdrop/frame only.
 */

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ── Neon border ring ──────────────────────────────────────────────────────────
function NeonBorderRing({
  color,
  isWinner,
}: {
  color: string;
  isWinner: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = isWinner
      ? 0.6 + Math.abs(Math.sin(t * 4)) * 0.4 // faster & brighter pulse when win
      : 0.2 + Math.sin(t * 1.5) * 0.1; // gentle idle glow
    if (mesh.current.material instanceof THREE.MeshBasicMaterial) {
      mesh.current.material.opacity = pulse;
    }
    if (isWinner) {
      mesh.current.rotation.z = t * 0.8; // spin faster
    }
  });

  return (
    <mesh ref={mesh}>
      <torusGeometry args={[1.65, isWinner ? 0.03 : 0.015, 8, 64]} />
      <meshBasicMaterial
        color={isWinner ? "#4ade80" : color}
        transparent
        opacity={0.4}
      />
    </mesh>
  );
}

// ── Winner particle burst (enhanced with more density) ────────────────────────
function WinnerParticles({ color }: { color: string }) {
  const mesh = useRef<THREE.Points>(null!);
  const count = 100; // tăng số particle cho bùng nổ hơn

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.4 + Math.random() * 0.6;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
      vel[i * 3] = (Math.random() - 0.5) * 0.03;
      vel[i * 3 + 1] = 0.01 + Math.random() * 0.025;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.015;
    }
    return [pos, vel];
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions.slice(), 3),
    );
    return geo;
  }, [positions]);

  useFrame(() => {
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities[i * 3];
      pos[i * 3 + 1] += velocities[i * 3 + 1];
      pos[i * 3 + 2] += velocities[i * 3 + 2];
      // Reset khi ra xa
      const dist = Math.sqrt(pos[i * 3] ** 2 + pos[i * 3 + 1] ** 2);
      if (dist > 4) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.3 + Math.random() * 0.4;
        pos[i * 3] = Math.cos(angle) * radius;
        pos[i * 3 + 1] = Math.sin(angle) * radius;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh} geometry={geometry}>
      <pointsMaterial
        size={0.06}
        color={color}
        transparent
        opacity={0.95}
        sizeAttenuation
      />
    </points>
  );
}

// ── Idle ambient particles (tiny floaters) ────────────────────────────────────
function AmbientParticles({ color }: { color: string }) {
  const mesh = useRef<THREE.Points>(null!);
  const count = 40;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3.5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    return pos;
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += 0.004;
      if (pos[i * 3 + 1] > 3) pos[i * 3 + 1] = -3;
      pos[i * 3] += Math.sin(t * 2 + i) * 0.002;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
    if (mesh.current.material instanceof THREE.PointsMaterial) {
      mesh.current.material.opacity = 0.35 + Math.sin(t * 3 + 1) * 0.15;
    }
  });

  return (
    <points ref={mesh} geometry={geo}>
      <pointsMaterial
        size={0.04}
        color={color}
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

// ── Card Breathe Scale (toàn bộ card lên xuống nhẹ) ───────────────────────────
function CardBreathe({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const scale = 1 + Math.sin(t * 1.2) * 0.015; // breathe nhẹ
    group.current.scale.setScalar(scale);
  });

  return <group ref={group}>{children}</group>;
}

// ── Damage Taken Effect (red flash + shake) ──────────────────────────────────
function DamageFlash({ trigger }: { trigger: boolean }) {
  const flashRef = useRef<THREE.Mesh>(null!);
  const startTime = useRef(0);

  useEffect(() => {
    if (trigger) startTime.current = Date.now();
  }, [trigger]);

  useFrame(({ camera }) => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    if (elapsed > 0 && elapsed < 0.4) {
      // Shake nhẹ
      camera.position.x = (Math.random() - 0.5) * 0.08;
      camera.position.y = (Math.random() - 0.5) * 0.08;
      // Flash đỏ
      if (
        flashRef.current &&
        flashRef.current.material instanceof THREE.MeshBasicMaterial
      ) {
        flashRef.current.material.opacity = Math.max(0, 0.4 - elapsed * 1.5);
      }
    } else {
      camera.position.x = 0;
      camera.position.y = 0;
    }
  });

  return (
    <mesh ref={flashRef} position={[0, 0, 4]}>
      <planeGeometry args={[8, 8]} />
      <meshBasicMaterial color="#ef4444" transparent opacity={0} />
    </mesh>
  );
}

// ── Stat-dependent Particles (ví dụ: fire cho STR, wind cho SPD) ─────────────
function StatParticles({
  stats,
  isWinner,
}: {
  stats: Record<string, number>;
  isWinner: boolean;
}) {
  const mesh = useRef<THREE.Points>(null!);
  const count = 50;

  const [positions, _velocities, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3); // giữ để sau này dễ mở rộng
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Random vị trí quanh card
      pos[i * 3] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1;

      // Velocity dựa trên stat cao nhất (giữ nguyên để sau dùng)
      const maxStat = Math.max(...Object.values(stats));
      const isFire = stats.str === maxStat;
      const isWind = stats.spd === maxStat;

      vel[i * 3] = (Math.random() - 0.5) * (isWind ? 0.03 : 0.01);
      vel[i * 3 + 1] = isFire
        ? 0.02 + Math.random() * 0.03
        : (Math.random() - 0.5) * 0.015;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

      // Color theo stat dominant
      const c = isFire
        ? new THREE.Color("#ef4444")
        : isWind
          ? new THREE.Color("#3b82f6")
          : new THREE.Color("#a78bfa");
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, vel, col];
  }, [stats]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = isWinner
      ? 0.5 + Math.abs(Math.sin(t * 3)) * 0.5
      : 0.15 + Math.sin(t * 1.2) * 0.08;

    if (mesh.current.material instanceof THREE.MeshBasicMaterial) {
      mesh.current.material.opacity = pulse;
    }
    if (isWinner) {
      mesh.current.rotation.z = t * 0.5;
    }
  });

  return (
    <points ref={mesh} geometry={geo}>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={isWinner ? 0.9 : 0.5}
        sizeAttenuation
      />
    </points>
  );
}

// ── Mouse Hover Tilt ──────────────────────────────────────────────────────────
function HoverTilt({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null!);
  const { mouse } = useThree();

  useFrame(() => {
    if (group.current) {
      const x = mouse.x * 0.15; // tilt theo chuột
      const y = -mouse.y * 0.15;
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        y,
        0.1,
      );
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        x,
        0.1,
      );
    }
  });

  return <group ref={group}>{children}</group>;
}

// ── Exported component ────────────────────────────────────────────────────────
interface PlayerCard3DFrameProps {
  side: "left" | "right";
  isWinner: boolean;
  stats?: Record<string, number>; // optional, để render stat particles
  children: React.ReactNode;
}

export function PlayerCard3DFrame({
  side,
  isWinner,
  stats = { str: 10, spd: 10, dur: 10, iq: 10, biq: 10, ma: 10 }, // default
  children,
}: PlayerCard3DFrameProps) {
  const color = side === "left" ? "#3b82f6" : "#ef4444";
  const winColor = "#4ade80";
  const [damageTrigger, setDamageTrigger] = useState(false);

  // Simulate damage taken (có thể bind với state thua round từ parent)
  useEffect(() => {
    if (!isWinner) {
      setDamageTrigger(true);
      setTimeout(() => setDamageTrigger(false), 600);
    }
  }, [isWinner]);

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ isolation: "isolate" }}
    >
      {/* Three.js canvas backdrop */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <Canvas
          camera={{ position: [0, 0, 3.5], fov: 50 }}
          gl={{ alpha: true, antialias: false }}
          style={{ background: "transparent" }}
        >
          <HoverTilt>
            <CardBreathe>
              <NeonBorderRing color={color} isWinner={isWinner} />
              <AmbientParticles color={isWinner ? winColor : color} />
              {isWinner && <WinnerParticles color={winColor} />}
              <StatParticles stats={stats} isWinner={isWinner} />
              {damageTrigger && <DamageFlash trigger={damageTrigger} />}
            </CardBreathe>
          </HoverTilt>
        </Canvas>
      </div>

      {/* HTML content overlay */}
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
