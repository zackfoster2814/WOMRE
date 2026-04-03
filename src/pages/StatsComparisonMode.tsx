import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Character, CharacterStats } from "../types/character";
// CharacterParser used via playerParsing.ts (imported below)
import { EffectResolver } from "../effects/resolver";
import { EffectRegistry } from "../effects/registry";
import { initializeEffectData } from "../effects/data";
import { HandlerRegistry } from "../effects/handlers";
import wheelBgImage from "../assets/img/wheel-bg.png";
// getAssetPath used via useWheelHandlers
import { CombatEffectsPanel } from "../components/CombatEffectsPanel";
import {
  ProbabilityWheelModal,
  type WheelSpinItem,
} from "../components/ProbabilityWheelModal";
import { PvPBackground3D } from "../components/three/PvPBackground3D";
import { CombatIntroScreen } from "../components/three/CombatIntroScreen";
import { ArenaLoadingScreen } from "../components/three/ArenaLoadingScreen";
import { CombatOutroScreen } from "../components/three/CombatOutroScreen";
import { PlayerCard3DFrame } from "../components/three/PlayerCard3D";
import { ScoreDisplay3D } from "../components/three/ScoreDisplay3D";
import { CombatEffects3D } from "../components/three/CombatEffects3D";
import { Canvas } from "@react-three/fiber";
import {
  fetchPlayerTexts,
  getPlayerIndex,
  invalidatePlayerCache,
} from "../utils/googleDrive";
import {
  PvPPlayerData,
  CombatResult,
  RoundLog,
  DothrakiRule,
  StepCombatState,
  StatBubble,
  BattleModeProps,
} from "../types/battleZone";
import {
  STAT_ORDER,
  _ALL_STAT_KEYS,
  playEndCombatSound,
} from "../constants/battleZone";
import {
  calcStatsWithDisabled,
  getPerRoundEffects as getPerRoundEffectsFn,
} from "../utils/combatStats";
import { FloatingStatBubblesOverlay } from "../components/combat/FloatingStatBubblesOverlay";
import { SCPlayerCard } from "../components/combat/SCPlayerCard";
import { DevWheelPanel } from "../components/combat/DevWheelPanel";
import { RoundResultsPanel, type DebugRoundPatch } from "../components/combat/RoundResultsPanel";
import { CreatorsCatModal } from "../components/combat/CreatorsCatModal";
import { PlayerSidebar } from "../components/combat/PlayerSidebar";
import {
  FallbackBgmController,
  detectCombatAudioTracks,
} from "../components/CombatAudioController";
import { AfterCombatPanel } from "../components/combat/AfterCombatPanel";
import { usePvPScores } from "../hooks/usePvPScores";
import { useWheelSpins } from "../hooks/useWheelSpins";
import {
  computeRoundPoints as computeRoundPointsFn,
  type ComputeRoundPointsContext,
} from "../utils/pointCalculation";
import {
  parsePlayerFromText,
  reResolveWithAllChars,
} from "../utils/playerParsing";
import { useWheelHandlers } from "../hooks/useWheelHandlers";
import { useStartCombat } from "../hooks/useStartCombat";
import { useResolveNextRound } from "../hooks/useResolveNextRound";
import { computeRoundStep as computeRoundStepEngine } from "../engine/combatEngine";
import {
  CRIT_ITEMS,
  EVASION_ITEMS,
  MISERICORDE_ITEMS,
  GAMBLER_ITEMS,
  CRUELTY_ITEMS,
  BLIND_ITEMS,
  MUTE_ITEMS,
  BASH_ITEMS,
  SAND_OF_TIME_ITEMS,
  RANGER_RED_ITEMS,
  RANGER_BLUE_ITEMS,
  RANGER_BLACK_ITEMS,
  RANGER_YELLOW_ITEMS,
  RANGER_PINK_ITEMS,
  RANGER_SILVER_ITEMS,
} from "../constants/wheelConfigs";

let _scmEffectsInitialized = false;
function ensureEffectsInitialized() {
  if (!_scmEffectsInitialized) {
    initializeEffectData();
    _scmEffectsInitialized = true;
  }
}

let _bubbleIdCounter = 0;

