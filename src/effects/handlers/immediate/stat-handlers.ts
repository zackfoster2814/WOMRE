/**
 * Stat-based Immediate Handlers
 *
 * Handlers xử lý các effect liên quan đến stat calculation.
 */

import { registerImmediateHandler } from "../registry";
import type { ImmediateHandlerContext, ImmediateHandlerResult } from "../types";
import type { StatName } from "../../types";

const STAT_NAMES: StatName[] = [
  "strength",
  "speed",
  "durability",
  "iq",
  "biq",
  "ma",
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function findLowestStat(stats: Record<StatName, number>): StatName {
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

// findHighestStat not used currently but keeping for future use
// function findHighestStat(stats: Record<StatName, number>): StatName {
//   let highest: StatName = 'strength';
//   let highestValue = stats.strength;
//   for (const stat of STAT_NAMES) {
//     if (stats[stat] > highestValue) {
//       highestValue = stats[stat];
//       highest = stat;
//     }
//   }
//   return highest;
// }

function countItemsOfType(character: any, type: string): number {
  switch (type) {
    case "power":
      return (character.powers || []).filter((p: any) => !p.isLost).length;
    case "quirk":
      return (character.quirks || []).filter((q: any) => !q.isLost).length;
    case "weapon":
      return (character.weapons || []).filter((w: any) => !w.isLost).length;
    case "gear":
      const normalGear = (character.gear?.normalGear || []).filter(
        (g: any) => !g.isLost,
      );
      const legacyGear = (character.gear?.legacyGear || []).filter(
        (g: any) => !g.isLost,
      );
      return normalGear.length + legacyGear.length;
    case "rune":
      return (character.runes?.runes || []).filter((r: any) => !r.isLost)
        .length;
    case "lover":
      if (Array.isArray(character.lover)) {
        return character.lover.length;
      }
      return character.lover ? 1 : 0;
    default:
      return 0;
  }
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * Inversion - Đảo ngược tất cả base stats
 * Base stats bị đảo: Stat mới = 11 - Stat cũ
 *
 * NOTE: Tạm thời comment vì Inversion đã được tính tay trong data
 */
registerImmediateHandler(
  "inversion_all_base_stats",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Tạm thời disable vì Inversion đã được tính tay trong data
    // const mods: ImmediateHandlerResult['statModifiers'] = [];
    //
    // for (const stat of STAT_NAMES) {
    //   const currentBase = ctx.baseStats[stat];
    //   const newBase = 11 - currentBase;
    //   const diff = newBase - currentBase;
    //
    //   if (diff !== 0) {
    //     mods.push({ stat, value: diff, isBase: true });
    //   }
    // }
    //
    // return {
    //   statModifiers: mods,
    //   skipDefault: true,
    //   description: 'Đảo ngược tất cả base stats (Stat = 11 - Stat cũ)',
    // };

    return { skipDefault: true };
  },
  "Đảo ngược tất cả base stats (disabled - đã tính tay)",
);

/**
 * Graceful - +1 BIQ per lover
 */
registerImmediateHandler(
  "graceful_biq_per_lover",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const loverCount = countItemsOfType(ctx.character, "lover");
    if (loverCount === 0) return { skipDefault: true };

    return {
      statModifiers: [{ stat: "biq", value: loverCount }],
      skipDefault: true,
      description: `Graceful`,
    };
  },
  "+1 BIQ per lover",
);

/**
 * In Love - +2 vào stat cao nhất của lover
 * Nếu data đã ghi sẵn stat bonus (-> +2 IQ), handler này sẽ bị replace trong resolver.
 * Handler này chỉ chạy khi KHÔNG có stat bonus ghi sẵn - tự tìm lover's highest stat.
 */
registerImmediateHandler(
  "in_love_stat_bonus",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const lovers = ctx.character.lover;
    if (!lovers || !Array.isArray(lovers) || lovers.length === 0) {
      return { skipDefault: true, description: "Không có lover" };
    }

    if (!ctx.allCharacters || ctx.allCharacters.length === 0) {
      return {
        skipDefault: true,
        description: "Không thể tìm lover (no allCharacters)",
      };
    }

    // Find the first lover in allCharacters
    let loverChar: any = null;
    for (const lover of lovers) {
      if (lover.isLost) continue;
      const loverName = lover.name.toLowerCase();
      loverChar = ctx.allCharacters.find((c) => {
        const username = c.username?.toLowerCase() || "";
        const name = c.name?.toLowerCase() || "";
        return (
          (username && loverName.includes(username)) ||
          (name && loverName.includes(name))
        );
      });
      if (loverChar) break;
    }

    if (!loverChar || !loverChar.stats) {
      return {
        skipDefault: true,
        description: "Không tìm thấy lover trong danh sách",
      };
    }

    // Find lover's highest stat
    const statMapping: Record<string, StatName> = {
      str: "strength",
      spd: "speed",
      dur: "durability",
      iq: "iq",
      biq: "biq",
      ma: "ma",
    };

    let highestStat: StatName = "strength";
    let highestValue = -1;
    for (const [key, statName] of Object.entries(statMapping)) {
      const val = loverChar.stats[key] ?? 0;
      // console.log(loverChar.stats);

      if (val > highestValue) {
        highestValue = val;
        highestStat = statName;
      }
    }

    return {
      statModifiers: [{ stat: highestStat, value: 2 }],
      skipDefault: true,
      description: `+2 ${highestStat} từ In Love (stat cao nhất của lover)`,
    };
  },
  "+2 vào stat cao nhất của lover",
);

