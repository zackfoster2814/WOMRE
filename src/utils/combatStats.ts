// ============================================================================
// BattleZone pure combat utility functions (no React)
// ============================================================================
import { Character, CharacterStats } from "../types/character";
import { EffectResolver, getEffectiveRace } from "../effects/resolver";
import { EffectRegistry } from "../effects/registry";
import { RACE_TIERS, STAT_NAME_MAP, _ALL_STAT_KEYS } from "../constants/battleZone";
import { InventoryItem } from "../types/battleZone";

/** Tính raceTier cho tiebreak. Với Reincarnator: dùng sub-race (race thực) để so sánh. */
export function getRaceTierForTiebreak(char: {
  race?: { race?: string; subRace?: string };
}): number {
  const mainRace = char.race?.race || "Human";
  if (mainRace === "Reincarnator") {
    const subRaceRaw = char.race?.subRace || "";
    const subRaceName = subRaceRaw.split("(")[0].trim();
    if (subRaceName && RACE_TIERS[subRaceName] !== undefined) {
      return RACE_TIERS[subRaceName];
    }
  }
  return RACE_TIERS[mainRace] ?? 15;
}

export function getRaceForStatRoll(
  character: { race?: { race?: string; subRace?: string } } | undefined,
): string {
  const race = (character?.race?.race || "").toLowerCase();
  if (race === "skeleton") {
    const sub = (character?.race?.subRace || "")
      .replace(/[()]/g, "")
      .trim()
      .toLowerCase();
    return sub || "human";
  }
  return race;
}

export function normalizeStatKey(stat: string): keyof CharacterStats {
  return STAT_NAME_MAP[stat.toLowerCase()] ?? (stat as keyof CharacterStats);
}

/**
 * Unified persistent stat applier.
 */
export function applyStatDelta(
  stats: CharacterStats,
  statKey: keyof CharacterStats,
  delta: number,
): void {
  stats[statKey] = (stats[statKey] || 0) + delta;
}

/**
 * Resolve effect stat string ("all"/"highest"/"lowest"/"random"/specific) → list of keys.
 */
export function resolveStatTargets(
  stat: string | undefined,
  currentStats: CharacterStats,
): (keyof CharacterStats)[] {
  if (!stat || stat === "all") return _ALL_STAT_KEYS;
  if (stat === "highest") {
    const maxVal = Math.max(..._ALL_STAT_KEYS.map((k) => currentStats[k] || 0));
    return [
      _ALL_STAT_KEYS.find((k) => (currentStats[k] || 0) === maxVal) ?? "str",
    ];
  }
  if (stat === "lowest") {
    const minVal = Math.min(..._ALL_STAT_KEYS.map((k) => currentStats[k] || 0));
    return [
      _ALL_STAT_KEYS.find((k) => (currentStats[k] || 0) === minVal) ?? "str",
    ];
  }
  if (stat === "random") {
    return [_ALL_STAT_KEYS[Math.floor(Math.random() * _ALL_STAT_KEYS.length)]];
  }
  return [normalizeStatKey(stat)];
}

