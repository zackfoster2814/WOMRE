import fireAndBlood from "@/assets/audio/FireAndBlood.mp3";
import winterIsComing from "@/assets/audio/WinterInComing.mp3";
import hearMeRoar from "@/assets/audio/HearMeRoar.mp3";
import oursIsTheFury from "@/assets/audio/OursIsTheFury.mp3";
import { useRef } from "react";
import { WheelStep } from "../Types/Types.ts";

export const houseWheel: WheelStep = {
  key: "house",
  title: "House Wheel",
  sections: [
    {
      id: "h1",
      name: "House Lannister",
      weight: 6.25,
      color: "#FFD700",
      description: "Hear Me Roar!",
      effect: "Nhận 2 Gear",
      quest:
        "Người nhà Lannister khi tới vòng 16 người sẽ nhận thêm 2 Gear và nhận thêm 1 Enchant lên Weapon hiện có.",
    },
    {
      id: "h2",
      name: "House Stark",
      weight: 6.25,
      color: "#708090",
      description: "'Winter is coming'.",
      effect: "Nhận 1 Dire Wolf",
      quest:
        "Người nhà Stark khi tới vòng 16, Nhận thêm 1 lần Bonus từ Dire Wolf của bạn.",
      extraWheel: "direWolf",
    },
    {
      id: "h3",
      name: "House Targaryen",
      weight: 6.25,
      color: "#DC143C",
      description: "Fire and Blood",
      effect:
        "Nhận 1 Dragon's Egg có tên, khi tới vòng 16, Dragon's Egg sẽ nở.",
      quest:
        "Người nhà Targaryen khi tới vòng 8 sẽ nhận Char Dev 'Lord of the Seven Kingdoms'.",
      extraWheel: "dragon",
    },
    {
      id: "h4",
      name: "House Baratheon",
      weight: 6.25,
      color: "#000000",
      description: "Ours Is The Fury.",
      effect: "Nhận +1 Str, +1 BIQ, +1 MA. Base Stat thấp nhất sẽ được +2.",
      quest:
        "Người nhà Baratheon khi tới vòng 16, Nhận +1 Spd, +1 IQ, +1 MA và Base Stat cao nhất sẽ được +2.",
    },
    {
      id: "h5",
      name: "House Marais",
      weight: 6.25,
      color: "#9370DB",
      description:
        "The family of executioners who presided over the Shaded Castle.",
      effect:
        "Nhận Archetype 'Slayer' lên 2 tộc. (Nói cách khác là nhận 2 lần Slayer)",
      quest:
        "Người nhà Marais khi tới vòng 16, Nhận 1 Unique Weapon và 1 Legacy Gear từ vòng quay hoặc người đã chết.",
      extraWheel: ["race", "race"],
    },
    {
      id: "h6",
      name: "House Caria",
      weight: 6.25,
      color: "#1E90FF",
      description: "A Moon Greatsword, bestowed by a Carian queen.",
      effect: "Nhận +1 IQ và 2 Power.",
      quest: "Người nhà Caria khi tới vòng 16, nhận 3 Power.",
    },
    {
      id: "h7",
      name: "House Hoslow",
      weight: 6.25,
      color: "#8B0000",
      description: "The tale of House Hoslow is told in blood.",
      effect: "(1). Nhận Archetype 'Dual Wielder' (2). Nhận trước 1 Whip",
      quest:
        "Người nhà Hoslow khi tới vòng 16, nhận 2 Enchant lên 2 Weapon, mỗi Weapon được 1. Nếu chỉ có 1 Weapon, nhận 2 Enchant lên Weapon đó. Nếu không có vũ khí, nhận 2 Weapon.",
    },
    {
      id: "h8",
      name: "Golden Order",
      weight: 6.25,
      color: "#FFD700",
      description:
        "The Golden Order is founded on the principle that Marika is the one true god.",
      effect: "(1). Nhận 1 Power. (2). Nhận 1 Great Rune.",
      quest:
        "Người của Golden Order khi tới vòng 16 nhận +1 vào 3 Stat bất kì và 1 Power.",
      extraWheel: "greatRune",
    },
    {
      id: "h9",
      name: "Ashina Clan",
      weight: 6.25,
      color: "#B22222",
      description: "It was a place where we, the Ashina people lived.",
      effect:
        "Nhận Uchigatana và bỏ qua vũ khí Normal. Nhận 1 Kiếm Phái Ashina.",
      quest:
        "Người của Ashina khi tới vòng 16 sẽ nhận tiếp 1 Kiếm Phái Ashina không trùng với cái đầu tiên.",
      extraWheel: "ashinaSwordStyle",
    },
    {
      id: "h10",
      name: "Beast Clan",
      weight: 6.25,
      color: "#556B2F",
      description: "Gangrenous bestial wretches.",
      effect:
        "Bắt đầu trận đấu, đối thủ bị vô hiệu hóa 1 Power tạm thời và -2 vào stat mà bạn cao nhất.",
      quest:
        "Người của Beast Clan khi tới vòng 16 sẽ Roll ngẫu nhiên 3 Player đã bị loại và 'gia tăng' Stat của mình theo Base Stat cao nhất của họ với tỉ lệ +2/+1/+1.",
    },
    {
      id: "h11",
      name: "Coven Council",
      weight: 6.25,
      color: "#4B0082",
      description: "The Coven's subversion seeks to tangle the land.",
      effect:
        "Nhận +2 IQ. Khi Player Coven bị loại, 1 Player ngẫu nhiên sẽ bị Re-spin lại 1 chỉ số.",
      quest:
        "Thành Viên Coven Council khi tới vòng 16 sẽ Re-Spin lại 1 stat ngẫu nhiên của toàn bộ 15 người cùng nhánh.",
    },
    {
      id: "h12",
      name: "Dark Brotherhood",
      weight: 6.25,
      color: "#2F4F4F",
      description: "You can't stop the Dark Brotherhood.",
      effect:
        "Nhận Quirk 'Lurker'. Nếu đã có sẽ nhận +2 Stat thấp nhất. Khi Dark Brotherhood thắng, nhận 1 Normal Gear.",
      quest:
        "Người của Dark Brotherhood khi tới vòng 16 sẽ loại bỏ toàn bộ Gear Normal, với mỗi Gear vứt đi, +2 vào Stat thấp nhất.",
    },
    {
      id: "h13",
      name: "College of Winterhold",
      weight: 6.25,
      color: "#4682B4",
      description: "Mage's College in Winterhold.",
      effect: "Nhận 1 Power và 2 Magic Gear.",
      quest:
        "Học Viên Winterhold khi tới vòng 16 sẽ nhận 2 Power và 3 Magic Gear.",
    },
    {
      id: "h14",
      name: "Dessendre Family",
      weight: 6.25,
      color: "#800080",
      description: "For those who come after. When one falls, we continue.",
      effect: "Nhận Power 'Artist'. 50% Clair, 50% Obscur.",
      quest:
        "Dessendre khi tới vòng 16 sẽ nhận Clair hoặc Obscur tùy cái còn thiếu.",
      extraWheel: "obscur",
    },
    {
      id: "h15",
      name: "Painted World of Ariandel",
      weight: 6.25,
      color: "#87CEFA",
      description: "The cold and gentle painted world of Ariandel.",
      effect:
        "Nhận 2 Round PvE: Sir Vilhelm & Sister Friede. Với mỗi trận thua PvE, nhận +1 Dura và +1 BIQ.",
      quest:
        "Khi tới vòng 16 sẽ lần nữa nhận 2 Round PvE: Darkeater Midir & Slave Knight Gael.",
    },
    {
      id: "h17",
      name: "Roundtable Hold",
      weight: 6.25,
      color: "#D2691E",
      description: "Tụ Nghĩa Đường.",
      effect:
        "(1). Khi thua và sắp bị loại, đánh lại combat đó với sheet Tarnished khác. (2). Bạn là Tarnished.",
      quest:
        "Tarnished khi tới vòng 16 sẽ nhận 1 Great Rune từ Golden Order. Ở Vòng 8 người sẽ không nhận trợ giúp nữa.",
      extraWheel: "greatRune",
    },
  ],
};