/**
 * 100 Girlfriends - +1 All stats per lover
 */
registerImmediateHandler(
  "100_girlfriends_stat_bonus",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const loverCount = countItemsOfType(ctx.character, "lover");
    if (loverCount === 0) return { skipDefault: true };

    const mods: ImmediateHandlerResult["statModifiers"] = [];
    for (const stat of STAT_NAMES) {
      mods.push({ stat, value: loverCount });
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: `+${loverCount} All Stats từ ${loverCount} lover(s)`,
    };
  },
  "+1 All stats per lover",
);

/**
 * Overcome Habits - +1 to LOWEST BASE stat per quirk
 * Uses baseStats (original stats from wheel spin) to determine lowest stat
 */
registerImmediateHandler(
  "overcome_habits_per_quirk",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const quirkCount = countItemsOfType(ctx.character, "quirk");
    if (quirkCount === 0) return { skipDefault: true };

    // Use baseStats to find lowest stat (stats from original wheel spin)
    const lowestStat = findLowestStat(ctx.baseStats);

    return {
      statModifiers: [{ stat: lowestStat, value: quirkCount }],
      skipDefault: true,
      description: `+${quirkCount} ${lowestStat.toUpperCase()} (${quirkCount} Quirk, Overcome the Habits)`,
    };
  },
  "+1 lowest base stat per quirk",
);


/**
 * Frost Fingers - +1 per gear
 */
registerImmediateHandler(
  "frost_fingers_per_gear",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const gearCount = countItemsOfType(ctx.character, "gear");
    if (gearCount === 0) return { skipDefault: true };

    return {
      statModifiers: [{ stat: "iq", value: gearCount }],
      skipDefault: true,
      description: `+${gearCount} IQ từ ${gearCount} gear(s)`,
    };
  },
  "+1 IQ per gear",
);

/**
 * Iron Man - gear bonus
 */
registerImmediateHandler(
  "iron_man_gear_bonus",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const gearCount = countItemsOfType(ctx.character, "gear");
    if (gearCount === 0) return { skipDefault: true };

    // +1 All per gear
    const mods: ImmediateHandlerResult["statModifiers"] = [];
    for (const stat of STAT_NAMES) {
      mods.push({ stat, value: gearCount });
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: `+${gearCount} All Stats từ ${gearCount} gear(s)`,
    };
  },
  "+1 All per gear",
);

/**
 * W Speed - +1 Speed per 5 base stat total
 */
registerImmediateHandler(
  "w_speed_per_5_base",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const totalBase = STAT_NAMES.reduce(
      (sum, stat) => sum + ctx.baseStats[stat],
      0,
    );
    const bonus = Math.floor(totalBase / 5);

    if (bonus === 0) return { skipDefault: true };

    return {
      statModifiers: [{ stat: "speed", value: bonus }],
      skipDefault: true,
      description: `+${bonus} Speed (từ ${totalBase} total base stats / 5)`,
    };
  },
  "+1 Speed per 5 base stat total",
);

