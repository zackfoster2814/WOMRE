/**
 * Gear Configuration (REFACTORED)
 */

import { WheelFactory } from '@/services/WheelFactory';

/**
 * Gear count wheel (static configuration)
 */
export const gearCountWheel = WheelFactory.createCountWheel(
  'gear-count',
  'Gear Count',
  [
    { count: 0, weight: 20, color: '#CCCCCC', description: 'No gear' },
    { count: 1, weight: 30, color: '#A2D149', description: '1 gear' },
    { count: 2, weight: 25, color: '#FFD700', description: '2 gears' },
    { count: 3, weight: 15, color: '#87CEEB', description: '3 gears' },
    { count: 4, weight: 10, color: '#FF69B4', description: '4 gears' }
  ]
);

/**
 * Legacy gear count wheel (static configuration)
 */
export const legacyGearCountWheel = WheelFactory.createCountWheel(
  'legacy-gear-count',
  'Legacy Gear Count',
  [
    { count: 0, weight: 88, color: '#CCCCCC', description: 'No legacy gear' },
    { count: 1, weight: 12, color: '#FFD700', description: '1 legacy gear' }
  ]
);

/**
 * Get gear wheel (lazy loaded)
 */
export async function getGearWheel() {
  return WheelFactory.createGearWheel(false);
}

/**
 * Get legacy gear wheel (lazy loaded)
 */
export async function getLegacyGearWheel() {
  return WheelFactory.createGearWheel(true);
}
