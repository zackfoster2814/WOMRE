import { useState, useMemo } from "react";
import { PvPPlayerData, CombatResult, StepCombatState } from "../types/battleZone";
import { EffectResolver, getEffectiveRace } from "../effects/resolver";
import { getPerRoundEffects } from "../utils/combatStats";

type AfterCombatEntry = {
  player: "player1" | "player2";
  quirkName: string;
  description: string;
  wheelKey?: string;
  wheelItems?: any[];
  statMods?: any[];
  gmAction?: boolean;
};

interface UsePvPScoresParams {
  stepState: StepCombatState | null;
  stepRoundIndex: number;
  player1: PvPPlayerData | null;
  player2: PvPPlayerData | null;
  combatResult: CombatResult | null;
  battleDone: boolean;
  disabledItems: Set<string>;
  roundSpinResults: Record<string, { label: string; isSuccess: boolean }>;
  oneTrickPonyStat: Record<string, string>;
  huntersMarkStat: Record<string, string>;
  tricksterResult: Record<string, string | null>;
  raumanianSuccess: Record<string, boolean>;
  goldenCoinPoints: Record<string, number>;
  afterCombatEntries: AfterCombatEntry[];
  afterCombatSpinResults: Record<string, { label: string; isSuccess: boolean }>;
  roundtableWinnerOverride: "player1" | "player2" | null;
  /** Khi true: hoà luôn dùng tiebreaker wheel, không fallback race tier */
  alwaysTiebreakerWheel?: boolean;
  computeRoundPoints: (
    side: "player1" | "player2",
    winner: "player1" | "player2" | "tie",
    roundIdx: number,
    effects: { onWin: string[]; onLose: string[]; onTie: string[] },
    statKey?: string,
    roundsWonBefore?: number,
  ) => { pts: number; pending: boolean; color: string; autoApplied?: boolean; engineBase?: number; opponentPtsAdjust?: number };
}

