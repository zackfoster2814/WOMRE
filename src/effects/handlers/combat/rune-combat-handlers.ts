/**
 * Rune & Runeword Combat Handlers
 *
 * Combat handlers cho tất cả Rune và Runeword effects.
 */

import { registerCombatHandler } from '../registry';
import type { CombatHandlerContext, CombatHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// UNBREAKABLE - +1 point when winning Dura round
// ============================================================================

/**
 * Unbreakable (Ith + Amn) - +1 điểm khi chiến thắng round Dura.
 */
registerCombatHandler(
  'unbreakable_dura_round',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const duraResult = ctx.roundResults?.durability;
    if (duraResult === 'win') {
      return {
        selfPoints: 1,
        description: 'Unbreakable: Thắng round Dura → +1 điểm',
      };
    }
    return { skipDefault: true };
  },
  '+1 point on Durability round win'
);

// ============================================================================
// DOUBLE CLAWS - 18% steal 1 power from opponent
// ============================================================================

/**
 * Double Claws (El + Amn) - 18% cướp 1 Power ngẫu nhiên.
 */
registerCombatHandler(
  'double_claws_steal',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    // 18% chance handled by condition in effect definition
    return {
      description: 'Double Claws: Cướp vĩnh viễn 1 Power ngẫu nhiên của kẻ địch (18%)',
    };
  },
  '18% permanently steal 1 random power from opponent'
);

// ============================================================================
// EXTRAORDINARY - Respin stats with Base < Base IQ
// ============================================================================

/**
 * Extraordinary (Tal + Ral) - Stats có Base < Base IQ được quay lại 1 lần.
 */
registerCombatHandler(
  'extraordinary_respin',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const baseIQ = ctx.self.baseStats.iq;
    const toRespin: StatName[] = [];
    for (const stat of STAT_NAMES) {
      if (stat !== 'iq' && ctx.self.baseStats[stat] < baseIQ) {
        toRespin.push(stat);
      }
    }
    if (toRespin.length > 0) {
      return {
        description: `Extraordinary: Respin ${toRespin.join(', ')} (Base < Base IQ ${baseIQ})`,
      };
    }
    return { description: `Extraordinary: Không có stat nào có Base < Base IQ (${baseIQ})` };
  },
  'Respin all stats with Base lower than Base IQ'
);

// ============================================================================
// BLACKJACK - Summon gamble (97% discard)
// ============================================================================

/**
 * Blackjack (Sol + Thul) - Gọi 1 Summon ngẫu nhiên, 97% bỏ, 3% giữ.
 */
registerCombatHandler(
  'blackjack_summon_gamble',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    const keep = Math.random() < 0.03; // 3% keep
    if (keep) {
      return {
        description: 'Blackjack: May mắn! Giữ lại Summon (3%)',
      };
    }
    return {
      description: 'Blackjack: Triệu hồi rồi bỏ Summon (97%)',
    };
  },
  'Summon from wheel: 97% discard, 3% keep'
);

// ============================================================================
// HIGHROLLER - Swap Base 1↔10 for both sides
// ============================================================================

/**
 * Highroller (El + Shael) - Base 1 tính là 10, Base 10 tính là 1 trong combat.
 */
registerCombatHandler(
  'highroller_swap_base_1_10',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const selfMods: Array<{ stat: StatName; value: number }> = [];
    const oppMods: Array<{ stat: StatName; value: number }> = [];

    for (const stat of STAT_NAMES) {
      if (ctx.self.baseStats[stat] === 1) selfMods.push({ stat, value: 9 });   // 1→10
      if (ctx.self.baseStats[stat] === 10) selfMods.push({ stat, value: -9 });  // 10→1
      if (ctx.opponent) {
        if (ctx.opponent.baseStats[stat] === 1) oppMods.push({ stat, value: 9 });
        if (ctx.opponent.baseStats[stat] === 10) oppMods.push({ stat, value: -9 });
      }
    }

    return {
      selfStatMods: selfMods,
      opponentStatMods: oppMods,
      description: 'Highroller: Base 1 ↔ Base 10 trong combat',
    };
  },
  'Swap Base 1 and Base 10 for both sides in combat'
);

// ============================================================================
// FLAWLESS - +1 all stats if opponent scored 0 points
// ============================================================================

/**
 * Flawless (Amn + Shael) - Nếu đối phương không ghi điểm, +1 all stats.
 */
registerCombatHandler(
  'flawless_perfect_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const opponentPoints = ctx.self.roundsWon === ctx.totalRounds ? 0 : undefined;
    // Perfect win = opponent got 0 points = self won all rounds
    if (ctx.self.roundsWon === ctx.totalRounds) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
        description: 'Flawless: Đối phương không ghi điểm → +1 all stats',
      };
    }
    void opponentPoints;
    return { skipDefault: true };
  },
  '+1 all stats if opponent scored 0 points'
);

