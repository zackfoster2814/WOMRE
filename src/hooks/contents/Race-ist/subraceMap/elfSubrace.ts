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

export const ElfSubrace: Record<string, RaceHandler> = {
  Lythari: (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
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
    setCurrentWheel(archetypeWheel);
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "PlaceHolder",
    };
  },
  "Moon Elf": (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
    setCurrentWheel({
      ...playerWheel,
      key: "lover",
      title: "Moon Elf - Lover Selection",
    });
    setCurrentWheel(archetypeWheel);
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "PlaceHolder",
    };
  },
  //....
};
