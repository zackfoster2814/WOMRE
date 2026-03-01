/**
 * Power Combat Handlers
 *
 * Combat handlers cho các Power effects.
 */

import { registerCombatHandler } from '../registry';
import type { CombatHandlerContext, CombatHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// U=ma2 HANDLERS
// ============================================================================

/**
 * U=ma2 - +3 Speed when losing Strength round
 */
registerCombatHandler(
  'uma2_str_lose',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Check if lost Strength round
    if (ctx.roundResults?.strength === 'lose') {
      return {
        selfStatMods: [{ stat: 'speed', value: 3 }],
        description: '+3 Speed (lost Strength round)',
      };
    }
    return { skipDefault: true };
  },
  '+3 Speed on Strength round loss'
);

/**
 * U=ma2 - +4 Durability when losing Speed round
 */
registerCombatHandler(
  'uma2_spd_lose',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.speed === 'lose') {
      return {
        selfStatMods: [{ stat: 'durability', value: 4 }],
        description: '+4 Durability (lost Speed round)',
      };
    }
    return { skipDefault: true };
  },
  '+4 Durability on Speed round loss'
);

// ============================================================================
// METAMAGIC - Extra point on BIQ win
// ============================================================================

registerCombatHandler(
  'metamagic_biq_round',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.biq === 'win') {
      return {
        selfPoints: 1,
        description: '+1 point (BIQ round win)',
      };
    }
    return { skipDefault: true };
  },
  '+1 point on BIQ round win'
);

// ============================================================================
// ARMOR PIERCING - Extra point on Dura win
// ============================================================================

registerCombatHandler(
  'armor_piercing_dura_round',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.durability === 'win') {
      return {
        selfPoints: 1,
        description: '+1 point (Durability round win)',
      };
    }
    return { skipDefault: true };
  },
  '+1 point on Durability round win'
);

// ============================================================================
// DIVINE SMITE - Extra point on MA win
// ============================================================================

registerCombatHandler(
  'divine_smite_ma_round',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.ma === 'win') {
      return {
        selfPoints: 1,
        description: '+1 point (MA round win)',
      };
    }
    return { skipDefault: true };
  },
  '+1 point on MA round win'
);

// ============================================================================
// ACCELERATING SORCERY - +1 IQ per "during combat" power activation
// ============================================================================

registerCombatHandler(
  'accelerating_sorcery_count',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const activations = ctx.self.duringCombatActivations || 0;
    if (activations > 0) {
      return {
        selfStatMods: [{ stat: 'iq', value: activations }],
        description: `+${activations} IQ (power activations)`,
      };
    }
    return { skipDefault: true };
  },
  '+1 IQ per power activation'
);

// ============================================================================
// HOMEGUARD - +3 Speed if no Strength loss
// ============================================================================

registerCombatHandler(
  'homeguard_no_str_lose',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.strength !== 'lose') {
      return {
        selfStatMods: [{ stat: 'speed', value: 3 }],
        description: '+3 Speed (no Strength loss)',
      };
    }
    return { skipDefault: true };
  },
  '+3 Speed if no Strength round loss'
);

// ============================================================================
// RED SHIFT / SHOOTING / PUMP IRON CHECK
// ============================================================================

registerCombatHandler(
  'red_shift_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Win at least 1 of first 3 rounds
    const first3 = ['strength', 'speed', 'durability'];
    const winsInFirst3 = first3.filter(
      r => ctx.roundResults?.[r as StatName] === 'win'
    ).length;

    if (winsInFirst3 >= 1) {
      return {
        selfStatMods: [
          { stat: 'iq', value: 1 },
          { stat: 'biq', value: 1 },
          { stat: 'ma', value: 2 },
        ],
        description: '+1 IQ, +1 BIQ, +2 MA (won 1+ of first 3)',
      };
    }
    return { skipDefault: true };
  },
  '+1 IQ/BIQ, +2 MA if won 1+ of first 3 rounds'
);

