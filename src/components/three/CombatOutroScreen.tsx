import React, { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Three.js: Fire/Ash Swipe (Cơn bão tàn tro kết liễu) ────────────────────────
function FireAshSwipe({ toRight }: { toRight: boolean }) {
  const mesh = useRef<THREE.Points>(null!);
  const COUNT = 600;

  const [positions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const spawnX = toRight ? -2.5 : 2.5;

    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = spawnX + (Math.random() - 0.5);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3 - 1;

      const speed = 0.05 + Math.random() * 0.15;
      vel[i * 3] = (toRight ? 1 : -1) * speed;
      // Bay xé gió lên trên hoặc xuống dưới
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.04;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      // Màu dung nham (Từ cam đỏ rực đến xám tro)
      const t = Math.pow(Math.random(), 2); // Thiên về màu tối hơn
      const c = new THREE.Color().lerpColors(
        new THREE.Color("#444444"), // Xám tro
        new THREE.Color("#ff3300"), // Đỏ lửa
        t
      );
      // Điểm xuyết vài đóm vàng sáng
      if (Math.random() > 0.95) c.setHex(0xffdd00);

      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    return [pos, vel, col];
  }, [toRight]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  const targetX = toRight ? 3.5 : -3.5;
  useFrame(() => {
    if (!mesh.current) return;
    const pos = mesh.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] += velocities[i * 3];
      pos[i * 3 + 1] += velocities[i * 3 + 1];
      
      // Hit target -> reset
      if (Math.sign(velocities[i * 3]) * (pos[i * 3] - targetX) > 0.5) {
        pos[i * 3] = (toRight ? -2.5 : 2.5) + (Math.random() - 0.5);
        pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh} geometry={geo}>
      <pointsMaterial 
        size={0.12} 
        vertexColors 
        transparent 
        opacity={0.85}
        sizeAttenuation 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
      />
    </points>
  );
}

// ── Three.js: God Rays & Dust (Ánh sáng thần thánh) ───────────────────────────
function GodRays({ active }: { active: boolean }) {
  const ref = useRef<THREE.Points>(null!);
  const geo = useMemo(() => {
    const count = 300;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
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
    mat.opacity = (active ? 0.6 : 0.1) * (0.5 + Math.abs(Math.sin(clock.getElapsedTime() * 0.5)) * 0.5);
  });

  return (
    <group>
      <points ref={ref} geometry={geo}>
        <pointsMaterial 
          size={0.06} 
          color={active ? "#ffd700" : "#4b0082"}
          transparent 
          opacity={0.4} 
          sizeAttenuation
          blending={THREE.AdditiveBlending} 
          depthWrite={false} 
        />
      </points>
      {/* Light chiếu từ trên */}
      <spotLight 
        position={[0, 8, 2]} 
        angle={Math.PI / 4} 
        penumbra={1} 
        intensity={active ? 3 : 0} 
        color="#ffcc00" 
      />
    </group>
  );
}

// ── Three.js: Lôi phạt đan chéo nhau (Thay thế vạch cắt) ─────────────────────
function MagicSlashes({ red }: { red: boolean }) {
  const [line1, line2] = useMemo(() => {
    const make = (offsetY: number, color: string) => {
      // Dùng Bezier Curve làm vết cắt nhìn mượt cong như pháp thuật
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-10, offsetY + 6, 0),
        new THREE.Vector3(0, offsetY, 0),
        new THREE.Vector3(10, offsetY - 6, 0)
      );
      const points = curve.getPoints(50);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false, linewidth: 3,
      });
      return new THREE.Line(geo, mat);
    };
    return [
      make(0.5, red ? "#ff2200" : "#ffd700"),
      make(-0.5, red ? "#cc0000" : "#ff8800"),
    ];
  }, [red]);

  useFrame(({ clock }) => {
    const pulse = 0.5 + Math.abs(Math.sin(clock.getElapsedTime() * 6)) * 0.5;
    (line1.material as THREE.LineBasicMaterial).opacity = pulse * 0.8;
    (line2.material as THREE.LineBasicMaterial).opacity = pulse * 0.6;
  });

  return (<><primitive object={line1} /><primitive object={line2} /></>);
}

