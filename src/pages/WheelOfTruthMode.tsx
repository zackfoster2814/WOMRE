import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Character, CharacterStats } from "../types/character";
import { EffectResolver, Condition } from "../effects/resolver";
import { EffectRegistry } from "../effects/registry";
import { HandlerRegistry } from "../effects/handlers";
import { initializeEffectData } from "../effects/data";
import wheelBgImage from "../assets/img/wheel-bg.png";
import {
  fetchPlayerTexts,
  getPlayerIndex,
} from "../utils/googleDrive";
import {
  ProbabilityWheelModal,
  type WheelSpinItem,
} from "../components/ProbabilityWheelModal";
import { CombatEffectsPanel } from "../components/CombatEffectsPanel";
import { ArenaLoadingScreen } from "../components/three/ArenaLoadingScreen";
import { PvPBackground3D } from "../components/three/PvPBackground3D";
import { CombatEffects3D } from "../components/three/CombatEffects3D";
import { PlayerCard3DFrame } from "../components/three/PlayerCard3D";
import { ScoreDisplay3D } from "../components/three/ScoreDisplay3D";
import { Canvas } from "@react-three/fiber";
import { FloatingStatBubblesOverlay } from "../components/combat/FloatingStatBubblesOverlay";
import { SCPlayerCard } from "../components/combat/SCPlayerCard";
import { STAT_ORDER, _ALL_STAT_KEYS } from "../constants/battleZone";
import {
  normalizeStatKey,
  applyStatDelta,
  resolveStatTargets,
  getPerRoundEffects as getPerRoundEffectsFn,
  calcStatsWithDisabled,
} from "../utils/combatStats";
import {
  computeRoundPoints as computeRoundPointsFn,
  type ComputeRoundPointsContext,
} from "../utils/pointCalculation";
import { RoundResultsPanel } from "../components/combat/RoundResultsPanel";
import { DevWheelPanel } from "../components/combat/DevWheelPanel";
import { PlayerSidebar } from "../components/combat/PlayerSidebar";
import { AfterCombatPanel } from "../components/combat/AfterCombatPanel";
// import { BattleWheelSpinner } from "../components/combat/BattleWheelSpinner"; // WoT-specific — giữ lại, tạm comment
import {
  FallbackBgmController,
  detectCombatAudioTracks,
} from "../components/CombatAudioController";
import { CreatorsCatModal } from "../components/combat/CreatorsCatModal";
import { usePvPScores } from "../hooks/usePvPScores";
import { useWheelSpins } from "../hooks/useWheelSpins";
import { useWheelHandlers } from "../hooks/useWheelHandlers";
import { useStartCombat } from "../hooks/useStartCombat";
import { useResolveNextRound } from "../hooks/useResolveNextRound";
import {
  parsePlayerFromText,
  reResolveWithAllChars,
} from "../utils/playerParsing";
import {
  CRIT_ITEMS,
  EVASION_ITEMS,
  MISERICORDE_ITEMS,
  GAMBLER_ITEMS,
  CRUELTY_ITEMS,
  BLIND_ITEMS,
  MUTE_ITEMS,
} from "../constants/wheelConfigs";
import {
  PvPPlayerData,
  CombatResult,
  CarryOverEffect,
  RoundEvent,
  PointChange,
  RoundLog,
  DothrakiRule,
  StepCombatState,
  StatBubble,
  BattleModeProps,
} from "../types/battleZone";

// suppress unused import warnings for wheel configs used indirectly
void CRIT_ITEMS; void EVASION_ITEMS; void MISERICORDE_ITEMS; void GAMBLER_ITEMS; void CRUELTY_ITEMS; void BLIND_ITEMS; void MUTE_ITEMS;

let _wotEffectsInitialized = false;
function ensureEffectsInitialized() {
  if (!_wotEffectsInitialized) {
    initializeEffectData();
    _wotEffectsInitialized = true;
  }
}

let _bubbleIdCounter = 0;

