/**
 * Gear Effects — Source
 *
 * Gộp từ:
 *   data/gears.ts
 *   handlers/immediate/gear-handlers.ts
 *   handlers/combat/gear-combat-handlers.ts
 */

import { defineEffect } from '../registry';
import { registerImmediateHandler } from '../handlers/registry';
import { registerCombatHandler } from '../handlers/registry';
import type { ImmediateHandlerContext, ImmediateHandlerResult } from '../handlers/types';
import type { CombatHandlerContext, CombatHandlerResult } from '../handlers/types';
import type { StatName } from '../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// GEAR EFFECT DEFINITIONS
// ============================================================================

export function registerAllGearEffects() {
  // ============================================================================
  // NORMAL GEARS (Trọng số 2174)
  // ============================================================================

  // 1. Fishing Rod
  defineEffect('gear', 'Fishing Rod')
    .description('Sau trận đấu raid boss, nhận 1 PvP Reward.')
    .weight(2174)
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'fishing_rod_pve_reward'
    })
    .register();

  // 2. Sổ tay
  defineEffect('gear', 'Sổ tay')
    .description('Sau Combat: Khi thua IQ, nhận +1 IQ.')
    .weight(2174)
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'so_tay_iq_bonus'
    })
    .register();

  // 3. Văn tế
  defineEffect('gear', 'Văn tế')
    .description('Khi bạn bị loại mà có Văn Tế trong người, Re-spin lại stat cao nhất của một người còn sống ngẫu nhiên.')
    .weight(2174)
    .effect({
      type: 'custom',
      timing: 'on_death',
      target: 'random_player',
      customHandler: 'van_te_respin_highest'
    })
    .register();

  // 4. Silver Steed
  defineEffect('gear', 'Silver Steed')
    .description('Nhận +2 Speed.')
    .weight(2174)
    .addStat('speed', 2)
    .register();

  // 5. Wooden Shield
  defineEffect('gear', 'Wooden Shield')
    .description('Nhận +2 Durability.')
    .weight(2174)
    .addStat('durability', 2)
    .register();

  // 6. Wizard Hat
  defineEffect('gear', 'Wizard Hat')
    .description('Nhận +3 IQ.')
    .weight(2174)
    .addStat('iq', 3)
    .register();

  // 7. Love Letter
  defineEffect('gear', 'Love Letter')
    .description('Nếu bạn có "Lover", nhận +1 all stats, còn không thì vô dụng.')
    .weight(2174)
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'immediate',
      target: 'self',
      conditions: [{ type: 'has_item', itemType: 'lover' }]
    })
    .register();

  // 8. Holy Symbol
  defineEffect('gear', 'Holy Symbol')
    .description('Khi combat với Demon, Vampire, Spirit, Orc, Skeleton và Goblin, đối thủ bị -2 all Stats.')
    .weight(2174)
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: -2,
      timing: 'before_combat',
      target: 'opponent',
      conditions: [{ type: 'race_match', races: ['Demon', 'Vampire', 'Spirit', 'Orc', 'Skeleton', 'Goblin'] }]
    })
    .register();

  // 9. Fingerthing
  defineEffect('gear', 'Fingerthing')
    .description('Nhận 1 Quirk.')
    .weight(2174)
    .effect({
      type: 'grant_quirk',
      grantType: 'quirk',
      grantName: 'random',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .register();

  // 10. Healing Flasks
  defineEffect('gear', 'Healing Flasks')
    .description('Nhận +3 vào Stat thấp nhất khi ở nhánh thua.')
    .weight(2174)
    .effect({
      type: 'stat_modifier',
      stat: 'lowest',
      value: 3,
      timing: 'on_loser_bracket',
      target: 'self'
    })
    .register();

  // 11. Leather Jacket
  defineEffect('gear', 'Leather Jacket')
    .description('Nhận +3 Durability.')
    .weight(2174)
    .addStat('durability', 3)
    .register();

  // 12. Baguette
  defineEffect('gear', 'Baguette')
    .description('Nhận thêm 1 Quirk. Nếu đủ bộ công cụ nấu ăn (12,13,14), nhận +2 all stats.')
    .weight(2174)
    .effect({
      type: 'grant_quirk',
      grantType: 'quirk',
      grantName: 'random',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'cooking_set_bonus'
    })
    .register();

  // 13. Frying Pan
  defineEffect('gear', 'Frying Pan')
    .description('Nhận thêm 1 Power. Nếu đủ bộ công cụ nấu ăn (12,13,14), nhận +2 all stats.')
    .weight(2174)
    .effect({
      type: 'grant_power',
      grantType: 'power',
      grantName: 'random',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'cooking_set_bonus'
    })
    .register();

  // 14. Spatula
  defineEffect('gear', 'Spatula')
    .description('Nhận thêm 1 Archetype. Nếu đủ bộ công cụ nấu ăn (12,13,14), nhận +2 all stats.')
    .weight(2174)
    .effect({
      type: 'grant_archetype',
      grantType: 'archetype',
      grantName: 'random',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'cooking_set_bonus'
    })
    .register();

  // 15. Gold Pine Resin
  defineEffect('gear', 'Gold Pine Resin')
    .description('Nhận +3 BIQ.')
    .weight(2174)
    .addStat('biq', 3)
    .register();

  // 16. Knight's Armor
  defineEffect('gear', "Knight's Armor")
    .description('Nhận -2 Speed, +3 Dura và +2 Strength.')
    .weight(2174)
    .addStat('speed', -2)
    .addStat('durability', 3)
    .addStat('strength', 2)
    .register();

  // 17. Cursed Charm
  defineEffect('gear', 'Cursed Charm')
    .description('Nhận -2 Speed.')
    .weight(2174)
    .addStat('speed', -2)
    .register();

  // 18. Đai Trinh Tiết
  defineEffect('gear', 'Đai Trinh Tiết')
    .description('Bạn không thể mất trinh và miễn nhiễm với power "AIDS". Nhận +3 Dura. (Không có tác dụng nếu bạn đã bị AIDS)')
    .weight(2174)
    .addStat('durability', 3)
    .effect({
      type: 'immunity',
      immuneTo: ['AIDS'],
      timing: 'immediate',
      target: 'self'
    })
    .register();

  // 19. Swift Boots
  defineEffect('gear', 'Swift Boots')
    .description('Nhận +2 Speed.')
    .weight(2174)
    .addStat('speed', 2)
    .register();

  // 20. Kuro's Charm
  defineEffect('gear', "Kuro's Charm")
    .description('Nhận +1 All Stat. Sau Combat Thắng: Phá hủy Gear này.')
    .weight(2174)
    .addAllStats(1)
    .effect({
      type: 'custom',
      timing: 'after_combat_win',
      target: 'self',
      customHandler: 'kuro_charm_destroy'
    })
    .register();

  // 21. Buckler
  defineEffect('gear', 'Buckler')
    .description('Nhận +1 Strength, +1 Dura.')
    .weight(2174)
    .addStat('strength', 1)
    .addStat('durability', 1)
    .register();

  // 22. Soap
  defineEffect('gear', 'Soap')
    .description('Thơm.')
    .weight(2174)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'soap_ancient_protector_synergy'
    })
    .register();

  // 23. Magical Scroll
  defineEffect('gear', 'Magical Scroll')
    .description('Nhận +1 IQ và +2 BIQ.')
    .weight(2174)
    .addStat('iq', 1)
    .addStat('biq', 2)
    .register();

  // 24. Ba hoa trắng
  defineEffect('gear', 'Ba hoa trắng')
    .description('Khi ở nhánh thua, -2 all Stats. Sau khi chiến thắng ở nhánh thua, nhận +1 all stats và loại bỏ trang bị này.')
    .weight(2174)
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: -2,
      timing: 'on_loser_bracket',
      target: 'self'
    })
    .effect({
      type: 'custom',
      timing: 'after_combat_win',
      target: 'self',
      customHandler: 'ba_hoa_trang_loser_win'
    })
    .register();

  // 25. Xương sống lưỡi
  defineEffect('gear', 'Xương sống lưỡi')
    .description('Khi vào vòng 32 nhánh thắng hoặc thua, Mất đi "Xương sống lưỡi" để nhận 1 Power.')
    .weight(2174)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'xuong_song_luoi_round_32'
    })
    .register();

  // 26. Thuốc tráng dương
  defineEffect('gear', 'Thuốc tráng dương')
    .description('(1).Nhận +4 Str và +4 Dura. (2).Sau Combat: Nhận -1 Str và -1 Dura.')
    .weight(2174)
    .addStat('strength', 4)
    .addStat('durability', 4)
    .effect({
      type: 'stat_modifier',
      stat: 'strength',
      value: -1,
      timing: 'after_combat',
      target: 'self'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'durability',
      value: -1,
      timing: 'after_combat',
      target: 'self'
    })
    .register();

  // 27. Ancient Protector
  defineEffect('gear', 'Ancient Protector')
    .description('Bạn sẽ không thể bị AIDS. (Không có tác dụng nếu bạn đã bị rồi)')
    .weight(2174)
    .effect({
      type: 'immunity',
      immuneTo: ['AIDS'],
      timing: 'immediate',
      target: 'self'
    })
    .register();

  // 28. Cuộn khăn giấy
  defineEffect('gear', 'Cuộn khăn giấy')
    .description('Nếu không có "Lover", nhận +1 Dura. Nếu có "Lover", nhận +1 Speed.')
    .weight(2174)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'cuon_khan_giay_lover_check'
    })
    .register();

  // 29. Academie Ring
  defineEffect('gear', 'Academie Ring')
    .description('Nhận +1 IQ.')
    .weight(2174)
    .addStat('iq', 1)
    .register();

  // 30. Dark Lanthorn
  defineEffect('gear', 'Dark Lanthorn')
    .description('Phát sáng trong đêm tối.')
    .weight(2174)
    .register();

  // 31. Lover's Glover
  defineEffect('gear', "Lover's Glover")
    .description('Nhận 1 "Lover".')
    .weight(2174)
    .effect({
      type: 'grant_lover',
      grantType: 'lover',
      grantName: 'random',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .register();

  // 32. Storage Room Key
  defineEffect('gear', 'Storage Room Key')
    .description('Creator tặng bạn 1 Gear khác.')
    .weight(2174)
    .effect({
      type: 'grant_gear',
      grantType: 'gear',
      grantName: 'random',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .register();

  // 33. Giấy Nợ Gia Truyền
  defineEffect('gear', 'Giấy Nợ Gia Truyền')
    .description('Sau Combat: (1).Nếu bạn không kiếm đủ 4 điểm. Toàn bộ Gear và Weapon của bạn sẽ biến mất và chuyển Gear này sang 1 người ngẫu nhiên trong House. (2).Nếu bạn kiếm đủ 4 điểm trở lên, nhận 2 "Golden Coin"')
    .weight(2174)
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'giay_no_gia_truyen_debt'
    })
    .register();

  // 34. Cursed Coin
  defineEffect('gear', 'Cursed Coin')
    .description('Trong Combat: Trước trận đấu, quay một vòng quay 50/50 gồm 2 player để xem ai sẽ là người bị -1 All Stats.')
    .weight(2174)
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'both',
      customHandler: 'cursed_coin_50_50'
    })
    .register();

  // 35. Shot Glass
  defineEffect('gear', 'Shot Glass')
    .description('Một chiếc ly thủy tinh nhỏ. (Cần để uống Wine)')
    .weight(2174)
    .register();

  // 36. Empty Stein
  defineEffect('gear', 'Empty Stein')
    .description('Một cái cốc rỗng. (Cần để uống Beer)')
    .weight(2174)
    .register();

  // 37. Golden Coin
  defineEffect('gear', 'Golden Coin')
    .description('Trong Combat: Với mỗi đồng tiền Vàng trong người, có 10% mua được 1 điểm khởi đầu. Nếu có hơn 100%, mua thêm 1 điểm nữa với lượng % dư ra.')
    .weight(2174)
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'self',
      customHandler: 'golden_coin_starting_point'
    })
    .register();

  // 38. Kẹo
  defineEffect('gear', 'Kẹo')
    .description('Với mỗi 1 viên kẹo, bật 1 bài nhạc Thắng Ngọt. Nếu có cả Kẹo và Ớt, nhận +1 All Stats.')
    .weight(2174)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'keo_ot_combo'
    })
    .effect({
      type: 'custom',
      timing: 'pve_only',
      target: 'self',
      customHandler: 'keo_ot_combo'
    })
    .register();

  // 39. Ớt
  defineEffect('gear', 'Ớt')
    .description('Với mỗi 1 trái ớt, bật 1 bài nhạc Thắng Ngọt AI Cover. Nếu có cả Kẹo và Ớt, nhận +1 All Stats.')
    .weight(2174)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'keo_ot_combo'
    })
    .effect({
      type: 'custom',
      timing: 'pve_only',
      target: 'self',
      customHandler: 'keo_ot_combo'
    })
    .register();

  // 40. Mì Tôm
  defineEffect('gear', 'Mì Tôm')
    .description('Trước Combat: Nhận +1 Dura. Nếu bạn có cả 3 Mì Tôm Bò Khô Radio, nhận Char Dev "Mang Bàn Chân Này đi Dạo".')
    .weight(2174)
    .effect({
      type: 'stat_modifier',
      stat: 'durability',
      value: 1,
      timing: 'before_combat',
      target: 'self'
    })
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'mi_tom_bo_kho_radio_combo'
    })
    .register();

  // 41. Bò Khô
  defineEffect('gear', 'Bò Khô')
    .description('Trước Combat: Nhận +1 Strength. Nếu bạn có cả 3 Mì Tôm Bò Khô Radio, nhận Char Dev "Mang Bàn Chân Này đi Dạo".')
    .weight(2174)
    .effect({
      type: 'stat_modifier',
      stat: 'strength',
      value: 1,
      timing: 'before_combat',
      target: 'self'
    })
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'mi_tom_bo_kho_radio_combo'
    })
    .register();

  // 42. Radio
  defineEffect('gear', 'Radio')
    .description('Trước Combat: Nhận +1 IQ. Nếu bạn có cả 3 Mì Tôm Bò Khô Radio, nhận Char Dev "Mang Bàn Chân Này đi Dạo".')
    .weight(2174)
    .effect({
      type: 'stat_modifier',
      stat: 'iq',
      value: 1,
      timing: 'before_combat',
      target: 'self'
    })
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'mi_tom_bo_kho_radio_combo'
    })
    .register();

  // 43. Đá
  defineEffect('gear', 'Đá')
    .description('Nhận +1 All Stat. Sau Combat thua: Nhận -3 All Stat.')
    .weight(2174)
    .addAllStats(1)
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: -3,
      timing: 'after_combat_lose',
      target: 'self'
    })
    .register();

  // 44. Beer
  defineEffect('gear', 'Beer')
    .description('(1).Bạn Cần "Empty Stein" để uống được Beer và mở khóa hiệu ứng (2). (2).Trong Combat: Cộng Tổng Debuff của đối thủ lại và áp dụng vào 1 Stat ngẫu nhiên của mình.')
    .weight(2174)
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'self',
      customHandler: 'beer_debuff_to_points'
    })
    .register();

  // 45. Wine
  defineEffect('gear', 'Wine')
    .description('(1).Bạn Cần "Shot Glass" để uống được Wine và mở khóa hiệu ứng (2). (2).Trong Combat: Cộng Tổng Debuff của mình lại và áp dụng vào 1 Stat ngẫu nhiên của đối thủ.')
    .weight(2174)
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'self',
      customHandler: 'wine_self_debuff_to_points'
    })
    .register();

  // ============================================================================
  // SPECIAL GEARS (Không có trọng số - nhận từ hiệu ứng khác)
  // ============================================================================

  // 46. Kryptonite
  defineEffect('gear', 'Kryptonite')
    .description('Là một thứ dùng phục vụ cho Combat với Superman.')
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'self',
      customHandler: 'kryptonite_vs_superman'
    })
    .register();

  // 47. Glock
  defineEffect('gear', 'Glock')
    .description('(1).Nhận +5 Speed. (2).Sau Combat: Với mỗi round thua, đối thủ nhận -2 Stat cao nhất.')
    .addStat('speed', 5)
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'opponent',
      customHandler: 'glock_round_lose_debuff'
    })
    .register();

  // 48. Baron Buff
  defineEffect('gear', 'Baron Buff')
    .description('Nhận +3 Strength, +3 Speed và +3 Dura. Sau combat thua: Mất Gear này.')
    .addStat('strength', 3)
    .addStat('speed', 3)
    .addStat('durability', 3)
    .effect({
      type: 'custom',
      timing: 'after_combat_lose',
      target: 'self',
      customHandler: 'baron_buff_destroy_on_lose'
    })
    .register();

  // 49. Leviathan's Mark
  defineEffect('gear', "Leviathan's Mark")
    .description('Sau combat thắng: Leviathan nhận -1 Stat thấp nhất.')
    .effect({
      type: 'custom',
      timing: 'after_combat_win',
      target: 'self',
      customHandler: 'leviathan_mark_debuff'
    })
    .register();

  // 50. Darkin Blade
  defineEffect('gear', 'Darkin Blade')
    .description('Trong Combat: Ở 3 Round cuối, hút 1 điểm của đối thủ nếu thắng, kích hoạt 1 lần. (Nhận tổng 2 điểm: 1 điểm từ thắng 1 điểm từ hút, đối thủ bị trừ 1 điểm vì bị hút.)')
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'darkin_blade_point_steal',
      triggerOnce: true
    })
    .register();

  // 51. Stellaron Hunter's Member Card
  defineEffect('gear', "Stellaron Hunter's Member Card")
    .description('Mỗi tấm thẻ thành viên Stellaron sẽ được kí bởi 1 trong 5 thành viên chủ chốt của Stellaron Hunters. Người sở hữu tấm thẻ này sẽ nhận hiệu ứng tương ứng với chữ kí nhận được. (1) Kafka: Sau Combat Thắng: Nhận thêm 1 Power với mỗi 3 điểm ghi được. (Tối đa 3 Power) (2) Blade: Sau Combat: Nhận -1 Dura. Nhận +2 Strength, +1 BIQ và +1 MA. (3) Silver Wolf: Sau combat: Cướp ngẫu nhiên 1 Gear từ một người chơi còn sống và nhận +1 IQ. (4) Firefly: Trong combat: Khi chiến thắng 2 round liên tiếp. Đối thủ sẽ bị nhận Debuff: -6 vào stat ở round tiếp theo. (Kích hoạt 1 lần mỗi combat). (5) Elio: Sau mỗi 2 combat: Nhận 1 "Creator\'s Favor".')
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'stellaron_hunter_card'
    })
    // Kafka: after_combat_win — power per 3 points
    .effect({
      type: 'custom',
      timing: 'after_combat_win',
      target: 'self',
      customHandler: 'stellaron_kafka_power',
      conditions: [{ type: 'metadata_match', key: 'stellaronMember', value: 'Kafka' }]
    })
    // Silver Wolf: after_combat — steal gear + +1 IQ
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'stellaron_silver_wolf_steal',
      conditions: [{ type: 'metadata_match', key: 'stellaronMember', value: 'Silver Wolf' }]
    })
    // Firefly: during_combat — -6 stat on 2 consecutive round wins
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'stellaron_firefly_streak',
      conditions: [{ type: 'metadata_match', key: 'stellaronMember', value: 'Firefly' }]
    })
    // Elio: after_combat — Creator's Favor every 2 combats
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'stellaron_elio_favor',
      conditions: [{ type: 'metadata_match', key: 'stellaronMember', value: 'Elio' }]
    })
    .register();

  // 52. Khung hình thờ
  defineEffect('gear', 'Khung hình thờ')
    .description('Nhận -4 vào Stats cao nhất. Khi bị loại, chuyển gear này cho người thắng. Khi hai người có Khung Hình Thờ combat, loại bỏ hiệu ứng của cả hai và loại bỏ gear sau trận đấu.')
    .effect({
      type: 'stat_modifier',
      stat: 'highest',
      value: -4,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'custom',
      timing: 'on_death',
      target: 'self',
      customHandler: 'khung_hinh_tho_transfer'
    })
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'khung_hinh_tho_mirror'
    })
    .register();

  // ============================================================================
  // HOUSE FEATURE GEARS
  // ============================================================================

  // Trứng Rồng (House Targaryen)
  defineEffect('gear', 'Trứng Rồng')
    .description('Trứng rồng sẽ nở ở vòng 16.')
    .effect({
      type: 'grant_wheel',
      wheelName: 'Dragon Wheel',
      timing: 'on_round_16',
      target: 'self'
    })
    .register();

  // ============================================================================
  // LEGACY GEARS (Di Sản của Gia Tộc - Loại bỏ sau khi có người lấy)
  // ============================================================================

  // === Legacy Gears có trọng số (trong vòng quay) ===

  // 1. Soul Sucker
  defineEffect('gear', 'Soul Sucker')
    .description('Đối thủ bị Re-spin Stat cao nhất sau trận đấu (Bất kể mình thắng hay thua).')
    .weight(9.09)
    .tier(1) // Legacy tier
    .effect({
      type: 'stat_respin',
      stat: 'highest',
      timing: 'after_combat',
      target: 'opponent'
    })
    .register();

  // 2. Soul of the Lazy Spirit
  defineEffect('gear', 'Soul of the Lazy Spirit')
    .description('3 chỉ số ngẫu nhiên của bạn sẽ bị Inversion.')
    .weight(9.09)
    .tier(1)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'lazy_spirit_inversion'
    })
    .register();

  // 3. Almighty Vampire's Blood
  defineEffect('gear', "Almighty Vampire's Blood")
    .description('Sau combat: Nhận 1 Power ngẫu nhiên.')
    .weight(9.09)
    .tier(1)
    .effect({
      type: 'grant_power',
      grantType: 'power',
      grantName: 'random',
      grantCount: 1,
      timing: 'after_combat',
      target: 'self'
    })
    .register();

  // 4. King Gnome's Banana
  defineEffect('gear', "King Gnome's Banana")
    .description('Trong combat: Nhận -2 all stats nếu có IQ thấp hơn đối phương. Nhận +2 all stats nếu có IQ cao hơn.')
    .weight(9.09)
    .tier(1)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'king_gnome_banana_iq_compare'
    })
    .register();

  // 5. Human NPC's Axe
  defineEffect('gear', "Human NPC's Axe")
    .description('Nhận 1 Power. Nhận +1 vào stat cao nhất. Nhận +2 all stat khi bạn là NPC.')
    .weight(9.09)
    .tier(1)
    .effect({
      type: 'grant_power',
      grantType: 'power',
      grantName: 'random',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'highest',
      value: 1,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'human_npc_axe_bonus'
    })
    .register();

  // 6. God of War's Entry Ticket
  defineEffect('gear', "God of War's Entry Ticket")
    .description('Biến Base Strength thành 10. "Make love" với 1 tộc. Nhận +2 stat thấp nhất khi đối đầu với Demi God/God.')
    .weight(9.09)
    .tier(1)
    .effect({
      type: 'stat_set',
      stat: 'strength',
      value: 10,
      isBase: true,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'god_of_war_make_love_race'
    })
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'god_of_war_demi_god_bonus'
    })
    .register();

  // 7. The First Dragon Scale
  defineEffect('gear', 'The First Dragon Scale')
    .description('Nhận +4 vào Stat thấp nhất. +1 all Stat khi đối đầu với chủng tộc thấp kém hơn.')
    .weight(9.09)
    .tier(1)
    .effect({
      type: 'stat_modifier',
      stat: 'lowest',
      value: 4,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'during_combat',
      target: 'self',
      conditions: [{ type: 'race_tier_compare', tierOperator: '>' }]
    })
    .register();

  // 8. Honored Goblin's Scroll
  defineEffect('gear', "Honored Goblin's Scroll")
    .description('Debuff: Đối thủ -1 all stats. Bạn sẽ đánh hộ cho người đầu tiên thua trận ở 3 vòng đầu.')
    .weight(9.09)
    .tier(1)
    .effect({
      type: 'debuff',
      stat: 'all',
      value: -1,
      timing: 'during_combat',
      target: 'opponent'
    })
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'honored_goblin_substitute'
    })
    .register();

  // 9. Creator's Cat Ring
  defineEffect('gear', "Creator's Cat Ring")
    .description("Nhận Creator's Favor 1-3 lần.")
    .weight(9.09)
    .tier(1)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'creator_cat_ring_favor'
    })
    .effect({
      type: 'custom',
      timing: 'pve_only',
      target: 'self',
      customHandler: 'creator_cat_ring_favor'
    })
    .register();

  // 10. The Dice of the Dead
  defineEffect('gear', 'The Dice of the Dead')
    .description('Nhận Archetype "Gambler". Mặc định thắng tất cả các trận đấu khi đối đầu với những người chơi có Archetype này. (Hiệu ứng này yếu hơn tất cả các hiệu ứng tự động thắng khác). Sau combat thắng: Tăng khả năng chiến thắng gamble thêm 4% (Stack)')
    .weight(9.09)
    .tier(1)
    .effect({
      type: 'grant_archetype',
      grantType: 'archetype',
      grantName: 'Gambler',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'self',
      customHandler: 'dice_of_dead_auto_win'
    })
    .effect({
      type: 'custom',
      timing: 'after_combat_win',
      target: 'self',
      customHandler: 'dice_of_dead_gamble_stack'
    })
    .register();

  // 11. Weakest Angel's Will
  defineEffect('gear', "Weakest Angel's Will")
    .description('Nhận 2 Power với mỗi Stats có Base = 1.')
    .weight(9.09)
    .tier(1)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'weakest_angel_power_per_base_1'
    })
    .register();

  // === Legacy Gears đã có chủ (không có trọng số - đã bị lấy) ===

  // The Ancient Ladder
  defineEffect('gear', 'The Ancient Ladder: A Journey to the Fullness of Sin with Demon')
    .description('Gấp đôi hiệu ứng Sin nếu là Demon. Nhận +1 Speed, +1 IQ và +1 MA.')
    .tier(1)
    .addStat('speed', 1)
    .addStat('iq', 1)
    .addStat('ma', 1)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'ancient_ladder_demon_sin'
    })
    .register();

  // Book of a small dog
  defineEffect('gear', 'Book of a small dog')
    .description('Sau trận thắng đầu tiên, bạn sẽ "Isekai". Sau đó đưa Legacy này về vòng quay.')
    .tier(1)
    .effect({
      type: 'custom',
      timing: 'after_combat_win',
      target: 'self',
      triggerOnce: true,
      customHandler: 'book_small_dog_isekai'
    })
    .register();

  // The Angel's Finger Bone
  defineEffect('gear', "The Angel's Finger Bone")
    .description('Đảo ngược tất cả base stat. Sau đó nhận +2 IQ và 1 Power.')
    .tier(1)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'angel_finger_bone_invert'
    })
    .addStat('iq', 2)
    .effect({
      type: 'grant_power',
      grantType: 'power',
      grantName: 'random',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .register();

  // The Tamer Straight Sword
  defineEffect('gear', 'The Tamer Straight Sword')
    .description('Nhận 1 Summon. Sau Combat: Đánh cắp 1 Power ngẫu nhiên của đối thủ sau khi chiến thắng.')
    .tier(1)
    .effect({
      type: 'grant_summon',
      grantType: 'summon',
      grantName: 'random',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'steal_power',
      timing: 'after_combat_win',
      target: 'self'
    })
    .register();

  // Ragnarok's Cobra
  defineEffect('gear', "Ragnarok's Cobra")
    .description('Người sở hữu con rắn này giết 1 vị thần ngẫu nhiên sau khi quay đủ player và tính đó là 1 trận thắng, sau đó tự động thua ở vòng 64 (1 lần).')
    .tier(1)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'ragnarok_cobra_kill_god'
    })
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'self',
      customHandler: 'ragnarok_cobra_auto_lose_r64',
      triggerOnce: true
    })
    .register();

  // Yamakunson's Wanted Poster
  defineEffect('gear', "Yamakunson's Wanted Poster")
    .description('Quay ngẫu nhiên 1 người chơi còn sống, khi người chơi đó chết bạn nhận 36k tiền thưởng cuối mùa và quay thêm 1 người chơi mới cho hiệu ứng này. (Hiệu ứng quay thêm người chơi mới sẽ áp dụng tối đa 1 lần mỗi vòng đấu)')
    .tier(1)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'yamakunson_bounty'
    })
    .register();

  // Cursed Gnome's Doll
  defineEffect('gear', "Cursed Gnome's Doll")
    .description('Bạn miễn nhiễm với tất cả hiệu ứng quay lại chỉ số.')
    .tier(1)
    .effect({
      type: 'immunity',
      immuneTo: ['respin', 'stat_respin'],
      timing: 'immediate',
      target: 'self'
    })
    .register();

  // Skull of the Balance Dragon
  defineEffect('gear', 'Skull of the Balance Dragon')
    .description('Sau combat: Khi thắng tie-break, nhận +1 all stats.')
    .tier(1)
    .effect({
      type: 'custom',
      timing: 'after_combat_win',
      target: 'self',
      customHandler: 'skull_balance_dragon_tiebreak'
    })
    .register();

  // Staff of the Fallen One
  defineEffect('gear', 'Staff of the Fallen One')
    .description('Sau combat: Có 50% mất 1 Quirk để nhận 1 Power và 50% mất 1 Power để nhận 1 Quirk.')
    .tier(1)
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'staff_fallen_one_swap'
    })
    .register();

  // Spirit of the Wheel
  defineEffect('gear', 'Spirit of the Wheel')
    .description('Trận đầu tiên của bạn khi biết kết quả sẽ khiến 3 người ngẫu nhiên "Isekai", trận tiếp theo của bạn sẽ thua. "Người ta đã đồn, Linh hồn của Vòng Quay không bao giờ hứng thú với chiến thắng, nó muốn tìm ra người nắm lấy Vinh Kwan"')
    .tier(1)
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      triggerOnce: true,
      customHandler: 'spirit_wheel_isekai_3'
    })
    .register();

  // Lockalock Skill Book
  defineEffect('gear', 'Lockalock Skill Book')
    .description('Nhận 3 Power "Mewing", "Gotta go Fast" và "The Coast is Clear!".')
    .tier(1)
    .effect({
      type: 'grant_power',
      grantType: 'power',
      grantName: 'Mewing',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'grant_power',
      grantType: 'power',
      grantName: 'Gotta go Fast',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'grant_power',
      grantType: 'power',
      grantName: 'The Coast is Clear!',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .register();

  // ============================================================================
  // INFINITY STONES (Legacy Gear - từ Infinity Gauntlet)
  // ============================================================================

  // Power Stone - +3 Strength
  defineEffect('gear', 'Power Stone')
    .description('+3 Strength. Khi bị loại, đá trở về Infinity Gauntlet.')
    .addStat('strength', 3)
    .register();

  // Space Stone - +3 Speed
  defineEffect('gear', 'Space Stone')
    .description('+3 Speed. Khi bị loại, đá trở về Infinity Gauntlet.')
    .addStat('speed', 3)
    .register();

  // Soul Stone - +3 Durability
  defineEffect('gear', 'Soul Stone')
    .description('+3 Durability. Khi bị loại, đá trở về Infinity Gauntlet.')
    .addStat('durability', 3)
    .register();

  // Mind Stone - +3 IQ
  defineEffect('gear', 'Mind Stone')
    .description('+3 IQ. Khi bị loại, đá trở về Infinity Gauntlet.')
    .addStat('iq', 3)
    .register();

  // Time Stone - +3 BIQ
  defineEffect('gear', 'Time Stone')
    .description('+3 BIQ. Khi bị loại, đá trở về Infinity Gauntlet.')
    .addStat('biq', 3)
    .register();

  // Reality Stone - +3 MA
  defineEffect('gear', 'Reality Stone')
    .description('+3 MA. Khi bị loại, đá trở về Infinity Gauntlet.')
    .addStat('ma', 3)
    .register();

  // Shaggydog
  defineEffect('gear', 'Shaggydog')
    .description('Khi nhận Sói: Nhận +1 Stat thấp nhất. Sau mỗi Combat: Người nhà Stark nhận +1 Stat thấp nhất.')
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'shaggydog_stark_bonus'
    })
    .register();
}

