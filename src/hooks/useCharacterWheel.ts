import { useState, useReducer, useCallback } from "react";
import { WheelStep } from "@/Common/Types/Types";
import { raceWheel } from "@/Common/Config/RaceConfig";
import { quirkCountOptions, quirkList } from "@/Common/Config/QuirkConfig";
import {
  gearCountWheel,
  gearWheel,
  legacyGearCountWheel,
  legacyGearWheel,
} from "@/Common/Config/GearConfig";
import { enchantCountWheel } from "@/Common/Config/WeaponConfig";
import { powerCountWheel, PowerWheel } from "@/Common/Config/PowerConfig";
import { charDevWheel } from "@/Common/Config/CharDevConfig";
import { pveWheel } from "@/Common/Config/PvEConfig";
import { playerWheel } from "@/Common/Config/PlayerConfig";
import {
  getRaceOrSubrace,
  STAT_WHEELS,
  usabilityWheel,
} from "@/utils/wheelUtils";
import { useResult } from "@/components/setResult";
import { useArchetypeHandlers } from "@/hooks/handlers/useArchetypeHandlers";
import { useItemHandlers } from "@/hooks/handlers/useItemHandlers";
import { useRaceHandlers } from "@/hooks/handlers/useRaceHandlers";
import { useFlowHandlers } from "@/hooks/handlers/useFlowHandlers";
import { useGameMechanics } from "@/hooks/utils/useGameMechanics";
import { useCharacterHelpers } from "@/hooks/utils/useCharacterHelpers";
import whip from "@/assets/Weapon/whip.png";
import uchigatana from "@/assets/Weapon/uchigatana.png";
import {
  characterReducer,
  initialCharacterState,
} from "@/reducers/characterReducer";
import {
  archetypeWheel,
  instrumentWheel,
} from "@/Common/Config/ArchetypeConfig";
import { COLOR_PALETTE } from "@/Common/Constants/ConstantsConfig";
import audio1 from '../assets/audio/Stat_1-2_(1).mp3';
import audio2 from '../assets/audio/Stat_1-2_(2).mp3';
import audio3 from '../assets/audio/Stat_1-2_(3).mp3';
import audio3_4 from '../assets/audio/Stat_3-4.mp3';
import audio5_7 from '../assets/audio/Stat_5-7.mp3';
import audio8_9 from '../assets/audio/Stat_8-9.mp3';
import audio10 from '../assets/audio/Stat_10.mp3';
import audio_0_pow from '../assets/audio/0_Power.mp3';
import audio_0_gear from '../assets/audio/0_Gear.mp3';
import audio_total_base_lower_25 from '../assets/audio/Total_Base_Lower_25.mp3';
import audio_total_base_higher_41 from '../assets/audio/Total_Base_Higher_41.mp3';

