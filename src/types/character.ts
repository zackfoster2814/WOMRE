// Character System Types

export interface CharacterStats {
  str: number;
  spd: number;
  dur: number;
  iq: number;
  biq: number;
  ma: number;
}

export interface CharacterRace {
  race: string;
  subRace?: string;
  // For Reincarnator: stores the full info like "(Nagi) -> Uma"
  reincarnatorInfo?: string;
}

export interface GearItem {
  name: string;
  isLost?: boolean;  // Items marked as "đã mất" won't affect stats
}

export interface Gear {
  normalGear: GearItem[];
  legacyGear: GearItem[];
}

export interface Weapon {
  type: 'Normal' | 'Unique' | 'Legacy';
  name: string;
  usable?: boolean;
  isLost?: boolean;  // Items marked as "đã mất" won't affect stats
}

export interface RuneItem {
  name: string;
  isLost?: boolean;  // Items marked as "đã mất" won't affect stats
}

export interface Rune {
  runes: RuneItem[];
  runeword?: string;
}

// Common interface for items that can be lost
export interface LossableItem {
  name: string;
  isLost?: boolean;  // Items marked as "đã mất" won't affect stats
}

export interface PvPReward {
  description: string;
  applied: boolean;
}

export interface Character {
  // Basic Info
  no: number;
  name: string;
  username: string;

  // Parasitic Status (for hosts who have a symbiote)
  isParasite: boolean;
  parasiteInfo?: string[];

  // Symbiosis Status (for the symbiote itself)
  isSymbiosis?: boolean;
  symbiosisType?: string;  // e.g., "Mephisto", "Diablo"
  symbiosisHost?: string;  // e.g., "2.Quý Trần Tường (wyug1234)"

  // Race & Class
  race: CharacterRace;
  archetypes: string[];  // Support multiple archetypes

  // Quirks
  quirks: LossableItem[];

  // Stats
  stats: CharacterStats;

  // Faction - can have multiple houses, some may be lost (kicked out)
  houses: LossableItem[];

  // Equipment
  gear: Gear;
  weapons: Weapon[];

  // Runes
  runes: Rune;

  // Abilities
  powers: LossableItem[];

  // Character Development
  charDevs: LossableItem[];  // Support multiple char devs

  // Social
  team?: number;
  lover?: string;

  // PvP Rewards
  pvpRewards?: PvPReward[];
}

export interface CharacterSummary {
  no: number;
  name: string;
  username: string;
  race: string;
  archetypes: string[];
  team?: number;
  house?: string;
}

export interface CharacterDatabase {
  characters: Character[];
  lastUpdated: string;
}
