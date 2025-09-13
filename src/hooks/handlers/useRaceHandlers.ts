import { useCallback } from "react";
import { WheelStep } from "@/Common/Types/Types";
import { raceConfig, raceWheel } from "@/Common/Config/RaceConfig";
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

export const useRaceHandlers = () => {
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
    (resultName: string, params: RaceHandlerParams): RaceHandlerResult => {
      const { dispatch, setCurrentWheel } = params;

      dispatch({ type: "SET_RESULT", key: "race", value: resultName });

      switch (resultName) {
        case "Skeleton":
          setCurrentWheel({
            ...raceWheel,
            key: "skeleton-lineage",
            title: "Skeleton Lineage",
            sections: raceWheel.sections.filter((s) => s.name !== "Skeleton"),
          });
          return { shouldContinue: false };

        case "Uma":
          setCurrentWheel({
            key: "uma-parent-1",
            title: "Uma Parent Race 1",
            sections: subraceMap["Uma"],
          });
          return { shouldContinue: false };

        case "Angel":
          // Auto-add Pacifist archetype for Angel
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
          return { shouldContinue: false };

        default:
          // Check if race has subraces
          if (subraceMap[resultName]?.length > 0) {
            setCurrentWheel({
              key: "subrace",
              title: raceConfig[resultName]?.subrace || "Subrace",
              sections: subraceMap[resultName],
            });
          } else {
            setCurrentWheel(archetypeWheel);
          }
          return { shouldContinue: false };
      }
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

      switch (wheelKey) {
        case "uma-parent-1":
          dispatch({
            type: "SET_RESULT",
            key: "uma-parent-1",
            value: resultName,
          });

          // Apply parent 1 abilities
          applyUmaParentAbilities(resultName, dispatch);

          setCurrentWheel({
            key: "uma-parent-2",
            title: "Uma Parent Race 2",
            sections: subraceMap["Uma"].filter((s) => s.name !== resultName),
          });
          return { shouldContinue: false };

        case "uma-parent-2":
          dispatch({
            type: "SET_RESULT",
            key: "uma-parent-2",
            value: resultName,
          });

          // Apply parent 2 abilities
          applyUmaParentAbilities(resultName, dispatch);

          // Set combined subrace
          const parent1 = characterState.results["uma-parent-1"];
          const combinedSubrace = `${parent1} - ${resultName}`;
          dispatch({
            type: "SET_RESULT",
            key: "subrace",
            value: combinedSubrace,
          });

          // Check for Special Week combination
          if (combinedSubrace.includes("Special Week")) {
            setCurrentWheel({
              key: "special-week-extra",
              title: "Special Week Power Selection",
              sections: [
                {
                  id: "gourmand",
                  name: "Gourmand",
                  weight: 1,
                  color: "#FFD700",
                },
                {
                  id: "hydrate",
                  name: "Hydrate",
                  weight: 1,
                  color: "#87CEEB",
                },
              ],
            });
          } else {
            setCurrentWheel(archetypeWheel);
          }

          return { shouldContinue: false };

        default:
          return { shouldContinue: true };
      }
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

  // Handle subrace selection
  const handleSubraceSelection = useCallback(
    (resultName: string, params: RaceHandlerParams): RaceHandlerResult => {
      const { dispatch, setCurrentWheel, characterState } = params;
      dispatch({ type: "SET_RESULT", key: "subrace", value: resultName });

      if (characterState.results.race === "Vampire") {
        setCurrentWheel({
          ...uniqueVampireTrainWheel,
          key: "uniqueVampireTrain",
          title: "Unique Taste Train",
        });
        return { shouldContinue: false };
      } else if (
        characterState.results.race === "Goblin" &&
        resultName === "Goblin (1)"
      ) {
        dispatch({
          type: "ADD_ARCHETYPE",
          archetype: { id: "33", name: "Him", weight: 1, color: "#1E90FF" },
        });
        const raceOrSubrace = getRaceOrSubrace(characterState.results);
        const firstStatWheel = getStatWheel(raceOrSubrace, STAT_WHEELS[0]);

        if (firstStatWheel) {
          setCurrentWheel(firstStatWheel);
          return { shouldContinue: false };
        } else {
          // Fallback nếu không tìm được stat wheel
          setCurrentWheel(archetypeWheel);
          return { shouldContinue: false };
        }
      } else if (characterState.results.race === "Elf") {
        if (resultName === "Lythari") {
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q41",
              name: "Raconteur",
              weight: 1.79,
              color: "#F08080",
              description:
                "Trong combat: Round chiến thắng đầu tiên của bản thân sẽ không được nhận điểm mà khiến đối thủ bị -1 điểm.",
            },
          });
        } else if (resultName === "Moon Elf") {
          setCurrentWheel({
            ...playerWheel,
            key: "lover",
            title: "Moon Elf - Lover Selection",
          });
        }

        setCurrentWheel(archetypeWheel);
        return { shouldContinue: false };
      } else if (characterState.results.race === "Werebeast") {
        if (resultName === "Wererat") {
          dispatch({
            type: "ADD_POWER",
            power: {
              id: "9",
              name: "Crimson Poison",
              effect:
                "Đối thủ -1 Durability, giảm thêm 1 với mỗi 2 Power sở hữu.",
              weight: 0.9,
              color: "",
            },
          });
        } else if (resultName === "Wereboar") {
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q53",
              name: "Relentless",
              weight: 1.79,
              color: "#FF4500",
              description:
                "Sau khi chiến thắng, Đối thủ sẽ bị -3 vào 1 stat ngẫu nhiên.",
            },
          });
        } else if (resultName === "Werebat") {
          dispatch({
            type: "ADD_POWER",
            power: {
              id: "10",
              name: "Bloody Strike",
              effect:
                "Nhận -1 All Stats. Với mỗi Round thắng,+1 vào Stat đó (Áp dụng sau combat)",
              weight: 0.9,
              color: "",
            },
          });
        } else if (resultName === "Werecapybara") {
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q9",
              name: "Cute",
              weight: 1.79,
              color: "#FF69B4",
              description: 'Quay 1 player để làm "Lover". Nhận +1 IQ',
            },
          });
          setCurrentWheel({
            ...playerWheel,
            key: "lover",
            title: "Werecapybara - Cute Lover Selection",
          });
        }

        setCurrentWheel(archetypeWheel);
        return { shouldContinue: false };
      } else if (characterState.results.race === "Dragon") {
        if (resultName === "Ancient Dragon") {
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
        } else if (resultName === "Undead Dragon") {
          setCurrentWheel({
            key: "summon",
            title: "Undead Dragon - Summon Selection",
            sections: summonWheel.sections,
          });
          return { shouldContinue: false };
        } else if (resultName === "Thunder Dragon") {
          dispatch({
            type: "ADD_POWER",
            power: {
              id: "13",
              name: "Thunder Orb",
              effect: "Đối thủ giảm 2 Durability.",
              weight: 0.9,
              color: "",
            },
          });
        }

        setCurrentWheel(archetypeWheel);
        return { shouldContinue: false };
      } else if (characterState.results.race === "Angel") {
        if (resultName === "Powers") {
          dispatch({
            type: "ADD_ARCHETYPE",
            archetype: {
              id: "31",
              name: "Paladin",
              weight: 2,
              color: "#DAA520",
            },
          });
        }
        setCurrentWheel(archetypeWheel);
        return { shouldContinue: false };
      } else if (characterState.results.race === "Demi-God") {
        if (resultName === "Love") {
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q55",
              name: "Beauty",
              weight: 1.79,
              color: "#FF69B4",
              description: 'Quay 1 player để làm "Lover". Nhận +1 BIQ',
            },
          });
          setCurrentWheel({
            ...playerWheel,
            key: "lover",
            title: "God's gift - Lover Selection",
          });
          setCurrentWheel(archetypeWheel);
        }
        setCurrentWheel(archetypeWheel);
        return { shouldContinue: false };
      } else if (characterState.results.race === "Demon") {
        if (resultName === "Beelzebub") {
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q54",
              name: "Tham ăn",
              weight: 1.79,
              color: "#8FBC8F",
              description: "Với mỗi 2 Base Dura, nhận -1 Speed",
            },
          });
          return { shouldContinue: false };
        } else if (resultName === "Leviathan") {
          setCurrentWheel({
            key: "leviathan-house",
            title: "Leviathan house",
            sections: houseWheel.sections,
          });
          return { shouldContinue: false };
        } else if (resultName === "Behemoth") {
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q8",
              name: "Cay/Tri",
              weight: 1.79,
              color: "#9370DB",
              description:
                "Nhận -1 IQ và 1 BIQ. Khi thua trận, -1 IQ và -1 BIQ",
            },
          });
        } else if (resultName === "Mammon") {
          dispatch({
            type: "ADD_ARCHETYPE",
            archetype: {
              id: "45",
              name: "Gambler Bloodline",
              weight: 1.5,
              color: "#8B008B",
            },
          });
        } else if (resultName === "Belphegor") {
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "ds6",
              name: "Belphegor",
              weight: 14,
              color: "#444466",
              description: `Quirk "Lazy", -2 Durability.`,
            },
          });
        } else if (resultName === "Asmodeus") {
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q6",
              name: "High Finger Skill",
              weight: 1.79,
              color: "#FFD700",
              description: 'Quay 1 player để làm "Lover". Nhận +1 Speed.',
            },
          });
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q9",
              name: "Cute",
              weight: 1.79,
              color: "#FF69B4",
              description: 'Quay 1 player để làm "Lover". Nhận +1 IQ',
            },
          });
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q55",
              name: "Beauty",
              weight: 1.79,
              color: "#FF69B4",
              description: 'Quay 1 player để làm "Lover". Nhận +1 BIQ',
            },
          });
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q49",
              name: "Thích Liên Hoan Xác Thịt",
              weight: 1.79,
              color: "#FF1493",
              description:
                "80% Sẽ Make love với đối thủ sau trận đấu nếu thắng cuộc.",
            },
          });
          dispatch({
            type: "SET_RESULT",
            key: "asmodeus-lovers-remaining",
            value: "4",
          });
          setCurrentWheel({
            key: "asmodeus-lover",
            title: "Lover Selection",
            sections: playerWheel.sections,
          });
          return { shouldContinue: false };
        } else if (resultName === "Sinful King") {
          // Sinful King does all previous actions
          // Add Tham ăn from Beelzebub
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q54",
              name: "Tham ăn",
              weight: 1.79,
              color: "#8FBC8F",
              description: "Với mỗi 2 Base Dura, nhận -1 Speed",
            },
          });

          // Add Cay/Tri from Behemoth
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q8",
              name: "Cay/Tri",
              weight: 1.79,
              color: "#9370DB",
              description:
                "Nhận -1 IQ và 1 BIQ. Khi thua trận, -1 IQ và -1 BIQ",
            },
          });

          // Add Gambler Bloodline from Mammon
          dispatch({
            type: "ADD_ARCHETYPE",
            archetype: {
              id: "45",
              name: "Gambler Bloodline",
              weight: 1.5,
              color: "#8B008B",
            },
          });

          // Add Belphegor quirk
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "ds6",
              name: "Belphegor",
              weight: 14,
              color: "#444466",
              description: `Quirk "Lazy", -2 Durability.`,
            },
          });

          // Add Asmodeus quirks
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q6",
              name: "High Finger Skill",
              weight: 1.79,
              color: "#FFD700",
              description: 'Quay 1 player để làm "Lover". Nhận +1 Speed.',
            },
          });
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q9",
              name: "Cute",
              weight: 1.79,
              color: "#FF69B4",
              description: 'Quay 1 player để làm "Lover". Nhận +1 IQ',
            },
          });
          dispatch({
            type: "ADD_QUIRK",
            quirk: {
              id: "q55",
              name: "Beauty",
              weight: 1.79,
              color: "#FF69B4",
              description: 'Quay 1 player để làm "Lover". Nhận +1 BIQ',
            },
          });

          // Set up for Leviathan house selection first
          setCurrentWheel({
            key: "sinful-king-house",
            title: "Sinful King - Gia tộc Selection",
            sections: houseWheel.sections,
          });
          return { shouldContinue: false };
        }

        setCurrentWheel(archetypeWheel);
        return { shouldContinue: false };
      } else if (characterState.results.race === "God") {
        if (resultName === "Apollo") {
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
          dispatch({
            type: "ADD_POWER",
            power: {
              id: "HP01",
              name: "Healing Factor",
              effect:
                "Nhận +1 Durability. Với mỗi 2 round thua trong 1 combat, nhận +1 Durability. (áp dụng sau combat)",
              weight: 0.0,
              color: "",
            },
          });
        } else if (resultName === "Artemis") {
          dispatch({
            type: "ADD_POWER",
            power: {
              id: "HP02",
              name: "Hunter's Rewards",
              effect:
                "Sau khi thắng 1 combat PvP, nhận 2 phần thưởng PvP thay vì 1.",
              weight: 0.0,
              color: "",
            },
          });
        }
        setCurrentWheel(archetypeWheel);
        return { shouldContinue: false };
      } else if (characterState.results.race === "Primordial Being") {
        if (resultName === "Air") {
          dispatch({
            type: "ADD_POWER",
            power: {
              id: "49",
              name: "Blowing Leaves",
              effect: "Thổi lá bay đi 💀",
              weight: 0.9,
              color: "",
            },
          });
        } else if (resultName === "Water") {
          dispatch({
            type: "ADD_POWER",
            power: {
              id: "14",
              name: "Water Breathing",
              effect: "Thở dưới nước.",
              weight: 0.9,
              color: "",
            },
          });
        } else if (resultName === "Fire") {
          dispatch({
            type: "ADD_POWER",
            power: {
              id: "12",
              name: "Fire Control",
              effect:
                "Có thể điều khiển được một ngọn lửa bật hoặc tắt. Ngoài ra không tác dụng 💀",
              weight: 0.9,
              color: "",
            },
          });
        } else if (resultName === "Earth") {
          dispatch({
            type: "ADD_POWER",
            power: {
              id: "60",
              name: "Earth-Shaking",
              effect: "Đất đá rung chuyển.",
              weight: 0.9,
              color: "",
            },
          });
        }
        setCurrentWheel(archetypeWheel);
        return { shouldContinue: false };
      } else {
        setCurrentWheel(archetypeWheel);
        return { shouldContinue: false };
      }
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
