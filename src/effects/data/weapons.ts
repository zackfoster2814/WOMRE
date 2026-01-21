/**
 * Weapon Effects Data
 *
 * Nguồn: wheelofmultiverse-ss3.xlsx - Sheet "Weapon"
 */

import { defineEffect } from '../registry';

export function registerAllWeaponEffects() {
  // ============================================================================
  // NORMAL WEAPONS (Vũ khí thường)
  // ============================================================================

  // 1. Banana Peel
  defineEffect('weapon', 'Banana Peel')
    .description('Trước Combat: -1 all stats nếu Base IQ thấp hơn đối phương, +1 all stats nếu cao hơn.')
    .weight(2.86)
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'self',
      customHandler: 'banana_peel_iq_compare'
    })
    .register();

  // 2. Broken Straight Sword
  defineEffect('weapon', 'Broken Straight Sword')
    .description('Nhận -1 all stats.')
    .weight(2.86)
    .addAllStats(-1)
    .register();

  // 3. Ukulele
  defineEffect('weapon', 'Ukulele')
    .description('Debuff: Đối thủ nhận -1 IQ và -1 BIQ.')
    .weight(2.86)
    .effect({
      type: 'debuff',
      timing: 'before_combat',
      target: 'opponent',
      stat: 'iq',
      value: -1
    })
    .effect({
      type: 'debuff',
      timing: 'before_combat',
      target: 'opponent',
      stat: 'biq',
      value: -1
    })
    .register();

  // 4. Uchigatana
  defineEffect('weapon', 'Uchigatana')
    .description('Nhận +2 BIQ và +1 Martial Arts.')
    .weight(2.86)
    .addStat('biq', 2)
    .addStat('ma', 1)
    .register();

  // 5. Kunai
  defineEffect('weapon', 'Kunai')
    .description('Nhận +2 Speed.')
    .weight(2.86)
    .addStat('speed', 2)
    .register();

  // 6. Drums
  defineEffect('weapon', 'Drums')
    .description('Sau Combat Thắng: Nhận thêm 1 PvP Rewards.')
    .weight(2.86)
    .effect({
      type: 'custom',
      timing: 'after_combat_win',
      target: 'self',
      customHandler: 'drums_extra_pvp_reward'
    })
    .register();

  // 7. Magical Staff
  defineEffect('weapon', 'Magical Staff')
    .description('Nhận +3 IQ.')
    .weight(2.86)
    .addStat('iq', 3)
    .register();

  // 8. Glass Bottle
  defineEffect('weapon', 'Glass Bottle')
    .description('+2 all stats. Sau Combat: Loại bỏ vũ khí này. Không thể khảm Rune.')
    .weight(2.86)
    .addAllStats(2)
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'glass_bottle_break'
    })
    .register();

  // 9. Wooden Sword
  defineEffect('weapon', 'Wooden Sword')
    .description('Nhận +1 Strength.')
    .weight(2.86)
    .addStat('strength', 1)
    .register();

  // 10. Cursed Pennywort
  defineEffect('weapon', 'Cursed Pennywort')
    .description('Trước Combat: 36% vô hiệu hóa 3 power ngẫu nhiên của đối thủ.')
    .weight(2.86)
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'opponent',
      conditions: [{ type: 'probability', chance: 36 }],
      customHandler: 'cursed_pennywort_disable'
    })
    .register();

  // 11. Slingshot
  defineEffect('weapon', 'Slingshot')
    .description('Nhận +1 Strength và +1 BIQ.')
    .weight(2.86)
    .addStat('strength', 1)
    .addStat('biq', 1)
    .register();

  // 12. B.F Sword
  defineEffect('weapon', 'B.F Sword')
    .description('Nhận +3 Strength.')
    .weight(2.86)
    .addStat('strength', 3)
    .register();

  // 13. Long Bow
  defineEffect('weapon', 'Long Bow')
    .description('Nhận +2 BIQ.')
    .weight(2.86)
    .addStat('biq', 2)
    .register();

  // 14. Hidden Blade
  defineEffect('weapon', 'Hidden Blade')
    .description('Nhận +1 Speed và Power Critical Strike. Assassins chắc chắn dùng được.')
    .weight(2.86)
    .addStat('speed', 1)
    .effect({
      type: 'grant_power',
      timing: 'immediate',
      target: 'self',
      grantName: 'Critical Strike'
    })
    .register();

  // 15. Summoning Scroll
  defineEffect('weapon', 'Summoning Scroll')
    .description('Trước Combat: Triệu hồi 1 Summon tạm thời.')
    .weight(2.86)
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'self',
      customHandler: 'summoning_scroll_summon'
    })
    .register();

  // 16. Nunchuck
  defineEffect('weapon', 'Nunchuck')
    .description('Nhận +3 Martial Arts.')
    .weight(2.86)
    .addStat('ma', 3)
    .register();

  // 17. Grimoire
  defineEffect('weapon', 'Grimoire')
    .description('Nhận +1 IQ.')
    .weight(2.86)
    .addStat('iq', 1)
    .register();

  // 18. Whip
  defineEffect('weapon', 'Whip')
    .description('Nhận +1 Speed và +1 MA.')
    .weight(2.86)
    .addStat('speed', 1)
    .addStat('ma', 1)
    .register();

  // 19. Halberd
  defineEffect('weapon', 'Halberd')
    .description('Nếu có >7 STR, +35% tỉ lệ dùng được. Sau Combat: Khi thắng round STR, +1 BIQ, +1 MA.')
    .weight(2.86)
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'halberd_str_win_bonus'
    })
    .register();

  // 20. Saxophone
  defineEffect('weapon', 'Saxophone')
    .description('Nhận +1 IQ và +1 BIQ.')
    .weight(2.86)
    .addStat('iq', 1)
    .addStat('biq', 1)
    .register();

  // 21. Guitar
  defineEffect('weapon', 'Guitar')
    .description('Nhận +1 Speed và +1 Strength.')
    .weight(2.86)
    .addStat('speed', 1)
    .addStat('strength', 1)
    .register();

  // 22. Flute
  defineEffect('weapon', 'Flute')
    .description('Nhận +2 BIQ.')
    .weight(2.86)
    .addStat('biq', 2)
    .register();

  // 23. Bass
  defineEffect('weapon', 'Bass')
    .description('Nhận +2 MA.')
    .weight(2.86)
    .addStat('ma', 2)
    .register();

  // 24. Long Sword
  defineEffect('weapon', 'Long Sword')
    .description('Nhận +2 Strength.')
    .weight(2.86)
    .addStat('strength', 2)
    .register();

  // 25. Caestus
  defineEffect('weapon', 'Caestus')
    .description('Sau combat: Nhận +1 MA.')
    .weight(2.86)
    .effect({
      type: 'stat_modifier',
      stat: 'ma',
      value: 1,
      timing: 'after_combat',
      target: 'self'
    })
    .register();

  // 26. War Axe
  defineEffect('weapon', 'War Axe')
    .description('Nhận +5 Strength. Sau combat: -1 Dura.')
    .weight(2.86)
    .addStat('strength', 5)
    .effect({
      type: 'stat_modifier',
      stat: 'durability',
      value: -1,
      timing: 'after_combat',
      target: 'self'
    })
    .register();

  // 27. Wand
  defineEffect('weapon', 'Wand')
    .description('Sau combat: -2 Dura và nhận 1 Power ngẫu nhiên.')
    .weight(2.86)
    .effect({
      type: 'stat_modifier',
      stat: 'durability',
      value: -2,
      timing: 'after_combat',
      target: 'self'
    })
    .effect({
      type: 'grant_power',
      timing: 'after_combat',
      target: 'self',
      grantName: 'random'
    })
    .register();

  // 28. Morningstar
  defineEffect('weapon', 'Morningstar')
    .description('+2 STR. Trong combat: +2 STR nếu đối thủ dùng vũ khí Physical.')
    .weight(2.86)
    .addStat('strength', 2)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'morningstar_physical_bonus'
    })
    .register();

  // 29. Blood Sword
  defineEffect('weapon', 'Blood Sword')
    .description('+2 SPD, +2 BIQ. Sau combat thắng: Mất 1 Power để +1 STR, +1 MA.')
    .weight(2.86)
    .addStat('speed', 2)
    .addStat('biq', 2)
    .effect({
      type: 'custom',
      timing: 'after_combat_win',
      target: 'self',
      customHandler: 'blood_sword_sacrifice'
    })
    .register();

  // 30. Rapier
  defineEffect('weapon', 'Rapier')
    .description('Nhận +1 BIQ và +1 MA.')
    .weight(2.86)
    .addStat('biq', 1)
    .addStat('ma', 1)
    .register();

  // 31. Claymore
  defineEffect('weapon', 'Claymore')
    .description('Nhận +2 Strength và +1 Speed.')
    .weight(2.86)
    .addStat('strength', 2)
    .addStat('speed', 1)
    .register();

  // 32. Zweihänd'r
  defineEffect('weapon', "Zweihänd'r")
    .description('Nhận +4 Strength và -2 Speed.')
    .weight(2.86)
    .addStat('strength', 4)
    .addStat('speed', -2)
    .register();

  // 33. Astrologer's Staff
  defineEffect('weapon', "Astrologer's Staff")
    .description('Trong Combat: Khi Power "Trong Combat" kích hoạt lần đầu, +1 BIQ.')
    .weight(2.86)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'astrologer_staff_power_trigger'
    })
    .register();

  // 34. Backhand Blade
  defineEffect('weapon', 'Backhand Blade')
    .description('Nhận +2 Speed và +1 MA.')
    .weight(2.86)
    .addStat('speed', 2)
    .addStat('ma', 1)
    .register();

  // 35. Clawmark Seal
  defineEffect('weapon', 'Clawmark Seal')
    .description('Nhận +2 Dura và +1 BIQ.')
    .weight(2.86)
    .addStat('durability', 2)
    .addStat('biq', 1)
    .register();

  // ============================================================================
  // UNIQUE WEAPONS (Vũ khí Unique)
  // ============================================================================

  // 1. Infinity Edge
  defineEffect('weapon', 'Infinity Edge')
    .description('+3 STR và Power Critical Strike. Trong Combat: Mỗi khi crit, +1 điểm.')
    .weight(2.94)
    .addStat('strength', 3)
    .effect({
      type: 'grant_power',
      timing: 'immediate',
      target: 'self',
      grantName: 'Critical Strike'
    })
    .register();

  // 2. Blade of Chaos
  defineEffect('weapon', 'Blade of Chaos')
    .description('+4 STR, +4 MA. Trong Combat: Gấp đôi nếu đối thủ là God.')
    .weight(2.94)
    .addStat('strength', 4)
    .addStat('ma', 4)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'blade_of_chaos_god_bonus'
    })
    .register();

  // 3. River of Blood (Owned)
  defineEffect('weapon', 'River of Blood')
    .description('Nhận +3 Speed, +2 BIQ và +2 MA.')
    .weight(2.94)
    .addStat('speed', 3)
    .addStat('biq', 2)
    .addStat('ma', 2)
    .register();

  // 4. Staff of Moses
  defineEffect('weapon', 'Staff of Moses')
    .description('Sau Combat: Nhận 1 power ngẫu nhiên.')
    .weight(2.94)
    .effect({
      type: 'grant_power',
      timing: 'after_combat',
      target: 'self',
      grantName: 'random'
    })
    .register();

  // 5. Staff of Homa
  defineEffect('weapon', 'Staff of Homa')
    .description('Nhận +1 all stats và 1 power ngẫu nhiên.')
    .weight(2.94)
    .addAllStats(1)
    .effect({
      type: 'grant_power',
      timing: 'immediate',
      target: 'self',
      grantName: 'random'
    })
    .register();

  // 6. Frostmourne (Owned)
  defineEffect('weapon', 'Frostmourne')
    .description('Sau Combat: +1 random stat và nhận 1 power từ đối thủ.')
    .weight(2.94)
    .effect({
      type: 'stat_modifier',
      stat: 'random',
      value: 1,
      timing: 'after_combat',
      target: 'self'
    })
    .effect({
      type: 'steal_power',
      timing: 'after_combat',
      target: 'opponent'
    })
    .register();

  // 7. Death's Scythe (Owned)
  defineEffect('weapon', "Death's Scythe")
    .description('Debuff: Đối thủ -0 all stats. +1 debuff với mỗi 51 người chết.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'opponent',
      customHandler: 'deaths_scythe_scaling_debuff'
    })
    .register();

  // 8. Excalibur
  defineEffect('weapon', 'Excalibur')
    .description('Trong Combat: Mặc định thắng round Strength. Tuyệt đối.')
    .weight(2.94)
    .effect({
      type: 'auto_win_round',
      timing: 'during_combat',
      target: 'self',
      stat: 'strength'
    })
    .register();

  // 9. Yamato Blade (Owned)
  defineEffect('weapon', 'Yamato Blade')
    .description('+2 SPD, +1 MA. Trong combat: +1 điểm khi thắng round SPD và MA.')
    .weight(2.94)
    .addStat('speed', 2)
    .addStat('ma', 1)
    .effect({
      type: 'extra_point_on_win',
      timing: 'during_combat',
      target: 'self',
      stat: 'speed'
    })
    .effect({
      type: 'extra_point_on_win',
      timing: 'during_combat',
      target: 'self',
      stat: 'ma'
    })
    .register();

  // 10. Moonlight Greatsword
  defineEffect('weapon', 'Moonlight Greatsword')
    .description('Nhận +3 Durability và +2 MA.')
    .weight(2.94)
    .addStat('durability', 3)
    .addStat('ma', 2)
    .register();

  // 11. Divine Rapier
  defineEffect('weapon', 'Divine Rapier')
    .description('+2 all stats. Debuff: Đối thủ -1 all stats. Mất khi thua.')
    .weight(2.94)
    .addAllStats(2)
    .effect({
      type: 'debuff',
      timing: 'before_combat',
      target: 'opponent',
      stat: 'all',
      value: -1
    })
    .register();

  // 12. Bloodthrist Dagger
  defineEffect('weapon', 'Bloodthrist Dagger')
    .description('Nhận Power Critical Strike. Trong Combat: +16% crit.')
    .weight(2.94)
    .effect({
      type: 'grant_power',
      timing: 'immediate',
      target: 'self',
      grantName: 'Critical Strike'
    })
    .register();

  // 13. Ruyi Jingu Bang
  defineEffect('weapon', 'Ruyi Jingu Bang')
    .description('Trước Combat: +1 all stats với mỗi 3 power. Sau Combat thắng: 72% nhận 1 Power.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'self',
      customHandler: 'ruyi_jingu_power_scaling'
    })
    .register();

  // 14. Playful Cloud
  defineEffect('weapon', 'Playful Cloud')
    .description('Trong Combat: Mặc định thắng round MA. Tuyệt đối.')
    .weight(2.94)
    .effect({
      type: 'auto_win_round',
      timing: 'during_combat',
      target: 'self',
      stat: 'ma'
    })
    .register();

  // 15. Necronomicon
  defineEffect('weapon', 'Necronomicon')
    .description('Nhận +4 IQ và +4 BIQ.')
    .weight(2.94)
    .addStat('iq', 4)
    .addStat('biq', 4)
    .register();

  // 16. Death's Web Wand
  defineEffect('weapon', "Death's Web Wand")
    .description('Sau Combat: Loại bỏ 1 Power để +1 All Stats.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'deaths_web_sacrifice'
    })
    .register();

  // 17. Mjolnir
  defineEffect('weapon', 'Mjolnir')
    .description('+5 STR, +3 SPD, +1 Dura. Sau combat thắng: +2 random. Thua: Mất vũ khí.')
    .weight(2.94)
    .addStat('strength', 5)
    .addStat('speed', 3)
    .addStat('durability', 1)
    .register();

  // 18. Shadow Killer
  defineEffect('weapon', 'Shadow Killer')
    .description('Nhận +5 Speed và Power Evasion.')
    .weight(2.94)
    .addStat('speed', 5)
    .effect({
      type: 'grant_power',
      timing: 'immediate',
      target: 'self',
      grantName: 'Evasion'
    })
    .register();

  // 19. Great Highland Bagpipe
  defineEffect('weapon', 'Great Highland Bagpipe')
    .description('+1 all stats. Trước Combat: +1 all stats nếu có nhiều power hơn đối thủ.')
    .weight(2.94)
    .addAllStats(1)
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'self',
      customHandler: 'bagpipe_power_bonus'
    })
    .register();

  // 20. Yoriichi's Black Nichirin (Owned)
  defineEffect('weapon', "Yoriichi's Black Nichirin")
    .description('Trong Combat: Mặc định thắng Demon. Khi không còn Demon, +3 all stats.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'nichirin_demon_slayer'
    })
    .register();

  // 21. Sarastro's Flute (Owned)
  defineEffect('weapon', "Sarastro's Flute")
    .description('Trước Combat: Đối thủ -1 all stats với mỗi 3 power họ có.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'opponent',
      customHandler: 'sarastro_flute_debuff'
    })
    .register();

  // 22. Two Dragons Sword (Owned)
  defineEffect('weapon', 'Two Dragons Sword')
    .description('Nhận +2 STR, +2 BIQ và 2 Power ngẫu nhiên.')
    .weight(2.94)
    .addStat('strength', 2)
    .addStat('biq', 2)
    .effect({
      type: 'grant_power',
      timing: 'immediate',
      target: 'self',
      grantName: 'random',
      grantCount: 2
    })
    .register();

  // 23. Lusat's Glintstone Staff (Owned)
  defineEffect('weapon', "Lusat's Glintstone Staff")
    .description('+4 IQ. Sau combat: Nếu thắng round IQ, nhận 1 Power.')
    .weight(2.94)
    .addStat('iq', 4)
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'lusat_iq_win_power'
    })
    .register();

  // 24. Instruments of the Sirens (Owned)
  defineEffect('weapon', 'Instruments of the Sirens')
    .description('Trong Combat: Đối thủ -1 all stats. Sau combat: +2 random stat.')
    .weight(2.94)
    .effect({
      type: 'debuff',
      timing: 'during_combat',
      target: 'opponent',
      stat: 'all',
      value: -1
    })
    .effect({
      type: 'stat_modifier',
      stat: 'random',
      value: 2,
      timing: 'after_combat',
      target: 'self'
    })
    .register();

  // 25. Chastiefol
  defineEffect('weapon', 'Chastiefol')
    .description('Trước Combat: +3 vào 2 Stat thấp nhất của đối phương.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'self',
      customHandler: 'chastiefol_lowest_stats'
    })
    .register();

  // 26. Desolator (Owned)
  defineEffect('weapon', 'Desolator')
    .description('+3 STR. Debuff: Đối thủ -3 Durability.')
    .weight(2.94)
    .addStat('strength', 3)
    .effect({
      type: 'debuff',
      timing: 'before_combat',
      target: 'opponent',
      stat: 'durability',
      value: -3
    })
    .register();

  // 27. Diamond Sword (Owned)
  defineEffect('weapon', 'Diamond Sword')
    .description('Nhận +4 Strength và +2 Speed.')
    .weight(2.94)
    .addStat('strength', 4)
    .addStat('speed', 2)
    .register();

  // 28. Saitama's Gloves
  defineEffect('weapon', "Saitama's Gloves")
    .description('+3 STR. Quay 1 stat ngẫu nhiên. Thắng stat đó +1 điểm. Nếu STR, thắng luôn.')
    .weight(2.94)
    .addStat('strength', 3)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'saitama_random_stat'
    })
    .register();

  // 29. Galeforce
  defineEffect('weapon', 'Galeforce')
    .description('Round thua đầu: đối thủ không nhận điểm. Nếu điểm đối thủ <=0: +3 random stat.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'opponent',
      triggerOnce: true,
      customHandler: 'galeforce_first_lose'
    })
    .register();

  // 30. Battlefury (Owned)
  defineEffect('weapon', 'Battlefury')
    .description('Round thua đầu: đối thủ không nhận điểm. Nếu điểm đối thủ <=0: +3 random stat.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'opponent',
      triggerOnce: true,
      customHandler: 'battlefury_first_lose'
    })
    .register();

  // 31. Dawnbreaker
  defineEffect('weapon', 'Dawnbreaker')
    .description('Sau Combat: Với mỗi 2 round chiến thắng, +2 random stat.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'dawnbreaker_round_wins'
    })
    .register();

  // 32. Moonveil
  defineEffect('weapon', 'Moonveil')
    .description('Trước Combat: +1 điểm nếu Base IQ cao hơn. +1 điểm nếu nhiều Power hơn.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'self',
      customHandler: 'moonveil_bonuses'
    })
    .register();

  // 33. Misericorde
  defineEffect('weapon', 'Misericorde')
    .description('Trong Combat: Mỗi khi thua round, 10% nhận điểm thay vì đối thủ.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      conditions: [{ type: 'probability', chance: 10 }],
      customHandler: 'misericorde_steal_point'
    })
    .register();

  // 34. Andúril (Owned)
  defineEffect('weapon', 'Andúril')
    .description('Sau Combat: Nhận Summon Wheel. Trước Combat vs evil races: +1 điểm/3 Summon.')
    .weight(2.94)
    .effect({
      type: 'wheel_grant',
      timing: 'after_combat',
      target: 'self',
      wheelType: 'summon'
    })
    .register();

  // 35. Needle
  defineEffect('weapon', 'Needle')
    .description('Trong Combat: Thắng Round có Base Stat thấp nhất của đối thủ, +2 điểm.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'needle_lowest_stat_bonus'
    })
    .register();

  // 36. 12 đôi dép
  defineEffect('weapon', '12 đôi dép')
    .description('Sau Combat thua: +3 và +6 vào 2 stat bất kì. Ở chung kết, nhận thêm 1 lần nữa.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'after_combat_lose',
      target: 'self',
      customHandler: 'twelve_sandals_bonus'
    })
    .register();

  // 37. Ruan Mei's Lute
  defineEffect('weapon', "Ruan Mei's Lute")
    .description('Trong Combat: Đối thủ -1 IQ, -1 BIQ với mỗi Quirk chung.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'opponent',
      customHandler: 'ruan_mei_shared_quirks'
    })
    .register();

  // 38. Green Dragon Crescent Blade
  defineEffect('weapon', 'Green Dragon Crescent Blade')
    .description('+3 STR. Trong combat: Round BIQ có kết quả như round STR.')
    .weight(2.94)
    .addStat('strength', 3)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'green_dragon_biq_str'
    })
    .register();

  // 39. Rhitta (Owned)
  defineEffect('weapon', 'Rhitta')
    .description('+3 STR, +2 Dura. Trong combat: 33% gấp đôi bonus stat.')
    .weight(2.94)
    .addStat('strength', 3)
    .addStat('durability', 2)
    .register();

  // 40. Hou Yi's Divine Bow
  defineEffect('weapon', "Hou Yi's Divine Bow")
    .description('Sau combat: Nhận vòng quay Hậu Nghệ. Bắn 9 mặt trời, +3 all stats.')
    .weight(2.94)
    .effect({
      type: 'wheel_grant',
      timing: 'after_combat',
      target: 'self',
      wheelType: 'hou_yi'
    })
    .register();

  // 41. Honjo Masamune
  defineEffect('weapon', 'Honjo Masamune')
    .description('+1 SPD, +1 BIQ. Trong combat: Thắng cả SPD và BIQ, +2 điểm.')
    .weight(2.94)
    .addStat('speed', 1)
    .addStat('biq', 1)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'honjo_spd_biq_bonus'
    })
    .register();

  // 42. Medusa's Head (Owned)
  defineEffect('weapon', "Medusa's Head")
    .description('-1 all stats. Trong combat: Nhận điểm thay đối thủ khi họ nhận từ hiệu ứng.')
    .weight(2.94)
    .addAllStats(-1)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'medusa_steal_effect_points'
    })
    .register();

  // 43. Giant Slayer (Owned)
  defineEffect('weapon', 'Giant Slayer')
    .description('Trong combat: +1 điểm với mỗi 4 Base Dura của đối thủ (tối đa 2).')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'giant_slayer_dura_bonus'
    })
    .register();

  // 44. Guinsoo's Rageblade
  defineEffect('weapon', "Guinsoo's Rageblade")
    .description('+2 SPD. Sau combat: +2 SPD.')
    .weight(2.94)
    .addStat('speed', 2)
    .effect({
      type: 'stat_modifier',
      stat: 'speed',
      value: 2,
      timing: 'after_combat',
      target: 'self'
    })
    .register();

  // 45. Labrys Axe
  defineEffect('weapon', 'Labrys Axe')
    .description('+2 STR, +2 MA. Sau combat thắng: PvP Reward gấp đôi.')
    .weight(2.94)
    .addStat('strength', 2)
    .addStat('ma', 2)
    .effect({
      type: 'double_reward',
      timing: 'after_combat_win',
      target: 'self'
    })
    .register();

  // 46. Flower of Fire
  defineEffect('weapon', 'Flower of Fire')
    .description('Sau combat thắng: +1 random stat với mỗi 2 Power. Sau combat thua: +2 Power.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'flower_of_fire_scaling'
    })
    .register();

  // 47. The Hex Core
  defineEffect('weapon', 'The Hex Core')
    .description('-3 all stats. Nhận 8 Power và 8 Quirk.')
    .weight(2.94)
    .addAllStats(-3)
    .effect({
      type: 'grant_power',
      timing: 'immediate',
      target: 'self',
      grantName: 'random',
      grantCount: 8
    })
    .effect({
      type: 'grant_quirk',
      timing: 'immediate',
      target: 'self',
      grantName: 'random',
      grantCount: 8
    })
    .register();

  // 48. Infinity Gauntlet
  defineEffect('weapon', 'Infinity Gauntlet')
    .description('Quay 6 người chơi nhận đá vô cực. Khi họ bị loại, nhận đá của họ.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'infinity_gauntlet_stones'
    })
    .register();

  // 49. Diffusal Blade
  defineEffect('weapon', 'Diffusal Blade')
    .description('Vô hiệu Gear/Weapon có tag Magic của đối phương.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'opponent',
      customHandler: 'diffusal_disable_magic'
    })
    .register();

  // 50. Eclipse Shotel (Owned)
  defineEffect('weapon', 'Eclipse Shotel')
    .description('Sau Combat thắng: Đối thủ -2 All Stats, chia tay Lover. Chữa AIDS, loại bỏ Femboy.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'after_combat_win',
      target: 'self',
      customHandler: 'eclipse_shotel_effects'
    })
    .register();

  // 51. Bolt of Gransax
  defineEffect('weapon', 'Bolt of Gransax')
    .description('Trong Combat: Thắng Round SPD, +2 điểm/round thay vì 1 cho phần còn lại.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'bolt_gransax_speed_bonus'
    })
    .register();
}
