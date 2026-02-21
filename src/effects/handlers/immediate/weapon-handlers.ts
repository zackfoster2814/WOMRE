/**
 * Weapon-based Immediate Handlers
 *
 * Handlers cho các Weapon effects.
 */

import { registerImmediateHandler } from '../registry';
import type { ImmediateHandlerContext, ImmediateHandlerResult } from '../types';

// ============================================================================
// INFINITY GAUNTLET - Grant 6 Infinity Stones to random players
// ============================================================================

/**
 * Infinity Gauntlet - Quay 6 người chơi nhận đá vô cực.
 */
registerImmediateHandler(
  'infinity_gauntlet_stones',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Infinity Gauntlet: Quay 6 người chơi nhận 6 Infinity Stones. Khi bị loại, đá trở về Gauntlet.',
    };
  },
  'Distribute 6 Infinity Stones to random players'
);

export function registerWeaponHandlers(): void {
  console.log('Weapon handlers registered');
}
