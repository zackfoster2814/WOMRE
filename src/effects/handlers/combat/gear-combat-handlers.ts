/**
 * Gear Combat Handlers
 *
 * Combat handlers cho tất cả Gear effects.
 */

import { registerCombatHandler } from '../registry';
import type { CombatHandlerContext, CombatHandlerResult } from '../types';
import type { StatName } from '../../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// ============================================================================
// FISHING ROD - PvE Reward after raid boss
// ============================================================================

/**
 * Fishing Rod - Sau trận đấu raid boss, nhận 1 PvP Reward.
 */
registerCombatHandler(
  'fishing_rod_pve_reward',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.isPvE) {
      return {
        description: 'Fishing Rod: Nhận 1 PvP Reward sau raid boss',
      };
    }
    return { skipDefault: true };
  },
  '1 PvP Reward after PvE combat'
);

// ============================================================================
// VĂN TẾ - Re-spin highest stat of random player on death
// ============================================================================

/**
 * Văn tế - Khi bị loại, re-spin stat cao nhất của 1 người ngẫu nhiên.
 */
registerCombatHandler(
  'van_te_respin_highest',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Văn tế: Khi bị loại, re-spin stat cao nhất của 1 người còn sống ngẫu nhiên',
    };
  },
  'Re-spin highest stat of random player on death'
);

// ============================================================================
// KURO'S CHARM - Destroy after combat win
// ============================================================================

/**
 * Kuro's Charm - Sau Combat Thắng: Phá hủy Gear này.
 */
registerCombatHandler(
  'kuro_charm_destroy',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      removeGear: "Kuro's Charm",
      description: "Kuro's Charm: Phá hủy sau combat thắng",
    };
  },
  "Destroy Kuro's Charm after win"
);

// ============================================================================
// BA HOA TRẮNG - +1 all stats and remove after loser bracket win
// ============================================================================

/**
 * Ba hoa trắng - Sau khi thắng ở nhánh thua, +1 all stats và loại bỏ gear.
 * Chỉ kích hoạt khi đang ở nhánh thua (isLoserBracket).
 */
registerCombatHandler(
  'ba_hoa_trang_loser_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.isLoserBracket) {
      return { skipDefault: true };
    }
    return {
      selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
      removeGear: 'Ba hoa trắng',
      description: 'Ba hoa trắng: Thắng ở nhánh thua → +1 all stats, loại bỏ gear',
    };
  },
  '+1 all stats and remove gear after loser bracket win'
);

// ============================================================================
// GIẤY NỢ GIA TRUYỀN - Debt penalty or Golden Coin reward
// ============================================================================

/**
 * Giấy Nợ Gia Truyền:
 * - Không đủ 4 điểm → mất toàn bộ Gear/Weapon, chuyển gear sang 1 người ngẫu nhiên trong House.
 * - Đủ 4 điểm → nhận 2 Golden Coin.
 */
registerCombatHandler(
  'giay_no_gia_truyen_debt',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.self.roundsWon < 4) {
      return {
        removeAllGearAndWeapon: true,
        transferGearToRandomHouseMember: true,
        description: 'Giấy Nợ Gia Truyền: Không đủ 4 điểm → mất toàn bộ Gear và Weapon, chuyển Giấy Nợ cho người ngẫu nhiên trong House',
      };
    }
    return {
      grantGear: ['Golden Coin', 'Golden Coin'],
      description: 'Giấy Nợ Gia Truyền: Đủ 4 điểm → nhận 2 Golden Coin',
    };
  },
  'Lose all Gear/Weapon if < 4 points; gain 2 Golden Coins if >= 4 points'
);

// ============================================================================
// CURSED COIN 50/50 - Random debuff
// ============================================================================

/**
 * Cursed Coin - 50/50 quay xem ai bị -1 all stats.
 */
