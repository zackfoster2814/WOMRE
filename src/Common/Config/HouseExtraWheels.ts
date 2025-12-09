// HouseExtraWheels.ts
import { WheelStep ,Section} from "@/Common/Types/Types.js";

const getRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

export const starkWolfWheel: WheelStep = {
  key: "stark-direwolf",
  title: "Dire Wolf",
  sections: await getHouseExtra(1) || [],
};

export const targaryenDragonWheel: WheelStep = {
  key: "targaryen-dragon",
  title: "Dragon (Trứng chỉ nở ở vòng 16)",
  sections: await getHouseExtra(2) || [],
};

export const goldenOrderRuneWheel: WheelStep = {
  key: "golden-rune",
  title: "Great Rune",
  sections: await getHouseExtra(3) || [],
};

export const ashinaSwordWheel: WheelStep = {
  key: "ashina-sword",
  title: "Kiếm Phái Ashina",
  sections: await getHouseExtra(4) || [],
};

export const dessendreSkillWheel: WheelStep = {
  key: "dessendre-skill",
  title: "Clair Obscur",
  sections: await getHouseExtra(5) || [],
};

export async function getHouseExtra(id: number): Promise<Section[]> {
  const house_extra = window.api ? await window.api.fetchSubraceById(id) : [];
  
  if (!house_extra || house_extra.length === 0) {
    return [];
  }
  
  return house_extra.map((data: any) => ({
    id: data.dataValues.id,
    house_is: data.dataValues.house_is,
    name: data.dataValues.name,
    effect: data.dataValues.effect,
    weight: data.dataValues.weight,
    color: getRandomColor(),
    note: data.dataValues.note,
  }));
}