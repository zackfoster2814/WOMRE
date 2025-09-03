
  import { COLOR_PALETTE } from "../Constants/ConstantsConfig.tsx";
import { WheelStep } from "../Types/types.ts";

  // Dữ liệu Martial Arts theo race
  const MARTIAL_ARTS_DATA: Record<string, number[]> = {
    Goblin: [15, 15, 15, 10, 10, 10, 10, 5, 5, 5],
    Gnome: [20, 20, 15, 15, 10, 5, 5, 5, 3, 2],
    Human: [15, 5, 5, 5, 20, 10, 15, 5, 5, 15],
    Dwarf: [12, 12, 12, 4, 4, 12, 24, 10, 5, 5],
    Skeleton: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Bone Lineage
    Troll: [12, 12, 12, 4, 4, 12, 24, 10, 5, 5],
    Orc: [10, 5, 5, 15, 10, 20, 15, 10, 5, 5],
    Dryad: [55, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    Elf: [10, 5, 15, 5, 15, 15, 15, 8, 7, 5],
    Spirit: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
    Uma: [55, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    Werebeast: [15, 5, 5, 15, 15, 10, 10, 15, 5, 5],
    Vampire: [15, 5, 5, 15, 15, 10, 10, 15, 5, 5],
    Giant: [40, 5, 5, 5, 5, 5, 20, 5, 5, 5],
    Dragon: [20, 5, 5, 5, 20, 15, 15, 5, 5, 5],
    Angel: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
    "Demi-God": [20, 5, 5, 5, 10, 15, 5, 15, 5, 15],
    "Primordial Being": [30, 5, 5, 5, 20, 5, 5, 5, 5, 15],
    Demon: [25, 5, 5, 5, 5, 25, 5, 5, 5, 15],
    God: [20, 5, 5, 5, 25, 5, 5, 5, 5, 20],
  };

  export const getMartialArtsWheel = (race: string): WheelStep => {
    const values = MARTIAL_ARTS_DATA[race] || Array(10).fill(10);

    return {
      key: "martialArts",
      title: "Martial Arts",
      sections: values.map((val, idx) => ({
        id: `mA${idx + 1}`,
        name: `${idx + 1}`,
        weight: val,
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      })),
    };
  };
