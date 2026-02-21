/**
 * House-based Immediate Handlers
 *
 * Handlers cho các House effects (immediate timing).
 */

import { registerImmediateHandler } from '../registry';
import type { ImmediateHandlerContext, ImmediateHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// HALLOWNEST - Guaranteed Weapon + 2 Runes
// ============================================================================

/**
 * Hallownest - Chắc chắn có Weapon, chắc chắn có 2 Rune lên Weapon đó.
 */
registerImmediateHandler(
  'hallownest_guaranteed_weapon_runes',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Chắc chắn nhận 1 Weapon và 2 Rune lên Weapon đó (Hallownest)',
    };
  },
  'Guaranteed weapon + 2 runes'
);

// ============================================================================
// HALLOWNEST MASON - Guaranteed Weapon + 3 Runes
// ============================================================================

/**
 * Hallownest Mason - Chắc chắn có Weapon, chắc chắn có 3 Rune lên Weapon đó.
 */
registerImmediateHandler(
  'hallownest_mason_guaranteed_weapon_3_runes',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Chắc chắn nhận 1 Weapon và 3 Rune lên Weapon đó (Hallownest Mason)',
    };
  },
  'Guaranteed weapon + 3 runes (Mason)'
);

// ============================================================================
// TRACEN ACADEMY - Random Stats (1-3 per physical stat)
// ============================================================================

/**
 * Tracen Academy - Nhận ngẫu nhiên 1-3 Str, 1-3 Spd, 1-3 Dur.
 */
registerImmediateHandler(
  'tracen_academy_random_stats',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const strBonus = Math.floor(Math.random() * 3) + 1; // 1-3
    const spdBonus = Math.floor(Math.random() * 3) + 1;
    const durBonus = Math.floor(Math.random() * 3) + 1;

    return {
      statModifiers: [
        { stat: 'strength', value: strBonus },
        { stat: 'speed', value: spdBonus },
        { stat: 'durability', value: durBonus },
      ],
      skipDefault: true,
      description: `Tracen Academy: +${strBonus} Str, +${spdBonus} Spd, +${durBonus} Dur`,
    };
  },
  'Random 1-3 for Str/Spd/Dur'
);

// ============================================================================
// BLESSING OF MIGHT - Convert highest base stat to all others
// ============================================================================

/**
 * Blessing of Might (Naga Sub) - Chỉ số có Base cao nhất bị kéo xuống 0.
 * Với mỗi 3 điểm mất đi, nhận +1 vào all stats khác.
 */
registerImmediateHandler(
  'blessing_might_convert_stat',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Find highest base stat
    let highestStat: StatName = 'strength';
    let highestVal = ctx.baseStats.strength;
    for (const stat of STAT_NAMES) {
      if (ctx.baseStats[stat] > highestVal) {
        highestVal = ctx.baseStats[stat];
        highestStat = stat;
      }
    }

    // Calculate bonus: every 3 points lost = +1 all others
    const bonus = Math.floor(highestVal / 3);

    const mods: Array<{ stat: StatName; value: number; isBase?: boolean }> = [];

    // Set highest stat to 0 (remove its base value)
    mods.push({ stat: highestStat, value: -highestVal, isBase: true });

    // Add bonus to all other stats
    for (const stat of STAT_NAMES) {
      if (stat !== highestStat) {
        mods.push({ stat, value: bonus });
      }
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: `Blessing of Might: ${highestStat} (${highestVal}) → 0, +${bonus} all other stats`,
    };
  },
  'Convert highest base stat to +1 all others per 3 points'
);

// ============================================================================
// BLESSING OF REFORGE - Grant Rune or +1 all stats
// ============================================================================

/**
 * Blessing of Reforge (Naga Sub) - Nhận 1 Rune nếu có thể.
 * Nếu không thể, nhận +1 all stats thay vào đó.
 */
registerImmediateHandler(
  'blessing_reforge_rune',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Check if character has a weapon that can receive runes
    const weapons = ctx.character.weapons || [];
    const hasWeapon = weapons.length > 0;

    if (hasWeapon) {
      // Has weapon → grant rune (handled by grant system, just describe)
      return {
        skipDefault: true,
        description: 'Blessing of Reforge: Nhận 1 Rune lên Weapon',
      };
    }

    // No weapon → +1 all stats instead
    return {
      statModifiers: STAT_NAMES.map(stat => ({ stat, value: 1 })),
      skipDefault: true,
      description: 'Blessing of Reforge: Không có Weapon → +1 all stats',
    };
  },
  'Grant 1 Rune or +1 all stats if no weapon'
);

// ============================================================================
// WINTERHOME MASON - +1 all other stats per 5 Base Dura
// ============================================================================

/**
 * Winterhome Mason - Với mỗi 5 Base Dura, nhận +1 vào all stats khác ngoài Dura.
 */
registerImmediateHandler(
  'winterhome_mason_dura_bonus',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const baseDura = ctx.baseStats.durability ?? 0;
    const bonus = Math.floor(baseDura / 5);

    if (bonus === 0) {
      return {
        skipDefault: true,
        description: `Winterhome Mason: Base Dura ${baseDura} < 5, không nhận bonus`,
      };
    }

    const mods = STAT_NAMES
      .filter(s => s !== 'durability')
      .map(stat => ({ stat, value: bonus }));

    return {
      statModifiers: mods,
      skipDefault: true,
      description: `Winterhome Mason: +${bonus} vào all stats trừ Dura (${baseDura} Base Dura / 5)`,
    };
  },
  '+1 all other stats per 5 Base Dura (Winterhome Mason)'
);

export function registerHouseImmediateHandlers() {
  // All handlers are registered at module level via registerImmediateHandler calls above.
  // This function exists to be called from the handler index for explicit initialization.
}
