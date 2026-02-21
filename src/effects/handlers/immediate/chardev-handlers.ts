/**
 * Character Development Immediate Handlers
 *
 * Handlers cho các Char Dev effects.
 */

import { registerImmediateHandler } from "../registry";
import type { ImmediateHandlerContext, ImmediateHandlerResult } from "../types";
import type { StatName } from "../../types";

const STAT_NAMES: StatName[] = [
  "strength",
  "speed",
  "durability",
  "iq",
  "biq",
  "ma",
];

// ============================================================================
// CHAR DEV HANDLERS
// ============================================================================

/**
 * Last Standing - +2 all stats khi là người duy nhất còn sống trong House
 */
registerImmediateHandler(
  "last_standing_check",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const { character, allCharacters } = ctx;

    // Need allCharacters to check house membership
    if (!allCharacters || allCharacters.length === 0) {
      return {
        skipDefault: true,
        description: "Last Standing (không có dữ liệu players)",
      };
    }

    // Get character's active houses
    const myHouses: string[] = [];
    for (const h of character.nestedHouses || []) {
      if (!h.isLost || h.lostType === "kinda_homeless") {
        myHouses.push(h.name);
      }
    }
    // Fallback to regular houses
    for (const h of character.houses || []) {
      if (!h.isLost && !myHouses.includes(h.name)) {
        myHouses.push(h.name);
      }
    }

    if (myHouses.length === 0) {
      return {
        skipDefault: true,
        description: "Last Standing (không có House)",
      };
    }

    // Check if character is the only alive member in ANY of their houses
    let isLastStanding = false;

    for (const houseName of myHouses) {
      // Count alive members in this house (excluding self)
      const otherAliveMembers = allCharacters.filter((other) => {
        if (other.no === character.no) return false;
        if (other.tournament?.status !== "alive") return false;

        // Check if other character is in the same house
        const otherHouses: string[] = [];
        for (const h of other.nestedHouses || []) {
          if (!h.isLost || h.lostType === "kinda_homeless") {
            otherHouses.push(h.name);
          }
        }
        for (const h of other.houses || []) {
          if (!h.isLost && !otherHouses.includes(h.name)) {
            otherHouses.push(h.name);
          }
        }

        return otherHouses.includes(houseName);
      });

      if (otherAliveMembers.length === 0) {
        isLastStanding = true;
        break;
      }
    }

    if (!isLastStanding) {
      return {
        skipDefault: true,
        description:
          "Last Standing (chưa kích hoạt - còn đồng đội trong House)",
      };
    }

    // Apply +2 all stats
    const mods: ImmediateHandlerResult["statModifiers"] = [];
    for (const stat of STAT_NAMES) {
      mods.push({ stat, value: 2 });
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: "+2 All Stats (Last Standing)",
    };
  },
  "+2 all stats when last alive member of House",
);

/**
 * No more Home - Bị loại khỏi House, mất toàn bộ bonus từ House
 */
registerImmediateHandler(
  "no_more_home_remove_house",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Bị loại khỏi House và mất tất cả bonus từ đó (No more Home)",
    };
  },
  "Remove character from their House and lose all House bonuses",
);

/**
 * Lose Control - Mất tất cả Power
 */
registerImmediateHandler(
  "lose_control_remove_all_powers",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Mất tất cả Power (Lose Control)",
    };
  },
  "Remove all Powers from character",
);

/**
 * Creator's Favor - Đấng Sáng Tạo tùy ý buff (không thay đổi quá 2 chỉ số)
 */
registerImmediateHandler(
  "creators_favor",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Creator buff nhân vật (tối đa 2 chỉ số)",
    };
  },
  "Creator manually buffs character (up to 2 stats)",
);

/**
 * Creator's Limitation - Đấng Sáng Tạo tùy ý nerf (không thay đổi quá 2 chỉ số)
 */
registerImmediateHandler(
  "creators_limitation",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Creator nerf nhân vật (tối đa 2 chỉ số)",
    };
  },
  "Creator manually nerfs character (up to 2 stats)",
);

/**
 * Creator's Reforge - Loại bỏ vũ khí hiện tại, Creator chọn 1 vũ khí Normal + 1 Rune
 */
