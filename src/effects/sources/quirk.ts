/**
 * Quirk — Effect Definitions + Immediate Handlers + Combat Handlers
 *
 * Gộp từ:
 *   - src/effects/data/quirks.ts
 *   - src/effects/handlers/immediate/quirk-handlers.ts
 *   - src/effects/handlers/combat/quirk-combat-handlers.ts
 *
 * Nguồn: wheelofmultiverse-ss3.xlsx - Sheet "Quirk"
 */

import { defineEffect } from "../registry";
import { registerImmediateHandler } from "../handlers/registry";
import { registerCombatHandler } from "../handlers/registry";
import type {
  ImmediateHandlerContext,
  ImmediateHandlerResult,
} from "../handlers/types";
import type {
  CombatHandlerContext,
  CombatHandlerResult,
} from "../handlers/types";
import type { StatName } from "../types";

// ============================================================================
// QUIRK EFFECT DEFINITIONS
// ============================================================================

export function registerAllQuirkEffects() {
  // Artisan
  defineEffect("quirk", "Artisan")
    .description("Nhận +2 Gear.")
    .weight(2.38)
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "random",
      grantCount: 2,
      timing: "immediate",
      target: "self",
    })
    .register();

  // Athletic
  defineEffect("quirk", "Athletic")
    .description("+1 Strength và +1 MA.")
    .weight(2.38)
    .addStat("strength", 1)
    .addStat("ma", 1)
    .register();

  // Brave
  defineEffect("quirk", "Brave")
    .description("+1 all stats khi ở nhánh thua.")
    .weight(2.38)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "on_loser_bracket",
      target: "self",
    })
    .register();

  // Dextrous
  defineEffect("quirk", "Dextrous")
    .description("+1 Speed và +1 BIQ.")
    .weight(2.38)
    .addStat("speed", 1)
    .addStat("biq", 1)
    .register();

  // Fast Learner
  defineEffect("quirk", "Fast Learner")
    .description("Sau Combat: 33% học được 1 Power của đối thủ.")
    .weight(2.38)
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      conditions: [{ type: "probability", chance: 33 }],
      customHandler: "fast_learner_copy_power",
    })
    .register();

  // Fit
  defineEffect("quirk", "Fit")
    .description("+2 Strength.")
    .weight(2.38)
    .addStat("strength", 2)
    .register();

  // Graceful
  defineEffect("quirk", "Graceful")
    .description("Nhận 1 Lover, +1 BIQ với mỗi Lover.")
    .weight(2.38)
    .effect({
      type: "grant_lover",
      grantType: "lover",
      grantName: "random",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 1,
      timing: "immediate",
      target: "self",
      customHandler: "graceful_biq_per_lover",
    })
    .register();

  // Resilient
  defineEffect("quirk", "Resilient")
    .description("Sau Combat: 36% +1 vào chỉ số ở round đã thua.")
    .weight(2.38)
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 1,
      timing: "after_combat",
      target: "self",
      conditions: [{ type: "probability", chance: 36 }],
      customHandler: "resilient_stat_from_lost_round",
    })
    .register();

  // Herbalist
  defineEffect("quirk", "Herbalist")
    .description("Sau Combat: Nhận 1 thảo dược.")
    .weight(2.38)
    .effect({
      type: "wheel_grant",
      wheelType: "Thảo Dược",
      timing: "after_combat",
      target: "self",
    })
    .register();

  // Night Owl
  defineEffect("quirk", "Night Owl")
    .description("Sau Combat: Quay vòng 10/90 — 10% nhận -1 all stats.")
    .weight(2.38)
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "night_owl_wheel",
    })
    .register();

  // Clumsy
  defineEffect("quirk", "Clumsy")
    .description("-2 BIQ.")
    .weight(2.38)
    .addStat("biq", -2)
    .register();

  // Cowardly
  defineEffect("quirk", "Cowardly")
    .description("-1 all stats khi ở nhánh thua.")
    .weight(2.38)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -1,
      timing: "on_loser_bracket",
      target: "self",
    })
    .register();

  // Slow Metabolism
  defineEffect("quirk", "Slow Metabolism")
    .description("Speed không thể tăng, chỉ có thể giảm.")
    .weight(2.38)
    .effect({
      type: "immunity",
      immuneTo: ["speed_increase"],
      timing: "immediate",
      target: "self",
    })
    .register();

  // Slow Healer
  defineEffect("quirk", "Slow Healer")
    .description("Sau Combat: -1 Dura.")
    .weight(2.38)
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: -1,
      timing: "after_combat",
      target: "self",
    })
    .register();

  // Lucky
  defineEffect("quirk", "Lucky")
    .description("5% đạt kết quả tối đa khi quay stats/gear/power.")
    .weight(2.38)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "lucky_max_roll",
    })
    .register();

  // Under the Weather
  defineEffect("quirk", "Under the Weather")
    .description("-1 all stats. Sau combat thắng: đổi thành Shining Brightly.")
    .weight(2.38)
    .addAllStats(-1)
    .effect({
      type: "custom",
      timing: "after_combat_win",
      target: "self",
      customHandler: "under_weather_transform",
    })
    .register();

  // Shining Brightly
  defineEffect("quirk", "Shining Brightly")
    .description("+1 all stats. Sau combat thua: đổi thành Under the Weather.")
    .weight(2.38)
    .addAllStats(1)
    .effect({
      type: "custom",
      timing: "after_combat_lose",
      target: "self",
      customHandler: "shining_brightly_transform",
    })
    .register();

  // Compassionate
  defineEffect("quirk", "Compassionate")
    .description("Sau combat thắng: +1 IQ và tặng 1 Gear cho đối thủ.")
    .weight(2.38)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 1,
      timing: "after_combat_win",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "after_combat_win",
      target: "self",
      customHandler: "compassionate_give_gear",
    })
    .register();

  // Independent
  defineEffect("quirk", "Independent")
    .description(
      "Không thuộc House nào. Sau combat: Quay vòng 6 chỉ số, nhận +2 vào chỉ số được chọn.",
    )
    .weight(2.38)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "independent_no_house",
    })
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "independent_random_stat_wheel",
    })
    .register();

  // Open-minded
  defineEffect("quirk", "Open-minded")
    .description("Sau Combat: Quay vòng 33/67 — 33% biến đối thủ thành Lover.")
    .weight(2.38)
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "open_minded_wheel",
    })
    .register();

  // Pure
  defineEffect("quirk", "Pure")
    .description(
      '+1 all stats, 25% nhận "Đai Trinh Tiết". Khi mất trinh (có Lover): -1 all stats.',
    )
    .weight(2.38)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "immediate",
      target: "self",
      conditions: [{ type: "has_lover", negate: true }],
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -1,
      timing: "immediate",
      target: "self",
      conditions: [{ type: "has_lover" }],
    })
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "Đai Trinh Tiết",
      grantCount: 1,
      timing: "immediate",
      target: "self",
      conditions: [{ type: "probability", chance: 25 }],
    })
    .register();

  // Brainrot
  defineEffect("quirk", "Brainrot")
    .description("Không thể nhận PvP Reward.")
    .weight(2.38)
    .effect({
      type: "immunity",
      immuneTo: ["pvp_reward"],
      timing: "immediate",
      target: "self",
    })
    .register();

  // Training Restricted
  defineEffect("quirk", "Training Restricted")
    .description("Không thể combat PvE. +1 all stats.")
    .weight(2.38)
    .addAllStats(1)
    .effect({
      type: "immunity",
      immuneTo: ["pve_combat"],
      timing: "immediate",
      target: "self",
    })
    .register();

  // Lazy
  defineEffect("quirk", "Lazy")
    .description("Sau combat: -1 Str, -1 Speed, +2 IQ.")
    .weight(2.38)
    .effect({
      type: "stat_modifier",
      stat: "strength",
      value: -1,
      timing: "after_combat",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "speed",
      value: -1,
      timing: "after_combat",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 2,
      timing: "after_combat",
      target: "self",
    })
    .register();

  // Progressive
  defineEffect("quirk", "Progressive")
    .description(
      "Sau combat thua: Quay lại stats. Nếu total mới > cũ: +1 all stats.",
    )
    .weight(2.38)
    .effect({
      type: "custom",
      timing: "after_combat_lose",
      target: "self",
      customHandler: "progressive_reroll",
    })
    .register();

  // Artistic
  defineEffect("quirk", "Artistic")
    .description("+2 IQ sau mỗi combat với người dùng nhạc cụ.")
    .weight(2.38)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 2,
      timing: "after_combat",
      target: "self",
      customHandler: "artistic_vs_instrument",
    })
    .register();

  // Charming
  defineEffect("quirk", "Charming")
    .description("Nhận 1 Lover. Mỗi Lover mới phải tặng 1 Power.")
    .weight(2.38)
    .effect({
      type: "grant_lover",
      grantType: "lover",
      grantName: "random",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "charming_steal_power_from_lover",
    })
    .register();

  // Blind
  defineEffect("quirk", "Blind")
    .description(
      "+3 BIQ. Mỗi khi thắng 1 round, quay vòng 15/85 — 15% không nhận điểm round đó.",
    )
    .weight(2.38)
    .addStat("biq", 3)
    .effect({
      type: "custom",
      timing: "on_round_win",
      target: "self",
      customHandler: "blind_no_point",
    })
    .register();

  // Mute
  defineEffect("quirk", "Mute")
    .description(
      "+3 MA. Mỗi khi thua 1 round, quay vòng 10/90 — 10% bị -1 vào chỉ số của round đó.",
    )
    .weight(2.38)
    .addStat("ma", 3)
    .effect({
      type: "custom",
      timing: "on_round_lose",
      target: "self",
      customHandler: "mute_stat_loss",
    })
    .register();

  // Raumanian
  defineEffect("quirk", "Raumanian")
    .description(
      "Trước combat: Quay vòng 36/64 — 36% nhận 1 điểm khởi đầu. Phát nhạc Khúc ca tình Thanh Hóa.",
    )
    .weight(2.38)
    .effect({
      type: "custom",
      timing: "before_combat",
      target: "self",
      customHandler: "raumanian_wheel",
    })
    .register();

  defineEffect("quirk", "Raumanian🍀")
    .description(
      "Trước combat: Quay vòng 36/64 — 36% nhận 1 điểm khởi đầu. 🍀 Phát nhạc Khúc ca tình Thanh Hóa.",
    )
    .weight(2.38)
    .effect({
      type: "custom",
      timing: "before_combat",
      target: "self",
      customHandler: "raumanian_wheel",
    })
    .register();

  // Bloodthirsty
  defineEffect("quirk", "Bloodthirsty")
    .description("+1 MA. Thắng round +2 điểm, thua round mất hết điểm.")
    .weight(2.38)
    .addStat("ma", 1)
    .effect({
      type: "extra_point_on_win",
      points: 1,
      timing: "on_round_win",
      target: "self",
    })
    .effect({
      type: "lose_points_on_lose",
      points: -999,
      timing: "on_round_lose",
      target: "self",
    })
    .register();

  // Cautious
  defineEffect("quirk", "Cautious")
    .description("-2 Speed. Đối thủ không nhận điểm khi thắng round Strength.")
    .weight(2.38)
    .addStat("speed", -2)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "opponent",
      customHandler: "cautious_no_str_point",
    })
    .register();

  // Cluttered Mind
  defineEffect("quirk", "Cluttered Mind")
    .description("Nếu có ≥4 Gear và ≥4 Power: +1 all stats.")
    .weight(2.38)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "immediate",
      target: "self",
      customHandler: "cluttered_mind_check",
    })
    .register();

  // Let me solo her
  defineEffect("quirk", "Let me solo her")
    .description("[PVE] x8 stats để solo boss. Thắng: nhận Archetype Gigachad.")
    .weight(2.38)
    .effect({
      type: "custom",
      timing: "pve_only",
      target: "self",
      customHandler: "let_me_solo_her",
    })
    .register();

  // Generous
  defineEffect("quirk", "Generous")
    .description(
      "Sau combat thắng: Tặng đối thủ PvP Reward. Sau combat thua: +1 Power và +1 lowest stat với mỗi PvP Reward đã tặng.",
    )
    .weight(2.38)
    .effect({
      type: "custom",
      timing: "after_combat_win",
      target: "self",
      customHandler: "generous_give_reward",
    })
    .effect({
      type: "custom",
      timing: "after_combat_lose",
      target: "self",
      customHandler: "generous_receive_bonus",
    })
    .register();

  // Cheater
  defineEffect("quirk", "Cheater")
    .description(
      "Nếu có >1 Lover: +1 all stats. Lover của bạn -2 BIQ. Khi bị loại: Lover được +1 all stats.",
    )
    .weight(2.38)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "immediate",
      target: "self",
      customHandler: "cheater_multi_lover_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: -2,
      timing: "immediate",
      target: "lover",
    })
    .effect({
      type: "custom",
      timing: "on_death",
      target: "self",
      customHandler: "cheater_death_buff_lovers",
    })
    .register();

  // Deaf
  defineEffect("quirk", "Deaf")
    .description(
      "Miễn nhiễm toàn bộ hiệu ứng từ nhạc cụ (bao gồm cả bản thân).",
    )
    .weight(2.38)
    .effect({
      type: "immunity",
      immuneTo: ["instrument_effects"],
      timing: "immediate",
      target: "self",
    })
    .register();

  // Patient
  defineEffect("quirk", "Patient")
    .description(
      "Không có vòng quay Power. Sau combat thắng: Nhận vòng quay Power với kết quả tối đa.",
    )
    .weight(2.38)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "patient_no_power_wheel",
    })
    .effect({
      type: "custom",
      timing: "after_combat_win",
      target: "self",
      customHandler: "patient_max_power_wheel",
    })
    .register();

  // Impatient
  defineEffect("quirk", "Impatient")
    .description(
      "Nhận 2 PvP Rewards ngay. Sau đó không thể nhận PvP Reward bằng cách nào khác.",
    )
    .weight(2.38)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "impatient_instant_rewards",
    })
    .effect({
      type: "immunity",
      immuneTo: ["pvp_reward"],
      timing: "immediate",
      target: "self",
    })
    .register();

  // One Trick Pony
  defineEffect("quirk", "One Trick Pony")
    .description(
      "Trong combat: Quay vòng 6 chỉ số để chọn. Thắng chỉ số đó = 3 điểm; thắng các chỉ số còn lại = 0 điểm.",
    )
    .weight(2.38)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "one_trick_pony_stat_selection",
    })
    .register();

  // Weak-Knee
  defineEffect("quirk", "Weak-Knee")
    .description("Trong combat: Round đầu tiên chiến thắng không nhận điểm.")
    .weight(2.38)
    .effect({
      type: "custom",
      timing: "on_round_win",
      target: "self",
      customHandler: "weak_knee_first_round",
    })
    .register();

  // Cruelty
  defineEffect("quirk", "Cruelty")
    .description(
      "Trong combat: Khi round hòa, quay 50/50 để quyết định ai nhận 1 điểm (thay vì không ai nhận).",
    )
    .weight(2.38)
    .effect({
      type: "custom",
      timing: "on_round_tie",
      target: "self",
      customHandler: "cruelty_tie_coinflip",
    })
    .register();
}

