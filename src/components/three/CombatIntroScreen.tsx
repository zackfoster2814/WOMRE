/**
 * CombatIntroScreen
 * Màn hình intro 5 giây trước khi combat bắt đầu.
 * Layout xéo: P1 góc trên-trái / P2 góc dưới-phải, 2 đường chéo chia cắt, VS ở tâm.
 * Three.js background: energy particles + lightning streaks
 */

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Three.js: Energy Particles ────────────────────────────────────────────────
function EnergyParticles() {
  const mesh = useRef<THREE.Points>(null!);

  const [positions, velocities, colors] = useMemo(() => {
    const count = 350;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.3;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.sin(angle) * r;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;

      const speed = 0.01 + Math.random() * 0.03;
      vel[i * 3] = Math.cos(angle) * speed;
      vel[i * 3 + 1] = Math.sin(angle) * speed;
      vel[i * 3 + 2] = 0;

      const t = Math.random();
      const c = new THREE.Color().lerpColors(
        new THREE.Color("#60a5fa"),
        new THREE.Color("#e879f9"),
        t,
      );
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, vel, col];
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  useFrame(() => {
    if (!mesh.current) return;
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;
    const count = pos.length / 3;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities[i * 3];
      pos[i * 3 + 1] += velocities[i * 3 + 1];
      const dist = Math.sqrt(pos[i * 3] ** 2 + pos[i * 3 + 1] ** 2);
      if (dist > 6) {
        const angle = Math.random() * Math.PI * 2;
        pos[i * 3] = Math.cos(angle) * 0.2;
        pos[i * 3 + 1] = Math.sin(angle) * 0.2;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ── Three.js: Diagonal Slash Lines ───────────────────────────────────────────
function DiagonalSlashes() {
  const [line1, line2] = useMemo(() => {
    const make = (offsetY: number, color: string) => {
      const pts = [
        new THREE.Vector3(-10, offsetY + 4, 0),
        new THREE.Vector3(10, offsetY - 4, 0),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return new THREE.Line(geo, mat);
    };
    return [make(0.28, "#ffffff"), make(-0.28, "#a78bfa")];
  }, []);

  useFrame(({ clock }) => {
    const pulse = 0.5 + Math.abs(Math.sin(clock.getElapsedTime() * 4)) * 0.5;
    (line1.material as THREE.LineBasicMaterial).opacity = pulse * 0.9;
    (line2.material as THREE.LineBasicMaterial).opacity = pulse * 0.7;
  });

  return (
    <>
      <primitive object={line1} />
      <primitive object={line2} />
    </>
  );
}

// ── Three.js: Background scatter sparks ──────────────────────────────────────
function BackgroundSparks() {
  const ref = useRef<THREE.Points>(null!);

  const { geo } = useMemo(() => {
    const count = 200;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = -2 + Math.random() * -3;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geo: g };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    (ref.current.material as THREE.PointsMaterial).opacity =
      0.2 + Math.abs(Math.sin(clock.getElapsedTime() * 0.5)) * 0.3;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.04}
        color="#c084fc"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ── Avatar with fallback placeholder ─────────────────────────────────────────
function AvatarWithFallback({
  src,
  name,
  side,
}: {
  src?: string;
  name: string;
  side: "left" | "right";
}) {
  const [failed, setFailed] = useState(false);
  const initial = name.charAt(0).toUpperCase();
  const isLeft = side === "left";

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        className="absolute object-cover"
        style={{
          top: "50%", left: "50%",
          transform: isLeft ? "translate(-60%, -50%)" : "translate(-40%, -50%)",
          width: "55%", height: "90%",
          objectPosition: "center top",
        }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 flex items-center justify-center select-none"
      style={{
        background: isLeft
          ? "radial-gradient(ellipse at 30% 50%, rgba(30,58,138,0.6) 0%, transparent 70%)"
          : "radial-gradient(ellipse at 70% 50%, rgba(127,29,29,0.6) 0%, transparent 70%)",
      }}
    >
      <span
        className="font-black"
        style={{
          fontSize: "clamp(8rem, 20vw, 18rem)",
          color: "transparent",
          WebkitTextStroke: isLeft ? "2px rgba(96,165,250,0.25)" : "2px rgba(248,113,113,0.25)",
          userSelect: "none",
        }}
      >
        {initial}
      </span>
    </div>
  );
}

function IntroScene() {
  return (
    <>
      <color attach="background" args={["#050010"]} />
      <BackgroundSparks />
      <EnergyParticles />
      <DiagonalSlashes />
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface CombatIntroScreenProps {
  player1Name: string;
  player1No: number;
  player2Name: string;
  player2No: number;
  player1AvatarUrl?: string;
  player2AvatarUrl?: string;
  onComplete: () => void;
}

export function CombatIntroScreen({
  player1Name,
  player1No,
  player2Name,
  player2No,
  player1AvatarUrl,
  player2AvatarUrl,
  onComplete,
}: CombatIntroScreenProps) {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = new Audio("/assets/combatSFX/startcombat.mp3");
    audio.play().catch(() => {});
    const t1 = setTimeout(() => setPhase("show"), 80);
    const startTime = Date.now();
    const total = 5000;
    const iv = setInterval(() => {
      setProgress(Math.min(((Date.now() - startTime) / total) * 100, 100));
    }, 40);
    const t2 = setTimeout(() => setPhase("exit"), 4200);
    const t3 = setTimeout(() => onComplete(), total);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearInterval(iv);
    };
  }, [onComplete]);

  const entering = phase === "enter";
  const exiting = phase === "exit";

  // Transition helpers
  const p1Trans = entering
    ? "none"
    : exiting
      ? "transform 0.7s ease-in, opacity 0.7s ease-in"
      : "transform 0.65s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease-out";

  const p2Trans = entering
    ? "none"
    : exiting
      ? "transform 0.7s ease-in, opacity 0.7s ease-in"
      : "transform 0.65s cubic-bezier(0.22, 1, 0.36, 1) 0.1s, opacity 0.5s ease-out 0.1s";

  const vsStyle: React.CSSProperties = {
    opacity: entering ? 0 : exiting ? 0 : 1,
    transform: entering ? "scale(3) rotate(-15deg)" : exiting ? "scale(0.3) rotate(-15deg)" : "scale(1) rotate(-15deg)",
    transition: entering
      ? "none"
      : exiting
        ? "transform 0.5s ease-in, opacity 0.5s ease-in"
        : "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s, opacity 0.4s ease-out 0.25s",
  };

  // clip-path dọc: P1 bên trái, P2 bên phải, đường xéo ở giữa
  // P1: cạnh phải xéo — top=48%, bottom=42% (nghiêng sang phải ở trên)
  const clipP1 = "polygon(0 0, 48% 0, 42% 100%, 0 100%)";
  // P2: cạnh trái xéo — top=58%, bottom=52% (ngược chiều P1)
  const clipP2 = "polygon(58% 0, 100% 0, 100% 100%, 52% 100%)";

  return (
    <div
      className="fixed inset-0 z-[9990] overflow-hidden"
      style={{
        opacity: exiting ? 0 : 1,
        transition: exiting ? "opacity 0.7s ease-in" : "opacity 0.25s ease-out",
      }}
    >
      {/* Three.js background (luôn hiển thị) */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 60 }}
          gl={{ alpha: false, antialias: false }}
          dpr={[1, 1.5]}
        >
          <IntroScene />
        </Canvas>
      </div>

      {/* ── Avatar P1: bên trái, slide từ trái sang ── */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: clipP1,
          transform: entering ? "translateX(-100%)" : exiting ? "translateX(-80%)" : "translateX(0)",
          opacity: entering ? 0 : exiting ? 0 : 1,
          transition: p1Trans,
        }}
      >
        <AvatarWithFallback
          src={player1AvatarUrl}
          name={player1Name}
          side="left"
        />
        {/* Fade phải (vào vùng VS) */}
        <div className="absolute inset-y-0 right-0 w-1/3" style={{ background: "linear-gradient(to right, transparent, rgba(5,0,16,0.95))" }} />
        {/* Vignette top/bottom */}
        <div className="absolute inset-x-0 top-0 h-16" style={{ background: "linear-gradient(to bottom, rgba(5,0,16,0.7), transparent)" }} />
        <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: "linear-gradient(to top, rgba(5,0,16,0.7), transparent)" }} />
        {/* Tên + số P1 — góc trên-trái */}
        <div className="absolute top-8 left-8">
          <div className="text-blue-300/60 text-xs font-mono tracking-widest mb-1">#{player1No}</div>
          <div
            className="font-black text-white leading-tight"
            style={{
              fontSize: "clamp(1.4rem, 2.5vw, 2.2rem)",
              textShadow: "0 0 24px rgba(96,165,250,1), 0 0 50px rgba(96,165,250,0.5), 2px 2px 12px rgba(0,0,0,1)",
            }}
          >
            {player1Name}
          </div>
        </div>
      </div>

      {/* ── Avatar P2: bên phải, slide từ phải sang ── */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: clipP2,
          transform: entering ? "translateX(100%)" : exiting ? "translateX(80%)" : "translateX(0)",
          opacity: entering ? 0 : exiting ? 0 : 1,
          transition: p2Trans,
        }}
      >
        <AvatarWithFallback
          src={player2AvatarUrl}
          name={player2Name}
          side="right"
        />
        {/* Fade trái (vào vùng VS) */}
        <div className="absolute inset-y-0 left-0 w-1/3" style={{ background: "linear-gradient(to left, transparent, rgba(5,0,16,0.95))" }} />
        {/* Vignette top/bottom */}
        <div className="absolute inset-x-0 top-0 h-16" style={{ background: "linear-gradient(to bottom, rgba(5,0,16,0.7), transparent)" }} />
        <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: "linear-gradient(to top, rgba(5,0,16,0.7), transparent)" }} />
        {/* Tên + số P2 — góc trên-phải */}
        <div className="absolute top-8 right-8 text-right">
          <div className="text-red-300/60 text-xs font-mono tracking-widest mb-1">#{player2No}</div>
          <div
            className="font-black text-white leading-tight"
            style={{
              fontSize: "clamp(1.4rem, 2.5vw, 2.2rem)",
              textShadow: "0 0 24px rgba(248,113,113,1), 0 0 50px rgba(248,113,113,0.5), 2px 2px 12px rgba(0,0,0,1)",
            }}
          >
            {player2Name}
          </div>
        </div>
      </div>

      {/* ── 2 đường xéo dọc ở giữa (glow lines) ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: entering ? 0 : exiting ? 0 : 1,
          transition: entering ? "none" : exiting ? "opacity 0.4s" : "opacity 0.4s ease-out 0.3s",
        }}
      >
        {/* Line trái */}
        <div
          className="absolute inset-y-0"
          style={{
            left: "calc(45% - 1px)",
            width: 2,
            background: "linear-gradient(to bottom, transparent, rgba(96,165,250,0.9) 20%, rgba(255,255,255,1) 50%, rgba(248,113,113,0.9) 80%, transparent)",
            transform: "skewX(-8deg)",
            transformOrigin: "center",
            boxShadow: "0 0 12px 3px rgba(255,255,255,0.6), 0 0 30px 6px rgba(167,139,250,0.4)",
          }}
        />
        {/* Line phải */}
        <div
          className="absolute inset-y-0"
          style={{
            left: "calc(55% - 1px)",
            width: 2,
            background: "linear-gradient(to bottom, transparent, rgba(96,165,250,0.6) 20%, rgba(167,139,250,0.8) 50%, rgba(248,113,113,0.6) 80%, transparent)",
            transform: "skewX(-8deg)",
            transformOrigin: "center",
            boxShadow: "0 0 8px 2px rgba(167,139,250,0.3)",
          }}
        />
      </div>

      {/* ── VS ở tâm, xoay nghiêng ── */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={vsStyle}
      >
        <div
          className="font-black select-none"
          style={{
            fontSize: "clamp(5rem, 14vw, 10rem)",
            color: "transparent",
            WebkitTextStroke: "3px rgba(255,255,255,0.95)",
            textShadow:
              "0 0 40px rgba(167,139,250,1), 0 0 80px rgba(167,139,250,0.7), 0 0 120px rgba(167,139,250,0.3)",
            filter: "drop-shadow(0 0 30px rgba(167,139,250,0.9))",
            letterSpacing: "0.05em",
          }}
        >
          VS
        </div>
      </div>

      {/* ── Countdown bar ── */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 z-10"
        style={{
          opacity: entering ? 0 : 1,
          transition: "opacity 0.5s ease-out 0.5s",
        }}
      >
        <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(to right, #60a5fa, #a78bfa, #e879f9)",
              transition: "width 0.04s linear",
              boxShadow: "0 0 6px rgba(167,139,250,0.7)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