// ============================================================================
// IMMEDIATE HANDLERS
// ============================================================================

/**
 * Golden Coin - Starting point bonus
 */
registerImmediateHandler(
  "golden_coin_starting_point",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat effect
    return {
      skipDefault: true,
      description: "+1 starting point (Golden Coin)",
    };
  },
  "+1 starting point",
);


// ============================================================================
// CUỘN KHĂN GIẤY (Tissue Roll)
// ============================================================================

/**
 * Cuộn khăn giấy - Conditional stat bonus based on Lover status
 * If no Lover: +1 Durability
 * If has Lover: +1 Speed
 */
registerImmediateHandler(
  "cuon_khan_giay_lover_check",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const hasLover = ctx.character.lover && ctx.character.lover.length > 0;

    if (hasLover) {
      return {
        statModifiers: [{ stat: "speed", value: 1 }],
        skipDefault: true,
        description: "+1 Speed (Cuộn khăn giấy - có Lover)",
      };
    } else {
      return {
        statModifiers: [{ stat: "durability", value: 1 }],
        skipDefault: true,
        description: "+1 Durability (Cuộn khăn giấy - không có Lover)",
      };
    }
  },
  "Conditional stat based on Lover status",
);

// ============================================================================
// KẸO + ỚT COMBO
// ============================================================================

