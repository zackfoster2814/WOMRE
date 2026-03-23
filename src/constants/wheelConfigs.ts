import { WheelSpinItem } from "../components/ProbabilityWheelModal";

export const BASH_ITEMS: WheelSpinItem[] = [
  {
    label: "-3 stat đối thủ round kế (35%)",
    weight: 35,
    isSuccess: true,
    color: "#a855f7",
  },
  { label: "Không có (65%)", weight: 65, isSuccess: false, color: "#6b7280" },
];
export const CRIT_ITEMS: WheelSpinItem[] = [
  {
    label: "Crit! +1 bonus (20%)",
    weight: 20,
    isSuccess: true,
    color: "#f59e0b",
  },
  { label: "Miss (80%)", weight: 80, isSuccess: false, color: "#6b7280" },
];
export const EVASION_ITEMS: WheelSpinItem[] = [
  {
    label: "Evade! +1 điểm (20%)",
    weight: 20,
    isSuccess: true,
    color: "#10b981",
  },
  { label: "Không (80%)", weight: 80, isSuccess: false, color: "#6b7280" },
];
export const MISERICORDE_ITEMS: WheelSpinItem[] = [
  {
    label: "Nhận điểm! (10%)",
    weight: 10,
    isSuccess: true,
    color: "#a78bfa",
  },
  { label: "Không (90%)", weight: 90, isSuccess: false, color: "#6b7280" },
];
// The Sand of Time: 40% +1 điểm bản thân và -1 điểm đối thủ khi thua round đầu tiên
export const SAND_OF_TIME_ITEMS: WheelSpinItem[] = [
  {
    label: "Cát thời gian! +1 điểm, -1 đối thủ (40%)",
    weight: 40,
    isSuccess: true,
    color: "#f59e0b",
  },
  { label: "Không (60%)", weight: 60, isSuccess: false, color: "#6b7280" },
];
export const GAMBLER_ITEMS: WheelSpinItem[] = [
  // Gambler REPLACES normal +1: 50% = +2, 50% = +0
  { label: "+2 điểm (50%)", weight: 50, isSuccess: true, color: "#f59e0b" },
  { label: "+0 điểm (50%)", weight: 50, isSuccess: false, color: "#ef4444" },
];
export const CRUELTY_ITEMS: WheelSpinItem[] = [
  // Cruelty on tie: 50% = +1 for this player, 50% = opponent gets +1
  {
    label: "+1 điểm cho ta (50%)",
    weight: 50,
    isSuccess: true,
    color: "#e879f9",
  },
  {
    label: "+1 điểm cho đối thủ (50%)",
    weight: 50,
    isSuccess: false,
    color: "#6b7280",
  },
];
// Blind: 15% không nhận điểm khi thắng round
export const BLIND_ITEMS: WheelSpinItem[] = [
  {
    label: "Mù! Không nhận điểm (15%)",
    weight: 15,
    isSuccess: true,
    color: "#a78bfa",
  },
  {
    label: "Nhận điểm bình thường (85%)",
    weight: 85,
    isSuccess: false,
    color: "#6b7280",
  },
];
// Mute: 10% bị -1 vào chỉ số của round thua
export const MUTE_ITEMS: WheelSpinItem[] = [
  {
    label: "Câm! -1 chỉ số round thua (10%)",
    weight: 10,
    isSuccess: true,
    color: "#f472b6",
  },
  {
    label: "Bình thường (90%)",
    weight: 90,
    isSuccess: false,
    color: "#6b7280",
  },
];
// Power Ranger: Red — 20% +2 điểm khi thắng Strength
export const RANGER_RED_ITEMS: WheelSpinItem[] = [
  {
    label: "⚡ +2 điểm! (20%)",
    weight: 20,
    isSuccess: true,
    color: "#ef4444",
  },
  { label: "Không (80%)", weight: 80, isSuccess: false, color: "#6b7280" },
];
// Power Ranger: Blue — 33% +3 Base Speed khi thắng Speed
export const RANGER_BLUE_ITEMS: WheelSpinItem[] = [
  {
    label: "⚡ +3 Base Speed! (33%)",
    weight: 33,
    isSuccess: true,
    color: "#3b82f6",
  },
  { label: "Không (67%)", weight: 67, isSuccess: false, color: "#6b7280" },
];
// Power Ranger: Black — 20% nhận 1 Power khi thắng Durability
export const RANGER_BLACK_ITEMS: WheelSpinItem[] = [
  {
    label: "⚡ Nhận 1 Power! (20%)",
    weight: 20,
    isSuccess: true,
    color: "#1f2937",
  },
  { label: "Không (80%)", weight: 80, isSuccess: false, color: "#6b7280" },
];
// Power Ranger: Yellow — 25% nhận 1 Gear khi thắng IQ
export const RANGER_YELLOW_ITEMS: WheelSpinItem[] = [
  {
    label: "⚡ Nhận 1 Gear! (25%)",
    weight: 25,
    isSuccess: true,
    color: "#eab308",
  },
  { label: "Không (75%)", weight: 75, isSuccess: false, color: "#6b7280" },
];
// Power Ranger: Pink — 25% +1 Base stat ngẫu nhiên khi thắng BIQ/MA
export const RANGER_PINK_ITEMS: WheelSpinItem[] = [
  {
    label: "⚡ +1 Base stat ngẫu nhiên! (25%)",
    weight: 25,
    isSuccess: true,
    color: "#ec4899",
  },
  { label: "Không (75%)", weight: 75, isSuccess: false, color: "#6b7280" },
];
// Power Ranger: Silver — 15% gấp đôi chỉ số round tiếp theo khi thắng bất kỳ round
export const RANGER_SILVER_ITEMS: WheelSpinItem[] = [
  {
    label: "⚡ Gấp đôi stat round kế! (15%)",
    weight: 15,
    isSuccess: true,
    color: "#9ca3af",
  },
  { label: "Không (85%)", weight: 85, isSuccess: false, color: "#6b7280" },
];
// Night Owl / Open-minded: after-combat wheels (referenced via preCombatModal)
export const AFTER_COMBAT_WHEEL_ITEMS: Record<string, WheelSpinItem[]> = {
  "Night Owl": [
    {
      label: "Cú đêm! -1 all stats (10%)",
      weight: 10,
      isSuccess: true,
      color: "#818cf8",
    },
    {
      label: "Bình thường (90%)",
      weight: 90,
      isSuccess: false,
      color: "#6b7280",
    },
  ],
  "Open-minded": [
    {
      label: "Thành Lover! (33%)",
      weight: 33,
      isSuccess: true,
      color: "#f472b6",
    },
    { label: "Không (67%)", weight: 67, isSuccess: false, color: "#6b7280" },
  ],
  Affection: [
    {
      label: "Make Love! (69%)",
      weight: 69,
      isSuccess: true,
      color: "#f472b6",
    },
    { label: "Không (31%)", weight: 31, isSuccess: false, color: "#6b7280" },
  ],
};
