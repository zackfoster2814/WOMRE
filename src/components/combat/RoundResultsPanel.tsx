import { useState } from "react";
import { Character, CharacterStats } from "../../types/character";
import { PvPPlayerData, RoundResult } from "../../types/battleZone";
import { WheelSpinItem } from "../../components/ProbabilityWheelModal";
import { STAT_ORDER } from "../../constants/battleZone";
import {
  CRIT_ITEMS,
  EVASION_ITEMS,
  CRUELTY_ITEMS,
  BLIND_ITEMS,
  MUTE_ITEMS,
  BASH_ITEMS,
  RANGER_RED_ITEMS,
  RANGER_BLUE_ITEMS,
  RANGER_BLACK_ITEMS,
  RANGER_YELLOW_ITEMS,
  RANGER_PINK_ITEMS,
  RANGER_SILVER_ITEMS,
  SAND_OF_TIME_ITEMS,
  MISERICORDE_ITEMS,
  GAMBLER_ITEMS,
} from "../../constants/wheelConfigs";

const GOLDEN_PARRY_ITEMS: WheelSpinItem[] = [
  { label: "Parry!", weight: 35, isSuccess: true, color: "#f59e0b" },
  { label: "Không", weight: 65, isSuccess: false, color: "#6b7280" },
];
const PENNYWORTHY_WIN_ITEMS: WheelSpinItem[] = [
  {
    label: "+1 điểm bonus (36%)",
    weight: 36,
    isSuccess: true,
    color: "#a3e635",
  },
  {
    label: "Không kích hoạt (64%)",
    weight: 64,
    isSuccess: false,
    color: "#6b7280",
  },
];
const PENNYWORTHY_LOSE_ITEMS: WheelSpinItem[] = [
  {
    label: "+2 vào chỉ số thua (36%)",
    weight: 36,
    isSuccess: true,
    color: "#34d399",
  },
  {
    label: "Không kích hoạt (64%)",
    weight: 64,
    isSuccess: false,
    color: "#6b7280",
  },
];

export interface DebugRoundPatch {
  roundArrayIndex: number;
  statKey: keyof CharacterStats;
  p1Value?: number;
  p2Value?: number;
  p1StatDelta?: number; // thay đổi p1Stats[statKey] trước khi tính
  p2StatDelta?: number;
}

interface RoundResultsPanelProps {
  rounds: RoundResult[];
  revealedUpTo: number | null;
  p1char?: Character;
  p2char?: Character;
  extraBiqRound?: boolean;
  player1: PvPPlayerData | null;
  player2: PvPPlayerData | null;
  disabledItems: Set<string>;
  roundSpinResults: Record<string, { label: string; isSuccess: boolean }>;
  getPerRoundEffects: (
    char: Character | undefined,
    playerNo?: number,
    disabledItems?: Set<string>,
  ) => { onWin: string[]; onLose: string[]; onTie: string[]; gamblerStackCount: number };
  computeRoundPoints: (
    side: "player1" | "player2",
    winner: "player1" | "player2" | "tie",
    roundIdx: number,
    effects: { onWin: string[]; onLose: string[]; onTie: string[] },
    statKey?: string,
    roundsWonBefore?: number,
  ) => {
    pts: number;
    pending: boolean;
    color: string;
    autoApplied?: boolean;
    engineBase?: number;
  };
  applyDevWeights: (
    effectName: string,
    items: WheelSpinItem[],
  ) => WheelSpinItem[];
  setRoundSpinModal: (v: {
    isOpen: boolean;
    title: string;
    items: WheelSpinItem[];
    roundIndex: number;
    side: "player1" | "player2";
  }) => void;
  /** Debug: callback khi user patch 1 round */
  onDebugRound?: (patch: DebugRoundPatch) => void;
}