export const useHouseAudios = () => {
  const audioRefs: Record<string, React.RefObject<HTMLAudioElement | null>> = {
    "House Targaryen": useRef<HTMLAudioElement | null>(null),
    "House Stark": useRef<HTMLAudioElement | null>(null),
    "House Lannister": useRef<HTMLAudioElement | null>(null),
    "House Baratheon": useRef<HTMLAudioElement | null>(null),
    "House Marais": useRef<HTMLAudioElement | null>(null),
    "House Caria": useRef<HTMLAudioElement | null>(null),
    "House Hoslow": useRef<HTMLAudioElement | null>(null),
    "Golden Order": useRef<HTMLAudioElement | null>(null),
    "Ashina Clan": useRef<HTMLAudioElement | null>(null),
    "Beast Clan": useRef<HTMLAudioElement | null>(null),
    "Coven Council": useRef<HTMLAudioElement | null>(null),
    "Dark Brotherhood": useRef<HTMLAudioElement | null>(null),
    "College of Winterhold": useRef<HTMLAudioElement | null>(null),
    "Dessendre Family": useRef<HTMLAudioElement | null>(null),
    "Painted World of Ariandel": useRef<HTMLAudioElement | null>(null),
    // "Tracen Academy": useRef<HTMLAudioElement | null>(null),
    "Roundtable Hold": useRef<HTMLAudioElement | null>(null),
  };

  const audioSources: Record<string, string> = {
    "House Targaryen": fireAndBlood,
    "House Stark": winterIsComing,
    "House Lannister": hearMeRoar,
    "House Baratheon": oursIsTheFury,
    "House Marais": oursIsTheFury,
    "House Caria": oursIsTheFury,
    "House Hoslow": oursIsTheFury,
    "Golden Order": oursIsTheFury,
    "Ashina Clan": oursIsTheFury,
    "Beast Clan": oursIsTheFury,
    "Coven Council": oursIsTheFury,
    "Dark Brotherhood": oursIsTheFury,
    "College of Winterhold": oursIsTheFury,
    "Dessendre Family": oursIsTheFury,
    "Painted World of Ariandel": oursIsTheFury,
    // "Tracen Academy": oursIsTheFury,
    "Roundtable Hold": oursIsTheFury,
  };

  return { audioRefs, audioSources };
};
