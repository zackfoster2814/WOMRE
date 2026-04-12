/**
 * Race Effects — Source
 * Gộp từ: data/races.ts, data/uma-parents.ts, handlers/immediate/race-handlers.ts, handlers/combat/race-combat-handlers.ts
 */

import { defineEffect } from '../registry';
import { EffectEntryBuilder } from '../registry';
import { registerImmediateHandler } from '../handlers/registry';
import { registerCombatHandler } from '../handlers/registry';
import type { ImmediateHandlerContext, ImmediateHandlerResult } from '../handlers/types';
import type { CombatHandlerContext, CombatHandlerResult } from '../handlers/types';
import type { StatName } from '../types';

const STAT_NAMES: StatName[] = ['strength', 'speed', 'durability', 'iq', 'biq', 'ma'];

// Helper for grantGear (from races.ts)
declare module '../registry' {
  interface EffectEntryBuilder {
    grantGear(name: string, count: number): EffectEntryBuilder;
  }
}

EffectEntryBuilder.prototype.grantGear = function (
  name: string = 'random',
  count: number = 1,
) {
  return this.effect({
    type: 'grant_gear',
    grantType: 'gear',
    grantName: name,
    grantCount: count,
    timing: 'immediate',
    target: 'self',
  });
};

// ============================================================================
// RACE EFFECT DEFINITIONS
// ============================================================================

