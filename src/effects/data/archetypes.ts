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
      "Nhận +2 all stats. Nếu không thắng với cách biệt 4 điểm trở lên, bạn sẽ thua.",
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
    .description("-1 all stats và không thể có Character Development.")
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
      "+1 all stats vs tộc thứ hạng cao hơn, -1 all stats vs tộc thứ hạng thấp hơn.",
    )
    .weight(2.4)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [{ type: "race_tier_compare", tierOperator: "<" }], // Self tier < opponent tier
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -1,
      timing: "during_combat",
      target: "self",
      conditions: [{ type: "race_tier_compare", tierOperator: ">" }], // Self tier > opponent tier
    })
    .register();

  // Slayer
  defineEffect("archetype", "Slayer")
    .description("Chọn 1 tộc để Slay. Vs tộc đó: +2 Str, +3 BIQ, +2 MA.")
    .weight(2)
    .effect({
      type: "stat_modifier",
      stat: "strength",
      value: 2,
      timing: "during_combat",
      target: "self",
      customHandler: "slayer_race_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "biq",
      value: 3,
      timing: "during_combat",
      target: "self",
      customHandler: "slayer_race_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "ma",
      value: 2,
      timing: "during_combat",
      target: "self",
      customHandler: "slayer_race_check",
    })
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
      'Mặc định có Power "AIDS". +1 all stats với mỗi Lover có AIDS.',
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
    .description("+2 IQ và -4 MA.")
    .weight(1.1)
    .addStat("iq", 2)
    .addStat("ma", -4)
    .register();

  // Anti-Social
  defineEffect("archetype", "Anti-Social")
    .description("[PvE] -5 all stats. [PvP] +1 all stats.")
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
    .description('+2 IQ và 1 Gear "Sổ tay".')
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
    .description("Mặc định thua round Durability, +1 all stats.")
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
    .description("Toàn bộ vòng quay stats có giá trị là 5.")
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
    .description("Không thể nhận vũ khí. +3 Str, +2 Dur, +2 MA.")
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
    .description("+3 Base Speed. Thắng round Speed: +1 all stats trong combat.")
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
    .description('Nhận Power "Divine Smite", +2 Base MA.')
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
    .description("+10 all stats, đối thủ nhận 5 điểm ở cuối combat.")
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
    .description("+4 stat thấp nhất nếu thắng với cách biệt ≥4 điểm.")
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
    .description("+3 all stats. Sau Combat: -1 all stats.")
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
    .description("-3 Strength. Dùng được 2 vũ khí.")
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
    .description("Sau Combat: Mỗi round thua, +1 stat thấp nhất.")
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
    .description("Trước combat: +1 điểm vs God và Demi-God.")
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
      "+1 điểm khởi đầu vs Demon/Vampire/Spirit/Orc/Skeleton/Goblin. Thua ngay vs God/Demi-God.",
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
      "Sau combat: -1 IQ, -1 BIQ, cướp 1 Power từ player ngẫu nhiên.",
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
      'Trong Combat: Thêm Base Stat cao nhất của Lover vào stat đánh nhau. Ưu tiên Lover có Archetype "Femboy".',
    )
    .weight(0.5)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "promised_consort_lover_stat",
    })
    .register();

  // Cinderheart (same as Promised Consort)
  defineEffect("archetype", "Cinderheart")
    .description(
      'Trong Combat: Thêm Base Stat cao nhất của Lover vào stat đánh nhau. Ưu tiên Lover có Archetype "Femboy".',
    )
    .weight(0.5)
    .effect({
      type: "custom",
      timing: "during_combat",
      target: "self",
      customHandler: "promised_consort_lover_stat",
    })
    .register();

  // Stargazer
  // NOTE: Power "Spell Flux" và 1 Power "Trong Combat" đã nhận lúc tạo nhân vật
  defineEffect("archetype", "Stargazer")
    .description(
      'Nhận Power "Spell Flux" và 1 Power có kích hoạt "Trong Combat" ngẫu nhiên. (Đã nhận lúc tạo nhân vật)',
    )
    .weight(0.5)
    .register();

  // Superhero - Unique
  // NOTE: "Siêu Anh Hùng Wheel" đã quay lúc tạo nhân vật
  defineEffect("archetype", "Superhero")
    .description(
      'Bạn là một siêu anh hùng! Nhận "Siêu Anh Hùng Wheel". (Đã quay lúc tạo nhân vật)',
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
      '36% nhận "Instrument Weapon Wheel". Skip vũ khí thường. Mặc định House "Ban Nhạc Ngọt Đoàn Kết". (Đã xử lý lúc tạo nhân vật)',
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
    .description("Sau mỗi vòng: Nhận 1 Gear từ 1 người đã bị loại.")
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
      "Trong combat: Mỗi round thắng có 50% nhận 2 điểm và 50% nhận 0 điểm.",
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
      "Khi spin Base Stats, stat ≤3 sẽ spin lại 1 lần. (Đã xử lý lúc tạo nhân vật)",
    )
    .weight(1.8)
    .register();

  // Loyal
  // NOTE: Lover đã nhận lúc tạo nhân vật
  defineEffect("archetype", "Loyal")
    .description(
      "Nhận 1 Lover và chỉ có 1 Lover duy nhất. Khi Lover bị loại: +1 Char Dev. (Lover đã nhận lúc tạo nhân vật)",
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
      'Nhận "Trickster Wheel", kích hoạt trước mỗi combat và hết hiệu lực sau combat. ',
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
    .description("Sau combat thắng: Nhận 1 lần vòng quay Summon (không trùng).")
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
      "Trước khi kết thúc combat: Bên thấp điểm hơn nhận thêm 1 điểm.",
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
      "Nhận thêm Quirk 🍀 và Power 🍀 ngay lập tức. (Đã nhận lúc tạo nhân vật)",
    )
    .weight(3.6)
    .register();

  // Fisher
  // NOTE: Gear "Fishing Rod" đã nhận lúc tạo nhân vật
  defineEffect("archetype", "Fisher")
    .description(
      'Nhận Gear "Fishing Rod". Đến vòng 16: +1 PvP Rewards. (Gear đã nhận lúc tạo nhân vật)',
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
      "Chắc chắn có vũ khí. Vũ khí chắc chắn là runeword. Dùng được mọi vũ khí. (Đã xử lý lúc tạo nhân vật)",
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
    .description('Lần đầu tiên bị dính power "AIDS": Nhận Char dev "Isekai".')
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
      "50% không được quay vòng quay đó, stat mặc định = 1. Nếu không quay được stat nào -> all stats = 10. Nếu không quay được gì -> vô địch! (Đã xử lý lúc tạo nhân vật)",
    )
    .weight(1.9)
    .register();

  // Power Ranger - Unique
  // NOTE: Power Ranger Wheel đã quay lúc tạo nhân vật
  defineEffect("archetype", "Power Ranger")
    .description(
      'Bạn trở thành 1 trong các siêu nhân Gao! Nhận "Power Ranger Wheel". (Đã quay lúc tạo nhân vật)',
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
    .description("Base IQ +3.")
    .weight(3)
    .addStat("iq", 3, true)
    .register();

  // Herald
  defineEffect("archetype", "Herald")
    .description("Base Speed +3.")
    .weight(3)
    .addStat("speed", 3, true)
    .register();

  // Invoker
  // NOTE: 3 Power Quas/Wex/Exort đã nhận lúc tạo nhân vật
  defineEffect("archetype", "Invoker")
    .description(
      'Nhận 3 Power "Quas", "Wex", "Exort". Trước Combat: Quay 1 Power chưa sở hữu và nhận hiệu ứng trong combat đó. (Power đã nhận lúc tạo nhân vật)',
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
      "Không được vòng quay Power. Thắng combat PvP: Nhận 2 PvP Rewards thay vì 1. (Đã xử lý lúc tạo nhân vật)",
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
      "Cường hóa House Feature khi nhận Houses. (Không nhận House Feature thông thường)",
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
      "Giảm toàn bộ Base Stat quay ra đi 1. (Cái tội sống vội + ham hố)",
    )
    .weight(0)
    //.addAllStats(-1, true)
    .register();

  // X - Unique, transferable
  // NOTE: Hero X Wheel đã quay lúc tạo nhân vật
  defineEffect("archetype", "X")
    .description(
      'Unique - chỉ 1 người có. Thua -> chuyển cho người thắng. Nhận "Hero X Wheel". Mất archetype -> -1 all stats. (Đã quay lúc tạo nhân vật)',
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
      timing: "during_combat",
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
      timing: "during_combat",
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
      'Nhận 1 "Đồng Tiền Vàng". Sau Combat: Bán 1 Gear lấy 1 "Đồng Tiền Vàng".',
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
      "Chuyển tất cả Debuff của đối thủ dành cho mình thành Buff tặng cho mình.",
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
    .description('Nhận toàn bộ Quirk của 1 người nhà "New London" khác.')
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
      "Biến đổi Debuff của bản thân thành Buff tăng chỉ số cho mình.",
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
    .description("+2 Strength, +2 IQ, +2 BIQ.")
    .weight(0)
    .addStat("strength", 2)
    .addStat("iq", 2)
    .addStat("biq", 2)
    .register();

  // Bohemians
  defineEffect("archetype", "Bohemians")
    .description(
      "Trong Combat: Tất cả vòng quay 40/40/20 (20% hòa). All Stats = 99.",
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
      "Trong Combat: +1 điểm nếu thắng round, -1 điểm nếu thua round.",
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
    .description("Sau Combat: Nếu thắng, khởi đầu trận tiếp theo với 1 điểm.")
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
      "Sau Combat: Stat thấp nhất đối thủ +2 cho mình, Stat cao nhất +1 cho mình.",
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
      'Trong Combat: Cả hai chỉ chọn 1 Power "Trong Combat". Đối thủ -1 all stats.',
    )
    .weight(0)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -1,
      timing: "during_combat",
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
    .description('BIQ +5. Nhận Power "Darwin Evolution Theory".')
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
    .description('IQ +5. Nhận Power "Algorithms Are Clear".')
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
    .description("Trong Combat: Trọng số bạn cao hơn -> +4, thấp hơn -> +8.")
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
