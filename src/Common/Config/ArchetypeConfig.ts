import { WheelStep } from "../Types/Types";

export const archetypeWheel: WheelStep = {
  key: "archetype",
  title: "Archetype",
  sections: [
    { id: "1", name: "Warrior of Sunlight", weight: 1.5, color: "#FFD700" },
    { id: "2", name: "Spy", weight: 2, color: "#AAAAAA" },
    { id: "3", name: "Knight of Gods", weight: 1.5, color: "#EEE8AA" },
    { id: "4", name: "Guardian of Demons", weight: 1.5, color: "#8B0000" },
    { id: "5", name: "NPC 💀", weight: 3.4, color: "#444444" },
    { id: "6", name: "Slayer", weight: 2.4, color: "#800000" },
    { id: "7", name: "Gigachad", weight: 2.4, color: "#00CED1" },
    { id: "8", name: "Dark Magician", weight: 1.3, color: "#4B0082" },
    { id: "9", name: "Bloodclan Berserker", weight: 1.3, color: "#B22222" },
    { id: "10", name: "Noble Swordsman", weight: 1.5, color: "#708090" },
    { id: "11", name: "Bard", weight: 2, color: "#DA70D6" },
    { id: "12", name: "Hero Grave Keeper", weight: 2, color: "#2E8B57" },
    { id: "13", name: "Dual Wielder", weight: 2, color: "#BC8F8F" },
    { id: "14", name: "Bookworm", weight: 2, color: "#8B4513" },
    { id: "15", name: "Gambler", weight: 2, color: "#FFDAB9" },
    { id: "16", name: "Pacifist", weight: 2, color: "#98FB98" },
    { id: "17", name: "Anti-Social", weight: 2, color: "#696969" },
    {
      id: "18",
      name: "Follower of the Two Fingers",
      weight: 1.8,
      color: "#D2B48C",
    },
    { id: "19", name: "Devotee", weight: 2, color: "#800080" },
    { id: "20", name: "Atheist", weight: 2, color: "#C0C0C0" },
    { id: "21", name: "X", weight: 0.3, color: "#000000" },
    { id: "22", name: "Glass Cannon", weight: 2, color: "#FF6347" },
    { id: "23", name: "Mid", weight: 2, color: "#4682B4" },
    { id: "24", name: "Time Traveller", weight: 2, color: "#00BFFF" },
    { id: "25", name: "Zealot", weight: 2, color: "#DC143C" },
    { id: "26", name: "Hand Fighter", weight: 2, color: "#A0522D" },
    { id: "27", name: "Lancer", weight: 2, color: "#B8860B" },
    { id: "28", name: "Assassins", weight: 2, color: "#2F4F4F" },
    { id: "29", name: "Conquerer", weight: 2, color: "#CD5C5C" },
    { id: "30", name: "Trickster", weight: 2, color: "#FF4500" },
    { id: "31", name: "Paladin", weight: 2, color: "#DAA520" },
    { id: "32", name: "Summoner", weight: 2, color: "#9370DB" },
    { id: "33", name: "Him", weight: 1, color: "#1E90FF" },
    { id: "34", name: "Wibu", weight: 1, color: "#FF69B4" },
    { id: "35", name: "Perfectionist", weight: 2, color: "#00FF7F" },
    { id: "36", name: "Hero of the Emirate", weight: 3.6, color: "#FFD700" },
    { id: "37", name: "Edgelord", weight: 2, color: "#483D8B" },
    { id: "38", name: "Fisher", weight: 3, color: "#4682B4" },
    { id: "39", name: "House's Noble", weight: 2, color: "#BDB76B" },
    { id: "40", name: "Farmer", weight: 3, color: "#228B22" },
    { id: "41", name: "Loser", weight: 2, color: "#A9A9A9" },
    { id: "42", name: "Blacksmith", weight: 3, color: "#708090" },
    { id: "43", name: "Hunter", weight: 3, color: "#6B8E23" },
    { id: "44", name: "Thief", weight: 3, color: "#8B0000" },
    { id: "45", name: "Gambler Bloodline", weight: 1.5, color: "#8B008B" },
    { id: "46", name: "Linh Mục", weight: 3, color: "#F5DEB3" },
    { id: "47", name: "Cha Xứ", weight: 3, color: "#EEE8AA" },
    { id: "48", name: "Quỷ Nhà Thờ", weight: 3, color: "#800000" },
  ],
};

