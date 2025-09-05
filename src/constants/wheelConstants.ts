// Canvas and Animation Constants
export const CANVAS_SIZE = 700;
export const WHEEL_RADIUS_OFFSET = 20;
export const ANIMATION_DURATION_MIN = 3500;
export const ANIMATION_DURATION_VARIANCE = 2500;
export const MIN_SPINS = 4;
export const MAX_SPIN_VARIANCE = 4;

// Stat Wheels Order
export const STAT_WHEELS = [
  "strength",
  "speed",
  "durability",
  "iq",
  "battleIQ",
  "martialArts",
] as const;

// Stat Display Names
export const STAT_DISPLAY_NAMES = {
  strength: "Strength",
  speed: "Speed",
  durability: "Durability",
  iq: "IQ",
  battleIQ: "Battle IQ",
  martialArts: "Martial Arts",
} as const;

// Stat Colors for UI
export const STAT_COLORS = {
  strength: "text-red-400",
  speed: "text-green-400",
  durability: "text-blue-400",
  iq: "text-purple-300",
  battleIQ: "text-yellow-300",
  martialArts: "text-orange-400",
} as const;

// Special Race Cases
export const SPECIAL_RACES = {
  SKELETON: "Skeleton",
  UMA: "Uma",
  ANGEL: "Angel",
  VAMPIRE: "Vampire",
  HUMAN: "Human",
} as const;

// Special Archetype Cases
export const SPECIAL_ARCHETYPES = {
  TRICKSTER: "Trickster",
  SLAYER: "Slayer",
  GUARDIAN_OF_DEMONS: "Guardian of Demons",
  WIBU: "Wibu",
  PACIFIST: "Pacifist",
} as const;

// Wibu Series Options
export const WIBU_SERIES = {
  JJK: "JJK",
  JOJO: "Jojo",
  NARUTO: "Naruto",
  ONE_PIECE: "One Piece",
  BLEACH: "Bleach",
} as const;

// House Special Wheels
export const HOUSE_SPECIAL_WHEELS = {
  HOUSE_STARK: "House Stark",
  GOLDEN_ORDER: "Golden Order",
  ASHINA_CLAN: "Ashina Clan",
  DESSENDRE_FAMILY: "Dessendre Family",
} as const;

// Wheel Step Keys
export const WHEEL_STEPS = {
  // Basic flow
  RACE: "race",
  SUBRACE: "subrace",
  ARCHETYPE: "archetype",

  // Special race flows
  SKELETON_LINEAGE: "skeleton-lineage",
  UMA_PARENT_1: "uma-parent-1",
  UMA_PARENT_2: "uma-parent-2",
  UNIQUE_VAMPIRE_TRAIN: "uniqueVampireTrain",
  VAMPIRE_TASTE: "vampireTaste",

  // Archetype special flows
  WIBU: "wibu",
  TRICKSTER_CARD: "trickster-card",
  SLAYER_RACE: "slayer-race",
  DEMON_SUBRACE: "demon-subrace",

  // Stats
  STRENGTH: "strength",
  SPEED: "speed",
  DURABILITY: "durability",
  IQ: "iq",
  BATTLE_IQ: "battleIQ",
  MARTIAL_ARTS: "martialArts",

  // Progression
  QUIRK_COUNT: "quirk-count",
  QUIRK: "quirk",
  HOUSE: "house",

  // Items
  GEAR_COUNT: "gear-count",
  LEGACY_GEAR_COUNT: "legacy-gear-count",
  GEAR: "gear",
  LEGACY_GEAR: "legacy-gear",

  // Weapons
  WEAPON_EXIST: "weapon-exist",
  UNIQUE_WEAPON_EXIST: "unique-weapon-exist",
  WEAPON: "weapon",
  UNIQUE_WEAPON: "unique-weapon",

  // Enchants
  WEAPON_ENCHANT_COUNT: "weapon-enchant-count",
  WEAPON_ENCHANT: "weapon-enchant",

  // Powers & Development
  POWER_COUNT: "power-count",
  POWER: "power",
  CHAR_DEV: "char-dev",
  PVE: "pve",

  // Special checks
  USABILITY_CHECK: "usabilityCheck",
} as const;

// Wheel Flow Order
export const WHEEL_FLOW_ORDER = [
  WHEEL_STEPS.RACE,
  WHEEL_STEPS.SUBRACE,
  WHEEL_STEPS.ARCHETYPE,
  WHEEL_STEPS.STRENGTH,
  WHEEL_STEPS.SPEED,
  WHEEL_STEPS.DURABILITY,
  WHEEL_STEPS.IQ,
  WHEEL_STEPS.BATTLE_IQ,
  WHEEL_STEPS.MARTIAL_ARTS,
  WHEEL_STEPS.QUIRK_COUNT,
  WHEEL_STEPS.QUIRK,
  WHEEL_STEPS.HOUSE,
  WHEEL_STEPS.GEAR_COUNT,
  WHEEL_STEPS.LEGACY_GEAR_COUNT,
  WHEEL_STEPS.GEAR,
  WHEEL_STEPS.LEGACY_GEAR,
  WHEEL_STEPS.WEAPON_EXIST,
  WHEEL_STEPS.WEAPON,
  WHEEL_STEPS.WEAPON_ENCHANT_COUNT,
  WHEEL_STEPS.WEAPON_ENCHANT,
  WHEEL_STEPS.POWER_COUNT,
  WHEEL_STEPS.POWER,
  WHEEL_STEPS.CHAR_DEV,
  WHEEL_STEPS.PVE,
] as const;

