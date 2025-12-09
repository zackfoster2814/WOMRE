import { WheelStep } from "../Types/Types.js";

const getRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}
const pve_data = window.api ? await window.api.fetchAllPves() : [];

export const pveWheel: WheelStep = {
  key: "pve",
  title: "PvE",
  sections: pve_data.map((pve:any) => {
    const Data = pve_data._dataValues || pve_data.dataValues || pve_data;
    return {
      id: Data.id,
      name: Data.name,
      color: getRandomColor(),
      strength: Data.strength,
      speed: Data.speed,
      iq: Data.iq,
      biq: Data.biq,
      durability: Data.durability,
      martial_arts: Data.martial_arts,
      power: Data.power,
      reward: Data.reward,
      pusnishment: Data.pusnishment,
      weight: Data.weight,
    };
  }),
};
