/**
 * Effect Registry
 *
 * Central registry để quản lý tất cả effect definitions.
 * Dễ dàng thêm/sửa/xóa effects mà không cần sửa code logic.
 */

import type {
  EffectRegistryEntry,
  EffectSourceType,
  Effect,
  DynamicStatTarget,
  EffectTiming,
  EffectTarget,
  Condition
} from './types';

// ============================================================================
// EFFECT REGISTRY CLASS
// ============================================================================

class EffectRegistryClass {
  private entries: Map<string, EffectRegistryEntry> = new Map();
  private entriesByType: Map<EffectSourceType, Map<string, EffectRegistryEntry>> = new Map();

  constructor() {
    // Initialize type maps
    const types: EffectSourceType[] = [
      'race', 'sub_race', 'archetype', 'archetype_sub', 'quirk', 'power', 'summon',
      'gear', 'weapon', 'rune', 'runeword', 'house', 'house_sub',
      'char_dev', 'pvp_reward', 'lover', 'symbiosis'
    ];
    types.forEach(type => {
      this.entriesByType.set(type, new Map());
    });
  }

  /**
   * Register một effect entry
   */
  register(entry: EffectRegistryEntry): void {
    const key = this.createKey(entry.sourceType, entry.name);
    this.entries.set(key, entry);

    const typeMap = this.entriesByType.get(entry.sourceType);
    if (typeMap) {
      typeMap.set(entry.name.toLowerCase(), entry);
    }
  }

  /**
   * Register nhiều entries cùng lúc
   */
  registerAll(entries: EffectRegistryEntry[]): void {
    entries.forEach(entry => this.register(entry));
  }

  /**
   * Lấy effect entry theo type và name
   */
  get(sourceType: EffectSourceType, name: string): EffectRegistryEntry | undefined {
    const typeMap = this.entriesByType.get(sourceType);
    if (!typeMap) return undefined;

    // Try exact match first
    let entry = typeMap.get(name.toLowerCase());
    if (entry) return entry;

    // Try fuzzy match (remove parentheses content, trim, etc.)
    const cleanName = this.cleanName(name);
    for (const [key, value] of typeMap) {
      if (this.cleanName(key) === cleanName) {
        return value;
      }
    }

    return undefined;
  }

  /**
   * Lấy tất cả entries theo type
   */
  getAllByType(sourceType: EffectSourceType): EffectRegistryEntry[] {
    const typeMap = this.entriesByType.get(sourceType);
    if (!typeMap) return [];
    return Array.from(typeMap.values());
  }

  /**
   * Kiểm tra entry có tồn tại không
   */
  has(sourceType: EffectSourceType, name: string): boolean {
    return this.get(sourceType, name) !== undefined;
  }

  /**
   * Xóa entry
   */
  remove(sourceType: EffectSourceType, name: string): boolean {
    const key = this.createKey(sourceType, name);
    const deleted = this.entries.delete(key);

    const typeMap = this.entriesByType.get(sourceType);
    if (typeMap) {
      typeMap.delete(name.toLowerCase());
    }

    return deleted;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries.clear();
    this.entriesByType.forEach(map => map.clear());
  }

  /**
   * Get all entries
   */
  getAll(): EffectRegistryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Search entries by name (partial match)
   */
  search(query: string, sourceType?: EffectSourceType): EffectRegistryEntry[] {
    const lowerQuery = query?.toLowerCase();
    const results: EffectRegistryEntry[] = [];

    if (sourceType) {
      const typeMap = this.entriesByType.get(sourceType);
      if (typeMap) {
        for (const entry of typeMap.values()) {
          if (entry.name.toLowerCase().includes(lowerQuery)) {
            results.push(entry);
          }
        }
      }
    } else {
      for (const entry of this.entries.values()) {
        if (entry.name.toLowerCase().includes(lowerQuery)) {
          results.push(entry);
        }
      }
    }

    return results;
  }

  searchExact(
    query: string,
    sourceType?: EffectSourceType,
  ): EffectRegistryEntry[] {
    let results: EffectRegistryEntry[] = [];
    const lowerCaseQuery = query.toLowerCase();

    if (sourceType) {
      const typeMap = this.entriesByType.get(sourceType);
      if (typeMap) {
        for (const entry of typeMap.values()) {
          if (entry.name.toLowerCase() == lowerCaseQuery) {
            results.push(entry);
          }
        }
      }
    } else {
      for (const entry of this.entries.values()) {
        if (entry.name.toLowerCase() == lowerCaseQuery) {
          results.push(entry);
        }
      }
    }

    return results;
  }

  private createKey(sourceType: EffectSourceType, name: string): string {
    return `${sourceType}:${name.toLowerCase()}`;
  }

  private cleanName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s*\([^)]*\)\s*/g, '') // Remove parentheses content
      .replace(/[^\w\s]/g, '')          // Remove special chars
      .trim();
  }
}

// Singleton instance
export const EffectRegistry = new EffectRegistryClass();

// ============================================================================
// HELPER FUNCTIONS để tạo Effects dễ dàng hơn
// ============================================================================

/**
 * Tạo stat modifier effect
 */
export function statMod(
  stat: DynamicStatTarget,
  value: number,
  options: {
    isBase?: boolean;
    timing?: EffectTiming;
    target?: EffectTarget;
    conditions?: Condition[];
  } = {}
): Effect {
  return {
    type: 'stat_modifier',
    stat,
    value,
    isBase: options.isBase ?? false,
    timing: options.timing ?? 'immediate',
    target: options.target ?? 'self',
    conditions: options.conditions
  };
}

/**
 * Tạo grant item effect
 */
