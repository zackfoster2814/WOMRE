/**
 * Weapon Effects — Source
 *
 * Gộp từ:
 *   data/weapons.ts
 *   handlers/immediate/weapon-handlers.ts
 *   handlers/combat/weapon-combat-handlers.ts
 */

import { defineEffect } from '../registry';
import { registerImmediateHandler } from '../handlers/registry';
import { registerCombatHandler } from '../handlers/registry';
import type { ImmediateHandlerContext, ImmediateHandlerResult } from '../handlers/types';
import type { CombatHandlerContext, CombatHandlerResult } from '../handlers/types';
import type { StatName } from '../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// WEAPON EFFECT DEFINITIONS
// ============================================================================

export function registerAllWeaponEffects() {
  // ============================================================================
  // NORMAL WEAPONS (Vũ khí thường)
  // ============================================================================

  // 1. Banana Peel
  defineEffect('weapon', 'Banana Peel')
    .description('Trước Combat: Nhận -1 all stats nếu có Base IQ thấp hơn đối phương. Nhận +1 all stats nếu có Base IQ cao hơn đối phương.')
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
    .description('(1).Nhận +2 all stats. (2).Sau Combat: Loại bỏ vũ khí này. (3) Vũ khí này không thể khảm Rune.')
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
    .description('Nhận +1 Speed và Power "Critical Strike". Nếu có Archetype "Assassins", chắc chắn sử dụng được vũ khí này.')
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
    .description('(1).Nếu có trên 7 Strength, tăng tỉ lệ dùng được vũ khí này lên thêm 35% (2).Sau Combat: Khi thắng round Str, nhận +1 BIQ, +1MA')
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

  // 36. Desolator (Normal - Trước Combat debuff)
  defineEffect('weapon', 'Desolator (Normal)')
    .description('(1).Trước Combat: Nhận +3 Strength (2).Debuff: Đối thủ -3 Durability.')
    .weight(2.86)
    .effect({
      type: 'stat_modifier',
      stat: 'strength',
      value: 3,
      timing: 'before_combat',
      target: 'self'
    })
    .effect({
      type: 'debuff',
      timing: 'before_combat',
      target: 'opponent',
      stat: 'durability',
      value: -3
    })
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
    .description('(1).Nhận +2 all stats. (2).Debuff: Đối thủ nhận -1 all stats. (3).Khi thua trận người sở hữu sẽ mất vũ khí này.')
    .weight(2.94)
    .addAllStats(2)
    .effect({
      type: 'debuff',
      timing: 'before_combat',
      target: 'opponent',
      stat: 'all',
      value: -1
    })
    .effect({
      type: 'custom',
      timing: 'after_combat_lose',
      target: 'self',
      customHandler: 'divine_rapier_lose_on_loss'
    })
    .register();

  // 12. Bloodthrist Dagger
  defineEffect('weapon', 'Bloodthrist Dagger')
    .description('(1).Nhận Power "Critical Strike" (2).Trong Combat: Tăng thêm 16% tỉ lệ crit của "Critical Strike".')
    .weight(2.94)
    .effect({
      type: 'grant_power',
      timing: 'immediate',
      target: 'self',
      grantName: 'Critical Strike'
    })
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'bloodthrist_crit_bonus'
    })
    .register();

  // 13. Ruyi Jingu Bang
  defineEffect('weapon', 'Ruyi Jingu Bang')
    .description('(1).Trước Combat: Nhận +1 all stats với mỗi 3 power sở hữu. Hiệu ứng này chỉ có hiệu lực trong combat đó. (2).Sau Combat thắng: Có 72% nhận 1 Power ngẫu nhiên.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'self',
      customHandler: 'ruyi_jingu_power_scaling'
    })
    .effect({
      type: 'custom',
      timing: 'after_combat_win',
      target: 'self',
      conditions: [{ type: 'probability', chance: 72 }],
      customHandler: 'ruyi_jingu_power_chance'
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
    .description('Nhận +5 Strength, +3 Speed và +1 Dura. Sau combat thắng: Nhận +2 vào 1 chỉ số ngẫu nhiên. Sau combat thua: Mất đi vũ khí này và trả lại nó về vòng quay.')
    .weight(2.94)
    .addStat('strength', 5)
    .addStat('speed', 3)
    .addStat('durability', 1)
    .effect({
      type: 'stat_modifier',
      stat: 'random',
      value: 2,
      timing: 'after_combat_win',
      target: 'self'
    })
    .effect({
      type: 'custom',
      timing: 'after_combat_lose',
      target: 'self',
      customHandler: 'mjolnir_return_on_lose'
    })
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

  // 26. Desolator (Unique - Trong combat debuff)
  defineEffect('weapon', 'Desolator')
    .description('Nhận +3 Strength. Trong combat: Đối thủ nhận -3 Dura.')
    .weight(2.94)
    .addStat('strength', 3)
    .effect({
      type: 'debuff',
      timing: 'during_combat',
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
    .description('Nhận +3 Strength. Bắt đầu trận đấu, quay 1 chỉ số ngẫu nhiên. Khi chiến thắng chỉ số đó, nhận +1 điểm. Nếu đó là Strength, thắng luôn Combat.')
    .weight(2.94)
    .addStat('strength', 3)
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'self',
      customHandler: 'saitama_random_stat'
    })
    .register();

  // 29. Galeforce
  defineEffect('weapon', 'Galeforce')
    .description('Round đầu tiên thua trong combat đối phương sẽ không nhận điểm và không thể kích hoạt các hiệu ứng (ví dụ: Crit) Sau Combat: Nếu tổng điểm đối thủ =0 hoặc âm, nhận +3 vào 1 chỉ số ngẫu nhiên.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'on_round_lose',
      target: 'opponent',
      triggerOnce: true,
      customHandler: 'galeforce_first_lose'
    })
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'galeforce_zero_points_bonus'
    })
    .register();

  // 30. Battlefury (Owned)
  defineEffect('weapon', 'Battlefury')
    .description('(1).Trong Combat: Round thua đầu tiên sẽ khiến đối thủ sẽ không nhận được điểm và không thể kích hoạt các Feature. (2).Sau Combat: Nếu tổng điểm đối thủ bằng 0 hoặc âm, nhận +3 vào 1 chỉ số ngẫu nhiên.')
    .weight(2.94)
    .effect({
      type: 'custom',
      timing: 'on_round_lose',
      target: 'opponent',
      triggerOnce: true,
      customHandler: 'battlefury_first_lose'
    })
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'battlefury_zero_points_bonus'
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
    .description('(1).Sau Combat: Nhận Summon Wheel. (2).Trước Combat: Khi Combat với Demon, Vampire, Spirit, Orc, Skeleton và Goblin, +1 điểm khởi đầu với mỗi 3 Summon hiện có.')
    .weight(2.94)
    .effect({
      type: 'wheel_grant',
      timing: 'after_combat',
      target: 'self',
      wheelType: 'summon'
    })
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'self',
      customHandler: 'anduril_evil_race_bonus'
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
    .description('Nhận +3 Strength và +2 Dura. Trong combat: Có 33% gấp đôi hiệu ứng cộng chỉ số từ vũ khí này.')
    .weight(2.94)
    .addStat('strength', 3)
    .addStat('durability', 2)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'rhitta_double_bonus'
    })
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

  // 52. Thunder Orb
  defineEffect('weapon', 'Thunder Orb')
    .description('Debuff: Đối thủ nhận -2 Durability.')
    .weight(2.86)
    .effect({
      type: 'debuff',
      timing: 'before_combat',
      target: 'opponent',
      stat: 'durability',
      value: -2
    })
    .register();

  // 53. Ice Spike
  defineEffect('weapon', 'Ice Spike')
    .description('Debuff: Đối thủ nhận -2 Durability.')
    .weight(2.86)
    .effect({
      type: 'debuff',
      timing: 'before_combat',
      target: 'opponent',
      stat: 'durability',
      value: -2
    })
    .register();
}

