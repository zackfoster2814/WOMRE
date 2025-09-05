import { useState, useReducer, useCallback } from "react";
import { Section, WheelStep } from "@/Common/Types/Types.ts";
import { raceConfig, raceWheel } from "@/Common/Config/RaceConfig.ts";
import { subraceMap } from "@/Common/Config/SubRaceConfig.ts";
import {
  archetypeWheel,
  bankaiWheel,
  dojutsuWheel,
  domainExpansionWheel,
  hakiWheel,
  standsWheel,
  wibuWheel,
} from "@/Common/Config/ArchetypeConfig.ts";
import {
  getStatWheel,
  getRaceOrSubrace,
  usabilityWheel,
  STAT_WHEELS,
} from "@/utils/wheelUtils.ts";
import {
  archetypeExtraWheels,
  uniqueVampireTrainWheel,
  vampireTasteWheel,
} from "@/Common/Config/ArchetypeExtraWheels.ts";
import { quirkCountOptions, quirkList } from "@/Common/Config/QuirkConfig.ts";
import { houseWheel } from "@/Common/Config/HouseConfig.ts";
import {
  ashinaSwordWheel,
  dessendreSkillWheel,
  goldenOrderRuneWheel,
  starkWolfWheel,
} from "@/Common/Config/HouseExtraWheels.ts";
import {
  gearCountWheel,
  gearWheel,
  legacyGearCountWheel,
  legacyGearWheel,
} from "@/Common/Config/GearConfig.ts";
import {
  enchantCountWheel,
  enchantWheel,
  uniqueWeaponExistWheel,
  uniqueWeaponWheel,
  weaponExistWheel,
  weaponWheel,
} from "@/Common/Config/WeaponConfig.ts";
import { powerCountWheel, PowerWheel } from "@/Common/Config/PowerConfig.ts";
import { charDevWheel } from "@/Common/Config/CharDevConfig.ts";
import { pveWheel } from "@/Common/Config/PvEConfig.ts";
import { exportCharacter } from "@/Common/exportCharacter.ts";

// New interface for weapons with enchants
interface WeaponWithEnchants extends Section {
  enchants: string[];
  usable: boolean;
}

// Types
interface CharacterState {
  results: Record<string, string>;
  stats: Record<string, string>;
  quirks: Section[];
  gears: Section[];
  legacyGears: Section[];
  weapons: WeaponWithEnchants[]; // Updated to support enchants
  enchants: Section[];
  powers: Section[];
  charDevs: any[];
  archetypes: any[];
  characterName: string;
}

type Action =
  | { type: "SET_RESULT"; key: string; value: string }
  | { type: "SET_STAT"; key: string; value: string }
  | { type: "ADD_QUIRK"; quirk: Section }
  | { type: "ADD_GEAR"; gear: Section }
  | { type: "ADD_LEGACY_GEAR"; gear: Section }
  | { type: "ADD_WEAPON"; weapon: WeaponWithEnchants } // Updated type
  | { type: "ADD_ENCHANT"; enchant: Section }
  | { type: "ADD_POWER"; power: Section }
  | { type: "SET_CHARACTER_NAME"; name: string }
  | { type: "ADD_CHARDEV"; charDev: Section }
  | { type: "ADD_ARCHETYPE"; archetype: Section }
  | { type: "RESET" };

// Initial state
const initialState: CharacterState = {
  results: {},
  stats: {
    strength: "",
    speed: "",
    durability: "",
    iq: "",
    battleIQ: "",
    martialArts: "",
  },
  quirks: [],
  gears: [],
  legacyGears: [],
  weapons: [],
  enchants: [],
  powers: [],
  charDevs: [],
  archetypes: [],
  characterName: "",
};

const DEBUG_RESULT = "Bloodclan Berserker";