registerCombatHandler(
  'shooting_for_victory_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const first3 = ['strength', 'speed', 'durability'];
    const winsInFirst3 = first3.filter(
      r => ctx.roundResults?.[r as StatName] === 'win'
    ).length;
    const lossesInFirst3 = first3.filter(
      r => ctx.roundResults?.[r as StatName] === 'lose'
    ).length;

    if (winsInFirst3 >= 1 && lossesInFirst3 >= 1) {
      return {
        selfStatMods: [
          { stat: 'iq', value: 1 },
          { stat: 'biq', value: 1 },
          { stat: 'ma', value: 2 },
        ],
        description: '+1 IQ, +1 BIQ, +2 MA (mixed results in first 3)',
      };
    }
    return { skipDefault: true };
  },
  '+1 IQ/BIQ, +2 MA if mixed results in first 3'
);

registerCombatHandler(
  'pump_iron_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const first3 = ['strength', 'speed', 'durability'];
    const winsInFirst3 = first3.filter(
      r => ctx.roundResults?.[r as StatName] === 'win'
    ).length;

    if (winsInFirst3 === 1) {
      return {
        selfStatMods: [
          { stat: 'iq', value: 2 },
          { stat: 'biq', value: 2 },
          { stat: 'ma', value: 2 },
        ],
        description: '+2 IQ, +2 BIQ, +2 MA (won exactly 1 of first 3)',
      };
    }
    return { skipDefault: true };
  },
  '+2 IQ/BIQ/MA if won exactly 1 of first 3'
);

// ============================================================================
// ANGLING AND SCHEMING
// ============================================================================

registerCombatHandler(
  'angling_scheming_str_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.strength === 'win') {
      return {
        selfStatMods: [
          { stat: 'iq', value: 1 },
          { stat: 'biq', value: 1 },
          { stat: 'ma', value: 2 },
        ],
        description: '+1 IQ, +1 BIQ, +2 MA (won Strength)',
      };
    }
    return { skipDefault: true };
  },
  '+1 IQ/BIQ, +2 MA on Strength round win'
);

// ============================================================================
// NO STOPPING ME - Alternating wins/losses
// ============================================================================

registerCombatHandler(
  'no_stopping_me_alternating_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const first3 = ['strength', 'speed', 'durability'];
    const results = first3.map(r => ctx.roundResults?.[r as StatName]);

    // Check for W-L-W or L-W-L pattern
    const isAlternating =
      (results[0] === 'win' && results[1] === 'lose' && results[2] === 'win') ||
      (results[0] === 'lose' && results[1] === 'win' && results[2] === 'lose');

    if (isAlternating) {
      return {
        selfStatMods: [
          { stat: 'iq', value: 3 },
          { stat: 'biq', value: 3 },
          { stat: 'ma', value: 3 },
        ],
        description: '+3 IQ, +3 BIQ, +3 MA (alternating pattern)',
      };
    }
    return { skipDefault: true };
  },
  '+3 IQ/BIQ/MA on alternating pattern'
);

// ============================================================================
// GAZE OF THE ABYSS
// ============================================================================

registerCombatHandler(
  'gaze_of_abyss_5_loses',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.self.roundsLost >= 5) {
      return {
        selfPoints: 5,
        description: '+5 points (lost 5 rounds)',
      };
    }
    return { skipDefault: true };
  },
  '+5 points after 5 round losses'
);

// ============================================================================
// BORROWED TIME
// ============================================================================

registerCombatHandler(
  'borrowed_time_2_loses',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.self.roundsLost >= 2) {
      return {
        opponentPoints: 0, // Opponent gets no point on next loss
        description: 'Opponent gets no point on next round win',
      };
    }
    return { skipDefault: true };
  },
  'Deny opponent point after 2 losses'
);

// ============================================================================
// DOMINATOR
// ============================================================================

registerCombatHandler(
  'dominator_2_of_3_loses',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const first3 = ['strength', 'speed', 'durability'];
    const lossesInFirst3 = first3.filter(
      r => ctx.roundResults?.[r as StatName] === 'lose'
    ).length;

    if (lossesInFirst3 >= 2) {
      return {
        opponentStatMods: STAT_NAMES.map(stat => ({ stat, value: -1 })),
        description: '-1 all stats to opponent (lost 2+ of first 3)',
      };
    }
    return { skipDefault: true };
  },
  '-1 all stats to opponent if lost 2+ of first 3'
);

