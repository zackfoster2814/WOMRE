/**
 * CombatEffectsPanel
 *
 * Panel bán tự động hiển thị các combat effects cần xử lý sau/trong combat.
 * - Auto effects: hiển thị ngay + button "Apply"
 * - Probability effects: button "🎡 Spin" mở ProbabilityWheelModal
 * - GM Action effects: hiển thị mô tả để GM xử lý thủ công
 *
 * Nhóm 2 features:
 * - Collapsible sections theo timing (default closed)
 * - Show activated state cho các effects hiện tại
 * - Section separation rõ ràng: Trước / Trong / Sau combat
 */

import { useState, useEffect } from "react";
import { ProbabilityWheelModal, type WheelSpinItem } from "./ProbabilityWheelModal";
import type { Character } from "../types/character";
import { EffectRegistry } from "../effects/registry";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type EffectCategory = "auto" | "wheel" | "gm";
type EffectTiming = "before_combat" | "during_combat" | "after_combat" | "after_win" | "after_lose";

interface StatChange {
  stat: string;
  label: string;
  value: number;
}

export interface CombatPendingEffect {
  id: string;
  playerLabel: "player1" | "player2";
  playerName: string;
  sourceName: string;
  timing: EffectTiming;
  category: EffectCategory;
  description: string;
  /** Nếu category='auto': stat changes tự động */
  autoChanges?: StatChange[];
  /** Nếu category='wheel': config vòng quay */
  wheelItems?: WheelSpinItem[];
  /** Nếu category='gm': text hướng dẫn GM */
  gmNote?: string;
  /** Kết quả đã xử lý */
  resolved?: boolean;
  resolvedNote?: string;
  /** Effect này đang được kích hoạt (relevant với combat hiện tại) */
  isActivated?: boolean;
}

interface CombatRound {
  stat: string;
  winner: "player1" | "player2" | "tie";
}

interface CombatResultInfo {
  winner: "player1" | "player2";
  player1Score: number;
  player2Score: number;
  rounds: CombatRound[];
}

