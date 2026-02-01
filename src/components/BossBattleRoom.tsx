import { useState, useMemo, useCallback, useEffect } from "react";
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

// Rule effect types for boss battles
interface RuleEffect {
  type: string;
  target: "boss" | "team" | "both";
  description: string;
  // For statAboveThreshold / statBelowThreshold
  threshold?: number;
  bonusPerStat?: number;
  stat?: string; // specific stat to check (iq, biq, etc.)
  // For hasRace
  race?: string;
  races?: string[]; // multiple races
  bonus?: number;
  bonusPoints?: number; // for starting points bonus
  // For startingPoints
  points?: number;
  // For customWinCondition
  pointsToWin?: number;
  // For blockTeamScore
  chance?: number;
  // For noDoubleWeight, dynamicBossStats, etc.
  calculation?: string;
  // For doubleStatsEveryNRounds, alternatingResultBonus
  roundInterval?: number;
  // For freeze mechanics
  freezeCount?: number;
  immuneRaces?: string[];
  // For winStreakRequired
  streakCount?: number;
  penaltyStats?: number;
  // For partyStatMinimum
  minimum?: number;
  // For multiPhase
  phases?: number;
  totalRounds?: number;
  // For bossStatBoostPerRace
  bonusPerRace?: number;
  maxBonus?: number;
  countScope?: string;
  // For removeTeamMembersOnWins
  winsRequired?: number;
  membersToRemove?: number;
  // For preBattleWheel
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
  // For collectorAbsorb
  bonusPerAbsorb?: number;
  absorbedCount?: number;
  // For bossStatBoostOnTeamWin
  totalBonus?: number;
  distribution?: string;
  // For conditionalAfterRounds
  roundTrigger?: number;
  conditions?: Array<{
    teamPoints: string;
    effects: string;
  }>;
  // For hasCondition
  condition?: string;
  // For bossHasEffect
  effects?: string[];
  // For giveGearOnLoss
  gear?: string;
  // For music
  music?: string;
  // For bossStatPenaltyPerPvEOnly
  penalty?: number;
  // For totalStatBattle
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
  team?: number;
  quirks?: string[];
  race?: string;
  powers?: string[];
  gear?: string[];
  weapons?: string[];
  archetypes?: string[];
  pveOnlyFeatures?: string[];
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

interface RoundResult {
  stat: keyof BossStats;
  bossValue: number;
  teamValue: number;
  winner: "boss" | "team" | "tie";
  spinAngle: number;
  blocked?: boolean; // For Radagon's block
  bonusPoints?: number; // For special scoring (Isshin Speed win)
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

interface BossBattleRoomProps {
  battle: BattleView;
  onClose: () => void;
}

export const BossBattleRoom = ({ battle, onClose }: BossBattleRoomProps) => {
  const [battleState, setBattleState] = useState<
    "idle" | "preBattle" | "fighting" | "finished"
  >("idle");
  const [currentRound, setCurrentRound] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  // Dynamic bonuses that change during battle
  const [dynamicBossBonus, setDynamicBossBonus] = useState(0);
  const [dynamicBossStatChanges, setDynamicBossStatChanges] = useState<Partial<BossStats>>({});

  // Freeze mechanics (Caligo)
  const [frozenPlayers, setFrozenPlayers] = useState<FrozenPlayer[]>([]);

  // Hypnotize mechanics (Kafka)
  const [hypnotizedPlayer, setHypnotizedPlayer] = useState<HypnotizedPlayer | null>(null);

  // Removed players (Simon)
  const [removedPlayers, setRemovedPlayers] = useState<number[]>([]);

  // Pre-battle wheel result (Elder Brain, Raphael)
  const [preBattleWheelResult, setPreBattleWheelResult] = useState<{
    number: number;
    effect: string;
    description: string;
  } | null>(null);
  const [showPreBattleWheel, setShowPreBattleWheel] = useState(false);
  const [preBattleWheelSpinning, setPreBattleWheelSpinning] = useState(false);

  // Multi-phase (Aatrox)
  const [currentPhase, setCurrentPhase] = useState(1);
  const [, setPhaseScores] = useState<{ boss: number; team: number }[]>([]);

  // Isekai'd players (The Collector)
  const [isekaidPlayers, setIsekaidPlayers] = useState<number[]>([]);

  // Win streak tracking (Rolling Skeletons)
  const [winStreak, setWinStreak] = useState(0);
  const [retryBattle, setRetryBattle] = useState(false);
  const [retryPenalty, setRetryPenalty] = useState(0);

  // Mirror scoring (Sky Dancer) - tracked via specialRules.isMirrorScoring
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_mirrorScoringState, _setMirrorScoringState] = useState(false);

  // Special messages
  const [battleMessages, setBattleMessages] = useState<string[]>([]);

  const boss = battle.boss!;

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

  // Get active players (not frozen, not removed, not isekai'd)
  const activePlayers = useMemo(() => {
    return battle.playerData.filter(
      (p) =>
        !frozenPlayers.some((f) => f.playerNo === p.no) &&
        !removedPlayers.includes(p.no) &&
        !isekaidPlayers.includes(p.no) &&
        (!hypnotizedPlayer || hypnotizedPlayer.playerNo !== p.no)
    );
  }, [battle.playerData, frozenPlayers, removedPlayers, isekaidPlayers, hypnotizedPlayer]);