// ============================================================================
// HEALING FACTOR - +1 Dura per 2 rounds lost after combat
// ============================================================================

registerCombatHandler(
  'healing_factor_per_2_lost',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const bonus = Math.floor(ctx.self.roundsLost / 2);
    if (bonus > 0) {
      return {
        selfStatMods: [{ stat: 'durability', value: bonus }],
        description: `Healing Factor: ${ctx.self.roundsLost} round thua → +${bonus} Dura`,
      };
    }
    return { skipDefault: true };
  },
  '+1 Durability per 2 rounds lost after combat'
);

// ============================================================================
// MIND CONTROL - +1 all stats if opponent Base IQ <= 5
// ============================================================================

registerCombatHandler(
  'mind_control_iq_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppBaseIQ = ctx.opponent.baseStats.iq;
    if (oppBaseIQ <= 5) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
        description: `Mind Control: Đối thủ Base IQ ${oppBaseIQ} ≤ 5 → +1 all stats`,
      };
    }
    return { skipDefault: true };
  },
  '+1 all stats if opponent Base IQ <= 5'
);

// ============================================================================
// BLOODY STRIKE - +1 to each stat that won a round
// ============================================================================

registerCombatHandler(
  'bloody_strike_per_round_won',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.roundResults) return { skipDefault: true };
    const wonStats = STAT_NAMES.filter(stat => ctx.roundResults![stat] === 'win');
    if (wonStats.length > 0) {
      return {
        selfStatMods: wonStats.map(stat => ({ stat, value: 1 })),
        description: `Bloody Strike: Thắng round ${wonStats.join(', ')} → +1 mỗi stat`,
      };
    }
    return { skipDefault: true };
  },
  '+1 to each stat that won a round after combat'
);

// ============================================================================
// MEMORY ALTER - Before combat: disable 1 random in-combat power of opponent
// ============================================================================

registerCombatHandler(
  'memory_alter_disable_in_combat_power',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppPowers: string[] = ctx.opponent.powers || [];
    if (oppPowers.length === 0) {
      return { skipDefault: true, description: 'Memory Alter: Đối thủ không có Power nào' };
    }
    const disabled = oppPowers[Math.floor(Math.random() * oppPowers.length)];
    return {
      description: `Memory Alter: Vô hiệu Power "${disabled}" của đối thủ trong combat (nếu thắng thì mất vĩnh viễn)`,
    };
  },
  'Disable 1 random in-combat power of opponent before combat (Memory Alter)'
);

// ============================================================================
// UNO REVERSE CARD - Opponent stat debuffs apply to themselves instead
// ============================================================================

registerCombatHandler(
  'uno_reverse_card_swap_debuffs',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Uno Reverse Card: Debuff giảm stat từ đối thủ áp dụng lên chính đối thủ; debuff của bản thân áp dụng lên bản thân (engine effect)',
    };
  },
  'Stat debuffs from opponent redirect to themselves; own debuffs redirect to self (Uno Reverse Card)'
);

// ============================================================================
// FROST FINGERS - Opponent -1 highest stat per gear they have (max 5)
// ============================================================================

registerCombatHandler(
  'frost_fingers_per_gear',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const gears: string[] = ctx.opponent.gears || [];
    const penalty = Math.min(gears.length, 5);
    if (penalty === 0) {
      return { skipDefault: true, description: 'Frost Fingers: Đối thủ không có Gear' };
    }
    // Find opponent's highest stat to apply debuff
    const oppStats = ctx.opponent.stats;
    let highestStat: StatName = 'strength';
    let highestVal = oppStats.strength;
    for (const s of STAT_NAMES) {
      if (oppStats[s] > highestVal) { highestVal = oppStats[s]; highestStat = s; }
    }
    return {
      opponentStatMods: [{ stat: highestStat, value: -penalty }],
      description: `Frost Fingers: Đối thủ có ${gears.length} Gear → -${penalty} ${highestStat} (tối đa 5)`,
    };
  },
  '-1 opponent highest stat per gear they own (max 5) - Frost Fingers'
);

// ============================================================================
// STAT ABSORPTION - After win: +1 to stat opponent has highest
// ============================================================================

