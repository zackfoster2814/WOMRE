/**
 * CombatIntroScreen
 * Màn hình intro 5 giây trước khi combat bắt đầu.
 */

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Three.js: Energy Particles ────────────────────────────────────────────────
function EnergyParticles() {
  const mesh = useRef<THREE.Points>(null!);

  const [positions, velocities, colors] = useMemo(() => {
    const count = 400;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.3;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.sin(angle) * r;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
      const speed = 0.01 + Math.random() * 0.04;
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
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions.slice(), 3),
    );
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

// ── Three.js: Shockwave ring ──────────────────────────────────────────────────
function ShockwaveRing({ triggered }: { triggered: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const startT = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (triggered && startT.current === null)
      startT.current = clock.getElapsedTime();
    if (startT.current === null) return;
    const elapsed = clock.getElapsedTime() - startT.current;
    const dur = 0.9;
    const t = Math.min(elapsed / dur, 1);
    if (ringRef.current) {
      const scale = 1 + t * 18;
      ringRef.current.scale.setScalar(scale);
    }
    if (matRef.current) matRef.current.opacity = (1 - t) * 0.7;
    if (t >= 1) startT.current = null; // reset for potential replay
  });

  return (
    <mesh ref={ringRef}>
      <ringGeometry args={[0.18, 0.22, 64]} />
      <meshBasicMaterial
        ref={matRef}
        color="#a78bfa"
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function IntroScene({ vsVisible }: { vsVisible: boolean }) {
  return (
    <>
      <color attach="background" args={["#050010"]} />
      <BackgroundSparks />
      <EnergyParticles />
      <DiagonalSlashes />
      <ShockwaveRing triggered={vsVisible} />
    </>
  );
}

// ── Avatar with fallback placeholder ─────────────────────────────────────────
const AVATAR_EXTS = ["png", "jpg", "jpeg", "gif", "webp"];

function AvatarWithFallback({
  no,
  name,
  side,
}: {
  no: number;
  name: string;
  side: "left" | "right";
}) {
  const [extIndex, setExtIndex] = useState(0);
  const initial = name.charAt(0).toUpperCase();
  const isLeft = side === "left";

  const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  const src =
    extIndex < AVATAR_EXTS.length
      ? `${basePath}/data/avatars/no${no}.${AVATAR_EXTS[extIndex]}`
      : null;

  if (src) {
    return (
      <img
        key={src}
        src={src}
        alt={name}
        className="absolute inset-0"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
        }}
        onError={() => setExtIndex((i) => i + 1)}
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
          WebkitTextStroke: isLeft
            ? "2px rgba(96,165,250,0.25)"
            : "2px rgba(248,113,113,0.25)",
          userSelect: "none",
        }}
      >
        {initial}
      </span>
    </div>
  );
}

// ── Countdown number ──────────────────────────────────────────────────────────
function CountdownNumber({ count }: { count: number }) {
  const [key, setKey] = useState(count);
  useEffect(() => {
    setKey(count);
  }, [count]);

  return (
    <div
      key={key}
      style={{
        fontSize: "clamp(3rem, 8vw, 6rem)",
        fontWeight: 900,
        color: "transparent",
        WebkitTextStroke:
          count <= 1
            ? "3px rgba(248,113,113,0.95)"
            : "3px rgba(255,255,255,0.8)",
        textShadow:
          count <= 1
            ? "0 0 30px rgba(248,113,113,1), 0 0 60px rgba(248,113,113,0.5)"
            : "0 0 20px rgba(167,139,250,0.8), 0 0 40px rgba(167,139,250,0.4)",
        animation: "countPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      {count}
    </div>
  );
}

// ── VS Glitch ─────────────────────────────────────────────────────────────────
function VSText({ glitch }: { glitch: boolean }) {
  return (
    <div style={{ position: "relative" }}>
      {/* glitch layer 1 */}
      {glitch && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            clipPath: "inset(30% 0 40% 0)",
            transform: "translateX(-4px)",
            mixBlendMode: "screen",
            opacity: 0.7,
          }}
        >
          <div
            className="font-black select-none"
            style={{
              fontSize: "clamp(5rem, 14vw, 10rem)",
              color: "rgba(248,113,113,0.8)",
              letterSpacing: "0.05em",
            }}
          >
            VS
          </div>
        </div>
      )}
      {/* glitch layer 2 */}
      {glitch && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            clipPath: "inset(60% 0 10% 0)",
            transform: "translateX(4px)",
            mixBlendMode: "screen",
            opacity: 0.7,
          }}
        >
          <div
            className="font-black select-none"
            style={{
              fontSize: "clamp(5rem, 14vw, 10rem)",
              color: "rgba(96,165,250,0.8)",
              letterSpacing: "0.05em",
            }}
          >
            VS
          </div>
        </div>
      )}
      {/* main VS */}
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
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface CombatIntroScreenProps {
  player1Name: string;
  player1No: number;
  player2Name: string;
  player2No: number;
  onComplete: () => void;
  volume?: number;
}

