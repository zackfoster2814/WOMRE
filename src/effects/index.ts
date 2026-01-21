/**
 * Effect System - Main Entry Point
 *
 * Hệ thống quản lý effects trong game Wheel of Multiverse.
 *
 * ## Cách sử dụng
 *
 * ### 1. Khởi tạo (một lần khi app start)
 * ```typescript
 * import { initializeEffectData } from './effects';
 * initializeEffectData();
 * ```
 *
 * ### 2. Tính toán effects cho character
 * ```typescript
 * import { EffectResolver } from './effects';
 *
 * const character = CharacterParser.parseCharacterFile(content);
 * const effects = EffectResolver.calculateCharacterEffects(character);
 *
 * console.log(effects.totalStats);      // Stats sau khi áp dụng effects
 * console.log(effects.statModifiers);   // Chi tiết các stat modifier
 * console.log(effects.immunities);      // Các immunity
 * ```
 *
 * ### 3. Parse effect từ text
 * ```typescript
 * import { parseEffect } from './effects';
 *
 * const effects = parseEffect('Nhận +2 Strength và +1 Speed');
 * // => [
 * //   { type: 'stat_modifier', stat: 'strength', value: 2, ... },
 * //   { type: 'stat_modifier', stat: 'speed', value: 1, ... }
 * // ]
 * ```
 *
 * ### 4. Đăng ký effect mới
 * ```typescript
 * import { defineEffect, statMod, grant } from './effects';
 *
 * defineEffect('power', 'My Custom Power')
 *   .description('Nhận +3 Strength và 1 random Quirk')
 *   .addStat('strength', 3)
 *   .grantQuirk()
 *   .register();
 * ```
 *
 * ### 5. Tra cứu effect
 * ```typescript
 * import { EffectRegistry } from './effects';
 *
 * const entry = EffectRegistry.get('rune', 'El');
 * console.log(entry.effects); // Effects của rune El
 *
 * const allRunes = EffectRegistry.getAllByType('rune');
 * ```
 *
 * ## Mở rộng
 *
 * Để thêm effect category mới:
 * 1. Tạo file trong `effects/data/` (vd: `powers.ts`)
 * 2. Định nghĩa effects bằng `defineEffect()`
 * 3. Export hàm `registerAllXxxEffects()`
 * 4. Import và gọi trong `effects/data/index.ts`
 *
 * ## Custom Handlers
 *
 * Một số effects phức tạp cần custom handler.
 * Handler được định nghĩa bằng `customHandler` property.
 * Implement handlers trong file riêng và register vào system.
 */

// Types
export type {
  StatName,
  DynamicStatTarget,
  CharacterStats,
  EffectTiming,
  EffectTarget,
  EffectType,
  ConditionType,
  Condition,
  Effect,
  EffectSourceType,
  EffectSource,
  EffectRegistryEntry,
  ResolvedEffect,
  CharacterEffects,
  CombatContext
} from './types';

// Registry
export {
  EffectRegistry,
  EffectEntryBuilder,
  defineEffect,
  // Helper functions
  statMod,
  grant,
  debuff,
  combatPoints,
  immune,
  // Condition helpers
  chance,
  whenStat,
  vsRace,
  inBracket,
  afterPvPWins,
  hasItem,
  opponentHas
} from './registry';

// Parser
export {
  EffectParser,
  parseEffect,
  parseFirstEffect
} from './parser';

// Resolver
export {
  EffectResolver,
  // Stat utilities
  STAT_NAMES,
  toEffectStats,
  cloneStats,
  emptyStats,
  findLowestStat,
  findHighestStat,
  resolveStatTarget,
  convertStats
} from './resolver';

// Data initialization
export {
  initializeEffectData,
  resetEffectData,
  isEffectDataInitialized
} from './data';
