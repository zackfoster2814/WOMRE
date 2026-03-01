/**
 * Char Dev & Uma Parent Combat Handlers
 *
 * Combat handlers cho các Char Dev và Uma Parent (Sub-race) effects.
 */

import { registerCombatHandler } from '../registry';
import type { CombatHandlerContext, CombatHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// CHAR DEV COMBAT HANDLERS
// ============================================================================

/**
 * King Slayer - Trong combat vs "King's Landing", +1 All Stats
 */
registerCombatHandler(
  'king_slayer_vs_kings_landing',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const oppCharDevs: string[] = (ctx.opponent.character as any).charDevs?.map((c: any) =>
      typeof c === 'string' ? c : c.name
    ) || [];
    const oppHasKingsLanding = oppCharDevs.some((cd) =>
      cd.toLowerCase().includes("king's landing")
    );

    if (!oppHasKingsLanding) {
      return { skipDefault: true, description: 'King Slayer: đối thủ không có "King\'s Landing"' };
    }

    const mods = STAT_NAMES.map((stat) => ({ stat, value: 1 }));
    return {
      selfStatMods: mods,
      description: '+1 All Stats (King Slayer vs King\'s Landing)',
    };
  },
  "+1 all stats when fighting opponent with King's Landing char dev",
);

/**
 * King's Landing - On death: housemates nhận 1 Power
 */
registerCombatHandler(
  'kings_landing_death_gift',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: "King's Landing: khi bị loại, gia tộc nhận 1 Power (handled externally)",
    };
  },
  "On death: housemates gain 1 Power",
);

/**
 * King's Landing Penalty - -2 điểm và -10 IQ nếu không có Archetype "Devotee",
 * không thuộc race "God" hoặc "Demi God"
 */
registerCombatHandler(
  'kings_landing_penalty_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const selfRace = ctx.self.race?.toLowerCase() ?? '';
    const exemptRaces = ['god', 'demi god', 'demi-god', 'demigod'];

    const isExemptByRace = exemptRaces.some((r) => selfRace.includes(r));

    // Check Archetype "Devotee"
    const archetypes: string[] = (ctx.self as any).archetypes?.map((a: any) =>
      typeof a === 'string' ? a : (a?.name ?? '')
    ) || [];
    const isDevotee = archetypes.some((a) => a.toLowerCase().includes('devotee'));

    if (isExemptByRace || isDevotee) {
      return {
        skipDefault: true,
        description: "King's Landing: exempt (Archetype Devotee hoặc race God/Demi God)",
      };
    }

    // Apply -2 points and -10 IQ
    return {
      selfStatMods: [{ stat: 'iq', value: -10 }],
      selfPoints: -2,
      description: "King's Landing: -2 điểm và -10 IQ (không có Devotee/God/Demi God)",
    };
  },
  "King's Landing: -2 points and -10 IQ unless Archetype Devotee or race God/Demi God",
);

/**
 * Hand of King - Trong combat vs "Become King Slayer", +1 All Stats
 */
registerCombatHandler(
  'hand_of_king_vs_slayer',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const oppCharDevs: string[] = (ctx.opponent.character as any).charDevs?.map((c: any) =>
      typeof c === 'string' ? c : c.name
    ) || [];
    const oppIsSlayer = oppCharDevs.some((cd) =>
      cd.toLowerCase().includes('king slayer') || cd.toLowerCase().includes('slayer')
    );

    if (!oppIsSlayer) {
      return { skipDefault: true, description: 'Hand of King: đối thủ không có "King Slayer"' };
    }

    const mods = STAT_NAMES.map((stat) => ({ stat, value: 1 }));
    return {
      selfStatMods: mods,
      description: '+1 All Stats (Hand of King vs King Slayer)',
    };
  },
  '+1 all stats when fighting opponent with Become King Slayer char dev',
);

/**
 * Lord of Cinder - Nếu thua ở vòng có đọ trọng số, đánh lại 1 lần nữa
 */
registerCombatHandler(
  'lord_of_cinder_rematch',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Lord of Cinder: đánh lại combat này thêm 1 lần (handled externally)',
    };
  },
  'Rematch once per round if lost in a weighted round',
);

