/**
 * Gear-based Immediate Handlers
 *
 * Handlers cho các Gear effects.
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
// GOLDEN COIN EFFECTS
// ============================================================================

/**
 * Golden Coin - Starting point bonus
 */
registerImmediateHandler(
  "golden_coin_starting_point",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat effect
    return {
      skipDefault: true,
      description: "+1 starting point (Golden Coin)",
    };
  },
  "+1 starting point",
);

/**
 * Multiple Golden Coins bonus
 */
registerImmediateHandler(
  "golden_coins_stack",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const gear = ctx.character.gear || [];
    const gears = Array.isArray(gear) ? gear : [gear];
    const coinCount = gears.filter(
      (g: any) => !g.isLost && g.name === "Đồng Tiền Vàng",
    ).length;

    if (coinCount >= 3) {
      return {
        statModifiers: [{ stat: "biq", value: coinCount }],
        skipDefault: true,
        description: `+${coinCount} BIQ (${coinCount} Golden Coins)`,
      };
    }

    return { skipDefault: true };
  },
  "BIQ bonus for multiple coins",
);

// ============================================================================
// LEVIATHAN MARK
// ============================================================================

/**
 * Leviathan's Mark - Tracking effect
 */
registerImmediateHandler(
  "leviathan_mark_effect",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Marked by Leviathan",
    };
  },
  "Leviathan mark tracker",
);

// ============================================================================
// RING EFFECTS
// ============================================================================

/**
 * Ring of Power - Stat bonus
 */
registerImmediateHandler(
  "ring_of_power",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: "strength", value: 2 }],
      skipDefault: true,
      description: "+2 Strength (Ring of Power)",
    };
  },
  "+2 Strength",
);

/**
 * Ring of Speed
 */
registerImmediateHandler(
  "ring_of_speed",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: "speed", value: 2 }],
      skipDefault: true,
      description: "+2 Speed (Ring of Speed)",
    };
  },
  "+2 Speed",
);

/**
 * Ring of Protection
 */
registerImmediateHandler(
  "ring_of_protection",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: "durability", value: 2 }],
      skipDefault: true,
      description: "+2 Durability (Ring of Protection)",
    };
  },
  "+2 Durability",
);

/**
 * Ring of Wisdom
 */
registerImmediateHandler(
  "ring_of_wisdom",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: "iq", value: 2 }],
      skipDefault: true,
      description: "+2 IQ (Ring of Wisdom)",
    };
  },
  "+2 IQ",
);

/**
 * Ring of Charisma
 */
registerImmediateHandler(
  "ring_of_charisma",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: "biq", value: 2 }],
      skipDefault: true,
      description: "+2 BIQ (Ring of Charisma)",
    };
  },
  "+2 BIQ",
);

/**
 * Ring of Combat
 */
registerImmediateHandler(
  "ring_of_combat",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: "ma", value: 2 }],
      skipDefault: true,
      description: "+2 MA (Ring of Combat)",
    };
  },
  "+2 MA",
);

// ============================================================================
// AMULET EFFECTS
// ============================================================================

/**
 * Amulet of Balance
 */
registerImmediateHandler(
  "amulet_of_balance",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Find highest and lowest stats
    let highestStat: StatName = "strength";
    let lowestStat: StatName = "strength";
    let highestValue = ctx.currentStats.strength;
    let lowestValue = ctx.currentStats.strength;

    for (const stat of STAT_NAMES) {
      if (ctx.currentStats[stat] > highestValue) {
        highestValue = ctx.currentStats[stat];
        highestStat = stat;
      }
      if (ctx.currentStats[stat] < lowestValue) {
        lowestValue = ctx.currentStats[stat];
        lowestStat = stat;
      }
    }

    const diff = Math.floor((highestValue - lowestValue) / 2);
    if (diff > 0) {
      return {
        statModifiers: [
          { stat: highestStat, value: -diff },
          { stat: lowestStat, value: diff },
        ],
        skipDefault: true,
        description: `Balance: -${diff} ${highestStat}, +${diff} ${lowestStat}`,
      };
    }

    return { skipDefault: true };
  },
  "Balance highest/lowest stats",
);

// ============================================================================
// CLOAK EFFECTS
// ============================================================================

/**
 * Cloak of Shadows
 */
registerImmediateHandler(
  "cloak_of_shadows",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: "speed", value: 2 },
        { stat: "biq", value: 1 },
      ],
      skipDefault: true,
      description: "+2 Speed, +1 BIQ (Cloak of Shadows)",
    };
  },
  "+2 Speed, +1 BIQ",
);

// ============================================================================
// BOOK EFFECTS
// ============================================================================

/**
 * Tome of Knowledge
 */
registerImmediateHandler(
  "tome_of_knowledge",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: "iq", value: 3 }],
      skipDefault: true,
      description: "+3 IQ (Tome of Knowledge)",
    };
  },
  "+3 IQ",
);

/**
 * Spellbook
 */
registerImmediateHandler(
  "spellbook_effect",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: "iq", value: 1 },
        { stat: "ma", value: 2 },
      ],
      skipDefault: true,
      description: "+1 IQ, +2 MA (Spellbook)",
    };
  },
  "+1 IQ, +2 MA",
);

// ============================================================================
// POTION EFFECTS
// ============================================================================

/**
 * Strength Potion
 */
