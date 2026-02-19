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

// ============================================================================
// MID ARCHETYPE
// ============================================================================

/**
 * Mid - Toàn bộ stats = 5
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
      description: 'Toàn bộ Base Stats = 5 (Mid)',
    };
  },
  'Set all base stats to 5'
);

// ============================================================================
// DUAL WIELDER ARCHETYPE
// ============================================================================

/**
 * Dual Wielder - Dùng được 2 vũ khí
 */
registerImmediateHandler(
  'dual_wielder_two_weapons',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Dùng được 2 vũ khí (Dual Wielder)',
    };
  },
  'Can use 2 weapons'
);

// ============================================================================
// LOYAL ARCHETYPE
// ============================================================================

/**
 * Loyal - Chỉ có 1 Lover duy nhất
 */
registerImmediateHandler(
  'loyal_single_lover',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Chỉ có 1 Lover duy nhất (Loyal)',
    };
  },
  'Only 1 Lover allowed'
);

// ============================================================================
// BLACKSMITH ARCHETYPE
// ============================================================================

/**
 * Blacksmith - Chắc chắn có vũ khí runeword, dùng được mọi vũ khí
 */
registerImmediateHandler(
  'blacksmith_weapon_setup',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Chắc chắn có vũ khí Runeword, dùng được mọi vũ khí (Blacksmith)',
    };
  },
  'Guaranteed runeword weapon'
);

// ============================================================================
// NGƯỜI TRONG BAN NHẠC
// ============================================================================

/**
 * Người Trong Ban Nhạc - Setup instrument weapon + house
 */
registerImmediateHandler(
  'nguoi_trong_ban_nhac_setup',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: '36% Instrument Weapon, House "Ban Nhạc Ngọt Đoàn Kết" (Người Trong Ban Nhạc)',
    };
  },
  'Instrument weapon + band house setup'
);

// ============================================================================
// MASON ARCHETYPE
// ============================================================================

/**
 * Mason - Cường hóa House Feature
 */
registerImmediateHandler(
  'mason_enhanced_house_feature',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Cường hóa House Feature (Mason)',
    };
  },
  'Enhanced House Feature'
);

// ============================================================================
// AURA FARMER
// ============================================================================

/**
 * Aura Farmer - +2 all stats, chung kết không thua → +1 all, thua → mất
 */
registerImmediateHandler(
  'aura_farmer',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Check if character lost their Aura Farmer (isLost on the archetype)
    const nestedArchetypes = ctx.character.nestedArchetypes || [];
    const auraFarmer = nestedArchetypes.find(
      (a: any) => a.subType === 'Aura Farmer' || a.subSubType === 'Aura Farmer'
    );

    if (auraFarmer && (auraFarmer as any).isLost) {
      return {
        skipDefault: true,
        description: 'Aura Farmer đã mất aura',
      };
    }

    // Check if in finals bracket for extra bonus
    const inFinals = ctx.character.tournament?.bracket === 'winner' ||
      ctx.character.tournament?.round === 'final';

    if (inFinals) {
      // +2 all (base) + potentially +1 more
      return {
        statModifiers: STAT_NAMES.map(stat => ({ stat, value: 3 })),
        skipDefault: true,
        description: '+3 All Stats (Aura Farmer - chung kết)',
      };
    }

    return {
      skipDefault: false, // Let default +2 all stats apply
      description: '+2 All Stats (Aura Farmer)',
    };
  },
  '+2 all stats, extra in finals'
);

// ============================================================================
// THE FLASH (SUPERHERO)
// ============================================================================

/**
 * The Flash - Base Speed = 10
 */
registerImmediateHandler(
  'the_flash_speed_setup',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const diff = 10 - ctx.baseStats.speed;

    return {
      statModifiers: diff !== 0 ? [{ stat: 'speed', value: diff, isBase: true }] : [],
      skipDefault: true,
      description: `Base Speed = 10 (The Flash${diff !== 0 ? `, ${diff > 0 ? '+' : ''}${diff}` : ''})`,
    };
  },
  'Set Base Speed to 10'
);

// ============================================================================
// FAITHKEEPERS (NEW LONDON)
// ============================================================================

/**
 * Faithkeepers - Nhận toàn bộ Quirk của 1 người nhà New London khác
 */
registerImmediateHandler(
  'faithkeepers_copy_quirks',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Nhận toàn bộ Quirk của 1 người nhà New London khác (Faithkeepers)',
    };
  },
  'Copy quirks from New London housemate'
);

export function registerArchetypeHandlers(): void {
  console.log('Archetype handlers registered');
}
