import { useCallback } from "react";
import { WheelStep } from "@/Common/Types/Types";
import { raceWheel } from "@/Common/Config/RaceConfig";
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
import { useResult } from "@/components/setResult";
import { raceSelectionMap } from "../contents/Race-ist/raceSelectionMap";
import { UmaParentMap } from "../contents/Race-ist/umaParentMap";
import { subraceSelectionMap } from "../contents/Race-ist/subraceMap/subraceSelectionMap";

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

type RaceHandler = (
  params: RaceHandlerParams,
  rolledResult: any,
  resultName: any
) => RaceHandlerResult;

export const useRaceHandlers = () => {
  const { rolledResult } = useResult();

  // Uma parent abilities mapping
  const UMA_PARENT_ABILITIES = {
    Maruzensky: {
      type: "ADD_POWER",
      data: {
        id: "4",
        name: "Red Shift/LP1211-M",
        effect:
          "Trong combat: Nếu bạn thắng ít nhất 1 trong 3 round đầu tiên (Strength/Speed/Durability), nhận +1 IQ, +1 BIQ và +2 MA.",
        weight: 0.9,
        color: "",
      },
    },
    "Mejiro Ryan": {
      type: "ADD_POWER",
      data: {
        id: "6",
        name: "Let's Pump Some Iron!",
        effect:
          "Trong combat: Nếu bạn thắng chính xác 1 trong 3 round đầu tiên (Strength/Speed/Durability), nhận +2 IQ, +2 BIQ và +2 MA.",
        weight: 0.9,
        color: "",
      },
    },
    "Taiki Shuttle": {
      type: "ADD_POWER",
      data: {
        id: "5",
        name: "Shooting for Victory",
        effect:
          "Trong combat: Nếu bạn thắng ít nhất 1 và thua ít nhất 1 trong 3 round đầu tiên (Strength/Speed/Durability), nhận +1 IQ, +1 BIQ và +2 MA.",
        weight: 0.9,
        color: "",
      },
    },
    "Gold Ship": {
      type: "ADD_QUIRK",
      data: {
        id: "q26",
        name: "Training Restricted",
        weight: 1.79,
        color: "#FFE4B5",
        description: "Nhận +1 all stats nhưng sẽ không có vòng đấu PvE.",
      },
    },
    "Agnes Tachyon": {
      type: "ADD_POWER",
      data: {
        id: "7",
        name: "U=ma2",
        effect: "Trong combat: Nhận +5 Durability nếu bạn thua round Speed.",
        weight: 0.9,
        color: "",
      },
    },
  };

  // Apply Uma parent abilities
  const applyUmaParentAbilities = useCallback(
    (parentName: string, dispatch: React.Dispatch<any>) => {
      const ability =
        UMA_PARENT_ABILITIES[parentName as keyof typeof UMA_PARENT_ABILITIES];
      if (ability) {
        dispatch({
          type: ability.type,
          [ability.type === "ADD_POWER" ? "power" : "quirk"]: ability.data,
        });
      }
    },
    []
  );

  // Handle Special Week power selection
  const handleSpecialWeekFlow = useCallback(
    (resultName: string, params: RaceHandlerParams): RaceHandlerResult => {
      const { dispatch, setCurrentWheel } = params;

      const specialWeekPowers = {
        Gourmand: {
          id: "101",
          name: "Gourmand",
          effect: "Trong Combat: Nhận +4 Durability.",
          weight: 0.9,
          color: "",
        },
        Hydrate: {
          id: "100",
          name: "Hydrate",
          effect: "Cơ thể bạn được cung cấp đủ nước. 💦💦💦",
          weight: 0.9,
          color: "",
        },
      };

      const selectedPower =
        specialWeekPowers[resultName as keyof typeof specialWeekPowers];
      if (selectedPower) {
        dispatch({
          type: "ADD_POWER",
          power: selectedPower,
        });
      }

      setCurrentWheel(archetypeWheel);
      return { shouldContinue: false };
    },
    []
  );

  // Handle main race selection
  const handleRaceSelection = useCallback(
    (
      resultName: string,
      params: RaceHandlerParams,
      rolledResult: any
    ): RaceHandlerResult => {
      const { dispatch, setCurrentWheel } = params;
      dispatch({ type: "SET_RESULT", key: "race", value: resultName });
      const handler: any = raceSelectionMap[resultName];

      if (handler) {
        return handler(params, rolledResult, resultName);
      }

      // Check if race has subraces
      const subraces = subraceMap[resultName];
      if (subraces && Array.isArray(subraces) && subraces.length > 0) {
        setCurrentWheel({
          key: "subrace",
          title: `${resultName} Subrace`,
          sections: subraces,
        });
      } else {
        setCurrentWheel(archetypeWheel);
      }
      return { shouldContinue: false };
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
      const handler: any = UmaParentMap[wheelKey];
      if (handler) {
        return handler(
          {
            ...params,
            applyUmaParentAbilities,
          },
          rolledResult,
          resultName
        );
      }

      return { shouldContinue: true };
    },
    [applyUmaParentAbilities]
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

  //func nhu ten
  function findSubraceHandler(race: string, resultName: string) {
    const subraceMapForRace = subraceSelectionMap[race];

    if (!subraceMapForRace) {
      return undefined;
    }

    let handler = subraceMapForRace[resultName];

    if (!handler) {
      return undefined;
    }

    return handler;
  }
  // Handle subrace selection
  const handleSubraceSelection = useCallback(
    (resultName: string, params: RaceHandlerParams): RaceHandlerResult => {
      const { dispatch, setCurrentWheel, characterState } = params;
      dispatch({ type: "SET_RESULT", key: "subrace", value: resultName });
      const handler: any = findSubraceHandler(
        characterState.results.race,
        resultName
      );
      if (handler) {
        return handler(params, rolledResult, resultName);
      } else {
        setCurrentWheel(archetypeWheel);
      }

      return { shouldContinue: true };
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
          return "Tracen Academy";
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
        rules.push("Each parent grants special abilities");
        rules.push("Special Week combinations grant extra powers");
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
    handleSpecialWeekFlow,
    applyUmaParentAbilities, // Export this function
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
