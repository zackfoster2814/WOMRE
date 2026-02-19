/**
 * Archetype Combat Handlers
 *
 * Combat handlers cho tất cả Archetype effects.
 */

import { registerCombatHandler } from '../registry';
import type { CombatHandlerContext, CombatHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// CORE ARCHETYPES
// ============================================================================

/**
 * Perfectionist - +4 stat thấp nhất nếu thắng với cách biệt ≥4 điểm
 */
registerCombatHandler(
  'perfectionist_dominate_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const margin = ctx.self.roundsWon - ctx.self.roundsLost;
    if (margin < 4) {
      return { skipDefault: true, description: 'Perfectionist: chưa đủ cách biệt 4 điểm' };
    }

    // Find lowest stat
    let lowestStat: StatName = 'strength';
    let lowestVal = ctx.self.stats.strength;
    for (const stat of STAT_NAMES) {
      if (ctx.self.stats[stat] < lowestVal) {
        lowestVal = ctx.self.stats[stat];
        lowestStat = stat;
      }
    }

    return {
      selfStatMods: [{ stat: lowestStat, value: 4 }],
      description: `+4 ${lowestStat} (Perfectionist - thắng cách biệt ${margin} điểm)`,
    };
  },
  '+4 lowest stat if won by ≥4 margin'
);

/**
 * Bravest of the Brave - Thắng PvP nhận 2 PvP Rewards thay vì 1
 */
registerCombatHandler(
  'bravest_double_pvp_reward',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Nhận 2 PvP Rewards thay vì 1 (Bravest of the Brave)',
    };
  },
  'Double PvP rewards on win'
);

/**
 * Invoker - Quay 1 Power ngẫu nhiên trước combat
 */
registerCombatHandler(
  'invoker_random_power',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Quay 1 Power chưa sở hữu cho combat này (Invoker)',
    };
  },
  'Random power before combat'
);

/**
 * Summoner - Nhận 1 lần Summon Wheel sau thắng
 */
registerCombatHandler(
  'summoner_unique_summon',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Nhận 1 lần vòng quay Summon (Summoner)',
    };
  },
  'Grant Summon Wheel on win'
);

/**
 * Sentinel of Purity - Khi bị AIDS → nhận Isekai
 */
registerCombatHandler(
  'sentinel_of_purity_isekai',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Nhận Char Dev "Isekai" khi bị AIDS lần đầu (Sentinel of Purity)',
    };
  },
  'Grant Isekai char dev on AIDS'
);

/**
 * Infirmarian - Sau combat loại bỏ AIDS khỏi cả 2
 */
registerCombatHandler(
  'infirmarian_cure_aids',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      removePower: 'AIDS',
      description: 'Loại bỏ AIDS khỏi cả 2 người chơi (Infirmarian)',
    };
  },
  'Remove AIDS from both players after combat'
);

/**
 * Loyal - Khi Lover bị loại → +1 Char Dev
 */
registerCombatHandler(
  'loyal_lover_death_char_dev',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Nhận +1 Char Dev khi Lover bị loại (Loyal)',
    };
  },
  'Grant Char Dev when Lover eliminated'
);

/**
 * Fisher - Đến vòng 16: +1 PvP Rewards
 */
registerCombatHandler(
  'fisher_round_16_reward',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Nhận +1 PvP Rewards khi đến vòng 16 (Fisher)',
    };
  },
  '+1 PvP Rewards at Round 16'
);

/**
 * Merchants - Sau combat bán 1 Gear lấy 1 Đồng Tiền Vàng
 */
registerCombatHandler(
  'merchants_sell_gear',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Bán 1 Gear lấy 1 "Đồng Tiền Vàng" (Merchants)',
    };
  },
  'Sell 1 Gear for 1 Gold Coin after combat'
);

/**
 * X - Thua → chuyển cho người thắng
 */
registerCombatHandler(
  'x_transfer_to_winner',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Archetype X chuyển cho người thắng (X)',
    };
  },
  'Transfer X archetype to winner on loss'
);

// ============================================================================
// MHA POWERS
// ============================================================================