// ── Three.js: Winner Divine Shockwave ──────────────────────────────────────────
function DivineShockwave({ triggered }: { triggered: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);
  const startT = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (triggered && startT.current === null) startT.current = clock.getElapsedTime();
    if (startT.current === null) return;
    const t = Math.min((clock.getElapsedTime() - startT.current) / 1.5, 1);
    
    // Scale chậm nhưng to
    if (ringRef.current) ringRef.current.scale.setScalar(1 + (1 - Math.pow(1 - t, 3)) * 20);
    if (matRef.current) matRef.current.opacity = (1 - t) * 0.9;
    if (t >= 1) startT.current = null;
  });

  return (
    <mesh ref={ringRef}>
      <ringGeometry args={[0.05, 0.5, 64]} />
      <meshBasicMaterial ref={matRef} color="#ffffff" transparent opacity={0.8}
        blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function OutroScene({ phase, loserOnRight }: { phase: "attack" | "winner"; loserOnRight: boolean }) {
  return (
    <>
      <color attach="background" args={["#03000a"]} />
      <GodRays active={phase === "winner"} />
      <MagicSlashes red={phase === "attack"} />
      {phase === "attack" && <FireAshSwipe toRight={loserOnRight} />}
      {phase === "winner" && <DivineShockwave triggered />}
    </>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_EXTS = ["png", "jpg", "jpeg", "gif", "webp"];
const RANDOM_AVATAR_COUNT = 20;

function getRandomAvatarIndex(no: number): number {
  return (no % RANDOM_AVATAR_COUNT) + 1;
}

function AvatarImg({ no, name, side }: { no: number; name: string; side: "left" | "right" }) {
  const [extIndex, setExtIndex] = useState(0);
  const [phase, setPhase] = useState<"player" | "random">("player");
  const [randomExtIndex, setRandomExtIndex] = useState(0);
  const basePath = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
  const isLeft = side === "left";

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
      } else setRandomExtIndex((i) => i + 1);
    };
    return (
      <img key={src} src={src} alt={name}
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
          ? "radial-gradient(ellipse at 30% 50%, rgba(30,58,138,0.6) 0%, transparent 70%)"
          : "radial-gradient(ellipse at 70% 50%, rgba(127,29,29,0.6) 0%, transparent 70%)",
      }}>
      <span className="font-black font-serif" style={{
        fontSize: "clamp(8rem,20vw,18rem)", color: "transparent",
        WebkitTextStroke: "1px rgba(255,215,0,0.2)",
        userSelect: "none",
      }}>{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

// ── WINNER text mạ vàng (Thay vì Glitch) ──────────────────────────────────────
function WinnerText({ pulsing }: { pulsing: boolean }) {
  const style: React.CSSProperties = {
    fontSize: "clamp(4rem, 10vw, 8rem)",
    letterSpacing: "0.15em",
    fontWeight: 900,
    fontFamily: '"Cinzel", "Georgia", serif',
  };
  return (
    <div style={{ position: "relative" }}>
      {/* Lên màu gradient tĩnh */}
      <span className="select-none" style={{
        ...style,
        color: "transparent",
        WebkitTextStroke: "2px rgba(255, 230, 0, 0.95)",
        // Tạo khối glow gold mạnh
        textShadow: pulsing 
          ? "0 0 50px rgba(255,200,0,1), 0 0 80px rgba(255,150,0,0.8), 2px 2px 10px rgba(0,0,0,1)"
          : "0 0 20px rgba(255,200,0,0.6), 0 0 40px rgba(255,150,0,0.4), 2px 2px 10px rgba(0,0,0,1)",
        filter: "drop-shadow(0 0 10px rgba(255,215,0,0.5))",
        transition: "text-shadow 0.5s ease-in-out"
      }}>
        WINNER
      </span>

      {/* Shine layer chớp nháy nhẹ thay vì bị rách khung hình */}
      <div className="absolute inset-0 select-none overflow-hidden pointer-events-none"
        style={{
          ...style,
          color: "rgba(255, 255, 255, 0.8)",
          WebkitBackgroundClip: "text",
          opacity: pulsing ? 1 : 0,
          transition: "opacity 0.3s"
        }}>
        WINNER
      </div>
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
  const [pulsing,        setPulsing]        = useState(false);
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
    const t1b = setTimeout(() => setWinnerExpanded(true), 2550);
    const t2  = setTimeout(() => { setWinnerVisible(true); setPulsing(true); }, 2900);
    const tPulse = setTimeout(() => setInterval(() => setPulsing(p => !p), 800), 3000);
    
    const t3 = setTimeout(() => setExiting(true), 4300);
    const t4 = setTimeout(() => onComplete(), 5000);
    return () => { [t1,t1b,t2,t3,t4,tPulse].forEach(clearTimeout); };
  }, [onComplete]);

  const isWinnerPhase = phase === "winner";
  // Cắt chéo card mượt hơn
  const clipLeft  = "polygon(0 0, 100% 0, 80% 100%, 0 100%)";
  const clipRight = "polygon(20% 0, 100% 0, 100% 100%, 0 100%)";
  const leftIsLoser  = !p1IsWinner;
  const rightIsLoser =  p1IsWinner;

  const winnerSideStr: "left" | "right" = p1IsWinner ? "left" : "right";
  const winnerNo_    = winnerNo;
  const winnerName_  = winnerName;
  const loserNo_     = loserNo;
  const loserName_   = loserName;

  const leftNo   = p1IsWinner ? winnerNo_  : loserNo_;
  const leftName = p1IsWinner ? winnerName_: loserName_;
  const rightNo   = p1IsWinner ? loserNo_  : winnerNo_;
  const rightName = p1IsWinner ? loserName_: winnerName_;

  const bgShadowLeft = "linear-gradient(to right, transparent, rgba(5,0,16,0.95))";
  const bgShadowRight = "linear-gradient(to left, transparent, rgba(5,0,16,0.95))";

  return (
    <>
      <style>{`
        @keyframes nameSlideLeft  { from{transform:translateX(-40px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes nameSlideRight { from{transform:translateX( 40px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes winnerDrop     { from{opacity:0;transform:scale(0.8) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes flashRedDark   { from{opacity:0.6} to{opacity:0.1} }
        @keyframes loserFall      {
          0%   { transform:translateY(0)   rotate(0deg);  opacity:1; filter:grayscale(0.2) brightness(1); }
          25%  { transform:translateY(5%)  rotate(2deg);  opacity:0.9; }
          100% { transform:translateY(120%) rotate(${leftIsLoser ? -10 : 10}deg); opacity:0; filter:grayscale(1) brightness(0); }
        }
      `}</style>

      <div className="fixed inset-0 overflow-hidden" style={{
        zIndex: 9999,
        opacity: exiting ? 0 : 1,
        transition: exiting ? "opacity 0.7s ease-in" : "opacity 0.25s ease-out",
      }}>
        {/* Three.js BG */}
        <div className="absolute inset-0 pointer-events-none">
          <Canvas camera={{ position:[0,0,6], fov:60 }} gl={{ alpha:false, antialias:false }} dpr={[1,1.5]}>
            <OutroScene phase={phase} loserOnRight={loserOnRight} />
          </Canvas>
        </div>

        {/* ── LEFT PANEL ── */}
        <div className="absolute inset-y-0 left-0" style={{
          width: "50%",
          clipPath: (isWinnerPhase && !leftIsLoser) ? "none" : clipLeft,
          zIndex: leftIsLoser ? 2 : 3,
          visibility: (isWinnerPhase && !leftIsLoser) ? "hidden" : "visible",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            animation: (isWinnerPhase && leftIsLoser) ? "loserFall 1.2s cubic-bezier(0.55,0,1,0.45) forwards" : "none",
            transform: (!isWinnerPhase && leftIsLoser) ? `translate(${shakeOffset.x}px,${shakeOffset.y}px)` : undefined,
          }}>
            <AvatarImg no={leftNo} name={leftName} side="left" />
            <div className="absolute inset-y-0 right-0 w-1/2" style={{ background: bgShadowLeft }} />
            <div className="absolute inset-x-0 bottom-0 h-32" style={{ background: "linear-gradient(to top,rgba(5,0,16,0.9),transparent)" }} />
          </div>
          {/* Sát thương Hắc ám (Tím xám nhấp nháy đỏ rực) */}
          {leftIsLoser && !isWinnerPhase && (
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "linear-gradient(135deg, rgba(80,0,0,0.5), rgba(0,0,0,0.6))",
              animation: "flashRedDark 0.1s ease-in-out infinite alternate", zIndex: 8, mixBlendMode: "multiply"
            }} />
          )}
          {/* Name tag */}
          <div className="absolute bottom-8 left-8" style={{ zIndex: 9, animation: "nameSlideLeft 0.5s cubic-bezier(0.22,1,0.36,1) both" }}>
            <div className="text-xs font-serif tracking-widest mb-1" style={{ color: p1IsWinner ? "rgba(255,215,0,0.6)" : "rgba(100,0,0,0.8)" }}>
              #{leftNo}
            </div>
            <div className="font-black text-white font-serif leading-tight tracking-wider"
              style={{ fontSize: "clamp(1.4rem,2.5vw,2.2rem)",
                textShadow: p1IsWinner ? "0 0 10px rgba(255,215,0,0.6), 2px 2px 5px rgba(0,0,0,1)" : "0 0 10px rgba(255,0,0,0.6), 2px 2px 5px rgba(0,0,0,1)" }}>
              {leftName}
            </div>
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
            animation: (isWinnerPhase && rightIsLoser) ? "loserFall 1.2s cubic-bezier(0.55,0,1,0.45) forwards" : "none",
            transform: (!isWinnerPhase && rightIsLoser) ? `translate(${shakeOffset.x}px,${shakeOffset.y}px)` : undefined,
          }}>
            <AvatarImg no={rightNo} name={rightName} side="right" />
            <div className="absolute inset-y-0 left-0 w-1/2" style={{ background: bgShadowRight }} />
            <div className="absolute inset-x-0 bottom-0 h-32" style={{ background: "linear-gradient(to top,rgba(5,0,16,0.9),transparent)" }} />
          </div>
          {rightIsLoser && !isWinnerPhase && (
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "linear-gradient(225deg, rgba(80,0,0,0.5), rgba(0,0,0,0.6))",
              animation: "flashRedDark 0.1s ease-in-out infinite alternate", zIndex: 8, mixBlendMode: "multiply"
            }} />
          )}
          <div className="absolute bottom-8 right-8 text-right" style={{ zIndex: 9, animation: "nameSlideRight 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both" }}>
            <div className="text-xs font-serif tracking-widest mb-1" style={{ color: p1IsWinner ? "rgba(100,0,0,0.8)" : "rgba(255,215,0,0.6)" }}>
              #{rightNo}
            </div>
            <div className="font-black text-white font-serif leading-tight tracking-wider"
              style={{ fontSize: "clamp(1.4rem,2.5vw,2.2rem)",
                textShadow: p1IsWinner ? "0 0 10px rgba(255,0,0,0.6), 2px 2px 5px rgba(0,0,0,1)" : "0 0 10px rgba(255,215,0,0.6), 2px 2px 5px rgba(0,0,0,1)" }}>
              {rightName}
            </div>
          </div>
        </div>

        {/* ── WINNER AVATAR — fixed full screen layer ── */}
        {isWinnerPhase && (
          <div className="absolute pointer-events-none" style={{
            zIndex: 5,
            top: 0, left: winnerExpanded ? 0 : (winnerSideStr === "left" ? 0 : "50%"),
            width: winnerExpanded ? "100%" : "50%", bottom: 0,
            transition: "left 1.2s cubic-bezier(0.22,1,0.36,1), width 1.2s cubic-bezier(0.22,1,0.36,1)",
          }}>
            <AvatarImg no={winnerNo_} name={winnerName_} side={winnerSideStr} />
            <div className="absolute inset-0" style={{
              background: winnerSideStr === "left"
                ? "linear-gradient(to right, rgba(5,0,16,0) 60%, rgba(5,0,16,0.6))"
                : "linear-gradient(to left, rgba(5,0,16,0) 60%, rgba(5,0,16,0.6))",
              transition: "opacity 1s", opacity: winnerExpanded ? 1 : 0,
            }} />
            <div className="absolute inset-x-0 bottom-0 h-48"
              style={{ background: "linear-gradient(to top,rgba(5,0,16,0.9),transparent)" }} />
            {/* Lớp mạ vàng nhẹ lên người thắng */}
            <div className="absolute inset-0" style={{
              background: "radial-gradient(ellipse at center, rgba(255,200,0,0.15) 0%, transparent 60%)",
              mixBlendMode: "screen",
            }} />
          </div>
        )}

        {/* ── Magma divider (attack phase) ── */}
        {!isWinnerPhase && (
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }}>
            <div className="absolute inset-y-0" style={{
              left: "calc(50% - 2px)", width: 4,
              background: "linear-gradient(to bottom, transparent, rgba(255,165,0,0.9) 30%, rgba(255,215,0,1) 50%, rgba(255,60,0,0.9) 70%, transparent)",
              transform: "skewX(-10deg)",
              boxShadow: "0 0 20px 5px rgba(255,100,0,0.5), 0 0 40px 10px rgba(255,215,0,0.3)",
            }} />
          </div>
        )}

        {/* ── WINNER text ── */}
        {winnerVisible && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none pb-20" style={{ zIndex: 20 }}>
            <div className="flex flex-col items-center gap-2" style={{ animation: "winnerDrop 0.8s cubic-bezier(0.22,1,0.36,1) both" }}>
              <WinnerText pulsing={pulsing} />
              <div className="font-black text-white font-serif tracking-widest mt-2"
                style={{
                  fontSize: "clamp(1.6rem, 3.5vw, 3rem)",
                  textShadow: "0 0 15px rgba(255,215,0,0.8), 2px 2px 10px rgba(0,0,0,1)",
                  animation: "nameSlideLeft 0.5s cubic-bezier(0.22,1,0.36,1) 0.3s both",
                }}>
                {winnerName}
              </div>
              <div className="h-0.5 mt-2 rounded-full" style={{
                width: "min(400px, 60vw)",
                background: "linear-gradient(to right, transparent, #ffd700, #ffaa00, #ffd700, transparent)",
                boxShadow: "0 0 15px rgba(255,215,0,0.8)",
              }} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
