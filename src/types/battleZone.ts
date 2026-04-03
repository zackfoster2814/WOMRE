// ============================================================================
// BattleZone shared types & interfaces
// ============================================================================
import { Character, CharacterStats } from "./character";
import { EffectSourceBreakdown } from "../effects/resolver";

// Types for PvE
export interface BossStats {
  str: number | null;
  spd: number | null;
  dur: number | null;
  iq: number | null;
  biq: number | null;
  ma: number | null;
}

export interface RuleEffect {
  type: string;
  target: "boss" | "team";
  description: string;
  threshold?: number;
  bonusPerStat?: number;
  race?: string;
  bonus?: number;
}

export interface Boss {
  id: number;
  name: string;
  stats: BossStats;
  rules?: string[];
  ruleEffects?: RuleEffect[];
  reward: string;
  punishment: string;
}

export interface PlayerData {
  no: number;
  name: string;
  username: string;
  stats: CharacterStats;
  baseStats?: CharacterStats;
  statModifiers?: {
    stat: string;
    value: number;
    isBase: boolean;
    source: string;
  }[];
  team?: number;
  quirks?: string[];
  race?: string;
  subRace?: string;
  archetypes?: string[];
  powers?: string[];
  weapons?: string[];
  gear?: string[];
  effectBreakdown?: EffectSourceBreakdown[];
  pveOnlyFeatures?: string[];
}

export interface TeamMemberJson {
  name: string;
  username: string;
}

export interface TeamJson {
  id: number;
  boss: string | null;
  members: TeamMemberJson[];
}

export interface BattleResult {
  outcome: "win" | "lose";
  rounds: Record<string, "win" | "lose" | "tie" | "parry" | "other" | null>;
  tiebreak?: "win" | "lose" | null;
  notes?: string;
}

export interface BattleView {
  teamId: number;
  boss: Boss | null;
  members: TeamMemberJson[];
  playerData: PlayerData[];
  result?: BattleResult | null;
}

// PvP Player data with calculated stats
export interface PvPPlayerData {
  no: number;
  name: string;
  username: string;
  race: string;
  raceTier: number;
  stats: CharacterStats;
  baseStats: CharacterStats;
  breakdown: EffectSourceBreakdown[];
  character?: Character;
}

// Combat round result
export interface RoundResult {
  stat: string;
  statLabel: string;
  player1Value: number;
  player2Value: number;
  winner: "player1" | "player2" | "tie";
}

// Combat result
export interface CombatResult {
  rounds: RoundResult[];
  player1Score: number;
  player2Score: number;
  startPlayer1Score: number;
  startPlayer2Score: number;
  winner: "player1" | "player2";
  tieBreaker?: "race" | null;
}

// ── Step-by-step combat interfaces ───────────────────────────────────────────
export interface CarryOverEffect {
  player: "player1" | "player2";
  source: string;
  stat: keyof CharacterStats;
  value: number;
  description: string;
}

export interface RoundEvent {
  player: "player1" | "player2";
  source: string;
  description: string;
  type: "stat_boost" | "stat_debuff" | "point_change" | "carry_over" | "info";
}

export interface PointChange {
  player: "player1" | "player2";
  delta: number;
  reason: string;
}

export interface RoundLog {
  roundIndex: number;
  statLabel: string;
  statKey: string;
  p1ValueUsed: number;
  p2ValueUsed: number;
  winner: "player1" | "player2" | "tie";
  p1Score: number;
  p2Score: number;
  events: RoundEvent[];
  pointChanges: PointChange[];
  carryOverToNext: CarryOverEffect[];
}

// Dothraki: 6 rules
export type DothrakiRule = 1 | 2 | 3 | 4 | 5 | 6 | null;

export interface StepCombatState {
  p1Stats: CharacterStats;
  p2Stats: CharacterStats;
  p1Score: number;
  p2Score: number;
  startP1Score: number;
  startP2Score: number;
  p1CarryOver: CarryOverEffect[];
  p2CarryOver: CarryOverEffect[];
  resolvedRounds: RoundResult[];
  roundLogs: RoundLog[];
  p1TenacityFired: boolean;
  p2TenacityFired: boolean;
  p1ConquerorFired: boolean;
  p2ConquerorFired: boolean;
  p1FiredHandlers: Set<string>;
  p2FiredHandlers: Set<string>;
  p1DothrakiRule: DothrakiRule;
  p2DothrakiRule: DothrakiRule;
}

export interface InventoryItem {
  sourceType: string;
  name: string;
  description: string;
}

export interface StatBubble {
  id: number;
  text: string;
  isPositive: boolean;
  /** vị trí ngang: % từ left của màn hình */
  x: number;
  /** vị trí dọc khởi điểm: % từ bottom của màn hình */
  startY: number;
}

/** When launched from the tournament bracket, pass these to save the result back. */
export interface TournamentMatchContext {
  matchNumber: number;
  player1No: number;
  player2No: number;
  existingWinnerNo?: number;
  existingScore?: string | null;
  existingSpecialEvent?: string | null;
  existingNote?: string | null;
  displayLabel?: string;
}

export interface TournamentSaveResult {
  winnerNo: number;
  score: string | null;
  specialEvent: string | null;
  note: string | null;
}

export interface BattleModeProps {
  onBack: () => void;
  isWebView?: boolean;
  tournamentMatch?: TournamentMatchContext;
  onSaveTournamentResult?: (result: TournamentSaveResult) => void;
  onNextMatch?: (result: TournamentSaveResult) => void;
}
