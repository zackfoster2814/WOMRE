/**
 * House Combat Handlers
 *
 * Combat handlers cho tất cả House effects.
 */

import { registerCombatHandler } from '../registry';
import type { CombatHandlerContext, CombatHandlerResult } from '../types';

// ============================================================================
// DOTHRAKI - Random stat comparison in combat
// ============================================================================

/**
 * Dothraki - Stat được đọ trong trận sẽ tuân theo luật ngẫu nhiên.
 * Mỗi round combat sẽ random stat nào được so, thay vì theo thứ tự cố định.
 */
registerCombatHandler(
  'dothraki_random_stat_compare',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Dothraki: Stat so sánh trong combat được chọn ngẫu nhiên thay vì theo thứ tự',
    };
  },
  'Randomize stat comparison order in combat'
);

// ============================================================================
// COVEN COUNCIL - Death: random non-Coven player re-spins 1 stat
// ============================================================================

/**
 * Coven Council - Khi bị loại: 1 Player random KHÔNG thuộc Coven được Re-Spin 1 stat.
 * (Không phải +2 IQ cho cùng house - đó là mô tả sai cũ)
 */
registerCombatHandler(
  'coven_council_death_bonus',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: '[GM Action] Coven Council bị loại: 1 Player ngẫu nhiên KHÔNG thuộc Coven được Re-Spin 1 stat bất kì',
    };
  },
  'On death: random non-Coven player re-spins 1 stat (GM action required)'
);

// ============================================================================
// ROUNDTABLE HOLD - Retry one round before elimination
// ============================================================================

/**
 * Roundtable Hold - Khi thua và sắp bị loại, đánh lại 1 round. Kích hoạt 1 lần.
 */
registerCombatHandler(
  'roundtable_hold_retry',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Check if player is about to lose (opponent has more rounds won)
    if (ctx.self.roundsLost > ctx.self.roundsWon) {
      return {
        selfPoints: 1,
        description: 'Roundtable Hold: Đánh lại 1 round trước khi bị loại (+1 điểm)',
      };
    }

    return {
      description: 'Roundtable Hold: Chưa kích hoạt (chưa thua)',
    };
  },
  'Retry one round before elimination (once)'
);

// ============================================================================
// UCHIHA - Thắng người cùng nhà → nhận thêm +2 Dura và +2 BIQ một lần nữa
// ============================================================================

/**
 * Uchiha - Mỗi khi đánh bại một người CÙNG Uchiha, nhận thêm +2 Dura và +2 BIQ.
 * (Bonus ban đầu +2 Dura +2 BIQ đã được apply qua addStat immediate)
 * Handler này chỉ trigger after_combat_win, check xem opponent có cùng Uchiha không.
 */
registerCombatHandler(
  'check_enemy_is_same_house',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const opponentHouses = (ctx.opponent.character.houses || [])
      .filter((h: any) => !h.isLost)
      .map((h: any) => h.name);

    const opponentInUchiha = opponentHouses.some(
      (name: string) => name.toLowerCase().includes('uchiha')
    );

    if (!opponentInUchiha) {
      return {
        skipDefault: true,
        description: 'Uchiha: đối thủ không cùng Uchiha, không nhận bonus thêm',
      };
    }

    // Opponent is also Uchiha → grant +2 Dur and +2 BIQ again
    return {
      selfStatMods: [
        { stat: 'durability', value: 2 },
        { stat: 'biq', value: 2 },
      ],
      description: 'Uchiha vs Uchiha: nhận thêm +2 Dura và +2 BIQ',
    };
  },
  'After win vs same Uchiha house member: grant +2 Dura and +2 BIQ again'
);

// ============================================================================
// GREY WIND - Death bonus to all Stark players
// ============================================================================

/**
 * Grey Wind (Dire Wolf) - Khi bị loại: Người nhà Stark +1 all stats.
 */
registerCombatHandler(
  'grey_wind_death_bonus',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Grey Wind: Khi bị loại, tất cả người nhà Stark nhận +1 all stats',
    };
  },
  '+1 all stats to all Stark players on death'
);

// ============================================================================
// SHAGGYDOG - After combat bonus to all Stark players
// ============================================================================

/**
 * Shaggydog (Dire Wolf) - Sau mỗi Combat: Người nhà Stark +1 Stat thấp nhất.
 */
registerCombatHandler(
  'shaggydog_house_bonus',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Shaggydog: Sau combat, tất cả người nhà Stark nhận +1 Stat thấp nhất',
    };
  },
  '+1 lowest stat to all Stark players after combat'
);

export function registerHouseCombatHandlers() {
  // All handlers are registered at module level via registerCombatHandler calls above.
  // This function exists to be called from the handler index for explicit initialization.
}