// ============================================================================
// IMMEDIATE HANDLERS
// ============================================================================

// ============================================================================
// INFINITY GAUNTLET - Grant 6 Infinity Stones to random players
// ============================================================================

/**
 * Infinity Gauntlet - Quay 6 người chơi nhận đá vô cực.
 */
registerImmediateHandler(
  'infinity_gauntlet_stones',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Infinity Gauntlet: Quay 6 người chơi nhận 6 Infinity Stones. Khi bị loại, đá trở về Gauntlet.',
    };
  },
  'Distribute 6 Infinity Stones to random players'
);

// ============================================================================
// COMBAT HANDLERS
// ============================================================================

// ============================================================================
// BANANA PEEL - IQ comparison buff/debuff
// ============================================================================

/**
 * Banana Peel - Trước Combat: -1 all stats nếu Base IQ thấp hơn, +1 nếu cao hơn.
 */
registerCombatHandler(
  'banana_peel_iq_compare',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const selfBaseIQ = ctx.self.baseStats.iq;
    const oppBaseIQ = ctx.opponent.baseStats.iq;

    if (selfBaseIQ > oppBaseIQ) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
        description: `Banana Peel: Base IQ cao hơn (${selfBaseIQ} > ${oppBaseIQ}) → +1 all stats`,
      };
    } else if (selfBaseIQ < oppBaseIQ) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: -1 })),
        description: `Banana Peel: Base IQ thấp hơn (${selfBaseIQ} < ${oppBaseIQ}) → -1 all stats`,
      };
    }
    return { description: `Banana Peel: IQ bằng nhau (${selfBaseIQ}), không có hiệu ứng` };
  },
  '+1/-1 all stats based on Base IQ comparison'
);

// ============================================================================
// DRUMS - Extra PvP Reward after win
// ============================================================================

/**
 * Drums - Sau Combat Thắng: Nhận thêm 1 PvP Rewards.
 */
registerCombatHandler(
  'drums_extra_pvp_reward',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Drums: Nhận thêm 1 PvP Reward sau combat thắng',
    };
  },
  'Extra PvP Reward after win'
);

// ============================================================================
// GLASS BOTTLE - Destroy after combat
// ============================================================================

/**
 * Glass Bottle - Sau Combat: Loại bỏ vũ khí này.
 */
registerCombatHandler(
  'glass_bottle_break',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      removeWeapon: 'Glass Bottle',
      description: 'Glass Bottle: Vỡ sau combat, loại bỏ vũ khí',
    };
  },
  'Remove Glass Bottle after combat'
);