registerCombatHandler(
  'cursed_coin_50_50',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    const selfDebuffed = Math.random() < 0.5;

    if (selfDebuffed) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: -1 })),
        description: 'Cursed Coin: Bạn bị -1 all stats',
      };
    } else {
      return {
        opponentStatMods: STAT_NAMES.map(stat => ({ stat, value: -1 })),
        description: 'Cursed Coin: Đối thủ bị -1 all stats',
      };
    }
  },
  '50/50 -1 all stats to self or opponent'
);

// ============================================================================
// BEER - Opponent total debuff applied to random self stat
// ============================================================================

/**
 * Beer - Cần Empty Stein. Cộng tổng debuff của đối thủ và áp dụng vào 1 stat ngẫu nhiên của mình.
 */
registerCombatHandler(
  'beer_debuff_to_points',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const hasStein = ctx.self.gears.some(g => g === 'Empty Stein' || (g as any).name === 'Empty Stein');
    if (!hasStein) {
      return {
        description: 'Beer: Cần Empty Stein để uống',
      };
    }

    if (!ctx.opponent) return { skipDefault: true };

    // Sum all negative debuffs on opponent (sum of negative bonuses)
    const totalDebuff = ctx.opponent.totalDebuff ?? 0;
    if (totalDebuff <= 0) {
      return { description: 'Beer: Đối thủ không có debuff' };
    }

    const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      selfStatMods: [{ stat: randomStat, value: totalDebuff }],
      description: `Beer: Cộng ${totalDebuff} debuff của đối thủ vào ${randomStat} của mình`,
    };
  },
  'Sum opponent debuffs → apply to random self stat'
);

// ============================================================================
// WINE - Self total debuff applied to random opponent stat
// ============================================================================

/**
 * Wine - Cần Shot Glass. Cộng tổng debuff của mình và áp dụng vào 1 stat ngẫu nhiên của đối thủ.
 */
registerCombatHandler(
  'wine_self_debuff_to_points',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const hasGlass = ctx.self.gears.some(g => g === 'Shot Glass' || (g as any).name === 'Shot Glass');
    if (!hasGlass) {
      return {
        description: 'Wine: Cần Shot Glass để uống',
      };
    }

    if (!ctx.opponent) return { skipDefault: true };

    const totalDebuff = ctx.self.totalDebuff ?? 0;
    if (totalDebuff <= 0) {
      return { description: 'Wine: Bản thân không có debuff' };
    }

    const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      opponentStatMods: [{ stat: randomStat, value: totalDebuff }],
      description: `Wine: Cộng ${totalDebuff} debuff của mình vào ${randomStat} của đối thủ`,
    };
  },
  'Sum self debuffs → apply to random opponent stat'
);

// ============================================================================
// KRYPTONITE VS SUPERMAN
// ============================================================================

/**
 * Kryptonite - Đối đầu Superman bị -2 điểm khởi đầu.
 */
registerCombatHandler(
  'kryptonite_vs_superman',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    // Check if opponent has Superman archetype or is Superman
    const opponentArchetypes = ctx.opponent.character.archetypes || [];
    const isSuperMan = opponentArchetypes.some((a: any) =>
      a.name === 'Superman' || a.subType === 'Superman'
    );

    if (isSuperMan) {
      return {
        opponentPoints: -2,
        description: 'Kryptonite: Superman bị -2 điểm khởi đầu',
      };
    }

    return { skipDefault: true };
  },
  '-2 starting points to Superman opponent'
);

// ============================================================================
// GLOCK - After combat: -2 highest stat per round lost to opponent
// ============================================================================

/**
 * Glock - Sau Combat: Với mỗi round thua, đối thủ nhận -2 Stat cao nhất.
 */
