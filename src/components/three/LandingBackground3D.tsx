import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars, Sphere, MeshDistortMaterial, Text } from "@react-three/drei";
import * as THREE from "three";

// ── Golden Cosmos Stardust ───────────────────────────────────────────────────
function Stardust({ count = 1000 }) {
  const mesh = useRef<THREE.Points>(null!);
  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 10;
      spd[i] = 0.005 + Math.random() * 0.02;
    }
    return [pos, spd];
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds[i] * (1 + Math.sin(t * 0.3 + i) * 0.1);
      if (pos[i * 3 + 1] > 15) pos[i * 3 + 1] = -15;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#ffd16c"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ── Floating Ancient Runes ───────────────────────────────────────────────────
function FloatingRunes() {
  const runes = ["᚛", "᚜", "⊙", "⌬", "⎔", "✦", "✧", "❂"];
  return (
    <>
      {Array.from({ length: 12 }).map((_, i) => (
        <Float
          key={i}
          speed={1.5}
          rotationIntensity={2}
          floatIntensity={2}
          position={[
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 20,
            -5 - Math.random() * 10
          ]}
        >
          <Text
            fontSize={0.8}
            color="#ffd16c"
            fillOpacity={0.2}
          >
            {runes[i % runes.length]}
          </Text>
        </Float>
      ))}
    </>
  );
}

// ── Cosmic Core ─────────────────────────────────────────────────────────────
function CosmicCore() {
  const sphereRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (sphereRef.current) {
      sphereRef.current.rotation.z = t * 0.1;
      sphereRef.current.rotation.y = t * 0.05;
    }
  });

  return (
    <group position={[0, 0, -8]}>
      {/* Central Distorted Glow */}
      <Sphere ref={sphereRef} args={[4, 64, 64]}>
        <MeshDistortMaterial
          color="#3b0764"
          speed={2}
          distort={0.4}
          radius={1}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
      
      {/* Outward Bloom */}
      <Sphere args={[4.2, 32, 32]}>
        <meshBasicMaterial
          color="#ffd16c"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>
      
      <pointLight color="#ffd16c" intensity={2} distance={20} />
    </group>
  );
}

export function LandingBackground3D() {
  return (
    <div className="absolute inset-0 pointer-events-none bg-surface" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ alpha: true, antialias: true, stencil: false, depth: true }}
      >
        <color attach="background" args={["#0c0e12"]} />
        <fog attach="fog" args={["#0c0e12", 5, 25]} />
        
        <ambientLight intensity={0.2} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Stardust count={1200} />
        <FloatingRunes />
        <CosmicCore />
        
        {/* Cinematic Parallax Light */}
        <directionalLight position={[10, 10, 5]} intensity={0.5} color="#ffd16c" />
        <spotLight position={[-10, -10, 10]} intensity={0.3} angle={0.3} penumbra={1} color="#56f1e0" />
      </Canvas>

      {/* Vignette Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at center, transparent 0%, rgba(12,14,18,0.4) 50%, rgba(12,14,18,0.9) 100%)",
          zIndex: 1
        }}
      />
    </div>
  );
}