/**
 * Mid Stats Five - Set all stats to 5
 */
// registerImmediateHandler(
//   'mid_stats_five',
//   (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
//     const mods: ImmediateHandlerResult['statModifiers'] = [];

//     for (const stat of STAT_NAMES) {
//       const diff = 5 - ctx.baseStats[stat];
//       if (diff !== 0) {
//         mods.push({ stat, value: diff, isBase: true });
//       }
//     }

//     return {
//       statModifiers: mods,
//       skipDefault: true,
//       description: 'Set tất cả base stats về 5',
//     };
//   },
//   'Set all base stats to 5'
// );

/**
 * Ascended - Top 2 stats get +3
 */
registerImmediateHandler(
  "ascended_top_2_stats",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Find top 2 stats
    const sorted = [...STAT_NAMES].sort(
      (a, b) => ctx.currentStats[b] - ctx.currentStats[a],
    );
    const top2 = sorted.slice(0, 2);

    const mods: ImmediateHandlerResult["statModifiers"] = [];
    for (const stat of top2) {
      mods.push({ stat, value: 3 });
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: `+3 to top 2 stats: ${top2.join(", ")}`,
    };
  },
  "+3 to top 2 stats",
);

/**
 * Mang Bản Chân - +1 All if all base stats are 1
 */
registerImmediateHandler(
  "mang_ban_chan_stats_1",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const allOnes = STAT_NAMES.every((stat) => ctx.baseStats[stat] === 1);

    if (!allOnes) return { skipDefault: true };

    const mods: ImmediateHandlerResult["statModifiers"] = [];
    for (const stat of STAT_NAMES) {
      mods.push({ stat, value: 5 });
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: "+5 All Stats (tất cả base stats là 1)",
    };
  },
  "+5 All if all base stats are 1",
);

/**
 * Bohemians - Stats 9 or 9
 */
registerImmediateHandler(
  "bohemians_stats_99",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const mods: ImmediateHandlerResult["statModifiers"] = [];

    for (const stat of STAT_NAMES) {
      // Set to either 9 or 9 (both are 9 lol, but the concept is "9 or 9")
      const diff = 9 - ctx.baseStats[stat];
      if (diff !== 0) {
        mods.push({ stat, value: diff, isBase: true });
      }
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: "Set tất cả stats về 9",
    };
  },
  "Set all stats to 9",
);

/**
 * Metamorphosis Random Stat
 * Random 1 trong 6 hiệu ứng cố định: +1 Str, +7 Spd, +7 Dur, +0 IQ, +1 BIQ, +3 MA
 */
registerImmediateHandler(
  "metamorphosis_random_stat",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const options: { stat: StatName; label: string; value: number }[] = [
      { stat: "strength", label: "STR", value: 1 },
      { stat: "speed", label: "SPD", value: 7 },
      { stat: "durability", label: "DUR", value: 7 },
      { stat: "iq", label: "IQ", value: 0 },
      { stat: "biq", label: "BIQ", value: 1 },
      { stat: "ma", label: "MA", value: 3 },
    ];
    const chosen = options[Math.floor(Math.random() * options.length)];

    // If value is 0, still return but with no actual modifier
    if (chosen.value === 0) {
      return {
        statModifiers: [],
        skipDefault: true,
        description: `+0 ${chosen.label} từ Metamorphosis`,
      };
    }

    return {
      statModifiers: [{ stat: chosen.stat, value: chosen.value, isBase: true }],
      skipDefault: true,
      description: `+${chosen.value} ${chosen.label} từ Metamorphosis`,
    };
  },
  "Random stat bonus from fixed options",
);

/**
 * Mad Scientist Random Size
 */
registerImmediateHandler(
  "mad_scientist_random_size",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Random +1 to +6 to each stat
    const mods: ImmediateHandlerResult["statModifiers"] = [];

    for (const stat of STAT_NAMES) {
      const value = Math.floor(Math.random() * 6) + 1;
      mods.push({ stat, value });
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: "Random +1 to +6 to each stat",
    };
  },
  "Random +1 to +6 to each stat",
);

/**
 * Promised Consort - Stats based on lover's stats
 */
registerImmediateHandler(
  "promised_consort_lover_stat",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This needs access to lover's character data which we don't have here
    // Return empty for now - would need to be handled at a higher level
    return {
      skipDefault: true,
      description: "Stats based on lover (cần data lover)",
    };
  },
  "Stats based on lover stats",
);

