/**
 * Stat-based Immediate Handlers
 *
 * Handlers xử lý các effect liên quan đến stat calculation.
 */

import { registerImmediateHandler } from '../registry';
import type { ImmediateHandlerContext, ImmediateHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function findLowestStat(stats: Record<StatName, number>): StatName {
  let lowest: StatName = 'strength';
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

function getRandomStat(): StatName {
  return STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
}

function countItemsOfType(character: any, type: string): number {
  switch (type) {
    case 'power':
      return (character.powers || []).filter((p: any) => !p.isLost).length;
    case 'quirk':
      return (character.quirks || []).filter((q: any) => !q.isLost).length;
    case 'weapon':
      return (character.weapons || []).filter((w: any) => !w.isLost).length;
    case 'gear':
      const normalGear = (character.gear?.normalGear || []).filter((g: any) => !g.isLost);
      const legacyGear = (character.gear?.legacyGear || []).filter((g: any) => !g.isLost);
      return normalGear.length + legacyGear.length;
    case 'rune':
      return (character.runes?.runes || []).filter((r: any) => !r.isLost).length;
    case 'lover':
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
 */
registerImmediateHandler(
  'inversion_all_base_stats',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const mods: ImmediateHandlerResult['statModifiers'] = [];

    for (const stat of STAT_NAMES) {
      const currentBase = ctx.baseStats[stat];
      const newBase = 11 - currentBase;
      const diff = newBase - currentBase;

      if (diff !== 0) {
        mods.push({ stat, value: diff, isBase: true });
      }
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: 'Đảo ngược tất cả base stats (Stat = 11 - Stat cũ)',
    };
  },
  'Đảo ngược tất cả base stats'
);

/**
 * Graceful - +1 BIQ per lover
 */
registerImmediateHandler(
  'graceful_biq_per_lover',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const loverCount = countItemsOfType(ctx.character, 'lover');
    if (loverCount === 0) return { skipDefault: true };

    return {
      statModifiers: [{ stat: 'biq', value: loverCount }],
      skipDefault: true,
      description: `+${loverCount} BIQ từ ${loverCount} lover(s)`,
    };
  },
  '+1 BIQ per lover'
);

/**
 * In Love - Stat bonus từ việc có lover
 */
registerImmediateHandler(
  'in_love_stat_bonus',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const lover = ctx.character.lover as string | string[] | undefined;
    let hasLover = false;
    if (lover) {
      if (Array.isArray(lover)) {
        hasLover = lover.length > 0;
      } else if (typeof lover === 'string') {
        hasLover = lover.trim() !== '';
      }
    }

    if (!hasLover) return { skipDefault: true };

    // +2 to a random stat when in love
    const randomStat = getRandomStat();
    return {
      statModifiers: [{ stat: randomStat, value: 2 }],
      skipDefault: true,
      description: `+2 ${randomStat} từ In Love`,
    };
  },
  'Stat bonus khi có lover'
);

/**
 * 100 Girlfriends - +1 All stats per lover
 */
registerImmediateHandler(
  '100_girlfriends_stat_bonus',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const loverCount = countItemsOfType(ctx.character, 'lover');
    if (loverCount === 0) return { skipDefault: true };

    const mods: ImmediateHandlerResult['statModifiers'] = [];
    for (const stat of STAT_NAMES) {
      mods.push({ stat, value: loverCount });
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: `+${loverCount} All Stats từ ${loverCount} lover(s)`,
    };
  },
  '+1 All stats per lover'
);

/**
 * Overcome Habits - +1 All stats per quirk
 */
registerImmediateHandler(
  'overcome_habits_per_quirk',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const quirkCount = countItemsOfType(ctx.character, 'quirk');
    if (quirkCount === 0) return { skipDefault: true };

    const mods: ImmediateHandlerResult['statModifiers'] = [];
    for (const stat of STAT_NAMES) {
      mods.push({ stat, value: quirkCount });
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: `+${quirkCount} All Stats từ ${quirkCount} quirk(s)`,
    };
  },
  '+1 All stats per quirk'
);

/**
 * Quirkful Grant - +1 per quirk to a stat
 */
