/**
 * Archetype Effects Data
 *
 * Nguồn: wheelofmultiverse-ss3.xlsx - Sheet "Archetype"
 */

import { defineEffect } from '../registry';

export function registerAllArchetypeEffects() {
  // Egoist
  defineEffect('archetype', 'Egoist')
    .description('Nhận +2 all stats. Nếu không thắng với cách biệt 4 điểm trở lên, bạn sẽ thua.')
    .weight(1.6)
    .addAllStats(2)
    .effect({
      type: 'custom',
      timing: 'after_combat',
      target: 'self',
      customHandler: 'egoist_win_condition'
    })
    .register();

  // NPC
  defineEffect('archetype', 'NPC')
    .description('-1 all stats và không thể có Character Development.')
    .weight(3)
    .addAllStats(-1)
    .effect({
      type: 'immunity',
      immuneTo: ['grant_char_dev'],
      timing: 'immediate',
      target: 'self'
    })
    .register();

  // Gigachad
  defineEffect('archetype', 'Gigachad')
    .description('+1 all stats vs tộc thứ hạng cao hơn, -1 all stats vs tộc thứ hạng thấp hơn.')
    .weight(2.4)
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'during_combat',
      target: 'self',
      conditions: [{ type: 'race_tier_compare', tierOperator: '<' }] // Self tier < opponent tier
    })
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: -1,
      timing: 'during_combat',
      target: 'self',
      conditions: [{ type: 'race_tier_compare', tierOperator: '>' }] // Self tier > opponent tier
    })
    .register();

  // Slayer
  defineEffect('archetype', 'Slayer')
    .description('Chọn 1 tộc để Slay. Vs tộc đó: +2 Str, +3 BIQ, +2 MA.')
    .weight(2)
    .effect({
      type: 'stat_modifier',
      stat: 'strength',
      value: 2,
      timing: 'during_combat',
      target: 'self',
      customHandler: 'slayer_race_check'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'biq',
      value: 3,
      timing: 'during_combat',
      target: 'self',
      customHandler: 'slayer_race_check'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'ma',
      value: 2,
      timing: 'during_combat',
      target: 'self',
      customHandler: 'slayer_race_check'
    })
    .register();

  // Masochist
  defineEffect('archetype', 'Masochist')
    .description('Sau combat thua: Nhận 1 Power và +1 all stats.')
    .weight(1.4)
    .effect({
      type: 'grant_power',
      grantType: 'power',
      grantName: 'random',
      grantCount: 1,
      timing: 'after_combat_lose',
      target: 'self'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'after_combat_lose',
      target: 'self'
    })
    .register();

  // Femboy
  defineEffect('archetype', 'Femboy')
    .description('Mặc định có Power "AIDS". +1 all stats với mỗi Lover có AIDS.')
    .weight(1.2)
    .effect({
      type: 'grant_power',
      grantType: 'power',
      grantName: 'AIDS',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'immediate',
      target: 'self',
      customHandler: 'femboy_lover_aids_count'
    })
    .register();

  // Pacifist
  defineEffect('archetype', 'Pacifist')
    .description('+2 IQ và -4 MA.')
    .weight(1.1)
    .addStat('iq', 2)
    .addStat('ma', -4)
    .register();

  // Anti-Social
  defineEffect('archetype', 'Anti-Social')
    .description('[PvE] -5 all stats. [PvP] +1 all stats.')
    .weight(1.6)
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: -5,
      timing: 'pve_only',
      target: 'self'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'during_combat',
      target: 'self',
      conditions: [{ type: 'always' }] // PvP check in resolver
    })
    .register();

  // Bookworm
  defineEffect('archetype', 'Bookworm')
    .description('+2 IQ và 1 Gear "Sổ tay".')
    .weight(2.5)
    .addStat('iq', 2)
    .effect({
      type: 'grant_gear',
      grantType: 'gear',
      grantName: 'Sổ tay',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .register();

  // Glass Cannon
  defineEffect('archetype', 'Glass Cannon')
    .description('Mặc định thua round Durability, +1 all stats.')
    .weight(1.5)
    .addAllStats(1)
    .effect({
      type: 'auto_lose_round',
      stat: 'durability',
      timing: 'during_combat',
      target: 'self'
    })
    .register();

  // Mid
  defineEffect('archetype', 'Mid')
    .description('Toàn bộ vòng quay stats có giá trị là 5.')
    .weight(2.3)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'mid_stats_five'
    })
    .register();

  // Hand Fighter
  defineEffect('archetype', 'Hand Fighter')
    .description('Không thể nhận vũ khí. +3 Str, +2 Dur, +2 MA.')
    .weight(2.4)
    .effect({
      type: 'immunity',
      immuneTo: ['grant_weapon'],
      timing: 'immediate',
      target: 'self'
    })
    .addStat('strength', 3)
    .addStat('durability', 2)
    .addStat('ma', 2)
    .register();

  // Conquerer
  defineEffect('archetype', 'Conquerer')
    .description('+3 Base Speed. Thắng round Speed: +1 all stats trong combat.')
    .weight(2.2)
    .addStat('speed', 3, true)
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'during_combat',
      target: 'self',
      duration: 'combat',
      customHandler: 'conquerer_speed_win'
    })
    .register();

  // Paladin
  defineEffect('archetype', 'Paladin')
    .description('Nhận Power "Divine Smite", +2 Base MA.')
    .weight(2.2)
    .effect({
      type: 'grant_power',
      grantType: 'power',
      grantName: 'Divine Smite',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .addStat('ma', 2, true)
    .register();

  // Him
  defineEffect('archetype', 'Him')
    .description('+10 all stats, đối thủ nhận 5 điểm ở cuối combat.')
    .weight(1.3)
    .addAllStats(10)
    .effect({
      type: 'combat_points',
      points: 5,
      timing: 'after_combat',
      target: 'opponent'
    })
    .register();

  // Perfectionist
  defineEffect('archetype', 'Perfectionist')
    .description('+4 stat thấp nhất nếu thắng với cách biệt ≥4 điểm.')
    .weight(2.4)
    .effect({
      type: 'stat_modifier',
      stat: 'lowest',
      value: 4,
      timing: 'after_combat_win',
      target: 'self',
      customHandler: 'perfectionist_dominate_check'
    })
    .register();

  // Chokevy
  defineEffect('archetype', 'Chokevy')
    .description('+3 all stats.')
    .weight(2)
    .addAllStats(3)
    .register();

  // Dual Wielder
  defineEffect('archetype', 'Dual Wielder')
    .description('-3 Strength. Dùng được 2 vũ khí.')
    .weight(1.7)
    .addStat('strength', -3)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'dual_wielder_two_weapons'
    })
    .register();

  // Zealot
  defineEffect('archetype', 'Zealot')
    .description('Sau Combat: Mỗi round thua, +1 stat thấp nhất.')
    .weight(1.1)
    .effect({
      type: 'stat_modifier',
      stat: 'lowest',
      value: 1,
      timing: 'after_combat',
      target: 'self',
      customHandler: 'zealot_per_round_lost'
    })
    .register();

  // Atheist
  defineEffect('archetype', 'Atheist')
    .description('Trước combat: +1 điểm vs God và Demi-God.')
    .weight(2)
    .effect({
      type: 'combat_points',
      points: 1,
      timing: 'before_combat',
      target: 'self',
      conditions: [{ type: 'race_match', races: ['God', 'Demi-God'] }]
    })
    .register();

  // Devotee
  defineEffect('archetype', 'Devotee')
    .description('+1 điểm khởi đầu vs Demon/Vampire/Spirit/Orc/Skeleton/Goblin. Thua ngay vs God/Demi-God.')
    .weight(2)
    .effect({
      type: 'combat_points',
      points: 1,
      timing: 'before_combat',
      target: 'self',
      conditions: [{ type: 'race_match', races: ['Demon', 'Vampire', 'Spirit', 'Orc', 'Skeleton', 'Goblin'] }]
    })
    .effect({
      type: 'custom',
      timing: 'before_combat',
      target: 'self',
      customHandler: 'devotee_auto_lose_vs_god'
    })
    .register();

  // Follower of the Two Fingers
  defineEffect('archetype', 'Follower of the Two Fingers')
    .description('Sau combat: -1 IQ, -1 BIQ, cướp 1 Power từ player ngẫu nhiên.')
    .weight(1.8)
    .effect({
      type: 'stat_modifier',
      stat: 'iq',
      value: -1,
      timing: 'after_combat',
      target: 'self'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'biq',
      value: -1,
      timing: 'after_combat',
      target: 'self'
    })
    .effect({
      type: 'steal_power',
      grantCount: 1,
      timing: 'after_combat',
      target: 'random_player'
    })
    .register();
}
