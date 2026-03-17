/**
 * CombatOutroScreen — design tương tự CombatIntroScreen
 * - Attack phase (0–2.5s): 2 avatar full màn hình, loser rung + flash đỏ
 * - Winner phase (2.5s+) : loser rơi xuống; winner expand ra full màn hình (fixed layer)
 */

import React, { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Three.js: Attack Particles ─────────────────────────────────────────────────
function AttackParticles({ toRight }: { toRight: boolean }) {
  const mesh = useRef<THREE.Points>(null!);
  const COUNT = 400;

  const [positions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const spawnX = toRight ? -1.5 : 1.5;
    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3]     = spawnX + Math.cos(angle) * 0.4;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      const speed = 0.02 + Math.random() * 0.05;
      vel[i * 3]     = (toRight ? 1 : -1) * speed;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.015;
      const c = new THREE.Color().lerpColors(
        new THREE.Color("#ff6600"), new THREE.Color("#ff0044"), Math.random(),
      );
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    return [pos, vel, col];
  }, [toRight]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
    g.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  const targetX = toRight ? 2.5 : -2.5;
  useFrame(() => {
    if (!mesh.current) return;
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     += velocities[i * 3];
      pos[i * 3 + 1] += velocities[i * 3 + 1];
      if (Math.sign(velocities[i * 3]) * (pos[i * 3] - targetX) > 0.5) {
        pos[i * 3]     = (toRight ? -1.5 : 1.5) + (Math.random() - 0.5) * 0.8;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 4;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh} geometry={geo}>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.9}
        sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

// ── Three.js: Background sparks ────────────────────────────────────────────────
function BackgroundSparks({ golden }: { golden: boolean }) {
  const ref = useRef<THREE.Points>(null!);
  const geo = useMemo(() => {
    const count = 200;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = -2 + Math.random() * -3;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = 0.2 + Math.abs(Math.sin(clock.getElapsedTime() * 0.5)) * 0.3;
    mat.color.set(golden ? "#ffd700" : "#c084fc");
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.04} color={golden ? "#ffd700" : "#c084fc"}
        transparent opacity={0.4} sizeAttenuation
        blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

// ── Three.js: Diagonal slash lines ─────────────────────────────────────────────
function DiagonalSlashes({ red }: { red: boolean }) {
  const [line1, line2] = useMemo(() => {
    const make = (offsetY: number, color: string) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-10, offsetY + 4, 0),
        new THREE.Vector3( 10, offsetY - 4, 0),
      ]);
      const mat = new THREE.LineBasicMaterial({
        color, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      return new THREE.Line(geo, mat);
    };
    return [
      make( 0.28, red ? "#ff4400" : "#ffffff"),
      make(-0.28, red ? "#ff0044" : "#a78bfa"),
    ];
  }, [red]);
  useFrame(({ clock }) => {
    const pulse = 0.5 + Math.abs(Math.sin(clock.getElapsedTime() * 4)) * 0.5;
    (line1.material as THREE.LineBasicMaterial).opacity = pulse * 0.9;
    (line2.material as THREE.LineBasicMaterial).opacity = pulse * 0.7;
  });
  return (<><primitive object={line1} /><primitive object={line2} /></>);
}

// ── Three.js: Shockwave ring ────────────────────────────────────────────────────
function ShockwaveRing({ triggered }: { triggered: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null!);
  const matRef  = useRef<THREE.MeshBasicMaterial>(null!);
  const startT  = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (triggered && startT.current === null) startT.current = clock.getElapsedTime();
    if (startT.current === null) return;
    const t = Math.min((clock.getElapsedTime() - startT.current) / 0.9, 1);
    if (ringRef.current) ringRef.current.scale.setScalar(1 + t * 18);
    if (matRef.current)  matRef.current.opacity = (1 - t) * 0.8;
    if (t >= 1) startT.current = null;
  });
  return (
    <mesh ref={ringRef}>
      <ringGeometry args={[0.18, 0.22, 64]} />
      <meshBasicMaterial ref={matRef} color="#ffd700" transparent opacity={0.8}
        blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function OutroScene({ phase, loserOnRight }: { phase: "attack" | "winner"; loserOnRight: boolean }) {
  return (
    <>
      <color attach="background" args={["#050010"]} />
      <BackgroundSparks golden={phase === "winner"} />
      <DiagonalSlashes red={phase === "attack"} />
      {phase === "attack" && <AttackParticles toRight={loserOnRight} />}
      {phase === "winner" && <ShockwaveRing triggered />}
    </>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────────
const AVATAR_EXTS = ["png", "jpg", "jpeg", "gif", "webp"];

function AvatarImg({ no, name, side }: { no: number; name: string; side: "left" | "right" }) {
  const [extIndex, setExtIndex] = useState(0);
  const basePath = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
  const src = extIndex < AVATAR_EXTS.length
    ? `${basePath}/data/avatars/no${no}.${AVATAR_EXTS[extIndex]}`
    : null;
  const isLeft = side === "left";

  if (src) {
    return (
      <img key={src} src={src} alt={name}
        className="absolute inset-0"
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
        onError={() => setExtIndex(i => i + 1)}
      />
    );
  }
  return (
    <div className="absolute inset-0 flex items-center justify-center select-none"
      style={{
        background: isLeft
          ? "radial-gradient(ellipse at 30% 50%, rgba(30,58,138,0.6) 0%, transparent 70%)"
          : "radial-gradient(ellipse at 70% 50%, rgba(127,29,29,0.6) 0%, transparent 70%)",
      }}>
      <span className="font-black" style={{
        fontSize: "clamp(8rem,20vw,18rem)", color: "transparent",
        WebkitTextStroke: isLeft ? "2px rgba(96,165,250,0.25)" : "2px rgba(248,113,113,0.25)",
        userSelect: "none",
      }}>{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

// ── WINNER text với glitch ──────────────────────────────────────────────────────
function WinnerText({ glitch }: { glitch: boolean }) {
  const style: React.CSSProperties = {
    fontSize: "clamp(4rem,10vw,8rem)",
    letterSpacing: "0.15em",
    fontWeight: 900,
  };
  return (
    <div style={{ position: "relative" }}>
      {glitch && (
        <div className="absolute inset-0 flex items-center justify-center select-none"
          style={{ clipPath: "inset(30% 0 40% 0)", transform: "translateX(-5px)", mixBlendMode: "screen", opacity: 0.8 }}>
          <span style={{ ...style, color: "rgba(255,200,0,0.9)" }}>WINNER</span>
        </div>
      )}
      {glitch && (
        <div className="absolute inset-0 flex items-center justify-center select-none"
          style={{ clipPath: "inset(60% 0 10% 0)", transform: "translateX(5px)", mixBlendMode: "screen", opacity: 0.8 }}>
          <span style={{ ...style, color: "rgba(255,140,0,0.9)" }}>WINNER</span>
        </div>
      )}
      <span className="select-none" style={{
        ...style,
        color: "transparent",
        WebkitTextStroke: "3px rgba(255,215,0,0.95)",
        textShadow: "0 0 40px rgba(255,215,0,1), 0 0 80px rgba(255,165,0,0.7), 0 0 120px rgba(255,100,0,0.3)",
        filter: "drop-shadow(0 0 30px rgba(255,215,0,0.9))",
      }}>WINNER</span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
interface CombatOutroScreenProps {
  winnerName: string; winnerNo: number;
  loserName:  string; loserNo:  number;
  winnerSide: "player1" | "player2";
  onComplete: () => void;
}

export function CombatOutroScreen({
  winnerName, winnerNo, loserName, loserNo, winnerSide, onComplete,
}: CombatOutroScreenProps) {
  const p1IsWinner   = winnerSide === "player1";
  const loserOnRight = p1IsWinner;

  const [phase,          setPhase]          = useState<"attack" | "winner">("attack");
  const [shakeOffset,    setShakeOffset]    = useState({ x: 0, y: 0 });
  const [winnerExpanded, setWinnerExpanded] = useState(false);
  const [winnerVisible,  setWinnerVisible]  = useState(false);
  const [glitch,         setGlitch]         = useState(false);
  const [exiting,        setExiting]        = useState(false);

  const shakeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase !== "attack") {
      if (shakeRef.current) clearInterval(shakeRef.current);
      setShakeOffset({ x: 0, y: 0 });
      return;
    }
    shakeRef.current = setInterval(() => {
      setShakeOffset({ x: (Math.random() - 0.5) * 22, y: (Math.random() - 0.5) * 12 });
      setTimeout(() => setShakeOffset({ x: 0, y: 0 }), 70);
    }, 110);
    return () => { if (shakeRef.current) clearInterval(shakeRef.current); };
  }, [phase]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("winner"), 2500);
    // Một tick sau để browser apply initial state trước khi transition
    const t1b = setTimeout(() => setWinnerExpanded(true), 2550);
    const t2  = setTimeout(() => setWinnerVisible(true), 2900);
    const gts = [3100, 3300, 3600, 4000].map(ms =>
      setTimeout(() => { setGlitch(true); setTimeout(() => setGlitch(false), 80); }, ms)
    );
    const t3 = setTimeout(() => setExiting(true), 4300);
    const t4 = setTimeout(() => onComplete(), 5000);
    return () => { [t1,t1b,t2,t3,t4].forEach(clearTimeout); gts.forEach(clearTimeout); };
  }, [onComplete]);

  const isWinnerPhase = phase === "winner";
  const clipLeft  = "polygon(0 0, 100% 0, 85% 100%, 0 100%)";
  const clipRight = "polygon(15% 0, 100% 0, 100% 100%, 0 100%)";
  const leftIsLoser  = !p1IsWinner;
  const rightIsLoser =  p1IsWinner;

  // Winner side info
  const winnerSideStr: "left" | "right" = p1IsWinner ? "left" : "right";
  const winnerNo_    = winnerNo;
  const winnerName_  = winnerName;
  const loserNo_     = loserNo;
  const loserName_   = loserName;

  // Left panel data
  const leftNo   = p1IsWinner ? winnerNo_  : loserNo_;
  const leftName = p1IsWinner ? winnerName_: loserName_;
  // Right panel data
  const rightNo   = p1IsWinner ? loserNo_  : winnerNo_;
  const rightName = p1IsWinner ? loserName_: winnerName_;

  return (
    <>
      <style>{`
        @keyframes nameSlideLeft  { from{transform:translateX(-40px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes nameSlideRight { from{transform:translateX( 40px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes winnerDrop     { from{opacity:0;transform:scale(0.5) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes flashRed       { from{opacity:0.45} to{opacity:0.04} }
        @keyframes loserFall      {
          0%   { transform:translateY(0)   rotate(0deg);  opacity:1; filter:grayscale(0) brightness(1); }
          25%  { transform:translateY(5%)  rotate(2deg);  opacity:0.9; }
          100% { transform:translateY(120%) rotate(${leftIsLoser ? -10 : 10}deg); opacity:0; filter:grayscale(1) brightness(0.2); }
        }
      `}</style>

      <div className="fixed inset-0 overflow-hidden" style={{
        zIndex: 9999,
        opacity: exiting ? 0 : 1,
        transition: exiting ? "opacity 0.7s ease-in" : "opacity 0.25s ease-out",
      }}>
        {/* Three.js BG */}
        <div className="absolute inset-0">
          <Canvas camera={{ position:[0,0,6], fov:60 }} gl={{ alpha:false, antialias:false }} dpr={[1,1.5]}>
            <OutroScene phase={phase} loserOnRight={loserOnRight} />
          </Canvas>
        </div>

        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px)",
          opacity: 0.6, zIndex: 1,
        }} />

        {/* ── LEFT PANEL ── */}
        <div className="absolute inset-y-0 left-0" style={{
          width: "50%",
          // Loser: giữ clipPath để animation rơi đẹp; Winner attack phase: clipPath bình thường
          clipPath: (isWinnerPhase && !leftIsLoser) ? "none" : clipLeft,
          zIndex: leftIsLoser ? 2 : 3,
          // Winner panel: ẩn khi đã có fixed layer thay thế
          visibility: (isWinnerPhase && !leftIsLoser) ? "hidden" : "visible",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            animation: (isWinnerPhase && leftIsLoser)
              ? "loserFall 1s cubic-bezier(0.55,0,1,0.45) forwards"
              : "none",
            transform: (!isWinnerPhase && leftIsLoser)
              ? `translate(${shakeOffset.x}px,${shakeOffset.y}px)` : undefined,
          }}>
            <AvatarImg no={leftNo} name={leftName} side="left" />
            <div className="absolute inset-y-0 right-0 w-1/3"
              style={{ background: "linear-gradient(to right,transparent,rgba(5,0,16,0.95))" }} />
            <div className="absolute inset-x-0 top-0 h-16"
              style={{ background: "linear-gradient(to bottom,rgba(5,0,16,0.7),transparent)" }} />
            <div className="absolute inset-x-0 bottom-0 h-24"
              style={{ background: "linear-gradient(to top,rgba(5,0,16,0.85),transparent)" }} />
            <div className="absolute inset-0" style={{
              background: p1IsWinner
                ? "linear-gradient(135deg,rgba(37,99,235,0.15) 0%,transparent 60%)"
                : "linear-gradient(135deg,rgba(185,28,28,0.15) 0%,transparent 60%)",
              mixBlendMode: "screen",
            }} />
          </div>
          {/* Red flash */}
          {leftIsLoser && !isWinnerPhase && (
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "rgba(255,0,0,0.2)",
              animation: "flashRed 0.12s ease-in-out infinite alternate", zIndex: 8,
            }} />
          )}
          {/* Name tag */}
          <div className="absolute bottom-8 left-8" style={{ zIndex: 9,
            animation: "nameSlideLeft 0.5s cubic-bezier(0.22,1,0.36,1) both" }}>
            <div className="text-xs font-mono tracking-widest mb-1"
              style={{ color: p1IsWinner ? "rgba(96,165,250,0.6)" : "rgba(248,113,113,0.6)" }}>
              #{leftNo}
            </div>
            <div className="font-black text-white leading-tight"
              style={{ fontSize: "clamp(1.2rem,2vw,2rem)",
                textShadow: p1IsWinner
                  ? "0 0 24px rgba(96,165,250,1),0 0 50px rgba(96,165,250,0.5),2px 2px 12px rgba(0,0,0,1)"
                  : "0 0 24px rgba(248,113,113,1),0 0 50px rgba(248,113,113,0.5),2px 2px 12px rgba(0,0,0,1)" }}>
              {leftName}
            </div>
            <div className="mt-2 h-0.5 w-16 rounded-full" style={{
              background: p1IsWinner
                ? "linear-gradient(to right,rgba(96,165,250,0.9),transparent)"
                : "linear-gradient(to right,rgba(248,113,113,0.9),transparent)",
            }} />
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="absolute inset-y-0 right-0" style={{
          width: "50%",
          clipPath: (isWinnerPhase && !rightIsLoser) ? "none" : clipRight,
          zIndex: rightIsLoser ? 2 : 3,
          visibility: (isWinnerPhase && !rightIsLoser) ? "hidden" : "visible",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            animation: (isWinnerPhase && rightIsLoser)
              ? "loserFall 1s cubic-bezier(0.55,0,1,0.45) forwards"
              : "none",
            transform: (!isWinnerPhase && rightIsLoser)
              ? `translate(${shakeOffset.x}px,${shakeOffset.y}px)` : undefined,
          }}>
            <AvatarImg no={rightNo} name={rightName} side="right" />
            <div className="absolute inset-y-0 left-0 w-1/3"
              style={{ background: "linear-gradient(to left,transparent,rgba(5,0,16,0.95))" }} />
            <div className="absolute inset-x-0 top-0 h-16"
              style={{ background: "linear-gradient(to bottom,rgba(5,0,16,0.7),transparent)" }} />
            <div className="absolute inset-x-0 bottom-0 h-24"
              style={{ background: "linear-gradient(to top,rgba(5,0,16,0.85),transparent)" }} />
            <div className="absolute inset-0" style={{
              background: p1IsWinner
                ? "linear-gradient(225deg,rgba(185,28,28,0.15) 0%,transparent 60%)"
                : "linear-gradient(225deg,rgba(37,99,235,0.15) 0%,transparent 60%)",
              mixBlendMode: "screen",
            }} />
          </div>
          {rightIsLoser && !isWinnerPhase && (
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "rgba(255,0,0,0.2)",
              animation: "flashRed 0.12s ease-in-out infinite alternate", zIndex: 8,
            }} />
          )}
          <div className="absolute bottom-8 right-8 text-right" style={{ zIndex: 9,
            animation: "nameSlideRight 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both" }}>
            <div className="text-xs font-mono tracking-widest mb-1"
              style={{ color: p1IsWinner ? "rgba(248,113,113,0.6)" : "rgba(96,165,250,0.6)" }}>
              #{rightNo}
            </div>
            <div className="font-black text-white leading-tight"
              style={{ fontSize: "clamp(1.2rem,2vw,2rem)",
                textShadow: p1IsWinner
                  ? "0 0 24px rgba(248,113,113,1),0 0 50px rgba(248,113,113,0.5),2px 2px 12px rgba(0,0,0,1)"
                  : "0 0 24px rgba(96,165,250,1),0 0 50px rgba(96,165,250,0.5),2px 2px 12px rgba(0,0,0,1)" }}>
              {rightName}
            </div>
            <div className="mt-2 h-0.5 w-16 rounded-full ml-auto" style={{
              background: p1IsWinner
                ? "linear-gradient(to left,rgba(248,113,113,0.9),transparent)"
                : "linear-gradient(to left,rgba(96,165,250,0.9),transparent)",
            }} />
          </div>
        </div>

        {/* ── WINNER AVATAR — fixed full screen layer ── */}
        {isWinnerPhase && (
          <div className="absolute pointer-events-none" style={{
            zIndex: 5,
            // Bắt đầu từ vị trí panel (50% bên trái hoặc bên phải)
            // Transition sang full screen
            top:    0,
            left:   winnerExpanded ? 0 : (winnerSideStr === "left" ? 0 : "50%"),
            width:  winnerExpanded ? "100%" : "50%",
            bottom: 0,
            transition: "left 1.2s cubic-bezier(0.22,1,0.36,1), width 1.2s cubic-bezier(0.22,1,0.36,1)",
          }}>
            <AvatarImg
              no={winnerNo_}
              name={winnerName_}
              side={winnerSideStr}
            />
            {/* Golden vignette overlay */}
            <div className="absolute inset-0" style={{
              background: winnerSideStr === "left"
                ? "linear-gradient(to right, rgba(5,0,16,0) 60%, rgba(5,0,16,0.6))"
                : "linear-gradient(to left, rgba(5,0,16,0) 60%, rgba(5,0,16,0.6))",
              transition: "opacity 1s",
              opacity: winnerExpanded ? 1 : 0,
            }} />
            {/* Top/bottom fades */}
            <div className="absolute inset-x-0 top-0 h-16"
              style={{ background: "linear-gradient(to bottom,rgba(5,0,16,0.5),transparent)" }} />
            <div className="absolute inset-x-0 bottom-0 h-32"
              style={{ background: "linear-gradient(to top,rgba(5,0,16,0.8),transparent)" }} />
            {/* Gold tint */}
            <div className="absolute inset-0" style={{
              background: "radial-gradient(ellipse at center, rgba(255,200,0,0.08) 0%, transparent 70%)",
              mixBlendMode: "screen",
            }} />
          </div>
        )}

        {/* ── Glow divider (attack phase) ── */}
        {!isWinnerPhase && (
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }}>
            <div className="absolute inset-y-0" style={{
              left: "calc(45% - 1px)", width: 2,
              background: "linear-gradient(to bottom,transparent,rgba(255,80,0,0.9) 20%,rgba(255,200,0,1) 50%,rgba(255,0,60,0.9) 80%,transparent)",
              transform: "skewX(-8deg)",
              boxShadow: "0 0 12px 3px rgba(255,100,0,0.6),0 0 30px 6px rgba(255,50,0,0.3)",
            }} />
            <div className="absolute inset-y-0" style={{
              left: "calc(55% - 1px)", width: 2,
              background: "linear-gradient(to bottom,transparent,rgba(255,60,0,0.6) 20%,rgba(255,100,0,0.8) 50%,rgba(255,0,30,0.6) 80%,transparent)",
              transform: "skewX(-8deg)",
              boxShadow: "0 0 8px 2px rgba(255,50,0,0.3)",
            }} />
          </div>
        )}

        {/* ── WINNER text ── */}
        {winnerVisible && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none pb-16"
            style={{ zIndex: 20 }}>
            <div className="flex flex-col items-center gap-3"
              style={{ animation: "winnerDrop 0.7s cubic-bezier(0.22,1,0.36,1) both" }}>
              <WinnerText glitch={glitch} />
              <div className="font-black text-white"
                style={{
                  fontSize: "clamp(1.4rem,3vw,2.8rem)",
                  textShadow: "0 0 24px rgba(255,215,0,1),0 0 50px rgba(255,165,0,0.5),2px 2px 12px rgba(0,0,0,1)",
                  letterSpacing: "0.08em",
                  animation: "nameSlideLeft 0.5s cubic-bezier(0.22,1,0.36,1) 0.2s both",
                }}>
                {winnerName}
              </div>
              <div className="h-0.5 rounded-full" style={{
                width: "min(300px,40vw)",
                background: "linear-gradient(to right,transparent,#ffd700,transparent)",
                boxShadow: "0 0 10px rgba(255,215,0,0.6)",
              }} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
