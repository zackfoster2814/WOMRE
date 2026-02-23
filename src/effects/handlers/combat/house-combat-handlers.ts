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
 * Roundtable Hold - Khi thua, gọi một Tarnished khác lên đấu trận phụ thay.
 * - Nếu đối thủ cũng là Tarnished → không kích hoạt
 * - Nếu là Tarnished cuối cùng → không kích hoạt
 * - Kết quả trận phụ (Tarnished được chọn vs đối thủ gốc) quyết định số phận người thua
 * Kích hoạt 1 lần.
 */
registerCombatHandler(
  'roundtable_hold_retry',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Check if player lost
    if (ctx.self.roundsLost <= ctx.self.roundsWon) {
      return {
        description: 'Roundtable Hold: Chưa kích hoạt (chưa thua)',
      };
    }

    // Check if opponent is also a Tarnished (has Roundtable Hold house active)
    const opponentHouses = (ctx.opponent?.character.houses || [])
      .filter((h: any) => !h.isLost)
      .map((h: any) => h.name);
    const opponentIsTarnished = opponentHouses.includes('Roundtable Hold');

    if (opponentIsTarnished) {
      return {
        description: 'Roundtable Hold: Không kích hoạt — đối thủ cũng là Tarnished',
      };
    }

    return {
      description: '[GM Action] Roundtable Hold: Gọi một Tarnished còn sống lên đấu trận phụ. Kết quả trận phụ quyết định số phận của người thua.',
    };
  },
  'On loss: call another Tarnished for a sub-match (once, skips if opponent is also Tarnished)'
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
