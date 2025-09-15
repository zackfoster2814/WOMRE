import { useCallback } from "react";
import { WheelStep } from "@/Common/Types/Types";
import { raceConfig, raceWheel } from "@/Common/Config/RaceConfig";
import { subraceMap } from "@/Common/Config/SubRaceConfig";
import { archetypeWheel, summonWheel } from "@/Common/Config/ArchetypeConfig";
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
import { useZackie } from "@/components/setResult";


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

type RaceHandler = (
  params: RaceHandlerParams,
  rolledResult: any,
  resultName: any
) => RaceHandlerResult;

export const PrimordialBeingSubrace: Record<string, RaceHandler> = {
  Air: (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
    dispatch({
      type: "ADD_POWER",
      power: {
        id: "49",
        name: "Blowing Leaves",
        effect: "Thổi lá bay đi 💀",
        weight: 0.9,
        color: "",
      },
    });
    setCurrentWheel(archetypeWheel);
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "gay",
    };
  },
  Water: (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
    dispatch({
      type: "ADD_POWER",
      power: {
        id: "14",
        name: "Water Breathing",
        effect: "Thở dưới nước.",
        weight: 0.9,
        color: "",
      },
    });
    setCurrentWheel(archetypeWheel);
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "gay",
    };
  },
  Fire: (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
    dispatch({
      type: "ADD_POWER",
      power: {
        id: "12",
        name: "Fire Control",
        effect:
          "Có thể điều khiển được một ngọn lửa bật hoặc tắt. Ngoài ra không tác dụng 💀",
        weight: 0.9,
        color: "",
      },
    });
    setCurrentWheel(archetypeWheel);
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "gay",
    };
  },
  Earth: (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
    dispatch({
      type: "ADD_POWER",
      power: {
        id: "60",
        name: "Earth-Shaking",
        effect: "Đất đá rung chuyển.",
        weight: 0.9,
        color: "",
      },
    });
    setCurrentWheel(archetypeWheel);
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "gay",
    };
  },
};
