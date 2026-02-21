/**
 * Gear-based Immediate Handlers
 *
 * Handlers cho các Gear effects.
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
// GOLDEN COIN EFFECTS
// ============================================================================

/**
 * Golden Coin - Starting point bonus
 */
registerImmediateHandler(
  "golden_coin_starting_point",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat effect
    return {
      skipDefault: true,
      description: "+1 starting point (Golden Coin)",
    };
  },
  "+1 starting point",
);


// ============================================================================
// CUỘN KHĂN GIẤY (Tissue Roll)
// ============================================================================

/**
 * Cuộn khăn giấy - Conditional stat bonus based on Lover status
 * If no Lover: +1 Durability
 * If has Lover: +1 Speed
 */
registerImmediateHandler(
  "cuon_khan_giay_lover_check",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const hasLover = ctx.character.lover && ctx.character.lover.length > 0;

    if (hasLover) {
      return {
        statModifiers: [{ stat: "speed", value: 1 }],
        skipDefault: true,
        description: "+1 Speed (Cuộn khăn giấy - có Lover)",
      };
    } else {
      return {
        statModifiers: [{ stat: "durability", value: 1 }],
        skipDefault: true,
        description: "+1 Durability (Cuộn khăn giấy - không có Lover)",
      };
    }
  },
  "Conditional stat based on Lover status",
);

// ============================================================================
// KẸO + ỚT COMBO
// ============================================================================

/**
 * Kẹo + Ớt combo - If character has both Kẹo and Ớt, +1 All Stats
 */
registerImmediateHandler(
  "keo_ot_combo",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Both Kẹo and Ớt call this handler — only apply once (from Kẹo) to avoid double bonus
    // Use startsWith because source name may include annotations like "Kẹo (Từ PvE)"
    if (!ctx.source.name.startsWith("Kẹo")) {
      return { skipDefault: true };
    }

    const gear = ctx.character.gear;
    const allGear = [
      ...(gear?.normalGear || []),
      ...(gear?.legacyGear || []),
    ].filter((g) => !g.isLost);

    // Use startsWith to match gear names with annotations like "Ớt (Từ Storage Room Key)"
    const hasKeo = allGear.some((g) => g.name.startsWith("Kẹo"));
    const hasOt = allGear.some((g) => g.name.startsWith("Ớt"));

    if (hasKeo && hasOt) {
      return {
        statModifiers: STAT_NAMES.map((stat) => ({ stat, value: 1 })),
        skipDefault: true,
        description: "Kẹo + Ớt",
      };
    }

    return { skipDefault: true };
  },
  "+1 All Stats if has both Kẹo and Ớt",
);

/**
 * Creator's Cat Ring - Nhận Creator's Favor 1-3 lần, mỗi lần +1 all stats
 * Reads subEffects from gear data (parsed from "-> +1 all stats" lines)
 */
registerImmediateHandler(
  'creator_cat_ring_favor',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const gear = ctx.character.gear;
    const allGear = [
      ...(gear?.normalGear || []),
      ...(gear?.legacyGear || []),
    ].filter((g) => !g.isLost);

    const ring = allGear.find((g) => g.name.startsWith("Creator's Cat Ring"));
    if (!ring) return { skipDefault: true };

    // Count "+1 all stats" sub-effects
    const favorCount = ring.subEffects?.filter((e) =>
      e.toLowerCase().includes('+1 all stats')
    ).length || 0;

    if (favorCount > 0) {
      return {
        statModifiers: STAT_NAMES.map((stat) => ({ stat, value: favorCount })),
        skipDefault: true,
        description: `Creator's Favor x${favorCount}`,
      };
    }

    return { skipDefault: true };
  },
  "Creator's Cat Ring: +1 All Stats per Creator's Favor"
);

// ============================================================================
// COOKING SET COMBO (Baguette + Frying Pan + Spatula)
// ============================================================================

/**
 * Cooking Set Bonus - If character has all 3: Baguette, Frying Pan, Spatula → +2 all stats
 */
registerImmediateHandler(
  "cooking_set_bonus",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Only apply once (from Baguette) to avoid triple bonus
    if (!ctx.source.name.startsWith("Baguette")) {
      return { skipDefault: true };
    }

    const gear = ctx.character.gear;
    const allGear = [
      ...(gear?.normalGear || []),
      ...(gear?.legacyGear || []),
    ].filter((g) => !g.isLost);

    const hasBaguette = allGear.some((g) => g.name.startsWith("Baguette"));
    const hasFryingPan = allGear.some((g) => g.name.startsWith("Frying Pan"));
    const hasSpatula = allGear.some((g) => g.name.startsWith("Spatula"));

    if (hasBaguette && hasFryingPan && hasSpatula) {
      return {
        statModifiers: STAT_NAMES.map((stat) => ({ stat, value: 2 })),
        skipDefault: true,
        description: "Bộ Nấu Ăn (Baguette + Frying Pan + Spatula): +2 all stats",
      };
    }

    return { skipDefault: true };
  },
  "+2 All Stats if has Baguette + Frying Pan + Spatula",
);

