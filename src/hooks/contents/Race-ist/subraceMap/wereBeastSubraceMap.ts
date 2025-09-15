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

export const WereBeastSubrace: Record<string, RaceHandler> = {
  WereRat: (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
    dispatch({
      type: "ADD_POWER",
      power: {
        id: "9",
        name: "Crimson Poison",
        effect: "Đối thủ -1 Durability, giảm thêm 1 với mỗi 2 Power sở hữu.",
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
  "WereBeast|Werecapybara": (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
    dispatch({
      type: "ADD_QUIRK",
      quirk: {
        id: "q9",
        name: "Cute",
        weight: 1.79,
        color: "#FF69B4",
        description: 'Quay 1 player để làm "Lover". Nhận +1 IQ',
      },
    });
    setCurrentWheel({
      ...playerWheel,
      key: "lover",
      title: "Werecapybara - Cute Lover Selection",
    });
    setCurrentWheel(archetypeWheel);
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "gay",
    };
  },
};
