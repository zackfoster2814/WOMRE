/**
 * Quirk-based Immediate Handlers
 *
 * Handlers cho các Quirk effects.
 */

import { registerImmediateHandler } from '../registry';
import type { ImmediateHandlerContext, ImmediateHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// QUIRK HANDLERS
// ============================================================================

/**
 * Lucky - 5% max roll
 */
registerImmediateHandler(
  'lucky_max_roll',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a passive effect that modifies wheel spins
    // No immediate stat effect
    return {
      skipDefault: true,
      description: '5% max roll (passive)',
    };
  },
  '5% chance for max roll on wheels'
);

/**
 * Independent - No house, +2 random after combat
 */
registerImmediateHandler(
  'independent_no_house',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This removes house - handled elsewhere
    // The +2 random is after_combat, not immediate
    return {
      skipDefault: true,
      description: 'Không thuộc House nào',
    };
  },
  'Cannot join houses'
);

/**
 * Blind - Cannot gain points from certain stats
 */
registerImmediateHandler(
  'blind_no_point',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat restriction
    return {
      skipDefault: true,
      description: 'Không nhận điểm từ một số rounds',
    };
  },
  'Cannot gain points from certain rounds'
);

/**
 * Cautious - Cannot gain points from Strength
 */
registerImmediateHandler(
  'cautious_no_str_point',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Không nhận điểm từ round Strength',
    };
  },
  'Cannot gain points from Strength round'
);

/**
 * One Trick Pony - Select one stat to focus
 */
registerImmediateHandler(
  'one_trick_pony_stat_selection',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Find the highest stat and boost it
    let highestStat: StatName = 'strength';
    let highestValue = ctx.currentStats.strength;

    for (const stat of STAT_NAMES) {
      if (ctx.currentStats[stat] > highestValue) {
        highestValue = ctx.currentStats[stat];
        highestStat = stat;
      }
    }

    return {
      statModifiers: [{ stat: highestStat, value: 3 }],
      skipDefault: true,
      description: `+3 ${highestStat} (One Trick Pony)`,
    };
  },
  '+3 to highest stat'
);

/**
 * Cheater - Nếu có hơn 1 Lover, nhận +1 all stats
 * Lover của bạn nhận -2 BIQ (handled separately as target: lover effect)
 */
registerImmediateHandler(
  'cheater_multi_lover_check',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const lover = ctx.character.lover;
    let loverCount = 0;

    if (lover) {
      if (Array.isArray(lover)) {
        // Filter out lost lovers
        loverCount = lover.filter(l => !l.isLost).length;
      }
    }

    // Only get +1 all stats if more than 1 lover
    if (loverCount > 1) {
      return {
        statModifiers: [
          { stat: 'strength', value: 1 },
          { stat: 'speed', value: 1 },
          { stat: 'durability', value: 1 },
          { stat: 'iq', value: 1 },
          { stat: 'biq', value: 1 },
          { stat: 'ma', value: 1 },
        ],
        skipDefault: true,
        description: `+1 All Stats từ Cheater (có ${loverCount} lovers)`,
      };
    }

    return { skipDefault: true };
  },
  '+1 All Stats if more than 1 lover'
);

/**
 * Patient - No power wheel initially
 */
registerImmediateHandler(
  'patient_no_power_wheel',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Không có power wheel ban đầu',
    };
  },
  'No initial power wheel'
);

/**
 * Patient - Max power wheel later
 */
registerImmediateHandler(
  'patient_max_power_wheel',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Power wheel tối đa sau đó',
    };
  },
  'Max power wheel later'
);

/**
 * Impatient - Instant rewards
 */
registerImmediateHandler(
  'impatient_instant_rewards',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Get all rewards immediately
    return {
      skipDefault: true,
      description: 'Nhận rewards ngay lập tức',
    };
  },
  'Receive rewards immediately'
);

/**
 * Cluttered Mind - Nếu có ≥4 Gear và ≥4 Power: +1 all stats
 */
registerImmediateHandler(
  'cluttered_mind_check',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const powerCount = (ctx.character.powers || []).filter((p: any) => !p.isLost).length;

    const normalGear = (ctx.character.gear?.normalGear || []).filter((g: any) => !g.isLost);
    const legacyGear = (ctx.character.gear?.legacyGear || []).filter((g: any) => !g.isLost);
    const gearCount = normalGear.length + legacyGear.length;

    if (gearCount >= 4 && powerCount >= 4) {
      return {
        statModifiers: STAT_NAMES.map(stat => ({ stat, value: 1 })),
        skipDefault: true,
        description: `+1 All Stats (Cluttered Mind - ${gearCount} Gear, ${powerCount} Power)`,
      };
    }

    return { skipDefault: true };
  },
  '+1 All Stats if ≥4 Gear and ≥4 Power'
);

/**
 * Let Me Solo Her - Solo bonus
 */
registerImmediateHandler(
  'let_me_solo_her',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Check if no team members
    const team = ctx.character.team;
    if (!team || team === 0) {
      return {
        statModifiers: STAT_NAMES.map(stat => ({ stat, value: 2 })),
        skipDefault: true,
        description: '+2 All Stats (solo)',
      };
    }

    return { skipDefault: true };
  },
  '+2 All Stats if solo'
);

