/**
 * Quirk Combat Handlers
 *
 * Combat handlers cho các Quirk có timing during_combat / on_round_win / on_round_lose.
 */

import { registerCombatHandler } from '../registry';
import type { CombatHandlerContext, CombatHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// ONE TRICK PONY - 1 stat ngẫu nhiên thắng = 3 điểm, các stat khác thắng = 0
// ============================================================================

/**
 * One Trick Pony - during_combat:
 * Chọn ngẫu nhiên 1 stat. Thắng stat đó → 3 điểm. Tất cả stat còn lại thắng → 0 điểm.
 * Handler này trả về stat được chọn + mô tả. Logic trừ điểm các stat khác là external.
 */
registerCombatHandler(
  'one_trick_pony_stat_selection',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    const chosenStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      description: `One Trick Pony: Stat được chọn = ${chosenStat}. Thắng ${chosenStat} → 3 điểm; các stat khác thắng → 0 điểm`,
    };
  },
  'Random 1 stat: win = 3pts; all other stat wins = 0pts'
);

// ============================================================================
// BLIND - 15% không nhận điểm khi thắng 1 round
// ============================================================================

/**
 * Blind - on_round_win (15% condition đã xử lý trong effect definition):
 * Không nhận điểm cho round vừa thắng.
 */
registerCombatHandler(
  'blind_no_point',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      selfPoints: -1,
      description: 'Blind: không nhận điểm round này (15%)',
    };
  },
  '15% lose 1 point on round win (Blind)'
);

// ============================================================================
// CAUTIOUS - Đối thủ không nhận điểm khi thắng round Strength
// ============================================================================

/**
 * Cautious - during_combat: check nếu opponent vừa thắng round Strength → -1 điểm đối thủ.
 * Target: opponent.
 */
registerCombatHandler(
  'cautious_no_str_point',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // roundResults từ perspective của ctx.self → nếu strength = 'lose' nghĩa là opponent thắng Str
    const oppWonStr = ctx.roundResults?.strength === 'lose';
    if (!oppWonStr) return { skipDefault: true };

    return {
      opponentPoints: -1,
      description: 'Cautious: đối thủ không nhận điểm round Strength',
    };
  },
  'Opponent gets 0 points on Strength round win (Cautious)'
);

// ============================================================================
// WEAK-KNEE - Round chiến thắng đầu tiên không nhận điểm
// ============================================================================

/**
 * Weak-Knee - on_round_win: nếu đây là round thắng đầu tiên → không nhận điểm.
 */
registerCombatHandler(
  'weak_knee_first_round',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // roundsWon === 0 trước khi round này được tính → đây là lần thắng đầu tiên
    if (ctx.self.roundsWon === 0) {
      return {
        selfPoints: -1,
        description: 'Weak-Knee: round thắng đầu tiên không nhận điểm',
      };
    }
    return { skipDefault: true };
  },
  'First round win grants 0 points (Weak-Knee)'
);

// ============================================================================
// CRUELTY - Round hòa: 50/50 quyết định ai nhận 1 điểm
// ============================================================================

/**
 * Cruelty - during_combat / on_tie: 50% self nhận 1 điểm, 50% opponent nhận 1 điểm.
 * (Thay vì không ai nhận gì khi hòa)
 */
registerCombatHandler(
  'cruelty_tie_coinflip',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    const selfWins = Math.random() >= 0.5;
    if (selfWins) {
      return {
        selfPoints: 1,
        description: 'Cruelty: hòa → vòng 50/50 → Bạn nhận 1 điểm',
      };
    }
    return {
      opponentPoints: 1,
      description: 'Cruelty: hòa → vòng 50/50 → Đối thủ nhận 1 điểm',
    };
  },
  'On tie: 50/50 gives 1 point to either player (Cruelty)'
);

// ============================================================================
// ARTISTIC - Sau combat vs đối thủ dùng nhạc cụ: +2 IQ
// ============================================================================

/**
 * Artistic - after_combat: kiểm tra đối thủ có dùng nhạc cụ không → +2 IQ.
 */
registerCombatHandler(
  'artistic_vs_instrument',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const INSTRUMENT_NAMES = [
      'bagpipe', 'drums', 'flute', 'guitar', 'violin', 'trumpet',
      'piano', 'harp', 'lute', 'saxophone', 'bass', 'cello', 'harmonica',
    ];

    const weapons: any[] = ctx.opponent.weapons || [];
    const hasInstrument = weapons.some((w) => {
      const wName = typeof w === 'string' ? w : w?.name ?? '';
      return INSTRUMENT_NAMES.some(inst => wName.toLowerCase().includes(inst));
    });

    if (!hasInstrument) {
      return { skipDefault: true, description: 'Artistic: đối thủ không dùng nhạc cụ' };
    }

    return {
      selfStatMods: [{ stat: 'iq', value: 2 }],
      description: '+2 IQ (Artistic - đối thủ dùng nhạc cụ)',
    };
  },
  '+2 IQ after combat vs opponent with instrument (Artistic)'
);

// ============================================================================
// UNDER THE WEATHER - After win: transform to "Shining Brightly" quirk
// ============================================================================

registerCombatHandler(
  'under_weather_transform',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: 'Under the Weather: Sau thắng → chuyển thành Quirk "Shining Brightly" (xử lý ngoài game)',
    };
  },
  'After combat win: Under the Weather transforms to Shining Brightly quirk'
);

