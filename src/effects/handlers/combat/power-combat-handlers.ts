/**
 * Power Combat Handlers
 *
 * Combat handlers cho các Power effects.
 */

import { registerCombatHandler } from '../registry';
import type { CombatHandlerContext, CombatHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// U=ma2 HANDLERS
// ============================================================================

/**
 * U=ma2 - +3 Speed when losing Strength round
 */
registerCombatHandler(
  'uma2_str_lose',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Check if lost Strength round
    if (ctx.roundResults?.strength === 'lose') {
      return {
        selfStatMods: [{ stat: 'speed', value: 3 }],
        description: '+3 Speed (lost Strength round)',
      };
    }
    return { skipDefault: true };
  },
  '+3 Speed on Strength round loss'
);

/**
 * U=ma2 - +4 Durability when losing Speed round
 */
registerCombatHandler(
  'uma2_spd_lose',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.speed === 'lose') {
      return {
        selfStatMods: [{ stat: 'durability', value: 4 }],
        description: '+4 Durability (lost Speed round)',
      };
    }
    return { skipDefault: true };
  },
  '+4 Durability on Speed round loss'
);

// ============================================================================
// METAMAGIC - Extra point on BIQ win
// ============================================================================

registerCombatHandler(
  'metamagic_biq_round',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.biq === 'win') {
      return {
        selfPoints: 1,
        description: '+1 point (BIQ round win)',
      };
    }
    return { skipDefault: true };
  },
  '+1 point on BIQ round win'
);

// ============================================================================
// ARMOR PIERCING - Extra point on Dura win
// ============================================================================

registerCombatHandler(
  'armor_piercing_dura_round',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.durability === 'win') {
      return {
        selfPoints: 1,
        description: '+1 point (Durability round win)',
      };
    }
    return { skipDefault: true };
  },
  '+1 point on Durability round win'
);

// ============================================================================
// DIVINE SMITE - Extra point on MA win
// ============================================================================

registerCombatHandler(
  'divine_smite_ma_round',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.ma === 'win') {
      return {
        selfPoints: 1,
        description: '+1 point (MA round win)',
      };
    }
    return { skipDefault: true };
  },
  '+1 point on MA round win'
);

// ============================================================================
// ACCELERATING SORCERY - +1 IQ per "during combat" power activation
// ============================================================================

registerCombatHandler(
  'accelerating_sorcery_count',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const activations = ctx.self.duringCombatActivations || 0;
    if (activations > 0) {
      return {
        selfStatMods: [{ stat: 'iq', value: activations }],
        description: `+${activations} IQ (power activations)`,
      };
    }
    return { skipDefault: true };
  },
  '+1 IQ per power activation'
);

// ============================================================================
// HOMEGUARD - +3 Speed if no Strength loss
// ============================================================================

registerCombatHandler(
  'homeguard_no_str_lose',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.strength !== 'lose') {
      return {
        selfStatMods: [{ stat: 'speed', value: 3 }],
        description: '+3 Speed (no Strength loss)',
      };
    }
    return { skipDefault: true };
  },
  '+3 Speed if no Strength round loss'
);

// ============================================================================
// RED SHIFT / SHOOTING / PUMP IRON CHECK
// ============================================================================

registerCombatHandler(
  'red_shift_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Win at least 1 of first 3 rounds
    const first3 = ['strength', 'speed', 'durability'];
    const winsInFirst3 = first3.filter(
      r => ctx.roundResults?.[r as StatName] === 'win'
    ).length;

    if (winsInFirst3 >= 1) {
      return {
        selfStatMods: [
          { stat: 'iq', value: 1 },
          { stat: 'biq', value: 1 },
          { stat: 'ma', value: 2 },
        ],
        description: '+1 IQ, +1 BIQ, +2 MA (won 1+ of first 3)',
      };
    }
    return { skipDefault: true };
  },
  '+1 IQ/BIQ, +2 MA if won 1+ of first 3 rounds'
);

