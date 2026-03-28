import { Dispatch, SetStateAction, MutableRefObject } from "react";
import { Character, CharacterStats } from "../types/character";
import {
  PvPPlayerData,
  CombatResult,
  StepCombatState,
  RoundLog,
  RoundEvent,
  DothrakiRule,
} from "../types/battleZone";
import { EffectResolver, getEffectiveRace } from "../effects/resolver";
import { EffectRegistry } from "../effects/registry";
import { _ALL_STAT_KEYS } from "../constants/battleZone";
import {
  applyStatDelta,
  calcStatsWithDisabled,
  applyBeforeCombatStatMods,
  calcStatsWithBeforeCombat,
} from "../utils/combatStats";
import type { AfterCombatEntry } from "./useWheelSpins";

// ============================================================================
// Types
// ============================================================================

export interface UseStartCombatParams {
  // State reads
  player1: PvPPlayerData | null;
  player2: PvPPlayerData | null;
  disabledItems: Set<string>;
  summoningScrollResult: Record<string, any>;
  goldenCoinPoints: Record<string, number>;
  oneTrickPonyStat: Record<string, string>;
  huntersMarkStat: Record<string, string>;
  tricksterResult: Record<string, string | null>;
  raumanianSuccess: Record<string, boolean>;
  scryingSuccess: Record<string, boolean>;
  encroachingShadowSuccess: Record<string, boolean>;
  goldShipResult: Record<string, any>;
  madScientistResult: Record<string, any>;
  dothrakiSpinResult: Record<string, any>;
  cursedCoinTarget: Record<string, string>;
  guidanceStats: Record<string, string[]>;
  blackMagicStat: Record<string, string | null>;
  rhittaResult: Record<string, any>;

  // Setters
  setAfterCombatEntries: Dispatch<SetStateAction<AfterCombatEntry[]>>;
  setCombatConfirmed: Dispatch<SetStateAction<boolean>>;
  setCombatResult: Dispatch<SetStateAction<CombatResult | null>>;
  setCurrentRound: Dispatch<SetStateAction<number>>;
  setDisabledItems: Dispatch<SetStateAction<Set<string>>>;
  setIsAnimating: Dispatch<SetStateAction<boolean>>;
  setIsPendingRoundtable: Dispatch<SetStateAction<boolean>>;
  setPendingLoser: Dispatch<SetStateAction<"player1" | "player2" | null>>;
  setRoundSpinResults: Dispatch<SetStateAction<Record<string, any>>>;
  setSelectedTarnished: Dispatch<SetStateAction<PvPPlayerData | null>>;
  setStepRoundIndex: Dispatch<SetStateAction<number>>;
  setStepState: Dispatch<SetStateAction<StepCombatState | null>>;
  setSubCombatResult: Dispatch<SetStateAction<CombatResult | null>>;
  setSummoningScrollResult: Dispatch<SetStateAction<Record<string, any>>>;
  setZoltraakBiq2Pending: Dispatch<SetStateAction<boolean>>;

  // Refs that startCombat resets
  pendingAfterCombatBuildRef: MutableRefObject<any>;
  pendingCrueltyAfterCombatRef: MutableRefObject<any>;
  pendingFinalizeStateRef: MutableRefObject<any>;
  preBiqFiredHandlersRef: MutableRefObject<any>;

