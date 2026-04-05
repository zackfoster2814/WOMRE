import { Dispatch, SetStateAction } from "react";
import { CharacterStats } from "../types/character";
import { PvPPlayerData, DothrakiRule } from "../types/battleZone";
import { WheelSpinItem } from "../components/ProbabilityWheelModal";
import { EffectResolver } from "../effects/resolver";
import { getAssetPath } from "../utils/basePath";
import { _ALL_STAT_KEYS } from "../constants/battleZone";

type StatBubbleInput = {
  player: "player1" | "player2";
  text: string;
  isPositive: boolean;
};

type PreCombatModalState = {
  isOpen: boolean;
  title: string;
  description: string;
  items: WheelSpinItem[];
  side: "player1" | "player2";
  effectKey: string;
  onResult?: (result: {
    label: string;
    isSuccess: boolean;
    meta?: Record<string, unknown>;
  }) => void;
};

type CreatorsCatModalState = {
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
  rollQueue: (keyof CharacterStats)[];
  rollAccumulated: { stat: keyof CharacterStats; value: number }[];
  rollRaceName: string;
  rollTotal: number;
};

interface UseWheelHandlersParams {
  player1: PvPPlayerData | null;
  player2: PvPPlayerData | null;
  disabledItems: Set<string>;
  setPlayer1: Dispatch<SetStateAction<PvPPlayerData | null>>;
  setPlayer2: Dispatch<SetStateAction<PvPPlayerData | null>>;
  setDisabledItems: Dispatch<SetStateAction<Set<string>>>;
  setOneTrickPonyStat: Dispatch<SetStateAction<Record<string, string>>>;
  setGuidanceStats: Dispatch<SetStateAction<Record<string, string[]>>>;
  setPreCombatModal: Dispatch<SetStateAction<PreCombatModalState>>;
  setCursedCoinTarget: Dispatch<
    SetStateAction<Record<string, "self" | "opponent">>
  >;
  setHuntersMarkStat: Dispatch<SetStateAction<Record<string, string>>>;
  setGoldenCoinPoints: Dispatch<SetStateAction<Record<string, number>>>;
  setRaumanianSuccess: Dispatch<SetStateAction<Record<string, boolean>>>;
  setScryingSuccess: Dispatch<SetStateAction<Record<string, boolean>>>;
  setEncroachingShadowSuccess: Dispatch<
    SetStateAction<Record<string, boolean>>
  >;
  setGoldShipResult: Dispatch<
    SetStateAction<Record<string, boolean | null>>
  >;
  setLuckManipulationResult: Dispatch<
    SetStateAction<Record<string, number | null>>
  >;
  setMadScientistResult: Dispatch<
    SetStateAction<Record<string, boolean | null>>
  >;
  setDothrakiSpinResult: Dispatch<
    SetStateAction<Record<string, DothrakiRule>>
  >;
  setBlackMagicStat: Dispatch<
    SetStateAction<Record<string, keyof CharacterStats | null>>
  >;
  setSummoningScrollResult: Dispatch<
    SetStateAction<
      Record<
        string,
        {
          statDeltas: Partial<Record<keyof CharacterStats, number>>;
          startScoreDelta: number;
          summonName: string;
        } | null
      >
    >
  >;
  setTricksterResult: Dispatch<
    SetStateAction<Record<string, string | null>>
  >;
  setRhittaResult: Dispatch<SetStateAction<Record<string, boolean>>>;
  setCreatorsCatModal: Dispatch<SetStateAction<CreatorsCatModalState>>;
  spawnStatBubbles: (bubbles: StatBubbleInput[]) => void;
}

