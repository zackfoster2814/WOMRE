import { useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Float } from "@react-three/drei";
import * as THREE from "three";
import type { WheelItem } from "../../types";
import { playTickSound, playDefaultWinSound } from "../../utils/audio";

interface WheelSlice {
  item: WheelItem;
  startAngle: number;
  endAngle: number;
  color: string;
}

// ── CONFIGURATION ───────────────────────────────────────────────────────────
const WHEEL_RADIUS = 2.4;
const WHEEL_DEPTH = 0.3;
const POINTER_ANGLE = Math.PI / 2; // 12 o'clock (Top)
const SPIN_DURATION = 4000;

// ── Celestial Wedge Component ────────────────────────────────────────────────
function CelestialWedge({
  slice,
}: {
  slice: WheelSlice;
  index: number;
}) {
  const midAngle = (slice.startAngle + slice.endAngle) / 2;
  const labelRadius = WHEEL_RADIUS * 0.7;

  // Use ExtrudeGeometry for absolute predictability in orientation
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.absarc(0, 0, WHEEL_RADIUS, slice.startAngle, slice.endAngle, false);
    shape.lineTo(0, 0);

    return new THREE.ExtrudeGeometry(shape, {
      depth: WHEEL_DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
    });
  }, [slice.startAngle, slice.endAngle]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={slice.color}
          emissive={slice.color}
          emissiveIntensity={0.2}
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      {/* Item Text */}
      <group
        position={[
          Math.cos(midAngle) * labelRadius,
          Math.sin(midAngle) * labelRadius,
          WHEEL_DEPTH + 0.05,
        ]}
        rotation={[0, 0, midAngle - Math.PI / 2]}
      >
        <Text
          color="#ffffff"
          fontSize={0.22}
          maxWidth={1.4}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
          material-depthTest={false} // Ensure text is always visible on top
        >
          {slice.item.name}
        </Text>
      </group>
    </group>
  );
}

// ── Astral Core ──────────────────────────────────────────────────────────────
function AstralCore() {
  return (
    <group position={[0, 0, WHEEL_DEPTH]}>
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <mesh position={[0, 0, 0.2]}>
          <octahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial
            color="#a78bfa"
            emissive="#7c3aed"
            emissiveIntensity={1}
          />
        </mesh>
      </Float>
      {/* Central Hub Plate */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.45, 0.1, 24]}  />
        <meshStandardMaterial color="#1e1b4b" metalness={0.8} />
      </mesh>
    </group>
  );
}

// ── North Star Pointer ───────────────────────────────────────────────────────
function NorthStarPointer() {
  return (
    <group position={[0, WHEEL_RADIUS + 0.15, WHEEL_DEPTH + 0.2]} rotation={[0, 0, Math.PI]}>
      <mesh>
        <coneGeometry args={[0.15, 0.45, 4]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={1}
        />
      </mesh>
      <pointLight color="#fbbf24" intensity={1} distance={2} />
    </group>
  );
}

// ── Internal Component Logic ──────────────────────────────────────────────────
function WheelInternal({
  items,
  isSpinning,
  onSpinComplete,
}: {
  items: WheelItem[];
  isSpinning: boolean;
  onSpinComplete: (item: WheelItem) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const currentRotation = useRef(0);
  const targetRotation = useRef(0);
  const startRotation = useRef(0);
  const spinStartTime = useRef(0);
  const isAnimating = useRef(false);
  const lastTickIndex = useRef(-1);

  const slices = useMemo(() => {
    let totalWeight = items.reduce((acc, curr) => acc + curr.weight, 0);
    if (totalWeight === 0) totalWeight = 1;

    let currentAngle = 0;
    const result: WheelSlice[] = [];
    const palette = ["#4c1d95", "#1e3a8a", "#b91c1c", "#047857", "#92400e", "#be185d"];

    items.forEach((item, i) => {
      const sliceAngle = (item.weight / totalWeight) * (Math.PI * 2);
      result.push({
        item,
        startAngle: currentAngle,
        endAngle: currentAngle + sliceAngle,
        color: item.color || palette[i % palette.length],
      });
      currentAngle += sliceAngle;
    });
    return result;
  }, [items]);

  useEffect(() => {
    if (isSpinning && !isAnimating.current && items.length > 0) {
      isAnimating.current = true;
      spinStartTime.current = Date.now();
      startRotation.current = currentRotation.current;

      const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
      let rand = Math.random() * totalWeight;
      let winnerIdx = 0;
      for (let i = 0; i < items.length; i++) {
        rand -= items[i].weight;
        if (rand <= 0) {
          winnerIdx = i;
          break;
        }
      }

      const winnerSlice = slices[winnerIdx];
      const midAngle = (winnerSlice.startAngle + winnerSlice.endAngle) / 2;
      const extraSpins = (6 + Math.random() * 4) * Math.PI * 2;
      
      // Clockwise logic: we want (midAngle - totalRotation) % 2PI = PI/2
      // targetRotation = midAngle - PI/2 + spins
      let dist = midAngle - POINTER_ANGLE;
      while (dist < 0) dist += Math.PI * 2;
      
      targetRotation.current = startRotation.current + extraSpins + dist;
      lastTickIndex.current = -1;
    }
  }, [isSpinning, items, slices]);

  useFrame(() => {
    if (!isAnimating.current) return;

    const elapsed = Date.now() - spinStartTime.current;
    let t = Math.min(elapsed / SPIN_DURATION, 1);
    t = 1 - Math.pow(1 - t, 5);
    
    const nextRot = startRotation.current + (targetRotation.current - startRotation.current) * t;
    currentRotation.current = nextRot;
    
    if (groupRef.current) {
      groupRef.current.rotation.z = -nextRot;
    }

    const checkAngle = (nextRot + POINTER_ANGLE) % (Math.PI * 2);
    const currentWedgeIdx = slices.findIndex(s => checkAngle >= s.startAngle && checkAngle < s.endAngle);
    
    if (currentWedgeIdx !== lastTickIndex.current && currentWedgeIdx !== -1) {
      playTickSound();
      lastTickIndex.current = currentWedgeIdx;
    }

    if (t >= 1) {
      isAnimating.current = false;
      const finalWinner = slices[lastTickIndex.current]?.item || slices[0].item;
      playDefaultWinSound();
      onSpinComplete(finalWinner);
    }
  });

  return (
    <group>
      <group ref={groupRef}>
        {slices.map((slice, idx) => (
          <CelestialWedge key={idx} slice={slice} index={idx} />
        ))}
      </group>
      <AstralCore />
      <NorthStarPointer />
    </group>
  );
}

export interface ProbabilityWheel3DProps {
  items: WheelItem[];
  isSpinning: boolean;
  onSpinComplete: (item: WheelItem) => void;
  onSpin?: () => void;
}

export function ProbabilityWheel3D({ items, isSpinning, onSpinComplete, onSpin }: ProbabilityWheel3DProps) {
  return (
    <div className="relative w-full h-full" style={{ isolation: "isolate" }}>
      <Canvas 
        camera={{ position: [0, 0, 10], fov: 35 }} 
        gl={{ alpha: true, antialias: true, stencil: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0); // Transparent background
        }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[5, 10, 5]} intensity={1} />
        
        {/* Dark Background Overlay */}
        <mesh position={[0, 0, -2]}>
          <planeGeometry args={[20, 20]} />
          <meshBasicMaterial color="#0c111d" transparent opacity={0.6} />
        </mesh>

        <Suspense fallback={null}>
          <group onClick={onSpin} scale={0.7}>
            <WheelInternal items={items} isSpinning={isSpinning} onSpinComplete={onSpinComplete} />
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
}
