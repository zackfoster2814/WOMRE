/**
 * Player Configuration (REFACTORED)
 */

import { WheelFactory } from '@/services/WheelFactory';

/**
 * Get player wheel (lazy loaded)
 */
export async function getPlayerWheel() {
  return WheelFactory.createPlayerWheel();
}