export const useCharacterWheel = () => {
  const [characterState, dispatch] = useReducer(
    characterReducer,
    initialCharacterState
  );
  const [currentWheel, setCurrentWheel] = useState<WheelStep>(raceWheel);
  const { rolledResult } = useResult();
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
  const [showDialog, setShowDialog] = useState(false);
  const [dialogData, setDialogData] = useState<any>(null);
  // ĐÃ XÓA: Xóa trạng thái showTotalStatPopup và totalStatMessage

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

  const goToStats = useCallback(
    () => {
      const params = getFlowHandlerParams();
      return flowHandlers.goToStats(params);
    },
    [flowHandlers, getFlowHandlerParams]
  );

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

  const jumpToWheel = useCallback(
    (wheelKey: string) => {
      const params = getFlowHandlerParams();
      return flowHandlers.jumpToWheel(wheelKey, params);
    },
    [flowHandlers, getFlowHandlerParams]
  );

  const continueCharDevFlow = () => {
    if (charDevStep + 1 < charDevMax) {
      setCharDevStep(charDevStep + 1);
      setCurrentWheel({
        key: "char-dev",
        title: "Character Development",
        sections: charDevWheel.sections.filter(
          (s) => !characterState.charDevs.find((dev) => dev.name === s.name)
        ),
      });
    } else {
      setCurrentWheel(pveWheel);
    }
  };

  const audio = useCallback(
    (key: string, resultName: string): Promise<void> => {
      console.log(`[Audio] Called with key: ${key}, resultName: ${resultName}`);
      return new Promise((resolve, reject) => {
        let audioPath: string = '';

        switch (key) {
          case 'strength':
          case 'speed':
          case 'battleIQ':
          case 'martialArts':
          case 'durability':
          case 'iq': {
            const statValue = parseInt(resultName, 10);
            if (statValue >= 1 && statValue <= 2) {
              const randomAudios = [audio1, audio2, audio3];
              const randomIndex = Math.floor(Math.random() * randomAudios.length);
              audioPath = randomAudios[randomIndex];
              console.log(`[Audio] Playing for stat 1-2: ${audioPath}`);
            } else if (statValue >= 3 && statValue <= 4) {
              audioPath = audio3_4;
              console.log(`[Audio] Playing for stat 3-4: ${audioPath}`);
            } else if (statValue >= 5 && statValue <= 7) {
              audioPath = audio5_7;
              console.log(`[Audio] Playing for stat 5-7: ${audioPath}`);
            } else if (statValue >= 8 && statValue <= 9) {
              audioPath = audio8_9;
              console.log(`[Audio] Playing for stat 8-9: ${audioPath}`);
            } else if (statValue === 10) {
              audioPath = audio10;
              console.log(`[Audio] Playing for stat 10: ${audioPath}`);
            }
            break;
          }

          case 'totalBaseStat': {
            const statValue = parseInt(resultName, 10);
            if (statValue <= 25) {
              audioPath = audio_total_base_lower_25;
              console.log(`[Audio] Playing for totalBaseStat <= 25: ${audioPath}`);
            } else if (statValue >= 41) {
              audioPath = audio_total_base_higher_41;
              console.log(`[Audio] Playing for totalBaseStat >= 41: ${audioPath}`);
            }
            break;
          }

          case 'power-count': {
            if (resultName === "0") {
              audioPath = audio_0_pow;
              console.log(`[Audio] Playing for power-count = 0: ${audioPath}`);
            }
            break;
          }

          case 'gear-count': {
            if (resultName === "0") {
              audioPath = audio_0_gear;
              console.log(`[Audio] Playing for gear-count = 0: ${audioPath}`);
            }
            break;
          }

          default:
            console.log(`[Audio] No audio defined for key: ${key}`);
            resolve();
            return;
        }

        if (audioPath) {
          try {
            console.log(`[Audio] Starting playback: ${audioPath}`);
            const audio = new Audio(audioPath);
            audio.onended = () => {
              console.log(`[Audio] Playback completed: ${audioPath}`);
              resolve();
            };
            audio.play().catch((error) => {
              console.error(`[Audio] Error playing audio at ${audioPath}:`, error);
              reject(error);
            });
          } catch (error) {
            console.error(`[Audio] Error initializing audio at ${audioPath}:`, error);
            reject(error);
          }
        } else {
          console.log(`[Audio] No audio path selected for key: ${key}`);
          resolve();
        }
      });
    },
    [audio1, audio2, audio3, audio3_4, audio5_7, audio8_9, audio10, audio_total_base_lower_25, audio_total_base_higher_41, audio_0_pow, audio_0_gear]
  );

  const handleStatResult = useCallback(
    (key: string, resultName: string) => {
      console.log(`[handleStatResult] Setting stat: ${key} = ${resultName}`);
      dispatch({ type: "SET_STAT", key, value: resultName });
      return audio(key, resultName);
    },
    [dispatch, audio]
  );

  const handleNextStep = useCallback(
    (key: string, resultName: string) => {
      console.log(`[handleNextStep] Processing key: ${key}, resultName: ${resultName}`);
      const handlerParams = getHandlerParams();

      const handleArchetypeResult = (result: any) => {
        if (result?.shouldContinue && result?.message) {
          switch (result.message) {
            case "proceed-to-archetype":
              const archetypeParams = getFlowHandlerParams();
              flowHandlers.jumpToWheel("archetype", archetypeParams);
              break;
          }
        }
      };

      const handleItemResult = (result: any) => {
        if (result?.shouldContinue && result?.message) {
          switch (result.message) {
            case "proceed-to-weapons":
              const weaponParams = getFlowHandlerParams();
              flowHandlers.jumpToWheel("weapon", weaponParams);
              break;
            case "proceed-to-stats":
              goToStats();
              break;
            case "finalize-weapon-no-enchants":
            case "finalize-weapon-with-enchants":
              const weaponData = JSON.parse(
                characterState.results["temp-current-weapon"] || "{}"
              );
              const isUsable =
                characterState.results["weapon-usable"] === "true";
              const enchants =
                result.message === "finalize-weapon-with-enchants"
                  ? JSON.parse(
                      characterState.results["temp-weapon-enchants"] || "[]"
                    )
                  : [];

              dispatch({
                type: "ADD_WEAPON",
                weapon: {
                  ...weaponData,
                  usable: isUsable,
                  enchants: enchants,
                },
              });

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

              const powerParams = getFlowHandlerParams();
              flowHandlers.jumpToWheel("power", powerParams);
              break;
            case "finalize-unusable-weapon":
              const unusableWeaponData = JSON.parse(
                characterState.results["temp-current-weapon"] || "{}"
              );

              dispatch({
                type: "ADD_WEAPON",
                weapon: {
                  ...unusableWeaponData,
                  usable: false,
                  enchants: [],
                },
              });

              dispatch({
                type: "SET_RESULT",
                key: "temp-current-weapon",
                value: "",
              });
              dispatch({ type: "SET_RESULT", key: "weapon-usable", value: "" });

              const unusablePowerParams = getFlowHandlerParams();
              flowHandlers.jumpToWheel("power", unusablePowerParams);
              break;
          }
        }
      };

      switch (key) {
        case "race":
          return raceHandlers.handleRaceSelection(
            resultName,
            handlerParams,
            rolledResult
          );

        case "uma-parent-1":
        case "uma-parent-2":
          return raceHandlers.handleUmaParentFlow(
            key,
            resultName,
            handlerParams
          );

        case "special-week-extra":
          return raceHandlers.handleSpecialWeekFlow(resultName, handlerParams);

        case "skeleton-lineage":
          return raceHandlers.handleSkeletonLineage(resultName, handlerParams);

        case "subrace":
          return raceHandlers.handleSubraceSelection(resultName, handlerParams);

        case "uniqueVampireTrain":
        case "vampireTaste": {
          const result = archetypeHandlers.handleVampireFlow(
            key,
            resultName,
            handlerParams
          );
          handleArchetypeResult(result);
          break;
        }

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

        case "x":
          dispatch({
            type: "SET_RESULT",
            key: "X",
            value: resultName,
          });
          if (resultName === "Lucky Cyan") {
            dispatch({
              type: "ADD_POWER",
              power: {
                id: "HP03",
                name: "Super Lucky",
                weight: 0,
                color: "#33CCCC",
                description:
                  "(1).Khi thua trận, bạn có 15% lật kèo và thắng trận đấu đó.(2).Nếu không chiến thắng trong vòng quay của hiệu ứng (1), bạn sẽ có thêm một cơ hội nữa với 10% lật kèo.Thua nữa thì ggs.",
              },
            });
          } else if (resultName === "Ghostblade") {
            dispatch({
              type: "ADD_POWER",
              power: {
                id: "3",
                name: "Critical Strike",
                effect:
                  "Với mỗi round thắng, bạn có 20% nhận thêm 1 điểm. Thứ tự ưu tiên: Ashina Skill - Crit - Gambler",
                weight: 0.9,
                color: "",
              },
            });
          }
          setCurrentWheel(archetypeWheel);
          break;

        case "jjk-extra":
        case "jojo-extra":
        case "naruto-extra":
        case "one piece-extra":
        case "bleach-extra":
          dispatch({
            type: "SET_RESULT",
            key: "wibu-extra",
            value: resultName,
          });
          dispatch({
            type: "ADD_POWER",
            power: {
              id: `W-${resultName}`,
              name: resultName,
              effect: "",
              weight: 0.9,
              color: "",
            },
          });

          setCurrentWheel(archetypeWheel);
          break;

        case "leviathan-house":
          dispatch({
            type: "SET_RESULT",
            key: "leviathan-house",
            value: resultName,
          });
          setCurrentWheel(archetypeWheel);
          break;

        case "asmodeus-lover":
        case "sinful-king-lover": {
          const lovers = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;
          dispatch({ type: "ADD_LOVER", lovers });

          const remainingKey =
            currentWheel.key === "asmodeus-lover"
              ? "asmodeus-lovers-remaining"
              : "sinful-king-lovers-remaining";
          const remaining = parseInt(
            characterState.results[remainingKey] || "0",
            10
          );

          if (remaining > 1) {
            const newRemaining = remaining - 1;
            dispatch({
              type: "SET_RESULT",
              key: remainingKey,
              value: newRemaining.toString(),
            });

            setCurrentWheel({
              key: currentWheel.key,
              title: "Lover Selection",
              sections: currentWheel.sections.filter(
                (s) => s.name !== resultName
              ),
            });
          } else {
            dispatch({
              type: "SET_RESULT",
              key: remainingKey,
              value: "0",
            });
            setCurrentWheel(archetypeWheel);
          }
          break;
        }
        case "sinful-king-house": {
          dispatch({
            type: "SET_RESULT",
            key: "leviathan-house",
            value: resultName,
          });

          dispatch({
            type: "SET_RESULT",
            key: "sinful-king-lovers-remaining",
            value: "4",
          });

          setCurrentWheel({
            key: "sinful-king-lover",
            title: "Lover Selection",
            sections: playerWheel.sections,
          });
          break;
        }
        case "Bard":
          setCurrentWheel({
            key: "bard-instrumental-check",
            title: "Bard - Có nhạc cụ không?",
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

        case "bard-instrumental-check":
          if (resultName === "Có nhạc cụ") {
            setCurrentWheel({
              key: "bard-instrumental-selection",
              title: "Bard - Chọn nhạc cụ",
              sections: instrumentWheel.sections,
            });
          } else {
            const raceOrSubrace = getRaceOrSubrace(characterState.results);
            setCurrentWheel(powerCountWheel(raceOrSubrace));
          }
          break;

        case "bard-instrumental-selection":
          dispatch({
            type: "ADD_WEAPON",
            weapon: {
              id: `instrumental-${resultName.toLowerCase()}`,
              name: resultName,
              weight: 1,
              color: "#FFD700",
              usable: true,
              description: `Nhạc cụ ${resultName} của Bard`,
            },
          });

          const raceOrSubrace = getRaceOrSubrace(characterState.results);
          setCurrentWheel(powerCountWheel(raceOrSubrace));
          break;

        case "strength":
        case "speed":
        case "battleIQ":
        case "martialArts":
        case "durability":
        case "iq":
          return handleStatResult(key, resultName).then(() => {
            console.log(`[handleNextStep] Stat ${key} processed, proceeding to next step`);
            handleRegularStatProgression(key, resultName);
          });

        case "quirk-count":
          return audio(key, resultName).then(() => {
            console.log(`[handleNextStep] Quirk count processed: ${resultName}`);
            const totalQuirk = gameMechanics.calculateQuirkCount(
              parseInt(resultName, 10),
              characterState
            );
            setQuirkCount(totalQuirk.finalPowerCount);
            setQuirkStep(0);
            setCurrentWheel({
              key: "quirk",
              title: "Quirk",
              sections: quirkList,
            });
          });

        case "quirk":
          if (resultName === "Sanguine") {
            const currentStats = characterState.stats;

            Object.entries(currentStats).forEach(([statKey, statValue]) => {
              const currentStat = parseInt(statValue) || 1;
              if (currentStat < 4) {
                dispatch({
                  type: "SET_STAT",
                  key: statKey,
                  value: "4",
                });
              }
            });
          }
          return handleQuirkFlow(resultName);

        case "house":
          return handleHouseFlow(resultName);

        case "marais-race-1":
          dispatch({
            type: "SET_RESULT",
            key: "marais-race-1",
            value: resultName,
          });

          dispatch({
            type: "ADD_ARCHETYPE",
            archetype: {
              id: "slayer-1",
              name: `${resultName} Slayer`,
              weight: 1,
              color: "#DC143C",
            },
          });

          setCurrentWheel({
            key: "marais-race-2",
            title: "House Marais - Second Slayer Target",
            sections: raceWheel.sections.filter((s) => s.name !== resultName),
          });
          break;

        case "marais-race-2":
          dispatch({
            type: "SET_RESULT",
            key: "marais-race-2",
            value: resultName,
          });

          dispatch({
            type: "ADD_ARCHETYPE",
            archetype: {
              id: "slayer-2",
              name: `${resultName} Slayer`,
              weight: 1,
              color: "#B22222",
            },
          });

          setCurrentWheel(gearCountWheel);
          break;

        case "gear-count":
          return audio(key, resultName).then(() => {
            console.log(`[handleNextStep] Gear count processed: ${resultName}`);
            let gearCount = gameMechanics.extraGear(
              parseInt(resultName, 10),
              characterState
            );
            console.log(`[handleNextStep] Calculated gear count: ${gearCount}`);
            setGearCount(gearCount);
            setGearStep(0);
            setCurrentWheel(legacyGearCountWheel);
          });

        case "legacy-gear-count":
          return audio(key, resultName).then(() => {
            console.log(`[handleNextStep] Legacy gear count processed: ${resultName}`);
            let lgc = parseInt(resultName, 10);
            if (
              characterState.archetypes.some(
                (a: any) => a.name === "House's Noble"
              )
            ) {
              lgc++;
            }
            console.log(`[handleNextStep] Adjusted legacy gear count: ${lgc}`);
            setLegacyGearCount(lgc);
            setLegacyGearStep(0);
            return handleGearCountCompletion();
          });

        case "gear": {
          const result = itemHandlers.handleGearFlow(
            resultName,
            currentWheel,
            handlerParams
          );
          handleItemResult(result);
          break;
        }

        case "legacy-gear": {
          const result = itemHandlers.handleLegacyGearFlow(
            resultName,
            currentWheel,
            handlerParams
          );
          handleItemResult(result);
          break;
        }
        case "big-gift-legacy-gear":
          const legacyGear = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;

          if (legacyGear.usableRate && legacyGear.usableRate < 100) {
            dispatch({
              type: "SET_RESULT",
              key: "temp-big-gift-gear",
              value: JSON.stringify(legacyGear),
            });
            setCurrentWheel(
              usabilityWheel(legacyGear.usableRate, legacyGear.name)
            );
          } else {
            dispatch({
              type: "ADD_LEGACY_GEAR",
              gear: { ...legacyGear, usable: true },
            });

            if (charDevStep + 1 < charDevMax) {
              setCharDevStep(charDevStep + 1);
              setCurrentWheel({
                key: "char-dev",
                title: "Character Development",
                sections: charDevWheel.sections.filter(
                  (s) =>
                    !characterState.charDevs.find((dev) => dev.name === s.name)
                ),
              });
            } else {
              setCurrentWheel(pveWheel);
            }
          }
          break;

        case "noble-magic-gear":
        case "noble-physical-gear": {
          const result = itemHandlers.handleNobleGearFlow(
            key,
            resultName,
            currentWheel,
            handlerParams
          );
          handleItemResult(result);
          break;
        }

        case "weapon-exist":
          return itemHandlers.handleWeaponExistFlow(resultName, handlerParams);

        case "unique-weapon-exist":
          return itemHandlers.handleUniqueWeaponExistFlow(
            resultName,
            handlerParams
          );

        case "dual-wielder-weapon-1":
        case "dual-wielder-weapon-2":
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

        case "usabilityCheck": {
          const result = itemHandlers.handleUsabilityCheck(
            resultName,
            handlerParams
          );
          handleItemResult(result);
          break;
        }

        case "power-count":
          return audio(key, resultName).then(() => {
            console.log(`[handleNextStep] Power count processed: ${resultName}`);
            return handlePowerCountFlow(resultName);
          });

        case "power":
          return handlePowerFlow(resultName);

        case "char-dev":
          return handleCharDevFlow(resultName);

        case "confession-archetype":
          const confessionArchetype = {
            id:
              resultName === "Braindead"
                ? "braindead-arch"
                : "seeking-wisdom-arch",
            name: resultName,
            weight: 1,
            color: resultName === "Braindead" ? "#696969" : "#9370DB",
          };

          dispatch({ type: "ADD_ARCHETYPE", archetype: confessionArchetype });

          if (charDevStep + 1 < charDevMax) {
            setCharDevStep(charDevStep + 1);
            setCurrentWheel({
              key: "char-dev",
              title: "Character Development",
              sections: currentWheel.sections.filter(
                (s) => s.name !== "Nghe Bài thú tội"
              ),
            });
          } else {
            setCurrentWheel(pveWheel);
          }
          break;

        case "player":
          const player = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;
          dispatch({ type: "ADD_LOVER", lovers: player });

          if (charDevStep + 1 < charDevMax) {
            setCharDevStep(charDevStep + 1);
            setCurrentWheel({
              key: "char-dev",
              title: "Character Development",
              sections: charDevWheel.sections.filter(
                (s) =>
                  !characterState.charDevs.find((dev) => dev.name === s.name)
              ),
            });
          } else {
            setCurrentWheel(pveWheel);
          }
          break;

        case "summon":
          const summon = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;
          dispatch({ type: "ADD_SUMMON", summon });
          if (resultName === "Creator's Favor") {
            dispatch({
              type: "ADD_CHARDEV",
              charDev: {
                id: "15",
                name: "Creator's Favor",
                weight: 1.3,
                color: "#FFD700",
                description:
                  "'Đấng Sáng Tạo' tùy ý buff cho nhân vật. (Không thay đổi quá 2 chỉ số).",
              },
            });
          }
          setCurrentWheel(archetypeWheel);
          break;
        case "armed-teeth-gear-1":
        case "armed-teeth-gear-2":
        case "armed-teeth-gear-3":
          const gearNumber = parseInt(currentWheel.key.split("-")[3]);
          const selectedGear = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;

          if (selectedGear.usableRate && selectedGear.usableRate < 100) {
            dispatch({
              type: "SET_RESULT",
              key: `temp-armed-gear-${gearNumber}`,
              value: JSON.stringify(selectedGear), // SỬA ĐỔI: Từ selectedGap thành selectedGear
            });
            setCurrentWheel(
              usabilityWheel(selectedGear.usableRate, selectedGear.name)
            );
          } else {
            dispatch({
              type: "ADD_GEAR",
              gear: { ...selectedGear, usable: true },
            });

            if (gearNumber < 3) {
              setCurrentWheel({
                key: `armed-teeth-gear-${gearNumber + 1}`,
                title: `Armed to the Teeth - Gear ${gearNumber + 1}/3`,
                sections: gearWheel.sections.filter(
                  (g) =>
                    !characterState.gears.find((gear) => gear.name === g.name)
                ),
              });
            } else {
              continueCharDevFlow();
            }
          }
          break;

        case "no-family-power-1":
        case "no-family-power-2":
          const powerNumber = parseInt(currentWheel.key.split("-")[3]);
          const selectedPower = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;

          dispatch({ type: "ADD_POWER", power: selectedPower });

          if (powerNumber < 2) {
            setCurrentWheel({
              key: `no-family-power-${powerNumber + 1}`,
              title: `No more family - Power ${powerNumber + 1}/2`,
              sections: PowerWheel.sections.filter(
                (p) =>
                  !characterState.powers
                    .concat(selectedPower)
                    .find((pw) => pw.name === p.name)
              ),
            });
          } else {
            continueCharDevFlow();
          }
          break;
        case "lover":
          const lovers = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;
          dispatch({ type: "ADD_LOVER", lovers });
          setCurrentWheel(archetypeWheel);
          break;

        case "pve":
          const pveRound = currentWheel.sections.find(
            (s) => s.name === resultName
          )!;
          dispatch({ type: "ADD_PVE_ROUND", pveRound });
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
      flowHandlers,
      getHandlerParams,
      getFlowHandlerParams,
      goToStats,
      handleStatResult,
      audio,
    ]
  );

  const handleRegularStatProgression: (key: string, resultName: string) => { success?: boolean } = useCallback(
    (key: string, resultName: string) => {
      console.log(`[handleRegularStatProgression] Processing stat: ${key} = ${resultName}`);
      dispatch({ type: "SET_STAT", key, value: resultName });
      const currentStatIndex = STAT_WHEELS.indexOf(key);

      if (currentStatIndex < STAT_WHEELS.length - 1) {
        const nextStatKey = STAT_WHEELS[currentStatIndex + 1];
        const params = getFlowHandlerParams();
        const nextResult = flowHandlers.jumpToWheel(nextStatKey, params);
        if (nextResult.success) {
          setStatStep(currentStatIndex + 2);
          console.log(`[handleRegularStatProgression] Moving to next stat: ${nextStatKey}`);
          return { success: true };
        }
        console.log(`[handleRegularStatProgression] Failed to move to next stat: ${nextStatKey}`);
        return { success: false };
      } else {
        // SỬA ĐỔI: Tính totalBaseStat và phát âm thanh, nhưng không hiển thị pop-up
        const totalBaseStat = STAT_WHEELS.reduce((sum, statKey) => {
          const statValue = parseInt(characterState.stats[statKey], 10);
          return sum + (isNaN(statValue) ? 0 : statValue);
        }, 0);
        console.log(`[handleRegularStatProgression] All stats processed, totalBaseStat: ${totalBaseStat}`);

        // GIỮ NGUYÊN: Phát âm thanh cho totalBaseStat và chuyển sang quirk-count
        return audio("totalBaseStat", totalBaseStat.toString()).then(() => {
          setCurrentWheel({
            key: "quirk-count",
            title: "Quirk Count",
            sections: quirkCountOptions,
          });
          console.log(`[handleRegularStatProgression] Moving to quirk-count`);
          return { success: true };
        });
      }
    },
    [dispatch, flowHandlers, getFlowHandlerParams, setStatStep, setCurrentWheel, characterState, audio] // ĐÃ XÓA: Xóa setShowTotalStatPopup, setTotalStatMessage khỏi dependencies
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
      if (resultName === "House Hoslow") {
        dispatch({
          type: "ADD_WEAPON",
          weapon: {
            id: "18",
            name: "Whip",
            weight: 5,
            color: "#A2D149",
            description:
              "+1 Speed, +1 MA. Luôn usable nếu House Hoslow. (40%, Physical)",
            image: whip,
            usableRate: 40,
            tag: "Physical",
            usable: true,
          },
        });
        dispatch({
          type: "ADD_ARCHETYPE",
          archetype: {
            id: "13",
            name: "Dual Wielder",
            weight: 2,
            color: "#BC8F8F",
          },
        });
      } else if (resultName === "Ashina Clan") {
        const ucgtn = {
          id: "4",
          name: "Uchigatana",
          weight: 5,
          color: "#A2D149",
          description: "+2 BIQ và +1 Martial Arts. (85%, Physical)",
          image: uchigatana,
          usableRate: 85,
          tag: "Physical",
          enchants: [],
          usable: true,
        };

        dispatch({
          type: "SET_RESULT",
          key: "temp-ashina-weapon",
          value: JSON.stringify(ucgtn),
        });

        setCurrentWheel(usabilityWheel(ucgtn.usableRate, ucgtn.name));
        return;
      } else if (resultName === "Dark Brotherhood") {
        dispatch({
          type: "ADD_QUIRK",
          quirk: {
            id: "q13",
            name: "Lurker",
            weight: 1.79,
            color: "#20B2AA",
            description:
              "(1).Nhận +1 Speed (2).Nhận +1 Speed nếu có Archetype là 'Spy' (3).Nhận +1 Speed nếu có Quirk là 'Tracker'",
          },
        });
      } else if (resultName === "Dark Brotherhood") {
        dispatch({
          type: "ADD_POWER",
          power: {
            id: "1",
            name: "Artist",
            effect:
              "Khi xuống nhánh thua, Stat lẻ của bạn được +1. (Tính theo chỉ số quay được từ đầu - Base Stats)",
            weight: 0.9,
            color: COLOR_PALETTE[0],
          },
        });
      } else if (resultName === "Painted World of Ariandel") {
        dispatch({
          type: "ADD_PVE_ROUND",
          pveRound: {
            id: "02",
            name: "Sir Vilhelm",
            weight: 2.78,
            color: "#B47D35",
            description: "Nhận Archetype 'Devotee'. Thua: Không có gì xảy ra.",
          },
        });
        dispatch({
          type: "ADD_PVE_ROUND",
          pveRound: {
            id: "03",
            name: "Sister Friede",
            weight: 2.78,
            color: "#7A1F1F",
            description: "Nhận Archetype 'Paladin'. Thua: Không có gì xảy ra.",
          },
        });
      }
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
          setCharDevStep(0);
          const charDevMax = gameMechanics.calculateChardevCount(
            1,
            characterState
          );
          setCharDevMax(charDevMax.finalPowerCount);
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
      if (resultName === "Inversion") {
        const currentStats = characterState.stats;

        Object.entries(currentStats).forEach(([statKey, statValue]) => {
          const currentStat = parseInt(statValue) || 1;
          const invertedStat = 11 - currentStat;

          dispatch({
            type: "SET_STAT",
            key: statKey,
            value: invertedStat.toString(),
          });
        });
      }

      if (["03", "20"].includes(charDev.id)) {
        setCurrentWheel({
          ...playerWheel,
          key: "player",
          title: "Player Selection",
        });
      } else if (charDevStep + 1 < charDevMax) {
        setCharDevStep(charDevStep + 1);
        setCurrentWheel({
          key: "char-dev",
          title: "Character Development",
          sections: currentWheel.sections.filter((s) => s.name !== resultName),
        });
      } else if (resultName === "Lose Control") {
        dispatch({ type: "RESET_POWERS" });
      } else if (resultName === "It is what it is") {
        dispatch({ type: "RESET_WEAPON" });
      } else if (resultName === "A Big Gift!") {
        setCurrentWheel({
          key: "big-gift-legacy-gear",
          title: "A Big Gift! - Legacy Gear",
          sections: legacyGearWheel.sections,
        });
      } else if (resultName === "Become Perfectionist") {
        dispatch({
          type: "ADD_ARCHETYPE",
          archetype: {
            id: "perfectionist",
            name: "Perfectionist",
            weight: 1,
            color: "#4169E1",
          },
        });
      } else if (resultName === "Too Edgy") {
        dispatch({
          type: "ADD_ARCHETYPE",
          archetype: {
            id: "edgelord",
            name: "Edgelord",
            weight: 1,
            color: "#2F2F2F",
          },
        });
      } else if (resultName === "Trở thành Linh Mục") {
        dispatch({
          type: "ADD_ARCHETYPE",
          archetype: {
            id: "linh-muc",
            name: "Linh Mục",
            weight: 1,
            color: "#FFD700",
          },
        });
      } else if (resultName === "Trở Thành Cha Xứ") {
        dispatch({
          type: "ADD_ARCHETYPE",
          archetype: {
            id: "cha-xu",
            name: "Cha Xứ",
            weight: 1,
            color: "#FFFFFF",
          },
        });
      } else if (resultName === "Trở thành Quỷ Nhà Thờ") {
        dispatch({
          type: "ADD_ARCHETYPE",
          archetype: {
            id: "quy-nha-tho",
            name: "Quỷ Nhà Thờ",
            weight: 1,
            color: "#8B0000",
          },
        });
      } else if (resultName === "Nghe Bài thú tội") {
        setCurrentWheel({
          key: "confession-archetype",
          title: "Nghe Bài thú tội - Archetype Selection",
          sections: [
            {
              id: "braindead-archetype",
              name: "Braindead",
              weight: 1,
              color: "#696969",
            },
            {
              id: "seeking-wisdom-archetype",
              name: "Seeking Wisdom",
              weight: 1,
              color: "#9370DB",
            },
          ],
        });
      } else if (resultName === "Armed to the Teeth") {
        dispatch({
          type: "SET_RESULT",
          key: "armed-teeth-gear-count",
          value: "3",
        });
        dispatch({
          type: "SET_RESULT",
          key: "armed-teeth-current",
          value: "0",
        });

        setCurrentWheel({
          key: "armed-teeth-gear-1",
          title: "Armed to the Teeth - Gear 1/3",
          sections: gearWheel.sections,
        });
      } else if (resultName === "No more family") {
        dispatch({
          type: "SET_RESULT",
          key: "no-family-power-count",
          value: "2",
        });
        dispatch({
          type: "SET_RESULT",
          key: "no-family-current",
          value: "0",
        });

        setCurrentWheel({
          key: "no-family-power-1",
          title: "No more family - Power 1/2",
          sections: PowerWheel.sections.filter(
            (p) => !characterState.powers.find((pw) => pw.name === p.name)
          ),
        });
      } else {
        setCurrentWheel(pveWheel);
      }
      setCurrentWheel(pveWheel);
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

  const handleGetData = useCallback(() => {
    const data = characterHelpers.getCompleteCharacterInfo(characterState);
    setDialogData(data);
    setShowDialog(true);
  }, [characterHelpers, characterState, setDialogData, setShowDialog]);

  const handleCharacterComplete = useCallback(() => {
    characterHelpers.handleCharacterExport(characterState);
    resetAll();
  }, [characterHelpers, characterState]);

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
    // ĐÃ XÓA: Xóa setShowTotalStatPopup và setTotalStatMessage
  }, [dispatch, setCurrentWheel]);

  const nextStep = useCallback(() => {
    console.log(`[nextStep] Triggered`);
  }, []);

  return {
    characterState,
    currentWheel,
    statStep,
    showDialog,
    dialogData,
    dispatch,
    jumpToWheel,
    handleNextStep,
    nextStep,
    resetWheels: resetAll,
    handleGetData,
    handleCharacterComplete,
    setShowDialog,
    setCurrentWheel,
    // ĐÃ XÓA: Xóa showTotalStatPopup, totalStatMessage, closeTotalStatPopup
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
    raceHandlers,
    playerWheel,
    pveWheel,
    flowStatus: flowHandlers.getFlowStatus(characterState),
    characterSummary: characterHelpers.generateCharacterSummary(characterState),
    validation: characterHelpers.validateCharacter(characterState),
    specialAbilities: gameMechanics.getSpecialAbilities(characterState),
    handleStatResult,
    audio,
  };
};