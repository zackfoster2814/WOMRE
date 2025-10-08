import { useCallback } from "react";
import { WheelStep } from "@/Common/Types/Types";
import { subraceMap } from "@/Common/Config/SubRaceConfig";
import { archetypeWheel } from "@/Common/Config/ArchetypeConfig";

interface RaceHandlerParams {
  dispatch: React.Dispatch<any>;
  setCurrentWheel: (wheel: WheelStep) => void;
  setStatStep: (step: number) => void;
  characterState: any;
  applyUmaParentAbilities: (
    resultName: any,
    dispatch: React.Dispatch<any>
  ) => void;
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

export const UmaParentMap: Record<string, RaceHandler> = {
  "uma-parent-1": (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch, applyUmaParentAbilities } = params;
    dispatch({
      type: "SET_RESULT",
      key: "uma-parent-1",
      value: resultName,
    });
    applyUmaParentAbilities(resultName, dispatch);
    setCurrentWheel({
      key: "uma-parent-2",
      title: "Uma Parent Race 2",
      sections: subraceMap["Uma"].filter((s) => s.name !== resultName),
    });
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "PlaceHolder",
    };
  },

  "uma-parent-2": (params, rolledResult, resultName) => {
    const {
      setCurrentWheel,
      dispatch,
      characterState,
      applyUmaParentAbilities,
    } = params;

    dispatch({
      type: "SET_RESULT",
      key: "uma-parent-2",
      value: resultName,
    });

    // Apply parent 2 abilities
    applyUmaParentAbilities(resultName, dispatch);

    // Set combined subrace
    const parent1 = characterState.results["uma-parent-1"];
    const combinedSubrace = `${parent1} - ${resultName}`;
    dispatch({
      type: "SET_RESULT",
      key: "subrace",
      value: combinedSubrace,
    });

    // Check for Special Week combination
    if (combinedSubrace.includes("Special Week")) {
      setCurrentWheel({
        key: "special-week-extra",
        title: "Special Week Power Selection",
        sections: [
          {
            id: "gourmand",
            name: "Gourmand",
            weight: 1,
            color: "#FFD700",
          },
          {
            id: "hydrate",
            name: "Hydrate",
            weight: 1,
            color: "#87CEEB",
          },
        ],
      });
    } else {
      setCurrentWheel(archetypeWheel);
    }
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "PlaceHolder",
    };
  },
};
