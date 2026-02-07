/**
 * Power-based Immediate Handlers
 *
 * Handlers cho các Power effects.
 */

import { registerImmediateHandler } from '../registry';
import type { ImmediateHandlerContext, ImmediateHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// INVOKER POWERS (Quas/Wex/Exort)
// ============================================================================

/**
 * Check if character has all 3 Invoker orbs
 */
registerImmediateHandler(
  'quas_wex_exort_check',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const powers = (ctx.character.powers || []).filter((p: any) => !p.isLost);
    const powerNames = powers.map((p: any) => p.name);

    const hasQuas = powerNames.includes('Quas');
    const hasWex = powerNames.includes('Wex');
    const hasExort = powerNames.includes('Exort');

    if (hasQuas && hasWex && hasExort) {
      return {
        skipDefault: false, // Allow the grant_archetype effect to proceed
        description: 'Invoker unlocked (has Quas+Wex+Exort)',
      };
    }

    return {
      skipDefault: true,
      description: 'Missing orbs for Invoker',
    };
  },
  'Check for Invoker orbs combination'
);

// ============================================================================
// STAT CONVERSION POWERS
// ============================================================================

/**
 * EscAPADe - Convert IQ bonus to Strength
 */
registerImmediateHandler(
  'escapade_convert_iq_to_str',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const baseIQ = ctx.baseStats.iq;
    const currentIQ = ctx.currentStats.iq;
    const iqBonus = currentIQ - baseIQ;

    if (iqBonus > 0) {
      return {
        statModifiers: [
          { stat: 'iq', value: -iqBonus },
          { stat: 'strength', value: iqBonus },
        ],
        skipDefault: true,
        description: `Convert +${iqBonus} IQ to +${iqBonus} Strength (EscAPADe)`,
      };
    }

    return { skipDefault: true };
  },
  'Convert IQ bonus to Strength'
);

/**
 * Weapon Enhancing - +1 to each buff from weapon, -1 to each debuff
 */
registerImmediateHandler(
  'weapon_enhancing_modify',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This would need to track weapon stat bonuses
    // For now, just mark as passive
    return {
      skipDefault: true,
      description: 'Weapon stats enhanced (passive)',
    };
  },
  'Enhance weapon stats'
);

// ============================================================================
// CONDITIONAL POWER GRANTS
// ============================================================================

/**
 * Quirkful - Grant 1 Power per Quirk
 */
registerImmediateHandler(
  'quirkful_grant_per_quirk',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const quirkCount = (ctx.character.quirks || []).filter((q: any) => !q.isLost).length;

    if (quirkCount > 0) {
      return {
        skipDefault: false, // Allow the grant_power effect to proceed
        description: `Will receive ${quirkCount} Power(s) from Quirkful`,
      };
    }

    return { skipDefault: true };
  },
  'Grant Powers based on Quirk count'
);

/**
 * Quirkless - Remove all Quirks
 */
registerImmediateHandler(
  'quirkless_remove_all_quirks',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This would need to actually remove quirks
    return {
      skipDefault: true,
      description: 'All quirks removed',
    };
  },
  'Remove all quirks'
);

/**
 * Sybaurafarming - Base stats > 5 become 5, gain 1 Quirk per stat changed
 */
registerImmediateHandler(
  'sybaurafarming_effect',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const modifiers: Array<{ stat: StatName; value: number; isBase?: boolean }> = [];
    let statsChanged = 0;

    for (const stat of STAT_NAMES) {
      if (ctx.baseStats[stat] > 5) {
        const diff = 5 - ctx.baseStats[stat];
        modifiers.push({ stat, value: diff, isBase: true });
        statsChanged++;
      }
    }

    if (statsChanged > 0) {
      return {
        statModifiers: modifiers,
        skipDefault: true,
        description: `${statsChanged} stats capped to 5, will receive ${statsChanged} Quirks`,
      };
    }

    return { skipDefault: true };
  },
  'Cap high stats and grant Quirks'
);