export function registerAllRaceEffects() {
  // ============================================================================
  // MAIN RACES
  // ============================================================================

  // Symbiosis
  defineEffect("race", "Symbiosis")
    .description(
      "Nhận 1 vòng quay hoàn toàn khác biệt, kí sinh lên 1 người chơi hiện tại trong mùa, tiền thưởng của một trong hai giành được sẽ được chia đều cho cả hai. Khi người chơi bị kí sinh chết đi, bạn cũng sẽ bị loại. Một người chơi không thể cùng lúc được 2 symbios kí sinh. Mỗi khi roll ra tộc này, mùa +1 Player.",
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
  // IQ của Skeleton LUÔN là 1, không thể tăng hay giảm bằng bất kỳ cách nào
  // Chỉ khi tiến hóa thành Lich thì IQ mới thay đổi (thành 8)
  defineEffect("race", "Skeleton")
    .description(
      "Sau 2 trận PvP thắng, tiến hóa thành Lich, IQ được cố định thành 8. Sau 4 trận thắng PvP, tiến hóa thành Lich King, nhận +1 all stats. Bạn không thể bị AIDS.",
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
    .description("Không có 💀")
    .weight(5.25)
    .tier(8)
    .register();

  // Orc
  defineEffect("race", "Orc")
    .description("Nhận +2 vào chỉ số thấp nhất khi thắng và -3 vào chỉ số cao nhất khi thua.")
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
    .description('Người chơi thuộc về House "Naga" và không có vòng quay House.')
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
      "Khi mỗi Dryad chết đi, một Dryad ngẫu nhiên còn sống sẽ nhận +2 vào 1 chỉ số ngẫu nhiên. Khi chỉ còn duy nhất 1 Dryad, người đó tiến hóa thành Yggdrasil và +9 Base vào 1 chỉ số ngẫu nhiên.",
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
    .description("Không có 💀")
    .weight(4.5)
    .tier(7)
    .register();

  // Spirit
  defineEffect("race", "Spirit")
    .description(
      'Mỗi khi thua 1 round đấu, nhận 1 stack "Souls" (stack vĩnh viễn). Nhận hiệu ứng tương đương với số stack ở dưới (bao gồm cả các mốc trước đó): 6 Stack: Nhận +2 BIQ. 9 Stack: Nhận 1 Power ngẫu nhiên. 13 Stack: Nhận +1 all stats. 20 Stack: Gấp đôi tất cả các hiệu ứng trước đó. Bạn không thể bị AIDS.',
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
      'Người chơi thuộc về House "Tracen Academy" và không có vòng quay House.',
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
    .description('Nhận vòng quay "Khẩu vị độc đáo".')
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
      "Nhận +5 IQ nếu sau vòng quay base stats IQ > Strength. (Và -5 Strength). Nhận +5 Strength nếu sau vòng quay base stats Strength > IQ. (Và -5 IQ). Nếu cả hai bằng nhau sau vòng quay base stats, nhận +3 Strength và IQ.",
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
    .description("Không có 💀")
    .weight(4)
    .tier(6)
    .register();

  // Reincarnator
  defineEffect("race", "Reincarnator")
    .description(
      "Chuyển sinh thành 1 người chơi của mùa 2.5, nhận Base Stats và tộc của người đó. Các vòng quay còn lại quay như bình thường.",
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
      'Nhận Archetype "Pacifist" từ đầu (sẽ nhận thêm một Archetype nữa).',
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
      "Nhận +1 all stats khi đối đầu với Human và -1 all stats khi đối đầu với God.",
    )
    .weight(3.5)
    .tier(5)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "before_combat",
      target: "self",
      conditions: [{ type: "race_match", races: ["Human"] }],
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -1,
      timing: "before_combat",
      target: "self",
      conditions: [{ type: "race_match", races: ["God"] }],
    })
    .register();

  // Primordial Being
  defineEffect("race", "Primordial Being")
    .description(
      "Cứ mỗi khi thắng Combat, nhận lại Elemental Wheel một lần nữa.",
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

  // ============================================================================
  // SUB-RACES: GOBLIN HORDE
  // ============================================================================

  // Sub-race là số lượng goblin trong đàn
  // Cả tên "1" và "Goblin Horde 1" đều được register để support cả 2 format

  // Tier 1: 1 goblin - weight 5
  defineEffect("sub_race", "1")
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

  // Tier 2: 50 goblins - weight 10
  defineEffect("sub_race", "50")
    .description("-1 all stats.")
    .weight(10)
    .addAllStats(-1)
    .register();

  defineEffect("sub_race", "Goblin Horde 50")
    .description("-1 all stats.")
    .weight(10)
    .addAllStats(-1)
    .register();

  // Tier 3: 100 goblins - weight 25
  defineEffect("sub_race", "100")
    .description("Bạn là 1 con Goblin.")
    .weight(25)
    .register();

  defineEffect("sub_race", "Goblin Horde 100")
    .description("Bạn là 1 con Goblin.")
    .weight(25)
    .register();

  // Tier 4: 1000 goblins - weight 25
  defineEffect("sub_race", "1000")
    .description("+1 Strength.")
    .weight(25)
    .addStat("strength", 1)
    .register();

  defineEffect("sub_race", "Goblin Horde 1000")
    .description("+1 Strength.")
    .weight(25)
    .addStat("strength", 1)
    .register();

  // Tier 5: 5000 goblins - weight 20
  defineEffect("sub_race", "5000")
    .description("+1 Strength, +1 Speed.")
    .weight(20)
    .addStat("strength", 1)
    .addStat("speed", 1)
    .register();

  defineEffect("sub_race", "Goblin Horde 5000")
    .description("+1 Strength, +1 Speed.")
    .weight(20)
    .addStat("strength", 1)
    .addStat("speed", 1)
    .register();

  // Tier 6: 10000 goblins - weight 10
  defineEffect("sub_race", "10000")
    .description("+2 Strength, +2 Speed.")
    .weight(10)
    .addStat("strength", 2)
    .addStat("speed", 2)
    .register();

  defineEffect("sub_race", "Goblin Horde 10000")
    .description("+2 Strength, +2 Speed.")
    .weight(10)
    .addStat("strength", 2)
    .addStat("speed", 2)
    .register();

  // Tier 7: 100000 goblins - weight 5
  defineEffect("sub_race", "100000")
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

  // ============================================================================
  // SUB-RACES: ELF TYPES
  // ============================================================================

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

  // ============================================================================
  // SUB-RACES: DWARF TYPES
  // ============================================================================

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

  // ============================================================================
  // SUB-RACES: TROLL TYPES
  // ============================================================================

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

  // ============================================================================
  // SUB-RACES: DRAGON TYPES
  // ============================================================================

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

  // ============================================================================
  // SUB-RACES: ANGEL RANKS
  // ============================================================================

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

  // ============================================================================
  // SUB-RACES: HUMAN SKIN COLORS
  // ============================================================================

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

  // ============================================================================
  // SUB-RACES: VAMPIRE BODY COUNT
  // ============================================================================

  defineEffect("sub_race", "Body Count 1-2")
    .description("-1 all stats.")
    .weight(2.5)
    .addAllStats(-1)
    .register();

  defineEffect("sub_race", "Body Count 10+")
    .description("Mới nhú. Không có hiệu ứng đặc biệt.")
    .weight(5)
    .register();

  defineEffect("sub_race", "Body Count 50+")
    .description("Nhóc. Không có hiệu ứng đặc biệt.")
    .weight(20)
    .register();

  defineEffect("sub_race", "Body Count 500+")
    .description("+1 Speed, +1 IQ.")
    .weight(25)
    .addStat("speed", 1)
    .addStat("iq", 1)
    .register();

  defineEffect("sub_race", "Body Count 2000+")
    .description("+1 Speed, +1 IQ, +1 BIQ.")
    .weight(25)
    .addStat("speed", 1)
    .addStat("iq", 1)
    .addStat("biq", 1)
    .register();

  defineEffect("sub_race", "Body Count 10000+")
    .description("+1 Speed, +1 IQ, +1 BIQ, +1 Durability.")
    .weight(20)
    .addStat("speed", 1)
    .addStat("iq", 1)
    .addStat("biq", 1)
    .addStat("durability", 1)
    .register();

  defineEffect("sub_race", "Body Count 50000+")
    .description("+1 all stats. (Ma cà rồng cổ xưa)")
    .weight(2.5)
    .addAllStats(1)
    .register();

  // ============================================================================
  // SUB-RACES: PRIMORDIAL BEING ELEMENTAL
  // ============================================================================

  defineEffect("sub_race", "Air")
    .description(
      'Nhận Power "Blowing Leaves", +1 Speed, +1 vào Stat thấp nhất.',
    )
    .weight(25)
    .grantPower("Blowing Leaves", 1)
    .addStat("speed", 1)
    .addStat("lowest", 1)
    .register();

  defineEffect("sub_race", "Water")
    .description('Nhận Power "Water Breathing", +1 BIQ, +1 vào Stat cao nhất.')
    .weight(25)
    .grantPower("Water Breathing", 1)
    .addStat("biq", 1)
    .addStat("highest", 1)
    .register();

  defineEffect("sub_race", "Fire")
    .description('Nhận Power "Fire Control", +1 MA, nhận thêm 1 Power.')
    .weight(25)
    .grantPower("Fire Control", 1)
    .addStat("ma", 1)
    .grantPower("random", 1)
    .register();

  defineEffect("sub_race", "Earth")
    .description('Nhận Power "Earth-Shaking", +1 Strength, nhận thêm 1 Quirk.')
    .weight(25)
    .grantPower("Earth-Shaking", 1)
    .addStat("strength", 1)
    .grantQuirk("random", 1)
    .register();

  // ============================================================================
  // SUB-RACES: UMA PARENTS (from races.ts registerUmaParentSubRaces)
  // ============================================================================

  defineEffect("sub_race", "Maruzensky")
    .description('Nhận Power "Red Shift/LP1211-M".')
    .weight(4.8)
    .grantPower("Red Shift/LP1211-M", 1)
    .register();

  defineEffect("sub_race", "Mejiro Ryan")
    .description('Nhận Power "Let\'s Pump Some Iron!"')
    .weight(4.8)
    .grantPower("Let's Pump Some Iron!", 1)
    .register();

  defineEffect("sub_race", "Taiki Shuttle")
    .description('Nhận Power "Shooting for Victory".')
    .weight(4.8)
    .grantPower("Shooting for Victory", 1)
    .register();

  defineEffect("sub_race", "Haru Urara")
    .description(
      "-1 all stats. Nếu còn sống tới vòng 32, chuyển thành +2 all stats.",
    )
    .weight(4.8)
    .addAllStats(-1)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "haru_urara_round_32_check",
    })
    .register();

  defineEffect("sub_race", "Oguri Cap")
    .description("+1 Strength, +2 Speed.")
    .weight(4.8)
    .addStat("strength", 1)
    .addStat("speed", 2)
    .register();

  defineEffect("sub_race", "Gold Ship")
    .description(
      'Nhận Quirk "Training Restricted". Trong combat: 50% +1 all stats, 50% -1 all stats.',
    )
    .weight(4.8)
    .grantQuirk("Training Restricted", 1)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "gold_ship_coin_flip",
    })
    .register();

  defineEffect("sub_race", "Symboli Rudolf")
    .description(
      "Sau khi thắng 3 PvP đầu tiên: +1 all stats. Thắng chung kết nhánh thắng: +1 all stats nữa.",
    )
    .weight(4.8)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "after_combat_win",
      target: "self",
      conditions: [
        { type: "pvp_win_count", winCount: 3, winCountOperator: "=" },
      ],
      triggerOnce: true,
    })
    .effect({
      type: "custom",
      timing: "after_combat_win",
      target: "self",
      customHandler: "symboli_rudolf_winner_bracket_final",
    })
    .register();

  defineEffect("sub_race", "Silence Suzuka")
    .description("+6 Speed, -3 Durability.")
    .weight(4.8)
    .addStat("speed", 6)
    .addStat("durability", -3)
    .register();

  defineEffect("sub_race", "Mejiro McQueen")
    .description("+3 Durability.")
    .weight(4.8)
    .addStat("durability", 3)
    .register();

  defineEffect("sub_race", "Mihono Bourbon")
    .description("+1 Strength, +2 Durability.")
    .weight(4.8)
    .addStat("strength", 1)
    .addStat("durability", 2)
    .register();

  defineEffect("sub_race", "Tokai Teio")
    .description("Gấp đôi Speed Base khi sử dụng nhạc cụ làm vũ khí.")
    .weight(4.8)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "tokai_teio_instrument_speed",
    })
    .register();

  defineEffect("sub_race", "Agnes Tachyon")
    .description('Nhận Power "U=ma2".')
    .weight(4.8)
    .grantPower("U=ma2", 1)
    .register();

  defineEffect("sub_race", "Nice Nature")
    .description(
      "Trong combat: Nếu cả hai bên đều có 3 điểm khi kết thúc, bỏ qua Tie-Break và thắng. (Mạnh hơn mọi tie-breaker khác)",
    )
    .weight(4.8)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "nice_nature_tie_win",
    })
    .register();

  defineEffect("sub_race", "Special Week")
    .description('50% nhận Power "Gourmand", 50% nhận Power "Hydrate".')
    .weight(4.8)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "special_week_random_power",
    })
    .register();

  defineEffect("sub_race", "Rice Shower")
    .description("+1 all stats ở nhánh thua. Hết hiệu lực khi tới chung kết.")
    .weight(4.8)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "on_loser_bracket",
      target: "self",
    })
    .register();

  defineEffect("sub_race", "Mayano Top Gun")
    .description("+2 Durability, +1 BIQ.")
    .weight(4.8)
    .addStat("durability", 2)
    .addStat("biq", 1)
    .register();

  defineEffect("sub_race", "Biwa Hayahide")
    .description("+2 IQ, +1 BIQ.")
    .weight(4.8)
    .addStat("iq", 2)
    .addStat("biq", 1)
    .register();

  defineEffect("sub_race", "El Condor Pasa")
    .description(
      "Sau mỗi PvP thắng Round Dura: +3 Speed, +3 Strength trong combat kế tiếp.",
    )
    .weight(4.8)
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "el_condor_pasa_dura_win_buff",
    })
    .register();

  defineEffect("sub_race", "Nagi")
    .description("Nhận thêm 2 Char Dev ngẫu nhiên khi quay vòng quay Char Dev.")
    .weight(4.4)
    .effect({
      type: "wheel_grant",
      wheelType: "Char Dev",
      grantCount: 2,
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("sub_race", "Mork")
    .description(
      "Thắng 1 Round: +1 Điểm. Thua 1 Round: mất hết điểm đang có. +2 BIQ.",
    )
    .weight(4.4)
    .addStat("biq", 2)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "mork_high_risk_points",
    })
    .register();

  defineEffect("sub_race", "Seiun Sky")
    .description('Nhận Power "Angling and Scheming".')
    .weight(4.8)
    .grantPower("Angling and Scheming", 1)
    .register();

  // ============================================================================
  // SUB-RACES: DEMON SINS
  // ============================================================================

  defineEffect("sub_race", "Lucifer")
    .description(
      'Nhận Archetype "Egoist". Vòng quay Power đạt kết quả tối đa (4).',
    )
    .weight(14.282)
    .effect({
      type: "grant_archetype",
      grantName: "Egoist",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "lucifer_max_power_wheel",
    })
    .register();

  defineEffect("sub_race", "Beelzebub")
    .description(
      'Nhận Quirk "Slow Metabolism". 1 chỉ số ngẫu nhiên đạt tối đa (10).',
    )
    .weight(14.282)
    .grantQuirk("Slow Metabolism", 1)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "beelzebub_max_random_stat",
    })
    .register();

  defineEffect("sub_race", "Leviathan")
    .description(
      "Quay 6 người chơi nhận Gear: Leviathan's Mark. Khi tất cả bị loại: +6 stat thấp nhất.",
    )
    .weight(14.282)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "leviathan_mark_distribution",
    })
    .register();

  defineEffect("sub_race", "Behemoth")
    .description(
      "Sau combat thua: Base 1 stat ngẫu nhiên = 0. Sau combat thắng: Base 1 stat ngẫu nhiên +2.",
    )
    .weight(14.282)
    .effect({
      type: "custom",
      timing: "after_combat_lose",
      target: "self",
      customHandler: "behemoth_lose_penalty",
    })
    .effect({
      type: "custom",
      timing: "after_combat_win",
      target: "self",
      customHandler: "behemoth_win_bonus",
    })
    .register();

  defineEffect("sub_race", "Mammon")
    .description("-2 all stats. Sau combat thắng: Nhận 2 phần thưởng PvP.")
    .weight(14.282)
    .addAllStats(-2)
    .effect({
      type: "double_reward",
      timing: "after_combat_win",
      target: "self",
    })
    .register();

  defineEffect("sub_race", "Belphegor")
    .description(
      "Trong combat: 2 Round đầu nếu thắng có 66% không nhận điểm. +1 điểm khởi đầu.",
    )
    .weight(14.282)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "belphegor_lazy_rounds",
    })
    .register();

  defineEffect("sub_race", "Asmodeus")
    .description(
      'Nhận Power "AIDS" (không thể chữa). Trong combat: +1 điểm khởi đầu nếu đối thủ bị AIDS.',
    )
    .weight(14.29)
    .grantPower("AIDS", 1)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "self",
      conditions: [
        {
          type: "opponent_has",
          opponentItemType: "power",
          opponentItemName: "AIDS",
        },
      ],
    })
    .register();

  // ============================================================================
  // SUB-RACES: WEREBEAST TYPES
  // ============================================================================

  defineEffect("sub_race", "Wereraven")
    .description("[PvE Only] +2 all stats.")
    .weight(12)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 2,
      timing: "pve_only",
      target: "self",
    })
    .register();

  defineEffect("sub_race", "Werewolf")
    .description("[PvE Only] Đội nhận +2 Strength với mỗi thành viên.")
    .weight(12)
    .effect({
      type: "custom",
      timing: "pve_only",
      target: "team",
      customHandler: "werewolf_team_strength",
    })
    .register();

  defineEffect("sub_race", "Wererat")
    .description("[PvE Only] Đội nhận +1 điểm nếu thắng round BIQ.")
    .weight(12)
    .effect({
      type: "extra_point_on_win",
      timing: "pve_only",
      target: "team",
      conditions: [{ type: "round_result", stat: "biq" }],
    })
    .register();

  defineEffect("sub_race", "Wereboar")
    .description("[PvE Only] Sau mỗi round thua, đội có 20% nhận 1 điểm.")
    .weight(12)
    .effect({
      type: "custom",
      timing: "pve_only",
      target: "team",
      customHandler: "wereboar_chance_point_on_lose",
    })
    .register();

  defineEffect("sub_race", "Werebear")
    .description("[PvE Only] Round MA thắng, đội nhận thêm 1 điểm.")
    .weight(12)
    .effect({
      type: "extra_point_on_win",
      timing: "pve_only",
      target: "team",
      conditions: [{ type: "round_result", stat: "ma" }],
    })
    .register();

  defineEffect("sub_race", "Werebat")
    .description(
      "[PvE Only] -3 all stats. Đội thua: bạn nhận thưởng (không phạt). Đội thắng: bạn không nhận thưởng (bị phạt).",
    )
    .weight(12)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -3,
      timing: "pve_only",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "pve_only",
      target: "self",
      customHandler: "werebat_reverse_reward",
    })
    .register();

  defineEffect("sub_race", "Werecapybara")
    .description(
      "[PvE Only] +10 BIQ. Round BIQ thi đấu 2 lần (cả hai đều tính điểm).",
    )
    .weight(12)
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 10,
      timing: "pve_only",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "pve_only",
      target: "team",
      customHandler: "werecapybara_double_biq_round",
    })
    .register();

  defineEffect("sub_race", "Weresheep")
    .description(
      "[PvE Only] +3 Dura. Nếu đội thắng, +3 Dura được cộng vĩnh viễn vào base.",
    )
    .weight(8)
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: 3,
      timing: "pve_only",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "after_combat_win",
      target: "self",
      customHandler: "weresheep_permanent_dura",
    })
    .register();

  defineEffect("sub_race", "Wereseal")
    .description(
      "[PvE Only] Đội -100 all stats. Đội thắng nếu ghi được 1 điểm.",
    )
    .weight(8)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -100,
      timing: "pve_only",
      target: "team",
    })
    .effect({
      type: "custom",
      timing: "pve_only",
      target: "team",
      customHandler: "wereseal_one_point_win",
    })
    .register();

  // ============================================================================
  // SUB-RACES: GOD'S GIFTS (Demi-God)
  // ============================================================================

  defineEffect("sub_race", "Cursed Sword")
    .description("-1 all stats.")
    .weight(30)
    .addAllStats(-1)
    .register();

  defineEffect("sub_race", "War")
    .description("+3 Strength.")
    .weight(7)
    .addStat("strength", 3)
    .register();

  defineEffect("sub_race", "Love")
    .description('Nhận 1 Lover, 50% nhận Archetype "Femboy".')
    .weight(7)
    .effect({
      type: "grant_lover",
      grantType: "lover",
      grantName: "random",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "grant_archetype",
      grantName: "Femboy",
      grantCount: 1,
      timing: "immediate",
      target: "self",
      conditions: [{ type: "probability", chance: 50 }],
    })
    .register();

  defineEffect("sub_race", "Time")
    .description("+3 Speed.")
    .weight(7)
    .addStat("speed", 3)
    .register();

  defineEffect("sub_race", "Fortune")
    .description('Nhận 3 Gear "Đồng Tiền Vàng".')
    .weight(7)
    .grantGear("Đồng Tiền Vàng", 3)
    .register();

  defineEffect("sub_race", "Secret Evil")
    .description("Trong Combat: +2 Stat cao nhất và thấp nhất.")
    .weight(7)
    .effect({
      type: "stat_modifier",
      stat: "highest",
      value: 2,
      timing: "during_combat",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 2,
      timing: "during_combat",
      target: "self",
    })
    .register();

  defineEffect("sub_race", "Knowledge")
    .description("+3 IQ.")
    .weight(7)
    .addStat("iq", 3)
    .register();

  defineEffect("sub_race", "Arts and Magic")
    .description("Nhận 2 Power.")
    .weight(7)
    .grantPower("random", 2)
    .register();

  defineEffect("sub_race", "Wilderness and Sea")
    .description("Nhận 1 lần Summon Wheel và 1 lần Elemental Wheel.")
    .weight(7)
    .effect({
      type: "wheel_grant",
      wheelType: "Summon",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "wheel_grant",
      wheelType: "Elemental",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("sub_race", "Creation")
    .description("Nhận 1 Creator's Favor.")
    .weight(7)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "creation_creators_favor",
    })
    .register();

  defineEffect("sub_race", "Moon")
    .description(
      'Nhận Archetype "Pacifist" từ đầu (sẽ nhận thêm một Archetype nữa).',
    )
    .weight(7)
    .effect({
      type: "grant_archetype",
      grantName: "Pacifist",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  // ============================================================================
  // SUB-RACES: GODS
  // ============================================================================

  defineEffect("sub_race", "Odin")
    .description(
      "+1 all stats. Sau combat thắng: Đối phương bị Isekai. (Chỉ ở nhánh thắng)",
    )
    .weight(12.5)
    .addAllStats(1)
    .effect({
      type: "isekai",
      timing: "after_combat_win",
      target: "opponent",
      conditions: [{ type: "bracket", bracket: "winner" }],
    })
    .register();

  defineEffect("sub_race", "Týr")
    .description("+3 Strength. Sau combat thắng Round Strength: nhận 1 Quirk.")
    .weight(12.5)
    .addStat("strength", 3)
    .effect({
      type: "grant_quirk",
      grantType: "quirk",
      grantName: "random",
      grantCount: 1,
      timing: "after_combat",
      target: "self",
      conditions: [{ type: "round_result", stat: "strength" }],
    })
    .register();

  defineEffect("sub_race", "Frigg")
    .description("+3 IQ. Sau combat thắng Round IQ: nhận 1 Power.")
    .weight(12.5)
    .addStat("iq", 3)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 1,
      timing: "after_combat",
      target: "self",
      conditions: [{ type: "round_result", stat: "iq" }],
    })
    .register();

  defineEffect("sub_race", "Baldur")
    .description(
      "Lần đầu có God bị loại: +2 all stats. Nếu bạn là God đầu tiên bị loại: tất cả God nhận 1 Power.",
    )
    .weight(12.5)
    .effect({
      type: "custom",
      timing: "on_death",
      target: "self",
      customHandler: "baldur_first_god_death",
    })
    .register();

  defineEffect("sub_race", "Loki")
    .description('Nhận 2 Power "Critical Strike" và "Evasion".')
    .weight(12.5)
    .grantPower("Critical Strike", 1)
    .grantPower("Evasion", 1)
    .register();

  defineEffect("sub_race", "Freyja")
    .description(
      "Trong combat: Khi đối đầu với người có Lover, +1 điểm khởi đầu.",
    )
    .weight(12.5)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "self",
      conditions: [{ type: "opponent_has", opponentItemType: "lover" }],
    })
    .register();

  defineEffect("sub_race", "Eir")
    .description("+1 Dura. Sau combat: gấp đôi bonus này. (stack vô hạn)")
    .weight(12.5)
    .addStat("durability", 1)
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "eir_double_dura_stack",
      stackable: true,
    })
    .register();

  defineEffect("sub_race", "Bragi")
    .description(
      "+1 điểm khởi đầu vs người dùng nhạc cụ. Thắng vs nhạc cụ: +1 Power.",
    )
    .weight(12.5)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "self",
      conditions: [
        {
          type: "opponent_has",
          opponentItemType: "weapon",
          opponentItemName: "instrument",
        },
      ],
    })
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 1,
      timing: "after_combat_win",
      target: "self",
      conditions: [
        {
          type: "opponent_has",
          opponentItemType: "weapon",
          opponentItemName: "instrument",
        },
      ],
    })
    .register();

  defineEffect("sub_race", "Thor")
    .description(
      "Nhận Unique Weapon Mjolnir (chắc chắn dùng được). +1 điểm vs Human. (Nếu đã có người cầm Mjolnir: combat tranh chấp)",
    )
    .weight(12.5)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "thor_mjolnir_grant",
    })
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "self",
      conditions: [{ type: "race_match", races: ["Human"] }],
    })
    .register();

}

