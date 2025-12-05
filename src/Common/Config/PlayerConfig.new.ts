/**
 * Player Configuration (REFACTORED)
 */

import { WheelFactory } from '@/services/WheelFactory.js';

/**
 * Get player wheel (lazy loaded)
 */
export async function getPlayerWheel() {
  return WheelFactory.createPlayerWheel();
}
