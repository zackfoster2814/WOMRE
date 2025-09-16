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

export const GoblinSubrace: Record<string, RaceHandler> = {
  1: (params, rolledResult) => {
    const { setCurrentWheel, dispatch, characterState } = params;
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
        message: "PlaceHolder",
      };
    } else {
      // Fallback nếu không tìm được stat wheel
      setCurrentWheel(archetypeWheel);
      return {
        shouldContinue: false,
        nextWheel: undefined,
        message: "PlaceHolder",
      };
    }
  },
};
