import { WheelStep } from "../Types/Types";

const getRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}
//get all char dev data
const chardevdata = await window.api.fetchAllCharacterDevelopments();
export const charDevWheel: WheelStep = {
  key: "character_development",
  title: "Character Development",
  sections: chardevdata.map((chardev: any) => {
    const charDevData = chardev._dataValues || chardev.dataValues || chardev;
    return {
      id: charDevData.id,
      name: charDevData.name,
      effect: charDevData.effect,
      weight: charDevData.weight,
      color: getRandomColor(),
      note: charDevData.note,
    };
  }