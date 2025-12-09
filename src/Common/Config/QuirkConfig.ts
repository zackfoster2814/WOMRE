import { Section, WheelStep } from "../Types/Types.js";

const getRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

const quirk_data = window.api ? await window.api.fetchAllQuirks() : [];
console.log("Loaded quirk data:", quirk_data);
export const quirkCountOptions: Section[] = [
  {
    id: "qc1",
    name: "1 Quirk",
    weight: 54.9,
    color: "#FFBABA",
    description: "Nhận 1 Quirk",
  },
  {
    id: "qc2",
    name: "2 Quirk",
    weight: 25,
    color: "#FFCC99",
    description: "Nhận 2 Quirk",
  },
  {
    id: "qc3",
    name: "3 Quirk",
    weight: 15,
    color: "#FFD700",
    description: "Nhận 3 Quirk",
  },
  {
    id: "qc4",
    name: "4 Quirk",
    weight: 5,
    color: "#87CEEB",
    description: "Nhận 4 Quirk",
  },
  {
    id: "qc10",
    name: "10 Quirk",
    weight: 0.1,
    color: "#9370DB",
    description: "Nhận 10 Quirk",
  },
];

export const quirkList: Section[] = quirk_data.map((quirk: any) => {
  const QuirkData = quirk._dataValues || quirk.dataValues || quirk;
  return {
    id: QuirkData.id,
    name: QuirkData.name,
    type: QuirkData.type,
    color: getRandomColor(),
    is_unique: QuirkData.is_unique,
    effect: QuirkData.effect,
    usage_persentage: QuirkData.usage_persentage,
    note: QuirkData.note,
  };
});
console.log("Constructed quirkList:", quirkList);
