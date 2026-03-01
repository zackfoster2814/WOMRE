/**
 * Weapon Combat Handlers
 *
 * Combat handlers cho tất cả Weapon effects.
 */

import { registerCombatHandler } from '../registry';
import type { CombatHandlerContext, CombatHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// BANANA PEEL - IQ comparison buff/debuff
// ============================================================================

/**
 * Banana Peel - Trước Combat: -1 all stats nếu Base IQ thấp hơn, +1 nếu cao hơn.
 */
registerCombatHandler(
  'banana_peel_iq_compare',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const selfBaseIQ = ctx.self.baseStats.iq;
    const oppBaseIQ = ctx.opponent.baseStats.iq;

    if (selfBaseIQ > oppBaseIQ) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
        description: `Banana Peel: Base IQ cao hơn (${selfBaseIQ} > ${oppBaseIQ}) → +1 all stats`,
      };
    } else if (selfBaseIQ < oppBaseIQ) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: -1 })),
        description: `Banana Peel: Base IQ thấp hơn (${selfBaseIQ} < ${oppBaseIQ}) → -1 all stats`,
      };
    }
    return { description: `Banana Peel: IQ bằng nhau (${selfBaseIQ}), không có hiệu ứng` };
  },
  '+1/-1 all stats based on Base IQ comparison'
);

// ============================================================================
// DRUMS - Extra PvP Reward after win
// ============================================================================

/**
 * Drums - Sau Combat Thắng: Nhận thêm 1 PvP Rewards.
 */
registerCombatHandler(
  'drums_extra_pvp_reward',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Drums: Nhận thêm 1 PvP Reward sau combat thắng',
    };
  },
  'Extra PvP Reward after win'
);

// ============================================================================
// GLASS BOTTLE - Destroy after combat
// ============================================================================

/**
 * Glass Bottle - Sau Combat: Loại bỏ vũ khí này.
 */
registerCombatHandler(
  'glass_bottle_break',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      removeWeapon: 'Glass Bottle',
      description: 'Glass Bottle: Vỡ sau combat, loại bỏ vũ khí',
    };
  },
  'Remove Glass Bottle after combat'
);

// ============================================================================
// CURSED PENNYWORT - 36% disable 3 random opponent powers
// ============================================================================

/**
 * Cursed Pennywort - Trước Combat: 36% vô hiệu hóa 3 power ngẫu nhiên của đối thủ.
 */
registerCombatHandler(
  'cursed_pennywort_disable',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    // 36% chance handled by condition in effect definition
    return {
      description: 'Cursed Pennywort: Vô hiệu hóa 3 power ngẫu nhiên của đối thủ',
    };
  },
  'Disable 3 random opponent powers (36% chance)'
);

// ============================================================================
// SUMMONING SCROLL - Summon a temporary unit
// ============================================================================

/**
 * Summoning Scroll - Trước Combat: Triệu hồi 1 Summon tạm thời.
 */
registerCombatHandler(
  'summoning_scroll_summon',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Summoning Scroll: Triệu hồi 1 Summon tạm thời',
    };
  },
  'Summon temporary unit before combat'
);

// ============================================================================
// HALBERD - +1 BIQ, +1 MA after winning STR round
// ============================================================================

/**
 * Halberd - Sau Combat: Khi thắng round STR, +1 BIQ, +1 MA.
 */
registerCombatHandler(
  'halberd_str_win_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const strResult = ctx.roundResults?.strength;
    if (strResult === 'win') {
      return {
        selfStatMods: [
          { stat: 'biq', value: 1 },
          { stat: 'ma', value: 1 },
        ],
        description: 'Halberd: Thắng round STR → +1 BIQ, +1 MA',
      };
    }
    return { description: 'Halberd: Không thắng round STR' };
  },
  '+1 BIQ +1 MA after winning STR round'
);

// ============================================================================
// MORNINGSTAR - +2 STR if opponent uses Physical weapon
// ============================================================================

/**
 * Morningstar - Trong Combat: +2 STR nếu đối thủ dùng vũ khí Physical.
 */
