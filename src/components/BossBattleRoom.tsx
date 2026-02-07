import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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

// PvE Wheel Component
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

    // Start angle: 0 degrees (3 o'clock position) - pointer is on the right
    const startAngle = 0;

    // Save context and apply rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);

    // Draw boss slice (red) - starts from right (3 o'clock)
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + bossAngle);
    ctx.closePath();
    ctx.fill();

    // Draw team slice (green)
    ctx.fillStyle = "#16a34a";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(
      centerX,
      centerY,
      radius,
      startAngle + bossAngle,
      startAngle + bossAngle + teamAngle,
    );
    ctx.closePath();
    ctx.fill();

    // Draw borders
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    // Line at start (right)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + radius * Math.cos(startAngle),
      centerY + radius * Math.sin(startAngle),
    );
    ctx.stroke();

    // Line between boss and team
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + radius * Math.cos(startAngle + bossAngle),
      centerY + radius * Math.sin(startAngle + bossAngle),
    );
    ctx.stroke();

    // Draw outer circle
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw labels (inside the rotated context so they spin with wheel)
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Boss label - centered in boss slice
    const bossLabelAngle = startAngle + bossAngle / 2;
    const labelRadius = radius * 0.6;
    ctx.fillText(
      "BOSS",
      centerX + labelRadius * Math.cos(bossLabelAngle),
      centerY + labelRadius * Math.sin(bossLabelAngle),
    );

    // Team label - centered in team slice
    const teamLabelAngle = startAngle + bossAngle + teamAngle / 2;
    ctx.fillText(
      "TEAM",
      centerX + labelRadius * Math.cos(teamLabelAngle),
      centerY + labelRadius * Math.sin(teamLabelAngle),
    );

    ctx.restore();

    // Draw center circle (outside rotation context)
    ctx.fillStyle = "#1f2937";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
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
      {/* Pointer - positioned on the right (3 o'clock), pointing LEFT into the wheel */}
      <div
        className="absolute top-1/2 right-0 -translate-y-1/2"
        style={{ zIndex: 10 }}
      >
        <div className="w-0 h-0 border-t-[15px] border-b-[15px] border-r-[25px] border-t-transparent border-b-transparent border-r-yellow-400 drop-shadow-lg" />
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
}: {
  player: PlayerData;
  isDisabled: boolean;
  onToggleDisable: () => void;
  isFrozen: boolean;
  isRemoved: boolean;
  isHypnotized: boolean;
  isIsekai: boolean;
}) => {
  const isInactive =
    isDisabled || isFrozen || isRemoved || isHypnotized || isIsekai;
  const totalStats =
    player.stats.str +
    player.stats.spd +
    player.stats.dur +
    player.stats.iq +
    player.stats.biq +
    player.stats.ma;

  return (
    <div
      className={`bg-gray-800/90 rounded-lg p-3 border-2 transition-all cursor-pointer ${
        isInactive
          ? "border-gray-600 opacity-50"
          : "border-teal-500/50 hover:border-teal-400"
      }`}
      onClick={onToggleDisable}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
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
    </div>
  );
};

