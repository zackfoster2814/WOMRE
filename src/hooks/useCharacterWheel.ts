import { useState, useReducer, useCallback } from "react";
import { WheelStep } from "@/Common/Types/Types.ts";
import { raceWheel } from "@/Common/Config/RaceConfig.ts";
import { quirkCountOptions, quirkList } from "@/Common/Config/QuirkConfig.ts";
import {
  gearCountWheel,
  gearWheel,
  legacyGearCountWheel,
  legacyGearWheel,
} from "@/Common/Config/GearConfig.ts";
import { enchantCountWheel } from "@/Common/Config/WeaponConfig.ts";
import { PowerWheel } from "@/Common/Config/PowerConfig.ts";
import { charDevWheel } from "@/Common/Config/CharDevConfig.ts";
import { pveWheel } from "@/Common/Config/PvEConfig.ts";
import { STAT_WHEELS } from "@/utils/wheelUtils.ts";

// Import all handlers
import { useArchetypeHandlers } from "@/hooks/handlers/useArchetypeHandlers.ts";
import { useItemHandlers } from "@/hooks/handlers/useItemHandlers.ts";
import { useRaceHandlers } from "@/hooks/handlers/useRaceHandlers.ts";
import { useFlowHandlers } from "@/hooks/handlers/useFlowHandlers.ts";
import { useGameMechanics } from "@/hooks/utils/useGameMechanics.ts";
import { useCharacterHelpers } from "@/hooks/utils/useCharacterHelpers.ts";

// Import reducer and types
import {
  characterReducer,
  initialCharacterState,
} from "@/reducers/characterReducer.ts";
import { CharacterState, CharacterAction } from "@/types/characterTypes.ts";

// const DEBUG_RESULT = "Bloodclan Berserker";

