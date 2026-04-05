import { Dispatch, MutableRefObject, SetStateAction } from "react";
import { Character, CharacterStats } from "../types/character";
import { EffectResolver } from "../effects/resolver";
import { EffectRegistry } from "../effects/registry";
import { HandlerRegistry } from "../effects/handlers";
import {
  PvPPlayerData,
  CombatResult,
  StepCombatState,
  CarryOverEffect,
} from "../types/battleZone";
import { STAT_ORDER, _ALL_STAT_KEYS } from "../constants/battleZone";
import { type WheelSpinItem } from "../components/ProbabilityWheelModal";
import {
  calcStatsWithDisabled,
  buildInventoryList,
} from "../utils/combatStats";
import { AFTER_COMBAT_WHEEL_ITEMS } from "../constants/wheelConfigs";
import { type AfterCombatEntry } from "./useWheelSpins";

export const POWER_RANGER_STAT_WHEEL_ITEMS: WheelSpinItem[] = [
  { label: "+1 Strength", weight: 1, isSuccess: true, color: "#ef4444", meta: { stat: "str", delta: 1 } },
  { label: "+1 Speed", weight: 1, isSuccess: true, color: "#3b82f6", meta: { stat: "spd", delta: 1 } },
  { label: "+1 Durability", weight: 1, isSuccess: true, color: "#84cc16", meta: { stat: "dur", delta: 1 } },
  { label: "+1 IQ", weight: 1, isSuccess: true, color: "#06b6d4", meta: { stat: "iq", delta: 1 } },
  { label: "+1 BIQ", weight: 1, isSuccess: true, color: "#a855f7", meta: { stat: "biq", delta: 1 } },
  { label: "+1 Martial Arts", weight: 1, isSuccess: true, color: "#f97316", meta: { stat: "ma", delta: 1 } },
];

export const PVP_REWARD_WHEEL_ITEMS: WheelSpinItem[] = [
  { label: "+1 Strength", weight: 10, isSuccess: true, color: "#ef4444", meta: { stat: "str", delta: 1 } },
  { label: "+1 Speed", weight: 10, isSuccess: true, color: "#3b82f6", meta: { stat: "spd", delta: 1 } },
  { label: "+1 Durability", weight: 10, isSuccess: true, color: "#84cc16", meta: { stat: "dur", delta: 1 } },
  { label: "+1 IQ", weight: 10, isSuccess: true, color: "#06b6d4", meta: { stat: "iq", delta: 1 } },
  { label: "+1 BIQ", weight: 10, isSuccess: true, color: "#a855f7", meta: { stat: "biq", delta: 1 } },
  { label: "+1 MA", weight: 10, isSuccess: true, color: "#f97316", meta: { stat: "ma", delta: 1 } },
  { label: "Nhận 1 Gear", weight: 10, isSuccess: true, color: "#fbbf24", meta: { gmAction: "gear" } },
  { label: "+2 Stat Thấp Nhất", weight: 6, isSuccess: true, color: "#34d399", meta: { gmAction: "lowest2" } },
  { label: "+2 Stat Cao Nhất", weight: 6, isSuccess: true, color: "#f472b6", meta: { gmAction: "highest2" } },
  { label: "Nhận 1 Power", weight: 6, isSuccess: true, color: "#818cf8", meta: { gmAction: "power1" } },
  { label: "Nhận 2 Power", weight: 2, isSuccess: true, color: "#c084fc", meta: { gmAction: "power2" } },
  { label: "Nhận 1 Char Dev", weight: 4, isSuccess: true, color: "#fb923c", meta: { gmAction: "chardev1" } },
  { label: "Nhận 2 Char Dev", weight: 1, isSuccess: true, color: "#f87171", meta: { gmAction: "chardev2" } },
  { label: "+2 Stat ngẫu nhiên ×3", weight: 0.64, isSuccess: true, color: "#4ade80", meta: { gmAction: "rand2x3" } },
  { label: "+2 Stat ngẫu nhiên ×6", weight: 0.36, isSuccess: true, color: "#86efac", meta: { gmAction: "rand2x6" } },
  { label: "+1 All Stats", weight: 4, isSuccess: true, color: "#e2e8f0", meta: { gmAction: "allstats1" } },
  { label: "Lời Nguyền Địa Ngục", weight: 3, isSuccess: false, color: "#7c3aed", meta: { gmAction: "loi_nguyen_dia_nguc" } },
];

export interface UseResolveNextRoundParams {
  // State reads
  player1: PvPPlayerData | null;
  player2: PvPPlayerData | null;
  stepState: StepCombatState | null;
  stepRoundIndex: number;
  disabledItems: Set<string>;
  allPlayers: PvPPlayerData[];
  isTournamentMode: boolean;
  roundtableSubMode: boolean;
  zoltraakBiq2Pending: boolean;
  oneTrickPonyStat: Record<string, string>;
  huntersMarkStat: Record<string, string>;
  tricksterResult: Record<string, string | null>;
  roundSpinResults: Record<string, { label: string; isSuccess: boolean }>;
  afterCombatSpinResults: Record<
    string,
    { label: string; isSuccess: boolean; meta?: Record<string, unknown> }
  >;
  // Setters
  setAfterCombatEntries: Dispatch<SetStateAction<AfterCombatEntry[]>>;
  setAfterCombatSpinResults: Dispatch<
    SetStateAction<
      Record<
        string,
        { label: string; isSuccess: boolean; meta?: Record<string, unknown> }
      >
    >
  >;
  setCombatResult: Dispatch<SetStateAction<CombatResult | null>>;
  setCurrentRound: Dispatch<SetStateAction<number>>;
  setStepRoundIndex: Dispatch<SetStateAction<number>>;
  setStepState: Dispatch<SetStateAction<StepCombatState | null>>;
  setZoltraakBiq2Pending: Dispatch<SetStateAction<boolean>>;
  // Refs
  pendingAfterCombatBuildRef: MutableRefObject<any>;
  pendingCrueltyAfterCombatRef: MutableRefObject<any>;
  pendingFinalizeStateRef: MutableRefObject<any>;
  preBiqFiredHandlersRef: MutableRefObject<{
    p1: Set<string>;
    p2: Set<string>;
  } | null>;
  // Functions
  spawnStatBubbles: (
    bubbles: Array<{
      player: "player1" | "player2";
      text: string;
      isPositive: boolean;
    }>,
  ) => void;
  getPerRoundEffects: (
    char: Character | undefined,
    playerNo?: number,
  ) => { onWin: string[]; onLose: string[]; onTie: string[] };
  computeRoundPoints: (
    side: "player1" | "player2",
    winner: "player1" | "player2" | "tie",
    roundIdx: number,
    effects: { onWin: string[]; onLose: string[]; onTie: string[] },
    statKey?: string,
    roundsWonBefore?: number,
  ) => {
    pts: number;
    pending: boolean;
    color: string;
    autoApplied?: boolean;
    engineBase?: number;
  };
  EffectRegistry: typeof EffectRegistry;
  EffectResolver: typeof EffectResolver;
  computeRoundStep: (
    roundIndex: number,
    state: StepCombatState,
    p1: PvPPlayerData,
    p2: PvPPlayerData,
    otpStats?: Record<string, string>,
    hmStats?: Record<string, string>,
    forcedWinner?: "player1" | "player2" | null,
  ) => { newState: StepCombatState; log: any };
  /** Wheel mode: nếu set, round này dùng winner từ vòng quay thay vì so sánh stat */
  wheelForcedWinner?: "player1" | "player2" | null;
  checkAndSetRoundtableHold: (result: CombatResult) => boolean;
}

