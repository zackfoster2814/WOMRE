import { get } from "lodash";
import { Section } from "../Types/Types.js";

const getRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

// Fetch all subraces and races
const subrace_data = window.api ? await window.api.fetchAllSubraces() : [];
const race_data = window.api ? await window.api.fetchAllRaces() : [];

// Build race_id to race_name map
const raceIdToName: Record<number, string> = {};
race_data.forEach((race: any) => {
  const data = race._dataValues || race.dataValues || race;
  raceIdToName[data.id] = data.name;
});

// Group subraces by race name
export const subraceMap: Record<string, Section[]> = {};

subrace_data.forEach((subrace: any) => {
  const SubraceData = subrace._dataValues || subrace.dataValues || subrace;
  const raceName = raceIdToName[SubraceData.race_id];

  if (!raceName) return;

  if (!subraceMap[raceName]) {
    subraceMap[raceName] = [];
  }

  subraceMap[raceName].push({
    id: SubraceData.id,
    race_id: SubraceData.race_id,
    name: SubraceData.name,
    trait: SubraceData.trait,
    weight: SubraceData.weight,
    color: getRandomColor(),
  });
});

export async function getSubraceByRaceId(race_id: number): Promise<Section | null> {
  const subrace_data_by_id = window.api ? await window.api.fetchSubraceById(race_id) : [];
  
  if (!subrace_data_by_id) {
    return null;
  }
  
  return subrace_data_by_id.map((data: any) => {
    const SubraceData = data.dataValues;
    return {
      id: SubraceData.id,
      name: SubraceData.name,
      trait: SubraceData.trait,
      weight: SubraceData.weight,
      color: getRandomColor(),
    };
  });
}