// Default Values
export const DEFAULT_VALUES = {
  CHARACTER_NAME: "",
  RACE: "",
  SUBRACE: "",
  HOUSE: "",
  IQ_VALUE: "1", // IQ is always set to 1
  TRACEN_ACADEMY: "Tracen Academy", // Default house for Uma race
  QUIRK_COUNT: 0,
  GEAR_COUNT: 0,
  LEGACY_GEAR_COUNT: 0,
  ENCHANT_COUNT: 0,
  POWER_COUNT: 0,
  CHAR_DEV_MAX_HUMAN: 2,
  CHAR_DEV_MAX_OTHER: 1,
} as const;

// UI Constants
export const UI_CONSTANTS = {
  // Panel widths
  LEFT_PANEL_WIDTH: "w-[18%]",
  RIGHT_PANEL_WIDTH: "w-[20%]",

  // Colors
  BORDER_PRIMARY: "border-[#d4af37]",
  BORDER_SECONDARY: "border-[#5a2d0c]",
  BORDER_BUTTON: "border-[#8a5b1a]",
  TEXT_PRIMARY: "text-amber-200",
  TEXT_SECONDARY: "text-[#f5e6d3]",
  TEXT_ACCENT: "text-amber-300",
  BG_PRIMARY: "bg-black/70",
  BG_SECONDARY: "bg-black/50",

  // Shadows
  GLOW_PRIMARY: "shadow-[0_0_20px_rgba(200,50,0,0.6)]",
  GLOW_SECONDARY: "shadow-[0_0_15px_rgba(255,215,0,0.5)]",
  GLOW_WHEEL: "shadow-[0_0_30px_rgba(200,50,50,0.6)]",

  // Sizes
  INPUT_HEIGHT: "h-[45px]",
  WEAPON_SLOT_SIZE: "w-20 h-20",
  SECTION_MIN_HEIGHT: "min-h-[90px]",
  SECTION_MAX_HEIGHT: "max-h-[90px]",
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  MISSING_CHARACTER_NAME: "Character name is required",
  MISSING_RACE: "Race selection is required",
  MISSING_STATS: "All stats must be rolled",
  INVALID_WHEEL_STEP: "Invalid wheel step",
  CANVAS_NOT_FOUND: "Canvas element not found",
  ANIMATION_ERROR: "Error during wheel animation",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CHARACTER_CREATED: "Character created successfully!",
  CHARACTER_EXPORTED: "Character data exported successfully!",
  WHEEL_RESET: "Wheel reset successfully!",
} as const;

// File Extensions
export const FILE_EXTENSIONS = {
  JSON: ".json",
  TXT: ".txt",
  CSV: ".csv",
} as const;

// Local Storage Keys (if needed)
export const STORAGE_KEYS = {
  CHARACTER_DATA: "character_wheel_data",
  USER_PREFERENCES: "character_wheel_preferences",
  LAST_SESSION: "character_wheel_last_session",
} as const;

// Audio Settings
export const AUDIO_SETTINGS = {
  DEFAULT_VOLUME: 0.7,
  PRELOAD: "auto" as const,
  CROSSORIGIN: "anonymous" as const,
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  CHARACTER_NAME_MIN_LENGTH: 1,
  CHARACTER_NAME_MAX_LENGTH: 50,
  MAX_QUIRKS: 10,
  MAX_GEARS: 10,
  MAX_WEAPONS: 2,
  MAX_ENCHANTS: 10,
  MAX_POWERS: 10,
} as const;

// Animation Easing Function Constants
export const EASING = {
  EASE_OUT_CUBIC: (t: number) => 1 - Math.pow(1 - t, 3),
  EASE_IN_OUT_CUBIC: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
} as const;

// Temp Result Keys (for usability checks)
export const TEMP_KEYS = {
  TEMP_GEAR: "temp-gear",
  TEMP_LEGACY_GEAR: "temp-legacy-gear",
  TEMP_WEAPON: "temp-weapon",
  TEMP_WEAPON_TYPE: "temp-weapon-type",
} as const;

// Usability Options
export const USABILITY_OPTIONS = {
  USABLE: "Dùng được",
  NOT_USABLE: "Không dùng được",
  USABLE_COLOR: "#10b981", // Green
  NOT_USABLE_COLOR: "#ef4444", // Red
} as const;
