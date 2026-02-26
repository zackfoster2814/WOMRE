/**
 * Quirk Effects Data
 *
 * Nguồn: wheelofmultiverse-ss3.xlsx - Sheet "Quirk"
 */

import { defineEffect } from "../registry";

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
      stat: "random", // Will be determined by lost round
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
    .description("Không thuộc House nào. Sau combat: Quay vòng 6 chỉ số, nhận +2 vào chỉ số được chọn.")
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
  // Effect (1): +1 all stats khi còn trinh (không có lover)
  // Effect (2): Khi mất trinh (có lover), loại bỏ (1) và -1 all stats
  // => Còn trinh: +1 all | Mất trinh: -1 all
  defineEffect("quirk", "Pure")
    .description(
      '+1 all stats, 25% nhận "Đai Trinh Tiết". Khi mất trinh (có Lover): -1 all stats.',
    )
    .weight(2.38)
    // Còn trinh (không có lover): +1 all stats
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "immediate",
      target: "self",
      conditions: [{ type: "has_lover", negate: true }],
    })
    // Mất trinh (có lover): -1 all stats
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -1,
      timing: "immediate",
      target: "self",
      conditions: [{ type: "has_lover" }],
    })
    // 25% chance grant gear (chỉ define, cần xử lý riêng khi spin)
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
    .description("+3 BIQ. Mỗi khi thắng 1 round, quay vòng 15/85 — 15% không nhận điểm round đó.")
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
    .description("+3 MA. Mỗi khi thua 1 round, quay vòng 10/90 — 10% bị -1 vào chỉ số của round đó.")
    .weight(2.38)
    .addStat("ma", 3)
    .effect({
      type: "custom",
      timing: "on_round_lose",
      target: "self",
      customHandler: "mute_stat_loss",
    })
    .register();

  // Raumanian / Raumanian🍀 (same quirk, different display names)
  defineEffect("quirk", "Raumanian")
    .description("Trước combat: Quay vòng 36/64 — 36% nhận 1 điểm khởi đầu. Phát nhạc Khúc ca tình Thanh Hóa.")
    .weight(2.38)
    .effect({
      type: "custom",
      timing: "before_combat",
      target: "self",
      customHandler: "raumanian_wheel",
    })
    .register();

  defineEffect("quirk", "Raumanian🍀")
    .description("Trước combat: Quay vòng 36/64 — 36% nhận 1 điểm khởi đầu. 🍀 Phát nhạc Khúc ca tình Thanh Hóa.")
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
    .description("+1 MA. Thắng round +1 điểm, thua round mất hết điểm.")
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
      timing: "during_combat",
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
