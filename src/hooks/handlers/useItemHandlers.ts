import { useCallback } from "react";
import { WheelStep } from "@/Common/Types/Types.ts";
import { gearWheel, legacyGearWheel } from "@/Common/Config/GearConfig.ts";
import {
  enchantCountWheel,
  enchantWheel,
  weaponWheel,
  uniqueWeaponWheel,
  uniqueWeaponExistWheel,
} from "@/Common/Config/WeaponConfig.ts";
import { powerCountWheel } from "@/Common/Config/PowerConfig.ts";
import { usabilityWheel, getRaceOrSubrace } from "@/utils/wheelUtils.ts";

// Interface for weapons with enchants
interface WeaponWithEnchants {
  id?: string;
  name: string;
  weight?: number;
  color?: string;
  description?: string;
  usableRate?: number;
  enchants: any[];
  usable: boolean;
}

// Types for item handlers
interface ItemHandlerParams {
  dispatch: React.Dispatch<any>;
  setCurrentWheel: (wheel: WheelStep) => void;
  characterState: any;
  gearStep: number;
  gearCount: number;
  setGearStep: (step: number) => void;
  legacyGearStep: number;
  legacyGearCount: number;
  setLegacyGearStep: (step: number) => void;
  enchantStep: number;
  enchantCount: number;
  setEnchantStep: (step: number) => void;
  setEnchantCount: (count: number) => void;
  handleNobleSwordsmanFlow?: (weapon: any) => void;
}

interface ItemHandlerResult {
  shouldContinue: boolean;
  nextWheel?: WheelStep;
  message?: string;
}