interface CombatEffectsPanelProps {
  player1: { name: string; character?: Character };
  player2: { name: string; character?: Character };
  combatResult?: CombatResultInfo;
  /** Nếu true: chỉ hiển thị before_combat effects (pre-combat warning mode) */
  preCombatOnly?: boolean;
  /**
   * Callback generic khi bất kỳ wheel effect nào được resolve.
   * BattleZonePage tự xử lý logic dựa vào sourceName.
   */
  onWheelResolved?: (
    playerLabel: "player1" | "player2",
    sourceName: string,
    item: WheelSpinItem,
  ) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Effect Definitions (Quirks + Archetypes với combat timing)
// ─────────────────────────────────────────────────────────────────────────────

type EffectTrigger = "after_combat" | "after_win" | "after_lose" | "during_combat" | "before_combat";

interface EffectDef {
  source: string; // Quirk / Archetype name (lowercase để match)
  timing: EffectTrigger;
  category: EffectCategory;
  description: string;
  autoChanges?: StatChange[];
  wheelItems?: WheelSpinItem[];
  gmNote?: string;
  /** Custom resolver: trả về effect cụ thể dựa vào context */
  resolver?: (ctx: ResolverCtx) => Partial<CombatPendingEffect> | null;
}

interface ResolverCtx {
  character: Character;
  opponentCharacter?: Character;
  combatResult: CombatResultInfo;
  playerLabel: "player1" | "player2";
  isWinner: boolean;
  roundsWon: number;
  roundsLost: number;
  margin: number;
}

const STAT_LABELS: Record<string, string> = {
  strength: "STR", speed: "SPD", durability: "DUR",
  iq: "IQ", biq: "BIQ", ma: "MA",
};

const ALL_STATS: StatChange[] = Object.entries(STAT_LABELS).map(([stat, label]) => ({
  stat, label, value: 0,
}));

function allStatChange(value: number): StatChange[] {
  return ALL_STATS.map((s) => ({ ...s, value }));
}

const EFFECT_DEFS: EffectDef[] = [
  // ─── QUIRKS ───────────────────────────────────────────────────────────────

  // Slow Healer: -1 DUR sau combat
  {
    source: "slow healer",
    timing: "after_combat",
    category: "auto",
    description: "Slow Healer: -1 DUR sau combat.",
    autoChanges: [{ stat: "durability", label: "DUR", value: -1 }],
  },

  // Night Owl: 10% -1 all stats sau combat
  {
    source: "night owl",
    timing: "after_combat",
    category: "wheel",
    description: "Night Owl: 10% nhận -1 All Stats.",
    wheelItems: [
      { label: "-1 All Stats", weight: 10, isSuccess: true, color: "#ef4444" },
      { label: "Bình thường", weight: 90, isSuccess: false, color: "#6b7280" },
    ],
    gmNote: "Nếu trúng: -1 tất cả stats",
  },

  // Lazy: -1 STR, -1 SPD, +2 IQ sau combat
  {
    source: "lazy",
    timing: "after_combat",
    category: "auto",
    description: "Lazy: -1 STR, -1 SPD, +2 IQ sau combat.",
    autoChanges: [
      { stat: "strength", label: "STR", value: -1 },
      { stat: "speed", label: "SPD", value: -1 },
      { stat: "iq", label: "IQ", value: 2 },
    ],
  },

  // Independent: +2 random stat sau combat
  {
    source: "independent",
    timing: "after_combat",
    category: "gm",
    description: "Independent: +2 vào 1 stat ngẫu nhiên sau combat.",
    gmNote: "Quay wheel random stat → +2 vào stat đó",
  },

  // Fast Learner: 33% học Power của đối thủ
  {
    source: "fast learner",
    timing: "after_combat",
    category: "wheel",
    description: "Fast Learner: 33% học được 1 Power của đối thủ.",
    wheelItems: [
      { label: "Học Power (33%)", weight: 33, isSuccess: true, color: "#10b981" },
      { label: "Thất bại (67%)", weight: 67, isSuccess: false, color: "#6b7280" },
    ],
    gmNote: "Nếu thành công: GM trao 1 Power ngẫu nhiên từ đối thủ",
  },

  // Resilient: 36% +1 vào stat đã thua
  {
    source: "resilient",
    timing: "after_combat",
    category: "wheel",
    description: "Resilient: 36% nhận +1 vào chỉ số thua round.",
    wheelItems: [
      { label: "+1 Stat (36%)", weight: 36, isSuccess: true, color: "#10b981" },
      { label: "Bình thường (64%)", weight: 64, isSuccess: false, color: "#6b7280" },
    ],
    gmNote: "Nếu thành công: +1 vào stat của round đã thua (GM xác định round cụ thể)",
  },

  // Herbalist: nhận 1 thảo dược sau combat
  {
    source: "herbalist",
    timing: "after_combat",
    category: "gm",
    description: "Herbalist: nhận 1 Thảo Dược sau combat.",
    gmNote: "[GM Action] Quay vòng quay Thảo Dược cho player này",
  },

  // Under the Weather → Shining Brightly (sau thắng)
  {
    source: "under the weather",
    timing: "after_win",
    category: "gm",
    description: "Under the Weather → Shining Brightly sau khi thắng.",
    gmNote: "[GM Action] Đổi quirk 'Under the Weather' → 'Shining Brightly' trong data",
  },

  // Shining Brightly → Under the Weather (sau thua)
  {
    source: "shining brightly",
    timing: "after_lose",
    category: "gm",
    description: "Shining Brightly → Under the Weather sau khi thua.",
    gmNote: "[GM Action] Đổi quirk 'Shining Brightly' → 'Under the Weather' trong data",
  },

  // Compassionate: +1 IQ sau thắng + tặng Gear cho đối thủ
  {
    source: "compassionate",
    timing: "after_win",
    category: "auto",
    description: "Compassionate: +1 IQ sau combat thắng.",
    autoChanges: [{ stat: "iq", label: "IQ", value: 1 }],
    gmNote: "[GM Action] Đồng thời tặng 1 Gear ngẫu nhiên cho đối thủ",
  },

  // Open-minded: 33% đối thủ thành Lover sau combat
  {
    source: "open-minded",
    timing: "after_combat",
    category: "wheel",
    description: "Open-minded: 33% biến đối thủ thành Lover.",
    wheelItems: [
      { label: "Lover mới! (33%)", weight: 33, isSuccess: true, color: "#ec4899" },
      { label: "Bình thường (67%)", weight: 67, isSuccess: false, color: "#6b7280" },
    ],
    gmNote: "Nếu thành công: GM thêm đối thủ vào danh sách Lover",
  },

  // Progressive: reroll stats sau thua
  {
    source: "progressive",
    timing: "after_lose",
    category: "gm",
    description: "Progressive: quay lại stats sau thua. Nếu total mới > cũ: +1 all stats.",
    gmNote: "[GM Action] Cho player quay lại toàn bộ stats. So sánh total. Nếu mới > cũ: +1 All Stats",
  },

  // Generous: tặng PvP Reward sau thắng
  {
    source: "generous",
    timing: "after_win",
    category: "gm",
    description: "Generous: tặng PvP Reward cho đối thủ sau thắng.",
    gmNote: "[GM Action] Trao PvP Reward cho đối thủ và tăng counter generousRewardsGiven lên 1",
  },

  // Cheater death buff
  {
    source: "cheater",
    timing: "after_lose",
    category: "gm",
    description: "Cheater: khi bị loại, Lovers nhận +1 All Stats.",
    gmNote: "[GM Action] Nếu bị loại hoàn toàn khỏi giải: buff +1 All Stats cho tất cả Lovers",
  },

  // Patient: max power wheel sau thắng
  {
    source: "patient",
    timing: "after_win",
    category: "gm",
    description: "Patient: nhận vòng quay Power với kết quả tối đa sau thắng.",
    gmNote: "[GM Action] Quay vòng quay Power cho player, kết quả luôn là giá trị cao nhất",
  },

  // ─── ARCHETYPES ──────────────────────────────────────────────────────────

  // Chokevy: -1 all stats sau combat
  {
    source: "chokevy",
    timing: "after_combat",
    category: "auto",
    description: "Chokevy: -1 All Stats sau combat.",
    autoChanges: allStatChange(-1),
  },

  // Masochist: +1 all stats + 1 Power sau thua
  {
    source: "masochist",
    timing: "after_lose",
    category: "auto",
    description: "Masochist: +1 All Stats sau thua.",
    autoChanges: allStatChange(1),
    gmNote: "[GM Action] Đồng thời cấp 1 Power ngẫu nhiên cho player",
  },

  // Zealot: +1 lowest stat per round lost
  {
    source: "zealot",
    timing: "after_combat",
    category: "gm",
    description: "Zealot: +N stat thấp nhất (N = số round thua).",
    resolver: (ctx) => {
      const n = ctx.roundsLost;
      if (n === 0) return null;
      return {
        description: `Zealot: +${n} stat thấp nhất (thua ${n} round).`,
        category: "gm" as EffectCategory,
        gmNote: `[GM Action] Xác định stat thấp nhất hiện tại, cộng +${n}`,
        isActivated: true,
      };
    },
  },

  // Perfectionist: +4 lowest stat nếu thắng ≥4 điểm
  {
    source: "perfectionist",
    timing: "after_win",
    category: "gm",
    description: "Perfectionist: +4 stat thấp nhất nếu thắng cách biệt ≥4.",
    resolver: (ctx) => {
      if (!ctx.isWinner) return null;
      if (ctx.margin < 4) {
        return {
          description: `Perfectionist: Cách biệt chỉ ${ctx.margin} điểm (cần ≥4) → không kích hoạt.`,
          category: "auto" as EffectCategory,
          resolved: true,
          resolvedNote: `Cách biệt ${ctx.margin} < 4 → bỏ qua`,
          isActivated: false,
        };
      }
      return {
        description: `Perfectionist: Thắng cách biệt ${ctx.margin} điểm → +4 stat thấp nhất!`,
        category: "gm" as EffectCategory,
        gmNote: `[GM Action] Xác định stat thấp nhất của ${ctx.character.name}, cộng +4`,
        isActivated: true,
      };
    },
  },

  // Gambler: 50% per round won → retroactive
  {
    source: "gambler",
    timing: "during_combat",
    category: "wheel",
    description: "Gambler: mỗi round thắng có 50% +2 điểm / 50% +0 điểm.",
    resolver: (ctx) => {
      const wins = ctx.roundsWon;
      if (wins === 0) return null;
      return {
        description: `Gambler: Thắng ${wins} round, mỗi round roll 50/50 (+2 điểm / +0 điểm).`,
        category: "gm" as EffectCategory,
        gmNote: `[GM Action] Roll ${wins} lần 50/50. Mỗi lần thành công: +2 điểm vào tổng điểm combat`,
        isActivated: wins > 0,
      };
    },
  },

  // Follower of Two Fingers: -1 IQ, -1 BIQ, steal power
  {
    source: "follower of the two fingers",
    timing: "after_combat",
    category: "auto",
    description: "Follower of Two Fingers: -1 IQ, -1 BIQ sau combat.",
    autoChanges: [
      { stat: "iq", label: "IQ", value: -1 },
      { stat: "biq", label: "BIQ", value: -1 },
    ],
    gmNote: "[GM Action] Đồng thời cướp 1 Power từ 1 player ngẫu nhiên",
  },

  // Infirmarian: cure AIDS sau combat
  {
    source: "infirmarian",
    timing: "after_combat",
    category: "gm",
    description: "Infirmarian: loại bỏ AIDS khỏi cả 2 player sau combat.",
    gmNote: "[GM Action] Xóa Power 'AIDS' khỏi data của cả 2 player (nếu có)",
  },

  // Summoner: nhận summon wheel sau thắng
  {
    source: "summoner",
    timing: "after_win",
    category: "gm",
    description: "Summoner: nhận 1 lần quay Summon Wheel sau thắng.",
    gmNote: "[GM Action] Quay Summon Wheel cho player, thêm Summon không trùng",
  },

  // Bravest of the Brave: 2x PvP Reward sau thắng
  {
    source: "bravest of the brave",
    timing: "after_win",
    category: "gm",
    description: "Bravest of the Brave: nhận 2 PvP Rewards thay vì 1 sau thắng.",
    gmNote: "[GM Action] Trao 2 PvP Rewards cho player",
  },

  // Raumanian: 36% nhận 1 điểm trước combat
  {
    source: "raumanian",
    timing: "before_combat",
    category: "wheel",
    description: "Raumanian: 36% nhận +1 điểm khởi đầu.",
    wheelItems: [
      { label: "+1 điểm (36%)", weight: 36, isSuccess: true, color: "#10b981" },
      { label: "Bình thường (64%)", weight: 64, isSuccess: false, color: "#6b7280" },
    ],
    gmNote: "Nếu thành công: cộng 1 điểm vào điểm khởi đầu",
  },

  {
    source: "raumanian🍀",
    timing: "before_combat",
    category: "wheel",
    description: "Raumanian🍀: 36% nhận +1 điểm khởi đầu.",
    wheelItems: [
      { label: "+1 điểm (36%)", weight: 36, isSuccess: true, color: "#10b981" },
      { label: "Bình thường (64%)", weight: 64, isSuccess: false, color: "#6b7280" },
    ],
    gmNote: "Nếu thành công: cộng 1 điểm vào điểm khởi đầu",
  },

  // ─── SUB-RACE EFFECTS ─────────────────────────────────────────────────────

  // Gold Ship (UMA): trước combat 50/50 +1/-1 all stats
  {
    source: "gold ship",
    timing: "before_combat",
    category: "wheel",
    description:
      "Gold Ship: Trước combat quay 50/50 → +1 all stats hoặc -1 all stats.",
    wheelItems: [
      { label: "+1 All Stats", weight: 1, isSuccess: true, color: "#f59e0b" },
      { label: "-1 All Stats", weight: 1, isSuccess: false, color: "#6b7280" },
    ],
  },

  // Nice Nature (UMA): nếu kết thúc 3-3 thì tự động thắng
  {
    source: "nice nature",
    timing: "during_combat",
    category: "gm",
    description:
      "Nice Nature: Nếu kết thúc tỷ số 3-3, bỏ qua Tie-Break và thắng.",
    gmNote:
      "[GM Action] Nếu combat kết thúc 3-3: player này tự động thắng, bỏ qua mọi tie-breaker khác.",
  },

  // ─── HOUSE EFFECTS ────────────────────────────────────────────────────────

  // Dothraki: quay wheel trước combat để xác định luật đặc biệt
  {
    source: "dothraki",
    timing: "before_combat",
    category: "wheel",
    description:
      "Dothraki: Quay wheel xác định luật chiến đấu đặc biệt cho trận này.",
    wheelItems: [
      {
        label: "Luật 1: Đảo chỉ số của đối thủ (STR↔MA, Speed↔BIQ, Dura↔IQ)",
        weight: 1,
        color: "#ef4444",
        meta: { ruleIndex: 1 },
      },
      {
        label: "Luật 2: Đảo Strength↔Battle IQ của bạn",
        weight: 1,
        color: "#f59e0b",
        meta: { ruleIndex: 2 },
      },
      {
        label: "Luật 3: Đảo Speed↔IQ của bạn",
        weight: 1,
        color: "#22c55e",
        meta: { ruleIndex: 3 },
      },
      {
        label: "Luật 4: Đảo Dura↔MA của bạn",
        weight: 1,
        color: "#3b82f6",
        meta: { ruleIndex: 4 },
      },
      {
        label: "Luật 5: Bạn +4 All Stats, đối thủ nhận +3 điểm khởi đầu",
        weight: 1,
        color: "#a855f7",
        meta: { ruleIndex: 5 },
      },
      {
        label:
          "Luật 6: Đối thủ +5 All Stats, bạn +1 All Stats mỗi điểm ghi được sau trận [GM]",
        weight: 1,
        color: "#ec4899",
        meta: { ruleIndex: 6 },
      },
    ],
  },

  // ─── DURING-COMBAT QUIRKS (hiển thị trước combat để GM biết luật đặc biệt) ──

  // Bloodthirsty: thắng round +1 điểm, thua round mất hết điểm
  {
    source: "bloodthirsty",
    timing: "before_combat",
    category: "gm",
    description: "Bloodthirsty: Mỗi round thắng +1 điểm BONUS, mỗi round thua mất TOÀN BỘ điểm tích lũy.",
    gmNote: "[GM Action] Theo dõi điểm riêng cho player này theo rule Bloodthirsty: round win = +1 bonus, round lose = reset về 0",
  },

  // Cautious: đối thủ không nhận điểm khi thắng round Strength
  {
    source: "cautious",
    timing: "before_combat",
    category: "gm",
    description: "Cautious: Đối thủ không nhận điểm khi thắng round Strength.",
    gmNote: "[GM Action] Khi so sánh STR, nếu đối thủ thắng → họ KHÔNG được +1 điểm",
  },

  // Encroaching Shadow: trước combat quay 75/25 → +7 Speed suốt trận
  {
    source: "encroaching shadow",
    timing: "before_combat",
    category: "wheel",
    description: "Encroaching Shadow: 75% nhận +7 Speed suốt trận.",
    wheelItems: [
      { label: "+7 Speed (75%)", weight: 75, isSuccess: true, color: "#a855f7" },
      { label: "Không có (25%)", weight: 25, isSuccess: false, color: "#6b7280" },
    ],
    gmNote: "Nếu thành công: +7 Speed được cộng vào stats trước combat",
  },

  // One Trick Pony: quay wheel chọn 1 stat → thắng stat đó +3 điểm, thắng stat khác +0 điểm
  {
    source: "one trick pony",
    timing: "during_combat",
    category: "wheel",
    description:
      "One Trick Pony: Quay wheel chọn 1 stat. Thắng stat đó = +3 điểm; thắng các stat khác = +0 điểm.",
    wheelItems: [
      { label: "Strength", weight: 1, isSuccess: true, color: "#ef4444" },
      { label: "Speed", weight: 1, isSuccess: true, color: "#f59e0b" },
      { label: "Durability", weight: 1, isSuccess: true, color: "#22c55e" },
      { label: "IQ", weight: 1, isSuccess: true, color: "#3b82f6" },
      { label: "BIQ", weight: 1, isSuccess: true, color: "#a855f7" },
      { label: "MA", weight: 1, isSuccess: true, color: "#ec4899" },
    ],
  },

  // Weak-Knee: round đầu tiên thắng không nhận điểm
  {
    source: "weak-knee",
    timing: "before_combat",
    category: "gm",
    description: "Weak-Knee: Round đầu tiên chiến thắng không nhận điểm.",
    gmNote: "[GM Action] Round đầu tiên player này thắng (dù là round nào) → không tính điểm",
  },

  // Cruelty: round hòa → coinflip 50/50 ai nhận 1 điểm
  {
    source: "cruelty",
    timing: "before_combat",
    category: "wheel",
    description: "Cruelty: Khi round hòa, quay 50/50 để quyết định ai nhận 1 điểm.",
    resolver: (ctx) => {
      const tieRounds = ctx.combatResult.rounds.filter((r) => r.winner === "tie").length;
      if (tieRounds === 0) return null;
      return {
        description: `Cruelty: Có ${tieRounds} round hòa → cần quay ${tieRounds} lần 50/50.`,
        category: "gm" as EffectCategory,
        gmNote: `[GM Action] Quay coin flip ${tieRounds} lần. Mỗi lần: 50% player này nhận 1 điểm, 50% đối thủ nhận 1 điểm`,
        isActivated: tieRounds > 0,
      };
    },
  },

  // Blind: 15% không nhận điểm khi thắng round
  {
    source: "blind",
    timing: "before_combat",
    category: "gm",
    description: "Blind: Mỗi round thắng có 15% không nhận điểm.",
    gmNote: "[GM Action] Mỗi round player này thắng: roll 15% (xác suất) → nếu trúng, round đó không tính điểm",
  },

  // Mute: 10% -1 stat ngẫu nhiên khi thua round
  {
    source: "mute",
    timing: "before_combat",
    category: "gm",
    description: "Mute: Mỗi round thua có 10% -1 stat ngẫu nhiên.",
    gmNote: "[GM Action] Mỗi round player này thua: roll 10% → nếu trúng, -1 vào stat của round đó",
  },

  // ─── HOUSE MASON EFFECTS ─────────────────────────────────────────────────

  // Tracen Academy Mason: sau combat +1 stat bất kì
  {
    source: "tracen academy mason",
    timing: "after_combat",
    category: "gm",
    description: "Tracen Academy Mason: Sau combat nhận +1 vào 1 Stat bất kì.",
    gmNote: "[GM Action] Cho player chọn hoặc quay ngẫu nhiên 1 stat → +1 vào stat đó",
  },

  // ─── ARCHETYPE EFFECTS ────────────────────────────────────────────────────

  // Invoker: Trước combat quay ngẫu nhiên 1 Power chưa sở hữu
  {
    source: "invoker",
    timing: "before_combat",
    category: "wheel",
    description:
      "Invoker: Quay 1 Power ngẫu nhiên chưa sở hữu — hiệu ứng áp dụng trong combat này.",
    resolver: (ctx) => {
      // Lấy tất cả powers từ registry, loại bỏ những power char đã có
      const allPowers = EffectRegistry.getAllByType("power")
        .filter((p) => (p.weight ?? 0) > 0) // chỉ lấy powers có weight (không lấy special powers weight=0)
        .map((p) => p.name);
      const ownedPowerNames = new Set(
        (ctx.character.powers || [])
          .filter((p: any) => !p.isLost)
          .map((p: any) => (typeof p === "string" ? p : p.name).toLowerCase()),
      );
      const availablePowers = allPowers.filter(
        (n) => !ownedPowerNames.has(n.toLowerCase()),
      );
      if (availablePowers.length === 0) return null;
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
      const wheelItems: WheelSpinItem[] = availablePowers.map((name, i) => ({
        label: name,
        weight: 1,
        isSuccess: true,
        color: colors[i % colors.length],
        meta: { powerName: name },
      }));
      return {
        category: "wheel" as EffectCategory,
        description: `Invoker: Quay 1 Power ngẫu nhiên (${availablePowers.length} powers khả dụng) — áp dụng trong combat này.`,
        wheelItems,
      };
    },
  },

  // ─── HOUSE MASON EFFECTS ─────────────────────────────────────────────────

  // Tracen Academy Mason: sau combat +1 stat bất kì
  {
    source: "tracen academy mason",
    timing: "after_combat",
    category: "gm",
    description: "Tracen Academy Mason: Sau combat nhận +1 vào 1 Stat bất kì.",
    gmNote:
      "[GM Action] Cho player chọn hoặc quay ngẫu nhiên 1 stat → +1 vào stat đó",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Builder: tạo danh sách pending effects từ character data + combat result
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_COMBAT_RESULT: CombatResultInfo = {
  winner: "player1",
  player1Score: 0,
  player2Score: 0,
  rounds: [],
};

function buildPendingEffects(
  character: Character,
  opponentCharacter: Character | undefined,
  playerLabel: "player1" | "player2",
  playerName: string,
  combatResult: CombatResultInfo | undefined,
  preCombatOnly: boolean,
): CombatPendingEffect[] {
  const result = combatResult ?? EMPTY_COMBAT_RESULT;
  const isWinner = result.winner === playerLabel;
  const isLoser = !isWinner;

  const roundsWon = result.rounds.filter(
    (r) => r.winner === playerLabel,
  ).length;
  const roundsLost = result.rounds.filter(
    (r) => r.winner !== playerLabel && r.winner !== "tie",
  ).length;
  const margin = Math.abs(result.player1Score - result.player2Score);

  const ctx: ResolverCtx = {
    character,
    opponentCharacter,
    combatResult: result,
    playerLabel,
    isWinner,
    roundsWon,
    roundsLost,
    margin,
  };

  // Collect source names (quirks + archetypes + house names + house sub-types + sub-race + powers) lowercase
  const sources: string[] = [
    ...(character.quirks || [])
      .filter((q) => !q.isLost)
      .map((q) => q.name.toLowerCase()),
    ...(character.archetypes || []).map((a) => a.toLowerCase()),
    // Active house names (e.g. "dothraki", "roundtable hold")
    ...((character as any).houses || [])
      .filter((h: any) => !h.isLost && h.name)
      .map((h: any) => (h.name as string).toLowerCase()),
    // House sub-types (Mason effects etc.) — sourced from houses[].subType
    ...((character as any).houses || [])
      .filter((h: any) => !h.isLost && !h.subTypeIsLost && h.subType)
      .map((h: any) => (h.subType as string).toLowerCase()),
    // Sub-race (UMA, Demon Sin, God, etc.)
    ...(character.race?.subRace ? [character.race.subRace.toLowerCase()] : []),
    // Powers (e.g. "Encroaching Shadow")
    ...(character.powers || [])
      .filter((p: any) => !p.isLost)
      .map((p: any) => (typeof p === "string" ? p : p.name).toLowerCase()),
  ];

  const effects: CombatPendingEffect[] = [];

  EFFECT_DEFS.forEach((def) => {
    // Check if character has this source
    const hasSource = sources.some((s) => s === def.source);
    if (!hasSource) return;

    // In pre-combat mode: only show before_combat effects
    if (preCombatOnly && def.timing !== "before_combat") return;

    // Check timing relevance
    const timingOk =
      def.timing === "after_combat" ||
      (def.timing === "after_win" && isWinner) ||
      (def.timing === "after_lose" && isLoser) ||
      (def.timing === "before_combat") ||
      (def.timing === "during_combat");

    if (!timingOk) return;

    // Run custom resolver if present
    if (def.resolver) {
      const resolved = def.resolver(ctx);
      if (resolved === null) return;
      effects.push({
        id: `${playerLabel}-${def.source}-${effects.length}`,
        playerLabel,
        playerName,
        sourceName: def.source,
        timing: def.timing as EffectTiming,
        category: def.category,
        description: def.description,
        autoChanges: def.autoChanges,
        wheelItems: def.wheelItems,
        gmNote: def.gmNote,
        isActivated: false,
        ...resolved,
      });
      return;
    }

    effects.push({
      id: `${playerLabel}-${def.source}-${effects.length}`,
      playerLabel,
      playerName,
      sourceName: def.source,
      timing: def.timing as EffectTiming,
      category: def.category,
      description: def.description,
      autoChanges: def.autoChanges,
      wheelItems: def.wheelItems,
      gmNote: def.gmNote,
    });
  });

  return effects;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section config
// ─────────────────────────────────────────────────────────────────────────────

const TIMING_LABELS: Record<EffectTiming, string> = {
  before_combat: "Trước combat",
  during_combat: "Trong combat",
  after_combat: "Sau combat",
  after_win: "Sau thắng",
  after_lose: "Sau thua",
};

// Group timings into 3 phases for display
const PHASE_GROUPS: { label: string; icon: string; timings: EffectTiming[]; color: string }[] = [
  {
    label: "Trước / Trong Combat",
    icon: "⚔️",
    timings: ["before_combat", "during_combat"],
    color: "border-yellow-500/40 text-yellow-300",
  },
  {
    label: "Sau Combat",
    icon: "⚡",
    timings: ["after_combat"],
    color: "border-gray-500/40 text-gray-300",
  },
  {
    label: "Sau Thắng / Sau Thua",
    icon: "🏆",
    timings: ["after_win", "after_lose"],
    color: "border-green-500/40 text-green-300",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Effect Row Component
// ─────────────────────────────────────────────────────────────────────────────

interface EffectRowProps {
  effect: CombatPendingEffect;
  onApply: (id: string) => void;
  onSpinRequest: (effect: CombatPendingEffect) => void;
}

const EffectRow = ({ effect, onApply, onSpinRequest }: EffectRowProps) => {
  const isResolved = effect.resolved;
  const playerColor =
    effect.playerLabel === "player1" ? "text-blue-400" : "text-red-400";
  const timingBadge: Record<EffectTiming, string> = {
    before_combat: "bg-yellow-700/50 text-yellow-300",
    during_combat: "bg-orange-700/50 text-orange-300",
    after_combat: "bg-gray-700/50 text-gray-300",
    after_win: "bg-green-700/50 text-green-300",
    after_lose: "bg-red-700/50 text-red-300",
  };

  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        isResolved
          ? "border-gray-700 bg-gray-800/30 opacity-60"
          : effect.isActivated
          ? "border-amber-500/60 bg-amber-900/20"
          : "border-gray-600 bg-gray-800/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`font-semibold text-sm ${playerColor}`}>
              {effect.playerName}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${timingBadge[effect.timing]}`}
            >
              {TIMING_LABELS[effect.timing]}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-700/50 text-purple-300 capitalize">
              {effect.sourceName}
            </span>
            {effect.isActivated && !isResolved && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-600/60 text-amber-200 font-bold animate-pulse">
                ✦ Kích hoạt
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-300 text-sm">{effect.description}</p>

          {/* Auto stat changes */}
          {effect.autoChanges && effect.autoChanges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {effect.autoChanges.map((c, i) => (
                <span
                  key={i}
                  className={`text-xs px-2 py-0.5 rounded font-mono ${
                    c.value > 0
                      ? "bg-green-800/50 text-green-300"
                      : "bg-red-800/50 text-red-300"
                  }`}
                >
                  {c.value > 0 ? "+" : ""}
                  {c.value} {c.label}
                </span>
              ))}
            </div>
          )}

          {/* GM Note */}
          {effect.gmNote && (
            <p className="text-yellow-400/70 text-xs mt-1 italic">
              {effect.gmNote}
            </p>
          )}

          {/* Resolved note */}
          {isResolved && effect.resolvedNote && (
            <p className="text-gray-500 text-xs mt-1">✓ {effect.resolvedNote}</p>
          )}
        </div>

        {/* Action button */}
        {!isResolved && (
          <div className="shrink-0">
            {effect.category === "auto" && (
              <button
                onClick={() => onApply(effect.id)}
                className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded text-white text-xs font-medium transition-all"
              >
                ✓ Apply
              </button>
            )}
            {effect.category === "wheel" && (
              <button
                onClick={() => onSpinRequest(effect)}
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 rounded text-white text-xs font-medium transition-all whitespace-nowrap"
              >
                🎡 Quay
              </button>
            )}
            {effect.category === "gm" && (
              <span className="px-3 py-1.5 bg-yellow-800/50 rounded text-yellow-400 text-xs font-medium whitespace-nowrap">
                GM Action
              </span>
            )}
          </div>
        )}

        {isResolved && (
          <span className="shrink-0 text-green-500 text-lg">✓</span>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible Section Component
// ─────────────────────────────────────────────────────────────────────────────

interface CollapsibleSectionProps {
  label: string;
  icon: string;
  colorClass: string;
  items: CombatPendingEffect[];
  defaultOpen?: boolean;
  onApply: (id: string) => void;
  onSpinRequest: (effect: CombatPendingEffect) => void;
}

const CollapsibleSection = ({
  label,
  icon,
  colorClass,
  items,
  defaultOpen = false,
  onApply,
  onSpinRequest,
}: CollapsibleSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  const activatedCount = items.filter((e) => e.isActivated && !e.resolved).length;
  const pendingCount = items.filter((e) => !e.resolved).length;
  const resolvedCount = items.filter((e) => e.resolved).length;

  return (
    <div className={`rounded-xl border ${colorClass.split(" ")[0]} overflow-hidden`}>
      {/* Section header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-800/70 hover:bg-gray-700/70 transition-colors text-left"
      >
        <span className="text-base">{icon}</span>
        <span className={`font-semibold text-sm flex-1 ${colorClass.split(" ")[1]}`}>{label}</span>

        {/* Badges */}
        <div className="flex items-center gap-1.5">
          {activatedCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-600/60 text-amber-200 font-bold">
              {activatedCount} kích hoạt
            </span>
          )}
          {pendingCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
              {pendingCount}
            </span>
          )}
          {resolvedCount > 0 && pendingCount === 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400">
              ✓ done
            </span>
          )}
          <span className={`text-xs ml-1 ${colorClass.split(" ")[1]}`}>
            {open ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {/* Collapsible content */}
      {open && (
        <div className="px-3 pb-3 pt-2 space-y-2 bg-gray-900/40">
          {items.map((effect) => (
            <EffectRow
              key={effect.id}
              effect={effect}
              onApply={onApply}
              onSpinRequest={onSpinRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Panel Component
// ─────────────────────────────────────────────────────────────────────────────

export const CombatEffectsPanel = ({
  player1,
  player2,
  combatResult,
  preCombatOnly = false,
  onWheelResolved,
}: CombatEffectsPanelProps) => {
  const buildEffects = () => {
    const list: CombatPendingEffect[] = [];
    if (player1.character) {
      list.push(
        ...buildPendingEffects(
          player1.character,
          player2.character,
          "player1",
          player1.name,
          combatResult,
          preCombatOnly,
        ),
      );
    }
    if (player2.character) {
      list.push(
        ...buildPendingEffects(
          player2.character,
          player1.character,
          "player2",
          player2.name,
          combatResult,
          preCombatOnly,
        ),
      );
    }
    return list;
  };

  const [effects, setEffects] = useState<CombatPendingEffect[]>(buildEffects);

  // Rebuild effects khi player thay đổi (e.g. dev mode load matchup)
  // Giữ lại resolved state của effects cũ (id-based) để không reset sau khi invoker add power
  useEffect(() => {
    setEffects((prev) => {
      const resolvedMap = new Map(prev.map((e) => [e.id, e.resolved]));
      const rebuilt = buildEffects();
      return rebuilt.map((e) => ({
        ...e,
        resolved: resolvedMap.get(e.id) ?? e.resolved,
      }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player1.character, player2.character, combatResult]);

  const [spinModal, setSpinModal] = useState<{
    isOpen: boolean;
    effect: CombatPendingEffect | null;
  }>({ isOpen: false, effect: null });

  if (effects.length === 0) return null;

  const handleApply = (id: string) => {
    setEffects((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, resolved: true, resolvedNote: "Đã apply" }
          : e,
      ),
    );
  };

  const handleSpinRequest = (effect: CombatPendingEffect) => {
    setSpinModal({ isOpen: true, effect });
  };

  const handleSpinResult = (item: WheelSpinItem) => {
    if (!spinModal.effect) return;
    const id = spinModal.effect.id;
    const effect = spinModal.effect;
    const isOTP = effect.sourceName === "one trick pony";
    const isDothraki = effect.sourceName === "dothraki";
    const note = isOTP
      ? `Stat được chọn: ${item.label} → thắng = +3 điểm, các stat khác thắng = +0 điểm`
      : isDothraki
        ? `Kết quả: ${item.label}`
        : item.isSuccess
          ? `Thành công: ${item.label}`
          : `Thất bại: ${item.label}`;
    onWheelResolved?.(effect.playerLabel, effect.sourceName, item);
    setEffects((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, resolved: true, resolvedNote: note } : e,
      ),
    );
    setSpinModal({ isOpen: false, effect: null });
  };

  const pendingCount = effects.filter((e) => !e.resolved).length;
  const activatedTotal = effects.filter((e) => e.isActivated && !e.resolved).length;

  // Group effects by phase
  const phases = PHASE_GROUPS.map((phase) => ({
    ...phase,
    items: effects.filter((e) => phase.timings.includes(e.timing)),
  })).filter((p) => p.items.length > 0);

  return (
    <>
      <div className="mt-6 bg-gray-900/95 border-2 border-purple-500/40 rounded-xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-purple-300">
            {preCombatOnly ? "⚠️ Luật Đặc Biệt Trước Combat" : "⚡ Combat Effects"}
          </h3>
          <div className="flex items-center gap-2 text-xs">
            {activatedTotal > 0 && (
              <span className="text-amber-300 font-bold animate-pulse">
                ✦ {activatedTotal} kích hoạt
              </span>
            )}
            <span className="text-yellow-400">
              {pendingCount} chưa xử lý
            </span>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-2">
          {phases.map((phase) => (
            <CollapsibleSection
              key={phase.label}
              label={phase.label}
              icon={phase.icon}
              colorClass={phase.color}
              items={phase.items}
              defaultOpen={preCombatOnly || phase.timings.includes("before_combat")}
              onApply={handleApply}
              onSpinRequest={handleSpinRequest}
            />
          ))}
        </div>

        {pendingCount === 0 && (
          <div className="text-center text-green-400 py-3 font-medium text-sm mt-2">
            ✓ Tất cả effects đã được xử lý!
          </div>
        )}
      </div>

      {/* Probability Wheel Modal */}
      {spinModal.effect && (
        <ProbabilityWheelModal
          isOpen={spinModal.isOpen}
          onClose={() => setSpinModal({ isOpen: false, effect: null })}
          title={spinModal.effect.sourceName.toUpperCase()}
          description={spinModal.effect.description}
          items={spinModal.effect.wheelItems || []}
          onResult={handleSpinResult}
        />
      )}
    </>
  );
};