export function buildInventoryList(char: Character): InventoryItem[] {
  const items: InventoryItem[] = [];
  const add = (sourceType: string, name: string, description?: string) => {
    if (!name) return;
    const desc =
      description ??
      EffectRegistry.get(sourceType as any, name)?.description ??
      "";
    items.push({ sourceType, name, description: desc });
  };
  if (char.race?.race) add("race", char.race.race);
  if (char.race?.subRace) add("sub_race", char.race.subRace);
  for (const a of Array.isArray(char.archetypes) ? char.archetypes : [])
    add("archetype", a);
  for (const na of Array.isArray(char.nestedArchetypes)
    ? char.nestedArchetypes
    : []) {
    if (na.subType) add("archetype_sub", na.subType);
  }
  for (const q of Array.isArray(char.quirks) ? char.quirks : []) {
    if (!q.isLost) add("quirk", q.name);
  }
  for (const p of Array.isArray(char.powers) ? char.powers : []) {
    if (!p.isLost) add("power", typeof p === "string" ? p : p.name);
  }
  for (const s of Array.isArray(char.summons) ? char.summons : []) {
    if (!s.isLost) add("summon", typeof s === "string" ? s : s.name);
  }
  for (const w of Array.isArray(char.weapons) ? char.weapons : []) {
    const name = typeof w === "string" ? w : w?.name;
    if (name) add("weapon", name);
  }
  const allGear = [
    ...(Array.isArray(char.gear?.normalGear) ? char.gear!.normalGear : []),
    ...(Array.isArray(char.gear?.legacyGear) ? char.gear!.legacyGear : []),
  ];
  for (const g of allGear) if (!g.isLost) add("gear", g.name);
  const runes = Array.isArray(char.runes?.runes) ? char.runes!.runes : [];
  for (const r of runes) if (!r.isLost) add("rune", r.name);
  if (char.runes?.runeword) add("runeword", char.runes.runeword);
  for (const h of Array.isArray(char.houses) ? char.houses : []) {
    if (!h.isLost) add("house", h.name);
  }
  for (const nh of Array.isArray(char.nestedHouses) ? char.nestedHouses : []) {
    if (!nh.isLost && nh.subType && !nh.subTypeIsLost)
      add("house_sub", nh.subType);
  }
  for (const cd of Array.isArray(char.charDevs) ? char.charDevs : []) {
    if (!cd.isLost) add("char_dev", cd.name);
  }
  for (const l of Array.isArray(char.lover) ? char.lover : []) {
    if (!l.isLost) add("lover", l.name);
  }
  return items;
}

/** Tính lại stats của character có loại trừ các disabled sources */
export function calcStatsWithDisabled(
  char: Character,
  playerNo: number,
  disabledItems: Set<string>,
  allCharacters?: Character[],
): CharacterStats {
  // Dùng cùng pipeline với calculateCharacterEffects (tab Hiệu ứng) để đảm bảo đồng bộ:
  // gatherEffectSources → mark disabled → resolveImmediateEffects
  const sources = EffectResolver.gatherEffectSources(char, allCharacters);
  for (const src of sources) {
    const key = `${playerNo}-${src.type}-${src.name}`;
    if (disabledItems.has(key)) {
      src.isDisabled = true;
    }
  }
  const baseStats = {
    strength: char.stats.str,
    speed: char.stats.spd,
    durability: char.stats.dur,
    iq: char.stats.iq,
    biq: char.stats.biq,
    ma: char.stats.ma,
  };
  const result = EffectResolver.resolveImmediateEffects(
    sources,
    baseStats,
    { isPvE: false },
    char,
    allCharacters,
  );

  const final: CharacterStats = {
    str: result.totalStats.strength,
    spd: result.totalStats.speed,
    dur: result.totalStats.durability,
    iq: result.totalStats.iq,
    biq: result.totalStats.biq,
    ma: result.totalStats.ma,
  };


  const charRace = (char as any).race?.race?.toLowerCase() || "";
  if (charRace === "skeleton") {
    final.iq = 1;
  }

  const hasSlowMetabolism =
    ((char as any).quirks || [])
      .filter((q: any) => !q.isLost)
      .some((q: any) => (q.name ?? "").toLowerCase() === "slow metabolism") &&
    !disabledItems.has(`${playerNo}-quirk-Slow Metabolism`);
  if (hasSlowMetabolism) {
    const spdDecrease = result.statModifiers
      .filter(
        (m: any) => (m.stat === "speed" || m.stat === "spd") && m.value < 0,
      )
      .reduce((sum: number, m: any) => sum + m.value, 0);
    final.spd = char.stats.spd + spdDecrease;
  }

  return final;
}