// ============================================================================
// CURSED PENNYWORT - 36% disable 3 random opponent powers
// ============================================================================

/**
 * Cursed Pennywort - Trước Combat: 36% vô hiệu hóa 3 power ngẫu nhiên của đối thủ.
 */
registerCombatHandler(
  'cursed_pennywort_disable',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    // 36% chance handled by condition in effect definition
    return {
      description: 'Cursed Pennywort: Vô hiệu hóa 3 power ngẫu nhiên của đối thủ',
    };
  },
  'Disable 3 random opponent powers (36% chance)'
);

// ============================================================================
// SUMMONING SCROLL - Summon a temporary unit
// ============================================================================

/**
 * Summoning Scroll - Trước Combat: Triệu hồi 1 Summon tạm thời.
 */
registerCombatHandler(
  'summoning_scroll_summon',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Summoning Scroll: Triệu hồi 1 Summon tạm thời',
    };
  },
  'Summon temporary unit before combat'
);

// ============================================================================
// HALBERD - +1 BIQ, +1 MA after winning STR round
// ============================================================================

/**
 * Halberd - Sau Combat: Khi thắng round STR, +1 BIQ, +1 MA.
 */
registerCombatHandler(
  'halberd_str_win_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const strResult = ctx.roundResults?.strength;
    if (strResult === 'win') {
      return {
        selfStatMods: [
          { stat: 'biq', value: 1 },
          { stat: 'ma', value: 1 },
        ],
        description: 'Halberd: Thắng round STR → +1 BIQ, +1 MA',
      };
    }
    return { description: 'Halberd: Không thắng round STR' };
  },
  '+1 BIQ +1 MA after winning STR round'
);

// ============================================================================
// MORNINGSTAR - +2 STR if opponent uses Physical weapon
// ============================================================================

/**
 * Morningstar - Trong Combat: +2 STR nếu đối thủ dùng vũ khí Physical.
 */
registerCombatHandler(
  'morningstar_physical_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const physicalWeapons = ['Sword', 'Axe', 'Hammer', 'Spear', 'Blade', 'Club', 'Dagger', 'Mace'];
    const opponentWeapons = ctx.opponent.weapons || [];
    const hasPhysical = opponentWeapons.some((w: any) =>
      physicalWeapons.some(p => (w.name || w)?.includes(p))
    );
    if (hasPhysical) {
      return {
        selfStatMods: [{ stat: 'strength', value: 2 }],
        description: 'Morningstar: Đối thủ dùng vũ khí Physical → +2 STR',
      };
    }
    return { skipDefault: true };
  },
  '+2 STR when opponent has Physical weapon'
);

// ============================================================================
// BLOOD SWORD - Sacrifice 1 Power for +1 STR +1 MA after win
// ============================================================================

/**
 * Blood Sword - Sau combat thắng: Mất 1 Power để +1 STR, +1 MA.
 */
registerCombatHandler(
  'blood_sword_sacrifice',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      selfStatMods: [
        { stat: 'strength', value: 1 },
        { stat: 'ma', value: 1 },
      ],
      description: 'Blood Sword: Mất 1 Power → +1 STR, +1 MA',
    };
  },
  'Sacrifice 1 Power for +1 STR +1 MA after win'
);

// ============================================================================
// BAGPIPE - +1 all stats if more powers than opponent
// ============================================================================

/**
 * Great Highland Bagpipe - Trước Combat: +1 all stats nếu có nhiều power hơn đối thủ.
 */
registerCombatHandler(
  'bagpipe_power_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const selfPowers = ctx.self.powers.length;
    const oppPowers = ctx.opponent.powers.length;
    if (selfPowers > oppPowers) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
        description: `Bagpipe: Nhiều power hơn (${selfPowers} > ${oppPowers}) → +1 all stats`,
      };
    }
    return { description: `Bagpipe: Không nhiều power hơn (${selfPowers} <= ${oppPowers})` };
  },
  '+1 all stats if more powers than opponent'
);

// ============================================================================
// SARASTRO'S FLUTE - Opponent -1 all stats per 3 powers
// ============================================================================

/**
 * Sarastro's Flute - Trước Combat: Đối thủ -1 all stats với mỗi 3 power họ có.
 */
registerCombatHandler(
  'sarastro_flute_debuff',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppPowers = ctx.opponent.powers.length;
    const debuff = Math.floor(oppPowers / 3);
    if (debuff > 0) {
      return {
        opponentStatMods: STAT_NAMES.map(stat => ({ stat, value: -debuff })),
        description: `Sarastro's Flute: Đối thủ ${oppPowers} power → -${debuff} all stats`,
      };
    }
    return { description: `Sarastro's Flute: Đối thủ chưa đủ 3 power (${oppPowers})` };
  },
  'Opponent -1 all stats per 3 powers'
);

// ============================================================================
// RUYI JINGU BANG - +1 all stats per 3 powers before combat
// ============================================================================

/**
 * Ruyi Jingu Bang - Trước Combat: +1 all stats với mỗi 3 power.
 */
registerCombatHandler(
  'ruyi_jingu_power_scaling',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const selfPowers = ctx.self.powers.length;
    const bonus = Math.floor(selfPowers / 3);
    if (bonus > 0) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: bonus })),
        description: `Ruyi Jingu Bang: ${selfPowers} power → +${bonus} all stats`,
      };
    }
    return { description: `Ruyi Jingu Bang: Chưa đủ 3 power (${selfPowers})` };
  },
  '+1 all stats per 3 powers before combat'
);