/**
 * Kẹo + Ớt combo - If character has both Kẹo and Ớt, +1 All Stats
 */
registerImmediateHandler(
  "keo_ot_combo",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Both Kẹo and Ớt call this handler — only apply once (from Kẹo) to avoid double bonus
    // Use startsWith because source name may include annotations like "Kẹo (Từ PvE)"
    if (!ctx.source.name.startsWith("Kẹo")) {
      return { skipDefault: true };
    }

    const gear = ctx.character.gear;
    const allGear = [
      ...(gear?.normalGear || []),
      ...(gear?.legacyGear || []),
    ].filter((g) => !g.isLost);

    // Use startsWith to match gear names with annotations like "Ớt (Từ Storage Room Key)"
    const hasKeo = allGear.some((g) => g.name.startsWith("Kẹo"));
    const hasOt = allGear.some((g) => g.name.startsWith("Ớt"));

    if (hasKeo && hasOt) {
      return {
        statModifiers: STAT_NAMES.map((stat) => ({ stat, value: 1 })),
        skipDefault: true,
        description: "Kẹo + Ớt",
      };
    }

    return { skipDefault: true };
  },
  "+1 All Stats if has both Kẹo and Ớt",
);

/**
 * Creator's Cat Ring - Nhận Creator's Favor 1-3 lần, mỗi lần +1 all stats
 * Reads subEffects from gear data (parsed from "-> +1 all stats" lines)
 */
