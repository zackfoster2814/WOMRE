/**
 * Effect Resolver
 *
 * Resolve và apply effects vào character.
 * Tính toán total stats sau khi áp dụng tất cả effects.
 */

import type {
  Effect,
  EffectSource,
  EffectSourceType,
  CharacterStats,
  StatName,
  DynamicStatTarget,
  CharacterEffects,
  ResolvedEffect,
  CombatContext,
  Condition
} from './types';
import { EffectRegistry } from './registry';
import type { Character } from '../types/character';

// ============================================================================
// STAT UTILITIES
// ============================================================================

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

/**
 * Convert character stats format to our format
 */
export function convertStats(stats: { str: number; spd: number; dur: number; iq: number; biq: number; ma: number }): CharacterStats {
  return {
    strength: stats.str,
    speed: stats.spd,
    durability: stats.dur,
    iq: stats.iq,
    biq: stats.biq,
    ma: stats.ma
  };
}

/**
 * Create empty stats
 */
export function emptyStats(): CharacterStats {
  return { strength: 0, speed: 0, durability: 0, iq: 0, biq: 0, ma: 0 };
}

/**
 * Clone stats
 */
export function cloneStats(stats: CharacterStats): CharacterStats {
  return { ...stats };
}

/**
 * Find lowest stat
 */
export function findLowestStat(stats: CharacterStats): StatName {
  let lowest: StatName = 'strength';
  let lowestValue = stats.strength;

  for (const stat of STAT_NAMES) {
    if (stats[stat] < lowestValue) {
      lowestValue = stats[stat];
      lowest = stat;
    }
  }

  return lowest;
}

/**
 * Find highest stat
 */
export function findHighestStat(stats: CharacterStats): StatName {
  let highest: StatName = 'strength';
  let highestValue = stats.strength;

  for (const stat of STAT_NAMES) {
    if (stats[stat] > highestValue) {
      highestValue = stats[stat];
      highest = stat;
    }
  }

  return highest;
}

/**
 * Get random stat
 */
export function getRandomStat(): StatName {
  return STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
}

/**
 * Resolve dynamic stat target to actual stat name(s)
 */
export function resolveStatTarget(target: DynamicStatTarget, stats: CharacterStats): StatName[] {
  switch (target) {
    case 'all':
      return [...STAT_NAMES];
    case 'lowest':
      return [findLowestStat(stats)];
    case 'highest':
      return [findHighestStat(stats)];
    case 'random':
      return [getRandomStat()];
    case 'odd':
      return ['strength', 'durability', 'biq']; // 1st, 3rd, 5th
    case 'even':
      return ['speed', 'iq', 'ma']; // 2nd, 4th, 6th
    default:
      return [target as StatName];
  }
}

// ============================================================================
// EFFECT RESOLVER CLASS
// ============================================================================

