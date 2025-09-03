import { WheelStep } from "../Types/Types.ts";

import {
  farmerWheel,
  summonWheel,
  tricksterWheel,
  wibuWheel,
} from "./ArchetypeExtraWheels.ts";

export const archetypeExtraWheels: Record<string, WheelStep> = {
  Farmer: farmerWheel,
  Trickster: tricksterWheel,
  Wibu: wibuWheel,
  Summoner: summonWheel,
};
