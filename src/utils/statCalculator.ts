import { CharacterStats, StatModifier, StatModifierType } from "@/types/characterTypes";

/**
 * Stat Calculator Utility
 *
 * Handles two types of stat modifications:
 * 1. BUFF/DEBUFF: Temporary +/- modifiers that ADD to base stat (don't change base)
 * 2. SET_BASE: Permanent changes that REPLACE the base stat value
 */

export type StatKey = 'strength' | 'speed' | 'durability' | 'iq' | 'battleIQ' | 'martialArts';

export const STAT_KEYS: StatKey[] = ['strength', 'speed', 'durability', 'iq', 'battleIQ', 'martialArts'];

/**
 * Calculate final stats with modifiers
 * This is for DISPLAY purposes - shows base + buffs/debuffs
 */
export function calculateFinalStats(stats: CharacterStats): Record<StatKey, number> {
  const modifiers = stats.modifiers || [];
  const finalStats: Record<StatKey, number> = {
    strength: parseInt(stats.strength) || 0,
    speed: parseInt(stats.speed) || 0,
    durability: parseInt(stats.durability) || 0,
    iq: parseInt(stats.iq) || 0,
    battleIQ: parseInt(stats.battleIQ) || 0,
    martialArts: parseInt(stats.martialArts) || 0,
  };

  // Apply each modifier
  modifiers.forEach(modifier => {
    if (modifier.stat === 'all') {
      // Apply to all stats
      STAT_KEYS.forEach(statKey => {
        finalStats[statKey] = applyModifier(finalStats[statKey], modifier);
      });
    } else if (STAT_KEYS.includes(modifier.stat as StatKey)) {
      // Apply to specific stat
      const statKey = modifier.stat as StatKey;
      finalStats[statKey] = applyModifier(finalStats[statKey], modifier);
    }
  });

  return finalStats;
}

/**
 * Apply a single modifier to a stat value
 */
function applyModifier(baseStat: number, modifier: StatModifier): number {
  switch (modifier.type) {
    case 'buff':
      return baseStat + modifier.value;

    case 'debuff':
      return baseStat - Math.abs(modifier.value);

    case 'set_base':
      // set_base directly replaces the value
      return modifier.value;

    default:
      return baseStat;
  }
}

/**
 * Apply permanent SET_BASE modifiers to character stats
 * This CHANGES the base stat values permanently
 */
export function applyPermanentModifiers(stats: CharacterStats): CharacterStats {
  const modifiers = stats.modifiers || [];
  const updatedStats = { ...stats };

  // Only apply SET_BASE type modifiers
  const setBaseModifiers = modifiers.filter(m => m.type === 'set_base' && m.isPermanent);

  setBaseModifiers.forEach(modifier => {
    if (modifier.stat === 'all') {
      // Apply to all stats
      STAT_KEYS.forEach(statKey => {
        updatedStats[statKey] = modifier.value.toString();
      });
    } else if (STAT_KEYS.includes(modifier.stat as StatKey)) {
      // Apply to specific stat
      updatedStats[modifier.stat as StatKey] = modifier.value.toString();
    }
  });

  // Remove applied set_base modifiers (they've been applied to base)
  updatedStats.modifiers = modifiers.filter(m => !(m.type === 'set_base' && m.isPermanent));

  return updatedStats;
}

/**
 * Get modifiers summary for display
 */
export function getModifiersSummary(stats: CharacterStats): Record<StatKey, {
  base: number;
  buffs: number;
  debuffs: number;
  final: number;
  modifiers: StatModifier[];
}> {
  const modifiers = stats.modifiers || [];
  const summary: Record<StatKey, any> = {} as any;

  STAT_KEYS.forEach(statKey => {
    const baseStat = parseInt(stats[statKey]) || 0;
    const relevantModifiers = modifiers.filter(
      m => m.stat === statKey || m.stat === 'all'
    ).filter(m => m.type !== 'set_base'); // Don't count set_base in summary

    const buffs = relevantModifiers
      .filter(m => m.type === 'buff')
      .reduce((sum, m) => sum + m.value, 0);

    const debuffs = relevantModifiers
      .filter(m => m.type === 'debuff')
      .reduce((sum, m) => sum + Math.abs(m.value), 0);

    summary[statKey] = {
      base: baseStat,
      buffs,
      debuffs,
      final: baseStat + buffs - debuffs,
      modifiers: relevantModifiers,
    };
  });

  return summary;
}

/**
 * Create a buff modifier
 */
export function createBuffModifier(params: {
  id: string;
  source: string;
  sourceName: string;
  stat: string;
  value: number;
  condition?: string;
  isPermanent?: boolean;
  description: string;
}): StatModifier {
  return {
    id: params.id,
    source: params.source as any,
    sourceName: params.sourceName,
    type: 'buff',
    stat: params.stat,
    value: Math.abs(params.value), // Buffs are always positive
    condition: params.condition,
    isPermanent: params.isPermanent ?? false,
    description: params.description,
  };
}

/**
 * Create a debuff modifier
 */
export function createDebuffModifier(params: {
  id: string;
  source: string;
  sourceName: string;
  stat: string;
  value: number;
  condition?: string;
  isPermanent?: boolean;
  description: string;
}): StatModifier {
  return {
    id: params.id,
    source: params.source as any,
    sourceName: params.sourceName,
    type: 'debuff',
    stat: params.stat,
    value: Math.abs(params.value), // Store as positive, will be subtracted
    condition: params.condition,
    isPermanent: params.isPermanent ?? false,
    description: params.description,
  };
}

