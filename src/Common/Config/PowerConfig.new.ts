/**
 * Power Configuration (REFACTORED)
 */

import { WheelFactory } from '@/services/WheelFactory';
import { COLOR_PALETTE } from '@/Common/Constants/ConstantsConfig';

// Power count configuration by race
const POWER_CONFIG: Record<string, number[]> = {
  Goblin: [35, 30, 20, 10, 5],
  Gnome: [30, 30, 25, 10, 5],
  Human: [25, 25, 28, 15, 7],
  Dwarf: [30, 35, 20, 10, 5],
  Skeleton: [10, 10, 10, 10, 10],
  Troll: [30, 35, 20, 10, 5],
  Orc: [30, 35, 20, 10, 5],
  Dryad: [50, 5, 20, 5, 20],
  Elf: [10, 35, 25, 20, 10],
  Spirit: [20, 35, 30, 10, 5],
  Uma: [20, 25, 35, 15, 5],
  Werebeast: [20, 35, 25, 15, 5],
  Vampire: [20, 35, 25, 15, 5],
  Giant: [45, 5, 10, 5, 35],
  Dragon: [5, 15, 50, 20, 10],
  Angel: [15, 20, 30, 25, 10],
  'Demi-God': [20, 10, 35, 15, 20],
  'Primordial Being': [15, 5, 25, 35, 20],
  Demon: [20, 5, 15, 35, 25],
  God: [20, 5, 15, 35, 25]
};

/**
 * Create power count wheel based on race
 */
export function createPowerCountWheel(race: string) {
  const values = POWER_CONFIG[race] || Array(5).fill(10);

  return WheelFactory.createCountWheel(
    'power-count',
    'Power Count',
    values.map((weight, idx) => ({
      count: idx + 1,
      weight,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      description: `${idx + 1} power${idx + 1 > 1 ? 's' : ''}`
    }))
  );
}

/**
 * Get power wheel (lazy loaded)
 */
export async function getPowerWheel() {
  return WheelFactory.createPowerWheel();
}
