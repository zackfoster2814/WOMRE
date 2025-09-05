import { WheelStep, Section } from "@/Common/Types/Types.ts";
import { getStrengthWheel } from "@/Common/Config/StrengthConfig.ts";
import { getDurabilityWheel } from "@/Common/Config/DurabilityConfig.ts";
import { getSpeedWheel } from "@/Common/Config/SpeedConfig.ts";
import { getBattleIQWheel } from "@/Common/Config/BattleIQConfig.ts";
import { getIQWheel } from "@/Common/Config/IQConfig.ts";
import { getMartialArtsWheel } from "@/Common/Config/MartialArtConfig.ts";

// Constants
export const CANVAS_SIZE = 600;
export const WHEEL_RADIUS_OFFSET = 20;
export const STAT_WHEELS = [
  "strength",
  "speed",
  "durability",
  "iq",
  "battleIQ",
  "martialArts",
];

// Utility functions
export const getStatWheel = (race: string, key: string): WheelStep | null => {
  const wheelGetters: Record<string, (race: string) => WheelStep> = {
    strength: getStrengthWheel,
    speed: getSpeedWheel,
    durability: getDurabilityWheel,
    iq: getIQWheel,
    battleIQ: getBattleIQWheel,
    martialArts: getMartialArtsWheel,
  };
  return wheelGetters[key]?.(race) || null;
};

export const getRaceOrSubrace = (results: Record<string, string>): string => {
  return results.race === "Skeleton" ? results.subrace : results.race;
};

export const usabilityWheel = (
  usableRate: number,
  itemName: string
): WheelStep => ({
  key: "usabilityCheck",
  sections: [
    {
      name: "Dùng được",
      weight: usableRate,
      id: "usable",
      color: "#10b981", // Green
    },
    {
      name: "Không dùng được",
      weight: 100 - usableRate,
      id: "not-usable",
      color: "#ef4444", // Red
    },
  ],
  title: `${itemName} - Kiểm tra khả năng sử dụng`,
});

// Helper để tính toán cached sections với angles
export const calculateCachedSections = (currentWheel: WheelStep) => {
  const totalWeight = currentWheel.sections.reduce(
    (sum, s) => sum + s.weight,
    0
  );
  let startAngle = 0;
  return currentWheel.sections.map((sec) => {
    const angleStep = (sec.weight / totalWeight) * 2 * Math.PI;
    const secWithAngles = {
      ...sec,
      startAngle,
      endAngle: startAngle + angleStep,
    };
    startAngle += angleStep;
    return secWithAngles;
  });
};

// Helper để xác định section nào được chọn từ góc
export const getLandedSection = (angle: number, cachedSections: any[]) => {
  const finalNormalized = ((angle % 360) + 360) % 360;
  const pointerDeg = (360 - finalNormalized) % 360;
  const pointerRad = (pointerDeg * Math.PI) / 180;

  let landed = cachedSections[0];
  for (const sec of cachedSections) {
    if (pointerRad >= sec.startAngle && pointerRad < sec.endAngle) {
      landed = sec;
      break;
    }
  }
  return landed;
};