  // Check for boss-specific rule conditions
  const bossRuleChecks = useMemo(() => {
    const checks: Record<string, boolean | number | number[] | string[]> = {};

    // Check for 67 Final Boss - adjacent 6-7 pattern
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

      // Check if any team stat total > 67
      const statTotals = {
        str: 0, spd: 0, dur: 0, iq: 0, biq: 0, ma: 0
      };
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

    // Check for Caligo - Dragon or higher races
    if (boss.id === 6) {
      const immuneRaces = ["dragon", "deity", "cosmic entity", "eldritch"];
      const immunePlayers = battle.playerData.filter((p) =>
        immuneRaces.includes(p.race?.toLowerCase() || "")
      );
      checks.freezeImmunePlayers = immunePlayers.map((p) => p.no);
    }

    // Check for Simon - PvE Only features
    if (boss.id === 15) {
      checks.hasPvEOnlyFeatures = battle.playerData.some(
        (p) => p.pveOnlyFeatures && p.pveOnlyFeatures.length > 0
      );
    }

    // Check for Griffith - count PvE Only features
    if (boss.id === 23) {
      let pveOnlyCount = 0;
      battle.playerData.forEach((p) => {
        pveOnlyCount += p.pveOnlyFeatures?.length || 0;
      });
      checks.pveOnlyCount = pveOnlyCount;
    }

    // Check for Polish Cow - deaf condition
    if (boss.id === 27) {
      checks.hasDeafPlayer = battle.playerData.some((p) =>
        p.quirks?.some((q) => q.toLowerCase().includes("deaf"))
      );
    }

    // Check for Sigrun - count Angels and Gods in season (simplified: count in team)
    if (boss.id === 30) {
      const angelGodRaces = ["angel", "god"];
      const count = battle.playerData.filter((p) =>
        angelGodRaces.includes(p.race?.toLowerCase() || "")
      ).length;
      checks.angelGodCount = Math.min(count, 10); // Max +10
    }

    return checks;
  }, [boss.id, battle.playerData]);

