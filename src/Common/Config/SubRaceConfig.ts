import { Section } from "../Types/Types.js";

const getRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}
const subrace_data = await window.api.fetchAllSubraces();
export const subraceMap: any = {
  key: "Subrace",
  title: "Subrace",
  sections: subrace_data.map((race: any) => {
    const SubraceData = race._dataValues || race.dataValues || race;
    
    return {
      id: SubraceData.id,
      race_id: SubraceData.race_id,
      name: SubraceData.name,
      trait: SubraceData.trait,
      weight: SubraceData.weight,
      color: getRandomColor(),
    };
  })
};

export async function getSubraceByRaceId(race_id: number): Promise<Section | null> {
  const subrace_data_by_id = await window.api.fetchSubraceById(race_id);
  if (subrace_data_by_id) {
    const SubraceData = subrace_data_by_id._dataValues || subrace_data_by_id.dataValues || subrace_data_by_id;
    return {
      id: SubraceData.id,
      name: SubraceData.name,
      trait: SubraceData.trait,
      weight: SubraceData.weight,
      color: getRandomColor(),
    };
  }
  return null;
}