// ============================================================================
// UNDYING RAGE - +3 to next round's stat after losing a round
// ============================================================================

/**
 * Undying Rage (El + Sol) - Mỗi round thua, stat của round kế tiếp +3.
 */
registerCombatHandler(
  'undying_rage_boost',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Handled directly in combat loop (computeCombat) — stat boost applied to next round's value
    // This handler only provides description for the effects panel
    if (ctx.self.roundsLost > 0) {
      return {
        skipDefault: true,
        description: `Undying Rage: ${ctx.self.roundsLost} round thua → +3 cho mỗi round kế tiếp`,
      };
    }
    return { skipDefault: true };
  },
  '+3 to next round stat after each round loss (applied in combat loop)'
);

// ============================================================================
// CURE - +1 lowest stat per debuff negated
// ============================================================================

/**
 * Cure (Thul + Zod) - +1 stat thấp nhất với mỗi Debuff bị vô hiệu.
 */
registerCombatHandler(
  'cure_counter_debuff',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    // Count opponent debuffs (approximate from opponent stat mods)
    // We give +1 lowest stat as the base counter
    let lowestStat: StatName = 'strength';
    let lowestVal = ctx.self.stats.strength;
    for (const stat of STAT_NAMES) {
      if (ctx.self.stats[stat] < lowestVal) {
        lowestVal = ctx.self.stats[stat];
        lowestStat = stat;
      }
    }

    return {
      selfStatMods: [{ stat: lowestStat, value: 1 }],
      description: `Cure: Vô hiệu debuff đối phương → +1 ${lowestStat} (stat thấp nhất)`,
    };
  },
  '+1 lowest stat per opponent debuff negated'
);

// ============================================================================
// ADVENTUROUS - Extra PvP Reward after successful raid
// ============================================================================

/**
 * Adventurous (Ral + Amn) - [PVE] Khi Raid Boss thành công, nhận thêm 1 PvP Reward.
 */
registerCombatHandler(
  'adventurous_raid_reward',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.isPvE) {
      return {
        description: 'Adventurous: Raid Boss thành công → nhận thêm 1 PvP Reward',
      };
    }
    return { skipDefault: true };
  },
  'Extra PvP Reward after successful raid'
);

// ============================================================================
// RESONANCE - +1 lowest stat per buff on self
// ============================================================================

/**
 * Resonance (Ith + Ral) - +1 stat thấp nhất với mỗi Buff có trên bản thân.
 */
registerCombatHandler(
  'resonance_buff_count',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Count buffs: powers + quirks + gears + weapons as approximation
    const buffCount = ctx.self.powers.length + ctx.self.quirks.length + ctx.self.gears.length;

    let lowestStat: StatName = 'strength';
    let lowestVal = ctx.self.stats.strength;
    for (const stat of STAT_NAMES) {
      if (ctx.self.stats[stat] < lowestVal) {
        lowestVal = ctx.self.stats[stat];
        lowestStat = stat;
      }
    }

    if (buffCount > 0) {
      return {
        selfStatMods: [{ stat: lowestStat, value: buffCount }],
        description: `Resonance: ${buffCount} buff → +${buffCount} ${lowestStat}`,
      };
    }
    return { description: 'Resonance: Không có buff nào' };
  },
  '+1 lowest stat per buff on self'
);

// ============================================================================
// CONSTITUTION - +1 STR per round won
// ============================================================================

/**
 * Constitution - Sau Combat: Với mỗi Round thắng, +1 Strength.
 */
registerCombatHandler(
  'constitution_str_per_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const wins = ctx.self.roundsWon;
    if (wins > 0) {
      return {
        selfStatMods: [{ stat: 'strength', value: wins }],
        description: `Constitution: ${wins} round thắng → +${wins} Strength`,
      };
    }
    return { description: 'Constitution: Không thắng round nào' };
  },
  '+1 STR per round won after combat'
);

// ============================================================================
// PRESERVATION - MA → starting points (1 per 5 MA)
// ============================================================================

/**
 * Preservation - Giảm MA về 1, nhận 1 điểm khởi đầu với mỗi 5 MA bị giảm.
 */
registerCombatHandler(
  'preservation_ma_to_points',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const currentMA = ctx.self.stats.ma;
    const reduced = Math.max(0, currentMA - 1);
    const points = Math.floor(reduced / 5);

    if (points > 0) {
      return {
        selfStatMods: [{ stat: 'ma', value: -(currentMA - 1) }],
        selfPoints: points,
        description: `Preservation: MA ${currentMA} → 1, nhận ${points} điểm khởi đầu`,
      };
    }
    return {
      selfStatMods: [{ stat: 'ma', value: -(currentMA - 1) }],
      description: `Preservation: MA ${currentMA} → 1 (chưa đủ 5 MA để nhận điểm)`,
    };
  },
  'Reduce MA to 1, gain 1 point per 5 MA reduced'
);

// ============================================================================
// METAPHYSICS - 5% copy opponent's highest base stat to own lowest
// ============================================================================

