import { WheelStep } from "../Types/Types";

import {
  farmerWheel,
  summonWheel,
  tricksterWheel,
  wibuWheel,
} from "./ArchetypeExtraWheels";

export const archetypeExtraWheels: Record<string, WheelStep> = {
  Farmer: farmerWheel,
  Trickster: tricksterWheel,
  Wibu: wibuWheel,
  Summoner: summonWheel,
};
