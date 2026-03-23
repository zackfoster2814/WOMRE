import { Dispatch, SetStateAction } from "react";
import { CharacterStats } from "../../types/character";
import { PvPPlayerData } from "../../types/battleZone";
import { AfterCombatEntry } from "../../hooks/useWheelSpins";
import { STAT_COLORS, RACE_STAT_WEIGHTS } from "../../constants/battleZone";
import { CreatorsCatModalState } from "./CreatorsCatModal";
import { type WheelSpinItem } from "../ProbabilityWheelModal";

// Local type — mirrors useWheelHandlers.ts / CreatorsCatModal.tsx
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

interface AfterCombatPanelProps {
  battleDone: boolean;
  afterCombatEntries: AfterCombatEntry[];
  player1: PvPPlayerData | null;
  player2: PvPPlayerData | null;
  afterCombatSpinResults: Record<
    string,
    { label: string; isSuccess: boolean; meta?: Record<string, unknown> }
  >;
  setAfterCombatSpinResults: Dispatch<
    SetStateAction<
      Record<
        string,
        { label: string; isSuccess: boolean; meta?: Record<string, unknown> }
      >
    >
  >;
  setPreCombatModal: Dispatch<SetStateAction<PreCombatModalState>>;
  setCreatorsCatModal: Dispatch<SetStateAction<CreatorsCatModalState>>;
  spawnStatBubbles: (
    bubbles: Array<{
      player: "player1" | "player2";
      text: string;
      isPositive: boolean;
    }>,
  ) => void;
}

