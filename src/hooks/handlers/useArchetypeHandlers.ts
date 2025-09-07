import { useCallback } from "react";
import { WheelStep } from "@/Common/Types/Types";
import { raceWheel, raceWheelBalance } from "@/Common/Config/RaceConfig";
import { subraceMap } from "@/Common/Config/SubRaceConfig";
import {
  bankaiWheel,
  dojutsuWheel,
  domainExpansionWheel,
  hakiWheel,
  standsWheel,
  wibuWheel,
} from "@/Common/Config/ArchetypeConfig";
import {
  archetypeExtraWheels,
  heroXWheel,
  uniqueVampireTrainWheel,
  vampireTasteWheel,
} from "@/Common/Config/ArchetypeExtraWheels";
import { houseWheel } from "@/Common/Config/HouseConfig";
import { enchantCountWheel, enchantWheel } from "@/Common/Config/WeaponConfig";
import { gearWheel } from "@/Common/Config/GearConfig";
import { usabilityWheel } from "@/utils/wheelUtils";
import { quirkCountOptions } from "@/Common/Config/QuirkConfig";
import halberd from "@/assets/Weapon/halberd.png";
import hiddenBlade from "@/assets/Weapon/hidden_blade.png";

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
    const description = weapon.description?.toLowerCase() || "";
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
            key: "temp-arc-gear", // Store temporarily
            value: JSON.stringify(holySymbol),
          });

          // Call usability wheel for Holy Symbol
          setCurrentWheel(
            usabilityWheel(holySymbol.usableRate, holySymbol.name)
          );
          return { shouldContinue: false };
        case "Noble Swordsman": // need to check
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
            ...raceWheelBalance,
            key: "slayer-race",
            title: "Slayer - Choose Race",
            onComplete: goToStats,
          });
          return { shouldContinue: false };
        case "X":
          setCurrentWheel({
            key: "x",
            title: "X",
            sections: heroXWheel.sections,
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
            key: "temp-arc-gear", // Store temporarily
            value: JSON.stringify(note),
          });

          // Call usability wheel for Holy Symbol
          setCurrentWheel(usabilityWheel(note.usableRate, note.name));
          return { shouldContinue: false };
        case "Bard":
          // Bard rolls for instrumental (36% chance)
          setCurrentWheel({
            key: "bard-instrumental",
            title: "Bard - Instrumental Check",
            sections: [
              {
                id: "has-instrumental",
                name: "Có nhạc cụ",
                weight: 36,
                color: "#FFD700",
              },
              {
                id: "no-instrumental",
                name: "Không có nhạc cụ",
                weight: 64,
                color: "#696969",
              },
            ],
          });
          return { shouldContinue: false };
        case "Paladin":
          dispatch({
            type: "ADD_POWER",
            power: {
              id: "11",
              name: "Divine Smite",
              effect:
                "Nhận +1 Điểm nếu thắng ở Round MA. Xảy ra sau cùng, sau khi 'Kiếm Phái Ashina'.",
              weight: 0.9,
              color: "",
            },
          });
          goToStats();
          return { shouldContinue: false };
        case "Lancer":
          const halb = {
            id: "19",
            name: "Halberd",
            weight: 5,
            color: "#FFD700",
            description:
              "Nếu Str >7: usable+25%. Thắng round Str: +1 BIQ, +1MA. (40%, Physical)",
            image: halberd,
            usableRate: 40,
            tag: "Physical",
          };

          dispatch({
            type: "SET_RESULT",
            key: "temp-arc-weap", // Store temporarily
            value: JSON.stringify(halb),
          });
          // Call usability wheel for Holy Symbol
          setCurrentWheel(usabilityWheel(halb.usableRate, halb.name));
          return { shouldContinue: false };
        case "Assassins":
          const hb = {
            id: "14",
            name: "Hidden Blade",
            weight: 5,
            color: "#FFD700",
            description:
              "+1 Speed, Power 'Critical Strike'. Nếu Archetype 'Assassins' → always usable. (55%, Physical)",
            image: hiddenBlade,
            usableRate: 55,
            tag: "Physical",
          };

          dispatch({
            type: "SET_RESULT",
            key: "temp-arc-weap", // Store temporarily
            value: JSON.stringify(hb),
          });

          // Call usability wheel for Holy Symbol
          setCurrentWheel(usabilityWheel(hb.usableRate, hb.name));
          return { shouldContinue: false };
        case "Mid":
          // Handle Mid archetype - all stats = 5, skip stat rolling
          return handleMidArchetypeFlow(params);
        case "Hero of the Emirate":
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q36",
              name: "Thích ăn Rau",
              weight: 1.79,
              color: "#ADFF2F",
              description: "Good 🍀",
            },
          });
          dispatch({
            type: "ADD_POWER",
            power: {
              id: "36",
              name: "Railroad Realm",
              effect:
                "Trong Combat: Bạn và đối thủ sẽ nghe tiếng xình xịch của những đoàn tàu xe lửa 🍀",
              weight: 0.9,
              color: "",
            },
          });
          goToStats();
          return { shouldContinue: false };
        case "Fisher":
          // Store Holy Symbol temporarily for usability check
          const fishingRod = {
            id: "1",
            name: "Fishing Rod",
            weight: 2.78,
            color: "#A2D149",
            description: "Sau 1 trận PvE, nhận 1 PvP Reward. (80%, Physical)",
            usableRate: 80,
            tag: "Physical",
          };

          dispatch({
            type: "SET_RESULT",
            key: "temp-arc-gear", // Store temporarily
            value: JSON.stringify(fishingRod),
          });

          // Call usability wheel for Holy Symbol
          setCurrentWheel(
            usabilityWheel(fishingRod.usableRate, fishingRod.name)
          );
          return { shouldContinue: false };
        case "Linh Mục":
          dispatch({
            type: "ADD_POWER",
            power: {
              id: "98",
              name: "Analysis Sins",
              effect:
                "Trong Combat: Khi đối đầu với Demon, Vampire, Spirit, Orc, Skeleton và Goblin, nhận +1 IQ và +1 Strength",
              weight: 0.9,
              color: "",
            },
          });
          goToStats();
          return { shouldContinue: false };
        case "Cha Xứ":
          dispatch({
            type: "ADD_POWER",
            power: {
              id: "99",
              name: "Cleaning Sins",
              effect:
                "Trong Combat: Khi đối đầu với Demon, Vampire, Spirit, Orc, Skeleton và Goblin, nhận +1 BIQ và +1 Dura",
              weight: 0.9,
              color: "",
            },
          });
          goToStats();
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
  const handleMidArchetypeFlow = useCallback(
    (params: ArchetypeHandlerParams): ArchetypeHandlerResult => {
      const { dispatch, setCurrentWheel, characterState } = params;

      // Set all stats to 5, except for Skeleton race where IQ stays 1
      const isSkeletonRace = characterState.results.race === "Skeleton";

      dispatch({ type: "SET_STAT", key: "strength", value: "5" });
      dispatch({ type: "SET_STAT", key: "speed", value: "5" });
      dispatch({ type: "SET_STAT", key: "durability", value: "5" });
      dispatch({
        type: "SET_STAT",
        key: "iq",
        value: isSkeletonRace ? "1" : "5",
      });
      dispatch({ type: "SET_STAT", key: "battleIQ", value: "5" });
      dispatch({ type: "SET_STAT", key: "martialArts", value: "5" });

      // Skip stats wheels and go directly to quirks
      setCurrentWheel({
        key: "quirk-count",
        title: "Quirk Count",
        sections: quirkCountOptions,
      });

      return { shouldContinue: false };
    },
    []
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
    shouldSkipCharacterDevelopment,
  };
};
