/**
 * SandboxBattleArena - Battle execution with Stats Comparison and Wheel of Truth modes
 */

import { useState, useCallback, useEffect } from "react";
import type { CharacterStats } from "../../types/character";

// ============================================================================
// REPORT GENERATION
// ============================================================================

interface ReportRound {
  statLabel: string;
  p1Value: number;
  p2Value: number;
  winner: "player1" | "player2" | "tie";
  /** Wheel of Truth: win probability of player1 (0-100) */
  p1Chance?: number;
}

function generateReportText(
  mode: "Stats Comparison" | "Wheel of Truth",
  player1: SandboxPlayerData,
  player2: SandboxPlayerData,
  rounds: ReportRound[],
  p1Score: number,
  p2Score: number,
  winner: "player1" | "player2",
  tieBreaker?: "race" | null,
): string {
  const now = new Date();
  const timestamp = now.toLocaleString("vi-VN");
  const line = "═".repeat(60);
  const winnerName = winner === "player1" ? player1.name : player2.name;
  const loserName = winner === "player1" ? player2.name : player1.name;
  const winScore = Math.max(p1Score, p2Score);
  const loseScore = Math.min(p1Score, p2Score);

  const STAT_ABBREV: Record<string, string> = {
    strength: "STR", speed: "SPD", durability: "DUR", iq: "IQ", biq: "BIQ", ma: "MA",
  };

  const lines: string[] = [];

  lines.push(`Sandbox Battle Report`);
  lines.push(`Thời gian: ${timestamp}`);
  lines.push(`Chế độ: ${mode}`);
  lines.push(line);
  lines.push(`${player1.name} (${player1.race}) vs ${player2.name} (${player2.race})`);
  lines.push(line);

  // Stats
  const statKeys: { key: keyof CharacterStats; label: string }[] = [
    { key: "str", label: "STR" },
    { key: "spd", label: "SPD" },
    { key: "dur", label: "DUR" },
    { key: "iq", label: "IQ" },
    { key: "biq", label: "BIQ" },
    { key: "ma", label: "MA" },
  ];
  const p1StatsStr = statKeys.map(({ key, label }) => `${label}:${player1.stats[key]}`).join(" ");
  const p2StatsStr = statKeys.map(({ key, label }) => `${label}:${player2.stats[key]}`).join(" ");

  lines.push(`\nStats sau immediate effects:`);
  lines.push(`  ${player1.name}: ${p1StatsStr}`);
  lines.push(`  ${player2.name}: ${p2StatsStr}`);

  // Immediate effects
  const allMods = [
    ...(player1.statModifiers || []).map(m => ({ ...m, player: player1.name })),
    ...(player2.statModifiers || []).map(m => ({ ...m, player: player2.name })),
  ];
  if (allMods.length > 0) {
    lines.push(`\nImmediate effects đã áp dụng:`);
    for (const mod of allMods) {
      const sign = mod.value >= 0 ? "+" : "";
      const base = mod.isBase ? " Base" : "";
      const statLabel = STAT_ABBREV[mod.stat?.toLowerCase?.()] ?? mod.stat.toUpperCase();
      lines.push(`  [${mod.player}] ${mod.source} → ${sign}${mod.value}${base} ${statLabel}`);
    }
  }

  // Round results
  lines.push(`\nKết quả từng round:`);
  for (const r of rounds) {
    const w = r.winner === "player1" ? player1.name : r.winner === "player2" ? player2.name : "TIE";
    const score = r.winner === "tie"
      ? `TIE (${r.p1Value} vs ${r.p2Value})`
      : `${w} WIN (${r.winner === "player1" ? r.p1Value : r.p2Value} vs ${r.winner === "player1" ? r.p2Value : r.p1Value})`;
    const chanceStr = r.p1Chance !== undefined
      ? ` [${player1.name} ${r.p1Chance.toFixed(1)}% / ${player2.name} ${(100 - r.p1Chance).toFixed(1)}%]`
      : "";
    lines.push(`  ${r.statLabel}: ${score}${chanceStr}`);
  }

  // Final result
  lines.push(`\nKết quả: ${winnerName} WIN ${winScore}-${loseScore}`);
  lines.push(`  ${loserName} thua`);
  if (tieBreaker === "race") {
    lines.push(`  (Tie-breaker: Race Tier — ${winnerName} có tier cao hơn)`);
  }

  lines.push(`\n${line}`);
  lines.push(`Race Tier: ${player1.name} = ${player1.race} (T${player1.raceTier}) | ${player2.name} = ${player2.race} (T${player2.raceTier})`);
  lines.push(line);

  return lines.join("\n");
}

