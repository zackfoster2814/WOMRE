import { useCallback } from "react";
import { WheelStep } from "@/Common/Types/Types.ts";
import {
  gearCountWheel,
  gearWheel,
  legacyGearWheel,
} from "@/Common/Config/GearConfig.ts";
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

  // Check if character is Dual Wielder
  const isDualWielder = useCallback((characterState: any): boolean => {
    return characterState.archetypes.some(
      (a: any) => a.name === "Dual Wielder"
    );
  }, []);

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

      // Check for special subraces that always have usable weapons
      const isAncientDwarf =
        characterState.results.subrace === "Cổ lùn (Ancient)";
      const isHephaestus = characterState.results.subrace === "Hephaestus";
      const isDualWielderArchetype = isDualWielder(characterState);

      // Roll usability wheel for weapon (unless special subrace or dual wielder)
      if (
        !isAncientDwarf &&
        !isHephaestus &&
        !isDualWielderArchetype &&
        weapon.usableRate &&
        weapon.usableRate < 100
      ) {
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
        // If special subrace OR Dual Wielder OR usableRate is 100 or undefined, always usable
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
    [isDualWielder]
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
        return { shouldContinue: false };
      } else {
        // No enchants - finalize weapon and continue to power
        const weaponData = JSON.parse(
          characterState.results["temp-current-weapon"] || "{}"
        );
        const isUsable = characterState.results["weapon-usable"] === "true";

        dispatch({
          type: "ADD_WEAPON",
          weapon: {
            ...weaponData,
            usable: isUsable,
            enchants: [],
          },
        });

        // Clear temp data
        dispatch({
          type: "SET_RESULT",
          key: "temp-current-weapon",
          value: "",
        });
        dispatch({ type: "SET_RESULT", key: "weapon-usable", value: "" });

        const raceOrSubrace = getRaceOrSubrace(characterState.results);
        setCurrentWheel(powerCountWheel(raceOrSubrace));
        return { shouldContinue: false };
      }
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
        const weaponData = JSON.parse(
          characterState.results["temp-current-weapon"] || "{}"
        );
        const isUsable = characterState.results["weapon-usable"] === "true";

        dispatch({
          type: "ADD_WEAPON",
          weapon: {
            ...weaponData,
            usable: isUsable,
            enchants: currentEnchants,
          },
        });

        // Clear temp data
        dispatch({ type: "SET_RESULT", key: "temp-current-weapon", value: "" });
        dispatch({ type: "SET_RESULT", key: "weapon-usable", value: "" });
        dispatch({
          type: "SET_RESULT",
          key: "temp-weapon-enchants",
          value: "",
        });

        const raceOrSubrace = getRaceOrSubrace(characterState.results);
        setCurrentWheel(powerCountWheel(raceOrSubrace));
        return { shouldContinue: false };
      }
    },
    []
  );

  // Finalize weapon and handle Dual Wielder logic
  const finalizeCurrentWeapon = useCallback(
    (params: ItemHandlerParams): ItemHandlerResult => {
      const { dispatch, setCurrentWheel, characterState } = params;

      const weaponData = JSON.parse(
        characterState.results["temp-current-weapon"] || "{}"
      );
      const isUsable = characterState.results["weapon-usable"] === "true";
      const enchants = JSON.parse(
        characterState.results["temp-weapon-enchants"] || "[]"
      );

      // Add weapon to character
      dispatch({
        type: "ADD_WEAPON",
        weapon: {
          ...weaponData,
          usable: isUsable,
          enchants: enchants,
        } as WeaponWithEnchants,
      });

      // Clear temp data
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

      // Check if Dual Wielder needs second weapon
      if (isDualWielder(characterState)) {
        const currentWeaponCount = characterState.weapons.length + 1; // +1 for weapon just added

        if (currentWeaponCount === 1) {
          // First weapon done, need second weapon
          const hasUniqueWeapon =
            characterState.weapons.some((w: any) =>
              uniqueWeaponWheel.sections.some((uw) => uw.name === w.name)
            ) ||
            uniqueWeaponWheel.sections.some(
              (uw) => uw.name === weaponData.name
            );

          if (hasUniqueWeapon) {
            // Already has unique weapon, second must be normal
            setCurrentWheel({
              key: "dual-wielder-weapon-2",
              title: "Dual Wielder - Weapon 2 (Normal)",
              sections: weaponWheel.sections.filter(
                (w) =>
                  !characterState.weapons.some(
                    (cw: any) => cw.name === w.name
                  ) && w.name !== weaponData.name
              ),
            });
          } else {
            // No unique weapon yet, can choose from both
            const allWeapons = [
              ...weaponWheel.sections,
              ...uniqueWeaponWheel.sections,
            ].filter(
              (w) =>
                !characterState.weapons.some((cw: any) => cw.name === w.name) &&
                w.name !== weaponData.name
            );

            setCurrentWheel({
              key: "dual-wielder-weapon-2",
              title: "Dual Wielder - Weapon 2",
              sections: allWeapons,
            });
          }
          return { shouldContinue: false };
        }
      }

      // Normal flow - proceed to power
      const raceOrSubrace = getRaceOrSubrace(characterState.results);
      setCurrentWheel(powerCountWheel(raceOrSubrace));
      return { shouldContinue: false };
    },
    [isDualWielder]
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
      const tempArcGear = characterState.results["temp-arc-gear"];
      const tempArcWeap = characterState.results["temp-arc-weap"];
      const tempNobleGear = characterState.results["temp-noble-gear"];
      const isUsable = resultName === "Dùng được";
      const tempAshinaWeapon = characterState.results["temp-ashina-weapon"];

      if (tempArcGear) {
        // Handle Knight of Gods Holy Symbol usability
        const tgear = JSON.parse(tempArcGear);
        dispatch({
          type: "ADD_GEAR",
          gear: { ...tgear, usable: isUsable },
        });
        dispatch({
          type: "SET_RESULT",
          key: "temp-knight-gear",
          value: "",
        });
        return { shouldContinue: true, message: "proceed-to-stats" };
      } else if (tempArcWeap) {
        // Handle Knight of Gods Holy Symbol usability
        const weap = JSON.parse(tempArcWeap);
        dispatch({
          type: "ADD_WEAPON",
          weapon: { ...weap, usable: isUsable },
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
          // Not usable - finalize weapon with no enchants
          return finalizeCurrentWeapon(params);
        }
      } else if (tempAshinaWeapon) {
        // Handle Ashina Clan Uchigatana usability
        const uchigatana = JSON.parse(tempAshinaWeapon);
        dispatch({
          type: "ADD_WEAPON",
          weapon: { ...uchigatana, usable: isUsable },
        });
        dispatch({
          type: "SET_RESULT",
          key: "temp-ashina-weapon",
          value: "",
        });
        // Continue to gear count
        setCurrentWheel(gearCountWheel);
        return { shouldContinue: false };
      }

      return { shouldContinue: false };
    },
    [finalizeCurrentWeapon]
  );

  // Handle weapon existence check
  const handleWeaponExistFlow = useCallback(
    (resultName: string, params: ItemHandlerParams): ItemHandlerResult => {
      const { setCurrentWheel, characterState } = params;

      // Check for special cases
      const isHephaestus = characterState.results.subrace === "Hephaestus";
      const isDualWielderArchetype = isDualWielder(characterState);

      if (
        resultName === "No Weapon" &&
        !isHephaestus &&
        !isDualWielderArchetype
      ) {
        const raceOrSubrace = getRaceOrSubrace(characterState.results);
        setCurrentWheel(powerCountWheel(raceOrSubrace));
        return { shouldContinue: false };
      } else {
        if (isHephaestus) {
          // Hephaestus always gets unique weapon, skip unique weapon exist check
          setCurrentWheel(uniqueWeaponWheel);
        } else if (isDualWielderArchetype) {
          // Dual Wielder gets guaranteed weapons, check for unique weapon first
          setCurrentWheel({
            key: "dual-wielder-weapon-1",
            title: "Dual Wielder - Weapon 1",
            sections: [...weaponWheel.sections, ...uniqueWeaponWheel.sections],
          });
        } else {
          setCurrentWheel(uniqueWeaponExistWheel);
        }
        return { shouldContinue: false };
      }
    },
    [isDualWielder]
  );

  // Handle unique weapon existence check
  const handleUniqueWeaponExistFlow = useCallback(
    (resultName: string, params: ItemHandlerParams): ItemHandlerResult => {
      const { setCurrentWheel, characterState } = params;

      // Check for Hephaestus subrace - this should not be reached for Hephaestus
      const isHephaestus = characterState.results.subrace === "Hephaestus";

      if (isHephaestus) {
        // Safety check - should go directly to unique weapon
        setCurrentWheel(uniqueWeaponWheel);
      } else {
        setCurrentWheel(resultName === "No" ? weaponWheel : uniqueWeaponWheel);
      }
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
    finalizeCurrentWeapon,
    getEnchantProgress,
    isDualWielder,
  };
};
