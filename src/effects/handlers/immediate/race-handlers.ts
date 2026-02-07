/**
 * Race-based Immediate Handlers
 *
 * Handlers cho các Race effects.
 */

import { registerImmediateHandler } from '../registry';
import type { ImmediateHandlerContext, ImmediateHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// SYMBIOSIS
// ============================================================================

registerImmediateHandler(
  'symbiosis_link',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Link to a random player
    return {
      skipDefault: true,
      description: 'Linked to a host player (symbiosis)',
    };
  },
  'Link to a host player'
);

// ============================================================================
// DRYAD
// ============================================================================

registerImmediateHandler(
  'dryad_death_buff',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This triggers when another Dryad dies
    return {
      skipDefault: true,
      description: '+2 random stat when another Dryad dies',
    };
  },
  '+2 random stat on Dryad death'
);

registerImmediateHandler(
  'dryad_last_standing',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This triggers when last Dryad standing
    return {
      skipDefault: true,
      description: 'Evolve to Yggdrasil (+9 random stat)',
    };
  },
  'Evolve to Yggdrasil'
);

// ============================================================================
// SPIRIT - SOULS STACK
// ============================================================================

registerImmediateHandler(
  'spirit_souls_stack',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Get current soul count from character (stored in custom data)
    const charData = ctx.character as any;
    const soulCount = charData.soulStacks || 0;
    const newCount = soulCount + 1;

    const modifiers: Array<{ stat: StatName; value: number }> = [];
    let description = `Soul stack: ${newCount}`;

    // Check thresholds
    if (newCount === 6) {
      modifiers.push({ stat: 'biq', value: 2 });
      description += ', +2 BIQ unlocked';
    } else if (newCount === 13) {
      modifiers.push(...STAT_NAMES.map(stat => ({ stat, value: 1 })));
      description += ', +1 all stats unlocked';
    }

    return {
      statModifiers: modifiers.length > 0 ? modifiers : undefined,
      skipDefault: true,
      description,
    };
  },
  '+1 soul stack per round lost'
);

// ============================================================================
// SKELETON/LICH EVOLUTION
// ============================================================================

registerImmediateHandler(
  'skeleton_iq_lock',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'iq', value: 0, isBase: true }], // IQ is always 1
      skipDefault: true,
      description: 'IQ locked at 1 (Skeleton)',
    };
  },
  'Lock IQ at 1'
);

// ============================================================================
// TROLL - LICH TROLL
// ============================================================================

registerImmediateHandler(
  'lich_troll_steal_dead',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This triggers after combat to steal from dead players
    return {
      skipDefault: true,
      description: 'Steal 1 Power from a dead player',
    };
  },
  'Steal Power from dead player'
);

// ============================================================================
// GOBLIN HORDE 100000
// ============================================================================

registerImmediateHandler(
  'goblin_100k_unique_weapon',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Guarantee unique weapon
    return {
      skipDefault: true,
      description: 'Guaranteed Unique Weapon',
    };
  },
  'Grant Unique Weapon'
);

// ============================================================================
// HUMAN SUB-RACES
// ============================================================================

registerImmediateHandler(
  'human_white_weapon_usable',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // All weapons usable and guaranteed weapon
    return {
      skipDefault: true,
      description: 'All weapons usable, guaranteed weapon',
    };
  },
  'All weapons usable'
);

registerImmediateHandler(
  'human_yellow_min_iq',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    if (ctx.baseStats.iq < 5) {
      const diff = 5 - ctx.baseStats.iq;
      return {
        statModifiers: [{ stat: 'iq', value: diff, isBase: true }],
        skipDefault: true,
        description: `IQ raised to 5 (+${diff})`,
      };
    }
    return { skipDefault: true };
  },
  'Minimum IQ 5'
);

registerImmediateHandler(
  'human_black_min_dura',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    if (ctx.baseStats.durability < 5) {
      const diff = 5 - ctx.baseStats.durability;
      return {
        statModifiers: [{ stat: 'durability', value: diff, isBase: true }],
        skipDefault: true,
        description: `Durability raised to 5 (+${diff})`,
      };
    }
    return { skipDefault: true };
  },
  'Minimum Durability 5'
);

// ============================================================================
// UMA PARENT HANDLERS
// ============================================================================

registerImmediateHandler(
  'haru_urara_late_game_buff',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This activates at round 32
    return {
      skipDefault: true,
      description: '-1 all stats becomes +2 all stats at Round 32',
    };
  },
  'Late game stat buff'
);

registerImmediateHandler(
  'gold_ship_coin_flip',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // 50/50 during combat
    const isLucky = Math.random() > 0.5;
    if (isLucky) {
      return {
        statModifiers: STAT_NAMES.map(stat => ({ stat, value: 1 })),
        skipDefault: true,
        description: '+1 all stats (Gold Ship lucky)',
      };
    } else {
      return {
        statModifiers: STAT_NAMES.map(stat => ({ stat, value: -1 })),
        skipDefault: true,
        description: '-1 all stats (Gold Ship unlucky)',
      };
    }
  },
  '50/50 for +1 or -1 all stats'
);

registerImmediateHandler(
  'symboli_rudolf_winner_bracket_final',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This triggers on winner bracket final win
    return {
      skipDefault: true,
      description: '+1 all stats on winner bracket final win',
    };
  },
  '+1 all stats on winner bracket final'
);