export function AfterCombatPanel({
  battleDone,
  afterCombatEntries,
  player1,
  player2,
  afterCombatSpinResults,
  setAfterCombatSpinResults,
  setPreCombatModal,
  setCreatorsCatModal,
  spawnStatBubbles,
}: AfterCombatPanelProps) {
  if (!battleDone || afterCombatEntries.length === 0) return null;

  const pvpRewardEntries = afterCombatEntries.filter(
    (e) =>
      e.quirkName.startsWith("PvP Reward") ||
      e.quirkName === "Power Ranger" ||
      e.quirkName === "Bravest of the Brave" ||
      e.quirkName === "Impatient",
  );
  const otherEntries = afterCombatEntries.filter(
    (e) =>
      !e.quirkName.startsWith("PvP Reward") &&
      e.quirkName !== "Power Ranger" &&
      e.quirkName !== "Bravest of the Brave" &&
      e.quirkName !== "Impatient",
  );

  const renderEntry = (
    entry: (typeof afterCombatEntries)[0],
    idx: number,
    big: boolean,
  ) => {
    const pname =
      entry.player === "player1" ? player1?.name : player2?.name;
    const spinKey = entry.wheelKey ?? null;
    const spunResult = spinKey ? afterCombatSpinResults[spinKey] : null;
    const isP1 = entry.player === "player1";
    return (
      <div
        key={idx}
        className={`flex items-start gap-2 rounded-lg border ${
          big
            ? `px-4 py-3 ${isP1 ? "bg-blue-900/30 border-blue-500/50" : "bg-red-900/30 border-red-500/50"}`
            : `px-3 py-2 text-xs ${isP1 ? "bg-blue-900/20 border-blue-600/30" : "bg-red-900/20 border-red-600/30"}`
        }`}
      >
        <div className="flex-1 min-w-0">
          <span
            className={`font-bold mr-1 ${big ? "text-sm" : ""} ${isP1 ? "text-blue-300" : "text-red-300"}`}
          >
            [{pname}]
          </span>
          <span
            className={`font-semibold ${big ? "text-sm text-yellow-300" : "text-purple-200"}`}
          >
            {entry.quirkName}:
          </span>{" "}
          <span
            className={big ? "text-sm text-gray-200" : "text-gray-300"}
          >
            {entry.description}
          </span>
          {spunResult && (
            <div className={`mt-1 flex items-center gap-2`}>
              <span
                className={`font-bold ${big ? "text-base" : ""} ${spunResult.isSuccess ? "text-green-400" : "text-gray-400"}`}
              >
                → {spunResult.label}
              </span>
              {spunResult.label === "Bỏ qua" && spinKey && (
                <button
                  onClick={() => {
                    setAfterCombatSpinResults((prev) => {
                      const next = { ...prev };
                      delete next[spinKey];
                      return next;
                    });
                  }}
                  className="text-[10px] px-1.5 py-0.5 rounded border border-gray-500/40 text-gray-400 hover:text-gray-200 hover:border-gray-400/60 transition-colors"
                >
                  Hoàn tác
                </button>
              )}
            </div>
          )}
        </div>
        {spinKey && !spunResult && (
          <div className="flex flex-col gap-1 shrink-0">
            <button
              onClick={() => {
                setPreCombatModal({
                  isOpen: true,
                  title: `${entry.quirkName} — ${pname}`,
                  description: entry.description,
                  items: (entry.wheelItems ?? []) as { label: string; weight: number; isSuccess: boolean; color?: string; meta?: Record<string, unknown> }[],
                  side: entry.player,
                  effectKey: spinKey,
                  onResult: (result: {
                    label: string;
                    isSuccess: boolean;
                    meta?: Record<string, unknown>;
                  }) => {
                    setAfterCombatSpinResults((prev) => ({
                      ...prev,
                      [spinKey]: result,
                    }));
                    if (
                      result.isSuccess &&
                      entry.statMods &&
                      entry.statMods.length > 0
                    ) {
                      const bubbles: {
                        player: "player1" | "player2";
                        text: string;
                        isPositive: boolean;
                      }[] = [];
                      for (const mod of entry.statMods) {
                        bubbles.push({
                          player: entry.player,
                          text: `${mod.delta >= 0 ? "+" : ""}${mod.delta} ${mod.stat.toUpperCase()} (${entry.quirkName})`,
                          isPositive: mod.delta >= 0,
                        });
                      }
                      if (bubbles.length > 0) spawnStatBubbles(bubbles);
                    }
                    // Fast Learner: nếu thành công → mở wheel chọn power từ đối thủ
                    if (
                      entry.quirkName === "Fast Learner" &&
                      result.isSuccess
                    ) {
                      const successItem = entry.wheelItems?.find(
                        (it) => it.isSuccess,
                      );
                      const oppPowers =
                        (successItem?.meta?.oppPowers as string[]) ?? [];
                      if (oppPowers.length > 0) {
                        const colors = [
                          "#ef4444",
                          "#f59e0b",
                          "#22c55e",
                          "#3b82f6",
                          "#a855f7",
                          "#ec4899",
                          "#06b6d4",
                          "#84cc16",
                        ];
                        setTimeout(() => {
                          setPreCombatModal({
                            isOpen: true,
                            title: `Fast Learner — Chọn Power để học`,
                            description: `${entry.player === "player1" ? player1?.name : player2?.name} — Học 1 Power từ đối thủ:`,
                            items: oppPowers.map(
                              (p: string, i: number) => ({
                                label: p,
                                weight: 1,
                                isSuccess: true,
                                color: colors[i % colors.length],
                              }),
                            ),
                            side: entry.player,
                            effectKey: `fast-learner-power-${spinKey}`,
                            onResult: (powerResult) => {
                              spawnStatBubbles([
                                {
                                  player: entry.player,
                                  text: `Fast Learner: Học được Power "${powerResult.label}" [GM apply]`,
                                  isPositive: true,
                                },
                              ]);
                            },
                          });
                        }, 100);
                      }
                    }
                    // Hou Yi's Divine Bow
                    if (spinKey.startsWith("after-HouYi-")) {
                      const suns = (result.meta?.suns as number) ?? 1;
                      spawnStatBubbles([
                        {
                          player: entry.player,
                          text: `☀ Bắn rụng ${suns} mặt trời → +3 all stats`,
                          isPositive: true,
                        },
                      ]);
                    }
                    // Mohg (hoặc house_sub random stat): map label → +delta stat
                    if (spinKey.includes("-random-")) {
                      const statMap2: Record<
                        string,
                        keyof CharacterStats
                      > = {
                        STR: "str",
                        SPD: "spd",
                        DUR: "dur",
                        IQ: "iq",
                        BIQ: "biq",
                        MA: "ma",
                      };
                      const sk2 = statMap2[result.label];
                      if (sk2) {
                        spawnStatBubbles([
                          {
                            player: entry.player,
                            text: `${entry.quirkName}: +1 ${result.label}`,
                            isPositive: true,
                          },
                        ]);
                      }
                    }
                    // Frostmourne: stat ngẫu nhiên → spawn bubble
                    if (
                      spinKey.startsWith("after-Frostmourne-stat-")
                    ) {
                      const statMap3: Record<
                        string,
                        keyof CharacterStats
                      > = {
                        STR: "str",
                        SPD: "spd",
                        DUR: "dur",
                        IQ: "iq",
                        BIQ: "biq",
                        MA: "ma",
                      };
                      const sk3 = statMap3[result.label];
                      if (sk3) {
                        spawnStatBubbles([
                          {
                            player: entry.player,
                            text: `Frostmourne: +1 ${result.label}`,
                            isPositive: true,
                          },
                        ]);
                      }
                    }
                    // Frostmourne: power nhận được → notify
                    if (
                      spinKey.startsWith("after-Frostmourne-power-")
                    ) {
                      spawnStatBubbles([
                        {
                          player: entry.player,
                          text: `Frostmourne: Nhận Power "${result.label}" [GM apply]`,
                          isPositive: true,
                        },
                      ]);
                    }
                    // Blood Sword: Power bị hi sinh → +1 STR, +1 MA
                    if (spinKey.startsWith("after-BloodSword-")) {
                      spawnStatBubbles([
                        {
                          player: entry.player,
                          text: `Blood Sword: Mất Power "${result.label}" → +1 STR, +1 MA [GM xóa Power]`,
                          isPositive: true,
                        },
                      ]);
                    }
                    // MrBeast
                    if (spinKey.startsWith("after-MrBeast-")) {
                      const pname2 =
                        entry.player === "player1"
                          ? player1?.name
                          : player2?.name;
                      spawnStatBubbles([
                        {
                          player: entry.player,
                          text: `MrBeast: ${pname2} tặng "${result.label}" cho 5 player ngẫu nhiên — GM dùng Wheel Of Name để chọn 5 người`,
                          isPositive: true,
                        },
                      ]);
                    }
                    // Văn tế bước 2: sau khi chọn player còn sống, GM re-spin stat cao nhất
                    if (spinKey.startsWith("after-VanTe-")) {
                      const chosenItem = entry.wheelItems?.find(
                        (it) => it.label === result.label,
                      );
                      const chosenName =
                        (chosenItem?.meta?.playerName as string) ||
                        result.label;
                      spawnStatBubbles([
                        {
                          player: entry.player,
                          text: `Văn Tế: ${chosenName} được chọn — GM re-spin stat cao nhất của ${chosenName} [GM apply]`,
                          isPositive: true,
                        },
                      ]);
                    }
                    // Hero Grave Keeper bước 2: sau khi chọn player bị loại, spin chọn Gear của player đó
                    if (
                      spinKey.startsWith("after-HeroGraveKeeper-")
                    ) {
                      const chosenItem = entry.wheelItems?.find(
                        (it) => it.label === result.label,
                      );
                      const gearList =
                        (chosenItem?.meta?.gearList as string[]) || [];
                      const chosenName =
                        (chosenItem?.meta?.playerName as string) ||
                        result.label;
                      if (gearList.length === 0) {
                        spawnStatBubbles([
                          {
                            player: entry.player,
                            text: `Hero Grave Keeper: ${chosenName} không có Gear nào.`,
                            isPositive: false,
                          },
                        ]);
                      } else {
                        const gearColors = [
                          "#f59e0b",
                          "#10b981",
                          "#3b82f6",
                          "#a855f7",
                          "#ef4444",
                          "#06b6d4",
                          "#84cc16",
                          "#ec4899",
                        ];
                        setTimeout(() => {
                          setPreCombatModal({
                            isOpen: true,
                            title: `Hero Grave Keeper — Chọn Gear từ ${chosenName}`,
                            description: `Quay chọn 1 Gear từ kho của ${chosenName}`,
                            items: gearList.map(
                              (g: string, i: number) => ({
                                label: g,
                                weight: 1,
                                isSuccess: true,
                                color:
                                  gearColors[i % gearColors.length],
                              }),
                            ),
                            side: entry.player,
                            effectKey: `hgk-gear-${spinKey}`,
                            onResult: (gearResult) => {
                              spawnStatBubbles([
                                {
                                  player: entry.player,
                                  text: `Hero Grave Keeper: Nhận Gear "${gearResult.label}" từ ${chosenName} [GM apply]`,
                                  isPositive: true,
                                },
                              ]);
                            },
                          });
                        }, 100);
                      }
                    }
                    // Follower of the Two Fingers bước 2: sau khi chọn player còn sống, spin chọn Power
                    if (
                      spinKey.startsWith("after-FollowerTwoFingers-")
                    ) {
                      const chosenItem = entry.wheelItems?.find(
                        (it) => it.label === result.label,
                      );
                      const powers =
                        (chosenItem?.meta?.powers as string[]) || [];
                      const chosenName =
                        (chosenItem?.meta?.playerName as string) ||
                        result.label;
                      if (powers.length === 0) {
                        spawnStatBubbles([
                          {
                            player: entry.player,
                            text: `Follower of the Two Fingers: -1 IQ, -1 BIQ — ${chosenName} không có Power nào để cướp. [GM apply]`,
                            isPositive: false,
                          },
                        ]);
                      } else {
                        const powerColors = [
                          "#f59e0b",
                          "#10b981",
                          "#3b82f6",
                          "#a855f7",
                          "#ef4444",
                          "#06b6d4",
                          "#84cc16",
                          "#ec4899",
                        ];
                        setTimeout(() => {
                          setPreCombatModal({
                            isOpen: true,
                            title: `Follower of the Two Fingers — Cướp Power từ ${chosenName}`,
                            description: `Quay chọn 1 Power để cướp từ ${chosenName}`,
                            items: powers.map(
                              (pw: string, i: number) => ({
                                label: pw,
                                weight: 1,
                                isSuccess: true,
                                color:
                                  powerColors[i % powerColors.length],
                              }),
                            ),
                            side: entry.player,
                            effectKey: `fotf-power-${spinKey}`,
                            onResult: (powerResult) => {
                              spawnStatBubbles([
                                {
                                  player: entry.player,
                                  text: `Follower of the Two Fingers: -1 IQ, -1 BIQ — Cướp Power "${powerResult.label}" từ ${chosenName} [GM apply]`,
                                  isPositive: true,
                                },
                              ]);
                            },
                          });
                        }, 100);
                      }
                    }

                    // Coven Council bước 2: sau khi chọn player, spin stat theo race
                    if (spinKey.startsWith("after-CovenCouncil-")) {
                      const chosenItem = entry.wheelItems?.find(
                        (it) => it.label === result.label,
                      );
                      const raceName = (
                        (chosenItem?.meta?.race as string) || "human"
                      ).toLowerCase();
                      const chosenName =
                        (chosenItem?.meta?.playerName as string) ||
                        result.label;
                      const ALL_STATS: (keyof CharacterStats)[] = [
                        "str",
                        "spd",
                        "dur",
                        "iq",
                        "biq",
                        "ma",
                      ];
                      const statItems = ALL_STATS.map((s) => ({
                        label: s.toUpperCase(),
                        weight: 1,
                        isSuccess: true,
                        color: STAT_COLORS[s],
                        meta: { stat: s, raceName, chosenName },
                      }));
                      setTimeout(() => {
                        setPreCombatModal({
                          isOpen: true,
                          title: `Coven Council — Chọn stat Re-Spin cho ${chosenName}`,
                          description: `Quay chọn 1 chỉ số của ${chosenName} để Re-Spin (theo race ${raceName})`,
                          items: statItems,
                          side: entry.player,
                          effectKey: `coven-stat-${spinKey}`,
                          onResult: (statResult) => {
                            const stat2 = statResult.meta
                              ?.stat as keyof CharacterStats;
                            const rName =
                              (statResult.meta?.raceName as string) ||
                              "human";
                            const pName =
                              (statResult.meta?.chosenName as string) ||
                              "?";
                            const weights =
                              RACE_STAT_WEIGHTS[rName]?.[stat2] ||
                              Array(10).fill(10);
                            setTimeout(() => {
                              setPreCombatModal({
                                isOpen: true,
                                title: `Coven Council — Re-Spin ${stat2.toUpperCase()} cho ${pName}`,
                                description: `${pName} — Re-Spin ${stat2.toUpperCase()} theo race ${rName}`,
                                items: weights.map(
                                  (w: number, i: number) => ({
                                    label: `${i + 1}`,
                                    weight: w,
                                    isSuccess: true,
                                    color: STAT_COLORS[stat2],
                                  }),
                                ),
                                side: entry.player,
                                effectKey: `coven-respin-${spinKey}-${stat2}`,
                                onResult: (spinResult) => {
                                  const newVal = parseInt(
                                    spinResult.label,
                                    10,
                                  );
                                  spawnStatBubbles([
                                    {
                                      player: entry.player,
                                      text: `Coven Council: ${pName} Re-Spin ${stat2.toUpperCase()} = ${newVal} [GM apply]`,
                                      isPositive: true,
                                    },
                                  ]);
                                },
                              });
                            }, 100);
                          },
                        });
                      }, 100);
                    }
                    // Independent: stat ngẫu nhiên được chọn → +2 stat đó
                    if (
                      spinKey.startsWith("after-Independent-stat-")
                    ) {
                      const statMapIndep: Record<
                        string,
                        keyof CharacterStats
                      > = {
                        STR: "str",
                        SPD: "spd",
                        DUR: "dur",
                        IQ: "iq",
                        BIQ: "biq",
                        MA: "ma",
                      };
                      const skIndep = statMapIndep[result.label];
                      if (skIndep) {
                        spawnStatBubbles([
                          {
                            player: entry.player,
                            text: `Independent: +2 ${result.label}`,
                            isPositive: true,
                          },
                        ]);
                      }
                    }
                    // Naga: power nhận được → notify GM apply
                    if (spinKey.startsWith("after-Naga-power-")) {
                      spawnStatBubbles([
                        {
                          player: entry.player,
                          text: `Naga: Nhận Power "${result.label}" [GM apply]`,
                          isPositive: true,
                        },
                      ]);
                    }
                    // Naga: char dev → notify
                    if (spinKey.startsWith("after-Naga-chardev-")) {
                      spawnStatBubbles([
                        {
                          player: entry.player,
                          text: `Naga: Nhận 1 Char Dev [GM apply]`,
                          isPositive: true,
                        },
                      ]);
                    }
                    // Creator's Cat: mở Creator's Favor modal
                    if (
                      spinKey.startsWith("after-CreatorsCat-") &&
                      result.isSuccess
                    ) {
                      setTimeout(() => {
                        setCreatorsCatModal({
                          isOpen: true,
                          playerLabel: entry.player,
                          step: "choose_effect",
                          selectedEffect: "",
                          chosenStats: [],
                          chosenArchetypesToRemove: [],
                          rollQueue: [],
                          rollAccumulated: [],
                          rollRaceName: "",
                          rollTotal: 0,
                        });
                      }, 100);
                    }
                  },
                });
              }}
              className={`shrink-0 font-bold rounded-lg border transition-colors ${
                big
                  ? "px-5 py-2 text-sm bg-yellow-600/80 hover:bg-yellow-500/90 text-white border-yellow-400/60"
                  : "px-2 py-1 text-[10px] bg-purple-700/60 hover:bg-purple-600/70 text-purple-100 border-purple-500/40"
              }`}
            >
              Quay
            </button>
            <button
              onClick={() => {
                setAfterCombatSpinResults((prev) => ({
                  ...prev,
                  [spinKey]: {
                    label: "Bỏ qua",
                    isSuccess: false,
                  },
                }));
              }}
              className={`shrink-0 font-medium rounded-lg border transition-colors ${
                big
                  ? "px-3 py-2 text-sm bg-gray-700/60 hover:bg-gray-600/70 text-gray-300 border-gray-500/40"
                  : "px-2 py-1 text-[10px] bg-gray-800/60 hover:bg-gray-700/70 text-gray-400 border-gray-600/40"
              }`}
            >
              Bỏ qua
            </button>
          </div>
        )}
        {!spinKey && !entry.wheelKey && entry.gmAction && (
          <span
            className={`shrink-0 text-amber-400 ${big ? "text-sm font-bold" : "text-[10px] font-semibold"}`}
          >
            GM
          </span>
        )}
        {!spinKey &&
          !entry.wheelKey &&
          !entry.gmAction &&
          big && (
            <span className="shrink-0 text-xs font-bold px-2 py-1 rounded bg-green-700/40 border border-green-500/30 text-green-300">
              Auto
            </span>
          )}
      </div>
    );
  };

  return (
    <div className="mt-3 space-y-3">
      {/* PvP Reward — to, nổi bật */}
      {pvpRewardEntries.length > 0 && (
        <div className="bg-yellow-900/20 rounded-xl border border-yellow-500/40 p-3 space-y-2">
          <div className="text-sm font-bold text-yellow-300 tracking-wide mb-1">
            PvP Reward
          </div>
          {pvpRewardEntries.map((entry, idx) =>
            renderEntry(entry, idx, true),
          )}
        </div>
      )}
      {/* Hiệu ứng khác — nhỏ hơn */}
      {otherEntries.length > 0 && (
        <div className="bg-gray-800/60 rounded-xl border border-purple-600/30 p-3 space-y-2">
          <div className="text-xs font-semibold text-purple-300 mb-1">
            Hiệu ứng sau combat
          </div>
          {otherEntries.map((entry, idx) =>
            renderEntry(entry, idx, false),
          )}
        </div>
      )}
    </div>
  );
}