// ============================================================================
// CONDITIONAL STAT BONUSES
// ============================================================================

/**
 * Groundwork - +2 Str/Spd if has at least 3 other Powers
 */
registerImmediateHandler(
  'groundwork_3_powers_check',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const powerCount = (ctx.character.powers || []).filter((p: any) => !p.isLost).length;

    // Need at least 3 OTHER powers (not counting Groundwork itself)
    if (powerCount >= 4) {
      return {
        statModifiers: [
          { stat: 'strength', value: 2 },
          { stat: 'speed', value: 2 },
        ],
        skipDefault: true,
        description: '+2 Strength, +2 Speed (has 3+ Powers)',
      };
    }

    return { skipDefault: true };
  },
  '+2 Str/Spd with 3+ Powers'
);

/**
 * Fist Fighting - Remove weapon
 */
registerImmediateHandler(
  'fist_fighting_remove_weapon',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This would need to mark weapons as lost
    return {
      skipDefault: true,
      description: 'Weapons removed for Fist Fighting',
    };
  },
  'Remove weapons'
);

/**
 * Master of War - Unlock all weapons
 */
registerImmediateHandler(
  'master_of_war_unlock_all_weapons',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'All weapons now usable',
    };
  },
  'Unlock all weapons'
);

// ============================================================================
// COMBAT CONDITION CHECKS (used as preconditions)
// ============================================================================

/**
 * Gate to Heaven - Bonus from Round 32 onwards in winner bracket
 */
registerImmediateHandler(
  'gate_to_heaven_round_check',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This needs round info which isn't available here
    // The actual check should be in combat handler
    return {
      skipDefault: true,
      description: '+1 all stats from Round 32 (passive)',
    };
  },
  '+1 all stats from Round 32'
);

/**
 * Luck Manipulation - Round 64 check
 */
registerImmediateHandler(
  'luck_manipulation_round_64_check',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This needs round info
    return {
      skipDefault: true,
      description: 'Luck Manipulation bonus (passive)',
    };
  },
  'Luck bonus from Round 64'
);

// ============================================================================
// SPEAR OF FIRE - 2 Rune Check
// ============================================================================

registerImmediateHandler(
  'spear_of_fire_2_rune_check',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const weapons = ctx.character.weapons || [];
    const equippedWeapon = weapons.find((w: any) => !w.isLost && w.equipped) as any;

    if (equippedWeapon && equippedWeapon.runes && Array.isArray(equippedWeapon.runes) && equippedWeapon.runes.length >= 2) {
      return {
        skipDefault: false,
        description: '+1 starting point (weapon has 2+ runes)',
      };
    }

    return { skipDefault: true };
  },
  '+1 point if weapon has 2 runes'
);

// ============================================================================
// ENHANCED HEARING CHECKS
// ============================================================================

registerImmediateHandler(
  'enhanced_hearing_instrument_check',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat-time check
    return {
      skipDefault: true,
      description: 'Instrument weakness (passive)',
    };
  },
  '-1 all vs instrument'
);

registerImmediateHandler(
  'enhanced_hearing_sound_power_check',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat-time check
    return {
      skipDefault: true,
      description: 'Sound power weakness (passive)',
    };
  },
  '-2 all vs sound power'
);

// ============================================================================
// AIDS SPREAD
// ============================================================================

registerImmediateHandler(
  'aids_spread_to_lover',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const lover = ctx.character.lover as string | string[] | undefined;
    const hasLover = lover && (Array.isArray(lover) ? lover.length > 0 : true);

    if (hasLover) {
      return {
        skipDefault: true,
        description: 'AIDS spreads to lover(s)',
      };
    }

    return { skipDefault: true };
  },
  'Spread AIDS to lover'
);

// ============================================================================
// LONE WOLF CHECK
// ============================================================================

registerImmediateHandler(
  'lone_wolf_check',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is checked after combat
    return {
      skipDefault: true,
      description: 'Lone Wolf power check (after combat)',
    };
  },
  'Check for other Lone Wolf users'
);

