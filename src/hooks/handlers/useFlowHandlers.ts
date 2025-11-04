import { useCallback } from "react";
import { WheelStep } from "@/Common/Types/Types";
import { raceWheel } from "@/Common/Config/RaceConfig";
import { subraceMap } from "@/Common/Config/SubRaceConfig";
import { archetypeWheel } from "@/Common/Config/ArchetypeConfig";
import { quirkCountOptions } from "@/Common/Config/QuirkConfig";
import { houseWheel } from "@/Common/Config/HouseConfig";
import { gearCountWheel } from "@/Common/Config/GearConfig";
import { weaponExistWheel } from "@/Common/Config/WeaponConfig";
import { PowerWheel } from "@/Common/Config/PowerConfig";
import { charDevWheel } from "@/Common/Config/CharDevConfig";
import { pveWheel } from "@/Common/Config/PvEConfig";
import {
  ashinaSwordWheel,
  dessendreSkillWheel,
  goldenOrderRuneWheel,
  starkWolfWheel,
  targaryenDragonWheel,
} from "@/Common/Config/HouseExtraWheels";
import {
  getStatWheel,
  getRaceOrSubrace,
  STAT_WHEELS,
} from "@/utils/wheelUtils";

// Types for flow handlers
interface FlowHandlerParams {
  characterState: any;
  setCurrentWheel: (wheel: WheelStep) => void;
  setStatStep: (step: number) => void;
  statStep: number;
  gearCount: number;
}

interface NavigationResult {
  success: boolean;
  message?: string;
  wheelKey?: string;
}