// ============================================================================
// IMMEDIATE HANDLERS
// ============================================================================

const STAT_NAMES: StatName[] = [
  "strength",
  "speed",
  "durability",
  "iq",
  "biq",
  "ma",
];

// Graceful - +1 BIQ với mỗi Lover hiện có
registerImmediateHandler(
  "graceful_biq_per_lover",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const lover = ctx.character.lover;
    let loverCount = 0;
    if (lover) {
      if (Array.isArray(lover)) {
        loverCount = lover.filter((l: any) => !l.isLost).length;
      } else if (typeof lover === "object" && !(lover as any).isLost) {
        loverCount = 1;
      }
    }
    if (loverCount === 0) {
      return {
        skipDefault: true,
        description: "Graceful: chưa có Lover → không nhận bonus BIQ",
      };
    }
    return {
      statModifiers: [{ stat: "biq", value: loverCount }],
      skipDefault: true,
      description: `+${loverCount} BIQ (Graceful - ${loverCount} Lover(s))`,
    };
  },
  "+1 BIQ per Lover (Graceful)",
);

// Lucky - 5% max roll (passive)
registerImmediateHandler(
  "lucky_max_roll",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return { skipDefault: true, description: "5% max roll (passive)" };
  },
  "5% chance for max roll on wheels",
);

