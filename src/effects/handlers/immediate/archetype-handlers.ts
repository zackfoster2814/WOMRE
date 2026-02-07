/**
 * Archetype-based Immediate Handlers
 *
 * Handlers cho các Archetype effects.
 */

import { registerImmediateHandler } from '../registry';
import type { ImmediateHandlerContext, ImmediateHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// INVOKER ARCHETYPE
// ============================================================================

/**
 * Invoker - Bonus for having all 3 orbs
 */
registerImmediateHandler(
  'invoker_orb_bonus',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const powers = (ctx.character.powers || []).filter((p: any) => !p.isLost);
    const powerNames = powers.map((p: any) => p.name);

    const hasQuas = powerNames.includes('Quas');
    const hasWex = powerNames.includes('Wex');
    const hasExort = powerNames.includes('Exort');

    if (hasQuas && hasWex && hasExort) {
      return {
        statModifiers: STAT_NAMES.map(stat => ({ stat, value: 2 })),
        skipDefault: true,
        description: '+2 all stats (Invoker orb synergy)',
      };
    }

    return { skipDefault: true };
  },
  '+2 all stats with all orbs'
);

// ============================================================================
// EGOIST ARCHETYPE
// ============================================================================

/**
 * Egoist - Auto-win check (all stats higher)
 */
registerImmediateHandler(
  'egoist_stats_check',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is actually a combat handler, not immediate
    return {
      skipDefault: true,
      description: 'Auto-win if all stats higher (combat)',
    };
  },
  'Egoist auto-win check'
);

// ============================================================================
// PACIFIST ARCHETYPE
// ============================================================================

/**
 * Pacifist - No combat bonuses, extra rewards
 */
registerImmediateHandler(
  'pacifist_peace_bonus',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Double rewards on loss (Pacifist)',
    };
  },
  'Pacifist peace bonus'
);

// ============================================================================
// PALADIN ARCHETYPE
// ============================================================================

/**
 * Paladin - Holy weapon bonus
 */
registerImmediateHandler(
  'paladin_holy_bonus',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const weapons = ctx.character.weapons || [];
    const hasHolyWeapon = weapons.some((w: any) => !w.isLost && w.element === 'holy');

    if (hasHolyWeapon) {
      return {
        statModifiers: [
          { stat: 'ma', value: 2 },
          { stat: 'durability', value: 1 },
        ],
        skipDefault: true,
        description: '+2 MA, +1 Durability (Paladin with holy weapon)',
      };
    }

    return { skipDefault: true };
  },
  'Paladin holy weapon bonus'
);

// ============================================================================
// GIGACHAD ARCHETYPE
// ============================================================================

/**
 * Gigachad - Physical stat bonuses
 */
registerImmediateHandler(
  'gigachad_physical_bonus',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: 'strength', value: 2 },
        { stat: 'durability', value: 2 },
      ],
      skipDefault: true,
      description: '+2 Strength, +2 Durability (Gigachad)',
    };
  },
  '+2 Str/Dura (Gigachad)'
);

// ============================================================================
// FEMBOY ARCHETYPE
// ============================================================================

/**
 * Femboy - Social stat bonuses
 */
registerImmediateHandler(
  'femboy_social_bonus',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: 'biq', value: 2 },
        { stat: 'speed', value: 1 },
      ],
      skipDefault: true,
      description: '+2 BIQ, +1 Speed (Femboy)',
    };
  },
  '+2 BIQ, +1 Speed (Femboy)'
);

// ============================================================================
// NOBLEMAN ARCHETYPE
// ============================================================================

/**
 * Nobleman - Leadership bonus
 */
registerImmediateHandler(
  'nobleman_leadership',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Bonus per lower tier race in tournament
    const charData = ctx.character as any;
    const tier = charData.raceTier || 5;
    const bonus = Math.max(0, 5 - tier);

    if (bonus > 0) {
      return {
        statModifiers: [{ stat: 'iq', value: bonus }],
        skipDefault: true,
        description: `+${bonus} IQ (Nobleman leadership)`,
      };
    }

    return { skipDefault: true };
  },
  'Nobleman leadership bonus'
);

// ============================================================================
// ASSASSIN ARCHETYPE
// ============================================================================

/**
 * Assassin - Speed focus
 */
registerImmediateHandler(
  'assassin_stealth_bonus',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: 'speed', value: 3 },
        { stat: 'durability', value: -1 },
      ],
      skipDefault: true,
      description: '+3 Speed, -1 Durability (Assassin)',
    };
  },
  '+3 Speed, -1 Durability (Assassin)'
);

// ============================================================================
// BERSERKER ARCHETYPE
// ============================================================================

/**
 * Berserker - Rage bonus
 */
registerImmediateHandler(
  'berserker_rage_bonus',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: 'strength', value: 3 },
        { stat: 'iq', value: -2 },
      ],
      skipDefault: true,
      description: '+3 Strength, -2 IQ (Berserker)',
    };
  },
  '+3 Strength, -2 IQ (Berserker)'
);

// ============================================================================
// SCHOLAR ARCHETYPE
// ============================================================================

/**
 * Scholar - Intelligence focus
 */
registerImmediateHandler(
  'scholar_intellect_bonus',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: 'iq', value: 3 },
        { stat: 'strength', value: -1 },
      ],
      skipDefault: true,
      description: '+3 IQ, -1 Strength (Scholar)',
    };
  },
  '+3 IQ, -1 Strength (Scholar)'
);

// ============================================================================
// MERCHANT ARCHETYPE
// ============================================================================

/**
 * Merchant - Extra gear bonus
 */
registerImmediateHandler(
  'merchant_gear_bonus',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const gear = ctx.character.gear || [];
    const gearCount = (Array.isArray(gear) ? gear : [gear]).filter((g: any) => !g.isLost).length;

    if (gearCount >= 3) {
      return {
        statModifiers: [{ stat: 'biq', value: gearCount }],
        skipDefault: true,
        description: `+${gearCount} BIQ (Merchant with ${gearCount} gears)`,
      };
    }

    return { skipDefault: true };
  },
  'BIQ bonus per gear'
);

// ============================================================================
// WANDERER ARCHETYPE
// ============================================================================

/**
 * Wanderer - Random stat bonus
 */
registerImmediateHandler(
  'wanderer_journey_bonus',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      statModifiers: [{ stat: randomStat, value: 2 }],
      skipDefault: true,
      description: `+2 ${randomStat} (Wanderer)`,
    };
  },
  '+2 random stat (Wanderer)'
);

// ============================================================================
// HERO ARCHETYPE
// ============================================================================

/**
 * Hero - Balanced bonus
 */
registerImmediateHandler(
  'hero_balanced_bonus',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: STAT_NAMES.map(stat => ({ stat, value: 1 })),
      skipDefault: true,
      description: '+1 all stats (Hero)',
    };
  },
  '+1 all stats (Hero)'
);

// ============================================================================
// VILLAIN ARCHETYPE
// ============================================================================

/**
 * Villain - Debuff focused
 */
registerImmediateHandler(
  'villain_menace_bonus',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: 'biq', value: 2 },
        { stat: 'strength', value: 1 },
      ],
      skipDefault: true,
      description: '+2 BIQ, +1 Strength (Villain)',
    };
  },
  '+2 BIQ, +1 Strength (Villain)'
);

export function registerArchetypeHandlers(): void {
  console.log('Archetype handlers registered');
}
