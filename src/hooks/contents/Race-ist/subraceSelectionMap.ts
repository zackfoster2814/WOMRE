import { useCallback } from "react";
import { WheelStep } from "@/Common/Types/Types";
import { raceConfig, raceWheel } from "@/Common/Config/RaceConfig";
import { subraceMap } from "@/Common/Config/SubRaceConfig";
import {
  uniqueVampireTrainWheel,
  vampireTasteWheel,
} from "@/Common/Config/ArchetypeExtraWheels";
import {
  getStatWheel,
  getRaceOrSubrace,
  STAT_WHEELS,
} from "@/utils/wheelUtils";
import { playerWheel } from "@/Common/Config/PlayerConfig";
import { houseWheel } from "@/Common/Config/HouseConfig";
import { archetypeWheel, summonWheel } from "@/Common/Config/ArchetypeConfig";

interface RaceHandlerParams {
  dispatch: React.Dispatch<any>;
  setCurrentWheel: (wheel: WheelStep) => void;
  setStatStep: (step: number) => void;
  characterState: any;
}

interface RaceHandlerResult {
  shouldContinue: boolean;
  nextWheel?: WheelStep;
  message?: string;
}

type RaceHandler = (params: RaceHandlerParams,rolledResult:any,resultName:any) => RaceHandlerResult;

export const subraceSelectionMap : Record<string,RaceHandler> = {

    Vampire:(params,rolledResult)=>{
    const {setCurrentWheel} = params;
    setCurrentWheel({
        ...uniqueVampireTrainWheel,
        key: "uniqueVampireTrain",
        title: "Unique Taste Train",
            });
    return {
        shouldContinue: false,
        nextWheel: undefined,
        message:"gay",
      }
    },

    "Goblin|Goblin (1)":(params,rolledResult)=>{
        const {setCurrentWheel,dispatch,characterState}= params;
        dispatch({
            type: "ADD_ARCHETYPE",
            archetype: { id: "33", name: "Him", weight: 1, color: "#1E90FF" },
        });
        const raceOrSubrace = getRaceOrSubrace(characterState.results);
        const firstStatWheel = getStatWheel(raceOrSubrace, STAT_WHEELS[0]);
        
        if (firstStatWheel) {
            setCurrentWheel(firstStatWheel);
            return {
                shouldContinue: false,
                nextWheel: undefined,
                message:"gay",
                }        
            } else {
            // Fallback nếu không tìm được stat wheel
            setCurrentWheel(archetypeWheel);
            return {
                shouldContinue: false,
                nextWheel: undefined,
                message:"gay",
            }
        }
    },

    Elf:(params,rolledResult,resultName)=>{
        const {setCurrentWheel,dispatch}=params
        if (resultName === "Lythari") {
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q41",
              name: "Raconteur",
              weight: 1.79,
              color: "#F08080",
              description:
                "Trong combat: Round chiến thắng đầu tiên của bản thân sẽ không được nhận điểm mà khiến đối thủ bị -1 điểm.",
            },
          });
        } else if (resultName === "Moon Elf") {
          setCurrentWheel({
            ...playerWheel,
            key: "lover",
            title: "Moon Elf - Lover Selection",
          });
        }
        setCurrentWheel(archetypeWheel);
        return{
                shouldContinue: false,
                nextWheel: undefined,
                message:"gay",
        }
    },

    "WereBeast|WereRat":(params,rolledResult,resultName)=>{
        const {setCurrentWheel,dispatch}= params;
            dispatch({
            type: "ADD_POWER",
            power: {
              id: "9",
              name: "Crimson Poison",
              effect:
                "Đối thủ -1 Durability, giảm thêm 1 với mỗi 2 Power sở hữu.",
              weight: 0.9,
              color: "",
            },
          });
    setCurrentWheel(archetypeWheel);
    return {
            shouldContinue: false,
            nextWheel: undefined,
            message:"gay",
        }
    }
}
