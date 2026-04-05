/**
 * House Effects — definitions + handlers (immediate + combat) in one place.
 *
 * Nguồn: wheelofmultiverse-ss3.xlsx - Sheet "Houses" và "Houses Feature"
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
import type { StatName, CharacterStats } from "../types";

const STAT_NAMES: StatName[] = [
  "strength",
  "speed",
  "durability",
  "iq",
  "biq",
  "ma",
];

// ============================================================================
// HOUSE EFFECT DEFINITIONS
// ============================================================================

export function registerAllHouseEffects() {
  // ============================================================================
  // MAIN HOUSES (from Excel Houses sheet)
  // ============================================================================

  // 1. The Shire
  defineEffect("house", "The Shire")
    .description(
      "Nhận +4 vào 1 Stat bất kì. Archetype Mason: Nhận +6 vào 1 Stat bất kì.",
    )
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 4,
      timing: "immediate",
      target: "self",
    })
    .register();

  // The Shire - Mason Enhanced Version
  defineEffect("house_sub", "The Shire Mason")
    .description("(Mason) Nhận +6 vào 1 Stat bất kì.")
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 6,
      timing: "immediate",
      target: "self",
    })
    .register();

  // 2. New London
  defineEffect("house", "New London")
    .description(
      "Không có Mason Effect. Nhận thêm 1 trong 9 Archetype: Frostlanders, New Londoners, Wanderers, etc.",
    )
    .effect({
      type: "grant_wheel",
      wheelName: "New London Archetype Wheel",
      timing: "immediate",
      target: "self",
    })
    .register();

  // 3. Winterhome
  defineEffect("house", "Winterhome")
    .description(
      "Nhận 2 Normal Gear và +2 Dura. Archetype Mason: Nhận 2 Normal Gear và +1 vào all stats.",
    )
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "random",
      grantCount: 2,
      timing: "immediate",
      target: "self",
    })
    .addStat("durability", 2)
    .register();

  // 4. Atreides
  defineEffect("house", "Atreides")
    .description(
      "Nhận +2 vào Base Stat Cao Nhất. Archetype Mason: Sau Combat: Nhận +1 vào Base Stat Cao Nhất.",
    )
    .effect({
      type: "stat_modifier",
      stat: "highest",
      value: 2,
      isBase: true,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "highest",
      value: 2,
      isBase: true,
      timing: "after_combat",
      target: "self",
    })
    .register();

  // 5. House Lannister
  defineEffect("house", "House Lannister")
    .description(
      'Nhận 3 Gear "Golden Coin" và 2 Gear ngẫu nhiên. Archetype Mason: Nhận 6 Gear "Golden Coin" và 2 Gear ngẫu nhiên.',
    )
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "Golden Coin",
      grantCount: 3,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "random",
      grantCount: 2,
      timing: "immediate",
      target: "self",
    })
    .register();

  // 6. House Stark
  defineEffect("house", "House Stark")
    .description(
      'Nhận 1 "Dire Wolf". Archetype Mason: Nhận 1 "Dire Wolf" và 1 Unique Weapon.',
    )
    .effect({
      type: "grant_wheel",
      wheelName: "Dire Wolf Wheel",
      timing: "immediate",
      target: "self",
    })
    .register();

  // 7. House Targaryen
  defineEffect("house", "House Targaryen")
    .description(
      "Không có Mason Effect. Nhận 3 quả trứng rồng. Trứng sẽ nở ở vòng 16.",
    )
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "Trứng Rồng",
      grantCount: 3,
      timing: "immediate",
      target: "self",
    })
    .register();

  // 8. House Baratheon
  defineEffect("house", "House Baratheon")
    .description(
      "Nhận +1 Str, +1 BIQ, +1 MA, Base Stat thấp nhất sẽ được +2. Archetype Mason: Nhận thêm +1 all stats.",
    )
    .addStat("strength", 1)
    .addStat("biq", 1)
    .addStat("ma", 1)
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 2,
      isBase: true,
      timing: "immediate",
      target: "self",
    })
    .register();

  // 9. Dothraki
  defineEffect("house", "Dothraki")
    .description(
      "Không có Mason Effect. Trong Combat: Stat được đọ trong trận sẽ tuân theo luật ngẫu nhiên.",
    )
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "dothraki_random_stat_compare",
    })
    .register();

  // 10. House Tyrell
  defineEffect("house", "House Tyrell")
    .description(
      "Sau Combat: Nhận +2 vào Base Stat thấp nhất. Archetype Mason: Sau Combat: Nhận +3 vào Base Stat thấp nhất.",
    )
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 2,
      isBase: true,
      timing: "after_combat",
      target: "self",
    })
    .register();

  // 11. Kazuya Kinoshita's House
  defineEffect("house", "Kazuya Kinoshita's House")
    .description(
      'Sau Combat: Nhận 1 Gear "Golden Coin". Archetype Mason: Sau Combat: Nhận 1 Gear "Golden Coin" và +1 vào Stat thấp nhất.',
    )
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "Golden Coin",
      grantCount: 1,
      timing: "after_combat",
      target: "self",
    })
    .register();

  // 12. Shurima
  defineEffect("house", "Shurima")
    .description(
      "Nhận 1 Legacy Gear và 2 Power. Archetype Mason: Nhận 1 Legacy Gear và 1 Unique Weapon.",
    )
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "Legacy Gear",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 2,
      timing: "immediate",
      target: "self",
    })
    .register();

  // 13. Hallownest
  defineEffect("house", "Hallownest")
    .description(
      "Chắc chắn có Weapon, chắc chắn có 2 Rune lên Weapon đó. Archetype Mason: Thêm 1 Rune.",
    )
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "hallownest_guaranteed_weapon_runes",
    })
    .register();

  // 14. Coven Council
  defineEffect("house", "Coven Council")
    .description(
      "Không có Mason Effect. Nhận +4 IQ. Khi Player Coven Council bị loại, 1 Player random không thuộc Coven được Re-Spin 1 stat.",
    )
    .addStat("iq", 4)
    .effect({
      type: "custom",
      timing: "on_death",
      target: "random_player",
      customHandler: "coven_council_death_bonus",
    })
    .register();

  // 15. Golden Order
  defineEffect("house", "Golden Order")
    .description(
      "Nhận 1 Great Rune và 2 Power. Archetype Mason: Nhận 1 Great Rune và Char Dev Shardbearer.",
    )
    .effect({
      type: "grant_wheel",
      wheelName: "Great Rune Wheel",
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 2,
      timing: "immediate",
      target: "self",
    })
    .register();

  // 16. Roundtable Hold
  defineEffect("house", "Roundtable Hold")
    .description(
      'Không có Mason Effect. (1).Khi bạn thua và đứng trước ngưỡng cửa bị loại, đánh lại combat đó với Sheet của một "Tarnished" khác.\n(2)Bạn là một "Tarnished".\nNếu đối thủ cũng là 1 "Tarnished", không kích hoạt hiệu ứng (1).\nNếu bạn là "Tarnished" cuối cùng, không kích hoạt hiệu ứng (1).\nOutcome của trận đánh vẫn sẽ là của bạn.',
    )
    .effect({
      type: "custom",
      timing: "before_combat_end",
      target: "self",
      triggerOnce: true,
      customHandler: "roundtable_hold_retry",
    })
    .register();

  // 17. Uchiha
  defineEffect("house", "Uchiha")
    .description(
      "Không có Mason Effect. Nhận +2 Dura và +2 BIQ. Mỗi khi đánh bại một người cùng gia tộc Uchiha, nhận lại +2 Dura và +2 BIQ.",
    )
    .addStat("durability", 2)
    .addStat("biq", 2)
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: 2,
      timing: "after_combat_win",
      target: "self",
      customHandler: "check_enemy_is_same_house",
    })
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 2,
      timing: "after_combat_win",
      target: "self",
      customHandler: "check_enemy_is_same_house",
    })
    .register();

  // 18. Ban Nhạc Ngọt Đoàn Kết
  defineEffect("house", "Ban Nhạc Ngọt Đoàn Kết")
    .description(
      "Nhận 1 trong 5 Gear: Kẹo, Ớt, Mì Tôm, Bò Khô, Radio. Mason Effect: Nhận 2 trong 5 Gear.",
    )
    .effect({
      type: "grant_wheel",
      wheelName: "Ban Nhạc Ngọt Gear Wheel",
      timing: "immediate",
      target: "self",
    })
    .register();

  // 19. Naga (Merfolk default house)
  defineEffect("house", "Naga")
    .description(
      "Gia tộc của nữ hoàng Azshara chỉ nhận Merfolk. Không có Mason Effect. Nhận 1 Blessing of the Deep.",
    )
    .effect({
      type: "grant_wheel",
      wheelName: "Blessing of the Deep Wheel",
      timing: "immediate",
      target: "self",
    })
    .register();

  // 20. Tracen Academy (Uma default house)
  defineEffect("house", "Tracen Academy")
    .description(
      "Học Viện chỉ nhận Uma. Nhận ngẫu nhiên từ 1-3 Strength, 1-3 Speed và 1-3 Durability. Archetype Mason: Sau Combat: Nhận +1 vào 1 Stat bất kì.",
    )
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "tracen_academy_random_stats",
    })
    .register();

  // Register House Sub-Types
  registerHouseSubTypes();
}

/**
 * House Sub-Types (from Houses Feature sheet)
 */
