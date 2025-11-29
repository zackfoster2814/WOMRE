/**
 * Services Index
 * Central export point for all refactored services and configs
 */

// ========== SERVICES ==========
export { DataLoader, dataLoader } from './DataLoader';
export {
  fetchRaces,
  fetchSubraces,
  fetchArchetypes,
  fetchPowers,
  fetchGearsByLegacy,
  fetchHouses,
  fetchWeapons,
  fetchEnchants,
  fetchQuirks,
  fetchCharDevs,
  fetchPvE,
  fetchPlayers,
  preloadAllData,
  isApiAvailable
} from './ApiService';
export { WheelFactory } from './WheelFactory';

// ========== CONFIG EXPORTS (NEW) ==========

// Race
export { getRaceWheel, getSubraceMap, getSubraceWheel } from '@/Common/Config/RaceConfig.new';

// Power
export { createPowerCountWheel, getPowerWheel } from '@/Common/Config/PowerConfig.new';

// Gear
export {
  gearCountWheel,
  legacyGearCountWheel,
  getGearWheel,
  getLegacyGearWheel
} from '@/Common/Config/GearConfig.new';

// Archetype
export {
  getArchetypeWheel,
  getInstrumentWheel,
  getSummonWheel
} from '@/Common/Config/ArchetypeConfig.new';

// Quirk
export {
  quirkCountOptions,
  getQuirkWheel
} from '@/Common/Config/QuirkConfig.new';

// Weapon
export {
  weaponExistWheel,
  uniqueWeaponExistWheel,
  createEnchantCountWheel,
  getWeaponWheel,
  getUniqueWeaponWheel,
  getEnchantWheel
} from '@/Common/Config/WeaponConfig.new';

// House
export { getHouseWheel } from '@/Common/Config/HouseConfig.new';

// Character Development
export { getCharDevWheel } from '@/Common/Config/CharDevConfig.new';

// PvE
export { getPvEWheel } from '@/Common/Config/PvEConfig.new';

// Player
export { getPlayerWheel } from '@/Common/Config/PlayerConfig.new';

// ========== HOOKS ==========
export { useWheelLoader } from '@/hooks/useWheelLoader';

// ========== UTILITIES ==========
export {
  STAT_WHEELS,
  getStatWheel,
  getRaceOrSubrace,
  usabilityWheel
} from '@/utils/wheelUtils.new';
