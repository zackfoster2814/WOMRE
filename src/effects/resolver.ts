/**
 * Effect Resolver
 *
 * Resolve và apply effects vào character.
 * Tính toán total stats sau khi áp dụng tất cả effects.
 */

import type {
  Effect,
  EffectSource,
  EffectSourceType,
  CharacterStats,
  StatName,
  DynamicStatTarget,
  CharacterEffects,
  ResolvedEffect,
  CombatContext,
  Condition,
} from "./types";
import { EffectRegistry } from "./registry";
import type { Character } from "../types/character";
import { HandlerRegistry } from "./handlers/registry";
import type { ImmediateHandlerContext } from "./handlers/types";

export type { Condition, CharacterEffects } from "./types";

// ============================================================================
// RACE UTILITIES
// ============================================================================

/**
 * Lấy race hiệu lực để check condition.
 * Nếu race là Reincarnator thì dùng actualRace (phần sau "->") thay thế.
 */
export function getEffectiveRace(char: any, fallbackRace?: string): string {
  const race: string = (char?.race?.race || fallbackRace || "").toLowerCase().trim();
  if (race === "reincarnator") {
    const actual = (char?.race?.actualRace || "").trim().toLowerCase();
    if (actual) return actual;
  }
  return race;
}

// ============================================================================
// STAT UTILITIES
// ============================================================================

const STAT_NAMES: StatName[] = [
  "strength",
  "speed",
  "durability",
  "iq",
  "biq",
  "ma",
];

// Map StatName to CharacterStats key
const STAT_NAME_TO_CHAR_KEY: Record<
  StatName,
  keyof import("../types/character").CharacterStats
> = {
  strength: "str",
  speed: "spd",
  durability: "dur",
  iq: "iq",
  biq: "biq",
  ma: "ma",
};

/**
 * Convert character stats format to our format
 */
export function convertStats(stats: {
  str: number;
  spd: number;
  dur: number;
  iq: number;
  biq: number;
  ma: number;
}): CharacterStats {
  return {
    strength: stats.str,
    speed: stats.spd,
    durability: stats.dur,
    iq: stats.iq,
    biq: stats.biq,
    ma: stats.ma,
  };
}

/**
 * Create empty stats
 */
export function emptyStats(): CharacterStats {
  return { strength: 0, speed: 0, durability: 0, iq: 0, biq: 0, ma: 0 };
}

/**
 * Clone stats
 */
export function cloneStats(stats: CharacterStats): CharacterStats {
  return { ...stats };
}

/**
 * Find lowest stat
 */
export function findLowestStat(stats: CharacterStats): StatName {
  let lowest: StatName = "strength";
  let lowestValue = stats.strength;

  for (const stat of STAT_NAMES) {
    if (stats[stat] < lowestValue) {
      lowestValue = stats[stat];
      lowest = stat;
    }
  }

  return lowest;
}

/**
 * Find highest stat
 */
export function findHighestStat(stats: CharacterStats): StatName {
  let highest: StatName = "strength";
  let highestValue = stats.strength;

  for (const stat of STAT_NAMES) {
    if (stats[stat] > highestValue) {
      highestValue = stats[stat];
      highest = stat;
    }
  }

  return highest;
}

/**
 * Get random stat
 */
export function getRandomStat(): StatName {
  return STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
}

/**
 * Resolve dynamic stat target to actual stat name(s)
 */
export function resolveStatTarget(
  target: DynamicStatTarget,
  stats: CharacterStats,
): StatName[] {
  switch (target) {
    case "all":
      return [...STAT_NAMES];
    case "lowest":
      return [findLowestStat(stats)];
    case "highest":
      return [findHighestStat(stats)];
    case "random":
      return [getRandomStat()];
    case "odd":
      return ["strength", "durability", "biq"]; // 1st, 3rd, 5th
    case "even":
      return ["speed", "iq", "ma"]; // 2nd, 4th, 6th
    default:
      return [target as StatName];
  }
}

// ============================================================================
// EFFECT RESOLVER CLASS
// ============================================================================

export class EffectResolver {
  /**
   * Normalize PvP reward name to match registry
   * Data files may use abbreviated names like "+1 Spd" but registry has "+1 Speed"
   */
  private static normalizePvPRewardName(name: string): string {
    // Map abbreviated/variant stat names to full names used in registry
    const statAbbreviations: Record<string, string> = {
      str: "Strength",
      strength: "Strength",
      spd: "Speed",
      speed: "Speed",
      dur: "Durability",
      dura: "Durability",
      durability: "Durability",
      iq: "IQ",
      biq: "BIQ",
      ma: "Martial Arts",
      "martial arts": "Martial Arts",
    };

    // Pattern: +/-NUMBER STAT_ABBREV (e.g., "+1 Spd", "+2 Dur")
    const match = name.match(/^([+-]?\d+)\s+(.+)$/i);
    if (match) {
      const value = match[1];
      const stat = match[2].toLowerCase().trim();
      if (statAbbreviations[stat]) {
        return `${value} ${statAbbreviations[stat]}`;
      }
    }

    return name;
  }

  /**
   * Parse stat bonus string into an Effect
   * Examples: "+4 Dura", "+6 Str", "-2 IQ", "+1 All"
   */
  private static parseStatBonus(bonusStr: string): Effect | null {
    // Pattern: +/-NUMBER STAT_NAME
    const match = bonusStr.match(/^([+-]?\d+)\s+(\w+)/i);
    if (!match) return null;

    const value = parseInt(match[1]);
    const statStr = match[2].toLowerCase();

    // Map stat abbreviations to DynamicStatTarget
    const statMap: Record<string, DynamicStatTarget> = {
      str: "strength",
      strength: "strength",
      spd: "speed",
      speed: "speed",
      dur: "durability",
      dura: "durability",
      durability: "durability",
      iq: "iq",
      biq: "biq",
      ma: "ma",
      all: "all",
    };

    const stat = statMap[statStr];
    if (!stat) return null;

    return {
      type: "stat_modifier",
      stat,
      value,
      timing: "immediate",
      target: "self",
    };
  }

