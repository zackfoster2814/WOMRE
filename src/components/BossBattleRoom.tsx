import { useState, useMemo, useCallback } from "react";
import { CharacterStats } from "../types/character";

// Types
interface BossStats {
  str: number | null;
  spd: number | null;
  dur: number | null;
  iq: number | null;
  biq: number | null;
  ma: number | null;
}

interface Boss {
  id: number;
  name: string;
  stats: BossStats;
  reward: string;
  punishment: string;
}

interface PlayerData {
  no: number;
  name: string;
  username: string;
  stats: CharacterStats;
  team?: number;
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
  str: "Strength",
  spd: "Speed",
  dur: "Durability",
  iq: "IQ",
  biq: "Battle IQ",
  ma: "Martial Arts",
};
// Colors available for future use
// const STAT_COLORS: Record<string, string> = {
//   str: "from-red-500 to-red-600",
//   spd: "from-yellow-500 to-yellow-600",
//   dur: "from-blue-500 to-blue-600",
//   iq: "from-purple-500 to-purple-600",
//   biq: "from-pink-500 to-pink-600",
//   ma: "from-orange-500 to-orange-600",
// };

interface RoundResult {
  stat: keyof BossStats;
  bossValue: number;
  teamValue: number;
  winner: "boss" | "team" | "tie";
  spinAngle: number;
}

interface BossBattleRoomProps {
  battle: BattleView;
  onClose: () => void;
}

