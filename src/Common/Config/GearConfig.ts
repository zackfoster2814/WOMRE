import { WheelStep } from "../Types/types.ts";

export const gearCountWheel: WheelStep = {
  key: "gear-count",
  title: "Gear Count",
  sections: [
    {
      id: "g0",
      name: "0 Gear",
      weight: 20,
      color: "#CCCCCC",
      description: "Không nhận gear.",
    },
    {
      id: "g1",
      name: "1 Gear",
      weight: 30,
      color: "#A2D149",
      description: "Nhận 1 gear.",
    },
    {
      id: "g2",
      name: "2 Gear",
      weight: 25,
      color: "#FFD700",
      description: "Nhận 2 gear.",
    },
    {
      id: "g3",
      name: "3 Gear",
      weight: 15,
      color: "#87CEEB",
      description: "Nhận 3 gear.",
    },
    {
      id: "g4",
      name: "4 Gear",
      weight: 10,
      color: "#FF69B4",
      description: "Nhận 4 gear.",
    },
  ],
};

export const legacyGearCountWheel: WheelStep = {
  key: "legacy-gear-count",
  title: "Legacy Gear Count",
  sections: [
    {
      id: "lg0",
      name: "0 Legacy",
      weight: 88,
      color: "#CCCCCC",
      description: "Không nhận legacy gear.",
    },
    {
      id: "lg1",
      name: "1 Legacy",
      weight: 12,
      color: "#FFD700",
      description: "Nhận 1 legacy gear.",
    },
  ],
};

