// SpeedConfig.ts
import { WheelStep } from "@/Common/Types/Types";
import { COLOR_PALETTE } from "../Constants/ConstantsConfig";

// Dữ liệu Speed theo race
const SPEED_DATA: Record<string, number[]> = {
  Goblin: [15, 15, 15, 15, 15, 10, 5, 5, 3, 2],
  Gnome: [15, 15, 15, 15, 15, 10, 5, 5, 3, 2],
  Human: [15, 10, 10, 10, 20, 15, 10, 5, 3, 2],
  Dwarf: [20, 15, 15, 15, 15, 5, 5, 5, 3, 2],
  Skeleton: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10], // placeholder
  Troll: [15, 10, 10, 10, 15, 20, 5, 5, 5, 5],
  Orc: [15, 15, 15, 15, 15, 15, 4, 2, 2, 2],
  Dryad: [55, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  Elf: [15, 5, 10, 5, 10, 25, 15, 5, 5, 5],
  Spirit: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  Uma: [3, 3, 12, 12, 18, 18, 16, 6, 7, 5],
  Werebeast: [10, 10, 5, 5, 20, 20, 10, 10, 5, 5],
  Vampire: [5, 5, 7, 7, 8, 18, 33, 7, 5, 5],
  Giant: [15, 15, 15, 15, 15, 15, 4, 2, 2, 2],
  Dragon: [15, 5, 5, 5, 15, 15, 15, 15, 5, 5],
  Angel: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  "Demi-God": [15, 5, 5, 5, 35, 10, 5, 5, 5, 10],
  "Primordial Being": [15, 5, 5, 5, 20, 20, 5, 5, 5, 15],
  Demon: [10, 4, 4, 4, 4, 35, 14, 11, 4, 10],
  God: [15, 2, 3, 4, 4, 4, 44, 4, 5, 15],
};

// Tạo wheel dựa trên race
export const getSpeedWheel = (race: string): WheelStep => {
  const values = SPEED_DATA[race] || Array(10).fill(10);
  return {
    key: "speed",
    title: "Speed",
    sections: values.map((val, idx) => ({
      id: `sp${idx + 1}`,
      name: `${idx + 1}`,
      weight: val,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
    })),
  };
};