// ============================================================================
// MOONVEIL - +1 point if higher Base IQ, +1 point if more powers
// ============================================================================

/**
 * Moonveil - Trước Combat: +1 điểm nếu Base IQ cao hơn, +1 điểm nếu nhiều Power hơn.
 */
registerCombatHandler(
  'moonveil_bonuses',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    let points = 0;
    const desc: string[] = [];
    if (ctx.self.baseStats.iq > ctx.opponent.baseStats.iq) {
      points += 1;
      desc.push('+1 điểm (Base IQ cao hơn)');
    }
    if (ctx.self.powers.length > ctx.opponent.powers.length) {
      points += 1;
      desc.push('+1 điểm (nhiều Power hơn)');
    }
    if (points > 0) {
      return { selfPoints: points, description: `Moonveil: ${desc.join(', ')}` };
    }
    return { description: 'Moonveil: Không đủ điều kiện' };
  },
  '+1 point if higher Base IQ, +1 if more powers'
);

// ============================================================================
// CHASTIEFOL - +3 to opponent's 2 lowest stats
// ============================================================================

/**
 * Chastiefol - Trước Combat: +3 vào 2 Stat thấp nhất của đối phương.
 * (Buff đối thủ - nhưng đây là từ góc nhìn Chastiefol chủ nhân)
 */
registerCombatHandler(
  'chastiefol_lowest_stats',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const sorted = [...STAT_NAMES].sort((a, b) => (ctx.opponent!.stats as Record<StatName, number>)[a] - (ctx.opponent!.stats as Record<StatName, number>)[b]);
    const [lowest1, lowest2] = sorted;
    return {
      opponentStatMods: [
        { stat: lowest1, value: 3 },
        { stat: lowest2, value: 3 },
      ],
      description: `Chastiefol: +3 ${lowest1}, +3 ${lowest2} cho đối phương`,
    };
  },
  "+3 to opponent's 2 lowest stats"
);

// ============================================================================
// DEATHS SCYTHE - Scaling debuff per 51 players dead
// ============================================================================

/**
 * Death's Scythe - Debuff đối thủ, +1 per 51 người chết.
 */
registerCombatHandler(
  'deaths_scythe_scaling_debuff',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Approximate scaling from round progression
    const currentRound = ctx.currentRound;
    const debuff = Math.floor(currentRound / 2); // Approximate scaling
    if (debuff > 0) {
      return {
        opponentStatMods: STAT_NAMES.map(stat => ({ stat, value: -debuff })),
        description: `Death's Scythe: -${debuff} all stats đối thủ (tăng dần theo số người chết)`,
      };
    }
    return { description: "Death's Scythe: Chưa đủ người chết" };
  },
  'Scaling debuff per 51 players dead'
);

// ============================================================================
// DIFFUSAL BLADE - Disable opponent's Magic gear/weapons
// ============================================================================

/**
 * Diffusal Blade - Vô hiệu Gear/Weapon có tag Magic của đối phương.
 */
registerCombatHandler(
  'diffusal_disable_magic',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Diffusal Blade: Vô hiệu hóa Gear/Weapon có tag Magic của đối phương',
    };
  },
  "Disable opponent's Magic-tagged gear/weapons"
);

// ============================================================================
// BLADE OF CHAOS - Double stats if opponent is God race
// ============================================================================

/**
 * Blade of Chaos - Trong Combat: Gấp đôi stat bonus (+4 STR, +4 MA → +8/+8) nếu đối thủ là God.
 */
registerCombatHandler(
  'blade_of_chaos_god_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppRace = ctx.opponent.race || '';
    const isGod = ['God', 'Titan', 'Deity', 'Divine'].includes(oppRace);
    if (isGod) {
      return {
        selfStatMods: [
          { stat: 'strength', value: 4 },
          { stat: 'ma', value: 4 },
        ],
        description: `Blade of Chaos: Đối thủ là God (${oppRace}) → +4 STR, +4 MA thêm`,
      };
    }
    return { skipDefault: true };
  },
  'Double weapon bonus vs God race'
);

// ============================================================================
// ASTROLOGER'S STAFF - +1 BIQ when a during_combat power activates
// ============================================================================

/**
 * Astrologer's Staff - Khi Power "Trong Combat" kích hoạt lần đầu, +1 BIQ.
 */
registerCombatHandler(
  'astrologer_staff_power_trigger',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const activations = ctx.self.duringCombatActivations || 0;
    if (activations === 1) {
      return {
        selfStatMods: [{ stat: 'biq', value: 1 }],
        description: "Astrologer's Staff: Power Trong Combat kích hoạt lần đầu → +1 BIQ",
      };
    }
    return { skipDefault: true };
  },
  '+1 BIQ on first during_combat power activation'
);

// ============================================================================
// SAITAMA'S GLOVES - Random stat, +1 point on win, auto-win if STR
// ============================================================================

/**
 * Saitama's Gloves - Quay 1 stat ngẫu nhiên. Thắng stat đó +1 điểm. Nếu STR, thắng luôn.
 */