registerImmediateHandler(
  'creator_cat_ring_favor',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const gear = ctx.character.gear;
    const allGear = [
      ...(gear?.normalGear || []),
      ...(gear?.legacyGear || []),
    ].filter((g) => !g.isLost);

    const ring = allGear.find((g) => g.name.startsWith("Creator's Cat Ring"));
    if (!ring) return { skipDefault: true };

    // Count "+1 all stats" sub-effects
    const favorCount = ring.subEffects?.filter((e) =>
      e.toLowerCase().includes('+1 all stats')
    ).length || 0;

    if (favorCount > 0) {
      return {
        statModifiers: STAT_NAMES.map((stat) => ({ stat, value: favorCount })),
        skipDefault: true,
        description: `Creator's Favor x${favorCount}`,
      };
    }

    return { skipDefault: true };
  },
  "Creator's Cat Ring: +1 All Stats per Creator's Favor"
);

// ============================================================================
// COOKING SET COMBO (Baguette + Frying Pan + Spatula)
// ============================================================================

/**
 * Cooking Set Bonus - If character has all 3: Baguette, Frying Pan, Spatula → +2 all stats
 */
registerImmediateHandler(
  "cooking_set_bonus",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Only apply once (from Baguette) to avoid triple bonus
    if (!ctx.source.name.startsWith("Baguette")) {
      return { skipDefault: true };
    }

    const gear = ctx.character.gear;
    const allGear = [
      ...(gear?.normalGear || []),
      ...(gear?.legacyGear || []),
    ].filter((g) => !g.isLost);

    const hasBaguette = allGear.some((g) => g.name.startsWith("Baguette"));
    const hasFryingPan = allGear.some((g) => g.name.startsWith("Frying Pan"));
    const hasSpatula = allGear.some((g) => g.name.startsWith("Spatula"));

    if (hasBaguette && hasFryingPan && hasSpatula) {
      return {
        statModifiers: STAT_NAMES.map((stat) => ({ stat, value: 2 })),
        skipDefault: true,
        description: "Bộ Nấu Ăn (Baguette + Frying Pan + Spatula): +2 all stats",
      };
    }

    return { skipDefault: true };
  },
  "+2 All Stats if has Baguette + Frying Pan + Spatula",
);