/**
 * Dark Shadow - +2 all stats vào trận lẻ (1, 3, 5, 7, 9,...)
 */
registerCombatHandler(
  'mha_dark_shadow',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.isPvE) return { skipDefault: true };

    // Trận lẻ: pvpWins 0 → trận 1 (lẻ), pvpWins 1 → trận 2 (chẵn), etc.
    const combatNumber = ctx.self.pvpWins + 1;
    if (combatNumber % 2 === 1) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 2 })),
        description: `+2 All Stats (Dark Shadow - trận ${combatNumber}, lẻ)`,
      };
    }

    return { skipDefault: true, description: `Dark Shadow: trận ${combatNumber} (chẵn, không kích hoạt)` };
  },
  '+2 all stats on odd-numbered combats'
);

/**
 * Half-Cold Half-Hot - 50% -1 all stats đối thủ, 50% +1 all stats bạn (riêng biệt)
 */
registerCombatHandler(
  'mha_half_cold_half_hot',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const coldActivates = Math.random() < 0.5;
    const hotActivates = Math.random() < 0.5;
    const result: CombatHandlerResult = {};
    const descs: string[] = [];

    if (coldActivates) {
      result.opponentStatMods = STAT_NAMES.map(stat => ({ stat, value: -1 }));
      descs.push('-1 All Stats đối thủ (Cold)');
    }
    if (hotActivates) {
      result.selfStatMods = STAT_NAMES.map(stat => ({ stat, value: 1 }));
      descs.push('+1 All Stats bạn (Hot)');
    }

    if (descs.length === 0) {
      return { skipDefault: true, description: 'Half-Cold Half-Hot: không kích hoạt' };
    }

    result.description = descs.join(', ');
    return result;
  },
  '50% -1 all opponent, 50% +1 all self (separate rolls)'
);

/**
 * Float - Thắng round Speed → +1 điểm, sau combat thắng → +1 Speed
 */
registerCombatHandler(
  'mha_float',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    if (ctx.roundResults?.speed === 'win') {
      return {
        selfPoints: 1,
        description: '+1 điểm cuối combat (Float - thắng round Speed)',
      };
    }

    return { skipDefault: true };
  },
  '+1 point if won speed round, +1 Speed on combat win'
);

/**
 * Rewind - Đưa đối thủ về trạng thái vòng trước
 */
registerCombatHandler(
  'mha_rewind',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Đưa đối thủ về trạng thái vòng trước - loại bỏ PvP Rewards (Rewind)',
    };
  },
  'Rewind opponent to previous state'
);

/**
 * Overhaul - Thắng Speed và MA → thắng ngay
 */
registerCombatHandler(
  'mha_overhaul',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const wonSpeed = ctx.roundResults?.speed === 'win';
    const wonMA = ctx.roundResults?.ma === 'win';

    if (wonSpeed && wonMA) {
      return {
        autoWin: true,
        description: 'Auto win - thắng cả Speed và MA (Overhaul)',
      };
    }

    // Mỗi lần không kích hoạt → +1 Speed, +1 MA
    return {
      selfStatMods: [
        { stat: 'speed', value: 1 },
        { stat: 'ma', value: 1 },
      ],
      description: '+1 Speed, +1 MA (Overhaul - chưa kích hoạt instant win)',
    };
  },
  'Auto win if won Speed+MA, else +1 Speed +1 MA'
);

/**
 * One For All - Chung kết: gấp đôi bonus (+3 thêm Str/Spd/Dur)
 */
registerCombatHandler(
  'mha_one_for_all_finals',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.isFinals) {
      return { skipDefault: true };
    }

    return {
      selfStatMods: [
        { stat: 'strength', value: 3 },
        { stat: 'speed', value: 3 },
        { stat: 'durability', value: 3 },
      ],
      description: '+3 Str, +3 Spd, +3 Dur thêm (One For All - Chung kết)',
    };
  },
  'Double bonus in finals'
);

/**
 * All For One - Nhận 1 hiệu ứng MHA ngẫu nhiên trong combat
 */
