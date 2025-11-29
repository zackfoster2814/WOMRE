/**
 * Archetype Configuration (REFACTORED)
 */

import { WheelFactory } from '@/services/WheelFactory';

/**
 * Get archetype wheel (lazy loaded)
 */
export async function getArchetypeWheel() {
  return WheelFactory.createArchetypeWheel();
}

/**
 * Get instrument wheel (static - for Bard archetype)
 */
export function getInstrumentWheel() {
  return WheelFactory.createCountWheel(
    'bard-instrumental-selection',
    'Bard - Instrument Selection',
    [
      { count: 0, weight: 1, color: '#FFD700', description: 'Piano' },
      { count: 0, weight: 1, color: '#87CEEB', description: 'Guitar' },
      { count: 0, weight: 1, color: '#FF69B4', description: 'Violin' },
      { count: 0, weight: 1, color: '#98FB98', description: 'Flute' },
      { count: 0, weight: 1, color: '#DDA0DD', description: 'Drum' }
    ].map((opt, idx) => ({
      ...opt,
      count: idx
    }))
  );
}

/**
 * Get summon wheel (for X archetype)
 */
export function getSummonWheel() {
  return {
    key: 'summon',
    title: 'Summon Selection',
    sections: [
      {
        id: 'creator-favor',
        name: "Creator's Favor",
        weight: 10,
        color: '#FFD700',
        description: "Đấng Sáng Tạo tùy ý buff cho nhân vật"
      },
      {
        id: 'random-summon',
        name: 'Random Summon',
        weight: 90,
        color: '#87CEEB',
        description: 'Triệu hồi ngẫu nhiên'
      }
    ]
  };
}