export const farmerWheel: WheelStep = {
  key: "farmer",
  title: "Farmer Wheel",
  sections: [
    {
      id: "f1",
      name: "Normal Farmer",
      weight: 95,
      color: "#A2D149",
      description: "Bạn về quê nuôi cá và trồng thêm rau.",
    },
    {
      id: "f2",
      name: "Aura Farmer",
      weight: 5,
      color: "#FFD700",
      description: `Nhận +2 all stats. Nếu bạn vào chung kết mà không thua trận đấu nào, nhận thêm +1 all stats.
Khi "Aura Farmer" thua trận, mất sạch aura và loại bỏ hiệu ứng và Archetype "Farmer".`,
    },
  ],
};

export const tricksterWheel: WheelStep = {
  key: "trickster",
  title: "Trickster Wheel",
  sections: [
    {
      id: "t1",
      name: "Ace of Spades",
      weight: 10,
      color: "#000000",
      description:
        "Sau khi kết thúc tính điểm combat, điểm của bạn là điểm của đối phương và ngược lại.",
    },
    {
      id: "t2",
      name: "King of Diamonds",
      weight: 30,
      color: "#FFD700",
      description: "Nhận +1 all stats.",
    },
    {
      id: "t3",
      name: "Queen of Clubs",
      weight: 35,
      color: "#006400",
      description: "Nhận -1 all stats.",
    },
    {
      id: "t4",
      name: "Jack of 97",
      weight: 0.97,
      color: "#8B0000",
      description: "Nhận +97 all stats.",
    },
    {
      id: "t5",
      name: "Ten of Hearts",
      weight: 24.03,
      color: "#FF0000",
      description: "Không có gì xảy ra.",
    },
  ],
};

export const wibuWheel: WheelStep = {
  key: "wibu",
  title: "Wibu Wheel",
  sections: [
    {
      id: "w1",
      name: "Hoa Thơm Kiêu Hãnh",
      weight: 36,
      color: "#FF99CC",
      description:
        "Trong combat: Mỗi khi bạn chiến thắng 1 round, bạn sẽ xin lỗi đối thủ.",
    },
    {
      id: "w2",
      name: "JJK",
      weight: 16,
      color: "#6699FF",
      description: "Nhận 'Domain Expansion Wheel'.",
    },
    {
      id: "w3",
      name: "Jojo",
      weight: 12,
      color: "#9966FF",
      description: "Nhận 'Stands Wheel'.",
    },
    {
      id: "w4",
      name: "Naruto",
      weight: 12,
      color: "#FF6600",
      description: "Nhận 'Dojutsu Wheel'.",
    },
    {
      id: "w5",
      name: "One Piece",
      weight: 12,
      color: "#33CCFF",
      description: "Nhận 'Haki Wheel'.",
    },
    {
      id: "w6",
      name: "Bleach",
      weight: 12,
      color: "#CCCCCC",
      description: "Nhận 'Bankai Wheel'.",
    },
  ],
};