registerCombatHandler(
  'stat_absorption_opponent_highest',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppStats = ctx.opponent.stats;
    let highestStat: StatName = 'strength';
    let highestVal = oppStats.strength;
    for (const s of STAT_NAMES) {
      if (oppStats[s] > highestVal) { highestVal = oppStats[s]; highestStat = s; }
    }
    return {
      selfStatMods: [{ stat: highestStat, value: 1 }],
      description: `Stat Absorption: +1 ${highestStat} (stat cao nhất của đối thủ: ${highestVal})`,
    };
  },
  '+1 to stat that opponent has highest after win (Stat Absorption)'
);

// ============================================================================
// LUCK MANIPULATION - From round 64: 15% +1 all, 5% +2 all before combat
// ============================================================================

registerCombatHandler(
  'luck_manipulation_round_64_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Check if we're from round 64 (pvpWins >= 3 in a 256-bracket = round 32+)
    const isFrom64 = ctx.self.pvpWins >= 2;
    if (!isFrom64) {
      return {
        skipDefault: true,
        description: `Luck Manipulation: Chưa đến vòng 64 (pvpWins: ${ctx.self.pvpWins})`,
      };
    }
    // Probability condition (15% / 5%) is applied by resolver before calling handler.
    // Handler just confirms the bonus applies.
    return {
      description: `Luck Manipulation: Từ vòng 64 → bonus stats sẽ áp dụng`,
    };
  },
  'From round 64: 15% +1 all stats, 5% +2 all stats (Luck Manipulation)'
);

// ============================================================================
// ZOLTRAAK - BIQ round happens twice (each scored separately)
// ============================================================================

/**
 * Zoltraak - during_combat: BIQ round diễn ra 2 lần, cả 2 đều tính điểm.
 * Handler reports this; actual double-scoring requires engine support.
 */
registerCombatHandler(
  'zoltraak_double_biq_round',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const biqResult = ctx.roundResults?.biq;
    if (biqResult === 'win') {
      return {
        selfPoints: 1,
        description: 'Zoltraak: BIQ round diễn ra 2 lần → thắng BIQ lần 2, +1 điểm thêm',
      };
    }
    if (biqResult === 'lose') {
      return {
        description: 'Zoltraak: BIQ round diễn ra 2 lần → thua BIQ lần 2, đối thủ +1 điểm thêm',
      };
    }
    return {
      description: 'Zoltraak: BIQ round diễn ra 2 lần → Hòa lần 2, không điểm thêm',
    };
  },
  'BIQ round happens twice, each scored separately (Zoltraak)'
);

// ============================================================================
// ENHANCED HEARING - Debuff self if opponent uses instrument or sound power
// ============================================================================

const INSTRUMENT_NAMES_EH = [
  'bagpipe', 'drums', 'flute', 'guitar', 'violin', 'trumpet',
  'piano', 'harp', 'lute', 'saxophone', 'bass', 'cello', 'harmonica',
  'ukulele', 'nunchuck', 'ruan mei',
];

const SOUND_POWERS = [
  'zoltraak', 'rickrolling', 'music', 'sound', 'melody',
  'siren', 'bard', 'singer', 'singer',
];

/**
 * Enhanced Hearing (instrument check) - before_combat:
 * Nếu đối thủ dùng nhạc cụ → self -1 all stats.
 */
registerCombatHandler(
  'enhanced_hearing_instrument_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const weapons: any[] = ctx.opponent.weapons || [];
    const hasInstrument = weapons.some((w) => {
      const wName = (typeof w === 'string' ? w : w?.name ?? '').toLowerCase();
      return INSTRUMENT_NAMES_EH.some(inst => wName.includes(inst));
    });
    if (hasInstrument) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: -1 })),
        description: 'Enhanced Hearing: Đối thủ dùng nhạc cụ → -1 all stats',
      };
    }
    return { skipDefault: true, description: 'Enhanced Hearing: Đối thủ không dùng nhạc cụ' };
  },
  '-1 all stats if opponent uses a musical instrument (Enhanced Hearing)'
);

/**
 * Enhanced Hearing (sound power check) - before_combat:
 * Nếu đối thủ có power liên quan âm thanh → self -2 all stats.
 */
