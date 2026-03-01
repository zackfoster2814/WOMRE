/**
 * Power Effects Data
 *
 * Nguồn: wheelofmultiverse-ss3.xlsx - Sheet "Power"
 */

import { defineEffect } from "../registry";

export function registerAllPowerEffects() {
  // U=ma2 (từ Agnes Tachyon)
  defineEffect("power", "U=ma2")
    .description(
      "Trong combat: Thua round Str: +3 Speed. Thua round Speed: +4 Dura.",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "speed",
      value: 3,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "uma2_str_lose",
    })
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: 4,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "uma2_spd_lose",
    })
    .register();

  // Memory Freeze
  defineEffect("power", "Memory Freeze")
    .description('Sau combat thua: Đối thủ nhận Quirk "Brainrot".')
    .weight(0.78)
    .effect({
      type: "grant_quirk",
      grantType: "quirk",
      grantName: "Brainrot",
      grantCount: 1,
      timing: "after_combat_lose",
      target: "opponent",
    })
    .register();

  // Metamagic
  defineEffect("power", "Metamagic")
    .description("Trong Combat: +1 Điểm ở Round BIQ nếu thắng.")
    .weight(0.78)
    .effect({
      type: "extra_point_on_win",
      points: 1,
      timing: "during_combat",
      target: "self",
      customHandler: "metamagic_biq_round",
    })
    .register();

  // Baldening
  defineEffect("power", "Baldening")
    .description("Debuff: Khiến đối thủ bị rụng hết tóc.")
    .weight(0.78)
    .register();

  // Critical Strike
  defineEffect("power", "Critical Strike")
    .description("Trong Combat: 20% nhận thêm 1 điểm mỗi round thắng.")
    .weight(0.78)
    .effect({
      type: "extra_point_on_win",
      points: 1,
      timing: "on_round_win",
      target: "self",
      conditions: [{ type: "probability", chance: 20 }],
    })
    .register();

  // Evasion
  defineEffect("power", "Evasion")
    .description("Trong Combat: 20% nhận 1 điểm mỗi round thua.")
    .weight(0.78)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "on_round_lose",
      target: "self",
      conditions: [{ type: "probability", chance: 20 }],
    })
    .register();

  // Healing Factor
  defineEffect("power", "Healing Factor")
    .description("Buff: +1 Dura. Sau combat: +1 Dura với mỗi 2 round thua.")
    .weight(0.78)
    .addStat("durability", 1)
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: 1,
      timing: "after_combat",
      target: "self",
      customHandler: "healing_factor_per_2_lost",
    })
    .register();

  // Gourmand
  defineEffect("power", "Gourmand")
    .description("Buff: +4 Durability.")
    .weight(0.78)
    .addStat("durability", 4)
    .register();

  // // Hydrate
  // defineEffect('power', 'Hydrate')
  //   .description('Buff: +4 Durability.')
  //   .weight(0.78)
  //   .addStat('durability', 4)
  //   .register();

  // Lone Wolf
  defineEffect("power", "Lone Wolf")
    .description("+3 Speed. Gặp người cũng có power này: mất power.")
    .weight(0.78)
    .addStat("speed", 3)
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "lone_wolf_check",
    })
    .register();

  // AIDS
  defineEffect("power", "AIDS")
    .description("Sau Combat: -2 Dura. Lây sang Lover. Không thể xóa bỏ.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: -2,
      timing: "after_combat",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "immediate",
      target: "lover",
      customHandler: "aids_spread_to_lover",
    })
    .effect({
      type: "immunity",
      immuneTo: ["remove_aids"],
      timing: "immediate",
      target: "self",
    })
    .register();

  // Petrification
  defineEffect("power", "Petrification")
    .description("Debuff: Đối thủ -4 Speed.")
    .weight(0.78)
    .debuffOpponent("speed", 4)
    .register();

  // Magma Strike
  defineEffect("power", "Magma Strike")
    .description("Debuff: -2 Dura đối thủ. Sau combat: -1 Dura đối thủ.")
    .weight(0.78)
    .debuffOpponent("durability", 2)
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: -1,
      timing: "after_combat",
      target: "opponent",
    })
    .register();

  // Ice Hammer
  defineEffect("power", "Ice Hammer")
    .description("Buff: +2 Strength. Debuff: -2 Speed đối thủ.")
    .weight(0.78)
    .addStat("strength", 2)
    .debuffOpponent("speed", 2)
    .register();

  // Storm Calling
  defineEffect("power", "Storm Calling")
    .description("Trước Combat: +2 BIQ.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 2,
      timing: "before_combat",
      target: "self",
    })
    .register();

  // Spear of Fire
  defineEffect("power", "Spear of Fire")
    .description("Buff: +2 MA. Nếu dùng vũ khí có 2 Rune: +1 điểm khởi đầu.")
    .weight(0.78)
    .addStat("ma", 2)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "self",
      customHandler: "spear_of_fire_2_rune_check",
    })
    .register();

  // Bonk Bonk Bonk
  defineEffect("power", "Bonk Bonk Bonk")
    .description(
      "Debuff: -2 Str/Spd/Dura đối thủ. Nếu Gigachad: thêm -2 IQ/BIQ/MA.",
    )
    .weight(0.78)
    .debuffOpponent("strength", 2)
    .debuffOpponent("speed", 2)
    .debuffOpponent("durability", 2)
    .effect({
      type: "debuff",
      stat: "iq",
      value: -2,
      timing: "during_combat",
      target: "opponent",
      conditions: [
        { type: "has_item", itemType: "archetype", itemName: "Gigachad" },
      ],
    })
    .effect({
      type: "debuff",
      stat: "biq",
      value: -2,
      timing: "during_combat",
      target: "opponent",
      conditions: [
        { type: "has_item", itemType: "archetype", itemName: "Gigachad" },
      ],
    })
    .effect({
      type: "debuff",
      stat: "ma",
      value: -2,
      timing: "during_combat",
      target: "opponent",
      conditions: [
        { type: "has_item", itemType: "archetype", itemName: "Gigachad" },
      ],
    })
    .register();

  // Invulnerability
  defineEffect("power", "Invulnerability")
    .description("+2 Durability.")
    .weight(0.78)
    .addStat("durability", 2)
    .register();

  // Overdrive
  defineEffect("power", "Overdrive")
    .description("+3 MA, -1 Durability.")
    .weight(0.78)
    .addStat("ma", 3)
    .addStat("durability", -1)
    .register();

  // Drunken Boxing
  defineEffect("power", "Drunken Boxing")
    .description("-1 IQ, -1 Speed, +4 MA.")
    .weight(0.78)
    .addStat("iq", -1)
    .addStat("speed", -1)
    .addStat("ma", 4)
    .register();

  // Divine Lightning
  defineEffect("power", "Divine Lightning")
    .description("+1 Str/Spd/MA. Buff: +1 Str/Spd/MA vs Demon.")
    .weight(0.78)
    .addStat("strength", 1)
    .addStat("speed", 1)
    .addStat("ma", 1)
    .effect({
      type: "stat_modifier",
      stat: "strength",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [{ type: "race_match", races: ["Demon"] }],
    })
    .effect({
      type: "stat_modifier",
      stat: "speed",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [{ type: "race_match", races: ["Demon"] }],
    })
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [{ type: "race_match", races: ["Demon"] }],
    })
    .register();

  // Fist Fighting
  defineEffect("power", "Fist Fighting")
    .description("Mất vũ khí. +4 MA.")
    .weight(0.78)
    .effect({
      type: "remove_gear",
      timing: "immediate",
      target: "self",
      customHandler: "fist_fighting_remove_weapon",
    })
    .addStat("ma", 4)
    .register();

  // Rampage
  defineEffect("power", "Rampage")
    .description("Sau combat thắng: 36% +1 all stats.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "after_combat_win",
      target: "self",
      conditions: [{ type: "probability", chance: 36 }],
    })
    .register();

  // Bloodlust
  defineEffect("power", "Bloodlust")
    .description("Sau combat thắng: -1 IQ/MA, +1 Str/Spd, +2 Dura.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: -1,
      timing: "after_combat_win",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: -1,
      timing: "after_combat_win",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "strength",
      value: 1,
      timing: "after_combat_win",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "speed",
      value: 1,
      timing: "after_combat_win",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: 2,
      timing: "after_combat_win",
      target: "self",
    })
    .register();

  // Power Absorption
  defineEffect("power", "Power Absorption")
    .description("Sau combat thắng: hấp thụ 1 Power ngẫu nhiên của đối thủ.")
    .weight(0.78)
    .effect({
      type: "steal_power",
      grantCount: 1,
      timing: "after_combat_win",
      target: "opponent",
    })
    .register();

  // Power Negation
  defineEffect("power", "Power Negation")
    .description("Trước Combat: Vô hiệu hóa 1 Power ngẫu nhiên của đối thủ.")
    .weight(0.78)
    .effect({
      type: "power_disable",
      timing: "before_combat",
      target: "opponent",
      grantCount: 1,
    })
    .register();

  // Mind Control
  defineEffect("power", "Mind Control")
    .description("Trước Combat: +1 all stats vs đối thủ có Base IQ ≤5.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "before_combat",
      target: "self",
      conditions: [
        {
          type: "stat_compare",
          stat: "iq",
          compareWith: "opponent",
          operator: "<=",
        },
      ],
      customHandler: "mind_control_iq_check",
    })
    .register();

  // Blood Manipulation
  defineEffect("power", "Blood Manipulation")
    .description("Trước Combat: +3 Strength vs tất cả trừ Skeleton và Spirit.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "strength",
      value: 3,
      timing: "before_combat",
      target: "self",
      conditions: [
        {
          type: "race_match",
          excludeRaces: ["Skeleton", "Spirit"],
        },
      ],
    })
    .register();

  // Sonic Scream
  defineEffect("power", "Sonic Scream")
    .description("Debuff: -3 Durability đối thủ.")
    .weight(0.78)
    .debuffOpponent("durability", 3)
    .register();

  // Thunder Orb
  defineEffect("power", "Thunder Orb")
    .description("Debuff: -2 Durability đối thủ.")
    .weight(0.78)
    .debuffOpponent("durability", 2)
    .register();

  // Armor Piercing
  defineEffect("power", "Armor Piercing")
    .description("Trong Combat: +1 Điểm ở Round Dura nếu thắng.")
    .weight(0.78)
    .effect({
      type: "extra_point_on_win",
      points: 1,
      timing: "during_combat",
      target: "self",
      customHandler: "armor_piercing_dura_round",
    })
    .register();

  // Divine Smite
  defineEffect("power", "Divine Smite")
    .description("Trong Combat: +1 Điểm ở Round MA nếu thắng.")
    .weight(0.78)
    .effect({
      type: "extra_point_on_win",
      points: 1,
      timing: "during_combat",
      target: "self",
      customHandler: "divine_smite_ma_round",
    })
    .register();

  // Quas
  defineEffect("power", "Quas")
    .description(
      "Buff: +1 Strength. Có Quas+Wex+Exort: nhận Archetype Invoker.",
    )
    .weight(0.78)
    .addStat("strength", 1)
    .effect({
      type: "grant_archetype",
      grantName: "Invoker",
      grantCount: 1,
      timing: "immediate",
      target: "self",
      triggerOnce: true,
      customHandler: "quas_wex_exort_check",
    })
    .register();

  // Wex
  defineEffect("power", "Wex")
    .description("Buff: +1 Speed. Có Quas+Wex+Exort: nhận Archetype Invoker.")
    .weight(0.78)
    .addStat("speed", 1)
    .effect({
      type: "grant_archetype",
      grantName: "Invoker",
      grantCount: 1,
      timing: "immediate",
      target: "self",
      triggerOnce: true,
      customHandler: "quas_wex_exort_check",
    })
    .register();

  // Exort
  defineEffect("power", "Exort")
    .description("Buff: +1 IQ. Có Quas+Wex+Exort: nhận Archetype Invoker.")
    .weight(0.78)
    .addStat("iq", 1)
    .effect({
      type: "grant_archetype",
      grantName: "Invoker",
      grantCount: 1,
      timing: "immediate",
      target: "self",
      triggerOnce: true,
      customHandler: "quas_wex_exort_check",
    })
    .register();

  // Enlarging
  defineEffect("power", "Enlarging")
    .description("+3 Str, +3 Dura, -6 Speed.")
    .weight(0.78)
    .addStat("strength", 3)
    .addStat("durability", 3)
    .addStat("speed", -6)
    .register();

  // Shrinking
  defineEffect("power", "Shrinking")
    .description("+6 Speed, -3 Str, -3 Dura.")
    .weight(0.78)
    .addStat("speed", 6)
    .addStat("strength", -3)
    .addStat("durability", -3)
    .register();

  // Bloody Strike
  defineEffect("power", "Bloody Strike")
    .description("-1 all stats. Sau combat: +1 vào mỗi stat thắng round.")
    .weight(0.78)
    .addAllStats(-1)
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 1,
      timing: "after_combat",
      target: "self",
      customHandler: "bloody_strike_per_round_won",
    })
    .register();

  // Accelerating Sorcery
  defineEffect("power", "Accelerating Sorcery")
    .description('Trong Combat: +1 IQ mỗi khi kích hoạt Power "Trong combat".')
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 1,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "accelerating_sorcery_count",
    })
    .register();

  // Homeguard
  defineEffect("power", "Homeguard")
    .description("Trong Combat: Buff +3 Speed nếu không thua round Strength.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "speed",
      value: 3,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "homeguard_no_str_lose",
    })
    .register();

  // Bash
  defineEffect("power", "Bash")
    .description(
      "Trong combat: Sau mỗi round thắng, 35% đối thủ -3 stat round kế.",
    )
    .weight(0.78)
    .effect({
      type: "debuff",
      stat: "random",
      value: -3,
      timing: "on_round_win",
      target: "opponent",
      conditions: [{ type: "probability", chance: 35 }],
    })
    .register();

  // Gate to Heaven
  defineEffect("power", "Gate to Heaven")
    .description("Khi ở nhánh thắng từ Vòng 32: +1 all stats.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "immediate",
      target: "self",
      customHandler: "gate_to_heaven_round_check",
    })
    .register();

  // Weapon Enhancing
  defineEffect("power", "Weapon Enhancing")
    .description("+1 vào mỗi buff từ vũ khí, -1 vào mỗi debuff từ vũ khí.")
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "weapon_enhancing_modify",
    })
    .register();

  // Fancy Feet
  defineEffect("power", "Fancy Feet")
    .description("-1 Dura. Trước combat: Vô hiệu vũ khí và Rune đối phương.")
    .weight(0.78)
    .addStat("durability", -1)
    .effect({
      type: "weapon_disable",
      timing: "before_combat",
      target: "opponent",
    })
    .effect({
      type: "custom",
      timing: "before_combat",
      target: "opponent",
      customHandler: "fancy_feet_disable_rune",
    })
    .register();

  // Artist
  defineEffect("power", "Artist")
    .description(
      "Khi xuống nhánh thua: Stat lẻ của bạn nhận +1. (Dựa theo Base Stats)",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "odd",
      value: 1,
      timing: "on_loser_bracket",
      target: "self",
    })
    .register();

  // Writer
  defineEffect("power", "Writer")
    .description(
      "Khi xuống nhánh thua: Stat chẵn của bạn nhận +1. (Dựa theo Base Stats)",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "even",
      value: 1,
      timing: "on_loser_bracket",
      target: "self",
    })
    .register();

  // Red Shift/LP1211-M
  defineEffect("power", "Red Shift/LP1211-M")
    .description(
      "Trong combat: Nếu thắng ít nhất 1/3 round đầu, Buff: +1 IQ, +1 BIQ, +2 MA.",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 1,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "red_shift_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 1,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "red_shift_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 2,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "red_shift_check",
    })
    .register();

  // Shooting for Victory
  defineEffect("power", "Shooting for Victory")
    .description(
      "Trong combat: Nếu thắng ít nhất 1 và thua ít nhất 1/3 round đầu, Buff: +1 IQ, +1 BIQ, +2 MA.",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 1,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "shooting_for_victory_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 1,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "shooting_for_victory_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 2,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "shooting_for_victory_check",
    })
    .register();

  // Let's Pump Some Iron!
  defineEffect("power", "Let's Pump Some Iron!")
    .description(
      "Trong combat: Nếu thắng đúng 1/3 round đầu, Buff: +2 IQ, +2 BIQ, +2 MA.",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 2,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "pump_iron_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 2,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "pump_iron_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 2,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "pump_iron_check",
    })
    .register();

  // Hunter's Rewards
  defineEffect("power", "Hunter's Rewards")
    .description("Sau Combat: Thắng PvP nhận 2 phần thưởng thay vì 1.")
    .weight(0.78)
    .effect({
      type: "double_reward",
      timing: "after_combat_win",
      target: "self",
    })
    .register();

  // Quirkful
  defineEffect("power", "Quirkful")
    .description(
      "Nhận thêm 1 Power với mỗi Quirk bạn có khi quay ra Power này.",
    )
    .weight(0.78)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      timing: "immediate",
      target: "self",
      triggerOnce: true,
      customHandler: "quirkful_grant_per_quirk",
    })
    .register();

  // Quirkless
  defineEffect("power", "Quirkless")
    .description("Mất hết tất cả Quirk.")
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "quirkless_remove_all_quirks",
    })
    .register();

  // Sybaurafarming
  defineEffect("power", "Sybaurafarming")
    .description("Base Stat >5 thành 5. Mỗi stat bị đổi nhận 1 Quirk.")
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      triggerOnce: true,
      customHandler: "sybaurafarming_effect",
    })
    .register();

  // Swinging Maestro
  defineEffect("power", "Swinging Maestro")
    .description("Buff: Nhận 4 Durability.")
    .weight(0.78)
    .addStat("durability", 4)
    .register();

  // The Coast is Clear!
  defineEffect("power", "The Coast is Clear!")
    .description("Bạn nhìn rõ đối thủ!")
    .weight(0.78)
    .register();

  // Angling and Scheming
  defineEffect("power", "Angling and Scheming")
    .description(
      "Trong Combat: Nếu thắng Round Strength, Buff: +1 IQ, +1 BIQ, +2 MA.",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 1,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "angling_scheming_str_win",
    })
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 1,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "angling_scheming_str_win",
    })
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 2,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "angling_scheming_str_win",
    })
    .register();

  // EscAPADe
  defineEffect("power", "EscAPADe")
    .description("Chuyển hoá tất cả IQ cộng thêm thành Strength.")
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "escapade_convert_iq_to_str",
    })
    .register();

  // Spirit Link
  defineEffect("power", "Spirit Link")
    .description("Nhận +1 vào 1 Stat ngẫu nhiên với mỗi 1 người bạn loại.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 1,
      timing: "after_combat_win",
      target: "self",
      stackable: true,
    })
    .register();

  // The Sand of Time
  defineEffect("power", "The Sand of Time")
    .description(
      "Trong Combat: Lần đầu thua round, 40% +1 điểm bạn và -1 điểm đối thủ.",
    )
    .weight(0.78)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "on_round_lose",
      target: "self",
      triggerOnce: true,
      conditions: [{ type: "probability", chance: 40 }],
    })
    .effect({
      type: "combat_points",
      points: -1,
      timing: "on_round_lose",
      target: "opponent",
      triggerOnce: true,
      conditions: [{ type: "probability", chance: 40 }],
    })
    .register();

  // Memory Alter
  defineEffect("power", "Memory Alter")
    .description(
      'Trước Combat: Vô hiệu 1 Power "trong combat" đối thủ. Thắng thì đối thủ mất vĩnh viễn.',
    )
    .weight(0.78)
    .effect({
      type: "power_disable",
      timing: "before_combat",
      target: "opponent",
      grantCount: 1,
      customHandler: "memory_alter_disable_in_combat_power",
    })
    .register();

  // Frost Fingers
  defineEffect("power", "Frost Fingers")
    .description(
      "Debuff: Mỗi Gear đối thủ có, -1 Stat cao nhất đối thủ (tối đa 5).",
    )
    .weight(0.78)
    .effect({
      type: "debuff",
      stat: "highest",
      value: -1,
      timing: "during_combat",
      target: "opponent",
      customHandler: "frost_fingers_per_gear",
    })
    .register();

  // Gaze of the Abyss
  defineEffect("power", "Gaze of the Abyss")
    .description("Trong Combat: Thua 5 Round, round tiếp theo thắng +5 Điểm.")
    .weight(0.78)
    .effect({
      type: "extra_point_on_win",
      points: 5,
      timing: "during_combat",
      target: "self",
      customHandler: "gaze_of_abyss_5_loses",
    })
    .register();

  // Railroad Realm
  defineEffect("power", "Railroad Realm 🍀")
    .description("Trong Combat: Bạn và đối thủ nghe tiếng xình xịch của tàu 🍀")
    .weight(0.78)
    .register();

  // Mewing
  defineEffect("power", "Mewing")
    .description("Bye bye 🤫🧏‍♂.")
    .weight(0.78)
    .register();

  // Master of War
  defineEffect("power", "Master of War")
    .description("Ngay lập tức khi nhận, bạn dùng được tất cả Weapon.")
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "master_of_war_unlock_all_weapons",
    })
    .register();

  // Borrowed Time
  defineEffect("power", "Borrowed Time")
    .description(
      "Trong Combat: Thua 2 round, round tiếp theo đối thủ không nhận điểm nếu bạn thua.",
    )
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      triggerOnce: true,
      customHandler: "borrowed_time_2_loses",
    })
    .register();

  // Guidance
  defineEffect("power", "Guidance")
    .description(
      "Trước Combat: +1 vào 2 Stat ngẫu nhiên nếu đối thủ có ít power hơn.",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 1,
      timing: "before_combat",
      target: "self",
      customHandler: "guidance_fewer_powers_check",
    })
    .register();

  // Hunter's Mark
  defineEffect("power", "Hunter's Mark")
    .description(
      "Trước Combat: Chọn 1 Round ngẫu nhiên, thắng round đó +1 điểm.",
    )
    .weight(0.78)
    .effect({
      type: "extra_point_on_win",
      points: 1,
      timing: "during_combat",
      target: "self",
      customHandler: "hunters_mark_random_round",
    })
    .register();

  // Ice Liquefactors
  defineEffect("power", "Ice Liquefactors")
    .description("Hóa lỏng băng 💀???")
    .weight(0.78)
    .register();

  // Fire Control
  defineEffect("power", "Fire Control")
    .description("Điều khiển được một ngọn lửa bật hoặc tắt 💀")
    .weight(0.78)
    .register();

  // Water Breathing
  defineEffect("power", "Water Breathing")
    .description("Thở dưới nước.")
    .weight(0.78)
    .register();

  // Cursed
  defineEffect("power", "Cursed")
    .description("Re-spin lại chỉ số cao nhất 1 lần.")
    .weight(0.78)
    .effect({
      type: "stat_respin",
      stat: "highest",
      timing: "immediate",
      target: "self",
      triggerOnce: true,
    })
    .register();

  // Enhanced Hearing
  defineEffect("power", "Enhanced Hearing")
    .description(
      "+2 MA. Trước Combat: -1 all nếu đối thủ dùng nhạc cụ, -2 all nếu đối thủ có power âm thanh.",
    )
    .weight(0.78)
    .addStat("ma", 2)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -1,
      timing: "before_combat",
      target: "self",
      customHandler: "enhanced_hearing_instrument_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -2,
      timing: "before_combat",
      target: "self",
      customHandler: "enhanced_hearing_sound_power_check",
    })
    .register();

  // Rickrolling
  defineEffect("power", "Rickrolling")
    .description("Chắc không cần giải thích đâu nhỉ 💀")
    .weight(0.78)
    .register();

  // Hand Washing
  defineEffect("power", "Hand Washing")
    .description("Tay sạch 💀")
    .weight(0.78)
    .register();

  // 67
  defineEffect("power", "67")
    .description("Trong Combat: Chạy Clip 67 cho cả 2 người chơi.")
    .weight(0.78)
    .register();

  // Age Manipulation
  defineEffect("power", "Age Manipulation")
    .description("Debuff: Đối thủ +1 IQ, -1 mọi stat còn lại.")
    .weight(0.78)
    .effect({
      type: "debuff",
      stat: "iq",
      value: 1,
      timing: "during_combat",
      target: "opponent",
    })
    .effect({
      type: "debuff",
      stat: "strength",
      value: -1,
      timing: "during_combat",
      target: "opponent",
    })
    .effect({
      type: "debuff",
      stat: "speed",
      value: -1,
      timing: "during_combat",
      target: "opponent",
    })
    .effect({
      type: "debuff",
      stat: "durability",
      value: -1,
      timing: "during_combat",
      target: "opponent",
    })
    .effect({
      type: "debuff",
      stat: "biq",
      value: -1,
      timing: "during_combat",
      target: "opponent",
    })
    .effect({
      type: "debuff",
      stat: "ma",
      value: -1,
      timing: "during_combat",
      target: "opponent",
    })
    .register();

  // Garlic Breath
  defineEffect("power", "Garlic Breath")
    .description(
      'Buff: +1 all stats vs Vampire. Có 3+ Power "Breath" thì bỏ qua điều kiện.',
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "during_combat",
      target: "self",
      customHandler: "garlic_breath_check",
    })
    .register();

  // The Goat
  defineEffect("power", "The Goat")
    .description("Bạn là dê! 💀")
    .weight(0.78)
    .register();

  // Body Enhancing
  defineEffect("power", "Body Enhancing")
    .description("Nhận +1 Strength, +1 Speed, +1 Durability.")
    .weight(0.78)
    .addStat("strength", 1)
    .addStat("speed", 1)
    .addStat("durability", 1)
    .register();

  // Clear Mind
  defineEffect("power", "Clear Mind")
    .description("Nhận +3 IQ.")
    .weight(0.78)
    .addStat("iq", 3)
    .register();

  // Force Field
  defineEffect("power", "Force Field")
    .description("Debuff: Đối thủ nhận -2 Speed, -1 MA.")
    .weight(0.78)
    .debuffOpponent("speed", 2)
    .debuffOpponent("ma", 1)
    .register();

  // Anti-Magic Barrier
  defineEffect("power", "Anti-Magic Barrier")
    .description(
      "-1 Durability. Trước Combat: Vô hiệu 2 Power ngẫu nhiên đối thủ.",
    )
    .weight(0.78)
    .addStat("durability", -1)
    .effect({
      type: "disable_powers",
      count: 2,
      timing: "before_combat",
      target: "opponent",
    })
    .register();

  // Black Magic
  defineEffect("power", "Black Magic")
    .description("Debuff: Đối thủ -2 vào một stat ngẫu nhiên.")
    .weight(0.78)
    .effect({
      type: "debuff",
      stat: "random",
      value: -2,
      timing: "during_combat",
      target: "opponent",
    })
    .register();

  // The Great Storm
  defineEffect("power", "The Great Storm")
    .description("Debuff: -2 Durability đối thủ.")
    .weight(0.78)
    .debuffOpponent("durability", 2)
    .register();

  // Continental Super Storm
  defineEffect("power", "Continental Super Storm")
    .description("Buff: Nhận +2 Speed.")
    .weight(0.78)
    .addStat("speed", 2)
    .register();

  // Sacred Fire
  defineEffect("power", "Sacred Fire")
    .description("Buff: +1 all stats vs Vampire hoặc Demon.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [{ type: "race_match", races: ["Vampire", "Demon"] }],
    })
    .register();

  // Capybara
  defineEffect("power", "Capybara")
    .description("Capybara")
    .weight(0.78)
    .register();

  // Tsunami Control
  defineEffect("power", "Tsunami Control")
    .description("Buff: Nhận +2 Strength.")
    .weight(0.78)
    .addStat("strength", 2)
    .register();

  // Rising tide
  defineEffect("power", "Rising tide")
    .description("Buff: Nhận +2 MA.")
    .weight(0.78)
    .addStat("ma", 2)
    .register();

  // Seismic
  defineEffect("power", "Seismic")
    .description("Debuff: Đối thủ -2 MA.")
    .weight(0.78)
    .debuffOpponent("ma", 2)
    .register();

  // Night Vision
  defineEffect("power", "Night Vision")
    .description("Có thể nhìn trong bóng tối. 💀")
    .weight(0.78)
    .register();

  // Gotta go Fast
  defineEffect("power", "Gotta go Fast")
    .description("Bạn là Sonic 💀")
    .weight(0.78)
    .register();

  // Fair Duel
  defineEffect("power", "Fair Duel")
    .description("Trước Combat: Cả 2 miễn nhiễm Debuff từ nhau.")
    .weight(0.78)
    .effect({
      type: "immunity",
      immuneTo: ["debuff"],
      timing: "before_combat",
      target: "both",
    })
    .register();

  // Uno Reverse Card
  defineEffect("power", "Uno Reverse Card")
    .description(
      "Trước Combat: Debuff giảm stat từ đối thủ áp dụng lên chính hắn và ngược lại.",
    )
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "before_combat",
      target: "self",
      customHandler: "uno_reverse_card_swap_debuffs",
    })
    .register();

  // Burning Hand
  defineEffect("power", "Burning Hand")
    .description("Nhận +1 Strength.")
    .weight(0.78)
    .addStat("strength", 1)
    .register();

  // Tick-tock
  defineEffect("power", "Tick-tock")
    .description("Trong Combat: Cơ thể bạn phát ra tiếng đồng hồ. 💀")
    .weight(0.78)
    .register();

  // Frost Armor
  defineEffect("power", "Frost Armor")
    .description("Nhận +2 Durability.")
    .weight(0.78)
    .addStat("durability", 2)
    .register();

  // Lightning Enchant
  defineEffect("power", "Lightning Enchant")
    .description("Nhận +2 Speed.")
    .weight(0.78)
    .addStat("speed", 2)
    .register();

  // Chaos Enchantment
  defineEffect("power", "Chaos Enchantment")
    .description("Sau Combat: +1 Str và +1 MA khi trong nhánh thua.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "strength",
      value: 1,
      timing: "after_combat",
      target: "self",
      conditions: [{ type: "bracket", bracket: "loser" }],
    })
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 1,
      timing: "after_combat",
      target: "self",
      conditions: [{ type: "bracket", bracket: "loser" }],
    })
    .register();

  // Dream Manipulation
  defineEffect("power", "Dream Manipulation")
    .description("Debuff: đối phương -2 IQ và -1 Speed.")
    .weight(0.78)
    .debuffOpponent("iq", 2)
    .debuffOpponent("speed", 1)
    .register();

  // Powerful Strike
  defineEffect("power", "Powerful Strike")
    .description("Nếu có vũ khí, nhận +2 MA.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 2,
      timing: "immediate",
      target: "self",
      conditions: [{ type: "has_item", itemType: "weapon" }],
    })
    .register();

  // Fragrant
  defineEffect("power", "Fragrant")
    .description("Thơm tho dễ chịu.")
    .weight(0.78)
    .register();

  // Voidwalking
  defineEffect("power", "Voidwalking")
    .description("Buff: Nhận +2 Speed.")
    .weight(0.78)
    .addStat("speed", 2)
    .register();

  // Odin Blessing
  defineEffect("power", "Odin Blessing")
    .description(
      "+2 Strength. Sau Combat Thua: Chuyển thành +2 vào Stat cao nhất.",
    )
    .weight(0.78)
    .addStat("strength", 2)
    .effect({
      type: "custom",
      timing: "after_combat_lose",
      target: "self",
      customHandler: "odin_blessing_convert_to_highest",
    })
    .register();

  // Misty Step Ahead
  defineEffect("power", "Misty Step Ahead")
    .description("[PVE ONLY] Trong combat: Tổ đội khởi đầu với 1 điểm.")
    .weight(0.78)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "team",
      conditions: [{ type: "always" }],
    })
    .register();

  // Ballet Dancing
  defineEffect("power", "Ballet Dancing")
    .description("Múa dẻo 💃")
    .weight(0.78)
    .register();

  // Luck Manipulation
  defineEffect("power", "Luck Manipulation")
    .description("Trước Combat: Từ vòng 64, 15% +1 all stats, 5% +2 all stats.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "before_combat",
      target: "self",
      conditions: [{ type: "probability", chance: 15 }],
      customHandler: "luck_manipulation_round_64_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 2,
      timing: "before_combat",
      target: "self",
      conditions: [{ type: "probability", chance: 5 }],
      customHandler: "luck_manipulation_round_64_check",
    })
    .register();

  // Scrying
  defineEffect("power", "Scrying")
    .description("Debuff: Đối thủ 40% -4 Stat mạnh nhất.")
    .weight(0.78)
    .effect({
      type: "debuff",
      stat: "highest",
      value: -4,
      timing: "during_combat",
      target: "opponent",
      conditions: [{ type: "probability", chance: 40 }],
    })
    .register();

  // Cold Breeze
  defineEffect("power", "Cold Breeze")
    .description("Mát lạnh!")
    .weight(0.78)
    .register();

  // Bucking Bronco
  defineEffect("power", "Bucking Bronco")
    .description("Sau Combat: Thắng round MA và thắng trận, +1 MA. (Stack)")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 1,
      timing: "after_combat_win",
      target: "self",
      stackable: true,
      customHandler: "bucking_bronco_ma_round_win",
    })
    .register();

  // Detect Thoughts
  defineEffect("power", "Detect Thoughts")
    .description("Trước Combat: Base IQ cao hơn đối thủ, BIQ trong trận +2.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 2,
      timing: "before_combat",
      target: "self",
      conditions: [
        {
          type: "stat_compare",
          stat: "iq",
          compareWith: "opponent",
          operator: ">",
          useBaseStats: true,
        },
      ],
    })
    .register();

  // Arcana Blast
  defineEffect("power", "Arcana Blast")
    .description("Debuff: Đối thủ nhận -3 Durability.")
    .weight(0.78)
    .debuffOpponent("durability", 3)
    .register();

  // Blood Frenzy
  defineEffect("power", "Blood Frenzy")
    .description("-3 IQ và -3 BIQ, +2 all stat còn lại.")
    .weight(0.78)
    .addStat("iq", -3)
    .addStat("biq", -3)
    .addStat("strength", 2)
    .addStat("speed", 2)
    .addStat("durability", 2)
    .addStat("ma", 2)
    .register();

  // Analysis Sins
  defineEffect("power", "Analysis Sins")
    .description(
      "Buff: vs Demon/Vampire/Spirit/Orc/Skeleton/Goblin, +1 IQ và +1 Strength.",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [
        {
          type: "race_match",
          races: ["Demon", "Vampire", "Spirit", "Orc", "Skeleton", "Goblin"],
        },
      ],
    })
    .effect({
      type: "stat_modifier",
      stat: "strength",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [
        {
          type: "race_match",
          races: ["Demon", "Vampire", "Spirit", "Orc", "Skeleton", "Goblin"],
        },
      ],
    })
    .register();

  // Cleaning Sins
  defineEffect("power", "Cleaning Sins")
    .description(
      "Buff: vs Demon/Vampire/Spirit/Orc/Skeleton/Goblin, +1 BIQ và +1 Dura.",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [
        {
          type: "race_match",
          races: ["Demon", "Vampire", "Spirit", "Orc", "Skeleton", "Goblin"],
        },
      ],
    })
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [
        {
          type: "race_match",
          races: ["Demon", "Vampire", "Spirit", "Orc", "Skeleton", "Goblin"],
        },
      ],
    })
    .register();

  // Hydrate
  defineEffect("power", "Hydrate")
    .description("Cơ thể bạn được cung cấp đủ nước. 💦💦💦")
    .weight(0.78)
    .register();

  // Groundwork
  defineEffect("power", "Groundwork")
    .description("Buff: Có ít nhất 3 Power khác, +2 Strength và +2 Speed.")
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "groundwork_3_powers_check",
    })
    .register();

  // Dominator
  defineEffect("power", "Dominator")
    .description(
      "Trong Combat: Thua ít nhất 2/3 round đầu, Debuff: đối phương -1 all stats.",
    )
    .weight(0.78)
    .effect({
      type: "debuff",
      stat: "all",
      value: -1,
      timing: "during_combat",
      target: "opponent",
      duration: "combat",
      customHandler: "dominator_2_of_3_loses",
    })
    .register();

  // Ice Spike
  defineEffect("power", "Ice Spike")
    .description("Debuff: Đối thủ nhận -2 Durability.")
    .weight(0.78)
    .debuffOpponent("durability", 2)
    .register();

  // Stat Absorption
  defineEffect("power", "Stat Absorption")
    .description("Sau Combat thắng: +1 vào chỉ số đối thủ có cao nhất.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 1,
      timing: "after_combat_win",
      target: "self",
      customHandler: "stat_absorption_opponent_highest",
    })
    .register();

  // Golden Vow
  defineEffect("power", "Golden Vow")
    .description("Trong combat: Khởi đầu với +1 điểm.")
    .weight(0.78)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "self",
    })
    .register();

  // Acid Breath
  defineEffect("power", "Acid Breath")
    .description(
      'Debuff: -1 Durability đối thủ. Sau Combat thắng: Nhận Power "Poison Breath".',
    )
    .weight(0.78)
    .debuffOpponent("durability", 1)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "Poison Breath",
      timing: "after_combat_win",
      target: "self",
    })
    .register();

  // Poison Breath
  defineEffect("power", "Poison Breath")
    .description(
      'Debuff: -1 IQ đối thủ. Sau Combat thua: Nhận Power "Garlic Breath".',
    )
    .weight(0.78)
    .debuffOpponent("iq", 1)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "Garlic Breath",
      timing: "after_combat_lose",
      target: "self",
    })
    .register();

  // Zoltraak
  defineEffect("power", "Zoltraak")
    .description(
      "+3 BIQ. Trong Combat: Round BIQ diễn ra 2 lần, mỗi lần đều tính điểm.",
    )
    .weight(0.78)
    .addStat("biq", 3)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "zoltraak_double_biq_round",
    })
    .register();

  // Encroaching Shadow
  defineEffect("power", "Encroaching Shadow")
    .description("Trong combat: 75% nhận +7 Speed.")
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "speed",
      value: 7,
      timing: "before_combat",
      target: "self",
      duration: "combat",
      customHandler: "encroaching_shadow_wheel",
    })
    .register();

  // No Stopping Me
  defineEffect("power", "No Stopping Me")
    .description(
      "Trong Combat: Nếu 3 round đầu so le (thắng-thua-thắng hoặc thua-thắng-thua), Buff: +3 IQ, +3 BIQ, +3 MA.",
    )
    .weight(0.78)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 3,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "no_stopping_me_alternating_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 3,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "no_stopping_me_alternating_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 3,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "no_stopping_me_alternating_check",
    })
    .register();

  // Mystifying Murmur
  defineEffect("power", "Mystifying Murmur")
    .description("Trong combat: Đối thủ nhận Debuff: -3 Dura.")
    .weight(0.78)
    .effect({
      type: "debuff",
      stat: "durability",
      value: -3,
      timing: "during_combat",
      target: "opponent",
    })
    .register();

  // Spell Flux (#128)
  defineEffect("power", "Spell Flux")
    .description(
      '1 Power kích hoạt "Trong Combat" của bạn kích hoạt lần đầu sẽ được kích hoạt 2 lần.',
    )
    .weight(0.78)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "spell_flux_double_first_in_combat",
    })
    .register();

  // ============================================================================
  // SPECIAL POWERS (không có số thứ tự - từ sự kiện/combo đặc biệt)
  // ============================================================================

  // Cinder Flickering
  defineEffect("power", "Cinder Flickering")
    .description(
      'Sau Combat: Khi 2 người có Cinder Flickering trong cùng 1 Combat, người thắng nhận Char Dev "Lord of Cinder".',
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "cinder_flickering_check",
    })
    .register();

  // Darwin Evolution Theory
  defineEffect("power", "Darwin Evolution Theory")
    .description(
      "Sau Combat: Thăng hạng chủng tộc của mình lên 1 bậc. (Cả tộc của bạn được nâng bậc)",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "darwin_evolution_race_up",
    })
    .register();

  // Algorithms Are Clear
  defineEffect("power", "Algorithms Are Clear")
    .description(
      "Sau Combat: Cộng tổng Base Stat đối thủ chia 6, thay thế Base Stat thấp nhất của bạn thành con số đó.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "algorithms_are_clear_replace_lowest",
    })
    .register();

  // Eternal Mangekyou Sharingan
  defineEffect("power", "Eternal Mangekyou Sharingan")
    .description(
      "Trước Combat: Kích hoạt ngẫu nhiên 1 trong 3 hiệu ứng - Amaterasu: đối thủ -6 Dura; Tsukuyomi: đối thủ -6 IQ; Susanoo: đối thủ -6 Strength.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "before_combat",
      target: "opponent",
      customHandler: "eternal_mangekyou_random_effect",
    })
    .register();

  // Adapt
  defineEffect("power", "Adapt")
    .description(
      "Ghi nhớ mọi Power gặp. Trước combat: Vô hiệu hóa toàn bộ Power của đối thủ mà bản thân đã ghi nhớ.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "before_combat",
      target: "opponent",
      customHandler: "adapt_disable_known_powers",
    })
    .register();

  // Hey Ya!
  defineEffect("power", "Hey Ya!")
    .description("Bạn được cổ vũ tinh thần.")
    .weight(0)
    .register();

  // Jogan
  defineEffect("power", "Jogan")
    .description("Mắt sáng, không bị cận.")
    .weight(0)
    .register();

  // Super Lucky
  defineEffect("power", "Super Lucky")
    .description(
      "Khi thua trận, 15% lật kèo thắng. Nếu không, thêm 1 cơ hội 10% lật kèo.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "after_combat_lose",
      target: "self",
      customHandler: "super_lucky_comeback_check",
    })
    .register();

  // Valkyrie's Blessing
  defineEffect("power", "Valkyrie's Blessing")
    .description(
      "Miễn nhiễm AIDS. Miễn nhiễm Debuff. Tie-break 66% nghiêng về bạn. Power này không thể bị tác động/vô hiệu/xóa bỏ.",
    )
    .weight(0)
    .effect({
      type: "immunity",
      immuneTo: ["aids", "debuff"],
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "immunity",
      immuneTo: ["remove_valkyrie_blessing"],
      timing: "immediate",
      target: "self",
    })
    .register();

  // 4 Hit Combo
  defineEffect("power", "4 Hit Combo")
    .description(
      "Trong Combat: Round BIQ thắng sẽ nhận điểm để bằng với đối thủ. Không có tác dụng nếu đang hơn điểm.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "four_hit_combo_biq_equalize",
    })
    .register();

  // Sovngarde's Blessing
  defineEffect("power", "Sovngarde's Blessing")
    .description(
      "Trong combat: Khởi đầu trận đấu với +1 điểm và Buff: +1 All Stats.",
    )
    .weight(0)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "before_combat",
      target: "self",
      duration: "combat",
    })
    .register();

  // Glory glory Man United
  defineEffect("power", "Glory glory Man United")
    .description(
      "Trong combat: Với mỗi bàn thua EPL gần nhất của MU, -1 all stats. MU thắng ≥3-0: +7 all stats.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "glory_man_united_epl_check",
    })
    .register();

  // Cold Mirage
  defineEffect("power", "Cold Mirage")
    .description(
      "Trong combat: Sau mỗi round thắng, quay 1 chỉ số từ các round chưa thi đấu. Đối thủ không nhận điểm khi thắng những round bị quay ra.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "on_round_win",
      target: "self",
      customHandler: "cold_mirage_spin_unused_round",
    })
    .register();

  // Golden Parry
  defineEffect("power", "Golden Parry")
    .description(
      "Trong combat: Sau mỗi round thua, đối thủ có 35% không nhận được điểm.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "on_round_lose",
      target: "self",
      conditions: [{ type: "probability", chance: 35 }],
      customHandler: "golden_parry_deny_opponent_point",
    })
    .register();

  // ============================================================================
  // SUMMONS (from Summon Wheel - stored as "Summon: X" in Power section)
  // ============================================================================

  // 1. Chihuahua - Weight 10
  defineEffect("summon", "Chihuahua")
    .description("-1 all stats.")
    .weight(10)
    .addAllStats(-1)
    .register();

  // 2. Mufasa - Weight 12
  defineEffect("summon", "Mufasa")
    .description("+3 Strength.")
    .weight(12)
    .addStat("strength", 3)
    .register();

  // 3. Pack of Wolves - Weight 12
  defineEffect("summon", "Pack of Wolves")
    .description("+3 Speed.")
    .weight(12)
    .addStat("speed", 3)
    .register();

  // 4. Earth Golem - Weight 12
  defineEffect("summon", "Earth Golem")
    .description("+3 Durability.")
    .weight(12)
    .addStat("durability", 3)
    .register();

  // 5. Water Elemental - Weight 12
  defineEffect("summon", "Water Elemental")
    .description("+3 IQ.")
    .weight(12)
    .addStat("iq", 3)
    .register();

  // 6. Imp - Weight 12
  defineEffect("summon", "Imp")
    .description("+3 BIQ.")
    .weight(12)
    .addStat("biq", 3)
    .register();

  // 7. Igris - Weight 12
  defineEffect("summon", "Igris")
    .description("+3 Martial Arts.")
    .weight(12)
    .addStat("ma", 3)
    .register();

  // 8. Numby - Weight 12
  defineEffect("summon", "Numby")
    .description("Trong Combat: +4 vào 1 chỉ số ngẫu nhiên.")
    .weight(12)
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 4,
      timing: "during_combat",
      target: "self",
    })
    .register();

  // 9. Wyvern's Egg - Weight 3
  defineEffect("summon", "Wyvern's Egg")
    .description("Ở trận chung kết tổng, nhận 2 điểm khởi đầu.")
    .weight(3)
    .effect({
      type: "combat_points",
      points: 2,
      timing: "before_combat",
      target: "self",
      conditions: [{ type: "bracket", bracket: "finals" }],
    })
    .register();

  // 10. Creator's Cat - Weight 3
  defineEffect("summon", "Creator's Cat")
    .description('Nhận 1 lần Char Dev: "Creator\'s Favor".')
    .weight(3)
    .effect({
      type: "grant_char_dev",
      grantType: "char_dev",
      grantName: "Creator's Favor",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  // MHA Power Wheel, JJK, Jojo, One Piece, Bleach, etc. powers
  // are registered under "archetype_sub" in archetypes.ts.
  // The resolver falls back to archetype_sub when a power isn't found under "power" type.
}