// Independent - No house
registerImmediateHandler(
  "independent_no_house",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return { skipDefault: true, description: "Không thuộc House nào" };
  },
  "Cannot join houses",
);

// Cheater - +1 all stats nếu có hơn 1 Lover
// Với mỗi lover bị loại (tournament.status === 'eliminated'): +1 all stats thay cho -2 BIQ
registerImmediateHandler(
  "cheater_multi_lover_check",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const lovers = ctx.character.lover;
    const activeLovers =
      lovers && Array.isArray(lovers) ? lovers.filter((l) => !l.isLost) : [];
    const loverCount = activeLovers.length;

    const mods: Array<{ stat: StatName; value: number }> = [];
    const descParts: string[] = [];

    // +1 all stats nếu có hơn 1 lover
    if (loverCount > 1) {
      STAT_NAMES.forEach((stat) => mods.push({ stat, value: 1 }));
      descParts.push(`+1 All Stats (có ${loverCount} lovers)`);
    }

    // Với mỗi lover bị loại: +1 all stats (thay cho -2 BIQ không còn áp dụng)
    if (ctx.allCharacters && activeLovers.length > 0) {
      const eliminatedLovers: string[] = [];
      for (const loverItem of activeLovers) {
        const loverName = loverItem.name.toLowerCase();
        const loverChar = ctx.allCharacters.find((c) => {
          const u = c.username?.toLowerCase() || "";
          const n = c.name?.toLowerCase() || "";
          return (u && loverName.includes(u)) || (n && loverName.includes(n));
        });
        if (loverChar?.tournament?.status === "eliminated") {
          STAT_NAMES.forEach((stat) => mods.push({ stat, value: 1 }));
          eliminatedLovers.push(loverChar.name);
        }
      }
      if (eliminatedLovers.length > 0) {
        descParts.push(
          `+1 All Stats (lover bị loại: ${eliminatedLovers.join(", ")})`,
        );
      }
    }

    if (mods.length === 0) return { skipDefault: true };
    return {
      statModifiers: mods,
      skipDefault: true,
      description: `Cheater: ${descParts.join("; ")}`,
    };
  },
  "+1 All Stats if more than 1 lover; +1 All Stats per eliminated lover",
);