// ============================================================================
// MÌ TÔM + BÒ KHÔ + RADIO COMBO
// ============================================================================

/**
 * Mì Tôm + Bò Khô + Radio combo - If has all 3 → grant Char Dev "Mang Bàn Chân Này đi Dạo"
 */
registerImmediateHandler(
  "mi_tom_bo_kho_radio_combo",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Only apply once (from Mì Tôm)
    if (!ctx.source.name.startsWith("Mì Tôm")) {
      return { skipDefault: true };
    }

    const gear = ctx.character.gear;
    const allGear = [
      ...(gear?.normalGear || []),
      ...(gear?.legacyGear || []),
    ].filter((g) => !g.isLost);

    const hasMiTom = allGear.some((g) => g.name.startsWith("Mì Tôm"));
    const hasBoKho = allGear.some((g) => g.name.startsWith("Bò Khô"));
    const hasRadio = allGear.some((g) => g.name.startsWith("Radio"));

    if (hasMiTom && hasBoKho && hasRadio) {
      return {
        skipDefault: true,
        description: 'Mì Tôm + Bò Khô + Radio: Nhận Char Dev "Mang Bàn Chân Này đi Dạo"',
      };
    }

    return { skipDefault: true };
  },
  'Grant Char Dev "Mang Bàn Chân Này đi Dạo" if has all 3',
);

// ============================================================================
// SOAP + ANCIENT PROTECTOR SYNERGY
// ============================================================================

/**
 * Soap - Bạn sẽ không cần phải quay lại khả năng sử dụng của "Ancient Protector".
 */
registerImmediateHandler(
  "soap_ancient_protector_synergy",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Soap: Ancient Protector luôn hoạt động (không cần quay lại)',
    };
  },
  "Ancient Protector always active with Soap",
);

// ============================================================================
// XƯƠNG SỐNG LƯỠI - Round 32 Power grant
// ============================================================================

/**
 * Xương sống lưỡi - Khi vào vòng 32, mất gear → nhận 1 Power.
 */
registerImmediateHandler(
  "xuong_song_luoi_round_32",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Xương sống lưỡi: Khi vào vòng 32, mất gear để nhận 1 Power',
    };
  },
  "Sacrifice gear at round 32 for 1 Power",
);

// ============================================================================
// SOUL OF THE LAZY SPIRIT - Invert 3 random stats
// ============================================================================

/**
 * Soul of the Lazy Spirit - 3 chỉ số ngẫu nhiên bị Inversion.
 */
registerImmediateHandler(
  "lazy_spirit_inversion",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Pick 3 random stats to invert
    const shuffled = [...STAT_NAMES].sort(() => Math.random() - 0.5);
    const toInvert = shuffled.slice(0, 3);

    const mods = toInvert.map((stat) => {
      const baseVal = (ctx.baseStats as Record<StatName, number>)[stat];
      // Inversion: 11 - base (for range 1-10)
      const invertedVal = 11 - baseVal;
      return { stat, value: invertedVal - baseVal, isBase: true as const };
    });

    return {
      statModifiers: mods,
      skipDefault: true,
      description: `Soul of the Lazy Spirit: Inversion ${toInvert.join(', ')}`,
    };
  },
  "Invert 3 random base stats",
);

// ============================================================================
// HUMAN NPC'S AXE - +2 all stats if NPC
// ============================================================================

/**
 * Human NPC's Axe - +2 all stat khi bạn là NPC.
 */
registerImmediateHandler(
  "human_npc_axe_bonus",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const isNPC = (ctx.character as any).isNPC || false;
    if (isNPC) {
      return {
        statModifiers: STAT_NAMES.map((stat) => ({ stat, value: 2 })),
        skipDefault: true,
        description: "Human NPC's Axe: +2 all stats (NPC)",
      };
    }
    return { skipDefault: true };
  },
  "+2 all stats if character is NPC",
);

// ============================================================================
// GOD OF WAR'S ENTRY TICKET - Make love with 1 race
// ============================================================================

/**
 * God of War's Entry Ticket - "Make love" với 1 tộc.
 * Nhận +2 stat thấp nhất khi đối đầu tộc đó (combat handler).
 */
registerImmediateHandler(
  "god_of_war_make_love_race",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'God of War: "Make love" với 1 tộc. +2 stat thấp nhất khi đối đầu tộc đó',
    };
  },
  "Mark a race for combat bonus",
);

// ============================================================================
// HONORED GOBLIN'S SCROLL - Substitute for first loser
// ============================================================================

/**
 * Honored Goblin's Scroll - Bạn sẽ đánh hộ cho người đầu tiên thua trận ở 3 vòng đầu.
 */
registerImmediateHandler(
  "honored_goblin_substitute",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Honored Goblin's Scroll: Đánh hộ cho người thua đầu tiên ở 3 vòng đầu",
    };
  },
  "Substitute for first loser in first 3 rounds",
);

// ============================================================================
// STELLARON HUNTER'S MEMBER CARD
// ============================================================================

/**
 * Stellaron Hunter's Member Card - Kí bởi 1 trong 5 thành viên Stellaron Hunters.
 * Blade signature: nhận stat ngay khi immediate (Blade: -1 Dura, +2 Str, +1 BIQ, +1 MA)
 */
registerImmediateHandler(
  "stellaron_hunter_card",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const members = ['Kafka', 'Silver Wolf', 'Blade', 'Firefly', 'Elio'] as const;
    const member = members[Math.floor(Math.random() * members.length)];

    // Blade: immediate stat changes
    if (member === 'Blade') {
      return {
        statModifiers: [
          { stat: 'durability', value: -1 },
          { stat: 'strength', value: 2 },
          { stat: 'biq', value: 1 },
          { stat: 'ma', value: 1 },
        ],
        skipDefault: true,
        description: `Stellaron Hunter's Card: Signed by Blade → -1 Dura, +2 Str, +1 BIQ, +1 MA`,
        metadata: { stellaronMember: member as string },
      };
    }

    // Store member on the gear for combat handlers to use
    return {
      skipDefault: true,
      description: `Stellaron Hunter's Card: Signed by ${member}`,
      metadata: { stellaronMember: member as string },
    };
  },
  "Random Stellaron Hunter member signature",
);

// ============================================================================
// WEAKEST ANGEL'S WILL - Powers per base stat = 1
// ============================================================================

/**
 * Weakest Angel's Will - Nhận 2 Power với mỗi Stats có Base = 1.
 */
registerImmediateHandler(
  "weakest_angel_power_per_base_1",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    let count = 0;
    for (const stat of STAT_NAMES) {
      if ((ctx.baseStats as Record<StatName, number>)[stat] === 1) count++;
    }

    if (count > 0) {
      return {
        skipDefault: true,
        description: `Weakest Angel's Will: ${count} stat(s) có base 1 → nhận ${count * 2} Power`,
      };
    }

    return { skipDefault: true };
  },
  "Grant 2 Powers per base stat = 1",
);

// ============================================================================
// ANCIENT LADDER - Double Sin effects for Demon
// ============================================================================

/**
 * The Ancient Ladder - Gấp đôi hiệu ứng Sin nếu là Demon.
 */