registerCombatHandler(
  'saitama_random_stat',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    // Stat selection is decided by wheel UI in CombatEffectsPanel (before_combat)
    // This handler is a reference — actual execution depends on wheel result tracked externally
    return {
      skipDefault: true,
      description: "Saitama's Gloves: Xác định stat bởi wheel trước combat (xem CombatEffectsPanel)",
    };
  },
  'Random stat wheel: auto-win if STR, else +1 point on winning that stat'
);

// ============================================================================
// GALEFORCE - Negate first round loss point
// ============================================================================

/**
 * Galeforce - Round thua đầu: đối thủ không nhận điểm. Nếu điểm ≤0: +3 random stat.
 */
registerCombatHandler(
  'galeforce_first_lose',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // roundsLost = số round đã thua TRƯỚC round này (chưa gồm round hiện tại)
    // "round thua đầu tiên" = khi roundsLost === 0 và round này là thua
    // timing on_round_lose đảm bảo chỉ gọi khi thua; triggerOnce chưa được engine track
    if (ctx.self.roundsLost === 0) {
      return {
        opponentPoints: -1,
        description: 'Galeforce: Round thua đầu tiên → đối thủ không nhận điểm round này',
      };
    }
    return { skipDefault: true };
  },
  'Negate opponent point on first round loss'
);

// ============================================================================
// BATTLEFURY - Same as Galeforce
// ============================================================================

/**
 * Battlefury - Round thua đầu: đối thủ không nhận điểm. Nếu điểm ≤0: +3 random stat.
 */
registerCombatHandler(
  'battlefury_first_lose',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // roundsLost = số round đã thua TRƯỚC round này (chưa gồm round hiện tại)
    // "round thua đầu tiên" = khi roundsLost === 0 và round này là thua
    // timing on_round_lose đảm bảo chỉ gọi khi thua; triggerOnce chưa được engine track
    if (ctx.self.roundsLost === 0) {
      return {
        opponentPoints: -1,
        description: 'Battlefury: Round thua đầu tiên → đối thủ không nhận điểm round này',
      };
    }
    return { skipDefault: true };
  },
  'Negate opponent point on first round loss'
);

// ============================================================================
// DAWNBREAKER - +2 random stat per 2 round wins
// ============================================================================

/**
 * Dawnbreaker - Sau Combat: Với mỗi 2 round chiến thắng, +2 random stat.
 */
registerCombatHandler(
  'dawnbreaker_round_wins',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const pairs = Math.floor(ctx.self.roundsWon / 2);
    if (pairs > 0) {
      const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
      return {
        selfStatMods: [{ stat: randomStat, value: 2 * pairs }],
        description: `Dawnbreaker: ${ctx.self.roundsWon} round thắng → +${2 * pairs} ${randomStat}`,
      };
    }
    return { description: 'Dawnbreaker: Chưa đủ 2 round thắng' };
  },
  '+2 random stat per 2 round wins'
);

// ============================================================================
// DEATH'S WEB WAND - Sacrifice 1 Power for +1 all stats
// ============================================================================

/**
 * Death's Web Wand - Sau Combat: Loại bỏ 1 Power để +1 All Stats.
 */
registerCombatHandler(
  'deaths_web_sacrifice',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
      description: "Death's Web Wand: Mất 1 Power → +1 all stats",
    };
  },
  'Sacrifice 1 Power for +1 all stats'
);

// ============================================================================
// LUSAT'S GLINTSTONE STAFF - Grant 1 Power if won IQ round
// ============================================================================

/**
 * Lusat's Glintstone Staff - Sau combat: Nếu thắng round IQ, nhận 1 Power.
 */
registerCombatHandler(
  'lusat_iq_win_power',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const iqResult = ctx.roundResults?.iq;
    if (iqResult === 'win') {
      return {
        grantPower: 'random',
        description: "Lusat's Staff: Thắng round IQ → nhận 1 Power",
      };
    }
    return { description: "Lusat's Staff: Không thắng round IQ" };
  },
  'Grant 1 Power if won IQ round'
);

// ============================================================================
// FLOWER OF FIRE - +1 random stat per 2 powers on win; +2 powers on lose
// ============================================================================

/**
 * Flower of Fire - Sau combat thắng: +1 random stat mỗi 2 Power. Sau thua: +2 Power.
 */
registerCombatHandler(
  'flower_of_fire_scaling',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const won = ctx.self.roundsWon > ctx.self.roundsLost;
    if (won) {
      const bonus = Math.floor(ctx.self.powers.length / 2);
      if (bonus > 0) {
        const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
        return {
          selfStatMods: [{ stat: randomStat, value: bonus }],
          description: `Flower of Fire: Thắng, ${ctx.self.powers.length} power → +${bonus} ${randomStat}`,
        };
      }
      return { description: 'Flower of Fire: Thắng nhưng chưa đủ 2 power' };
    }
    // Lost: grant 2 powers
    return {
      grantPowers: ['random', 'random'],
      description: 'Flower of Fire: Thua → nhận 2 Power ngẫu nhiên',
    };
  },
  '+1 random stat per 2 powers on win; 2 powers on lose'
);

// ============================================================================
// HONJO MASAMUNE - +2 points if won both SPD and BIQ
// ============================================================================

/**
 * Honjo Masamune - Trong combat: Thắng cả SPD và BIQ, +2 điểm.
 */