export class EffectResolver {
  /**
   * Gather all effect sources from a character
   */
  static gatherEffectSources(character: Character): EffectSource[] {
    const sources: EffectSource[] = [];

    // Race
    if (character.race?.race) {
      const raceEntry = EffectRegistry.get('race', character.race.race);
      if (raceEntry) {
        sources.push({
          type: 'race',
          name: character.race.race,
          effects: raceEntry.effects,
          rawDescription: raceEntry.description,
          isActive: true
        });
      }
    }

    // Sub-race (may contain multiple sub-races separated by " + ")
    if (character.race?.subRace) {
      // Split by " + " to handle cases like "Rice Shower + Agnes Tachyon"
      const subRaces = character.race.subRace.split(/\s*\+\s*/).map(s => s.trim()).filter(s => s);

      for (const subRace of subRaces) {
        const subRaceEntry = EffectRegistry.get('sub_race', subRace);
        if (subRaceEntry) {
          sources.push({
            type: 'sub_race',
            name: subRace,
            effects: subRaceEntry.effects,
            rawDescription: subRaceEntry.description,
            isActive: true
          });
        }
      }
    }

    // Archetypes
    for (const archetype of character.archetypes || []) {
      const entry = EffectRegistry.get('archetype', archetype);
      if (entry) {
        sources.push({
          type: 'archetype',
          name: archetype,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true
        });
      }
    }

    // Quirks
    for (const quirk of character.quirks || []) {
      const entry = EffectRegistry.get('quirk', quirk);
      if (entry) {
        sources.push({
          type: 'quirk',
          name: quirk,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true
        });
      }
    }

    // Powers
    for (const power of character.powers || []) {
      const entry = EffectRegistry.get('power', power);
      if (entry) {
        sources.push({
          type: 'power',
          name: power,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true
        });
      }
    }

    // Weapons
    for (const weapon of character.weapons || []) {
      const entry = EffectRegistry.get('weapon', weapon.name);
      if (entry) {
        sources.push({
          type: 'weapon',
          name: weapon.name,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: weapon.usable !== false,
          isDisabled: weapon.usable === false,
          disabledReason: weapon.usable === false ? 'Không dùng được' : undefined
        });
      }
    }

    // Runes
    for (const rune of character.runes?.runes || []) {
      const entry = EffectRegistry.get('rune', rune);
      if (entry) {
        sources.push({
          type: 'rune',
          name: rune,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true
        });
      }
    }

    // Runeword
    if (character.runes?.runeword) {
      const entry = EffectRegistry.get('runeword', character.runes.runeword);
      if (entry) {
        sources.push({
          type: 'runeword',
          name: character.runes.runeword,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true
        });
      }
    }

    // Gear
    for (const gear of [...(character.gear?.normalGear || []), ...(character.gear?.legacyGear || [])]) {
      const entry = EffectRegistry.get('gear', gear);
      if (entry) {
        sources.push({
          type: 'gear',
          name: gear,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true
        });
      }
    }

    // House
    if (character.house) {
      const entry = EffectRegistry.get('house', character.house);
      if (entry) {
        sources.push({
          type: 'house',
          name: character.house,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true
        });
      }
    }

    return sources;
  }

  /**
   * Check if a condition is satisfied
   */
  static checkCondition(condition: Condition, context: CombatContext): boolean {
    let result = false;

    switch (condition.type) {
      case 'always':
        result = true;
        break;

      case 'probability':
        result = Math.random() * 100 < (condition.chance || 0);
        break;

      case 'stat_compare':
        if (condition.stat && condition.operator) {
          const selfStats = resolveStatTarget(condition.stat, context.self.stats);
          const selfValue = selfStats.reduce((sum, s) => sum + context.self.stats[s], 0) / selfStats.length;

          let compareValue: number;
          if (condition.compareWith === 'opponent' && context.opponent) {
            const oppStats = resolveStatTarget(condition.stat, context.opponent.stats);
            compareValue = oppStats.reduce((sum, s) => sum + context.opponent!.stats[s], 0) / oppStats.length;
          } else if (condition.compareWith === 'value') {
            compareValue = condition.compareValue || 0;
          } else if (condition.compareWith === 'own_stat' && condition.compareStat) {
            compareValue = context.self.stats[condition.compareStat];
          } else {
            compareValue = 0;
          }

          result = this.compare(selfValue, condition.operator, compareValue);
        }
        break;

      case 'race_match':
        if (condition.races && context.opponent) {
          result = condition.races.some(r =>
            r.toLowerCase() === context.opponent!.race.toLowerCase()
          );
        }
        if (condition.excludeRaces && context.opponent) {
          result = !condition.excludeRaces.some(r =>
            r.toLowerCase() === context.opponent!.race.toLowerCase()
          );
        }
        break;

      case 'race_tier_compare':
        if (condition.tierOperator && context.opponent) {
          result = this.compare(
            context.self.raceTier,
            condition.tierOperator,
            context.opponent.raceTier
          );
        }
        break;

      case 'bracket':
        if (condition.bracket === 'finals') {
          result = context.isFinals;
        } else if (condition.bracket) {
          result = context.self.bracket === condition.bracket;
        }
        break;

      case 'pvp_win_count':
        if (condition.winCount !== undefined && condition.winCountOperator) {
          result = this.compare(
            context.self.pvpWins,
            condition.winCountOperator,
            condition.winCount
          );
        }
        break;

      case 'has_item':
        if (condition.itemType === 'lover') {
          result = context.self.hasLover;
        } else if (condition.itemType === 'power' && condition.itemName) {
          result = context.self.powers.includes(condition.itemName);
        } else if (condition.itemType === 'quirk' && condition.itemName) {
          result = context.self.quirks.includes(condition.itemName);
        } else if (condition.itemType === 'weapon' && condition.itemName) {
          result = context.self.weapons.includes(condition.itemName);
        }
        break;

      case 'opponent_has':
        if (context.opponent) {
          if (condition.opponentItemType === 'lover') {
            result = context.opponent.hasLover;
          } else if (condition.opponentItemType === 'power' && condition.opponentItemName) {
            result = context.opponent.powers.includes(condition.opponentItemName);
          }
        }
        break;

      default:
        result = true;
    }

    return condition.negate ? !result : result;
  }