/**
 * Create a set base stat modifier
 * This REPLACES the base stat value
 */
export function createSetBaseModifier(params: {
  id: string;
  source: string;
  sourceName: string;
  stat: string;
  value: number;
  description: string;
}): StatModifier {
  return {
    id: params.id,
    source: params.source as any,
    sourceName: params.sourceName,
    type: 'set_base',
    stat: params.stat,
    value: params.value,
    isPermanent: true, // set_base is always permanent
    description: params.description,
  };
}

/**
 * Helper to check if a stat value needs modification based on race
 * Example: Giant race needs to modify IQ/Strength after stat rolls
 */
export function checkRaceStatModifications(
  stats: CharacterStats,
  race: string,
  subrace?: string
): StatModifier[] {
  const modifiers: StatModifier[] = [];

  // Giant: Modify IQ/Strength based on which is higher
  if (race === 'Giant') {
    const strength = parseInt(stats.strength) || 0;
    const iq = parseInt(stats.iq) || 0;

    if (iq > strength) {
      // IQ > Strength: +5 IQ, -5 Strength
      modifiers.push(createSetBaseModifier({
        id: 'giant-iq-boost',
        source: 'race',
        sourceName: 'Giant',
        stat: 'iq',
        value: iq + 5,
        description: 'Giant trait: IQ > Strength (+5 IQ)',
      }));
      modifiers.push(createSetBaseModifier({
        id: 'giant-strength-reduction',
        source: 'race',
        sourceName: 'Giant',
        stat: 'strength',
        value: Math.max(1, strength - 5),
        description: 'Giant trait: IQ > Strength (-5 Strength)',
      }));
    } else if (strength > iq) {
      // Strength > IQ: +5 Strength, -5 IQ
      modifiers.push(createSetBaseModifier({
        id: 'giant-strength-boost',
        source: 'race',
        sourceName: 'Giant',
        stat: 'strength',
        value: strength + 5,
        description: 'Giant trait: Strength > IQ (+5 Strength)',
      }));
      modifiers.push(createSetBaseModifier({
        id: 'giant-iq-reduction',
        source: 'race',
        sourceName: 'Giant',
        stat: 'iq',
        value: Math.max(1, iq - 5),
        description: 'Giant trait: Strength > IQ (-5 IQ)',
      }));
    } else {
      // Equal: +3 to both
      modifiers.push(createSetBaseModifier({
        id: 'giant-equal-iq',
        source: 'race',
        sourceName: 'Giant',
        stat: 'iq',
        value: iq + 3,
        description: 'Giant trait: Equal stats (+3 IQ)',
      }));
      modifiers.push(createSetBaseModifier({
        id: 'giant-equal-strength',
        source: 'race',
        sourceName: 'Giant',
        stat: 'strength',
        value: strength + 3,
        description: 'Giant trait: Equal stats (+3 Strength)',
      }));
    }
  }

  // Skeleton: Lock IQ to 1
  if (race === 'Skeleton') {
    modifiers.push(createSetBaseModifier({
      id: 'skeleton-iq-lock',
      source: 'race',
      sourceName: 'Skeleton',
      stat: 'iq',
      value: 1,
      description: 'Skeleton: IQ locked at 1',
    }));
  }

  // Orc: +1 Strength
  if (race === 'Orc') {
    const strength = parseInt(stats.strength) || 0;
    modifiers.push(createSetBaseModifier({
      id: 'orc-strength-boost',
      source: 'race',
      sourceName: 'Orc',
      stat: 'strength',
      value: strength + 1,
      description: 'Orc trait: +1 Strength',
    }));
  }

  return modifiers;
}

/**
 * Helper to process subrace stat modifications
 */
export function checkSubraceStatModifications(
  stats: CharacterStats,
  subrace: string
): StatModifier[] {
  const modifiers: StatModifier[] = [];

  // Flame Dragon: +1 to lowest stat
  if (subrace === 'Flame Dragon') {
    const lowestStat = findLowestStat(stats);
    if (lowestStat) {
      const currentValue = parseInt(stats[lowestStat]) || 0;
      modifiers.push(createSetBaseModifier({
        id: 'flame-dragon-boost',
        source: 'subrace',
        sourceName: 'Flame Dragon',
        stat: lowestStat,
        value: currentValue + 1,
        description: `Flame Dragon: +1 to lowest stat (${lowestStat})`,
      }));
    }
  }

  // Ice Dragon: +1 to lowest stat
  if (subrace === 'Ice Dragon') {
    const lowestStat = findLowestStat(stats);
    if (lowestStat) {
      const currentValue = parseInt(stats[lowestStat]) || 0;
      modifiers.push(createSetBaseModifier({
        id: 'ice-dragon-boost',
        source: 'subrace',
        sourceName: 'Ice Dragon',
        stat: lowestStat,
        value: currentValue + 1,
        description: `Ice Dragon: +1 to lowest stat (${lowestStat})`,
      }));
    }
  }

  // Add more subrace modifications here...

  return modifiers;
}

/**
 * Find the lowest stat
 */
function findLowestStat(stats: CharacterStats): StatKey | null {
  let lowestStat: StatKey | null = null;
  let lowestValue = Infinity;

  STAT_KEYS.forEach(statKey => {
    const value = parseInt(stats[statKey]) || 0;
    if (value < lowestValue) {
      lowestValue = value;
      lowestStat = statKey;
    }
  });

  return lowestStat;
}