registerCombatHandler(
  'enhanced_hearing_sound_power_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const powers: string[] = (ctx.opponent.powers || []).map((p: any) =>
      (typeof p === 'string' ? p : p?.name ?? '').toLowerCase()
    );
    const hasSoundPower = powers.some(p =>
      SOUND_POWERS.some(sp => p.includes(sp))
    );
    if (hasSoundPower) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: -2 })),
        description: 'Enhanced Hearing: Đối thủ có power âm thanh → -2 all stats',
      };
    }
    return { skipDefault: true, description: 'Enhanced Hearing: Đối thủ không có power âm thanh' };
  },
  '-2 all stats if opponent has a sound-related power (Enhanced Hearing)'
);

// ============================================================================
// SPEAR OF FIRE - +1 point if weapon has 2 runes
// ============================================================================

registerCombatHandler(
  'spear_of_fire_2_rune_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const rune = (ctx.self.character as any)?.rune;
    const runes: any[] = rune?.runes || [];
    const activeRunes = runes.filter((r: any) => !r.isLost);
    if (activeRunes.length >= 2) {
      return {
        selfPoints: 1,
        description: `Spear of Fire: ${activeRunes.length} Rune → +1 điểm khởi đầu`,
      };
    }
    return {
      skipDefault: true,
      description: `Spear of Fire: Chỉ có ${activeRunes.length} Rune (cần 2+)`,
    };
  },
  '+1 starting point if weapon has 2+ runes (Spear of Fire)'
);

// ============================================================================
// BUCKING BRONCO - After combat win: +1 MA only if also won MA round
// ============================================================================

registerCombatHandler(
  'bucking_bronco_ma_round_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.ma === 'win') {
      return {
        selfStatMods: [{ stat: 'ma', value: 1 }],
        description: 'Bucking Bronco: Thắng round MA → +1 MA (stackable)',
      };
    }
    return {
      skipDefault: true,
      description: 'Bucking Bronco: Không thắng round MA → không nhận bonus',
    };
  },
  'After combat win: +1 MA (stackable) only if also won MA round (Bucking Bronco)'
);

// ============================================================================
// LONE WOLF - After combat: if opponent also has Lone Wolf → lose power
// ============================================================================

registerCombatHandler(
  'lone_wolf_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppPowers: any[] = ctx.opponent.powers || [];
    const oppHasLoneWolf = oppPowers.some((p: any) => {
      const n = typeof p === 'string' ? p : p?.name ?? '';
      return n.toLowerCase().includes('lone wolf');
    });
    if (oppHasLoneWolf) {
      return {
        removePower: 'Lone Wolf',
        description: 'Lone Wolf: Cả hai đều có power này → mất power Lone Wolf',
      };
    }
    return { skipDefault: true, description: 'Lone Wolf: Đối thủ không có Lone Wolf → +3 Speed vẫn còn' };
  },
  'After combat: if opponent also has Lone Wolf, both lose the power (Lone Wolf)'
);

// ============================================================================
// ODIN BLESSING - After combat lose: convert +2 STR to +2 highest stat
// ============================================================================

registerCombatHandler(
  'odin_blessing_convert_to_highest',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Find self's highest stat (excluding strength since the default gives +2 STR)
    let highestStat: StatName = 'strength';
    let highestVal = ctx.self.stats.strength;
    for (const s of STAT_NAMES) {
      if (ctx.self.stats[s] > highestVal) {
        highestVal = ctx.self.stats[s];
        highestStat = s;
      }
    }
    if (highestStat === 'strength') {
      return {
        skipDefault: true,
        description: 'Odin Blessing: Stat cao nhất là Strength → +2 STR như bình thường',
      };
    }
    return {
      selfStatMods: [
        { stat: 'strength', value: -2 }, // Remove the default +2 STR
        { stat: highestStat, value: 2 }, // Add to highest stat instead
      ],
      description: `Odin Blessing: Sau thua → chuyển +2 STR thành +2 ${highestStat} (stat cao nhất)`,
    };
  },
  'After combat loss: convert +2 STR bonus to +2 highest stat (Odin Blessing)'
);