// Patient - No power wheel initially
registerImmediateHandler(
  "patient_no_power_wheel",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return { skipDefault: true, description: "Không có power wheel ban đầu" };
  },
  "No initial power wheel",
);

// Patient - Max power wheel later (after_combat_win — registered as immediate for context)
registerImmediateHandler(
  "patient_max_power_wheel",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return { skipDefault: true, description: "Power wheel tối đa sau đó" };
  },
  "Max power wheel later",
);

// Impatient - Instant rewards
registerImmediateHandler(
  "impatient_instant_rewards",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return { skipDefault: true, description: "Nhận rewards ngay lập tức" };
  },
  "Receive rewards immediately",
);

// Cluttered Mind - ≥4 Gear và ≥4 Power → +1 all stats
registerImmediateHandler(
  "cluttered_mind_check",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const powerCount = (ctx.character.powers || []).filter(
      (p: any) => !p.isLost,
    ).length;
    const normalGear = (ctx.character.gear?.normalGear || []).filter(
      (g: any) => !g.isLost,
    );
    const legacyGear = (ctx.character.gear?.legacyGear || []).filter(
      (g: any) => !g.isLost,
    );
    const gearCount = normalGear.length + legacyGear.length;
    if (gearCount >= 4 && powerCount >= 4) {
      return {
        statModifiers: STAT_NAMES.map((stat) => ({ stat, value: 1 })),
        skipDefault: true,
        description: `+1 All Stats (Cluttered Mind - ${gearCount} Gear, ${powerCount} Power)`,
      };
    }
    return { skipDefault: true };
  },
  "+1 All Stats if ≥4 Gear and ≥4 Power",
);