registerCombatHandler(
  'glock_round_lose_debuff',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const roundsLost = ctx.self.roundsLost;
    if (roundsLost <= 0) return { skipDefault: true };

    // Find opponent's highest stat
    let highestStat: StatName = 'strength';
    let highestVal = ctx.opponent.stats.strength;
    for (const stat of STAT_NAMES) {
      if (ctx.opponent.stats[stat] > highestVal) {
        highestVal = ctx.opponent.stats[stat];
        highestStat = stat;
      }
    }

    return {
      opponentStatMods: [{ stat: highestStat, value: -2 * roundsLost }],
      description: `Glock: Đối thủ -${2 * roundsLost} ${highestStat} (${roundsLost} round thua)`,
    };
  },
  '-2 highest stat per round lost to opponent'
);

// ============================================================================
// BARON BUFF - Destroy on combat loss
// ============================================================================

/**
 * Baron Buff - Sau combat thua: Mất Gear này.
 */
registerCombatHandler(
  'baron_buff_destroy_on_lose',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      removeGear: 'Baron Buff',
      description: 'Baron Buff: Mất gear sau combat thua',
    };
  },
  'Destroy Baron Buff after combat loss'
);

// ============================================================================
// LEVIATHAN'S MARK - Debuff after opponent wins
// ============================================================================

/**
 * Leviathan's Mark - Sau combat thắng: Leviathan nhận -1 Stat thấp nhất.
 */
registerCombatHandler(
  'leviathan_mark_debuff',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Find self lowest stat
    let lowestStat: StatName = 'strength';
    let lowestVal = ctx.self.stats.strength;
    for (const stat of STAT_NAMES) {
      if (ctx.self.stats[stat] < lowestVal) {
        lowestVal = ctx.self.stats[stat];
        lowestStat = stat;
      }
    }

    return {
      selfStatMods: [{ stat: lowestStat, value: -1 }],
      description: `Leviathan's Mark: -1 ${lowestStat} sau combat thắng`,
    };
  },
  "-1 lowest stat after combat win"
);

// ============================================================================
// DARKIN BLADE - Point steal in last 3 rounds, trigger once
// ============================================================================

/**
 * Darkin Blade - Ở 3 Round cuối, nếu thắng round đó, hút 1 điểm của đối thủ. Kích hoạt 1 lần duy nhất.
 * (Nhận tổng 2 điểm: 1 từ thắng + 1 từ hút. Đối thủ mất 1 điểm.)
 */
registerCombatHandler(
  'darkin_blade_point_steal',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Only trigger in last 3 rounds (rounds totalRounds-2, totalRounds-1, totalRounds)
    if (ctx.currentRound < ctx.totalRounds - 2) {
      return { skipDefault: true };
    }
    // Won this round
    if (ctx.currentRoundResult !== 'win') {
      return { skipDefault: true };
    }
    return {
      selfPoints: 1,
      opponentPoints: -1,
      description: 'Darkin Blade: Hút 1 điểm từ đối thủ (kích hoạt 1 lần ở 3 round cuối)',
    };
  },
  'Steal 1 point once in last 3 rounds when winning that round'
);

// ============================================================================
// KING GNOME'S BANANA - IQ comparison buff/debuff
// ============================================================================

/**
 * King Gnome's Banana - +2 all stats nếu IQ cao hơn, -2 all stats nếu IQ thấp hơn.
 */
registerCombatHandler(
  'king_gnome_banana_iq_compare',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const selfIQ = ctx.self.stats.iq;
    const oppIQ = ctx.opponent.stats.iq;

    if (selfIQ > oppIQ) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 2 })),
        description: `King Gnome's Banana: IQ cao hơn (${selfIQ} > ${oppIQ}) → +2 all stats`,
      };
    } else if (selfIQ < oppIQ) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: -2 })),
        description: `King Gnome's Banana: IQ thấp hơn (${selfIQ} < ${oppIQ}) → -2 all stats`,
      };
    }

    return {
      description: `King Gnome's Banana: IQ bằng nhau (${selfIQ})`,
    };
  },
  '+2/-2 all stats based on IQ comparison'
);

// ============================================================================
// DICE OF THE DEAD - Auto win vs Gambler archetype (weakest auto-win)
// ============================================================================

