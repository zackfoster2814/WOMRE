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

// ============================================================================
// DRYAD - On death: all same-race get +2 random stat; last Dryad evolves to Yggdrasil
// ============================================================================

registerCombatHandler(
  'dryad_death_buff',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: 'Dryad: Khi chết → tất cả Dryad còn lại +2 stat ngẫu nhiên (xử lý ngoài game)',
    };
  },
  'On Dryad death: all same-race Dryads get +2 random stat'
);

registerCombatHandler(
  'dryad_last_standing',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: 'Dryad: Nếu là Dryad cuối cùng khi chết → tiến hóa thành Yggdrasil (xử lý ngoài game)',
    };
  },
  'Last Dryad evolves to Yggdrasil on death'
);

// ============================================================================
// WEREBAT SUB-RACE - PvE only: reverse team rewards
// ============================================================================

registerCombatHandler(
  'werebat_reverse_reward',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.isPvE) return { skipDefault: true };
    return {
      skipDefault: true,
      description: 'Werebat: [PvE] Đội thua → bạn nhận thưởng; Đội thắng → bạn không nhận thưởng (xử lý ngoài game)',
    };
  },
  'PvE only: team lose = you get reward; team win = you get no reward (Werebat)'
);

// ============================================================================
// SPIRIT RACE - On each round lose: +1 Soul stack; at 6/9/13/20 stacks: bonus
// ============================================================================

registerCombatHandler(
  'spirit_souls_stack',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const roundsLost = ctx.self.roundsLost;
    if (roundsLost === 0) {
      return { skipDefault: true, description: 'Spirit: Chưa thua round nào, 0 Soul stacks' };
    }

    // Each round lose = +1 Soul stack. Thresholds: 6, 9, 13, 20
    const souls = roundsLost; // 1 soul per round lost
    const bonuses: string[] = [];

    if (souls >= 20) {
      bonuses.push('Gấp đôi stats');
    } else if (souls >= 13) {
      bonuses.push('+1 all stats');
    } else if (souls >= 9) {
      bonuses.push('+1 Power');
    } else if (souls >= 6) {
      bonuses.push('+2 BIQ');
    }

    if (bonuses.length === 0) {
      return {
        skipDefault: true,
        description: `Spirit Souls: ${souls} stack (cần 6 để kích hoạt)`,
      };
    }

    const bonus = bonuses[0];
    if (souls >= 20) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: ctx.self.stats[stat] })),
        description: `Spirit Souls: ${souls} stack → ${bonus} (xử lý ngoài game)`,
      };
    } else if (souls >= 13) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
        description: `Spirit Souls: ${souls} stack → ${bonus}`,
      };
    } else if (souls >= 9) {
      return {
        skipDefault: true,
        description: `Spirit Souls: ${souls} stack → ${bonus} (xử lý ngoài game)`,
      };
    } else {
      // souls >= 6
      return {
        selfStatMods: [{ stat: 'biq', value: 2 }],
        description: `Spirit Souls: ${souls} stack → ${bonus}`,
      };
    }
  },
  'On round lose: +1 Soul stack; at 6→+2 BIQ, 9→+1 Power, 13→+1 all, 20→double stats (Spirit)'
);

// ============================================================================
// WERESEAL - PvE only: team wins if they score 1 point despite -100 all stats
// ============================================================================

registerCombatHandler(
  'wereseal_one_point_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.isPvE) return { skipDefault: true };
    return {
      skipDefault: true,
      description: 'Wereseal: [PvE] Đội -100 all stats; thắng nếu ghi được 1 điểm (xử lý ngoài game)',
    };
  },
  'PvE only: team wins by scoring 1 point (despite -100 all stats penalty) (Wereseal)'
);

// ============================================================================
// WERESHEEP - After combat win (PvE): +3 Dura becomes permanent base stat
// ============================================================================

registerCombatHandler(
  'weresheep_permanent_dura',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: 'Weresheep: [PvE] Đội thắng → +3 Dura được cộng vĩnh viễn vào base stat (xử lý ngoài game)',
    };
  },
  'PvE win: +3 Durability becomes permanent base stat (Weresheep)'
);

// ============================================================================
// BALDUR SUB-RACE - On death: first God eliminated = +2 all; if you're first God = all Gods get 1 Power
// ============================================================================

registerCombatHandler(
  'baldur_first_god_death',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: 'Baldur: Khi chết — Lần đầu God bị loại: +2 all stats. Nếu là God đầu tiên bị loại: tất cả God nhận 1 Power (xử lý ngoài game)',
    };
  },
  'On death: first God eliminated gets +2 all; if first God to die = all Gods get 1 Power (Baldur)'
);

// ============================================================================
// EIR SUB-RACE - After each combat: double accumulated Dura bonus (stackable)
// ============================================================================

registerCombatHandler(
  'eir_double_dura_stack',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: 'Eir: Sau combat → gấp đôi tổng bonus Dura đã tích lũy (stackable, xử lý ngoài game)',
    };
  },
  'After each combat: double accumulated Durability bonus (stackable) (Eir)'
);

export function registerRaceCombatHandlers(): void {
  console.log('Race combat handlers registered');
}
