/**
 * Race Effects Data
 *
 * Dữ liệu effects cho các Race và Sub-race
 * Nguồn: wheelofmultiverse-ss3.xlsx - Sheet "Race" và "Sub-race wheel"
 */

import { defineEffect } from "../registry";

// ============================================================================
// MAIN RACES
// ============================================================================

export function registerRaces() {
  // Symbiosis
  defineEffect("race", "Symbiosis")
    .description(
      "Quay 1 loại ký sinh.\nKí sinh lên 1 người chơi. Tiền thưởng chia đều. Khi host chết, bạn cũng bị loại.",
    )
    .weight(1.5)
    .tier(1)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "symbiosis_link",
    })
    .register();

  // Goblin - No trait
  defineEffect("race", "Goblin")
    .description("Quay Goblin Horde.\nKhông có trait đặc biệt.")
    .weight(6.5)
    .tier(10)
    .register();

  // Gnome - No trait
  defineEffect("race", "Gnome")
    .description("Không có trait đặc biệt.")
    .weight(6.5)
    .tier(10)
    .register();

  // Human - No trait
  defineEffect("race", "Human")
    .description("Quay Skin Color.\n Không có trait đặc biệt.")
    .weight(6.5)
    .tier(10)
    .register();

  // Dwarf - No trait
  defineEffect("race", "Dwarf")
    .description("Quay Dwarf's Type.\nKhông có trait đặc biệt.")
    .weight(6.5)
    .tier(10)
    .register();

  // Skeleton
  defineEffect("race", "Skeleton")
    .description(
      "Quay Bone Lineage.\nSau 2 PvP thắng: tiến hóa Lich (IQ=8). Sau 4 PvP thắng: Lich King (+1 all). Miễn nhiễm AIDS.",
    )
    .weight(5.25)
    .tier(8)
    .immuneTo("AIDS")
    .effect({
      type: "evolve",
      evolveTo: "Lich",
      timing: "after_combat_win",
      target: "self",
      conditions: [
        { type: "pvp_win_count", winCount: 2, winCountOperator: ">=" },
      ],
      triggerOnce: true,
    })
    .effect({
      type: "stat_set",
      stat: "iq",
      value: 8,
      timing: "immediate",
      target: "self",
      conditions: [
        { type: "pvp_win_count", winCount: 2, winCountOperator: ">=" },
      ],
    })
    .effect({
      type: "evolve",
      evolveTo: "Lich King",
      timing: "after_combat_win",
      target: "self",
      conditions: [
        { type: "pvp_win_count", winCount: 4, winCountOperator: ">=" },
      ],
      triggerOnce: true,
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "immediate",
      target: "self",
      conditions: [
        { type: "pvp_win_count", winCount: 4, winCountOperator: ">=" },
      ],
    })
    .register();

  // Troll - No trait
  defineEffect("race", "Troll")
    .description("Quay Troll's Type.\nKhông có trait đặc biệt.")
    .weight(5.25)
    .tier(8)
    .register();

  // Orc
  defineEffect("race", "Orc")
    .description("+2 stat thấp nhất khi thắng, -3 stat cao nhất khi thua.")
    .weight(5.25)
    .tier(8)
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 2,
      timing: "after_combat_win",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "highest",
      value: -3,
      timing: "after_combat_lose",
      target: "self",
    })
    .register();

  // Merfolk
  defineEffect("race", "Merfolk")
    .description('Thuộc House "Naga", không có vòng quay House.')
    .weight(5.25)
    .tier(8)
    .effect({
      type: "house_assign",
      grantName: "Naga",
      timing: "immediate",
      target: "self",
    })
    .register();

  // Dryad
  defineEffect("race", "Dryad")
    .description(
      "Khi Dryad khác chết: +2 random stat. Dryad cuối cùng: tiến hóa Yggdrasil +9 random stat.",
    )
    .weight(4.5)
    .tier(7)
    .effect({
      type: "stat_modifier",
      stat: "random",
      value: 2,
      timing: "on_death",
      target: "all_same_race",
      customHandler: "dryad_death_buff",
    })
    .effect({
      type: "evolve",
      evolveTo: "Yggdrasil",
      timing: "on_death",
      target: "self",
      customHandler: "dryad_last_standing",
    })
    .register();

  // Elf - No trait
  defineEffect("race", "Elf")
    .description("Quay Elf's Type.\nKhông có trait đặc biệt.")
    .weight(4.5)
    .tier(7)
    .register();

  // Spirit
  defineEffect("race", "Spirit")
    .description(
      "Mỗi round thua: +1 stack Souls. 6 stack: +2 BIQ. 9 stack: +1 Power. 13 stack: +1 all. 20 stack: gấp đôi. Miễn nhiễm AIDS.",
    )
    .weight(4.5)
    .tier(7)
    .immuneTo("AIDS")
    .effect({
      type: "custom",
      timing: "on_round_lose",
      target: "self",
      stackable: true,
      customHandler: "spirit_souls_stack",
    })
    .register();

  // Uma
  defineEffect("race", "Uma")
    .description(
      'Quay Uma Parents.\nThuộc House "Tracen Academy", không có vòng quay House.',
    )
    .weight(4.5)
    .tier(7)
    .effect({
      type: "house_assign",
      grantName: "Tracen Academy",
      timing: "immediate",
      target: "self",
    })
    .register();

  // Werebeast - No trait (has sub-race effects)
  defineEffect("race", "Werebeast")
    .description("Quay Beast's Type.\nKhông có trait đặc biệt.")
    .weight(4)
    .tier(6)
    .register();

  // Vampire
  defineEffect("race", "Vampire")
    .description('Quay Body Count.\nNhận vòng quay "Khẩu vị độc đáo".')
    .weight(4)
    .tier(6)
    .effect({
      type: "wheel_grant",
      wheelType: "Body Count",
      timing: "immediate",
      target: "self",
    })
    .register();

  // Giant - So sánh dựa trên BASE stats (stats từ vòng quay ban đầu)
  defineEffect("race", "Giant")
    .description(
      "+5 IQ nếu Base IQ > Base Str (-5 Str). +5 Str nếu Base Str > Base IQ (-5 IQ). Bằng nhau: +3 cả hai.",
    )
    .weight(4)
    .tier(6)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 5,
      timing: "immediate",
      target: "self",
      conditions: [
        {
          type: "stat_compare",
          stat: "iq",
          compareWith: "own_stat",
          compareStat: "strength",
          operator: ">",
          useBaseStats: true, // So sánh base stats
        },
      ],
    })
    .effect({
      type: "stat_modifier",
      stat: "strength",
      value: -5,
      timing: "immediate",
      target: "self",
      conditions: [
        {
          type: "stat_compare",
          stat: "iq",
          compareWith: "own_stat",
          compareStat: "strength",
          operator: ">",
          useBaseStats: true,
        },
      ],
    })
    .effect({
      type: "stat_modifier",
      stat: "strength",
      value: 5,
      timing: "immediate",
      target: "self",
      conditions: [
        {
          type: "stat_compare",
          stat: "strength",
          compareWith: "own_stat",
          compareStat: "iq",
          operator: ">",
          useBaseStats: true,
        },
      ],
    })
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: -5,
      timing: "immediate",
      target: "self",
      conditions: [
        {
          type: "stat_compare",
          stat: "strength",
          compareWith: "own_stat",
          compareStat: "iq",
          operator: ">",
          useBaseStats: true,
        },
      ],
    })
    .effect({
      type: "stat_modifier",
      stat: "strength",
      value: 3,
      timing: "immediate",
      target: "self",
      conditions: [
        {
          type: "stat_compare",
          stat: "strength",
          compareWith: "own_stat",
          compareStat: "iq",
          operator: "=",
          useBaseStats: true,
        },
      ],
    })
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 3,
      timing: "immediate",
      target: "self",
      conditions: [
        {
          type: "stat_compare",
          stat: "strength",
          compareWith: "own_stat",
          compareStat: "iq",
          operator: "=",
          useBaseStats: true,
        },
      ],
    })
    .register();

  // Dragon - No trait
  defineEffect("race", "Dragon")
    .description("Quay Dragon's Type.\nKhông có trait đặc biệt.")
    .weight(4)
    .tier(6)
    .register();

  // Reincarnator
  defineEffect("race", "Reincarnator")
    .description(
      "Chuyển sinh thành player mùa 2.5, nhận Base Stats và tộc của người đó.",
    )
    .weight(2)
    .tier(3)
    .unique()
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "reincarnator_transform",
    })
    .register();

  // Angel
  defineEffect("race", "Angel")
    .description(
      'Quay Angel Rank.\nNhận Archetype "Pacifist" từ đầu (sẽ nhận thêm một Archetype nữa).',
    )
    .weight(3.5)
    .tier(5)
    .effect({
      type: "grant_archetype",
      grantName: "Pacifist",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  // Demi-God
  defineEffect("race", "Demi-God")
    .description(
      "Quay God's Gifts.\n+1 all stats vs Human, -1 all stats vs God.",
    )
    .weight(3.5)
    .tier(5)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [{ type: "race_match", races: ["Human"] }],
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -1,
      timing: "during_combat",
      target: "self",
      conditions: [{ type: "race_match", races: ["God"] }],
    })
    .register();

  // Primordial Being
  defineEffect("race", "Primordial Being")
    .description(
      "Quay Elemental Wheel.\nMỗi khi thắng Combat, nhận lại Elemental Wheel một lần nữa.",
    )
    .weight(3.5)
    .tier(5)
    .effect({
      type: "wheel_grant",
      wheelType: "Elemental",
      timing: "after_combat_win",
      target: "self",
    })
    .register();

  // Demon
  defineEffect("race", "Demon")
    .description("Nhận vòng quay Sins Wheel.")
    .weight(2.5)
    .tier(4)
    .unique()
    .effect({
      type: "wheel_grant",
      wheelType: "Sins",
      timing: "immediate",
      target: "self",
    })
    .register();

  // God
  defineEffect("race", "God")
    .description("Nhận vòng quay God Wheel.")
    .weight(2.5)
    .tier(4)
    .unique()
    .effect({
      type: "wheel_grant",
      wheelType: "God",
      timing: "immediate",
      target: "self",
    })
    .register();
}

