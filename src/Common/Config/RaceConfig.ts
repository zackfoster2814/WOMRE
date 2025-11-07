import { WheelStep } from "../Types/Types.js";

const getRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}
// Get all race data
const racedata = window.api ? await window.api.fetchAllRaces() : [];
export const raceWheel: WheelStep = {
  key: "race",
  title: "Race",
  sections: racedata.map((race: any) => {
    const raceData = race._dataValues || race.dataValues || race;
    
    return {
      id: raceData.id,
      name: raceData.name,
      weight: raceData.weight,
      color: getRandomColor(),
      trait: raceData.trait,
      subrace: raceData.subrace_wheel,
      note: raceData.note,
    };
  })
};

//get all race that have subrace wheel
const raceWheelBalancedata = window.api ? await window.api.fetchRacesWithSubraceWheel() : [];
export const raceWheelBalance:WheelStep ={
  key: "race",
  title: "Race",
  sections: raceWheelBalancedata.map((race: any) => {
    const raceData = race._dataValues || race.dataValues || race;
    return {
      id: raceData.id,
      name: raceData.name,
      weight: raceData.weight,
      color: getRandomColor(),
      trait: raceData.trait,
      subrace: raceData.subrace_wheel,
      note: raceData.note,
    };
  })
}
