import { useState } from "react";
import { CharacterStats } from "../types/character";
import { DothrakiRule } from "../types/battleZone";
import { WheelSpinItem } from "../components/ProbabilityWheelModal";

export type AfterCombatEntry = {
  player: "player1" | "player2";
  quirkName: string;
  description: string;
  wheelKey?: string;
  wheelItems?: WheelSpinItem[];
  statMods?: Array<{ stat: keyof CharacterStats; delta: number }>;
  gmAction?: boolean;
};

export function useWheelSpins() {
  const [roundSpinModal, setRoundSpinModal] = useState<{
    isOpen: boolean;
    title: string;
    items: WheelSpinItem[];
    roundIndex: number;
    side: "player1" | "player2";
  }>({ isOpen: false, title: "", items: [], roundIndex: -1, side: "player1" });

  // Track spin results per round per side: key = `${roundIndex}-${side}`
  const [roundSpinResults, setRoundSpinResults] = useState<
    Record<string, { label: string; isSuccess: boolean }>
  >({});

  // State for pre-combat wheels (Raumanian, One Trick Pony, Night Owl, Open-minded)
  const [preCombatModal, setPreCombatModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    items: WheelSpinItem[];
    side: "player1" | "player2";
    effectKey: string; // unique key để store result
    onResult?: (result: {
      label: string;
      isSuccess: boolean;
      meta?: Record<string, unknown>;
    }) => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    items: [],
    side: "player1",
    effectKey: "",
  });

  // One Trick Pony: stat được chọn cho mỗi player (key = "player1" | "player2")
  const [oneTrickPonyStat, setOneTrickPonyStat] = useState<
    Record<string, string>
  >({});

  // Hunter's Mark: stat được chọn trước combat (key = "player1" | "player2")
  const [huntersMarkStat, setHuntersMarkStat] = useState<
    Record<string, string>
  >({});
  // huntersMarkStat2 không còn dùng — Spell Flux + HM chỉ quay 1 lần, thắng +2 điểm
  const [_huntersMarkStat2, setHuntersMarkStat2] = useState<
    Record<string, string>
  >({});

  // Guidance: 2 stats được chọn qua wheel trước combat (key = "player1" | "player2", value = [stat1, stat2])
  const [guidanceStats, setGuidanceStats] = useState<Record<string, string[]>>(
    {},
  );

  // Raumanian: +1 điểm khởi đầu nếu thành công (key = "player1" | "player2")
  const [raumanianSuccess, setRaumanianSuccess] = useState<
    Record<string, boolean>
  >({});

  // Golden Coin: điểm khởi đầu từ wheel result (key = "player1" | "player2")
  const [goldenCoinPoints, setGoldenCoinPoints] = useState<
    Record<string, number>
  >({});

  // Cursed Coin: ai bị -1 all stats (key = "player1" | "player2", value = "self" | "opponent")
  const [cursedCoinTarget, setCursedCoinTarget] = useState<
    Record<string, "self" | "opponent">
  >({});

  // Scrying: 40% debuff -4 stat cao nhất đối thủ trước combat (key = "player1" | "player2", true = thành công)
  const [scryingSuccess, setScryingSuccess] = useState<Record<string, boolean>>(
    {},
  );

  // Encroaching Shadow: +7 Speed trước combat nếu thành công (key = "player1" | "player2")
  const [encroachingShadowSuccess, setEncroachingShadowSuccess] = useState<
    Record<string, boolean>
  >({});

  // Gold Ship: kết quả wheel 50/50 (true = +1 all, false = -1 all, undefined = chưa quay)
  const [goldShipResult, setGoldShipResult] = useState<
    Record<string, boolean | null>
  >({});

  // Luck Manipulation: số delta all stats sau wheel (0 = không gì, 1 = +1, 2 = +2, null = chưa quay)
  const [luckManipulationResult, setLuckManipulationResult] = useState<
    Record<string, number | null>
  >({});

  // Rhitta: kết quả wheel before_combat (true = thành công +3 STR +2 DUR, false/undefined = không)
  const [rhittaResult, setRhittaResult] = useState<Record<string, boolean>>({});

  // Mad Scientist: kết quả wheel (true = Shrinking: self +6 SPD -3 STR -3 DUR, false = Enlarging: self +3 STR +3 DUR -6 SPD)
  const [madScientistResult, setMadScientistResult] = useState<
    Record<string, boolean | null>
  >({});

  // Summoning Scroll: stat deltas từ summon wheel (key = "player1" | "player2")
  const [summoningScrollResult, setSummoningScrollResult] = useState<
    Record<
      string,
      {
        statDeltas: Partial<Record<keyof CharacterStats, number>>;
        startScoreDelta: number;
        summonName: string;
      } | null
    >
  >({});

  // Trickster: subtype được chọn từ wheel trước combat (key = "player1" | "player2")
  // "ace of spades" | "king of diamonds" | "queen of clubs" | "jack of 97" | "ten of hearts" | null
  const [tricksterResult, setTricksterResult] = useState<
    Record<string, string | null>
  >({});

  // Eternal Mangekyou Sharingan: stat bị debuff -6 của đối thủ (key = playerLabel người dùng EMS, value = "dur"|"iq"|"str")
  const [eternalMangekyouResult, setEternalMangekyouResult] = useState<
    Record<string, "dur" | "iq" | "str" | null>
  >({});

  // Black Magic: stat bị -2 của đối thủ (key = playerLabel của người dùng Black Magic, value = stat key)
  const [blackMagicStat, setBlackMagicStat] = useState<
    Record<string, keyof CharacterStats | null>
  >({});

  // Creator's Cat modal: chọn hiệu ứng Creator's Favor
  const [creatorsCatModal, setCreatorsCatModal] = useState<{
    isOpen: boolean;
    playerLabel: "player1" | "player2";
    step:
      | "choose_effect"
      | "choose_stats"
      | "choose_power"
      | "choose_gear"
      | "choose_weapon"
      | "choose_archetypes"
      | "choose_runeword"
      | "spin_power"
      | "spin_archetype";
    selectedEffect: string;
    chosenStats: (keyof CharacterStats)[];
    chosenArchetypesToRemove: string[];
    // Roll queue: danh sách stat chờ quay, accumulated kết quả đã quay
    rollQueue: (keyof CharacterStats)[];
    rollAccumulated: { stat: keyof CharacterStats; value: number }[];
    rollRaceName: string;
    rollTotal: number;
  }>({
    isOpen: false,
    playerLabel: "player1",
    step: "choose_effect",
    selectedEffect: "",
    chosenStats: [],
    chosenArchetypesToRemove: [],
    rollQueue: [],
    rollAccumulated: [],
    rollRaceName: "",
    rollTotal: 0,
  });
  // After-combat quirk effects: computed after all 6 rounds resolve
  const [afterCombatEntries, setAfterCombatEntries] = useState<
    AfterCombatEntry[]
  >([]);
  const [afterCombatSpinResults, setAfterCombatSpinResults] = useState<
    Record<string, { label: string; isSuccess: boolean }>
  >({});

  // Dothraki: rule được chọn qua vòng quay trước combat (key = "player1" | "player2", value = 1-6)
  const [dothrakiSpinResult, setDothrakiSpinResult] = useState<
    Record<string, DothrakiRule>
  >({});

  return {
    roundSpinModal,
    setRoundSpinModal,
    roundSpinResults,
    setRoundSpinResults,
    preCombatModal,
    setPreCombatModal,
    oneTrickPonyStat,
    setOneTrickPonyStat,
    huntersMarkStat,
    setHuntersMarkStat,
    setHuntersMarkStat2,
    guidanceStats,
    setGuidanceStats,
    raumanianSuccess,
    setRaumanianSuccess,
    goldenCoinPoints,
    setGoldenCoinPoints,
    cursedCoinTarget,
    setCursedCoinTarget,
    scryingSuccess,
    setScryingSuccess,
    encroachingShadowSuccess,
    setEncroachingShadowSuccess,
    goldShipResult,
    setGoldShipResult,
    luckManipulationResult,
    setLuckManipulationResult,
    rhittaResult,
    setRhittaResult,
    madScientistResult,
    setMadScientistResult,
    summoningScrollResult,
    setSummoningScrollResult,
    tricksterResult,
    setTricksterResult,
    eternalMangekyouResult,
    setEternalMangekyouResult,
    blackMagicStat,
    setBlackMagicStat,
    creatorsCatModal,
    setCreatorsCatModal,
    afterCombatEntries,
    setAfterCombatEntries,
    afterCombatSpinResults,
    setAfterCombatSpinResults,
    dothrakiSpinResult,
    setDothrakiSpinResult,
  };
}
