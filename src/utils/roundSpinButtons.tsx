/**
 * roundSpinButtons.tsx
 *
 * Shared utilities để render spin buttons cho từng round effect.
 * Dùng trong RoundResultsPanel và BattleWheelSpinner.
 */

import { WheelSpinItem } from "../components/ProbabilityWheelModal";
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
} from "../constants/wheelConfigs";

export const GOLDEN_PARRY_ITEMS: WheelSpinItem[] = [
  { label: "Parry!", weight: 35, isSuccess: true, color: "#f59e0b" },
  { label: "Không", weight: 65, isSuccess: false, color: "#6b7280" },
];
export const PENNYWORTHY_WIN_ITEMS: WheelSpinItem[] = [
  { label: "+1 điểm bonus (36%)", weight: 36, isSuccess: true, color: "#a3e635" },
  { label: "Không kích hoạt (64%)", weight: 64, isSuccess: false, color: "#6b7280" },
];
export const PENNYWORTHY_LOSE_ITEMS: WheelSpinItem[] = [
  { label: "+2 vào chỉ số thua (36%)", weight: 36, isSuccess: true, color: "#34d399" },
  { label: "Không kích hoạt (64%)", weight: 64, isSuccess: false, color: "#6b7280" },
];

export const RANGER_ROUND_STAT: Record<string, string | string[]> = {
  "Ranger-Red": "str",
  "Ranger-Blue": "spd",
  "Ranger-Black": "dur",
  "Ranger-Yellow": "iq",
  "Ranger-Pink": ["biq", "ma"],
};

export function getSpinItems(effectName: string, gamblerStackCount = 0): WheelSpinItem[] {
  switch (effectName) {
    case "Critical Strike":    return CRIT_ITEMS;
    case "Evasion":            return EVASION_ITEMS;
    case "Cruelty":            return CRUELTY_ITEMS;
    case "Blind":              return BLIND_ITEMS;
    case "Mute":               return MUTE_ITEMS;
    case "Bash":
    case "Luminescence":       return BASH_ITEMS;
    case "Ranger-Red":         return RANGER_RED_ITEMS;
    case "Ranger-Blue":        return RANGER_BLUE_ITEMS;
    case "Ranger-Black":       return RANGER_BLACK_ITEMS;
    case "Ranger-Yellow":      return RANGER_YELLOW_ITEMS;
    case "Ranger-Pink":        return RANGER_PINK_ITEMS;
    case "Ranger-Silver":      return RANGER_SILVER_ITEMS;
    case "Golden Parry":       return GOLDEN_PARRY_ITEMS;
    case "Misericorde":        return MISERICORDE_ITEMS;
    case "Pennyworthy-Win":    return PENNYWORTHY_WIN_ITEMS;
    case "Pennyworthy-Lose":   return PENNYWORTHY_LOSE_ITEMS;
    case "The Sand of Time":
    case "The Sand of Time-2": return SAND_OF_TIME_ITEMS;
    case "Gambler": {
      if (gamblerStackCount > 0) {
        const winW = Math.min(50 + gamblerStackCount * 4, 95);
        const loseW = 100 - winW;
        return [
          { label: `+2 điểm (${winW}%)`, weight: winW, isSuccess: true, color: "#f59e0b" },
          { label: `+0 điểm (${loseW}%)`, weight: loseW, isSuccess: false, color: "#ef4444" },
        ];
      }
      return GAMBLER_ITEMS;
    }
    default:                   return GAMBLER_ITEMS;
  }
}

export function getSpinLabel(effectName: string): string {
  switch (effectName) {
    case "Critical Strike":    return "Crit";
    case "Evasion":            return "Evade";
    case "Cruelty":            return "Cruelty";
    case "Blind":              return "Blind";
    case "Mute":               return "Mute";
    case "Golden Parry":       return "Parry";
    case "Misericorde":        return "Miseri";
    case "Pennyworthy-Win":    return "PW+";
    case "Pennyworthy-Lose":   return "PW-";
    case "The Sand of Time":   return "Sand";
    case "The Sand of Time-2": return "Sand×2";
    default:
      if (effectName.startsWith("Ranger-"))
        return effectName.replace("Ranger-", "") + "🦸";
      return effectName; // Bash, Luminescence, etc.
  }
}