registerCombatHandler(
  'shooting_for_victory_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const first3 = ['strength', 'speed', 'durability'];
    const winsInFirst3 = first3.filter(
      r => ctx.roundResults?.[r as StatName] === 'win'
    ).length;
    const lossesInFirst3 = first3.filter(
      r => ctx.roundResults?.[r as StatName] === 'lose'
    ).length;

    if (winsInFirst3 >= 1 && lossesInFirst3 >= 1) {
      return {
        selfStatMods: [
          { stat: 'iq', value: 1 },
          { stat: 'biq', value: 1 },
          { stat: 'ma', value: 2 },
        ],
        description: '+1 IQ, +1 BIQ, +2 MA (mixed results in first 3)',
      };
    }
    return { skipDefault: true };
  },
  '+1 IQ/BIQ, +2 MA if mixed results in first 3'
);

registerCombatHandler(
  'pump_iron_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const first3 = ['strength', 'speed', 'durability'];
    const winsInFirst3 = first3.filter(
      r => ctx.roundResults?.[r as StatName] === 'win'
    ).length;

    if (winsInFirst3 === 1) {
      return {
        selfStatMods: [
          { stat: 'iq', value: 2 },
          { stat: 'biq', value: 2 },
          { stat: 'ma', value: 2 },
        ],
        description: '+2 IQ, +2 BIQ, +2 MA (won exactly 1 of first 3)',
      };
    }
    return { skipDefault: true };
  },
  '+2 IQ/BIQ/MA if won exactly 1 of first 3'
);

// ============================================================================
// ANGLING AND SCHEMING
// ============================================================================

registerCombatHandler(
  'angling_scheming_str_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.strength === 'win') {
      return {
        selfStatMods: [
          { stat: 'iq', value: 1 },
          { stat: 'biq', value: 1 },
          { stat: 'ma', value: 2 },
        ],
        description: '+1 IQ, +1 BIQ, +2 MA (won Strength)',
      };
    }
    return { skipDefault: true };
  },
  '+1 IQ/BIQ, +2 MA on Strength round win'
);

// ============================================================================
// NO STOPPING ME - Alternating wins/losses
// ============================================================================

registerCombatHandler(
  'no_stopping_me_alternating_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const first3 = ['strength', 'speed', 'durability'];
    const results = first3.map(r => ctx.roundResults?.[r as StatName]);

    // Check for W-L-W or L-W-L pattern
    const isAlternating =
      (results[0] === 'win' && results[1] === 'lose' && results[2] === 'win') ||
      (results[0] === 'lose' && results[1] === 'win' && results[2] === 'lose');

    if (isAlternating) {
      return {
        selfStatMods: [
          { stat: 'iq', value: 3 },
          { stat: 'biq', value: 3 },
          { stat: 'ma', value: 3 },
        ],
        description: '+3 IQ, +3 BIQ, +3 MA (alternating pattern)',
      };
    }
    return { skipDefault: true };
  },
  '+3 IQ/BIQ/MA on alternating pattern'
);

// ============================================================================
// GAZE OF THE ABYSS
// ============================================================================

registerCombatHandler(
  'gaze_of_abyss_5_loses',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.self.roundsLost >= 5) {
      return {
        selfPoints: 5,
        description: '+5 points (lost 5 rounds)',
      };
    }
    return { skipDefault: true };
  },
  '+5 points after 5 round losses'
);

// ============================================================================
// BORROWED TIME
// ============================================================================

registerCombatHandler(
  'borrowed_time_2_loses',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.self.roundsLost >= 2) {
      return {
        opponentPoints: 0, // Opponent gets no point on next loss
        description: 'Opponent gets no point on next round win',
      };
    }
    return { skipDefault: true };
  },
  'Deny opponent point after 2 losses'
);

// ============================================================================
// DOMINATOR
// ============================================================================

registerCombatHandler(
  'dominator_2_of_3_loses',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const first3 = ['strength', 'speed', 'durability'];
    const lossesInFirst3 = first3.filter(
      r => ctx.roundResults?.[r as StatName] === 'lose'
    ).length;

    if (lossesInFirst3 >= 2) {
      return {
        opponentStatMods: STAT_NAMES.map(stat => ({ stat, value: -1 })),
        description: '-1 all stats to opponent (lost 2+ of first 3)',
      };
    }
    return { skipDefault: true };
  },
  '-1 all stats to opponent if lost 2+ of first 3'
);

export function registerPowerCombatHandlers(): void {
  console.log('Power combat handlers registered');
}
