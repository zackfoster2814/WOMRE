/**
 * Effect Parser
 *
 * Parse effect descriptions từ text thành Effect objects.
 * Hỗ trợ nhiều pattern phổ biến trong game.
 */

import type {
  Effect,
  Condition,
  DynamicStatTarget,
  EffectTiming,
  EffectTarget,
  StatName
} from './types';

// ============================================================================
// STAT NAME MAPPING
// ============================================================================

const STAT_ALIASES: Record<string, StatName> = {
  // Strength
  'strength': 'strength',
  'str': 'strength',
  'sức mạnh': 'strength',

  // Speed
  'speed': 'speed',
  'spd': 'speed',
  'tốc độ': 'speed',

  // Durability
  'durability': 'durability',
  'dura': 'durability',
  'dur': 'durability',
  'độ bền': 'durability',

  // IQ
  'iq': 'iq',
  'trí tuệ': 'iq',

  // BIQ
  'biq': 'biq',
  'battle iq': 'biq',

  // MA
  'ma': 'ma',
  'martial arts': 'ma',
  'võ thuật': 'ma'
};

const DYNAMIC_STAT_ALIASES: Record<string, DynamicStatTarget> = {
  ...STAT_ALIASES,
  'all stats': 'all',
  'all stat': 'all',
  'tất cả': 'all',
  'stat thấp nhất': 'lowest',
  'chỉ số thấp nhất': 'lowest',
  'lowest': 'lowest',
  'stat cao nhất': 'highest',
  'chỉ số cao nhất': 'highest',
  'highest': 'highest',
  'random': 'random',
  'ngẫu nhiên': 'random'
};

// ============================================================================
// PARSER CLASS
// ============================================================================

export class EffectParser {
  /**
   * Parse một đoạn text thành array of Effects
   */
  static parse(text: string): Effect[] {
    if (!text || text.trim() === '') return [];

    const effects: Effect[] = [];
    const timing = this.detectTiming(text);
    const target = this.detectTarget(text);

    // Parse từng loại effect
    effects.push(...this.parseStatModifiers(text, timing, target));
    effects.push(...this.parseGrantItems(text, timing));
    effects.push(...this.parseDebuffs(text, timing));
    effects.push(...this.parseCombatPoints(text, timing));
    effects.push(...this.parseImmunities(text));
    effects.push(...this.parseSpecialEffects(text, timing, target));

    // Apply probability conditions if found
    const chanceMatch = text.match(/(?:có\s*)?(\d+)%\s*(?:khả năng|chance)?/i);
    if (chanceMatch && effects.length > 0) {
      const chance = parseInt(chanceMatch[1]);
      effects.forEach(e => {
        if (!e.conditions) e.conditions = [];
        e.conditions.push({ type: 'probability', chance });
      });
    }

    // Set raw text for all effects
    effects.forEach(e => {
      if (!e.rawText) e.rawText = text;
    });

    return effects;
  }

  /**
   * Detect timing từ text
   */
  static detectTiming(text: string): EffectTiming {
    const lower = text.toLowerCase();

    if (lower.includes('trước combat:') || lower.includes('before combat:')) {
      return 'before_combat';
    }
    if (lower.includes('trong combat:') || lower.includes('during combat:') || lower.includes('in combat:')) {
      return 'during_combat';
    }
    if (lower.includes('sau combat thắng:') || lower.includes('after winning:')) {
      return 'after_combat_win';
    }
    if (lower.includes('sau combat thua:') || lower.includes('after losing:')) {
      return 'after_combat_lose';
    }
    if (lower.includes('sau combat:') || lower.includes('after combat:')) {
      return 'after_combat';
    }
    if (lower.includes('[pve only]') || lower.includes('[pvp only]')) {
      return 'pve_only';
    }
    if (lower.includes('nhánh thua') || lower.includes('loser bracket')) {
      return 'on_loser_bracket';
    }
    if (lower.includes('nhánh thắng') || lower.includes('winner bracket')) {
      return 'on_winner_bracket';
    }
    if (lower.includes('chung kết') || lower.includes('finals')) {
      return 'on_finals';
    }
    if (lower.includes('khi thắng round') || lower.includes('round thắng')) {
      return 'on_round_win';
    }
    if (lower.includes('khi thua round') || lower.includes('round thua')) {
      return 'on_round_lose';
    }
    if (lower.includes('sau') && lower.includes('pvp') && lower.includes('thắng')) {
      return 'on_pvp_win';
    }

    return 'immediate';
  }