function registerHouseSubTypes() {
  // === DIRE WOLVES (House Stark Sub-Types) ===

  // Grey Wind
  defineEffect("house_sub", "Grey Wind")
    .description(
      "Khi nhận Sói: +2 Stat thấp nhất và Cao Nhất. Khi bị loại: Người nhà Stark +1 all stats.",
    )
    .weight(16.67)
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 2,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "highest",
      value: 2,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "on_death",
      target: "all_same_race",
      customHandler: "grey_wind_death_bonus",
    })
    .register();

  // Lady
  defineEffect("house_sub", "Lady")
    .description(
      "Khi nhận Sói: +2 all stats trong Combat kế. Sau Combat Thua: +2 all stats combat kế.",
    )
    .weight(16.67)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 2,
      timing: "after_combat_lose",
      target: "self",
      duration: "combat",
    })
    .register();

  // Summer
  defineEffect("house_sub", "Summer")
    .description("Khi nhận Sói: +1 IQ, +1 BIQ và 2 Power.")
    .weight(16.67)
    .addStat("iq", 1)
    .addStat("biq", 1)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 2,
      timing: "immediate",
      target: "self",
    })
    .register();

  // Shaggydog
  defineEffect("house_sub", "Shaggydog")
    .description(
      "Khi nhận Sói: +1 Stat thấp nhất. Sau mỗi Combat: Người nhà Stark +1 Stat thấp nhất.",
    )
    .weight(16.67)
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "all_same_race",
      customHandler: "shaggydog_house_bonus",
    })
    .register();

  // Ghost
  defineEffect("house_sub", "Ghost")
    .description("Khi nhận Sói: 2 Power, 1 Quirk, 1 Char Dev.")
    .weight(16.67)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 2,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "grant_quirk",
      grantType: "quirk",
      grantName: "random",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "grant_char_dev",
      grantType: "char_dev",
      grantName: "random",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  // Nymeria
  defineEffect("house_sub", "Nymeria")
    .description(
      'Khi nhận Sói: +3 Speed. Sau Combat Thua: Nhận Power "Weapon Enhancing".',
    )
    .weight(16.67)
    .addStat("speed", 3)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "Weapon Enhancing",
      grantCount: 1,
      timing: "after_combat_lose",
      target: "self",
    })
    .register();

  // === DRAGONS (House Targaryen Sub-Types) ===
  // Lưu ý: Trứng chỉ nở ở vòng 16

  // Drogon
  defineEffect("house_sub", "Drogon")
    .description("Nhận +2 Stat cao nhất và thấp nhất. Nhận 1 Power.")
    .weight(18)
    .effect({
      type: "stat_modifier",
      stat: "highest",
      value: 2,
      timing: "on_round_16",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 2,
      timing: "on_round_16",
      target: "self",
    })
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 1,
      timing: "on_round_16",
      target: "self",
    })
    .register();

  // Rhaegal
  defineEffect("house_sub", "Rhaegal")
    .description("Nhận +3 Stat cao nhất. Nhận 1 Power.")
    .weight(18)
    .effect({
      type: "stat_modifier",
      stat: "highest",
      value: 3,
      timing: "on_round_16",
      target: "self",
    })
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 1,
      timing: "on_round_16",
      target: "self",
    })
    .register();

  // Viserion
  defineEffect("house_sub", "Viserion")
    .description("Nhận +4 Stat thấp nhất. Nhận 1 Power.")
    .weight(18)
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 4,
      timing: "on_round_16",
      target: "self",
    })
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 1,
      timing: "on_round_16",
      target: "self",
    })
    .register();

  // Balerion
  defineEffect("house_sub", "Balerion")
    .description("Nhận +2 All Stats. Nhận 3 Power.")
    .weight(6)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 2,
      timing: "on_round_16",
      target: "self",
    })
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 3,
      timing: "on_round_16",
      target: "self",
    })
    .register();

  // Vhagar
  defineEffect("house_sub", "Vhagar")
    .description("Nhận 2 Quirk, 2 Power.")
    .weight(6)
    .effect({
      type: "grant_quirk",
      grantType: "quirk",
      grantName: "random",
      grantCount: 2,
      timing: "on_round_16",
      target: "self",
    })
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 2,
      timing: "on_round_16",
      target: "self",
    })
    .register();

  // Meraxes
  defineEffect("house_sub", "Meraxes")
    .description("Nhận 2 Gear, 2 Power.")
    .weight(6)
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "random",
      grantCount: 2,
      timing: "on_round_16",
      target: "self",
    })
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 2,
      timing: "on_round_16",
      target: "self",
    })
    .register();

  // Quicksilver
  defineEffect("house_sub", "Quicksilver")
    .description("Nhận 3 Power.")
    .weight(7)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 3,
      timing: "on_round_16",
      target: "self",
    })
    .register();

  // Dreamfyre
  defineEffect("house_sub", "Dreamfyre")
    .description("Nhận 3 Gear.")
    .weight(7)
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "random",
      grantCount: 3,
      timing: "on_round_16",
      target: "self",
    })
    .register();

  // Vermithor
  defineEffect("house_sub", "Vermithor")
    .description("Nhận 3 Quirk.")
    .weight(7)
    .effect({
      type: "grant_quirk",
      grantType: "quirk",
      grantName: "random",
      grantCount: 3,
      timing: "on_round_16",
      target: "self",
    })
    .register();

  // Silverwing
  defineEffect("house_sub", "Silverwing")
    .description("Nhận 3 Char Dev.")
    .weight(7)
    .effect({
      type: "grant_char_dev",
      grantType: "char_dev",
      grantName: "random",
      grantCount: 3,
      timing: "on_round_16",
      target: "self",
    })
    .register();

  // === GREAT RUNES (Golden Order Sub-Types) ===

  // Godrick
  defineEffect("house_sub", "Godrick")
    .description("Nhận +1 all stats.")
    .weight(13)
    .addAllStats(1)
    .register();

  // Unborn
  defineEffect("house_sub", "Unborn")
    .description(
      "Re-Spin lại chỉ số thấp nhất 1 lần. +4 vào Stat thấp nhất sau đó.",
    )
    .weight(13)
    .effect({
      type: "stat_respin",
      stat: "lowest",
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 4,
      timing: "immediate",
      target: "self",
    })
    .register();

  // Radahn
  defineEffect("house_sub", "Radahn")
    .description("Nhận +2 Dura, +2 MA, +2 Str.")
    .weight(13)
    .addStat("durability", 2)
    .addStat("ma", 2)
    .addStat("strength", 2)
    .register();

  // Rykard
  defineEffect("house_sub", "Rykard")
    .description("Nhận 4 Quirk, nhưng sẽ nhận -2 Stat cao nhất.")
    .weight(13)
    .effect({
      type: "grant_quirk",
      grantType: "quirk",
      grantName: "random",
      grantCount: 4,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "highest",
      value: -2,
      timing: "immediate",
      target: "self",
    })
    .register();

  // Mohg
  defineEffect("house_sub", "Mohg")
    .description(
      "Sau mỗi trận đấu, +2 vào Stat thấp nhất và +1 vào Stat bất kì.",
    )
    .weight(13)
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 2,
      timing: "after_combat",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 1,
      timing: "after_combat",
      target: "self",
    })
    .register();

  // Morgott
  defineEffect("house_sub", "Morgott")
    .description("Nhận +4 Dura.")
    .weight(13)
    .addStat("durability", 4)
    .register();

  // Malenia
  defineEffect("house_sub", "Malenia")
    .description("Sau combat: hút 2 Dura của đối thủ.")
    .weight(13)
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: 2,
      timing: "after_combat",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: -2,
      timing: "after_combat",
      target: "opponent",
    })
    .register();

  // Miquella
  defineEffect("house_sub", "Miquella")
    .description("Nhận 3 Power.")
    .weight(9)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 3,
      timing: "immediate",
      target: "self",
    })
    .register();

  // === BLESSINGS OF THE DEEP (Naga Sub-Types) ===

  // Wisdom
  defineEffect("house_sub", "Wisdom")
    .description("Chỉ số thấp nhất nhận +4. Nhận ngẫu nhiên 1 Power.")
    .weight(30)
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 4,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  // Might
  defineEffect("house_sub", "Might")
    .description(
      "Chỉ số có Base cao nhất bị kéo xuống 0. Với mỗi 3 điểm mất đi, nhận +1 vào all stats khác.",
    )
    .weight(30)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "blessing_might_convert_stat",
    })
    .register();

  // Reforge
  defineEffect("house_sub", "Reforge")
    .description(
      "Nhận 1 Rune nếu có thể. Nếu không thể, nhận +1 all stats thay vào đó.",
    )
    .weight(30)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "blessing_reforge_rune",
    })
    .register();

  // Old Gods
  defineEffect("house_sub", "Old Gods")
    .description("Nhận 1 Creator's Favor.")
    .weight(10)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "Creator's Favor",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  // ============================================================================
  // MASON ENHANCED HOUSE FEATURES
  // ============================================================================

  // Winterhome Mason - 2 Gear + +1 all other stats per 5 Base Dura
  defineEffect("house_sub", "Winterhome Mason")
    .description(
      "(Mason) Nhận 2 Normal Gear và +1 vào all stats khác ngoài Dura với mỗi 5 Base Dura.",
    )
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "random",
      grantCount: 2,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "winterhome_mason_dura_bonus",
    })
    .register();

  // Atreides Mason - +2 Base Stat cao nhất + sau combat +1 Base Stat cao nhất
  defineEffect("house_sub", "Atreides Mason")
    .description(
      "(Mason) Nhận +2 vào Base Stat Cao Nhất. Sau Combat: Nhận +1 vào Base Stat Cao Nhất.",
    )
    .effect({
      type: "stat_modifier",
      stat: "highest",
      value: 2,
      isBase: true,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "highest",
      value: 1,
      isBase: true,
      timing: "after_combat",
      target: "self",
    })
    .register();

  // House Lannister Mason - 6 Golden Coin + 2 random Gear
  defineEffect("house_sub", "House Lannister Mason")
    .description('(Mason) Nhận 6 Gear "Golden Coin" và 2 Gear ngẫu nhiên.')
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "Golden Coin",
      grantCount: 6,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "random",
      grantCount: 2,
      timing: "immediate",
      target: "self",
    })
    .register();

  // House Stark Mason - 1 Dire Wolf + 1 Unique Weapon
  defineEffect("house_sub", "House Stark Mason")
    .description('(Mason) Nhận 1 "Dire Wolf" và 1 Unique Weapon.')
    .effect({
      type: "grant_wheel",
      wheelName: "Dire Wolf Wheel",
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "grant_wheel",
      wheelName: "Unique Weapon Wheel",
      timing: "immediate",
      target: "self",
    })
    .register();

  // House Baratheon Mason - base effect + +1 all stats
  defineEffect("house_sub", "House Baratheon Mason")
    .description(
      "(Mason) Nhận +1 Str, +1 BIQ, +1 MA, Base Stat thấp nhất +2, và thêm +1 all stats.",
    )
    .addStat("strength", 1)
    .addStat("biq", 1)
    .addStat("ma", 1)
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 2,
      isBase: true,
      timing: "immediate",
      target: "self",
    })
    .addAllStats(1)
    .register();

  // House Tyrell Mason - +3 Base Stat thấp nhất sau combat
  defineEffect("house_sub", "House Tyrell Mason")
    .description("(Mason) Sau Combat: Nhận +3 vào Base Stat thấp nhất.")
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 3,
      isBase: true,
      timing: "after_combat",
      target: "self",
    })
    .register();

  // Kazuya Kinoshita's House Mason - 1 Golden Coin + +1 Stat thấp nhất sau combat
  defineEffect("house_sub", "Kazuya Kinoshita's House Mason")
    .description(
      '(Mason) Sau Combat: Nhận 1 Gear "Golden Coin" và +1 vào Stat thấp nhất.',
    )
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "Golden Coin",
      grantCount: 1,
      timing: "after_combat",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 1,
      timing: "after_combat",
      target: "self",
    })
    .register();

  // Shurima Mason - 1 Legacy Gear + 1 Unique Weapon
  defineEffect("house_sub", "Shurima Mason")
    .description("(Mason) Nhận 1 Legacy Gear và 1 Unique Weapon.")
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "Legacy Gear",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "grant_wheel",
      wheelName: "Unique Weapon Wheel",
      timing: "immediate",
      target: "self",
    })
    .register();

  // Hallownest Mason - Weapon + 3 Rune
  defineEffect("house_sub", "Hallownest Mason")
    .description(
      "(Mason) Chắc chắn có Weapon, chắc chắn có 3 Rune lên Weapon đó.",
    )
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "hallownest_mason_guaranteed_weapon_3_runes",
    })
    .register();

  // Golden Order Mason - 1 Great Rune + Char Dev Shardbearer
  defineEffect("house_sub", "Golden Order Mason")
    .description("(Mason) Nhận 1 Great Rune và Char Dev Shardbearer.")
    .effect({
      type: "grant_wheel",
      wheelName: "Great Rune Wheel",
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "grant_char_dev",
      grantType: "char_dev",
      grantName: "Shardbearer",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  // Ban Nhạc Ngọt Đoàn Kết Mason - 2 Gear thay vì 1
  defineEffect("house_sub", "Ban Nhạc Ngọt Đoàn Kết Mason")
    .description("(Mason) Nhận 2 trong 5 Gear: Kẹo, Ớt, Mì Tôm, Bò Khô, Radio.")
    .effect({
      type: "grant_wheel",
      wheelName: "Ban Nhạc Ngọt Gear Wheel",
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "grant_wheel",
      wheelName: "Ban Nhạc Ngọt Gear Wheel",
      timing: "immediate",
      target: "self",
    })
    .register();

  // Tracen Academy Mason - sau combat +1 stat bất kì (GM action)
  defineEffect("house_sub", "Tracen Academy Mason")
    .description("(Mason) Sau Combat: Nhận +1 vào 1 Stat bất kì [GM Action].")
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 1,
      timing: "after_combat",
      target: "self",
    })
    .register();
}