export function registerUmaParentEffects(): void {
  // Uma parent effects are registered as part of registerAllRaceEffects
}

// ============================================================================
// IMMEDIATE HANDLERS
// ============================================================================

// ============================================================================
// SYMBIOSIS
// ============================================================================

registerImmediateHandler(
  'symbiosis_link',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Link to a random player
    return {
      skipDefault: true,
      description: 'Linked to a host player (symbiosis)',
    };
  },
  'Link to a host player'
);

// ============================================================================
// DRYAD
// ============================================================================

registerImmediateHandler(
  'dryad_death_buff',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This triggers when another Dryad dies
    return {
      skipDefault: true,
      description: '+2 random stat when another Dryad dies',
    };
  },
  '+2 random stat on Dryad death'
);

registerImmediateHandler(
  'dryad_last_standing',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This triggers when last Dryad standing
    return {
      skipDefault: true,
      description: 'Evolve to Yggdrasil (+9 random stat)',
    };
  },
  'Evolve to Yggdrasil'
);

// ============================================================================
// SPIRIT - SOULS STACK
// ============================================================================

registerImmediateHandler(
  'spirit_souls_stack',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Get current soul count from character (stored in custom data)
    const charData = ctx.character as any;
    const soulCount = charData.soulStacks || 0;
    const newCount = soulCount + 1;

    const modifiers: Array<{ stat: StatName; value: number }> = [];
    let description = `Soul stack: ${newCount}`;

    // Check thresholds
    if (newCount === 6) {
      modifiers.push({ stat: 'biq', value: 2 });
      description += ', +2 BIQ unlocked';
    } else if (newCount === 13) {
      modifiers.push(...STAT_NAMES.map(stat => ({ stat, value: 1 })));
      description += ', +1 all stats unlocked';
    }

    return {
      statModifiers: modifiers.length > 0 ? modifiers : undefined,
      skipDefault: true,
      description,
    };
  },
  '+1 soul stack per round lost'
);

