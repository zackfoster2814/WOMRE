/**
 * PvE Configuration (REFACTORED)
 */

import { WheelFactory } from '@/services/WheelFactory';

/**
 * Get PvE wheel (lazy loaded)
 */
export async function getPvEWheel() {
  return WheelFactory.createPvEWheel();
}