// ============================================================================
// FANCY FEET - Before combat: disable opponent's rune/runeword
// ============================================================================

registerCombatHandler(
  'fancy_feet_disable_rune',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppRunes = (ctx.opponent.character as any)?.rune?.runes || [];
    const oppRuneword = (ctx.opponent.character as any)?.rune?.runeword;
    if (oppRunes.length === 0 && !oppRuneword) {
      return { skipDefault: true, description: 'Fancy Feet: Đối thủ không có Rune/Runeword' };
    }
    const runeDesc = oppRuneword || oppRunes.map((r: any) => r?.name ?? r).join(', ');
    return {
      description: `Fancy Feet: Vô hiệu Rune/Runeword của đối thủ (${runeDesc}) trước combat`,
    };
  },
  'Before combat: disable opponent rune/runeword (Fancy Feet)'
);

// ============================================================================
// GUIDANCE - Before combat: +1 to 2 random stats if opponent has fewer powers
// ============================================================================

registerCombatHandler(
  'guidance_fewer_powers_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const selfPowerCount = ctx.self.powers.length;
    const oppPowerCount = (ctx.opponent.powers || []).length;
    if (selfPowerCount <= oppPowerCount) {
      return {
        skipDefault: true,
        description: `Guidance: Đối thủ không ít power hơn (${oppPowerCount} vs ${selfPowerCount}) → không áp dụng`,
      };
    }
    // +1 to 2 random stats
    const shuffled = [...STAT_NAMES].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, 2);
    return {
      selfStatMods: chosen.map(stat => ({ stat, value: 1 })),
      description: `Guidance: Đối thủ ít power hơn (${oppPowerCount} < ${selfPowerCount}) → +1 ${chosen.join(', ')}`,
    };
  },
  '+1 to 2 random stats if opponent has fewer powers (Guidance)'
);

// ============================================================================
// HUNTER'S MARK - During combat: random round chosen; win that round = +1 point
// ============================================================================

registerCombatHandler(
  'hunters_mark_random_round',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const chosenStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    if (ctx.roundResults?.[chosenStat] === 'win') {
      return {
        selfPoints: 1,
        description: `Hunter's Mark: Round được chọn = ${chosenStat} → thắng → +1 điểm`,
      };
    }
    return {
      skipDefault: true,
      description: `Hunter's Mark: Round được chọn = ${chosenStat} → không thắng → không điểm`,
    };
  },
  'Random round chosen before combat; win that round = +1 point (Hunter\'s Mark)'
);

// ============================================================================
// GARLIC BREATH - +1 all stats vs Vampire OR with 3+ Breath powers
// ============================================================================

registerCombatHandler(
  'garlic_breath_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppIsVampire = ctx.opponent.race.toLowerCase() === 'vampire';
    const breathPowers = ctx.self.powers.filter(p =>
      p.toLowerCase().includes('breath')
    ).length;
    if (!oppIsVampire && breathPowers < 3) {
      return {
        skipDefault: true,
        description: `Garlic Breath: đối thủ không phải Vampire (${ctx.opponent.race}), chỉ có ${breathPowers} Breath power`,
      };
    }
    const reason = oppIsVampire ? 'đối thủ là Vampire' : `có ${breathPowers} Breath power`;
    return {
      selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
      description: `+1 All Stats (Garlic Breath – ${reason})`,
    };
  },
  '+1 all stats vs Vampire or with 3+ Breath powers (Garlic Breath)'
);

// ============================================================================
// SUPER LUCKY - Khi thua: 15% lật kèo, nếu thất bại → 10% lật kèo lần 2
// ============================================================================

registerCombatHandler(
  'super_lucky_comeback_check',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    if (Math.random() < 0.15) {
      return {
        autoWin: true,
        description: 'LẬT KÈO! (Super Lucky – 15%)',
      };
    }
    if (Math.random() < 0.10) {
      return {
        autoWin: true,
        description: 'LẬT KÈO! (Super Lucky – 10% lần 2)',
      };
    }
    return {
      skipDefault: true,
      description: 'Super Lucky: không lật kèo được (cả 15% lẫn 10% đều trượt)',
    };
  },
  '15% then 10% auto-win comeback when losing (Super Lucky)'
);