// ============================================================================
// IMMEDIATE HANDLERS
// ============================================================================

registerImmediateHandler(
  "hallownest_guaranteed_weapon_runes",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Chắc chắn nhận 1 Weapon và 2 Rune lên Weapon đó (Hallownest)",
    };
  },
  "Guaranteed weapon + 2 runes",
);

registerImmediateHandler(
  "hallownest_mason_guaranteed_weapon_3_runes",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Chắc chắn nhận 1 Weapon và 3 Rune lên Weapon đó (Hallownest Mason)",
    };
  },
  "Guaranteed weapon + 3 runes (Mason)",
);

registerImmediateHandler(
  "tracen_academy_random_stats",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const strBonus = Math.floor(Math.random() * 3) + 1;
    const spdBonus = Math.floor(Math.random() * 3) + 1;
    const durBonus = Math.floor(Math.random() * 3) + 1;
    return {
      statModifiers: [
        { stat: "strength", value: strBonus },
        { stat: "speed", value: spdBonus },
        { stat: "durability", value: durBonus },
      ],
      skipDefault: true,
      description: `Tracen Academy: +${strBonus} Str, +${spdBonus} Spd, +${durBonus} Dur`,
    };
  },
  "Random 1-3 for Str/Spd/Dur",
);

registerImmediateHandler(
  "blessing_might_convert_stat",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    let highestStat: StatName = "strength";
    let highestVal = ctx.baseStats.strength;
    for (const stat of STAT_NAMES) {
      const val = ctx.baseStats[stat as keyof CharacterStats] as number;
      if (val > highestVal) {
        highestVal = val;
        highestStat = stat;
      }
    }
    const bonus = Math.floor(highestVal / 3);
    const mods: Array<{ stat: StatName; value: number; isBase?: boolean }> = [];
    mods.push({ stat: highestStat, value: -highestVal, isBase: true });
    for (const stat of STAT_NAMES) {
      if (stat !== highestStat) {
        mods.push({ stat, value: bonus });
      }
    }
    return {
      statModifiers: mods,
      skipDefault: true,
      description: `Blessing of Might: ${highestStat} (${highestVal}) → 0, +${bonus} all other stats`,
    };
  },
  "Convert highest base stat to +1 all others per 3 points",
);

