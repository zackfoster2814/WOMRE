/**
 * Custom Handler Types
 *
 * Định nghĩa types cho custom effect handlers.
 */

import type { Character } from '../../types/character';
import type { CharacterStats, Effect, EffectSource, StatName } from '../types';

// ============================================================================
// HANDLER CONTEXT - Thông tin context cho handler
// ============================================================================

/**
 * Context cho immediate handlers (tính stats)
 */
export interface ImmediateHandlerContext {
  character: Character;
  baseStats: CharacterStats;
  currentStats: CharacterStats;
  source: EffectSource;
  effect: Effect;
  allCharacters?: Character[]; // For cross-character lookups (e.g., Femboy checking if lover has AIDS)
  /** Danh sách sources đã filtered (active, không disabled) — để handlers đếm active items đúng */
  activeSources?: EffectSource[];
}

/**
 * Round results type
 */
export type RoundResult = 'win' | 'lose' | 'tie' | undefined;

/**
 * Round results for all stats
 */
export interface RoundResults {
  strength?: RoundResult;
  speed?: RoundResult;
  durability?: RoundResult;
  iq?: RoundResult;
  biq?: RoundResult;
  ma?: RoundResult;
  [key: string]: RoundResult;
}

/**
 * Context cho combat handlers
 */
export interface CombatHandlerContext {
  self: {
    character: Character;
    stats: CharacterStats;
    baseStats: CharacterStats;
    race: string;
    raceTier: number;
    bracket: string;
    pvpWins: number;
    hasLover: boolean;
    powers: string[];
    quirks: string[];
    weapons: any[];
    gears: string[];
    roundsWon: number;
    roundsLost: number;
    totalDebuff?: number;           // Tổng điểm debuff trên nhân vật này
    totalCombats?: number;          // Số combat đã tham gia
    consecutiveRoundWins?: number;  // Số round thắng liên tiếp hiện tại
    gambleWinBonus?: number;        // % bonus thắng gamble (Dice of the Dead)
    duringCombatActivations?: number;
  };
  opponent?: {
    character: Character;
    stats: CharacterStats;
    baseStats: CharacterStats;
    race: string;
    raceTier: number;
    hasLover: boolean;
    lover?: string | string[];
    powers: any[];
    quirks: string[];
    weapons: any[];
    gears: string[];
    totalDebuff?: number;           // Tổng điểm debuff của đối thủ
  };
  isFinals: boolean;
  isPvE: boolean;
  isLoserBracket?: boolean;         // Đang ở nhánh thua
  currentRound: number;
  currentRoundStat?: string;        // Short key của round hiện tại: str/spd/dur/iq/biq/ma
  totalRounds: number;
  currentRoundResult?: 'win' | 'lose' | 'tie'; // Kết quả của round hiện tại
  matchNumber?: number;             // Match number trong tournament
  bracket?: string;
  roundResults?: RoundResults;
}

// ============================================================================
// HANDLER RESULTS - Kết quả trả về từ handler
// ============================================================================

/**
 * Kết quả từ immediate handler
 */
export interface ImmediateHandlerResult {
  // Stat modifications
  statModifiers?: Array<{
    stat: StatName;
    value: number;
    isBase?: boolean;
  }>;

  // Skip default effect processing
  skipDefault?: boolean;

  // Additional info for display
  description?: string;

  // Metadata lưu trên gear (dùng cho conditional combat handlers)
  metadata?: Record<string, unknown>;
}

/**
 * Kết quả từ combat handler
 */
export interface CombatHandlerResult {
  // Stat modifications during combat
  selfStatMods?: Array<{
    stat: StatName;
    value: number;
  }>;
  opponentStatMods?: Array<{
    stat: StatName;
    value: number;
  }>;

  // Combat points
  selfPoints?: number;
  opponentPoints?: number;
  blockOpponentPoint?: boolean; // Chặn điểm đối thủ về 0 (không trừ thêm nếu đang 0)

  // Special effects
  autoWin?: boolean;
  autoWinPriority?: 'weakest' | 'normal' | 'strongest'; // Priority khi nhiều autoWin cùng lúc
  autoLose?: boolean;
  triggerOnce?: boolean;          // Handler chỉ kích hoạt 1 lần (engine tự track)
  skipRound?: boolean;
  opponentWeaponDisabled?: boolean;
  opponentIsekai?: boolean;

  // Grant items after combat
  grantPower?: string;
  grantPowers?: string[];          // Nhiều powers cùng lúc
  grantGear?: string | string[];   // 1 hoặc nhiều gear
  grantQuirk?: string;
  grantCreatorFavor?: number;      // Nhận Creator's Favor

  // Remove/steal items
  removePower?: string;
  removeGear?: string;
  removeWeapon?: string;
  removeOpponentGear?: string;     // Xóa gear của đối thủ
  removeAllGearAndWeapon?: boolean; // Xóa toàn bộ gear và weapon của self
  stealGearFromRandomLivingPlayer?: boolean; // Cướp gear từ người ngẫu nhiên còn sống
  transferGearToRandomHouseMember?: boolean; // Chuyển gear sang người ngẫu nhiên trong House

  // Cancel effect
  cancelGearEffect?: string;       // Huỷ hiệu ứng của gear (cả 2 bên)
  cancelOpponentGearEffect?: string;

  // Update arbitrary character fields (tracked by engine)
  updateCharacterField?: Record<string, unknown>;

  // Skip default effect processing
  skipDefault?: boolean;

  // Description for log
  description?: string;
}

// ============================================================================
// HANDLER FUNCTION TYPES
// ============================================================================

/**
 * Immediate handler function type
 * Called during stat calculation
 */
export type ImmediateHandler = (
  context: ImmediateHandlerContext
) => ImmediateHandlerResult | null;

/**
 * Combat handler function type
 * Called during combat resolution
 */
export type CombatHandler = (
  context: CombatHandlerContext
) => CombatHandlerResult | null;

/**
 * Handler can be either immediate or combat type
 */
export type CustomHandler = ImmediateHandler | CombatHandler;

// ============================================================================
// HANDLER METADATA
// ============================================================================

export interface HandlerMetadata {
  name: string;
  description?: string;
  type: 'immediate' | 'combat' | 'both';
  handler: CustomHandler;
}
