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

type RaceHandler = (
  params: RaceHandlerParams,
  rolledResult: any,
  resultName: any
) => RaceHandlerResult;

export const DragonSubrace: Record<string, RaceHandler> = {
  "Ancient Dragon": (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
    dispatch({
      type: "ADD_POWER",
      power: {
        id: "11",
        name: "Divine Smite",
        effect:
          "Nhận +1 Điểm nếu thắng ở Round MA. Xảy ra sau cùng, sau khi 'Kiếm Phái Ashina'.",
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

  "Undead Dragon": (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
    setCurrentWheel({
      key: "summon",
      title: "Undead Dragon - Summon Selection",
      sections: summonWheel.sections,
    });
    setCurrentWheel(archetypeWheel);
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "gay",
    };
  },
  "Thunder Dragon": (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
    dispatch({
      type: "ADD_POWER",
      power: {
        id: "13",
        name: "Thunder Orb",
        effect: "Đối thủ giảm 2 Durability.",
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