registerImmediateHandler(
  'quirkful_grant_per_quirk',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const quirkCount = countItemsOfType(ctx.character, 'quirk');
    if (quirkCount === 0) return { skipDefault: true };

    // Grant to lowest stat
    const lowestStat = findLowestStat(ctx.currentStats);
    return {
      statModifiers: [{ stat: lowestStat, value: quirkCount }],
      skipDefault: true,
      description: `+${quirkCount} ${lowestStat} từ ${quirkCount} quirk(s)`,
    };
  },
  '+1 per quirk to lowest stat'
);

/**
 * Frost Fingers - +1 per gear
 */
registerImmediateHandler(
  'frost_fingers_per_gear',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const gearCount = countItemsOfType(ctx.character, 'gear');
    if (gearCount === 0) return { skipDefault: true };

    return {
      statModifiers: [{ stat: 'iq', value: gearCount }],
      skipDefault: true,
      description: `+${gearCount} IQ từ ${gearCount} gear(s)`,
    };
  },
  '+1 IQ per gear'
);

/**
 * Iron Man - gear bonus
 */
registerImmediateHandler(
  'iron_man_gear_bonus',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const gearCount = countItemsOfType(ctx.character, 'gear');
    if (gearCount === 0) return { skipDefault: true };

    // +1 All per gear
    const mods: ImmediateHandlerResult['statModifiers'] = [];
    for (const stat of STAT_NAMES) {
      mods.push({ stat, value: gearCount });
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: `+${gearCount} All Stats từ ${gearCount} gear(s)`,
    };
  },
  '+1 All per gear'
);

/**
 * W Speed - +1 Speed per 5 base stat total
 */
registerImmediateHandler(
  'w_speed_per_5_base',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const totalBase = STAT_NAMES.reduce((sum, stat) => sum + ctx.baseStats[stat], 0);
    const bonus = Math.floor(totalBase / 5);

    if (bonus === 0) return { skipDefault: true };

    return {
      statModifiers: [{ stat: 'speed', value: bonus }],
      skipDefault: true,
      description: `+${bonus} Speed (từ ${totalBase} total base stats / 5)`,
    };
  },
  '+1 Speed per 5 base stat total'
);

/**
 * Mid Stats Five - Set all stats to 5
 */
registerImmediateHandler(
  'mid_stats_five',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const mods: ImmediateHandlerResult['statModifiers'] = [];

    for (const stat of STAT_NAMES) {
      const diff = 5 - ctx.baseStats[stat];
      if (diff !== 0) {
        mods.push({ stat, value: diff, isBase: true });
      }
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: 'Set tất cả base stats về 5',
    };
  },
  'Set all base stats to 5'
);

/**
 * Ascended - Top 2 stats get +3
 */
registerImmediateHandler(
  'ascended_top_2_stats',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Find top 2 stats
    const sorted = [...STAT_NAMES].sort((a, b) => ctx.currentStats[b] - ctx.currentStats[a]);
    const top2 = sorted.slice(0, 2);

    const mods: ImmediateHandlerResult['statModifiers'] = [];
    for (const stat of top2) {
      mods.push({ stat, value: 3 });
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: `+3 to top 2 stats: ${top2.join(', ')}`,
    };
  },
  '+3 to top 2 stats'
);

/**
 * Mang Bản Chân - +1 All if all base stats are 1
 */
registerImmediateHandler(
  'mang_ban_chan_stats_1',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const allOnes = STAT_NAMES.every(stat => ctx.baseStats[stat] === 1);

    if (!allOnes) return { skipDefault: true };

    const mods: ImmediateHandlerResult['statModifiers'] = [];
    for (const stat of STAT_NAMES) {
      mods.push({ stat, value: 5 });
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: '+5 All Stats (tất cả base stats là 1)',
    };
  },
  '+5 All if all base stats are 1'
);

/**
 * Bohemians - Stats 9 or 9
 */
registerImmediateHandler(
  'bohemians_stats_99',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const mods: ImmediateHandlerResult['statModifiers'] = [];

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
      description: 'Set tất cả stats về 9',
    };
  },
  'Set all stats to 9'
);

