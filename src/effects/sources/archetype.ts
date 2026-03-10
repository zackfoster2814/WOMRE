/**
 * Archetype Effects — Source
 *
 * Gộp từ:
 *   data/archetypes.ts
 *   handlers/immediate/archetype-handlers.ts
 *   handlers/combat/archetype-combat-handlers.ts
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
// ARCHETYPE EFFECT DEFINITIONS
// ============================================================================

export function registerAllArchetypeEffects() {
  // Egoist
  defineEffect("archetype", "Egoist")
    .description(
      "Nhận +2 all stats. Nếu bạn không thắng với cách biệt 4 điểm hoặc hơn trong 1 combat, bạn sẽ thua combat đó.",
    )
    .weight(1.6)
    .addAllStats(2)
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "egoist_win_condition",
    })
    .register();

  // NPC
  defineEffect("archetype", "NPC")
    .description(
      'Nhận -1 all stats và không thể có "Character Development". Bất kể những vòng quay sau có Char Dev cũng không được nhận.',
    )
    .weight(3)
    .addAllStats(-1)
    .effect({
      type: "immunity",
      immuneTo: ["grant_char_dev"],
      timing: "immediate",
      target: "self",
    })
    .register();

  // Gigachad
  defineEffect("archetype", "Gigachad")
    .description(
      "Nhận +1 all stats khi đối đầu với tộc có thứ hạng cao hơn và -1 all stats khi đối đầu với tộc có thứ hạng thấp hơn trong vòng quay Race.",
    )
    .weight(2.4)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "before_combat",
      target: "self",
      conditions: [{ type: "race_tier_compare", tierOperator: ">" }],
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -1,
      timing: "before_combat",
      target: "self",
      conditions: [{ type: "race_tier_compare", tierOperator: "<" }],
    })
    .register();

  // Slayer
  defineEffect("archetype", "Slayer")
    .description(
      "Chọn 1 tộc để Slay. Khi đối đầu với tộc đó, nhận +2 Strength, +3 BIQ và +2 Martial Arts.",
    )
    .weight(2)
    .register();

  // Masochist
  defineEffect("archetype", "Masochist")
    .description("Sau combat thua: Nhận 1 Power và +1 all stats.")
    .weight(1.4)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 1,
      timing: "after_combat_lose",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "after_combat_lose",
      target: "self",
    })
    .register();

  // Femboy
  defineEffect("archetype", "Femboy")
    .description(
      'Bạn mặc định có Power "AIDS". Với mỗi Lover có "AIDS", bạn nhận +1 all stats. (Tính cả các Lover đã chết)',
    )
    .weight(1.2)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "AIDS",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "immediate",
      target: "self",
      customHandler: "femboy_lover_aids_count",
    })
    .register();

  // Pacifist
  defineEffect("archetype", "Pacifist")
    .description("Nhận +2 IQ và -4 Martial Arts.")
    .weight(1.1)
    .addStat("iq", 2)
    .addStat("ma", -4)
    .register();

  // Anti-Social
  defineEffect("archetype", "Anti-Social")
    .description(
      "[PvE Only] Nhận -5 all stats khi raid boss PvE. Nhận +1 all stats khi đấu PvP.",
    )
    .weight(1.6)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -5,
      timing: "pve_only",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "pvp_only",
      target: "self",
    })
    .register();

  // Bookworm
  defineEffect("archetype", "Bookworm")
    .description('Nhận +2 IQ và 1 Gear "Sổ tay"')
    .weight(2.5)
    .addStat("iq", 2)
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "Sổ tay",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  // Glass Cannon
  defineEffect("archetype", "Glass Cannon")
    .description('Bạn mặc định thua round "Durability", nhận +1 all stats.')
    .weight(1.5)
    .addAllStats(1)
    .effect({
      type: "auto_lose_round",
      stat: "durability",
      timing: "during_combat",
      target: "self",
    })
    .register();

  // Mid
  defineEffect("archetype", "Mid")
    .description("Kết quả của toàn bộ vòng quay stats của bạn có giá trị là 5.")
    .weight(2.3)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "mid_stats_five",
    })
    .register();

  // Hand Fighter
  defineEffect("archetype", "Hand Fighter")
    .description(
      "Không thể nhận vũ khí. (Bypass toàn bộ hiệu ứng khác) Nhận +3 Strength, +2 Durability và +2 MA.",
    )
    .weight(2.4)
    .effect({
      type: "immunity",
      immuneTo: ["grant_weapon"],
      timing: "immediate",
      target: "self",
    })
    .addStat("strength", 3)
    .addStat("durability", 2)
    .addStat("ma", 2)
    .register();

  // Conquerer
  defineEffect("archetype", "Conquerer")
    .description(
      "Nhận +3 Base Speed. Trong Combat: Khi bạn thắng round Speed, nhận +1 all stats trong phần còn lại của combat.",
    )
    .weight(2.2)
    .addStat("speed", 3, true)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "during_combat",
      target: "self",
      duration: "combat",
      customHandler: "conquerer_speed_win",
    })
    .register();

  // Paladin
  defineEffect("archetype", "Paladin")
    .description('Nhận Power "Divine Smite", Nhận +2 Base MA')
    .weight(2.2)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "Divine Smite",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .addStat("ma", 2, true)
    .register();

  // Him
  defineEffect("archetype", "Him")
    .description("Nhận +10 all stats, đối thủ nhận 5 điểm ở cuối combat.")
    .weight(1.3)
    .addAllStats(10)
    .effect({
      type: "combat_points",
      points: 5,
      timing: "after_combat",
      target: "opponent",
    })
    .register();

  // Perfectionist
  defineEffect("archetype", "Perfectionist")
    .description(
      "Nhận +4 vào stat thấp nhất nếu bạn giành chiến thắng với cách biệt 4 điểm trở lên.",
    )
    .weight(2.4)
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 4,
      timing: "after_combat_win",
      target: "self",
      customHandler: "perfectionist_dominate_check",
    })
    .register();

  // Chokevy
  defineEffect("archetype", "Chokevy")
    .description("Nhận +3 all stats. Sau Combat: nhận -1 all stats.")
    .weight(2)
    .addAllStats(3)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -1,
      timing: "after_combat",
      target: "self",
    })
    .register();

  // Dual Wielder
  defineEffect("archetype", "Dual Wielder")
    .description(
      "Nhận -3 Strength. Dùng được 2 vũ khí và chắc chắn nhận 2 vũ khí, tối đa 1 Unique Weapon. (Chỉ có 1 vũ khí có thể có Runeword)",
    )
    .weight(1.7)
    .addStat("strength", -3)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "dual_wielder_two_weapons",
    })
    .register();

  // Zealot
  defineEffect("archetype", "Zealot")
    .description(
      "Sau Combat: Mỗi round combat thua, nhận +1 vào chỉ số thấp nhất",
    )
    .weight(1.1)
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 1,
      timing: "after_combat",
      target: "self",
      customHandler: "zealot_per_round_lost",
    })
    .register();

  // Atheist
  defineEffect("archetype", "Atheist")
    .description(
      "Trước combat: Nhận 1 điểm combat khi đối đầu với God và Demi-God.",
    )
    .weight(2)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "self",
      conditions: [{ type: "race_match", races: ["God", "Demi-God"] }],
    })
    .register();

  // Devotee
  defineEffect("archetype", "Devotee")
    .description(
      "Trong combat: Nhận 1 điểm khởi đầu khi combat với Demon, Vampire, Spirit, Orc, Skeleton và Goblin. Nhưng sẽ ngay lập tức thua khi đối đầu với God và Demi-God. (Hiệu ứng thua này mạnh hơn các hiệu ứng liên quan đến kết quả trận đấu khác).",
    )
    .weight(2)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "self",
      conditions: [
        {
          type: "race_match",
          races: ["Demon", "Vampire", "Spirit", "Orc", "Skeleton", "Goblin"],
        },
      ],
    })
    .effect({
      type: "custom",
      timing: "before_combat",
      target: "self",
      customHandler: "devotee_auto_lose_vs_god",
    })
    .register();

  // Follower of the Two Fingers
  defineEffect("archetype", "Follower of the Two Fingers")
    .description(
      "Sau combat: Nhận -1 IQ và -1 BIQ, cướp 1 Power từ 1 người chơi còn sống ngẫu nhiên.",
    )
    .weight(1.8)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: -1,
      timing: "after_combat",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: -1,
      timing: "after_combat",
      target: "self",
    })
    .effect({
      type: "steal_power",
      grantCount: 1,
      timing: "after_combat",
      target: "random_player",
    })
    .register();

  // Wibu
  defineEffect("archetype", "Wibu")
    .description('Nhận "Wibu Wheel".')
    .weight(3.6)
    .effect({
      type: "grant_wheel",
      wheelName: "Wibu Wheel",
      timing: "immediate",
      target: "self",
    })
    .register();

  // Farmer
  defineEffect("archetype", "Farmer")
    .description('Nhận vòng quay "Farmer".')
    .weight(3)
    .effect({
      type: "grant_wheel",
      wheelName: "Farmer Wheel",
      timing: "immediate",
      target: "self",
    })
    .register();

  // Promised Consort
  defineEffect("archetype", "Promised Consort")
    .description(
      'Trong Combat: Thêm Base Stat cao nhất của 1 "Lover" của bạn vào Stat đánh nhau của bạn. Nếu như có "Lover" nào có Archetype "Femboy", chọn "Lover" đó, nếu có nhiều, quay Wheel (Lmao).',
    )
    .weight(0.5)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "promised_consort_lover_stat",
    })
    .register();

  // Cinderheart
  defineEffect("archetype", "Cinderheart")
    .description(
      '(1).Nhận +1 All Stats (2).Sau Combat: Đối thủ nhận Power "Cinder Flickering".',
    )
    .weight(0.5)
    .addAllStats(1)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "Cinder Flickering",
      grantCount: 1,
      timing: "after_combat",
      target: "opponent",
    })
    .register();

  // Stargazer
  defineEffect("archetype", "Stargazer")
    .description(
      'Nhận Power "Spell Flux" và 1 Power có kích hoạt "Trong Combat" ngẫu nhiên.',
    )
    .weight(0.5)
    .register();

  // Superhero
  defineEffect("archetype", "Superhero")
    .description('Bạn là một siêu anh hùng! Nhận "Siêu Anh Hùng Wheel".')
    .weight(1.6)
    .effect({
      type: "grant_wheel",
      wheelName: "Siêu Anh Hùng Wheel",
      timing: "immediate",
      target: "self",
    })
    .register();

  // Người Trong Ban Nhạc
  defineEffect("archetype", "Người Trong Ban Nhạc")
    .description(
      'Có 36% nhận được vòng quay "Instrument Weapon". Chắc chắn luôn sử dụng được tất cả vũ khí nhạc cụ. Skip vòng quay vũ khí thông thường. Bạn mặc định thuộc về House "Ban Nhạc Ngọt Đoàn Kết"',
    )
    .weight(3)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "nguoi_trong_ban_nhac_setup",
    })
    .register();

  // Hero Grave Keeper
  defineEffect("archetype", "Hero Grave Keeper")
    .description("Sau mỗi vòng, Nhận 1 Gear từ 1 người đã bị loại.")
    .weight(3)
    .effect({
      type: "custom",
      timing: "after_round",
      target: "self",
      customHandler: "hero_grave_keeper_loot",
    })
    .register();

  // Gambler
  defineEffect("archetype", "Gambler")
    .description(
      "Mỗi round thắng trong combat, có 50% khả năng nhận nhận 2 điểm và 50% khả năng nhận 0 điểm.",
    )
    .weight(2.2)
    .register();

  // Time Traveller
  defineEffect("archetype", "Time Traveller")
    .description(
      "Khi spin Base Stats, với mỗi chỉ số có điểm dưới hoặc bằng 3 sẽ spin lại 1 lần.",
    )
    .weight(1.8)
    .register();

  // Loyal
  defineEffect("archetype", "Loyal")
    .description(
      "Nhận 1 Lover và sẽ chỉ có 1 Lover duy nhất. (Nếu đang có sẵn nhiều hơn 1 Lover, quay 1 Archetype khác). Khi Lover bị loại, nhận 1 Char Dev.",
    )
    .weight(2.2)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "loyal_single_lover",
    })
    .effect({
      type: "custom",
      timing: "on_lover_eliminated",
      target: "self",
      customHandler: "loyal_lover_death_char_dev",
    })
    .register();

  // Trickster
  defineEffect("archetype", "Trickster")
    .description(
      'Nhận "Trickster" wheel, kích hoạt trước mỗi combat và hết hiệu lực sau mỗi combat',
    )
    .weight(2.2)
    .effect({
      type: "grant_wheel",
      wheelName: "Trickster Wheel",
      timing: "before_combat",
      target: "self",
    })
    .register();

  // Summoner
  defineEffect("archetype", "Summoner")
    .description(
      "Sau combat thắng: Nhận 1 lần vòng quay Summon, không thể ra trùng Summon đã sở hữu. Sẽ không quay thêm nếu đã sở hữu tất cả các Summon.",
    )
    .weight(2.3)
    .effect({
      type: "grant_wheel",
      wheelName: "Summon Wheel",
      timing: "after_combat_win",
      target: "self",
      customHandler: "summoner_unique_summon",
    })
    .register();

  // Edgelord
  defineEffect("archetype", "Edgelord")
    .description(
      "Trước khi kết thúc combat: So sánh điểm của hai bên, bên nào thấp điểm hơn sẽ nhận thêm 1 điểm.",
    )
    .weight(2.8)
    .effect({
      type: "custom",
      timing: "before_combat_end",
      target: "self",
      customHandler: "edgelord_underdog_point",
    })
    .register();

  // Hero of the Emirate🍀
  defineEffect("archetype", "Hero of the Emirate🍀")
    .description("Nhận thêm Quirk 🍀, Power 🍀 ngay lập tức")
    .weight(3.6)
    .register();

  // Fisher
  defineEffect("archetype", "Fisher")
    .description(
      'Nhận Gear "Fishing Rod". Đến vòng 16, nhận thêm 1 PvP Rewards.',
    )
    .weight(2.2)
    .effect({
      type: "custom",
      timing: "on_round_16",
      target: "self",
      customHandler: "fisher_round_16_reward",
    })
    .register();

  // Blacksmith
  defineEffect("archetype", "Blacksmith")
    .description(
      "(1) Bạn chắc chắn có vũ khí. (2) Vũ khí của bạn chắc chắn là 1 runeword. (3) Bạn chắc chắn sử dụng được mọi vũ khí.",
    )
    .weight(2.2)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "blacksmith_weapon_setup",
    })
    .register();

  // Sentinel of Purity
  defineEffect("archetype", "Sentinel of Purity")
    .description(
      'Lần đầu tiên bạn bị dính power "AIDS", bạn sẽ nhận Char dev "Isekai".',
    )
    .weight(2)
    .effect({
      type: "custom",
      timing: "on_aids_received",
      target: "self",
      customHandler: "sentinel_of_purity_isekai",
    })
    .register();

  // Infirmarian
  defineEffect("archetype", "Infirmarian")
    .description('Sau Combat: Loại bỏ "AIDS" khỏi cả 2 người chơi.')
    .weight(4)
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "both",
      customHandler: "infirmarian_cure_aids",
    })
    .register();

  // Gambler Bloodline
  defineEffect("archetype", "Gambler Bloodline")
    .description(
      "Ở những vòng quay còn lại của quá trình tạo nhân vật, Có 50% không được quay vòng quay đó, Nếu là không nhận được vòng quay Stat, Stat đó mặc định là 1. Áp dụng lên cả những vòng quay phụ sinh ra từ Vòng quay chính. Nếu bạn không được quay bất kì chỉ số nào, toàn bộ stats của bạn sẽ được đặt base = 10. Nếu bạn không được quay bất cứ cái gì, mùa giải kết thúc và bạn là nhà vô địch ăn trọn 100% giải thưởng.",
    )
    .weight(1.9)
    .register();

  // Power Ranger
  defineEffect("archetype", "Power Ranger")
    .description(
      'Bạn trở thành 1 trong các siêu nhân Gao! Nhận "Power Ranger Wheel".',
    )
    .weight(1.5)
    .effect({
      type: "grant_wheel",
      wheelName: "Power Ranger Wheel",
      timing: "immediate",
      target: "self",
    })
    .register();

  // Philosopher
  defineEffect("archetype", "Philosopher")
    .description("Base IQ +3")
    .weight(3)
    .addStat("iq", 3, true)
    .register();

  // Herald
  defineEffect("archetype", "Herald")
    .description("Base Speed +3")
    .weight(3)
    .addStat("speed", 3, true)
    .register();

  // Invoker
  defineEffect("archetype", "Invoker")
    .description(
      '(1). Nhận 3 Power "Quas", "Wex" và "Exort". (2).Trước Combat: Quay ngẫu nhiêu 1 Power chưa sở hữu và nhận hiệu ứng của nó trong combat đó. Power này chỉ dùng được trong Combat đó.',
    )
    .weight(1)
    .effect({
      type: "custom",
      timing: "before_combat",
      target: "self",
      customHandler: "invoker_random_power",
    })
    .register();

  // Bravest of the Brave
  defineEffect("archetype", "Bravest of the Brave")
    .description(
      "Bạn không được nhận vòng quay Power, nhưng khi thắng combat PvP bạn sẽ nhận 2 vòng quay PvP Rewards thay vì 1.",
    )
    .weight(1)
    .effect({
      type: "custom",
      timing: "after_combat_win",
      target: "self",
      customHandler: "bravest_double_pvp_reward",
    })
    .register();

  // Mason
  defineEffect("archetype", "Mason")
    .description(
      "Cường Hóa House Feature khi nhận Houses. (Không nhận House Feature thông thường)",
    )
    .weight(3)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "mason_enhanced_house_feature",
    })
    .register();

  // Cursed of 36k
  defineEffect("archetype", "Cursed of 36k")
    .description(
      "Cái tội sống vội + ham hố, chưa mở chính thức mà đóng tiền, ngoài ra giảm toàn bộ Base Stat quay ra đi 1.",
    )
    .weight(0)
    .register();

  // X
  defineEffect("archetype", "X")
    .description(
      'Chỉ có duy nhất 1 người có thể làm X trong toàn bộ giải, khi lần đầu tiên có người quay ra "X", loại bỏ nó khỏi vòng quay Archetype. Khi người có archetype này nhận thất bại, sẽ loại bỏ archetype này từ người đó và chuyển nó sang cho người thắng. Khi bất kì ai nhận archetype "X", họ sẽ nhận vòng quay "Hero X", khi archetype này rời khỏi bất kì ai, người đó sẽ nhận -1 all stats.',
    )
    .weight(0)
    .effect({
      type: "grant_wheel",
      wheelName: "Hero X Wheel",
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "after_combat_lose",
      target: "self",
      customHandler: "x_transfer_to_winner",
    })
    .register();

  registerWibuSubTypes();
  registerFarmerSubTypes();
  registerNewLondonArchetypes();
  registerTricksterSubTypes();
  registerPowerRangerSubTypes();
  registerSuperheroSubTypes();
  registerHeroXSubTypes();
  registerThaoDuocSubTypes();
}

function registerWibuSubTypes() {
  defineEffect("archetype_sub", "Dược sư tự sự")
    .description("Bạn không bị dính AIDS.")
    .weight(20)
    .effect({
      type: "immunity",
      immuneTo: ["AIDS"],
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("archetype_sub", "JJK")
    .description('Nhận "Domain Expansion Wheel".')
    .weight(16)
    .effect({
      type: "grant_wheel",
      wheelName: "Domain Expansion Wheel",
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("archetype_sub", "Jojo")
    .description('Nhận "Stands Wheel".')
    .weight(16)
    .effect({
      type: "grant_wheel",
      wheelName: "Stands Wheel",
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("archetype_sub", "My Hero Academia")
    .description('Nhận "MHA Power Wheel".')
    .weight(16)
    .effect({
      type: "grant_wheel",
      wheelName: "MHA Power Wheel",
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("archetype_sub", "One Piece")
    .description('Nhận "Haki Wheel".')
    .weight(16)
    .effect({
      type: "grant_wheel",
      wheelName: "Haki Wheel",
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("archetype_sub", "Bleach")
    .description('Nhận "Bankai Wheel".')
    .weight(16)
    .effect({
      type: "grant_wheel",
      wheelName: "Bankai Wheel",
      timing: "immediate",
      target: "self",
    })
    .register();

  // === STANDS ===
  defineEffect("archetype_sub", "Hey Ya!")
    .description("Bạn được cổ vũ tinh thần 💀.")
    .weight(29)
    .register();

  defineEffect("archetype_sub", "Tusk Act II")
    .description("Nhận +3 Strength và +2 BIQ.")
    .weight(26)
    .addStat("strength", 3)
    .addStat("biq", 2)
    .register();

  defineEffect("archetype_sub", "The World")
    .description("Trong Combat: Nếu thắng round Speed, nhận +4 BIQ và +3 MA.")
    .weight(26)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "the_world_speed_win",
    })
    .register();

  defineEffect("archetype_sub", "King Crimson")
    .description(
      "Nhận +4 MA. Trong Combat: Mỗi khi thắng 1 round, +2 stat round kế.",
    )
    .weight(12)
    .addStat("ma", 4)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "king_crimson_round_win_boost",
    })
    .register();

  defineEffect("archetype_sub", "Golden Experience Requiem")
    .description(
      "Trong Combat: Thua round -> đánh lại (mỗi stat 1 lần). Đối phương Crit thành công -> quay lại Crit Wheel (max 2 lần).",
    )
    .weight(7)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "golden_experience_requiem",
    })
    .register();

  // === DOMAIN EXPANSION ===
  defineEffect("archetype_sub", "Infinity")
    .description(
      "Trong Combat: Speed đối phương = 1. Đối phương +8 IQ, nếu IQ ≥ 14 thì bạn +2 điểm.",
    )
    .weight(8)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "domain_infinity",
    })
    .register();

  defineEffect("archetype_sub", "Malevolent Shrine")
    .description(
      "+1 Str, +1 MA. Trong Combat: +1 điểm thêm khi thắng round Str/MA.",
    )
    .weight(12)
    .addStat("strength", 1)
    .addStat("ma", 1)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "domain_malevolent_shrine",
    })
    .register();

  defineEffect("archetype_sub", "Idle Death Gamble")
    .description(
      "Trước Combat: 8% +100 all stats, 22% +1 all stats, 70% không gì. Vô hiệu hóa toàn bộ Power khác.",
    )
    .weight(20)
    .effect({
      type: "custom",
      timing: "before_combat",
      target: "self",
      customHandler: "domain_idle_death_gamble",
    })
    .register();

  defineEffect("archetype_sub", "Self-Embodiment of Perfection")
    .description(
      "Trong Combat: Thắng 3 round -> thắng ngay. -1 all stats. Yếu hơn các thắng ngay khác.",
    )
    .weight(20)
    .addAllStats(-1)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "domain_self_embodiment",
    })
    .register();

  defineEffect("archetype_sub", "Coffin of the Iron Mountain")
    .description("+3 Str, +2 BIQ, +2 MA.")
    .weight(20)
    .addStat("strength", 3)
    .addStat("biq", 2)
    .addStat("ma", 2)
    .register();

  defineEffect("archetype_sub", "Deadly Sentencing")
    .description('Khi thua trận, nhận "Sentence Wheel".')
    .weight(20)
    .effect({
      type: "grant_wheel",
      wheelName: "Sentence Wheel",
      timing: "after_combat_lose",
      target: "self",
    })
    .register();

  // === HAKI ===
  defineEffect("archetype_sub", "Observation")
    .description("+3 BIQ.")
    .weight(36)
    .addStat("biq", 3)
    .register();

  defineEffect("archetype_sub", "Armament")
    .description("+2 Durability, +1 MA.")
    .weight(36)
    .addStat("durability", 2)
    .addStat("ma", 1)
    .register();

  defineEffect("archetype_sub", "Observation + Armament")
    .description("+3 BIQ, +2 Durability, +1 MA.")
    .weight(24)
    .addStat("biq", 3)
    .addStat("durability", 2)
    .addStat("ma", 1)
    .register();

  defineEffect("archetype_sub", "Observation + Armament + King Conqueror")
    .description("+3 BIQ, +2 Durability, +1 MA. Đối thủ -1 all stats.")
    .weight(4)
    .addStat("biq", 3)
    .addStat("durability", 2)
    .addStat("ma", 1)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -1,
      timing: "before_combat",
      target: "opponent",
    })
    .register();

  // === BANKAI ===
  defineEffect("archetype_sub", "Shinuchi (Bankai)")
    .description("Trong Combat: Vô hiệu hóa ngẫu nhiên 2 Power của đối thủ.")
    .weight(15)
    .effect({
      type: "disable_powers",
      count: 2,
      timing: "during_combat",
      target: "opponent",
    })
    .register();

  defineEffect("archetype_sub", "Zanka no Tachi (Bankai)")
    .description("+4 BIQ.")
    .weight(25)
    .addStat("biq", 4)
    .register();

  defineEffect("archetype_sub", "Daiguren Hyorinmaru (Bankai)")
    .description("+4 MA.")
    .weight(25)
    .addStat("ma", 4)
    .register();

  defineEffect("archetype_sub", "Katen Kyokotsu: Karamatsu Shinju (Bankai)")
    .description("Trong Combat: Đối thủ -4 Durability.")
    .weight(25)
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: -4,
      timing: "before_combat",
      target: "opponent",
    })
    .register();

  defineEffect("archetype_sub", "Gangaku Kairo (Bankai)")
    .description("Khi thua nhiều round hơn thắng trong combat, +2 điểm.")
    .weight(10)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "bankai_gangaku_kairo",
    })
    .register();

  // === MHA POWERS ===
  defineEffect("archetype_sub", "Quirkless")
    .description("Bạn không nhận được gì cả 💀")
    .weight(13)
    .register();

  defineEffect("archetype_sub", "IQ")
    .description("+7 IQ. Biến mất khi thua round IQ.")
    .weight(12)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "mha_iq_power",
    })
    .register();

  defineEffect("archetype_sub", "Dark Shadow")
    .description("+2 all stats vào trận 1, 3, 5, 7, 9,... (Không tính PvE)")
    .weight(11)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "mha_dark_shadow",
    })
    .register();

  defineEffect("archetype_sub", "Erasure")
    .description(
      "Trong combat: Vô hiệu hóa tối đa 3 Power ngẫu nhiên của đối phương.",
    )
    .weight(11)
    .effect({
      type: "disable_powers",
      count: 3,
      timing: "during_combat",
      target: "opponent",
    })
    .register();

  defineEffect("archetype_sub", "Heal")
    .description("+3 Durability. Sau mỗi combat, +1 Durability vĩnh viễn.")
    .weight(11)
    .addStat("durability", 3)
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: 1,
      timing: "after_combat",
      target: "self",
    })
    .register();

  defineEffect("archetype_sub", "Half-Cold Half-Hot")
    .description(
      "Trong combat: 50% -1 all stats đối thủ. 50% +1 all stats bạn. (Riêng biệt)",
    )
    .weight(11)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "mha_half_cold_half_hot",
    })
    .register();

  defineEffect("archetype_sub", "Float")
    .description(
      "+2 Speed. Thắng round Speed -> +1 điểm cuối combat. Sau combat thắng -> +1 Speed.",
    )
    .weight(7)
    .addStat("speed", 2)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "mha_float",
    })
    .register();

  defineEffect("archetype_sub", "Hellflame")
    .description(
      "+1 all stats. Sau 2 combat thắng -> +1 thêm. Thua -> reset về +1.",
    )
    .weight(7)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "mha_hellflame",
    })
    .register();

  defineEffect("archetype_sub", "Rewind")
    .description(
      "Đưa đối thủ về trạng thái vòng trước (loại bỏ PvP Rewards và hiệu ứng). Vĩnh viễn.",
    )
    .weight(7)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "opponent",
      customHandler: "mha_rewind",
    })
    .register();

  defineEffect("archetype_sub", "Overhaul")
    .description(
      "Thắng Speed và MA -> thắng ngay. Mỗi lần không kích hoạt -> +1 Speed, +1 MA.",
    )
    .weight(6)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "mha_overhaul",
    })
    .register();

  defineEffect("archetype_sub", "One For All")
    .description(
      "+3 Str, +3 Speed, +3 Dur. Không thể vô hiệu. Chung kết: gấp đôi bonus. Unique.",
    )
    .weight(2)
    .addStat("strength", 3)
    .addStat("speed", 3)
    .addStat("durability", 3)
    .effect({
      type: "immunity",
      immuneTo: ["disable_power"],
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "mha_one_for_all_finals",
    })
    .register();

  defineEffect("archetype_sub", "All For One")
    .description(
      "Trong combat: Nhận 1 hiệu ứng MHA ngẫu nhiên (không phải One For All). Thắng -> giữ vĩnh viễn. Unique.",
    )
    .weight(2)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "mha_all_for_one",
    })
    .register();
}

function registerFarmerSubTypes() {
  defineEffect("archetype_sub", "Normal Farmer")
    .description("Bạn về quê nuôi cá và trồng thêm rau.")
    .weight(85)
    .register();

  defineEffect("archetype_sub", "thường")
    .description("Bạn về quê nuôi cá và trồng thêm rau.")
    .weight(85)
    .register();

  defineEffect("archetype_sub", "Aura Farmer")
    .description(
      "+2 all stats. Vào chung kết không thua PvP -> +1 all stats. Thua -> mất aura và Farmer.",
    )
    .weight(15)
    .addAllStats(2)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "aura_farmer",
    })
    .register();
}

function registerNewLondonArchetypes() {
  defineEffect("archetype", "Frostlanders")
    .description("Base Dura +1, Dura +1. Sau Combat: Dura +1.")
    .weight(0)
    .addStat("durability", 1, true)
    .addStat("durability", 1)
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: 1,
      timing: "after_combat",
      target: "self",
    })
    .register();

  defineEffect("archetype", "New Londoners")
    .description("Base IQ +1, IQ +1. Sau Combat: IQ +1.")
    .weight(0)
    .addStat("iq", 1, true)
    .addStat("iq", 1)
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: 1,
      timing: "after_combat",
      target: "self",
    })
    .register();

  defineEffect("archetype", "Wanderers")
    .description("Base Speed +1, Speed +1. Sau Combat: Speed +1.")
    .weight(0)
    .addStat("speed", 1, true)
    .addStat("speed", 1)
    .effect({
      type: "stat_modifier",
      stat: "speed",
      value: 1,
      timing: "after_combat",
      target: "self",
    })
    .register();

  defineEffect("archetype", "Foragers")
    .description("Base MA +1, MA +1. Sau Combat: MA +1.")
    .weight(0)
    .addStat("ma", 1, true)
    .addStat("ma", 1)
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 1,
      timing: "after_combat",
      target: "self",
    })
    .register();

  defineEffect("archetype", "Labourers")
    .description("Base Strength +1, Strength +1. Sau Combat: Strength +1.")
    .weight(0)
    .addStat("strength", 1, true)
    .addStat("strength", 1)
    .effect({
      type: "stat_modifier",
      stat: "strength",
      value: 1,
      timing: "after_combat",
      target: "self",
    })
    .register();

  defineEffect("archetype", "Lords")
    .description("Base BIQ +1, BIQ +1. Sau Combat: BIQ +1.")
    .weight(0)
    .addStat("biq", 1, true)
    .addStat("biq", 1)
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 1,
      timing: "after_combat",
      target: "self",
    })
    .register();

  defineEffect("archetype", "Machinists")
    .description("Nhận 1 Gear. Sau Combat: Nhận 1 Gear.")
    .weight(0)
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "random",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "random",
      grantCount: 1,
      timing: "after_combat",
      target: "self",
    })
    .register();

  defineEffect("archetype", "Merchants")
    .description(
      'Nhận 1 Gear "Đồng Tiền Vàng". Sau Combat: Bán 1 Gear lấy 1 "Đồng Tiền Vàng" (Gear bị bán ko thể là đồng tiền vàng)',
    )
    .weight(0)
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "Đồng Tiền Vàng",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "merchants_sell_gear",
    })
    .register();

  defineEffect("archetype", "Thinkers")
    .description('Nhận Quirk "Fast Leaner" và "Night Owl".')
    .weight(0)
    .effect({
      type: "grant_quirk",
      grantType: "quirk",
      grantName: "Fast Leaner",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "grant_quirk",
      grantType: "quirk",
      grantName: "Night Owl",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("archetype", "Evolvers")
    .description(
      '"Adapt and embrace the frost. Natural selection rewards Merit. Design works only through reason." Chuyển tất cả Debuff của đối thủ dành cho mình thành Buff tặng cho mình.',
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "evolvers_convert_debuff",
    })
    .register();

  defineEffect("archetype", "Faithkeepers")
    .description(
      '"Progress the advance humanity. Equal as one flock. Tradition is our bedrock." Nhận Toàn bộ Quirk của 1 người nhà "New London" khác.',
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "faithkeepers_copy_quirks",
    })
    .register();

  defineEffect("archetype", "Pilgrims")
    .description(
      '"Adapt; the frost humbles all. All are equal in the frostland. Tradition will ground and guide us." Biến đổi Debuff của bản thân thành "Thay vì giảm chỉ số đối thủ, Buff tăng chỉ số cho mình."',
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "pilgrims_convert_self_debuff",
    })
    .register();

  defineEffect("archetype", "Stalwarts")
    .description(
      '"Progress for the glory of New London. Merit forges the strongest. Reason for order, order for control." Nhận +2 Strength, +2 IQ và +2 BIQ',
    )
    .weight(0)
    .addStat("strength", 2)
    .addStat("iq", 2)
    .addStat("biq", 2)
    .register();

  defineEffect("archetype", "Bohemians")
    .description(
      '"Adaptation is the art of survival. Equality frees us. Tradition isn\'t afraid to destroy an old canvas." Trong Combat: Tất cả vòng quay Stat/trọng số đều là 40/40/20 (20% hòa). All Stats của bạn cố định là 99.',
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "bohemians_stats_99",
    })
    .register();

  defineEffect("archetype", "Icebloods")
    .description(
      '"Embrace Adaptation, reward Merit, honour Tradition." Trong Combat: Nhận thêm 1 điểm nếu thắng round, trừ đi 1 điểm nếu thua round.',
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "icebloods_round_bonus",
    })
    .register();

  defineEffect("archetype", "Legionnaires")
    .description(
      '"Progress marches ever forward. Equality in the ranks. Tradition ensures order." Sau Combat: Nếu thắng trận, khởi đầu trận tiếp theo với 1 điểm.',
    )
    .weight(0)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "self",
      customHandler: "legionnaires_after_win",
    })
    .register();

  defineEffect("archetype", "Menders")
    .description(
      '"Adaptation staves off hubris. Equality before the frost. Traditions guide us." Sau Combat: Stat thấp nhất của đối thủ sẽ +2 vào Stat đó của mình, Stat cao nhất của đối thủ sẽ +1 vào stat đó của mình',
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "menders_stat_gain",
    })
    .register();

  defineEffect("archetype", "Overseers")
    .description(
      '"Progress guided by the worthy. Merit culls the excess. Tradition ensures hierarchy." Trong Combat: Cả hai chỉ được chọn 1 Power có chữ "Trong Combat" để kích hoạt. Debuff: -1 All Stat của đối thủ.',
    )
    .weight(0)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -1,
      timing: "before_combat",
      target: "opponent",
    })
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "both",
      customHandler: "overseers_limit_powers",
    })
    .register();

  defineEffect("archetype", "Proteans")
    .description(
      '"Adaptation through evolution. Merit so the best survives. Reason for every blueprint." BIQ +5. Nhận Power "Darwin Evolution Theory"',
    )
    .weight(0)
    .addStat("biq", 5)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "Darwin Evolution Theory",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("archetype", "Technocrats")
    .description(
      '"Technology will ensure prosperity. Equality for all citizens. Reason guarantees social harmony." IQ +5. Nhận Power "Algorithms Are Clear"',
    )
    .weight(0)
    .addStat("iq", 5)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "Algorithms Are Clear",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("archetype", "Venturers")
    .description(
      '"Progress, for those who can keep pace. Merit fuels the industrious. Reason to optomize investment." Trong Combat: Sau khi xác định được Trọng Số của hai bên, nhận +4 vào Trọng số của bạn nếu bạn cao hơn, +8 vào Trọng số của bạn nếu thấp hơn.',
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "venturers_weight_bonus",
    })
    .register();
}

function registerTricksterSubTypes() {
  defineEffect("archetype_sub", "Ace of Spades")
    .description(
      "Sau khi kết thúc tính điểm combat, điểm của bạn là điểm của đối phương và ngược lại.",
    )
    .weight(10)
    .effect({
      type: "custom",
      timing: "after_combat_scoring",
      target: "both",
      customHandler: "ace_of_spades_swap_points",
    })
    .register();

  defineEffect("archetype_sub", "King of Diamonds")
    .description("+1 all stats.")
    .weight(30)
    .addAllStats(1)
    .register();

  defineEffect("archetype_sub", "Queen of Clubs")
    .description("-1 all stats.")
    .weight(35)
    .addAllStats(-1)
    .register();

  defineEffect("archetype_sub", "Jack of 97")
    .description("+97 all stats.")
    .weight(0.97)
    .addAllStats(97)
    .register();

  defineEffect("archetype_sub", "Ten of Hearts")
    .description("Không có gì xảy ra.")
    .weight(24.03)
    .register();
}

function registerPowerRangerSubTypes() {
  defineEffect("archetype_sub", "Red")
    .description(
      "Power Ranger - Red. Trong combat: Thắng round Strength có 20% nhận thêm 2 điểm.",
    )
    .weight(19)
    .effect({
      type: "custom",
      timing: "on_round_win",
      target: "self",
      customHandler: "power_ranger_red_str_bonus",
      conditions: [{ type: "probability", chance: 20 }],
    })
    .register();

  defineEffect("archetype_sub", "Blue")
    .description(
      "Power Ranger - Blue. Trong combat: Thắng round Speed có 33% nhận +3 Base Speed.",
    )
    .weight(19)
    .effect({
      type: "custom",
      timing: "on_round_win",
      target: "self",
      customHandler: "power_ranger_blue_spd_bonus",
      conditions: [{ type: "probability", chance: 33 }],
    })
    .register();

  defineEffect("archetype_sub", "Black")
    .description(
      "Power Ranger - Black. Trong combat: Thắng round Dura có 20% nhận 1 Power ngẫu nhiên.",
    )
    .weight(19)
    .effect({
      type: "custom",
      timing: "on_round_win",
      target: "self",
      customHandler: "power_ranger_black_power",
      conditions: [{ type: "probability", chance: 20 }],
    })
    .register();

  defineEffect("archetype_sub", "Yellow")
    .description(
      "Power Ranger - Yellow. Trong combat: Thắng round IQ có 25% nhận 1 Gear.",
    )
    .weight(19)
    .effect({
      type: "custom",
      timing: "on_round_win",
      target: "self",
      customHandler: "power_ranger_yellow_gear",
      conditions: [{ type: "probability", chance: 25 }],
    })
    .register();

  defineEffect("archetype_sub", "Pink")
    .description(
      "Power Ranger - Pink. Trong combat: Thắng round BIQ/MA có 25% nhận +1 Base vào stat ngẫu nhiên.",
    )
    .weight(19)
    .effect({
      type: "custom",
      timing: "on_round_win",
      target: "self",
      customHandler: "power_ranger_pink_base_stat",
      conditions: [{ type: "probability", chance: 25 }],
    })
    .register();

  defineEffect("archetype_sub", "Silver")
    .description(
      "Power Ranger - Silver. Trong combat: Thắng round có 15% gấp đôi stat ở round tiếp theo.",
    )
    .weight(5)
    .effect({
      type: "custom",
      timing: "on_round_win",
      target: "self",
      customHandler: "power_ranger_silver_double",
      conditions: [{ type: "probability", chance: 15 }],
    })
    .register();
}

function registerSuperheroSubTypes() {
  defineEffect("archetype_sub", "Captain America")
    .description("+1 điểm vs Human. Sau combat: +1 Strength, +1 Dura.")
    .weight(12.5)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "self",
      conditions: [{ type: "race_match", races: ["Human"] }],
    })
    .effect({
      type: "stat_modifier",
      stat: "strength",
      value: 1,
      timing: "after_combat",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "durability",
      value: 1,
      timing: "after_combat",
      target: "self",
    })
    .register();

  defineEffect("archetype_sub", "Iron Man")
    .description("Mỗi khi nhận 1 Gear, nhận +1 vào stat ngẫu nhiên.")
    .weight(12.5)
    .effect({
      type: "custom",
      timing: "on_gear_received",
      target: "self",
      customHandler: "iron_man_gear_bonus",
    })
    .register();

  defineEffect("archetype_sub", "Batman")
    .description(
      "Trước combat: Nhận 4 Gear ngẫu nhiên để sử dụng riêng trong combat đó.",
    )
    .weight(12.5)
    .effect({
      type: "custom",
      timing: "before_combat",
      target: "self",
      customHandler: "batman_temp_gear",
    })
    .register();

  defineEffect("archetype_sub", "Superman")
    .description(
      '+1 all stats và 2 Power. 16 người ngẫu nhiên nhận Gear "Kryptonite" - đối đầu họ bị 2 điểm khởi đầu.',
    )
    .weight(12.5)
    .addAllStats(1)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "superman_kryptonite",
    })
    .register();

  defineEffect("archetype_sub", "Wonder Woman")
    .description('Sau combat: +1 BIQ, +1 MA. Vs Superman: nói "Kal-El No!"')
    .weight(12.5)
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 1,
      timing: "after_combat",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 1,
      timing: "after_combat",
      target: "self",
    })
    .register();

  defineEffect("archetype_sub", "Spiderman")
    .description(
      "Khi đối thủ thắng 3 round, nhận 6 stat chia đều cho round chưa đấu. Round cuối: +1 điểm.",
    )
    .weight(12.5)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "spiderman_comeback",
    })
    .register();

  defineEffect("archetype_sub", "The Flash")
    .description(
      "Speed Base mặc định = 10. Trong combat: Tỉ lệ thắng round Speed cố định 90%.",
    )
    .weight(12.5)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "the_flash_speed_setup",
    })
    .register();

  defineEffect("archetype_sub", "Hulk")
    .description("Combat lẻ: +3 IQ. Combat chẵn: +3 Strength, +3 Dura.")
    .weight(12.5)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "hulk_combat_parity",
    })
    .register();
}

function registerHeroXSubTypes() {
  defineEffect("archetype_sub", "Lin Ling")
    .description("Hero X - Lin Ling. +1 all stats.")
    .weight(19)
    .addAllStats(1)
    .register();

  defineEffect("archetype_sub", "E-Soul")
    .description("Hero X - E-Soul. +8 Speed.")
    .weight(15)
    .addStat("speed", 8)
    .register();

  defineEffect("archetype_sub", "Ahu")
    .description(
      'Hero X - Ahu. Biết sủa và cắn. Mặc định thắng người có Summon "Chihuahua".',
    )
    .weight(12)
    .effect({
      type: "custom",
      timing: "before_combat",
      target: "self",
      customHandler: "ahu_vs_chihuahua",
    })
    .register();

  defineEffect("archetype_sub", "Lucky Cyan")
    .description('Hero X - Lucky Cyan. Nhận Power "Super Lucky".')
    .weight(11)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "Super Lucky",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("archetype_sub", "Loli")
    .description("Hero X - Loli. +4 IQ, +4 BIQ.")
    .weight(10)
    .addStat("iq", 4)
    .addStat("biq", 4)
    .register();

  defineEffect("archetype_sub", "The Johnnies")
    .description(
      "Hero X - The Johnnies. Vs có Summon: +2 điểm. Thắng vs không Summon: nhận 1 Summon.",
    )
    .weight(8)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "the_johnnies_summon_bonus",
    })
    .register();

  defineEffect("archetype_sub", "Ghostblade")
    .description(
      'Hero X - Ghostblade. Nhận Power "Critical Strike". Crit thành công nhận 2 điểm thay vì 1.',
    )
    .weight(8)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "Critical Strike",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "ghostblade_double_crit",
    })
    .register();

  defineEffect("archetype_sub", "Dragon Boy")
    .description(
      "Hero X - Dragon Boy. Nếu thua 3 round đầu, thắng luôn combat.",
    )
    .weight(7)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "dragon_boy_comeback",
    })
    .register();

  defineEffect("archetype_sub", "Queen")
    .description(
      'Hero X - Queen. Trong Combat: Toàn bộ Power "Buff" của đối thủ bị vô hiệu.',
    )
    .weight(7)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "opponent",
      customHandler: "queen_disable_buffs",
    })
    .register();

  defineEffect("archetype_sub", "X")
    .description(
      "Hero X - X. Mặc định thắng tất cả trận đến chung kết tổng với 6-0. (Tuyệt đối)",
    )
    .weight(3)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "hero_x_auto_win",
    })
    .register();
}

function registerThaoDuocSubTypes() {
  defineEffect("archetype_sub", "Mirage Flower")
    .description(
      "Thảo dược. Thắng: +1 PvP Reward. Thua: +1 Char Dev ngẫu nhiên.",
    )
    .weight(16.67)
    .effect({
      type: "custom",
      timing: "after_combat_win",
      target: "self",
      customHandler: "mirage_flower_win",
    })
    .effect({
      type: "grant_char_dev",
      grantType: "char_dev",
      grantName: "random",
      grantCount: 1,
      timing: "after_combat_lose",
      target: "self",
    })
    .register();

  defineEffect("archetype_sub", "Sunberry")
    .description("Thảo dược. Thắng: +2 stat cao nhất. Thua: +6 stat thấp nhất.")
    .weight(16.67)
    .effect({
      type: "stat_modifier",
      stat: "highest",
      value: 2,
      timing: "after_combat_win",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 6,
      timing: "after_combat_lose",
      target: "self",
    })
    .register();

  defineEffect("archetype_sub", "Dragon's Weed")
    .description(
      "Thảo dược. Thắng: +1 Power. Thua: mất hết Power, nhận 4 Power.",
    )
    .weight(16.67)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "random",
      grantCount: 1,
      timing: "after_combat_win",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "after_combat_lose",
      target: "self",
      customHandler: "dragons_weed_lose",
    })
    .register();

  defineEffect("archetype_sub", "Moonroot")
    .description(
      "Thảo dược. Thắng: +1 điểm KĐ combat kế. Thua: +3 điểm KĐ combat kế.",
    )
    .weight(16.67)
    .effect({
      type: "custom",
      timing: "after_combat_win",
      target: "self",
      customHandler: "moonroot_win",
    })
    .effect({
      type: "custom",
      timing: "after_combat_lose",
      target: "self",
      customHandler: "moonroot_lose",
    })
    .register();

  defineEffect("archetype_sub", "Mistpetal")
    .description("Thảo dược. Thắng: +1 Quirk. Thua: +6 Quirk.")
    .weight(16.67)
    .effect({
      type: "grant_quirk",
      grantType: "quirk",
      grantName: "random",
      grantCount: 1,
      timing: "after_combat_win",
      target: "self",
    })
    .effect({
      type: "grant_quirk",
      grantType: "quirk",
      grantName: "random",
      grantCount: 6,
      timing: "after_combat_lose",
      target: "self",
    })
    .register();

  defineEffect("archetype_sub", "Eldritch Mushroom")
    .description("Thảo dược. Thắng: -1 all stats. Thua: +1 all stats.")
    .weight(16.67)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -1,
      timing: "after_combat_win",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "after_combat_lose",
      target: "self",
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

registerImmediateHandler(
  "invoker_orb_bonus",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const powers = (ctx.character.powers || []).filter((p: any) => !p.isLost);
    const powerNames = powers.map((p: any) => p.name);
    const hasQuas = powerNames.includes("Quas");
    const hasWex = powerNames.includes("Wex");
    const hasExort = powerNames.includes("Exort");
    if (hasQuas && hasWex && hasExort) {
      return {
        statModifiers: STAT_NAMES.map((stat) => ({ stat, value: 2 })),
        skipDefault: true,
        description: "+2 all stats (Invoker orb synergy)",
      };
    }
    return { skipDefault: true };
  },
  "+2 all stats with all orbs",
);

registerImmediateHandler(
  "egoist_stats_check",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Auto-win if all stats higher (combat)",
    };
  },
  "Egoist auto-win check",
);

registerImmediateHandler(
  "pacifist_peace_bonus",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Double rewards on loss (Pacifist)",
    };
  },
  "Pacifist peace bonus",
);

registerImmediateHandler(
  "paladin_holy_bonus",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const weapons = ctx.character.weapons || [];
    const hasHolyWeapon = weapons.some(
      (w: any) => !w.isLost && w.element === "holy",
    );
    if (hasHolyWeapon) {
      return {
        statModifiers: [
          { stat: "ma", value: 2 },
          { stat: "durability", value: 1 },
        ],
        skipDefault: true,
        description: "+2 MA, +1 Durability (Paladin with holy weapon)",
      };
    }
    return { skipDefault: true };
  },
  "Paladin holy weapon bonus",
);

registerImmediateHandler(
  "gigachad_physical_bonus",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: "strength", value: 2 },
        { stat: "durability", value: 2 },
      ],
      skipDefault: true,
      description: "+2 Strength, +2 Durability (Gigachad)",
    };
  },
  "+2 Str/Dura (Gigachad)",
);

registerImmediateHandler(
  "femboy_social_bonus",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: "biq", value: 2 },
        { stat: "speed", value: 1 },
      ],
      skipDefault: true,
      description: "+2 BIQ, +1 Speed (Femboy)",
    };
  },
  "+2 BIQ, +1 Speed (Femboy)",
);

registerImmediateHandler(
  "nobleman_leadership",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const charData = ctx.character as any;
    const tier = charData.raceTier || 5;
    const bonus = Math.max(0, 5 - tier);
    if (bonus > 0) {
      return {
        statModifiers: [{ stat: "iq", value: bonus }],
        skipDefault: true,
        description: `+${bonus} IQ (Nobleman leadership)`,
      };
    }
    return { skipDefault: true };
  },
  "Nobleman leadership bonus",
);

registerImmediateHandler(
  "assassin_stealth_bonus",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: "speed", value: 3 },
        { stat: "durability", value: -1 },
      ],
      skipDefault: true,
      description: "+3 Speed, -1 Durability (Assassin)",
    };
  },
  "+3 Speed, -1 Durability (Assassin)",
);

registerImmediateHandler(
  "berserker_rage_bonus",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: "strength", value: 3 },
        { stat: "iq", value: -2 },
      ],
      skipDefault: true,
      description: "+3 Strength, -2 IQ (Berserker)",
    };
  },
  "+3 Strength, -2 IQ (Berserker)",
);

registerImmediateHandler(
  "scholar_intellect_bonus",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: "iq", value: 3 },
        { stat: "strength", value: -1 },
      ],
      skipDefault: true,
      description: "+3 IQ, -1 Strength (Scholar)",
    };
  },
  "+3 IQ, -1 Strength (Scholar)",
);

registerImmediateHandler(
  "merchant_gear_bonus",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const gear = ctx.character.gear || [];
    const gearCount = (Array.isArray(gear) ? gear : [gear]).filter(
      (g: any) => !g.isLost,
    ).length;
    if (gearCount >= 3) {
      return {
        statModifiers: [{ stat: "biq", value: gearCount }],
        skipDefault: true,
        description: `+${gearCount} BIQ (Merchant with ${gearCount} gears)`,
      };
    }
    return { skipDefault: true };
  },
  "BIQ bonus per gear",
);

registerImmediateHandler(
  "wanderer_journey_bonus",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const randomStat =
      STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      statModifiers: [{ stat: randomStat, value: 2 }],
      skipDefault: true,
      description: `+2 ${randomStat} (Wanderer)`,
    };
  },
  "+2 random stat (Wanderer)",
);

registerImmediateHandler(
  "hero_balanced_bonus",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: STAT_NAMES.map((stat) => ({ stat, value: 1 })),
      skipDefault: true,
      description: "+1 all stats (Hero)",
    };
  },
  "+1 all stats (Hero)",
);

registerImmediateHandler(
  "villain_menace_bonus",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: [
        { stat: "biq", value: 2 },
        { stat: "strength", value: 1 },
      ],
      skipDefault: true,
      description: "+2 BIQ, +1 Strength (Villain)",
    };
  },
  "+2 BIQ, +1 Strength (Villain)",
);

registerImmediateHandler(
  "dual_wielder_two_weapons",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Dùng được 2 vũ khí (Dual Wielder)",
    };
  },
  "Can use 2 weapons",
);

registerImmediateHandler(
  "loyal_single_lover",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Chỉ có 1 Lover duy nhất (Loyal)",
    };
  },
  "Only 1 Lover allowed",
);

registerImmediateHandler(
  "blacksmith_weapon_setup",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Chắc chắn có vũ khí Runeword, dùng được mọi vũ khí (Blacksmith)",
    };
  },
  "Guaranteed runeword weapon",
);

registerImmediateHandler(
  "nguoi_trong_ban_nhac_setup",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        '36% Instrument Weapon, House "Ban Nhạc Ngọt Đoàn Kết" (Người Trong Ban Nhạc)',
    };
  },
  "Instrument weapon + band house setup",
);

registerImmediateHandler(
  "mason_enhanced_house_feature",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Cường hóa House Feature (Mason)",
    };
  },
  "Enhanced House Feature",
);

registerImmediateHandler(
  "aura_farmer",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const nestedArchetypes = ctx.character.nestedArchetypes || [];
    const auraFarmer = nestedArchetypes.find(
      (a: any) => a.subType === "Aura Farmer" || a.subSubType === "Aura Farmer",
    );
    if (auraFarmer && (auraFarmer as any).isLost) {
      return { skipDefault: true, description: "Aura Farmer đã mất aura" };
    }
    const inFinals =
      ctx.character.tournament?.bracket === "winner" ||
      ctx.character.tournament?.round === "final";
    if (inFinals) {
      return {
        statModifiers: STAT_NAMES.map((stat) => ({ stat, value: 3 })),
        skipDefault: true,
        description: "+3 All Stats (Aura Farmer - chung kết)",
      };
    }
    return { skipDefault: false, description: "+2 All Stats (Aura Farmer)" };
  },
  "+2 all stats, extra in finals",
);

registerImmediateHandler(
  "the_flash_speed_setup",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const diff = 10 - ctx.baseStats.speed;
    return {
      statModifiers:
        diff !== 0 ? [{ stat: "speed", value: diff, isBase: true }] : [],
      skipDefault: true,
      description: `Base Speed = 10 (The Flash${diff !== 0 ? `, ${diff > 0 ? "+" : ""}${diff}` : ""})`,
    };
  },
  "Set Base Speed to 10",
);

registerImmediateHandler(
  "faithkeepers_copy_quirks",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Nhận toàn bộ Quirk của 1 người nhà New London khác (Faithkeepers)",
    };
  },
  "Copy quirks from New London housemate",
);

// ============================================================================
// COMBAT HANDLERS
// ============================================================================

registerCombatHandler(
  "perfectionist_dominate_check",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const margin = ctx.self.roundsWon - ctx.self.roundsLost;
    if (margin < 4)
      return {
        skipDefault: true,
        description: "Perfectionist: chưa đủ cách biệt 4 điểm",
      };
    let lowestStat: StatName = "strength";
    let lowestVal = ctx.self.stats.strength;
    for (const stat of STAT_NAMES) {
      if ((ctx.self.stats as Record<StatName, number>)[stat] < lowestVal) {
        lowestVal = (ctx.self.stats as Record<StatName, number>)[stat];
        lowestStat = stat;
      }
    }
    return {
      selfStatMods: [{ stat: lowestStat, value: 4 }],
      description: `+4 ${lowestStat} (Perfectionist - thắng cách biệt ${margin} điểm)`,
    };
  },
  "+4 lowest stat if won by ≥4 margin",
);

registerCombatHandler(
  "bravest_double_pvp_reward",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: "Nhận 2 PvP Rewards thay vì 1 (Bravest of the Brave)",
    };
  },
  "Double PvP rewards on win",
);

registerCombatHandler(
  "invoker_random_power",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      skipDefault: true,
      description:
        "[GM] Invoker: Đã quay 1 Power ngẫu nhiên chưa sở hữu trước combat",
    };
  },
  "Random power before combat (GM manual action)",
);

registerCombatHandler(
  "summoner_unique_summon",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return { description: "Nhận 1 lần vòng quay Summon (Summoner)" };
  },
  "Grant Summon Wheel on win",
);

registerCombatHandler(
  "sentinel_of_purity_isekai",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description:
        'Nhận Char Dev "Isekai" khi bị AIDS lần đầu (Sentinel of Purity)',
    };
  },
  "Grant Isekai char dev on AIDS",
);

registerCombatHandler(
  "infirmarian_cure_aids",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      removePower: "AIDS",
      description: "Loại bỏ AIDS khỏi cả 2 người chơi (Infirmarian)",
    };
  },
  "Remove AIDS from both players after combat",
);

registerCombatHandler(
  "loyal_lover_death_char_dev",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return { description: "Nhận +1 Char Dev khi Lover bị loại (Loyal)" };
  },
  "Grant Char Dev when Lover eliminated",
);

registerCombatHandler(
  "fisher_round_16_reward",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return { description: "Nhận +1 PvP Rewards khi đến vòng 16 (Fisher)" };
  },
  "+1 PvP Rewards at Round 16",
);

registerCombatHandler(
  "merchants_sell_gear",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return { description: 'Bán 1 Gear lấy 1 "Đồng Tiền Vàng" (Merchants)' };
  },
  "Sell 1 Gear for 1 Gold Coin after combat",
);

registerCombatHandler(
  "egoist_win_condition",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const selfScore: number = (ctx.self as any).currentScore ?? 0;
    const oppScore: number = (ctx.opponent as any)?.currentScore ?? 0;
    const margin = selfScore - oppScore;
    if (margin >= 4) {
      return {
        skipDefault: true,
        description: `Egoist: thắng cách biệt ${margin} điểm ≥ 4 ✓`,
      };
    }
    // Không thắng cách biệt ≥4 → tự thua: cộng điểm cho đối thủ để đảo kết quả
    const needed = 4 - margin;
    return {
      opponentPoints: needed,
      description: `Egoist: không thắng cách biệt ≥4 điểm → bị thua (đối thủ +${needed} điểm)`,
    };
  },
  "Egoist: lose if win margin < 4",
);

registerCombatHandler(
  "edgelord_underdog_point",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const selfScore: number = (ctx.self as any).currentScore ?? 0;
    const oppScore: number = (ctx.opponent as any)?.currentScore ?? 0;
    if (selfScore < oppScore) {
      return {
        selfPoints: 1,
        description: `Edgelord: mình thấp hơn (${selfScore} vs ${oppScore}) → mình +1 điểm`,
      };
    }
    if (oppScore < selfScore) {
      return {
        opponentPoints: 1,
        description: `Edgelord: đối thủ thấp hơn (${oppScore} vs ${selfScore}) → đối thủ +1 điểm`,
      };
    }
    return {
      skipDefault: true,
      description: `Edgelord: bằng nhau (${selfScore} vs ${oppScore}), không kích hoạt`,
    };
  },
  "Edgelord: +1 point if losing on score before end",
);

registerCombatHandler(
  "x_transfer_to_winner",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return { description: "Archetype X chuyển cho người thắng (X)" };
  },
  "Transfer X archetype to winner on loss",
);

registerCombatHandler(
  "mha_dark_shadow",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.isPvE) return { skipDefault: true };
    const combatNumber = ctx.self.pvpWins + 1;
    if (combatNumber % 2 === 1) {
      return {
        selfStatMods: STAT_NAMES.map((stat) => ({ stat, value: 2 })),
        description: `+2 All Stats (Dark Shadow - trận ${combatNumber}, lẻ)`,
      };
    }
    return {
      skipDefault: true,
      description: `Dark Shadow: trận ${combatNumber} (chẵn, không kích hoạt)`,
    };
  },
  "+2 all stats on odd-numbered combats",
);

registerCombatHandler(
  "mha_half_cold_half_hot",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const coldActivates = Math.random() < 0.5;
    const hotActivates = Math.random() < 0.5;
    const result: CombatHandlerResult = {};
    const descs: string[] = [];
    if (coldActivates) {
      result.opponentStatMods = STAT_NAMES.map((stat) => ({ stat, value: -1 }));
      descs.push("-1 All Stats đối thủ (Cold)");
    }
    if (hotActivates) {
      result.selfStatMods = STAT_NAMES.map((stat) => ({ stat, value: 1 }));
      descs.push("+1 All Stats bạn (Hot)");
    }
    if (descs.length === 0)
      return {
        skipDefault: true,
        description: "Half-Cold Half-Hot: không kích hoạt",
      };
    result.description = descs.join(", ");
    return result;
  },
  "50% -1 all opponent, 50% +1 all self (separate rolls)",
);

registerCombatHandler(
  "mha_float",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    if (ctx.roundResults?.speed === "win") {
      return {
        selfPoints: 1,
        description: "+1 điểm cuối combat (Float - thắng round Speed)",
      };
    }
    return { skipDefault: true };
  },
  "+1 point if won speed round, +1 Speed on combat win",
);

registerCombatHandler(
  "mha_rewind",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description:
        "Đưa đối thủ về trạng thái vòng trước - loại bỏ PvP Rewards (Rewind)",
    };
  },
  "Rewind opponent to previous state",
);

registerCombatHandler(
  "mha_overhaul",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const wonSpeed = ctx.roundResults?.speed === "win";
    const wonMA = ctx.roundResults?.ma === "win";
    if (wonSpeed && wonMA)
      return {
        autoWin: true,
        description: "Auto win - thắng cả Speed và MA (Overhaul)",
      };
    return {
      selfStatMods: [
        { stat: "speed", value: 1 },
        { stat: "ma", value: 1 },
      ],
      description: "+1 Speed, +1 MA (Overhaul - chưa kích hoạt instant win)",
    };
  },
  "Auto win if won Speed+MA, else +1 Speed +1 MA",
);

registerCombatHandler(
  "mha_one_for_all_finals",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.isFinals) return { skipDefault: true };
    return {
      selfStatMods: [
        { stat: "strength", value: 3 },
        { stat: "speed", value: 3 },
        { stat: "durability", value: 3 },
      ],
      description: "+3 Str, +3 Spd, +3 Dur thêm (One For All - Chung kết)",
    };
  },
  "Double bonus in finals",
);

registerCombatHandler(
  "mha_all_for_one",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    const randomStat =
      STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    const value = Math.floor(Math.random() * 4) + 2;
    return {
      selfStatMods: [{ stat: randomStat, value }],
      description: `+${value} ${randomStat} (All For One - hiệu ứng MHA ngẫu nhiên)`,
    };
  },
  "Random MHA effect during combat",
);

registerCombatHandler(
  "domain_malevolent_shrine",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    let bonusPoints = 0;
    if (ctx.roundResults?.strength === "win") bonusPoints++;
    if (ctx.roundResults?.ma === "win") bonusPoints++;
    if (bonusPoints === 0) return { skipDefault: true };
    return {
      selfPoints: bonusPoints,
      description: `+${bonusPoints} điểm thêm (Malevolent Shrine - thắng round Str/MA)`,
    };
  },
  "+1 point per Str/MA round won",
);

registerCombatHandler(
  "domain_idle_death_gamble",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    const roll = Math.random();
    if (roll < 0.08)
      return {
        selfStatMods: STAT_NAMES.map((stat) => ({ stat, value: 100 })),
        description: "+100 All Stats! (Idle Death Gamble - 8% jackpot)",
      };
    if (roll < 0.3)
      return {
        selfStatMods: STAT_NAMES.map((stat) => ({ stat, value: 1 })),
        description: "+1 All Stats (Idle Death Gamble - 22%)",
      };
    return {
      skipDefault: true,
      description: "Idle Death Gamble: không gì xảy ra (70%)",
    };
  },
  "8% +100 all, 22% +1 all, 70% nothing",
);

registerCombatHandler(
  "domain_self_embodiment",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.self.roundsWon >= 3)
      return {
        autoWin: true,
        description: "Auto win - thắng 3 round (Self-Embodiment of Perfection)",
      };
    return { skipDefault: true };
  },
  "Auto win if won 3 rounds",
);

registerCombatHandler(
  "bankai_gangaku_kairo",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.self.roundsLost > ctx.self.roundsWon) {
      return {
        selfPoints: 2,
        description: "+2 điểm (Gangaku Kairo - thua nhiều round hơn thắng)",
      };
    }
    return { skipDefault: true };
  },
  "+2 points if lost more rounds than won",
);

registerCombatHandler(
  "batman_temp_gear",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: "Nhận 4 Gear ngẫu nhiên tạm thời cho combat này (Batman)",
    };
  },
  "4 temp gears before combat",
);

registerCombatHandler(
  "superman_kryptonite",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const hasKryptonite = ctx.opponent.gears.some((g) =>
      typeof g === "string"
        ? g.toLowerCase().includes("kryptonite")
        : (g as any).name?.toLowerCase().includes("kryptonite"),
    );
    if (hasKryptonite)
      return {
        opponentPoints: 2,
        description:
          "Đối thủ có Kryptonite: nhận 2 điểm khởi đầu (Superman yếu)",
      };
    return { skipDefault: true };
  },
  "Opponent with Kryptonite gets 2 starting points",
);

registerCombatHandler(
  "spiderman_comeback",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    if (ctx.self.roundsLost >= 3) {
      const remainingRounds = ctx.totalRounds - ctx.currentRound;
      const statBoost =
        remainingRounds > 0 ? Math.ceil(6 / remainingRounds) : 6;
      return {
        selfStatMods: STAT_NAMES.map((stat) => ({ stat, value: statBoost })),
        selfPoints: 1,
        description: `+${statBoost} All Stats, +1 điểm (Spiderman comeback - đối thủ thắng 3 round)`,
      };
    }
    return { skipDefault: true };
  },
  "Comeback bonus when opponent wins 3 rounds",
);

registerCombatHandler(
  "hulk_combat_parity",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const combatNumber = ctx.self.pvpWins + 1;
    const isOdd = combatNumber % 2 === 1;
    if (isOdd)
      return {
        selfStatMods: [{ stat: "iq", value: 3 }],
        description: `+3 IQ (Hulk - combat ${combatNumber}, lẻ = Bruce Banner)`,
      };
    return {
      selfStatMods: [
        { stat: "strength", value: 3 },
        { stat: "durability", value: 3 },
      ],
      description: `+3 Str, +3 Dur (Hulk - combat ${combatNumber}, chẵn = Hulk Smash)`,
    };
  },
  "Odd combat: +3 IQ, even: +3 Str/Dur",
);

registerCombatHandler(
  "ahu_vs_chihuahua",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const hasChihuahua = ctx.opponent.powers.some((p: any) => {
      const name = typeof p === "string" ? p : p.name;
      return name?.toLowerCase().includes("chihuahua");
    });
    if (hasChihuahua)
      return {
        autoWin: true,
        description: "Auto win - đối thủ có Chihuahua (Ahu biết cắn)",
      };
    return { skipDefault: true };
  },
  "Auto win vs Chihuahua summon",
);

registerCombatHandler(
  "the_johnnies_summon_bonus",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const hasSummon =
      ctx.opponent.powers.some((p: any) => {
        const name = typeof p === "string" ? p : p.name;
        return name?.toLowerCase().includes("summon");
      }) ||
      ctx.opponent.gears.some((g: any) => {
        const name = typeof g === "string" ? g : g.name;
        return name?.toLowerCase().includes("summon");
      });
    if (hasSummon)
      return {
        selfPoints: 2,
        description: "+2 điểm vs đối thủ có Summon (The Johnnies)",
      };
    return { skipDefault: true };
  },
  "+2 points vs opponent with Summon",
);

registerCombatHandler(
  "ghostblade_double_crit",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: "Crit thành công nhận 2 điểm thay vì 1 (Ghostblade)",
    };
  },
  "Double crit points",
);

registerCombatHandler(
  "dragon_boy_comeback",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.self.roundsLost >= 3 && ctx.self.roundsWon === 0) {
      return {
        autoWin: true,
        description: "Auto win - thua 3 round đầu (Dragon Boy comeback)",
      };
    }
    return { skipDefault: true };
  },
  "Auto win if lost first 3 rounds",
);

registerCombatHandler(
  "queen_disable_buffs",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: "Vô hiệu hóa toàn bộ Power Buff của đối thủ (Queen)",
    };
  },
  "Disable opponent buff powers",
);

registerCombatHandler(
  "power_ranger_red_str_bonus",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Chỉ kích hoạt khi thắng round Strength — xác suất 20% do wheel UI quyết định
    if (ctx.currentRoundStat !== "str") return { skipDefault: true };
    return {
      selfPoints: 2,
      description: "+2 điểm thêm (Red Ranger - thắng Str)",
    };
  },
  "20% +2 points on Str round win (wheel decides probability)",
);

registerCombatHandler(
  "power_ranger_blue_spd_bonus",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Chỉ kích hoạt khi thắng round Speed — xác suất 33% do wheel UI quyết định
    if (ctx.currentRoundStat !== "spd") return { skipDefault: true };
    return {
      selfStatMods: [{ stat: "speed", value: 3 }],
      description: "+3 Base Speed (Blue Ranger - thắng Speed)",
    };
  },
  "33% +3 Base Speed on Speed round win (wheel decides probability)",
);

registerCombatHandler(
  "power_ranger_black_power",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Chỉ kích hoạt khi thắng round Durability — xác suất 20% do wheel UI quyết định
    if (ctx.currentRoundStat !== "dur") return { skipDefault: true };
    return {
      grantPower: "random",
      description: "Nhận 1 Power ngẫu nhiên (Black Ranger - thắng Dur)",
    };
  },
  "20% grant Power on Dur round win (wheel decides probability)",
);

registerCombatHandler(
  "power_ranger_yellow_gear",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Chỉ kích hoạt khi thắng round IQ — xác suất 25% do wheel UI quyết định
    if (ctx.currentRoundStat !== "iq") return { skipDefault: true };
    return {
      grantGear: "random",
      description: "Nhận 1 Gear (Yellow Ranger - thắng IQ)",
    };
  },
  "25% grant Gear on IQ round win (wheel decides probability)",
);

registerCombatHandler(
  "power_ranger_pink_base_stat",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    // Chỉ kích hoạt khi thắng round BIQ hoặc MA — xác suất 25% do wheel UI quyết định
    const isBIQRound = ctx.currentRoundStat === "biq";
    const isMAround = ctx.currentRoundStat === "ma";
    if (!isBIQRound && !isMAround) return { skipDefault: true };
    const randomStat =
      STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
    return {
      selfStatMods: [{ stat: randomStat, value: 1 }],
      description: `+1 Base ${randomStat} (Pink Ranger - thắng BIQ/MA)`,
    };
  },
  "25% +1 Base random stat on BIQ/MA round win (wheel decides probability)",
);

registerCombatHandler(
  "power_ranger_silver_double",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    // Thắng bất kỳ round — xác suất 15% do wheel UI quyết định
    // Engine sẽ xử lý carry-over double stat sang round kế trong BattleZonePage
    return {
      description: "Silver Ranger: gấp đôi chỉ số round tiếp theo (15%)",
    };
  },
  "15% double stat next round on any round win (wheel decides probability, carry-over handled in UI)",
);

registerCombatHandler(
  "evolvers_convert_debuff",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    return {
      description: "Chuyển Debuff đối thủ dành cho mình thành Buff (Evolvers)",
    };
  },
  "Convert opponent debuffs to self buffs",
);

registerCombatHandler(
  "pilgrims_convert_self_debuff",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return { description: "Chuyển Debuff bản thân thành Buff (Pilgrims)" };
  },
  "Convert self debuffs to buffs",
);

registerCombatHandler(
  "icebloods_round_bonus",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const netPoints = ctx.self.roundsWon - ctx.self.roundsLost;
    if (netPoints === 0) return { skipDefault: true };
    return {
      selfPoints: netPoints,
      description: `${netPoints > 0 ? "+" : ""}${netPoints} điểm (Icebloods - ${ctx.self.roundsWon}W/${ctx.self.roundsLost}L)`,
    };
  },
  "+1 per round won, -1 per round lost",
);

registerCombatHandler(
  "legionnaires_after_win",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (ctx.self.pvpWins > 0)
      return {
        selfPoints: 1,
        description: "+1 điểm khởi đầu (Legionnaires - đã thắng trận trước)",
      };
    return {
      skipDefault: true,
      description: "Legionnaires: chưa thắng trận trước",
    };
  },
  "+1 starting point if won previous match",
);

registerCombatHandler(
  "menders_stat_gain",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    let lowestStat: StatName = "strength",
      highestStat: StatName = "strength";
    let lowestVal = ctx.opponent.stats.strength,
      highestVal = ctx.opponent.stats.strength;
    for (const stat of STAT_NAMES) {
      if ((ctx.opponent.stats as Record<StatName, number>)[stat] < lowestVal) {
        lowestVal = (ctx.opponent.stats as Record<StatName, number>)[stat];
        lowestStat = stat;
      }
      if ((ctx.opponent.stats as Record<StatName, number>)[stat] > highestVal) {
        highestVal = (ctx.opponent.stats as Record<StatName, number>)[stat];
        highestStat = stat;
      }
    }
    return {
      selfStatMods: [
        { stat: lowestStat, value: 2 },
        { stat: highestStat, value: 1 },
      ],
      description: `+2 ${lowestStat} (thấp nhất đối thủ), +1 ${highestStat} (cao nhất đối thủ) (Menders)`,
    };
  },
  "+2 opponent lowest stat, +1 opponent highest stat for self",
);

registerCombatHandler(
  "overseers_limit_powers",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description: 'Cả hai chỉ chọn 1 Power "Trong Combat" (Overseers)',
    };
  },
  "Limit both to 1 combat Power",
);

registerCombatHandler(
  "venturers_weight_bonus",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const selfTotal = STAT_NAMES.reduce(
      (sum, s) => sum + (ctx.self.stats as Record<StatName, number>)[s],
      0,
    );
    const oppTotal = STAT_NAMES.reduce(
      (sum, s) => sum + (ctx.opponent!.stats as Record<StatName, number>)[s],
      0,
    );
    if (selfTotal > oppTotal) {
      return {
        selfStatMods: STAT_NAMES.map((stat) => ({
          stat,
          value: Math.floor(4 / STAT_NAMES.length) || 1,
        })),
        description: "+4 tổng stats (Venturers - trọng số cao hơn)",
      };
    }
    return {
      selfStatMods: STAT_NAMES.map((stat) => ({
        stat,
        value: Math.floor(8 / STAT_NAMES.length) || 1,
      })),
      description: "+8 tổng stats (Venturers - trọng số thấp hơn)",
    };
  },
  "+4 if higher weight, +8 if lower weight",
);

registerCombatHandler(
  "golden_experience_requiem",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const maxReverts = 6;
    const roundsLost = ctx.self.roundsLost;
    if (roundsLost > 0 && roundsLost <= maxReverts) {
      return {
        selfPoints: roundsLost,
        description: `Golden Experience Requiem: đánh lại ${roundsLost} round thua (+${roundsLost} điểm)`,
      };
    }
    return {
      description:
        "Golden Experience Requiem: Đối phương Crit → quay lại Crit Wheel (max 2 lần)",
    };
  },
  "Revert lost rounds (1 per stat), revert opponent crits",
);

registerCombatHandler(
  "hero_grave_keeper_loot",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      grantGear: "random",
      description: "Nhận 1 Gear từ người đã bị loại (Hero Grave Keeper)",
    };
  },
  "Loot 1 Gear from eliminated player after each round",
);

registerCombatHandler(
  "promised_consort_lover_stat",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const lovers: any[] = (ctx.self.character as any)?.lover || [];
    const activeLovers = lovers.filter((l: any) => !l.isLost);
    if (activeLovers.length === 0) {
      return {
        skipDefault: true,
        description: "Promised Consort: Không có Lover → không áp dụng",
      };
    }
    const femboy = activeLovers.find((l: any) => {
      const n = typeof l === "string" ? l : (l?.name ?? "");
      return n.toLowerCase().includes("femboy");
    });
    const loverName =
      typeof (femboy || activeLovers[0]) === "string"
        ? femboy || activeLovers[0]
        : ((femboy || activeLovers[0])?.name ?? "Lover");
    return {
      skipDefault: true,
      description: `Promised Consort: Thêm stat cao nhất của Lover "${loverName}" vào stat đánh nhau (xử lý ngoài game)`,
    };
  },
  "During combat: add Lover highest base stat to combat stat (prefer Femboy lover)",
);

// ============================================================================
// EXPORTS
// ============================================================================

export function registerArchetypeHandlers(): void {
  // handlers registered at module level above
}

export function registerArchetypeCombatHandlers(): void {
  // handlers registered at module level above
}