// ============================================================================
// GARLIC BREATH CHECK
// ============================================================================

registerImmediateHandler(
  'garlic_breath_check',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Check if has 3+ Breath powers
    const powers = (ctx.character.powers || []).filter((p: any) => !p.isLost);
    const breathPowers = powers.filter((p: any) => p.name.includes('Breath'));

    if (breathPowers.length >= 3) {
      return {
        statModifiers: STAT_NAMES.map(stat => ({ stat, value: 1 })),
        skipDefault: true,
        description: '+1 all stats (has 3+ Breath powers)',
      };
    }

    // Otherwise it's a combat check vs Vampire
    return {
      skipDefault: true,
      description: '+1 all stats vs Vampire (combat)',
    };
  },
  '+1 all vs Vampire or with 3 Breath powers'
);

// ============================================================================
// ODIN BLESSING - Convert bonus after loss
// ============================================================================

registerImmediateHandler(
  'odin_blessing_convert_to_highest',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This triggers after combat loss
    return {
      skipDefault: true,
      description: '+2 Strength converts to highest stat on loss',
    };
  },
  'Convert Strength bonus to highest stat on loss'
);

// ============================================================================
// ZOLTRAAK - Double BIQ Round
// ============================================================================

registerImmediateHandler(
  'zoltraak_double_biq_round',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat mechanic
    return {
      skipDefault: true,
      description: 'BIQ round plays twice',
    };
  },
  'Double BIQ round'
);

// ============================================================================
// UNO REVERSE CARD
// ============================================================================

registerImmediateHandler(
  'uno_reverse_card_swap_debuffs',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat mechanic
    return {
      skipDefault: true,
      description: 'Debuffs are swapped between players',
    };
  },
  'Swap debuffs with opponent'
);

// ============================================================================
// FANCY FEET - Disable Rune
// ============================================================================

registerImmediateHandler(
  'fancy_feet_disable_rune',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat mechanic
    return {
      skipDefault: true,
      description: 'Opponent runes disabled',
    };
  },
  'Disable opponent runes'
);

// ============================================================================
// MEMORY ALTER
// ============================================================================

registerImmediateHandler(
  'memory_alter_disable_in_combat_power',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat mechanic
    return {
      skipDefault: true,
      description: 'Disable opponent "during combat" power',
    };
  },
  'Disable in-combat power'
);

// ============================================================================
// FROST FINGERS
// ============================================================================

registerImmediateHandler(
  'frost_fingers_per_gear',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat debuff
    return {
      skipDefault: true,
      description: '-1 highest stat per gear (max 5)',
    };
  },
  '-1 highest stat per gear'
);

// ============================================================================
// GUIDANCE
// ============================================================================

registerImmediateHandler(
  'guidance_fewer_powers_check',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat check
    return {
      skipDefault: true,
      description: '+1 to 2 random stats if opponent has fewer powers',
    };
  },
  '+1 to 2 stats if opponent has fewer powers'
);

// ============================================================================
// STAT ABSORPTION
// ============================================================================

registerImmediateHandler(
  'stat_absorption_opponent_highest',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This triggers after combat win
    return {
      skipDefault: true,
      description: '+1 to opponent highest stat on win',
    };
  },
  '+1 to opponent highest stat'
);

// ============================================================================
// BUCKING BRONCO
// ============================================================================

registerImmediateHandler(
  'bucking_bronco_ma_round_win',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This triggers after winning MA round and combat
    return {
      skipDefault: true,
      description: '+1 MA if won MA round and combat (stacks)',
    };
  },
  '+1 MA on MA round win'
);

// ============================================================================
// HUNTERS MARK
// ============================================================================

registerImmediateHandler(
  'hunters_mark_random_round',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat mechanic
    const randomRound = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      skipDefault: true,
      description: `Hunter's Mark on ${randomRound} round`,
    };
  },
  '+1 point on marked round win'
);

export function registerPowerHandlers(): void {
  console.log('Power handlers registered');
}