// ============================================================================
// SUB-RACES: GOBLIN HORDE
// ============================================================================

export function registerGoblinSubRaces() {
  defineEffect("sub_race", "Goblin Horde 1")
    .description("-1 all stats. Mỗi PvP thắng: +1 all stats.")
    .weight(5)
    .addAllStats(-1)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "after_combat_win",
      target: "self",
    })
    .register();

  defineEffect("sub_race", "Goblin Horde 50")
    .description("-1 all stats.")
    .weight(10)
    .addAllStats(-1)
    .register();

  defineEffect("sub_race", "Goblin Horde 100")
    .description("Bạn là 1 con Goblin.")
    .weight(25)
    .register();

  defineEffect("sub_race", "Goblin Horde 1000")
    .description("+1 Strength.")
    .weight(25)
    .addStat("strength", 1)
    .register();

  defineEffect("sub_race", "Goblin Horde 5000")
    .description("+1 Strength, +1 Speed.")
    .weight(20)
    .addStat("strength", 1)
    .addStat("speed", 1)
    .register();

  defineEffect("sub_race", "Goblin Horde 10000")
    .description("+2 Strength, +2 Speed.")
    .weight(10)
    .addStat("strength", 2)
    .addStat("speed", 2)
    .register();

  defineEffect("sub_race", "Goblin Horde 100000")
    .description("+1 all stats. Nhận 1 Gear. Chắc chắn nhận Unique Weapon.")
    .weight(5)
    .addAllStats(1)
    .grantGear("random", 1)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "goblin_100k_unique_weapon",
    })
    .register();
}