/**
 * Progressive - Reroll ability
 */
registerImmediateHandler(
  'progressive_reroll',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Có thể reroll',
    };
  },
  'Can reroll'
);

/**
 * Artistic - Bonus with instrument
 */
registerImmediateHandler(
  'artistic_vs_instrument',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Check for instrument weapons
    const instruments = ['Guitar', 'Violin', 'Piano', 'Drums', 'Flute', 'Bagpipe', 'Harmonica'];
    const hasInstrument = (ctx.character.weapons || []).some(
      (w: any) => !w.isLost && instruments.some(i => w.name.includes(i))
    );

    if (hasInstrument) {
      return {
        statModifiers: [{ stat: 'biq', value: 3 }],
        skipDefault: true,
        description: '+3 BIQ (có nhạc cụ)',
      };
    }

    return { skipDefault: true };
  },
  '+3 BIQ with instrument'
);

/**
 * Weak Knee - First round penalty
 */
registerImmediateHandler(
  'weak_knee_first_round',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat effect
    return {
      skipDefault: true,
      description: 'Penalty ở round đầu',
    };
  },
  'First round penalty'
);

/**
 * Cruelty - Tie coinflip advantage
 */
registerImmediateHandler(
  'cruelty_tie_coinflip',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Ưu thế khi hòa',
    };
  },
  'Advantage on tie coinflip'
);

/**
 * Fast Learner - Sau combat: 33% học được 1 Power của đối thủ
 * NOTE: 33% probability đã được lọc bởi condition trong effect definition.
 * Handler chỉ cần xác nhận trigger và GM sẽ trao Power thủ công.
 */
registerImmediateHandler(
  'fast_learner_copy_power',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: '[GM Action] Học được 1 Power ngẫu nhiên từ đối thủ',
    };
  },
  'Copy 1 power from opponent (33% - GM action required)'
);

/**
 * Resilient - Sau combat: 36% +1 vào chỉ số ở round đã thua
 * NOTE: 36% probability đã được lọc bởi condition trong effect definition.
 * Vì không có round results trong context, chọn random stat để buff.
 */
registerImmediateHandler(
  'resilient_stat_from_lost_round',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      statModifiers: [{ stat: randomStat, value: 1 }],
      skipDefault: true,
      description: `+1 ${randomStat} (Resilient - stat từ round đã thua)`,
    };
  },
  '+1 to a lost round stat (36% - random stat fallback)'
);

/**
 * Under the Weather → Shining Brightly transform
 * Sau combat thắng: đổi quirk "Under the Weather" thành "Shining Brightly"
 * NOTE: Cần GM thực hiện đổi quirk thủ công.
 */
registerImmediateHandler(
  'under_weather_transform',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: '[GM Action] Đổi quirk "Under the Weather" → "Shining Brightly"',
    };
  },
  'Transform Under the Weather → Shining Brightly after win (GM action required)'
);

/**
 * Shining Brightly → Under the Weather transform
 * Sau combat thua: đổi quirk "Shining Brightly" thành "Under the Weather"
 * NOTE: Cần GM thực hiện đổi quirk thủ công.
 */
registerImmediateHandler(
  'shining_brightly_transform',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: '[GM Action] Đổi quirk "Shining Brightly" → "Under the Weather"',
    };
  },
  'Transform Shining Brightly → Under the Weather after lose (GM action required)'
);

/**
 * Compassionate - Sau combat thắng: tặng 1 Gear cho đối thủ
 * NOTE: Cần GM thực hiện trao Gear cho đối thủ thủ công.
 */
registerImmediateHandler(
  'compassionate_give_gear',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: '[GM Action] Tặng 1 Gear ngẫu nhiên cho đối thủ',
    };
  },
  'Give 1 Gear to opponent after win (GM action required)'
);

/**
 * Generous - Sau combat thắng: tặng đối thủ PvP Reward
 * NOTE: Cần GM thực hiện trao PvP Reward cho đối thủ và tracking số lần đã tặng.
 */
registerImmediateHandler(
  'generous_give_reward',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: '[GM Action] Tặng PvP Reward cho đối thủ (tăng counter "rewards_given")',
    };
  },
  'Give PvP Reward to opponent after win (GM action required)'
);

/**
 * Generous - Sau combat thua: nhận bonus cho mỗi PvP Reward đã tặng
 * Tìm tracking field "generousRewardsGiven" trong character data.
 * Mỗi reward đã tặng: +1 Power wheel + +1 lowest stat
 */