  // Generic rule engine for boss battle effects
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
              (p) => p.race?.toLowerCase() === targetRace
            );
          } else if (targetRaces) {
            hasRace = activePlayers.some((p) =>
              targetRaces.includes(p.race?.toLowerCase() || "")
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

        case "uniqueRaces": {
          const races = activePlayers
            .map((p) => p.race?.toLowerCase())
            .filter((r) => r);
          const uniqueRaces = new Set(races);
          const allUnique = races.length > 0 && uniqueRaces.size === races.length;

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
          const count = bossRuleChecks.adjacent67Count as number || 0;
          if (count > 0 && effect.bonusPoints) {
            details.push(`Team ${count * effect.bonusPoints} điểm khởi đầu (${count} cặp 6-7 liền kề)`);
          }
          break;
        }

        case "bossStatBoostPerRace": {
          const count = bossRuleChecks.angelGodCount as number || 0;
          if (count > 0 && effect.bonusPerRace) {
            const bonus = count * effect.bonusPerRace;
            bossBonus += bonus;
            details.push(`${boss.name} +${bonus} All Stats (${count} Angel/God)`);
          }
          break;
        }

        case "bossStatPenaltyPerPvEOnly": {
          const count = bossRuleChecks.pveOnlyCount as number || 0;
          if (count > 0 && effect.penalty) {
            const penalty = count * effect.penalty;
            bossBonus += penalty; // penalty is negative
            details.push(`${boss.name} ${penalty} All Stats (${count} [PvE Only] Features)`);
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

    // Add Kafka hypnotized player stats to boss
    if (hypnotizedPlayer && boss.id === 9) {
      const hpStats = hypnotizedPlayer.stats;
      const totalStats = (hpStats.str || 0) + (hpStats.spd || 0) + (hpStats.dur || 0) +
                        (hpStats.iq || 0) + (hpStats.biq || 0) + (hpStats.ma || 0);
      bossBonus += Math.floor(totalStats / 6); // Average stat boost
      details.push(`Kafka nhận stats từ ${hypnotizedPlayer.name}`);
    }

    return { bossBonus, teamBonus, details };
  }, [boss.ruleEffects, boss.id, boss.name, activePlayers, bossRuleChecks, hypnotizedPlayer]);

  // Calculate starting points and special rules
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
    const specialDetails: string[] = [];

    if (!boss.ruleEffects || boss.ruleEffects.length === 0) {
      return {
        bossStartingPoints, teamStartingPoints, teamPointsToWin,
        bossPointsPerWin, noDoubleWeight, bossAlwaysScoresPoints,
        blockTeamScoreChance, specialDetails, hasPreBattleWheel,
        isMultiPhase, totalPhases, isMirrorScoring, isTotalStatBattle,
        totalStatBattleRounds
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
                (p) => p.race?.toLowerCase() === effect.race?.toLowerCase()
              );
            } else if (effect.races) {
              hasRace = activePlayers.some((p) =>
                effect.races?.some((r) => p.race?.toLowerCase() === r.toLowerCase())
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
          const count = bossRuleChecks.adjacent67Count as number || 0;
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
          specialDetails.push(effect.description);
          break;
        }
      }
    });

    // Apply pre-battle wheel effects
    if (preBattleWheelResult) {
      if (preBattleWheelResult.effect === "teamStartingPoints") {
        const value = parseInt(preBattleWheelResult.description.match(/-?\d+/)?.[0] || "0");
        teamStartingPoints += value;
      } else if (preBattleWheelResult.effect === "bossStats") {
        // Handled in bossStats calculation
      } else if (preBattleWheelResult.effect === "teamStats") {
        // Handled in teamStats calculation
      }
    }

    const bossStatBoostOnWin = boss.ruleEffects.find((e) => e.type === "bossStatBoostOnWin")?.bonus || 0;
    const bossStatBoostOnTeamLoss = boss.ruleEffects.find((e) => e.type === "bossStatBoostOnTeamLoss")?.bonus || 0;
    const teamBonusOnStatWin = boss.ruleEffects.find((e) => e.type === "teamBonusOnStatWin");

    return {
      bossStartingPoints, teamStartingPoints, teamPointsToWin,
      bossPointsPerWin, noDoubleWeight, bossAlwaysScoresPoints,
      blockTeamScoreChance, specialDetails, hasPreBattleWheel,
      isMultiPhase, totalPhases, isMirrorScoring, isTotalStatBattle,
      totalStatBattleRounds,
      bossStatBoostOnWin,
      bossStatBoostOnTeamLoss,
      teamBonusOnStatWin: teamBonusOnStatWin
        ? { stat: teamBonusOnStatWin.stat, bonusPoints: teamBonusOnStatWin.bonusPoints || 0 }
        : null,
    };
  }, [boss.ruleEffects, activePlayers, bossRuleChecks, preBattleWheelResult]);

  // Calculate team total stats
  const teamStats = useMemo(() => {
    const totals: CharacterStats = {
      str: 0, spd: 0, dur: 0, iq: 0, biq: 0, ma: 0,
    };

    if (soloHerInfo.active && soloHerInfo.soloPlayer) {
      const player = soloHerInfo.soloPlayer;
      const mult = soloHerInfo.multiplier;
      totals.str = (player.stats.str || 0) * mult;
      totals.spd = (player.stats.spd || 0) * mult;
      totals.dur = (player.stats.dur || 0) * mult;
      totals.iq = (player.stats.iq || 0) * mult;
      totals.biq = (player.stats.biq || 0) * mult;
      totals.ma = (player.stats.ma || 0) * mult;
    } else {
      activePlayers.forEach((player) => {
        totals.str += player.stats.str || 0;
        totals.spd += player.stats.spd || 0;
        totals.dur += player.stats.dur || 0;
        totals.iq += player.stats.iq || 0;
        totals.biq += player.stats.biq || 0;
        totals.ma += player.stats.ma || 0;
      });
    }

    // Apply team bonus from rules
    if (ruleBonus.teamBonus > 0) {
      totals.str += ruleBonus.teamBonus;
      totals.spd += ruleBonus.teamBonus;
      totals.dur += ruleBonus.teamBonus;
      totals.iq += ruleBonus.teamBonus;
      totals.biq += ruleBonus.teamBonus;
      totals.ma += ruleBonus.teamBonus;
    }

    // Apply pre-battle wheel team stats effect (Elder Brain)
    if (preBattleWheelResult?.effect === "teamStats") {
      const value = parseInt(preBattleWheelResult.description.match(/-?\d+/)?.[0] || "0");
      totals.str += value;
      totals.spd += value;
      totals.dur += value;
      totals.iq += value;
      totals.biq += value;
      totals.ma += value;
    }

    // Apply retry penalty (Rolling Skeletons)
    if (retryPenalty > 0) {
      totals.str -= retryPenalty;
      totals.spd -= retryPenalty;
      totals.dur -= retryPenalty;
      totals.iq -= retryPenalty;
      totals.biq -= retryPenalty;
      totals.ma -= retryPenalty;
    }

    return totals;
  }, [activePlayers, soloHerInfo, ruleBonus.teamBonus, preBattleWheelResult, retryPenalty]);

  // Calculate boss stats with all bonuses
  const bossStats = useMemo(() => {
    let totalBonus = ruleBonus.bossBonus + dynamicBossBonus;

    // Apply pre-battle wheel boss stats effect (Raphael)
    if (preBattleWheelResult?.effect === "bossStats") {
      const value = parseInt(preBattleWheelResult.description.match(/-?\d+/)?.[0] || "0");
      if (value === 666) {
        // Raphael special: set all stats to 666
        return {
          str: 666, spd: 666, dur: 666, iq: 666, biq: 666, ma: 666,
        };
      }
      totalBonus += value;
    }

    // For Violet Vessel - dynamic stats based on highest player
    if (boss.id === 12 && boss.stats.str === null) {
      let highestTotal = 0;
      battle.playerData.forEach((player) => {
        const total =
          (player.stats.str || 0) + (player.stats.spd || 0) +
          (player.stats.dur || 0) + (player.stats.iq || 0) +
          (player.stats.biq || 0) + (player.stats.ma || 0);
        if (total > highestTotal) highestTotal = total;
      });
      const multiplier = battle.playerData.length;
      const statValue = Math.floor(highestTotal / 6) * multiplier;
      return {
        str: statValue, spd: statValue, dur: statValue,
        iq: statValue, biq: statValue, ma: statValue,
      };
    }

    // For Dreglord - use total stats (240 STR only)
    if (boss.id === 18) {
      const bossTotal = 240 + totalBonus * 6;
      return {
        str: bossTotal, spd: 0, dur: 0, iq: 0, biq: 0, ma: 0,
      };
    }

    const stats: BossStats = {
      str: (boss.stats.str || 0) + totalBonus + (dynamicBossStatChanges.str || 0),
      spd: (boss.stats.spd || 0) + totalBonus + (dynamicBossStatChanges.spd || 0),
      dur: (boss.stats.dur || 0) + totalBonus + (dynamicBossStatChanges.dur || 0),
      iq: (boss.stats.iq || 0) + totalBonus + (dynamicBossStatChanges.iq || 0),
      biq: (boss.stats.biq || 0) + totalBonus + (dynamicBossStatChanges.biq || 0),
      ma: (boss.stats.ma || 0) + totalBonus + (dynamicBossStatChanges.ma || 0),
    };

    // Pontiff Sulyvahn - double stats every 2 rounds
    if (boss.id === 8 && currentRound > 0 && currentRound % 2 === 0) {
      const effect = boss.ruleEffects?.find((e) => e.type === "doubleStatsEveryNRounds");
      if (effect) {
        stats.str = (stats.str || 0) * 2;
        stats.spd = (stats.spd || 0) * 2;
        stats.dur = (stats.dur || 0) * 2;
        stats.iq = (stats.iq || 0) * 2;
        stats.biq = (stats.biq || 0) * 2;
        stats.ma = (stats.ma || 0) * 2;
      }
    }

    // Aatrox Phase 2 boost
    if (boss.id === 22 && currentPhase === 2) {
      const boost = 8;
      stats.str = (stats.str || 0) + boost;
      stats.spd = (stats.spd || 0) + boost;
      stats.dur = (stats.dur || 0) + boost;
      stats.iq = (stats.iq || 0) + boost;
      stats.biq = (stats.biq || 0) + boost;
      stats.ma = (stats.ma || 0) + boost;
    }

    return stats;
  }, [
    boss.stats, boss.id, boss.ruleEffects, ruleBonus.bossBonus,
    dynamicBossBonus, dynamicBossStatChanges, preBattleWheelResult,
    battle.playerData, currentRound, currentPhase
  ]);

  // Calculate battle score
  const score = useMemo(() => {
    let bossScore = specialRules.bossStartingPoints;
    let teamScore = specialRules.teamStartingPoints;

    roundResults.forEach((r) => {
      if (r.winner === "boss") {
        bossScore += specialRules.bossPointsPerWin;

        // Aatrox Phase 2: drain team points instead
        if (boss.id === 22 && currentPhase === 2 && teamScore > 0) {
          teamScore -= 1;
          bossScore -= specialRules.bossPointsPerWin; // Don't add to boss
        }
      } else if (r.winner === "team") {
        if (!r.blocked) {
          teamScore += 1;
          if (r.bonusPoints) {
            teamScore += r.bonusPoints;
          }
        }
      }

      // Boss always scores (Divine Dragon)
      if (specialRules.bossAlwaysScoresPoints > 0) {
        bossScore += specialRules.bossAlwaysScoresPoints;
      }

      // Mirror scoring (Sky Dancer)
      if (specialRules.isMirrorScoring) {
        if (r.winner === "boss") {
          teamScore += 1;
        } else if (r.winner === "team" && !r.blocked) {
          bossScore += 1;
        }
      }
    });

    // Baron Nashor alternating result bonus
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
  }, [roundResults, specialRules, boss.id, currentPhase]);

  // Determine final winner
  const finalWinner = useMemo(() => {
    if (battleState !== "finished") return null;

    // Rolling Skeletons: check party stat minimum
    if (boss.id === 10) {
      const minStat = Math.min(
        teamStats.str, teamStats.spd, teamStats.dur,
        teamStats.iq, teamStats.biq, teamStats.ma
      );
      if (minStat < 20) return "boss";
    }

    // Sky Dancer: tie means team wins, different means team loses
    if (boss.id === 17 && specialRules.isMirrorScoring) {
      if (score.team === score.boss) return "team";
      return "boss";
    }

    // Laerys: auto lose tiebreak
    if (boss.id === 26 && score.team === score.boss) {
      return "boss";
    }

    if (score.team >= specialRules.teamPointsToWin) return "team";
    if (score.boss > score.team) return "boss";
    if (score.team > score.boss) return "team";
    return "tie";
  }, [battleState, score, specialRules.teamPointsToWin, specialRules.isMirrorScoring, boss.id, teamStats]);

  // Calculate weighted values
  const getWeightedValues = useCallback(
    (bossVal: number, teamVal: number) => {
      if (specialRules.noDoubleWeight) {
        return { bossWeight: bossVal, teamWeight: teamVal };
      }

      if (bossVal > teamVal) {
        return { bossWeight: bossVal * 2, teamWeight: teamVal };
      } else if (teamVal > bossVal) {
        return { bossWeight: bossVal, teamWeight: teamVal * 2 };
      } else {
        return { bossWeight: bossVal, teamWeight: teamVal };
      }
    },
    [specialRules.noDoubleWeight]
  );

  // Freeze a random player (Caligo)
  const freezeRandomPlayer = useCallback(() => {
    const immunePlayers = (bossRuleChecks.freezeImmunePlayers as number[]) || [];
    const freezablePlayers = activePlayers.filter(
      (p) => !immunePlayers.includes(p.no)
    );

    if (freezablePlayers.length > 0) {
      const randomIdx = Math.floor(Math.random() * freezablePlayers.length);
      const playerToFreeze = freezablePlayers[randomIdx];
      setFrozenPlayers((prev) => [
        ...prev,
        {
          playerNo: playerToFreeze.no,
          name: playerToFreeze.name,
          frozenAtRound: currentRound,
        },
      ]);
      setBattleMessages((prev) => [
        ...prev,
        `❄️ ${playerToFreeze.name} đã bị Caligo đóng băng!`,
      ]);
    }
  }, [activePlayers, bossRuleChecks.freezeImmunePlayers, currentRound]);

  // Isekai a random player (The Collector)
  const isekaiRandomPlayer = useCallback(() => {
    if (activePlayers.length > 0) {
      const randomIdx = Math.floor(Math.random() * activePlayers.length);
      const playerToIsekai = activePlayers[randomIdx];
      setIsekaidPlayers((prev) => [...prev, playerToIsekai.no]);
      setBattleMessages((prev) => [
        ...prev,
        `💀 ${playerToIsekai.name} đã bị The Collector Isekai!`,
      ]);
      // Collector gets stronger
      setDynamicBossBonus((prev) => prev + 2);
    }
  }, [activePlayers]);

  // Remove players (Simon - after 3 team wins)
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
  const spinPreBattleWheel = useCallback(() => {
    const wheelEffect = boss.ruleEffects?.find((e) => e.type === "preBattleWheel");
    if (!wheelEffect || !wheelEffect.outcomes) return;

    setPreBattleWheelSpinning(true);

    setTimeout(() => {
      const wheelSize = wheelEffect.wheelSize || 20;
      const result = Math.floor(Math.random() * wheelSize) + 1;

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
      });
      setPreBattleWheelSpinning(false);
      setBattleMessages((prev) => [
        ...prev,
        `🎰 Vòng quay: ${result} - ${selectedOutcome.description}`,
      ]);
    }, 2000);
  }, [boss.ruleEffects]);

  // Hypnotize random player (Kafka)
  const hypnotizePlayer = useCallback(() => {
    if (activePlayers.length > 0 && !hypnotizedPlayer) {
      const randomIdx = Math.floor(Math.random() * activePlayers.length);
      const player = activePlayers[randomIdx];
      setHypnotizedPlayer({
        playerNo: player.no,
        name: player.name,
        stats: { ...player.stats },
      });
      setBattleMessages((prev) => [
        ...prev,
        `🌀 Kafka đã thôi miên ${player.name}! Stats của họ chuyển sang cho Kafka.`,
      ]);
    }
  }, [activePlayers, hypnotizedPlayer]);

  // Spin wheel for current round
  const spinWheel = useCallback(() => {
    if (currentRound >= 6 || isSpinning) return;

    setIsSpinning(true);
    const stat = STAT_KEYS[currentRound];
    const bossValue = bossStats[stat] || 0;
    const teamValue = teamStats[stat] || 0;

    const { bossWeight, teamWeight } = getWeightedValues(bossValue, teamValue);
    const total = bossWeight + teamWeight;

    if (total === 0) {
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

    const bossAngle = (bossWeight / total) * 360;
    const spinRotations = 5 + Math.random() * 3;
    const finalAngle = Math.random() * 360;
    const totalRotation = spinRotations * 360 + finalAngle;

    setWheelRotation((prev) => prev + totalRotation);

    let winner: "boss" | "team" = finalAngle < bossAngle ? "boss" : "team";
    let blocked = false;
    let bonusPoints = 0;

    // Radagon block check
    if (winner === "team" && specialRules.blockTeamScoreChance > 0) {
      if (Math.random() * 100 < specialRules.blockTeamScoreChance) {
        blocked = true;
        setBattleMessages((prev) => [
          ...prev,
          `🛡️ Radagon đã chặn team ghi điểm round ${currentRound + 1}!`,
        ]);
      }
    }

    // Isshin Speed bonus
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
      spinAngle: finalAngle,
      blocked,
      bonusPoints: bonusPoints > 0 ? bonusPoints : undefined,
    };

    setTimeout(() => {
      setRoundResults((prev) => [...prev, result]);
      setCurrentRound((prev) => prev + 1);
      setIsSpinning(false);

      // Apply dynamic boss bonuses based on result
      if (winner === "boss") {
        const boostOnWin = specialRules.bossStatBoostOnWin || 0;
        if (boostOnWin > 0) {
          setDynamicBossBonus((prev) => prev + boostOnWin);
        }
        const boostOnTeamLoss = specialRules.bossStatBoostOnTeamLoss || 0;
        if (boostOnTeamLoss > 0) {
          setDynamicBossBonus((prev) => prev + boostOnTeamLoss);
        }
      }

      // Track win streak
      if (winner === "team") {
        setWinStreak((prev) => prev + 1);
      } else {
        setWinStreak(0);
      }

      // Caligo freeze after round 1
      if (boss.id === 6 && currentRound >= 0) {
        freezeRandomPlayer();
        if (winner === "boss") {
          freezeRandomPlayer(); // Extra freeze on boss win
        }
      }

      // The Collector isekai on team loss
      if (boss.id === 24 && winner === "boss") {
        isekaiRandomPlayer();
      }

      // Simon - check for removing members
      if (boss.id === 15) {
        removePlayersForSimon();
        // First team win boost
        const teamWins = roundResults.filter((r) => r.winner === "team").length;
        if (winner === "team" && teamWins === 0) {
          setDynamicBossBonus((prev) => prev + 3);
          setBattleMessages((prev) => [
            ...prev,
            `⚔️ Simon nhận +3 All Stats sau round thắng đầu tiên của team!`,
          ]);
        }
      }

      // Laerys - boost on team win
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

      // The Unblinking Gaze - give gear on loss
      if (boss.id === 25 && winner === "boss") {
        setBattleMessages((prev) => [
          ...prev,
          `📜 Một player ngẫu nhiên nhận "Văn Tế"!`,
        ]);
      }

      if (currentRound + 1 >= 6) {
        // Rolling Skeletons - check win streak
        if (boss.id === 10 && winStreak < 6 && !retryBattle) {
          setRetryBattle(true);
          setRetryPenalty(20);
          setCurrentRound(0);
          setRoundResults([]);
          setWinStreak(0);
          setBattleMessages((prev) => [
            ...prev,
            `💀 Rolling Skeletons: Không thắng 6 round liên tiếp! Đánh lại với -20 All Party Stats!`,
          ]);
        } else {
          setBattleState("finished");
        }
      }
    }, 3000);
  }, [
    currentRound, isSpinning, bossStats, teamStats, getWeightedValues,
    specialRules, boss.id, freezeRandomPlayer, isekaiRandomPlayer,
    removePlayersForSimon, roundResults, winStreak, retryBattle
  ]);

  // Start battle
  const startBattle = useCallback(() => {
    // Check for pre-battle wheel
    if (specialRules.hasPreBattleWheel && !preBattleWheelResult) {
      setBattleState("preBattle");
      setShowPreBattleWheel(true);
      return;
    }

    // Kafka hypnotize at battle start
    if (boss.id === 9) {
      hypnotizePlayer();
    }

    setBattleState("fighting");
    setCurrentRound(0);
    setRoundResults([]);
    setWheelRotation(0);
    setDynamicBossBonus(0);
    setFrozenPlayers([]);
    setRemovedPlayers([]);
    setIsekaidPlayers([]);
    setWinStreak(0);
    setRetryBattle(false);
    setRetryPenalty(0);
  }, [specialRules.hasPreBattleWheel, preBattleWheelResult, boss.id, hypnotizePlayer]);

  // Continue after pre-battle wheel
  const continueAfterPreBattleWheel = useCallback(() => {
    setShowPreBattleWheel(false);
    setBattleState("fighting");
    setCurrentRound(0);
    setRoundResults([]);
    setWheelRotation(0);
  }, []);

  // Auto-spin all rounds
  const autoFight = useCallback(() => {
    if (specialRules.hasPreBattleWheel && !preBattleWheelResult) {
      setBattleState("preBattle");
      setShowPreBattleWheel(true);
      return;
    }

    if (boss.id === 9) {
      hypnotizePlayer();
    }

    setBattleState("fighting");
    setCurrentRound(0);
    setRoundResults([]);
    setWheelRotation(0);
    setDynamicBossBonus(0);
    setFrozenPlayers([]);
    setRemovedPlayers([]);
    setIsekaidPlayers([]);

    const results: RoundResult[] = [];
    let rotation = 0;
    let dynamicBonus = 0;
    let streak = 0;

    STAT_KEYS.forEach((stat, idx) => {
      let bossValue = (bossStats[stat] || 0) + dynamicBonus;
      const teamValue = teamStats[stat] || 0;

      // Pontiff double stats
      if (boss.id === 8 && idx > 0 && idx % 2 === 0) {
        bossValue *= 2;
      }

      const { bossWeight, teamWeight } = getWeightedValues(bossValue, teamValue);
      const total = bossWeight + teamWeight;

      let winner: "boss" | "team" | "tie" = "tie";
      let spinAngle = 0;
      let blocked = false;
      let bonusPoints = 0;

      if (total > 0) {
        const bossAngle = (bossWeight / total) * 360;
        spinAngle = Math.random() * 360;
        winner = spinAngle < bossAngle ? "boss" : "team";

        // Radagon block
        if (winner === "team" && specialRules.blockTeamScoreChance > 0) {
          if (Math.random() * 100 < specialRules.blockTeamScoreChance) {
            blocked = true;
          }
        }

        // Isshin Speed bonus
        if (winner === "team" && stat === "spd" && specialRules.teamBonusOnStatWin?.stat === "spd") {
          bonusPoints = specialRules.teamBonusOnStatWin.bonusPoints;
        }
      }

      rotation += (5 + Math.random() * 3) * 360 + spinAngle;

      // Apply dynamic bonuses
      if (winner === "boss") {
        dynamicBonus += specialRules.bossStatBoostOnWin || 0;
        dynamicBonus += specialRules.bossStatBoostOnTeamLoss || 0;
        streak = 0;
      } else if (winner === "team") {
        streak++;
        // Laerys boost
        if (boss.id === 26) {
          const remainingRounds = 6 - (idx + 1);
          if (remainingRounds > 0) {
            dynamicBonus += Math.floor(60 / remainingRounds);
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
      });
    });

    setDynamicBossBonus(dynamicBonus);

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
  }, [bossStats, teamStats, getWeightedValues, specialRules, boss.id, preBattleWheelResult, hypnotizePlayer]);

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
    setCurrentPhase(1);
    setPhaseScores([]);
    setIsekaidPlayers([]);
    setWinStreak(0);
    setRetryBattle(false);
    setRetryPenalty(0);
    setBattleMessages([]);
  };

  // Handle pre-battle wheel spin
  useEffect(() => {
    if (showPreBattleWheel && !preBattleWheelResult && !preBattleWheelSpinning) {
      spinPreBattleWheel();
    }
  }, [showPreBattleWheel, preBattleWheelResult, preBattleWheelSpinning, spinPreBattleWheel]);

  const currentStat = currentRound < 6 ? STAT_KEYS[currentRound] : null;
  const currentBossValue = currentStat ? bossStats[currentStat] || 0 : 0;
  const currentTeamValue = currentStat ? teamStats[currentStat] || 0 : 0;

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
          {/* Let Me Solo Her Banner */}
          {soloHerInfo.active && soloHerInfo.soloPlayer && (
            <div className="mb-4 p-3 bg-gradient-to-r from-yellow-600/30 via-orange-600/30 to-yellow-600/30 border border-yellow-500 rounded-lg">
              <div className="text-center">
                <span className="text-yellow-400 font-bold text-lg">
                  LET ME SOLO HER MODE
                </span>
                <p className="text-yellow-300 text-sm mt-1">
                  <span className="font-bold">{soloHerInfo.soloPlayer.name}</span>{" "}
                  solo boss with x{soloHerInfo.multiplier} stats!
                </p>
              </div>
            </div>
          )}

          {/* Battle Messages */}
          {battleMessages.length > 0 && (
            <div className="mb-4 p-3 bg-gray-800/80 border border-gray-600 rounded-lg max-h-32 overflow-y-auto">
              <h4 className="text-gray-400 text-xs font-bold mb-2">Battle Log:</h4>
              {battleMessages.map((msg, idx) => (
                <p key={idx} className="text-sm text-gray-300">{msg}</p>
              ))}
            </div>
          )}

          {/* Frozen/Removed/Hypnotized Players Banner */}
          {(frozenPlayers.length > 0 || removedPlayers.length > 0 || hypnotizedPlayer || isekaidPlayers.length > 0) && (
            <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {frozenPlayers.map((fp) => (
                  <span key={fp.playerNo} className="px-2 py-1 bg-blue-500/30 rounded text-blue-300 text-xs">
                    ❄️ {fp.name} (Frozen)
                  </span>
                ))}
                {removedPlayers.map((pno) => {
                  const p = battle.playerData.find((x) => x.no === pno);
                  return (
                    <span key={pno} className="px-2 py-1 bg-red-500/30 rounded text-red-300 text-xs">
                      ⚔️ {p?.name} (Removed)
                    </span>
                  );
                })}
                {hypnotizedPlayer && (
                  <span className="px-2 py-1 bg-purple-500/30 rounded text-purple-300 text-xs">
                    🌀 {hypnotizedPlayer.name} (Hypnotized)
                  </span>
                )}
                {isekaidPlayers.map((pno) => {
                  const p = battle.playerData.find((x) => x.no === pno);
                  return (
                    <span key={pno} className="px-2 py-1 bg-gray-500/30 rounded text-gray-300 text-xs">
                      💀 {p?.name} (Isekai'd)
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pre-Battle Wheel */}
          {battleState === "preBattle" && showPreBattleWheel && (
            <div className="mb-6 p-6 bg-purple-900/30 border border-purple-500 rounded-lg text-center">
              <h3 className="text-xl font-bold text-purple-400 mb-4">Pre-Battle Wheel</h3>

              {preBattleWheelSpinning ? (
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full border-4 border-purple-500 animate-spin flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600">
                    <span className="text-white text-2xl font-bold">?</span>
                  </div>
                  <p className="mt-4 text-purple-300 animate-pulse">Spinning...</p>
                </div>
              ) : preBattleWheelResult ? (
                <div>
                  <div className="w-32 h-32 mx-auto rounded-full border-4 border-yellow-500 flex items-center justify-center bg-gradient-to-r from-yellow-600 to-orange-600">
                    <span className="text-white text-4xl font-bold">{preBattleWheelResult.number}</span>
                  </div>
                  <p className="mt-4 text-yellow-300 text-lg font-bold">{preBattleWheelResult.description}</p>
                  <button
                    onClick={continueAfterPreBattleWheel}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-lg transition-all"
                  >
                    Continue to Battle
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Special Rules Active Banner */}
          {(specialRules.bossStartingPoints !== 0 ||
            specialRules.teamStartingPoints !== 0 ||
            specialRules.teamPointsToWin !== 4 ||
            specialRules.bossPointsPerWin !== 1 ||
            specialRules.noDoubleWeight ||
            specialRules.bossAlwaysScoresPoints > 0 ||
            specialRules.blockTeamScoreChance > 0 ||
            specialRules.isMirrorScoring ||
            specialRules.isTotalStatBattle) && (
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-purple-600/30 border border-purple-500 rounded-lg">
              <div className="text-center">
                <span className="text-purple-400 font-bold text-sm">
                  SPECIAL RULES ACTIVE
                </span>
                <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs">
                  {specialRules.bossStartingPoints !== 0 && (
                    <span className="px-2 py-1 bg-red-500/30 rounded text-red-300">
                      Boss: {specialRules.bossStartingPoints > 0 ? "+" : ""}{specialRules.bossStartingPoints} starting
                    </span>
                  )}
                  {specialRules.teamStartingPoints !== 0 && (
                    <span className="px-2 py-1 bg-green-500/30 rounded text-green-300">
                      Team: {specialRules.teamStartingPoints > 0 ? "+" : ""}{specialRules.teamStartingPoints} starting
                    </span>
                  )}
                  {specialRules.teamPointsToWin !== 4 && (
                    <span className="px-2 py-1 bg-blue-500/30 rounded text-blue-300">
                      Team wins with {specialRules.teamPointsToWin} points
                    </span>
                  )}
                  {specialRules.bossPointsPerWin !== 1 && (
                    <span className="px-2 py-1 bg-orange-500/30 rounded text-orange-300">
                      Boss +{specialRules.bossPointsPerWin}/win
                    </span>
                  )}
                  {specialRules.noDoubleWeight && (
                    <span className="px-2 py-1 bg-yellow-500/30 rounded text-yellow-300">
                      No double weight
                    </span>
                  )}
                  {specialRules.bossAlwaysScoresPoints > 0 && (
                    <span className="px-2 py-1 bg-red-500/30 rounded text-red-300">
                      Boss +{specialRules.bossAlwaysScoresPoints}/round
                    </span>
                  )}
                  {specialRules.blockTeamScoreChance > 0 && (
                    <span className="px-2 py-1 bg-pink-500/30 rounded text-pink-300">
                      {specialRules.blockTeamScoreChance}% block
                    </span>
                  )}
                  {specialRules.isMirrorScoring && (
                    <span className="px-2 py-1 bg-cyan-500/30 rounded text-cyan-300">
                      Mirror Scoring
                    </span>
                  )}
                  {specialRules.isTotalStatBattle && (
                    <span className="px-2 py-1 bg-indigo-500/30 rounded text-indigo-300">
                      Total Stat Battle
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Boss Bonus Banner */}
          {dynamicBossBonus > 0 && battleState !== "idle" && (
            <div className="mb-4 p-2 bg-red-500/20 border border-red-500/50 rounded-lg text-center">
              <span className="text-red-400 text-sm">
                Boss gained <span className="font-bold text-red-300">+{dynamicBossBonus} All Stats</span> from battle effects
              </span>
            </div>
          )}

          {/* Retry Penalty Banner (Rolling Skeletons) */}
          {retryPenalty > 0 && (
            <div className="mb-4 p-2 bg-orange-500/20 border border-orange-500/50 rounded-lg text-center">
              <span className="text-orange-400 text-sm">
                RETRY: Team -<span className="font-bold text-orange-300">{retryPenalty} All Stats</span>
              </span>
            </div>
          )}

          {/* Stats Comparison Header */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-red-400 mb-2">{boss.name}</h3>
              <div className="text-3xl font-bold text-red-500">{score.boss}</div>
              <p className="text-gray-400 text-sm">Points</p>
            </div>

            <div className="flex items-center justify-center">
              <span className="text-4xl font-bold text-gray-500">VS</span>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-bold text-green-400 mb-2">
                {soloHerInfo.active && soloHerInfo.soloPlayer
                  ? soloHerInfo.soloPlayer.name
                  : `Team ${battle.teamId}`}
              </h3>
              <div className="text-3xl font-bold text-green-500">{score.team}</div>
              <p className="text-gray-400 text-sm">Points</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-6 gap-2 mb-6">
            {STAT_KEYS.map((stat, idx) => {
              const bossVal = bossStats[stat] || 0;
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
                            ? result.blocked
                              ? "border-gray-500 bg-gray-500/20"
                              : "border-green-500 bg-green-500/20"
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
                              ? result.blocked
                                ? "text-gray-400"
                                : "text-green-400"
                              : "text-gray-400"
                        }`}
                      >
                        {result.winner === "boss"
                          ? "BOSS"
                          : result.winner === "team"
                            ? result.blocked
                              ? "BLOCKED"
                              : "TEAM"
                            : "TIE"}
                        {result.bonusPoints && !result.blocked && (
                          <span className="text-yellow-400"> +{result.bonusPoints}</span>
                        )}
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

              <div className="flex justify-center gap-8 mb-4 text-sm">
                <div className="text-center">
                  <span className="text-gray-400">Boss: </span>
                  <span className="text-red-400 font-bold">{currentBossValue}</span>
                  {currentBossValue > currentTeamValue && !specialRules.noDoubleWeight && (
                    <span className="text-yellow-400 ml-1">(x2 = {currentWeighted.bossWeight})</span>
                  )}
                </div>
                <div className="text-center">
                  <span className="text-gray-400">Team: </span>
                  <span className="text-green-400 font-bold">{currentTeamValue}</span>
                  {currentTeamValue > currentBossValue && !specialRules.noDoubleWeight && (
                    <span className="text-yellow-400 ml-1">(x2 = {currentWeighted.teamWeight})</span>
                  )}
                </div>
              </div>

              <div className="relative w-64 h-64 mb-4">
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
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="absolute text-white font-bold text-sm"
                      style={{
                        transform: `rotate(${-(currentWeighted.bossWeight / (currentTotalWeight || 1)) * 180}deg) translateY(-60px)`,
                      }}
                    >
                      BOSS
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gray-800 rounded-full border-4 border-gray-600 flex items-center justify-center flex-col">
                  <span className="text-white font-bold text-xs">Weight</span>
                  <span className="text-white font-bold text-sm">
                    {currentWeighted.bossWeight} : {currentWeighted.teamWeight}
                  </span>
                </div>

                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                  <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-yellow-400" />
                </div>
              </div>

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

          {/* Battle Rules */}
          {boss.rules && boss.rules.length > 0 && battleState === "idle" && (
            <div className="mb-6 p-4 rounded-lg bg-purple-500/20 border border-purple-500/50">
              <h4 className="text-purple-400 font-bold mb-2">Battle Rules</h4>
              <ul className="text-purple-300 text-sm space-y-1">
                {boss.rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
              {ruleBonus.details.length > 0 && (
                <div className="mt-3 pt-3 border-t border-purple-500/30">
                  <h5 className="text-yellow-400 font-bold mb-1 text-sm">Applied Bonuses:</h5>
                  <ul className="text-yellow-300 text-sm space-y-1">
                    {ruleBonus.details.map((detail: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-400">→</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Idle State - Start buttons */}
          {battleState === "idle" && (
            <div className="flex flex-col items-center gap-4 mb-6">
              <p className="text-gray-400 text-center">
                Battle consists of 6 rounds, one for each stat.
                <br />
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
                  {finalWinner === "team" ? "VICTORY!" : finalWinner === "boss" ? "DEFEAT!" : "TIE!"}
                </h3>
                <p className="text-white">
                  Final Score: {score.team} - {score.boss}
                </p>
              </div>

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
              Team {battle.teamId} Members ({activePlayers.length}/{battle.playerData.length} active)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {battle.playerData.map((player) => {
                const isFrozen = frozenPlayers.some((f) => f.playerNo === player.no);
                const isRemoved = removedPlayers.includes(player.no);
                const isHypnotized = hypnotizedPlayer?.playerNo === player.no;
                const isIsekai = isekaidPlayers.includes(player.no);
                const isInactive = isFrozen || isRemoved || isHypnotized || isIsekai;

                return (
                  <div
                    key={player.no}
                    className={`bg-gray-800/80 rounded-lg p-2 border ${
                      isInactive
                        ? "border-gray-600 opacity-50"
                        : "border-gray-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-teal-400">No.{player.no}</div>
                      {isFrozen && <span className="text-xs">❄️</span>}
                      {isRemoved && <span className="text-xs">⚔️</span>}
                      {isHypnotized && <span className="text-xs">🌀</span>}
                      {isIsekai && <span className="text-xs">💀</span>}
                    </div>
                    <div className="text-white font-medium text-sm truncate">
                      {player.name}
                    </div>
                    <div className="text-gray-400 text-xs">
                      Total:{" "}
                      {player.stats.str + player.stats.spd + player.stats.dur +
                        player.stats.iq + player.stats.biq + player.stats.ma}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 bg-gray-800/50 rounded-lg p-3">
              <h5 className="text-sm font-medium text-gray-400 mb-2">
                {soloHerInfo.active && soloHerInfo.soloPlayer
                  ? `${soloHerInfo.soloPlayer.name} Solo Stats (x${soloHerInfo.multiplier})`
                  : "Team Total Stats"}
              </h5>
              <div className="grid grid-cols-6 gap-2 text-center">
                {STAT_KEYS.map((stat) => (
                  <div
                    key={stat}
                    className={`rounded px-2 py-1 ${
                      soloHerInfo.active ? "bg-yellow-600/30" : "bg-gray-700/50"
                    }`}
                  >
                    <div className="text-xs font-medium text-gray-400">
                      {stat.toUpperCase()}
                    </div>
                    <div className={`font-bold ${soloHerInfo.active ? "text-yellow-400" : "text-green-400"}`}>
                      {teamStats[stat]}
                    </div>
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