/**
 * The Dice of the Dead - Auto win khi đối đầu người có Archetype "Gambler".
 * Hiệu ứng này yếu hơn tất cả các hiệu ứng tự động thắng khác.
 */
registerCombatHandler(
  'dice_of_dead_auto_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const oppArchetypes: any[] = (ctx.opponent.character as any).archetypes || [];
    const isGambler = oppArchetypes.some((a: any) => {
      const name = typeof a === 'string' ? a : a?.name ?? '';
      return name.toLowerCase().includes('gambler');
    });

    if (isGambler) {
      return {
        autoWin: true,
        autoWinPriority: 'weakest',
        description: 'The Dice of the Dead: Auto win vs Gambler (yếu nhất)',
      };
    }

    return { skipDefault: true };
  },
  'Auto win (weakest) against Gambler archetype opponents'
);

/**
 * The Dice of the Dead - Sau combat thắng: +4% gamble win chance (stack).
 */
registerCombatHandler(
  'dice_of_dead_gamble_stack',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const current = (ctx.self as any).gambleWinBonus ?? 0;
    return {
      updateCharacterField: { gambleWinBonus: current + 4 },
      description: `The Dice of the Dead: Gamble win chance +4% (tổng ${current + 4}%)`,
    };
  },
  '+4% gamble win chance stack after combat win'
);

// ============================================================================
// BOOK OF A SMALL DOG - Isekai after first win
// ============================================================================

/**
 * Book of a small dog - Sau trận thắng đầu tiên, bạn sẽ "Isekai".
 */
registerCombatHandler(
  'book_small_dog_isekai',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      opponentIsekai: true,
      description: 'Book of a small dog: Isekai sau trận thắng đầu tiên. Gear trở về vòng quay.',
    };
  },
  'Isekai after first combat win'
);

// ============================================================================
// SKULL OF THE BALANCE DRAGON - +1 all stats on tiebreak win
// ============================================================================

/**
 * Skull of the Balance Dragon - Khi thắng tie-break, nhận +1 all stats.
 */
registerCombatHandler(
  'skull_balance_dragon_tiebreak',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Tiebreak = won by exactly 1 point (3-2 in 6 rounds, or similar)
    const margin = ctx.self.roundsWon - ctx.self.roundsLost;
    if (margin === 1) {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
        description: 'Skull of the Balance Dragon: Thắng tie-break → +1 all stats',
      };
    }
    return { skipDefault: true };
  },
  '+1 all stats on tiebreak win'
);

// ============================================================================
// STAFF OF THE FALLEN ONE - Swap Quirk/Power 50/50
// ============================================================================

/**
 * Staff of the Fallen One - 50% mất 1 Quirk → 1 Power, 50% mất 1 Power → 1 Quirk.
 */
registerCombatHandler(
  'staff_fallen_one_swap',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    const quirkToPower = Math.random() < 0.5;
    if (quirkToPower) {
      return {
        grantPower: 'random',
        description: 'Staff of the Fallen One: Mất 1 Quirk → nhận 1 Power',
      };
    } else {
      return {
        grantQuirk: 'random',
        description: 'Staff of the Fallen One: Mất 1 Power → nhận 1 Quirk',
      };
    }
  },
  '50/50 swap Quirk↔Power after combat'
);

// ============================================================================
// SPIRIT OF THE WHEEL - Isekai 3 random players
// ============================================================================

/**
 * Spirit of the Wheel - Trận đầu tiên, 3 người ngẫu nhiên "Isekai".
 */
registerCombatHandler(
  'spirit_wheel_isekai_3',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Spirit of the Wheel: 3 người ngẫu nhiên bị Isekai sau trận đầu',
    };
  },
  'Isekai 3 random players after first combat'
);

// ============================================================================
// SỔ TAY - +1 IQ sau khi thua round IQ
// ============================================================================