export function RoundResultsPanel({
  rounds,
  revealedUpTo,
  p1char,
  p2char,
  extraBiqRound,
  player1,
  player2,
  disabledItems,
  roundSpinResults,
  getPerRoundEffects,
  computeRoundPoints,
  applyDevWeights,
  setRoundSpinModal,
  onDebugRound,
}: RoundResultsPanelProps) {
  const [openDebugRow, setOpenDebugRow] = useState<number | null>(null);
  const [debugDraft, setDebugDraft] = useState<{
    p1Val: string;
    p2Val: string;
    p1StatDelta: string;
    p2StatDelta: string;
  }>({ p1Val: "", p2Val: "", p1StatDelta: "", p2StatDelta: "" });
  const [debugDirty, setDebugDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState<number | null>(
    null,
  ); // target row để mở sau khi confirm
  const openDebug = (rowIdx: number, round: RoundResult | undefined) => {
    if (debugDirty && openDebugRow !== null && openDebugRow !== rowIdx) {
      setShowUnsavedDialog(rowIdx);
      return;
    }
    setOpenDebugRow(openDebugRow === rowIdx ? null : rowIdx);
    setDebugDraft({
      p1Val: round?.player1Value?.toString() ?? "",
      p2Val: round?.player2Value?.toString() ?? "",
      p1StatDelta: "0",
      p2StatDelta: "0",
    });
    setDebugDirty(false);
  };

  const p1Effects = getPerRoundEffects(p1char, player1?.no);
  const p2Effects = getPerRoundEffects(p2char, player2?.no);
  const showSpins = !!p1char || !!p2char;

  const makeSpinButton = (
    effectName: string,
    side: "player1" | "player2",
    roundIdx: number,
  ) => {
    const key2 = `${roundIdx}-${effectName}-${side}`;
    const result = roundSpinResults[key2];
    const baseItems =
      effectName === "Critical Strike"
        ? CRIT_ITEMS
        : effectName === "Evasion"
          ? EVASION_ITEMS
          : effectName === "Cruelty"
            ? CRUELTY_ITEMS
            : effectName === "Blind"
              ? BLIND_ITEMS
              : effectName === "Mute"
                ? MUTE_ITEMS
                : effectName === "Bash" || effectName === "Luminescence"
                  ? BASH_ITEMS
                  : effectName === "Ranger-Red"
                    ? RANGER_RED_ITEMS
                    : effectName === "Ranger-Blue"
                      ? RANGER_BLUE_ITEMS
                      : effectName === "Ranger-Black"
                        ? RANGER_BLACK_ITEMS
                        : effectName === "Ranger-Yellow"
                          ? RANGER_YELLOW_ITEMS
                          : effectName === "Ranger-Pink"
                            ? RANGER_PINK_ITEMS
                            : effectName === "Ranger-Silver"
                              ? RANGER_SILVER_ITEMS
                              : effectName === "Golden Parry"
                                ? GOLDEN_PARRY_ITEMS
                                : effectName === "Pennyworthy-Win"
                                  ? PENNYWORTHY_WIN_ITEMS
                                  : effectName === "Pennyworthy-Lose"
                                    ? PENNYWORTHY_LOSE_ITEMS
                                    : effectName === "Misericorde"
                                      ? MISERICORDE_ITEMS
                                      : effectName === "The Sand of Time" ||
                                          effectName === "The Sand of Time-2"
                                        ? SAND_OF_TIME_ITEMS
                                        : GAMBLER_ITEMS;
    const items = applyDevWeights(effectName, baseItems);

    const label =
      effectName === "Critical Strike"
        ? "Crit"
        : effectName === "Evasion"
          ? "Evade"
          : effectName === "Cruelty"
            ? "Cruelty"
            : effectName === "Blind"
              ? "Blind"
              : effectName === "Mute"
                ? "Mute"
                : effectName === "Bash" || effectName === "Luminescence"
                  ? effectName
                  : effectName === "Golden Parry"
                    ? "Parry"
                    : effectName === "Misericorde"
                      ? "Miseri"
                      : effectName === "Pennyworthy-Win"
                        ? "PW+"
                        : effectName === "Pennyworthy-Lose"
                          ? "PW-"
                          : effectName === "The Sand of Time"
                            ? "Sand"
                            : effectName === "The Sand of Time-2"
                              ? "Sand×2"
                              : effectName.startsWith("Ranger-")
                                ? effectName.replace("Ranger-", "") + "🦸"
                                : "Gambler";

    const titleText = `${effectName === "The Sand of Time-2" ? "The Sand of Time (Spell Flux lần 2)" : effectName}`;

    if (result) {
      return (
        <button
          key={effectName}
          onClick={() =>
            setRoundSpinModal({
              isOpen: true,
              title: effectName,
              items,
              roundIndex: roundIdx,
              side,
            })
          }
          className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-bold border transition-colors ${
            result.isSuccess
              ? "bg-amber-600/30 text-amber-300 border-amber-500/40 hover:bg-amber-600/50"
              : "bg-gray-700/60 text-gray-400 border-gray-600/40 hover:bg-gray-700/80"
          }`}
          title={`${titleText}: ${result.label} — click để quay lại`}
        >
          {result.isSuccess ? "✦" : "·"} {label}
        </button>
      );
    }
    return (
      <button
        key={effectName}
        onClick={() =>
          setRoundSpinModal({
            isOpen: true,
            title: effectName,
            items,
            roundIndex: roundIdx,
            side,
          })
        }
        className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-purple-700/50 hover:bg-purple-600/60 text-purple-200 font-bold transition-colors border border-purple-600/30"
        title={`Quay ${titleText}`}
      >
        🎡 {label}
      </button>
    );
  };

  // Build display rows — insert BIQ×2 row after BIQ if rounds has extra entry or flag set
  const hasZoltraakExtra = rounds.length > STAT_ORDER.length || !!extraBiqRound;
  const displayRows: {
    key: keyof CharacterStats;
    label: string;
    statOrderIndex: number;
    roundArrayIndex: number;
  }[] = [];
  let roundArrayCursor = 0;
  for (let si = 0; si < STAT_ORDER.length; si++) {
    displayRows.push({
      key: STAT_ORDER[si].key,
      label: STAT_ORDER[si].label,
      statOrderIndex: si,
      roundArrayIndex: roundArrayCursor,
    });
    roundArrayCursor++;
    // If this is BIQ (index 4) and there's an extra round (Zoltraak BIQ×2)
    if (si === 4 && hasZoltraakExtra) {
      displayRows.push({
        key: STAT_ORDER[si].key,
        label: "BIQ×2",
        statOrderIndex: si,
        roundArrayIndex: roundArrayCursor,
      });
      roundArrayCursor++;
    }
  }
  // Convert revealedUpTo (stat order index) to roundArrayIndex
  // Chỉ cộng +1 khi BIQ×2 đã có data thực sự (rounds.length > STAT_ORDER.length)
  const biq2HasData = rounds.length > STAT_ORDER.length;
  const revealedUpToArr =
    revealedUpTo !== null
      ? hasZoltraakExtra && biq2HasData && revealedUpTo >= 4
        ? revealedUpTo + 1
        : revealedUpTo
      : null;

  return (
    <div className="space-y-1 relative">
      {/* Unsaved changes dialog */}
      {showUnsavedDialog !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-yellow-600/50 rounded-xl p-5 max-w-xs w-full shadow-2xl">
            <div className="text-yellow-400 font-bold mb-2">Chưa lưu</div>
            <div className="text-gray-300 text-sm mb-4">
              Round này có thay đổi chưa lưu. Bạn có muốn lưu trước không?
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowUnsavedDialog(null);
                  setOpenDebugRow(null);
                  setDebugDirty(false);
                }}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm"
              >
                Bỏ qua
              </button>
              <button
                onClick={() => {
                  const target = showUnsavedDialog;
                  setShowUnsavedDialog(null);
                  setOpenDebugRow(null);
                  setDebugDirty(false);
                  // Mở row mới
                  const targetRound = rounds[target];
                  setTimeout(() => {
                    setOpenDebugRow(target);
                    setDebugDraft({
                      p1Val: targetRound?.player1Value?.toString() ?? "",
                      p2Val: targetRound?.player2Value?.toString() ?? "",
                      p1StatDelta: "0",
                      p2StatDelta: "0",
                    });
                  }, 0);
                }}
                className="px-3 py-1.5 bg-yellow-700/60 hover:bg-yellow-600/60 text-yellow-200 rounded text-sm border border-yellow-600/40"
              >
                Không lưu, chuyển sang
              </button>
            </div>
          </div>
        </div>
      )}
      {displayRows.map(({ key, label, roundArrayIndex }) => {
        const round = rounds[roundArrayIndex];
        const revealed =
          revealedUpToArr !== null ? roundArrayIndex <= revealedUpToArr : true;
        const p1Win = revealed && round?.winner === "player1";
        const p2Win = revealed && round?.winner === "player2";
        const tie = revealed && round?.winner === "tie";

        const isBiq2Row = label === "BIQ×2";
        const RANGER_ROUND_STAT: Record<string, string | string[]> = {
          "Ranger-Red": "str",
          "Ranger-Blue": "spd",
          "Ranger-Black": "dur",
          "Ranger-Yellow": "iq",
          "Ranger-Pink": ["biq", "ma"],
        };
        const isLastDisplayRow =
          roundArrayIndex ===
          displayRows[displayRows.length - 1].roundArrayIndex;
        const isSandFirstLoss = (loserSide: "player1" | "player2") => {
          for (let ri = 0; ri < roundArrayIndex; ri++) {
            const r = rounds[ri];
            if (r && r.winner !== "tie" && r.winner !== loserSide) return false;
          }
          return true;
        };
        const filterLastRound = (
          effs: string[],
          loserSide?: "player1" | "player2",
        ) =>
          effs.filter((e) => {
            if (
              e === "Bloodthirsty" ||
              e === "Divine Smite" ||
              e === "Yamato Blade-SPD" ||
              e === "Yamato Blade-MA" ||
              e === "Cautious-Self" ||
              e === "Hunter's Mark"
            )
              return false;
            if ((e === "Bash" || e === "Luminescence") && isLastDisplayRow)
              return false;
            if (e === "Ranger-Silver" && isLastDisplayRow) return false;
            if (e in RANGER_ROUND_STAT) {
              const required = RANGER_ROUND_STAT[e];
              if (Array.isArray(required)) return required.includes(key);
              return required === key;
            }
            if (e === "The Sand of Time") {
              if (isBiq2Row) return false;
              if (!loserSide) return false;
              return isSandFirstLoss(loserSide);
            }
            return true;
          });
        const p1SpinEffectsBase = filterLastRound(
          p1Win
            ? p1Effects.onWin
            : tie
              ? p1Effects.onTie
              : revealed
                ? p1Effects.onLose
                : [],
          p2Win ? "player1" : undefined,
        );
        const p2SpinEffectsBase = filterLastRound(
          p2Win
            ? p2Effects.onWin
            : tie
              ? p2Effects.onTie
              : revealed
                ? p2Effects.onLose
                : [],
          p1Win ? "player2" : undefined,
        );
        const addSandFlux = (
          effs: string[],
          loserSide: "player1" | "player2",
        ) => {
          if (!effs.includes("The Sand of Time")) return effs;
          const loserChar =
            loserSide === "player1" ? player1?.character : player2?.character;
          const loserNo = loserSide === "player1" ? player1?.no : player2?.no;
          const hasFlux =
            (loserChar?.powers || []).some(
              (p: any) =>
                !p?.isLost &&
                (typeof p === "string" ? p : p.name)
                  ?.toLowerCase()
                  .startsWith("spell flux"),
            ) && !disabledItems.has(`${loserNo}-power-Spell Flux`);
          if (!hasFlux) return effs;
          return [...effs, "The Sand of Time-2"];
        };
        const p1SpinEffects = p2Win
          ? addSandFlux(p1SpinEffectsBase, "player1")
          : p1SpinEffectsBase;
        const p2SpinEffects = p1Win
          ? addSandFlux(p2SpinEffectsBase, "player2")
          : p2SpinEffectsBase;

        const p1WonBeforeThis = rounds
          .slice(0, roundArrayIndex)
          .filter((r) => r.winner === "player1").length;
        const p2WonBeforeThis = rounds
          .slice(0, roundArrayIndex)
          .filter((r) => r.winner === "player2").length;
        const p1Pts =
          revealed && round && showSpins
            ? computeRoundPoints(
                "player1",
                round.winner,
                roundArrayIndex,
                p1Effects,
                key,
                p1WonBeforeThis,
              )
            : null;
        const p2Pts =
          revealed && round && showSpins
            ? computeRoundPoints(
                "player2",
                round.winner,
                roundArrayIndex,
                p2Effects,
                key,
                p2WonBeforeThis,
              )
            : null;

        const showP1Pts =
          revealed && round && p1Pts && (p1Pts.pts > 0 || p1Pts.pending);
        const showP2Pts =
          revealed && round && p2Pts && (p2Pts.pts > 0 || p2Pts.pending);

        const rowBg = !revealed
          ? "bg-gray-900/30 border-gray-800/40"
          : p1Win
            ? "bg-blue-950/40 border-blue-700/30"
            : p2Win
              ? "bg-red-950/40 border-red-700/30"
              : tie
                ? "bg-yellow-950/30 border-yellow-700/20"
                : "bg-gray-900/30 border-gray-700/20";

        return (
          <div
            key={`${key}-${roundArrayIndex}`}
            className={`rounded-lg border transition-all duration-500 overflow-hidden ${
              revealed ? "opacity-100" : "opacity-20"
            } ${rowBg}`}
          >
            <div className="grid grid-cols-[1fr_56px_1fr] gap-1 items-center px-2 py-1.5">
              {/* P1 value + pts */}
              <div className="flex items-center justify-end gap-1.5">
                {showP1Pts && p1Pts && (
                  <span className={`text-[10px] font-black ${p1Pts.color}`}>
                    {p1Pts.pending ? `+${p1Pts.pts}?` : `+${p1Pts.pts}`}
                  </span>
                )}
                <span
                  className={`text-sm font-black tabular-nums ${
                    p1Win
                      ? "text-blue-300"
                      : tie
                        ? "text-yellow-400"
                        : revealed
                          ? "text-gray-500"
                          : "text-gray-700"
                  }`}
                >
                  {revealed ? (round?.player1Value ?? "?") : "?"}
                </span>
                {p1Win && (
                  <span className="text-blue-400 text-[10px] font-black">
                    ▶
                  </span>
                )}
              </div>

              {/* Stat label + round indicator */}
              <div className="text-center">
                <div
                  className={`text-[10px] font-black tracking-wider ${
                    p1Win
                      ? "text-blue-400/70"
                      : p2Win
                        ? "text-red-400/70"
                        : tie
                          ? "text-yellow-400/70"
                          : "text-gray-600"
                  }`}
                >
                  {label}
                </div>
                <div className="text-[8px] text-gray-700 font-mono">
                  R{roundArrayIndex + 1}
                </div>
              </div>

              {/* P2 value + pts */}
              <div className="flex items-center justify-start gap-1.5">
                {p2Win && (
                  <span className="text-red-400 text-[10px] font-black">◀</span>
                )}
                <span
                  className={`text-sm font-black tabular-nums ${
                    p2Win
                      ? "text-red-300"
                      : tie
                        ? "text-yellow-400"
                        : revealed
                          ? "text-gray-500"
                          : "text-gray-700"
                  }`}
                >
                  {revealed ? (round?.player2Value ?? "?") : "?"}
                </span>
                {showP2Pts && p2Pts && (
                  <span className={`text-[10px] font-black ${p2Pts.color}`}>
                    {p2Pts.pending ? `+${p2Pts.pts}?` : `+${p2Pts.pts}`}
                  </span>
                )}
              </div>
            </div>

            {/* Per-round spin buttons */}
            {showSpins &&
              revealed &&
              (p1SpinEffects.length > 0 || p2SpinEffects.length > 0) && (
                <div className="grid grid-cols-[1fr_56px_1fr] gap-1 px-2 pb-1.5 border-t border-gray-700/20 pt-1">
                  <div className="flex justify-end gap-1 flex-wrap">
                    {p1SpinEffects.map((eff) =>
                      makeSpinButton(eff, "player1", roundArrayIndex),
                    )}
                  </div>
                  <div />
                  <div className="flex justify-start gap-1 flex-wrap">
                    {p2SpinEffects.map((eff) =>
                      makeSpinButton(eff, "player2", roundArrayIndex),
                    )}
                  </div>
                </div>
              )}

            {/* Debug gear icon */}
            {onDebugRound && (
              <div className="flex justify-center pb-0.5">
                <button
                  onClick={() => openDebug(roundArrayIndex, round)}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    openDebugRow === roundArrayIndex
                      ? "bg-yellow-600/40 text-yellow-300 border border-yellow-500/50"
                      : "bg-gray-800/60 text-gray-600 hover:text-gray-400 border border-gray-700/30"
                  }`}
                  title="Debug round này"
                >
                  ⚙
                </button>
              </div>
            )}

            {/* Debug panel inline */}
            {onDebugRound && openDebugRow === roundArrayIndex && (
              <div className="border-t border-yellow-700/30 bg-yellow-950/20 px-2 py-2 text-xs space-y-2">
                <div className="text-yellow-400 font-bold text-[10px] uppercase tracking-wider">
                  Debug — R{roundArrayIndex + 1} ({label})
                </div>
                {/* Điểm round */}
                <div>
                  <div className="text-gray-400 text-[10px] mb-1">chỉ số</div>
                  <div className="flex gap-2 items-center">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-blue-400 text-[10px]">
                        {player1?.name ?? "P1"}
                      </span>
                      <input
                        type="number"
                        value={debugDraft.p1Val}
                        onChange={(e) => {
                          setDebugDraft((d) => ({
                            ...d,
                            p1Val: e.target.value,
                          }));
                          setDebugDirty(true);
                        }}
                        className="w-16 px-1.5 py-0.5 bg-gray-900 border border-blue-700/50 rounded text-blue-200 text-xs text-center"
                      />
                    </div>
                    <span className="text-gray-600 mt-3">vs</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-red-400 text-[10px]">
                        {player2?.name ?? "P2"}
                      </span>
                      <input
                        type="number"
                        value={debugDraft.p2Val}
                        onChange={(e) => {
                          setDebugDraft((d) => ({
                            ...d,
                            p2Val: e.target.value,
                          }));
                          setDebugDirty(true);
                        }}
                        className="w-16 px-1.5 py-0.5 bg-gray-900 border border-red-700/50 rounded text-red-200 text-xs text-center"
                      />
                    </div>
                  </div>
                </div>
                {/* Điều chỉnh chỉ số stat */}
                <div>
                  <div className="text-gray-400 text-[10px] mb-1">
                    Điểm {label} (±)
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-blue-400 text-[10px]">
                        {player1?.name ?? "P1"}
                      </span>
                      <input
                        type="number"
                        value={debugDraft.p1StatDelta}
                        onChange={(e) => {
                          setDebugDraft((d) => ({
                            ...d,
                            p1StatDelta: e.target.value,
                          }));
                          setDebugDirty(true);
                        }}
                        className="w-16 px-1.5 py-0.5 bg-gray-900 border border-blue-700/50 rounded text-blue-200 text-xs text-center"
                      />
                    </div>
                    <span className="text-gray-600 mt-3">vs</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-red-400 text-[10px]">
                        {player2?.name ?? "P2"}
                      </span>
                      <input
                        type="number"
                        value={debugDraft.p2StatDelta}
                        onChange={(e) => {
                          setDebugDraft((d) => ({
                            ...d,
                            p2StatDelta: e.target.value,
                          }));
                          setDebugDirty(true);
                        }}
                        className="w-16 px-1.5 py-0.5 bg-gray-900 border border-red-700/50 rounded text-red-200 text-xs text-center"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      const p1v = parseFloat(debugDraft.p1Val);
                      const p2v = parseFloat(debugDraft.p2Val);
                      const p1d = parseFloat(debugDraft.p1StatDelta);
                      const p2d = parseFloat(debugDraft.p2StatDelta);
                      onDebugRound({
                        roundArrayIndex,
                        statKey: key,
                        p1Value: isNaN(p1v) ? undefined : p1v,
                        p2Value: isNaN(p2v) ? undefined : p2v,
                        p1StatDelta: isNaN(p1d) || p1d === 0 ? undefined : p1d,
                        p2StatDelta: isNaN(p2d) || p2d === 0 ? undefined : p2d,
                      });
                      setDebugDirty(false);
                      setOpenDebugRow(null);
                    }}
                    className="px-3 py-1 bg-green-700/60 hover:bg-green-600/60 text-green-200 rounded text-[10px] font-bold border border-green-600/40"
                  >
                    Luu
                  </button>
                  <button
                    onClick={() => {
                      setOpenDebugRow(null);
                      setDebugDirty(false);
                    }}
                    className="px-3 py-1 bg-gray-700/60 hover:bg-gray-600/60 text-gray-300 rounded text-[10px] border border-gray-600/40"
                  >
                    Huy
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
