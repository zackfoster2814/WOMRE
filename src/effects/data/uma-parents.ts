/**
 * Uma Parents (Sub-race) Effects Data
 *
 * Nguồn: wheelofmultiverse-ss3.xlsx - Sheet "Sub-race wheel"
 */

import { defineEffect } from '../registry';

export function registerUmaParentEffects() {
  // Maruzensky
  defineEffect('sub_race', 'Maruzensky')
    .description('Nhận Power "Red Shift/LP1211-M".')
    .weight(4.8)
    .effect({
      type: 'grant_power',
      grantType: 'power',
      grantName: 'Red Shift/LP1211-M',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .register();

  // Mejiro Ryan
  defineEffect('sub_race', 'Mejiro Ryan')
    .description('Nhận Power "Let\'s Pump Some Iron!"')
    .weight(4.8)
    .effect({
      type: 'grant_power',
      grantType: 'power',
      grantName: "Let's Pump Some Iron!",
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .register();

  // Taiki Shuttle
  defineEffect('sub_race', 'Taiki Shuttle')
    .description('Nhận Power "Shooting for Victory".')
    .weight(4.8)
    .effect({
      type: 'grant_power',
      grantType: 'power',
      grantName: 'Shooting for Victory',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .register();

  // Haru Urara
  defineEffect('sub_race', 'Haru Urara')
    .description('-1 all stats. Nếu còn sống tới vòng 32: +2 all stats.')
    .weight(4.8)
    .addAllStats(-1)
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 3, // +3 to become +2 total
      timing: 'immediate',
      target: 'self',
      customHandler: 'haru_urara_round_32_check'
    })
    .register();

  // Oguri Cap
  defineEffect('sub_race', 'Oguri Cap')
    .description('+1 Strength và +2 Speed.')
    .weight(4.8)
    .addStat('strength', 1)
    .addStat('speed', 2)
    .register();

  // Gold Ship
  defineEffect('sub_race', 'Gold Ship')
    .description('Nhận Quirk "Training Restricted". 50% +1 all / 50% -1 all trong combat.')
    .weight(4.8)
    .effect({
      type: 'grant_quirk',
      grantType: 'quirk',
      grantName: 'Training Restricted',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'during_combat',
      target: 'self',
      conditions: [{ type: 'probability', chance: 50 }]
    })
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: -1,
      timing: 'during_combat',
      target: 'self',
      conditions: [{ type: 'probability', chance: 50 }]
    })
    .register();

  // Symboli Rudolf
  defineEffect('sub_race', 'Symboli Rudolf')
    .description('Sau 3 PvP thắng đầu: +1 all. Thắng chung kết nhánh thắng: +1 all nữa.')
    .weight(4.8)
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'after_combat_win',
      target: 'self',
      conditions: [{ type: 'pvp_win_count', winCount: 3, winCountOperator: '=' }],
      triggerOnce: true
    })
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'after_combat_win',
      target: 'self',
      customHandler: 'symboli_rudolf_finals_winner'
    })
    .register();

  // Silence Suzuka
  defineEffect('sub_race', 'Silence Suzuka')
    .description('+6 Speed và -3 Dura.')
    .weight(4.8)
    .addStat('speed', 6)
    .addStat('durability', -3)
    .register();

  // Mejiro McQueen
  defineEffect('sub_race', 'Mejiro McQueen')
    .description('+3 Durability.')
    .weight(4.8)
    .addStat('durability', 3)
    .register();

  // Mihono Bourbon
  defineEffect('sub_race', 'Mihono Bourbon')
    .description('+1 Strength và +2 Durability.')
    .weight(4.8)
    .addStat('strength', 1)
    .addStat('durability', 2)
    .register();

  // Tokai Teio
  defineEffect('sub_race', 'Tokai Teio')
    .description('Gấp đôi Base Speed khi dùng nhạc cụ làm vũ khí.')
    .weight(4.8)
    .effect({
      type: 'stat_multiply',
      stat: 'speed',
      value: 2,
      isBase: true,
      timing: 'immediate',
      target: 'self',
      customHandler: 'tokai_teio_instrument_check'
    })
    .register();

  // Agnes Tachyon
  defineEffect('sub_race', 'Agnes Tachyon')
    .description('Nhận Power "U=ma2".')
    .weight(4.8)
    .effect({
      type: 'grant_power',
      grantType: 'power',
      grantName: 'U=ma2',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .register();

  // Nice Nature
  defineEffect('sub_race', 'Nice Nature')
    .description('Trong combat: Nếu cả hai đều có 3 điểm, bỏ qua Tie-Break và thắng.')
    .weight(4.8)
    .effect({
      type: 'custom',
      timing: 'during_combat',
      target: 'self',
      customHandler: 'nice_nature_auto_win_tie'
    })
    .register();

  // Special Week
  defineEffect('sub_race', 'Special Week')
    .description('50% nhận Power "Gourmand" hoặc 50% nhận Power "Hydrate".')
    .weight(4.8)
    .effect({
      type: 'grant_power',
      grantType: 'power',
      grantName: 'Gourmand',
      grantCount: 1,
      timing: 'immediate',
      target: 'self',
      conditions: [{ type: 'probability', chance: 50 }]
    })
    .effect({
      type: 'grant_power',
      grantType: 'power',
      grantName: 'Hydrate',
      grantCount: 1,
      timing: 'immediate',
      target: 'self',
      conditions: [{ type: 'probability', chance: 50 }]
    })
    .register();

  // Rice Shower
  defineEffect('sub_race', 'Rice Shower')
    .description('+1 all stats ở nhánh thua, hết hiệu lực khi tới chung kết.')
    .weight(4.8)
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'immediate',
      target: 'self',
      conditions: [{ type: 'bracket', bracket: 'loser' }],
      customHandler: 'rice_shower_not_finals'
    })
    .register();

  // Mayano Top Gun
  defineEffect('sub_race', 'Mayano Top Gun')
    .description('+2 Durability và +1 BIQ.')
    .weight(4.8)
    .addStat('durability', 2)
    .addStat('biq', 1)
    .register();

  // Biwa Hayahide
  defineEffect('sub_race', 'Biwa Hayahide')
    .description('+2 IQ và +1 BIQ.')
    .weight(4.8)
    .addStat('iq', 2)
    .addStat('biq', 1)
    .register();

  // El Condor Pasa
  defineEffect('sub_race', 'El Condor Pasa')
    .description('Sau mỗi PvP thắng Round Dura: +3 Speed, +3 Strength trong combat kế.')
    .weight(4.8)
    .effect({
      type: 'stat_modifier',
      stat: 'speed',
      value: 3,
      timing: 'during_combat',
      target: 'self',
      duration: 'combat',
      customHandler: 'el_condor_pasa_dura_win'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'strength',
      value: 3,
      timing: 'during_combat',
      target: 'self',
      duration: 'combat',
      customHandler: 'el_condor_pasa_dura_win'
    })
    .register();

  // Nagi
  defineEffect('sub_race', 'Nagi')
    .description('Nhận thêm 2 Char Dev ngẫu nhiên khi quay vòng quay Char Dev.')
    .weight(4.4)
    .effect({
      type: 'custom',
      timing: 'immediate',
      target: 'self',
      customHandler: 'nagi_extra_char_dev'
    })
    .register();

  // Mork
  defineEffect('sub_race', 'Mork')
    .description('Thắng Round +2 điểm, thua Round mất hết điểm. +2 BIQ.')
    .weight(4.4)
    .addStat('biq', 2)
    .effect({
      type: 'extra_point_on_win',
      points: 1, // Total 2 points per win (1 normal + 1 extra)
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

  // Seiun Sky
  defineEffect('sub_race', 'Seiun Sky')
    .description('Nhận Power "Angling and Scheming".')
    .weight(4.8)
    .effect({
      type: 'grant_power',
      grantType: 'power',
      grantName: 'Angling and Scheming',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .register();
}