registerCombatHandler(
  'mha_all_for_one',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    // Random MHA effect simulation - pick a random stat bonus
    const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    const value = Math.floor(Math.random() * 4) + 2; // 2-5

    return {
      selfStatMods: [{ stat: randomStat, value }],
      description: `+${value} ${randomStat} (All For One - hiệu ứng MHA ngẫu nhiên)`,
    };
  },
  'Random MHA effect during combat'
);

// ============================================================================
// DOMAIN EXPANSION
// ============================================================================

/**
 * Malevolent Shrine - +1 điểm khi thắng round Str/MA
 */
registerCombatHandler(
  'domain_malevolent_shrine',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    let bonusPoints = 0;
    if (ctx.roundResults?.strength === 'win') bonusPoints++;
    if (ctx.roundResults?.ma === 'win') bonusPoints++;

    if (bonusPoints === 0) return { skipDefault: true };

    return {
      selfPoints: bonusPoints,
      description: `+${bonusPoints} điểm thêm (Malevolent Shrine - thắng round Str/MA)`,
    };
  },
  '+1 point per Str/MA round won'
);

/**
 * Idle Death Gamble - 8% +100 all, 22% +1 all, 70% nothing
 */
registerCombatHandler(
  'domain_idle_death_gamble',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    const roll = Math.random();

    if (roll < 0.08) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 100 })),
        description: '+100 All Stats! (Idle Death Gamble - 8% jackpot)',
      };
    } else if (roll < 0.30) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
        description: '+1 All Stats (Idle Death Gamble - 22%)',
      };
    }

    return {
      skipDefault: true,
      description: 'Idle Death Gamble: không gì xảy ra (70%)',
    };
  },
  '8% +100 all, 22% +1 all, 70% nothing'
);

/**
 * Self-Embodiment of Perfection - Thắng 3 round → thắng ngay
 */
registerCombatHandler(
  'domain_self_embodiment',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.self.roundsWon >= 3) {
      return {
        autoWin: true,
        description: 'Auto win - thắng 3 round (Self-Embodiment of Perfection)',
      };
    }

    return { skipDefault: true };
  },
  'Auto win if won 3 rounds'
);

// ============================================================================
// BANKAI
// ============================================================================

/**
 * Gangaku Kairo - Khi thua nhiều round hơn thắng → +2 điểm
 */
registerCombatHandler(
  'bankai_gangaku_kairo',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.self.roundsLost > ctx.self.roundsWon) {
      return {
        selfPoints: 2,
        description: '+2 điểm (Gangaku Kairo - thua nhiều round hơn thắng)',
      };
    }

    return { skipDefault: true };
  },
  '+2 points if lost more rounds than won'
);

// ============================================================================
// SUPERHERO
// ============================================================================

/**
 * Batman - Trước combat nhận 4 Gear tạm thời
 */
registerCombatHandler(
  'batman_temp_gear',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Nhận 4 Gear ngẫu nhiên tạm thời cho combat này (Batman)',
    };
  },
  '4 temp gears before combat'
);

/**
 * Superman Kryptonite - Đối thủ có Kryptonite → bị 2 điểm khởi đầu
 */
registerCombatHandler(
  'superman_kryptonite',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const hasKryptonite = ctx.opponent.gears.some(
      g => typeof g === 'string'
        ? g.toLowerCase().includes('kryptonite')
        : (g as any).name?.toLowerCase().includes('kryptonite')
    );

    if (hasKryptonite) {
      return {
        opponentPoints: 2,
        description: 'Đối thủ có Kryptonite: nhận 2 điểm khởi đầu (Superman yếu)',
      };
    }

    return { skipDefault: true };
  },
  'Opponent with Kryptonite gets 2 starting points'
);

/**
 * Spiderman Comeback - Đối thủ thắng 3 round → +2 all stats remaining
 */
