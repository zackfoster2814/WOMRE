/**
 * Character Development Effects — Source
 *
 * Gộp từ:
 *   data/char-devs.ts
 *   handlers/immediate/chardev-handlers.ts
 *   handlers/combat/chardev-combat-handlers.ts
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

const STAT_NAMES: StatName[] = [
  "strength",
  "speed",
  "durability",
  "iq",
  "biq",
  "ma",
];

// ============================================================================
// CHAR DEV EFFECT DEFINITIONS
// ============================================================================

export function registerCharDevEffects() {
  // 1. Armed to the Teeth
  defineEffect("char_dev", "Armed to the Teeth")
    .description("Nhận 3 Normal Gear ngẫu nhiên.")
    .weight(2)
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "random",
      grantCount: 3,
      timing: "immediate",
      target: "self",
    })
    .register();

  // 2. Training Arc
  defineEffect("char_dev", "Training Arc")
    .description("Nhận +1 all stats.")
    .weight(2)
    .addAllStats(1)
    .register();

  // 3. In Love
  defineEffect("char_dev", "In Love")
    .description(
      'Quay một player làm "Lover" và nhận +2 vào Stat mà người đó cao nhất.',
    )
    .weight(1.5)
    .effect({
      type: "grant_lover",
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "in_love_stat_bonus",
    })
    .register();

  // 4. No more Home
  defineEffect("char_dev", "No more Home")
    .description('Bạn bị loại khỏi "House" của mình và mất tất cả Bonus từ đó.')
    .weight(1.5)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "no_more_home_remove_house",
    })
    .register();

  // 5. No more family
  defineEffect("char_dev", "No more family")
    .description("Nhận thêm 2 Power.")
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

  // 6. Depression
  defineEffect("char_dev", "Depression")
    .description("Nhận -3 vào chỉ số cao nhất khi nhận Char Dev này.")
    .weight(2)
    .effect({
      type: "stat_modifier",
      stat: "highest",
      value: -3,
      timing: "immediate",
      target: "self",
    })
    .register();

  // 7. Seeking Wisdom
  defineEffect("char_dev", "Seeking Wisdom")
    .description('Nhận +4 IQ và Quirk "Fast Learner".')
    .weight(2)
    .addStat("iq", 4)
    .effect({
      type: "grant_quirk",
      grantType: "quirk",
      grantName: "Fast Learner",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  // 8. Inversion
  defineEffect("char_dev", "Inversion")
    .description(
      "Đảo ngược tất cả base stat. (10<->1, 9<->2, 8<->3, 7<->4, 6<->5,...)",
    )
    .weight(1.2)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "inversion_all_base_stats",
    })
    .register();

  // 9. Isekai
  defineEffect("char_dev", "Isekai")
    .description("Quay lại từ đầu 💀")
    .weight(1.2)
    .effect({
      type: "isekai",
      timing: "immediate",
      target: "self",
    })
    .register();

  // 10. Final Reserves
  defineEffect("char_dev", "Final Reserves")
    .description(
      "Khi ở nhánh thua, +1 all stats. Khi đến vòng 16 người nhánh thua, loại bỏ hiệu ứng này và nhận 2 random Power.",
    )
    .weight(1.2)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [{ type: "bracket", bracket: "loser" }],
    })
    .effect({
      type: "custom",
      timing: "on_round_16",
      target: "self",
      customHandler: "final_reserves_round_16",
    })
    .register();

  // 11. Lose Control
  defineEffect("char_dev", "Lose Control")
    .description("Mất tất cả Power. 💀")
    .weight(2)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "lose_control_remove_all_powers",
    })
    .register();

  // 12. Prime time
  defineEffect("char_dev", "Prime time")
    .description(
      "Nhận +2 all stats. Vô hiệu hóa khi xuống nhánh thua và chung kết.",
    )
    .weight(1.2)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 2,
      timing: "immediate",
      target: "self",
      conditions: [{ type: "bracket", bracket: "winner" }],
    })
    .register();

  // 13. Fate's Trick
  defineEffect("char_dev", "Fate's Trick")
    .description(
      "Có 50% khả năng nhân đôi Base stat thấp nhất và 50% khả năng chia đôi stat cao nhất. (làm tròn lên)",
    )
    .weight(2)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "fates_trick_50_50",
    })
    .register();

  // 14. Old Age
  defineEffect("char_dev", "Old Age")
    .description("Nhận +3 IQ và -1 mọi chỉ số còn lại.")
    .weight(2)
    .addStat("iq", 3)
    .addStat("strength", -1)
    .addStat("speed", -1)
    .addStat("durability", -1)
    .addStat("biq", -1)
    .addStat("ma", -1)
    .register();

  // 15. Creator's Favor
  defineEffect("char_dev", "Creator's Favor")
    .description(
      '"Đấng Sáng Tạo" tùy ý buff cho nhân vật. (Không thay đổi quá 2 chỉ số). (Sẽ có danh sách các hành động có thể thực hiện)',
    )
    .weight(1.2)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "creators_favor",
    })
    .register();

  // 16. Become Woke
  defineEffect("char_dev", "Become Woke")
    .description("Nhận -3 IQ, +1 Strength và +1 Durability.")
    .weight(1.8)
    .addStat("iq", -3)
    .addStat("strength", 1)
    .addStat("durability", 1)
    .register();

  // 17. Demonic Pact
  defineEffect("char_dev", "Demonic Pact")
    .description(
      "Hiến tế 1 base stat ngẫu nhiên (giảm xuống 0) để nhận 3 Power.",
    )
    .weight(1.6)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "demonic_pact_sacrifice",
    })
    .register();

  // 18. Mentor
  defineEffect("char_dev", "Mentor")
    .description(
      "Nhận thêm 1 Power từ 1 Player ngẫu nhiên. (Mục tiêu được chọn phải còn sống và mục tiêu đó sẽ mất power được chọn)",
    )
    .weight(1.8)
    .effect({
      type: "steal_power",
      grantCount: 1,
      timing: "immediate",
      target: "self",
      customHandler: "mentor_steal_power",
    })
    .register();

  // 19. It is what it is
  defineEffect("char_dev", "It is what it is")
    .description("Mất hết toàn bộ vũ khí của mình. 💀")
    .weight(1.2)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "it_is_what_it_is_remove_weapons",
    })
    .register();

  // 20. Make love
  defineEffect("char_dev", "Make love")
    .description(
      'Quay 1 wheel bao gồm toàn bộ player hiện tại để chọn ra người tình. Có khả năng tạo ra Race mới ở mùa sau. Nếu một trong hai có Power "Aids", truyền nó cho người còn lại.',
    )
    .weight(1.5)
    .effect({
      type: "make_love",
      timing: "immediate",
      target: "self",
    })
    .register();

  // 21. Pessimistic
  defineEffect("char_dev", "Pessimistic")
    .description("Khi xuống nhánh thua, -1 all stats.")
    .weight(1.2)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -1,
      timing: "on_loser_bracket",
      target: "self",
    })
    .register();

  // 22. Finality
  defineEffect("char_dev", "Finality")
    .description("Race của bạn tuyệt chủng trong mùa này. 💀")
    .weight(1.2)
    .register();

  // 23. Last Standing
  defineEffect("char_dev", "Last Standing")
    .description(
      'Khi là người duy nhất còn lại của "Gia tộc" (House), +2 all stats.',
    )
    .weight(1.6)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 2,
      timing: "immediate",
      target: "self",
      customHandler: "last_standing_check",
    })
    .register();

  // 24. Furry
  defineEffect("char_dev", "Furry")
    .description(
      "(1).Trong Combat: Nhận +1 all stats khi đấu với Werebeast. (2).Nếu thua Werebeast, nhận -1 All Stats. (3).Nếu thắng Werebeast, nhận +1 all stats vĩnh viễn.",
    )
    .weight(1.2)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "during_combat",
      target: "self",
      conditions: [{ type: "race_match", races: ["Werebeast"] }],
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: -1,
      timing: "after_combat_lose",
      target: "self",
      conditions: [{ type: "race_match", races: ["Werebeast"] }],
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "after_combat_win",
      target: "self",
      conditions: [{ type: "race_match", races: ["Werebeast"] }],
    })
    .register();

  // 25. Abused
  defineEffect("char_dev", "Abused")
    .description("Nhận -1 IQ, +3 Durability.")
    .weight(2)
    .addStat("iq", -1)
    .addStat("durability", 3)
    .register();

  // 26. A Big Gift!
  defineEffect("char_dev", "A Big Gift!")
    .description("Nhận 1 random Legacy Gear.")
    .weight(1.2)
    .effect({
      type: "grant_gear",
      grantType: "gear",
      grantName: "legacy",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  // 27. Become Vegetarian
  defineEffect("char_dev", "Become Vegetarian")
    .description("Nhận -2 Durability.")
    .weight(1.4)
    .addStat("durability", -2)
    .register();

  // 28. Creator's Limitation
  defineEffect("char_dev", "Creator's Limitation")
    .description(
      '"Đấng Sáng Tạo" tùy ý nerf cho nhân vật. (Không thay đổi quá 2 chỉ số). (Sẽ có danh sách các hành động có thể thực hiện)',
    )
    .weight(1.2)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "creators_limitation",
    })
    .register();

  // 29. Braindead
  defineEffect("char_dev", "Braindead")
    .description('Nhận -4 IQ và Quirk "Brainrot" 💀')
    .weight(1.4)
    .addStat("iq", -4)
    .effect({
      type: "grant_quirk",
      grantType: "quirk",
      grantName: "Brainrot",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  // 30. Blessed by Chaos
  defineEffect("char_dev", "Blessed by Chaos")
    .description(
      "Kéo base stat của chỉ số cao nhất xuống 1, sau đó nhận thêm 2 Character Development.",
    )
    .weight(1.8)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "blessed_by_chaos",
    })
    .register();

  // 31. Lost an Arm
  defineEffect("char_dev", "Lost an Arm")
    .description("Nhận -4 Martial Arts 💀")
    .weight(2)
    .addStat("ma", -4)
    .register();

  // 32. Lost a Leg
  defineEffect("char_dev", "Lost a Leg")
    .description("Nhận -4 Speed 💀")
    .weight(2)
    .addStat("speed", -4)
    .register();

  // 33. Obtain a Cultivation Technique
  defineEffect("char_dev", "Obtain a Cultivation Technique")
    .description("Nhận +2 BIQ, +3 Martial Arts.")
    .weight(2)
    .addStat("biq", 2)
    .addStat("ma", 3)
    .register();

  // 34. Become King Slayer
  defineEffect("char_dev", "Become King Slayer")
    .description(
      '(1).Nhận Archetype "Slayer". Nếu bạn đang là một "Slayer", chọn thêm 1 tộc nữa. (2).Trong Combat: Nếu đối thủ có Char Dev "King\'s Landing", nhận +1 All Stats.',
    )
    .weight(2)
    .effect({
      type: "grant_archetype",
      grantType: "archetype",
      grantName: "Slayer",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "during_combat",
      target: "self",
      customHandler: "king_slayer_vs_kings_landing",
    })
    .register();

  // 35. King's Landing
  defineEffect("char_dev", "King's Landing")
    .description(
      '(1).Khi bạn bị loại, tất cả mọi người còn sống trong "Gia tộc" của bạn sẽ được nhận 1 Power. (2).Trong Combat: Nếu bạn không có Archetype "Devotee", Không thuộc race "God" hoặc "Demi God", nhận -2 điểm khởi đầu và -10 IQ.',
    )
    .weight(2)
    .effect({
      type: "custom",
      timing: "on_death",
      target: "self",
      customHandler: "kings_landing_death_gift",
    })
    .effect({
      type: "combat_points",
      points: -2,
      timing: "before_combat",
      target: "self",
      customHandler: "kings_landing_penalty_check",
    })
    .effect({
      type: "stat_modifier",
      stat: "iq",
      value: -10,
      timing: "before_combat",
      target: "self",
      customHandler: "kings_landing_penalty_check",
    })
    .register();

  // 36. True Heir of the Emirate🍀
  defineEffect("char_dev", "True Heir of the Emirate🍀")
    .description(
      "Nếu bạn có Archetype🍀, nhận +1 All Stats 🍀. Nếu bạn có Unique Weapon 🍀, nhận +1 All Stats 🍀.",
    )
    .weight(2)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "true_heir_emirate_check",
    })
    .register();

  // 37. Become Hand of The King
  defineEffect("char_dev", "Become Hand of The King")
    .description(
      '(1).Nhận +3 IQ. (2). Trong Combat: Nếu đối thủ có Char Dev "Become King Slayer", nhận +1 All Stats.',
    )
    .weight(2)
    .addStat("iq", 3)
    .effect({
      type: "stat_modifier",
      stat: "all",
      value: 1,
      timing: "during_combat",
      target: "self",
      customHandler: "hand_of_king_vs_slayer",
    })
    .register();

  // 38. Kungfu Training
  defineEffect("char_dev", "Kungfu Training")
    .description("Nhận +2 Durability và +2 Martial Arts.")
    .weight(2.2)
    .addStat("durability", 2)
    .addStat("ma", 2)
    .register();

  // 39. Too Horny
  defineEffect("char_dev", "Too Horny")
    .description(
      "Nhận +3 Strength và +2 Durability, nhưng Base IQ biến thành 0.",
    )
    .weight(1.6)
    .addStat("strength", 3)
    .addStat("durability", 2)
    .effect({
      type: "stat_set",
      stat: "iq",
      value: 0,
      isBase: true,
      timing: "immediate",
      target: "self",
    })
    .register();

  // 40. Creator's Reforge
  defineEffect("char_dev", "Creator's Reforge")
    .description(
      "Loại bỏ vũ khí hiện tại, Creator chọn 1 vũ khí Normal với 1 Rune do Creator chọn.",
    )
    .weight(2)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "creators_reforge",
    })
    .register();

  // 41. Become Perfectionist
  defineEffect("char_dev", "Become Perfectionist")
    .description('Nhận Archetype "Perfectionist".')
    .weight(2)
    .effect({
      type: "grant_archetype",
      grantType: "archetype",
      grantName: "Perfectionist",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  // 42. Too Edgy
  defineEffect("char_dev", "Too Edgy")
    .description('Nhận Archetype "Edgelord".')
    .weight(2)
    .effect({
      type: "grant_archetype",
      grantType: "archetype",
      grantName: "Edgelord",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  // 43. Overcome the Habits
  defineEffect("char_dev", "Overcome the Habits")
    .description(
      "Với mỗi Quirk bạn có trên người, +1 vào stat thấp nhất. (Tính theo chỉ số từ vòng quay stats gốc và chỉ có 1 chỉ số duy nhất được chọn)",
    )
    .weight(2)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "overcome_habits_per_quirk",
    })
    .register();

  // 44. Nghe Bài thú tội
  defineEffect("char_dev", "Nghe Bài thú tội")
    .description(
      '50% Nhận Char Dev "Braindead", 50% Nhận Char Dev "Seeking Wisdom".',
    )
    .weight(2)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "nghe_bai_thu_toi_50_50",
    })
    .register();

  // 45. Kinda Homeless
  defineEffect("char_dev", "Kinda Homeless")
    .description(
      "Rời khỏi House của mình, nhưng vẫn giữ lại toàn bộ những thứ đã nhận từ House.",
    )
    .weight(1.8)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "kinda_homeless_leave_house",
    })
    .register();

  // 46. Become a Power Ranger (generic)
  defineEffect("char_dev", "Become a Power Ranger")
    .description(
      'Nhận "Power Ranger Wheel" và hiệu ứng tương ứng. Tối đa chỉ có thể có 1 Ranger mỗi màu. Power Rangers không nhận PvP Rewards và không có vòng PvE. Sau mỗi combat chiến thắng, tất cả Rangers nhận +1 vào 1 chỉ số ngẫu nhiên (tất cả được cộng giống nhau).',
    )
    .weight(1.4)
    .effect({
      type: "grant_wheel",
      wheelName: "Power Ranger Wheel",
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "become_power_ranger_setup",
    })
    .register();

  // 46b. Power Ranger colors
  defineEffect("char_dev", "Become a Power Ranger (Red)")
    .description(
      "Power Ranger - Red. Trong combat: Thắng round Strength có 20% nhận thêm 2 điểm.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "on_round_win",
      target: "self",
      customHandler: "power_ranger_red_str_bonus",
      conditions: [{ type: "probability", chance: 20 }],
    })
    .register();

  defineEffect("char_dev", "Become a Power Ranger (Blue)")
    .description(
      "Power Ranger - Blue. Trong combat: Thắng round Speed có 33% nhận +3 Base Speed.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "on_round_win",
      target: "self",
      customHandler: "power_ranger_blue_spd_bonus",
      conditions: [{ type: "probability", chance: 33 }],
    })
    .register();

  defineEffect("char_dev", "Become a Power Ranger (Black)")
    .description(
      "Power Ranger - Black. Trong combat: Thắng round Dura có 20% nhận 1 Power ngẫu nhiên.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "on_round_win",
      target: "self",
      customHandler: "power_ranger_black_power",
      conditions: [{ type: "probability", chance: 20 }],
    })
    .register();

  defineEffect("char_dev", "Become a Power Ranger (Yellow)")
    .description(
      "Power Ranger - Yellow. Trong combat: Thắng round IQ có 25% nhận 1 Gear.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "on_round_win",
      target: "self",
      customHandler: "power_ranger_yellow_gear",
      conditions: [{ type: "probability", chance: 25 }],
    })
    .register();

  defineEffect("char_dev", "Become a Power Ranger (Pink)")
    .description(
      "Power Ranger - Pink. Trong combat: Thắng round BIQ/MA có 25% nhận +1 Base vào stat ngẫu nhiên.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "on_round_win",
      target: "self",
      customHandler: "power_ranger_pink_base_stat",
      conditions: [{ type: "probability", chance: 25 }],
    })
    .register();

  defineEffect("char_dev", "Become a Power Ranger (Silver)")
    .description(
      "Power Ranger - Silver. Trong combat: Thắng round có 15% gấp đôi stat ở round tiếp theo.",
    )
    .weight(0)
    .effect({
      type: "custom",
      timing: "on_round_win",
      target: "self",
      customHandler: "power_ranger_silver_double",
      conditions: [{ type: "probability", chance: 15 }],
    })
    .register();

  // 47. W Speed
  defineEffect("char_dev", "W Speed")
    .description("Nhận +1 vào tất cả các chỉ số còn lại với mỗi 5 base Speed.")
    .weight(1.3)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "w_speed_per_5_base",
    })
    .register();

  // 48. Back to Basics
  defineEffect("char_dev", "Back to Basics")
    .description(
      "Mất đi tất cả Power, không thể nhận Power. Nhận +2 all stats.",
    )
    .weight(1.4)
    .addAllStats(2)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "back_to_basics_remove_powers",
    })
    .register();

  // 49. Never skip Leg Day
  defineEffect("char_dev", "Never skip Leg Day")
    .description("Nhận +2 Speed và Speed không thể bị giảm bởi Debuff.")
    .weight(1.4)
    .addStat("speed", 2)
    .effect({
      type: "immunity",
      immuneTo: ["speed_debuff"],
      timing: "immediate",
      target: "self",
    })
    .register();

  // 50. Mad Scientist
  defineEffect("char_dev", "Mad Scientist")
    .description(
      'Trước combat: Nhận ngẫu nhiên hiệu ứng của "Shrinking" hoặc "Enlarging". (Chỉ trong combat đó)',
    )
    .weight(1.4)
    .effect({
      type: "custom",
      timing: "before_combat",
      target: "self",
      customHandler: "mad_scientist_random_size",
    })
    .register();

  // 51. Transmute: Chaos
  defineEffect("char_dev", "Transmute: Chaos")
    .description("Mất đi Char Dev này và nhận 2 Char Dev ngẫu nhiên.")
    .weight(2)
    .effect({
      type: "grant_char_dev",
      grantType: "char_dev",
      grantName: "random",
      grantCount: 2,
      timing: "immediate",
      target: "self",
    })
    .register();

  // 52. Metamorphosis
  defineEffect("char_dev", "Metamorphosis")
    .description(
      'Nhận Power "AIDS". Nhận ngẫu nhiên 1 trong 6: +1 Str, +7 Spd, +7 Dura, +0 IQ, +1 BIQ, +3 MA.',
    )
    .weight(2)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "AIDS",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "metamorphosis_random_stat",
    })
    .register();

  // 53. 100 Girlfriends
  defineEffect("char_dev", "100 Girlfriends")
    .description(
      "Sau mỗi combat: Nhận 1 Lover. Với mỗi Lover, +1 vào Stat thấp nhất.",
    )
    .weight(0.1)
    .effect({
      type: "grant_lover",
      timing: "after_combat",
      target: "self",
    })
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "100_girlfriends_stat_bonus",
    })
    .register();

  // 54. SVKS
  defineEffect("char_dev", "SVKS")
    .description(
      "Chọn 1 người chơi còn sống ngẫu nhiên. Bạn sẽ cướp lấy tất cả hiệu ứng mà người chơi đó nhận được từ vòng quay PvP Rewards. (Tính từ thời điểm Char Dev này được quay ra, nếu họ không có PvP Reward, nhận 1 char dev mới)",
    )
    .weight(1.6)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "svks_steal_pvp_rewards",
    })
    .register();

  // 55. Mang Bàn Chân Này Đi Dạo Phố
  defineEffect("char_dev", "Mang Bàn Chân Này Đi Dạo Phố")
    .description(
      "(1).Toàn bộ Stats của bạn cố định là 1. (2).Sau Combat: Với mỗi Ngọt Reference bạn có trong người, nhận thêm 1 điểm trước lúc tổng kết trận đấu. (3).Trong Combat: Nếu bạn Cover được full hoàn chỉnh 1 Bài của Thắng Ngọt và gửi vào kênh chat chung của Vòng quay trước khi trận đấu kết thúc thì bạn sẽ nhận 1 Slot mùa sau (Áp dụng 1 lần) (Không được duyệt nếu cố tình bôi nhọ hay chế lời hoặc cười cợt chơi đùa về bất cứ thứ gì, bạn phải hát nghiêm túc, chỉ hát cover 1 bài của Thắng Ngọt, có beat đệm không hát chay pls, tổ duyệt sẽ là Kwan và Vilhelm).",
    )
    .weight(0.1)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "mang_ban_chan_stats_1",
    })
    .register();

  // 56. MrBeast
  defineEffect("char_dev", "MrBeast")
    .description(
      "Sau Combat thắng: Quay 5 người chơi còn sống ngẫu nhiên và tặng cho họ 1 Gear ngẫu nhiên mà bạn có. (5 người cùng nhận Gear đó). Nếu bạn không có Gear nào, -5 1 stats ngẫu nhiên để tăng +1 cho 5 người đó. Nếu một MrBeast tặng cho một MrBeast, nhận +2 all stats. (cho người được tặng)",
    )
    .weight(1.2)
    .effect({
      type: "custom",
      timing: "after_combat_win",
      target: "self",
      customHandler: "mrbeast_gift_gear",
    })
    .register();

  // 57. "Chuyện Bộ Tộc"
  defineEffect("char_dev", '"Chuyện Bộ Tộc"')
    .description(
      '(1).Ngay lập tức khi quay xong toàn bộ player, bạn và những người cùng gia tộc nhận +1 All Base Stats. (2).Bạn và những người trong gia tộc có thể nhắn tin Discord cho Vilhelm0802(Vilhelm#0802) để xin tăng lượng chỉ số này lên thành +2 All Base Stats nhưng bù lại những người còn lại trong gia tộc không thể nhận hiệu ứng (1). (3).Nếu có 2 hoặc nhiều hơn 2 người trong gia tộc nhắn tin cho Vilhelm, cả gia tộc sẽ nhận -1 All Base Stats cho đến khi tất cả những người nhắn tin bị loại trong giải, khi đấy +1 All Base Stats lại cho những người còn sống (Về cơ bản là khôi phục lại như cũ nếu Sú chết hết). (4). Mỗi Gia Tộc kích hoạt "Chuyện Bộ Tộc" một lần duy nhất trong cả mùa giải.',
    )
    .weight(2)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "chuyen_bo_toc_house_bonus",
    })
    .register();

  // 58. Mahoraga!
  defineEffect("char_dev", "Mahoraga!")
    .description('Nhận Power "Adapt".')
    .weight(1.4)
    .effect({
      type: "grant_power",
      grantType: "power",
      grantName: "Adapt",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  // 59. Put the fries in the bag
  defineEffect("char_dev", "Put the fries in the bag")
    .description("Nhận -2 IQ, -2 BIQ.")
    .weight(1.4)
    .addStat("iq", -2)
    .addStat("biq", -2)
    .register();

  // 60. Don't say it
  defineEffect("char_dev", "Don't say it")
    .description(
      'Nhận -2 all stats. Sau combat thắng: Xóa bỏ hiệu ứng giảm stats, đồng thời nhận +2 all stats và nhận Power "Encroaching Shadow". (Hiệu ứng này chỉ kích hoạt 1 lần)',
    )
    .weight(1.8)
    .addAllStats(-2)
    .effect({
      type: "custom",
      timing: "after_combat_win",
      target: "self",
      triggerOnce: true,
      customHandler: "dont_say_it_win_bonus",
    })
    .register();

  // 61. Totally Handicapped
  defineEffect("char_dev", "Totally Handicapped")
    .description('Nhận 3 Quirk "Blind", "Mute" và "Deaf".')
    .weight(1.2)
    .effect({
      type: "grant_quirk",
      grantType: "quirk",
      grantName: "Blind",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "grant_quirk",
      grantType: "quirk",
      grantName: "Mute",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .effect({
      type: "grant_quirk",
      grantType: "quirk",
      grantName: "Deaf",
      grantCount: 1,
      timing: "immediate",
      target: "self",
    })
    .register();

  // 62. Cơ cấu
  defineEffect("char_dev", "Cơ cấu")
    .description(
      "Bạn sẽ gia nhập vào tổ đội Raid Boss có nhiều người nhất mà chưa đầy (Nếu có nhiều tổ đội bằng người sẽ quay random).",
    )
    .weight(1.6)
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "co_cau_join_raid_boss",
    })
    .register();

  // ============================================================================
  // SPECIAL CHAR DEVS (No weight - granted by other effects)
  // ============================================================================

  defineEffect("char_dev", "Lord of the Seven Kingdoms")
    .description("Nhận +1 bảy lần vào Base Stat thấp nhất.")
    .effect({
      type: "stat_modifier",
      stat: "lowest",
      value: 7,
      isBase: true,
      timing: "immediate",
      target: "self",
    })
    .register();

  defineEffect("char_dev", "Lord of Cinder")
    .description(
      "Nếu thua ở vòng có đọ trọng số (Vòng trong), đánh lại combat đấy thêm 1 lần nữa. (1 lần mỗi vòng đấu)",
    )
    .effect({
      type: "custom",
      timing: "after_combat_lose",
      target: "self",
      customHandler: "lord_of_cinder_rematch",
    })
    .register();

  defineEffect("char_dev", "Shardbearer")
    .description("Sau Combat: Nhận thêm 1 mảnh Great Rune chưa có.")
    .effect({
      type: "custom",
      timing: "after_combat",
      target: "self",
      customHandler: "shardbearer_great_rune",
    })
    .register();

  defineEffect("char_dev", "Ascended")
    .description(
      "Ngay lập tức khi nhận Char Dev này, 2 Stats cao nhất của bạn được +4.",
    )
    .effect({
      type: "custom",
      timing: "immediate",
      target: "self",
      customHandler: "ascended_top_2_stats",
    })
    .register();
}

// ============================================================================
// IMMEDIATE HANDLERS
// ============================================================================

registerImmediateHandler(
  "last_standing_check",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const { character, allCharacters } = ctx;

    if (!allCharacters || allCharacters.length === 0) {
      return {
        skipDefault: true,
        description: "Last Standing (không có dữ liệu players)",
      };
    }

    const myHouses: string[] = [];
    for (const h of character.nestedHouses || []) {
      if (!h.isLost || h.lostType === "kinda_homeless") myHouses.push(h.name);
    }
    for (const h of character.houses || []) {
      if (!h.isLost && !myHouses.includes(h.name)) myHouses.push(h.name);
    }

    if (myHouses.length === 0) {
      return {
        skipDefault: true,
        description: "Last Standing (không có House)",
      };
    }

    let isLastStanding = false;
    for (const houseName of myHouses) {
      const otherAliveMembers = allCharacters.filter((other) => {
        if (other.no === character.no) return false;
        if (other.tournament?.status !== "alive") return false;
        const otherHouses: string[] = [];
        for (const h of other.nestedHouses || []) {
          if (!h.isLost || h.lostType === "kinda_homeless")
            otherHouses.push(h.name);
        }
        for (const h of other.houses || []) {
          if (!h.isLost && !otherHouses.includes(h.name))
            otherHouses.push(h.name);
        }
        return otherHouses.includes(houseName);
      });
      if (otherAliveMembers.length === 0) {
        isLastStanding = true;
        break;
      }
    }

    if (!isLastStanding) {
      return {
        skipDefault: true,
        description:
          "Last Standing (chưa kích hoạt - còn đồng đội trong House)",
      };
    }

    return {
      statModifiers: STAT_NAMES.map((stat) => ({ stat, value: 2 })),
      skipDefault: true,
      description: "+2 All Stats (Last Standing)",
    };
  },
  "+2 all stats when last alive member of House",
);

registerImmediateHandler(
  "no_more_home_remove_house",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Bị loại khỏi House và mất tất cả bonus từ đó (No more Home)",
    };
  },
  "Remove character from their House and lose all House bonuses",
);

registerImmediateHandler(
  "lose_control_remove_all_powers",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Mất tất cả Power (Lose Control)",
    };
  },
  "Remove all Powers from character",
);

registerImmediateHandler(
  "creators_favor",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Creator buff nhân vật (tối đa 2 chỉ số)",
    };
  },
  "Creator manually buffs character (up to 2 stats)",
);

registerImmediateHandler(
  "creators_limitation",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Creator nerf nhân vật (tối đa 2 chỉ số)",
    };
  },
  "Creator manually nerfs character (up to 2 stats)",
);

registerImmediateHandler(
  "creators_reforge",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Loại bỏ vũ khí hiện tại và nhận vũ khí Normal + Rune do Creator chọn",
    };
  },
  "Creator removes current weapon and grants a Normal weapon with a Rune",
);

// registerImmediateHandler(
//   'demonic_pact_sacrifice',
//   (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
//     const randomStat = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
//     const currentVal = ctx.baseStats[randomStat] ?? 0;
//     return {
//       statModifiers: [{ stat: randomStat, value: -currentVal, isBase: true }],
//       skipDefault: true,
//       description: `Hiến tế ${randomStat} xuống 0 và nhận 3 Power (Demonic Pact)`,
//     };
//   },
//   'Sacrifice a random base stat to 0, gain 3 Powers'
// );

registerImmediateHandler(
  "mentor_steal_power",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Nhận 1 Power từ 1 player ngẫu nhiên (Mentor - mục tiêu mất power đó)",
    };
  },
  "Steal 1 Power from a random player",
);

registerImmediateHandler(
  "it_is_what_it_is_remove_weapons",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description: "Mất hết toàn bộ vũ khí (It is what it is)",
    };
  },
  "Remove all weapons from character",
);

registerImmediateHandler(
  "true_heir_emirate_check",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const { character } = ctx;
    const mods: ImmediateHandlerResult["statModifiers"] = [];
    let desc = "True Heir of the Emirate:";

    const archetypes: string[] =
      (character as any).archetypes?.map((a: any) =>
        typeof a === "string" ? a : a.name,
      ) || [];
    if (archetypes.some((a) => a.includes("🍀"))) {
      for (const stat of STAT_NAMES) mods.push({ stat, value: 1 });
      desc += " +1 All (Archetype🍀)";
    }

    const weapons: any[] = character.weapons || [];
    if (
      weapons.some((w) => {
        const wName = typeof w === "string" ? w : w.name;
        return wName && wName.includes("🍀");
      })
    ) {
      for (const stat of STAT_NAMES) mods.push({ stat, value: 1 });
      desc += " +1 All (Unique Weapon🍀)";
    }

    if (mods.length === 0) {
      return {
        skipDefault: true,
        description:
          "True Heir of the Emirate: không có Archetype🍀 hay Unique Weapon🍀",
      };
    }
    return { statModifiers: mods, skipDefault: true, description: desc };
  },
  "+1 all stats if has 🍀 Archetype, +1 all if has 🍀 Unique Weapon",
);

registerImmediateHandler(
  "nghe_bai_thu_toi_50_50",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        '50% nhận Char Dev "Braindead", 50% nhận Char Dev "Seeking Wisdom" (Nghe Bài thú tội)',
    };
  },
  "50% chance Braindead, 50% Seeking Wisdom Char Dev",
);

registerImmediateHandler(
  "kinda_homeless_leave_house",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Rời khỏi House nhưng vẫn giữ lại tất cả những gì đã nhận (Kinda Homeless)",
    };
  },
  "Leave House but keep all items received from it",
);

registerImmediateHandler(
  "become_power_ranger_setup",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Gia nhập Power Ranger Wheel. Không nhận PvP Rewards, không có vòng PvE. Sau combat thắng, all Rangers +1 random stat.",
    };
  },
  "Join the Power Ranger Wheel with special rules",
);

registerImmediateHandler(
  "back_to_basics_remove_powers",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Mất tất cả Power và không thể nhận Power mới (Back to Basics)",
    };
  },
  "Remove all Powers, cannot gain new Powers",
);

registerImmediateHandler(
  "svks_steal_pvp_rewards",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Cướp tất cả hiệu ứng PvP Rewards từ 1 người còn sống ngẫu nhiên (SVKS)",
    };
  },
  "Steal all PvP Reward effects from a random alive player",
);

registerImmediateHandler(
  "mrbeast_gift_gear",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Sau combat thắng: Quay 5 người và tặng 1 Gear. Nếu không có Gear: -5 stats để +1 cho 5 người (MrBeast)",
    };
  },
  "After win: gift gear to 5 random players or -5 stats to give +1 to 5 players",
);

registerImmediateHandler(
  "co_cau_join_raid_boss",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Gia nhập tổ đội Raid Boss có nhiều người nhất mà chưa đầy (Cơ cấu)",
    };
  },
  "Join the largest non-full Raid Boss team",
);

registerImmediateHandler(
  "haru_urara_round_32_check",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const round = ctx.character.tournament?.round ?? "-";
    const earlyRounds = ["256", "128", "64", "-"];
    if (earlyRounds.includes(round)) {
      return {
        skipDefault: true,
        description: "Haru Urara: chưa tới vòng 32 (chưa kích hoạt)",
      };
    }
    return {
      statModifiers: STAT_NAMES.map((stat) => ({ stat, value: 3 })),
      skipDefault: true,
      description: "+2 All Stats (Haru Urara - đã đến vòng 32, net +2)",
    };
  },
  "+3 all stats if tournament round is 32 or beyond (net +2 after initial -1)",
);

registerImmediateHandler(
  "nagi_extra_char_dev",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Nhận thêm 2 Char Dev ngẫu nhiên khi quay Char Dev wheel (Nagi)",
    };
  },
  "Gain 2 extra random Char Devs when spinning Char Dev wheel",
);

registerImmediateHandler(
  "tokai_teio_instrument_check",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const INSTRUMENT_WEAPONS = [
      "Bagpipe",
      "Drums",
      "Flute",
      "Guitar",
      "Violin",
      "Trumpet",
      "Piano",
      "Harp",
      "Lute",
      "Saxophone",
      "Bass",
      "Cello",
    ];
    const weapons: any[] = ctx.character.weapons || [];
    const hasInstrument = weapons.some((w) => {
      const wName = typeof w === "string" ? w : w.name;
      return (
        wName &&
        INSTRUMENT_WEAPONS.some((inst) =>
          wName.toLowerCase().includes(inst.toLowerCase()),
        )
      );
    });
    if (!hasInstrument) {
      return {
        skipDefault: true,
        description: "Tokai Teio: không có nhạc cụ, không kích hoạt",
      };
    }
    const currentSpeed = ctx.baseStats.speed ?? 0;
    return {
      statModifiers: [{ stat: "speed", value: currentSpeed, isBase: true }],
      skipDefault: true,
      description: `Gấp đôi Base Speed (${currentSpeed} → ${currentSpeed * 2}) khi dùng nhạc cụ (Tokai Teio)`,
    };
  },
  "Double Base Speed when using a musical instrument as weapon",
);

registerImmediateHandler(
  "rice_shower_not_finals",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const bracket = (ctx.character as any).tournament?.bracket ?? "";
    const isFinals = (ctx.character as any).tournament?.isFinals ?? false;
    const isLoserBracket = bracket === "loser" || bracket === "losers";
    if (!isLoserBracket || isFinals) {
      return {
        skipDefault: true,
        description: "Rice Shower: không ở nhánh thua hoặc đã tới chung kết",
      };
    }
    return {
      statModifiers: STAT_NAMES.map((stat) => ({ stat, value: 1 })),
      skipDefault: true,
      description: "+1 All Stats (Rice Shower - nhánh thua)",
    };
  },
  "+1 all stats in loser bracket, disabled in finals",
);

registerImmediateHandler(
  "final_reserves_round_16",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      skipDefault: true,
      description:
        "Final Reserves: Vòng 16 nhánh thua → loại bỏ hiệu ứng, nhận 2 Power ngẫu nhiên",
    };
  },
  "At loser round 16: remove effect and gain 2 random Powers",
);

registerImmediateHandler(
  "overcome_habits_per_quirk",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const quirkCount = ((ctx.character as any).quirks || []).filter(
      (q: any) => !q.isLost,
    ).length;
    if (quirkCount === 0) {
      return {
        skipDefault: true,
        description: "Overcome the Habits: Không có Quirk",
      };
    }
    let lowestStat: StatName = "strength";
    let lowestVal = ctx.baseStats.strength ?? 0;
    for (const stat of STAT_NAMES) {
      if ((ctx.baseStats[stat] ?? 0) < lowestVal) {
        lowestVal = ctx.baseStats[stat] ?? 0;
        lowestStat = stat;
      }
    }
    return {
      statModifiers: [{ stat: lowestStat, value: quirkCount }],
      skipDefault: true,
      description: `Overcome the Habits: ${quirkCount} Quirk → +${quirkCount} ${lowestStat} (stat thấp nhất)`,
    };
  },
  "+1 lowest stat per Quirk (Overcome the Habits)",
);

registerImmediateHandler(
  "w_speed_per_5_base",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const baseSpeed = ctx.baseStats.speed ?? 0;
    const bonus = Math.floor(baseSpeed / 5);
    if (bonus === 0) {
      return {
        skipDefault: true,
        description: `W Speed: Base Speed ${baseSpeed} < 5, không nhận bonus`,
      };
    }
    return {
      statModifiers: STAT_NAMES.filter((s) => s !== "speed").map((stat) => ({
        stat,
        value: bonus,
      })),
      skipDefault: true,
      description: `W Speed: +${bonus} vào tất cả chỉ số còn lại (${baseSpeed} Base Speed / 5)`,
    };
  },
  "+1 all other stats per 5 Base Speed (W Speed)",
);

registerImmediateHandler(
  "mad_scientist_random_size",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const isEnlarging = Math.random() < 0.5;
    return {
      skipDefault: true,
      description: `Mad Scientist: Trước combat nhận hiệu ứng "${isEnlarging ? "Enlarging" : "Shrinking"}" (chỉ trong combat đó)`,
    };
  },
  "Before combat: randomly apply Shrinking or Enlarging effect",
);

registerImmediateHandler(
  "metamorphosis_random_stat",
  (_ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const options: Array<{ stat: StatName; value: number }> = [
      { stat: "strength", value: 1 },
      { stat: "speed", value: 7 },
      { stat: "durability", value: 7 },
      { stat: "iq", value: 0 },
      { stat: "biq", value: 1 },
      { stat: "ma", value: 3 },
    ];
    const chosen = options[Math.floor(Math.random() * options.length)];
    if (chosen.value === 0) {
      return {
        skipDefault: true,
        description: "Metamorphosis: Quay ra +0 IQ (không có thay đổi)",
      };
    }
    return {
      statModifiers: [chosen],
      skipDefault: true,
      description: `Metamorphosis: +${chosen.value} ${chosen.stat}`,
    };
  },
  "Randomly gain one of: +1 Str, +7 Spd, +7 Dura, +0 IQ, +1 BIQ, +3 MA",
);

registerImmediateHandler(
  "100_girlfriends_stat_bonus",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const lover = ctx.character.lover as any;
    let loverCount = 0;
    if (lover) {
      if (Array.isArray(lover))
        loverCount = lover.filter((l: any) => !l.isLost).length;
      else if (typeof lover === "object" && !lover.isLost) loverCount = 1;
      else if (typeof lover === "string") loverCount = 1;
    }
    if (loverCount === 0) {
      return {
        skipDefault: true,
        description: "100 Girlfriends: Chưa có Lover",
      };
    }
    let lowestStat: StatName = "strength";
    let lowestVal = ctx.currentStats.strength;
    for (const stat of STAT_NAMES) {
      if ((ctx.currentStats as Record<StatName, number>)[stat] < lowestVal) {
        lowestVal = (ctx.currentStats as Record<StatName, number>)[stat];
        lowestStat = stat;
      }
    }
    return {
      statModifiers: [{ stat: lowestStat, value: loverCount }],
      skipDefault: true,
      description: `100 Girlfriends: ${loverCount} Lover → +${loverCount} ${lowestStat}`,
    };
  },
  "+1 lowest stat per Lover (100 Girlfriends)",
);

registerImmediateHandler(
  "mang_ban_chan_stats_1",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    return {
      statModifiers: STAT_NAMES.map((stat) => ({
        stat,
        value: 1 - ((ctx.baseStats as Record<StatName, number>)[stat] ?? 0),
        isBase: true as const,
      })),
      skipDefault: true,
      description: "Mang Bàn Chân Này Đi Dạo Phố: Tất cả Base Stats = 1",
    };
  },
  "Set all base stats to 1 (Mang Bàn Chân Này Đi Dạo Phố)",
);

registerImmediateHandler(
  "ascended_top_2_stats",
  (ctx: ImmediateHandlerContext): ImmediateHandlerResult => {
    const sorted = [...STAT_NAMES].sort(
      (a, b) =>
        ((ctx.currentStats as Record<StatName, number>)[b] ?? 0) -
        ((ctx.currentStats as Record<StatName, number>)[a] ?? 0),
    );
    const [top1, top2] = sorted;
    return {
      statModifiers: [
        { stat: top1, value: 4 },
        { stat: top2, value: 4 },
      ],
      skipDefault: true,
      description: `Ascended: +4 ${top1}, +4 ${top2} (2 stats cao nhất)`,
    };
  },
  "+4 to the 2 highest stats (Ascended)",
);

// ============================================================================
// COMBAT HANDLERS
// ============================================================================

registerCombatHandler(
  "king_slayer_vs_kings_landing",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppCharDevs: string[] =
      (ctx.opponent.character as any).charDevs?.map((c: any) =>
        typeof c === "string" ? c : c.name,
      ) || [];
    if (
      !oppCharDevs.some((cd) => cd.toLowerCase().includes("king's landing"))
    ) {
      return {
        skipDefault: true,
        description: 'King Slayer: đối thủ không có "King\'s Landing"',
      };
    }
    return {
      selfStatMods: STAT_NAMES.map((stat) => ({ stat, value: 1 })),
      description: "+1 All Stats (King Slayer vs King's Landing)",
    };
  },
  "+1 all stats when fighting opponent with King's Landing char dev",
);

registerCombatHandler(
  "kings_landing_death_gift",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description:
        "King's Landing: khi bị loại, gia tộc nhận 1 Power (handled externally)",
    };
  },
  "On death: housemates gain 1 Power",
);

registerCombatHandler(
  "kings_landing_penalty_check",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const selfRace = ctx.self.race?.toLowerCase() ?? "";
    const exemptRaces = ["god", "demi god", "demi-god", "demigod"];
    const isExemptByRace = exemptRaces.some((r) => selfRace.includes(r));
    const archetypes: string[] =
      (ctx.self as any).archetypes?.map((a: any) =>
        typeof a === "string" ? a : (a?.name ?? ""),
      ) || [];
    const isDevotee = archetypes.some((a) =>
      a.toLowerCase().includes("devotee"),
    );
    if (isExemptByRace || isDevotee) {
      return {
        skipDefault: true,
        description:
          "King's Landing: exempt (Archetype Devotee hoặc race God/Demi God)",
      };
    }
    return {
      selfStatMods: [{ stat: "iq", value: -10 }],
      selfPoints: -2,
      description:
        "King's Landing: -2 điểm và -10 IQ (không có Devotee/God/Demi God)",
    };
  },
  "King's Landing: -2 points and -10 IQ unless Archetype Devotee or race God/Demi God",
);

registerCombatHandler(
  "hand_of_king_vs_slayer",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    const oppCharDevs: string[] =
      (ctx.opponent.character as any).charDevs?.map((c: any) =>
        typeof c === "string" ? c : c.name,
      ) || [];
    if (
      !oppCharDevs.some(
        (cd) =>
          cd.toLowerCase().includes("king slayer") ||
          cd.toLowerCase().includes("slayer"),
      )
    ) {
      return {
        skipDefault: true,
        description: 'Hand of King: đối thủ không có "King Slayer"',
      };
    }
    return {
      selfStatMods: STAT_NAMES.map((stat) => ({ stat, value: 1 })),
      description: "+1 All Stats (Hand of King vs King Slayer)",
    };
  },
  "+1 all stats when fighting opponent with Become King Slayer char dev",
);

registerCombatHandler(
  "lord_of_cinder_rematch",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description:
        "Lord of Cinder: đánh lại combat này thêm 1 lần (handled externally)",
    };
  },
  "Rematch once per round if lost in a weighted round",
);

registerCombatHandler(
  "shardbearer_great_rune",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description:
        "Shardbearer: nhận 1 mảnh Great Rune chưa có (handled externally)",
    };
  },
  "After combat: gain 1 Great Rune shard not yet owned",
);

registerCombatHandler(
  "dont_say_it_win_bonus",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      selfStatMods: STAT_NAMES.map((stat) => ({ stat, value: 2 })),
      grantPower: "Encroaching Shadow",
      description:
        'Don\'t say it: xóa giảm stats, +2 All Stats, nhận "Encroaching Shadow"',
    };
  },
  "After first win: remove stat penalty, +2 all stats, grant Encroaching Shadow power",
);

registerCombatHandler(
  "mrbeast_gift_gear",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description:
        "MrBeast: Quay 5 người và tặng 1 Gear. Nếu không có Gear: -5 stats để +1 cho 5 người (handled externally)",
    };
  },
  "After win: gift gear to 5 random players, or -5 stats to give +1 to 5 players",
);

registerCombatHandler(
  "svks_steal_pvp_rewards",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description:
        "SVKS: Cướp tất cả hiệu ứng PvP Rewards từ 1 người ngẫu nhiên (handled externally)",
    };
  },
  "Steal all PvP Reward effects from a random alive player",
);

registerCombatHandler(
  "el_condor_pasa_dura_win",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    if (ctx.roundResults?.durability !== "win") {
      return {
        skipDefault: true,
        description: "El Condor Pasa: chưa thắng Round Dura",
      };
    }
    return {
      selfStatMods: [
        { stat: "speed", value: 3 },
        { stat: "strength", value: 3 },
      ],
      description: "+3 Speed, +3 Strength (El Condor Pasa - thắng Round Dura)",
    };
  },
  "After winning Dura round: +3 Speed and +3 Strength in next combat",
);

registerCombatHandler(
  "symboli_rudolf_finals_winner",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.isFinals || ctx.self.bracket === "loser") {
      return {
        skipDefault: true,
        description: "Symboli Rudolf: không phải chung kết nhánh thắng",
      };
    }
    return {
      selfStatMods: STAT_NAMES.map((stat) => ({ stat, value: 1 })),
      description:
        "+1 All Stats (Symboli Rudolf - thắng chung kết nhánh thắng)",
    };
  },
  "+1 all stats on winning winner bracket finals",
);

registerCombatHandler(
  "nice_nature_auto_win_tie",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    if (!ctx.opponent) return { skipDefault: true };
    if (ctx.self.roundsWon === 3 && ctx.self.roundsLost === 3) {
      return {
        autoWin: true,
        description: "Nice Nature: Tie-Break 3-3 → Auto Win",
      };
    }
    return {
      skipDefault: true,
      description: "Nice Nature: chưa đến Tie-Break 3-3",
    };
  },
  "If tied 3-3 in combat, skip Tie-Break and auto-win",
);

registerCombatHandler(
  "rice_shower_not_finals",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const isLoserBracket =
      ctx.self.bracket === "loser" || ctx.self.bracket === "losers";
    if (!isLoserBracket || ctx.isFinals) {
      return {
        skipDefault: true,
        description: "Rice Shower: không ở nhánh thua hoặc đã tới chung kết",
      };
    }
    return {
      selfStatMods: STAT_NAMES.map((stat) => ({ stat, value: 1 })),
      description: "+1 All Stats trong combat (Rice Shower - nhánh thua)",
    };
  },
  "+1 all stats in loser bracket combats, disabled in finals",
);

registerCombatHandler(
  "haru_urara_round_32_check",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const round = ctx.self.character.tournament?.round ?? "-";
    const earlyRounds = ["256", "128", "64", "-"];
    if (earlyRounds.includes(round)) {
      return { skipDefault: true, description: "Haru Urara: chưa tới vòng 32" };
    }
    return {
      selfStatMods: STAT_NAMES.map((stat) => ({ stat, value: 3 })),
      description: "+3 All Stats (Haru Urara - đã đến vòng 32)",
    };
  },
  "+3 all stats during combat if tournament round is 32 or beyond",
);

registerCombatHandler(
  "nagi_extra_char_dev",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    return {
      description:
        "Nagi: +2 Char Dev khi quay vòng Char Dev (handled externally)",
    };
  },
  "Gain 2 extra Char Devs when spinning Char Dev wheel",
);

registerCombatHandler(
  "tokai_teio_instrument_check",
  (ctx: CombatHandlerContext): CombatHandlerResult => {
    const INSTRUMENT_WEAPONS = [
      "Bagpipe",
      "Drums",
      "Flute",
      "Guitar",
      "Violin",
      "Trumpet",
      "Piano",
      "Harp",
      "Lute",
      "Saxophone",
      "Bass",
      "Cello",
    ];
    const weapons: any[] = ctx.self.weapons || [];
    const hasInstrument = weapons.some((w) => {
      const wName = typeof w === "string" ? w : w?.name;
      return (
        wName &&
        INSTRUMENT_WEAPONS.some((inst) =>
          wName.toLowerCase().includes(inst.toLowerCase()),
        )
      );
    });
    if (!hasInstrument) {
      return { skipDefault: true, description: "Tokai Teio: không có nhạc cụ" };
    }
    const baseSpeed = ctx.self.baseStats.speed ?? 0;
    return {
      selfStatMods: [{ stat: "speed", value: baseSpeed }],
      description: `Gấp đôi Base Speed (+${baseSpeed}) khi dùng nhạc cụ (Tokai Teio)`,
    };
  },
  "Double Base Speed during combat when using a musical instrument",
);

registerCombatHandler(
  "mad_scientist_random_size",
  (_ctx: CombatHandlerContext): CombatHandlerResult => {
    // Effect đã được apply qua wheel spin trong BattleZonePage (madScientistResult state)
    // Không apply ngẫu nhiên nữa — skip để tránh double apply
    return { skipDefault: true };
  },
  "Mad Scientist effect applied via wheel spin in BattleZonePage (no random fallback)",
);

// ============================================================================
// EXPORTS
// ============================================================================

export function registerCharDevHandlers(): void {
  console.log("CharDev handlers registered");
}

export function registerCharDevCombatHandlers(): void {
  console.log("CharDev combat handlers registered");
}
