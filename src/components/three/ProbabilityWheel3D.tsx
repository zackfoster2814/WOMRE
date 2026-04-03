import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { WheelItem } from "../../types";

interface WheelSlice {
  item: WheelItem;
  startAngle: number;
  endAngle: number;
  color: string;
}

// ── Mảnh bánh 3D (Cylindrical Slice) ──────────────────────────────────────────
function WheelSlice3D({
  slice,
  index,
  total,
}: {
  slice: WheelSlice;
  index: number;
  total: number;
}) {
  const thetaLength = slice.endAngle - slice.startAngle;
  // Dịch một chút padding để các mảnh có rãnh (gap)
  const gap = total > 1 ? 0.02 : 0;
  const start = slice.startAngle + gap / 2;
  const length = Math.max(0, thetaLength - gap);

  // Vị trí text (ở giữa slice)
  const midAngle = start + length / 2;
  const textRadius = 1.9;

  return (
    <group>
      {/* Khối đá Slice */}
      <mesh rotation={[Math.PI / 2, 0, start]}>
        {/* Radius top, radius bottom, height, radial seq, height seq, open ended, thetaStart, thetaLength */}
        <cylinderGeometry args={[2.5, 2.5, 0.4, 32, 1, false, 0, length]} />
        <meshStandardMaterial
          color={slice.color || (index % 2 === 0 ? "#1e3a8a" : "#7f1d1d")}
          metalness={0.4}
          roughness={0.7}
        />
        {/* Cạnh viền sáng chìm (Fake inner border) */}
        <lineSegments>
          <edgesGeometry args={[new THREE.CylinderGeometry(2.5, 2.5, 0.41, 32, 1, false, 0, length)]} />
          <lineBasicMaterial color="#ffd700" transparent opacity={0.3} />
        </lineSegments>
      </mesh>

      {/* Label Text */}
      <group
        rotation={[0, 0, midAngle]}
        position={[Math.cos(midAngle) * textRadius, Math.sin(midAngle) * textRadius, 0.25]}
      >
        <Text
          color="#ffffff"
          fontSize={0.25}
          maxWidth={1.8}
          lineHeight={1}
          letterSpacing={0.02}
          textAlign="right"
          font="https://fonts.gstatic.com/s/cinzel/v19/8vIJ7ww63mVu7gtzRXw.woff"
          anchorX="center"
          anchorY="middle"
          rotation={[0, 0, -midAngle]} // Chữ luôn ngửa lên trên dù vòng xoay
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {slice.item.name}
        </Text>
      </group>
    </group>
  );
}

// ── Spinning Core (Trục La Bàn) ───────────────────────────────────────────────
function AstrolabeCore() {
  return (
    <group>
      {/* Khối trụ tâm */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.4, 0.5, 0.6, 16]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.2} />
      </mesh>
      {/* Vòng khóa ngoài */}
      <mesh position={[0, 0, 0.4]}>
        <torusGeometry args={[0.5, 0.05, 16, 32]} />
        <meshStandardMaterial color="#ffaa00" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ── Vòng khuyên bảo vệ ngoài cùng ──────────────────────────────────────────────
function OuterRing() {
  return (
    <mesh position={[0, 0, -0.1]}>
      <torusGeometry args={[2.7, 0.08, 16, 64]} />
      <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.4} />
      {/* Đinh tán (Runes) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[Math.cos((i * Math.PI) / 4) * 2.7, Math.sin((i * Math.PI) / 4) * 2.7, 0.08]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 8]} />
          <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </mesh>
  );
}

// ── Kim chỉ định (Pointer) ────────────────────────────────────────────────────
function Pointer() {
  // Đặt ở góc phải (0 degrees / 3 giờ) như thiết kế cũ
  return (
    <group position={[2.6, 0, 0.3]} rotation={[0, 0, -Math.PI / 2]}>
      <mesh>
        {/* Mũi tên nhọn */}
        <coneGeometry args={[0.2, 0.8, 4]} />
        <meshStandardMaterial color="#ff3300" metalness={0.8} roughness={0.2} emissive="#660000" emissiveIntensity={0.5} />
      </mesh>
      <pointLight color="#ff3300" intensity={0.5} distance={2} />
    </group>
  );
}

