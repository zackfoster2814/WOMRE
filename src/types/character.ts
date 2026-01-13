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
}

export interface Gear {
  normalGear: string[];
  legacyGear: string[];
}

export interface Weapon {
  type: 'Normal' | 'Unique' | 'Legacy';
  name: string;
  usable?: boolean;
}

export interface Rune {
  runes: string[];
  runeword?: string;
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

  // Parasitic Status
  isParasite: boolean;

  // Race & Class
  race: CharacterRace;
  archetype: string;

  // Quirks
  quirks: string[];

  // Stats
  stats: CharacterStats;

  // Faction
  house?: string;

  // Equipment
  gear: Gear;
  weapons: Weapon[];

  // Runes
  runes: Rune;

  // Abilities
  powers: string[];

  // Character Development
  charDev?: string;

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
  archetype: string;
  team?: number;
  house?: string;
}

export interface CharacterDatabase {
  characters: Character[];
  lastUpdated: string;
}
