import { WheelStep } from "../Types/Types";

export const raceWheel: WheelStep = {
  key: "race",
  title: "Race",
  sections: [
    {
      id: "01",
      name: "Goblin",
      weight: 6.5,
      color: "#7A1F1F",
      description: "Quay Goblin Horde",
    },
    {
      id: "02",
      name: "Gnome",
      weight: 6.5,
      color: "#B47D35",
      description: "Không có 💀",
    },
    {
      id: "03",
      name: "Human",
      weight: 6.5,
      color: "#C2B678",
      description: "Quay Skin Color",
    },
    {
      id: "04",
      name: "Dwarf",
      weight: 6.5,
      color: "#3D6B3D",
      description: "Quay Dwarf's Type",
    },
    {
      id: "05",
      name: "Skeleton",
      weight: 5,
      color: "#AAAAAA",
      description: "Quay Bone Lineage",
      effect: "Ở trong nhánh thua, nhận +4 Durability",
    },
    {
      id: "06",
      name: "Troll",
      weight: 5,
      color: "#4F772D",
      description: "Quay Troll's Type",
    },
    {
      id: "07",
      name: "Orc",
      weight: 5,
      color: "#38761D",
      description: "",
      effect:
        "Nhận +1 vào chỉ số thấp nhất khi thắng và -2 vào chỉ số cao nhất khi thua.",
    },
    {
      id: "08",
      name: "Dryad",
      weight: 5,
      color: "#228B22",
      description: "",
      effect:
        "Ở nhánh thắng. nhận +1 Durability sau mỗi trận.\nỞ nhánh thua, nhận -1 Durability sau mỗi trận.",
    },
    {
      id: "09",
      name: "Elf",
      weight: 6,
      color: "#2F7EBB",
      description: "Quay Elf's Type",
    },
    {
      id: "10",
      name: "Spirit",
      weight: 5,
      color: "#7F7FFF",
      description: "",
      effect:
        "Khi có bằng hoặc hơn 13 Spirit trong mùa, tất cả Spirit nhận +1 all stats. (Hiệu ứng này vẫn có hiệu lực ngay cả khi các spirit đó chết đi.)",
    },
    {
      id: "11",
      name: "Uma",
      weight: 6,
      color: "#CC66CC",
      description: "Quay 2 Uma Parents",
      effect:
        'Người chơi thuộc về House "Tracen Academy" và không có vòng quay House.',
    },
    {
      id: "12",
      name: "Werebeast",
      weight: 5,
      color: "#8B4513",
      description: "Quay Beast's Type",
    },
    {
      id: "13",
      name: "Vampire",
      weight: 5,
      color: "#660000",
      description: "Quay Body Count",
      effect: '36% nhận vòng quay "Khẩu Vị Độc Đáo"',
    },
    {
      id: "14",
      name: "Giant",
      weight: 5,
      color: "#999933",
      description: "",
      effect:
        "Nhận +5 IQ nếu sau vòng quay base stats IQ > Strength. (Và -5 Strength)\nNhận +5 Strength nếu sau vòng quay base stats Strength > IQ. (Và -5 IQ)\nNếu cả hai bằng nhau sau vòng quay base stats, nhận +3 Strength và IQ.",
    },
    {
      id: "15",
      name: "Dragon",
      weight: 5,
      color: "#990000",
      description: "Quay Dragon's Type",
    },
    {
      id: "16",
      name: "Angel",
      weight: 4,
      color: "#FFD700",
      description: "Quay Angel Rank",
      effect:
        'Nhận Archetype "Pacifist" từ đầu (sẽ nhận thêm một Archetype nữa)',
    },
    {
      id: "17",
      name: "Demi-God",
      weight: 3.5,
      color: "#FF8C00",
      description: "Quay God's Gifts",
      effect:
        "Nhận +1 all stats khi đối đầu với Human và -1 all stats khi đối đầu với God.",
    },
    {
      id: "18",
      name: "Primordial Being",
      weight: 3.5,
      color: "#8A2BE2",
      description: "Quay Elemental Wheel",
    },
    {
      id: "19",
      name: "Demon",
      weight: 3,
      color: "#8B0000",
      description: "Quay Sins Wheel",
    },
    {
      id: "20",
      name: "God",
      weight: 3,
      color: "#FFFFFF",
      description: "Quay Which God? (12)",
    },
  ],
};

export const raceConfig: Record<
  string,
  { subrace?: string; trait?: string; weight: number }