/**
 * Metamorphosis Random Stat
 */
registerImmediateHandler(
  'metamorphosis_random_stat',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const randomStat = getRandomStat();
    const value = Math.floor(Math.random() * 6) + 1; // 1-6

    return {
      statModifiers: [{ stat: randomStat, value, isBase: true }],
      skipDefault: true,
      description: `+${value} ${randomStat} từ Metamorphosis`,
    };
  },
  'Random stat bonus'
);

/**
 * Mad Scientist Random Size
 */
registerImmediateHandler(
  'mad_scientist_random_size',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Random +1 to +6 to each stat
    const mods: ImmediateHandlerResult['statModifiers'] = [];

    for (const stat of STAT_NAMES) {
      const value = Math.floor(Math.random() * 6) + 1;
      mods.push({ stat, value });
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: 'Random +1 to +6 to each stat',
    };
  },
  'Random +1 to +6 to each stat'
);

/**
 * Promised Consort - Stats based on lover's stats
 */
registerImmediateHandler(
  'promised_consort_lover_stat',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This needs access to lover's character data which we don't have here
    // Return empty for now - would need to be handled at a higher level
    return {
      skipDefault: true,
      description: 'Stats based on lover (cần data lover)',
    };
  },
  'Stats based on lover stats'
);

/**
 * Kinetics - Convert Speed to Strength
 */
registerImmediateHandler(
  'kinetics_speed_to_str',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const speedValue = ctx.currentStats.speed;

    return {
      statModifiers: [
        { stat: 'speed', value: -speedValue },
        { stat: 'strength', value: speedValue },
      ],
      skipDefault: true,
      description: `Convert ${speedValue} Speed to Strength`,
    };
  },
  'Convert Speed to Strength'
);

/**
 * Sagacity - Convert Speed to IQ
 */
registerImmediateHandler(
  'sagacity_speed_to_iq',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const speedValue = ctx.currentStats.speed;

    return {
      statModifiers: [
        { stat: 'speed', value: -speedValue },
        { stat: 'iq', value: speedValue },
      ],
      skipDefault: true,
      description: `Convert ${speedValue} Speed to IQ`,
    };
  },
  'Convert Speed to IQ'
);

/**
 * Escapade - Convert IQ to Strength
 */
registerImmediateHandler(
  'escapade_convert_iq_to_str',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const iqValue = ctx.currentStats.iq;

    return {
      statModifiers: [
        { stat: 'iq', value: -iqValue },
        { stat: 'strength', value: iqValue },
      ],
      skipDefault: true,
      description: `Convert ${iqValue} IQ to Strength`,
    };
  },
  'Convert IQ to Strength'
);

/**
 * Epiphany - Convert Power count to IQ
 */
registerImmediateHandler(
  'epiphany_power_to_iq',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const powerCount = countItemsOfType(ctx.character, 'power');

    if (powerCount === 0) return { skipDefault: true };

    return {
      statModifiers: [{ stat: 'iq', value: powerCount }],
      skipDefault: true,
      description: `+${powerCount} IQ từ ${powerCount} power(s)`,
    };
  },
  '+1 IQ per power'
);

/**
 * Femboy Lover AIDS Count
 */
registerImmediateHandler(
  'femboy_lover_aids_count',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Check if character has AIDS power
    const hasAIDS = (ctx.character.powers || []).some(
      (p: any) => !p.isLost && p.name.toLowerCase().includes('aids')
    );

    if (!hasAIDS) return { skipDefault: true };

    const loverCount = countItemsOfType(ctx.character, 'lover');
    if (loverCount === 0) return { skipDefault: true };

    return {
      statModifiers: [{ stat: 'biq', value: loverCount * 2 }],
      skipDefault: true,
      description: `+${loverCount * 2} BIQ từ AIDS và ${loverCount} lover(s)`,
    };
  },
  'BIQ bonus from AIDS and lovers'
);

export function registerStatHandlers(): void {
  // All handlers are registered via registerImmediateHandler calls above
  console.log('Stat handlers registered');
}