/**
 * Shardbearer - Sau Combat: Nhận thêm 1 mảnh Great Rune chưa có
 */
registerCombatHandler(
  'shardbearer_great_rune',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Shardbearer: nhận 1 mảnh Great Rune chưa có (handled externally)',
    };
  },
  'After combat: gain 1 Great Rune shard not yet owned',
);

/**
 * Don't say it - Sau combat thắng lần đầu: xóa giảm stats, +2 all, nhận Power "Encroaching Shadow"
 */
registerCombatHandler(
  'dont_say_it_win_bonus',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    // triggerOnce in data ensures this only fires once
    const mods = STAT_NAMES.map((stat) => ({ stat, value: 2 }));
    return {
      selfStatMods: mods,
      grantPower: 'Encroaching Shadow',
      description: 'Don\'t say it: xóa giảm stats, +2 All Stats, nhận "Encroaching Shadow"',
    };
  },
  "After first win: remove stat penalty, +2 all stats, grant Encroaching Shadow power",
);

/**
 * MrBeast - Sau combat thắng: Tặng gear cho 5 người, hoặc -5 stats → +1 cho 5 người
 */
registerCombatHandler(
  'mrbeast_gift_gear',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'MrBeast: Quay 5 người và tặng 1 Gear. Nếu không có Gear: -5 stats để +1 cho 5 người (handled externally)',
    };
  },
  'After win: gift gear to 5 random players, or -5 stats to give +1 to 5 players',
);

/**
 * Svks - Cướp tất cả hiệu ứng PvP Rewards của 1 người còn sống ngẫu nhiên
 */
registerCombatHandler(
  'svks_steal_pvp_rewards',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'SVKS: Cướp tất cả hiệu ứng PvP Rewards từ 1 người ngẫu nhiên (handled externally)',
    };
  },
  'Steal all PvP Reward effects from a random alive player',
);

// ============================================================================
// UMA PARENT (SUB-RACE) COMBAT HANDLERS
// ============================================================================

/**
 * El Condor Pasa - Sau PvP thắng Round Dura: +3 Speed, +3 Str trong combat kế
 */
registerCombatHandler(
  'el_condor_pasa_dura_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    // Check if the character won the durability round in the previous combat
    // Since this triggers "during_combat" with duration "combat", we check roundResults
    const durResult = ctx.roundResults?.durability;
    if (durResult !== 'win') {
      return {
        skipDefault: true,
        description: 'El Condor Pasa: chưa thắng Round Dura',
      };
    }

    return {
      selfStatMods: [
        { stat: 'speed', value: 3 },
        { stat: 'strength', value: 3 },
      ],
      description: '+3 Speed, +3 Strength (El Condor Pasa - thắng Round Dura)',
    };
  },
  'After winning Dura round: +3 Speed and +3 Strength in next combat',
);

/**
 * Symboli Rudolf - Thắng chung kết nhánh thắng: +1 All Stats
 */
registerCombatHandler(
  'symboli_rudolf_finals_winner',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Check if this is the winner bracket finals
    const isWinnerFinals = ctx.isFinals && ctx.self.bracket !== 'loser';
    if (!isWinnerFinals) {
      return {
        skipDefault: true,
        description: 'Symboli Rudolf: không phải chung kết nhánh thắng',
      };
    }

    const mods = STAT_NAMES.map((stat) => ({ stat, value: 1 }));
    return {
      selfStatMods: mods,
      description: '+1 All Stats (Symboli Rudolf - thắng chung kết nhánh thắng)',
    };
  },
  '+1 all stats on winning winner bracket finals',
);

/**
 * Nice Nature - Nếu cả hai đều có 3 điểm trong combat, bỏ qua Tie-Break và thắng
 */
registerCombatHandler(
  'nice_nature_auto_win_tie',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    // This fires during_combat; check if scores are tied at 3-3
    const selfScore = ctx.self.roundsWon;
    const oppScore = ctx.self.roundsLost;

    // 3-3 tie means both have 3 wins — auto-win skipping tie-break
    if (selfScore === 3 && oppScore === 3) {
      return {
        autoWin: true,
        description: 'Nice Nature: Tie-Break 3-3 → Auto Win',
      };
    }

    return {
      skipDefault: true,
      description: 'Nice Nature: chưa đến Tie-Break 3-3',
    };
  },
  'If tied 3-3 in combat, skip Tie-Break and auto-win',
);

