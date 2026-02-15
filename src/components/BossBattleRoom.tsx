import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { CharacterStats } from "../types/character";
import { playTickSound, playDefaultWinSound } from "../utils/audio";
import { EffectRegistry } from "../effects/registry";
import type { EffectSourceBreakdown } from "../effects/resolver";
import StatModifiersTable from "./StatModifiersTable";

// Types
interface BossStats {
  str: number | null;
  spd: number | null;
  dur: number | null;
  iq: number | null;
  biq: number | null;
  ma: number | null;
}

// Rule effect types for boss battles
interface RuleEffect {
  type: string;
  target: "boss" | "team" | "both";
  description: string;
  threshold?: number;
  bonusPerStat?: number;
  stat?: string;
  race?: string;
  races?: string[];
  bonus?: number;
  bonusPoints?: number;
  points?: number;
  pointsToWin?: number;
  chance?: number;
  calculation?: string;
  roundInterval?: number;
  freezeCount?: number;
  immuneRaces?: string[];
  streakCount?: number;
  penaltyStats?: number;
  minimum?: number;
  phases?: number;
  totalRounds?: number;
  bonusPerRace?: number;
  maxBonus?: number;
  countScope?: string;
  winsRequired?: number;
  membersToRemove?: number;
  wheelSize?: number;
  outcomes?: Array<{
    range: [number, number];
    effect: string;
    value?: number;
    description: string;
    startingPoints?: number;
    gear?: string;
    count?: number;
  }>;
  bonusPerAbsorb?: number;
  absorbedCount?: number;
  totalBonus?: number;
  distribution?: string;
  roundTrigger?: number;
  conditions?: Array<{
    teamPoints: string;
    effects: string;
  }>;
  condition?: string;
  effects?: string[];
  gear?: string;
  music?: string;
  penalty?: number;
  rounds?: number;
}

interface Boss {
  id: number;
  name: string;
  stats: BossStats;
  rules?: string[];
  ruleEffects?: RuleEffect[];
  reward: string;
  punishment: string;
}

interface PlayerData {
  no: number;
  name: string;
  username: string;
  stats: CharacterStats;
  baseStats?: CharacterStats;
  statModifiers?: {
    stat: string;
    value: number;
    isBase: boolean;
    source: string;
  }[];
  team?: number;
  quirks?: string[];
  race?: string;
  subRace?: string;
  powers?: string[];
  gear?: string[];
  weapons?: string[];
  archetypes?: string[];
  pveOnlyFeatures?: string[];
  effectBreakdown?: EffectSourceBreakdown[];
}

interface TeamMemberJson {
  name: string;
  username: string;
}

interface BattleView {
  teamId: number;
  boss: Boss | null;
  members: TeamMemberJson[];
  playerData: PlayerData[];
}

// Stat keys for battle rounds
const STAT_KEYS: (keyof BossStats)[] = ["str", "spd", "dur", "iq", "biq", "ma"];
const STAT_LABELS: Record<string, string> = {
  str: "STR",
  spd: "SPD",
  dur: "DUR",
  iq: "IQ",
  biq: "BIQ",
  ma: "MA",
};

const STAT_FULL_LABELS: Record<string, string> = {
  str: "Strength",
  spd: "Speed",
  dur: "Durability",
  iq: "IQ",
  biq: "Battle IQ",
  ma: "Martial Arts",
};

interface RoundResult {
  stat: keyof BossStats;
  bossValue: number;
  teamValue: number;
  winner: "boss" | "team" | "tie";
  spinAngle: number;
  blocked?: boolean;
  bossBonusPoints?: number;
  bonusPoints?: number;
  wheelRotation: number;
}

interface FrozenPlayer {
  playerNo: number;
  name: string;
  frozenAtRound: number;
}

interface HypnotizedPlayer {
  playerNo: number;
  name: string;
  stats: CharacterStats;
}

interface SeasonRaceCounts {
  angel: number;
  god: number;
  total: number;
}

interface BossBattleRoomProps {
  battle: BattleView;
  onClose: () => void;
  seasonRaceCounts?: SeasonRaceCounts;
}

// PvE Wheel Component - uses same logic as WheelCanvas
// Pointer at top (270°), rotation stored as degrees, winner determined by angle math
const PvEWheel = ({
  bossWeight,
  teamWeight,
  rotation,
  isSpinning,
}: {
  bossWeight: number;
  teamWeight: number;
  rotation: number;
  isSpinning: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const total = bossWeight + teamWeight;
    if (total === 0) {
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const bossAngle = (bossWeight / total) * Math.PI * 2;
    const teamAngle = (teamWeight / total) * Math.PI * 2;

    // Draw wheel rotated
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    // Boss slice (red) - starts at angle 0
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, 0, bossAngle);
    ctx.closePath();
    ctx.fill();

    // Team slice (green)
    ctx.fillStyle = "#16a34a";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, bossAngle, bossAngle + teamAngle);
    ctx.closePath();
    ctx.fill();

    // Borders between slices
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + radius * Math.cos(bossAngle),
      centerY + radius * Math.sin(bossAngle),
    );
    ctx.stroke();

    // Outer circle
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Labels
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#000000";
    ctx.shadowBlur = 4;

    const labelRadius = radius * 0.6;
    const bossLabelAngle = bossAngle / 2;
    ctx.fillText(
      "BOSS",
      centerX + labelRadius * Math.cos(bossLabelAngle),
      centerY + labelRadius * Math.sin(bossLabelAngle),
    );

    const teamLabelAngle = bossAngle + teamAngle / 2;
    ctx.fillText(
      "TEAM",
      centerX + labelRadius * Math.cos(teamLabelAngle),
      centerY + labelRadius * Math.sin(teamLabelAngle),
    );
    ctx.shadowBlur = 0;

    ctx.restore();

    // Center circle (outside rotation)
    ctx.fillStyle = "#1f2937";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [bossWeight, teamWeight, rotation]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className={`${isSpinning ? "animate-pulse" : ""}`}
      />
      {/* Pointer at top (270° / 12 o'clock), pointing DOWN into the wheel */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{ zIndex: 10 }}
      >
        <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
      </div>
    </div>
  );
};

// Determine which slice the pointer lands on (same logic as WheelCanvas)
// Pointer is at 270° (top). Wheel items: boss slice (0 to bossAngleDeg), team slice (bossAngleDeg to 360)
function getPvEWheelWinner(
  rotation: number,
  bossWeight: number,
  teamWeight: number,
): "boss" | "team" {
  const total = bossWeight + teamWeight;
  if (total === 0) return "tie" as "boss"; // fallback
  const bossAngleDeg = (bossWeight / total) * 360;
  // Pointer at 270° (top). The angle on the wheel the pointer points to:
  const pointerAngle = 270;
  const adjustedAngle = (pointerAngle - (rotation % 360) + 360) % 360;
  // Boss slice: 0 to bossAngleDeg, Team slice: bossAngleDeg to 360
  return adjustedAngle < bossAngleDeg ? "boss" : "team";
}

// Player Selection Wheel - multi-slice wheel for selecting players
interface PlayerWheelConfig {
  players: PlayerData[];
  targetPlayerNo: number; // pre-determined winner
  effectType: "freeze" | "isekai" | "vante" | "hypnotize";
  onComplete: (player: PlayerData) => void;
  autoSpin?: boolean; // if false, show button to spin manually
}

