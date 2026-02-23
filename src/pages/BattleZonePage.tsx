import { useState, useEffect, useMemo, useCallback } from "react";
import { BattleType } from "../types";
import { Character, CharacterStats } from "../types/character";
import { CharacterParser } from "../utils/characterParser";
import {
  EffectResolver,
  type EffectSourceBreakdown,
} from "../effects/resolver";
import { initializeEffectData } from "../effects/data";
import { HandlerRegistry } from "../effects/handlers";
import wheelBgImage from "../assets/img/wheel-bg.png";
import { BossBattleRoom } from "../components/BossBattleRoom";
import { getAssetPath } from "../utils/basePath";
import { CombatEffectsPanel } from "../components/CombatEffectsPanel";
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

interface BattleModeProps {
  onBack: () => void;
  isWebView?: boolean;
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
  p1ValueUsed: number;
  p2ValueUsed: number;
  winner: "player1" | "player2" | "tie";
  p1Score: number;
  p2Score: number;
  events: RoundEvent[];
  pointChanges: PointChange[];
  carryOverToNext: CarryOverEffect[];
}

interface StepCombatState {
  p1Stats: CharacterStats;
  p2Stats: CharacterStats;
  p1Score: number;
  p2Score: number;
  p1CarryOver: CarryOverEffect[];
  p2CarryOver: CarryOverEffect[];
  resolvedRounds: RoundResult[];
  roundLogs: RoundLog[];
  // track per-combat one-time flags
  p1TenacityFired: boolean;
  p2TenacityFired: boolean;
  p1ConquerorFired: boolean;
  p2ConquerorFired: boolean;
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
    items.push({ sourceType, name, description: description || "" });
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

// ── PlayerCard for StatsComparison (matches tournament style) ─────────────────
interface SCPlayerCardProps {
  player: PvPPlayerData;
  side: "left" | "right";
  isWinner: boolean;
  showWinner: boolean;
  disabledItems: Set<string>;
  onToggleItem: (no: number, sourceType: string, name: string) => void;
}
const SCPlayerCard = ({
  player,
  side,
  isWinner,
  showWinner,
  disabledItems,
  onToggleItem,
}: SCPlayerCardProps) => {
  const barBg = side === "left" ? "bg-blue-500" : "bg-red-500";
  const borderGlow =
    showWinner && isWinner
      ? "border-green-400 shadow-lg shadow-green-500/30"
      : side === "left"
        ? "border-blue-600/40"
        : "border-red-600/40";
  const race = player.character?.race?.race || player.race;
  const subRace = player.character?.race?.subRace || "";
  const total = STAT_ORDER.reduce(
    (s, { key }) => s + (player.stats[key] || 0),
    0,
  );
  const [invOpen, setInvOpen] = useState(false);
  const items = player.character ? buildInventoryList(player.character) : [];

  return (
    <div
      className={`p-4 rounded-xl border-2 bg-gray-800/70 backdrop-blur transition-all ${borderGlow} ${side === "right" ? "text-right" : ""}`}
    >
      <div
        className={`flex items-center gap-2 mb-1 ${side === "right" ? "flex-row-reverse" : ""}`}
      >
        <span className="text-[11px] font-mono text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded">
          No.{player.no}
        </span>
        {showWinner && isWinner && (
          <span className="text-yellow-400 text-xs font-bold bg-yellow-500/15 px-2 py-0.5 rounded-full">
            WINNER
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold text-white truncate">{player.name}</h3>
      <p className="text-xs text-gray-500">{player.username}</p>
      <p
        className={`text-xs mt-1 ${side === "left" ? "text-blue-300/80" : "text-red-300/80"}`}
      >
        {race}
        {subRace ? ` / ${subRace}` : ""}
      </p>
      <div className="mt-3 space-y-1.5">
        {STAT_ORDER.map(({ key, label }) => (
          <div
            key={key}
            className={`flex items-center gap-2 text-sm ${side === "right" ? "flex-row-reverse" : ""}`}
          >
            <span className="text-gray-500 w-8 text-[11px] font-bold">
              {label}
            </span>
            <div className="flex-1 bg-gray-700/60 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${barBg} transition-all duration-500`}
                style={{ width: `${Math.min(player.stats[key] * 5, 100)}%` }}
              />
            </div>
            <span className="text-white font-mono w-7 text-center text-sm font-bold">
              {player.stats[key]}
            </span>
          </div>
        ))}
        <div
          className={`flex items-center gap-2 pt-1 border-t border-gray-700/50 ${side === "right" ? "flex-row-reverse" : ""}`}
        >
          <span className="text-gray-500 w-8 text-[10px] font-bold">TTL</span>
          <div className="flex-1" />
          <span
            className={`font-mono w-7 text-center text-sm font-bold ${side === "left" ? "text-blue-300" : "text-red-300"}`}
          >
            {total}
          </span>
        </div>
      </div>

      {/* Inventory Panel */}
      {items.length > 0 && (
        <div className="mt-3 border-t border-gray-700/50 pt-2">
          <button
            onClick={() => setInvOpen((v) => !v)}
            className={`w-full flex items-center justify-between text-[11px] text-gray-400 hover:text-white transition-colors ${side === "right" ? "flex-row-reverse" : ""}`}
          >
            <span>
              📋 Inventory{" "}
              <span className="text-gray-600">({items.length})</span>
            </span>
            <span className="text-gray-600">{invOpen ? "▲" : "▼"}</span>
          </button>
          {invOpen && (
            <div className="mt-1.5 space-y-0.5 max-h-52 overflow-y-auto pr-0.5">
              {items.map((item, i) => {
                const key = `${player.no}-${item.sourceType}-${item.name}`;
                const disabled = disabledItems.has(key);
                const colorClass =
                  (sourceTypeColors as Record<string, string>)[
                    item.sourceType
                  ] || "text-gray-400";
                return (
                  <button
                    key={i}
                    onClick={() =>
                      onToggleItem(player.no, item.sourceType, item.name)
                    }
                    title={item.description || item.name}
                    className={`w-full text-left text-[11px] px-2 py-1 rounded flex items-center gap-1.5 transition-all ${
                      disabled
                        ? "line-through opacity-35 bg-gray-800/20"
                        : "hover:bg-gray-700/40 bg-gray-800/10"
                    } ${side === "right" ? "flex-row-reverse" : ""}`}
                  >
                    <span className={colorClass}>{item.name}</span>
                    <span className="text-gray-700 text-[9px]">
                      [{item.sourceType}]
                    </span>
                    {disabled && (
                      <span className="text-red-500 text-[9px] ml-auto">
                        OFF
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatsComparisonMode = ({ onBack }: BattleModeProps) => {
  const [allPlayers, setAllPlayers] = useState<PvPPlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm1, setSearchTerm1] = useState("");
  const [searchTerm2, setSearchTerm2] = useState("");
  const [player1, setPlayer1] = useState<PvPPlayerData | null>(null);
  const [player2, setPlayer2] = useState<PvPPlayerData | null>(null);
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [, setIsAnimating] = useState(false);
  const [, setCurrentRound] = useState(-1);
  const [focus1, setFocus1] = useState(false);
  const [focus2, setFocus2] = useState(false);

  // Roundtable Hold pending state
  const [isPendingRoundtable, setIsPendingRoundtable] = useState(false);
  const [pendingLoser, setPendingLoser] = useState<
    "player1" | "player2" | null
  >(null);

  // Step-by-step combat state
  const [stepState, setStepState] = useState<StepCombatState | null>(null);
  const [stepRoundIndex, setStepRoundIndex] = useState(-1);

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
                  const pvpBaseStats: CharacterStats = {
                    str: effects.baseStats.strength,
                    spd: effects.baseStats.speed,
                    dur: effects.baseStats.durability,
                    iq: effects.baseStats.iq,
                    biq: effects.baseStats.biq,
                    ma: effects.baseStats.ma,
                  };
                  const breakdown =
                    EffectResolver.getCharacterEffectBreakdown(char);

                  const race = char.race?.race || "Human";
                  playerList.push({
                    no: char.no || i,
                    name: char.name || `Player ${i}`,
                    username: char.username || "",
                    race,
                    raceTier: RACE_TIERS[race] || 0,
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
          type: "stat_boost",
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
          type: "stat_boost",
        });
      }
    }

    // Determine winner
    let winner: "player1" | "player2" | "tie";
    if (p1Val > p2Val) winner = "player1";
    else if (p2Val > p1Val) winner = "player2";
    else winner = "tie";

    // Base point: winner gets +1
    let p1Points = winner === "player1" ? 1 : 0;
    let p2Points = winner === "player2" ? 1 : 0;

    // Base point change records
    if (winner === "player1")
      pointChanges.push({ player: "player1", delta: 1, reason: "thắng round" });
    else if (winner === "player2")
      pointChanges.push({ player: "player2", delta: 1, reason: "thắng round" });

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
      totalRounds: 6,
      roundResults: Object.fromEntries(
        state.resolvedRounds.map((r) => [
          r.stat,
          r.winner === (isSelf ? "player1" : "player2")
            ? "win"
            : r.winner === (isSelf ? "player2" : "player1")
              ? "lose"
              : "tie",
        ]),
      ),
    });

    // Compute effects (use pre-calculated combatEffects from EffectResolver)
    const newP1Stats = { ...state.p1Stats };
    const newP2Stats = { ...state.p2Stats };
    let newP1TenacityFired = state.p1TenacityFired;
    let newP2TenacityFired = state.p2TenacityFired;
    let newP1ConquerorFired = state.p1ConquerorFired;
    let newP2ConquerorFired = state.p2ConquerorFired;

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

      for (const ce of fx.combatEffects) {
        if (ce.isActive === false) continue;
        const sourceName = ce.source?.name || "?";
        const sourceType = ce.source?.type || "?";
        // Check disabled
        const disabledKey = `${player.no}-${sourceType}-${sourceName}`;
        if (disabledItems.has(disabledKey)) continue;

        const timing = ce.effect?.timing;
        const handlerName = ce.effect?.customHandler;

        // Only process round-level timings here
        if (
          !["on_round_win", "on_round_lose", "during_combat"].includes(
            timing || "",
          )
        )
          continue;
        if (timing === "on_round_win" && !isWinner) continue;
        if (timing === "on_round_lose" && !isLoser) continue;

        if (!handlerName) continue;
        const result = HandlerRegistry.executeCombat(handlerName, ctx);
        if (!result || result.skipDefault) continue;

        if (result.description) {
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
            const csKey = mod.stat as keyof CharacterStats;
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
              // Permanent buff this combat (Tenacity, Conqueror, etc.)
              if (playerSide === "player1")
                newP1Stats[csKey] = (newP1Stats[csKey] || 0) + mod.value;
              else newP2Stats[csKey] = (newP2Stats[csKey] || 0) + mod.value;
              events.push({
                player: playerSide,
                source: sourceName,
                description: `${mod.value >= 0 ? "+" : ""}${mod.value} ${csKey.toUpperCase()} (permanent)`,
                type: mod.value >= 0 ? "stat_boost" : "stat_debuff",
              });
            }
          }
        }

        // Opponent stat mods
        if (result.opponentStatMods) {
          for (const mod of result.opponentStatMods) {
            const csKey = mod.stat as keyof CharacterStats;
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
              if (oppSide === "player1")
                newP1Stats[csKey] = (newP1Stats[csKey] || 0) + mod.value;
              else newP2Stats[csKey] = (newP2Stats[csKey] || 0) + mod.value;
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

        // Tenacity one-shot tracking
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

    const newP1Score = state.p1Score + Math.max(0, p1Points);
    const newP2Score = state.p2Score + Math.max(0, p2Points);

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
    setCombatResult(null);
    setIsAnimating(false);
    setCurrentRound(-1);
    setIsPendingRoundtable(false);
    setPendingLoser(null);
    setSelectedTarnished(null);
    setSubCombatResult(null);
    _setSubCurrentRound(-1);
    setRoundSpinResults({});
    const init: StepCombatState = {
      p1Stats: { ...player1.stats },
      p2Stats: { ...player2.stats },
      p1Score: 0,
      p2Score: 0,
      p1CarryOver: [],
      p2CarryOver: [],
      resolvedRounds: [],
      roundLogs: [],
      p1TenacityFired: false,
      p2TenacityFired: false,
      p1ConquerorFired: false,
      p2ConquerorFired: false,
    };
    setStepState(init);
    setStepRoundIndex(0);
  };

  // Resolve next round (called on "Next Round" button)
  const resolveNextRound = () => {
    if (!stepState || !player1 || !player2 || stepRoundIndex >= 6) return;
    const { newState } = computeRoundStep(
      stepRoundIndex,
      stepState,
      player1,
      player2,
    );
    setStepState(newState);
    setCurrentRound(stepRoundIndex);
    const nextIdx = stepRoundIndex + 1;
    setStepRoundIndex(nextIdx);

    if (nextIdx === 6) {
      // Finalize
      const { p1Score, p2Score, resolvedRounds } = newState;
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
        winner: overallWinner,
        tieBreaker,
      };
      checkAndSetRoundtableHold(finalResult);
      setCombatResult(finalResult);
      // autoSave
      import("../utils/googleDrive").then(({ appendReportToDrive }) => {
        import("../config/googleDrive").then(({ REPORT_FILE_ID }) => {
          const now = new Date().toLocaleString("vi-VN");
          const sep = `\n${"─".repeat(60)}\nPVP SESSION: ${now}\n${"─".repeat(60)}\n`;
          const lines = [
            `${player1.name} vs ${player2.name}`,
            `Kết quả: ${overallWinner === "player1" ? player1.name : player2.name} WIN ${p1Score}-${p2Score}`,
            ...resolvedRounds.map(
              (r) =>
                `  ${r.statLabel}: ${r.winner === "player1" ? player1.name : r.winner === "player2" ? player2.name : "HÒA"} (${r.player1Value} vs ${r.player2Value})`,
            ),
          ];
          appendReportToDrive(
            REPORT_FILE_ID,
            sep + lines.join("\n") + "\n",
          ).catch(() => {});
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
    setStepState(null);
    setStepRoundIndex(-1);
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
  const getPerRoundEffects = (char: Character | undefined) => {
    if (!char) return { onWin: [] as string[], onLose: [] as string[] };
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
    if (sources.some((s) => s.includes("critical strike")))
      onWin.push("Critical Strike");
    if (sources.some((s) => s.includes("evasion"))) onLose.push("Evasion");
    if (sources.some((s) => s === "gambler")) onWin.push("Gambler");
    return { onWin, onLose };
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

  // Wheel items for each effect
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

  // Compute effective points for a side in a round, factoring in spin results
  const computeRoundPoints = (
    side: "player1" | "player2",
    winner: "player1" | "player2" | "tie",
    roundIdx: number,
    effects: { onWin: string[]; onLose: string[] },
  ): { pts: number; pending: boolean; color: string } => {
    const isWinner = winner === side;
    const isLoser = winner !== side && winner !== "tie";

    const hasGambler = effects.onWin.includes("Gambler");
    const hasCrit = effects.onWin.includes("Critical Strike");
    const hasEvasion = effects.onLose.includes("Evasion");

    const gamblerSpun = roundSpinResults[`${roundIdx}-Gambler-${side}`];
    const critSpun = roundSpinResults[`${roundIdx}-Critical Strike-${side}`];
    const evasionSpun = roundSpinResults[`${roundIdx}-Evasion-${side}`];

    if (isWinner) {
      // Gambler replaces base point
      if (hasGambler && !gamblerSpun)
        return { pts: 1, pending: true, color: "text-amber-400" };
      let base = hasGambler ? (gamblerSpun!.isSuccess ? 2 : 0) : 1;
      // Critical Strike adds +1 bonus
      if (hasCrit && !critSpun)
        return { pts: base, pending: true, color: "text-amber-400" };
      if (hasCrit && critSpun?.isSuccess) base += 1;
      const color =
        base === 0
          ? "text-gray-500"
          : base >= 2
            ? "text-amber-300"
            : "text-blue-400";
      return { pts: base, pending: false, color };
    }

    if (isLoser && hasEvasion) {
      if (!evasionSpun)
        return { pts: 0, pending: true, color: "text-emerald-400" };
      if (evasionSpun.isSuccess)
        return { pts: 1, pending: false, color: "text-emerald-300" };
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
    const p1Effects = getPerRoundEffects(p1char);
    const p2Effects = getPerRoundEffects(p2char);
    const showSpins = !!p1char || !!p2char;

    const makeSpinButton = (
      effectName: string,
      side: "player1" | "player2",
      roundIdx: number,
    ) => {
      const key2 = `${roundIdx}-${effectName}-${side}`;
      const result = roundSpinResults[key2];
      const items =
        effectName === "Critical Strike"
          ? CRIT_ITEMS
          : effectName === "Evasion"
            ? EVASION_ITEMS
            : GAMBLER_ITEMS;

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
              : "Gambler"}
        </button>
      );
    };

    return (
      <div className="bg-gray-800/40 rounded-xl p-3 space-y-1.5">
        {STAT_ORDER.map(({ key, label }, index) => {
          const round = rounds[index];
          const revealed = revealedUpTo !== null ? index <= revealedUpTo : true;
          const p1Win = revealed && round?.winner === "player1";
          const p2Win = revealed && round?.winner === "player2";
          const tie = revealed && round?.winner === "tie";

          // Which spin effects are relevant for this round
          const p1SpinEffects = p1Win
            ? p1Effects.onWin
            : revealed && !tie
              ? p1Effects.onLose
              : [];
          const p2SpinEffects = p2Win
            ? p2Effects.onWin
            : revealed && !tie
              ? p2Effects.onLose
              : [];

          // Effective points after spins (only if chars provided)
          const p1Pts =
            revealed && round && showSpins
              ? computeRoundPoints("player1", round.winner, index, p1Effects)
              : null;
          const p2Pts =
            revealed && round && showSpins
              ? computeRoundPoints("player2", round.winner, index, p2Effects)
              : null;

          // Show point badge: always on winner side; also on loser side if evasion pending/hit
          const showP1Pts =
            revealed &&
            round &&
            (p1Win || (p1Pts && (p1Pts.pts > 0 || p1Pts.pending) && !tie));
          const showP2Pts =
            revealed &&
            round &&
            (p2Win || (p2Pts && (p2Pts.pts > 0 || p2Pts.pending) && !tie));

          return (
            <div
              key={key}
              className={`transition-all duration-500 ${
                revealed
                  ? "opacity-100 translate-y-0"
                  : "opacity-15 translate-y-1"
              }`}
            >
              <div className="grid grid-cols-[1fr_70px_1fr] gap-2 items-center">
                {/* P1 value + pts */}
                <div
                  className={`text-right text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${
                    p1Win
                      ? "bg-blue-500/25 text-blue-300 ring-1 ring-blue-500/40"
                      : tie
                        ? "bg-yellow-500/15 text-yellow-400"
                        : revealed
                          ? "text-gray-500"
                          : "text-gray-600"
                  }`}
                >
                  {revealed ? (round?.player1Value ?? "?") : "?"}
                  {showP1Pts && p1Pts && (
                    <span
                      className={`ml-1.5 text-[10px] font-black ${p1Pts.color}`}
                    >
                      {p1Pts.pending ? `+${p1Pts.pts}?` : `+${p1Pts.pts}`}
                    </span>
                  )}
                </div>
                {/* Stat label */}
                <div className="text-center text-[11px] font-bold text-gray-400 tracking-wider">
                  {label}
                </div>
                {/* P2 value + pts */}
                <div
                  className={`text-left text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${
                    p2Win
                      ? "bg-red-500/25 text-red-300 ring-1 ring-red-500/40"
                      : tie
                        ? "bg-yellow-500/15 text-yellow-400"
                        : revealed
                          ? "text-gray-500"
                          : "text-gray-600"
                  }`}
                >
                  {showP2Pts && p2Pts && (
                    <span
                      className={`mr-1.5 text-[10px] font-black ${p2Pts.color}`}
                    >
                      {p2Pts.pending ? `+${p2Pts.pts}?` : `+${p2Pts.pts}`}
                    </span>
                  )}
                  {revealed ? (round?.player2Value ?? "?") : "?"}
                </div>
              </div>

              {/* Per-round spin buttons (only shown after round revealed, effects exist) */}
              {showSpins &&
                revealed &&
                (p1SpinEffects.length > 0 || p2SpinEffects.length > 0) && (
                  <div className="grid grid-cols-[1fr_70px_1fr] gap-2 mt-0.5">
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
  const mainWinner = combatResult
    ? combatResult.winner === "player1"
      ? player1
      : player2
    : null;
  const lastRoundLog =
    stepState && stepState.roundLogs.length > 0
      ? stepState.roundLogs[stepState.roundLogs.length - 1]
      : null;

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
              PvP Stats Comparison
            </h1>
          </div>
        </div>

        {/* 3-column layout: left sidebar | center | right sidebar */}
        <div className="max-w-[1400px] mx-auto flex gap-3 px-2 items-start">
          {/* ── LEFT SIDEBAR: Player 1 effects ── */}
          <div className="w-[320px] shrink-0 flex flex-col bg-gray-900/90 rounded-2xl border border-blue-500/30 max-h-[85vh]">
            {/* Header: search (always visible, not clipped) */}
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
                        resetCombat();
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
            </div>
            {/* Scrollable content */}
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
            {/* Player cards + VS/Score */}
            <div className="bg-gray-900/95 backdrop-blur-sm rounded-2xl border border-gray-600/50 p-4 mb-3">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
                {/* P1 card with 3D frame */}
                {player1 ? (
                  <PlayerCard3DFrame
                    side="left"
                    isWinner={
                      battleDone &&
                      !isPendingRoundtable &&
                      combatResult?.winner === "player1"
                    }
                  >
                    <SCPlayerCard
                      player={player1}
                      side="left"
                      isWinner={
                        battleDone &&
                        !isPendingRoundtable &&
                        combatResult?.winner === "player1"
                      }
                      showWinner={battleDone && !isPendingRoundtable}
                      disabledItems={disabledItems}
                      onToggleItem={toggleItem}
                    />
                  </PlayerCard3DFrame>
                ) : (
                  <div className="p-4 rounded-xl border-2 border-blue-600/20 bg-gray-800/30 flex items-center justify-center min-h-[120px]">
                    <span className="text-gray-600 text-sm">Chọn Player 1</span>
                  </div>
                )}

                {/* VS / Score with 3D backdrop */}
                <ScoreDisplay3D
                  winner={
                    battleDone && !isPendingRoundtable
                      ? (combatResult?.winner ?? null)
                      : null
                  }
                  p1Score={combatResult?.player1Score ?? 0}
                  p2Score={combatResult?.player2Score ?? 0}
                >
                  {/* HTML children giữ nguyên 100% */}
                  <div className="flex flex-col items-center justify-center pt-4 min-w-[80px]">
                    {battleDone ? (
                      <div className="text-center">
                        <div className="text-3xl font-black text-white tracking-wider">
                          <span className="text-blue-400">
                            {combatResult!.player1Score}
                          </span>
                          <span className="text-gray-600 mx-1">:</span>
                          <span className="text-red-400">
                            {combatResult!.player2Score}
                          </span>
                        </div>
                        {combatResult!.tieBreaker && (
                          <div className="text-[10px] text-yellow-400/80 mt-1 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                            Race Tier
                          </div>
                        )}
                        {!isPendingRoundtable && mainWinner && (
                          <div
                            className={`text-xs font-bold mt-2 px-3 py-1 rounded-lg ${
                              combatResult!.winner === "player1"
                                ? "text-blue-300 bg-blue-500/15"
                                : "text-red-300 bg-red-500/15"
                            }`}
                          >
                            {mainWinner.name} WINS
                          </div>
                        )}
                        {isPendingRoundtable && (
                          <div className="text-xs font-bold mt-2 px-3 py-1 rounded-lg text-yellow-300 bg-yellow-500/15">
                            PENDING
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-2xl font-black text-gray-500 tracking-widest">
                        VS
                      </div>
                    )}
                  </div>
                </ScoreDisplay3D>

                {/* P2 card with 3D frame */}
                {player2 ? (
                  <PlayerCard3DFrame
                    side="right"
                    isWinner={
                      battleDone &&
                      !isPendingRoundtable &&
                      combatResult?.winner === "player2"
                    }
                  >
                    <SCPlayerCard
                      player={player2}
                      side="right"
                      isWinner={
                        battleDone &&
                        !isPendingRoundtable &&
                        combatResult?.winner === "player2"
                      }
                      showWinner={battleDone && !isPendingRoundtable}
                      disabledItems={disabledItems}
                      onToggleItem={toggleItem}
                    />
                  </PlayerCard3DFrame>
                ) : (
                  <div className="p-4 rounded-xl border-2 border-red-600/20 bg-gray-800/30 flex items-center justify-center min-h-[120px]">
                    <span className="text-gray-600 text-sm">Chọn Player 2</span>
                  </div>
                )}
              </div>

              {/* Swap button */}
              {player1 && player2 && (
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={swapPlayers}
                    disabled={stepInProgress}
                    className="px-4 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
                  >
                    ⇄ Swap
                  </button>
                </div>
              )}
            </div>

            {/* Combat Effects Panel (before/during/after) */}
            {player1 && player2 && (
              <div className="mb-3">
                <CombatEffectsPanel
                  player1={{ name: player1.name, character: player1.character }}
                  player2={{ name: player2.name, character: player2.character }}
                  combatResult={
                    battleDone
                      ? {
                          winner: combatResult!.winner,
                          player1Score: combatResult!.player1Score,
                          player2Score: combatResult!.player2Score,
                          rounds: combatResult!.rounds.map((r) => ({
                            stat: r.stat,
                            winner: r.winner,
                          })),
                        }
                      : undefined
                  }
                />
              </div>
            )}

            {/* Round results / pre-battle stat comparison */}
            {player1 && player2 && (
              <div className="bg-gray-900/95 rounded-2xl border border-gray-600/50 p-4 mb-3">
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
                  /* Pre-battle: show stat values side by side */
                  <div className="bg-gray-800/40 rounded-xl p-3 space-y-1.5">
                    {STAT_ORDER.map(({ key, label }) => {
                      const v1 = player1.stats[key];
                      const v2 = player2.stats[key];
                      const p1Higher = v1 > v2;
                      const p2Higher = v2 > v1;
                      return (
                        <div
                          key={key}
                          className="grid grid-cols-[1fr_70px_1fr] gap-2 items-center"
                        >
                          <div
                            className={`text-right text-sm font-bold px-3 py-1.5 rounded-lg ${p1Higher ? "bg-blue-500/20 text-blue-300" : "text-gray-500"}`}
                          >
                            {v1}
                          </div>
                          <div className="text-center text-[11px] font-bold text-gray-400 tracking-wider">
                            {label}
                          </div>
                          <div
                            className={`text-left text-sm font-bold px-3 py-1.5 rounded-lg ${p2Higher ? "bg-red-500/20 text-red-300" : "text-gray-500"}`}
                          >
                            {v2}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Round Log Box — shows last resolved round events */}
                {lastRoundLog && (
                  <div className="mt-3 bg-gray-950/70 border border-gray-700/50 rounded-xl p-3 text-xs space-y-1">
                    <div className="font-bold text-gray-300 flex items-center gap-2">
                      <span className="text-purple-400">
                        Round {lastRoundLog.roundIndex + 1}
                      </span>
                      <span className="text-gray-500">—</span>
                      <span>{lastRoundLog.statLabel}:</span>
                      <span className="text-blue-300">
                        {lastRoundLog.p1ValueUsed}
                      </span>
                      <span className="text-gray-600">vs</span>
                      <span className="text-red-300">
                        {lastRoundLog.p2ValueUsed}
                      </span>
                      <span className="ml-auto">
                        {lastRoundLog.winner === "tie" ? (
                          <span className="text-yellow-400">HÒA</span>
                        ) : lastRoundLog.winner === "player1" ? (
                          <span className="text-blue-400">
                            {player1.name} WIN
                          </span>
                        ) : (
                          <span className="text-red-400">
                            {player2.name} WIN
                          </span>
                        )}
                      </span>
                    </div>
                    {lastRoundLog.events.map((ev, i) => (
                      <div
                        key={i}
                        className={`pl-2 border-l-2 ${
                          ev.type === "stat_boost"
                            ? "border-green-600/50 text-green-400"
                            : ev.type === "stat_debuff"
                              ? "border-red-600/50 text-red-400"
                              : ev.type === "carry_over"
                                ? "border-amber-600/50 text-amber-400"
                                : ev.type === "point_change"
                                  ? "border-blue-600/50 text-blue-300"
                                  : "border-gray-700/50 text-gray-400"
                        }`}
                      >
                        <span className="text-gray-500">
                          [
                          {ev.player === "player1"
                            ? player1.name
                            : player2.name}
                          ]
                        </span>{" "}
                        <span className="text-gray-400">{ev.source}:</span>{" "}
                        {ev.description}
                      </div>
                    ))}
                    {lastRoundLog.carryOverToNext.length > 0 && (
                      <div className="pl-2 text-amber-400/80 italic">
                        Carry → Round kế:{" "}
                        {lastRoundLog.carryOverToNext
                          .map(
                            (co) =>
                              `${co.source} +${co.value} ${co.stat.toUpperCase()}`,
                          )
                          .join(", ")}
                      </div>
                    )}
                    <div className="text-gray-500 border-t border-gray-700/40 pt-1 mt-1 flex justify-between">
                      <span>
                        Score:{" "}
                        <span className="text-blue-300">
                          {lastRoundLog.p1Score}
                        </span>{" "}
                        —{" "}
                        <span className="text-red-300">
                          {lastRoundLog.p2Score}
                        </span>
                      </span>
                      {stepInProgress && (
                        <span className="text-gray-600">
                          Round {stepRoundIndex + 1}/6 tiếp theo...
                        </span>
                      )}
                    </div>
                  </div>
                )}
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

            {/* Action buttons */}
            <div className="flex justify-center gap-3 flex-wrap">
              {/* Not started */}
              {!stepState && !combatResult && player1 && player2 && (
                <button
                  onClick={startCombat}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all"
                >
                  ⚔ Bắt đầu
                </button>
              )}
              {/* Step through rounds */}
              {stepInProgress && (
                <button
                  onClick={resolveNextRound}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all"
                >
                  Round {stepRoundIndex + 1}/6 ▶ Next
                </button>
              )}
              {/* Done */}
              {battleDone && (
                <button
                  onClick={resetCombat}
                  className="px-4 py-2 bg-gray-700/60 hover:bg-gray-600/60 text-gray-300 rounded-lg text-xs border border-gray-600/50 transition-colors"
                >
                  ↺ Re-battle
                </button>
              )}
            </div>

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

          {/* ── RIGHT SIDEBAR: Player 2 effects ── */}
          <div className="w-[320px] shrink-0 flex flex-col bg-gray-900/90 rounded-2xl border border-red-500/30 max-h-[85vh]">
            <div className="p-3 border-b border-red-500/20 rounded-t-2xl shrink-0">
              {/* Player 2 search */}
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
                        resetCombat();
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
                              resetCombat();
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
      {/* end relative content wrapper */}
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
                  const pvpBaseStats: CharacterStats = {
                    str: effects.baseStats.strength,
                    spd: effects.baseStats.speed,
                    dur: effects.baseStats.durability,
                    iq: effects.baseStats.iq,
                    biq: effects.baseStats.biq,
                    ma: effects.baseStats.ma,
                  };
                  const race = char.race?.race || "Human";
                  playerList.push({
                    no: char.no || i,
                    name: char.name || `Player ${i}`,
                    username: char.username || "",
                    race,
                    raceTier: RACE_TIERS[race] || 0,
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