export const summonWheel: WheelStep = {
  key: "summon",
  title: "Summon Wheel",
  sections: [
    {
      id: "s1",
      name: "Chihuahua",
      weight: 10,
      color: "#CC9999",
      description: "Nhận -1 all stats.",
    },
    {
      id: "s2",
      name: "Mufasa",
      weight: 12,
      color: "#AA4444",
      description: "Nhận +2 Strength.",
    },
    {
      id: "s3",
      name: "Pack of Wolves",
      weight: 12,
      color: "#666666",
      description: "Nhận +2 Speed.",
    },
    {
      id: "s4",
      name: "Earth Golem",
      weight: 12,
      color: "#996633",
      description: "Nhận +2 Durability.",
    },
    {
      id: "s5",
      name: "Water Elemental",
      weight: 12,
      color: "#3399FF",
      description: "Nhận +2 IQ.",
    },
    {
      id: "s6",
      name: "Imp",
      weight: 12,
      color: "#9933CC",
      description: "Nhận +2 BIQ.",
    },
    {
      id: "s7",
      name: "Igris",
      weight: 12,
      color: "#000000",
      description: "Nhận +2 Martial Arts.",
    },
    {
      id: "s8",
      name: "Numby",
      weight: 12,
      color: "#FFCC00",
      description: "Trong Combat: Nhận +3 vào 1 chỉ số ngẫu nhiên.",
    },
    {
      id: "s9",
      name: "Wyvern's Egg",
      weight: 3,
      color: "#66CC99",
      description: "Ở trận chung kết tổng, nhận 2 điểm khởi đầu.",
    },
    {
      id: "s10",
      name: "Creator's Cat",
      weight: 3,
      color: "#FFFFFF",
      description: "Nhận 1 lần Char Dev: 'Creator\\'s Favor'.",
    },
  ],
};

export const instrumentWheel: WheelStep = {
  key: "instrument",
  title: "Instrument Weapon Wheel",
  sections: [
    {
      id: "i1",
      name: "Ukulele",
      weight: 31,
      color: "#FFCC99",
      description: "",
    },
    { id: "i2", name: "Drums", weight: 30, color: "#CC9966", description: "" },
    {
      id: "i3",
      name: "Saxophone",
      weight: 30,
      color: "#996633",
      description: "",
    },
    {
      id: "i4",
      name: "Instruments of the Sirens",
      weight: 3,
      color: "#FF6666",
      description:
        "Unique: Nếu có người đã roll ra trước đó, loại khỏi vòng quay.",
    },
    {
      id: "i5",
      name: "Sarastro Flute",
      weight: 3,
      color: "#6699FF",
      description: "",
    },
    {
      id: "i6",
      name: "Great Highland Bagpipe",
      weight: 3,
      color: "#33CC99",
      description: "",
    },
  ],
};

export const heroXWheel: WheelStep = {
  key: "X",
  title: "Hero X Wheel",
  sections: [
    {
      id: "h1",
      name: "Nice",
      weight: 25,
      color: "#FFD700",
      description: "Nhận +1 all stats.",
    },
    {
      id: "h2",
      name: "E-Soul",
      weight: 15,
      color: "#FF6600",
      description: "Nhận +8 Speed.",
    },
    {
      id: "h3",
      name: "Ahu",
      weight: 12,
      color: "#CC3333",
      description: "Bạn biết sủa.",
    },
    {
      id: "h4",
      name: "Lucky Cyan",
      weight: 11,
      color: "#33CCCC",
      description: 'Nhận Power "Super Lucky".',
    },
    {
      id: "h5",
      name: "Loli",
      weight: 10,
      color: "#FF99CC",
      description: "Nhận +3 IQ và +3 BIQ.",
    },
    {
      id: "h6",
      name: "The Johnnies",
      weight: 7,
      color: "#9966FF",
      description:
        "Khi đối đầu với người chơi có bất cứ Summon nào, bạn nhận thêm 2 điểm.",
    },
    {
      id: "h7",
      name: "Ghostblade",
      weight: 7,
      color: "#000000",
      description:
        'Nhận Power "Critical Strike". Mỗi khi thành công Crit, nhận 2 điểm thay vì 1.',
    },
    {
      id: "h8",
      name: "Dragon Boy",
      weight: 6,
      color: "#FF3300",
      description: "Nếu thua 3 round đầu tiên, thắng luôn combat đó.",
    },
    {
      id: "h9",
      name: "Queen",
      weight: 6,
      color: "#9900CC",
      description: "Trong Combat: Power cộng chỉ số đối phương bị vô hiệu hóa.",
    },
    {
      id: "h10",
      name: "X",
      weight: 1,
      color: "#FFFFFF",
      description:
        "Mặc định thắng tất cả các trận tới chung kết tổng 6-0 (Hiệu ứng tuyệt đối).",
    },
  ],
};

