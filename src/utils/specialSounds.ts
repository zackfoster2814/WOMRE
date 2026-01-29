/**
 * Special sound effects system for wheel spins
 * Handles conditional sound playback based on item names, sequences, and wheel state
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Special sound effects mapping for specific item names */
const SPECIAL_SOUNDS: Record<string, { path: string; volume: number }> = {
  Uma: { path: "/assets/sfx/mambo.mp3", volume: 0.5 },
  God: { path: "/assets/sfx/godboss.mp3", volume: 0.3 },
  Mewing: { path: "/assets/sfx/mewing.mp3", volume: 0.5 },
  Symbiosis: { path: "/assets/sfx/symbi.mp3", volume: 0.5 },
  "Người Trong Ban Nhạc": { path: "/assets/sfx/nhacngot_01.mp3", volume: 0.5 },
  "True Heir of the Emirate🍀": {
    path: "/assets/sfx/thanhhoa.mp3",
    volume: 0.5,
  },
  "Raumanian🍀": { path: "/assets/sfx/thanhhoa_2.mp3", volume: 0.5 },
  Rickrolling: { path: "/assets/sfx/rickroll.mp3", volume: 0.5 },
  Vàng: { path: "/assets/sfx/chingchong.mp3", volume: 0.5 },
  Femboy: { path: "/assets/sfx/femboi.mp3", volume: 0.5 },
  Baguette: { path: "/assets/sfx/frances.mp3", volume: 0.5 },
  "Love Letter": { path: "/assets/sfx/chill.mp3", volume: 0.5 },
  Skeleton: { path: "/assets/sfx/crack_skeleton.mp3", volume: 0.5 },
  Gnome: { path: "/assets/sfx/bonggg.mp3", volume: 0.5 },
};

/** Sequential combo sounds: [prevItem, currentItem] -> sound */
const COMBO_SOUNDS: Record<string, Record<string, string>> = {
  "3": { "6": "/assets/sfx/36.mp3" },
  "6": { "7": "/assets/sfx/ay67.mp3" },
  "2": { "8": "/assets/sfx/28.mp3" },
};

/** Stat wheel (10 items) - random sounds for specific values */
const STAT_RANDOM_SOUNDS: Record<string, string[]> = {
  "1": [
    "/assets/sfx/aaa.mp3",
    "/assets/sfx/wetfart.mp3",
    "/assets/sfx/boom.mp3",
    "/assets/sfx/ouch.mp3",
    "/assets/sfx/fah.mp3",
    "/assets/sfx/laugh.mp3",
  ],
  "2": [
    "/assets/sfx/wthboiz.mp3",
    "/assets/sfx/wawawa.mp3",
    "/assets/sfx/ding_2.mp3",
    "/assets/sfx/ting_3.mp3",
  ],
  "3": [
    "/assets/sfx/wthboiz.mp3",
    "/assets/sfx/wawawa.mp3",
    "/assets/sfx/ding_2.mp3",
    "/assets/sfx/ting_3.mp3",
  ],
  "7": ["/assets/sfx/67_stat.mp3", "/assets/sfx/siu.mp3"],
  "9": ["/assets/sfx/Stat9.mp3", "/assets/sfx/fight.mp3"],
  "10": ["/assets/sfx/Stat10.mp3", "/assets/sfx/10stats.mp3"],
};

/** Stat wheel (10 items) - fixed sounds for specific values */
const STAT_FIXED_SOUNDS: Record<string, string> = {
  "4": "/assets/sfx/Stat45.mp3",
  "5": "/assets/sfx/Stat45.mp3",
  "6": "/assets/sfx/67_stat.mp3",
  "8": "/assets/sfx/stat8.mp3",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const DEFAULT_VOLUME = 0.5;

/** Play audio with optional volume */
const playAudio = (path: string, volume: number = DEFAULT_VOLUME): void => {
  const audio = new Audio(path);
  audio.volume = volume;
  audio.play().catch(console.error);
};

/** Get random element from array */
const randomFrom = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

/** Check if current item is part of a combo sequence */
const isPartOfCombo = (
  prevItem: string | null,
  currentItem: string,
): boolean => {
  if (!prevItem) return false;
  return COMBO_SOUNDS[prevItem]?.[currentItem] !== undefined;
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Play special sound effect based on item name and conditions
 * @param itemName - The name of the winning item
 * @param totalItems - Total number of items in the wheel
 * @param previousItemName - The name of the previous winning item
 * @returns true if special sound was played, false otherwise
 */
export const playSpecialSound = (
  itemName: string,
  totalItems: number,
  previousItemName: string | null,
): boolean => {
  // Stat wheel (10 items) handling
  if (totalItems === 10) {
    // Priority 1: Check combo sequences (e.g., 3→6, 6→7, 2→8)
    if (previousItemName && COMBO_SOUNDS[previousItemName]?.[itemName]) {
      playAudio(COMBO_SOUNDS[previousItemName][itemName]);
      return true;
    }

    // Priority 2: Random sounds for specific stats
    if (STAT_RANDOM_SOUNDS[itemName]) {
      playAudio(randomFrom(STAT_RANDOM_SOUNDS[itemName]));
      return true;
    }

    // Priority 3: Fixed sounds (skip if part of combo to avoid double play)
    if (
      STAT_FIXED_SOUNDS[itemName] &&
      !isPartOfCombo(previousItemName, itemName)
    ) {
      playAudio(STAT_FIXED_SOUNDS[itemName]);
      return true;
    }
  }

  // Name-based special sounds (Uma, God, etc.)
  const soundConfig = SPECIAL_SOUNDS[itemName];
  if (soundConfig) {
    playAudio(soundConfig.path, soundConfig.volume);
    return true;
  }

  return false;
};
