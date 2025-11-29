/**
 * API Service Layer
 * Abstraction over window.api (Electron IPC) with fallback support
 */

import { dataLoader } from './DataLoader';

type ApiMethod = 'fetchAllRaces' | 'fetchAllSubraces' | 'fetchAllArchetypes' |
  'fetchAllPowers' | 'fetchGearByLegacy' | 'fetchAllHouses' |
  'fetchAllWeapons' | 'fetchAllEnchants' | 'fetchAllQuirks' |
  'fetchAllCharDevs' | 'fetchAllPvE' | 'fetchAllPlayers';

interface ApiService {
  isAvailable(): boolean;
  call<T>(method: ApiMethod, ...args: any[]): Promise<T>;
}

class ElectronApiService implements ApiService {
  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.api;
  }

  async call<T>(method: ApiMethod, ...args: any[]): Promise<T> {
    if (!this.isAvailable()) {
      throw new Error('Electron API is not available');
    }

    const api = (window as any).api;

    if (typeof api[method] !== 'function') {
      throw new Error(`API method ${method} does not exist`);
    }

    try {
      const result = await api[method](...args);
      return result;
    } catch (error) {
      console.error(`[ApiService] Error calling ${method}:`, error);
      throw error;
    }
  }
}

// Singleton
const apiService = new ElectronApiService();

/**
 * Fetch functions with caching
 */

export async function fetchRaces() {
  return dataLoader.load('races', async () => {
    const data = await apiService.call('fetchAllRaces');
    console.log('[ApiService] Fetched races:', data?.length || 0);
    return data || [];
  });
}

export async function fetchSubraces() {
  return dataLoader.load('subraces', async () => {
    const data = await apiService.call('fetchAllSubraces');
    console.log('[ApiService] Fetched subraces:', data?.length || 0);
    return data || [];
  });
}

export async function fetchArchetypes() {
  return dataLoader.load('archetypes', async () => {
    const data = await apiService.call('fetchAllArchetypes');
    console.log('[ApiService] Fetched archetypes:', data?.length || 0);
    return data || [];
  });
}

export async function fetchPowers() {
  return dataLoader.load('powers', async () => {
    const data = await apiService.call('fetchAllPowers');
    console.log('[ApiService] Fetched powers:', data?.length || 0);
    return data || [];
  });
}

export async function fetchGearsByLegacy(isLegacy: number) {
  return dataLoader.load(`gears-legacy-${isLegacy}`, async () => {
    const data = await apiService.call('fetchGearByLegacy', isLegacy);
    console.log(`[ApiService] Fetched gears (legacy=${isLegacy}):`, data?.length || 0);
    return data || [];
  });
}

export async function fetchHouses() {
  return dataLoader.load('houses', async () => {
    const data = await apiService.call('fetchAllHouses');
    console.log('[ApiService] Fetched houses:', data?.length || 0);
    return data || [];
  });
}

export async function fetchWeapons() {
  return dataLoader.load('weapons', async () => {
    const data = await apiService.call('fetchAllWeapons');
    console.log('[ApiService] Fetched weapons:', data?.length || 0);
    return data || [];
  });
}

export async function fetchEnchants() {
  return dataLoader.load('enchants', async () => {
    const data = await apiService.call('fetchAllEnchants');
    console.log('[ApiService] Fetched enchants:', data?.length || 0);
    return data || [];
  });
}

export async function fetchQuirks() {
  return dataLoader.load('quirks', async () => {
    const data = await apiService.call('fetchAllQuirks');
    console.log('[ApiService] Fetched quirks:', data?.length || 0);
    return data || [];
  });
}

export async function fetchCharDevs() {
  return dataLoader.load('charDevs', async () => {
    const data = await apiService.call('fetchAllCharDevs');
    console.log('[ApiService] Fetched charDevs:', data?.length || 0);
    return data || [];
  });
}

export async function fetchPvE() {
  return dataLoader.load('pve', async () => {
    const data = await apiService.call('fetchAllPvE');
    console.log('[ApiService] Fetched PvE:', data?.length || 0);
    return data || [];
  });
}

export async function fetchPlayers() {
  return dataLoader.load('players', async () => {
    const data = await apiService.call('fetchAllPlayers');
    console.log('[ApiService] Fetched players:', data?.length || 0);
    return data || [];
  });
}

/**
 * Preload all data
 * Call this on app init for better performance
 */
export async function preloadAllData() {
  console.log('[ApiService] Preloading all data...');

  try {
    await Promise.all([
      fetchRaces(),
      fetchSubraces(),
      fetchArchetypes(),
      fetchPowers(),
      fetchGearsByLegacy(0),
      fetchGearsByLegacy(1),
      fetchHouses(),
      fetchWeapons(),
      fetchEnchants(),
      fetchQuirks(),
      fetchCharDevs(),
      fetchPvE(),
      fetchPlayers()
    ]);

    console.log('[ApiService] All data preloaded successfully');
  } catch (error) {
    console.error('[ApiService] Failed to preload data:', error);
    throw error;
  }
}

/**
 * Check if API is available
 */
export function isApiAvailable(): boolean {
  return apiService.isAvailable();
}
