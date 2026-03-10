/**
 * Combat Handlers
 *
 * Handlers xử lý các effect trong combat.
 */

import { registerCombatHandler } from '../registry';
import type { CombatHandlerContext, CombatHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// AUTO WIN/LOSE HANDLERS
// ============================================================================

/**
 * Egoist Win Condition - Nếu không thắng với cách biệt ≥4 điểm → thua combat
 * after_combat: kiểm tra margin, nếu < 4 thì autoLose
 */
registerCombatHandler(
  'egoist_win_condition',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const margin = ctx.self.roundsWon - ctx.self.roundsLost;
    if (margin >= 4) {
      return { skipDefault: true, description: `Egoist: thắng cách biệt ${margin} điểm, OK` };
    }
    return {
      autoLose: true,
      description: `Egoist: cách biệt chỉ ${margin} điểm (cần ≥4) → thua combat`,
    };
  },
  'Auto lose if did not win by ≥4 margin (Egoist condition)'
);

/**
 * Momentum - Auto win if won last 3 rounds
 */
registerCombatHandler(
  'momentum_auto_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.self.roundsWon >= 3) {
      return {
        autoWin: true,
        description: 'Auto win - đã thắng 3 rounds liên tiếp',
      };
    }
    return { skipDefault: true };
  },
  'Auto win if won 3 consecutive rounds'
);

/**
 * Apotheosis - Auto win in PvE
 */
registerCombatHandler(
  'apotheosis_auto_win_pve',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.isPvE) {
      return {
        autoWin: true,
        description: 'Auto win trong PvE',
      };
    }
    return { skipDefault: true };
  },
  'Auto win in PvE'
);

/**
 * Devotee - Auto lose vs God race
 */
registerCombatHandler(
  'devotee_auto_lose_vs_god',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const godRaces = ['god', 'demi-god', 'demi god', 'demigod'];
    if (godRaces.includes(ctx.opponent.race.toLowerCase())) {
      return {
        autoLose: true,
        description: 'Auto lose - đối thủ là God/Titan/Primordial',
      };
    }

    return { skipDefault: true };
  },
  'Auto lose vs God race'
);

/**
 * Hero X - Auto win vs specific conditions
 */
registerCombatHandler(
  'hero_x_auto_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    // Auto win if opponent has lower total stats
    const selfTotal = STAT_NAMES.reduce((sum, s) => sum + ctx.self.stats[s], 0);
    const oppTotal = STAT_NAMES.reduce((sum, s) => sum + ctx.opponent!.stats[s], 0);

    if (selfTotal > oppTotal * 1.5) {
      return {
        autoWin: true,
        description: 'Auto win - total stats > 1.5x đối thủ',
      };
    }

    return { skipDefault: true };
  },
  'Auto win if total stats > 1.5x opponent'
);

// ============================================================================
// STAT COMPARISON HANDLERS
// ============================================================================

/**
 * Conquerer Speed Win - Thắng round Speed: +1 all stats trong phần còn lại của combat
 */
registerCombatHandler(
  'conquerer_speed_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Chỉ apply từ round IQ trở đi (sau khi SPD đã kết thúc)
    // Không apply tại round SPD vì stat đó đã được so sánh rồi
    if ((ctx as any).currentRoundStat === 'spd') return { skipDefault: true };
    const speedResult = ctx.roundResults?.['spd'] ?? ctx.roundResults?.speed;
    if (speedResult !== 'win') return { skipDefault: true };

    return {
      selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
      description: '+1 All Stats (Conquerer - thắng round Speed)',
    };
  },
  'On winning Speed round: +1 all stats for rest of combat'
);

/**
 * Angling and Scheming - Thắng round STR → +1 IQ, +1 BIQ, +2 MA
 */
registerCombatHandler(
  'angling_scheming_str_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.currentRoundStat !== 'str') return { skipDefault: true };
    if (ctx.currentRoundResult !== 'win') return { skipDefault: true };

    return {
      selfStatMods: [
        { stat: 'iq', value: 1 },
        { stat: 'biq', value: 1 },
        { stat: 'ma', value: 2 },
      ],
      description: 'Angling and Scheming: Thắng round STR → +1 IQ, +1 BIQ, +2 MA',
    };
  },
  'Thắng round STR: +1 IQ, +1 BIQ, +2 MA'
);

/**
 * Accelerating Sorcery - +1 IQ mỗi khi power during_combat khác kích hoạt
 */
registerCombatHandler(
  'accelerating_sorcery_count',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const count = ctx.self.duringCombatActivations ?? 0;
    if (count === 0) return { skipDefault: true };
    return {
      selfStatMods: [{ stat: 'iq', value: count }],
      description: `Accelerating Sorcery: ${count} Power "Trong combat" đã kích hoạt → +${count} IQ`,
    };
  },
  '+1 IQ per power during_combat activated this round (Accelerating Sorcery)'
);

/**
 * The World - Thắng round Speed → +4 BIQ, +3 MA
 */