export const BossBattleRoom = ({ battle, onClose }: BossBattleRoomProps) => {
  const [battleState, setBattleState] = useState<"idle" | "fighting" | "finished">("idle");
  const [currentRound, setCurrentRound] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  const boss = battle.boss!;

  // Calculate team total stats (sum of all members)
  const teamStats = useMemo(() => {
    const totals: CharacterStats = { str: 0, spd: 0, dur: 0, iq: 0, biq: 0, ma: 0 };
    battle.playerData.forEach((player) => {
      totals.str += player.stats.str || 0;
      totals.spd += player.stats.spd || 0;
      totals.dur += player.stats.dur || 0;
      totals.iq += player.stats.iq || 0;
      totals.biq += player.stats.biq || 0;
      totals.ma += player.stats.ma || 0;
    });
    return totals;
  }, [battle.playerData]);

  // Calculate battle score
  const score = useMemo(() => {
    const bossWins = roundResults.filter((r) => r.winner === "boss").length;
    const teamWins = roundResults.filter((r) => r.winner === "team").length;
    return { boss: bossWins, team: teamWins };
  }, [roundResults]);

  // Determine final winner
  const finalWinner = useMemo(() => {
    if (battleState !== "finished") return null;
    if (score.team > score.boss) return "team";
    if (score.boss > score.team) return "boss";
    return "tie";
  }, [battleState, score]);

  // Calculate weighted values (higher side gets x2)
  const getWeightedValues = (bossVal: number, teamVal: number) => {
    if (bossVal > teamVal) {
      return { bossWeight: bossVal * 2, teamWeight: teamVal };
    } else if (teamVal > bossVal) {
      return { bossWeight: bossVal, teamWeight: teamVal * 2 };
    } else {
      // Equal - both stay the same
      return { bossWeight: bossVal, teamWeight: teamVal };
    }
  };

  // Spin wheel for current round
  const spinWheel = useCallback(() => {
    if (currentRound >= 6 || isSpinning) return;

    setIsSpinning(true);
    const stat = STAT_KEYS[currentRound];
    const bossValue = boss.stats[stat] || 0;
    const teamValue = teamStats[stat] || 0;

    // Apply weighting: higher side gets x2
    const { bossWeight, teamWeight } = getWeightedValues(bossValue, teamValue);
    const total = bossWeight + teamWeight;

    if (total === 0) {
      // Both have 0, it's a tie
      const result: RoundResult = {
        stat,
        bossValue,
        teamValue,
        winner: "tie",
        spinAngle: 0,
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

    // Calculate wheel segments with weighted values
    // Boss segment: 0 to (bossWeight/total * 360)
    // Team segment: (bossWeight/total * 360) to 360
    const bossAngle = (bossWeight / total) * 360;

    // Random spin result
    const spinRotations = 5 + Math.random() * 3; // 5-8 full rotations
    const finalAngle = Math.random() * 360;
    const totalRotation = spinRotations * 360 + finalAngle;

    setWheelRotation((prev) => prev + totalRotation);

    // Determine winner based on where it lands
    // finalAngle < bossAngle means boss wins
    const winner: "boss" | "team" = finalAngle < bossAngle ? "boss" : "team";

    const result: RoundResult = {
      stat,
      bossValue,
      teamValue,
      winner,
      spinAngle: finalAngle,
    };

    // Wait for spin animation to finish
    setTimeout(() => {
      setRoundResults((prev) => [...prev, result]);
      setCurrentRound((prev) => prev + 1);
      setIsSpinning(false);

      if (currentRound + 1 >= 6) {
        setBattleState("finished");
      }
    }, 3000);
  }, [currentRound, isSpinning, boss.stats, teamStats]);

  // Start battle
  const startBattle = () => {
    setBattleState("fighting");
    setCurrentRound(0);
    setRoundResults([]);
    setWheelRotation(0);
  };

  // Auto-spin all rounds
  const autoFight = useCallback(() => {
    setBattleState("fighting");
    setCurrentRound(0);
    setRoundResults([]);
    setWheelRotation(0);

    const results: RoundResult[] = [];
    let rotation = 0;

    STAT_KEYS.forEach((stat) => {
      const bossValue = boss.stats[stat] || 0;
      const teamValue = teamStats[stat] || 0;

      // Apply weighting: higher side gets x2
      const { bossWeight, teamWeight } = getWeightedValues(bossValue, teamValue);
      const total = bossWeight + teamWeight;

      let winner: "boss" | "team" | "tie" = "tie";
      let spinAngle = 0;

      if (total > 0) {
        const bossAngle = (bossWeight / total) * 360;
        spinAngle = Math.random() * 360;
        winner = spinAngle < bossAngle ? "boss" : "team";
      }

      rotation += (5 + Math.random() * 3) * 360 + spinAngle;

      results.push({
        stat,
        bossValue,
        teamValue,
        winner,
        spinAngle,
      });
    });

    // Animate through rounds
    let round = 0;
    const showNextRound = () => {
      if (round < 6) {
        setCurrentRound(round);
        setRoundResults(results.slice(0, round + 1));
        setWheelRotation(rotation * ((round + 1) / 6));
        round++;
        setTimeout(showNextRound, 800);
      } else {
        setBattleState("finished");
      }
    };

    setTimeout(showNextRound, 500);
  }, [boss.stats, teamStats]);

  // Reset battle
  const resetBattle = () => {
    setBattleState("idle");
    setCurrentRound(0);
    setRoundResults([]);
    setWheelRotation(0);
  };

  // Current stat being fought
  const currentStat = currentRound < 6 ? STAT_KEYS[currentRound] : null;
  const currentBossValue = currentStat ? (boss.stats[currentStat] || 0) : 0;
  const currentTeamValue = currentStat ? (teamStats[currentStat] || 0) : 0;

  // Weighted values for wheel display
  const currentWeighted = currentStat
    ? getWeightedValues(currentBossValue, currentTeamValue)
    : { bossWeight: 0, teamWeight: 0 };
  const currentTotalWeight = currentWeighted.bossWeight + currentWeighted.teamWeight;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900/95 backdrop-blur-sm border-2 border-red-500/50 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <p className="text-white/70 text-sm">Lair Battle</p>
            <h2 className="text-2xl font-bold text-white">
              Team {battle.teamId} vs {boss.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-3xl font-light transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="p-6">
          {/* Stats Comparison Header */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Boss Side */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-red-400 mb-2">{boss.name}</h3>
              <div className="text-3xl font-bold text-red-500">{score.boss}</div>
              <p className="text-gray-400 text-sm">Rounds Won</p>
            </div>

            {/* VS */}
            <div className="flex items-center justify-center">
              <span className="text-4xl font-bold text-gray-500">VS</span>
            </div>

            {/* Team Side */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-green-400 mb-2">Team {battle.teamId}</h3>
              <div className="text-3xl font-bold text-green-500">{score.team}</div>
              <p className="text-gray-400 text-sm">Rounds Won</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-6 gap-2 mb-6">
            {STAT_KEYS.map((stat, idx) => {
              const bossVal = boss.stats[stat] || 0;
              const teamVal = teamStats[stat] || 0;
              const result = roundResults[idx];
              const isCurrentRound = idx === currentRound && battleState === "fighting";
              const isPending = idx > currentRound || battleState === "idle";

              return (
                <div
                  key={stat}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isCurrentRound
                      ? "border-yellow-400 bg-yellow-500/20 scale-105"
                      : result
                      ? result.winner === "boss"
                        ? "border-red-500 bg-red-500/20"
                        : result.winner === "team"
                        ? "border-green-500 bg-green-500/20"
                        : "border-gray-500 bg-gray-500/20"
                      : isPending
                      ? "border-gray-600 bg-gray-800/50"
                      : "border-gray-600 bg-gray-800/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-bold text-gray-400 mb-1">
                      {stat.toUpperCase()}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-400">{bossVal}</span>
                      <span className="text-gray-500">vs</span>
                      <span className="text-green-400">{teamVal}</span>
                    </div>
                    {result && (
                      <div
                        className={`mt-1 text-xs font-bold ${
                          result.winner === "boss"
                            ? "text-red-400"
                            : result.winner === "team"
                            ? "text-green-400"
                            : "text-gray-400"
                        }`}
                      >
                        {result.winner === "boss"
                          ? "BOSS"
                          : result.winner === "team"
                          ? "TEAM"
                          : "TIE"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Battle Wheel */}
          {battleState === "fighting" && currentStat && (
            <div className="flex flex-col items-center mb-6">
              <h4 className="text-lg font-bold text-white mb-4">
                Round {currentRound + 1}: {STAT_LABELS[currentStat]}
              </h4>

              {/* Weight Info */}
              <div className="flex justify-center gap-8 mb-4 text-sm">
                <div className="text-center">
                  <span className="text-gray-400">Boss: </span>
                  <span className="text-red-400 font-bold">{currentBossValue}</span>
                  {currentBossValue > currentTeamValue && (
                    <span className="text-yellow-400 ml-1">(x2 = {currentWeighted.bossWeight})</span>
                  )}
                </div>
                <div className="text-center">
                  <span className="text-gray-400">Team: </span>
                  <span className="text-green-400 font-bold">{currentTeamValue}</span>
                  {currentTeamValue > currentBossValue && (
                    <span className="text-yellow-400 ml-1">(x2 = {currentWeighted.teamWeight})</span>
                  )}
                </div>
              </div>

              {/* Wheel */}
              <div className="relative w-64 h-64 mb-4">
                {/* Wheel background */}
                <div
                  className="w-full h-full rounded-full border-4 border-gray-600 overflow-hidden transition-transform duration-[3000ms] ease-out"
                  style={{
                    transform: `rotate(${wheelRotation}deg)`,
                    background: `conic-gradient(
                      from 0deg,
                      #ef4444 0deg ${(currentWeighted.bossWeight / (currentTotalWeight || 1)) * 360}deg,
                      #22c55e ${(currentWeighted.bossWeight / (currentTotalWeight || 1)) * 360}deg 360deg
                    )`,
                  }}
                >
                  {/* Boss label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute text-white font-bold text-sm"
                      style={{
                        transform: `rotate(${-(currentWeighted.bossWeight / (currentTotalWeight || 1)) * 180}deg) translateY(-60px)`,
                      }}
                    >
                      BOSS
                    </div>
                  </div>
                </div>

                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gray-800 rounded-full border-4 border-gray-600 flex items-center justify-center flex-col">
                  <span className="text-white font-bold text-xs">Weight</span>
                  <span className="text-white font-bold text-sm">
                    {currentWeighted.bossWeight} : {currentWeighted.teamWeight}
                  </span>
                </div>

                {/* Arrow pointer */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                  <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-yellow-400" />
                </div>
              </div>

              {/* Spin button */}
              {!isSpinning && (
                <button
                  onClick={spinWheel}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold rounded-lg transition-all transform hover:scale-105"
                >
                  Spin for {STAT_LABELS[currentStat]}!
                </button>
              )}
              {isSpinning && (
                <p className="text-yellow-400 font-medium animate-pulse">Spinning...</p>
              )}
            </div>
          )}

          {/* Idle State - Start buttons */}
          {battleState === "idle" && (
            <div className="flex flex-col items-center gap-4 mb-6">
              <p className="text-gray-400 text-center">
                Battle consists of 6 rounds, one for each stat.<br />
                Each round uses a weighted wheel based on the stat values.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={startBattle}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-lg transition-all transform hover:scale-105"
                >
                  Start Battle (Manual)
                </button>
                <button
                  onClick={autoFight}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold rounded-lg transition-all transform hover:scale-105"
                >
                  Auto Fight
                </button>
              </div>
            </div>
          )}

          {/* Final Result */}
          {battleState === "finished" && (
            <div className="text-center mb-6">
              <div
                className={`inline-block px-8 py-4 rounded-xl ${
                  finalWinner === "team"
                    ? "bg-green-500/30 border-2 border-green-500"
                    : finalWinner === "boss"
                    ? "bg-red-500/30 border-2 border-red-500"
                    : "bg-gray-500/30 border-2 border-gray-500"
                }`}
              >
                <h3
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
                </h3>
                <p className="text-white">
                  Final Score: {score.team} - {score.boss}
                </p>
              </div>

              {/* Reward/Punishment */}
              <div className="mt-6 grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div
                  className={`p-4 rounded-lg ${
                    finalWinner === "team"
                      ? "bg-green-500/20 border border-green-500"
                      : "bg-green-500/10 border border-green-500/30 opacity-50"
                  }`}
                >
                  <h4 className="text-green-400 font-bold mb-2">Reward</h4>
                  <p className="text-green-300 text-sm">{boss.reward}</p>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    finalWinner === "boss"
                      ? "bg-red-500/20 border border-red-500"
                      : "bg-red-500/10 border border-red-500/30 opacity-50"
                  }`}
                >
                  <h4 className="text-red-400 font-bold mb-2">Punishment</h4>
                  <p className="text-red-300 text-sm">{boss.punishment}</p>
                </div>
              </div>

              {/* Play again button */}
              <button
                onClick={resetBattle}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold rounded-lg transition-all transform hover:scale-105"
              >
                Battle Again
              </button>
            </div>
          )}

          {/* Team Members */}
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-lg font-bold text-white mb-3">
              Team {battle.teamId} Members ({battle.playerData.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {battle.playerData.map((player) => (
                <div
                  key={player.no}
                  className="bg-gray-800/80 rounded-lg p-2 border border-gray-700"
                >
                  <div className="text-xs text-teal-400">No.{player.no}</div>
                  <div className="text-white font-medium text-sm truncate">
                    {player.name}
                  </div>
                  <div className="text-gray-400 text-xs">
                    Total:{" "}
                    {player.stats.str +
                      player.stats.spd +
                      player.stats.dur +
                      player.stats.iq +
                      player.stats.biq +
                      player.stats.ma}
                  </div>
                </div>
              ))}
            </div>

            {/* Team Total Stats */}
            <div className="mt-4 bg-gray-800/50 rounded-lg p-3">
              <h5 className="text-sm font-medium text-gray-400 mb-2">Team Total Stats</h5>
              <div className="grid grid-cols-6 gap-2 text-center">
                {STAT_KEYS.map((stat) => (
                  <div key={stat} className="bg-gray-700/50 rounded px-2 py-1">
                    <div className="text-xs font-medium text-gray-400">
                      {stat.toUpperCase()}
                    </div>
                    <div className="text-green-400 font-bold">{teamStats[stat]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