export const StatsComparisonMode = ({
  onBack,
  tournamentMatch,
  onSaveTournamentResult,
  onNextMatch,
}: BattleModeProps) => {
  const [allPlayers, setAllPlayers] = useState<PvPPlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm1, setSearchTerm1] = useState("");
  const [searchTerm2, setSearchTerm2] = useState("");
  const [player1, setPlayer1] = useState<PvPPlayerData | null>(null);
  const [player2, setPlayer2] = useState<PvPPlayerData | null>(null);
  const [audioResetKey, setAudioResetKey] = useState(0);
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [, setIsAnimating] = useState(false);
  const [, setCurrentRound] = useState(-1);
  const [focus1, setFocus1] = useState(false);
  const [focus2, setFocus2] = useState(false);
  const [leftTab, setLeftTab] = useState<"effects" | "inventory">("inventory");
  const [rightTab, setRightTab] = useState<"effects" | "inventory">(
    "inventory",
  );

  // Roundtable Hold pending state
  const [isPendingRoundtable, setIsPendingRoundtable] = useState(false);
  const [pendingLoser, setPendingLoser] = useState<
    "player1" | "player2" | null
  >(null);
  // Deferred after-combat build fn: gọi sau khi Roundtable Hold xác định winner thật
  const pendingAfterCombatBuildRef = useRef<
    | ((
        actualWinner: "player1" | "player2",
        p1ScoreOverride?: number,
        p2ScoreOverride?: number,
      ) => void)
    | null
  >(null);
  // Lưu finalState khi finalize bị block do pending spins (Cruelty ở round MA)
  const pendingFinalizeStateRef = useRef<typeof stepState | null>(null);
  // Lưu buildAfterCombat fn khi Cruelty pending ở round MA (gọi sau khi spin xong)
  const pendingCrueltyAfterCombatRef = useRef<
    | ((
        winner: "player1" | "player2",
        p1Score: number,
        p2Score: number,
      ) => void)
    | null
  >(null);
  // Lưu firedHandlers trước BIQ lần 1 để BIQ×2 dùng lại
  const preBiqFiredHandlersRef = useRef<{
    p1: Set<string>;
    p2: Set<string>;
  } | null>(null);

  // Step-by-step combat state
  const [stepState, setStepState] = useState<StepCombatState | null>(null);
  const [stepRoundIndex, setStepRoundIndex] = useState(-1);
  const [pendingPreCombatCount, setPendingPreCombatCount] = useState(0);
  const [showIntro, setShowIntro] = useState(false);
  const [showOutro, setShowOutro] = useState(false);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [masterVolume, setMasterVolume] = useState(1);
  const [bgmVolume, setBgmVolume] = useState(1);
  const [introVolume, setIntroVolume] = useState(0.6);
  const [introEnabled, setIntroEnabled] = useState(true);

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

  // Stats hiển thị trên card — computed later after dothrakiSpinResult is declared
  // See dothrakiPreviewStats + p1DisplayStats + p2DisplayStats below (after state declarations)

  // Tournament mode state
  const [tournamentSpecialEvent, setTournamentSpecialEvent] = useState(
    tournamentMatch?.existingSpecialEvent ?? "",
  );
  const [tournamentNote, setTournamentNote] = useState(
    tournamentMatch?.existingNote ?? "",
  );
  const isTournamentMode = !!tournamentMatch;

  // Tarnished selection for Roundtable sub-match
  const [tarnishedList, setTarnishedList] = useState<PvPPlayerData[]>([]);
  const [tarnishedSearchTerm, setTarnishedSearchTerm] = useState("");
  const [selectedTarnished, setSelectedTarnished] =
    useState<PvPPlayerData | null>(null);
  const [subCombatResult, setSubCombatResult] = useState<CombatResult | null>(
    null,
  );
  const [subIsAnimating] = useState(false);
  // Sub-combat round animation is not shown gradually; no-op setter used
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _setSubCurrentRound = (_: number) => {};

  // Roundtable Hold full sub-combat mode
  const [roundtableSubMode, setRoundtableSubMode] = useState(false);
  // Snapshot of main combat state before sub-combat
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [roundtableSnapshot, setRoundtableSnapshot] = useState<Record<
    string,
    any
  > | null>(null);
  // Override effectiveWinner after Tarnished wins sub-combat (pendingLoser gets saved)
  const [roundtableWinnerOverride, setRoundtableWinnerOverride] = useState<
    "player1" | "player2" | null
  >(null);

  // Zoltraak: BIQ×2 là round riêng biệt (click thứ 2 sau BIQ)
  const [zoltraakBiq2Pending, setZoltraakBiq2Pending] = useState(false);

  // Load all players từ Drive (gọi lại được khi cần refresh)
  const loadPlayers = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        ensureEffectsInitialized();
        const playerList: PvPPlayerData[] = [];

        if (tournamentMatch) {
          // Invalidate cache 2 player chính để luôn fetch data mới nhất từ Drive
          invalidatePlayerCache(tournamentMatch.player1No);
          invalidatePlayerCache(tournamentMatch.player2No);
          // Load toàn bộ players để cross-character effects (Cheater, v.v.) hoạt động đúng
          const index = await getPlayerIndex();
          const allNos = Object.keys(index)
            .filter((k) => /^No\d+$/.test(k))
            .map((k) => parseInt(k.replace(/\D/g, "")));
          const texts = await fetchPlayerTexts(allNos);
          for (const [no, content] of texts) {
            const player = parsePlayerFromText(content, no);
            if (player) playerList.push(player);
          }
          playerList.sort((a, b) => a.no - b.no);
          // Re-resolve với allCharacters để cross-character effects hoạt động
          const allChars = playerList
            .map((p) => p.character)
            .filter((c): c is Character => !!c);
          const resolved = playerList.map((p) =>
            reResolveWithAllChars(p, allChars),
          );
          setAllPlayers(resolved);
          setPlayer1(
            resolved.find((p) => p.no === tournamentMatch.player1No) ?? null,
          );
          setPlayer2(
            resolved.find((p) => p.no === tournamentMatch.player2No) ?? null,
          );
        } else {
          // Không có tournament context: load hết để cho phép chọn tay
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
          // Re-resolve với allCharacters để cross-character effects hoạt động
          const allChars = playerList
            .map((p) => p.character)
            .filter((c): c is Character => !!c);
          const resolved = playerList.map((p) =>
            reResolveWithAllChars(p, allChars),
          );
          setAllPlayers(resolved);
        }
      } catch (error) {
        console.error("Error loading players:", error);
      } finally {
        setLoading(false);
      }
    },
    [tournamentMatch],
  );

  // Load lần đầu khi mount
  useEffect(() => {
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

  // ── Step-by-step: resolve 1 round (delegates to src/engine/combatEngine.ts) ──
  const computeRoundStep = (
    roundIndex: number,
    state: StepCombatState,
    p1: PvPPlayerData,
    p2: PvPPlayerData,
    otpStats: Record<string, string> = {},
    hmStats: Record<string, string> = {},
    forcedWinner?: "player1" | "player2" | null,
  ): { newState: StepCombatState; log: RoundLog } => {
    return computeRoundStepEngine(roundIndex, state, p1, p2, otpStats, hmStats, {
      roundSpinResults,
      disabledItems,
      allPlayers,
      getPerRoundEffects,
    }, forcedWinner);
  };

  // Check and apply Roundtable Hold after combat
  const checkAndSetRoundtableHold = (result: CombatResult): boolean => {
    const loserSide = result.winner === "player1" ? "player2" : "player1";
    const loser = result.winner === "player1" ? player2 : player1;
    const opponent = result.winner === "player1" ? player1 : player2;
    if (!loser || !opponent) return false;
    const loserHasRT = hasRoundtableHold(loser);
    const opponentHasRT = hasRoundtableHold(opponent);
    if (loserHasRT && !opponentHasRT) {
      const tarnished = allPlayers.filter(
        (p) =>
          p.no !== loser.no &&
          hasRoundtableHold(p) &&
          p.character?.tournament?.status !== "eliminated",
      );
      if (tarnished.length > 0) {
        setTarnishedList(tarnished);
        setIsPendingRoundtable(true);
        setPendingLoser(loserSide);
        return true;
      }
    }
    return false;
  };

  const startCombatRef = useRef<(() => void) | null>(null);

  // Hiển thị intro screen 5s trước khi bắt đầu combat
  const handleStartWithIntro = async () => {
    if (!player1 || !player2) return;
    if (introEnabled) {
      setShowIntro(true);
    } else {
      startCombatRef.current?.();
    }
  };

  // Resolve next round (called on "Next Round" button)
  // Resolve next round (called on "Next Round" button)
  const resolveNextRoundRef = useRef<(() => void) | null>(null);

  // Run sub-combat (Tarnished vs main winner) — full PvP mode with snapshot/restore
  const startRoundtableSubCombat = (
    tarnished: PvPPlayerData,
    mainWinnerPlayer: PvPPlayerData,
    mainCombatResult: CombatResult,
    pendingLoserSide: "player1" | "player2",
    savedTarnishedList: PvPPlayerData[],
  ) => {
    // Save snapshot of current main combat state
    const snapshot = {
      player1,
      player2,
      searchTerm1,
      searchTerm2,
      combatResult: mainCombatResult,
      stepState,
      stepRoundIndex,
      combatConfirmed,
      roundSpinResults,
      oneTrickPonyStat,
      huntersMarkStat,
      guidanceStats,
      raumanianSuccess,
      goldenCoinPoints,
      cursedCoinTarget,
      scryingSuccess,
      encroachingShadowSuccess,
      goldShipResult,
      rhittaResult,
      madScientistResult,
      summoningScrollResult,
      tricksterResult,
      blackMagicStat,
      dothrakiSpinResult,
      afterCombatEntries,
      afterCombatSpinResults,
      isPendingRoundtable: true,
      pendingLoser: pendingLoserSide,
      tarnishedList: savedTarnishedList,
      selectedTarnished: tarnished,
      disabledItems,
      deferredAfterCombatBuild: pendingAfterCombatBuildRef.current,
    };
    setRoundtableSnapshot(snapshot);
    setRoundtableSubMode(true);

    // Set players for sub-combat: Tarnished (p1) vs main winner (p2)
    setPlayer1(tarnished);
    setPlayer2(mainWinnerPlayer);
    setSearchTerm1(tarnished.name);
    setSearchTerm2(mainWinnerPlayer.name);

    // Reset all combat states for fresh sub-combat
    setCombatResult(null);
    setStepState(null);
    setStepRoundIndex(-1);
    setCombatConfirmed(false);
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
    setIsPendingRoundtable(false);
    setPendingLoser(null);
    setTarnishedList([]);
    setSelectedTarnished(null);
    setSubCombatResult(null);
    setDisabledItems(new Set());
    setAudioResetKey((k) => k + 1);
  };

  // Confirm sub-combat result and restore main combat snapshot
  const confirmRoundtableSubCombat = (subResult: CombatResult) => {
    if (!roundtableSnapshot) return;
    const snap = roundtableSnapshot;
    const tarnishedWon = subResult.winner === "player1"; // Tarnished is always player1 in sub
    // Winner thật sau Roundtable: nếu Tarnished thắng → pendingLoser được cứu = winner thật
    const actualMainWinner: "player1" | "player2" = tarnishedWon
      ? (snap.pendingLoser as "player1" | "player2")
      : snap.pendingLoser === "player1"
        ? "player2"
        : "player1";

    // Restore main combat state
    setPlayer1(snap.player1);
    setPlayer2(snap.player2);
    setSearchTerm1(snap.searchTerm1);
    setSearchTerm2(snap.searchTerm2);
    setStepState(snap.stepState);
    setStepRoundIndex(snap.stepRoundIndex);
    setCombatConfirmed(snap.combatConfirmed);
    setRoundSpinResults(snap.roundSpinResults);
    setOneTrickPonyStat(snap.oneTrickPonyStat);
    setHuntersMarkStat(snap.huntersMarkStat);
    setGuidanceStats(snap.guidanceStats);
    setRaumanianSuccess(snap.raumanianSuccess);
    setGoldenCoinPoints(snap.goldenCoinPoints);
    setCursedCoinTarget(snap.cursedCoinTarget || {});
    setScryingSuccess(snap.scryingSuccess);
    setEncroachingShadowSuccess(snap.encroachingShadowSuccess);
    setGoldShipResult(snap.goldShipResult);
    setRhittaResult(snap.rhittaResult || {});
    setMadScientistResult(snap.madScientistResult);
    setSummoningScrollResult(snap.summoningScrollResult);
    setTricksterResult(snap.tricksterResult);
    setBlackMagicStat(snap.blackMagicStat);
    setDothrakiSpinResult(snap.dothrakiSpinResult);
    setAfterCombatEntries(snap.afterCombatEntries ?? []);
    setAfterCombatSpinResults(snap.afterCombatSpinResults);
    setTarnishedList(snap.tarnishedList);
    setSelectedTarnished(snap.selectedTarnished);
    setSubCombatResult(subResult);
    setDisabledItems(snap.disabledItems);

    // Restore original combatResult (scores/rounds đúng theo trận chính)
    setCombatResult(snap.combatResult);

    // If Tarnished won → loser is saved → override effectiveWinner to pendingLoser side
    if (tarnishedWon) {
      setRoundtableWinnerOverride(snap.pendingLoser as "player1" | "player2");
    } else {
      setRoundtableWinnerOverride(null);
    }

    setIsPendingRoundtable(false);
    setPendingLoser(snap.pendingLoser);
    setRoundtableSubMode(false);
    setRoundtableSnapshot(null);
    setAudioResetKey((k) => k + 1);

    // Build after-combat entries với winner thật (sau khi Roundtable Hold xác định)
    const deferredBuild = (snap as any).deferredAfterCombatBuild as
      | ((w: "player1" | "player2") => void)
      | null;
    if (deferredBuild) {
      deferredBuild(actualMainWinner);
    }
    pendingAfterCombatBuildRef.current = null;
  };

  // Confirm combat + append after-combat spin results to Drive log
  const handleConfirmCombat = () => {
    setShowOutro(true);
    playEndCombatSound();
  };

  const doConfirmCombat = () => {
    setShowOutro(false);
    setCombatConfirmed(true);
    if (!player1 || !player2) return;
    const p1name = player1.name;
    const p2name = player2.name;
    const hasAnySpinLog =
      Object.keys(roundSpinResults).length > 0 ||
      Object.keys(afterCombatSpinResults).length > 0 ||
      afterCombatEntries.length > 0;
    if (!hasAnySpinLog) return;

    import("../utils/googleDrive").then(({ appendReportToDrive }) => {
      import("../config/googleDrive").then(({ REPORT_FILE_ID }) => {
        const ls: string[] = [];
        ls.push(`\n>>> KẾT QUẢ VÒNG QUAY (sau combat confirm) <<<`);

        // Per-round spins (Crit, Gambler, Golden Parry, Evasion, Mute, Blind, Ranger, Pennyworthy...)
        const roundSpinEntries = Object.entries(roundSpinResults);
        if (roundSpinEntries.length > 0) {
          ls.push(`\n[Vòng quay trong combat]`);
          for (const [key, result] of roundSpinEntries) {
            // key format: `${roundIdx}-${effectName}-${side}`
            const parts = key.split("-");
            const side = parts[parts.length - 1] as "player1" | "player2";
            const pname = side === "player1" ? p1name : p2name;
            const effectName = parts.slice(1, parts.length - 1).join("-");
            const roundIdx = parts[0];
            const STAT_LABELS: Record<string, string> = {
              "0": "STR",
              "1": "SPD",
              "2": "DUR",
              "3": "IQ",
              "4": "BIQ",
              "5": "MA",
            };
            const roundLabel = STAT_LABELS[roundIdx] ?? `Round ${roundIdx}`;
            ls.push(
              `  [${pname}] ${effectName} (${roundLabel}): ${result.label} → ${result.isSuccess ? "✓ Thành công" : "✗ Thất bại"}`,
            );
          }
        }

        // After-combat entries (Edgelord, PvP Reward, Resilient, quirks...)
        if (afterCombatEntries.length > 0) {
          ls.push(`\n[Hiệu ứng sau combat]`);
          for (const entry of afterCombatEntries) {
            const pname = entry.player === "player1" ? p1name : p2name;
            if (entry.wheelKey) {
              const spinRes = afterCombatSpinResults[entry.wheelKey];
              const spinText = spinRes
                ? `→ Quay: "${spinRes.label}" (${spinRes.isSuccess ? "✓" : "✗"})`
                : `→ Chưa quay`;
              ls.push(
                `  [${pname}] ${entry.quirkName}: ${entry.description} ${spinText}`,
              );
            } else {
              ls.push(`  [${pname}] ${entry.quirkName}: ${entry.description}`);
            }
          }
        }

        appendReportToDrive(REPORT_FILE_ID, ls.join("\n") + "\n").catch(
          () => {},
        );
      });
    });
  };

  // Debug: patch 1 round (điểm hiển thị và/hoặc chỉ số stat)
  const handleDebugRound = (patch: DebugRoundPatch) => {
    const { roundArrayIndex, statKey, p1Value, p2Value, p1StatDelta, p2StatDelta } = patch;
    // Patch combatResult.rounds (điểm hiển thị)
    if (p1Value !== undefined || p2Value !== undefined) {
      setCombatResult((prev) => {
        if (!prev) return prev;
        const newRounds = prev.rounds.map((r, i) => {
          if (i !== roundArrayIndex) return r;
          const nP1 = p1Value !== undefined ? p1Value : r.player1Value;
          const nP2 = p2Value !== undefined ? p2Value : r.player2Value;
          const winner: "player1" | "player2" | "tie" =
            nP1 > nP2 ? "player1" : nP2 > nP1 ? "player2" : "tie";
          return { ...r, player1Value: nP1, player2Value: nP2, winner };
        });
        return { ...prev, rounds: newRounds };
      });
      // Patch stepState.resolvedRounds cùng lúc
      setStepState((prev) => {
        if (!prev) return prev;
        const newResolved = prev.resolvedRounds.map((r, i) => {
          if (i !== roundArrayIndex) return r;
          const nP1 = p1Value !== undefined ? p1Value : r.player1Value;
          const nP2 = p2Value !== undefined ? p2Value : r.player2Value;
          const winner: "player1" | "player2" | "tie" =
            nP1 > nP2 ? "player1" : nP2 > nP1 ? "player2" : "tie";
          return { ...r, player1Value: nP1, player2Value: nP2, winner };
        });
        return { ...prev, resolvedRounds: newResolved };
      });
    }
    // Patch stepState.p1Stats / p2Stats (chỉ số stat trước khi tính round này)
    if (p1StatDelta !== undefined || p2StatDelta !== undefined) {
      setStepState((prev) => {
        if (!prev) return prev;
        const newP1Stats = { ...prev.p1Stats };
        const newP2Stats = { ...prev.p2Stats };
        if (p1StatDelta !== undefined) newP1Stats[statKey] = (newP1Stats[statKey] ?? 0) + p1StatDelta;
        if (p2StatDelta !== undefined) newP2Stats[statKey] = (newP2Stats[statKey] ?? 0) + p2StatDelta;
        return { ...prev, p1Stats: newP1Stats, p2Stats: newP2Stats };
      });
    }
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
    setTiebreakerWheelResult(null);
    setStepState(null);
    setStepRoundIndex(-1);
    setCombatConfirmed(false);
    setAudioResetKey((k) => k + 1);
    setViewLogIndex(null);
    setRoundtableSubMode(false);
    setRoundtableSnapshot(null);
    setRoundtableWinnerOverride(null);
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
  // Wrapper để dùng disabledItems từ state
  const getPerRoundEffects = (char: Character | undefined, playerNo?: number) =>
    getPerRoundEffectsFn(char, playerNo, disabledItems);

  // State for per-round spin modal in round display

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

  // User must explicitly confirm result after spins are done
  const [combatConfirmed, setCombatConfirmed] = useState(false);

  // Start combat (init step state)
  const { startCombat } = useStartCombat({
    player1,
    player2,
    disabledItems,
    allPlayers,
    isTournamentMode,
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

  startCombatRef.current = startCombat;

  // Stats hiển thị trên card, đã trừ disabled items
  // Khi có Dothraki spin result (trước combat) → preview stats đã swap/boost
  // Khi combat đang chạy → dùng stepState; còn lại dùng calcStatsWithDisabled
  const dothrakiPreviewStats = useMemo(() => {
    if (stepState) return null;
    const p1Rule = (dothrakiSpinResult["player1"] ?? null) as DothrakiRule;
    const p2Rule = (dothrakiSpinResult["player2"] ?? null) as DothrakiRule;
    const p1GoldShip = goldShipResult["player1"] ?? null;
    const p2GoldShip = goldShipResult["player2"] ?? null;
    const p1MadScientist = madScientistResult["player1"] ?? null;
    const p2MadScientist = madScientistResult["player2"] ?? null;
    const p1Summon = summoningScrollResult["player1"] ?? null;
    const p2Summon = summoningScrollResult["player2"] ?? null;
    const p1Scrying = scryingSuccess["player1"] ?? false;
    const p2Scrying = scryingSuccess["player2"] ?? false;
    if (
      p1Rule === null &&
      p2Rule === null &&
      p1GoldShip === null &&
      p2GoldShip === null &&
      p1MadScientist === null &&
      p2MadScientist === null &&
      !p1Summon &&
      !p2Summon &&
      !p1Scrying &&
      !p2Scrying
    )
      return null;
    if (!player1 || !player2) return null;
    const s1: CharacterStats = player1.character && disabledItems.size > 0
      ? calcStatsWithDisabled(player1.character, player1.no, disabledItems)
      : { ...player1.stats };
    const s2: CharacterStats = player2.character && disabledItems.size > 0
      ? calcStatsWithDisabled(player2.character, player2.no, disabledItems)
      : { ...player2.stats };
    const DSTAT_KEYS = [
      "str",
      "spd",
      "dur",
      "iq",
      "biq",
      "ma",
    ] as (keyof CharacterStats)[];
    const swp = (
      ref: CharacterStats,
      a: keyof CharacterStats,
      b: keyof CharacterStats,
    ) => {
      const tmp = ref[a] || 0;
      ref[a] = ref[b] || 0;
      ref[b] = tmp;
    };
    // Gold Ship: apply ngay khi quay xong
    if (p1GoldShip !== null) {
      const d1 = p1GoldShip ? 1 : -1;
      DSTAT_KEYS.forEach((k) => {
        s1[k] = (s1[k] || 0) + d1;
      });
    }
    if (p2GoldShip !== null) {
      const d2 = p2GoldShip ? 1 : -1;
      DSTAT_KEYS.forEach((k) => {
        s2[k] = (s2[k] || 0) + d2;
      });
    }
    // Mad Scientist: Shrinking (true) = bản thân +6 SPD, -3 STR, -3 DUR; Enlarging (false) = bản thân +3 STR, +3 DUR, -6 SPD
    if (p1MadScientist !== null) {
      if (p1MadScientist) {
        s1["spd"] = (s1["spd"] || 0) + 6;
        s1["str"] = (s1["str"] || 0) - 3;
        s1["dur"] = (s1["dur"] || 0) - 3;
      } else {
        s1["str"] = (s1["str"] || 0) + 3;
        s1["dur"] = (s1["dur"] || 0) + 3;
        s1["spd"] = (s1["spd"] || 0) - 6;
      }
    }
    if (p2MadScientist !== null) {
      if (p2MadScientist) {
        s2["spd"] = (s2["spd"] || 0) + 6;
        s2["str"] = (s2["str"] || 0) - 3;
        s2["dur"] = (s2["dur"] || 0) - 3;
      } else {
        s2["str"] = (s2["str"] || 0) + 3;
        s2["dur"] = (s2["dur"] || 0) + 3;
        s2["spd"] = (s2["spd"] || 0) - 6;
      }
    }
    // Summoning Scroll: apply stat deltas vào preview
    if (p1Summon) {
      for (const [k, v] of Object.entries(p1Summon.statDeltas)) {
        s1[k as keyof CharacterStats] =
          (s1[k as keyof CharacterStats] || 0) + (v as number);
      }
    }
    if (p2Summon) {
      for (const [k, v] of Object.entries(p2Summon.statDeltas)) {
        s2[k as keyof CharacterStats] =
          (s2[k as keyof CharacterStats] || 0) + (v as number);
      }
    }
    // Pass 1: boosts
    if (p1Rule === 5) {
      DSTAT_KEYS.forEach((k) => {
        s1[k] = (s1[k] || 0) + 4;
      });
    } else if (p1Rule === 6) {
      DSTAT_KEYS.forEach((k) => {
        s2[k] = (s2[k] || 0) + 5;
      });
    }
    if (p2Rule === 5) {
      DSTAT_KEYS.forEach((k) => {
        s2[k] = (s2[k] || 0) + 4;
      });
    } else if (p2Rule === 6) {
      DSTAT_KEYS.forEach((k) => {
        s1[k] = (s1[k] || 0) + 5;
      });
    }
    // Pass 2: swaps (on fully-boosted stats)
    if (p1Rule === 1) {
      swp(s2, "str", "ma");
      swp(s2, "spd", "biq");
      swp(s2, "dur", "iq");
    } else if (p1Rule === 2) {
      swp(s1, "str", "biq");
    } else if (p1Rule === 3) {
      swp(s1, "spd", "iq");
    } else if (p1Rule === 4) {
      swp(s1, "dur", "ma");
    }
    if (p2Rule === 1) {
      swp(s1, "str", "ma");
      swp(s1, "spd", "biq");
      swp(s1, "dur", "iq");
    } else if (p2Rule === 2) {
      swp(s2, "str", "biq");
    } else if (p2Rule === 3) {
      swp(s2, "spd", "iq");
    } else if (p2Rule === 4) {
      swp(s2, "dur", "ma");
    }
    // Scrying: p1 thành công → s2 bị -4 stat cao nhất; p2 thành công → s1 bị -4 stat cao nhất
    // Tìm highest dựa vào raw base stats (player.baseStats), không phải stats đã modify
    if (p1Scrying) {
      const rawP2 = player2.baseStats;
      const highest = DSTAT_KEYS.reduce((a, b) =>
        (rawP2[a] || 0) >= (rawP2[b] || 0) ? a : b,
      );
      s2[highest] = (s2[highest] || 0) - 4;
    }
    if (p2Scrying) {
      const rawP1 = player1.baseStats;
      const highest = DSTAT_KEYS.reduce((a, b) =>
        (rawP1[a] || 0) >= (rawP1[b] || 0) ? a : b,
      );
      s1[highest] = (s1[highest] || 0) - 4;
    }
    return { s1, s2 };
  }, [
    stepState,
    dothrakiSpinResult,
    goldShipResult,
    madScientistResult,
    summoningScrollResult,
    scryingSuccess,
    player1,
    player2,
    disabledItems,
  ]);

  const TRICKSTER_DISPLAY_DELTA: Record<string, number> = {
    "king of diamonds": 1,
    "queen of clubs": -1,
    "jack of 97": 97,
  };
  const p1DisplayStats = useMemo(() => {
    if (stepState) return stepState.p1Stats;
    if (dothrakiPreviewStats) return dothrakiPreviewStats.s1;
    // Dùng player1.stats (đã tính bởi calculateCharacterEffects) làm base khi không có disabled;
    // nếu có disabled items thì tính lại để phản ánh đúng
    const base = player1?.character && disabledItems.size > 0
      ? calcStatsWithDisabled(player1.character, player1.no, disabledItems)
      : (player1?.stats ?? null);
    const delta =
      TRICKSTER_DISPLAY_DELTA[(tricksterResult["player1"] ?? "").toLowerCase()];
    if (base && delta != null) {
      const s = { ...base };
      for (const k of _ALL_STAT_KEYS) s[k] = Math.max(0, (s[k] ?? 0) + delta);
      return s;
    }
    // Black Magic debuff lên player1
    const p1HasUno =
      (player1?.character?.powers || [])
        .filter((pw: any) => !pw.isLost)
        .some(
          (pw: any) =>
            (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
            "uno reverse card",
        ) && !disabledItems.has(`${player1?.no}-power-Uno Reverse Card`);
    const p2HasUnoForP1 =
      (player2?.character?.powers || [])
        .filter((pw: any) => !pw.isLost)
        .some(
          (pw: any) =>
            (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
            "uno reverse card",
        ) && !disabledItems.has(`${player2?.no}-power-Uno Reverse Card`);
    if (base) {
      const s = { ...base };
      let changed = false;
      // player2 dùng BM: bounce về p2 nếu p2 tự có URC hoặc p1 có URC; ngược lại trừ p1
      const bmFromP2 = blackMagicStat["player2"];
      if (bmFromP2) {
        if (p1HasUno || p2HasUnoForP1) {
          /* bounce về p2, handled in p2DisplayStats */
        } else {
          s[bmFromP2] = (s[bmFromP2] ?? 0) - 2;
          changed = true;
        }
      }
      // player1 dùng BM: bounce về p1 nếu p1 tự có URC hoặc p2 có URC
      const bmFromP1 = blackMagicStat["player1"];
      if (bmFromP1 && (p1HasUno || p2HasUnoForP1)) {
        s[bmFromP1] = (s[bmFromP1] ?? 0) - 2;
        changed = true;
      }
      if (changed) return s;
    }
    return base;
  }, [
    player1,
    player2,
    disabledItems,
    stepState,
    dothrakiPreviewStats,
    tricksterResult,
    blackMagicStat,
  ]);

  const p2DisplayStats = useMemo(() => {
    if (stepState) return stepState.p2Stats;
    if (dothrakiPreviewStats) return dothrakiPreviewStats.s2;
    // Dùng player2.stats (đã tính bởi calculateCharacterEffects) làm base khi không có disabled;
    // nếu có disabled items thì tính lại để phản ánh đúng
    const base = player2?.character && disabledItems.size > 0
      ? calcStatsWithDisabled(player2.character, player2.no, disabledItems)
      : (player2?.stats ?? null);
    const delta =
      TRICKSTER_DISPLAY_DELTA[(tricksterResult["player2"] ?? "").toLowerCase()];
    if (base && delta != null) {
      const s = { ...base };
      for (const k of _ALL_STAT_KEYS) s[k] = Math.max(0, (s[k] ?? 0) + delta);
      return s;
    }
    // Black Magic của player1 debuff player2 (trừ khi player2 có Uno Reverse Card)
    const bmStatOnP2 = blackMagicStat["player1"];
    const p2HasUno =
      (player2?.character?.powers || [])
        .filter((pw: any) => !pw.isLost)
        .some(
          (pw: any) =>
            (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
            "uno reverse card",
        ) && !disabledItems.has(`${player2?.no}-power-Uno Reverse Card`);
    const bmStatOnP2FromSelf = blackMagicStat["player2"]; // debuff của player2 bị URC từ player1 bounce lại
    const p1HasUnoForP2 =
      (player1?.character?.powers || [])
        .filter((pw: any) => !pw.isLost)
        .some(
          (pw: any) =>
            (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
            "uno reverse card",
        ) && !disabledItems.has(`${player1?.no}-power-Uno Reverse Card`);
    if (base) {
      const s = { ...base };
      let changed = false;
      // player1 dùng BM: bounce về p1 nếu p1 tự có URC hoặc p2 có URC; ngược lại trừ p2
      if (bmStatOnP2) {
        if (p1HasUnoForP2 || p2HasUno) {
          /* bounce về p1, handled in p1DisplayStats */
        } else {
          s[bmStatOnP2] = (s[bmStatOnP2] ?? 0) - 2;
          changed = true;
        }
      }
      // player2 dùng BM: bounce về p2 nếu p2 tự có URC hoặc p1 có URC
      if (bmStatOnP2FromSelf && (p2HasUno || p1HasUnoForP2)) {
        s[bmStatOnP2FromSelf] = (s[bmStatOnP2FromSelf] ?? 0) - 2;
        changed = true;
      }
      if (changed) return s;
    }
    return base;
  }, [
    player1,
    player2,
    disabledItems,
    stepState,
    dothrakiPreviewStats,
    tricksterResult,
    blackMagicStat,
  ]);

  // Dev Mode: wheel weight overrides (effectName -> itemIndex -> weight)
  const [devMode, setDevMode] = useState(false);
  const [devWeightOverrides, setDevWeightOverrides] = useState<
    Record<string, Record<number, number>>
  >({});
  const [devPanelPos, setDevPanelPos] = useState({ x: 20, y: 200 });
  const [skipRoundSpins, setSkipRoundSpins] = useState(false);

  // Dev mode toggle (z → v → m sequence)
  useEffect(() => {
    const SEQ = ["z", "v", "m"];
    let buf: string[] = [];
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
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

  // Apply dev weight overrides to a wheel item array
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
  // Compute effective points for a side in a round, factoring in spin results
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

  const battleDone = !!combatResult;

  const {
    stepInProgress,
    pendingSpinsForLastRound,
    effectiveScores,
    liveScore,
    tiebreakerWheelResult,
    setTiebreakerWheelResult,
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
    roundtableWinnerOverride,
    computeRoundPoints,
  });

  // ── Dev: auto-skip round spins ────────────────────────────────────
  useEffect(() => {
    if (!skipRoundSpins || !player1 || !player2) return;

    // Determine which round(s) need auto-fill
    const roundsToFill: number[] = [];
    // During combat: pending spins for last resolved round
    if (pendingSpinsForLastRound && stepState && stepRoundIndex > 0) {
      roundsToFill.push(stepRoundIndex - 1);
    }
    // After all 6 rounds: MA round (5) may have pending spins during finalize
    if (pendingFinalizeStateRef.current) {
      roundsToFill.push(5);
    }
    if (roundsToFill.length === 0) return;

    const p1Effs = getPerRoundEffects(player1.character, player1.no);
    const p2Effs = getPerRoundEffects(player2.character, player2.no);

    // Weighted random pick from wheel items
    const pickResult = (items: WheelSpinItem[]) => {
      const total = items.reduce((s, it) => s + it.weight, 0);
      let r = Math.random() * total;
      for (const it of items) {
        r -= it.weight;
        if (r <= 0) return { label: it.label, isSuccess: !!it.isSuccess };
      }
      const last = items[items.length - 1];
      return { label: last.label, isSuccess: !!last.isSuccess };
    };

    const EFFECT_ITEMS: Record<string, WheelSpinItem[]> = {
      "Gambler": GAMBLER_ITEMS,
      "Critical Strike": CRIT_ITEMS,
      "Evasion": EVASION_ITEMS,
      "Cruelty": CRUELTY_ITEMS,
      "Blind": BLIND_ITEMS,
      "Mute": MUTE_ITEMS,
      "Bash": BASH_ITEMS,
      "Luminescence": BASH_ITEMS,
      "Misericorde": MISERICORDE_ITEMS,
      "Golden Parry": [
        { label: "Parry! Block điểm (35%)", weight: 35, isSuccess: true },
        { label: "Không (65%)", weight: 65, isSuccess: false },
      ],
      "Pennyworthy-Win": [
        { label: "+1 bonus (36%)", weight: 36, isSuccess: true },
        { label: "Không (64%)", weight: 64, isSuccess: false },
      ],
      "Pennyworthy-Lose": [
        { label: "+2 stat (36%)", weight: 36, isSuccess: true },
        { label: "Không (64%)", weight: 64, isSuccess: false },
      ],
      "The Sand of Time": SAND_OF_TIME_ITEMS,
      "The Sand of Time-2": SAND_OF_TIME_ITEMS,
      "Ranger-Red": RANGER_RED_ITEMS,
      "Ranger-Blue": RANGER_BLUE_ITEMS,
      "Ranger-Black": RANGER_BLACK_ITEMS,
      "Ranger-Yellow": RANGER_YELLOW_ITEMS,
      "Ranger-Pink": RANGER_PINK_ITEMS,
      "Ranger-Silver": RANGER_SILVER_ITEMS,
    };

    const newResults: Record<string, { label: string; isSuccess: boolean }> = {};

    const allEffectNames = new Set([
      ...p1Effs.onWin, ...p1Effs.onLose, ...p1Effs.onTie,
      ...p2Effs.onWin, ...p2Effs.onLose, ...p2Effs.onTie,
    ]);

    for (const roundIdx of roundsToFill) {
      for (const effName of allEffectNames) {
        for (const side of ["player1", "player2"] as const) {
          const key = `${roundIdx}-${effName}-${side}`;
          if (!roundSpinResults[key] && EFFECT_ITEMS[effName]) {
            newResults[key] = pickResult(EFFECT_ITEMS[effName]);
          }
        }
      }
    }

    if (Object.keys(newResults).length > 0) {
      setRoundSpinResults((prev) => ({ ...prev, ...newResults }));
    }
  }, [skipRoundSpins, pendingSpinsForLastRound, stepRoundIndex, stepState, player1, player2, disabledItems, roundSpinResults, setRoundSpinResults]);

  // Astrologer's Staff: khi spin probability power thành công lần đầu → +1 BIQ cho chủ sở hữu
  // Chạy sau khi roundSpinResults update (sau khi user quay wheel)
  useEffect(() => {
    if (!stepState || !player1 || !player2) return;
    const STAFF_KEY = "astrologer_staff_power_trigger__Astrologer's Staff";
    const COMBAT_POWER_TIMINGS = ["during_combat", "on_round_win", "on_round_lose", "on_round_tie"];

    const checkPlayer = (
      player: typeof player1,
      side: "player1" | "player2",
      firedHandlers: Set<string>,
    ) => {
      if (!player?.character) return;
      if (firedHandlers.has(STAFF_KEY)) return; // đã fire rồi

      const hasStaff = (player.character.weapons || []).some(
        (w: any) =>
          !w.isLost &&
          (typeof w === "string" ? w : (w?.name ?? ""))
            .replace(/\s*\([^)]*\)\s*$/g, "")
            .toLowerCase() === "astrologer's staff" &&
          !disabledItems.has(`${player.no}-weapon-${typeof w === "string" ? w : (w?.name ?? "")}`),
      );
      if (!hasStaff) return;

      // Check từng round đã resolved — có spin probability power nào isSuccess chưa?
      const firedInAnyRound = (player.character.powers || []).some((pw: any) => {
        if (pw.isLost) return false;
        const pwName = typeof pw === "string" ? pw : (pw?.name ?? "");
        if (disabledItems.has(`${player.no}-power-${pwName}`)) return false;
        const pwFx = EffectRegistry.get("power", pwName);
        if (!pwFx) return false;
        const hasProbEffect = pwFx.effects.some((eff: any) =>
          COMBAT_POWER_TIMINGS.includes(eff.timing) &&
          (eff.conditions || []).some((c: any) => c.type === "probability"),
        );
        if (!hasProbEffect) return false;
        // Check spin result ở bất kỳ round nào đã có
        return Object.entries(roundSpinResults).some(([key, val]) => {
          // key format: "${roundIndex}-${pwName}-${side}"
          return key.endsWith(`-${pwName}-${side}`) && val.isSuccess === true;
        });
      });
      if (!firedInAnyRound) return;

      // Fire AS Staff: patch stepState
      setStepState((prev) => {
        if (!prev) return prev;
        const newFired = new Set(side === "player1" ? prev.p1FiredHandlers : prev.p2FiredHandlers);
        if (newFired.has(STAFF_KEY)) return prev; // double-check race condition
        newFired.add(STAFF_KEY);
        const statKey = side === "player1" ? "p1Stats" : "p2Stats";
        const firedKey = side === "player1" ? "p1FiredHandlers" : "p2FiredHandlers";
        return {
          ...prev,
          [statKey]: { ...prev[statKey], biq: (prev[statKey].biq || 0) + 1 },
          [firedKey]: newFired,
        };
      });
    };

    checkPlayer(player1, "player1", stepState.p1FiredHandlers);
    checkPlayer(player2, "player2", stepState.p2FiredHandlers);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundSpinResults]);

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

  // Combat 3D effect triggers — fire briefly after each round resolves
  const [p1EffectKey, setP1EffectKey] = useState(0);
  const [p2EffectKey, setP2EffectKey] = useState(0);
  const [p1Boost, setP1Boost] = useState(false);
  const [p1Debuff, setP1Debuff] = useState(false);
  const [p2Boost, setP2Boost] = useState(false);
  const [p2Debuff, setP2Debuff] = useState(false);
  const [critActive, setCritActive] = useState(false);
  const [p1Bubbles, setP1Bubbles] = useState<StatBubble[]>([]);
  const [p2Bubbles, setP2Bubbles] = useState<StatBubble[]>([]);

  // Helper: spawn floating bubbles — accumulate, each auto-removes after 3s
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
        // Auto-remove after animation duration (3s)
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

  // Wheel mode: winner từ vòng quay, cleared sau khi resolveNextRound consume
  const [wheelForcedWinner, setWheelForcedWinner] = useState<
    "player1" | "player2" | null
  >(null);

  const { resolveNextRound } = useResolveNextRound({
    player1,
    player2,
    stepState,
    stepRoundIndex,
    disabledItems,
    allPlayers,
    isTournamentMode,
    roundtableSubMode,
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

  // Khi wheel spin xong và wheelForcedWinner được set → auto-call resolveNextRound
  // (wheelForcedWinner đã được truyền vào hook qua params, đảm bảo hook dùng giá trị mới nhất)
  useEffect(() => {
    if (!wheelForcedWinner) return;
    resolveNextRoundRef.current?.();
    setWheelForcedWinner(null);
  }, [wheelForcedWinner]);

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

  // Which round log is currently shown (null = always follow latest)
  const [viewLogIndex, setViewLogIndex] = useState<number | null>(null);
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

  // Auto-advance log view to latest round when new round resolves
  useEffect(() => {
    if (lastRoundLog && stepState && lastRoundLog.roundIndex >= 0) {
      const idx = stepState.roundLogs.length - 1;
      setViewLogIndex(idx);
    }
  }, [lastRoundLog]);

  // Re-trigger finalize khi spin xong ở round MA (Cruelty, Crit, Evasion pending)
  useEffect(() => {
    if (!pendingFinalizeStateRef.current || !player1 || !player2) return;
    const savedState = pendingFinalizeStateRef.current;
    const lastRoundLogMA = [...savedState.roundLogs]
      .reverse()
      .find((l) => l.roundIndex === 5);
    if (!lastRoundLogMA) return;
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
    if (p1PtsMA.pending || p2PtsMA.pending) return;
    pendingFinalizeStateRef.current = null;
    const p1BaseMA = p1PtsMA.autoApplied
      ? p1PtsMA.pts
      : wMA === "player1"
        ? 1
        : 0;
    const p2BaseMA = p2PtsMA.autoApplied
      ? p2PtsMA.pts
      : wMA === "player2"
        ? 1
        : 0;
    let p1Score = savedState.p1Score + (p1PtsMA.pts - p1BaseMA);
    let p2Score = savedState.p2Score + (p2PtsMA.pts - p2BaseMA);

    // Apply before_combat_end effects (Edgelord, 4 Hit Combo, v.v.) — bị skip khi pendingMA=true
    const bceNotifications: { player: "player1" | "player2"; sourceName: string; description: string }[] = [];
    // forcedLoser: nếu set, player đó thua bất kể score (autoLose từ Egoist, v.v.)
    let forcedLoser: "player1" | "player2" | null = null;
    const applyBCE = (player: PvPPlayerData, playerSide: "player1" | "player2") => {
      if (!player.character) return;
      const fxBCE = EffectResolver.calculateCharacterEffects(player.character, { isPvE: false });
      for (const ce of fxBCE.combatEffects) {
        if (ce.isActive === false) continue;
        if (ce.effect?.timing !== "before_combat_end" && ce.effect?.timing !== "after_combat") continue;
        if (ce.effect?.type !== "custom" || !ce.effect?.customHandler) continue;
        const srcName = ce.source?.name || "?";
        const srcType = ce.source?.type || "?";
        if (disabledItems.has(`${player.no}-${srcType}-${srcName}`)) continue;
        const selfScore = playerSide === "player1" ? p1Score : p2Score;
        const oppScore = playerSide === "player1" ? p2Score : p1Score;
        const bceCtx: any = {
          self: {
            character: player.character,
            stats: playerSide === "player1" ? savedState.p1Stats : savedState.p2Stats,
            baseStats: player.baseStats,
            race: player.character?.race?.race || player.race || "",
            raceTier: player.raceTier,
            roundsWon: savedState.resolvedRounds.filter((r) => r.winner === playerSide).length,
            roundsLost: savedState.resolvedRounds.filter((r) => r.winner !== playerSide && r.winner !== "tie").length,
            currentScore: selfScore,
            roundResults: Object.fromEntries(
              savedState.resolvedRounds.map((r) => [
                r.stat,
                r.winner === playerSide ? "win" : r.winner === "tie" ? "tie" : "lose",
              ])
            ),
          },
          opponent: {
            character: (playerSide === "player1" ? player2 : player1)?.character,
            currentScore: oppScore,
          },
          isFinals: false,
          isPvE: false,
        };
        const bceResult = HandlerRegistry.executeCombat(ce.effect.customHandler as string, bceCtx);
        if (!bceResult) continue;
        if (bceResult.description) {
          bceNotifications.push({ player: playerSide, sourceName: srcName, description: bceResult.description });
        }
        if (bceResult.skipDefault) continue;
        if (bceResult.selfPoints) {
          if (playerSide === "player1") p1Score += bceResult.selfPoints;
          else p2Score += bceResult.selfPoints;
        }
        if (bceResult.opponentPoints) {
          if (playerSide === "player1") p2Score += bceResult.opponentPoints;
          else p1Score += bceResult.opponentPoints;
        }
        // autoLose: override winner trực tiếp, không đụng score
        if (bceResult.autoLose) {
          forcedLoser = playerSide;
        }
        // autoWin: override winner trực tiếp, không đụng score
        if (bceResult.autoWin && forcedLoser !== playerSide) {
          forcedLoser = playerSide === "player1" ? "player2" : "player1";
        }
      }
    };
    applyBCE(player1, "player1");
    applyBCE(player2, "player2");

    let overallWinner: "player1" | "player2";
    let tieBreaker: "race" | null = null;
    if (forcedLoser !== null) {
      // autoLose/autoWin override — winner là đối thủ của người bị thua buộc
      overallWinner = forcedLoser === "player1" ? "player2" : "player1";
    } else if (p1Score > p2Score) overallWinner = "player1";
    else if (p2Score > p1Score) overallWinner = "player2";
    else {
      tieBreaker = "race";
      overallWinner =
        player1.raceTier < player2.raceTier ? "player1" : "player2";
    }
    const finalResult: CombatResult = {
      rounds: savedState.resolvedRounds,
      player1Score: p1Score,
      player2Score: p2Score,
      startPlayer1Score: savedState.startP1Score,
      startPlayer2Score: savedState.startP2Score,
      winner: overallWinner,
      tieBreaker,
    };
    setStepState({ ...savedState, p1Score, p2Score });
    setStepRoundIndex(6);
    checkAndSetRoundtableHold(finalResult);
    setCombatResult(finalResult);
    // Gọi buildAfterCombat được lưu từ khi Cruelty pending, với score đúng sau spin
    if (pendingCrueltyAfterCombatRef.current) {
      pendingCrueltyAfterCombatRef.current(overallWinner, p1Score, p2Score);
      pendingCrueltyAfterCombatRef.current = null;
    }
    // Prepend BCE notifications (Edgelord, v.v.) vào afterCombatEntries
    if (bceNotifications.length > 0) {
      setAfterCombatEntries((prev) => [
        ...bceNotifications.map((n) => ({
          player: n.player,
          quirkName: n.sourceName,
          description: n.description,
        })),
        ...(prev || []),
      ]);
    }
  }, [roundSpinResults]);

  if (loading) {
    return <ArenaLoadingScreen />;
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

      {/* Combat intro screen */}
      {showIntro && player1 && player2 && (
        <CombatIntroScreen
          player1Name={player1.name}
          player1No={player1.no}
          player2Name={player2.name}
          player2No={player2.no}
          volume={masterVolume * introVolume}
          onComplete={() => {
            setShowIntro(false);
            startCombat();
          }}
        />
      )}

      {/* Combat outro screen */}
      {showOutro && player1 && player2 && effectiveWinner && (
        <CombatOutroScreen
          winnerName={
            effectiveWinner === "player1" ? player1.name : player2.name
          }
          winnerNo={effectiveWinner === "player1" ? player1.no : player2.no}
          loserName={
            effectiveWinner === "player1" ? player2.name : player1.name
          }
          loserNo={effectiveWinner === "player1" ? player2.no : player1.no}
          winnerSide={effectiveWinner}
          onComplete={doConfirmCombat}
        />
      )}

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
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2 shrink-0"
          >
            <span>←</span> Back
          </button>
          <div className="flex-1 px-5 py-3 rounded-none border border-gray-600/50 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-red-900/20">
            <h1 className="text-xl font-bold text-white">
              {isTournamentMode
                ? (tournamentMatch!.displayLabel ??
                  `Match #${tournamentMatch!.matchNumber}`)
                : "PvP Stats Comparison"}
            </h1>
            {isTournamentMode && player1 && player2 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {player1.name} vs {player2.name}
              </p>
            )}
          </div>
        </div>

        {/* 3-column layout: left sidebar | center | right sidebar */}
        <div className="max-w-[1400px] mx-auto flex gap-3 px-2 items-start">
          {/* ── LEFT SIDEBAR: Player 1 ── */}
          <PlayerSidebar
            player={player1}
            otherPlayer={player2}
            accent="blue"
            audioResetKey={audioResetKey}
            combatResult={combatResult}
            masterVolume={masterVolume}
            bgmVolume={bgmVolume}
            isTournamentMode={isTournamentMode}
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

          {/* ── CENTER: Battle area ── */}
          <div className="flex-1 min-w-0">
            {/* ── JRPG Battle Scene ── */}
            <div
              className="relative rounded-none border border-gray-600/40 mb-3 overflow-hidden"
              style={{
                background:
                  "linear-gradient(180deg, #0a0f1e 0%, #0d1525 50%, #0a0e1a 100%)",
                boxShadow:
                  "0 0 40px rgba(59,130,246,0.06), 0 0 40px rgba(239,68,68,0.06) inset",
              }}
            >
              {/* Scanline overlay for retro feel */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)",
                  zIndex: 0,
                }}
              />

              {/* Round indicator banner */}
              {stepState && stepRoundIndex >= 0 && (
                <div className="relative z-10 flex justify-center pt-2 pb-1">
                  <div className="px-4 py-0.5 rounded-full bg-purple-900/50 border border-purple-500/30 text-purple-300 text-[11px] font-bold tracking-widest uppercase">
                    ⚔ Round {stepRoundIndex + 1} / 6
                  </div>
                </div>
              )}

              <div className="relative z-10 p-3">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
                  {/* P1 card with 3D frame */}
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
                    <div
                      className="rounded-none border-2 border-dashed border-blue-600/20 flex items-center justify-center min-h-[140px]"
                      style={{ background: "rgba(15,23,42,0.6)" }}
                    >
                      <span className="text-blue-900/60 text-sm font-bold">
                        PLAYER 1
                      </span>
                    </div>
                  )}

                  {/* ── VS / Score Center ── */}
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
                      {/* Score display */}
                      <div className="text-center mb-1">
                        <div
                          className="font-black tracking-tight leading-none"
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
                          <span className="text-gray-600 mx-1 text-2xl">:</span>
                          <span
                            className="text-red-400"
                            style={{ textShadow: "0 0 16px #ef4444" }}
                          >
                            {battleDone ? effectiveScores.s2 : liveScore.s2}
                          </span>
                        </div>
                      </div>

                      {/* Status label */}
                      {battleDone ? (
                        <>
                          {pendingSpins && (
                            <div className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse font-bold">
                              ● Còn spin
                            </div>
                          )}
                          {!pendingSpins &&
                            combatResult!.tieBreaker &&
                            effectiveScores.s1 === effectiveScores.s2 && (
                              <div className="text-[9px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">
                                RACE TIER
                              </div>
                            )}
                          {!isPendingRoundtable && mainWinner && (
                            <div
                              className={`text-[11px] font-black mt-1 px-3 py-1 rounded-none border tracking-wide ${
                                effectiveWinner === "player1"
                                  ? "text-blue-300 bg-blue-500/10 border-blue-500/30"
                                  : "text-red-300 bg-red-500/10 border-red-500/30"
                              }`}
                              style={{
                                textShadow: `0 0 10px ${effectiveWinner === "player1" ? "#3b82f6" : "#ef4444"}`,
                              }}
                            >
                              {mainWinner.name}
                              <br />
                              <span className="text-yellow-400 text-[10px]">
                                WINS ★
                              </span>
                            </div>
                          )}
                          {isPendingRoundtable && (
                            <div className="text-[10px] font-bold mt-1 px-2 py-0.5 rounded-none text-yellow-300 bg-yellow-500/10 border border-yellow-500/30">
                              ⏳ PENDING
                            </div>
                          )}
                        </>
                      ) : !stepState ? (
                        <div className="text-[10px] text-gray-600 font-bold tracking-widest mt-1">
                          VS
                        </div>
                      ) : null}
                    </div>
                  </ScoreDisplay3D>

                  {/* P2 card with 3D frame */}
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
                    <div
                      className="rounded-none border-2 border-dashed border-red-600/20 flex items-center justify-center min-h-[140px]"
                      style={{ background: "rgba(15,23,42,0.6)" }}
                    >
                      <span className="text-red-900/60 text-sm font-bold">
                        PLAYER 2
                      </span>
                    </div>
                  )}
                </div>

                {/* Swap + BGM button row */}
                {player1 && player2 && (
                  <div className="mt-2 flex justify-center items-center gap-2">
                    {!isTournamentMode && !roundtableSubMode && (
                      <button
                        onClick={swapPlayers}
                        disabled={stepInProgress}
                        className="px-3 py-1 rounded-none text-gray-500 hover:text-gray-200 hover:bg-gray-800/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all text-xs border border-gray-700/40 hover:border-purple-500/40"
                      >
                        ⇄ Swap
                      </button>
                    )}
                    {detectCombatAudioTracks(player1.character, undefined, player1.no).length === 0 &&
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
                )}
              </div>
            </div>

            {/* Combat Effects Panel (before/during/after) */}
            {player1 && player2 && (
              <div className="mb-3">
                <CombatEffectsPanel
                  player1={{ name: player1.name, character: player1.character, no: player1.no }}
                  player2={{ name: player2.name, character: player2.character, no: player2.no }}
                  disabledItems={disabledItems}
                  player1ComputedStats={p1DisplayStats ?? undefined}
                  player2ComputedStats={p2DisplayStats ?? undefined}
                  resetKey={roundtableSubMode ? "sub" : "main"}
                  combatResult={
                    battleDone && combatConfirmed && effectiveWinner
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
                  onPendingPreCombatChange={setPendingPreCombatCount}
                />
              </div>
            )}

            {/* Round results / pre-battle stat comparison */}
            {player1 && player2 && (
              <div
                className="rounded-none border border-gray-700/40 p-3 mb-3 overflow-hidden"
                style={{
                  background:
                    "linear-gradient(160deg, #0c1220 0%, #0f172a 100%)",
                }}
              >
                {combatResult || stepState ? (
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
                    onDebugRound={handleDebugRound}
                  />
                ) : (
                  /* Pre-battle: JRPG stat comparison bars */
                  <div className="space-y-1">
                    {/* Header */}
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
                          {/* P1 bar (right-aligned) */}
                          <div className="flex items-center gap-1.5 justify-end">
                            <span
                              className={`text-sm font-black w-6 text-right ${p1Higher ? "text-blue-300" : "text-gray-500"}`}
                            >
                              {v1}
                            </span>
                            <div className="flex-1 max-w-[80px] bg-gray-800/60 rounded-full h-2 overflow-hidden flex justify-end">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${p1Higher ? "bg-gradient-to-l from-blue-500 to-blue-400" : "bg-gray-600/60"}`}
                                style={{ width: `${(v1 / maxVal) * 100}%` }}
                              />
                            </div>
                          </div>
                          {/* Stat label */}
                          <div
                            className={`text-center text-[10px] font-black tracking-wider py-0.5 rounded ${p1Higher === p2Higher ? "text-gray-500" : p1Higher ? "text-blue-500/60" : "text-red-500/60"}`}
                          >
                            {label}
                          </div>
                          {/* P2 bar (left-aligned) */}
                          <div className="flex items-center gap-1.5 justify-start">
                            <div className="flex-1 max-w-[80px] bg-gray-800/60 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${p2Higher ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gray-600/60"}`}
                                style={{ width: `${(v2 / maxVal) * 100}%` }}
                              />
                            </div>
                            <span
                              className={`text-sm font-black w-6 ${p2Higher ? "text-red-300" : "text-gray-500"}`}
                            >
                              {v2}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Round Log Box */}
                {(() => {
                  const logs = stepState?.roundLogs ?? [];
                  if (logs.length === 0) return null;
                  const viewIdx = Math.min(
                    viewLogIndex ?? logs.length - 1,
                    logs.length - 1,
                  );
                  const log = logs[viewIdx];
                  // Tính adjusted score tại round này:
                  // - round chưa patch (round cuối = stepRoundIndex-1): log.p1Score là base, cần cộng diff từ spin
                  // - round đã patch (round cũ hơn): log.p1Score đã bao gồm spin adj, không cộng thêm
                  let displayP1Score = log.p1Score;
                  let displayP2Score = log.p2Score;
                  const latestUnpatchedRoundIdx = stepRoundIndex - 1;
                  if (
                    log.roundIndex >= 0 &&
                    log.roundIndex === latestUnpatchedRoundIdx &&
                    player1 &&
                    player2
                  ) {
                    const p1EffsLog = getPerRoundEffects(
                      player1.character,
                      player1.no,
                    );
                    const p2EffsLog = getPerRoundEffects(
                      player2.character,
                      player2.no,
                    );
                    const p1PtsLog = computeRoundPoints(
                      "player1",
                      log.winner,
                      log.roundIndex,
                      p1EffsLog,
                      log.statKey,
                    );
                    const p2PtsLog = computeRoundPoints(
                      "player2",
                      log.winner,
                      log.roundIndex,
                      p2EffsLog,
                      log.statKey,
                    );
                    const p1BaseLog = p1PtsLog.autoApplied
                      ? p1PtsLog.pts
                      : log.winner === "player1"
                        ? 1
                        : 0;
                    const p2BaseLog = p2PtsLog.autoApplied
                      ? p2PtsLog.pts
                      : log.winner === "player2"
                        ? 1
                        : 0;
                    if (!p1PtsLog.pending)
                      displayP1Score += p1PtsLog.pts - p1BaseLog;
                    if (!p2PtsLog.pending)
                      displayP2Score += p2PtsLog.pts - p2BaseLog;
                  }
                  const borderColor =
                    log.winner === "player1"
                      ? "rgba(59,130,246,0.3)"
                      : log.winner === "player2"
                        ? "rgba(239,68,68,0.3)"
                        : "rgba(234,179,8,0.3)";
                  return (
                    <div
                      className="mt-2 rounded-none border overflow-hidden text-xs"
                      style={{ background: "rgba(0,0,0,0.4)", borderColor }}
                    >
                      {/* Navigation header */}
                      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-800/60">
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
                      {/* Round content */}
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
                              <span className="text-gray-600 text-[9px]">
                                vs
                              </span>
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
                            className={`pl-2 border-l-2 text-[11px] ${
                              ev.type === "stat_boost"
                                ? "border-green-500/50 text-green-400"
                                : ev.type === "stat_debuff"
                                  ? "border-red-500/50 text-red-400"
                                  : ev.type === "carry_over"
                                    ? "border-amber-500/50 text-amber-400"
                                    : ev.type === "point_change"
                                      ? "border-blue-500/50 text-blue-300"
                                      : "border-gray-600/50 text-gray-400"
                            }`}
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
                              {displayP1Score}
                            </span>{" "}
                            :{" "}
                            <span className="text-red-400 font-bold">
                              {displayP2Score}
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
              </div>
            )}

            {/* Roundtable Hold Sub-Combat Mode Banner */}
            {roundtableSubMode && roundtableSnapshot && (
              <div className="bg-orange-900/40 border border-orange-500/60 rounded-none p-3 mb-3">
                <div className="text-orange-300 font-bold text-sm mb-1 flex items-center gap-2">
                  <span>⚔️</span> TRẬN PHỤ — Roundtable Hold
                </div>
                <div className="text-orange-200/80 text-xs mb-2">
                  <strong>{roundtableSnapshot.selectedTarnished?.name}</strong>{" "}
                  thách đấu{" "}
                  <strong>
                    {roundtableSnapshot.pendingLoser === "player1"
                      ? roundtableSnapshot.player1?.name
                      : roundtableSnapshot.player2?.name}
                  </strong>{" "}
                  (người vừa thắng trận chính). Kết quả trận này sẽ quyết định
                  ai tiến vào vòng tiếp theo.
                </div>
                {combatResult && combatConfirmed && effectiveWinner && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-orange-300/70 font-semibold">
                      Kết quả trận phụ:
                    </div>
                    <div
                      className={`text-sm font-bold px-3 py-2 rounded-none border ${
                        effectiveWinner === "player1"
                          ? "text-green-300 bg-green-900/30 border-green-500/40"
                          : "text-red-300 bg-red-900/30 border-red-500/40"
                      }`}
                    >
                      {effectiveWinner === "player1"
                        ? `Tarnished (${player1?.name}) THẮNG → ${roundtableSnapshot.pendingLoser === "player1" ? roundtableSnapshot.player1?.name : roundtableSnapshot.player2?.name} được cứu!`
                        : `Tarnished (${player1?.name}) THUA → ${roundtableSnapshot.pendingLoser === "player1" ? roundtableSnapshot.player1?.name : roundtableSnapshot.player2?.name} vẫn bị loại.`}
                    </div>
                    <button
                      onClick={() =>
                        confirmRoundtableSubCombat({
                          ...combatResult,
                          winner: effectiveWinner,
                        })
                      }
                      className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-sm rounded-none border border-green-500/50 transition-all"
                    >
                      Xác nhận & Quay về trận chính
                    </button>
                  </div>
                )}
                {!combatConfirmed && (
                  <div className="text-xs text-orange-300/60 italic">
                    Chạy combat bình thường và xác nhận kết quả bên trên để quay
                    về trận chính.
                  </div>
                )}
              </div>
            )}

            {/* Before-combat-end entries (e.g. Edgelord) — hiển thị trước Roundtable Hold */}
            {battleDone &&
              afterCombatEntries.some((e) => e.quirkName === "Edgelord") && (
                <div className="space-y-1 mb-3">
                  {afterCombatEntries
                    .filter((e) => e.quirkName === "Edgelord")
                    .map((entry, i) => (
                      <div
                        key={`edgelord-pre-${i}`}
                        className={`text-xs px-3 py-1.5 rounded-none border ${
                          entry.player === "player1"
                            ? "bg-blue-900/20 border-blue-500/30 text-blue-200"
                            : "bg-red-900/20 border-red-500/30 text-red-200"
                        }`}
                      >
                        <span className="font-bold text-purple-300">
                          Edgelord
                        </span>{" "}
                        — {entry.description}
                      </div>
                    ))}
                </div>
              )}

            {/* Roundtable Hold Pending Banner */}
            {!roundtableSubMode &&
              battleDone &&
              isPendingRoundtable &&
              pendingLoser && (
                <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-none p-4 mb-3">
                  <div className="text-yellow-400 font-bold text-base mb-1 flex items-center gap-2">
                    <span>⏳</span> KẾT QUẢ TẠM HOÃN — Roundtable Hold kích hoạt
                  </div>
                  <div className="text-yellow-300/80 text-sm mb-3">
                    <strong>
                      {pendingLoser === "player1"
                        ? player1?.name
                        : player2?.name}
                    </strong>{" "}
                    thua nhưng có Roundtable Hold. Chọn một Tarnished còn sống
                    lên đấu trận phụ.
                  </div>

                  {!selectedTarnished ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-400">
                          {tarnishedList.length} Tarnished còn hoạt động:
                        </div>
                        <button
                          onClick={() => {
                            const colors = [
                              "#f59e0b",
                              "#10b981",
                              "#3b82f6",
                              "#a855f7",
                              "#ef4444",
                              "#06b6d4",
                              "#84cc16",
                              "#ec4899",
                            ];
                            setPreCombatModal({
                              isOpen: true,
                              title: "Roundtable Hold — Quay chọn Tarnished",
                              description:
                                "Quay ngẫu nhiên để chọn Tarnished tham chiến trận phụ",
                              items: tarnishedList.map((p, i) => ({
                                label: `${p.name} (#${p.no})`,
                                weight: 1,
                                isSuccess: true,
                                color: colors[i % colors.length],
                                meta: { playerNo: p.no },
                              })),
                              side: (pendingLoser ?? "player1") as
                                | "player1"
                                | "player2",
                              effectKey: "roundtable-tarnished-spin",
                              onResult: (result) => {
                                const no = result.meta?.playerNo as number;
                                const chosen = tarnishedList.find(
                                  (p) => p.no === no,
                                );
                                if (chosen) setSelectedTarnished(chosen);
                              },
                            });
                          }}
                          className="px-3 py-1 bg-yellow-700/50 hover:bg-yellow-600/60 border border-yellow-500/50 rounded-none text-yellow-200 text-xs font-bold transition-colors"
                        >
                          🎡 Quay ngẫu nhiên
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Tìm Tarnished..."
                        value={tarnishedSearchTerm}
                        onChange={(e) => setTarnishedSearchTerm(e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-800 border border-yellow-600/40 rounded-none text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 mb-2"
                      />
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {filteredTarnished.map((p) => (
                          <button
                            key={p.no}
                            onClick={() => setSelectedTarnished(p)}
                            className="w-full px-3 py-2 text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-yellow-500/50 rounded-none text-white text-sm flex justify-between items-center transition-all"
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
                              <RoundResultsPanel
                                rounds={subCombatResult.rounds}
                                revealedUpTo={null}
                                p1char={selectedTarnished.character}
                                p2char={mainWinner?.character}
                                player1={player1}
                                player2={player2}
                                disabledItems={disabledItems}
                                roundSpinResults={roundSpinResults}
                                getPerRoundEffects={getPerRoundEffects}
                                computeRoundPoints={computeRoundPoints}
                                applyDevWeights={applyDevWeights}
                                setRoundSpinModal={setRoundSpinModal}
                              />
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
                                  <div className="mt-2 text-green-400 font-bold text-sm bg-green-900/30 border border-green-500/40 rounded-none px-3 py-2">
                                    Tarnished thắng →{" "}
                                    <strong>
                                      {pendingLoser === "player1"
                                        ? player1?.name
                                        : player2?.name}
                                    </strong>{" "}
                                    được cứu!
                                  </div>
                                ) : (
                                  <div className="mt-2 text-red-400 font-bold text-sm bg-red-900/30 border border-red-500/40 rounded-none px-3 py-2">
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
                                  className="mt-3 px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs rounded-none border border-green-500 font-bold transition-colors"
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
                          onClick={() => {
                            if (!combatResult) return;
                            const mainWinnerP =
                              combatResult.winner === "player1"
                                ? player1!
                                : player2!;
                            startRoundtableSubCombat(
                              selectedTarnished,
                              mainWinnerP,
                              combatResult,
                              pendingLoser!,
                              tarnishedList,
                            );
                          }}
                          className="w-full px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold text-sm rounded-none transition-all"
                        >
                          ⚔️ Chạy Trận Phụ (Full PvP)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

            {/* Roundtable Hold sub-combat result (after snapshot restored) */}
            {!roundtableSubMode &&
              subCombatResult &&
              selectedTarnished &&
              !isPendingRoundtable && (
                <div className="bg-gray-900/60 border border-orange-600/40 rounded-none p-3 mb-3">
                  <div className="text-orange-300 font-bold text-xs mb-2">
                    Kết quả trận phụ Roundtable Hold:{" "}
                    <span className="text-yellow-300">
                      {selectedTarnished.name}
                    </span>
                  </div>
                  <RoundResultsPanel
                    rounds={subCombatResult.rounds}
                    revealedUpTo={null}
                    p1char={selectedTarnished.character}
                    player1={player1}
                    player2={player2}
                    disabledItems={disabledItems}
                    roundSpinResults={roundSpinResults}
                    getPerRoundEffects={getPerRoundEffects}
                    computeRoundPoints={computeRoundPoints}
                    applyDevWeights={applyDevWeights}
                    setRoundSpinModal={setRoundSpinModal}
                  />
                  <div className="mt-2 text-center text-sm font-bold">
                    <span className="text-blue-400">
                      {subCombatResult.player1Score}
                    </span>
                    <span className="text-gray-500 mx-2">:</span>
                    <span className="text-red-400">
                      {subCombatResult.player2Score}
                    </span>
                  </div>
                  <div
                    className={`mt-2 text-xs font-bold text-center px-3 py-1.5 rounded-none border ${
                      subCombatResult.winner === "player1"
                        ? "text-green-300 bg-green-900/30 border-green-500/40"
                        : "text-red-300 bg-red-900/30 border-red-500/40"
                    }`}
                  >
                    {subCombatResult.winner === "player1"
                      ? `Tarnished (${selectedTarnished.name}) thắng → Người thua được cứu`
                      : `Tarnished (${selectedTarnished.name}) thua → Kết quả trận chính giữ nguyên`}
                  </div>
                </div>
              )}

            {/* After-combat quirk effects */}
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

            {/* Tiebreaker wheel — cùng race + điểm bằng nhau */}
            {battleDone &&
              !combatConfirmed &&
              (() => {
                if (!player1 || !player2) return null;
                const { s1, s2 } = effectiveScores;
                if (s1 !== s2) return null;
                const p1Race = (player1.character as any)?.race?.race || "";
                const p2Race = (player2.character as any)?.race?.race || "";
                if (
                  !p1Race ||
                  !p2Race ||
                  p1Race.toLowerCase() !== p2Race.toLowerCase()
                )
                  return null;
                return (
                  <div className="mt-3 bg-yellow-900/20 rounded-none border border-yellow-500/40 p-3">
                    <div className="text-sm font-bold text-yellow-300 mb-2">
                      ⚔ Tiebreaker — Cùng race ({p1Race}), điểm bằng nhau
                    </div>
                    {tiebreakerWheelResult ? (
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 font-bold">
                          →{" "}
                          {tiebreakerWheelResult === "player1"
                            ? player1.name
                            : player2.name}{" "}
                          thắng
                        </span>
                        <button
                          onClick={() => setTiebreakerWheelResult(null)}
                          className="text-[10px] px-1.5 py-0.5 rounded border border-gray-500/40 text-gray-400 hover:text-gray-200 hover:border-gray-400/60 transition-colors"
                        >
                          Hoàn tác
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setPreCombatModal({
                            isOpen: true,
                            title: "Tiebreaker",
                            description: `${p1Race} vs ${p1Race} — Quay 50/50 xác định người thắng`,
                            items: [
                              {
                                label: player1.name,
                                weight: 1,
                                isSuccess: true,
                                color: "#3b82f6",
                              },
                              {
                                label: player2.name,
                                weight: 1,
                                isSuccess: true,
                                color: "#ef4444",
                              },
                            ],
                            side: "player1",
                            effectKey: "tiebreaker-race",
                            onResult: (result) => {
                              setTiebreakerWheelResult(
                                result.label === player1.name
                                  ? "player1"
                                  : "player2",
                              );
                            },
                          });
                        }}
                        className="px-4 py-2 bg-yellow-600/40 hover:bg-yellow-600/60 text-yellow-200 font-bold rounded-none text-sm border border-yellow-500/40 transition-colors"
                      >
                        🎯 Quay Tiebreaker
                      </button>
                    )}
                  </div>
                );
              })()}

            {/* Action buttons */}
            <div className="flex justify-center gap-3 flex-wrap">
              {/* Not started */}
              {!stepState && !combatResult && player1 && player2 && (
                <div className="flex flex-col items-center gap-2">
                  {pendingPreCombatCount > 0 && (
                    <div className="text-[10px] text-amber-400 animate-pulse font-bold">
                      ● Xử lý {pendingPreCombatCount} wheel trước combat đã
                    </div>
                  )}
                  <div className="relative flex items-center gap-2">
                    <button
                      onClick={handleStartWithIntro}
                      disabled={pendingPreCombatCount > 0}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-none text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all"
                    >
                      ⚔ Bắt đầu
                    </button>
                    {/* Settings toggle */}
                    <button
                      onClick={() => setShowSettings((s) => !s)}
                      className="p-2 rounded-none bg-gray-700/60 hover:bg-gray-600/80 text-gray-300 hover:text-white transition-colors text-sm"
                      title="Cài đặt"
                    >
                      ⚙
                    </button>

                    {/* Settings panel — absolute để không đẩy layout */}
                    {showSettings && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900/95 border border-gray-600/50 rounded-none p-4 w-72 space-y-3 text-sm shadow-2xl z-50">
                        {/* Master volume */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Âm lượng tổng</span>
                            <span className="tabular-nums text-white">
                              {Math.round(masterVolume * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={masterVolume}
                            onChange={(e) =>
                              setMasterVolume(Number(e.target.value))
                            }
                            className="w-full h-1.5 cursor-pointer rounded-full accent-purple-500"
                          />
                        </div>

                        {/* BGM volume */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Âm lượng nhạc nền</span>
                            <span className="tabular-nums text-white">
                              {Math.round(bgmVolume * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={bgmVolume}
                            onChange={(e) =>
                              setBgmVolume(Number(e.target.value))
                            }
                            className="w-full h-1.5 cursor-pointer rounded-full accent-blue-500"
                          />
                        </div>

                        {/* Intro volume */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Âm lượng intro</span>
                            <span className="tabular-nums text-white">
                              {Math.round(introVolume * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={introVolume}
                            onChange={(e) =>
                              setIntroVolume(Number(e.target.value))
                            }
                            className="w-full h-1.5 cursor-pointer rounded-full accent-cyan-500"
                          />
                        </div>

                        {/* Intro toggle */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-700/50">
                          <span className="text-xs text-gray-400">Intro</span>
                          <button
                            onClick={() => setIntroEnabled((v) => !v)}
                            className={`relative w-10 h-5 rounded-full transition-colors ${introEnabled ? "bg-purple-600" : "bg-gray-600"}`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${introEnabled ? "translate-x-5" : "translate-x-0"}`}
                            />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Tournament: manual winner select + trigger after-combat */}
              {isTournamentMode &&
                !combatConfirmed &&
                player1 &&
                player2 && (
                  <div className="flex flex-col gap-1.5 items-center">
                    <div className="text-[10px] text-gray-500 font-mono">Chọn thắng thủ công</div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          const fakeCombat: CombatResult = {
                            rounds: [],
                            player1Score: 0,
                            player2Score: 0,
                            startPlayer1Score: 0,
                            startPlayer2Score: 0,
                            winner: "player1",
                          };
                          setCombatResult(fakeCombat);
                          handleConfirmCombat();
                        }}
                        className="px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-none text-xs border border-blue-500/30 transition-colors"
                      >
                        {player1.name} Win
                      </button>
                      <button
                        onClick={() => {
                          const fakeCombat: CombatResult = {
                            rounds: [],
                            player1Score: 0,
                            player2Score: 0,
                            startPlayer1Score: 0,
                            startPlayer2Score: 0,
                            winner: "player2",
                          };
                          setCombatResult(fakeCombat);
                          handleConfirmCombat();
                        }}
                        className="px-3 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded-none text-xs border border-red-500/30 transition-colors"
                      >
                        {player2.name} Win
                      </button>
                    </div>
                  </div>
                )}
              {/* Step through rounds — Next Round button */}
              {stepInProgress && player1 && player2 && (
                <div className="flex flex-col items-center gap-1">
                  {pendingSpinsForLastRound && (
                    <div className="text-[10px] text-amber-400 animate-pulse font-bold">
                      ● Xử lý spin round trước đã
                    </div>
                  )}
                  <button
                    onClick={() => resolveNextRoundRef.current?.()}
                    disabled={pendingSpinsForLastRound}
                    className={`px-6 py-2.5 font-bold rounded-none text-sm transition-all shadow-lg ${
                      pendingSpinsForLastRound
                        ? "bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/40"
                        : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white shadow-yellow-500/20"
                    }`}
                  >
                    {pendingSpinsForLastRound ? "⏳ Đang xử lý..." : `Next Round (${STAT_ORDER[stepRoundIndex]?.label ?? ""})`}
                  </button>
                </div>
              )}
              {/* BattleWheelSpinner đã chuyển sang WheelOfTruthMode */}
              {/* All rounds done — confirm result (after optional spins) */}
              {battleDone && !combatConfirmed && (
                <button
                  onClick={handleConfirmCombat}
                  disabled={pendingSpins}
                  className={`px-6 py-2.5 font-bold rounded-none text-sm transition-all shadow-lg ${
                    pendingSpins
                      ? "bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/40"
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-green-500/20 hover:shadow-green-500/40"
                  }`}
                  title={
                    pendingSpins
                      ? "Quay hết các hiệu ứng trước"
                      : "Xác nhận kết quả"
                  }
                >
                  {pendingSpins ? "⏳ Còn hiệu ứng chờ quay..." : "✓ Kết thúc"}
                </button>
              )}
              {/* Re-battle (only after confirmed, not in roundtable sub-mode) */}
              {combatConfirmed && !roundtableSubMode && (
                <button
                  onClick={resetCombat}
                  className="px-4 py-2 bg-gray-700/60 hover:bg-gray-600/60 text-gray-300 rounded-none text-xs border border-gray-600/50 transition-colors"
                >
                  ↺ Re-battle
                </button>
              )}
              {/* Next Match — chỉ trong tournament mode, sau khi combat confirmed */}
              {combatConfirmed &&
                isTournamentMode &&
                onNextMatch &&
                effectiveWinner && (
                  <button
                    onClick={() => {
                      onNextMatch({
                        winnerNo:
                          effectiveWinner === "player1"
                            ? (player1?.no ?? 0)
                            : (player2?.no ?? 0),
                        score: combatResult
                          ? `${combatResult.player1Score}-${combatResult.player2Score}`
                          : null,
                        specialEvent: tournamentSpecialEvent || null,
                        note: tournamentNote || null,
                      });
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-none text-xs shadow-lg shadow-violet-500/20 transition-all"
                  >
                    Next Match ▶
                  </button>
                )}
            </div>

            {/* Tournament: Special Event / Note / Save */}
            {isTournamentMode && (
              <div className="mt-3 bg-gray-800/60 rounded-none border border-yellow-600/30 p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">
                      Special Event
                    </label>
                    <input
                      type="text"
                      value={tournamentSpecialEvent}
                      onChange={(e) =>
                        setTournamentSpecialEvent(e.target.value)
                      }
                      placeholder="e.g. Instant Kill..."
                      className="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1.5 text-xs focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">
                      Note
                    </label>
                    <input
                      type="text"
                      value={tournamentNote}
                      onChange={(e) => setTournamentNote(e.target.value)}
                      placeholder="Additional notes..."
                      className="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1.5 text-xs focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                </div>
                {combatConfirmed &&
                  effectiveWinner &&
                  player1 &&
                  player2 &&
                  !roundtableSubMode && (
                    <button
                      onClick={() => {
                        const winner =
                          effectiveWinner === "player1" ? player1 : player2;
                        const score = tournamentSpecialEvent
                          ? null
                          : `${effectiveScores.s1}-${effectiveScores.s2}`;
                        onSaveTournamentResult?.({
                          winnerNo: winner.no,
                          score,
                          specialEvent: tournamentSpecialEvent || null,
                          note: tournamentNote || null,
                        });
                      }}
                      className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-none text-sm transition-all"
                    >
                      💾 Lưu kết quả{" "}
                      {tournamentMatch!.displayLabel ??
                        `Match #${tournamentMatch!.matchNumber}`}
                    </button>
                  )}
              </div>
            )}

            {/* Rules Info */}
            <div className="mt-4 bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-none p-3 text-center">
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

          {/* Pre-combat / after-combat wheel modal (Raumanian, One Trick Pony, Night Owl, Open-minded) */}
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

          {/* Creator's Cat modal */}
          <CreatorsCatModal
            player1={player1}
            player2={player2}
            setPlayer1={setPlayer1}
            setPlayer2={setPlayer2}
            creatorsCatModal={creatorsCatModal}
            setCreatorsCatModal={setCreatorsCatModal}
            setSummoningScrollResult={setSummoningScrollResult}
            setPreCombatModal={setPreCombatModal}
            spawnStatBubbles={spawnStatBubbles}
          />

          {/* ── RIGHT SIDEBAR: Player 2 ── */}
          <PlayerSidebar
            player={player2}
            otherPlayer={player1}
            accent="red"
            audioResetKey={audioResetKey}
            combatResult={combatResult}
            masterVolume={masterVolume}
            bgmVolume={bgmVolume}
            isTournamentMode={isTournamentMode}
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
      {/* end relative content wrapper */}

      {/* Dev Mode: Panel */}
      {devMode && (
        <DevWheelPanel
          pos={devPanelPos}
          onPosChange={setDevPanelPos}
          overrides={devWeightOverrides}
          onOverrideChange={(effect, idx, val) =>
            setDevWeightOverrides(
              (prev: Record<string, Record<number, number>>) => ({
                ...prev,
                [effect]: { ...(prev[effect] || {}), [idx]: val },
              }),
            )
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
            setSearchTerm1(p1.name);
            setPlayer2(p2);
            setSearchTerm2(p2.name);
            resetCombat();
          }}
          skipRoundSpins={skipRoundSpins}
          onSkipRoundSpinsChange={setSkipRoundSpins}
        />
      )}

      {/* Floating stat bubbles — fixed overlay, float trên toàn màn hình */}
      <FloatingStatBubblesOverlay p1Bubbles={p1Bubbles} p2Bubbles={p2Bubbles} />
    </div>
  );
};
