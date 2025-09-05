import { useCallback } from "react";
import { WheelStep } from "@/Common/Types/Types.ts";
import { raceConfig, raceWheel } from "@/Common/Config/RaceConfig.ts";
import { subraceMap } from "@/Common/Config/SubRaceConfig.ts";
import { archetypeWheel } from "@/Common/Config/ArchetypeConfig.ts";
import {
  uniqueVampireTrainWheel,
  vampireTasteWheel,
} from "@/Common/Config/ArchetypeExtraWheels.ts";
import {
  getStatWheel,
  getRaceOrSubrace,
  STAT_WHEELS,
} from "@/utils/wheelUtils.ts";

// Types for race handlers
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

export const useRaceHandlers = () => {
  // Handle main race selection
  const handleRaceSelection = useCallback(
    (resultName: string, params: RaceHandlerParams): RaceHandlerResult => {
      const { dispatch, setCurrentWheel } = params;

      dispatch({ type: "SET_RESULT", key: "race", value: resultName });

      switch (resultName) {
        case "Skeleton":
          setCurrentWheel({
            ...raceWheel,
            key: "skeleton-lineage",
            title: "Skeleton Lineage",
            sections: raceWheel.sections.filter((s) => s.name !== "Skeleton"),
          });
          return { shouldContinue: false };

        case "Uma":
          setCurrentWheel({
            key: "uma-parent-1",
            title: "Uma Parent Race 1",
            sections: subraceMap["Uma"],
          });
          return { shouldContinue: false };

        case "Angel":
          // Auto-add Pacifist archetype for Angel
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
          return { shouldContinue: false };

        default:
          // Check if race has subraces
          if (subraceMap[resultName]?.length > 0) {
            setCurrentWheel({
              key: "subrace",
              title: raceConfig[resultName]?.subrace || "Subrace",
              sections: subraceMap[resultName],
            });
          } else {
            setCurrentWheel(archetypeWheel);
          }
          return { shouldContinue: false };
      }
    },
    []
  );

  // Handle Uma parent selection flow
  const handleUmaParentFlow = useCallback(
    (
      wheelKey: string,
      resultName: string,
      params: RaceHandlerParams
    ): RaceHandlerResult => {
      const { dispatch, setCurrentWheel, characterState } = params;

      switch (wheelKey) {
        case "uma-parent-1":
          dispatch({
            type: "SET_RESULT",
            key: "uma-parent-1",
            value: resultName,
          });
          setCurrentWheel({
            key: "uma-parent-2",
            title: "Uma Parent Race 2",
            sections: subraceMap["Uma"].filter((s) => s.name !== resultName),
          });
          return { shouldContinue: false };

        case "uma-parent-2":
          dispatch({
            type: "SET_RESULT",
            key: "uma-parent-2",
            value: resultName,
          });
          dispatch({
            type: "SET_RESULT",
            key: "subrace",
            value: `${characterState.results["uma-parent-1"]} - ${resultName}`,
          });
          setCurrentWheel(archetypeWheel);
          return { shouldContinue: false };

        default:
          return { shouldContinue: true };
      }
    },
    []
  );

  // Handle skeleton lineage selection
  const handleSkeletonLineage = useCallback(
    (resultName: string, params: RaceHandlerParams): RaceHandlerResult => {
      const { dispatch, setCurrentWheel } = params;

      dispatch({ type: "SET_RESULT", key: "subrace", value: resultName });
      setCurrentWheel(archetypeWheel);
      return { shouldContinue: false };
    },
    []
  );

  // Handle subrace selection
  const handleSubraceSelection = useCallback(
    (resultName: string, params: RaceHandlerParams): RaceHandlerResult => {
      const { dispatch, setCurrentWheel, characterState } = params;

      dispatch({ type: "SET_RESULT", key: "subrace", value: resultName });

      // Check for Vampire special flow
      if (characterState.results.race === "Vampire") {
        setCurrentWheel({
          ...uniqueVampireTrainWheel,
          key: "uniqueVampireTrain",
          title: "Unique Taste Train",
        });
        return { shouldContinue: false };
      } else {
        setCurrentWheel(archetypeWheel);
        return { shouldContinue: false };
      }
    },
    []
  );

  // Handle vampire unique taste flow
  const handleVampireFlow = useCallback(
    (
      wheelKey: string,
      resultName: string,
      params: RaceHandlerParams
    ): RaceHandlerResult => {
      const { dispatch, setCurrentWheel } = params;

      switch (wheelKey) {
        case "uniqueVampireTrain":
          dispatch({
            type: "SET_RESULT",
            key: "uniqueVampireTrain",
            value: resultName,
          });
          if (resultName === "Có Khẩu vị độc đáo") {
            setCurrentWheel({
              ...vampireTasteWheel,
              key: "vampireTaste",
              title: "Unique Vampire Taste",
            });
          } else {
            setCurrentWheel(archetypeWheel);
          }
          return { shouldContinue: false };

        case "vampireTaste":
          dispatch({
            type: "SET_RESULT",
            key: "vampireTaste",
            value: resultName,
          });
          setCurrentWheel(archetypeWheel);
          return { shouldContinue: false };

        default:
          return { shouldContinue: true };
      }
    },
    []
  );

  // Handle race-specific stat logic
  const handleRaceSpecificStats = useCallback(
    (
      statKey: string,
      resultName: string,
      params: RaceHandlerParams
    ): RaceHandlerResult => {
      const { dispatch, setCurrentWheel, setStatStep, characterState } = params;
      const { results } = characterState;

      // Handle durability stat with race-specific logic
      if (statKey === "durability") {
        dispatch({ type: "SET_STAT", key: statKey, value: resultName });
        const durabilityIndex = STAT_WHEELS.indexOf("durability");
        const raceOrSubrace = getRaceOrSubrace(results);

        // Check if Skeleton race - skip IQ
        if (results.race === "Skeleton") {
          // Skip IQ for Skeleton, set it to 1 automatically
          dispatch({ type: "SET_STAT", key: "iq", value: "1" });
          // Go directly to Battle IQ
          const battleIQWheel = getStatWheel(raceOrSubrace, "battleIQ");
          if (battleIQWheel) {
            setCurrentWheel(battleIQWheel);
            setStatStep(STAT_WHEELS.indexOf("battleIQ") + 1);
          }
          return { shouldContinue: false };
        } else {
          // Normal flow - go to IQ
          const nextWheel = getStatWheel(raceOrSubrace, "iq");
          if (nextWheel) {
            setCurrentWheel(nextWheel);
            setStatStep(durabilityIndex + 2);
          }
          return { shouldContinue: false };
        }
      }

      // Handle IQ stat (should only be reached by non-Skeleton races)
      if (statKey === "iq") {
        dispatch({ type: "SET_STAT", key: "iq", value: resultName });
        const iqIndex = STAT_WHEELS.indexOf("iq");
        const raceOrSubrace = getRaceOrSubrace(results);

        if (iqIndex < STAT_WHEELS.length - 1) {
          const nextStatKey = STAT_WHEELS[iqIndex + 1];
          const nextWheel = getStatWheel(raceOrSubrace, nextStatKey);
          if (nextWheel) {
            setCurrentWheel(nextWheel);
            setStatStep(iqIndex + 2);
          }
          return { shouldContinue: false };
        } else {
          return { shouldContinue: true, message: "stats-complete" };
        }
      }

      // For other stats, continue normal flow
      return { shouldContinue: true };
    },
    []
  );

  // Check if race has special house assignment
  const hasSpecialRaceHouseAssignment = useCallback(
    (race: string): string | null => {
      switch (race) {
        case "Uma":
          return "Tracen Academy.ts";
        default:
          return null;
      }
    },
    []
  );

  // Get race-specific character development max count
  const getRaceCharDevMax = useCallback((race: string): number => {
    return race === "Human" ? 2 : 1;
  }, []);

  // Check if race affects power count
  const getRacePowerModifier = useCallback((race: string): number => {
    // Currently no race-specific power modifiers
    // This can be extended in the future
    return 0;
  }, []);

  // Validate race selection
  const isValidRaceSelection = useCallback((race: string): boolean => {
    return raceWheel.sections.some((section) => section.name === race);
  }, []);

  // Get available subraces for a race
  const getAvailableSubraces = useCallback((race: string) => {
    return subraceMap[race] || [];
  }, []);

  // Check if race requires subrace selection
  const requiresSubraceSelection = useCallback(
    (race: string): boolean => {
      const subraces = getAvailableSubraces(race);
      return subraces.length > 0;
    },
    [getAvailableSubraces]
  );

  // Get race display information
  const getRaceDisplayInfo = useCallback(
    (race: string) => {
      const raceSection = raceWheel.sections.find((s) => s.name === race);
      return {
        name: race,
        color: raceSection?.color || "#ffffff",
        weight: raceSection?.weight || 1,
        hasSubraces: requiresSubraceSelection(race),
        subraceCount: getAvailableSubraces(race).length,
        specialRules: getSpecialRaceRules(race),
      };
    },
    [requiresSubraceSelection, getAvailableSubraces]
  );

  // Get special rules for race
  const getSpecialRaceRules = useCallback((race: string): string[] => {
    const rules: string[] = [];

    switch (race) {
      case "Skeleton":
        rules.push("IQ is automatically set to 1");
        rules.push("Must select lineage instead of subrace");
        break;
      case "Uma":
        rules.push("Must select two parent races");
        rules.push("Automatically assigned to Tracen Academy");
        break;
      case "Angel":
        rules.push("Automatically gains Pacifist archetype");
        break;
      case "Vampire":
        rules.push("May have unique taste preferences");
        break;
      case "Human":
        rules.push("Can have 2 character developments instead of 1");
        break;
    }

    return rules;
  }, []);

  // Handle race completion and transition
  const handleRaceCompletion = useCallback(
    (params: RaceHandlerParams): RaceHandlerResult => {
      const { characterState } = params;
      const { results } = characterState;

      // Validate that race selection is complete
      if (!results.race) {
        return { shouldContinue: false, message: "race-not-selected" };
      }

      // Check if subrace is required but not selected
      if (requiresSubraceSelection(results.race) && !results.subrace) {
        return { shouldContinue: false, message: "subrace-required" };
      }

      // Race flow is complete, can proceed to archetype
      return { shouldContinue: true, message: "race-complete" };
    },
    [requiresSubraceSelection]
  );

  return {
    handleRaceSelection,
    handleUmaParentFlow,
    handleSkeletonLineage,
    handleSubraceSelection,
    handleVampireFlow,
    handleRaceSpecificStats,
    hasSpecialRaceHouseAssignment,
    getRaceCharDevMax,
    getRacePowerModifier,
    isValidRaceSelection,
    getAvailableSubraces,
    requiresSubraceSelection,
    getRaceDisplayInfo,
    getSpecialRaceRules,
    handleRaceCompletion,
  };
};