// ============================================================================
// GENEROUS - After win: give PvP Reward; after loss: +1 Power +1 lowest per reward given
// ============================================================================

registerCombatHandler(
  'generous_give_reward',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: 'Generous: Sau thắng → tặng đối thủ 1 PvP Reward (xử lý ngoài game)',
    };
  },
  'After win: give opponent a PvP Reward (Generous)'
);

registerCombatHandler(
  'generous_receive_bonus',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: 'Generous: Sau thua → +1 Power và +1 stat thấp nhất với mỗi PvP Reward đã tặng (xử lý ngoài game)',
    };
  },
  'After loss: +1 Power +1 lowest stat per PvP Reward previously given (Generous)'
);

// ============================================================================
// SHINING BRIGHTLY - After loss: transform to "Under the Weather" quirk
// ============================================================================

registerCombatHandler(
  'shining_brightly_transform',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: 'Shining Brightly: Sau thua → chuyển thành Quirk "Under the Weather" (xử lý ngoài game)',
    };
  },
  'After combat loss: Shining Brightly transforms to Under the Weather quirk'
);

// ============================================================================
// CHEATER - On death: lovers get +2 highest stat
// ============================================================================

registerCombatHandler(
  'cheater_death_buff_lovers',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const lovers = (ctx.self.character as any)?.lover || [];
    const activeLoverCount = lovers.filter((l: any) => !l.isLost).length;
    if (activeLoverCount === 0) {
      return { skipDefault: true, description: 'Cheater: Không có Lover khi chết' };
    }
    return {
      skipDefault: true,
      description: `Cheater: Khi chết → ${activeLoverCount} Lover nhận +2 stat cao nhất (xử lý ngoài game)`,
    };
  },
  'On death: all lovers receive +2 to their highest stat (Cheater)'
);

// ============================================================================
// PATIENT - After win: receive power wheel with max result (no spin, just best)
// ============================================================================

registerCombatHandler(
  'patient_max_power_wheel',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: 'Patient: Sau thắng → nhận vòng quay Power với kết quả tối đa (xử lý ngoài game)',
    };
  },
  'After combat win: receive power wheel with maximum result (Patient)'
);

// ============================================================================
// FAST LEARNER - 33% copy 1 random power from opponent after combat
// ============================================================================

registerCombatHandler(
  'fast_learner_copy_power',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppPowers: string[] = ctx.opponent.powers || [];
    if (oppPowers.length === 0) {
      return { skipDefault: true, description: 'Fast Learner: Đối thủ không có Power' };
    }
    const copiedPower = oppPowers[Math.floor(Math.random() * oppPowers.length)];
    return {
      grantPower: copiedPower,
      description: `Fast Learner: Học được Power "${copiedPower}" từ đối thủ`,
    };
  },
  '33% chance to copy 1 random power from opponent after combat (Fast Learner)'
);

// ============================================================================
// PROGRESSIVE - After loss: reroll stats, if total higher +1 all stats
// ============================================================================

registerCombatHandler(
  'progressive_reroll',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: 'Progressive: Quay lại stats sau thua — so sánh total, nếu cao hơn +1 all (xử lý ngoài game)',
    };
  },
  'After loss: reroll stats; if new total > old total, +1 all stats (Progressive)'
);

// ============================================================================
// RESILIENT - After combat: 36% +1 to a stat from a round that was lost
// ============================================================================

registerCombatHandler(
  'resilient_stat_from_lost_round',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Find stats from lost rounds
    const lostStats = STAT_NAMES.filter(stat => ctx.roundResults?.[stat] === 'lose');
    if (lostStats.length === 0) {
      return { skipDefault: true, description: 'Resilient: Không thua round nào → không áp dụng' };
    }
    // Pick a random lost-round stat
    const chosenStat = lostStats[Math.floor(Math.random() * lostStats.length)];
    return {
      selfStatMods: [{ stat: chosenStat, value: 1 }],
      description: `Resilient: 36% → +1 ${chosenStat} (thua round ${chosenStat})`,
    };
  },
  'After combat: 36% +1 to stat from a round that was lost (Resilient)'
);

// ============================================================================
// COMPASSIONATE - After combat win: give 1 Gear to opponent
// ============================================================================

registerCombatHandler(
  'compassionate_give_gear',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: 'Compassionate: Sau thắng → tặng 1 Gear cho đối thủ (xử lý ngoài game)',
    };
  },
  'After combat win: give 1 Gear to opponent (Compassionate)'
);

// ============================================================================
// LET ME SOLO HER - PvE only: x8 stats to solo boss; win → Archetype Gigachad
// ============================================================================

registerCombatHandler(
  'let_me_solo_her',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.isPvE) return { skipDefault: true };
    return {
      selfStatMods: STAT_NAMES.map(stat => ({ stat, value: ctx.self.stats[stat] * 7 })), // x8 = base * 7 additional
      description: 'Let me solo her: [PvE] x8 stats để solo boss. Thắng → nhận Archetype Gigachad (xử lý ngoài game)',
    };
  },
  'PvE only: x8 all stats to solo boss; win grants Archetype Gigachad (Let me solo her)'
);

export function registerQuirkCombatHandlers(): void {
  // All handlers registered above at module level
  console.log('Quirk combat handlers registered');
}