export const useFlowHandlers = () => {
  // Helper to transition to stats wheels
  const goToStats = useCallback(
    (params: FlowHandlerParams): NavigationResult => {
      const { characterState, setCurrentWheel, setStatStep } = params;
      const { results } = characterState;
      const raceOrSubrace = getRaceOrSubrace(results);

      if (!raceOrSubrace) {
        return { success: false, message: "No race selected" };
      }

      const firstWheel = getStatWheel(raceOrSubrace, STAT_WHEELS[0]);
      if (firstWheel) {
        setCurrentWheel(firstWheel);
        setStatStep(1);
        return { success: true, wheelKey: STAT_WHEELS[0] };
      }

      return { success: false, message: "Could not find first stat wheel" };
    },
    []
  );

  // Navigate to specific wheel by key
  const jumpToWheel = useCallback(
    (wheelKey: string, params: FlowHandlerParams): NavigationResult => {
      const { characterState, setCurrentWheel, setStatStep, statStep } = params;
      const { results } = characterState;
      const raceOrSubrace = getRaceOrSubrace(results);

      switch (wheelKey) {
        case "race":
          setCurrentWheel(raceWheel);
          return { success: true, wheelKey: "race" };

        case "subrace":
          if (results.race && subraceMap[results.race]) {
            setCurrentWheel({
              key: "subrace",
              title: raceWheel[results.race]?.subrace || "Subrace",
              sections: subraceMap[results.race],
            });
            return { success: true, wheelKey: "subrace" };
          }
          return {
            success: false,
            message: "No subraces available for current race",
          };

        case "archetype":
          if (results.race) {
            setCurrentWheel(archetypeWheel);
            return { success: true, wheelKey: "archetype" };
          }
          return { success: false, message: "Race must be selected first" };

        case "strength":
        case "speed":
        case "durability":
        case "iq":
        case "battleIQ":
        case "martialArts":
          if (raceOrSubrace) {
            const wheel = getStatWheel(raceOrSubrace, wheelKey);
            if (wheel) {
              setCurrentWheel(wheel);
              setStatStep(STAT_WHEELS.indexOf(wheelKey) + 1);
              return { success: true, wheelKey };
            }
            return {
              success: false,
              message: `Could not find ${wheelKey} wheel for race`,
            };
          }
          return {
            success: false,
            message: "Race/subrace must be selected first",
          };

        case "quirk":
          if (statStep >= STAT_WHEELS.length) {
            setCurrentWheel({
              key: "quirk-count",
              title: "Quirk Count",
              sections: quirkCountOptions,
            });
            return { success: true, wheelKey: "quirk-count" };
          }
          return { success: false, message: "Stats must be completed first" };

        case "house":
          // if (
          //   characterState.quirks.length > 0 ||
          //   statStep >= STAT_WHEELS.length
          // ) {
          setCurrentWheel(houseWheel);
          return { success: true, wheelKey: "house" };
        // }
        // return { success: false, message: "Quirks must be selected first" };

        case "gear":
          setCurrentWheel(gearCountWheel);
          return { success: true, wheelKey: "gear-count" };

        case "weapon":
          setCurrentWheel(weaponExistWheel);
          return { success: true, wheelKey: "weapon-exist" };

        case "power":
          if (raceOrSubrace) {
            setCurrentWheel(PowerWheel);
            return { success: true, wheelKey: "power" };
          }
          return {
            success: false,
            message: "Race/subrace must be selected first",
          };

        case "charDev":
          setCurrentWheel(charDevWheel);
          return { success: true, wheelKey: "char-dev" };

        case "pve":
          setCurrentWheel(pveWheel);
          return { success: true, wheelKey: "pve" };

        default:
          return { success: false, message: `Unknown wheel key: ${wheelKey}` };
      }
    },
    []
  );

  // Get the next wheel in the flow sequence
  const getNextWheel = useCallback(
    (currentWheelKey: string, params: FlowHandlerParams): WheelStep | null => {
      const { characterState } = params;
      const { results } = characterState;
      const raceOrSubrace = getRaceOrSubrace(results);

      // Define the standard flow sequence
      const flowSequence = [
        "race",
        "subrace",
        "archetype",
        ...STAT_WHEELS,
        "quirk-count",
        "quirk",
        "house",
        "gear-count",
        "legacy-gear-count",
        "gear",
        "legacy-gear",
        "weapon-exist",
        "weapon",
        "weapon-enchant-count",
        "weapon-enchant",
        "power-count",
        "power",
        "char-dev",
        "pve",
      ];

      const currentIndex = flowSequence.indexOf(currentWheelKey);
      if (currentIndex === -1 || currentIndex >= flowSequence.length - 1) {
        return null;
      }

      const nextWheelKey = flowSequence[currentIndex + 1];

      // Handle special cases for next wheel
      switch (nextWheelKey) {
        case "subrace":
          if (results.race && subraceMap[results.race]?.length > 0) {
            return {
              key: "subrace",
              title: raceWheel[results.race]?.subrace || "Subrace",
              sections: subraceMap[results.race],
            };
          }
          // Skip to archetype if no subraces
          return archetypeWheel;

        case "archetype":
          return archetypeWheel;

        case "strength":
          return getStatWheel(raceOrSubrace, "strength");

        case "quirk-count":
          return {
            key: "quirk-count",
            title: "Quirk Count",
            sections: quirkCountOptions,
          };

        case "house":
          return houseWheel;

        case "char-dev":
          return charDevWheel;

        case "pve":
          return pveWheel;

        default:
          if (STAT_WHEELS.includes(nextWheelKey as any)) {
            return getStatWheel(raceOrSubrace, nextWheelKey);
          }
          return null;
      }
    },
    []
  );

  // Check if current wheel flow is complete
  const isWheelFlowComplete = useCallback((characterState: any): boolean => {
    const { results, stats, quirks, charDevs } = characterState;

    // Check required fields
    if (!results.race || !results.pve) {
      return false;
    }

    // Check all stats are filled
    const allStatsComplete = Object.values(stats).every(
      (stat: any) => stat !== ""
    );
    if (!allStatsComplete) {
      return false;
    }

    // Check quirks exist
    if (quirks.length === 0) {
      return false;
    }

    // Check character development (unless NPC archetype)
    const isNPC = characterState.archetypes.some(
      (archetype: any) => archetype.name === "NPC 💀"
    );
    if (!isNPC && charDevs.length === 0) {
      return false;
    }

    return true;
  }, []);

  // Get current flow progress percentage
  const getFlowProgress = useCallback((characterState: any): number => {
    const { results, stats, quirks, gears, weapons, powers, charDevs } =
      characterState;

    let completed = 0;
    const totalSteps = 10; // Approximate total major steps

    if (results.race) completed++;
    if (results.subrace || results.race === "Human") completed++;
    if (characterState.archetypes.length > 0) completed++;
    if (Object.values(stats).every((stat: any) => stat !== "")) completed++;
    if (quirks.length > 0) completed++;
    if (results.house) completed++;
    if (gears.length > 0 || weapons.length > 0) completed++;
    if (powers.length > 0) completed++;
    if (
      charDevs.length > 0 ||
      characterState.archetypes.some((a: any) => a.name === "NPC 💀")
    )
      completed++;
    if (results.pve) completed++;

    return Math.round((completed / totalSteps) * 100);
  }, []);

  // Handle special house wheels
  const getHouseSpecialWheel = useCallback(
    (houseName: string, onComplete?: () => void): WheelStep | null => {
      const houseSpecialWheels: Record<string, WheelStep> = {
        "House Stark": {
          ...starkWolfWheel,
          onComplete,
        },
        "Golden Order": {
          ...goldenOrderRuneWheel,
          onComplete,
        },
        "Ashina Clan": {
          ...ashinaSwordWheel,
          onComplete,
        },
        "Dessendre Family": {
          ...dessendreSkillWheel,
          onComplete,
        },
        "House Targaryen": {
          ...targaryenDragonWheel,
          onComplete,
        },
        "House Marais": {
          key: "marais-race-1",
          title: "House Marais - First Slayer Target",
          sections: raceWheel.sections, // Use race wheel sections
          onComplete,
        },
      };

      return houseSpecialWheels[houseName] || null;
    },
    []
  );
  // Validate navigation is allowed
  const canNavigateToWheel = useCallback(
    (wheelKey: string, characterState: any): boolean => {
      const { results, archetypes } = characterState;

      switch (wheelKey) {
        case "race":
          return true; // Always can go back to race

        case "subrace":
          return !!results.race;

        case "archetype":
          return !!results.race;

        case "strength":
        case "speed":
        case "durability":
        case "iq":
        case "battleIQ":
        case "martialArts":
          return archetypes.length > 0;

        case "quirk":
          return Object.values(characterState.stats).every(
            (stat: any) => stat !== ""
          );

        case "house":
          return characterState.quirks.length > 0;

        case "gear":
        case "weapon":
          return !!results.house;

        case "power":
          return !!results.house;

        case "charDev":
          return characterState.powers.length > 0;

        case "pve":
          return (
            characterState.charDevs.length > 0 ||
            archetypes.some((a: any) => a.name === "NPC 💀")
          );

        default:
          return false;
      }
    },
    []
  );

  // Get available navigation options
  const getAvailableNavigationOptions = useCallback(
    (characterState: any): string[] => {
      const allWheels = [
        "race",
        "subrace",
        "archetype",
        ...STAT_WHEELS,
        "quirk",
        "house",
        "gear",
        "weapon",
        "power",
        "charDev",
        "pve",
      ];

      return allWheels.filter((wheelKey) =>
        canNavigateToWheel(wheelKey, characterState)
      );
    },
    [canNavigateToWheel]
  );

  // Handle flow completion
  const handleFlowCompletion = useCallback(
    (characterState: any): boolean => {
      if (!isWheelFlowComplete(characterState)) {
        return false;
      }

      // Additional completion logic can be added here
      console.log("Character creation flow completed successfully!");
      return true;
    },
    [isWheelFlowComplete]
  );

  // Reset flow to beginning
  const resetFlow = useCallback(
    (params: FlowHandlerParams): NavigationResult => {
      const { setCurrentWheel, setStatStep } = params;

      setCurrentWheel(raceWheel);
      setStatStep(0);

      return { success: true, wheelKey: "race" };
    },
    []
  );

  // Get flow status summary
  const getFlowStatus = useCallback(
    (characterState: any) => {
      const progress = getFlowProgress(characterState);
      const isComplete = isWheelFlowComplete(characterState);
      const availableOptions = getAvailableNavigationOptions(characterState);

      return {
        progress,
        isComplete,
        availableOptions,
        currentStep: getCurrentStepName(characterState),
        nextStep: getNextStepName(characterState),
      };
    },
    [getFlowProgress, isWheelFlowComplete, getAvailableNavigationOptions]
  );

  // Helper to get current step name
  const getCurrentStepName = useCallback((characterState: any): string => {
    const { results, stats, quirks, powers, charDevs } = characterState;

    if (!results.race) return "Race Selection";
    if (!results.subrace && subraceMap[results.race]?.length > 0)
      return "Subrace Selection";
    if (characterState.archetypes.length === 0) return "Archetype Selection";
    if (Object.values(stats).some((stat: any) => stat === ""))
      return "Stats Rolling";
    if (quirks.length === 0) return "Quirk Selection";
    if (!results.house) return "House Selection";
    if (powers.length === 0) return "Power Selection";
    if (
      charDevs.length === 0 &&
      !characterState.archetypes.some((a: any) => a.name === "NPC 💀")
    ) {
      return "Character Development";
    }
    if (!results.pve) return "PvE Selection";

    return "Complete";
  }, []);

  // Helper to get next step name
  const getNextStepName = useCallback(
    (characterState: any): string | null => {
      const current = getCurrentStepName(characterState);

      const stepSequence = [
        "Race Selection",
        "Subrace Selection",
        "Archetype Selection",
        "Stats Rolling",
        "Quirk Selection",
        "House Selection",
        "Power Selection",
        "Character Development",
        "PvE Selection",
        "Complete",
      ];

      const currentIndex = stepSequence.indexOf(current);
      if (currentIndex === -1 || currentIndex >= stepSequence.length - 1) {
        return null;
      }

      return stepSequence[currentIndex + 1];
    },
    [getCurrentStepName]
  );

  return {
    goToStats,
    jumpToWheel,
    getNextWheel,
    isWheelFlowComplete,
    getFlowProgress,
    getHouseSpecialWheel,
    canNavigateToWheel,
    getAvailableNavigationOptions,
    handleFlowCompletion,
    resetFlow,
    getFlowStatus,
    getCurrentStepName,
    getNextStepName,
  };
};