export const WheelOfTruthMode = ({ onBack }: BattleModeProps) => {
  // ── Player data ───────────────────────────────────────────────────────────
  const [allPlayers, setAllPlayers] = useState<PvPPlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm1, setSearchTerm1] = useState("");
  const [searchTerm2, setSearchTerm2] = useState("");
  const [player1, setPlayer1] = useState<PvPPlayerData | null>(null);
  const [player2, setPlayer2] = useState<PvPPlayerData | null>(null);
  const [focus1, setFocus1] = useState(false);
  const [focus2, setFocus2] = useState(false);
  const [leftTab, setLeftTab] = useState<"effects" | "inventory">("effects");
  const [rightTab, setRightTab] = useState<"effects" | "inventory">("effects");

  // ── Dev mode ──────────────────────────────────────────────────────────────
  const [devMode, setDevMode] = useState(false);
  useEffect(() => {
    const SEQ = ["z", "v", "m"];
    let buf: string[] = [];
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        setDevMode((prev) => !prev);
        return;
      }
      buf.push(e.key.toLowerCase());
      if (buf.length > SEQ.length) buf = buf.slice(-SEQ.length);
      if (buf.join("") === SEQ.join("")) {
        buf = [];
        setDevMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Disabled items ────────────────────────────────────────────────────────
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

  // ── Audio ─────────────────────────────────────────────────────────────────
  const [audioResetKey, setAudioResetKey] = useState(0);
  const [masterVolume] = useState(1);
  const [bgmVolume] = useState(1);

  // ── Combat state ──────────────────────────────────────────────────────────
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [, setIsAnimating] = useState(false);
  const [, setCurrentRound] = useState(-1);
  const [stepState, setStepState] = useState<StepCombatState | null>(null);
  const [stepRoundIndex, setStepRoundIndex] = useState(-1);
  const [combatConfirmed, setCombatConfirmed] = useState(false);
  const [zoltraakBiq2Pending, setZoltraakBiq2Pending] = useState(false);
  const [pendingPreCombatCount, setPendingPreCombatCount] = useState(0);

  // 3D effect triggers
  const [p1EffectKey, setP1EffectKey] = useState(0);
  const [p2EffectKey, setP2EffectKey] = useState(0);
  const [p1Boost, setP1Boost] = useState(false);
  const [p1Debuff, setP1Debuff] = useState(false);
  const [p2Boost, setP2Boost] = useState(false);
  const [p2Debuff, setP2Debuff] = useState(false);
  const [critActive, setCritActive] = useState(false);

  // Round log view
  const [viewLogIndex, setViewLogIndex] = useState<number | null>(null);

  // Center tab: pre | wheel | after
  const [centerTab, setCenterTab] = useState<"pre" | "wheel" | "after">("pre");

  // Stubs for hooks that need roundtable state (not used in WheelOfTruth)
  const [isPendingRoundtable, setIsPendingRoundtable] = useState(false);
  const [, setPendingLoser] = useState<"player1" | "player2" | null>(null);
  const [, setSelectedTarnished] = useState<PvPPlayerData | null>(null);
  const [, setSubCombatResult] = useState<CombatResult | null>(null);

  // Refs needed by hooks
  const pendingAfterCombatBuildRef = useRef<any>(null);
  const pendingCrueltyAfterCombatRef = useRef<any>(null);
  const pendingFinalizeStateRef = useRef<any>(null);
  const preBiqFiredHandlersRef = useRef<{ p1: Set<string>; p2: Set<string> } | null>(null);
  const resolveNextRoundRef = useRef<(() => void) | null>(null);

  // ── Stat bubbles ──────────────────────────────────────────────────────────
  const [p1Bubbles, setP1Bubbles] = useState<StatBubble[]>([]);
  const [p2Bubbles, setP2Bubbles] = useState<StatBubble[]>([]);
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
  void p1Bubbles;
  void p2Bubbles;

  // ── Wheel spins state (from hook) ─────────────────────────────────────────
  const {
    roundSpinModal: _roundSpinModal,
    setRoundSpinModal,
    roundSpinResults,
    setRoundSpinResults,
    preCombatModal,
    setPreCombatModal,
    oneTrickPonyStat,
    setOneTrickPonyStat,
    huntersMarkStat,
    setHuntersMarkStat,
    setHuntersMarkStat2,
    guidanceStats,
    setGuidanceStats,
    raumanianSuccess,
    setRaumanianSuccess,
    goldenCoinPoints,
    setGoldenCoinPoints,
    cursedCoinTarget,
    setCursedCoinTarget,
    scryingSuccess,
    setScryingSuccess,
    encroachingShadowSuccess,
    setEncroachingShadowSuccess,
    goldShipResult,
    setGoldShipResult,
    rhittaResult,
    setRhittaResult,
    madScientistResult,
    setMadScientistResult,
    summoningScrollResult,
    setSummoningScrollResult,
    tricksterResult,
    setTricksterResult,
    blackMagicStat,
    setBlackMagicStat,
    creatorsCatModal,
    setCreatorsCatModal,
    afterCombatEntries,
    setAfterCombatEntries,
    afterCombatSpinResults,
    setAfterCombatSpinResults,
    dothrakiSpinResult,
    setDothrakiSpinResult,
  } = useWheelSpins();

  // ── Per-round effects helper ───────────────────────────────────────────────
  const getPerRoundEffects = (char: Character | undefined, playerNo?: number) =>
    getPerRoundEffectsFn(char, playerNo, disabledItems);

  // ── computeRoundPoints ────────────────────────────────────────────────────
  const computeRoundPoints = (
    side: "player1" | "player2",
    winner: "player1" | "player2" | "tie",
    roundIdx: number,
    effects: { onWin: string[]; onLose: string[]; onTie: string[] },
    statKey?: string,
    roundsWonBefore?: number,
  ): { pts: number; pending: boolean; color: string; autoApplied?: boolean; engineBase?: number } => {
    const ctx: ComputeRoundPointsContext = {
      roundSpinResults,
      disabledItems,
      player1,
      player2,
      oneTrickPonyStat,
      huntersMarkStat,
      tricksterResult,
      stepState,
      getPerRoundEffects,
    };
    return computeRoundPointsFn(side, winner, roundIdx, effects, statKey, roundsWonBefore, ctx);
  };

  // ── computeRoundStep (copied from StatsComparisonMode) ────────────────────
  const computeRoundStep = (
    roundIndex: number,
    state: StepCombatState,
    p1: PvPPlayerData,
    p2: PvPPlayerData,
    otpStats: Record<string, string> = {},
    hmStats: Record<string, string> = {},
    forcedWinner?: "player1" | "player2" | null,
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
        events.push({ player: "player1", source: co.source, description: `+${co.value} ${key.toUpperCase()} (từ round trước)`, type: "carry_over" });
      }
    }
    for (const co of state.p2CarryOver) {
      if (co.stat === key) {
        p2Val += co.value;
        events.push({ player: "player2", source: co.source, description: `+${co.value} ${key.toUpperCase()} (từ round trước)`, type: "carry_over" });
      }
    }

    // Bash / Luminescence: apply debuff -3 random stat từ spin round trước
    if (roundIndex > 0) {
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
        const oppPlayer = oppSide === "player1" ? p1 : p2;
        const oppHasURC =
          (oppPlayer.character?.powers || []).some(
            (pw: any) =>
              !pw.isLost &&
              (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() === "uno reverse card",
          ) && !disabledItems.has(`${oppPlayer.no}-power-Uno Reverse Card`);
        const actualTarget: "player1" | "player2" = oppHasURC ? winnerSide : oppSide;
        if (actualTarget === "player1") p1Val -= 3;
        else p2Val -= 3;
        events.push({
          player: actualTarget,
          source: sourceName,
          description: oppHasURC
            ? `[Uno Reverse Card] ${sourceName}: -3 stat round này (debuff bị phản về ${winnerSide})`
            : `${sourceName}: -3 stat round này (debuff từ round trước)`,
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

    // Morningstar: log event at round 0
    if (roundIndex === 0) {
      const weaponEntries = EffectRegistry.getAllByType("weapon");
      const getCleanWeaponName = (w: any) =>
        (typeof w === "string" ? w : (w?.name ?? "")).replace(/\s*\(.*?\)/g, "").trim();
      const hasPhysicalWeapon = (char: any) =>
        (char?.weapons || []).some((w: any) => {
          if (w?.isLost) return false;
          const wName = getCleanWeaponName(w);
          if (!wName) return false;
          const entry = weaponEntries.find((e) => e.name.toLowerCase() === wName.toLowerCase());
          return entry?.tags?.includes("physical") ?? false;
        });
      const p1HasMorningstar =
        (p1.character?.weapons || []).some(
          (w: any) => !w?.isLost && getCleanWeaponName(w).toLowerCase() === "morningstar",
        ) && !disabledItems.has(`${p1.no}-weapon-Morningstar`);
      const p2HasMorningstar =
        (p2.character?.weapons || []).some(
          (w: any) => !w?.isLost && getCleanWeaponName(w).toLowerCase() === "morningstar",
        ) && !disabledItems.has(`${p2.no}-weapon-Morningstar`);
      if (p1HasMorningstar && hasPhysicalWeapon(p2.character))
        events.push({ player: "player1", source: "Morningstar", description: "+2 STR (Morningstar — đối thủ dùng vũ khí Physical)", type: "stat_boost" });
      if (p2HasMorningstar && hasPhysicalWeapon(p1.character))
        events.push({ player: "player2", source: "Morningstar", description: "+2 STR (Morningstar — đối thủ dùng vũ khí Physical)", type: "stat_boost" });
    }

    // Dothraki: log active rule at round 0
    if (roundIndex === 0) {
      const logDothraki = (dSide: "player1" | "player2", rule: DothrakiRule) => {
        if (rule === null) return;
        const oppSide = dSide === "player1" ? "player2" : "player1";
        const RULE_DESC: Record<number, { player: "player1" | "player2"; desc: string }> = {
          1: { player: oppSide, desc: "Luật 1: Đã đảo stats đối thủ (STR↔MA, SPD↔BIQ, DUR↔IQ)" },
          2: { player: dSide, desc: "Luật 2: Đã đảo STR↔BIQ của Dothraki" },
          3: { player: dSide, desc: "Luật 3: Đã đảo SPD↔IQ của Dothraki" },
          4: { player: dSide, desc: "Luật 4: Đã đảo DUR↔MA của Dothraki" },
          5: { player: dSide, desc: "Luật 5: Dothraki +4 all stats, đối thủ +3 điểm khởi đầu (đã tính)" },
          6: { player: oppSide, desc: "Luật 6: Đối thủ +5 all stats (đã tính). Dothraki +1 all per điểm sau trận [GM Note]" },
        };
        const entry = RULE_DESC[rule];
        if (entry) events.push({ player: entry.player, source: "Dothraki", description: entry.desc, type: "stat_boost" });
      };
      logDothraki("player1", state.p1DothrakiRule);
      logDothraki("player2", state.p2DothrakiRule);
    }

    // Check auto_lose_round effects
    const checkAutoLose = (player: PvPPlayerData, playerSide: "player1" | "player2") => {
      const fx = EffectResolver.calculateCharacterEffects(player.character!, { isPvE: false });
      for (const ce of fx.combatEffects) {
        if (ce.isActive === false) continue;
        if (ce.effect?.type !== "auto_lose_round") continue;
        if (ce.effect?.timing !== "during_combat") continue;
        const autoLoseStat = normalizeStatKey((ce.effect as any).stat || "");
        if (autoLoseStat !== key) continue;
        const srcName = ce.source?.name || "?";
        const srcType = ce.source?.type || "?";
        if (disabledItems.has(`${player.no}-${srcType}-${srcName}`)) continue;
        if (playerSide === "player1") p1Val = -999;
        else p2Val = -999;
        events.push({ player: playerSide, source: srcName, description: `Auto-thua round ${key.toUpperCase()} (${srcName})`, type: "stat_debuff" });
      }
    };
    if (p1.character) checkAutoLose(p1, "player1");
    if (p2.character) checkAutoLose(p2, "player2");

    // Promised Consort
    const applyPromisedConsort = (player: PvPPlayerData, playerSide: "player1" | "player2") => {
      const archetypes: string[] = (player.character as any)?.archetypes || [];
      if (!archetypes.some((a) => a === "Promised Consort")) return;
      const lovers: any[] = player.character?.lover || [];
      const activeLovers = lovers.filter((l: any) => !l.isLost);
      if (activeLovers.length === 0) return;
      const STAT_KEYS_SHORT = ["str", "spd", "dur", "iq", "biq", "ma"] as (keyof CharacterStats)[];
      const chooseLover = (loverList: any[]) => {
        const femboy = loverList.find((l: any) => {
          const n = typeof l === "string" ? l : (l?.name ?? "");
          return allPlayers.find((p) => p.name === n)?.character?.archetypes?.includes("Femboy");
        });
        return femboy || loverList[0];
      };
      const chosen = chooseLover(activeLovers);
      const loverName = typeof chosen === "string" ? chosen : (chosen?.name ?? "");
      const loverPlayer = allPlayers.find((p) => p.name === loverName);
      if (!loverPlayer) return;
      const loverStats = loverPlayer.baseStats || loverPlayer.stats;
      const highest = Math.max(...STAT_KEYS_SHORT.map((k) => loverStats[k] || 0));
      if (playerSide === "player1") p1Val += highest;
      else p2Val += highest;
      events.push({ player: playerSide, source: "Promised Consort", description: `+${highest} từ Base Stat cao nhất của "${loverName}" (Promised Consort)`, type: "stat_boost" });
    };
    if (p1.character) applyPromisedConsort(p1, "player1");
    if (p2.character) applyPromisedConsort(p2, "player2");

    // Instruments of the Sirens: during_combat debuff -1 all stats at round 0
    if (roundIndex === 0) {
      const applyIoSDebuff = (attacker: PvPPlayerData, attackerSide: "player1" | "player2") => {
        const weapons: any[] = (attacker.character?.weapons || []).filter((w: any) => !w?.isLost);
        const hasIoS = weapons.some((w: any) =>
          (typeof w === "string" ? w : (w?.name ?? "")).toLowerCase().startsWith("instruments of the sirens"),
        );
        if (!hasIoS) return;
        if (disabledItems.has(`${attacker.no}-weapon-Instruments of the Sirens`)) return;
        const oppSide = attackerSide === "player1" ? "player2" : "player1";
        if (oppSide === "player1") p1Val -= 1;
        else p2Val -= 1;
        events.push({ player: oppSide, source: "Instruments of the Sirens", description: `-1 All Stats round này (Instruments of the Sirens)`, type: "stat_debuff" });
      };
      applyIoSDebuff(p1, "player1");
      applyIoSDebuff(p2, "player2");
    }

    // Determine winner
    let winner: "player1" | "player2" | "tie";
    if (forcedWinner) winner = forcedWinner;
    else if (p1Val < 0 && p2Val < 0) winner = "tie";
    else if (p1Val > p2Val) winner = "player1";
    else if (p2Val > p1Val) winner = "player2";
    else winner = "tie";

    // One Trick Pony checks
    const p1HasOTP = (p1.character?.quirks || []).filter((q: any) => !q.isLost).some((q: any) => q.name.toLowerCase() === "one trick pony");
    const p2HasOTP = (p2.character?.quirks || []).filter((q: any) => !q.isLost).some((q: any) => q.name.toLowerCase() === "one trick pony");
    const p1OTPStat = otpStats["player1"];
    const p2OTPStat = otpStats["player2"];

    // Hunter's Mark checks
    const p1HasHM = (p1.character?.powers || []).filter((pw: any) => !pw.isLost).some(
      (pw: any) => (typeof pw === "string" ? pw : pw.name)?.toLowerCase() === "hunter's mark",
    );
    const p2HasHM = (p2.character?.powers || []).filter((pw: any) => !pw.isLost).some(
      (pw: any) => (typeof pw === "string" ? pw : pw.name)?.toLowerCase() === "hunter's mark",
    );
    const HM_LABEL_TO_KEY: Record<string, string> = {
      Strength: "str", Speed: "spd", Durability: "dur", IQ: "iq", BIQ: "biq", MA: "ma",
      strength: "str", speed: "spd", durability: "dur",
    };
    const p1HMStat = HM_LABEL_TO_KEY[hmStats["player1"]] ?? hmStats["player1"];
    const p2HMStat = HM_LABEL_TO_KEY[hmStats["player2"]] ?? hmStats["player2"];
    const roundStatLabel = key;

    // Base points
    let p1Points: number;
    let p2Points: number;
    let p1ResetScore = false;
    let p2ResetScore = false;
    if (winner === "player1") {
      p1Points = p1HasOTP ? (p1OTPStat ? (p1OTPStat === roundStatLabel ? 3 : 0) : 1) : 1;
      p2Points = 0;
    } else if (winner === "player2") {
      p1Points = 0;
      p2Points = p2HasOTP ? (p2OTPStat ? (p2OTPStat === roundStatLabel ? 3 : 0) : 1) : 1;
    } else {
      p1Points = 0;
      p2Points = 0;
    }

    // Hunter's Mark bonus
    const p1HasSpellFlux = (p1.character?.powers || []).some(
      (p: any) => !p?.isLost && (typeof p === "string" ? p : p.name)?.toLowerCase().startsWith("spell flux"),
    );
    const p2HasSpellFlux = (p2.character?.powers || []).some(
      (p: any) => !p?.isLost && (typeof p === "string" ? p : p.name)?.toLowerCase().startsWith("spell flux"),
    );
    if (p1HasHM && winner === "player1" && p1HMStat && p1HMStat === key) {
      p1Points += p1HasSpellFlux ? 2 : 1;
    }
    if (p2HasHM && winner === "player2" && p2HMStat && p2HMStat === key) {
      p2Points += p2HasSpellFlux ? 2 : 1;
    }

    // Base point change records
    if (winner === "player1") {
      if (p1HasOTP && p1OTPStat) {
        pointChanges.push({ player: "player1", delta: p1Points, reason: `One Trick Pony: Stat được chọn = ${p1OTPStat}. Thắng ${roundStatLabel} → ${p1Points} điểm; các stat khác thắng → 0 điểm` });
      } else {
        pointChanges.push({ player: "player1", delta: p1Points, reason: "thắng round" });
      }
    } else if (winner === "player2") {
      if (p2HasOTP && p2OTPStat) {
        pointChanges.push({ player: "player2", delta: p2Points, reason: `One Trick Pony: Stat được chọn = ${p2OTPStat}. Thắng ${roundStatLabel} → ${p2Points} điểm; các stat khác thắng → 0 điểm` });
      } else {
        pointChanges.push({ player: "player2", delta: p2Points, reason: "thắng round" });
      }
    }

    const p1WonSoFar = state.resolvedRounds.filter((r) => r.winner === "player1").length;
    const p1LostSoFar = state.resolvedRounds.filter((r) => r.winner === "player2").length;
    const p2WonSoFar = p1LostSoFar;
    const p2LostSoFar = p1WonSoFar;

    // Borrowed Time
    const hasBorrowedTimeP1 =
      (p1.character?.powers || []).filter((pw: any) => !pw.isLost).some(
        (pw: any) => (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() === "borrowed time",
      ) && !disabledItems.has(`${p1.no}-power-Borrowed Time`);
    const hasBorrowedTimeP2 =
      (p2.character?.powers || []).filter((pw: any) => !pw.isLost).some(
        (pw: any) => (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() === "borrowed time",
      ) && !disabledItems.has(`${p2.no}-power-Borrowed Time`);
    const p1BorrowedTimeFired = state.p1FiredHandlers.has("borrowed_time");
    const p2BorrowedTimeFired = state.p2FiredHandlers.has("borrowed_time");

    if (hasBorrowedTimeP1 && !p1BorrowedTimeFired && p1LostSoFar === 2 && winner === "player2") {
      p2Points = 0;
      const idx = pointChanges.findIndex((pc) => pc.player === "player2");
      if (idx !== -1) pointChanges[idx] = { player: "player2", delta: 0, reason: "Borrowed Time: bị chặn điểm" };
      events.push({ player: "player1", source: "Borrowed Time", description: "Borrowed Time: Đã thua 2 round — đối thủ không nhận điểm round này!", type: "stat_boost" });
      state.p1FiredHandlers.add("borrowed_time");
    }
    if (hasBorrowedTimeP2 && !p2BorrowedTimeFired && p2LostSoFar === 2 && winner === "player1") {
      p1Points = 0;
      const idx = pointChanges.findIndex((pc) => pc.player === "player1");
      if (idx !== -1) pointChanges[idx] = { player: "player1", delta: 0, reason: "Borrowed Time: bị chặn điểm" };
      events.push({ player: "player2", source: "Borrowed Time", description: "Borrowed Time: Đã thua 2 round — đối thủ không nhận điểm round này!", type: "stat_boost" });
      state.p2FiredHandlers.add("borrowed_time");
    }

    // Build handler context helper
    const buildCtx = (isSelf: boolean) => ({
      self: {
        character: isSelf ? p1.character : p2.character,
        stats: isSelf ? state.p1Stats : state.p2Stats,
        baseStats: isSelf ? p1.baseStats : p2.baseStats,
        race: isSelf ? p1.character?.race?.race || p1.race : p2.character?.race?.race || p2.race,
        raceTier: isSelf ? p1.raceTier : p2.raceTier,
        bracket: isSelf ? p1.character?.tournament?.bracket || "winner" : p2.character?.tournament?.bracket || "winner",
        pvpWins: isSelf ? p1.character?.tournament?.pvpWins || 0 : p2.character?.tournament?.pvpWins || 0,
        hasLover: isSelf
          ? (p1.character?.lover || []).filter((l: any) => !l.isLost).length > 0
          : (p2.character?.lover || []).filter((l: any) => !l.isLost).length > 0,
        powers: isSelf
          ? (p1.character?.powers || []).filter((p: any) => !p.isLost).map((p: any) => (typeof p === "string" ? p : p.name))
          : (p2.character?.powers || []).filter((p: any) => !p.isLost).map((p: any) => (typeof p === "string" ? p : p.name)),
        quirks: isSelf
          ? (p1.character?.quirks || []).filter((q: any) => !q.isLost).map((q: any) => q.name)
          : (p2.character?.quirks || []).filter((q: any) => !q.isLost).map((q: any) => q.name),
        weapons: isSelf ? p1.character?.weapons || [] : p2.character?.weapons || [],
        gears: isSelf
          ? [...(p1.character?.gear?.normalGear || []), ...(p1.character?.gear?.legacyGear || [])].map((g: any) => g.name)
          : [...(p2.character?.gear?.normalGear || []), ...(p2.character?.gear?.legacyGear || [])].map((g: any) => g.name),
        roundsWon: isSelf ? p1WonSoFar : p2WonSoFar,
        roundsLost: isSelf ? p1LostSoFar : p2LostSoFar,
      },
      opponent: {
        character: isSelf ? p2.character : p1.character,
        stats: isSelf ? state.p2Stats : state.p1Stats,
        baseStats: isSelf ? p2.baseStats : p1.baseStats,
        race: isSelf ? p2.character?.race?.race || p2.race : p1.character?.race?.race || p1.race,
        subRace: isSelf
          ? ((p2.character?.race?.race || "").toLowerCase() === "reincarnator" ? (p2.character?.race?.actualRace || "").toLowerCase() || undefined : undefined)
          : ((p1.character?.race?.race || "").toLowerCase() === "reincarnator" ? (p1.character?.race?.actualRace || "").toLowerCase() || undefined : undefined),
        raceTier: isSelf ? p2.raceTier : p1.raceTier,
        hasLover: isSelf
          ? (p2.character?.lover || []).filter((l: any) => !l.isLost).length > 0
          : (p1.character?.lover || []).filter((l: any) => !l.isLost).length > 0,
        powers: isSelf
          ? (p2.character?.powers || []).filter((p: any) => !p.isLost).map((p: any) => (typeof p === "string" ? p : p.name))
          : (p1.character?.powers || []).filter((p: any) => !p.isLost).map((p: any) => (typeof p === "string" ? p : p.name)),
        quirks: isSelf
          ? (p2.character?.quirks || []).filter((q: any) => !q.isLost).map((q: any) => q.name)
          : (p1.character?.quirks || []).filter((q: any) => !q.isLost).map((q: any) => q.name),
        weapons: isSelf ? p2.character?.weapons || [] : p1.character?.weapons || [],
        gears: isSelf
          ? [...(p2.character?.gear?.normalGear || []), ...(p2.character?.gear?.legacyGear || [])].map((g: any) => g.name)
          : [...(p1.character?.gear?.normalGear || []), ...(p1.character?.gear?.legacyGear || [])].map((g: any) => g.name),
      },
      isFinals: false,
      isPvE: false,
      currentRound: roundIndex,
      currentRoundStat: key,
      currentRoundResult:
        winner === "tie" ? "tie" : winner === (isSelf ? "player1" : "player2") ? "win" : "lose",
      totalRounds: 6,
      roundResults: (() => {
        const longKey: Record<string, string> = { str: "strength", spd: "speed", dur: "durability", iq: "iq", biq: "biq", ma: "ma" };
        const toResult = (w: "player1" | "player2" | "tie", self: boolean) =>
          w === (self ? "player1" : "player2") ? "win" : w === (self ? "player2" : "player1") ? "lose" : "tie";
        const entries = state.resolvedRounds.map((r) => [longKey[r.stat] ?? r.stat, toResult(r.winner, isSelf)]);
        entries.push([longKey[key] ?? key, toResult(winner, isSelf)]);
        return Object.fromEntries(entries);
      })(),
    });

    const newP1Stats = { ...state.p1Stats };
    const newP2Stats = { ...state.p2Stats };

    // Apply carry-over debuffs on non-current-round stats
    for (const co of state.p1CarryOver) {
      if (co.stat !== key) {
        applyStatDelta(newP1Stats, co.stat, co.value);
        events.push({ player: "player1", source: co.source, description: `${co.value > 0 ? "+" : ""}${co.value} ${(co.stat as string).toUpperCase()} (carry từ round trước)`, type: "carry_over" });
      }
    }
    for (const co of state.p2CarryOver) {
      if (co.stat !== key) {
        applyStatDelta(newP2Stats, co.stat, co.value);
        events.push({ player: "player2", source: co.source, description: `${co.value > 0 ? "+" : ""}${co.value} ${(co.stat as string).toUpperCase()} (carry từ round trước)`, type: "carry_over" });
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
      const fx = EffectResolver.calculateCharacterEffects(player.character!, { isPvE: false });
      const isWinner = roundWinner === playerSide;
      const isLoser = roundWinner !== playerSide && roundWinner !== "tie";
      let duringPowerActivations = 0;
      const ctx = buildCtx(isSelf) as any;

      const oppPlayer = isSelf ? p2 : p1;
      const selfHasFairDuel =
        (player.character?.powers || []).filter((pw: any) => !pw.isLost).some(
          (pw: any) => (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase().startsWith("fair duel"),
        ) && !([...disabledItems].some(k => k.startsWith(`${player.no}-power-Fair Duel`)));
      const oppHasFairDuel =
        (oppPlayer.character?.powers || []).filter((pw: any) => !pw.isLost).some(
          (pw: any) => (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase().startsWith("fair duel"),
        ) && !([...disabledItems].some(k => k.startsWith(`${oppPlayer.no}-power-Fair Duel`)));
      const fairDuelActive = selfHasFairDuel || oppHasFairDuel;

      const hasSpellFluxPlayer = (player.character?.powers || []).some(
        (p: any) => (typeof p === "string" ? p : p.name)?.toLowerCase().startsWith("spell flux") && !p.isLost,
      );
      let spellFluxUsed = false;

      for (const ce of fx.combatEffects) {
        if (ce.isActive === false) continue;
        const sourceName = ce.source?.name || "?";
        const sourceType = ce.source?.type || "?";
        const disabledKey = `${player.no}-${sourceType}-${sourceName}`;
        if (disabledItems.has(disabledKey)) continue;

        const timing = ce.effect?.timing;
        const handlerName = ce.effect?.customHandler;

        if (!["on_round_win", "on_round_lose", "on_round_tie", "during_combat"].includes(timing || "")) continue;
        if (timing === "on_round_win" && !isWinner) continue;
        if (timing === "on_round_lose" && !isLoser) continue;
        if (timing === "on_round_tie" && roundWinner !== "tie") continue;
        if (timing === "before_combat") continue;

        if (!handlerName) {
          if (ce.effect?.type === "extra_point_on_win") continue;
          if (ce.effect?.type === "lose_points_on_lose" && isLoser) {
            if (playerSide === "player1") p1ResetScore = true;
            else p2ResetScore = true;
            events.push({ player: playerSide, source: sourceName, description: `Thua round → mất toàn bộ điểm tích lũy (${sourceName})`, type: "info" });
            continue;
          }
          if (
            (timing === "during_combat" || timing === "on_round_win" || timing === "on_round_lose") &&
            (ce.effect?.type === "stat_modifier" || ce.effect?.type === "debuff") &&
            ce.effect.value !== undefined &&
            ce.effect.stat
          ) {
            if (timing === "during_combat" && roundIndex !== 0) continue;
            const conditions: Condition[] = [...(ce.effect.conditions || [])];
            if (ce.source?.effects) {
              const srcEffect = ce.source.effects.find(
                (e: any) => e.type === ce.effect.type && e.timing === ce.effect.timing && JSON.stringify(e.stat) === JSON.stringify(ce.effect.stat),
              );
              if (srcEffect?.conditions) {
                for (const c of srcEffect.conditions) {
                  if (!conditions.some((existing) => JSON.stringify(existing) === JSON.stringify(c))) {
                    conditions.push(c);
                  }
                }
              }
            }
            if (conditions.some((c: any) => c.type === "probability")) continue;

            const selfRaceTier = isSelf ? p1.raceTier : p2.raceTier;
            const oppRaceTier = isSelf ? p2.raceTier : p1.raceTier;
            const oppChar = isSelf ? p2.character : p1.character;
            const oppRaceRaw = (oppChar?.race?.race || "").toLowerCase();
            const oppRace = oppRaceRaw === "reincarnator"
              ? (oppChar?.race?.actualRace || "").toLowerCase() || oppRaceRaw
              : oppRaceRaw;
            const selfBracket = player.character?.tournament?.bracket || "";

            const conditionMet = conditions.every((cond: any) => {
              if (cond.type === "probability") return true;
              if (cond.type === "race_match" && cond.races) return cond.races.some((r: string) => r.toLowerCase() === oppRace);
              if (cond.type === "race_match" && cond.excludeRaces) return !cond.excludeRaces.some((r: string) => r.toLowerCase() === oppRace);
              if (cond.type === "race_tier_compare") {
                if (!cond.tierOperator || selfRaceTier === undefined || oppRaceTier === undefined) return false;
                if (cond.tierOperator === "<") return selfRaceTier < oppRaceTier;
                if (cond.tierOperator === ">") return selfRaceTier > oppRaceTier;
                if (cond.tierOperator === "=") return selfRaceTier === oppRaceTier;
                return false;
              }
              if (cond.type === "bracket" && cond.bracket) return selfBracket.toLowerCase() === cond.bracket.toLowerCase();
              if (cond.type === "has_item" && cond.itemType && cond.itemName) {
                const checkSelf = cond.checkTarget === "self";
                const checkChar = checkSelf ? (isSelf ? p1.character : p2.character) : (isSelf ? p2.character : p1.character);
                if (cond.itemType === "archetype") {
                  const archetypes = (checkChar?.archetypes || []).map((a: any) => (typeof a === "string" ? a : (a?.name ?? "")).toLowerCase());
                  return archetypes.includes(cond.itemName.toLowerCase());
                }
                if (cond.itemType === "power") {
                  const powers = (checkChar?.powers || []).filter((p: any) => !p.isLost).map((p: any) => (typeof p === "string" ? p : (p?.name ?? "")).toLowerCase());
                  return powers.includes(cond.itemName.toLowerCase());
                }
              }
              return true;
            });
            if (!conditionMet) continue;

            const isOpponentTarget = ce.effect.target === "opponent";
            const affectedSide = isOpponentTarget ? (playerSide === "player1" ? "player2" : "player1") : playerSide;
            const currentStats = affectedSide === "player1" ? newP1Stats : newP2Stats;
            const statTargets = resolveStatTargets(ce.effect.stat, currentStats);
            const val = ce.effect.value;
            if (isOpponentTarget && val < 0 && fairDuelActive) {
              events.push({ player: affectedSide, source: sourceName, description: `Fair Duel: miễn nhiễm debuff từ ${sourceName}`, type: "info" });
              continue;
            }
            const targetStats = affectedSide === "player1" ? newP1Stats : newP2Stats;
            const affectedChar = affectedSide === "player1" ? p1.character : p2.character;
            const affectedRace = (affectedChar?.race?.race || "").toLowerCase();
            for (const csKey of statTargets) {
              if (csKey === "iq" && affectedRace === "skeleton") {
                events.push({ player: affectedSide, source: sourceName, description: `[Skeleton] IQ không thể thay đổi — bỏ qua ${val >= 0 ? "+" : ""}${val} IQ`, type: "info" });
                continue;
              }
              applyStatDelta(targetStats, csKey, val);
            }
            const appliedTargets = statTargets.filter((k) => !(k === "iq" && affectedRace === "skeleton"));
            if (appliedTargets.length > 0) {
              events.push({
                player: affectedSide,
                source: sourceName,
                description: `${val >= 0 ? "+" : ""}${val} ${ce.effect.stat === "all" ? "All" : appliedTargets.map((s) => s.toUpperCase()).join("/")} (${sourceName}${isOpponentTarget ? " → opponent" : ""})`,
                type: val >= 0 ? "stat_boost" : "stat_debuff",
              });
            }
            if (hasSpellFluxPlayer && !spellFluxUsed && timing === "during_combat" && ce.source?.type === "power") {
              spellFluxUsed = true;
              events.push({ player: playerSide, source: "Spell Flux", description: `[Spell Flux] ${sourceName} kích hoạt 2 lần!`, type: "info" });
              for (const csKey of appliedTargets) applyStatDelta(affectedSide === "player1" ? newP1Stats : newP2Stats, csKey, val);
              if (appliedTargets.length > 0) {
                events.push({
                  player: affectedSide,
                  source: sourceName,
                  description: `${val >= 0 ? "+" : ""}${val} ${ce.effect.stat === "all" ? "All" : appliedTargets.map((s) => s.toUpperCase()).join("/")} (${sourceName}${isOpponentTarget ? " → opponent" : ""}) [Spell Flux x2]`,
                  type: val >= 0 ? "stat_boost" : "stat_debuff",
                });
              }
            }
          }
          continue;
        }

        // Custom handlers
        if (handlerName === "divine_smite_ma_round") {
          if (key === "ma" && isWinner) {
            const pts = (ce.effect as any).points ?? 1;
            if (playerSide === "player1") p1Points += pts;
            else p2Points += pts;
            pointChanges.push({ player: playerSide, delta: pts, reason: `Divine Smite: thắng round MA → +${pts} điểm` });
            events.push({ player: playerSide, source: sourceName, description: `+${pts} điểm (Divine Smite — thắng round MA)`, type: "info" });
          }
          continue;
        }
        if (handlerName === "blind_no_point" || handlerName === "mute_stat_debuff") continue;
        if (handlerName === "needle_lowest_stat_bonus") continue;
        if (handlerName === "morningstar_physical_bonus") continue;
        if (handlerName === "spell_flux_double_first_in_combat") continue;
        if (handlerName === "gold_ship_coin_flip") continue;
        if (handlerName === "one_trick_pony_stat_selection") continue;
        if (handlerName === "hunters_mark_random_round") {
          const STAT_KEY_TO_LABEL: Record<string, string> = { str: "Strength", spd: "Speed", dur: "Durability", iq: "IQ", biq: "BIQ", ma: "MA" };
          const hmChosen = hmStats[playerSide];
          const hmLabel = hmChosen ? (STAT_KEY_TO_LABEL[hmChosen] ?? hmChosen) : "?";
          events.push({ player: playerSide, source: sourceName, description: `Hunter's Mark: Round được chọn = ${hmLabel}`, type: "info" });
          continue;
        }
        if (handlerName === "conquerer_speed_win" && (playerSide === "player1" ? newP1ConquerorFired : newP2ConquerorFired)) continue;
        if (handlerName === "king_gnome_banana_iq_compare" && roundIndex === 0) continue;

        const MULTI_EFFECT_HANDLERS = ["angling_scheming_str_win", "the_world_speed_win"];
        if (timing === "during_combat" && !MULTI_EFFECT_HANDLERS.includes(handlerName)) {
          const firedSet = playerSide === "player1" ? newP1FiredHandlers : newP2FiredHandlers;
          const handlerKey = `${handlerName}__${ce.source?.name ?? sourceName}`;
          if (firedSet.has(handlerKey)) continue;
        }
        if (handlerName === "accelerating_sorcery_count") {
          ctx.self.duringCombatActivations = duringPowerActivations;
        }
        {
          const effectConditions2 = (ce.effect as any).conditions || [];
          if (effectConditions2.some((c: any) => c.type === "probability")) continue;
        }
        const result = HandlerRegistry.executeCombat(handlerName, ctx);
        if (!result || result.skipDefault) continue;

        if (timing === "during_combat" && !MULTI_EFFECT_HANDLERS.includes(handlerName)) {
          const firedSet = playerSide === "player1" ? newP1FiredHandlers : newP2FiredHandlers;
          firedSet.add(`${handlerName}__${ce.source?.name ?? sourceName}`);
        }

        if ((result as any).blockOpponentPoint) {
          const oppSide = playerSide === "player1" ? "player2" : "player1";
          if (oppSide === "player1" && p1Points > 0) p1Points = 0;
          else if (oppSide === "player2" && p2Points > 0) p2Points = 0;
          if (result.description) events.push({ player: oppSide, source: sourceName, description: result.description, type: "info" });
          continue;
        }

        if (timing === "during_combat" && ce.source?.type === "power" && handlerName !== "accelerating_sorcery_count") {
          duringPowerActivations++;
        }

        const isSpellFluxTarget = hasSpellFluxPlayer && !spellFluxUsed && timing === "during_combat" && ce.source?.type === "power";
        const applyTimes = isSpellFluxTarget ? 2 : 1;
        if (isSpellFluxTarget) {
          spellFluxUsed = true;
          events.push({ player: playerSide, source: "Spell Flux", description: `[Spell Flux] ${sourceName} kích hoạt 2 lần!`, type: "info" });
        }

        for (let _applyIdx = 0; _applyIdx < applyTimes; _applyIdx++) {
          const isDouble = isSpellFluxTarget && _applyIdx === 1;
          if (result.description && !isDouble) {
            events.push({ player: playerSide, source: sourceName, description: result.description, type: "info" });
          }
          if (result.selfStatMods) {
            for (const mod of result.selfStatMods) {
              const csKey = normalizeStatKey(mod.stat);
              const isCarryOver = ["undying_rage_boost", "luminescence_debuff"].includes(handlerName);
              if (isCarryOver && roundIndex < 5) {
                const nextStatKey = STAT_ORDER[roundIndex + 1].key;
                carryOverToNext.push({ player: playerSide, source: sourceName, stat: nextStatKey, value: mod.value, description: `${sourceName}: +${mod.value} ${nextStatKey.toUpperCase()} round kế` });
                events.push({ player: playerSide, source: sourceName, description: `→ +${mod.value} ${nextStatKey.toUpperCase()} carry sang round kế`, type: "carry_over" });
              } else {
                const playerRace = (player.character?.race?.race || player.race || "").toLowerCase();
                if (csKey === "iq" && playerRace === "skeleton") {
                  events.push({ player: playerSide, source: sourceName, description: `[Skeleton] IQ không thể thay đổi — bỏ qua ${mod.value >= 0 ? "+" : ""}${mod.value} IQ`, type: "info" });
                } else {
                  applyStatDelta(playerSide === "player1" ? newP1Stats : newP2Stats, csKey, mod.value);
                  events.push({ player: playerSide, source: sourceName, description: `${mod.value >= 0 ? "+" : ""}${mod.value} ${csKey.toUpperCase()} (permanent)`, type: mod.value >= 0 ? "stat_boost" : "stat_debuff" });
                }
              }
            }
          }
          if (result.opponentStatMods) {
            for (const mod of result.opponentStatMods) {
              const csKey = normalizeStatKey(mod.stat);
              const oppSide = playerSide === "player1" ? "player2" : "player1";
              const isCarryOver = ["luminescence_debuff"].includes(handlerName);
              if (isCarryOver && roundIndex < 5) {
                const nextStatKey = STAT_ORDER[roundIndex + 1].key;
                carryOverToNext.push({ player: oppSide, source: sourceName, stat: nextStatKey, value: mod.value, description: `${sourceName}: ${mod.value} ${nextStatKey.toUpperCase()} round kế (debuff)` });
                events.push({ player: oppSide, source: sourceName, description: `→ ${mod.value} ${nextStatKey.toUpperCase()} debuff carry sang round kế`, type: "carry_over" });
              } else {
                const oppChar = oppSide === "player1" ? p1.character : p2.character;
                const oppRaceForLock = (oppChar?.race?.race || "").toLowerCase();
                if (csKey === "iq" && oppRaceForLock === "skeleton") {
                  events.push({ player: oppSide, source: sourceName, description: `[Skeleton] IQ không thể thay đổi — bỏ qua ${mod.value >= 0 ? "+" : ""}${mod.value} IQ`, type: "info" });
                } else {
                  applyStatDelta(oppSide === "player1" ? newP1Stats : newP2Stats, csKey, mod.value);
                  events.push({ player: oppSide, source: sourceName, description: `${mod.value >= 0 ? "+" : ""}${mod.value} ${csKey.toUpperCase()} (từ ${playerSide === "player1" ? p1.name : p2.name})`, type: mod.value >= 0 ? "stat_boost" : "stat_debuff" });
                }
              }
            }
          }
          if (result.selfPoints) {
            if (playerSide === "player1") p1Points += result.selfPoints;
            else p2Points += result.selfPoints;
            pointChanges.push({ player: playerSide, delta: result.selfPoints, reason: sourceName });
            events.push({ player: playerSide, source: sourceName, description: `${result.selfPoints >= 0 ? "+" : ""}${result.selfPoints} điểm`, type: "point_change" });
          }
          if (result.opponentPoints) {
            const oppSide = playerSide === "player1" ? "player2" : "player1";
            if (oppSide === "player1") p1Points += result.opponentPoints;
            else p2Points += result.opponentPoints;
            pointChanges.push({ player: oppSide, delta: result.opponentPoints, reason: `${sourceName} (từ đối thủ)` });
          }
        }

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

    // Needle
    const applyNeedle = (playerSide: "player1" | "player2") => {
      const player = playerSide === "player1" ? p1 : p2;
      if (!player.character) return;
      const hasNeedle = (player.character.weapons || []).some(
        (w: any) => !w.isLost && (typeof w === "string" ? w : (w?.name ?? "")).toLowerCase().startsWith("needle"),
      );
      if (!hasNeedle) return;
      if (winner !== playerSide) return;
      const oppBaseStats = playerSide === "player1" ? p2.baseStats : p1.baseStats;
      const STAT_SHORT: (keyof CharacterStats)[] = ["str", "spd", "dur", "iq", "biq", "ma"];
      let lowestShort: keyof CharacterStats = STAT_SHORT[0];
      let lowestVal = oppBaseStats[STAT_SHORT[0]] || 0;
      for (const s of STAT_SHORT) {
        if ((oppBaseStats[s] || 0) < lowestVal) { lowestVal = oppBaseStats[s] || 0; lowestShort = s; }
      }
      if (key !== lowestShort) return;
      const pts = 2;
      if (playerSide === "player1") p1Points += pts;
      else p2Points += pts;
      pointChanges.push({ player: playerSide, delta: pts, reason: `Needle: thắng round ${lowestShort.toUpperCase()} (stat thấp nhất đối thủ) → +${pts} điểm` });
      events.push({ player: playerSide, source: "Needle", description: `+${pts} điểm (Needle — thắng round ${lowestShort.toUpperCase()}, stat thấp nhất của đối thủ)`, type: "info" });
    };
    applyNeedle("player1");
    applyNeedle("player2");

    // One Trick Pony final clamp
    const p1HasOTPFinal = (p1.character?.quirks || []).filter((q: any) => !q.isLost).some((q: any) => q.name.toLowerCase() === "one trick pony");
    const p2HasOTPFinal = (p2.character?.quirks || []).filter((q: any) => !q.isLost).some((q: any) => q.name.toLowerCase() === "one trick pony");
    if (p1HasOTPFinal && winner === "player1") {
      const chosenStat = otpStats["player1"];
      if (chosenStat && chosenStat !== key) p1Points = 0;
    }
    if (p2HasOTPFinal && winner === "player2") {
      const chosenStat = otpStats["player2"];
      if (chosenStat && chosenStat !== key) p2Points = 0;
    }

    // Undying Rage
    if (p1.character?.runes?.runeword === "Undying Rage" && winner === "player2" && roundIndex < 5) {
      const nextStatKey = STAT_ORDER[roundIndex + 1].key;
      const alreadyAdded = carryOverToNext.some((co) => co.player === "player1" && co.source === "Undying Rage");
      if (!alreadyAdded) {
        carryOverToNext.push({ player: "player1", source: "Undying Rage", stat: nextStatKey, value: 3, description: `Undying Rage: thua round → +3 ${nextStatKey.toUpperCase()} round kế` });
        events.push({ player: "player1", source: "Undying Rage", description: `Thua → +3 ${nextStatKey.toUpperCase()} carry sang round kế`, type: "carry_over" });
      }
    }
    if (p2.character?.runes?.runeword === "Undying Rage" && winner === "player1" && roundIndex < 5) {
      const nextStatKey = STAT_ORDER[roundIndex + 1].key;
      const alreadyAdded = carryOverToNext.some((co) => co.player === "player2" && co.source === "Undying Rage");
      if (!alreadyAdded) {
        carryOverToNext.push({ player: "player2", source: "Undying Rage", stat: nextStatKey, value: 3, description: `Undying Rage: thua round → +3 ${nextStatKey.toUpperCase()} round kế` });
        events.push({ player: "player2", source: "Undying Rage", description: `Thua → +3 ${nextStatKey.toUpperCase()} carry sang round kế`, type: "carry_over" });
      }
    }

    const newP1Score = p1ResetScore ? 0 : state.p1Score + Math.max(0, p1Points);
    const newP2Score = p2ResetScore ? 0 : state.p2Score + Math.max(0, p2Points);
    if (p1ResetScore) pointChanges.push({ player: "player1", delta: -state.p1Score, reason: "Bloodthirsty: thua round → mất toàn bộ điểm" });
    if (p2ResetScore) pointChanges.push({ player: "player2", delta: -state.p2Score, reason: "Bloodthirsty: thua round → mất toàn bộ điểm" });

    const roundResult = { stat: key, statLabel: label, player1Value: p1Val, player2Value: p2Val, winner };
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

  // ── checkAndSetRoundtableHold (stub — no roundtable in WheelOfTruth) ──────
  const checkAndSetRoundtableHold = (_result: CombatResult): boolean => false;

  // ── Load all players ──────────────────────────────────────────────────────
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        ensureEffectsInitialized();
        const playerList: PvPPlayerData[] = [];
        const index = await getPlayerIndex();
        const nos = Object.keys(index)
          .filter((k) => /^No\d+$/.test(k))
          .map((k) => parseInt(k.replace(/\D/g, "")));
        const texts = await fetchPlayerTexts(nos);
        for (const [no, content] of texts) {
          const player = parsePlayerFromText(content, no);
          if (player) playerList.push(player);
        }
        playerList.sort((a, b) => a.no - b.no);
        const allChars = playerList.map((p) => p.character).filter((c): c is Character => !!c);
        const resolved = playerList.map((p) => reResolveWithAllChars(p, allChars));
        setAllPlayers(resolved);
      } catch (error) {
        console.error("Error loading players:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPlayers();
  }, []);

  // ── Filtered player lists ─────────────────────────────────────────────────
  const filteredPlayers1 = useMemo(() => {
    if (!searchTerm1) return allPlayers.slice(0, 20);
    const term = searchTerm1.toLowerCase();
    return allPlayers.filter(
      (p) => p.name.toLowerCase().includes(term) || p.username.toLowerCase().includes(term) || p.no.toString().includes(term),
    ).slice(0, 20);
  }, [allPlayers, searchTerm1]);

  const filteredPlayers2 = useMemo(() => {
    if (!searchTerm2) return allPlayers.slice(0, 20);
    const term = searchTerm2.toLowerCase();
    return allPlayers.filter(
      (p) => p.name.toLowerCase().includes(term) || p.username.toLowerCase().includes(term) || p.no.toString().includes(term),
    ).slice(0, 20);
  }, [allPlayers, searchTerm2]);

  // ── Reset combat ──────────────────────────────────────────────────────────
  const resetCombat = () => {
    setCombatResult(null);
    setCurrentRound(-1);
    setIsAnimating(false);
    setIsPendingRoundtable(false);
    setPendingLoser(null);
    setSelectedTarnished(null);
    setSubCombatResult(null);
    setRoundSpinResults({});
    setOneTrickPonyStat({});
    setHuntersMarkStat({});
    setHuntersMarkStat2({});
    setGuidanceStats({});
    setRaumanianSuccess({});
    setGoldenCoinPoints({});
    setCursedCoinTarget({});
    setScryingSuccess({});
    setEncroachingShadowSuccess({});
    setGoldShipResult({});
    setRhittaResult({});
    setMadScientistResult({});
    setSummoningScrollResult({});
    setTricksterResult({});
    setBlackMagicStat({});
    setDothrakiSpinResult({});
    setAfterCombatEntries([]);
    setAfterCombatSpinResults({});
    setStepState(null);
    setStepRoundIndex(-1);
    setCombatConfirmed(false);
    setZoltraakBiq2Pending(false);
    setDisabledItems(new Set());
    pendingAfterCombatBuildRef.current = null;
    pendingCrueltyAfterCombatRef.current = null;
    pendingFinalizeStateRef.current = null;
    preBiqFiredHandlersRef.current = null;
    setAudioResetKey((k) => k + 1);
    setCenterTab("pre");
  };

  // ── useStartCombat ────────────────────────────────────────────────────────
  const { startCombat } = useStartCombat({
    player1, player2, disabledItems, allPlayers, isTournamentMode: false,
    summoningScrollResult, goldenCoinPoints, oneTrickPonyStat, huntersMarkStat,
    tricksterResult, raumanianSuccess, scryingSuccess, encroachingShadowSuccess,
    goldShipResult, madScientistResult, dothrakiSpinResult, cursedCoinTarget,
    guidanceStats, blackMagicStat, rhittaResult,
    setAfterCombatEntries, setCombatConfirmed, setCombatResult, setCurrentRound,
    setDisabledItems, setIsAnimating, setIsPendingRoundtable, setPendingLoser,
    setRoundSpinResults, setSelectedTarnished, setStepRoundIndex, setStepState,
    setSubCombatResult, setSummoningScrollResult, setZoltraakBiq2Pending,
    getPerRoundEffects, EffectResolver, EffectRegistry,
    pendingAfterCombatBuildRef, pendingCrueltyAfterCombatRef, pendingFinalizeStateRef, preBiqFiredHandlersRef,
  });

  // ── Wheel forced winner state ─────────────────────────────────────────────
  const [wheelForcedWinner, setWheelForcedWinner] = useState<"player1" | "player2" | null>(null);

  // ── useResolveNextRound ───────────────────────────────────────────────────
  const { resolveNextRound } = useResolveNextRound({
    player1, player2, stepState, stepRoundIndex, disabledItems, allPlayers,
    isTournamentMode: false, roundtableSubMode: false, zoltraakBiq2Pending,
    oneTrickPonyStat, huntersMarkStat, tricksterResult,
    roundSpinResults, afterCombatSpinResults,
    setAfterCombatEntries, setAfterCombatSpinResults, setCombatResult,
    setCurrentRound, setStepRoundIndex, setStepState, setZoltraakBiq2Pending,
    pendingAfterCombatBuildRef, pendingCrueltyAfterCombatRef, pendingFinalizeStateRef, preBiqFiredHandlersRef,
    spawnStatBubbles, getPerRoundEffects, computeRoundPoints,
    EffectRegistry, EffectResolver,
    computeRoundStep, checkAndSetRoundtableHold,
    wheelForcedWinner,
  });
  resolveNextRoundRef.current = resolveNextRound;

  // Auto-call resolveNextRound when wheel spin completes
  useEffect(() => {
    if (!wheelForcedWinner) return;
    resolveNextRoundRef.current?.();
    setWheelForcedWinner(null);
  }, [wheelForcedWinner]);

  // ── useWheelHandlers ──────────────────────────────────────────────────────
  const { handleWheelResolved } = useWheelHandlers({
    player1, player2, disabledItems,
    setPlayer1, setPlayer2, setDisabledItems,
    setOneTrickPonyStat, setGuidanceStats, setPreCombatModal,
    setCursedCoinTarget, setHuntersMarkStat, setGoldenCoinPoints,
    setRaumanianSuccess, setScryingSuccess, setEncroachingShadowSuccess,
    setGoldShipResult, setMadScientistResult, setDothrakiSpinResult,
    setBlackMagicStat, setSummoningScrollResult, setTricksterResult,
    setRhittaResult, setCreatorsCatModal, spawnStatBubbles,
  });

  // ── usePvPScores ──────────────────────────────────────────────────────────
  const battleDone = !!combatResult;
  const {
    stepInProgress,
    pendingSpinsForLastRound: _pendingSpinsForLastRound,
    effectiveScores,
    liveScore,
    pendingSpins,
    effectiveWinner,
  } = usePvPScores({
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
    roundtableWinnerOverride: null,
    computeRoundPoints,
  });

  const mainWinner = combatConfirmed && effectiveWinner
    ? effectiveWinner === "player1" ? player1 : player2
    : null;

  const lastRoundLog =
    stepState && stepState.roundLogs.length > 0
      ? stepState.roundLogs[stepState.roundLogs.length - 1]
      : null;

  // ── dothrakiPreviewStats ──────────────────────────────────────────────────
  const dothrakiPreviewStats = useMemo(() => {
    if (stepState) return null;
    const p1Rule = (dothrakiSpinResult["player1"] ?? null) as DothrakiRule;
    const p2Rule = (dothrakiSpinResult["player2"] ?? null) as DothrakiRule;
    if (!p1Rule && !p2Rule) return null;
    if (!player1 || !player2) return null;
    const s1: CharacterStats = player1.character
      ? calcStatsWithDisabled(player1.character, player1.no, disabledItems)
      : { ...player1.stats };
    const s2: CharacterStats = player2.character
      ? calcStatsWithDisabled(player2.character, player2.no, disabledItems)
      : { ...player2.stats };
    return { s1, s2 };
  }, [player1, player2, dothrakiSpinResult, disabledItems, stepState]);

  // ── p1DisplayStats / p2DisplayStats ──────────────────────────────────────
  const p1DisplayStats = useMemo(() => {
    if (stepState) return stepState.p1Stats;
    if (dothrakiPreviewStats) return dothrakiPreviewStats.s1;
    return player1?.character
      ? calcStatsWithDisabled(player1.character, player1.no, disabledItems)
      : (player1?.stats ?? null);
  }, [player1, disabledItems, stepState, dothrakiPreviewStats]);

  const p2DisplayStats = useMemo(() => {
    if (stepState) return stepState.p2Stats;
    if (dothrakiPreviewStats) return dothrakiPreviewStats.s2;
    return player2?.character
      ? calcStatsWithDisabled(player2.character, player2.no, disabledItems)
      : (player2?.stats ?? null);
  }, [player2, disabledItems, stepState, dothrakiPreviewStats]);

  // ── Dev weight overrides ──────────────────────────────────────────────────
  const [devWeightOverrides, setDevWeightOverrides] = useState<Record<string, Record<number, number>>>({});
  const [devPanelPos, setDevPanelPos] = useState({ x: 20, y: 200 });

  // ── applyDevWeights ───────────────────────────────────────────────────────
  const applyDevWeights = (effectName: string, items: WheelSpinItem[]): WheelSpinItem[] => {
    if (!devMode) return items;
    const overrides = devWeightOverrides[effectName];
    if (!overrides) return items;
    return items.map((item, i) =>
      overrides[i] !== undefined ? { ...item, weight: overrides[i] } : item,
    );
  };

  // ── 3D effect triggers ────────────────────────────────────────────────────
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

  useEffect(() => {
    if (lastRoundLog && stepState && lastRoundLog.roundIndex >= 0) {
      setViewLogIndex(stepState.roundLogs.length - 1);
    }
  }, [lastRoundLog]);

  // Auto-switch to "wheel" tab when combat starts
  useEffect(() => {
    if (stepState) setCenterTab("wheel");
  }, [!!stepState]);

  // Auto-switch to "after" tab when combat ends
  useEffect(() => {
    if (battleDone) setCenterTab("after");
  }, [battleDone]);

  // ── Wheel weights for BattleWheelSpinner (WoT-specific — giữ lại) ──────────
  // const currentStatInfo = stepInProgress && stepRoundIndex < 6 ? STAT_ORDER[stepRoundIndex] : null;
  // const p1Val = currentStatInfo && stepState ? (stepState.p1Stats[currentStatInfo.key] ?? 0) : 0;
  // const p2Val = currentStatInfo && stepState ? (stepState.p2Stats[currentStatInfo.key] ?? 0) : 0;
  // const p1W = p1Val > p2Val ? p1Val * 2 : p1Val;
  // const p2W = p2Val > p1Val ? p2Val * 2 : p2Val;

  // ── Swap players ──────────────────────────────────────────────────────────
  const swapPlayers = () => {
    setPlayer1(player2);
    setPlayer2(player1);
    setSearchTerm1(searchTerm2);
    setSearchTerm2(searchTerm1);
    resetCombat();
  };

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) return <ArenaLoadingScreen />;

  // ─────────────────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────────────────
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
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
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
          <div className="flex-1 px-5 py-3 rounded-2xl border border-gray-600/50 bg-gradient-to-r from-yellow-900/20 via-orange-900/20 to-red-900/20">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400">
              Wheel of Truth
            </h1>
          </div>
        </div>

        {devMode && (
          <div className="mb-2 flex justify-center">
            <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded text-yellow-400 text-xs font-mono">
              DEV MODE
            </span>
          </div>
        )}

        {/* 3-column layout: left sidebar | center | right sidebar */}
        <div className="max-w-[1400px] mx-auto flex gap-3 px-2 items-start">
          {/* LEFT SIDEBAR: Player 1 */}
          <PlayerSidebar
            player={player1}
            otherPlayer={player2}
            accent="blue"
            audioResetKey={audioResetKey}
            combatResult={combatResult}
            masterVolume={masterVolume}
            bgmVolume={bgmVolume}
            isTournamentMode={false}
            onClear={() => { setPlayer1(null); setSearchTerm1(""); resetCombat(); }}
            searchTerm={searchTerm1}
            setSearchTerm={setSearchTerm1}
            focused={focus1}
            setFocused={setFocus1}
            filteredPlayers={filteredPlayers1}
            onSelectPlayer={(p) => { setPlayer1(p); resetCombat(); }}
            tab={leftTab}
            setTab={setLeftTab}
            disabledItems={disabledItems}
            toggleItem={toggleItem}
            placeholder="Tìm Player 1..."
            selectTabOnPick="effects"
          />

          {/* CENTER: Battle area */}
          <div className="flex-1 min-w-0">
            {/* JRPG Battle Scene */}
            <div
              className="relative rounded-2xl border border-gray-600/40 mb-3 overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #0a0f1e 0%, #0d1525 50%, #0a0e1a 100%)",
                boxShadow: "0 0 40px rgba(59,130,246,0.06), 0 0 40px rgba(239,68,68,0.06) inset",
              }}
            >
              {/* Scanline overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)",
                  zIndex: 0,
                }}
              />

              {/* Round indicator banner */}
              {stepState && stepRoundIndex >= 0 && (
                <div className="relative z-10 flex justify-center pt-2 pb-1">
                  <div className="px-4 py-0.5 rounded-full bg-yellow-900/50 border border-yellow-500/30 text-yellow-300 text-[11px] font-bold tracking-widest uppercase">
                    Round {stepRoundIndex + 1} / 6
                  </div>
                </div>
              )}

              <div className="relative z-10 p-3">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
                  {/* P1 card */}
                  {player1 ? (
                    <PlayerCard3DFrame
                      side="left"
                      isWinner={combatConfirmed && !isPendingRoundtable && effectiveWinner === "player1"}
                      boostTrigger={p1Boost}
                      debuffTrigger={p1Debuff}
                      key={`p1-frame-${p1EffectKey}`}
                    >
                      <SCPlayerCard
                        player={player1}
                        side="left"
                        displayStats={p1DisplayStats}
                        isWinner={combatConfirmed && !isPendingRoundtable && effectiveWinner === "player1"}
                        showWinner={combatConfirmed && !isPendingRoundtable}
                      />
                    </PlayerCard3DFrame>
                  ) : (
                    <div
                      className="rounded-xl border-2 border-dashed border-blue-600/20 flex items-center justify-center min-h-[140px]"
                      style={{ background: "rgba(15,23,42,0.6)" }}
                    >
                      <span className="text-blue-900/60 text-sm font-bold">PLAYER 1</span>
                    </div>
                  )}

                  {/* VS / Score Center */}
                  <ScoreDisplay3D
                    winner={combatConfirmed && !isPendingRoundtable ? effectiveWinner : null}
                    p1Score={liveScore.s1}
                    p2Score={liveScore.s2}
                  >
                    <div className="flex flex-col items-center justify-center min-w-[90px]">
                      <div className="text-center mb-1">
                        <div className="font-black tracking-tight leading-none" style={{ fontSize: "2.4rem", textShadow: "0 0 20px currentColor" }}>
                          <span className="text-blue-400" style={{ textShadow: "0 0 16px #3b82f6" }}>
                            {battleDone ? effectiveScores.s1 : liveScore.s1}
                          </span>
                          <span className="text-gray-600 mx-1 text-2xl">:</span>
                          <span className="text-red-400" style={{ textShadow: "0 0 16px #ef4444" }}>
                            {battleDone ? effectiveScores.s2 : liveScore.s2}
                          </span>
                        </div>
                      </div>
                      {battleDone ? (
                        <>
                          {pendingSpins && (
                            <div className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse font-bold">
                              Còn spin
                            </div>
                          )}
                          {!pendingSpins && combatResult!.tieBreaker && effectiveScores.s1 === effectiveScores.s2 && (
                            <div className="text-[9px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">
                              RACE TIER
                            </div>
                          )}
                          {mainWinner && (
                            <div
                              className={`text-[11px] font-black mt-1 px-3 py-1 rounded-lg border tracking-wide ${
                                effectiveWinner === "player1"
                                  ? "text-blue-300 bg-blue-500/10 border-blue-500/30"
                                  : "text-red-300 bg-red-500/10 border-red-500/30"
                              }`}
                              style={{ textShadow: `0 0 10px ${effectiveWinner === "player1" ? "#3b82f6" : "#ef4444"}` }}
                            >
                              {mainWinner.name}<br />
                              <span className="text-yellow-400 text-[10px]">WINS ★</span>
                            </div>
                          )}
                        </>
                      ) : !stepState ? (
                        <div className="text-[10px] text-gray-600 font-bold tracking-widest mt-1">VS</div>
                      ) : null}
                    </div>
                  </ScoreDisplay3D>

                  {/* P2 card */}
                  {player2 ? (
                    <PlayerCard3DFrame
                      side="right"
                      isWinner={combatConfirmed && !isPendingRoundtable && effectiveWinner === "player2"}
                      boostTrigger={p2Boost}
                      debuffTrigger={p2Debuff}
                      key={`p2-frame-${p2EffectKey}`}
                    >
                      <SCPlayerCard
                        player={player2}
                        side="right"
                        displayStats={p2DisplayStats}
                        isWinner={combatConfirmed && !isPendingRoundtable && effectiveWinner === "player2"}
                        showWinner={combatConfirmed && !isPendingRoundtable}
                      />
                    </PlayerCard3DFrame>
                  ) : (
                    <div
                      className="rounded-xl border-2 border-dashed border-red-600/20 flex items-center justify-center min-h-[140px]"
                      style={{ background: "rgba(15,23,42,0.6)" }}
                    >
                      <span className="text-red-900/60 text-sm font-bold">PLAYER 2</span>
                    </div>
                  )}
                </div>

                {/* Swap + BGM + Start row */}
                <div className="mt-2 flex justify-center items-center gap-2">
                  {!stepState && !battleDone && player1 && player2 && (
                    <button
                      onClick={swapPlayers}
                      className="px-3 py-1 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800/60 transition-all text-xs border border-gray-700/40 hover:border-purple-500/40"
                    >
                      ⇄ Swap
                    </button>
                  )}
                  {player1 && player2 &&
                    detectCombatAudioTracks(player1.character, undefined, player1.no).length === 0 &&
                    detectCombatAudioTracks(player2.character, undefined, player2.no).length === 0 && (
                      <div className="relative z-10">
                        <FallbackBgmController
                          key={audioResetKey}
                          stopped={!!combatResult}
                          volumeScale={masterVolume * bgmVolume}
                        />
                      </div>
                    )}
                </div>
              </div>

              {/* FloatingStatBubblesOverlay */}
              <FloatingStatBubblesOverlay p1Bubbles={p1Bubbles} p2Bubbles={p2Bubbles} />
            </div>

            {/* ── 3-Tab Center Layout ─────────────────────────────────────── */}
            {player1 && player2 && (
              <div className="rounded-2xl border border-gray-700/40 overflow-hidden mb-3" style={{ background: "linear-gradient(160deg, #0c1220 0%, #0f172a 100%)" }}>
                {/* Tab bar */}
                <div className="flex border-b border-gray-700/50">
                  <button
                    onClick={() => setCenterTab("pre")}
                    className={`flex-1 py-2 text-xs font-bold tracking-wide transition-colors relative ${centerTab === "pre" ? "bg-yellow-900/30 text-yellow-300 border-b-2 border-yellow-500" : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/40"}`}
                  >
                    Trước Combat
                    {pendingPreCombatCount > 0 && centerTab !== "pre" && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    )}
                  </button>
                  <button
                    onClick={() => setCenterTab("wheel")}
                    className={`flex-1 py-2 text-xs font-bold tracking-wide transition-colors ${centerTab === "wheel" ? "bg-purple-900/30 text-purple-300 border-b-2 border-purple-500" : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/40"}`}
                  >
                    Wheel of Truth
                  </button>
                  <button
                    onClick={() => setCenterTab("after")}
                    className={`flex-1 py-2 text-xs font-bold tracking-wide transition-colors relative ${centerTab === "after" ? "bg-green-900/30 text-green-300 border-b-2 border-green-500" : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/40"}`}
                  >
                    Sau Combat
                    {battleDone && !combatConfirmed && centerTab !== "after" && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    )}
                  </button>
                </div>

                {/* Tab 1: Trước Combat */}
                {centerTab === "pre" && (
                  <div className="p-3 space-y-3">
                    {/* Stat comparison bars */}
                    <div className="space-y-1">
                      <div className="grid grid-cols-[1fr_56px_1fr] gap-1 mb-2 items-center">
                        <div className="text-right text-[11px] font-black text-blue-400 tracking-wide truncate pr-1">{player1.name}</div>
                        <div className="text-center" />
                        <div className="text-left text-[11px] font-black text-red-400 tracking-wide truncate pl-1">{player2.name}</div>
                      </div>
                      {STAT_ORDER.map(({ key, label }) => {
                        const v1 = (p1DisplayStats ?? player1.stats)[key];
                        const v2 = (p2DisplayStats ?? player2.stats)[key];
                        const p1Higher = v1 > v2;
                        const p2Higher = v2 > v1;
                        const maxVal = Math.max(v1, v2, 1);
                        return (
                          <div key={key} className="grid grid-cols-[1fr_56px_1fr] gap-1 items-center">
                            <div className="flex items-center gap-1.5 justify-end">
                              <span className={`text-sm font-black w-6 text-right ${p1Higher ? "text-blue-300" : "text-gray-500"}`}>{v1}</span>
                              <div className="flex-1 max-w-[80px] bg-gray-800/60 rounded-full h-2 overflow-hidden flex justify-end">
                                <div className={`h-full rounded-full transition-all duration-700 ${p1Higher ? "bg-gradient-to-l from-blue-500 to-blue-400" : "bg-gray-600/60"}`} style={{ width: `${(v1 / maxVal) * 100}%` }} />
                              </div>
                            </div>
                            <div className={`text-center text-[10px] font-black tracking-wider py-0.5 rounded ${p1Higher === p2Higher ? "text-gray-500" : p1Higher ? "text-blue-500/60" : "text-red-500/60"}`}>{label}</div>
                            <div className="flex items-center gap-1.5 justify-start">
                              <div className="flex-1 max-w-[80px] bg-gray-800/60 rounded-full h-2 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 ${p2Higher ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gray-600/60"}`} style={{ width: `${(v2 / maxVal) * 100}%` }} />
                              </div>
                              <span className={`text-sm font-black w-6 ${p2Higher ? "text-red-300" : "text-gray-500"}`}>{v2}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <CombatEffectsPanel
                      player1={{ name: player1.name, character: player1.character }}
                      player2={{ name: player2.name, character: player2.character }}
                      player1ComputedStats={p1DisplayStats ?? undefined}
                      player2ComputedStats={p2DisplayStats ?? undefined}
                      resetKey="pre-main"
                      preCombatOnly
                      onWheelResolved={handleWheelResolved}
                      onPendingPreCombatChange={setPendingPreCombatCount}
                    />
                    {!stepState && !battleDone && (
                      <div className="flex justify-center pt-1">
                        <button
                          onClick={() => { startCombat(); }}
                          disabled={pendingPreCombatCount > 0}
                          className={`px-8 py-3 rounded-xl font-bold text-lg transition-all transform shadow-lg ${
                            pendingPreCombatCount > 0
                              ? "bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/40"
                              : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white hover:scale-105"
                          }`}
                        >
                          {pendingPreCombatCount > 0 ? `Còn ${pendingPreCombatCount} hiệu ứng chờ...` : "Bắt đầu"}
                        </button>
                      </div>
                    )}
                    {(stepState || battleDone) && (
                      <div className="text-center text-xs text-gray-600 py-2 italic">Combat đang diễn ra — xem tab Wheel of Truth</div>
                    )}
                  </div>
                )}

                {/* Tab 2: Wheel of Truth (rounds) */}
                {centerTab === "wheel" && (
                  <div className="p-3">
                    {combatResult || stepState ? (
                      <RoundResultsPanel
                        rounds={combatResult ? combatResult.rounds : stepState!.resolvedRounds}
                        revealedUpTo={
                          combatResult
                            ? null
                            : stepState!.resolvedRounds.length > 0
                              ? stepState!.resolvedRounds.length - 1
                              : -1
                        }
                        p1char={player1.character}
                        p2char={player2.character}
                        extraBiqRound={(() => {
                          const rr = combatResult ? combatResult.rounds : (stepState?.resolvedRounds ?? []);
                          return (rr.length >= 5 && rr[4]?.stat === "biq" && rr[5]?.stat === "biq") || rr.length > STAT_ORDER.length || zoltraakBiq2Pending;
                        })()}
                        player1={player1}
                        player2={player2}
                        disabledItems={disabledItems}
                        roundSpinResults={roundSpinResults}
                        getPerRoundEffects={getPerRoundEffects}
                        computeRoundPoints={computeRoundPoints}
                        applyDevWeights={applyDevWeights}
                        setRoundSpinModal={setRoundSpinModal}
                      />
                    ) : (
                      <div className="text-center text-xs text-gray-600 py-6 italic">Chưa bắt đầu combat — chuyển sang tab Trước Combat</div>
                    )}
                  </div>
                )}

                {/* Tab 3: Sau Combat */}
                {centerTab === "after" && (
                  <div className="p-3 space-y-3">
                    {/* After-combat CombatEffectsPanel */}
                    <CombatEffectsPanel
                      player1={{ name: player1.name, character: player1.character }}
                      player2={{ name: player2.name, character: player2.character }}
                      player1ComputedStats={p1DisplayStats ?? undefined}
                      player2ComputedStats={p2DisplayStats ?? undefined}
                      resetKey="after-main"
                      afterCombatOnly
                      combatResult={
                        battleDone && effectiveWinner
                          ? {
                              winner: effectiveWinner,
                              player1Score: effectiveScores.s1,
                              player2Score: effectiveScores.s2,
                              rounds: combatResult!.rounds.map((r) => ({ stat: r.stat, winner: r.winner })),
                            }
                          : undefined
                      }
                      onWheelResolved={handleWheelResolved}
                    />

                    {/* After-combat quirk effects (PvP Reward etc.) */}
                    <AfterCombatPanel
                      battleDone={battleDone}
                      afterCombatEntries={afterCombatEntries}
                      player1={player1}
                      player2={player2}
                      afterCombatSpinResults={afterCombatSpinResults}
                      setAfterCombatSpinResults={setAfterCombatSpinResults}
                      setPreCombatModal={setPreCombatModal}
                      spawnStatBubbles={spawnStatBubbles}
                      setCreatorsCatModal={setCreatorsCatModal}
                    />

                    {/* Roundtable Hold banner */}
                    {isPendingRoundtable && (
                      <div className="rounded-xl border border-orange-500/40 bg-orange-900/20 px-4 py-3 text-center text-sm text-orange-300 font-bold animate-pulse">
                        ⚔ Roundtable Hold — Trận phụ đang chờ xử lý
                      </div>
                    )}

                    {/* Kết thúc / Fight Again buttons */}
                    {battleDone && !combatConfirmed && (
                      <div className="flex justify-center pt-1">
                        <button
                          onClick={() => setCombatConfirmed(true)}
                          disabled={pendingSpins}
                          className={`px-6 py-2.5 font-bold rounded-xl text-sm transition-all shadow-lg ${
                            pendingSpins
                              ? "bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/40"
                              : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-green-500/20"
                          }`}
                        >
                          {pendingSpins ? "Còn hiệu ứng chờ quay..." : "Kết thúc"}
                        </button>
                      </div>
                    )}
                    {combatConfirmed && (
                      <div className="flex justify-center pt-1">
                        <button
                          onClick={resetCombat}
                          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-all"
                        >
                          Fight Again
                        </button>
                      </div>
                    )}
                    {!battleDone && (
                      <div className="text-center text-xs text-gray-600 py-4 italic">Chưa kết thúc combat</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Persistent Round Log Bar */}
            {player1 && player2 && (() => {
              const logs = stepState?.roundLogs ?? [];
              if (logs.length === 0) return null;
              const viewIdx = Math.min(viewLogIndex ?? logs.length - 1, logs.length - 1);
              const log = logs[viewIdx];
              const borderColor = log.winner === "player1" ? "rgba(59,130,246,0.3)" : log.winner === "player2" ? "rgba(239,68,68,0.3)" : "rgba(234,179,8,0.3)";
              return (
                <div className="rounded-xl border overflow-hidden text-xs mb-3" style={{ background: "rgba(0,0,0,0.4)", borderColor }}>
                  <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-800/60">
                    <button onClick={() => setViewLogIndex(0)} disabled={viewIdx === 0} className="px-1 py-0.5 rounded text-[10px] text-gray-500 hover:text-white disabled:opacity-20">«</button>
                    <button onClick={() => setViewLogIndex(Math.max(0, viewIdx - 1))} disabled={viewIdx === 0} className="px-1 py-0.5 rounded text-[10px] text-gray-500 hover:text-white disabled:opacity-20">‹</button>
                    <div className="flex gap-0.5 flex-1 justify-center">
                      {logs.map((lg, i) => (
                        <button
                          key={i}
                          onClick={() => setViewLogIndex(i)}
                          className={`w-5 h-5 rounded text-[9px] font-black transition-colors ${i === viewIdx ? (lg.roundIndex === -1 ? "bg-yellow-700/70 text-white" : "bg-purple-600/70 text-white") : "bg-gray-800/60 text-gray-500 hover:bg-gray-700/60 hover:text-gray-300"}`}
                        >
                          {lg.roundIndex === -1 ? "P" : i + (logs[0]?.roundIndex === -1 ? 0 : 1)}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setViewLogIndex(Math.min(logs.length - 1, viewIdx + 1))} disabled={viewIdx === logs.length - 1} className="px-1 py-0.5 rounded text-[10px] text-gray-500 hover:text-white disabled:opacity-20">›</button>
                    <button onClick={() => setViewLogIndex(logs.length - 1)} disabled={viewIdx === logs.length - 1} className="px-1 py-0.5 rounded text-[10px] text-gray-500 hover:text-white disabled:opacity-20">»</button>
                  </div>
                  <div className="px-2.5 py-1.5 space-y-0.5" style={{ borderLeft: `3px solid ${borderColor}` }}>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-black tracking-widest" style={{ background: log.roundIndex === -1 ? "rgba(234,179,8,0.2)" : "rgba(168,85,247,0.2)", color: log.roundIndex === -1 ? "#fbbf24" : "#c084fc", border: `1px solid ${log.roundIndex === -1 ? "rgba(234,179,8,0.3)" : "rgba(168,85,247,0.3)"}` }}>
                        {log.roundIndex === -1 ? "PRE" : `R${log.roundIndex + 1}`}
                      </span>
                      <span className="text-gray-400 text-[11px] font-bold">{log.statLabel}</span>
                      {log.roundIndex !== -1 && (
                        <>
                          <span className="text-blue-300 font-black">{log.p1ValueUsed}</span>
                          <span className="text-gray-600 text-[9px]">vs</span>
                          <span className="text-red-300 font-black">{log.p2ValueUsed}</span>
                        </>
                      )}
                      <span className="ml-auto text-[11px] font-black">
                        {log.roundIndex === -1 ? (
                          <span className="text-yellow-400/70 text-[10px] font-normal italic">Hiệu ứng trước combat</span>
                        ) : log.winner === "tie" ? (
                          <span className="text-yellow-400">═ HÒA</span>
                        ) : log.winner === "player1" ? (
                          <span className="text-blue-300">▶ {player1.name}</span>
                        ) : (
                          <span className="text-red-300">◀ {player2.name}</span>
                        )}
                      </span>
                    </div>
                    {log.events.map((ev, i) => (
                      <div key={i} className={`pl-2 border-l-2 text-[11px] ${ev.type === "stat_boost" ? "border-green-500/50 text-green-400" : ev.type === "stat_debuff" ? "border-red-500/50 text-red-400" : ev.type === "carry_over" ? "border-amber-500/50 text-amber-400" : ev.type === "point_change" ? "border-blue-500/50 text-blue-300" : "border-gray-600/50 text-gray-400"}`}>
                        <span className="text-gray-600">[{ev.player === "player1" ? player1.name : player2.name}]</span>{" "}
                        <span className="text-gray-500">{ev.source}:</span>{" "}
                        {ev.description}
                      </div>
                    ))}
                    {(log.carryOverToNext?.length ?? 0) > 0 && (
                      <div className="pl-2 text-amber-400/70 italic text-[11px]">
                        → Carry: {log.carryOverToNext.map((co) => `${co.source} ${co.value > 0 ? "+" : ""}${co.value} ${co.stat.toUpperCase()}`).join(", ")}
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

            {/* Rules Info */}
            <div className="mt-2 bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">
                <strong className="text-yellow-400">Wheel of Truth:</strong>{" "}
                Quay vòng quay cho từng stat round. Stat cao hơn = ô lớn hơn = xác suất cao hơn. Thắng nhiều round nhất. Hòa: Race Tier thấp hơn thắng.
              </p>
            </div>
          </div>

          {/* RIGHT SIDEBAR: Player 2 */}
          <PlayerSidebar
            player={player2}
            otherPlayer={player1}
            accent="red"
            audioResetKey={audioResetKey}
            combatResult={combatResult}
            masterVolume={masterVolume}
            bgmVolume={bgmVolume}
            isTournamentMode={false}
            onClear={() => { setPlayer2(null); setSearchTerm2(""); resetCombat(); }}
            searchTerm={searchTerm2}
            setSearchTerm={setSearchTerm2}
            focused={focus2}
            setFocused={setFocus2}
            filteredPlayers={filteredPlayers2}
            onSelectPlayer={(p) => { setPlayer2(p); resetCombat(); }}
            tab={rightTab}
            setTab={setRightTab}
            disabledItems={disabledItems}
            toggleItem={toggleItem}
            placeholder="Tìm Player 2..."
            selectTabOnPick="effects"
          />
        </div>
      </div>

      {/* Pre-combat wheel modal */}
      <ProbabilityWheelModal
        isOpen={preCombatModal.isOpen}
        onClose={() => setPreCombatModal((prev) => ({ ...prev, isOpen: false }))}
        title={preCombatModal.title}
        description={preCombatModal.description}
        items={preCombatModal.items}
        onResult={(item: WheelSpinItem) => {
          if (preCombatModal.onResult) {
            preCombatModal.onResult({
              label: item.label,
              isSuccess: !!item.isSuccess,
              meta: item.meta as Record<string, unknown> | undefined,
            });
          }
          setPreCombatModal((prev) => ({ ...prev, isOpen: false }));
        }}
      />

      {/* Dev Mode: Panel */}
      {devMode && (
        <DevWheelPanel
          pos={devPanelPos}
          onPosChange={setDevPanelPos}
          overrides={devWeightOverrides}
          onOverrideChange={(effect, idx, val) =>
            setDevWeightOverrides((prev) => ({
              ...prev,
              [effect]: { ...(prev[effect] || {}), [idx]: val },
            }))
          }
          onReset={() => setDevWeightOverrides({})}
          defaultItems={{
            "Critical Strike": CRIT_ITEMS,
            Evasion: EVASION_ITEMS,
            Gambler: GAMBLER_ITEMS,
            Cruelty: CRUELTY_ITEMS,
            Blind: BLIND_ITEMS,
            Mute: MUTE_ITEMS,
            Misericorde: MISERICORDE_ITEMS,
          }}
          allPlayers={allPlayers}
          onLoadMatchup={(p1, p2) => {
            setPlayer1(p1);
            setPlayer2(p2);
            resetCombat();
          }}
        />
      )}

      {/* Creator's Cat modal */}
      <CreatorsCatModal
        creatorsCatModal={creatorsCatModal}
        setCreatorsCatModal={setCreatorsCatModal}
        player1={player1}
        player2={player2}
        setPlayer1={setPlayer1}
        setPlayer2={setPlayer2}
        setSummoningScrollResult={setSummoningScrollResult}
        setPreCombatModal={setPreCombatModal}
        spawnStatBubbles={spawnStatBubbles}
      />
    </div>
  );
};
