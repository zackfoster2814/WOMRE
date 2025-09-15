import { WheelStep } from "@/Common/Types/Types";
import { raceConfig, raceWheel } from "@/Common/Config/RaceConfig";
import { subraceMap } from "@/Common/Config/SubRaceConfig";
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
import { archetypeWheel, summonWheel } from "@/Common/Config/ArchetypeConfig";
import { houseWheel } from "@/Common/Config/HouseConfig";

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

type RaceHandler = (
  params: RaceHandlerParams,
  rolledResult: any,
  resultName: any
) => RaceHandlerResult;

export const DemonSubrace: Record<string, RaceHandler> = {
  Beelzebub: (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
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
    setCurrentWheel(archetypeWheel);
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "gay",
    };
  },
  Leviathan: (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
    setCurrentWheel({
      key: "leviathan-house",
      title: "Leviathan house",
      sections: houseWheel.sections,
    });
    setCurrentWheel(archetypeWheel);
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "gay",
    };
  },
  Behemoth: (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
    dispatch({
      type: "ADD_QUIRK",
      quirk: {
        id: "q8",
        name: "Cay/Tri",
        weight: 1.79,
        color: "#9370DB",
        description: "Nhận -1 IQ và 1 BIQ. Khi thua trận, -1 IQ và -1 BIQ",
      },
    });
    setCurrentWheel(archetypeWheel);
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "gay",
    };
  },
  Mammon: (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
    dispatch({
      type: "ADD_ARCHETYPE",
      archetype: {
        id: "45",
        name: "Gambler Bloodline",
        weight: 1.5,
        color: "#8B008B",
      },
    });
    setCurrentWheel(archetypeWheel);
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "gay",
    };
  },
  Belphegor: (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
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
    setCurrentWheel(archetypeWheel);
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "gay",
    };
  },
  Asmodeus: (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
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
    setCurrentWheel(archetypeWheel);
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "gay",
    };
  },
  "Sinful King": (params, rolledResult, resultName) => {
    const { setCurrentWheel, dispatch } = params;
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
        description: "Nhận -1 IQ và 1 BIQ. Khi thua trận, -1 IQ và -1 BIQ",
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
    setCurrentWheel(archetypeWheel);
    return {
      shouldContinue: false,
      nextWheel: undefined,
      message: "gay",
    };
  },
};
