/**
 * Custom Handler Types
 *
 * Định nghĩa types cho custom effect handlers.
 */

import type { Character } from '../../types/character';
import type { CharacterStats, Effect, EffectSource, StatName } from '../types';

// ============================================================================
// HANDLER CONTEXT - Thông tin context cho handler
// ============================================================================

/**
 * Context cho immediate handlers (tính stats)
 */
export interface ImmediateHandlerContext {
  character: Character;
  baseStats: CharacterStats;
  currentStats: CharacterStats;
  source: EffectSource;
  effect: Effect;
}

/**
 * Round results type
 */
export type RoundResult = 'win' | 'lose' | 'tie' | undefined;

/**
 * Round results for all stats
 */
export interface RoundResults {
  strength?: RoundResult;
  speed?: RoundResult;
  durability?: RoundResult;
  iq?: RoundResult;
  biq?: RoundResult;
  ma?: RoundResult;
  [key: string]: RoundResult;
}

/**
 * Context cho combat handlers
 */
export interface CombatHandlerContext {
  self: {
    character: Character;
    stats: CharacterStats;
    baseStats: CharacterStats;
    race: string;
    raceTier: number;
    bracket: string;
    pvpWins: number;
    hasLover: boolean;
    powers: string[];
    quirks: string[];
    weapons: any[];
    gears: string[];
    roundsWon: number;
    roundsLost: number;
    duringCombatActivations?: number;
  };
  opponent?: {
    character: Character;
    stats: CharacterStats;
    baseStats: CharacterStats;
    race: string;
    raceTier: number;
    hasLover: boolean;
    lover?: string | string[];
    powers: any[];
    quirks: string[];
    weapons: any[];
    gears: string[];
  };
  isFinals: boolean;
  isPvE: boolean;
  currentRound: number;
  totalRounds: number;
  bracket?: string;
  roundResults?: RoundResults;
}

// ============================================================================
// HANDLER RESULTS - Kết quả trả về từ handler
// ============================================================================

/**
 * Kết quả từ immediate handler
 */
export interface ImmediateHandlerResult {
  // Stat modifications
  statModifiers?: Array<{
    stat: StatName;
    value: number;
    isBase?: boolean;
  }>;

  // Skip default effect processing
  skipDefault?: boolean;

  // Additional info for display
  description?: string;
}

/**
 * Kết quả từ combat handler
 */
export interface CombatHandlerResult {
  // Stat modifications during combat
  selfStatMods?: Array<{
    stat: StatName;
    value: number;
  }>;
  opponentStatMods?: Array<{
    stat: StatName;
    value: number;
  }>;

  // Combat points
  selfPoints?: number;
  opponentPoints?: number;

  // Special effects
  autoWin?: boolean;
  autoLose?: boolean;
  skipRound?: boolean;
  opponentWeaponDisabled?: boolean;
  opponentIsekai?: boolean;

  // Grant items after combat
  grantPower?: string;
  grantGear?: string;
  grantQuirk?: string;

  // Remove items
  removePower?: string;
  removeGear?: string;
  removeWeapon?: string;

  // Skip default effect processing
  skipDefault?: boolean;

  // Description for log
  description?: string;
}

// ============================================================================
// HANDLER FUNCTION TYPES
// ============================================================================

/**
 * Immediate handler function type
 * Called during stat calculation
 */
export type ImmediateHandler = (
  context: ImmediateHandlerContext
) => ImmediateHandlerResult | null;

/**
 * Combat handler function type
 * Called during combat resolution
 */
export type CombatHandler = (
  context: CombatHandlerContext
) => CombatHandlerResult | null;

/**
 * Handler can be either immediate or combat type
 */
export type CustomHandler = ImmediateHandler | CombatHandler;

// ============================================================================
// HANDLER METADATA
// ============================================================================

export interface HandlerMetadata {
  name: string;
  description?: string;
  type: 'immediate' | 'combat' | 'both';
  handler: CustomHandler;
}
