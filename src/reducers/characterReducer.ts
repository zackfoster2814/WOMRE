import { CharacterState, CharacterAction } from "@/types/characterTypes.ts";

// Initial character state
export const initialCharacterState: CharacterState = {
  results: {},
  stats: {
    strength: "",
    speed: "",
    durability: "",
    iq: "",
    battleIQ: "",
    martialArts: "",
  },
  quirks: [],
  gears: [],
  legacyGears: [],
  weapons: [],
  enchants: [],
  powers: [],
  charDevs: [],
  archetypes: [],
  characterName: "",
  lovers: [],
  summons: [],
  pveRounds: [],
};

// Character reducer function
export function characterReducer(
  state: CharacterState,
  action: CharacterAction
): CharacterState {
  switch (action.type) {
    case "SET_RESULT":
      return {
        ...state,
        results: { ...state.results, [action.key]: action.value },
      };

    case "SET_STAT":
      return {
        ...state,
        stats: { ...state.stats, [action.key]: action.value },
      };

    case "SET_CHARACTER_NAME":
      return {
        ...state,
        characterName: action.name,
      };

    case "ADD_QUIRK":
      return {
        ...state,
        quirks: [...state.quirks, action.quirk],
      };

    case "ADD_GEAR":
      return {
        ...state,
        gears: [...state.gears, action.gear],
      };

    case "ADD_LEGACY_GEAR":
      return {
        ...state,
        legacyGears: [...state.legacyGears, action.gear],
      };

    case "ADD_WEAPON":
      return {
        ...state,
        weapons: [...state.weapons, action.weapon],
      };

    case "ADD_ENCHANT":
      return {
        ...state,
        enchants: [...state.enchants, action.enchant],
      };
    case "ADD_PVE_ROUND":
      return { ...state, pveRounds: [...state.pveRounds, action.pveRound] };
    case "ADD_POWER":
      // Avoid duplicate powers
      const existingPower = state.powers.find(
        (p) => p.name === action.power.name || p.id === action.power.id
      );
      if (existingPower) {
        return state;
      }
      return {
        ...state,
        powers: [...state.powers, action.power],
      };
    case "RESET_POWERS":
      return { ...state, powers: [] };

    case "RESET_WEAPON":
      return { ...state, weapons: [] };

    case "ADD_CHARDEV":
      return {
        ...state,
        charDevs: [...state.charDevs, action.charDev],
      };

    case "ADD_ARCHETYPE":
      return {
        ...state,
        archetypes: [...state.archetypes, action.archetype],
      };
    case "ADD_LOVER":
      return { ...state, lovers: [...state.lovers, action.lovers] };
    case "RESET":
      return initialCharacterState;

    default:
      return state;
  }
}

// Helper functions for character data manipulation
export const getCharacterSummary = (state: CharacterState) => {
  return {
    totalItems:
      state.gears.length + state.legacyGears.length + state.weapons.length,
    totalQuirks: state.quirks.length,
    totalPowers: state.powers.length,
    totalEnchants: state.enchants.length,
    hasWeapons: state.weapons.length > 0,
    hasUsableWeapons: state.weapons.some((weapon) => weapon.usable),
    race: state.results.race || "Not selected",
    subrace: state.results.subrace || "Not selected",
    house: state.results.house || "Not selected",
    completedStats: Object.values(state.stats).filter((stat) => stat !== "")
      .length,
  };
};

// Helper to check if character creation is complete
export const isCharacterComplete = (state: CharacterState): boolean => {
  return !!(
    state.characterName &&
    state.results.race &&
    state.results.pve &&
    Object.values(state.stats).every((stat) => stat !== "")
  );
};

// Helper to get all character results in a clean format
export const getCleanCharacterResults = (state: CharacterState) => {
  const cleanResults = { ...state.results };

  // Remove temporary/internal keys
  const tempKeys = [
    "temp-gear",
    "temp-legacy-gear",
    "temp-weapon",
    "temp-weapon-type",
  ];
  tempKeys.forEach((key) => delete cleanResults[key]);

  return cleanResults;
};

// Helper to validate character state
export const validateCharacterState = (state: CharacterState): string[] => {
  const errors: string[] = [];

  if (!state.characterName.trim()) {
    errors.push("Character name is required");
  }

  if (!state.results.race) {
    errors.push("Race is required");
  }

  const missingStats = Object.entries(state.stats)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key);

  if (missingStats.length > 0) {
    errors.push(`Missing stats: ${missingStats.join(", ")}`);
  }

  return errors;
};