export const standsWheel: WheelStep = {
  key: "stands",
  title: "Stands Wheel",
  sections: [
    {
      id: "s1",
      name: "Hey Ya!",
      weight: 30,
      color: "#FFCC66",
      description: "Bạn được cổ vũ tinh thần 💀.",
    },
    {
      id: "s2",
      name: "Tusk Act II",
      weight: 30,
      color: "#66CCFF",
      description: "Nhận +2 Strength và +1 BIQ.",
    },
    {
      id: "s3",
      name: "The World",
      weight: 30,
      color: "#CC9966",
      description: "Trong Combat: thắng round Speed → +2 BIQ & +2 MA.",
    },
    {
      id: "s4",
      name: "King Crimson",
      weight: 6,
      color: "#FF6666",
      description:
        "Nhận +3 Martial Arts. Mỗi khi thắng 1 round, nhận +1 vào chỉ số round kế tiếp.",
    },
    {
      id: "s5",
      name: "Golden Experience Requiem",
      weight: 4,
      color: "#FFD700",
      description: `Trong Combat: 
1) Thua 1 round → đánh lại round đó (mỗi chỉ số max 1 lần). 
2) Đối phương kích hoạt Crit → quay lại Crit Wheel, max 2 lần/1 combat.`,
    },
  ],
};

export const hakiWheel: WheelStep = {
  key: "haki",
  title: "Haki Wheel",
  sections: [
    {
      id: "h1",
      name: "Observation",
      weight: 36,
      color: "#66CCFF",
      description: "Nhận +3 BIQ.",
    },
    {
      id: "h2",
      name: "Armament",
      weight: 36,
      color: "#CC9966",
      description: "Nhận +2 Durability và +1 Martial Arts.",
    },
    {
      id: "h3",
      name: "Observation + Armament",
      weight: 24,
      color: "#FFCC66",
      description: "Nhận +3 BIQ, +2 Durability và +1 Martial Arts.",
    },
    {
      id: "h4",
      name: "Observation + Armament + King Conqueror",
      weight: 4,
      color: "#FF6666",
      description:
        "Nhận +3 BIQ, +2 Durability và +1 Martial Arts. Đối thủ giảm 1 all stats.",
    },
  ],
};

export const domainExpansionWheel: WheelStep = {
  key: "domainExpansion",
  title: "Domain Expansion Wheel",
  sections: [
    {
      id: "d1",
      name: "Infinity",
      weight: 8,
      color: "#FF6666",
      description: `(1) Trong combat: Đưa Speed của đối phương cố định về 1. 
(2) Nếu IQ đối phương >= 14, bạn nhận +2 điểm.`,
    },
    {
      id: "d2",
      name: "Malevolent Shrine",
      weight: 12,
      color: "#FFCC66",
      description:
        "Nhận +1 Strength và +1 Martial Arts. Thắng round Strength & MA → +1 điểm.",
    },
    {
      id: "d3",
      name: "Idle Death Gamble",
      weight: 20,
      color: "#66CCFF",
      description: `(1) Nhận vòng quay may mắn trước combat: 8% +100 all stats, 22% +1 all stats, 70% không gì.
(2) Tất cả Power của người sở hữu Domain này vô hiệu.
(3) Không thể vô hiệu hóa.`,
    },
    {
      id: "d4",
      name: "Self-Embodiment of Perfection",
      weight: 20,
      color: "#CC99FF",
      description: "Trong Combat: thắng 3 round → thắng luôn combat.",
    },
    {
      id: "d5",
      name: "Coffin of the Iron Mountain",
      weight: 20,
      color: "#FF9966",
      description: "Nhận +3 Strength, +2 BIQ, +1 Martial Arts.",
    },
    {
      id: "d6",
      name: "Deadly Sentencing",
      weight: 20,
      color: "#999999",
      description: 'Thua trận → nhận "Sentence Wheel".',
    },
  ],
};