  private static compare(a: number, op: string, b: number): boolean {
    switch (op) {
      case '>': return a > b;
      case '<': return a < b;
      case '=': return a === b;
      case '>=': return a >= b;
      case '<=': return a <= b;
      case '!=': return a !== b;
      default: return false;
    }
  }

  /**
   * Check if all conditions are satisfied
   */
  static checkConditions(conditions: Condition[] | undefined, context: CombatContext): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every(c => this.checkCondition(c, context));
  }

  /**
   * Resolve all immediate effects and calculate total stats
   */
  static resolveImmediateEffects(
    sources: EffectSource[],
    baseStats: CharacterStats
  ): CharacterEffects {
    const result: CharacterEffects = {
      statModifiers: [],
      combatEffects: [],
      immunities: [],
      buffs: [],
      totalStats: cloneStats(baseStats),
      baseStats: cloneStats(baseStats),
      bonusStats: emptyStats()
    };

    for (const source of sources) {
      if (!source.isActive || source.isDisabled) continue;

      for (const effect of source.effects) {
        // Only process immediate effects
        if (effect.timing !== 'immediate') {
          // Store for later use in combat
          result.combatEffects.push({
            source,
            effect,
            isActive: true
          });
          continue;
        }

        // Process stat modifiers
        if (effect.type === 'stat_modifier' && effect.stat && effect.value !== undefined) {
          const targetStats = resolveStatTarget(effect.stat, result.totalStats);

          for (const stat of targetStats) {
            result.statModifiers.push({
              stat,
              value: effect.value,
              isBase: effect.isBase || false,
              source: source.name
            });

            // Apply to stats
            if (effect.isBase) {
              result.baseStats[stat] += effect.value;
            } else {
              result.bonusStats[stat] += effect.value;
            }
            result.totalStats[stat] += effect.value;
          }
        }

        // Process immunities
        if (effect.type === 'immunity' && effect.immuneTo) {
          result.immunities.push(...effect.immuneTo);
        }

        // Store buffs
        if (effect.type === 'buff') {
          result.buffs.push({
            source,
            effect,
            isActive: true
          });
        }
      }
    }

    // Ensure unique immunities
    result.immunities = [...new Set(result.immunities)];

    return result;
  }

  /**
   * Resolve combat effects based on context
   */
  static resolveCombatEffects(
    characterEffects: CharacterEffects,
    context: CombatContext
  ): ResolvedEffect[] {
    const activeEffects: ResolvedEffect[] = [];

    for (const resolved of characterEffects.combatEffects) {
      const { source, effect } = resolved;

      // Check timing
      const timingMatch = this.checkTiming(effect.timing, context);
      if (!timingMatch) continue;

      // Check conditions
      const conditionsMet = this.checkConditions(effect.conditions, context);
      if (!conditionsMet) continue;

      // Check trigger once
      if (effect.triggerOnce && effect.triggered) continue;

      activeEffects.push({
        source,
        effect,
        isActive: true,
        reason: `Timing: ${effect.timing}, Conditions met`
      });
    }

    return activeEffects;
  }

  private static checkTiming(timing: Effect['timing'], context: CombatContext): boolean {
    switch (timing) {
      case 'immediate':
        return true;
      case 'during_combat':
        return true; // Always applicable during combat resolution
      case 'before_combat':
        return true; // Checked before combat starts
      case 'after_combat':
        return true; // Checked after combat ends
      case 'after_combat_win':
        return true; // Will be checked when we know the result
      case 'after_combat_lose':
        return true;
      case 'on_loser_bracket':
        return context.self.bracket === 'loser';
      case 'on_winner_bracket':
        return context.self.bracket === 'winner';
      case 'on_finals':
        return context.isFinals;
      case 'pve_only':
        return context.isPvE;
      default:
        return true;
    }
  }

  /**
   * Apply combat effects to modify stats during combat
   */
  static applyCombatStatModifiers(
    effects: ResolvedEffect[],
    selfStats: CharacterStats,
    opponentStats?: CharacterStats
  ): { selfStats: CharacterStats; opponentStats?: CharacterStats } {
    const modifiedSelf = cloneStats(selfStats);
    const modifiedOpponent = opponentStats ? cloneStats(opponentStats) : undefined;

    for (const { effect } of effects) {
      if (effect.type === 'stat_modifier' || effect.type === 'buff') {
        if (effect.target === 'self' && effect.stat && effect.value !== undefined) {
          const stats = resolveStatTarget(effect.stat, modifiedSelf);
          for (const stat of stats) {
            modifiedSelf[stat] += effect.value;
          }
        }
      }

      if (effect.type === 'debuff' && modifiedOpponent) {
        if (effect.stat && effect.value !== undefined) {
          const stats = resolveStatTarget(effect.stat, modifiedOpponent);
          for (const stat of stats) {
            modifiedOpponent[stat] += effect.value; // value is already negative
          }
        }
      }
    }

    return { selfStats: modifiedSelf, opponentStats: modifiedOpponent };
  }

  /**
   * Get total starting combat points
   */
  static getStartingPoints(effects: ResolvedEffect[]): number {
    let points = 0;

    for (const { effect } of effects) {
      if (effect.type === 'combat_points' && effect.timing === 'before_combat') {
        points += effect.points || 0;
      }
    }

    return points;
  }

  /**
   * Calculate full character effects
   */
  static calculateCharacterEffects(character: Character): CharacterEffects {
    const sources = this.gatherEffectSources(character);
    const baseStats = convertStats(character.stats);
    return this.resolveImmediateEffects(sources, baseStats);
  }

  /**
   * Get effect summary for a specific source (weapon, gear, power, etc.)
   * Returns a formatted string showing stat changes like "+2 STR, -1 SPD"
   */
  static getEffectSummary(sourceName: string, sourceType: EffectSourceType): string {
    const entry = EffectRegistry.get(sourceType, sourceName);
    if (!entry) return '';

    const statChanges: string[] = [];
    const statAbbrev: Record<StatName, string> = {
      strength: 'STR',
      speed: 'SPD',
      durability: 'DUR',
      iq: 'IQ',
      biq: 'BIQ',
      ma: 'MA'
    };

    for (const effect of entry.effects) {
      if (effect.type === 'stat_modifier' && effect.timing === 'immediate' && effect.value !== undefined) {
        if (effect.stat === 'all') {
          const prefix = effect.value > 0 ? '+' : '';
          statChanges.push(`${prefix}${effect.value} All`);
        } else if (effect.stat && effect.stat in statAbbrev) {
          const prefix = effect.value > 0 ? '+' : '';
          statChanges.push(`${prefix}${effect.value} ${statAbbrev[effect.stat as StatName]}`);
        }
      }
    }

    return statChanges.join(', ');
  }

  /**
   * Get all effect sources with their stat summaries for a character
   * Useful for displaying detailed breakdown in UI
   */
  static getCharacterEffectBreakdown(character: Character): EffectSourceBreakdown[] {
    const sources = this.gatherEffectSources(character);
    const breakdown: EffectSourceBreakdown[] = [];

    for (const source of sources) {
      const statChanges: StatChange[] = [];

      for (const effect of source.effects) {
        if (effect.type === 'stat_modifier' && effect.timing === 'immediate' && effect.value !== undefined) {
          if (effect.stat === 'all') {
            for (const stat of STAT_NAMES) {
              statChanges.push({ stat, value: effect.value });
            }
          } else if (effect.stat && STAT_NAMES.includes(effect.stat as StatName)) {
            statChanges.push({ stat: effect.stat as StatName, value: effect.value });
          }
        }
      }

      if (statChanges.length > 0 || source.rawDescription) {
        breakdown.push({
          type: source.type,
          name: source.name,
          statChanges,
          description: source.rawDescription,
          isActive: source.isActive !== false,
          isDisabled: source.isDisabled || false
        });
      }
    }

    return breakdown;
  }
}

// ============================================================================
// EFFECT BREAKDOWN TYPES
// ============================================================================

export interface StatChange {
  stat: StatName;
  value: number;
}

export interface EffectSourceBreakdown {
  type: EffectSourceType;
  name: string;
  statChanges: StatChange[];
  description?: string;
  isActive: boolean;
  isDisabled: boolean;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// Additional alias export
export { convertStats as toEffectStats };

// Re-export STAT_NAMES for external use
export { STAT_NAMES };
