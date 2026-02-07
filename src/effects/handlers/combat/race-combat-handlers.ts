/**
 * Race Combat Handlers
 *
 * Combat handlers cho các Race effects.
 */

import { registerCombatHandler } from '../registry';
import type { CombatHandlerContext, CombatHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// ORC HANDLERS
// ============================================================================

/**
 * Orc - +2 lowest stat on win, -3 highest stat on lose
 */
registerCombatHandler(
  'orc_win_lowest_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Find lowest stat
    let lowestStat: StatName = 'strength';
    let lowestValue = ctx.self.stats.strength;

    for (const stat of STAT_NAMES) {
      if (ctx.self.stats[stat] < lowestValue) {
        lowestValue = ctx.self.stats[stat];
        lowestStat = stat;
      }
    }

    return {
      selfStatMods: [{ stat: lowestStat, value: 2 }],
      description: `+2 ${lowestStat} (Orc win bonus)`,
    };
  },
  '+2 lowest stat on win'
);

registerCombatHandler(
  'orc_lose_highest_penalty',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Find highest stat
    let highestStat: StatName = 'strength';
    let highestValue = ctx.self.stats.strength;

    for (const stat of STAT_NAMES) {
      if (ctx.self.stats[stat] > highestValue) {
        highestValue = ctx.self.stats[stat];
        highestStat = stat;
      }
    }

    return {
      selfStatMods: [{ stat: highestStat, value: -3 }],
      description: `-3 ${highestStat} (Orc lose penalty)`,
    };
  },
  '-3 highest stat on lose'
);

// ============================================================================
// GIANT HANDLERS
// ============================================================================

/**
 * Giant - Compare IQ vs Strength to determine bonuses
 */
registerCombatHandler(
  'giant_iq_vs_str_compare',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const baseIQ = ctx.self.baseStats?.iq || ctx.self.stats.iq;
    const baseStr = ctx.self.baseStats?.strength || ctx.self.stats.strength;

    if (baseIQ > baseStr) {
      return {
        selfStatMods: [
          { stat: 'iq', value: 5 },
          { stat: 'strength', value: -5 },
        ],
        description: '+5 IQ, -5 Strength (IQ > Str)',
      };
    } else if (baseStr > baseIQ) {
      return {
        selfStatMods: [
          { stat: 'strength', value: 5 },
          { stat: 'iq', value: -5 },
        ],
        description: '+5 Strength, -5 IQ (Str > IQ)',
      };
    } else {
      return {
        selfStatMods: [
          { stat: 'strength', value: 3 },
          { stat: 'iq', value: 3 },
        ],
        description: '+3 Strength, +3 IQ (equal)',
      };
    }
  },
  'Giant IQ vs Strength comparison'
);

// ============================================================================
// DEMI-GOD HANDLERS
// ============================================================================

/**
 * Demi-God - +1 all vs Human, -1 all vs God
 */
registerCombatHandler(
  'demigod_vs_human',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    if (ctx.opponent.race.toLowerCase() === 'human') {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
        description: '+1 all stats vs Human',
      };
    }
    return { skipDefault: true };
  },
  '+1 all stats vs Human'
);

registerCombatHandler(
  'demigod_vs_god',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    if (ctx.opponent.race.toLowerCase() === 'god') {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: -1 })),
        description: '-1 all stats vs God',
      };
    }
    return { skipDefault: true };
  },
  '-1 all stats vs God'
);

// ============================================================================
// DRAGON SUB-RACE HANDLERS
// ============================================================================

/**
 * Ancient Dragon - Disable opponent weapon
 */
registerCombatHandler(
  'ancient_dragon_weapon_disable',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      opponentWeaponDisabled: true,
      description: 'Opponent weapon disabled (Ancient Dragon)',
    };
  },
  'Disable opponent weapon'
);

/**
 * Thunder Dragon - +1 starting point (PvE)
 */
registerCombatHandler(
  'thunder_dragon_pve_point',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.isPvE) {
      return {
        selfPoints: 1,
        description: '+1 starting point (Thunder Dragon PvE)',
      };
    }
    return { skipDefault: true };
  },
  '+1 starting point in PvE'
);

// ============================================================================
// ANGEL RANK HANDLERS
// ============================================================================

/**
 * Principalities - +2 lowest stat after combat
 */
registerCombatHandler(
  'principalities_lowest_stat',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Find lowest stat
    let lowestStat: StatName = 'strength';
    let lowestValue = ctx.self.stats.strength;

    for (const stat of STAT_NAMES) {
      if (ctx.self.stats[stat] < lowestValue) {
        lowestValue = ctx.self.stats[stat];
        lowestStat = stat;
      }
    }

    return {
      selfStatMods: [{ stat: lowestStat, value: 2 }],
      description: `+2 ${lowestStat} (Principalities after combat)`,
    };
  },
  '+2 lowest stat after combat'
);