export const BossBattleRoom = ({
  battle,
  onClose,
  seasonRaceCounts,
}: BossBattleRoomProps) => {
  const [battleState, setBattleState] = useState<
    "idle" | "preBattle" | "fighting" | "finished"
  >("idle");
  const [currentRound, setCurrentRound] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  // Manually disabled players
  const [manuallyDisabledPlayers, setManuallyDisabledPlayers] = useState<
    number[]
  >([]);

  // Dynamic bonuses
  const [dynamicBossBonus, setDynamicBossBonus] = useState(0);
  const [dynamicBossStatChanges, setDynamicBossStatChanges] = useState<
    Partial<BossStats>
  >({});

  // Freeze mechanics
  const [frozenPlayers, setFrozenPlayers] = useState<FrozenPlayer[]>([]);
  const [hypnotizedPlayer, setHypnotizedPlayer] =
    useState<HypnotizedPlayer | null>(null);
  const [removedPlayers, setRemovedPlayers] = useState<number[]>([]);

  // Pre-battle wheel
  const [preBattleWheelResult, setPreBattleWheelResult] = useState<{
    number: number;
    effect: string;
    description: string;
  } | null>(null);
  const [showPreBattleWheel, setShowPreBattleWheel] = useState(false);
  const [preBattleWheelSpinning, setPreBattleWheelSpinning] = useState(false);

  // Multi-phase
  const [currentPhase, setCurrentPhase] = useState(1);
  const [, setPhaseScores] = useState<{ boss: number; team: number }[]>([]);

  // Isekai'd players
  const [isekaidPlayers, setIsekaidPlayers] = useState<number[]>([]);

  // Win streak
  const [winStreak, setWinStreak] = useState(0);
  const [retryBattle, setRetryBattle] = useState(false);
  const [retryPenalty, setRetryPenalty] = useState(0);

  // Let Me Solo Her - frozen after losing a round
  const [soloHerFrozen, setSoloHerFrozen] = useState(false);

  // Total Stat Battle mode - dynamic totals with loser bonus
  const [totalStatBossTotalBonus, setTotalStatBossTotalBonus] = useState(0);
  const [totalStatTeamTotalBonus, setTotalStatTeamTotalBonus] = useState(0);
  // Base weights for Total Stat Battle (set once from round 1, used for all rounds)
  const [totalStatBaseWeights, setTotalStatBaseWeights] = useState<{boss: number, team: number} | null>(null);

  const [battleMessages, setBattleMessages] = useState<string[]>([]);

  const boss = battle.boss!;

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
    22: "jpg", // 22-1.jpg (default), also has 22-2.png
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
  const bossImagePath = `/assets/BossAsset/${boss.id}.${bossImageExtensions[boss.id] || "png"}`;

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

    if (hypnotizedPlayer && boss.id === 9) {
      const hpStats = hypnotizedPlayer.stats;
      const totalStats =
        (hpStats.str || 0) +
        (hpStats.spd || 0) +
        (hpStats.dur || 0) +
        (hpStats.iq || 0) +
        (hpStats.biq || 0) +
        (hpStats.ma || 0);
      bossBonus += Math.floor(totalStats / 6);
      details.push(`Kafka nhận stats từ ${hypnotizedPlayer.name}`);
    }

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
      }
    });

    if (preBattleWheelResult) {
      if (preBattleWheelResult.effect === "teamStartingPoints") {
        const value = parseInt(
          preBattleWheelResult.description.match(/-?\d+/)?.[0] || "0",
        );
        teamStartingPoints += value;
      }
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
      bossStatBoostOnWin,
      bossStatBoostOnTeamLoss,
      teamBonusOnStatWin: teamBonusOnStatWin
        ? {
            stat: teamBonusOnStatWin.stat,
            bonusPoints: teamBonusOnStatWin.bonusPoints || 0,
          }
        : null,
    };
  }, [boss.ruleEffects, activePlayers, bossRuleChecks, preBattleWheelResult]);

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

    if (soloHerInfo.active && soloHerInfo.soloPlayer) {
      // If solo player is frozen (lost a round), all stats become 0
      if (soloHerFrozen) {
        // Stats stay at 0
      } else {
        const player = soloHerInfo.soloPlayer;
        const mult = soloHerInfo.multiplier;
        totals.str = (player.stats.str || 0) * mult;
        totals.spd = (player.stats.spd || 0) * mult;
        totals.dur = (player.stats.dur || 0) * mult;
        totals.iq = (player.stats.iq || 0) * mult;
        totals.biq = (player.stats.biq || 0) * mult;
        totals.ma = (player.stats.ma || 0) * mult;
      }
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
    soloHerFrozen,
    ruleBonus.teamBonus,
    preBattleWheelResult,
    retryPenalty,
  ]);

  // Calculate boss stats
  const bossStats = useMemo(() => {
    let totalBonus = ruleBonus.bossBonus + dynamicBossBonus;

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
      let highestTotal = 0;
      battle.playerData.forEach((player) => {
        const total =
          (player.stats.str || 0) +
          (player.stats.spd || 0) +
          (player.stats.dur || 0) +
          (player.stats.iq || 0) +
          (player.stats.biq || 0) +
          (player.stats.ma || 0);
        if (total > highestTotal) highestTotal = total;
      });
      const multiplier = battle.playerData.length;
      const statValue = Math.floor(highestTotal / 6) * multiplier;
      return {
        str: statValue,
        spd: statValue,
        dur: statValue,
        iq: statValue,
        biq: statValue,
        ma: statValue,
      };
    }

    if (boss.id === 18) {
      const bossTotal = 240 + totalBonus * 6;
      return { str: bossTotal, spd: 0, dur: 0, iq: 0, biq: 0, ma: 0 };
    }

    const stats: BossStats = {
      str:
        (boss.stats.str || 0) + totalBonus + (dynamicBossStatChanges.str || 0),
      spd:
        (boss.stats.spd || 0) + totalBonus + (dynamicBossStatChanges.spd || 0),
      dur:
        (boss.stats.dur || 0) + totalBonus + (dynamicBossStatChanges.dur || 0),
      iq: (boss.stats.iq || 0) + totalBonus + (dynamicBossStatChanges.iq || 0),
      biq:
        (boss.stats.biq || 0) + totalBonus + (dynamicBossStatChanges.biq || 0),
      ma: (boss.stats.ma || 0) + totalBonus + (dynamicBossStatChanges.ma || 0),
    };

    if (boss.id === 8 && currentRound > 0 && currentRound % 2 === 0) {
      const effect = boss.ruleEffects?.find(
        (e) => e.type === "doubleStatsEveryNRounds",
      );
      if (effect) {
        stats.str = (stats.str || 0) * 2;
        stats.spd = (stats.spd || 0) * 2;
        stats.dur = (stats.dur || 0) * 2;
        stats.iq = (stats.iq || 0) * 2;
        stats.biq = (stats.biq || 0) * 2;
        stats.ma = (stats.ma || 0) * 2;
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
  ]);

  // Calculate battle score
  const score = useMemo(() => {
    let bossScore = specialRules.bossStartingPoints;
    let teamScore = specialRules.teamStartingPoints;

    roundResults.forEach((r) => {
      if (r.winner === "boss") {
        bossScore += specialRules.bossPointsPerWin;

        if (boss.id === 22 && currentPhase === 2 && teamScore > 0) {
          teamScore -= 1;
          bossScore -= specialRules.bossPointsPerWin;
        }
      } else if (r.winner === "team") {
        if (!r.blocked) {
          teamScore += 1;
          if (r.bonusPoints) {
            teamScore += r.bonusPoints;
          }
        }
      }

      if (specialRules.bossAlwaysScoresPoints > 0) {
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
  }, [roundResults, specialRules, boss.id, currentPhase]);

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
    return "tie";
  }, [
    battleState,
    score,
    specialRules.teamPointsToWin,
    specialRules.isMirrorScoring,
    boss.id,
    teamStats,
  ]);

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

  // Freeze a random player
  const freezeRandomPlayer = useCallback(() => {
    const immunePlayers =
      (bossRuleChecks.freezeImmunePlayers as number[]) || [];
    const freezablePlayers = activePlayers.filter(
      (p) => !immunePlayers.includes(p.no),
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

  // Isekai a random player
  const isekaiRandomPlayer = useCallback(() => {
    if (activePlayers.length > 0) {
      const randomIdx = Math.floor(Math.random() * activePlayers.length);
      const playerToIsekai = activePlayers[randomIdx];
      setIsekaidPlayers((prev) => [...prev, playerToIsekai.no]);
      setBattleMessages((prev) => [
        ...prev,
        `💀 ${playerToIsekai.name} đã bị The Collector Isekai!`,
      ]);
      setDynamicBossBonus((prev) => prev + 2);
    }
  }, [activePlayers]);

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
  const spinPreBattleWheel = useCallback(() => {
    const wheelEffect = boss.ruleEffects?.find(
      (e) => e.type === "preBattleWheel",
    );
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

  // Hypnotize player
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
    const maxRounds = specialRules.isTotalStatBattle ? specialRules.totalStatBattleRounds : 6;
    if (currentRound >= maxRounds || isSpinning) return;

    setIsSpinning(true);

    let bossValue: number;
    let teamValue: number;
    let stat: keyof BossStats;

    let bossWeight: number;
    let teamWeight: number;

    if (specialRules.isTotalStatBattle) {
      // Total Stat Battle mode - compare sum of all stats
      const baseBossTotal = (bossStats.str || 0) + (bossStats.spd || 0) + (bossStats.dur || 0) +
                           (bossStats.iq || 0) + (bossStats.biq || 0) + (bossStats.ma || 0);
      const baseTeamTotal = teamStats.str + teamStats.spd + teamStats.dur +
                           teamStats.iq + teamStats.biq + teamStats.ma;

      bossValue = baseBossTotal + totalStatBossTotalBonus;
      teamValue = baseTeamTotal + totalStatTeamTotalBonus;
      stat = "str"; // Use str as placeholder for total stat battle

      // For Total Stat Battle: use fixed base weights from round 1 for all rounds
      if (currentRound === 0 || !totalStatBaseWeights) {
        // Round 1: calculate and save base weights
        const baseWeights = getWeightedValues(baseBossTotal, baseTeamTotal);
        setTotalStatBaseWeights({ boss: baseWeights.bossWeight, team: baseWeights.teamWeight });
        bossWeight = baseWeights.bossWeight;
        teamWeight = baseWeights.teamWeight;
      } else {
        // Subsequent rounds: use saved base weights
        bossWeight = totalStatBaseWeights.boss;
        teamWeight = totalStatBaseWeights.team;
      }
    } else {
      stat = STAT_KEYS[currentRound];
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

    const bossAngle = (bossWeight / total) * 360;
    const spinRotations = 5 + Math.random() * 3;
    // pointerPosition is where pointer will land (0 = start of boss slice at 3 o'clock)
    const pointerPosition = Math.random() * 360;
    // Determine winner first
    let winner: "boss" | "team" = pointerPosition < bossAngle ? "boss" : "team";
    // spinAngle makes wheel stop at correct position
    // After rotating R degrees, pointer points to (360 - R % 360) % 360
    // So to land at pointerPosition, we need R % 360 = (360 - pointerPosition) % 360
    const spinAngle = (360 - pointerPosition + 360) % 360;
    const totalRotation = spinRotations * 360 + spinAngle;
    const newWheelRotation = wheelRotation + totalRotation;

    // Animate rotation
    const startRotation = wheelRotation;
    const startTime = Date.now();
    const duration = 3000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + totalRotation * easeOut;
      setWheelRotation(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    let blocked = false;
    let bonusPoints = 0;

    if (winner === "team" && specialRules.blockTeamScoreChance > 0) {
      if (Math.random() * 100 < specialRules.blockTeamScoreChance) {
        blocked = true;
        setBattleMessages((prev) => [
          ...prev,
          `🛡️ Radagon đã chặn team ghi điểm round ${currentRound + 1}!`,
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
      spinAngle: pointerPosition,
      blocked,
      bonusPoints: bonusPoints > 0 ? bonusPoints : undefined,
      wheelRotation: newWheelRotation,
    };

    setTimeout(() => {
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
        // Total Stat Battle - loser gets +80 total stat bonus
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
        // Total Stat Battle - loser gets +80 total stat bonus
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

      // Let Me Solo Her - freeze solo player if they lose a round
      if (soloHerInfo.active && winner === "boss" && !soloHerFrozen) {
        setSoloHerFrozen(true);
        setBattleMessages((prev) => [
          ...prev,
          `❄️ ${soloHerInfo.soloPlayer?.name} đã bị đóng băng! Stats = 0 cho các round còn lại.`,
        ]);
      }

      if (boss.id === 6 && currentRound >= 0) {
        freezeRandomPlayer();
        if (winner === "boss") {
          freezeRandomPlayer();
        }
      }

      if (boss.id === 24 && winner === "boss") {
        isekaiRandomPlayer();
      }

      if (boss.id === 15) {
        removePlayersForSimon();
        const teamWins = roundResults.filter((r) => r.winner === "team").length;
        if (winner === "team" && teamWins === 0) {
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
        // Pick a random player to receive "Văn Tế"
        if (activePlayers.length > 0) {
          const randomIdx = Math.floor(Math.random() * activePlayers.length);
          const selectedPlayer = activePlayers[randomIdx];
          setBattleMessages((prev) => [
            ...prev,
            `📜 ${selectedPlayer.name} nhận "Văn Tế"!`,
          ]);
        }
      }

      // Check for early win condition (customWinCondition)
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

      const maxRounds = specialRules.isTotalStatBattle ? specialRules.totalStatBattleRounds : 6;
      if (currentRound + 1 >= maxRounds) {
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
        } else if (boss.id === 22 && currentPhase === 1 && score.team >= 4) {
          // Aatrox phase transition - team won phase 1, move to phase 2
          setCurrentPhase(2);
          setPhaseScores((prev) => [
            ...prev,
            { boss: score.boss, team: score.team },
          ]);
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
    }, 3000);
  }, [
    currentRound,
    isSpinning,
    bossStats,
    teamStats,
    getWeightedValues,
    specialRules,
    boss.id,
    freezeRandomPlayer,
    isekaiRandomPlayer,
    removePlayersForSimon,
    roundResults,
    winStreak,
    retryBattle,
    wheelRotation,
    currentPhase,
    score,
    soloHerInfo,
    soloHerFrozen,
    totalStatBossTotalBonus,
    totalStatTeamTotalBonus,
  ]);

  // Start battle
  const startBattle = useCallback(() => {
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
    setWinStreak(0);
    setRetryBattle(false);
    setRetryPenalty(0);
    setSelectedRound(null);
    setTotalStatBossTotalBonus(0);
    setTotalStatTeamTotalBonus(0);
    setTotalStatBaseWeights(null);
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
    setSelectedRound(null);
    setTotalStatBossTotalBonus(0);
    setTotalStatTeamTotalBonus(0);
    setTotalStatBaseWeights(null);

    const results: RoundResult[] = [];
    let rotation = 0;
    let dynamicBonus = 0;
    let streak = 0;

    // Total Stat Battle mode
    if (specialRules.isTotalStatBattle) {
      const totalRounds = specialRules.totalStatBattleRounds || 7;
      const baseBossTotal = (bossStats.str || 0) + (bossStats.spd || 0) + (bossStats.dur || 0) +
                           (bossStats.iq || 0) + (bossStats.biq || 0) + (bossStats.ma || 0);
      const baseTeamTotal = teamStats.str + teamStats.spd + teamStats.dur +
                           teamStats.iq + teamStats.biq + teamStats.ma;

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
          const bossAngle = (fixedBossWeight / total) * 360;
          // pointerPosition is where pointer will land (0 = start of boss slice)
          const pointerPosition = Math.random() * 360;
          winner = pointerPosition < bossAngle ? "boss" : "team";
          // spinAngle makes wheel stop at correct position
          spinAngle = (360 - pointerPosition + 360) % 360;
        }

        // Add extra full rotations + spinAngle
        rotation += (5 + Math.random() * 3) * 360 + spinAngle;

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
      STAT_KEYS.forEach((stat, idx) => {
        let bossValue = (bossStats[stat] || 0) + dynamicBonus;
        const teamValue = teamStats[stat] || 0;

        if (boss.id === 8 && idx > 0 && idx % 2 === 0) {
          bossValue *= 2;
        }

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
          const bossAngle = (bossWeight / total) * 360;
          // pointerPosition is where pointer will land on wheel (0 = start of boss slice at 3 o'clock)
          const pointerPosition = Math.random() * 360;
          winner = pointerPosition < bossAngle ? "boss" : "team";
          // To make pointer land at pointerPosition after rotation:
          // After rotating R degrees, pointer points to (360 - R % 360) % 360
          // So we need (360 - R % 360) % 360 = pointerPosition
          // Which means R % 360 = (360 - pointerPosition) % 360
          spinAngle = (360 - pointerPosition + 360) % 360;

          if (winner === "team" && specialRules.blockTeamScoreChance > 0) {
            if (Math.random() * 100 < specialRules.blockTeamScoreChance) {
              blocked = true;
            }
          }

          if (
            winner === "team" &&
            stat === "spd" &&
            specialRules.teamBonusOnStatWin?.stat === "spd"
          ) {
            bonusPoints = specialRules.teamBonusOnStatWin.bonusPoints;
          }
        }

        // Add extra full rotations + spinAngle to reach target position
        rotation += (5 + Math.random() * 3) * 360 + spinAngle;

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

        results.push({
          stat,
          bossValue,
          teamValue,
          winner,
          spinAngle,
          blocked,
          bonusPoints: bonusPoints > 0 ? bonusPoints : undefined,
          wheelRotation: rotation,
        });
      });

      setDynamicBossBonus(dynamicBonus);
    }

    const maxRounds = specialRules.isTotalStatBattle ? specialRules.totalStatBattleRounds : 6;
    let round = 0;
    const spinDuration = 2000; // 2 seconds per spin

    const animateRound = () => {
      if (round >= maxRounds) {
        setBattleState("finished");
        return;
      }

      setCurrentRound(round);
      setIsSpinning(true);

      const startRotation = round === 0 ? 0 : results[round - 1].wheelRotation;
      const endRotation = results[round].wheelRotation;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentRotation =
          startRotation + (endRotation - startRotation) * easeOut;
        setWheelRotation(currentRotation);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Spin complete, show result
          setRoundResults(results.slice(0, round + 1));
          setIsSpinning(false);

          const currentResult = results[round];

          // Apply boss-specific effects
          if (boss.id === 6) {
            // Caligo freeze effect
            freezeRandomPlayer();
            if (currentResult.winner === "boss") {
              freezeRandomPlayer();
            }
          }

          if (boss.id === 24 && currentResult.winner === "boss") {
            // Collector isekai effect
            isekaiRandomPlayer();
          }

          if (boss.id === 25 && currentResult.winner === "boss") {
            // Văn Tế effect - pick random player
            const currentActivePlayers = battle.playerData.filter(
              (p) =>
                !frozenPlayers.some((f) => f.playerNo === p.no) &&
                !removedPlayers.includes(p.no) &&
                !isekaidPlayers.includes(p.no),
            );
            if (currentActivePlayers.length > 0) {
              const randomIdx = Math.floor(
                Math.random() * currentActivePlayers.length,
              );
              const selectedPlayer = currentActivePlayers[randomIdx];
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
    isekaiRandomPlayer,
    battle.playerData,
    frozenPlayers,
    removedPlayers,
    isekaidPlayers,
  ]);

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
    setSelectedRound(null);
    setSoloHerFrozen(false);
    setTotalStatBossTotalBonus(0);
    setTotalStatTeamTotalBonus(0);
    setTotalStatBaseWeights(null);
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
          rotation: wheelRotation
        };
      }

      let bossValue: number;
      let teamValue: number;

      if (specialRules.isTotalStatBattle) {
        // Total Stat Battle mode - compare sum of all stats (first round, no saved weights yet)
        const baseBossTotal = (bossStats.str || 0) + (bossStats.spd || 0) + (bossStats.dur || 0) +
                             (bossStats.iq || 0) + (bossStats.biq || 0) + (bossStats.ma || 0);
        const baseTeamTotal = teamStats.str + teamStats.spd + teamStats.dur +
                             teamStats.iq + teamStats.biq + teamStats.ma;
        bossValue = baseBossTotal;
        teamValue = baseTeamTotal;
      } else if (currentStat) {
        bossValue = bossStats[currentStat] || 0;
        teamValue = teamStats[currentStat] || 0;
      } else {
        return { bossWeight: 50, teamWeight: 50, rotation: 0 };
      }

      const { bossWeight, teamWeight } = getWeightedValues(bossValue, teamValue);
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
      onClick={onClose}
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
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6 text-lg">
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
              onClick={onClose}
              className="text-white/70 hover:text-white text-3xl font-light transition-colors ml-4"
            >
              &times;
            </button>
          </div>
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

            {/* Battle Messages */}
            {battleMessages.length > 0 && (
              <div className="mt-4 bg-gray-800/80 rounded-lg p-3 border border-gray-700 max-h-32 overflow-y-auto">
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
                      {specialRules.isTotalStatBattle ? `R${i + 1}` : (i < 6 ? STAT_LABELS[STAT_KEYS[i]] : `R${i + 1}`)}
                    </button>
                  );
                })}
              </div>

              {/* Wheel */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <PvEWheel
                  bossWeight={wheelValues.bossWeight}
                  teamWeight={wheelValues.teamWeight}
                  rotation={wheelValues.rotation}
                  isSpinning={isSpinning}
                />

                {/* Current Round Info */}
                {battleState === "fighting" && !isSpinning && (currentStat || specialRules.isTotalStatBattle) && (
                  <div className="mt-4 text-center">
                    <div className="text-lg font-bold text-white mb-2">
                      {specialRules.isTotalStatBattle
                        ? `Round ${currentRound + 1}: Tổng Stat`
                        : `Round ${currentRound + 1}: ${STAT_FULL_LABELS[currentStat!]}`}
                    </div>
                    <div className="flex justify-center gap-8 text-sm">
                      {specialRules.isTotalStatBattle ? (
                        <>
                          <div>
                            <span className="text-gray-400">Boss Total: </span>
                            <span className="text-red-400 font-bold">
                              {((bossStats.str || 0) + (bossStats.spd || 0) + (bossStats.dur || 0) +
                                (bossStats.iq || 0) + (bossStats.biq || 0) + (bossStats.ma || 0)) + totalStatBossTotalBonus}
                            </span>
                            {totalStatBossTotalBonus > 0 && (
                              <span className="text-yellow-400 ml-1">(+{totalStatBossTotalBonus})</span>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-400">Team Total: </span>
                            <span className="text-green-400 font-bold">
                              {(teamStats.str + teamStats.spd + teamStats.dur +
                                teamStats.iq + teamStats.biq + teamStats.ma) + totalStatTeamTotalBonus}
                            </span>
                            {totalStatTeamTotalBonus > 0 && (
                              <span className="text-yellow-400 ml-1">(+{totalStatTeamTotalBonus})</span>
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
                                <span className="text-yellow-400 ml-1">(x2)</span>
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
                                <span className="text-yellow-400 ml-1">(x2)</span>
                              )}
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={spinWheel}
                      className="mt-4 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold rounded-lg transition-all transform hover:scale-105"
                    >
                      Spin!
                    </button>
                  </div>
                )}

                {/* Selected Round Info */}
                {selectedRound !== null && displayResult && (
                  <div className="mt-4 text-center">
                    <div className="text-lg font-bold text-yellow-400 mb-2">
                      Round {selectedRound + 1}:{" "}
                      {specialRules.isTotalStatBattle ? "Tổng Stat" : STAT_FULL_LABELS[displayResult.stat]}
                    </div>
                    <div className="flex justify-center gap-8 text-sm">
                      <div>
                        <span className="text-gray-400">{specialRules.isTotalStatBattle ? "Boss Total: " : "Boss: "}</span>
                        <span className="text-red-400 font-bold">
                          {displayResult.bossValue}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">{specialRules.isTotalStatBattle ? "Team Total: " : "Team: "}</span>
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
                        ? "BOSS WIN"
                        : displayResult.winner === "team"
                          ? displayResult.blocked
                            ? "BLOCKED"
                            : "TEAM WIN"
                          : "TIE"}
                    </div>
                    <button
                      onClick={() => setSelectedRound(null)}
                      className="mt-2 px-4 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-all"
                    >
                      Back to Current
                    </button>
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
                        Manual Battle
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

                {/* Spinning State */}
                {isSpinning && (
                  <div className="mt-4 text-yellow-400 font-medium animate-pulse">
                    Spinning...
                  </div>
                )}

                {/* Pre-Battle Wheel */}
                {battleState === "preBattle" && showPreBattleWheel && (
                  <div className="mt-4 text-center">
                    {preBattleWheelSpinning ? (
                      <div className="text-purple-400 animate-pulse">
                        Pre-Battle Wheel Spinning...
                      </div>
                    ) : preBattleWheelResult ? (
                      <div>
                        <div className="text-yellow-400 font-bold">
                          Result: {preBattleWheelResult.number}
                        </div>
                        <div className="text-gray-300">
                          {preBattleWheelResult.description}
                        </div>
                        <button
                          onClick={continueAfterPreBattleWheel}
                          className="mt-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg"
                        >
                          Continue
                        </button>
                      </div>
                    ) : null}
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
                    <button
                      onClick={resetBattle}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-lg"
                    >
                      Battle Again
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Player Cards */}
            <div className="flex-1 min-h-0 overflow-y-auto">
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
                  />
                ))}
              </div>

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
    </div>
  );
};