// Helper for grantGear
declare module "../registry" {
  interface EffectEntryBuilder {
    grantGear(name: string, count: number): EffectEntryBuilder;
  }
}

import { EffectEntryBuilder } from "../registry";
EffectEntryBuilder.prototype.grantGear = function (
  name: string = "random",
  count: number = 1,
) {
  return this.effect({
    type: "grant_gear",
    grantType: "gear",
    grantName: name,
    grantCount: count,
    timing: "immediate",
    target: "self",
  });
};

// ============================================================================
// SUB-RACES: ELF TYPES
// ============================================================================

export function registerElfSubRaces() {
  defineEffect("sub_race", "High Elf")
    .description("+2 Base IQ.")
    .weight(9)
    .addStat("iq", 2, true)
    .register();

  defineEffect("sub_race", "Dark Elf")
    .description("+2 Base BIQ.")
    .weight(8)
    .addStat("biq", 2, true)
    .register();

  defineEffect("sub_race", "Wood Elf")
    .description("Nhận 1 random Power và +1 BIQ.")
    .weight(20)
    .grantPower()
    .addStat("biq", 1)
    .register();

  defineEffect("sub_race", "Sea Elf")
    .description("Nhận 1 random Power và +1 Dura.")
    .weight(14)
    .grantPower()
    .addStat("durability", 1)
    .register();

  defineEffect("sub_race", "Moon Elf")
    .description("Nhận 1 random Power và Quay 1 Lover.")
    .weight(14)
    .grantPower()
    .effect({
      type: "grant_lover",
      grantType: "lover",
      grantName: "random",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("sub_race", "Sun Elf")
    .description("Nhận 1 random Power và +1 MA.")
    .weight(14)
    .grantPower()
    .addStat("ma", 1)
    .register();

  defineEffect("sub_race", "Star Elf")
    .description("Nhận 1 random Power và +1 Speed.")
    .weight(14)
    .grantPower()
    .addStat("speed", 1)
    .register();

  defineEffect("sub_race", "Lythari")
    .description("+3 Base Speed.")
    .weight(7)
    .addStat("speed", 3, true)
    .register();
}

// ============================================================================
// SUB-RACES: DWARF TYPES
// ============================================================================

export function registerDwarfSubRaces() {
  defineEffect("sub_race", "Lùn núi")
    .description("+3 Strength.")
    .weight(25)
    .addStat("strength", 3)
    .register();

  defineEffect("sub_race", "Mountain Dwarf")
    .description("+3 Strength.")
    .weight(25)
    .addStat("strength", 3)
    .register();

  defineEffect("sub_race", "Lùn xám")
    .description("+3 Durability.")
    .weight(25)
    .addStat("durability", 3)
    .register();

  defineEffect("sub_race", "Gray Dwarf")
    .description("+3 Durability.")
    .weight(25)
    .addStat("durability", 3)
    .register();

  defineEffect("sub_race", "Cổ Lùn")
    .description("+2 Speed, +2 BIQ, +2 MA.")
    .weight(10)
    .addStat("speed", 2)
    .addStat("biq", 2)
    .addStat("ma", 2)
    .register();

  defineEffect("sub_race", "Ancient Dwarf")
    .description("+2 Speed, +2 BIQ, +2 MA.")
    .weight(10)
    .addStat("speed", 2)
    .addStat("biq", 2)
    .addStat("ma", 2)
    .register();

  defineEffect("sub_race", "Lùn thường")
    .description("Bạn là 1 người lùn...")
    .weight(40)
    .register();
}

// ============================================================================
// SUB-RACES: TROLL TYPES
// ============================================================================

export function registerTrollSubRaces() {
  defineEffect("sub_race", "Regular Troll")
    .description("Một con Troll thường.")
    .weight(42)
    .register();

  defineEffect("sub_race", "Ice Troll")
    .description("Debuff: Đối thủ -2 Spd.")
    .weight(30)
    .debuffOpponent("speed", 2)
    .register();

  defineEffect("sub_race", "Mountain Troll")
    .description("+3 Dura.")
    .weight(25)
    .addStat("durability", 3)
    .register();

  defineEffect("sub_race", "Lich Troll")
    .description("Nhận 1 Power của player đã chết sau mỗi trận đấu.")
    .weight(3)
    .effect({
      type: "steal_power",
      grantCount: 1,
      timing: "after_combat",
      target: "self",
      customHandler: "lich_troll_steal_dead",
    })
    .register();
}

// ============================================================================
// SUB-RACES: DRAGON TYPES
// ============================================================================

export function registerDragonSubRaces() {
  defineEffect("sub_race", "Crimson Dragon")
    .description("+2 Base IQ và +1 Base Dura.")
    .weight(9)
    .addStat("iq", 2, true)
    .addStat("durability", 1, true)
    .register();

  defineEffect("sub_race", "Stone Dragon")
    .description("+2 Base Durability.")
    .weight(9)
    .addStat("durability", 2, true)
    .register();

  defineEffect("sub_race", "Amethyst Dragon")
    .description("-1 All Stats, nhận 4 Power.")
    .weight(9)
    .addAllStats(-1)
    .grantPower("random", 4)
    .register();

  defineEffect("sub_race", "Ancient Dragon")
    .description("Trong combat: Vô hiệu hóa vũ khí của đối phương.")
    .weight(9)
    .effect({
      type: "weapon_disable",
      timing: "during_combat",
      target: "opponent",
    })
    .register();

  defineEffect("sub_race", "Undead Dragon")
    .description("Nhận 1 Summon và +1 Dura.")
    .weight(9)
    .effect({
      type: "grant_summon",
      grantType: "summon",
      grantName: "random",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .addStat("durability", 1)
    .register();

  defineEffect("sub_race", "Zephyrian Dragon")
    .description("Nhận 1 Power và 1 Quirk.")
    .weight(9)
    .grantPower()
    .grantQuirk()
    .register();

  defineEffect("sub_race", "Tideborn Dragon")
    .description("+3 Base Strength.")
    .weight(9)
    .addStat("strength", 3, true)
    .register();

  defineEffect("sub_race", "Thunder Dragon")
    .description("[PvE Only] +1 điểm khởi đầu. Khi thua, không chịu hình phạt.")
    .weight(10)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "self",
    })
    .effect({
      type: "immunity",
      immuneTo: ["pve_penalty"],
      timing: "pve_only",
      target: "self",
    })
    .register();

  defineEffect("sub_race", "Flame Dragon")
    .description("Nhận 1 Power và +2 vào Stat thấp nhất.")
    .weight(12)
    .grantPower()
    .addStat("lowest", 2)
    .register();

  defineEffect("sub_race", "Ice Dragon")
    .description("+1 Char Dev và +2 vào Stat thấp nhất.")
    .weight(10)
    .effect({
      type: "grant_char_dev",
      grantType: "char_dev",
      grantName: "random",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .addStat("lowest", 2)
    .register();

  defineEffect("sub_race", "Chaos Dragon")
    .description("Nhận 3 Quirk.")
    .weight(5)
    .grantQuirk("random", 3)
    .register();
}

// ============================================================================
// SUB-RACES: ANGEL RANKS
// ============================================================================

export function registerAngelSubRaces() {
  defineEffect("sub_race", "Angels")
    .description("Không có gì đặc biệt.")
    .weight(40)
    .register();

  defineEffect("sub_race", "Archangels")
    .description("+2 Speed và +1 Martial Arts.")
    .weight(21)
    .addStat("speed", 2)
    .addStat("ma", 1)
    .register();

  defineEffect("sub_race", "Principalities")
    .description("Sau combat: +2 vào stat thấp nhất.")
    .weight(9)
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 2,
      timing: "after_combat",
      target: "self",
    })
    .register();

  defineEffect("sub_race", "Powers")
    .description('Nhận Archetype "Paladin". +2 MA.')
    .weight(8)
    .effect({
      type: "grant_archetype",
      grantName: "Paladin",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .addStat("ma", 2)
    .register();

  defineEffect("sub_race", "Virtues")
    .description("Không thể bị dính debuff.")
    .weight(7)
    .immuneTo("debuff")
    .register();

  defineEffect("sub_race", "Dominions")
    .description("Nhận 2 Power.")
    .weight(6)
    .grantPower("random", 2)
    .register();

  defineEffect("sub_race", "Ophanim")
    .description("+1 all stats.")
    .weight(5)
    .addAllStats(1)
    .register();

  defineEffect("sub_race", "Cherubim")
    .description("+2 all stats.")
    .weight(4)
    .addAllStats(2)
    .register();
}

// ============================================================================
// SUB-RACES: HUMAN SKIN COLORS
// ============================================================================

export function registerHumanSubRaces() {
  defineEffect("sub_race", "Trắng")
    .description("Chắc chắn dùng được tất cả vũ khí và chắc chắn có vũ khí.")
    .weight(30)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "human_white_weapon_usable",
    })
    .register();

  defineEffect("sub_race", "Vàng")
    .description("Base IQ không thể dưới 5.")
    .weight(35)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "human_yellow_min_iq",
    })
    .register();

  defineEffect("sub_race", "Đen")
    .description("Base Dura không thể dưới 5.")
    .weight(35)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "human_black_min_dura",
    })
    .register();
}

// ============================================================================
// REGISTER ALL
// ============================================================================

export function registerAllRaceEffects() {
  registerRaces();
  registerGoblinSubRaces();
  registerElfSubRaces();
  registerDwarfSubRaces();
  registerTrollSubRaces();
  registerDragonSubRaces();
  registerAngelSubRaces();
  registerHumanSubRaces();
}
