/**
 * PvPBackground3D - Astral Fantasy Edition
 * Cỗ máy thiên văn (Astrolabe), đá thạch anh ma thuật (Crystals) và Vòng Xoay Phép Thuật
 */

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Golden Cosmos Stardust ───────────────────────────────────────────────────
function StarField({ count = 600 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null!);

  const [positions, speeds, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 6;
      spd[i] = 0.002 + Math.random() * 0.01;

      // Golden / Violet mist palette
      const c = new THREE.Color().lerpColors(
        new THREE.Color("#ffd700"), // gold
        new THREE.Color("#8a2be2"), // violet
        Math.random() > 0.3 ? 0 : 1 // 70% gold, 30% violet
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
      pos[i * 3 + 1] += speeds[i] * (1 + Math.sin(t * 0.5 + i) * 0.2); // bay lên chậm
      if (pos[i * 3 + 1] > 15) pos[i * 3 + 1] = -15;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh} geometry={geometry}>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ── Mystic Crystals (Thay thế quả cầu Aura neon) ──────────────────────────────
function MysticCrystal({ position, color }: { position: [number, number, number], color: string }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const glow = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const floatY = Math.sin(t * 1.5) * 0.5;
    
    mesh.current.position.y = floatY;
    mesh.current.rotation.y = t * 0.4;
    mesh.current.rotation.x = t * 0.2;

    glow.current.position.y = floatY;
    glow.current.scale.setScalar(1.2 + Math.abs(Math.sin(t * 2)) * 0.2);
  });

  return (
    <group position={position}>
      {/* Lõi Thạch Anh */}
      <mesh ref={mesh}>
        <icosahedronGeometry args={[2.5, 0]} />
        <meshPhysicalMaterial 
          color={color} 
          metalness={0.2}
          roughness={0.1}
          transmission={0.8}
          thickness={1.5}
        />
      </mesh>
      {/* Vầng sáng (Aura Glow) */}
      <mesh ref={glow}>
        <icosahedronGeometry args={[2.8, 2]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.15} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ── The Astrolabe (Thay cho Ring quay Neon) ──────────────────────────────────
function Astrolabe() {
  const group = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.children.forEach((ring, i) => {
        // Mỗi vòng xoay đa trục theo vận tốc riêng
        ring.rotation.z = t * (0.1 + i * 0.05);
        ring.rotation.x = t * (0.05 + i * 0.08);
        ring.rotation.y = t * (0.08 + i * 0.03);
      });
    }
  });

  const material = new THREE.MeshStandardMaterial({
    color: "#d4af37", // Gold
    metalness: 0.9,
    roughness: 0.2,
    envMapIntensity: 1.5,
  });

  const sizes = [7, 7.5, 8.2, 9];

  return (
    <group ref={group} position={[0, 0, -6]}>
      {sizes.map((size, index) => (
        <mesh key={index} material={material}>
          <torusGeometry args={[size, index % 2 === 0 ? 0.08 : 0.03, 16, 100]} />
        </mesh>
      ))}
      <pointLight color="#ffd700" intensity={0.5} distance={15} />
    </group>
  );
}

// ── Magic Floor Matrix (Sàn Phép Thuật thay cho Grid) ────────────────────────
function MagicCircleFloor() {
  const group = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.z = t * -0.05;
      // Pulse glow
      const op = 0.2 + Math.abs(Math.sin(t * 1.5)) * 0.15;
      group.current.children.forEach((c) => {
        if ((c as THREE.Mesh).material instanceof THREE.LineBasicMaterial) {
          ((c as THREE.Mesh).material as THREE.LineBasicMaterial).opacity = op;
        }
      });
    }
  });

  return (
    <group position={[0, -8, -5]} rotation={[-Math.PI / 2 + 0.2, 0, 0]}>
      <group ref={group}>
        {/* Vòng ngoài cùng */}
        <mesh>
          <ringGeometry args={[14.8, 15, 64]} />
          <meshBasicMaterial color="#a78bfa" transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending}/>
        </mesh>
        {/* Vòng đứt đoạn mô phỏng Runes */}
        <mesh>
          <ringGeometry args={[13.5, 14, 64]} />
          <meshBasicMaterial color="#c084fc" transparent opacity={0.2} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} wireframe/>
        </mesh>
        {/* Ngôi sao chóp 8 cánh (Fake by overlapping squares) */}
        {[0, Math.PI / 4].map((rot, i) => (
          <mesh key={i} rotation={[0, 0, rot]}>
            <ringGeometry args={[10.5, 10.8, 4]} />
            <meshBasicMaterial color="#e879f9" transparent opacity={0.25} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
          </mesh>
        ))}
        {/* Tâm phép thuật */}
        <mesh>
          <circleGeometry args={[5, 32]} />
          <meshBasicMaterial color="#3b0764" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </group>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function PvPBackground3D() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[0, 10, 5]} intensity={0.8} color="#ffffff" />
        
        <StarField count={800} />
        <Astrolabe />
        
        {/* Left Crystal (P1) */}
        <MysticCrystal position={[-12, 1, -2]} color="#3b82f6" />
        {/* Right Crystal (P2) */}
        <MysticCrystal position={[12, -1, -2]} color="#ef4444" />
        
        <MagicCircleFloor />
      </Canvas>

      {/* Radial vignette mask for cosmic feel */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(5,0,16,0.85) 100%)",
          zIndex: 1
        }}
      />
    </div>
  );
}
