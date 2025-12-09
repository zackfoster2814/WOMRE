import fireAndBlood from "@/assets/audio/FireAndBlood.mp3";
import winterIsComing from "@/assets/audio/WinterInComing.mp3";
import hearMeRoar from "@/assets/audio/HearMeRoar.mp3";
import oursIsTheFury from "@/assets/audio/OursIsTheFury.mp3";
import { useRef } from "react";
import { WheelStep } from "../Types/Types.js";

const getRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}
const housedata = window.api ? await window.api.fetchAllHouses() : [];
export const houseWheel: WheelStep = {
  key: "house",
  title: "House",
  sections: housedata.map((house: any) => {
    const houseData = house._dataValues || house.dataValues || house;
    return {
      id: houseData.id,
      name: houseData.name,
      description: houseData.description,
      effect: houseData.effect,
      note: houseData.note,
      weight: houseData.weight || 1,
      quest: houseData.quest,
      color: getRandomColor(),
    };
  }
  ),
};

export const useHouseAudios = () => {
  const audioRefs: Record<string, React.RefObject<HTMLAudioElement | null>> = {
    "House Targaryen": useRef<HTMLAudioElement | null>(null),
    "House Stark": useRef<HTMLAudioElement | null>(null),
    "House Lannister": useRef<HTMLAudioElement | null>(null),
    "House Baratheon": useRef<HTMLAudioElement | null>(null),
    "House Marais": useRef<HTMLAudioElement | null>(null),
    "House Caria": useRef<HTMLAudioElement | null>(null),
    "House Hoslow": useRef<HTMLAudioElement | null>(null),
    "Golden Order": useRef<HTMLAudioElement | null>(null),
    "Ashina Clan": useRef<HTMLAudioElement | null>(null),
    "Beast Clan": useRef<HTMLAudioElement | null>(null),
    "Coven Council": useRef<HTMLAudioElement | null>(null),
    "Dark Brotherhood": useRef<HTMLAudioElement | null>(null),
    "College of Winterhold": useRef<HTMLAudioElement | null>(null),
    "Dessendre Family": useRef<HTMLAudioElement | null>(null),
    "Painted World of Ariandel": useRef<HTMLAudioElement | null>(null),
    // "Tracen Academy": useRef<HTMLAudioElement | null>(null),
    "Roundtable Hold": useRef<HTMLAudioElement | null>(null),
  };

  const audioSources: Record<string, string> = {
    "House Targaryen": fireAndBlood,
    "House Stark": winterIsComing,
    "House Lannister": hearMeRoar,
    "House Baratheon": oursIsTheFury,
    "House Marais": oursIsTheFury,
    "House Caria": oursIsTheFury,
    "House Hoslow": oursIsTheFury,
    "Golden Order": oursIsTheFury,
    "Ashina Clan": oursIsTheFury,
    "Beast Clan": oursIsTheFury,
    "Coven Council": oursIsTheFury,
    "Dark Brotherhood": oursIsTheFury,
    "College of Winterhold": oursIsTheFury,
    "Dessendre Family": oursIsTheFury,
    "Painted World of Ariandel": oursIsTheFury,
    // "Tracen Academy": oursIsTheFury,
    "Roundtable Hold": oursIsTheFury,
  };

  return { audioRefs, audioSources };
};