registerCombatHandler(
  'the_world_speed_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.currentRoundStat !== 'spd') return { skipDefault: true };
    if (ctx.currentRoundResult !== 'win') return { skipDefault: true };

    return {
      selfStatMods: [
        { stat: 'biq', value: 4 },
        { stat: 'ma', value: 3 },
      ],
      description: 'The World: Thắng round SPD → +4 BIQ, +3 MA',
    };
  },
  'Thắng round SPD: +4 BIQ, +3 MA'
);

/**
 * Banana Peel IQ Compare
 */
registerCombatHandler(
  'banana_peel_iq_compare',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    if (ctx.self.stats.iq > ctx.opponent.stats.iq) {
      return {
        opponentStatMods: [{ stat: 'speed', value: -2 }],
        description: '-2 Speed cho đối thủ (IQ cao hơn)',
      };
    }

    return { skipDefault: true };
  },
  '-2 Speed to opponent if IQ higher'
);

/**
 * Mind Control - IQ check
 */
registerCombatHandler(
  'mind_control_iq_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    if (ctx.self.stats.iq > ctx.opponent.stats.iq) {
      return {
        opponentStatMods: [{ stat: 'biq', value: -3 }],
        description: '-3 BIQ cho đối thủ (Mind Control)',
      };
    }

    return { skipDefault: true };
  },
  '-3 BIQ to opponent if IQ higher'
);

// ============================================================================
// ROUND-BASED HANDLERS
// ============================================================================

/**
 * Bloody Strike - +1 per round won
 */
registerCombatHandler(
  'bloody_strike_per_round_won',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const bonus = ctx.self.roundsWon;
    if (bonus === 0) return { skipDefault: true };

    return {
      selfStatMods: [{ stat: 'strength', value: bonus }],
      description: `+${bonus} Strength từ ${bonus} round(s) thắng`,
    };
  },
  '+1 Strength per round won'
);

/**
 * Healing Factor - +1 per 2 rounds lost
 */
registerCombatHandler(
  'healing_factor_per_2_lost',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const bonus = Math.floor(ctx.self.roundsLost / 2);
    if (bonus === 0) return { skipDefault: true };

    return {
      selfStatMods: [{ stat: 'durability', value: bonus }],
      description: `+${bonus} Durability từ ${ctx.self.roundsLost} round(s) thua`,
    };
  },
  '+1 Durability per 2 rounds lost'
);

/**
 * Zealot - Sau combat: mỗi round thua, +1 vào chỉ số thấp nhất
 */
registerCombatHandler(
  'zealot_per_round_lost',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const bonus = ctx.self.roundsLost;
    if (bonus === 0) return { skipDefault: true };

    // Find the lowest stat
    let lowestStat: StatName = 'strength';
    let lowestVal = ctx.self.stats.strength;
    for (const stat of STAT_NAMES) {
      if (ctx.self.stats[stat] < lowestVal) {
        lowestVal = ctx.self.stats[stat];
        lowestStat = stat;
      }
    }

    return {
      selfStatMods: [{ stat: lowestStat, value: bonus }],
      description: `+${bonus} ${lowestStat} (chỉ số thấp nhất) từ ${bonus} round(s) thua (Zealot)`,
    };
  },
  'After combat: +1 to lowest stat per round lost'
);

/**
 * King Crimson - Round win boost
 */
registerCombatHandler(
  'king_crimson_round_win_boost',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.self.roundsWon === 0) return { skipDefault: true };

    return {
      selfPoints: ctx.self.roundsWon,
      description: `+${ctx.self.roundsWon} points từ King Crimson`,
    };
  },
  '+1 point per round won'
);

// ============================================================================
// FINALS/BRACKET HANDLERS
// ============================================================================

/**
 * Domain Infinity - Bonus in finals
 */
registerCombatHandler(
  'domain_infinity',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.isFinals) return { skipDefault: true };

    return {
      selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 3 })),
      description: '+3 All Stats trong Finals (Domain Infinity)',
    };
  },
  '+3 All Stats in Finals'
);

/**
 * Final Reserves - Round 16 bonus
 */
registerCombatHandler(
  'final_reserves_round_16',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    // This would need round info from context
    // For now, return empty
    return { skipDefault: true };
  },
  'Bonus at Round 16'
);

// ============================================================================
// RACE-SPECIFIC HANDLERS
// ============================================================================

/**
 * Slayer Race Check - Bonus vs the chosen slayer target race
 * The character's archetype name format: "Slayer - <Race>" or "Slayer - <Race> (Từ ...)"
 * e.g. "Slayer - Giant", "Slayer - Dwarf", "Slayer - Uma (Từ Become King Slayer)"
 */
