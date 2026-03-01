/**
 * Rune Effects Data
 *
 * Dữ liệu effects cho các Rune và Runeword
 * Nguồn: wheelofmultiverse-ss3.xlsx - Sheet "Rune"
 */

import { defineEffect } from '../registry';

// ============================================================================
// BASIC RUNES
// ============================================================================

export function registerRunes() {
  // El - +1 Strength
  defineEffect('rune', 'El')
    .description('Nhận +1 Strength')
    .weight(10)
    .addStat('strength', 1)
    .register();

  // Tir - +1 Speed
  defineEffect('rune', 'Tir')
    .description('Nhận +1 Speed')
    .weight(10)
    .addStat('speed', 1)
    .register();

  // Ith - +1 Dura
  defineEffect('rune', 'Ith')
    .description('Nhận +1 Dura')
    .weight(10)
    .addStat('durability', 1)
    .register();

  // Tal - +1 IQ
  defineEffect('rune', 'Tal')
    .description('Nhận +1 IQ')
    .weight(10)
    .addStat('iq', 1)
    .register();

  // Ral - +1 BIQ
  defineEffect('rune', 'Ral')
    .description('Nhận +1 BIQ')
    .weight(10)
    .addStat('biq', 1)
    .register();

  // Ort - +1 MA
  defineEffect('rune', 'Ort')
    .description('Nhận +1 MA')
    .weight(10)
    .addStat('ma', 1)
    .register();

  // Thul - [PvE Only] +2 all stats
  defineEffect('rune', 'Thul')
    .description('[PvE Only] Nhận +2 all stats khi thi đấu PvE.')
    .weight(8)
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 2,
      timing: 'pve_only',
      target: 'self'
    })
    .register();

  // Amn - +1 Str, +1 Dura
  defineEffect('rune', 'Amn')
    .description('Nhận +1 Strength và +1 Dura.')
    .weight(8)
    .addStat('strength', 1)
    .addStat('durability', 1)
    .register();

  // Sol - +1 Speed, +1 IQ
  defineEffect('rune', 'Sol')
    .description('Nhận +1 Speed và +1 IQ.')
    .weight(8)
    .addStat('speed', 1)
    .addStat('iq', 1)
    .register();

  // Shael - +1 BIQ, +1 MA
  defineEffect('rune', 'Shael')
    .description('Nhận +1 BIQ và +1 MA.')
    .weight(8)
    .addStat('biq', 1)
    .addStat('ma', 1)
    .register();

  // Zod - Weapon indestructible
  defineEffect('rune', 'Zod')
    .description('Vũ khí này sẽ không thể bị phá hủy, tháo rời, thay thế hay vô hiệu hóa.')
    .weight(8)
    .immuneTo('destroy', 'disarm', 'disable')
    .register();
}

// ============================================================================
// RUNEWORDS
// ============================================================================

