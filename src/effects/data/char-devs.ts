/**
 * Character Development Effects
 *
 * Char Dev: Plot của nhân vật
 */

import { defineEffect } from '../registry';

export function registerCharDevEffects() {
  // 1. Armed to the Teeth - Nhận 3 Normal Gear ngẫu nhiên (no stat change)
  defineEffect('char_dev', 'Armed to the Teeth')
    .description('Nhận 3 Normal Gear ngẫu nhiên.')
    .register();

  // 2. Training Arc
  defineEffect('char_dev', 'Training Arc')
    .description('Nhận +1 all stats.')
    .addAllStats(1)
    .register();

  // 3. In Love - Quay Lover, +2 vào stat cao nhất của lover (complex, no simple stat)
  defineEffect('char_dev', 'In Love')
    .description('Quay một player làm "Lover" và nhận +2 vào Stat mà người đó cao nhất.')
    .register();

  // 4. No more Home - Mất House bonus (no stat change here)
  defineEffect('char_dev', 'No more Home')
    .description('Bạn bị loại khỏi "House" của mình và mất tất cả Bonus từ đó.')
    .register();

  // 5. No more family - Nhận thêm 2 Power (no stat change)
  defineEffect('char_dev', 'No more family')
    .description('Nhận thêm 2 Power.')
    .register();

  // 6. Depression - Nhận -3 vào chỉ số cao nhất (complex, need custom handler)
  defineEffect('char_dev', 'Depression')
    .description('Nhận -3 vào chỉ số cao nhất khi nhận Char Dev này.')
    .register();

  // 7. Seeking Wisdom
  defineEffect('char_dev', 'Seeking Wisdom')
    .description('Nhận +4 IQ và Quirk "Fast Learner".')
    .addStat('iq', 4)
    .register();

  // 8. Inversion - Đảo ngược base stat (complex, no simple stat)
  defineEffect('char_dev', 'Inversion')
    .description('Đảo ngược tất cả base stat. (10<->1, 9<->2, 8<->3, 7<->4, 6<->5,...)')
    .register();

  // 9. Isekai - Quay lại từ đầu (no stat change)
  defineEffect('char_dev', 'Isekai')
    .description('Quay lại từ đầu 💀')
    .register();

  // 10. Final Reserves - Conditional +1 all stats khi ở nhánh thua
  defineEffect('char_dev', 'Final Reserves')
    .description('Khi ở nhánh thua, +1 all stats. Khi đến vòng 16 người nhánh thua, loại bỏ hiệu ứng này và nhận 2 random Power.')
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'during_combat',
      target: 'self',
      conditions: [{ type: 'bracket', bracket: 'loser' }]
    })
    .register();

  // 11. Lose Control - Mất tất cả Power (no stat change)
  defineEffect('char_dev', 'Lose Control')
    .description('Mất tất cả Power. 💀')
    .register();

  // 12. Prime time - +2 all stats, vô hiệu hóa khi xuống nhánh thua và chung kết
  defineEffect('char_dev', 'Prime time')
    .description('Nhận +2 all stats. Vô hiệu hóa khi xuống nhánh thua và chung kết.')
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 2,
      timing: 'immediate',
      target: 'self',
      conditions: [{ type: 'bracket', bracket: 'winner' }]
    })
    .register();

  // 13. Fate's Trick - 50% chance (complex, no simple stat)
  defineEffect('char_dev', "Fate's Trick")
    .description('Có 50% khả năng nhân đôi Base stat thấp nhất và 50% khả năng chia đôi stat cao nhất.')
    .register();

  // 14. Old Age
  defineEffect('char_dev', 'Old Age')
    .description('Nhận +3 IQ và -1 mọi chỉ số còn lại.')
    .addStat('iq', 3)
    .addStat('strength', -1)
    .addStat('speed', -1)
    .addStat('durability', -1)
    .addStat('biq', -1)
    .addStat('ma', -1)
    .register();

  // 15. Creator's Favor - Creator buff (no fixed stat)
  defineEffect('char_dev', "Creator's Favor")
    .description('"Đấng Sáng Tạo" tùy ý buff cho nhân vật.')
    .register();

  // 16. Become Woke
  defineEffect('char_dev', 'Become Woke')
    .description('Nhận -3 IQ, +1 Strength và +1 Durability.')
    .addStat('iq', -3)
    .addStat('strength', 1)
    .addStat('durability', 1)
    .register();

  // 17. Demonic Pact - Hiến tế 1 base stat (complex)
  defineEffect('char_dev', 'Demonic Pact')
    .description('Hiến tế 1 base stat ngẫu nhiên (giảm xuống 0) để nhận 3 Power.')
    .register();

  // 18. Mentor - Nhận Power từ player khác (no stat change)
  defineEffect('char_dev', 'Mentor')
    .description('Nhận thêm 1 Power từ 1 Player ngẫu nhiên.')
    .register();

  // 19. It is what it is - Mất vũ khí (no stat change)
  defineEffect('char_dev', 'It is what it is')
    .description('Mất hết toàn bộ vũ khí của mình. 💀')
    .register();

  // 20. Make love - Quay lover (no stat change)
  defineEffect('char_dev', 'Make love')
    .description('Quay 1 wheel bao gồm toàn bộ player hiện tại để chọn ra người tình.')
    .register();

  // 21. Pessimistic - Khi xuống nhánh thua, -1 all stats
  defineEffect('char_dev', 'Pessimistic')
    .description('Khi xuống nhánh thua, -1 all stats.')
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: -1,
      timing: 'during_combat',
      target: 'self',
      conditions: [{ type: 'bracket', bracket: 'loser' }]
    })
    .register();

  // 22. Finality - Race tuyệt chủng (no stat change)
  defineEffect('char_dev', 'Finality')
    .description('Race của bạn tuyệt chủng trong mùa này. 💀')
    .register();

  // 23. Last Standing - +2 all stats khi là người duy nhất còn lại của House
  defineEffect('char_dev', 'Last Standing')
    .description('Khi là người duy nhất còn lại của "Gia tộc" (House), +2 all stats.')
    .register();

  // 24. Furry - Combat effects vs Werebeast
  defineEffect('char_dev', 'Furry')
    .description('Trong Combat: +1 all stats khi đấu với Werebeast.')
    .effect({
      type: 'stat_modifier',
      stat: 'all',
      value: 1,
      timing: 'during_combat',
      target: 'self',
      conditions: [{ type: 'race_match', races: ['Werebeast'] }]
    })
    .register();

  // 25. Abused
  defineEffect('char_dev', 'Abused')
    .description('Nhận -1 IQ, +3 Durability.')
    .addStat('iq', -1)
    .addStat('durability', 3)
    .register();

  // 26. A Big Gift! - Random Legacy Gear (no stat change)
  defineEffect('char_dev', 'A Big Gift!')
    .description('Nhận 1 random Legacy Gear.')
    .register();

  // 27. Become Vegetarian
  defineEffect('char_dev', 'Become Vegetarian')
    .description('Nhận -2 Durability.')
    .addStat('durability', -2)
    .register();

  // 28. Creator's Limitation - Creator nerf (no fixed stat)
  defineEffect('char_dev', "Creator's Limitation")
    .description('"Đấng Sáng Tạo" tùy ý nerf cho nhân vật.')
    .register();

  // 29. Braindead
  defineEffect('char_dev', 'Braindead')
    .description('Nhận -4 IQ và Quirk "Brainrot" 💀')
    .addStat('iq', -4)
    .register();

  // 30. Blessed by Chaos - Kéo stat cao nhất xuống 1 (complex)
  defineEffect('char_dev', 'Blessed by Chaos')
    .description('Kéo base stat của chỉ số cao nhất xuống 1, sau đó nhận thêm 2 Character Development.')
    .register();

  // 31. Lost an Arm
  defineEffect('char_dev', 'Lost an Arm')
    .description('Nhận -4 Martial Arts 💀')
    .addStat('ma', -4)
    .register();

  // 32. Lost a Leg
  defineEffect('char_dev', 'Lost a Leg')
    .description('Nhận -4 Speed 💀')
    .addStat('speed', -4)
    .register();

  // 33. Obtain a Cultivation Technique
  defineEffect('char_dev', 'Obtain a Cultivation Technique')
    .description('Nhận +2 BIQ, +3 Martial Arts.')
    .addStat('biq', 2)
    .addStat('ma', 3)
    .register();

  // 34. Become King Slayer - Nhận Archetype Slayer + combat bonus
  defineEffect('char_dev', 'Become King Slayer')
    .description("Nhận Archetype \"Slayer\". Trong Combat: Nếu đối thủ có Char Dev \"King's Landing\", nhận +1 All Stats.")
    .register();

  // 35. King's Landing - Combat effects
  defineEffect('char_dev', "King's Landing")
    .description('Khi bạn bị loại, gia tộc nhận 1 Power. Trong Combat: -2 điểm khởi đầu và -10 IQ nếu không có Devotee/God/Demi God.')
    .register();

  // 36. True Heir of the Emirate - Conditional +1 all stats
  defineEffect('char_dev', 'True Heir of the Emirate🍀')
    .description('Nếu bạn có Archetype🍀, nhận +1 All Stats 🍀. Nếu bạn có Unique Weapon 🍀, nhận +1 All Stats 🍀')
    .register();

  // 37. Become Hand of The King
  defineEffect('char_dev', 'Become Hand of The King')
    .description('Nhận +3 IQ. Trong Combat: Nếu đối thủ có Char Dev "Become King Slayer", nhận +1 All Stats.')
    .addStat('iq', 3)
    .register();

  // 38. Kungfu Training
  defineEffect('char_dev', 'Kungfu Training')
    .description('Nhận +2 Durability và +2 Martial Arts.')
    .addStat('durability', 2)
    .addStat('ma', 2)
    .register();

  // 39. Too Horny
  defineEffect('char_dev', 'Too Horny')
    .description('Nhận +3 Strength và +2 Durability, nhưng Base IQ biến thành 0.')
    .addStat('strength', 3)
    .addStat('durability', 2)
    // Note: IQ = 0 needs custom handler
    .register();

  // 40. Creator's Reforge - Loại bỏ vũ khí (no stat change)
  defineEffect('char_dev', "Creator's Reforge")
    .description('Loại bỏ vũ khí hiện tại, Creator sẽ chọn 1 vũ khí Normal cho bạn.')
    .register();

  // 41. Become Perfectionist - Nhận Archetype
  defineEffect('char_dev', 'Become Perfectionist')
    .description('Nhận Archetype "Perfectionist".')
    .register();

  // 42. Too Edgy - Nhận Archetype
  defineEffect('char_dev', 'Too Edgy')
    .description('Nhận Archetype "Edgelord".')
    .register();

  // 43. Overcome the Habits - +1 per quirk to lowest stat (complex)
  defineEffect('char_dev', 'Overcome the Habits')
    .description('Với mỗi Quirk bạn có, +1 vào stat thấp nhất.')
    .register();

  // 44. Nghe Bài thú tội - 50% chance (complex)
  defineEffect('char_dev', 'Nghe Bài thú tội')
    .description('50% Nhận Char Dev "Braindead", 50% Nhận Char Dev "Seeking Wisdom".')
    .register();

  // 45. Kinda Homeless - Rời House (no stat change)
  defineEffect('char_dev', 'Kinda Homeless')
    .description('Rời khỏi House của mình, nhưng vẫn giữ lại toàn bộ những thứ đã nhận từ House.')
    .register();

  // 46. Become a Power Ranger - Complex effects
  defineEffect('char_dev', 'Become a Power Ranger')
    .description('Nhận "Power Ranger Wheel" và hiệu ứng tương ứng.')
    .register();

  // 47. W Speed - +1 all stats per 5 base Speed (complex)
  defineEffect('char_dev', 'W Speed')
    .description('Nhận thêm +1 vào tất cả các chỉ số còn lại với mỗi 5 base Speed.')
    .register();

  // 48. Back to Basics
  defineEffect('char_dev', 'Back to Basics')
    .description('Mất đi tất cả Power, không thể nhận Power. Nhận +2 all stats.')
    .addAllStats(2)
    .register();

  // 49. Never skip Leg Day
  defineEffect('char_dev', 'Never skip Leg Day')
    .description('Nhận +2 Speed và Speed không thể bị giảm bởi Debuff.')
    .addStat('speed', 2)
    .register();

  // 50. Mad Scientist - Random combat effect
  defineEffect('char_dev', 'Mad Scientist')
    .description('Trước combat: Nhận ngẫu nhiên hiệu ứng của "Shrinking" hoặc "Enlarging".')
    .register();

  // 51. Transmute: Chaos - Mất Char Dev, nhận 2 mới (no stat change)
  defineEffect('char_dev', 'Transmute: Chaos')
    .description('Mất đi Char Dev này và nhận 2 Char Dev ngẫu nhiên.')
    .register();

  // 52. Metamorphosis - Complex effects
  defineEffect('char_dev', 'Metamorphosis')
    .description('Nhận Power "AIDS". Nhận ngẫu nhiên 1 trong 6 hiệu ứng.')
    .register();

  // 53. 100 Girlfriends - After combat effect
  defineEffect('char_dev', '100 Girlfriends')
    .description('Sau mỗi combat: Nhận 1 Lover. Với mỗi Lover, +1 vào Stat thấp nhất.')
    .register();

  // 54. SVKS - Cướp PvP Rewards (no stat change)
  defineEffect('char_dev', 'SVKS')
    .description('Cướp lấy tất cả hiệu ứng mà người chơi khác nhận được từ PvP Rewards.')
    .register();

  // 55. Mang Bàn Chân Này Đi Dạo Phố - All stats = 1 (complex)
  defineEffect('char_dev', 'Mang Bàn Chân Này Đi Dạo Phố')
    .description('Toàn bộ Stats của bạn cố định là 1.')
    .register();

  // 56. MrBeast - After combat effect
  defineEffect('char_dev', 'MrBeast')
    .description('Sau Combat thắng: Quay 5 người và tặng Gear.')
    .register();

  // 57. "Chuyện Bộ Tộc" - House bonus (complex)
  defineEffect('char_dev', '"Chuyện Bộ Tộc"')
    .description('Bạn và gia tộc nhận +1 All Base Stats.')
    .register();

  // 58. Mahoraga!
  defineEffect('char_dev', 'Mahoraga!')
    .description('Nhận Power "Adapt".')
    .register();

  // 59. Put the fries in the bag
  defineEffect('char_dev', 'Put the fries in the bag')
    .description('Nhận -2 IQ, -2 BIQ.')
    .addStat('iq', -2)
    .addStat('biq', -2)
    .register();

  // 60. Don't say it - Complex after combat effect
  defineEffect('char_dev', "Don't say it")
    .description('Nhận -2 all stats. Sau combat thắng: Xóa bỏ giảm stats, +2 all stats và nhận Power.')
    .addAllStats(-2)
    .register();

  // 61. Totally Handicapped - Nhận 3 Quirks
  defineEffect('char_dev', 'Totally Handicapped')
    .description('Nhận 3 Quirk "Blind", "Mute" và "Deaf".')
    .register();

  // 62. Cơ cấu - Join Raid Boss team (no stat change)
  defineEffect('char_dev', 'Cơ cấu')
    .description('Bạn sẽ gia nhập vào tổ đội Raid Boss có nhiều người nhất.')
    .register();
}
