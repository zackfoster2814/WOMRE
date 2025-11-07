import { WheelStep } from "../Types/Types";

const getRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}
//get all archetype data
const archetypedata = window.api ? await window.api.fetchAllArchetypes() : [];
export const archetypeWheel: WheelStep = {
  key: "archetype",
  title: "Archetype",
  sections: archetypedata.map((archetype: any) => {
    const archetypeData = archetype._dataValues || archetype.dataValues || archetype;
    return {
      id: archetypeData.id,
      name: archetypeData.name,
      effect: archetypeData.effect,
      color: getRandomColor(),
      weight: archetypeData.weight,
      note: archetypeData.note,
    };
  })
};
// Summon wheel placeholder - to be populated dynamically if needed
export const summonWheel: WheelStep = {
  key: "summon",
  title: "Summon",
  sections: []
};

// Instrument wheel placeholder - to be populated dynamically if needed
export const instrumentWheel: WheelStep = {
  key: "instrument",
  title: "Instrument",
  sections: []
};
