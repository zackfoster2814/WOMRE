/**
 * Gear-based Immediate Handlers
 *
 * Handlers cho các Gear effects.
 */

import { registerImmediateHandler } from '../registry';
import type { ImmediateHandlerContext, ImmediateHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// GOLDEN COIN EFFECTS
// ============================================================================

/**
 * Golden Coin - Starting point bonus
 */
registerImmediateHandler(
  'golden_coin_starting_point',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat effect
    return {
      skipDefault: true,
      description: '+1 starting point (Golden Coin)',
    };
  },
  '+1 starting point'
);

/**
 * Multiple Golden Coins bonus
 */
registerImmediateHandler(
  'golden_coins_stack',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const gear = ctx.character.gear || [];
    const gears = Array.isArray(gear) ? gear : [gear];
    const coinCount = gears.filter((g: any) => !g.isLost && g.name === 'Đồng Tiền Vàng').length;

    if (coinCount >= 3) {
      return {
        statModifiers: [{ stat: 'biq', value: coinCount }],
        skipDefault: true,
        description: `+${coinCount} BIQ (${coinCount} Golden Coins)`,
      };
    }

    return { skipDefault: true };
  },
  'BIQ bonus for multiple coins'
);

// ============================================================================
// LEVIATHAN MARK
// ============================================================================

/**
 * Leviathan's Mark - Tracking effect
 */
registerImmediateHandler(
  'leviathan_mark_effect',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Marked by Leviathan',
    };
  },
  'Leviathan mark tracker'
);

// ============================================================================
// RING EFFECTS
// ============================================================================

/**
 * Ring of Power - Stat bonus
 */
registerImmediateHandler(
  'ring_of_power',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'strength', value: 2 }],
      skipDefault: true,
      description: '+2 Strength (Ring of Power)',
    };
  },
  '+2 Strength'
);

/**
 * Ring of Speed
 */
registerImmediateHandler(
  'ring_of_speed',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'speed', value: 2 }],
      skipDefault: true,
      description: '+2 Speed (Ring of Speed)',
    };
  },
  '+2 Speed'
);

/**
 * Ring of Protection
 */
registerImmediateHandler(
  'ring_of_protection',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'durability', value: 2 }],
      skipDefault: true,
      description: '+2 Durability (Ring of Protection)',
    };
  },
  '+2 Durability'
);

/**
 * Ring of Wisdom
 */
registerImmediateHandler(
  'ring_of_wisdom',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'iq', value: 2 }],
      skipDefault: true,
      description: '+2 IQ (Ring of Wisdom)',
    };
  },
  '+2 IQ'
);

/**
 * Ring of Charisma
 */
registerImmediateHandler(
  'ring_of_charisma',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'biq', value: 2 }],
      skipDefault: true,
      description: '+2 BIQ (Ring of Charisma)',
    };
  },
  '+2 BIQ'
);

/**
 * Ring of Combat
 */
registerImmediateHandler(
  'ring_of_combat',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'ma', value: 2 }],
      skipDefault: true,
      description: '+2 MA (Ring of Combat)',
    };
  },
  '+2 MA'
);

// ============================================================================
// AMULET EFFECTS
// ============================================================================

/**
 * Amulet of Balance
 */
registerImmediateHandler(
  'amulet_of_balance',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Find highest and lowest stats
    let highestStat: StatName = 'strength';
    let lowestStat: StatName = 'strength';
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
  'Balance highest/lowest stats'
);

// ============================================================================
// CLOAK EFFECTS
// ============================================================================

/**
 * Cloak of Shadows
 */
registerImmediateHandler(
  'cloak_of_shadows',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: 'speed', value: 2 },
        { stat: 'biq', value: 1 },
      ],
      skipDefault: true,
      description: '+2 Speed, +1 BIQ (Cloak of Shadows)',
    };
  },
  '+2 Speed, +1 BIQ'
);

// ============================================================================
// BOOK EFFECTS
// ============================================================================

/**
 * Tome of Knowledge
 */
registerImmediateHandler(
  'tome_of_knowledge',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'iq', value: 3 }],
      skipDefault: true,
      description: '+3 IQ (Tome of Knowledge)',
    };
  },
  '+3 IQ'
);

/**
 * Spellbook
 */
registerImmediateHandler(
  'spellbook_effect',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: 'iq', value: 1 },
        { stat: 'ma', value: 2 },
      ],
      skipDefault: true,
      description: '+1 IQ, +2 MA (Spellbook)',
    };
  },
  '+1 IQ, +2 MA'
);

// ============================================================================
// POTION EFFECTS
// ============================================================================

/**
 * Strength Potion
 */
registerImmediateHandler(
  'strength_potion',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'strength', value: 3 }],
      skipDefault: true,
      description: '+3 Strength (Potion)',
    };
  },
  '+3 Strength'
);

/**
 * Speed Potion
 */
registerImmediateHandler(
  'speed_potion',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'speed', value: 3 }],
      skipDefault: true,
      description: '+3 Speed (Potion)',
    };
  },
  '+3 Speed'
);

/**
 * Intelligence Potion
 */
registerImmediateHandler(
  'intelligence_potion',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'iq', value: 3 }],
      skipDefault: true,
      description: '+3 IQ (Potion)',
    };
  },
  '+3 IQ'
);

// ============================================================================
// ARMOR PIECES
// ============================================================================

/**
 * Heavy Armor
 */
registerImmediateHandler(
  'heavy_armor_effect',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: 'durability', value: 4 },
        { stat: 'speed', value: -2 },
      ],
      skipDefault: true,
      description: '+4 Durability, -2 Speed (Heavy Armor)',
    };
  },
  '+4 Durability, -2 Speed'
);

/**
 * Light Armor
 */
registerImmediateHandler(
  'light_armor_effect',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: 'durability', value: 2 },
        { stat: 'speed', value: 1 },
      ],
      skipDefault: true,
      description: '+2 Durability, +1 Speed (Light Armor)',
    };
  },
  '+2 Durability, +1 Speed'
);

/**
 * Magic Robe
 */
registerImmediateHandler(
  'magic_robe_effect',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: 'ma', value: 2 },
        { stat: 'iq', value: 1 },
      ],
      skipDefault: true,
      description: '+2 MA, +1 IQ (Magic Robe)',
    };
  },
  '+2 MA, +1 IQ'
);

// ============================================================================
// CURSED GEAR
// ============================================================================

/**
 * Cursed Coin - 50/50 effect
 */
registerImmediateHandler(
  'cursed_coin_effect',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is actually a combat effect
    return {
      skipDefault: true,
      description: '50/50 +3/-3 points (Cursed Coin)',
    };
  },
  '50/50 point flip'
);

export function registerGearHandlers(): void {
  console.log('Gear handlers registered');
}
