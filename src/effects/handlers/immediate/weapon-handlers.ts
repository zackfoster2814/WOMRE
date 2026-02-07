/**
 * Weapon-based Immediate Handlers
 *
 * Handlers cho các Weapon effects.
 */

import { registerImmediateHandler } from '../registry';
import type { ImmediateHandlerContext, ImmediateHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// WEAPON USABILITY CHECKS
// ============================================================================

/**
 * Check if character can use a 2-handed weapon
 */
registerImmediateHandler(
  'weapon_2h_check',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const minStr = 5;
    if (ctx.currentStats.strength >= minStr) {
      return {
        skipDefault: false,
        description: 'Can use 2-handed weapon',
      };
    }
    return {
      skipDefault: true,
      description: 'Cannot use 2-handed weapon (Str < 5)',
    };
  },
  '2-handed weapon strength check'
);

/**
 * Check if character can use a bow
 */
registerImmediateHandler(
  'weapon_bow_check',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const minDex = 4;
    if (ctx.currentStats.speed >= minDex) {
      return {
        skipDefault: false,
        description: 'Can use bow',
      };
    }
    return {
      skipDefault: true,
      description: 'Cannot use bow (Speed < 4)',
    };
  },
  'Bow speed check'
);

/**
 * Check if character can use magic weapon
 */
registerImmediateHandler(
  'weapon_magic_check',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const minIQ = 4;
    if (ctx.currentStats.iq >= minIQ) {
      return {
        skipDefault: false,
        description: 'Can use magic weapon',
      };
    }
    return {
      skipDefault: true,
      description: 'Cannot use magic weapon (IQ < 4)',
    };
  },
  'Magic weapon IQ check'
);

// ============================================================================
// UNIQUE WEAPON EFFECTS
// ============================================================================

/**
 * Mjolnir - Requires worthiness
 */
registerImmediateHandler(
  'mjolnir_worthy_check',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Thor or Gods can always use
    const charRace = ctx.character.race;
    const race = charRace?.race?.toLowerCase() || '';
    const subRace = charRace?.subRace?.toLowerCase() || '';

    if (race === 'god' || subRace === 'thor') {
      return {
        skipDefault: false,
        description: 'Worthy to wield Mjolnir',
      };
    }

    // High MA requirement for others
    if (ctx.currentStats.ma >= 8) {
      return {
        skipDefault: false,
        description: 'Worthy to wield Mjolnir (MA >= 8)',
      };
    }

    return {
      skipDefault: true,
      description: 'Not worthy to wield Mjolnir',
    };
  },
  'Mjolnir worthiness check'
);

/**
 * Excalibur - Noble lineage
 */
registerImmediateHandler(
  'excalibur_lineage_check',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const archetypes = ctx.character.archetypes || [];
    const hasNoble = archetypes.some((a: any) =>
      ['Noble', 'King', 'Queen', 'Prince', 'Princess'].includes(a.name)
    );

    if (hasNoble) {
      return {
        statModifiers: STAT_NAMES.map(stat => ({ stat, value: 2 })),
        skipDefault: false,
        description: '+2 all stats (Noble wielding Excalibur)',
      };
    }

    return { skipDefault: true };
  },
  'Excalibur noble bonus'
);

/**
 * Masamune/Muramasa - Cursed weapon
 */
registerImmediateHandler(
  'cursed_weapon_check',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // BIQ check for cursed weapons
    if (ctx.currentStats.biq >= 6) {
      return {
        skipDefault: false,
        description: 'Can control cursed weapon',
      };
    }
    return {
      statModifiers: [
        { stat: 'biq', value: -2 },
        { stat: 'strength', value: 2 },
      ],
      skipDefault: false,
      description: '-2 BIQ, +2 Str (cursed weapon)',
    };
  },
  'Cursed weapon BIQ check'
);

// ============================================================================
// DUAL WIELDING
// ============================================================================

registerImmediateHandler(
  'dual_wield_check',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const weapons = ctx.character.weapons || [];
    const activeWeapons = weapons.filter((w: any) => !w.isLost && w.equipped);

    if (activeWeapons.length >= 2) {
      return {
        statModifiers: [{ stat: 'speed', value: -1 }],
        skipDefault: true,
        description: '-1 Speed (dual wielding)',
      };
    }

    return { skipDefault: true };
  },
  'Dual wield speed penalty'
);

// ============================================================================
// INSTRUMENT WEAPONS
// ============================================================================

registerImmediateHandler(
  'instrument_biq_bonus',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const instruments = ['Guitar', 'Violin', 'Piano', 'Drums', 'Flute', 'Bagpipe', 'Harmonica'];
    const weapons = ctx.character.weapons || [];
    const hasInstrument = weapons.some(
      (w: any) => !w.isLost && instruments.some(i => w.name?.includes(i))
    );

    if (hasInstrument) {
      return {
        statModifiers: [{ stat: 'biq', value: 2 }],
        skipDefault: true,
        description: '+2 BIQ (instrument weapon)',
      };
    }

    return { skipDefault: true };
  },
  '+2 BIQ with instrument'
);

// ============================================================================
// ELEMENTAL WEAPONS
// ============================================================================

registerImmediateHandler(
  'fire_weapon_bonus',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'strength', value: 1 }],
      skipDefault: true,
      description: '+1 Strength (fire weapon)',
    };
  },
  '+1 Strength from fire element'
);

registerImmediateHandler(
  'ice_weapon_bonus',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'durability', value: 1 }],
      skipDefault: true,
      description: '+1 Durability (ice weapon)',
    };
  },
  '+1 Durability from ice element'
);

registerImmediateHandler(
  'lightning_weapon_bonus',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'speed', value: 1 }],
      skipDefault: true,
      description: '+1 Speed (lightning weapon)',
    };
  },
  '+1 Speed from lightning element'
);

registerImmediateHandler(
  'holy_weapon_bonus',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'ma', value: 1 }],
      skipDefault: true,
      description: '+1 MA (holy weapon)',
    };
  },
  '+1 MA from holy element'
);

registerImmediateHandler(
  'dark_weapon_bonus',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'biq', value: 1 }],
      skipDefault: true,
      description: '+1 BIQ (dark weapon)',
    };
  },
  '+1 BIQ from dark element'
);

export function registerWeaponHandlers(): void {
  console.log('Weapon handlers registered');
}