// ============================================================================
// 4 HIT COMBO - Thắng round BIQ → kéo điểm bằng đối thủ (nếu đang thua)
// Engine cần đọc flag này và equalize score.
// ============================================================================

registerCombatHandler(
  'four_hit_combo_biq_equalize',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.biq !== 'win') return { skipDefault: true };
    return {
      description: '[4 Hit Combo] Thắng round BIQ → điểm bằng đối thủ nếu đang thua (GM/engine xử lý equalize)',
      skipDefault: false,
    };
  },
  'BIQ win: equalize own score to opponent score if behind (4 Hit Combo)'
);

// ============================================================================
// GOLDEN PARRY - Sau mỗi round thua: 35% đối thủ không nhận điểm
// ============================================================================

registerCombatHandler(
  'golden_parry_deny_opponent_point',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.currentRoundResult !== 'lose') return { skipDefault: true };
    if (Math.random() > 0.35) {
      return { skipDefault: true, description: 'Golden Parry: không kích hoạt (65%)' };
    }
    return {
      opponentPoints: -1,
      description: 'Đối thủ không nhận điểm (Golden Parry – 35% khi thua round)',
    };
  },
  '35% opponent does not score when you lose a round (Golden Parry)'
);

// ============================================================================
// ETERNAL MANGEKYOU SHARINGAN - Trước combat: random 1 trong 3 debuff đối thủ
// ============================================================================

registerCombatHandler(
  'eternal_mangekyou_random_effect',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const options: Array<{ stat: StatName; name: string }> = [
      { stat: 'durability', name: 'Amaterasu (-6 Dura)' },
      { stat: 'iq',         name: 'Tsukuyomi (-6 IQ)' },
      { stat: 'strength',   name: 'Susanoo (-6 Strength)' },
    ];
    const chosen = options[Math.floor(Math.random() * 3)];
    return {
      opponentStatMods: [{ stat: chosen.stat, value: -6 }],
      description: `Eternal Mangekyou Sharingan: ${chosen.name} đối thủ`,
    };
  },
  'Random -6 to opponent: Amaterasu(Dura) / Tsukuyomi(IQ) / Susanoo(Str)'
);

// ============================================================================
// SPELL FLUX - Power "Trong combat" đầu tiên kích hoạt 2 lần
// GM xử lý: tìm power đầu tiên có timing during_combat và apply 2 lần.
// ============================================================================

registerCombatHandler(
  'spell_flux_double_first_in_combat',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: '[Spell Flux] Power "Trong combat" đầu tiên kích hoạt 2 lần – GM kiểm tra danh sách power',
      skipDefault: false,
    };
  },
  'First during-combat power activates twice (Spell Flux)'
);

// ============================================================================
// GLORY GLORY MAN UNITED - GM nhập tỉ số MU để tính buff/debuff
// ============================================================================

registerCombatHandler(
  'glory_man_united_epl_check',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: '[GM Action] Glory glory Man United: Nhập tỉ số MU - Đối thủ. Bàn thua = -1 all stats/bàn; MU thắng ≥3-0 = +7 all stats',
      skipDefault: false,
    };
  },
  'GM enters MU EPL score to calculate stat buff/debuff (Glory glory Man United)'
);

// ============================================================================
// CINDER FLICKERING - Khi cả 2 có power này, người thắng nhận Char Dev "Lord of Cinder"
// ============================================================================

registerCombatHandler(
  'cinder_flickering_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppPowers: any[] = ctx.opponent.powers || [];
    const oppHasCinder = oppPowers.some((p: any) => {
      const n = typeof p === 'string' ? p : p?.name ?? '';
      return n.toLowerCase().includes('cinder flickering');
    });
    if (oppHasCinder) {
      return {
        grantCreatorFavor: 0, // placeholder — GM grants "Lord of Cinder" char dev manually
        description: '[Cinder Flickering] Cả 2 đều có power → Người thắng nhận Char Dev "Lord of Cinder" (GM xử lý)',
      };
    }
    return { skipDefault: true, description: 'Cinder Flickering: Đối thủ không có power này' };
  },
  'After combat: winner gets "Lord of Cinder" char dev if both have Cinder Flickering'
);

