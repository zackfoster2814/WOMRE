import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ── VSRings -> Astrolabe Dials (La bàn định mệnh) ─────────────────────────────
function AstrolabeDials({ winner }: { winner: "player1" | "player2" | null }) {
  const group = useRef<THREE.Group>(null!);
  const { mouse } = useThree();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speed = winner ? 1.5 : 0.6;
    
    if (group.current) {
      group.current.children.forEach((ring, i) => {
        const sign = i % 2 === 0 ? 1 : -1;
        ring.rotation.z = t * speed * sign * (1 - i * 0.2);
        ring.rotation.x = Math.sin(t * 0.4) * 0.3 + mouse.y * 0.15;
        ring.rotation.y = Math.cos(t * 0.4) * 0.3 + mouse.x * 0.15;
        
        // Winner pulse
        const scale = winner ? 1 + Math.sin(t * 6 + i) * 0.05 : 1;
        ring.scale.setScalar(scale);
      });
    }
  });

  const baseMaterial = new THREE.MeshStandardMaterial({
    color: winner ? "#ffd700" : "#a89f91", // Gold khi win, Bronze khi idle
    metalness: 0.9,
    roughness: 0.3,
    emissive: winner ? new THREE.Color("#cc8800") : new THREE.Color("#000000"),
    emissiveIntensity: winner ? 0.4 : 0,
  });

  return (
    <group ref={group}>
      <mesh material={baseMaterial}>
        <torusGeometry args={[0.95, 0.02, 16, 64]} />
      </mesh>
      <mesh material={baseMaterial}>
        <torusGeometry args={[1.2, 0.015, 16, 64]} />
      </mesh>
      <mesh material={baseMaterial}>
        <torusGeometry args={[1.4, 0.01, 16, 64]} />
      </mesh>
    </group>
  );
}

// ── Burst: Vụ nổ ma thuật (Thần Thánh) ───────────────────────────────────────
function BurstParticles({ color, trigger }: { color: string; trigger: boolean }) {
  const mesh = useRef<THREE.Points>(null!);
  const count = 200;
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
      const speed = 0.05 + Math.random() * 0.1;

      // Nổ ra theo hình cầu
      dir[i * 3] = Math.cos(angle) * Math.cos(pitch) * speed;
      dir[i * 3 + 1] = Math.sin(pitch) * speed;
      dir[i * 3 + 2] = Math.sin(angle) * Math.cos(pitch) * speed;
      sz[i] = 0.05 + Math.random() * 0.08;
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
      // Giảm tốc dần dần
      const drag = Math.max(0, 1 - elapsed * 1.5);
      pos[i * 3] += directions[i * 3] * drag;
      pos[i * 3 + 1] += directions[i * 3 + 1] * drag;
      pos[i * 3 + 2] += directions[i * 3 + 2] * drag;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
    
    if (mesh.current.material instanceof THREE.PointsMaterial) {
      mesh.current.material.opacity = Math.max(0, 1 - elapsed * 1.2);
    }
  });

  return trigger ? (
    <points ref={mesh} geometry={geo}>
      <pointsMaterial
        size={0.1}
        color={color}
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  ) : null;
}

// ── Quỹ đạo Tinh tú lượn lờ (Orbit Particles) ─────────────────────────────────
function OrbitParticles({ color, radius, baseCount = 20, speed = 1, intensity = 1 }: any) {
  const mesh = useRef<THREE.Points>(null!);
  const count = Math.floor(baseCount + intensity * 20);

  const offsets = useMemo(() => Array.from({ length: count }, () => Math.random() * Math.PI * 2), [count]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const angle = t + offsets[i];
      pos[i * 3] = Math.cos(angle) * (radius + Math.sin(t * 3 + i) * 0.1);
      pos[i * 3 + 1] = Math.sin(angle) * radius * 0.5 + Math.cos(t * 2 + i) * 0.2;
      pos[i * 3 + 2] = Math.sin(angle * 1.5) * 0.5;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh} geometry={geo}>
      <pointsMaterial size={0.06 + intensity * 0.03} color={color} transparent opacity={0.8} sizeAttenuation blending={THREE.AdditiveBlending}/>
    </points>
  );
}

// ── Vòng Sáng Thần Thánh (Thay cái Crown côn nhựa) ────────────────────────────
function DivineHalo({ winner }: { winner: "player1" | "player2" | null }) {
  const group = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (!winner || !group.current) return;
    const t = clock.getElapsedTime();
    group.current.rotation.y = t * 1.5;
    group.current.position.y = 1.3 + Math.sin(t * 2) * 0.1;
  });

  if (!winner) return null;
  const crownColor = winner === "player1" ? "#60a5fa" : "#f87171";

  return (
    <group ref={group} position={[0, 1.8, 0]} rotation={[Math.PI / 3, 0, 0]}>
      <mesh>
        <torusGeometry args={[0.5, 0.02, 16, 64]} />
        <meshBasicMaterial color={crownColor} transparent opacity={0.9} blending={THREE.AdditiveBlending}/>
      </mesh>
      {/* Tia sáng thánh tựa thập tự giá */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
        <mesh key={i} rotation={[0, 0, angle]} position={[Math.cos(angle)*0.5, Math.sin(angle)*0.5, 0]}>
          <coneGeometry args={[0.05, 0.4, 4]} />
          <meshBasicMaterial color={crownColor} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
      <pointLight color={crownColor} intensity={0.8} distance={3} />
    </group>
  );
}