/**
 * Rice Shower - +1 all stats ở nhánh thua, hết hiệu lực khi tới chung kết
 */
registerCombatHandler(
  'rice_shower_not_finals',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const isLoserBracket = ctx.self.bracket === 'loser' || ctx.self.bracket === 'losers';

    if (!isLoserBracket || ctx.isFinals) {
      return {
        skipDefault: true,
        description: 'Rice Shower: không ở nhánh thua hoặc đã tới chung kết',
      };
    }

    const mods = STAT_NAMES.map((stat) => ({ stat, value: 1 }));
    return {
      selfStatMods: mods,
      description: '+1 All Stats trong combat (Rice Shower - nhánh thua)',
    };
  },
  '+1 all stats in loser bracket combats, disabled in finals',
);

/**
 * Haru Urara round 32 check - also used as combat timing variant
 */
registerCombatHandler(
  'haru_urara_round_32_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // The +3 stats is granted once when reaching round 32
    // This combat handler is referenced but actual logic is in immediate handler
    const pvpWins = ctx.self.pvpWins;
    const hasReachedRound32 = pvpWins >= 3;

    if (!hasReachedRound32) {
      return {
        skipDefault: true,
        description: 'Haru Urara: chưa tới vòng 32',
      };
    }

    const mods = STAT_NAMES.map((stat) => ({ stat, value: 3 }));
    return {
      selfStatMods: mods,
      description: '+3 All Stats (Haru Urara - đã đến vòng 32)',
    };
  },
  '+3 all stats during combat if reached round 32',
);

/**
 * Nagi - Extra Char Dev (immediate only, no combat effect)
 */
registerCombatHandler(
  'nagi_extra_char_dev',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Nagi: +2 Char Dev khi quay vòng Char Dev (handled externally)',
    };
  },
  'Gain 2 extra Char Devs when spinning Char Dev wheel',
);

/**
 * Tokai Teio instrument check - combat timing variant
 */
registerCombatHandler(
  'tokai_teio_instrument_check',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const INSTRUMENT_WEAPONS = [
      'Bagpipe', 'Drums', 'Flute', 'Guitar', 'Violin', 'Trumpet',
      'Piano', 'Harp', 'Lute', 'Saxophone', 'Bass', 'Cello',
    ];

    const weapons: any[] = ctx.self.weapons || [];
    const hasInstrument = weapons.some((w) => {
      const wName = typeof w === 'string' ? w : w?.name;
      return wName && INSTRUMENT_WEAPONS.some((inst) =>
        wName.toLowerCase().includes(inst.toLowerCase())
      );
    });

    if (!hasInstrument) {
      return { skipDefault: true, description: 'Tokai Teio: không có nhạc cụ' };
    }

    const baseSpeed = ctx.self.baseStats.speed ?? 0;
    return {
      selfStatMods: [{ stat: 'speed', value: baseSpeed }],
      description: `Gấp đôi Base Speed (+${baseSpeed}) khi dùng nhạc cụ (Tokai Teio)`,
    };
  },
  'Double Base Speed during combat when using a musical instrument',
);

// ============================================================================
// MAD SCIENTIST - Random Shrinking or Enlarging before combat
// ============================================================================

/**
 * Mad Scientist - before_combat: 50% Shrinking (opponent -2 all stats),
 * 50% Enlarging (self +2 all stats). Combat duration only.
 */
registerCombatHandler(
  'mad_scientist_random_size',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    if (Math.random() < 0.5) {
      return {
        opponentStatMods: STAT_NAMES.map(stat => ({ stat, value: -2 })),
        description: 'Mad Scientist: Shrinking → Đối thủ -2 all stats (combat only)',
      };
    } else {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 2 })),
        description: 'Mad Scientist: Enlarging → Bản thân +2 all stats (combat only)',
      };
    }
  },
  '50% Shrinking (opponent -2 all) or 50% Enlarging (self +2 all) before combat'
);

export function registerCharDevCombatHandlers(): void {
  console.log('CharDev combat handlers registered');
}