registerCombatHandler(
  'morningstar_physical_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const physicalWeapons = ['Sword', 'Axe', 'Hammer', 'Spear', 'Blade', 'Club', 'Dagger', 'Mace'];
    const opponentWeapons = ctx.opponent.weapons || [];
    const hasPhysical = opponentWeapons.some((w: any) =>
      physicalWeapons.some(p => (w.name || w)?.includes(p))
    );
    if (hasPhysical) {
      return {
        selfStatMods: [{ stat: 'strength', value: 2 }],
        description: 'Morningstar: Đối thủ dùng vũ khí Physical → +2 STR',
      };
    }
    return { skipDefault: true };
  },
  '+2 STR when opponent has Physical weapon'
);

// ============================================================================
// BLOOD SWORD - Sacrifice 1 Power for +1 STR +1 MA after win
// ============================================================================

/**
 * Blood Sword - Sau combat thắng: Mất 1 Power để +1 STR, +1 MA.
 */
registerCombatHandler(
  'blood_sword_sacrifice',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      selfStatMods: [
        { stat: 'strength', value: 1 },
        { stat: 'ma', value: 1 },
      ],
      description: 'Blood Sword: Mất 1 Power → +1 STR, +1 MA',
    };
  },
  'Sacrifice 1 Power for +1 STR +1 MA after win'
);

// ============================================================================
// BAGPIPE - +1 all stats if more powers than opponent
// ============================================================================

/**
 * Great Highland Bagpipe - Trước Combat: +1 all stats nếu có nhiều power hơn đối thủ.
 */
registerCombatHandler(
  'bagpipe_power_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const selfPowers = ctx.self.powers.length;
    const oppPowers = ctx.opponent.powers.length;
    if (selfPowers > oppPowers) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
        description: `Bagpipe: Nhiều power hơn (${selfPowers} > ${oppPowers}) → +1 all stats`,
      };
    }
    return { description: `Bagpipe: Không nhiều power hơn (${selfPowers} <= ${oppPowers})` };
  },
  '+1 all stats if more powers than opponent'
);

// ============================================================================
// SARASTRO'S FLUTE - Opponent -1 all stats per 3 powers
// ============================================================================

/**
 * Sarastro's Flute - Trước Combat: Đối thủ -1 all stats với mỗi 3 power họ có.
 */
registerCombatHandler(
  'sarastro_flute_debuff',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppPowers = ctx.opponent.powers.length;
    const debuff = Math.floor(oppPowers / 3);
    if (debuff > 0) {
      return {
        opponentStatMods: STAT_NAMES.map(stat => ({ stat, value: -debuff })),
        description: `Sarastro's Flute: Đối thủ ${oppPowers} power → -${debuff} all stats`,
      };
    }
    return { description: `Sarastro's Flute: Đối thủ chưa đủ 3 power (${oppPowers})` };
  },
  'Opponent -1 all stats per 3 powers'
);

// ============================================================================
// RUYI JINGU BANG - +1 all stats per 3 powers before combat
// ============================================================================

/**
 * Ruyi Jingu Bang - Trước Combat: +1 all stats với mỗi 3 power.
 */
registerCombatHandler(
  'ruyi_jingu_power_scaling',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const selfPowers = ctx.self.powers.length;
    const bonus = Math.floor(selfPowers / 3);
    if (bonus > 0) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: bonus })),
        description: `Ruyi Jingu Bang: ${selfPowers} power → +${bonus} all stats`,
      };
    }
    return { description: `Ruyi Jingu Bang: Chưa đủ 3 power (${selfPowers})` };
  },
  '+1 all stats per 3 powers before combat'
);

// ============================================================================
// MOONVEIL - +1 point if higher Base IQ, +1 point if more powers
// ============================================================================

/**
 * Moonveil - Trước Combat: +1 điểm nếu Base IQ cao hơn, +1 điểm nếu nhiều Power hơn.
 */
registerCombatHandler(
  'moonveil_bonuses',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    let points = 0;
    const desc: string[] = [];
    if (ctx.self.baseStats.iq > ctx.opponent.baseStats.iq) {
      points += 1;
      desc.push('+1 điểm (Base IQ cao hơn)');
    }
    if (ctx.self.powers.length > ctx.opponent.powers.length) {
      points += 1;
      desc.push('+1 điểm (nhiều Power hơn)');
    }
    if (points > 0) {
      return { selfPoints: points, description: `Moonveil: ${desc.join(', ')}` };
    }
    return { description: 'Moonveil: Không đủ điều kiện' };
  },
  '+1 point if higher Base IQ, +1 if more powers'
);

