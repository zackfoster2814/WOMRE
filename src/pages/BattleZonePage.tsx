import { useState, useEffect, useMemo, useCallback } from "react";
import { BattleType } from "../types";
import { CharacterStats } from "../types/character";
import { CharacterParser } from "../utils/characterParser";
import { EffectResolver } from "../effects/resolver";
import { initializeEffectData } from "../effects/data";
import wheelBgImage from "../assets/img/wheel-bg.png";
import { BossBattleRoom } from "../components/BossBattleRoom";

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
  statModifiers?: { stat: string; value: number; isBase: boolean; source: string }[];
  team?: number;
  quirks?: string[];
  race?: string;
  subRace?: string;
  archetypes?: string[];
  powers?: string[];
  weapons?: string[];
  gear?: string[];
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

interface BattleView {
  teamId: number;
  boss: Boss | null;
  members: TeamMemberJson[];
  playerData: PlayerData[];
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

const StatsComparisonMode = ({ onBack }: BattleModeProps) => {
  const [allPlayers, setAllPlayers] = useState<PvPPlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm1, setSearchTerm1] = useState("");
  const [searchTerm2, setSearchTerm2] = useState("");
  const [player1, setPlayer1] = useState<PvPPlayerData | null>(null);
  const [player2, setPlayer2] = useState<PvPPlayerData | null>(null);
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentRound, setCurrentRound] = useState(-1);

  // Load all players
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        ensureEffectsInitialized();
        const playerList: PvPPlayerData[] = [];
        const fetchPromises: Promise<void>[] = [];

        for (let i = 1; i <= 260; i++) {
          fetchPromises.push(
            fetch(`/data/No${i}.txt`)
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

                  const race = char.race?.race || "Human";
                  playerList.push({
                    no: char.no || i,
                    name: char.name || `Player ${i}`,
                    username: char.username || "",
                    race,
                    raceTier: RACE_TIERS[race] || 0,
                    stats: pvpStats,
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

  // Filter players for search
  const filteredPlayers1 = useMemo(() => {
    if (!searchTerm1) return [];
    const term = searchTerm1.toLowerCase();
    return allPlayers
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.username.toLowerCase().includes(term) ||
          p.no.toString().includes(term),
      )
      .slice(0, 10);
  }, [allPlayers, searchTerm1]);

  const filteredPlayers2 = useMemo(() => {
    if (!searchTerm2) return [];
    const term = searchTerm2.toLowerCase();
    return allPlayers
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.username.toLowerCase().includes(term) ||
          p.no.toString().includes(term),
      )
      .slice(0, 10);
  }, [allPlayers, searchTerm2]);

  // Run combat simulation
  const runCombat = () => {
    if (!player1 || !player2) return;

    setIsAnimating(true);
    setCurrentRound(-1);
    setCombatResult(null);

    const rounds: RoundResult[] = [];
    let p1Score = 0;
    let p2Score = 0;

    // Compare each stat in order
    for (const { key, label } of STAT_ORDER) {
      const p1Value = player1.stats[key];
      const p2Value = player2.stats[key];

      let winner: "player1" | "player2" | "tie";
      if (p1Value > p2Value) {
        winner = "player1";
        p1Score++;
      } else if (p2Value > p1Value) {
        winner = "player2";
        p2Score++;
      } else {
        winner = "tie";
        // No points for tie
      }

      rounds.push({
        stat: key,
        statLabel: label,
        player1Value: p1Value,
        player2Value: p2Value,
        winner,
      });
    }

    // Determine overall winner
    let overallWinner: "player1" | "player2";
    let tieBreaker: "race" | null = null;

    if (p1Score > p2Score) {
      overallWinner = "player1";
    } else if (p2Score > p1Score) {
      overallWinner = "player2";
    } else {
      // Tie-breaker: LOWER race tier wins (tier 1 = strongest, tier 22 = weakest)
      tieBreaker = "race";
      if (player1.raceTier < player2.raceTier) {
        overallWinner = "player1";
      } else {
        overallWinner = "player2";
      }
    }

    const result: CombatResult = {
      rounds,
      player1Score: p1Score,
      player2Score: p2Score,
      winner: overallWinner,
      tieBreaker,
    };

    // Animate rounds one by one
    let round = 0;
    const animateRound = () => {
      if (round < 6) {
        setCurrentRound(round);
        round++;
        setTimeout(animateRound, 500);
      } else {
        setCombatResult(result);
        setIsAnimating(false);
      }
    };

    setTimeout(animateRound, 300);
  };

  // Reset combat
  const resetCombat = () => {
    setCombatResult(null);
    setCurrentRound(-1);
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
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2"
        >
          <span>←</span> Back
        </button>

        <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 mb-8 text-center">
          PvP Stats Comparison
        </h1>

        {/* Player Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Player 1 Selection */}
          <div className="bg-gray-800/90 backdrop-blur-sm border-2 border-blue-500/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-blue-400 mb-4">Player 1</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, username, or No..."
                value={searchTerm1}
                onChange={(e) => {
                  setSearchTerm1(e.target.value);
                  if (player1) {
                    setPlayer1(null);
                    resetCombat();
                  }
                }}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {filteredPlayers1.length > 0 && !player1 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {filteredPlayers1.map((p) => (
                    <button
                      key={p.no}
                      onClick={() => {
                        setPlayer1(p);
                        setSearchTerm1(p.name);
                        resetCombat();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-700 text-white flex justify-between items-center"
                    >
                      <span>
                        <span className="text-blue-400">#{p.no}</span> {p.name}
                      </span>
                      <span className="text-sm text-gray-400">{p.race}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {player1 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-blue-400 font-bold">
                      #{player1.no}
                    </span>
                    <span className="text-white font-medium ml-2">
                      {player1.name}
                    </span>
                  </div>
                  <span className="px-2 py-1 bg-blue-600/30 rounded text-blue-300 text-sm">
                    {player1.race} (Tier {player1.raceTier})
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {STAT_ORDER.map(({ key, label }) => (
                    <div
                      key={key}
                      className="text-center bg-gray-700/50 rounded p-2"
                    >
                      <div className="text-gray-400 text-xs">{label}</div>
                      <div className="text-white font-bold">
                        {player1.stats[key]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* VS Badge & Swap Button */}
          <div
            className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center"
            style={{ top: "280px" }}
          >
            <button
              onClick={swapPlayers}
              disabled={!player1 || !player2 || isAnimating}
              className="bg-gray-900 border-2 border-purple-500 rounded-full p-3 text-purple-400 hover:bg-purple-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Swap players"
            >
              ⇄
            </button>
          </div>

          {/* Player 2 Selection */}
          <div className="bg-gray-800/90 backdrop-blur-sm border-2 border-red-500/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-400 mb-4">Player 2</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, username, or No..."
                value={searchTerm2}
                onChange={(e) => {
                  setSearchTerm2(e.target.value);
                  if (player2) {
                    setPlayer2(null);
                    resetCombat();
                  }
                }}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {filteredPlayers2.length > 0 && !player2 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {filteredPlayers2.map((p) => (
                    <button
                      key={p.no}
                      onClick={() => {
                        setPlayer2(p);
                        setSearchTerm2(p.name);
                        resetCombat();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-700 text-white flex justify-between items-center"
                    >
                      <span>
                        <span className="text-red-400">#{p.no}</span> {p.name}
                      </span>
                      <span className="text-sm text-gray-400">{p.race}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {player2 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-red-400 font-bold">
                      #{player2.no}
                    </span>
                    <span className="text-white font-medium ml-2">
                      {player2.name}
                    </span>
                  </div>
                  <span className="px-2 py-1 bg-red-600/30 rounded text-red-300 text-sm">
                    {player2.race} (Tier {player2.raceTier})
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {STAT_ORDER.map(({ key, label }) => (
                    <div
                      key={key}
                      className="text-center bg-gray-700/50 rounded p-2"
                    >
                      <div className="text-gray-400 text-xs">{label}</div>
                      <div className="text-white font-bold">
                        {player2.stats[key]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Swap Button */}
        <div className="flex md:hidden justify-center mb-4">
          <button
            onClick={swapPlayers}
            disabled={!player1 || !player2 || isAnimating}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all"
          >
            ⇄ Swap Players
          </button>
        </div>

        {/* Battle Button */}
        {player1 && player2 && !combatResult && (
          <div className="text-center mb-8">
            <button
              onClick={runCombat}
              disabled={isAnimating}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 rounded-xl text-white font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
            >
              {isAnimating ? "Fighting..." : "⚔️ START BATTLE ⚔️"}
            </button>
          </div>
        )}

        {/* Combat Arena */}
        {(isAnimating || combatResult) && player1 && player2 && (
          <div className="bg-gray-900/95 backdrop-blur-sm border-2 border-purple-500/50 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-center text-purple-400 mb-6">
              Combat Arena
            </h2>

            {/* Rounds */}
            <div className="space-y-3 mb-6">
              {STAT_ORDER.map(({ key, label }, index) => {
                const isRevealed = currentRound >= index || combatResult;
                const round = combatResult?.rounds[index];

                return (
                  <div
                    key={key}
                    className={`grid grid-cols-3 gap-4 items-center p-3 rounded-lg transition-all duration-300 ${
                      isRevealed
                        ? round?.winner === "player1"
                          ? "bg-blue-900/30 border border-blue-500/50"
                          : round?.winner === "player2"
                            ? "bg-red-900/30 border border-red-500/50"
                            : "bg-gray-800/50 border border-gray-600"
                        : "bg-gray-800/30 border border-gray-700"
                    }`}
                  >
                    {/* Player 1 Value */}
                    <div className="text-right">
                      <span
                        className={`text-2xl font-bold ${
                          isRevealed
                            ? round?.winner === "player1"
                              ? "text-green-400"
                              : round?.winner === "tie"
                                ? "text-yellow-400"
                                : "text-gray-400"
                            : "text-gray-600"
                        }`}
                      >
                        {isRevealed ? player1.stats[key] : "?"}
                      </span>
                    </div>

                    {/* Stat Label */}
                    <div className="text-center">
                      <span className="px-4 py-1 bg-purple-600/50 rounded-full text-white font-bold">
                        {label}
                      </span>
                      {isRevealed && (
                        <div className="text-xs mt-1">
                          {round?.winner === "player1" && (
                            <span className="text-blue-400">← WIN</span>
                          )}
                          {round?.winner === "player2" && (
                            <span className="text-red-400">WIN →</span>
                          )}
                          {round?.winner === "tie" && (
                            <span className="text-yellow-400">TIE</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Player 2 Value */}
                    <div className="text-left">
                      <span
                        className={`text-2xl font-bold ${
                          isRevealed
                            ? round?.winner === "player2"
                              ? "text-green-400"
                              : round?.winner === "tie"
                                ? "text-yellow-400"
                                : "text-gray-400"
                            : "text-gray-600"
                        }`}
                      >
                        {isRevealed ? player2.stats[key] : "?"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Final Result */}
            {combatResult && (
              <div className="text-center">
                <div className="flex justify-center items-center gap-8 mb-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-400">
                      {combatResult.player1Score}
                    </div>
                    <div className="text-sm text-gray-400">{player1.name}</div>
                  </div>
                  <div className="text-2xl text-gray-500">vs</div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-400">
                      {combatResult.player2Score}
                    </div>
                    <div className="text-sm text-gray-400">{player2.name}</div>
                  </div>
                </div>

                {combatResult.tieBreaker && (
                  <div className="text-yellow-400 text-sm mb-2">
                    Tie-breaker: Race Tier (
                    {combatResult.winner === "player1"
                      ? player1.race
                      : player2.race}{" "}
                    wins)
                  </div>
                )}

                <div
                  className={`text-3xl font-bold ${
                    combatResult.winner === "player1"
                      ? "text-blue-400"
                      : "text-red-400"
                  }`}
                >
                  🏆{" "}
                  {combatResult.winner === "player1"
                    ? player1.name
                    : player2.name}{" "}
                  WINS! 🏆
                </div>

                <button
                  onClick={resetCombat}
                  className="mt-6 px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-all"
                >
                  Fight Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Rules Info */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm">
            <strong className="text-purple-400">Rules:</strong> Compare 6 stats
            (STR → SPD → DUR → IQ → BIQ → MA). Higher stat wins the round. Equal
            stats = no points. If tied 3-3, lower Race Tier wins (God T1 &gt;
            Goblin T22).
          </p>
        </div>
      </div>
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
            fetch(`/data/No${i}.txt`)
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
                  const race = char.race?.race || "Human";
                  playerList.push({
                    no: char.no || i,
                    name: char.name || `Player ${i}`,
                    username: char.username || "",
                    race,
                    raceTier: RACE_TIERS[race] || 0,
                    stats: pvpStats,
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

  // Filter players for search
  const filteredPlayers1 = useMemo(() => {
    if (!searchTerm1) return [];
    const term = searchTerm1.toLowerCase();
    return allPlayers
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.username.toLowerCase().includes(term) ||
          p.no.toString().includes(term),
      )
      .slice(0, 10);
  }, [allPlayers, searchTerm1]);

  const filteredPlayers2 = useMemo(() => {
    if (!searchTerm2) return [];
    const term = searchTerm2.toLowerCase();
    return allPlayers
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.username.toLowerCase().includes(term) ||
          p.no.toString().includes(term),
      )
      .slice(0, 10);
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
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2"
        >
          <span>←</span> Back
        </button>

        <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 mb-8 text-center">
          Wheel of Truth
        </h1>

        {/* Player Selection (show when idle) */}
        {battleState === "idle" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Player 1 Selection */}
              <div className="bg-gray-800/90 backdrop-blur-sm border-2 border-blue-500/50 rounded-xl p-6">
                <h2 className="text-xl font-bold text-blue-400 mb-4">
                  Player 1
                </h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, username, or No..."
                    value={searchTerm1}
                    onChange={(e) => {
                      setSearchTerm1(e.target.value);
                      if (player1) setPlayer1(null);
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {filteredPlayers1.length > 0 && !player1 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {filteredPlayers1.map((p) => (
                        <button
                          key={p.no}
                          onClick={() => {
                            setPlayer1(p);
                            setSearchTerm1(p.name);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-700 text-white flex justify-between items-center"
                        >
                          <span>
                            <span className="text-blue-400">#{p.no}</span>{" "}
                            {p.name}
                          </span>
                          <span className="text-sm text-gray-400">
                            {p.race}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {player1 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-blue-400 font-bold">
                          #{player1.no}
                        </span>
                        <span className="text-white font-medium ml-2">
                          {player1.name}
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-blue-600/30 rounded text-blue-300 text-sm">
                        {player1.race}
                      </span>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {STAT_ORDER.map(({ key, label }) => (
                        <div
                          key={key}
                          className="text-center bg-gray-700/50 rounded p-2"
                        >
                          <div className="text-gray-400 text-xs">{label}</div>
                          <div className="text-white font-bold">
                            {player1.stats[key]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Player 2 Selection */}
              <div className="bg-gray-800/90 backdrop-blur-sm border-2 border-red-500/50 rounded-xl p-6">
                <h2 className="text-xl font-bold text-red-400 mb-4">
                  Player 2
                </h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, username, or No..."
                    value={searchTerm2}
                    onChange={(e) => {
                      setSearchTerm2(e.target.value);
                      if (player2) setPlayer2(null);
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  {filteredPlayers2.length > 0 && !player2 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {filteredPlayers2.map((p) => (
                        <button
                          key={p.no}
                          onClick={() => {
                            setPlayer2(p);
                            setSearchTerm2(p.name);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-700 text-white flex justify-between items-center"
                        >
                          <span>
                            <span className="text-red-400">#{p.no}</span>{" "}
                            {p.name}
                          </span>
                          <span className="text-sm text-gray-400">
                            {p.race}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {player2 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-red-400 font-bold">
                          #{player2.no}
                        </span>
                        <span className="text-white font-medium ml-2">
                          {player2.name}
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-red-600/30 rounded text-red-300 text-sm">
                        {player2.race}
                      </span>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {STAT_ORDER.map(({ key, label }) => (
                        <div
                          key={key}
                          className="text-center bg-gray-700/50 rounded p-2"
                        >
                          <div className="text-gray-400 text-xs">{label}</div>
                          <div className="text-white font-bold">
                            {player2.stats[key]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Swap & Start Buttons */}
            <div className="flex justify-center gap-4 mb-8">
              {player1 && player2 && (
                <>
                  <button
                    onClick={swapPlayers}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium transition-all"
                  >
                    ⇄ Swap
                  </button>
                  <button
                    onClick={startBattle}
                    className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-xl text-white font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
                  >
                    🎡 START WHEEL OF TRUTH 🎡
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* Battle Arena */}
        {(battleState === "fighting" || battleState === "finished") &&
          player1 &&
          player2 && (
            <div className="bg-gray-900/95 backdrop-blur-sm border-2 border-yellow-500/50 rounded-xl p-6">
              {/* Score Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="text-center flex-1">
                  <div className="text-sm text-blue-400">{player1.name}</div>
                  <div className="text-4xl font-bold text-blue-400">
                    {p1Score}
                  </div>
                </div>
                <div className="text-2xl text-gray-500 px-4">
                  Round {Math.min(currentRound + 1, 6)} / 6
                </div>
                <div className="text-center flex-1">
                  <div className="text-sm text-red-400">{player2.name}</div>
                  <div className="text-4xl font-bold text-red-400">
                    {p2Score}
                  </div>
                </div>
              </div>

              {/* Wheel Section */}
              {battleState === "fighting" && currentRound < 6 && (
                <div className="flex flex-col items-center mb-6">
                  {/* Current Stat */}
                  <div className="text-2xl font-bold text-yellow-400 mb-4">
                    {currentStatInfo?.label} Round
                  </div>

                  {/* Stat Values */}
                  <div className="flex justify-center items-center gap-8 mb-4">
                    <div className="text-center">
                      <div className="text-blue-400 text-sm">
                        {player1.name}
                      </div>
                      <div className="text-3xl font-bold text-blue-400">
                        {currentP1Val}
                        {currentP1Val > currentP2Val && (
                          <span className="text-yellow-400 text-lg ml-1">
                            ×2={currentP1Val * 2}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        ({p1Percentage.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="text-gray-500">vs</div>
                    <div className="text-center">
                      <div className="text-red-400 text-sm">{player2.name}</div>
                      <div className="text-3xl font-bold text-red-400">
                        {currentP2Val}
                        {currentP2Val > currentP1Val && (
                          <span className="text-yellow-400 text-lg ml-1">
                            ×2={currentP2Val * 2}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        ({(100 - p1Percentage).toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  {/* Wheel */}
                  <div className="relative w-64 h-64 mb-4">
                    {/* Wheel Background */}
                    <div
                      className="absolute inset-0 rounded-full border-4 border-yellow-500 overflow-hidden transition-transform duration-[3000ms] ease-out"
                      style={{
                        transform: `rotate(${wheelRotation}deg)`,
                        background: `conic-gradient(
                        from 0deg,
                        #3b82f6 0deg ${p1Percentage * 3.6}deg,
                        #ef4444 ${p1Percentage * 3.6}deg 360deg
                      )`,
                      }}
                    >
                      {/* Player labels on wheel */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white font-bold text-lg drop-shadow-lg">
                          {isSpinning ? "🎡" : ""}
                        </div>
                      </div>
                    </div>
                    {/* Pointer */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-yellow-400 z-10" />
                  </div>

                  {/* Spin Button */}
                  <button
                    onClick={spinWheel}
                    disabled={isSpinning}
                    className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold text-xl transition-all transform hover:scale-105"
                  >
                    {isSpinning ? "Spinning..." : "🎡 SPIN"}
                  </button>
                </div>
              )}

              {/* Round Results */}
              <div className="space-y-2 mb-6">
                {roundResults.map((result, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-3 gap-4 items-center p-3 rounded-lg ${
                      result.winner === "player1"
                        ? "bg-blue-900/30 border border-blue-500/50"
                        : "bg-red-900/30 border border-red-500/50"
                    }`}
                  >
                    <div className="text-right">
                      <span
                        className={`text-xl font-bold ${result.winner === "player1" ? "text-green-400" : "text-gray-400"}`}
                      >
                        {result.p1Value}
                      </span>
                      {result.winner === "player1" && (
                        <span className="text-green-400 ml-2">✓</span>
                      )}
                    </div>
                    <div className="text-center">
                      <span className="px-3 py-1 bg-yellow-600/50 rounded-full text-white font-bold">
                        {result.statLabel}
                      </span>
                    </div>
                    <div className="text-left">
                      {result.winner === "player2" && (
                        <span className="text-green-400 mr-2">✓</span>
                      )}
                      <span
                        className={`text-xl font-bold ${result.winner === "player2" ? "text-green-400" : "text-gray-400"}`}
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
                      {finalWinner === "player1" ? player1.race : player2.race}{" "}
                      wins)
                    </div>
                  )}
                  <div
                    className={`text-4xl font-bold mb-4 ${
                      finalWinner === "player1"
                        ? "text-blue-400"
                        : "text-red-400"
                    }`}
                  >
                    🏆 {finalWinner === "player1" ? player1.name : player2.name}{" "}
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

        {/* Rules Info */}
        <div className="mt-8 bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm">
            <strong className="text-yellow-400">Wheel of Truth:</strong> Spin
            the wheel for each stat round. Higher stat = larger wheel area =
            higher chance to win that round. First to 4 points wins. If tied
            3-3, lower Race Tier wins.
          </p>
        </div>
      </div>
    </div>
  );
};

// PvE Battle Page Component
const PvEBattlePage = ({ onBack }: BattleModeProps) => {
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [teams, setTeams] = useState<TeamJson[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "with-boss" | "no-boss">(
    "with-boss",
  );
  const [battleView, setBattleView] = useState<BattleView | null>(null);
  const [battleSessionId, setBattleSessionId] = useState(0);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load bosses
        const bossRes = await fetch("/data/battles/bosses.json");
        const bossData = await bossRes.json();
        setBosses(bossData.bosses || []);

        // Load teams
        const teamRes = await fetch("/data/battles/teams.json");
        const teamData = await teamRes.json();
        setTeams(teamData.teams || []);

        // Load all players from individual files (like TeamBattlePage)
        // Initialize effects for PvE stat calculation
        ensureEffectsInitialized();

        const playerList: PlayerData[] = [];
        const fetchPromises: Promise<void>[] = [];

        for (let i = 1; i <= 260; i++) {
          fetchPromises.push(
            fetch(`/data/No${i}.txt`)
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
                    statModifiers: effects.statModifiers.map(m => ({
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
                    powers: char.powers?.filter(p => !p.isLost).map(p => p.name) || [],
                    weapons: char.weapons?.filter(w => !w.isLost && w.usable !== false).map(w => w.name) || [],
                    gear: [
                      ...(char.gear?.normalGear || []).filter(g => !g.isLost).map(g => g.name),
                      ...(char.gear?.legacyGear || []).filter(g => !g.isLost).map(g => g.name),
                    ],
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
      };
    });
  }, [teams, bossMap, playerByUsername]);

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
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2"
          >
            <span>←</span> Back
          </button>

          <div className="flex gap-2">
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
            className="px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Teams ({summary.total})</option>
            <option value="with-boss">Has Boss ({summary.withBoss})</option>
            <option value="no-boss">No Boss ({summary.noBoss})</option>
          </select>
        </div>

        <div className="text-center mb-8">
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

            return (
              <div
                key={battle.teamId}
                className={`bg-gray-800/90 backdrop-blur-sm border-2 rounded-xl overflow-hidden transition-all hover:scale-[1.02] ${
                  hasBoss ? "border-red-500/50" : "border-gray-600"
                }`}
              >
                {/* Card Header */}
                <div
                  className={`px-4 py-3 ${
                    hasBoss ? "bg-red-600/20" : "bg-gray-700/50"
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
                      {/* Stats Comparison */}
                      <div className="grid grid-cols-6 gap-1 text-center text-xs mb-3">
                        {(
                          ["str", "spd", "dur", "iq", "biq", "ma"] as const
                        ).map((stat) => (
                          <div
                            key={stat}
                            className="bg-gray-700/50 rounded p-1"
                          >
                            <div className="text-gray-400 text-[10px]">
                              {stat.toUpperCase()}
                            </div>
                            <div className="text-red-400 font-bold text-xs">
                              {battle.boss!.stats[stat] ?? "?"}
                            </div>
                          </div>
                        ))}
                      </div>

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

                      {/* Reward Preview */}
                      <div className="text-xs text-gray-400 mb-3 line-clamp-2">
                        <span className="text-green-400">Reward:</span>{" "}
                        {battle.boss.reward}
                      </div>

                      {/* Battle Button */}
                      {battle.playerData.length > 0 && (
                        <button
                          onClick={() => startBattle(battle)}
                          className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg text-sm"
                        >
                          Enter Lair Battle
                        </button>
                      )}
                      {battle.playerData.length === 0 && (
                        <p className="text-center text-yellow-500 text-xs">
                          No player data found
                        </p>
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
