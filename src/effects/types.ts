/**
 * Effect System Types
 *
 * Hệ thống này được thiết kế để:
 * 1. Dễ dàng mở rộng thêm effect mới
 * 2. Dễ dàng parse từ text description
 * 3. Dễ dàng apply vào character stats
 * 4. Hỗ trợ conditional effects (điều kiện kích hoạt)
 */

// ============================================================================
// STAT TYPES
// ============================================================================

export type StatName = 'strength' | 'speed' | 'durability' | 'iq' | 'biq' | 'ma';

export type DynamicStatTarget =
  | StatName
  | 'all'           // Tất cả stats
  | 'lowest'        // Stat thấp nhất
  | 'highest'       // Stat cao nhất
  | 'random'        // Random stat
  | 'odd'           // Stats lẻ
  | 'even';         // Stats chẵn

export interface CharacterStats {
  strength: number;
  speed: number;
  durability: number;
  iq: number;
  biq: number;
  ma: number;
}

// ============================================================================
// TIMING - Khi nào effect được kích hoạt
// ============================================================================

export type EffectTiming =
  | 'immediate'           // Ngay khi nhận (passive)
  | 'before_combat'       // Trước Combat
  | 'during_combat'       // Trong Combat
  | 'after_combat'        // Sau Combat
  | 'after_combat_win'    // Sau Combat thắng
  | 'after_combat_lose'   // Sau Combat thua
  | 'after_combat_scoring' // Sau khi tính điểm combat (trước khi xác định thắng/thua)
  | 'before_combat_end'   // Trước khi kết thúc combat
  | 'on_round_win'        // Khi thắng 1 round
  | 'on_round_lose'       // Khi thua 1 round
  | 'on_loser_bracket'    // Khi ở nhánh thua
  | 'on_winner_bracket'   // Khi ở nhánh thắng
  | 'on_finals'           // Khi ở chung kết
  | 'on_death'            // Khi bị loại
  | 'on_pvp_win'          // Khi thắng PvP (tích lũy)
  | 'on_lover_eliminated' // Khi Lover bị loại
  | 'on_aids_received'    // Khi nhận AIDS
  | 'on_gear_received'    // Khi nhận Gear
  | 'on_round_16'         // Khi đến vòng 16
  | 'after_round'         // Sau mỗi vòng tournament
  | 'pve_only';           // Chỉ áp dụng trong PvE

// ============================================================================
// TARGET - Đối tượng chịu ảnh hưởng
// ============================================================================

export type EffectTarget =
  | 'self'              // Bản thân
  | 'opponent'          // Đối thủ
  | 'both'              // Cả 2 (self và opponent)
  | 'lover'             // Lover
  | 'team'              // Đội
  | 'random_player'     // Random player
  | 'all_same_race'     // Tất cả cùng race
  | 'symbiosis_host';   // Host của Symbiosis

// ============================================================================
// EFFECT TYPES
// ============================================================================