export const useCharacterWheel = () => {
  // Core state management
  const [characterState, dispatch] = useReducer(
    characterReducer,
    initialCharacterState
  );
  const [currentWheel, setCurrentWheel] = useState<WheelStep>(raceWheel);

  // Progress tracking states
  const [statStep, setStatStep] = useState(0);
  const [quirkStep, setQuirkStep] = useState(0);
  const [quirkCount, setQuirkCount] = useState(0);
  const [gearStep, setGearStep] = useState(0);
  const [gearCount, setGearCount] = useState(0);
  const [legacyGearStep, setLegacyGearStep] = useState(0);
  const [legacyGearCount, setLegacyGearCount] = useState(0);
  const [enchantStep, setEnchantStep] = useState(0);
  const [enchantCount, setEnchantCount] = useState(0);
  const [powerStep, setPowerStep] = useState(0);
  const [powerCount, setPowerCount] = useState(0);
  const [charDevStep, setCharDevStep] = useState(0);
  const [charDevMax, setCharDevMax] = useState(1);

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [dialogData, setDialogData] = useState<any>(null);

  // Initialize all handlers
  const archetypeHandlers = useArchetypeHandlers();
  const itemHandlers = useItemHandlers();
  const raceHandlers = useRaceHandlers();
  const flowHandlers = useFlowHandlers();
  const gameMechanics = useGameMechanics();
  const characterHelpers = useCharacterHelpers();

  const getFlowHandlerParams = useCallback(
    () => ({
      characterState,
      setCurrentWheel,
      setStatStep,
      statStep,
      gearCount,
    }),
    [characterState, setCurrentWheel, setStatStep, statStep, gearCount]
  );

  // Helper to transition to stats - MOVED UP BEFORE USAGE
  const goToStats = useCallback(() => {
    const params = getFlowHandlerParams();
    return flowHandlers.goToStats(params);
  }, [flowHandlers, getFlowHandlerParams]);

  // Wrapper for Noble Swordsman flow to match ItemHandlers interface
  const handleNobleSwordsmanFlowWrapper = useCallback(
    (weapon: any) => {
      const archetypeParams = {
        dispatch,
        setCurrentWheel,
        setEnchantCount,
        setEnchantStep,
        characterState,
        goToStats,
      };
      return archetypeHandlers.handleNobleSwordsmanFlow(
        weapon,
        archetypeParams
      );
    },
    [
      dispatch,
      setCurrentWheel,
      setEnchantCount,
      setEnchantStep,
      characterState,
      goToStats,
      archetypeHandlers.handleNobleSwordsmanFlow,
    ]
  );

  // Helper parameters for handlers
  const getHandlerParams = useCallback(
    () => ({
      dispatch,
      setCurrentWheel,
      setStatStep,
      characterState,
      gearStep,
      gearCount,
      setGearStep,
      legacyGearStep,
      legacyGearCount,
      setLegacyGearStep,
      enchantStep,
      enchantCount,
      setEnchantStep,
      setEnchantCount,
      statStep,
      goToStats,
      handleNobleSwordsmanFlow: handleNobleSwordsmanFlowWrapper,
    }),
    [
      dispatch,
      setCurrentWheel,
      setStatStep,
      characterState,
      gearStep,
      gearCount,
      setGearStep,
      legacyGearStep,
      legacyGearCount,
      setLegacyGearStep,
      enchantStep,
      enchantCount,
      setEnchantStep,
      setEnchantCount,
      statStep,
      goToStats,
      handleNobleSwordsmanFlowWrapper,
    ]
  );

  // Navigation function
  const jumpToWheel = useCallback(
    (wheelKey: string) => {
      const params = getFlowHandlerParams();
      return flowHandlers.jumpToWheel(wheelKey, params);
    },
    [flowHandlers, getFlowHandlerParams]
  );

  // Main flow dispatcher
  const handleNextStep = useCallback(
    (key: string, resultName: string) => {
      const handlerParams = getHandlerParams();

      // Use debug result if enabled
      // if (key === "archetype") {
      //   resultName = DEBUG_RESULT;
      // }

      switch (key) {
        // Race & Sub-race flow
        case "race":
          return raceHandlers.handleRaceSelection(resultName, handlerParams);

        case "uma-parent-1":
        case "uma-parent-2":
          return raceHandlers.handleUmaParentFlow(
            key,
            resultName,
            handlerParams
          );

        case "skeleton-lineage":
          return raceHandlers.handleSkeletonLineage(resultName, handlerParams);

        case "subrace":
          return raceHandlers.handleSubraceSelection(resultName, handlerParams);

        case "uniqueVampireTrain":
        case "vampireTaste":
          return archetypeHandlers.handleVampireFlow(
            key,
            resultName,
            handlerParams
          );

        // Archetype flow
        case "archetype": {
          const archetype = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;
          dispatch({ type: "ADD_ARCHETYPE", archetype });

          const archetypeParams = { ...handlerParams, goToStats };
          return archetypeHandlers.handleArchetypeResult(
            resultName,
            currentWheel,
            archetypeParams
          );
        }

        case "wibu":
          const archetypeParams = { ...handlerParams, goToStats };
          return archetypeHandlers.handleWibuSeriesResult(
            resultName,
            archetypeParams
          );

        // Special archetype wheels
        case "trickster-card":
        case "slayer-race":
        case "house-spy-target":
        case "demon-subrace":
          const specialParams = { ...handlerParams, goToStats };
          return archetypeHandlers.handleSpecialArchetypeWheelResult(
            key,
            resultName,
            currentWheel,
            specialParams
          );

        // Stats handling with race-specific logic
        case "strength":
        case "speed":
        case "battleIQ":
        case "martialArts":
          dispatch({ type: "SET_STAT", key, value: resultName });
          return handleRegularStatProgression(key, resultName);

        case "durability":
        case "iq":
          return (
            raceHandlers.handleRaceSpecificStats(
              key,
              resultName,
              handlerParams
            ) || handleRegularStatProgression(key, resultName)
          );

        // Quirk & House flow
        case "quirk-count":
          setQuirkCount(parseInt(resultName, 10));
          setQuirkStep(0);
          setCurrentWheel({
            key: "quirk",
            title: "Quirk",
            sections: quirkList,
          });
          break;

        case "quirk":
          return handleQuirkFlow(resultName);

        case "house":
          return handleHouseFlow(resultName);

        // Gear flow
        case "gear-count":
          setGearCount(parseInt(resultName, 10));
          setGearStep(0);
          setCurrentWheel(legacyGearCountWheel);
          break;

        case "legacy-gear-count":
          setLegacyGearCount(parseInt(resultName, 10));
          setLegacyGearStep(0);
          return handleGearCountCompletion();

        case "gear":
          return itemHandlers.handleGearFlow(
            resultName,
            currentWheel,
            handlerParams
          );

        case "legacy-gear":
          return itemHandlers.handleLegacyGearFlow(
            resultName,
            currentWheel,
            handlerParams
          );

        // Noble Swordsman special gear
        case "noble-magic-gear":
        case "noble-physical-gear":
          return itemHandlers.handleNobleGearFlow(
            key,
            resultName,
            currentWheel,
            handlerParams
          );

        // Weapon flow
        case "weapon-exist":
          return itemHandlers.handleWeaponExistFlow(resultName, handlerParams);

        case "unique-weapon-exist":
          return itemHandlers.handleUniqueWeaponExistFlow(
            resultName,
            handlerParams
          );

        case "weapon":
        case "unique-weapon":
          return itemHandlers.handleWeaponFlow(
            key,
            resultName,
            currentWheel,
            handlerParams
          );

        case "weapon-enchant-count":
          return itemHandlers.handleEnchantCountFlow(resultName, handlerParams);

        case "weapon-enchant":
          return itemHandlers.handleEnchantFlow(
            resultName,
            currentWheel,
            handlerParams
          );

        // Usability checks
        case "usabilityCheck":
          return itemHandlers.handleUsabilityCheck(resultName, handlerParams);

        // Power & Character Development
        case "power-count":
          return handlePowerCountFlow(resultName);

        case "power":
          return handlePowerFlow(resultName);

        case "char-dev":
          return handleCharDevFlow(resultName);

        // PvE
        case "pve":
          dispatch({ type: "SET_RESULT", key: "pve", value: resultName });
          break;

        default:
          if (currentWheel.onComplete) {
            currentWheel.onComplete();
          }
      }
    },
    [
      characterState,
      currentWheel,
      dispatch,
      raceHandlers,
      archetypeHandlers,
      itemHandlers,
      getHandlerParams,
      goToStats,
    ]
  );

  // Helper functions for specific flows
  const handleRegularStatProgression = useCallback(
    (key: string, resultName: string) => {
      dispatch({ type: "SET_STAT", key, value: resultName });
      const currentStatIndex = STAT_WHEELS.indexOf(key);

      if (currentStatIndex < STAT_WHEELS.length - 1) {
        const nextStatKey = STAT_WHEELS[currentStatIndex + 1];
        const params = getFlowHandlerParams();
        const nextResult = flowHandlers.jumpToWheel(nextStatKey, params);
        if (nextResult.success) {
          setStatStep(currentStatIndex + 2);
        }
      } else {
        setCurrentWheel({
          key: "quirk-count",
          title: "Quirk Count",
          sections: quirkCountOptions,
        });
      }
    },
    [dispatch, flowHandlers, getFlowHandlerParams, setStatStep, setCurrentWheel]
  );

  const handleQuirkFlow = useCallback(
    (resultName: string) => {
      const quirk = currentWheel.sections.find((s) => s.name === resultName)!;
      dispatch({ type: "ADD_QUIRK", quirk });

      if (quirkStep + 1 < quirkCount) {
        setQuirkStep(quirkStep + 1);
        setCurrentWheel({
          key: "quirk",
          title: "Quirk",
          sections: currentWheel.sections.filter((s) => s.name !== resultName),
        });
      } else {
        // Check for special house assignments
        if (
          archetypeHandlers.hasSpecialHouseAssignment(characterState.archetypes)
        ) {
          setCurrentWheel(gearCountWheel);
        } else {
          const specialHouse = raceHandlers.hasSpecialRaceHouseAssignment(
            characterState.results.race
          );
          if (specialHouse) {
            dispatch({ type: "SET_RESULT", key: "house", value: specialHouse });
            setCurrentWheel(gearCountWheel);
          } else {
            const params = getFlowHandlerParams();
            flowHandlers.jumpToWheel("house", params);
          }
        }
      }
    },
    [
      currentWheel,
      dispatch,
      quirkStep,
      quirkCount,
      setQuirkStep,
      setCurrentWheel,
      characterState,
      archetypeHandlers,
      raceHandlers,
      flowHandlers,
      getFlowHandlerParams,
    ]
  );

  const handleHouseFlow = useCallback(
    (resultName: string) => {
      dispatch({ type: "SET_RESULT", key: "house", value: resultName });

      const specialWheel = flowHandlers.getHouseSpecialWheel(resultName, () =>
        setCurrentWheel(gearCountWheel)
      );
      setCurrentWheel(specialWheel || gearCountWheel);
    },
    [dispatch, flowHandlers, setCurrentWheel]
  );

  const handleGearCountCompletion = useCallback(() => {
    if (gearCount > 0) {
      setCurrentWheel({
        key: "gear",
        title: "Gear",
        sections: gearWheel.sections,
      });
    } else if (legacyGearCount > 0) {
      setCurrentWheel({
        key: "legacy-gear",
        title: "Legacy Gear",
        sections: legacyGearWheel.sections,
      });
    } else {
      const params = getFlowHandlerParams();
      flowHandlers.jumpToWheel("weapon", params);
    }
  }, [
    gearCount,
    legacyGearCount,
    setCurrentWheel,
    flowHandlers,
    getFlowHandlerParams,
  ]);

  const handlePowerCountFlow = useCallback(
    (resultName: string) => {
      const powerCalculation = gameMechanics.calculatePowerCount(
        parseInt(resultName, 10),
        characterState
      );

      setPowerCount(powerCalculation.finalPowerCount);
      setPowerStep(0);
      setCurrentWheel({
        key: "power",
        title: "Power",
        sections: PowerWheel.sections,
      });
    },
    [
      gameMechanics,
      characterState,
      setPowerCount,
      setPowerStep,
      setCurrentWheel,
    ]
  );

  const handlePowerFlow = useCallback(
    (resultName: string) => {
      const power = currentWheel.sections.find((s) => s.name === resultName)!;
      dispatch({ type: "ADD_POWER", power });

      if (powerStep + 1 < powerCount) {
        setPowerStep(powerStep + 1);
        setCurrentWheel({
          key: "power",
          title: "Power",
          sections: PowerWheel.sections.filter(
            (p) =>
              !characterState.powers
                .concat(power)
                .find((pw) => pw.name === p.name)
          ),
        });
      } else {
        if (
          archetypeHandlers.shouldSkipCharacterDevelopment(
            characterState.archetypes
          )
        ) {
          setCharDevStep(0);
          setCharDevMax(0);
          setCurrentWheel(pveWheel);
        } else {
          const charDevMax = raceHandlers.getRaceCharDevMax(
            characterState.results.race
          );
          setCharDevStep(0);
          setCharDevMax(charDevMax);
          setCurrentWheel(charDevWheel);
        }
      }
    },
    [
      currentWheel,
      dispatch,
      powerStep,
      powerCount,
      setPowerStep,
      setCurrentWheel,
      characterState,
      archetypeHandlers,
      raceHandlers,
      setCharDevStep,
      setCharDevMax,
    ]
  );

  const handleCharDevFlow = useCallback(
    (resultName: string) => {
      const charDev = currentWheel.sections.find((s) => s.name === resultName)!;
      dispatch({ type: "ADD_CHARDEV", charDev });

      if (charDevStep + 1 < charDevMax) {
        setCharDevStep(charDevStep + 1);
        setCurrentWheel({
          key: "char-dev",
          title: "Character Development",
          sections: currentWheel.sections.filter((s) => s.name !== resultName),
        });
      } else {
        setCurrentWheel(pveWheel);
      }
    },
    [
      currentWheel,
      dispatch,
      charDevStep,
      charDevMax,
      setCharDevStep,
      setCurrentWheel,
    ]
  );

  // Character completion and data handling
  const handleGetData = useCallback(() => {
    const data = characterHelpers.getCompleteCharacterInfo(characterState);
    setDialogData(data);
    setShowDialog(true);
  }, [characterHelpers, characterState, setDialogData, setShowDialog]);

  const handleCharacterComplete = useCallback(() => {
    characterHelpers.handleCharacterExport(characterState);
    resetAll();
  }, [characterHelpers, characterState]);

  // Reset all state
  const resetAll = useCallback(() => {
    dispatch({ type: "RESET" });
    setCurrentWheel(raceWheel);
    setStatStep(0);
    setQuirkStep(0);
    setQuirkCount(0);
    setGearStep(0);
    setGearCount(0);
    setLegacyGearStep(0);
    setLegacyGearCount(0);
    setEnchantStep(0);
    setEnchantCount(0);
    setPowerStep(0);
    setPowerCount(0);
    setCharDevStep(0);
    setCharDevMax(1);
  }, [dispatch, setCurrentWheel]);

  // Next step handler (will be called by animation hook)
  const nextStep = useCallback(() => {
    // This will be handled by the animation hook callback
    // Implementation moved to handleNextStep
  }, []);

  return {
    // State
    characterState,
    currentWheel,
    statStep,
    showDialog,
    dialogData,

    // Actions
    dispatch,
    jumpToWheel,
    handleNextStep,
    nextStep,
    resetWheels: resetAll,
    handleGetData,
    handleCharacterComplete,
    setShowDialog,
    setCurrentWheel,

    // Progress tracking
    quirkStep,
    quirkCount,
    gearStep,
    gearCount,
    legacyGearStep,
    legacyGearCount,
    enchantStep,
    enchantCount,
    powerStep,
    powerCount,
    charDevStep,
    charDevMax,

    // Additional utilities from handlers
    flowStatus: flowHandlers.getFlowStatus(characterState),
    characterSummary: characterHelpers.generateCharacterSummary(characterState),
    validation: characterHelpers.validateCharacter(characterState),
    specialAbilities: gameMechanics.getSpecialAbilities(characterState),
  };
};