registerImmediateHandler(
  "strength_potion",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: "strength", value: 3 }],
      skipDefault: true,
      description: "+3 Strength (Potion)",
    };
  },
  "+3 Strength",
);

/**
 * Speed Potion
 */
registerImmediateHandler(
  "speed_potion",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: "speed", value: 3 }],
      skipDefault: true,
      description: "+3 Speed (Potion)",
    };
  },
  "+3 Speed",
);

/**
 * Intelligence Potion
 */
registerImmediateHandler(
  "intelligence_potion",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: "iq", value: 3 }],
      skipDefault: true,
      description: "+3 IQ (Potion)",
    };
  },
  "+3 IQ",
);

// ============================================================================
// ARMOR PIECES
// ============================================================================

/**
 * Heavy Armor
 */
registerImmediateHandler(
  "heavy_armor_effect",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: "durability", value: 4 },
        { stat: "speed", value: -2 },
      ],
      skipDefault: true,
      description: "+4 Durability, -2 Speed (Heavy Armor)",
    };
  },
  "+4 Durability, -2 Speed",
);

/**
 * Light Armor
 */
registerImmediateHandler(
  "light_armor_effect",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: "durability", value: 2 },
        { stat: "speed", value: 1 },
      ],
      skipDefault: true,
      description: "+2 Durability, +1 Speed (Light Armor)",
    };
  },
  "+2 Durability, +1 Speed",
);

/**
 * Magic Robe
 */
registerImmediateHandler(
  "magic_robe_effect",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: "ma", value: 2 },
        { stat: "iq", value: 1 },
      ],
      skipDefault: true,
      description: "+2 MA, +1 IQ (Magic Robe)",
    };
  },
  "+2 MA, +1 IQ",
);

// ============================================================================
// CURSED GEAR
// ============================================================================

/**
 * Cursed Coin - 50/50 effect
 */
registerImmediateHandler(
  "cursed_coin_effect",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is actually a combat effect
    return {
      skipDefault: true,
      description: "50/50 +3/-3 points (Cursed Coin)",
    };
  },
  "50/50 point flip",
);

// ============================================================================
// CUỘN KHĂN GIẤY (Tissue Roll)
// ============================================================================

/**
 * Cuộn khăn giấy - Conditional stat bonus based on Lover status
 * If no Lover: +1 Durability
 * If has Lover: +1 Speed
 */
registerImmediateHandler(
  "cuon_khan_giay_lover_check",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const hasLover = ctx.character.lover && ctx.character.lover.length > 0;

    if (hasLover) {
      return {
        statModifiers: [{ stat: "speed", value: 1 }],
        skipDefault: true,
        description: "+1 Speed (Cuộn khăn giấy - có Lover)",
      };
    } else {
      return {
        statModifiers: [{ stat: "durability", value: 1 }],
        skipDefault: true,
        description: "+1 Durability (Cuộn khăn giấy - không có Lover)",
      };
    }
  },
  "Conditional stat based on Lover status",
);

// ============================================================================
// KẸO + ỚT COMBO
// ============================================================================

/**
 * Kẹo + Ớt combo - If character has both Kẹo and Ớt, +1 All Stats
 */
registerImmediateHandler(
  "keo_ot_combo",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Both Kẹo and Ớt call this handler — only apply once (from Kẹo) to avoid double bonus
    // Use startsWith because source name may include annotations like "Kẹo (Từ PvE)"
    if (!ctx.source.name.startsWith("Kẹo")) {
      return { skipDefault: true };
    }

    const gear = ctx.character.gear;
    const allGear = [
      ...(gear?.normalGear || []),
      ...(gear?.legacyGear || []),
    ].filter((g) => !g.isLost);

    // Use startsWith to match gear names with annotations like "Ớt (Từ Storage Room Key)"
    const hasKeo = allGear.some((g) => g.name.startsWith("Kẹo"));
    const hasOt = allGear.some((g) => g.name.startsWith("Ớt"));

    if (hasKeo && hasOt) {
      return {
        statModifiers: STAT_NAMES.map((stat) => ({ stat, value: 1 })),
        skipDefault: true,
        description: "Kẹo + Ớt",
      };
    }

    return { skipDefault: true };
  },
  "+1 All Stats if has both Kẹo and Ớt",
);

/**
 * Creator's Cat Ring - Nhận Creator's Favor 1-3 lần, mỗi lần +1 all stats
 * Reads subEffects from gear data (parsed from "-> +1 all stats" lines)
 */
registerImmediateHandler(
  'creator_cat_ring_favor',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const gear = ctx.character.gear;
    const allGear = [
      ...(gear?.normalGear || []),
      ...(gear?.legacyGear || []),
    ].filter((g) => !g.isLost);

    const ring = allGear.find((g) => g.name.startsWith("Creator's Cat Ring"));
    if (!ring) return { skipDefault: true };

    // Count "+1 all stats" sub-effects
    const favorCount = ring.subEffects?.filter((e) =>
      e.toLowerCase().includes('+1 all stats')
    ).length || 0;

    if (favorCount > 0) {
      return {
        statModifiers: STAT_NAMES.map((stat) => ({ stat, value: favorCount })),
        skipDefault: true,
        description: `Creator's Favor x${favorCount}`,
      };
    }

    return { skipDefault: true };
  },
  "Creator's Cat Ring: +1 All Stats per Creator's Favor"
);

export function registerGearHandlers(): void {
  console.log("Gear handlers registered");
}