export type EffectType =
  // Stat modifications
  | 'stat_modifier'           // +/- stat
  | 'stat_set'                // Set stat = value
  | 'stat_multiply'           // Nhân stat
  | 'stat_swap'               // Đổi 2 stats
  | 'stat_inversion'          // Đảo ngược stats với opponent
  | 'stat_copy'               // Copy stat từ opponent
  | 'stat_respin'             // Re-spin stat

  // Grant items
  | 'grant_power'             // Nhận Power
  | 'grant_quirk'             // Nhận Quirk
  | 'grant_gear'              // Nhận Gear
  | 'grant_rune'              // Nhận Rune
  | 'grant_archetype'         // Nhận Archetype
  | 'grant_lover'             // Nhận Lover
  | 'grant_summon'            // Nhận Summon
  | 'grant_char_dev'          // Nhận Char Dev

  // Remove/steal items
  | 'remove_power'            // Mất Power
  | 'steal_power'             // Cướp Power từ opponent
  | 'remove_gear'             // Mất Gear

  // Combat effects
  | 'combat_points'           // Điểm combat
  | 'auto_win_round'          // Tự động thắng round
  | 'auto_lose_round'         // Tự động thua round
  | 'extra_point_on_win'      // +điểm khi thắng round
  | 'lose_points_on_lose'     // Mất điểm khi thua round

  // Buff/Debuff
  | 'buff'                    // Buff (có thể bị remove)
  | 'debuff'                  // Debuff opponent
  | 'immunity'                // Miễn nhiễm

  // Special
  | 'make_love'               // Biến opponent thành Lover
  | 'isekai'                  // Isekai opponent
  | 'evolve'                  // Tiến hóa (Skeleton -> Lich)
  | 'weapon_disable'          // Vô hiệu hóa vũ khí
  | 'power_disable'           // Vô hiệu hóa Power
  | 'disable_powers'          // Vô hiệu hóa nhiều Power của opponent
  | 'house_assign'            // Gán House cố định
  | 'wheel_grant'             // Cho thêm vòng quay
  | 'grant_wheel'             // Nhận vòng quay con (e.g., Wibu -> Jojo Wheel)
  | 'double_reward'           // Nhân đôi phần thưởng
  | 'custom';                 // Custom effect (cho các effect phức tạp)

// ============================================================================
// CONDITIONS - Điều kiện kích hoạt
// ============================================================================

export type ConditionType =
  | 'always'                  // Luôn kích hoạt
  | 'stat_compare'            // So sánh stat
  | 'has_item'                // Có item
  | 'race_match'              // Match race
  | 'race_tier_compare'       // So sánh tier race
  | 'bracket'                 // Đang ở nhánh nào
  | 'pvp_win_count'           // Số trận PvP thắng
  | 'round_result'            // Kết quả round
  | 'opponent_has'            // Opponent có gì
  | 'probability';            // Xác suất %

export interface Condition {
  type: ConditionType;

  // For stat_compare
  stat?: DynamicStatTarget;
  compareWith?: 'opponent' | 'value' | 'own_stat';
  compareValue?: number;
  compareStat?: StatName;
  operator?: '>' | '<' | '=' | '>=' | '<=' | '!=';
  useBaseStats?: boolean;       // So sánh base stats thay vì total stats

  // For has_item
  itemType?: 'power' | 'quirk' | 'gear' | 'weapon' | 'rune' | 'lover' | 'archetype';
  itemName?: string;

  // For race_match
  races?: string[];
  excludeRaces?: string[];

  // For race_tier_compare
  tierOperator?: '>' | '<' | '=';

  // For bracket
  bracket?: 'winner' | 'loser' | 'finals';

  // For pvp_win_count
  winCount?: number;
  winCountOperator?: '>' | '<' | '=' | '>=' | '<=';

  // For probability
  chance?: number; // 0-100

  // For opponent_has
  opponentItemType?: string;
  opponentItemName?: string;

  // Negate condition
  negate?: boolean;
}

// ============================================================================
// EFFECT DEFINITION
// ============================================================================

export interface Effect {
  id?: string;                    // Unique ID for tracking
  type: EffectType;
  timing: EffectTiming;
  target: EffectTarget;

  // Stat modification
  stat?: DynamicStatTarget;
  value?: number;
  isBase?: boolean;               // Có phải Base stat không

  // For stat operations
  swapWith?: StatName;            // For stat_swap

  // Grant items
  grantType?: 'power' | 'quirk' | 'gear' | 'rune' | 'archetype' | 'lover' | 'summon' | 'char_dev';
  grantName?: string;             // Specific name hoặc 'random'
  grantCount?: number;            // Số lượng

  // Combat points
  points?: number;

  // Immunity
  immuneTo?: string[];            // Miễn nhiễm với gì: ['AIDS', 'debuff', 'steal']

  // Wheel grant
  wheelType?: string;             // Loại wheel: 'elemental', 'summon', 'sub-race'
  wheelName?: string;             // Tên wheel cụ thể: 'Wibu Wheel', 'Stands Wheel'

  // Disable powers
  count?: number;                 // Số lượng power bị disable