export const dojutsuWheel: WheelStep = {
  key: "dojutsu",
  title: "Dojutsu Wheel",
  sections: [
    {
      id: "dj1",
      name: "Jogan",
      weight: 15,
      color: "#FFCC66",
      description: "Mắt sáng, không bị cận.",
    },
    {
      id: "dj2",
      name: "Byakugan",
      weight: 25,
      color: "#66CCFF",
      description: "Nhận +1 BIQ và +1 Martial Arts.",
    },
    {
      id: "dj3",
      name: "Sharingan",
      weight: 30,
      color: "#FF6666",
      description:
        "Trong combat: nhận ngẫu nhiên 1 Power đối phương (hết combat biến mất).",
    },
    {
      id: "dj4",
      name: "Tenseigan",
      weight: 15,
      color: "#CC99FF",
      description: "Nhận +3 Strength & +2 Speed. Biến mất khi vào nhánh thua.",
    },
    {
      id: "dj5",
      name: "Rinnegan",
      weight: 10,
      color: "#9999FF",
      description: "Thắng PvP → +1 all stats, Thua PvP → -1 all stats.",
    },
    {
      id: "dj6",
      name: "Rinne Sharingan",
      weight: 5,
      color: "#FF3333",
      description: "-1 all stats, vô hiệu hóa tất cả Power đối phương.",
    },
  ],
};

export const vampireTasteWheel: WheelStep = {
  key: "vampireTaste",
  title: "Khẩu Vị Độc Đáo của Vampire",
  sections: [
    { id: "v1", name: "Tỏi", weight: 15, color: "#FFCC66", description: "" },
    { id: "v2", name: "Rau má", weight: 36, color: "#66CC66", description: "" },
    { id: "v3", name: "Đậu hũ", weight: 15, color: "#FF9966", description: "" },
    { id: "v4", name: "Trứng", weight: 15, color: "#FFFF66", description: "" },
    {
      id: "v5",
      name: "Bắp Cải",
      weight: 15,
      color: "#66FF99",
      description: "",
    },
    {
      id: "v6",
      name: "Salad Rau má Bắp Cải trộn...",
      weight: 4,
      color: "#CCFF66",
      description: "Trộn nhiều nguyên liệu theo mô tả.",
    },
  ],
};

export const sentenceWheel: WheelStep = {
  key: "sentence",
  title: "Sentence Wheel",
  sections: [
    {
      id: "s1",
      name: "Bạn thắng combat",
      weight: 50,
      color: "#66CCFF",
      description: "Điểm = chỉ số thấp nhất của bạn",
    },
    {
      id: "s2",
      name: "Bạn thua combat",
      weight: 50,
      color: "#FF6666",
      description: "Điểm = chỉ số cao nhất của đối phương * 2",
    },
  ],
};

export const bankaiWheel: WheelStep = {
  key: "bankai",
  title: "Bankai Wheel",
  sections: [
    {
      id: "b1",
      name: "Shinuchi (Bankai)",
      weight: 15,
      color: "#FF6666",
      description: "Trong Combat: vô hiệu hóa 2 Power ngẫu nhiên đối thủ.",
    },
    {
      id: "b2",
      name: "Zanka no Tachi (Bankai)",
      weight: 25,
      color: "#FFCC66",
      description: "Nhận +4 BIQ.",
    },
    {
      id: "b3",
      name: "Daiguren Hyorinmaru (Bankai)",
      weight: 25,
      color: "#66CCFF",
      description: "Nhận +4 Martial Arts.",
    },
    {
      id: "b4",
      name: "Katen Kyokotsu: Karamatsu Shinju (Bankai)",
      weight: 25,
      color: "#CC99FF",
      description: "Trong Combat: đối thủ nhận -4 Durability.",
    },
    {
      id: "b5",
      name: "Gangaku Kairo (Bankai)",
      weight: 10,
      color: "#9999FF",
      description:
        "Nếu số round thua > số round thắng trong combat, nhận thêm 2 điểm combat đó.",
    },
  ],
};

export const archetypeExtraWheels: Record<string, WheelStep> = {
  Farmer: farmerWheel,
  Trickster: tricksterWheel,
  Wibu: wibuWheel,
  Summoner: summonWheel,
  Instrument: instrumentWheel,
  HeroX: heroXWheel,
  Stands: standsWheel,
  Haki: hakiWheel,
  DomainExpansion: domainExpansionWheel,
  Dojutsu: dojutsuWheel,
  VampireTaste: vampireTasteWheel,
  Sentence: sentenceWheel,
  Bankai: bankaiWheel,
};
