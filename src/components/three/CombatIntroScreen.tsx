import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Three.js: Ember/Ash Particles (Tàn tro ma thuật) ─────────────────────────
function AshParticles() {
  const mesh = useRef<THREE.Points>(null!);

  const [positions, velocities, colors] = useMemo(() => {
    const count = 500;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 4;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.sin(angle) * r;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
      
      const speed = 0.01 + Math.random() * 0.03;
      // Bay lả tả lên trên
      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = speed;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      
      // Màu từ than hồng rực đến lửa vàng
      const t = Math.random();
      const c = new THREE.Color().lerpColors(
        new THREE.Color("#ff3300"), // Red/Orange
        new THREE.Color("#ffaa00"), // Gold/Yellow
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
      // Reset khi bay cao quá
      if (pos[i * 3 + 1] > 6) {
        pos[i * 3 + 1] = -4; // rớt xuống dưới lại
        pos[i * 3] = (Math.random() - 0.5) * 10;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh} geometry={geometry}>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ── Three.js: Shockwave stardust (thay cho neon ring)  ────────────────────────
function StardustShockwave({ triggered }: { triggered: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const startT = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (triggered && startT.current === null) startT.current = clock.getElapsedTime();
    if (startT.current === null) return;
    const elapsed = clock.getElapsedTime() - startT.current;
    
    // Nổ chậm hơn xíu
    const dur = 1.2; 
    const t = Math.min(elapsed / dur, 1);
    
    if (meshRef.current) {
      // Scale theo ease out cubic
      const scale = 1 + (1 - Math.pow(1 - t, 3)) * 25;
      meshRef.current.scale.setScalar(scale);
    }
    if (matRef.current) matRef.current.opacity = (1 - t) * 0.9;
    if (t >= 1) startT.current = null;
  });

  return (
    <mesh ref={meshRef}>
      <ringGeometry args={[0.1, 0.4, 64]} />
      <meshBasicMaterial
        ref={matRef}
        color="#ffd700" // Gold
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Three.js: Background Cosmic Nebula ────────────────────────────────────────
function BackgroundNebula() {
  const ref = useRef<THREE.Points>(null!);
  const { geo } = useMemo(() => {
    const count = 300;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = -3 + Math.random() * -5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geo: g };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    (ref.current.material as THREE.PointsMaterial).opacity =
      0.1 + Math.abs(Math.sin(clock.getElapsedTime() * 0.3)) * 0.2;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        size={0.15}
        color="#a78bfa"
        transparent
        opacity={0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function IntroScene({ vsVisible }: { vsVisible: boolean }) {
  return (
    <>
      <color attach="background" args={["#03000a"]} />
      <BackgroundNebula />
      <AshParticles />
      {/* Sấm chớp nhẹ ở background thay vì vạch chéo ngang */}
      <pointLight position={[0, 0, -2]} color="#ffaa00" intensity={vsVisible ? 3.0 : 0} distance={15} />
      <StardustShockwave triggered={vsVisible} />
    </>
  );
}

// ── Avatar Logic ─────────────────────────────────────────────────────────────
const AVATAR_EXTS = ["png", "jpg", "jpeg", "gif", "webp"];
const RANDOM_AVATAR_COUNT = 20;

function getRandomAvatarIndex(no: number): number {
  return (no % RANDOM_AVATAR_COUNT) + 1;
}

function AvatarWithFallback({ no, name, side }: { no: number; name: string; side: "left" | "right" }) {
  const [extIndex, setExtIndex] = useState(0);
  const [phase, setPhase] = useState<"player" | "random">("player");
  const [randomExtIndex, setRandomExtIndex] = useState(0);
  const isLeft = side === "left";
  const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  const playerSrc = phase === "player" && extIndex < AVATAR_EXTS.length
      ? `${basePath}/data/avatars/no${no}.${AVATAR_EXTS[extIndex]}` : null;
  const randomIndex = getRandomAvatarIndex(no);
  const randomSrc = phase === "random" && randomExtIndex < AVATAR_EXTS.length
      ? `${basePath}/data/avatars/randomAvatar/${randomIndex}.${AVATAR_EXTS[randomExtIndex]}` : null;

  const src = playerSrc ?? randomSrc;

  if (src) {
    const handleError = () => {
      if (phase === "player") {
        if (extIndex + 1 < AVATAR_EXTS.length) setExtIndex(extIndex + 1);
        else { setPhase("random"); setRandomExtIndex(0); }
      } else {
        setRandomExtIndex((i) => i + 1);
      }
    };
    return (
      <img
        key={src} src={src} alt={name}
        className="absolute inset-0"
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
        onError={handleError}
      />
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center select-none"
      style={{
        background: isLeft
          ? "radial-gradient(ellipse at 30% 50%, rgba(30,58,138,0.4) 0%, transparent 80%)"
          : "radial-gradient(ellipse at 70% 50%, rgba(127,29,29,0.4) 0%, transparent 80%)",
      }}>
      <span className="font-black font-serif" style={{
        fontSize: "clamp(8rem, 20vw, 18rem)", color: "transparent",
        WebkitTextStroke: isLeft ? "1px rgba(255,215,0,0.15)" : "1px rgba(255,215,0,0.15)",
        userSelect: "none",
      }}>
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

// ── VS TEXT: Molten Gold Divine Clash ─────────────────────────────────────────
function VSText({ isClashing }: { isClashing: boolean }) {
  return (
    <div style={{ position: "relative" }}>
      <div
        className="font-black select-none font-serif"
        style={{
          fontSize: "clamp(5rem, 14vw, 10rem)",
          color: "transparent",
          // Gold border
          WebkitTextStroke: "2px rgba(255,215,0,0.9)",
          // Thêm bóng mờ vầng lửa phía sau
          textShadow: isClashing 
            ? "0 0 50px rgba(255,60,0,1), 0 0 100px rgba(255,165,0,0.9), 0 0 150px rgba(255,215,0,0.6)"
            : "0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,165,0,0.5)",
          filter: "drop-shadow(0 0 20px rgba(255,215,0,0.8))",
          letterSpacing: "0.1em",
          transition: "text-shadow 0.2s ease-out"
        }}
      >
        VS
      </div>
      
      {/* Vát sáng quét ngang chữ (Shiny reflect) */}
      <div 
        className="absolute inset-0 select-none font-serif font-black overflow-hidden pointer-events-none"
        style={{
          fontSize: "clamp(5rem, 14vw, 10rem)",
          color: "rgba(255,255,255,0.7)",
          WebkitBackgroundClip: "text",
          letterSpacing: "0.1em",
          opacity: isClashing ? 1 : 0,
          transition: "opacity 0.2s"
        }}>
        VS
      </div>
    </div>
  );
}

// ── Countdown Number (Divine Style) ───────────────────────────────────────────
function CountdownNumber({ count }: { count: number }) {
  const [key, setKey] = useState(count);
  useEffect(() => { setKey(count); }, [count]);

  return (
    <div key={key} className="font-serif" style={{
        fontSize: "clamp(3rem, 8vw, 5rem)",
        fontWeight: 900,
        color: "transparent",
        WebkitTextStroke: count <= 1 ? "2px rgba(255,60,0,0.9)" : "2px rgba(255,215,0,0.7)",
        textShadow: count <= 1
            ? "0 0 30px rgba(255,60,0,1), 0 0 60px rgba(255,60,0,0.5)"
            : "0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,165,0,0.4)",
        animation: "divinePop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
        lineHeight: 1, userSelect: "none",
      }}>
      {count}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function CombatIntroScreen({ player1Name, player1No, player2Name, player2No, onComplete, volume = 1 }: any) {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [isClashing, setIsClashing] = useState(false);

  const total = 5000;

  useEffect(() => {
    const audio = new Audio("/assets/combatSFX/startcombat.mp3"); // Đổi sfx thành magic clang nếu có
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

    // Clash flash triggers (thay cho Glitch)
    const clashIntervals: ReturnType<typeof setTimeout>[] = [];
    [400, 1200, 2400].forEach((ms) => {
      const t = setTimeout(() => {
        setIsClashing(true);
        setTimeout(() => setIsClashing(false), 150);
      }, ms);
      clashIntervals.push(t);
    });

    const t2 = setTimeout(() => setPhase("exit"), 4200);
    const t3 = setTimeout(() => onComplete(), total);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearInterval(iv);
      clashIntervals.forEach(clearTimeout);
    };
  }, []);

  const entering = phase === "enter";
  const exiting = phase === "exit";
  const vsVisible = !entering && !exiting;

  const clipP1 = "polygon(0 0, 100% 0, 80% 100%, 0 100%)";
  const clipP2 = "polygon(20% 0, 100% 0, 100% 100%, 0 100%)";

  return (
    <>
      <style>{`
        @keyframes divinePop {
          0%   { transform: scale(1.5); opacity: 0; filter: brightness(2); }
          60%  { transform: scale(0.95); opacity: 1; filter: brightness(1.2); }
          100% { transform: scale(1); opacity: 1; filter: brightness(1); }
        }
        @keyframes nameSlideLeft {
          from { transform: translateX(-40px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes nameSlideRight {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <div className="fixed inset-0 z-[9990] overflow-hidden"
        style={{
          opacity: exiting ? 0 : 1,
          transition: exiting ? "opacity 0.7s ease-in" : "opacity 0.25s ease-out",
        }}>
        
        {/* Three.js background */}
        <div className="absolute inset-0 pointer-events-none">
          <Canvas camera={{ position: [0, 0, 6], fov: 60 }} gl={{ alpha: false, antialias: false }} dpr={[1, 1.5]}>
            <IntroScene vsVisible={vsVisible} />
          </Canvas>
        </div>

        {/* ── Avatar P1 ── */}
        <div className="absolute inset-y-0 left-0 w-1/2"
          style={{
            clipPath: clipP1,
            transform: entering ? "translateX(-100%)" : exiting ? "translateX(-80%)" : "translateX(0)",
            opacity: entering ? 0 : exiting ? 0 : 1, // Fix lỗi giật hình
            transition: entering ? "none" : exiting ? "transform 0.7s ease-in, opacity 0.7s ease-in" : "transform 0.65s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease-out",
            zIndex: 2,
          }}>
          <AvatarWithFallback no={player1No} name={player1Name} side="left" />
          
          {/* Gradient Shadows cho góc cạnh điện ảnh hơn */}
          <div className="absolute inset-y-0 right-0 w-1/2" style={{ background: "linear-gradient(to right, transparent, rgba(5,0,16,0.95))" }} />
          <div className="absolute inset-x-0 bottom-0 h-32" style={{ background: "linear-gradient(to top, rgba(5,0,16,0.9), transparent)" }} />
          
          <div className="absolute top-8 left-8" style={{ animation: !entering ? "nameSlideLeft 0.5s cubic-bezier(0.22,1,0.36,1) both" : "none" }}>
            <div className="text-yellow-500/70 text-xs font-serif tracking-widest mb-1 uppercase drop-shadow-md">
              Challenger · #{player1No}
            </div>
            <div className="font-black text-white font-serif leading-tight tracking-wider"
              style={{ fontSize: "clamp(1.4rem, 2.5vw, 2.2rem)", textShadow: "0 0 10px rgba(255,215,0,0.4), 2px 2px 5px rgba(0,0,0,1)" }}>
              {player1Name}
            </div>
          </div>
        </div>

        {/* ── Avatar P2 ── */}
        <div className="absolute inset-y-0 right-0 w-1/2"
          style={{
            clipPath: clipP2,
            transform: entering ? "translateX(100%)" : exiting ? "translateX(80%)" : "translateX(0)",
            opacity: entering ? 0 : exiting ? 0 : 1,
            transition: entering ? "none" : exiting ? "transform 0.7s ease-in, opacity 0.7s ease-in" : "transform 0.65s cubic-bezier(0.22,1,0.36,1) 0.1s, opacity 0.5s ease-out 0.1s",
            zIndex: 2,
          }}>
          <AvatarWithFallback no={player2No} name={player2Name} side="right" />
          
          <div className="absolute inset-y-0 left-0 w-1/2" style={{ background: "linear-gradient(to left, transparent, rgba(5,0,16,0.95))" }} />
          <div className="absolute inset-x-0 bottom-0 h-32" style={{ background: "linear-gradient(to top, rgba(5,0,16,0.9), transparent)" }} />
          
          <div className="absolute top-8 right-8 text-right" style={{ animation: !entering ? "nameSlideRight 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both" : "none" }}>
            <div className="text-red-500/70 text-xs font-serif tracking-widest mb-1 uppercase drop-shadow-md">
              #{player2No} · Defender
            </div>
            <div className="font-black text-white font-serif leading-tight tracking-wider"
              style={{ fontSize: "clamp(1.4rem, 2.5vw, 2.2rem)", textShadow: "0 0 10px rgba(255,0,0,0.4), 2px 2px 5px rgba(0,0,0,1)" }}>
              {player2Name}
            </div>
          </div>
        </div>

        {/* ── Magma fissure ở giữa (Thay cho Glow lines) ── */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ opacity: entering ? 0 : exiting ? 0 : 1, transition: entering ? "none" : exiting ? "opacity 0.4s" : "opacity 0.4s ease-out 0.3s", zIndex: 3 }}>
          <div className="absolute inset-y-0"
              style={{
                left: "calc(50% - 2px)", width: 4,
                background: "linear-gradient(to bottom, transparent, rgba(255,165,0,0.9) 30%, rgba(255,215,0,1) 50%, rgba(255,60,0,0.9) 70%, transparent)",
                transform: "skewX(-10deg)",
                boxShadow: "0 0 20px 5px rgba(255,100,0,0.5), 0 0 40px 10px rgba(255,215,0,0.3)",
              }} />
        </div>

        {/* ── VS + Countdown ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2"
          style={{
            zIndex: 4,
            opacity: entering || exiting ? 0 : 1,
            transform: entering ? "scale(3)" : exiting ? "scale(0.3)" : "scale(1)",
            transition: entering ? "none" : exiting ? "transform 0.5s ease-in, opacity 0.5s ease-in" : "transform 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.25s, opacity 0.4s ease-out 0.25s",
          }}>
          <VSText isClashing={isClashing} />
          {!entering && !exiting && <CountdownNumber count={countdown} />}
        </div>
        
        {/* Lớp hạt (Vignette tối) xung quanh viền màn hình */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)", zIndex: 5 }} />

      </div>
    </>
  );
}
