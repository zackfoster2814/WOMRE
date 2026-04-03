import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Character, CharacterStats } from "../types/character";
import { EffectResolver } from "../effects/resolver";
import { initializeEffectData } from "../effects/data";
import wheelBgImage from "../assets/img/wheel-bg.png";
import { fetchPlayerTexts, getPlayerIndex } from "../utils/googleDrive";
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
  RoundSpinButton,
  calcRoundSpinEffects,
} from "../utils/roundSpinButtons";
import {
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
import { BattleWheelSpinner } from "../components/combat/BattleWheelSpinner";
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
import { computeRoundStep as computeRoundStepEngine } from "../engine/combatEngine";
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
  RoundLog,
  DothrakiRule,
  StepCombatState,
  StatBubble,
  BattleModeProps,
} from "../types/battleZone";
import { EffectRegistry } from "../effects";

// suppress unused import warnings for wheel configs used indirectly
void CRIT_ITEMS;
void EVASION_ITEMS;
void MISERICORDE_ITEMS;
void GAMBLER_ITEMS;
void CRUELTY_ITEMS;
void BLIND_ITEMS;
void MUTE_ITEMS;

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
  const preBiqFiredHandlersRef = useRef<{
    p1: Set<string>;
    p2: Set<string>;
  } | null>(null);
  const resolveNextRoundRef = useRef<(() => void) | null>(null);

  // ── Stat bubbles ──────────────────────────────────────────────────────────
  const [p1Bubbles, setP1Bubbles] = useState<StatBubble[]>([]);
  const [p2Bubbles, setP2Bubbles] = useState<StatBubble[]>([]);
  const spawnStatBubbles = useCallback(
    (
      items: {
        player: "player1" | "player2";
        text: string;
        isPositive: boolean;
      }[],
    ) => {
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
    roundSpinModal,
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
  ): {
    pts: number;
    pending: boolean;
    color: string;
    autoApplied?: boolean;
    engineBase?: number;
  } => {
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
    return computeRoundPointsFn(
      side,
      winner,
      roundIdx,
      effects,
      statKey,
      roundsWonBefore,
      ctx,
    );
  };

  // ── computeRoundStep (delegates to src/engine/combatEngine.ts) ───────────
  const computeRoundStep = (
    roundIndex: number,
    state: StepCombatState,
    p1: PvPPlayerData,
    p2: PvPPlayerData,
    otpStats: Record<string, string> = {},
    hmStats: Record<string, string> = {},
    forcedWinner?: "player1" | "player2" | null,
  ): { newState: StepCombatState; log: RoundLog } => {
    return computeRoundStepEngine(
      roundIndex,
      state,
      p1,
      p2,
      otpStats,
      hmStats,
      {
        roundSpinResults,
        disabledItems,
        allPlayers,
        getPerRoundEffects,
      },
      forcedWinner,
    );
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
        const allChars = playerList
          .map((p) => p.character)
          .filter((c): c is Character => !!c);
        const resolved = playerList.map((p) =>
          reResolveWithAllChars(p, allChars),
        );
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
    setShowRoundResults(false);
    setCenterTab("pre");
  };

  // ── useStartCombat ────────────────────────────────────────────────────────
  const { startCombat } = useStartCombat({
    player1,
    player2,
    disabledItems,
    allPlayers,
    isTournamentMode: false,
    summoningScrollResult,
    goldenCoinPoints,
    oneTrickPonyStat,
    huntersMarkStat,
    tricksterResult,
    raumanianSuccess,
    scryingSuccess,
    encroachingShadowSuccess,
    goldShipResult,
    madScientistResult,
    dothrakiSpinResult,
    cursedCoinTarget,
    guidanceStats,
    blackMagicStat,
    rhittaResult,
    setAfterCombatEntries,
    setCombatConfirmed,
    setCombatResult,
    setCurrentRound,
    setDisabledItems,
    setIsAnimating,
    setIsPendingRoundtable,
    setPendingLoser,
    setRoundSpinResults,
    setSelectedTarnished,
    setStepRoundIndex,
    setStepState,
    setSubCombatResult,
    setSummoningScrollResult,
    setZoltraakBiq2Pending,
    getPerRoundEffects,
    EffectResolver,
    EffectRegistry,
    pendingAfterCombatBuildRef,
    pendingCrueltyAfterCombatRef,
    pendingFinalizeStateRef,
    preBiqFiredHandlersRef,
  });

  // ── Wheel forced winner state ─────────────────────────────────────────────
  const [wheelForcedWinner, setWheelForcedWinner] = useState<
    "player1" | "player2" | null
  >(null);

  // ── Current round winner (set ngay khi main wheel xác định, trước Next) ───
  const [currentRoundWinner, setCurrentRoundWinner] = useState<
    "player1" | "player2" | null
  >(null);
  // Reset khi round mới bắt đầu
  useEffect(() => {
    setCurrentRoundWinner(null);
  }, [stepRoundIndex]);

  // ── useResolveNextRound ───────────────────────────────────────────────────
  const { resolveNextRound } = useResolveNextRound({
    player1,
    player2,
    stepState,
    stepRoundIndex,
    disabledItems,
    allPlayers,
    isTournamentMode: false,
    roundtableSubMode: false,
    zoltraakBiq2Pending,
    oneTrickPonyStat,
    huntersMarkStat,
    tricksterResult,
    roundSpinResults,
    afterCombatSpinResults,
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
    player1,
    player2,
    disabledItems,
    setPlayer1,
    setPlayer2,
    setDisabledItems,
    setOneTrickPonyStat,
    setGuidanceStats,
    setPreCombatModal,
    setCursedCoinTarget,
    setHuntersMarkStat,
    setGoldenCoinPoints,
    setRaumanianSuccess,
    setScryingSuccess,
    setEncroachingShadowSuccess,
    setGoldShipResult,
    setMadScientistResult,
    setDothrakiSpinResult,
    setBlackMagicStat,
    setSummoningScrollResult,
    setTricksterResult,
    setRhittaResult,
    setCreatorsCatModal,
    spawnStatBubbles,
  });

  // ── usePvPScores ──────────────────────────────────────────────────────────
  const battleDone = !!combatResult;
  const {
    stepInProgress,
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
    // Dùng player.stats (calculateCharacterEffects) làm base; chỉ tính lại khi có disabled
    return player1?.character && disabledItems.size > 0
      ? calcStatsWithDisabled(player1.character, player1.no, disabledItems)
      : (player1?.stats ?? null);
  }, [player1, disabledItems, stepState, dothrakiPreviewStats]);

  const p2DisplayStats = useMemo(() => {
    if (stepState) return stepState.p2Stats;
    if (dothrakiPreviewStats) return dothrakiPreviewStats.s2;
    return player2?.character && disabledItems.size > 0
      ? calcStatsWithDisabled(player2.character, player2.no, disabledItems)
      : (player2?.stats ?? null);
  }, [player2, disabledItems, stepState, dothrakiPreviewStats]);

  // ── Dev weight overrides ──────────────────────────────────────────────────
  const [devWeightOverrides, setDevWeightOverrides] = useState<
    Record<string, Record<number, number>>
  >({});
  const [devPanelPos, setDevPanelPos] = useState({ x: 20, y: 200 });

  // ── applyDevWeights ───────────────────────────────────────────────────────
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

  // ── Round results collapse state ───────────────────────────────────────────
  const [showRoundResults, setShowRoundResults] = useState(false);
  useEffect(() => {
    if (battleDone) setShowRoundResults(true);
  }, [battleDone]);

  // ── Wheel weights for BattleWheelSpinner (WoT-specific) ──────────────────
  const currentStatInfo =
    stepInProgress && stepRoundIndex < 6 ? STAT_ORDER[stepRoundIndex] : null;
  const wotP1Val =
    currentStatInfo && stepState
      ? (stepState.p1Stats[currentStatInfo.key] ?? 0)
      : 0;
  const wotP2Val =
    currentStatInfo && stepState
      ? (stepState.p2Stats[currentStatInfo.key] ?? 0)
      : 0;
  const wotP1W = wotP1Val > wotP2Val ? wotP1Val * 2 : wotP1Val;
  const wotP2W = wotP2Val > wotP1Val ? wotP2Val * 2 : wotP2Val;

  // ── Spin buttons cho CURRENT round (hiện sau khi main wheel xác định winner) ─
  const currentStatKey =
    stepInProgress && stepRoundIndex < 6
      ? STAT_ORDER[stepRoundIndex]?.key
      : null;
  const wotP1SpinNodes =
    currentRoundWinner && player1 && stepState && currentStatKey
      ? (() => {
          const p1Effs = getPerRoundEffects(player1.character, player1.no);
          const p1Spin = calcRoundSpinEffects({
            effects: p1Effs,
            winner: currentRoundWinner,
            side: "player1",
            statKey: currentStatKey,
            isLastRound: stepRoundIndex >= 5,
            prevRounds: stepState.resolvedRounds,
            oppHasSpellFlux:
              (player2?.character?.powers ?? []).some(
                (p: any) =>
                  !p?.isLost &&
                  (typeof p === "string" ? p : (p?.name ?? ""))
                    .toLowerCase()
                    .startsWith("spell flux"),
              ) && !disabledItems.has(`${player2?.no}-power-Spell Flux`),
          });
          if (p1Spin.length === 0) return null;
          return p1Spin.map((eff) => (
            <RoundSpinButton
              key={eff}
              effectName={eff}
              side="player1"
              roundIdx={stepRoundIndex}
              roundSpinResults={roundSpinResults}
              applyDevWeights={applyDevWeights}
              setRoundSpinModal={setRoundSpinModal}
            />
          ));
        })()
      : null;

  const wotP2SpinNodes =
    currentRoundWinner && player2 && stepState && currentStatKey
      ? (() => {
          const p2Effs = getPerRoundEffects(player2.character, player2.no);
          const p2Spin = calcRoundSpinEffects({
            effects: p2Effs,
            winner: currentRoundWinner,
            side: "player2",
            statKey: currentStatKey,
            isLastRound: stepRoundIndex >= 5,
            prevRounds: stepState.resolvedRounds,
            oppHasSpellFlux:
              (player1?.character?.powers ?? []).some(
                (p: any) =>
                  !p?.isLost &&
                  (typeof p === "string" ? p : (p?.name ?? ""))
                    .toLowerCase()
                    .startsWith("spell flux"),
              ) && !disabledItems.has(`${player1?.no}-power-Spell Flux`),
          });
          if (p2Spin.length === 0) return null;
          return p2Spin.map((eff) => (
            <RoundSpinButton
              key={eff}
              effectName={eff}
              side="player2"
              roundIdx={stepRoundIndex}
              roundSpinResults={roundSpinResults}
              applyDevWeights={applyDevWeights}
              setRoundSpinModal={setRoundSpinModal}
            />
          ));
        })()
      : null;

  // ── hasCurrentPendingSpins: block Next nếu effects round này chưa spin ────
  const hasCurrentPendingSpins = useMemo(() => {
    if (
      !currentRoundWinner ||
      !stepState ||
      !player1 ||
      !player2 ||
      !currentStatKey
    )
      return false;
    const p1Effs = getPerRoundEffects(player1.character, player1.no);
    const p2Effs = getPerRoundEffects(player2.character, player2.no);
    if (
      computeRoundPoints(
        "player1",
        currentRoundWinner,
        stepRoundIndex,
        p1Effs,
        currentStatKey,
      ).pending
    )
      return true;
    if (
      computeRoundPoints(
        "player2",
        currentRoundWinner,
        stepRoundIndex,
        p2Effs,
        currentStatKey,
      ).pending
    )
      return true;
    if (stepRoundIndex < 5) {
      const AFTER_WIN_SPINS = ["Bash", "Luminescence", "Ranger-Silver"];
      const p1WinEffs = currentRoundWinner === "player1" ? p1Effs.onWin : [];
      const p2WinEffs = currentRoundWinner === "player2" ? p2Effs.onWin : [];
      for (const eff of AFTER_WIN_SPINS) {
        if (
          p1WinEffs.includes(eff) &&
          !roundSpinResults[`${stepRoundIndex}-${eff}-player1`]
        )
          return true;
        if (
          p2WinEffs.includes(eff) &&
          !roundSpinResults[`${stepRoundIndex}-${eff}-player2`]
        )
          return true;
      }
    }
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentRoundWinner,
    stepRoundIndex,
    roundSpinResults,
    player1,
    player2,
    stepState,
    currentStatKey,
  ]);

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
            className="px-4 py-2 rounded-lg bg-slate-900/70 hover:bg-slate-800/80 border border-amber-500/25 hover:border-amber-500/50 text-amber-300/80 hover:text-amber-200 font-display text-sm font-medium transition-all flex items-center gap-2 shrink-0 backdrop-blur-sm"
            style={{ boxShadow: "inset 0.5px 0.5px 0 rgba(255,209,108,0.06)" }}
          >
            <span>←</span> Back
          </button>
          <div
            className="flex-1 px-5 py-3 rounded-xl border border-amber-500/20 backdrop-blur-md"
            style={{
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.75) 0%, rgba(30,20,10,0.6) 100%)",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.7), inset 0.5px 0.5px 0 rgba(255,209,108,0.08)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-500/30" />
              <h1 className="font-display text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-primary to-orange-400 tracking-widest">
                Wheel of Truth
              </h1>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-500/30" />
            </div>
          </div>
        </div>

        {devMode && (
          <div className="mb-2 flex justify-center">
            <span className="px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-mono tracking-widest">
              ⚙ DEV MODE
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
            onClear={() => {
              setPlayer1(null);
              setSearchTerm1("");
              resetCombat();
            }}
            searchTerm={searchTerm1}
            setSearchTerm={setSearchTerm1}
            focused={focus1}
            setFocused={setFocus1}
            filteredPlayers={filteredPlayers1}
            onSelectPlayer={(p) => {
              setPlayer1(p);
              resetCombat();
            }}
            tab={leftTab}
            setTab={setLeftTab}
            disabledItems={disabledItems}
            toggleItem={toggleItem}
            placeholder="Tìm Player 1..."
            selectTabOnPick="effects"
          />

          {/* CENTER: Battle area */}
          <div className="flex-1 min-w-0">
            {/* JRPG Battle Scene — Astral Fantasy Arena */}
            <div
              className="relative rounded-2xl mb-3 overflow-hidden border border-amber-500/20"
              style={{
                background:
                  "linear-gradient(160deg, rgba(10,15,30,0.95) 0%, rgba(15,10,25,0.95) 50%, rgba(10,14,26,0.95) 100%)",
                boxShadow:
                  "0 8px 40px rgba(0,0,0,0.85), 0 0 60px rgba(139,92,246,0.04) inset, inset 0.5px 0.5px 0 rgba(255,209,108,0.06)",
              }}
            >
              {/* Ambient corner glows */}
              <div
                className="absolute top-0 left-0 w-32 h-32 rounded-full pointer-events-none opacity-10"
                style={{
                  background:
                    "radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 70%)",
                  transform: "translate(-30%,-30%)",
                }}
              />
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none opacity-10"
                style={{
                  background:
                    "radial-gradient(circle, rgba(239,68,68,0.6) 0%, transparent 70%)",
                  transform: "translate(30%,-30%)",
                }}
              />

              {/* Round indicator banner — Rune Scroll style */}
              {stepState && stepRoundIndex >= 0 && (
                <div className="relative z-10 flex justify-center pt-3 pb-1">
                  <div
                    className="flex items-center gap-2 px-5 py-1 rounded-full border border-amber-500/40 backdrop-blur-sm"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(120,60,0,0.4) 0%, rgba(80,40,0,0.5) 100%)",
                      boxShadow: "0 0 16px 2px rgba(255,209,108,0.1)",
                    }}
                  >
                    <span className="text-amber-500/60 text-[10px]">✦</span>
                    <span className="font-display text-amber-300 text-[11px] font-bold tracking-[0.2em] uppercase">
                      Round {stepRoundIndex + 1} / 6
                    </span>
                    <span className="text-amber-500/60 text-[10px]">✦</span>
                  </div>
                </div>
              )}

              <div className="relative z-10 p-3">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
                  {/* P1 card */}
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
                    /* Empty P1 slot — Rune Frame */
                    <div
                      className="rounded-xl border border-blue-500/15 flex flex-col items-center justify-center min-h-[140px] gap-2"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(15,23,42,0.7) 0%, rgba(20,30,60,0.5) 100%)",
                        boxShadow: "inset 0 0 20px rgba(59,130,246,0.04)",
                      }}
                    >
                      <div className="text-blue-500/20 text-2xl">⬡</div>
                      <span className="font-display text-blue-900/50 text-xs tracking-[0.2em] uppercase">
                        Player I
                      </span>
                    </div>
                  )}

                  {/* VS / Score Center */}
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
                      <div className="text-center mb-1">
                        <div
                          className="font-display font-black tracking-tight leading-none"
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
                          <span className="text-amber-600/60 mx-1 text-2xl">
                            ✦
                          </span>
                          <span
                            className="text-red-400"
                            style={{ textShadow: "0 0 16px #ef4444" }}
                          >
                            {battleDone ? effectiveScores.s2 : liveScore.s2}
                          </span>
                        </div>
                      </div>
                      {battleDone ? (
                        <>
                          {pendingSpins && (
                            <div className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse font-bold font-mono">
                              Còn spin
                            </div>
                          )}
                          {!pendingSpins &&
                            combatResult!.tieBreaker &&
                            effectiveScores.s1 === effectiveScores.s2 && (
                              <div className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold font-display tracking-widest">
                                RACE TIER
                              </div>
                            )}
                          {mainWinner && (
                            <div
                              className={`text-[11px] font-display font-black mt-1 px-3 py-1 rounded-lg border tracking-wide ${
                                effectiveWinner === "player1"
                                  ? "text-blue-300 bg-blue-500/10 border-blue-500/25"
                                  : "text-red-300 bg-red-500/10 border-red-500/25"
                              }`}
                              style={{
                                textShadow: `0 0 10px ${effectiveWinner === "player1" ? "#3b82f6" : "#ef4444"}`,
                              }}
                            >
                              {mainWinner.name}
                              <br />
                              <span className="text-amber-400 text-[10px]">
                                WINS ✦
                              </span>
                            </div>
                          )}
                        </>
                      ) : !stepState ? (
                        <div className="font-display text-[10px] text-amber-600/40 font-bold tracking-[0.3em] mt-1">
                          VS
                        </div>
                      ) : null}
                    </div>
                  </ScoreDisplay3D>

                  {/* P2 card */}
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
                    /* Empty P2 slot — Rune Frame */
                    <div
                      className="rounded-xl border border-red-500/15 flex flex-col items-center justify-center min-h-[140px] gap-2"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(42,15,15,0.7) 0%, rgba(60,20,20,0.5) 100%)",
                        boxShadow: "inset 0 0 20px rgba(239,68,68,0.04)",
                      }}
                    >
                      <div className="text-red-500/20 text-2xl">⬡</div>
                      <span className="font-display text-red-900/50 text-xs tracking-[0.2em] uppercase">
                        Player II
                      </span>
                    </div>
                  )}
                </div>

                {/* Swap + BGM + Start row */}
                <div className="mt-2 flex justify-center items-center gap-2">
                  {!stepState && !battleDone && player1 && player2 && (
                    <button
                      onClick={swapPlayers}
                      className="px-3 py-1 rounded-md text-amber-500/60 hover:text-amber-300 hover:bg-amber-900/20 transition-all text-xs border border-amber-600/20 hover:border-amber-500/40 font-mono"
                    >
                      ⇄ Swap
                    </button>
                  )}
                  {player1 &&
                    player2 &&
                    detectCombatAudioTracks(
                      player1.character,
                      undefined,
                      player1.no,
                    ).length === 0 &&
                    detectCombatAudioTracks(
                      player2.character,
                      undefined,
                      player2.no,
                    ).length === 0 && (
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
              <FloatingStatBubblesOverlay
                p1Bubbles={p1Bubbles}
                p2Bubbles={p2Bubbles}
              />
            </div>

            {/* ── 3-Tab Center Layout ─────────────────────────────────────── */}
            {player1 && player2 && (
              <div
                className="rounded-xl border border-amber-500/15 overflow-hidden mb-3 backdrop-blur-sm"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(10,16,30,0.92) 0%, rgba(12,10,24,0.95) 100%)",
                  boxShadow:
                    "0 8px 32px rgba(0,0,0,0.7), inset 0.5px 0.5px 0 rgba(255,209,108,0.05)",
                }}
              >
                {/* Tab bar */}
                <div className="flex border-b border-amber-500/10">
                  <button
                    onClick={() => setCenterTab("pre")}
                    className={`flex-1 py-2.5 text-xs font-display font-bold tracking-[0.1em] transition-all relative ${centerTab === "pre" ? "bg-amber-900/25 text-amber-300 border-b-2 border-amber-500" : "text-gray-600 hover:text-amber-400/70 hover:bg-amber-900/10"}`}
                  >
                    Trước Combat
                    {pendingPreCombatCount > 0 && centerTab !== "pre" && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    )}
                  </button>
                  <button
                    onClick={() => setCenterTab("wheel")}
                    className={`flex-1 py-2.5 text-xs font-display font-bold tracking-[0.1em] transition-all ${centerTab === "wheel" ? "bg-purple-900/25 text-purple-300 border-b-2 border-purple-500" : "text-gray-600 hover:text-purple-400/70 hover:bg-purple-900/10"}`}
                  >
                    Wheel of Truth
                  </button>
                  <button
                    onClick={() => setCenterTab("after")}
                    className={`flex-1 py-2.5 text-xs font-display font-bold tracking-[0.1em] transition-all relative ${centerTab === "after" ? "bg-emerald-900/25 text-emerald-300 border-b-2 border-emerald-500" : "text-gray-600 hover:text-emerald-400/70 hover:bg-emerald-900/10"}`}
                  >
                    Sau Combat
                    {battleDone &&
                      !combatConfirmed &&
                      centerTab !== "after" && (
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
                            <div className="flex items-center gap-1.5 justify-end">
                              <span
                                className={`text-sm font-black w-6 text-right ${p1Higher ? "text-blue-300" : "text-gray-600"}`}
                              >
                                {v1}
                              </span>
                              <div className="flex-1 max-w-[80px] bg-slate-900/70 rounded-full h-1.5 overflow-hidden flex justify-end">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${p1Higher ? "bg-gradient-to-l from-blue-400 to-cyan-400" : "bg-slate-700/60"}`}
                                  style={{ width: `${(v1 / maxVal) * 100}%` }}
                                />
                              </div>
                            </div>
                            <div
                              className={`text-center text-[10px] font-mono font-bold tracking-wider py-0.5 ${p1Higher === p2Higher ? "text-gray-600" : p1Higher ? "text-blue-500/70" : "text-red-500/70"}`}
                            >
                              {label}
                            </div>
                            <div className="flex items-center gap-1.5 justify-start">
                              <div className="flex-1 max-w-[80px] bg-slate-900/70 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${p2Higher ? "bg-gradient-to-r from-red-400 to-orange-400" : "bg-slate-700/60"}`}
                                  style={{ width: `${(v2 / maxVal) * 100}%` }}
                                />
                              </div>
                              <span
                                className={`text-sm font-black w-6 ${p2Higher ? "text-red-300" : "text-gray-600"}`}
                              >
                                {v2}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <CombatEffectsPanel
                      player1={{
                        name: player1.name,
                        character: player1.character,
                      }}
                      player2={{
                        name: player2.name,
                        character: player2.character,
                      }}
                      player1ComputedStats={p1DisplayStats ?? undefined}
                      player2ComputedStats={p2DisplayStats ?? undefined}
                      resetKey="pre-main"
                      preCombatOnly
                      onWheelResolved={handleWheelResolved}
                      onPendingPreCombatChange={setPendingPreCombatCount}
                    />
                    {!stepState && !battleDone && (
                      <div className="flex justify-center pt-2">
                        <button
                          onClick={() => {
                            startCombat();
                          }}
                          disabled={pendingPreCombatCount > 0}
                          className={`px-10 py-3 rounded-xl font-display font-bold text-base transition-all transform tracking-widest ${
                            pendingPreCombatCount > 0
                              ? "bg-slate-800/60 text-gray-600 cursor-not-allowed border border-slate-700/40"
                              : "text-slate-950 hover:scale-105 hover:brightness-110"
                          }`}
                          style={
                            pendingPreCombatCount > 0
                              ? {}
                              : {
                                  background:
                                    "linear-gradient(135deg, #ffd16c 0%, #fdc003 60%, #e6950a 100%)",
                                  boxShadow:
                                    "0 0 24px 4px rgba(255,209,108,0.25), inset 0.5px 0.5px 0 rgba(255,255,255,0.25)",
                                }
                          }
                        >
                          {pendingPreCombatCount > 0
                            ? `Còn ${pendingPreCombatCount} hiệu ứng chờ...`
                            : "✦ Bắt Đầu ✦"}
                        </button>
                      </div>
                    )}
                    {(stepState || battleDone) && (
                      <div className="text-center text-xs text-amber-600/40 py-2 italic font-lore">
                        Combat đang diễn ra — xem tab Wheel of Truth
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Wheel of Truth (rounds) */}
                {centerTab === "wheel" && (
                  <div className="p-3">
                    {stepInProgress && currentStatInfo && (
                      <div className="mb-4">
                        <BattleWheelSpinner
                          key={stepRoundIndex}
                          p1Name={player1.name}
                          p2Name={player2.name}
                          p1Weight={wotP1W}
                          p2Weight={wotP2W}
                          statLabel={currentStatInfo.label}
                          statKey={currentStatInfo.key}
                          p1Val={wotP1Val}
                          p2Val={wotP2Val}
                          p1AllStats={
                            stepState?.p1Stats as unknown as Record<
                              string,
                              number
                            >
                          }
                          p2AllStats={
                            stepState?.p2Stats as unknown as Record<
                              string,
                              number
                            >
                          }
                          p1SpinNodes={wotP1SpinNodes}
                          p2SpinNodes={wotP2SpinNodes}
                          hasCurrentPendingSpins={hasCurrentPendingSpins}
                          onWinnerDetermined={(w) => setCurrentRoundWinner(w)}
                          onSpinComplete={(winner) =>
                            setWheelForcedWinner(winner)
                          }
                        />
                      </div>
                    )}
                    {(combatResult || stepState) && (
                      <div>
                        <button
                          onClick={() => setShowRoundResults((v) => !v)}
                          className="w-full flex items-center justify-between px-4 py-2 rounded-lg border border-amber-500/15 hover:border-amber-500/30 bg-slate-900/50 hover:bg-slate-800/50 transition-all text-xs text-amber-500/60 hover:text-amber-300"
                        >
                          <span className="font-display font-bold tracking-widest text-[11px]">
                            ✦ Lịch sử rounds
                          </span>
                          <span className="text-amber-600/40">
                            {showRoundResults ? "▲" : "▼"}
                          </span>
                        </button>
                        {showRoundResults && (
                          <div className="mt-2">
                            <RoundResultsPanel
                              rounds={
                                combatResult
                                  ? combatResult.rounds
                                  : stepState!.resolvedRounds
                              }
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
                                const rr = combatResult
                                  ? combatResult.rounds
                                  : (stepState?.resolvedRounds ?? []);
                                return (
                                  (rr.length >= 5 &&
                                    rr[4]?.stat === "biq" &&
                                    rr[5]?.stat === "biq") ||
                                  rr.length > STAT_ORDER.length ||
                                  zoltraakBiq2Pending
                                );
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
                          </div>
                        )}
                      </div>
                    )}
                    {!combatResult && !stepState && (
                      <div className="text-center py-8">
                        <div className="text-amber-600/30 text-3xl mb-2">⚔</div>
                        <div className="font-lore text-amber-600/40 text-sm italic">
                          Chưa bắt đầu — chuyển sang tab Trước Combat
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Sau Combat */}
                {centerTab === "after" && (
                  <div className="p-3 space-y-3">
                    {/* After-combat CombatEffectsPanel */}
                    <CombatEffectsPanel
                      player1={{
                        name: player1.name,
                        character: player1.character,
                      }}
                      player2={{
                        name: player2.name,
                        character: player2.character,
                      }}
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
                              rounds: combatResult!.rounds.map((r) => ({
                                stat: r.stat,
                                winner: r.winner,
                              })),
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
                      <div
                        className="rounded-lg border border-orange-500/40 bg-orange-950/30 px-4 py-3 text-center text-sm text-orange-300 font-display font-bold animate-pulse tracking-wide"
                        style={{
                          boxShadow: "0 0 16px 2px rgba(249,115,22,0.08)",
                        }}
                      >
                        ⚔ Roundtable Hold — Trận phụ đang chờ xử lý
                      </div>
                    )}

                    {/* Kết thúc / Fight Again buttons */}
                    {battleDone && !combatConfirmed && (
                      <div className="flex justify-center pt-1">
                        <button
                          onClick={() => setCombatConfirmed(true)}
                          disabled={pendingSpins}
                          className={`px-8 py-2.5 font-display font-bold rounded-xl text-sm tracking-widest transition-all ${
                            pendingSpins
                              ? "bg-slate-800/60 text-gray-600 cursor-not-allowed border border-slate-700/40"
                              : "text-white hover:scale-105"
                          }`}
                          style={
                            pendingSpins
                              ? {}
                              : {
                                  background:
                                    "linear-gradient(135deg, #16a34a 0%, #059669 100%)",
                                  boxShadow: "0 0 20px 4px rgba(22,163,74,0.2)",
                                }
                          }
                        >
                          {pendingSpins
                            ? "Còn hiệu ứng chờ quay..."
                            : "✦ Kết Thúc ✦"}
                        </button>
                      </div>
                    )}
                    {combatConfirmed && (
                      <div className="flex justify-center pt-1">
                        <button
                          onClick={resetCombat}
                          className="px-6 py-2 rounded-lg bg-slate-800/70 hover:bg-slate-700/70 border border-amber-500/20 hover:border-amber-500/40 text-amber-300/70 hover:text-amber-200 font-display text-sm font-medium transition-all"
                        >
                          ⇄ Fight Again
                        </button>
                      </div>
                    )}
                    {!battleDone && (
                      <div className="text-center font-lore text-xs text-amber-600/30 py-4 italic">
                        Chưa kết thúc combat
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Persistent Round Log Bar */}
            {player1 &&
              player2 &&
              (() => {
                const logs = stepState?.roundLogs ?? [];
                if (logs.length === 0) return null;
                const viewIdx = Math.min(
                  viewLogIndex ?? logs.length - 1,
                  logs.length - 1,
                );
                const log = logs[viewIdx];
                const borderColor =
                  log.winner === "player1"
                    ? "rgba(59,130,246,0.3)"
                    : log.winner === "player2"
                      ? "rgba(239,68,68,0.3)"
                      : "rgba(234,179,8,0.3)";
                return (
                  /* Battle Log — Crystal Parchment Scroll */
                  <div
                    className="rounded-xl border overflow-hidden text-xs mb-3 backdrop-blur-sm"
                    style={{
                      background:
                        "linear-gradient(160deg, rgba(8,12,20,0.92) 0%, rgba(12,8,20,0.95) 100%)",
                      borderColor,
                      boxShadow: `0 4px 24px rgba(0,0,0,0.6), 0 0 12px 2px ${borderColor.replace("0.3", "0.08")}`,
                    }}
                  >
                    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-amber-500/10">
                      <button
                        onClick={() => setViewLogIndex(0)}
                        disabled={viewIdx === 0}
                        className="px-1 py-0.5 rounded text-[10px] text-gray-500 hover:text-white disabled:opacity-20"
                      >
                        «
                      </button>
                      <button
                        onClick={() =>
                          setViewLogIndex(Math.max(0, viewIdx - 1))
                        }
                        disabled={viewIdx === 0}
                        className="px-1 py-0.5 rounded text-[10px] text-gray-500 hover:text-white disabled:opacity-20"
                      >
                        ‹
                      </button>
                      <div className="flex gap-0.5 flex-1 justify-center">
                        {logs.map((lg, i) => (
                          <button
                            key={i}
                            onClick={() => setViewLogIndex(i)}
                            className={`w-5 h-5 rounded text-[9px] font-black transition-colors ${i === viewIdx ? (lg.roundIndex === -1 ? "bg-yellow-700/70 text-white" : "bg-purple-600/70 text-white") : "bg-gray-800/60 text-gray-500 hover:bg-gray-700/60 hover:text-gray-300"}`}
                          >
                            {lg.roundIndex === -1
                              ? "P"
                              : i + (logs[0]?.roundIndex === -1 ? 0 : 1)}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() =>
                          setViewLogIndex(
                            Math.min(logs.length - 1, viewIdx + 1),
                          )
                        }
                        disabled={viewIdx === logs.length - 1}
                        className="px-1 py-0.5 rounded text-[10px] text-gray-500 hover:text-white disabled:opacity-20"
                      >
                        ›
                      </button>
                      <button
                        onClick={() => setViewLogIndex(logs.length - 1)}
                        disabled={viewIdx === logs.length - 1}
                        className="px-1 py-0.5 rounded text-[10px] text-gray-500 hover:text-white disabled:opacity-20"
                      >
                        »
                      </button>
                    </div>
                    <div
                      className="px-2.5 py-1.5 space-y-0.5"
                      style={{ borderLeft: `3px solid ${borderColor}` }}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-black tracking-widest"
                          style={{
                            background:
                              log.roundIndex === -1
                                ? "rgba(234,179,8,0.2)"
                                : "rgba(168,85,247,0.2)",
                            color:
                              log.roundIndex === -1 ? "#fbbf24" : "#c084fc",
                            border: `1px solid ${log.roundIndex === -1 ? "rgba(234,179,8,0.3)" : "rgba(168,85,247,0.3)"}`,
                          }}
                        >
                          {log.roundIndex === -1
                            ? "PRE"
                            : `R${log.roundIndex + 1}`}
                        </span>
                        <span className="text-gray-400 text-[11px] font-bold">
                          {log.statLabel}
                        </span>
                        {log.roundIndex !== -1 && (
                          <>
                            <span className="text-blue-300 font-black">
                              {log.p1ValueUsed}
                            </span>
                            <span className="text-gray-600 text-[9px]">vs</span>
                            <span className="text-red-300 font-black">
                              {log.p2ValueUsed}
                            </span>
                          </>
                        )}
                        <span className="ml-auto text-[11px] font-black">
                          {log.roundIndex === -1 ? (
                            <span className="text-yellow-400/70 text-[10px] font-normal italic">
                              Hiệu ứng trước combat
                            </span>
                          ) : log.winner === "tie" ? (
                            <span className="text-yellow-400">═ HÒA</span>
                          ) : log.winner === "player1" ? (
                            <span className="text-blue-300">
                              ▶ {player1.name}
                            </span>
                          ) : (
                            <span className="text-red-300">
                              ◀ {player2.name}
                            </span>
                          )}
                        </span>
                      </div>
                      {log.events.map((ev, i) => (
                        <div
                          key={i}
                          className={`pl-2 border-l-2 text-[11px] ${ev.type === "stat_boost" ? "border-green-500/50 text-green-400" : ev.type === "stat_debuff" ? "border-red-500/50 text-red-400" : ev.type === "carry_over" ? "border-amber-500/50 text-amber-400" : ev.type === "point_change" ? "border-blue-500/50 text-blue-300" : "border-gray-600/50 text-gray-400"}`}
                        >
                          <span className="text-gray-600">
                            [
                            {ev.player === "player1"
                              ? player1.name
                              : player2.name}
                            ]
                          </span>{" "}
                          <span className="text-gray-500">{ev.source}:</span>{" "}
                          {ev.description}
                        </div>
                      ))}
                      {(log.carryOverToNext?.length ?? 0) > 0 && (
                        <div className="pl-2 text-amber-400/70 italic text-[11px]">
                          → Carry:{" "}
                          {log.carryOverToNext
                            .map(
                              (co) =>
                                `${co.source} ${co.value > 0 ? "+" : ""}${co.value} ${co.stat.toUpperCase()}`,
                            )
                            .join(", ")}
                        </div>
                      )}
                      <div className="flex justify-between text-[10px] text-gray-600 border-t border-gray-700/30 pt-1 mt-0.5">
                        <span>
                          Score{" "}
                          <span className="text-blue-400 font-bold">
                            {log.p1Score}
                          </span>{" "}
                          :{" "}
                          <span className="text-red-400 font-bold">
                            {log.p2Score}
                          </span>
                        </span>
                        {stepInProgress && viewIdx === logs.length - 1 && (
                          <span className="text-gray-600 animate-pulse">
                            R{stepRoundIndex + 1}/6 →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* Rules Info — Crystal Tooltip */}
            <div
              className="mt-2 rounded-xl backdrop-blur-sm border border-amber-500/10 p-3 text-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(15,23,42,0.7) 0%, rgba(20,10,30,0.6) 100%)",
              }}
            >
              <p className="text-indigo-50 text-xs leading-relaxed">
                <span className="font-display text-amber-400/80 tracking-wide">
                  Wheel of Truth:
                </span>{" "}
                Quay vòng quay cho từng stat round. Stat cao hơn = ô lớn hơn =
                xác suất cao hơn. Thắng nhiều round nhất. Hòa: Vòng quay
                tiebreak
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
            onClear={() => {
              setPlayer2(null);
              setSearchTerm2("");
              resetCombat();
            }}
            searchTerm={searchTerm2}
            setSearchTerm={setSearchTerm2}
            focused={focus2}
            setFocused={setFocus2}
            filteredPlayers={filteredPlayers2}
            onSelectPlayer={(p) => {
              setPlayer2(p);
              resetCombat();
            }}
            tab={rightTab}
            setTab={setRightTab}
            disabledItems={disabledItems}
            toggleItem={toggleItem}
            placeholder="Tìm Player 2..."
            selectTabOnPick="effects"
          />
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
        onResult={(item: WheelSpinItem) => {
          const key = `${roundSpinModal.roundIndex}-${roundSpinModal.title}-${roundSpinModal.side}`;
          setRoundSpinResults((prev) => ({
            ...prev,
            [key]: { label: item.label, isSuccess: !!item.isSuccess },
          }));
          setRoundSpinModal((prev) => ({ ...prev, isOpen: false }));
        }}
      />

      {/* Pre-combat wheel modal */}
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