function downloadReport(content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sandbox-result-report.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Race tier for tie-breaker (lower tier = stronger race, wins tie)
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

const STAT_ORDER: { key: keyof CharacterStats; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "spd", label: "SPD" },
  { key: "dur", label: "DUR" },
  { key: "iq", label: "IQ" },
  { key: "biq", label: "BIQ" },
  { key: "ma", label: "MA" },
];

interface RoundResult {
  stat: string;
  statLabel: string;
  player1Value: number;
  player2Value: number;
  winner: "player1" | "player2" | "tie";
}

interface CombatResult {
  rounds: RoundResult[];
  player1Score: number;
  player2Score: number;
  winner: "player1" | "player2";
  tieBreaker?: "race" | null;
}

interface WheelRoundResult {
  stat: string;
  statLabel: string;
  p1Value: number;
  p2Value: number;
  winner: "player1" | "player2";
  p1Chance: number;
}

export interface SandboxStatModifier {
  source: string;
  stat: string;
  value: number;
  isBase?: boolean;
}

export interface SandboxPlayerData {
  name: string;
  race: string;
  raceTier: number;
  stats: CharacterStats;
  statModifiers?: SandboxStatModifier[];
}

interface SandboxBattleArenaProps {
  player1: SandboxPlayerData | null;
  player2: SandboxPlayerData | null;
}

