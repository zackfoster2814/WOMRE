import { useCallback } from "react";
import { WheelStep } from "@/Common/Types/Types.ts";
import { raceWheel } from "@/Common/Config/RaceConfig.ts";
import { subraceMap } from "@/Common/Config/SubRaceConfig.ts";
import {
  bankaiWheel,
  dojutsuWheel,
  domainExpansionWheel,
  hakiWheel,
  standsWheel,
  wibuWheel,
} from "@/Common/Config/ArchetypeConfig.ts";
import {
  archetypeExtraWheels,
  uniqueVampireTrainWheel,
  vampireTasteWheel,
} from "@/Common/Config/ArchetypeExtraWheels.ts";
import { houseWheel } from "@/Common/Config/HouseConfig.ts";
import {
  enchantCountWheel,
  enchantWheel,
} from "@/Common/Config/WeaponConfig.ts";
import { gearWheel } from "@/Common/Config/GearConfig.ts";
import { usabilityWheel } from "@/utils/wheelUtils.ts";

// Types for archetype handlers
interface ArchetypeHandlerParams {
  dispatch: React.Dispatch<any>;
  setCurrentWheel: (wheel: WheelStep) => void;
  setEnchantCount: (count: number) => void;
  setEnchantStep: (step: number) => void;
  characterState: any;
  goToStats: () => void;
}

interface ArchetypeHandlerResult {
  shouldContinue: boolean;
  nextWheel?: WheelStep;
  message?: string;
}