// ============================================================================
// CHASTIEFOL - +3 to opponent's 2 lowest stats
// ============================================================================

/**
 * Chastiefol - Trước Combat: +3 vào 2 Stat thấp nhất của đối phương.
 * (Buff đối thủ - nhưng đây là từ góc nhìn Chastiefol chủ nhân)
 */
registerCombatHandler(
  'chastiefol_lowest_stats',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const sorted = [...STAT_NAMES].sort((a, b) => ctx.opponent!.stats[a] - ctx.opponent!.stats[b]);
    const [lowest1, lowest2] = sorted;
    return {
      opponentStatMods: [
        { stat: lowest1, value: 3 },
        { stat: lowest2, value: 3 },
      ],
      description: `Chastiefol: +3 ${lowest1}, +3 ${lowest2} cho đối phương`,
    };
  },
  "+3 to opponent's 2 lowest stats"
);

// ============================================================================
// DEATHS SCYTHE - Scaling debuff per 51 players dead
// ============================================================================

/**
 * Death's Scythe - Debuff đối thủ, +1 per 51 người chết.
 */
registerCombatHandler(
  'deaths_scythe_scaling_debuff',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Approximate scaling from round progression
    const currentRound = ctx.currentRound;
    const debuff = Math.floor(currentRound / 2); // Approximate scaling
    if (debuff > 0) {
      return {
        opponentStatMods: STAT_NAMES.map(stat => ({ stat, value: -debuff })),
        description: `Death's Scythe: -${debuff} all stats đối thủ (tăng dần theo số người chết)`,
      };
    }
    return { description: "Death's Scythe: Chưa đủ người chết" };
  },
  'Scaling debuff per 51 players dead'
);

// ============================================================================
// DIFFUSAL BLADE - Disable opponent's Magic gear/weapons
// ============================================================================

/**
 * Diffusal Blade - Vô hiệu Gear/Weapon có tag Magic của đối phương.
 */
registerCombatHandler(
  'diffusal_disable_magic',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Diffusal Blade: Vô hiệu hóa Gear/Weapon có tag Magic của đối phương',
    };
  },
  "Disable opponent's Magic-tagged gear/weapons"
);

// ============================================================================
// BLADE OF CHAOS - Double stats if opponent is God race
// ============================================================================

/**
 * Blade of Chaos - Trong Combat: Gấp đôi stat bonus (+4 STR, +4 MA → +8/+8) nếu đối thủ là God.
 */
registerCombatHandler(
  'blade_of_chaos_god_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppRace = ctx.opponent.race || '';
    const isGod = ['God', 'Titan', 'Deity', 'Divine'].includes(oppRace);
    if (isGod) {
      return {
        selfStatMods: [
          { stat: 'strength', value: 4 },
          { stat: 'ma', value: 4 },
        ],
        description: `Blade of Chaos: Đối thủ là God (${oppRace}) → +4 STR, +4 MA thêm`,
      };
    }
    return { skipDefault: true };
  },
  'Double weapon bonus vs God race'
);

// ============================================================================
// ASTROLOGER'S STAFF - +1 BIQ when a during_combat power activates
// ============================================================================

/**
 * Astrologer's Staff - Khi Power "Trong Combat" kích hoạt lần đầu, +1 BIQ.
 */
registerCombatHandler(
  'astrologer_staff_power_trigger',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const activations = ctx.self.duringCombatActivations || 0;
    if (activations === 1) {
      return {
        selfStatMods: [{ stat: 'biq', value: 1 }],
        description: "Astrologer's Staff: Power Trong Combat kích hoạt lần đầu → +1 BIQ",
      };
    }
    return { skipDefault: true };
  },
  '+1 BIQ on first during_combat power activation'
);

// ============================================================================
// SAITAMA'S GLOVES - Random stat, +1 point on win, auto-win if STR
// ============================================================================

