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

export const GodSubrace: Record<string, RaceHandler> = {
  Apollo: (params, rolledResult, resultName) => {
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
    dispatch({
      type: "ADD_POWER",
      power: {
        id: "HP01",
        name: "Healing Factor",
        effect:
          "Nhận +1 Durability. Với mỗi 2 round thua trong 1 combat, nhận +1 Durability. (áp dụng sau combat)",
        weight: 0.0,
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
  Artemis: (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
    dispatch({
      type: "ADD_POWER",
      power: {
        id: "HP02",
        name: "Healing Factor",
        effect: "Sau khi thắng 1 combat PvP, nhận 2 phần thưởng PvP thay vì 1.",
        weight: 0.0,
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
