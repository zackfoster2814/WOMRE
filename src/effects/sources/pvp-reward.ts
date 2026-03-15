/**
 * PvP Reward — Effect Definitions
 *
 * Gộp từ: src/effects/data/pvp-rewards.ts
 * Phần thưởng sau mỗi trận PvP chiến thắng
 */

import { defineEffect } from "../registry";

// ============================================================================
// PVP REWARD EFFECT DEFINITIONS
// ============================================================================

export function registerPvPRewardEffects() {
  defineEffect("pvp_reward", "+1 Strength")
    .description("Nhận +1 Strength")
    .weight(10)
    .addStat("strength", 1)
    .register();

  defineEffect("pvp_reward", "+1 Speed")
    .description("Nhận +1 Speed")
    .weight(10)
    .addStat("speed", 1)
    .register();

  defineEffect("pvp_reward", "+1 Durability")
    .description("Nhận +1 Dura")
    .weight(10)
    .addStat("durability", 1)
    .register();

  defineEffect("pvp_reward", "+1 IQ")
    .description("Nhận +1 IQ")
    .weight(10)
    .addStat("iq", 1)
    .register();

  defineEffect("pvp_reward", "+1 BIQ")
    .description("Nhận +1 BIQ")
    .weight(10)
    .addStat("biq", 1)
    .register();

  defineEffect("pvp_reward", "+1 Martial Arts")
    .description("Nhận +1 Martial Arts")
    .weight(10)
    .addStat("ma", 1)
    .register();

  defineEffect("pvp_reward", "1 Gear")
    .description("Nhận 1 Gear.")
    .weight(10)
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "random",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("pvp_reward", "+2 Stat Thấp Nhất")
    .description("Nhận +2 Stat Thấp Nhất")
    .weight(6)
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 2,
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("pvp_reward", "+2 Stat Cao Nhất")
    .description("Nhận +2 Stat Cao Nhất")
    .weight(6)
    .effect({
      type: "stat_modifier",
      stat: "highest",
      value: 2,
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("pvp_reward", "1 Power")
    .description("Nhận 1 Power")
    .weight(6)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("pvp_reward", "2 Power")
    .description("Nhận 2 Power")
    .weight(2)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 2,
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("pvp_reward", "1 Char Dev")
    .description("Nhận 1 Char Dev")
    .weight(4)
    .effect({
      type: "grant_char_dev",
      grantType: "char_dev",
      grantName: "random",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("pvp_reward", "2 Char Dev")
    .description("Nhận 2 Char Dev")
    .weight(1)
    .effect({
      type: "grant_char_dev",
      grantType: "char_dev",
      grantName: "random",
      grantCount: 2,
      timing: "immediate",
      target: "self",
    })
    .register();

  // +2 Random Stat x3
  defineEffect("pvp_reward", "+2 Random x3")
    .description("Nhận +2 vào Stat ngẫu nhiên 3 lần")
    .weight(0.64)
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 2,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 2,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 2,
      timing: "immediate",
      target: "self",
    })
    .register();

  // +2 Random Stat x6
  defineEffect("pvp_reward", "+2 Random x6")
    .description("Nhận +2 vào Stat ngẫu nhiên 6 lần")
    .weight(0.36)
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 2,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 2,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 2,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 2,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 2,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 2,
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("pvp_reward", "+1 All Stats")
    .description("Nhận +1 all stats")
    .weight(4)
    .addAllStats(1)
    .register();

  // Special/curse — weight 0
  defineEffect("pvp_reward", "Lời Nguyền Địa Ngục")
    .description(
      "Re-spin lại stat cao nhất của bạn và một người còn sống ngẫu nhiên.",
    )
    .weight(3)
    .effect({
      type: "stat_respin",
      stat: "highest",
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "stat_respin",
      stat: "highest",
      timing: "immediate",
      target: "random_player",
    })
    .register();
}