const PlayerSelectionWheel = ({ config }: { config: PlayerWheelConfig }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [finished, setFinished] = useState(false);
  const rotationRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  const {
    players,
    targetPlayerNo,
    effectType,
    onComplete,
    autoSpin = true,
  } = config;

  const effectLabels: Record<string, string> = {
    freeze: "Đóng băng",
    isekai: "Isekai",
    vante: "Văn Tế",
    hypnotize: "Thôi miên",
  };

  const effectEmojis: Record<string, string> = {
    freeze: "❄️",
    isekai: "💀",
    vante: "📜",
    hypnotize: "🌀",
  };

  const colors = [
    "#dc2626",
    "#2563eb",
    "#16a34a",
    "#d97706",
    "#9333ea",
    "#0891b2",
    "#e11d48",
    "#4f46e5",
    "#059669",
    "#c026d3",
    "#ea580c",
    "#0d9488",
    "#7c3aed",
    "#db2777",
    "#2dd4bf",
    "#fbbf24",
  ];

  const drawWheel = useCallback(
    (currentRotation: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 10;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (players.length === 0) return;

      const sliceAngle = (Math.PI * 2) / players.length;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((currentRotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);

      players.forEach((player, i) => {
        const startAngle = i * sliceAngle;
        const endAngle = (i + 1) * sliceAngle;

        // Draw slice
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();

        // Border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + radius * Math.cos(startAngle),
          centerY + radius * Math.sin(startAngle),
        );
        ctx.stroke();

        // Label
        const midAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 0.65;
        ctx.save();
        ctx.translate(
          centerX + labelRadius * Math.cos(midAngle),
          centerY + labelRadius * Math.sin(midAngle),
        );
        ctx.rotate(midAngle);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 3;
        const displayName =
          player.name.length > 10
            ? player.name.substring(0, 10) + "..."
            : player.name;
        ctx.fillText(displayName, 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
      });

      // Outer circle
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      // Center circle
      ctx.fillStyle = "#1f2937";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();
    },
    [players],
  );

  // Initial draw
  useEffect(() => {
    drawWheel(0);
  }, [drawWheel]);

  const startSpin = useCallback(() => {
    if (spinning || finished) return;
    setSpinning(true);

    const targetIndex = players.findIndex((p) => p.no === targetPlayerNo);
    if (targetIndex === -1) {
      onComplete(players[0]);
      return;
    }

    // Calculate target angle so pointer (270°) lands on target slice
    const sliceAngle = 360 / players.length;
    const sliceStart = targetIndex * sliceAngle;

    // Random position within the target slice
    const randomOffset = Math.random() * sliceAngle;
    const targetSlicePosition = sliceStart + randomOffset;

    // Pointer at 270° (top). We need: (270 - finalRotation) % 360 = targetSlicePosition
    const baseTargetRotation = (270 - targetSlicePosition + 360) % 360;
    const extraRotations = 5 + Math.floor(Math.random() * 3);
    const targetRotation = extraRotations * 360 + baseTargetRotation;

    const spinDuration = 4000 + Math.random() * 2000;
    const startTime = Date.now();
    const startRotation = rotationRef.current;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + targetRotation * easeOut;
      rotationRef.current = currentRotation % 360;
      drawWheel(currentRotation % 360);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setFinished(true);
        playDefaultWinSound();
        const selectedPlayer = players[targetIndex];
        // Delay slightly so user can see the result
        setTimeout(() => {
          onComplete(selectedPlayer);
        }, 1500);
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    requestAnimationFrame(animate);
  }, [spinning, finished, players, targetPlayerNo, drawWheel, onComplete]);

  // Auto-start spin (only if autoSpin is true)
  useEffect(() => {
    if (!autoSpin) return;
    const timer = setTimeout(startSpin, 500);
    return () => clearTimeout(timer);
  }, [startSpin, autoSpin]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const targetPlayer = players.find((p) => p.no === targetPlayerNo);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[3000]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gray-900 rounded-2xl p-6 border-2 border-yellow-500/50 shadow-2xl">
        <div className="text-center mb-4">
          <span className="text-2xl">{effectEmojis[effectType]}</span>
          <h3 className="text-xl font-bold text-yellow-400 mt-1">
            {effectLabels[effectType]}
          </h3>
          <p className="text-gray-400 text-sm">Chọn mục tiêu...</p>
        </div>
        <div className="relative">
          <canvas ref={canvasRef} width={300} height={300} />
          {/* Pointer at top */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2"
            style={{ zIndex: 10 }}
          >
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
          </div>
        </div>
        {!autoSpin && !spinning && !finished && (
          <div className="text-center mt-4">
            <button
              onClick={startSpin}
              className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold rounded-lg transition-all text-lg"
            >
              Quay
            </button>
          </div>
        )}
        {finished && targetPlayer && (
          <div className="text-center mt-4 animate-pulse">
            <span className="text-lg font-bold text-white">
              {effectEmojis[effectType]} {targetPlayer.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Binary Wheel Component (50/50 choices like block/not block)
interface BinaryWheelConfig {
  options: [string, string]; // Two options
  colors: [string, string]; // Colors for each option
  weights?: [number, number]; // Visual/probability weights (default [1,1] = 50/50)
  targetIndex: number; // Pre-determined winner (0 or 1)
  title: string;
  emoji: string;
  onComplete: (selectedIndex: number) => void;
  autoSpin?: boolean;
}

const BinaryWheel = ({ config }: { config: BinaryWheelConfig }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [finished, setFinished] = useState(false);
  const rotationRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  const {
    options,
    colors,
    weights = [1, 1],
    targetIndex,
    title,
    emoji,
    onComplete,
    autoSpin = true,
  } = config;

  // Calculate slice angles based on weights
  const totalWeight = weights[0] + weights[1];
  const sliceAngles = [
    (weights[0] / totalWeight) * Math.PI * 2,
    (weights[1] / totalWeight) * Math.PI * 2,
  ];

  const drawWheel = useCallback(
    (currentRotation: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 10;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((currentRotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);

      let currentAngle = 0;
      options.forEach((option, i) => {
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngles[i];

        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + radius * Math.cos(startAngle),
          centerY + radius * Math.sin(startAngle),
        );
        ctx.stroke();

        const midAngle = startAngle + sliceAngles[i] / 2;
        const labelRadius = radius * 0.6;
        ctx.save();
        ctx.translate(
          centerX + labelRadius * Math.cos(midAngle),
          centerY + labelRadius * Math.sin(midAngle),
        );
        ctx.rotate(midAngle);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 3;
        ctx.fillText(option, 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();

        currentAngle = endAngle;
      });

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      ctx.fillStyle = "#1f2937";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();
    },
    [options, colors, sliceAngles],
  );

  useEffect(() => {
    drawWheel(0);
  }, [drawWheel]);

  const startSpin = useCallback(() => {
    if (spinning || finished) return;
    setSpinning(true);

    // Calculate random position within the target slice (with padding to avoid edges)
    const sliceAnglesDeg = sliceAngles.map((a) => (a * 180) / Math.PI);
    let targetSliceStart = 0;
    for (let i = 0; i < targetIndex; i++) {
      targetSliceStart += sliceAnglesDeg[i];
    }
    const sliceSize = sliceAnglesDeg[targetIndex];
    const padding = Math.min(sliceSize * 0.1, 5); // 10% padding or max 5 degrees
    const randomOffset = padding + Math.random() * (sliceSize - 2 * padding);
    const targetAngle = targetSliceStart + randomOffset;
    const baseTargetRotation = (270 - targetAngle + 360) % 360;
    const extraRotations = 5 + Math.floor(Math.random() * 5);
    const targetRotation = extraRotations * 360 + baseTargetRotation;

    const spinDuration = 3000 + Math.random() * 1500;
    const startTime = Date.now();
    const startRotation = rotationRef.current;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + targetRotation * easeOut;
      rotationRef.current = currentRotation % 360;
      drawWheel(currentRotation % 360);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setFinished(true);
        playDefaultWinSound();
        setTimeout(() => {
          onComplete(targetIndex);
        }, 1500);
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    requestAnimationFrame(animate);
  }, [spinning, finished, targetIndex, drawWheel, onComplete]);

  useEffect(() => {
    if (!autoSpin) return;
    const timer = setTimeout(startSpin, 500);
    return () => clearTimeout(timer);
  }, [startSpin, autoSpin]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[3000]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gray-900 rounded-2xl p-6 border-2 border-yellow-500/50 shadow-2xl">
        <div className="text-center mb-4">
          <span className="text-2xl">{emoji}</span>
          <h3 className="text-xl font-bold text-yellow-400 mt-1">{title}</h3>
        </div>
        <div className="relative">
          <canvas ref={canvasRef} width={300} height={300} />
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2"
            style={{ zIndex: 10 }}
          >
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
          </div>
        </div>
        {!autoSpin && !spinning && !finished && (
          <div className="text-center mt-4">
            <button
              onClick={startSpin}
              className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold rounded-lg transition-all text-lg"
            >
              Quay
            </button>
          </div>
        )}
        {finished && (
          <div className="text-center mt-4 animate-pulse">
            <span className="text-lg font-bold text-white">
              {emoji} {options[targetIndex]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// D20 Wheel Config
interface D20WheelConfig {
  wheelSize: number;
  targetNumber: number; // Pre-determined result (1-based)
  title: string;
  emoji: string;
  onComplete: (selectedNumber: number) => void;
  autoSpin?: boolean;
  allowManualInput?: boolean; // For Raphael - let user type a number
}

// D20 Wheel Component - numbered wheel with 20 slices
const D20Wheel = ({ config }: { config: D20WheelConfig }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const rotationRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  const {
    wheelSize,
    targetNumber,
    title,
    emoji,
    onComplete,
    autoSpin = true,
    allowManualInput = false,
  } = config;

  // Generate colors for slices
  const sliceColors = useMemo(() => {
    const colors: string[] = [];
    for (let i = 0; i < wheelSize; i++) {
      const hue = (i * 360) / wheelSize;
      colors.push(`hsl(${hue}, 70%, 45%)`);
    }
    return colors;
  }, [wheelSize]);

  const sliceAngle = (2 * Math.PI) / wheelSize;

  const drawWheel = useCallback(
    (currentRotation: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 10;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((currentRotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);

      for (let i = 0; i < wheelSize; i++) {
        const startAngle = i * sliceAngle;
        const endAngle = (i + 1) * sliceAngle;

        // Fill slice
        ctx.fillStyle = sliceColors[i];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();

        // Slice border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + radius * Math.cos(startAngle),
          centerY + radius * Math.sin(startAngle),
        );
        ctx.stroke();

        // Number label
        const midAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 0.7;
        ctx.save();
        ctx.translate(
          centerX + labelRadius * Math.cos(midAngle),
          centerY + labelRadius * Math.sin(midAngle),
        );
        ctx.rotate(midAngle + Math.PI / 2);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 3;
        ctx.fillText(String(i + 1), 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Outer border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      // Center circle
      ctx.fillStyle = "#1f2937";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [wheelSize, sliceAngle, sliceColors],
  );

  useEffect(() => {
    if (!allowManualInput) {
      drawWheel(0);
    }
  }, [drawWheel, allowManualInput]);

  const startSpin = useCallback(() => {
    if (spinning || finished) return;
    setSpinning(true);

    // Calculate random position within target slice
    const sliceAngleDeg = 360 / wheelSize;
    const targetSliceStart = (targetNumber - 1) * sliceAngleDeg;
    const padding = Math.min(sliceAngleDeg * 0.15, 3);
    const randomOffset =
      padding + Math.random() * (sliceAngleDeg - 2 * padding);
    const targetAngle = targetSliceStart + randomOffset;
    const baseTargetRotation = (270 - targetAngle + 360) % 360;
    const extraRotations = 6 + Math.floor(Math.random() * 5);
    const targetRotation = extraRotations * 360 + baseTargetRotation;

    const spinDuration = 4000 + Math.random() * 2000;
    const startTime = Date.now();
    const startRotation = rotationRef.current;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + targetRotation * easeOut;
      rotationRef.current = currentRotation % 360;
      drawWheel(currentRotation % 360);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setFinished(true);
        playDefaultWinSound();
        setTimeout(() => {
          onComplete(targetNumber);
        }, 1500);
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    requestAnimationFrame(animate);
  }, [spinning, finished, targetNumber, wheelSize, drawWheel, onComplete]);

  useEffect(() => {
    if (!autoSpin || allowManualInput) return;
    const timer = setTimeout(startSpin, 500);
    return () => clearTimeout(timer);
  }, [startSpin, autoSpin, allowManualInput]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleManualSubmit = () => {
    const num = parseInt(manualValue);
    if (num >= 1 && num <= wheelSize) {
      setFinished(true);
      playDefaultWinSound();
      setTimeout(() => {
        onComplete(num);
      }, 500);
    }
  };

  // Manual input mode (Raphael)
  if (allowManualInput) {
    return (
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-[3000]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-900 rounded-2xl p-8 border-2 border-purple-500/50 shadow-2xl min-w-[350px]">
          <div className="text-center mb-6">
            <span className="text-3xl">{emoji}</span>
            <h3 className="text-xl font-bold text-purple-400 mt-2">{title}</h3>
            <p className="text-gray-400 text-sm mt-1">
              Nhập số từ 1 đến {wheelSize}
            </p>
          </div>
          {!finished ? (
            <div className="flex flex-col items-center gap-4">
              <input
                type="number"
                min={1}
                max={wheelSize}
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                className="w-24 text-center text-3xl font-bold bg-gray-800 border-2 border-purple-500 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-purple-400"
                autoFocus
              />
              <button
                onClick={handleManualSubmit}
                disabled={
                  !manualValue ||
                  parseInt(manualValue) < 1 ||
                  parseInt(manualValue) > wheelSize
                }
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all text-lg"
              >
                Xác nhận
              </button>
            </div>
          ) : (
            <div className="text-center animate-pulse">
              <span className="text-3xl font-bold text-yellow-400">
                {emoji} Số {manualValue}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Spin wheel mode (Elder Brain)
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[3000]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gray-900 rounded-2xl p-6 border-2 border-yellow-500/50 shadow-2xl">
        <div className="text-center mb-4">
          <span className="text-2xl">{emoji}</span>
          <h3 className="text-xl font-bold text-yellow-400 mt-1">{title}</h3>
        </div>
        <div className="relative">
          <canvas ref={canvasRef} width={350} height={350} />
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2"
            style={{ zIndex: 10 }}
          >
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
          </div>
        </div>
        {!autoSpin && !spinning && !finished && (
          <div className="text-center mt-4">
            <button
              onClick={startSpin}
              className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold rounded-lg transition-all text-lg"
            >
              Quay
            </button>
          </div>
        )}
        {finished && (
          <div className="text-center mt-4 animate-pulse">
            <span className="text-2xl font-bold text-yellow-400">
              {emoji} Số {targetNumber}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Player Card Component
const PlayerCard = ({
  player,
  isDisabled,
  onToggleDisable,
  isFrozen,
  isRemoved,
  isHypnotized,
  isIsekai,
  isSelected,
  onSelect,
}: {
  player: PlayerData;
  isDisabled: boolean;
  onToggleDisable: () => void;
  isFrozen: boolean;
  isRemoved: boolean;
  isHypnotized: boolean;
  isIsekai: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}) => {
  // const [showDetail, setShowDetail] = useState(false);
  const isInactive =
    isDisabled || isFrozen || isRemoved || isHypnotized || isIsekai;
  const totalStats =
    player.stats.str +
    player.stats.spd +
    player.stats.dur +
    player.stats.iq +
    player.stats.biq +
    player.stats.ma;

  // Group stat modifiers by source for detail view
  // const statBreakdown = useMemo(() => {
  //   if (!player.statModifiers || !player.baseStats) return null;
  //   const statNameMap: Record<string, keyof CharacterStats> = {
  //     strength: "str",
  //     speed: "spd",
  //     durability: "dur",
  //     iq: "iq",
  //     biq: "biq",
  //     ma: "ma",
  //   };
  //   // Group by source
  //   const sourceMap = new Map<string, Record<keyof CharacterStats, number>>();
  //   player.statModifiers.forEach((m) => {
  //     const mapped = statNameMap[m.stat];
  //     if (!mapped) return;
  //     if (!sourceMap.has(m.source)) {
  //       sourceMap.set(m.source, {
  //         str: 0,
  //         spd: 0,
  //         dur: 0,
  //         iq: 0,
  //         biq: 0,
  //         ma: 0,
  //       });
  //     }
  //     sourceMap.get(m.source)![mapped] += m.value;
  //   });
  //   return { baseStats: player.baseStats, sources: sourceMap };
  // }, [player.statModifiers, player.baseStats]);

  return (
    <div
      onClick={onSelect}
      className={`bg-gray-800/90 rounded-lg p-2 border-2 transition-all cursor-pointer ${
        isSelected
          ? "border-yellow-400 shadow-lg shadow-yellow-400/20"
          : isInactive
            ? "border-gray-600 opacity-50"
            : "border-teal-500/50 hover:border-teal-400"
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs text-teal-400 font-mono">
              #{player.no}
            </span>
            {isFrozen && <span className="text-xs">❄️</span>}
            {isRemoved && <span className="text-xs">⚔️</span>}
            {isHypnotized && <span className="text-xs">🌀</span>}
            {isIsekai && <span className="text-xs">💀</span>}
            {isDisabled &&
              !isFrozen &&
              !isRemoved &&
              !isHypnotized &&
              !isIsekai && <span className="text-xs text-red-400">OFF</span>}
          </div>
          <div
            className="text-white font-medium text-sm truncate"
            title={player.name}
          >
            {player.name}
          </div>
          <div className="text-gray-400 text-xs truncate">
            @{player.username}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-yellow-400">{totalStats}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-1 text-center text-xs">
        {STAT_KEYS.map((stat) => (
          <div key={stat} className="bg-gray-700/50 rounded px-1 py-0.5">
            <div className="text-gray-400 font-medium">{STAT_LABELS[stat]}</div>
            <div className="text-white font-bold">{player.stats[stat]}</div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1 mt-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleDisable();
          }}
          className={`flex-1 text-[10px] py-0.5 rounded transition-colors ${
            isDisabled
              ? "bg-green-600/30 text-green-400 hover:bg-green-600/50"
              : "bg-red-600/30 text-red-400 hover:bg-red-600/50"
          }`}
        >
          {isDisabled ? "Enable" : "Disable"}
        </button>
      </div>
    </div>
  );
};

export const BossBattleRoom = ({
  battle,
  onClose,
  seasonRaceCounts,
}: BossBattleRoomProps) => {
  // Disable body scroll when PvE battle room is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const [battleState, setBattleState] = useState<
    "idle" | "preBattle" | "fighting" | "finished"
  >("idle");
  const [currentRound, setCurrentRound] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  // Selected player for effects breakdown
  const [selectedPlayerNo, setSelectedPlayerNo] = useState<number | null>(null);

  // Manually disabled players
  const [manuallyDisabledPlayers, setManuallyDisabledPlayers] = useState<
    number[]
  >([]);

  // Dynamic bonuses
  const [dynamicBossBonus, setDynamicBossBonus] = useState(0);
  const [dynamicBossStatChanges, setDynamicBossStatChanges] = useState<
    Partial<BossStats>
  >({});

  // Pontiff Sulyvahn stat multipliers (for permanent doubling)
  const [pontiffMultipliers, setPontiffMultipliers] = useState<
    Record<string, number>
  >({});

  // Freeze mechanics
  const [frozenPlayers, setFrozenPlayers] = useState<FrozenPlayer[]>([]);
  const [hypnotizedPlayer, setHypnotizedPlayer] =
    useState<HypnotizedPlayer | null>(null);
  const [showHypnotizeDialog, setShowHypnotizeDialog] = useState(false);
  const hypnotizeResolveRef = useRef<((player: PlayerData) => void) | null>(
    null,
  );
  const [removedPlayers, setRemovedPlayers] = useState<number[]>([]);

  // Pre-battle wheel
  const [preBattleWheelResult, setPreBattleWheelResult] = useState<{
    number: number;
    effect: string;
    description: string;
    startingPoints?: number;
  } | null>(null);
  const [showPreBattleWheel, setShowPreBattleWheel] = useState(false);
  const [preBattleWheelSpinning, setPreBattleWheelSpinning] = useState(false);

  // Multi-phase
  const [currentPhase, setCurrentPhase] = useState(1);
  const [phaseScores, setPhaseScores] = useState<
    { boss: number; team: number }[]
  >([]);

  // Isekai'd players
  const [isekaidPlayers, setIsekaidPlayers] = useState<number[]>([]);
  const [vantePlayers, setVantePlayers] = useState<number[]>([]);

  // Capra Demon (boss 16) conditional effects after 4 rounds
  const [capraEffect, setCapraEffect] = useState<{
    biqBonus: number;
    iqBonus: number;
    replayIQ: boolean;
    biqBO3: boolean;
    maBO3: boolean;
    biqLossPenalty: number;
    biqWinBonusTeamScore: boolean;
  } | null>(null);
  const [bo3Round, _setBo3Round] = useState<{
    stat: keyof BossStats;
    bossWins: number;
    teamWins: number;
  } | null>(null);
  const bo3RoundRef = useRef(bo3Round);
  const setBo3Round = useCallback((val: typeof bo3Round) => {
    bo3RoundRef.current = val;
    _setBo3Round(val);
  }, []);

  // Auto fight cancellation
  const autoFightCancelledRef = useRef(false);
  const handleClose = useCallback(() => {
    autoFightCancelledRef.current = true;
    onClose();
  }, [onClose]);

  // Win streak
  const [winStreak, setWinStreak] = useState(0);
  const [retryBattle, setRetryBattle] = useState(false);
  const [retryPenalty, setRetryPenalty] = useState(0);

  // Total Stat Battle mode - dynamic totals with loser bonus
  const [totalStatBossTotalBonus, setTotalStatBossTotalBonus] = useState(0);
  const [totalStatTeamTotalBonus, setTotalStatTeamTotalBonus] = useState(0);
  // Base weights for Total Stat Battle (set once from round 1, used for all rounds)
  const [totalStatBaseWeights, setTotalStatBaseWeights] = useState<{
    boss: number;
    team: number;
  } | null>(null);

  const [battleMessages, setBattleMessages] = useState<string[]>([]);

  // Refs to track latest state for async closures (avoid stale closure in auto-battle)
  const frozenPlayersRef = useRef<FrozenPlayer[]>([]);
  const manuallyDisabledPlayersRef = useRef<number[]>([]);
  const removedPlayersRef = useRef<number[]>([]);
  const isekaidPlayersRef = useRef<number[]>([]);

  // Keep refs in sync with state
  useEffect(() => {
    frozenPlayersRef.current = frozenPlayers;
  }, [frozenPlayers]);
  useEffect(() => {
    manuallyDisabledPlayersRef.current = manuallyDisabledPlayers;
  }, [manuallyDisabledPlayers]);
  useEffect(() => {
    removedPlayersRef.current = removedPlayers;
  }, [removedPlayers]);
  useEffect(() => {
    isekaidPlayersRef.current = isekaidPlayers;
  }, [isekaidPlayers]);
  const vantePlayersRef = useRef<number[]>([]);
  useEffect(() => {
    vantePlayersRef.current = vantePlayers;
  }, [vantePlayers]);

  // Player selection wheel state
  const [playerWheelConfig, setPlayerWheelConfig] =
    useState<PlayerWheelConfig | null>(null);
  const playerWheelKeyRef = useRef(0);
  const playerWheelResolveRef = useRef<((player: PlayerData) => void) | null>(
    null,
  );

  // Binary wheel state (for 50/50 decisions like Radagon block)
  const [binaryWheelConfig, setBinaryWheelConfig] =
    useState<BinaryWheelConfig | null>(null);
  const binaryWheelKeyRef = useRef(0);
  const binaryWheelResolveRef = useRef<((index: number) => void) | null>(null);

  // D20 wheel state (for pre-battle number wheel)
  const [d20WheelConfig, setD20WheelConfig] = useState<D20WheelConfig | null>(
    null,
  );
  const d20WheelKeyRef = useRef(0);
  const d20WheelResolveRef = useRef<((num: number) => void) | null>(null);

  // Tie-break result
  const [tieBreakResult, setTieBreakResult] = useState<"team" | "boss" | null>(
    null,
  );

  const boss = battle.boss!;

  // Pontiff Sulyvahn - apply permanent doubling at specific rounds
  useEffect(() => {
    if (boss.id === 8) {
      if (currentRound === 2) {
        setPontiffMultipliers((prev) => ({ ...prev, dur: 2 }));
      } else if (currentRound === 5) {
        setPontiffMultipliers((prev) => ({ ...prev, ma: 2 }));
      }
    }
  }, [currentRound, boss.id]);

  // Boss image extensions mapping
  const bossImageExtensions: Record<number, string> = {
    1: "jfif",
    2: "png",
    3: "png",
    4: "jpg",
    5: "png",
    6: "jpeg",
    7: "jpg",
    8: "png",
    9: "jpg",
    10: "jpg",
    11: "jpg",
    12: "png",
    13: "jpg",
    14: "jpg",
    15: "jpg",
    16: "jpeg",
    17: "jpg",
    18: "png",
    19: "jpg",
    20: "jpg",
    21: "jpg",
    22: "jpg", // Aatrox: 22-1.jpg (phase 1), 22-2.png (phase 2)
    23: "jpg",
    24: "jpg",
    25: "jpg",
    27: "gif",
    28: "gif",
    29: "png",
    30: "png",
    31: "jpg",
    32: "png",
  };

  // Boss image path - use correct extension for each boss
  // Aatrox (id 22) has separate images per phase: 22-1.jpg, 22-2.png
  const bossImagePath =
    boss.id === 22
      ? `/assets/BossAsset/22-${currentPhase}.${currentPhase === 1 ? "jpg" : "png"}`
      : `/assets/BossAsset/${boss.id}.${bossImageExtensions[boss.id] || "png"}`;

  // Check for "Let Me Solo Her" quirk
  const soloHerInfo = useMemo(() => {
    const playersWithQuirk = battle.playerData.filter((player) =>
      player.quirks?.some((q) => q.toLowerCase().includes("let me solo her")),
    );

    if (playersWithQuirk.length === 1) {
      return {
        active: true,
        soloPlayer: playersWithQuirk[0],
        multiplier: 8,
      };
    }

    return { active: false, soloPlayer: null, multiplier: 1 };
  }, [battle.playerData]);

  // Get active players (not frozen, not removed, not isekai'd, not manually disabled)
  const activePlayers = useMemo(() => {
    return battle.playerData.filter(
      (p) =>
        !frozenPlayers.some((f) => f.playerNo === p.no) &&
        !removedPlayers.includes(p.no) &&
        !isekaidPlayers.includes(p.no) &&
        !manuallyDisabledPlayers.includes(p.no) &&
        (!hypnotizedPlayer || hypnotizedPlayer.playerNo !== p.no),
    );
  }, [
    battle.playerData,
    frozenPlayers,
    removedPlayers,
    isekaidPlayers,
    hypnotizedPlayer,
    manuallyDisabledPlayers,
  ]);

  // Toggle manual disable
  const togglePlayerDisable = useCallback((playerNo: number) => {
    setManuallyDisabledPlayers((prev) =>
      prev.includes(playerNo)
        ? prev.filter((no) => no !== playerNo)
        : [...prev, playerNo],
    );
  }, []);

  // Show player selection wheel and return promise of selected player
  const spinPlayerWheel = useCallback(
    (
      candidatePlayers: PlayerData[],
      effectType: "freeze" | "isekai" | "vante" | "hypnotize",
      autoSpin: boolean = true,
    ): Promise<PlayerData> => {
      return new Promise((resolve) => {
        if (candidatePlayers.length === 0) {
          return;
        }
        if (candidatePlayers.length === 1) {
          // Only one candidate, skip wheel
          resolve(candidatePlayers[0]);
          return;
        }
        const randomIdx = Math.floor(Math.random() * candidatePlayers.length);
        const targetPlayer = candidatePlayers[randomIdx];
        playerWheelResolveRef.current = resolve;
        playerWheelKeyRef.current += 1;
        setPlayerWheelConfig({
          players: candidatePlayers,
          targetPlayerNo: targetPlayer.no,
          effectType,
          autoSpin,
          onComplete: (player: PlayerData) => {
            setPlayerWheelConfig(null);
            playerWheelResolveRef.current = null;
            resolve(player);
          },
        });
      });
    },
    [],
  );

  // Show binary wheel (50/50) and return promise of selected index
  const spinBinaryWheel = useCallback(
    (
      options: [string, string],
      wheelColors: [string, string],
      title: string,
      emoji: string,
      autoSpin: boolean = true,
      chance: number = 0.5,
      weights?: [number, number],
    ): Promise<number> => {
      return new Promise((resolve) => {
        // const targetIndex = Math.random() < chance ? 0 : 1;
        const targetIndex = weights
          ? weightedPick(weights)
          : Math.random() < chance
            ? 0
            : 1;
        binaryWheelResolveRef.current = resolve;
        binaryWheelKeyRef.current += 1;
        setBinaryWheelConfig({
          options,
          colors: wheelColors,
          weights,
          targetIndex,
          title,
          emoji,
          autoSpin,
          onComplete: (selectedIndex: number) => {
            setBinaryWheelConfig(null);
            binaryWheelResolveRef.current = null;
            resolve(selectedIndex);
          },
        });
      });
    },
    [],
  );
  // set weight for each option and pick based on weight
  function weightedPick([w0, w1]: [number, number]) {
    const total = w0 + w1;
    const r = Math.random() * total;
    return r < w0 ? 0 : 1;
  }
  const spinD20Wheel = useCallback(
    (
      wheelSize: number,
      title: string,
      emoji: string,
      autoSpin: boolean = true,
      allowManualInput: boolean = false,
    ): Promise<number> => {
      return new Promise((resolve) => {
        const targetNumber = Math.floor(Math.random() * wheelSize) + 1;
        d20WheelResolveRef.current = resolve;
        d20WheelKeyRef.current += 1;
        setD20WheelConfig({
          wheelSize,
          targetNumber,
          title,
          emoji,
          autoSpin,
          allowManualInput,
          onComplete: (selectedNumber: number) => {
            setD20WheelConfig(null);
            d20WheelResolveRef.current = null;
            resolve(selectedNumber);
          },
        });
      });
    },
    [],
  );

  // Check for boss-specific rule conditions
  const bossRuleChecks = useMemo(() => {
    const checks: Record<string, boolean | number | number[] | string[]> = {};

    if (boss.id === 4) {
      let adjacent67Count = 0;
      battle.playerData.forEach((player) => {
        const stats = [
          player.stats.str,
          player.stats.spd,
          player.stats.dur,
          player.stats.iq,
          player.stats.biq,
          player.stats.ma,
        ];
        for (let i = 0; i < stats.length - 1; i++) {
          if (
            (stats[i] === 6 && stats[i + 1] === 7) ||
            (stats[i] === 7 && stats[i + 1] === 6)
          ) {
            adjacent67Count++;
          }
        }
      });
      checks.adjacent67Count = adjacent67Count;

      const statTotals = { str: 0, spd: 0, dur: 0, iq: 0, biq: 0, ma: 0 };
      battle.playerData.forEach((player) => {
        statTotals.str += player.stats.str || 0;
        statTotals.spd += player.stats.spd || 0;
        statTotals.dur += player.stats.dur || 0;
        statTotals.iq += player.stats.iq || 0;
        statTotals.biq += player.stats.biq || 0;
        statTotals.ma += player.stats.ma || 0;
      });
      checks.hasStatOver67 = Object.values(statTotals).some((v) => v > 67);
    }

    if (boss.id === 6) {
      const immuneRaces = ["dragon", "deity", "cosmic entity", "eldritch"];
      const immunePlayers = battle.playerData.filter((p) =>
        immuneRaces.includes(p.race?.toLowerCase() || ""),
      );
      checks.freezeImmunePlayers = immunePlayers.map((p) => p.no);
    }

    if (boss.id === 15) {
      checks.hasPvEOnlyFeatures = battle.playerData.some(
        (p) => p.pveOnlyFeatures && p.pveOnlyFeatures.length > 0,
      );
    }

    if (boss.id === 23) {
      let pveOnlyCount = 0;
      battle.playerData.forEach((p) => {
        pveOnlyCount += p.pveOnlyFeatures?.length || 0;
      });
      checks.pveOnlyCount = pveOnlyCount;
    }

    if (boss.id === 27) {
      checks.hasDeafPlayer = battle.playerData.some((p) =>
        p.quirks?.some((q) => q.toLowerCase().includes("deaf")),
      );
    }

    if (boss.id === 30) {
      if (seasonRaceCounts) {
        checks.angelGodCount = Math.min(seasonRaceCounts.total, 10);
      } else {
        const angelGodRaces = ["angel", "god"];
        const count = battle.playerData.filter((p) =>
          angelGodRaces.includes(p.race?.toLowerCase() || ""),
        ).length;
        checks.angelGodCount = Math.min(count, 10);
      }
    }

    return checks;
  }, [boss.id, battle.playerData, seasonRaceCounts]);

  // Generic rule engine
  const ruleBonus = useMemo(() => {
    let bossBonus = 0;
    let teamBonus = 0;
    const details: string[] = [];

    if (!boss.ruleEffects || boss.ruleEffects.length === 0) {
      return { bossBonus, teamBonus, details };
    }

    boss.ruleEffects.forEach((effect) => {
      switch (effect.type) {
        case "statAboveThreshold": {
          if (effect.bonusPerStat) {
            const threshold = effect.threshold || 0;
            const bonusPerStat = effect.bonusPerStat;
            let count = 0;

            activePlayers.forEach((player) => {
              const stats = player.stats;
              if ((stats.str || 0) > threshold) count++;
              if ((stats.spd || 0) > threshold) count++;
              if ((stats.dur || 0) > threshold) count++;
              if ((stats.iq || 0) > threshold) count++;
              if ((stats.biq || 0) > threshold) count++;
              if ((stats.ma || 0) > threshold) count++;
            });

            if (count > 0) {
              const bonus = count * bonusPerStat;
              if (effect.target === "boss") {
                bossBonus += bonus;
              } else {
                teamBonus += bonus;
              }
              const desc = effect.description
                .replace("{bonus}", String(bonus))
                .replace("{count}", String(count));
              details.push(desc);
            }
          }
          break;
        }

        case "hasRace": {
          const targetRace = effect.race?.toLowerCase();
          const targetRaces = effect.races?.map((r) => r.toLowerCase());

          let hasRace = false;
          if (targetRace) {
            hasRace = activePlayers.some(
              (p) => p.race?.toLowerCase() === targetRace,
            );
          } else if (targetRaces) {
            hasRace = activePlayers.some((p) =>
              targetRaces.includes(p.race?.toLowerCase() || ""),
            );
          }

          if (hasRace && effect.bonus) {
            if (effect.target === "boss") {
              bossBonus += effect.bonus;
            } else {
              teamBonus += effect.bonus;
            }
            details.push(effect.description);
          }
          break;
        }

        case "hasArchetype": {
          const targetArchetype = effect.race?.toLowerCase();
          const hasArch = targetArchetype
            ? activePlayers.some((p) =>
                p.archetypes?.some((a) => a.toLowerCase() === targetArchetype),
              )
            : false;

          if (hasArch && effect.bonus) {
            if (effect.target === "boss") {
              bossBonus += effect.bonus;
            } else {
              teamBonus += effect.bonus;
            }
            details.push(effect.description);
          }
          break;
        }

        case "uniqueRaces": {
          const races = activePlayers
            .map((p) => p.race?.toLowerCase())
            .filter((r) => r);
          const uniqueRaces = new Set(races);
          const allUnique =
            races.length > 0 && uniqueRaces.size === races.length;

          if (allUnique && effect.bonus) {
            if (effect.target === "boss") {
              bossBonus += effect.bonus;
            } else {
              teamBonus += effect.bonus;
            }
            details.push(effect.description);
          }
          break;
        }

        case "adjacent67Pattern": {
          const count = (bossRuleChecks.adjacent67Count as number) || 0;
          if (count > 0 && effect.bonusPoints) {
            details.push(
              `Team ${count * effect.bonusPoints} điểm khởi đầu (${count} cặp 6-7 liền kề)`,
            );
          }
          break;
        }

        case "bossStatBoostPerRace": {
          const count = (bossRuleChecks.angelGodCount as number) || 0;
          if (count > 0 && effect.bonusPerRace) {
            const bonus = count * effect.bonusPerRace;
            bossBonus += bonus;
            details.push(
              `${boss.name} +${bonus} All Stats (${count} Angel/God)`,
            );
          }
          break;
        }

        case "bossStatPenaltyPerPvEOnly": {
          const count = (bossRuleChecks.pveOnlyCount as number) || 0;
          if (count > 0 && effect.penalty) {
            const penalty = count * effect.penalty;
            bossBonus += penalty;
            details.push(
              `${boss.name} ${penalty} All Stats (${count} [PvE Only] Features)`,
            );
          }
          break;
        }

        case "hasCondition": {
          if (effect.condition === "deaf" && bossRuleChecks.hasDeafPlayer) {
            if (effect.bonus) {
              bossBonus += effect.bonus;
              details.push(effect.description);
            }
          }
          break;
        }
      }
    });

    return { bossBonus, teamBonus, details };
  }, [
    boss.ruleEffects,
    boss.id,
    boss.name,
    activePlayers,
    bossRuleChecks,
    hypnotizedPlayer,
  ]);

  // Calculate special rules
  const specialRules = useMemo(() => {
    let bossStartingPoints = 0;
    let teamStartingPoints = 0;
    let teamPointsToWin = 4;
    let bossPointsPerWin = 1;
    let noDoubleWeight = false;
    let bossAlwaysScoresPoints = 0;
    let blockTeamScoreChance = 0;
    let hasPreBattleWheel = false;
    let isMultiPhase = false;
    let totalPhases = 1;
    let isMirrorScoring = false;
    let isTotalStatBattle = false;
    let totalStatBattleRounds = 6;
    let hasCrit = false;
    let hasEvasion = false;
    let disablePvEOnly = false;
    let stealPvEEffects = false;
    const specialDetails: string[] = [];

    if (!boss.ruleEffects || boss.ruleEffects.length === 0) {
      return {
        bossStartingPoints,
        teamStartingPoints,
        teamPointsToWin,
        bossPointsPerWin,
        noDoubleWeight,
        bossAlwaysScoresPoints,
        blockTeamScoreChance,
        specialDetails,
        hasPreBattleWheel,
        isMultiPhase,
        totalPhases,
        isMirrorScoring,
        isTotalStatBattle,
        totalStatBattleRounds,
        hasCrit,
        hasEvasion,
        disablePvEOnly,
      };
    }

    boss.ruleEffects.forEach((effect) => {
      switch (effect.type) {
        case "startingPoints": {
          const pts = effect.points || 0;
          if (effect.target === "boss") {
            bossStartingPoints += pts;
          } else if (effect.target === "team") {
            teamStartingPoints += pts;
          }
          specialDetails.push(effect.description);
          break;
        }

        case "statBelowThreshold": {
          const threshold = effect.threshold || 0;
          const statKey = effect.stat as keyof CharacterStats;
          const bonusPts = effect.bonusPoints || 0;
          let count = 0;

          if (statKey) {
            activePlayers.forEach((player) => {
              const statValue = player.stats[statKey] || 0;
              if (statValue < threshold) count++;
            });
          }

          if (count > 0 && effect.target === "team") {
            teamStartingPoints += count * bonusPts;
          }
          break;
        }

        case "statAboveThreshold": {
          if (effect.bonusPoints !== undefined && effect.stat) {
            const threshold = effect.threshold || 0;
            const statKey = effect.stat as keyof CharacterStats;
            let count = 0;

            activePlayers.forEach((player) => {
              const statValue = player.stats[statKey] || 0;
              if (statValue > threshold) count++;
            });

            if (count > 0 && effect.target === "team") {
              teamStartingPoints += count * effect.bonusPoints;
            }
          }
          break;
        }

        case "hasRace": {
          if (effect.bonusPoints !== undefined) {
            let hasRace = false;

            if (effect.race) {
              hasRace = activePlayers.some(
                (p) => p.race?.toLowerCase() === effect.race?.toLowerCase(),
              );
            } else if (effect.races) {
              hasRace = activePlayers.some((p) =>
                effect.races?.some(
                  (r) => p.race?.toLowerCase() === r.toLowerCase(),
                ),
              );
            }

            if (hasRace && effect.target === "team") {
              teamStartingPoints += effect.bonusPoints;
              specialDetails.push(effect.description);
            }
          }
          break;
        }

        case "adjacent67Pattern": {
          const count = (bossRuleChecks.adjacent67Count as number) || 0;
          if (count > 0 && effect.bonusPoints) {
            teamStartingPoints += count * effect.bonusPoints;
          }
          break;
        }

        case "teamStatOver67": {
          if (bossRuleChecks.hasStatOver67) {
            bossStartingPoints += effect.bonusPoints || 7;
            specialDetails.push("Boss +6/7 điểm (team có stat tổng > 67)");
          }
          break;
        }

        case "customWinCondition": {
          if (effect.pointsToWin) {
            teamPointsToWin = effect.pointsToWin;
            specialDetails.push(effect.description);
          }
          break;
        }

        case "bossPointsPerWin": {
          if (effect.points) {
            bossPointsPerWin = effect.points;
            specialDetails.push(effect.description);
          }
          break;
        }

        case "noDoubleWeight": {
          noDoubleWeight = true;
          specialDetails.push(effect.description);
          break;
        }

        case "bossAlwaysScores": {
          if (effect.points) {
            bossAlwaysScoresPoints = effect.points;
            specialDetails.push(effect.description);
          }
          break;
        }

        case "blockTeamScore": {
          if (effect.chance) {
            blockTeamScoreChance = effect.chance;
            specialDetails.push(effect.description);
          }
          break;
        }

        case "preBattleWheel": {
          hasPreBattleWheel = true;
          specialDetails.push("Quay vòng quay trước trận");
          break;
        }

        case "multiPhase": {
          isMultiPhase = true;
          totalPhases = effect.phases || 2;
          specialDetails.push(effect.description);
          break;
        }

        case "mirrorScoring": {
          isMirrorScoring = true;
          specialDetails.push(effect.description);
          break;
        }

        case "totalStatBattle": {
          isTotalStatBattle = true;
          totalStatBattleRounds = effect.rounds || 7;
          // Vẫn áp dụng x2 cho bên cao hơn, nhưng trọng số cố định từ round 1 cho tất cả rounds
          specialDetails.push(effect.description);
          break;
        }

        case "disablePvEOnly": {
          disablePvEOnly = true;
          specialDetails.push(effect.description);
          break;
        }

        case "bossHasEffect": {
          const effects = (effect.effects as string[]) || [];
          if (effects.includes("Crit")) {
            hasCrit = true;
          }
          if (effects.includes("Evasion")) {
            hasEvasion = true;
          }
          specialDetails.push(effect.description);
          break;
        }

        case "stealWeaponEffects": {
          stealPvEEffects = true;
          specialDetails.push(effect.description);
          break;
        }

        case "disableWeaponEffects": {
          disablePvEOnly = true;
          specialDetails.push(effect.description);
          break;
        }
      }
    });

    if (preBattleWheelResult) {
      if (preBattleWheelResult.effect === "teamStartingPoints") {
        const value = parseInt(
          preBattleWheelResult.description.match(/-?\d+/)?.[0] || "0",
        );
        teamStartingPoints += value;
      }
      if (preBattleWheelResult.startingPoints) {
        teamStartingPoints += preBattleWheelResult.startingPoints;
      }
    }

    // Misty Step Ahead: +1 starting point if any team member has this power
    if (
      !disablePvEOnly &&
      battle.playerData.some((p) =>
        p.powers?.some(
          (pw) => pw.toLowerCase() === "misty step ahead",
        ),
      )
    ) {
      teamStartingPoints += 1;
      specialDetails.push("Team +1 điểm khởi đầu (Misty Step Ahead)");
    }

    const bossStatBoostOnWin =
      boss.ruleEffects.find((e) => e.type === "bossStatBoostOnWin")?.bonus || 0;
    const bossStatBoostOnTeamLoss =
      boss.ruleEffects.find((e) => e.type === "bossStatBoostOnTeamLoss")
        ?.bonus || 0;
    const teamBonusOnStatWin = boss.ruleEffects.find(
      (e) => e.type === "teamBonusOnStatWin",
    );

    return {
      bossStartingPoints,
      teamStartingPoints,
      teamPointsToWin,
      bossPointsPerWin,
      noDoubleWeight,
      bossAlwaysScoresPoints,
      blockTeamScoreChance,
      specialDetails,
      hasPreBattleWheel,
      isMultiPhase,
      totalPhases,
      isMirrorScoring,
      isTotalStatBattle,
      totalStatBattleRounds,
      hasCrit,
      hasEvasion,
      disablePvEOnly,
      stealPvEEffects,
      bossStatBoostOnWin,
      bossStatBoostOnTeamLoss,
      teamBonusOnStatWin: teamBonusOnStatWin
        ? {
            stat: teamBonusOnStatWin.stat,
            bonusPoints: teamBonusOnStatWin.bonusPoints || 0,
          }
        : null,
    };
  }, [boss.ruleEffects, activePlayers, bossRuleChecks, preBattleWheelResult, battle.playerData]);

  // Calculate team total stats
  const teamStats = useMemo(() => {
    const totals: CharacterStats = {
      str: 0,
      spd: 0,
      dur: 0,
      iq: 0,
      biq: 0,
      ma: 0,
    };

    // Check PvE-only penalties (Wereseal, weapon steal) - applied per-player before multiplier
    const hasWereseal =
      !specialRules.disablePvEOnly &&
      activePlayers.some((p) => p.subRace?.toLowerCase() === "wereseal");
    const weresealPenalty = hasWereseal ? 100 : 0;

    // Pre-calculate weapon bonuses to subtract per player (Soul of Cinder steals them)
    const weaponStatNameMap: Record<string, keyof BossStats> = {
      strength: "str",
      speed: "spd",
      durability: "dur",
      iq: "iq",
      biq: "biq",
      ma: "ma",
    };
    const getPlayerWeaponBonuses = (
      player: PlayerData,
    ): Record<keyof BossStats, number> => {
      const bonuses: Record<keyof BossStats, number> = {
        str: 0,
        spd: 0,
        dur: 0,
        iq: 0,
        biq: 0,
        ma: 0,
      };
      if (!specialRules.stealPvEEffects) return bonuses;
      const weapons = player.weapons || [];
      weapons.forEach((weaponName) => {
        const entry = EffectRegistry.get("weapon", weaponName);
        if (!entry) return;
        entry.effects.forEach((eff) => {
          if (
            eff.type === "stat_modifier" &&
            eff.timing === "immediate" &&
            eff.target === "self" &&
            eff.stat &&
            eff.value
          ) {
            if (eff.stat === "all") {
              (Object.keys(bonuses) as (keyof BossStats)[]).forEach((k) => {
                bonuses[k] += eff.value!;
              });
            } else {
              const mapped = weaponStatNameMap[eff.stat];
              if (mapped) bonuses[mapped] += eff.value!;
            }
          }
        });
      });
      return bonuses;
    };

    if (soloHerInfo.active && soloHerInfo.soloPlayer) {
      // Solo Her: penalties applied to player stats BEFORE multiplier
      const soloPlayerIsActive = activePlayers.some(
        (p) => p.no === soloHerInfo.soloPlayer!.no,
      );
      if (soloPlayerIsActive) {
        const player = soloHerInfo.soloPlayer;
        const mult = soloHerInfo.multiplier;
        const wb = getPlayerWeaponBonuses(player);
        totals.str =
          ((player.stats.str || 0) - weresealPenalty - wb.str) * mult;
        totals.spd =
          ((player.stats.spd || 0) - weresealPenalty - wb.spd) * mult;
        totals.dur =
          ((player.stats.dur || 0) - weresealPenalty - wb.dur) * mult;
        totals.iq = ((player.stats.iq || 0) - weresealPenalty - wb.iq) * mult;
        totals.biq =
          ((player.stats.biq || 0) - weresealPenalty - wb.biq) * mult;
        totals.ma = ((player.stats.ma || 0) - weresealPenalty - wb.ma) * mult;
      }
    } else {
      activePlayers.forEach((player) => {
        const wb = getPlayerWeaponBonuses(player);
        totals.str += (player.stats.str || 0) - wb.str;
        totals.spd += (player.stats.spd || 0) - wb.spd;
        totals.dur += (player.stats.dur || 0) - wb.dur;
        totals.iq += (player.stats.iq || 0) - wb.iq;
        totals.biq += (player.stats.biq || 0) - wb.biq;
        totals.ma += (player.stats.ma || 0) - wb.ma;
      });
      // Wereseal: -100 all stats applied once to team total (not per-player)
      if (hasWereseal) {
        totals.str -= weresealPenalty;
        totals.spd -= weresealPenalty;
        totals.dur -= weresealPenalty;
        totals.iq -= weresealPenalty;
        totals.biq -= weresealPenalty;
        totals.ma -= weresealPenalty;
      }
    }

    if (ruleBonus.teamBonus > 0) {
      totals.str += ruleBonus.teamBonus;
      totals.spd += ruleBonus.teamBonus;
      totals.dur += ruleBonus.teamBonus;
      totals.iq += ruleBonus.teamBonus;
      totals.biq += ruleBonus.teamBonus;
      totals.ma += ruleBonus.teamBonus;
    }

    if (preBattleWheelResult?.effect === "teamStats") {
      const value = parseInt(
        preBattleWheelResult.description.match(/-?\d+/)?.[0] || "0",
      );
      totals.str += value;
      totals.spd += value;
      totals.dur += value;
      totals.iq += value;
      totals.biq += value;
      totals.ma += value;
    }
    if (retryPenalty > 0) {
      totals.str -= retryPenalty;
      totals.spd -= retryPenalty;
      totals.dur -= retryPenalty;
      totals.iq -= retryPenalty;
      totals.biq -= retryPenalty;
      totals.ma -= retryPenalty;
    }
    return totals;
  }, [
    activePlayers,
    soloHerInfo,
    ruleBonus.teamBonus,
    preBattleWheelResult,
    retryPenalty,
    specialRules.disablePvEOnly,
    specialRules.stealPvEEffects,
  ]);

  // Calculate boss stats
  const bossStats = useMemo(() => {
    let totalBonus = ruleBonus.bossBonus;

    // Laerys (26): Bonus only applies to remaining rounds AFTER next round
    let laerysBonusByRound: Record<number, number> = {};
    if (boss.id === 26) {
      // Calculate bonus from each team win separately
      // Each win grants 60 points divided by remaining rounds at that time
      // But bonus only applies to rounds AFTER the next one (round + 2 onwards)
      roundResults.forEach((result, idx) => {
        if (result.winner === "team") {
          const remainingRoundsAfterThisWin = 6 - (idx + 1);
          if (remainingRoundsAfterThisWin > 0) {
            laerysBonusByRound[idx] = Math.floor(
              60 / remainingRoundsAfterThisWin,
            );
          }
        }
      });
      // Don't add to totalBonus, will apply separately per stat
    } else {
      totalBonus += dynamicBossBonus;
    }

    if (preBattleWheelResult?.effect === "bossStats") {
      const value = parseInt(
        preBattleWheelResult.description.match(/-?\d+/)?.[0] || "0",
      );
      if (value === 666) {
        return { str: 666, spd: 666, dur: 666, iq: 666, biq: 666, ma: 666 };
      }
      totalBonus += value;
    }

    if (boss.id === 12 && boss.stats.str === null) {
      // Find player with highest total base stats
      let highestTotal = 0;
      let highestPlayer = battle.playerData[0];
      battle.playerData.forEach((player) => {
        const total =
          (player.stats.str || 0) +
          (player.stats.spd || 0) +
          (player.stats.dur || 0) +
          (player.stats.iq || 0) +
          (player.stats.biq || 0) +
          (player.stats.ma || 0);
        if (total > highestTotal) {
          highestTotal = total;
          highestPlayer = player;
        }
      });
      // Each stat of that player x team size
      const multiplier = battle.playerData.length;
      return {
        str: (highestPlayer.stats.str || 0) * multiplier,
        spd: (highestPlayer.stats.spd || 0) * multiplier,
        dur: (highestPlayer.stats.dur || 0) * multiplier,
        iq: (highestPlayer.stats.iq || 0) * multiplier,
        biq: (highestPlayer.stats.biq || 0) * multiplier,
        ma: (highestPlayer.stats.ma || 0) * multiplier,
      };
    }

    if (boss.id === 18) {
      const bossTotal = 240 + totalBonus * 6;
      return { str: bossTotal, spd: 0, dur: 0, iq: 0, biq: 0, ma: 0 };
    }

    // Helper to calculate Laerys bonus for a specific stat
    const getLaerysStatBonus = (statIndex: number): number => {
      if (boss.id !== 26) return 0;
      let bonus = 0;
      // Apply bonus from each round win that affects this stat
      // Bonus from round i only applies to stats >= i + 2
      Object.entries(laerysBonusByRound).forEach(
        ([roundIdxStr, roundBonus]) => {
          const roundIdx = parseInt(roundIdxStr);
          if (statIndex >= roundIdx + 1) {
            bonus += roundBonus;
          }
        },
      );
      return bonus;
    };

    const stats: BossStats = {
      str:
        (boss.stats.str || 0) +
        totalBonus +
        (dynamicBossStatChanges.str || 0) +
        getLaerysStatBonus(0),
      spd:
        (boss.stats.spd || 0) +
        totalBonus +
        (dynamicBossStatChanges.spd || 0) +
        getLaerysStatBonus(1),
      dur:
        (boss.stats.dur || 0) +
        totalBonus +
        (dynamicBossStatChanges.dur || 0) +
        getLaerysStatBonus(2),
      iq:
        (boss.stats.iq || 0) +
        totalBonus +
        (dynamicBossStatChanges.iq || 0) +
        getLaerysStatBonus(3),
      biq:
        (boss.stats.biq || 0) +
        totalBonus +
        (dynamicBossStatChanges.biq || 0) +
        getLaerysStatBonus(4),
      ma:
        (boss.stats.ma || 0) +
        totalBonus +
        (dynamicBossStatChanges.ma || 0) +
        getLaerysStatBonus(5),
    };

    // Pontiff Sulyvahn: apply permanent stat multipliers
    if (boss.id === 8) {
      if (pontiffMultipliers.dur) {
        stats.dur = (stats.dur || 0) * pontiffMultipliers.dur;
      }
      if (pontiffMultipliers.ma) {
        stats.ma = (stats.ma || 0) * pontiffMultipliers.ma;
      }
    }

    if (boss.id === 22 && currentPhase === 2) {
      const boost = 8;
      stats.str = (stats.str || 0) + boost;
      stats.spd = (stats.spd || 0) + boost;
      stats.dur = (stats.dur || 0) + boost;
      stats.iq = (stats.iq || 0) + boost;
      stats.biq = (stats.biq || 0) + boost;
      stats.ma = (stats.ma || 0) + boost;
    }

    // Soul of Cinder: steal weapon effects from team → apply stat bonuses to boss
    if (specialRules.stealPvEEffects) {
      const statNameMap: Record<string, keyof BossStats> = {
        strength: "str",
        speed: "spd",
        durability: "dur",
        iq: "iq",
        biq: "biq",
        ma: "ma",
      };
      const weaponBonuses: Record<keyof BossStats, number> = {
        str: 0,
        spd: 0,
        dur: 0,
        iq: 0,
        biq: 0,
        ma: 0,
      };

      battle.playerData.forEach((player) => {
        const weapons = player.weapons || [];
        weapons.forEach((weaponName) => {
          const entry = EffectRegistry.get("weapon", weaponName);
          if (!entry) return;
          entry.effects.forEach((eff) => {
            if (
              eff.type === "stat_modifier" &&
              eff.timing === "immediate" &&
              eff.target === "self" &&
              eff.stat &&
              eff.value
            ) {
              if (eff.stat === "all") {
                (Object.keys(weaponBonuses) as (keyof BossStats)[]).forEach(
                  (k) => {
                    weaponBonuses[k] += eff.value!;
                  },
                );
              } else {
                const mapped = statNameMap[eff.stat];
                if (mapped) weaponBonuses[mapped] += eff.value!;
              }
            }
          });
        });
      });

      stats.str = (stats.str || 0) + weaponBonuses.str;
      stats.spd = (stats.spd || 0) + weaponBonuses.spd;
      stats.dur = (stats.dur || 0) + weaponBonuses.dur;
      stats.iq = (stats.iq || 0) + weaponBonuses.iq;
      stats.biq = (stats.biq || 0) + weaponBonuses.biq;
      stats.ma = (stats.ma || 0) + weaponBonuses.ma;
    }

    // Kafka: transfer hypnotized player stats per-stat
    if (hypnotizedPlayer && boss.id === 9) {
      stats.str = (stats.str || 0) + (hypnotizedPlayer.stats.str || 0);
      stats.spd = (stats.spd || 0) + (hypnotizedPlayer.stats.spd || 0);
      stats.dur = (stats.dur || 0) + (hypnotizedPlayer.stats.dur || 0);
      stats.iq = (stats.iq || 0) + (hypnotizedPlayer.stats.iq || 0);
      stats.biq = (stats.biq || 0) + (hypnotizedPlayer.stats.biq || 0);
      stats.ma = (stats.ma || 0) + (hypnotizedPlayer.stats.ma || 0);
    }

    return stats;
  }, [
    boss.stats,
    boss.id,
    boss.ruleEffects,
    ruleBonus.bossBonus,
    dynamicBossBonus,
    dynamicBossStatChanges,
    preBattleWheelResult,
    battle.playerData,
    currentRound,
    currentPhase,
    specialRules.stealPvEEffects,
    roundResults,
    pontiffMultipliers,
    hypnotizedPlayer,
  ]);

  // Calculate stolen weapon info for display
  const stolenWeaponInfo = useMemo(() => {
    if (!specialRules.stealPvEEffects) return null;

    const statNameMap: Record<string, keyof BossStats> = {
      strength: "str",
      speed: "spd",
      durability: "dur",
      iq: "iq",
      biq: "biq",
      ma: "ma",
    };
    const totalBonuses: Record<keyof BossStats, number> = {
      str: 0,
      spd: 0,
      dur: 0,
      iq: 0,
      biq: 0,
      ma: 0,
    };
    const weaponList: { player: string; weapon: string; bonuses: string[] }[] =
      [];

    battle.playerData.forEach((player) => {
      const weapons = player.weapons || [];
      weapons.forEach((weaponName) => {
        const entry = EffectRegistry.get("weapon", weaponName);
        if (!entry) return;
        const bonuses: string[] = [];
        entry.effects.forEach((eff) => {
          if (
            eff.type === "stat_modifier" &&
            eff.timing === "immediate" &&
            eff.target === "self" &&
            eff.stat &&
            eff.value
          ) {
            if (eff.stat === "all") {
              bonuses.push(`All Stats +${eff.value}`);
              (Object.keys(totalBonuses) as (keyof BossStats)[]).forEach(
                (k) => {
                  totalBonuses[k] += eff.value!;
                },
              );
            } else {
              const mapped = statNameMap[eff.stat];
              if (mapped) {
                bonuses.push(`${mapped.toUpperCase()} +${eff.value}`);
                totalBonuses[mapped] += eff.value!;
              }
            }
          }
        });
        if (bonuses.length > 0) {
          weaponList.push({ player: player.name, weapon: weaponName, bonuses });
        }
      });
    });

    return { weaponList, totalBonuses };
  }, [specialRules.stealPvEEffects, battle.playerData]);

  // Calculate battle score
  const score = useMemo(() => {
    let bossScore = specialRules.bossStartingPoints;
    let teamScore = specialRules.teamStartingPoints;

    // Carry over score from previous phases (Aatrox phase 2)
    phaseScores.forEach((ps) => {
      bossScore += ps.boss;
      teamScore += ps.team;
    });

    roundResults.forEach((r) => {
      if (r.winner === "boss") {
        bossScore += specialRules.bossPointsPerWin;

        if (boss.id === 22 && currentPhase === 2 && teamScore > 0) {
          teamScore -= 1;
        }
      } else if (r.winner === "team") {
        if (!r.blocked) {
          teamScore += 1;
          if (r.bonusPoints) {
            teamScore += r.bonusPoints;
          }
        }
      }
      if (r.bossBonusPoints) {
        bossScore += r.bossBonusPoints;
      }

      if (specialRules.bossAlwaysScoresPoints > 0 && r.winner !== "boss") {
        bossScore += specialRules.bossAlwaysScoresPoints;
      }

      if (specialRules.isMirrorScoring) {
        if (r.winner === "boss") {
          teamScore += 1;
        } else if (r.winner === "team" && !r.blocked) {
          bossScore += 1;
        }
      }
    });

    if (boss.id === 32) {
      for (let i = 1; i < roundResults.length; i += 2) {
        const prev = roundResults[i - 1];
        const curr = roundResults[i];
        if (
          (prev.winner === "boss" && curr.winner === "team") ||
          (prev.winner === "team" && curr.winner === "boss")
        ) {
          bossScore += 2;
        }
      }
    }

    return { boss: bossScore, team: teamScore };
  }, [roundResults, specialRules, boss.id, currentPhase, phaseScores]);

  // Determine final winner
  const finalWinner = useMemo(() => {
    if (battleState !== "finished") return null;

    if (boss.id === 10) {
      const minStat = Math.min(
        teamStats.str,
        teamStats.spd,
        teamStats.dur,
        teamStats.iq,
        teamStats.biq,
        teamStats.ma,
      );
      if (minStat < 20) return "boss";
    }

    if (boss.id === 17 && specialRules.isMirrorScoring) {
      if (score.team === score.boss) return "team";
      return "boss";
    }

    if (boss.id === 26 && score.team === score.boss) {
      return "boss";
    }

    if (score.team >= specialRules.teamPointsToWin) return "team";
    if (score.boss > score.team) return "boss";
    if (score.team > score.boss) return "team";

    // Tie: use tie-break result if available, otherwise trigger tie-break wheel
    if (tieBreakResult) {
      return tieBreakResult;
    }
    return "tie";
  }, [
    battleState,
    score,
    specialRules.teamPointsToWin,
    specialRules.isMirrorScoring,
    boss.id,
    teamStats,
    tieBreakResult,
  ]);

  // Trigger tie-break wheel when final result is a tie
  useEffect(() => {
    if (finalWinner === "tie" && !tieBreakResult) {
      // Trigger tie-break wheel
      spinBinaryWheel(
        ["Team 🔵", "Boss 👹"],
        ["#3b82f6", "#ef4444"],
        "Tie-Break! 🎰",
        "⚖️",
        true, // autoSpin
        0.5, // 50/50 chance
      ).then((selectedIndex) => {
        setTieBreakResult(selectedIndex === 0 ? "team" : "boss");
      });
    }
  }, [finalWinner, tieBreakResult, spinBinaryWheel]);

  // Calculate weighted values
  // Stat âm sẽ được coi là 0 để tính tỉ lệ wheel
  const getWeightedValues = useCallback(
    (bossVal: number, teamVal: number) => {
      // Clamp to minimum 0 for wheel calculation
      const clampedBoss = Math.max(0, bossVal);
      const clampedTeam = Math.max(0, teamVal);

      if (specialRules.noDoubleWeight) {
        return { bossWeight: clampedBoss, teamWeight: clampedTeam };
      }

      if (clampedBoss > clampedTeam) {
        return { bossWeight: clampedBoss * 2, teamWeight: clampedTeam };
      } else if (clampedTeam > clampedBoss) {
        return { bossWeight: clampedBoss, teamWeight: clampedTeam * 2 };
      } else {
        return { bossWeight: clampedBoss, teamWeight: clampedTeam };
      }
    },
    [specialRules.noDoubleWeight],
  );

  // Freeze a random player, excludeNos allows excluding players already frozen in this batch
  // Uses refs instead of activePlayers to avoid stale closure in auto-battle mode
  const freezeRandomPlayer = useCallback(
    async (
      autoSpin: boolean = true,
      excludeNos: number[] = [],
    ): Promise<number | null> => {
      const immunePlayers =
        (bossRuleChecks.freezeImmunePlayers as number[]) || [];
      // Build fresh active players list from refs to avoid stale closure
      const currentFrozen = frozenPlayersRef.current;
      const currentDisabled = manuallyDisabledPlayersRef.current;
      const currentRemoved = removedPlayersRef.current;
      const currentIsekai = isekaidPlayersRef.current;
      const freezablePlayers = battle.playerData.filter(
        (p) =>
          !currentFrozen.some((f) => f.playerNo === p.no) &&
          !currentRemoved.includes(p.no) &&
          !currentIsekai.includes(p.no) &&
          !currentDisabled.includes(p.no) &&
          !immunePlayers.includes(p.no) &&
          !excludeNos.includes(p.no),
      );

      if (freezablePlayers.length > 0) {
        const playerToFreeze = await spinPlayerWheel(
          freezablePlayers,
          "freeze",
          autoSpin,
        );
        setFrozenPlayers((prev) => {
          const updated = [
            ...prev,
            {
              playerNo: playerToFreeze.no,
              name: playerToFreeze.name,
              frozenAtRound: currentRound,
            },
          ];
          frozenPlayersRef.current = updated;
          return updated;
        });
        setBattleMessages((prev) => [
          ...prev,
          `❄️ ${playerToFreeze.name} đã bị Caligo đóng băng!`,
        ]);
        return playerToFreeze.no;
      }
      return null;
    },
    [
      battle.playerData,
      bossRuleChecks.freezeImmunePlayers,
      currentRound,
      spinPlayerWheel,
    ],
  );

  // Isekai a random player
  const isekaiRandomPlayer = useCallback(async () => {
    if (activePlayers.length > 0) {
      const playerToIsekai = await spinPlayerWheel(activePlayers, "isekai");
      setIsekaidPlayers((prev) => [...prev, playerToIsekai.no]);
      setBattleMessages((prev) => [
        ...prev,
        `💀 ${playerToIsekai.name} đã bị The Collector Isekai!`,
      ]);
      setDynamicBossBonus((prev) => prev + 2);
    }
  }, [activePlayers, spinPlayerWheel]);

  // Remove players
  const removePlayersForSimon = useCallback(() => {
    const teamWins = roundResults.filter((r) => r.winner === "team").length;
    if (teamWins === 3 && removedPlayers.length === 0) {
      const toRemove = activePlayers.slice(0, 3);
      setRemovedPlayers(toRemove.map((p) => p.no));
      setBattleMessages((prev) => [
        ...prev,
        `⚔️ Simon đã loại bỏ 3 thành viên: ${toRemove.map((p) => p.name).join(", ")}`,
      ]);
    }
  }, [activePlayers, roundResults, removedPlayers.length]);

  // Spin pre-battle wheel
  const spinPreBattleWheel = useCallback(async () => {
    const wheelEffect = boss.ruleEffects?.find(
      (e) => e.type === "preBattleWheel",
    );
    if (!wheelEffect || !wheelEffect.outcomes) return;

    setPreBattleWheelSpinning(true);

    const wheelSize = wheelEffect.wheelSize || 20;
    const isManualInput = boss.id === 21; // Raphael - allow manual input

    const result = await spinD20Wheel(
      wheelSize,
      `${boss.name} - Vòng quay 1-${wheelSize}`,
      "🎰",
      false,
      isManualInput,
    );

    let selectedOutcome = wheelEffect.outcomes![0];
    for (const outcome of wheelEffect.outcomes!) {
      if (result >= outcome.range[0] && result <= outcome.range[1]) {
        selectedOutcome = outcome;
        break;
      }
    }

    setPreBattleWheelResult({
      number: result,
      effect: selectedOutcome.effect,
      description: selectedOutcome.description,
      startingPoints: selectedOutcome.startingPoints,
    });
    setPreBattleWheelSpinning(false);
    setBattleMessages((prev) => [
      ...prev,
      `🎰 Vòng quay: ${result} - ${selectedOutcome.description}`,
    ]);
  }, [boss.ruleEffects, boss.id, boss.name, spinD20Wheel]);

  // Hypnotize player - uses dialog to select player
  const hypnotizePlayer = useCallback((): Promise<void> => {
    if (activePlayers.length === 0 || hypnotizedPlayer)
      return Promise.resolve();
    return new Promise((resolve) => {
      hypnotizeResolveRef.current = (player: PlayerData) => {
        setHypnotizedPlayer({
          playerNo: player.no,
          name: player.name,
          stats: { ...player.stats },
        });
        setBattleMessages((prev) => [
          ...prev,
          `🌀 Kafka đã thôi miên ${player.name}! Stats của họ chuyển sang cho Kafka.`,
        ]);
        setShowHypnotizeDialog(false);
        hypnotizeResolveRef.current = null;
        resolve();
      };
      setShowHypnotizeDialog(true);
    });
  }, [activePlayers, hypnotizedPlayer]);

  // Spin wheel for current round
  const spinWheel = useCallback(() => {
    const maxRounds = specialRules.isTotalStatBattle
      ? specialRules.totalStatBattleRounds
      : 6;
    if (currentRound >= maxRounds || isSpinning) return;

    // Rolling Skeletons: if any party stat < 20, team auto-loses
    if (boss.id === 10) {
      const minStat = Math.min(
        teamStats.str,
        teamStats.spd,
        teamStats.dur,
        teamStats.iq,
        teamStats.biq,
        teamStats.ma,
      );
      if (minStat < 20) {
        setBattleMessages((prev) => [
          ...prev,
          `💀 Party Stat dưới 20 - Tổ đội thua!`,
        ]);
        setBattleState("finished");
        return;
      }
    }

    // Capra Demon BO3: activate if needed (first spin of a BO3 round)
    if (boss.id === 16 && capraEffect && !bo3Round) {
      const nextStat = STAT_KEYS[currentRound];
      if (
        (nextStat === "biq" && capraEffect.biqBO3) ||
        (nextStat === "ma" && capraEffect.maBO3)
      ) {
        setBo3Round({ stat: nextStat, bossWins: 0, teamWins: 0 });
        setBattleMessages((prev) => [
          ...prev,
          `🐐 Round ${STAT_LABELS[nextStat]} thành BO3! Quay 3 lần, bên nào thắng 2 lần thì thắng.`,
        ]);
      }
    }

    setIsSpinning(true);

    let bossValue: number;
    let teamValue: number;
    let stat: keyof BossStats;

    let bossWeight: number;
    let teamWeight: number;

    if (specialRules.isTotalStatBattle) {
      // Total Stat Battle mode - compare sum of all stats
      const baseBossTotal =
        (bossStats.str || 0) +
        (bossStats.spd || 0) +
        (bossStats.dur || 0) +
        (bossStats.iq || 0) +
        (bossStats.biq || 0) +
        (bossStats.ma || 0);
      const baseTeamTotal =
        teamStats.str +
        teamStats.spd +
        teamStats.dur +
        teamStats.iq +
        teamStats.biq +
        teamStats.ma;

      bossValue = baseBossTotal + totalStatBossTotalBonus;
      teamValue = baseTeamTotal + totalStatTeamTotalBonus;
      stat = "str"; // Use str as placeholder for total stat battle

      // For Total Stat Battle: use fixed base weights from round 1 for all rounds
      if (currentRound === 0 || !totalStatBaseWeights) {
        // Round 1: calculate and save base weights
        const baseWeights = getWeightedValues(baseBossTotal, baseTeamTotal);
        setTotalStatBaseWeights({
          boss: baseWeights.bossWeight,
          team: baseWeights.teamWeight,
        });
        bossWeight = baseWeights.bossWeight;
        teamWeight = baseWeights.teamWeight;
      } else {
        // Subsequent rounds: use saved base weights
        bossWeight = totalStatBaseWeights.boss;
        teamWeight = totalStatBaseWeights.team;
      }
    } else {
      // BO3: use the BO3 stat instead of current round stat
      stat = bo3Round ? bo3Round.stat : STAT_KEYS[currentRound];
      bossValue = bossStats[stat] || 0;
      teamValue = teamStats[stat] || 0;
      const weights = getWeightedValues(bossValue, teamValue);
      bossWeight = weights.bossWeight;
      teamWeight = weights.teamWeight;
    }

    const total = bossWeight + teamWeight;

    if (total === 0) {
      const result: RoundResult = {
        stat,
        bossValue,
        teamValue,
        winner: "tie",
        spinAngle: 0,
        wheelRotation: wheelRotation,
      };

      setTimeout(() => {
        setRoundResults((prev) => [...prev, result]);
        setCurrentRound((prev) => prev + 1);
        setIsSpinning(false);

        if (currentRound + 1 >= 6) {
          setBattleState("finished");
        }
      }, 500);
      return;
    }

    // Normal spin (also used for each BO3 sub-round - user clicks Spin each time)
    const spinDuration = 5000 + Math.random() * 3000; // 5-8 seconds
    const extraRotations = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
    const targetRotation = extraRotations * 360 + Math.random() * 360;

    const startRotation = wheelRotation;
    const startTime = Date.now();
    let lastWinner: "boss" | "team" | null = null;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + targetRotation * easeOut;
      setWheelRotation(currentRotation % 360);

      // Tick sound when crossing between boss/team slices
      const currentWinner = getPvEWheelWinner(
        currentRotation % 360,
        bossWeight,
        teamWeight,
      );
      if (lastWinner !== null && currentWinner !== lastWinner) {
        playTickSound();
      }
      lastWinner = currentWinner;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - determine winner from final position
        const finalRotation = currentRotation % 360;
        const winner = getPvEWheelWinner(finalRotation, bossWeight, teamWeight);
        playDefaultWinSound();
        onSpinComplete(winner, stat, bossValue, teamValue, finalRotation);
      }
    };

    requestAnimationFrame(animate);
  }, [
    currentRound,
    isSpinning,
    bossStats,
    teamStats,
    getWeightedValues,
    specialRules,
    wheelRotation,
    totalStatBossTotalBonus,
    totalStatTeamTotalBonus,
    totalStatBaseWeights,
    boss.id,
  ]);

  // Replay a specific round (re-spin)
  const replayRound = useCallback((roundIndex: number) => {
    setRoundResults((prev) => prev.slice(0, roundIndex));
    setCurrentRound(roundIndex);
    setSelectedRound(null);
    setIsSpinning(false);
    setBattleState("fighting");
  }, []);

  // Handle spin result after animation completes
  const onSpinComplete = useCallback(
    async (
      winner: "boss" | "team",
      stat: keyof BossStats,
      bossValue: number,
      teamValue: number,
      finalRotation: number,
    ) => {
      let blocked = false;
      let bonusPoints = 0;

      if (winner === "team" && specialRules.blockTeamScoreChance > 0) {
        // Show 50/50 wheel for Radagon block
        const blockResult = await spinBinaryWheel(
          ["Chặn", "Không chặn"],
          ["#dc2626", "#16a34a"],
          "Radagon chặn?",
          "",
          false,
        );
        if (blockResult === 0) {
          blocked = true;
          setBattleMessages((prev) => [
            ...prev,
            `🛡️ Radagon đã chặn team ghi điểm round ${currentRound + 1}!`,
          ]);
        }
      }

      // Ca Cao Crit: Ca Cao thắng, 20% nhận thêm 1 điểm (boss ghi 2 thay vì 1)
      let bossBonusPoints = 0;
      if (winner === "boss" && specialRules.hasCrit) {
        const critResult = await spinBinaryWheel(
          ["Crit!", "Không"],
          ["#f59e0b", "#6b7280"],
          "Ca Cao Crit?",
          "⚔️",
          false,
          0.2,
          [1, 4],
        );
        if (critResult === 0) {
          bossBonusPoints += 1;
          setBattleMessages((prev) => [
            ...prev,
            `⚔️ CRIT! Ca Cao nhận thêm 1 điểm round ${currentRound + 1}!`,
          ]);
        }
      }

      // Ca Cao Evasion: Ca Cao thua, 20% né được (Ca Cao cũng nhận 1 điểm)
      if (winner === "team" && specialRules.hasEvasion) {
        const evasionResult = await spinBinaryWheel(
          ["Né!", "Không"],
          ["#22c55e", "#6b7280"],
          "Ca Cao Evasion?",
          "💨",
          false,
          0.2,
          [1, 4],
        );
        if (evasionResult === 0) {
          bossBonusPoints += 1;
          setBattleMessages((prev) => [
            ...prev,
            `💨 EVASION! Ca Cao né được round ${currentRound + 1}! Ca Cao nhận 1 điểm.`,
          ]);
        }
      }

      if (
        winner === "team" &&
        stat === "spd" &&
        specialRules.teamBonusOnStatWin?.stat === "spd"
      ) {
        bonusPoints = specialRules.teamBonusOnStatWin.bonusPoints;
        setBattleMessages((prev) => [
          ...prev,
          `⚡ Team thắng round Speed - nhận +${bonusPoints} điểm bonus!`,
        ]);
      }

      const result: RoundResult = {
        stat,
        bossValue,
        teamValue,
        winner,
        spinAngle: finalRotation,
        blocked,
        bossBonusPoints: bossBonusPoints > 0 ? bossBonusPoints : undefined,
        bonusPoints: bonusPoints > 0 ? bonusPoints : undefined,
        wheelRotation: finalRotation,
      };

      // BO3 mode: track sub-round wins, user clicks Spin each time
      // Use ref to avoid stale closure (bo3Round may have been set in the same spinWheel call)
      const currentBO3 = bo3RoundRef.current;
      if (currentBO3 && (winner === "boss" || winner === "team")) {
        const newBossWins = currentBO3.bossWins + (winner === "boss" ? 1 : 0);
        const newTeamWins = currentBO3.teamWins + (winner === "team" ? 1 : 0);
        setBattleMessages((prev) => [
          ...prev,
          `🐐 BO3 ${STAT_LABELS[currentBO3.stat]} lần ${newBossWins + newTeamWins}: ${winner === "boss" ? "Boss" : "Team"} thắng! (Boss ${newBossWins} - ${newTeamWins} Team)`,
        ]);

        if (newBossWins >= 2 || newTeamWins >= 2) {
          // BO3 decided
          const bo3Winner = newBossWins >= 2 ? "boss" : "team";
          const finalResult: RoundResult = {
            ...result,
            winner: bo3Winner,
          };

          // Capra BIQ special scoring
          if (boss.id === 16 && capraEffect && currentBO3.stat === "biq") {
            if (bo3Winner === "team" && capraEffect.biqLossPenalty > 0) {
              finalResult.bossBonusPoints = -capraEffect.biqLossPenalty;
              setBattleMessages((prev) => [
                ...prev,
                `🐐 Capra Demon thua BIQ - mất ${capraEffect.biqLossPenalty} điểm!`,
              ]);
            }
            if (bo3Winner === "boss" && capraEffect.biqWinBonusTeamScore) {
              const teamPts = score.team;
              if (teamPts > 1) {
                finalResult.bossBonusPoints = teamPts - 1;
                setBattleMessages((prev) => [
                  ...prev,
                  `🐐 Capra Demon thắng BIQ - nhận ${teamPts} điểm (bằng team)!`,
                ]);
              }
            }
          }

          setRoundResults((prev) => [...prev, finalResult]);
          setCurrentRound((prev) => prev + 1);
          setIsSpinning(false);
          setBattleMessages((prev) => [
            ...prev,
            `🐐 BO3 ${STAT_LABELS[currentBO3.stat]}: ${bo3Winner === "boss" ? "Boss" : "Team"} thắng BO3!`,
          ]);
          setBo3Round(null);

          // Check end of battle
          const maxRounds = specialRules.isTotalStatBattle
            ? specialRules.totalStatBattleRounds
            : 6;
          if (currentRound + 1 >= maxRounds) {
            setBattleState("finished");
          }
          return;
        } else {
          // BO3 continues - wait for user to click Spin again
          setBo3Round({
            ...currentBO3,
            bossWins: newBossWins,
            teamWins: newTeamWins,
          });
          setIsSpinning(false);
          return;
        }
      }

      // Capra Demon: BIQ special scoring for normal (non-BO3) rounds
      if (boss.id === 16 && capraEffect && stat === "biq") {
        if (winner === "team" && capraEffect.biqLossPenalty > 0) {
          result.bossBonusPoints = -capraEffect.biqLossPenalty;
          setBattleMessages((prev) => [
            ...prev,
            `🐐 Capra Demon thua BIQ - mất ${capraEffect.biqLossPenalty} điểm!`,
          ]);
        }
        if (winner === "boss" && capraEffect.biqWinBonusTeamScore) {
          const teamPts = score.team;
          if (teamPts > 1) {
            result.bossBonusPoints = teamPts - 1;
            setBattleMessages((prev) => [
              ...prev,
              `🐐 Capra Demon thắng BIQ - nhận ${teamPts} điểm (bằng team)!`,
            ]);
          }
        }
      }

      setRoundResults((prev) => [...prev, result]);
      setCurrentRound((prev) => prev + 1);
      setIsSpinning(false);

      if (winner === "boss") {
        const boostOnWin = specialRules.bossStatBoostOnWin || 0;
        if (boostOnWin > 0) {
          setDynamicBossBonus((prev) => prev + boostOnWin);
        }
        const boostOnTeamLoss = specialRules.bossStatBoostOnTeamLoss || 0;
        if (boostOnTeamLoss > 0) {
          setDynamicBossBonus((prev) => prev + boostOnTeamLoss);
        }
        if (specialRules.isTotalStatBattle) {
          setTotalStatTeamTotalBonus((prev) => prev + 80);
          setBattleMessages((prev) => [
            ...prev,
            `📈 Team thua round ${currentRound + 1} - nhận +80 Tổng Stat!`,
          ]);
        }
      }

      if (winner === "team") {
        setWinStreak((prev) => prev + 1);
        if (specialRules.isTotalStatBattle) {
          setTotalStatBossTotalBonus((prev) => prev + 80);
          setBattleMessages((prev) => [
            ...prev,
            `📈 Boss thua round ${currentRound + 1} - nhận +80 Tổng Stat!`,
          ]);
        }
      } else {
        setWinStreak(0);
      }

      if (boss.id === 6 && currentRound >= 0) {
        // After each round: team wins = freeze 1, boss wins = freeze 2
        const frozenNo = await freezeRandomPlayer(false);
        if (winner === "boss") {
          await freezeRandomPlayer(false, frozenNo !== null ? [frozenNo] : []);
        }
      }

      if (boss.id === 24 && winner === "boss") {
        await isekaiRandomPlayer();
      }

      if (boss.id === 15) {
        // Count team wins including current round (roundResults is stale)
        const simonTeamWins =
          roundResults.filter((r) => r.winner === "team").length +
          (winner === "team" ? 1 : 0);
        if (simonTeamWins >= 3 && removedPlayers.length === 0) {
          const toRemove = activePlayers.slice(0, 3);
          setRemovedPlayers(toRemove.map((p) => p.no));
          setBattleMessages((prev) => [
            ...prev,
            `⚔️ Simon đã loại bỏ 3 thành viên: ${toRemove.map((p) => p.name).join(", ")}`,
          ]);
        }
        const prevTeamWins = roundResults.filter(
          (r) => r.winner === "team",
        ).length;
        if (winner === "team" && prevTeamWins === 0) {
          setDynamicBossBonus((prev) => prev + 3);
          setBattleMessages((prev) => [
            ...prev,
            `⚔️ Simon nhận +3 All Stats sau round thắng đầu tiên của team!`,
          ]);
        }
      }

      if (boss.id === 26 && winner === "team") {
        const remainingRounds = 6 - (currentRound + 1);
        if (remainingRounds > 0) {
          const bonusPerRound = Math.floor(60 / remainingRounds);
          setDynamicBossBonus((prev) => prev + bonusPerRound);
          setBattleMessages((prev) => [
            ...prev,
            `📈 Laerys nhận +${bonusPerRound} stats cho các round còn lại!`,
          ]);
        }
      }

      if (boss.id === 25 && winner === "boss") {
        const vanteEligible = battle.playerData.filter(
          (p) =>
            !frozenPlayers.some((f) => f.playerNo === p.no) &&
            !removedPlayers.includes(p.no) &&
            !isekaidPlayers.includes(p.no) &&
            !vantePlayers.includes(p.no),
        );
        if (vanteEligible.length > 0) {
          const selectedPlayer = await spinPlayerWheel(vanteEligible, "vante");
          setVantePlayers((prev) => [...prev, selectedPlayer.no]);
          setBattleMessages((prev) => [
            ...prev,
            `📜 ${selectedPlayer.name} nhận "Văn Tế"!`,
          ]);
        }
      }

      // Capra Demon (boss 16): conditional effects after 4 rounds (IQ = round index 3)
      if (boss.id === 16 && currentRound === 3 && !capraEffect) {
        const teamPts =
          score.team +
          (winner === "team" && !blocked ? 1 : 0) +
          (bonusPoints || 0);
        if (teamPts <= 1) {
          setCapraEffect({
            biqBonus: -50,
            iqBonus: 0,
            replayIQ: false,
            biqBO3: false,
            maBO3: true,
            biqLossPenalty: 3,
            biqWinBonusTeamScore: false,
          });
          setDynamicBossStatChanges((prev) => ({
            ...prev,
            biq: (prev.biq || 0) - 50,
          }));
          setBattleMessages((prev) => [
            ...prev,
            `🐐 Capra Demon: Team ≤1 điểm! BIQ -50, thua BIQ = -3 điểm, MA thành BO3.`,
          ]);
        } else if (teamPts === 2) {
          setCapraEffect({
            biqBonus: 0,
            iqBonus: 0,
            replayIQ: false,
            biqBO3: true,
            maBO3: false,
            biqLossPenalty: 0,
            biqWinBonusTeamScore: false,
          });
          setBattleMessages((prev) => [
            ...prev,
            `🐐 Capra Demon: Team 2 điểm! Round BIQ thành BO3.`,
          ]);
        } else if (teamPts === 3) {
          setCapraEffect({
            biqBonus: 0,
            iqBonus: 25,
            replayIQ: true,
            biqBO3: false,
            maBO3: false,
            biqLossPenalty: 0,
            biqWinBonusTeamScore: false,
          });
          setDynamicBossStatChanges((prev) => ({
            ...prev,
            iq: (prev.iq || 0) + 25,
          }));
          setBattleMessages((prev) => [
            ...prev,
            `🐐 Capra Demon: Team 3 điểm! IQ +25, đánh lại Round IQ!`,
          ]);
          // Replay IQ round
          replayRound(3);
          return;
        } else {
          // teamPts >= 4
          setCapraEffect({
            biqBonus: 50,
            iqBonus: 0,
            replayIQ: false,
            biqBO3: false,
            maBO3: true,
            biqLossPenalty: 0,
            biqWinBonusTeamScore: true,
          });
          setDynamicBossStatChanges((prev) => ({
            ...prev,
            biq: (prev.biq || 0) + 50,
          }));
          setBattleMessages((prev) => [
            ...prev,
            `🐐 Capra Demon: Team ≥4 điểm! BIQ +50, thắng BIQ = nhận điểm bằng team, MA thành BO3.`,
          ]);
        }
      }

      // Check for early win condition
      const newTeamScore =
        score.team +
        (winner === "team" && !blocked ? 1 : 0) +
        (bonusPoints || 0);
      if (
        specialRules.teamPointsToWin < 4 &&
        newTeamScore >= specialRules.teamPointsToWin
      ) {
        setBattleMessages((prev) => [
          ...prev,
          `🏆 Team đạt ${specialRules.teamPointsToWin} điểm - Chiến thắng!`,
        ]);
        setBattleState("finished");
        return;
      }

      const maxRounds = specialRules.isTotalStatBattle
        ? specialRules.totalStatBattleRounds
        : 6;
      if (currentRound + 1 >= maxRounds) {
        // Calculate actual current streak including this round
        // (winStreak state is stale here because setWinStreak hasn't rendered yet)
        const actualStreak = winner === "team" ? winStreak + 1 : 0;
        if (boss.id === 10 && actualStreak < 6) {
          setRetryBattle(true);
          setRetryPenalty((prev) => prev + 4);
          setCurrentRound(0);
          setRoundResults([]);
          setWinStreak(0);
          const newPenalty = retryPenalty + 4;
          setBattleMessages((prev) => [
            ...prev,
            `💀 Rolling Skeletons: Không thắng 6 round liên tiếp! Đánh lại với -${newPenalty} All Party Stats!`,
          ]);
        } else if (boss.id === 22 && currentPhase === 1 && newTeamScore >= 4) {
          // newTeamScore includes this round's result (score.team is stale)
          const newBossScore =
            score.boss +
            (winner === "boss" ? specialRules.bossPointsPerWin : 0);
          setCurrentPhase(2);
          setPhaseScores([{ boss: newBossScore, team: newTeamScore }]);
          setCurrentRound(0);
          setRoundResults([]);
          setWheelRotation(0);
          setBattleMessages((prev) => [
            ...prev,
            `⚔️ Aatrox hồi sinh! Phase 2 bắt đầu - Aatrox nhận +8 All Stats và hút điểm thay vì ghi điểm!`,
          ]);
        } else {
          setBattleState("finished");
        }
      }
    },
    [
      specialRules,
      boss.id,
      freezeRandomPlayer,
      spinBinaryWheel,
      isekaiRandomPlayer,
      removePlayersForSimon,
      roundResults,
      winStreak,
      retryBattle,
      currentRound,
      currentPhase,
      score,
      activePlayers,
      spinPlayerWheel,
      capraEffect,
      bo3Round,
      replayRound,
    ],
  );

  // Start battle
  const startBattle = useCallback(async () => {
    if (specialRules.hasPreBattleWheel && !preBattleWheelResult) {
      setBattleState("preBattle");
      setShowPreBattleWheel(true);
      return;
    }

    setBattleState("fighting");
    setCurrentRound(0);
    setRoundResults([]);
    setWheelRotation(0);
    setDynamicBossBonus(0);
    setFrozenPlayers([]);
    setRemovedPlayers([]);
    setIsekaidPlayers([]);
    setVantePlayers([]);
    setWinStreak(0);
    setRetryBattle(false);
    setRetryPenalty(0);
    setSelectedRound(null);
    setTotalStatBossTotalBonus(0);
    setTotalStatTeamTotalBonus(0);
    setTotalStatBaseWeights(null);
    setCapraEffect(null);
    setBo3Round(null);

    if (boss.id === 9) {
      await hypnotizePlayer();
    }
  }, [
    specialRules.hasPreBattleWheel,
    preBattleWheelResult,
    boss.id,
    hypnotizePlayer,
  ]);

  // Continue after pre-battle wheel
  const continueAfterPreBattleWheel = useCallback(() => {
    setShowPreBattleWheel(false);
    setBattleState("fighting");
    setCurrentRound(0);
    setRoundResults([]);
    setWheelRotation(0);
  }, []);

  // Auto-spin all rounds
  /** const autoFight = useCallback(async () => {
    if (specialRules.hasPreBattleWheel && !preBattleWheelResult) {
      setBattleState("preBattle");
      setShowPreBattleWheel(true);
      return;
    }

    autoFightCancelledRef.current = false;
    setBattleState("fighting");
    setCurrentRound(0);
    setRoundResults([]);
    setWheelRotation(0);
    setDynamicBossBonus(0);
    setFrozenPlayers([]);
    setRemovedPlayers([]);
    setIsekaidPlayers([]);
    setVantePlayers([]);
    setSelectedRound(null);
    setTotalStatBossTotalBonus(0);
    setTotalStatTeamTotalBonus(0);
    setTotalStatBaseWeights(null);
    setCapraEffect(null);
    setBo3Round(null);

    if (boss.id === 9) {
      await hypnotizePlayer();
    }

    // Rolling Skeletons: if any party stat < 20, team auto-loses immediately
    if (boss.id === 10) {
      const minStat = Math.min(
        teamStats.str,
        teamStats.spd,
        teamStats.dur,
        teamStats.iq,
        teamStats.biq,
        teamStats.ma,
      );
      if (minStat < 20) {
        setBattleMessages((prev) => [
          ...prev,
          `💀 Party Stat dưới 20 - Tổ đội thua!`,
        ]);
        setBattleState("finished");
        return;
      }
    }

    const results: RoundResult[] = [];
    let rotation = 0;
    let dynamicBonus = 0;
    let streak = 0;

    // Total Stat Battle mode
    if (specialRules.isTotalStatBattle) {
      const totalRounds = specialRules.totalStatBattleRounds || 7;
      const baseBossTotal =
        (bossStats.str || 0) +
        (bossStats.spd || 0) +
        (bossStats.dur || 0) +
        (bossStats.iq || 0) +
        (bossStats.biq || 0) +
        (bossStats.ma || 0);
      const baseTeamTotal =
        teamStats.str +
        teamStats.spd +
        teamStats.dur +
        teamStats.iq +
        teamStats.biq +
        teamStats.ma;

      // Calculate fixed base weights from round 1 (with x2 for higher side)
      const baseWeights = getWeightedValues(baseBossTotal, baseTeamTotal);
      const fixedBossWeight = baseWeights.bossWeight;
      const fixedTeamWeight = baseWeights.teamWeight;
      setTotalStatBaseWeights({ boss: fixedBossWeight, team: fixedTeamWeight });

      let bossBonus = 0;
      let teamBonus = 0;

      for (let idx = 0; idx < totalRounds; idx++) {
        const bossValue = baseBossTotal + bossBonus;
        const teamValue = baseTeamTotal + teamBonus;

        // Use fixed weights for wheel (same every round)
        const total = fixedBossWeight + fixedTeamWeight;

        let winner: "boss" | "team" | "tie" = "tie";
        let spinAngle = 0;

        if (total > 0) {
          // Use same approach as spinWheel: random target rotation, determine winner from final angle
          const extraRotations = 5 + Math.floor(Math.random() * 3);
          const targetRotation = extraRotations * 360 + Math.random() * 360;
          rotation += targetRotation;
          const finalRotation = rotation % 360;
          winner = getPvEWheelWinner(
            finalRotation,
            fixedBossWeight,
            fixedTeamWeight,
          );
          spinAngle = finalRotation;
        }

        // Loser gets +80 bonus for next rounds
        if (winner === "boss") {
          teamBonus += 80;
        } else if (winner === "team") {
          bossBonus += 80;
        }

        results.push({
          stat: "str", // Placeholder for total stat battle
          bossValue,
          teamValue,
          winner,
          spinAngle,
          blocked: false,
          wheelRotation: rotation,
        });
      }

      setTotalStatBossTotalBonus(bossBonus);
      setTotalStatTeamTotalBonus(teamBonus);
    } else {
      // Normal stat-by-stat battle
      let autoCapraEffect: typeof capraEffect = null;
      let autoCapraStatChanges: Record<string, number> = {};

      for (let idx = 0; idx < STAT_KEYS.length; idx++) {
        const stat = STAT_KEYS[idx];
        let bossValue =
          (bossStats[stat] || 0) +
          dynamicBonus +
          (autoCapraStatChanges[stat] || 0);
        const teamValue = teamStats[stat] || 0;

        if (boss.id === 8 && idx > 0 && idx % 2 === 0) {
          bossValue *= 2;
        }

        // Capra Demon: check if this round needs BO3
        const needsBO3 =
          boss.id === 16 &&
          autoCapraEffect &&
          ((stat === "biq" && autoCapraEffect.biqBO3) ||
            (stat === "ma" && autoCapraEffect.maBO3));

        if (needsBO3) {
          // Simulate BO3: first to 2 wins
          let bo3BossWins = 0;
          let bo3TeamWins = 0;
          let lastResult: RoundResult | null = null;

          while (bo3BossWins < 2 && bo3TeamWins < 2) {
            const { bossWeight, teamWeight } = getWeightedValues(
              bossValue,
              teamValue,
            );
            const total = bossWeight + teamWeight;
            let subWinner: "boss" | "team" | "tie" = "tie";
            let subSpinAngle = 0;

            if (total > 0) {
              const extraRotations = 5 + Math.floor(Math.random() * 3);
              const targetRotation = extraRotations * 360 + Math.random() * 360;
              rotation += targetRotation;
              const finalRotation = rotation % 360;
              subWinner = getPvEWheelWinner(
                finalRotation,
                bossWeight,
                teamWeight,
              );
              subSpinAngle = finalRotation;
            }

            if (subWinner === "boss") bo3BossWins++;
            else if (subWinner === "team") bo3TeamWins++;

            lastResult = {
              stat,
              bossValue,
              teamValue,
              winner: subWinner,
              spinAngle: subSpinAngle,
              wheelRotation: rotation,
            };
          }

          // BO3 winner
          const bo3Winner = bo3BossWins >= 2 ? "boss" : "team";
          lastResult!.winner = bo3Winner;

          // Capra BIQ special scoring
          if (stat === "biq" && autoCapraEffect) {
            if (bo3Winner === "team" && autoCapraEffect.biqLossPenalty > 0) {
              lastResult!.bossBonusPoints = -autoCapraEffect.biqLossPenalty;
            }
            if (bo3Winner === "boss" && autoCapraEffect.biqWinBonusTeamScore) {
              // Boss nhận điểm bằng team score (thay thế điểm thắng bình thường, -1 vì bossPointsPerWin đã cộng)
              const currentTeamScore =
                results.filter((r) => r.winner === "team" && !r.blocked)
                  .length +
                results.reduce((acc, r) => acc + (r.bonusPoints || 0), 0);
              if (currentTeamScore > 1) {
                lastResult!.bossBonusPoints = currentTeamScore - 1;
              }
            }
          }

          if (bo3Winner === "boss") {
            dynamicBonus += specialRules.bossStatBoostOnWin || 0;
            dynamicBonus += specialRules.bossStatBoostOnTeamLoss || 0;
            streak = 0;
          } else {
            streak++;
          }

          results.push(lastResult!);
        } else {
          // Normal round
          const { bossWeight, teamWeight } = getWeightedValues(
            bossValue,
            teamValue,
          );
          const total = bossWeight + teamWeight;

          let winner: "boss" | "team" | "tie" = "tie";
          let spinAngle = 0;
          let blocked = false;
          let bonusPoints = 0;

          if (total > 0) {
            const extraRotations = 5 + Math.floor(Math.random() * 3);
            const targetRotation = extraRotations * 360 + Math.random() * 360;
            rotation += targetRotation;
            const finalRotation = rotation % 360;
            winner = getPvEWheelWinner(finalRotation, bossWeight, teamWeight);
            spinAngle = finalRotation;

            if (
              winner === "team" &&
              stat === "spd" &&
              specialRules.teamBonusOnStatWin?.stat === "spd"
            ) {
              bonusPoints = specialRules.teamBonusOnStatWin.bonusPoints;
            }
          }

          if (winner === "boss") {
            dynamicBonus += specialRules.bossStatBoostOnWin || 0;
            dynamicBonus += specialRules.bossStatBoostOnTeamLoss || 0;
            streak = 0;
          } else if (winner === "team") {
            streak++;
            if (boss.id === 26) {
              const remainingRounds = 6 - (idx + 1);
              if (remainingRounds > 0) {
                dynamicBonus += Math.floor(60 / remainingRounds);
              }
            }
          }

          // Capra Demon: BIQ special scoring for normal (non-BO3) rounds
          let autoBossBonusPoints: number | undefined;
          if (boss.id === 16 && autoCapraEffect && stat === "biq") {
            if (winner === "team" && autoCapraEffect.biqLossPenalty > 0) {
              autoBossBonusPoints = -autoCapraEffect.biqLossPenalty;
            }
            if (winner === "boss" && autoCapraEffect.biqWinBonusTeamScore) {
              // Boss nhận điểm bằng team score (thay thế điểm thắng, -1 vì bossPointsPerWin đã cộng)
              const currentTeamScore =
                results.filter((r) => r.winner === "team" && !r.blocked)
                  .length +
                results.reduce((acc, r) => acc + (r.bonusPoints || 0), 0);
              if (currentTeamScore > 1) {
                autoBossBonusPoints = currentTeamScore - 1;
              }
            }
          }

          results.push({
            stat,
            bossValue,
            teamValue,
            winner,
            spinAngle,
            blocked,
            bonusPoints: bonusPoints > 0 ? bonusPoints : undefined,
            bossBonusPoints: autoBossBonusPoints,
            wheelRotation: rotation,
          });

          // Capra Demon: after IQ round (idx=3), apply conditional effects
          if (boss.id === 16 && idx === 3) {
            const teamPts =
              results.filter((r) => r.winner === "team" && !r.blocked).length +
              results.reduce((acc, r) => acc + (r.bonusPoints || 0), 0);

            if (teamPts <= 1) {
              autoCapraEffect = {
                biqBonus: -50,
                iqBonus: 0,
                replayIQ: false,
                biqBO3: false,
                maBO3: true,
                biqLossPenalty: 3,
                biqWinBonusTeamScore: false,
              };
              autoCapraStatChanges.biq = -50;
            } else if (teamPts === 2) {
              autoCapraEffect = {
                biqBonus: 0,
                iqBonus: 0,
                replayIQ: false,
                biqBO3: true,
                maBO3: false,
                biqLossPenalty: 0,
                biqWinBonusTeamScore: false,
              };
            } else if (teamPts === 3) {
              autoCapraEffect = {
                biqBonus: 0,
                iqBonus: 25,
                replayIQ: true,
                biqBO3: false,
                maBO3: false,
                biqLossPenalty: 0,
                biqWinBonusTeamScore: false,
              };
              autoCapraStatChanges.iq = 25;
              // Replay IQ round: remove current IQ result and redo
              results.pop(); // Remove IQ result
              idx = 2; // Will become 3 after for loop increment, replaying IQ
              continue;
            } else {
              // teamPts >= 4
              autoCapraEffect = {
                biqBonus: 50,
                iqBonus: 0,
                replayIQ: false,
                biqBO3: false,
                maBO3: true,
                biqLossPenalty: 0,
                biqWinBonusTeamScore: true,
              };
              autoCapraStatChanges.biq = 50;
            }
          }
        }
      }

      setDynamicBossBonus(dynamicBonus);

      // Rolling Skeletons: retry until 6 consecutive wins, or stat < 20, or score loss
      if (boss.id === 10) {
        let totalPenalty = 0;
        while (streak < 6) {
          totalPenalty += 4;
          setBattleMessages((prev) => [
            ...prev,
            `💀 Rolling Skeletons: Không thắng 6 round liên tiếp! Đánh lại với -${totalPenalty} All Party Stats!`,
          ]);

          // Check partyStatMinimum: if any party stat < 20 after penalty, team auto-loses
          const penalizedStats = STAT_KEYS.map(
            (s) => (teamStats[s] || 0) - totalPenalty,
          );
          const minPenalizedStat = Math.min(...penalizedStats);
          if (minPenalizedStat < 20) {
            setBattleMessages((prev) => [
              ...prev,
              `💀 Party Stat dưới 20 sau penalty - Tổ đội thua!`,
            ]);
            break;
          }

          // Recalculate with penalty applied
          results.length = 0;
          rotation = 0;
          dynamicBonus = 0;
          streak = 0;

          STAT_KEYS.forEach((stat) => {
            const bossValue = (bossStats[stat] || 0) + dynamicBonus;
            const teamValue = (teamStats[stat] || 0) - totalPenalty;

            const { bossWeight, teamWeight } = getWeightedValues(
              bossValue,
              teamValue,
            );
            const total = bossWeight + teamWeight;

            let winner: "boss" | "team" | "tie" = "tie";
            let spinAngle = 0;

            if (total > 0) {
              const extraRotations = 5 + Math.floor(Math.random() * 3);
              const targetRotation = extraRotations * 360 + Math.random() * 360;
              rotation += targetRotation;
              const finalRotation = rotation % 360;
              winner = getPvEWheelWinner(finalRotation, bossWeight, teamWeight);
              spinAngle = finalRotation;
            }

            if (winner === "boss") {
              streak = 0;
            } else if (winner === "team") {
              streak++;
            }

            results.push({
              stat,
              bossValue,
              teamValue,
              winner,
              spinAngle,
              wheelRotation: rotation,
            });
          });

          setDynamicBossBonus(dynamicBonus);
        }
        setRetryBattle(true);
        setRetryPenalty(totalPenalty);
      }

      // Aatrox: if team won phase 1, compute phase 2 with +8 boss stats and drain scoring
      if (boss.id === 22) {
        let phase1TeamScore = 0;
        results.forEach((r) => {
          if (r.winner === "team" && !r.blocked) {
            phase1TeamScore += 1 + (r.bonusPoints || 0);
          }
        });

        if (phase1TeamScore >= 4) {
          const aatroxBoost = 8;
          dynamicBonus = 0;
          rotation = 0; // Reset rotation for phase 2 wheel

          STAT_KEYS.forEach((stat) => {
            const bossValue =
              (bossStats[stat] || 0) + aatroxBoost + dynamicBonus;
            const teamValue = teamStats[stat] || 0;

            const { bossWeight, teamWeight } = getWeightedValues(
              bossValue,
              teamValue,
            );
            const total = bossWeight + teamWeight;

            let winner: "boss" | "team" | "tie" = "tie";
            let spinAngle = 0;

            if (total > 0) {
              const extraRotations = 5 + Math.floor(Math.random() * 3);
              const targetRotation = extraRotations * 360 + Math.random() * 360;
              rotation += targetRotation;
              const finalRotation = rotation % 360;
              winner = getPvEWheelWinner(finalRotation, bossWeight, teamWeight);
              spinAngle = finalRotation;
            }

            results.push({
              stat,
              bossValue,
              teamValue,
              winner,
              spinAngle,
              wheelRotation: rotation,
            });
          });
        }
      }
    }

    // Determine total rounds to animate
    const maxRounds = results.length;
    // Phase 2 starts at round index 6 for Aatrox (boss.id === 22)
    const phase2StartRound = boss.id === 22 ? 6 : -1;
    let round = 0;
    const spinDuration = 2000; // 2 seconds per spin

    const animateRound = () => {
      if (autoFightCancelledRef.current) return;
      if (round >= maxRounds) {
        setBattleState("finished");
        return;
      }

      // Aatrox phase transition: switch to phase 2 at round 6
      if (boss.id === 22 && round === phase2StartRound && maxRounds > 6) {
        // Calculate phase 1 score to carry over
        let p1Boss = specialRules.bossStartingPoints;
        let p1Team = specialRules.teamStartingPoints;
        results.slice(0, 6).forEach((r) => {
          if (r.winner === "boss") p1Boss += specialRules.bossPointsPerWin;
          else if (r.winner === "team") p1Team += 1 + (r.bonusPoints || 0);
        });
        setPhaseScores([{ boss: p1Boss, team: p1Team }]);
        setCurrentPhase(2);
        setRoundResults([]);
        setWheelRotation(0);
        setBattleMessages((prev) => [
          ...prev,
          `⚔️ Aatrox hồi sinh! Phase 2 bắt đầu - Aatrox nhận +8 All Stats và hút điểm thay vì ghi điểm!`,
        ]);
        // Delay to let React render phase transition (image change, boss stats update)
        setTimeout(animateRound, 2000);
        return;
      }

      // For Aatrox phase 2, display round index relative to phase start
      const displayRound =
        phase2StartRound >= 0 && round >= phase2StartRound
          ? round - phase2StartRound
          : round;
      setCurrentRound(displayRound);
      setIsSpinning(true);

      const startRotation =
        round === 0 || round === phase2StartRound
          ? 0
          : results[round - 1].wheelRotation;
      const endRotation = results[round].wheelRotation;
      const startTime = Date.now();

      let lastAutoWinner: "boss" | "team" | null = null;

      const animate = () => {
        if (autoFightCancelledRef.current) return;
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentRotation =
          startRotation + (endRotation - startRotation) * easeOut;
        setWheelRotation(currentRotation % 360);

        // Tick sound when crossing between boss/team slices
        const roundResult = results[round];
        const roundBossWeight = specialRules.isTotalStatBattle
          ? totalStatBaseWeights?.boss ||
            getWeightedValues(roundResult.bossValue, roundResult.teamValue)
              .bossWeight
          : getWeightedValues(roundResult.bossValue, roundResult.teamValue)
              .bossWeight;
        const roundTeamWeight = specialRules.isTotalStatBattle
          ? totalStatBaseWeights?.team ||
            getWeightedValues(roundResult.bossValue, roundResult.teamValue)
              .teamWeight
          : getWeightedValues(roundResult.bossValue, roundResult.teamValue)
              .teamWeight;
        const currentWinner = getPvEWheelWinner(
          currentRotation % 360,
          roundBossWeight,
          roundTeamWeight,
        );
        if (lastAutoWinner !== null && currentWinner !== lastAutoWinner) {
          playTickSound();
        }
        lastAutoWinner = currentWinner;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Spin complete, show result
          playDefaultWinSound();
          // For Aatrox phase 2, only show results from phase 2 start
          const sliceStart =
            phase2StartRound >= 0 && round >= phase2StartRound
              ? phase2StartRound
              : 0;
          setRoundResults(results.slice(sliceStart, round + 1));
          setIsSpinning(false);

          const currentResult = results[round];

          // Apply boss-specific effects (async for wheel spins)
          const applyEffectsAndContinue = async () => {
            // Radagon block wheel - show after team wins a round
            if (
              currentResult.winner === "team" &&
              specialRules.blockTeamScoreChance > 0
            ) {
              const blockResult = await spinBinaryWheel(
                ["Chặn", "Không chặn"],
                ["#dc2626", "#16a34a"],
                "Radagon chặn?",
                "🛡️",
                false,
              );
              if (blockResult === 0) {
                currentResult.blocked = true;
                setBattleMessages((prev) => [
                  ...prev,
                  `🛡️ Radagon đã chặn team ghi điểm round ${round + 1}!`,
                ]);
                // Update displayed results
                const sliceStartBlock =
                  phase2StartRound >= 0 && round >= phase2StartRound
                    ? phase2StartRound
                    : 0;
                setRoundResults([...results.slice(sliceStartBlock, round + 1)]);
              }
            }

            // Ca Cao Crit wheel - Ca Cao thắng, 20% nhận thêm 1 điểm
            if (currentResult.winner === "boss" && specialRules.hasCrit) {
              const critResult = await spinBinaryWheel(
                ["Crit!", "Không"],
                ["#f59e0b", "#6b7280"],
                "Ca Cao Crit?",
                "⚔️",
                false,
                0.2,
                [1, 4],
              );
              if (critResult === 0) {
                currentResult.bossBonusPoints =
                  (currentResult.bossBonusPoints || 0) + 1;
                setBattleMessages((prev) => [
                  ...prev,
                  `⚔️ CRIT! Ca Cao nhận thêm 1 điểm round ${round + 1}!`,
                ]);
                const sliceStartCrit =
                  phase2StartRound >= 0 && round >= phase2StartRound
                    ? phase2StartRound
                    : 0;
                setRoundResults([...results.slice(sliceStartCrit, round + 1)]);
              }
            }

            // Ca Cao Evasion wheel - Ca Cao thua, 20% né (Ca Cao cũng nhận 1 điểm)
            if (currentResult.winner === "team" && specialRules.hasEvasion) {
              const evasionResult = await spinBinaryWheel(
                ["Né!", "Không"],
                ["#22c55e", "#6b7280"],
                "Ca Cao Evasion?",
                "💨",
                false,
                0.2,
                [1, 4],
              );
              if (evasionResult === 0) {
                currentResult.bossBonusPoints =
                  (currentResult.bossBonusPoints || 0) + 1;
                setBattleMessages((prev) => [
                  ...prev,
                  `💨 EVASION! Ca Cao né được round ${round + 1}! Ca Cao nhận 1 điểm.`,
                ]);
                const sliceStartEvade =
                  phase2StartRound >= 0 && round >= phase2StartRound
                    ? phase2StartRound
                    : 0;
                setRoundResults([...results.slice(sliceStartEvade, round + 1)]);
              }
            }

            if (boss.id === 6 && round >= 0) {
              // After each round: team wins = freeze 1, boss wins = freeze 2
              const frozenNo = await freezeRandomPlayer(false);
              if (currentResult.winner === "boss") {
                await freezeRandomPlayer(
                  false,
                  frozenNo !== null ? [frozenNo] : [],
                );
              }
            }

            if (boss.id === 24 && currentResult.winner === "boss") {
              // Collector isekai effect
              await isekaiRandomPlayer();
            }

            if (boss.id === 25 && currentResult.winner === "boss") {
              // Văn Tế effect - pick player via wheel (disabled players CAN receive, but no duplicates)
              const currentVante = vantePlayersRef.current;
              const vanteEligible = battle.playerData.filter(
                (p) =>
                  !frozenPlayersRef.current.some((f) => f.playerNo === p.no) &&
                  !removedPlayersRef.current.includes(p.no) &&
                  !isekaidPlayersRef.current.includes(p.no) &&
                  !currentVante.includes(p.no),
              );
              if (vanteEligible.length > 0) {
                const selectedPlayer = await spinPlayerWheel(
                  vanteEligible,
                  "vante",
                );
                setVantePlayers((prev) => {
                  const updated = [...prev, selectedPlayer.no];
                  vantePlayersRef.current = updated;
                  return updated;
                });
                setBattleMessages((prev) => [
                  ...prev,
                  `📜 ${selectedPlayer.name} nhận "Văn Tế"!`,
                ]);
              }
            }

            // Check early win condition
            let teamScore = 0;
            results.slice(0, round + 1).forEach((r) => {
              if (r.winner === "team" && !r.blocked) {
                teamScore += 1 + (r.bonusPoints || 0);
              }
            });
            if (
              specialRules.teamPointsToWin < 4 &&
              teamScore >= specialRules.teamPointsToWin
            ) {
              setBattleMessages((prev) => [
                ...prev,
                `🏆 Team đạt ${specialRules.teamPointsToWin} điểm - Chiến thắng!`,
              ]);
              setBattleState("finished");
              return;
            }

            round++;
            // Wait a bit before next round
            setTimeout(animateRound, 500);
          };

          applyEffectsAndContinue();
        }
      };

      requestAnimationFrame(animate);
    };

    setTimeout(animateRound, 500);
  }, [
    bossStats,
    teamStats,
    getWeightedValues,
    specialRules,
    boss.id,
    preBattleWheelResult,
    hypnotizePlayer,
    freezeRandomPlayer,
    spinBinaryWheel,
    isekaiRandomPlayer,
    battle.playerData,
    frozenPlayers,
    removedPlayers,
    isekaidPlayers,
    spinPlayerWheel,
    capraEffect,
    bo3Round,
    currentRound,
    isSpinning,
    wheelRotation,
  ]); **/

  // Reset battle
  const resetBattle = () => {
    setBattleState("idle");
    setCurrentRound(0);
    setRoundResults([]);
    setWheelRotation(0);
    setDynamicBossBonus(0);
    setDynamicBossStatChanges({});
    setFrozenPlayers([]);
    setHypnotizedPlayer(null);
    setRemovedPlayers([]);
    setPreBattleWheelResult(null);
    setShowPreBattleWheel(false);
    setPreBattleWheelSpinning(false);
    setCurrentPhase(1);
    setPhaseScores([]);
    setIsekaidPlayers([]);
    setVantePlayers([]);
    setWinStreak(0);
    setRetryBattle(false);
    setRetryPenalty(0);
    setBattleMessages([]);
    setSelectedRound(null);
    setTotalStatBossTotalBonus(0);
    setTotalStatTeamTotalBonus(0);
    setTotalStatBaseWeights(null);
    setManuallyDisabledPlayers([]);
    setPlayerWheelConfig(null);
    playerWheelResolveRef.current = null;
    setCapraEffect(null);
    setBo3Round(null);
    setTieBreakResult(null);
  };

  // Handle pre-battle wheel spin
  useEffect(() => {
    if (
      showPreBattleWheel &&
      !preBattleWheelResult &&
      !preBattleWheelSpinning
    ) {
      spinPreBattleWheel();
    }
  }, [
    showPreBattleWheel,
    preBattleWheelResult,
    preBattleWheelSpinning,
    spinPreBattleWheel,
  ]);

  // Export battle history to JSON
  const exportBattleHistory = useCallback(() => {
    const history = {
      timestamp: new Date().toISOString(),
      teamId: battle.teamId,
      boss: {
        id: boss.id,
        name: boss.name,
        stats: bossStats,
      },
      team: {
        members: battle.playerData.map((p) => ({
          no: p.no,
          name: p.name,
          username: p.username,
          stats: p.stats,
          race: p.race,
          quirks: p.quirks,
          disabled: manuallyDisabledPlayers.includes(p.no),
        })),
        totalStats: teamStats,
      },
      soloHer: soloHerInfo.active
        ? {
            player: soloHerInfo.soloPlayer?.name,
            multiplier: soloHerInfo.multiplier,
          }
        : null,
      rounds: roundResults.map((r, idx) => ({
        round: idx + 1,
        stat: STAT_LABELS[r.stat] || r.stat,
        bossValue: r.bossValue,
        teamValue: r.teamValue,
        winner: r.winner,
        blocked: r.blocked || false,
        bossBonusPoints: r.bossBonusPoints || 0,
        bonusPoints: r.bonusPoints || 0,
      })),
      finalScore: score,
      winner: finalWinner,
      battleMessages,
    };

    const blob = new Blob([JSON.stringify(history, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `battle-team${battle.teamId}-vs-${boss.name.replace(/\s+/g, "_")}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [
    battle,
    boss,
    bossStats,
    teamStats,
    roundResults,
    score,
    finalWinner,
    battleMessages,
    soloHerInfo,
    manuallyDisabledPlayers,
  ]);

  // Get current stat for wheel display
  const currentStat = currentRound < 6 ? STAT_KEYS[currentRound] : null;
  const displayResult =
    selectedRound !== null ? roundResults[selectedRound] : null;

  // Get wheel values for display
  const getDisplayWheelValues = () => {
    if (displayResult) {
      // For Total Stat Battle: use saved base weights if available
      if (specialRules.isTotalStatBattle && totalStatBaseWeights) {
        return {
          bossWeight: totalStatBaseWeights.boss,
          teamWeight: totalStatBaseWeights.team,
          rotation: displayResult.wheelRotation,
        };
      }
      const { bossWeight, teamWeight } = getWeightedValues(
        displayResult.bossValue,
        displayResult.teamValue,
      );
      return {
        bossWeight,
        teamWeight,
        rotation: displayResult.wheelRotation,
      };
    }
    if (battleState === "fighting") {
      // For Total Stat Battle: use saved base weights if available
      if (specialRules.isTotalStatBattle && totalStatBaseWeights) {
        return {
          bossWeight: totalStatBaseWeights.boss,
          teamWeight: totalStatBaseWeights.team,
          rotation: wheelRotation,
        };
      }

      let bossValue: number;
      let teamValue: number;

      if (specialRules.isTotalStatBattle) {
        // Total Stat Battle mode - compare sum of all stats (first round, no saved weights yet)
        const baseBossTotal =
          (bossStats.str || 0) +
          (bossStats.spd || 0) +
          (bossStats.dur || 0) +
          (bossStats.iq || 0) +
          (bossStats.biq || 0) +
          (bossStats.ma || 0);
        const baseTeamTotal =
          teamStats.str +
          teamStats.spd +
          teamStats.dur +
          teamStats.iq +
          teamStats.biq +
          teamStats.ma;
        bossValue = baseBossTotal;
        teamValue = baseTeamTotal;
      } else if (currentStat) {
        bossValue = bossStats[currentStat] || 0;
        teamValue = teamStats[currentStat] || 0;
      } else {
        return { bossWeight: 50, teamWeight: 50, rotation: 0 };
      }

      const { bossWeight, teamWeight } = getWeightedValues(
        bossValue,
        teamValue,
      );
      return { bossWeight, teamWeight, rotation: wheelRotation };
    }
    return { bossWeight: 50, teamWeight: 50, rotation: 0 };
  };

  const wheelValues = getDisplayWheelValues();

  // Number of rounds (some bosses have 7)
  const totalRounds = specialRules.isTotalStatBattle
    ? specialRules.totalStatBattleRounds
    : 6;

  return (
    <div
      className="fixed inset-0 bg-black flex flex-col z-[2001]"
      onClick={handleClose}
    >
      <div
        className="flex-1 flex flex-col min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-red-500/30 px-3 py-1 rounded-lg border border-red-500">
              <span className="text-red-200 text-sm">PvE Battle</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Team {battle.teamId} vs {boss.name}
            </h2>
            {soloHerInfo.active && soloHerInfo.soloPlayer && (
              <div className="bg-yellow-900/40 px-3 py-1 rounded-lg border border-yellow-500/50 flex items-center gap-2">
                <span className="text-yellow-400 font-bold text-sm">
                  {soloHerInfo.soloPlayer.name} - Let Me Solo Her [ACTIVE]
                </span>
                <span className="text-gray-300 text-xs">
                  x{soloHerInfo.multiplier} stats
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-6 text-lg mr-[16%]">
            <div className="text-center">
              <span className="text-red-400 font-bold text-2xl">
                {score.boss}
              </span>
              <span className="text-gray-400 text-sm ml-2">Boss</span>
            </div>
            <span className="text-gray-500">:</span>
            <div className="text-center">
              <span className="text-green-400 font-bold text-2xl">
                {score.team}
              </span>
              <span className="text-gray-400 text-sm ml-2">Team</span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white text-3xl font-light transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0 p-4 gap-4">
          {/* Left: Boss Image */}
          <div className="w-[45%] flex flex-col min-h-0">
            <div className="flex-1 bg-gray-900/80 rounded-xl border-2 border-red-500/30 overflow-hidden flex items-center justify-center">
              <img
                src={bossImagePath}
                alt={boss.name}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = "";
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="text-center p-8">
                        <div class="text-2xl font-bold text-red-400">${boss.name}</div>
                        <div class="text-gray-500 mt-2">Boss #${boss.id}</div>
                      </div>
                    `;
                  }
                }}
              />
            </div>

            {/* Boss Info Panel */}
            <div className="mt-2 bg-gray-800/80 rounded-lg p-3 border border-gray-700 max-h-48 overflow-y-auto">
              <h4 className="text-red-400 text-xs font-bold mb-2">
                Boss Info:
              </h4>
              {/* Boss Stats */}
              <div className="grid grid-cols-6 gap-0.5 text-center text-[10px] mb-2">
                {(["str", "spd", "dur", "iq", "biq", "ma"] as const).map(
                  (stat) => (
                    <div key={stat} className="bg-gray-700/50 rounded p-0.5">
                      <div className="text-gray-400 text-[8px]">
                        {stat.toUpperCase()}
                      </div>
                      <div className="text-red-400 font-bold text-[10px]">
                        {bossStats[stat] ?? "?"}
                      </div>
                    </div>
                  ),
                )}
              </div>
              {/* Rules */}
              {boss.rules && boss.rules.length > 0 && (
                <div className="space-y-1 mb-2">
                  {boss.rules.map((rule, idx) => (
                    <p
                      key={idx}
                      className="text-[11px] text-gray-300 leading-tight"
                    >
                      {rule}
                    </p>
                  ))}
                </div>
              )}
              {/* Applied Bonuses */}
              {ruleBonus.details.length > 0 && (
                <div className="border-t border-gray-600 pt-1 mt-1 space-y-0.5">
                  {ruleBonus.details.map((detail, idx) => (
                    <p
                      key={idx}
                      className="text-[11px] text-yellow-400 leading-tight"
                    >
                      {detail}
                    </p>
                  ))}
                </div>
              )}
              {/* Stolen Weapons Info */}
              {stolenWeaponInfo && stolenWeaponInfo.weaponList.length > 0 && (
                <div className="border-t border-gray-600 pt-1 mt-1 space-y-0.5">
                  <p className="text-[11px] text-orange-400 font-bold">
                    Vũ khí cướp từ tổ đội:
                  </p>
                  {stolenWeaponInfo.weaponList.map((w, idx) => (
                    <p
                      key={idx}
                      className="text-[10px] text-orange-300 leading-tight pl-2"
                    >
                      {w.player}: {w.weapon} ({w.bonuses.join(", ")})
                    </p>
                  ))}
                  <p className="text-[11px] text-orange-400 font-semibold">
                    Tổng bonus:{" "}
                    {(
                      Object.entries(stolenWeaponInfo.totalBonuses) as [
                        string,
                        number,
                      ][]
                    )
                      .filter(([, v]) => v !== 0)
                      .map(([k, v]) => `${k.toUpperCase()} +${v}`)
                      .join(", ") || "Không có"}
                  </p>
                </div>
              )}
              {/* Reward / Punishment */}
              <div className="border-t border-gray-600 pt-1 mt-1 space-y-0.5">
                <p className="text-[11px] text-green-400 leading-tight">
                  Reward: {boss.reward}
                </p>
                <p className="text-[11px] text-red-300 leading-tight">
                  Punishment: {boss.punishment}
                </p>
              </div>
            </div>

            {/* Battle Messages */}
            {battleMessages.length > 0 && (
              <div className="mt-2 bg-gray-800/80 rounded-lg p-3 border border-gray-700 max-h-32 overflow-y-auto">
                <h4 className="text-gray-400 text-xs font-bold mb-2">
                  Battle Log:
                </h4>
                {battleMessages.slice(-5).map((msg, idx) => (
                  <p key={idx} className="text-sm text-gray-300">
                    {msg}
                  </p>
                ))}
              </div>
            )}

            {/* Selected Player Effect Breakdown (Left Panel) */}
            {selectedPlayerNo && (() => {
              const selectedPlayer = battle.playerData.find(
                (p) => p.no === selectedPlayerNo,
              );
              if (!selectedPlayer?.effectBreakdown || !selectedPlayer?.baseStats) return null;
              return (
                <div className="mt-2 bg-gray-800/80 rounded-lg p-3 border border-yellow-500/30 max-h-48 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-yellow-400 text-xs font-bold">
                      #{selectedPlayer.no} {selectedPlayer.name}
                    </h4>
                    <button
                      onClick={() => setSelectedPlayerNo(null)}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      &times;
                    </button>
                  </div>
                  <StatModifiersTable
                    breakdown={selectedPlayer.effectBreakdown}
                    baseStats={selectedPlayer.baseStats}
                  />
                </div>
              );
            })()}
          </div>

          {/* Right Side */}
          <div className="w-[55%] flex flex-col min-h-0 gap-4">
            {/* Top Row: Round Labels + Wheel */}
            <div className="flex gap-4">
              {/* Round Labels */}
              <div className="flex flex-col gap-2">
                {Array.from({ length: totalRounds }, (_, i) => {
                  const result = roundResults[i];
                  const isCurrentRound =
                    i === currentRound && battleState === "fighting";
                  const isSelected = selectedRound === i;

                  return (
                    <button
                      key={i}
                      onClick={() =>
                        result ? setSelectedRound(isSelected ? null : i) : null
                      }
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        isSelected
                          ? "border-yellow-400 bg-yellow-500/20 text-yellow-400"
                          : isCurrentRound
                            ? "border-yellow-400 bg-yellow-500/20 text-yellow-400 animate-pulse"
                            : result
                              ? result.winner === "boss"
                                ? "border-red-500 bg-red-500/20 text-red-400 cursor-pointer hover:bg-red-500/30"
                                : result.winner === "team"
                                  ? result.blocked
                                    ? "border-gray-500 bg-gray-500/20 text-gray-400 cursor-pointer hover:bg-gray-500/30"
                                    : "border-green-500 bg-green-500/20 text-green-400 cursor-pointer hover:bg-green-500/30"
                                  : "border-gray-500 bg-gray-500/20 text-gray-400 cursor-pointer hover:bg-gray-500/30"
                              : "border-gray-600 bg-gray-800/50 text-gray-500"
                      }`}
                    >
                      {specialRules.isTotalStatBattle
                        ? `R${i + 1}`
                        : i < 6
                          ? STAT_LABELS[STAT_KEYS[i]]
                          : `R${i + 1}`}
                    </button>
                  );
                })}
              </div>

              {/* Wheel */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative">
                  <PvEWheel
                    bossWeight={wheelValues.bossWeight}
                    teamWeight={wheelValues.teamWeight}
                    rotation={wheelValues.rotation}
                    isSpinning={isSpinning}
                  />
                  {/* Spin button in wheel center */}
                  {battleState === "fighting" &&
                    !isSpinning &&
                    (currentStat || specialRules.isTotalStatBattle) && (
                      <button
                        onClick={spinWheel}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold text-xs transition-all transform hover:scale-110 shadow-lg z-20 border-2 border-white/30"
                      >
                        Spin!
                      </button>
                    )}
                </div>

                {/* Current Round Info */}
                {battleState === "fighting" &&
                  !isSpinning &&
                  (currentStat || specialRules.isTotalStatBattle) && (
                    <div className="mt-4 text-center">
                      <div className="text-lg font-bold text-white mb-2">
                        {specialRules.isTotalStatBattle
                          ? `Round ${currentRound + 1}: Tổng Stat`
                          : `Round ${currentRound + 1}: ${STAT_FULL_LABELS[currentStat!]}`}
                        {bo3Round && (
                          <span className="ml-2 text-sm text-yellow-400 font-semibold">
                            (BO3: Boss {bo3Round.bossWins} - {bo3Round.teamWins}{" "}
                            Team)
                          </span>
                        )}
                      </div>
                      <div className="flex justify-center gap-8 text-sm">
                        {specialRules.isTotalStatBattle ? (
                          <>
                            <div>
                              <span className="text-gray-400">
                                Boss Total:{" "}
                              </span>
                              <span className="text-red-400 font-bold">
                                {(bossStats.str || 0) +
                                  (bossStats.spd || 0) +
                                  (bossStats.dur || 0) +
                                  (bossStats.iq || 0) +
                                  (bossStats.biq || 0) +
                                  (bossStats.ma || 0) +
                                  totalStatBossTotalBonus}
                              </span>
                              {totalStatBossTotalBonus > 0 && (
                                <span className="text-yellow-400 ml-1">
                                  (+{totalStatBossTotalBonus})
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-gray-400">
                                Team Total:{" "}
                              </span>
                              <span className="text-green-400 font-bold">
                                {teamStats.str +
                                  teamStats.spd +
                                  teamStats.dur +
                                  teamStats.iq +
                                  teamStats.biq +
                                  teamStats.ma +
                                  totalStatTeamTotalBonus}
                              </span>
                              {totalStatTeamTotalBonus > 0 && (
                                <span className="text-yellow-400 ml-1">
                                  (+{totalStatTeamTotalBonus})
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <span className="text-gray-400">Boss: </span>
                              <span className="text-red-400 font-bold">
                                {bossStats[currentStat!] || 0}
                              </span>
                              {(bossStats[currentStat!] || 0) >
                                (teamStats[currentStat!] || 0) &&
                                !specialRules.noDoubleWeight && (
                                  <span className="text-yellow-400 ml-1">
                                    (x2)
                                  </span>
                                )}
                            </div>
                            <div>
                              <span className="text-gray-400">Team: </span>
                              <span className="text-green-400 font-bold">
                                {teamStats[currentStat!] || 0}
                              </span>
                              {(teamStats[currentStat!] || 0) >
                                (bossStats[currentStat!] || 0) &&
                                !specialRules.noDoubleWeight && (
                                  <span className="text-yellow-400 ml-1">
                                    (x2)
                                  </span>
                                )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                {/* Selected Round Info */}
                {selectedRound !== null && displayResult && (
                  <div className="mt-4 text-center">
                    <div className="text-lg font-bold text-yellow-400 mb-2">
                      Round {selectedRound + 1}:{" "}
                      {specialRules.isTotalStatBattle
                        ? "Tổng Stat"
                        : STAT_FULL_LABELS[displayResult.stat]}
                    </div>
                    <div className="flex justify-center gap-8 text-sm">
                      <div>
                        <span className="text-gray-400">
                          {specialRules.isTotalStatBattle
                            ? "Boss Total: "
                            : "Boss: "}
                        </span>
                        <span className="text-red-400 font-bold">
                          {displayResult.bossValue}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">
                          {specialRules.isTotalStatBattle
                            ? "Team Total: "
                            : "Team: "}
                        </span>
                        <span className="text-green-400 font-bold">
                          {displayResult.teamValue}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`mt-2 font-bold ${
                        displayResult.winner === "boss"
                          ? "text-red-400"
                          : displayResult.winner === "team"
                            ? displayResult.blocked
                              ? "text-gray-400"
                              : "text-green-400"
                            : "text-gray-400"
                      }`}
                    >
                      {displayResult.winner === "boss"
                        ? displayResult.bossBonusPoints
                          ? `BOSS WIN ${displayResult.bossBonusPoints > 0 ? "+" : ""}${displayResult.bossBonusPoints}`
                          : "BOSS WIN"
                        : displayResult.winner === "team"
                          ? displayResult.blocked
                            ? "BLOCKED"
                            : displayResult.bossBonusPoints
                              ? `TEAM WIN (Boss ${displayResult.bossBonusPoints > 0 ? "+" : ""}${displayResult.bossBonusPoints})`
                              : "TEAM WIN"
                          : "TIE"}
                    </div>
                    <div className="mt-2 flex gap-2 justify-center">
                      <button
                        onClick={() => setSelectedRound(null)}
                        className="px-4 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-all"
                      >
                        Back to Current
                      </button>
                      {selectedRound !== null &&
                        !isSpinning &&
                        (battleState === "fighting" ||
                          battleState === "finished") && (
                          <button
                            onClick={() => replayRound(selectedRound)}
                            className="px-4 py-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white text-sm font-bold rounded transition-all"
                          >
                            Đấu lại Round {selectedRound + 1}
                          </button>
                        )}
                    </div>
                  </div>
                )}

                {/* Idle State */}
                {battleState === "idle" && (
                  <div className="mt-4 flex flex-col items-center gap-3">
                    <div className="flex gap-4">
                      <button
                        onClick={startBattle}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-lg transition-all transform hover:scale-105"
                      >
                        Start Battle
                      </button>
                      {/* <button
                        onClick={autoFight}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold rounded-lg transition-all transform hover:scale-105"
                      >
                        Auto Fight
                      </button> */}
                    </div>
                  </div>
                )}

                {/* Spinning State */}
                {isSpinning && (
                  <div className="mt-4 text-yellow-400 font-medium animate-pulse">
                    Spinning...
                  </div>
                )}

                {/* Pre-Battle Wheel */}
                {battleState === "preBattle" &&
                  showPreBattleWheel &&
                  preBattleWheelResult && (
                    <div className="mt-4 text-center">
                      <div className="text-yellow-400 font-bold text-lg">
                        🎰 Kết quả: Số {preBattleWheelResult.number}
                      </div>
                      <div className="text-gray-300 mt-1">
                        {preBattleWheelResult.description}
                      </div>
                      <button
                        onClick={continueAfterPreBattleWheel}
                        className="mt-3 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-lg transition-all"
                      >
                        Tiếp tục
                      </button>
                    </div>
                  )}

                {/* Finished State */}
                {battleState === "finished" && (
                  <div className="mt-4 text-center">
                    <div
                      className={`text-3xl font-bold mb-2 ${
                        finalWinner === "team"
                          ? "text-green-400"
                          : finalWinner === "boss"
                            ? "text-red-400"
                            : "text-gray-400"
                      }`}
                    >
                      {finalWinner === "team"
                        ? "VICTORY!"
                        : finalWinner === "boss"
                          ? "DEFEAT!"
                          : "TIE!"}
                    </div>
                    <div className="text-white mb-4">
                      Final Score: {score.team} - {score.boss}
                    </div>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={resetBattle}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-lg"
                      >
                        Battle Again
                      </button>
                      <button
                        onClick={exportBattleHistory}
                        className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-bold rounded-lg transition-all"
                      >
                        Export JSON
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Player Cards */}
            <div className="mt-auto overflow-y-auto shrink-0">
              <div className="grid grid-cols-4 gap-3">
                {battle.playerData.slice(0, 8).map((player) => (
                  <PlayerCard
                    key={player.no}
                    player={player}
                    isDisabled={manuallyDisabledPlayers.includes(player.no)}
                    onToggleDisable={() => togglePlayerDisable(player.no)}
                    isFrozen={frozenPlayers.some(
                      (f) => f.playerNo === player.no,
                    )}
                    isRemoved={removedPlayers.includes(player.no)}
                    isHypnotized={hypnotizedPlayer?.playerNo === player.no}
                    isIsekai={isekaidPlayers.includes(player.no)}
                    isSelected={selectedPlayerNo === player.no}
                    onSelect={() =>
                      setSelectedPlayerNo(
                        selectedPlayerNo === player.no ? null : player.no,
                      )
                    }
                  />
                ))}
              </div>

              {/* Selected Player Effect Breakdown */}
              {selectedPlayerNo && (() => {
                const selectedPlayer = battle.playerData.find(
                  (p) => p.no === selectedPlayerNo,
                );
                if (!selectedPlayer?.effectBreakdown || !selectedPlayer?.baseStats) return null;
                return (
                  <div className="mt-3 bg-gray-800/80 rounded-lg p-3 border border-yellow-500/30 max-h-[300px] overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-yellow-400">
                        #{selectedPlayer.no} {selectedPlayer.name} - Hiệu ứng
                      </h4>
                      <button
                        onClick={() => setSelectedPlayerNo(null)}
                        className="text-gray-400 hover:text-white text-lg"
                      >
                        &times;
                      </button>
                    </div>
                    <StatModifiersTable
                      breakdown={selectedPlayer.effectBreakdown}
                      baseStats={selectedPlayer.baseStats}
                    />
                  </div>
                );
              })()}

              {/* Team Total Stats */}
              <div className="mt-4 bg-gray-800/50 rounded-lg p-3 border border-green-500/30">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-400">
                    Team Total Stats ({activePlayers.length}/
                    {battle.playerData.length} active)
                  </h5>
                  <div className="text-green-400 font-bold">
                    Total:{" "}
                    {teamStats.str +
                      teamStats.spd +
                      teamStats.dur +
                      teamStats.iq +
                      teamStats.biq +
                      teamStats.ma}
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2 text-center">
                  {STAT_KEYS.map((stat) => (
                    <div
                      key={stat}
                      className="rounded px-2 py-1 bg-gray-700/50"
                    >
                      <div className="text-xs font-medium text-gray-400">
                        {STAT_LABELS[stat]}
                      </div>
                      <div className="font-bold text-green-400">
                        {teamStats[stat]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Boss Stats */}
              <div className="mt-2 bg-gray-800/50 rounded-lg p-3 border border-red-500/30">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-400">
                    {boss.name} Stats
                  </h5>
                  <div className="text-red-400 font-bold">
                    Total:{" "}
                    {(bossStats.str || 0) +
                      (bossStats.spd || 0) +
                      (bossStats.dur || 0) +
                      (bossStats.iq || 0) +
                      (bossStats.biq || 0) +
                      (bossStats.ma || 0)}
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2 text-center">
                  {STAT_KEYS.map((stat) => (
                    <div
                      key={stat}
                      className="rounded px-2 py-1 bg-gray-700/50"
                    >
                      <div className="text-xs font-medium text-gray-400">
                        {STAT_LABELS[stat]}
                      </div>
                      <div className="font-bold text-red-400">
                        {bossStats[stat] || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kafka Hypnotize Player Dialog */}
      {showHypnotizeDialog && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gray-900 border border-purple-500/50 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl shadow-purple-500/20">
            <h3 className="text-xl font-bold text-purple-400 text-center mb-2">
              🌀 Kafka - Thôi Miên
            </h3>
            <p className="text-gray-400 text-center text-sm mb-4">
              Chọn người chơi bị Kafka thôi miên
            </p>
            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {activePlayers.map((player) => (
                <button
                  key={player.no}
                  onClick={() => hypnotizeResolveRef.current?.(player)}
                  className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-purple-900/50 border border-gray-700 hover:border-purple-500 rounded-lg transition-all duration-200 text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-sm shrink-0">
                    {player.no}
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate group-hover:text-purple-300 transition-colors">
                      {player.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      Total:{" "}
                      {(player.stats.str || 0) +
                        (player.stats.spd || 0) +
                        (player.stats.dur || 0) +
                        (player.stats.iq || 0) +
                        (player.stats.biq || 0) +
                        (player.stats.ma || 0)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Player Selection Wheel Overlay */}
      {playerWheelConfig && (
        <PlayerSelectionWheel
          key={playerWheelKeyRef.current}
          config={playerWheelConfig}
        />
      )}

      {/* Binary Wheel Overlay (50/50 decisions) */}
      {binaryWheelConfig && (
        <BinaryWheel
          key={binaryWheelKeyRef.current}
          config={binaryWheelConfig}
        />
      )}
      {d20WheelConfig && (
        <D20Wheel key={d20WheelKeyRef.current} config={d20WheelConfig} />
      )}
    </div>
  );
};