/**
 * Sổ tay - Sau Combat: Khi thua round IQ, nhận +1 IQ.
 */
registerCombatHandler(
  'so_tay_iq_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.iq === 'lose') {
      return {
        selfStatMods: [{ stat: 'iq', value: 1 }],
        description: 'Sổ tay: Thua round IQ → +1 IQ',
      };
    }
    return { skipDefault: true };
  },
  '+1 IQ after losing IQ round (Sổ tay)'
);

// ============================================================================
// KẸO + ỚT COMBO - PvE: bật nhạc Thắng Ngọt (description only)
// ============================================================================

/**
 * Kẹo/Ớt combo - pve_only: Bật nhạc Thắng Ngọt (hoặc AI Cover) trong PvE.
 * Logic ngoài game (âm nhạc), chỉ cần description.
 */
registerCombatHandler(
  'keo_ot_combo',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.isPvE) {
      return {
        description: 'Kẹo/Ớt: Bật nhạc Thắng Ngọt trong PvE (effect external)',
      };
    }
    return { skipDefault: true };
  },
  'Play Thắng Ngọt music in PvE (Kẹo/Ớt combo)'
);

// ============================================================================
// CREATOR'S CAT RING - PvE only: receive Creator's Favor 1-3x (+1 all stats each)
// ============================================================================

registerCombatHandler(
  'creator_cat_ring_favor',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.isPvE) return { skipDefault: true };
    // Random 1-3 favors
    const favorCount = Math.floor(Math.random() * 3) + 1;
    return {
      selfStatMods: STAT_NAMES.map(stat => ({ stat, value: favorCount })),
      description: `Creator's Cat Ring: [PvE] Nhận Creator's Favor x${favorCount} → +${favorCount} all stats`,
    };
  },
  "PvE: receive Creator's Favor 1-3 times (+1 all stats each) (Creator's Cat Ring)"
);

// ============================================================================
// STELLARON HUNTER'S MEMBER CARD - Per-member combat effects
// ============================================================================

/**
 * Kafka - Sau Combat Thắng: Nhận thêm 1 Power với mỗi 3 điểm ghi được. (Tối đa 3 Power)
 */
registerCombatHandler(
  'stellaron_kafka_power',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const points = ctx.self.roundsWon;
    const powerCount = Math.min(3, Math.floor(points / 3));
    if (powerCount <= 0) return { skipDefault: true };
    return {
      grantPowers: Array(powerCount).fill('random'),
      description: `Stellaron Kafka: ${points} điểm → nhận ${powerCount} Power`,
    };
  },
  'Kafka: +1 Power per 3 points (max 3) after combat win'
);

/**
 * Silver Wolf - Sau combat: Cướp ngẫu nhiên 1 Gear từ người chơi còn sống và nhận +1 IQ.
 */
registerCombatHandler(
  'stellaron_silver_wolf_steal',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      stealGearFromRandomLivingPlayer: true,
      selfStatMods: [{ stat: 'iq', value: 1 }],
      description: 'Stellaron Silver Wolf: Cướp 1 Gear ngẫu nhiên từ người chơi còn sống + nhận +1 IQ',
    };
  },
  'Silver Wolf: steal 1 random gear from living player + +1 IQ'
);

/**
 * Firefly - Trong combat: Khi thắng 2 round liên tiếp, đối thủ bị -6 stat ở round tiếp theo. (1 lần/combat)
 */
registerCombatHandler(
  'stellaron_firefly_streak',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const streak = (ctx.self as any).consecutiveRoundWins ?? 0;
    if (streak >= 2) {
      const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
      return {
        opponentStatMods: [{ stat: randomStat, value: -6 }],
        description: `Stellaron Firefly: Thắng 2 round liên tiếp → đối thủ -6 ${randomStat} round tiếp theo`,
      };
    }
    return { skipDefault: true };
  },
  'Firefly: -6 random stat to opponent after 2 consecutive round wins (once per combat)'
);