  // Functions / constants passed as params
  getPerRoundEffects: (
    char: Character | undefined,
    playerNo?: number,
  ) => { onWin: string[]; onLose: string[]; onTie: string[] };
  EffectResolver: typeof EffectResolver;
  EffectRegistry: typeof EffectRegistry;
  allPlayers: PvPPlayerData[];
  isTournamentMode: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useStartCombat(params: UseStartCombatParams): {
  startCombat: () => void;
} {
  const startCombat = () => {
    const {
      player1,
      player2,
      disabledItems,
      summoningScrollResult,
      goldenCoinPoints,
      raumanianSuccess,
      tricksterResult,
      encroachingShadowSuccess,
      scryingSuccess,
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
      pendingAfterCombatBuildRef,
      pendingCrueltyAfterCombatRef,
      pendingFinalizeStateRef,
      preBiqFiredHandlersRef,
      EffectResolver,
      EffectRegistry,
      allPlayers,
    } = params;

    if (!player1 || !player2) return;

    // Fancy Feet: disable rune/runeword của đối thủ nếu player có Power "Fancy Feet"
    const hasFancyFeet = (p: PvPPlayerData) =>
      (p.character?.powers || []).some(
        (pw: any) =>
          !pw.isLost &&
          (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
            "fancy feet",
      );
    const buildFancyFeetDisables = (
      source: PvPPlayerData,
      target: PvPPlayerData,
    ): string[] => {
      if (!hasFancyFeet(source)) return [];
      const keys: string[] = [];
      // Disable runes
      const runes: any[] = target.character?.runes?.runes || [];
      const runeword: string | undefined = target.character?.runes?.runeword;
      for (const r of runes) {
        const rname = typeof r === "string" ? r : (r?.name ?? "");
        if (rname) keys.push(`${target.no}-rune-${rname}`);
      }
      if (runeword) keys.push(`${target.no}-runeword-${runeword}`);
      // Disable weapons (stat bonuses, effects — không disable power đã gắn vào character)
      const weapons: any[] = target.character?.weapons || [];
      for (const w of weapons) {
        const wname = typeof w === "string" ? w : (w?.name ?? "");
        if (wname && !w.isLost) keys.push(`${target.no}-weapon-${wname}`);
      }
      return keys;
    };
    const fancyFeetKeys = [
      ...buildFancyFeetDisables(player1, player2),
      ...buildFancyFeetDisables(player2, player1),
    ];
    // Merge into effectiveDisabledItems for this combat session
    const effectiveDisabledItems =
      fancyFeetKeys.length > 0
        ? new Set([...disabledItems, ...fancyFeetKeys])
        : disabledItems;
    if (fancyFeetKeys.length > 0) setDisabledItems(effectiveDisabledItems);

    setCombatResult(null);
    setIsAnimating(false);
    setCurrentRound(-1);
    setIsPendingRoundtable(false);
    setPendingLoser(null);
    pendingAfterCombatBuildRef.current = null;
    pendingCrueltyAfterCombatRef.current = null;
    pendingFinalizeStateRef.current = null;
    setZoltraakBiq2Pending(false);
    preBiqFiredHandlersRef.current = null;
    setSelectedTarnished(null);
    setSubCombatResult(null);
    // _setSubCurrentRound(-1) — no-op in component, skipped here
    setRoundSpinResults({});
    // Reset per-round spin results — trận mới
    // NOTE: before_combat wheel results (oneTrickPonyStat, huntersMarkStat, guidanceStats,
    // scryingSuccess, raumanianSuccess, goldenCoinPoints, encroachingShadowSuccess, tricksterResult,
    // dothrakiSpinResult, blackMagicStat) KHÔNG reset ở đây vì user đã quay trước khi bấm Bắt đầu.
    // Chúng được reset khi đổi matchup (setPlayer1/setPlayer2).
    setSummoningScrollResult({});
    setCombatConfirmed(false);
    const p2Race = getEffectiveRace(player2.character, player2.race);
    const p1Race = getEffectiveRace(player1.character, player1.race);

    // Compute starting points from combat_points effects (conditional ones like Freyja, Bragi, Asmodeus, Thor, Belphegor)
    const calcStartingPoints = (
      self: PvPPlayerData,
      opponent: PvPPlayerData,
    ): number => {
      if (!self.character) return 0;
      const selfNo = self.no;
      const oppChar = opponent.character;
      const oppRace = getEffectiveRace(oppChar, opponent.race);
      const oppHasLover = !!(
        oppChar?.lover &&
        (Array.isArray(oppChar.lover)
          ? oppChar.lover.some((l) => !l.isLost)
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
          !effectiveDisabledItems.has(`${oppNo}-weapon-${w?.name ?? ""}`) &&
          !(w?.name ?? "").toLowerCase().includes("không dùng được") &&
          instruments.some((i) => w.name?.includes(i)),
      );
      const oppPowers = (oppChar?.powers || [])
        .filter((p: any) => !p?.isLost)
        .filter((p: any) => {
          const pname = typeof p === "string" ? p : (p?.name ?? "");
          return !effectiveDisabledItems.has(`${oppNo}-power-${pname}`);
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
        // Check disabled
        const srcName = ce.source?.name || "?";
        const srcType = ce.source?.type || "?";
        if (effectiveDisabledItems.has(`${selfNo}-${srcType}-${srcName}`))
          continue;
        // PvE-only effects: skip in PvP
        if (srcName === "Misty Step Ahead") continue;
        if (srcName === "Thunder Dragon") continue;
        // customHandler: anduril_evil_race_bonus → +1 per 3 summons vs evil race
        if ((ce.effect as any)?.type === "custom") {
          const customHandler2 = (ce.effect as any).customHandler;
          if (customHandler2 === "anduril_evil_race_bonus") {
            const ANDURIL_EVIL = [
              "demon",
              "vampire",
              "spirit",
              "orc",
              "skeleton",
              "goblin",
            ];
            if (ANDURIL_EVIL.includes(oppRace.toLowerCase())) {
              const summonCount = (self.character?.summons || []).filter(
                (s: any) => !s?.isLost,
              ).length;
              pts += Math.floor(summonCount / 3);
            }
          }
          continue;
        }
        // customHandler: spear_of_fire_2_rune_check → check có vũ khí dùng được + ≥2 rune không bị mất
        const customHandler = (ce.effect as any).customHandler;
        // customHandler: spear_of_fire_2_rune_check → check đối thủ có vũ khí dùng được + ≥2 rune
        if (customHandler === "spear_of_fire_2_rune_check") {
          const oppWeapons: any[] = opponent.character?.weapons || [];
          const hasUsableWeapon = oppWeapons.some(
            (w: any) =>
              !w.isLost &&
              !(typeof w === "string" ? w : (w?.name ?? ""))
                .toLowerCase()
                .includes("không dùng được"),
          );
          const oppRunes: any[] = opponent.character?.runes?.runes || [];
          const activeRuneCount = oppRunes.filter((r: any) => !r.isLost).length;
          if (hasUsableWeapon && activeRuneCount >= 2)
            pts += (ce.effect as any).points || 0;
          continue;
        }
        // King's Landing: -2 điểm khởi đầu nếu không có Devotee/God/Demi God
        if (customHandler === "kings_landing_penalty_check") {
          const selfRaceKL = (self.character?.race?.race ?? "").toLowerCase();
          const exemptRacesKL = ["god", "demi god", "demi-god", "demigod"];
          const isExemptRaceKL = exemptRacesKL.some((r) => selfRaceKL.includes(r));
          const archetypesKL: string[] = (self.character?.archetypes || []).map(
            (a: any) => (typeof a === "string" ? a : (a?.name ?? "")),
          );
          const isDevoteeKL = archetypesKL.some((a: string) =>
            a.toLowerCase().includes("devotee"),
          );
          if (!isExemptRaceKL && !isDevoteeKL) pts += (ce.effect as any).points || 0;
          continue;
        }
        // Nếu có customHandler chưa được xử lý ở trên → skip (tránh cộng nhầm)
        if ((ce.effect as any).customHandler) continue;
        // Check conditions
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
      return pts;
    };
    let p1StartScore = calcStartingPoints(player1, player2);
    let p2StartScore = calcStartingPoints(player2, player1);
    // Raumanian: add 1 point if wheel result was success
    if (raumanianSuccess["player1"]) p1StartScore += 1;
    if (raumanianSuccess["player2"]) p2StartScore += 1;
    // Golden Coin: add points from wheel result
    if (goldenCoinPoints["player1"])
      p1StartScore += goldenCoinPoints["player1"];
    if (goldenCoinPoints["player2"])
      p2StartScore += goldenCoinPoints["player2"];
    // Moonroot (Herbalist) (+N): apply điểm khởi đầu tích lũy từ combat trước
    const applyMoonrootBonus = (
      p: PvPPlayerData,
      side: "player1" | "player2",
    ) => {
      if (!p.character) return;
      const nas: any[] = (p.character as any).nestedArchetypes || [];
      for (const na of nas) {
        const subType: string = na.subType || "";
        if (!subType.toLowerCase().startsWith("moonroot")) continue;
        if (na.subTypeIsLost) continue;
        const disabled = effectiveDisabledItems.has(
          `${p.no}-archetype_sub-${subType}`,
        );
        if (disabled) continue;
        const bonusMatch = subType.match(/\(\+(\d+)\)/);
        if (!bonusMatch) continue;
        const bonus = parseInt(bonusMatch[1], 10);
        if (side === "player1") p1StartScore += bonus;
        else p2StartScore += bonus;
      }
    };
    applyMoonrootBonus(player1, "player1");
    applyMoonrootBonus(player2, "player2");

    const p1BaseStats: CharacterStats = player1.character
      ? calcStatsWithBeforeCombat(
          player1.character,
          player1.no,
          effectiveDisabledItems,
          p2Race,
          player2.character ?? null,
          player2.no,
          effectiveDisabledItems,
          p1Race,
          player1.raceTier,
          player2.raceTier,
        )
      : { ...player1.stats };
    const p2BaseStats: CharacterStats = player2.character
      ? calcStatsWithBeforeCombat(
          player2.character,
          player2.no,
          effectiveDisabledItems,
          p1Race,
          player1.character ?? null,
          player1.no,
          effectiveDisabledItems,
          p2Race,
          player2.raceTier,
          player1.raceTier,
        )
      : { ...player2.stats };

    // Cursed Coin: -1 all stats cho người bị chọn
    if (cursedCoinTarget["player1"]) {
      const affected =
        cursedCoinTarget["player1"] === "self" ? p1BaseStats : p2BaseStats;
      for (const k of _ALL_STAT_KEYS) applyStatDelta(affected, k, -1);
    }
    if (cursedCoinTarget["player2"]) {
      const affected =
        cursedCoinTarget["player2"] === "self" ? p2BaseStats : p1BaseStats;
      for (const k of _ALL_STAT_KEYS) applyStatDelta(affected, k, -1);
    }

    // Uno Reverse Card: redirect before_combat debuffs của đối thủ về đối thủ
    // calcStatsWithBeforeCombat đã skip apply vào ta — cần apply vào đối thủ ở đây
    const hasUnoP1BC =
      (player1.character?.powers || []).some(
        (pw: any) =>
          !pw.isLost &&
          (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
            "uno reverse card",
      ) && !effectiveDisabledItems.has(`${player1.no}-power-Uno Reverse Card`);
    const hasUnoP2BC =
      (player2.character?.powers || []).some(
        (pw: any) =>
          !pw.isLost &&
          (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
            "uno reverse card",
      ) && !effectiveDisabledItems.has(`${player2.no}-power-Uno Reverse Card`);
    if (hasUnoP1BC && player2.character) {
      // p1 có URC → debuffs của p2 nhắm vào opponent (p1) bị redirect về p2
      applyBeforeCombatStatMods(
        p2BaseStats,
        player2.character,
        player2.no,
        effectiveDisabledItems,
        p1Race,
        "opponent",
        player2.raceTier,
        player1.raceTier,
        player1.character,
      );
    }
    if (hasUnoP2BC && player1.character) {
      // p2 có URC → debuffs của p1 nhắm vào opponent (p2) bị redirect về p1
      applyBeforeCombatStatMods(
        p1BaseStats,
        player1.character,
        player1.no,
        effectiveDisabledItems,
        p2Race,
        "opponent",
        player1.raceTier,
        player2.raceTier,
        player2.character,
      );
    }

    // King Gnome's Banana: +2 all stats nếu IQ cao hơn đối thủ, -2 all stats nếu IQ thấp hơn
    const hasKingBanana = (p: PvPPlayerData) =>
      [
        ...(p.character?.gear?.normalGear || []),
        ...(p.character?.gear?.legacyGear || []),
      ].some(
        (g: any) =>
          !g.isLost &&
          (typeof g === "string" ? g : (g?.name ?? ""))
            .toLowerCase()
            .includes("king gnome's banana") &&
          !disabledItems.has(
            `${p.no}-gear-${typeof g === "string" ? g : (g?.name ?? "")}`,
          ),
      );
    if (hasKingBanana(player1)) {
      const delta =
        p1BaseStats.iq > p2BaseStats.iq
          ? 2
          : p1BaseStats.iq < p2BaseStats.iq
            ? -2
            : 0;
      if (delta !== 0)
        for (const k of _ALL_STAT_KEYS) applyStatDelta(p1BaseStats, k, delta);
    }
    if (hasKingBanana(player2)) {
      const delta =
        p2BaseStats.iq > p1BaseStats.iq
          ? 2
          : p2BaseStats.iq < p1BaseStats.iq
            ? -2
            : 0;
      if (delta !== 0)
        for (const k of _ALL_STAT_KEYS) applyStatDelta(p2BaseStats, k, delta);
    }

    // Trickster: apply stat delta từ subtype (King +1, Queen -1, Jack +97)
    const TRICKSTER_STAT_DELTA: Record<string, number> = {
      "king of diamonds": 1,
      "queen of clubs": -1,
      "jack of 97": 97,
    };
    const p1TricksterSub = (tricksterResult["player1"] ?? "").toLowerCase();
    const p2TricksterSub = (tricksterResult["player2"] ?? "").toLowerCase();
    if (TRICKSTER_STAT_DELTA[p1TricksterSub] != null)
      for (const k of _ALL_STAT_KEYS)
        applyStatDelta(p1BaseStats, k, TRICKSTER_STAT_DELTA[p1TricksterSub]);
    if (TRICKSTER_STAT_DELTA[p2TricksterSub] != null)
      for (const k of _ALL_STAT_KEYS)
        applyStatDelta(p2BaseStats, k, TRICKSTER_STAT_DELTA[p2TricksterSub]);

    // Encroaching Shadow: +7 Speed nếu wheel thành công
    if (encroachingShadowSuccess["player1"])
      applyStatDelta(p1BaseStats, "spd", 7);
    if (encroachingShadowSuccess["player2"])
      applyStatDelta(p2BaseStats, "spd", 7);

    // Black Magic: -2 vào stat được chọn của đối thủ
    // Uno Reverse Card: nếu target có URC thì debuff quay lại người dùng Black Magic
    const hasUnoP1 =
      (player1.character?.powers || [])
        .filter((pw: any) => !pw.isLost)
        .some(
          (pw: any) =>
            (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
            "uno reverse card",
        ) &&
      !effectiveDisabledItems.has(`${player1.no}-power-Uno Reverse Card`);
    const hasUnoP2 =
      (player2.character?.powers || [])
        .filter((pw: any) => !pw.isLost)
        .some(
          (pw: any) =>
            (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
            "uno reverse card",
        ) &&
      !effectiveDisabledItems.has(`${player2.no}-power-Uno Reverse Card`);
    if (blackMagicStat["player1"]) {
      // player1 dùng BM → debuff nhắm vào player2
      // URC bounce nếu player1 tự có URC HOẶC player2 có URC
      if (hasUnoP1 || hasUnoP2)
        applyStatDelta(p1BaseStats, blackMagicStat["player1"]! as keyof CharacterStats, -2);
      else applyStatDelta(p2BaseStats, blackMagicStat["player1"]! as keyof CharacterStats, -2);
    }
    if (blackMagicStat["player2"]) {
      // player2 dùng BM → debuff nhắm vào player1
      // URC bounce nếu player2 tự có URC HOẶC player1 có URC
      if (hasUnoP2 || hasUnoP1)
        applyStatDelta(p2BaseStats, blackMagicStat["player2"]! as keyof CharacterStats, -2);
      else applyStatDelta(p1BaseStats, blackMagicStat["player2"]! as keyof CharacterStats, -2);
    }

    // Rhitta: nếu quay thành công trước combat → +3 STR, +2 DUR
    if (rhittaResult["player1"]) {
      applyStatDelta(p1BaseStats, "str", 3);
      applyStatDelta(p1BaseStats, "dur", 2);
    }
    if (rhittaResult["player2"]) {
      applyStatDelta(p2BaseStats, "str", 3);
      applyStatDelta(p2BaseStats, "dur", 2);
    }

    // Gold Ship: +1 hoặc -1 all stats tùy kết quả wheel
    if (goldShipResult["player1"] != null) {
      const d1 = goldShipResult["player1"] ? 1 : -1;
      for (const k of _ALL_STAT_KEYS) applyStatDelta(p1BaseStats, k, d1);
    }
    if (goldShipResult["player2"] != null) {
      const d2 = goldShipResult["player2"] ? 1 : -1;
      for (const k of _ALL_STAT_KEYS) applyStatDelta(p2BaseStats, k, d2);
    }

    // Scrying: player có Scrying thành công → đối thủ bị -4 stat cao nhất (tính theo base stats gốc)
    if (scryingSuccess["player1"]) {
      const p2RawStats: CharacterStats = player2.baseStats;
      const highestStat = _ALL_STAT_KEYS.reduce((a, b) =>
        (p2RawStats[a] || 0) >= (p2RawStats[b] || 0) ? a : b,
      );
      applyStatDelta(p2BaseStats, highestStat, -4);
    }
    if (scryingSuccess["player2"]) {
      const p1RawStats: CharacterStats = player1.baseStats;
      const highestStat = _ALL_STAT_KEYS.reduce((a, b) =>
        (p1RawStats[a] || 0) >= (p1RawStats[b] || 0) ? a : b,
      );
      applyStatDelta(p1BaseStats, highestStat, -4);
    }

    // Mad Scientist: Shrinking (true) = bản thân +6 SPD, -3 STR, -3 DUR; Enlarging (false) = bản thân +3 STR, +3 DUR, -6 SPD
    if (madScientistResult["player1"] != null) {
      if (madScientistResult["player1"]) {
        applyStatDelta(p1BaseStats, "spd", 6);
        applyStatDelta(p1BaseStats, "str", -3);
        applyStatDelta(p1BaseStats, "dur", -3);
      } else {
        applyStatDelta(p1BaseStats, "str", 3);
        applyStatDelta(p1BaseStats, "dur", 3);
        applyStatDelta(p1BaseStats, "spd", -6);
      }
    }
    if (madScientistResult["player2"] != null) {
      if (madScientistResult["player2"]) {
        applyStatDelta(p2BaseStats, "spd", 6);
        applyStatDelta(p2BaseStats, "str", -3);
        applyStatDelta(p2BaseStats, "dur", -3);
      } else {
        applyStatDelta(p2BaseStats, "str", 3);
        applyStatDelta(p2BaseStats, "dur", 3);
        applyStatDelta(p2BaseStats, "spd", -6);
      }
    }

    // Summoning Scroll: apply stat deltas từ summon wheel
    const p1Summon = summoningScrollResult["player1"];
    const p2Summon = summoningScrollResult["player2"];
    if (p1Summon) {
      for (const [k, v] of Object.entries(p1Summon.statDeltas)) {
        applyStatDelta(p1BaseStats, k as keyof CharacterStats, v as number);
      }
      if (p1Summon.startScoreDelta > 0)
        p1StartScore += p1Summon.startScoreDelta;
    }
    if (p2Summon) {
      for (const [k, v] of Object.entries(p2Summon.statDeltas)) {
        applyStatDelta(p2BaseStats, k as keyof CharacterStats, v as number);
      }
      if (p2Summon.startScoreDelta > 0)
        p2StartScore += p2Summon.startScoreDelta;
    }

    // Morningstar: +2 STR nếu đối thủ dùng vũ khí Physical — apply ngay khi bắt đầu combat
    {
      const weapEnts = EffectRegistry.getAllByType("weapon");
      const cleanName = (w: any) =>
        (typeof w === "string" ? w : (w?.name ?? ""))
          .replace(/\s*\(.*?\)/g, "")
          .trim();
      const hasPhysWep = (char: any) =>
        (char?.weapons || []).some((w: any) => {
          if (w?.isLost) return false;
          const n = cleanName(w);
          const ent = weapEnts.find(
            (e) => e.name.toLowerCase() === n.toLowerCase(),
          );
          return ent?.tags?.includes("physical") ?? false;
        });
      const p1Morning =
        (player1.character?.weapons || []).some(
          (w: any) =>
            !w?.isLost && cleanName(w).toLowerCase() === "morningstar",
        ) && !disabledItems.has(`${player1.no}-weapon-Morningstar`);
      const p2Morning =
        (player2.character?.weapons || []).some(
          (w: any) =>
            !w?.isLost && cleanName(w).toLowerCase() === "morningstar",
        ) && !disabledItems.has(`${player2.no}-weapon-Morningstar`);
      if (p1Morning && hasPhysWep(player2.character))
        applyStatDelta(p1BaseStats, "str", 2);
      if (p2Morning && hasPhysWep(player1.character))
        applyStatDelta(p2BaseStats, "str", 2);
    }

    // Lady subTypeBonus: nếu player có House sub-type Lady với bonus (vd: "Lady (+2)") → apply +bonus all stats
    for (const [player, baseStats] of [
      [player1, p1BaseStats],
      [player2, p2BaseStats],
    ] as const) {
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
          for (const k of _ALL_STAT_KEYS)
            applyStatDelta(baseStats, k, h.subTypeBonus);
        }
      }
    }

    // Devotee auto-lose vs God/Demi-God: kết thúc ngay, không qua rounds
    {
      const checkDevotee = (p: PvPPlayerData, opp: PvPPlayerData): boolean => {
        const archetypes: string[] = (
          (p.character as any)?.archetypes || []
        ).map((a: any) =>
          (typeof a === "string" ? a : (a?.name ?? "")).toLowerCase(),
        );
        if (!archetypes.some((a) => a.includes("devotee"))) return false;
        const oppMainRace = ((opp.character as any)?.race?.race || "")
          .toLowerCase()
          .trim();
        const oppEffRace = getEffectiveRace((opp.character as any)) || oppMainRace;
        return ["god", "demi-god", "demi god", "demigod"].includes(oppEffRace);
      };
      const p1Auto = checkDevotee(player1, player2);
      const p2Auto = checkDevotee(player2, player1);
      if (p1Auto || p2Auto) {
        const autoWinner: "player1" | "player2" = p1Auto
          ? "player2"
          : "player1";
        const devoteeP = p1Auto ? player1 : player2;
        const godP = p1Auto ? player2 : player1;
        const godRace =
          (godP.character as any)?.race?.race || godP.race || "God";

        // Build after-combat entries (Eir, etc.) cho cả 2 players
        const earlyAcEntries: AfterCombatEntry[] = [];
        for (const [side, p] of [
          ["player1", player1],
          ["player2", player2],
        ] as const) {
          const c = p.character;
          if (!c) continue;
          const subRaceRaw = ((c as any).race?.subRace || "")
            .split("(")[0]
            .trim()
            .toLowerCase();
          if (subRaceRaw === "eir") {
            const subRaceFull: string = (c as any).race?.subRace || "Eir";
            const stackMatch = subRaceFull.match(/\((\d+)\)/);
            const stackN = stackMatch ? parseInt(stackMatch[1], 10) : 0;
            const currentBonus = Math.pow(2, stackN);
            const nextStack = stackN + 1;
            earlyAcEntries.push({
              player: side,
              quirkName: "Eir",
              description: `+${currentBonus} Durability (Eir — stack ${stackN}). [GM Action] Đổi Sub-race thành "Eir (${nextStack})".`,
              statMods: [
                { stat: "dur" as keyof CharacterStats, delta: currentBonus },
              ],
              gmAction: true,
            });
          }
        }

        const devoteeLog: RoundLog = {
          roundIndex: -1,
          statLabel: "Devotee",
          statKey: "devotee",
          p1ValueUsed: 0,
          p2ValueUsed: 0,
          winner: autoWinner,
          p1Score: 0,
          p2Score: 0,
          events: [
            {
              player: p1Auto ? "player1" : "player2",
              source: "Devotee",
              description: `[Devotee] ${devoteeP.name} thua ngay lập tức vì đối đầu với ${godP.name} (${godRace})`,
              type: "info",
            },
          ],
          pointChanges: [],
          carryOverToNext: [],
        };
        setStepState({
          p1Stats: p1BaseStats,
          p2Stats: p2BaseStats,
          p1Score: 0,
          p2Score: 0,
          startP1Score: p1StartScore,
          startP2Score: p2StartScore,
          p1CarryOver: [],
          p2CarryOver: [],
          resolvedRounds: [],
          roundLogs: [devoteeLog],
          p1TenacityFired: false,
          p2TenacityFired: false,
          p1ConquerorFired: false,
          p2ConquerorFired: false,
          p1FiredHandlers: new Set<string>(),
          p2FiredHandlers: new Set<string>(),
          p1DothrakiRule: null,
          p2DothrakiRule: null,
        });
        setAfterCombatEntries(earlyAcEntries);
        setCombatResult({
          rounds: [],
          player1Score: 0,
          player2Score: 0,
          startPlayer1Score: p1StartScore,
          startPlayer2Score: p2StartScore,
          winner: autoWinner,
          tieBreaker: null,
        });
        return;
      }
    }

    const init: StepCombatState = {
      p1Stats: p1BaseStats,
      p2Stats: p2BaseStats,
      p1Score: p1StartScore,
      p2Score: p2StartScore,
      startP1Score: p1StartScore,
      startP2Score: p2StartScore,
      p1CarryOver: [],
      p2CarryOver: [],
      resolvedRounds: [],
      roundLogs: [],
      p1TenacityFired: false,
      p2TenacityFired: false,
      p1ConquerorFired: false,
      p2ConquerorFired: false,
      p1FiredHandlers: new Set<string>(),
      p2FiredHandlers: new Set<string>(),
      p1DothrakiRule: null,
      p2DothrakiRule: null,
    };
    // Dothraki: apply spin result from pre-combat wheel (dothrakiSpinResult)
    // Two-pass: boosts first (rules 5, 6), then swaps (rules 1-4)
    // This ensures swaps always act on fully-boosted stats.
    const swapStats = (
      ref: CharacterStats,
      a: keyof CharacterStats,
      b: keyof CharacterStats,
    ) => {
      const tmp = ref[a] || 0;
      ref[a] = ref[b] || 0;
      ref[b] = tmp;
    };
    const p1Rule = (dothrakiSpinResult["player1"] ?? null) as DothrakiRule;
    const p2Rule = (dothrakiSpinResult["player2"] ?? null) as DothrakiRule;
    init.p1DothrakiRule = p1Rule;
    init.p2DothrakiRule = p2Rule;
    // Pass 1: stat boosts
    const applyBoosts = (dSide: "player1" | "player2", rule: DothrakiRule) => {
      if (rule === null) return;
      const oppSide = dSide === "player1" ? "player2" : "player1";
      const dRef = dSide === "player1" ? init.p1Stats : init.p2Stats;
      const oRef = oppSide === "player1" ? init.p1Stats : init.p2Stats;
      if (rule === 5) {
        for (const k of _ALL_STAT_KEYS) applyStatDelta(dRef, k, 4);
        if (oppSide === "player1") init.p1Score += 3;
        else init.p2Score += 3;
      } else if (rule === 6) {
        for (const k of _ALL_STAT_KEYS) applyStatDelta(oRef, k, 5);
      }
    };
    applyBoosts("player1", p1Rule);
    applyBoosts("player2", p2Rule);
    // Pass 2: stat swaps (on fully-boosted stats)
    const applySwaps = (dSide: "player1" | "player2", rule: DothrakiRule) => {
      if (rule === null) return;
      const oppSide = dSide === "player1" ? "player2" : "player1";
      const dRef = dSide === "player1" ? init.p1Stats : init.p2Stats;
      const oRef = oppSide === "player1" ? init.p1Stats : init.p2Stats;
      if (rule === 1) {
        swapStats(oRef, "str", "ma");
        swapStats(oRef, "spd", "biq");
        swapStats(oRef, "dur", "iq");
      } else if (rule === 2) {
        swapStats(dRef, "str", "biq");
      } else if (rule === 3) {
        swapStats(dRef, "spd", "iq");
      } else if (rule === 4) {
        swapStats(dRef, "dur", "ma");
      }
    };
    applySwaps("player1", p1Rule);
    applySwaps("player2", p2Rule);

    // Build pre-combat log: collect notifications for before_combat effects
    {
      const preCombatEvents: RoundEvent[] = [];
      const STAT_LABEL: Record<string, string> = {
        str: "STR",
        spd: "SPD",
        dur: "DUR",
        iq: "IQ",
        ma: "MA",
        biq: "BIQ",
        strength: "STR",
        speed: "SPD",
        durability: "DUR",
        biq2: "BIQ",
        all: "All Stats",
      };
      const buildPreCombatEvents = (
        player: PvPPlayerData,
        playerSide: "player1" | "player2",
        selfBaseStats: CharacterStats,
        oppChar: Character | null,
        oppSide: "player1" | "player2",
        oppBaseStats: CharacterStats,
      ) => {
        if (!player.character) return;
        const fx = EffectResolver.calculateCharacterEffects(player.character, {
          isPvE: false,
        });
        const selfPowers = (player.character?.powers || []).filter(
          (p: any) => !p?.isLost,
        );
        const selfPowerCount = selfPowers.length;
        const oppPowers =
          (oppChar?.powers || []).filter((p: any) => !p?.isLost) || [];
        const oppPowerCount = oppPowers.length;

        // Fair Duel: nếu bất kỳ ai có Fair Duel active → miễn nhiễm debuff từ đối thủ
        const selfHasFairDuel = selfPowers.some(
          (pw: any) =>
            (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase().startsWith("fair duel"),
        ) && !([...effectiveDisabledItems].some(k => k.startsWith(`${player.no}-power-Fair Duel`)));
        const oppHasFairDuel = oppPowers.some(
          (pw: any) =>
            (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase().startsWith("fair duel"),
        ) && oppChar && !([...effectiveDisabledItems].some(k => k.startsWith(`${(oppChar as any).no ?? ""}-power-Fair Duel`)));
        const fairDuelActive = selfHasFairDuel || oppHasFairDuel;

        for (const ce of fx.combatEffects) {
          if (ce.isActive === false) continue;
          if (ce.effect?.timing !== "before_combat") continue;
          const srcName = ce.source?.name || "?";
          const srcType = ce.source?.type || "?";
          if (effectiveDisabledItems.has(`${player.no}-${srcType}-${srcName}`))
            continue;

          const effectType = ce.effect?.type;
          const handler = (ce.effect as any).customHandler;

          // Guidance: apply +1 vào 2 stats đã chọn qua wheel (nếu đối thủ ít power hơn)
          if (handler === "guidance_fewer_powers_check") {
            if (selfPowerCount.toFixed(0) > oppPowerCount.toFixed(0)) {
              const chosen = guidanceStats[playerSide] || [];
              if (chosen.length === 2) {
                for (const stat of chosen)
                  applyStatDelta(
                    selfBaseStats,
                    stat as keyof CharacterStats,
                    1,
                  );
                preCombatEvents.push({
                  player: playerSide,
                  source: srcName,
                  description: `Đối thủ ít Power hơn (${oppPowerCount} < ${selfPowerCount}) → +1 ${chosen.map((s) => s.toUpperCase()).join(", ")} (Guidance)`,
                  type: "stat_boost",
                });
              } else {
                preCombatEvents.push({
                  player: playerSide,
                  source: srcName,
                  description: `Guidance: Đối thủ ít Power hơn nhưng chưa chọn stat qua wheel`,
                  type: "info",
                });
              }
            } else {
              preCombatEvents.push({
                player: playerSide,
                source: srcName,
                description: `Đối thủ không ít Power hơn (${oppPowerCount} vs ${selfPowerCount}) → không áp dụng (Guidance)`,
                type: "info",
              });
            }
            continue;
          }

          // Power Negation / Anti-Magic Barrier: handled via CombatEffectsPanel wheel — skip pre-combat log
          if (
            effectType === "power_disable" ||
            effectType === "disable_powers"
          ) {
            continue;
          }

          // Fair Duel: immunity notice
          if (effectType === "immunity") {
            preCombatEvents.push({
              player: playerSide,
              source: srcName,
              description: `[${srcName}] Cả 2 miễn nhiễm Debuff từ nhau trong trận này`,
              type: "info",
            });
            continue;
          }

          // Chastiefol: before_combat → chủ nhân nhận +3 vào 2 stat thấp nhất của đối thủ
          if (handler === "chastiefol_lowest_stats") {
            const STAT_KEYS_SHORT: (keyof CharacterStats)[] = [
              "str",
              "spd",
              "dur",
              "iq",
              "biq",
              "ma",
            ];
            const sorted = [...STAT_KEYS_SHORT].sort(
              (a, b) =>
                (Number(oppBaseStats[a]) || 0) - (Number(oppBaseStats[b]) || 0),
            );
            const [low1, low2] = sorted;
            applyStatDelta(selfBaseStats, low1, 3);
            applyStatDelta(selfBaseStats, low2, 3);
            preCombatEvents.push({
              player: playerSide,
              source: srcName,
              description: `Chastiefol: +3 ${low1.toUpperCase()}, +3 ${low2.toUpperCase()} (2 stat thấp nhất của đối thủ)`,
              type: "stat_boost",
            });
            continue;
          }

          // Sarastro's Flute: -1 all stats đối thủ với mỗi 3 power họ có (không tính isLost)
          if (handler === "sarastro_flute_debuff") {
            if (fairDuelActive) {
              preCombatEvents.push({
                player: playerSide,
                source: srcName,
                description: `Fair Duel: Sarastro's Flute bị chặn — đối thủ miễn nhiễm debuff`,
                type: "info",
              });
              continue;
            }
            const debuff = Math.floor(oppPowerCount / 3);
            if (debuff > 0) {
              const STAT_KEYS_SHORT: (keyof CharacterStats)[] = [
                "str",
                "spd",
                "dur",
                "iq",
                "biq",
                "ma",
              ];
              for (const stat of STAT_KEYS_SHORT)
                applyStatDelta(oppBaseStats, stat, -debuff);
              preCombatEvents.push({
                player: oppSide,
                source: srcName,
                description: `Sarastro's Flute: Đối thủ có ${oppPowerCount} Power → -${debuff} tất cả chỉ số`,
                type: "stat_debuff",
              });
            } else {
              preCombatEvents.push({
                player: playerSide,
                source: srcName,
                description: `Sarastro's Flute: Đối thủ chưa đủ 3 Power (${oppPowerCount}) → không kích hoạt`,
                type: "info",
              });
            }
            continue;
          }

          // Frost Fingers: -1 stat cao nhất đối thủ per gear đối thủ có (tối đa 5)
          if (handler === "frost_fingers_per_gear") {
            const oppNormalGear = (
              (oppChar as any)?.gear?.normalGear || []
            ).filter((g: any) => !g?.isLost);
            const oppLegacyGear = (
              (oppChar as any)?.gear?.legacyGear || []
            ).filter((g: any) => !g?.isLost);
            const gearCount = oppNormalGear.length + oppLegacyGear.length;
            const penalty = Math.min(gearCount, 5);
            if (penalty === 0) {
              preCombatEvents.push({
                player: playerSide,
                source: srcName,
                description: `[${player.name ?? playerSide}] Frost Fingers: Đối thủ không có Gear → không kích hoạt`,
                type: "info",
              });
            } else {
              // Tính xem stat nào bị trừ (lặp penalty lần, mỗi lần lấy cao nhất hiện tại)
              const STAT_KEYS_FF: (keyof CharacterStats)[] = [
                "str",
                "spd",
                "dur",
                "iq",
                "biq",
                "ma",
              ];
              // Dùng stats trước before_combat để tính đúng stat bị trừ (nhất quán với engine)
              const oppPlayerData = oppSide === "player1" ? player1 : player2;
              const oppPreStats = oppChar
                ? calcStatsWithDisabled(
                    oppChar,
                    oppPlayerData.no,
                    effectiveDisabledItems,
                  )
                : { ...oppBaseStats };
              const simStats = { ...oppPreStats };
              const debuffRecord: Partial<
                Record<keyof CharacterStats, number>
              > = {};
              for (let i = 0; i < penalty; i++) {
                let highestKey: keyof CharacterStats = STAT_KEYS_FF[0];
                let highestVal = simStats[STAT_KEYS_FF[0]] ?? 0;
                for (const k of STAT_KEYS_FF) {
                  if ((simStats[k] ?? 0) > highestVal) {
                    highestVal = simStats[k] ?? 0;
                    highestKey = k;
                  }
                }
                simStats[highestKey] = (simStats[highestKey] ?? 0) - 1;
                debuffRecord[highestKey] = (debuffRecord[highestKey] ?? 0) - 1;
              }
              const debuffDesc = (
                Object.entries(debuffRecord) as [keyof CharacterStats, number][]
              )
                .map(([k, v]) => `${v} ${k.toUpperCase()}`)
                .join(", ");
              preCombatEvents.push({
                player: oppSide,
                source: srcName,
                description: `[${player.name ?? playerSide}] Frost Fingers: ${gearCount} Gear → ${debuffDesc}`,
                type: "stat_debuff",
              });
            }
            continue;
          }

          // Death's Scythe: debuff đối thủ, +1 per 51 người chết (đếm số trận R256+R128 đã đánh)
          if (handler === "deaths_scythe_scaling_debuff") {
            // Đếm số player bị loại ở R256 và R128 từ allPlayers
            const deadCount = allPlayers.filter(
              (p) => p.character?.tournament?.status === "eliminated",
            ).length;
            const debuff = Math.floor(deadCount / 51);
            if (debuff > 0) {
              const STAT_KEYS_DS: (keyof CharacterStats)[] = [
                "str", "spd", "dur", "iq", "biq", "ma",
              ];
              for (const stat of STAT_KEYS_DS)
                applyStatDelta(oppBaseStats, stat, -debuff);
              preCombatEvents.push({
                player: oppSide,
                source: srcName,
                description: `Death's Scythe: ${deadCount} người chết → -${debuff} tất cả chỉ số đối thủ`,
                type: "stat_debuff",
              });
            } else {
              preCombatEvents.push({
                player: playerSide,
                source: srcName,
                description: `Death's Scythe: ${deadCount} người chết, chưa đủ 51 → không kích hoạt`,
                type: "info",
              });
            }
            continue;
          }

          // Giant Slayer: +1 điểm per 4 Base Dura của đối thủ (tối đa 2)
          if (handler === "giant_slayer_dura_bonus") {
            const oppDur = (oppBaseStats as any).dur ?? 0;
            const points = Math.min(2, Math.floor(oppDur / 4));
            if (points > 0) {
              // Cộng trực tiếp vào điểm khởi đầu
              if (playerSide === "player1") init.p1Score += points;
              else init.p2Score += points;
              preCombatEvents.push({
                player: playerSide,
                source: srcName,
                description: `Giant Slayer: đối thủ có ${oppDur} Base Dura → +${points} điểm`,
                type: "point_change",
              });
            } else {
              preCombatEvents.push({
                player: playerSide,
                source: srcName,
                description: `Giant Slayer: đối thủ có ${oppDur} Base Dura, chưa đủ 4 → không cộng điểm`,
                type: "info",
              });
            }
            continue;
          }

          // Adapt: log GM action
          if (handler === "adapt_disable_known_powers") {
            const knownPowers: string[] =
              (player.character as any)?.adaptKnownPowers || [];
            const desc =
              knownPowers.length === 0
                ? `[Adapt] Chưa có Power nào được ghi nhớ — không vô hiệu hóa được Power nào`
                : `[Adapt] Vô hiệu hóa các Power đối thủ đã gặp: ${knownPowers.join(", ")}`;
            preCombatEvents.push({
              player: playerSide,
              source: srcName,
              description: desc,
              type: "info",
            });
            continue;
          }

          // stat_modifier target 'self' (no customHandler): apply trực tiếp vào stats (e.g. Storm Calling +2 BIQ)
          if (
            !handler &&
            (effectType === "stat_modifier" || effectType === "debuff") &&
            (ce.effect as any).target === "self"
          ) {
            const val = ce.effect?.value ?? 0;
            const stat = ce.effect?.stat ?? "";
            if (val && stat) {
              // Check conditions trước khi log (e.g. Gigachad race_tier_compare)
              const effectConditions: any[] =
                (ce.effect as any).conditions || [];
              const selfTier = player.raceTier ?? 0;
              const oppPlayer = playerSide === "player1" ? player2 : player1;
              const oppTier = oppPlayer?.raceTier ?? 0;
              const oppRaceStr = getEffectiveRace(oppChar);
              const condMet = effectConditions.every((cond: any) => {
                if (cond.type === "race_tier_compare") {
                  if (!cond.tierOperator) return false;
                  if (cond.tierOperator === ">") return selfTier > oppTier;
                  if (cond.tierOperator === "<") return selfTier < oppTier;
                  if (cond.tierOperator === "=") return selfTier === oppTier;
                  return false;
                }
                if (cond.type === "race_match" && cond.races) {
                  return cond.races.some(
                    (r: string) => r.toLowerCase() === oppRaceStr,
                  );
                }
                if (cond.type === "probability") return false; // handled via wheel
                if (
                  cond.type === "has_item" &&
                  cond.itemType === "archetype" &&
                  cond.itemName
                ) {
                  const checkChar =
                    cond.checkTarget === "opponent"
                      ? oppChar
                      : player.character;
                  const archs: string[] = Array.isArray(
                    (checkChar as any)?.archetypes,
                  )
                    ? (checkChar as any).archetypes.map((a: any) =>
                        typeof a === "string" ? a : (a?.name ?? ""),
                      )
                    : [];
                  return archs.some(
                    (a) => a.toLowerCase() === cond.itemName.toLowerCase(),
                  );
                }
                return true;
              });
              if (!condMet) continue;
              const statLabel = STAT_LABEL[stat] ?? stat.toUpperCase();
              preCombatEvents.push({
                player: playerSide,
                source: srcName,
                description: `${val > 0 ? "+" : ""}${val} ${statLabel} (${srcName})`,
                type: val > 0 ? "stat_boost" : "stat_debuff",
              });
            }
            continue;
          }

          // debuffOpponent: stat_modifier or debuff with target 'opponent' (no customHandler)
          if (
            !handler &&
            (effectType === "stat_modifier" || effectType === "debuff") &&
            (ce.effect as any).target === "opponent"
          ) {
            const val = ce.effect?.value ?? 0;
            const stat = ce.effect?.stat ?? "";
            if (val && stat) {
              // Fair Duel: block debuff lên đối thủ
              if (val < 0 && fairDuelActive) {
                const statLabel = STAT_LABEL[stat] ?? stat.toUpperCase();
                preCombatEvents.push({
                  player: oppSide,
                  source: srcName,
                  description: `Fair Duel: ${val} ${statLabel} từ ${srcName} bị chặn`,
                  type: "info",
                });
                continue;
              }
              // Check conditions (e.g. Holy Symbol race_match)
              const effectConditionsOpp: any[] =
                (ce.effect as any).conditions || [];
              const oppRaceStrOpp = getEffectiveRace(oppChar);
              const condMetOpp = effectConditionsOpp.every((cond: any) => {
                if (cond.type === "race_match" && cond.races) {
                  return cond.races.some(
                    (r: string) => r.toLowerCase() === oppRaceStrOpp,
                  );
                }
                if (cond.type === "probability") return false;
                if (
                  cond.type === "has_item" &&
                  cond.itemType === "archetype" &&
                  cond.itemName
                ) {
                  const checkChar =
                    cond.checkTarget === "opponent"
                      ? oppChar
                      : player.character;
                  const archs: string[] = Array.isArray(
                    (checkChar as any)?.archetypes,
                  )
                    ? (checkChar as any).archetypes.map((a: any) =>
                        typeof a === "string" ? a : (a?.name ?? ""),
                      )
                    : [];
                  return archs.some(
                    (a) => a.toLowerCase() === cond.itemName.toLowerCase(),
                  );
                }
                return true;
              });
              if (!condMetOpp) continue;
              const statLabel = STAT_LABEL[stat] ?? stat.toUpperCase();
              preCombatEvents.push({
                player: oppSide,
                source: srcName,
                description: `${val > 0 ? "+" : ""}${val} ${statLabel} (debuff từ ${player.name ?? playerSide})`,
                type: val < 0 ? "stat_debuff" : "stat_boost",
              });
            }
            continue;
          }

          // Mind Control: apply +1 all stats if opponent base IQ <= 5
          if (handler === "mind_control_iq_check") {
            const oppBaseIq =
              (oppChar as any)?.baseStats?.iq ??
              (oppChar as any)?.stats?.iq ??
              0;
            if (oppBaseIq <= 5) {
              for (const s of _ALL_STAT_KEYS)
                applyStatDelta(selfBaseStats, s, 1);
              preCombatEvents.push({
                player: playerSide,
                source: srcName,
                description: `Đối thủ Base IQ ≤ 5 (IQ=${oppBaseIq}) → +1 all stats (Mind Control)`,
                type: "stat_boost",
              });
            } else {
              preCombatEvents.push({
                player: playerSide,
                source: srcName,
                description: `Đối thủ Base IQ = ${oppBaseIq} > 5 → không kích hoạt (Mind Control)`,
                type: "info",
              });
            }
            continue;
          }

          // Eternal Mangekyou Sharingan: chọn ngẫu nhiên 1 trong 3 hiệu ứng → debuff đối thủ ngay
          if (handler === "eternal_mangekyou_random_effect") {
            const emOptions: Array<{
              stat: keyof typeof selfBaseStats;
              label: string;
              effect: string;
            }> = [
              { stat: "dur", label: "DUR", effect: "Amaterasu" },
              { stat: "iq", label: "IQ", effect: "Tsukuyomi" },
              { stat: "str", label: "STR", effect: "Susanoo" },
            ];
            const chosen = emOptions[Math.floor(Math.random() * 3)];
            // Debuff applied to opponent base stats
            preCombatEvents.push({
              player: oppSide,
              source: srcName,
              description: `${chosen.effect} — -6 ${chosen.label} (Eternal Mangekyou Sharingan từ ${player.name ?? playerSide})`,
              type: "stat_debuff",
            });
            continue;
          }

          // Uno Reverse Card: log info — engine phải đảo chiều debuff khi tính stat
          if (handler === "uno_reverse_card_swap_debuffs") {
            preCombatEvents.push({
              player: playerSide,
              source: srcName,
              description: `[Uno Reverse Card] Debuff từ đối thủ bị phản lại chính đối thủ và ngược lại (GM xử lý khi tính stat)`,
              type: "info",
            });
            continue;
          }

          // Enhanced Hearing: kiểm tra opp weapon (nhạc cụ) → -1 all; opp power (âm thanh) → -2 all
          if (
            handler === "enhanced_hearing_instrument_check" ||
            handler === "enhanced_hearing_sound_power_check"
          ) {
            const INSTRUMENT_NAMES = [
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
            const SOUND_POWERS_LIST = [
              "zoltraak",
              "rickrolling",
              "music",
              "sound",
              "melody",
              "siren",
              "bard",
              "singer",
            ];
            const oppPlayer = playerSide === "player1" ? player2 : player1;
            const oppNo = oppPlayer.no;
            const oppWeapons: any[] = (oppChar as any)?.weapons || [];
            const oppPowerNames: string[] = (oppChar?.powers || [])
              .filter((p: any) => !p?.isLost)
              .filter((p: any) => {
                const pname = typeof p === "string" ? p : (p?.name ?? "");
                return !effectiveDisabledItems.has(`${oppNo}-power-${pname}`);
              })
              .map((p: any) =>
                (typeof p === "string" ? p : (p?.name ?? "")).toLowerCase(),
              );
            const hasInstrument = oppWeapons.some((w: any) => {
              if (w?.isLost) return false;
              const wname = typeof w === "string" ? w : (w?.name ?? "");
              if (effectiveDisabledItems.has(`${oppNo}-weapon-${wname}`))
                return false;
              if (wname.toLowerCase().includes("không dùng được")) return false;
              return INSTRUMENT_NAMES.some((inst) =>
                wname.toLowerCase().includes(inst),
              );
            });
            const hasSoundPower = oppPowerNames.some((p) =>
              SOUND_POWERS_LIST.some((sp) => p.includes(sp)),
            );
            if (handler === "enhanced_hearing_instrument_check") {
              if (hasInstrument) {
                for (const s of _ALL_STAT_KEYS)
                  applyStatDelta(selfBaseStats, s, -1);
                preCombatEvents.push({
                  player: playerSide,
                  source: srcName,
                  description: `Đối thủ dùng nhạc cụ → -1 tất cả stats (Enhanced Hearing)`,
                  type: "stat_debuff",
                });
              } else {
                preCombatEvents.push({
                  player: playerSide,
                  source: srcName,
                  description: `Đối thủ không dùng nhạc cụ → không áp dụng (Enhanced Hearing)`,
                  type: "info",
                });
              }
            } else {
              if (hasSoundPower) {
                for (const s of _ALL_STAT_KEYS)
                  applyStatDelta(selfBaseStats, s, -2);
                preCombatEvents.push({
                  player: playerSide,
                  source: srcName,
                  description: `Đối thủ có power âm thanh → -2 tất cả stats (Enhanced Hearing)`,
                  type: "stat_debuff",
                });
              } else {
                preCombatEvents.push({
                  player: playerSide,
                  source: srcName,
                  description: `Đối thủ không có power âm thanh → không áp dụng (Enhanced Hearing)`,
                  type: "info",
                });
              }
            }
            continue;
          }

          // Andúril: vs evil race, +1 điểm khởi đầu per 3 summons
          if (handler === "anduril_evil_race_bonus") {
            const ANDURIL_EVIL = [
              "demon",
              "vampire",
              "spirit",
              "orc",
              "skeleton",
              "goblin",
            ];
            const oppRace = getEffectiveRace(oppChar);
            if (!ANDURIL_EVIL.includes(oppRace)) {
              preCombatEvents.push({
                player: playerSide,
                source: srcName,
                description: `Andúril: Đối thủ không phải evil race (${oppChar?.race?.race || "?"}) → không áp dụng`,
                type: "info",
              });
            } else {
              const summonCount = (player.character?.summons || []).filter(
                (s: any) => !s?.isLost,
              ).length;
              const bonusPoints = Math.floor(summonCount / 3);
              if (bonusPoints <= 0) {
                preCombatEvents.push({
                  player: playerSide,
                  source: srcName,
                  description: `Andúril: vs ${oppChar?.race?.race}, chỉ có ${summonCount} Summon (cần ≥3) → không có điểm bonus`,
                  type: "info",
                });
              } else {
                preCombatEvents.push({
                  player: playerSide,
                  source: srcName,
                  description: `Andúril: vs ${oppChar?.race?.race}, ${summonCount} Summons → +${bonusPoints} điểm khởi đầu`,
                  type: "stat_boost",
                });
              }
            }
            continue;
          }

          // Affection: đảo (inversion = 11 - value) 1 chỉ số ngẫu nhiên của cả 2
          if (effectType === "stat_inversion" && srcName === "Affection") {
            // Chỉ xử lý 1 lần (player1 kích hoạt, player2 skip)
            const alreadyProcessed = preCombatEvents.some(
              (e) => e.source === "Affection" && e.type !== "info",
            );
            if (!alreadyProcessed) {
              const statKeys = _ALL_STAT_KEYS as (keyof CharacterStats)[];
              const randomStat =
                statKeys[Math.floor(Math.random() * statKeys.length)];
              const p1Val = Number(selfBaseStats[randomStat]) || 0;
              const p2Val = Number(oppBaseStats[randomStat]) || 0;
              const p1New = 11 - p1Val;
              const p2New = 11 - p2Val;
              (selfBaseStats as any)[randomStat] = p1New;
              (oppBaseStats as any)[randomStat] = p2New;
              preCombatEvents.push({
                player: playerSide,
                source: srcName,
                description: `Affection: Đảo ${randomStat.toUpperCase()} của cả hai → ${playerSide === "player1" ? "P1" : "P2"}: ${p1Val} → ${p1New}, ${playerSide === "player1" ? "P2" : "P1"}: ${p2Val} → ${p2New}`,
                type: "stat_boost",
              });
            }
            continue;
          }

          // Luck Manipulation: từ vòng 64 (pvpWins ≥ 2) → 15% +1 all, 5% +2 all
          if (handler === "luck_manipulation_round_64_check") {
            const pvpWins =
              (player.character as any)?.tournament?.pvpWins ??
              (player.character as any)?.pvpWins ??
              0;
            if (pvpWins < 2) {
              preCombatEvents.push({
                player: playerSide,
                source: srcName,
                description: `Chưa đến vòng 64 (pvpWins=${pvpWins}) → không áp dụng (Luck Manipulation)`,
                type: "info",
              });
            } else {
              // Only run once (two effects registered, skip second if already logged)
              const alreadyLogged = preCombatEvents.some(
                (e) =>
                  e.source === srcName &&
                  e.player === playerSide &&
                  e.type !== "info",
              );
              if (!alreadyLogged) {
                const roll = Math.random() * 100;
                if (roll < 5) {
                  for (const s of _ALL_STAT_KEYS)
                    applyStatDelta(selfBaseStats, s, 2);
                  preCombatEvents.push({
                    player: playerSide,
                    source: srcName,
                    description: `+2 tất cả stats (Luck Manipulation — 5%, roll: ${roll.toFixed(1)}%)`,
                    type: "stat_boost",
                  });
                } else if (roll < 20) {
                  for (const s of _ALL_STAT_KEYS)
                    applyStatDelta(selfBaseStats, s, 1);
                  preCombatEvents.push({
                    player: playerSide,
                    source: srcName,
                    description: `+1 tất cả stats (Luck Manipulation — 15%, roll: ${roll.toFixed(1)}%)`,
                    type: "stat_boost",
                  });
                } else {
                  preCombatEvents.push({
                    player: playerSide,
                    source: srcName,
                    description: `Không kích hoạt (Luck Manipulation — roll: ${roll.toFixed(1)}%)`,
                    type: "info",
                  });
                }
              }
            }
            continue;
          }
        }
      };

      buildPreCombatEvents(
        player1,
        "player1",
        init.p1Stats,
        player2.character ?? null,
        "player2",
        init.p2Stats,
      );
      buildPreCombatEvents(
        player2,
        "player2",
        init.p2Stats,
        player1.character ?? null,
        "player1",
        init.p1Stats,
      );

      if (preCombatEvents.length > 0) {
        init.roundLogs.push({
          roundIndex: -1,
          statLabel: "PRE-COMBAT",
          statKey: "",
          p1ValueUsed: 0,
          p2ValueUsed: 0,
          winner: "tie",
          p1Score: init.p1Score,
          p2Score: init.p2Score,
          events: preCombatEvents,
          pointChanges: [],
          carryOverToNext: [],
        });
      }
    }

    setStepState(init);
    setStepRoundIndex(0);
  };

  return { startCombat };
}