  /**
   * Parse charDev name to extract base name and metadata
   * Format examples:
   * - "Metamorphosis (Pennyworthy Deny AIDS) -> Nhận +7 Dura"
   * - "Simple CharDev"
   */
  private static parseCharDevName(fullName: string): {
    baseName: string;
    denyAids: boolean;
    statBonus: { stat: string; value: number } | null;
  } {
    let baseName = fullName;
    let denyAids = false;
    let statBonus: { stat: string; value: number } | null = null;

    // Check for deny AIDS pattern
    if (/\(.*deny\s*aids.*\)/i.test(fullName)) {
      denyAids = true;
    }

    // Extract stat bonus from "-> Nhận +X Stat" or "-> +X Stat" or "-> -X All Stats" pattern
    const statBonusMatch = fullName.match(
      /->\s*(?:Nhận\s*)?([+-]\d+)\s+([\w\s]+?)(?:\s*$|\s*\()/i,
    );
    if (statBonusMatch) {
      const value = parseInt(statBonusMatch[1]);
      const statStr = statBonusMatch[2].trim().toLowerCase();

      // Map stat abbreviations
      const statMap: Record<string, string> = {
        str: "strength",
        strength: "strength",
        spd: "speed",
        speed: "speed",
        dur: "durability",
        dura: "durability",
        durability: "durability",
        iq: "iq",
        biq: "biq",
        ma: "ma",
        "all stats": "all",
        all: "all",
      };

      const stat = statMap[statStr];
      if (stat) {
        statBonus = { stat, value };
      }
    }

    // Extract base name (before any parentheses or arrows)
    // Special case: "Become a Power Ranger (Color)" — keep the full name including color
    if (/^Become a Power Ranger\s*\(/i.test(fullName)) {
      const colorMatch = fullName.match(
        /^(Become a Power Ranger\s*\([^)]+\))/i,
      );
      baseName = colorMatch ? colorMatch[1].trim() : "Become a Power Ranger";
    } else {
      const baseNameMatch = fullName.match(/^([^(->]+)/);
      if (baseNameMatch) {
        baseName = baseNameMatch[1].trim();
      }
    }

    return { baseName, denyAids, statBonus };
  }

  /**
   * Gather all effect sources from a character
   * @param allCharacters - Optional list of all characters, used to resolve cross-character effects (e.g., Cheater debuff on lovers)
   */
  static gatherEffectSources(
    character: Character,
    allCharacters?: Character[],
  ): EffectSource[] {
    const sources: EffectSource[] = [];

    // Race
    if (character.race?.race) {
      const raceEntry = EffectRegistry.get("race", character.race.race);
      if (raceEntry) {
        // If Giant bonus was pre-applied (e.g., due to Inversion), skip stat modifier effects
        const isGiantWithPreAppliedBonus =
          character.race.race === "Giant" && character.giantBonusApplied;
        const filteredEffects = isGiantWithPreAppliedBonus
          ? raceEntry.effects.filter((e) => e.type !== "stat_modifier")
          : raceEntry.effects;

        sources.push({
          type: "race",
          name: character.race.race,
          effects: filteredEffects,
          rawDescription: raceEntry.description,
          isActive: true,
        });
      }

      // Reincarnator: also apply the actual race's effects
      if (character.race.race === "Reincarnator" && character.race.actualRace) {
        const actualRaceEntry = EffectRegistry.get(
          "race",
          character.race.actualRace,
        );
        if (actualRaceEntry) {
          sources.push({
            type: "race",
            name: character.race.actualRace,
            effects: actualRaceEntry.effects,
            rawDescription: actualRaceEntry.description,
            isActive: true,
          });
        }
      }
    }

    // Sub-race (may contain multiple sub-races separated by " + ")
    if (character.race?.subRace) {
      // Split by " + " to handle cases like "Rice Shower + Agnes Tachyon"
      const subRaces = character.race.subRace
        .split(/\s*\+\s*/)
        .map((s) => s.trim())
        .filter((s) => s);

      for (const subRace of subRaces) {
        // Handle stack notation: "Eir (2)" → baseName="Eir", stackCount=2
        const stackMatch = subRace.match(/^(.+?)\s*\((\d+)\)$/);
        const baseName = stackMatch ? stackMatch[1].trim() : subRace;
        const stackCount = stackMatch ? parseInt(stackMatch[2]) : 1;

        const subRaceEntry = EffectRegistry.get("sub_race", baseName);
        if (subRaceEntry) {
          // For Goblin sub-races that are just numbers, display as "X goblins"
          let displayName = subRace;
          if (
            character.race?.race &&
            (character.race.race.toLowerCase() === "goblin" ||
              character.race.race.toLowerCase().includes("reincarnator")) &&
            /^\d+$/.test(subRace)
          ) {
            displayName = `${subRace} goblins`;
          }
          // Scale stat_modifier effects by Eir stack: Eir=+1, Eir(1)=+2, Eir(2)=+4, Eir(3)=+8 (2^N)
          const stackMultiplier = stackMatch ? Math.pow(2, stackCount) : 1;
          const scaledEffects = stackMultiplier === 1 ? subRaceEntry.effects : subRaceEntry.effects.map((e) => {
            if (e.type === "stat_modifier" && e.value !== undefined) {
              return { ...e, value: e.value * stackMultiplier };
            }
            return e;
          });
          sources.push({
            type: "sub_race",
            name: displayName,
            effects: scaledEffects,
            rawDescription: subRaceEntry.description,
            isActive: true,
          });
        }
      }
    }

    // Archetypes
    for (const archetype of character.archetypes || []) {
      const entry = EffectRegistry.get("archetype", archetype);
      if (entry) {
        sources.push({
          type: "archetype",
          name: archetype,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true,
        });
      }
    }

    // Archetype sub-types (from Wibu Wheel, etc.)
    // Track names added from nestedArchetypes to avoid duplicate effects when powers fallback to archetype_sub
    const nestedArchetypeSubNames = new Set<string>();
    for (const nested of character.nestedArchetypes || []) {
      // Look up subType (e.g., "Jojo", "JJK", "MHA", "Bleach")
      if (nested.subType) {
        const subEntry = EffectRegistry.get("archetype_sub", nested.subType);
        if (subEntry) {
          nestedArchetypeSubNames.add(nested.subType);
          sources.push({
            type: "archetype",
            name: nested.subType,
            effects: subEntry.effects,
            rawDescription: subEntry.description,
            isActive: true,
          });
        }
      }
      // Look up subSubType (e.g., "Tusk Act II", "The World", "IQ")
      if (nested.subSubType) {
        const subSubEntry = EffectRegistry.get(
          "archetype_sub",
          nested.subSubType,
        );
        if (subSubEntry) {
          nestedArchetypeSubNames.add(nested.subSubType);
          sources.push({
            type: "archetype",
            name: nested.subSubType,
            effects: subSubEntry.effects,
            rawDescription: subSubEntry.description,
            isActive: true,
          });
        }
      }
    }

    // Quirks (skip lost items)
    for (const quirk of character.quirks || []) {
      if (quirk.isLost) continue; // Skip lost items
      const entry = EffectRegistry.get("quirk", quirk.name);
      if (entry) {
        sources.push({
          type: "quirk",
          name: quirk.name,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true,
        });
      }
    }

    // PvP Rewards (skip lost rewards)
    for (const pvpReward of character.pvpRewards || []) {
      if (pvpReward.isLost) continue; // Skip lost rewards
      // Normalize PvP reward name to match registry
      // Data file may have abbreviated names like "+1 Spd" but registry has "+1 Speed"
      const normalizedName = this.normalizePvPRewardName(pvpReward.description);
      const entry = EffectRegistry.get("pvp_reward", normalizedName);
      if (entry) {
        sources.push({
          type: "pvp_reward",
          name: pvpReward.description,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true,
        });
      } else {
        // Fallback: parse "+N Stat" directly for rewards not in registry (e.g. "+9 IQ", "+2 BIQ")
        const statAbbreviations: Record<string, DynamicStatTarget> = {
          str: "strength", strength: "strength",
          spd: "speed", speed: "speed",
          dur: "durability", dura: "durability", durability: "durability",
          iq: "iq", biq: "biq",
          ma: "ma", "martial arts": "ma",
          all: "all", "all stats": "all", "all stat": "all",
        };
        const match = normalizedName.match(/^([+-]?\d+)\s+(.+)$/i);
        if (match) {
          const value = parseInt(match[1]);
          const statKey = match[2].toLowerCase().trim();
          const statTarget = statAbbreviations[statKey];
          if (statTarget) {
            sources.push({
              type: "pvp_reward",
              name: pvpReward.description,
              effects: [{
                type: "stat_modifier",
                stat: statTarget,
                value,
                timing: "immediate",
                target: "self",
              }],
              rawDescription: pvpReward.description,
              isActive: true,
            });
          }
        }
      }
    }

    // Powers (skip lost items)
    for (const power of character.powers || []) {
      if (power.isLost) continue; // Skip lost items

      // Check if this is a Summon (format: "Summon: X" or "Summon: X (note)")
      const summonMatch = power.name.match(/^Summon:\s*([^(]+)/i);
      if (summonMatch) {
        const summonName = summonMatch[1].trim();
        const entry = EffectRegistry.get("summon", summonName);
        if (entry) {
          sources.push({
            type: "summon",
            name: summonName,
            effects: entry.effects,
            rawDescription: entry.description,
            isActive: true,
          });
        }
        continue; // Skip normal power lookup
      }

      const entry =
        EffectRegistry.get("power", power.name) ||
        // Fallback: some powers come from wheels (MHA, JJK, Jojo, etc.) and are registered as archetype_sub
        // But skip if already added from nestedArchetypes to avoid duplicate effects
        (!nestedArchetypeSubNames.has(power.name) &&
          EffectRegistry.get("archetype_sub", power.name));
      if (entry) {
        sources.push({
          type: "power",
          name: power.name,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true,
        });
      }
    }

    // Weapons (skip lost items)
    for (const weapon of character.weapons || []) {
      if (weapon.isLost) continue; // Skip lost items
      const entry = EffectRegistry.get("weapon", weapon.name);
      if (entry) {
        sources.push({
          type: "weapon",
          name: weapon.name,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: weapon.usable !== false,
          isDisabled: weapon.usable === false,
          disabledReason:
            weapon.usable === false ? "Không dùng được" : undefined,
        });
      }
    }

    // Check if player has a usable weapon (not lost, usable)
    // Runes only activate when player has a weapon
    const hasUsableWeapon = (character.weapons || []).some(
      (weapon) => !weapon.isLost && weapon.usable !== false,
    );

    // Summons từ block "Summon:" riêng (format mới)
    for (const summon of character.summons || []) {
      if (summon.isLost) continue;
      const entry = EffectRegistry.get("summon", summon.name);
      if (entry) {
        sources.push({
          type: "summon",
          name: summon.name,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true,
        });
      }
    }

    // Runes (skip lost items, only active if player has a usable weapon)
    for (const rune of character.runes?.runes || []) {
      if (rune.isLost) continue; // Skip lost items
      const entry = EffectRegistry.get("rune", rune.name);
      if (entry) {
        sources.push({
          type: "rune",
          name: rune.name,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: hasUsableWeapon,
          isDisabled: !hasUsableWeapon,
          disabledReason: !hasUsableWeapon ? "Không có vũ khí" : undefined,
        });
      }
    }

    // Runeword (only active if player has a usable weapon)
    if (character.runes?.runeword) {
      const entry = EffectRegistry.get("runeword", character.runes.runeword);
      if (entry) {
        sources.push({
          type: "runeword",
          name: character.runes.runeword,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: hasUsableWeapon,
          isDisabled: !hasUsableWeapon,
          disabledReason: !hasUsableWeapon ? "Không có vũ khí" : undefined,
        });
      }
    }

    // Gear (skip lost items)
    for (const gear of [
      ...(character.gear?.normalGear || []),
      ...(character.gear?.legacyGear || []),
    ]) {
      if (gear.isLost) continue; // Skip lost items
      const entry = EffectRegistry.get("gear", gear.name);
      if (entry) {
        sources.push({
          type: "gear",
          name: gear.name,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: gear.usable !== false,
          isDisabled: gear.usable === false,
          disabledReason: gear.usable === false ? "Không dùng được" : undefined,
        });
      }
    }

    // Houses (handle lost houses based on lostType)
    // - 'kinda_homeless': Player left house but KEEPS stat bonuses
    // - 'no_more_home' or isLost without lostType: Player kicked out and LOSES all bonuses
    // Check nestedHouses first for statBonuses, fall back to regular houses
    const processedHouses = new Set<string>();

    for (const house of character.nestedHouses || []) {
      // Skip houses that are completely lost (no_more_home or default isLost behavior)
      if (house.isLost && house.lostType !== "kinda_homeless") continue;
      processedHouses.add(house.name);

      // For kinda_homeless: only apply stat bonuses, skip other effects
      const isKindaHomeless =
        house.isLost && house.lostType === "kinda_homeless";

      // If house has explicit statBonuses (e.g., ["+2 Str", "+1 Spd", "+2 Dura"]), use those instead of registry effect
      // Skip if houseBonusApplied (stats already include house bonus, e.g. before Fate's Trick)
      if (
        house.statBonuses &&
        house.statBonuses.length > 0 &&
        !character.houseBonusApplied
      ) {
        const bonusEffects: Effect[] = [];
        for (const bonus of house.statBonuses) {
          const bonusEffect = this.parseStatBonus(bonus);
          if (bonusEffect) {
            bonusEffects.push(bonusEffect);
          }
        }
        if (bonusEffects.length > 0) {
          sources.push({
            type: "house",
            name: house.name,
            effects: bonusEffects,
            rawDescription: `${house.name}: ${house.statBonuses.join(", ")}${isKindaHomeless ? " (Kinda Homeless - giữ stat)" : ""}`,
            isActive: true,
          });
          // For kinda_homeless: don't process sub-types since they left the house
          if (!isKindaHomeless && house.subType && !house.subTypeIsLost) {
            const subEntry = EffectRegistry.get("house_sub", house.subType);
            if (subEntry) {
              sources.push({
                type: "house_sub" as EffectSourceType,
                name: house.subType,
                effects: subEntry.effects,
                rawDescription: subEntry.description,
                isActive: true,
              });
            }
          }
          continue;
        }
      }

      // Otherwise use registry entry
      const entry = EffectRegistry.get("house", house.name);
      if (entry) {
        // For kinda_homeless: only keep stat_modifier effects with immediate timing
        // For houseBonusApplied: skip stat_modifier effects (already pre-applied, e.g. before Fate's Trick)
        let effectsToApply = isKindaHomeless
          ? entry.effects.filter(
              (e) => e.type === "stat_modifier" && e.timing === "immediate",
            )
          : entry.effects;
        if (character.houseBonusApplied) {
          effectsToApply = effectsToApply.filter(
            (e) => e.type !== "stat_modifier",
          );
        }

        if (effectsToApply.length > 0) {
          sources.push({
            type: "house",
            name: house.name,
            effects: effectsToApply,
            rawDescription: isKindaHomeless
              ? `${entry.description} (Kinda Homeless - chỉ giữ stat bonus)`
              : entry.description,
            isActive: true,
          });
        }
      }

      // For kinda_homeless: don't process sub-types since they left the house
      if (!isKindaHomeless && house.subType && !house.subTypeIsLost) {
        const subEntry = EffectRegistry.get("house_sub", house.subType);
        if (subEntry) {
          sources.push({
            type: "house_sub" as EffectSourceType,
            name: house.subType,
            effects: subEntry.effects,
            rawDescription: subEntry.description,
            isActive: true,
          });
        }
      }
    }

    // Fall back to regular houses array for any not in nestedHouses
    for (const house of character.houses || []) {
      if (house.isLost || processedHouses.has(house.name)) continue;
      const entry = EffectRegistry.get("house", house.name);
      if (entry) {
        const houseEffects = character.houseBonusApplied
          ? entry.effects.filter((e) => e.type !== "stat_modifier")
          : entry.effects;
        sources.push({
          type: "house",
          name: house.name,
          effects: houseEffects,
          rawDescription: entry.description,
          isActive: true,
        });
      }
    }

    // Chuyện Bộ Tộc - House tribal story effects
    // Baratheon: all members get +1 all base stat (collective activation)
    // Lannister (Dung - haruharu9127): traitor gets +2 all base stat
    // Uchiha (2FaceCat - 2facecat.): traitor gets +2 all base stat
    {
      const activeHouseNames = (character.nestedHouses || [])
        .filter((h) => !h.isLost || h.lostType === "kinda_homeless")
        .map((h) => h.name);
      // Fallback to regular houses
      for (const h of character.houses || []) {
        if (!h.isLost && !activeHouseNames.includes(h.name)) {
          activeHouseNames.push(h.name);
        }
      }

      if (activeHouseNames.includes("House Baratheon")) {
        const allStatEffects: Effect[] = (
          ["strength", "speed", "durability", "iq", "biq", "ma"] as const
        ).map((stat) => ({
          type: "stat_modifier" as const,
          stat,
          value: 1,
          isBase: true,
          timing: "immediate" as const,
          target: "self" as const,
        }));
        sources.push({
          type: "house",
          name: "Chuyện bộ tộc - Nhà Baratheon",
          effects: allStatEffects,
          rawDescription:
            "+1 all base stat cho toàn bộ thành viên nhà Baratheon",
          isActive: true,
        });
      }

      if (
        activeHouseNames.some((h) => h.toLowerCase().includes("lannister"))
      ) {
        const allStatEffects: Effect[] = (
          ["strength", "speed", "durability", "iq", "biq", "ma"] as const
        ).map((stat) => ({
          type: "stat_modifier" as const,
          stat,
          value: 1,
          isBase: true,
          timing: "immediate" as const,
          target: "self" as const,
        }));
        sources.push({
          type: "house",
          name: "Chuyện bộ tộc - Nhà Lannister",
          effects: allStatEffects,
          rawDescription:
            "+1 all base stat cho toàn bộ thành viên nhà Lannister",
          isActive: true,
        });
      }

      if (activeHouseNames.some((h) => h.toLowerCase().includes("uchiha"))) {
        const allStatEffects: Effect[] = (
          ["strength", "speed", "durability", "iq", "biq", "ma"] as const
        ).map((stat) => ({
          type: "stat_modifier" as const,
          stat,
          value: 1,
          isBase: true,
          timing: "immediate" as const,
          target: "self" as const,
        }));
        sources.push({
          type: "house",
          name: "Chuyện bộ tộc - Nhà Uchiha",
          effects: allStatEffects,
          rawDescription:
            "+1 all base stat cho toàn bộ thành viên nhà Uchiha",
          isActive: true,
        });
      }

      const username = character.username?.toLowerCase() || "";
      if (username === "haruharu9127") {
        const allStatEffects: Effect[] = (
          ["strength", "speed", "durability", "iq", "biq", "ma"] as const
        ).map((stat) => ({
          type: "stat_modifier" as const,
          stat,
          value: 2,
          isBase: true,
          timing: "immediate" as const,
          target: "self" as const,
        }));
        sources.push({
          type: "house",
          name: "Chuyện bộ tộc - Nhà Lannister",
          effects: allStatEffects,
          rawDescription: "+2 all base stat (phản bội gia tộc)",
          isActive: true,
        });
      }

      if (username === "2facecat.") {
        const allStatEffects: Effect[] = (
          ["strength", "speed", "durability", "iq", "biq", "ma"] as const
        ).map((stat) => ({
          type: "stat_modifier" as const,
          stat,
          value: 2,
          isBase: true,
          timing: "immediate" as const,
          target: "self" as const,
        }));
        sources.push({
          type: "house",
          name: "Chuyện bộ tộc - Nhà Uchiha (phản bội)",
          effects: allStatEffects,
          rawDescription: "+2 all base stat (phản bội gia tộc)",
          isActive: true,
        });
      }
    }

    // Character Development (skip lost items)
    for (const charDev of character.charDevs || []) {
      if (charDev.isLost) continue; // Skip lost items

      // Parse charDev name to extract base name and metadata
      // Format examples:
      // - "Metamorphosis (Pennyworthy Deny AIDS) -> Nhận +7 Dura"
      // - "Simple CharDev"
      const parsed = this.parseCharDevName(charDev.name);

      const entry = EffectRegistry.get("char_dev", parsed.baseName);
      if (entry) {
        // Clone effects to avoid modifying original
        let effects = [...entry.effects];

        // Handle special cases based on metadata
        if (parsed.baseName.toLowerCase() === "metamorphosis") {
          // Filter out AIDS power grant if denied
          if (parsed.denyAids) {
            effects = effects.filter(
              (e) =>
                !(
                  e.type === "grant_power" &&
                  (e as { grantName?: string }).grantName?.toLowerCase() ===
                    "aids"
                ),
            );
          }

          // Replace random stat handler with specific stat if provided
          if (parsed.statBonus) {
            effects = effects.filter(
              (e) =>
                !(
                  e.type === "custom" &&
                  (e as { customHandler?: string }).customHandler ===
                    "metamorphosis_random_stat"
                ),
            );
            // Add specific stat modifier
            effects.push({
              type: "stat_modifier",
              stat: parsed.statBonus.stat as StatName,
              value: parsed.statBonus.value,
              isBase: true,
              timing: "immediate",
              target: "self",
            });
          }
        }

        // Handle Don't say it - check suffix for upgrade status
        if (parsed.baseName.toLowerCase() === "don't say it") {
          const suffix = charDev.name.slice(parsed.baseName.length).toLowerCase();
          if (suffix.includes("(-)")) {
            // (-) → skip toàn bộ effect (không cộng không trừ)
            effects = [];
          } else if (suffix.includes("+2 all stats") || suffix.includes("+2 all")) {
            // (+2 all stats) → thay -2 all thành +2 all
            effects = effects.map((e) => {
              if (e.type === "stat_modifier" && (e as any).stat === "all" && (e as any).value === -2) {
                return { ...e, value: 2 };
              }
              return e;
            });
          }
          // Không có suffix → giữ nguyên -2 all stats
        }

        // Handle In Love - replace custom handler with specific stat if provided in data
        if (parsed.baseName.toLowerCase() === "in love") {
          if (parsed.statBonus) {
            effects = effects.filter(
              (e) =>
                !(
                  e.type === "custom" &&
                  (e as { customHandler?: string }).customHandler ===
                    "in_love_stat_bonus"
                ),
            );
            // Add specific stat modifier from data (e.g., "-> +2 IQ")
            effects.push({
              type: "stat_modifier",
              stat: parsed.statBonus.stat as StatName,
              value: parsed.statBonus.value,
              timing: "immediate",
              target: "self",
            });
          }
        }

        // Handle Creator's Limitation - replace custom handler with specific stat if provided in data
        if (parsed.baseName.toLowerCase() === "creator's limitation") {
          if (parsed.statBonus) {
            effects = effects.filter(
              (e) =>
                !(
                  e.type === "custom" &&
                  (e as { customHandler?: string }).customHandler ===
                    "creators_limitation"
                ),
            );
            effects.push({
              type: "stat_modifier",
              stat: parsed.statBonus.stat as StatName,
              value: parsed.statBonus.value,
              timing: "immediate",
              target: "self",
            });
          }
        }

        sources.push({
          type: "char_dev",
          name: charDev.name,
          effects: effects,
          rawDescription: entry.description,
          isActive: true,
        });
      }
    }

    // Symbiosis (for hosts who have a symbiote attached)
    if (character.isParasite && character.parasiteType) {
      // New format: parasiteType contains the symbiosis type (e.g., "Mephisto", "Diablo", "67")
      const symbiosisName = character.parasiteType;
      // Handle "67" -> "The Six Seven" mapping
      const lookupName =
        symbiosisName === "67" ? "The Six Seven" : symbiosisName;
      const entry = EffectRegistry.get("symbiosis", lookupName);
      if (entry) {
        sources.push({
          type: "symbiosis",
          name: symbiosisName,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true,
        });
      }
    } else if (character.isParasite && character.parasiteInfo) {
      // Fallback to old format for backward compatibility
      for (const symbiosis of character.parasiteInfo) {
        // Extract symbiosis name (may contain extra info like "Mephisto ( nhận thêm...)")
        const symbiosisName = symbiosis.split("(")[0].trim();
        const lookupName =
          symbiosisName === "67" ? "The Six Seven" : symbiosisName;
        const entry = EffectRegistry.get("symbiosis", lookupName);
        if (entry) {
          sources.push({
            type: "symbiosis",
            name: symbiosisName,
            effects: entry.effects,
            rawDescription: entry.description,
            isActive: true,
          });
        }
      }
    }

    // Cross-character effects: Gather effects targeting "lover" from characters who list this character as lover
    // e.g., Cheater quirk applies -2 BIQ to their lovers
    if (allCharacters && allCharacters.length > 0) {
      const myUsername = character.username?.toLowerCase() || "";
      const myName = character.name?.toLowerCase() || "";

      for (const other of allCharacters) {
        if (other.no === character.no) continue; // Skip self

        // Check if this character is listed as a lover of 'other'
        const isLoverOfOther = other.lover?.some((l) => {
          if (l.isLost) return false;
          const loverStr = l.name.toLowerCase();
          return (
            (myUsername && loverStr.includes(myUsername)) ||
            (myName && loverStr.includes(myName))
          );
        });

        if (!isLoverOfOther) continue;

        // Nếu character này (lover) đã bị loại → không nhận debuff từ Cheater nữa
        if (character.tournament?.status === "eliminated") continue;

        // Nếu người có Cheater đã bị loại → lover nhận +1 all stats thay vì -2 BIQ
        const otherHasCheater = other.quirks?.some(
          (q) => !q.isLost && q.name.toLowerCase().startsWith("cheater"),
        );
        if (other.tournament?.status === "eliminated" && otherHasCheater) {
          sources.push({
            type: "quirk",
            name: `Cheater (từ ${other.name})`,
            effects: [{ type: "stat_modifier", stat: "all", value: 1, timing: "immediate", target: "self" }],
            rawDescription: `Cheater: ${other.name} bị loại → +1 All Stats`,
            isActive: true,
          });
          continue;
        }
        // Nếu bị loại nhưng không có Cheater → skip (không nhận debuff từ người đã bị loại)
        if (other.tournament?.status === "eliminated") continue;

        // Gather all effect sources from 'other' and find effects with target: "lover"
        const otherSources = this.gatherEffectSources(other); // No allCharacters to avoid recursion
        for (const otherSource of otherSources) {
          const loverEffects = otherSource.effects.filter(
            (e) => e.target === "lover" && e.timing === "immediate",
          );
          if (loverEffects.length > 0) {
            sources.push({
              type: otherSource.type,
              name: `${otherSource.name} (từ ${other.name})`,
              effects: loverEffects.map((e) => ({ ...e, target: "self" })), // Convert target to self so they get applied
              rawDescription: `Debuff từ lover: ${other.name}`,
              isActive: otherSource.isActive !== false,
            });
          }
        }

        // Charming quirk: if 'other' has Charming quirk mentioning this character,
        // and the lover (this character) had no power to give → -1 all stats debuff
        // If quirk says "nhận power" → lover already gave power, no debuff
        for (const quirk of other.quirks || []) {
          if (quirk.isLost) continue;
          const qName = quirk.name.toLowerCase();
          if (!qName.startsWith("charming")) continue;

          // Check if this quirk mentions the current character
          const mentionsMe =
            (myUsername && qName.includes(myUsername)) ||
            (myName && qName.includes(myName));
          if (!mentionsMe) continue;

          // Check if a power was already given to the Charming player:
          // 1. Quirk text says "nhận power" or "tặng" (e.g. "tặng Sonic Scream", "nhận power Evasion")
          if (/nhận\s+power|tặng/i.test(qName)) continue;
          // 2. Lover has a lost power that mentions the Charming player's name
          const otherName = other.name?.toLowerCase() || "";
          const otherUsername = other.username?.toLowerCase() || "";
          const gaveAwayPower = (character.powers || []).some((p) => {
            if (!p.isLost) return false;
            const pName = (p.name || "").toLowerCase();
            return (
              (otherName && pName.includes(otherName)) ||
              (otherUsername && pName.includes(otherUsername)) ||
              /tặng|charming/i.test(pName)
            );
          });
          if (gaveAwayPower) continue;

          // Cross-reference: check if this character (the lover) has any non-lost powers
          const myPowers = (character.powers || []).filter((p) => !p.isLost);
          if (myPowers.length === 0) {
            const debuffEffects: Effect[] = STAT_NAMES.map((stat) => ({
              type: "stat_modifier" as const,
              stat,
              value: -1,
              timing: "immediate" as const,
              target: "self" as const,
            }));
            sources.push({
              type: "quirk",
              name: `Charming (từ ${other.name})`,
              effects: debuffEffects,
              rawDescription: `-1 All Stats (tặng stats cho ${other.name} vì không có Power)`,
              isActive: true,
            });
          }
        }
      }
    }

    // PvE Results (from battle log, e.g., "-2 Str" or "+1 All Stats")
    if (character.pvePunishments && character.pvePunishments.length > 0) {
      const abbrevToStat: Record<string, StatName> = {
        str: "strength",
        spd: "speed",
        dur: "durability",
        iq: "iq",
        biq: "biq",
        ma: "ma",
      };
      const rewardEffects: Effect[] = [];
      const rewardDescs: string[] = [];
      const punishEffects: Effect[] = [];
      const punishDescs: string[] = [];
      for (const p of character.pvePunishments) {
        const statName = abbrevToStat[p.stat];
        if (statName) {
          const effect: Effect = {
            type: "stat_modifier",
            stat: statName,
            value: p.value,
            timing: "immediate",
            target: "self",
          };
          const desc = `${p.value > 0 ? "+" : ""}${p.value} ${p.stat.toUpperCase()}`;
          if (p.value >= 0) {
            rewardEffects.push(effect);
            rewardDescs.push(desc);
          } else {
            punishEffects.push(effect);
            punishDescs.push(desc);
          }
        }
      }
      if (rewardEffects.length > 0) {
        sources.push({
          type: "pve_reward",
          name: `PvE Reward (${rewardDescs.join(", ")})`,
          effects: rewardEffects,
          rawDescription: `PvE Reward: ${rewardDescs.join(", ")}`,
          isActive: true,
        });
      }
      if (punishEffects.length > 0) {
        sources.push({
          type: "pve_punishment",
          name: `PvE Punishment (${punishDescs.join(", ")})`,
          effects: punishEffects,
          rawDescription: `PvE Punishment: ${punishDescs.join(", ")}`,
          isActive: true,
        });
      }
    }

    // Other Source Modifiers (từ "Nguồn khác:" block trong Add info)
    if (character.otherSourceMods && character.otherSourceMods.length > 0) {
      const abbrevToStat: Record<string, DynamicStatTarget> = {
        str: "strength",
        spd: "speed",
        dur: "durability",
        iq: "iq",
        biq: "biq",
        ma: "ma",
        all: "all",
      };
      for (const m of character.otherSourceMods) {
        const statTarget = abbrevToStat[m.stat];
        if (statTarget) {
          const desc = `${m.value > 0 ? "+" : ""}${m.value} ${m.stat.toUpperCase()}${m.source ? ` (${m.source})` : ""}`;
          sources.push({
            type: "other_source",
            name: desc,
            effects: [{
              type: "stat_modifier",
              stat: statTarget,
              value: m.value,
              timing: "immediate",
              target: "self",
            }],
            rawDescription: `Nguồn khác: ${desc}`,
            isActive: true,
          });
        }
      }
    }

    return sources;
  }

  /**
   * Check if a condition is satisfied
   */
  static checkCondition(condition: Condition, context: CombatContext): boolean {
    let result = false;

    switch (condition.type) {
      case "always":
        result = true;
        break;

      case "probability":
        // Probability is handled by the UI wheels (onWin/onLose/onTie/preCombat etc.)
        // We return true here so the effect is passed to the engine and the UI can show the wheel.
        result = true;
        break;

      case "stat_compare":
        if (condition.stat && condition.operator) {
          // Use base stats if useBaseStats is true, otherwise use total stats
          const statsToUse =
            condition.useBaseStats && context.self.baseStats
              ? context.self.baseStats
              : context.self.stats;

          const selfStats = resolveStatTarget(condition.stat, statsToUse);
          const selfValue =
            selfStats.reduce((sum, s) => sum + statsToUse[s], 0) /
            selfStats.length;

          let compareValue: number;
          if (condition.compareWith === "opponent" && context.opponent) {
            const oppStatsToUse =
              condition.useBaseStats && context.opponent.baseStats
                ? context.opponent.baseStats
                : context.opponent.stats;
            const oppStats = resolveStatTarget(condition.stat, oppStatsToUse);
            compareValue =
              oppStats.reduce((sum, s) => sum + oppStatsToUse[s], 0) /
              oppStats.length;
          } else if (condition.compareWith === "value") {
            compareValue = condition.compareValue || 0;
          } else if (
            condition.compareWith === "own_stat" &&
            condition.compareStat
          ) {
            compareValue = statsToUse[condition.compareStat];
          } else {
            compareValue = 0;
          }

          result = this.compare(selfValue, condition.operator, compareValue);
        }
        break;

      case "race_match": {
        if (context.opponent) {
          const baseRace = context.opponent.race.toLowerCase();
          const oppEffRace = baseRace === "reincarnator" && context.opponent.subRace
            ? context.opponent.subRace.toLowerCase()
            : baseRace;
          if (condition.races) {
            result = condition.races.some((r) => r.toLowerCase() === oppEffRace);
          }
          if (condition.excludeRaces) {
            result = !condition.excludeRaces.some((r) => r.toLowerCase() === oppEffRace);
          }
        }
        break;
      }

      case "race_tier_compare":
        if (condition.tierOperator && context.opponent) {
          result = this.compare(
            context.self.raceTier,
            condition.tierOperator,
            context.opponent.raceTier,
          );
        }
        break;

      case "bracket":
        if (condition.bracket === "finals") {
          result = context.isFinals;
        } else if (condition.bracket === "winner") {
          // Active unless explicitly in loser bracket
          result = (context.self.bracket || "winner") !== "loser";
        } else if (condition.bracket === "loser") {
          result = (context.self.bracket || "winner") === "loser";
        } else if (condition.bracket) {
          result = context.self.bracket === condition.bracket;
        }
        break;

      case "pvp_win_count":
        if (condition.winCount !== undefined && condition.winCountOperator) {
          result = this.compare(
            context.self.pvpWins,
            condition.winCountOperator,
            condition.winCount,
          );
        }
        break;

      case "has_item": {
        const checkSide =
          condition.checkTarget === "opponent"
            ? context.opponent
            : context.self;
        if (condition.itemType === "lover") {
          result = checkSide?.hasLover ?? false;
        } else if (condition.itemType === "power" && condition.itemName) {
          result = checkSide?.powers.includes(condition.itemName) ?? false;
        } else if (condition.itemType === "quirk" && condition.itemName) {
          result = checkSide?.quirks.includes(condition.itemName) ?? false;
        } else if (condition.itemType === "weapon" && condition.itemName) {
          result = checkSide?.weapons.includes(condition.itemName) ?? false;
        } else if (condition.itemType === "archetype" && condition.itemName) {
          const char =
            condition.checkTarget === "opponent"
              ? (context.opponent as any)?.character
              : (context.self as any)?.character;
          const archetypes: string[] = Array.isArray(char?.archetypes)
            ? char.archetypes.map((a: any) =>
                typeof a === "string" ? a : (a?.name ?? ""),
              )
            : [];
          result = archetypes.some(
            (a) => a.toLowerCase() === condition.itemName!.toLowerCase(),
          );
        }
        break;
      }

      case "opponent_has":
        if (context.opponent) {
          if (condition.opponentItemType === "lover") {
            result = context.opponent.hasLover;
          } else if (
            condition.opponentItemType === "power" &&
            condition.opponentItemName
          ) {
            result = context.opponent.powers.includes(
              condition.opponentItemName,
            );
          }
        }
        break;

      default:
        result = true;
    }

    return condition.negate ? !result : result;
  }

  private static compare(a: number, op: string, b: number): boolean {
    switch (op) {
      case ">":
        return a > b;
      case "<":
        return a < b;
      case "=":
        return a === b;
      case ">=":
        return a >= b;
      case "<=":
        return a <= b;
      case "!=":
        return a !== b;
      default:
        return false;
    }
  }

  /**
   * Check if all conditions are satisfied
   */
  static checkConditions(
    conditions: Condition[] | undefined,
    context: CombatContext,
  ): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every((c) => this.checkCondition(c, context));
  }

  /**
   * Check immediate conditions (stat_compare with own_stat using base stats)
   * This is a simplified check that only works for immediate timing conditions
   */
  static checkImmediateConditions(
    conditions: Condition[] | undefined,
    baseStats: CharacterStats,
    character?: Character,
  ): boolean {
    if (!conditions || conditions.length === 0) return true;

    for (const condition of conditions) {
      let result = false;

      switch (condition.type) {
        case "always":
          result = true;
          break;

        case "probability":
          // Probability is handled by the UI wheels (onWin/onLose/onTie/preCombat etc.)
          // We return true here so the effect is passed to the engine and the UI can show the wheel.
          result = true;
          break;

        case "stat_compare":
          // For immediate effects, always use base stats for comparison
          if (
            condition.stat &&
            condition.operator &&
            condition.compareWith === "own_stat" &&
            condition.compareStat
          ) {
            const selfStats = resolveStatTarget(condition.stat, baseStats);
            const selfValue =
              selfStats.reduce((sum, s) => sum + baseStats[s], 0) /
              selfStats.length;
            const compareValue = baseStats[condition.compareStat];
            result = this.compare(selfValue, condition.operator, compareValue);
          } else if (
            condition.stat &&
            condition.operator &&
            condition.compareWith === "value"
          ) {
            const selfStats = resolveStatTarget(condition.stat, baseStats);
            const selfValue =
              selfStats.reduce((sum, s) => sum + baseStats[s], 0) /
              selfStats.length;
            result = this.compare(
              selfValue,
              condition.operator,
              condition.compareValue || 0,
            );
          } else {
            // Other stat_compare types need combat context, skip for immediate
            result = true;
          }
          break;

        case "has_char_dev":
          // Check if character has a specific char dev
          if (character && condition.charDev) {
            const hasCharDev =
              character.charDevs?.some(
                (cd) =>
                  !cd.isLost &&
                  cd.name
                    .toLowerCase()
                    .includes(condition.charDev!.toLowerCase()),
              ) || false;
            result = hasCharDev;
          } else {
            // No character context, default to false (condition not met)
            result = false;
          }
          break;

        case "has_lover":
          // Check if character has a lover (used to determine virginity loss)
          // character.lover is LossableItem[] - empty array or array with empty names means no lover
          if (character) {
            const lovers = character.lover;
            if (Array.isArray(lovers)) {
              result = lovers.some((l) => !l.isLost && l.name.trim() !== "");
            } else {
              result = !!lovers && String(lovers).trim() !== "";
            }
          } else {
            result = false;
          }
          break;

        case "bracket":
          // Check bracket condition using character's tournament info
          // Logic: condition.bracket = "winner" → active unless player is in loser bracket
          //        condition.bracket = "loser"  → active only if player is in loser bracket
          //        condition.bracket = "finals" → active only if it's a finals round
          // No tournament info = treat as winner bracket (default)
          {
            const playerBracket = character?.tournament?.bracket || "winner";
            if (condition.bracket === "finals") {
              result = character?.tournament?.round === "final";
            } else if (condition.bracket === "winner") {
              // Active unless player is explicitly in loser bracket
              result = playerBracket !== "loser";
            } else if (condition.bracket === "loser") {
              result = playerBracket === "loser";
            } else {
              result = playerBracket === condition.bracket;
            }
          }
          break;

        case "pvp_win_count":
          // Check PvP win count condition
          if (character && condition.winCount !== undefined) {
            const pvpWins = character.tournament?.pvpWins || 0;
            const operator = condition.winCountOperator || ">=";
            result = this.compare(pvpWins, operator, condition.winCount);
          } else {
            // No character or win count, condition not met
            result = false;
          }
          break;

        case "has_item":
          // Check if character has a specific item type (e.g., weapon)
          if (character) {
            if (condition.itemType === "weapon") {
              // Has at least one non-lost weapon
              result = (character.weapons || []).some((w) => !w.isLost);
            } else if (condition.itemType === "lover") {
              result = (character.lover || []).some(
                (l) => !l.isLost && l.name.trim() !== "",
              );
            } else if (condition.itemType === "power") {
              if (condition.itemName) {
                result = (character.powers || []).some(
                  (p) =>
                    !p.isLost &&
                    p.name
                      .toLowerCase()
                      .includes(condition.itemName!.toLowerCase()),
                );
              } else {
                result = (character.powers || []).some((p) => !p.isLost);
              }
            } else if (
              condition.itemType === "archetype" &&
              condition.itemName
            ) {
              const archetypes: string[] = Array.isArray(
                (character as any).archetypes,
              )
                ? (character as any).archetypes.map((a: any) =>
                    typeof a === "string" ? a : (a?.name ?? ""),
                  )
                : [];
              result = archetypes.some(
                (a) => a.toLowerCase() === condition.itemName!.toLowerCase(),
              );
            } else {
              result = true; // Unknown item type, default to true
            }
          } else {
            result = false;
          }
          break;

        default:
          // Other condition types need combat context, skip for immediate
          result = true;
      }

      // Apply negate
      if (condition.negate) result = !result;

      // All conditions must pass
      if (!result) return false;
    }

    return true;
  }

  /**
   * Resolve all immediate effects and calculate total stats
   * @param sources - Effect sources to process
   * @param baseStats - Base character stats
   * @param context - Optional combat context for PvE/PvP timing checks
   * @param character - Optional character for condition checks (e.g., has_char_dev)
   */
  static resolveImmediateEffects(
    sources: EffectSource[],
    baseStats: CharacterStats,
    context?: { isPvE?: boolean },
    character?: Character,
    allCharacters?: Character[],
  ): CharacterEffects {
    const result: CharacterEffects = {
      statModifiers: [],
      combatEffects: [],
      immunities: [],
      buffs: [],
      totalStats: cloneStats(baseStats),
      baseStats: cloneStats(baseStats),
      bonusStats: emptyStats(),
    };

    // Handlers that must run AFTER all other immediate effects have been applied,
    // so they can see the fully-accumulated stats (e.g. EscAPADe converts total IQ bonus).
    const DEFERRED_HANDLERS = new Set(["escapade_convert_iq_to_str"]);
    const deferredItems: { source: EffectSource; effect: Effect }[] = [];

    for (const source of sources) {
      if (!source.isActive || source.isDisabled) continue;

      for (const effect of source.effects) {
        // Check PvE/PvP timing if context is provided
        if (context !== undefined) {
          if (context.isPvE) {
            // PvE mode: ONLY apply pve_only effects, skip immediate and pvp_only
            if (effect.timing === "pve_only") {
              // Process this effect as immediate (fall through to stat modifier logic below)
            } else if (
              effect.timing === "immediate" ||
              effect.timing === "pvp_only"
            ) {
              // Skip immediate and pvp_only effects in PvE
              result.combatEffects.push({
                source,
                effect,
                isActive: false,
                reason: "Not applicable in PvE - only pve_only effects apply",
              });
              continue;
            } else {
              // Other non-immediate effects - store for combat
              result.combatEffects.push({ source, effect, isActive: true });
              continue;
            }
          } else {
            // PvP mode: Apply immediate and pvp_only, skip pve_only
            if (effect.timing === "pve_only") {
              // Skip pve_only effects in PvP
              result.combatEffects.push({
                source,
                effect,
                isActive: false,
                reason: "PvE only - not in PvE",
              });
              continue;
            } else if (
              effect.timing === "pvp_only" ||
              effect.timing === "immediate"
            ) {
              // Process this effect as immediate (fall through to stat modifier logic below)
            } else {
              // Other non-immediate effects - store for combat
              result.combatEffects.push({ source, effect, isActive: true });
              continue;
            }
          }
        } else {
          // No context - only process immediate effects and bracket-based effects
          if (effect.timing !== "immediate") {
            // Check if this is a bracket-based timing that should apply based on character's current bracket
            const isBracketTiming =
              effect.timing === "on_loser_bracket" ||
              effect.timing === "on_winner_bracket";

            if (isBracketTiming && character?.tournament?.bracket) {
              const isLoserBracket = character.tournament.bracket === "loser";
              const isWinnerBracket = character.tournament.bracket === "winner";

              // Apply bracket-based effects if character is in the matching bracket
              if (
                (effect.timing === "on_loser_bracket" && isLoserBracket) ||
                (effect.timing === "on_winner_bracket" && isWinnerBracket)
              ) {
                // Fall through to process this effect as immediate
              } else {
                // Not in matching bracket, store for later
                result.combatEffects.push({
                  source,
                  effect,
                  isActive: false,
                  reason: `Requires ${effect.timing === "on_loser_bracket" ? "loser" : "winner"} bracket`,
                });
                continue;
              }
            } else {
              // Store for later use in combat
              result.combatEffects.push({
                source,
                effect,
                isActive: true,
              });
              continue;
            }
          }
        }

        // Check conditions for immediate effects (use ORIGINAL baseStats for Giant-like effects)
        if (
          !this.checkImmediateConditions(
            effect.conditions,
            baseStats,
            character,
          )
        ) {
          continue; // Skip this effect if conditions not met
        }

        // Defer handlers that need fully-accumulated stats (e.g. EscAPADe)
        if (
          effect.customHandler &&
          DEFERRED_HANDLERS.has(effect.customHandler)
        ) {
          deferredItems.push({ source, effect });
          continue;
        }

        // Process custom handler if present
        if (effect.customHandler && character) {
          const handlerResult = HandlerRegistry.executeImmediate(
            effect.customHandler,
            {
              character,
              baseStats,
              currentStats: result.totalStats,
              source,
              effect,
              allCharacters,
            } as ImmediateHandlerContext,
          );

          if (handlerResult) {
            // Apply stat modifiers from handler
            if (handlerResult.statModifiers) {
              for (const mod of handlerResult.statModifiers) {
                // Skip base modifiers for stats marked as "(final)"
                if (mod.isBase && character?.finalStats) {
                  const fKey = STAT_NAME_TO_CHAR_KEY[mod.stat];
                  if (fKey && character.finalStats[fKey]) continue;
                }

                result.statModifiers.push({
                  stat: mod.stat,
                  value: mod.value,
                  isBase: mod.isBase || false,
                  source: source.name,
                });

                if (mod.isBase) {
                  result.baseStats[mod.stat] += mod.value;
                } else {
                  result.bonusStats[mod.stat] += mod.value;
                }
                result.totalStats[mod.stat] += mod.value;
              }
            }

            // Skip default processing if handler says so
            if (handlerResult.skipDefault) {
              continue;
            }
          }
        }

        // Process stat modifiers (only for self target or no target specified)
        // Skip effects that target "lover", "opponent", etc.
        if (
          effect.type === "stat_modifier" &&
          effect.stat &&
          effect.value !== undefined &&
          (!effect.target || effect.target === "self")
        ) {
          // For effects targeting 'lowest'/'highest', always use original baseStats to determine which stat
          // This ensures consistent resolution regardless of source order
          const statsForResolution =
            effect.stat === "lowest" || effect.stat === "highest"
              ? baseStats // Always use original base stats for consistent lowest/highest resolution
              : result.totalStats;
          const targetStats = resolveStatTarget(
            effect.stat,
            statsForResolution,
          );

          for (const stat of targetStats) {
            // Skip base modifiers for stats marked as "(final)"
            if (effect.isBase && character?.finalStats) {
              const fKey = STAT_NAME_TO_CHAR_KEY[stat];
              if (fKey && character.finalStats[fKey]) continue;
            }

            result.statModifiers.push({
              stat,
              value: effect.value,
              isBase: effect.isBase || false,
              source: source.name,
            });

            // Apply to stats
            if (effect.isBase) {
              result.baseStats[stat] += effect.value;
            } else {
              result.bonusStats[stat] += effect.value;
            }
            result.totalStats[stat] += effect.value;
          }
        }

        // Process immunities
        if (effect.type === "immunity" && effect.immuneTo) {
          result.immunities.push(...effect.immuneTo);
        }

        // Store buffs
        if (effect.type === "buff") {
          result.buffs.push({
            source,
            effect,
            isActive: true,
          });
        }
      }
    }

    // Pass 2: run deferred handlers (e.g. EscAPADe) now that all stat bonuses are accumulated
    for (const { source, effect } of deferredItems) {
      if (!effect.customHandler || !character) continue;
      const handlerResult = HandlerRegistry.executeImmediate(
        effect.customHandler,
        {
          character,
          baseStats,
          currentStats: result.totalStats,
          source,
          effect,
          allCharacters,
        } as ImmediateHandlerContext,
      );
      if (handlerResult?.statModifiers) {
        for (const mod of handlerResult.statModifiers) {
          result.statModifiers.push({
            stat: mod.stat,
            value: mod.value,
            isBase: mod.isBase || false,
            source: source.name,
          });
          if (mod.isBase) {
            result.baseStats[mod.stat] += mod.value;
          } else {
            result.bonusStats[mod.stat] += mod.value;
          }
          result.totalStats[mod.stat] += mod.value;
        }
      }
    }

    // Ensure unique immunities
    result.immunities = [...new Set(result.immunities)];

    return result;
  }

  /**
   * Resolve combat effects based on context
   */
  static resolveCombatEffects(
    characterEffects: CharacterEffects,
    context: CombatContext,
  ): ResolvedEffect[] {
    const activeEffects: ResolvedEffect[] = [];

    for (const resolved of characterEffects.combatEffects) {
      const { source, effect } = resolved;

      // Check timing
      const timingMatch = this.checkTiming(effect.timing, context);
      if (!timingMatch) continue;

      // Check conditions
      const conditionsMet = this.checkConditions(effect.conditions, context);
      if (!conditionsMet) continue;

      // Check trigger once
      if (effect.triggerOnce && effect.triggered) continue;

      activeEffects.push({
        source,
        effect,
        isActive: true,
        reason: `Timing: ${effect.timing}, Conditions met`,
      });
    }

    return activeEffects;
  }

  private static checkTiming(
    timing: Effect["timing"],
    context: CombatContext,
  ): boolean {
    switch (timing) {
      case "immediate":
        return true;
      case "during_combat":
        return true; // Always applicable during combat resolution
      case "before_combat":
        return true; // Checked before combat starts
      case "after_combat":
        return true; // Checked after combat ends
      case "after_combat_win":
        return true; // Will be checked when we know the result
      case "after_combat_lose":
        return true;
      case "on_loser_bracket":
        return context.self.bracket === "loser";
      case "on_winner_bracket":
        return context.self.bracket === "winner";
      case "on_finals":
        return context.isFinals;
      case "pve_only":
        return context.isPvE;
      case "pvp_only":
        return !context.isPvE;
      default:
        return true;
    }
  }

  /**
   * Apply combat effects to modify stats during combat
   */
  static applyCombatStatModifiers(
    effects: ResolvedEffect[],
    selfStats: CharacterStats,
    opponentStats?: CharacterStats,
  ): { selfStats: CharacterStats; opponentStats?: CharacterStats } {
    const modifiedSelf = cloneStats(selfStats);
    const modifiedOpponent = opponentStats
      ? cloneStats(opponentStats)
      : undefined;

    for (const { effect } of effects) {
      if (effect.type === "stat_modifier" || effect.type === "buff") {
        if (
          effect.target === "self" &&
          effect.stat &&
          effect.value !== undefined
        ) {
          const stats = resolveStatTarget(effect.stat, modifiedSelf);
          for (const stat of stats) {
            modifiedSelf[stat] += effect.value;
          }
        }
      }

      if (effect.type === "debuff" && modifiedOpponent) {
        if (effect.stat && effect.value !== undefined) {
          const stats = resolveStatTarget(effect.stat, modifiedOpponent);
          for (const stat of stats) {
            modifiedOpponent[stat] += effect.value; // value is already negative
          }
        }
      }
    }

    return { selfStats: modifiedSelf, opponentStats: modifiedOpponent };
  }

  /**
   * Get total starting combat points
   */
  static getStartingPoints(effects: ResolvedEffect[]): number {
    let points = 0;

    for (const { effect } of effects) {
      if (
        effect.type === "combat_points" &&
        effect.timing === "before_combat" &&
        !(effect as any).customHandler
      ) {
        points += effect.points || 0;
      }
    }

    return points;
  }

  /**
   * Calculate full character effects
   * @param character - Character to calculate effects for
   * @param context - Optional context for PvE/PvP timing (e.g., { isPvE: true } for boss battles)
   */
  static calculateCharacterEffects(
    character: Character,
    context?: { isPvE?: boolean },
    allCharacters?: Character[],
  ): CharacterEffects {
    const sources = this.gatherEffectSources(character, allCharacters);
    const baseStats = convertStats(character.stats);
    const result = this.resolveImmediateEffects(
      sources,
      baseStats,
      context,
      character,
      allCharacters,
    );

    // Special case: Skeleton race has IQ locked at 1
    // IQ cannot be modified by any effect until evolution to Lich
    // Check if race is Skeleton (not Lich or Lich King which are evolutions)
    const race = character.race?.race?.toLowerCase() || "";
    if (race === "skeleton") {
      // Force IQ to always be 1 for Skeleton
      result.totalStats.iq = 1;
      result.baseStats.iq = 1;
      result.bonusStats.iq = 0;
    }

    // Special case: Slow Metabolism - Speed cannot increase, only decrease
    // So sánh totalStats.speed với base speed gốc (character.stats.spd)
    // Loại bỏ cả base tăng (isBase) lẫn bonus tăng để đảm bảo speed không vượt gốc
    if (result.immunities.includes("speed_increase")) {
      const originalSpeed = baseStats.speed; // speed gốc từ character.stats
      if (result.totalStats.speed > originalSpeed) {
        result.totalStats.speed = originalSpeed;
      }
      // Xóa bonusStats.speed nếu dương
      if (result.bonusStats.speed > 0) {
        result.bonusStats.speed = 0;
      }
      // Đưa baseStats.speed về đúng với totalStats sau khi cap
      result.baseStats.speed = result.totalStats.speed;
    }

    return result;
  }

  /**
   * Get effect summary for a specific source (weapon, gear, power, etc.)
   * Returns a formatted string showing stat changes like "+2 STR, -1 SPD"
   */
  static getEffectSummary(
    sourceName: string,
    sourceType: EffectSourceType,
  ): string {
    // For char_dev, parse the name to handle special formats like "Metamorphosis -> +1 BIQ"
    let lookupName = sourceName;
    let parsedStatBonus: { stat: string; value: number } | null = null;

    if (sourceType === "char_dev") {
      const parsed = this.parseCharDevName(sourceName);
      lookupName = parsed.baseName;
      parsedStatBonus = parsed.statBonus;
    }

    let entry = EffectRegistry.get(sourceType, lookupName);
    // Fallback: powers from wheels (MHA, JJK, etc.) are registered as archetype_sub
    if (!entry && sourceType === "power") {
      entry = EffectRegistry.get("archetype_sub", lookupName);
    }
    if (!entry) return "";

    const statChanges: string[] = [];
    const statAbbrev: Record<StatName, string> = {
      strength: "STR",
      speed: "SPD",
      durability: "DUR",
      iq: "IQ",
      biq: "BIQ",
      ma: "MA",
    };

    // Check if any effect has conditions (conditional effects)
    const hasConditionalEffects = entry.effects.some(
      (e) =>
        e.type === "stat_modifier" &&
        e.timing === "immediate" &&
        e.conditions &&
        e.conditions.length > 0,
    );

    // Check if any effect uses custom handler (character-dependent)
    const hasCustomHandler = entry.effects.some(
      (e) => e.customHandler && e.timing === "immediate",
    );

    // If there are conditional effects or custom handlers, check if we have parsed stat bonus
    if (hasConditionalEffects || hasCustomHandler) {
      // If we have a parsed stat bonus from the charDev name, use that instead of "conditional"
      if (parsedStatBonus) {
        const statAbbrevMap: Record<string, string> = {
          strength: "STR",
          speed: "SPD",
          durability: "DUR",
          iq: "IQ",
          biq: "BIQ",
          ma: "MA",
        };
        const abbrev =
          statAbbrevMap[parsedStatBonus.stat] ||
          parsedStatBonus.stat.toUpperCase();
        return `+${parsedStatBonus.value} ${abbrev}`;
      }
      // Return conditional to let the UI show the effect is character-dependent
      return "conditional";
    }

    for (const effect of entry.effects) {
      if (
        effect.type === "stat_modifier" &&
        effect.timing === "immediate" &&
        effect.value !== undefined
      ) {
        if (effect.stat === "all") {
          const prefix = effect.value > 0 ? "+" : "";
          statChanges.push(`${prefix}${effect.value} All`);
        } else if (effect.stat && effect.stat in statAbbrev) {
          const prefix = effect.value > 0 ? "+" : "";
          statChanges.push(
            `${prefix}${effect.value} ${statAbbrev[effect.stat as StatName]}`,
          );
        }
      }
    }

    return statChanges.join(", ");
  }

  /**
   * Get all effect sources with their stat summaries for a character
   * Useful for displaying detailed breakdown in UI
   * Now properly checks conditions using character's base stats
   * @param character - Character to get breakdown for
   * @param tournamentInfo - Optional tournament info (bracket, round) to determine active conditional effects
   */
  static getCharacterEffectBreakdown(
    character: Character,
    _tournamentInfo?: { bracket?: string; round?: string },
    allCharacters?: Character[],
  ): EffectSourceBreakdown[] {
    const sources = this.gatherEffectSources(character, allCharacters);
    const breakdown: EffectSourceBreakdown[] = [];

    // Get character's base stats for condition checking
    const baseStats = convertStats(character.stats);

    // Track accumulated stats across sources (for handlers like EscAPADe that need current totals)
    const runningStats: Record<StatName, number> = { ...baseStats };

    // Pre-check immunities from all sources (e.g., Slow Metabolism: speed_increase)
    const hasSpeedIncreaseImmunity = sources.some((s) =>
      s.effects.some(
        (e) => e.type === "immunity" && e.immuneTo?.includes("speed_increase"),
      ),
    );

    // Pre-compute total stats for deferred handlers (e.g. EscAPADe needs to see all IQ bonuses)
    // by doing a quick pass over all non-deferred immediate stat modifiers.
    const DEFERRED_HANDLERS_BD = new Set(["escapade_convert_iq_to_str"]);
    const precomputedStats: Record<StatName, number> = { ...baseStats };
    for (const src of sources) {
      if (!src.isActive || src.isDisabled) continue;
      for (const eff of src.effects) {
        if (eff.customHandler && DEFERRED_HANDLERS_BD.has(eff.customHandler))
          continue;
        if (eff.timing !== "immediate" && eff.timing !== "pvp_only") continue;
        if (eff.type !== "stat_modifier" || eff.value === undefined) continue;
        if (eff.target && eff.target !== "self") continue;
        const stats = resolveStatTarget(
          eff.stat as DynamicStatTarget,
          baseStats,
        );
        for (const s of stats) precomputedStats[s] += eff.value;
      }
    }

    // Map timing to Vietnamese display text
    const timingLabels: Record<string, string> = {
      after_combat: "Sau combat",
      after_combat_win: "Sau combat thắng",
      after_combat_lose: "Sau combat thua",
      during_combat: "Trong combat",
      before_combat: "Trước combat",
      on_round_win: "Khi thắng round",
      on_round_lose: "Khi thua round",
      on_loser_bracket: "Ở nhánh thua",
      on_winner_bracket: "Ở nhánh thắng",
      on_finals: "Ở chung kết",
      on_death: "Khi bị loại",
      on_round_16: "Vòng 16",
      on_round_8: "Tứ kết",
      on_round_32: "Vòng 32",
      on_round_64: "Vòng 64",
      on_round_128: "Vòng 128",
      on_round_256: "Vòng 256",
      pve_only: "Chỉ PvE",
      pvp_only: "Chỉ PvP",
    };

    for (const source of sources) {
      const statChanges: StatChange[] = [];
      const conditionalEffects: ConditionalEffect[] = [];
      const executedHandlers = new Set<string>(); // Track executed custom handlers to avoid duplicates
      let customHandlerDisplayName: string | null = null; // Override source name with handler description

      for (const effect of source.effects) {
        // Check if this is a bracket-based timing that should be treated as immediate
        const isBracketTiming =
          effect.timing === "on_loser_bracket" ||
          effect.timing === "on_winner_bracket";
        const isInMatchingBracket =
          isBracketTiming &&
          character.tournament?.bracket &&
          ((effect.timing === "on_loser_bracket" &&
            character.tournament.bracket === "loser") ||
            (effect.timing === "on_winner_bracket" &&
              character.tournament.bracket === "winner"));

        // Handle custom handlers - execute them and collect their stat modifiers
        // Skip if already executed this handler for this source (e.g., same handler on both immediate and pve_only)
        // Note: pve_only handlers are NOT executed here because PvE phase is over (PvP context)
        if (
          effect.customHandler &&
          (effect.timing === "immediate" || effect.timing === "pvp_only")
        ) {
          if (executedHandlers.has(effect.customHandler)) continue;
          executedHandlers.add(effect.customHandler);
          // Deferred handlers use precomputedStats so they see all bonuses already accumulated
          const ctxStats = DEFERRED_HANDLERS_BD.has(effect.customHandler)
            ? { ...precomputedStats }
            : { ...runningStats };
          const handlerResult = HandlerRegistry.executeImmediate(
            effect.customHandler,
            {
              character,
              baseStats,
              currentStats: ctxStats,
              source,
              effect,
              allCharacters,
            } as ImmediateHandlerContext,
          );

          if (handlerResult?.statModifiers) {
            for (const mod of handlerResult.statModifiers) {
              statChanges.push({
                stat: mod.stat,
                value: mod.value,
                isBase: mod.isBase,
              });
            }
            // Use handler description as display name when it has stat modifiers
            if (handlerResult.description) {
              customHandlerDisplayName = handlerResult.description;
            }
          }
          // If handler returned a description but no stat modifiers, show as conditional info
          if (
            handlerResult?.description &&
            (!handlerResult.statModifiers ||
              handlerResult.statModifiers.length === 0)
          ) {
            conditionalEffects.push({
              timing: "immediate",
              description: handlerResult.description,
            });
          }
          continue; // Skip other processing for custom handler effects
        }

        // Collect immediate stat modifiers (or bracket-based if in matching bracket)
        // pvp_only is treated like immediate in PvP breakdown (this page is PvP-only)
        // Skip effects that target others (lover, opponent, etc.) - only show self effects
        if (
          effect.type === "stat_modifier" &&
          (effect.timing === "immediate" ||
            effect.timing === "pvp_only" ||
            isInMatchingBracket) &&
          effect.value !== undefined &&
          (!effect.target || effect.target === "self")
        ) {
          // Check conditions before including in breakdown
          if (
            !this.checkImmediateConditions(
              effect.conditions,
              baseStats,
              character,
            )
          ) {
            continue; // Skip effects that don't meet conditions
          }

          if (effect.stat === "all") {
            for (const stat of STAT_NAMES) {
              statChanges.push({
                stat,
                value: effect.value,
                isBase: effect.isBase,
              });
            }
          } else if (
            effect.stat &&
            STAT_NAMES.includes(effect.stat as StatName)
          ) {
            statChanges.push({
              stat: effect.stat as StatName,
              value: effect.value,
              isBase: effect.isBase,
            });
          } else if (effect.stat === "lowest" || effect.stat === "highest") {
            // Resolve dynamic stat targets using base stats
            const resolvedStats = resolveStatTarget(effect.stat, baseStats);
            for (const stat of resolvedStats) {
              statChanges.push({
                stat,
                value: effect.value,
                isBase: effect.isBase,
              });
            }
          } else if (effect.stat === "odd" || effect.stat === "even") {
            // Handle odd/even stat targets
            const resolvedStats = resolveStatTarget(effect.stat, baseStats);
            for (const stat of resolvedStats) {
              statChanges.push({
                stat,
                value: effect.value,
                isBase: effect.isBase,
              });
            }
          }
        }
        // Collect conditional/combat effects (non-immediate timing, excluding bracket timing that's already handled)
        else if (
          effect.timing &&
          effect.timing !== "immediate" &&
          !isInMatchingBracket
        ) {
          const timingLabel = timingLabels[effect.timing] || effect.timing;
          let effectDesc = timingLabel;

          // Add stat info if it's a stat modifier
          if (
            effect.type === "stat_modifier" &&
            effect.stat &&
            effect.value !== undefined
          ) {
            const prefix = effect.value > 0 ? "+" : "";
            const statName =
              effect.stat === "all"
                ? "All"
                : effect.stat === "lowest"
                  ? "Stat thấp nhất"
                  : effect.stat === "highest"
                    ? "Stat cao nhất"
                    : effect.stat.toUpperCase();
            effectDesc = `${timingLabel}: ${prefix}${effect.value} ${statName}`;
          }

          // Avoid duplicates
          if (
            !conditionalEffects.find(
              (ce) =>
                ce.timing === effect.timing && ce.description === effectDesc,
            )
          ) {
            conditionalEffects.push({
              timing: effect.timing,
              description: effectDesc,
            });
          }
        }
      }

      if (statChanges.length > 0 || source.rawDescription) {
        // Merge duplicate stat changes, keeping base and non-base separate
        let mergedStatChanges: StatChange[] = [];
        for (const change of statChanges) {
          const existing = mergedStatChanges.find(
            (c) => c.stat === change.stat && !!c.isBase === !!change.isBase,
          );
          if (existing) {
            existing.value += change.value;
          } else {
            mergedStatChanges.push({ ...change });
          }
        }

        // Special case: Skeleton race has IQ locked at 1
        // Filter out IQ modifiers from breakdown since they don't apply
        const race = character.race?.race?.toLowerCase() || "";
        if (race === "skeleton") {
          mergedStatChanges = mergedStatChanges.filter(
            (change) => change.stat !== "iq",
          );
        }

        // Special case: Slow Metabolism - Speed cannot increase
        // Filter out positive speed modifiers from breakdown
        if (hasSpeedIncreaseImmunity) {
          mergedStatChanges = mergedStatChanges.filter(
            (change) => !(change.stat === "speed" && change.value > 0),
          );
        }

        // Filter out base modifiers for stats marked as "(final)" - base already pre-calculated
        if (character.finalStats) {
          mergedStatChanges = mergedStatChanges.filter((change) => {
            if (!change.isBase) return true; // Non-base modifiers still apply
            const key = STAT_NAME_TO_CHAR_KEY[change.stat];
            return !(key && character.finalStats?.[key]);
          });
        }

        // Update running stats with this source's changes (for subsequent handlers)
        for (const change of mergedStatChanges) {
          runningStats[change.stat] += change.value;
        }

        breakdown.push({
          type: source.type,
          name: customHandlerDisplayName || source.name,
          statChanges: mergedStatChanges,
          description: source.rawDescription,
          isActive: source.isActive !== false,
          isDisabled: source.isDisabled || false,
          conditionalEffects:
            conditionalEffects.length > 0 ? conditionalEffects : undefined,
        });
      }
    }

    return breakdown;
  }
}

// ============================================================================
// EFFECT BREAKDOWN TYPES
// ============================================================================

export interface StatChange {
  stat: StatName;
  value: number;
  isBase?: boolean;
}

export interface ConditionalEffect {
  timing: string;
  description: string;
}

export interface EffectSourceBreakdown {
  type: EffectSourceType;
  name: string;
  statChanges: StatChange[];
  description?: string;
  isActive: boolean;
  isDisabled: boolean;
  // Info about conditional/combat effects that aren't immediately applied
  conditionalEffects?: ConditionalEffect[];
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// Additional alias export
export { convertStats as toEffectStats };

// Re-export STAT_NAMES for external use
export { STAT_NAMES };
