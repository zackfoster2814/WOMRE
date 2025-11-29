/**
 * Wheel Utilities (REFACTORED)
 */

import { WheelStep } from "@/Common/Types/Types";
import { WheelFactory } from "@/services/WheelFactory";

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

/**
 * Get stat wheel by key and race
 * Note: Stat wheels are still using old config system (StrengthConfig, SpeedConfig, etc)
 * TODO: Refactor stat configs to use WheelFactory if needed
 */
export const getStatWheel = async (race: string, key: string): Promise<WheelStep | null> => {
  // Import dynamically to avoid circular dependencies
  const { getStrengthWheel } = await import("@/Common/Config/StrengthConfig");
  const { getSpeedWheel } = await import("@/Common/Config/SpeedConfig");
  const { getDurabilityWheel } = await import("@/Common/Config/DurabilityConfig");
  const { getIQWheel } = await import("@/Common/Config/IQConfig");
  const { getBattleIQWheel } = await import("@/Common/Config/BattleIQConfig");
  const { getMartialArtsWheel } = await import("@/Common/Config/MartialArtConfig");

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

/**
 * Get race or subrace for wheel selection
 * Skeleton uses subrace, others use race
 */
export const getRaceOrSubrace = (results: Record<string, string>): string => {
  return results.race === "Skeleton" ? results.subrace : results.race;
};

/**
 * Create usability check wheel (REFACTORED to use WheelFactory)
 */
export const usabilityWheel = (
  usableRate: number,
  itemName: string
): WheelStep => {
  return WheelFactory.createUsabilityWheel(usableRate, itemName);
};