registerImmediateHandler(
  "ancient_ladder_demon_sin",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const race = ctx.character.race?.race || '';
    if (race === 'Demon') {
      return {
        skipDefault: true,
        description: 'The Ancient Ladder: Gấp đôi hiệu ứng Sin (Demon)',
      };
    }
    return { skipDefault: true };
  },
  "Double Sin effects for Demon race",
);

// ============================================================================
// ANGEL'S FINGER BONE - Invert all base stats
// ============================================================================

/**
 * The Angel's Finger Bone - Đảo ngược tất cả base stat.
 */
registerImmediateHandler(
  "angel_finger_bone_invert",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const mods = STAT_NAMES.map((stat) => {
      const baseVal = (ctx.baseStats as Record<StatName, number>)[stat];
      const invertedVal = 11 - baseVal;
      return { stat, value: invertedVal - baseVal, isBase: true as const };
    });

    return {
      statModifiers: mods,
      skipDefault: true,
      description: "The Angel's Finger Bone: Đảo ngược tất cả base stats",
    };
  },
  "Invert all base stats (11 - base)",
);

// ============================================================================
// RAGNAROK'S COBRA - Kill a random God
// ============================================================================

/**
 * Ragnarok's Cobra - Giết 1 vị thần ngẫu nhiên sau khi quay đủ player.
 */
registerImmediateHandler(
  "ragnarok_cobra_kill_god",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Ragnarok's Cobra: Giết 1 vị thần ngẫu nhiên",
    };
  },
  "Kill a random God race player",
);

// ============================================================================
// YAMAKUNSON'S WANTED POSTER - Bounty on random player
// ============================================================================

/**
 * Yamakunson's Wanted Poster - Quay ngẫu nhiên 1 người, khi chết nhận 36k.
 */
registerImmediateHandler(
  "yamakunson_bounty",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Yamakunson's Wanted Poster: Quay 1 mục tiêu, khi mục tiêu chết nhận 36k",
    };
  },
  "Bounty on random player - 36k reward on death",
);

// ============================================================================
// KHUNG HÌNH THỜ - Transfer to winner on death
// ============================================================================

/**
 * Khung hình thờ - Khi bị loại, chuyển gear này cho người thắng.
 */
registerImmediateHandler(
  "khung_hinh_tho_transfer",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Khung hình thờ: Chuyển gear cho người thắng khi bị loại",
    };
  },
  "Transfer Khung hình thờ to winner on death",
);

// so_tay_iq_bonus is a COMBAT handler → see COMBAT HANDLERS section below

export function registerGearHandlers(): void {
  console.log("Gear handlers registered");
}

// ============================================================================
// COMBAT HANDLERS
// ============================================================================

// ============================================================================
// FISHING ROD - PvE Reward after raid boss
// ============================================================================

/**
 * Fishing Rod - Sau trận đấu raid boss, nhận 1 PvP Reward.
 */
registerCombatHandler(
  'fishing_rod_pve_reward',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.isPvE) {
      return {
        description: 'Fishing Rod: Nhận 1 PvP Reward sau raid boss',
      };
    }
    return { skipDefault: true };
  },
  '1 PvP Reward after PvE combat'
);

// ============================================================================
// VĂN TẾ - Re-spin highest stat of random player on death
// ============================================================================

/**
 * Văn tế - Khi bị loại, re-spin stat cao nhất của 1 người ngẫu nhiên.
 */
registerCombatHandler(
  'van_te_respin_highest',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Văn tế: Khi bị loại, re-spin stat cao nhất của 1 người còn sống ngẫu nhiên',
    };
  },
  'Re-spin highest stat of random player on death'
);

// ============================================================================
// KURO'S CHARM - Destroy after combat win
// ============================================================================

/**
 * Kuro's Charm - Sau Combat Thắng: Phá hủy Gear này.
 */
registerCombatHandler(
  'kuro_charm_destroy',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      removeGear: "Kuro's Charm",
      description: "Kuro's Charm: Phá hủy sau combat thắng",
    };
  },
  "Destroy Kuro's Charm after win"
);

// ============================================================================
// BA HOA TRẮNG - +1 all stats and remove after loser bracket win
// ============================================================================

/**
 * Ba hoa trắng - Sau khi thắng ở nhánh thua, +1 all stats và loại bỏ gear.
 * Chỉ kích hoạt khi đang ở nhánh thua (isLoserBracket).
 */
registerCombatHandler(
  'ba_hoa_trang_loser_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.isLoserBracket) {
      return { skipDefault: true };
    }
    return {
      selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
      removeGear: 'Ba hoa trắng',
      description: 'Ba hoa trắng: Thắng ở nhánh thua → +1 all stats, loại bỏ gear',
    };
  },
  '+1 all stats and remove gear after loser bracket win'
);

// ============================================================================
// GIẤY NỢ GIA TRUYỀN - Debt penalty or Golden Coin reward
// ============================================================================

/**
 * Giấy Nợ Gia Truyền:
 * - Không đủ 4 điểm → mất toàn bộ Gear/Weapon, chuyển gear sang 1 người ngẫu nhiên trong House.
 * - Đủ 4 điểm → nhận 2 Golden Coin.
 */
registerCombatHandler(
  'giay_no_gia_truyen_debt',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Spec: "không kiếm đủ 4 điểm" = score < 4 (not rounds won)
    // currentScore is injected by applyBeforeCombatEnd if timing is before_combat_end
    const score = (ctx.self as any).currentScore ?? ctx.self.roundsWon;
    if (score < 4) {
      return {
        removeAllGearAndWeapon: true,
        transferGearToRandomHouseMember: true,
        description: `Giấy Nợ Gia Truyền: Không đủ 4 điểm (${score} điểm) → mất toàn bộ Gear và Weapon, chuyển Giấy Nợ cho người ngẫu nhiên trong House`,
      };
    }
    return {
      grantGear: ['Golden Coin', 'Golden Coin'],
      description: `Giấy Nợ Gia Truyền: Đủ ${score} điểm (≥4) → nhận 2 Golden Coin`,
    };
  },
  'Lose all Gear/Weapon if score < 4; gain 2 Golden Coins if score >= 4'
);

// ============================================================================
// CURSED COIN 50/50 - Random debuff
// ============================================================================

/**
 * Cursed Coin - 50/50 quay xem ai bị -1 all stats.
 */
registerCombatHandler(
  'cursed_coin_50_50',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    // 50/50 probability decided by wheel UI in CombatEffectsPanel, not Math.random()
    // This handler is a GM reference — actual execution is manual via wheel spin
    return {
      skipDefault: true,
      description: 'Cursed Coin: 50/50 xem ai bị -1 All Stats (xác suất quyết định bởi wheel UI)',
    };
  },
  '50/50 -1 all stats to self or opponent (wheel decides who)'
);

// ============================================================================
// BEER - Opponent total debuff applied to random self stat
// ============================================================================

/**
 * Beer - Cần Empty Stein. Cộng tổng debuff của đối thủ và áp dụng vào 1 stat ngẫu nhiên của mình.
 */
registerCombatHandler(
  'beer_debuff_to_points',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const hasStein = ctx.self.gears.some(g => g === 'Empty Stein' || (g as any).name === 'Empty Stein');
    if (!hasStein) {
      return {
        description: 'Beer: Cần Empty Stein để uống',
      };
    }

    if (!ctx.opponent) return { skipDefault: true };

    // Sum all negative debuffs on opponent (sum of negative bonuses)
    const totalDebuff = ctx.opponent.totalDebuff ?? 0;
    if (totalDebuff <= 0) {
      return { description: 'Beer: Đối thủ không có debuff' };
    }

    const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      selfStatMods: [{ stat: randomStat, value: totalDebuff }],
      description: `Beer: Cộng ${totalDebuff} debuff của đối thủ vào ${randomStat} của mình`,
    };
  },
  'Sum opponent debuffs → apply to random self stat'
);

// ============================================================================
// WINE - Self total debuff applied to random opponent stat
// ============================================================================

/**
 * Wine - Cần Shot Glass. Cộng tổng debuff của mình và áp dụng vào 1 stat ngẫu nhiên của đối thủ.
 */
registerCombatHandler(
  'wine_self_debuff_to_points',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const hasGlass = ctx.self.gears.some(g => g === 'Shot Glass' || (g as any).name === 'Shot Glass');
    if (!hasGlass) {
      return {
        description: 'Wine: Cần Shot Glass để uống',
      };
    }

    if (!ctx.opponent) return { skipDefault: true };

    const totalDebuff = ctx.self.totalDebuff ?? 0;
    if (totalDebuff <= 0) {
      return { description: 'Wine: Bản thân không có debuff' };
    }

    const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      opponentStatMods: [{ stat: randomStat, value: totalDebuff }],
      description: `Wine: Cộng ${totalDebuff} debuff của mình vào ${randomStat} của đối thủ`,
    };
  },
  'Sum self debuffs → apply to random opponent stat'
);