export const useArchetypeHandlers = () => {
  // Helper functions for Noble Swordsman
  const getGearsByTag = useCallback((tag: string) => {
    return gearWheel.sections.filter(
      (gear: any) =>
        gear.description?.toLowerCase().includes(tag.toLowerCase()) ||
        gear.tags?.includes(tag)
    );
  }, []);

  const getWeaponTags = useCallback((weapon: any) => {
    const tags = [];
    const description = weapon.description?.toLowerCase() || ".ts";
    if (description.includes("magic")) tags.push("Magic");
    if (description.includes("physical")) tags.push("Physical");
    return tags;
  }, []);

  const handleNobleSwordsmanFlow = useCallback(
    (
      weapon: any,
      {
        setCurrentWheel,
        setEnchantCount,
        setEnchantStep,
        dispatch,
      }: ArchetypeHandlerParams
    ) => {
      const weaponTags = getWeaponTags(weapon);

      if (weaponTags.length === 0) {
        // No special tags, proceed normally
        setCurrentWheel(enchantCountWheel);
        return;
      }

      if (weaponTags.includes("Magic") && weaponTags.includes("Physical")) {
        // Both tags - auto 2 enchants, skip enchant count
        setEnchantCount(2);
        setEnchantStep(0);
        // Initialize enchants array
        dispatch({
          type: "SET_RESULT",
          key: "temp-weapon-enchants",
          value: JSON.stringify([]),
        });
        setCurrentWheel({
          key: "weapon-enchant",
          title: "Weapon Enchant (1/2)",
          sections: enchantWheel.sections,
        });
      } else if (weaponTags.includes("Magic")) {
        // Magic tag - roll magic gear
        const magicGears = getGearsByTag("Magic");
        if (magicGears.length > 0) {
          setCurrentWheel({
            key: "noble-magic-gear",
            title: "Noble Swordsman - Magic Gear",
            sections: magicGears,
          });
        } else {
          setCurrentWheel(enchantCountWheel);
        }
      } else if (weaponTags.includes("Physical")) {
        // Physical tag - roll physical gear
        const physicalGears = getGearsByTag("Physical");
        if (physicalGears.length > 0) {
          setCurrentWheel({
            key: "noble-physical-gear",
            title: "Noble Swordsman - Physical Gear",
            sections: physicalGears,
          });
        } else {
          setCurrentWheel(enchantCountWheel);
        }
      }
    },
    [getWeaponTags, getGearsByTag]
  );

  // Main archetype handler
  const handleArchetypeResult = useCallback(
    (
      resultName: string,
      currentWheel: WheelStep,
      params: ArchetypeHandlerParams
    ): ArchetypeHandlerResult => {
      const { dispatch, setCurrentWheel, goToStats } = params;

      switch (resultName) {
        case "Warrior of Sunlight":
          // Add Sacred Fire and Fair Duel powers automatically
          dispatch({
            type: "ADD_POWER",
            power: {
              id: "55",
              name: "Sacred Fire",
              effect: "Nhận +1 all stats nếu đối thủ là Vampire hoặc Demon.",
              weight: 0.9,
              color: "",
            },
          });
          dispatch({
            type: "ADD_POWER",
            power: {
              id: "65",
              name: "Fair Duel",
              effect:
                "Bạn và đối thủ miễn nhiễm với mọi hiệu ứng giảm stat từ nhau.",
              weight: 0.9,
              color: "",
            },
          });
          goToStats();
          return { shouldContinue: false };

        case "Noble Swordsman":
          // Noble Swordsman - special weapon-gear interaction
          dispatch({
            type: "SET_RESULT",
            key: "noble-swordsman-active",
            value: "true",
          });
          goToStats();
          return { shouldContinue: false };

        case "Spy":
          setCurrentWheel({
            ...houseWheel,
            key: "house-spy-target",
            title: "Target",
            onComplete: goToStats,
          });
          return { shouldContinue: false };

        case "Knight of Gods":
          // Store Holy Symbol temporarily for usability check
          const holySymbol = {
            id: "8",
            name: "Holy Symbol",
            weight: 2.78,
            color: "#FF69B4",
            description:
              "Khi combat với Demon, Vampire, Spirit, Orc, Skeleton, Goblin: đối thủ -1 all stats. (60%, Magic)",
            usableRate: 60,
          };

          dispatch({
            type: "SET_RESULT",
            key: "temp-knight-gear",
            value: JSON.stringify(holySymbol),
          });

          // Call usability wheel for Holy Symbol
          setCurrentWheel(
            usabilityWheel(holySymbol.usableRate, holySymbol.name)
          );
          return { shouldContinue: false };

        case "Dark Magician":
          dispatch({
            type: "SET_RESULT",
            key: "house",
            value: "Dark Brotherhood",
          });
          goToStats();
          return { shouldContinue: false };

        case "Bloodclan Berserker":
          // Add quirks automatically
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q56",
              name: "Cruelty",
              weight: 1.79,
              color: "#DC143C",
              description:
                "Trong combat: Khi 1 round hòa, quyết định người nhận được 1 điểm bằng vòng quay 50/50 thay vì cả 2 không nhận được điểm.",
            },
          });
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q52",
              name: "Bloodthirsty",
              weight: 1.79,
              color: "#B22222",
              description:
                "Nhận +1 MA. Trong combat: Mỗi Round thắng nhận thêm 1 điểm, Thua Round sẽ mất toàn bộ điểm đang có.",
            },
          });
          dispatch({
            type: "SET_RESULT",
            key: "house",
            value: "Beast Clan",
          });
          goToStats();
          return { shouldContinue: false };

        case "Trickster":
          const aceWheel = archetypeExtraWheels[resultName];
          if (aceWheel) {
            setCurrentWheel({
              ...aceWheel,
              key: "trickster-card",
              title: "Trickster - Ace of Spades",
              onComplete: goToStats,
            });
          } else {
            goToStats();
          }
          return { shouldContinue: false };

        case "Slayer":
          setCurrentWheel({
            ...raceWheel,
            key: "slayer-race",
            title: "Slayer - Choose Race",
            onComplete: goToStats,
          });
          return { shouldContinue: false };

        case "Guardian of Demons":
          setCurrentWheel({
            key: "demon-subrace",
            title: "Guardian of Demons - Demon Subrace",
            sections: subraceMap["Demon"],
            onComplete: goToStats,
          });
          return { shouldContinue: false };

        case "Wibu":
          setCurrentWheel(wibuWheel);
          return { shouldContinue: false };

        case "Bookworm":
          // Store Holy Symbol temporarily for usability check
          const note = {
            id: "2",
            name: "Sổ tay",
            weight: 2.78,
            color: "#FFD700",
            description: "Khi thua IQ, nhận +1 IQ (80%, Physical)",
            usableRate: 80,
            tag: "Physical",
          };

          dispatch({
            type: "SET_RESULT",
            key: "bookwormGear",
            value: JSON.stringify(note),
          });

          // Call usability wheel for Holy Symbol
          setCurrentWheel(usabilityWheel(note.usableRate, note.name));
          return { shouldContinue: false };

        default:
          // Check for other archetype extra wheels
          const extraWheel = archetypeExtraWheels[resultName];
          if (extraWheel) {
            setCurrentWheel({ ...extraWheel, onComplete: goToStats });
            return { shouldContinue: false };
          }

          // No special handling needed
          goToStats();
          return { shouldContinue: false };
      }
    },
    [handleNobleSwordsmanFlow]
  );

  // Handle Wibu series selection
  const handleWibuSeriesResult = useCallback(
    (
      resultName: string,
      params: ArchetypeHandlerParams
    ): ArchetypeHandlerResult => {
      const { dispatch, setCurrentWheel, goToStats } = params;

      dispatch({
        type: "SET_RESULT",
        key: "wibu-series",
        value: resultName,
      });

      const wibuWheels: Record<string, WheelStep> = {
        JJK: domainExpansionWheel,
        Jojo: standsWheel,
        Naruto: dojutsuWheel,
        "One Piece": hakiWheel,
        Bleach: bankaiWheel,
      };

      const nextWheel = wibuWheels[resultName];
      if (nextWheel) {
        setCurrentWheel({
          ...nextWheel,
          key: `${resultName.toLowerCase()}-extra`,
          title: `${resultName} Extra Roll`,
          onComplete: goToStats,
        });
      } else {
        goToStats();
      }

      return { shouldContinue: false };
    },
    []
  );

  // Handle special archetype wheel results
  const handleSpecialArchetypeWheelResult = useCallback(
    (
      wheelKey: string,
      resultName: string,
      currentWheel: WheelStep,
      params: ArchetypeHandlerParams
    ): ArchetypeHandlerResult => {
      const { dispatch } = params;

      switch (wheelKey) {
        case "trickster-card":
          dispatch({
            type: "SET_RESULT",
            key: "trickster-card",
            value: resultName,
          });
          if (currentWheel.onComplete) currentWheel.onComplete();
          return { shouldContinue: false };

        case "slayer-race":
          dispatch({
            type: "SET_RESULT",
            key: "slayer-race",
            value: `${resultName} Slayer`,
          });
          if (currentWheel.onComplete) currentWheel.onComplete();
          return { shouldContinue: false };

        case "house-spy-target":
          dispatch({
            type: "SET_RESULT",
            key: "house-spy-target",
            value: resultName,
          });
          if (currentWheel.onComplete) currentWheel.onComplete();
          return { shouldContinue: false };

        case "demon-subrace":
          dispatch({
            type: "SET_RESULT",
            key: "demon-subrace",
            value: resultName,
          });
          if (currentWheel.onComplete) currentWheel.onComplete();
          return { shouldContinue: false };

        default:
          if (currentWheel.onComplete) {
            currentWheel.onComplete();
          }
          return { shouldContinue: false };
      }
    },
    []
  );

  // Handle vampire special flow
  const handleVampireFlow = useCallback(
    (
      wheelKey: string,
      resultName: string,
      params: ArchetypeHandlerParams
    ): ArchetypeHandlerResult => {
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
            // Go to archetype wheel
            return { shouldContinue: true, message: "proceed-to-archetype" };
          }
          return { shouldContinue: false };

        case "vampireTaste":
          dispatch({
            type: "SET_RESULT",
            key: "vampireTaste",
            value: resultName,
          });
          return { shouldContinue: true, message: "proceed-to-archetype" };

        default:
          return { shouldContinue: true };
      }
    },
    []
  );

  // Check if archetype has special house assignment
  const hasSpecialHouseAssignment = useCallback(
    (archetypes: any[]): boolean => {
      return archetypes.some(
        (archetype: any) =>
          archetype.name === "Dark Magician" ||
          archetype.name === "Bloodclan Berserker"
      );
    },
    []
  );

  // Check if archetype affects power count
  const getArchetypePowerBonus = useCallback((archetypes: any[]): number => {
    const hasDarkMagician = archetypes.some(
      (a: any) => a.name === "Dark Magician"
    );
    return hasDarkMagician ? 2 : 0;
  }, []);

  // Check if archetype skips character development
  const shouldSkipCharacterDevelopment = useCallback(
    (archetypes: any[]): boolean => {
      return archetypes.some((archetype: any) => archetype.name === "NPC 💀");
    },
    []
  );

  return {
    handleArchetypeResult,
    handleWibuSeriesResult,
    handleSpecialArchetypeWheelResult,
    handleVampireFlow,
    handleNobleSwordsmanFlow,
    getGearsByTag,
    getWeaponTags,
    hasSpecialHouseAssignment,
    getArchetypePowerBonus,
    shouldSkipCharacterDevelopment,
  };
};