/**
 * Saitama's Gloves - Quay 1 stat ngẫu nhiên. Thắng stat đó +1 điểm. Nếu STR, thắng luôn.
 */
registerCombatHandler(
  'saitama_random_stat',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    if (randomStat === 'strength') {
      return {
        autoWin: true,
        description: "Saitama's Gloves: Quay ra STR → Thắng luôn round STR!",
      };
    }
    return {
      selfPoints: 1,
      description: `Saitama's Gloves: Quay ra ${randomStat} → Thắng +1 điểm nếu thắng round đó`,
    };
  },
  'Random stat: auto-win if STR, else +1 point'
);

// ============================================================================
// GALEFORCE - Negate first round loss point
// ============================================================================

/**
 * Galeforce - Round thua đầu: đối thủ không nhận điểm. Nếu điểm ≤0: +3 random stat.
 */
registerCombatHandler(
  'galeforce_first_lose',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.currentRound === 1 && ctx.self.roundsLost === 1) {
      return {
        opponentPoints: -1,
        description: 'Galeforce: Round thua đầu → đối thủ không nhận điểm',
      };
    }
    return { skipDefault: true };
  },
  'Negate opponent point on first round loss'
);

// ============================================================================
// BATTLEFURY - Same as Galeforce
// ============================================================================

/**
 * Battlefury - Round thua đầu: đối thủ không nhận điểm. Nếu điểm ≤0: +3 random stat.
 */
registerCombatHandler(
  'battlefury_first_lose',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.currentRound === 1 && ctx.self.roundsLost === 1) {
      return {
        opponentPoints: -1,
        description: 'Battlefury: Round thua đầu → đối thủ không nhận điểm',
      };
    }
    return { skipDefault: true };
  },
  'Negate opponent point on first round loss'
);

// ============================================================================
// DAWNBREAKER - +2 random stat per 2 round wins
// ============================================================================

/**
 * Dawnbreaker - Sau Combat: Với mỗi 2 round chiến thắng, +2 random stat.
 */
registerCombatHandler(
  'dawnbreaker_round_wins',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const pairs = Math.floor(ctx.self.roundsWon / 2);
    if (pairs > 0) {
      const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
      return {
        selfStatMods: [{ stat: randomStat, value: 2 * pairs }],
        description: `Dawnbreaker: ${ctx.self.roundsWon} round thắng → +${2 * pairs} ${randomStat}`,
      };
    }
    return { description: 'Dawnbreaker: Chưa đủ 2 round thắng' };
  },
  '+2 random stat per 2 round wins'
);

// ============================================================================
// DEATH'S WEB WAND - Sacrifice 1 Power for +1 all stats
// ============================================================================

/**
 * Death's Web Wand - Sau Combat: Loại bỏ 1 Power để +1 All Stats.
 */
registerCombatHandler(
  'deaths_web_sacrifice',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
      description: "Death's Web Wand: Mất 1 Power → +1 all stats",
    };
  },
  'Sacrifice 1 Power for +1 all stats'
);

// ============================================================================
// LUSAT'S GLINTSTONE STAFF - Grant 1 Power if won IQ round
// ============================================================================

/**
 * Lusat's Glintstone Staff - Sau combat: Nếu thắng round IQ, nhận 1 Power.
 */
registerCombatHandler(
  'lusat_iq_win_power',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const iqResult = ctx.roundResults?.iq;
    if (iqResult === 'win') {
      return {
        grantPower: 'random',
        description: "Lusat's Staff: Thắng round IQ → nhận 1 Power",
      };
    }
    return { description: "Lusat's Staff: Không thắng round IQ" };
  },
  'Grant 1 Power if won IQ round'
);

// ============================================================================
// FLOWER OF FIRE - +1 random stat per 2 powers on win; +2 powers on lose
// ============================================================================

/**
 * Flower of Fire - Sau combat thắng: +1 random stat mỗi 2 Power. Sau thua: +2 Power.
 */