> = {
  Goblin: { subrace: "Goblin Horde", trait: "Không có 💀", weight: 6.5 },
  Gnome: { trait: "Không có 💀", weight: 6.5 },
  Human: { subrace: "Skin Color", trait: "Nhận 2 Char Dev", weight: 6.5 },
  Dwarf: { subrace: "Dwarf's Type", trait: "Không có 💀", weight: 6.5 },
  Skeleton: {
    subrace: "Bone Lineage",
    trait: "Ở trong nhánh thua, nhận +4 Durability.",
    weight: 5,
  },
  Troll: { subrace: "Troll's Type", trait: "Không có 💀", weight: 5 },
  Orc: {
    trait:
      "Nhận +1 vào chỉ số thấp nhất khi thắng và -2 vào chỉ số cao nhất khi thua.",
    weight: 5,
  },
  Dryad: {
    trait:
      "Ở nhánh thắng, nhận +1 Durability sau mỗi trận.\nỞ nhánh thua, nhận -1 Durability sau mỗi trận.",
    weight: 5,
  },
  Elf: { subrace: "Elf's Type", trait: "Không có 💀", weight: 6 },
  Spirit: {
    trait:
      "Khi có >=13 Spirit trong mùa, tất cả Spirit nhận +1 all stats (hiệu ứng tồn tại kể cả khi Spirit chết).",
    weight: 5,
  },
  Uma: {
    subrace: "Uma Parents",
    trait: "Thuộc House Tracen Academy, không có vòng quay House.",
    weight: 6,
  },
  Werebeast: { subrace: "Beast's Type", trait: "Không có 💀", weight: 5 },
  Vampire: {
    subrace: "Body Count",
    trait: "36% nhận vòng quay 'Khẩu Vị Độc Đáo'",
    weight: 5,
  },
  Giant: {
    trait:
      "Nhận +5 IQ nếu IQ>Strength (và -5 Strength).\nNhận +5 Strength nếu Strength>IQ (và -5 IQ).\nNếu bằng nhau thì nhận +3 Strength và +3 IQ.",
    weight: 5,
  },
  Dragon: { subrace: "Dragon's Type", trait: "Không có 💀", weight: 5 },
  Angel: {
    subrace: "Angel Rank",
    trait: "Nhận Archetype 'Pacifist' từ đầu (sẽ nhận thêm một Archetype nữa).",
    weight: 4,
  },
  DemiGod: {
    subrace: "God's Gifts",
    trait: "Nhận +1 all stats khi đối đầu Human, -1 all stats khi đối đầu God.",
    weight: 3.5,
  },
  Primordial: { subrace: "Elemental Wheel", trait: "Không có 💀", weight: 3.5 },
  Demon: { subrace: "Sins Wheel", trait: "Không có 💀", weight: 3 },
  God: { subrace: "Which God?", trait: "Không có 💀", weight: 3 },
};

export const raceWheelBalance: WheelStep = {
  key: "race",
  title: "Race",
  sections: [
    {
      id: "01",
      name: "Goblin",
      weight: 10.5,
      color: "#7A1F1F",
      description: "",
    },
    {
      id: "02",
      name: "Gnome",
      weight: 10.5,
      color: "#B47D35",
      description: "",
    },
    {
      id: "03",
      name: "Human",
      weight: 10.5,
      color: "#C2B678",
      description: "",
    },
    {
      id: "04",
      name: "Dwarf",
      weight: 10.5,
      color: "#3D6B3D",
      description: "",
    },
    {
      id: "05",
      name: "Skeleton",
      weight: 10,
      color: "#AAAAAA",
      description: "",
    },
    {
      id: "06",
      name: "Troll",
      weight: 10,
      color: "#4F772D",
      description: "",
    },
    {
      id: "07",
      name: "Orc",
      weight: 10,
      color: "#38761D",
      description: "",
    },
    {
      id: "08",
      name: "Dryad",
      weight: 10,
      color: "#228B22",
      description: "",
    },
    {
      id: "09",
      name: "Elf",
      weight: 10,
      color: "#2F7EBB",
      description: "",
    },
    {
      id: "10",
      name: "Spirit",
      weight: 10,
      color: "#7F7FFF",
      description: "",
    },
    {
      id: "11",
      name: "Uma",
      weight: 10,
      color: "#CC66CC",
      description: "",
    },
    {
      id: "12",
      name: "Werebeast",
      weight: 10,
      color: "#8B4513",
      description: "",
    },
    {
      id: "13",
      name: "Vampire",
      weight: 10,
      color: "#660000",
      description: "",
    },
    {
      id: "14",
      name: "Giant",
      weight: 10,
      color: "#999933",
      description: "",
    },
    {
      id: "15",
      name: "Dragon",
      weight: 10,
      color: "#990000",
      description: "",
    },
    {
      id: "16",
      name: "Angel",
      weight: 10,
      color: "#FFD700",
      description: "",
    },
    {
      id: "17",
      name: "Demi-God",
      weight: 10.5,
      color: "#FF8C00",
      description: "",
    },
    {
      id: "18",
      name: "Primordial Being",
      weight: 10.5,
      color: "#8A2BE2",
      description: "",
    },
    {
      id: "19",
      name: "Demon",
      weight: 10,
      color: "#8B0000",
      description: "",
    },
    {
      id: "20",
      name: "God",
      weight: 10,
      color: "#FFFFFF",
      description: "",
    },
  ],
};