/**
 * Elio - Sau mỗi 2 combat: Nhận 1 Creator's Favor.
 */
registerCombatHandler(
  'stellaron_elio_favor',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const combatCount = ((ctx.self as any).totalCombats ?? 0) + 1;
    if (combatCount % 2 === 0) {
      return {
        grantCreatorFavor: 1,
        description: `Stellaron Elio: Combat thứ ${combatCount} → nhận 1 Creator's Favor`,
      };
    }
    return { skipDefault: true };
  },
  "Elio: +1 Creator's Favor every 2 combats"
);

// ============================================================================
// KHUNG HÌNH THỜ - Mirror cancel when both players have it
// ============================================================================

/**
 * Khung hình thờ - Khi hai người đều có Khung Hình Thờ: loại bỏ hiệu ứng cả hai, xóa gear sau trận.
 */
registerCombatHandler(
  'khung_hinh_tho_mirror',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const oppGears: any[] = (ctx.opponent.character as any).gear?.normalGear ?? [];
    const oppHasKhung = oppGears.some((g: any) => {
      const name = typeof g === 'string' ? g : g?.name ?? '';
      return name.startsWith('Khung hình thờ');
    });

    if (oppHasKhung) {
      return {
        cancelGearEffect: 'Khung hình thờ',
        cancelOpponentGearEffect: 'Khung hình thờ',
        removeGear: 'Khung hình thờ',
        removeOpponentGear: 'Khung hình thờ',
        description: 'Khung hình thờ: Cả hai đều có → huỷ hiệu ứng và loại bỏ gear của cả hai',
      };
    }

    return { skipDefault: true };
  },
  'Cancel both Khung hình thờ effects when both players have it'
);

// ============================================================================
// GOD OF WAR'S ENTRY TICKET - +2 lowest stat vs Demi God/God
// ============================================================================

/**
 * God of War's Entry Ticket - Nhận +2 stat thấp nhất khi đối đầu với Demi God/God.
 */
registerCombatHandler(
  'god_of_war_demi_god_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const oppRace: string = (ctx.opponent.character as any).race?.race ?? '';
    const isDemiGodOrGod = oppRace === 'Demi God' || oppRace === 'God';

    if (!isDemiGodOrGod) return { skipDefault: true };

    let lowestStat: StatName = 'strength';
    let lowestVal = ctx.self.stats.strength;
    for (const stat of STAT_NAMES) {
      if (ctx.self.stats[stat] < lowestVal) {
        lowestVal = ctx.self.stats[stat];
        lowestStat = stat;
      }
    }

    return {
      selfStatMods: [{ stat: lowestStat, value: 2 }],
      description: `God of War: Đối đầu ${oppRace} → +2 ${lowestStat}`,
    };
  },
  '+2 lowest stat when facing Demi God or God race'
);

// ============================================================================
// RAGNAROK'S COBRA - Auto-lose at round 64 (once)
// ============================================================================

/**
 * Ragnarok's Cobra - Tự động thua ở vòng 64 (1 lần).
 * Việc "giết thần" và tính là trận thắng được xử lý ở immediate handler.
 */
registerCombatHandler(
  'ragnarok_cobra_auto_lose_r64',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // round 64 = WB-R64 hoặc LB tương đương (matchNumber 193-224)
    const matchNumber = ctx.matchNumber ?? 0;
    const isRound64 = matchNumber >= 193 && matchNumber <= 224;
    if (!isRound64) return { skipDefault: true };
    return {
      autoLose: true,
      triggerOnce: true,
      description: "Ragnarok's Cobra: Tự động thua ở vòng 64 (1 lần)",
    };
  },
  "Ragnarok's Cobra: auto-lose at WB-R64 (once)"
);

export function registerGearCombatHandlers() {
  // All handlers are registered at module level via registerCombatHandler calls above.
  // This function exists to be called from the handler index for explicit initialization.
}