registerCombatHandler(
  'slayer_race_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent || !ctx.self.character) return { skipDefault: true };

    // Find archetype entry starting with "Slayer"
    const archetypes: string[] = (ctx.self.character as any).archetypes || [];
    const slayerEntry = archetypes.find((a: string) => /^slayer\s*-/i.test(a.trim()));
    if (!slayerEntry) return { skipDefault: true };

    // Extract race: "Slayer - Giant" → "Giant", "Slayer - Uma (Từ ...)" → "Uma"
    const match = slayerEntry.match(/^slayer\s*-\s*([^\s(]+)/i);
    const targetRace = match ? match[1].toLowerCase() : '';

    const oppRace = ctx.opponent.race.toLowerCase();
    if (!targetRace || oppRace !== targetRace) return { skipDefault: true };

    return {
      selfStatMods: [
        { stat: 'strength', value: 2 },
        { stat: 'biq', value: 3 },
        { stat: 'ma', value: 2 },
      ],
      description: `Slayer: +2 STR, +3 BIQ, +2 MA vs ${ctx.opponent.race}`,
    };
  },
  'Bonus +2 STR +3 BIQ +2 MA vs chosen slayer target race'
);

/**
 * Garlic Breath - vs Vampire
 */
registerCombatHandler(
  'garlic_breath_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    if (ctx.opponent.race.toLowerCase() === 'vampire') {
      return {
        opponentStatMods: STAT_NAMES.map(stat => ({ stat, value: -2 })),
        description: '-2 All Stats cho Vampire đối thủ',
      };
    }

    return { skipDefault: true };
  },
  '-2 All Stats to Vampire opponent'
);

/**
 * Nichirin - Demon Slayer bonus
 */
registerCombatHandler(
  'nichirin_demon_slayer',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const demonRaces = ['demon', 'devil', 'fiend', 'oni'];
    if (demonRaces.includes(ctx.opponent.race.toLowerCase())) {
      return {
        selfStatMods: [{ stat: 'strength', value: 5 }],
        autoWin: ctx.self.stats.strength > ctx.opponent.stats.durability,
        description: '+5 Strength vs Demon (Nichirin)',
      };
    }

    return { skipDefault: true };
  },
  '+5 Strength vs Demon'
);

// ============================================================================
// 50/50 HANDLERS
// ============================================================================

/**
 * Cursed Coin - 50/50
 */
registerCombatHandler(
  'cursed_coin_50_50',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    const isHeads = Math.random() > 0.5;

    if (isHeads) {
      return {
        selfPoints: 3,
        description: '+3 points (Cursed Coin - Heads)',
      };
    } else {
      return {
        selfPoints: -3,
        description: '-3 points (Cursed Coin - Tails)',
      };
    }
  },
  '50/50 chance for +3 or -3 points'
);

/**
 * Fates Trick - 50/50
 */
registerCombatHandler(
  'fates_trick_50_50',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    const isLucky = Math.random() > 0.5;

    if (isLucky) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 2 })),
        description: '+2 All Stats (Fates Trick - Lucky)',
      };
    } else {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: -2 })),
        description: '-2 All Stats (Fates Trick - Unlucky)',
      };
    }
  },
  '50/50 for +2 or -2 All Stats'
);

/**
 * Gambler Coin Flip - on_round_win
 * 50% nhận 2 điểm cho round đó (thêm +1 nữa), 50% nhận 0 điểm (cancel điểm vừa thắng)
 */
registerCombatHandler(
  'gambler_coin_flip',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    const isHeads = Math.random() > 0.5;

    if (isHeads) {
      return {
        selfPoints: 1,
        description: '+1 điểm thêm → tổng 2 điểm round này (Gambler - May mắn 50%)',
      };
    } else {
      return {
        selfPoints: -1,
        description: '-1 điểm → tổng 0 điểm round này (Gambler - Xui 50%)',
      };
    }
  },
  'on_round_win: 50% +2pts total, 50% 0pts total for that round'
);

// ============================================================================
// POINT MANIPULATION HANDLERS
// ============================================================================

/**
 * Golden Coin - Starting points
 */
registerCombatHandler(
  'golden_coin_starting_point',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      selfPoints: 1,
      description: '+1 starting point (Golden Coin)',
    };
  },
  '+1 starting point'
);

/**
 * Edgelord Underdog Point - Trước khi kết thúc combat: bên nào ít điểm hơn nhận +1 điểm
 */
registerCombatHandler(
  'edgelord_underdog_point',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const selfScore = ctx.self.roundsWon;
    const oppScore = ctx.self.roundsLost; // opponent's rounds won

    if (selfScore < oppScore) {
      return {
        selfPoints: 1,
        description: '+1 điểm - đang thua điểm (Edgelord underdog)',
      };
    }

    return { skipDefault: true };
  },
  'Before combat ends: lower-scoring side gets +1 point'
);

/**
 * Ace of Spades - Swap points
 */
registerCombatHandler(
  'ace_of_spades_swap_points',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    // This would need access to current point totals
    // For now, return a fixed bonus
    return {
      selfPoints: 1,
      opponentPoints: -1,
      description: 'Steal 1 point từ đối thủ',
    };
  },
  'Swap points with opponent'
);

/**
 * Misericorde - Steal point
 */
registerCombatHandler(
  'misericorde_steal_point',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      selfPoints: 1,
      opponentPoints: -1,
      description: 'Steal 1 point từ đối thủ (Misericorde)',
    };
  },
  'Steal 1 point from opponent'
);

export function registerCombatHandlers(): void {
  // All handlers are registered via registerCombatHandler calls above
  console.log('Combat handlers registered');
}
