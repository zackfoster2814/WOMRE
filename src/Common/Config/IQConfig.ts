// IQConfig.ts
import { WheelStep } from "@/Common/Types/Types";
import { COLOR_PALETTE } from "../Constants/ConstantsConfig";

// Dữ liệu IQ theo race
const IQ_DATA: Record<string, number[]> = {
  Goblin: [15, 15, 10, 10, 20, 15, 5, 5, 3, 2],
  Gnome: [10, 10, 5, 5, 15, 25, 15, 5, 5, 5],
  Human: [15, 5, 5, 5, 15, 15, 15, 12, 8, 5],
  Dwarf: [15, 10, 10, 5, 20, 12, 12, 8, 5, 3],
  Skeleton: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // cố định là 1
  Troll: [15, 15, 15, 5, 25, 10, 5, 5, 3, 2],
  Orc: [15, 15, 15, 5, 25, 10, 5, 5, 3, 2],
  Dryad: [30, 5, 5, 5, 20, 5, 5, 5, 5, 15],
  Elf: [10, 5, 5, 5, 15, 25, 12, 10, 8, 5],
  Spirit: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  Uma: [5, 10, 15, 10, 25, 15, 5, 5, 5, 5],
  Werebeast: [10, 10, 5, 10, 20, 20, 10, 5, 5, 5],
  Vampire: [5, 5, 5, 15, 25, 20, 15, 5, 3, 2],
  Giant: [10, 10, 5, 5, 10, 15, 25, 10, 5, 5],
  Dragon: [15, 5, 5, 5, 15, 20, 5, 10, 15, 5],
  Angel: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  "Demi-God": [25, 5, 5, 5, 10, 15, 15, 5, 5, 10],
  "Primordial Being": [15, 5, 5, 15, 5, 15, 15, 5, 5, 15],
  Demon: [20, 5, 5, 5, 20, 10, 5, 5, 5, 20],
  God: [20, 5, 5, 5, 5, 5, 30, 5, 5, 15],
};

// Tạo wheel dựa trên race
export const getIQWheel = (race: string): WheelStep => {
  const values = IQ_DATA[race] || Array(10).fill(10);

  return {
    key: "iq",
    title: "IQ",
    sections: values.map((val, idx) => ({
      id: `iq${idx + 1}`,
      name: `${idx + 1}`,
      weight: val,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
    })),
  };
};