registerImmediateHandler(
  "creators_reforge",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Loại bỏ vũ khí hiện tại và nhận vũ khí Normal + Rune do Creator chọn",
    };
  },
  "Creator removes current weapon and grants a Normal weapon with a Rune",
);

/**
 * Demonic Pact - Hiến tế 1 base stat ngẫu nhiên (về 0) để nhận 3 Power
 */
registerImmediateHandler(
  "demonic_pact_sacrifice",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const { baseStats } = ctx;

    // Pick a random stat to sacrifice
    const randomStat =
      STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    const currentVal = baseStats[randomStat] ?? 0;
    const sacrificeAmount = -currentVal; // Reduce to 0

    return {
      statModifiers: [
        { stat: randomStat, value: sacrificeAmount, isBase: true },
      ],
      skipDefault: true,
      description: `Hiến tế ${randomStat} xuống 0 và nhận 3 Power (Demonic Pact)`,
    };
  },
  "Sacrifice a random base stat to 0, gain 3 Powers",
);

/**
 * Mentor - Nhận 1 Power từ player ngẫu nhiên (mục tiêu mất power đó)
 */
registerImmediateHandler(
  "mentor_steal_power",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Nhận 1 Power từ 1 player ngẫu nhiên (Mentor - mục tiêu mất power đó)",
    };
  },
  "Steal 1 Power from a random player",
);

/**
 * It is what it is - Mất hết toàn bộ vũ khí
 */
registerImmediateHandler(
  "it_is_what_it_is_remove_weapons",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Mất hết toàn bộ vũ khí (It is what it is)",
    };
  },
  "Remove all weapons from character",
);

/**
 * Blessed by Chaos - Kéo stat cao nhất xuống 1, nhận thêm 2 Char Dev
 */
registerImmediateHandler(
  "blessed_by_chaos",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const { baseStats } = ctx;

    // Find highest base stat
    let highestStat: StatName = "strength";
    let highestVal = baseStats.strength ?? 0;
    for (const stat of STAT_NAMES) {
      const val = baseStats[stat] ?? 0;
      if (val > highestVal) {
        highestVal = val;
        highestStat = stat;
      }
    }

    const reduceAmount = -(highestVal - 1); // Reduce to 1
    if (reduceAmount >= 0) {
      return {
        skipDefault: true,
        description: "Blessed by Chaos: stat cao nhất đã là 1, nhận 2 Char Dev",
      };
    }

    return {
      statModifiers: [{ stat: highestStat, value: reduceAmount, isBase: true }],
      skipDefault: true,
      description: `${highestStat} giảm xuống 1, nhận thêm 2 Char Dev (Blessed by Chaos)`,
    };
  },
  "Reduce highest base stat to 1, gain 2 Char Devs",
);

/**
 * True Heir of the Emirate - +1 All nếu có Archetype🍀, +1 All nếu có Unique Weapon🍀
 */
registerImmediateHandler(
  "true_heir_emirate_check",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const { character } = ctx;
    const mods: ImmediateHandlerResult["statModifiers"] = [];
    let desc = "True Heir of the Emirate:";

    // Check for Archetype with 🍀
    const archetypes: string[] =
      (character as any).archetypes?.map((a: any) =>
        typeof a === "string" ? a : a.name,
      ) || [];
    const hasLuckyArchetype = archetypes.some((a) => a.includes("🍀"));
    if (hasLuckyArchetype) {
      for (const stat of STAT_NAMES) {
        mods.push({ stat, value: 1 });
      }
      desc += " +1 All (Archetype🍀)";
    }

    // Check for Unique Weapon with 🍀
    const weapons: any[] = character.weapons || [];
    const hasLuckyWeapon = weapons.some((w) => {
      const wName = typeof w === "string" ? w : w.name;
      return wName && wName.includes("🍀");
    });
    if (hasLuckyWeapon) {
      for (const stat of STAT_NAMES) {
        mods.push({ stat, value: 1 });
      }
      desc += " +1 All (Unique Weapon🍀)";
    }

    if (mods.length === 0) {
      return {
        skipDefault: true,
        description:
          "True Heir of the Emirate: không có Archetype🍀 hay Unique Weapon🍀",
      };
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: desc,
    };
  },
  "+1 all stats if has 🍀 Archetype, +1 all if has 🍀 Unique Weapon",
);