export function applyBeforeCombatStatMods(
  base: CharacterStats,
  char: Character,
  charNo: number,
  disabledItems: Set<string>,
  opponentRace: string,
  targetFilter: "self" | "opponent",
  selfRaceTier?: number,
  opponentRaceTier?: number,
  opponentChar?: Character | null,
): void {
  const effOpponentRace = getEffectiveRace(opponentChar, opponentRace);
  const fx = EffectResolver.calculateCharacterEffects(char, { isPvE: false });
  for (const ce of fx.combatEffects) {
    if (ce.isActive === false) continue;
    if (ce.effect?.timing !== "before_combat") continue;
    const handler = (ce.effect as any).customHandler;
    if (!handler) {
      if (ce.effect?.type !== "stat_modifier" && ce.effect?.type !== "debuff")
        continue;
      if (ce.effect?.value === undefined || !ce.effect?.stat) continue;
    }
    if ((ce.effect.target || "self") !== targetFilter) continue;
    if (
      handler &&
      handler !== "kings_landing_penalty_check" &&
      handler !== "banana_peel_iq_compare" &&
      handler !== "sarastro_flute_debuff" &&
      handler !== "frost_fingers_per_gear"
    )
      continue;
    if (handler === "kings_landing_penalty_check") {
      const selfRace = (char as any).race?.race?.toLowerCase() ?? "";
      const exemptRaces = ["god", "demi god", "demi-god", "demigod"];
      const isExemptByRace = exemptRaces.some((r) => selfRace.includes(r));
      const archetypes: string[] = ((char as any).archetypes || []).map(
        (a: any) => (typeof a === "string" ? a : (a?.name ?? "")),
      );
      const isDevotee = archetypes.some((a: string) =>
        a.toLowerCase().includes("devotee"),
      );
      if (isExemptByRace || isDevotee) continue;
      applyStatDelta(base, "iq", -10);
      continue;
    }
    if (handler === "banana_peel_iq_compare") {
      const srcName = ce.source?.name || "?";
      const srcType = ce.source?.type || "?";
      if (disabledItems.has(`${charNo}-${srcType}-${srcName}`)) continue;
      if (targetFilter !== "self") continue;
      const selfBaseIQ = (char as any).stats?.iq ?? 0;
      const oppBaseIQ = (opponentChar as any)?.stats?.iq ?? 0;
      if (selfBaseIQ > oppBaseIQ) {
        for (const k of _ALL_STAT_KEYS) applyStatDelta(base, k, 1);
      } else if (selfBaseIQ < oppBaseIQ) {
        for (const k of _ALL_STAT_KEYS) applyStatDelta(base, k, -1);
      }
      continue;
    }
    if (handler === "sarastro_flute_debuff") {
      if (targetFilter !== "opponent") continue;
      const srcName = ce.source?.name || "?";
      const srcType = ce.source?.type || "?";
      if (disabledItems.has(`${charNo}-${srcType}-${srcName}`)) continue;
      const oppPowers = ((opponentChar as any)?.powers || []).filter(
        (p: any) => !p?.isLost,
      );
      const debuff = Math.floor(oppPowers.length / 3);
      if (debuff > 0) {
        for (const k of _ALL_STAT_KEYS) applyStatDelta(base, k, -debuff);
      }
      continue;
    }
    if (handler === "frost_fingers_per_gear") {
      if (targetFilter !== "opponent") continue;
      const srcName = ce.source?.name || "?";
      const srcType = ce.source?.type || "?";
      if (disabledItems.has(`${charNo}-${srcType}-${srcName}`)) continue;
      const oppNormalGear = (
        (opponentChar as any)?.gear?.normalGear || []
      ).filter((g: any) => !g?.isLost);
      const oppLegacyGear = (
        (opponentChar as any)?.gear?.legacyGear || []
      ).filter((g: any) => !g?.isLost);
      const gearCount = oppNormalGear.length + oppLegacyGear.length;
      const penalty = Math.min(gearCount, 5);
      if (penalty > 0) {
        for (let i = 0; i < penalty; i++) {
          let highestKey: keyof CharacterStats = _ALL_STAT_KEYS[0];
          let highestVal = base[_ALL_STAT_KEYS[0]] ?? 0;
          for (const k of _ALL_STAT_KEYS) {
            if ((base[k] ?? 0) > highestVal) {
              highestVal = base[k] ?? 0;
              highestKey = k;
            }
          }
          applyStatDelta(base, highestKey, -1);
        }
      }
      continue;
    }

    const srcName = ce.source?.name || "?";
    const srcType = ce.source?.type || "?";
    if (disabledItems.has(`${charNo}-${srcType}-${srcName}`)) continue;

    const conditions: any[] = (ce.effect as any).conditions || [];
    if (conditions.some((c: any) => c.type === "probability")) continue;
    const conditionMet = conditions.every((cond: any) => {
      if (cond.type === "race_match" && cond.races) {
        return cond.races.some(
          (r: string) => r.toLowerCase() === effOpponentRace,
        );
      }
      if (cond.type === "race_match" && cond.excludeRaces) {
        return !cond.excludeRaces.some(
          (r: string) => r.toLowerCase() === effOpponentRace,
        );
      }
      if (cond.type === "race_tier_compare") {
        if (
          !cond.tierOperator ||
          selfRaceTier === undefined ||
          opponentRaceTier === undefined
        )
          return false;
        if (cond.tierOperator === "<") return selfRaceTier < opponentRaceTier;
        if (cond.tierOperator === ">") return selfRaceTier > opponentRaceTier;
        if (cond.tierOperator === "=") return selfRaceTier === opponentRaceTier;
        return false;
      }
      if (
        cond.type === "stat_compare" &&
        cond.stat &&
        cond.compareWith === "opponent" &&
        opponentChar
      ) {
        const selfStatVal =
          (char as any).stats?.[cond.stat] ?? (base as any)[cond.stat] ?? 0;
        const oppStatVal = (opponentChar as any).stats?.[cond.stat] ?? 0;
        if (cond.operator === ">") return selfStatVal > oppStatVal;
        if (cond.operator === "<") return selfStatVal < oppStatVal;
        if (cond.operator === ">=") return selfStatVal >= oppStatVal;
        if (cond.operator === "<=") return selfStatVal <= oppStatVal;
        if (cond.operator === "=") return selfStatVal === oppStatVal;
        return false;
      }
      if (
        cond.type === "has_item" &&
        cond.itemType === "archetype" &&
        cond.itemName
      ) {
        const checkChar = cond.checkTarget === "opponent" ? opponentChar : char;
        const archetypeList: string[] = Array.isArray(
          (checkChar as any)?.archetypes,
        )
          ? (checkChar as any).archetypes.map((a: any) =>
              typeof a === "string" ? a : (a?.name ?? ""),
            )
          : [];
        return archetypeList.some(
          (a) => a.toLowerCase() === cond.itemName.toLowerCase(),
        );
      }
      return true;
    });
    if (!conditionMet) continue;

    const val = ce.effect.value!;
    const targets = resolveStatTargets(ce.effect.stat, base);
    for (const k of targets) applyStatDelta(base, k, val);
  }
}