// Let Me Solo Her - [PVE Only] x8 stats
registerImmediateHandler(
  "let_me_solo_her",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const mods = STAT_NAMES.map((stat) => ({
      stat,
      value: (ctx.currentStats[stat] ?? 0) * 7,
    }));
    return {
      statModifiers: mods,
      skipDefault: true,
      description:
        "[PVE] x8 tất cả stats để solo Boss (Let Me Solo Her). Thắng → [GM Action] nhận Gigachad",
    };
  },
  "[PVE] x8 all stats to solo boss",
);

// Progressive - Reroll ability (passive note)
registerImmediateHandler(
  "progressive_reroll",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return { skipDefault: true, description: "Có thể reroll" };
  },
  "Can reroll",
);

// Fast Learner - 33% copy power (GM action)
registerImmediateHandler(
  "fast_learner_copy_power",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "[GM Action] Học được 1 Power ngẫu nhiên từ đối thủ",
    };
  },
  "Copy 1 power from opponent (33% - GM action required)",
);

// Resilient - +1 random stat from lost round (fallback)
registerImmediateHandler(
  "resilient_stat_from_lost_round",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const randomStat =
      STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      statModifiers: [{ stat: randomStat, value: 1 }],
      skipDefault: true,
      description: `+1 ${randomStat} (Resilient - stat từ round đã thua)`,
    };
  },
  "+1 to a lost round stat (36% - random stat fallback)",
);

// Under the Weather → Shining Brightly
registerImmediateHandler(
  "under_weather_transform",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        '[GM Action] Đổi quirk "Under the Weather" → "Shining Brightly"',
    };
  },
  "Transform Under the Weather → Shining Brightly after win (GM action required)",
);

// Shining Brightly → Under the Weather
registerImmediateHandler(
  "shining_brightly_transform",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        '[GM Action] Đổi quirk "Shining Brightly" → "Under the Weather"',
    };
  },
  "Transform Shining Brightly → Under the Weather after lose (GM action required)",
);