/**
 * Nghe Bài thú tội - 50% Braindead, 50% Seeking Wisdom
 */
registerImmediateHandler(
  "nghe_bai_thu_toi_50_50",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        '50% nhận Char Dev "Braindead", 50% nhận Char Dev "Seeking Wisdom" (Nghe Bài thú tội)',
    };
  },
  "50% chance Braindead, 50% Seeking Wisdom Char Dev",
);

/**
 * Kinda Homeless - Rời khỏi House nhưng giữ lại toàn bộ những thứ đã nhận
 */
registerImmediateHandler(
  "kinda_homeless_leave_house",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Rời khỏi House nhưng vẫn giữ lại tất cả những gì đã nhận (Kinda Homeless)",
    };
  },
  "Leave House but keep all items received from it",
);

/**
 * Become a Power Ranger - Setup cho Power Ranger
 */
registerImmediateHandler(
  "become_power_ranger_setup",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Gia nhập Power Ranger Wheel. Không nhận PvP Rewards, không có vòng PvE. Sau combat thắng, all Rangers +1 random stat.",
    };
  },
  "Join the Power Ranger Wheel with special rules",
);

/**
 * Back to Basics - Mất tất cả Power, không thể nhận Power
 */
registerImmediateHandler(
  "back_to_basics_remove_powers",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Mất tất cả Power và không thể nhận Power mới (Back to Basics)",
    };
  },
  "Remove all Powers, cannot gain new Powers",
);

/**
 * SVKS - Cướp tất cả hiệu ứng PvP Rewards của 1 người còn sống ngẫu nhiên
 */
registerImmediateHandler(
  "svks_steal_pvp_rewards",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Cướp tất cả hiệu ứng PvP Rewards từ 1 người còn sống ngẫu nhiên (SVKS)",
    };
  },
  "Steal all PvP Reward effects from a random alive player",
);

/**
 * MrBeast - Sau Combat thắng: Tặng 1 Gear cho 5 người, nếu không có Gear thì -5 stat để +1 cho 5 người
 */
registerImmediateHandler(
  "mrbeast_gift_gear",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Sau combat thắng: Quay 5 người và tặng 1 Gear. Nếu không có Gear: -5 stats để +1 cho 5 người (MrBeast)",
    };
  },
  "After win: gift gear to 5 random players or -5 stats to +1 for 5 players",
);

/**
 * Chuyện Bộ Tộc - Bản thân và người cùng gia tộc nhận +1 All Base Stats
 */
// registerImmediateHandler();
// "chuyen_bo_toc_house_bonus",
// (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
//   const { character, allCharacters } = ctx;

//   // Get character's active houses
//   const myHouses: string[] = (character.houses || [])
//     .filter((h) => !h.isLost)
//     .map((h) => h.name);

//   if (myHouses.length === 0) {
//     return {
//       skipDefault: true,
//       description: '"Chuyện Bộ Tộc": không có House',
//     };
//   }

//   // Apply +1 all base stats to self
//   const mods: ImmediateHandlerResult["statModifiers"] = [];
//   for (const stat of STAT_NAMES) {
//     mods.push({ stat, value: 1, isBase: true });
//   }

//   const houseName = myHouses[0];
//   const housemates = allCharacters
//     ? allCharacters
//         .filter((c) => {
//           if (c.no === character.no) return false;
//           return (c.houses || []).some(
//             (h) => !h.isLost && h.name === houseName,
//           );
//         })
//         .map((c) => c.name)
//         .join(", ")
//     : "N/A";

//   return {
//     statModifiers: mods,
//     skipDefault: true,
//     description: `+1 All Base Stats cho bản thân và đồng đội House (${houseName}): ${housemates} ("Chuyện Bộ Tộc")`,
//   };
// },
// "+1 all base stats for self and all housemates (once per house per season)",

/**
 * Cơ cấu - Gia nhập tổ đội Raid Boss có nhiều người nhất mà chưa đầy
 */
registerImmediateHandler(
  "co_cau_join_raid_boss",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Gia nhập tổ đội Raid Boss có nhiều người nhất mà chưa đầy (Cơ cấu)",
    };
  },
  "Join the largest non-full Raid Boss team",
);

/**
 * Haru Urara round 32 check - +3 all stats nếu còn sống tới vòng 32 (net +2 since base is -1)
 */
