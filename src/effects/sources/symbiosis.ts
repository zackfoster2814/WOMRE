/**
 * Symbiosis — Effect Definitions
 *
 * Gộp từ: src/effects/data/symbiosis.ts
 * Stats và hiệu ứng của các Symbiosis khi ký sinh vào vật chủ
 */

import { defineEffect } from '../registry';

// ============================================================================
// SYMBIOSIS EFFECT DEFINITIONS
// ============================================================================

export function registerSymbiosisEffects() {
  // 1. Mephisto - +2 STR, +2 SPD, +2 DUR, +2 MA
  defineEffect('symbiosis', 'Mephisto')
    .description('Sau combat: Vật chủ -1 IQ và -1 BIQ. Nhận thêm 1 Char Dev, 1 Archetype và 1 Quirk.')
    .addStat('strength', 2)
    .addStat('speed', 2)
    .addStat('durability', 2)
    .addStat('ma', 2)
    .register();

  // 2. Diablo - Wrath stack system
  defineEffect('symbiosis', 'Diablo')
    .description('Vật chủ khởi đầu với 2 stack "Wrath". +1 STR/BIQ/MA mỗi stack.')
    .effect({
      type: 'custom',
      customHandler: 'diablo_wrath_stacks',
      timing: 'immediate',
      target: 'self'
    })
    .register();

  // 3. Korrupt - +1 STR, +3 SPD, +1 BIQ, +3 MA
  defineEffect('symbiosis', 'Korrupt')
    .description('Sau combat thắng: 6.7% vật chủ mất kiểm soát.')
    .addStat('strength', 1)
    .addStat('speed', 3)
    .addStat('biq', 1)
    .addStat('ma', 3)
    .register();

  // 4. Greed - -2 tất cả
  defineEffect('symbiosis', 'Greed')
    .description('Trong PvE và sau combat thắng: Nhận phần thưởng 2 lần.')
    .addAllStats(-2)
    .register();

  // 5. Angelica - +2 IQ
  defineEffect('symbiosis', 'Angelica')
    .description('Sau combat: +2 IQ. Khi IQ đạt 20, +1 all stats.')
    .addStat('iq', 2)
    .register();

  // 6. The Six Seven - +6 STR, -7 SPD, +6 DUR, -7 IQ, +6 BIQ, -7 MA
  defineEffect('symbiosis', 'The Six Seven')
    .description('Trong Combat: +1 điểm khi thắng round Speed, IQ, MA. Tiebreak: 67% thắng.')
    .addStat('strength', 6)
    .addStat('speed', -7)
    .addStat('durability', 6)
    .addStat('iq', -7)
    .addStat('biq', 6)
    .addStat('ma', -7)
    .register();

  // New season symbiosis
  // 1. Voidling - +2 STR, +2 SPD, +2 DUR, +2 MA
  defineEffect('symbiosis', 'Voidling')
    .description('Vật chủ -1 IQ và -1 BIQ sau mỗi combat PvP. Nhận 1 Char Dev, 1 Archetype và 1 Quirk.')
    .addStat('strength', 2)
    .addStat('speed', 2)
    .addStat('durability', 2)
    .addStat('ma', 2)
    .register();

  // 2. Fury - +2 STR, +2 BIQ, +2 MA
  defineEffect('symbiosis', 'Fury')
    .description('Sau Combat thắng: +1 STR/BIQ/MA. Thua: -1 STR/BIQ/MA.')
    .addStat('strength', 2)
    .addStat('biq', 2)
    .addStat('ma', 2)
    .register();
}
