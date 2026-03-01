/**
 * Archetype Effects Data
 *
 * Nguồn: wheelofmultiverse-ss3.xlsx - Sheet "Archetype"
 */

import { defineEffect } from "../registry";

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
    .description("Nhận -1 all stats và không thể có \"Character Development\". Bất kể những vòng quay sau có Char Dev cũng không được nhận.")
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
      // tier số LỚN HƠN = rank thấp hơn; self tier# > opp tier# = self đang đối đầu tộc rank cao hơn → +1
      conditions: [{ type: "race_tier_compare", tierOperator: ">" }],
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -1,
      timing: "before_combat",
      target: "self",
      // self tier# < opp tier# = self đang đối đầu tộc rank thấp hơn → -1
      conditions: [{ type: "race_tier_compare", tierOperator: "<" }],
    })
    .register();

  // Slayer — handled directly in calcStatsWithBeforeCombat (baked into initial stats)
  defineEffect("archetype", "Slayer")
    .description("Chọn 1 tộc để Slay. Khi đối đầu với tộc đó, nhận +2 Strength, +3 BIQ và +2 Martial Arts.")
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
      "Bạn mặc định có Power \"AIDS\". Với mỗi Lover có \"AIDS\", bạn nhận +1 all stats. (Tính cả các Lover đã chết)",
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
    .description("[PvE Only] Nhận -5 all stats khi raid boss PvE. Nhận +1 all stats khi đấu PvP.")
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
    .description("Nhận +2 IQ và 1 Gear \"Sổ tay\"")
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
    .description("Bạn mặc định thua round \"Durability\", nhận +1 all stats.")
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
    .description("Không thể nhận vũ khí. (Bypass toàn bộ hiệu ứng khác) Nhận +3 Strength, +2 Durability và +2 MA.")
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
    .description("Nhận +3 Base Speed. Trong Combat: Khi bạn thắng round Speed, nhận +1 all stats trong phần còn lại của combat.")
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
    .description("Nhận Power \"Divine Smite\", Nhận +2 Base MA")
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
    .description("Nhận +4 vào stat thấp nhất nếu bạn giành chiến thắng với cách biệt 4 điểm trở lên.")
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
    .description("Nhận -3 Strength. Dùng được 2 vũ khí và chắc chắn nhận 2 vũ khí, tối đa 1 Unique Weapon. (Chỉ có 1 vũ khí có thể có Runeword)")
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
    .description("Sau Combat: Mỗi round combat thua, nhận +1 vào chỉ số thấp nhất")
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
    .description("Trước combat: Nhận 1 điểm combat khi đối đầu với God và Demi-God.")
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

  // Wibu - main archetype
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

  // Farmer - main archetype
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
      "Trong Combat: Thêm Base Stat cao nhất của 1 \"Lover\" của bạn vào Stat đánh nhau của bạn. Nếu như có \"Lover\" nào có Archetype \"Femboy\", chọn \"Lover\" đó, nếu có nhiều, quay Wheel (Lmao).",
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
      "Trong Combat: Thêm Base Stat cao nhất của 1 \"Lover\" của bạn vào Stat đánh nhau của bạn. Nếu như có \"Lover\" nào có Archetype \"Femboy\", chọn \"Lover\" đó, nếu có nhiều, quay Wheel (Lmao).",
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
  // NOTE: Power "Spell Flux" và 1 Power "Trong Combat" đã nhận lúc tạo nhân vật
  defineEffect("archetype", "Stargazer")
    .description(
      "Nhận Power \"Spell Flux\" và 1 Power có kích hoạt \"Trong Combat\" ngẫu nhiên.",
    )
    .weight(0.5)
    .register();

  // Superhero - Unique
  // NOTE: "Siêu Anh Hùng Wheel" đã quay lúc tạo nhân vật
  defineEffect("archetype", "Superhero")
    .description(
      "Bạn là một siêu anh hùng! Nhận \"Siêu Anh Hùng Wheel\".",
    )
    .weight(1.6)
    .effect({
      type: "grant_wheel",
      wheelName: "Siêu Anh Hùng Wheel",
      timing: "immediate",
      target: "self",
    })
    .register();

  // Người Trong Ban Nhạc
  // NOTE: Instrument Weapon và House đã nhận lúc tạo nhân vật
  defineEffect("archetype", "Người Trong Ban Nhạc")
    .description(
      "Có 36% nhận được vòng quay \"Instrument Weapon\". Chắc chắn luôn sử dụng được tất cả vũ khí nhạc cụ. Skip vòng quay vũ khí thông thường. Bạn mặc định thuộc về House \"Ban Nhạc Ngọt Đoàn Kết\"",
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
      timing: "after_round", // After each tournament round
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
    .effect({
      type: "custom",
      timing: "on_round_win",
      target: "self",
      customHandler: "gambler_coin_flip",
    })
    .register();

  // Time Traveller
  // NOTE: Hiệu ứng spin lại stat đã xử lý lúc tạo nhân vật
  defineEffect("archetype", "Time Traveller")
    .description(
      "Khi spin Base Stats, với mỗi chỉ số có điểm dưới hoặc bằng 3 sẽ spin lại 1 lần.",
    )
    .weight(1.8)
    .register();

  // Loyal
  // NOTE: Lover đã nhận lúc tạo nhân vật
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
  // NOTE: Trickster Wheel đã quay lúc tạo nhân vật
  defineEffect("archetype", "Trickster")
    .description(
      "Nhận \"Trickster\" wheel, kích hoạt trước mỗi combat và hết hiệu lực sau mỗi combat",
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
    .description("Sau combat thắng: Nhận 1 lần vòng quay Summon, không thể ra trùng Summon đã sở hữu. Sẽ không quay thêm nếu đã sở hữu tất cả các Summon.")
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
  // NOTE: Quirk🍀 và Power🍀 đã nhận lúc tạo nhân vật
  defineEffect("archetype", "Hero of the Emirate🍀")
    .description(
      "Nhận thêm Quirk 🍀, Power 🍀 ngay lập tức",
    )
    .weight(3.6)
    .register();

  // Fisher
  // NOTE: Gear "Fishing Rod" đã nhận lúc tạo nhân vật
  defineEffect("archetype", "Fisher")
    .description(
      "Nhận Gear \"Fishing Rod\". Đến vòng 16, nhận thêm 1 PvP Rewards.",
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
  // NOTE: Vũ khí và runeword đã xử lý lúc tạo nhân vật
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
    .description("Lần đầu tiên bạn bị dính power \"AIDS\", bạn sẽ nhận Char dev \"Isekai\".")
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
  // NOTE: Hiệu ứng 50% không quay được đã xử lý lúc tạo nhân vật
  defineEffect("archetype", "Gambler Bloodline")
    .description(
      "Ở những vòng quay còn lại của quá trình tạo nhân vật, Có 50% không được quay vòng quay đó, Nếu là không nhận được vòng quay Stat, Stat đó mặc định là 1. Áp dụng lên cả những vòng quay phụ sinh ra từ Vòng quay chính. Nếu bạn không được quay bất kì chỉ số nào, toàn bộ stats của bạn sẽ được đặt base = 10. Nếu bạn không được quay bất cứ cái gì, mùa giải kết thúc và bạn là nhà vô địch ăn trọn 100% giải thưởng.",
    )
    .weight(1.9)
    .register();

  // Power Ranger - Unique
  // NOTE: Power Ranger Wheel đã quay lúc tạo nhân vật
  defineEffect("archetype", "Power Ranger")
    .description(
      "Bạn trở thành 1 trong các siêu nhân Gao! Nhận \"Power Ranger Wheel\".",
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
  // NOTE: 3 Power Quas/Wex/Exort đã nhận lúc tạo nhân vật
  defineEffect("archetype", "Invoker")
    .description(
      "(1). Nhận 3 Power \"Quas\", \"Wex\" và \"Exort\". (2).Trước Combat: Quay ngẫu nhiêu 1 Power chưa sở hữu và nhận hiệu ứng của nó trong combat đó. Power này chỉ dùng được trong Combat đó.",
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
  // NOTE: Không có vòng quay Power đã xử lý lúc tạo nhân vật
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
    //.addAllStats(-1, true)
    .register();

  // X - Unique, transferable
  // NOTE: Hero X Wheel đã quay lúc tạo nhân vật
  defineEffect("archetype", "X")
    .description(
      "Chỉ có duy nhất 1 người có thể làm X trong toàn bộ giải, khi lần đầu tiên có người quay ra \"X\", loại bỏ nó khỏi vòng quay Archetype. Khi người có archetype này nhận thất bại, sẽ loại bỏ archetype này từ người đó và chuyển nó sang cho người thắng. Khi bất kì ai nhận archetype \"X\", họ sẽ nhận vòng quay \"Hero X\", khi archetype này rời khỏi bất kì ai, người đó sẽ nhận -1 all stats.",
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

  // Register Wibu sub-types
  registerWibuSubTypes();

  // Register Farmer sub-types
  registerFarmerSubTypes();

  // Register New London sub-types (Archetype)
  registerNewLondonArchetypes();

  // Register other sub-wheels
  registerTricksterSubTypes();
  registerPowerRangerSubTypes();
  registerSuperheroSubTypes();
  registerHeroXSubTypes();
  registerThaoDuocSubTypes();
}

/**
 * Wibu Sub-Types (from Wibu Wheel)
 */
function registerWibuSubTypes() {
  // Dược sư tự sự
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

  // JJK - grants Domain Expansion Wheel
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

  // Jojo - grants Stands Wheel
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

  // My Hero Academia - grants MHA Power Wheel
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

  // One Piece - grants Haki Wheel
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

  // Bleach - grants Bankai Wheel
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

  // === STANDS (Jojo Sub-Sub-Types) ===

  // Hey Ya!
  defineEffect("archetype_sub", "Hey Ya!")
    .description("Bạn được cổ vũ tinh thần 💀.")
    .weight(29)
    .register();

  // Tusk Act II
  defineEffect("archetype_sub", "Tusk Act II")
    .description("Nhận +3 Strength và +2 BIQ.")
    .weight(26)
    .addStat("strength", 3)
    .addStat("biq", 2)
    .register();

  // The World
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

  // King Crimson
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

  // Golden Experience Requiem
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

  // === DOMAIN EXPANSION (JJK Sub-Sub-Types) ===

  // Infinity
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

  // Malevolent Shrine
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

  // Idle Death Gamble
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

  // Self-Embodiment of Perfection
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

  // Coffin of the Iron Mountain
  defineEffect("archetype_sub", "Coffin of the Iron Mountain")
    .description("+3 Str, +2 BIQ, +2 MA.")
    .weight(20)
    .addStat("strength", 3)
    .addStat("biq", 2)
    .addStat("ma", 2)
    .register();

  // Deadly Sentencing
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

  // === HAKI (One Piece Sub-Sub-Types) ===

  // Observation Haki
  defineEffect("archetype_sub", "Observation")
    .description("+3 BIQ.")
    .weight(36)
    .addStat("biq", 3)
    .register();

  // Armament Haki
  defineEffect("archetype_sub", "Armament")
    .description("+2 Durability, +1 MA.")
    .weight(36)
    .addStat("durability", 2)
    .addStat("ma", 1)
    .register();

  // Observation + Armament
  defineEffect("archetype_sub", "Observation + Armament")
    .description("+3 BIQ, +2 Durability, +1 MA.")
    .weight(24)
    .addStat("biq", 3)
    .addStat("durability", 2)
    .addStat("ma", 1)
    .register();

  // Observation + Armament + King Conqueror
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

  // === BANKAI (Bleach Sub-Sub-Types) ===

  // Shinuchi (Bankai)
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

  // Zanka no Tachi (Bankai)
  defineEffect("archetype_sub", "Zanka no Tachi (Bankai)")
    .description("+4 BIQ.")
    .weight(25)
    .addStat("biq", 4)
    .register();

  // Daiguren Hyorinmaru (Bankai)
  defineEffect("archetype_sub", "Daiguren Hyorinmaru (Bankai)")
    .description("+4 MA.")
    .weight(25)
    .addStat("ma", 4)
    .register();

  // Katen Kyokotsu: Karamatsu Shinju (Bankai)
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

  // Gangaku Kairo (Bankai)
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

  // === MHA POWERS (My Hero Academia Sub-Sub-Types) ===

  // Quirkless
  defineEffect("archetype_sub", "Quirkless")
    .description("Bạn không nhận được gì cả 💀")
    .weight(13)
    .register();

  // IQ (MHA)
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

  // Dark Shadow
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

  // Erasure
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

  // Heal
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

  // Half-Cold Half-Hot
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

  // Float
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

  // Hellflame
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

  // Rewind
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

  // Overhaul
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

  // One For All
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

  // All For One
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

/**
 * Farmer Sub-Types
 */
function registerFarmerSubTypes() {
  // Normal Farmer
  defineEffect("archetype_sub", "Normal Farmer")
    .description("Bạn về quê nuôi cá và trồng thêm rau.")
    .weight(85)
    .register();

  // thường (alias)
  defineEffect("archetype_sub", "thường")
    .description("Bạn về quê nuôi cá và trồng thêm rau.")
    .weight(85)
    .register();

  // Aura Farmer
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

/**
 * New London Sub-Types (Archetype given by House)
 */
function registerNewLondonArchetypes() {
  // Frostlanders
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

  // New Londoners
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

  // Wanderers
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

  // Foragers
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

  // Labourers
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

  // Lords
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

  // Machinists
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

  // Merchants
  defineEffect("archetype", "Merchants")
    .description(
      "Nhận 1 Gear \"Đồng Tiền Vàng\". Sau Combat: Bán 1 Gear lấy 1 \"Đồng Tiền Vàng\" (Gear bị bán ko thể là đồng tiền vàng)",
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

  // Thinkers
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

  // === New London Quest Archetypes (Round 16) ===

  // Evolvers
  defineEffect("archetype", "Evolvers")
    .description(
      "\"Adapt and embrace the frost. Natural selection rewards Merit. Design works only through reason.\" Chuyển tất cả Debuff của đối thủ dành cho mình thành Buff tặng cho mình.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "evolvers_convert_debuff",
    })
    .register();

  // Faithkeepers
  defineEffect("archetype", "Faithkeepers")
    .description("\"Progress the advance humanity. Equal as one flock. Tradition is our bedrock.\" Nhận Toàn bộ Quirk của 1 người nhà \"New London\" khác.")
    .weight(0)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "faithkeepers_copy_quirks",
    })
    .register();

  // Pilgrims
  defineEffect("archetype", "Pilgrims")
    .description(
      "\"Adapt; the frost humbles all. All are equal in the frostland. Tradition will ground and guide us.\" Biến đổi Debuff của bản thân thành \"Thay vì giảm chỉ số đối thủ, Buff tăng chỉ số cho mình.\"",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "pilgrims_convert_self_debuff",
    })
    .register();

  // Stalwarts
  defineEffect("archetype", "Stalwarts")
    .description("\"Progress for the glory of New London. Merit forges the strongest. Reason for order, order for control.\" Nhận +2 Strength, +2 IQ và +2 BIQ")
    .weight(0)
    .addStat("strength", 2)
    .addStat("iq", 2)
    .addStat("biq", 2)
    .register();

  // Bohemians
  defineEffect("archetype", "Bohemians")
    .description(
      "\"Adaptation is the art of survival. Equality frees us. Tradition isn't afraid to destroy an old canvas.\" Trong Combat: Tất cả vòng quay Stat/trọng số đều là 40/40/20 (20% hòa). All Stats của bạn cố định là 99.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "bohemians_stats_99",
    })
    .register();

  // Icebloods
  defineEffect("archetype", "Icebloods")
    .description(
      "\"Embrace Adaptation, reward Merit, honour Tradition.\" Trong Combat: Nhận thêm 1 điểm nếu thắng round, trừ đi 1 điểm nếu thua round.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "icebloods_round_bonus",
    })
    .register();

  // Legionnaires
  defineEffect("archetype", "Legionnaires")
    .description("\"Progress marches ever forward. Equality in the ranks. Tradition ensures order.\" Sau Combat: Nếu thắng trận, khởi đầu trận tiếp theo với 1 điểm.")
    .weight(0)
    .effect({
      type: "combat_points",
      points: 1,
      timing: "before_combat",
      target: "self",
      customHandler: "legionnaires_after_win",
    })
    .register();

  // Menders
  defineEffect("archetype", "Menders")
    .description(
      "\"Adaptation staves off hubris. Equality before the frost. Traditions guide us.\" Sau Combat: Stat thấp nhất của đối thủ sẽ +2 vào Stat đó của mình, Stat cao nhất của đối thủ sẽ +1 vào stat đó của mình",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "menders_stat_gain",
    })
    .register();

  // Overseers
  defineEffect("archetype", "Overseers")
    .description(
      "\"Progress guided by the worthy. Merit culls the excess. Tradition ensures hierarchy.\" Trong Combat: Cả hai chỉ được chọn 1 Power có chữ \"Trong Combat\" để kích hoạt. Debuff: -1 All Stat của đối thủ.",
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

  // Proteans
  defineEffect("archetype", "Proteans")
    .description("\"Adaptation through evolution. Merit so the best survives. Reason for every blueprint.\" BIQ +5. Nhận Power \"Darwin Evolution Theory\"")
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

  // Technocrats
  defineEffect("archetype", "Technocrats")
    .description("\"Technology will ensure prosperity. Equality for all citizens. Reason guarantees social harmony.\" IQ +5. Nhận Power \"Algorithms Are Clear\"")
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

  // Venturers
  defineEffect("archetype", "Venturers")
    .description("\"Progress, for those who can keep pace. Merit fuels the industrious. Reason to optomize investment.\" Trong Combat: Sau khi xác định được Trọng Số của hai bên, nhận +4 vào Trọng số của bạn nếu bạn cao hơn, +8 vào Trọng số của bạn nếu thấp hơn.")
    .weight(0)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "venturers_weight_bonus",
    })
    .register();
}