export function calcStatsWithBeforeCombat(
  char: Character,
  playerNo: number,
  disabledItems: Set<string>,
  opponentRace: string,
  opponentChar: Character | null,
  opponentNo: number,
  opponentDisabledItems: Set<string>,
  selfRace: string,
  selfRaceTier?: number,
  opponentRaceTier?: number,
  allCharacters?: Character[],
  opponentHasUnoReverse?: boolean,
): CharacterStats {
  const base = calcStatsWithDisabled(char, playerNo, disabledItems, allCharacters);
  applyBeforeCombatStatMods(
    base,
    char,
    playerNo,
    disabledItems,
    opponentRace,
    "self",
    selfRaceTier,
    opponentRaceTier,
    opponentChar,
  );

  const hasUnoReverse =
    ((char as any).powers || [])
      .filter((pw: any) => !pw.isLost)
      .some(
        (pw: any) =>
          (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase() ===
          "uno reverse card",
      ) && !disabledItems.has(`${playerNo}-power-Uno Reverse Card`);

  const selfHasFairDuel =
    ((char as any).powers || [])
      .filter((pw: any) => !pw.isLost)
      .some(
        (pw: any) =>
          (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase().startsWith(
            "fair duel",
          ),
      ) && !([...disabledItems].some(k => k.startsWith(`${playerNo}-power-Fair Duel`)));
  const oppHasFairDuelBC = opponentChar
    ? ((opponentChar as any).powers || [])
        .filter((pw: any) => !pw.isLost)
        .some(
          (pw: any) =>
            (typeof pw === "string" ? pw : (pw?.name ?? "")).toLowerCase().startsWith(
              "fair duel",
            ),
        ) && !([...opponentDisabledItems].some(k => k.startsWith(`${opponentNo}-power-Fair Duel`)))
    : false;
  const fairDuelActiveBC = selfHasFairDuel || oppHasFairDuelBC;

  if (opponentChar && !hasUnoReverse && !opponentHasUnoReverse && !fairDuelActiveBC) {
    applyBeforeCombatStatMods(
      base,
      opponentChar,
      opponentNo,
      opponentDisabledItems,
      selfRace,
      "opponent",
      opponentRaceTier,
      selfRaceTier,
      char,
    );
  }

  if (hasUnoReverse) {
    applyBeforeCombatStatMods(
      base,
      char,
      playerNo,
      disabledItems,
      opponentRace,
      "opponent",
      selfRaceTier,
      opponentRaceTier,
      opponentChar,
    );
  }

  const charRaceBC = (char as any).race?.race?.toLowerCase() || "";
  if (charRaceBC === "skeleton") {
    base.iq = 1;
  }

  const archetypes: string[] = (char as any).archetypes || [];
  const slayerEntry = archetypes.find((a: string) =>
    /^slayer\s*-/i.test(a.trim()),
  );
  if (slayerEntry) {
    const match = slayerEntry.match(/^slayer\s*-\s*([^\s(]+)/i);
    const targetRace = match ? match[1].toLowerCase() : "";
    if (targetRace && opponentRace.toLowerCase() === targetRace) {
      applyStatDelta(base, "str", 2);
      applyStatDelta(base, "biq", 3);
      applyStatDelta(base, "ma", 2);
    }
  }


  return base;
}

/** Trả về danh sách effects per-round (onWin/onLose/onTie) của một player.
 *  Pure function — nhận disabledItems thay vì đọc từ closure. */
export function getPerRoundEffects(
  char: Character | undefined,
  playerNo: number | undefined,
  disabledItems: Set<string>,
): { onWin: string[]; onLose: string[]; onTie: string[] } {
  if (!char) return { onWin: [], onLose: [], onTie: [] };

  const isEffectActive = (targetName: string) => {
    if (playerNo === undefined) return true;
    const items = buildInventoryList(char);
    const cleanTarget = targetName.toLowerCase();
    const matching = items.filter((it) => {
      const cleanName = it.name.replace(/\s*\(.*?\)/g, "").trim().toLowerCase();
      return cleanName === cleanTarget;
    });
    if (matching.length === 0) return false;
    return matching.some(
      (it) => !disabledItems.has(`${playerNo}-${it.sourceType}-${it.name}`),
    );
  };

  const sources = [
    ...(char.quirks || [])
      .filter((q) => !q.isLost)
      .map((q) => q.name.replace(/\s*\(.*?\)/g, "").trim().toLowerCase()),
    ...(char.archetypes || []).map((a) =>
      a.replace(/\s*\(.*?\)/g, "").trim().toLowerCase(),
    ),
    ...((char as any).nestedArchetypes || [])
      .filter((na: any) => !na.isLost && na.subType)
      .map((na: any) => (na.subType as string).toLowerCase()),
    ...(char.powers || [])
      .filter((p) => (typeof p === "object" ? !p.isLost : true))
      .map((p) =>
        (typeof p === "string" ? p : p.name)
          .replace(/\s*\(.*?\)/g, "")
          .trim()
          .toLowerCase(),
      ),
    ...(char.weapons || [])
      .filter((w: any) => !w.isLost && w.usable !== false)
      .map((w: any) =>
        (typeof w === "string" ? w : (w?.name ?? ""))
          .replace(/\s*\(.*?\)/g, "")
          .trim()
          .toLowerCase(),
      ),
    ...((char as any).charDevs || [])
      .filter((c: any) => !c.isLost)
      .flatMap((c: any) => {
        const name: string = typeof c === "string" ? c : (c?.name ?? "");
        const match = name.match(/\(([^)]+)\)/);
        return match ? [match[1].toLowerCase()] : [];
      }),
  ];

  const onWin: string[] = [];
  const onLose: string[] = [];
  const onTie: string[] = [];

  if (sources.some((s) => s.includes("critical strike")) && isEffectActive("Critical Strike"))
    onWin.push("Critical Strike");
  if (sources.some((s) => s.includes("evasion")) && isEffectActive("Evasion"))
    onLose.push("Evasion");
  if (sources.some((s) => s === "gambler") && isEffectActive("Gambler"))
    onWin.push("Gambler");
  if (sources.some((s) => s === "cruelty") && isEffectActive("Cruelty"))
    onTie.push("Cruelty");
  if (sources.some((s) => s === "blind") && isEffectActive("Blind"))
    onWin.push("Blind");
  if (sources.some((s) => s === "mute") && isEffectActive("Mute"))
    onLose.push("Mute");
  if (sources.some((s) => s === "bash") && isEffectActive("Bash"))
    onWin.push("Bash");
  const runeword = (char.runes?.runeword || "").toLowerCase();
  if (runeword === "luminescence" && isEffectActive("Luminescence"))
    onWin.push("Luminescence");
  if (runeword === "pennyworthy") {
    onWin.push("Pennyworthy-Win");
    onLose.push("Pennyworthy-Lose");
  }
  const rangerColor = (char.nestedArchetypes || []).find(
    (na: any) => na.name === "Power Ranger" && na.subType,
  )?.subType;
  if (rangerColor === "Red") onWin.push("Ranger-Red");
  if (rangerColor === "Blue") onWin.push("Ranger-Blue");
  if (rangerColor === "Black") onWin.push("Ranger-Black");
  if (rangerColor === "Yellow") onWin.push("Ranger-Yellow");
  if (rangerColor === "Pink") onWin.push("Ranger-Pink");
  if (rangerColor === "Silver") onWin.push("Ranger-Silver");
  if (sources.some((s) => s === "bloodthirsty") && isEffectActive("Bloodthirsty"))
    onWin.push("Bloodthirsty");
  if (sources.some((s) => s === "divine smite") && isEffectActive("Divine Smite"))
    onWin.push("Divine Smite");
  if (sources.some((s) => s === "yamato blade") && isEffectActive("Yamato Blade")) {
    onWin.push("Yamato Blade-SPD");
    onWin.push("Yamato Blade-MA");
  }
  if (sources.some((s) => s === "cautious") && isEffectActive("Cautious"))
    onWin.push("Cautious-Self");
  if (sources.some((s) => s === "hunter's mark") && isEffectActive("Hunter's Mark"))
    onWin.push("Hunter's Mark");
  if (sources.some((s) => s === "golden parry") && isEffectActive("Golden Parry"))
    onLose.push("Golden Parry");
  if (sources.some((s) => s === "misericorde") && isEffectActive("Misericorde"))
    onLose.push("Misericorde");
  if (sources.some((s) => s === "the sand of time") && isEffectActive("The Sand of Time"))
    onLose.push("The Sand of Time");
  if (sources.some((s) => s === "red") && !onWin.includes("Ranger-Red"))
    onWin.push("Ranger-Red");
  if (sources.some((s) => s === "blue") && !onWin.includes("Ranger-Blue"))
    onWin.push("Ranger-Blue");
  if (sources.some((s) => s === "black") && !onWin.includes("Ranger-Black"))
    onWin.push("Ranger-Black");
  if (sources.some((s) => s === "yellow") && !onWin.includes("Ranger-Yellow"))
    onWin.push("Ranger-Yellow");
  if (sources.some((s) => s === "pink") && !onWin.includes("Ranger-Pink"))
    onWin.push("Ranger-Pink");
  if (sources.some((s) => s === "silver") && !onWin.includes("Ranger-Silver"))
    onWin.push("Ranger-Silver");

  return { onWin, onLose, onTie };
}