registerImmediateHandler(
  "haru_urara_round_32_check",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const { character } = ctx;
    // Check if character has survived to round 32 (pvpWins-based or bracket info)
    const pvpWins =
      (character as any).pvpWins ?? (character as any).tournament?.pvpWins ?? 0;

    // Round 32 in a 256-player bracket = roughly 3 wins (256 → 128 → 64 → 32)
    const hasReachedRound32 = pvpWins >= 3;

    if (!hasReachedRound32) {
      return {
        skipDefault: true,
        description: "Haru Urara: chưa tới vòng 32 (chưa kích hoạt)",
      };
    }

    const mods: ImmediateHandlerResult["statModifiers"] = [];
    for (const stat of STAT_NAMES) {
      mods.push({ stat, value: 3 });
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: "+3 All Stats (Haru Urara - đã đến vòng 32, net +2)",
    };
  },
  "+3 all stats if survived to round 32 (net +2 after initial -1)",
);

/**
 * Nagi - Nhận thêm 2 Char Dev ngẫu nhiên khi quay vòng Char Dev
 */
registerImmediateHandler(
  "nagi_extra_char_dev",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Nhận thêm 2 Char Dev ngẫu nhiên khi quay Char Dev wheel (Nagi)",
    };
  },
  "Gain 2 extra random Char Devs when spinning Char Dev wheel",
);

/**
 * Tokai Teio - Gấp đôi Base Speed khi dùng nhạc cụ làm vũ khí
 */
registerImmediateHandler(
  "tokai_teio_instrument_check",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const { character, baseStats } = ctx;

    const INSTRUMENT_WEAPONS = [
      "Bagpipe",
      "Drums",
      "Flute",
      "Guitar",
      "Violin",
      "Trumpet",
      "Piano",
      "Harp",
      "Lute",
      "Saxophone",
      "Bass",
      "Cello",
    ];

    const weapons: any[] = character.weapons || [];
    const hasInstrument = weapons.some((w) => {
      const wName = typeof w === "string" ? w : w.name;
      return (
        wName &&
        INSTRUMENT_WEAPONS.some((inst) =>
          wName.toLowerCase().includes(inst.toLowerCase()),
        )
      );
    });

    if (!hasInstrument) {
      return {
        skipDefault: true,
        description: "Tokai Teio: không có nhạc cụ, không kích hoạt",
      };
    }

    const currentSpeed = baseStats.speed ?? 0;
    const doubleAmount = currentSpeed; // Add currentSpeed to double it

    return {
      statModifiers: [{ stat: "speed", value: doubleAmount, isBase: true }],
      skipDefault: true,
      description: `Gấp đôi Base Speed (${currentSpeed} → ${currentSpeed * 2}) khi dùng nhạc cụ (Tokai Teio)`,
    };
  },
  "Double Base Speed when using a musical instrument as weapon",
);

/**
 * Rice Shower - +1 all stats ở nhánh thua, hết hiệu lực khi tới chung kết
 */
registerImmediateHandler(
  "rice_shower_not_finals",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const { character } = ctx;
    const bracket = (character as any).tournament?.bracket ?? "";
    const isFinals = (character as any).tournament?.isFinals ?? false;

    const isLoserBracket = bracket === "loser" || bracket === "losers";

    if (!isLoserBracket || isFinals) {
      return {
        skipDefault: true,
        description: "Rice Shower: không ở nhánh thua hoặc đã tới chung kết",
      };
    }

    const mods: ImmediateHandlerResult["statModifiers"] = [];
    for (const stat of STAT_NAMES) {
      mods.push({ stat, value: 1 });
    }

    return {
      statModifiers: mods,
      skipDefault: true,
      description: "+1 All Stats (Rice Shower - nhánh thua)",
    };
  },
  "+1 all stats in loser bracket, disabled in finals",
);

/**
 * Inversion - Đảo ngược tất cả base stat (11 - base).
 */
// registerImmediateHandler(
//   'inversion_all_base_stats',
//   (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
//     const mods = STAT_NAMES.map((stat) => {
//       const baseVal = ctx.baseStats[stat] ?? 0;
//       const invertedVal = 11 - baseVal;
//       return { stat, value: invertedVal - baseVal, isBase: true as const };
//     });
//     return {
//       statModifiers: mods,
//       skipDefault: true,
//       description: 'Inversion: Đảo ngược tất cả base stat (11 - base)',
//     };
//   },
//   'Invert all base stats (11 - base)'
// );