// ============================================================================
// SKELETON/LICH EVOLUTION
// ============================================================================

registerImmediateHandler(
  'skeleton_iq_lock',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'iq', value: 0, isBase: true }], // IQ is always 1
      skipDefault: true,
      description: 'IQ locked at 1 (Skeleton)',
    };
  },
  'Lock IQ at 1'
);

// ============================================================================
// TROLL - LICH TROLL
// ============================================================================

registerImmediateHandler(
  'lich_troll_steal_dead',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This triggers after combat to steal from dead players
    return {
      skipDefault: true,
      description: 'Steal 1 Power from a dead player',
    };
  },
  'Steal Power from dead player'
);

// ============================================================================
// GOBLIN HORDE 100000
// ============================================================================

registerImmediateHandler(
  'goblin_100k_unique_weapon',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Guarantee unique weapon
    return {
      skipDefault: true,
      description: 'Guaranteed Unique Weapon',
    };
  },
  'Grant Unique Weapon'
);

// ============================================================================
// HUMAN SUB-RACES
// ============================================================================

registerImmediateHandler(
  'human_white_weapon_usable',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // All weapons usable and guaranteed weapon
    return {
      skipDefault: true,
      description: 'All weapons usable, guaranteed weapon',
    };
  },
  'All weapons usable'
);

