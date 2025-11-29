/**
 * Quirk Configuration (REFACTORED)
 */

import { WheelFactory } from '@/services/WheelFactory';

/**
 * Quirk count options (static)
 */
export const quirkCountOptions = WheelFactory.createCountWheel(
  'quirk-count',
  'Quirk Count',
  [
    { count: 1, weight: 25, color: '#A2D149', description: '1 quirk' },
    { count: 2, weight: 35, color: '#FFD700', description: '2 quirks' },
    { count: 3, weight: 25, color: '#87CEEB', description: '3 quirks' },
    { count: 4, weight: 10, color: '#FF69B4', description: '4 quirks' },
    { count: 5, weight: 5, color: '#9370DB', description: '5 quirks' }
  ]
).sections;

/**
 * Get quirk wheel (lazy loaded)
 */
export async function getQuirkWheel() {
  return WheelFactory.createQuirkWheel();
}