// ============================================================================
// KRYPTONITE VS SUPERMAN
// ============================================================================

/**
 * Kryptonite - Đối đầu Superman bị -2 điểm khởi đầu.
 */
registerCombatHandler(
  'kryptonite_vs_superman',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    // Check if opponent has Superman archetype or is Superman
    const opponentArchetypes = ctx.opponent.character.archetypes || [];
    const isSuperMan = opponentArchetypes.some((a: any) =>
      a.name === 'Superman' || a.subType === 'Superman'
    );

    if (isSuperMan) {
      return {
        opponentPoints: -2,
        description: 'Kryptonite: Superman bị -2 điểm khởi đầu',
      };
    }

    return { skipDefault: true };
  },
  '-2 starting points to Superman opponent'
);

// ============================================================================
// GLOCK - After combat: -2 highest stat per round lost to opponent
// ============================================================================

/**
 * Glock - Sau Combat: Với mỗi round thua, đối thủ nhận -2 Stat cao nhất.
 */
registerCombatHandler(
  'glock_round_lose_debuff',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const roundsLost = ctx.self.roundsLost;
    if (roundsLost <= 0) return { skipDefault: true };

    // Find opponent's highest stat
    let highestStat: StatName = 'strength';
    let highestVal = (ctx.opponent.stats as Record<StatName, number>)['strength'];
    for (const stat of STAT_NAMES) {
      if ((ctx.opponent.stats as Record<StatName, number>)[stat] > highestVal) {
        highestVal = (ctx.opponent.stats as Record<StatName, number>)[stat];
        highestStat = stat;
      }
    }

    return {
      opponentStatMods: [{ stat: highestStat, value: -2 * roundsLost }],
      description: `Glock: Đối thủ -${2 * roundsLost} ${highestStat} (${roundsLost} round thua)`,
    };
  },
  '-2 highest stat per round lost to opponent'
);

// ============================================================================
// BARON BUFF - Destroy on combat loss
// ============================================================================

/**
 * Baron Buff - Sau combat thua: Mất Gear này.
 */
registerCombatHandler(
  'baron_buff_destroy_on_lose',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      removeGear: 'Baron Buff',
      description: 'Baron Buff: Mất gear sau combat thua',
    };
  },
  'Destroy Baron Buff after combat loss'
);

// ============================================================================
// LEVIATHAN'S MARK - Debuff after opponent wins
// ============================================================================

/**
 * Leviathan's Mark - Sau combat thắng: Leviathan nhận -1 Stat thấp nhất.
 */
registerCombatHandler(
  'leviathan_mark_debuff',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Find self lowest stat
    let lowestStat: StatName = 'strength';
    let lowestVal = (ctx.self.stats as Record<StatName, number>)['strength'];
    for (const stat of STAT_NAMES) {
      if ((ctx.self.stats as Record<StatName, number>)[stat] < lowestVal) {
        lowestVal = (ctx.self.stats as Record<StatName, number>)[stat];
        lowestStat = stat;
      }
    }

    return {
      selfStatMods: [{ stat: lowestStat, value: -1 }],
      description: `Leviathan's Mark: -1 ${lowestStat} sau combat thắng`,
    };
  },
  "-1 lowest stat after combat win"
);

// ============================================================================
// DARKIN BLADE - Point steal in last 3 rounds, trigger once
// ============================================================================

/**
 * Darkin Blade - Ở 3 Round cuối, nếu thắng round đó, hút 1 điểm của đối thủ. Kích hoạt 1 lần duy nhất.
 * (Nhận tổng 2 điểm: 1 từ thắng + 1 từ hút. Đối thủ mất 1 điểm.)
 */
registerCombatHandler(
  'darkin_blade_point_steal',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Only trigger in last 3 rounds (rounds totalRounds-2, totalRounds-1, totalRounds)
    if (ctx.currentRound < ctx.totalRounds - 2) {
      return { skipDefault: true };
    }
    // Won this round
    if (ctx.currentRoundResult !== 'win') {
      return { skipDefault: true };
    }
    return {
      selfPoints: 1,
      opponentPoints: -1,
      description: 'Darkin Blade: Hút 1 điểm từ đối thủ (kích hoạt 1 lần ở 3 round cuối)',
    };
  },
  'Steal 1 point once in last 3 rounds when winning that round'
);

// ============================================================================
// KING GNOME'S BANANA - IQ comparison buff/debuff
// ============================================================================

/**
 * King Gnome's Banana - +2 all stats nếu IQ cao hơn, -2 all stats nếu IQ thấp hơn.
 */
registerCombatHandler(
  'king_gnome_banana_iq_compare',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const selfIQ = (ctx.self.stats as Record<StatName, number>)['iq'];
    const oppIQ = (ctx.opponent.stats as Record<StatName, number>)['iq'];

    if (selfIQ > oppIQ) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 2 })),
        description: `King Gnome's Banana: IQ cao hơn (${selfIQ} > ${oppIQ}) → +2 all stats`,
      };
    } else if (selfIQ < oppIQ) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: -2 })),
        description: `King Gnome's Banana: IQ thấp hơn (${selfIQ} < ${oppIQ}) → -2 all stats`,
      };
    }

    return {
      description: `King Gnome's Banana: IQ bằng nhau (${selfIQ})`,
    };
  },
  '+2/-2 all stats based on IQ comparison'
);

// ============================================================================
// DICE OF THE DEAD - Auto win vs Gambler archetype (weakest auto-win)
// ============================================================================

/**
 * The Dice of the Dead - Auto win khi đối đầu người có Archetype "Gambler".
 * Hiệu ứng này yếu hơn tất cả các hiệu ứng tự động thắng khác.
 */
registerCombatHandler(
  'dice_of_dead_auto_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const oppArchetypes: any[] = (ctx.opponent.character as any).archetypes || [];
    const isGambler = oppArchetypes.some((a: any) => {
      const name = typeof a === 'string' ? a : a?.name ?? '';
      return name.toLowerCase().includes('gambler');
    });

    if (isGambler) {
      return {
        autoWin: true,
        autoWinPriority: 'weakest',
        description: 'The Dice of the Dead: Auto win vs Gambler (yếu nhất)',
      };
    }

    return { skipDefault: true };
  },
  'Auto win (weakest) against Gambler archetype opponents'
);

/**
 * The Dice of the Dead - Sau combat thắng: +4% gamble win chance (stack).
 */
registerCombatHandler(
  'dice_of_dead_gamble_stack',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const current = (ctx.self as any).gambleWinBonus ?? 0;
    return {
      updateCharacterField: { gambleWinBonus: current + 4 },
      description: `The Dice of the Dead: Gamble win chance +4% (tổng ${current + 4}%)`,
    };
  },
  '+4% gamble win chance stack after combat win'
);

// ============================================================================
// BOOK OF A SMALL DOG - Isekai after first win
// ============================================================================

/**
 * Book of a small dog - Sau trận thắng đầu tiên, bạn sẽ "Isekai".
 */
registerCombatHandler(
  'book_small_dog_isekai',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      opponentIsekai: true,
      description: 'Book of a small dog: Isekai sau trận thắng đầu tiên. Gear trở về vòng quay.',
    };
  },
  'Isekai after first combat win'
);

// ============================================================================
// SKULL OF THE BALANCE DRAGON - +1 all stats on tiebreak win
// ============================================================================

/**
 * Skull of the Balance Dragon - Khi thắng tie-break, nhận +1 all stats.
 */
registerCombatHandler(
  'skull_balance_dragon_tiebreak',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Tiebreak = won by exactly 1 point (3-2 in 6 rounds, or similar)
    const margin = ctx.self.roundsWon - ctx.self.roundsLost;
    if (margin === 1) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
        description: 'Skull of the Balance Dragon: Thắng tie-break → +1 all stats',
      };
    }
    return { skipDefault: true };
  },
  '+1 all stats on tiebreak win'
);

// ============================================================================
// STAFF OF THE FALLEN ONE - Swap Quirk/Power 50/50
// ============================================================================

/**
 * Staff of the Fallen One - 50% mất 1 Quirk → 1 Power, 50% mất 1 Power → 1 Quirk.
 */
registerCombatHandler(
  'staff_fallen_one_swap',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    // 50/50 probability decided by wheel UI in CombatEffectsPanel, not Math.random()
    // This handler is a GM reference — actual execution is manual via wheel spin
    return {
      skipDefault: true,
      description: 'Staff of the Fallen One: 50/50 swap Quirk↔Power (xác suất quyết định bởi wheel UI)',
    };
  },
  '50/50 swap Quirk↔Power after combat (wheel decides probability)'
);

// ============================================================================
// SPIRIT OF THE WHEEL - Isekai 3 random players
// ============================================================================

/**
 * Spirit of the Wheel - Trận đầu tiên, 3 người ngẫu nhiên "Isekai".
 */
registerCombatHandler(
  'spirit_wheel_isekai_3',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Spirit of the Wheel: 3 người ngẫu nhiên bị Isekai sau trận đầu',
    };
  },
  'Isekai 3 random players after first combat'
);