// Compassionate - Tặng 1 Gear cho đối thủ sau thắng
registerImmediateHandler(
  "compassionate_give_gear",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "[GM Action] Tặng 1 Gear ngẫu nhiên cho đối thủ",
    };
  },
  "Give 1 Gear to opponent after win (GM action required)",
);

// Generous - Give reward after win
registerImmediateHandler(
  "generous_give_reward",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        '[GM Action] Tặng PvP Reward cho đối thủ (tăng counter "rewards_given")',
    };
  },
  "Give PvP Reward to opponent after win (GM action required)",
);

// Generous - Receive bonus after loss
registerImmediateHandler(
  "generous_receive_bonus",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const rewardsGiven = (ctx.character as any).generousRewardsGiven || 0;
    if (rewardsGiven === 0) {
      return {
        skipDefault: true,
        description: "Generous: chưa tặng PvP Reward nào → không nhận bonus",
      };
    }
    let lowestStat: StatName = "strength";
    let lowestValue = ctx.currentStats.strength;
    for (const stat of STAT_NAMES) {
      if (ctx.currentStats[stat] < lowestValue) {
        lowestValue = ctx.currentStats[stat];
        lowestStat = stat;
      }
    }
    return {
      statModifiers: [{ stat: lowestStat, value: rewardsGiven }],
      skipDefault: true,
      description: `+${rewardsGiven} ${lowestStat} (Generous - ${rewardsGiven} reward(s) đã tặng) + [GM Action] +${rewardsGiven} Power wheel`,
    };
  },
  "+1 lowest stat + Power wheel per reward given after lose",
);

// Cheater - On death: buff all lovers
registerImmediateHandler(
  "cheater_death_buff_lovers",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const lovers = ctx.character.lover;
    const loverList: string[] = [];
    if (lovers) {
      if (Array.isArray(lovers)) {
        lovers
          .filter((l: any) => !l.isLost)
          .forEach((l: any) => loverList.push(l.name));
      } else if (typeof lovers === "object" && (lovers as any).name) {
        loverList.push((lovers as any).name);
      }
    }
    if (loverList.length === 0) {
      return {
        skipDefault: true,
        description: "Cheater: không có Lover → không có death buff",
      };
    }
    return {
      skipDefault: true,
      description: `[GM Action] Buff +1 All Stats cho ${loverList.length} Lover(s): ${loverList.join(", ")}`,
    };
  },
  "Buff all lovers +1 All Stats on death (GM action required)",
);

// Charming - Lover tặng 1 Power
registerImmediateHandler(
  "charming_steal_power_from_lover",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const quirkName = ctx.source.name || "";
    if (!ctx.allCharacters || ctx.allCharacters.length === 0) {
      return {
        skipDefault: true,
        description: "Charming: không thể tìm lover (no allCharacters)",
      };
    }
    const loverMatch = quirkName.match(/charming\s*\(([^)]+)\)/i);
    if (!loverMatch) {
      return {
        skipDefault: true,
        description: "Charming: không tìm thấy tên lover trong quirk",
      };
    }
    let loverStr = loverMatch[1]
      .toLowerCase()
      .replace(/\s*\(từ\s+[^)]*\)/gi, "")
      .replace(/\s*,?\s*tặng[:\s].*/gi, "")
      .replace(/\s*-?\s*nhận\s+power.*/gi, "")
      .replace(/\s*-?\s*bú\s+power.*/gi, "")
      .trim();
    const loverChar = ctx.allCharacters.find((c) => {
      const username = c.username?.toLowerCase() || "";
      const name = c.name?.toLowerCase() || "";
      return (
        (username && loverStr.includes(username)) ||
        (name && loverStr.includes(name))
      );
    });
    if (!loverChar) {
      return {
        skipDefault: true,
        description: `Charming: không tìm thấy lover "${loverStr}"`,
      };
    }
    if (/nhận\s+power|tặng/i.test(quirkName)) {
      return {
        skipDefault: true,
        description: `${loverChar.name} đã tặng Power`,
      };
    }
    const selfName = ctx.character?.name?.toLowerCase() || "";
    const selfUsername = ctx.character?.username?.toLowerCase() || "";
    const loverGavePower = (loverChar.powers || []).some((p: any) => {
      if (!p.isLost) return false;
      const pName = (p.name || "").toLowerCase();
      return (
        (selfName && pName.includes(selfName)) ||
        (selfUsername && pName.includes(selfUsername)) ||
        /tặng|charming/i.test(pName)
      );
    });
    if (loverGavePower) {
      return {
        skipDefault: true,
        description: `${loverChar.name} đã tặng Power`,
      };
    }
    const loverPowers = (loverChar.powers || []).filter((p: any) => !p.isLost);
    if (loverPowers.length === 0) {
      return {
        statModifiers: STAT_NAMES.map((stat) => ({ stat, value: 1 })),
        skipDefault: true,
        description: `+1 All Stats (${loverChar.name} không có Power)`,
      };
    }
    return {
      skipDefault: true,
      description: `${loverChar.name} đã tặng Power`,
    };
  },
  "Steal power from lover, +1 all stats if no power",
);

