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
import { registerQuirkHandlers } from '../sources/quirk';
import { registerPowerHandlers } from '../sources/power';
import { registerRaceHandlers } from '../sources/race';
import { registerWeaponHandlers } from '../sources/weapon';
import { registerArchetypeHandlers } from '../sources/archetype';
import { registerGearHandlers } from '../sources/gear';
import { registerCharDevHandlers } from '../sources/char-dev';
import { registerCombatHandlers } from './combat/combat-handlers';
import { registerPowerCombatHandlers } from '../sources/power';
import { registerRaceCombatHandlers } from '../sources/race';
import { registerArchetypeCombatHandlers } from '../sources/archetype';
import { registerHouseImmediateHandlers, registerHouseCombatHandlers } from '../sources/house';
import { registerGearCombatHandlers } from '../sources/gear';
import { registerWeaponCombatHandlers } from '../sources/weapon';
import { registerRuneCombatHandlers } from '../sources/rune';
import { registerCharDevCombatHandlers } from '../sources/char-dev';
import { registerQuirkCombatHandlers } from '../sources/quirk';

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

  // Register house handler categories
  registerHouseImmediateHandlers();
  registerHouseCombatHandlers();

  // Register gear combat handlers
  registerGearCombatHandlers();

  // Register weapon combat handlers
  registerWeaponCombatHandlers();

  // Register rune/runeword combat handlers
  registerRuneCombatHandlers();

  // Register char dev and uma parent combat handlers
  registerCharDevCombatHandlers();

  // Register quirk combat handlers
  registerQuirkCombatHandlers();

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