registerCombatHandler(
  'spiderman_comeback',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    // Check if opponent has won 3 rounds (from self's perspective, that's roundsLost)
    if (ctx.self.roundsLost >= 3) {
      const remainingRounds = ctx.totalRounds - ctx.currentRound;
      const statBoost = remainingRounds > 0 ? Math.ceil(6 / remainingRounds) : 6;

      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: statBoost })),
        selfPoints: 1,
        description: `+${statBoost} All Stats, +1 điểm (Spiderman comeback - đối thủ thắng 3 round)`,
      };
    }

    return { skipDefault: true };
  },
  'Comeback bonus when opponent wins 3 rounds'
);

/**
 * Hulk - Combat lẻ: +3 IQ, combat chẵn: +3 Str +3 Dur
 */
registerCombatHandler(
  'hulk_combat_parity',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const combatNumber = ctx.self.pvpWins + 1;
    const isOdd = combatNumber % 2 === 1;

    if (isOdd) {
      return {
        selfStatMods: [{ stat: 'iq', value: 3 }],
        description: `+3 IQ (Hulk - combat ${combatNumber}, lẻ = Bruce Banner)`,
      };
    } else {
      return {
        selfStatMods: [
          { stat: 'strength', value: 3 },
          { stat: 'durability', value: 3 },
        ],
        description: `+3 Str, +3 Dur (Hulk - combat ${combatNumber}, chẵn = Hulk Smash)`,
      };
    }
  },
  'Odd combat: +3 IQ, even: +3 Str/Dur'
);

// ============================================================================
// HERO X
// ============================================================================

/**
 * Ahu - Auto win vs người có Summon "Chihuahua"
 */
registerCombatHandler(
  'ahu_vs_chihuahua',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const hasChihuahua = ctx.opponent.powers.some(
      (p: any) => {
        const name = typeof p === 'string' ? p : p.name;
        return name?.toLowerCase().includes('chihuahua');
      }
    );

    if (hasChihuahua) {
      return {
        autoWin: true,
        description: 'Auto win - đối thủ có Chihuahua (Ahu biết cắn)',
      };
    }

    return { skipDefault: true };
  },
  'Auto win vs Chihuahua summon'
);

/**
 * The Johnnies - Vs có Summon: +2 điểm
 */
registerCombatHandler(
  'the_johnnies_summon_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    // Check if opponent has any summon-type powers/gears
    const hasSummon = ctx.opponent.powers.some(
      (p: any) => {
        const name = typeof p === 'string' ? p : p.name;
        return name?.toLowerCase().includes('summon');
      }
    ) || ctx.opponent.gears.some(
      (g: any) => {
        const name = typeof g === 'string' ? g : g.name;
        return name?.toLowerCase().includes('summon');
      }
    );

    if (hasSummon) {
      return {
        selfPoints: 2,
        description: '+2 điểm vs đối thủ có Summon (The Johnnies)',
      };
    }

    return { skipDefault: true };
  },
  '+2 points vs opponent with Summon'
);

/**
 * Ghostblade - Crit thành công nhận 2 điểm thay vì 1
 */
registerCombatHandler(
  'ghostblade_double_crit',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Crit thành công nhận 2 điểm thay vì 1 (Ghostblade)',
    };
  },
  'Double crit points'
);

/**
 * Dragon Boy - Nếu thua 3 round đầu → thắng luôn
 */
registerCombatHandler(
  'dragon_boy_comeback',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Check if lost first 3 rounds (roundsLost >= 3 and roundsWon === 0)
    if (ctx.self.roundsLost >= 3 && ctx.self.roundsWon === 0) {
      return {
        autoWin: true,
        description: 'Auto win - thua 3 round đầu (Dragon Boy comeback)',
      };
    }

    return { skipDefault: true };
  },
  'Auto win if lost first 3 rounds'
);

/**
 * Queen - Vô hiệu hóa toàn bộ Power "Buff" của đối thủ
 */
registerCombatHandler(
  'queen_disable_buffs',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Vô hiệu hóa toàn bộ Power Buff của đối thủ (Queen)',
    };
  },
  'Disable opponent buff powers'
);

// ============================================================================
// POWER RANGERS
// ============================================================================