// ── Sóng Phép Bay Hơi ─────────────────────────────────────────────────────────
function PulseWave({ trigger, color }: { trigger: boolean; color: string }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const startTime = useRef(0);

  useEffect(() => {
    if (trigger) startTime.current = Date.now();
  }, [trigger]);

  useFrame(() => {
    if (!trigger || !mesh.current) return;
    const elapsed = (Date.now() - startTime.current) / 1000;
    mesh.current.scale.setScalar(1 + elapsed * 6);
    if (mesh.current.material instanceof THREE.MeshBasicMaterial) {
      mesh.current.material.opacity = Math.max(0, 0.5 - elapsed * 1.2);
    }
  });

  return trigger ? (
    <mesh ref={mesh} rotation={[0, 0, 0]}>
      <ringGeometry args={[0.8, 1.2, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  ) : null;
}

// ── Thanh Sinh Lực / Mana Stream (Mana Bar) ──────────────────────────────────
function ManaStreamBar({ p1Score, p2Score }: { p1Score: number; p2Score: number }) {
  const total = p1Score + p2Score || 1;
  const p1Ratio = p1Score / total;
  const barWidth = 2.4;

  return (
    <group position={[0, -0.9, 0]}>
      {/* Viền Blade (Hơi nhọn ra 2 bên) */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[barWidth + 0.1, 0.14]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      <mesh position={[barWidth/2 + 0.05, 0, -0.01]} rotation={[0, 0, -Math.PI/2]}>
        <coneGeometry args={[0.07, 0.2, 3]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
      <mesh position={[-barWidth/2 - 0.05, 0, -0.01]} rotation={[0, 0, Math.PI/2]}>
        <coneGeometry args={[0.07, 0.2, 3]} />
        <meshBasicMaterial color="#111111" />
      </mesh>

      {/* P1 Mana */}
      <mesh position={[-barWidth / 2 + (barWidth * p1Ratio) / 2, 0, 0]}>
        <planeGeometry args={[barWidth * p1Ratio, 0.08]} />
        <meshBasicMaterial color="#3b82f6" blending={THREE.AdditiveBlending} />
      </mesh>
      {/* P2 Mana */}
      <mesh position={[barWidth / 2 - (barWidth * (1 - p1Ratio)) / 2, 0, 0]}>
        <planeGeometry args={[barWidth * (1 - p1Ratio), 0.08]} />
        <meshBasicMaterial color="#ef4444" blending={THREE.AdditiveBlending} />
      </mesh>
      
      {/* Vệt văng sáng ở giữa đường chia */}
      <mesh position={[-barWidth/2 + barWidth*p1Ratio, 0, 0.01]}>
        <planeGeometry args={[0.04, 0.2]} />
        <meshBasicMaterial color="#ffffff" blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

// ── Exported component ────────────────────────────────────────────────────────
interface ScoreDisplay3DProps {
  winner: "player1" | "player2" | null; p1Score?: number; p2Score?: number; children: React.ReactNode;
}

export function ScoreDisplay3D({ winner, p1Score = 0, p2Score = 0, children }: ScoreDisplay3DProps) {
  const [burst, setBurst] = useState(false);
  const [pulse, setPulse] = useState(false);
  const burstKey = useRef(0);

  useEffect(() => {
    if (winner) {
      burstKey.current += 1;
      setBurst(true); setPulse(true);
      setTimeout(() => { setBurst(false); setPulse(false); }, 2500);
    }
  }, [winner]);

  const scoreDiffIntensity = Math.abs(p1Score - p2Score) / Math.max(p1Score + p2Score, 1);
  const winColor = winner === "player1" ? "#60a5fa" : winner === "player2" ? "#f87171" : "#ffd700";

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ isolation: "isolate" }}>
      <div className="absolute inset-0" style={{ zIndex: 0, width: "180px", height: "180px", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ alpha: true, antialias: true }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[0, 5, 2]} intensity={2} />
          
          <AstrolabeDials winner={winner} />
          
          {winner && (
            <>
              <OrbitParticles color="#3b82f6" radius={1.2} baseCount={20} speed={0.8} intensity={scoreDiffIntensity} />
              <OrbitParticles color="#ef4444" radius={0.9} baseCount={15} speed={-1.2} intensity={scoreDiffIntensity} />
              <OrbitParticles color={winColor} radius={1.6} baseCount={40} speed={1.5} intensity={scoreDiffIntensity * 2} />
            </>
          )}
          {burst && <BurstParticles color={winColor} trigger={burst} />}
          {pulse && <PulseWave trigger={pulse} color={winColor} />}
          
          <DivineHalo winner={winner} />
          <ManaStreamBar p1Score={p1Score} p2Score={p2Score} />
        </Canvas>
      </div>

      <div className="relative" style={{ zIndex: 1 }}>{children}</div>
    </div>
  );
}
