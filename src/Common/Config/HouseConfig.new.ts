/**
 * House Configuration (REFACTORED)
 */

import { WheelFactory } from '@/services/WheelFactory.js';

/**
 * Get house wheel (lazy loaded)
 */
export async function getHouseWheel() {
  return WheelFactory.createHouseWheel();
}
