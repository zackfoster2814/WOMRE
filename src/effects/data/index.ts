/**
 * Effect Data Index
 *
 * Tập trung đăng ký tất cả effect data vào registry
 */

import { registerAllRuneEffects } from '../sources/rune';
import { registerAllRaceEffects, registerUmaParentEffects } from '../sources/race';
import { registerAllArchetypeEffects } from '../sources/archetype';
import { registerAllQuirkEffects } from '../sources/quirk';
import { registerAllPowerEffects } from '../sources/power';
import { registerAllWeaponEffects } from '../sources/weapon';
import { registerAllHouseEffects } from '../sources/house';
import { registerAllGearEffects } from '../sources/gear';
import { registerCharDevEffects } from '../sources/char-dev';
import { registerSymbiosisEffects } from '../sources/symbiosis';
import { registerPvPRewardEffects } from '../sources/pvp-reward';
import { initializeHandlers } from '../handlers';

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

  // Initialize custom handlers
  initializeHandlers();

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
export { registerAllRuneEffects } from '../sources/rune';
export { registerAllRaceEffects, registerUmaParentEffects } from '../sources/race';
export { registerAllArchetypeEffects } from '../sources/archetype';
export { registerAllQuirkEffects } from '../sources/quirk';
export { registerAllPowerEffects } from '../sources/power';
export { registerAllWeaponEffects } from '../sources/weapon';
export { registerAllHouseEffects } from '../sources/house';
export { registerAllGearEffects } from '../sources/gear';
export { registerCharDevEffects } from '../sources/char-dev';
export { registerSymbiosisEffects } from '../sources/symbiosis';
export { registerPvPRewardEffects } from '../sources/pvp-reward';