/**
 * Red Ranger - Thắng round Str → 20% nhận thêm 2 điểm
 */
registerCombatHandler(
  'power_ranger_red_str_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.strength !== 'win') return { skipDefault: true };

    if (Math.random() < 0.20) {
      return {
        selfPoints: 2,
        description: '+2 điểm thêm (Red Ranger - 20% khi thắng Str)',
      };
    }

    return { skipDefault: true, description: 'Red Ranger: 20% không kích hoạt' };
  },
  '20% +2 points on Str round win'
);

/**
 * Blue Ranger - Thắng round Speed → 33% nhận +3 Base Speed
 */
registerCombatHandler(
  'power_ranger_blue_spd_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.speed !== 'win') return { skipDefault: true };

    if (Math.random() < 0.33) {
      return {
        selfStatMods: [{ stat: 'speed', value: 3 }],
        description: '+3 Base Speed (Blue Ranger - 33% khi thắng Speed)',
      };
    }

    return { skipDefault: true, description: 'Blue Ranger: 33% không kích hoạt' };
  },
  '33% +3 Base Speed on Speed round win'
);

/**
 * Black Ranger - Thắng round Dur → 20% nhận 1 Power ngẫu nhiên
 */
registerCombatHandler(
  'power_ranger_black_power',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.durability !== 'win') return { skipDefault: true };

    if (Math.random() < 0.20) {
      return {
        grantPower: 'random',
        description: 'Nhận 1 Power ngẫu nhiên (Black Ranger - 20% khi thắng Dur)',
      };
    }

    return { skipDefault: true, description: 'Black Ranger: 20% không kích hoạt' };
  },
  '20% grant Power on Dur round win'
);

/**
 * Yellow Ranger - Thắng round IQ → 25% nhận 1 Gear
 */
registerCombatHandler(
  'power_ranger_yellow_gear',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.iq !== 'win') return { skipDefault: true };

    if (Math.random() < 0.25) {
      return {
        grantGear: 'random',
        description: 'Nhận 1 Gear (Yellow Ranger - 25% khi thắng IQ)',
      };
    }

    return { skipDefault: true, description: 'Yellow Ranger: 25% không kích hoạt' };
  },
  '25% grant Gear on IQ round win'
);

/**
 * Pink Ranger - Thắng round BIQ/MA → 25% nhận +1 Base stat ngẫu nhiên
 */
registerCombatHandler(
  'power_ranger_pink_base_stat',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const wonBIQ = ctx.roundResults?.biq === 'win';
    const wonMA = ctx.roundResults?.ma === 'win';

    if (!wonBIQ && !wonMA) return { skipDefault: true };

    if (Math.random() < 0.25) {
      const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
      return {
        selfStatMods: [{ stat: randomStat, value: 1 }],
        description: `+1 Base ${randomStat} (Pink Ranger - 25% khi thắng BIQ/MA)`,
      };
    }

    return { skipDefault: true, description: 'Pink Ranger: 25% không kích hoạt' };
  },
  '25% +1 Base random stat on BIQ/MA round win'
);

/**
 * Silver Ranger - Thắng round → 15% gấp đôi stat round tiếp theo
 */
registerCombatHandler(
  'power_ranger_silver_double',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    if (Math.random() < 0.15) {
      // Pick a random stat to double for next round
      const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
      return {
        selfStatMods: [{ stat: randomStat, value: 5 }],
        description: `+5 ${randomStat} (Silver Ranger - 15% gấp đôi stat)`,
      };
    }

    return { skipDefault: true, description: 'Silver Ranger: 15% không kích hoạt' };
  },
  '15% double stat next round on round win'
);

// ============================================================================
// NEW LONDON ARCHETYPES
// ============================================================================

/**
 * Evolvers - Chuyển Debuff đối thủ thành Buff cho mình
 */
registerCombatHandler(
  'evolvers_convert_debuff',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    return {
      description: 'Chuyển Debuff đối thủ dành cho mình thành Buff (Evolvers)',
    };
  },
  'Convert opponent debuffs to self buffs'
);

