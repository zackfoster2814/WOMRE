/**
 * Power Effects Data
 *
 * Nguồn: wheelofmultiverse-ss3.xlsx - Sheet "Power"
 */

import { defineEffect } from '../registry';

export function registerAllPowerEffects() {
  // U=ma2 (từ Agnes Tachyon)
  defineEffect('power', 'U=ma2')
    .description('Thua round Str: +3 Speed. Thua round Speed: +4 Dura.')
    .weight(0.78)
    .effect({
      type: 'stat_modifier',
      stat: 'speed',
      value: 3,
      timing: 'during_combat',
      target: 'self',
      duration: 'combat',
      customHandler: 'uma2_str_lose'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'durability',
      value: 4,
      timing: 'during_combat',
      target: 'self',
      duration: 'combat',
      customHandler: 'uma2_spd_lose'
    })
    .register();

  // Memory Freeze
  defineEffect('power', 'Memory Freeze')
    .description('Sau combat thua: Đối thủ nhận Quirk "Brainrot".')
    .weight(0.78)
    .effect({
      type: 'grant_quirk',
      grantType: 'quirk',
      grantName: 'Brainrot',
      grantCount: 1,
      timing: 'after_combat_lose',
      target: 'opponent'
    })
    .register();

  // Metamagic
  defineEffect('power', 'Metamagic')
    .description('Trong Combat: +1 Điểm ở Round BIQ nếu thắng.')
    .weight(0.78)
    .effect({
      type: 'extra_point_on_win',
      points: 1,
      timing: 'during_combat',
      target: 'self',
      customHandler: 'metamagic_biq_round'
    })
    .register();

  // Baldening
  defineEffect('power', 'Baldening')
    .description('Bạn đang hói 💀')
    .weight(0.78)
    .register();

  // Critical Strike
  defineEffect('power', 'Critical Strike')
    .description('Trong Combat: 20% nhận thêm 1 điểm mỗi round thắng.')
    .weight(0.78)
    .effect({
      type: 'extra_point_on_win',
      points: 1,
      timing: 'on_round_win',
      target: 'self',
      conditions: [{ type: 'probability', chance: 20 }]
    })
    .register();

  // Evasion
  defineEffect('power', 'Evasion')
    .description('Trong Combat: 20% nhận 1 điểm mỗi round thua.')
    .weight(0.78)
    .effect({
      type: 'combat_points',
      points: 1,
      timing: 'on_round_lose',
      target: 'self',
      conditions: [{ type: 'probability', chance: 20 }]
    })
    .register();

  // Healing Factor
  defineEffect('power', 'Healing Factor')
    .description('Buff: +1 Dura. Sau combat: +1 Dura với mỗi 2 round thua.')
    .weight(0.78)
    .addStat('durability', 1)
    .effect({
      type: 'stat_modifier',
      stat: 'durability',
      value: 1,
      timing: 'after_combat',
      target: 'self',
      customHandler: 'healing_factor_per_2_lost'
    })
    .register();

  // Gourmand
  defineEffect('power', 'Gourmand')
    .description('Buff: +4 Durability.')
    .weight(0.78)
    .addStat('durability', 4)
    .register();

  // // Hydrate
  // defineEffect('power', 'Hydrate')
  //   .description('Buff: +4 Durability.')
  //   .weight(0.78)
  //   .addStat('durability', 4)
  //   .register();

  // Lone Wolf
  defineEffect('power', 'Lone Wolf')
    .description('+3 Speed. Gặp người cũng có power này: mất power.')
    .weight(0.78)
    .addStat('speed', 3)
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'lone_wolf_check'
    })
    .register();

  // AIDS
  defineEffect('power', 'AIDS')
    .description('Sau Combat: -2 Dura. Lây sang Lover. Không thể xóa bỏ.')
    .weight(0.78)
    .effect({
      type: 'stat_modifier',
      stat: 'durability',
      value: -2,
      timing: 'after_combat',
      target: 'self'
    })
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'lover',
      customHandler: 'aids_spread_to_lover'
    })
    .effect({
      type: 'immunity',
      immuneTo: ['remove_aids'],
      timing: 'immediate',
      target: 'self'
    })
    .register();

  // Petrification
  defineEffect('power', 'Petrification')
    .description('Debuff: Đối thủ -4 Speed.')
    .weight(0.78)
    .debuffOpponent('speed', 4)
    .register();

  // Magma Strike
  defineEffect('power', 'Magma Strike')
    .description('Debuff: -2 Dura đối thủ. Sau combat: -1 Dura đối thủ.')
    .weight(0.78)
    .debuffOpponent('durability', 2)
    .effect({
      type: 'stat_modifier',
      stat: 'durability',
      value: -1,
      timing: 'after_combat',
      target: 'opponent'
    })
    .register();

  // Ice Hammer
  defineEffect('power', 'Ice Hammer')
    .description('Buff: +2 Strength. Debuff: -2 Speed đối thủ.')
    .weight(0.78)
    .addStat('strength', 2)
    .debuffOpponent('speed', 2)
    .register();

  // Storm Calling
  defineEffect('power', 'Storm Calling')
    .description('Trước Combat: +2 BIQ.')
    .weight(0.78)
    .effect({
      type: 'stat_modifier',
      stat: 'biq',
      value: 2,
      timing: 'before_combat',
      target: 'self'
    })
    .register();

  // Spear of Fire
  defineEffect('power', 'Spear of Fire')
    .description('Buff: +2 MA. Nếu dùng vũ khí có 2 Rune: +1 điểm khởi đầu.')
    .weight(0.78)
    .addStat('ma', 2)
    .effect({
      type: 'combat_points',
      points: 1,
      timing: 'before_combat',
      target: 'self',
      customHandler: 'spear_of_fire_2_rune_check'
    })
    .register();

  // Bonk Bonk Bonk
  defineEffect('power', 'Bonk Bonk Bonk')
    .description('Debuff: -2 Str/Spd/Dura đối thủ. Nếu Gigachad: thêm -2 IQ/BIQ/MA.')
    .weight(0.78)
    .debuffOpponent('strength', 2)
    .debuffOpponent('speed', 2)
    .debuffOpponent('durability', 2)
    .effect({
      type: 'debuff',
      stat: 'iq',
      value: -2,
      timing: 'during_combat',
      target: 'opponent',
      conditions: [{ type: 'has_item', itemType: 'archetype', itemName: 'Gigachad' }]
    })
    .effect({
      type: 'debuff',
      stat: 'biq',
      value: -2,
      timing: 'during_combat',
      target: 'opponent',
      conditions: [{ type: 'has_item', itemType: 'archetype', itemName: 'Gigachad' }]
    })
    .effect({
      type: 'debuff',
      stat: 'ma',
      value: -2,
      timing: 'during_combat',
      target: 'opponent',
      conditions: [{ type: 'has_item', itemType: 'archetype', itemName: 'Gigachad' }]
    })
    .register();

  // Invulnerability
  defineEffect('power', 'Invulnerability')
    .description('+2 Durability.')
    .weight(0.78)
    .addStat('durability', 2)
    .register();

  // Overdrive
  defineEffect('power', 'Overdrive')
    .description('+3 MA, -1 Durability.')
    .weight(0.78)
    .addStat('ma', 3)
    .addStat('durability', -1)
    .register();

  // Drunken Boxing
  defineEffect('power', 'Drunken Boxing')
    .description('-1 IQ, -1 Speed, +4 MA.')
    .weight(0.78)
    .addStat('iq', -1)
    .addStat('speed', -1)
    .addStat('ma', 4)
    .register();

  // Divine Lightning
  defineEffect('power', 'Divine Lightning')
    .description('+1 Str/Spd/MA. Buff: +1 Str/Spd/MA vs Demon.')
    .weight(0.78)
    .addStat('strength', 1)
    .addStat('speed', 1)
    .addStat('ma', 1)
    .effect({
      type: 'stat_modifier',
      stat: 'strength',
      value: 1,
      timing: 'during_combat',
      target: 'self',
      conditions: [{ type: 'race_match', races: ['Demon'] }]
    })
    .effect({
      type: 'stat_modifier',
      stat: 'speed',
      value: 1,
      timing: 'during_combat',
      target: 'self',
      conditions: [{ type: 'race_match', races: ['Demon'] }]
    })
    .effect({
      type: 'stat_modifier',
      stat: 'ma',
      value: 1,
      timing: 'during_combat',
      target: 'self',
      conditions: [{ type: 'race_match', races: ['Demon'] }]
    })
    .register();

  // Fist Fighting
  defineEffect('power', 'Fist Fighting')
    .description('Mất vũ khí. +4 MA.')
    .weight(0.78)
    .effect({
      type: 'remove_gear',
      timing: 'immediate',
      target: 'self',
      customHandler: 'fist_fighting_remove_weapon'
    })
    .addStat('ma', 4)
    .register();

  // Rampage
  defineEffect('power', 'Rampage')
    .description('Sau combat thắng: 36% +1 all stats.')
    .weight(0.78)
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'after_combat_win',
      target: 'self',
      conditions: [{ type: 'probability', chance: 36 }]
    })
    .register();

  // Bloodlust
  defineEffect('power', 'Bloodlust')
    .description('Sau combat thắng: -1 IQ/MA, +1 Str/Spd, +2 Dura.')
    .weight(0.78)
    .effect({
      type: 'stat_modifier',
      stat: 'iq',
      value: -1,
      timing: 'after_combat_win',
      target: 'self'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'ma',
      value: -1,
      timing: 'after_combat_win',
      target: 'self'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'strength',
      value: 1,
      timing: 'after_combat_win',
      target: 'self'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'speed',
      value: 1,
      timing: 'after_combat_win',
      target: 'self'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'durability',
      value: 2,
      timing: 'after_combat_win',
      target: 'self'
    })
    .register();

  // Power Absorption
  defineEffect('power', 'Power Absorption')
    .description('Sau combat thắng: hấp thụ 1 Power ngẫu nhiên của đối thủ.')
    .weight(0.78)
    .effect({
      type: 'steal_power',
      grantCount: 1,
      timing: 'after_combat_win',
      target: 'opponent'
    })
    .register();

  // Power Negation
  defineEffect('power', 'Power Negation')
    .description('Trước Combat: Vô hiệu hóa 1 Power ngẫu nhiên của đối thủ.')
    .weight(0.78)
    .effect({
      type: 'power_disable',
      timing: 'before_combat',
      target: 'opponent',
      grantCount: 1
    })
    .register();

  // Mind Control
  defineEffect('power', 'Mind Control')
    .description('Trước Combat: +1 all stats vs đối thủ có Base IQ ≤5.')
    .weight(0.78)
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'before_combat',
      target: 'self',
      conditions: [{
        type: 'stat_compare',
        stat: 'iq',
        compareWith: 'opponent',
        operator: '<='
      }],
      customHandler: 'mind_control_iq_check'
    })
    .register();

  // Blood Manipulation
  defineEffect('power', 'Blood Manipulation')
    .description('Trước Combat: +3 Strength vs tất cả trừ Skeleton và Spirit.')
    .weight(0.78)
    .effect({
      type: 'stat_modifier',
      stat: 'strength',
      value: 3,
      timing: 'before_combat',
      target: 'self',
      conditions: [{
        type: 'race_match',
        excludeRaces: ['Skeleton', 'Spirit']
      }]
    })
    .register();

  // Sonic Scream
  defineEffect('power', 'Sonic Scream')
    .description('Debuff: -3 Durability đối thủ.')
    .weight(0.78)
    .debuffOpponent('durability', 3)
    .register();

  // Thunder Orb
  defineEffect('power', 'Thunder Orb')
    .description('Debuff: -2 Durability đối thủ.')
    .weight(0.78)
    .debuffOpponent('durability', 2)
    .register();

  // Armor Piercing
  defineEffect('power', 'Armor Piercing')
    .description('Trong Combat: +1 Điểm ở Round Dura nếu thắng.')
    .weight(0.78)
    .effect({
      type: 'extra_point_on_win',
      points: 1,
      timing: 'during_combat',
      target: 'self',
      customHandler: 'armor_piercing_dura_round'
    })
    .register();

  // Divine Smite
  defineEffect('power', 'Divine Smite')
    .description('Trong Combat: +1 Điểm ở Round MA nếu thắng.')
    .weight(0.78)
    .effect({
      type: 'extra_point_on_win',
      points: 1,
      timing: 'during_combat',
      target: 'self',
      customHandler: 'divine_smite_ma_round'
    })
    .register();

  // Quas
  defineEffect('power', 'Quas')
    .description('Buff: +1 Strength. Có Quas+Wex+Exort: nhận Archetype Invoker.')
    .weight(0.78)
    .addStat('strength', 1)
    .effect({
      type: 'grant_archetype',
      grantName: 'Invoker',
      grantCount: 1,
      timing: 'immediate',
      target: 'self',
      triggerOnce: true,
      customHandler: 'quas_wex_exort_check'
    })
    .register();

  // Wex
  defineEffect('power', 'Wex')
    .description('Buff: +1 Speed. Có Quas+Wex+Exort: nhận Archetype Invoker.')
    .weight(0.78)
    .addStat('speed', 1)
    .effect({
      type: 'grant_archetype',
      grantName: 'Invoker',
      grantCount: 1,
      timing: 'immediate',
      target: 'self',
      triggerOnce: true,
      customHandler: 'quas_wex_exort_check'
    })
    .register();

  // Exort
  defineEffect('power', 'Exort')
    .description('Buff: +1 IQ. Có Quas+Wex+Exort: nhận Archetype Invoker.')
    .weight(0.78)
    .addStat('iq', 1)
    .effect({
      type: 'grant_archetype',
      grantName: 'Invoker',
      grantCount: 1,
      timing: 'immediate',
      target: 'self',
      triggerOnce: true,
      customHandler: 'quas_wex_exort_check'
    })
    .register();

  // Enlarging
  defineEffect('power', 'Enlarging')
    .description('+3 Str, +3 Dura, -6 Speed.')
    .weight(0.78)
    .addStat('strength', 3)
    .addStat('durability', 3)
    .addStat('speed', -6)
    .register();

  // Shrinking
  defineEffect('power', 'Shrinking')
    .description('+6 Speed, -3 Str, -3 Dura.')
    .weight(0.78)
    .addStat('speed', 6)
    .addStat('strength', -3)
    .addStat('durability', -3)
    .register();

  // Bloody Strike
  defineEffect('power', 'Bloody Strike')
    .description('-1 all stats. Sau combat: +1 vào mỗi stat thắng round.')
    .weight(0.78)
    .addAllStats(-1)
    .effect({
      type: 'stat_modifier',
      stat: 'random',
      value: 1,
      timing: 'after_combat',
      target: 'self',
      customHandler: 'bloody_strike_per_round_won'
    })
    .register();

  // Accelerating Sorcery
  defineEffect('power', 'Accelerating Sorcery')
    .description('Trong Combat: +1 IQ mỗi khi kích hoạt Power "Trong combat".')
    .weight(0.78)
    .effect({
      type: 'stat_modifier',
      stat: 'iq',
      value: 1,
      timing: 'during_combat',
      target: 'self',
      duration: 'combat',
      customHandler: 'accelerating_sorcery_count'
    })
    .register();

  // Homeguard
  defineEffect('power', 'Homeguard')
    .description('Trong Combat: Buff +3 Speed nếu không thua round Strength.')
    .weight(0.78)
    .effect({
      type: 'stat_modifier',
      stat: 'speed',
      value: 3,
      timing: 'during_combat',
      target: 'self',
      duration: 'combat',
      customHandler: 'homeguard_no_str_lose'
    })
    .register();

  // Bash
  defineEffect('power', 'Bash')
    .description('Trong combat: Sau mỗi round thắng, 35% đối thủ -3 stat round kế.')
    .weight(0.78)
    .effect({
      type: 'debuff',
      stat: 'random',
      value: -3,
      timing: 'on_round_win',
      target: 'opponent',
      conditions: [{ type: 'probability', chance: 35 }]
    })
    .register();

  // Gate to Heaven
  defineEffect('power', 'Gate to Heaven')
    .description('Khi ở nhánh thắng từ Vòng 32: +1 all stats.')
    .weight(0.78)
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'immediate',
      target: 'self',
      customHandler: 'gate_to_heaven_round_check'
    })
    .register();

  // Weapon Enhancing
  defineEffect('power', 'Weapon Enhancing')
    .description('+1 vào mỗi buff từ vũ khí, -1 vào mỗi debuff từ vũ khí.')
    .weight(0.78)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'weapon_enhancing_modify'
    })
    .register();

  // Fancy Feet
  defineEffect('power', 'Fancy Feet')
    .description('-1 Dura. Trước combat: Vô hiệu vũ khí và Rune đối phương.')
    .weight(0.78)
    .addStat('durability', -1)
    .effect({
      type: 'weapon_disable',
      timing: 'before_combat',
      target: 'opponent'
    })
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'opponent',
      customHandler: 'fancy_feet_disable_rune'
    })
    .register();
}
