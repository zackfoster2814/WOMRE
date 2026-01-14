export interface WheelItem {
  id: string;
  name: string;
  weight: number;
  effectDescription?: string;
  color?: string;
  customSound?: string; // Base64 data URL for custom sound effect
  customSoundName?: string; // Original filename
  disabled?: boolean; // Flag to temporarily disable item from spinning
}

export interface WheelPreset {
  id: string;
  name: string;
  items: WheelItem[];
  customSfxUrl?: string;
  wheelName?: string; // Custom wheel name
}

export interface SpinResult {
  item: WheelItem;
  rotation: number;
}

export interface SpinHistoryEntry {
  id: string;
  itemName: string;
  itemWeight: number;
  itemColor?: string;
  timestamp: number; // Unix timestamp
  wheelName?: string; // Wheel name at time of spin
}

// Player stats interface
export interface PlayerStats {
  Str: number;  // Strength
  Spd: number;  // Speed
  Dur: number;  // Durability
  IQ: number;   // Intelligence
  BIQ: number;  // Battle IQ
  MA: number;   // Martial Arts / Combat Ability
}

// Player interface
export interface Player {
  id: string;
  name: string;
  stats: PlayerStats;
  avatar?: string; // Optional avatar image URL
  notes?: string;  // Optional notes/description
}

// Battle mode types
export type BattleMode = 'stats-comparison' | 'wheel-of-truth';
export type BattleType = 'pve' | 'pvp';

// Battle result interface
export interface BattleResult {
  winner: Player;
  loser: Player;
  mode: BattleMode;
  statComparisons?: {
    stat: keyof PlayerStats;
    player1Value: number;
    player2Value: number;
  }[];
  timestamp: number;
}