registerImmediateHandler(
  'human_yellow_min_iq',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    if ((ctx.baseStats as Record<StatName, number>)['iq'] < 5) {
      const diff = 5 - (ctx.baseStats as Record<StatName, number>)['iq'];
      return {
        statModifiers: [{ stat: 'iq', value: diff, isBase: true }],
        skipDefault: true,
        description: `IQ raised to 5 (+${diff})`,
      };
    }
    return { skipDefault: true };
  },
  'Minimum IQ 5'
);

registerImmediateHandler(
  'human_black_min_dura',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    if ((ctx.baseStats as Record<StatName, number>)['durability'] < 5) {
      const diff = 5 - (ctx.baseStats as Record<StatName, number>)['durability'];
      return {
        statModifiers: [{ stat: 'durability', value: diff, isBase: true }],
        skipDefault: true,
        description: `Durability raised to 5 (+${diff})`,
      };
    }
    return { skipDefault: true };
  },
  'Minimum Durability 5'
);

// ============================================================================
// UMA PARENT HANDLERS
// ============================================================================

registerImmediateHandler(
  'haru_urara_late_game_buff',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This activates at round 32
    return {
      skipDefault: true,
      description: '-1 all stats becomes +2 all stats at Round 32',
    };
  },
  'Late game stat buff'
);

registerImmediateHandler(
  'gold_ship_coin_flip',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // 50/50 during combat
    const isLucky = Math.random() > 0.5;
    if (isLucky) {
      return {
        statModifiers: STAT_NAMES.map(stat => ({ stat, value: 1 })),
        skipDefault: true,
        description: '+1 all stats (Gold Ship lucky)',
      };
    } else {
      return {
        statModifiers: STAT_NAMES.map(stat => ({ stat, value: -1 })),
        skipDefault: true,
        description: '-1 all stats (Gold Ship unlucky)',
      };
    }
  },
  '50/50 for +1 or -1 all stats'
);

registerImmediateHandler(
  'symboli_rudolf_winner_bracket_final',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This triggers on winner bracket final win
    return {
      skipDefault: true,
      description: '+1 all stats on winner bracket final win',
    };
  },
  '+1 all stats on winner bracket final'
);

