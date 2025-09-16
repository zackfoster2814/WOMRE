import { useCallback } from "react";
import { WheelStep } from "@/Common/Types/Types";
import { raceConfig, raceWheel } from "@/Common/Config/RaceConfig";
import { subraceMap } from "@/Common/Config/SubRaceConfig";

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

export const raceSelectionMap: Record<string, RaceHandler> = {
  Skeleton: (params, rolledResult) => {
    const { setCurrentWheel } = params;
    if (!raceWheel) return { shouldContinue: false };
    setCurrentWheel({
      ...raceWheel,
      key: "skeleton-lineage",
      title: "Skeleton Lineage",
      sections: raceWheel.sections.filter((s) => s.name !== "Skeleton"),
    });
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "PlaceHolder",
    };
  },
  Uma: (params, rolledResult) => {
    const { setCurrentWheel } = params;
    setCurrentWheel({
      key: "uma-parent-1",
      title: "Uma Parent Race 1",
      sections: subraceMap["Uma"],
    });
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "PlaceHolder",
    };
  },
  Angel: (params, rolledResult, resultName) => {
    const { dispatch, setCurrentWheel } = params;
    dispatch({
      type: "ADD_ARCHETYPE",
      archetype: {
        id: "16",
        name: "Pacifist",
        weight: 2,
        color: "#98FB98",
      },
    });
    setCurrentWheel({
      key: "subrace",
      title: raceConfig[resultName]?.subrace || "Subrace",
      sections: subraceMap[resultName],
    });
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "PlaceHolder",
    };
  },
};