export function usePvPScores({
  stepState,
  stepRoundIndex,
  player1,
  player2,
  combatResult,
  battleDone,
  disabledItems,
  roundSpinResults,
  oneTrickPonyStat,
  huntersMarkStat,
  tricksterResult,
  raumanianSuccess,
  goldenCoinPoints,
  afterCombatEntries,
  afterCombatSpinResults,
  roundtableWinnerOverride,
  alwaysTiebreakerWheel = false,
  computeRoundPoints,
}: UsePvPScoresParams) {
const stepInProgress = !!stepState && stepRoundIndex < 6;

// Kiểm tra round vừa resolve (stepRoundIndex-1) còn pending spin không
const pendingSpinsForLastRound = useMemo(() => {
  if (!stepInProgress || stepRoundIndex === 0) return false;
  const lastRoundIdx = stepRoundIndex - 1;
  const p1Effects = getPerRoundEffects(player1?.character, player1?.no, disabledItems);
  const p2Effects = getPerRoundEffects(player2?.character, player2?.no, disabledItems);
  // Tìm log theo roundIndex (không phải array index — roundLogs có thể có pre-combat log ở đầu)
  const lastRound =
    stepState?.roundLogs &&
    [...stepState.roundLogs]
      .reverse()
      .find((l) => l.roundIndex === lastRoundIdx);
  if (!lastRound) return false;
  const winner = lastRound.winner;
  // Check pending từ computeRoundPoints (Crit, Evasion, Cruelty, OTP...)
  if (computeRoundPoints("player1", winner, lastRoundIdx, p1Effects).pending)
    return true;
  if (computeRoundPoints("player2", winner, lastRoundIdx, p2Effects).pending)
    return true;
  // Check Bash/Luminescence/Scrying/Ranger-Silver chưa spin (không phải round cuối)
  if (lastRoundIdx < 5) {
    const AFTER_WIN_SPINS = ["Bash", "Luminescence", "Ranger-Silver"];
    const checkSide = (side: "player1" | "player2", effs: string[]) => {
      for (const eff of AFTER_WIN_SPINS) {
        if (
          effs.includes(eff) &&
          !roundSpinResults[`${lastRoundIdx}-${eff}-${side}`]
        )
          return true;
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
}, [
  stepInProgress,
  stepRoundIndex,
  roundSpinResults,
  player1,
  player2,
  stepState,
]);

// Compute effective scores accounting for crit/gambler/evasion/blind spins
// Rounds còn pending spin → chưa tính vào score
const effectiveScores = useMemo(() => {
  if (!combatResult) return { s1: 0, s2: 0 };
  return { s1: combatResult.player1Score, s2: combatResult.player2Score };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [
  combatResult,
  roundSpinResults,
  player1,
  player2,
  disabledItems,
  oneTrickPonyStat,
  huntersMarkStat,
  tricksterResult,
]);

// Live score: 0:0 trước combat; trong combat chỉ tính rounds đã xác nhận hết spin; sau combat dùng effectiveScores
const liveScore = useMemo(() => {
  if (battleDone) return { s1: effectiveScores.s1, s2: effectiveScores.s2 };
  if (stepState) {
    // stepState.p1Score đã bao gồm base +1 cho tất cả rounds trước (đã được patch qua patchedState).
    // Chỉ cần adjust diff cho round cuối cùng (stepRoundIndex - 1) chưa được patch vào state.
    let s1 = stepState.p1Score;
    let s2 = stepState.p2Score;
    if (player1 && player2 && stepRoundIndex > 0) {
      const lastRoundIdx = stepRoundIndex - 1;
      const lastRLog = [...stepState.roundLogs]
        .reverse()
        .find((l) => l.roundIndex === lastRoundIdx);
      if (lastRLog) {
        const p1Effs = getPerRoundEffects(player1?.character, player1?.no, disabledItems);
        const p2Effs = getPerRoundEffects(player2?.character, player2?.no, disabledItems);
        const w = lastRLog.winner;
        const p1Pts = computeRoundPoints(
          "player1",
          w,
          lastRoundIdx,
          p1Effs,
          lastRLog.statKey,
        );
        const p2Pts = computeRoundPoints(
          "player2",
          w,
          lastRoundIdx,
          p2Effs,
          lastRLog.statKey,
        );
        const p1Base = p1Pts.autoApplied
          ? p1Pts.pts
          : w === "player1"
            ? (p1Pts.engineBase ?? 1)
            : 0;
        const p2Base = p2Pts.autoApplied
          ? p2Pts.pts
          : w === "player2"
            ? (p2Pts.engineBase ?? 1)
            : 0;
        if (!p1Pts.pending) {
          s1 += p1Pts.pts - p1Base;
          if (p1Pts.opponentPtsAdjust) s2 += p1Pts.opponentPtsAdjust;
        }
        if (!p2Pts.pending) {
          s2 += p2Pts.pts - p2Base;
          if (p2Pts.opponentPtsAdjust) s1 += p2Pts.opponentPtsAdjust;
        }
      }
    }
    return { s1, s2 };
  }
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
    const oppRace = getEffectiveRace(oppChar, opponent.race);
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
    const oppNo = opponent.no;
    const oppHasInstrument = (oppChar?.weapons || []).some(
      (w: any) =>
        !w.isLost &&
        !disabledItems.has(`${oppNo}-weapon-${w?.name ?? ""}`) &&
        !(w?.name ?? "").toLowerCase().includes("không dùng được") &&
        instruments.some((i) => w.name?.includes(i)),
    );
    const oppPowers = (oppChar?.powers || [])
      .filter((p: any) => !p?.isLost)
      .filter((p: any) => {
        const pname = typeof p === "string" ? p : (p?.name ?? "");
        return !disabledItems.has(`${oppNo}-power-${pname}`);
      })
      .map((p: any) => (typeof p === "string" ? p : p.name));
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
      // PvE-only effects: skip in PvP
      if (srcName === "Misty Step Ahead") continue;
      if (srcName === "Thunder Dragon") continue;
      // customHandler effects: được xử lý riêng, không cộng ở đây
      if ((ce.effect as any).customHandler) continue;
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
  stepRoundIndex,
  effectiveScores,
  player1,
  player2,
  disabledItems,
  raumanianSuccess,
  goldenCoinPoints,
  roundSpinResults,
]);

// Tiebreaker wheel result khi 2 player cùng race và điểm bằng nhau
const [tiebreakerWheelResult, setTiebreakerWheelResult] = useState<
  "player1" | "player2" | null
>(null);

// Whether any revealed round still has a pending spin
const pendingSpins = useMemo(() => {
  if (!combatResult) return false;
  const rounds = combatResult.rounds;
  const p1Effects = getPerRoundEffects(player1?.character, player1?.no, disabledItems);
  const p2Effects = getPerRoundEffects(player2?.character, player2?.no, disabledItems);
  for (let i = 0; i < rounds.length; i++) {
    const r = rounds[i];
    if (computeRoundPoints("player1", r.winner, i, p1Effects, r.stat).pending)
      return true;
    if (computeRoundPoints("player2", r.winner, i, p2Effects, r.stat).pending)
      return true;
  }
  // Also block if any after-combat wheel entry hasn't been spun yet
  for (const entry of afterCombatEntries) {
    if (entry.wheelKey && !afterCombatSpinResults[entry.wheelKey])
      return true;
  }
  // Block if tiebreaker wheel hasn't been spun (same-race, or alwaysTiebreakerWheel mode)
  // Ngoại lệ: điểm <= 0 (cả 2 âm/0) → hoà thực sự, không cần quay
  if (combatResult && player1 && player2) {
    const { s1, s2 } = effectiveScores;
    if (s1 === s2 && !tiebreakerWheelResult) {
      if (alwaysTiebreakerWheel) return true;
      const p1Race = (player1.character as any)?.race?.race || "";
      const p2Race = (player2.character as any)?.race?.race || "";
      if (
        p1Race &&
        p2Race &&
        p1Race.toLowerCase() === p2Race.toLowerCase()
      ) {
        return true;
      }
    }
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
  huntersMarkStat,
  afterCombatEntries,
  afterCombatSpinResults,
  tiebreakerWheelResult,
  effectiveScores,
]);

// Effective winner after spins resolved
const effectiveWinner = useMemo((): "player1" | "player2" | null => {
  if (!combatResult || !player1 || !player2) return null;
  // Roundtable Hold: Tarnished thắng trận phụ → override winner về người thua được cứu
  if (roundtableWinnerOverride) return roundtableWinnerOverride;

  // Devotee auto-lose vs God/Demi-God (mạnh hơn mọi hiệu ứng kết quả khác)
  const devoteeAutoLose = (p: PvPPlayerData, opp: PvPPlayerData): boolean => {
    const archetypes: string[] = ((p.character as any)?.archetypes || []).map(
      (a: any) => (typeof a === "string" ? a : (a?.name ?? "")).toLowerCase(),
    );
    if (!archetypes.some((a) => a.includes("devotee"))) return false;
    const oppEffectiveRace = getEffectiveRace(opp.character as any);
    return (
      oppEffectiveRace === "god" ||
      oppEffectiveRace === "demi-god" ||
      oppEffectiveRace === "demi god" ||
      oppEffectiveRace === "demigod"
    );
  };
  if (devoteeAutoLose(player1, player2)) return "player2";
  if (devoteeAutoLose(player2, player1)) return "player1";

  const { s1, s2 } = effectiveScores;
  if (s1 > s2) return "player1";
  if (s2 > s1) return "player2";
  // Score bằng nhau: nếu combatResult.winner đã được set bởi Egoist/autoLose override → dùng luôn
  if (combatResult.winner) return combatResult.winner;
  // alwaysTiebreakerWheel mode: luôn dùng wheel khi hoà
  if (alwaysTiebreakerWheel) {
    return tiebreakerWheelResult; // null nếu chưa quay
  }
  // Tie: check if same race → require tiebreaker wheel
  const p1Race = (player1.character as any)?.race?.race || "";
  const p2Race = (player2.character as any)?.race?.race || "";
  if (p1Race && p2Race && p1Race.toLowerCase() === p2Race.toLowerCase()) {
    return tiebreakerWheelResult; // null nếu chưa quay
  }
  // Different race: use race tier
  return player1.raceTier <= player2.raceTier ? "player1" : "player2";
}, [
  combatResult,
  effectiveScores,
  player1,
  player2,
  roundtableWinnerOverride,
  disabledItems,
  tiebreakerWheelResult,
  alwaysTiebreakerWheel,
]);

  return {
    stepInProgress,
    pendingSpinsForLastRound,
    effectiveScores,
    liveScore,
    tiebreakerWheelResult,
    setTiebreakerWheelResult,
    pendingSpins,
    effectiveWinner,
  };
}