registerImmediateHandler(
  "blessing_reforge_rune",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const weapons = ctx.character.weapons || [];
    const hasWeapon = weapons.length > 0;
    if (hasWeapon) {
      return {
        skipDefault: true,
        description: "Blessing of Reforge: Nhận 1 Rune lên Weapon",
      };
    }
    return {
      statModifiers: STAT_NAMES.map((stat) => ({ stat, value: 1 })),
      skipDefault: true,
      description: "Blessing of Reforge: Không có Weapon → +1 all stats",
    };
  },
  "Grant 1 Rune or +1 all stats if no weapon",
);

registerImmediateHandler(
  "winterhome_mason_dura_bonus",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const baseDura = ctx.baseStats.durability ?? 0;
    const bonus = Math.floor(baseDura / 5);
    if (bonus === 0) {
      return {
        skipDefault: true,
        description: `Winterhome Mason: Base Dura ${baseDura} < 5, không nhận bonus`,
      };
    }
    const mods = STAT_NAMES.filter((s) => s !== "durability").map((stat) => ({
      stat,
      value: bonus,
    }));
    return {
      statModifiers: mods,
      skipDefault: true,
      description: `Winterhome Mason: +${bonus} vào all stats trừ Dura (${baseDura} Base Dura / 5)`,
    };
  },
  "+1 all other stats per 5 Base Dura (Winterhome Mason)",
);