registerImmediateHandler(
  'tokai_teio_instrument_speed',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Check for instrument weapon
    const instruments = ['Guitar', 'Violin', 'Piano', 'Drums', 'Flute', 'Bagpipe', 'Harmonica'];
    const weapons = ctx.character.weapons || [];
    const hasInstrument = weapons.some(
      (w: any) => !w.isLost && instruments.some(i => w.name?.includes(i))
    );

    if (hasInstrument) {
      const baseSpeed = (ctx.baseStats as Record<StatName, number>)['speed'];
      return {
        statModifiers: [{ stat: 'speed', value: baseSpeed }], // Double base speed
        skipDefault: true,
        description: `Speed doubled to ${baseSpeed * 2} (instrument)`,
      };
    }

    return { skipDefault: true };
  },
  'Double Speed with instrument'
);

registerImmediateHandler(
  'nice_nature_tie_win',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat tie-breaker
    return {
      skipDefault: true,
      description: 'Win on 3-3 tie (Nice Nature)',
    };
  },
  'Win on 3-3 tie'
);

registerImmediateHandler(
  'special_week_random_power',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const isGourmand = Math.random() > 0.5;
    return {
      skipDefault: true,
      description: `Receive ${isGourmand ? 'Gourmand' : 'Hydrate'} Power`,
    };
  },
  '50/50 Gourmand or Hydrate'
);

registerImmediateHandler(
  'el_condor_pasa_dura_win_buff',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This triggers after winning Dura round
    return {
      skipDefault: true,
      description: '+3 Speed, +3 Strength next combat if won Dura round',
    };
  },
  '+3 Speed/Strength after Dura round win'
);

registerImmediateHandler(
  'mork_high_risk_points',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat point mechanic
    return {
      skipDefault: true,
      description: 'Win round: +1 point. Lose round: lose all points.',
    };
  },
  'High risk point mechanic'
);

// ============================================================================
// DEMON SIN HANDLERS
// ============================================================================

registerImmediateHandler(
  'lucifer_max_power_wheel',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Power wheel maxed to 4',
    };
  },
  'Max Power wheel'
);

registerImmediateHandler(
  'beelzebub_max_random_stat',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      statModifiers: [{ stat: randomStat, value: 10, isBase: true }],
      skipDefault: true,
      description: `${randomStat} set to 10`,
    };
  },
  'Set random stat to 10'
);

registerImmediateHandler(
  'leviathan_mark_distribution',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Marked 6 random players with Leviathan Mark',
    };
  },
  'Distribute Leviathan Marks'
);

registerImmediateHandler(
  'behemoth_lose_penalty',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      statModifiers: [{ stat: randomStat, value: -10, isBase: true }], // Set to 0
      skipDefault: true,
      description: `Base ${randomStat} set to 0`,
    };
  },
  'Set random base stat to 0'
);

registerImmediateHandler(
  'behemoth_win_bonus',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      statModifiers: [{ stat: randomStat, value: 2, isBase: true }],
      skipDefault: true,
      description: `Base ${randomStat} +2`,
    };
  },
  '+2 base random stat'
);

registerImmediateHandler(
  'belphegor_lazy_rounds',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a combat mechanic
    return {
      skipDefault: true,
      description: '66% no point on first 2 round wins',
    };
  },
  'Lazy rounds mechanic'
);

// ============================================================================
// GOD HANDLERS
// ============================================================================

registerImmediateHandler(
  'baldur_first_god_death',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: '+2 all stats on first God death / Grant Powers if first',
    };
  },
  'First God death effects'
);

registerImmediateHandler(
  'eir_double_dura_stack',
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // Get current stack count from character (stored in custom data)
    const charData = ctx.character as any;
    const currentStack = charData.eirStack || 1;
    const newStack = currentStack * 2;

    return {
      statModifiers: [{ stat: 'durability', value: currentStack }], // Add the difference
      skipDefault: true,
      description: `Durability bonus doubled to ${newStack}`,
    };
  },
  'Double Durability stack'
);

registerImmediateHandler(
  'thor_mjolnir_grant',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Granted Mjolnir (usable)',
    };
  },
  'Grant Mjolnir'
);

// ============================================================================
// WEREBEAST HANDLERS
// ============================================================================

registerImmediateHandler(
  'werewolf_team_strength',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    // This is a PvE team buff
    return {
      skipDefault: true,
      description: '+2 Strength per team member (PvE)',
    };
  },
  '+2 Strength per team member'
);

registerImmediateHandler(
  'wereboar_chance_point_on_lose',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: '20% to gain point on round loss (PvE)',
    };
  },
  '20% point on round loss'
);

registerImmediateHandler(
  'werebat_reverse_reward',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Reversed reward/penalty (PvE)',
    };
  },
  'Reverse reward/penalty'
);

registerImmediateHandler(
  'werecapybara_double_biq_round',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'BIQ round plays twice (PvE)',
    };
  },
  'Double BIQ round'
);

registerImmediateHandler(
  'weresheep_permanent_dura',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [{ stat: 'durability', value: 3, isBase: true }],
      skipDefault: true,
      description: '+3 Durability permanent on team win',
    };
  },
  '+3 permanent Durability'
);

registerImmediateHandler(
  'wereseal_one_point_win',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Team wins with 1 point scored',
    };
  },
  'Win with 1 point'
);

// ============================================================================
// REINCARNATOR
// ============================================================================

registerImmediateHandler(
  'reincarnator_transform',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: 'Transform into a Season 2.5 player',
    };
  },
  'Transform into past player'
);

// ============================================================================
// GOD'S GIFTS (Demi-God)
// ============================================================================

registerImmediateHandler(
  'creation_creators_favor',
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Granted Creator's Favor",
    };
  },
  "Grant Creator's Favor"
);

// ============================================================================
// EXPORTS
// ============================================================================

export function registerRaceHandlers(): void {
  console.log('Race handlers registered');
}

// ============================================================================
// COMBAT HANDLERS
// ============================================================================

// ============================================================================
// ORC HANDLERS
// ============================================================================

/**
 * Orc - +2 lowest stat on win, -3 highest stat on lose
 */
registerCombatHandler(
  'orc_win_lowest_bonus',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Find lowest stat
    let lowestStat: StatName = 'strength';
    let lowestValue = ctx.self.stats.strength;

    for (const stat of STAT_NAMES) {
      if ((ctx.self.stats as Record<StatName, number>)[stat] < lowestValue) {
        lowestValue = (ctx.self.stats as Record<StatName, number>)[stat];
        lowestStat = stat;
      }
    }

    return {
      selfStatMods: [{ stat: lowestStat, value: 2 }],
      description: `+2 ${lowestStat} (Orc win bonus)`,
    };
  },
  '+2 lowest stat on win'
);

