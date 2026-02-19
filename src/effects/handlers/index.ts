/**
 * Custom Handlers Entry Point
 *
 * Export và initialize tất cả custom handlers.
 */

// Types
export type {
  ImmediateHandlerContext,
  ImmediateHandlerResult,
  CombatHandlerContext,
  CombatHandlerResult,
  ImmediateHandler,
  CombatHandler,
  CustomHandler,
  HandlerMetadata,
} from './types';

// Registry
export {
  HandlerRegistry,
  registerImmediateHandler,
  registerCombatHandler,
} from './registry';

// Import handler modules to register them
import { registerStatHandlers } from './immediate/stat-handlers';
import { registerQuirkHandlers } from './immediate/quirk-handlers';
import { registerPowerHandlers } from './immediate/power-handlers';
import { registerRaceHandlers } from './immediate/race-handlers';
import { registerWeaponHandlers } from './immediate/weapon-handlers';
import { registerArchetypeHandlers } from './immediate/archetype-handlers';
import { registerGearHandlers } from './immediate/gear-handlers';
import { registerCharDevHandlers } from './immediate/chardev-handlers';
import { registerCombatHandlers } from './combat/combat-handlers';
import { registerPowerCombatHandlers } from './combat/power-combat-handlers';
import { registerRaceCombatHandlers } from './combat/race-combat-handlers';
import { registerArchetypeCombatHandlers } from './combat/archetype-combat-handlers';

let isInitialized = false;

/**
 * Initialize all custom handlers
 * Call this once at app startup, after effect data is initialized
 */
export function initializeHandlers(): void {
  if (isInitialized) {
    console.warn('Handlers already initialized');
    return;
  }

  // Register all immediate handler categories
  registerStatHandlers();
  registerQuirkHandlers();
  registerPowerHandlers();
  registerRaceHandlers();
  registerWeaponHandlers();
  registerArchetypeHandlers();
  registerGearHandlers();
  registerCharDevHandlers();

  // Register all combat handler categories
  registerCombatHandlers();
  registerPowerCombatHandlers();
  registerRaceCombatHandlers();
  registerArchetypeCombatHandlers();

  isInitialized = true;
  console.log('Custom handlers initialized');
}

/**
 * Check if handlers are initialized
 */
export function isHandlersInitialized(): boolean {
  return isInitialized;
}

/**
 * Reset handlers (for testing)
 */
export function resetHandlers(): void {
  const { HandlerRegistry } = require('./registry');
  HandlerRegistry.clear();
  isInitialized = false;
}