export function grant(
  grantType: Effect['grantType'],
  nameOrCount: string | number = 'random',
  count: number = 1
): Effect {
  return {
    type: `grant_${grantType}` as Effect['type'],
    grantType,
    grantName: typeof nameOrCount === 'string' ? nameOrCount : 'random',
    grantCount: typeof nameOrCount === 'number' ? nameOrCount : count,
    timing: 'immediate',
    target: 'self'
  };
}

/**
 * Tạo debuff effect
 */
export function debuff(
  stat: DynamicStatTarget,
  value: number,
  timing: EffectTiming = 'during_combat'
): Effect {
  return {
    type: 'debuff',
    stat,
    value: -Math.abs(value), // Đảm bảo value âm
    timing,
    target: 'opponent'
  };
}

/**
 * Tạo combat points effect
 */
export function combatPoints(
  points: number,
  options: {
    timing?: EffectTiming;
    conditions?: Condition[];
  } = {}
): Effect {
  return {
    type: 'combat_points',
    points,
    timing: options.timing ?? 'during_combat',
    target: 'self',
    conditions: options.conditions
  };
}

/**
 * Tạo immunity effect
 */
export function immune(to: string[]): Effect {
  return {
    type: 'immunity',
    immuneTo: to,
    timing: 'immediate',
    target: 'self'
  };
}

/**
 * Tạo condition: probability
 */
export function chance(percent: number): Condition {
  return {
    type: 'probability',
    chance: percent
  };
}

/**
 * Tạo condition: stat compare
 */
export function whenStat(
  stat: DynamicStatTarget,
  operator: Condition['operator'],
  compareWith: 'opponent' | number
): Condition {
  if (typeof compareWith === 'number') {
    return {
      type: 'stat_compare',
      stat,
      operator,
      compareWith: 'value',
      compareValue: compareWith
    };
  }
  return {
    type: 'stat_compare',
    stat,
    operator,
    compareWith: 'opponent'
  };
}

/**
 * Tạo condition: race match
 */
export function vsRace(races: string[], exclude = false): Condition {
  return {
    type: 'race_match',
    races: exclude ? undefined : races,
    excludeRaces: exclude ? races : undefined
  };
}

/**
 * Tạo condition: bracket
 */
export function inBracket(bracket: 'winner' | 'loser' | 'finals'): Condition {
  return {
    type: 'bracket',
    bracket
  };
}

/**
 * Tạo condition: PvP wins
 */
export function afterPvPWins(count: number, operator: Condition['winCountOperator'] = '>='): Condition {
  return {
    type: 'pvp_win_count',
    winCount: count,
    winCountOperator: operator
  };
}

/**
 * Tạo condition: has item
 */
export function hasItem(itemType: Condition['itemType'], itemName?: string): Condition {
  return {
    type: 'has_item',
    itemType,
    itemName
  };
}

/**
 * Tạo condition: opponent has
 */
export function opponentHas(itemType: string, itemName?: string): Condition {
  return {
    type: 'opponent_has',
    opponentItemType: itemType,
    opponentItemName: itemName
  };
}

// ============================================================================
// REGISTRY ENTRY BUILDER
// ============================================================================

export class EffectEntryBuilder {
  private entry: Partial<EffectRegistryEntry> = {
    effects: []
  };

  constructor(sourceType: EffectSourceType, name: string) {
    this.entry.sourceType = sourceType;
    this.entry.name = name;
  }

  description(desc: string): this {
    this.entry.description = desc;
    return this;
  }

  weight(w: number): this {
    this.entry.weight = w;
    return this;
  }

  unique(): this {
    this.entry.isUnique = true;
    return this;
  }

  tier(t: number): this {
    this.entry.tier = t;
    return this;
  }

  effect(e: Effect): this {
    this.entry.effects!.push(e);
    return this;
  }

  effects(es: Effect[]): this {
    this.entry.effects!.push(...es);
    return this;
  }

  /**
   * Quick helper: +X stat
   */
  addStat(stat: DynamicStatTarget, value: number, isBase = false): this {
    return this.effect(statMod(stat, value, { isBase }));
  }

  /**
   * Quick helper: +X all stats
   */
  addAllStats(value: number, isBase = false): this {
    return this.addStat('all', value, isBase);
  }

  /**
   * Quick helper: grant power
   */
  grantPower(name: string = 'random', count: number = 1): this {
    return this.effect(grant('power', name, count));
  }

  /**
   * Quick helper: grant quirk
   */
  grantQuirk(name: string = 'random', count: number = 1): this {
    return this.effect(grant('quirk', name, count));
  }

  /**
   * Quick helper: debuff opponent
   */
  debuffOpponent(stat: DynamicStatTarget, value: number): this {
    return this.effect(debuff(stat, value, 'before_combat'));
  }

  /**
   * Quick helper: combat starting point
   */
  startingPoints(points: number): this {
    return this.effect(combatPoints(points, { timing: 'before_combat' }));
  }

  /**
   * Quick helper: immunity
   */
  immuneTo(...things: string[]): this {
    return this.effect(immune(things));
  }

  build(): EffectRegistryEntry {
    if (!this.entry.name || !this.entry.sourceType) {
      throw new Error('Name and sourceType are required');
    }
    if (!this.entry.description) {
      this.entry.description = '';
    }
    return this.entry as EffectRegistryEntry;
  }

  /**
   * Build and register to global registry
   */
  register(): EffectRegistryEntry {
    const entry = this.build();
    EffectRegistry.register(entry);
    return entry;
  }
}

/**
 * Create a new entry builder
 */
export function defineEffect(sourceType: EffectSourceType, name: string): EffectEntryBuilder {
  return new EffectEntryBuilder(sourceType, name);
}
