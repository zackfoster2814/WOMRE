import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Character, CharacterStats } from "../types/character";
// CharacterParser used via playerParsing.ts (imported below)
import { Condition, EffectResolver } from "../effects/resolver";
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
  RoundResult,
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
import {
  STAT_ORDER,
  _ALL_STAT_KEYS,
  playEndCombatSound,
} from "../constants/battleZone";
import {
  applyStatDelta,
  calcStatsWithDisabled,
  getPerRoundEffects as getPerRoundEffectsFn,
  normalizeStatKey,
  resolveStatTargets,
} from "../utils/combatStats";
import { FloatingStatBubblesOverlay } from "../components/combat/FloatingStatBubblesOverlay";
import { SCPlayerCard } from "../components/combat/SCPlayerCard";
import { DevWheelPanel } from "../components/combat/DevWheelPanel";
import {
  RoundResultsPanel,
  type DebugRoundPatch,
} from "../components/combat/RoundResultsPanel";
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
  const allCharacters = useMemo(
    () => allPlayers.map((p) => p.character).filter((c): c is NonNullable<typeof c> => !!c),
    [allPlayers],
  );
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
  // Tiebreaker BGM
  const tiebreakerAudioRef = useRef<HTMLAudioElement | null>(null);
  const [tiebreakerBGMPlaying, setTiebreakerBGMPlaying] = useState(false);
  useEffect(() => {
    tiebreakerAudioRef.current = new Audio("/assets/combatSFX/tiebreak.mp3");
    tiebreakerAudioRef.current.loop = true;
    return () => { tiebreakerAudioRef.current?.pause(); };
  }, []);
  const toggleTiebreakerBGM = () => {
    if (!tiebreakerAudioRef.current) return;
    if (tiebreakerBGMPlaying) {
      tiebreakerAudioRef.current.pause();
    } else {
      tiebreakerAudioRef.current.play();
    }
    setTiebreakerBGMPlaying((p) => !p);
  };

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
  // Log combat pending — được ghi Drive khi GM confirm
  const pendingCombatLogRef = useRef<{ sep: string; body: string } | null>(null);

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
  // ── DELETED_BODY_START ────────────────────────────────────────────────────────
  const _DELETED = (
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
        events.push({
          player: "player1",
          source: co.source,
          description: `+${co.value} ${key.toUpperCase()} (từ round trước)`,
          type: "carry_over",
        });
      }
    }
    for (const co of state.p2CarryOver) {
      if (co.stat === key) {
        p2Val += co.value;
        events.push({
          player: "player2",
          source: co.source,
          description: `+${co.value} ${key.toUpperCase()} (từ round trước)`,
          type: "carry_over",
        });
      }
    }

    // Bash / Luminescence: apply debuff -3 random stat từ spin round trước (trước khi tính round này)
    if (roundIndex > 0) {
      const prevRoundWinner =
        state.resolvedRounds[state.resolvedRounds.length - 1]?.winner;
      const applyBashDebuffEarly = (
        winnerSide: "player1" | "player2",
        sourceName: string,
      ) => {
        const oppSide: "player1" | "player2" =
          winnerSide === "player1" ? "player2" : "player1";
        const spinKey = `${roundIndex - 1}-${sourceName}-${winnerSide}`;
        const spinResult = roundSpinResults[spinKey];
        if (!spinResult?.isSuccess) return;
        const alreadyApplied = events.some(
          (ev) =>
            ev.player === oppSide &&
            ev.source === sourceName &&
            ev.type === "stat_debuff",
        );
        if (alreadyApplied) return;
        // Uno Reverse Card: nếu oppSide có URC → redirect debuff về winnerSide
        const oppPlayer = oppSide === "player1" ? p1 : p2;
        const oppHasURC =
          (oppPlayer.character?.powers || []).some(
            (pw: any) =>
              !pw.isLost &&
              (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
                "uno reverse card",
          ) && !disabledItems.has(`${oppPlayer.no}-power-Uno Reverse Card`);
        const actualTarget: "player1" | "player2" = oppHasURC
          ? winnerSide
          : oppSide;
        // Bash debuff -3 vào stat của round kế (p1Val/p2Val), random stat chỉ để log
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
        if (p1EffBash.onWin.includes("Bash"))
          applyBashDebuffEarly("player1", "Bash");
        if (p1EffBash.onWin.includes("Luminescence"))
          applyBashDebuffEarly("player1", "Luminescence");
      }
      if (prevRoundWinner === "player2") {
        if (p2EffBash.onWin.includes("Bash"))
          applyBashDebuffEarly("player2", "Bash");
        if (p2EffBash.onWin.includes("Luminescence"))
          applyBashDebuffEarly("player2", "Luminescence");
      }
    }

    // Morningstar: log event ở round 0 (stats đã được apply vào p1BaseStats/p2BaseStats trong startCombat)
    if (roundIndex === 0) {
      const weaponEntries = EffectRegistry.getAllByType("weapon");
      const getCleanWeaponName = (w: any) =>
        (typeof w === "string" ? w : (w?.name ?? ""))
          .replace(/\s*\(.*?\)/g, "")
          .trim();
      const hasPhysicalWeapon = (char: any) =>
        (char?.weapons || []).some((w: any) => {
          if (w?.isLost) return false;
          const wName = getCleanWeaponName(w);
          if (!wName) return false;
          const entry = weaponEntries.find(
            (e) => e.name.toLowerCase() === wName.toLowerCase(),
          );
          return entry?.tags?.includes("physical") ?? false;
        });
      const p1HasMorningstar =
        (p1.character?.weapons || []).some(
          (w: any) =>
            !w?.isLost && getCleanWeaponName(w).toLowerCase() === "morningstar",
        ) && !disabledItems.has(`${p1.no}-weapon-Morningstar`);
      const p2HasMorningstar =
        (p2.character?.weapons || []).some(
          (w: any) =>
            !w?.isLost && getCleanWeaponName(w).toLowerCase() === "morningstar",
        ) && !disabledItems.has(`${p2.no}-weapon-Morningstar`);
      if (p1HasMorningstar && hasPhysicalWeapon(p2.character))
        events.push({
          player: "player1",
          source: "Morningstar",
          description: "+2 STR (Morningstar — đối thủ dùng vũ khí Physical)",
          type: "stat_boost",
        });
      if (p2HasMorningstar && hasPhysicalWeapon(p1.character))
        events.push({
          player: "player2",
          source: "Morningstar",
          description: "+2 STR (Morningstar — đối thủ dùng vũ khí Physical)",
          type: "stat_boost",
        });
    }

    // Dothraki: log active rule at round 0 (stats already swapped/boosted in startCombat)
    if (roundIndex === 0) {
      const logDothraki = (
        dSide: "player1" | "player2",
        rule: DothrakiRule,
      ) => {
        if (rule === null) return;
        const oppSide = dSide === "player1" ? "player2" : "player1";
        const RULE_DESC: Record<
          number,
          { player: "player1" | "player2"; desc: string }
        > = {
          1: {
            player: oppSide,
            desc: "Luật 1: Đã đảo stats đối thủ (STR↔MA, SPD↔BIQ, DUR↔IQ)",
          },
          2: { player: dSide, desc: "Luật 2: Đã đảo STR↔BIQ của Dothraki" },
          3: { player: dSide, desc: "Luật 3: Đã đảo SPD↔IQ của Dothraki" },
          4: { player: dSide, desc: "Luật 4: Đã đảo DUR↔MA của Dothraki" },
          5: {
            player: dSide,
            desc: "Luật 5: Dothraki +4 all stats, đối thủ +3 điểm khởi đầu (đã tính)",
          },
          6: {
            player: oppSide,
            desc: "Luật 6: Đối thủ +5 all stats (đã tính). Dothraki +1 all per điểm sau trận [GM Note]",
          },
        };
        const entry = RULE_DESC[rule];
        if (entry)
          events.push({
            player: entry.player,
            source: "Dothraki",
            description: entry.desc,
            type: "stat_boost",
          });
      };
      logDothraki("player1", state.p1DothrakiRule);
      logDothraki("player2", state.p2DothrakiRule);
    }

    // Check auto_lose_round effects (e.g. Glass Cannon always loses DUR round)
    const checkAutoLose = (
      player: PvPPlayerData,
      playerSide: "player1" | "player2",
    ) => {
      const fx = EffectResolver.calculateCharacterEffects(player.character!, {
        isPvE: false,
      });
      for (const ce of fx.combatEffects) {
        if (ce.isActive === false) continue;
        if (ce.effect?.type !== "auto_lose_round") continue;
        if (ce.effect?.timing !== "during_combat") continue;
        const autoLoseStat = normalizeStatKey((ce.effect as any).stat || "");
        if (autoLoseStat !== key) continue;
        // Check disabled
        const srcName = ce.source?.name || "?";
        const srcType = ce.source?.type || "?";
        if (disabledItems.has(`${player.no}-${srcType}-${srcName}`)) continue;
        // Force this player to lose the round by setting their value to -999
        if (playerSide === "player1") p1Val = -999;
        else p2Val = -999;
        events.push({
          player: playerSide,
          source: srcName,
          description: `Auto-thua round ${key.toUpperCase()} (${srcName})`,
          type: "stat_debuff",
        });
      }
    };
    if (p1.character) checkAutoLose(p1, "player1");
    if (p2.character) checkAutoLose(p2, "player2");

    // Promised Consort: add highest base stat of a Lover to the current round stat
    const applyPromisedConsort = (
      player: PvPPlayerData,
      playerSide: "player1" | "player2",
    ) => {
      const archetypes: string[] = (player.character as any)?.archetypes || [];
      if (!archetypes.some((a) => a === "Promised Consort")) return;
      const lovers: any[] = player.character?.lover || [];
      const activeLovers = lovers.filter((l: any) => !l.isLost);
      if (activeLovers.length === 0) return;
      // Prefer Femboy lover
      const STAT_KEYS_SHORT = [
        "str",
        "spd",
        "dur",
        "iq",
        "biq",
        "ma",
      ] as (keyof CharacterStats)[];
      const chooseLover = (loverList: any[]) => {
        const femboy = loverList.find((l: any) => {
          const n = typeof l === "string" ? l : (l?.name ?? "");
          return allPlayers
            .find((p) => p.name === n)
            ?.character?.archetypes?.includes("Femboy");
        });
        return femboy || loverList[0];
      };
      const chosen = chooseLover(activeLovers);
      const loverName =
        typeof chosen === "string" ? chosen : (chosen?.name ?? "");
      const loverPlayer = allPlayers.find((p) => p.name === loverName);
      if (!loverPlayer) return;
      const loverStats = loverPlayer.baseStats || loverPlayer.stats;
      const highest = Math.max(
        ...STAT_KEYS_SHORT.map((k) => loverStats[k] || 0),
      );
      if (playerSide === "player1") p1Val += highest;
      else p2Val += highest;
      events.push({
        player: playerSide,
        source: "Promised Consort",
        description: `+${highest} từ Base Stat cao nhất của "${loverName}" (Promised Consort)`,
        type: "stat_boost",
      });
    };
    if (p1.character) applyPromisedConsort(p1, "player1");
    if (p2.character) applyPromisedConsort(p2, "player2");

    // Instruments of the Sirens: during_combat debuff -1 all stats → áp vào val ngay round 0
    // (during_combat debuffs trong processPlayer chỉ modify newStats cho round sau)
    if (roundIndex === 0) {
      const applyIoSDebuff = (
        attacker: PvPPlayerData,
        attackerSide: "player1" | "player2",
      ) => {
        const weapons: any[] = (attacker.character?.weapons || []).filter(
          (w: any) => !w?.isLost,
        );
        const hasIoS = weapons.some((w: any) =>
          (typeof w === "string" ? w : (w?.name ?? ""))
            .toLowerCase()
            .startsWith("instruments of the sirens"),
        );
        if (!hasIoS) return;
        if (
          disabledItems.has(`${attacker.no}-weapon-Instruments of the Sirens`)
        )
          return;
        const oppSide = attackerSide === "player1" ? "player2" : "player1";
        if (oppSide === "player1") p1Val -= 1;
        else p2Val -= 1;
        events.push({
          player: oppSide,
          source: "Instruments of the Sirens",
          description: `-1 All Stats round này (Instruments of the Sirens)`,
          type: "stat_debuff",
        });
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

    // One Trick Pony: check if winner has OTP and override base points
    const p1HasOTP = (p1.character?.quirks || [])
      .filter((q: any) => !q.isLost)
      .some((q: any) => q.name.toLowerCase() === "one trick pony");
    const p2HasOTP = (p2.character?.quirks || [])
      .filter((q: any) => !q.isLost)
      .some((q: any) => q.name.toLowerCase() === "one trick pony");
    const p1OTPStat = otpStats["player1"]; // short key e.g. "str"
    const p2OTPStat = otpStats["player2"];

    // Hunter's Mark: stat đã chọn từ wheel (short key e.g. "str")
    const p1HasHM = (p1.character?.powers || [])
      .filter((pw: any) => !pw.isLost)
      .some(
        (pw: any) =>
          (typeof pw === "string" ? pw : pw.name)?.toLowerCase() ===
          "hunter's mark",
      );
    const p2HasHM = (p2.character?.powers || [])
      .filter((pw: any) => !pw.isLost)
      .some(
        (pw: any) =>
          (typeof pw === "string" ? pw : pw.name)?.toLowerCase() ===
          "hunter's mark",
      );
    // hmStats stores label e.g. "Strength" — normalize to short key for comparison
    const HM_LABEL_TO_KEY: Record<string, string> = {
      Strength: "str",
      Speed: "spd",
      Durability: "dur",
      IQ: "iq",
      BIQ: "biq",
      MA: "ma",
      strength: "str",
      speed: "spd",
      durability: "dur",
    };
    const p1HMStat = HM_LABEL_TO_KEY[hmStats["player1"]] ?? hmStats["player1"];
    const p2HMStat = HM_LABEL_TO_KEY[hmStats["player2"]] ?? hmStats["player2"];

    // key là short key của round (str/spd/dur/iq/biq/ma)
    const roundStatLabel = key;

    // Base point: winner gets +1, but OTP overrides
    let p1Points: number;
    let p2Points: number;
    let p1ResetScore = false; // Bloodthirsty lose_points_on_lose
    let p2ResetScore = false;
    if (winner === "player1") {
      if (p1HasOTP) {
        p1Points = p1OTPStat ? (p1OTPStat === roundStatLabel ? 3 : 0) : 1; // 1 if wheel not spun yet (pending)
      } else {
        p1Points = 1;
      }
      p2Points = 0;
    } else if (winner === "player2") {
      p1Points = 0;
      if (p2HasOTP) {
        p2Points = p2OTPStat ? (p2OTPStat === roundStatLabel ? 3 : 0) : 1;
      } else {
        p2Points = 1;
      }
    } else {
      p1Points = 0;
      p2Points = 0;
    }

    // Hunter's Mark: thắng đúng round đã chọn → +1 bonus (Spell Flux: +2)
    const p1HasSpellFlux = (p1.character?.powers || []).some(
      (pw: any) =>
        !pw?.isLost &&
        (typeof pw === "string" ? pw : pw.name)
          ?.toLowerCase()
          .startsWith("spell flux"),
    );
    const p2HasSpellFlux = (p2.character?.powers || []).some(
      (pw: any) =>
        !pw?.isLost &&
        (typeof pw === "string" ? pw : pw.name)
          ?.toLowerCase()
          .startsWith("spell flux"),
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
        pointChanges.push({
          player: "player1",
          delta: p1Points,
          reason: `One Trick Pony: Stat được chọn = ${p1OTPStat}. Thắng ${roundStatLabel} → ${p1Points} điểm; các stat khác thắng → 0 điểm`,
        });
      } else {
        pointChanges.push({
          player: "player1",
          delta: p1Points,
          reason: "thắng round",
        });
      }
    } else if (winner === "player2") {
      if (p2HasOTP && p2OTPStat) {
        pointChanges.push({
          player: "player2",
          delta: p2Points,
          reason: `One Trick Pony: Stat được chọn = ${p2OTPStat}. Thắng ${roundStatLabel} → ${p2Points} điểm; các stat khác thắng → 0 điểm`,
        });
      } else {
        pointChanges.push({
          player: "player2",
          delta: p2Points,
          reason: "thắng round",
        });
      }
    }

    // Get number of rounds won/lost so far (before this round)
    const p1WonSoFar = state.resolvedRounds.filter(
      (r) => r.winner === "player1",
    ).length;
    const p1LostSoFar = state.resolvedRounds.filter(
      (r) => r.winner === "player2",
    ).length;
    const p2WonSoFar = p1LostSoFar;
    const p2LostSoFar = p1WonSoFar;

    // Borrowed Time: nếu player thua đúng 2 round trước → block điểm đối thủ round này (1 lần/combat)
    const hasBorrowedTimeP1 =
      (p1.character?.powers || [])
        .filter((pw: any) => !pw.isLost)
        .some(
          (pw: any) =>
            (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
            "borrowed time",
        ) && !disabledItems.has(`${p1.no}-power-Borrowed Time`);
    const hasBorrowedTimeP2 =
      (p2.character?.powers || [])
        .filter((pw: any) => !pw.isLost)
        .some(
          (pw: any) =>
            (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
            "borrowed time",
        ) && !disabledItems.has(`${p2.no}-power-Borrowed Time`);
    const p1BorrowedTimeFired = state.p1FiredHandlers.has("borrowed_time");
    const p2BorrowedTimeFired = state.p2FiredHandlers.has("borrowed_time");

    // p1 có Borrowed Time, thua đúng 2 round → block điểm p2 round này
    if (
      hasBorrowedTimeP1 &&
      !p1BorrowedTimeFired &&
      p1LostSoFar === 2 &&
      winner === "player2"
    ) {
      p2Points = 0;
      // Ghi đè pointChange của p2
      const idx = pointChanges.findIndex((pc) => pc.player === "player2");
      if (idx !== -1)
        pointChanges[idx] = {
          player: "player2",
          delta: 0,
          reason: "Borrowed Time: bị chặn điểm",
        };
      events.push({
        player: "player1",
        source: "Borrowed Time",
        description:
          "Borrowed Time: Đã thua 2 round — đối thủ không nhận điểm round này!",
        type: "stat_boost",
      });
      state.p1FiredHandlers.add("borrowed_time");
    }
    // p2 có Borrowed Time, thua đúng 2 round → block điểm p1 round này
    if (
      hasBorrowedTimeP2 &&
      !p2BorrowedTimeFired &&
      p2LostSoFar === 2 &&
      winner === "player1"
    ) {
      p1Points = 0;
      const idx = pointChanges.findIndex((pc) => pc.player === "player1");
      if (idx !== -1)
        pointChanges[idx] = {
          player: "player1",
          delta: 0,
          reason: "Borrowed Time: bị chặn điểm",
        };
      events.push({
        player: "player2",
        source: "Borrowed Time",
        description:
          "Borrowed Time: Đã thua 2 round — đối thủ không nhận điểm round này!",
        type: "stat_boost",
      });
      state.p2FiredHandlers.add("borrowed_time");
    }

    // Build handler context helper
    const buildCtx = (isSelf: boolean) => ({
      self: {
        character: isSelf ? p1.character : p2.character,
        stats: isSelf ? state.p1Stats : state.p2Stats,
        baseStats: isSelf ? p1.baseStats : p2.baseStats,
        race: isSelf
          ? p1.character?.race?.race || p1.race
          : p2.character?.race?.race || p2.race,
        raceTier: isSelf ? p1.raceTier : p2.raceTier,
        bracket: isSelf
          ? p1.character?.tournament?.bracket || "winner"
          : p2.character?.tournament?.bracket || "winner",
        pvpWins: isSelf
          ? p1.character?.tournament?.pvpWins || 0
          : p2.character?.tournament?.pvpWins || 0,
        hasLover: isSelf
          ? (p1.character?.lover || []).filter((l: any) => !l.isLost).length > 0
          : (p2.character?.lover || []).filter((l: any) => !l.isLost).length >
            0,
        powers: isSelf
          ? (p1.character?.powers || [])
              .filter((p: any) => !p.isLost)
              .map((p: any) => (typeof p === "string" ? p : p.name))
          : (p2.character?.powers || [])
              .filter((p: any) => !p.isLost)
              .map((p: any) => (typeof p === "string" ? p : p.name)),
        quirks: isSelf
          ? (p1.character?.quirks || [])
              .filter((q: any) => !q.isLost)
              .map((q: any) => q.name)
          : (p2.character?.quirks || [])
              .filter((q: any) => !q.isLost)
              .map((q: any) => q.name),
        weapons: isSelf
          ? p1.character?.weapons || []
          : p2.character?.weapons || [],
        charDevs: isSelf
          ? (p1.character?.charDevs || [])
              .filter((cd: any) => !cd.isLost)
              .map((cd: any) => cd.name)
          : (p2.character?.charDevs || [])
              .filter((cd: any) => !cd.isLost)
              .map((cd: any) => cd.name),
        gears: isSelf
          ? [
              ...(p1.character?.gear?.normalGear || []),
              ...(p1.character?.gear?.legacyGear || []),
            ].map((g: any) => g.name)
          : [
              ...(p2.character?.gear?.normalGear || []),
              ...(p2.character?.gear?.legacyGear || []),
            ].map((g: any) => g.name),
        roundsWon: isSelf ? p1WonSoFar : p2WonSoFar,
        roundsLost: isSelf ? p1LostSoFar : p2LostSoFar,
      },
      opponent: {
        character: isSelf ? p2.character : p1.character,
        stats: isSelf ? state.p2Stats : state.p1Stats,
        baseStats: isSelf ? p2.baseStats : p1.baseStats,
        race: isSelf
          ? p2.character?.race?.race || p2.race
          : p1.character?.race?.race || p1.race,
        raceTier: isSelf ? p2.raceTier : p1.raceTier,
        hasLover: isSelf
          ? (p2.character?.lover || []).filter((l: any) => !l.isLost).length > 0
          : (p1.character?.lover || []).filter((l: any) => !l.isLost).length >
            0,
        powers: isSelf
          ? (p2.character?.powers || [])
              .filter((p: any) => !p.isLost)
              .map((p: any) => (typeof p === "string" ? p : p.name))
          : (p1.character?.powers || [])
              .filter((p: any) => !p.isLost)
              .map((p: any) => (typeof p === "string" ? p : p.name)),
        quirks: isSelf
          ? (p2.character?.quirks || [])
              .filter((q: any) => !q.isLost)
              .map((q: any) => q.name)
          : (p1.character?.quirks || [])
              .filter((q: any) => !q.isLost)
              .map((q: any) => q.name),
        weapons: isSelf
          ? p2.character?.weapons || []
          : p1.character?.weapons || [],
        gears: isSelf
          ? [
              ...(p2.character?.gear?.normalGear || []),
              ...(p2.character?.gear?.legacyGear || []),
            ].map((g: any) => g.name)
          : [
              ...(p1.character?.gear?.normalGear || []),
              ...(p1.character?.gear?.legacyGear || []),
            ].map((g: any) => g.name),
      },
      isFinals: false,
      isPvE: false,
      currentRound: roundIndex,
      currentRoundStat: key, // short key: str/spd/dur/iq/biq/ma
      currentRoundResult:
        winner === "tie"
          ? "tie"
          : winner === (isSelf ? "player1" : "player2")
            ? "win"
            : "lose",
      totalRounds: 6,
      roundResults: (() => {
        const longKey: Record<string, string> = {
          str: "strength",
          spd: "speed",
          dur: "durability",
          iq: "iq",
          biq: "biq",
          ma: "ma",
        };
        const toResult = (w: "player1" | "player2" | "tie", self: boolean) =>
          w === (self ? "player1" : "player2")
            ? "win"
            : w === (self ? "player2" : "player1")
              ? "lose"
              : "tie";
        const entries = state.resolvedRounds.map((r) => [
          longKey[r.stat] ?? r.stat,
          toResult(r.winner, isSelf),
        ]);
        // Include current round result so handlers can react immediately
        entries.push([longKey[key] ?? key, toResult(winner, isSelf)]);
        return Object.fromEntries(entries);
      })(),
    });

    // Compute effects (use pre-calculated combatEffects from EffectResolver)
    const newP1Stats = { ...state.p1Stats };
    const newP2Stats = { ...state.p2Stats };

    // Apply carry-over debuffs on non-current-round stats (e.g. Bash -3 random stat)
    for (const co of state.p1CarryOver) {
      if (co.stat !== key) {
        applyStatDelta(newP1Stats, co.stat, co.value);
        events.push({
          player: "player1",
          source: co.source,
          description: `${co.value > 0 ? "+" : ""}${co.value} ${(co.stat as string).toUpperCase()} (carry từ round trước)`,
          type: "carry_over",
        });
      }
    }
    for (const co of state.p2CarryOver) {
      if (co.stat !== key) {
        applyStatDelta(newP2Stats, co.stat, co.value);
        events.push({
          player: "player2",
          source: co.source,
          description: `${co.value > 0 ? "+" : ""}${co.value} ${(co.stat as string).toUpperCase()} (carry từ round trước)`,
          type: "carry_over",
        });
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
      const fx = EffectResolver.calculateCharacterEffects(player.character!, {
        isPvE: false,
      });
      const isWinner = roundWinner === playerSide;
      const isLoser = roundWinner !== playerSide && roundWinner !== "tie";
      let duringPowerActivations = 0; // đếm power during_combat đã kích hoạt (cho Accelerating Sorcery)
      const ctx = buildCtx(isSelf) as any;

      // Fair Duel: nếu bất kỳ ai có Fair Duel active → cả 2 miễn nhiễm debuff từ đối thủ
      const oppPlayer = isSelf ? p2 : p1;
      const selfHasFairDuel =
        (player.character?.powers || [])
          .filter((pw: any) => !pw.isLost)
          .some(
            (pw: any) =>
              (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
              "fair duel",
          ) && !disabledItems.has(`${player.no}-power-Fair Duel`);
      const oppHasFairDuel =
        (oppPlayer.character?.powers || [])
          .filter((pw: any) => !pw.isLost)
          .some(
            (pw: any) =>
              (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
              "fair duel",
          ) && !disabledItems.has(`${oppPlayer.no}-power-Fair Duel`);
      const fairDuelActive = selfHasFairDuel || oppHasFairDuel;

      // Spell Flux: power "Trong Combat" đầu tiên kích hoạt được apply 2 lần
      const hasSpellFlux = (player.character?.powers || []).some(
        (p: any) =>
          (typeof p === "string" ? p : p.name)
            ?.toLowerCase()
            .startsWith("spell flux") && !p.isLost,
      );
      let spellFluxUsed = false; // true sau khi đã double lần đầu

      for (const ce of fx.combatEffects) {
        if (ce.isActive === false) continue;
        const sourceName = ce.source?.name || "?";
        const sourceType = ce.source?.type || "?";
        // Check disabled
        const disabledKey = `${player.no}-${sourceType}-${sourceName}`;
        if (disabledItems.has(disabledKey)) continue;

        const timing = ce.effect?.timing;
        const handlerName = ce.effect?.customHandler;

        // Only process round-level timings here (before_combat is baked into initial stats)
        if (
          ![
            "on_round_win",
            "on_round_lose",
            "on_round_tie",
            "during_combat",
          ].includes(timing || "")
        )
          continue;
        if (timing === "on_round_win" && !isWinner) continue;
        if (timing === "on_round_lose" && !isLoser) continue;
        if (timing === "on_round_tie" && roundWinner !== "tie") continue;
        // before_combat effects are baked into initial p1Stats/p2Stats at startCombat time
        if (timing === "before_combat") continue;

        // Xử lý during_combat / on_round_win / on_round_lose stat_modifier không có customHandler
        if (!handlerName) {
          // extra_point_on_win (Bloodthirsty, v.v.) → handled via computeRoundPoints patch, skip here
          if (ce.effect?.type === "extra_point_on_win") continue;
          // Bloodthirsty: lose_points_on_lose → reset toàn bộ điểm khi thua
          if (ce.effect?.type === "lose_points_on_lose" && isLoser) {
            if (playerSide === "player1") p1ResetScore = true;
            else p2ResetScore = true;
            events.push({
              player: playerSide,
              source: sourceName,
              description: `Thua round → mất toàn bộ điểm tích lũy (${sourceName})`,
              type: "info",
            });
            continue;
          }
          if (
            (timing === "during_combat" ||
              timing === "on_round_win" ||
              timing === "on_round_lose") &&
            (ce.effect?.type === "stat_modifier" ||
              ce.effect?.type === "debuff") &&
            ce.effect.value !== undefined &&
            ce.effect.stat
          ) {
            // during_combat stat_modifier chỉ apply 1 lần duy nhất (round đầu tiên)
            // on_round_win / on_round_lose apply mỗi lần trigger (đúng spec)
            if (timing === "during_combat" && roundIndex !== 0) continue;
            // Extract conditions (some might be defined on the raw effect, some on the source array)
            const conditions: Condition[] = [...(ce.effect.conditions || [])];
            // Look for probability condition in the raw source as well
            if (ce.source?.effects) {
              const srcEffect = ce.source.effects.find(
                (e) =>
                  e.type === ce.effect.type &&
                  e.timing === ce.effect.timing &&
                  JSON.stringify(e.stat) === JSON.stringify(ce.effect.stat),
              );
              if (srcEffect?.conditions) {
                for (const c of srcEffect.conditions) {
                  if (
                    !conditions.some(
                      (existing) =>
                        JSON.stringify(existing) === JSON.stringify(c),
                    )
                  ) {
                    conditions.push(c);
                  }
                }
              }
            }

            // Effects with probability condition must be handled via wheel UI, not auto-applied
            if (conditions.some((c: any) => c.type === "probability")) continue;

            const selfRaceTier = isSelf ? p1.raceTier : p2.raceTier;
            const oppRaceTier = isSelf ? p2.raceTier : p1.raceTier;
            const oppRace =
              (isSelf ? p2.character?.race?.race : p1.character?.race?.race) ||
              "";
            const selfBracket = player.character?.tournament?.bracket || "";

            const conditionMet = conditions.every((cond: any) => {
              if (cond.type === "probability") return true; // Already filtered above, just in case
              if (cond.type === "race_match" && cond.races) {
                return cond.races.some(
                  (r: string) => r.toLowerCase() === oppRace.toLowerCase(),
                );
              }
              if (cond.type === "race_match" && cond.excludeRaces) {
                return !cond.excludeRaces.some(
                  (r: string) => r.toLowerCase() === oppRace.toLowerCase(),
                );
              }
              if (cond.type === "race_tier_compare") {
                if (
                  !cond.tierOperator ||
                  selfRaceTier === undefined ||
                  oppRaceTier === undefined
                )
                  return false;
                if (cond.tierOperator === "<")
                  return selfRaceTier < oppRaceTier;
                if (cond.tierOperator === ">")
                  return selfRaceTier > oppRaceTier;
                if (cond.tierOperator === "=")
                  return selfRaceTier === oppRaceTier;
                return false;
              }
              if (cond.type === "bracket" && cond.bracket) {
                return selfBracket.toLowerCase() === cond.bracket.toLowerCase();
              }
              if (cond.type === "has_item" && cond.itemType && cond.itemName) {
                // cond.checkTarget: "self" = check người sở hữu effect, "opponent" = check đối thủ (default)
                const checkSelf = cond.checkTarget === "self";
                const checkChar = checkSelf
                  ? isSelf
                    ? p1.character
                    : p2.character
                  : isSelf
                    ? p2.character
                    : p1.character;
                if (cond.itemType === "archetype") {
                  const archetypes = (checkChar?.archetypes || []).map(
                    (a: any) =>
                      (typeof a === "string"
                        ? a
                        : (a?.name ?? "")
                      ).toLowerCase(),
                  );
                  return archetypes.includes(cond.itemName.toLowerCase());
                }
                if (cond.itemType === "power") {
                  const powers = (checkChar?.powers || [])
                    .filter((p: any) => !p.isLost)
                    .map((p: any) =>
                      (typeof p === "string"
                        ? p
                        : (p?.name ?? "")
                      ).toLowerCase(),
                    );
                  return powers.includes(cond.itemName.toLowerCase());
                }
              }
              return true;
            });
            if (!conditionMet) continue;

            const isOpponentTarget = ce.effect.target === "opponent";
            const affectedSide = isOpponentTarget
              ? playerSide === "player1"
                ? "player2"
                : "player1"
              : playerSide;
            const currentStats =
              affectedSide === "player1" ? newP1Stats : newP2Stats;
            const statTargets = resolveStatTargets(
              ce.effect.stat,
              currentStats,
            );
            const val = ce.effect.value;
            // Fair Duel: opponent immune to debuffs (negative stat changes targeting them)
            if (isOpponentTarget && val < 0 && fairDuelActive) {
              events.push({
                player: affectedSide,
                source: sourceName,
                description: `Fair Duel: miễn nhiễm debuff từ ${sourceName}`,
                type: "info",
              });
              continue;
            }
            const targetStats =
              affectedSide === "player1" ? newP1Stats : newP2Stats;
            const affectedChar =
              affectedSide === "player1" ? p1.character : p2.character;
            const affectedRace = (affectedChar?.race?.race || "").toLowerCase();
            for (const csKey of statTargets) {
              if (csKey === "iq" && affectedRace === "skeleton") {
                events.push({
                  player: affectedSide,
                  source: sourceName,
                  description: `[Skeleton] IQ không thể thay đổi — bỏ qua ${val >= 0 ? "+" : ""}${val} IQ`,
                  type: "info",
                });
                continue;
              }
              applyStatDelta(targetStats, csKey, val);
            }
            const appliedTargets = statTargets.filter(
              (k) => !(k === "iq" && affectedRace === "skeleton"),
            );
            if (appliedTargets.length > 0) {
              events.push({
                player: affectedSide,
                source: sourceName,
                description: `${val >= 0 ? "+" : ""}${val} ${ce.effect.stat === "all" ? "All" : appliedTargets.map((s) => s.toUpperCase()).join("/")} (${sourceName}${isOpponentTarget ? " → opponent" : ""})`,
                type: val >= 0 ? "stat_boost" : "stat_debuff",
              });
            }
            // Spell Flux: nếu đây là power during_combat stat_modifier/debuff đầu tiên, apply 2 lần
            if (
              hasSpellFlux &&
              !spellFluxUsed &&
              timing === "during_combat" &&
              ce.source?.type === "power"
            ) {
              spellFluxUsed = true;
              events.push({
                player: playerSide,
                source: "Spell Flux",
                description: `[Spell Flux] ${sourceName} kích hoạt 2 lần!`,
                type: "info",
              });
              // Apply lần 2
              for (const csKey of appliedTargets) {
                applyStatDelta(
                  affectedSide === "player1" ? newP1Stats : newP2Stats,
                  csKey,
                  val,
                );
              }
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
        // Divine Smite: +1 điểm khi thắng round MA
        if (handlerName === "divine_smite_ma_round") {
          if (key === "ma" && isWinner) {
            const pts = (ce.effect as any).points ?? 1;
            if (playerSide === "player1") p1Points += pts;
            else p2Points += pts;
            pointChanges.push({
              player: playerSide,
              delta: pts,
              reason: `Divine Smite: thắng round MA → +${pts} điểm`,
            });
            events.push({
              player: playerSide,
              source: sourceName,
              description: `+${pts} điểm (Divine Smite — thắng round MA)`,
              type: "info",
            });
          }
          continue;
        }

        // Blind and Mute are handled via spin wheel, not auto-applied here
        if (
          handlerName === "blind_no_point" ||
          handlerName === "mute_stat_debuff"
        )
          continue;

        // Needle: handled outside processPlayer to ensure p1Points/p2Points are modified correctly
        if (handlerName === "needle_lowest_stat_bonus") {
          continue;
        }

        // Morningstar: handled before round comparison (apply to p1Val/p2Val directly)
        if (handlerName === "morningstar_physical_bonus") continue;
        // Spell Flux handler itself is metadata only — skip execution
        if (handlerName === "spell_flux_double_first_in_combat") continue;
        // Gold Ship is handled via pre-combat wheel, not auto-applied here
        if (handlerName === "gold_ship_coin_flip") continue;
        // One Trick Pony stat selection is handled via pre-combat wheel (oneTrickPonyStat state), not here
        if (handlerName === "one_trick_pony_stat_selection") continue;
        // Hunter's Mark is handled at base-points level (before processPlayer), not here — just log
        if (handlerName === "hunters_mark_random_round") {
          const STAT_KEY_TO_LABEL: Record<string, string> = {
            str: "Strength",
            spd: "Speed",
            dur: "Durability",
            iq: "IQ",
            biq: "BIQ",
            ma: "MA",
          };
          const hmChosen = hmStats[playerSide];
          const hmLabel = hmChosen
            ? (STAT_KEY_TO_LABEL[hmChosen] ?? hmChosen)
            : "?";
          events.push({
            player: playerSide,
            source: sourceName,
            description: `Hunter's Mark: Round được chọn = ${hmLabel}`,
            type: "info",
          });
          continue;
        }
        // Conquerer: chỉ apply +1 all stats 1 lần duy nhất per combat
        if (
          handlerName === "conquerer_speed_win" &&
          (playerSide === "player1" ? newP1ConquerorFired : newP2ConquerorFired)
        )
          continue;
        // King Gnome's Banana: đã được apply trong startCombat → skip round đầu tiên
        if (handlerName === "king_gnome_banana_iq_compare" && roundIndex === 0)
          continue;
        // during_combat handlers tự guard bằng currentRoundStat trong handler
        // FiredHandlers vẫn giữ để phòng các handler không có guard (fallback)
        // Handlers có nhiều effect dùng cùng handlerName (e.g. angling_scheming_str_win) không dùng firedSet
        const MULTI_EFFECT_HANDLERS = [
          "angling_scheming_str_win",
          "the_world_speed_win",
        ];
        if (
          timing === "during_combat" &&
          !MULTI_EFFECT_HANDLERS.includes(handlerName)
        ) {
          const firedSet =
            playerSide === "player1" ? newP1FiredHandlers : newP2FiredHandlers;
          const handlerKey = `${handlerName}__${ce.source?.name ?? sourceName}`;
          if (firedSet.has(handlerKey)) continue;
        }
        // Accelerating Sorcery: patch duringCombatActivations vào ctx trước khi execute
        if (handlerName === "accelerating_sorcery_count") {
          ctx.self.duringCombatActivations = duringPowerActivations;
        }
        // Skip handlers that require spin wheel (probability condition) — they are handled via UI spin buttons
        {
          const effectConditions2 = (ce.effect as any).conditions || [];
          if (effectConditions2.some((c: any) => c.type === "probability"))
            continue;
        }
        const result = HandlerRegistry.executeCombat(handlerName, ctx);
        if (!result || result.skipDefault) continue;

        // Mark handler đã fired thành công (chống stack nếu handler không có currentRoundStat guard)
        if (
          timing === "during_combat" &&
          !MULTI_EFFECT_HANDLERS.includes(handlerName)
        ) {
          const firedSet =
            playerSide === "player1" ? newP1FiredHandlers : newP2FiredHandlers;
          firedSet.add(`${handlerName}__${ce.source?.name ?? sourceName}`);
        }

        // blockOpponentPoint: chặn điểm đối thủ về 0 (không trừ nếu đang 0)
        if ((result as any).blockOpponentPoint) {
          const oppSide = playerSide === "player1" ? "player2" : "player1";
          if (oppSide === "player1" && p1Points > 0) p1Points = 0;
          else if (oppSide === "player2" && p2Points > 0) p2Points = 0;
          if (result.description)
            events.push({
              player: oppSide,
              source: sourceName,
              description: result.description,
              type: "info",
            });
          continue;
        }

        // Accelerating Sorcery: đếm số power during_combat đã kích hoạt (không tính AS)
        if (
          timing === "during_combat" &&
          ce.source?.type === "power" &&
          handlerName !== "accelerating_sorcery_count"
        ) {
          duringPowerActivations++;
        }

        // Spell Flux: nếu đây là power during_combat đầu tiên kích hoạt thành công, apply 2 lần
        const isSpellFluxTarget =
          hasSpellFlux &&
          !spellFluxUsed &&
          timing === "during_combat" &&
          ce.source?.type === "power";
        const applyTimes = isSpellFluxTarget ? 2 : 1;
        if (isSpellFluxTarget) {
          spellFluxUsed = true;
          events.push({
            player: playerSide,
            source: "Spell Flux",
            description: `[Spell Flux] ${sourceName} kích hoạt 2 lần!`,
            type: "info",
          });
        }

        for (let _applyIdx = 0; _applyIdx < applyTimes; _applyIdx++) {
          const isDouble = isSpellFluxTarget && _applyIdx === 1;

          if (result.description && !isDouble) {
            events.push({
              player: playerSide,
              source: sourceName,
              description: result.description,
              type: "info",
            });
          }

          // Stat mods
          if (result.selfStatMods) {
            for (const mod of result.selfStatMods) {
              const csKey = normalizeStatKey(mod.stat);
              // Detect carry-over handlers (Undying Rage, Luminescence — boost the NEXT round)
              const isCarryOver = [
                "undying_rage_boost",
                "luminescence_debuff",
              ].includes(handlerName);
              if (isCarryOver && roundIndex < 5) {
                const nextStatKey = STAT_ORDER[roundIndex + 1].key;
                carryOverToNext.push({
                  player: playerSide,
                  source: sourceName,
                  stat: nextStatKey,
                  value: mod.value,
                  description: `${sourceName}: +${mod.value} ${nextStatKey.toUpperCase()} round kế`,
                });
                events.push({
                  player: playerSide,
                  source: sourceName,
                  description: `→ +${mod.value} ${nextStatKey.toUpperCase()} carry sang round kế`,
                  type: "carry_over",
                });
              } else {
                // Skeleton: IQ cannot change (locked at base value)
                const playerRace = (
                  player.character?.race?.race ||
                  player.race ||
                  ""
                ).toLowerCase();
                if (csKey === "iq" && playerRace === "skeleton") {
                  events.push({
                    player: playerSide,
                    source: sourceName,
                    description: `[Skeleton] IQ không thể thay đổi — bỏ qua ${mod.value >= 0 ? "+" : ""}${mod.value} IQ`,
                    type: "info",
                  });
                } else {
                  // Permanent buff this combat (Tenacity, Conqueror, etc.)
                  applyStatDelta(
                    playerSide === "player1" ? newP1Stats : newP2Stats,
                    csKey,
                    mod.value,
                  );
                  events.push({
                    player: playerSide,
                    source: sourceName,
                    description: `${mod.value >= 0 ? "+" : ""}${mod.value} ${csKey.toUpperCase()} (permanent)`,
                    type: mod.value >= 0 ? "stat_boost" : "stat_debuff",
                  });
                }
              }
            }
          }

          // Opponent stat mods
          if (result.opponentStatMods) {
            for (const mod of result.opponentStatMods) {
              const csKey = normalizeStatKey(mod.stat);
              const oppSide = playerSide === "player1" ? "player2" : "player1";
              const isCarryOver = ["luminescence_debuff"].includes(handlerName);
              if (isCarryOver && roundIndex < 5) {
                const nextStatKey = STAT_ORDER[roundIndex + 1].key;
                carryOverToNext.push({
                  player: oppSide,
                  source: sourceName,
                  stat: nextStatKey,
                  value: mod.value,
                  description: `${sourceName}: ${mod.value} ${nextStatKey.toUpperCase()} round kế (debuff)`,
                });
                events.push({
                  player: oppSide,
                  source: sourceName,
                  description: `→ ${mod.value} ${nextStatKey.toUpperCase()} debuff carry sang round kế`,
                  type: "carry_over",
                });
              } else {
                const oppChar =
                  oppSide === "player1" ? p1.character : p2.character;
                const oppRaceForLock = (
                  oppChar?.race?.race || ""
                ).toLowerCase();
                if (csKey === "iq" && oppRaceForLock === "skeleton") {
                  events.push({
                    player: oppSide,
                    source: sourceName,
                    description: `[Skeleton] IQ không thể thay đổi — bỏ qua ${mod.value >= 0 ? "+" : ""}${mod.value} IQ`,
                    type: "info",
                  });
                } else {
                  applyStatDelta(
                    oppSide === "player1" ? newP1Stats : newP2Stats,
                    csKey,
                    mod.value,
                  );
                  events.push({
                    player: oppSide,
                    source: sourceName,
                    description: `${mod.value >= 0 ? "+" : ""}${mod.value} ${csKey.toUpperCase()} (từ ${playerSide === "player1" ? p1.name : p2.name})`,
                    type: mod.value >= 0 ? "stat_boost" : "stat_debuff",
                  });
                }
              }
            }
          }

          // Points
          if (result.selfPoints) {
            console.log(
              `[PointsFromHandler] R${roundIndex + 1} stat=${key} ${playerSide} handler=${handlerName} sourceName=${sourceName} selfPoints=${result.selfPoints}`,
            );
            if (playerSide === "player1") p1Points += result.selfPoints;
            else p2Points += result.selfPoints;
            pointChanges.push({
              player: playerSide,
              delta: result.selfPoints,
              reason: sourceName,
            });
            events.push({
              player: playerSide,
              source: sourceName,
              description: `${result.selfPoints >= 0 ? "+" : ""}${result.selfPoints} điểm`,
              type: "point_change",
            });
          }
          if (result.opponentPoints) {
            const oppSide = playerSide === "player1" ? "player2" : "player1";
            if (oppSide === "player1") p1Points += result.opponentPoints;
            else p2Points += result.opponentPoints;
            pointChanges.push({
              player: oppSide,
              delta: result.opponentPoints,
              reason: `${sourceName} (từ đối thủ)`,
            });
          }
        } // end applyTimes loop

        // Tenacity one-shot tracking (outside applyTimes — only fires once)
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

    // Needle: thắng round = stat thấp nhất của đối thủ → +2 điểm (xử lý ở outer scope để đảm bảo p1Points/p2Points được modify đúng)
    const applyNeedle = (playerSide: "player1" | "player2") => {
      const player = playerSide === "player1" ? p1 : p2;
      if (!player.character) return;
      const hasNeedle = (player.character.weapons || []).some(
        (w: any) =>
          !w.isLost &&
          (typeof w === "string" ? w : (w?.name ?? ""))
            .toLowerCase()
            .startsWith("needle"),
      );
      if (!hasNeedle) return;
      if (winner !== playerSide) return;
      const oppBaseStats =
        playerSide === "player1" ? p2.baseStats : p1.baseStats;
      const STAT_SHORT: (keyof CharacterStats)[] = [
        "str",
        "spd",
        "dur",
        "iq",
        "biq",
        "ma",
      ];
      let lowestShort: keyof CharacterStats = STAT_SHORT[0];
      let lowestVal = oppBaseStats[STAT_SHORT[0]] || 0;
      for (const s of STAT_SHORT) {
        if ((oppBaseStats[s] || 0) < lowestVal) {
          lowestVal = oppBaseStats[s] || 0;
          lowestShort = s;
        }
      }
      if (key !== lowestShort) return;
      const pts = 2;
      if (playerSide === "player1") p1Points += pts;
      else p2Points += pts;
      pointChanges.push({
        player: playerSide,
        delta: pts,
        reason: `Needle: thắng round ${lowestShort.toUpperCase()} (stat thấp nhất đối thủ) → +${pts} điểm`,
      });
      events.push({
        player: playerSide,
        source: "Needle",
        description: `+${pts} điểm (Needle — thắng round ${lowestShort.toUpperCase()}, stat thấp nhất của đối thủ)`,
        type: "info",
      });
    };
    applyNeedle("player1");
    applyNeedle("player2");

    // One Trick Pony: nếu thắng round nhưng không phải stat đã chọn → clamp về 0 (không nhận bất kỳ điểm nào)
    const p1HasOTPFinal = (p1.character?.quirks || [])
      .filter((q: any) => !q.isLost)
      .some((q: any) => q.name.toLowerCase() === "one trick pony");
    const p2HasOTPFinal = (p2.character?.quirks || [])
      .filter((q: any) => !q.isLost)
      .some((q: any) => q.name.toLowerCase() === "one trick pony");
    if (p1HasOTPFinal && winner === "player1") {
      const chosenStat = otpStats["player1"]; // short key e.g. "str"
      if (chosenStat && chosenStat !== key) {
        p1Points = 0; // sai stat → không nhận điểm dù có bonus
      }
    }
    if (p2HasOTPFinal && winner === "player2") {
      const chosenStat = otpStats["player2"];
      if (chosenStat && chosenStat !== key) {
        p2Points = 0; // sai stat → không nhận điểm dù có bonus
      }
    }

    // Undying Rage (runeword check, carry-over to next stat)
    if (
      p1.character?.runes?.runeword === "Undying Rage" &&
      winner === "player2" &&
      roundIndex < 5
    ) {
      const nextStatKey = STAT_ORDER[roundIndex + 1].key;
      // Only add if not already added via handler
      const alreadyAdded = carryOverToNext.some(
        (co) => co.player === "player1" && co.source === "Undying Rage",
      );
      if (!alreadyAdded) {
        carryOverToNext.push({
          player: "player1",
          source: "Undying Rage",
          stat: nextStatKey,
          value: 3,
          description: `Undying Rage: thua round → +3 ${nextStatKey.toUpperCase()} round kế`,
        });
        events.push({
          player: "player1",
          source: "Undying Rage",
          description: `Thua → +3 ${nextStatKey.toUpperCase()} carry sang round kế`,
          type: "carry_over",
        });
      }
    }
    if (
      p2.character?.runes?.runeword === "Undying Rage" &&
      winner === "player1" &&
      roundIndex < 5
    ) {
      const nextStatKey = STAT_ORDER[roundIndex + 1].key;
      const alreadyAdded = carryOverToNext.some(
        (co) => co.player === "player2" && co.source === "Undying Rage",
      );
      if (!alreadyAdded) {
        carryOverToNext.push({
          player: "player2",
          source: "Undying Rage",
          stat: nextStatKey,
          value: 3,
          description: `Undying Rage: thua round → +3 ${nextStatKey.toUpperCase()} round kế`,
        });
        events.push({
          player: "player2",
          source: "Undying Rage",
          description: `Thua → +3 ${nextStatKey.toUpperCase()} carry sang round kế`,
          type: "carry_over",
        });
      }
    }

    // Silver Ranger: 15% gấp đôi chỉ số round tiếp theo khi thắng bất kỳ round
    if (roundIndex < 5) {
      const addSilverRangerCarryOver = (winnerSide: "player1" | "player2") => {
        const key2 = `${roundIndex}-Ranger-Silver-${winnerSide}`;
        const spinResult = roundSpinResults[key2];
        if (!spinResult?.isSuccess) return;
        const alreadyAdded = carryOverToNext.some(
          (co) => co.player === winnerSide && co.source === "Ranger-Silver",
        );
        if (alreadyAdded) return;
        const nextStatKey = STAT_ORDER[roundIndex + 1]
          .key as keyof CharacterStats;
        const winnerStats = winnerSide === "player1" ? newP1Stats : newP2Stats;
        const currentStatValue = (winnerStats[nextStatKey] as number) || 0;
        carryOverToNext.push({
          player: winnerSide,
          source: "Ranger-Silver",
          stat: nextStatKey,
          value: currentStatValue,
          description: `Silver Ranger: gấp đôi ${nextStatKey.toUpperCase()} round kế (+${currentStatValue})`,
        });
        events.push({
          player: winnerSide,
          source: "Ranger-Silver",
          description: `Silver Ranger: +${currentStatValue} ${nextStatKey.toUpperCase()} carry sang round kế (gấp đôi)`,
          type: "carry_over",
        });
      };
      const p1EffsSR = getPerRoundEffects(p1.character, p1.no);
      const p2EffsSR = getPerRoundEffects(p2.character, p2.no);
      if (winner === "player1" && p1EffsSR.onWin.includes("Ranger-Silver"))
        addSilverRangerCarryOver("player1");
      if (winner === "player2" && p2EffsSR.onWin.includes("Ranger-Silver"))
        addSilverRangerCarryOver("player2");
    }

    // Bloodthirsty: nếu thua round → reset điểm về 0 (ghi nhận trước khi cộng điểm round này)
    console.log(
      `[RoundStep] R${roundIndex + 1} stat=${key} winner=${winner}: p1Points=${p1Points} p2Points=${p2Points} | state.p1Score=${state.p1Score} state.p2Score=${state.p2Score} → new p1=${p1ResetScore ? 0 : state.p1Score + p1Points} p2=${p2ResetScore ? 0 : state.p2Score + p2Points}`,
    );
    const newP1Score = p1ResetScore ? 0 : state.p1Score + Math.max(0, p1Points);
    const newP2Score = p2ResetScore ? 0 : state.p2Score + Math.max(0, p2Points);
    if (p1ResetScore)
      pointChanges.push({
        player: "player1",
        delta: -state.p1Score,
        reason: "Bloodthirsty: thua round → mất toàn bộ điểm",
      });
    if (p2ResetScore)
      pointChanges.push({
        player: "player2",
        delta: -state.p2Score,
        reason: "Bloodthirsty: thua round → mất toàn bộ điểm",
      });

    const roundResult: RoundResult = {
      stat: key,
      statLabel: label,
      player1Value: p1Val,
      player2Value: p2Val,
      winner,
    };
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
  void _DELETED;

  // Check and apply Roundtable Hold after combat
  const checkAndSetRoundtableHold = (result: CombatResult): boolean => {
    const loserSide = result.winner === "player1" ? "player2" : "player1";
    const loser = result.winner === "player1" ? player2 : player1;
    const opponent = result.winner === "player1" ? player1 : player2;
    if (!loser || !opponent) return false;

    // Chỉ kích hoạt ở nhánh thua (loser bracket)
    const loserBracket = loser.character?.tournament?.bracket;
    if (loserBracket !== "loser") return false;

    // Không kích hoạt ở chung kết (Grand Final = match 319)
    if (tournamentMatch?.matchNumber === 319) return false;

    const loserHasRT = hasRoundtableHold(loser);
    const opponentHasRT = hasRoundtableHold(opponent);
    if (loserHasRT && !opponentHasRT) {
      // Chỉ gọi người còn sống (status === "alive")
      const tarnished = allPlayers.filter(
        (p) =>
          p.no !== loser.no &&
          hasRoundtableHold(p) &&
          p.character?.tournament?.status === "alive",
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
      luckManipulationResult,
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
    setLuckManipulationResult({});
    setRhittaResult({});
    setMadScientistResult({});
    setSummoningScrollResult({});
    setTricksterResult({});
    setEternalMangekyouResult({});
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
    setLuckManipulationResult(snap.luckManipulationResult || {});
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

    import("../utils/googleDrive").then(({ appendReportToDrive }) => {
      import("../config/googleDrive").then(({ REPORT_FILE_ID }) => {
        const pending = pendingCombatLogRef.current;
        pendingCombatLogRef.current = null;
        const ls: string[] = [];

        // Nếu có log combat từ hook, dùng làm header (bỏ dòng placeholder cuối)
        let baseBody = pending?.body ?? "";
        const placeholderLine = "\n[Chờ GM xác nhận — vòng quay & after-combat sẽ được ghi tiếp]";
        baseBody = baseBody.replace(placeholderLine, "");

        const STAT_LABELS: Record<string, string> = {
          "0": "STR", "1": "SPD", "2": "DUR", "3": "IQ", "4": "BIQ", "5": "MA",
        };

        // Vòng quay trong combat (Crit, Gambler, Golden Parry, Evasion, Ranger...)
        const roundSpinEntries = Object.entries(roundSpinResults);
        if (roundSpinEntries.length > 0) {
          ls.push(`\n[Vòng quay trong combat]`);
          for (const [key, result] of roundSpinEntries) {
            const parts = key.split("-");
            const side = parts[parts.length - 1] as "player1" | "player2";
            const pname = side === "player1" ? p1name : p2name;
            const effectName = parts.slice(1, parts.length - 1).join("-");
            const roundIdx = parts[0];
            const roundLabel = STAT_LABELS[roundIdx] ?? `Round ${Number(roundIdx) + 1}`;
            ls.push(
              `  [${pname}] ${effectName} (${roundLabel}): ${result.label} → ${result.isSuccess ? "✓ Thành công" : "✗ Thất bại"}`,
            );
          }
        }

        // Hiệu ứng sau combat (Edgelord, PvP Reward, Resilient, quirks, after-combat wheels...)
        if (afterCombatEntries.length > 0) {
          ls.push(`\n[Hiệu ứng sau combat]`);
          for (const entry of afterCombatEntries) {
            const pname = entry.player === "player1" ? p1name : p2name;
            if (entry.wheelKey) {
              const spinRes = afterCombatSpinResults[entry.wheelKey];
              const spinText = spinRes
                ? `→ Quay: "${spinRes.label}" (${spinRes.isSuccess ? "✓" : "✗"})`
                : `→ Chưa quay`;
              ls.push(`  [${pname}] ${entry.quirkName}: ${entry.description} ${spinText}`);
            } else {
              ls.push(`  [${pname}] ${entry.quirkName}: ${entry.description}`);
            }
          }
        }

        const line = "═".repeat(60);
        ls.push(`\n${line}`);

        const sep = pending?.sep ?? "";
        const fullContent = sep + baseBody + ls.join("\n") + "\n";
        appendReportToDrive(REPORT_FILE_ID, fullContent).catch(() => {});
      });
    });
  };

  // Debug: patch 1 round (điểm hiển thị và/hoặc chỉ số stat)
  const handleDebugRound = (patch: DebugRoundPatch) => {
    const {
      roundArrayIndex,
      statKey,
      p1Value,
      p2Value,
      p1StatDelta,
      p2StatDelta,
    } = patch;
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
        if (p1StatDelta !== undefined)
          newP1Stats[statKey] = (newP1Stats[statKey] ?? 0) + p1StatDelta;
        if (p2StatDelta !== undefined)
          newP2Stats[statKey] = (newP2Stats[statKey] ?? 0) + p2StatDelta;
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
    setLuckManipulationResult({});
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
    pendingCombatLogRef.current = null;
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
    luckManipulationResult,
    setLuckManipulationResult,
    rhittaResult,
    setRhittaResult,
    madScientistResult,
    setMadScientistResult,
    summoningScrollResult,
    setSummoningScrollResult,
    tricksterResult,
    setTricksterResult,
    eternalMangekyouResult,
    setEternalMangekyouResult,
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
    luckManipulationResult,
    madScientistResult,
    dothrakiSpinResult,
    cursedCoinTarget,
    guidanceStats,
    blackMagicStat,
    eternalMangekyouResult,
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
    const p1LuckManip = luckManipulationResult["player1"] ?? null;
    const p2LuckManip = luckManipulationResult["player2"] ?? null;
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
      !p2Scrying &&
      !p1LuckManip &&
      !p2LuckManip
    )
      return null;
    if (!player1 || !player2) return null;
    const s1: CharacterStats = player1.character
      ? calcStatsWithDisabled(player1.character, player1.no, disabledItems, allCharacters)
      : { ...player1.stats };
    const s2: CharacterStats = player2.character
      ? calcStatsWithDisabled(player2.character, player2.no, disabledItems, allCharacters)
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
    // Luck Manipulation: preview +1/+2 all stats
    const p1LuckDelta = luckManipulationResult["player1"] ?? 0;
    const p2LuckDelta = luckManipulationResult["player2"] ?? 0;
    if (p1LuckDelta)
      DSTAT_KEYS.forEach((k) => {
        s1[k] = (s1[k] || 0) + p1LuckDelta;
      });
    if (p2LuckDelta)
      DSTAT_KEYS.forEach((k) => {
        s2[k] = (s2[k] || 0) + p2LuckDelta;
      });
    return { s1, s2 };
  }, [
    stepState,
    dothrakiSpinResult,
    goldShipResult,
    luckManipulationResult,
    madScientistResult,
    summoningScrollResult,
    scryingSuccess,
    player1,
    player2,
    disabledItems,
    allCharacters,
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
    const base =
      player1?.character && disabledItems.size > 0
        ? calcStatsWithDisabled(player1.character, player1.no, disabledItems, allCharacters)
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
    allCharacters,
  ]);

  const p2DisplayStats = useMemo(() => {
    if (stepState) return stepState.p2Stats;
    if (dothrakiPreviewStats) return dothrakiPreviewStats.s2;
    const base = player2?.character
      ? calcStatsWithDisabled(player2.character, player2.no, disabledItems, allCharacters)
      : (player2?.stats ?? null);
    const delta =
      TRICKSTER_DISPLAY_DELTA[(tricksterResult["player2"] ?? "").toLowerCase()];
    if (base && delta != null) {
      const s = { ...base };
      for (const k of _ALL_STAT_KEYS) s[k] = Math.max(0, (s[k] ?? 0) + delta);
      return s;
    }
    if (base) {
      const s = { ...base };
      let changed = false;
      const p2HasUno =
        (player2?.character?.powers || [])
          .filter((pw: any) => !pw.isLost)
          .some(
            (pw: any) =>
              (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
              "uno reverse card",
          ) && !disabledItems.has(`${player2?.no}-power-Uno Reverse Card`);
      const p1HasUnoForP2 =
        (player1?.character?.powers || [])
          .filter((pw: any) => !pw.isLost)
          .some(
            (pw: any) =>
              (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
              "uno reverse card",
          ) && !disabledItems.has(`${player1?.no}-power-Uno Reverse Card`);
      // BM của p1 nhắm p2: nếu p2 có URC → không trừ p2
      const bmStatOnP2 = blackMagicStat["player1"];
      if (bmStatOnP2 && !p2HasUno) {
        s[bmStatOnP2] = (s[bmStatOnP2] ?? 0) - 2;
        changed = true;
      }
      // BM của p2 nhắm p1: nếu p1 có URC → bounce về p2
      const bmStatOnP2FromSelf = blackMagicStat["player2"];
      if (bmStatOnP2FromSelf && p1HasUnoForP2) {
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
    allCharacters,
  ]);

  // Dev Mode: wheel weight overrides (effectName -> itemIndex -> weight)
  const [devMode, setDevMode] = useState(false);
  const [devWeightOverrides, setDevWeightOverrides] = useState<
    Record<string, Record<number, number>>
  >({});
  const [devPanelPos, setDevPanelPos] = useState({ x: 20, y: 200 });

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
    const sandKey = `${roundIdx}-The Sand of Time-${side === "player1" ? "player2" : "player1"}`;
    const sandResult = roundSpinResults[sandKey];
    if (sandResult !== undefined) {
      console.log(`[CRP-wrapper] side=${side} roundIdx=${roundIdx} sandKey=${sandKey} sandResult=${JSON.stringify(sandResult)} stepState.roundLogs=${JSON.stringify(ctx.stepState?.roundLogs?.map(l=>({ri:l.roundIndex,w:l.winner})))}`);
    }
    const result = computeRoundPointsFn(
      side,
      winner,
      roundIdx,
      effects,
      statKey,
      roundsWonBefore,
      ctx,
    );
    if (sandResult !== undefined) {
      console.log(`[CRP-wrapper] => pts=${result.pts} pending=${result.pending} autoApplied=${result.autoApplied} engineBase=${result.engineBase}`);
    }
    return result;
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
    pendingCombatLogRef,
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
    setLuckManipulationResult,
    setMadScientistResult,
    setDothrakiSpinResult,
    setBlackMagicStat,
    setSummoningScrollResult,
    setTricksterResult,
    setEternalMangekyouResult,
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
    const p1Score = savedState.p1Score + (p1PtsMA.pts - p1BaseMA);
    const p2Score = savedState.p2Score + (p2PtsMA.pts - p2BaseMA);
    let overallWinner: "player1" | "player2";
    let tieBreaker: "race" | null = null;
    if (p1Score > p2Score) overallWinner = "player1";
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
          <div className="flex-1 px-5 py-3 rounded-2xl border border-gray-600/50 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-red-900/20">
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
              className="relative rounded-2xl border border-gray-600/40 mb-3 overflow-hidden"
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
                      className="rounded-xl border-2 border-dashed border-blue-600/20 flex items-center justify-center min-h-[140px]"
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
                              className={`text-[11px] font-black mt-1 px-3 py-1 rounded-lg border tracking-wide ${
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
                            <div className="text-[10px] font-bold mt-1 px-2 py-0.5 rounded-lg text-yellow-300 bg-yellow-500/10 border border-yellow-500/30">
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
                      className="rounded-xl border-2 border-dashed border-red-600/20 flex items-center justify-center min-h-[140px]"
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
                        className="px-3 py-1 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all text-xs border border-gray-700/40 hover:border-purple-500/40"
                      >
                        ⇄ Swap
                      </button>
                    )}
                    {detectCombatAudioTracks(player1.character).length === 0 &&
                      detectCombatAudioTracks(player2.character).length ===
                        0 && (
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
                  player1={{ name: player1.name, character: player1.character }}
                  player2={{ name: player2.name, character: player2.character }}
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
                className="rounded-2xl border border-gray-700/40 p-3 mb-3 overflow-hidden"
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
                      className="mt-2 rounded-xl border overflow-hidden text-xs"
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
              <div className="bg-orange-900/40 border border-orange-500/60 rounded-xl p-3 mb-3">
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
                      className={`text-sm font-bold px-3 py-2 rounded-lg border ${
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
                      className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-sm rounded-xl border border-green-500/50 transition-all"
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
                        className={`text-xs px-3 py-1.5 rounded-lg border ${
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
                <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-xl p-4 mb-3">
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
                          className="px-3 py-1 bg-yellow-700/50 hover:bg-yellow-600/60 border border-yellow-500/50 rounded-lg text-yellow-200 text-xs font-bold transition-colors"
                        >
                          🎡 Quay ngẫu nhiên
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Tìm Tarnished..."
                        value={tarnishedSearchTerm}
                        onChange={(e) => setTarnishedSearchTerm(e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-800 border border-yellow-600/40 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 mb-2"
                      />
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {filteredTarnished.map((p) => (
                          <button
                            key={p.no}
                            onClick={() => setSelectedTarnished(p)}
                            className="w-full px-3 py-2 text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-yellow-500/50 rounded-lg text-white text-sm flex justify-between items-center transition-all"
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
                                  <div className="mt-2 text-green-400 font-bold text-sm bg-green-900/30 border border-green-500/40 rounded-lg px-3 py-2">
                                    Tarnished thắng →{" "}
                                    <strong>
                                      {pendingLoser === "player1"
                                        ? player1?.name
                                        : player2?.name}
                                    </strong>{" "}
                                    được cứu!
                                  </div>
                                ) : (
                                  <div className="mt-2 text-red-400 font-bold text-sm bg-red-900/30 border border-red-500/40 rounded-lg px-3 py-2">
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
                                  className="mt-3 px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs rounded-lg border border-green-500 font-bold transition-all"
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
                          className="w-full px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold text-sm rounded-xl transition-all"
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
                <div className="bg-gray-900/60 border border-orange-600/40 rounded-xl p-3 mb-3">
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
                    className={`mt-2 text-xs font-bold text-center px-3 py-1.5 rounded-lg border ${
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
                  <div className="mt-3 bg-yellow-900/20 rounded-xl border border-yellow-500/40 p-3">
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
                      <div className="flex items-center gap-2">
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
                          className="px-4 py-2 bg-yellow-600/40 hover:bg-yellow-600/60 text-yellow-200 font-bold rounded-lg text-sm border border-yellow-500/40 transition-colors"
                        >
                          🎯 Quay Tiebreaker
                        </button>
                        <button
                          onClick={toggleTiebreakerBGM}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-800/40 hover:bg-yellow-700/50 border border-yellow-600/40 text-yellow-200 text-sm font-medium transition-colors"
                        >
                          {tiebreakerBGMPlaying ? "⏸" : "▶"} BGM
                        </button>
                      </div>
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
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all"
                    >
                      ⚔ Bắt đầu
                    </button>
                    {/* Settings toggle */}
                    <button
                      onClick={() => setShowSettings((s) => !s)}
                      className="p-2 rounded-xl bg-gray-700/60 hover:bg-gray-600/80 text-gray-300 hover:text-white transition-colors text-sm"
                      title="Cài đặt"
                    >
                      ⚙
                    </button>

                    {/* Settings panel — absolute để không đẩy layout */}
                    {showSettings && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900/95 border border-gray-600/50 rounded-xl p-4 w-72 space-y-3 text-sm shadow-2xl z-50">
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
              {isTournamentMode && !combatConfirmed && player1 && player2 && (
                <div className="flex flex-col gap-1.5 items-center">
                  <div className="text-[10px] text-gray-500 font-mono">
                    Chọn thắng thủ công
                  </div>
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
                      className="px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg text-xs border border-blue-500/30 transition-colors"
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
                      className="px-3 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded-lg text-xs border border-red-500/30 transition-colors"
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
                    className={`px-6 py-2.5 font-bold rounded-xl text-sm transition-all shadow-lg ${
                      pendingSpinsForLastRound
                        ? "bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/40"
                        : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white shadow-yellow-500/20"
                    }`}
                  >
                    {pendingSpinsForLastRound
                      ? "⏳ Đang xử lý..."
                      : `Next Round (${STAT_ORDER[stepRoundIndex]?.label ?? ""})`}
                  </button>
                </div>
              )}
              {/* BattleWheelSpinner đã chuyển sang WheelOfTruthMode */}
              {/* All rounds done — confirm result (after optional spins) */}
              {battleDone && !combatConfirmed && (
                <button
                  onClick={handleConfirmCombat}
                  disabled={pendingSpins}
                  className={`px-6 py-2.5 font-bold rounded-xl text-sm transition-all shadow-lg ${
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
                  className="px-4 py-2 bg-gray-700/60 hover:bg-gray-600/60 text-gray-300 rounded-lg text-xs border border-gray-600/50 transition-colors"
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
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-violet-500/20 transition-all"
                  >
                    Next Match ▶
                  </button>
                )}
            </div>

            {/* Tournament: Special Event / Note / Save */}
            {isTournamentMode && (
              <div className="mt-3 bg-gray-800/60 rounded-xl border border-yellow-600/30 p-3 space-y-2">
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
                      className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg text-sm transition-all"
                    >
                      💾 Lưu kết quả{" "}
                      {tournamentMatch!.displayLabel ??
                        `Match #${tournamentMatch!.matchNumber}`}
                    </button>
                  )}
              </div>
            )}

            {/* Rules Info */}
            <div className="mt-4 bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-3 text-center">
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
        />
      )}

      {/* Floating stat bubbles — fixed overlay, float trên toàn màn hình */}
      <FloatingStatBubblesOverlay p1Bubbles={p1Bubbles} p2Bubbles={p2Bubbles} />
    </div>
  );
};