/**
 * Final Reserves round 16 - Loại bỏ hiệu ứng và nhận 2 Power khi đến vòng 16 nhánh thua.
 */
registerImmediateHandler(
  "final_reserves_round_16",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Final Reserves: Vòng 16 nhánh thua → loại bỏ hiệu ứng, nhận 2 Power ngẫu nhiên",
    };
  },
  "At loser round 16: remove effect and gain 2 random Powers",
);

/**
 * Fate's Trick - 50% nhân đôi Base Stat thấp nhất, 50% chia đôi stat cao nhất.
 */
registerImmediateHandler(
  "fates_trick_50_50",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const roll = Math.random();

    if (roll < 0.5) {
      // 50%: double lowest base stat
      let lowestStat: StatName = "strength";
      let lowestVal = ctx.baseStats.strength ?? 0;
      for (const stat of STAT_NAMES) {
        if ((ctx.baseStats[stat] ?? 0) < lowestVal) {
          lowestVal = ctx.baseStats[stat] ?? 0;
          lowestStat = stat;
        }
      }
      return {
        statModifiers: [{ stat: lowestStat, value: lowestVal, isBase: true }],
        skipDefault: true,
        description: `Fate's Trick: Nhân đôi ${lowestStat} (${lowestVal} → ${lowestVal * 2})`,
      };
    } else {
      // 50%: halve highest stat
      let highestStat: StatName = "strength";
      let highestVal = ctx.baseStats.strength ?? 0;
      for (const stat of STAT_NAMES) {
        if ((ctx.baseStats[stat] ?? 0) > highestVal) {
          highestVal = ctx.baseStats[stat] ?? 0;
          highestStat = stat;
        }
      }
      const halved = Math.ceil(highestVal / 2);
      return {
        statModifiers: [
          { stat: highestStat, value: -(highestVal - halved), isBase: true },
        ],
        skipDefault: true,
        description: `Fate's Trick: Chia đôi ${highestStat} (${highestVal} → ${halved})`,
      };
    }
  },
  "50% double lowest base stat, 50% halve highest stat",
);

/**
 * Overcome the Habits - +1 stat thấp nhất per Quirk (based on Base Stats).
 */
registerImmediateHandler(
  "overcome_habits_per_quirk",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const quirkCount = ((ctx.character as any).quirks || []).filter(
      (q: any) => !q.isLost,
    ).length;
    if (quirkCount === 0) {
      return {
        skipDefault: true,
        description: "Overcome the Habits: Không có Quirk",
      };
    }

    let lowestStat: StatName = "strength";
    let lowestVal = ctx.baseStats.strength ?? 0;
    for (const stat of STAT_NAMES) {
      if ((ctx.baseStats[stat] ?? 0) < lowestVal) {
        lowestVal = ctx.baseStats[stat] ?? 0;
        lowestStat = stat;
      }
    }

    return {
      statModifiers: [{ stat: lowestStat, value: quirkCount }],
      skipDefault: true,
      description: `Overcome the Habits: ${quirkCount} Quirk → +${quirkCount} ${lowestStat} (stat thấp nhất)`,
    };
  },
  "+1 lowest stat per Quirk (Overcome the Habits)",
);

/**
 * W Speed - +1 all other stats per 5 Base Speed.
 */
registerImmediateHandler(
  "w_speed_per_5_base",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const baseSpeed = ctx.baseStats.speed ?? 0;
    const bonus = Math.floor(baseSpeed / 5);
    if (bonus === 0) {
      return {
        skipDefault: true,
        description: `W Speed: Base Speed ${baseSpeed} < 5, không nhận bonus`,
      };
    }
    const mods = STAT_NAMES.filter((s) => s !== "speed").map((stat) => ({
      stat,
      value: bonus,
    }));
    return {
      statModifiers: mods,
      skipDefault: true,
      description: `W Speed: +${bonus} vào tất cả chỉ số còn lại (${baseSpeed} Base Speed / 5)`,
    };
  },
  "+1 all other stats per 5 Base Speed (W Speed)",
);

