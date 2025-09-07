// BattleIQConfig.ts
import { WheelStep } from "@/Common/Types/Types";
import { COLOR_PALETTE } from "../Constants/ConstantsConfig";

// Dữ liệu Battle IQ theo race
const BATTLE_IQ_DATA: Record<string, number[]> = {
  Goblin: [10, 10, 10, 15, 18, 15, 10, 5, 5, 2],
  Gnome: [15, 15, 15, 15, 10, 10, 10, 5, 3, 2],
  Human: [10, 5, 5, 5, 15, 15, 20, 10, 10, 5],
  Dwarf: [5, 5, 5, 10, 15, 20, 20, 10, 5, 5],
  Skeleton: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Bone Lineage
  Troll: [5, 5, 5, 10, 15, 20, 20, 10, 5, 5],
  Orc: [2, 3, 4, 5, 6, 35, 18, 12, 8, 7],
  Dryad: [20, 20, 20, 10, 5, 5, 5, 5, 5, 5],
  Elf: [20, 4, 4, 4, 4, 30, 15, 10, 5, 4],
  Spirit: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  Uma: [15, 15, 15, 10, 10, 10, 10, 5, 5, 5],
  Werebeast: [5, 5, 5, 15, 20, 20, 15, 5, 5, 5],
  Vampire: [5, 5, 5, 15, 20, 20, 15, 5, 5, 5],
  Giant: [15, 10, 10, 5, 15, 15, 5, 10, 10, 5],
  Dragon: [20, 10, 5, 5, 10, 20, 15, 5, 5, 5],
  Angel: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  "Demi-God": [25, 5, 5, 5, 5, 25, 5, 5, 5, 15],
  "Primordial Being": [15, 5, 5, 15, 15, 15, 15, 5, 5, 5],
  Demon: [20, 5, 5, 5, 5, 5, 35, 5, 5, 10],
  God: [25, 5, 5, 5, 5, 5, 20, 5, 5, 20],
};

export const getBattleIQWheel = (race: string): WheelStep => {
  const values = BATTLE_IQ_DATA[race] || Array(10).fill(10);
  return {
    key: "battleIQ",
    title: "Battle IQ",
    sections: values.map((val, idx) => ({
      id: `bIQ${idx + 1}`,
      name: `${idx + 1}`,
      weight: val,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
    })),
  };
};
