/**
 * House Effects Data
 *
 * Nguồn: wheelofmultiverse-ss3.xlsx - Sheet "Houses" và "Houses Feature"
 */

import { defineEffect } from '../registry';

export function registerAllHouseEffects() {
  // Tracen Academy (Uma default house)
  defineEffect('house', 'Tracen Academy')
    .description('+1 Strength, +3 Speed, +2 Durability.')
    .addStat('strength', 1)
    .addStat('speed', 3)
    .addStat('durability', 2)
    .register();

  // Naga (Merfolk default house)
  defineEffect('house', 'Naga')
    .description('+2 Speed, +2 Durability.')
    .addStat('speed', 2)
    .addStat('durability', 2)
    .register();

  // Ban Nhạc Ngọt Đoàn Kết
  defineEffect('house', 'Ban Nhạc Ngọt Đoàn Kết')
    .description('Nhận Gear "Bò khô". +1 BIQ với mỗi thành viên trong house.')
    .effect({
      type: 'grant_gear',
      grantType: 'gear',
      grantName: 'Bò khô',
      grantCount: 1,
      timing: 'immediate',
      target: 'self'
    })
    .effect({
      type: 'stat_modifier',
      stat: 'biq',
      value: 1,
      timing: 'immediate',
      target: 'self',
      customHandler: 'house_biq_per_member'
    })
    .register();

  // House Phoenix
  defineEffect('house', 'House Phoenix')
    .description('+2 Speed, +1 IQ. Sau khi bị loại: hồi sinh 1 lần với 50% stats.')
    .addStat('speed', 2)
    .addStat('iq', 1)
    .effect({
      type: 'custom',
      timing: 'on_death',
      target: 'self',
      triggerOnce: true,
      customHandler: 'house_phoenix_revive'
    })
    .register();

  // House Dragon
  defineEffect('house', 'House Dragon')
    .description('+3 Strength, +1 Durability.')
    .addStat('strength', 3)
    .addStat('durability', 1)
    .register();

  // House Vampire
  defineEffect('house', 'House Vampire')
    .description('+2 Speed, +1 IQ, +1 BIQ.')
    .addStat('speed', 2)
    .addStat('iq', 1)
    .addStat('biq', 1)
    .register();

  // House Wolf
  defineEffect('house', 'House Wolf')
    .description('+2 Strength, +2 Speed.')
    .addStat('strength', 2)
    .addStat('speed', 2)
    .register();

  // House Bear
  defineEffect('house', 'House Bear')
    .description('+2 Strength, +2 Durability.')
    .addStat('strength', 2)
    .addStat('durability', 2)
    .register();

  // House Eagle
  defineEffect('house', 'House Eagle')
    .description('+2 Speed, +2 BIQ.')
    .addStat('speed', 2)
    .addStat('biq', 2)
    .register();

  // House Serpent
  defineEffect('house', 'House Serpent')
    .description('+2 Speed, +2 IQ.')
    .addStat('speed', 2)
    .addStat('iq', 2)
    .register();

  // House Lion
  defineEffect('house', 'House Lion')
    .description('+3 Strength, +1 MA.')
    .addStat('strength', 3)
    .addStat('ma', 1)
    .register();

  // House Turtle
  defineEffect('house', 'House Turtle')
    .description('+4 Durability.')
    .addStat('durability', 4)
    .register();

  // House Owl
  defineEffect('house', 'House Owl')
    .description('+2 IQ, +2 BIQ.')
    .addStat('iq', 2)
    .addStat('biq', 2)
    .register();

  // House Tiger
  defineEffect('house', 'House Tiger')
    .description('+2 Strength, +1 Speed, +1 MA.')
    .addStat('strength', 2)
    .addStat('speed', 1)
    .addStat('ma', 1)
    .register();

  // House Monkey
  defineEffect('house', 'House Monkey')
    .description('+2 Speed, +2 MA.')
    .addStat('speed', 2)
    .addStat('ma', 2)
    .register();

  // House Elephant
  defineEffect('house', 'House Elephant')
    .description('+2 Strength, +3 Durability, -1 Speed.')
    .addStat('strength', 2)
    .addStat('durability', 3)
    .addStat('speed', -1)
    .register();

  // House Fox
  defineEffect('house', 'House Fox')
    .description('+2 Speed, +1 IQ, +1 BIQ.')
    .addStat('speed', 2)
    .addStat('iq', 1)
    .addStat('biq', 1)
    .register();

  // House Raven
  defineEffect('house', 'House Raven')
    .description('+1 Speed, +2 IQ, +1 BIQ.')
    .addStat('speed', 1)
    .addStat('iq', 2)
    .addStat('biq', 1)
    .register();

  // House Spider
  defineEffect('house', 'House Spider')
    .description('+1 Speed, +1 IQ, +1 BIQ, +1 MA.')
    .addStat('speed', 1)
    .addStat('iq', 1)
    .addStat('biq', 1)
    .addStat('ma', 1)
    .register();

  // House Scorpion
  defineEffect('house', 'House Scorpion')
    .description('+1 Speed, +1 Durability, +2 MA.')
    .addStat('speed', 1)
    .addStat('durability', 1)
    .addStat('ma', 2)
    .register();

  // House Shark
  defineEffect('house', 'House Shark')
    .description('+2 Strength, +1 Speed, +1 Durability.')
    .addStat('strength', 2)
    .addStat('speed', 1)
    .addStat('durability', 1)
    .register();

  // House Panther
  defineEffect('house', 'House Panther')
    .description('+3 Speed, +1 MA.')
    .addStat('speed', 3)
    .addStat('ma', 1)
    .register();

  // House Boar
  defineEffect('house', 'House Boar')
    .description('+2 Strength, +2 Durability.')
    .addStat('strength', 2)
    .addStat('durability', 2)
    .register();

  // House Crow
  defineEffect('house', 'House Crow')
    .description('+2 IQ, +1 BIQ, +1 MA.')
    .addStat('iq', 2)
    .addStat('biq', 1)
    .addStat('ma', 1)
    .register();

  // House Hawk
  defineEffect('house', 'House Hawk')
    .description('+2 Speed, +1 BIQ, +1 MA.')
    .addStat('speed', 2)
    .addStat('biq', 1)
    .addStat('ma', 1)
    .register();
}
