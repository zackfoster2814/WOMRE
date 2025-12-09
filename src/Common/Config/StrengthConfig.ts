// StrengthConfig.ts
import { WheelStep } from "@/Common/Types/Types.js";
import { COLOR_PALETTE } from "../Constants/ConstantsConfig.js";

// Dữ liệu strength theo race
const STRENGTH_DATA: Record<string, number[]> = {
  Goblin: [15, 15, 15, 18, 20, 5, 5, 3, 2, 2],
  Gnome: [20, 10, 10, 13, 22, 10, 5, 5, 3, 2],
  Human: [15, 15, 10, 10, 20, 10, 5, 5, 5, 5],
  Dwarf: [5, 7, 8, 7, 13, 20, 15, 10, 9, 6],
  Skeleton: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  Troll: [10, 5, 10, 5, 20, 20, 15, 5, 5, 5],
  Orc: [2, 3, 4, 5, 6, 35, 20, 10, 8, 7],
  Dryad: [40, 5, 5, 5, 5, 5, 5, 5, 5, 20],
  Elf: [15, 10, 5, 10, 20, 15, 10, 5, 5, 5],
  Spirit: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  Uma: [5, 7, 7, 7, 20, 25, 20, 3, 3, 3],
  Werebeast: [10, 5, 5, 15, 15, 15, 15, 10, 5, 5],
  Vampire: [20, 5, 5, 5, 5, 20, 20, 5, 5, 10],
  Giant: [5, 5, 5, 5, 5, 30, 30, 5, 5, 5],
  Dragon: [12, 3, 3, 3, 3, 25, 31, 5, 5, 10],
  Angel: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  "Demi-God": [20, 5, 5, 5, 10, 20, 5, 5, 5, 20],
  "Primordial Being": [15, 5, 5, 5, 5, 5, 35, 10, 5, 10],
  Demon: [20, 5, 5, 5, 5, 10, 10, 10, 15, 15],
  God: [20, 5, 5, 5, 5, 10, 10, 10, 15, 15],
};

// Dãy màu 10 điểm khác nhau

// Tạo wheel dựa trên race
export const getStrengthWheel = (race: string): WheelStep => {
  const values = STRENGTH_DATA[race] || Array(10).fill(10);
  return {
    key: "strength",
    title: "Strength",
    sections: values.map((val, idx) => ({
      id: `s${idx + 1}`,
      name: `${idx + 1}`,
      weight: val,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length], // mỗi điểm 1 màu khác nhau
    })),
  };
};