export const gearWheel: WheelStep = {
  key: "gear",
  title: "Gear",
  sections: [
    {
      id: "1",
      name: "Fishing Rod",
      weight: 2.78,
      color: "#A2D149",
      description: "Sau 1 trận PvE, nhận 1 PvP Reward. (80%, Physical)",
      usableRate: 80,
    },
    {
      id: "2",
      name: "Sổ tay",
      weight: 2.78,
      color: "#FFD700",
      description: "Khi thua IQ, nhận +1 IQ (80%, Physical)",
      usableRate: 80,
    },
    {
      id: "3",
      name: "Văn tế",
      weight: 2.78,
      color: "#87CEEB",
      description:
        "Nhận -1 All Stats. Nếu bị loại, re-spin stat cao nhất random. (100%, Physical/Magic)",

      usableRate: 100,
    },
    {
      id: "4",
      name: "Silver Steed",
      weight: 2.78,
      color: "#FF69B4",
      description: "+2 Speed. (100%, Physical)",
      usableRate: 100,
    },
    {
      id: "5",
      name: "Wooden Shield",
      weight: 2.78,
      color: "#A2D149",
      description: "+1 Durability. (99%, Physical)",
      usableRate: 99,
    },
    {
      id: "6",
      name: "Wizard Hat",
      weight: 2.78,
      color: "#FFD700",
      description: "+1 IQ. (70%, Magic)",
      usableRate: 70,
    },
    {
      id: "7",
      name: "Love Letter",
      weight: 2.78,
      color: "#87CEEB",
      description:
        "Nếu có 'Lover': +1 all stats, nếu không: vô dụng. (100%, P/M)",
      usableRate: 100,
    },
    {
      id: "8",
      name: "Holy Symbol",
      weight: 2.78,
      color: "#FF69B4",
      description:
        "Khi combat với Demon, Vampire, Spirit, Orc, Skeleton, Goblin: đối thủ -1 all stats. (60%, Magic)",
      usableRate: 60,
    },
    {
      id: "9",
      name: "Fingerthing",
      weight: 2.78,
      color: "#A2D149",
      description: "Nhận 1 Quirk. (90%, P/M)",
      usableRate: 90,
    },
    {
      id: "10",
      name: "Healing Flasks",
      weight: 2.78,
      color: "#FFD700",
      description: "+2 vào Stat thấp nhất khi ở nhánh thua. (100%, P/M)",
      usableRate: 100,
    },
    {
      id: "11",
      name: "Leather Jacket",
      weight: 2.78,
      color: "#87CEEB",
      description: "+2 Durability. (100%, Physical)",
      usableRate: 100,
    },
    {
      id: "12",
      name: "Baguette",
      weight: 2.78,
      color: "#FF69B4",
      description:
        "Nếu đủ bộ công cụ nấu ăn (12,13,14): +1 all stats. (100%, Physical)",
      usableRate: 100,
    },
    {
      id: "13",
      name: "Frying Pan",
      weight: 2.78,
      color: "#A2D149",
      description:
        "Nếu đủ bộ công cụ nấu ăn (12,13,14): +1 all stats. (100%, Physical)",
      usableRate: 100,
    },
    {
      id: "14",
      name: "Spatula",
      weight: 2.78,
      color: "#FFD700",
      description:
        "Nếu đủ bộ công cụ nấu ăn (12,13,14): +1 all stats. (100%, Physical)",
      usableRate: 100,
    },
    {
      id: "15",
      name: "Gold Pine Resin",
      weight: 2.78,
      color: "#87CEEB",
      description: "+2 BIQ. (80%, P/M)",
      usableRate: 80,
    },
    {
      id: "16",
      name: "Knight's Armor",
      weight: 2.78,
      color: "#FF69B4",
      description: "-2 Speed, +2 Dura, +1 Str. (90%, Physical)",
      usableRate: 90,
    },
    {
      id: "17",
      name: "Cursed Charm",
      weight: 2.78,
      color: "#A2D149",
      description: "-1 Speed. (70%, Magic)",
      usableRate: 70,
    },
    {
      id: "18",
      name: "Goggles with Microscope",
      weight: 2.78,
      color: "#FFD700",
      description:
        "So sánh Quirk/Power sau mỗi PvP Reward → swap random. (80%, P/M)",
      usableRate: 80,
    },
    {
      id: "19",
      name: "Swift Boots",
      weight: 2.78,
      color: "#87CEEB",
      description: "+1 Speed. (90%, Physical)",
      usableRate: 90,
    },
    {
      id: "20",
      name: "Kuro's Charm",
      weight: 2.78,
      color: "#FF69B4",
      description: "+1 All Stats, phá hủy sau trận thắng đầu tiên. (90%, P/M)",
      usableRate: 90,
    },
    {
      id: "21",
      name: "Buckler",
      weight: 2.78,
      color: "#A2D149",
      description: "+1 Strength, +1 Dura. (99%, Physical)",
      usableRate: 99,
    },
    {
      id: "22",
      name: "Soap",
      weight: 2.78,
      color: "#FFD700",
      description: "Thơm. (100%, Physical)",
      usableRate: 100,
    },
    {
      id: "23",
      name: "Magical Scroll",
      weight: 2.78,
      color: "#87CEEB",
      description: "+1 IQ và +1 BIQ. (80%, Magic)",
      usableRate: 80,
    },
    {
      id: "24",
      name: "Ba hoa trắng",
      weight: 2.78,
      color: "#FF69B4",
      description: "Khi ở nhánh thua: -2 all Stats. (90%, Magic)",
      usableRate: 90,
    },
    {
      id: "25",
      name: "Khung hình thờ",
      weight: 2.78,
      color: "#A2D149",
      description:
        "Thua trận → chuyển cho người thắng. Mỗi cái: -1 stat cao nhất. (80%, Magic)",
      usableRate: 80,
    },
    {
      id: "26",
      name: "Xương sống lưỡi",
      weight: 2.78,
      color: "#FFD700",
      description: "Vào vòng 32 → mất item này, nhận 1 Power. (90%, P/M)",
      usableRate: 90,
    },
    {
      id: "27",
      name: "Thuốc tráng dương",
      weight: 2.78,
      color: "#87CEEB",
      description: "+2 Str, +2 Dura. (70%, Physical)",
      usableRate: 70,
    },
    {
      id: "28",
      name: "Đồng tiền vàng",
      weight: 2.78,
      color: "#FF69B4",
      description: "Thua trận → mất coin để mua 1 Gear khác. (100%, Physical)",
      usableRate: 100,
    },
    {
      id: "29",
      name: "Cuộn khăn giấy",
      weight: 2.78,
      color: "#A2D149",
      description:
        "Nếu không có Lover: +1 Dura. Nếu có Lover: +1 Speed. (69%, Physical)",
      usableRate: 69,
    },
    {
      id: "30",
      name: "Academie Ring",
      weight: 2.78,
      color: "#FFD700",
      description: "+1 IQ. (70%, Magic)",
      usableRate: 70,
    },
    {
      id: "31",
      name: "Dark Lanthorn",
      weight: 2.78,
      color: "#87CEEB",
      description: "Phát sáng trong đêm. (100%, P/M)",
      usableRate: 100,
    },
    {
      id: "32",
      name: "Lover's Glover",
      weight: 2.78,
      color: "#FF69B4",
      description: "Nhận 1 'Lover'. (90%, Physical)",
      usableRate: 90,
    },
    {
      id: "33",
      name: "Storage Room Key",
      weight: 2.78,
      color: "#A2D149",
      description: "Creator tặng thêm 1 Gear khác. (100%, Physical)",
      usableRate: 100,
    },
    {
      id: "34",
      name: "Foreclosure Notice",
      weight: 2.78,
      color: "#FFD700",
      description:
        "Nếu không đủ 8 điểm vòng 32 → mất toàn bộ Gear/Weapon, nhận Char Dev. (100%, Physical)",
      usableRate: 100,
    },
    {
      id: "35",
      name: "Cursed Coin",
      weight: 2.78,
      color: "#87CEEB",
      description:
        "Combat: Trước trận quay 50/50 → người thua -1 All Stats. (100%, P/M)",
      usableRate: 100,
    },
    {
      id: "36",
      name: "Empty Stein",
      weight: 2.78,
      color: "#FF69B4",
      description: "Một cái cốc rỗng. (100%, Physical)",
      usableRate: 100,
    },
  ],
};