export const SandboxBattleArena = ({
  player1,
  player2,
}: SandboxBattleArenaProps) => {
  const [mode, setMode] = useState<"stats-comparison" | "wheel-of-truth" | null>(null);

  if (!player1 || !player2) {
    return (
      <div className="text-center text-gray-500 py-8">
        Configure both players to start battle
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-center text-white mb-4">
          Choose Battle Mode
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setMode("stats-comparison")}
            className="group relative overflow-hidden bg-gray-800/50 border-2 border-gray-700 rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:border-purple-500 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <div className="relative z-10 text-center">
              <div className="text-4xl mb-2">⚔️</div>
              <h3 className="text-xl font-bold text-white mb-1">
                Stats Comparison
              </h3>
              <p className="text-gray-400 text-sm">
                Direct stat-by-stat comparison
              </p>
            </div>
          </button>

          <button
            onClick={() => setMode("wheel-of-truth")}
            className="group relative overflow-hidden bg-gray-800/50 border-2 border-gray-700 rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:border-yellow-500 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <div className="relative z-10 text-center">
              <div className="text-4xl mb-2">🎡</div>
              <h3 className="text-xl font-bold text-white mb-1">
                Wheel of Truth
              </h3>
              <p className="text-gray-400 text-sm">
                Spin the wheel based on stats
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (mode === "stats-comparison") {
    return (
      <StatsComparisonBattle
        player1={player1}
        player2={player2}
        onBack={() => setMode(null)}
      />
    );
  }

  return (
    <WheelOfTruthBattle
      player1={player1}
      player2={player2}
      onBack={() => setMode(null)}
    />
  );
};

// ============================================================================
// STATS COMPARISON
// ============================================================================

const StatsComparisonBattle = ({
  player1,
  player2,
  onBack,
}: {
  player1: SandboxPlayerData;
  player2: SandboxPlayerData;
  onBack: () => void;
}) => {
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [currentRound, setCurrentRound] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);

  const runCombat = useCallback(() => {
    setIsAnimating(true);
    setCurrentRound(-1);
    setCombatResult(null);

    const rounds: RoundResult[] = [];
    let p1Score = 0;
    let p2Score = 0;

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
      }

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

    if (p1Score > p2Score) {
      overallWinner = "player1";
    } else if (p2Score > p1Score) {
      overallWinner = "player2";
    } else {
      tieBreaker = "race";
      overallWinner =
        player1.raceTier < player2.raceTier ? "player1" : "player2";
    }

    const result: CombatResult = {
      rounds,
      player1Score: p1Score,
      player2Score: p2Score,
      winner: overallWinner,
      tieBreaker,
    };

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
  }, [player1, player2]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Back
        </button>
        <h2 className="text-lg font-bold text-purple-400">Stats Comparison</h2>
        <div className="w-12" />
      </div>

      {/* Player Stats Side by Side */}
      <div className="grid grid-cols-2 gap-4">
        <PlayerStatsSummary player={player1} color="blue" />
        <PlayerStatsSummary player={player2} color="red" />
      </div>

      {/* Start Button */}
      <div className="flex justify-center">
        <button
          onClick={runCombat}
          disabled={isAnimating}
          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 disabled:opacity-50 rounded-xl text-white font-bold text-xl transition-all transform hover:scale-105"
        >
          {isAnimating ? "Fighting..." : "⚔️ START BATTLE ⚔️"}
        </button>
      </div>

      {/* Combat Arena */}
      {(isAnimating || combatResult) && (
        <div className="bg-gray-900/95 border-2 border-purple-500/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-center text-purple-400 mb-4">
            Combat Arena
          </h3>

          {/* Rounds */}
          <div className="space-y-2 mb-4">
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
                  <div className="text-right">
                    {isRevealed && round ? (
                      <span
                        className={`text-xl font-bold ${round.winner === "player1" ? "text-green-400" : "text-gray-400"}`}
                      >
                        {round.player1Value}
                        {round.winner === "player1" && (
                          <span className="ml-1">✓</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-600">?</span>
                    )}
                  </div>
                  <div className="text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        isRevealed
                          ? "bg-purple-600/50 text-white"
                          : "bg-gray-700/50 text-gray-500"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  <div className="text-left">
                    {isRevealed && round ? (
                      <span
                        className={`text-xl font-bold ${round.winner === "player2" ? "text-green-400" : "text-gray-400"}`}
                      >
                        {round.winner === "player2" && (
                          <span className="mr-1">✓</span>
                        )}
                        {round.player2Value}
                      </span>
                    ) : (
                      <span className="text-gray-600">?</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Result */}
          {combatResult && (
            <div className="text-center">
              <div className="text-lg text-gray-300 mb-2">
                {combatResult.player1Score} - {combatResult.player2Score}
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
                className={`text-3xl font-bold mb-4 ${
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
              <div className="flex justify-center gap-3">
                <button
                  onClick={runCombat}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-all"
                >
                  Fight Again
                </button>
                <button
                  onClick={() => {
                    const reportRounds: ReportRound[] = combatResult.rounds.map((r) => ({
                      statLabel: r.statLabel,
                      p1Value: r.player1Value,
                      p2Value: r.player2Value,
                      winner: r.winner,
                    }));
                    const text = generateReportText(
                      "Stats Comparison",
                      player1,
                      player2,
                      reportRounds,
                      combatResult.player1Score,
                      combatResult.player2Score,
                      combatResult.winner,
                      combatResult.tieBreaker,
                    );
                    downloadReport(text);
                  }}
                  className="px-6 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-white font-medium transition-all"
                >
                  Export Report
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// WHEEL OF TRUTH
// ============================================================================

const WheelOfTruthBattle = ({
  player1,
  player2,
  onBack,
}: {
  player1: SandboxPlayerData;
  player2: SandboxPlayerData;
  onBack: () => void;
}) => {
  const [battleState, setBattleState] = useState<
    "idle" | "fighting" | "finished"
  >("idle");
  const [currentRound, setCurrentRound] = useState(0);
  const [roundResults, setRoundResults] = useState<WheelRoundResult[]>([]);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [finalWinner, setFinalWinner] = useState<"player1" | "player2" | null>(
    null,
  );
  const [tieBreaker, setTieBreaker] = useState<"race" | null>(null);

  const spinWheel = useCallback(() => {
    if (!player1 || !player2 || isSpinning || currentRound >= 6) return;

    setIsSpinning(true);
    const statInfo = STAT_ORDER[currentRound];
    const p1Val = player1.stats[statInfo.key];
    const p2Val = player2.stats[statInfo.key];

    // Calculate win probability: x2 weight for higher stat
    let p1Weight = p1Val;
    let p2Weight = p2Val;
    if (p1Val > p2Val) {
      p1Weight = p1Val * 2;
    } else if (p2Val > p1Val) {
      p2Weight = p2Val * 2;
    }

    const total = p1Weight + p2Weight;
    const p1Chance = total > 0 ? (p1Weight / total) * 360 : 180;

    const spinRotations = 5 + Math.random() * 3;
    const finalAngle = Math.random() * 360;
    const totalRotation = spinRotations * 360 + finalAngle;

    setWheelRotation((prev) => prev + totalRotation);

    const winner: "player1" | "player2" =
      finalAngle < p1Chance ? "player1" : "player2";

    const p1ChancePct = total > 0 ? (p1Weight / total) * 100 : 50;

    setTimeout(() => {
      setRoundResults((prev) => [
        ...prev,
        {
          stat: statInfo.key,
          statLabel: statInfo.label,
          p1Value: p1Val,
          p2Value: p2Val,
          winner,
          p1Chance: p1ChancePct,
        },
      ]);

      if (winner === "player1") {
        setP1Score((prev) => prev + 1);
      } else {
        setP2Score((prev) => prev + 1);
      }

      setCurrentRound((prev) => prev + 1);
      setIsSpinning(false);
    }, 3000);
  }, [player1, player2, isSpinning, currentRound]);

  // Check for battle end
  useEffect(() => {
    if (currentRound === 6 && battleState === "fighting") {
      let winner: "player1" | "player2";
      let usedTieBreaker: "race" | null = null;

      if (p1Score > p2Score) {
        winner = "player1";
      } else if (p2Score > p1Score) {
        winner = "player2";
      } else {
        usedTieBreaker = "race";
        winner =
          player1.raceTier < player2.raceTier ? "player1" : "player2";
      }

      setFinalWinner(winner);
      setTieBreaker(usedTieBreaker);
      setBattleState("finished");
    }
  }, [currentRound, battleState, p1Score, p2Score, player1, player2]);

  const startBattle = () => {
    setBattleState("fighting");
    setCurrentRound(0);
    setRoundResults([]);
    setP1Score(0);
    setP2Score(0);
    setFinalWinner(null);
    setTieBreaker(null);
    setWheelRotation(0);
  };

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

  const currentStatInfo = currentRound < 6 ? STAT_ORDER[currentRound] : null;
  const currentP1Val =
    currentStatInfo ? player1.stats[currentStatInfo.key] : 0;
  const currentP2Val =
    currentStatInfo ? player2.stats[currentStatInfo.key] : 0;

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Back
        </button>
        <h2 className="text-lg font-bold text-yellow-400">Wheel of Truth</h2>
        <div className="w-12" />
      </div>

      {/* Player Stats */}
      <div className="grid grid-cols-2 gap-4">
        <PlayerStatsSummary player={player1} color="blue" />
        <PlayerStatsSummary player={player2} color="red" />
      </div>

      {/* Start / Battle */}
      {battleState === "idle" && (
        <div className="flex justify-center">
          <button
            onClick={startBattle}
            className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-xl text-white font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
          >
            🎡 START WHEEL OF TRUTH 🎡
          </button>
        </div>
      )}

      {(battleState === "fighting" || battleState === "finished") && (
        <div className="bg-gray-900/95 border-2 border-yellow-500/50 rounded-xl p-6">
          {/* Score Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-center flex-1">
              <div className="text-sm text-blue-400">{player1.name}</div>
              <div className="text-4xl font-bold text-blue-400">{p1Score}</div>
            </div>
            <div className="text-2xl text-gray-500 px-4">
              Round {Math.min(currentRound + 1, 6)} / 6
            </div>
            <div className="text-center flex-1">
              <div className="text-sm text-red-400">{player2.name}</div>
              <div className="text-4xl font-bold text-red-400">{p2Score}</div>
            </div>
          </div>

          {/* Wheel Section */}
          {battleState === "fighting" && currentRound < 6 && (
            <div className="flex flex-col items-center mb-6">
              <div className="text-2xl font-bold text-yellow-400 mb-4">
                {currentStatInfo?.label} Round
              </div>

              <div className="flex justify-center items-center gap-8 mb-4">
                <div className="text-center">
                  <div className="text-blue-400 text-sm">{player1.name}</div>
                  <div className="text-3xl font-bold text-blue-400">
                    {currentP1Val}
                    {currentP1Val > currentP2Val && (
                      <span className="text-yellow-400 text-lg ml-1">
                        x2={currentP1Val * 2}
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
                        x2={currentP2Val * 2}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    ({(100 - p1Percentage).toFixed(1)}%)
                  </div>
                </div>
              </div>

              {/* Wheel */}
              <div className="relative w-48 h-48 mb-4">
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
                className={`text-3xl font-bold mb-4 ${
                  finalWinner === "player1" ? "text-blue-400" : "text-red-400"
                }`}
              >
                🏆{" "}
                {finalWinner === "player1" ? player1.name : player2.name}{" "}
                WINS! 🏆
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={resetBattle}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-all"
                >
                  Fight Again
                </button>
                <button
                  onClick={() => {
                    const reportRounds: ReportRound[] = roundResults.map((r) => ({
                      statLabel: r.statLabel,
                      p1Value: r.p1Value,
                      p2Value: r.p2Value,
                      winner: r.winner,
                      p1Chance: r.p1Chance,
                    }));
                    const text = generateReportText(
                      "Wheel of Truth",
                      player1,
                      player2,
                      reportRounds,
                      p1Score,
                      p2Score,
                      finalWinner,
                      tieBreaker,
                    );
                    downloadReport(text);
                  }}
                  className="px-6 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-white font-medium transition-all"
                >
                  Export Report
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

const PlayerStatsSummary = ({
  player,
  color,
}: {
  player: SandboxPlayerData;
  color: "blue" | "red";
}) => {
  const textColor = color === "blue" ? "text-blue-400" : "text-red-400";
  const bgColor = color === "blue" ? "bg-blue-600/30" : "bg-red-600/30";
  const borderColor = color === "blue" ? "border-blue-500/30" : "border-red-500/30";

  return (
    <div className={`bg-gray-800/50 border ${borderColor} rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`${textColor} font-bold`}>{player.name}</span>
        <span className={`px-2 py-0.5 ${bgColor} rounded text-xs ${textColor}`}>
          {player.race} (T{player.raceTier})
        </span>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {STAT_ORDER.map(({ key, label }) => (
          <div key={key} className="text-center bg-gray-700/50 rounded p-1">
            <div className="text-gray-400 text-[10px]">{label}</div>
            <div className="text-white font-bold text-sm">
              {player.stats[key]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { RACE_TIERS };