// ============================================================================
// DEMON SIN HANDLERS
// ============================================================================

/**
 * Asmodeus - +1 starting point if opponent has AIDS
 */
registerCombatHandler(
  'asmodeus_vs_aids',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const opponentPowers = ctx.opponent.powers || [];
    const hasAids = opponentPowers.some((p: any) => p.name === 'AIDS');

    if (hasAids) {
      return {
        selfPoints: 1,
        description: '+1 starting point (opponent has AIDS)',
      };
    }
    return { skipDefault: true };
  },
  '+1 point if opponent has AIDS'
);

// ============================================================================
// GOD HANDLERS
// ============================================================================

/**
 * Freyja - +1 point if opponent has Lover
 */
registerCombatHandler(
  'freyja_vs_lover',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const lover = ctx.opponent.lover;
    const hasLover = lover && (Array.isArray(lover) ? lover.length > 0 : true);

    if (hasLover) {
      return {
        selfPoints: 1,
        description: '+1 starting point (opponent has Lover)',
      };
    }
    return { skipDefault: true };
  },
  '+1 point if opponent has Lover'
);

/**
 * Bragi - +1 point vs instrument user
 */
registerCombatHandler(
  'bragi_vs_instrument',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const instruments = ['Guitar', 'Violin', 'Piano', 'Drums', 'Flute', 'Bagpipe', 'Harmonica'];
    const opponentWeapons = ctx.opponent.weapons || [];
    const hasInstrument = opponentWeapons.some(
      (w: any) => !w.isLost && instruments.some(i => w.name?.includes(i))
    );

    if (hasInstrument) {
      return {
        selfPoints: 1,
        description: '+1 starting point (opponent uses instrument)',
      };
    }
    return { skipDefault: true };
  },
  '+1 point vs instrument user'
);

/**
 * Thor - +1 point vs Human
 */
registerCombatHandler(
  'thor_vs_human',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    if (ctx.opponent.race.toLowerCase() === 'human') {
      return {
        selfPoints: 1,
        description: '+1 point vs Human (Thor)',
      };
    }
    return { skipDefault: true };
  },
  '+1 point vs Human'
);

/**
 * Týr - Grant Quirk on Strength round win
 */
registerCombatHandler(
  'tyr_str_win_quirk',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.strength === 'win') {
      return {
        skipDefault: false, // Allow quirk grant
        description: 'Grant Quirk (won Strength round)',
      };
    }
    return { skipDefault: true };
  },
  'Grant Quirk on Strength win'
);

/**
 * Frigg - Grant Power on IQ round win
 */
registerCombatHandler(
  'frigg_iq_win_power',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.iq === 'win') {
      return {
        skipDefault: false, // Allow power grant
        description: 'Grant Power (won IQ round)',
      };
    }
    return { skipDefault: true };
  },
  'Grant Power on IQ win'
);

// ============================================================================
// SECRET EVIL (Demi-God God's Gift)
// ============================================================================

registerCombatHandler(
  'secret_evil_highest_lowest',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Find highest and lowest stats
    let highestStat: StatName = 'strength';
    let lowestStat: StatName = 'strength';
    let highestValue = ctx.self.stats.strength;
    let lowestValue = ctx.self.stats.strength;

    for (const stat of STAT_NAMES) {
      if (ctx.self.stats[stat] > highestValue) {
        highestValue = ctx.self.stats[stat];
        highestStat = stat;
      }
      if (ctx.self.stats[stat] < lowestValue) {
        lowestValue = ctx.self.stats[stat];
        lowestStat = stat;
      }
    }

    return {
      selfStatMods: [
        { stat: highestStat, value: 2 },
        { stat: lowestStat, value: 2 },
      ],
      description: `+2 ${highestStat}, +2 ${lowestStat} (Secret Evil)`,
    };
  },
  '+2 to highest and lowest stats'
);

// ============================================================================
// ODIN - Isekai on winner bracket win
// ============================================================================

registerCombatHandler(
  'odin_isekai_winner_bracket',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.bracket === 'winner') {
      return {
        opponentIsekai: true,
        description: 'Opponent is Isekai-ed (Odin)',
      };
    }
    return { skipDefault: true };
  },
  'Isekai opponent on winner bracket win'
);

export function registerRaceCombatHandlers(): void {
  console.log('Race combat handlers registered');
}