/**
 * Kinetics - Convert Speed to Strength
 */
registerImmediateHandler(
  "kinetics_speed_to_str",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const speedValue = ctx.currentStats.speed;

    return {
      statModifiers: [
        { stat: "speed", value: -speedValue },
        { stat: "strength", value: speedValue },
      ],
      skipDefault: true,
      description: `Convert ${speedValue} Speed to Strength`,
    };
  },
  "Convert Speed to Strength",
);

/**
 * Sagacity - Convert Speed to IQ
 */
registerImmediateHandler(
  "sagacity_speed_to_iq",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const speedValue = ctx.currentStats.speed;

    return {
      statModifiers: [
        { stat: "speed", value: -speedValue },
        { stat: "iq", value: speedValue },
      ],
      skipDefault: true,
      description: `Convert ${speedValue} Speed to IQ`,
    };
  },
  "Convert Speed to IQ",
);

// EscAPADe handler moved to power-handlers.ts
// It only converts IQ BONUS (not base IQ) to Strength

/**
 * Epiphany - Convert Power count to IQ
 */
registerImmediateHandler(
  "epiphany_power_to_iq",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const powerCount = countItemsOfType(ctx.character, "power");

    if (powerCount === 0) return { skipDefault: true };

    return {
      statModifiers: [{ stat: "iq", value: powerCount }],
      skipDefault: true,
      description: `+${powerCount} IQ từ ${powerCount} power(s)`,
    };
  },
  "+1 IQ per power",
);

/**
 * Femboy Lover AIDS Count
 * Với mỗi Lover có "AIDS", nhận +1 all stats. (Tính cả các Lover đã chết)
 */
registerImmediateHandler(
  "femboy_lover_aids_count",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const lovers = ctx.character.lover || [];
    if (lovers.length === 0) return { skipDefault: true };

    // Need allCharacters to check if lovers have AIDS
    if (!ctx.allCharacters || ctx.allCharacters.length === 0) {
      return { skipDefault: true };
    }

    // Count lovers who have AIDS power (including dead/lost lovers)
    let loversWithAIDS = 0;
    for (const lover of lovers) {
      const loverName = lover.name.toLowerCase();
      // Find lover in allCharacters by matching username or name
      const loverChar = ctx.allCharacters.find((c) => {
        const username = c.username?.toLowerCase() || "";
        const name = c.name?.toLowerCase() || "";
        return (
          (username && loverName.includes(username)) ||
          (name && loverName.includes(name))
        );
      });

      if (loverChar) {
        // Check if this lover has AIDS power (don't skip lost AIDS - still counts)
        const loverHasAIDS = (loverChar.powers || []).some((p: any) =>
          p.name.toLowerCase().includes("aids"),
        );
        if (loverHasAIDS) loversWithAIDS++;
      }
    }

    if (loversWithAIDS === 0) {
      return {
        skipDefault: true,
        description: `0 Lover có AIDS (${lovers.length} lover(s) checked)`,
      };
    }

    const mods: ImmediateHandlerResult["statModifiers"] = [];
    for (const stat of STAT_NAMES) {
      mods.push({ stat, value: loversWithAIDS });
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: `Femboy`,
    };
  },
  "+1 All Stats per Lover with AIDS",
);

/**
 * Diablo Wrath Stacks - +1 STR/BIQ/MA per Wrath stack
 * Vật chủ nhận +1 Strength, +1 BIQ và +1 MA với mỗi Stack "Wrath" tồn tại trong người
 */
registerImmediateHandler(
  "diablo_wrath_stacks",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const wrathStacks = ctx.character.wrathStacks || 0;

    if (wrathStacks === 0) return { skipDefault: true };

    return {
      statModifiers: [
        { stat: "strength", value: wrathStacks },
        { stat: "biq", value: wrathStacks },
        { stat: "ma", value: wrathStacks },
      ],
      skipDefault: true,
      description: `${wrathStacks} Wrath stack(s)`,
    };
  },
  "+1 STR/BIQ/MA per Wrath stack",
);

export function registerStatHandlers(): void {
  // All handlers are registered via registerImmediateHandler calls above
  console.log("Stat handlers registered");
}