  /**
   * Detect target từ text
   */
  static detectTarget(text: string): EffectTarget {
    const lower = text.toLowerCase();

    if (lower.includes('đối thủ') || lower.includes('opponent') || lower.includes('debuff:')) {
      return 'opponent';
    }
    if (lower.includes('lover')) {
      return 'lover';
    }
    if (lower.includes('đội') || lower.includes('tổ đội') || lower.includes('team')) {
      return 'team';
    }

    return 'self';
  }

  /**
   * Parse stat modifiers: "+2 Strength", "-1 all stats", "+3 Base Speed"
   */
  static parseStatModifiers(text: string, timing: EffectTiming, target: EffectTarget): Effect[] {
    const effects: Effect[] = [];

    // Pattern: [+/-]X [Base] StatName
    // Examples: "+2 Strength", "-1 all stats", "+3 Base Speed", "nhận +2 vào stat thấp nhất"
    const patterns = [
      // Standard: +2 Strength, -1 all stats
      /([+\-])(\d+)\s*(Base)?\s*(Strength|Speed|Dura(?:bility)?|IQ|BIQ|MA|all stats?)/gi,
      // Vietnamese: +2 vào stat thấp nhất
      /([+\-])(\d+)\s*(?:vào\s*)?(stat\s+)?(thấp nhất|cao nhất|ngẫu nhiên)/gi,
      // Nhận +X stat
      /nhận\s*([+\-])?(\d+)\s*(Base)?\s*(Strength|Speed|Dura(?:bility)?|IQ|BIQ|MA|all stats?)/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const sign = match[1] === '-' ? -1 : 1;
        const value = parseInt(match[2]) * sign;
        const isBase = match[3]?.toLowerCase() === 'base';
        const statRaw = match[4] || match[3]; // Handle different capture groups

        const stat = this.normalizeStatTarget(statRaw);
        if (stat) {
          effects.push({
            type: 'stat_modifier',
            stat,
            value,
            isBase,
            timing,
            target
          });
        }
      }
    }