export const legacyGearWheel: WheelStep = {
  key: "legacy-gear",
  title: "Legacy Gear",
  sections: [
    {
      id: "l1",
      name: "The Ancient Ladder: A Journey to the Fullness of Sin with Demon",
      weight: 4.55,
      color: "#A2D149",
      description:
        "Gấp đôi hiệu ứng Sin nếu là Demon.\nNhận +1 MA, +1 IQ, +1 Speed (100%, Physical/Magic).",
    },
    {
      id: "l2",
      name: "God of Love's Cooking Recipe",
      weight: 4.55,
      color: "#FFD700",
      description:
        "Nhận ngẫu nhiên 1 Power của 1 người chơi đã bị loại khi vào vòng 64/16.\n-1 Dura với mỗi lần kích hoạt. (100%, Magic).",
    },
    {
      id: "l3",
      name: "The Angel's Finger Bone",
      weight: 4.55,
      color: "#87CEEB",
      description:
        "Đảo ngược tất cả base stat.\nSau đó nhận +2 IQ và 1 Power. (100%, Magic).",
    },
    {
      id: "l4",
      name: "The Tamer Straight Sword",
      weight: 4.55,
      color: "#FF69B4",
      description:
        "Nhận 1 Summon.\nĐánh cắp 1 Power ngẫu nhiên của đối thủ sau khi chiến thắng. (100%, Physical/Magic).",
    },
    {
      id: "l5",
      name: "Soul Sucker",
      weight: 4.55,
      color: "#A2D149",
      description:
        "Đối thủ bị Re-spin Stat cao nhất sau trận đấu (bất kể mình thắng hay thua). (100%, Magic).",
    },
    {
      id: "l6",
      name: "Leaf that got Blowed",
      weight: 4.55,
      color: "#FFD700",
      description:
        'Nhận Power "Blowing Leaves".\nKháng tất cả debuff giảm chỉ số từ đối phương. (100%, Physical/Magic).',
    },
    {
      id: "l7",
      name: "Dart for the Dwarf Heir",
      weight: 4.55,
      color: "#87CEEB",
      description:
        "Đối thủ bị -1 all stats và thêm -1 vào Stat cao nhất khi vào trận. (100%, Physical).",
    },
    {
      id: "l8",
      name: "King Gnome's Banana",
      weight: 4.55,
      color: "#FF69B4",
      description:
        "Nhận -2 all stats nếu IQ thấp hơn đối phương.\nNhận +2 all stats nếu IQ cao hơn đối phương. (100%, Physical).",
    },
    {
      id: "l9",
      name: "Human NPC's Axe",
      weight: 4.55,
      color: "#A2D149",
      description:
        "Nhận 1 Power.\n+1 vào stat cao nhất.\n+2 all stats nếu bạn là NPC. (100%, Physical).",
    },
    {
      id: "l10",
      name: "Ragnarok's Cobra",
      weight: 4.55,
      color: "#FFD700",
      description:
        "Giết 1 vị thần ngẫu nhiên sau khi quay đủ player (tính là 1 trận thắng).\nTự động thua ở vòng 64 (1 lần). (100%, Physical/Magic).",
    },
    {
      id: "l11",
      name: "God of War's Entry Ticket",
      weight: 4.55,
      color: "#87CEEB",
      description:
        'Biến Base Strength thành 10.\n"Make love" với 1 tộc.\n+2 stat thấp nhất khi đối đầu Demi God/God. (100%, Physical).',
    },
    {
      id: "l12",
      name: "The First Dragon Scale",
      weight: 4.55,
      color: "#FF69B4",
      description:
        "Nhận +4 vào Stat thấp nhất.\n+1 all Stat khi đối đầu với chủng tộc thấp kém hơn. (100%, Physical).",
    },
    {
      id: "l13",
      name: "Artist's Easel",
      weight: 4.55,
      color: "#A2D149",
      description:
        'Bạn có thêm Power "Artist".\nNhận thêm 1 Power và 1 Quirk. (100%, Magic).',
    },
    {
      id: "l14",
      name: "Writer's Quill",
      weight: 4.55,
      color: "#FFD700",
      description:
        'Bạn có thêm Power "Writer".\nNhận thêm 1 Char Dev, 1 Archetype. (100%, Magic).',
    },
    {
      id: "l15",
      name: "IT's Abacus",
      weight: 4.55,
      color: "#87CEEB",
      description:
        "Base Stat lẻ sẽ được +1, sau đó cộng toàn bộ, chia 6 và làm tròn.\nBiến toàn bộ base stats thành kết quả đó.\nChỉ xảy ra 1 lần khi nhận. (100%, Magic).",
    },
    {
      id: "l16",
      name: "Creator's Cat Ring",
      weight: 4.55,
      color: "#FF69B4",
      description: "Nhận Creator's Favor 1-3 lần. (100%, Magic).",
    },
    {
      id: "l17",
      name: "The Dice of the Dead",
      weight: 4.55,
      color: "#A2D149",
      description:
        'Nhận Archetype "Gambler".\nMặc định thắng khi đối đầu với Gambler khác (yếu hơn auto-win khác). (100%, Magic).',
    },
    {
      id: "l18",
      name: "Brain of the Rot",
      weight: 4.55,
      color: "#FFD700",
      description:
        "Nhận các Power: Water Breathing, Rickrolling, Hand Washing, Mewing, The Goat, Blowing Leaves, Capybara, Night Vision, Gotta go Fast, Tick-tock, Fragrant, Ballet Dancing, Baldening, Cold Breeze, Hydrate, The Coast is Clear! (100%, Magic).",
    },
    {
      id: "l19",
      name: "Wooden Sword of the Mighty Goblin",
      weight: 4.55,
      color: "#87CEEB",
      description:
        "Đảo ngược tất cả base stat và dẫn dắt 1001 Goblin. (100%, Magic).",
    },
    {
      id: "l20",
      name: "Heart of the Shaggy Void",
      weight: 4.55,
      color: "#FF69B4",
      description:
        'Đi tìm 1 "Lover".\nBiến base stat cao nhất + thấp nhất thành 3.\n+1 All Stats. (100%, Magic).',
    },
    {
      id: "l21",
      name: "Spirit of the Wheel",
      weight: 4.55,
      color: "#A2D149",
      description:
        'Trận đầu tiên khiến 3 người ngẫu nhiên "Isekai".\n2 trận tiếp theo thua tự động.\n"Người ta đồn Linh hồn Vòng Quay không hứng thú chiến thắng". (100%, Magic).',
    },
    {
      id: "l22",
      name: "Pebbles of the Stoic Demon",
      weight: 4.55,
      color: "#FFD700",
      description:
        'Khi đối đầu với "Human": -1 all Stat sau combat. (100%, Magic).',
    },
  ],
};