  // Evolution
  evolveTo?: string;              // Tiến hóa thành gì
  evolveCondition?: string;       // Điều kiện tiến hóa

  // Conditions
  conditions?: Condition[];       // Tất cả conditions phải thỏa mãn (AND)

  // Stacking
  stackable?: boolean;            // Có thể stack không
  maxStacks?: number;             // Số stack tối đa
  currentStacks?: number;         // Số stack hiện tại

  // Duration
  duration?: 'permanent' | 'combat' | 'round' | number;  // số round cụ thể

  // Trigger limit
  triggerOnce?: boolean;          // Chỉ kích hoạt 1 lần
  triggered?: boolean;            // Đã kích hoạt chưa

  // Raw text for display
  rawText?: string;

  // Custom handler for complex effects
  customHandler?: string;         // Tên function handler
}

// ============================================================================
// EFFECT SOURCE - Nguồn gốc của effect
// ============================================================================

export type EffectSourceType =
  | 'race'
  | 'sub_race'
  | 'archetype'
  | 'archetype_sub'    // Sub-type of archetype (e.g., Jojo for Wibu)
  | 'house_sub'        // Sub-type of house (e.g., Thinkers for New London)
  | 'quirk'
  | 'power'
  | 'gear'
  | 'weapon'
  | 'rune'
  | 'runeword'
  | 'house'
  | 'char_dev'
  | 'pvp_reward'
  | 'lover'
  | 'symbiosis';

export interface EffectSource {
  type: EffectSourceType;
  name: string;
  effects: Effect[];
  rawDescription?: string;

  // For conditional availability
  isActive?: boolean;             // Có đang active không (weapon usable, etc.)
  isDisabled?: boolean;           // Bị vô hiệu hóa
  disabledReason?: string;
}

// ============================================================================
// EFFECT REGISTRY ENTRY
// ============================================================================

export interface EffectRegistryEntry {
  name: string;
  sourceType: EffectSourceType;
  effects: Effect[];
  description: string;

  // Metadata
  weight?: number;                // Trọng số trong wheel
  isUnique?: boolean;             // Unique (chỉ 1 người có)
  tier?: number;                  // Tier/rank

  // Requirements
  requirements?: {
    race?: string[];
    hasItem?: string[];
    minStat?: Partial<CharacterStats>;
  };
}

// ============================================================================
// RESOLVED EFFECTS - Effects đã được tính toán cho character
// ============================================================================

export interface ResolvedEffect {
  source: EffectSource;
  effect: Effect;
  isActive: boolean;
  reason?: string;                // Lý do active/inactive
}

export interface CharacterEffects {
  // Immediate/passive stat modifiers
  statModifiers: {
    stat: StatName;
    value: number;
    isBase: boolean;
    source: string;
  }[];

  // Combat effects (để sử dụng trong combat)
  combatEffects: ResolvedEffect[];

  // Immunities
  immunities: string[];

  // Active buffs
  buffs: ResolvedEffect[];

  // Total calculated stats
  totalStats: CharacterStats;
  baseStats: CharacterStats;
  bonusStats: CharacterStats;
}

// ============================================================================
// COMBAT CONTEXT - Context cho việc resolve effects trong combat
// ============================================================================

export interface CombatContext {
  self: {
    stats: CharacterStats;
    baseStats?: CharacterStats;  // Base stats (từ vòng quay) cho condition check
    race: string;
    raceTier: number;
    hasLover: boolean;
    loverName?: string;
    powers: string[];
    quirks: string[];
    weapons: string[];
    bracket: 'winner' | 'loser';
    pvpWins: number;
  };

  opponent?: {
    stats: CharacterStats;
    baseStats?: CharacterStats;  // Base stats (từ vòng quay) cho condition check
    race: string;
    raceTier: number;
    hasLover: boolean;
    powers: string[];
    quirks: string[];
    weapons: string[];
  };

  isPvE: boolean;
  isFinals: boolean;
  roundResults?: ('win' | 'lose' | 'pending')[];
  currentPoints?: number;
}
