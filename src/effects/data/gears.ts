/**
 * Gear Effects Data
 *
 * Nguồn: wheelofmultiverse-ss3.xlsx - Sheet "Gear"
 */

import { defineEffect } from '../registry';

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
      timing: 'during_combat',
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
    .description('Thơm. Bạn sẽ không cần phải quay lại khả năng sử dụng của "Ancient Protector".')
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
    .description('Sau Combat: (1).Nếu bạn không kiếm đủ 4 điểm, Toàn bộ Gear và Weapon của bạn sẽ biến mất và chuyển cho đối thủ.')
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
    .description('Trong Combat: Với mỗi đồng tiền Vàng trong người, có 10% mua được 1 điểm khởi đầu. Nếu có hơn 100%, quay lại từ 10%.')
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
    .description('(1).Bạn Cần "Empty Stein" để uống được Beer và mở khóa hiệu ứng (2). (2).Trong Combat: Cộng Tổng Debuff của đối thủ vào điểm khởi đầu.')
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
    .description('(1).Bạn Cần "Shot Glass" để uống được Wine và mở khóa hiệu ứng (2). (2).Trong Combat: Cộng Tổng Debuff của bản thân vào điểm khởi đầu.')
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
    .description('Là một thứ dùng phục vụ cho Combat với Superman. Đối đầu Superman bị 2 điểm khởi đầu.')
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
    .description('Trong Combat: Ở 3 Round cuối, hút 1 điểm của đối thủ nếu thắng, kích hoạt 1 lần. (Nhận tổng 2 điểm)')
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'darkin_blade_point_steal'
    })
    .register();

  // 51. Stellaron Hunter's Member Card
  defineEffect('gear', "Stellaron Hunter's Member Card")
    .description('Mỗi tấm thẻ thành viên Stellaron sẽ được kí bởi 1 trong 5 thành viên chủ chốt của Stellaron Hunters.')
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'stellaron_hunter_card'
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
    .description('Biến Base Strength thành 10. "Make love" với 1 tộc. Nhận +2 stat thấp nhất khi đối đầu với tộc đó.')
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
    .register();

  // 10. The Dice of the Dead
  defineEffect('gear', 'The Dice of the Dead')
    .description('Nhận Archetype "Gambler". Mặc định thắng tất cả các trận đấu khi đối đầu với những người đã chết.')
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
    .description('Người sở hữu con rắn này giết 1 vị thần ngẫu nhiên sau khi quay đủ player và tính stat.')
    .tier(1)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'ragnarok_cobra_kill_god'
    })
    .register();

  // Yamakunson's Wanted Poster
  defineEffect('gear', "Yamakunson's Wanted Poster")
    .description('Quay ngẫu nhiên 1 người chơi còn sống, khi người chơi đó chết bạn nhận 36k tiền thưởng.')
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
    .description('Trận đầu tiên của bạn khi biết kết quả sẽ khiến 3 người ngẫu nhiên "Isekai".')
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
}