export function CombatIntroScreen({
  player1Name,
  player1No,
  player2Name,
  player2No,
  onComplete,
  volume = 1,
}: CombatIntroScreenProps) {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [glitch, setGlitch] = useState(false);

  const total = 5000;

  useEffect(() => {
    const audio = new Audio("/assets/combatSFX/startcombat.mp3");
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch(() => {});

    const t1 = setTimeout(() => setPhase("show"), 80);
    const startTime = Date.now();

    const iv = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / total) * 100, 100));
      const remaining = Math.max(1, Math.ceil((total - elapsed) / 1000));
      setCountdown(remaining);
    }, 40);

    // VS glitch effect: trigger mỗi ~800ms trong 2 giây đầu
    const glitchIntervals: ReturnType<typeof setTimeout>[] = [];
    [400, 700, 1100, 1600, 2000].forEach((ms) => {
      const t = setTimeout(() => {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 80);
      }, ms);
      glitchIntervals.push(t);
    });

    const t2 = setTimeout(() => setPhase("exit"), 4200);
    const t3 = setTimeout(() => onComplete(), total);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(iv);
      glitchIntervals.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entering = phase === "enter";
  const exiting = phase === "exit";
  const vsVisible = !entering && !exiting;

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
    transform: entering
      ? "scale(3) rotate(-15deg)"
      : exiting
        ? "scale(0.3) rotate(-15deg)"
        : "scale(1) rotate(-15deg)",
    transition: entering
      ? "none"
      : exiting
        ? "transform 0.5s ease-in, opacity 0.5s ease-in"
        : "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s, opacity 0.4s ease-out 0.25s",
  };

  const clipP1 = "polygon(0 0, 100% 0, 85% 100%, 0 100%)";
  const clipP2 = "polygon(15% 0, 100% 0, 100% 100%, 0 100%)";

  return (
    <>
      {/* CSS animations */}
      <style>{`
        @keyframes countPop {
          0%   { transform: scale(1.8); opacity: 0; }
          60%  { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes nameSlideLeft {
          from { transform: translateX(-40px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes nameSlideRight {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes scanline {
          0%   { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[9990] overflow-hidden"
        style={{
          opacity: exiting ? 0 : 1,
          transition: exiting
            ? "opacity 0.7s ease-in"
            : "opacity 0.25s ease-out",
        }}
      >
        {/* Three.js background */}
        <div className="absolute inset-0">
          <Canvas
            camera={{ position: [0, 0, 6], fov: 60 }}
            gl={{ alpha: false, antialias: false }}
            dpr={[1, 1.5]}
          >
            <IntroScene vsVisible={vsVisible} />
          </Canvas>
        </div>

        {/* Scan line overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
            opacity: 0.6,
            zIndex: 1,
          }}
        />

        {/* ── Avatar P1 ── */}
        <div
          className="absolute inset-y-0 left-0 w-1/2"
          style={{
            clipPath: clipP1,
            transform: entering
              ? "translateX(-100%)"
              : exiting
                ? "translateX(-80%)"
                : "translateX(0)",
            opacity: entering ? 0 : exiting ? 0 : 1,
            transition: p1Trans,
            zIndex: 2,
          }}
        >
          <AvatarWithFallback
            no={player1No}
            name={player1Name}
            side="left"
          />
          <div
            className="absolute inset-y-0 right-0 w-1/3"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(5,0,16,0.95))",
            }}
          />
          <div
            className="absolute inset-x-0 top-0 h-16"
            style={{
              background:
                "linear-gradient(to bottom, rgba(5,0,16,0.7), transparent)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-16"
            style={{
              background:
                "linear-gradient(to top, rgba(5,0,16,0.7), transparent)",
            }}
          />
          {/* Blue tint overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(37,99,235,0.15) 0%, transparent 60%)",
              mixBlendMode: "screen",
            }}
          />
          {/* Tên P1 */}
          <div
            className="absolute top-8 left-8"
            style={{
              animation: !entering
                ? "nameSlideLeft 0.5s cubic-bezier(0.22,1,0.36,1) both"
                : "none",
            }}
          >
            <div className="text-blue-300/60 text-xs font-mono tracking-widest mb-1">
              PLAYER 1 · #{player1No}
            </div>
            <div
              className="font-black text-white leading-tight"
              style={{
                fontSize: "clamp(1.4rem, 2.5vw, 2.2rem)",
                textShadow:
                  "0 0 24px rgba(96,165,250,1), 0 0 50px rgba(96,165,250,0.5), 2px 2px 12px rgba(0,0,0,1)",
              }}
            >
              {player1Name}
            </div>
            {/* Blue bar accent */}
            <div
              className="mt-2 h-0.5 w-16 rounded-full"
              style={{
                background:
                  "linear-gradient(to right, rgba(96,165,250,0.9), transparent)",
              }}
            />
          </div>
        </div>

        {/* ── Avatar P2 ── */}
        <div
          className="absolute inset-y-0 right-0 w-1/2"
          style={{
            clipPath: clipP2,
            transform: entering
              ? "translateX(100%)"
              : exiting
                ? "translateX(80%)"
                : "translateX(0)",
            opacity: entering ? 0 : exiting ? 0 : 1,
            transition: p2Trans,
            zIndex: 2,
          }}
        >
          <AvatarWithFallback
            no={player2No}
            name={player2Name}
            side="right"
          />
          <div
            className="absolute inset-y-0 left-0 w-1/3"
            style={{
              background:
                "linear-gradient(to left, transparent, rgba(5,0,16,0.95))",
            }}
          />
          <div
            className="absolute inset-x-0 top-0 h-16"
            style={{
              background:
                "linear-gradient(to bottom, rgba(5,0,16,0.7), transparent)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-16"
            style={{
              background:
                "linear-gradient(to top, rgba(5,0,16,0.7), transparent)",
            }}
          />
          {/* Red tint overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(225deg, rgba(185,28,28,0.15) 0%, transparent 60%)",
              mixBlendMode: "screen",
            }}
          />
          {/* Tên P2 */}
          <div
            className="absolute top-8 right-8 text-right"
            style={{
              animation: !entering
                ? "nameSlideRight 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both"
                : "none",
            }}
          >
            <div className="text-red-300/60 text-xs font-mono tracking-widest mb-1">
              #{player2No} · PLAYER 2
            </div>
            <div
              className="font-black text-white leading-tight"
              style={{
                fontSize: "clamp(1.4rem, 2.5vw, 2.2rem)",
                textShadow:
                  "0 0 24px rgba(248,113,113,1), 0 0 50px rgba(248,113,113,0.5), 2px 2px 12px rgba(0,0,0,1)",
              }}
            >
              {player2Name}
            </div>
            <div
              className="mt-2 h-0.5 w-16 rounded-full ml-auto"
              style={{
                background:
                  "linear-gradient(to left, rgba(248,113,113,0.9), transparent)",
              }}
            />
          </div>
        </div>

        {/* ── Glow lines giữa ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: entering ? 0 : exiting ? 0 : 1,
            transition: entering
              ? "none"
              : exiting
                ? "opacity 0.4s"
                : "opacity 0.4s ease-out 0.3s",
            zIndex: 3,
          }}
        >
          <div
            className="absolute inset-y-0"
            style={{
              left: "calc(45% - 1px)",
              width: 2,
              background:
                "linear-gradient(to bottom, transparent, rgba(96,165,250,0.9) 20%, rgba(255,255,255,1) 50%, rgba(248,113,113,0.9) 80%, transparent)",
              transform: "skewX(-8deg)",
              transformOrigin: "center",
              boxShadow:
                "0 0 12px 3px rgba(255,255,255,0.6), 0 0 30px 6px rgba(167,139,250,0.4)",
            }}
          />
          <div
            className="absolute inset-y-0"
            style={{
              left: "calc(55% - 1px)",
              width: 2,
              background:
                "linear-gradient(to bottom, transparent, rgba(96,165,250,0.6) 20%, rgba(167,139,250,0.8) 50%, rgba(248,113,113,0.6) 80%, transparent)",
              transform: "skewX(-8deg)",
              transformOrigin: "center",
              boxShadow: "0 0 8px 2px rgba(167,139,250,0.3)",
            }}
          />
        </div>

        {/* ── VS + Countdown ── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-4"
          style={{ ...vsStyle, zIndex: 4 }}
        >
          <VSText glitch={glitch} />
          {!entering && !exiting && <CountdownNumber count={countdown} />}
        </div>

        {/* ── Progress bar ── */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 z-10"
          style={{
            opacity: entering ? 0 : 1,
            transition: "opacity 0.5s ease-out 0.5s",
          }}
        >
          <div className="flex justify-between text-[10px] text-white/40 font-mono mb-1 px-0.5">
            <span>COMBAT LOADING</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background:
                  "linear-gradient(to right, #60a5fa, #a78bfa, #e879f9)",
                transition: "width 0.04s linear",
                boxShadow: "0 0 6px rgba(167,139,250,0.7)",
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