// Helper to count items by category
export const getItemCounts = (state: CharacterState) => {
  return {
    gears: {
      total: state.gears.length,
      usable: state.gears.filter((gear) => gear.usable).length,
      unusable: state.gears.filter((gear) => !gear.usable).length,
    },
    legacyGears: {
      total: state.legacyGears.length,
      usable: state.legacyGears.filter((gear) => gear.usable).length,
      unusable: state.legacyGears.filter((gear) => !gear.usable).length,
    },
    weapons: {
      total: state.weapons.length,
      usable: state.weapons.filter((weapon) => weapon.usable).length,
      unusable: state.weapons.filter((weapon) => !weapon.usable).length,
    },
    quirks: state.quirks.length,
    enchants: state.enchants.length,
    powers: state.powers.length,
    charDevs: state.charDevs.length,
    archetypes: state.archetypes.length,
  };
};

// Helper to check if specific wheels should be accessible
export const getWheelAccessibility = (state: CharacterState) => {
  const hasRace = !!state.results.race;
  const hasSubrace = !!state.results.subrace || state.results.race === "Human";
  const hasArchetype = state.archetypes.length > 0;
  const hasCompletedStats = Object.values(state.stats).every(
    (stat) => stat !== ""
  );
  const hasQuirks = state.quirks.length > 0;
  const hasHouse = !!state.results.house;

  return {
    canAccessSubrace: hasRace,
    canAccessArchetype:
      hasRace && (hasSubrace || state.results.race === "Human"),
    canAccessStats: hasArchetype,
    canAccessQuirks: hasCompletedStats,
    canAccessHouse: hasQuirks,
    canAccessGear: hasHouse,
    canAccessWeapons: hasHouse,
    canAccessPowers: hasHouse,
    canAccessCharDev: state.powers.length > 0,
    canAccessPvE: state.charDevs.length > 0,
  };
};

// Helper to get next available wheel step
export const getNextWheelStep = (state: CharacterState): string | null => {
  const accessibility = getWheelAccessibility(state);

  if (!state.results.race) return "race";
  if (!accessibility.canAccessArchetype) return "subrace";
  if (!accessibility.canAccessStats) return "archetype";
  if (!accessibility.canAccessQuirks) return "stats";
  if (!accessibility.canAccessHouse) return "quirks";
  if (!accessibility.canAccessGear) return "house";
  if (!accessibility.canAccessPowers) return "gear";
  if (!accessibility.canAccessCharDev) return "power";
  if (!accessibility.canAccessPvE) return "charDev";
  if (!state.results.pve) return "pve";

  return null; // Character is complete
};

// Action creators for common operations
export const createSetResultAction = (
  key: string,
  value: string
): CharacterAction => ({
  type: "SET_RESULT",
  key,
  value,
});

export const createSetStatAction = (
  key: string,
  value: string
): CharacterAction => ({
  type: "SET_STAT",
  key,
  value,
});

export const createAddItemAction = (
  itemType:
    | "QUIRK"
    | "GEAR"
    | "LEGACY_GEAR"
    | "WEAPON"
    | "ENCHANT"
    | "POWER"
    | "CHARDEV"
    | "ARCHETYPE"
    | "LOVER"
    | "RESET_POWERS",
  item: any
): CharacterAction => {
  switch (itemType) {
    case "QUIRK":
      return { type: "ADD_QUIRK", quirk: item };
    case "GEAR":
      return { type: "ADD_GEAR", gear: item };
    case "LEGACY_GEAR":
      return { type: "ADD_LEGACY_GEAR", gear: item };
    case "WEAPON":
      return { type: "ADD_WEAPON", weapon: item };
    case "ENCHANT":
      return { type: "ADD_ENCHANT", enchant: item };
    case "POWER":
      return { type: "ADD_POWER", power: item };
    case "CHARDEV":
      return { type: "ADD_CHARDEV", charDev: item };
    case "ARCHETYPE":
      return { type: "ADD_ARCHETYPE", archetype: item };
    case "LOVER":
      return { type: "ADD_LOVER", lovers: item };
    default:
      throw new Error(`Unknown item type: ${itemType}`);
  }
};