registerCombatHandler(
  'honjo_spd_biq_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const spdWin = ctx.roundResults?.speed === 'win';
    const biqWin = ctx.roundResults?.biq === 'win';
    if (spdWin && biqWin) {
      return {
        selfPoints: 2,
        description: 'Honjo Masamune: Thắng cả SPD và BIQ → +2 điểm',
      };
    }
    return { skipDefault: true };
  },
  '+2 points if won both SPD and BIQ rounds'
);

// ============================================================================
// MEDUSA'S HEAD - Steal points opponent would get from effects
// ============================================================================

/**
 * Medusa's Head - Trong combat: Nhận điểm thay đối thủ khi họ nhận từ hiệu ứng.
 */
registerCombatHandler(
  'medusa_steal_effect_points',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: "Medusa's Head: Ăn cắp điểm từ hiệu ứng đối thủ nhận được",
    };
  },
  'Steal effect points that opponent would receive'
);

// ============================================================================
// GIANT SLAYER - +1 point per 4 Base Dura of opponent (max 2)
// ============================================================================

/**
 * Giant Slayer - Trong combat: +1 điểm với mỗi 4 Base Dura của đối thủ (tối đa 2).
 */
registerCombatHandler(
  'giant_slayer_dura_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppBaseDura = ctx.opponent.baseStats.durability;
    const points = Math.min(2, Math.floor(oppBaseDura / 4));
    if (points > 0) {
      return {
        selfPoints: points,
        description: `Giant Slayer: Đối thủ có ${oppBaseDura} Base Dura → +${points} điểm`,
      };
    }
    return { description: `Giant Slayer: Đối thủ chưa đủ 4 Base Dura (${oppBaseDura})` };
  },
  '+1 point per 4 opponent Base Dura (max 2)'
);

// ============================================================================
// RUAN MEI'S LUTE - Opponent -1 IQ, -1 BIQ per shared Quirk
// ============================================================================

/**
 * Ruan Mei's Lute - Đối thủ -1 IQ, -1 BIQ với mỗi Quirk chung.
 */
registerCombatHandler(
  'ruan_mei_shared_quirks',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const selfQuirks = new Set(ctx.self.quirks);
    const shared = ctx.opponent.quirks.filter(q => selfQuirks.has(q)).length;
    if (shared > 0) {
      return {
        opponentStatMods: [
          { stat: 'iq', value: -shared },
          { stat: 'biq', value: -shared },
        ],
        description: `Ruan Mei's Lute: ${shared} Quirk chung → đối thủ -${shared} IQ, -${shared} BIQ`,
      };
    }
    return { description: "Ruan Mei's Lute: Không có Quirk chung" };
  },
  'Opponent -1 IQ -1 BIQ per shared Quirk'
);

// ============================================================================
// GREEN DRAGON CRESCENT BLADE - BIQ round result = STR round result
// ============================================================================

/**
 * Green Dragon Crescent Blade - Trong combat: Round BIQ có kết quả như round STR.
 */
registerCombatHandler(
  'green_dragon_biq_str',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const strResult = ctx.roundResults?.strength;
    if (strResult === 'win') {
      return {
        selfPoints: 1,
        description: 'Green Dragon: STR thắng → BIQ cũng thắng (+1 điểm)',
      };
    } else if (strResult === 'lose') {
      return {
        opponentPoints: 1,
        description: 'Green Dragon: STR thua → BIQ cũng thua (-1 điểm cho ta)',
      };
    }
    return { skipDefault: true };
  },
  'BIQ round mirrors STR round result'
);

// ============================================================================
// NEEDLE - +2 points when winning the round matching opponent's lowest Base Stat
// ============================================================================

/**
 * Needle - Trong Combat: Thắng Round có Base Stat thấp nhất của đối thủ, +2 điểm.
 */
registerCombatHandler(
  'needle_lowest_stat_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    let lowestStat: StatName = 'strength';
    let lowestVal = (ctx.opponent.baseStats as Record<StatName, number>).strength;
    for (const stat of STAT_NAMES) {
      if ((ctx.opponent.baseStats as Record<StatName, number>)[stat] < lowestVal) {
        lowestVal = (ctx.opponent.baseStats as Record<StatName, number>)[stat];
        lowestStat = stat;
      }
    }
    const result = ctx.roundResults?.[lowestStat];
    if (result === 'win') {
      return {
        selfPoints: 2,
        description: `Needle: Thắng round ${lowestStat} (stat thấp nhất của đối thủ) → +2 điểm`,
      };
    }
    return { skipDefault: true };
  },
  "+2 points on winning opponent's lowest Base Stat round"
);

// ============================================================================
// BOLT OF GRANSAX - After winning SPD round, all subsequent SPD rounds worth +2
// ============================================================================

/**
 * Bolt of Gransax - Trong Combat: Thắng Round SPD, +2 điểm/round thay vì 1 cho phần còn lại.
 */
registerCombatHandler(
  'bolt_gransax_speed_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const spdResult = ctx.roundResults?.speed;
    if (spdResult === 'win' && ctx.self.roundsWon > 0) {
      // Give extra point for winning SPD
      return {
        selfPoints: 1,
        description: 'Bolt of Gransax: Thắng round SPD → +2 điểm (thêm +1)',
      };
    }
    return { skipDefault: true };
  },
  '+2 points on SPD round win after first SPD win'
);