export function useWheelHandlers({
  player1,
  player2,
  disabledItems,
  setPlayer1,
  setPlayer2,
  setDisabledItems,
  setOneTrickPonyStat,
  setGuidanceStats,
  setPreCombatModal,
  setCursedCoinTarget,
  setHuntersMarkStat,
  setGoldenCoinPoints,
  setRaumanianSuccess,
  setScryingSuccess,
  setEncroachingShadowSuccess,
  setGoldShipResult,
  setLuckManipulationResult,
  setMadScientistResult,
  setDothrakiSpinResult,
  setBlackMagicStat,
  setSummoningScrollResult,
  setTricksterResult,
  setRhittaResult,
  setCreatorsCatModal,
  spawnStatBubbles,
}: UseWheelHandlersParams) {
  const handleWheelResolved = (
    playerLabel: "player1" | "player2",
    sourceName: string,
    item: WheelSpinItem,
  ) => {
    if (sourceName === "one trick pony") {
      setOneTrickPonyStat((prev) => ({ ...prev, [playerLabel]: item.label }));
    } else if (sourceName === "guidance") {
      // Stat 1 đã chọn → mở wheel stat 2 (loại stat đã chọn)
      const stat1 = item.label;
      const ALL_STAT_ITEMS: WheelSpinItem[] = [
        { label: "str", weight: 1, isSuccess: true, color: "#ef4444" },
        { label: "spd", weight: 1, isSuccess: true, color: "#3b82f6" },
        { label: "dur", weight: 1, isSuccess: true, color: "#10b981" },
        { label: "iq", weight: 1, isSuccess: true, color: "#a855f7" },
        { label: "biq", weight: 1, isSuccess: true, color: "#ec4899" },
        { label: "ma", weight: 1, isSuccess: true, color: "#f59e0b" },
      ];
      const stat2Items = ALL_STAT_ITEMS.filter((s) => s.label !== stat1);
      setGuidanceStats((prev) => ({ ...prev, [playerLabel]: [stat1] }));
      setPreCombatModal({
        isOpen: true,
        title: `Guidance — Chọn Stat 2 (${playerLabel === "player1" ? player1?.name : player2?.name})`,
        description: `Đã chọn Stat 1: ${stat1.toUpperCase()}. Quay để chọn Stat 2.`,
        items: stat2Items,
        side: playerLabel,
        effectKey: `guidance-stat2-${playerLabel}`,
        onResult: (result) => {
          const stat2 = result.label;
          setGuidanceStats((prev) => ({
            ...prev,
            [playerLabel]: [stat1, stat2],
          }));
          spawnStatBubbles([
            {
              player: playerLabel,
              text: `+1 ${stat1.toUpperCase()} (Guidance)`,
              isPositive: true,
            },
            {
              player: playerLabel,
              text: `+1 ${stat2.toUpperCase()} (Guidance)`,
              isPositive: true,
            },
          ]);
        },
      });
    } else if (sourceName === "cursed coin") {
      // isSuccess=true → đối thủ bị -1 all; isSuccess=false → bản thân bị -1 all
      const target = item.isSuccess ? "opponent" : "self";
      setCursedCoinTarget((prev) => ({ ...prev, [playerLabel]: target }));
      const affectedSide =
        target === "self"
          ? playerLabel
          : playerLabel === "player1"
            ? "player2"
            : "player1";
      spawnStatBubbles([
        {
          player: affectedSide,
          text: `-1 All Stats (Cursed Coin)`,
          isPositive: false,
        },
      ]);
    } else if (sourceName === "hunter's mark") {
      setHuntersMarkStat((prev) => ({ ...prev, [playerLabel]: item.label }));
      // Spell Flux + Hunter's Mark: chỉ 1 round được chọn, nhưng thắng round đó +2 điểm (xử lý trong engine)
    } else if (sourceName.startsWith("golden coin")) {
      // label là "+X điểm khởi đầu (Y%)" — parse số điểm từ label
      const match = item.label.match(/\+(\d+)\s*điểm/);
      const pts = match ? parseInt(match[1], 10) : item.isSuccess ? 1 : 0;
      setGoldenCoinPoints((prev) => ({ ...prev, [playerLabel]: pts }));
      if (pts > 0)
        spawnStatBubbles([
          {
            player: playerLabel,
            text: `+${pts} điểm khởi đầu (Golden Coin)`,
            isPositive: true,
          },
        ]);
    } else if (sourceName === "raumanian" || sourceName === "raumanian🍀") {
      setRaumanianSuccess((prev) => ({
        ...prev,
        [playerLabel]: item.isSuccess === true,
      }));
      if (item.isSuccess) {
        spawnStatBubbles([
          {
            player: playerLabel,
            text: "+1 điểm khởi đầu (Raumanian)",
            isPositive: true,
          },
        ]);
      }
      try {
        new Audio(getAssetPath("/assets/sfx/raumanian.mp3"))
          .play()
          .catch(() => {});
      } catch (_) {}
    } else if (sourceName === "scrying") {
      const success = item.isSuccess === true;
      setScryingSuccess((prev) => ({ ...prev, [playerLabel]: success }));
      if (success) {
        const oppLabel = playerLabel === "player1" ? "player2" : "player1";
        spawnStatBubbles([
          {
            player: oppLabel,
            text: "-4 Stat cao nhất (Scrying)",
            isPositive: false,
          },
        ]);
      }
    } else if (sourceName === "encroaching shadow") {
      const success = item.isSuccess === true;
      setEncroachingShadowSuccess((prev) => ({
        ...prev,
        [playerLabel]: success,
      }));
      if (success) {
        spawnStatBubbles([
          {
            player: playerLabel,
            text: "+7 SPD (Encroaching Shadow)",
            isPositive: true,
          },
        ]);
      }
    } else if (sourceName === "gold ship") {
      const isPositive = item.isSuccess === true;
      setGoldShipResult((prev) => ({ ...prev, [playerLabel]: isPositive }));
      spawnStatBubbles([
        {
          player: playerLabel,
          text: isPositive
            ? "+1 All Stats (Gold Ship)"
            : "-1 All Stats (Gold Ship)",
          isPositive,
        },
      ]);
    } else if (sourceName === "luck manipulation") {
      const delta = (item.meta as any)?.delta ?? 0;
      setLuckManipulationResult((prev) => ({ ...prev, [playerLabel]: delta }));
      if (delta > 0) {
        spawnStatBubbles([
          {
            player: playerLabel,
            text: `+${delta} All Stats (Luck Manipulation)`,
            isPositive: true,
          },
        ]);
      }
    } else if (sourceName === "mad scientist") {
      const isShrinking = item.label.toLowerCase().includes("shrinking");
      setMadScientistResult((prev) => ({
        ...prev,
        [playerLabel]: isShrinking,
      }));
      if (isShrinking) {
        spawnStatBubbles([
          {
            player: playerLabel,
            text: "Mad Scientist: Shrinking → +6 SPD, -3 STR, -3 DUR",
            isPositive: true,
          },
        ]);
      } else {
        spawnStatBubbles([
          {
            player: playerLabel,
            text: "Mad Scientist: Enlarging → +3 STR, +3 DUR, -6 SPD",
            isPositive: true,
          },
        ]);
      }
    } else if (sourceName === "dothraki") {
      const rule = (item.meta?.ruleIndex ?? null) as DothrakiRule;
      if (rule !== null) {
        setDothrakiSpinResult((prev) => ({ ...prev, [playerLabel]: rule }));
      }
    } else if (sourceName === "cursed pennywort") {
      if (!item.isSuccess) return; // 64% không kích hoạt
      // Kích hoạt: vô hiệu 3 power của đối thủ (hoặc tất cả nếu ≤3)
      const disableTarget: "player1" | "player2" =
        playerLabel === "player1" ? "player2" : "player1";
      const oppPlayer = disableTarget === "player1" ? player1 : player2;
      if (!oppPlayer) return;
      const oppPowers = (oppPlayer.character?.powers || [])
        .filter((p: any) => !p?.isLost)
        .map((p: any) => (typeof p === "string" ? p : (p?.name ?? "")))
        .filter(Boolean);
      if (oppPowers.length === 0) return;
      const POWER_COLORS = [
        "#ef4444",
        "#f59e0b",
        "#22c55e",
        "#3b82f6",
        "#a855f7",
        "#ec4899",
        "#06b6d4",
        "#84cc16",
      ];
      const maxDisable = 3;
      if (oppPowers.length <= maxDisable) {
        // Auto-disable tất cả
        setDisabledItems((prev) => {
          const next = new Set(prev);
          for (const pn of oppPowers) next.add(`${oppPlayer.no}-power-${pn}`);
          return next;
        });
        return;
      }
      // Mở wheel chọn power — chain 3 lần, track những power đã chọn để loại khỏi lần sau
      const alreadyChosen: string[] = [];
      const openPennyWheelSpin = (spinIdx: number, remaining: string[]) => {
        setPreCombatModal({
          isOpen: true,
          title: `Cursed Pennywort — Chọn Power vô hiệu (${spinIdx}/${maxDisable})`,
          description: `${oppPlayer.name}: Quay để chọn power bị vô hiệu (lần ${spinIdx}/${maxDisable})`,
          items: remaining.map((name, i) => ({
            label: name,
            weight: 1,
            isSuccess: true,
            color: POWER_COLORS[i % POWER_COLORS.length],
            meta: { powerName: name, disableTarget },
          })),
          side: playerLabel,
          effectKey: `cursed-pennywort-${playerLabel}-spin${spinIdx}`,
          onResult: (result) => {
            const chosen = result.label;
            alreadyChosen.push(chosen);
            setDisabledItems((prev) => {
              const next = new Set(prev);
              next.add(`${oppPlayer.no}-power-${chosen}`);
              return next;
            });
            if (spinIdx < maxDisable) {
              const nextRemaining = remaining.filter((p) => p !== chosen);
              if (nextRemaining.length > 0) {
                setTimeout(
                  () => openPennyWheelSpin(spinIdx + 1, nextRemaining),
                  150,
                );
              }
            }
          },
        });
      };
      openPennyWheelSpin(1, oppPowers);
    } else if (
      (sourceName === "power negation" ||
        sourceName === "anti-magic barrier" ||
        sourceName === "memory alter") &&
      item.meta?.powerName
    ) {
      // Power Negation / Anti-Magic Barrier: disable power được chọn của đối thủ
      const powerName = item.meta.powerName as string;
      const disableTarget = item.meta.disableTarget as "player1" | "player2";
      const oppPlayer = disableTarget === "player1" ? player1 : player2;
      if (oppPlayer) {
        const disableKey = `${oppPlayer.no}-power-${powerName}`;
        setDisabledItems((prev) => {
          const next = new Set(prev);
          next.add(disableKey);
          return next;
        });
      }
    } else if (sourceName === "black magic") {
      const statMap: Record<string, keyof CharacterStats> = {
        STR: "str",
        SPD: "spd",
        DUR: "dur",
        IQ: "iq",
        BIQ: "biq",
        MA: "ma",
      };
      const stat = statMap[item.label];
      if (stat) {
        setBlackMagicStat((prev) => ({ ...prev, [playerLabel]: stat }));
        const oppLabel = playerLabel === "player1" ? "player2" : "player1";
        const selfPlayer = playerLabel === "player1" ? player1 : player2;
        const oppPlayer = oppLabel === "player1" ? player1 : player2;
        const checkUno = (p: typeof player1) =>
          (p?.character?.powers || [])
            .filter((pw: any) => !pw.isLost)
            .some(
              (pw: any) =>
                (typeof pw === "string"
                  ? pw
                  : (pw?.name ?? "")
                ).toLowerCase() === "uno reverse card",
            ) && !disabledItems.has(`${p?.no}-power-Uno Reverse Card`);
        // URC: nếu chính người dùng BM có URC → debuff quay lại họ; nếu đối thủ có URC → debuff quay lại người dùng BM
        const selfHasUno = checkUno(selfPlayer);
        const oppHasUno = checkUno(oppPlayer);
        const unoActive = selfHasUno || oppHasUno;
        const actualTarget = unoActive ? playerLabel : oppLabel;
        const bubbleText = unoActive
          ? `-2 ${item.label} (Black Magic — Uno Reverse!)`
          : `-2 ${item.label} (Black Magic)`;
        spawnStatBubbles([
          { player: actualTarget, text: bubbleText, isPositive: false },
        ]);
      }
    } else if (sourceName === "summoning scroll" || sourceName === "blackjack") {
      const label = item.label;
      const statDeltas: Partial<Record<keyof CharacterStats, number>> = {};
      let startScoreDelta = 0;
      if (label.startsWith("Chihuahua")) {
        for (const k of _ALL_STAT_KEYS) statDeltas[k] = -1;
        spawnStatBubbles([
          {
            player: playerLabel,
            text: "Chihuahua: -1 All Stats (Summon)",
            isPositive: false,
          },
        ]);
      } else if (label.startsWith("Mufasa")) {
        statDeltas.str = 3;
        spawnStatBubbles([
          {
            player: playerLabel,
            text: "Mufasa: +3 STR (Summon)",
            isPositive: true,
          },
        ]);
      } else if (label.startsWith("Pack of Wolves")) {
        statDeltas.spd = 3;
        spawnStatBubbles([
          {
            player: playerLabel,
            text: "Pack of Wolves: +3 SPD (Summon)",
            isPositive: true,
          },
        ]);
      } else if (label.startsWith("Earth Golem")) {
        statDeltas.dur = 3;
        spawnStatBubbles([
          {
            player: playerLabel,
            text: "Earth Golem: +3 DUR (Summon)",
            isPositive: true,
          },
        ]);
      } else if (label.startsWith("Water Elemental")) {
        statDeltas.iq = 3;
        spawnStatBubbles([
          {
            player: playerLabel,
            text: "Water Elemental: +3 IQ (Summon)",
            isPositive: true,
          },
        ]);
      } else if (label.startsWith("Imp")) {
        statDeltas.biq = 3;
        spawnStatBubbles([
          {
            player: playerLabel,
            text: "Imp: +3 BIQ (Summon)",
            isPositive: true,
          },
        ]);
      } else if (label.startsWith("Igris")) {
        statDeltas.ma = 3;
        spawnStatBubbles([
          {
            player: playerLabel,
            text: "Igris: +3 MA (Summon)",
            isPositive: true,
          },
        ]);
      } else if (label.startsWith("Numby") && item.meta?.needsStatRoll) {
        // Numby: cần quay thêm wheel 6 chỉ số
        const playerName =
          playerLabel === "player1" ? player1?.name : player2?.name;
        setPreCombatModal({
          isOpen: true,
          title: "Numby: Chọn chỉ số +4",
          description: `${playerName} — Numby: Quay để chọn 1 chỉ số nhận +4 trong combat này`,
          items: [
            { label: "STR", weight: 1, isSuccess: true, color: "#ef4444" },
            { label: "SPD", weight: 1, isSuccess: true, color: "#3b82f6" },
            { label: "DUR", weight: 1, isSuccess: true, color: "#84cc16" },
            { label: "IQ", weight: 1, isSuccess: true, color: "#06b6d4" },
            { label: "BIQ", weight: 1, isSuccess: true, color: "#a855f7" },
            { label: "MA", weight: 1, isSuccess: true, color: "#f97316" },
          ],
          side: playerLabel,
          effectKey: `numby-${playerLabel}`,
          onResult: (result) => {
            const numbyStatMap: Record<string, keyof CharacterStats> = {
              STR: "str",
              SPD: "spd",
              DUR: "dur",
              IQ: "iq",
              BIQ: "biq",
              MA: "ma",
            };
            const sk = numbyStatMap[result.label] as keyof CharacterStats;
            if (sk) {
              setSummoningScrollResult((prev) => ({
                ...prev,
                [playerLabel]: {
                  statDeltas: { [sk]: 4 },
                  startScoreDelta: 0,
                  summonName: "Numby",
                },
              }));
              spawnStatBubbles([
                {
                  player: playerLabel,
                  text: `Numby: +4 ${result.label} (Summon)`,
                  isPositive: true,
                },
              ]);
            }
          },
        });
        return;
      } else if (label.startsWith("Wyvern's Egg") && item.meta?.isWyvernsEgg) {
        // Placeholder: +2 điểm khởi đầu nếu là chung kết tổng — xử lý sau
        startScoreDelta = 0; // TODO: check if match is grand final
        spawnStatBubbles([
          {
            player: playerLabel,
            text: "Wyvern's Egg: Pending — +2 điểm nếu là chung kết tổng",
            isPositive: true,
          },
        ]);
      } else if (
        label.startsWith("Creator's Cat") &&
        item.meta?.isCreatorsCat
      ) {
        // Creator's Cat: thêm charDev + mở modal chọn hiệu ứng
        const setPlayer = playerLabel === "player1" ? setPlayer1 : setPlayer2;
        setPlayer((prev) => {
          if (!prev?.character) return prev;
          const updatedChar = {
            ...prev.character,
            charDevs: [
              ...((prev.character as any).charDevs || []),
              { name: "Creator's Favor", isLost: false },
            ],
          };
          return { ...prev, character: updatedChar };
        });
        setCreatorsCatModal({
          isOpen: true,
          playerLabel,
          step: "choose_effect",
          selectedEffect: "",
          chosenStats: [],
          chosenArchetypesToRemove: [],
          rollQueue: [],
          rollAccumulated: [],
          rollRaceName: "",
          rollTotal: 0,
        });
        return;
      }
      if (
        Object.keys(statDeltas).length > 0 ||
        startScoreDelta > 0 ||
        label.startsWith("Wyvern")
      ) {
        setSummoningScrollResult((prev) => ({
          ...prev,
          [playerLabel]: {
            statDeltas,
            startScoreDelta,
            summonName: label.split(":")[0],
          },
        }));
      }
    } else if (sourceName === "trickster") {
      const subtype = item.label.toLowerCase();
      setTricksterResult((prev) => ({ ...prev, [playerLabel]: subtype }));
      const msg =
        subtype === "ten of hearts"
          ? "Trickster: Ten of Hearts — Không có gì xảy ra"
          : subtype === "ace of spades"
            ? "Trickster: Ace of Spades — Điểm 2 bên sẽ hoán đổi sau combat!"
            : subtype === "king of diamonds"
              ? "Trickster: King of Diamonds — +1 All Stats"
              : subtype === "queen of clubs"
                ? "Trickster: Queen of Clubs — -1 All Stats"
                : subtype === "jack of 97"
                  ? "Trickster: Jack of 97 — +97 All Stats"
                  : `Trickster: ${item.label}`;
      spawnStatBubbles([
        {
          player: playerLabel,
          text: msg,
          isPositive: subtype !== "queen of clubs",
        },
      ]);
    } else if (sourceName === "invoker" && item.meta?.powerName) {
      // Invoker: thêm power vào character rồi recalculate stats
      const powerName = item.meta.powerName as string;
      const setPlayer = playerLabel === "player1" ? setPlayer1 : setPlayer2;
      setPlayer((prev) => {
        if (!prev?.character) return prev;
        // Thêm power mới vào character.powers
        const updatedChar = {
          ...prev.character,
          powers: [
            ...(prev.character.powers || []),
            { name: powerName, isLost: false },
          ],
        };
        // Recalculate stats với power mới
        const fx = EffectResolver.calculateCharacterEffects(updatedChar, {
          isPvE: false,
        });
        const newStats: CharacterStats = {
          str: fx.totalStats.strength,
          spd: fx.totalStats.speed,
          dur: fx.totalStats.durability,
          iq: fx.totalStats.iq,
          biq: fx.totalStats.biq,
          ma: fx.totalStats.ma,
        };
        const newBreakdown =
          EffectResolver.getCharacterEffectBreakdown(updatedChar);
        return {
          ...prev,
          character: updatedChar,
          stats: newStats,
          breakdown: newBreakdown,
        };
      });
    } else if (sourceName === "rhitta") {
      setRhittaResult((prev) => ({ ...prev, [playerLabel]: !!item.isSuccess }));
      if (item.isSuccess) {
        spawnStatBubbles([
          {
            player: playerLabel,
            text: "+3 STR, +2 DUR (Rhitta)",
            isPositive: true,
          },
        ]);
      }
    }
  };

  return { handleWheelResolved };
}
