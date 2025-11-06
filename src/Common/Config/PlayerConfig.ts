import { WheelStep } from "../Types/Types";

const getRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}
const player_data = await window.api.fetchAllPlayers();
export const playerWheel: WheelStep = {
  key: "player",
  title: "Player",
  sections: player_data.map((player: any) => {
    const playerData = player._dataValues || player.dataValues || player;
    return {
      id: playerData.id,
      stt: playerData.stt,
      name: playerData.name,
      note: playerData.note,
      color: getRandomColor(),
      race_id: playerData.race_id,
      sub_race_id: playerData.sub_race_id,
      house_id: playerData.house_id,
      base_strength: playerData.base_strength,
      base_speed: playerData.base_speed,
      base_iq: playerData.base_iq,
      base_biq: playerData.base_biq,
      base_durability: playerData.base_durability,
      base_martital_arts: playerData.base_martital_arts,
      current_strength: playerData.current_strength,
      current_speed: playerData.current_speed,
      current_iq: playerData.current_iq,
      current_biq: playerData.current_biq,
      current_durability: playerData.current_durability,
      current_martital_arts: playerData.current_martital_arts,
      pvp_reward: playerData.pvp_reward,
      tailored_reward: playerData.tailored_reward,
      tournament_status: playerData.tournament_status,
    };
  }
  ),
};