// Reducer
function characterReducer(
  state: CharacterState,
  action: Action
): CharacterState {
  switch (action.type) {
    case "SET_RESULT":
      return {
        ...state,
        results: { ...state.results, [action.key]: action.value },
      };
    case "SET_STAT":
      return {
        ...state,
        stats: { ...state.stats, [action.key]: action.value },
      };
    case "ADD_QUIRK":
      return { ...state, quirks: [...state.quirks, action.quirk] };
    case "ADD_GEAR":
      return { ...state, gears: [...state.gears, action.gear] };
    case "ADD_LEGACY_GEAR":
      return { ...state, legacyGears: [...state.legacyGears, action.gear] };
    case "ADD_WEAPON":
      return { ...state, weapons: [...state.weapons, action.weapon] };
    case "ADD_ENCHANT":
      return { ...state, enchants: [...state.enchants, action.enchant] };
    case "ADD_POWER":
      return { ...state, powers: [...state.powers, action.power] };
    case "SET_CHARACTER_NAME":
      return { ...state, characterName: action.name };
    case "ADD_CHARDEV":
      return {
        ...state,
        charDevs: [...state.charDevs, action.charDev],
      };
    case "ADD_ARCHETYPE":
      return {
        ...state,
        archetypes: [...state.archetypes, action.archetype],
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export const useCharacterWheel = () => {
  // Core state
  const [characterState, dispatch] = useReducer(characterReducer, initialState);
  const [currentWheel, setCurrentWheel] = useState<WheelStep>(raceWheel);

  // Progress tracking
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

  // Helper function to get enchant progress info
  const getEnchantProgress = useCallback(() => {
    const currentEnchants = JSON.parse(
      characterState.results["temp-weapon-enchants"] || "[]"
    );
    return {
      current: enchantStep,
      total: enchantCount,
      collected: currentEnchants.length,
      enchantNames: currentEnchants.map((e: any) => e.name),
    };
  }, [characterState.results, enchantStep, enchantCount]);

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
    (weapon: any) => {
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
    [getWeaponTags, getGearsByTag, setEnchantCount, setEnchantStep]
  );

  // Navigation function for clicking labels
  const jumpToWheel = useCallback(
    (wheelKey: string) => {
      const { results } = characterState;
      const raceOrSubrace = getRaceOrSubrace(results);
      switch (wheelKey) {
        case "race":
          setCurrentWheel(raceWheel);
          break;
        case "subrace":
          if (results.race && subraceMap[results.race]) {
            setCurrentWheel({
              key: "subrace",
              title: raceConfig[results.race]?.subrace || "Subrace",
              sections: subraceMap[results.race],
            });
          }
          break;
        case "archetype":
          if (results.race) {
            setCurrentWheel(archetypeWheel);
          }
          break;
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
            }
          }
          break;
        case "quirk":
          if (statStep >= STAT_WHEELS.length) {
            setCurrentWheel({
              key: "quirk-count",
              title: "Quirk Count",
              sections: quirkCountOptions,
            });
          }
          break;
        case "house":
          if (
            characterState.quirks.length > 0 ||
            statStep >= STAT_WHEELS.length
          ) {
            setCurrentWheel(houseWheel);
          }
          break;
        case "gear":
          setCurrentWheel(gearCountWheel);
          break;
        case "weapon":
          setCurrentWheel(weaponExistWheel);
          break;
        case "power":
          if (raceOrSubrace) {
            setCurrentWheel(PowerWheel);
          }
          break;
        case "charDev":
          setCurrentWheel(charDevWheel);
          break;
        case "pve":
          setCurrentWheel(pveWheel);
          break;
      }
    },
    [characterState, statStep, gearCount]
  );

  // Helper to get complete character info
  const getCompleteCharacterInfo = useCallback(() => {
    return {
      name: characterState.characterName,
      race: characterState.results.race,
      subrace: characterState.results.subrace,
      archetype: characterState.results.archetype,
      stats: characterState.stats,
      quirks: characterState.quirks.map((q) => q.name),
      house: characterState.results.house,
      gears: characterState.gears.map((g) => ({
        name: g.name,
        usable: g.usable,
      })),
      legacyGears: characterState.legacyGears.map((g) => ({
        name: g.name,
        usable: g.usable,
      })),
      weapons: characterState.weapons.map((w) => ({
        name: w.name,
        usable: w.usable,
        enchants: w.enchants || [],
      })),
      enchants: characterState.enchants.map((e) => e.name),
      powers: characterState.powers.map((p) => p.name),
      charDevs: characterState.charDevs.map((c) => c.name),
      pve: characterState.results.pve,
      // Additional archetype results
      trickstersCard: characterState.results["trickster-card"],
      slayerRace: characterState.results["slayer-race"],
      demonSubrace: characterState.results["demon-subrace"],
      maraisRace1: characterState.results["marais-race-1"],
      maraisRace2: characterState.results["marais-race-2"],
      goldenOrderRune: characterState.results["golden-order-rune"],
      starkWolf: characterState.results["stark-wolf"],
      ashinaSword: characterState.results["ashina-sword"],
      dessendreSkill: characterState.results["dessendre-skill"],
      houseSpyTarget: characterState.results["house-spy-target"],
    };
  }, [characterState]);

  const handleGetData = useCallback(() => {
    const data = getCompleteCharacterInfo();
    setDialogData(data);
    setShowDialog(true);
  }, [getCompleteCharacterInfo]);

  // Flow management - Main handler for wheel progression
  const handleNextStep = useCallback(
    (key: string, resultName: string) => {
      const { results } = characterState;

      // Helper to transition to stats
      const goToStats = () => {
        const raceOrSubrace = getRaceOrSubrace(results);
        if (!raceOrSubrace) return;
        const firstWheel = getStatWheel(raceOrSubrace, STAT_WHEELS[0]);
        if (firstWheel) {
          setCurrentWheel(firstWheel);
          setStatStep(1);
        }
      };

      switch (key) {
        // Race & Sub-race flow
        case "race":
          dispatch({ type: "SET_RESULT", key: "race", value: resultName });
          if (resultName === "Skeleton") {
            setCurrentWheel({
              ...raceWheel,
              key: "skeleton-lineage",
              title: "Skeleton Lineage",
              sections: raceWheel.sections.filter((s) => s.name !== "Skeleton"),
            });
          } else if (resultName === "Uma") {
            setCurrentWheel({
              key: "uma-parent-1",
              title: "Uma Parent Race 1",
              sections: subraceMap["Uma"],
            });
          } else if (resultName === "Angel") {
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
          } else if (subraceMap[resultName]?.length > 0) {
            setCurrentWheel({
              key: "subrace",
              title: raceConfig[resultName]?.subrace || "Subrace",
              sections: subraceMap[resultName],
            });
          } else {
            setCurrentWheel(archetypeWheel);
          }
          break;

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
          break;

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
          break;

        case "skeleton-lineage":
          dispatch({ type: "SET_RESULT", key: "subrace", value: resultName });
          setCurrentWheel(archetypeWheel);
          break;

        case "subrace":
          dispatch({ type: "SET_RESULT", key: "subrace", value: resultName });
          if (characterState.results.race === "Vampire") {
            setCurrentWheel({
              ...uniqueVampireTrainWheel,
              key: "uniqueVampireTrain",
              title: "Unique Taste Train",
            });
          } else {
            setCurrentWheel(archetypeWheel);
          }
          break;

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
          break;

        case "vampireTaste":
          dispatch({
            type: "SET_RESULT",
            key: "vampireTaste",
            value: resultName,
          });
          setCurrentWheel(archetypeWheel);
          break;

        // Archetype
        case "archetype": {
          const archetype = currentWheel.sections.find(
            // (s) => s.name === resultName
            (s) => s.name === DEBUG_RESULT
          )!;
          dispatch({ type: "ADD_ARCHETYPE", archetype });

          resultName = DEBUG_RESULT;

          // Special archetype power assignments
          if (resultName === "Warrior of Sunlight") {
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
          } else if (resultName === "Noble Swordsman") {
            // Noble Swordsman - special weapon-gear interaction
            dispatch({
              type: "SET_RESULT",
              key: "noble-swordsman-active",
              value: "true",
            });
            goToStats();
          } else if (resultName === "Spy") {
            setCurrentWheel({
              ...houseWheel,
              key: "house-spy-target",
              title: "Target",
              onComplete: goToStats,
            });
          } else if (resultName === "Knight of Gods") {
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
          } else if (resultName === "Trickster") {
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
          } else if (resultName === "Slayer") {
            setCurrentWheel({
              ...raceWheel,
              key: "slayer-race",
              title: "Slayer - Choose Race",
              onComplete: goToStats,
            });
          } else if (resultName === "Guardian of Demons") {
            setCurrentWheel({
              key: "demon-subrace",
              title: "Guardian of Demons - Demon Subrace",
              sections: subraceMap["Demon"],
              onComplete: goToStats,
            });
          } else if (resultName === "Wibu") {
            setCurrentWheel(wibuWheel);
          } else if (resultName === "Dark Magician") {
            dispatch({
              type: "SET_RESULT",
              key: "house",
              value: "Dark Brotherhood",
            });
            goToStats();
          } else if (resultName === "Bloodclan Berserker") {
            // Add Sacred Fire and Fair Duel powers automatically
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
          } else {
            const extraWheel = archetypeExtraWheels[resultName];
            if (extraWheel) {
              setCurrentWheel({ ...extraWheel, onComplete: goToStats });
            } else {
              goToStats();
            }
          }
          break;
        }

        case "wibu":
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
          break;

        // Handle special archetype wheels results
        case "trickster-card":
          dispatch({
            type: "SET_RESULT",
            key: "trickster-card",
            value: resultName,
          });
          if (currentWheel.onComplete) currentWheel.onComplete();
          break;

        case "slayer-race":
          dispatch({
            type: "SET_RESULT",
            key: "slayer-race",
            value: `${resultName} Slayer`,
          });
          if (currentWheel.onComplete) currentWheel.onComplete();
          break;

        case "house-spy-target":
          dispatch({
            type: "SET_RESULT",
            key: "house-spy-target",
            value: resultName,
          });
          if (currentWheel.onComplete) currentWheel.onComplete();
          break;

        // Noble Swordsman special gear cases
        case "noble-magic-gear":
        case "noble-physical-gear": {
          const gear = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;

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
          break;
        }

        // Stats (Strength, Speed, Durability, IQ, Battle IQ, Martial Arts)
        case "strength":
        case "speed":
        case "battleIQ":
        case "martialArts":
          dispatch({ type: "SET_STAT", key, value: resultName });
          const currentStatIndex = STAT_WHEELS.indexOf(key);
          if (currentStatIndex < STAT_WHEELS.length - 1) {
            // Next stat
            const nextStatKey = STAT_WHEELS[currentStatIndex + 1];
            const raceOrSubrace = getRaceOrSubrace(results);
            const nextWheel = getStatWheel(raceOrSubrace, nextStatKey);
            if (nextWheel) {
              setCurrentWheel(nextWheel);
              setStatStep(currentStatIndex + 2);
            }
          } else {
            // Stats complete, go to Quirk Count
            setCurrentWheel({
              key: "quirk-count",
              title: "Quirk Count",
              sections: quirkCountOptions,
            });
          }
          break;

        case "durability":
          dispatch({ type: "SET_STAT", key, value: resultName });
          const durabilityIndex = STAT_WHEELS.indexOf("durability");
          const raceOrSubrace = getRaceOrSubrace(results);

          // Check if Skeleton race
          if (results.race === "Skeleton") {
            // Skip IQ for Skeleton, set it to 1 automatically
            dispatch({ type: "SET_STAT", key: "iq", value: "1" });
            // Go directly to Battle IQ
            const battleIQWheel = getStatWheel(raceOrSubrace, "battleIQ");
            if (battleIQWheel) {
              setCurrentWheel(battleIQWheel);
              setStatStep(STAT_WHEELS.indexOf("battleIQ") + 1);
            }
          } else {
            // Normal flow - go to IQ
            const nextWheel = getStatWheel(raceOrSubrace, "iq");
            if (nextWheel) {
              setCurrentWheel(nextWheel);
              setStatStep(durabilityIndex + 2);
            }
          }
          break;

        case "iq":
          // This should only be reached by non-Skeleton races
          dispatch({ type: "SET_STAT", key: "iq", value: resultName });
          const iqIndex = STAT_WHEELS.indexOf("iq");
          if (iqIndex < STAT_WHEELS.length - 1) {
            const nextStatKey = STAT_WHEELS[iqIndex + 1];
            const raceOrSubrace = getRaceOrSubrace(results);
            const nextWheel = getStatWheel(raceOrSubrace, nextStatKey);
            if (nextWheel) {
              setCurrentWheel(nextWheel);
              setStatStep(iqIndex + 2);
            }
          } else {
            setCurrentWheel({
              key: "quirk-count",
              title: "Quirk Count",
              sections: quirkCountOptions,
            });
          }
          break;

        // Quirk & House
        case "quirk-count":
          const count = parseInt(resultName, 10);
          setQuirkCount(count);
          setQuirkStep(0);
          setCurrentWheel({
            key: "quirk",
            title: "Quirk",
            sections: quirkList,
          });
          break;

        case "quirk":
          const quirk = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;
          dispatch({ type: "ADD_QUIRK", quirk });
          if (quirkStep + 1 < quirkCount) {
            setQuirkStep(quirkStep + 1);
            setCurrentWheel({
              key: "quirk",
              title: "Quirk",
              sections: currentWheel.sections.filter(
                (s) => s.name !== resultName
              ),
            });
          } else {
            // Check for special archetype house assignments
            const hasSpecialArchetype = characterState.archetypes.some(
              (archetype: any) =>
                archetype.name === "Dark Magician" ||
                archetype.name === "Bloodclan Berserker"
            );

            if (hasSpecialArchetype) {
              setCurrentWheel(gearCountWheel);
            } else if (characterState.results.race === "Uma") {
              // Bỏ qua roll House, set trực tiếp "Tracen Academy"
              dispatch({
                type: "SET_RESULT",
                key: "house",
                value: "Tracen Academy",
              });
              setCurrentWheel(gearCountWheel);
            } else {
              setCurrentWheel(houseWheel);
            }
          }
          break;

        case "house":
          dispatch({ type: "SET_RESULT", key: "house", value: resultName });
          // House special wheels
          const houseSpecialWheels: Record<string, WheelStep> = {
            "House Stark": {
              ...starkWolfWheel,
              onComplete: () => setCurrentWheel(gearCountWheel),
            },
            "Golden Order": {
              ...goldenOrderRuneWheel,
              onComplete: () => setCurrentWheel(gearCountWheel),
            },
            "Ashina Clan": {
              ...ashinaSwordWheel,
              onComplete: () => setCurrentWheel(gearCountWheel),
            },
            "Dessendre Family": {
              ...dessendreSkillWheel,
              onComplete: () => setCurrentWheel(gearCountWheel),
            },
          };
          setCurrentWheel(houseSpecialWheels[resultName] || gearCountWheel);
          break;

        // Gear & Legacy Gear
        case "gear-count":
          setGearCount(parseInt(resultName, 10));
          setGearStep(0);
          setCurrentWheel(legacyGearCountWheel);
          break;

        case "legacy-gear-count":
          setLegacyGearCount(parseInt(resultName, 10));
          setLegacyGearStep(0);
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
            setCurrentWheel(weaponExistWheel);
          }
          break;

        case "gear": {
          const gear = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;

          // Roll usability wheel for gear
          if (gear.usableRate && gear.usableRate < 100) {
            // Store the gear temporarily
            dispatch({
              type: "SET_RESULT",
              key: "temp-gear",
              value: resultName,
            });
            setCurrentWheel(usabilityWheel(gear.usableRate, gear.name));
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
              setCurrentWheel(weaponExistWheel);
            }
          }
          break;
        }

        case "legacy-gear": {
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
            setCurrentWheel(
              usabilityWheel(legacyGear.usableRate, legacyGear.name)
            );
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
              setCurrentWheel(weaponExistWheel);
            }
          }
          break;
        }

        // Weapon & Enchant
        case "weapon-exist":
          if (resultName === "No Weapon") {
            const raceOrSubrace = getRaceOrSubrace(results);
            setCurrentWheel(powerCountWheel(raceOrSubrace));
          } else {
            setCurrentWheel(uniqueWeaponExistWheel);
          }
          break;

        case "unique-weapon-exist":
          setCurrentWheel(
            resultName === "No" ? weaponWheel : uniqueWeaponWheel
          );
          break;

        case "weapon":
        case "unique-weapon": {
          const weapon = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;

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
              value: key,
            });
            setCurrentWheel(usabilityWheel(weapon.usableRate, weapon.name));
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

            if (isNobleSwordsman) {
              handleNobleSwordsmanFlow(weapon);
            } else {
              setCurrentWheel(enchantCountWheel);
            }
          }
          break;
        }

        // Handle usability check result
        case "usabilityCheck": {
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
            // Proceed to stats after Holy Symbol is handled
            goToStats();
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
                      .find((g) => g.name === s.name)
                ),
              });
            } else if (legacyGearCount > 0) {
              setCurrentWheel({
                key: "legacy-gear",
                title: "Legacy Gear",
                sections: legacyGearWheel.sections,
              });
            } else {
              setCurrentWheel(weaponExistWheel);
            }
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
                      .find((g) => g.name === s.name)
                ),
              });
            } else {
              setCurrentWheel(weaponExistWheel);
            }
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
              if (isNobleSwordsman) {
                handleNobleSwordsmanFlow(weaponData);
              } else {
                setCurrentWheel(enchantCountWheel);
              }
            } else {
              // Not usable - finalize weapon with no enchants and skip to power
              const weaponData = JSON.parse(
                characterState.results["temp-current-weapon"] || "{}"
              );

              dispatch({
                type: "ADD_WEAPON",
                weapon: {
                  ...weaponData,
                  usable: false,
                  enchants: [],
                } as WeaponWithEnchants,
              });
              dispatch({
                type: "SET_RESULT",
                key: "temp-current-weapon",
                value: "",
              });
              dispatch({ type: "SET_RESULT", key: "weapon-usable", value: "" });

              const raceOrSubrace = getRaceOrSubrace(results);
              setCurrentWheel(powerCountWheel(raceOrSubrace));
            }
          }
          break;
        }

        case "weapon-enchant-count":
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
              } as WeaponWithEnchants,
            });

            // Clear temp data
            dispatch({
              type: "SET_RESULT",
              key: "temp-current-weapon",
              value: "",
            });
            dispatch({ type: "SET_RESULT", key: "weapon-usable", value: "" });

            const raceOrSubrace = getRaceOrSubrace(results);
            setCurrentWheel(powerCountWheel(raceOrSubrace));
          }
          break;

        case "weapon-enchant":
          const enchant = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;

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
              sections: currentWheel.sections.filter(
                (s) => s.name !== resultName
              ),
            });
          } else {
            // All enchants collected - finalize weapon
            const weaponData = JSON.parse(
              characterState.results["temp-current-weapon"] || "{}"
            );
            const isUsable = characterState.results["weapon-usable"] === "true";

            console.log("Finalizing weapon with enchants:", currentEnchants);

            dispatch({
              type: "ADD_WEAPON",
              weapon: {
                ...weaponData,
                usable: isUsable,
                enchants: currentEnchants,
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

            const raceOrSubrace = getRaceOrSubrace(results);
            setCurrentWheel(powerCountWheel(raceOrSubrace));
          }
          break;

        // Power & Char Dev
        case "power-count":
          const hasDarkMagician = characterState.archetypes.some(
            (a: any) => a.name === "Dark Magician"
          );

          resultName = hasDarkMagician
            ? String(Number(resultName) + 2)
            : resultName;

          setPowerCount(parseInt(resultName, 10));
          setPowerStep(0);
          setCurrentWheel({
            key: "power",
            title: "Power",
            sections: PowerWheel.sections,
          });
          break;

        case "power":
          console.log(powerCount);
          console.log(powerStep);

          const power = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;
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
              characterState.archetypes.some(
                (archetype: any) => archetype.name === "NPC 💀"
              )
            ) {
              setCharDevStep(0);
              setCharDevMax(0);
              setCurrentWheel(pveWheel);
            } else {
              // Xác định số char dev theo race
              const race = characterState.results.race;
              setCharDevStep(0);
              setCharDevMax(race === "Human" ? 2 : 1);
              setCurrentWheel(charDevWheel);
            }
          }
          break;

        case "char-dev":
          const charDevs = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;
          dispatch({ type: "ADD_CHARDEV", charDev: charDevs });
          if (charDevStep + 1 < charDevMax) {
            setCharDevStep(charDevStep + 1);
            setCurrentWheel({
              key: "char-dev",
              title: "Character Development",
              sections: currentWheel.sections.filter(
                (s) => s.name !== resultName
              ),
            });
          } else {
            setCurrentWheel(pveWheel);
          }
          break;

        // PvE
        case "pve":
          dispatch({ type: "SET_RESULT", key: "pve", value: resultName });
          // Flow complete - optionally reset or show completion
          break;

        default:
          if (currentWheel.onComplete) {
            currentWheel.onComplete();
          }
      }
    },
    [
      characterState,
      quirkCount,
      quirkStep,
      gearCount,
      gearStep,
      legacyGearCount,
      legacyGearStep,
      enchantCount,
      enchantStep,
      powerCount,
      powerStep,
      currentWheel,
      charDevStep,
      charDevMax,
      handleNobleSwordsmanFlow,
    ]
  );

  const handleCharacterComplete = useCallback(() => {
    // 1. Xuất dữ liệu
    exportCharacter(characterState);

    // 2. Reset state
    resetAll();
  }, [characterState]);

  // Reset handler
  const resetAll = useCallback(() => {
    dispatch({ type: "RESET" });
    setCurrentWheel(raceWheel);
    setGearStep(0);
    setLegacyGearStep(0);
    setEnchantStep(0);
    setPowerStep(0);
    setCharDevStep(0);
    setQuirkStep(0);
    setStatStep(0);
    setQuirkCount(0);
    setGearCount(0);
    setLegacyGearCount(0);
    setEnchantCount(0);
    setPowerCount(0);
    setCharDevMax(1);
  }, []);

  // Next step handler
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
  };
};
