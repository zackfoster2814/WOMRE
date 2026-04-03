import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CombatEffects3D } from "./CombatEffects3D";

// ── Khung viền Kim Loại Khắc (Engraved Metal Border) thay cho Neon ─────────
function EngravedMetalBorder({ isWinner, color }: { isWinner: boolean; color: string }) {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (isWinner) {
      mesh.current.rotation.z = t * 0.4; 
    } else {
      // Idle hơi lắc nhẹ
      mesh.current.rotation.z = Math.sin(t * 0.5) * 0.05;
    }
  });

  return (
    <group>
      {/* Viền kim loại */}
      <mesh ref={mesh}>
        <torusGeometry args={[1.7, 0.03, 16, 64]} />
        <meshStandardMaterial
          color={isWinner ? "#ffd700" : "#a0a0a0"} // Gold vs Silver/Iron
          roughness={0.2}
          metalness={0.9}
          emissive={isWinner ? new THREE.Color("#cc8800") : new THREE.Color(color).multiplyScalar(0.2)}
          emissiveIntensity={isWinner ? 0.6 : 0.2}
        />
      </mesh>
      {/* Vầng sáng phép đằng sau */}
      {isWinner && (
        <mesh>
          <torusGeometry args={[1.7, 0.08, 8, 64]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// ── Mưa Cát Vàng (Phủ lên The Winner) ──────────────────────────────────────────
function WinnerGoldDust() {
  const mesh = useRef<THREE.Points>(null!);
  const count = 120;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 1.0;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
      
      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = 0.02 + Math.random() * 0.04;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    return [pos, vel];
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
    return geo;
  }, [positions]);

  useFrame(() => {
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities[i * 3];
      pos[i * 3 + 1] += velocities[i * 3 + 1];
      pos[i * 3 + 2] += velocities[i * 3 + 2];
      
      const dist = Math.sqrt(pos[i * 3] ** 2 + pos[i * 3 + 1] ** 2);
      if (dist > 3 || pos[i * 3 + 1] > 2.5) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.5 + Math.random() * 1.0;
        pos[i * 3] = Math.cos(angle) * radius;
        pos[i * 3 + 1] = -2; // Rớt xuống đáy
        pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh} geometry={geometry}>
      <pointsMaterial size={0.06} color="#ffd700" transparent opacity={0.8} sizeAttenuation blending={THREE.AdditiveBlending}/>
    </points>
  );
}

// ── Tàn ma pháp lơ lửng (Ambient Particles) ──────────────────────────────────
function MagicAmbientParticles({ color }: { color: string }) {
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
      pos[i * 3 + 1] += 0.003;
      if (pos[i * 3 + 1] > 3) pos[i * 3 + 1] = -3;
      pos[i * 3] += Math.sin(t * 1.5 + i) * 0.002;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
    if (mesh.current.material instanceof THREE.PointsMaterial) {
      mesh.current.material.opacity = 0.2 + Math.sin(t * 2 + 1) * 0.15;
    }
  });

  return (
    <points ref={mesh} geometry={geo}>
      <pointsMaterial size={0.05} color={color} transparent opacity={0.4} sizeAttenuation blending={THREE.AdditiveBlending}/>
    </points>
  );
}

// ── Bóng Đen Ám Ảnh (Dark magic flash khi bị mất điểm) ────────────────────────
function DarkVoidFlash({ trigger }: { trigger: boolean }) {
  const flashRef = useRef<THREE.Mesh>(null!);
  const startTime = useRef(0);

  useEffect(() => {
    if (trigger) startTime.current = Date.now();
  }, [trigger]);

  useFrame(({ camera }) => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    if (elapsed > 0 && elapsed < 0.5) {
      // Shake
      camera.position.x = (Math.random() - 0.5) * 0.1;
      camera.position.y = (Math.random() - 0.5) * 0.1;
      if (flashRef.current && flashRef.current.material instanceof THREE.MeshBasicMaterial) {
        flashRef.current.material.opacity = Math.max(0, 0.6 - elapsed * 1.2);
      }
    } else {
      camera.position.x = 0; camera.position.y = 0;
    }
  });

  return (
    <mesh ref={flashRef} position={[0, 0, 1]}>
      <planeGeometry args={[8, 8]} />
      {/* Blend đen tím che lại */}
      <meshBasicMaterial color="#1a0033" transparent opacity={0} blending={THREE.MultiplyBlending} />
    </mesh>
  );
}

// ── Linh Hoạt Thở (Card Breathe Scale) ───────────────────────────────────────
function CardBreathe({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    group.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 1.5) * 0.015);
  });
  return <group ref={group}>{children}</group>;
}

// ── Hover Tilt ───────────────────────────────────────────────────────────────
function HoverTilt({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null!);
  const { mouse } = useThree();
  useFrame(() => {
    if (group.current) {
      const x = mouse.x * 0.12;
      const y = -mouse.y * 0.12;
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, y, 0.1);
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, x, 0.1);
    }
  });
  return <group ref={group}>{children}</group>;
}

// ── Main Component ────────────────────────────────────────────────────────────
interface PlayerCard3DFrameProps {
  side: "left" | "right";
  isWinner: boolean;
  stats?: Record<string, number>;
  boostTrigger?: boolean;
  debuffTrigger?: boolean;
  children: React.ReactNode;
}

export function PlayerCard3DFrame({
  side, isWinner, boostTrigger = false, debuffTrigger = false, children,
}: PlayerCard3DFrameProps) {
  const color = side === "left" ? "#3b82f6" : "#ef4444";
  const [damageTrigger, setDamageTrigger] = useState(false);

  useEffect(() => {
    if (!isWinner) {
      setDamageTrigger(true);
      setTimeout(() => setDamageTrigger(false), 600);
    }
  }, [isWinner]);

  return (
    <div className="relative rounded-none overflow-hidden" style={{ isolation: "isolate" }}>
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <Canvas camera={{ position: [0, 0, 3.5], fov: 50 }} gl={{ alpha: true, antialias: true }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 5, 3]} intensity={2} />
          <HoverTilt>
            <CardBreathe>
              <EngravedMetalBorder isWinner={isWinner} color={color} />
              <MagicAmbientParticles color={isWinner ? "#ffd700" : color} />
              {isWinner && <WinnerGoldDust />}
              
              {damageTrigger && <DarkVoidFlash trigger={damageTrigger} />}
              <CombatEffects3D
                boostTrigger={boostTrigger}
                debuffTrigger={debuffTrigger}
                criticalTrigger={false}
                position={[0, 0, 0]}
              />
            </CardBreathe>
          </HoverTilt>
        </Canvas>
      </div>

      <div className="relative" style={{ zIndex: 1 }}>{children}</div>
    </div>
  );
}