// ============================================================================
// MISERICORDE - 10% chance to steal point when losing a round
// ============================================================================

/**
 * Misericorde - Mỗi khi thua round, 10% nhận điểm thay vì đối thủ.
 */
registerCombatHandler(
  'misericorde_steal_point',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    // 10% chance handled by condition in effect definition
    return {
      selfPoints: 1,
      opponentPoints: -1,
      description: 'Misericorde: 10% ăn cắp điểm khi thua round',
    };
  },
  '10% steal point on round loss'
);

// ============================================================================
// ECLIPSE SHOTEL - After win: opponent -2 all, lose lover, cure AIDS
// ============================================================================

/**
 * Eclipse Shotel - Sau Combat thắng: Đối thủ -2 All Stats, chia tay Lover. Chữa AIDS, loại bỏ Femboy.
 */
registerCombatHandler(
  'eclipse_shotel_effects',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      opponentStatMods: STAT_NAMES.map(stat => ({ stat, value: -2 })),
      description: 'Eclipse Shotel: Đối thủ -2 all stats, mất Lover. Bản thân chữa AIDS, loại Femboy.',
    };
  },
  'Opponent -2 all + lose lover; self cure AIDS + remove Femboy'
);

// ============================================================================
// TWELVE SANDALS - After combat loss: +3 and +6 to 2 random stats
// ============================================================================

/**
 * 12 đôi dép - Sau Combat thua: +3 và +6 vào 2 stat bất kì. Chung kết: thêm 1 lần nữa.
 */
registerCombatHandler(
  'twelve_sandals_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const shuffled = [...STAT_NAMES].sort(() => Math.random() - 0.5);
    const stat1 = shuffled[0];
    const stat2 = shuffled[1];
    const mods = [
      { stat: stat1, value: 3 },
      { stat: stat2, value: 6 },
    ];
    if (ctx.isFinals) {
      mods.push({ stat: stat1, value: 3 }, { stat: stat2, value: 6 });
    }
    return {
      selfStatMods: mods,
      description: `12 đôi dép: Thua → +3 ${stat1}, +6 ${stat2}${ctx.isFinals ? ' (x2 chung kết)' : ''}`,
    };
  },
  '+3 and +6 to 2 random stats after loss (double in finals)'
);

// ============================================================================
// YORIICHI'S BLACK NICHIRIN - Auto-win vs Demon, +3 all when no Demons remain
// ============================================================================

/**
 * Yoriichi's Black Nichirin - Trong Combat: Mặc định thắng Demon.
 * Khi không còn Demon nào còn sống, +3 all stats.
 */
registerCombatHandler(
  'nichirin_demon_slayer',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppRace = (ctx.opponent.race || '').toLowerCase();
    const isDemon = oppRace === 'demon';
    if (isDemon) {
      return {
        autoWin: true,
        description: "Yoriichi's Black Nichirin: Đối thủ là Demon → Auto Win",
      };
    }
    // Check if no Demons remain alive (check allCharacters)
    const allChars: any[] = (ctx as any).allCharacters || [];
    const demonAlive = allChars.some((c: any) => {
      const r = (c.race?.race || c.race || '').toLowerCase();
      return r === 'demon' && c.tournament?.status === 'alive';
    });
    if (!demonAlive && allChars.length > 0) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 3 })),
        description: "Yoriichi's Black Nichirin: Không còn Demon → +3 all stats",
      };
    }
    return { skipDefault: true };
  },
  'Auto-win vs Demon; +3 all stats when no Demons remain'
);

// ============================================================================
// DIVINE RAPIER - Remove weapon on combat loss
// ============================================================================

/**
 * Divine Rapier - Sau Combat thua: Mất vũ khí này.
 */
registerCombatHandler(
  'divine_rapier_lose_on_loss',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      removeWeapon: 'Divine Rapier',
      description: 'Divine Rapier: Thua combat → Mất vũ khí',
    };
  },
  'Remove Divine Rapier on combat loss'
);

// ============================================================================
// BLOODTHRIST DAGGER - +16% crit bonus for Critical Strike
// ============================================================================

/**
 * Bloodthrist Dagger - Trong Combat: +16% tỉ lệ crit của Critical Strike.
 */
registerCombatHandler(
  'bloodthrist_crit_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult | null => {
    const hasCritStrike = ctx.self.powers?.includes('Critical Strike');
    if (!hasCritStrike) return { skipDefault: true };
    return {
      updateCharacterField: { critBonusPercent: 16 },
      description: 'Bloodthrist Dagger: +16% crit cho Critical Strike',
    };
  },
  '+16% Critical Strike crit rate during combat'
);

// ============================================================================
// RUYI JINGU BANG - Grant random power after win (handled via condition probability)
// ============================================================================

/**
 * Ruyi Jingu Bang - Sau Combat thắng: 72% nhận 1 Power ngẫu nhiên.
 * (Probability condition is handled by effect definition; handler executes grant)
 */
registerCombatHandler(
  'ruyi_jingu_power_chance',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      grantPower: 'random',
      description: 'Ruyi Jingu Bang: Nhận 1 Power ngẫu nhiên',
    };
  },
  'Grant random power after combat win (72% chance via condition)'
);