export interface SpinButtonProps {
  effectName: string;
  side: "player1" | "player2";
  roundIdx: number;
  roundSpinResults: Record<string, { label: string; isSuccess: boolean }>;
  applyDevWeights: (name: string, items: WheelSpinItem[]) => WheelSpinItem[];
  setRoundSpinModal: (v: {
    isOpen: boolean;
    title: string;
    items: WheelSpinItem[];
    roundIndex: number;
    side: "player1" | "player2";
  }) => void;
  /** Stack count của Dice of the Dead cho player này — ảnh hưởng Gambler odds */
  gamblerStackCount?: number;
}

export function RoundSpinButton({
  effectName,
  side,
  roundIdx,
  roundSpinResults,
  applyDevWeights,
  setRoundSpinModal,
  gamblerStackCount = 0,
}: SpinButtonProps) {
  const key = `${roundIdx}-${effectName}-${side}`;
  const result = roundSpinResults[key];
  const items = applyDevWeights(effectName, getSpinItems(effectName, gamblerStackCount));
  const label = getSpinLabel(effectName);
  const titleText = effectName === "The Sand of Time-2"
    ? "The Sand of Time (Spell Flux lần 2)"
    : effectName;

  if (result) {
    return (
      <button
        onClick={() => setRoundSpinModal({ isOpen: true, title: effectName, items, roundIndex: roundIdx, side })}
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
      onClick={() => setRoundSpinModal({ isOpen: true, title: effectName, items, roundIndex: roundIdx, side })}
      className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-purple-700/50 hover:bg-purple-600/60 text-purple-200 font-bold transition-colors border border-purple-600/30"
      title={`Quay ${titleText}`}
    >
      🎡 {label}
    </button>
  );
}

/**
 * Tính danh sách effects cần spin cho một round.
 * Tương đương filterLastRound + addSandFlux trong RoundResultsPanel.
 */
export function calcRoundSpinEffects(params: {
  effects: { onWin: string[]; onLose: string[]; onTie: string[] };
  winner: "player1" | "player2" | "tie";
  side: "player1" | "player2";
  statKey: string;
  isLastRound: boolean;
  /** Để check isSandFirstLoss — toàn bộ rounds đã resolve trước round này */
  prevRounds: Array<{ winner: "player1" | "player2" | "tie" }>;
  /** Opponent có Spell Flux không (để thêm Sand×2) */
  oppHasSpellFlux?: boolean;
}): string[] {
  const { effects, winner, side, statKey, isLastRound, prevRounds, oppHasSpellFlux } = params;
  const isSelf = (w: "player1" | "player2" | "tie") => w === side;
  const isWin = isSelf(winner) && winner !== "tie";
  const isTie = winner === "tie";
  const isLoss = !isWin && !isTie;

  const base = isWin ? effects.onWin : isTie ? effects.onTie : isLoss ? effects.onLose : [];
  const loserSide: "player1" | "player2" | undefined = isLoss ? side : undefined;

  const filtered = base.filter((e) => {
    if (["Bloodthirsty", "Divine Smite", "Yamato Blade-SPD", "Yamato Blade-MA", "Cautious-Self", "Hunter's Mark"].includes(e))
      return false;
    if ((e === "Bash" || e === "Luminescence") && isLastRound) return false;
    if (e === "Ranger-Silver" && isLastRound) return false;
    if (e in RANGER_ROUND_STAT) {
      const required = RANGER_ROUND_STAT[e];
      if (Array.isArray(required)) return required.includes(statKey);
      return required === statKey;
    }
    if (e === "The Sand of Time") {
      if (!loserSide) return false;
      // isSandFirstLoss: loserSide chưa thua round nào trước đây
      const firstLoss = prevRounds.every((r) => r.winner === "tie" || r.winner === loserSide);
      return firstLoss;
    }
    return true;
  });

  // Thêm Sand×2 nếu loser có Spell Flux
  if (filtered.includes("The Sand of Time") && oppHasSpellFlux) {
    return [...filtered, "The Sand of Time-2"];
  }
  return filtered;
}
