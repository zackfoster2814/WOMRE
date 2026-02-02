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
   * Parse stat bonus string into an Effect
   * Examples: "+4 Dura", "+6 Str", "-2 IQ", "+1 All"
   */
  private static parseStatBonus(bonusStr: string): Effect | null {
    // Pattern: +/-NUMBER STAT_NAME
    const match = bonusStr.match(/^([+-]?\d+)\s+(\w+)/i);
    if (!match) return null;

    const value = parseInt(match[1]);
    const statStr = match[2].toLowerCase();

    // Map stat abbreviations to DynamicStatTarget
    const statMap: Record<string, DynamicStatTarget> = {
      'str': 'strength',
      'strength': 'strength',
      'spd': 'speed',
      'speed': 'speed',
      'dur': 'durability',
      'dura': 'durability',
      'durability': 'durability',
      'iq': 'iq',
      'biq': 'biq',
      'ma': 'ma',
      'all': 'all'
    };

    const stat = statMap[statStr];
    if (!stat) return null;

    return {
      type: 'stat_modifier',
      stat,
      value,
      timing: 'immediate',
      target: 'self'
    };
  }

  /**
   * Gather all effect sources from a character
   */
  static gatherEffectSources(character: Character): EffectSource[] {
    const sources: EffectSource[] = [];

    // Race
    if (character.race?.race) {
      const raceEntry = EffectRegistry.get('race', character.race.race);
      if (raceEntry) {
        // If Giant bonus was pre-applied (e.g., due to Inversion), skip stat modifier effects
        const isGiantWithPreAppliedBonus = character.race.race === 'Giant' && character.giantBonusApplied;
        const filteredEffects = isGiantWithPreAppliedBonus
          ? raceEntry.effects.filter(e => e.type !== 'stat_modifier')
          : raceEntry.effects;

        sources.push({
          type: 'race',
          name: character.race.race,
          effects: filteredEffects,
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

    // Quirks (skip lost items)
    for (const quirk of character.quirks || []) {
      if (quirk.isLost) continue; // Skip lost items
      const entry = EffectRegistry.get('quirk', quirk.name);
      if (entry) {
        sources.push({
          type: 'quirk',
          name: quirk.name,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true
        });
      }
    }

    // Powers (skip lost items)
    for (const power of character.powers || []) {
      if (power.isLost) continue; // Skip lost items
      const entry = EffectRegistry.get('power', power.name);
      if (entry) {
        sources.push({
          type: 'power',
          name: power.name,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true
        });
      }
    }

    // Weapons (skip lost items)
    for (const weapon of character.weapons || []) {
      if (weapon.isLost) continue; // Skip lost items
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

    // Check if player has a usable weapon (not lost, usable)
    // Runes only activate when player has a weapon
    const hasUsableWeapon = (character.weapons || []).some(
      weapon => !weapon.isLost && weapon.usable !== false
    );

    // Runes (skip lost items, only active if player has a usable weapon)
    for (const rune of character.runes?.runes || []) {
      if (rune.isLost) continue; // Skip lost items
      const entry = EffectRegistry.get('rune', rune.name);
      if (entry) {
        sources.push({
          type: 'rune',
          name: rune.name,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: hasUsableWeapon,
          isDisabled: !hasUsableWeapon,
          disabledReason: !hasUsableWeapon ? 'Không có vũ khí' : undefined
        });
      }
    }

    // Runeword (only active if player has a usable weapon)
    if (character.runes?.runeword) {
      const entry = EffectRegistry.get('runeword', character.runes.runeword);
      if (entry) {
        sources.push({
          type: 'runeword',
          name: character.runes.runeword,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: hasUsableWeapon,
          isDisabled: !hasUsableWeapon,
          disabledReason: !hasUsableWeapon ? 'Không có vũ khí' : undefined
        });
      }
    }

    // Gear (skip lost items)
    for (const gear of [...(character.gear?.normalGear || []), ...(character.gear?.legacyGear || [])]) {
      if (gear.isLost) continue; // Skip lost items
      const entry = EffectRegistry.get('gear', gear.name);
      if (entry) {
        sources.push({
          type: 'gear',
          name: gear.name,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true
        });
      }
    }

    // Houses (skip lost houses)
    // Check nestedHouses first for statBonuses, fall back to regular houses
    const processedHouses = new Set<string>();

    for (const house of character.nestedHouses || []) {
      if (house.isLost) continue;
      processedHouses.add(house.name);

      // If house has explicit statBonuses (e.g., ["+2 Str", "+1 Spd", "+2 Dura"]), use those instead of registry effect
      if (house.statBonuses && house.statBonuses.length > 0) {
        const bonusEffects: Effect[] = [];
        for (const bonus of house.statBonuses) {
          const bonusEffect = this.parseStatBonus(bonus);
          if (bonusEffect) {
            bonusEffects.push(bonusEffect);
          }
        }
        if (bonusEffects.length > 0) {
          sources.push({
            type: 'house',
            name: house.name,
            effects: bonusEffects,
            rawDescription: `${house.name}: ${house.statBonuses.join(', ')}`,
            isActive: true
          });
          // Still process sub-type if present and not lost
          if (house.subType && !house.subTypeIsLost) {
            const subEntry = EffectRegistry.get('house_sub', house.subType);
            if (subEntry) {
              sources.push({
                type: 'house_sub' as EffectSourceType,
                name: house.subType,
                effects: subEntry.effects,
                rawDescription: subEntry.description,
                isActive: true
              });
            }
          }
          continue;
        }
      }

      // Otherwise use registry entry
      const entry = EffectRegistry.get('house', house.name);
      if (entry) {
        sources.push({
          type: 'house',
          name: house.name,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true
        });
      }

      // Also process house sub-type if present and not lost
      if (house.subType && !house.subTypeIsLost) {
        const subEntry = EffectRegistry.get('house_sub', house.subType);
        if (subEntry) {
          sources.push({
            type: 'house_sub' as EffectSourceType,
            name: house.subType,
            effects: subEntry.effects,
            rawDescription: subEntry.description,
            isActive: true
          });
        }
      }
    }

    // Fall back to regular houses array for any not in nestedHouses
    for (const house of character.houses || []) {
      if (house.isLost || processedHouses.has(house.name)) continue;
      const entry = EffectRegistry.get('house', house.name);
      if (entry) {
        sources.push({
          type: 'house',
          name: house.name,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true
        });
      }
    }

    // Character Development (skip lost items)
    for (const charDev of character.charDevs || []) {
      if (charDev.isLost) continue; // Skip lost items
      const entry = EffectRegistry.get('char_dev', charDev.name);
      if (entry) {
        sources.push({
          type: 'char_dev',
          name: charDev.name,
          effects: entry.effects,
          rawDescription: entry.description,
          isActive: true
        });
      }
    }

    // Symbiosis (for hosts who have a symbiote)
    if (character.isParasite && character.parasiteInfo) {
      for (const symbiosis of character.parasiteInfo) {
        // Extract symbiosis name (may contain extra info like "Mephisto ( nhận thêm...)")
        const symbiosisName = symbiosis.split('(')[0].trim();
        const entry = EffectRegistry.get('symbiosis', symbiosisName);
        if (entry) {
          sources.push({
            type: 'symbiosis',
            name: symbiosisName,
            effects: entry.effects,
            rawDescription: entry.description,
            isActive: true
          });
        }
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
          // Use base stats if useBaseStats is true, otherwise use total stats
          const statsToUse = condition.useBaseStats && context.self.baseStats
            ? context.self.baseStats
            : context.self.stats;

          const selfStats = resolveStatTarget(condition.stat, statsToUse);
          const selfValue = selfStats.reduce((sum, s) => sum + statsToUse[s], 0) / selfStats.length;

          let compareValue: number;
          if (condition.compareWith === 'opponent' && context.opponent) {
            const oppStatsToUse = condition.useBaseStats && context.opponent.baseStats
              ? context.opponent.baseStats
              : context.opponent.stats;
            const oppStats = resolveStatTarget(condition.stat, oppStatsToUse);
            compareValue = oppStats.reduce((sum, s) => sum + oppStatsToUse[s], 0) / oppStats.length;
          } else if (condition.compareWith === 'value') {
            compareValue = condition.compareValue || 0;
          } else if (condition.compareWith === 'own_stat' && condition.compareStat) {
            compareValue = statsToUse[condition.compareStat];
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
   * Check immediate conditions (stat_compare with own_stat using base stats)
   * This is a simplified check that only works for immediate timing conditions
   */
  static checkImmediateConditions(
    conditions: Condition[] | undefined,
    baseStats: CharacterStats,
    character?: Character
  ): boolean {
    if (!conditions || conditions.length === 0) return true;

    for (const condition of conditions) {
      let result = false;

      switch (condition.type) {
        case 'always':
          result = true;
          break;

        case 'probability':
          result = Math.random() * 100 < (condition.chance || 0);
          break;

        case 'stat_compare':
          // For immediate effects, always use base stats for comparison
          if (condition.stat && condition.operator && condition.compareWith === 'own_stat' && condition.compareStat) {
            const selfStats = resolveStatTarget(condition.stat, baseStats);
            const selfValue = selfStats.reduce((sum, s) => sum + baseStats[s], 0) / selfStats.length;
            const compareValue = baseStats[condition.compareStat];
            result = this.compare(selfValue, condition.operator, compareValue);
          } else if (condition.stat && condition.operator && condition.compareWith === 'value') {
            const selfStats = resolveStatTarget(condition.stat, baseStats);
            const selfValue = selfStats.reduce((sum, s) => sum + baseStats[s], 0) / selfStats.length;
            result = this.compare(selfValue, condition.operator, condition.compareValue || 0);
          } else {
            // Other stat_compare types need combat context, skip for immediate
            result = true;
          }
          break;

        case 'has_char_dev':
          // Check if character has a specific char dev
          if (character && condition.charDev) {
            const hasCharDev = character.charDevs?.some(
              cd => !cd.isLost && cd.name.toLowerCase().includes(condition.charDev!.toLowerCase())
            ) || false;
            result = hasCharDev;
          } else {
            // No character context, default to false (condition not met)
            result = false;
          }
          break;

        case 'has_lover':
          // Check if character has a lover (used to determine virginity loss)
          if (character) {
            result = !!character.lover && character.lover.trim() !== '';
          } else {
            result = false;
          }
          break;

        default:
          // Other condition types need combat context, skip for immediate
          result = true;
      }

      // Apply negate
      if (condition.negate) result = !result;

      // All conditions must pass
      if (!result) return false;
    }

    return true;
  }

  /**
   * Resolve all immediate effects and calculate total stats
   * @param sources - Effect sources to process
   * @param baseStats - Base character stats
   * @param context - Optional combat context for PvE/PvP timing checks
   * @param character - Optional character for condition checks (e.g., has_char_dev)
   */
  static resolveImmediateEffects(
    sources: EffectSource[],
    baseStats: CharacterStats,
    context?: { isPvE?: boolean },
    character?: Character
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
        // Check PvE/PvP timing if context is provided
        if (context !== undefined) {
          if (context.isPvE) {
            // PvE mode: ONLY apply pve_only effects, skip immediate and pvp_only
            if (effect.timing === 'pve_only') {
              // Process this effect as immediate (fall through to stat modifier logic below)
            } else if (effect.timing === 'immediate' || effect.timing === 'pvp_only') {
              // Skip immediate and pvp_only effects in PvE
              result.combatEffects.push({ source, effect, isActive: false, reason: 'Not applicable in PvE - only pve_only effects apply' });
              continue;
            } else {
              // Other non-immediate effects - store for combat
              result.combatEffects.push({ source, effect, isActive: true });
              continue;
            }
          } else {
            // PvP mode: Apply immediate and pvp_only, skip pve_only
            if (effect.timing === 'pve_only') {
              // Skip pve_only effects in PvP
              result.combatEffects.push({ source, effect, isActive: false, reason: 'PvE only - not in PvE' });
              continue;
            } else if (effect.timing === 'pvp_only' || effect.timing === 'immediate') {
              // Process this effect as immediate (fall through to stat modifier logic below)
            } else {
              // Other non-immediate effects - store for combat
              result.combatEffects.push({ source, effect, isActive: true });
              continue;
            }
          }
        } else {
          // No context - only process immediate effects
          if (effect.timing !== 'immediate') {
            // Store for later use in combat
            result.combatEffects.push({
              source,
              effect,
              isActive: true
            });
            continue;
          }
        }

        // Check conditions for immediate effects (use ORIGINAL baseStats for Giant-like effects)
        if (!this.checkImmediateConditions(effect.conditions, baseStats, character)) {
          continue; // Skip this effect if conditions not met
        }

        // Process stat modifiers
        if (effect.type === 'stat_modifier' && effect.stat && effect.value !== undefined) {
          // For effects targeting 'lowest'/'highest' with isBase, use original baseStats to determine which stat
          // This ensures "Base Stat thấp nhất" looks at original base stats, not modified stats
          const statsForResolution = (effect.isBase && (effect.stat === 'lowest' || effect.stat === 'highest'))
            ? baseStats  // Use original base stats passed to this function
            : result.totalStats;
          const targetStats = resolveStatTarget(effect.stat, statsForResolution);

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
      case 'pvp_only':
        return !context.isPvE;
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
   * @param character - Character to calculate effects for
   * @param context - Optional context for PvE/PvP timing (e.g., { isPvE: true } for boss battles)
   */
  static calculateCharacterEffects(
    character: Character,
    context?: { isPvE?: boolean }
  ): CharacterEffects {
    const sources = this.gatherEffectSources(character);
    const baseStats = convertStats(character.stats);
    return this.resolveImmediateEffects(sources, baseStats, context, character);
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

    // Check if any effect has conditions (conditional effects)
    const hasConditionalEffects = entry.effects.some(
      e => e.type === 'stat_modifier' && e.timing === 'immediate' && e.conditions && e.conditions.length > 0
    );

    // If there are conditional effects, return description or "conditional" indicator
    if (hasConditionalEffects) {
      // Return empty to let the UI show just the name without misleading stat info
      return 'conditional';
    }

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
   * Now properly checks conditions using character's base stats
   */
  static getCharacterEffectBreakdown(character: Character): EffectSourceBreakdown[] {
    const sources = this.gatherEffectSources(character);
    const breakdown: EffectSourceBreakdown[] = [];

    // Get character's base stats for condition checking
    const baseStats = convertStats(character.stats);

    for (const source of sources) {
      const statChanges: StatChange[] = [];

      for (const effect of source.effects) {
        if (effect.type === 'stat_modifier' && effect.timing === 'immediate' && effect.value !== undefined) {
          // Check conditions before including in breakdown
          if (!this.checkImmediateConditions(effect.conditions, baseStats, character)) {
            continue; // Skip effects that don't meet conditions
          }

          if (effect.stat === 'all') {
            for (const stat of STAT_NAMES) {
              statChanges.push({ stat, value: effect.value });
            }
          } else if (effect.stat && STAT_NAMES.includes(effect.stat as StatName)) {
            statChanges.push({ stat: effect.stat as StatName, value: effect.value });
          } else if (effect.stat === 'lowest' || effect.stat === 'highest') {
            // Resolve dynamic stat targets using base stats
            const resolvedStats = resolveStatTarget(effect.stat, baseStats);
            for (const stat of resolvedStats) {
              statChanges.push({ stat, value: effect.value });
            }
          }
        }
      }

      if (statChanges.length > 0 || source.rawDescription) {
        // Merge duplicate stat changes (e.g., +1 BIQ and +2 BIQ from lowest -> +3 BIQ)
        const mergedStatChanges: StatChange[] = [];
        for (const change of statChanges) {
          const existing = mergedStatChanges.find(c => c.stat === change.stat);
          if (existing) {
            existing.value += change.value;
          } else {
            mergedStatChanges.push({ ...change });
          }
        }

        breakdown.push({
          type: source.type,
          name: source.name,
          statChanges: mergedStatChanges,
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