registerCombatHandler(
  'orc_lose_highest_penalty',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Find highest stat
    let highestStat: StatName = 'strength';
    let highestValue = ctx.self.stats.strength;

    for (const stat of STAT_NAMES) {
      if ((ctx.self.stats as Record<StatName, number>)[stat] > highestValue) {
        highestValue = (ctx.self.stats as Record<StatName, number>)[stat];
        highestStat = stat;
      }
    }

    return {
      selfStatMods: [{ stat: highestStat, value: -3 }],
      description: `-3 ${highestStat} (Orc lose penalty)`,
    };
  },
  '-3 highest stat on lose'
);

// ============================================================================
// GIANT HANDLERS
// ============================================================================

/**
 * Giant - Compare IQ vs Strength to determine bonuses
 */
registerCombatHandler(
  'giant_iq_vs_str_compare',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const baseIQ = ctx.self.baseStats?.iq || ctx.self.stats.iq;
    const baseStr = ctx.self.baseStats?.strength || ctx.self.stats.strength;

    if (baseIQ > baseStr) {
      return {
        selfStatMods: [
          { stat: 'iq', value: 5 },
          { stat: 'strength', value: -5 },
        ],
        description: '+5 IQ, -5 Strength (IQ > Str)',
      };
    } else if (baseStr > baseIQ) {
      return {
        selfStatMods: [
          { stat: 'strength', value: 5 },
          { stat: 'iq', value: -5 },
        ],
        description: '+5 Strength, -5 IQ (Str > IQ)',
      };
    } else {
      return {
        selfStatMods: [
          { stat: 'strength', value: 3 },
          { stat: 'iq', value: 3 },
        ],
        description: '+3 Strength, +3 IQ (equal)',
      };
    }
  },
  'Giant IQ vs Strength comparison'
);

// ============================================================================
// DEMI-GOD HANDLERS
// ============================================================================

/**
 * Demi-God - +1 all vs Human, -1 all vs God
 */
registerCombatHandler(
  'demigod_vs_human',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    if (ctx.opponent.race.toLowerCase() === 'human') {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: 1 })),
        description: '+1 all stats vs Human',
      };
    }
    return { skipDefault: true };
  },
  '+1 all stats vs Human'
);

registerCombatHandler(
  'demigod_vs_god',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    if (ctx.opponent.race.toLowerCase() === 'god') {
      return {
        selfStatMods: STAT_NAMES.map(stat => ({ stat, value: -1 })),
        description: '-1 all stats vs God',
      };
    }
    return { skipDefault: true };
  },
  '-1 all stats vs God'
);

// ============================================================================
// DRAGON SUB-RACE HANDLERS
// ============================================================================

/**
 * Ancient Dragon - Disable opponent weapon
 */
registerCombatHandler(
  'ancient_dragon_weapon_disable',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      opponentWeaponDisabled: true,
      description: 'Opponent weapon disabled (Ancient Dragon)',
    };
  },
  'Disable opponent weapon'
);

/**
 * Thunder Dragon - +1 starting point (PvE)
 */
registerCombatHandler(
  'thunder_dragon_pve_point',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.isPvE) {
      return {
        selfPoints: 1,
        description: '+1 starting point (Thunder Dragon PvE)',
      };
    }
    return { skipDefault: true };
  },
  '+1 starting point in PvE'
);

// ============================================================================
// ANGEL RANK HANDLERS
// ============================================================================

/**
 * Principalities - +2 lowest stat after combat
 */
registerCombatHandler(
  'principalities_lowest_stat',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Find lowest stat
    let lowestStat: StatName = 'strength';
    let lowestValue = ctx.self.stats.strength;

    for (const stat of STAT_NAMES) {
      if ((ctx.self.stats as Record<StatName, number>)[stat] < lowestValue) {
        lowestValue = (ctx.self.stats as Record<StatName, number>)[stat];
        lowestStat = stat;
      }
    }

    return {
      selfStatMods: [{ stat: lowestStat, value: 2 }],
      description: `+2 ${lowestStat} (Principalities after combat)`,
    };
  },
  '+2 lowest stat after combat'
);

// ============================================================================
// DEMON SIN HANDLERS
// ============================================================================

/**
 * Asmodeus - +1 starting point if opponent has AIDS
 */
registerCombatHandler(
  'asmodeus_vs_aids',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const opponentPowers = ctx.opponent.powers || [];
    const hasAids = opponentPowers.some((p: any) => p.name === 'AIDS');

    if (hasAids) {
      return {
        selfPoints: 1,
        description: '+1 starting point (opponent has AIDS)',
      };
    }
    return { skipDefault: true };
  },
  '+1 point if opponent has AIDS'
);

// ============================================================================
// GOD HANDLERS
// ============================================================================

/**
 * Freyja - +1 point if opponent has Lover
 */
registerCombatHandler(
  'freyja_vs_lover',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const lover = ctx.opponent.lover;
    const hasLover = lover && (Array.isArray(lover) ? lover.length > 0 : true);

    if (hasLover) {
      return {
        selfPoints: 1,
        description: '+1 starting point (opponent has Lover)',
      };
    }
    return { skipDefault: true };
  },
  '+1 point if opponent has Lover'
);

/**
 * Bragi - +1 point vs instrument user
 */
registerCombatHandler(
  'bragi_vs_instrument',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    const instruments = ['Guitar', 'Violin', 'Piano', 'Drums', 'Flute', 'Bagpipe', 'Harmonica'];
    const opponentWeapons = ctx.opponent.weapons || [];
    const hasInstrument = opponentWeapons.some(
      (w: any) => !w.isLost && instruments.some(i => w.name?.includes(i))
    );

    if (hasInstrument) {
      return {
        selfPoints: 1,
        description: '+1 starting point (opponent uses instrument)',
      };
    }
    return { skipDefault: true };
  },
  '+1 point vs instrument user'
);

/**
 * Thor - +1 point vs Human
 */
registerCombatHandler(
  'thor_vs_human',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };

    if (ctx.opponent.race.toLowerCase() === 'human') {
      return {
        selfPoints: 1,
        description: '+1 point vs Human (Thor)',
      };
    }
    return { skipDefault: true };
  },
  '+1 point vs Human'
);

/**
 * Týr - Grant Quirk on Strength round win
 */
registerCombatHandler(
  'tyr_str_win_quirk',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.strength === 'win') {
      return {
        skipDefault: false, // Allow quirk grant
        description: 'Grant Quirk (won Strength round)',
      };
    }
    return { skipDefault: true };
  },
  'Grant Quirk on Strength win'
);

/**
 * Frigg - Grant Power on IQ round win
 */
registerCombatHandler(
  'frigg_iq_win_power',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.roundResults?.iq === 'win') {
      return {
        skipDefault: false, // Allow power grant
        description: 'Grant Power (won IQ round)',
      };
    }
    return { skipDefault: true };
  },
  'Grant Power on IQ win'
);

// ============================================================================
// SECRET EVIL (Demi-God God's Gift)
// ============================================================================