export function registerHouseImmediateHandlers() {
  // All handlers registered at module level above.
}

// ============================================================================
// COMBAT HANDLERS
// ============================================================================

registerCombatHandler(
  "dothraki_random_stat_compare",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description:
        "Dothraki: Stat được đọ trong trận sẽ tuân theo luật ngẫu nhiên được quay ra",
    };
  },
  "Randomize stat comparison order in combat",
);

registerCombatHandler(
  "coven_council_death_bonus",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description:
        "[GM Action] Coven Council bị loại: 1 Player ngẫu nhiên KHÔNG thuộc Coven được Re-Spin 1 stat bất kì",
    };
  },
  "On death: random non-Coven player re-spins 1 stat (GM action required)",
);

registerCombatHandler(
  "roundtable_hold_retry",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.self.roundsLost <= ctx.self.roundsWon) {
      return {
        description:
          "Roundtable Hold: Chưa kích hoạt (Chưa trước ngưỡng bị loại)",
      };
    }
    const opponentHouses = (ctx.opponent?.character.houses || [])
      .filter((h: any) => !h.isLost)
      .map((h: any) => h.name);
    const opponentIsTarnished = opponentHouses.includes("Roundtable Hold");
    if (opponentIsTarnished) {
      return {
        description:
          "Roundtable Hold: Không kích hoạt — đối thủ cũng là Tarnished",
      };
    }
    return {
      description:
        "[GM Action] Roundtable Hold: Gọi một Tarnished còn sống lên đấu trận phụ. Kết quả trận phụ quyết định số phận của người thua.",
    };
  },
  "On loss: call another Tarnished for a sub-match (once, skips if opponent is also Tarnished)",
);