/**
 * Mad Scientist - Trước Combat: Nhận ngẫu nhiên hiệu ứng Shrinking hoặc Enlarging.
 */
registerImmediateHandler(
  "mad_scientist_random_size",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const isEnlarging = Math.random() < 0.5;
    return {
      skipDefault: true,
      description: `Mad Scientist: Trước combat nhận hiệu ứng "${isEnlarging ? "Enlarging" : "Shrinking"}" (chỉ trong combat đó)`,
    };
  },
  "Before combat: randomly apply Shrinking or Enlarging effect",
);

/**
 * Metamorphosis - Nhận ngẫu nhiên 1 trong 6: +1 Str, +7 Spd, +7 Dura, +0 IQ, +1 BIQ, +3 MA.
 */
registerImmediateHandler(
  "metamorphosis_random_stat",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const options: Array<{ stat: StatName; value: number }> = [
      { stat: "strength", value: 1 },
      { stat: "speed", value: 7 },
      { stat: "durability", value: 7 },
      { stat: "iq", value: 0 },
      { stat: "biq", value: 1 },
      { stat: "ma", value: 3 },
    ];
    const chosen = options[Math.floor(Math.random() * options.length)];
    if (chosen.value === 0) {
      return {
        skipDefault: true,
        description: "Metamorphosis: Quay ra +0 IQ (không có thay đổi)",
      };
    }
    return {
      statModifiers: [chosen],
      skipDefault: true,
      description: `Metamorphosis: +${chosen.value} ${chosen.stat}`,
    };
  },
  "Randomly gain one of: +1 Str, +7 Spd, +7 Dura, +0 IQ, +1 BIQ, +3 MA",
);

/**
 * 100 Girlfriends - +1 stat thấp nhất per Lover (triggered after_combat).
 */
registerImmediateHandler(
  "100_girlfriends_stat_bonus",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const lover = ctx.character.lover as any;
    let loverCount = 0;
    if (lover) {
      if (Array.isArray(lover))
        loverCount = lover.filter((l: any) => !l.isLost).length;
      else if (typeof lover === "object" && !lover.isLost) loverCount = 1;
      else if (typeof lover === "string") loverCount = 1;
    }
    if (loverCount === 0) {
      return {
        skipDefault: true,
        description: "100 Girlfriends: Chưa có Lover",
      };
    }

    let lowestStat: StatName = "strength";
    let lowestVal = ctx.currentStats.strength;
    for (const stat of STAT_NAMES) {
      if (ctx.currentStats[stat] < lowestVal) {
        lowestVal = ctx.currentStats[stat];
        lowestStat = stat;
      }
    }
    return {
      statModifiers: [{ stat: lowestStat, value: loverCount }],
      skipDefault: true,
      description: `100 Girlfriends: ${loverCount} Lover → +${loverCount} ${lowestStat}`,
    };
  },
  "+1 lowest stat per Lover (100 Girlfriends)",
);

/**
 * Mang Bàn Chân Này Đi Dạo Phố - Toàn bộ Stats cố định là 1.
 */
registerImmediateHandler(
  "mang_ban_chan_stats_1",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const mods = STAT_NAMES.map((stat) => {
      const currentVal = ctx.baseStats[stat] ?? 0;
      return { stat, value: 1 - currentVal, isBase: true as const };
    });
    return {
      statModifiers: mods,
      skipDefault: true,
      description: "Mang Bàn Chân Này Đi Dạo Phố: Tất cả Base Stats = 1",
    };
  },
  "Set all base stats to 1 (Mang Bàn Chân Này Đi Dạo Phố)",
);

/**
 * Ascended - 2 Stats cao nhất được +4.
 */
registerImmediateHandler(
  "ascended_top_2_stats",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const sorted = [...STAT_NAMES].sort(
      (a, b) => (ctx.currentStats[b] ?? 0) - (ctx.currentStats[a] ?? 0),
    );
    const [top1, top2] = sorted;
    return {
      statModifiers: [
        { stat: top1, value: 4 },
        { stat: top2, value: 4 },
      ],
      skipDefault: true,
      description: `Ascended: +4 ${top1}, +4 ${top2} (2 stats cao nhất)`,
    };
  },
  "+4 to the 2 highest stats (Ascended)",
);

export function registerCharDevHandlers(): void {
  console.log("CharDev handlers registered");
}