registerImmediateHandler(
  'tokai_teio_instrument_speed',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Check for instrument weapon
    const instruments = ['Guitar', 'Violin', 'Piano', 'Drums', 'Flute', 'Bagpipe', 'Harmonica'];
    const weapons = ctx.character.weapons || [];
    const hasInstrument = weapons.some(
      (w: any) => !w.isLost && instruments.some(i => w.name?.includes(i))
    );

    if (hasInstrument) {
      const baseSpeed = ctx.baseStats.speed;
      return {
        statModifiers: [{ stat: 'speed', value: baseSpeed }], // Double base speed
        skipDefault: true,
        description: `Speed doubled to ${baseSpeed * 2} (instrument)`,
      };
    }

    return { skipDefault: true };
  },
  'Double Speed with instrument'
);

registerImmediateHandler(
  'nice_nature_tie_win',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat tie-breaker
    return {
      skipDefault: true,
      description: 'Win on 3-3 tie (Nice Nature)',
    };
  },
  'Win on 3-3 tie'
);

registerImmediateHandler(
  'special_week_random_power',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const isGourmand = Math.random() > 0.5;
    return {
      skipDefault: true,
      description: `Receive ${isGourmand ? 'Gourmand' : 'Hydrate'} Power`,
    };
  },
  '50/50 Gourmand or Hydrate'
);

registerImmediateHandler(
  'el_condor_pasa_dura_win_buff',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This triggers after winning Dura round
    return {
      skipDefault: true,
      description: '+3 Speed, +3 Strength next combat if won Dura round',
    };
  },
  '+3 Speed/Strength after Dura round win'
);

registerImmediateHandler(
  'mork_high_risk_points',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat point mechanic
    return {
      skipDefault: true,
      description: 'Win round: +1 point. Lose round: lose all points.',
    };
  },
  'High risk point mechanic'
);

// ============================================================================
// DEMON SIN HANDLERS
// ============================================================================

registerImmediateHandler(
  'lucifer_max_power_wheel',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Power wheel maxed to 4',
    };
  },
  'Max Power wheel'
);

registerImmediateHandler(
  'beelzebub_max_random_stat',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      statModifiers: [{ stat: randomStat, value: 10, isBase: true }],
      skipDefault: true,
      description: `${randomStat} set to 10`,
    };
  },
  'Set random stat to 10'
);

registerImmediateHandler(
  'leviathan_mark_distribution',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Marked 6 random players with Leviathan Mark',
    };
  },
  'Distribute Leviathan Marks'
);

registerImmediateHandler(
  'behemoth_lose_penalty',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      statModifiers: [{ stat: randomStat, value: -10, isBase: true }], // Set to 0
      skipDefault: true,
      description: `Base ${randomStat} set to 0`,
    };
  },
  'Set random base stat to 0'
);

registerImmediateHandler(
  'behemoth_win_bonus',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      statModifiers: [{ stat: randomStat, value: 2, isBase: true }],
      skipDefault: true,
      description: `Base ${randomStat} +2`,
    };
  },
  '+2 base random stat'
);

registerImmediateHandler(
  'belphegor_lazy_rounds',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat mechanic
    return {
      skipDefault: true,
      description: '66% no point on first 2 round wins',
    };
  },
  'Lazy rounds mechanic'
);

// ============================================================================
// GOD HANDLERS
// ============================================================================

registerImmediateHandler(
  'baldur_first_god_death',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: '+2 all stats on first God death / Grant Powers if first',
    };
  },
  'First God death effects'
);

registerImmediateHandler(
  'eir_double_dura_stack',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Get current stack count from character (stored in custom data)
    const charData = ctx.character as any;
    const currentStack = charData.eirStack || 1;
    const newStack = currentStack * 2;

    return {
      statModifiers: [{ stat: 'durability', value: currentStack }], // Add the difference
      skipDefault: true,
      description: `Durability bonus doubled to ${newStack}`,
    };
  },
  'Double Durability stack'
);

registerImmediateHandler(
  'thor_mjolnir_grant',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Granted Mjolnir (usable)',
    };
  },
  'Grant Mjolnir'
);

// ============================================================================
// WEREBEAST HANDLERS
// ============================================================================

registerImmediateHandler(
  'werewolf_team_strength',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a PvE team buff
    return {
      skipDefault: true,
      description: '+2 Strength per team member (PvE)',
    };
  },
  '+2 Strength per team member'
);

registerImmediateHandler(
  'wereboar_chance_point_on_lose',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: '20% to gain point on round loss (PvE)',
    };
  },
  '20% point on round loss'
);

registerImmediateHandler(
  'werebat_reverse_reward',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Reversed reward/penalty (PvE)',
    };
  },
  'Reverse reward/penalty'
);

registerImmediateHandler(
  'werecapybara_double_biq_round',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'BIQ round plays twice (PvE)',
    };
  },
  'Double BIQ round'
);

registerImmediateHandler(
  'weresheep_permanent_dura',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'durability', value: 3, isBase: true }],
      skipDefault: true,
      description: '+3 Durability permanent on team win',
    };
  },
  '+3 permanent Durability'
);

registerImmediateHandler(
  'wereseal_one_point_win',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Team wins with 1 point scored',
    };
  },
  'Win with 1 point'
);

// ============================================================================
// REINCARNATOR
// ============================================================================

registerImmediateHandler(
  'reincarnator_transform',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Transform into a Season 2.5 player',
    };
  },
  'Transform into past player'
);

// ============================================================================
// GOD'S GIFTS (Demi-God)
// ============================================================================

registerImmediateHandler(
  'creation_creators_favor',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Granted Creator's Favor",
    };
  },
  "Grant Creator's Favor"
);

export function registerRaceHandlers(): void {
  console.log('Race handlers registered');
}
