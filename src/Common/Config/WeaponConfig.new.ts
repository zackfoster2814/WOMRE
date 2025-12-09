/**
 * Weapon Configuration (REFACTORED)
 */

import { WheelFactory } from '@/services/WheelFactory.js';

/**
 * Weapon exist wheel (static)
 */
export const weaponExistWheel = {
  key: 'weapon-exist',
  title: 'Weapon Availability',
  sections: [
    {
      id: 'has-weapon',
      name: 'Has Weapon',
      weight: 50,
      color: '#4CAF50',
      description: 'Character has a weapon'
    },
    {
      id: 'no-weapon',
      name: 'No Weapon',
      weight: 50,
      color: '#f44336',
      description: 'Character has no weapon'
    }
  ]
};

/**
 * Unique weapon exist wheel (static)
 */
export const uniqueWeaponExistWheel = {
  key: 'unique-weapon-exist',
  title: 'Unique Weapon Availability',
  sections: [
    {
      id: 'has-unique-weapon',
      name: 'Has Unique Weapon',
      weight: 30,
      color: '#FFD700',
      description: 'Character has a unique weapon'
    },
    {
      id: 'no-unique-weapon',
      name: 'No Unique Weapon',
      weight: 70,
      color: '#CCCCCC',
      description: 'Character has no unique weapon'
    }
  ]
};

/**
 * Enchant count wheel (static)
 */
export function createEnchantCountWheel() {
  return WheelFactory.createCountWheel(
    'weapon-enchant-count',
    'Weapon Enchant Count',
    [
      { count: 0, weight: 50, color: '#CCCCCC', description: 'No enchants' },
      { count: 1, weight: 30, color: '#A2D149', description: '1 enchant' },
      { count: 2, weight: 15, color: '#FFD700', description: '2 enchants' },
      { count: 3, weight: 5, color: '#9370DB', description: '3 enchants' }
    ]
  );
}

/**
 * Get weapon wheel (lazy loaded)
 */
export async function getWeaponWheel() {
  return WheelFactory.createWeaponWheel();
}

/**
 * Get unique weapon wheel (lazy loaded, filtered)
 */
export async function getUniqueWeaponWheel() {
  const weaponWheel = await WheelFactory.createWeaponWheel();

  return {
    ...weaponWheel,
    key: 'unique-weapon',
    title: 'Unique Weapon',
    sections: weaponWheel.sections.filter(weapon => weapon.isUnique === true)
  };
}

/**
 * Get enchant wheel (lazy loaded)
 */
export async function getEnchantWheel() {
  return WheelFactory.createEnchantWheel();
}