registerCombatHandler(
  'flower_of_fire_scaling',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const won = ctx.self.roundsWon > ctx.self.roundsLost;
    if (won) {
      const bonus = Math.floor(ctx.self.powers.length / 2);
      if (bonus > 0) {
        const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
        return {
          selfStatMods: [{ stat: randomStat, value: bonus }],
          description: `Flower of Fire: Thắng, ${ctx.self.powers.length} power → +${bonus} ${randomStat}`,
        };
      }
      return { description: 'Flower of Fire: Thắng nhưng chưa đủ 2 power' };
    }
    // Lost: grant 2 powers
    return {
      grantPower: 'random',
      description: 'Flower of Fire: Thua → nhận 2 Power',
    };
  },
  '+1 random stat per 2 powers on win; 2 powers on lose'
);

// ============================================================================
// HONJO MASAMUNE - +2 points if won both SPD and BIQ
// ============================================================================

/**
 * Honjo Masamune - Trong combat: Thắng cả SPD và BIQ, +2 điểm.
 */
registerCombatHandler(
  'honjo_spd_biq_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const spdWin = ctx.roundResults?.speed === 'win';
    const biqWin = ctx.roundResults?.biq === 'win';
    if (spdWin && biqWin) {
      return {
        selfPoints: 2,
        description: 'Honjo Masamune: Thắng cả SPD và BIQ → +2 điểm',
      };
    }
    return { skipDefault: true };
  },
  '+2 points if won both SPD and BIQ rounds'
);

// ============================================================================
// MEDUSA'S HEAD - Steal points opponent would get from effects
// ============================================================================

/**
 * Medusa's Head - Trong combat: Nhận điểm thay đối thủ khi họ nhận từ hiệu ứng.
 */
registerCombatHandler(
  'medusa_steal_effect_points',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: "Medusa's Head: Ăn cắp điểm từ hiệu ứng đối thủ nhận được",
    };
  },
  'Steal effect points that opponent would receive'
);

// ============================================================================
// GIANT SLAYER - +1 point per 4 Base Dura of opponent (max 2)
// ============================================================================

/**
 * Giant Slayer - Trong combat: +1 điểm với mỗi 4 Base Dura của đối thủ (tối đa 2).
 */
registerCombatHandler(
  'giant_slayer_dura_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppBaseDura = ctx.opponent.baseStats.durability;
    const points = Math.min(2, Math.floor(oppBaseDura / 4));
    if (points > 0) {
      return {
        selfPoints: points,
        description: `Giant Slayer: Đối thủ có ${oppBaseDura} Base Dura → +${points} điểm`,
      };
    }
    return { description: `Giant Slayer: Đối thủ chưa đủ 4 Base Dura (${oppBaseDura})` };
  },
  '+1 point per 4 opponent Base Dura (max 2)'
);

// ============================================================================
// RUAN MEI'S LUTE - Opponent -1 IQ, -1 BIQ per shared Quirk
// ============================================================================

/**
 * Ruan Mei's Lute - Đối thủ -1 IQ, -1 BIQ với mỗi Quirk chung.
 */
registerCombatHandler(
  'ruan_mei_shared_quirks',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const selfQuirks = new Set(ctx.self.quirks);
    const shared = ctx.opponent.quirks.filter(q => selfQuirks.has(q)).length;
    if (shared > 0) {
      return {
        opponentStatMods: [
          { stat: 'iq', value: -shared },
          { stat: 'biq', value: -shared },
        ],
        description: `Ruan Mei's Lute: ${shared} Quirk chung → đối thủ -${shared} IQ, -${shared} BIQ`,
      };
    }
    return { description: "Ruan Mei's Lute: Không có Quirk chung" };
  },
  'Opponent -1 IQ -1 BIQ per shared Quirk'
);

// ============================================================================
// GREEN DRAGON CRESCENT BLADE - BIQ round result = STR round result
// ============================================================================

/**
 * Green Dragon Crescent Blade - Trong combat: Round BIQ có kết quả như round STR.
 */
registerCombatHandler(
  'green_dragon_biq_str',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const strResult = ctx.roundResults?.strength;
    if (strResult === 'win') {
      return {
        selfPoints: 1,
        description: 'Green Dragon: STR thắng → BIQ cũng thắng (+1 điểm)',
      };
    } else if (strResult === 'lose') {
      return {
        opponentPoints: 1,
        description: 'Green Dragon: STR thua → BIQ cũng thua (-1 điểm cho ta)',
      };
    }
    return { skipDefault: true };
  },
  'BIQ round mirrors STR round result'
);