/**
 * Trickster Sub-Types (from Trickster Wheel)
 * NOTE: Hiệu ứng kích hoạt trước mỗi combat và hết sau combat
 */
function registerTricksterSubTypes() {
  // Ace of Spades
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

  // King of Diamonds
  defineEffect("archetype_sub", "King of Diamonds")
    .description("+1 all stats.")
    .weight(30)
    .addAllStats(1)
    .register();

  // Queen of Clubs
  defineEffect("archetype_sub", "Queen of Clubs")
    .description("-1 all stats.")
    .weight(35)
    .addAllStats(-1)
    .register();

  // Jack of 97
  defineEffect("archetype_sub", "Jack of 97")
    .description("+97 all stats.")
    .weight(0.97)
    .addAllStats(97)
    .register();

  // Ten of Hearts
  defineEffect("archetype_sub", "Ten of Hearts")
    .description("Không có gì xảy ra.")
    .weight(24.03)
    .register();
}

/**
 * Power Ranger Sub-Types (from Power Ranger Wheel)
 */
function registerPowerRangerSubTypes() {
  // Red Ranger
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
    })
    .register();

  // Blue Ranger
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
    })
    .register();

  // Black Ranger
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
    })
    .register();

  // Yellow Ranger
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
    })
    .register();

  // Pink Ranger
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
    })
    .register();

  // Silver Ranger
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
    })
    .register();
}