// ============================================================================
// MJOLNIR - Return to wheel on combat loss
// ============================================================================

/**
 * Mjolnir - Sau combat thua: Mất vũ khí và trả lại về vòng quay.
 */
registerCombatHandler(
  'mjolnir_return_on_lose',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      removeWeapon: 'Mjolnir',
      description: 'Mjolnir: Thua combat → Mất Mjolnir, trả về vòng quay',
    };
  },
  'Remove Mjolnir and return to wheel on combat loss'
);

// ============================================================================
// RHITTA - 33% chance to double weapon stat bonuses during combat
// ============================================================================

/**
 * Rhitta - Trong Combat: 33% gấp đôi +STR và +Dura từ vũ khí.
 * Rhitta grants +3 STR and +2 Dura; doubled = +3 STR and +2 Dura extra.
 */
registerCombatHandler(
  'rhitta_double_bonus',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    // 33% probability decided by wheel UI in CombatEffectsPanel, not Math.random()
    return {
      skipDefault: true,
      description: 'Rhitta: 33% gấp đôi stat bonus (xác suất quyết định bởi wheel UI)',
    };
  },
  '33% chance to double Rhitta stat bonuses (+3 STR +2 Dura) (wheel decides probability)'
);

// ============================================================================
// ANDÚRIL - +1 starting point per 3 Summons vs evil races
// ============================================================================

const ANDURIL_EVIL_RACES = ['demon', 'vampire', 'spirit', 'orc', 'skeleton', 'goblin'];

/**
 * Andúril - Trước Combat: vs Demon/Vampire/Spirit/Orc/Skeleton/Goblin,
 * +1 điểm khởi đầu với mỗi 3 Summon đang có.
 */
registerCombatHandler(
  'anduril_evil_race_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppRace = (ctx.opponent.race || '').toLowerCase();
    const isEvilRace = ANDURIL_EVIL_RACES.includes(oppRace);
    if (!isEvilRace) return { skipDefault: true };

    const powers: any[] = ctx.self.powers || [];
    const summonCount = powers.filter((p: any) => {
      const name = typeof p === 'string' ? p : (p?.name || '');
      return name.toLowerCase().startsWith('summon:');
    }).length;
    const bonusPoints = Math.floor(summonCount / 3);
    if (bonusPoints <= 0) return { skipDefault: true };

    return {
      selfPoints: bonusPoints,
      description: `Andúril: vs ${ctx.opponent.race}, ${summonCount} Summons → +${bonusPoints} điểm`,
    };
  },
  '+1 starting point per 3 Summons when vs evil races (Demon/Vampire/Spirit/Orc/Skeleton/Goblin)'
);

// ============================================================================
// GALEFORCE - After combat: if opponent total points ≤0, +3 random stat
// ============================================================================

/**
 * Galeforce - Sau Combat: Nếu tổng điểm đối thủ ≤0, nhận +3 vào 1 stat ngẫu nhiên.
 */
registerCombatHandler(
  'galeforce_zero_points_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const oppPoints = (ctx as any).opponentTotalPoints ?? (ctx.opponent ? (ctx as any).opponentPoints : null);
    // Check via opponentPoints field or fallback: only grant if opponent ended ≤0 points
    if (oppPoints === null || oppPoints === undefined || oppPoints > 0) return { skipDefault: true };
    const stat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      selfStatMods: [{ stat, value: 3 }],
      description: `Galeforce: Đối thủ ≤0 điểm → +3 ${stat}`,
    };
  },
  '+3 random stat after combat if opponent total points ≤0'
);

// ============================================================================
// BATTLEFURY - After combat: if opponent total points ≤0, +3 random stat
// ============================================================================

/**
 * Battlefury - Sau Combat: Nếu tổng điểm đối thủ ≤0, nhận +3 vào 1 stat ngẫu nhiên.
 */
registerCombatHandler(
  'battlefury_zero_points_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const oppPoints = (ctx as any).opponentTotalPoints ?? (ctx.opponent ? (ctx as any).opponentPoints : null);
    if (oppPoints === null || oppPoints === undefined || oppPoints > 0) return { skipDefault: true };
    const stat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      selfStatMods: [{ stat, value: 3 }],
      description: `Battlefury: Đối thủ ≤0 điểm → +3 ${stat}`,
    };
  },
  '+3 random stat after combat if opponent total points ≤0'
);

// ============================================================================
// INFINITY GAUNTLET - Assign stones to 6 random players, collect on their death
// ============================================================================

/**
 * Infinity Gauntlet - Immediate: Quay 6 người chơi nhận đá vô cực.
 * Khi họ bị loại, người sở hữu gauntlet nhận đá của họ (Power).
 * This is a complex meta-game effect; immediate handler marks 6 players.
 */
registerCombatHandler(
  'infinity_gauntlet_stones',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    // This is handled by the engine at tournament level (spin 6 players for stones).
    // Combat handler is a no-op; actual stone collection happens on_death events.
    return { skipDefault: true };
  },
  'Meta-game: assign stones to 6 players, collect on their death (engine-level)'
);

export function registerWeaponHandlers(): void {
  // All handlers are registered at module level via registerImmediateHandler calls above.
}

export function registerWeaponCombatHandlers(): void {
  // All handlers are registered at module level via registerCombatHandler calls above.
}
