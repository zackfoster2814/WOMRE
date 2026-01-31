/**
 * Effect Data Index
 *
 * Tập trung đăng ký tất cả effect data vào registry
 */

import { registerAllRuneEffects } from './runes';
import { registerAllRaceEffects } from './races';
import { registerAllArchetypeEffects } from './archetypes';
import { registerAllQuirkEffects } from './quirks';
import { registerAllPowerEffects } from './powers';
import { registerAllWeaponEffects } from './weapons';
import { registerAllHouseEffects } from './houses';
import { registerAllGearEffects } from './gears';
import { registerUmaParentEffects } from './uma-parents';
import { registerCharDevEffects } from './char-devs';
import { registerSymbiosisEffects } from './symbiosis';
import { registerPvPRewardEffects } from './pvp-rewards';

// Flags to prevent double registration
let isInitialized = false;

/**
 * Initialize all effect data
 * Call this once at app startup
 */
export function initializeEffectData(): void {
  if (isInitialized) {
    console.warn('Effect data already initialized');
    return;
  }

  // Register all effect categories
  registerAllRuneEffects();
  registerAllRaceEffects();
  registerAllArchetypeEffects();
  registerAllQuirkEffects();
  registerAllPowerEffects();
  registerAllWeaponEffects();
  registerAllHouseEffects();
  registerAllGearEffects();
  registerUmaParentEffects();
  registerCharDevEffects();
  registerSymbiosisEffects();
  registerPvPRewardEffects();

  isInitialized = true;
  console.log('Effect data initialized successfully');
}

/**
 * Reset effect data (useful for testing)
 */
export function resetEffectData(): void {
  // Import registry here to avoid circular dependency
  const { EffectRegistry } = require('../registry');
  EffectRegistry.clear();
  isInitialized = false;
}

/**
 * Check if effect data is initialized
 */
export function isEffectDataInitialized(): boolean {
  return isInitialized;
}

// Re-export individual registration functions for selective loading
export { registerAllRuneEffects } from './runes';
export { registerAllRaceEffects } from './races';
export { registerAllArchetypeEffects } from './archetypes';
export { registerAllQuirkEffects } from './quirks';
export { registerAllPowerEffects } from './powers';
export { registerAllWeaponEffects } from './weapons';
export { registerAllHouseEffects } from './houses';
export { registerAllGearEffects } from './gears';
export { registerUmaParentEffects } from './uma-parents';
export { registerCharDevEffects } from './char-devs';
export { registerSymbiosisEffects } from './symbiosis';
export { registerPvPRewardEffects } from './pvp-rewards';