export const useItemHandlers = () => {
  // Helper function to get enchant progress info
  const getEnchantProgress = useCallback(
    (characterState: any, enchantStep: number, enchantCount: number) => {
      const currentEnchants = JSON.parse(
        characterState.results["temp-weapon-enchants"] || "[]"
      );
      return {
        current: enchantStep,
        total: enchantCount,
        collected: currentEnchants.length,
        enchantNames: currentEnchants.map((e: any) => e.name),
      };
    },
    []
  );

  // Handle gear collection flow
  const handleGearFlow = useCallback(
    (
      resultName: string,
      currentWheel: WheelStep,
      params: ItemHandlerParams
    ): ItemHandlerResult => {
      const {
        dispatch,
        setCurrentWheel,
        gearStep,
        gearCount,
        setGearStep,
        legacyGearCount,
        characterState,
      } = params;

      const gear = currentWheel.sections.find((s) => s.name === resultName)!;

      // Roll usability wheel for gear
      if (gear.usableRate && gear.usableRate < 100) {
        // Store the gear temporarily
        dispatch({
          type: "SET_RESULT",
          key: "temp-gear",
          value: resultName,
        });
        setCurrentWheel(usabilityWheel(gear.usableRate, gear.name));
        return { shouldContinue: false };
      } else {
        // If usableRate is 100 or undefined, always usable
        dispatch({ type: "ADD_GEAR", gear: { ...gear, usable: true } });

        if (gearStep + 1 < gearCount) {
          setGearStep(gearStep + 1);
          setCurrentWheel({
            key: "gear",
            title: "Gear",
            sections: currentWheel.sections.filter(
              (s) => s.name !== resultName
            ),
          });
        } else if (legacyGearCount > 0) {
          setCurrentWheel({
            key: "legacy-gear",
            title: "Legacy Gear",
            sections: legacyGearWheel.sections,
          });
        } else {
          return { shouldContinue: true, message: "proceed-to-weapons" };
        }
        return { shouldContinue: false };
      }
    },
    []
  );

  // Handle legacy gear collection flow
  const handleLegacyGearFlow = useCallback(
    (
      resultName: string,
      currentWheel: WheelStep,
      params: ItemHandlerParams
    ): ItemHandlerResult => {
      const {
        dispatch,
        setCurrentWheel,
        legacyGearStep,
        legacyGearCount,
        setLegacyGearStep,
        characterState,
      } = params;

      const legacyGear = currentWheel.sections.find(
        (s) => s.name === resultName
      )!;

      // Roll usability wheel for legacy gear
      if (legacyGear.usableRate && legacyGear.usableRate < 100) {
        dispatch({
          type: "SET_RESULT",
          key: "temp-legacy-gear",
          value: resultName,
        });
        setCurrentWheel(usabilityWheel(legacyGear.usableRate, legacyGear.name));
        return { shouldContinue: false };
      } else {
        dispatch({
          type: "ADD_LEGACY_GEAR",
          gear: { ...legacyGear, usable: true },
        });

        if (legacyGearStep + 1 < legacyGearCount) {
          setLegacyGearStep(legacyGearStep + 1);
          setCurrentWheel({
            key: "legacy-gear",
            title: "Legacy Gear",
            sections: currentWheel.sections.filter(
              (s) => s.name !== resultName
            ),
          });
        } else {
          return { shouldContinue: true, message: "proceed-to-weapons" };
        }
        return { shouldContinue: false };
      }
    },
    []
  );

  // Handle weapon selection and processing
  const handleWeaponFlow = useCallback(
    (
      wheelKey: string,
      resultName: string,
      currentWheel: WheelStep,
      params: ItemHandlerParams
    ): ItemHandlerResult => {
      const {
        dispatch,
        setCurrentWheel,
        characterState,
        handleNobleSwordsmanFlow,
      } = params;

      const weapon = currentWheel.sections.find((s) => s.name === resultName)!;

      // Store weapon temporarily for processing
      dispatch({
        type: "SET_RESULT",
        key: "temp-current-weapon",
        value: JSON.stringify(weapon),
      });

      // Roll usability wheel for weapon
      if (weapon.usableRate && weapon.usableRate < 100) {
        dispatch({
          type: "SET_RESULT",
          key: "temp-weapon",
          value: resultName,
        });
        dispatch({
          type: "SET_RESULT",
          key: "temp-weapon-type",
          value: wheelKey,
        });
        setCurrentWheel(usabilityWheel(weapon.usableRate, weapon.name));
        return { shouldContinue: false };
      } else {
        // If usableRate is 100 or undefined, always usable
        dispatch({
          type: "SET_RESULT",
          key: "weapon-usable",
          value: "true",
        });

        // Check if Noble Swordsman archetype
        const isNobleSwordsman = characterState.archetypes.some(
          (archetype: any) => archetype.name === "Noble Swordsman"
        );

        if (isNobleSwordsman && handleNobleSwordsmanFlow) {
          handleNobleSwordsmanFlow(weapon);
        } else {
          setCurrentWheel(enchantCountWheel);
        }
        return { shouldContinue: false };
      }
    },
    []
  );

  // Handle weapon enchant count selection
  const handleEnchantCountFlow = useCallback(
    (resultName: string, params: ItemHandlerParams): ItemHandlerResult => {
      const {
        dispatch,
        setCurrentWheel,
        setEnchantCount,
        setEnchantStep,
        characterState,
      } = params;

      const eCount = parseInt(resultName, 10);
      setEnchantCount(eCount);
      setEnchantStep(0);

      // Initialize empty enchants array for the weapon
      dispatch({
        type: "SET_RESULT",
        key: "temp-weapon-enchants",
        value: JSON.stringify([]),
      });

      if (eCount > 0) {
        setCurrentWheel({
          key: "weapon-enchant",
          title: `Weapon Enchant (1/${eCount})`,
          sections: enchantWheel.sections,
        });
      } else {
        // No enchants - finalize weapon and continue
        return { shouldContinue: true, message: "finalize-weapon-no-enchants" };
      }

      return { shouldContinue: false };
    },
    []
  );

  // Handle individual enchant selection
  const handleEnchantFlow = useCallback(
    (
      resultName: string,
      currentWheel: WheelStep,
      params: ItemHandlerParams
    ): ItemHandlerResult => {
      const {
        dispatch,
        setCurrentWheel,
        enchantStep,
        enchantCount,
        setEnchantStep,
        characterState,
      } = params;

      const enchant = currentWheel.sections.find((s) => s.name === resultName)!;

      // Get current enchants and add new one
      const currentEnchants = JSON.parse(
        characterState.results["temp-weapon-enchants"] || "[]"
      );
      currentEnchants.push(enchant);

      // Update temporary enchants storage
      dispatch({
        type: "SET_RESULT",
        key: "temp-weapon-enchants",
        value: JSON.stringify(currentEnchants),
      });

      const nextEnchantStep = enchantStep + 1;
      setEnchantStep(nextEnchantStep);

      if (nextEnchantStep < enchantCount) {
        // Continue to next enchant
        setCurrentWheel({
          key: "weapon-enchant",
          title: `Weapon Enchant (${nextEnchantStep + 1}/${enchantCount})`,
          sections: currentWheel.sections.filter((s) => s.name !== resultName),
        });
        return { shouldContinue: false };
      } else {
        // All enchants collected - finalize weapon
        return {
          shouldContinue: true,
          message: "finalize-weapon-with-enchants",
        };
      }
    },
    []
  );

  // Handle Noble Swordsman special gear cases
  const handleNobleGearFlow = useCallback(
    (
      wheelKey: string,
      resultName: string,
      currentWheel: WheelStep,
      params: ItemHandlerParams
    ): ItemHandlerResult => {
      const { dispatch, setCurrentWheel } = params;

      const gear = currentWheel.sections.find((s) => s.name === resultName)!;

      // Roll usability for the special gear
      if (gear.usableRate && gear.usableRate < 100) {
        dispatch({
          type: "SET_RESULT",
          key: "temp-noble-gear",
          value: JSON.stringify(gear),
        });
        setCurrentWheel(usabilityWheel(gear.usableRate, gear.name));
      } else {
        dispatch({ type: "ADD_GEAR", gear: { ...gear, usable: true } });
        // Proceed to enchant count
        setCurrentWheel(enchantCountWheel);
      }

      return { shouldContinue: false };
    },
    []
  );

  // Handle usability check results for all item types
  const handleUsabilityCheck = useCallback(
    (resultName: string, params: ItemHandlerParams): ItemHandlerResult => {
      const {
        dispatch,
        setCurrentWheel,
        characterState,
        gearStep,
        gearCount,
        setGearStep,
        legacyGearStep,
        legacyGearCount,
        setLegacyGearStep,
        handleNobleSwordsmanFlow,
      } = params;

      const tempGear = characterState.results["temp-gear"];
      const tempLegacyGear = characterState.results["temp-legacy-gear"];
      const tempWeapon = characterState.results["temp-weapon"];
      const tempKnightGear = characterState.results["temp-knight-gear"];
      const tempNobleGear = characterState.results["temp-noble-gear"];
      const isUsable = resultName === "Dùng được";

      if (tempKnightGear) {
        // Handle Knight of Gods Holy Symbol usability
        const holySymbol = JSON.parse(tempKnightGear);
        dispatch({
          type: "ADD_GEAR",
          gear: { ...holySymbol, usable: isUsable },
        });
        dispatch({
          type: "SET_RESULT",
          key: "temp-knight-gear",
          value: "",
        });
        return { shouldContinue: true, message: "proceed-to-stats" };
      } else if (tempNobleGear) {
        // Handle Noble Swordsman special gear usability
        const nobleGear = JSON.parse(tempNobleGear);
        dispatch({
          type: "ADD_GEAR",
          gear: { ...nobleGear, usable: isUsable },
        });
        dispatch({
          type: "SET_RESULT",
          key: "temp-noble-gear",
          value: "",
        });
        // Proceed to enchant count
        setCurrentWheel(enchantCountWheel);
        return { shouldContinue: false };
      } else if (tempGear) {
        // Handle gear usability
        const gear = gearWheel.sections.find((s) => s.name === tempGear)!;
        dispatch({ type: "ADD_GEAR", gear: { ...gear, usable: isUsable } });
        dispatch({ type: "SET_RESULT", key: "temp-gear", value: "" });

        if (gearStep + 1 < gearCount) {
          setGearStep(gearStep + 1);
          setCurrentWheel({
            key: "gear",
            title: "Gear",
            sections: gearWheel.sections.filter(
              (s) =>
                !characterState.gears
                  .concat({ ...gear, usable: isUsable })
                  .find((g: { name: string }) => g.name === s.name)
            ),
          });
        } else if (legacyGearCount > 0) {
          setCurrentWheel({
            key: "legacy-gear",
            title: "Legacy Gear",
            sections: legacyGearWheel.sections,
          });
        } else {
          return { shouldContinue: true, message: "proceed-to-weapons" };
        }
        return { shouldContinue: false };
      } else if (tempLegacyGear) {
        // Handle legacy gear usability
        const legacyGear = legacyGearWheel.sections.find(
          (s) => s.name === tempLegacyGear
        )!;
        dispatch({
          type: "ADD_LEGACY_GEAR",
          gear: { ...legacyGear, usable: isUsable },
        });
        dispatch({
          type: "SET_RESULT",
          key: "temp-legacy-gear",
          value: "",
        });

        if (legacyGearStep + 1 < legacyGearCount) {
          setLegacyGearStep(legacyGearStep + 1);
          setCurrentWheel({
            key: "legacy-gear",
            title: "Legacy Gear",
            sections: legacyGearWheel.sections.filter(
              (s) =>
                !characterState.legacyGears
                  .concat({ ...legacyGear, usable: isUsable })
                  .find((g: { name: string }) => g.name === s.name)
            ),
          });
        } else {
          return { shouldContinue: true, message: "proceed-to-weapons" };
        }
        return { shouldContinue: false };
      } else if (tempWeapon) {
        // Handle weapon usability
        const weaponData = JSON.parse(
          characterState.results["temp-current-weapon"] || "{}"
        );

        dispatch({
          type: "SET_RESULT",
          key: "weapon-usable",
          value: isUsable.toString(),
        });

        // Clear temp weapon data
        dispatch({ type: "SET_RESULT", key: "temp-weapon", value: "" });
        dispatch({
          type: "SET_RESULT",
          key: "temp-weapon-type",
          value: "",
        });

        // Check if Noble Swordsman archetype
        const isNobleSwordsman = characterState.archetypes.some(
          (archetype: any) => archetype.name === "Noble Swordsman"
        );

        if (isUsable) {
          if (isNobleSwordsman && handleNobleSwordsmanFlow) {
            handleNobleSwordsmanFlow(weaponData);
          } else {
            setCurrentWheel(enchantCountWheel);
          }
          return { shouldContinue: false };
        } else {
          // Not usable - finalize weapon with no enchants and skip to power
          return { shouldContinue: true, message: "finalize-unusable-weapon" };
        }
      }

      return { shouldContinue: false };
    },
    []
  );

  // Finalize weapon with collected enchants
  const finalizeWeaponWithEnchants = useCallback(
    (params: ItemHandlerParams, hasEnchants: boolean = true): WheelStep => {
      const { dispatch, characterState } = params;

      const weaponData = JSON.parse(
        characterState.results["temp-current-weapon"] || "{}"
      );
      const isUsable = characterState.results["weapon-usable"] === "true";

      let enchants: any[] = [];
      if (hasEnchants) {
        enchants = JSON.parse(
          characterState.results["temp-weapon-enchants"] || "[]"
        );
      }

      console.log("Finalizing weapon with enchants:", enchants);

      dispatch({
        type: "ADD_WEAPON",
        weapon: {
          ...weaponData,
          usable: isUsable,
          enchants: enchants,
        } as WeaponWithEnchants,
      });

      // Clear all temp data
      dispatch({
        type: "SET_RESULT",
        key: "temp-current-weapon",
        value: "",
      });
      dispatch({ type: "SET_RESULT", key: "weapon-usable", value: "" });
      dispatch({
        type: "SET_RESULT",
        key: "temp-weapon-enchants",
        value: "",
      });

      const raceOrSubrace = getRaceOrSubrace(characterState.results);
      return powerCountWheel(raceOrSubrace);
    },
    []
  );

  // Handle weapon existence check
  const handleWeaponExistFlow = useCallback(
    (resultName: string, params: ItemHandlerParams): ItemHandlerResult => {
      const { setCurrentWheel, characterState } = params;

      if (resultName === "No Weapon") {
        const raceOrSubrace = getRaceOrSubrace(characterState.results);
        setCurrentWheel(powerCountWheel(raceOrSubrace));
        return { shouldContinue: false };
      } else {
        setCurrentWheel(uniqueWeaponExistWheel);
        return { shouldContinue: false };
      }
    },
    []
  );

  // Handle unique weapon existence check
  const handleUniqueWeaponExistFlow = useCallback(
    (resultName: string, params: ItemHandlerParams): ItemHandlerResult => {
      const { setCurrentWheel } = params;

      setCurrentWheel(resultName === "No" ? weaponWheel : uniqueWeaponWheel);
      return { shouldContinue: false };
    },
    []
  );

  return {
    handleGearFlow,
    handleLegacyGearFlow,
    handleWeaponFlow,
    handleEnchantCountFlow,
    handleEnchantFlow,
    handleNobleGearFlow,
    handleUsabilityCheck,
    handleWeaponExistFlow,
    handleUniqueWeaponExistFlow,
    finalizeWeaponWithEnchants,
    getEnchantProgress,
  };
};
