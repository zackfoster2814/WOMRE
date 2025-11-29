/**
 * Character Development Configuration (REFACTORED)
 */

import { WheelFactory } from '@/services/WheelFactory';

/**
 * Get character development wheel (lazy loaded)
 */
export async function getCharDevWheel() {
  return WheelFactory.createCharDevWheel();
}