export function registerQuirkHandlers(): void {
  // All handlers registered at module level above.
}

// ============================================================================
// COMBAT HANDLERS
// ============================================================================

// One Trick Pony - 1 stat ngẫu nhiên thắng = 3 điểm, các stat khác thắng = 0
registerCombatHandler(
  "one_trick_pony_stat_selection",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    const chosenStat =
      STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      description: `One Trick Pony: Stat được chọn = ${chosenStat}. Thắng ${chosenStat} → 3 điểm; các stat khác thắng → 0 điểm`,
    };
  },
  "Random 1 stat: win = 3pts; all other stat wins = 0pts",
);

// Blind - 15% không nhận điểm khi thắng 1 round
registerCombatHandler(
  "blind_no_point",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      selfPoints: -1,
      description: "Blind: không nhận điểm round này (15%)",
    };
  },
  "15% lose 1 point on round win (Blind)",
);

// Cautious - Đối thủ không nhận điểm khi thắng round Strength
registerCombatHandler(
  "cautious_no_str_point",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const oppWonStr = ctx.roundResults?.strength === "lose";
    if (!oppWonStr) return { skipDefault: true };
    // Dùng blockOpponentPoint thay vì -1 để tránh trừ điểm khi đối thủ đang 0 điểm
    return {
      blockOpponentPoint: true,
      description: "Cautious: đối thủ không nhận điểm round Strength",
    };
  },
  "Opponent gets 0 points on Strength round win (Cautious)",
);

// Weak-Knee - Round chiến thắng đầu tiên không nhận điểm
registerCombatHandler(
  "weak_knee_first_round",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.self.roundsWon === 0) {
      return {
        selfPoints: -1,
        description: "Weak-Knee: round thắng đầu tiên không nhận điểm",
      };
    }
    return { skipDefault: true };
  },
  "First round win grants 0 points (Weak-Knee)",
);

// Cruelty - Round hòa: 50/50 quyết định ai nhận 1 điểm
registerCombatHandler(
  "cruelty_tie_coinflip",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: "Cruelty: hòa → quay 50/50 để quyết định điểm",
    };
  },
  "On tie: spin wheel decides who gets the point (Cruelty)",
);

// Artistic - Sau combat vs đối thủ dùng nhạc cụ: +2 IQ
registerCombatHandler(
  "artistic_vs_instrument",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const INSTRUMENT_NAMES = [
      "bagpipe",
      "drums",
      "flute",
      "guitar",
      "violin",
      "trumpet",
      "piano",
      "harp",
      "lute",
      "saxophone",
      "bass",
      "cello",
      "harmonica",
      "ukulele",
      "nunchuck",
      "ruan mei",
    ];
    const weapons: any[] = ctx.opponent.weapons || [];
    const hasInstrument = weapons.some((w) => {
      const wName = typeof w === "string" ? w : (w?.name ?? "");
      return INSTRUMENT_NAMES.some((inst) =>
        wName.toLowerCase().includes(inst),
      );
    });
    if (!hasInstrument) {
      return {
        skipDefault: true,
        description: "Artistic: đối thủ không dùng nhạc cụ",
      };
    }
    return {
      selfStatMods: [{ stat: "iq", value: 2 }],
      description: "+2 IQ (Artistic - đối thủ dùng nhạc cụ)",
    };
  },
  "+2 IQ after combat vs opponent with instrument (Artistic)",
);

// Under the Weather - After win: transform to Shining Brightly
registerCombatHandler(
  "under_weather_transform",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description:
        'Under the Weather: Sau thắng → chuyển thành Quirk "Shining Brightly" (xử lý ngoài game)',
    };
  },
  "After combat win: Under the Weather transforms to Shining Brightly quirk",
);

// Generous - After win: give PvP Reward
registerCombatHandler(
  "generous_give_reward",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Generous: Sau thắng → tặng đối thủ 1 PvP Reward (xử lý ngoài game)",
    };
  },
  "After win: give opponent a PvP Reward (Generous)",
);

