// DurabilityConfig.ts
import { WheelStep } from "@/Common/Types/Types";
import { COLOR_PALETTE } from "../Constants/ConstantsConfig.tsx";

// Dữ liệu Durability theo race
const DURABILITY_DATA: Record<string, number[]> = {
  Goblin: [10, 10, 15, 20, 15, 15, 10, 2, 2, 1],
  Gnome: [20, 10, 10, 10, 25, 10, 7, 3, 3, 2],
  Human: [15, 7, 8, 9, 16, 16, 16, 8, 3, 2],
  Dwarf: [5, 5, 5, 5, 15, 20, 20, 10, 8, 7],
  Skeleton: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10], // placeholder
  Troll: [6, 7, 8, 9, 10, 35, 10, 5, 5, 5],
  Orc: [5, 5, 7, 7, 13, 23, 20, 10, 5, 5],
  Dryad: [40, 5, 5, 5, 5, 5, 5, 5, 5, 20],
  Elf: [10, 10, 5, 5, 10, 25, 20, 5, 5, 5],
  Spirit: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  Uma: [10, 7, 7, 12, 16, 16, 12, 12, 4, 4],
  Werebeast: [15, 5, 5, 5, 30, 5, 15, 10, 5, 5],
  Vampire: [10, 5, 5, 5, 15, 20, 20, 5, 5, 10],
  Giant: [5, 5, 5, 5, 5, 25, 25, 5, 5, 15],
  Dragon: [5, 5, 5, 10, 5, 25, 15, 10, 10, 10],
  Angel: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  "Demi-God": [15, 10, 5, 5, 5, 25, 15, 5, 5, 10],
  "Primordial Being": [15, 5, 5, 10, 5, 25, 10, 10, 10, 5],
  Demon: [15, 5, 5, 5, 15, 15, 15, 5, 5, 15],
  God: [20, 5, 5, 5, 5, 5, 30, 5, 5, 15],
};

// Tạo wheel dựa trên race
export const getDurabilityWheel = (race: string): WheelStep => {
  const values = DURABILITY_DATA[race] || Array(10).fill(10);

  return {
    key: "durability",
    title: "Durability",
    sections: values.map((val, idx) => ({
      id: `d${idx + 1}`,
      name: `${idx + 1}`,
      weight: val,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
    })),
  };
};