// ============================================================================
// NEEDLE - +2 points when winning the round matching opponent's lowest Base Stat
// ============================================================================

/**
 * Needle - Trong Combat: Thắng Round có Base Stat thấp nhất của đối thủ, +2 điểm.
 */
registerCombatHandler(
  'needle_lowest_stat_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    let lowestStat: StatName = 'strength';
    let lowestVal = ctx.opponent.baseStats.strength;
    for (const stat of STAT_NAMES) {
      if (ctx.opponent.baseStats[stat] < lowestVal) {
        lowestVal = ctx.opponent.baseStats[stat];
        lowestStat = stat;
      }
    }
    const result = ctx.roundResults?.[lowestStat];
    if (result === 'win') {
      return {
        selfPoints: 2,
        description: `Needle: Thắng round ${lowestStat} (stat thấp nhất của đối thủ) → +2 điểm`,
      };
    }
    return { skipDefault: true };
  },
  "+2 points on winning opponent's lowest Base Stat round"
);

// ============================================================================
// BOLT OF GRANSAX - After winning SPD round, all subsequent SPD rounds worth +2
// ============================================================================

/**
 * Bolt of Gransax - Trong Combat: Thắng Round SPD, +2 điểm/round thay vì 1 cho phần còn lại.
 */
registerCombatHandler(
  'bolt_gransax_speed_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const spdResult = ctx.roundResults?.speed;
    if (spdResult === 'win' && ctx.self.roundsWon > 0) {
      // Give extra point for winning SPD
      return {
        selfPoints: 1,
        description: 'Bolt of Gransax: Thắng round SPD → +2 điểm (thêm +1)',
      };
    }
    return { skipDefault: true };
  },
  '+2 points on SPD round win after first SPD win'
);

// ============================================================================
// MISERICORDE - 10% chance to steal point when losing a round
// ============================================================================

/**
 * Misericorde - Mỗi khi thua round, 10% nhận điểm thay vì đối thủ.
 */
registerCombatHandler(
  'misericorde_steal_point',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    // 10% chance handled by condition in effect definition
    return {
      selfPoints: 1,
      opponentPoints: -1,
      description: 'Misericorde: 10% ăn cắp điểm khi thua round',
    };
  },
  '10% steal point on round loss'
);

// ============================================================================
// ECLIPSE SHOTEL - After win: opponent -2 all, lose lover, cure AIDS
// ============================================================================

/**
 * Eclipse Shotel - Sau Combat thắng: Đối thủ -2 All Stats, chia tay Lover. Chữa AIDS, loại bỏ Femboy.
 */
registerCombatHandler(
  'eclipse_shotel_effects',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      opponentStatMods: STAT_NAMES.map(stat => ({ stat, value: -2 })),
      description: 'Eclipse Shotel: Đối thủ -2 all stats, mất Lover. Bản thân chữa AIDS, loại Femboy.',
    };
  },
  'Opponent -2 all + lose lover; self cure AIDS + remove Femboy'
);

// ============================================================================
// TWELVE SANDALS - After combat loss: +3 and +6 to 2 random stats
// ============================================================================

/**
 * 12 đôi dép - Sau Combat thua: +3 và +6 vào 2 stat bất kì. Chung kết: thêm 1 lần nữa.
 */
registerCombatHandler(
  'twelve_sandals_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const shuffled = [...STAT_NAMES].sort(() => Math.random() - 0.5);
    const stat1 = shuffled[0];
    const stat2 = shuffled[1];
    const mods = [
      { stat: stat1, value: 3 },
      { stat: stat2, value: 6 },
    ];
    if (ctx.isFinals) {
      mods.push({ stat: stat1, value: 3 }, { stat: stat2, value: 6 });
    }
    return {
      selfStatMods: mods,
      description: `12 đôi dép: Thua → +3 ${stat1}, +6 ${stat2}${ctx.isFinals ? ' (x2 chung kết)' : ''}`,
    };
  },
  '+3 and +6 to 2 random stats after loss (double in finals)'
);