/**
 * Metaphysics - 5% Biến Base Stat Thấp Nhất bằng Base Stat Cao Nhất của đối thủ.
 */
registerCombatHandler(
  'metaphysics_copy_stat',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    // 5% chance handled by condition in effect definition
    let lowestSelf: StatName = 'strength';
    let lowestVal = ctx.self.baseStats.strength;
    let highestOpp: StatName = 'strength';
    let highestVal = ctx.opponent.baseStats.strength;

    for (const stat of STAT_NAMES) {
      if (ctx.self.baseStats[stat] < lowestVal) { lowestVal = ctx.self.baseStats[stat]; lowestSelf = stat; }
      if (ctx.opponent.baseStats[stat] > highestVal) { highestVal = ctx.opponent.baseStats[stat]; highestOpp = stat; }
    }

    const diff = highestVal - lowestVal;
    if (diff > 0) {
      return {
        selfStatMods: [{ stat: lowestSelf, value: diff }],
        description: `Metaphysics (5%): ${lowestSelf} Base ${lowestVal} → ${highestVal} (đối thủ ${highestOpp})`,
      };
    }
    return { skipDefault: true };
  },
  "5% copy opponent's highest base stat to own lowest"
);

// ============================================================================
// KINETICS - Strength += half of Base Speed
// ============================================================================

/**
 * Kinetics (runeword) - Trước Combat: Strength được cộng một lượng bằng phân nửa Base Speed.
 */
registerCombatHandler(
  'kinetics_speed_to_str',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const bonus = Math.floor(ctx.self.baseStats.speed / 2);
    if (bonus > 0) {
      return {
        selfStatMods: [{ stat: 'strength', value: bonus }],
        description: `Kinetics: +${bonus} STR (phân nửa Base Speed ${ctx.self.baseStats.speed})`,
      };
    }
    return { description: 'Kinetics: Base Speed < 2, không có bonus' };
  },
  'Strength += half Base Speed before combat'
);

// ============================================================================
// SAGACITY - +2 IQ when winning Speed round
// ============================================================================

/**
 * Sagacity (runeword) - Trong Combat: Thắng round Speed sẽ khiến IQ được +2.
 */
registerCombatHandler(
  'sagacity_speed_to_iq',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.speed === 'win') {
      return {
        selfStatMods: [{ stat: 'iq', value: 2 }],
        description: 'Sagacity: Thắng round Speed → +2 IQ',
      };
    }
    return { skipDefault: true };
  },
  '+2 IQ when winning Speed round'
);

// ============================================================================
// MOMENTUM - Auto-win Speed round if Speed >= 2x opponent
// ============================================================================

/**
 * Momentum (runeword) - Nếu Speed gấp đôi đối thủ, mặc định thắng round Speed.
 */
registerCombatHandler(
  'momentum_auto_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const selfSpd = ctx.self.stats.speed;
    const oppSpd = ctx.opponent.stats.speed;
    if (selfSpd >= oppSpd * 2) {
      return {
        autoWin: true,
        description: `Momentum: Speed ${selfSpd} >= 2x đối thủ (${oppSpd}) → Auto Win Speed round`,
      };
    }
    return { description: `Momentum: Speed ${selfSpd} chưa gấp đôi đối thủ (${oppSpd})` };
  },
  'Auto-win Speed round if Speed >= 2x opponent Speed'
);

// ============================================================================
// EPIPHANY - Disable powers if IQ loses stat, +1 IQ per power disabled
// ============================================================================

/**
 * Epiphany (runeword) - Nếu IQ thua stat, vô hiệu hóa Power, +1 IQ với mỗi Power bị vô hiệu.
 */
registerCombatHandler(
  'epiphany_power_to_iq',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const selfIQ = ctx.self.stats.iq;
    const oppIQ = ctx.opponent.stats.iq;
    if (selfIQ < oppIQ) {
      const iqBonus = ctx.self.powers.length;
      if (iqBonus > 0) {
        return {
          selfStatMods: [{ stat: 'iq', value: iqBonus }],
          description: `Epiphany: IQ thua (${selfIQ} < ${oppIQ}), vô hiệu ${iqBonus} Power → +${iqBonus} IQ`,
        };
      }
    }
    return { skipDefault: true };
  },
  'If IQ loses, disable own powers and gain +1 IQ per power disabled'
);

// ============================================================================
// APOTHEOSIS - Auto-win PvE
// ============================================================================

/**
 * Apotheosis (runeword) - Luôn thắng PvE.
 */
registerCombatHandler(
  'apotheosis_auto_win_pve',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.isPvE) {
      return {
        autoWin: true,
        description: 'Apotheosis: Luôn thắng PvE',
      };
    }
    return { skipDefault: true };
  },
  'Always win PvE combats'
);

export function registerRuneCombatHandlers() {
  // All handlers are registered at module level via registerCombatHandler calls above.
}
