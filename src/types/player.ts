// Shared player display types used across multiple pages/components

import type {
  CharacterStats,
  LossableItem,
  NestedArchetype,
  NestedHouse,
  Gear,
  Weapon,
  Rune,
  PvPReward,
  TournamentInfo,
} from "./character";

/**
 * Full player display object used in PlayerListPage and PlayerInfoPanel.
 * Contains all parsed fields needed for display, filtering and effect calculation.
 */
export interface PlayerSummary {
  no: number;
  name: string;
  username: string;
  race: string;
  subRace?: string;
  isReincarnator?: boolean;
  actualRace?: string;
  archetypes: string[];
  nestedArchetypes?: NestedArchetype[];
  quirks: LossableItem[];
  powers: LossableItem[];
  houses: LossableItem[];
  nestedHouses?: NestedHouse[];
  team?: number;
  stats: CharacterStats;
  gear: Gear;
  weapons: Weapon[];
  runes: Rune;
  charDevs: LossableItem[];
  lover?: LossableItem[];
  pvpRewards?: PvPReward[];
  giantBonusApplied?: boolean;
  isParasite?: boolean;
  parasiteInfo?: string[];
  parasiteName?: string;
  parasiteType?: string;
  isSymbiosis?: boolean;
  symbiosisType?: string;
  symbiosisHost?: string;
  // Tournament status
  tournament?: TournamentInfo;
}