// ============================================================================
// SỔ TAY - +1 IQ sau khi thua round IQ
// ============================================================================

/**
 * Sổ tay - Sau Combat: Khi thua round IQ, nhận +1 IQ.
 */
registerCombatHandler(
  'so_tay_iq_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.iq === 'lose') {
      return {
        selfStatMods: [{ stat: 'iq', value: 1 }],
        description: 'Sổ tay: Thua round IQ → +1 IQ',
      };
    }
    return { skipDefault: true };
  },
  '+1 IQ after losing IQ round (Sổ tay)'
);

// ============================================================================
// KẸO + ỚT COMBO - PvE: bật nhạc Thắng Ngọt (description only)
// ============================================================================

/**
 * Kẹo/Ớt combo - pve_only: Bật nhạc Thắng Ngọt (hoặc AI Cover) trong PvE.
 * Logic ngoài game (âm nhạc), chỉ cần description.
 */
registerCombatHandler(
  'keo_ot_combo',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.isPvE) {
      return {
        description: 'Kẹo/Ớt: Bật nhạc Thắng Ngọt trong PvE (effect external)',
      };
    }
    return { skipDefault: true };
  },
  'Play Thắng Ngọt music in PvE (Kẹo/Ớt combo)'
);

// ============================================================================
// CREATOR'S CAT RING - PvE only: receive Creator's Favor 1-3x (+1 all stats each)
// ============================================================================

registerCombatHandler(
  'creator_cat_ring_favor',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.isPvE) return { skipDefault: true };
    // Random 1-3 favors
    const favorCount = Math.floor(Math.random() * 3) + 1;
    return {
      selfStatMods: STAT_NAMES.map(stat => ({ stat, value: favorCount })),
      description: `Creator's Cat Ring: [PvE] Nhận Creator's Favor x${favorCount} → +${favorCount} all stats`,
    };
  },
  "PvE: receive Creator's Favor 1-3 times (+1 all stats each) (Creator's Cat Ring)"
);

// ============================================================================
// STELLARON HUNTER'S MEMBER CARD - Per-member combat effects
// ============================================================================

/**
 * Kafka - Sau Combat Thắng: Nhận thêm 1 Power với mỗi 3 điểm ghi được. (Tối đa 3 Power)
 */
registerCombatHandler(
  'stellaron_kafka_power',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const points = ctx.self.roundsWon;
    const powerCount = Math.min(3, Math.floor(points / 3));
    if (powerCount <= 0) return { skipDefault: true };
    return {
      grantPowers: Array(powerCount).fill('random'),
      description: `Stellaron Kafka: ${points} điểm → nhận ${powerCount} Power`,
    };
  },
  'Kafka: +1 Power per 3 points (max 3) after combat win'
);

/**
 * Silver Wolf - Sau combat: Cướp ngẫu nhiên 1 Gear từ người chơi còn sống và nhận +1 IQ.
 */
registerCombatHandler(
  'stellaron_silver_wolf_steal',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      stealGearFromRandomLivingPlayer: true,
      selfStatMods: [{ stat: 'iq', value: 1 }],
      description: 'Stellaron Silver Wolf: Cướp 1 Gear ngẫu nhiên từ người chơi còn sống + nhận +1 IQ',
    };
  },
  'Silver Wolf: steal 1 random gear from living player + +1 IQ'
);

/**
 * Firefly - Trong combat: Khi thắng 2 round liên tiếp, đối thủ bị -6 stat ở round tiếp theo. (1 lần/combat)
 */
registerCombatHandler(
  'stellaron_firefly_streak',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const streak = (ctx.self as any).consecutiveRoundWins ?? 0;
    if (streak >= 2) {
      const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
      return {
        opponentStatMods: [{ stat: randomStat, value: -6 }],
        description: `Stellaron Firefly: Thắng 2 round liên tiếp → đối thủ -6 ${randomStat} round tiếp theo`,
      };
    }
    return { skipDefault: true };
  },
  'Firefly: -6 random stat to opponent after 2 consecutive round wins (once per combat)'
);

/**
 * Elio - Sau mỗi 2 combat: Nhận 1 Creator's Favor.
 */
registerCombatHandler(
  'stellaron_elio_favor',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const combatCount = ((ctx.self as any).totalCombats ?? 0) + 1;
    if (combatCount % 2 === 0) {
      return {
        grantCreatorFavor: 1,
        description: `Stellaron Elio: Combat thứ ${combatCount} → nhận 1 Creator's Favor`,
      };
    }
    return { skipDefault: true };
  },
  "Elio: +1 Creator's Favor every 2 combats"
);

// ============================================================================
// KHUNG HÌNH THỜ - Mirror cancel when both players have it
// ============================================================================

/**
 * Khung hình thờ - Khi hai người đều có Khung Hình Thờ: loại bỏ hiệu ứng cả hai, xóa gear sau trận.
 */
registerCombatHandler(
  'khung_hinh_tho_mirror',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const oppGears: any[] = (ctx.opponent.character as any).gear?.normalGear ?? [];
    const oppHasKhung = oppGears.some((g: any) => {
      const name = typeof g === 'string' ? g : g?.name ?? '';
      return name.startsWith('Khung hình thờ');
    });

    if (oppHasKhung) {
      return {
        cancelGearEffect: 'Khung hình thờ',
        cancelOpponentGearEffect: 'Khung hình thờ',
        removeGear: 'Khung hình thờ',
        removeOpponentGear: 'Khung hình thờ',
        description: 'Khung hình thờ: Cả hai đều có → huỷ hiệu ứng và loại bỏ gear của cả hai',
      };
    }

    return { skipDefault: true };
  },
  'Cancel both Khung hình thờ effects when both players have it'
);

// ============================================================================
// GOD OF WAR'S ENTRY TICKET - +2 lowest stat vs Demi God/God
// ============================================================================

/**
 * God of War's Entry Ticket - Nhận +2 stat thấp nhất khi đối đầu với Demi God/God.
 */
registerCombatHandler(
  'god_of_war_demi_god_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const oppRace: string = (ctx.opponent.character as any).race?.race ?? '';
    const isDemiGodOrGod = oppRace === 'Demi God' || oppRace === 'God';

    if (!isDemiGodOrGod) return { skipDefault: true };

    let lowestStat: StatName = 'strength';
    let lowestVal = (ctx.self.stats as Record<StatName, number>)['strength'];
    for (const stat of STAT_NAMES) {
      if ((ctx.self.stats as Record<StatName, number>)[stat] < lowestVal) {
        lowestVal = (ctx.self.stats as Record<StatName, number>)[stat];
        lowestStat = stat;
      }
    }

    return {
      selfStatMods: [{ stat: lowestStat, value: 2 }],
      description: `God of War: Đối đầu ${oppRace} → +2 ${lowestStat}`,
    };
  },
  '+2 lowest stat when facing Demi God or God race'
);

// ============================================================================
// RAGNAROK'S COBRA - Auto-lose at round 64 (once)
// ============================================================================

/**
 * Ragnarok's Cobra - Tự động thua ở vòng 64 (1 lần).
 * Việc "giết thần" và tính là trận thắng được xử lý ở immediate handler.
 */
registerCombatHandler(
  'ragnarok_cobra_auto_lose_r64',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // round 64 = WB-R64 hoặc LB tương đương (matchNumber 193-224)
    const matchNumber = ctx.matchNumber ?? 0;
    const isRound64 = matchNumber >= 193 && matchNumber <= 224;
    if (!isRound64) return { skipDefault: true };
    return {
      autoLose: true,
      triggerOnce: true,
      description: "Ragnarok's Cobra: Tự động thua ở vòng 64 (1 lần)",
    };
  },
  "Ragnarok's Cobra: auto-lose at WB-R64 (once)"
);

// ============================================================================
// SHAGGYDOG - +1 lowest stat after combat for Stark house members
// ============================================================================

/**
 * Shaggydog - Sau mỗi Combat: Người nhà Stark nhận +1 Stat thấp nhất.
 */
registerCombatHandler(
  'shaggydog_stark_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const house = ((ctx.self as any).character?.house || (ctx.self as any).house || '').toLowerCase();
    if (!house.includes('stark')) return { skipDefault: true };
    const stats = ctx.self.stats;
    const STAT_KEYS: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];
    const lowestStat = STAT_KEYS.reduce((a, b) => (stats[a] ?? 0) <= (stats[b] ?? 0) ? a : b);
    return {
      selfStatMods: [{ stat: lowestStat, value: 1 }],
      description: `Shaggydog: Người nhà Stark → +1 ${lowestStat.toUpperCase()} (stat thấp nhất)`,
    };
  },
  '+1 lowest stat after combat for Stark house members (Shaggydog)'
);

export function registerGearCombatHandlers() {
  // All handlers are registered at module level via registerCombatHandler calls above.
  // This function exists to be called from the handler index for explicit initialization.
}