// ============================================================================
// YORIICHI'S BLACK NICHIRIN - Auto-win vs Demon, +3 all when no Demons remain
// ============================================================================

/**
 * Yoriichi's Black Nichirin - Trong Combat: Mặc định thắng Demon.
 * Khi không còn Demon nào còn sống, +3 all stats.
 */
registerCombatHandler(
  'nichirin_demon_slayer',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppRace = (ctx.opponent.race || '').toLowerCase();
    const isDemon = oppRace === 'demon';
    if (isDemon) {
      return {
        autoWin: true,
        description: "Yoriichi's Black Nichirin: Đối thủ là Demon → Auto Win",
      };
    }
    // Check if no Demons remain alive (check allCharacters)
    const allChars: any[] = (ctx as any).allCharacters || [];
    const demonAlive = allChars.some((c: any) => {
      const r = (c.race?.race || c.race || '').toLowerCase();
      return r === 'demon' && c.tournament?.status === 'alive';
    });
    if (!demonAlive && allChars.length > 0) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 3 })),
        description: "Yoriichi's Black Nichirin: Không còn Demon → +3 all stats",
      };
    }
    return { skipDefault: true };
  },
  'Auto-win vs Demon; +3 all stats when no Demons remain'
);

// ============================================================================
// DIVINE RAPIER - Remove weapon on combat loss
// ============================================================================

/**
 * Divine Rapier - Sau Combat thua: Mất vũ khí này.
 */
registerCombatHandler(
  'divine_rapier_lose_on_loss',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      removeWeapon: 'Divine Rapier',
      description: 'Divine Rapier: Thua combat → Mất vũ khí',
    };
  },
  'Remove Divine Rapier on combat loss'
);

// ============================================================================
// BLOODTHRIST DAGGER - +16% crit bonus for Critical Strike
// ============================================================================

/**
 * Bloodthrist Dagger - Trong Combat: +16% tỉ lệ crit của Critical Strike.
 */
registerCombatHandler(
  'bloodthrist_crit_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult | null => {
    const hasCritStrike = ctx.self.powers?.includes('Critical Strike');
    if (!hasCritStrike) return { skipDefault: true };
    return {
      updateCharacterField: { critBonusPercent: 16 },
      description: 'Bloodthrist Dagger: +16% crit cho Critical Strike',
    };
  },
  '+16% Critical Strike crit rate during combat'
);

// ============================================================================
// RUYI JINGU BANG - Grant random power after win (handled via condition probability)
// ============================================================================

/**
 * Ruyi Jingu Bang - Sau Combat thắng: 72% nhận 1 Power ngẫu nhiên.
 * (Probability condition is handled by effect definition; handler executes grant)
 */
registerCombatHandler(
  'ruyi_jingu_power_chance',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      grantPower: 'random',
      description: 'Ruyi Jingu Bang: Nhận 1 Power ngẫu nhiên',
    };
  },
  'Grant random power after combat win (72% chance via condition)'
);

// ============================================================================
// MJOLNIR - Return to wheel on combat loss
// ============================================================================

/**
 * Mjolnir - Sau combat thua: Mất vũ khí và trả lại về vòng quay.
 */
registerCombatHandler(
  'mjolnir_return_on_lose',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      removeWeapon: 'Mjolnir',
      description: 'Mjolnir: Thua combat → Mất Mjolnir, trả về vòng quay',
    };
  },
  'Remove Mjolnir and return to wheel on combat loss'
);

// ============================================================================
// RHITTA - 33% chance to double weapon stat bonuses during combat
// ============================================================================

/**
 * Rhitta - Trong Combat: 33% gấp đôi +STR và +Dura từ vũ khí.
 * Rhitta grants +3 STR and +2 Dura; doubled = +3 STR and +2 Dura extra.
 */
registerCombatHandler(
  'rhitta_double_bonus',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    const roll = Math.random() * 100;
    if (roll >= 33) return { skipDefault: true };
    return {
      selfStatMods: [
        { stat: 'strength', value: 3 },
        { stat: 'durability', value: 2 },
      ],
      description: 'Rhitta: 33% kích hoạt → Gấp đôi +STR +Dura',
    };
  },
  '33% chance to double Rhitta stat bonuses (+3 STR +2 Dura) during combat'
);

