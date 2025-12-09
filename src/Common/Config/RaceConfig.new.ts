/**
 * Race Configuration (REFACTORED)
 * Uses WheelFactory for lazy loading
 */

import { WheelFactory } from '@/services/WheelFactory.js';

/**
 * Get race wheel (lazy loaded)
 */
export async function getRaceWheel() {
  return WheelFactory.createRaceWheel();
}

/**
 * Get subrace map grouped by race name
 */
export async function getSubraceMap() {
  return WheelFactory.getSubraceMap();
}

/**
 * Get subrace wheel for specific race
 */
export async function getSubraceWheel(raceName: string) {
  return WheelFactory.createSubraceWheel(raceName);
}
