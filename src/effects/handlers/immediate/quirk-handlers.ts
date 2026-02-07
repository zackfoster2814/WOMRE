/**
 * Quirk-based Immediate Handlers
 *
 * Handlers cho các Quirk effects.
 */

import { registerImmediateHandler } from '../registry';
import type { ImmediateHandlerContext, ImmediateHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// QUIRK HANDLERS
// ============================================================================

/**
 * Lucky - 5% max roll
 */
registerImmediateHandler(
  'lucky_max_roll',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a passive effect that modifies wheel spins
    // No immediate stat effect
    return {
      skipDefault: true,
      description: '5% max roll (passive)',
    };
  },
  '5% chance for max roll on wheels'
);

/**
 * Independent - No house, +2 random after combat
 */
registerImmediateHandler(
  'independent_no_house',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This removes house - handled elsewhere
    // The +2 random is after_combat, not immediate
    return {
      skipDefault: true,
      description: 'Không thuộc House nào',
    };
  },
  'Cannot join houses'
);

/**
 * Blind - Cannot gain points from certain stats
 */
registerImmediateHandler(
  'blind_no_point',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat restriction
    return {
      skipDefault: true,
      description: 'Không nhận điểm từ một số rounds',
    };
  },
  'Cannot gain points from certain rounds'
);

/**
 * Cautious - Cannot gain points from Strength
 */
registerImmediateHandler(
  'cautious_no_str_point',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Không nhận điểm từ round Strength',
    };
  },
  'Cannot gain points from Strength round'
);

/**
 * One Trick Pony - Select one stat to focus
 */
registerImmediateHandler(
  'one_trick_pony_stat_selection',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Find the highest stat and boost it
    let highestStat: StatName = 'strength';
    let highestValue = ctx.currentStats.strength;

    for (const stat of STAT_NAMES) {
      if (ctx.currentStats[stat] > highestValue) {
        highestValue = ctx.currentStats[stat];
        highestStat = stat;
      }
    }

    return {
      statModifiers: [{ stat: highestStat, value: 3 }],
      skipDefault: true,
      description: `+3 ${highestStat} (One Trick Pony)`,
    };
  },
  '+3 to highest stat'
);

/**
 * Cheater - Multiple lovers check
 */
registerImmediateHandler(
  'cheater_multi_lover_check',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const lover = ctx.character.lover as string | string[] | undefined;
    let loverCount = 0;

    if (lover) {
      if (Array.isArray(lover)) {
        loverCount = lover.length;
      } else if (typeof lover === 'string' && lover.trim() !== '') {
        loverCount = 1;
      }
    }

    if (loverCount >= 2) {
      return {
        statModifiers: [{ stat: 'biq', value: loverCount }],
        skipDefault: true,
        description: `+${loverCount} BIQ từ ${loverCount} lovers (Cheater)`,
      };
    }

    return { skipDefault: true };
  },
  'BIQ bonus for multiple lovers'
);

/**
 * Patient - No power wheel initially
 */
registerImmediateHandler(
  'patient_no_power_wheel',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Không có power wheel ban đầu',
    };
  },
  'No initial power wheel'
);

/**
 * Patient - Max power wheel later
 */
registerImmediateHandler(
  'patient_max_power_wheel',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Power wheel tối đa sau đó',
    };
  },
  'Max power wheel later'
);

/**
 * Impatient - Instant rewards
 */
registerImmediateHandler(
  'impatient_instant_rewards',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Get all rewards immediately
    return {
      skipDefault: true,
      description: 'Nhận rewards ngay lập tức',
    };
  },
  'Receive rewards immediately'
);

/**
 * Cluttered Mind - Check for powers
 */
registerImmediateHandler(
  'cluttered_mind_check',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const powerCount = (ctx.character.powers || []).filter((p: any) => !p.isLost).length;

    if (powerCount >= 5) {
      return {
        statModifiers: [{ stat: 'iq', value: -2 }],
        skipDefault: true,
        description: '-2 IQ (quá nhiều powers)',
      };
    }

    return { skipDefault: true };
  },
  '-2 IQ if too many powers'
);

/**
 * Let Me Solo Her - Solo bonus
 */
registerImmediateHandler(
  'let_me_solo_her',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Check if no team members
    const team = ctx.character.team;
    if (!team || team === 0) {
      return {
        statModifiers: STAT_NAMES.map(stat => ({ stat, value: 2 })),
        skipDefault: true,
        description: '+2 All Stats (solo)',
      };
    }

    return { skipDefault: true };
  },
  '+2 All Stats if solo'
);

/**
 * Progressive - Reroll ability
 */
registerImmediateHandler(
  'progressive_reroll',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Có thể reroll',
    };
  },
  'Can reroll'
);

/**
 * Artistic - Bonus with instrument
 */
registerImmediateHandler(
  'artistic_vs_instrument',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Check for instrument weapons
    const instruments = ['Guitar', 'Violin', 'Piano', 'Drums', 'Flute', 'Bagpipe', 'Harmonica'];
    const hasInstrument = (ctx.character.weapons || []).some(
      (w: any) => !w.isLost && instruments.some(i => w.name.includes(i))
    );

    if (hasInstrument) {
      return {
        statModifiers: [{ stat: 'biq', value: 3 }],
        skipDefault: true,
        description: '+3 BIQ (có nhạc cụ)',
      };
    }

    return { skipDefault: true };
  },
  '+3 BIQ with instrument'
);

/**
 * Weak Knee - First round penalty
 */
registerImmediateHandler(
  'weak_knee_first_round',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat effect
    return {
      skipDefault: true,
      description: 'Penalty ở round đầu',
    };
  },
  'First round penalty'
);

/**
 * Cruelty - Tie coinflip advantage
 */
registerImmediateHandler(
  'cruelty_tie_coinflip',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Ưu thế khi hòa',
    };
  },
  'Advantage on tie coinflip'
);

export function registerQuirkHandlers(): void {
  console.log('Quirk handlers registered');
}
