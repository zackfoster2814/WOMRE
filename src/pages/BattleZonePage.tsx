import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { BattleType } from "../types";
import { Character, CharacterStats } from "../types/character";
import { CharacterParser } from "../utils/characterParser";
import {
  EffectResolver,
  type EffectSourceBreakdown,
} from "../effects/resolver";
import { EffectRegistry } from "../effects/registry";
import { initializeEffectData } from "../effects/data";
import { HandlerRegistry } from "../effects/handlers";
import wheelBgImage from "../assets/img/wheel-bg.png";
import { BossBattleRoom } from "../components/BossBattleRoom";
import {
  getAssetPath,
  getAvatarUrl,
  AVATAR_EXTENSIONS,
} from "../utils/basePath";
import { CombatEffectsPanel } from "../components/CombatEffectsPanel";
import {
  CombatAudioController,
  detectCombatAudioTracks,
  type CombatAudioTrack,
} from "../components/CombatAudioController";
import {
  ProbabilityWheelModal,
  type WheelSpinItem,
} from "../components/ProbabilityWheelModal";
import StatModifiersTable, {
  sourceTypeColors,
} from "../components/StatModifiersTable";
import { PvPBackground3D } from "../components/three/PvPBackground3D";
import { PlayerCard3DFrame } from "../components/three/PlayerCard3D";
import { ScoreDisplay3D } from "../components/three/ScoreDisplay3D";
import { CombatEffects3D } from "../components/three/CombatEffects3D";
import { Canvas } from "@react-three/fiber";

// Initialize effect data
let effectsInitialized = false;
function ensureEffectsInitialized() {
  if (!effectsInitialized) {
    initializeEffectData();
    effectsInitialized = true;
  }
}

// Types for PvE
interface BossStats {
  str: number | null;
  spd: number | null;
  dur: number | null;
  iq: number | null;
  biq: number | null;
  ma: number | null;
}

interface RuleEffect {
  type: string;
  target: "boss" | "team";
  description: string;
  threshold?: number;
  bonusPerStat?: number;
  race?: string;
  bonus?: number;
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
  archetypes?: string[];
  powers?: string[];
  weapons?: string[];
  gear?: string[];
  effectBreakdown?: EffectSourceBreakdown[];
}

interface TeamMemberJson {
  name: string;
  username: string;
}

interface TeamJson {
  id: number;
  boss: string | null;
  members: TeamMemberJson[];
}

interface BattleResult {
  outcome: "win" | "lose";
  rounds: Record<string, "win" | "lose" | "tie" | "parry" | "other" | null>;
  tiebreak?: "win" | "lose" | null;
  notes?: string;
}

interface BattleView {
  teamId: number;
  boss: Boss | null;
  members: TeamMemberJson[];
  playerData: PlayerData[];
  result?: BattleResult | null;
}

// ============================================================================
// Dev Mode: Floating Wheel Weight Panel
// ============================================================================
interface DevWheelPanelProps {
  pos: { x: number; y: number };
  onPosChange: (pos: { x: number; y: number }) => void;
  overrides: Record<string, Record<number, number>>;
  onOverrideChange: (effect: string, idx: number, val: number) => void;
  onReset: () => void;
  defaultItems: Record<string, { label: string; weight: number }[]>;
  // Matchup tab
  allPlayers: PvPPlayerData[];
  onLoadMatchup: (p1: PvPPlayerData, p2: PvPPlayerData) => void;
}

const DevWheelPanel = ({
  pos,
  onPosChange,
  overrides,
  onOverrideChange,
  onReset,
  defaultItems,
  allPlayers,
  onLoadMatchup,
}: DevWheelPanelProps) => {
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [devTab, setDevTab] = useState<"weights" | "matchup">("matchup");
  const [mpMatches, setMpMatches] = useState<
    Array<{
      matchNumber: number;
      player1: { no: number; name: string } | null;
      player2: { no: number; name: string } | null;
      winner: { no: number } | null;
    }>
  >([]);
  const [mpFilter, setMpFilter] = useState<"all" | "pending">("pending");
  const [mpSearch, setMpSearch] = useState("");

  useEffect(() => {
    fetch(getAssetPath("/data/Round256.json"))
      .then((r) => r.json())
      .then((d) => setMpMatches(d.matches || []))
      .catch(() => {});
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      onPosChange({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };
    const onUp = () => {
      isDragging.current = false;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [onPosChange]);

  const filteredMatches = mpMatches.filter((m) => {
    if (!m.player1 || !m.player2) return false;
    if (mpFilter === "pending" && m.winner) return false;
    if (mpSearch.trim()) {
      const q = mpSearch.toLowerCase();
      return (
        m.player1.name.toLowerCase().includes(q) ||
        m.player2.name.toLowerCase().includes(q) ||
        String(m.matchNumber).includes(q)
      );
    }
    return true;
  });

  return (
    <div
      className="fixed z-[9999] w-80 bg-gray-950 border border-yellow-500/60 rounded-xl shadow-2xl select-none"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Header — drag handle */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-yellow-600/20 border-b border-yellow-500/40 rounded-t-xl cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <span className="text-yellow-300 font-bold text-sm">⚙ DEV MODE</span>
        <span className="text-yellow-500/60 text-xs">Ctrl+Shift+D</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-yellow-500/30">
        <button
          onClick={() => setDevTab("matchup")}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors ${devTab === "matchup" ? "bg-yellow-700/30 text-yellow-200" : "text-gray-500 hover:text-gray-300"}`}
        >
          ⚔ Cặp Đấu
        </button>
        <button
          onClick={() => setDevTab("weights")}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors ${devTab === "weights" ? "bg-yellow-700/30 text-yellow-200" : "text-gray-500 hover:text-gray-300"}`}
        >
          🎡 Wheel Weights
        </button>
      </div>

      {devTab === "matchup" && (
        <div className="flex flex-col" style={{ maxHeight: "70vh" }}>
          {/* Filter + Search */}
          <div className="p-2 space-y-1.5 border-b border-gray-800">
            <div className="flex gap-1">
              <button
                onClick={() => setMpFilter("pending")}
                className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${mpFilter === "pending" ? "bg-orange-700/60 text-orange-200" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}
              >
                Chưa đấu (
                {
                  mpMatches.filter((m) => m.player1 && m.player2 && !m.winner)
                    .length
                }
                )
              </button>
              <button
                onClick={() => setMpFilter("all")}
                className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${mpFilter === "all" ? "bg-gray-600 text-white" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}
              >
                Tất cả ({mpMatches.filter((m) => m.player1 && m.player2).length}
                )
              </button>
            </div>
            <input
              type="text"
              value={mpSearch}
              onChange={(e) => setMpSearch(e.target.value)}
              placeholder="Tìm tên, số cặp..."
              className="w-full text-xs px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Match list */}
          <div className="overflow-y-auto flex-1 p-1.5 space-y-1">
            {mpMatches.length === 0 ? (
              <div className="text-gray-500 text-xs text-center py-6">
                Đang tải...
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="text-gray-600 text-xs text-center py-6">
                Không có cặp nào
              </div>
            ) : (
              filteredMatches.map((m) => {
                const p1Data = allPlayers.find((p) => p.no === m.player1!.no);
                const p2Data = allPlayers.find((p) => p.no === m.player2!.no);
                const hasBoth = !!p1Data && !!p2Data;
                const isDone = !!m.winner;
                return (
                  <button
                    key={m.matchNumber}
                    disabled={!hasBoth}
                    onClick={() => {
                      if (p1Data && p2Data) onLoadMatchup(p1Data, p2Data);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg border transition-all ${
                      isDone
                        ? "border-gray-700/50 bg-gray-900/30 opacity-60"
                        : hasBoth
                          ? "border-yellow-600/30 bg-gray-900/60 hover:bg-yellow-900/20 hover:border-yellow-500/60"
                          : "border-gray-800 bg-gray-900/20 opacity-40 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-600 text-[10px] shrink-0 w-5 text-right">
                        {m.matchNumber}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-blue-300 text-[11px] font-medium truncate">
                            {m.player1!.name}
                          </span>
                          <span className="text-gray-600 text-[10px]">vs</span>
                          <span className="text-red-300 text-[11px] font-medium truncate">
                            {m.player2!.name}
                          </span>
                        </div>
                      </div>
                      {isDone && (
                        <span className="text-green-600 text-[10px] shrink-0">
                          ✓
                        </span>
                      )}
                      {!hasBoth && (
                        <span className="text-gray-600 text-[10px] shrink-0">
                          N/A
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {devTab === "weights" && (
        <>
          {/* Effect rows */}
          <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">
            {Object.entries(defaultItems).map(([effectName, items]) => (
              <div key={effectName}>
                <div className="text-yellow-400/80 text-xs font-bold mb-1">
                  {effectName}
                </div>
                {items.map((item, i) => {
                  const currentWeight =
                    overrides[effectName]?.[i] !== undefined
                      ? overrides[effectName][i]
                      : item.weight;
                  const isOverridden = overrides[effectName]?.[i] !== undefined;
                  return (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <span
                        className={`flex-1 text-[11px] truncate ${isOverridden ? "text-yellow-200" : "text-gray-400"}`}
                        title={item.label}
                      >
                        {item.label.replace(/\s*\(\d+%\)/, "")}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={currentWeight}
                        onChange={(e) => {
                          const v = Math.max(
                            0,
                            Math.min(100, Number(e.target.value)),
                          );
                          onOverrideChange(effectName, i, v);
                        }}
                        className={`w-14 text-center text-xs rounded px-1 py-0.5 border ${
                          isOverridden
                            ? "bg-yellow-900/40 border-yellow-500/60 text-yellow-200"
                            : "bg-gray-800 border-gray-600 text-gray-300"
                        } focus:outline-none focus:border-yellow-400`}
                      />
                      <span className="text-gray-500 text-[10px]">%</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-yellow-500/30">
            <button
              onClick={onReset}
              className="w-full text-xs py-1 rounded bg-gray-800 hover:bg-yellow-800/40 border border-gray-600 hover:border-yellow-500/60 text-gray-400 hover:text-yellow-300 transition-colors"
            >
              Reset tất cả về mặc định
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const BattleZonePage = () => {
  const [battleType, setBattleType] = useState<BattleType | null>(null);

  if (!battleType) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-8"
        style={{
          backgroundImage: `url(${wheelBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-4">
              Battle Zone
            </h1>
            <p className="text-gray-300 text-lg">Choose your battle type</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setBattleType("pve")}
              className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-2xl p-12 transition-all duration-300 hover:scale-105 hover:border-blue-500 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-2">PvE</h2>
                <p className="text-gray-400">Player vs Environment</p>
              </div>
            </button>

            <button
              onClick={() => setBattleType("pvp")}
              className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-2xl p-12 transition-all duration-300 hover:scale-105 hover:border-red-500 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-2">PvP</h2>
                <p className="text-gray-400">Player vs Player</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (battleType === "pve") {
    return <PvEBattlePage onBack={() => setBattleType(null)} />;
  }

  return <PvPBattlePage onBack={() => setBattleType(null)} />;
};

interface PvPBattlePageProps {
  onBack: () => void;
}

const PvPBattlePage = ({ onBack }: PvPBattlePageProps) => {
  const [selectedMode, setSelectedMode] = useState<
    "stats-comparison" | "wheel-of-truth" | null
  >(null);

  if (!selectedMode) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-8"
        style={{
          backgroundImage: `url(${wheelBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="max-w-4xl w-full">
          <button
            onClick={onBack}
            className="mb-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2"
          >
            <span>←</span> Back
          </button>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-4">
              PvP Battle
            </h1>
            <p className="text-gray-300 text-lg">Choose your battle mode</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setSelectedMode("stats-comparison")}
              className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-2xl p-12 transition-all duration-300 hover:scale-105 hover:border-purple-500 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Stats Comparison
                </h2>
                <p className="text-gray-400">
                  Compare player stats side by side
                </p>
              </div>
            </button>

            <button
              onClick={() => setSelectedMode("wheel-of-truth")}
              className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-2xl p-12 transition-all duration-300 hover:scale-105 hover:border-yellow-500 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="text-6xl mb-4">🎡</div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Wheel of Truth
                </h2>
                <p className="text-gray-400">Spin the wheel based on stats</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedMode === "stats-comparison") {
    return <StatsComparisonMode onBack={() => setSelectedMode(null)} />;
  }

  return <WheelOfTruthMode onBack={() => setSelectedMode(null)} />;
};

/** When launched from the tournament bracket, pass these to save the result back. */
export interface TournamentMatchContext {
  matchNumber: number;
  player1No: number;
  player2No: number;
  existingWinnerNo?: number;
  existingScore?: string | null;
  existingSpecialEvent?: string | null;
  existingNote?: string | null;
}

export interface TournamentSaveResult {
  winnerNo: number;
  score: string | null;
  specialEvent: string | null;
  note: string | null;
}

interface BattleModeProps {
  onBack: () => void;
  isWebView?: boolean;
  /** If set, StatsComparisonMode operates in tournament mode */
  tournamentMatch?: TournamentMatchContext;
  onSaveTournamentResult?: (result: TournamentSaveResult) => void;
}

// Race tier for tie-breaker (lower tier number = stronger race, wins tie)
const RACE_TIERS: Record<string, number> = {
  God: 1,
  Demon: 2,
  "Primordial Being": 3,
  "Demi-God": 4,
  Angel: 5,
  Reincarnator: 6,
  Dragon: 7,
  Giant: 8,
  Vampire: 9,
  Werebeast: 10,
  Uma: 11,
  Spirit: 12,
  Elf: 13,
  Dryad: 14,
  Merfolk: 15,
  Orc: 16,
  Troll: 17,
  Skeleton: 18,
  Dwarf: 19,
  Human: 20,
  Gnome: 21,
  Goblin: 22,
};

// PvP Player data with calculated stats
interface PvPPlayerData {
  no: number;
  name: string;
  username: string;
  race: string;
  raceTier: number;
  stats: CharacterStats;
  baseStats: CharacterStats;
  breakdown: EffectSourceBreakdown[];
  character?: Character;
}

// Combat round result
interface RoundResult {
  stat: string;
  statLabel: string;
  player1Value: number;
  player2Value: number;
  winner: "player1" | "player2" | "tie";
}

// Combat result
interface CombatResult {
  rounds: RoundResult[];
  player1Score: number;
  player2Score: number;
  startPlayer1Score: number; // Score before rounds (for effectiveScores calculation)
  startPlayer2Score: number;
  winner: "player1" | "player2";
  tieBreaker?: "race" | null;
}

const STAT_ORDER: { key: keyof CharacterStats; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "spd", label: "SPD" },
  { key: "dur", label: "DUR" },
  { key: "iq", label: "IQ" },
  { key: "biq", label: "BIQ" },
  { key: "ma", label: "MA" },
];

// Normalize full stat names (from effects/types.ts) to short keys (from types/character.ts)
const STAT_NAME_MAP: Record<string, keyof CharacterStats> = {
  strength: "str",
  speed: "spd",
  durability: "dur",
  iq: "iq",
  biq: "biq",
  ma: "ma",
  str: "str",
  spd: "spd",
  dur: "dur",
};
function normalizeStatKey(stat: string): keyof CharacterStats {
  return STAT_NAME_MAP[stat.toLowerCase()] ?? (stat as keyof CharacterStats);
}

/** All short stat keys — single source of truth. */
const _ALL_STAT_KEYS: (keyof CharacterStats)[] = ["str", "spd", "dur", "iq", "biq", "ma"];

// Race stat roll weights (values 1-10, index 0 = value 1)
// Source: public/document/race-weight-stats.txt
// Skeleton: dùng sub-race để xác định race, IQ cố định 1
const RACE_STAT_WEIGHTS: Record<string, Record<keyof CharacterStats, number[]>> = {
  goblin:           { str: [10,10,15,18,25,10,5,3,2,2], spd: [10,15,15,15,15,15,5,5,3,2], dur: [10,10,15,20,15,15,10,2,2,1], iq: [15,15,10,10,20,15,5,5,3,2], biq: [5,10,10,15,23,15,10,5,5,2], ma: [15,15,15,10,10,10,10,5,5,5] },
  gnome:            { str: [15,10,10,13,22,15,5,5,3,2], spd: [10,15,15,15,15,15,5,5,3,2], dur: [15,10,10,10,30,10,7,3,3,2], iq: [10,10,5,5,15,25,15,5,5,5], biq: [15,15,15,15,10,10,10,5,3,2], ma: [20,20,15,15,10,5,5,5,3,2] },
  human:            { str: [15,15,10,10,20,10,5,5,5,5], spd: [15,10,10,10,20,15,10,5,3,2], dur: [15,7,8,9,20,16,14,6,3,2], iq: [15,5,5,5,15,15,15,12,8,5], biq: [10,5,5,5,15,15,20,10,10,5], ma: [15,5,5,5,20,10,15,5,5,15] },
  dwarf:            { str: [5,7,8,7,13,20,15,10,9,6], spd: [20,15,15,15,15,5,5,5,3,2], dur: [5,5,5,5,15,20,20,10,8,7], iq: [15,10,10,5,20,12,12,8,5,3], biq: [5,5,5,10,15,20,20,10,5,5], ma: [12,12,12,4,4,12,24,10,5,5] },
  troll:            { str: [10,5,10,5,20,20,15,5,5,5], spd: [15,10,10,10,20,15,5,5,5,5], dur: [6,7,8,9,10,35,10,5,5,5], iq: [15,15,15,5,25,10,5,5,3,2], biq: [5,5,5,10,15,20,20,10,5,5], ma: [12,12,12,4,4,12,24,10,5,5] },
  orc:              { str: [2,3,4,5,6,35,20,10,8,7], spd: [15,15,15,15,15,15,4,2,2,2], dur: [5,5,7,7,13,23,20,10,5,5], iq: [15,15,15,5,25,10,5,5,3,2], biq: [2,3,4,5,6,35,18,12,8,7], ma: [10,5,5,15,10,20,15,10,5,5] },
  merfolk:          { str: [5,10,10,10,25,20,10,5,3,2], spd: [5,5,5,10,15,20,15,15,5,5], dur: [7,8,14,16,20,20,5,5,3,2], iq: [5,5,7,9,28,18,10,8,5,5], biq: [10,10,15,15,15,15,5,5,5,5], ma: [20,15,15,15,10,5,5,5,5,5] },
  dryad:            { str: [30,10,10,5,5,5,5,5,5,20], spd: [45,10,10,5,5,5,5,5,5,5], dur: [30,5,5,10,10,5,5,5,5,20], iq: [20,5,5,5,20,10,10,5,5,15], biq: [20,20,20,10,5,5,5,5,5,5], ma: [55,5,5,5,5,5,5,5,5,5] },
  elf:              { str: [15,10,5,10,20,15,10,5,5,5], spd: [15,5,10,5,10,25,15,5,5,5], dur: [10,10,5,5,10,25,20,5,5,5], iq: [10,5,5,5,15,25,12,10,8,5], biq: [20,4,4,4,4,30,15,10,5,4], ma: [10,5,15,5,15,15,15,8,7,5] },
  spirit:           { str: [10,10,10,10,10,10,10,10,10,10], spd: [10,10,10,10,10,10,10,10,10,10], dur: [10,10,10,10,10,10,10,10,10,10], iq: [10,10,10,10,10,10,10,10,10,10], biq: [10,10,10,10,10,10,10,10,10,10], ma: [10,10,10,10,10,10,10,10,10,10] },
  uma:              { str: [5,7,7,7,15,25,20,8,3,3], spd: [3,3,6,6,24,24,16,6,7,5], dur: [8,7,7,14,16,16,12,12,4,4], iq: [5,10,15,10,25,15,5,5,5,5], biq: [10,10,15,10,15,15,10,5,5,5], ma: [55,5,5,5,5,5,5,5,5,5] },
  werebeast:        { str: [10,5,5,15,15,15,15,10,5,5], spd: [10,10,5,5,20,20,10,10,5,5], dur: [15,5,5,5,30,5,15,10,5,5], iq: [10,10,5,10,20,20,10,5,5,5], biq: [5,5,5,15,20,20,15,5,5,5], ma: [15,5,5,15,15,10,10,15,5,5] },
  vampire:          { str: [20,5,5,5,5,20,20,5,5,10], spd: [5,5,7,7,8,18,33,7,5,5], dur: [10,5,5,5,15,20,20,5,5,10], iq: [5,5,5,15,25,20,15,5,3,2], biq: [5,5,5,15,20,20,15,5,5,5], ma: [15,5,5,15,15,10,10,15,5,5] },
  giant:            { str: [5,5,5,10,10,25,25,5,5,5], spd: [15,15,15,15,15,15,4,2,2,2], dur: [5,5,5,10,10,20,20,5,5,15], iq: [10,10,5,5,10,15,25,10,5,5], biq: [15,10,10,5,15,15,5,10,10,5], ma: [40,5,5,5,5,5,20,5,5,5] },
  dragon:           { str: [12,3,3,3,3,25,31,5,5,10], spd: [15,5,5,5,15,15,15,15,5,5], dur: [5,5,5,10,10,20,15,10,10,10], iq: [15,5,5,5,15,20,5,10,15,5], biq: [20,10,5,5,10,20,15,5,5,5], ma: [20,5,5,5,20,15,15,5,5,5] },
  angel:            { str: [10,10,10,10,10,10,10,10,10,10], spd: [10,10,10,10,10,10,10,10,10,10], dur: [10,10,10,10,10,10,10,10,10,10], iq: [10,10,10,10,10,10,10,10,10,10], biq: [10,10,10,10,10,10,10,10,10,10], ma: [10,10,10,10,10,10,10,10,10,10] },
  "demi-god":       { str: [20,5,5,5,10,20,5,5,5,20], spd: [15,5,5,5,35,10,5,5,5,10], dur: [15,10,5,5,5,25,15,5,5,10], iq: [25,5,5,5,10,15,15,5,5,10], biq: [20,5,5,5,5,25,10,5,5,15], ma: [20,5,5,5,10,15,5,15,5,15] },
  "primordial being": { str: [15,5,5,5,5,5,35,10,5,10], spd: [15,5,5,5,20,20,5,5,5,15], dur: [15,5,5,10,5,25,10,10,10,5], iq: [15,5,5,15,5,15,15,5,5,15], biq: [15,5,5,15,15,15,15,5,5,5], ma: [20,5,5,5,20,10,10,5,5,15] },
  demon:            { str: [20,5,5,5,5,10,10,10,15,15], spd: [10,4,4,4,4,35,14,11,4,10], dur: [15,5,5,5,15,15,15,5,5,15], iq: [20,5,5,5,20,10,5,5,5,20], biq: [20,5,5,5,5,5,35,5,5,10], ma: [15,5,5,5,15,25,5,5,5,15] },
  god:              { str: [20,5,5,5,5,10,10,10,15,15], spd: [15,2,3,4,4,4,44,4,5,15], dur: [15,5,5,5,10,5,30,5,5,15], iq: [20,5,5,5,5,5,30,5,5,15], biq: [20,5,5,5,5,5,20,10,5,20], ma: [20,5,5,5,25,5,5,5,5,20] },
  reincarnator:     { str: [10,10,10,10,10,10,10,10,10,10], spd: [10,10,10,10,10,10,10,10,10,10], dur: [10,10,10,10,10,10,10,10,10,10], iq: [10,10,10,10,10,10,10,10,10,10], biq: [10,10,10,10,10,10,10,10,10,10], ma: [10,10,10,10,10,10,10,10,10,10] },
  symbiosis:        { str: [10,10,10,10,10,10,10,10,10,10], spd: [10,10,10,10,10,10,10,10,10,10], dur: [10,10,10,10,10,10,10,10,10,10], iq: [10,10,10,10,10,10,10,10,10,10], biq: [10,10,10,10,10,10,10,10,10,10], ma: [10,10,10,10,10,10,10,10,10,10] },
};

function getRaceForStatRoll(character: { race?: { race?: string; subRace?: string } } | undefined): string {
  const race = (character?.race?.race || "").toLowerCase();
  if (race === "skeleton") {
    // Dùng sub-race (có thể là "Dwarf", "Human", etc.)
    const sub = (character?.race?.subRace || "").replace(/[()]/g, "").trim().toLowerCase();
    return sub || "human"; // fallback human nếu không có sub-race
  }
  return race;
}

const STAT_COLORS: Record<keyof CharacterStats, string> = {
  str: "#ef4444", spd: "#3b82f6", dur: "#84cc16", iq: "#06b6d4", biq: "#a855f7", ma: "#f97316",
};

/**
 * Unified persistent stat applier.
 * ALL additive assignments to CharacterStats go through here.
 * NOTE: round comparison values (p1Val/p2Val) and stat swaps are intentionally excluded.
 */
function applyStatDelta(
  stats: CharacterStats,
  statKey: keyof CharacterStats,
  delta: number,
): void {
  stats[statKey] = (stats[statKey] || 0) + delta;
}

/**
 * Resolve effect stat string ("all"/"highest"/"lowest"/"random"/specific) → list of keys.
 * Uses currentStats to determine highest/lowest at the moment of application.
 */
function resolveStatTargets(
  stat: string | undefined,
  currentStats: CharacterStats,
): (keyof CharacterStats)[] {
  if (!stat || stat === "all") return _ALL_STAT_KEYS;
  if (stat === "highest") {
    const maxVal = Math.max(..._ALL_STAT_KEYS.map((k) => currentStats[k] || 0));
    return [_ALL_STAT_KEYS.find((k) => (currentStats[k] || 0) === maxVal) ?? "str"];
  }
  if (stat === "lowest") {
    const minVal = Math.min(..._ALL_STAT_KEYS.map((k) => currentStats[k] || 0));
    return [_ALL_STAT_KEYS.find((k) => (currentStats[k] || 0) === minVal) ?? "str"];
  }
  if (stat === "random") {
    return [_ALL_STAT_KEYS[Math.floor(Math.random() * _ALL_STAT_KEYS.length)]];
  }
  return [normalizeStatKey(stat)];
}

// ── Step-by-step combat interfaces ───────────────────────────────────────────
interface CarryOverEffect {
  player: "player1" | "player2";
  source: string;
  stat: keyof CharacterStats;
  value: number;
  description: string;
}

interface RoundEvent {
  player: "player1" | "player2";
  source: string;
  description: string;
  type: "stat_boost" | "stat_debuff" | "point_change" | "carry_over" | "info";
}

interface PointChange {
  player: "player1" | "player2";
  delta: number;
  reason: string;
}

interface RoundLog {
  roundIndex: number;
  statLabel: string;
  statKey: string; // e.g. "str", "spd", "dur", "iq", "biq", "ma"
  p1ValueUsed: number;
  p2ValueUsed: number;
  winner: "player1" | "player2" | "tie";
  p1Score: number;
  p2Score: number;
  events: RoundEvent[];
  pointChanges: PointChange[];
  carryOverToNext: CarryOverEffect[];
}

// Dothraki: 6 rules
// 1 = đảo stats đối thủ (STR↔MA, SPD↔BIQ, DUR↔IQ)
// 2 = đảo STR↔BIQ của ta
// 3 = đảo SPD↔IQ của ta
// 4 = đảo DUR↔MA của ta
// 5 = +4 all stats ta, đối thủ +3 điểm khởi đầu
// 6 = +5 all stats đối thủ, ta +1 all stats per điểm ghi được sau trận
type DothrakiRule = 1 | 2 | 3 | 4 | 5 | 6 | null;

interface StepCombatState {
  p1Stats: CharacterStats;
  p2Stats: CharacterStats;
  p1Score: number;
  p2Score: number;
  startP1Score: number; // Starting score before rounds (for liveScore calculation)
  startP2Score: number;
  p1CarryOver: CarryOverEffect[];
  p2CarryOver: CarryOverEffect[];
  resolvedRounds: RoundResult[];
  roundLogs: RoundLog[];
  // track per-combat one-time flags
  p1TenacityFired: boolean;
  p2TenacityFired: boolean;
  p1ConquerorFired: boolean;
  p2ConquerorFired: boolean;
  // during_combat handlers chỉ execute 1 lần (trừ on_round_win/on_round_lose)
  p1FiredHandlers: Set<string>;
  p2FiredHandlers: Set<string>;
  // Dothraki: rule per player (null = not Dothraki or not yet spun)
  p1DothrakiRule: DothrakiRule;
  p2DothrakiRule: DothrakiRule;
}

// ── Inventory item for panel ──────────────────────────────────────────────────
interface InventoryItem {
  sourceType: string;
  name: string;
  description: string;
}

function buildInventoryList(char: Character): InventoryItem[] {
  const items: InventoryItem[] = [];
  const add = (sourceType: string, name: string, description?: string) => {
    if (!name) return;
    const desc = description ?? EffectRegistry.get(sourceType as any, name)?.description ?? "";
    items.push({ sourceType, name, description: desc });
  };
  if (char.race?.race) add("race", char.race.race);
  if (char.race?.subRace) add("sub_race", char.race.subRace);
  for (const a of Array.isArray(char.archetypes) ? char.archetypes : [])
    add("archetype", a);
  for (const na of Array.isArray(char.nestedArchetypes)
    ? char.nestedArchetypes
    : []) {
    if (na.subType) add("archetype_sub", na.subType);
  }
  for (const q of Array.isArray(char.quirks) ? char.quirks : []) {
    if (!q.isLost) add("quirk", q.name);
  }
  for (const p of Array.isArray(char.powers) ? char.powers : []) {
    if (!p.isLost) add("power", typeof p === "string" ? p : p.name);
  }
  for (const w of Array.isArray(char.weapons) ? char.weapons : []) {
    const name = typeof w === "string" ? w : w?.name;
    if (name) add("weapon", name);
  }
  const allGear = [
    ...(Array.isArray(char.gear?.normalGear) ? char.gear!.normalGear : []),
    ...(Array.isArray(char.gear?.legacyGear) ? char.gear!.legacyGear : []),
  ];
  for (const g of allGear) if (!g.isLost) add("gear", g.name);
  const runes = Array.isArray(char.runes?.runes) ? char.runes!.runes : [];
  for (const r of runes) if (!r.isLost) add("rune", r.name);
  if (char.runes?.runeword) add("runeword", char.runes.runeword);
  for (const h of Array.isArray(char.houses) ? char.houses : []) {
    if (!h.isLost) add("house", h.name);
  }
  for (const nh of Array.isArray(char.nestedHouses) ? char.nestedHouses : []) {
    if (!nh.isLost && nh.subType && !nh.subTypeIsLost)
      add("house_sub", nh.subType);
  }
  for (const cd of Array.isArray(char.charDevs) ? char.charDevs : []) {
    if (!cd.isLost) add("char_dev", cd.name);
  }
  for (const l of Array.isArray(char.lover) ? char.lover : []) {
    if (!l.isLost) add("lover", l.name);
  }
  return items;
}

/** Tính lại stats của character có loại trừ các disabled sources */
function calcStatsWithDisabled(
  char: Character,
  playerNo: number,
  disabledItems: Set<string>,
): CharacterStats {
  const sources = EffectResolver.gatherEffectSources(char);
  // Mark disabled
  for (const src of sources) {
    const key = `${playerNo}-${src.type}-${src.name}`;
    if (disabledItems.has(key)) {
      src.isDisabled = true;
    }
  }
  const result = EffectResolver.resolveImmediateEffects(
    sources,
    // baseStats in resolver format (strength/speed/...)
    {
      strength: char.stats.str,
      speed: char.stats.spd,
      durability: char.stats.dur,
      iq: char.stats.iq,
      biq: char.stats.biq,
      ma: char.stats.ma,
    },
    { isPvE: false },
    char,
  );
  return {
    str: result.totalStats.strength,
    spd: result.totalStats.speed,
    dur: result.totalStats.durability,
    iq: result.totalStats.iq,
    biq: result.totalStats.biq,
    ma: result.totalStats.ma,
  };
}

/**
 * Calculate combat stats including before_combat modifiers based on opponent race.
 * These stats are baked into the initial StepCombatState and used for all rounds.
 */
function applyBeforeCombatStatMods(
  base: CharacterStats,
  char: Character,
  charNo: number,
  disabledItems: Set<string>,
  opponentRace: string,
  targetFilter: "self" | "opponent",
  selfRaceTier?: number,
  opponentRaceTier?: number,
  opponentChar?: Character | null,
): void {
  const fx = EffectResolver.calculateCharacterEffects(char, { isPvE: false });
  for (const ce of fx.combatEffects) {
    if (ce.isActive === false) continue;
    if (ce.effect?.timing !== "before_combat") continue;
    if (ce.effect?.type !== "stat_modifier" && ce.effect?.type !== "debuff")
      continue;
    if (ce.effect?.value === undefined || !ce.effect?.stat) continue;
    if ((ce.effect.target || "self") !== targetFilter) continue;
    // Skip effects with customHandler — those are resolved separately (e.g. via wheel)
    // Exception: kings_landing_penalty_check applies -10 IQ in before_combat phase
    const handler = (ce.effect as any).customHandler;
    if (handler && handler !== "kings_landing_penalty_check") continue;
    if (handler === "kings_landing_penalty_check") {
      // Check exempt conditions: God/Demi-God race or Devotee archetype
      const selfRace = (char as any).race?.race?.toLowerCase() ?? '';
      const exemptRaces = ['god', 'demi god', 'demi-god', 'demigod'];
      const isExemptByRace = exemptRaces.some((r) => selfRace.includes(r));
      const archetypes: string[] = ((char as any).archetypes || []).map((a: any) =>
        typeof a === 'string' ? a : (a?.name ?? '')
      );
      const isDevotee = archetypes.some((a: string) => a.toLowerCase().includes('devotee'));
      if (isExemptByRace || isDevotee) continue;
      applyStatDelta(base, 'iq', -10);
      continue;
    }

    // Check disabled
    const srcName = ce.source?.name || "?";
    const srcType = ce.source?.type || "?";
    if (disabledItems.has(`${charNo}-${srcType}-${srcName}`)) continue;

    // Check conditions
    const conditions: any[] = (ce.effect as any).conditions || [];
    const conditionMet = conditions.every((cond: any) => {
      if (cond.type === "race_match" && cond.races) {
        return cond.races.some(
          (r: string) => r.toLowerCase() === opponentRace.toLowerCase(),
        );
      }
      if (cond.type === "race_match" && cond.excludeRaces) {
        return !cond.excludeRaces.some(
          (r: string) => r.toLowerCase() === opponentRace.toLowerCase(),
        );
      }
      if (cond.type === "race_tier_compare" && cond.tierOperator && selfRaceTier !== undefined && opponentRaceTier !== undefined) {
        if (cond.tierOperator === "<") return selfRaceTier < opponentRaceTier;
        if (cond.tierOperator === ">") return selfRaceTier > opponentRaceTier;
        if (cond.tierOperator === "=") return selfRaceTier === opponentRaceTier;
      }
      if (cond.type === "stat_compare" && cond.stat && cond.compareWith === "opponent" && opponentChar) {
        const selfStatVal = (char as any).stats?.[cond.stat] ?? (base as any)[cond.stat] ?? 0;
        const oppStatVal = (opponentChar as any).stats?.[cond.stat] ?? 0;
        if (cond.operator === ">") return selfStatVal > oppStatVal;
        if (cond.operator === "<") return selfStatVal < oppStatVal;
        if (cond.operator === ">=") return selfStatVal >= oppStatVal;
        if (cond.operator === "<=") return selfStatVal <= oppStatVal;
        if (cond.operator === "=") return selfStatVal === oppStatVal;
      }
      return true;
    });
    if (!conditionMet) continue;

    const val = ce.effect.value;
    const targets = resolveStatTargets(ce.effect.stat, base);
    for (const k of targets) applyStatDelta(base, k, val);
  }
}

function calcStatsWithBeforeCombat(
  char: Character,
  playerNo: number,
  disabledItems: Set<string>,
  opponentRace: string,
  opponentChar: Character | null,
  opponentNo: number,
  opponentDisabledItems: Set<string>,
  selfRace: string,
  selfRaceTier?: number,
  opponentRaceTier?: number,
): CharacterStats {
  const base = calcStatsWithDisabled(char, playerNo, disabledItems);

  // Apply self's own before_combat effects (target: "self")
  applyBeforeCombatStatMods(
    base,
    char,
    playerNo,
    disabledItems,
    opponentRace,
    "self",
    selfRaceTier,
    opponentRaceTier,
    opponentChar,
  );

  // Uno Reverse Card: debuff từ đối thủ quay lại đối thủ, debuff của ta áp vào ta
  const selfWeapons: string[] = ((char as any).weapons || []).map((w: any) =>
    (typeof w === "string" ? w : w?.name ?? "").toLowerCase()
  );
  const hasUnoReverse = selfWeapons.includes("uno reverse card");

  // Apply opponent's before_combat effects that target "opponent" (i.e., affect us)
  // Skip if we have Uno Reverse Card (debuffs bounce back to opponent instead)
  // Skip debuffs if either player has Fair Duel active
  const selfHasFairDuel = ((char as any).powers || [])
    .filter((pw: any) => !pw.isLost)
    .some((pw: any) => (typeof pw === "string" ? pw : pw?.name ?? "").toLowerCase() === "fair duel")
    && !disabledItems.has(`${playerNo}-power-Fair Duel`);
  const oppHasFairDuelBC = opponentChar
    ? ((opponentChar as any).powers || [])
        .filter((pw: any) => !pw.isLost)
        .some((pw: any) => (typeof pw === "string" ? pw : pw?.name ?? "").toLowerCase() === "fair duel")
      && !opponentDisabledItems.has(`${opponentNo}-power-Fair Duel`)
    : false;
  const fairDuelActiveBC = selfHasFairDuel || oppHasFairDuelBC;

  if (opponentChar && !hasUnoReverse && !fairDuelActiveBC) {
    applyBeforeCombatStatMods(
      base,
      opponentChar,
      opponentNo,
      opponentDisabledItems,
      selfRace,
      "opponent",
      opponentRaceTier,
      selfRaceTier,
      char,
    );
  }

  // Uno Reverse Card: ta có URC → debuff của ta (target: "opponent") cũng apply vào ta
  if (hasUnoReverse) {
    applyBeforeCombatStatMods(
      base,
      char,
      playerNo,
      disabledItems,
      opponentRace,
      "opponent",
      selfRaceTier,
      opponentRaceTier,
      opponentChar,
    );
  }

  // Slayer: "Slayer - <Race>" → +2 STR, +3 BIQ, +2 MA if opponent race matches
  const archetypes: string[] = (char as any).archetypes || [];
  const slayerEntry = archetypes.find((a: string) =>
    /^slayer\s*-/i.test(a.trim()),
  );
  if (slayerEntry) {
    const match = slayerEntry.match(/^slayer\s*-\s*([^\s(]+)/i);
    const targetRace = match ? match[1].toLowerCase() : "";
    if (targetRace && opponentRace.toLowerCase() === targetRace) {
      applyStatDelta(base, "str", 2);
      applyStatDelta(base, "biq", 3);
      applyStatDelta(base, "ma", 2);
    }
  }

  return base;
}

// ── Floating Stat Bubbles — fixed overlay, floats on screen ──────────────────
interface StatBubble {
  id: number;
  text: string;
  isPositive: boolean;
  /** vị trí ngang: % từ left của màn hình */
  x: number;
  /** vị trí dọc khởi điểm: % từ bottom của màn hình */
  startY: number;
}

let _bubbleIdCounter = 0;

const FloatingStatBubblesOverlay = ({
  p1Bubbles,
  p2Bubbles,
}: {
  p1Bubbles: StatBubble[];
  p2Bubbles: StatBubble[];
}) => {
  const all = [...p1Bubbles, ...p2Bubbles];
  if (all.length === 0) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {all.map((b) => (
        <div
          key={b.id}
          className="absolute animate-float-up-fade"
          style={{ left: `${b.x}%`, bottom: `${b.startY}%` }}
        >
          <span
            className={`inline-block px-2.5 py-1 rounded-full text-sm font-black shadow-xl select-none whitespace-nowrap ${
              b.isPositive
                ? "bg-green-500 text-white drop-shadow-[0_0_8px_rgba(74,222,128,0.9)]"
                : "bg-red-500 text-white drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]"
            }`}
          >
            {b.text}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Sidebar Avatar Banner ──────────────────────────────────────────────────────
const SidebarAvatarBanner = ({
  player,
  accent,
  audioTracks,
  otherSideHasAudio,
  audioStopped,
  silenced,
  blurred,
}: {
  player: PvPPlayerData;
  accent: "blue" | "red";
  audioTracks?: CombatAudioTrack[];
  otherSideHasAudio?: boolean;
  audioStopped?: boolean;
  silenced?: boolean;
  blurred?: boolean;
}) => {
  const [extIndex, setExtIndex] = React.useState(0);
  const nameColor = accent === "blue" ? "text-blue-300/80" : "text-red-300/80";
  const race = player.character?.race?.race || player.race || "";
  const subRace = player.character?.race?.subRace || "";
  const allFailed = extIndex >= AVATAR_EXTENSIONS.length;
  const side = accent === "blue" ? "left" : "right";
  const tracks = audioTracks ?? [];
  return (
    // Outer wrapper — không overflow-hidden để panel popup không bị clip
    <div className="relative shrink-0">
      {/* Blind: blur toàn bộ sidebar panel (áp dụng ở wrapper cha, xem BattleZonePage) */}
      {/* Mute/Deaf badge */}
      {silenced && (
        <div className="absolute top-2 left-2 z-30 flex items-center gap-1 bg-black/70 rounded px-2 py-0.5 text-xs text-gray-300 font-semibold">
          🔇 Silenced
        </div>
      )}
      {/* Avatar area — overflow-hidden chỉ áp dụng ở đây */}
      <div className={`relative rounded-t-2xl overflow-hidden h-48 bg-gray-800 ${false && blurred ? "blur-sm" : ""}`}>
        {!allFailed ? (
          <img
            key={extIndex}
            src={getAvatarUrl(player.no, extIndex)}
            alt={player.name}
            className="w-full h-full object-cover object-top"
            onError={() => setExtIndex((i) => i + 1)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-6xl font-black select-none">
            {player.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-900/20 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3">
          <p className="text-white font-bold text-sm truncate leading-tight">
            {player.name}
          </p>
          <p className={`text-xs truncate ${nameColor}`}>
            {race}
            {subRace ? ` / ${subRace}` : ""}
          </p>
        </div>
      </div>
      {/* Audio button — nằm ngoài overflow-hidden, absolute so với outer wrapper */}
      {tracks.length > 0 && (
        <div className="absolute bottom-2 right-2 z-20">
          <CombatAudioController
            tracks={tracks}
            otherSideHasAudio={otherSideHasAudio ?? false}
            side={side}
            accent={accent}
            stopped={audioStopped}
            silenced={silenced}
          />
        </div>
      )}
    </div>
  );
};

// ── PlayerCard for StatsComparison — JRPG battle style ────────────────────────
interface SCPlayerCardProps {
  player: PvPPlayerData;
  side: "left" | "right";
  isWinner: boolean;
  showWinner: boolean;
  displayStats?: CharacterStats | null;
}
const SCPlayerCard = ({
  player,
  side,
  isWinner,
  showWinner,
  displayStats,
}: SCPlayerCardProps) => {
  const stats = displayStats ?? player.stats;
  const isLeft = side === "left";
  const borderGlow =
    showWinner && isWinner
      ? "border-yellow-400/80 shadow-xl shadow-yellow-500/20"
      : isLeft
        ? "border-blue-500/60 shadow-lg shadow-blue-900/30"
        : "border-red-500/60 shadow-lg shadow-red-900/30";
  const race = player.character?.race?.race || player.race;
  const subRace = player.character?.race?.subRace || "";
  const total = STAT_ORDER.reduce((s, { key }) => s + (stats[key] || 0), 0);
  const maxStat = Math.max(...STAT_ORDER.map(({ key }) => stats[key] || 0));

  // Bar gradient per stat
  const BAR_COLORS: Record<string, string> = {
    str: "from-orange-600 to-red-500",
    spd: "from-cyan-500 to-blue-400",
    dur: "from-lime-600 to-green-500",
    iq: "from-purple-500 to-violet-400",
    biq: "from-indigo-500 to-blue-500",
    ma: "from-pink-500 to-fuchsia-400",
  };

  return (
    <div
      className={`relative rounded-xl border-2 overflow-hidden transition-all duration-300 ${borderGlow}`}
      style={{
        background: "linear-gradient(160deg, #0f172a 60%, #1e1b4b 100%)",
      }}
    >
      {/* Decorative corner accent */}
      <div
        className={`absolute top-0 ${isLeft ? "left-0" : "right-0"} w-12 h-12 opacity-20`}
        style={{
          background: `radial-gradient(circle at ${isLeft ? "top left" : "top right"}, ${isLeft ? "#3b82f6" : "#ef4444"}, transparent 70%)`,
        }}
      />

      {/* ── Name plate ── */}
      <div
        className={`px-3 py-2 border-b ${isLeft ? "border-blue-700/40 bg-blue-950/40" : "border-red-700/40 bg-red-950/40"} flex items-center gap-2 ${!isLeft ? "flex-row-reverse" : ""}`}
      >
        <span
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${isLeft ? "bg-blue-800/60 text-blue-300" : "bg-red-800/60 text-red-300"}`}
        >
          #{player.no}
        </span>
        <div className={`flex-1 min-w-0 ${!isLeft ? "text-right" : ""}`}>
          <div className="text-sm font-black text-white truncate leading-tight tracking-wide">
            {player.name}
          </div>
          <div
            className={`text-[10px] font-medium truncate ${isLeft ? "text-blue-300/70" : "text-red-300/70"}`}
          >
            {race}
            {subRace ? ` · ${subRace}` : ""}
          </div>
        </div>
        {showWinner && isWinner && (
          <span className="text-yellow-300 text-[11px] font-black bg-yellow-500/20 border border-yellow-500/40 px-2 py-0.5 rounded-full shrink-0 animate-pulse">
            ★ WIN
          </span>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="px-3 py-2.5 space-y-1.5">
        {STAT_ORDER.map(({ key, label }) => {
          const val = stats[key] || 0;
          const pct = Math.min((val / 20) * 100, 100); // max 20 for bar
          const isTop = val === maxStat;
          const barGrad = BAR_COLORS[key] ?? "from-gray-500 to-gray-400";
          return (
            <div
              key={key}
              className={`flex items-center gap-2 ${!isLeft ? "flex-row-reverse" : ""}`}
            >
              <span
                className={`w-7 text-[10px] font-bold text-center shrink-0 ${isTop ? (isLeft ? "text-blue-300" : "text-red-300") : "text-gray-500"}`}
              >
                {label}
              </span>
              <div className="flex-1 bg-gray-800/70 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barGrad} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span
                className={`w-6 text-center text-[13px] font-black shrink-0 ${isTop ? "text-white" : "text-gray-400"}`}
              >
                {val}
              </span>
            </div>
          );
        })}

        {/* Total row */}
        <div
          className={`flex items-center gap-2 mt-1 pt-1.5 border-t ${isLeft ? "border-blue-800/40" : "border-red-800/40"} ${!isLeft ? "flex-row-reverse" : ""}`}
        >
          <span
            className={`w-7 text-[10px] font-bold text-center ${isLeft ? "text-blue-400/70" : "text-red-400/70"}`}
          >
            TTL
          </span>
          <div className="flex-1" />
          <span
            className={`w-6 text-center text-sm font-black ${isLeft ? "text-blue-300" : "text-red-300"}`}
          >
            {total}
          </span>
        </div>
      </div>

      {/* Bottom glow line */}
      <div
        className={`h-0.5 w-full ${isLeft ? "bg-gradient-to-r from-blue-500/60 via-blue-400/30 to-transparent" : "bg-gradient-to-l from-red-500/60 via-red-400/30 to-transparent"}`}
      />
    </div>
  );
};

export const StatsComparisonMode = ({
  onBack,
  tournamentMatch,
  onSaveTournamentResult,
}: BattleModeProps) => {
  const [allPlayers, setAllPlayers] = useState<PvPPlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm1, setSearchTerm1] = useState("");
  const [searchTerm2, setSearchTerm2] = useState("");
  const [player1, setPlayer1] = useState<PvPPlayerData | null>(null);
  const [player2, setPlayer2] = useState<PvPPlayerData | null>(null);
  const [audioResetKey, setAudioResetKey] = useState(0);
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [, setIsAnimating] = useState(false);
  const [, setCurrentRound] = useState(-1);
  const [focus1, setFocus1] = useState(false);
  const [focus2, setFocus2] = useState(false);
  const [leftTab, setLeftTab] = useState<"effects" | "inventory">("effects");
  const [rightTab, setRightTab] = useState<"effects" | "inventory">("effects");

  // Roundtable Hold pending state
  const [isPendingRoundtable, setIsPendingRoundtable] = useState(false);
  const [pendingLoser, setPendingLoser] = useState<
    "player1" | "player2" | null
  >(null);

  // Step-by-step combat state
  const [stepState, setStepState] = useState<StepCombatState | null>(null);
  const [stepRoundIndex, setStepRoundIndex] = useState(-1);
  const [pendingPreCombatCount, setPendingPreCombatCount] = useState(0);

  // Disabled items (click-to-disable in inventory panel)
  const [disabledItems, setDisabledItems] = useState<Set<string>>(new Set());
  const toggleItem = (no: number, sourceType: string, name: string) => {
    const key = `${no}-${sourceType}-${name}`;
    setDisabledItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Stats hiển thị trên card — computed later after dothrakiSpinResult is declared
  // See dothrakiPreviewStats + p1DisplayStats + p2DisplayStats below (after state declarations)

  // Tournament mode state
  const [tournamentSpecialEvent, setTournamentSpecialEvent] = useState(
    tournamentMatch?.existingSpecialEvent ?? "",
  );
  const [tournamentNote, setTournamentNote] = useState(
    tournamentMatch?.existingNote ?? "",
  );
  const isTournamentMode = !!tournamentMatch;

  // Tarnished selection for Roundtable sub-match
  const [tarnishedList, setTarnishedList] = useState<PvPPlayerData[]>([]);
  const [tarnishedSearchTerm, setTarnishedSearchTerm] = useState("");
  const [selectedTarnished, setSelectedTarnished] =
    useState<PvPPlayerData | null>(null);
  const [subCombatResult, setSubCombatResult] = useState<CombatResult | null>(
    null,
  );
  const [subIsAnimating, setSubIsAnimating] = useState(false);
  // Sub-combat round animation is not shown gradually; no-op setter used
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _setSubCurrentRound = (_: number) => {};

  // Load all players
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        ensureEffectsInitialized();
        const playerList: PvPPlayerData[] = [];
        const fetchPromises: Promise<void>[] = [];

        for (let i = 1; i <= 260; i++) {
          fetchPromises.push(
            fetch(getAssetPath(`/data/No${i}.txt`))
              .then(async (response) => {
                if (response.ok) {
                  const content = await response.text();
                  const char = CharacterParser.parseCharacterFile(content);

                  // Calculate stats with PvP context (isPvE: false)
                  const effects = EffectResolver.calculateCharacterEffects(
                    char,
                    { isPvE: false },
                  );
                  const pvpStats: CharacterStats = {
                    str: effects.totalStats.strength,
                    spd: effects.totalStats.speed,
                    dur: effects.totalStats.durability,
                    iq: effects.totalStats.iq,
                    biq: effects.totalStats.biq,
                    ma: effects.totalStats.ma,
                  };
                  // Raw spin-wheel stats (before any effect modifiers) for display in breakdown table
                  const pvpBaseStats: CharacterStats = { ...char.stats };
                  const breakdown =
                    EffectResolver.getCharacterEffectBreakdown(char);

                  const race = char.race?.race || "Human";
                  playerList.push({
                    no: char.no || i,
                    name: char.name || `Player ${i}`,
                    username: char.username || "",
                    race,
                    raceTier: RACE_TIERS[race] ?? 15,
                    stats: pvpStats,
                    baseStats: pvpBaseStats,
                    breakdown,
                    character: char,
                  });
                }
              })
              .catch(() => {}),
          );
        }

        await Promise.all(fetchPromises);
        // Sort by player number
        playerList.sort((a, b) => a.no - b.no);
        setAllPlayers(playerList);
        // Auto-select tournament players
        if (tournamentMatch) {
          const p1 =
            playerList.find((p) => p.no === tournamentMatch.player1No) ?? null;
          const p2 =
            playerList.find((p) => p.no === tournamentMatch.player2No) ?? null;
          setPlayer1(p1);
          setPlayer2(p2);
        }
      } catch (error) {
        console.error("Error loading players:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, []);

  // Filter players for search (show top 20 when no term, for immediate dropdown on focus)
  const filteredPlayers1 = useMemo(() => {
    if (!searchTerm1) return allPlayers.slice(0, 20);
    const term = searchTerm1.toLowerCase();
    return allPlayers
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.username.toLowerCase().includes(term) ||
          p.no.toString().includes(term),
      )
      .slice(0, 20);
  }, [allPlayers, searchTerm1]);

  const filteredPlayers2 = useMemo(() => {
    if (!searchTerm2) return allPlayers.slice(0, 20);
    const term = searchTerm2.toLowerCase();
    return allPlayers
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.username.toLowerCase().includes(term) ||
          p.no.toString().includes(term),
      )
      .slice(0, 20);
  }, [allPlayers, searchTerm2]);

  const filteredTarnished = useMemo(() => {
    if (!tarnishedSearchTerm) return tarnishedList;
    const term = tarnishedSearchTerm.toLowerCase();
    return tarnishedList.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.username.toLowerCase().includes(term) ||
        p.no.toString().includes(term),
    );
  }, [tarnishedList, tarnishedSearchTerm]);

  // Helper: check if player has active Roundtable Hold
  const hasRoundtableHold = (player: PvPPlayerData) =>
    player.character?.houses?.some(
      (h: any) => !h.isLost && h.name === "Roundtable Hold",
    ) ?? false;

  // ── Step-by-step: resolve 1 round ────────────────────────────────────────────
  const computeRoundStep = (
    roundIndex: number,
    state: StepCombatState,
    p1: PvPPlayerData,
    p2: PvPPlayerData,
    otpStats: Record<string, string> = {},
  ): { newState: StepCombatState; log: RoundLog } => {
    const { key, label } = STAT_ORDER[roundIndex];
    const events: RoundEvent[] = [];
    const pointChanges: PointChange[] = [];
    const carryOverToNext: CarryOverEffect[] = [];

    // Apply carry-over from previous round
    let p1Val = state.p1Stats[key] || 0;
    let p2Val = state.p2Stats[key] || 0;
    for (const co of state.p1CarryOver) {
      if (co.stat === key) {
        p1Val += co.value;
        events.push({
          player: "player1",
          source: co.source,
          description: `+${co.value} ${key.toUpperCase()} (từ round trước)`,
          type: "carry_over",
        });
      }
    }
    for (const co of state.p2CarryOver) {
      if (co.stat === key) {
        p2Val += co.value;
        events.push({
          player: "player2",
          source: co.source,
          description: `+${co.value} ${key.toUpperCase()} (từ round trước)`,
          type: "carry_over",
        });
      }
    }

    // Bash / Luminescence: apply debuff -3 random stat từ spin round trước (trước khi tính round này)
    if (roundIndex > 0) {
      const STAT_KEYS_FOR_DEBUFF: (keyof CharacterStats)[] = ["str", "spd", "dur", "iq", "biq", "ma"];
      const prevRoundWinner = state.resolvedRounds[state.resolvedRounds.length - 1]?.winner;
      const applyBashDebuffEarly = (winnerSide: "player1" | "player2", sourceName: string) => {
        const oppSide: "player1" | "player2" = winnerSide === "player1" ? "player2" : "player1";
        const spinKey = `${roundIndex - 1}-${sourceName}-${winnerSide}`;
        const spinResult = roundSpinResults[spinKey];
        if (!spinResult?.isSuccess) return;
        const alreadyApplied = events.some(
          (ev) => ev.player === oppSide && ev.source === sourceName && ev.type === "stat_debuff",
        );
        if (alreadyApplied) return;
        // Bash debuff -3 vào stat của round kế (p1Val/p2Val), random stat chỉ để log
        const randomStat = STAT_KEYS_FOR_DEBUFF[Math.floor(Math.random() * STAT_KEYS_FOR_DEBUFF.length)];
        if (oppSide === "player1") p1Val -= 3;
        else p2Val -= 3;
        events.push({
          player: oppSide,
          source: sourceName,
          description: `${sourceName}: -3 ${(randomStat as string).toUpperCase()} round này (debuff từ round trước)`,
          type: "stat_debuff",
        });
      };
      const p1EffBash = getPerRoundEffects(p1.character, p1.no);
      const p2EffBash = getPerRoundEffects(p2.character, p2.no);
      if (prevRoundWinner === "player1") {
        if (p1EffBash.onWin.includes("Bash")) applyBashDebuffEarly("player1", "Bash");
        if (p1EffBash.onWin.includes("Luminescence")) applyBashDebuffEarly("player1", "Luminescence");
      }
      if (prevRoundWinner === "player2") {
        if (p2EffBash.onWin.includes("Bash")) applyBashDebuffEarly("player2", "Bash");
        if (p2EffBash.onWin.includes("Luminescence")) applyBashDebuffEarly("player2", "Luminescence");
      }
    }

    // Dothraki: log active rule at round 0 (stats already swapped/boosted in startCombat)
    if (roundIndex === 0) {
      const logDothraki = (
        dSide: "player1" | "player2",
        rule: DothrakiRule,
      ) => {
        if (rule === null) return;
        const oppSide = dSide === "player1" ? "player2" : "player1";
        const RULE_DESC: Record<
          number,
          { player: "player1" | "player2"; desc: string }
        > = {
          1: {
            player: oppSide,
            desc: "Luật 1: Đã đảo stats đối thủ (STR↔MA, SPD↔BIQ, DUR↔IQ)",
          },
          2: { player: dSide, desc: "Luật 2: Đã đảo STR↔BIQ của Dothraki" },
          3: { player: dSide, desc: "Luật 3: Đã đảo SPD↔IQ của Dothraki" },
          4: { player: dSide, desc: "Luật 4: Đã đảo DUR↔MA của Dothraki" },
          5: {
            player: dSide,
            desc: "Luật 5: Dothraki +4 all stats, đối thủ +3 điểm khởi đầu (đã tính)",
          },
          6: {
            player: oppSide,
            desc: "Luật 6: Đối thủ +5 all stats (đã tính). Dothraki +1 all per điểm sau trận [GM Note]",
          },
        };
        const entry = RULE_DESC[rule];
        if (entry)
          events.push({
            player: entry.player,
            source: "Dothraki",
            description: entry.desc,
            type: "stat_boost",
          });
      };
      logDothraki("player1", state.p1DothrakiRule);
      logDothraki("player2", state.p2DothrakiRule);
    }

    // Check auto_lose_round effects (e.g. Glass Cannon always loses DUR round)
    const checkAutoLose = (
      player: PvPPlayerData,
      playerSide: "player1" | "player2",
    ) => {
      const fx = EffectResolver.calculateCharacterEffects(player.character!, {
        isPvE: false,
      });
      for (const ce of fx.combatEffects) {
        if (ce.isActive === false) continue;
        if (ce.effect?.type !== "auto_lose_round") continue;
        if (ce.effect?.timing !== "during_combat") continue;
        const autoLoseStat = normalizeStatKey((ce.effect as any).stat || "");
        if (autoLoseStat !== key) continue;
        // Check disabled
        const srcName = ce.source?.name || "?";
        const srcType = ce.source?.type || "?";
        if (disabledItems.has(`${player.no}-${srcType}-${srcName}`)) continue;
        // Force this player to lose the round by setting their value to -999
        if (playerSide === "player1") p1Val = -999;
        else p2Val = -999;
        events.push({
          player: playerSide,
          source: srcName,
          description: `Auto-thua round ${key.toUpperCase()} (${srcName})`,
          type: "stat_debuff",
        });
      }
    };
    if (p1.character) checkAutoLose(p1, "player1");
    if (p2.character) checkAutoLose(p2, "player2");

    // Promised Consort: add highest base stat of a Lover to the current round stat
    const applyPromisedConsort = (
      player: PvPPlayerData,
      playerSide: "player1" | "player2",
    ) => {
      const archetypes: string[] = (player.character as any)?.archetypes || [];
      if (!archetypes.some((a) => a === "Promised Consort")) return;
      const lovers: any[] = player.character?.lover || [];
      const activeLovers = lovers.filter((l: any) => !l.isLost);
      if (activeLovers.length === 0) return;
      // Prefer Femboy lover
      const STAT_KEYS_SHORT = [
        "str",
        "spd",
        "dur",
        "iq",
        "biq",
        "ma",
      ] as (keyof CharacterStats)[];
      const chooseLover = (loverList: any[]) => {
        const femboy = loverList.find((l: any) => {
          const n = typeof l === "string" ? l : (l?.name ?? "");
          return allPlayers
            .find((p) => p.name === n)
            ?.character?.archetypes?.includes("Femboy");
        });
        return femboy || loverList[0];
      };
      const chosen = chooseLover(activeLovers);
      const loverName =
        typeof chosen === "string" ? chosen : (chosen?.name ?? "");
      const loverPlayer = allPlayers.find((p) => p.name === loverName);
      if (!loverPlayer) return;
      const loverStats = loverPlayer.baseStats || loverPlayer.stats;
      const highest = Math.max(
        ...STAT_KEYS_SHORT.map((k) => loverStats[k] || 0),
      );
      if (playerSide === "player1") p1Val += highest;
      else p2Val += highest;
      events.push({
        player: playerSide,
        source: "Promised Consort",
        description: `+${highest} từ Base Stat cao nhất của "${loverName}" (Promised Consort)`,
        type: "stat_boost",
      });
    };
    if (p1.character) applyPromisedConsort(p1, "player1");
    if (p2.character) applyPromisedConsort(p2, "player2");

    // Determine winner
    let winner: "player1" | "player2" | "tie";
    if (p1Val > p2Val) winner = "player1";
    else if (p2Val > p1Val) winner = "player2";
    else winner = "tie";

    // One Trick Pony: check if winner has OTP and override base points
    const OTP_STAT_KEY_TO_LABEL: Record<string, string> = {
      str: "Strength",
      spd: "Speed",
      dur: "Durability",
      iq: "IQ",
      biq: "BIQ",
      ma: "MA",
    };
    const roundStatLabel = OTP_STAT_KEY_TO_LABEL[key] ?? key;
    const p1HasOTP = (p1.character?.quirks || [])
      .filter((q: any) => !q.isLost)
      .some((q: any) => q.name.toLowerCase() === "one trick pony");
    const p2HasOTP = (p2.character?.quirks || [])
      .filter((q: any) => !q.isLost)
      .some((q: any) => q.name.toLowerCase() === "one trick pony");
    const p1OTPStat = otpStats["player1"]; // label e.g. "Strength"
    const p2OTPStat = otpStats["player2"];

    // Base point: winner gets +1, but OTP overrides
    let p1Points: number;
    let p2Points: number;
    let p1ResetScore = false; // Bloodthirsty lose_points_on_lose
    let p2ResetScore = false;
    if (winner === "player1") {
      if (p1HasOTP) {
        p1Points = p1OTPStat ? (p1OTPStat === roundStatLabel ? 3 : 0) : 1; // 1 if wheel not spun yet (pending)
      } else {
        p1Points = 1;
      }
      p2Points = 0;
    } else if (winner === "player2") {
      p1Points = 0;
      if (p2HasOTP) {
        p2Points = p2OTPStat ? (p2OTPStat === roundStatLabel ? 3 : 0) : 1;
      } else {
        p2Points = 1;
      }
    } else {
      p1Points = 0;
      p2Points = 0;
    }

    // Base point change records
    if (winner === "player1") {
      if (p1HasOTP && p1OTPStat) {
        pointChanges.push({
          player: "player1",
          delta: p1Points,
          reason: `One Trick Pony: Stat được chọn = ${p1OTPStat}. Thắng ${roundStatLabel} → ${p1Points} điểm; các stat khác thắng → 0 điểm`,
        });
      } else {
        pointChanges.push({
          player: "player1",
          delta: p1Points,
          reason: "thắng round",
        });
      }
    } else if (winner === "player2") {
      if (p2HasOTP && p2OTPStat) {
        pointChanges.push({
          player: "player2",
          delta: p2Points,
          reason: `One Trick Pony: Stat được chọn = ${p2OTPStat}. Thắng ${roundStatLabel} → ${p2Points} điểm; các stat khác thắng → 0 điểm`,
        });
      } else {
        pointChanges.push({
          player: "player2",
          delta: p2Points,
          reason: "thắng round",
        });
      }
    }

    // Get number of rounds won/lost so far (before this round)
    const p1WonSoFar = state.resolvedRounds.filter(
      (r) => r.winner === "player1",
    ).length;
    const p1LostSoFar = state.resolvedRounds.filter(
      (r) => r.winner === "player2",
    ).length;
    const p2WonSoFar = p1LostSoFar;
    const p2LostSoFar = p1WonSoFar;

    // Build handler context helper
    const buildCtx = (isSelf: boolean) => ({
      self: {
        character: isSelf ? p1.character : p2.character,
        stats: isSelf ? state.p1Stats : state.p2Stats,
        baseStats: isSelf ? p1.baseStats : p2.baseStats,
        race: isSelf
          ? p1.character?.race?.race || p1.race
          : p2.character?.race?.race || p2.race,
        raceTier: isSelf ? p1.raceTier : p2.raceTier,
        bracket: isSelf
          ? p1.character?.tournament?.bracket || "winner"
          : p2.character?.tournament?.bracket || "winner",
        pvpWins: isSelf
          ? p1.character?.tournament?.pvpWins || 0
          : p2.character?.tournament?.pvpWins || 0,
        hasLover: isSelf
          ? (p1.character?.lover || []).filter((l: any) => !l.isLost).length > 0
          : (p2.character?.lover || []).filter((l: any) => !l.isLost).length >
            0,
        powers: isSelf
          ? (p1.character?.powers || [])
              .filter((p: any) => !p.isLost)
              .map((p: any) => (typeof p === "string" ? p : p.name))
          : (p2.character?.powers || [])
              .filter((p: any) => !p.isLost)
              .map((p: any) => (typeof p === "string" ? p : p.name)),
        quirks: isSelf
          ? (p1.character?.quirks || [])
              .filter((q: any) => !q.isLost)
              .map((q: any) => q.name)
          : (p2.character?.quirks || [])
              .filter((q: any) => !q.isLost)
              .map((q: any) => q.name),
        weapons: isSelf
          ? p1.character?.weapons || []
          : p2.character?.weapons || [],
        gears: isSelf
          ? [
              ...(p1.character?.gear?.normalGear || []),
              ...(p1.character?.gear?.legacyGear || []),
            ].map((g: any) => g.name)
          : [
              ...(p2.character?.gear?.normalGear || []),
              ...(p2.character?.gear?.legacyGear || []),
            ].map((g: any) => g.name),
        roundsWon: isSelf ? p1WonSoFar : p2WonSoFar,
        roundsLost: isSelf ? p1LostSoFar : p2LostSoFar,
      },
      opponent: {
        character: isSelf ? p2.character : p1.character,
        stats: isSelf ? state.p2Stats : state.p1Stats,
        baseStats: isSelf ? p2.baseStats : p1.baseStats,
        race: isSelf
          ? p2.character?.race?.race || p2.race
          : p1.character?.race?.race || p1.race,
        raceTier: isSelf ? p2.raceTier : p1.raceTier,
        hasLover: isSelf
          ? (p2.character?.lover || []).filter((l: any) => !l.isLost).length > 0
          : (p1.character?.lover || []).filter((l: any) => !l.isLost).length >
            0,
        powers: isSelf
          ? (p2.character?.powers || [])
              .filter((p: any) => !p.isLost)
              .map((p: any) => (typeof p === "string" ? p : p.name))
          : (p1.character?.powers || [])
              .filter((p: any) => !p.isLost)
              .map((p: any) => (typeof p === "string" ? p : p.name)),
        quirks: isSelf
          ? (p2.character?.quirks || [])
              .filter((q: any) => !q.isLost)
              .map((q: any) => q.name)
          : (p1.character?.quirks || [])
              .filter((q: any) => !q.isLost)
              .map((q: any) => q.name),
        weapons: isSelf
          ? p2.character?.weapons || []
          : p1.character?.weapons || [],
        gears: isSelf
          ? [
              ...(p2.character?.gear?.normalGear || []),
              ...(p2.character?.gear?.legacyGear || []),
            ].map((g: any) => g.name)
          : [
              ...(p1.character?.gear?.normalGear || []),
              ...(p1.character?.gear?.legacyGear || []),
            ].map((g: any) => g.name),
      },
      isFinals: false,
      isPvE: false,
      currentRound: roundIndex,
      currentRoundStat: key, // short key: str/spd/dur/iq/biq/ma
      totalRounds: 6,
      roundResults: (() => {
        const longKey: Record<string, string> = {
          str: "strength", spd: "speed", dur: "durability",
          iq: "iq", biq: "biq", ma: "ma",
        };
        const toResult = (w: "player1"|"player2"|"tie", self: boolean) =>
          w === (self ? "player1" : "player2") ? "win"
          : w === (self ? "player2" : "player1") ? "lose"
          : "tie";
        const entries = state.resolvedRounds.map((r) => [
          longKey[r.stat] ?? r.stat,
          toResult(r.winner, isSelf),
        ]);
        // Include current round result so handlers can react immediately
        entries.push([longKey[key] ?? key, toResult(winner, isSelf)]);
        return Object.fromEntries(entries);
      })(),
    });

    // Compute effects (use pre-calculated combatEffects from EffectResolver)
    const newP1Stats = { ...state.p1Stats };
    const newP2Stats = { ...state.p2Stats };

    // Apply carry-over debuffs on non-current-round stats (e.g. Bash -3 random stat)
    for (const co of state.p1CarryOver) {
      if (co.stat !== key) {
        applyStatDelta(newP1Stats, co.stat, co.value);
        events.push({
          player: "player1",
          source: co.source,
          description: `${co.value > 0 ? "+" : ""}${co.value} ${(co.stat as string).toUpperCase()} (carry từ round trước)`,
          type: "carry_over",
        });
      }
    }
    for (const co of state.p2CarryOver) {
      if (co.stat !== key) {
        applyStatDelta(newP2Stats, co.stat, co.value);
        events.push({
          player: "player2",
          source: co.source,
          description: `${co.value > 0 ? "+" : ""}${co.value} ${(co.stat as string).toUpperCase()} (carry từ round trước)`,
          type: "carry_over",
        });
      }
    }

    let newP1TenacityFired = state.p1TenacityFired;
    let newP2TenacityFired = state.p2TenacityFired;
    let newP1ConquerorFired = state.p1ConquerorFired;
    let newP2ConquerorFired = state.p2ConquerorFired;
    const newP1FiredHandlers = new Set(state.p1FiredHandlers);
    const newP2FiredHandlers = new Set(state.p2FiredHandlers);

    const processPlayer = (
      player: PvPPlayerData,
      playerSide: "player1" | "player2",
      roundWinner: "player1" | "player2" | "tie",
      isSelf: boolean,
    ) => {
      const fx = EffectResolver.calculateCharacterEffects(player.character!, {
        isPvE: false,
      });
      const isWinner = roundWinner === playerSide;
      const isLoser = roundWinner !== playerSide && roundWinner !== "tie";
      const ctx = buildCtx(isSelf) as any;

      // Fair Duel: nếu bất kỳ ai có Fair Duel active → cả 2 miễn nhiễm debuff từ đối thủ
      const oppPlayer = isSelf ? p2 : p1;
      const selfHasFairDuel = (player.character?.powers || [])
        .filter((pw: any) => !pw.isLost)
        .some((pw: any) => (typeof pw === "string" ? pw : pw?.name ?? "").toLowerCase() === "fair duel")
        && !disabledItems.has(`${player.no}-power-Fair Duel`);
      const oppHasFairDuel = (oppPlayer.character?.powers || [])
        .filter((pw: any) => !pw.isLost)
        .some((pw: any) => (typeof pw === "string" ? pw : pw?.name ?? "").toLowerCase() === "fair duel")
        && !disabledItems.has(`${oppPlayer.no}-power-Fair Duel`);
      const fairDuelActive = selfHasFairDuel || oppHasFairDuel;

      // Spell Flux: power "Trong Combat" đầu tiên kích hoạt được apply 2 lần
      const hasSpellFlux = (player.character?.powers || []).some((p: any) =>
        (typeof p === "string" ? p : p.name)?.toLowerCase() === "spell flux" && !p.isLost
      );
      let spellFluxUsed = false; // true sau khi đã double lần đầu

      for (const ce of fx.combatEffects) {
        if (ce.isActive === false) continue;
        const sourceName = ce.source?.name || "?";
        const sourceType = ce.source?.type || "?";
        // Check disabled
        const disabledKey = `${player.no}-${sourceType}-${sourceName}`;
        if (disabledItems.has(disabledKey)) continue;

        const timing = ce.effect?.timing;
        const handlerName = ce.effect?.customHandler;

        // Only process round-level timings here (before_combat is baked into initial stats)
        if (
          ![
            "on_round_win",
            "on_round_lose",
            "on_round_tie",
            "during_combat",
          ].includes(timing || "")
        )
          continue;
        if (timing === "on_round_win" && !isWinner) continue;
        if (timing === "on_round_lose" && !isLoser) continue;
        if (timing === "on_round_tie" && roundWinner !== "tie") continue;
        // before_combat effects are baked into initial p1Stats/p2Stats at startCombat time
        if (timing === "before_combat") continue;

        // Xử lý during_combat / on_round_win / on_round_lose stat_modifier không có customHandler
        if (!handlerName) {
          // Bloodthirsty: extra_point_on_win → +bonus điểm khi thắng
          if (ce.effect?.type === "extra_point_on_win" && isWinner) {
            const pts = (ce.effect as any).points ?? 1;
            if (playerSide === "player1") p1Points += pts; else p2Points += pts;
            pointChanges.push({ player: playerSide, delta: pts, reason: `${sourceName}: thắng round → +${pts} điểm bonus` });
            events.push({ player: playerSide, source: sourceName, description: `+${pts} điểm bonus (${sourceName})`, type: "info" });
            continue;
          }
          // Bloodthirsty: lose_points_on_lose → reset toàn bộ điểm khi thua
          if (ce.effect?.type === "lose_points_on_lose" && isLoser) {
            if (playerSide === "player1") p1ResetScore = true; else p2ResetScore = true;
            events.push({ player: playerSide, source: sourceName, description: `Thua round → mất toàn bộ điểm tích lũy (${sourceName})`, type: "info" });
            continue;
          }
          if (
            (timing === "during_combat" || timing === "on_round_win" || timing === "on_round_lose") &&
            (ce.effect?.type === "stat_modifier" ||
              ce.effect?.type === "debuff") &&
            ce.effect.value !== undefined &&
            ce.effect.stat
          ) {
            // during_combat stat_modifier chỉ apply 1 lần duy nhất (round đầu tiên)
            // on_round_win / on_round_lose apply mỗi lần trigger (đúng spec)
            if (timing === "during_combat" && roundIndex !== 0) continue;
            // Check conditions: race_match, race_tier_compare, bracket, probability
            const conditions = ce.effect.conditions || [];
            const selfRaceTier = isSelf ? p1.raceTier : p2.raceTier;
            const oppRaceTier = isSelf ? p2.raceTier : p1.raceTier;
            const oppRace =
              (isSelf ? p2.character?.race?.race : p1.character?.race?.race) ||
              "";
            const selfBracket = player.character?.tournament?.bracket || "";
            // Effects with probability condition must be handled via wheel UI, not auto-applied
            if (conditions.some((c: any) => c.type === "probability")) continue;
            const conditionMet = conditions.every((cond: any) => {
              if (cond.type === "race_match" && cond.races) {
                return cond.races.some(
                  (r: string) => r.toLowerCase() === oppRace.toLowerCase(),
                );
              }
              if (cond.type === "race_match" && cond.excludeRaces) {
                return !cond.excludeRaces.some(
                  (r: string) => r.toLowerCase() === oppRace.toLowerCase(),
                );
              }
              if (cond.type === "race_tier_compare" && cond.tierOperator) {
                if (cond.tierOperator === "<")
                  return selfRaceTier < oppRaceTier;
                if (cond.tierOperator === ">")
                  return selfRaceTier > oppRaceTier;
                if (cond.tierOperator === "=")
                  return selfRaceTier === oppRaceTier;
              }
              if (cond.type === "bracket" && cond.bracket) {
                return selfBracket.toLowerCase() === cond.bracket.toLowerCase();
              }
              if (cond.type === "has_item" && cond.itemType && cond.itemName) {
                const oppChar = isSelf ? p2.character : p1.character;
                if (cond.itemType === "archetype") {
                  const archetypes = (oppChar?.archetypes || []).map((a: any) =>
                    (typeof a === "string" ? a : a?.name ?? "").toLowerCase()
                  );
                  return archetypes.includes(cond.itemName.toLowerCase());
                }
                if (cond.itemType === "power") {
                  const powers = (oppChar?.powers || []).filter((p: any) => !p.isLost).map((p: any) =>
                    (typeof p === "string" ? p : p?.name ?? "").toLowerCase()
                  );
                  return powers.includes(cond.itemName.toLowerCase());
                }
              }
              return true;
            });
            if (!conditionMet) continue;

            const isOpponentTarget = ce.effect.target === "opponent";
            const affectedSide = isOpponentTarget
              ? playerSide === "player1"
                ? "player2"
                : "player1"
              : playerSide;
            const currentStats =
              affectedSide === "player1" ? newP1Stats : newP2Stats;
            const statTargets = resolveStatTargets(ce.effect.stat, currentStats);
            const val = ce.effect.value;
            // Fair Duel: opponent immune to debuffs (negative stat changes targeting them)
            if (isOpponentTarget && val < 0 && fairDuelActive) {
              events.push({ player: affectedSide, source: sourceName, description: `Fair Duel: miễn nhiễm debuff từ ${sourceName}`, type: "info" });
              continue;
            }
            const targetStats = affectedSide === "player1" ? newP1Stats : newP2Stats;
            for (const csKey of statTargets) applyStatDelta(targetStats, csKey, val);
            events.push({
              player: affectedSide,
              source: sourceName,
              description: `${val >= 0 ? "+" : ""}${val} ${ce.effect.stat === "all" ? "All" : statTargets.map((s) => s.toUpperCase()).join("/")} (${sourceName}${isOpponentTarget ? " → opponent" : ""})`,
              type: val >= 0 ? "stat_boost" : "stat_debuff",
            });
          }
          continue;
        }
        // Divine Smite: +1 điểm khi thắng round MA
        if (handlerName === "divine_smite_ma_round") {
          if (key === "ma" && isWinner) {
            const pts = (ce.effect as any).points ?? 1;
            if (playerSide === "player1") p1Points += pts; else p2Points += pts;
            pointChanges.push({ player: playerSide, delta: pts, reason: `Divine Smite: thắng round MA → +${pts} điểm` });
            events.push({ player: playerSide, source: sourceName, description: `+${pts} điểm (Divine Smite — thắng round MA)`, type: "info" });
          }
          continue;
        }

        // Blind, Mute, and Scrying are handled via spin wheel, not auto-applied here
        if (
          handlerName === "blind_no_point" ||
          handlerName === "mute_stat_debuff"
        )
          continue;

        // Needle: thắng round = stat thấp nhất của đối thủ → +2 điểm
        if (handlerName === "needle_lowest_stat_bonus") {
          const oppBaseStats = isSelf ? p2.baseStats : p1.baseStats;
          const STAT_SHORT: (keyof CharacterStats)[] = ["str", "spd", "dur", "iq", "biq", "ma"];
          let lowestShort: keyof CharacterStats = "str";
          let lowestVal = oppBaseStats["str"] || 0;
          for (const s of STAT_SHORT) {
            if ((oppBaseStats[s] || 0) < lowestVal) { lowestVal = oppBaseStats[s] || 0; lowestShort = s; }
          }
          if (key === lowestShort && isWinner) {
            const pts = 2;
            if (playerSide === "player1") p1Points += pts; else p2Points += pts;
            pointChanges.push({ player: playerSide, delta: pts, reason: `Needle: thắng round ${lowestShort.toUpperCase()} (stat thấp nhất đối thủ) → +${pts} điểm` });
            events.push({ player: playerSide, source: sourceName, description: `+${pts} điểm (Needle — thắng round ${lowestShort.toUpperCase()}, stat thấp nhất của đối thủ)`, type: "info" });
            const firedSet = playerSide === "player1" ? newP1FiredHandlers : newP2FiredHandlers;
            firedSet.add(`${handlerName}__${sourceName}`);
          }
          continue;
        }

        // Morningstar: +2 STR nếu đối thủ dùng vũ khí Physical (apply lần đầu tiên — round 0)
        if (handlerName === "morningstar_physical_bonus") {
          if (roundIndex === 0) {
            const oppChar = isSelf ? p2.character : p1.character;
            const PHYSICAL_TYPES = ["sword", "axe", "hammer", "spear", "blade", "club", "dagger", "mace", "halberd", "lance", "scythe", "bow", "crossbow"];
            const oppWeapons: any[] = oppChar?.weapons || [];
            const hasPhysical = oppWeapons.some((w: any) => {
              const wn = (typeof w === "string" ? w : w?.name ?? "").toLowerCase();
              return PHYSICAL_TYPES.some(p => wn.includes(p));
            });
            if (hasPhysical) {
              const tgtStats = isSelf ? newP1Stats : newP2Stats;
              applyStatDelta(tgtStats, "str", 2);
              events.push({ player: playerSide, source: sourceName, description: "+2 STR (Morningstar — đối thủ dùng vũ khí Physical)", type: "stat_boost" });
            } else {
              events.push({ player: playerSide, source: sourceName, description: "Morningstar: Đối thủ không dùng vũ khí Physical → không áp dụng", type: "info" });
            }
          }
          continue;
        }
        // Scrying has no customHandler — skip probability condition auto-apply
        if (sourceName === "Scrying") continue;
        // Spell Flux handler itself is metadata only — skip execution
        if (handlerName === "spell_flux_double_first_in_combat") continue;
        // Gold Ship is handled via pre-combat wheel, not auto-applied here
        if (handlerName === "gold_ship_coin_flip") continue;
        // One Trick Pony stat selection is handled via pre-combat wheel (oneTrickPonyStat state), not here
        if (handlerName === "one_trick_pony_stat_selection") continue;
        // Conquerer: chỉ apply +1 all stats 1 lần duy nhất per combat
        if (
          handlerName === "conquerer_speed_win" &&
          (playerSide === "player1" ? newP1ConquerorFired : newP2ConquerorFired)
        ) continue;
        // during_combat handlers tự guard bằng currentRoundStat trong handler
        // FiredHandlers vẫn giữ để phòng các handler không có guard (fallback)
        if (timing === "during_combat") {
          const firedSet = playerSide === "player1" ? newP1FiredHandlers : newP2FiredHandlers;
          const handlerKey = `${handlerName}__${ce.source?.name ?? sourceName}`;
          if (firedSet.has(handlerKey)) continue;
          // Không add vào firedSet — handler tự guard bằng currentRoundStat
          // Chỉ add nếu handler return kết quả thành công (xử lý sau execute)
        }
        const result = HandlerRegistry.executeCombat(handlerName, ctx);
        if (!result || result.skipDefault) continue;

        // Mark handler đã fired thành công (chống stack nếu handler không có currentRoundStat guard)
        if (timing === "during_combat") {
          const firedSet = playerSide === "player1" ? newP1FiredHandlers : newP2FiredHandlers;
          firedSet.add(`${handlerName}__${ce.source?.name ?? sourceName}`);
        }

        // Spell Flux: nếu đây là power during_combat đầu tiên kích hoạt thành công, apply 2 lần
        const isSpellFluxTarget =
          hasSpellFlux &&
          !spellFluxUsed &&
          timing === "during_combat" &&
          ce.source?.type === "power";
        const applyTimes = isSpellFluxTarget ? 2 : 1;
        if (isSpellFluxTarget) {
          spellFluxUsed = true;
          events.push({
            player: playerSide,
            source: "Spell Flux",
            description: `[Spell Flux] ${sourceName} kích hoạt 2 lần!`,
            type: "info",
          });
        }

        for (let _applyIdx = 0; _applyIdx < applyTimes; _applyIdx++) {
        const isDouble = isSpellFluxTarget && _applyIdx === 1;

        if (result.description && !isDouble) {
          events.push({
            player: playerSide,
            source: sourceName,
            description: result.description,
            type: "info",
          });
        }

        // Stat mods
        if (result.selfStatMods) {
          for (const mod of result.selfStatMods) {
            const csKey = normalizeStatKey(mod.stat);
            // Detect carry-over handlers (Undying Rage, Luminescence — boost the NEXT round)
            const isCarryOver = [
              "undying_rage_boost",
              "luminescence_debuff",
            ].includes(handlerName);
            if (isCarryOver && roundIndex < 5) {
              const nextStatKey = STAT_ORDER[roundIndex + 1].key;
              carryOverToNext.push({
                player: playerSide,
                source: sourceName,
                stat: nextStatKey,
                value: mod.value,
                description: `${sourceName}: +${mod.value} ${nextStatKey.toUpperCase()} round kế`,
              });
              events.push({
                player: playerSide,
                source: sourceName,
                description: `→ +${mod.value} ${nextStatKey.toUpperCase()} carry sang round kế`,
                type: "carry_over",
              });
            } else {
              // Skeleton: IQ cannot change (locked at base value)
              const playerRace = (player.character?.race?.race || player.race || "").toLowerCase();
              if (csKey === "iq" && playerRace === "skeleton") {
                events.push({
                  player: playerSide,
                  source: sourceName,
                  description: `[Skeleton] IQ không thể thay đổi — bỏ qua ${mod.value >= 0 ? "+" : ""}${mod.value} IQ`,
                  type: "info",
                });
              } else {
                // Permanent buff this combat (Tenacity, Conqueror, etc.)
                applyStatDelta(playerSide === "player1" ? newP1Stats : newP2Stats, csKey, mod.value);
                events.push({
                  player: playerSide,
                  source: sourceName,
                  description: `${mod.value >= 0 ? "+" : ""}${mod.value} ${csKey.toUpperCase()} (permanent)`,
                  type: mod.value >= 0 ? "stat_boost" : "stat_debuff",
                });
              }
            }
          }
        }

        // Opponent stat mods
        if (result.opponentStatMods) {
          for (const mod of result.opponentStatMods) {
            const csKey = normalizeStatKey(mod.stat);
            const oppSide = playerSide === "player1" ? "player2" : "player1";
            const isCarryOver = ["luminescence_debuff"].includes(handlerName);
            if (isCarryOver && roundIndex < 5) {
              const nextStatKey = STAT_ORDER[roundIndex + 1].key;
              carryOverToNext.push({
                player: oppSide,
                source: sourceName,
                stat: nextStatKey,
                value: mod.value,
                description: `${sourceName}: ${mod.value} ${nextStatKey.toUpperCase()} round kế (debuff)`,
              });
              events.push({
                player: oppSide,
                source: sourceName,
                description: `→ ${mod.value} ${nextStatKey.toUpperCase()} debuff carry sang round kế`,
                type: "carry_over",
              });
            } else {
              applyStatDelta(oppSide === "player1" ? newP1Stats : newP2Stats, csKey, mod.value);
              events.push({
                player: oppSide,
                source: sourceName,
                description: `${mod.value >= 0 ? "+" : ""}${mod.value} ${csKey.toUpperCase()} (từ ${playerSide === "player1" ? p1.name : p2.name})`,
                type: mod.value >= 0 ? "stat_boost" : "stat_debuff",
              });
            }
          }
        }

        // Points
        if (result.selfPoints) {
          if (playerSide === "player1") p1Points += result.selfPoints;
          else p2Points += result.selfPoints;
          pointChanges.push({
            player: playerSide,
            delta: result.selfPoints,
            reason: sourceName,
          });
          events.push({
            player: playerSide,
            source: sourceName,
            description: `${result.selfPoints >= 0 ? "+" : ""}${result.selfPoints} điểm`,
            type: "point_change",
          });
        }
        if (result.opponentPoints) {
          const oppSide = playerSide === "player1" ? "player2" : "player1";
          if (oppSide === "player1") p1Points += result.opponentPoints;
          else p2Points += result.opponentPoints;
          pointChanges.push({
            player: oppSide,
            delta: result.opponentPoints,
            reason: `${sourceName} (từ đối thủ)`,
          });
        }

        } // end applyTimes loop

        // Tenacity one-shot tracking (outside applyTimes — only fires once)
        if (handlerName === "tenacity_first_win") {
          if (playerSide === "player1") newP1TenacityFired = true;
          else newP2TenacityFired = true;
        }
        if (handlerName === "conquerer_speed_win") {
          if (playerSide === "player1") newP1ConquerorFired = true;
          else newP2ConquerorFired = true;
        }
      }
    };

    processPlayer(p1, "player1", winner, true);
    processPlayer(p2, "player2", winner, false);

    // One Trick Pony: nếu thắng round nhưng không phải stat đã chọn → clamp về 0 (không nhận bất kỳ điểm nào)
    const OTP_LABEL_MAP: Record<string, string> = { str: "Strength", spd: "Speed", dur: "Durability", iq: "IQ", biq: "BIQ", ma: "MA" };
    const roundStatLabelFull = OTP_LABEL_MAP[key] ?? key;
    const p1HasOTPFinal = (p1.character?.quirks || []).filter((q: any) => !q.isLost).some((q: any) => q.name.toLowerCase() === "one trick pony");
    const p2HasOTPFinal = (p2.character?.quirks || []).filter((q: any) => !q.isLost).some((q: any) => q.name.toLowerCase() === "one trick pony");
    if (p1HasOTPFinal && winner === "player1") {
      const chosenStat = otpStats["player1"];
      if (chosenStat && chosenStat !== roundStatLabelFull) {
        p1Points = 0; // sai stat → không nhận điểm dù có bonus
      }
    }
    if (p2HasOTPFinal && winner === "player2") {
      const chosenStat = otpStats["player2"];
      if (chosenStat && chosenStat !== roundStatLabelFull) {
        p2Points = 0; // sai stat → không nhận điểm dù có bonus
      }
    }

    // Undying Rage (runeword check, carry-over to next stat)
    if (
      p1.character?.runes?.runeword === "Undying Rage" &&
      winner === "player2" &&
      roundIndex < 5
    ) {
      const nextStatKey = STAT_ORDER[roundIndex + 1].key;
      // Only add if not already added via handler
      const alreadyAdded = carryOverToNext.some(
        (co) => co.player === "player1" && co.source === "Undying Rage",
      );
      if (!alreadyAdded) {
        carryOverToNext.push({
          player: "player1",
          source: "Undying Rage",
          stat: nextStatKey,
          value: 3,
          description: `Undying Rage: thua round → +3 ${nextStatKey.toUpperCase()} round kế`,
        });
        events.push({
          player: "player1",
          source: "Undying Rage",
          description: `Thua → +3 ${nextStatKey.toUpperCase()} carry sang round kế`,
          type: "carry_over",
        });
      }
    }
    if (
      p2.character?.runes?.runeword === "Undying Rage" &&
      winner === "player1" &&
      roundIndex < 5
    ) {
      const nextStatKey = STAT_ORDER[roundIndex + 1].key;
      const alreadyAdded = carryOverToNext.some(
        (co) => co.player === "player2" && co.source === "Undying Rage",
      );
      if (!alreadyAdded) {
        carryOverToNext.push({
          player: "player2",
          source: "Undying Rage",
          stat: nextStatKey,
          value: 3,
          description: `Undying Rage: thua round → +3 ${nextStatKey.toUpperCase()} round kế`,
        });
        events.push({
          player: "player2",
          source: "Undying Rage",
          description: `Thua → +3 ${nextStatKey.toUpperCase()} carry sang round kế`,
          type: "carry_over",
        });
      }
    }

    // Scrying: 40% -4 stat mạnh nhất đối thủ round kế (via wheel spin, on win)
    if (roundIndex < 5) {
      const addScryingCarryOver = (winnerSide: "player1" | "player2") => {
        const oppSide: "player1" | "player2" = winnerSide === "player1" ? "player2" : "player1";
        // Scrying spin saved with key (roundIndex-1) — same timing as Bash
        const key2 = `${roundIndex - 1}-Scrying-${winnerSide}`;
        const spinResult = roundSpinResults[key2];
        if (!spinResult?.isSuccess) return;
        const oppStats = oppSide === "player1" ? newP1Stats : newP2Stats;
        const STAT_KEYS_ALL: (keyof CharacterStats)[] = ["str", "spd", "dur", "iq", "biq", "ma"];
        const highestStat = STAT_KEYS_ALL.reduce((a, b) =>
          (oppStats[a] || 0) >= (oppStats[b] || 0) ? a : b,
        );
        const alreadyAdded = carryOverToNext.some(
          (co) => co.player === oppSide && co.source === "Scrying",
        );
        if (alreadyAdded) return;
        carryOverToNext.push({
          player: oppSide,
          source: "Scrying",
          stat: highestStat,
          value: -4,
          description: `Scrying: bị debuff -4 ${highestStat.toUpperCase()} round kế`,
        });
        events.push({
          player: oppSide,
          source: "Scrying",
          description: `Scrying: -4 ${highestStat.toUpperCase()} carry sang round kế (debuff từ đối thủ)`,
          type: "stat_debuff",
        });
      };

      const p1EffectsScry = getPerRoundEffects(p1.character, p1.no);
      const p2EffectsScry = getPerRoundEffects(p2.character, p2.no);
      if (winner === "player1" && p1EffectsScry.onWin.includes("Scrying")) addScryingCarryOver("player1");
      if (winner === "player2" && p2EffectsScry.onWin.includes("Scrying")) addScryingCarryOver("player2");
    }

    // Silver Ranger: 15% gấp đôi chỉ số round tiếp theo khi thắng bất kỳ round
    if (roundIndex < 5) {
      const addSilverRangerCarryOver = (winnerSide: "player1" | "player2") => {
        const spinRoundIndex = roundIndex - 1;
        const key2 = `${spinRoundIndex}-Ranger-Silver-${winnerSide}`;
        const spinResult = roundSpinResults[key2];
        if (!spinResult?.isSuccess) return;
        const alreadyAdded = carryOverToNext.some(
          (co) => co.player === winnerSide && co.source === "Ranger-Silver",
        );
        if (alreadyAdded) return;
        const nextStatKey = STAT_ORDER[roundIndex + 1].key as keyof CharacterStats;
        const winnerStats = winnerSide === "player1" ? newP1Stats : newP2Stats;
        const currentStatValue = (winnerStats[nextStatKey] as number) || 0;
        carryOverToNext.push({
          player: winnerSide,
          source: "Ranger-Silver",
          stat: nextStatKey,
          value: currentStatValue,
          description: `Silver Ranger: gấp đôi ${nextStatKey.toUpperCase()} round kế (+${currentStatValue})`,
        });
        events.push({
          player: winnerSide,
          source: "Ranger-Silver",
          description: `Silver Ranger: +${currentStatValue} ${nextStatKey.toUpperCase()} carry sang round kế (gấp đôi)`,
          type: "carry_over",
        });
      };
      const p1EffsSR = getPerRoundEffects(p1.character, p1.no);
      const p2EffsSR = getPerRoundEffects(p2.character, p2.no);
      if (winner === "player1" && p1EffsSR.onWin.includes("Ranger-Silver"))
        addSilverRangerCarryOver("player1");
      if (winner === "player2" && p2EffsSR.onWin.includes("Ranger-Silver"))
        addSilverRangerCarryOver("player2");
    }

    // Bloodthirsty: nếu thua round → reset điểm về 0 (ghi nhận trước khi cộng điểm round này)
    const newP1Score = p1ResetScore ? 0 : state.p1Score + Math.max(0, p1Points);
    const newP2Score = p2ResetScore ? 0 : state.p2Score + Math.max(0, p2Points);
    if (p1ResetScore) pointChanges.push({ player: "player1", delta: -state.p1Score, reason: "Bloodthirsty: thua round → mất toàn bộ điểm" });
    if (p2ResetScore) pointChanges.push({ player: "player2", delta: -state.p2Score, reason: "Bloodthirsty: thua round → mất toàn bộ điểm" });

    const roundResult: RoundResult = {
      stat: key,
      statLabel: label,
      player1Value: p1Val,
      player2Value: p2Val,
      winner,
    };
    const log: RoundLog = {
      roundIndex,
      statLabel: label,
      statKey: key,
      p1ValueUsed: p1Val,
      p2ValueUsed: p2Val,
      winner,
      p1Score: newP1Score,
      p2Score: newP2Score,
      events,
      pointChanges,
      carryOverToNext,
    };

    const newState: StepCombatState = {
      p1Stats: newP1Stats,
      p2Stats: newP2Stats,
      p1Score: newP1Score,
      p2Score: newP2Score,
      p1CarryOver: carryOverToNext.filter((co) => co.player === "player1"),
      p2CarryOver: carryOverToNext.filter((co) => co.player === "player2"),
      resolvedRounds: [...state.resolvedRounds, roundResult],
      roundLogs: [...state.roundLogs, log],
      p1TenacityFired: newP1TenacityFired,
      p2TenacityFired: newP2TenacityFired,
      p1ConquerorFired: newP1ConquerorFired,
      p2ConquerorFired: newP2ConquerorFired,
      p1FiredHandlers: newP1FiredHandlers,
      p2FiredHandlers: newP2FiredHandlers,
      p1DothrakiRule: state.p1DothrakiRule,
      p2DothrakiRule: state.p2DothrakiRule,
      startP1Score: state.startP1Score,
      startP2Score: state.startP2Score,
    };

    return { newState, log };
  };

  // Check and apply Roundtable Hold after combat
  const checkAndSetRoundtableHold = (result: CombatResult) => {
    const loserSide = result.winner === "player1" ? "player2" : "player1";
    const loser = result.winner === "player1" ? player2 : player1;
    const opponent = result.winner === "player1" ? player1 : player2;
    if (!loser || !opponent) return;
    const loserHasRT = hasRoundtableHold(loser);
    const opponentHasRT = hasRoundtableHold(opponent);
    if (loserHasRT && !opponentHasRT) {
      const tarnished = allPlayers.filter(
        (p) => p.no !== loser.no && hasRoundtableHold(p),
      );
      if (tarnished.length > 0) {
        setTarnishedList(tarnished);
        setIsPendingRoundtable(true);
        setPendingLoser(loserSide);
      }
    }
  };

  // Start combat (init step state)
  const startCombat = () => {
    if (!player1 || !player2) return;

    // Fancy Feet: disable rune/runeword của đối thủ nếu player có Power "Fancy Feet"
    const hasFancyFeet = (p: PvPPlayerData) =>
      (p.character?.powers || []).some((pw: any) =>
        !pw.isLost && (typeof pw === "string" ? pw : pw?.name ?? "").toLowerCase() === "fancy feet"
      );
    const buildFancyFeetDisables = (source: PvPPlayerData, target: PvPPlayerData): string[] => {
      if (!hasFancyFeet(source)) return [];
      const keys: string[] = [];
      // Disable runes
      const runes: any[] = target.character?.runes?.runes || [];
      const runeword: string | undefined = target.character?.runes?.runeword;
      for (const r of runes) {
        const rname = typeof r === "string" ? r : r?.name ?? "";
        if (rname) keys.push(`${target.no}-rune-${rname}`);
      }
      if (runeword) keys.push(`${target.no}-runeword-${runeword}`);
      // Disable weapons (stat bonuses, effects — không disable power đã gắn vào character)
      const weapons: any[] = target.character?.weapons || [];
      for (const w of weapons) {
        const wname = typeof w === "string" ? w : w?.name ?? "";
        if (wname && !w.isLost) keys.push(`${target.no}-weapon-${wname}`);
      }
      return keys;
    };
    const fancyFeetKeys = [
      ...buildFancyFeetDisables(player1, player2),
      ...buildFancyFeetDisables(player2, player1),
    ];
    // Merge into effectiveDisabledItems for this combat session
    const effectiveDisabledItems = fancyFeetKeys.length > 0
      ? new Set([...disabledItems, ...fancyFeetKeys])
      : disabledItems;
    if (fancyFeetKeys.length > 0) setDisabledItems(effectiveDisabledItems);

    setCombatResult(null);
    setIsAnimating(false);
    setCurrentRound(-1);
    setIsPendingRoundtable(false);
    setPendingLoser(null);
    setSelectedTarnished(null);
    setSubCombatResult(null);
    _setSubCurrentRound(-1);
    setRoundSpinResults({});
    // NOTE: oneTrickPonyStat is intentionally NOT reset here — OTP wheel is spun before combat starts
    // and must persist into the step rounds. Reset happens in resetCombat (player change).
    setRaumanianSuccess({});
    setGoldenCoinPoints({});
    setEncroachingShadowSuccess({});
    setGoldShipResult({});
    setMadScientistResult({});
    setSummoningScrollResult({});
    setCombatConfirmed(false);
    const p2Race = player2.character?.race?.race || player2.race || "";
    const p1Race = player1.character?.race?.race || player1.race || "";

    // Compute starting points from combat_points effects (conditional ones like Freyja, Bragi, Asmodeus, Thor, Belphegor)
    const calcStartingPoints = (
      self: PvPPlayerData,
      opponent: PvPPlayerData,
    ): number => {
      if (!self.character) return 0;
      const selfNo = self.no;
      const oppChar = opponent.character;
      const oppRace = oppChar?.race?.race || opponent.race || "";
      const oppHasLover = !!(
        oppChar?.lover &&
        (Array.isArray(oppChar.lover)
          ? oppChar.lover.some((l) => !l.isLost)
          : true)
      );
      const instruments = [
        "Guitar",
        "Violin",
        "Piano",
        "Drums",
        "Flute",
        "Bagpipe",
        "Harmonica",
      ];
      const oppHasInstrument = (oppChar?.weapons || []).some(
        (w: any) => !w.isLost && instruments.some((i) => w.name?.includes(i)),
      );
      const oppPowers = (oppChar?.powers || []).map((p: any) =>
        typeof p === "string" ? p : p.name,
      );

      const fx = EffectResolver.calculateCharacterEffects(self.character, {
        isPvE: false,
      });
      let pts = 0;
      for (const ce of fx.combatEffects) {
        if (ce.isActive === false) continue;
        if (ce.effect?.type !== "combat_points") continue;
        if (ce.effect?.timing !== "before_combat") continue;
        // Check disabled
        const srcName = ce.source?.name || "?";
        const srcType = ce.source?.type || "?";
        if (effectiveDisabledItems.has(`${selfNo}-${srcType}-${srcName}`)) continue;
        // customHandler: spear_of_fire_2_rune_check → check equipped weapon has 2+ runes
        const customHandler = (ce.effect as any).customHandler;
        if (customHandler === "spear_of_fire_2_rune_check") {
          const weapons: any[] = self.character?.weapons || [];
          const equipped = weapons.find((w: any) => !w.isLost && w.equipped);
          const runeCount = (equipped?.runes || []).filter((r: any) => !r.isLost).length;
          if (runeCount >= 2) pts += (ce.effect as any).points || 0;
          continue;
        }
        // Check conditions
        const conditions: any[] = (ce.effect as any).conditions || [];
        const met = conditions.every((cond: any) => {
          if (cond.type === "opponent_has") {
            if (cond.opponentItemType === "lover") return oppHasLover;
            if (
              cond.opponentItemType === "weapon" &&
              cond.opponentItemName === "instrument"
            )
              return oppHasInstrument;
            if (cond.opponentItemType === "power" && cond.opponentItemName) {
              return oppPowers.some(
                (p: string) =>
                  p.toLowerCase() === cond.opponentItemName.toLowerCase(),
              );
            }
          }
          if (cond.type === "race_match" && cond.races) {
            return cond.races.some(
              (r: string) => r.toLowerCase() === oppRace.toLowerCase(),
            );
          }
          return true;
        });
        if (met) pts += (ce.effect as any).points || 0;
      }
      return pts;
    };
    let p1StartScore = calcStartingPoints(player1, player2);
    let p2StartScore = calcStartingPoints(player2, player1);
    // Raumanian: add 1 point if wheel result was success
    if (raumanianSuccess["player1"]) p1StartScore += 1;
    if (raumanianSuccess["player2"]) p2StartScore += 1;
    // Golden Coin: add points from wheel result
    if (goldenCoinPoints["player1"]) p1StartScore += goldenCoinPoints["player1"];
    if (goldenCoinPoints["player2"]) p2StartScore += goldenCoinPoints["player2"];

    const p1BaseStats: CharacterStats = player1.character
      ? calcStatsWithBeforeCombat(
          player1.character,
          player1.no,
          effectiveDisabledItems,
          p2Race,
          player2.character ?? null,
          player2.no,
          effectiveDisabledItems,
          p1Race,
          player1.raceTier,
          player2.raceTier,
        )
      : { ...player1.stats };
    const p2BaseStats: CharacterStats = player2.character
      ? calcStatsWithBeforeCombat(
          player2.character,
          player2.no,
          effectiveDisabledItems,
          p1Race,
          player1.character ?? null,
          player1.no,
          effectiveDisabledItems,
          p2Race,
          player2.raceTier,
          player1.raceTier,
        )
      : { ...player2.stats };

    // Encroaching Shadow: +7 Speed nếu wheel thành công
    if (encroachingShadowSuccess["player1"]) applyStatDelta(p1BaseStats, "spd", 7);
    if (encroachingShadowSuccess["player2"]) applyStatDelta(p2BaseStats, "spd", 7);

    // Gold Ship: +1 hoặc -1 all stats tùy kết quả wheel
    if (goldShipResult["player1"] != null) {
      const d1 = goldShipResult["player1"] ? 1 : -1;
      for (const k of _ALL_STAT_KEYS) applyStatDelta(p1BaseStats, k, d1);
    }
    if (goldShipResult["player2"] != null) {
      const d2 = goldShipResult["player2"] ? 1 : -1;
      for (const k of _ALL_STAT_KEYS) applyStatDelta(p2BaseStats, k, d2);
    }

    // Mad Scientist: Shrinking (true) = đối thủ -2 all; Enlarging (false) = bản thân +2 all
    if (madScientistResult["player1"] != null) {
      if (madScientistResult["player1"]) {
        // Shrinking: đối thủ (p2) -2 all
        for (const k of _ALL_STAT_KEYS) applyStatDelta(p2BaseStats, k, -2);
      } else {
        // Enlarging: bản thân (p1) +2 all
        for (const k of _ALL_STAT_KEYS) applyStatDelta(p1BaseStats, k, 2);
      }
    }
    if (madScientistResult["player2"] != null) {
      if (madScientistResult["player2"]) {
        // Shrinking: đối thủ (p1) -2 all
        for (const k of _ALL_STAT_KEYS) applyStatDelta(p1BaseStats, k, -2);
      } else {
        // Enlarging: bản thân (p2) +2 all
        for (const k of _ALL_STAT_KEYS) applyStatDelta(p2BaseStats, k, 2);
      }
    }

    // Summoning Scroll: apply stat deltas từ summon wheel
    const p1Summon = summoningScrollResult["player1"];
    const p2Summon = summoningScrollResult["player2"];
    if (p1Summon) {
      for (const [k, v] of Object.entries(p1Summon.statDeltas)) {
        applyStatDelta(p1BaseStats, k as keyof CharacterStats, v as number);
      }
      if (p1Summon.startScoreDelta > 0) p1StartScore += p1Summon.startScoreDelta;
    }
    if (p2Summon) {
      for (const [k, v] of Object.entries(p2Summon.statDeltas)) {
        applyStatDelta(p2BaseStats, k as keyof CharacterStats, v as number);
      }
      if (p2Summon.startScoreDelta > 0) p2StartScore += p2Summon.startScoreDelta;
    }

    const init: StepCombatState = {
      p1Stats: p1BaseStats,
      p2Stats: p2BaseStats,
      p1Score: p1StartScore,
      p2Score: p2StartScore,
      startP1Score: p1StartScore,
      startP2Score: p2StartScore,
      p1CarryOver: [],
      p2CarryOver: [],
      resolvedRounds: [],
      roundLogs: [],
      p1TenacityFired: false,
      p2TenacityFired: false,
      p1ConquerorFired: false,
      p2ConquerorFired: false,
      p1FiredHandlers: new Set<string>(),
      p2FiredHandlers: new Set<string>(),
      p1DothrakiRule: null,
      p2DothrakiRule: null,
    };
    // Dothraki: apply spin result from pre-combat wheel (dothrakiSpinResult)
    // Two-pass: boosts first (rules 5, 6), then swaps (rules 1-4)
    // This ensures swaps always act on fully-boosted stats.
    const swapStats = (
      ref: CharacterStats,
      a: keyof CharacterStats,
      b: keyof CharacterStats,
    ) => {
      const tmp = ref[a] || 0;
      ref[a] = ref[b] || 0;
      ref[b] = tmp;
    };
    const p1Rule = (dothrakiSpinResult["player1"] ?? null) as DothrakiRule;
    const p2Rule = (dothrakiSpinResult["player2"] ?? null) as DothrakiRule;
    init.p1DothrakiRule = p1Rule;
    init.p2DothrakiRule = p2Rule;
    // Pass 1: stat boosts
    const applyBoosts = (dSide: "player1" | "player2", rule: DothrakiRule) => {
      if (rule === null) return;
      const oppSide = dSide === "player1" ? "player2" : "player1";
      const dRef = dSide === "player1" ? init.p1Stats : init.p2Stats;
      const oRef = oppSide === "player1" ? init.p1Stats : init.p2Stats;
      if (rule === 5) {
        for (const k of _ALL_STAT_KEYS) applyStatDelta(dRef, k, 4);
        if (oppSide === "player1") init.p1Score += 3;
        else init.p2Score += 3;
      } else if (rule === 6) {
        for (const k of _ALL_STAT_KEYS) applyStatDelta(oRef, k, 5);
      }
    };
    applyBoosts("player1", p1Rule);
    applyBoosts("player2", p2Rule);
    // Pass 2: stat swaps (on fully-boosted stats)
    const applySwaps = (dSide: "player1" | "player2", rule: DothrakiRule) => {
      if (rule === null) return;
      const oppSide = dSide === "player1" ? "player2" : "player1";
      const dRef = dSide === "player1" ? init.p1Stats : init.p2Stats;
      const oRef = oppSide === "player1" ? init.p1Stats : init.p2Stats;
      if (rule === 1) {
        swapStats(oRef, "str", "ma");
        swapStats(oRef, "spd", "biq");
        swapStats(oRef, "dur", "iq");
      } else if (rule === 2) {
        swapStats(dRef, "str", "biq");
      } else if (rule === 3) {
        swapStats(dRef, "spd", "iq");
      } else if (rule === 4) {
        swapStats(dRef, "dur", "ma");
      }
    };
    applySwaps("player1", p1Rule);
    applySwaps("player2", p2Rule);

    // Build pre-combat log: collect notifications for before_combat effects
    {
      const preCombatEvents: RoundEvent[] = [];
      const STAT_LABEL: Record<string, string> = {
        str: 'STR', spd: 'SPD', dur: 'DUR', iq: 'IQ', ma: 'MA', biq: 'BIQ',
        strength: 'STR', speed: 'SPD', durability: 'DUR', biq2: 'BIQ',
        all: 'All Stats',
      };
      const buildPreCombatEvents = (
        player: PvPPlayerData,
        playerSide: "player1" | "player2",
        selfBaseStats: CharacterStats,
        oppChar: Character | null,
        oppSide: "player1" | "player2",
      ) => {
        if (!player.character) return;
        const fx = EffectResolver.calculateCharacterEffects(player.character, { isPvE: false });
        const selfPowers = (player.character?.powers || []).filter((p: any) => !p?.isLost);
        const selfPowerCount = selfPowers.length;
        const oppPowers = (oppChar?.powers || []).filter((p: any) => !p?.isLost) || [];
        const oppPowerCount = oppPowers.length;

        for (const ce of fx.combatEffects) {
          if (ce.isActive === false) continue;
          if (ce.effect?.timing !== 'before_combat') continue;
          const srcName = ce.source?.name || '?';
          const srcType = ce.source?.type || '?';
          if (effectiveDisabledItems.has(`${player.no}-${srcType}-${srcName}`)) continue;

          const effectType = ce.effect?.type;
          const handler = (ce.effect as any).customHandler;

          // Guidance: execute handler and apply stat mods
          if (handler === 'guidance_fewer_powers_check') {
            if (selfPowerCount > oppPowerCount) {
              const shuffled = [..._ALL_STAT_KEYS].sort(() => Math.random() - 0.5);
              const chosen = shuffled.slice(0, 2);
              for (const stat of chosen) applyStatDelta(selfBaseStats, stat, 1);
              preCombatEvents.push({
                player: playerSide,
                source: srcName,
                description: `Đối thủ ít Power hơn (${oppPowerCount} < ${selfPowerCount}) → +1 ${chosen.map(s => STAT_LABEL[s] ?? s.toUpperCase()).join(', ')}`,
                type: 'stat_boost',
              });
            } else {
              preCombatEvents.push({
                player: playerSide,
                source: srcName,
                description: `Đối thủ không ít Power hơn (${oppPowerCount} vs ${selfPowerCount}) → không áp dụng`,
                type: 'info',
              });
            }
            continue;
          }

          // Power Negation / Anti-Magic Barrier: handled via CombatEffectsPanel wheel — skip pre-combat log
          if (effectType === 'power_disable' || effectType === 'disable_powers') {
            continue;
          }

          // Fair Duel: immunity notice
          if (effectType === 'immunity') {
            preCombatEvents.push({
              player: playerSide,
              source: srcName,
              description: `[${srcName}] Cả 2 miễn nhiễm Debuff từ nhau trong trận này`,
              type: 'info',
            });
            continue;
          }

          // Chastiefol: before_combat → +3 vào 2 stat thấp nhất của đối thủ
          if (handler === 'chastiefol_lowest_stats') {
            if (oppChar) {
              const oppS = oppChar.stats as CharacterStats;
              const STAT_KEYS_SHORT: (keyof CharacterStats)[] = ['str', 'spd', 'dur', 'iq', 'biq', 'ma'];
              const sorted = [...STAT_KEYS_SHORT].sort((a, b) => (Number(oppS[a]) || 0) - (Number(oppS[b]) || 0));
              const [low1, low2] = sorted;
              preCombatEvents.push({
                player: oppSide,
                source: srcName,
                description: `+3 ${low1.toUpperCase()}, +3 ${low2.toUpperCase()} (Chastiefol — đối thủ nhận buff 2 stat thấp nhất)`,
                type: 'stat_boost',
              });
            }
            continue;
          }

          // Adapt: log GM action
          if (handler === 'adapt_disable_known_powers') {
            preCombatEvents.push({
              player: playerSide,
              source: srcName,
              description: `[${srcName}] GM vô hiệu hóa các Power đối thủ đã gặp trong quá khứ (track riêng)`,
              type: 'info',
            });
            continue;
          }

          // debuffOpponent: stat_modifier or debuff with target 'opponent' (no customHandler)
          if (!handler && (effectType === 'stat_modifier' || effectType === 'debuff') && (ce.effect as any).target === 'opponent') {
            const val = ce.effect?.value ?? 0;
            const stat = ce.effect?.stat ?? '';
            if (val && stat) {
              const statLabel = STAT_LABEL[stat] ?? stat.toUpperCase();
              preCombatEvents.push({
                player: oppSide,
                source: srcName,
                description: `${val > 0 ? '+' : ''}${val} ${statLabel} (debuff từ ${player.name ?? playerSide})`,
                type: val < 0 ? 'stat_debuff' : 'stat_boost',
              });
            }
            continue;
          }

          // Mind Control: log if condition met (opponent IQ <= 5)
          if (handler === 'mind_control_iq_check') {
            const oppIq = (oppChar as any)?.stats?.iq ?? 0;
            if (oppIq <= 5) {
              preCombatEvents.push({
                player: playerSide,
                source: srcName,
                description: `Đối thủ IQ ≤ 5 (IQ=${oppIq}) → +1 all stats`,
                type: 'stat_boost',
              });
            }
            continue;
          }

          // Eternal Mangekyou Sharingan: chọn ngẫu nhiên 1 trong 3 hiệu ứng → debuff đối thủ ngay
          if (handler === 'eternal_mangekyou_random_effect') {
            const emOptions: Array<{ stat: keyof typeof selfBaseStats; label: string; effect: string }> = [
              { stat: 'dur', label: 'DUR', effect: 'Amaterasu' },
              { stat: 'iq', label: 'IQ', effect: 'Tsukuyomi' },
              { stat: 'str', label: 'STR', effect: 'Susanoo' },
            ];
            const chosen = emOptions[Math.floor(Math.random() * 3)];
            // Debuff applied to opponent base stats
            preCombatEvents.push({
              player: oppSide,
              source: srcName,
              description: `${chosen.effect} — -6 ${chosen.label} (Eternal Mangekyou Sharingan từ ${player.name ?? playerSide})`,
              type: 'stat_debuff',
            });
            continue;
          }

          // Uno Reverse Card: log info — engine phải đảo chiều debuff khi tính stat
          if (handler === 'uno_reverse_card_swap_debuffs') {
            preCombatEvents.push({
              player: playerSide,
              source: srcName,
              description: `[Uno Reverse Card] Debuff từ đối thủ bị phản lại chính đối thủ và ngược lại (GM xử lý khi tính stat)`,
              type: 'info',
            });
            continue;
          }

          // Enhanced Hearing: kiểm tra opp weapon (nhạc cụ) → -1 all; opp power (âm thanh) → -2 all
          if (handler === 'enhanced_hearing_instrument_check' || handler === 'enhanced_hearing_sound_power_check') {
            const INSTRUMENT_NAMES = ['bagpipe', 'drums', 'flute', 'guitar', 'violin', 'trumpet', 'piano', 'harp', 'lute', 'saxophone', 'bass', 'cello', 'harmonica', 'ukulele', 'nunchuck', 'ruan mei'];
            const SOUND_POWERS_LIST = ['zoltraak', 'rickrolling', 'music', 'sound', 'melody', 'siren', 'bard', 'singer'];
            const oppWeapons: any[] = (oppChar as any)?.weapons || [];
            const oppPowerNames: string[] = (oppChar?.powers || []).map((p: any) => (typeof p === 'string' ? p : p?.name ?? '').toLowerCase());
            const hasInstrument = oppWeapons.some((w: any) => {
              const wn = (typeof w === 'string' ? w : w?.name ?? '').toLowerCase();
              return INSTRUMENT_NAMES.some(inst => wn.includes(inst));
            });
            const hasSoundPower = oppPowerNames.some(p => SOUND_POWERS_LIST.some(sp => p.includes(sp)));
            if (handler === 'enhanced_hearing_instrument_check') {
              if (hasInstrument) {
                for (const s of _ALL_STAT_KEYS) applyStatDelta(selfBaseStats, s, -1);
                preCombatEvents.push({
                  player: playerSide,
                  source: srcName,
                  description: `Đối thủ dùng nhạc cụ → -1 tất cả stats (Enhanced Hearing)`,
                  type: 'stat_debuff',
                });
              } else {
                preCombatEvents.push({
                  player: playerSide,
                  source: srcName,
                  description: `Đối thủ không dùng nhạc cụ → không áp dụng (Enhanced Hearing)`,
                  type: 'info',
                });
              }
            } else {
              if (hasSoundPower) {
                for (const s of _ALL_STAT_KEYS) applyStatDelta(selfBaseStats, s, -2);
                preCombatEvents.push({
                  player: playerSide,
                  source: srcName,
                  description: `Đối thủ có power âm thanh → -2 tất cả stats (Enhanced Hearing)`,
                  type: 'stat_debuff',
                });
              } else {
                preCombatEvents.push({
                  player: playerSide,
                  source: srcName,
                  description: `Đối thủ không có power âm thanh → không áp dụng (Enhanced Hearing)`,
                  type: 'info',
                });
              }
            }
            continue;
          }

          // Luck Manipulation: từ vòng 64 (pvpWins ≥ 2) → 15% +1 all, 5% +2 all
          if (handler === 'luck_manipulation_round_64_check') {
            const pvpWins = (player.character as any)?.tournament?.pvpWins ?? (player.character as any)?.pvpWins ?? 0;
            if (pvpWins < 2) {
              preCombatEvents.push({
                player: playerSide,
                source: srcName,
                description: `Chưa đến vòng 64 (pvpWins=${pvpWins}) → không áp dụng (Luck Manipulation)`,
                type: 'info',
              });
            } else {
              // Only run once (two effects registered, skip second if already logged)
              const alreadyLogged = preCombatEvents.some(e => e.source === srcName && e.player === playerSide && e.type !== 'info');
              if (!alreadyLogged) {
                const roll = Math.random() * 100;
                if (roll < 5) {
                  for (const s of _ALL_STAT_KEYS) applyStatDelta(selfBaseStats, s, 2);
                  preCombatEvents.push({
                    player: playerSide,
                    source: srcName,
                    description: `+2 tất cả stats (Luck Manipulation — 5%, roll: ${roll.toFixed(1)}%)`,
                    type: 'stat_boost',
                  });
                } else if (roll < 20) {
                  for (const s of _ALL_STAT_KEYS) applyStatDelta(selfBaseStats, s, 1);
                  preCombatEvents.push({
                    player: playerSide,
                    source: srcName,
                    description: `+1 tất cả stats (Luck Manipulation — 15%, roll: ${roll.toFixed(1)}%)`,
                    type: 'stat_boost',
                  });
                } else {
                  preCombatEvents.push({
                    player: playerSide,
                    source: srcName,
                    description: `Không kích hoạt (Luck Manipulation — roll: ${roll.toFixed(1)}%)`,
                    type: 'info',
                  });
                }
              }
            }
            continue;
          }
        }
      };

      buildPreCombatEvents(player1, "player1", init.p1Stats, player2.character ?? null, "player2");
      buildPreCombatEvents(player2, "player2", init.p2Stats, player1.character ?? null, "player1");

      if (preCombatEvents.length > 0) {
        init.roundLogs.push({
          roundIndex: -1,
          statLabel: 'PRE-COMBAT',
          statKey: '',
          p1ValueUsed: 0,
          p2ValueUsed: 0,
          winner: 'tie',
          p1Score: init.p1Score,
          p2Score: init.p2Score,
          events: preCombatEvents,
          pointChanges: [],
          carryOverToNext: [],
        });
      }
    }

    setStepState(init);
    setStepRoundIndex(0);
  };

  // Resolve next round (called on "Next Round" button)
  const resolveNextRound = () => {
    if (!stepState || !player1 || !player2 || stepRoundIndex >= 6) return;
    // Block nếu round trước còn pending spins (Bash, Crit, Evasion...)
    if (stepRoundIndex > 0) {
      const lastRoundIdx = stepRoundIndex - 1;
      const p1Effs = getPerRoundEffects(player1.character, player1.no);
      const p2Effs = getPerRoundEffects(player2.character, player2.no);
      const lastRound = stepState.roundLogs.find((l) => l.roundIndex === lastRoundIdx);
      if (lastRound) {
        const w = lastRound.winner;
        if (computeRoundPoints("player1", w, lastRoundIdx, p1Effs, lastRound.statKey).pending) return;
        if (computeRoundPoints("player2", w, lastRoundIdx, p2Effs, lastRound.statKey).pending) return;
        if (lastRoundIdx < 5) {
          const SPINS = ["Bash", "Luminescence", "Scrying", "Ranger-Silver"];
          const p1WinEffs = w === "player1" ? p1Effs.onWin : [];
          const p2WinEffs = w === "player2" ? p2Effs.onWin : [];
          for (const eff of SPINS) {
            if (p1WinEffs.includes(eff) && !roundSpinResults[`${lastRoundIdx}-${eff}-player1`]) return;
            if (p2WinEffs.includes(eff) && !roundSpinResults[`${lastRoundIdx}-${eff}-player2`]) return;
          }
        }
      }
    }
    const { newState, log } = computeRoundStep(
      stepRoundIndex,
      stepState,
      player1,
      player2,
      oneTrickPonyStat,
    );
    setStepState(newState);
    setCurrentRound(stepRoundIndex);
    const nextIdx = stepRoundIndex + 1;
    setStepRoundIndex(nextIdx);

    // Spawn bubbles trực tiếp từ log events — không phụ thuộc vào derived lastRoundLog
    const bubbleItems = log.events
      .filter((e) => e.type === "stat_boost" || e.type === "stat_debuff")
      .map((e) => ({
        player: e.player,
        text: e.description.replace(/\s*\(.*?\)\s*$/, "").replace(/\s*permanent\s*$/, "").trim(),
        isPositive: e.type === "stat_boost",
      }));
    spawnStatBubbles(bubbleItems);

    if (nextIdx === 6) {
      // Finalize — apply before_combat_end effects (e.g. Edgelord) before determining winner
      let { p1Score, p2Score } = newState;
      const { resolvedRounds } = newState;

      const p1WonTotal = resolvedRounds.filter(
        (r) => r.winner === "player1",
      ).length;
      const p2WonTotal = resolvedRounds.filter(
        (r) => r.winner === "player2",
      ).length;

      const applyBeforeCombatEnd = (
        player: PvPPlayerData,
        playerSide: "player1" | "player2",
        selfRoundsWon: number,
        selfRoundsLost: number,
      ) => {
        if (!player.character) return;
        const fx = EffectResolver.calculateCharacterEffects(player.character, {
          isPvE: false,
        });
        for (const ce of fx.combatEffects) {
          if (ce.isActive === false) continue;
          if (ce.effect?.timing !== "before_combat_end") continue;
          if (ce.effect?.type !== "custom" || !ce.effect?.customHandler)
            continue;
          const sourceName = ce.source?.name || "?";
          const sourceType = ce.source?.type || "?";
          if (disabledItems.has(`${player.no}-${sourceType}-${sourceName}`))
            continue;

          const selfScore = playerSide === "player1" ? p1Score : p2Score;
          const oppScore = playerSide === "player1" ? p2Score : p1Score;
          const ctx: any = {
            self: {
              character: player.character,
              stats:
                playerSide === "player1" ? newState.p1Stats : newState.p2Stats,
              baseStats: player.baseStats,
              race: player.character?.race?.race || player.race || "",
              raceTier: player.raceTier,
              roundsWon: selfRoundsWon,
              roundsLost: selfRoundsLost,
              currentScore: selfScore,
            },
            opponent: {
              character: (playerSide === "player1" ? player2 : player1)
                ?.character,
              currentScore: oppScore,
            },
            isFinals: false,
            isPvE: false,
          };

          const result = HandlerRegistry.executeCombat(
            ce.effect.customHandler as string,
            ctx,
          );
          if (!result || result.skipDefault) continue;
          if (result.description) {
            newState.roundLogs.push({
              roundIndex: 6,
              stat: "final",
              winner: "tie",
              events: [{ player: playerSide, source: sourceName, description: result.description, type: "info" }],
              p1Score: playerSide === "player1" ? p1Score + (result.selfPoints || 0) : p1Score + (result.opponentPoints || 0),
              p2Score: playerSide === "player2" ? p2Score + (result.selfPoints || 0) : p2Score + (result.opponentPoints || 0),
            } as any);
          }
          if (result.selfPoints) {
            if (playerSide === "player1") p1Score += result.selfPoints;
            else p2Score += result.selfPoints;
          }
          if (result.opponentPoints) {
            if (playerSide === "player1") p2Score += result.opponentPoints;
            else p1Score += result.opponentPoints;
          }
        }
      };

      const p1LostTotal = resolvedRounds.filter((r) => r.winner === "player2").length;
      const p2LostTotal = resolvedRounds.filter((r) => r.winner === "player1").length;
      applyBeforeCombatEnd(player1, "player1", p1WonTotal, p1LostTotal);
      applyBeforeCombatEnd(player2, "player2", p2WonTotal, p2LostTotal);

      let overallWinner: "player1" | "player2";
      let tieBreaker: "race" | null = null;
      if (p1Score > p2Score) overallWinner = "player1";
      else if (p2Score > p1Score) overallWinner = "player2";
      else {
        tieBreaker = "race";
        overallWinner =
          player1.raceTier < player2.raceTier ? "player1" : "player2";
      }
      const finalResult: CombatResult = {
        rounds: resolvedRounds,
        player1Score: p1Score,
        player2Score: p2Score,
        startPlayer1Score: newState.startP1Score,
        startPlayer2Score: newState.startP2Score,
        winner: overallWinner,
        tieBreaker,
      };
      checkAndSetRoundtableHold(finalResult);
      setCombatResult(finalResult);

      // Build after-combat quirk effects and apply auto ones
      const acEntries: AfterCombatEntry[] = [];
      const processAfterCombat = (
        player: PvPPlayerData,
        side: "player1" | "player2",
        didWin: boolean,
        roundResults: Record<string, "win" | "lose" | "tie">,
        opponent: PvPPlayerData | null,
      ) => {
        const char = player.character;
        if (!char) return;
        const quirks = (char.quirks || []).filter((q: any) => !q.isLost);
        const isDisabled = (name: string) =>
          disabledItems.has(`${player.no}-quirk-${name}`);

        for (const q of quirks) {
          const name: string = q.name;
          if (isDisabled(name)) continue;
          const lname = name.toLowerCase();

          // Slow Healer: -1 Dura sau combat
          if (lname === "slow healer") {
            acEntries.push({
              player: side,
              quirkName: name,
              description: "-1 Durability (Slow Healer)",
              statMods: [{ stat: "dur", delta: -1 }],
            });
          }
          // Lazy: -1 Str, -1 Spd, +2 IQ
          else if (lname === "lazy") {
            acEntries.push({
              player: side,
              quirkName: name,
              description: "-1 STR, -1 SPD, +2 IQ (Lazy)",
              statMods: [
                { stat: "str", delta: -1 },
                { stat: "spd", delta: -1 },
                { stat: "iq", delta: 2 },
              ],
            });
          }
          // Compassionate: sau thắng +1 IQ + GM tặng gear
          else if (lname === "compassionate" && didWin) {
            acEntries.push({
              player: side,
              quirkName: name,
              description: "+1 IQ (Compassionate). [GM Action] Tặng 1 Gear cho đối thủ.",
              statMods: [{ stat: "iq", delta: 1 }],
              gmAction: true,
            });
          }
          // Resilient: 36% +1 stat from lost round (spin)
          else if (lname === "resilient") {
            const lostStats = (["str","spd","dur","iq","biq","ma"] as (keyof CharacterStats)[])
              .filter((s) => roundResults[s] === "lose");
            if (lostStats.length > 0) {
              const wk = `after-Resilient-${side}`;
              const lostStatLabels = lostStats.map(s => s.toUpperCase()).join("/");
              acEntries.push({
                player: side,
                quirkName: name,
                description: `36% +1 vào chỉ số đã thua round (${lostStatLabels}) (Resilient)`,
                wheelKey: wk,
                wheelItems: [
                  { label: `Thành công! +1 stat đã thua (${lostStatLabels}) (36%)`, weight: 36, isSuccess: true, color: "#34d399" },
                  { label: "Không kích hoạt (64%)", weight: 64, isSuccess: false, color: "#6b7280" },
                ],
                gmAction: true,
              });
            }
          }
          // Fast Learner: 33% copy power (spin)
          else if (lname === "fast learner") {
            const oppPowers = ((side === "player1" ? player2 : player1)?.character?.powers || [])
              .filter((p: any) => !p.isLost)
              .map((p: any) => typeof p === "string" ? p : p.name);
            if (oppPowers.length > 0) {
              const wk = `after-FastLearner-${side}`;
              acEntries.push({
                player: side,
                quirkName: name,
                description: "33% học 1 Power của đối thủ (Fast Learner)",
                wheelKey: wk,
                wheelItems: [
                  { label: "Học được Power! (33%)", weight: 33, isSuccess: true, color: "#818cf8" },
                  { label: "Không học được (67%)", weight: 67, isSuccess: false, color: "#6b7280" },
                ],
                gmAction: true,
              });
            }
          }
          // Night Owl: 10% -1 all stats (spin)
          else if (lname === "night owl") {
            const wk = `after-NightOwl-${side}`;
            acEntries.push({
              player: side,
              quirkName: name,
              description: "10% nhận -1 all stats (Night Owl)",
              wheelKey: wk,
              wheelItems: AFTER_COMBAT_WHEEL_ITEMS["Night Owl"],
              statMods: (["str","spd","dur","iq","biq","ma"] as (keyof CharacterStats)[])
                .map((s) => ({ stat: s, delta: -1 })),
            });
          }
          // Open-minded: 33% biến đối thủ thành Lover (spin, GM action)
          else if (lname === "open-minded") {
            const wk = `after-OpenMinded-${side}`;
            acEntries.push({
              player: side,
              quirkName: name,
              description: "33% biến đối thủ thành Lover (Open-minded)",
              wheelKey: wk,
              wheelItems: AFTER_COMBAT_WHEEL_ITEMS["Open-minded"],
              gmAction: true,
            });
          }
          // Under the Weather: sau thắng → transform
          else if (lname === "under the weather" && didWin) {
            acEntries.push({
              player: side,
              quirkName: name,
              description: '[GM Action] Xóa "Under the Weather", nhận "Shining Brightly"',
              gmAction: true,
            });
          }
          // Shining Brightly: sau thua → transform
          else if (lname === "shining brightly" && !didWin) {
            acEntries.push({
              player: side,
              quirkName: name,
              description: '[GM Action] Xóa "Shining Brightly", nhận "Under the Weather"',
              gmAction: true,
            });
          }
          // Herbalist: nhận thảo dược (GM wheel)
          else if (lname === "herbalist") {
            acEntries.push({
              player: side,
              quirkName: name,
              description: "[GM Action] Nhận 1 thảo dược (Thảo Dược Wheel)",
              gmAction: true,
            });
          }
          // Artistic: +2 IQ nếu đối thủ dùng nhạc cụ
          else if (lname === "artistic") {
            const INSTRUMENTS = ["bagpipe","drums","flute","guitar","violin","trumpet","piano","harp","lute","saxophone","bass","cello","harmonica","ukulele","nunchuck","ruan mei"];
            const oppWeapons = (opponent?.character?.weapons || [])
              .map((w: any) => (typeof w === "string" ? w : w?.name ?? "").toLowerCase());
            if (oppWeapons.some((w: string) => INSTRUMENTS.some(i => w.includes(i)))) {
              acEntries.push({
                player: side,
                quirkName: name,
                description: "+2 IQ (Artistic — đối thủ dùng nhạc cụ)",
                statMods: [{ stat: "iq", delta: 2 }],
              });
            }
          }
          // Progressive: sau thua → GM reroll (GM action)
          else if (lname === "progressive" && !didWin) {
            acEntries.push({
              player: side,
              quirkName: name,
              description: "[GM Action] Quay lại toàn bộ stats. Nếu tổng mới > cũ → +1 all stats (Progressive)",
              gmAction: true,
            });
          }
          // Generous: sau thắng GM tặng reward; sau thua GM tính bonus
          else if (lname === "generous") {
            if (didWin) {
              acEntries.push({
                player: side,
                quirkName: name,
                description: "[GM Action] Tặng đối thủ PvP Reward (Generous)",
                gmAction: true,
              });
            } else {
              acEntries.push({
                player: side,
                quirkName: name,
                description: "[GM Action] +1 Power và +1 chỉ số thấp nhất mỗi PvP Reward đã tặng (Generous)",
                gmAction: true,
              });
            }
          }
          // Patient: sau thắng → quay 4 power wheel kết quả tối đa
          else if (lname === "patient" && didWin) {
            const playerPowers = new Set(
              (char.powers || [])
                .filter((p: any) => !p.isLost)
                .map((p: any) => (typeof p === "string" ? p : p?.name ?? "").toLowerCase())
            );
            const allPowers = EffectRegistry.getAllByType("power").map((e) => e.name);
            const availablePowers = allPowers.filter((p) => !playerPowers.has(p.toLowerCase()));
            if (availablePowers.length > 0) {
              const wheelItems: WheelSpinItem[] = availablePowers.map((p) => ({
                label: p,
                weight: 1,
                isSuccess: true,
                color: "#818cf8",
              }));
              for (let spin = 1; spin <= 4; spin++) {
                const wk = `after-Patient-${side}-${spin}`;
                acEntries.push({
                  player: side,
                  quirkName: `${name} (${spin}/4)`,
                  description: `Quay Power #${spin} — kết quả tối đa (Patient)`,
                  wheelKey: wk,
                  wheelItems,
                  gmAction: true,
                });
              }
            } else {
              acEntries.push({
                player: side,
                quirkName: name,
                description: "(Không còn Power nào để nhận — Patient)",
                gmAction: true,
              });
            }
          }
        }

        // ── Gear after_combat effects ──────────────────────────────────────
        const normalGears = (char.gear?.normalGear || []).filter((g: any) => !g.isLost);
        const legacyGears = (char.gear?.legacyGear || []).filter((g: any) => !g.isLost);
        const allGears = [...normalGears, ...legacyGears];
        for (const g of allGears) {
          const gname: string = typeof g === "string" ? g : g?.name ?? "";
          const lname = gname.toLowerCase();
          const gDisabled = disabledItems.has(`${player.no}-gear-${gname}`);
          if (gDisabled) continue;

          // Giấy Nợ Gia Truyền: score < 4 → mất gear/weapon + quay truyền cho member cùng nhà; score ≥ 4 → nhận 2 Golden Coin
          if (lname === "giấy nợ gia truyền") {
            const finalScore = side === "player1" ? p1Score : p2Score;
            if (finalScore < 4) {
              // Lấy house của player và tìm members cùng nhà (trừ chính player)
              const playerHouses: string[] = (char.houses || [])
                .filter((h: any) => !h.isLost)
                .map((h: any) => (typeof h === "string" ? h : h?.name ?? "").toLowerCase());
              const houseMembers = allPlayers.filter((p) => {
                if (p.no === player.no) return false;
                const pHouses = (p.character?.houses || [])
                  .filter((h: any) => !h.isLost)
                  .map((h: any) => (typeof h === "string" ? h : h?.name ?? "").toLowerCase());
                return pHouses.some((ph) => playerHouses.includes(ph));
              });
              if (houseMembers.length > 0) {
                const wk = `after-GiayNo-${side}`;
                acEntries.push({
                  player: side,
                  quirkName: gname,
                  description: `[Score ${finalScore} < 4] Mất toàn bộ Gear và Weapon. Quay chọn người trong nhà nhận Giấy Nợ:`,
                  wheelKey: wk,
                  wheelItems: houseMembers.map((m) => ({
                    label: `${m.name} (#${m.no})`,
                    weight: 1,
                    isSuccess: true,
                    color: "#f59e0b",
                  })),
                  gmAction: true,
                });
              } else {
                acEntries.push({
                  player: side,
                  quirkName: gname,
                  description: `[Score ${finalScore} < 4] Mất toàn bộ Gear và Weapon. [GM Action] Không tìm được member cùng nhà — GM xử lý thủ công`,
                  gmAction: true,
                });
              }
            } else {
              acEntries.push({
                player: side,
                quirkName: gname,
                description: `[Score ${finalScore} ≥ 4] Nhận 2 Golden Coin (Giấy Nợ Gia Truyền)`,
                gmAction: true,
              });
            }
          }

          // Đá: sau combat thua → -3 all stats
          if (lname === "đá" && !didWin) {
            acEntries.push({
              player: side,
              quirkName: gname,
              description: "-3 All Stats (Đá — thua combat)",
              statMods: (["str","spd","dur","iq","biq","ma"] as (keyof CharacterStats)[])
                .map((s) => ({ stat: s, delta: -3 })),
            });
          }

          // The Tamer Straight Sword: sau combat thắng → đánh cắp 1 Power ngẫu nhiên đối thủ
          if ((lname === "the tamer straight sword" || lname === "tamer straight sword") && didWin) {
            acEntries.push({
              player: side,
              quirkName: gname,
              description: "[GM Action] Đánh cắp 1 Power ngẫu nhiên của đối thủ (The Tamer Straight Sword — thắng combat)",
              gmAction: true,
            });
          }

          // Sổ tay: sau combat thua round IQ → +1 IQ
          if (lname === "sổ tay") {
            const iqResult = roundResults["iq"];
            if (iqResult === "lose") {
              acEntries.push({
                player: side,
                quirkName: gname,
                description: "Sổ tay: Thua round IQ → +1 IQ",
                statMods: [{ stat: "iq" as keyof CharacterStats, delta: 1 }],
              });
            }
          }

          // Thuốc Tráng Dương: sau combat → -1 STR, -1 DUR
          if (lname === "thuốc tráng dương") {
            acEntries.push({
              player: side,
              quirkName: gname,
              description: "Thuốc Tráng Dương: Sau combat → -1 STR, -1 DUR",
              statMods: [
                { stat: "str" as keyof CharacterStats, delta: -1 },
                { stat: "dur" as keyof CharacterStats, delta: -1 },
              ],
            });
          }

          // Khung hình thờ: nếu cả 2 có → huỷ hiệu ứng + xóa cả 2; nếu người này thua → chuyển cho người thắng
          if (lname === "khung hình thờ") {
            const oppGears = (opponent?.character?.gear?.normalGear || []);
            const oppHasKhung = oppGears.some((g: any) => {
              const n = typeof g === "string" ? g : g?.name ?? "";
              return n.toLowerCase().startsWith("khung hình thờ");
            });
            if (oppHasKhung) {
              acEntries.push({
                player: side,
                quirkName: gname,
                description: "[GM Action] Khung Hình Thờ: Cả hai đều có → loại bỏ hiệu ứng và xóa gear của cả hai sau trận",
                gmAction: true,
              });
            } else if (!didWin) {
              acEntries.push({
                player: side,
                quirkName: gname,
                description: "[GM Action] Khung Hình Thờ: Người này bị loại → chuyển gear sang người thắng",
                gmAction: true,
              });
            }
          }

          // Kuro's Charm: sau combat thắng → phá hủy gear này
          if (lname === "kuro's charm" && didWin) {
            acEntries.push({
              player: side,
              quirkName: gname,
              description: "[GM Action] Kuro's Charm: Phá hủy gear này sau combat thắng",
              gmAction: true,
            });
          }

          // Shaggydog: sau combat → +1 stat thấp nhất nếu nhà Stark
          if (lname === "shaggydog") {
            const house = ((char as any).house || (char as any).character?.house || "").toLowerCase();
            if (house.includes("stark")) {
              const statKeys = ["str","spd","dur","iq","biq","ma"] as (keyof CharacterStats)[];
              const currentStats = stepState ? (side === "player1" ? stepState.p1Stats : stepState.p2Stats) : (player?.character ? calcStatsWithDisabled(player.character, player.no, disabledItems) : player?.stats);
              const lowestStat = currentStats ? statKeys.reduce((a, b) => ((currentStats[a] ?? 0) <= (currentStats[b] ?? 0) ? a : b)) : "str";
              acEntries.push({
                player: side,
                quirkName: gname,
                description: `Shaggydog: Nhà Stark → +1 ${lowestStat.toUpperCase()} (stat thấp nhất)`,
                statMods: [{ stat: lowestStat, delta: 1 }],
              });
            }
          }
        }

        // ── Weapon after_combat effects ────────────────────────────────────
        const weapons = (char.weapons || []).filter((w: any) => !w.isLost);
        for (const w of weapons) {
          const wname: string = typeof w === "string" ? w : w?.name ?? "";
          const lname = wname.toLowerCase();
          const wDisabled = disabledItems.has(`${player.no}-weapon-${wname}`);
          if (wDisabled) continue;

          // Guinsoo's Rageblade: sau combat → +2 SPD
          if (lname === "guinsoo's rageblade") {
            acEntries.push({
              player: side,
              quirkName: wname,
              description: "+2 Speed (Guinsoo's Rageblade — sau combat)",
              statMods: [{ stat: "spd" as keyof CharacterStats, delta: 2 }],
            });
          }
          // War Axe: sau combat → -1 Dura
          else if (lname === "war axe") {
            acEntries.push({
              player: side,
              quirkName: wname,
              description: "-1 Durability (War Axe — sau combat)",
              statMods: [{ stat: "dur" as keyof CharacterStats, delta: -1 }],
            });
          }

          // Labrys Axe: sau combat thắng → PvP Reward gấp đôi
          if (lname === "labrys axe" && didWin) {
            acEntries.push({
              player: side,
              quirkName: wname,
              description: "[GM Action] PvP Reward gấp đôi (Labrys Axe — thắng combat)",
              gmAction: true,
            });
          }

          // Hou Yi's Divine Bow: sau combat → vòng quay Hậu Nghệ (+3 all stats nếu trúng)
          if (lname === "hou yi's divine bow") {
            acEntries.push({
              player: side,
              quirkName: wname,
              description: "[GM Action] Vòng quay Hậu Nghệ: Bắn 9 mặt trời, +3 all stats (Hou Yi's Divine Bow — sau combat)",
              gmAction: true,
            });
          }

          // Caestus: sau combat → +1 MA
          if (lname === "caestus") {
            acEntries.push({
              player: side,
              quirkName: wname,
              description: "Caestus: Sau combat → +1 MA",
              statMods: [{ stat: "ma" as keyof CharacterStats, delta: 1 }],
            });
          }

          // Wand: sau combat → -2 Dura + nhận 1 Power ngẫu nhiên (GM)
          if (lname === "wand") {
            acEntries.push({
              player: side,
              quirkName: wname,
              description: "Wand: Sau combat → -2 Dura",
              statMods: [{ stat: "dur" as keyof CharacterStats, delta: -2 }],
            });
            acEntries.push({
              player: side,
              quirkName: wname + " (Power)",
              description: "[GM Action] Wand: Quay Power Wheel, trao 1 Power ngẫu nhiên",
              gmAction: true,
            });
          }

          // Glass Bottle: sau combat → loại bỏ vũ khí này (GM thông báo)
          if (lname === "glass bottle") {
            acEntries.push({
              player: side,
              quirkName: wname,
              description: "[GM Action] Glass Bottle: Vỡ sau combat — loại bỏ vũ khí này",
              gmAction: true,
            });
          }

          // Andúril: sau combat → nhận Summon Wheel (GM)
          if (lname === "andúril" || lname === "anduril") {
            acEntries.push({
              player: side,
              quirkName: wname,
              description: "[GM Action] Andúril: Nhận Summon Wheel sau combat",
              gmAction: true,
            });
          }

          // Halberd: sau combat thắng round STR → +1 BIQ, +1 MA
          if (lname === "halberd") {
            if (roundResults["str"] === "win") {
              acEntries.push({
                player: side,
                quirkName: wname,
                description: "Halberd: Thắng round STR → +1 BIQ, +1 MA",
                statMods: [
                  { stat: "biq" as keyof CharacterStats, delta: 1 },
                  { stat: "ma" as keyof CharacterStats, delta: 1 },
                ],
              });
            }
          }
        }

        // ── Power after_combat / after_combat_lose effects ─────────────────
        const powers = (char.powers || []).filter((p: any) => !p.isLost);
        for (const pw of powers) {
          const pname: string = typeof pw === "string" ? pw : pw?.name ?? "";
          const lname = pname.toLowerCase();
          const pDisabled = disabledItems.has(`${player.no}-power-${pname}`);
          if (pDisabled) continue;

          // Bloody Strike: sau combat → +1 mỗi stat đã thắng round
          if (lname === "bloody strike") {
            const wonStats = (["str","spd","dur","iq","biq","ma"] as (keyof CharacterStats)[])
              .filter((s) => roundResults[s] === "win");
            if (wonStats.length > 0) {
              acEntries.push({
                player: side,
                quirkName: pname,
                description: `+1 ${wonStats.map(s => s.toUpperCase()).join("/")} (Bloody Strike — thắng round)`,
                statMods: wonStats.map((s) => ({ stat: s, delta: 1 })),
              });
            }
          }

          // Memory Freeze: sau combat thua → đối thủ nhận Quirk "Brainrot"
          if (lname === "memory freeze" && !didWin) {
            acEntries.push({
              player: side === "player1" ? "player2" : "player1",
              quirkName: pname,
              description: `[GM Action] Nhận Quirk "Brainrot" (Memory Freeze — ${side} thua)`,
              gmAction: true,
            });
          }

          // Magma Strike: sau combat → -1 Dura đối thủ
          if (lname === "magma strike") {
            acEntries.push({
              player: side === "player1" ? "player2" : "player1",
              quirkName: pname,
              description: "-1 Durability (Magma Strike — đối thủ, sau combat)",
              statMods: [{ stat: "dur" as keyof CharacterStats, delta: -1 }],
            });
          }

          // Rampage: sau combat thắng → 36% +1 all stats (wheel)
          if (lname === "rampage" && didWin) {
            acEntries.push({
              player: side,
              quirkName: pname,
              description: "36% +1 All Stats (Rampage — thắng combat)",
              wheelKey: `after-Rampage-${side}`,
              wheelItems: [
                { label: "+1 All Stats (36%)", weight: 36, isSuccess: true, color: "#f59e0b" },
                { label: "Không kích hoạt (64%)", weight: 64, isSuccess: false, color: "#6b7280" },
              ],
              statMods: (["str","spd","dur","iq","biq","ma"] as (keyof CharacterStats)[]).map(s => ({ stat: s, delta: 1 })),
            });
          }

          // Bloodlust: sau combat thắng → -1 IQ/MA, +1 Str/Spd, +2 Dura
          if (lname === "bloodlust" && didWin) {
            acEntries.push({
              player: side,
              quirkName: pname,
              description: "-1 IQ, -1 MA, +1 STR, +1 SPD, +2 DUR (Bloodlust — thắng combat)",
              statMods: [
                { stat: "iq" as keyof CharacterStats, delta: -1 },
                { stat: "ma" as keyof CharacterStats, delta: -1 },
                { stat: "str" as keyof CharacterStats, delta: 1 },
                { stat: "spd" as keyof CharacterStats, delta: 1 },
                { stat: "dur" as keyof CharacterStats, delta: 2 },
              ],
            });
          }

          // AIDS: sau combat → -2 Dura bản thân + lây sang Lover
          if (lname === "aids") {
            acEntries.push({
              player: side,
              quirkName: pname,
              description: "-2 Durability (AIDS — sau combat)",
              statMods: [{ stat: "dur" as keyof CharacterStats, delta: -2 }],
            });
            // Lây sang Lover nếu có
            const lovers: any[] = player.character?.lover || [];
            const activeLoverNames = lovers
              .filter((l: any) => !l.isLost)
              .map((l: any) => (typeof l === "string" ? l : l?.name ?? ""))
              .filter(Boolean);
            if (activeLoverNames.length > 0) {
              acEntries.push({
                player: side,
                quirkName: pname,
                description: `[GM Action] Lây AIDS sang Lover: ${activeLoverNames.join(", ")} (AIDS)`,
                gmAction: true,
              });
            }
          }

          // Odin Blessing: sau combat thua → +2 stat cao nhất thay vì +2 STR
          if (lname === "odin blessing" && !didWin) {
            acEntries.push({
              player: side,
              quirkName: pname,
              description: "[GM Action] Chuyển +2 STR thành +2 Stat cao nhất (Odin Blessing — thua combat)",
              gmAction: true,
            });
          }

          // Acid Breath: sau combat thắng → nhận Power "Poison Breath"
          if (lname === "acid breath" && didWin) {
            acEntries.push({
              player: side,
              quirkName: pname,
              description: '[GM Action] Nhận Power "Poison Breath" (Acid Breath — thắng combat)',
              gmAction: true,
            });
          }

          // Poison Breath: sau combat thua → nhận Power "Garlic Breath"
          if (lname === "poison breath" && !didWin) {
            acEntries.push({
              player: side,
              quirkName: pname,
              description: '[GM Action] Nhận Power "Garlic Breath" (Poison Breath — thua combat)',
              gmAction: true,
            });
          }

          // Primordial Being: sau combat thắng → GM action
          if (lname === "primordial being" && didWin) {
            acEntries.push({
              player: side,
              quirkName: pname,
              description: "[GM Action] Primordial Being kích hoạt sau combat thắng",
              gmAction: true,
            });
          }

          // Spirit Link: sau combat thắng → +1 stat ngẫu nhiên
          if (lname === "spirit link" && didWin) {
            acEntries.push({
              player: side,
              quirkName: pname,
              description: "[GM Action] +1 Stat ngẫu nhiên (Spirit Link — thắng combat, loại đối thủ)",
              gmAction: true,
            });
          }

          // Stat Absorption: sau combat thắng → +1 stat cao nhất của đối thủ
          if (lname === "stat absorption" && didWin) {
            acEntries.push({
              player: side,
              quirkName: pname,
              description: "[GM Action] +1 vào chỉ số cao nhất của đối thủ (Stat Absorption — thắng combat)",
              gmAction: true,
            });
          }

          // Power Absorption: sau combat thắng → hấp thụ 1 Power ngẫu nhiên
          if (lname === "power absorption" && didWin) {
            acEntries.push({
              player: side,
              quirkName: pname,
              description: "[GM Action] Hấp thụ 1 Power ngẫu nhiên của đối thủ (Power Absorption — thắng combat)",
              gmAction: true,
            });
          }

          // Chaos Enchantment: sau combat → +1 Str/MA nếu trong nhánh thua
          if (lname === "chaos enchantment") {
            const bracket = player.character?.tournament?.bracket || "";
            if (bracket.toLowerCase() === "loser") {
              acEntries.push({
                player: side,
                quirkName: pname,
                description: "+1 STR, +1 MA (Chaos Enchantment — nhánh thua)",
                statMods: [
                  { stat: "str" as keyof CharacterStats, delta: 1 },
                  { stat: "ma" as keyof CharacterStats, delta: 1 },
                ],
              });
            }
          }

          // Bucking Bronco: sau combat thắng + thắng round MA → +1 MA
          if (lname === "bucking bronco" && didWin) {
            if (roundResults["ma"] === "win") {
              acEntries.push({
                player: side,
                quirkName: pname,
                description: "+1 MA (Bucking Bronco — thắng round MA và thắng combat)",
                statMods: [{ stat: "ma" as keyof CharacterStats, delta: 1 }],
              });
            }
          }

          // Lone Wolf: sau combat — nếu đối thủ cũng có Lone Wolf → mất power (GM action)
          if (lname === "lone wolf") {
            const oppPowers: any[] = opponent?.character?.powers || [];
            const oppHasLoneWolf = oppPowers.some((p: any) => {
              const n = typeof p === "string" ? p : p?.name ?? "";
              return n.toLowerCase().includes("lone wolf");
            });
            if (oppHasLoneWolf) {
              acEntries.push({
                player: side,
                quirkName: pname,
                description: "[GM Action] Cả hai đều có Lone Wolf → mất power Lone Wolf (Lone Wolf)",
                gmAction: true,
              });
            }
          }

          // Healing Factor: sau combat — +1 Dura với mỗi 2 round thua
          if (lname === "healing factor") {
            const allRounds = Object.values(roundResults);
            const roundsLost = allRounds.filter((r) => r === "lose").length;
            const bonus = Math.floor(roundsLost / 2);
            if (bonus > 0) {
              acEntries.push({
                player: side,
                quirkName: pname,
                description: `+${bonus} DUR (Healing Factor — ${roundsLost} round thua)`,
                statMods: [{ stat: "dur" as keyof CharacterStats, delta: bonus }],
              });
            }
          }

          // Cinder Flickering: sau combat — nếu cả 2 có → người thắng nhận Char Dev "Lord of Cinder"
          if (lname === "cinder flickering" && didWin) {
            const oppPowers: any[] = opponent?.character?.powers || [];
            const oppHasCinder = oppPowers.some((p: any) => {
              const n = typeof p === "string" ? p : p?.name ?? "";
              return n.toLowerCase().includes("cinder flickering");
            });
            if (oppHasCinder) {
              acEntries.push({
                player: side,
                quirkName: pname,
                description: '[GM Action] Người thắng nhận Char Dev "Lord of Cinder" (Cinder Flickering — cả 2 có power)',
                gmAction: true,
              });
            }
          }

          // Darwin Evolution Theory: sau combat → GM nâng race tier +1
          if (lname === "darwin evolution theory") {
            acEntries.push({
              player: side,
              quirkName: pname,
              description: "[GM Action] Thăng hạng chủng tộc +1 bậc (Darwin Evolution Theory)",
              gmAction: true,
            });
          }

          // Algorithms Are Clear: sau combat → thay Base Stat thấp nhất = avg stat đối thủ
          if (lname === "algorithms are clear") {
            const oppChar = opponent?.character;
            if (oppChar) {
              const STAT_KEYS: (keyof CharacterStats)[] = ["str", "spd", "dur", "iq", "biq", "ma"];
              const oppStats = oppChar.stats as CharacterStats;
              const totalOppBase = STAT_KEYS.reduce((sum, s) => sum + (Number(oppStats?.[s]) || 0), 0);
              const avgOppBase = Math.round(totalOppBase / 6);
              const selfStats = char.stats as CharacterStats;
              let lowestStat: keyof CharacterStats = "str";
              let lowestVal = Number(selfStats["str"]) || 0;
              for (const s of STAT_KEYS) {
                const v = Number(selfStats[s]) || 0;
                if (v < lowestVal) { lowestVal = v; lowestStat = s; }
              }
              const diff = avgOppBase - lowestVal;
              if (diff !== 0) {
                acEntries.push({
                  player: side,
                  quirkName: pname,
                  description: `${diff > 0 ? "+" : ""}${diff} ${lowestStat.toUpperCase()} (Algorithms Are Clear — avg stat đối thủ ${avgOppBase})`,
                  statMods: [{ stat: lowestStat, delta: diff }],
                });
              } else {
                acEntries.push({
                  player: side,
                  quirkName: pname,
                  description: `[Info] ${lowestStat.toUpperCase()} đã bằng avg stat đối thủ (${avgOppBase}) — không thay đổi (Algorithms Are Clear)`,
                });
              }
            }
          }

          // Super Lucky: sau combat thua → 15% lật kèo, nếu không thêm 10%
          if (lname === "super lucky" && !didWin) {
            const roll1 = Math.random();
            const flipped = roll1 < 0.15;
            const roll2 = flipped ? null : Math.random();
            const flipped2 = !flipped && roll2 !== null && roll2 < 0.10;
            acEntries.push({
              player: side,
              quirkName: pname,
              description: flipped
                ? `LẬT KÈO! (Super Lucky — 15%, roll: ${(roll1 * 100).toFixed(1)}%) [GM xử lý đảo kết quả]`
                : flipped2
                  ? `LẬT KÈO! (Super Lucky — 10% lần 2, roll: ${(roll2! * 100).toFixed(1)}%) [GM xử lý đảo kết quả]`
                  : `Không lật kèo (Super Lucky — 15% trượt: ${(roll1 * 100).toFixed(1)}%, 10% trượt: ${(roll2! * 100).toFixed(1)}%)`,
              gmAction: flipped || flipped2,
            });
          }
        }
      };

      const p1WonCombat = overallWinner === "player1";
      const p2WonCombat = overallWinner === "player2";
      // Build roundResults map (str/spd/dur/iq/biq/ma → win/lose/tie) for each player
      const buildRoundResultsMap = (forSide: "player1" | "player2") => {
        const map: Record<string, "win" | "lose" | "tie"> = {};
        for (const r of resolvedRounds) {
          const key = r.stat;
          map[key] = r.winner === forSide ? "win" : r.winner === "tie" ? "tie" : "lose";
        }
        return map;
      };

      processAfterCombat(player1, "player1", p1WonCombat, buildRoundResultsMap("player1"), player2);
      processAfterCombat(player2, "player2", p2WonCombat, buildRoundResultsMap("player2"), player1);
      setAfterCombatEntries(acEntries);
      setAfterCombatSpinResults({});

      // Auto-apply non-wheel stat mods immediately to player stats
      // (These are permanent changes to character stats that GMs track)
      const acBubbles: { player: "player1" | "player2"; text: string; isPositive: boolean }[] = [];
      for (const entry of acEntries) {
        if (entry.wheelKey) continue; // wheel-pending, apply after spin
        if (!entry.statMods || entry.statMods.length === 0) continue;
        for (const mod of entry.statMods) {
          acBubbles.push({
            player: entry.player,
            text: `${mod.delta >= 0 ? "+" : ""}${mod.delta} ${mod.stat.toUpperCase()} (${entry.quirkName})`,
            isPositive: mod.delta >= 0,
          });
        }
      }
      if (acBubbles.length > 0) spawnStatBubbles(acBubbles);

      // autoSave — full log như sandbox
      import("../utils/googleDrive").then(({ appendReportToDrive }) => {
        import("../config/googleDrive").then(({ REPORT_FILE_ID }) => {
          const now = new Date().toLocaleString("vi-VN");
          const sep = `\n${"─".repeat(60)}\nPVP SESSION: ${now}\n${"─".repeat(60)}\n`;
          const line = "═".repeat(60);
          const p1name = player1.name, p2name = player2.name;
          const winnerName = overallWinner === "player1" ? p1name : p2name;
          const loserName  = overallWinner === "player1" ? p2name : p1name;
          const ls: string[] = [];

          ls.push(`PvP Battle Report`);
          ls.push(`Thời gian: ${now}`);
          ls.push(line);
          ls.push(`${p1name} (#${player1.no}) vs ${p2name} (#${player2.no})`);
          ls.push(`Race: ${player1.character?.race?.race ?? "?"} (T${player1.raceTier}) vs ${player2.character?.race?.race ?? "?"} (T${player2.raceTier})`);
          ls.push(line);

          // Inventory
          const renderInv = (p: PvPPlayerData) => {
            const char = p.character; if (!char) return;
            ls.push(`\nItems & hiệu ứng — ${p.name}:`);
            const inv = buildInventoryList(char);
            if (inv.length === 0) ls.push("  (không có)");
            for (const it of inv) ls.push(`  [${it.sourceType}] ${it.name}`);
            if (char.runes?.runeword) ls.push(`  [runeword] ${char.runes.runeword}`);
          };
          renderInv(player1); renderInv(player2);

          // Stats before combat
          const SKEYS: { key: keyof typeof newState.p1Stats; label: string }[] = [
            { key: "str", label: "STR" }, { key: "spd", label: "SPD" },
            { key: "dur", label: "DUR" }, { key: "iq", label: "IQ" },
            { key: "biq", label: "BIQ" }, { key: "ma", label: "MA" },
          ];
          const fmtStats = (s: typeof newState.p1Stats) => SKEYS.map(({ key, label }) => `${label}:${s[key] ?? 0}`).join(" ");
          ls.push(`\nStats vào combat:`);
          ls.push(`  ${p1name}: ${fmtStats(newState.p1Stats)}`);
          ls.push(`  ${p2name}: ${fmtStats(newState.p2Stats)}`);

          // Round-by-round
          ls.push(`\nKết quả từng round:`);
          for (const log of newState.roundLogs) {
            if (log.roundIndex === -1) {
              ls.push(`  [PRE-COMBAT]`);
              for (const ev of log.events) {
                const pname = ev.player === "player1" ? p1name : p2name;
                ls.push(`    [${pname}] ${ev.description}`);
              }
              continue;
            }
            const rw = log.winner === "player1" ? p1name : log.winner === "player2" ? p2name : "HÒA";
            ls.push(`  ${log.statLabel}: ${rw} (${log.p1ValueUsed} vs ${log.p2ValueUsed})`);
            for (const ev of log.events) {
              const pname = ev.player === "player1" ? p1name : p2name;
              ls.push(`    [${pname}] ${ev.source}: ${ev.description}`);
            }
            if ((log.carryOverToNext?.length ?? 0) > 0) {
              for (const co of log.carryOverToNext) {
                const pname = co.player === "player1" ? p1name : p2name;
                ls.push(`    → Carry [${pname}]: ${co.source} ${co.value > 0 ? "+" : ""}${co.value} ${co.stat.toUpperCase()} round kế`);
              }
            }
          }

          ls.push(`\nKết quả: ${winnerName} WIN ${Math.max(p1Score, p2Score)}-${Math.min(p1Score, p2Score)}`);
          ls.push(`  ${loserName} thua`);
          if (tieBreaker === "race") ls.push(`  (Tie-breaker: Race Tier)`);

          // After-combat quirk effects
          if (acEntries.length > 0) {
            ls.push(`\nHiệu ứng sau combat (Quirks):`);
            for (const entry of acEntries) {
              const pname = entry.player === "player1" ? p1name : p2name;
              const prefix = entry.gmAction ? "[GM Action] " : "[Auto] ";
              ls.push(`  [${pname}] ${prefix}${entry.quirkName}: ${entry.description}`);
            }
          }

          ls.push(`\n${line}`);

          appendReportToDrive(REPORT_FILE_ID, sep + ls.join("\n") + "\n").catch(() => {});
        });
      });
    }
  };

  // Sub-combat (Roundtable Hold) — keep simple auto-compute
  const computeCombat = (
    p1: PvPPlayerData,
    p2: PvPPlayerData,
  ): CombatResult => {
    const rounds: RoundResult[] = [];
    let p1Score = 0,
      p2Score = 0;
    let p1NextBoost = 0,
      p2NextBoost = 0;
    const p1HasUndyingRage = p1.character?.runes?.runeword === "Undying Rage";
    const p2HasUndyingRage = p2.character?.runes?.runeword === "Undying Rage";
    for (let i = 0; i < STAT_ORDER.length; i++) {
      const { key, label } = STAT_ORDER[i];
      const p1Value = (p1.stats[key] || 0) + p1NextBoost;
      const p2Value = (p2.stats[key] || 0) + p2NextBoost;
      p1NextBoost = 0;
      p2NextBoost = 0;
      let winner: "player1" | "player2" | "tie";
      if (p1Value > p2Value) {
        winner = "player1";
        p1Score++;
      } else if (p2Value > p1Value) {
        winner = "player2";
        p2Score++;
      } else {
        winner = "tie";
      }
      if (winner === "player2" && p1HasUndyingRage) p1NextBoost = 3;
      if (winner === "player1" && p2HasUndyingRage) p2NextBoost = 3;
      rounds.push({
        stat: key,
        statLabel: label,
        player1Value: p1Value,
        player2Value: p2Value,
        winner,
      });
    }
    let overallWinner: "player1" | "player2";
    let tieBreaker: "race" | null = null;
    if (p1Score > p2Score) overallWinner = "player1";
    else if (p2Score > p1Score) overallWinner = "player2";
    else {
      tieBreaker = "race";
      overallWinner = p1.raceTier < p2.raceTier ? "player1" : "player2";
    }
    return {
      rounds,
      player1Score: p1Score,
      player2Score: p2Score,
      startPlayer1Score: 0,
      startPlayer2Score: 0,
      winner: overallWinner,
      tieBreaker,
    };
  };

  // Run sub-combat (Tarnished vs original opponent)
  const runSubCombat = () => {
    if (!selectedTarnished || !combatResult) return;

    // Tarnished (as player1 slot) vs the winner of the main match
    const mainWinner = combatResult.winner === "player1" ? player1! : player2!;

    setSubIsAnimating(true);
    _setSubCurrentRound(-1);
    setSubCombatResult(null);

    const result = computeCombat(selectedTarnished, mainWinner);
    // Reveal all rounds immediately
    result.rounds.forEach((_, i) => _setSubCurrentRound(i));
    setSubCombatResult(result);
    setSubIsAnimating(false);
  };

  // Reset all combat state
  const resetCombat = () => {
    setCombatResult(null);
    setCurrentRound(-1);
    setIsAnimating(false);
    setIsPendingRoundtable(false);
    setPendingLoser(null);
    setTarnishedList([]);
    setSelectedTarnished(null);
    setSubCombatResult(null);
    _setSubCurrentRound(-1);
    setTarnishedSearchTerm("");
    setRoundSpinResults({});
    setOneTrickPonyStat({});
    setRaumanianSuccess({});
    setGoldenCoinPoints({});
    setEncroachingShadowSuccess({});
    setGoldShipResult({});
    setMadScientistResult({});
    setSummoningScrollResult({});
    setDothrakiSpinResult({});
    setAfterCombatEntries([]);
    setAfterCombatSpinResults({});
    setStepState(null);
    setStepRoundIndex(-1);
    setCombatConfirmed(false);
    setAudioResetKey(k => k + 1);
    setViewLogIndex(null);
  };

  // Swap players
  const swapPlayers = () => {
    const temp = player1;
    setPlayer1(player2);
    setPlayer2(temp);
    const tempSearch = searchTerm1;
    setSearchTerm1(searchTerm2);
    setSearchTerm2(tempSearch);
    resetCombat();
  };

  // Per-round spin effects: detect which effects trigger per round win/lose
  const getPerRoundEffects = (
    char: Character | undefined,
    playerNo?: number,
  ) => {
    if (!char)
      return {
        onWin: [] as string[],
        onLose: [] as string[],
        onTie: [] as string[],
      };

    // Helper: check if a named item (of any sourceType) is NOT fully disabled
    // An item is considered active if at least one inventory entry with that name is not disabled
    const isEffectActive = (targetName: string) => {
      if (playerNo === undefined) return true;
      const items = buildInventoryList(char);
      const matching = items.filter(
        (it) => it.name.toLowerCase() === targetName.toLowerCase(),
      );
      if (matching.length === 0) return false;
      // Active if any matching entry is NOT disabled
      return matching.some(
        (it) => !disabledItems.has(`${playerNo}-${it.sourceType}-${it.name}`),
      );
    };

    const sources = [
      ...(char.quirks || [])
        .filter((q) => !q.isLost)
        .map((q) => q.name.toLowerCase()),
      ...(char.archetypes || []).map((a) => a.toLowerCase()),
      ...(char.powers || [])
        .filter((p) => (typeof p === "object" ? !p.isLost : true))
        .map((p) => (typeof p === "string" ? p : p.name).toLowerCase()),
    ];
    const onWin: string[] = [];
    const onLose: string[] = [];
    const onTie: string[] = [];
    if (
      sources.some((s) => s.includes("critical strike")) &&
      isEffectActive("Critical Strike")
    )
      onWin.push("Critical Strike");
    if (sources.some((s) => s.includes("evasion")) && isEffectActive("Evasion"))
      onLose.push("Evasion");
    if (sources.some((s) => s === "gambler") && isEffectActive("Gambler"))
      onWin.push("Gambler");
    if (sources.some((s) => s === "cruelty") && isEffectActive("Cruelty"))
      onTie.push("Cruelty");
    // Blind: 15% không nhận điểm khi thắng round
    if (sources.some((s) => s === "blind") && isEffectActive("Blind"))
      onWin.push("Blind");
    // Mute: 10% bị -1 stat khi thua round
    if (sources.some((s) => s === "mute") && isEffectActive("Mute"))
      onLose.push("Mute");
    // Scrying (power): 40% -4 stat mạnh nhất đối thủ ngay round này
    if (sources.some((s) => s === "scrying") && isEffectActive("Scrying"))
      onWin.push("Scrying");
    // Bash (power): 35% debuff -3 stat đối thủ round kế
    if (sources.some((s) => s === "bash") && isEffectActive("Bash"))
      onWin.push("Bash");
    // Luminescence (runeword): 35% debuff -3 stat đối thủ round kế
    const runeword = (char.runes?.runeword || "").toLowerCase();
    if (runeword === "luminescence" && isEffectActive("Luminescence"))
      onWin.push("Luminescence");
    // Power Ranger colors: detect subType from nestedArchetypes
    const rangerColor = (char.nestedArchetypes || [])
      .find((na: any) => na.name === "Power Ranger" && na.subType)?.subType;
    if (rangerColor === "Red") onWin.push("Ranger-Red");
    if (rangerColor === "Blue") onWin.push("Ranger-Blue");
    if (rangerColor === "Black") onWin.push("Ranger-Black");
    if (rangerColor === "Yellow") onWin.push("Ranger-Yellow");
    if (rangerColor === "Pink") onWin.push("Ranger-Pink");
    if (rangerColor === "Silver") onWin.push("Ranger-Silver");
    // Bloodthirsty: thắng +1 bonus (thua mất hết điểm — auto, không cần spin)
    if (sources.some((s) => s === "bloodthirsty") && isEffectActive("Bloodthirsty")) {
      onWin.push("Bloodthirsty");
    }
    // Divine Smite: +1 điểm khi thắng round MA
    if (sources.some((s) => s === "divine smite") && isEffectActive("Divine Smite")) {
      onWin.push("Divine Smite");
    }
    // Cautious (quirk on self): đối thủ không nhận điểm round STR
    // Stored on the player who HAS Cautious — affects opponent's STR round win
    if (sources.some((s) => s === "cautious") && isEffectActive("Cautious")) {
      onWin.push("Cautious-Self"); // marker: this player has Cautious (opponent's STR win = 0)
    }
    return { onWin, onLose, onTie };
  };

  // State for per-round spin modal in round display
  const [roundSpinModal, setRoundSpinModal] = useState<{
    isOpen: boolean;
    title: string;
    items: WheelSpinItem[];
    roundIndex: number;
    side: "player1" | "player2";
  }>({ isOpen: false, title: "", items: [], roundIndex: -1, side: "player1" });

  // Track spin results per round per side: key = `${roundIndex}-${side}`
  const [roundSpinResults, setRoundSpinResults] = useState<
    Record<string, { label: string; isSuccess: boolean }>
  >({});

  // State for pre-combat wheels (Raumanian, One Trick Pony, Night Owl, Open-minded)
  const [preCombatModal, setPreCombatModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    items: WheelSpinItem[];
    side: "player1" | "player2";
    effectKey: string; // unique key để store result
    onResult?: (result: { label: string; isSuccess: boolean }) => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    items: [],
    side: "player1",
    effectKey: "",
  });

  // One Trick Pony: stat được chọn cho mỗi player (key = "player1" | "player2")
  const [oneTrickPonyStat, setOneTrickPonyStat] = useState<
    Record<string, string>
  >({});

  // Raumanian: +1 điểm khởi đầu nếu thành công (key = "player1" | "player2")
  const [raumanianSuccess, setRaumanianSuccess] = useState<
    Record<string, boolean>
  >({});

  // Golden Coin: điểm khởi đầu từ wheel result (key = "player1" | "player2")
  const [goldenCoinPoints, setGoldenCoinPoints] = useState<Record<string, number>>({});

  // Encroaching Shadow: +7 Speed trước combat nếu thành công (key = "player1" | "player2")
  const [encroachingShadowSuccess, setEncroachingShadowSuccess] = useState<
    Record<string, boolean>
  >({});

  // Gold Ship: kết quả wheel 50/50 (true = +1 all, false = -1 all, undefined = chưa quay)
  const [goldShipResult, setGoldShipResult] = useState<Record<string, boolean | null>>({});

  // Mad Scientist: kết quả wheel (true = Shrinking: opp -2 all, false = Enlarging: self +2 all)
  const [madScientistResult, setMadScientistResult] = useState<Record<string, boolean | null>>({});

  // Summoning Scroll: stat deltas từ summon wheel (key = "player1" | "player2")
  const [summoningScrollResult, setSummoningScrollResult] = useState<
    Record<string, { statDeltas: Partial<Record<keyof CharacterStats, number>>; startScoreDelta: number; summonName: string } | null>
  >({});

  // Creator's Cat modal: chọn hiệu ứng Creator's Favor
  const [creatorsCatModal, setCreatorsCatModal] = useState<{
    isOpen: boolean;
    playerLabel: "player1" | "player2";
    step: "choose_effect" | "choose_stats" | "choose_power" | "choose_gear" | "choose_weapon" | "choose_archetypes" | "choose_runeword" | "spin_power" | "spin_archetype";
    selectedEffect: string;
    chosenStats: (keyof CharacterStats)[];
    chosenArchetypesToRemove: string[];
    // Roll queue: danh sách stat chờ quay, accumulated kết quả đã quay
    rollQueue: (keyof CharacterStats)[];
    rollAccumulated: { stat: keyof CharacterStats; value: number }[];
    rollRaceName: string;
    rollTotal: number;
  }>({
    isOpen: false,
    playerLabel: "player1",
    step: "choose_effect",
    selectedEffect: "",
    chosenStats: [],
    chosenArchetypesToRemove: [],
    rollQueue: [],
    rollAccumulated: [],
    rollRaceName: "",
    rollTotal: 0,
  });

  // Creator's Cat roll queue driver: khi rollQueue có item, mở wheel cho stat đầu tiên
  useEffect(() => {
    if (creatorsCatModal.rollQueue.length === 0) return;
    if (preCombatModal.isOpen) return; // đợi wheel hiện tại đóng
    const stat = creatorsCatModal.rollQueue[0];
    const raceName = creatorsCatModal.rollRaceName;
    const weights = RACE_STAT_WEIGHTS[raceName]?.[stat] || Array(10).fill(10);
    const statLabel = stat.toUpperCase();
    const currentRoll = creatorsCatModal.rollTotal - creatorsCatModal.rollQueue.length + 1;
    setPreCombatModal({
      isOpen: true,
      title: `Creator's Favor: Roll ${statLabel} (${currentRoll}/${creatorsCatModal.rollTotal})`,
      description: `${creatorsCatModal.playerLabel === "player1" ? player1?.name : player2?.name} — Quay để xác định giá trị mới của ${statLabel}`,
      items: weights.map((w: number, i: number) => ({
        label: `${statLabel} = ${i + 1}`,
        weight: w,
        isSuccess: true,
        color: STAT_COLORS[stat],
      })),
      side: creatorsCatModal.playerLabel,
      effectKey: `creators-cat-roll-${creatorsCatModal.playerLabel}-${stat}-${currentRoll}`,
      onResult: (result) => {
        const newValue = parseInt(result.label.split("=")[1].trim(), 10);
        const newAccumulated = [...creatorsCatModal.rollAccumulated, { stat, value: newValue }];
        const newQueue = creatorsCatModal.rollQueue.slice(1);
        if (newQueue.length === 0) {
          // Xong hết — apply vào character.stats (base) rồi recalculate player.stats
          const pLabel = creatorsCatModal.playerLabel;
          const setP = pLabel === "player1" ? setPlayer1 : setPlayer2;
          setP((prev) => {
            if (!prev) return prev;
            // Set character base stats
            const newCharStats = { ...prev.character?.stats ?? prev.stats };
            for (const { stat: s, value: v } of newAccumulated) {
              (newCharStats as any)[s] = v;
            }
            const updatedChar = prev.character
              ? { ...prev.character, stats: newCharStats }
              : undefined;
            // Recalculate display stats từ character mới
            const newDisplayStats = updatedChar
              ? calcStatsWithDisabled(updatedChar as Character, prev.no, disabledItems)
              : { ...newCharStats };
            return {
              ...prev,
              character: updatedChar ?? prev.character,
              stats: newDisplayStats,
            };
          });
          spawnStatBubbles(newAccumulated.map(({ stat: s, value: v }) => ({
            player: pLabel,
            text: `Creator's Favor: ${s.toUpperCase()} → ${v} (rolled)`,
            isPositive: true,
          })));
          setCreatorsCatModal((p) => ({ ...p, rollQueue: [], rollAccumulated: [] }));
        } else {
          setCreatorsCatModal((p) => ({ ...p, rollQueue: newQueue, rollAccumulated: newAccumulated }));
        }
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creatorsCatModal.rollQueue, preCombatModal.isOpen]);

  // After-combat quirk effects: computed after all 6 rounds resolve
  type AfterCombatEntry = {
    player: "player1" | "player2";
    quirkName: string;
    description: string;
    // undefined = auto-applied; string = wheel key (Night Owl, Open-minded, Fast Learner, Resilient)
    wheelKey?: string;
    wheelItems?: WheelSpinItem[];
    statMods?: Array<{ stat: keyof CharacterStats; delta: number }>;
    gmAction?: boolean; // GM must do manually
  };
  const [afterCombatEntries, setAfterCombatEntries] = useState<AfterCombatEntry[]>([]);
  const [afterCombatSpinResults, setAfterCombatSpinResults] = useState<
    Record<string, { label: string; isSuccess: boolean }>
  >({});

  // Dothraki: rule được chọn qua vòng quay trước combat (key = "player1" | "player2", value = 1-6)
  const [dothrakiSpinResult, setDothrakiSpinResult] = useState<
    Record<string, DothrakiRule>
  >({});

  // Stats hiển thị trên card, đã trừ disabled items
  // Khi có Dothraki spin result (trước combat) → preview stats đã swap/boost
  // Khi combat đang chạy → dùng stepState; còn lại dùng calcStatsWithDisabled
  const dothrakiPreviewStats = useMemo(() => {
    if (stepState) return null;
    const p1Rule = (dothrakiSpinResult["player1"] ?? null) as DothrakiRule;
    const p2Rule = (dothrakiSpinResult["player2"] ?? null) as DothrakiRule;
    const p1GoldShip = goldShipResult["player1"] ?? null;
    const p2GoldShip = goldShipResult["player2"] ?? null;
    const p1MadScientist = madScientistResult["player1"] ?? null;
    const p2MadScientist = madScientistResult["player2"] ?? null;
    const p1Summon = summoningScrollResult["player1"] ?? null;
    const p2Summon = summoningScrollResult["player2"] ?? null;
    if (p1Rule === null && p2Rule === null && p1GoldShip === null && p2GoldShip === null && p1MadScientist === null && p2MadScientist === null && !p1Summon && !p2Summon) return null;
    if (!player1 || !player2) return null;
    const s1: CharacterStats = player1.character
      ? calcStatsWithDisabled(player1.character, player1.no, disabledItems)
      : { ...player1.stats };
    const s2: CharacterStats = player2.character
      ? calcStatsWithDisabled(player2.character, player2.no, disabledItems)
      : { ...player2.stats };
    const DSTAT_KEYS = [
      "str",
      "spd",
      "dur",
      "iq",
      "biq",
      "ma",
    ] as (keyof CharacterStats)[];
    const swp = (
      ref: CharacterStats,
      a: keyof CharacterStats,
      b: keyof CharacterStats,
    ) => {
      const tmp = ref[a] || 0;
      ref[a] = ref[b] || 0;
      ref[b] = tmp;
    };
    // Gold Ship: apply ngay khi quay xong
    if (p1GoldShip !== null) {
      const d1 = p1GoldShip ? 1 : -1;
      DSTAT_KEYS.forEach((k) => { s1[k] = (s1[k] || 0) + d1; });
    }
    if (p2GoldShip !== null) {
      const d2 = p2GoldShip ? 1 : -1;
      DSTAT_KEYS.forEach((k) => { s2[k] = (s2[k] || 0) + d2; });
    }
    // Mad Scientist: Shrinking (true) = đối thủ -2 all; Enlarging (false) = bản thân +2 all
    if (p1MadScientist !== null) {
      if (p1MadScientist) {
        DSTAT_KEYS.forEach((k) => { s2[k] = (s2[k] || 0) - 2; }); // Shrinking: opp -2
      } else {
        DSTAT_KEYS.forEach((k) => { s1[k] = (s1[k] || 0) + 2; }); // Enlarging: self +2
      }
    }
    if (p2MadScientist !== null) {
      if (p2MadScientist) {
        DSTAT_KEYS.forEach((k) => { s1[k] = (s1[k] || 0) - 2; }); // Shrinking: opp -2
      } else {
        DSTAT_KEYS.forEach((k) => { s2[k] = (s2[k] || 0) + 2; }); // Enlarging: self +2
      }
    }
    // Summoning Scroll: apply stat deltas vào preview
    if (p1Summon) {
      for (const [k, v] of Object.entries(p1Summon.statDeltas)) {
        s1[k as keyof CharacterStats] = (s1[k as keyof CharacterStats] || 0) + (v as number);
      }
    }
    if (p2Summon) {
      for (const [k, v] of Object.entries(p2Summon.statDeltas)) {
        s2[k as keyof CharacterStats] = (s2[k as keyof CharacterStats] || 0) + (v as number);
      }
    }
    // Pass 1: boosts
    if (p1Rule === 5) {
      DSTAT_KEYS.forEach((k) => {
        s1[k] = (s1[k] || 0) + 4;
      });
    } else if (p1Rule === 6) {
      DSTAT_KEYS.forEach((k) => {
        s2[k] = (s2[k] || 0) + 5;
      });
    }
    if (p2Rule === 5) {
      DSTAT_KEYS.forEach((k) => {
        s2[k] = (s2[k] || 0) + 4;
      });
    } else if (p2Rule === 6) {
      DSTAT_KEYS.forEach((k) => {
        s1[k] = (s1[k] || 0) + 5;
      });
    }
    // Pass 2: swaps (on fully-boosted stats)
    if (p1Rule === 1) {
      swp(s2, "str", "ma");
      swp(s2, "spd", "biq");
      swp(s2, "dur", "iq");
    } else if (p1Rule === 2) {
      swp(s1, "str", "biq");
    } else if (p1Rule === 3) {
      swp(s1, "spd", "iq");
    } else if (p1Rule === 4) {
      swp(s1, "dur", "ma");
    }
    if (p2Rule === 1) {
      swp(s1, "str", "ma");
      swp(s1, "spd", "biq");
      swp(s1, "dur", "iq");
    } else if (p2Rule === 2) {
      swp(s2, "str", "biq");
    } else if (p2Rule === 3) {
      swp(s2, "spd", "iq");
    } else if (p2Rule === 4) {
      swp(s2, "dur", "ma");
    }
    return { s1, s2 };
  }, [stepState, dothrakiSpinResult, goldShipResult, madScientistResult, summoningScrollResult, player1, player2, disabledItems]);

  const p1DisplayStats = useMemo(
    () =>
      stepState
        ? stepState.p1Stats
        : dothrakiPreviewStats
          ? dothrakiPreviewStats.s1
          : player1?.character
            ? calcStatsWithDisabled(
                player1.character,
                player1.no,
                disabledItems,
              )
            : (player1?.stats ?? null),
    [player1, disabledItems, stepState, dothrakiPreviewStats],
  );
  const p2DisplayStats = useMemo(
    () =>
      stepState
        ? stepState.p2Stats
        : dothrakiPreviewStats
          ? dothrakiPreviewStats.s2
          : player2?.character
            ? calcStatsWithDisabled(
                player2.character,
                player2.no,
                disabledItems,
              )
            : (player2?.stats ?? null),
    [player2, disabledItems, stepState, dothrakiPreviewStats],
  );

  // Dev Mode: wheel weight overrides (effectName -> itemIndex -> weight)
  const [devMode, setDevMode] = useState(false);
  const [devWeightOverrides, setDevWeightOverrides] = useState<
    Record<string, Record<number, number>>
  >({});
  const [devPanelPos, setDevPanelPos] = useState({ x: 20, y: 200 });

  // Dev mode toggle (Ctrl+Shift+D)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setDevMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Apply dev weight overrides to a wheel item array
  const applyDevWeights = (
    effectName: string,
    items: WheelSpinItem[],
  ): WheelSpinItem[] => {
    if (!devMode) return items;
    const overrides = devWeightOverrides[effectName];
    if (!overrides) return items;
    return items.map((item, i) =>
      overrides[i] !== undefined ? { ...item, weight: overrides[i] } : item,
    );
  };

  // Generic handler cho tất cả wheel effects từ CombatEffectsPanel
  const handleWheelResolved = (
    playerLabel: "player1" | "player2",
    sourceName: string,
    item: WheelSpinItem,
  ) => {
    if (sourceName === "one trick pony") {
      setOneTrickPonyStat((prev) => ({ ...prev, [playerLabel]: item.label }));
    } else if (sourceName === "golden coin") {
      // label là "+X điểm khởi đầu (Y%)" — parse số điểm từ label
      const match = item.label.match(/\+(\d+)\s*điểm/);
      const pts = match ? parseInt(match[1], 10) : (item.isSuccess ? 1 : 0);
      setGoldenCoinPoints((prev) => ({ ...prev, [playerLabel]: pts }));
      if (pts > 0) spawnStatBubbles([{ player: playerLabel, text: `+${pts} điểm khởi đầu (Golden Coin)`, isPositive: true }]);
    } else if (sourceName === "raumanian" || sourceName === "raumanian🍀") {
      setRaumanianSuccess((prev) => ({
        ...prev,
        [playerLabel]: item.isSuccess === true,
      }));
      try {
        new Audio(getAssetPath("/assets/sfx/raumanian.mp3"))
          .play()
          .catch(() => {});
      } catch (_) {}
    } else if (sourceName === "encroaching shadow") {
      const success = item.isSuccess === true;
      setEncroachingShadowSuccess((prev) => ({ ...prev, [playerLabel]: success }));
      if (success) {
        spawnStatBubbles([{ player: playerLabel, text: "+7 SPD (Encroaching Shadow)", isPositive: true }]);
      }
    } else if (sourceName === "gold ship") {
      const isPositive = item.isSuccess === true;
      setGoldShipResult((prev) => ({ ...prev, [playerLabel]: isPositive }));
      spawnStatBubbles([{ player: playerLabel, text: isPositive ? "+1 All Stats (Gold Ship)" : "-1 All Stats (Gold Ship)", isPositive }]);
    } else if (sourceName === "mad scientist") {
      const isShrinking = item.label.toLowerCase().includes("shrinking");
      setMadScientistResult((prev) => ({ ...prev, [playerLabel]: isShrinking }));
      if (isShrinking) {
        spawnStatBubbles([{ player: playerLabel, text: "Mad Scientist: Shrinking → Đối thủ -2 All Stats", isPositive: true }]);
      } else {
        spawnStatBubbles([{ player: playerLabel, text: "Mad Scientist: Enlarging → Bản thân +2 All Stats", isPositive: true }]);
      }
    } else if (sourceName === "dothraki") {
      const rule = (item.meta?.ruleIndex ?? null) as DothrakiRule;
      if (rule !== null) {
        setDothrakiSpinResult((prev) => ({ ...prev, [playerLabel]: rule }));
      }
    } else if ((sourceName === "power negation" || sourceName === "anti-magic barrier" || sourceName === "memory alter") && item.meta?.powerName) {
      // Power Negation / Anti-Magic Barrier: disable power được chọn của đối thủ
      const powerName = item.meta.powerName as string;
      const disableTarget = item.meta.disableTarget as "player1" | "player2";
      const oppPlayer = disableTarget === "player1" ? player1 : player2;
      if (oppPlayer) {
        const disableKey = `${oppPlayer.no}-power-${powerName}`;
        setDisabledItems((prev) => {
          const next = new Set(prev);
          next.add(disableKey);
          return next;
        });
      }
    } else if (sourceName === "summoning scroll") {
      const label = item.label;
      const statDeltas: Partial<Record<keyof CharacterStats, number>> = {};
      let startScoreDelta = 0;
      if (label.startsWith("Chihuahua")) {
        for (const k of _ALL_STAT_KEYS) statDeltas[k] = -1;
        spawnStatBubbles([{ player: playerLabel, text: "Chihuahua: -1 All Stats (Summon)", isPositive: false }]);
      } else if (label.startsWith("Mufasa")) {
        statDeltas.str = 3;
        spawnStatBubbles([{ player: playerLabel, text: "Mufasa: +3 STR (Summon)", isPositive: true }]);
      } else if (label.startsWith("Pack of Wolves")) {
        statDeltas.spd = 3;
        spawnStatBubbles([{ player: playerLabel, text: "Pack of Wolves: +3 SPD (Summon)", isPositive: true }]);
      } else if (label.startsWith("Earth Golem")) {
        statDeltas.dur = 3;
        spawnStatBubbles([{ player: playerLabel, text: "Earth Golem: +3 DUR (Summon)", isPositive: true }]);
      } else if (label.startsWith("Water Elemental")) {
        statDeltas.iq = 3;
        spawnStatBubbles([{ player: playerLabel, text: "Water Elemental: +3 IQ (Summon)", isPositive: true }]);
      } else if (label.startsWith("Imp")) {
        statDeltas.biq = 3;
        spawnStatBubbles([{ player: playerLabel, text: "Imp: +3 BIQ (Summon)", isPositive: true }]);
      } else if (label.startsWith("Igris")) {
        statDeltas.ma = 3;
        spawnStatBubbles([{ player: playerLabel, text: "Igris: +3 MA (Summon)", isPositive: true }]);
      } else if (label.startsWith("Numby") && item.meta?.needsStatRoll) {
        // Numby: cần quay thêm wheel 6 chỉ số
        const playerName = playerLabel === "player1" ? player1?.name : player2?.name;
        setPreCombatModal({
          isOpen: true,
          title: "Numby: Chọn chỉ số +4",
          description: `${playerName} — Numby: Quay để chọn 1 chỉ số nhận +4 trong combat này`,
          items: [
            { label: "STR", weight: 1, isSuccess: true, color: "#ef4444" },
            { label: "SPD", weight: 1, isSuccess: true, color: "#3b82f6" },
            { label: "DUR", weight: 1, isSuccess: true, color: "#84cc16" },
            { label: "IQ", weight: 1, isSuccess: true, color: "#06b6d4" },
            { label: "BIQ", weight: 1, isSuccess: true, color: "#a855f7" },
            { label: "MA", weight: 1, isSuccess: true, color: "#f97316" },
          ],
          side: playerLabel,
          effectKey: `numby-${playerLabel}`,
          onResult: (result) => {
            const statMap: Record<string, keyof CharacterStats> = { STR: "str", SPD: "spd", DUR: "dur", IQ: "iq", BIQ: "biq", MA: "ma" };
            const sk = statMap[result.label] as keyof CharacterStats;
            if (sk) {
              setSummoningScrollResult((prev) => ({
                ...prev,
                [playerLabel]: { statDeltas: { [sk]: 4 }, startScoreDelta: 0, summonName: "Numby" },
              }));
              spawnStatBubbles([{ player: playerLabel, text: `Numby: +4 ${result.label} (Summon)`, isPositive: true }]);
            }
          },
        });
        return;
      } else if (label.startsWith("Wyvern's Egg") && item.meta?.isWyvernsEgg) {
        // Placeholder: +2 điểm khởi đầu nếu là chung kết tổng — xử lý sau
        startScoreDelta = 0; // TODO: check if match is grand final
        spawnStatBubbles([{ player: playerLabel, text: "Wyvern's Egg: Pending — +2 điểm nếu là chung kết tổng", isPositive: true }]);
      } else if (label.startsWith("Creator's Cat") && item.meta?.isCreatorsCat) {
        // Creator's Cat: thêm charDev + mở modal chọn hiệu ứng
        const setPlayer = playerLabel === "player1" ? setPlayer1 : setPlayer2;
        setPlayer((prev) => {
          if (!prev?.character) return prev;
          const updatedChar = {
            ...prev.character,
            charDevs: [
              ...((prev.character as any).charDevs || []),
              { name: "Creator's Favor", isLost: false },
            ],
          };
          return { ...prev, character: updatedChar };
        });
        setCreatorsCatModal({
          isOpen: true,
          playerLabel,
          step: "choose_effect",
          selectedEffect: "",
          chosenStats: [],
          chosenArchetypesToRemove: [],
          rollQueue: [],
          rollAccumulated: [],
          rollRaceName: "",
          rollTotal: 0,
        });
        return;
      }
      if (Object.keys(statDeltas).length > 0 || startScoreDelta > 0 || label.startsWith("Wyvern")) {
        setSummoningScrollResult((prev) => ({
          ...prev,
          [playerLabel]: { statDeltas, startScoreDelta, summonName: label.split(":")[0] },
        }));
      }
    } else if (sourceName === "invoker" && item.meta?.powerName) {
      // Invoker: thêm power vào character rồi recalculate stats
      const powerName = item.meta.powerName as string;
      const setPlayer = playerLabel === "player1" ? setPlayer1 : setPlayer2;
      setPlayer((prev) => {
        if (!prev?.character) return prev;
        // Thêm power mới vào character.powers
        const updatedChar = {
          ...prev.character,
          powers: [
            ...(prev.character.powers || []),
            { name: powerName, isLost: false },
          ],
        };
        // Recalculate stats với power mới
        const fx = EffectResolver.calculateCharacterEffects(updatedChar, {
          isPvE: false,
        });
        const newStats: import("../types/character").CharacterStats = {
          str: fx.totalStats.strength,
          spd: fx.totalStats.speed,
          dur: fx.totalStats.durability,
          iq: fx.totalStats.iq,
          biq: fx.totalStats.biq,
          ma: fx.totalStats.ma,
        };
        const newBreakdown =
          EffectResolver.getCharacterEffectBreakdown(updatedChar);
        return {
          ...prev,
          character: updatedChar,
          stats: newStats,
          breakdown: newBreakdown,
        };
      });
    }
  };

  // Wheel items for each effect
  const BASH_ITEMS: WheelSpinItem[] = [
    { label: "-3 stat đối thủ round kế (35%)", weight: 35, isSuccess: true, color: "#a855f7" },
    { label: "Không có (65%)", weight: 65, isSuccess: false, color: "#6b7280" },
  ];
  const CRIT_ITEMS: WheelSpinItem[] = [
    {
      label: "Crit! +1 bonus (20%)",
      weight: 20,
      isSuccess: true,
      color: "#f59e0b",
    },
    { label: "Miss (80%)", weight: 80, isSuccess: false, color: "#6b7280" },
  ];
  const EVASION_ITEMS: WheelSpinItem[] = [
    {
      label: "Evade! +1 điểm (20%)",
      weight: 20,
      isSuccess: true,
      color: "#10b981",
    },
    { label: "Không (80%)", weight: 80, isSuccess: false, color: "#6b7280" },
  ];
  const GAMBLER_ITEMS: WheelSpinItem[] = [
    // Gambler REPLACES normal +1: 50% = +2, 50% = +0
    { label: "+2 điểm (50%)", weight: 50, isSuccess: true, color: "#f59e0b" },
    { label: "+0 điểm (50%)", weight: 50, isSuccess: false, color: "#ef4444" },
  ];
  const CRUELTY_ITEMS: WheelSpinItem[] = [
    // Cruelty on tie: 50% = +1 for this player, 50% = opponent gets +1
    {
      label: "+1 điểm cho ta (50%)",
      weight: 50,
      isSuccess: true,
      color: "#e879f9",
    },
    {
      label: "+1 điểm cho đối thủ (50%)",
      weight: 50,
      isSuccess: false,
      color: "#6b7280",
    },
  ];
  // Blind: 15% không nhận điểm khi thắng round
  const BLIND_ITEMS: WheelSpinItem[] = [
    {
      label: "Mù! Không nhận điểm (15%)",
      weight: 15,
      isSuccess: true,
      color: "#a78bfa",
    },
    {
      label: "Nhận điểm bình thường (85%)",
      weight: 85,
      isSuccess: false,
      color: "#6b7280",
    },
  ];
  // Mute: 10% bị -1 vào chỉ số của round thua
  const MUTE_ITEMS: WheelSpinItem[] = [
    {
      label: "Câm! -1 chỉ số round thua (10%)",
      weight: 10,
      isSuccess: true,
      color: "#f472b6",
    },
    {
      label: "Bình thường (90%)",
      weight: 90,
      isSuccess: false,
      color: "#6b7280",
    },
  ];
  // Scrying: 40% -4 stat mạnh nhất của đối thủ khi thắng round
  const SCRYING_ITEMS: WheelSpinItem[] = [
    {
      label: "Scrying! -4 stat mạnh nhất đối thủ (40%)",
      weight: 40,
      isSuccess: true,
      color: "#7c3aed",
    },
    {
      label: "Không có (60%)",
      weight: 60,
      isSuccess: false,
      color: "#6b7280",
    },
  ];
  // Power Ranger: Red — 20% +2 điểm khi thắng Strength
  const RANGER_RED_ITEMS: WheelSpinItem[] = [
    { label: "⚡ +2 điểm! (20%)", weight: 20, isSuccess: true, color: "#ef4444" },
    { label: "Không (80%)", weight: 80, isSuccess: false, color: "#6b7280" },
  ];
  // Power Ranger: Blue — 33% +3 Base Speed khi thắng Speed
  const RANGER_BLUE_ITEMS: WheelSpinItem[] = [
    { label: "⚡ +3 Base Speed! (33%)", weight: 33, isSuccess: true, color: "#3b82f6" },
    { label: "Không (67%)", weight: 67, isSuccess: false, color: "#6b7280" },
  ];
  // Power Ranger: Black — 20% nhận 1 Power khi thắng Durability
  const RANGER_BLACK_ITEMS: WheelSpinItem[] = [
    { label: "⚡ Nhận 1 Power! (20%)", weight: 20, isSuccess: true, color: "#1f2937" },
    { label: "Không (80%)", weight: 80, isSuccess: false, color: "#6b7280" },
  ];
  // Power Ranger: Yellow — 25% nhận 1 Gear khi thắng IQ
  const RANGER_YELLOW_ITEMS: WheelSpinItem[] = [
    { label: "⚡ Nhận 1 Gear! (25%)", weight: 25, isSuccess: true, color: "#eab308" },
    { label: "Không (75%)", weight: 75, isSuccess: false, color: "#6b7280" },
  ];
  // Power Ranger: Pink — 25% +1 Base stat ngẫu nhiên khi thắng BIQ/MA
  const RANGER_PINK_ITEMS: WheelSpinItem[] = [
    { label: "⚡ +1 Base stat ngẫu nhiên! (25%)", weight: 25, isSuccess: true, color: "#ec4899" },
    { label: "Không (75%)", weight: 75, isSuccess: false, color: "#6b7280" },
  ];
  // Power Ranger: Silver — 15% gấp đôi chỉ số round tiếp theo khi thắng bất kỳ round
  const RANGER_SILVER_ITEMS: WheelSpinItem[] = [
    { label: "⚡ Gấp đôi stat round kế! (15%)", weight: 15, isSuccess: true, color: "#9ca3af" },
    { label: "Không (85%)", weight: 85, isSuccess: false, color: "#6b7280" },
  ];
  // Night Owl / Open-minded: after-combat wheels (referenced via preCombatModal)
  const AFTER_COMBAT_WHEEL_ITEMS: Record<string, WheelSpinItem[]> = {
    "Night Owl": [
      {
        label: "Cú đêm! -1 all stats (10%)",
        weight: 10,
        isSuccess: true,
        color: "#818cf8",
      },
      {
        label: "Bình thường (90%)",
        weight: 90,
        isSuccess: false,
        color: "#6b7280",
      },
    ],
    "Open-minded": [
      {
        label: "Thành Lover! (33%)",
        weight: 33,
        isSuccess: true,
        color: "#f472b6",
      },
      { label: "Không (67%)", weight: 67, isSuccess: false, color: "#6b7280" },
    ],
  };
  // 6-stat wheel (dùng cho Independent, One Trick Pony)
  // Compute effective points for a side in a round, factoring in spin results
  const computeRoundPoints = (
    side: "player1" | "player2",
    winner: "player1" | "player2" | "tie",
    roundIdx: number,
    effects: { onWin: string[]; onLose: string[]; onTie: string[] },
    statKey?: string, // e.g. "str", "spd", ... for One Trick Pony
  ): { pts: number; pending: boolean; color: string } => {
    const isWinner = winner === side;
    const isLoser = winner !== side && winner !== "tie";
    const isTie = winner === "tie";

    const hasGambler = effects.onWin.includes("Gambler");
    const hasCrit = effects.onWin.includes("Critical Strike");
    const hasEvasion = effects.onLose.includes("Evasion");
    const hasCruelty = effects.onTie.includes("Cruelty");
    const hasBlind = effects.onWin.includes("Blind");
    const hasMute = effects.onLose.includes("Mute");
    const hasRangerRed = effects.onWin.includes("Ranger-Red");
    const hasBloodthirsty = effects.onWin.includes("Bloodthirsty");
    const hasDivineSmite = effects.onWin.includes("Divine Smite");

    const gamblerSpun = roundSpinResults[`${roundIdx}-Gambler-${side}`];
    const critSpun = roundSpinResults[`${roundIdx}-Critical Strike-${side}`];
    const evasionSpun = roundSpinResults[`${roundIdx}-Evasion-${side}`];
    const crueltySpun = roundSpinResults[`${roundIdx}-Cruelty-${side}`];
    const blindSpun = roundSpinResults[`${roundIdx}-Blind-${side}`];
    const muteSpun = roundSpinResults[`${roundIdx}-Mute-${side}`];
    const rangerRedSpun = roundSpinResults[`${roundIdx}-Ranger-Red-${side}`];

    // One Trick Pony: thắng stat được chọn = 3pts; thắng stat khác = 0pts
    const char = side === "player1" ? player1?.character : player2?.character;
    const charSources = [
      ...(char?.quirks || [])
        .filter((q) => !q.isLost)
        .map((q) => q.name.toLowerCase()),
      ...(char?.archetypes || []).map((a) => a.toLowerCase()),
    ];
    const hasOTP = charSources.includes("one trick pony");
    if (hasOTP && isWinner && statKey) {
      const STAT_KEY_TO_LABEL: Record<string, string> = {
        str: "Strength",
        spd: "Speed",
        dur: "Durability",
        iq: "IQ",
        biq: "BIQ",
        ma: "MA",
      };
      const otpChosenStat = oneTrickPonyStat[side];
      const roundStatLabel = STAT_KEY_TO_LABEL[statKey] ?? statKey;
      if (otpChosenStat) {
        if (otpChosenStat === roundStatLabel) {
          return { pts: 3, pending: false, color: "text-yellow-300" };
        } else {
          return { pts: 0, pending: false, color: "text-gray-500" };
        }
      }
      // Wheel chưa quay — hiển thị pending
      return { pts: 1, pending: true, color: "text-yellow-400" };
    }

    // Cruelty: on tie, spin to decide who gets the point
    if (isTie) {
      const oppSide = side === "player1" ? "player2" : "player1";
      const oppEffects = getPerRoundEffects(
        side === "player1" ? player2?.character : player1?.character,
        side === "player1" ? player2?.no : player1?.no,
      );
      const oppHasCruelty = oppEffects.onTie.includes("Cruelty");
      const oppCrueltySpun = roundSpinResults[`${roundIdx}-Cruelty-${oppSide}`];

      if (hasCruelty) {
        // This side has Cruelty: spin decides
        if (!crueltySpun)
          return { pts: 0, pending: true, color: "text-fuchsia-400" };
        if (crueltySpun.isSuccess)
          return { pts: 1, pending: false, color: "text-fuchsia-300" };
        return { pts: 0, pending: false, color: "text-gray-600" };
      }
      if (oppHasCruelty) {
        // Opponent has Cruelty: if opponent's spin failed (isSuccess=false) → this side gets +1
        if (!oppCrueltySpun)
          return { pts: 0, pending: true, color: "text-fuchsia-400" };
        if (!oppCrueltySpun.isSuccess)
          return { pts: 1, pending: false, color: "text-fuchsia-300" };
        return { pts: 0, pending: false, color: "text-gray-600" };
      }
    }

    if (isWinner) {
      // Cautious (on opponent): đối thủ có Cautious → ta không nhận điểm round STR
      if (statKey === "str") {
        const oppSideForCautious = side === "player1" ? "player2" : "player1";
        const oppCharForCautious = oppSideForCautious === "player1" ? player1?.character : player2?.character;
        const oppNoForCautious = oppSideForCautious === "player1" ? player1?.no : player2?.no;
        const oppEffsForCautious = getPerRoundEffects(oppCharForCautious, oppNoForCautious);
        if (oppEffsForCautious.onWin.includes("Cautious-Self")) {
          return { pts: 0, pending: false, color: "text-gray-500" };
        }
      }
      // Blind: 15% không nhận điểm round này (kiểm tra trước Gambler/Crit)
      if (hasBlind && !blindSpun)
        return { pts: 1, pending: true, color: "text-violet-400" };
      if (hasBlind && blindSpun.isSuccess)
        return { pts: 0, pending: false, color: "text-gray-500" };
      // Gambler replaces base point
      if (hasGambler && !gamblerSpun)
        return { pts: 1, pending: true, color: "text-amber-400" };
      let base = hasGambler ? (gamblerSpun!.isSuccess ? 2 : 0) : 1;
      // Critical Strike adds +1 bonus
      if (hasCrit && !critSpun)
        return { pts: base, pending: true, color: "text-amber-400" };
      if (hasCrit && critSpun?.isSuccess) base += 1;
      // Bloodthirsty: +1 điểm bonus khi thắng
      if (hasBloodthirsty) base += 1;
      // Divine Smite: +1 điểm khi thắng round MA
      if (hasDivineSmite && statKey === "ma") base += 1;
      // Red Ranger: 20% +2 điểm khi thắng round Strength
      if (hasRangerRed && statKey === "str") {
        if (!rangerRedSpun)
          return { pts: base, pending: true, color: "text-red-400" };
        if (rangerRedSpun.isSuccess) base += 2;
      }
      const color =
        base === 0
          ? "text-gray-500"
          : base >= 2
            ? "text-amber-300"
            : "text-blue-400";
      return { pts: base, pending: false, color };
    }

    if (isLoser) {
      // Mute: 10% bị -1 stat — không ảnh hưởng điểm, chỉ hiển thị button để GM ghi nhận
      if (hasMute && !muteSpun)
        return { pts: 0, pending: true, color: "text-pink-400" };
      if (hasEvasion) {
        if (!evasionSpun)
          return { pts: 0, pending: true, color: "text-emerald-400" };
        if (evasionSpun.isSuccess)
          return { pts: 1, pending: false, color: "text-emerald-300" };
      }
      return { pts: 0, pending: false, color: "text-gray-600" };
    }

    return { pts: isWinner ? 1 : 0, pending: false, color: "text-gray-600" };
  };

  // Render round results rows (shared for main and sub combat)
  const renderRounds = (
    rounds: RoundResult[],
    revealedUpTo: number | null,
    p1char?: Character,
    p2char?: Character,
  ) => {
    const p1Effects = getPerRoundEffects(p1char, player1?.no);
    const p2Effects = getPerRoundEffects(p2char, player2?.no);
    const showSpins = !!p1char || !!p2char;

    const makeSpinButton = (
      effectName: string,
      side: "player1" | "player2",
      roundIdx: number,
    ) => {
      const key2 = `${roundIdx}-${effectName}-${side}`;
      const result = roundSpinResults[key2];
      const baseItems =
        effectName === "Critical Strike"
          ? CRIT_ITEMS
          : effectName === "Evasion"
            ? EVASION_ITEMS
            : effectName === "Cruelty"
              ? CRUELTY_ITEMS
              : effectName === "Blind"
                ? BLIND_ITEMS
                : effectName === "Mute"
                  ? MUTE_ITEMS
                  : effectName === "Bash" || effectName === "Luminescence"
                    ? BASH_ITEMS
                    : effectName === "Scrying"
                      ? SCRYING_ITEMS
                      : effectName === "Ranger-Red"
                        ? RANGER_RED_ITEMS
                        : effectName === "Ranger-Blue"
                          ? RANGER_BLUE_ITEMS
                          : effectName === "Ranger-Black"
                            ? RANGER_BLACK_ITEMS
                            : effectName === "Ranger-Yellow"
                              ? RANGER_YELLOW_ITEMS
                              : effectName === "Ranger-Pink"
                                ? RANGER_PINK_ITEMS
                                : effectName === "Ranger-Silver"
                                  ? RANGER_SILVER_ITEMS
                                  : GAMBLER_ITEMS;
      const items = applyDevWeights(effectName, baseItems);

      if (result) {
        // Show result badge — clickable to re-spin
        return (
          <button
            key={effectName}
            onClick={() =>
              setRoundSpinModal({
                isOpen: true,
                title: effectName,
                items,
                roundIndex: roundIdx,
                side,
              })
            }
            className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-bold border transition-colors ${
              result.isSuccess
                ? "bg-amber-600/30 text-amber-300 border-amber-500/40 hover:bg-amber-600/50"
                : "bg-gray-700/60 text-gray-400 border-gray-600/40 hover:bg-gray-700/80"
            }`}
            title={`${effectName}: ${result.label} — click để quay lại`}
          >
            {result.isSuccess ? "✦" : "·"}{" "}
            {effectName === "Critical Strike"
              ? "Crit"
              : effectName === "Evasion"
                ? "Evade"
                : effectName === "Cruelty"
                  ? "Cruelty"
                  : effectName === "Blind"
                    ? "Blind"
                    : effectName === "Mute"
                      ? "Mute"
                      : effectName === "Bash" || effectName === "Luminescence"
                        ? effectName
                        : effectName === "Scrying"
                          ? "Scrying"
                          : effectName.startsWith("Ranger-")
                            ? effectName.replace("Ranger-", "") + "🦸"
                            : "Gambler"}
          </button>
        );
      }
      return (
        <button
          key={effectName}
          onClick={() =>
            setRoundSpinModal({
              isOpen: true,
              title: effectName,
              items,
              roundIndex: roundIdx,
              side,
            })
          }
          className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-purple-700/50 hover:bg-purple-600/60 text-purple-200 font-bold transition-colors border border-purple-600/30"
          title={`Quay ${effectName}`}
        >
          🎡{" "}
          {effectName === "Critical Strike"
            ? "Crit"
            : effectName === "Evasion"
              ? "Evade"
              : effectName === "Cruelty"
                ? "Cruelty"
                : effectName === "Blind"
                  ? "Blind"
                  : effectName === "Mute"
                    ? "Mute"
                    : effectName === "Bash" || effectName === "Luminescence"
                      ? effectName
                      : effectName === "Scrying"
                        ? "Scrying"
                        : effectName.startsWith("Ranger-")
                          ? effectName.replace("Ranger-", "") + "🦸"
                          : "Gambler"}
        </button>
      );
    };

    return (
      <div className="space-y-1">
        {STAT_ORDER.map(({ key, label }, index) => {
          const round = rounds[index];
          const revealed = revealedUpTo !== null ? index <= revealedUpTo : true;
          const p1Win = revealed && round?.winner === "player1";
          const p2Win = revealed && round?.winner === "player2";
          const tie = revealed && round?.winner === "tie";

          // Which spin effects are relevant for this round
          // Bash/Luminescence không trigger ở round cuối (index 5 = MA) vì không có round kế
          // Bloodthirsty is auto-applied (no spin needed), always filter it out from spin buttons
          const filterLastRound = (effs: string[]) =>
            effs.filter((e) => e !== "Bloodthirsty" && e !== "Divine Smite" && e !== "Cautious-Self" && (index !== 5 || (e !== "Bash" && e !== "Luminescence")));
          const p1SpinEffects = filterLastRound(p1Win
            ? p1Effects.onWin
            : tie
              ? p1Effects.onTie
              : revealed
                ? p1Effects.onLose
                : []);
          const p2SpinEffects = filterLastRound(p2Win
            ? p2Effects.onWin
            : tie
              ? p2Effects.onTie
              : revealed
                ? p2Effects.onLose
                : []);

          // Effective points after spins (only if chars provided)
          const p1Pts =
            revealed && round && showSpins
              ? computeRoundPoints(
                  "player1",
                  round.winner,
                  index,
                  p1Effects,
                  key,
                )
              : null;
          const p2Pts =
            revealed && round && showSpins
              ? computeRoundPoints(
                  "player2",
                  round.winner,
                  index,
                  p2Effects,
                  key,
                )
              : null;

          // Show point badge: only when pts > 0 or pending (OTP stat wrong = 0 pts → hide badge)
          const showP1Pts =
            revealed && round && p1Pts && (p1Pts.pts > 0 || p1Pts.pending);
          const showP2Pts =
            revealed && round && p2Pts && (p2Pts.pts > 0 || p2Pts.pending);

          // JRPG row background
          const rowBg = !revealed
            ? "bg-gray-900/30 border-gray-800/40"
            : p1Win
              ? "bg-blue-950/40 border-blue-700/30"
              : p2Win
                ? "bg-red-950/40 border-red-700/30"
                : tie
                  ? "bg-yellow-950/30 border-yellow-700/20"
                  : "bg-gray-900/30 border-gray-700/20";

          return (
            <div
              key={key}
              className={`rounded-lg border transition-all duration-500 overflow-hidden ${
                revealed ? "opacity-100" : "opacity-20"
              } ${rowBg}`}
            >
              <div className="grid grid-cols-[1fr_56px_1fr] gap-1 items-center px-2 py-1.5">
                {/* P1 value + pts */}
                <div className="flex items-center justify-end gap-1.5">
                  {showP1Pts && p1Pts && (
                    <span className={`text-[10px] font-black ${p1Pts.color}`}>
                      {p1Pts.pending ? `+${p1Pts.pts}?` : `+${p1Pts.pts}`}
                    </span>
                  )}
                  <span
                    className={`text-sm font-black tabular-nums ${
                      p1Win
                        ? "text-blue-300"
                        : tie
                          ? "text-yellow-400"
                          : revealed
                            ? "text-gray-500"
                            : "text-gray-700"
                    }`}
                  >
                    {revealed ? (round?.player1Value ?? "?") : "?"}
                  </span>
                  {p1Win && (
                    <span className="text-blue-400 text-[10px] font-black">
                      ▶
                    </span>
                  )}
                </div>

                {/* Stat label + round indicator */}
                <div className="text-center">
                  <div
                    className={`text-[10px] font-black tracking-wider ${
                      p1Win
                        ? "text-blue-400/70"
                        : p2Win
                          ? "text-red-400/70"
                          : tie
                            ? "text-yellow-400/70"
                            : "text-gray-600"
                    }`}
                  >
                    {label}
                  </div>
                  <div className="text-[8px] text-gray-700 font-mono">
                    R{index + 1}
                  </div>
                </div>

                {/* P2 value + pts */}
                <div className="flex items-center justify-start gap-1.5">
                  {p2Win && (
                    <span className="text-red-400 text-[10px] font-black">
                      ◀
                    </span>
                  )}
                  <span
                    className={`text-sm font-black tabular-nums ${
                      p2Win
                        ? "text-red-300"
                        : tie
                          ? "text-yellow-400"
                          : revealed
                            ? "text-gray-500"
                            : "text-gray-700"
                    }`}
                  >
                    {revealed ? (round?.player2Value ?? "?") : "?"}
                  </span>
                  {showP2Pts && p2Pts && (
                    <span className={`text-[10px] font-black ${p2Pts.color}`}>
                      {p2Pts.pending ? `+${p2Pts.pts}?` : `+${p2Pts.pts}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Per-round spin buttons */}
              {showSpins &&
                revealed &&
                (p1SpinEffects.length > 0 || p2SpinEffects.length > 0) && (
                  <div className="grid grid-cols-[1fr_56px_1fr] gap-1 px-2 pb-1.5 border-t border-gray-700/20 pt-1">
                    <div className="flex justify-end gap-1 flex-wrap">
                      {p1SpinEffects.map((eff) =>
                        makeSpinButton(eff, "player1", index),
                      )}
                    </div>
                    <div />
                    <div className="flex justify-start gap-1 flex-wrap">
                      {p2SpinEffects.map((eff) =>
                        makeSpinButton(eff, "player2", index),
                      )}
                    </div>
                  </div>
                )}
            </div>
          );
        })}
      </div>
    );
  };

  const battleDone = !!combatResult;
  const stepInProgress = !!stepState && stepRoundIndex < 6;

  // Kiểm tra round vừa resolve (stepRoundIndex-1) còn pending spin không
  const pendingSpinsForLastRound = useMemo(() => {
    if (!stepInProgress || stepRoundIndex === 0) return false;
    const lastRoundIdx = stepRoundIndex - 1;
    const p1Effects = getPerRoundEffects(player1?.character, player1?.no);
    const p2Effects = getPerRoundEffects(player2?.character, player2?.no);
    // Tìm log theo roundIndex (không phải array index — roundLogs có thể có pre-combat log ở đầu)
    const lastRound = stepState?.roundLogs.find((l) => l.roundIndex === lastRoundIdx);
    if (!lastRound) return false;
    const winner = lastRound.winner;
    // Check pending từ computeRoundPoints (Crit, Evasion, Cruelty, OTP...)
    if (computeRoundPoints("player1", winner, lastRoundIdx, p1Effects).pending) return true;
    if (computeRoundPoints("player2", winner, lastRoundIdx, p2Effects).pending) return true;
    // Check Bash/Luminescence/Scrying/Ranger-Silver chưa spin (không phải round cuối)
    if (lastRoundIdx < 5) {
      const AFTER_WIN_SPINS = ["Bash", "Luminescence", "Scrying", "Ranger-Silver"];
      const checkSide = (side: "player1" | "player2", effs: string[]) => {
        for (const eff of AFTER_WIN_SPINS) {
          if (effs.includes(eff) && !roundSpinResults[`${lastRoundIdx}-${eff}-${side}`]) return true;
        }
        return false;
      };
      const p1WinEffs = winner === "player1" ? p1Effects.onWin : [];
      const p2WinEffs = winner === "player2" ? p2Effects.onWin : [];
      if (checkSide("player1", p1WinEffs)) return true;
      if (checkSide("player2", p2WinEffs)) return true;
    }
    return false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepInProgress, stepRoundIndex, roundSpinResults, player1, player2, stepState]);

  // Compute effective scores accounting for crit/gambler/evasion/blind spins
  // Rounds còn pending spin → chưa tính vào score
  const effectiveScores = useMemo(() => {
    if (!combatResult) return { s1: 0, s2: 0 };
    const rounds = combatResult.rounds;
    const p1Effects = getPerRoundEffects(player1?.character, player1?.no);
    const p2Effects = getPerRoundEffects(player2?.character, player2?.no);
    const hasP1BT = p1Effects.onWin.includes("Bloodthirsty");
    const hasP2BT = p2Effects.onWin.includes("Bloodthirsty");
    const startS1 = combatResult.startPlayer1Score ?? 0;
    const startS2 = combatResult.startPlayer2Score ?? 0;
    let s1 = startS1, s2 = startS2;
    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      const r1 = computeRoundPoints("player1", r.winner, i, p1Effects, r.stat);
      const r2 = computeRoundPoints("player2", r.winner, i, p2Effects, r.stat);
      if (r1.pending || r2.pending) break;
      if (hasP1BT && r.winner !== "player1") s1 = 0;
      if (hasP2BT && r.winner !== "player2") s2 = 0;
      s1 += r1.pts;
      s2 += r2.pts;
    }
    return { s1: Math.max(0, s1), s2: Math.max(0, s2) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    combatResult,
    roundSpinResults,
    player1,
    player2,
    disabledItems,
    oneTrickPonyStat,
  ]);

  // Live score: 0:0 trước combat; trong combat chỉ tính rounds đã xác nhận hết spin; sau combat dùng effectiveScores
  const liveScore = useMemo(() => {
    if (battleDone) return { s1: effectiveScores.s1, s2: effectiveScores.s2 };
    if (stepState && player1 && player2) {
      const rounds = stepState.resolvedRounds;
      const p1Effs = getPerRoundEffects(player1.character, player1.no);
      const p2Effs = getPerRoundEffects(player2.character, player2.no);
      const hasP1BT = p1Effs.onWin.includes("Bloodthirsty");
      const hasP2BT = p2Effs.onWin.includes("Bloodthirsty");
      let s1 = stepState.startP1Score;
      let s2 = stepState.startP2Score;
      for (let i = 0; i < rounds.length; i++) {
        const r1 = computeRoundPoints("player1", rounds[i].winner, i, p1Effs, rounds[i].stat);
        const r2 = computeRoundPoints("player2", rounds[i].winner, i, p2Effs, rounds[i].stat);
        // Round còn pending spin → dừng, không tính round này và sau
        if (r1.pending || r2.pending) break;
        // Bloodthirsty: reset trước khi cộng điểm round này
        if (hasP1BT && rounds[i].winner !== "player1") s1 = 0;
        if (hasP2BT && rounds[i].winner !== "player2") s2 = 0;
        s1 += r1.pts;
        s2 += r2.pts;
      }
      return { s1, s2 };
    }
    if (stepState) return { s1: stepState.p1Score, s2: stepState.p2Score };
    // Before combat: compute starting points from before_combat effects + raumanianSuccess
    if (!player1 || !player2) return { s1: 0, s2: 0 };
    const computePreCombatScore = (
      self: PvPPlayerData,
      opponent: PvPPlayerData,
      selfLabel: "player1" | "player2",
    ): number => {
      if (!self.character) return 0;
      const selfNo = self.no;
      const oppChar = opponent.character;
      const oppRace = oppChar?.race?.race || opponent.race || "";
      const oppHasLover = !!(
        oppChar?.lover &&
        (Array.isArray(oppChar.lover)
          ? oppChar.lover.some((l: any) => !l.isLost)
          : true)
      );
      const instruments = [
        "Guitar",
        "Violin",
        "Piano",
        "Drums",
        "Flute",
        "Bagpipe",
        "Harmonica",
      ];
      const oppHasInstrument = (oppChar?.weapons || []).some(
        (w: any) => !w.isLost && instruments.some((i) => w.name?.includes(i)),
      );
      const oppPowers = (oppChar?.powers || []).map((p: any) =>
        typeof p === "string" ? p : p.name,
      );
      const fx = EffectResolver.calculateCharacterEffects(self.character, {
        isPvE: false,
      });
      let pts = 0;
      for (const ce of fx.combatEffects) {
        if (ce.isActive === false) continue;
        if (ce.effect?.type !== "combat_points") continue;
        if (ce.effect?.timing !== "before_combat") continue;
        const srcName = ce.source?.name || "?";
        const srcType = ce.source?.type || "?";
        if (disabledItems.has(`${selfNo}-${srcType}-${srcName}`)) continue;
        const conditions: any[] = (ce.effect as any).conditions || [];
        const met = conditions.every((cond: any) => {
          if (cond.type === "opponent_has") {
            if (cond.opponentItemType === "lover") return oppHasLover;
            if (
              cond.opponentItemType === "weapon" &&
              cond.opponentItemName === "instrument"
            )
              return oppHasInstrument;
            if (cond.opponentItemType === "power" && cond.opponentItemName) {
              return oppPowers.some(
                (p: string) =>
                  p.toLowerCase() === cond.opponentItemName.toLowerCase(),
              );
            }
          }
          if (cond.type === "race_match" && cond.races) {
            return cond.races.some(
              (r: string) => r.toLowerCase() === oppRace.toLowerCase(),
            );
          }
          return true;
        });
        if (met) pts += (ce.effect as any).points || 0;
      }
      // Raumanian +1
      if (raumanianSuccess[selfLabel]) pts += 1;
      // Golden Coin
      if (goldenCoinPoints[selfLabel]) pts += goldenCoinPoints[selfLabel];
      return pts;
    };
    return {
      s1: computePreCombatScore(player1, player2, "player1"),
      s2: computePreCombatScore(player2, player1, "player2"),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    battleDone,
    stepState,
    effectiveScores,
    player1,
    player2,
    disabledItems,
    raumanianSuccess,
    goldenCoinPoints,
    roundSpinResults,
  ]);

  // Whether any revealed round still has a pending spin
  const pendingSpins = useMemo(() => {
    if (!combatResult) return false;
    const rounds = combatResult.rounds;
    const p1Effects = getPerRoundEffects(player1?.character, player1?.no);
    const p2Effects = getPerRoundEffects(player2?.character, player2?.no);
    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      if (computeRoundPoints("player1", r.winner, i, p1Effects, r.stat).pending)
        return true;
      if (computeRoundPoints("player2", r.winner, i, p2Effects, r.stat).pending)
        return true;
    }
    // Also block if any after-combat wheel entry hasn't been spun yet
    for (const entry of afterCombatEntries) {
      if (entry.wheelKey && !afterCombatSpinResults[entry.wheelKey]) return true;
    }
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    combatResult,
    roundSpinResults,
    player1,
    player2,
    disabledItems,
    oneTrickPonyStat,
    afterCombatEntries,
    afterCombatSpinResults,
  ]);

  // Effective winner after spins resolved
  const effectiveWinner = useMemo((): "player1" | "player2" | null => {
    if (!combatResult || !player1 || !player2) return null;
    const { s1, s2 } = effectiveScores;
    if (s1 > s2) return "player1";
    if (s2 > s1) return "player2";
    // Tie: use race tier
    return player1.raceTier <= player2.raceTier ? "player1" : "player2";
  }, [combatResult, effectiveScores, player1, player2]);

  // User must explicitly confirm result after spins are done
  const [combatConfirmed, setCombatConfirmed] = useState(false);

  const mainWinner =
    combatConfirmed && effectiveWinner
      ? effectiveWinner === "player1"
        ? player1
        : player2
      : null;
  const lastRoundLog =
    stepState && stepState.roundLogs.length > 0
      ? stepState.roundLogs[stepState.roundLogs.length - 1]
      : null;

  // Combat 3D effect triggers — fire briefly after each round resolves
  const [p1EffectKey, setP1EffectKey] = useState(0);
  const [p2EffectKey, setP2EffectKey] = useState(0);
  const [p1Boost, setP1Boost] = useState(false);
  const [p1Debuff, setP1Debuff] = useState(false);
  const [p2Boost, setP2Boost] = useState(false);
  const [p2Debuff, setP2Debuff] = useState(false);
  const [critActive, setCritActive] = useState(false);
  const [p1Bubbles, setP1Bubbles] = useState<StatBubble[]>([]);
  const [p2Bubbles, setP2Bubbles] = useState<StatBubble[]>([]);

  // Helper: spawn floating bubbles — accumulate, each auto-removes after 3s
  const spawnStatBubbles = useCallback(
    (items: { player: "player1" | "player2"; text: string; isPositive: boolean }[]) => {
      if (items.length === 0) return;
      const newP1: StatBubble[] = [];
      const newP2: StatBubble[] = [];
      items.forEach((e, i) => {
        const isP1 = e.player === "player1";
        const xBase = isP1 ? 5 + Math.random() * 17 : 78 + Math.random() * 17;
        const id = ++_bubbleIdCounter;
        const bubble: StatBubble = {
          id,
          text: e.text,
          isPositive: e.isPositive,
          x: xBase,
          startY: 30 + (i % 4) * 10 + Math.random() * 5,
        };
        if (isP1) newP1.push(bubble);
        else newP2.push(bubble);
        // Auto-remove after animation duration (3s)
        setTimeout(() => {
          setP1Bubbles((prev) => prev.filter((b) => b.id !== id));
          setP2Bubbles((prev) => prev.filter((b) => b.id !== id));
        }, 3000);
      });
      if (newP1.length) setP1Bubbles((prev) => [...prev, ...newP1]);
      if (newP2.length) setP2Bubbles((prev) => [...prev, ...newP2]);
    },
    [],
  );

  // Which round log is currently shown (null = always follow latest)
  const [viewLogIndex, setViewLogIndex] = useState<number | null>(null);
  useEffect(() => {
    if (!lastRoundLog || lastRoundLog.roundIndex < 0) return;
    const p1Win = lastRoundLog.winner === "player1";
    const p2Win = lastRoundLog.winner === "player2";
    const hasCrit = lastRoundLog.events.some((e) =>
      e.description.toLowerCase().includes("critical"),
    );
    setP1Boost(p1Win);
    setP1Debuff(!p1Win && lastRoundLog.winner !== "tie");
    setP2Boost(p2Win);
    setP2Debuff(!p2Win && lastRoundLog.winner !== "tie");
    if (hasCrit) setCritActive(true);
    setP1EffectKey((k) => k + 1);
    setP2EffectKey((k) => k + 1);

    const timer = setTimeout(() => {
      setP1Boost(false);
      setP1Debuff(false);
      setP2Boost(false);
      setP2Debuff(false);
      setCritActive(false);
    }, 3100);
    return () => clearTimeout(timer);
  }, [lastRoundLog]);

  // Auto-advance log view to latest round when new round resolves
  useEffect(() => {
    if (lastRoundLog && stepState && lastRoundLog.roundIndex >= 0) {
      const idx = stepState.roundLogs.length - 1;
      setViewLogIndex(idx);
    }
  }, [lastRoundLog]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${wheelBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="text-white text-2xl">Loading players...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-4 px-2 relative"
      style={{
        backgroundImage: `url(${wheelBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* 3D animated background layer */}
      <PvPBackground3D />

      {/* Full-screen Canvas overlay for critical hit screen shake */}
      {critActive && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 9999 }}
        >
          <Canvas
            camera={{ position: [0, 0, 5], fov: 75 }}
            gl={{ alpha: true, antialias: false }}
            style={{ background: "transparent" }}
          >
            <CombatEffects3D
              boostTrigger={false}
              debuffTrigger={false}
              criticalTrigger={critActive}
              position={[0, 0, 0]}
            />
          </Canvas>
        </div>
      )}

      {/* Content above 3D background */}
      <div className="relative" style={{ zIndex: 1 }}>
        {/* Top bar */}
        <div className="max-w-[1400px] mx-auto mb-4 flex items-center gap-4 px-2">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2 shrink-0"
          >
            <span>←</span> Back
          </button>
          <div className="flex-1 px-5 py-3 rounded-2xl border border-gray-600/50 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-red-900/20">
            <h1 className="text-xl font-bold text-white">
              {isTournamentMode
                ? `Match #${tournamentMatch!.matchNumber}`
                : "PvP Stats Comparison"}
            </h1>
            {isTournamentMode && player1 && player2 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {player1.name} vs {player2.name}
              </p>
            )}
          </div>
        </div>

        {/* 3-column layout: left sidebar | center | right sidebar */}
        <div className="max-w-[1400px] mx-auto flex gap-3 px-2 items-start">
          {/* ── LEFT SIDEBAR: Player 1 ── */}
          {(() => {
            const p1Items = player1?.character
              ? buildInventoryList(player1.character)
              : [];
            const p1AudioTracks = detectCombatAudioTracks(player1?.character);
            const p2AudioTracks = detectCombatAudioTracks(player2?.character);
            const p1Quirks = (player1?.character?.quirks || []).filter((q: any) => !q.isLost).map((q: any) => (typeof q === "string" ? q : q.name).toLowerCase());
            const p1Silenced = p1Quirks.includes("mute") || p1Quirks.includes("deaf");
            const p1Blurred = p1Quirks.includes("blind");
            return (
              <div className={`w-[360px] shrink-0 flex flex-col bg-gray-900/90 rounded-2xl border border-blue-500/30 max-h-[85vh] ${false && p1Blurred ? "blur-sm pointer-events-none select-none" : ""}`}>
                {/* Avatar lớn P1 */}
                {player1 && (
                  <SidebarAvatarBanner
                    key={`${player1.no}-${audioResetKey}`}
                    player={player1}
                    accent="blue"
                    audioTracks={p1AudioTracks}
                    otherSideHasAudio={p2AudioTracks.length > 0}
                    audioStopped={!!combatResult}
                    silenced={p1Silenced}
                    blurred={p1Blurred}
                  />
                )}
                {/* Header: search + tab switcher */}
                <div className="p-3 border-b border-blue-500/20 shrink-0 space-y-2">
                  <div className="relative">
                    {player1 ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-blue-600/40 rounded-lg">
                        <span className="text-blue-400 text-xs font-mono">
                          #{player1.no}
                        </span>
                        <span className="text-white text-sm font-bold flex-1 truncate">
                          {player1.name}
                        </span>
                        {!isTournamentMode && (
                          <button
                            onClick={() => {
                              setPlayer1(null);
                              setSearchTerm1("");
                              resetCombat();
                            }}
                            className="text-gray-500 hover:text-white text-xs shrink-0"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="Tìm Player 1..."
                          value={searchTerm1}
                          onFocus={() => setFocus1(true)}
                          onBlur={() => setTimeout(() => setFocus1(false), 150)}
                          onChange={(e) => setSearchTerm1(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-blue-600/40 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        {focus1 && filteredPlayers1.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                            {filteredPlayers1.map((p) => (
                              <button
                                key={p.no}
                                onMouseDown={() => {
                                  setPlayer1(p);
                                  setSearchTerm1(p.name);
                                  setFocus1(false);
                                  setLeftTab("effects");
                                  resetCombat();
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-gray-700 text-white text-sm flex justify-between items-center gap-2"
                              >
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-blue-400 font-mono text-xs shrink-0">
                                    #{p.no}
                                  </span>
                                  <span className="truncate">{p.name}</span>
                                </span>
                                <span className="text-xs text-gray-400 shrink-0">
                                  {p.race}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {player1 && (
                    <div className="flex bg-gray-800/60 rounded-lg p-0.5 gap-0.5">
                      <button
                        onClick={() => setLeftTab("effects")}
                        className={`flex-1 text-xs py-1 rounded-md font-medium transition-all ${leftTab === "effects" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}
                      >
                        Hiệu ứng
                      </button>
                      <button
                        onClick={() => setLeftTab("inventory")}
                        className={`flex-1 text-xs py-1 rounded-md font-medium transition-all ${leftTab === "inventory" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}
                      >
                        Inventory{" "}
                        {p1Items.length > 0 && (
                          <span className="opacity-60">({p1Items.length})</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1 p-3">
                  {player1 ? (
                    leftTab === "effects" ? (
                      <StatModifiersTable
                        breakdown={player1.breakdown}
                        baseStats={player1.baseStats}
                      />
                    ) : (
                      <div className="space-y-0.5">
                        {p1Items.length === 0 ? (
                          <div className="text-gray-600 text-xs text-center py-8">
                            Không có item
                          </div>
                        ) : (
                          p1Items.map((item, i) => {
                            const k = `${player1.no}-${item.sourceType}-${item.name}`;
                            const disabled = disabledItems.has(k);
                            const colorClass =
                              (sourceTypeColors as Record<string, string>)[
                                item.sourceType
                              ] || "text-gray-400";
                            return (
                              <button
                                key={i}
                                onClick={() =>
                                  toggleItem(
                                    player1.no,
                                    item.sourceType,
                                    item.name,
                                  )
                                }
                                className={`w-full text-left text-[11px] px-2 py-1.5 rounded transition-all ${disabled ? "opacity-35 bg-gray-800/20" : "hover:bg-gray-700/40 bg-gray-800/10"}`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className={`${colorClass} ${disabled ? "line-through" : ""}`}>{item.name}</span>
                                  <span className="text-gray-700 text-[9px]">
                                    [{item.sourceType}]
                                  </span>
                                  {disabled && (
                                    <span className="text-red-500 text-[9px] ml-auto">
                                      OFF
                                    </span>
                                  )}
                                </div>
                                {item.description && !disabled && (
                                  <div className="text-gray-500 text-[10px] mt-0.5 leading-snug">{item.description}</div>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-gray-600 text-xs text-center py-8">
                      Chọn Player 1 để xem
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── CENTER: Battle area ── */}
          <div className="flex-1 min-w-0">
            {/* ── JRPG Battle Scene ── */}
            <div
              className="relative rounded-2xl border border-gray-600/40 mb-3 overflow-hidden"
              style={{
                background:
                  "linear-gradient(180deg, #0a0f1e 0%, #0d1525 50%, #0a0e1a 100%)",
                boxShadow:
                  "0 0 40px rgba(59,130,246,0.06), 0 0 40px rgba(239,68,68,0.06) inset",
              }}
            >
              {/* Scanline overlay for retro feel */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)",
                  zIndex: 0,
                }}
              />

              {/* Round indicator banner */}
              {stepState && stepRoundIndex >= 0 && (
                <div className="relative z-10 flex justify-center pt-2 pb-1">
                  <div className="px-4 py-0.5 rounded-full bg-purple-900/50 border border-purple-500/30 text-purple-300 text-[11px] font-bold tracking-widest uppercase">
                    ⚔ Round {stepRoundIndex + 1} / 6
                  </div>
                </div>
              )}

              <div className="relative z-10 p-3">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
                  {/* P1 card with 3D frame */}
                  {player1 ? (
                    <PlayerCard3DFrame
                      side="left"
                      isWinner={
                        combatConfirmed &&
                        !isPendingRoundtable &&
                        effectiveWinner === "player1"
                      }
                      boostTrigger={p1Boost}
                      debuffTrigger={p1Debuff}
                      key={`p1-frame-${p1EffectKey}`}
                    >
                      <SCPlayerCard
                        player={player1}
                        side="left"
                        displayStats={p1DisplayStats}
                        isWinner={
                          combatConfirmed &&
                          !isPendingRoundtable &&
                          effectiveWinner === "player1"
                        }
                        showWinner={combatConfirmed && !isPendingRoundtable}
                      />
                    </PlayerCard3DFrame>
                  ) : (
                    <div
                      className="rounded-xl border-2 border-dashed border-blue-600/20 flex items-center justify-center min-h-[140px]"
                      style={{ background: "rgba(15,23,42,0.6)" }}
                    >
                      <span className="text-blue-900/60 text-sm font-bold">
                        PLAYER 1
                      </span>
                    </div>
                  )}

                  {/* ── VS / Score Center ── */}
                  <ScoreDisplay3D
                    winner={
                      combatConfirmed && !isPendingRoundtable
                        ? effectiveWinner
                        : null
                    }
                    p1Score={liveScore.s1}
                    p2Score={liveScore.s2}
                  >
                    <div className="flex flex-col items-center justify-center min-w-[90px]">
                      {/* Score display */}
                      <div className="text-center mb-1">
                        <div
                          className="font-black tracking-tight leading-none"
                          style={{
                            fontSize: "2.4rem",
                            textShadow: "0 0 20px currentColor",
                          }}
                        >
                          <span
                            className="text-blue-400"
                            style={{ textShadow: "0 0 16px #3b82f6" }}
                          >
                            {battleDone ? effectiveScores.s1 : liveScore.s1}
                          </span>
                          <span className="text-gray-600 mx-1 text-2xl">:</span>
                          <span
                            className="text-red-400"
                            style={{ textShadow: "0 0 16px #ef4444" }}
                          >
                            {battleDone ? effectiveScores.s2 : liveScore.s2}
                          </span>
                        </div>
                      </div>

                      {/* Status label */}
                      {battleDone ? (
                        <>
                          {pendingSpins && (
                            <div className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse font-bold">
                              ● Còn spin
                            </div>
                          )}
                          {!pendingSpins &&
                            combatResult!.tieBreaker &&
                            effectiveScores.s1 === effectiveScores.s2 && (
                              <div className="text-[9px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">
                                RACE TIER
                              </div>
                            )}
                          {!isPendingRoundtable && mainWinner && (
                            <div
                              className={`text-[11px] font-black mt-1 px-3 py-1 rounded-lg border tracking-wide ${
                                effectiveWinner === "player1"
                                  ? "text-blue-300 bg-blue-500/10 border-blue-500/30"
                                  : "text-red-300 bg-red-500/10 border-red-500/30"
                              }`}
                              style={{
                                textShadow: `0 0 10px ${effectiveWinner === "player1" ? "#3b82f6" : "#ef4444"}`,
                              }}
                            >
                              {mainWinner.name}
                              <br />
                              <span className="text-yellow-400 text-[10px]">
                                WINS ★
                              </span>
                            </div>
                          )}
                          {isPendingRoundtable && (
                            <div className="text-[10px] font-bold mt-1 px-2 py-0.5 rounded-lg text-yellow-300 bg-yellow-500/10 border border-yellow-500/30">
                              ⏳ PENDING
                            </div>
                          )}
                        </>
                      ) : !stepState ? (
                        <div className="text-[10px] text-gray-600 font-bold tracking-widest mt-1">
                          VS
                        </div>
                      ) : null}
                    </div>
                  </ScoreDisplay3D>

                  {/* P2 card with 3D frame */}
                  {player2 ? (
                    <PlayerCard3DFrame
                      side="right"
                      isWinner={
                        combatConfirmed &&
                        !isPendingRoundtable &&
                        effectiveWinner === "player2"
                      }
                      boostTrigger={p2Boost}
                      debuffTrigger={p2Debuff}
                      key={`p2-frame-${p2EffectKey}`}
                    >
                      <SCPlayerCard
                        player={player2}
                        side="right"
                        displayStats={p2DisplayStats}
                        isWinner={
                          combatConfirmed &&
                          !isPendingRoundtable &&
                          effectiveWinner === "player2"
                        }
                        showWinner={combatConfirmed && !isPendingRoundtable}
                      />
                    </PlayerCard3DFrame>
                  ) : (
                    <div
                      className="rounded-xl border-2 border-dashed border-red-600/20 flex items-center justify-center min-h-[140px]"
                      style={{ background: "rgba(15,23,42,0.6)" }}
                    >
                      <span className="text-red-900/60 text-sm font-bold">
                        PLAYER 2
                      </span>
                    </div>
                  )}
                </div>

                {/* Swap button */}
                {player1 && player2 && !isTournamentMode && (
                  <div className="mt-2 flex justify-center">
                    <button
                      onClick={swapPlayers}
                      disabled={stepInProgress}
                      className="px-3 py-1 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all text-xs border border-gray-700/40 hover:border-purple-500/40"
                    >
                      ⇄ Swap
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Combat Effects Panel (before/during/after) */}
            {player1 && player2 && (
              <div className="mb-3">
                <CombatEffectsPanel
                  player1={{ name: player1.name, character: player1.character }}
                  player2={{ name: player2.name, character: player2.character }}
                  combatResult={
                    battleDone && combatConfirmed && effectiveWinner
                      ? {
                          winner: effectiveWinner,
                          player1Score: effectiveScores.s1,
                          player2Score: effectiveScores.s2,
                          rounds: combatResult!.rounds.map((r) => ({
                            stat: r.stat,
                            winner: r.winner,
                          })),
                        }
                      : undefined
                  }
                  onWheelResolved={handleWheelResolved}
                  onPendingPreCombatChange={setPendingPreCombatCount}
                />
              </div>
            )}

            {/* Round results / pre-battle stat comparison */}
            {player1 && player2 && (
              <div
                className="rounded-2xl border border-gray-700/40 p-3 mb-3 overflow-hidden"
                style={{
                  background:
                    "linear-gradient(160deg, #0c1220 0%, #0f172a 100%)",
                }}
              >
                {combatResult || stepState ? (
                  renderRounds(
                    combatResult
                      ? combatResult.rounds
                      : stepState!.resolvedRounds,
                    combatResult
                      ? null
                      : stepRoundIndex > 0
                        ? stepRoundIndex - 1
                        : -1,
                    player1.character,
                    player2.character,
                  )
                ) : (
                  /* Pre-battle: JRPG stat comparison bars */
                  <div className="space-y-1">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_56px_1fr] gap-1 mb-2 items-center">
                      <div className="text-right text-[11px] font-black text-blue-400 tracking-wide truncate pr-1">
                        {player1.name}
                      </div>
                      <div className="text-center" />
                      <div className="text-left text-[11px] font-black text-red-400 tracking-wide truncate pl-1">
                        {player2.name}
                      </div>
                    </div>
                    {STAT_ORDER.map(({ key, label }) => {
                      const v1 = (p1DisplayStats ?? player1.stats)[key];
                      const v2 = (p2DisplayStats ?? player2.stats)[key];
                      const p1Higher = v1 > v2;
                      const p2Higher = v2 > v1;
                      const maxVal = Math.max(v1, v2, 1);
                      return (
                        <div
                          key={key}
                          className="grid grid-cols-[1fr_56px_1fr] gap-1 items-center"
                        >
                          {/* P1 bar (right-aligned) */}
                          <div className="flex items-center gap-1.5 justify-end">
                            <span
                              className={`text-sm font-black w-6 text-right ${p1Higher ? "text-blue-300" : "text-gray-500"}`}
                            >
                              {v1}
                            </span>
                            <div className="flex-1 max-w-[80px] bg-gray-800/60 rounded-full h-2 overflow-hidden flex justify-end">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${p1Higher ? "bg-gradient-to-l from-blue-500 to-blue-400" : "bg-gray-600/60"}`}
                                style={{ width: `${(v1 / maxVal) * 100}%` }}
                              />
                            </div>
                          </div>
                          {/* Stat label */}
                          <div
                            className={`text-center text-[10px] font-black tracking-wider py-0.5 rounded ${p1Higher === p2Higher ? "text-gray-500" : p1Higher ? "text-blue-500/60" : "text-red-500/60"}`}
                          >
                            {label}
                          </div>
                          {/* P2 bar (left-aligned) */}
                          <div className="flex items-center gap-1.5 justify-start">
                            <div className="flex-1 max-w-[80px] bg-gray-800/60 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${p2Higher ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gray-600/60"}`}
                                style={{ width: `${(v2 / maxVal) * 100}%` }}
                              />
                            </div>
                            <span
                              className={`text-sm font-black w-6 ${p2Higher ? "text-red-300" : "text-gray-500"}`}
                            >
                              {v2}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Round Log Box */}
                {(() => {
                  const logs = stepState?.roundLogs ?? [];
                  if (logs.length === 0) return null;
                  const viewIdx = Math.min(viewLogIndex ?? logs.length - 1, logs.length - 1);
                  const log = logs[viewIdx];
                  const borderColor = log.winner === "player1" ? "rgba(59,130,246,0.3)" : log.winner === "player2" ? "rgba(239,68,68,0.3)" : "rgba(234,179,8,0.3)";
                  return (
                    <div className="mt-2 rounded-xl border overflow-hidden text-xs" style={{ background: "rgba(0,0,0,0.4)", borderColor }}>
                      {/* Navigation header */}
                      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-800/60">
                        <button onClick={() => setViewLogIndex(0)} disabled={viewIdx === 0}
                          className="px-1 py-0.5 rounded text-[10px] text-gray-500 hover:text-white disabled:opacity-20">«</button>
                        <button onClick={() => setViewLogIndex(Math.max(0, viewIdx - 1))} disabled={viewIdx === 0}
                          className="px-1 py-0.5 rounded text-[10px] text-gray-500 hover:text-white disabled:opacity-20">‹</button>
                        <div className="flex gap-0.5 flex-1 justify-center">
                          {logs.map((lg, i) => (
                            <button key={i} onClick={() => setViewLogIndex(i)}
                              className={`w-5 h-5 rounded text-[9px] font-black transition-colors ${i === viewIdx ? (lg.roundIndex === -1 ? "bg-yellow-700/70 text-white" : "bg-purple-600/70 text-white") : "bg-gray-800/60 text-gray-500 hover:bg-gray-700/60 hover:text-gray-300"}`}>
                              {lg.roundIndex === -1 ? "P" : i + (logs[0]?.roundIndex === -1 ? 0 : 1)}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setViewLogIndex(Math.min(logs.length - 1, viewIdx + 1))} disabled={viewIdx === logs.length - 1}
                          className="px-1 py-0.5 rounded text-[10px] text-gray-500 hover:text-white disabled:opacity-20">›</button>
                        <button onClick={() => setViewLogIndex(logs.length - 1)} disabled={viewIdx === logs.length - 1}
                          className="px-1 py-0.5 rounded text-[10px] text-gray-500 hover:text-white disabled:opacity-20">»</button>
                      </div>
                      {/* Round content */}
                      <div className="px-2.5 py-1.5 space-y-0.5" style={{ borderLeft: `3px solid ${borderColor}` }}>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-black tracking-widest" style={{ background: log.roundIndex === -1 ? "rgba(234,179,8,0.2)" : "rgba(168,85,247,0.2)", color: log.roundIndex === -1 ? "#fbbf24" : "#c084fc", border: `1px solid ${log.roundIndex === -1 ? "rgba(234,179,8,0.3)" : "rgba(168,85,247,0.3)"}` }}>
                            {log.roundIndex === -1 ? "PRE" : `R${log.roundIndex + 1}`}
                          </span>
                          <span className="text-gray-400 text-[11px] font-bold">{log.statLabel}</span>
                          {log.roundIndex !== -1 && <>
                            <span className="text-blue-300 font-black">{log.p1ValueUsed}</span>
                            <span className="text-gray-600 text-[9px]">vs</span>
                            <span className="text-red-300 font-black">{log.p2ValueUsed}</span>
                          </>}
                          <span className="ml-auto text-[11px] font-black">
                            {log.roundIndex === -1 ? <span className="text-yellow-400/70 text-[10px] font-normal italic">Hiệu ứng trước combat</span>
                              : log.winner === "tie" ? <span className="text-yellow-400">═ HÒA</span>
                              : log.winner === "player1" ? <span className="text-blue-300">▶ {player1.name}</span>
                              : <span className="text-red-300">◀ {player2.name}</span>}
                          </span>
                        </div>
                        {log.events.map((ev, i) => (
                          <div key={i} className={`pl-2 border-l-2 text-[11px] ${
                            ev.type === "stat_boost" ? "border-green-500/50 text-green-400"
                            : ev.type === "stat_debuff" ? "border-red-500/50 text-red-400"
                            : ev.type === "carry_over" ? "border-amber-500/50 text-amber-400"
                            : ev.type === "point_change" ? "border-blue-500/50 text-blue-300"
                            : "border-gray-600/50 text-gray-400"
                          }`}>
                            <span className="text-gray-600">[{ev.player === "player1" ? player1.name : player2.name}]</span>
                            {" "}<span className="text-gray-500">{ev.source}:</span>
                            {" "}{ev.description}
                          </div>
                        ))}
                        {(log.carryOverToNext?.length ?? 0) > 0 && (
                          <div className="pl-2 text-amber-400/70 italic text-[11px]">
                            → Carry: {log.carryOverToNext.map(co =>
                              `${co.source} ${co.value > 0 ? "+" : ""}${co.value} ${co.stat.toUpperCase()}`
                            ).join(", ")}
                          </div>
                        )}
                        <div className="flex justify-between text-[10px] text-gray-600 border-t border-gray-700/30 pt-1 mt-0.5">
                          <span>Score <span className="text-blue-400 font-bold">{log.p1Score}</span> : <span className="text-red-400 font-bold">{log.p2Score}</span></span>
                          {stepInProgress && viewIdx === logs.length - 1 && (
                            <span className="text-gray-600 animate-pulse">R{stepRoundIndex + 1}/6 →</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Roundtable Hold Pending Banner */}
            {battleDone && isPendingRoundtable && pendingLoser && (
              <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-xl p-4 mb-3">
                <div className="text-yellow-400 font-bold text-base mb-1 flex items-center gap-2">
                  <span>⏳</span> KẾT QUẢ TẠM HOÃN — Roundtable Hold kích hoạt
                </div>
                <div className="text-yellow-300/80 text-sm mb-3">
                  <strong>
                    {pendingLoser === "player1" ? player1?.name : player2?.name}
                  </strong>{" "}
                  thua nhưng có Roundtable Hold. Chọn một Tarnished còn sống lên
                  đấu trận phụ.
                </div>

                {!selectedTarnished ? (
                  <div>
                    <div className="text-xs text-gray-400 mb-2">
                      {tarnishedList.length} Tarnished còn hoạt động:
                    </div>
                    <input
                      type="text"
                      placeholder="Tìm Tarnished..."
                      value={tarnishedSearchTerm}
                      onChange={(e) => setTarnishedSearchTerm(e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-800 border border-yellow-600/40 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 mb-2"
                    />
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {filteredTarnished.map((p) => (
                        <button
                          key={p.no}
                          onClick={() => setSelectedTarnished(p)}
                          className="w-full px-3 py-2 text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-yellow-500/50 rounded-lg text-white text-sm flex justify-between items-center transition-all"
                        >
                          <span>
                            <span className="text-yellow-400">#{p.no}</span>{" "}
                            {p.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {p.race}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-gray-300 mb-3 flex items-center gap-2">
                      <span className="text-yellow-400">
                        Tarnished được chọn:
                      </span>
                      <span className="font-bold text-white">
                        {selectedTarnished.name}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedTarnished(null);
                          setSubCombatResult(null);
                          _setSubCurrentRound(-1);
                        }}
                        className="text-xs text-gray-500 hover:text-white ml-auto"
                      >
                        ✕ Đổi
                      </button>
                    </div>
                    {(subIsAnimating || subCombatResult) &&
                    player1 &&
                    player2 ? (
                      <div className="mb-3">
                        <div className="text-xs text-gray-400 mb-2 text-center">
                          Trận phụ:{" "}
                          <span className="text-yellow-300">
                            {selectedTarnished.name}
                          </span>{" "}
                          vs{" "}
                          <span
                            className={
                              combatResult!.winner === "player1"
                                ? "text-blue-300"
                                : "text-red-300"
                            }
                          >
                            {mainWinner?.name}
                          </span>
                        </div>
                        {subCombatResult ? (
                          <>
                            {renderRounds(
                              subCombatResult.rounds,
                              null,
                              selectedTarnished.character,
                              mainWinner?.character,
                            )}
                            <div className="mt-3 text-center">
                              <div className="text-lg font-bold">
                                <span className="text-blue-400">
                                  {subCombatResult.player1Score}
                                </span>
                                <span className="text-gray-500 mx-2">:</span>
                                <span className="text-red-400">
                                  {subCombatResult.player2Score}
                                </span>
                              </div>
                              {subCombatResult.winner === "player1" ? (
                                <div className="mt-2 text-green-400 font-bold text-sm bg-green-900/30 border border-green-500/40 rounded-lg px-3 py-2">
                                  Tarnished thắng →{" "}
                                  <strong>
                                    {pendingLoser === "player1"
                                      ? player1?.name
                                      : player2?.name}
                                  </strong>{" "}
                                  được cứu!
                                </div>
                              ) : (
                                <div className="mt-2 text-red-400 font-bold text-sm bg-red-900/30 border border-red-500/40 rounded-lg px-3 py-2">
                                  Tarnished thua →{" "}
                                  <strong>
                                    {pendingLoser === "player1"
                                      ? player1?.name
                                      : player2?.name}
                                  </strong>{" "}
                                  vẫn bị loại.
                                </div>
                              )}
                              <button
                                onClick={() => setIsPendingRoundtable(false)}
                                className="mt-3 px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg border border-gray-600 transition-colors"
                              >
                                Xác nhận kết quả cuối
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-gray-400 text-sm py-4">
                            Đang chạy trận phụ...
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={runSubCombat}
                        disabled={subIsAnimating}
                        className="w-full px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all"
                      >
                        ⚔️ Chạy Trận Phụ
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* After-combat quirk effects */}
            {battleDone && afterCombatEntries.length > 0 && (
              <div className="mt-3 bg-gray-800/60 rounded-xl border border-purple-600/30 p-3 space-y-2">
                <div className="text-xs font-semibold text-purple-300 mb-2">Hiệu ứng sau combat (Quirks)</div>
                {afterCombatEntries.map((entry, idx) => {
                  const pname = entry.player === "player1" ? player1?.name : player2?.name;
                  const spinKey = entry.wheelKey ?? null;
                  const spunResult = spinKey ? afterCombatSpinResults[spinKey] : null;
                  const isP1 = entry.player === "player1";
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs border ${
                        isP1
                          ? "bg-blue-900/20 border-blue-600/30"
                          : "bg-red-900/20 border-red-600/30"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <span className={`font-bold mr-1 ${isP1 ? "text-blue-300" : "text-red-300"}`}>
                          [{pname}]
                        </span>
                        <span className="text-purple-200 font-semibold">{entry.quirkName}:</span>{" "}
                        <span className="text-gray-300">{entry.description}</span>
                        {spunResult && (
                          <div className={`mt-1 font-bold ${spunResult.isSuccess ? "text-green-400" : "text-gray-400"}`}>
                            → {spunResult.label}
                          </div>
                        )}
                      </div>
                      {/* Wheel spin button */}
                      {spinKey && !spunResult && (
                        <button
                          onClick={() => {
                            setPreCombatModal({
                              isOpen: true,
                              title: `${entry.quirkName} — ${pname}`,
                              description: entry.description,
                              items: entry.wheelItems ?? [],
                              side: entry.player,
                              effectKey: spinKey,
                              onResult: (result: { label: string; isSuccess: boolean }) => {
                                setAfterCombatSpinResults((prev) => ({
                                  ...prev,
                                  [spinKey]: result,
                                }));
                                // Apply conditional stat mods after spin
                                if (result.isSuccess && entry.statMods && entry.statMods.length > 0) {
                                  const bubbles: { player: "player1" | "player2"; text: string; isPositive: boolean }[] = [];
                                  for (const mod of entry.statMods) {
                                    bubbles.push({
                                      player: entry.player,
                                      text: `${mod.delta >= 0 ? "+" : ""}${mod.delta} ${mod.stat.toUpperCase()} (${entry.quirkName})`,
                                      isPositive: mod.delta >= 0,
                                    });
                                  }
                                  if (bubbles.length > 0) spawnStatBubbles(bubbles);
                                }
                              },
                            });
                          }}
                          className="shrink-0 px-2 py-1 bg-purple-700/60 hover:bg-purple-600/70 text-purple-200 rounded text-[10px] font-bold border border-purple-500/40 transition-colors"
                        >
                          Quay
                        </button>
                      )}
                      {spinKey && spunResult && (
                        <div className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded ${
                          spunResult.isSuccess ? "text-green-400 bg-green-900/30" : "text-gray-400 bg-gray-700/40"
                        }`}>
                          Done
                        </div>
                      )}
                      {!spinKey && entry.gmAction && (
                        <div className="shrink-0 text-[10px] text-amber-400 font-bold px-2 py-1 rounded bg-amber-900/20 border border-amber-500/30">
                          GM
                        </div>
                      )}
                      {!spinKey && !entry.gmAction && (
                        <div className="shrink-0 text-[10px] text-green-400 font-bold px-2 py-1 rounded bg-green-900/20 border border-green-500/30">
                          Auto
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-center gap-3 flex-wrap">
              {/* Not started */}
              {!stepState && !combatResult && player1 && player2 && (
                <div className="flex flex-col items-center gap-1">
                  {pendingPreCombatCount > 0 && (
                    <div className="text-[10px] text-amber-400 animate-pulse font-bold">
                      ● Xử lý {pendingPreCombatCount} wheel trước combat đã
                    </div>
                  )}
                  <button
                    onClick={startCombat}
                    disabled={pendingPreCombatCount > 0}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all"
                  >
                    ⚔ Bắt đầu
                  </button>
                </div>
              )}
              {/* Tournament: manual winner override (before battle) */}
              {isTournamentMode &&
                !stepState &&
                !combatResult &&
                player1 &&
                player2 && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        const winnerNo = player1.no;
                        onSaveTournamentResult?.({
                          winnerNo,
                          score: null,
                          specialEvent: tournamentSpecialEvent || null,
                          note: tournamentNote || null,
                        });
                      }}
                      className="px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg text-xs border border-blue-500/30 transition-colors"
                    >
                      {player1.name} Win
                    </button>
                    <button
                      onClick={() => {
                        const winnerNo = player2.no;
                        onSaveTournamentResult?.({
                          winnerNo,
                          score: null,
                          specialEvent: tournamentSpecialEvent || null,
                          note: tournamentNote || null,
                        });
                      }}
                      className="px-3 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded-lg text-xs border border-red-500/30 transition-colors"
                    >
                      {player2.name} Win
                    </button>
                  </div>
                )}
              {/* Step through rounds */}
              {stepInProgress && (
                <div className="flex flex-col items-center gap-1">
                  {pendingSpinsForLastRound && (
                    <div className="text-[10px] text-amber-400 animate-pulse font-bold">
                      ● Xử lý spin round trước đã
                    </div>
                  )}
                  <button
                    onClick={resolveNextRound}
                    disabled={pendingSpinsForLastRound}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all"
                  >
                    Round {stepRoundIndex + 1}/6 ▶ Next
                  </button>
                </div>
              )}
              {/* All rounds done — confirm result (after optional spins) */}
              {battleDone && !combatConfirmed && (
                <button
                  onClick={() => setCombatConfirmed(true)}
                  disabled={pendingSpins}
                  className={`px-6 py-2.5 font-bold rounded-xl text-sm transition-all shadow-lg ${
                    pendingSpins
                      ? "bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/40"
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-green-500/20 hover:shadow-green-500/40"
                  }`}
                  title={
                    pendingSpins
                      ? "Quay hết các hiệu ứng trước"
                      : "Xác nhận kết quả"
                  }
                >
                  {pendingSpins ? "⏳ Còn hiệu ứng chờ quay..." : "✓ Kết thúc"}
                </button>
              )}
              {/* Re-battle (only after confirmed) */}
              {combatConfirmed && (
                <button
                  onClick={resetCombat}
                  className="px-4 py-2 bg-gray-700/60 hover:bg-gray-600/60 text-gray-300 rounded-lg text-xs border border-gray-600/50 transition-colors"
                >
                  ↺ Re-battle
                </button>
              )}
            </div>

            {/* Tournament: Special Event / Note / Save */}
            {isTournamentMode && (
              <div className="mt-3 bg-gray-800/60 rounded-xl border border-yellow-600/30 p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">
                      Special Event
                    </label>
                    <input
                      type="text"
                      value={tournamentSpecialEvent}
                      onChange={(e) =>
                        setTournamentSpecialEvent(e.target.value)
                      }
                      placeholder="e.g. Instant Kill..."
                      className="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1.5 text-xs focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">
                      Note
                    </label>
                    <input
                      type="text"
                      value={tournamentNote}
                      onChange={(e) => setTournamentNote(e.target.value)}
                      placeholder="Additional notes..."
                      className="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1.5 text-xs focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                </div>
                {combatConfirmed && effectiveWinner && player1 && player2 && (
                  <button
                    onClick={() => {
                      const winner =
                        effectiveWinner === "player1" ? player1 : player2;
                      const score = tournamentSpecialEvent
                        ? null
                        : `${effectiveScores.s1}-${effectiveScores.s2}`;
                      onSaveTournamentResult?.({
                        winnerNo: winner.no,
                        score,
                        specialEvent: tournamentSpecialEvent || null,
                        note: tournamentNote || null,
                      });
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg text-sm transition-all"
                  >
                    💾 Lưu kết quả Match #{tournamentMatch!.matchNumber}
                  </button>
                )}
              </div>
            )}

            {/* Rules Info */}
            <div className="mt-4 bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">
                <strong className="text-purple-400">Rules:</strong> STR → SPD →
                DUR → IQ → BIQ → MA. Cao hơn thắng round. Bằng nhau = không
                điểm. Hòa 3-3: Race Tier thấp hơn thắng.
              </p>
            </div>
          </div>

          {/* Per-round spin modal */}
          <ProbabilityWheelModal
            isOpen={roundSpinModal.isOpen}
            onClose={() =>
              setRoundSpinModal((prev) => ({ ...prev, isOpen: false }))
            }
            title={roundSpinModal.title}
            description={`Round ${roundSpinModal.roundIndex + 1} — ${roundSpinModal.side === "player1" ? player1?.name : player2?.name}`}
            items={roundSpinModal.items}
            onResult={(item) => {
              const key = `${roundSpinModal.roundIndex}-${roundSpinModal.title}-${roundSpinModal.side}`;
              setRoundSpinResults((prev) => ({
                ...prev,
                [key]: { label: item.label, isSuccess: !!item.isSuccess },
              }));
              setRoundSpinModal((prev) => ({ ...prev, isOpen: false }));
            }}
          />

          {/* Pre-combat / after-combat wheel modal (Raumanian, One Trick Pony, Night Owl, Open-minded) */}
          <ProbabilityWheelModal
            isOpen={preCombatModal.isOpen}
            onClose={() =>
              setPreCombatModal((prev) => ({ ...prev, isOpen: false }))
            }
            title={preCombatModal.title}
            description={preCombatModal.description}
            items={preCombatModal.items}
            onResult={(item: WheelSpinItem) => {
              if (preCombatModal.onResult) {
                preCombatModal.onResult({ label: item.label, isSuccess: !!item.isSuccess });
              }
              setPreCombatModal((prev) => ({ ...prev, isOpen: false }));
            }}
          />

          {/* Creator's Cat modal */}
          {creatorsCatModal.isOpen && (() => {
            const pLabel = creatorsCatModal.playerLabel;
            const pName = pLabel === "player1" ? player1?.name : player2?.name;
            const pChar = pLabel === "player1" ? player1?.character : player2?.character;
            const setPlayer = pLabel === "player1" ? setPlayer1 : setPlayer2;
            const CREATORS_FAVOR_EFFECTS = [
              "Nhận +1 all stats",
              "Roll lại 3 chỉ số",
              "Tặng 1 Power chỉ định có trong vòng quay Power",
              "Tặng 1 Normal Gear chỉ định",
              "Tặng 1 Normal Weapon chỉ định và 100% dùng được",
              "Loại bỏ Archetype hiện tại, nhận 1 archetype random",
              "Tặng 2 random Power",
              "Nhận +2 vào 2 chỉ số chỉ định",
              "Tặng 1 Runeword",
            ];
            const ALL_STATS: { key: keyof CharacterStats; label: string }[] = [
              { key: "str", label: "STR" }, { key: "spd", label: "SPD" },
              { key: "dur", label: "DUR" }, { key: "iq", label: "IQ" },
              { key: "biq", label: "BIQ" }, { key: "ma", label: "MA" },
            ];
            const ALL_POWERS = ["Artist","Writer","Red Shift/LP1211-M","Shooting for Victory","Let's Pump Some Iron!","U=ma2","Healing Factor","Hunter's Rewards","Quirkful","Quirkless","Sybaurafarming","Gourmand","Lone Wolf","Swinging Maestro","The Coast is Clear!","AIDS","Angling and Scheming","Quas","Wex","Exort","Critical Strike","Evasion","Petrification","Magma Strike","EscAPADe","Spirit Link","The Sand of Time","Memory Alter","Frost Fingers","Ice Hammer","Storm Calling","Spear of Fire","Metamagic","Gaze of the Abyss","Memory Freeze","Railroad Realm 🍀","Mewing","Master of War","Armor Piercing","Borrowed Time","Bonk Bonk Bonk","Accelerating Sorcery","Homeguard","Guidance","Bash","Hunter's Mark","Gate to Heaven","Ice Liquefactors","Bloody Strike","Divine Smite","Fire Control","Thunder Orb","Water Breathing","Mind Control","Blood Manipulation","Sonic Scream","Drunken Boxing","Cursed","Divine Lightning","Fist Fighting","Enhanced Hearing","Rampage","Bloodlust","Rickrolling","Power Absorption","Hand Washing","67","Power Negation","Invulnerability","Overdrive","Age Manipulation","Enlarging","Shrinking","Garlic Breath","The Goat","Fancy Feet","Weapon Enhancing","Body Enhancing","Clear Mind","Force Field","Anti-Magic Barrier","Black Magic","The Great Storm","Continental Super Storm","Sacred Fire","Capybara","Tsunami Control","Rising tide","Seismic","Night Vision","Gotta go Fast","Fair Duel","Uno Reverse Card","Burning Hand","Tick-tock","Frost Armor","Lightning Enchant","Chaos Enchantment","Dream Manipulation","Powerful Strike","Fragrant","Voidwalking","Odin Blessing","Misty Step Ahead","Ballet Dancing","Luck Manipulation","Scrying","Baldening","Cold Breeze","Bucking Bronco","Detect Thoughts","Arcana Blast","Blood Frenzy","Analysis Sins","Cleaning Sins","Hydrate","Groundwork","Dominator","Ice Spike","Stat Absorption","Golden Vow","Acid Breath","Poison Breath","Zoltraak","Encroaching Shadow","No Stopping Me","Mystifying Murmur","Spell Flux"];
            const ALL_NORMAL_GEAR = ["Fishing Rod","Sổ tay","Văn tế","Silver Steed","Wooden Shield","Wizard Hat","Love Letter","Holy Symbol","Fingerthing","Healing Flasks","Leather Jacket","Baguette","Frying Pan","Spatula","Gold Pine Resin","Knight's Armor","Cursed Charm","Đai Trinh Tiết","Swift Boots","Kuro's Charm","Buckler","Soap","Magical Scroll","Ba hoa trắng","Xương sống lưỡi","Thuốc tráng dương","Ancient Protector","Cuộn khăn giấy","Academie Ring","Dark Lanthorn","Lover's Glover","Storage Room Key","Giấy Nợ Gia Truyền","Cursed Coin","Shot Glass","Empty Stein","Golden Coin","Kẹo","Ớt","Mì Tôm","Bò Khô","Radio","Đá","Beer","Wine","Kryptonite","Glock","Baron Buff","Leviathan's Mark","Darkin Blade","Stellaron Hunter's Member Card","Khung hình thờ","Trứng Rồng","Soul Sucker","Soul of the Lazy Spirit","Almighty Vampire's Blood","King Gnome's Banana","Human NPC's Axe","God of War's Entry Ticket","The First Dragon Scale"];
            const ALL_NORMAL_WEAPONS = ["Banana Peel","Broken Straight Sword","Ukulele","Uchigatana","Kunai","Drums","Magical Staff","Glass Bottle","Wooden Sword","Cursed Pennywort","Slingshot","B.F Sword","Long Bow","Hidden Blade","Summoning Scroll","Nunchuck","Grimoire","Whip","Halberd","Saxophone","Guitar","Flute","Bass","Long Sword","Caestus","War Axe","Wand","Morningstar","Blood Sword","Rapier","Claymore","Zweihänd'r","Astrologer's Staff","Backhand Blade","Clawmark Seal"];
            const ALL_RUNEWORDS = ["Razorsharp","Unbreakable","Pennyworthy","Double Claws","Extraordinary","Elven Night","Blackjack","Dead Touch","Affection","Highroller","The Twin","Redemption","Flawless","Death's Dance","Undying Rage","Cure","Adventurous","Resonance","Kinetics","Belligerence","Constitution","Sagacity","Momentum","Preservation","Bastion","Tenacity","Dialectics","Epiphany","Metaphysics","Luminescence","Prudence","Apotheosis"];
            const ALL_ARCHETYPES = (pChar?.archetypes || []);

            const applyEffect = (effect: string) => {
              if (effect === "Nhận +1 all stats") {
                setSummoningScrollResult((prev) => {
                  const existing = prev[pLabel];
                  const base = existing?.statDeltas || {};
                  const newDeltas = { ...base };
                  for (const k of _ALL_STAT_KEYS) newDeltas[k] = (newDeltas[k] || 0) + 1;
                  return { ...prev, [pLabel]: { statDeltas: newDeltas, startScoreDelta: existing?.startScoreDelta || 0, summonName: existing?.summonName || "Creator's Cat" } };
                });
                spawnStatBubbles([{ player: pLabel, text: "Creator's Favor: +1 All Stats", isPositive: true }]);
                setCreatorsCatModal((p) => ({ ...p, isOpen: false }));
              } else if (effect === "Roll lại 3 chỉ số") {
                setCreatorsCatModal((p) => ({ ...p, step: "choose_stats", selectedEffect: effect, chosenStats: [] }));
              } else if (effect === "Tặng 1 Power chỉ định có trong vòng quay Power") {
                setCreatorsCatModal((p) => ({ ...p, step: "choose_power", selectedEffect: effect }));
              } else if (effect === "Tặng 1 Normal Gear chỉ định") {
                setCreatorsCatModal((p) => ({ ...p, step: "choose_gear", selectedEffect: effect }));
              } else if (effect === "Tặng 1 Normal Weapon chỉ định và 100% dùng được") {
                setCreatorsCatModal((p) => ({ ...p, step: "choose_weapon", selectedEffect: effect }));
              } else if (effect === "Loại bỏ Archetype hiện tại, nhận 1 archetype random") {
                setCreatorsCatModal((p) => ({ ...p, step: "choose_archetypes", selectedEffect: effect, chosenArchetypesToRemove: [] }));
              } else if (effect === "Tặng 2 random Power") {
                // Mở wheel power 2 lần
                const spinPowerWheel = (remaining: number, accumulated: string[]) => {
                  setPreCombatModal({
                    isOpen: true,
                    title: `Creator's Favor: Power Wheel (${3 - remaining}/2)`,
                    description: `${pName} — Quay Power Wheel (lần ${3 - remaining}/2)`,
                    items: ALL_POWERS.map((p) => ({ label: p, weight: 1, isSuccess: true, color: "#a855f7" })),
                    side: pLabel,
                    effectKey: `creators-cat-power-${pLabel}-${remaining}`,
                    onResult: (result) => {
                      const newAccumulated = [...accumulated, result.label];
                      if (remaining - 1 > 0) {
                        spinPowerWheel(remaining - 1, newAccumulated);
                      } else {
                        // Apply cả 2 powers
                        setPlayer((prev) => {
                          if (!prev?.character) return prev;
                          return { ...prev, character: { ...prev.character, powers: [...(prev.character.powers || []), ...newAccumulated.map((n) => ({ name: n, isLost: false }))] } };
                        });
                        spawnStatBubbles(newAccumulated.map((n) => ({ player: pLabel, text: `Creator's Favor: +Power ${n}`, isPositive: true })));
                        setCreatorsCatModal((p) => ({ ...p, isOpen: false }));
                      }
                    },
                  });
                };
                spinPowerWheel(2, []);
                setCreatorsCatModal((p) => ({ ...p, isOpen: false }));
              } else if (effect === "Nhận +2 vào 2 chỉ số chỉ định") {
                setCreatorsCatModal((p) => ({ ...p, step: "choose_stats", selectedEffect: effect, chosenStats: [] }));
              } else if (effect === "Tặng 1 Runeword") {
                setCreatorsCatModal((p) => ({ ...p, step: "choose_runeword", selectedEffect: effect }));
              }
            };

            return (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 border border-pink-500/40 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-pink-400 text-xl">🐱</span>
                    <h2 className="text-white font-bold text-lg">Creator's Cat — {pName}</h2>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">Creator's Favor: Chọn 1 hiệu ứng cho <span className="text-pink-300 font-semibold">{pName}</span></p>

                  {creatorsCatModal.step === "choose_effect" && (
                    <div className="flex flex-col gap-2">
                      {CREATORS_FAVOR_EFFECTS.map((eff) => (
                        <button key={eff} onClick={() => applyEffect(eff)}
                          className="text-left px-4 py-2 bg-gray-800 hover:bg-pink-900/40 border border-gray-700 hover:border-pink-500/60 rounded-lg text-sm text-white transition-all">
                          {eff}
                        </button>
                      ))}
                    </div>
                  )}

                  {creatorsCatModal.step === "choose_stats" && (
                    <div>
                      <p className="text-gray-400 text-sm mb-3">
                        {creatorsCatModal.selectedEffect === "Roll lại 3 chỉ số" ? "Chọn 3 chỉ số để roll lại (theo race weights):" : "Chọn 2 chỉ số để nhận +2:"}
                      </p>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {ALL_STATS.map(({ key, label }) => {
                          const selected = creatorsCatModal.chosenStats.includes(key);
                          const maxCount = creatorsCatModal.selectedEffect === "Roll lại 3 chỉ số" ? 3 : 2;
                          // Skeleton: IQ cố định 1, không cho chọn khi Roll lại
                          const isSkeletonIQ = creatorsCatModal.selectedEffect === "Roll lại 3 chỉ số"
                            && key === "iq"
                            && (pChar?.race?.race || "").toLowerCase() === "skeleton";
                          return (
                            <button key={key} disabled={isSkeletonIQ} onClick={() => {
                              setCreatorsCatModal((p) => {
                                const already = p.chosenStats.includes(key);
                                if (already) return { ...p, chosenStats: p.chosenStats.filter((s) => s !== key) };
                                if (p.chosenStats.length >= maxCount) return p;
                                return { ...p, chosenStats: [...p.chosenStats, key] };
                              });
                            }}
                              className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${isSkeletonIQ ? "opacity-30 cursor-not-allowed bg-gray-700 text-gray-500 border border-gray-600" : selected ? "bg-pink-600 text-white border border-pink-400" : "bg-gray-800 text-gray-300 border border-gray-700 hover:border-pink-500/50"}`}>
                              {label}{isSkeletonIQ ? " (cố định)" : ""}
                            </button>
                          );
                        })}
                      </div>
                      {(() => {
                        const maxCount = creatorsCatModal.selectedEffect === "Roll lại 3 chỉ số" ? 3 : 2;
                        const ready = creatorsCatModal.chosenStats.length === maxCount;
                        return (
                          <button disabled={!ready} onClick={() => {
                            if (creatorsCatModal.selectedEffect === "Nhận +2 vào 2 chỉ số chỉ định") {
                              setSummoningScrollResult((prev) => {
                                const existing = prev[pLabel];
                                const base = existing?.statDeltas || {};
                                const newDeltas = { ...base };
                                for (const k of creatorsCatModal.chosenStats) newDeltas[k] = (newDeltas[k] || 0) + 2;
                                return { ...prev, [pLabel]: { statDeltas: newDeltas, startScoreDelta: existing?.startScoreDelta || 0, summonName: existing?.summonName || "Creator's Cat" } };
                              });
                              spawnStatBubbles(creatorsCatModal.chosenStats.map((k) => ({ player: pLabel, text: `Creator's Favor: +2 ${k.toUpperCase()}`, isPositive: true })));
                              setCreatorsCatModal((p) => ({ ...p, isOpen: false }));
                            } else {
                              // Roll lại 3 chỉ số — dùng rollQueue state machine
                              const raceName = getRaceForStatRoll(pChar as any);
                              setCreatorsCatModal((p) => ({
                                ...p,
                                isOpen: false,
                                rollQueue: [...p.chosenStats],
                                rollAccumulated: [],
                                rollRaceName: raceName,
                                rollTotal: p.chosenStats.length,
                              }));
                            }
                          }}
                            className="w-full px-4 py-2 bg-pink-700 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-all">
                            Xác nhận ({creatorsCatModal.chosenStats.length}/{maxCount})
                          </button>
                        );
                      })()}
                    </div>
                  )}

                  {creatorsCatModal.step === "choose_power" && (
                    <div>
                      <p className="text-gray-400 text-sm mb-3">Chọn Power từ danh sách:</p>
                      <div className="max-h-64 overflow-y-auto flex flex-col gap-1 mb-3">
                        {ALL_POWERS.map((p) => (
                          <button key={p} onClick={() => {
                            setPlayer((prev) => {
                              if (!prev?.character) return prev;
                              return { ...prev, character: { ...prev.character, powers: [...(prev.character.powers || []), { name: p, isLost: false }] } };
                            });
                            spawnStatBubbles([{ player: pLabel, text: `Creator's Favor: +Power ${p}`, isPositive: true }]);
                            setCreatorsCatModal((prev) => ({ ...prev, isOpen: false }));
                          }}
                            className="text-left px-3 py-1.5 bg-gray-800 hover:bg-purple-900/40 border border-gray-700 hover:border-purple-500/60 rounded text-xs text-white transition-all">
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {creatorsCatModal.step === "choose_gear" && (
                    <div>
                      <p className="text-gray-400 text-sm mb-3">Chọn Normal Gear:</p>
                      <div className="max-h-64 overflow-y-auto flex flex-col gap-1 mb-3">
                        {ALL_NORMAL_GEAR.map((g) => (
                          <button key={g} onClick={() => {
                            setPlayer((prev) => {
                              if (!prev?.character) return prev;
                              const updatedGear = { ...(prev.character as any).gear, normalGear: [...((prev.character as any).gear?.normalGear || []), { name: g, isLost: false }] };
                              return { ...prev, character: { ...prev.character, gear: updatedGear } as any };
                            });
                            spawnStatBubbles([{ player: pLabel, text: `Creator's Favor: +Gear ${g}`, isPositive: true }]);
                            setCreatorsCatModal((prev) => ({ ...prev, isOpen: false }));
                          }}
                            className="text-left px-3 py-1.5 bg-gray-800 hover:bg-green-900/40 border border-gray-700 hover:border-green-500/60 rounded text-xs text-white transition-all">
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {creatorsCatModal.step === "choose_weapon" && (
                    <div>
                      <p className="text-gray-400 text-sm mb-3">Chọn Normal Weapon (100% dùng được):</p>
                      <div className="max-h-64 overflow-y-auto flex flex-col gap-1 mb-3">
                        {ALL_NORMAL_WEAPONS.map((w) => (
                          <button key={w} onClick={() => {
                            setPlayer((prev) => {
                              if (!prev?.character) return prev;
                              const updatedWeapons = [...((prev.character as any).weapons || []), { name: w, type: "Normal", usable: true, isLost: false }];
                              return { ...prev, character: { ...prev.character, weapons: updatedWeapons } as any };
                            });
                            spawnStatBubbles([{ player: pLabel, text: `Creator's Favor: +Weapon ${w} (dùng được)`, isPositive: true }]);
                            setCreatorsCatModal((prev) => ({ ...prev, isOpen: false }));
                          }}
                            className="text-left px-3 py-1.5 bg-gray-800 hover:bg-blue-900/40 border border-gray-700 hover:border-blue-500/60 rounded text-xs text-white transition-all">
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {creatorsCatModal.step === "choose_archetypes" && (
                    <div>
                      <p className="text-gray-400 text-sm mb-3">Chọn Archetype muốn loại bỏ:</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {ALL_ARCHETYPES.map((a: string) => {
                          const selected = creatorsCatModal.chosenArchetypesToRemove.includes(a);
                          return (
                            <button key={a} onClick={() => setCreatorsCatModal((p) => ({
                              ...p, chosenArchetypesToRemove: selected ? p.chosenArchetypesToRemove.filter((x) => x !== a) : [...p.chosenArchetypesToRemove, a]
                            }))}
                              className={`px-3 py-1 rounded text-xs font-medium transition-all ${selected ? "bg-red-700 text-white border border-red-400" : "bg-gray-800 text-gray-300 border border-gray-700 hover:border-red-500/50"}`}>
                              {a}
                            </button>
                          );
                        })}
                      </div>
                      <button onClick={() => {
                        // Loại bỏ archetypes đã chọn, sau đó mở archetype wheel
                        const toRemove = new Set(creatorsCatModal.chosenArchetypesToRemove);
                        setPlayer((prev) => {
                          if (!prev?.character) return prev;
                          return { ...prev, character: { ...prev.character, archetypes: (prev.character.archetypes || []).filter((a) => !toRemove.has(a)) } };
                        });
                        // Mở archetype wheel
                        const ALL_ARCHETYPES_WHEEL = ["Promised Consort","Cinderheart","Stargazer","Superhero","NPC 💀","Slayer","Gigachad","Egoist","Masochist","Femboy","Người Trong Ban Nhạc","Hero Grave Keeper","Dual Wielder","Bookworm","Gambler","Pacifist","Anti-Social","Follower of the Two Fingers","Devotee","Atheist","X","Glass Cannon","Mid","Time Traveller","Zealot","Hand Fighter","Loyal","Conquerer","Trickster","Paladin","Summoner","Him","Wibu","Perfectionist","Edgelord","Hero of the Emirate🍀","Fisher","Farmer","Chokevy","Blacksmith","Sentinel of Purity","Infirmarian","Gambler Bloodline","Power Ranger","Philosopher","Herald","Invoker","Bravest of the Brave"];
                        setPreCombatModal({
                          isOpen: true,
                          title: "Creator's Favor: Archetype Wheel",
                          description: `${pName} — Quay để nhận 1 Archetype mới`,
                          items: ALL_ARCHETYPES_WHEEL.map((a) => ({ label: a, weight: 1, isSuccess: true, color: "#f59e0b" })),
                          side: pLabel,
                          effectKey: `creators-cat-archetype-${pLabel}`,
                          onResult: (result) => {
                            setPlayer((prev) => {
                              if (!prev?.character) return prev;
                              return { ...prev, character: { ...prev.character, archetypes: [...(prev.character.archetypes || []), result.label] } };
                            });
                            spawnStatBubbles([{ player: pLabel, text: `Creator's Favor: +Archetype ${result.label}`, isPositive: true }]);
                          },
                        });
                        setCreatorsCatModal((p) => ({ ...p, isOpen: false }));
                      }}
                        className="w-full px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-sm font-bold transition-all">
                        Loại bỏ đã chọn & Quay Archetype Wheel
                      </button>
                    </div>
                  )}

                  {creatorsCatModal.step === "choose_runeword" && (
                    <div>
                      <p className="text-gray-400 text-sm mb-3">Chọn Runeword mới (runeword cũ sẽ bị xóa):</p>
                      <div className="max-h-64 overflow-y-auto flex flex-col gap-1 mb-3">
                        {ALL_RUNEWORDS.map((r) => (
                          <button key={r} onClick={() => {
                            setPlayer((prev) => {
                              if (!prev?.character) return prev;
                              // Xóa runeword cũ, thêm runeword mới (simplified — just set runeword name)
                              const updatedRunes = { ...((prev.character as any).runes || {}), runeword: r };
                              return { ...prev, character: { ...prev.character, runes: updatedRunes } as any };
                            });
                            spawnStatBubbles([{ player: pLabel, text: `Creator's Favor: Runeword → ${r}`, isPositive: true }]);
                            setCreatorsCatModal((prev) => ({ ...prev, isOpen: false }));
                          }}
                            className="text-left px-3 py-1.5 bg-gray-800 hover:bg-yellow-900/40 border border-gray-700 hover:border-yellow-500/60 rounded text-xs text-white transition-all">
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={() => setCreatorsCatModal((p) => ({ ...p, isOpen: false }))}
                    className="mt-4 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs transition-all">
                    Đóng
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ── RIGHT SIDEBAR: Player 2 ── */}
          {(() => {
            const p2Items = player2?.character
              ? buildInventoryList(player2.character)
              : [];
            const _p1AudioTracks = detectCombatAudioTracks(player1?.character);
            const _p2AudioTracks = detectCombatAudioTracks(player2?.character);
            const p2Quirks = (player2?.character?.quirks || []).filter((q: any) => !q.isLost).map((q: any) => (typeof q === "string" ? q : q.name).toLowerCase());
            const p2Silenced = p2Quirks.includes("mute") || p2Quirks.includes("deaf");
            const p2Blurred = p2Quirks.includes("blind");
            return (
              <div className={`w-[360px] shrink-0 flex flex-col bg-gray-900/90 rounded-2xl border border-red-500/30 max-h-[85vh] ${false && p2Blurred ? "blur-sm pointer-events-none select-none" : ""}`}>
                {/* Avatar lớn P2 */}
                {player2 && (
                  <SidebarAvatarBanner
                    key={`${player2.no}-${audioResetKey}`}
                    player={player2}
                    accent="red"
                    audioTracks={_p2AudioTracks}
                    otherSideHasAudio={_p1AudioTracks.length > 0}
                    audioStopped={!!combatResult}
                    silenced={p2Silenced}
                    blurred={p2Blurred}
                  />
                )}
                <div className="p-3 border-b border-red-500/20 shrink-0 space-y-2">
                  <div className="relative">
                    {player2 ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-red-600/40 rounded-lg">
                        <span className="text-red-400 text-xs font-mono">
                          #{player2.no}
                        </span>
                        <span className="text-white text-sm font-bold flex-1 truncate">
                          {player2.name}
                        </span>
                        {!isTournamentMode && (
                          <button
                            onClick={() => {
                              setPlayer2(null);
                              setSearchTerm2("");
                              resetCombat();
                            }}
                            className="text-gray-500 hover:text-white text-xs shrink-0"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="Tìm Player 2..."
                          value={searchTerm2}
                          onFocus={() => setFocus2(true)}
                          onBlur={() => setTimeout(() => setFocus2(false), 150)}
                          onChange={(e) => setSearchTerm2(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-red-600/40 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        {focus2 && filteredPlayers2.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                            {filteredPlayers2.map((p) => (
                              <button
                                key={p.no}
                                onMouseDown={() => {
                                  setPlayer2(p);
                                  setSearchTerm2(p.name);
                                  setFocus2(false);
                                  setRightTab("effects");
                                  resetCombat();
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-gray-700 text-white text-sm flex justify-between items-center gap-2"
                              >
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-red-400 font-mono text-xs shrink-0">
                                    #{p.no}
                                  </span>
                                  <span className="truncate">{p.name}</span>
                                </span>
                                <span className="text-xs text-gray-400 shrink-0">
                                  {p.race}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {player2 && (
                    <div className="flex bg-gray-800/60 rounded-lg p-0.5 gap-0.5">
                      <button
                        onClick={() => setRightTab("effects")}
                        className={`flex-1 text-xs py-1 rounded-md font-medium transition-all ${rightTab === "effects" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"}`}
                      >
                        Hiệu ứng
                      </button>
                      <button
                        onClick={() => setRightTab("inventory")}
                        className={`flex-1 text-xs py-1 rounded-md font-medium transition-all ${rightTab === "inventory" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"}`}
                      >
                        Inventory{" "}
                        {p2Items.length > 0 && (
                          <span className="opacity-60">({p2Items.length})</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                <div className="overflow-y-auto flex-1 p-3">
                  {player2 ? (
                    rightTab === "effects" ? (
                      <StatModifiersTable
                        breakdown={player2.breakdown}
                        baseStats={player2.baseStats}
                      />
                    ) : (
                      <div className="space-y-0.5">
                        {p2Items.length === 0 ? (
                          <div className="text-gray-600 text-xs text-center py-8">
                            Không có item
                          </div>
                        ) : (
                          p2Items.map((item, i) => {
                            const k = `${player2.no}-${item.sourceType}-${item.name}`;
                            const disabled = disabledItems.has(k);
                            const colorClass =
                              (sourceTypeColors as Record<string, string>)[
                                item.sourceType
                              ] || "text-gray-400";
                            return (
                              <button
                                key={i}
                                onClick={() =>
                                  toggleItem(
                                    player2.no,
                                    item.sourceType,
                                    item.name,
                                  )
                                }
                                className={`w-full text-left text-[11px] px-2 py-1.5 rounded transition-all ${disabled ? "opacity-35 bg-gray-800/20" : "hover:bg-gray-700/40 bg-gray-800/10"}`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className={`${colorClass} ${disabled ? "line-through" : ""}`}>{item.name}</span>
                                  <span className="text-gray-700 text-[9px]">
                                    [{item.sourceType}]
                                  </span>
                                  {disabled && (
                                    <span className="text-red-500 text-[9px] ml-auto">
                                      OFF
                                    </span>
                                  )}
                                </div>
                                {item.description && !disabled && (
                                  <div className="text-gray-500 text-[10px] mt-0.5 leading-snug">{item.description}</div>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-gray-600 text-xs text-center py-8">
                      Chọn Player 2 để xem
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      {/* end relative content wrapper */}

      {/* Dev Mode: Panel */}
      {devMode && (
        <DevWheelPanel
          pos={devPanelPos}
          onPosChange={setDevPanelPos}
          overrides={devWeightOverrides}
          onOverrideChange={(effect, idx, val) =>
            setDevWeightOverrides(
              (prev: Record<string, Record<number, number>>) => ({
                ...prev,
                [effect]: { ...(prev[effect] || {}), [idx]: val },
              }),
            )
          }
          onReset={() => setDevWeightOverrides({})}
          defaultItems={{
            "Critical Strike": CRIT_ITEMS,
            Evasion: EVASION_ITEMS,
            Gambler: GAMBLER_ITEMS,
            Cruelty: CRUELTY_ITEMS,
            Blind: BLIND_ITEMS,
            Mute: MUTE_ITEMS,
          }}
          allPlayers={allPlayers}
          onLoadMatchup={(p1, p2) => {
            setPlayer1(p1);
            setSearchTerm1(p1.name);
            setPlayer2(p2);
            setSearchTerm2(p2.name);
            resetCombat();
          }}
        />
      )}

      {/* Floating stat bubbles — fixed overlay, float trên toàn màn hình */}
      <FloatingStatBubblesOverlay p1Bubbles={p1Bubbles} p2Bubbles={p2Bubbles} />
    </div>
  );
};

// Wheel of Truth - PvP with spinning wheel
const WheelOfTruthMode = ({ onBack }: BattleModeProps) => {
  const [allPlayers, setAllPlayers] = useState<PvPPlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm1, setSearchTerm1] = useState("");
  const [searchTerm2, setSearchTerm2] = useState("");
  const [player1, setPlayer1] = useState<PvPPlayerData | null>(null);
  const [player2, setPlayer2] = useState<PvPPlayerData | null>(null);

  // Battle state
  const [battleState, setBattleState] = useState<
    "idle" | "fighting" | "finished"
  >("idle");
  const [currentRound, setCurrentRound] = useState(0);
  const [roundResults, setRoundResults] = useState<
    Array<{
      stat: string;
      statLabel: string;
      p1Value: number;
      p2Value: number;
      winner: "player1" | "player2";
      wheelAngle: number;
    }>
  >([]);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [finalWinner, setFinalWinner] = useState<"player1" | "player2" | null>(
    null,
  );
  const [tieBreaker, setTieBreaker] = useState<"race" | null>(null);
  // Generic handler — WheelOfTruth mode không tính điểm per-effect
  const handleWheelResolved = (
    _playerLabel: "player1" | "player2",
    _sourceName: string,
    _item: WheelSpinItem,
  ) => {
    // no scoring integration in WheelOfTruth mode
  };

  // Load all players
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        ensureEffectsInitialized();
        const playerList: PvPPlayerData[] = [];
        const fetchPromises: Promise<void>[] = [];

        for (let i = 1; i <= 260; i++) {
          fetchPromises.push(
            fetch(getAssetPath(`/data/No${i}.txt`))
              .then(async (response) => {
                if (response.ok) {
                  const content = await response.text();
                  const char = CharacterParser.parseCharacterFile(content);
                  const effects = EffectResolver.calculateCharacterEffects(
                    char,
                    { isPvE: false },
                  );
                  const pvpStats: CharacterStats = {
                    str: effects.totalStats.strength,
                    spd: effects.totalStats.speed,
                    dur: effects.totalStats.durability,
                    iq: effects.totalStats.iq,
                    biq: effects.totalStats.biq,
                    ma: effects.totalStats.ma,
                  };
                  // Raw spin-wheel stats (before any effect modifiers) for display in breakdown table
                  const pvpBaseStats: CharacterStats = { ...char.stats };
                  const race = char.race?.race || "Human";
                  playerList.push({
                    no: char.no || i,
                    name: char.name || `Player ${i}`,
                    username: char.username || "",
                    race,
                    raceTier: RACE_TIERS[race] ?? 15,
                    stats: pvpStats,
                    baseStats: pvpBaseStats,
                    breakdown: EffectResolver.getCharacterEffectBreakdown(char),
                    character: char,
                  });
                }
              })
              .catch(() => {}),
          );
        }

        await Promise.all(fetchPromises);
        playerList.sort((a, b) => a.no - b.no);
        setAllPlayers(playerList);
      } catch (error) {
        console.error("Error loading players:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, []);

  const [focus1, setFocus1] = useState(false);
  const [focus2, setFocus2] = useState(false);

  // Filter players for search — show top 20 immediately on focus
  const filteredPlayers1 = useMemo(() => {
    if (!searchTerm1) return allPlayers.slice(0, 20);
    const term = searchTerm1.toLowerCase();
    return allPlayers
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.username.toLowerCase().includes(term) ||
          p.no.toString().includes(term),
      )
      .slice(0, 20);
  }, [allPlayers, searchTerm1]);

  const filteredPlayers2 = useMemo(() => {
    if (!searchTerm2) return allPlayers.slice(0, 20);
    const term = searchTerm2.toLowerCase();
    return allPlayers
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.username.toLowerCase().includes(term) ||
          p.no.toString().includes(term),
      )
      .slice(0, 20);
  }, [allPlayers, searchTerm2]);

  // Spin wheel for current round
  const spinWheel = useCallback(() => {
    if (!player1 || !player2 || isSpinning || currentRound >= 6) return;

    setIsSpinning(true);
    const statInfo = STAT_ORDER[currentRound];
    const p1Val = player1.stats[statInfo.key];
    const p2Val = player2.stats[statInfo.key];

    // Calculate win probability based on stats ratio
    // Player with higher stat gets x2 weight
    let p1Weight = p1Val;
    let p2Weight = p2Val;
    if (p1Val > p2Val) {
      p1Weight = p1Val * 2; // x2 for higher stat
    } else if (p2Val > p1Val) {
      p2Weight = p2Val * 2; // x2 for higher stat
    }
    // If equal, both have same weight (no x2)

    const total = p1Weight + p2Weight;
    const p1Chance = total > 0 ? (p1Weight / total) * 360 : 180; // degrees for player 1

    // Random spin result
    const spinRotations = 5 + Math.random() * 3; // 5-8 full rotations
    const finalAngle = Math.random() * 360; // Where it lands
    const totalRotation = spinRotations * 360 + finalAngle;

    setWheelRotation((prev) => prev + totalRotation);

    // Determine winner based on where wheel lands
    // 0 to p1Chance degrees = player1 wins, rest = player2 wins
    const winner: "player1" | "player2" =
      finalAngle < p1Chance ? "player1" : "player2";

    // After spin animation completes
    setTimeout(() => {
      setRoundResults((prev) => [
        ...prev,
        {
          stat: statInfo.key,
          statLabel: statInfo.label,
          p1Value: p1Val,
          p2Value: p2Val,
          winner,
          wheelAngle: finalAngle,
        },
      ]);

      if (winner === "player1") {
        setP1Score((prev) => prev + 1);
      } else {
        setP2Score((prev) => prev + 1);
      }

      setCurrentRound((prev) => prev + 1);
      setIsSpinning(false);
    }, 3000); // 3 second spin animation
  }, [player1, player2, isSpinning, currentRound]);

  // Check for battle end
  useEffect(() => {
    if (currentRound === 6 && battleState === "fighting") {
      // Determine final winner
      let winner: "player1" | "player2";
      let usedTieBreaker: "race" | null = null;

      if (p1Score > p2Score) {
        winner = "player1";
      } else if (p2Score > p1Score) {
        winner = "player2";
      } else {
        // Tie-breaker: Lower race tier wins
        usedTieBreaker = "race";
        winner =
          (player1?.raceTier || 99) < (player2?.raceTier || 99)
            ? "player1"
            : "player2";
      }

      setFinalWinner(winner);
      setTieBreaker(usedTieBreaker);
      setBattleState("finished");
    }
  }, [currentRound, battleState, p1Score, p2Score, player1, player2]);

  // Start battle
  const startBattle = () => {
    if (!player1 || !player2) return;
    setBattleState("fighting");
    setCurrentRound(0);
    setRoundResults([]);
    setP1Score(0);
    setP2Score(0);
    setFinalWinner(null);
    setTieBreaker(null);
    setWheelRotation(0);
  };

  // Reset battle
  const resetBattle = () => {
    setBattleState("idle");
    setCurrentRound(0);
    setRoundResults([]);
    setP1Score(0);
    setP2Score(0);
    setFinalWinner(null);
    setTieBreaker(null);
    setWheelRotation(0);
  };

  // Swap players
  const swapPlayers = () => {
    const temp = player1;
    setPlayer1(player2);
    setPlayer2(temp);
    const tempSearch = searchTerm1;
    setSearchTerm1(searchTerm2);
    setSearchTerm2(tempSearch);
    resetBattle();
  };

  // Get current stat info for wheel display
  const currentStatInfo = currentRound < 6 ? STAT_ORDER[currentRound] : null;
  const currentP1Val =
    currentStatInfo && player1 ? player1.stats[currentStatInfo.key] : 0;
  const currentP2Val =
    currentStatInfo && player2 ? player2.stats[currentStatInfo.key] : 0;

  // Calculate weighted values (x2 for higher stat)
  let currentP1Weight = currentP1Val;
  let currentP2Weight = currentP2Val;
  if (currentP1Val > currentP2Val) {
    currentP1Weight = currentP1Val * 2;
  } else if (currentP2Val > currentP1Val) {
    currentP2Weight = currentP2Val * 2;
  }
  const currentWeightTotal = currentP1Weight + currentP2Weight;
  const p1Percentage =
    currentWeightTotal > 0 ? (currentP1Weight / currentWeightTotal) * 100 : 50;

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${wheelBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="text-white text-2xl">Loading players...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-4 px-4"
      style={{
        backgroundImage: `url(${wheelBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="max-w-[1400px] mx-auto">
        <button
          onClick={onBack}
          className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2"
        >
          <span>←</span> Back
        </button>

        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 mb-4 text-center">
          Wheel of Truth
        </h1>

        {/* 3-column layout: left sidebar | center | right sidebar */}
        <div className="flex gap-3 items-start">
          {/* ── LEFT SIDEBAR: Player 1 effects ── */}
          <div className="w-[300px] shrink-0 flex flex-col bg-gray-900/90 rounded-2xl border border-blue-500/30 max-h-[85vh]">
            <div className="p-3 border-b border-blue-500/20 rounded-t-2xl shrink-0">
              <div className="relative">
                {player1 ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-blue-600/40 rounded-lg">
                    <span className="text-blue-400 text-xs font-mono">
                      #{player1.no}
                    </span>
                    <span className="text-white text-sm font-bold flex-1 truncate">
                      {player1.name}
                    </span>
                    <button
                      onClick={() => {
                        setPlayer1(null);
                        setSearchTerm1("");
                        resetBattle();
                      }}
                      className="text-gray-500 hover:text-white text-xs shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Tìm Player 1..."
                      value={searchTerm1}
                      onFocus={() => setFocus1(true)}
                      onBlur={() => setTimeout(() => setFocus1(false), 150)}
                      onChange={(e) => {
                        setSearchTerm1(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-blue-600/40 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {focus1 && filteredPlayers1.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                        {filteredPlayers1.map((p) => (
                          <button
                            key={p.no}
                            onMouseDown={() => {
                              setPlayer1(p);
                              setSearchTerm1(p.name);
                              setFocus1(false);
                              resetBattle();
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-700 text-white text-sm flex justify-between items-center"
                          >
                            <span>
                              <span className="text-blue-400">#{p.no}</span>{" "}
                              {p.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {p.race}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-3">
              {player1 ? (
                <StatModifiersTable
                  breakdown={player1.breakdown}
                  baseStats={player1.baseStats}
                />
              ) : (
                <div className="text-gray-600 text-xs text-center py-8">
                  Chọn Player 1 để xem hiệu ứng
                </div>
              )}
            </div>
          </div>

          {/* ── CENTER: Battle area ── */}
          <div className="flex-1 min-w-0">
            {/* Swap & Start Buttons */}
            {battleState === "idle" && (
              <div className="flex justify-center gap-3 mb-4">
                {player1 && player2 && (
                  <>
                    <button
                      onClick={swapPlayers}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium transition-all text-sm"
                    >
                      ⇄ Swap
                    </button>
                    <button
                      onClick={startBattle}
                      className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-xl text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
                    >
                      🎡 START WHEEL OF TRUTH 🎡
                    </button>
                  </>
                )}
                {(!player1 || !player2) && (
                  <div className="text-gray-500 text-sm py-2">
                    Chọn 2 player để bắt đầu
                  </div>
                )}
              </div>
            )}

            {/* Battle Arena */}
            {(battleState === "fighting" || battleState === "finished") &&
              player1 &&
              player2 && (
                <div className="bg-gray-900/95 backdrop-blur-sm border-2 border-yellow-500/50 rounded-xl p-5">
                  {/* Score Header */}
                  <div className="flex justify-between items-center mb-5">
                    <div className="text-center flex-1">
                      <div className="text-sm text-blue-400 truncate">
                        {player1.name}
                      </div>
                      <div className="text-4xl font-bold text-blue-400">
                        {p1Score}
                      </div>
                    </div>
                    <div className="text-xl text-gray-500 px-3 text-center">
                      <div>Round</div>
                      <div className="font-bold">
                        {Math.min(currentRound + 1, 6)} / 6
                      </div>
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-sm text-red-400 truncate">
                        {player2.name}
                      </div>
                      <div className="text-4xl font-bold text-red-400">
                        {p2Score}
                      </div>
                    </div>
                  </div>

                  {/* Wheel Section */}
                  {battleState === "fighting" && currentRound < 6 && (
                    <div className="flex flex-col items-center mb-5">
                      <div className="text-xl font-bold text-yellow-400 mb-3">
                        {currentStatInfo?.label} Round
                      </div>

                      <div className="flex justify-center items-center gap-6 mb-4">
                        <div className="text-center">
                          <div className="text-blue-400 text-xs">
                            {player1.name}
                          </div>
                          <div className="text-2xl font-bold text-blue-400">
                            {currentP1Val}
                            {currentP1Val > currentP2Val && (
                              <span className="text-yellow-400 text-sm ml-1">
                                ×2={currentP1Val * 2}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            ({p1Percentage.toFixed(1)}%)
                          </div>
                        </div>
                        <div className="text-gray-500">vs</div>
                        <div className="text-center">
                          <div className="text-red-400 text-xs">
                            {player2.name}
                          </div>
                          <div className="text-2xl font-bold text-red-400">
                            {currentP2Val}
                            {currentP2Val > currentP1Val && (
                              <span className="text-yellow-400 text-sm ml-1">
                                ×2={currentP2Val * 2}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            ({(100 - p1Percentage).toFixed(1)}%)
                          </div>
                        </div>
                      </div>

                      {/* Wheel */}
                      <div className="relative w-52 h-52 mb-4">
                        <div
                          className="absolute inset-0 rounded-full border-4 border-yellow-500 overflow-hidden transition-transform duration-[3000ms] ease-out"
                          style={{
                            transform: `rotate(${wheelRotation}deg)`,
                            background: `conic-gradient(from 0deg, #3b82f6 0deg ${p1Percentage * 3.6}deg, #ef4444 ${p1Percentage * 3.6}deg 360deg)`,
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-white font-bold text-lg drop-shadow-lg">
                              {isSpinning ? "🎡" : ""}
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-yellow-400 z-10" />
                      </div>

                      <button
                        onClick={spinWheel}
                        disabled={isSpinning}
                        className="px-7 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold text-lg transition-all transform hover:scale-105"
                      >
                        {isSpinning ? "Spinning..." : "🎡 SPIN"}
                      </button>
                    </div>
                  )}

                  {/* Round Results */}
                  <div className="space-y-2 mb-4">
                    {roundResults.map((result, index) => (
                      <div
                        key={index}
                        className={`grid gap-2 items-center p-2.5 rounded-lg ${
                          result.winner === "player1"
                            ? "bg-blue-900/30 border border-blue-500/50"
                            : "bg-red-900/30 border border-red-500/50"
                        }`}
                        style={{ gridTemplateColumns: "1fr 70px 1fr" }}
                      >
                        <div className="text-right">
                          <span
                            className={`text-lg font-bold ${result.winner === "player1" ? "text-blue-300" : "text-gray-500"}`}
                          >
                            {result.p1Value}
                          </span>
                          {result.winner === "player1" && (
                            <span className="text-green-400 ml-1 text-sm">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="text-center">
                          <span className="text-[11px] font-bold text-gray-400 tracking-wider">
                            {result.statLabel}
                          </span>
                        </div>
                        <div className="text-left">
                          {result.winner === "player2" && (
                            <span className="text-green-400 mr-1 text-sm">
                              ✓
                            </span>
                          )}
                          <span
                            className={`text-lg font-bold ${result.winner === "player2" ? "text-red-300" : "text-gray-500"}`}
                          >
                            {result.p2Value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Final Result */}
                  {battleState === "finished" && finalWinner && (
                    <div className="text-center">
                      {tieBreaker && (
                        <div className="text-yellow-400 text-sm mb-2">
                          Tie-breaker: Race Tier (
                          {finalWinner === "player1"
                            ? player1.race
                            : player2.race}{" "}
                          wins)
                        </div>
                      )}
                      <div
                        className={`text-3xl font-bold mb-3 ${finalWinner === "player1" ? "text-blue-400" : "text-red-400"}`}
                      >
                        🏆{" "}
                        {finalWinner === "player1"
                          ? player1.name
                          : player2.name}{" "}
                        WINS! 🏆
                      </div>
                      <button
                        onClick={resetBattle}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-all"
                      >
                        Fight Again
                      </button>
                    </div>
                  )}
                </div>
              )}

            {/* Combat Effects Panel */}
            {player1 && player2 && (
              <CombatEffectsPanel
                player1={{ name: player1.name, character: player1.character }}
                player2={{ name: player2.name, character: player2.character }}
                combatResult={
                  finalWinner
                    ? {
                        winner: finalWinner,
                        player1Score: p1Score,
                        player2Score: p2Score,
                        rounds: roundResults.map((r) => ({
                          stat: r.stat,
                          winner: r.winner,
                        })),
                      }
                    : undefined
                }
                preCombatOnly={battleState === "idle"}
                onWheelResolved={handleWheelResolved}
              />
            )}

            {/* Rules Info */}
            <div className="mt-4 bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">
                <strong className="text-yellow-400">Wheel of Truth:</strong>{" "}
                Spin the wheel for each stat round. Higher stat = larger wheel
                area = higher chance. First to 4 points wins. Tied 3-3: lower
                Race Tier wins.
              </p>
            </div>
          </div>

          {/* ── RIGHT SIDEBAR: Player 2 effects ── */}
          <div className="w-[300px] shrink-0 flex flex-col bg-gray-900/90 rounded-2xl border border-red-500/30 max-h-[85vh]">
            <div className="p-3 border-b border-red-500/20 rounded-t-2xl shrink-0">
              <div className="relative">
                {player2 ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-red-600/40 rounded-lg">
                    <span className="text-red-400 text-xs font-mono">
                      #{player2.no}
                    </span>
                    <span className="text-white text-sm font-bold flex-1 truncate">
                      {player2.name}
                    </span>
                    <button
                      onClick={() => {
                        setPlayer2(null);
                        setSearchTerm2("");
                        resetBattle();
                      }}
                      className="text-gray-500 hover:text-white text-xs shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Tìm Player 2..."
                      value={searchTerm2}
                      onFocus={() => setFocus2(true)}
                      onBlur={() => setTimeout(() => setFocus2(false), 150)}
                      onChange={(e) => {
                        setSearchTerm2(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-red-600/40 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    {focus2 && filteredPlayers2.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                        {filteredPlayers2.map((p) => (
                          <button
                            key={p.no}
                            onMouseDown={() => {
                              setPlayer2(p);
                              setSearchTerm2(p.name);
                              setFocus2(false);
                              resetBattle();
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-700 text-white text-sm flex justify-between items-center"
                          >
                            <span>
                              <span className="text-red-400">#{p.no}</span>{" "}
                              {p.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {p.race}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-3">
              {player2 ? (
                <StatModifiersTable
                  breakdown={player2.breakdown}
                  baseStats={player2.baseStats}
                />
              ) : (
                <div className="text-gray-600 text-xs text-center py-8">
                  Chọn Player 2 để xem hiệu ứng
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

// PvE Battle Page Component
const STAT_KEYS = ["str", "spd", "dur", "iq", "biq", "ma"] as const;
const STAT_LABELS: Record<string, string> = {
  str: "STR",
  spd: "SPD",
  dur: "DUR",
  iq: "IQ",
  biq: "BIQ",
  ma: "MA",
};

export const PvEBattlePage = ({ onBack, isWebView }: BattleModeProps) => {
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [teams, setTeams] = useState<TeamJson[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerData[]>([]);
  const [battleResults, setBattleResults] = useState<Map<number, BattleResult>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "with-boss" | "no-boss">(
    "with-boss",
  );
  const [battleView, setBattleView] = useState<BattleView | null>(null);
  const [battleSessionId, setBattleSessionId] = useState(0);
  const [devMode, setDevMode] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<BattleResult>({
    outcome: "win",
    rounds: { str: null, spd: null, dur: null, iq: null, biq: null, ma: null },
    tiebreak: null,
    notes: "",
  });

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load bosses
        const bossRes = await fetch(getAssetPath("/data/battles/bosses.json"));
        const bossData = await bossRes.json();
        setBosses(bossData.bosses || []);

        // Load teams
        const teamRes = await fetch(getAssetPath("/data/battles/teams.json"));
        const teamData = await teamRes.json();
        setTeams(teamData.teams || []);

        // Load battle results
        const battleRes = await fetch(
          getAssetPath("/data/battles/team-battles.json"),
        );
        const battleData = await battleRes.json();
        const resultsMap = new Map<number, BattleResult>();
        (battleData.battles || []).forEach(
          (b: { teamId: number; result: BattleResult | null }) => {
            if (b.result) resultsMap.set(b.teamId, b.result);
          },
        );
        setBattleResults(resultsMap);

        // Load all players from individual files (like TeamBattlePage)
        // Initialize effects for PvE stat calculation
        ensureEffectsInitialized();

        const playerList: PlayerData[] = [];
        const fetchPromises: Promise<void>[] = [];

        for (let i = 1; i <= 260; i++) {
          fetchPromises.push(
            fetch(getAssetPath(`/data/No${i}.txt`))
              .then(async (response) => {
                if (response.ok) {
                  const content = await response.text();
                  const char = CharacterParser.parseCharacterFile(content);

                  // Calculate stats with PvE context to apply PvE-only effects
                  const effects = EffectResolver.calculateCharacterEffects(
                    char,
                    { isPvE: true },
                  );
                  const pveStats: CharacterStats = {
                    str: effects.totalStats.strength,
                    spd: effects.totalStats.speed,
                    dur: effects.totalStats.durability,
                    iq: effects.totalStats.iq,
                    biq: effects.totalStats.biq,
                    ma: effects.totalStats.ma,
                  };

                  playerList.push({
                    no: char.no || i,
                    name: char.name || `Player ${i}`,
                    username: char.username || "",
                    stats: pveStats,
                    baseStats: {
                      str: effects.baseStats.strength,
                      spd: effects.baseStats.speed,
                      dur: effects.baseStats.durability,
                      iq: effects.baseStats.iq,
                      biq: effects.baseStats.biq,
                      ma: effects.baseStats.ma,
                    },
                    statModifiers: effects.statModifiers.map((m) => ({
                      stat: m.stat,
                      value: m.value,
                      isBase: m.isBase,
                      source: m.source,
                    })),
                    team: char.team,
                    quirks: char.quirks.map((q) => q.name),
                    race: char.race?.race,
                    subRace: char.race?.subRace,
                    archetypes: char.archetypes,
                    powers:
                      char.powers
                        ?.filter((p) => !p.isLost)
                        .map((p) => p.name) || [],
                    weapons:
                      char.weapons
                        ?.filter((w) => !w.isLost && w.usable !== false)
                        .map((w) => w.name) || [],
                    gear: [
                      ...(char.gear?.normalGear || [])
                        .filter((g) => !g.isLost)
                        .map((g) => g.name),
                      ...(char.gear?.legacyGear || [])
                        .filter((g) => !g.isLost)
                        .map((g) => g.name),
                    ],
                    effectBreakdown:
                      EffectResolver.getCharacterEffectBreakdown(char),
                  });
                }
              })
              .catch(() => {}),
          );
        }

        await Promise.all(fetchPromises);
        setAllPlayers(playerList);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Create boss lookup map (case-insensitive)
  const bossMap = useMemo(() => {
    const map = new Map<string, Boss>();
    bosses.forEach((boss) => map.set(boss.name.toLowerCase(), boss));
    return map;
  }, [bosses]);

  // Create player lookup by username
  const playerByUsername = useMemo(() => {
    const map = new Map<string, PlayerData>();
    allPlayers.forEach((p) => {
      if (p.username) map.set(p.username.toLowerCase(), p);
    });
    return map;
  }, [allPlayers]);

  // Build battle views (teams with their assigned bosses)
  const battles = useMemo(() => {
    return teams.map((team): BattleView => {
      const boss = team.boss
        ? bossMap.get(team.boss.toLowerCase()) || null
        : null;

      // Match members with player data
      const playerData: PlayerData[] = [];
      team.members.forEach((member) => {
        if (member.username === "__dummy__") {
          playerData.push({
            no: 9999,
            name: "Dummy",
            username: "__dummy__",
            stats: { str: 3, spd: 3, dur: 3, iq: 3, biq: 3, ma: 3 },
            baseStats: { str: 3, spd: 3, dur: 3, iq: 3, biq: 3, ma: 3 },
          });
          return;
        }
        const player = playerByUsername.get(member.username.toLowerCase());
        if (player) {
          playerData.push(player);
        }
      });

      return {
        teamId: team.id,
        boss,
        members: team.members,
        playerData,
        result: battleResults.get(team.id) || null,
      };
    });
  }, [teams, bossMap, playerByUsername, battleResults]);

  // Filter battles
  const filteredBattles = useMemo(() => {
    switch (filterType) {
      case "with-boss":
        return battles.filter((b) => b.boss !== null);
      case "no-boss":
        return battles.filter((b) => b.boss === null);
      default:
        return battles;
    }
  }, [battles, filterType]);

  // Summary
  const summary = useMemo(() => {
    const withBoss = battles.filter((b) => b.boss !== null).length;
    const noBoss = battles.filter((b) => b.boss === null).length;
    return { total: battles.length, withBoss, noBoss };
  }, [battles]);

  // Dev mode toggle (Ctrl+Shift+D)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setDevMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Open edit form for a team
  const openEditForm = useCallback(
    (teamId: number) => {
      const existing = battleResults.get(teamId);
      if (existing) {
        setEditForm({ ...existing, rounds: { ...existing.rounds } });
      } else {
        setEditForm({
          outcome: "win",
          rounds: {
            str: null,
            spd: null,
            dur: null,
            iq: null,
            biq: null,
            ma: null,
          },
          tiebreak: null,
          notes: "",
        });
      }
      setEditingTeamId(teamId);
    },
    [battleResults],
  );

  // Save battle result
  const saveResult = useCallback(async () => {
    if (editingTeamId === null) return;
    const newResults = new Map(battleResults);
    newResults.set(editingTeamId, { ...editForm });
    setBattleResults(newResults);
    setEditingTeamId(null);

    // Save to team-battles.json via Tauri FS
    try {
      const res = await fetch(getAssetPath("/data/battles/team-battles.json"));
      const data = await res.json();
      const battles = data.battles || [];
      const idx = battles.findIndex(
        (b: { teamId: number }) => b.teamId === editingTeamId,
      );
      if (idx >= 0) {
        battles[idx].result = { ...editForm };
      }
      data.battles = battles;

      const { isTauri } = await import("../utils/tauriStorage");
      if (isTauri()) {
        const { writeTextFile } = await import("@tauri-apps/plugin-fs");
        const { resolveResource } = await import("@tauri-apps/api/path");
        const path = await resolveResource("data/battles/team-battles.json");
        await writeTextFile(path, JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error("Failed to save result:", err);
    }
  }, [editingTeamId, editForm, battleResults]);

  // Count races in entire season (for Sigrun boss effect)
  const seasonRaceCounts = useMemo(() => {
    let angel = 0;
    let god = 0;
    allPlayers.forEach((p) => {
      const race = p.race?.toLowerCase() || "";
      if (race === "angel") angel++;
      if (race === "god") god++;
    });
    return { angel, god, total: angel + god };
  }, [allPlayers]);

  // Calculate total stats
  const getTotalStats = (stats: BossStats | CharacterStats) => {
    return (
      (stats.str || 0) +
      (stats.spd || 0) +
      (stats.dur || 0) +
      (stats.iq || 0) +
      (stats.biq || 0) +
      (stats.ma || 0)
    );
  };

  // Start battle - increment session ID to force fresh component state
  const startBattle = (battle: BattleView) => {
    if (!battle.boss) return;
    setBattleSessionId((prev) => prev + 1);
    setBattleView(battle);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${wheelBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-4 px-4"
      style={{
        backgroundImage: `url(${wheelBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className={`${!isWebView ? "" : "hidden"} px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2`}
          >
            <span>←</span> Back
          </button>

          <div className={`${!isWebView ? "" : "hidden"} flex gap-2`}>
            {devMode && (
              <span className="px-3 py-1 bg-yellow-600/80 rounded-full text-yellow-200 text-sm font-medium animate-pulse">
                DEV MODE
              </span>
            )}
            <span className="px-3 py-1 bg-purple-600/80 rounded-full text-white text-sm font-medium">
              Total: {summary.total}
            </span>
            <span className="px-3 py-1 bg-red-600/80 rounded-full text-white text-sm font-medium">
              Has Boss: {summary.withBoss}
            </span>
          </div>

          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className={`${!isWebView ? "" : "hidden"} px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500`}
          >
            <option value="all">All Teams ({summary.total})</option>
            <option value="with-boss">Has Boss ({summary.withBoss})</option>
            <option value="no-boss">No Boss ({summary.noBoss})</option>
          </select>
        </div>

        <div className={`${!isWebView ? "" : "hidden"} text-center mb-8`}>
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 mb-4">
            Lair Battle
          </h1>
          <p className="text-gray-300 text-lg">
            Select a team to challenge their assigned boss
          </p>
        </div>

        {/* Battle Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBattles.map((battle) => {
            const hasBoss = battle.boss !== null;
            const bossTotalStats = battle.boss
              ? getTotalStats(battle.boss.stats)
              : 0;
            const teamTotalStats = battle.playerData.reduce(
              (sum, p) => sum + getTotalStats(p.stats),
              0,
            );
            const result = battle.result;

            return (
              <div
                key={battle.teamId}
                className={`bg-gray-800/90 backdrop-blur-sm border-2 rounded-xl overflow-hidden transition-all hover:scale-[1.02] ${
                  result
                    ? result.outcome === "win"
                      ? "border-green-500/50"
                      : "border-red-500/50"
                    : hasBoss
                      ? "border-red-500/50"
                      : "border-gray-600"
                }`}
              >
                {/* Card Header */}
                <div
                  className={`px-4 py-3 ${
                    result
                      ? result.outcome === "win"
                        ? "bg-green-600/20"
                        : "bg-red-600/20"
                      : hasBoss
                        ? "bg-red-600/20"
                        : "bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-orange-400">
                        #{battle.teamId}
                      </span>
                      <span className="text-white font-medium">
                        Team {battle.teamId}
                      </span>
                      {result && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            result.outcome === "win"
                              ? "bg-green-500/30 text-green-300 border border-green-500/50"
                              : "bg-red-500/30 text-red-300 border border-red-500/50"
                          }`}
                        >
                          {result.outcome === "win" ? "WIN" : "LOSE"}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400 text-sm">
                      {battle.members.length} members
                    </span>
                  </div>
                  {hasBoss && (
                    <p className="text-sm text-gray-400 mt-1">
                      vs{" "}
                      <span className="text-red-400 font-medium">
                        {battle.boss!.name}
                      </span>
                    </p>
                  )}
                </div>

                {/* Card Content */}
                <div className="px-4 py-3">
                  {hasBoss && battle.boss ? (
                    <>
                      {/* Stats Comparison + Round Results */}
                      <div className="grid grid-cols-6 gap-1 text-center text-xs mb-3">
                        {STAT_KEYS.map((stat) => {
                          const roundResult = result?.rounds[stat];
                          return (
                            <div
                              key={stat}
                              className={`rounded p-1 ${
                                roundResult === "win"
                                  ? "bg-green-900/50 border border-green-500/30"
                                  : roundResult === "lose"
                                    ? "bg-red-900/50 border border-red-500/30"
                                    : roundResult === "tie"
                                      ? "bg-yellow-900/50 border border-yellow-500/30"
                                      : roundResult === "parry" ||
                                          roundResult === "other"
                                        ? "bg-gray-700/50 border border-yellow-500/30"
                                        : "bg-gray-700/50"
                              }`}
                            >
                              <div className="text-gray-400 text-[10px]">
                                {STAT_LABELS[stat]}
                              </div>
                              <div className="text-red-400 font-bold text-xs">
                                {battle.boss!.stats[stat] ?? "?"}
                              </div>
                              {roundResult && (
                                <div
                                  className={`text-[10px] font-bold mt-0.5 ${
                                    roundResult === "win"
                                      ? "text-green-400"
                                      : roundResult === "lose"
                                        ? "text-red-400"
                                        : "text-yellow-400"
                                  }`}
                                >
                                  {roundResult === "win"
                                    ? "W"
                                    : roundResult === "lose"
                                      ? "L"
                                      : roundResult === "parry"
                                        ? "P"
                                        : roundResult === "other"
                                          ? "O"
                                          : "T"}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Tiebreak */}
                      {result?.tiebreak && (
                        <div className="text-center text-xs mb-2">
                          <span className="text-gray-400">Tie-break: </span>
                          <span
                            className={`font-bold ${
                              result.tiebreak === "win"
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {result.tiebreak === "win" ? "Win" : "Lose"}
                          </span>
                        </div>
                      )}

                      {/* Total Stats */}
                      <div className="text-center text-sm mb-3">
                        <span className="text-red-400 font-bold">
                          {bossTotalStats}
                        </span>
                        <span className="text-gray-500 mx-2">vs</span>
                        <span className="text-green-400 font-bold">
                          {teamTotalStats}
                        </span>
                      </div>

                      {/* Result Notes */}
                      {result?.notes && (
                        <div className="text-xs text-gray-300 mb-3 bg-gray-700/30 rounded p-2 whitespace-pre-line">
                          {result.notes}
                        </div>
                      )}

                      {/* Reward/Punishment based on result */}
                      {result ? (
                        <div className="text-xs text-gray-400 mb-3 line-clamp-2">
                          <span
                            className={
                              result.outcome === "win"
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {result.outcome === "win"
                              ? "Reward:"
                              : "Punishment:"}
                          </span>{" "}
                          {result.outcome === "win"
                            ? battle.boss.reward
                            : battle.boss.punishment}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 mb-3 line-clamp-2">
                          <span className="text-green-400">Reward:</span>{" "}
                          {battle.boss.reward}
                        </div>
                      )}

                      {/* Battle Button */}
                      {battle.playerData.length > 0 && (
                        <button
                          disabled
                          onClick={() => startBattle(battle)}
                          className="w-full px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-500 text-white font-bold rounded-lg transition-all transform shadow-lg text-sm"
                        >
                          Battle done!
                        </button>
                      )}
                      {battle.playerData.length === 0 && (
                        <p className="text-center text-yellow-500 text-xs">
                          No player data found
                        </p>
                      )}

                      {/* Dev Mode: Edit Result Button */}
                      {devMode && (
                        <button
                          onClick={() => openEditForm(battle.teamId)}
                          className="w-full mt-2 px-4 py-2 bg-yellow-600/30 hover:bg-yellow-600/50 border border-yellow-500/50 text-yellow-300 font-medium rounded-lg transition-all text-sm"
                        >
                          {result ? "Edit Result" : "Add Result"}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-gray-500 italic py-4">
                      No boss assigned
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredBattles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl">No battles found</p>
          </div>
        )}
      </div>

      {/* Dev Mode: Edit Result Dialog */}
      {editingTeamId !== null && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[3000]">
          <div className="bg-gray-900 border border-yellow-500/50 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-yellow-400 mb-4">
              Edit Result - Team {editingTeamId}
            </h3>

            {/* Outcome */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-1">
                Outcome
              </label>
              <div className="flex gap-2">
                {(["win", "lose"] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() =>
                      setEditForm((prev) => ({ ...prev, outcome: o }))
                    }
                    className={`flex-1 px-3 py-2 rounded font-bold text-sm transition-all ${
                      editForm.outcome === o
                        ? o === "win"
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    {o === "win" ? "WIN" : "LOSE"}
                  </button>
                ))}
              </div>
            </div>

            {/* Round Results */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">Rounds</label>
              <div className="space-y-2">
                {STAT_KEYS.map((stat) => (
                  <div key={stat} className="flex items-center gap-2">
                    <span className="text-gray-300 text-sm w-10 font-medium">
                      {STAT_LABELS[stat]}
                    </span>
                    <div className="flex gap-1 flex-1">
                      {(
                        [
                          { val: "win" as const, label: "W", color: "green" },
                          { val: "lose" as const, label: "L", color: "red" },
                          { val: "tie" as const, label: "T", color: "yellow" },
                          { val: null, label: "-", color: "gray" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() =>
                            setEditForm((prev) => ({
                              ...prev,
                              rounds: { ...prev.rounds, [stat]: opt.val },
                            }))
                          }
                          className={`flex-1 px-2 py-1 rounded text-xs font-bold transition-all ${
                            editForm.rounds[stat] === opt.val
                              ? `bg-${opt.color}-600 text-white`
                              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                          }`}
                          style={
                            editForm.rounds[stat] === opt.val
                              ? {
                                  backgroundColor:
                                    opt.color === "green"
                                      ? "#16a34a"
                                      : opt.color === "red"
                                        ? "#dc2626"
                                        : opt.color === "yellow"
                                          ? "#ca8a04"
                                          : "#4b5563",
                                  color: "white",
                                }
                              : undefined
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tiebreak */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-1">
                Tie-break
              </label>
              <div className="flex gap-2">
                {(
                  [
                    { val: "win" as const, label: "Win" },
                    { val: "lose" as const, label: "Lose" },
                    { val: null, label: "None" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() =>
                      setEditForm((prev) => ({ ...prev, tiebreak: opt.val }))
                    }
                    className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                      editForm.tiebreak === opt.val
                        ? opt.val === "win"
                          ? "bg-green-600 text-white"
                          : opt.val === "lose"
                            ? "bg-red-600 text-white"
                            : "bg-gray-600 text-white"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-1">Notes</label>
              <textarea
                value={editForm.notes || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Ghi chú (người bị isekai, gear nhận, v.v.)"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-y"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setEditingTeamId(null)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveResult}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-bold text-sm transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Battle Room Modal - key forces fresh state on each open */}
      {battleView && battleView.boss && (
        <BossBattleRoom
          key={`battle-${battleView.teamId}-${battleSessionId}`}
          battle={battleView}
          onClose={() => setBattleView(null)}
          seasonRaceCounts={seasonRaceCounts}
        />
      )}
    </div>
  );
};
