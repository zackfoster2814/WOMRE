import { WheelItem } from "../types";
import { getAssetPath } from "../utils/basePath";

export interface DefaultPreset {
  id: string;
  name: string;
  description: string;
  wheelName: string;
  customSfxUrl?: string;
  items: Omit<WheelItem, "id">[];
}

let cachedPresets: DefaultPreset[] | null = null;

// Fetch default presets from JSON file
export const fetchDefaultPresets = async (): Promise<DefaultPreset[]> => {
  // Return cached data if available
  if (cachedPresets) {
    return cachedPresets;
  }

  try {
    const response = await fetch(getAssetPath('/data/default-presets.json'));
    if (!response.ok) {
      throw new Error('Failed to fetch default presets');
    }
    const data = await response.json();
    cachedPresets = data;
    return data;
  } catch (error) {
    console.error('Error fetching default presets:', error);
    // Fallback to empty array if fetch fails
    return [];
  }
};

// For backward compatibility - will be populated on first fetch
export let defaultPresets: DefaultPreset[] = [];

// Initialize default presets immediately
fetchDefaultPresets().then((presets) => {
  defaultPresets = presets;
});