// ============================================================================
// DARWIN EVOLUTION THEORY - Sau combat: thăng hạng chủng tộc +1 bậc
// GM cần xử lý vì không thể tự động đổi race tier trong engine
// ============================================================================

registerCombatHandler(
  'darwin_evolution_race_up',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: '[Darwin Evolution Theory] Sau combat: Thăng hạng chủng tộc +1 bậc (GM xử lý nâng race tier)',
      skipDefault: false,
    };
  },
  'After combat: race tier upgrades by 1 (Darwin Evolution Theory)'
);

// ============================================================================
// ALGORITHMS ARE CLEAR - Sau combat: Tổng base stat đối thủ / 6, thay stat thấp nhất của bản thân
// ============================================================================

registerCombatHandler(
  'algorithms_are_clear_replace_lowest',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppBase = ctx.opponent.baseStats;
    const STAT_KEYS: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];
    const totalOppBase = STAT_KEYS.reduce((sum, s) => sum + (oppBase[s] || 0), 0);
    const avgOppBase = Math.round(totalOppBase / 6);

    // Find self's lowest stat
    const selfStats = ctx.self.stats;
    let lowestStat: StatName = 'strength';
    let lowestVal = selfStats.strength;
    for (const s of STAT_KEYS) {
      if (selfStats[s] < lowestVal) { lowestVal = selfStats[s]; lowestStat = s; }
    }

    const diff = avgOppBase - lowestVal;
    if (diff === 0) {
      return { skipDefault: true, description: `Algorithms Are Clear: ${lowestStat} đã bằng avg đối thủ (${avgOppBase})` };
    }
    return {
      selfStatMods: [{ stat: lowestStat, value: diff }],
      description: `Algorithms Are Clear: Tổng base đối thủ ${totalOppBase}/6 = ${avgOppBase} → thay ${lowestStat} (${lowestVal} → ${avgOppBase})`,
    };
  },
  'After combat: replace own lowest base stat with avg of opponent base stats (Algorithms Are Clear)'
);

// ============================================================================
// ADAPT - Trước combat: vô hiệu các power của đối thủ đã gặp trước đó
// Engine/GM track danh sách power đã gặp
// ============================================================================

registerCombatHandler(
  'adapt_disable_known_powers',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppPowers: any[] = ctx.opponent.powers || [];
    if (oppPowers.length === 0) {
      return { skipDefault: true, description: 'Adapt: Đối thủ không có Power' };
    }
    const oppPowerNames = oppPowers
      .map((p: any) => typeof p === 'string' ? p : p?.name ?? '')
      .filter(Boolean);
    return {
      description: `[Adapt] Vô hiệu hóa các power đối thủ đã gặp trong quá khứ: ${oppPowerNames.join(', ')} (GM track danh sách powers đã gặp)`,
      skipDefault: false,
    };
  },
  'Before combat: disable opponent powers that were previously encountered (Adapt)'
);

// ============================================================================
// COLD MIRAGE - Sau mỗi round thắng: quay 1 chỉ số từ các round chưa thi đấu
// Đối thủ không nhận điểm khi thắng những round bị quay ra
// ============================================================================

registerCombatHandler(
  'cold_mirage_spin_unused_round',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const STAT_KEYS: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];
    // Find rounds not yet played (no result in roundResults)
    const playedRounds = Object.keys(ctx.roundResults || {});
    const unusedRounds = STAT_KEYS.filter(s => !playedRounds.includes(s));
    if (unusedRounds.length === 0) {
      return { skipDefault: true, description: 'Cold Mirage: Không còn round chưa thi đấu' };
    }
    const picked = unusedRounds[Math.floor(Math.random() * unusedRounds.length)];
    return {
      description: `[Cold Mirage] Round ${picked} bị quay → Đối thủ không nhận điểm nếu thắng round ${picked} (GM xử lý cancel điểm)`,
      skipDefault: false,
    };
  },
  'After round win: spin unused round — opponent scores no point if winning that round (Cold Mirage)'
);

export function registerPowerCombatHandlers(): void {
  console.log('Power combat handlers registered');
}