registerImmediateHandler(
  'generous_receive_bonus',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const rewardsGiven = (ctx.character as any).generousRewardsGiven || 0;

    if (rewardsGiven === 0) {
      return {
        skipDefault: true,
        description: 'Generous: chưa tặng PvP Reward nào → không nhận bonus',
      };
    }

    // +1 lowest stat per reward given
    let lowestStat: StatName = 'strength';
    let lowestValue = ctx.currentStats.strength;
    for (const stat of STAT_NAMES) {
      if (ctx.currentStats[stat] < lowestValue) {
        lowestValue = ctx.currentStats[stat];
        lowestStat = stat;
      }
    }

    return {
      statModifiers: [{ stat: lowestStat, value: rewardsGiven }],
      skipDefault: true,
      description: `+${rewardsGiven} ${lowestStat} (Generous - ${rewardsGiven} reward(s) đã tặng) + [GM Action] +${rewardsGiven} Power wheel`,
    };
  },
  '+1 lowest stat + Power wheel per reward given after lose'
);

/**
 * Cheater - Khi bị loại: tất cả Lovers nhận +1 All Stats
 * NOTE: Cần GM áp dụng buff cho từng Lover thủ công.
 */
registerImmediateHandler(
  'cheater_death_buff_lovers',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const lovers = ctx.character.lover;
    const loverList: string[] = [];

    if (lovers) {
      if (Array.isArray(lovers)) {
        lovers.filter((l: any) => !l.isLost).forEach((l: any) => loverList.push(l.name));
      } else if (typeof lovers === 'object' && (lovers as any).name) {
        loverList.push((lovers as any).name);
      }
    }

    if (loverList.length === 0) {
      return {
        skipDefault: true,
        description: 'Cheater: không có Lover → không có death buff',
      };
    }

    return {
      skipDefault: true,
      description: `[GM Action] Buff +1 All Stats cho ${loverList.length} Lover(s): ${loverList.join(', ')}`,
    };
  },
  'Buff all lovers +1 All Stats on death (GM action required)'
);

/**
 * Charming - Lover tặng 1 Power. Nếu lover không có Power → +1 all stats (lover -1 all stats)
 * Cross-reference lover trong allCharacters để tự xác định.
 */
registerImmediateHandler(
  'charming_steal_power_from_lover',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const quirkName = ctx.source.name || '';

    if (!ctx.allCharacters || ctx.allCharacters.length === 0) {
      return { skipDefault: true, description: 'Charming: không thể tìm lover (no allCharacters)' };
    }

    // Extract lover name from quirk name parentheses: "Charming (LoverName ...)"
    const loverMatch = quirkName.match(/charming\s*\(([^)]+)\)/i);
    if (!loverMatch) {
      return { skipDefault: true, description: 'Charming: không tìm thấy tên lover trong quirk' };
    }

    // Clean up lover string - remove metadata like "(Từ Baguette)", "tặng: X", etc.
    let loverStr = loverMatch[1].toLowerCase()
      .replace(/\s*\(từ\s+[^)]*\)/gi, '')  // Remove "(Từ ...)"
      .replace(/\s*,?\s*tặng[:\s].*/gi, '') // Remove "tặng: ..."
      .replace(/\s*-?\s*nhận\s+power.*/gi, '') // Remove "nhận power ..."
      .replace(/\s*-?\s*bú\s+power.*/gi, '') // Remove "bú power ..."
      .trim();

    // Find the lover character
    const loverChar = ctx.allCharacters.find((c) => {
      const username = c.username?.toLowerCase() || '';
      const name = c.name?.toLowerCase() || '';
      return (username && loverStr.includes(username)) || (name && loverStr.includes(name));
    });

    if (!loverChar) {
      return { skipDefault: true, description: `Charming: không tìm thấy lover "${loverStr}"` };
    }

    // Check if power was already given:
    // 1. Quirk text says "nhận power" or "tặng"
    if (/nhận\s+power|tặng/i.test(quirkName)) {
      return {
        skipDefault: true,
        description: `${loverChar.name} đã tặng Power`,
      };
    }
    // 2. Lover has a lost power mentioning the Charming player
    const selfName = ctx.character?.name?.toLowerCase() || '';
    const selfUsername = ctx.character?.username?.toLowerCase() || '';
    const loverGavePower = (loverChar.powers || []).some((p: any) => {
      if (!p.isLost) return false;
      const pName = (p.name || '').toLowerCase();
      return (selfName && pName.includes(selfName)) ||
             (selfUsername && pName.includes(selfUsername)) ||
             /tặng|charming/i.test(pName);
    });
    if (loverGavePower) {
      return {
        skipDefault: true,
        description: `${loverChar.name} đã tặng Power`,
      };
    }

    // Check if lover has any (non-lost) powers
    const loverPowers = (loverChar.powers || []).filter((p: any) => !p.isLost);
    if (loverPowers.length === 0) {
      // Lover has no power → +1 all stats for self
      const mods: ImmediateHandlerResult['statModifiers'] = [];
      for (const stat of STAT_NAMES) {
        mods.push({ stat, value: 1 });
      }
      return {
        statModifiers: mods,
        skipDefault: true,
        description: `+1 All Stats (${loverChar.name} không có Power)`,
      };
    } else {
      return {
        skipDefault: true,
        description: `${loverChar.name} đã tặng Power`,
      };
    }
  },
  'Steal power from lover, +1 all stats if no power'
);

export function registerQuirkHandlers(): void {
  console.log('Quirk handlers registered');
}