// ── Vòng Logic Quay ──────────────────────────────────────────────────────────
function WheelLogic({
  items,
  isSpinning,
  onSpinComplete,
}: {
  items: WheelItem[];
  isSpinning: boolean;
  onSpinComplete: (item: WheelItem) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  
  // Trạng thái vật lý
  const currentRotation = useRef(0);
  const targetRotation = useRef(0);
  const startRotation = useRef(0);
  const spinStartTime = useRef(0);
  const isAnimating = useRef(false);

  // Tính toán Slices
  const slices = useMemo(() => {
    let totalWeight = items.reduce((acc, curr) => acc + curr.weight, 0);
    if (totalWeight === 0) totalWeight = 1;

    let currentAngle = 0;
    const result: WheelSlice[] = [];

    const defaultColors = ["#1e3a8a", "#7f1d1d", "#064e3b", "#581c87", "#9a3412"];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const sliceAngle = (item.weight / totalWeight) * (Math.PI * 2);
      result.push({
        item,
        startAngle: currentAngle,
        endAngle: currentAngle + sliceAngle,
        color: item.color || defaultColors[i % defaultColors.length],
      });
      currentAngle += sliceAngle;
    }
    return result;
  }, [items]);

  // Kích hoạt Spin
  useEffect(() => {
    if (isSpinning && !isAnimating.current && items.length > 0) {
      isAnimating.current = true;
      spinStartTime.current = Date.now();
      startRotation.current = currentRotation.current;

      // Tính vòng quay (3 đến 6 vòng + random)
      const extraSpins = (3 + Math.random() * 3) * Math.PI * 2;
      const randomStop = Math.random() * Math.PI * 2;
      targetRotation.current = startRotation.current + extraSpins + randomStop;
    }
  }, [isSpinning, items.length]);

  // Animation Loop (Ease Out)
  useFrame(() => {
    if (!isAnimating.current) return;

    const elapsed = Date.now() - spinStartTime.current;
    const duration = 4000; // 4 giây xoay
    let t = Math.min(elapsed / duration, 1);
    
    // Cubic Ease Out
    t = 1 - Math.pow(1 - t, 3);
    
    const nextRot = startRotation.current + (targetRotation.current - startRotation.current) * t;
    currentRotation.current = nextRot;
    
    if (groupRef.current) {
      // Xoay quanh trục Z
      groupRef.current.rotation.z = -nextRot; // Dấu âm để xoay kim đồng hồ
    }

    if (t >= 1) {
      isAnimating.current = false;
      
      // Tính toán kết quả
      // Vòng tròn đã xoay đi một góc `currentRotation`. Kim chỉ nằm ở góc 0 (hướng 3 giờ).
      // Góc tương đối của kim so với vòng là `currentRotation % (2PI)`.
      const normalizedRot = currentRotation.current % (Math.PI * 2);
      
      const winnerSlice = slices.find((s) => {
        return normalizedRot >= s.startAngle && normalizedRot < s.endAngle;
      });

      if (winnerSlice) {
        onSpinComplete(winnerSlice.item);
      } else {
        // Fallback
        onSpinComplete(slices[0].item);
      }
    }
  });

  // Tilt nhẹ khi hover / idle
  const { mouse } = useThree();
  useFrame(() => {
    if (groupRef.current && !isAnimating.current) {
      groupRef.current.parent!.rotation.x = THREE.MathUtils.lerp(groupRef.current.parent!.rotation.x, -mouse.y * 0.2, 0.1);
      groupRef.current.parent!.rotation.y = THREE.MathUtils.lerp(groupRef.current.parent!.rotation.y, mouse.x * 0.2, 0.1);
    }
  });

  return (
    <group>
      <group ref={groupRef}>
        {slices.map((slice, idx) => (
          <WheelSlice3D key={idx} slice={slice} index={idx} total={slices.length} />
        ))}
        <OuterRing />
      </group>
      <AstrolabeCore />
      <Pointer />
    </group>
  );
}

// ── Hạt bụi ma thuật bay khi quay ──────────────────────────────────────────────
function SpinParticles({ isSpinning }: { isSpinning: boolean }) {
  const mesh = useRef<THREE.Points>(null!);
  const count = 100;
  
  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i=0; i<count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 2.8 + Math.random() * 0.5;
      pos[i*3] = Math.cos(angle) * r;
      pos[i*3+1] = Math.sin(angle) * r;
      pos[i*3+2] = (Math.random() - 0.5) * 1;
    }
    return [pos];
  }, []);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime();
    if (mesh.current.material instanceof THREE.PointsMaterial) {
      mesh.current.material.opacity = isSpinning 
        ? 0.8 + Math.sin(t * 10) * 0.2 
        : 0.1 + Math.sin(t * 2) * 0.1;
    }
    mesh.current.rotation.z = t * (isSpinning ? 0.5 : 0.05);
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#ffd700" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

// ── Export Interface Tương tự WheelCanvas ─────────────────────────────────────
export interface ProbabilityWheel3DProps {
  items: WheelItem[];
  isSpinning: boolean;
  onSpinComplete: (item: WheelItem) => void;
  onSpin?: () => void; // Trigger callback khi bấm vào vòng
}

export function ProbabilityWheel3D({ items, isSpinning, onSpinComplete, onSpin }: ProbabilityWheel3DProps) {
  return (
    <div className="relative w-full h-full" style={{ isolation: "isolate" }}>
      <Canvas camera={{ position: [0, -2, 7], fov: 50 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[0, 10, 10]} intensity={1.5} />
        <pointLight position={[0, 0, 5]} intensity={0.8} color="#a78bfa" />
        
        {/* Glow chìm dưới đáy */}
        <mesh position={[0, 0, -1]}>
          <planeGeometry args={[10, 10]} />
          <meshBasicMaterial color="#000" transparent opacity={0.3} />
        </mesh>

        <group onClick={onSpin}>
          <WheelLogic items={items} isSpinning={isSpinning} onSpinComplete={onSpinComplete} />
          <SpinParticles isSpinning={isSpinning} />
        </group>
      </Canvas>
    </div>
  );
}
