import { COLOR_PALETTE } from "../Constants/ConstantsConfig";
import { WheelStep } from "../Types/Types";

// Power theo hệ Martial Arts (5 hệ)
const POWER_CONFIG: Record<string, number[]> = {
  Goblin: [35, 30, 20, 10, 5],
  Gnome: [30, 30, 25, 10, 5],
  Human: [25, 25, 28, 15, 7],
  Dwarf: [30, 35, 20, 10, 5],
  Skeleton: [10, 10, 10, 10, 10],
  Troll: [30, 35, 20, 10, 5],
  Orc: [30, 35, 20, 10, 5],
  Dryad: [50, 5, 20, 5, 20],
  Elf: [10, 35, 25, 20, 10],
  Spirit: [20, 35, 30, 10, 5],
  Uma: [20, 25, 35, 15, 5],
  Werebeast: [20, 35, 25, 15, 5],
  Vampire: [20, 35, 25, 15, 5],
  Giant: [45, 5, 10, 5, 35],
  Dragon: [5, 15, 50, 20, 10],
  Angel: [15, 20, 30, 25, 10],
  "Demi-God": [20, 10, 35, 15, 20],
  "Primordial Being": [15, 5, 25, 35, 20],
  Demon: [20, 5, 15, 35, 25],
  God: [20, 5, 15, 35, 25],
};

export const powerCountWheel = (race: string): WheelStep => {
  const values = POWER_CONFIG[race] || Array(5).fill(10);
  return {
    key: "power-count",
    title: "Power count",
    sections: values.map((val, idx) => ({
      id: `pw${idx + 1}`,
      name: `${idx + 1}`,
      weight: val,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
      description: `Power level: ${val}`,
    })),
  };
};

const getRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}
const powerdata  = window.api ? await window.api.fetchAllPowers() : [];
export const PowerWheel: WheelStep = {
  key: "power",
  title: "Power",
  sections: powerdata.map((power: any) => {
    const Data = power._dataValues || power.dataValues || power;
    return {
      id: Data.id,
      name: Data.name,
      effect: Data.effect,
      color: getRandomColor(),
      note: Data.note,
      weight: Data.weight || 1,
    };
  })
};