// ============================================================================
// MÌ TÔM + BÒ KHÔ + RADIO COMBO
// ============================================================================

/**
 * Mì Tôm + Bò Khô + Radio combo - If has all 3 → grant Char Dev "Mang Bàn Chân Này đi Dạo"
 */
registerImmediateHandler(
  "mi_tom_bo_kho_radio_combo",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Only apply once (from Mì Tôm)
    if (!ctx.source.name.startsWith("Mì Tôm")) {
      return { skipDefault: true };
    }

    const gear = ctx.character.gear;
    const allGear = [
      ...(gear?.normalGear || []),
      ...(gear?.legacyGear || []),
    ].filter((g) => !g.isLost);

    const hasMiTom = allGear.some((g) => g.name.startsWith("Mì Tôm"));
    const hasBoKho = allGear.some((g) => g.name.startsWith("Bò Khô"));
    const hasRadio = allGear.some((g) => g.name.startsWith("Radio"));

    if (hasMiTom && hasBoKho && hasRadio) {
      return {
        skipDefault: true,
        description: 'Mì Tôm + Bò Khô + Radio: Nhận Char Dev "Mang Bàn Chân Này đi Dạo"',
      };
    }

    return { skipDefault: true };
  },
  'Grant Char Dev "Mang Bàn Chân Này đi Dạo" if has all 3',
);

// ============================================================================
// SOAP + ANCIENT PROTECTOR SYNERGY
// ============================================================================

/**
 * Soap - Bạn sẽ không cần phải quay lại khả năng sử dụng của "Ancient Protector".
 */
registerImmediateHandler(
  "soap_ancient_protector_synergy",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Soap: Ancient Protector luôn hoạt động (không cần quay lại)',
    };
  },
  "Ancient Protector always active with Soap",
);

// ============================================================================
// XƯƠNG SỐNG LƯỠI - Round 32 Power grant
// ============================================================================

/**
 * Xương sống lưỡi - Khi vào vòng 32, mất gear → nhận 1 Power.
 */
registerImmediateHandler(
  "xuong_song_luoi_round_32",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Xương sống lưỡi: Khi vào vòng 32, mất gear để nhận 1 Power',
    };
  },
  "Sacrifice gear at round 32 for 1 Power",
);

// ============================================================================
// SOUL OF THE LAZY SPIRIT - Invert 3 random stats
// ============================================================================

/**
 * Soul of the Lazy Spirit - 3 chỉ số ngẫu nhiên bị Inversion.
 */
registerImmediateHandler(
  "lazy_spirit_inversion",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Pick 3 random stats to invert
    const shuffled = [...STAT_NAMES].sort(() => Math.random() - 0.5);
    const toInvert = shuffled.slice(0, 3);

    const mods = toInvert.map((stat) => {
      const baseVal = ctx.baseStats[stat];
      // Inversion: 11 - base (for range 1-10)
      const invertedVal = 11 - baseVal;
      return { stat, value: invertedVal - baseVal, isBase: true as const };
    });

    return {
      statModifiers: mods,
      skipDefault: true,
      description: `Soul of the Lazy Spirit: Inversion ${toInvert.join(', ')}`,
    };
  },
  "Invert 3 random base stats",
);

// ============================================================================
// HUMAN NPC'S AXE - +2 all stats if NPC
// ============================================================================

/**
 * Human NPC's Axe - +2 all stat khi bạn là NPC.
 */
registerImmediateHandler(
  "human_npc_axe_bonus",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const isNPC = (ctx.character as any).isNPC || false;
    if (isNPC) {
      return {
        statModifiers: STAT_NAMES.map((stat) => ({ stat, value: 2 })),
        skipDefault: true,
        description: "Human NPC's Axe: +2 all stats (NPC)",
      };
    }
    return { skipDefault: true };
  },
  "+2 all stats if character is NPC",
);

// ============================================================================
// GOD OF WAR'S ENTRY TICKET - Make love with 1 race
// ============================================================================

