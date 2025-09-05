import { Section, WheelStep } from "@/Common/Types/Types.ts";

// Character State Interface
export interface CharacterState {
  results: Record<string, string>;
  stats: CharacterStats;
  quirks: Section[];
  gears: Section[];
  legacyGears: Section[];
  weapons: Section[];
  enchants: Section[];
  powers: Section[];
  charDevs: Section[];
  archetypes: Section[];
  characterName: string;
}

// Character Stats Interface
export interface CharacterStats {
  strength: string;
  speed: string;
  durability: string;
  iq: string;
  battleIQ: string;
  martialArts: string;
}

// Character Reducer Actions
export type CharacterAction =
  | { type: "SET_RESULT"; key: string; value: string }
  | { type: "SET_STAT"; key: string; value: string }
  | { type: "ADD_QUIRK"; quirk: Section }
  | { type: "ADD_GEAR"; gear: Section }
  | { type: "ADD_LEGACY_GEAR"; gear: Section }
  | { type: "ADD_WEAPON"; weapon: Section }
  | { type: "ADD_ENCHANT"; enchant: Section }
  | { type: "ADD_POWER"; power: Section }
  | { type: "SET_CHARACTER_NAME"; name: string }
  | { type: "ADD_CHARDEV"; charDev: Section }
  | { type: "ADD_ARCHETYPE"; archetype: Section }
  | { type: "RESET" };

// Progress Tracking Interface
export interface ProgressState {
  statStep: number;
  quirkStep: number;
  quirkCount: number;
  gearStep: number;
  gearCount: number;
  legacyGearStep: number;
  legacyGearCount: number;
  enchantStep: number;
  enchantCount: number;
  powerStep: number;
  powerCount: number;
  charDevStep: number;
  charDevMax: number;
}

// Complete Character Info Interface
export interface CompleteCharacterInfo {
  name: string;
  race: string;
  subrace: string;
  archetype: string;
  stats: CharacterStats;
  quirks: string[];
  house: string;
  gears: CharacterItem[];
  legacyGears: CharacterItem[];
  weapons: CharacterItem[];
  enchants: string[];
  powers: string[];
  charDevs: string[];
  pve: string;
  // Additional archetype-specific results
  trickstersCard?: string;
  slayerRace?: string;
  demonSubrace?: string;
  maraisRace1?: string;
  maraisRace2?: string;
  goldenOrderRune?: string;
  starkWolf?: string;
  ashinaSword?: string;
  dessendreSkill?: string;
  // Uma parents
  umaParent1?: string;
  umaParent2?: string;
  // Vampire specific
  uniqueVampireTrain?: string;
  vampireTaste?: string;
  // Wibu series
  wibuSeries?: string;
}

// Character Item Interface (for gear/weapons with usability and enchants)
export interface CharacterItem {
  name: string;
  usable: boolean;
  enchants?: Section[]; // Add enchants to weapons
  image?: string; // Add image property
}

// Weapon with Enchants Interface
export interface WeaponWithEnchants extends Section {
  enchants: Section[];
  usable: boolean;
}

// Wheel Navigation Interface
export interface WheelNavigation {
  currentWheel: WheelStep;
  setCurrentWheel: (wheel: WheelStep) => void;
  jumpToWheel: (wheelKey: string) => void;
}

// Animation State Interface
export interface AnimationState {
  angle: number;
  isSpinning: boolean;
  rolledResult: Section | null;
}

// Stat Wheel Keys Type
export type StatWheelKey =
  | "strength"
  | "speed"
  | "durability"
  | "iq"
  | "battleIQ"
  | "martialArts";

// Wheel Step Keys Type
export type WheelStepKey =
  | "race"
  | "subrace"
  | "skeleton-lineage"
  | "uma-parent-1"
  | "uma-parent-2"
  | "uniqueVampireTrain"
  | "vampireTaste"
  | "archetype"
  | "wibu"
  | "trickster-card"
  | "slayer-race"
  | "demon-subrace"
  | StatWheelKey
  | "quirk-count"
  | "quirk"
  | "house"
  | "gear-count"
  | "legacy-gear-count"
  | "gear"
  | "legacy-gear"
  | "weapon-exist"
  | "unique-weapon-exist"
  | "weapon"
  | "unique-weapon"
  | "usabilityCheck"
  | "weapon-enchant-count"
  | "weapon-enchant"
  | "power-count"
  | "power"
  | "char-dev"
  | "pve";

// House Special Wheels Type
export type HouseSpecialWheel =
  | "House Stark"
  | "Golden Order"
  | "Ashina Clan"
  | "Dessendre Family";

// Race Special Cases Type
export type SpecialRaceCase = "Skeleton" | "Uma" | "Angel" | "Vampire";

// Archetype Special Cases Type
export type SpecialArchetypeCase =
  | "Trickster"
  | "Slayer"
  | "Guardian of Demons"
  | "Wibu";

// Wibu Series Type
export type WibuSeries = "JJK" | "Jojo" | "Naruto" | "One Piece" | "Bleach";

// Component Props Interfaces
export interface LeftPanelProps {
  characterState: CharacterState;
  dispatch: React.Dispatch<CharacterAction>;
  jumpToWheel: (wheelKey: string) => void;
  handleNextStep: (key: string, resultName: string) => void;
  statStep?: number;
}

export interface CenterWheelProps {
  currentWheel: WheelStep;
  rolledResult: Section | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isSpinning: boolean;
  spin: () => void;
  nextStep: () => void;
  resetWheels: () => void;
  handleGetData: () => void;
  handleCharacterComplete: () => void;
}

export interface RightPanelProps {
  characterState: CharacterState;
  jumpToWheel: (wheelKey: string) => void;
}

// Hook Return Types
export interface UseCharacterWheelReturn {
  // State
  characterState: CharacterState;
  currentWheel: WheelStep;
  statStep: number;
  showDialog: boolean;
  dialogData: CompleteCharacterInfo | null;

  // Actions
  dispatch: React.Dispatch<CharacterAction>;
  jumpToWheel: (wheelKey: string) => void;
  handleNextStep: (key: string, resultName: string) => void;
  handleGetData: () => void;
  handleCharacterComplete: () => void;
  resetAll: () => void;
  setShowDialog: (show: boolean) => void;
  setCurrentWheel: (wheel: WheelStep) => void;

  // Progress tracking
  quirkStep: number;
  quirkCount: number;
  gearStep: number;
  gearCount: number;
  legacyGearStep: number;
  legacyGearCount: number;
  enchantStep: number;
  enchantCount: number;
  powerStep: number;
  powerCount: number;
  charDevStep: number;
  charDevMax: number;
}

export interface UseWheelAnimationProps {
  currentWheel: WheelStep;
  onSpinComplete?: (result: Section) => void;
  audioRefs?: Record<string, React.RefObject<HTMLAudioElement>>;
}

export interface UseWheelAnimationReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isSpinning: boolean;
  angle: number;
  rolledResult: Section | null;
  cachedSections: any[];
  spin: () => void;
  resetAnimation: () => void;
  setRolledResult: (result: Section | null) => void;
}

// Dialog Component Props
export interface CharacterDataDialogProps {
  showDialog: boolean;
  dialogData: CompleteCharacterInfo | null;
  onClose: () => void;
}