registerCombatHandler(
  'secret_evil_highest_lowest',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Find highest and lowest stats
    let highestStat: StatName = 'strength';
    let lowestStat: StatName = 'strength';
    let highestValue = ctx.self.stats.strength;
    let lowestValue = ctx.self.stats.strength;

    for (const stat of STAT_NAMES) {
      if ((ctx.self.stats as Record<StatName, number>)[stat] > highestValue) {
        highestValue = (ctx.self.stats as Record<StatName, number>)[stat];
        highestStat = stat;
      }
      if ((ctx.self.stats as Record<StatName, number>)[stat] < lowestValue) {
        lowestValue = (ctx.self.stats as Record<StatName, number>)[stat];
        lowestStat = stat;
      }
    }

    return {
      selfStatMods: [
        { stat: highestStat, value: 2 },
        { stat: lowestStat, value: 2 },
      ],
      description: `+2 ${highestStat}, +2 ${lowestStat} (Secret Evil)`,
    };
  },
  '+2 to highest and lowest stats'
);

// ============================================================================
// ODIN - Isekai on winner bracket win
// ============================================================================

registerCombatHandler(
  'odin_isekai_winner_bracket',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.bracket === 'winner') {
      return {
        opponentIsekai: true,
        description: 'Opponent is Isekai-ed (Odin)',
      };
    }
    return { skipDefault: true };
  },
  'Isekai opponent on winner bracket win'
);

// ============================================================================
// DRYAD - On death: all same-race get +2 random stat; last Dryad evolves to Yggdrasil
// ============================================================================

registerCombatHandler(
  'dryad_death_buff',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: 'Dryad: Khi chết → tất cả Dryad còn lại +2 stat ngẫu nhiên (xử lý ngoài game)',
    };
  },
  'On Dryad death: all same-race Dryads get +2 random stat'
);

registerCombatHandler(
  'dryad_last_standing',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: 'Dryad: Nếu là Dryad cuối cùng khi chết → tiến hóa thành Yggdrasil (xử lý ngoài game)',
    };
  },
  'Last Dryad evolves to Yggdrasil on death'
);

// ============================================================================
// WEREBAT SUB-RACE - PvE only: reverse team rewards
// ============================================================================

registerCombatHandler(
  'werebat_reverse_reward',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.isPvE) return { skipDefault: true };
    return {
      skipDefault: true,
      description: 'Werebat: [PvE] Đội thua → bạn nhận thưởng; Đội thắng → bạn không nhận thưởng (xử lý ngoài game)',
    };
  },
  'PvE only: team lose = you get reward; team win = you get no reward (Werebat)'
);

// ============================================================================
// SPIRIT RACE - On each round lose: +1 Soul stack; at 6/9/13/20 stacks: bonus
// ============================================================================

registerCombatHandler(
  'spirit_souls_stack',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const charData = ctx.self.character as any;
    // Souls đã tích lũy từ trước (từ file) + số round thua trận này
    const prevSouls: number = charData?.spiritSouls ?? 0;
    // roundsLost = số round đã thua TRƯỚC round này → +1 để tính round thua hiện tại
    const soulsThisMatch = ctx.self.roundsLost + 1;
    const souls = prevSouls + soulsThisMatch;

    if (souls === 0) {
      return { skipDefault: true, description: 'Spirit: 0 Soul stacks (cần 6 để kích hoạt)' };
    }

    // Tích lũy tất cả mốc đạt được (bao gồm cả các mốc trước đó)
    const mods: Array<{ stat: StatName; value: number }> = [];
    const bonusLabels: string[] = [];

    if (souls >= 6) {
      mods.push({ stat: 'biq', value: 2 });
      bonusLabels.push('+2 BIQ');
    }
    if (souls >= 13) {
      STAT_NAMES.forEach(stat => mods.push({ stat, value: 1 }));
      bonusLabels.push('+1 all stats');
    }
    if (souls >= 9 && souls < 13) {
      // +1 Power — không thể auto-apply, ghi chú
      bonusLabels.push('+1 Power (xử lý ngoài game)');
    }
    if (souls >= 20) {
      // Gấp đôi tất cả hiệu ứng trước → double stats hiện tại (xử lý ngoài game)
      bonusLabels.push('Gấp đôi stats (xử lý ngoài game)');
    }

    if (mods.length === 0 && souls < 6) {
      return {
        skipDefault: true,
        description: `Spirit Souls: ${souls} stack (cần 6 để kích hoạt)`,
      };
    }

    return {
      selfStatMods: mods.length > 0 ? mods : undefined,
      skipDefault: mods.length === 0,
      description: `Spirit Souls: ${souls} stack (${prevSouls} cũ + ${soulsThisMatch} trận này) → ${bonusLabels.join(', ')}`,
    };
  },
  'On round lose: dùng spiritSouls tích lũy; at 6→+2 BIQ, 9→+1 Power, 13→+1 all, 20→double stats (Spirit)'
);

// ============================================================================
// WERESEAL - PvE only: team wins if they score 1 point despite -100 all stats
// ============================================================================

registerCombatHandler(
  'wereseal_one_point_win',
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.isPvE) return { skipDefault: true };
    return {
      skipDefault: true,
      description: 'Wereseal: [PvE] Đội -100 all stats; thắng nếu ghi được 1 điểm (xử lý ngoài game)',
    };
  },
  'PvE only: team wins by scoring 1 point (despite -100 all stats penalty) (Wereseal)'
);

// ============================================================================
// WERESHEEP - After combat win (PvE): +3 Dura becomes permanent base stat
// ============================================================================

registerCombatHandler(
  'weresheep_permanent_dura',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: 'Weresheep: [PvE] Đội thắng → +3 Dura được cộng vĩnh viễn vào base stat (xử lý ngoài game)',
    };
  },
  'PvE win: +3 Durability becomes permanent base stat (Weresheep)'
);

// ============================================================================
// BALDUR SUB-RACE - On death: first God eliminated = +2 all; if you're first God = all Gods get 1 Power
// ============================================================================

registerCombatHandler(
  'baldur_first_god_death',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: 'Baldur: Khi chết — Lần đầu God bị loại: +2 all stats. Nếu là God đầu tiên bị loại: tất cả God nhận 1 Power (xử lý ngoài game)',
    };
  },
  'On death: first God eliminated gets +2 all; if first God to die = all Gods get 1 Power (Baldur)'
);

// ============================================================================
// EIR SUB-RACE - After each combat: double accumulated Dura bonus (stackable)
// ============================================================================

registerCombatHandler(
  'eir_double_dura_stack',
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description: 'Eir: Sau combat → gấp đôi tổng bonus Dura đã tích lũy (stackable, xử lý ngoài game)',
    };
  },
  'After each combat: double accumulated Durability bonus (stackable) (Eir)'
);

export function registerRaceCombatHandlers(): void {
  console.log('Race combat handlers registered');
}