/**
 * God of War's Entry Ticket - "Make love" với 1 tộc.
 * Nhận +2 stat thấp nhất khi đối đầu tộc đó (combat handler).
 */
registerImmediateHandler(
  "god_of_war_make_love_race",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'God of War: "Make love" với 1 tộc. +2 stat thấp nhất khi đối đầu tộc đó',
    };
  },
  "Mark a race for combat bonus",
);

// ============================================================================
// HONORED GOBLIN'S SCROLL - Substitute for first loser
// ============================================================================

/**
 * Honored Goblin's Scroll - Bạn sẽ đánh hộ cho người đầu tiên thua trận ở 3 vòng đầu.
 */
registerImmediateHandler(
  "honored_goblin_substitute",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Honored Goblin's Scroll: Đánh hộ cho người thua đầu tiên ở 3 vòng đầu",
    };
  },
  "Substitute for first loser in first 3 rounds",
);

// ============================================================================
// STELLARON HUNTER'S MEMBER CARD
// ============================================================================

/**
 * Stellaron Hunter's Member Card - Kí bởi 1 trong 5 thành viên Stellaron Hunters.
 */
registerImmediateHandler(
  "stellaron_hunter_card",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const members = ['Kafka', 'Silver Wolf', 'Blade', 'Firefly', 'Elio'];
    const member = members[Math.floor(Math.random() * members.length)];

    return {
      skipDefault: true,
      description: `Stellaron Hunter's Card: Signed by ${member}`,
    };
  },
  "Random Stellaron Hunter member signature",
);

// ============================================================================
// WEAKEST ANGEL'S WILL - Powers per base stat = 1
// ============================================================================

/**
 * Weakest Angel's Will - Nhận 2 Power với mỗi Stats có Base = 1.
 */
registerImmediateHandler(
  "weakest_angel_power_per_base_1",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    let count = 0;
    for (const stat of STAT_NAMES) {
      if (ctx.baseStats[stat] === 1) count++;
    }

    if (count > 0) {
      return {
        skipDefault: true,
        description: `Weakest Angel's Will: ${count} stat(s) có base 1 → nhận ${count * 2} Power`,
      };
    }

    return { skipDefault: true };
  },
  "Grant 2 Powers per base stat = 1",
);

// ============================================================================
// ANCIENT LADDER - Double Sin effects for Demon
// ============================================================================

/**
 * The Ancient Ladder - Gấp đôi hiệu ứng Sin nếu là Demon.
 */
registerImmediateHandler(
  "ancient_ladder_demon_sin",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const race = ctx.character.race?.race || '';
    if (race === 'Demon') {
      return {
        skipDefault: true,
        description: 'The Ancient Ladder: Gấp đôi hiệu ứng Sin (Demon)',
      };
    }
    return { skipDefault: true };
  },
  "Double Sin effects for Demon race",
);

// ============================================================================
// ANGEL'S FINGER BONE - Invert all base stats
// ============================================================================

/**
 * The Angel's Finger Bone - Đảo ngược tất cả base stat.
 */
registerImmediateHandler(
  "angel_finger_bone_invert",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const mods = STAT_NAMES.map((stat) => {
      const baseVal = ctx.baseStats[stat];
      const invertedVal = 11 - baseVal;
      return { stat, value: invertedVal - baseVal, isBase: true as const };
    });

    return {
      statModifiers: mods,
      skipDefault: true,
      description: "The Angel's Finger Bone: Đảo ngược tất cả base stats",
    };
  },
  "Invert all base stats (11 - base)",
);

// ============================================================================
// RAGNAROK'S COBRA - Kill a random God
// ============================================================================

/**
 * Ragnarok's Cobra - Giết 1 vị thần ngẫu nhiên sau khi quay đủ player.
 */
registerImmediateHandler(
  "ragnarok_cobra_kill_god",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Ragnarok's Cobra: Giết 1 vị thần ngẫu nhiên",
    };
  },
  "Kill a random God race player",
);

// ============================================================================
// YAMAKUNSON'S WANTED POSTER - Bounty on random player
// ============================================================================

/**
 * Yamakunson's Wanted Poster - Quay ngẫu nhiên 1 người, khi chết nhận 36k.
 */
registerImmediateHandler(
  "yamakunson_bounty",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Yamakunson's Wanted Poster: Quay 1 mục tiêu, khi mục tiêu chết nhận 36k",
    };
  },
  "Bounty on random player - 36k reward on death",
);

// so_tay_iq_bonus is a COMBAT handler → see combat/gear-combat-handlers.ts

export function registerGearHandlers(): void {
  console.log("Gear handlers registered");
}