registerCombatHandler(
  "check_enemy_is_same_house",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const opponentHouses = (ctx.opponent.character.houses || [])
      .filter((h: any) => !h.isLost)
      .map((h: any) => h.name);
    const opponentInUchiha = opponentHouses.some((name: string) =>
      name.toLowerCase().includes("uchiha"),
    );
    if (!opponentInUchiha) {
      return {
        skipDefault: true,
        description: "Uchiha: đối thủ không cùng Uchiha, không nhận bonus thêm",
      };
    }
    return {
      selfStatMods: [
        { stat: "durability", value: 2 },
        { stat: "biq", value: 2 },
      ],
      description: "Uchiha vs Uchiha: nhận thêm +2 Dura và +2 BIQ",
    };
  },
  "After win vs same Uchiha house member: grant +2 Dura and +2 BIQ again",
);

registerCombatHandler(
  "grey_wind_death_bonus",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description:
        "Grey Wind: Khi bị loại, tất cả người nhà Stark nhận +1 all stats",
    };
  },
  "+1 all stats to all Stark players on death",
);

registerCombatHandler(
  "shaggydog_house_bonus",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description:
        "Shaggydog: Sau combat, tất cả người nhà Stark nhận +1 Stat thấp nhất",
    };
  },
  "+1 lowest stat to all Stark players after combat",
);

export function registerHouseCombatHandlers() {
  // All handlers registered at module level above.
}
