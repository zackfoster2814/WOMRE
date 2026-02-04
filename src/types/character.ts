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

// Nested archetype structure (e.g., Wibu -> Jojo -> The World)
export interface NestedArchetype {
  name: string;           // Main archetype (e.g., "Wibu")
  subType?: string;       // Sub-type from wheel (e.g., "Jojo", "JJK", "Bleach")
  subSubType?: string;    // Sub-sub-type (e.g., "The World", "Self-Embodiment of Perfection")
}

// Nested house structure (e.g., New London -> Thinkers)
export interface NestedHouse {
  name: string;           // Main house (e.g., "New London", "House Stark")
  subType?: string;       // Sub-type (e.g., "Thinkers", "Grey Wind", "Godrick")
  subTypeIsLost?: boolean; // Sub-type can be lost (e.g., "Godrick (đã mất)")
  statBonuses?: string[]; // Stat bonuses from house (e.g., ["+2 Str", "+1 Spd", "+2 Dura"] for Tracen Academy)
  isLost?: boolean;       // House can be lost (kicked out)
  // Loại mất nhà:
  // - 'kinda_homeless': Rời nhà nhưng vẫn giữ stat bonuses đã nhận
  // - 'no_more_home': Bị đuổi và mất tất cả bonuses từ nhà
  lostType?: 'kinda_homeless' | 'no_more_home';
}

export interface PvPReward {
  description: string;
  applied: boolean;
}

// Tournament status types
export type TournamentStatus = 'alive' | 'eliminated' | 'champion';
export type TournamentRound = '-' | '256' | '128' | '64' | '32' | '16' | '8' | 'quarter' | 'semi' | 'final';
export type TournamentBracket = '-' | 'winner' | 'loser';

export interface TournamentInfo {
  status: TournamentStatus;       // còn sống / đã bị loại / vô địch
  round: TournamentRound;         // vòng thi đấu hiện tại
  bracket: TournamentBracket;     // nhánh thắng / thua
  pvpWins?: number;               // số trận PvP thắng
}

export interface Character {
  // Basic Info
  no: number;
  name: string;
  username: string;

  // Parasitic Status (for hosts who have a symbiote attached)
  isParasite: boolean;
  parasiteInfo?: string[];
  parasiteName?: string;     // Name of the parasite attached (e.g., "Majin (majinlord666)")
  parasiteType?: string;     // Type of parasite (e.g., "Mephisto", "Diablo", "67")

  // Symbiosis Status (for the symbiote/parasite itself)
  isSymbiosis?: boolean;
  symbiosisType?: string;  // e.g., "Mephisto", "Diablo"
  symbiosisHost?: string;  // e.g., "Quý Trần Tường (wyug1234)"

  // Race & Class
  race: CharacterRace;
  archetypes: string[];  // Support multiple archetypes (flat list for backward compat)
  nestedArchetypes?: NestedArchetype[];  // Detailed archetype info with sub-types

  // Quirks
  quirks: LossableItem[];

  // Stats
  stats: CharacterStats;

  // Flag to indicate Giant race bonus has been pre-applied to stats
  // Used when stats were manually calculated (e.g., after Inversion)
  giantBonusApplied?: boolean;

  // Original base stats before effects like Inversion
  // Used to show the roll values for transparency
  originalBaseStats?: CharacterStats;

  // Faction - can have multiple houses, some may be lost (kicked out)
  houses: LossableItem[];
  nestedHouses?: NestedHouse[];  // Detailed house info with sub-types (e.g., New London -> Thinkers)

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

  // Tournament Status
  tournament?: TournamentInfo;
}

export interface CharacterSummary {
  no: number;
  name: string;
  username: string;
  race: string;
  archetypes: string[];
  nestedArchetypes?: NestedArchetype[];  // Detailed archetype info
  team?: number;
  house?: string;
  nestedHouses?: NestedHouse[];  // Detailed house info
}

export interface CharacterDatabase {
  characters: Character[];
  lastUpdated: string;
}