export function useResolveNextRound(params: UseResolveNextRoundParams) {
  const resolveNextRound = () => {
    const {
      player1,
      player2,
      stepState,
      stepRoundIndex,
      disabledItems,
      allPlayers,
      roundtableSubMode,
      zoltraakBiq2Pending,
      oneTrickPonyStat,
      huntersMarkStat,
      tricksterResult,
      roundSpinResults,
      setAfterCombatEntries,
      setAfterCombatSpinResults,
      setCombatResult,
      setCurrentRound,
      setStepRoundIndex,
      setStepState,
      setZoltraakBiq2Pending,
      pendingAfterCombatBuildRef,
      pendingCrueltyAfterCombatRef,
      pendingFinalizeStateRef,
      preBiqFiredHandlersRef,
      spawnStatBubbles,
      getPerRoundEffects,
      computeRoundPoints,
      EffectRegistry,
      EffectResolver,
      computeRoundStep,
      checkAndSetRoundtableHold,
      wheelForcedWinner,
    } = params;
    if (!stepState || !player1 || !player2 || stepRoundIndex >= 6) return;
    // Khi zoltraakBiq2Pending=true (stepRoundIndex giữ ở 4), check BIQ lần 1 pending trước
    if (zoltraakBiq2Pending) {
      const p1Effs = getPerRoundEffects(player1.character, player1.no);
      const p2Effs = getPerRoundEffects(player2.character, player2.no);
      const biqRound = [...stepState.roundLogs]
        .reverse()
        .find((l) => l.roundIndex === 4);
      if (biqRound) {
        const w = biqRound.winner;
        if (
          computeRoundPoints("player1", w, 4, p1Effs, biqRound.statKey).pending
        )
          return;
        if (
          computeRoundPoints("player2", w, 4, p2Effs, biqRound.statKey).pending
        )
          return;
        const SPINS = ["Bash", "Luminescence", "Ranger-Silver"];
        const p1WinEffs = w === "player1" ? p1Effs.onWin : [];
        const p2WinEffs = w === "player2" ? p2Effs.onWin : [];
        for (const eff of SPINS) {
          if (p1WinEffs.includes(eff) && !roundSpinResults[`4-${eff}-player1`])
            return;
          if (p2WinEffs.includes(eff) && !roundSpinResults[`4-${eff}-player2`])
            return;
        }
      }
    }
    // Block pending spins được xử lý ở BattleWheelSpinner (hasCurrentPendingSpins)
    // → không cần block ở đây nữa

    // Patch score round trước dựa vào spin results (Gambler, Crit, Evasion...)
    // computeRoundStep luôn dùng điểm base (+1), spin results được apply ở đây
    let patchedState = stepState;
    if (stepRoundIndex > 0) {
      const lastRoundIdx = stepRoundIndex - 1;
      const lastRound = [...stepState.roundLogs]
        .reverse()
        .find((l) => l.roundIndex === lastRoundIdx);
      if (lastRound) {
        const w = lastRound.winner;
        const p1Effs = getPerRoundEffects(player1.character, player1.no);
        const p2Effs = getPerRoundEffects(player2.character, player2.no);
        const p1Pts = computeRoundPoints(
          "player1",
          w,
          lastRoundIdx,
          p1Effs,
          lastRound.statKey,
        );
        const p2Pts = computeRoundPoints(
          "player2",
          w,
          lastRoundIdx,
          p2Effs,
          lastRound.statKey,
        );
        // engineBase: điểm engine đã tính (1 + effects trong computeRoundStep như Divine Smite)
        // diff = pts - engineBase → chỉ patch phần Yamato Blade / Bloodthirsty chưa được engine tính
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
        const p1Diff = p1Pts.pts - p1Base + (p2Pts.opponentPtsAdjust ?? 0);
        const p2Diff = p2Pts.pts - p2Base + (p1Pts.opponentPtsAdjust ?? 0);
        if (p1Diff !== 0 || p2Diff !== 0) {
          console.log(
            `[Patch1] R${lastRoundIdx + 1} stat=${lastRound.statKey} winner=${w}: p1Diff=${p1Diff}(pts=${p1Pts.pts},engineBase=${p1Base}) p2Diff=${p2Diff}(pts=${p2Pts.pts},engineBase=${p2Base}) | before p1=${patchedState.p1Score} p2=${patchedState.p2Score} → after p1=${patchedState.p1Score + p1Diff} p2=${patchedState.p2Score + p2Diff}`,
          );
          patchedState = {
            ...patchedState,
            p1Score: patchedState.p1Score + p1Diff,
            p2Score: patchedState.p2Score + p2Diff,
          };
        }

        // The Sand of Time: winner nhận pts=0 từ computeRoundPoints khi Sand thành công
        // → p(winner)Base = 1, p(winner)Pts.pts = 0, diff = -1 → patchedState.p(winner)Score - 1

        // Metamagic: nếu round BIQ hòa nhưng Cruelty quyết định người thắng → thắng Cruelty cũng nhận +1 Metamagic
        if (lastRound.statKey === "biq" && w === "tie") {
          const p1CrueltySpun = roundSpinResults[`${lastRoundIdx}-Cruelty-player1`];
          const p2CrueltySpun = roundSpinResults[`${lastRoundIdx}-Cruelty-player2`];
          // Xác định ai thực sự thắng BIQ qua Cruelty
          const crueltyWinner: "player1" | "player2" | null =
            p1CrueltySpun?.isSuccess === true || p2CrueltySpun?.isSuccess === false
              ? "player1"
              : p2CrueltySpun?.isSuccess === true || p1CrueltySpun?.isSuccess === false
                ? "player2"
                : null;
          if (crueltyWinner) {
            const hasMetamagic = (player: typeof player1) =>
              (player.character?.powers || []).some(
                (pw: any) =>
                  !pw?.isLost &&
                  (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() === "metamagic",
              ) && !disabledItems.has(`${player.no}-power-Metamagic`);
            if (crueltyWinner === "player1" && hasMetamagic(player1)) {
              patchedState = { ...patchedState, p1Score: patchedState.p1Score + 1 };
            }
            if (crueltyWinner === "player2" && hasMetamagic(player2)) {
              patchedState = { ...patchedState, p2Score: patchedState.p2Score + 1 };
            }
          }
        }

        // Patch stat round trước dựa vào spin kết quả mang tính permanent (ví dụ Ranger Blue: +3 Speed)
        // Lưu ý: create a simple helper to apply stats without pushing duplicate events to logs
        let newP1Stats = { ...patchedState.p1Stats };
        let newP2Stats = { ...patchedState.p2Stats };
        let statsChanged = false;

        const applySpinStat = (
          side: "player1" | "player2",
          effName: string,
          statKey: keyof CharacterStats,
          amount: number,
        ) => {
          const spun = roundSpinResults[`${lastRoundIdx}-${effName}-${side}`];
          if (spun && spun.isSuccess) {
            if (side === "player1") newP1Stats[statKey] += amount;
            else newP2Stats[statKey] += amount;
            statsChanged = true;
          }
        };

        if (
          w === "player1" &&
          p1Effs.onWin.includes("Ranger-Blue") &&
          lastRound.statKey === "spd"
        ) {
          applySpinStat("player1", "Ranger-Blue", "spd", 3);
        }
        if (
          w === "player2" &&
          p2Effs.onWin.includes("Ranger-Blue") &&
          lastRound.statKey === "spd"
        ) {
          applySpinStat("player2", "Ranger-Blue", "spd", 3);
        }

        if (statsChanged) {
          patchedState = {
            ...patchedState,
            p1Stats: newP1Stats,
            p2Stats: newP2Stats,
          };
        }

        // Ranger-Silver: nếu spin thành công → thêm carry-over vào patchedState cho round tiếp theo
        if (lastRoundIdx < 5) {
          const addSilverCarryOver = (
            side: "player1" | "player2",
            effs: string[],
          ) => {
            if (!effs.includes("Ranger-Silver")) return;
            const spun =
              roundSpinResults[`${lastRoundIdx}-Ranger-Silver-${side}`];
            if (!spun?.isSuccess) return;
            const currentCarry =
              side === "player1"
                ? patchedState.p1CarryOver
                : patchedState.p2CarryOver;
            const alreadyAdded = currentCarry.some(
              (co) => co.source === "Ranger-Silver",
            );
            if (alreadyAdded) return;
            const nextStatKey = STAT_ORDER[lastRoundIdx + 1]
              ?.key as keyof CharacterStats;
            if (!nextStatKey) return;
            const stats =
              side === "player1" ? patchedState.p1Stats : patchedState.p2Stats;
            const statValue = (stats[nextStatKey] as number) || 0;
            const newCarry: CarryOverEffect = {
              player: side,
              source: "Ranger-Silver",
              stat: nextStatKey,
              value: statValue,
              description: `Silver Ranger: gấp đôi ${String(nextStatKey).toUpperCase()} round kế (+${statValue})`,
            };
            if (side === "player1") {
              patchedState = {
                ...patchedState,
                p1CarryOver: [...patchedState.p1CarryOver, newCarry],
              };
            } else {
              patchedState = {
                ...patchedState,
                p2CarryOver: [...patchedState.p2CarryOver, newCarry],
              };
            }
          };
          addSilverCarryOver("player1", w === "player1" ? p1Effs.onWin : []);
          addSilverCarryOver("player2", w === "player2" ? p2Effs.onWin : []);
        }
      }
    }

    // Khi BIQ×2 click (zoltraakBiq2Pending=true, stepRoundIndex=4):
    // patchedState đã patch round 3 (IQ) nhưng cần patch thêm BIQ×1 (round 4) spin results
    if (zoltraakBiq2Pending && stepRoundIndex === 4) {
      const biqRound = [...stepState.roundLogs]
        .reverse()
        .find((l) => l.roundIndex === 4);
      if (biqRound) {
        const w = biqRound.winner;
        const p1Effs = getPerRoundEffects(player1.character, player1.no);
        const p2Effs = getPerRoundEffects(player2.character, player2.no);
        const p1Pts = computeRoundPoints(
          "player1",
          w,
          4,
          p1Effs,
          biqRound.statKey,
        );
        const p2Pts = computeRoundPoints(
          "player2",
          w,
          4,
          p2Effs,
          biqRound.statKey,
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
        const p1Diff = p1Pts.pts - p1Base + (p2Pts.opponentPtsAdjust ?? 0);
        const p2Diff = p2Pts.pts - p2Base + (p1Pts.opponentPtsAdjust ?? 0);
        if (p1Diff !== 0 || p2Diff !== 0) {
          patchedState = {
            ...patchedState,
            p1Score: patchedState.p1Score + p1Diff,
            p2Score: patchedState.p2Score + p2Diff,
          };
        }
        // Metamagic: nếu round BIQ (Zoltraak BIQ×2, index 4) hòa nhưng Cruelty quyết định người thắng
        if (biqRound.statKey === "biq" && w === "tie") {
          const p1CrueltySpun = roundSpinResults[`4-Cruelty-player1`];
          const p2CrueltySpun = roundSpinResults[`4-Cruelty-player2`];
          const crueltyWinner: "player1" | "player2" | null =
            p1CrueltySpun?.isSuccess === true || p2CrueltySpun?.isSuccess === false
              ? "player1"
              : p2CrueltySpun?.isSuccess === true || p1CrueltySpun?.isSuccess === false
                ? "player2"
                : null;
          if (crueltyWinner) {
            const hasMetamagic = (player: typeof player1) =>
              (player.character?.powers || []).some(
                (pw: any) =>
                  !pw?.isLost &&
                  (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() === "metamagic",
              ) && !disabledItems.has(`${player.no}-power-Metamagic`);
            if (crueltyWinner === "player1" && hasMetamagic(player1)) {
              patchedState = { ...patchedState, p1Score: patchedState.p1Score + 1 };
            }
            if (crueltyWinner === "player2" && hasMetamagic(player2)) {
              patchedState = { ...patchedState, p2Score: patchedState.p2Score + 1 };
            }
          }
        }
      }
    }

    const { newState, log } = computeRoundStep(
      stepRoundIndex,
      patchedState,
      player1,
      player2,
      oneTrickPonyStat,
      huntersMarkStat,
      wheelForcedWinner,
    );
    let finalState = newState;
    let finalLog = log;

    // Zoltraak: BIQ là 2 round riêng biệt
    // Click BIQ lần 1 (stepRoundIndex=4, zoltraakBiq2Pending=false): chạy BIQ bình thường, set pending
    // Click BIQ lần 2 (stepRoundIndex=4, zoltraakBiq2Pending=true): chạy BIQ×2
    let _biq2JustSetPending = false;
    if (stepRoundIndex === 4) {
      const hasZoltraak = (side: PvPPlayerData) =>
        (side.character?.powers || [])
          .filter((pw: any) => !pw.isLost)
          .some(
            (pw: any) =>
              (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
              "zoltraak",
          ) && !disabledItems.has(`${side.no}-power-Zoltraak`);

      if (zoltraakBiq2Pending) {
        // BIQ×2: dùng patchedState (đã patch BIQ×1 spin, score chính xác)
        // restore firedHandlers về trạng thái trước BIQ lần 1 để effects có thể fire lại
        const preBiq = preBiqFiredHandlersRef.current;
        const stateForBiq2 = {
          ...patchedState,
          p1FiredHandlers: preBiq
            ? new Set<string>(preBiq.p1)
            : new Set(stepState.p1FiredHandlers),
          p2FiredHandlers: preBiq
            ? new Set<string>(preBiq.p2)
            : new Set(stepState.p2FiredHandlers),
        };
        const { newState: newState2, log: log2 } = computeRoundStep(
          4,
          stateForBiq2,
          player1,
          player2,
          oneTrickPonyStat,
          huntersMarkStat,
          wheelForcedWinner,
        );
        const log2marked: typeof log2 = {
          ...log2,
          statLabel: "BIQ×2",
          events: [
            {
              player: "player1",
              source: "Zoltraak",
              description: "── BIQ Round lần 2 (Zoltraak) ──",
              type: "info",
            },
            ...log2.events,
          ],
        };
        // patchedState.roundLogs đã có BIQ×1 log; newState2 tự append BIQ×2 log
        // Dùng patchedState.roundLogs + log2marked để tránh duplicate
        finalState = {
          ...newState2,
          roundLogs: [...patchedState.roundLogs, log2marked],
        };
        finalLog = log2marked;
        // Spawn bubbles cho BIQ×2
        const bubbleItems2 = log2marked.events
          .filter(
            (e: any) => e.type === "stat_boost" || e.type === "stat_debuff",
          )
          .map((e: any) => ({
            player: e.player,
            text: e.description
              .replace(/\s*\(.*?\)\s*$/, "")
              .replace(/\s*permanent\s*$/, "")
              .trim(),
            isPositive: e.type === "stat_boost",
          }));
        if (bubbleItems2.length > 0) spawnStatBubbles(bubbleItems2);
        setZoltraakBiq2Pending(false);
        preBiqFiredHandlersRef.current = null;
      } else if (hasZoltraak(player1) || hasZoltraak(player2)) {
        // BIQ lần 1 xong, có Zoltraak → lưu handlers, set pending, giữ stepRoundIndex ở 4
        preBiqFiredHandlersRef.current = {
          p1: new Set(stepState.p1FiredHandlers),
          p2: new Set(stepState.p2FiredHandlers),
        };
        setZoltraakBiq2Pending(true);
        _biq2JustSetPending = true;
      }
    }

    setStepState(finalState);
    setCurrentRound(stepRoundIndex);
    // Nếu BIQ×1 vừa set pending → giữ stepRoundIndex ở 4 để click sau chạy BIQ×2
    const nextIdx = _biq2JustSetPending ? stepRoundIndex : stepRoundIndex + 1;
    setStepRoundIndex(nextIdx);

    // Spawn bubbles trực tiếp từ log events — không phụ thuộc vào derived lastRoundLog
    if (finalLog) {
      const bubbleItems = finalLog.events
        .filter((e: any) => e.type === "stat_boost" || e.type === "stat_debuff")
        .map((e: any) => ({
          player: e.player,
          text: e.description
            .replace(/\s*\(.*?\)\s*$/, "")
            .replace(/\s*permanent\s*$/, "")
            .trim(),
          isPositive: e.type === "stat_boost",
        }));
      spawnStatBubbles(bubbleItems);
    }

    if (nextIdx === 6) {
      // Finalize — apply before_combat_end effects (e.g. Edgelord) before determining winner
      // Patch score round cuối (MA, index 5) từ spin results trước khi finalize
      const lastRoundLogMA = [...finalState.roundLogs]
        .reverse()
        .find((l) => l.roundIndex === 5);
      let finalP1Score = finalState.p1Score;
      let finalP2Score = finalState.p2Score;
      console.log(
        `[Finalize] finalState.p1Score=${finalState.p1Score} finalState.p2Score=${finalState.p2Score}`,
      );
      let pendingMA = false;
      if (lastRoundLogMA) {
        const p1EffsMA = getPerRoundEffects(player1.character, player1.no);
        const p2EffsMA = getPerRoundEffects(player2.character, player2.no);
        const wMA = lastRoundLogMA.winner;
        const p1PtsMA = computeRoundPoints(
          "player1",
          wMA,
          5,
          p1EffsMA,
          lastRoundLogMA.statKey,
        );
        const p2PtsMA = computeRoundPoints(
          "player2",
          wMA,
          5,
          p2EffsMA,
          lastRoundLogMA.statKey,
        );
        // Nếu round MA còn pending spins (Cruelty, Crit, Evasion...) → lưu state, chờ spin xong
        pendingMA = p1PtsMA.pending || p2PtsMA.pending;
        if (pendingMA) {
          pendingFinalizeStateRef.current = finalState;
          setStepState(finalState);
          // Không return ngay — tiếp tục để define buildAfterCombat và lưu vào ref
        } else {
          const p1BaseMA = p1PtsMA.autoApplied
            ? p1PtsMA.pts
            : wMA === "player1"
              ? (p1PtsMA.engineBase ?? 1)
              : 0;
          const p2BaseMA = p2PtsMA.autoApplied
            ? p2PtsMA.pts
            : wMA === "player2"
              ? (p2PtsMA.engineBase ?? 1)
              : 0;
          finalP1Score += p1PtsMA.pts - p1BaseMA;
          finalP2Score += p2PtsMA.pts - p2BaseMA;
          // Metamagic: nếu round BIQ hòa nhưng Cruelty quyết định người thắng → thắng Cruelty cũng nhận +1 Metamagic
          if (lastRoundLogMA.statKey === "biq" && wMA === "tie") {
            const p1CrueltySpun = roundSpinResults[`5-Cruelty-player1`];
            const p2CrueltySpun = roundSpinResults[`5-Cruelty-player2`];
            const crueltyWinner: "player1" | "player2" | null =
              p1CrueltySpun?.isSuccess === true || p2CrueltySpun?.isSuccess === false
                ? "player1"
                : p2CrueltySpun?.isSuccess === true || p1CrueltySpun?.isSuccess === false
                  ? "player2"
                  : null;
            if (crueltyWinner) {
              const hasMetamagic = (player: typeof player1) =>
                (player.character?.powers || []).some(
                  (pw: any) =>
                    !pw?.isLost &&
                    (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() === "metamagic",
                ) && !disabledItems.has(`${player.no}-power-Metamagic`);
              if (crueltyWinner === "player1" && hasMetamagic(player1)) finalP1Score += 1;
              if (crueltyWinner === "player2" && hasMetamagic(player2)) finalP2Score += 1;
            }
          }
          console.log(
            `[Finalize] MA patch: p1PtsMA=${p1PtsMA.pts}(engineBase=${p1BaseMA}) p2PtsMA=${p2PtsMA.pts}(engineBase=${p2BaseMA}) => finalP1Score=${finalP1Score} finalP2Score=${finalP2Score}`,
          );
          // console.log(`[Finalize] MA patch: p1PtsMA=${p1PtsMA.pts}(base=${p1BaseMA},autoApplied=${p1PtsMA.autoApplied}) p2PtsMA=${p2PtsMA.pts}(base=${p2BaseMA},autoApplied=${p2PtsMA.autoApplied}) => finalP1Score=${finalP1Score} finalP2Score=${finalP2Score}`);
        }
      }
      let { p1Score, p2Score } = {
        p1Score: finalP1Score,
        p2Score: finalP2Score,
      };
      const { resolvedRounds } = finalState;

      const p1WonTotal = resolvedRounds.filter(
        (r) => r.winner === "player1",
      ).length;
      const p2WonTotal = resolvedRounds.filter(
        (r) => r.winner === "player2",
      ).length;

      const beforeCombatEndEntries: Array<{
        player: "player1" | "player2";
        sourceName: string;
        description: string;
      }> = [];
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
          // Build roundResults map for before_combat_end handlers (e.g. 4 Hit Combo)
          const bceRoundResults: Record<string, "win" | "lose" | "tie"> = {};
          for (const r of resolvedRounds) {
            const longKey: Record<string, string> = {
              str: "strength",
              spd: "speed",
              dur: "durability",
              iq: "iq",
              biq: "biq",
              ma: "ma",
            };
            const key = longKey[r.stat] ?? r.stat;
            bceRoundResults[key] =
              r.winner === playerSide
                ? "win"
                : r.winner === "tie"
                  ? "tie"
                  : "lose";
            bceRoundResults[r.stat] = bceRoundResults[key]; // short key alias
          }
          const ctx: any = {
            self: {
              character: player.character,
              stats:
                playerSide === "player1"
                  ? finalState.p1Stats
                  : finalState.p2Stats,
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
            roundResults: bceRoundResults,
          };

          const result = HandlerRegistry.executeCombat(
            ce.effect.customHandler as string,
            ctx,
          );
          if (!result) continue;
          // Kể cả skipDefault: vẫn hiện log nếu có description (e.g. Edgelord bằng điểm)
          if (result.skipDefault) {
            if (result.description)
              beforeCombatEndEntries.push({
                player: playerSide,
                sourceName,
                description: result.description,
              });
            continue;
          }
          if (result.description) {
            finalState.roundLogs.push({
              roundIndex: 6,
              stat: "final",
              winner: "tie",
              events: [
                {
                  player: playerSide,
                  source: sourceName,
                  description: result.description,
                  type: "info",
                },
              ],
              p1Score:
                playerSide === "player1"
                  ? p1Score + (result.selfPoints || 0)
                  : p1Score + (result.opponentPoints || 0),
              p2Score:
                playerSide === "player2"
                  ? p2Score + (result.selfPoints || 0)
                  : p2Score + (result.opponentPoints || 0),
            } as any);
            beforeCombatEndEntries.push({
              player: playerSide,
              sourceName,
              description: result.description,
            });
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

      const p1LostTotal = resolvedRounds.filter(
        (r) => r.winner === "player2",
      ).length;
      const p2LostTotal = resolvedRounds.filter(
        (r) => r.winner === "player1",
      ).length;
      let overallWinner: "player1" | "player2" = "player1";
      let tieBreaker: "race" | null = null;
      let isRoundtablePending = false;
      let preEgoistP1Score = p1Score;
      let preEgoistP2Score = p2Score;

      if (!pendingMA) {
        applyBeforeCombatEnd(player1, "player1", p1WonTotal, p1LostTotal);
        applyBeforeCombatEnd(player2, "player2", p2WonTotal, p2LostTotal);

        // Trickster - Ace of Spades: hoán đổi điểm 2 bên sau khi tính toán
        if (
          (tricksterResult["player1"] ?? "").toLowerCase() === "ace of spades"
        ) {
          [p1Score, p2Score] = [p2Score, p1Score];
        }
        if (
          (tricksterResult["player2"] ?? "").toLowerCase() === "ace of spades"
        ) {
          [p1Score, p2Score] = [p2Score, p1Score];
        }

        // Egoist: nếu người thắng có Egoist mà cách biệt < 4 → đổi kết quả (người kia thắng)
        // Lưu score trước flip để log margin đúng trong buildAfterCombat
        preEgoistP1Score = p1Score;
        preEgoistP2Score = p2Score;
        // Egoist: chỉ thắng khi margin >= 4, mọi trường hợp khác (kể cả hòa tie-break) đều thua instant
        // → override overallWinner trực tiếp sau khi tính xong
        const applyEgoistCheck = (
          egoistSide: "player1" | "player2",
          egoistPlayer: PvPPlayerData,
        ) => {
          if (!egoistPlayer.character) return;
          const egoistArchetypes = (
            egoistPlayer.character.archetypes || []
          ).map((a: string) =>
            a
              .replace(/\s*\(.*?\)/g, "")
              .trim()
              .toLowerCase(),
          );
          if (!egoistArchetypes.includes("egoist")) return;
          if (disabledItems.has(`${egoistPlayer.no}-archetype-Egoist`)) return;
          const selfScore = egoistSide === "player1" ? p1Score : p2Score;
          const oppScore = egoistSide === "player1" ? p2Score : p1Score;
          const margin = selfScore - oppScore;
          if (margin < 4) {
            // Không thắng đủ cách biệt (kể cả hòa, thua) → thua instant: override winner
            overallWinner = egoistSide === "player1" ? "player2" : "player1";
            tieBreaker = null;
          }
        };
        // Tính overallWinner tạm trước để Egoist check dùng
        if (p1Score > p2Score) overallWinner = "player1";
        else if (p2Score > p1Score) overallWinner = "player2";
        else {
          tieBreaker = "race";
          overallWinner =
            player1.raceTier < player2.raceTier ? "player1" : "player2";
        }
        applyEgoistCheck("player1", player1);
        applyEgoistCheck("player2", player2);

        const finalResult: CombatResult = {
          rounds: resolvedRounds,
          player1Score: p1Score,
          player2Score: p2Score,
          startPlayer1Score: finalState.startP1Score,
          startPlayer2Score: finalState.startP2Score,
          winner: overallWinner,
          tieBreaker,
        };
        isRoundtablePending = checkAndSetRoundtableHold(finalResult);
        setCombatResult(finalResult);
      }

      // Build after-combat entries — wrapped in closure so it can be deferred past Roundtable Hold
      // p1ScoreOverride/p2ScoreOverride: dùng khi Cruelty pending để truyền score đúng sau khi spin xong
      const buildAfterCombat = (
        actualWinner: "player1" | "player2",
        p1ScoreOverride?: number,
        p2ScoreOverride?: number,
        forceIsSubCombat?: boolean,
      ) => {
        const _p1Score = p1ScoreOverride ?? p1Score;
        const _p2Score = p2ScoreOverride ?? p2Score;
        // Build after-combat quirk effects and apply auto ones
        const acEntries: AfterCombatEntry[] = [];
        const processAfterCombat = (
          player: PvPPlayerData,
          side: "player1" | "player2",
          didWin: boolean,
          roundResults: Record<string, "win" | "lose" | "tie">,
          opponent: PvPPlayerData | null,
          opponentTotalScore?: number,
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
                description:
                  "+1 IQ (Compassionate). [GM Action] Tặng 1 Gear cho đối thủ.",
                statMods: [{ stat: "iq", delta: 1 }],
                gmAction: true,
              });
            }
            // Resilient: 36% +1 stat từng round thua
            else if (lname === "resilient") {
              const lostStats = (
                [
                  "str",
                  "spd",
                  "dur",
                  "iq",
                  "biq",
                  "ma",
                ] as (keyof CharacterStats)[]
              ).filter((s) => roundResults[s] === "lose");
              lostStats.forEach((s, i) => {
                const label = s.toUpperCase();
                const wk = `after-Resilient-${side}-${i}`;
                acEntries.push({
                  player: side,
                  quirkName: name,
                  description: `36% +1 ${label} (Resilient — round ${i + 1}/${lostStats.length})`,
                  wheelKey: wk,
                  wheelItems: [
                    {
                      label: `+1 ${label} (36%)`,
                      weight: 36,
                      isSuccess: true,
                      color: "#34d399",
                      meta: { stat: s },
                    },
                    {
                      label: "Không kích hoạt (64%)",
                      weight: 64,
                      isSuccess: false,
                      color: "#6b7280",
                      meta: { stat: s },
                    },
                  ],
                  statMods: [{ stat: s, delta: 1 }],
                });
              });
            }
            // Fast Learner: 33% copy power (spin)
            else if (lname === "fast learner") {
              const oppPowers = (
                (side === "player1" ? player2 : player1)?.character?.powers ||
                []
              )
                .filter((p: any) => !p.isLost)
                .map((p: any) => (typeof p === "string" ? p : p.name));
              if (oppPowers.length > 0) {
                const wk = `after-FastLearner-${side}`;
                acEntries.push({
                  player: side,
                  quirkName: name,
                  description: "33% học 1 Power của đối thủ (Fast Learner)",
                  wheelKey: wk,
                  wheelItems: [
                    {
                      label: "Học được Power! (33%)",
                      weight: 33,
                      isSuccess: true,
                      color: "#818cf8",
                    },
                    {
                      label: "Không học được (67%)",
                      weight: 67,
                      isSuccess: false,
                      color: "#6b7280",
                    },
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
                statMods: (
                  [
                    "str",
                    "spd",
                    "dur",
                    "iq",
                    "biq",
                    "ma",
                  ] as (keyof CharacterStats)[]
                ).map((s) => ({ stat: s, delta: -1 })),
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
                description:
                  '[GM Action] Xóa "Under the Weather", nhận "Shining Brightly"',
                gmAction: true,
              });
            }
            // Shining Brightly: sau thua → transform
            else if (lname === "shining brightly" && !didWin) {
              acEntries.push({
                player: side,
                quirkName: name,
                description:
                  '[GM Action] Xóa "Shining Brightly", nhận "Under the Weather"',
                gmAction: true,
              });
            }
            // Herbalist: quay Thảo Dược Wheel sau combat
            else if (lname === "herbalist") {
              const HERB_COLORS: Record<string, string> = {
                "Mirage Flower": "#f472b6",
                Sunberry: "#f59e0b",
                "Dragon's Weed": "#22c55e",
                Moonroot: "#818cf8",
                Mistpetal: "#67e8f9",
                "Eldritch Mushroom": "#a78bfa",
              };
              const HERB_WEIGHTS: Record<string, number> = {
                "Mirage Flower": 20,
                Sunberry: 15,
                "Dragon's Weed": 15,
                Moonroot: 15,
                Mistpetal: 20,
                "Eldritch Mushroom": 15,
              };
              const HERB_EFFECTS: Record<
                string,
                { win: string; lose: string }
              > = {
                "Mirage Flower": {
                  win: "Nhận thêm 1 phần thưởng PvP",
                  lose: "Nhận ngẫu nhiên 1 Char Dev",
                },
                Sunberry: {
                  win: "+2 vào chỉ số cao nhất",
                  lose: "+6 vào chỉ số thấp nhất",
                },
                "Dragon's Weed": {
                  win: "Nhận ngẫu nhiên 1 Power",
                  lose: "Mất toàn bộ Power, sau đó nhận 4 Power",
                },
                Moonroot: {
                  win: '+1 điểm KĐ combat kế [GM: đổi sub-type thành "Moonroot (Herbalist) (+1)"]',
                  lose: '+3 điểm KĐ combat kế [GM: đổi sub-type thành "Moonroot (Herbalist) (+3)"]',
                },
                Mistpetal: {
                  win: "Nhận thêm 1 Quirk",
                  lose: "Nhận thêm 6 Quirk",
                },
                "Eldritch Mushroom": {
                  win: "-1 all stats",
                  lose: "+1 all stats",
                },
              };
              const wk = `after-Herbalist-${side}`;
              acEntries.push({
                player: side,
                quirkName: name,
                description: `Herbalist: Quay Thảo Dược Wheel (${didWin ? "Thắng" : "Thua"})`,
                wheelKey: wk,
                wheelItems: Object.entries(HERB_WEIGHTS).map(
                  ([herb, weight]) => {
                    const eff = didWin
                      ? HERB_EFFECTS[herb].win
                      : HERB_EFFECTS[herb].lose;
                    return {
                      label: `${herb}: ${eff}`,
                      weight,
                      isSuccess: true,
                      color: HERB_COLORS[herb],
                    };
                  },
                ),
                gmAction: true,
              });
            }
            // Artistic: +2 IQ nếu đối thủ dùng nhạc cụ
            else if (lname === "artistic") {
              const INSTRUMENTS = [
                "bagpipe",
                "drums",
                "flute",
                "guitar",
                "violin",
                "trumpet",
                "piano",
                "harp",
                "lute",
                "saxophone",
                "bass",
                "cello",
                "harmonica",
                "ukulele",
                "nunchuck",
                "ruan mei",
              ];
              const oppWeapons = (opponent?.character?.weapons || []).map(
                (w: any) =>
                  (typeof w === "string" ? w : (w?.name ?? "")).toLowerCase(),
              );
              if (
                oppWeapons.some((w: string) =>
                  INSTRUMENTS.some((i) => w.includes(i)),
                )
              ) {
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
                description:
                  "[GM Action] Quay lại toàn bộ stats. Nếu tổng mới > cũ → +1 all stats (Progressive)",
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
                  description:
                    "[GM Action] +1 Power và +1 chỉ số thấp nhất mỗi PvP Reward đã tặng (Generous)",
                  gmAction: true,
                });
              }
            }
            // Patient: sau thắng → quay 4 power wheel kết quả tối đa (chỉ vòng 256)
            else if (lname === "patient" && didWin) {
              const patientRound = char.tournament?.round ?? "";
              if (patientRound === "256") {
                const playerPowers = new Set(
                  (char.powers || [])
                    .filter((p: any) => !p.isLost)
                    .map((p: any) =>
                      (typeof p === "string"
                        ? p
                        : (p?.name ?? "")
                      ).toLowerCase(),
                    ),
                );
                const allPowers = EffectRegistry.getAllByType("power").map(
                  (e) => e.name,
                );
                const availablePowers = allPowers.filter(
                  (p) => !playerPowers.has(p.toLowerCase()),
                );
                if (availablePowers.length > 0) {
                  const wheelItems: WheelSpinItem[] = availablePowers.map(
                    (p) => ({
                      label: p,
                      weight: 1,
                      isSuccess: true,
                      color: "#818cf8",
                    }),
                  );
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
              // Không phải vòng 256 → bỏ qua, không quay
            }
            // Independent: sau combat quay 6-stat wheel, nhận +2 vào stat được chọn
            else if (lname === "independent") {
              const STAT_LABELS: { stat: keyof CharacterStats; label: string }[] = [
                { stat: "str", label: "STR" },
                { stat: "spd", label: "SPD" },
                { stat: "dur", label: "DUR" },
                { stat: "iq",  label: "IQ" },
                { stat: "biq", label: "BIQ" },
                { stat: "ma",  label: "MA" },
              ];
              const STAT_COLORS = ["#f87171","#fb923c","#fbbf24","#34d399","#60a5fa","#c084fc"];
              const wk = `after-Independent-${side}`;
              acEntries.push({
                player: side,
                quirkName: name,
                description: "Quay 6-stat wheel → nhận +2 vào chỉ số được chọn (Independent)",
                wheelKey: wk,
                wheelItems: STAT_LABELS.map(({ stat, label }, i) => ({
                  label: `+2 ${label}`,
                  weight: 1,
                  isSuccess: true,
                  color: STAT_COLORS[i],
                  meta: { stat },
                })),
                // statMods không dùng — AfterCombatPanel xử lý qua result.meta.stat
              });
            }
            // Cheater: chỉ thông báo khi player bị loại (thua combat)
            else if (lname === "cheater" && !didWin) {
              const lovers: any[] = (char.lover || []).filter(
                (l: any) => !l.isLost,
              );
              if (lovers.length > 0) {
                const loverNames = lovers.map((l: any) => l.name).join(", ");
                acEntries.push({
                  player: side,
                  quirkName: name,
                  description: `[GM Action] Cheater: Lover (${loverNames}) loại bỏ hiệu ứng -2 BIQ và nhận +1 all stats`,
                  gmAction: true,
                });
              }
            }
          }

          // ── Gear after_combat effects ──────────────────────────────────────
          const normalGears = (char.gear?.normalGear || []).filter(
            (g: any) => !g.isLost,
          );
          const legacyGears = (char.gear?.legacyGear || []).filter(
            (g: any) => !g.isLost,
          );
          const allGears = [...normalGears, ...legacyGears];
          for (const g of allGears) {
            const gname: string = typeof g === "string" ? g : (g?.name ?? "");
            const lname = gname.toLowerCase();
            const gDisabled = disabledItems.has(`${player.no}-gear-${gname}`);
            if (gDisabled) continue;

            // Giấy Nợ Gia Truyền: score < 4 → mất gear/weapon + quay truyền cho member cùng nhà; score ≥ 4 → nhận 2 Golden Coin
            if (lname === "giấy nợ gia truyền") {
              const finalScore = side === "player1" ? _p1Score : _p2Score;
              if (finalScore < 4) {
                // Lấy house của player và tìm members cùng nhà (trừ chính player)
                const playerHouses: string[] = (char.houses || [])
                  .filter((h: any) => !h.isLost)
                  .map((h: any) =>
                    (typeof h === "string" ? h : (h?.name ?? "")).toLowerCase(),
                  );
                const houseMembers = allPlayers.filter((p) => {
                  if (p.no === player.no) return false;
                  const pHouses = (p.character?.houses || [])
                    .filter((h: any) => !h.isLost)
                    .map((h: any) =>
                      (typeof h === "string"
                        ? h
                        : (h?.name ?? "")
                      ).toLowerCase(),
                    );
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
                statMods: (
                  [
                    "str",
                    "spd",
                    "dur",
                    "iq",
                    "biq",
                    "ma",
                  ] as (keyof CharacterStats)[]
                ).map((s) => ({ stat: s, delta: -3 })),
              });
            }

            // The Tamer Straight Sword: sau combat thắng → vòng quay chọn 1 power của đối thủ
            if (
              (lname === "the tamer straight sword" ||
                lname === "tamer straight sword") &&
              didWin
            ) {
              const oppPowers = (opponent?.character?.powers || [])
                .filter((p: any) => !p?.isLost)
                .map((p: any) => (typeof p === "string" ? p : (p?.name ?? "")))
                .filter((n: string) => n.length > 0);
              if (oppPowers.length === 0) {
                acEntries.push({
                  player: side,
                  quirkName: gname,
                  description:
                    "[The Tamer Straight Sword] Đối thủ không còn Power nào để đánh cắp",
                });
              } else {
                const wheelItems = oppPowers.map((n: string) => ({
                  label: n,
                  weight: 1,
                  isSuccess: true,
                  color: "#a855f7",
                }));
                acEntries.push({
                  player: side,
                  quirkName: gname,
                  description:
                    "The Tamer Straight Sword: Chọn 1 Power của đối thủ để đánh cắp",
                  wheelKey: `after-TamerSword-${side}`,
                  wheelItems,
                  gmAction: true,
                });
              }
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
            if (lname.startsWith("thuốc tráng dương")) {
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

            // Almighty Vampire's Blood: sau combat → nhận 1 Power ngẫu nhiên
            if (lname === "almighty vampire's blood") {
              const allPowerNames = EffectRegistry.getAllByType("power").map(
                (e) => e.name,
              );
              const powerColors = [
                "#ef4444",
                "#f59e0b",
                "#22c55e",
                "#3b82f6",
                "#a855f7",
                "#ec4899",
                "#06b6d4",
                "#84cc16",
              ];
              acEntries.push({
                player: side,
                quirkName: gname,
                description:
                  "Almighty Vampire's Blood: Sau combat → Nhận 1 Power ngẫu nhiên",
                wheelKey: `after-AlmightyVampire-${side}`,
                wheelItems: allPowerNames.map((p, i) => ({
                  label: p,
                  weight: 1,
                  isSuccess: true,
                  color: powerColors[i % powerColors.length],
                })),
                gmAction: true,
              });
            }

            // Khung hình thờ: nếu cả 2 có → huỷ hiệu ứng + xóa cả 2; nếu người này thua → chuyển cho người thắng
            if (lname === "khung hình thờ") {
              const oppGears = opponent?.character?.gear?.normalGear || [];
              const oppHasKhung = oppGears.some((g: any) => {
                const n = typeof g === "string" ? g : (g?.name ?? "");
                return n.toLowerCase().startsWith("khung hình thờ");
              });
              if (oppHasKhung) {
                acEntries.push({
                  player: side,
                  quirkName: gname,
                  description:
                    "[GM Action] Khung Hình Thờ: Cả hai đều có → loại bỏ hiệu ứng và xóa gear của cả hai sau trận",
                  gmAction: true,
                });
              } else if (!didWin) {
                acEntries.push({
                  player: side,
                  quirkName: gname,
                  description:
                    "[GM Action] Khung Hình Thờ: Người này bị loại → chuyển gear sang người thắng",
                  gmAction: true,
                });
              }
            }

            // Kuro's Charm: sau combat thắng → phá hủy gear này
            if (lname === "kuro's charm" && didWin) {
              acEntries.push({
                player: side,
                quirkName: gname,
                description:
                  "[GM Action] Kuro's Charm: Phá hủy gear này sau combat thắng",
                gmAction: true,
              });
            }

            // Shaggydog: sau combat → +1 stat thấp nhất nếu nhà Stark
            if (lname === "shaggydog") {
              const house = (
                (char as any).house ||
                (char as any).character?.house ||
                ""
              ).toLowerCase();
              if (house.includes("stark")) {
                const statKeys = [
                  "str",
                  "spd",
                  "dur",
                  "iq",
                  "biq",
                  "ma",
                ] as (keyof CharacterStats)[];
                const currentStats = stepState
                  ? side === "player1"
                    ? stepState.p1Stats
                    : stepState.p2Stats
                  : player?.character
                    ? calcStatsWithDisabled(
                        player.character,
                        player.no,
                        disabledItems,
                      )
                    : player?.stats;
                const lowestStat = currentStats
                  ? statKeys.reduce((a, b) =>
                      (currentStats[a] ?? 0) <= (currentStats[b] ?? 0) ? a : b,
                    )
                  : "str";
                acEntries.push({
                  player: side,
                  quirkName: gname,
                  description: `Shaggydog: Nhà Stark → +1 ${lowestStat.toUpperCase()} (stat thấp nhất)`,
                  statMods: [{ stat: lowestStat, delta: 1 }],
                });
              }
            }
          }

          // ── Archetype after_combat effects ─────────────────────────────────
          const archetypes: string[] = (char.archetypes || []).map(
            (a: string) =>
              a
                .replace(/\s*\(.*?\)/g, "")
                .trim()
                .toLowerCase(),
          );

          // Hero Grave Keeper: thắng combat → GM tự chọn player để quay gear
          if (archetypes.includes("hero grave keeper") && didWin) {
            acEntries.push({
              player: side,
              quirkName: "Hero Grave Keeper",
              description:
                "[GM Action] Hero Grave Keeper: GM tự chọn player và quay ngẫu nhiên 1 Gear từ kho của player đó để trao cho người thắng.",
              gmAction: true,
            });
          }

          // Summoner: thắng combat → quay Summon Wheel (loại bỏ summons đã sở hữu)
          if (archetypes.includes("summoner") && didWin) {
            const ALL_SUMMONS = [
              {
                label: "Chihuahua: -1 All Stats",
                weight: 10,
                isSuccess: false,
                color: "#6b7280",
              },
              {
                label: "Mufasa: +3 STR",
                weight: 12,
                isSuccess: true,
                color: "#ef4444",
              },
              {
                label: "Pack of Wolves: +3 SPD",
                weight: 12,
                isSuccess: true,
                color: "#3b82f6",
              },
              {
                label: "Earth Golem: +3 DUR",
                weight: 12,
                isSuccess: true,
                color: "#84cc16",
              },
              {
                label: "Water Elemental: +3 IQ",
                weight: 12,
                isSuccess: true,
                color: "#06b6d4",
              },
              {
                label: "Imp: +3 BIQ",
                weight: 12,
                isSuccess: true,
                color: "#a855f7",
              },
              {
                label: "Igris: +3 MA",
                weight: 12,
                isSuccess: true,
                color: "#f97316",
              },
              {
                label: "Numby: +4 vào 1 chỉ số ngẫu nhiên",
                weight: 12,
                isSuccess: true,
                color: "#eab308",
              },
              {
                label: "Wyvern's Egg: +2 điểm khởi đầu (Chung kết tổng)",
                weight: 3,
                isSuccess: true,
                color: "#14b8a6",
              },
              {
                label: "Creator's Cat: Nhận Char Dev 'Creator's Favor'",
                weight: 3,
                isSuccess: true,
                color: "#ec4899",
              },
            ];
            // Lấy tên summons đã sở hữu (từ block Summon: riêng)
            const ownedSummons = (char.summons || [])
              .filter((s: any) => !s.isLost)
              .map((s: any) =>
                (typeof s === "string" ? s : (s?.name ?? "")).toLowerCase(),
              );
            const availableSummons = ALL_SUMMONS.filter(
              (s) =>
                !ownedSummons.some((owned: string) =>
                  s.label.toLowerCase().startsWith(owned),
                ),
            );
            if (availableSummons.length === 0) {
              acEntries.push({
                player: side,
                quirkName: "Summoner",
                description:
                  "[Summoner] Đã sở hữu tất cả Summon — không quay thêm",
              });
            } else {
              acEntries.push({
                player: side,
                quirkName: "Summoner",
                description:
                  "Summoner: Quay Summon Wheel (không trùng summon đã có)",
                wheelKey: `after-Summoner-${side}`,
                wheelItems: availableSummons,
                gmAction: true,
              });
            }
          }

          // Zealot: sau combat → mỗi round thua, +1 chỉ số thấp nhất
          if (archetypes.includes("zealot")) {
            const roundsLost = Object.values(roundResults).filter(
              (r) => r === "lose",
            ).length;
            if (roundsLost > 0) {
              const STAT_KEYS: (keyof CharacterStats)[] = [
                "str",
                "spd",
                "dur",
                "iq",
                "biq",
                "ma",
              ];
              const currentStats = char.stats as CharacterStats;
              let lowestStat: keyof CharacterStats = "str";
              let lowestVal = Number(currentStats?.str) || 0;
              for (const s of STAT_KEYS) {
                const v = Number(currentStats?.[s]) || 0;
                if (v < lowestVal) {
                  lowestVal = v;
                  lowestStat = s;
                }
              }
              acEntries.push({
                player: side,
                quirkName: "Zealot",
                description: `+${roundsLost} ${lowestStat.toUpperCase()} (Zealot — thua ${roundsLost} round)`,
                statMods: [{ stat: lowestStat, delta: roundsLost }],
              });
            }
          }

          // Machinists: sau combat → quay chọn 1 Gear từ pool
          if (archetypes.some((a) => a.startsWith("machinists"))) {
            const ownedGears = new Set(
              [
                ...(char.gear?.normalGear || []),
                ...(char.gear?.legacyGear || []),
              ]
                .filter((g: any) => !g?.isLost)
                .map((g: any) =>
                  (typeof g === "string" ? g : (g?.name ?? "")).toLowerCase(),
                ),
            );
            const availableGears = EffectRegistry.getAllByType("gear")
              .map((e) => e.name)
              .filter((g) => !ownedGears.has(g.toLowerCase()));
            const gearColors = [
              "#f59e0b",
              "#10b981",
              "#3b82f6",
              "#a855f7",
              "#ef4444",
              "#06b6d4",
              "#84cc16",
              "#ec4899",
            ];
            if (availableGears.length > 0) {
              acEntries.push({
                player: side,
                quirkName: "Machinists",
                description: "Machinists: Sau combat → Quay chọn 1 Gear",
                wheelKey: `after-Machinists-${side}`,
                wheelItems: availableGears.map((g, i) => ({
                  label: g,
                  weight: 1,
                  isSuccess: true,
                  color: gearColors[i % gearColors.length],
                })),
                gmAction: true,
              });
            } else {
              acEntries.push({
                player: side,
                quirkName: "Machinists",
                description:
                  "[GM Action] Machinists: Sau combat → Nhận 1 Gear (pool trống)",
                gmAction: true,
              });
            }
          }

          // Foragers: sau combat → +1 MA
          if (archetypes.includes("foragers")) {
            acEntries.push({
              player: side,
              quirkName: "Foragers",
              description: "+1 MA (Foragers — sau combat)",
              statMods: [{ stat: "ma" as keyof CharacterStats, delta: 1 }],
            });
          }

          // Cinderheart: sau combat thắng → +4% khả năng thắng Gamble (stack)
          if (archetypes.includes("cinderheart") && didWin) {
            acEntries.push({
              player: side,
              quirkName: "Cinderheart",
              description:
                "Cinderheart: Sau combat thắng → Tăng khả năng chiến thắng Gamble thêm 4% (Stack) [GM Action]",
              gmAction: true,
            });
          }

          // Perfectionist: thắng với cách biệt ≥4 → +4 stat thấp nhất
          if (archetypes.includes("perfectionist") && didWin) {
            const margin =
              (_p1Score - _p2Score) * (side === "player1" ? 1 : -1);
            if (margin >= 4) {
              const STAT_KEYS_PF: (keyof CharacterStats)[] = [
                "str",
                "spd",
                "dur",
                "iq",
                "biq",
                "ma",
              ];
              const currentStats = stepState
                ? side === "player1"
                  ? stepState.p1Stats
                  : stepState.p2Stats
                : player.character
                  ? calcStatsWithDisabled(
                      player.character,
                      player.no,
                      disabledItems,
                    )
                  : player.stats;
              const lowestStat = currentStats
                ? STAT_KEYS_PF.reduce((a, b) =>
                    (currentStats[a] ?? 0) <= (currentStats[b] ?? 0) ? a : b,
                  )
                : "str";
              acEntries.push({
                player: side,
                quirkName: "Perfectionist",
                description: `Perfectionist: Thắng cách biệt ${margin} điểm ≥ 4 → +4 ${lowestStat.toUpperCase()} (stat thấp nhất)`,
                statMods: [{ stat: lowestStat, delta: 4 }],
              });
            }
          }

          // Cinderheart: sau combat → đối thủ nhận Power "Cinder Flickering"
          if (archetypes.includes("cinderheart")) {
            const oppSide = side === "player1" ? "player2" : "player1";
            acEntries.push({
              player: oppSide,
              quirkName: "Cinder Flickering",
              description: `[GM Action] Cinderheart: ${player.name} trao Power "Cinder Flickering" cho đối thủ`,
              gmAction: true,
            });
          }

          // Masochist: sau combat thua → nhận 1 Power + +1 all stats
          if (archetypes.includes("masochist") && !didWin) {
            const allPowerNames = EffectRegistry.getAllByType("power").map(
              (e) => e.name,
            );
            const powerColors = [
              "#ef4444",
              "#f59e0b",
              "#22c55e",
              "#3b82f6",
              "#a855f7",
              "#ec4899",
              "#06b6d4",
              "#84cc16",
            ];
            const masochistWheelItems: WheelSpinItem[] = allPowerNames.map(
              (p, i) => ({
                label: p,
                weight: 1,
                isSuccess: true,
                color: powerColors[i % powerColors.length],
              }),
            );
            acEntries.push({
              player: side,
              quirkName: "Masochist",
              description: "Masochist: Thua combat → Nhận 1 Power",
              wheelKey: `after-Masochist-power-${side}`,
              wheelItems: masochistWheelItems,
              gmAction: true,
            });
            const ALL_STAT_KEYS_MS: (keyof CharacterStats)[] = [
              "str",
              "spd",
              "dur",
              "iq",
              "biq",
              "ma",
            ];
            acEntries.push({
              player: side,
              quirkName: "Masochist",
              description: "Masochist: Thua combat → +1 all stats",
              statMods: ALL_STAT_KEYS_MS.map((s) => ({ stat: s, delta: 1 })),
            });
          }

          // Egoist: log kết quả kiểm tra điều kiện (dùng score trước Egoist override)
          if (archetypes.includes("egoist")) {
            const preSelf =
              side === "player1" ? preEgoistP1Score : preEgoistP2Score;
            const preOpp =
              side === "player1" ? preEgoistP2Score : preEgoistP1Score;
            const origMargin = preSelf - preOpp;
            if (origMargin >= 4) {
              acEntries.push({
                player: side,
                quirkName: "Egoist",
                description: `Egoist: Thắng với cách biệt ${origMargin} điểm ≥ 4 ✓`,
              });
            } else {
              // margin < 4: thua instant (kể cả hòa tie-break, thua thường)
              const marginDesc =
                origMargin > 0
                  ? `cách biệt chỉ ${origMargin} điểm`
                  : origMargin === 0
                    ? `hòa điểm (tie-break)`
                    : `thua ${Math.abs(origMargin)} điểm`;
              acEntries.push({
                player: side,
                quirkName: "Egoist",
                description: `Egoist: ${marginDesc} (cần ≥4) → thua instant`,
              });
            }
          }

          // Labourers: sau combat → +1 STR
          if (archetypes.includes("labourers")) {
            acEntries.push({
              player: side,
              quirkName: "Labourers",
              description: "+1 STR (Labourers — sau combat)",
              statMods: [{ stat: "str" as keyof CharacterStats, delta: 1 }],
            });
          }

          // Lords: sau combat → +1 BIQ
          if (archetypes.includes("lords")) {
            acEntries.push({
              player: side,
              quirkName: "Lords",
              description: "+1 BIQ (Lords — sau combat)",
              statMods: [{ stat: "biq" as keyof CharacterStats, delta: 1 }],
            });
          }

          // Independent: sau combat → +2 vào 1 chỉ số ngẫu nhiên (mở vòng quay 6 stats)
          if (archetypes.includes("independent")) {
            const independentWheelItems: WheelSpinItem[] = [
              { label: "STR", weight: 1, isSuccess: true, color: "#ef4444" },
              { label: "SPD", weight: 1, isSuccess: true, color: "#3b82f6" },
              { label: "DUR", weight: 1, isSuccess: true, color: "#84cc16" },
              { label: "IQ", weight: 1, isSuccess: true, color: "#a855f7" },
              { label: "BIQ", weight: 1, isSuccess: true, color: "#ec4899" },
              { label: "MA", weight: 1, isSuccess: true, color: "#f59e0b" },
            ];
            acEntries.push({
              player: side,
              quirkName: "Independent",
              description:
                "Independent: Sau combat → +2 vào 1 chỉ số ngẫu nhiên",
              wheelKey: `after-Independent-stat-${side}`,
              wheelItems: independentWheelItems,
            });
          }

          // ── Sub-race after_combat effects ──────────────────────────────────
          // Frigg: sau combat thắng round IQ → nhận 1 Power
          const subRace = ((char as any).race?.subRace ?? "")
            .split("(")[0]
            .trim()
            .toLowerCase();
          if (subRace === "frigg" && roundResults["iq"] === "win") {
            const friggPowerNames = EffectRegistry.getAllByType("power").map(
              (e) => e.name,
            );
            const friggColors = [
              "#ef4444",
              "#f59e0b",
              "#22c55e",
              "#3b82f6",
              "#a855f7",
              "#ec4899",
              "#06b6d4",
              "#84cc16",
            ];
            const friggWheelItems: WheelSpinItem[] = friggPowerNames.map(
              (p, i) => ({
                label: p,
                weight: 1,
                isSuccess: true,
                color: friggColors[i % friggColors.length],
              }),
            );
            acEntries.push({
              player: side,
              quirkName: "Frigg",
              description: "Frigg: Thắng round IQ → Nhận 1 Power",
              wheelKey: `after-Frigg-power-${side}`,
              wheelItems: friggWheelItems,
              gmAction: true,
            });
          }

          // ── Weapon after_combat effects ────────────────────────────────────
          const weapons = (char.weapons || []).filter((w: any) => !w.isLost);
          for (const w of weapons) {
            const wname: string = typeof w === "string" ? w : (w?.name ?? "");
            const lname = wname
              .replace(/\s*\(.*?\)/g, "")
              .trim()
              .toLowerCase();
            const wDisabled = disabledItems.has(`${player.no}-weapon-${wname}`);
            if (wDisabled) continue;
            if (wname.toLowerCase().includes("không dùng được")) continue;

            // Blood Sword: sau combat thắng → mất 1 Power để +1 STR, +1 MA
            if (lname === "blood sword" && didWin) {
              const powers: any[] = (char.powers || []).filter(
                (p: any) => !p.isLost,
              );
              if (powers.length > 0) {
                const powerNames = powers
                  .map((p: any) =>
                    typeof p === "string" ? p : (p?.name ?? ""),
                  )
                  .filter(Boolean);
                const colors = [
                  "#ef4444",
                  "#f59e0b",
                  "#22c55e",
                  "#3b82f6",
                  "#a855f7",
                  "#ec4899",
                  "#06b6d4",
                  "#84cc16",
                ];
                acEntries.push({
                  player: side,
                  quirkName: wname,
                  description:
                    "Blood Sword: Thắng combat → quay để chọn Power bị hi sinh → +1 STR, +1 MA",
                  wheelKey: `after-BloodSword-${side}`,
                  wheelItems: powerNames.map((p, i) => ({
                    label: p,
                    weight: 1,
                    isSuccess: true,
                    color: colors[i % colors.length],
                  })),
                  statMods: [
                    { stat: "str" as keyof CharacterStats, delta: 1 },
                    { stat: "ma" as keyof CharacterStats, delta: 1 },
                  ],
                });
              } else {
                acEntries.push({
                  player: side,
                  quirkName: wname,
                  description:
                    "Blood Sword: Không có Power để hi sinh — không kích hoạt",
                });
              }
            }

            // Flower of Fire: thắng → +1 stat ngẫu nhiên per 2 power; thua → nhận 2 Power
            if (lname.startsWith("flower of fire")) {
              if (didWin) {
                const powerCount = (char.powers || []).filter(
                  (p: any) => !p?.isLost,
                ).length;
                const bonusCount = Math.floor(powerCount / 2);
                if (bonusCount > 0) {
                  acEntries.push({
                    player: side,
                    quirkName: wname,
                    description: `[GM Action] Flower of Fire: Thắng combat, có ${powerCount} Power → +${bonusCount} vào ${bonusCount} chỉ số ngẫu nhiên (mỗi 2 Power = +1 random stat)`,
                    gmAction: true,
                  });
                } else {
                  acEntries.push({
                    player: side,
                    quirkName: wname,
                    description: `Flower of Fire: Thắng combat nhưng chưa đủ 2 Power (${powerCount}) → không nhận bonus`,
                  });
                }
              } else {
                const ownedPowers = new Set(
                  (char.powers || [])
                    .filter((p: any) => !p?.isLost)
                    .map((p: any) =>
                      (typeof p === "string"
                        ? p
                        : (p?.name ?? "")
                      ).toLowerCase(),
                    ),
                );
                const availablePowers = EffectRegistry.getAllByType("power")
                  .map((e) => e.name)
                  .filter((p) => !ownedPowers.has(p.toLowerCase()));
                if (availablePowers.length > 0) {
                  const powerWheelItems: WheelSpinItem[] = availablePowers.map(
                    (p) => ({
                      label: p,
                      weight: 1,
                      isSuccess: true,
                      color: "#f97316",
                    }),
                  );
                  for (let spin = 1; spin <= 2; spin++) {
                    acEntries.push({
                      player: side,
                      quirkName: `${wname} (${spin}/2)`,
                      description: `Flower of Fire: Thua combat → Quay chọn Power #${spin}/2`,
                      wheelKey: `after-FlowerOfFire-${side}-${spin}`,
                      wheelItems: powerWheelItems,
                      gmAction: true,
                    });
                  }
                } else {
                  acEntries.push({
                    player: side,
                    quirkName: wname,
                    description: `[GM Action] Flower of Fire: Thua combat → Nhận 2 Power (không còn Power nào trong pool)`,
                    gmAction: true,
                  });
                }
              }
            }

            // Guinsoo's Rageblade: sau combat → +2 SPD
            if (lname === "guinsoo's rageblade") {
              acEntries.push({
                player: side,
                quirkName: wname,
                description: "+2 Speed (Guinsoo's Rageblade — sau combat)",
                statMods: [{ stat: "spd" as keyof CharacterStats, delta: 2 }],
              });
            }
            // Glass Bottle: sau combat → -1 Dur
            else if (lname.includes("glass bottle")) {
              acEntries.push({
                player: side,
                quirkName: wname,
                description: "-1 Durability (Glass Bottle — sau combat)",
                statMods: [{ stat: "dur" as keyof CharacterStats, delta: -1 }],
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
                description:
                  "[GM Action] PvP Reward gấp đôi (Labrys Axe — thắng combat)",
                gmAction: true,
              });
            }

            // Hou Yi's Divine Bow: sau combat → vòng quay Hậu Nghệ (flavor), GM tự apply +3 all stats
            if (lname.includes("hou yi's divine bow")) {
              acEntries.push({
                player: side,
                quirkName: wname,
                description:
                  "[GM Action] Hậu Nghệ: Quay xem bắn rụng bao nhiêu mặt trời → GM apply +3 all stats.",
                wheelKey: `after-HouYi-${side}`,
                wheelItems: [
                  {
                    label: "1 mặt trời",
                    weight: 30,
                    isSuccess: true,
                    color: "#fbbf24",
                    meta: { suns: 1 },
                  },
                  {
                    label: "2 mặt trời",
                    weight: 40,
                    isSuccess: true,
                    color: "#f97316",
                    meta: { suns: 2 },
                  },
                  {
                    label: "3 mặt trời",
                    weight: 30,
                    isSuccess: true,
                    color: "#ef4444",
                    meta: { suns: 3 },
                  },
                ],
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
                description:
                  "[GM Action] Wand: Quay Power Wheel, trao 1 Power ngẫu nhiên",
                gmAction: true,
              });
            }

            // Glass Bottle: sau combat → loại bỏ vũ khí này (GM thông báo)
            if (lname === "glass bottle") {
              acEntries.push({
                player: side,
                quirkName: wname,
                description:
                  "[GM Action] Glass Bottle: Vỡ sau combat — loại bỏ vũ khí này",
                gmAction: true,
              });
            }

            // Andúril: sau combat → nhận Summon Wheel
            if (lname === "andúril" || lname === "anduril") {
              const ALL_SUMMONS = [
                {
                  label: "Chihuahua: -1 All Stats",
                  weight: 10,
                  isSuccess: false,
                  color: "#6b7280",
                },
                {
                  label: "Mufasa: +3 STR",
                  weight: 12,
                  isSuccess: true,
                  color: "#ef4444",
                },
                {
                  label: "Pack of Wolves: +3 SPD",
                  weight: 12,
                  isSuccess: true,
                  color: "#3b82f6",
                },
                {
                  label: "Earth Golem: +3 DUR",
                  weight: 12,
                  isSuccess: true,
                  color: "#84cc16",
                },
                {
                  label: "Water Elemental: +3 IQ",
                  weight: 12,
                  isSuccess: true,
                  color: "#06b6d4",
                },
                {
                  label: "Imp: +3 BIQ",
                  weight: 12,
                  isSuccess: true,
                  color: "#a855f7",
                },
                {
                  label: "Igris: +3 MA",
                  weight: 12,
                  isSuccess: true,
                  color: "#f97316",
                },
                {
                  label: "Numby: +4 vào 1 chỉ số ngẫu nhiên",
                  weight: 12,
                  isSuccess: true,
                  color: "#eab308",
                },
                {
                  label: "Wyvern's Egg: +2 điểm khởi đầu (Chung kết tổng)",
                  weight: 3,
                  isSuccess: true,
                  color: "#14b8a6",
                },
                {
                  label: "Creator's Cat: Nhận Char Dev 'Creator's Favor'",
                  weight: 3,
                  isSuccess: true,
                  color: "#ec4899",
                },
              ];
              const ownedSummons = (char.summons || [])
                .filter((s: any) => !s.isLost)
                .map((s: any) =>
                  (typeof s === "string" ? s : (s?.name ?? "")).toLowerCase(),
                );
              const availableSummons = ALL_SUMMONS.filter(
                (s) =>
                  !ownedSummons.some((owned: string) =>
                    s.label.toLowerCase().startsWith(owned),
                  ),
              );
              if (availableSummons.length === 0) {
                acEntries.push({
                  player: side,
                  quirkName: wname,
                  description:
                    "[Andúril] Đã sở hữu tất cả Summon — không quay thêm",
                });
              } else {
                acEntries.push({
                  player: side,
                  quirkName: wname,
                  description:
                    "Andúril: Quay Summon Wheel (không trùng summon đã có)",
                  wheelKey: `after-Anduril-${side}`,
                  wheelItems: availableSummons,
                  gmAction: true,
                });
              }
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

            // Frostmourne: sau combat → +1 random stat + nhận 1 power từ đối thủ
            if (lname === "frostmourne") {
              // +1 random stat wheel
              acEntries.push({
                player: side,
                quirkName: wname,
                description:
                  "Frostmourne: Sau combat → quay chọn +1 Stat ngẫu nhiên",
                wheelKey: `after-Frostmourne-stat-${side}`,
                wheelItems: [
                  {
                    label: "STR",
                    weight: 1,
                    isSuccess: true,
                    color: "#f87171",
                  },
                  {
                    label: "SPD",
                    weight: 1,
                    isSuccess: true,
                    color: "#fb923c",
                  },
                  {
                    label: "DUR",
                    weight: 1,
                    isSuccess: true,
                    color: "#facc15",
                  },
                  { label: "IQ", weight: 1, isSuccess: true, color: "#34d399" },
                  {
                    label: "BIQ",
                    weight: 1,
                    isSuccess: true,
                    color: "#60a5fa",
                  },
                  { label: "MA", weight: 1, isSuccess: true, color: "#c084fc" },
                ],
              });
              // Steal power wheel
              const oppSideF = side === "player1" ? player2 : player1;
              const oppPowersF = (oppSideF?.character?.powers || [])
                .filter((p: any) => !p.isLost)
                .map((p: any) => (typeof p === "string" ? p : (p?.name ?? "")))
                .filter(Boolean);
              if (oppPowersF.length > 0) {
                const colors = [
                  "#ef4444",
                  "#f59e0b",
                  "#22c55e",
                  "#3b82f6",
                  "#a855f7",
                  "#ec4899",
                  "#06b6d4",
                  "#84cc16",
                ];
                acEntries.push({
                  player: side,
                  quirkName: wname,
                  description:
                    "Frostmourne: Quay chọn 1 Power từ đối thủ để nhận",
                  wheelKey: `after-Frostmourne-power-${side}`,
                  wheelItems: oppPowersF.map((p: string, i: number) => ({
                    label: p,
                    weight: 1,
                    isSuccess: true,
                    color: colors[i % colors.length],
                  })),
                  gmAction: true,
                });
              } else {
                acEntries.push({
                  player: side,
                  quirkName: wname,
                  description: "Frostmourne: Đối thủ không còn Power để nhận",
                });
              }
            }

            // Battlefury: Sau Combat — nếu tổng điểm đối thủ ≤0, nhận +3 vào 1 stat ngẫu nhiên
            if (lname === "battlefury") {
              const oppScore = opponentTotalScore ?? null;
              if (oppScore !== null && oppScore <= 0) {
                const STAT_KEYS_BF: (keyof CharacterStats)[] = [
                  "str",
                  "spd",
                  "dur",
                  "iq",
                  "biq",
                  "ma",
                ];
                const randStat =
                  STAT_KEYS_BF[Math.floor(Math.random() * STAT_KEYS_BF.length)];
                const statLabel: Record<string, string> = {
                  str: "STR",
                  spd: "SPD",
                  dur: "DUR",
                  iq: "IQ",
                  biq: "BIQ",
                  ma: "MA",
                };
                acEntries.push({
                  player: side,
                  quirkName: wname,
                  description: `Battlefury: Đối thủ kết thúc với ${oppScore} điểm (≤0) → +3 ${statLabel[randStat]}`,
                  statMods: [{ stat: randStat, delta: 3 }],
                });
              }
            }
          }

          // ── House base after_combat effects (e.g. Atreides) ───────────────
          const nestedHouses: any[] = Array.isArray((char as any).nestedHouses)
            ? (char as any).nestedHouses
            : [];
          for (const nh of nestedHouses) {
            if (nh.isLost) continue;
            const houseEntry = EffectRegistry.get("house", nh.name);
            if (!houseEntry) continue;
            for (const eff of houseEntry.effects) {
              const timingOk =
                eff.timing === "after_combat" ||
                (eff.timing === "after_combat_lose" && !didWin) ||
                (eff.timing === "after_combat_win" && didWin);
              if (!timingOk) continue;
              // grant_gear: GM Action
              if (eff.type === "grant_gear") {
                const gearName = (eff as any).grantName ?? "Gear";
                const gearCount = (eff as any).grantCount ?? 1;
                acEntries.push({
                  player: side,
                  quirkName: nh.name,
                  description: `[GM Action] ${nh.name}: Sau combat → Nhận ${gearCount} Gear "${gearName}"`,
                  gmAction: true,
                });
                continue;
              }
              if (eff.type !== "stat_modifier") continue;
              const delta = eff.value ?? 0;
              if (delta === 0) continue;

              const isOpponent = eff.target === "opponent";
              const targetSide: "player1" | "player2" = isOpponent
                ? side === "player1"
                  ? "player2"
                  : "player1"
                : side;
              const targetPlayer = targetSide === "player1" ? player1 : player2;
              const st = targetPlayer?.stats ?? player.stats;

              if (eff.stat === "highest") {
                const highestStat = (
                  ["str", "spd", "dur", "iq", "biq", "ma"] as const
                ).reduce(
                  (high, s) =>
                    st[s] > st[high as keyof CharacterStats] ? s : high,
                  "str" as string,
                );
                const sign = delta > 0 ? "+" : "";
                acEntries.push({
                  player: targetSide,
                  quirkName: nh.name,
                  description: `${nh.name}: Sau combat → ${sign}${delta} ${highestStat.toUpperCase()} (Base Stat cao nhất${isOpponent ? " đối thủ" : ""})`,
                  statMods: [
                    { stat: highestStat as keyof CharacterStats, delta },
                  ],
                });
              } else if (eff.stat === "lowest") {
                const lowestStat = (
                  ["str", "spd", "dur", "iq", "biq", "ma"] as const
                ).reduce(
                  (low, s) =>
                    st[s] < st[low as keyof CharacterStats] ? s : low,
                  "str" as string,
                );
                const sign = delta > 0 ? "+" : "";
                acEntries.push({
                  player: targetSide,
                  quirkName: nh.name,
                  description: `${nh.name}: Sau combat → ${sign}${delta} ${lowestStat.toUpperCase()} (stat thấp nhất${isOpponent ? " đối thủ" : ""})`,
                  statMods: [
                    { stat: lowestStat as keyof CharacterStats, delta },
                  ],
                });
              } else if (eff.stat === "all") {
                const sign = delta > 0 ? "+" : "";
                const timingLabel =
                  eff.timing === "after_combat_lose"
                    ? "Thua combat"
                    : eff.timing === "after_combat_win"
                      ? "Thắng combat"
                      : "Sau combat";
                acEntries.push({
                  player: targetSide,
                  quirkName: nh.name,
                  description: `[GM Action] ${nh.name}: ${timingLabel} → ${sign}${delta} all stats trong combat kế tiếp (GM cộng trước combat sau, hoàn lại sau đó)`,
                  gmAction: true,
                });
              } else {
                const sign = delta > 0 ? "+" : "";
                // check_enemy_is_same_house: chỉ hiển thị khi đối thủ cùng nhà
                if (eff.customHandler === "check_enemy_is_same_house") {
                  const oppNestedHouses: any[] = Array.isArray(
                    (opponent?.character as any)?.nestedHouses,
                  )
                    ? (opponent?.character as any).nestedHouses
                    : [];
                  const oppHasHouse = oppNestedHouses.some(
                    (oh: any) =>
                      !oh.isLost &&
                      (oh.name ?? "").toLowerCase() ===
                        nh.name.toLowerCase(),
                  );
                  if (oppHasHouse) {
                    acEntries.push({
                      player: targetSide,
                      quirkName: nh.name,
                      description: `${nh.name}: Sau combat → ${sign}${delta} ${(eff.stat as string).toUpperCase()}${isOpponent ? " (đối thủ)" : ""}`,
                      statMods: [
                        { stat: eff.stat as keyof CharacterStats, delta },
                      ],
                    });
                  }
                  // Không push acEntries nếu đối thủ không cùng nhà, nhưng stat vẫn được cộng bình thường
                } else {
                  acEntries.push({
                    player: targetSide,
                    quirkName: nh.name,
                    description: `${nh.name}: Sau combat → ${sign}${delta} ${(eff.stat as string).toUpperCase()}${isOpponent ? " (đối thủ)" : ""}`,
                    statMods: [
                      { stat: eff.stat as keyof CharacterStats, delta },
                    ],
                  });
                }
              }
            }
          }

          // ── House sub-type after_combat effects (e.g. Mohg) ───────────────
          for (const nh of nestedHouses) {
            if (nh.isLost || !nh.subType || nh.subTypeIsLost) continue;
            if (disabledItems.has(`${player.no}-house_sub-${nh.subType}`))
              continue;
            const entry = EffectRegistry.get("house_sub", nh.subType);
            if (!entry) continue;
            for (const eff of entry.effects) {
              const timingOk =
                eff.timing === "after_combat" ||
                (eff.timing === "after_combat_lose" && !didWin) ||
                (eff.timing === "after_combat_win" && didWin);
              if (!timingOk) continue;
              if (eff.type !== "stat_modifier") continue;
              const delta = eff.value ?? 0;
              if (delta === 0) continue;

              const isOpponent = eff.target === "opponent";
              const targetSide: "player1" | "player2" = isOpponent
                ? side === "player1"
                  ? "player2"
                  : "player1"
                : side;

              if (eff.stat === "highest") {
                const targetPlayer =
                  targetSide === "player1" ? player1 : player2;
                const st = targetPlayer?.stats ?? player.stats;
                const highestStat = (
                  ["str", "spd", "dur", "iq", "biq", "ma"] as const
                ).reduce(
                  (high, s) =>
                    st[s] > st[high as keyof CharacterStats] ? s : high,
                  "str" as string,
                );
                const sign = delta > 0 ? "+" : "";
                acEntries.push({
                  player: targetSide,
                  quirkName: nh.subType,
                  description: `${nh.subType}: Sau combat → ${sign}${delta} ${highestStat.toUpperCase()} (Base Stat cao nhất${isOpponent ? " đối thủ" : ""})`,
                  statMods: [
                    { stat: highestStat as keyof CharacterStats, delta },
                  ],
                });
              } else if (eff.stat === "lowest") {
                const targetPlayer =
                  targetSide === "player1" ? player1 : player2;
                const st = targetPlayer?.stats ?? player.stats;
                const lowestStat = (
                  ["str", "spd", "dur", "iq", "biq", "ma"] as const
                ).reduce(
                  (low, s) =>
                    st[s] < st[low as keyof CharacterStats] ? s : low,
                  "str" as string,
                );
                const sign = delta > 0 ? "+" : "";
                acEntries.push({
                  player: targetSide,
                  quirkName: nh.subType,
                  description: `${nh.subType}: Sau combat → ${sign}${delta} ${lowestStat.toUpperCase()} (stat thấp nhất${isOpponent ? " đối thủ" : ""})`,
                  statMods: [
                    { stat: lowestStat as keyof CharacterStats, delta },
                  ],
                });
              } else if (eff.stat === "all") {
                const sign = delta > 0 ? "+" : "";
                const timingLabel =
                  eff.timing === "after_combat_lose"
                    ? "Thua combat"
                    : eff.timing === "after_combat_win"
                      ? "Thắng combat"
                      : "Sau combat";
                acEntries.push({
                  player: targetSide,
                  quirkName: nh.subType,
                  description: `[GM Action] ${nh.subType}: ${timingLabel} → ${sign}${delta} all stats trong combat kế tiếp (GM cộng trước combat sau, hoàn lại sau đó)`,
                  gmAction: true,
                });
              } else if (eff.stat === "random") {
                const wk = `after-${nh.subType}-random-${side}`;
                acEntries.push({
                  player: targetSide,
                  quirkName: nh.subType,
                  description: `${nh.subType}: Sau combat → +${delta} vào Stat bất kỳ (quay để chọn):`,
                  wheelKey: wk,
                  wheelItems: [
                    {
                      label: "STR",
                      weight: 1,
                      isSuccess: true,
                      color: "#f87171",
                    },
                    {
                      label: "SPD",
                      weight: 1,
                      isSuccess: true,
                      color: "#fb923c",
                    },
                    {
                      label: "DUR",
                      weight: 1,
                      isSuccess: true,
                      color: "#facc15",
                    },
                    {
                      label: "IQ",
                      weight: 1,
                      isSuccess: true,
                      color: "#34d399",
                    },
                    {
                      label: "BIQ",
                      weight: 1,
                      isSuccess: true,
                      color: "#60a5fa",
                    },
                    {
                      label: "MA",
                      weight: 1,
                      isSuccess: true,
                      color: "#c084fc",
                    },
                  ],
                });
              } else {
                const sign = delta > 0 ? "+" : "";
                acEntries.push({
                  player: targetSide,
                  quirkName: nh.subType,
                  description: `${nh.subType}: Sau combat → ${sign}${delta} ${(eff.stat as string).toUpperCase()}${isOpponent ? " (đối thủ)" : ""}`,
                  statMods: [{ stat: eff.stat as keyof CharacterStats, delta }],
                });
              }
            }
          }

          // ── Mason archetype: enhanced house after_combat effects ───────────
          // Mason không có subType trong file data → detect qua archetype + house name
          const hasMasonArchetype = (char.archetypes || []).some((a: any) => {
            const n = (typeof a === "string" ? a : (a?.name ?? ""))
              .replace(/\s*\(.*?\)/g, "")
              .trim()
              .toLowerCase();
            return n === "mason";
          });
          if (hasMasonArchetype) {
            const activeHouses = nestedHouses.filter(
              (nh: any) => !nh.isLost && !nh.subType,
            );
            for (const nh of activeHouses) {
              const masonSubKey = `${nh.name} Mason`;
              if (disabledItems.has(`${player.no}-house_sub-${masonSubKey}`))
                continue;
              const masonEntry = EffectRegistry.get("house_sub", masonSubKey);
              if (!masonEntry) continue;
              for (const eff of masonEntry.effects) {
                if (eff.timing !== "after_combat") continue;
                // grant_gear: GM Action
                if (eff.type === "grant_gear") {
                  const gearName = (eff as any).grantName ?? "Gear";
                  const gearCount = (eff as any).grantCount ?? 1;
                  acEntries.push({
                    player: side,
                    quirkName: masonSubKey,
                    description: `[GM Action] ${masonSubKey}: Sau combat → Nhận ${gearCount} Gear "${gearName}"`,
                    gmAction: true,
                  });
                  continue;
                }
                if (eff.type !== "stat_modifier") continue;
                const delta = eff.value ?? 0;
                if (delta === 0) continue;
                if (eff.stat === "highest") {
                  const st = player.stats;
                  const highestStat = (
                    ["str", "spd", "dur", "iq", "biq", "ma"] as const
                  ).reduce(
                    (high, s) =>
                      st[s] > st[high as keyof CharacterStats] ? s : high,
                    "str" as string,
                  );
                  acEntries.push({
                    player: side,
                    quirkName: masonSubKey,
                    description: `${masonSubKey}: Sau combat → +${delta} ${highestStat.toUpperCase()} (Base Stat cao nhất)`,
                    statMods: [
                      { stat: highestStat as keyof CharacterStats, delta },
                    ],
                  });
                } else if (eff.stat === "lowest") {
                  const st = player.stats;
                  const lowestStat = (
                    ["str", "spd", "dur", "iq", "biq", "ma"] as const
                  ).reduce(
                    (low, s) =>
                      st[s] < st[low as keyof CharacterStats] ? s : low,
                    "str" as string,
                  );
                  acEntries.push({
                    player: side,
                    quirkName: masonSubKey,
                    description: `${masonSubKey}: Sau combat → +${delta} ${lowestStat.toUpperCase()} (stat thấp nhất)`,
                    statMods: [
                      { stat: lowestStat as keyof CharacterStats, delta },
                    ],
                  });
                }
              }
            }
          }

          // ── Nymeria (House Stark sub): sau combat thua → nhận Power "Weapon Enhancing" ──
          const hasNymeria = nestedHouses.some((h: any) => {
            if (h.isLost || h.subTypeIsLost) return false;
            return (h.subType ?? "").toLowerCase() === "nymeria";
          });
          if (hasNymeria && !didWin) {
            const nymeriaSubKey =
              nestedHouses.find(
                (h: any) =>
                  !h.isLost &&
                  !h.subTypeIsLost &&
                  (h.subType ?? "").toLowerCase() === "nymeria",
              )?.subType ?? "Nymeria";
            if (!disabledItems.has(`${player.no}-house_sub-${nymeriaSubKey}`)) {
              acEntries.push({
                player: side,
                quirkName: "Nymeria",
                description:
                  '[GM Action] Nymeria: Thua combat → Nhận Power "Weapon Enhancing"',
                gmAction: true,
              });
            }
          }

          // ── Shaggydog (House Stark sub): sau combat → người nhà Stark nhận +1 stat thấp nhất ──
          const hasShaggydog = nestedHouses.some(
            (h: any) =>
              !h.isLost &&
              !h.subTypeIsLost &&
              (h.subType ?? "").toLowerCase() === "shaggydog",
          );
          if (hasShaggydog) {
            const shaggydogKey =
              nestedHouses.find(
                (h: any) =>
                  !h.isLost &&
                  !h.subTypeIsLost &&
                  (h.subType ?? "").toLowerCase() === "shaggydog",
              )?.subType ?? "Shaggydog";
            if (!disabledItems.has(`${player.no}-house_sub-${shaggydogKey}`)) {
              const st = player.stats;
              const lowestStat = (
                ["str", "spd", "dur", "iq", "biq", "ma"] as const
              ).reduce(
                (low, s) => (st[s] < st[low as keyof CharacterStats] ? s : low),
                "str" as string,
              );
              acEntries.push({
                player: side,
                quirkName: "Shaggydog",
                description: `+1 ${lowestStat.toUpperCase()} (Shaggydog — người nhà Stark, stat thấp nhất)`,
                statMods: [
                  { stat: lowestStat as keyof CharacterStats, delta: 1 },
                ],
              });
            }
          }

          // ── Mason archetype: Kazuya Kinoshita's House → thêm 1 Char Dev ──
          // (Golden Coin đã được handle trong Mason grant_gear loop ở trên)
          if (hasMasonArchetype) {
            const kazuyaMasonKey = "Kazuya Kinoshita's House Mason";
            const hasKazuyaHouse = nestedHouses.some(
              (nh: any) =>
                !nh.isLost &&
                !nh.subType &&
                (nh.name ?? "") === "Kazuya Kinoshita's House",
            );
            if (
              hasKazuyaHouse &&
              !disabledItems.has(`${player.no}-house_sub-${kazuyaMasonKey}`)
            ) {
              acEntries.push({
                player: side,
                quirkName: kazuyaMasonKey,
                description: `[GM Action] ${kazuyaMasonKey}: Sau combat → Nhận thêm 1 Char Dev`,
                gmAction: true,
              });
            }
          }

          // Captain America (sub-archetype): sau combat → +1 STR, +1 DUR
          const nestedArchetypes: any[] = Array.isArray(
            (char as any).nestedArchetypes,
          )
            ? (char as any).nestedArchetypes
            : [];
          const hasCaptainAmerica = nestedArchetypes.some((na: any) => {
            const sub = (na?.subType ?? "").toLowerCase();
            return (
              sub.includes("captain america") && !na.isLost && !na.subTypeIsLost
            );
          });
          if (hasCaptainAmerica) {
            const naEntry = nestedArchetypes.find((na: any) =>
              (na?.subType ?? "").toLowerCase().includes("captain america"),
            );
            const subKey = naEntry?.subType ?? "Captain America";
            if (!disabledItems.has(`${player.no}-archetype_sub-${subKey}`)) {
              acEntries.push({
                player: side,
                quirkName: subKey,
                description: "+1 STR, +1 DUR (Captain America — sau combat)",
                statMods: [
                  { stat: "str" as keyof CharacterStats, delta: 1 },
                  { stat: "dur" as keyof CharacterStats, delta: 1 },
                ],
              });
            }
          }

          // ── Power after_combat / after_combat_lose effects ─────────────────
          const powers = (char.powers || []).filter((p: any) => !p.isLost);
          for (const pw of powers) {
            const pname: string =
              typeof pw === "string" ? pw : (pw?.name ?? "");
            const lname = pname.toLowerCase();
            const pDisabled = disabledItems.has(`${player.no}-power-${pname}`);
            if (pDisabled) continue;

            // Bloody Strike: sau combat → +1 mỗi stat đã thắng round
            if (lname === "bloody strike") {
              const wonStats = (
                [
                  "str",
                  "spd",
                  "dur",
                  "iq",
                  "biq",
                  "ma",
                ] as (keyof CharacterStats)[]
              ).filter((s) => roundResults[s] === "win");
              if (wonStats.length > 0) {
                acEntries.push({
                  player: side,
                  quirkName: pname,
                  description: `+1 ${wonStats.map((s) => s.toUpperCase()).join("/")} (Bloody Strike — thắng round)`,
                  statMods: wonStats.map((s) => ({ stat: s, delta: 1 })),
                });
              }
            }

            // Bloodlust: sau combat thắng → -1 IQ, -1 MA, +1 STR, +1 SPD, +2 DUR
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

            // Fancy Feet: sau combat → -1 Dur (phần disable vũ khí/rune đối thủ đã xử lý trước combat)
            if (lname.includes("fancy feet")) {
              acEntries.push({
                player: side,
                quirkName: pname,
                description: "-1 Durability (Fancy Feet — sau combat)",
                statMods: [{ stat: "dur" as keyof CharacterStats, delta: -1 }],
              });
            }

            // Memory Freeze: sau combat thua → đối thủ nhận Quirk "Brainrot" và không nhận PvP Reward
            if (lname === "memory freeze" && !didWin) {
              acEntries.push({
                player: side === "player1" ? "player2" : "player1",
                quirkName: pname,
                description: `[GM Action] Nhận Quirk "Brainrot" và không nhận PvP Reward (Memory Freeze — ${side} thua)`,
                gmAction: true,
              });
            }

            // Magma Strike: sau combat → -1 Dura đối thủ
            if (lname.startsWith("magma strike")) {
              acEntries.push({
                player: side === "player1" ? "player2" : "player1",
                quirkName: pname,
                description:
                  "-1 Durability (Magma Strike — đối thủ, sau combat)",
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
                  {
                    label: "+1 All Stats (36%)",
                    weight: 36,
                    isSuccess: true,
                    color: "#f59e0b",
                  },
                  {
                    label: "Không kích hoạt (64%)",
                    weight: 64,
                    isSuccess: false,
                    color: "#6b7280",
                  },
                ],
                statMods: (
                  [
                    "str",
                    "spd",
                    "dur",
                    "iq",
                    "biq",
                    "ma",
                  ] as (keyof CharacterStats)[]
                ).map((s) => ({ stat: s, delta: 1 })),
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
                .map((l: any) => (typeof l === "string" ? l : (l?.name ?? "")))
                .filter(Boolean);
              if (activeLoverNames.length > 0) {
                acEntries.push({
                  player: side,
                  quirkName: pname,
                  description: `[GM Action]: -2 Dura cho bản thân.`,
                  gmAction: true,
                });
              }
            }

            // Odin Blessing: sau combat thua → +2 stat cao nhất thay vì +2 STR
            if (lname === "odin blessing" && !didWin) {
              acEntries.push({
                player: side,
                quirkName: pname,
                description:
                  "[GM Action] Chuyển +2 STR thành +2 Stat cao nhất (Odin Blessing — thua combat)",
                gmAction: true,
              });
            }

            // Acid Breath: sau combat thắng → nhận Power "Poison Breath"
            if (lname === "acid breath" && didWin) {
              acEntries.push({
                player: side,
                quirkName: pname,
                description:
                  '[GM Action] Nhận Power "Poison Breath" (Acid Breath — thắng combat)',
                gmAction: true,
              });
            }

            // Poison Breath: sau combat thua → nhận Power "Garlic Breath"
            if (lname === "poison breath" && !didWin) {
              acEntries.push({
                player: side,
                quirkName: pname,
                description:
                  '[GM Action] Nhận Power "Garlic Breath" (Poison Breath — thua combat)',
                gmAction: true,
              });
            }

            // Primordial Being: sau combat thắng → GM action
            if (lname === "primordial being" && didWin) {
              acEntries.push({
                player: side,
                quirkName: pname,
                description:
                  "[GM Action] Primordial Being kích hoạt sau combat thắng",
                gmAction: true,
              });
            }

            // Spirit Link: sau combat thắng → +1 stat ngẫu nhiên
            if (lname === "spirit link" && didWin) {
              acEntries.push({
                player: side,
                quirkName: pname,
                description:
                  "[GM Action] +1 Stat ngẫu nhiên (Spirit Link — thắng combat, loại đối thủ)",
                gmAction: true,
              });
            }

            // Stat Absorption: sau combat thắng → +1 stat cao nhất của đối thủ
            if (lname === "stat absorption" && didWin) {
              const oppChar = opponent?.character;
              const statKeys: (keyof CharacterStats)[] = [
                "str",
                "spd",
                "dur",
                "iq",
                "biq",
                "ma",
              ];
              const oppStats = oppChar?.stats as CharacterStats | undefined;
              let highestStat: keyof CharacterStats = "str";
              let highestVal = -Infinity;
              if (oppStats) {
                for (const s of statKeys) {
                  const v = Number(oppStats[s]) || 0;
                  if (v > highestVal) {
                    highestVal = v;
                    highestStat = s;
                  }
                }
              }
              const statLabel: Record<string, string> = {
                str: "STR",
                spd: "SPD",
                dur: "DUR",
                iq: "IQ",
                biq: "BIQ",
                ma: "MA",
              };
              acEntries.push({
                player: side,
                quirkName: pname,
                description: `Stat Absorption: Thắng combat → +1 ${statLabel[highestStat]} (stat cao nhất của đối thủ: ${highestVal})`,
                statMods: [{ stat: highestStat, delta: 1 }],
              });
            }

            // Power Absorption: sau combat thắng → hấp thụ 1 Power ngẫu nhiên của đối thủ
            if (lname === "power absorption" && didWin) {
              const oppPowers = ((opponent?.character as any)?.powers || [])
                .filter((p: any) => !p?.isLost)
                .map((p: any) => (typeof p === "string" ? p : (p?.name ?? "")))
                .filter((n: string) => n);
              if (oppPowers.length > 0) {
                const paColors = [
                  "#ef4444",
                  "#f59e0b",
                  "#22c55e",
                  "#3b82f6",
                  "#a855f7",
                  "#ec4899",
                  "#06b6d4",
                  "#84cc16",
                ];
                const paWheelItems: WheelSpinItem[] = oppPowers.map(
                  (n: string, i: number) => ({
                    label: n,
                    weight: 1,
                    isSuccess: true,
                    color: paColors[i % paColors.length],
                  }),
                );
                acEntries.push({
                  player: side,
                  quirkName: pname,
                  description:
                    "Power Absorption: Thắng combat → Hấp thụ 1 Power ngẫu nhiên của đối thủ",
                  wheelKey: `after-PowerAbsorption-${side}`,
                  wheelItems: paWheelItems,
                  gmAction: true,
                });
              } else {
                acEntries.push({
                  player: side,
                  quirkName: pname,
                  description:
                    "[GM Action] Power Absorption: Thắng combat → Đối thủ không có Power nào để hấp thụ",
                  gmAction: true,
                });
              }
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
                  description:
                    "+1 MA (Bucking Bronco — thắng round MA và thắng combat)",
                  statMods: [{ stat: "ma" as keyof CharacterStats, delta: 1 }],
                });
              }
            }

            // Lone Wolf: sau combat — nếu đối thủ cũng có Lone Wolf → mất power (GM action)
            if (lname === "lone wolf") {
              const oppPowers: any[] = opponent?.character?.powers || [];
              const oppHasLoneWolf = oppPowers.some((p: any) => {
                const n = typeof p === "string" ? p : (p?.name ?? "");
                return n.toLowerCase().includes("lone wolf");
              });
              if (oppHasLoneWolf) {
                acEntries.push({
                  player: side,
                  quirkName: pname,
                  description:
                    "[GM Action] Cả hai đều có Lone Wolf → mất power Lone Wolf (Lone Wolf)",
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
                  statMods: [
                    { stat: "dur" as keyof CharacterStats, delta: bonus },
                  ],
                });
              }
            }

            // Cinder Flickering: sau combat — nếu cả 2 có → người thắng nhận Char Dev "Lord of Cinder"
            if (lname === "cinder flickering" && didWin) {
              const oppPowers: any[] = opponent?.character?.powers || [];
              const oppHasCinder = oppPowers.some((p: any) => {
                const n = typeof p === "string" ? p : (p?.name ?? "");
                return n.toLowerCase().includes("cinder flickering");
              });
              if (oppHasCinder) {
                acEntries.push({
                  player: side,
                  quirkName: pname,
                  description:
                    '[GM Action] Người thắng nhận Char Dev "Lord of Cinder" (Cinder Flickering — cả 2 có power)',
                  gmAction: true,
                });
              }
            }

            // Darwin Evolution Theory: sau combat → GM nâng race tier +1
            if (lname === "darwin evolution theory") {
              acEntries.push({
                player: side,
                quirkName: pname,
                description:
                  "[GM Action] Thăng hạng chủng tộc +1 bậc (Darwin Evolution Theory)",
                gmAction: true,
              });
            }

            // Algorithms Are Clear: sau combat → thay Base Stat thấp nhất = avg stat đối thủ
            if (lname === "algorithms are clear") {
              const oppChar = opponent?.character;
              if (oppChar) {
                const STAT_KEYS: (keyof CharacterStats)[] = [
                  "str",
                  "spd",
                  "dur",
                  "iq",
                  "biq",
                  "ma",
                ];
                const oppStats = oppChar.stats as CharacterStats;
                const totalOppBase = STAT_KEYS.reduce(
                  (sum, s) => sum + (Number(oppStats?.[s]) || 0),
                  0,
                );
                const avgOppBase = Math.round(totalOppBase / 6);
                const selfStats = char.stats as CharacterStats;
                let lowestStat: keyof CharacterStats = "str";
                let lowestVal = Number(selfStats["str"]) || 0;
                for (const s of STAT_KEYS) {
                  const v = Number(selfStats[s]) || 0;
                  if (v < lowestVal) {
                    lowestVal = v;
                    lowestStat = s;
                  }
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
              const flipped2 = !flipped && roll2 !== null && roll2 < 0.1;
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

            // Adapt: sau combat → hiển thị danh sách powers đã học từ đối thủ
            if (lname === "adapt") {
              const oppPowers: any[] = opponent?.character?.powers || [];
              const oppPowerNames = oppPowers
                .filter((p: any) => !p.isLost)
                .map((p: any) => (typeof p === "string" ? p : (p?.name ?? "")))
                .filter(Boolean);
              if (oppPowerNames.length > 0) {
                acEntries.push({
                  player: side,
                  quirkName: pname,
                  description: `[Adapt] Ghi nhớ thêm powers của đối thủ: ${oppPowerNames.join(", ")} (GM cập nhật danh sách đã ghi nhớ)`,
                  gmAction: true,
                });
              } else {
                acEntries.push({
                  player: side,
                  quirkName: pname,
                  description:
                    "[Adapt] Đối thủ không có Power — không có gì mới để ghi nhớ",
                });
              }
            }

            // Baldening: sau combat → đối thủ bị rụng hết tóc 💀 (GM action)
            if (lname === "baldening") {
              const oppName = opponent?.character?.name || "Đối thủ";
              acEntries.push({
                player: side,
                quirkName: pname,
                description: `Baldening 💀: ${oppName} bị rụng hết tóc. [GM Action] Cập nhật appearance đối thủ.`,
                gmAction: true,
              });
            }
          }

          // ── Summon after_combat effects ─────────────────────────────────────
          const summons = (char.summons || []).filter((s: any) => !s.isLost);
          for (const sm of summons) {
            const sname: string =
              typeof sm === "string" ? sm : (sm?.name ?? "");
            const slname = sname.toLowerCase();
            const sDisabled = disabledItems.has(`${player.no}-summon-${sname}`);
            if (sDisabled) continue;

            // Creator's Cat: sau combat → quay Char Dev "Creator's Favor"
            if (slname === "creator's cat") {
              acEntries.push({
                player: side,
                quirkName: sname,
                description:
                  "Creator's Cat: Quay Char Dev Wheel để nhận \"Creator's Favor\"",
                wheelKey: `after-CreatorsCat-${side}`,
                wheelItems: [
                  {
                    label: "Creator's Favor (100%)",
                    weight: 100,
                    isSuccess: true,
                    color: "#ec4899",
                    meta: { isCreatorsCat: true },
                  },
                ],
                gmAction: true,
              });
            }
          }

          // ── Race after_combat effects ───────────────────────────────────────
          const charRaceAC = ((char as any).race?.race || "").toLowerCase();

          // Orc: thắng → +2 chỉ số thấp nhất; thua → -3 chỉ số cao nhất
          if (charRaceAC === "orc") {
            const STAT_KEYS_AC: (keyof CharacterStats)[] = [
              "str",
              "spd",
              "dur",
              "iq",
              "biq",
              "ma",
            ];
            const st = char.stats as CharacterStats;
            if (didWin) {
              let lowestStat: keyof CharacterStats = "str";
              let lowestVal = Number(st?.str) || 0;
              for (const s of STAT_KEYS_AC) {
                const v = Number(st?.[s]) || 0;
                if (v < lowestVal) {
                  lowestVal = v;
                  lowestStat = s;
                }
              }
              acEntries.push({
                player: side,
                quirkName: "Orc",
                description: `+2 ${lowestStat.toUpperCase()} (Orc — thắng combat, chỉ số thấp nhất)`,
                statMods: [{ stat: lowestStat, delta: 2 }],
              });
            } else {
              let highestStat: keyof CharacterStats = "str";
              let highestVal = Number(st?.str) || 0;
              for (const s of STAT_KEYS_AC) {
                const v = Number(st?.[s]) || 0;
                if (v > highestVal) {
                  highestVal = v;
                  highestStat = s;
                }
              }
              acEntries.push({
                player: side,
                quirkName: "Orc",
                description: `-3 ${highestStat.toUpperCase()} (Orc — thua combat, chỉ số cao nhất)`,
                statMods: [{ stat: highestStat, delta: -3 }],
              });
            }
          }

          // Spirit race: thông báo souls nhận được sau combat
          if (charRaceAC === "spirit") {
            const roundsLostThisCombat = Object.values(roundResults).filter(
              (r) => r === "lose",
            ).length;
            if (roundsLostThisCombat > 0) {
              const prevSouls = (char as any).spiritSouls ?? 0;
              const newTotal = prevSouls + roundsLostThisCombat;
              acEntries.push({
                player: side,
                quirkName: "Spirit",
                description: `Spirit Souls: Thua ${roundsLostThisCombat} round → +${roundsLostThisCombat} Soul stack (tổng: ${prevSouls} + ${roundsLostThisCombat} = ${newTotal}) [GM cập nhật file]`,
                gmAction: true,
              });
            }
          }

          // ── Sub-race after_combat effects ──────────────────────────────────
          const charSubRaceRaw: string = ((char as any).race?.subRace || "")
            .split("(")[0]
            .trim()
            .toLowerCase();

          // Eir (God sub-race): Nhận +1 Dura. Sau combat: Gấp đôi con số cộng thêm này (stack vô hạn)
          if (charSubRaceRaw === "eir") {
            const subRaceFull: string = (char as any).race?.subRace || "Eir";
            const stackMatch = subRaceFull.match(/\((\d+)\)/);
            const stackN = stackMatch ? parseInt(stackMatch[1], 10) : 0;
            const currentBonus = Math.pow(2, stackN);
            const nextStack = stackN + 1;
            acEntries.push({
              player: side,
              quirkName: "Eir",
              description: `+${currentBonus} Durability (Eir — stack ${stackN}). [GM Action] Đổi Sub-race thành "Eir (${nextStack})".`,
              statMods: [
                { stat: "dur" as keyof CharacterStats, delta: currentBonus },
              ],
              gmAction: true,
            });
          }

          // Naga (house): Sau combat — check số round thắng vs thua
          // (1) Thắng nhiều round hơn → Nhận 1 Power (mở vòng quay power)
          // (2) Thua nhiều round hơn → Nhận 1 Char Dev (GM action)
          // (3) Hòa round → +1 all stats
          const hasNagaHouse = nestedHouses.some(
            (nh: any) => !nh.isLost && nh.name.toLowerCase() === "naga",
          );
          if (hasNagaHouse) {
            const nagaDisabled = disabledItems.has(`${player.no}-house-Naga`);
            if (!nagaDisabled) {
              const allRoundVals = Object.values(roundResults);
              const nagaRoundWins = allRoundVals.filter(
                (r) => r === "win",
              ).length;
              const nagaRoundLosses = allRoundVals.filter(
                (r) => r === "lose",
              ).length;

              if (nagaRoundWins > nagaRoundLosses) {
                // (1) Thắng nhiều round hơn → Nhận 1 Power
                const nagaPowerNames = EffectRegistry.getAllByType("power").map(
                  (e) => e.name,
                );
                const nagaPowerColors = [
                  "#ef4444",
                  "#f59e0b",
                  "#22c55e",
                  "#3b82f6",
                  "#a855f7",
                  "#ec4899",
                  "#06b6d4",
                  "#84cc16",
                ];
                acEntries.push({
                  player: side,
                  quirkName: "Naga",
                  description: `Naga: Thắng nhiều round hơn (${nagaRoundWins}W vs ${nagaRoundLosses}L) → Nhận 1 Power`,
                  wheelKey: `after-Naga-power-${side}`,
                  wheelItems: nagaPowerNames.map((p, i) => ({
                    label: p,
                    weight: 1,
                    isSuccess: true,
                    color: nagaPowerColors[i % nagaPowerColors.length],
                  })),
                  gmAction: true,
                });
              } else if (nagaRoundLosses > nagaRoundWins) {
                // (2) Thua nhiều round hơn → Nhận 1 Char Dev (GM action)
                acEntries.push({
                  player: side,
                  quirkName: "Naga",
                  description: `Naga: Thua nhiều round hơn (${nagaRoundWins}W vs ${nagaRoundLosses}L) → Nhận 1 Char Dev`,
                  wheelKey: `after-Naga-chardev-${side}`,
                  wheelItems: [
                    {
                      label: "Nhận 1 Char Dev (100%)",
                      weight: 100,
                      isSuccess: true,
                      color: "#fb923c",
                      meta: { gmAction: "chardev1" },
                    },
                  ],
                  gmAction: true,
                });
              } else {
                // (3) Hòa round → +1 all stats
                const ALL_STAT_KEYS_NAGA: (keyof CharacterStats)[] = [
                  "str",
                  "spd",
                  "dur",
                  "iq",
                  "biq",
                  "ma",
                ];
                acEntries.push({
                  player: side,
                  quirkName: "Naga",
                  description: `Naga: Hòa round (${nagaRoundWins}W = ${nagaRoundLosses}L) → +1 all stats`,
                  statMods: ALL_STAT_KEYS_NAGA.map((s) => ({
                    stat: s,
                    delta: 1,
                  })),
                });
              }
            }
          }

          // ── Runeword after_combat effects ──────────────────────────────────
          const runeword: string | undefined = (char as any).runes?.runeword;
          if (runeword) {
            const rwDisabled = disabledItems.has(
              `${player.no}-runeword-${runeword}`,
            );
            if (!rwDisabled) {
              // Affection: sau combat → 69% make love (spin wheel, GM action)
              if (runeword === "Affection") {
                const wk = `after-Affection-${side}`;
                acEntries.push({
                  player: side,
                  quirkName: runeword,
                  description:
                    "Affection: Sau combat → 69% Make Love (cả 2 GM action)",
                  wheelKey: wk,
                  wheelItems: AFTER_COMBAT_WHEEL_ITEMS["Affection"],
                  gmAction: true,
                });
              }
            }
          }

          // ── Char Dev after_combat effects ──────────────────────────────────
          const charDevs: any[] = ((char as any).charDevs || []).filter(
            (c: any) => !c.isLost,
          );
          for (const cd of charDevs) {
            const cdname: string =
              typeof cd === "string" ? cd : (cd?.name ?? "");
            const cdlname = cdname.toLowerCase();
            if (disabledItems.has(`${player.no}-char_dev-${cdname}`)) continue;

            // Don't say it: -2 all stats (immediate, đã apply lúc load).
            // Sau combat thắng (chỉ 1 lần, chưa upgrade) → xóa -2, +2 all stats, nhận Power "Encroaching Shadow"
            // Nếu có suffix (+2 all stats) → đã upgrade → không kích hoạt nữa
            if (cdlname.includes("don't say it")) {
              const suffix = cdname.slice("don't say it".length).toLowerCase();
              const isUpgraded =
                suffix.includes("+2 all stats") || suffix.includes("+2 all");
              if (!isUpgraded && didWin) {
                acEntries.push({
                  player: side,
                  quirkName: cdname,
                  description:
                    '[GM Action] Don\'t say it — Thắng combat (chỉ 1 lần): Xóa -2 all stats, +2 all stats, nhận Power "Encroaching Shadow"',
                  gmAction: true,
                });
              }
            }
          }

          // ── Book of a small dog: sau combat thắng đầu tiên → Isekai ──
          const gears = [
            ...(char.gear?.normalGear || []).filter((g: any) => !g.isLost),
            ...(char.gear?.legacyGear || []).filter((g: any) => !g.isLost),
          ];
          for (const g of gears) {
            const gname: string = typeof g === "string" ? g : (g?.name ?? "");
            if (gname.toLowerCase() !== "book of a small dog") continue;
            if (disabledItems.has(`${player.no}-gear-${gname}`)) continue;
            if (!didWin) continue;
            acEntries.push({
              player: side,
              quirkName: gname,
              description: `[GM Action] ${char.name || side} bị Isekai (Book of a small dog — thắng combat). Gear trở về vòng quay.`,
              gmAction: true,
            });
          }
        };

        // ── Coven Council: khi thua (bị loại R256) → quay chọn 1 player ngoài Coven → spin lại 1 stat ──
        for (const side of ["player1", "player2"] as const) {
          const player = side === "player1" ? player1 : player2;
          const didLose = actualWinner !== side;
          if (!didLose) continue;
          const char = player.character;
          if (!char) continue;
          const playerHouses: string[] = ((char as any).houses || [])
            .filter((h: any) => !h.isLost)
            .map((h: any) =>
              (typeof h === "string" ? h : (h?.name ?? "")).toLowerCase(),
            );
          const hasCoven = playerHouses.includes("coven council");
          if (!hasCoven) continue;

          // Lấy tất cả player còn sống không thuộc Coven Council
          const nonCovenPlayers = allPlayers.filter((p) => {
            if (p.no === player.no) return false;
            if (p.character?.tournament?.status === "eliminated") return false;
            const pHouses: string[] = ((p.character?.houses || []) as any[])
              .filter((h: any) => !h.isLost)
              .map((h: any) =>
                (typeof h === "string" ? h : (h?.name ?? "")).toLowerCase(),
              );
            return !pHouses.includes("coven council");
          });

          if (nonCovenPlayers.length === 0) {
            acEntries.push({
              player: side,
              quirkName: "Coven Council",
              description:
                "[GM Action] Không tìm thấy player nào ngoài Coven Council để Re-Spin",
              gmAction: true,
            });
            continue;
          }

          const wk = `after-CovenCouncil-${side}`;
          acEntries.push({
            player: side,
            quirkName: "Coven Council",
            description:
              "Bị loại — quay chọn 1 player không thuộc Coven Council để Re-Spin 1 stat:",
            wheelKey: wk,
            wheelItems: nonCovenPlayers.map((p) => ({
              label: `${p.name} (#${p.no})`,
              weight: 1,
              isSuccess: true,
              color: "#a855f7",
              meta: {
                playerNo: p.no,
                playerName: p.name,
                race: p.character?.race?.race || p.race || "human",
              },
            })),
            gmAction: true,
          });
        }

        // ── MrBeast: khi thắng → quay chọn 1 Gear ngẫu nhiên để tặng 5 người ──
        for (const side of ["player1", "player2"] as const) {
          if (actualWinner !== side) continue;
          const player = side === "player1" ? player1 : player2;
          const char = player.character;
          if (!char) continue;
          const charDevs: any[] = ((char as any).charDevs || []).filter(
            (c: any) => !c.isLost,
          );
          const hasMrBeast = charDevs.some(
            (c: any) =>
              (typeof c === "string" ? c : (c?.name ?? "")).toLowerCase() ===
              "mrbeast",
          );
          if (!hasMrBeast) continue;

          const normalGears: any[] = (
            (char as any).gear?.normalGear || []
          ).filter((g: any) => !g.isLost);
          const legacyGears: any[] = (
            (char as any).gear?.legacyGear || []
          ).filter((g: any) => !g.isLost);
          const allGears = [...normalGears, ...legacyGears];
          const gearNames = allGears
            .map((g: any) => (typeof g === "string" ? g : (g?.name ?? "")))
            .filter(Boolean);

          if (gearNames.length > 0) {
            const wk = `after-MrBeast-${side}`;
            const gearColors = [
              "#f59e0b",
              "#10b981",
              "#3b82f6",
              "#a855f7",
              "#ef4444",
              "#06b6d4",
              "#84cc16",
              "#ec4899",
            ];
            acEntries.push({
              player: side,
              quirkName: "MrBeast",
              description:
                "Sau thắng — quay chọn 1 Gear để tặng 5 player ngẫu nhiên còn sống (Wheel Of Name):",
              wheelKey: wk,
              wheelItems: gearNames.map((g: string, i: number) => ({
                label: g,
                weight: 1,
                isSuccess: true,
                color: gearColors[i % gearColors.length],
              })),
              gmAction: true,
            });
          } else {
            // Không có Gear: -5 stat ngẫu nhiên → 5 người nhận +1 stat đó
            acEntries.push({
              player: side,
              quirkName: "MrBeast",
              description:
                "[GM Action] Không có Gear — GM quay 1 stat ngẫu nhiên → bản thân -5 stat đó, 5 player được chọn nhận +1 stat đó. Nếu người nhận cũng là MrBeast: +2 All Stats thêm.",
              gmAction: true,
            });
          }
        }

        // ── Văn tế: khi thua (bị loại) → GM re-spin stat cao nhất của 1 người ngẫu nhiên còn sống ──
        for (const side of ["player1", "player2"] as const) {
          if (actualWinner === side) continue;
          const player = side === "player1" ? player1 : player2;
          const char = player.character;
          if (!char) continue;
          const normalGears: any[] = (
            (char as any).gear?.normalGear || []
          ).filter((g: any) => !g.isLost);
          const legacyGears: any[] = (
            (char as any).gear?.legacyGear || []
          ).filter((g: any) => !g.isLost);
          const hasVanTe = [...normalGears, ...legacyGears].some(
            (g: any) =>
              (typeof g === "string" ? g : (g?.name ?? "")).toLowerCase() ===
              "văn tế",
          );
          if (!hasVanTe) continue;

          const alivePlayers = allPlayers.filter(
            (p) =>
              p.no !== player.no &&
              p.character?.tournament?.status !== "eliminated",
          );
          if (alivePlayers.length === 0) {
            acEntries.push({
              player: side,
              quirkName: "Văn tế",
              description:
                "[GM Action] Văn Tế — Không còn player nào đang sống.",
              gmAction: true,
            });
          } else {
            const wkVT = `after-VanTe-${side}`;
            const vtColors = [
              "#f59e0b",
              "#10b981",
              "#3b82f6",
              "#a855f7",
              "#ef4444",
              "#06b6d4",
              "#84cc16",
              "#ec4899",
            ];
            acEntries.push({
              player: side,
              quirkName: "Văn tế",
              description:
                "Bị loại — quay chọn 1 player còn sống để Re-Spin stat cao nhất:",
              wheelKey: wkVT,
              wheelItems: alivePlayers.map((p, i) => ({
                label: `${p.name} (#${p.no})`,
                weight: 1,
                isSuccess: true,
                color: vtColors[i % vtColors.length],
                meta: { playerNo: p.no, playerName: p.name },
              })),
              gmAction: true,
            });
          }
        }

        // ── Hero Grave Keeper: sau mỗi combat → quay chọn 1 player bị loại → lấy 1 Gear của player đó ──
        for (const side of ["player1", "player2"] as const) {
          const player = side === "player1" ? player1 : player2;
          const char = player.character;
          if (!char) continue;
          const archetypes: string[] = ((char as any).archetypes || []).map(
            (a: any) =>
              (typeof a === "string" ? a : (a?.name ?? "")).toLowerCase(),
          );
          const hasHGK = archetypes.includes("hero grave keeper");
          if (!hasHGK) continue;

          // Lọc player bị loại (không phải chính mình)
          const eliminatedPlayers = allPlayers.filter(
            (p) =>
              p.no !== player.no &&
              p.character?.tournament?.status === "eliminated",
          );

          if (eliminatedPlayers.length === 0) {
            acEntries.push({
              player: side,
              quirkName: "Hero Grave Keeper",
              description:
                "[GM Action] Hero Grave Keeper — Chưa có player nào bị loại.",
              gmAction: true,
            });
            continue;
          }

          const hgkColors = [
            "#f59e0b",
            "#10b981",
            "#3b82f6",
            "#a855f7",
            "#ef4444",
            "#06b6d4",
            "#84cc16",
            "#ec4899",
          ];
          const wkHGK = `after-HeroGraveKeeper-${side}`;
          acEntries.push({
            player: side,
            quirkName: "Hero Grave Keeper",
            description:
              "Sau combat — quay chọn 1 player đã bị loại để lấy Gear:",
            wheelKey: wkHGK,
            wheelItems: eliminatedPlayers.map((p, i) => {
              const normalGear: any[] = (
                (p.character?.gear?.normalGear || []) as any[]
              ).filter((g: any) => !g.isLost);
              const legacyGear: any[] = (
                (p.character?.gear?.legacyGear || []) as any[]
              ).filter((g: any) => !g.isLost);
              const allGear = [...normalGear, ...legacyGear];
              return {
                label: `${p.name} (#${p.no})${allGear.length === 0 ? " — không có Gear" : ""}`,
                weight: 1,
                isSuccess: allGear.length > 0,
                color: hgkColors[i % hgkColors.length],
                meta: {
                  playerNo: p.no,
                  playerName: p.name,
                  gearList: allGear
                    .map((g: any) =>
                      typeof g === "string" ? g : (g?.name ?? ""),
                    )
                    .filter(Boolean),
                },
              };
            }),
            gmAction: true,
          });
        }

        // ── Follower of the Two Fingers: sau combat → -1 IQ, -1 BIQ, cướp 1 Power từ 1 player còn sống ──
        for (const side of ["player1", "player2"] as const) {
          const player = side === "player1" ? player1 : player2;
          const char = player.character;
          if (!char) continue;
          const archetypes: string[] = ((char as any).archetypes || []).map(
            (a: any) =>
              (typeof a === "string" ? a : (a?.name ?? "")).toLowerCase(),
          );
          if (!archetypes.includes("follower of the two fingers")) continue;

          const alivePlayers = allPlayers.filter(
            (p) =>
              p.no !== player.no &&
              p.character?.tournament?.status !== "eliminated",
          );

          if (alivePlayers.length === 0) {
            acEntries.push({
              player: side,
              quirkName: "Follower of the Two Fingers",
              description:
                "[GM Action] Follower of the Two Fingers: -1 IQ, -1 BIQ — Không còn player nào đang sống để cướp Power.",
              gmAction: true,
            });
            continue;
          }

          const fotfColors = [
            "#f59e0b",
            "#10b981",
            "#3b82f6",
            "#a855f7",
            "#ef4444",
            "#06b6d4",
            "#84cc16",
            "#ec4899",
          ];
          const wkFOTF = `after-FollowerTwoFingers-${side}`;
          acEntries.push({
            player: side,
            quirkName: "Follower of the Two Fingers",
            description:
              "Sau combat: -1 IQ, -1 BIQ — Quay chọn 1 player còn sống để cướp Power:",
            wheelKey: wkFOTF,
            wheelItems: alivePlayers.map((p, i) => {
              const powers = (p.character?.powers || [])
                .filter((pw: any) => !pw?.isLost)
                .map((pw: any) =>
                  typeof pw === "string" ? pw : (pw?.name ?? ""),
                )
                .filter(Boolean);
              return {
                label: `${p.name} (#${p.no})${powers.length === 0 ? " — không có Power" : ""}`,
                weight: 1,
                isSuccess: powers.length > 0,
                color: fotfColors[i % fotfColors.length],
                meta: { playerNo: p.no, playerName: p.name, powers },
              };
            }),
            gmAction: true,
          });
        }

        // ── Dryad: khi bị loại → quay Dryad còn sống nhận +2 stat ngẫu nhiên; nếu còn 1 → tiến hóa Yggdrasil ──
        for (const side of ["player1", "player2"] as const) {
          if (actualWinner === side) continue; // chỉ khi bị loại
          const player = side === "player1" ? player1 : player2;
          const char = player.character;
          if (!char) continue;
          const playerRace = ((char as any).race?.race || "").toLowerCase();
          if (playerRace !== "dryad") continue;

          // Tìm tất cả Dryad còn sống (không phải player bị loại)
          const aliveDryads = allPlayers.filter((p) => {
            if (p.no === player.no) return false;
            return (
              ((p.character?.race?.race || "") as string).toLowerCase() ===
              "dryad"
            );
          });

          if (aliveDryads.length === 0) {
            acEntries.push({
              player: side,
              quirkName: "Dryad",
              description:
                "[GM Action] Dryad bị loại nhưng không còn Dryad nào khác còn sống.",
              gmAction: true,
            });
          } else if (aliveDryads.length === 1) {
            // Chỉ còn 1 Dryad → tiến hóa Yggdrasil
            const lastDryadSide =
              player1.no === aliveDryads[0].no ? "player1" : "player2";
            acEntries.push({
              player: lastDryadSide,
              quirkName: "Dryad",
              description: `[GM Action] Dryad cuối cùng (${aliveDryads[0].name}) → Tiến hóa thành Yggdrasil + +9 Base vào 1 chỉ số ngẫu nhiên`,
              gmAction: true,
            });
            acEntries.push({
              player: lastDryadSide,
              quirkName: "Dryad → Yggdrasil",
              description: "Yggdrasil: Quay chọn chỉ số nhận +9 Base",
              wheelKey: `after-Dryad-Yggdrasil-${lastDryadSide}`,
              wheelItems: [
                { label: "STR", weight: 1, isSuccess: true, color: "#ef4444" },
                { label: "SPD", weight: 1, isSuccess: true, color: "#3b82f6" },
                { label: "DUR", weight: 1, isSuccess: true, color: "#10b981" },
                { label: "IQ", weight: 1, isSuccess: true, color: "#a855f7" },
                { label: "BIQ", weight: 1, isSuccess: true, color: "#ec4899" },
                { label: "MA", weight: 1, isSuccess: true, color: "#f59e0b" },
              ],
              gmAction: true,
            });
          } else {
            // Nhiều Dryad còn sống → quay chọn 1 Dryad, rồi quay chọn stat +2
            const dryadColors = [
              "#22c55e",
              "#10b981",
              "#84cc16",
              "#06b6d4",
              "#a855f7",
              "#f59e0b",
            ];
            acEntries.push({
              player: side,
              quirkName: "Dryad",
              description: `Dryad bị loại → Quay chọn 1 trong ${aliveDryads.length} Dryad còn sống nhận +2 stat`,
              wheelKey: `after-Dryad-pick-${side}`,
              wheelItems: aliveDryads.map((p, i) => ({
                label: `${p.name} (#${p.no})`,
                weight: 1,
                isSuccess: true,
                color: dryadColors[i % dryadColors.length],
                meta: { playerNo: p.no, playerName: p.name },
              })),
              gmAction: true,
            });
            acEntries.push({
              player: side,
              quirkName: "Dryad (+2 stat)",
              description: "Dryad: Quay chọn chỉ số nhận +2",
              wheelKey: `after-Dryad-stat-${side}`,
              wheelItems: [
                { label: "STR", weight: 1, isSuccess: true, color: "#ef4444" },
                { label: "SPD", weight: 1, isSuccess: true, color: "#3b82f6" },
                { label: "DUR", weight: 1, isSuccess: true, color: "#10b981" },
                { label: "IQ", weight: 1, isSuccess: true, color: "#a855f7" },
                { label: "BIQ", weight: 1, isSuccess: true, color: "#ec4899" },
                { label: "MA", weight: 1, isSuccess: true, color: "#f59e0b" },
              ],
              gmAction: true,
            });
          }
        }

        // ── King's Landing: khi bị loại → gia tộc nhận 1 Power (GM action) ──
        for (const side of ["player1", "player2"] as const) {
          if (actualWinner === side) continue; // chỉ khi bị loại
          const player = side === "player1" ? player1 : player2;
          const char = player.character;
          if (!char) continue;
          const charDevs: any[] = ((char as any).charDevs || []).filter(
            (c: any) => !c.isLost,
          );
          const hasKingsLanding = charDevs.some(
            (c: any) =>
              (typeof c === "string" ? c : (c?.name ?? "")).toLowerCase() ===
              "king's landing",
          );
          if (!hasKingsLanding) continue;

          // Lấy "gia tộc" = Team number của player
          const teamNo: number | undefined =
            (char as any).team ?? (player as any).team;
          // Tìm các player còn sống trong cùng gia tộc (không phải chính player bị loại)
          const familyMembers = allPlayers.filter((p) => {
            if (p.no === player.no) return false;
            const pTeam = (p.character as any)?.team ?? (p as any).team;
            return pTeam !== undefined && pTeam === teamNo;
          });

          const allPowerNames = EffectRegistry.getAllByType("power").map(
            (e) => e.name,
          );
          const powerColors = [
            "#ef4444",
            "#f59e0b",
            "#22c55e",
            "#3b82f6",
            "#a855f7",
            "#ec4899",
            "#06b6d4",
            "#84cc16",
          ];

          const wheelItems: WheelSpinItem[] = allPowerNames.map((p, i) => ({
            label: p,
            weight: 1,
            isSuccess: true,
            color: powerColors[i % powerColors.length],
          }));

          if (familyMembers.length === 0) {
            acEntries.push({
              player: side,
              quirkName: "King's Landing",
              description: `[GM Action] King's Landing: ${player.name} bị loại — không còn thành viên gia tộc nào còn sống.`,
              wheelKey: `after-KingsLanding-${side}-solo`,
              wheelItems,
              gmAction: true,
            });
          } else {
            acEntries.push({
              player: side,
              quirkName: "King's Landing",
              description: `King's Landing: ${player.name} bị loại → cả gia tộc cùng nhận 1 Power`,
              wheelKey: `after-KingsLanding-${side}-0`,
              wheelItems,
              gmAction: true,
            });
          }
        }

        // ── Grey Wind: khi bị loại → người nhà Stark nhận +1 all stats ──
        for (const side of ["player1", "player2"] as const) {
          if (actualWinner === side) continue; // chỉ khi bị loại
          const player = side === "player1" ? player1 : player2;
          const char = player.character;
          if (!char) continue;

          // Check player có Grey Wind sub-type trong House Stark không
          const nestedHouses: any[] = Array.isArray((char as any).nestedHouses)
            ? (char as any).nestedHouses
            : [];
          const hasGreyWind = nestedHouses.some(
            (h: any) =>
              !h.isLost &&
              (h.name ?? "").toLowerCase().includes("stark") &&
              (h.subType ?? "").toLowerCase() === "grey wind" &&
              !h.subTypeIsLost,
          );
          if (!hasGreyWind) continue;

          acEntries.push({
            player: side,
            quirkName: "Grey Wind",
            description: `[GM Action] Grey Wind: ${player.name} bị loại → Người nhà Stark nhận +1 all stats`,
            gmAction: true,
          });
        }

        // ── Merchants: sau combat → bán 1 Gear lấy 1 "Đồng Tiền Vàng" ──
        for (const side of ["player1", "player2"] as const) {
          const player = side === "player1" ? player1 : player2;
          const char = player.character;
          if (!char) continue;
          const archetypes: string[] = Array.isArray((char as any).archetypes)
            ? (char as any).archetypes
            : [];
          const hasMerchants = archetypes.some(
            (a: any) =>
              (typeof a === "string" ? a : (a?.name ?? "")).toLowerCase() ===
              "merchants",
          );
          if (!hasMerchants) continue;
          if (disabledItems.has(`${player.no}-archetype-Merchants`)) continue;

          const allGear = [
            ...((char as any).gear?.normalGear || []).filter(
              (g: any) => !g.isLost,
            ),
            ...((char as any).gear?.legacyGear || []).filter(
              (g: any) => !g.isLost,
            ),
          ]
            .map((g: any) => (typeof g === "string" ? g : (g?.name ?? "")))
            .filter(
              (name: string) =>
                !["đồng tiền vàng", "golden coin"].includes(name.toLowerCase()),
            );

          if (allGear.length === 0) {
            acEntries.push({
              player: side,
              quirkName: "Merchants",
              description:
                "[GM Action] Merchants: Không có Gear hợp lệ để bán.",
              gmAction: true,
            });
          } else {
            const wk = `after-Merchants-${side}`;
            acEntries.push({
              player: side,
              quirkName: "Merchants",
              description:
                'Merchants: Sau combat → Quay chọn 1 Gear để bán lấy 1 "Đồng Tiền Vàng":',
              wheelKey: wk,
              wheelItems: allGear.map((name: string) => ({
                label: name,
                weight: 1,
                isSuccess: true,
                color: "#f59e0b",
              })),
              gmAction: true,
            });
          }
        }

        // ── Primordial Being: khi thắng combat → Elemental Wheel ──
        for (const side of ["player1", "player2"] as const) {
          if (actualWinner !== side) continue;
          const player = side === "player1" ? player1 : player2;
          const char = player.character;
          if (!char) continue;
          const race = (
            (char as any).race?.race ||
            (char as any).race ||
            ""
          ).toLowerCase();
          const subRace = ((char as any).race?.subRace || "").toLowerCase();
          const isPrimordial =
            race.includes("primordial being") ||
            subRace.includes("primordial being");
          if (!isPrimordial) continue;

          const wk = `after-PrimordialElemental-${side}`;
          acEntries.push({
            player: side,
            quirkName: "Primordial Being",
            description:
              "Thắng combat → Elemental Wheel: nhận nguyên tố và hiệu ứng tương ứng.",
            wheelKey: wk,
            wheelItems: [
              {
                label: "Air",
                weight: 25,
                isSuccess: true,
                color: "#93c5fd",
                meta: { element: "air" },
              },
              {
                label: "Water",
                weight: 25,
                isSuccess: true,
                color: "#38bdf8",
                meta: { element: "water" },
              },
              {
                label: "Fire",
                weight: 25,
                isSuccess: true,
                color: "#f97316",
                meta: { element: "fire" },
              },
              {
                label: "Earth",
                weight: 25,
                isSuccess: true,
                color: "#84cc16",
                meta: { element: "earth" },
              },
            ],
          });
        }

        // ── Skeleton: khi thắng → kiểm tra tiến hóa Lich / Lich King ──
        for (const side of ["player1", "player2"] as const) {
          if (actualWinner !== side) continue; // chỉ khi thắng
          const player = side === "player1" ? player1 : player2;
          const char = player.character;
          if (!char) continue;
          const playerRace = ((char as any).race?.race || (char as any).race || "").toLowerCase();
          const isSkeletonFamily = playerRace === "skeleton" || playerRace.startsWith("skeleton (");
          if (!isSkeletonFamily) continue;

          // Đếm PvP Wins từ battleLog
          const battleLog: any[] = (char as any).battleLog || [];
          const pvpWinsFromLog = battleLog.filter(
            (entry: any) =>
              (entry.type || "").toLowerCase() === "pvp" &&
              (entry.result || "").toLowerCase() === "win",
          ).length;
          // Sau trận này thắng → pvpWins mới
          const newPvpWins = pvpWinsFromLog + 1;

          if (newPvpWins === 2) {
            // Đúng 2 wins → tiến hóa Skeleton (Lich), IQ cố định thành 8
            const currentIQ = (char as any).stats?.iq ?? 1;
            const iqDelta = 8 - currentIQ;
            acEntries.push({
              player: side,
              quirkName: "Skeleton → Skeleton (Lich)",
              description: `[GM Action] ${player.name} đạt 2 PvP Win → Đổi race thành "Skeleton (Lich)". IQ set thành 8 (${iqDelta >= 0 ? "+" : ""}${iqDelta}).`,
              statMods: iqDelta !== 0 ? [{ stat: "iq", delta: iqDelta }] : undefined,
              gmAction: true,
            });
          } else if (newPvpWins === 4) {
            // Đúng 4 wins → tiến hóa Skeleton (Lich King), +1 all stats
            acEntries.push({
              player: side,
              quirkName: "Skeleton → Skeleton (Lich King)",
              description: `[GM Action] ${player.name} đạt 4 PvP Win → Đổi race thành "Skeleton (Lich King)". Nhận +1 tất cả chỉ số.`,
              statMods: [
                { stat: "str", delta: 1 },
                { stat: "spd", delta: 1 },
                { stat: "dur", delta: 1 },
                { stat: "iq", delta: 1 },
                { stat: "biq", delta: 1 },
                { stat: "ma", delta: 1 },
              ],
              gmAction: true,
            });
          }
        }

        const p1WonCombat = actualWinner === "player1";
        const p2WonCombat = actualWinner === "player2";
        // Build roundResults map (str/spd/dur/iq/biq/ma → win/lose/tie) for each player
        const buildRoundResultsMap = (forSide: "player1" | "player2") => {
          const oppSide = forSide === "player1" ? "player2" : "player1";
          const map: Record<string, "win" | "lose" | "tie"> = {};
          for (let ri = 0; ri < resolvedRounds.length; ri++) {
            const r = resolvedRounds[ri];
            const key = r.stat;
            if (r.winner === forSide) {
              map[key] = "win";
            } else if (r.winner === "tie") {
              // Cruelty: round tie nhưng Cruelty spin quyết định ai thắng
              // → nếu side này thắng Cruelty hoặc đối thủ thua Cruelty → coi là "win"
              const selfCrueltySpun = roundSpinResults[`${ri}-Cruelty-${forSide}`];
              const oppCrueltySpun = roundSpinResults[`${ri}-Cruelty-${oppSide}`];
              if (selfCrueltySpun?.isSuccess === true || oppCrueltySpun?.isSuccess === false) {
                map[key] = "win";
              } else if (oppCrueltySpun?.isSuccess === true || selfCrueltySpun?.isSuccess === false) {
                map[key] = "lose";
              } else {
                map[key] = "tie";
              }
            } else {
              map[key] = "lose";
            }
          }
          return map;
        };

        processAfterCombat(
          player1,
          "player1",
          p1WonCombat,
          buildRoundResultsMap("player1"),
          player2,
          _p2Score,
        );
        processAfterCombat(
          player2,
          "player2",
          p2WonCombat,
          buildRoundResultsMap("player2"),
          player1,
          _p1Score,
        );

        // ── PvP Reward wheels ── (bỏ qua nếu là Roundtable Hold sub-combat) ──
        // forceIsSubCombat: khi buildAfterCombat bị defer qua roundtable hold, roundtableSubMode
        // trong closure vẫn là true → phải dùng forceIsSubCombat=false để không bỏ qua PvP Reward
        const _isSubCombat =
          forceIsSubCombat !== undefined ? forceIsSubCombat : roundtableSubMode;
        if (!_isSubCombat) {
          const PVP_REWARD_ITEMS = PVP_REWARD_WHEEL_ITEMS;
          const _pvpRewardItemsLegacy: WheelSpinItem[] = [
            {
              label: "+1 Strength",
              weight: 10,
              isSuccess: true,
              color: "#ef4444",
              meta: { stat: "str", delta: 1 },
            },
            {
              label: "+1 Speed",
              weight: 10,
              isSuccess: true,
              color: "#3b82f6",
              meta: { stat: "spd", delta: 1 },
            },
            {
              label: "+1 Durability",
              weight: 10,
              isSuccess: true,
              color: "#84cc16",
              meta: { stat: "dur", delta: 1 },
            },
            {
              label: "+1 IQ",
              weight: 10,
              isSuccess: true,
              color: "#06b6d4",
              meta: { stat: "iq", delta: 1 },
            },
            {
              label: "+1 BIQ",
              weight: 10,
              isSuccess: true,
              color: "#a855f7",
              meta: { stat: "biq", delta: 1 },
            },
            {
              label: "+1 Martial Arts",
              weight: 10,
              isSuccess: true,
              color: "#f97316",
              meta: { stat: "ma", delta: 1 },
            },
            {
              label: "Nhận 1 Gear",
              weight: 10,
              isSuccess: true,
              color: "#fbbf24",
              meta: { gmAction: "gear" },
            },
            {
              label: "+2 Stat Thấp Nhất",
              weight: 6,
              isSuccess: true,
              color: "#34d399",
              meta: { gmAction: "lowest2" },
            },
            {
              label: "+2 Stat Cao Nhất",
              weight: 6,
              isSuccess: true,
              color: "#f472b6",
              meta: { gmAction: "highest2" },
            },
            {
              label: "Nhận 1 Power",
              weight: 6,
              isSuccess: true,
              color: "#818cf8",
              meta: { gmAction: "power1" },
            },
            {
              label: "Nhận 2 Power",
              weight: 2,
              isSuccess: true,
              color: "#c084fc",
              meta: { gmAction: "power2" },
            },
            {
              label: "Nhận 1 Char Dev",
              weight: 4,
              isSuccess: true,
              color: "#fb923c",
              meta: { gmAction: "chardev1" },
            },
            {
              label: "Nhận 2 Char Dev",
              weight: 1,
              isSuccess: true,
              color: "#f87171",
              meta: { gmAction: "chardev2" },
            },
            {
              label: "+2 Stat ngẫu nhiên ×3",
              weight: 0.64,
              isSuccess: true,
              color: "#4ade80",
              meta: { gmAction: "rand2x3" },
            },
            {
              label: "+2 Stat ngẫu nhiên ×6",
              weight: 0.36,
              isSuccess: true,
              color: "#86efac",
              meta: { gmAction: "rand2x6" },
            },
            {
              label: "+1 All Stats",
              weight: 4,
              isSuccess: true,
              color: "#e2e8f0",
              meta: { gmAction: "allstats1" },
            },
            {
              label: "Lời Nguyền Địa Ngục",
              weight: 3,
              isSuccess: false,
              color: "#7c3aed",
              meta: { gmAction: "loi_nguyen_dia_nguc" },
            },
          ] as WheelSpinItem[]; // legacy — unused, PVP_REWARD_ITEMS now uses PVP_REWARD_WHEEL_ITEMS
          void _pvpRewardItemsLegacy;
          const POWER_RANGER_STAT_ITEMS = POWER_RANGER_STAT_WHEEL_ITEMS;
          const BRAVEST_POWER_ITEMS: WheelSpinItem[] =
            EffectRegistry.getAllByType("power").map((e) => ({
              label: e.name,
              weight: 1,
              isSuccess: true,
              color: "#818cf8",
            }));

          for (const side of ["player1", "player2"] as const) {
            const player = side === "player1" ? player1 : player2;
            const char = player.character;
            if (!char) continue;

            // Chỉ player thắng mới nhận PvP Reward
            const isWinnerSide = side === "player1" ? p1WonCombat : p2WonCombat;
            if (!isWinnerSide) continue;

            const quirks = (char.quirks || [])
              .filter((q: any) => !q.isLost)
              .map((q: any) =>
                (typeof q === "string" ? q : (q?.name ?? "")).toLowerCase(),
              );
            const archetypes = (char.archetypes || []).map((a: string) =>
              a.toLowerCase(),
            );
            const weapons = (char.weapons || [])
              .filter((w: any) => {
                if (w.isLost) return false;
                const rawName = typeof w === "string" ? w : (w?.name ?? "");
                if (rawName.toLowerCase().includes("không dùng được"))
                  return false;
                const wn = rawName.replace(/\s*\(.*?\)/g, "").trim();
                return !disabledItems.has(`${player.no}-weapon-${wn}`);
              })
              .map((w: any) =>
                (typeof w === "string" ? w : (w?.name ?? ""))
                  .replace(/\s*\(.*?\)/g, "")
                  .trim()
                  .toLowerCase(),
              );

            // Impatient quirk → không nhận PvP Reward
            if (
              quirks.some(
                (q) => q === "impatient" || q.startsWith("impatient ("),
              )
            ) {
              acEntries.push({
                player: side,
                quirkName: "Impatient",
                description: "Impatient: Không nhận PvP Reward vòng này.",
              });
              continue;
            }

            // Brainrot quirk → không nhận PvP Reward
            if (quirks.some((q) => q === "brainrot")) {
              acEntries.push({
                player: side,
                quirkName: "Brainrot",
                description: "Brainrot: Không nhận PvP Reward.",
              });
              continue;
            }

            // Memory Freeze: đối thủ thua có Memory Freeze → người thắng nhận Brainrot → không nhận PvP Reward
            const oppSideForMF = side === "player1" ? player2 : player1;
            const oppHasMemoryFreeze = (oppSideForMF?.character?.powers || [])
              .filter((p: any) => !p?.isLost)
              .some(
                (p: any) =>
                  (typeof p === "string"
                    ? p
                    : (p?.name ?? "")
                  ).toLowerCase() === "memory freeze",
              );
            if (oppHasMemoryFreeze) continue;

            // Power Ranger archetype → thay PvP Reward bằng 1 vòng quay stat (6 chỉ số)
            // Power Ranger có thể đến từ archetypes[] hoặc charDevs[] (Become A Power Ranger)
            const charDevNames = (char.charDevs || [])
              .filter((cd: any) => !cd.isLost)
              .map((cd: any) =>
                (typeof cd === "string" ? cd : (cd?.name ?? "")).toLowerCase(),
              );
            const isPowerRanger =
              archetypes.some(
                (a) => a === "power ranger" || a.startsWith("power ranger"),
              ) ||
              charDevNames.some((cd) => cd.startsWith("become a power ranger"));
            if (isPowerRanger) {
              const wk = `after-PvPReward-PowerRanger-${side}`;
              acEntries.push({
                player: side,
                quirkName: "Power Ranger",
                description:
                  "Power Ranger: Quay 1 vòng chọn chỉ số được tăng (thay PvP Reward)",
                wheelKey: wk,
                wheelItems: POWER_RANGER_STAT_ITEMS,
                statMods: [{ stat: "str", delta: 1 }], // placeholder, actual stat from spin result
                gmAction: true,
              });
              continue;
            }

            // Tính số vòng quay PvP Reward
            let rewardCount = 1;

            // Bravest of the Brave archetype → 2 vòng quay Power (không phải PvP Reward thường)
            const isBravest = archetypes.includes("bravest of the brave");
            if (isBravest) {
              for (let i = 1; i <= 2; i++) {
                const wk = `after-PvPReward-Bravest-${side}-${i}`;
                acEntries.push({
                  player: side,
                  quirkName: "Bravest of the Brave",
                  description: `Bravest of the Brave: Quay Power Wheel (${i}/2)`,
                  wheelKey: wk,
                  wheelItems: BRAVEST_POWER_ITEMS,
                  gmAction: true,
                });
              }
              continue;
            }

            // Drums weapon → +1 vòng quay PvP Reward
            if (weapons.some((w) => w === "drums" || w === "drum")) {
              rewardCount += 1;
            }

            // Hunter's Rewards power → +1 vòng quay PvP Reward
            const powers_lc = (char.powers || [])
              .filter((p: any) => !p?.isLost)
              .map((p: any) =>
                (typeof p === "string" ? p : (p?.name ?? "")).toLowerCase(),
              );
            if (powers_lc.includes("hunter's rewards")) {
              rewardCount += 1;
            }

            // Thêm vòng quay PvP Reward
            const hasDrums = weapons.some((w) => w === "drums" || w === "drum");
            const hasHuntersRewards = powers_lc.includes("hunter's rewards");
            for (let i = 1; i <= rewardCount; i++) {
              const wk = `after-PvPReward-${side}-${i}`;
              const suffix = rewardCount > 1 ? ` (${i}/${rewardCount})` : "";
              const bonusLabel =
                i === rewardCount && rewardCount > 1
                  ? hasHuntersRewards && hasDrums
                    ? i === rewardCount - 1
                      ? " (Drums +1)"
                      : " (Hunter's Rewards +1)"
                    : hasDrums
                      ? " (Drums +1)"
                      : hasHuntersRewards
                        ? " (Hunter's Rewards +1)"
                        : ""
                  : "";
              acEntries.push({
                player: side,
                quirkName: `PvP Reward${suffix}`,
                description: `Quay PvP Reward${bonusLabel}`,
                wheelKey: wk,
                wheelItems: PVP_REWARD_ITEMS,
                gmAction: true,
              });
            }
          }
        } // end !roundtableSubMode

        // Lady subTypeBonus expiry: nếu có Lady (+N) → buff đã được dùng combat này → nhắc GM xóa (+N)
        for (const side of ["player1", "player2"] as const) {
          const player = side === "player1" ? player1 : player2;
          const houses: any[] = Array.isArray(
            (player.character as any)?.nestedHouses,
          )
            ? (player.character as any).nestedHouses
            : [];
          for (const h of houses) {
            if (
              h.subType?.toLowerCase() === "lady" &&
              !h.subTypeIsLost &&
              !h.isLost &&
              typeof h.subTypeBonus === "number" &&
              h.subTypeBonus !== 0
            ) {
              const sign = h.subTypeBonus > 0 ? "+" : "";
              acEntries.push({
                player: side,
                quirkName: "Lady",
                description: `[GM Action] Lady: Buff ${sign}${h.subTypeBonus} all stats đã hết hiệu lực sau combat này`,
                gmAction: true,
              });
            }
          }
        }

        // Prepend before_combat_end entries (e.g. Edgelord) để hiển thị ở đầu danh sách sau combat
        const beforeEndAcEntries: AfterCombatEntry[] =
          beforeCombatEndEntries.map((e) => ({
            player: e.player,
            quirkName: e.sourceName,
            description: e.description,
          }));
        setAfterCombatEntries([...beforeEndAcEntries, ...acEntries]);
        setAfterCombatSpinResults({});

        // Auto-apply non-wheel stat mods immediately to player stats
        // (These are permanent changes to character stats that GMs track)
        const acBubbles: {
          player: "player1" | "player2";
          text: string;
          isPositive: boolean;
        }[] = [];
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
      }; // end buildAfterCombat

      if (pendingMA) {
        // Lưu buildAfterCombat để gọi sau khi spin Cruelty/MA xong
        pendingCrueltyAfterCombatRef.current = (
          w: "player1" | "player2",
          s1?: number,
          s2?: number,
        ) => buildAfterCombat(w, s1, s2);
        return; // Chờ roundSpinResults useEffect gọi lại
      }
      if (isRoundtablePending) {
        // Wrap với forceIsSubCombat=false vì khi defer gọi lại, roundtableSubMode trong closure
        // vẫn là true (sub-combat context) → sẽ bỏ qua PvP Reward nếu không override
        pendingAfterCombatBuildRef.current = (
          w: "player1" | "player2",
          s1?: number,
          s2?: number,
        ) => buildAfterCombat(w, s1, s2, false);
      } else {
        pendingAfterCombatBuildRef.current = null;
        buildAfterCombat(overallWinner);
      }

      // autoSave — full log như sandbox
      import("../utils/googleDrive").then(({ appendReportToDrive }) => {
        import("../config/googleDrive").then(({ REPORT_FILE_ID }) => {
          const now = new Date().toLocaleString("vi-VN");
          const sep = `\n${"─".repeat(60)}\nPVP SESSION: ${now}\n${"─".repeat(60)}\n`;
          const line = "═".repeat(60);
          const p1name = player1.name,
            p2name = player2.name;
          const winnerName = overallWinner === "player1" ? p1name : p2name;
          const loserName = overallWinner === "player1" ? p2name : p1name;
          const ls: string[] = [];

          ls.push(`PvP Battle Report`);
          ls.push(`Thời gian: ${now}`);
          ls.push(line);
          ls.push(`${p1name} (#${player1.no}) vs ${p2name} (#${player2.no})`);
          ls.push(
            `Race: ${player1.character?.race?.race ?? "?"} (T${player1.raceTier}) vs ${player2.character?.race?.race ?? "?"} (T${player2.raceTier})`,
          );
          ls.push(line);

          // Inventory
          const renderInv = (p: PvPPlayerData) => {
            const char = p.character;
            if (!char) return;
            ls.push(`\nItems & hiệu ứng — ${p.name}:`);
            const inv = buildInventoryList(char);
            if (inv.length === 0) ls.push("  (không có)");
            for (const it of inv) ls.push(`  [${it.sourceType}] ${it.name}`);
            if (char.runes?.runeword)
              ls.push(`  [runeword] ${char.runes.runeword}`);
          };
          renderInv(player1);
          renderInv(player2);

          // Stats before combat
          const SKEYS: {
            key: keyof typeof finalState.p1Stats;
            label: string;
          }[] = [
            { key: "str", label: "STR" },
            { key: "spd", label: "SPD" },
            { key: "dur", label: "DUR" },
            { key: "iq", label: "IQ" },
            { key: "biq", label: "BIQ" },
            { key: "ma", label: "MA" },
          ];
          const fmtStats = (s: typeof finalState.p1Stats) =>
            SKEYS.map(({ key, label }) => `${label}:${s[key] ?? 0}`).join(" ");
          ls.push(`\nStats vào combat:`);
          ls.push(`  ${p1name}: ${fmtStats(finalState.p1Stats)}`);
          ls.push(`  ${p2name}: ${fmtStats(finalState.p2Stats)}`);

          // Round-by-round
          ls.push(`\nKết quả từng round:`);
          for (const log of finalState.roundLogs) {
            if (log.roundIndex === -1) {
              ls.push(`  [PRE-COMBAT]`);
              for (const ev of log.events) {
                const pname = ev.player === "player1" ? p1name : p2name;
                ls.push(`    [${pname}] ${ev.description}`);
              }
              continue;
            }
            const rw =
              log.winner === "player1"
                ? p1name
                : log.winner === "player2"
                  ? p2name
                  : "HÒA";
            ls.push(
              `  ${log.statLabel}: ${rw} (${log.p1ValueUsed} vs ${log.p2ValueUsed})`,
            );
            for (const ev of log.events) {
              const pname = ev.player === "player1" ? p1name : p2name;
              ls.push(`    [${pname}] ${ev.source}: ${ev.description}`);
            }
            if ((log.carryOverToNext?.length ?? 0) > 0) {
              for (const co of log.carryOverToNext) {
                const pname = co.player === "player1" ? p1name : p2name;
                ls.push(
                  `    → Carry [${pname}]: ${co.source} ${co.value > 0 ? "+" : ""}${co.value} ${co.stat.toUpperCase()} round kế`,
                );
              }
            }
          }

          ls.push(
            `\nKết quả: ${winnerName} WIN ${Math.max(p1Score, p2Score)}-${Math.min(p1Score, p2Score)}`,
          );
          ls.push(`  ${loserName} thua`);
          if (tieBreaker === "race") ls.push(`  (Tie-breaker: Race Tier)`);

          // After-combat quirk effects logged separately via handleConfirmCombat

          ls.push(`\n${line}`);

          appendReportToDrive(REPORT_FILE_ID, sep + ls.join("\n") + "\n").catch(
            () => {},
          );
        });
      });
    }
  };
  return { resolveNextRound };
}