// ============================================================================
// ANDÚRIL - +1 starting point per 3 Summons vs evil races
// ============================================================================

const ANDURIL_EVIL_RACES = ['demon', 'vampire', 'spirit', 'orc', 'skeleton', 'goblin'];

/**
 * Andúril - Trước Combat: vs Demon/Vampire/Spirit/Orc/Skeleton/Goblin,
 * +1 điểm khởi đầu với mỗi 3 Summon đang có.
 */
registerCombatHandler(
  'anduril_evil_race_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppRace = (ctx.opponent.race || '').toLowerCase();
    const isEvilRace = ANDURIL_EVIL_RACES.includes(oppRace);
    if (!isEvilRace) return { skipDefault: true };

    const powers: any[] = ctx.self.powers || [];
    const summonCount = powers.filter((p: any) => {
      const name = typeof p === 'string' ? p : (p?.name || '');
      return name.toLowerCase().startsWith('summon:');
    }).length;
    const bonusPoints = Math.floor(summonCount / 3);
    if (bonusPoints <= 0) return { skipDefault: true };

    return {
      selfPoints: bonusPoints,
      description: `Andúril: vs ${ctx.opponent.race}, ${summonCount} Summons → +${bonusPoints} điểm`,
    };
  },
  '+1 starting point per 3 Summons when vs evil races (Demon/Vampire/Spirit/Orc/Skeleton/Goblin)'
);

// ============================================================================
// GALEFORCE - After combat: if opponent total points ≤0, +3 random stat
// ============================================================================

/**
 * Galeforce - Sau Combat: Nếu tổng điểm đối thủ ≤0, nhận +3 vào 1 stat ngẫu nhiên.
 */
registerCombatHandler(
  'galeforce_zero_points_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const oppPoints = (ctx as any).opponentTotalPoints ?? (ctx.opponent ? (ctx as any).opponentPoints : null);
    // Check via opponentPoints field or fallback: only grant if opponent ended ≤0 points
    if (oppPoints === null || oppPoints === undefined || oppPoints > 0) return { skipDefault: true };
    const stat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      selfStatMods: [{ stat, value: 3 }],
      description: `Galeforce: Đối thủ ≤0 điểm → +3 ${stat}`,
    };
  },
  '+3 random stat after combat if opponent total points ≤0'
);

// ============================================================================
// BATTLEFURY - After combat: if opponent total points ≤0, +3 random stat
// ============================================================================

/**
 * Battlefury - Sau Combat: Nếu tổng điểm đối thủ ≤0, nhận +3 vào 1 stat ngẫu nhiên.
 */
registerCombatHandler(
  'battlefury_zero_points_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const oppPoints = (ctx as any).opponentTotalPoints ?? (ctx.opponent ? (ctx as any).opponentPoints : null);
    if (oppPoints === null || oppPoints === undefined || oppPoints > 0) return { skipDefault: true };
    const stat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      selfStatMods: [{ stat, value: 3 }],
      description: `Battlefury: Đối thủ ≤0 điểm → +3 ${stat}`,
    };
  },
  '+3 random stat after combat if opponent total points ≤0'
);

// ============================================================================
// INFINITY GAUNTLET - Assign stones to 6 random players, collect on their death
// ============================================================================

/**
 * Infinity Gauntlet - Immediate: Quay 6 người chơi nhận đá vô cực.
 * Khi họ bị loại, người sở hữu gauntlet nhận đá của họ (Power).
 * This is a complex meta-game effect; immediate handler marks 6 players.
 */
registerCombatHandler(
  'infinity_gauntlet_stones',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    // This is handled by the engine at tournament level (spin 6 players for stones).
    // Combat handler is a no-op; actual stone collection happens on_death events.
    return { skipDefault: true };
  },
  'Meta-game: assign stones to 6 players, collect on their death (engine-level)'
);

export function registerWeaponCombatHandlers() {
  // All handlers are registered at module level via registerCombatHandler calls above.
}
