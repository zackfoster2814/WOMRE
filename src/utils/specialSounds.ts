/**
 * Special sound effects system for wheel spins
 * Handles conditional sound playback based on item names, sequences, and wheel state
 */

// Special sound effects mapping for specific item names (regardless of item count)
const SPECIAL_SOUNDS: Record<string, { path: string; volume: number }> = {
  Uma: { path: "/assets/sfx/mambo.mp3", volume: 0.5 },
  God: { path: "/assets/sfx/godboss.mp3", volume: 0.3 },
  // Power special sounds
  Mewing: { path: "/assets/sfx/mewing.mp3", volume: 0.5 },
  // Race special sounds
  Symbiosis: { path: "/assets/sfx/symbi.mp3", volume: 0.5 },
  // Archetype special sounds
  "Người Trong Ban Nhạc": { path: "/assets/sfx/nhacngot_01.mp3", volume: 0.5 },
  // Char Dev / Special items
  "True Heir of the Emirate🍀": { path: "/assets/sfx/thanhhoa.mp3", volume: 0.5 },
  // Race special sounds
  "Raumanian🍀": { path: "/assets/sfx/thanhhoa_2.mp3", volume: 0.5 },
  "Rickrolling": { path: "/assets/sfx/rickroll.mp3", volume: 0.5 },
};

// Random sounds for item named "1" when exactly 10 items
const ITEM_ONE_RANDOM_SOUNDS = [
  "/assets/sfx/aaa.mp3",
  "/assets/sfx/wetfart.mp3",
  "/assets/sfx/boom.mp3",
];

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
  previousItemName: string | null
): boolean => {
  // Special case: Item named "1" when exactly 10 items
  if (totalItems === 10 && itemName === "1") {
    const randomSound =
      ITEM_ONE_RANDOM_SOUNDS[
        Math.floor(Math.random() * ITEM_ONE_RANDOM_SOUNDS.length)
      ];
    const audio = new Audio(randomSound);
    audio.volume = 0.5;
    audio.play().catch(console.error);
    return true;
  }

  // Special case for 10 items: Check sequential combinations (HIGHEST PRIORITY)
  if (totalItems === 10 && previousItemName) {
    // Previous "3" → Current "6" = play 36.mp3 (Priority over other sounds)
    if (previousItemName === "3" && itemName === "6") {
      const audio = new Audio("/assets/sfx/36.mp3");
      audio.volume = 0.5;
      audio.play().catch(console.error);
      return true;
    }

    // Previous "6" → Current "7" = play ay67.mp3 (Priority over 67_stat.mp3)
    if (previousItemName === "6" && itemName === "7") {
      const audio = new Audio("/assets/sfx/ay67.mp3");
      audio.volume = 0.5;
      audio.play().catch(console.error);
      return true;
    }
  }

  // Special case for 10 items: Single item sounds
  if (totalItems === 10) {
    // Item "2" or "3" = play wthboiz.mp3
    if (itemName === "2" || itemName === "3") {
      const audio = new Audio("/assets/sfx/wthboiz.mp3");
      audio.volume = 0.5;
      audio.play().catch(console.error);
      return true;
    }

    // Item "4" or "5" = play Stat45.mp3
    if (itemName === "4" || itemName === "5") {
      const audio = new Audio("/assets/sfx/Stat45.mp3");
      audio.volume = 0.5;
      audio.play().catch(console.error);
      return true;
    }

    // Item is "6" or "7" - BUT exclude if it's part of a combo (3→6 or 6→7)
    if (itemName === "6" || itemName === "7") {
      // Skip if this is part of a special combo
      const isPartOfCombo =
        (previousItemName === "3" && itemName === "6") ||
        (previousItemName === "6" && itemName === "7");

      if (!isPartOfCombo) {
        const audio = new Audio("/assets/sfx/67_stat.mp3");
        audio.volume = 0.5;
        audio.play().catch(console.error);
        return true;
      }
    }

    // Item "8" = play stat8.mp3
    if (itemName === "8") {
      const audio = new Audio("/assets/sfx/stat8.mp3");
      audio.volume = 0.5;
      audio.play().catch(console.error);
      return true;
    }

    // Item "9" = play Stat9.mp3
    if (itemName === "9") {
      const audio = new Audio("/assets/sfx/Stat9.mp3");
      audio.volume = 0.5;
      audio.play().catch(console.error);
      return true;
    }

    // Item "10" = play Stat10.mp3
    if (itemName === "10") {
      const audio = new Audio("/assets/sfx/Stat10.mp3");
      audio.volume = 0.5;
      audio.play().catch(console.error);
      return true;
    }
  }

  // Check for name-based special sounds (Uma, God, etc.)
  const soundConfig = SPECIAL_SOUNDS[itemName];
  if (soundConfig) {
    const audio = new Audio(soundConfig.path);
    audio.volume = soundConfig.volume;
    audio.play().catch(console.error);
    return true;
  }

  return false;
};
