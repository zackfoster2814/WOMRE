import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useReducer,
} from "react";
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
import { Section, WheelStep } from "@/Common/Types/Types.ts";
import arrowImg from "@/assets/Images/arrow-2.png";
import { getStrengthWheel } from "@/Common/Config/StrengthConfig.ts";
import { getDurabilityWheel } from "@/Common/Config/DurabilityConfig.ts";
import { getSpeedWheel } from "@/Common/Config/SpeedConfig.ts";
import { getBattleIQWheel } from "@/Common/Config/BattleIQConfig.ts";
import { getIQWheel } from "@/Common/Config/IQConfig.ts";
import { getMartialArtsWheel } from "@/Common/Config/MartialArtConfig.ts";
import {
  archetypeExtraWheels,
  uniqueVampireTrainWheel,
  vampireTasteWheel,
} from "@/Common/Config/ArchetypeExtraWheels.ts";
import { quirkCountOptions, quirkList } from "@/Common/Config/QuirkConfig.ts";
import { houseWheel, useHouseAudios } from "@/Common/Config/HouseConfig.ts";
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

// Constants
const CANVAS_SIZE = 700;
const WHEEL_RADIUS_OFFSET = 20;
const STAT_WHEELS = [
  "strength",
  "speed",
  "durability",
  "iq",
  "battleIQ",
  "martialArts",
];

// Types
interface CharacterState {
  results: Record<string, string>;
  stats: Record<string, string>;
  quirks: Section[];
  gears: Section[];
  legacyGears: Section[];
  weapons: Section[];
  enchants: Section[];
  powers: Section[];
  charDevs: any[];
  archetypes: any[];
  characterName: string;
}

// State management using reducer for better control
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

type Action =
  | { type: "SET_RESULT"; key: string; value: string }
  | { type: "SET_STAT"; key: string; value: string }
  | { type: "ADD_QUIRK"; quirk: Section }
  | { type: "ADD_GEAR"; gear: Section }
  | { type: "ADD_LEGACY_GEAR"; gear: Section }
  | { type: "ADD_WEAPON"; weapon: Section }
  | { type: "ADD_ENCHANT"; enchant: Section }
  | { type: "ADD_POWER"; power: Section }
  | { type: "SET_CHARACTER_NAME"; name: string }
  | { type: "ADD_CHARDEV"; charDev: Section }
  | { type: "ADD_ARCHETYPE"; archetype: Section }
  | { type: "RESET" };

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

// Utility functions
const getStatWheel = (race: string, key: string): WheelStep | null => {
  const wheelGetters: Record<string, (race: string) => WheelStep> = {
    strength: getStrengthWheel,
    speed: getSpeedWheel,
    durability: getDurabilityWheel,
    iq: getIQWheel,
    battleIQ: getBattleIQWheel,
    martialArts: getMartialArtsWheel,
  };
  return wheelGetters[key]?.(race) || null;
};

const getRaceOrSubrace = (results: Record<string, string>): string => {
  return results.race === "Skeleton" ? results.subrace : results.race;
};