export function registerRunewords() {
  // Razorsharp (El + Tir)
  defineEffect('runeword', 'Razorsharp')
    .description('Debuff: Đối thủ bị -2 Strength và -2 Speed.')
    .debuffOpponent('strength', 2)
    .debuffOpponent('speed', 2)
    .register();

  // Unbreakable (Ith + Amn)
  defineEffect('runeword', 'Unbreakable')
    .description('Trong Combat: Nhận thêm +1 điểm khi chiến thắng round Dura. Nhận +2 Base Dura.')
    .addStat('durability', 2, true)
    .effect({
      type: 'extra_point_on_win',
      points: 1,
      timing: 'during_combat',
      target: 'self',
      conditions: [{ type: 'round_result' }], // Round Dura specific - needs custom handler
      customHandler: 'unbreakable_dura_round'
    })
    .register();

  // Pennyworthy (Ith + Ort)
  defineEffect('runeword', 'Pennyworthy')
    .description('Người sở hữu runeword này mất tất cả Power và không thể nhận bất kì Power nào. Trong Combat: Với mỗi round thắng, có 36% nhận được thêm 1 điểm. Sau combat: Với mỗi round thua, có 36% nhận +2 vào chỉ số thua.')
    .effect({
      type: 'remove_power',
      grantCount: -1, // All powers
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'immunity',
      immuneTo: ['grant_power'],
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'extra_point_on_win',
      points: 1,
      timing: 'on_round_win',
      target: 'self',
      conditions: [{ type: 'probability', chance: 36 }]
    })
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'pennyworthy_lose_round_bonus'
    })
    .register();

  // Double Claws (El + Amn)
  defineEffect('runeword', 'Double Claws')
    .description('Trước combat: Có 18% khả năng cướp vĩnh viễn 1 Power ngẫu nhiên của kẻ địch. Nếu cướp thành công, tiếp tục cướp (stack vô hạn lần cho đến khi fail hoặc đối thủ hết power).')
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'opponent',
      customHandler: 'double_claws_steal'
    })
    .register();

  // Extraordinary (Tal + Ral)
  defineEffect('runeword', 'Extraordinary')
    .description('Khi nhận Runeword này, tất cả các Stats có Base nhỏ hơn Base IQ của chủ sở hữu sẽ ngay lập tức được quay lại 1 lần.')
    .effect({
      type: 'stat_respin',
      timing: 'immediate',
      target: 'self',
      customHandler: 'extraordinary_respin'
    })
    .register();

  // Elven Night (Sol + Zod)
  defineEffect('runeword', 'Elven Night')
    .description('Trong combat: Mỗi bên bị -9 vào 1 chỉ số ngẫu nhiên.')
    .effect({
      type: 'stat_modifier',
      stat: 'random',
      value: -9,
      timing: 'during_combat',
      target: 'self'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'random',
      value: -9,
      timing: 'during_combat',
      target: 'opponent'
    })
    .register();

  // Blackjack (Sol + Thul)
  defineEffect('runeword', 'Blackjack')
    .description('Trong combat: Gọi ngẫu nhiên 1 Summon từ vòng quay Summon Wheel. Sau Combat: Có 97% sẽ bỏ Summon đó, nếu không bỏ, giữ summon đó vĩnh viễn.')
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'blackjack_summon_gamble'
    })
    .register();

  // Dead Touch (Ort + Thul)
  defineEffect('runeword', 'Dead Touch')
    .description('Sau combat: Đối thủ nhận 1 Power vô dụng. Sau đó, cướp ngẫu nhiên 2 Power của đối thủ, nếu đó là Power vô dụng, giữ lại, nếu nó là Power khác, trả lại. Với mỗi Power vô dụng, nhận +1 IQ và +1 BIQ.')
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'dead_touch_useless_power'
    })
    .register();

  // Affection (Ort + Sol)
  defineEffect('runeword', 'Affection')
    .description('Khi bắt đầu combat, người sở hữu runeword này và đối thủ sẽ bị đảo (inversion) 1 chỉ số ngẫu nhiên, kết quả này được giữ vĩnh viễn. Sau combat: Cả hai có 69% make love.')
    .effect({
      type: 'stat_inversion',
      stat: 'random',
      timing: 'before_combat',
      target: 'both'
    })
    .effect({
      type: 'make_love',
      timing: 'after_combat',
      target: 'both',
      conditions: [{ type: 'probability', chance: 69 }]
    })
    .register();

  // Highroller (El + Shael)
  defineEffect('runeword', 'Highroller')
    .description('Trong combat: Chỉ số Base 1 của cả hai bên được tính là Base 10 và Base 10 sẽ là 1. (Không áp dụng được lên IQ Skeleton).')
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'both',
      customHandler: 'highroller_swap_base_1_10'
    })
    .register();

  // The Twin (Any Pair)
  defineEffect('runeword', 'The Twin')
    .description('Nhận +2 Speed, +2 IQ. Sau 2 combat PvP chiến thắng (kích hoạt 1 lần): Nhận +2 Strength, +2 Dura. Sau 4 combat PvP chiến thắng (kích hoạt 1 lần): Nhận +2 BIQ, +2 MA.')
    .addStat('speed', 2)
    .addStat('iq', 2)
    .effect({
      type: 'stat_modifier',
      stat: 'strength',
      value: 2,
      timing: 'immediate',
      target: 'self',
      conditions: [{ type: 'pvp_win_count', winCount: 2, winCountOperator: '>=' }],
      triggerOnce: true
    })
    .effect({
      type: 'stat_modifier',
      stat: 'durability',
      value: 2,
      timing: 'immediate',
      target: 'self',
      conditions: [{ type: 'pvp_win_count', winCount: 2, winCountOperator: '>=' }],
      triggerOnce: true
    })
    .effect({
      type: 'stat_modifier',
      stat: 'biq',
      value: 2,
      timing: 'immediate',
      target: 'self',
      conditions: [{ type: 'pvp_win_count', winCount: 4, winCountOperator: '>=' }],
      triggerOnce: true
    })
    .effect({
      type: 'stat_modifier',
      stat: 'ma',
      value: 2,
      timing: 'immediate',
      target: 'self',
      conditions: [{ type: 'pvp_win_count', winCount: 4, winCountOperator: '>=' }],
      triggerOnce: true
    })
    .register();

  // Redemption (Shael + Zod)
  defineEffect('runeword', 'Redemption')
    .description('Khi ở nhánh thua: Nhận 1 điểm combat khởi đầu. Khi ở chung kết tổng: Nhận +1 all stats.')
    .effect({
      type: 'combat_points',
      points: 1,
      timing: 'before_combat',
      target: 'self',
      conditions: [{ type: 'bracket', bracket: 'loser' }]
    })
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'immediate',
      target: 'self',
      conditions: [{ type: 'bracket', bracket: 'finals' }]
    })
    .register();

  // Flawless (Amn + Shael)
  defineEffect('runeword', 'Flawless')
    .description('Nhận +1 Speed và +1 IQ. Sau combat: Nếu đối phương không ghi được điểm nào, nhận +1 all stats.')
    .addStat('speed', 1)
    .addStat('iq', 1)
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'after_combat',
      target: 'self',
      customHandler: 'flawless_perfect_win'
    })
    .register();

  // Death's Dance (Tal + Shael)
  defineEffect('runeword', "Death's Dance")
    .description('3 chỉ số IQ, BIQ và MA của bạn được cố định là 12. 3 chỉ số Strength, Speed, Dura của bạn được cố định là 0. Sau mỗi combat phải quyết định bằng tie-break: Nhận +3 vào chỉ số cố định của Strength, Speed và Dura. (0->3->6->9->12)')
    .effect({
      type: 'stat_set',
      stat: 'iq',
      value: 12,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'stat_set',
      stat: 'biq',
      value: 12,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'stat_set',
      stat: 'ma',
      value: 12,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'stat_set',
      stat: 'strength',
      value: 0,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'stat_set',
      stat: 'speed',
      value: 0,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'stat_set',
      stat: 'durability',
      value: 0,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'deaths_dance_tiebreak_bonus'
    })
    .register();

  // Undying Rage (El + Sol)
  defineEffect('runeword', 'Undying Rage')
    .description('Trong combat: Mỗi khi có 1 round thua, chỉ số của round kế tiếp sẽ nhận +3.')
    .effect({
      type: 'stat_modifier',
      stat: 'random', // Next round stat
      value: 3,
      timing: 'on_round_lose',
      target: 'self',
      duration: 'round',
      customHandler: 'undying_rage_boost'
    })
    .register();

  // Cure (Thul + Zod)
  defineEffect('runeword', 'Cure')
    .description('Trong combat: Toàn bộ "Debuff" của đối phương bị vô hiệu hóa. Với mỗi "Debuff" bị vô hiệu hóa, nhận +1 vào chỉ số thấp nhất.')
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'cure_counter_debuff'
    })
    .register();

  // Adventurous (Ral + Amn)
  defineEffect('runeword', 'Adventurous')
    .description('[PVE Only] Trong combat: Nhận +1 điểm khởi đầu. Khi Raid Boss thành công, nhận thêm 1 phần thưởng PvP Rewards.')
    .effect({
      type: 'combat_points',
      points: 1,
      timing: 'pve_only',
      target: 'self'
    })
    .effect({
      type: 'custom',
      timing: 'after_combat_win',
      target: 'self',
      customHandler: 'adventurous_raid_reward'
    })
    .register();

  // Resonance (Ith + Ral)
  defineEffect('runeword', 'Resonance')
    .description('Với mỗi hiệu ứng "Buff" có trên bản thân, nhận +1 vào chỉ số thấp nhất, chỉ tác dụng 1 lần lúc nhận Runeword này.')
    .effect({
      type: 'stat_modifier',
      stat: 'lowest',
      value: 1, // Multiplied by buff count in handler
      timing: 'immediate',
      target: 'self',
      triggerOnce: true,
      customHandler: 'resonance_buff_count'
    })
    .register();
}