    return effects;
  }

  /**
   * Parse grant items: "Nhận 2 Power", "Nhận Power "Critical Strike""
   */
  static parseGrantItems(text: string, timing: EffectTiming): Effect[] {
    const effects: Effect[] = [];

    // Process grant patterns
    const pattern1 = /nhận\s*(?:thêm\s*)?(\d*)\s*(Power|Quirk|Gear|Rune|Archetype|Lover|Summon|Char Dev)(?:\s*[""]([^""]+)[""])?/gi;
    let match;
    while ((match = pattern1.exec(text)) !== null) {
      const count = match[1] ? parseInt(match[1]) : 1;
      const itemType = match[2].toLowerCase().replace(' ', '_') as Effect['grantType'];
      const itemName = match[3] || 'random';

      effects.push({
        type: `grant_${itemType}` as Effect['type'],
        grantType: itemType as Effect['grantType'],
        grantName: itemName,
        grantCount: count,
        timing,
        target: 'self'
      });
    }

    // Wheel grants
    const wheelPattern = /nhận\s*(?:thêm\s*)?(?:1\s*)?(?:vòng quay|wheel)\s*[""]?([^"".,\n]+)[""]?/gi;
    while ((match = wheelPattern.exec(text)) !== null) {
      effects.push({
        type: 'wheel_grant',
        wheelType: match[1].trim(),
        timing,
        target: 'self'
      });
    }

    return effects;
  }

  /**
   * Parse debuffs: "Debuff: Đối thủ -2 Speed"
   */
  static parseDebuffs(text: string, timing: EffectTiming): Effect[] {
    const effects: Effect[] = [];

    // Pattern: Debuff: [Đối thủ] -X Stat
    const debuffPattern = /debuff:\s*(?:đối thủ\s*)?([+\-]?\d+)\s*(Strength|Speed|Dura(?:bility)?|IQ|BIQ|MA|all stats?)/gi;
    let match;
    while ((match = debuffPattern.exec(text)) !== null) {
      const value = parseInt(match[1]);
      const stat = this.normalizeStatTarget(match[2]);

      if (stat) {
        effects.push({
          type: 'debuff',
          stat,
          value: -Math.abs(value),
          timing: timing === 'immediate' ? 'during_combat' : timing,
          target: 'opponent'
        });
      }
    }

    // Also check for "Đối thủ bị -X Stat" pattern
    const opponentPattern = /đối thủ\s*(?:bị\s*)?([+\-])(\d+)\s*(Strength|Speed|Dura(?:bility)?|IQ|BIQ|MA|all stats?)/gi;
    while ((match = opponentPattern.exec(text)) !== null) {
      const value = parseInt(match[2]) * (match[1] === '+' ? 1 : -1);
      const stat = this.normalizeStatTarget(match[3]);

      if (stat) {
        effects.push({
          type: 'debuff',
          stat,
          value: -Math.abs(value),
          timing: timing === 'immediate' ? 'during_combat' : timing,
          target: 'opponent'
        });
      }
    }

    return effects;
  }

  /**
   * Parse combat points: "nhận 1 điểm khởi đầu", "+1 điểm khi thắng round"
   */
  static parseCombatPoints(text: string, _timing: EffectTiming): Effect[] {
    const effects: Effect[] = [];

    // Starting points
    const startingPattern = /(?:nhận\s*)?(\d+)\s*điểm\s*(?:combat\s*)?khởi đầu/gi;
    let match;
    while ((match = startingPattern.exec(text)) !== null) {
      effects.push({
        type: 'combat_points',
        points: parseInt(match[1]),
        timing: 'before_combat',
        target: 'self'
      });
    }

    // Extra points on round win
    const roundWinPattern = /(?:nhận\s*)?(?:thêm\s*)?(\d+)\s*điểm\s*(?:khi|mỗi khi)\s*(?:thắng|chiến thắng)\s*round/gi;
    while ((match = roundWinPattern.exec(text)) !== null) {
      effects.push({
        type: 'extra_point_on_win',
        points: parseInt(match[1]),
        timing: 'on_round_win',
        target: 'self'
      });
    }

    // Lose points on round lose
    const roundLosePattern = /mất\s*(?:hết\s*)?(toàn bộ|\d+)\s*điểm\s*(?:khi|mỗi khi)\s*thua/gi;
    while ((match = roundLosePattern.exec(text)) !== null) {
      const points = match[1] === 'toàn bộ' ? -999 : -parseInt(match[1]);
      effects.push({
        type: 'lose_points_on_lose',
        points,
        timing: 'on_round_lose',
        target: 'self'
      });
    }

    return effects;
  }

  /**
   * Parse immunities: "không thể bị AIDS", "miễn nhiễm debuff"
   */
  static parseImmunities(text: string): Effect[] {
    const effects: Effect[] = [];
    const lower = text.toLowerCase();

    const immunities: string[] = [];

    if (lower.includes('không thể bị aids') || lower.includes('miễn nhiễm aids')) {
      immunities.push('AIDS');
    }
    if (lower.includes('không thể bị debuff') || lower.includes('miễn nhiễm debuff')) {
      immunities.push('debuff');
    }
    if (lower.includes('không thể bị cướp') || lower.includes('miễn nhiễm steal')) {
      immunities.push('steal');
    }
    if (lower.includes('không thể bị phá hủy') || lower.includes('indestructible')) {
      immunities.push('destroy');
    }

    if (immunities.length > 0) {
      effects.push({
        type: 'immunity',
        immuneTo: immunities,
        timing: 'immediate',
        target: 'self'
      });
    }

    return effects;
  }

  /**
   * Parse special effects
   */
  static parseSpecialEffects(text: string, timing: EffectTiming, _target: EffectTarget): Effect[] {
    const effects: Effect[] = [];
    const lower = text.toLowerCase();

    // Make love / biến thành Lover
    if (lower.includes('biến') && lower.includes('lover') || lower.includes('make love')) {
      effects.push({
        type: 'make_love',
        timing: timing === 'immediate' ? 'after_combat' : timing,
        target: 'opponent'
      });
    }

    // Isekai
    if (lower.includes('isekai') || lower.includes('bị loại')) {
      effects.push({
        type: 'isekai',
        timing: timing === 'immediate' ? 'after_combat' : timing,
        target: 'opponent'
      });
    }

    // Weapon disable
    if (lower.includes('vô hiệu hóa vũ khí') || lower.includes('disable weapon')) {
      effects.push({
        type: 'weapon_disable',
        timing: 'during_combat',
        target: 'opponent'
      });
    }

    // Power disable
    if (lower.includes('vô hiệu hóa power') || lower.includes('disable power')) {
      effects.push({
        type: 'power_disable',
        timing: 'during_combat',
        target: 'opponent'
      });
    }

    // Evolution patterns (Skeleton -> Lich)
    const evolvePattern = /tiến hóa\s*(?:thành)?\s*([^,.\n]+)/i;
    const evolveMatch = text.match(evolvePattern);
    if (evolveMatch) {
      effects.push({
        type: 'evolve',
        evolveTo: evolveMatch[1].trim(),
        timing,
        target: 'self'
      });
    }

    // House assignment
    const housePattern = /thuộc về\s*House\s*[""]?([^"".,\n]+)[""]?/i;
    const houseMatch = text.match(housePattern);
    if (houseMatch) {
      effects.push({
        type: 'house_assign',
        grantName: houseMatch[1].trim(),
        timing: 'immediate',
        target: 'self'
      });
    }

    // Auto win round
    const autoWinPattern = /(?:mặc định|tự động)\s*thắng\s*round\s*(Strength|Speed|Dura|IQ|BIQ|MA)/i;
    const autoWinMatch = text.match(autoWinPattern);
    if (autoWinMatch) {
      effects.push({
        type: 'auto_win_round',
        stat: this.normalizeStatTarget(autoWinMatch[1]),
        timing: 'during_combat',
        target: 'self'
      });
    }

    // Steal power
    const stealPattern = /cướp\s*(?:vĩnh viễn\s*)?(\d*)\s*Power/i;
    const stealMatch = text.match(stealPattern);
    if (stealMatch) {
      effects.push({
        type: 'steal_power',
        grantCount: stealMatch[1] ? parseInt(stealMatch[1]) : 1,
        timing: timing === 'immediate' ? 'before_combat' : timing,
        target: 'opponent'
      });
    }

    // Double reward
    if (lower.includes('gấp đôi') && (lower.includes('phần thưởng') || lower.includes('reward'))) {
      effects.push({
        type: 'double_reward',
        timing: 'after_combat_win',
        target: 'self'
      });
    }

    return effects;
  }

  /**
   * Normalize stat string to DynamicStatTarget
   */
  static normalizeStatTarget(stat: string): DynamicStatTarget | undefined {
    if (!stat) return undefined;

    const normalized = stat.toLowerCase().trim();

    // Check exact match first
    if (DYNAMIC_STAT_ALIASES[normalized]) {
      return DYNAMIC_STAT_ALIASES[normalized];
    }

    // Check partial matches
    for (const [alias, target] of Object.entries(DYNAMIC_STAT_ALIASES)) {
      if (normalized.includes(alias) || alias.includes(normalized)) {
        return target;
      }
    }

    return undefined;
  }

  /**
   * Parse conditions from text
   */
  static parseConditions(text: string): Condition[] {
    const conditions: Condition[] = [];
    const lower = text.toLowerCase();

    // Probability
    const chanceMatch = text.match(/(?:có\s*)?(\d+)%/);
    if (chanceMatch) {
      conditions.push({
        type: 'probability',
        chance: parseInt(chanceMatch[1])
      });
    }

    // Race match
    const vsRaceMatch = text.match(/(?:khi|khi đối đầu với|vs)\s*(Human|Dwarf|Elf|Orc|Goblin|God|Demon|Dragon|Angel|Demi-God)/gi);
    if (vsRaceMatch) {
      const races = vsRaceMatch.map(m => m.replace(/khi đối đầu với|khi|vs/gi, '').trim());
      conditions.push({
        type: 'race_match',
        races
      });
    }

    // Race tier compare
    if (lower.includes('tộc') && lower.includes('thứ hạng')) {
      if (lower.includes('cao hơn')) {
        conditions.push({ type: 'race_tier_compare', tierOperator: '>' });
      } else if (lower.includes('thấp hơn')) {
        conditions.push({ type: 'race_tier_compare', tierOperator: '<' });
      }
    }

    // Bracket
    if (lower.includes('nhánh thua') || lower.includes('loser bracket')) {
      conditions.push({ type: 'bracket', bracket: 'loser' });
    }
    if (lower.includes('nhánh thắng') || lower.includes('winner bracket')) {
      conditions.push({ type: 'bracket', bracket: 'winner' });
    }
    if (lower.includes('chung kết') || lower.includes('finals')) {
      conditions.push({ type: 'bracket', bracket: 'finals' });
    }

    // PvP win count
    const pvpWinMatch = text.match(/sau\s*(\d+)\s*(?:trận\s*)?(?:pvp\s*)?thắng/i);
    if (pvpWinMatch) {
      conditions.push({
        type: 'pvp_win_count',
        winCount: parseInt(pvpWinMatch[1]),
        winCountOperator: '>='
      });
    }

    // Has lover
    if (lower.includes('có lover') || lower.includes('has lover')) {
      conditions.push({
        type: 'has_item',
        itemType: 'lover'
      });
    }

    // Opponent has lover
    if (lower.includes('đối thủ có lover') || lower.includes('opponent has lover')) {
      conditions.push({
        type: 'opponent_has',
        opponentItemType: 'lover'
      });
    }

    return conditions;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick parse function
 */
export function parseEffect(text: string): Effect[] {
  return EffectParser.parse(text);
}

/**
 * Parse and return first effect (for single-effect descriptions)
 */
export function parseFirstEffect(text: string): Effect | undefined {
  const effects = EffectParser.parse(text);
  return effects[0];
}