export default function CharacterWheel() {
  // Core state
  const [characterState, dispatch] = useReducer(characterReducer, initialState);
  const [currentWheel, setCurrentWheel] = useState<WheelStep>(raceWheel);
  const [angle, setAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rolledResult, setRolledResult] = useState<Section | null>(null);

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
  const [showDialog, setShowDialog] = useState(false);
  const [dialogData, setDialogData] = useState<any>(null);
  const [charDevStep, setCharDevStep] = useState(0);
  const [charDevMax, setCharDevMax] = useState(1);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const { audioRefs, audioSources } = useHouseAudios();

  // Memoized calculations
  const cachedSections = useMemo(() => {
    const totalWeight = currentWheel.sections.reduce(
      (sum, s) => sum + s.weight,
      0
    );
    let startAngle = 0;
    return currentWheel.sections.map((sec) => {
      const angleStep = (sec.weight / totalWeight) * 2 * Math.PI;
      const secWithAngles = {
        ...sec,
        startAngle,
        endAngle: startAngle + angleStep,
      };
      startAngle += angleStep;
      return secWithAngles;
    });
  }, [currentWheel]);

  // Drawing functions
  const drawWheelOffscreen = useCallback(() => {
    if (!canvasRef.current) return;
    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement("canvas");
      offscreenRef.current.width = CANVAS_SIZE;
      offscreenRef.current.height = CANVAS_SIZE;
    }
    const canvas = offscreenRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    const radius = Math.min(width, height) / 2 - WHEEL_RADIUS_OFFSET;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    cachedSections.forEach((section) => {
      // Draw section
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, section.startAngle, section.endAngle);
      ctx.closePath();
      ctx.fillStyle = section.color;
      ctx.fill();
      // Draw text
      const midAngle = (section.startAngle + section.endAngle) / 2;
      ctx.save();
      ctx.translate(
        Math.cos(midAngle) * radius * 0.65,
        Math.sin(midAngle) * radius * 0.65
      );
      ctx.rotate(midAngle);
      ctx.textAlign = "center";
      ctx.font = "bold 18px san-serif";
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 4;
      ctx.strokeText(section.name, 0, 0);
      ctx.fillText(section.name, 0, 0);
      ctx.restore();
    });
    ctx.restore();
  }, [cachedSections]);

  useEffect(() => {
    drawWheelOffscreen();
  }, [drawWheelOffscreen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !offscreenRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(offscreenRef.current, -canvas.width / 2, -canvas.height / 2);
    ctx.restore();
  }, [angle]);

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
          // if (characterState.powers.length > 0) {
          setCurrentWheel(charDevWheel);
          // }
          break;
        case "pve":
          // if (results.charDev) {
          setCurrentWheel(pveWheel);
          // }
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
    };
  }, [characterState]);

  const handleGetData = useCallback(() => {
    const data = getCompleteCharacterInfo();
    setDialogData(data);
    setShowDialog(true);
  }, [getCompleteCharacterInfo]);

  const usabilityWheel = (usableRate: number, itemName: string): WheelStep => ({
    key: "usabilityCheck",
    sections: [
      {
        name: "Dùng được",
        weight: usableRate,
        id: "usable",
        color: "#10b981", // Green
      },
      {
        name: "Không dùng được",
        weight: 100 - usableRate,
        id: "not-usable",
        color: "#ef4444", // Red
      },
    ],
    title: `${itemName} - Kiểm tra khả năng sử dụng`,
  });

  // Flow management - Refactored for clarity
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
        // 1. Race & Sub-race flow
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
        case "subrace": {
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
        }
        case "uniqueVampireTrain": {
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
        }
        case "vampireTaste": {
          dispatch({
            type: "SET_RESULT",
            key: "vampireTaste",
            value: resultName,
          });
          setCurrentWheel(archetypeWheel);
          break;
        }
        // 2. Archetype
        case "archetype": {
          const archetype = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;
          dispatch({ type: "ADD_ARCHETYPE", archetype });
          if (resultName === "Trickster") {
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
        case "wibu": {
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
        }
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
        case "demon-subrace":
          dispatch({
            type: "SET_RESULT",
            key: "demon-subrace",
            value: resultName,
          });
          if (currentWheel.onComplete) currentWheel.onComplete();
          break;
        // 3. Stats (Strength, Speed, Durability, IQ, Battle IQ, Martial Arts)
        case "strength":
        case "speed":
        case "durability":
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
        case "iq":
          // Bỏ qua kết quả quay, luôn set IQ = "1"
          dispatch({ type: "SET_STAT", key: "iq", value: "1" });
          // Lấy index của IQ trong STAT_WHEELS
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
        // 4. Quirk & House
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
            if (characterState.results.race === "Uma") {
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
        // 5. Gear & Legacy Gear
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
        // 6. Weapon & Enchant
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
              type: "ADD_WEAPON",
              weapon: { ...weapon, usable: true },
            });
            setCurrentWheel(enchantCountWheel);
          }
          break;
        }

        // Handle usability check result
        case "usabilityCheck": {
          const tempGear = characterState.results["temp-gear"];
          const tempLegacyGear = characterState.results["temp-legacy-gear"];
          const tempWeapon = characterState.results["temp-weapon"];
          const isUsable = resultName === "Dùng được";

          if (tempGear) {
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
            const weaponType = characterState.results["temp-weapon-type"];
            const weaponList =
              weaponType === "weapon" ? weaponWheel : uniqueWeaponWheel;
            const weapon = weaponList.sections.find(
              (s) => s.name === tempWeapon
            )!;

            if (isUsable) {
              dispatch({
                type: "ADD_WEAPON",
                weapon: { ...weapon, usable: true },
              });
              setCurrentWheel(enchantCountWheel);
            } else {
              // Not usable - skip enchant and go to power
              dispatch({
                type: "ADD_WEAPON",
                weapon: { ...weapon, usable: false },
              });
              const raceOrSubrace = getRaceOrSubrace(results);
              setCurrentWheel(powerCountWheel(raceOrSubrace));
            }

            dispatch({ type: "SET_RESULT", key: "temp-weapon", value: "" });
            dispatch({
              type: "SET_RESULT",
              key: "temp-weapon-type",
              value: "",
            });
          }
          break;
        }

        case "weapon-enchant-count":
          const eCount = parseInt(resultName, 10);
          setEnchantCount(eCount);
          setEnchantStep(0);
          if (eCount > 0) {
            setCurrentWheel({
              key: "weapon-enchant",
              title: "Weapon Enchant",
              sections: enchantWheel.sections,
            });
          } else {
            const raceOrSubrace = getRaceOrSubrace(results);
            setCurrentWheel(powerCountWheel(raceOrSubrace));
          }
          break;
        case "weapon-enchant":
          const enchant = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;
          dispatch({ type: "ADD_ENCHANT", enchant });
          if (enchantStep + 1 < enchantCount) {
            setEnchantStep(enchantStep + 1);
            setCurrentWheel({
              key: "weapon-enchant",
              title: "Weapon Enchant",
              sections: currentWheel.sections.filter(
                (s) => s.name !== resultName
              ),
            });
          } else {
            const raceOrSubrace = getRaceOrSubrace(results);
            setCurrentWheel(powerCountWheel(raceOrSubrace));
          }
          break;

        // 7. Power & Char Dev
        case "power-count":
          setPowerCount(parseInt(resultName, 10));
          setPowerStep(0);
          setCurrentWheel({
            key: "power",
            title: "Power",
            sections: PowerWheel.sections,
          });
          break;
        case "power":
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
            // Xác định số char dev theo race
            const race = characterState.results.race;
            setCharDevStep(0);
            setCharDevMax(race === "Human" ? 2 : 1);
            setCurrentWheel(charDevWheel);
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

        // 8. PvE
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
    ]
  );

  const handleCharacterComplete = () => {
    // 1. Xuất dữ liệu
    exportCharacter(characterState);

    // 2. Reset state
    dispatch({ type: "RESET" }); // bạn cần handle trong reducer
    setGearStep(0);
    setLegacyGearStep(0);
    setEnchantStep(0);
    setPowerStep(0);
    setCharDevStep(0);
    setQuirkStep(0);
    setStatStep(0);
    setCurrentWheel(raceWheel); // reset wheel về ban đầu
    setQuirkCount(0);
    setGearCount(0);
    setLegacyGearCount(0);
    setEnchantCount(0);
    setPowerCount(0);
    setCharDevMax(0);
  };

  // Spin logic
  const spin = useCallback(() => {
    if (isSpinning || !currentWheel) return;
    setIsSpinning(true);
    setRolledResult(null);
    const duration = 3500 + Math.random() * 2500;
    const spins = 4 + Math.random() * 4;
    const extraDeg = Math.random() * 360;
    const startAngle = angle;
    const totalDeg = spins * 360 + extraDeg;
    const finalAngle = startAngle + totalDeg;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    let startTs: number | null = null;
    const animate = (ts: number) => {
      if (!startTs) startTs = ts;
      const elapsed = ts - startTs;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = startAngle + eased * (finalAngle - startAngle);
      setAngle(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const finalNormalized = ((finalAngle % 360) + 360) % 360;
        const pointerDeg = (360 - finalNormalized) % 360;
        const pointerRad = (pointerDeg * Math.PI) / 180;
        let landed = cachedSections[0];
        for (const sec of cachedSections) {
          if (pointerRad >= sec.startAngle && pointerRad < sec.endAngle) {
            landed = sec;
            break;
          }
        }
        setIsSpinning(false);
        setRolledResult(landed);
        // Play audio if available
        if (landed && audioRefs[landed.name]) {
          audioRefs[landed.name].current?.play().catch(console.warn);
        }
      }
    };
    requestAnimationFrame(animate);
  }, [isSpinning, currentWheel, angle, cachedSections, audioRefs]);

  // Next step handler
  const nextStep = useCallback(() => {
    if (!rolledResult || !currentWheel) return;
    handleNextStep(currentWheel.key, rolledResult.name);
    setRolledResult(null);
    setAngle(0);
  }, [rolledResult, currentWheel, handleNextStep]);

  // Reset handler
  const resetWheels = useCallback(() => {
    dispatch({ type: "RESET" });
    setCurrentWheel(raceWheel);
    setAngle(0);
    setRolledResult(null);
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
  }, []);

  // UI Components
  const LeftPanel = () => {
    const handleNameChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({ type: "SET_CHARACTER_NAME", name: e.target.value });
      },
      []
    );
    return (
      <div className="w-[22%] flex flex-col gap-4 border-2 border-[#5a2d0c] p-3 rounded-lg shadow-[0_0_20px_rgba(200,50,0,0.6)] bg-black/70">
        <div className="border-2 border-[#d4af37] bg-black/60 h-52 flex items-center justify-center rounded-md text-amber-200 font-bold text-xl shadow-[0_0_15px_rgba(255,215,0,0.5)]"></div>
        <div className="border border-[#d4af37] p-2 text-center rounded bg-black/50 text-lg font-bold tracking-wide flex flex-col gap-2">
          <span>Tên nhân vật</span>
          <input
            type="text"
            value={characterState.characterName}
            onChange={handleNameChange}
            placeholder="Nhập tên nhân vật..."
            className="text-center bg-black/30 text-amber-200 "
            autoComplete="off"
          />
        </div>
        <div className="border border-[#d4af37] p-2 flex items-center gap-2 rounded bg-black/50 text-lg">
          <label className="font-bold shrink-0">Race</label>
          <select
            value={characterState.results.race || ""}
            onChange={(e) => {
              const val = e.target.value;
              dispatch({ type: "SET_RESULT", key: "race", value: val });
              handleNextStep("race", val);
            }}
            className="bg-black/30 text-amber-200 px-2 py-1 flex-1"
          >
            <option value="" disabled>
              -- Chọn Race --
            </option>
            {raceWheel.sections.map((sec) => (
              <option key={sec.name} value={sec.name}>
                {sec.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => jumpToWheel("race")}
            className="px-2 py-1 bg-[#3a2a18] border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded shadow hover:scale-110 transition"
          >
            Roll
          </button>
        </div>
        {characterState.results.race === "Uma" ? (
          <div className="flex justify-between items-center gap-2 w-full">
            {/* Parent 1 */}
            <select
              value={characterState.results["uma-parent-1"] || ""}
              onChange={(e) => {
                const val = e.target.value;
                dispatch({
                  type: "SET_RESULT",
                  key: "uma-parent-1",
                  value: val,
                });
                if (characterState.results["uma-parent-2"] === val) {
                  dispatch({
                    type: "SET_RESULT",
                    key: "uma-parent-2",
                    value: "",
                  });
                }
              }}
              className="bg-black/30 text-amber-200 border border-[#d4af37] rounded px-2 h-[45px] flex-1"
            >
              <option value="" disabled>
                -- Parent 1 --
              </option>
              {subraceMap["Uma"].map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <span className="text-amber-300 font-bold px-2">+</span>
            {/* Parent 2 */}
            <select
              value={characterState.results["uma-parent-2"] || ""}
              onChange={(e) => {
                const val = e.target.value;
                dispatch({
                  type: "SET_RESULT",
                  key: "uma-parent-2",
                  value: val,
                });
                dispatch({
                  type: "SET_RESULT",
                  key: "subrace",
                  value: `${characterState.results["uma-parent-1"]} - ${val}`,
                });
              }}
              className="bg-black/30 text-amber-200 border border-[#d4af37] rounded px-2 h-[45px] flex-1"
            >
              <option value="" disabled>
                -- Parent 2 --
              </option>
              {subraceMap["Uma"]
                .filter(
                  (s) => s.name !== characterState.results["uma-parent-1"]
                )
                .map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
        ) : (
          // Subrace dropdown cho các race khác
          <select
            value={characterState.results.subrace || ""}
            onChange={(e) =>
              dispatch({
                type: "SET_RESULT",
                key: "subrace",
                value: e.target.value,
              })
            }
            className="bg-black/30 text-amber-200 border border-[#d4af37] rounded px-2 h-[45px] w-full"
          >
            <option value="" disabled>
              -- Chọn Subrace --
            </option>
            {(subraceMap[characterState.results.race] || []).map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <div className="border border-[#d4af37] p-2 flex justify-between rounded bg-black/50 text-lg">
          <span
            onClick={() => jumpToWheel("archetype")}
            className="cursor-pointer hover:text-amber-400 hover:underline"
          >
            Archetype
          </span>
          <span className="text-amber-300">
            {characterState.archetypes.length > 0
              ? characterState.archetypes.map((a) => a.name).join(", ")
              : "???"}
          </span>
        </div>
        <div className="border border-[#d4af37] p-2 flex justify-between rounded bg-black/50 text-lg">
          <span
            onClick={() => jumpToWheel("house")}
            className="cursor-pointer hover:text-amber-400 hover:underline"
          >
            House
          </span>
          <span className="text-amber-300">
            {characterState.results.house || "???"}
          </span>
        </div>
        <div className="border border-[#d4af37] p-2 flex justify-between rounded bg-black/50 text-lg">
          <span
            onClick={() => jumpToWheel("charDev")}
            className="cursor-pointer hover:text-amber-400 hover:underline"
          >
            Char dev
          </span>
          <span className="text-amber-300">
            {characterState.charDevs.length > 0
              ? characterState.charDevs.map((dev) => dev.name).join(", ")
              : "???"}
          </span>
        </div>
        <div className="border border-[#d4af37] p-4 flex flex-col gap-3 rounded bg-black/50 text-lg">
          <p className="font-bold underline text-[#f5e6d3] text-xl mb-2">
            Stats
          </p>
          <div
            className="flex justify-between cursor-pointer hover:text-amber-400 text-lg"
            onClick={() => jumpToWheel("strength")}
          >
            <span>Strength</span>
            <span className="text-red-400">
              {characterState.stats.strength || "x"}
            </span>
          </div>
          <div
            className="flex justify-between cursor-pointer hover:text-amber-400 text-lg"
            onClick={() => jumpToWheel("speed")}
          >
            <span>Speed</span>
            <span className="text-green-400">
              {characterState.stats.speed || "x"}
            </span>
          </div>
          <div
            className="flex justify-between cursor-pointer hover:text-amber-400 text-lg"
            onClick={() => jumpToWheel("durability")}
          >
            <span>Durability</span>
            <span className="text-blue-400">
              {characterState.stats.durability || "x"}
            </span>
          </div>
          <div
            className="flex justify-between cursor-pointer hover:text-amber-400 text-lg"
            onClick={() => jumpToWheel("iq")}
          >
            <span>IQ</span>
            <span className="text-purple-300">
              {characterState.stats.iq || "x"}
            </span>
          </div>
          <div
            className="flex justify-between cursor-pointer hover:text-amber-400 text-lg"
            onClick={() => jumpToWheel("battleIQ")}
          >
            <span>Battle IQ</span>
            <span className="text-yellow-300">
              {characterState.stats.battleIQ || "x"}
            </span>
          </div>
          <div
            className="flex justify-between cursor-pointer hover:text-amber-400 text-lg"
            onClick={() => jumpToWheel("martialArts")}
          >
            <span>Martial Arts</span>
            <span className="text-orange-400">
              {characterState.stats.martialArts || "x"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const CenterWheel = () => (
    <div className="flex-1 flex flex-col items-center justify-center">
      {/* Nút get data lên trên */}
      <div className="flex gap-6 ">
        <button
          onClick={handleGetData}
          disabled={isSpinning}
          className="px-6 py-2 mb-4 min-w-[150px] max-w-[150px] bg-[#3a2a18] border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-110 transition disabled:opacity-40"
        >
          Get Data
        </button>
        {/* Nút Back */}
        <button
          onClick={() => (window.location.href = "/")}
          disabled={isSpinning}
          className="px-6 py-2 mb-4 min-w-[150px] max-w-[150px] bg-gray-700 border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-110 transition disabled:opacity-40"
        >
          Back
        </button>
      </div>
      <h1 className="text-3xl font-bold mb-2 text-[#d4af37] drop-shadow-[0_0_15px_rgba(255,200,100,0.8)] tracking-widest">
        {currentWheel.title} Wheel
      </h1>
      <div className="mb-4">
        <div
          className={`px-6 py-2 rounded-lg text-xl font-bold shadow-[0_0_15px_rgba(255,215,0,0.7)] 
        border-2 min-h-[48px] min-w-[300px] flex items-center justify-center
        ${
          rolledResult
            ? "border-[#d4af37] bg-black/60 text-amber-300"
            : "border-[#555] bg-black/30 text-gray-400"
        }`}
        >
          {rolledResult ? rolledResult.name : ""}
        </div>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="rounded-full border-4 border-[#8a5b1a] shadow-[0_0_30px_rgba(200,50,50,0.6)] bg-black/40"
        />
        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 ml-[-30px] text-red-500 drop-shadow-lg">
          <img src={arrowImg} alt="arrow" className="w-20 h-24 rotate-90" />
        </div>
      </div>
      <div className="flex gap-6 mt-6">
        <button
          onClick={spin}
          disabled={isSpinning}
          className="px-8 py-3 bg-[#3a2a18] border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-110 transition disabled:opacity-40"
        >
          Roll
        </button>
        {rolledResult && (
          <button
            onClick={() => {
              if (currentWheel.key === "pve") {
                handleCharacterComplete();
              } else {
                nextStep();
              }
            }}
            className="px-8 py-3 bg-green-700 border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-110 transition"
          >
            Next
          </button>
        )}

        <button
          onClick={resetWheels}
          disabled={isSpinning}
          className="px-8 py-3 bg-[#3a2a18] border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-110 transition disabled:opacity-40"
        >
          Reset
        </button>
      </div>
    </div>
  );

  const RightPanel = () => (
    <div className="w-1/4 flex flex-col gap-6 border-4 border-[#5a2d0c] p-4 rounded-xl shadow-[0_0_30px_rgba(200,50,0,0.8)] bg-black/70 h-full overflow-y-auto">
      {/* Weapons */}
      <div className="border-2 border-[#d4af37] p-4 rounded-md bg-black/50 text-xl min-h-[200px] max-h-[200px]">
        <p
          onClick={() => jumpToWheel("weapon")}
          className="font-bold underline text-[#f5e6d3] cursor-pointer hover:text-amber-400"
        >
          Weapons
        </p>
        <div className="pt-2 grid grid-cols-2 gap-2 min-h-[120px] max-h-[120px]">
          {Array.from({ length: 2 }).map((_, idx) => {
            const w = characterState.weapons[idx];
            return w ? (
              <div
                key={idx}
                className="flex min-h-[120px] max-h-[120px] flex-col items-center border border-[#d4af37] rounded p-2 bg-black/50"
              >
                <div className="w-20 h-20 flex items-center justify-center bg-gray-700 text-white mb-2">
                  {w.image ? (
                    <img
                      src={w.image}
                      alt={w.name}
                      className="w-20 h-20 object-contain"
                    />
                  ) : (
                    "No Img"
                  )}
                </div>
                <span className="text-amber-300 font-bold text-sm">
                  {w.name}
                  {!w.usable && " - không dùng được"}
                </span>
              </div>
            ) : (
              <div
                key={idx}
                className="flex flex-col items-center justify-center border border-gray-500 rounded p-2 bg-black/40 text-gray-400"
              >
                Empty
              </div>
            );
          })}
        </div>
      </div>

      {/* Quirks */}
      <div className="border-2 border-[#d4af37] p-4 rounded-md bg-black/50 text-xl flex flex-col">
        <p
          onClick={() => jumpToWheel("quirk")}
          className="font-bold underline text-[#f5e6d3] cursor-pointer hover:text-amber-400"
        >
          Quirks
        </p>
        <ul className="ml-4 space-y-2 text-lg mt-3 overflow-y-auto max-h-[90px] min-h-[90px]">
          {characterState.quirks.map((q, i) => (
            <li key={i} className="text-amber-300">
              • {q.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Gear */}
      <div className="border-2 border-[#d4af37] p-4 rounded-md bg-black/50 text-xl flex flex-col">
        <div className="flex flex-col min-h-[130px] max-h-[130px] overflow-y-auto">
          <p
            onClick={() => jumpToWheel("gear")}
            className="font-bold underline text-[#f5e6d3] cursor-pointer hover:text-amber-400"
          >
            Gear
          </p>
          <div className="max-h-40 overflow-y-auto pr-2">
            <ul className="list-disc pl-6 space-y-1">
              {characterState.gears.map((g, idx) => (
                <li key={idx} className="text-yellow-300">
                  {g.name}
                  {!g.usable && " - Unusable"}
                </li>
              ))}
              {characterState.legacyGears.map((g, idx) => (
                <li
                  key={`legacy-${idx}`}
                  className="text-yellow-300 font-bold animate-pulse drop-shadow-[0_0_6px_gold]"
                >
                  {g.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Powers */}
      <div className="border-2 border-[#d4af37] p-4 rounded-md bg-black/50 text-xl">
        <div className="flex flex-col">
          <p
            onClick={() => jumpToWheel("power")}
            className="font-bold underline text-[#f5e6d3] cursor-pointer hover:text-amber-400"
          >
            Powers
          </p>
          <div className="max-h-40 overflow-y-auto pr-2">
            <ul className="list-disc pl-6 space-y-1 min-h-[130px] max-h-[130px] overflow-y-auto">
              {characterState.powers.map((p, idx) => (
                <li key={idx} className="text-yellow-300">
                  {p.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* PvE */}
      <div className="border-2 border-[#d4af37] p-4 rounded-md bg-black/50 text-xl">
        <div className="flex flex-col">
          <p
            onClick={() => jumpToWheel("pve")}
            className="font-bold underline text-[#f5e6d3] cursor-pointer hover:text-amber-400"
          >
            PvE
          </p>
          <span className="text-amber-300">
            {characterState.results.pve || "???"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-screen h-screen relative flex flex-col text-amber-200 font-serif">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('./assets/Backgrounds/wheel-bg.png')" }}
      />
      <div className="absolute inset-0 bg-black/70" />

      <div className="flex flex-1 z-10">
        <LeftPanel />
        <CenterWheel />
        <RightPanel />
      </div>

      {Object.entries(audioSources).map(([house, src]) => (
        <audio key={house} ref={audioRefs[house]} src={src} preload="auto" />
      ))}
      {showDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-black/90 border-2 border-[#d4af37] p-6 rounded-lg w-3/4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-amber-300 mb-4">
              Character Info
            </h2>
            <pre className="text-white text-sm">
              {JSON.stringify(dialogData, null, 2)}
            </pre>
            <button
              onClick={() => setShowDialog(false)}
              className="mt-4 px-4 py-2 bg-gray-700 border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