/**
 * Superhero Sub-Types (from Siêu Anh Hùng Wheel)
 * NOTE: Không thể ra trùng
 */
function registerSuperheroSubTypes() {
  // Captain America
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

  // Iron Man
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

  // Batman
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

  // Superman
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

  // Wonder Woman
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

  // Spiderman
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

  // The Flash
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

  // Hulk
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

/**
 * Hero X Sub-Types (from Hero X Wheel)
 */
function registerHeroXSubTypes() {
  // Lin Ling
  defineEffect("archetype_sub", "Lin Ling")
    .description("Hero X - Lin Ling. +1 all stats.")
    .weight(19)
    .addAllStats(1)
    .register();

  // E-Soul
  defineEffect("archetype_sub", "E-Soul")
    .description("Hero X - E-Soul. +8 Speed.")
    .weight(15)
    .addStat("speed", 8)
    .register();

  // Ahu
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

  // Lucky Cyan
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

  // Loli
  defineEffect("archetype_sub", "Loli")
    .description("Hero X - Loli. +4 IQ, +4 BIQ.")
    .weight(10)
    .addStat("iq", 4)
    .addStat("biq", 4)
    .register();

  // The Johnnies
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

  // Ghostblade
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

  // Dragon Boy
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

  // Queen
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

  // X (the ultimate)
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

/**
 * Thảo dược Wheel Sub-Types (from Herbalist quirk)
 * Effects split by win/lose outcome after combat.
 */
function registerThaoDuocSubTypes() {
  // Mirage Flower: Thắng +1 PvP reward, Thua +1 Char Dev ngẫu nhiên
  defineEffect("archetype_sub", "Mirage Flower")
    .description("Thảo dược. Thắng: +1 PvP Reward. Thua: +1 Char Dev ngẫu nhiên.")
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

  // Sunberry: Thắng +2 stat cao nhất, Thua +6 stat thấp nhất
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

  // Dragon's Weed: Thắng +1 Power, Thua mất hết Power rồi +4 Power
  defineEffect("archetype_sub", "Dragon's Weed")
    .description("Thảo dược. Thắng: +1 Power. Thua: mất hết Power, nhận 4 Power.")
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

  // Moonroot: Thắng +1 điểm khởi đầu combat kế, Thua +3 điểm khởi đầu combat kế
  defineEffect("archetype_sub", "Moonroot")
    .description("Thảo dược. Thắng: +1 điểm KĐ combat kế. Thua: +3 điểm KĐ combat kế.")
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

  // Mistpetal: Thắng +1 Quirk, Thua +6 Quirk
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

  // Eldritch Mushroom: Thắng -1 all stats, Thua +1 all stats
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