// ============================================================================
// ROTATION RUNEWORDS (from right side of sheet)
// ============================================================================

export function registerRotationRunewords() {
  // Kinetics
  defineEffect('runeword', 'Kinetics')
    .description('Trước Combat: Strength được cộng một lượng bằng phân nửa Base Speed.')
    .effect({
      type: 'stat_modifier',
      stat: 'strength',
      value: 0, // Calculated dynamically
      timing: 'before_combat',
      target: 'self',
      customHandler: 'kinetics_speed_to_str'
    })
    .register();

  // Belligerence
  defineEffect('runeword', 'Belligerence')
    .description('Mỗi Round thắng +1 Điểm, mỗi round thua mất toàn bộ điểm.')
    .effect({
      type: 'extra_point_on_win',
      points: 1,
      timing: 'on_round_win',
      target: 'self'
    })
    .effect({
      type: 'lose_points_on_lose',
      points: -999,
      timing: 'on_round_lose',
      target: 'self'
    })
    .register();

  // Constitution
  defineEffect('runeword', 'Constitution')
    .description('Sau Combat: Với mỗi Round thắng, +1 Strength.')
    .effect({
      type: 'stat_modifier',
      stat: 'strength',
      value: 1, // Per round won
      timing: 'after_combat',
      target: 'self',
      customHandler: 'constitution_str_per_win'
    })
    .register();

  // Sagacity
  defineEffect('runeword', 'Sagacity')
    .description('Trong Combat: Thắng round Speed sẽ khiến IQ được +2.')
    .effect({
      type: 'stat_modifier',
      stat: 'iq',
      value: 2,
      timing: 'during_combat',
      target: 'self',
      customHandler: 'sagacity_speed_to_iq'
    })
    .register();

  // Momentum
  defineEffect('runeword', 'Momentum')
    .description('Nếu Speed gấp đôi đối thủ, mặc định thắng round Speed.')
    .effect({
      type: 'auto_win_round',
      stat: 'speed',
      timing: 'during_combat',
      target: 'self',
      conditions: [{
        type: 'stat_compare',
        stat: 'speed',
        compareWith: 'opponent',
        operator: '>='
        // Custom handler will check for 2x
      }],
      customHandler: 'momentum_auto_win'
    })
    .register();

  // Preservation
  defineEffect('runeword', 'Preservation')
    .description('Giảm MA = 1, nhận 1 điểm khởi đầu với mỗi 5 MA bị giảm.')
    .effect({
      type: 'stat_modifier',
      stat: 'ma',
      value: -1, // Set to 1
      timing: 'before_combat',
      target: 'self',
      duration: 'combat',
      customHandler: 'preservation_ma_to_points'
    })
    .register();

  // Bastion
  defineEffect('runeword', 'Bastion')
    .description('-1 All Stat không phải Durability, +5 Durability.')
    .addStat('strength', -1)
    .addStat('speed', -1)
    .addStat('iq', -1)
    .addStat('biq', -1)
    .addStat('ma', -1)
    .addStat('durability', 5)
    .register();

  // Tenacity
  defineEffect('runeword', 'Tenacity')
    .description('Khi thắng Round lần đầu, +1 Dura và +1 BIQ trong Combat đó.')
    .effect({
      type: 'stat_modifier',
      stat: 'durability',
      value: 1,
      timing: 'on_round_win',
      target: 'self',
      triggerOnce: true,
      duration: 'combat'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'biq',
      value: 1,
      timing: 'on_round_win',
      target: 'self',
      triggerOnce: true,
      duration: 'combat'
    })
    .register();

  // Dialectics
  defineEffect('runeword', 'Dialectics')
    .description('Trong Combat: +2 IQ và +2 BIQ.')
    .effect({
      type: 'stat_modifier',
      stat: 'iq',
      value: 2,
      timing: 'during_combat',
      target: 'self'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'biq',
      value: 2,
      timing: 'during_combat',
      target: 'self'
    })
    .register();

  // Epiphany
  defineEffect('runeword', 'Epiphany')
    .description('Nếu IQ thua stat, vô hiệu hóa Power, +1 IQ với mỗi Power bị vô hiệu.')
    .effect({
      type: 'power_disable',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'epiphany_power_to_iq'
    })
    .register();

  // Metaphysics
  defineEffect('runeword', 'Metaphysics')
    .description('Sau Combat: 5% Biến Base Stat Thấp Nhất bằng Base Stat Cao Nhất của đối thủ.')
    .effect({
      type: 'stat_copy',
      stat: 'lowest',
      timing: 'after_combat',
      target: 'self',
      conditions: [{ type: 'probability', chance: 5 }],
      customHandler: 'metaphysics_copy_stat'
    })
    .register();

  // Luminescence
  defineEffect('runeword', 'Luminescence')
    .description('Sau mỗi round thắng, đối thủ có 35% bị -3 vào chỉ số round kế tiếp.')
    .effect({
      type: 'debuff',
      stat: 'random', // Next round stat
      value: -3,
      timing: 'on_round_win',
      target: 'opponent',
      conditions: [{ type: 'probability', chance: 35 }]
    })
    .register();

  // Prudence
  defineEffect('runeword', 'Prudence')
    .description('Kháng Debuff vào BIQ và IQ. Nếu Base < đối thủ, +1.')
    .effect({
      type: 'immunity',
      immuneTo: ['debuff_iq', 'debuff_biq'],
      timing: 'before_combat',
      target: 'self'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'iq',
      value: 1,
      timing: 'before_combat',
      target: 'self',
      conditions: [{
        type: 'stat_compare',
        stat: 'iq',
        compareWith: 'opponent',
        operator: '<'
      }]
    })
    .effect({
      type: 'stat_modifier',
      stat: 'biq',
      value: 1,
      timing: 'before_combat',
      target: 'self',
      conditions: [{
        type: 'stat_compare',
        stat: 'biq',
        compareWith: 'opponent',
        operator: '<'
      }]
    })
    .register();

  // Apotheosis
  defineEffect('runeword', 'Apotheosis')
    .description('Luôn thắng PvE. Khi thua round lần đầu và mất điểm, +1 điểm.')
    .effect({
      type: 'custom',
      timing: 'pve_only',
      target: 'self',
      customHandler: 'apotheosis_auto_win_pve'
    })
    .effect({
      type: 'combat_points',
      points: 1,
      timing: 'on_round_lose',
      target: 'self',
      triggerOnce: true
    })
    .register();
}

// ============================================================================
// REGISTER ALL
// ============================================================================

export function registerAllRuneEffects() {
  registerRunes();
  registerRunewords();
  registerRotationRunewords();
}