/**
 * Pilgrims - Chuyển Debuff bản thân thành Buff
 */
registerCombatHandler(
  'pilgrims_convert_self_debuff',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Chuyển Debuff bản thân thành Buff (Pilgrims)',
    };
  },
  'Convert self debuffs to buffs'
);

/**
 * Icebloods - +1 điểm khi thắng round, -1 khi thua round
 */
registerCombatHandler(
  'icebloods_round_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const netPoints = ctx.self.roundsWon - ctx.self.roundsLost;
    if (netPoints === 0) return { skipDefault: true };

    return {
      selfPoints: netPoints,
      description: `${netPoints > 0 ? '+' : ''}${netPoints} điểm (Icebloods - ${ctx.self.roundsWon}W/${ctx.self.roundsLost}L)`,
    };
  },
  '+1 per round won, -1 per round lost'
);

/**
 * Legionnaires - Nếu thắng trận trước → +1 điểm khởi đầu
 */
registerCombatHandler(
  'legionnaires_after_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.self.pvpWins > 0) {
      return {
        selfPoints: 1,
        description: '+1 điểm khởi đầu (Legionnaires - đã thắng trận trước)',
      };
    }

    return { skipDefault: true, description: 'Legionnaires: chưa thắng trận trước' };
  },
  '+1 starting point if won previous match'
);

/**
 * Menders - Sau combat: +2 stat thấp nhất đối thủ, +1 stat cao nhất đối thủ cho mình
 */
registerCombatHandler(
  'menders_stat_gain',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    // Find opponent's lowest and highest stat
    let lowestStat: StatName = 'strength';
    let highestStat: StatName = 'strength';
    let lowestVal = ctx.opponent.stats.strength;
    let highestVal = ctx.opponent.stats.strength;

    for (const stat of STAT_NAMES) {
      if (ctx.opponent.stats[stat] < lowestVal) {
        lowestVal = ctx.opponent.stats[stat];
        lowestStat = stat;
      }
      if (ctx.opponent.stats[stat] > highestVal) {
        highestVal = ctx.opponent.stats[stat];
        highestStat = stat;
      }
    }

    return {
      selfStatMods: [
        { stat: lowestStat, value: 2 },
        { stat: highestStat, value: 1 },
      ],
      description: `+2 ${lowestStat} (thấp nhất đối thủ), +1 ${highestStat} (cao nhất đối thủ) (Menders)`,
    };
  },
  '+2 opponent lowest stat, +1 opponent highest stat for self'
);

/**
 * Overseers - Cả hai chỉ 1 Power "Trong Combat", đối thủ -1 all stats
 */
registerCombatHandler(
  'overseers_limit_powers',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Cả hai chỉ chọn 1 Power "Trong Combat" (Overseers)',
    };
  },
  'Limit both to 1 combat Power'
);

/**
 * Venturers - Trọng số cao hơn → +4, thấp hơn → +8
 */
registerCombatHandler(
  'venturers_weight_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    // Compare total stats as proxy for "weight"
    const selfTotal = STAT_NAMES.reduce((sum, s) => sum + ctx.self.stats[s], 0);
    const oppTotal = STAT_NAMES.reduce((sum, s) => sum + ctx.opponent!.stats[s], 0);

    if (selfTotal > oppTotal) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: Math.floor(4 / STAT_NAMES.length) || 1 })),
        description: '+4 tổng stats (Venturers - trọng số cao hơn)',
      };
    } else {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: Math.floor(8 / STAT_NAMES.length) || 1 })),
        description: '+8 tổng stats (Venturers - trọng số thấp hơn)',
      };
    }
  },
  '+4 if higher weight, +8 if lower weight'
);

// ============================================================================
// HERO X continued
// ============================================================================

/**
 * Hero X auto win - Mặc định thắng đến chung kết tổng 6-0
 * (Already exists in combat-handlers.ts as hero_x_auto_win but overridden here for X sub-type)
 */

export function registerArchetypeCombatHandlers(): void {
  // All handlers are registered via registerCombatHandler calls above
  console.log('Archetype combat handlers registered');
}