// Generous - After loss: +1 Power +1 lowest per reward given
registerCombatHandler(
  "generous_receive_bonus",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Generous: Sau thua → +1 Power và +1 stat thấp nhất với mỗi PvP Reward đã tặng (xử lý ngoài game)",
    };
  },
  "After loss: +1 Power +1 lowest stat per PvP Reward previously given (Generous)",
);

// Shining Brightly - After loss: transform to Under the Weather
registerCombatHandler(
  "shining_brightly_transform",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description:
        'Shining Brightly: Sau thua → chuyển thành Quirk "Under the Weather" (xử lý ngoài game)',
    };
  },
  "After combat loss: Shining Brightly transforms to Under the Weather quirk",
);

// Cheater - On death: lovers remove stat penalties and receive +1 all stats
registerCombatHandler(
  "cheater_death_buff_lovers",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const lovers = (ctx.self.character as any)?.lover || [];
    const activeLoverCount = lovers.filter((l: any) => !l.isLost).length;
    if (activeLoverCount === 0) {
      return {
        skipDefault: true,
        description: "Cheater: Không có Lover khi chết",
      };
    }
    return {
      skipDefault: true,
      description: `Cheater: Khi chết → ${activeLoverCount} Lover loại bỏ hiệu ứng trừ chỉ số và nhận +1 all stats (xử lý ngoài game)`,
    };
  },
  "On death: all lovers remove stat penalties and receive +1 all stats (Cheater)",
);

// Patient - After win: max power wheel
registerCombatHandler(
  "patient_max_power_wheel",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Patient: Sau thắng → nhận vòng quay Power với kết quả tối đa (xử lý ngoài game)",
    };
  },
  "After combat win: receive power wheel with maximum result (Patient)",
);

// Fast Learner - 33% copy 1 random power from opponent (xác suất do wheel UI quyết định)
registerCombatHandler(
  "fast_learner_copy_power",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppPowers: string[] = (ctx.opponent.powers || [])
      .map((p: any) => (typeof p === "string" ? p : p?.name))
      .filter(Boolean);
    if (oppPowers.length === 0) {
      return {
        skipDefault: true,
        description: "Fast Learner: Đối thủ không có Power",
      };
    }
    const copiedPower = oppPowers[Math.floor(Math.random() * oppPowers.length)];
    return {
      grantPower: copiedPower,
      description: `Fast Learner: Học được Power "${copiedPower}" từ đối thủ (đối thủ không mất Power)`,
    };
  },
  "33% chance to copy 1 random power from opponent after combat (Fast Learner) — probability decided by wheel UI",
);

// Progressive - After loss: reroll stats
registerCombatHandler(
  "progressive_reroll",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Progressive: Quay lại stats sau thua — so sánh total, nếu cao hơn +1 all (xử lý ngoài game)",
    };
  },
  "After loss: reroll stats; if new total > old total, +1 all stats (Progressive)",
);

// Resilient - After combat: 36% +1 to stat from a round that was lost
registerCombatHandler(
  "resilient_stat_from_lost_round",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const lostStats = STAT_NAMES.filter(
      (stat) => ctx.roundResults?.[stat] === "lose",
    );
    if (lostStats.length === 0) {
      return {
        skipDefault: true,
        description: "Resilient: Không thua round nào → không áp dụng",
      };
    }
    const chosenStat = lostStats[Math.floor(Math.random() * lostStats.length)];
    return {
      selfStatMods: [{ stat: chosenStat, value: 1 }],
      description: `Resilient: 36% → +1 ${chosenStat} (thua round ${chosenStat})`,
    };
  },
  "After combat: 36% +1 to stat from a round that was lost (Resilient)",
);

// Compassionate - After win: give 1 Gear to opponent
registerCombatHandler(
  "compassionate_give_gear",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Compassionate: Sau thắng → tặng 1 Gear cho đối thủ (xử lý ngoài game)",
    };
  },
  "After combat win: give 1 Gear to opponent (Compassionate)",
);

// Let Me Solo Her - PvE only: x8 stats
registerCombatHandler(
  "let_me_solo_her",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.isPvE) return { skipDefault: true };
    return {
      selfStatMods: STAT_NAMES.map((stat) => ({
        stat,
        value: ctx.self.stats[stat] * 7,
      })),
      description:
        "Let me solo her: [PvE] x8 stats để solo boss. Thắng → nhận Archetype Gigachad (xử lý ngoài game)",
    };
  },
  "PvE only: x8 all stats to solo boss; win grants Archetype Gigachad (Let me solo her)",
);

export function registerQuirkCombatHandlers(): void {
  // All handlers registered at module level above.
}
