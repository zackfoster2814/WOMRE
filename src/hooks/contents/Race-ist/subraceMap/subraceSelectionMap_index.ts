import { useCallback } from "react";
import { WheelStep } from "@/Common/Types/Types";
import { raceConfig, raceWheel } from "@/Common/Config/RaceConfig";
import { subraceMap } from "@/Common/Config/SubRaceConfig";
import {
  uniqueVampireTrainWheel,
  vampireTasteWheel,
} from "@/Common/Config/ArchetypeExtraWheels";
import {
  getStatWheel,
  getRaceOrSubrace,
  STAT_WHEELS,
} from "@/utils/wheelUtils";
import { playerWheel } from "@/Common/Config/PlayerConfig";
import { houseWheel } from "@/Common/Config/HouseConfig";
import { archetypeWheel, summonWheel } from "@/Common/Config/ArchetypeConfig";
import { WereBeastSubrace } from "./wereBeastSubraceMap.ts";
import { VampireSubrace } from "./vampireSubrace.ts";
import { GoblinSubrace } from "./goblinSubrace.ts";
import { ElfSubrace } from "./elfSubrace.ts";
import { DragonSubrace } from "./dragonSubrace.ts";
import { AngleSubrace } from "./AngleSubrace.ts";
import { DemigodSubrace } from "./DemigodSubrace.ts";
import { DemonSubrace } from "./demonSubrace.ts";
import { GodSubrace } from "./godSubrace.ts";
import { PrimordialBeingSubrace } from "./primordialbeingSubrace.ts";


export const subraceSelectionMap:any = {
  Vampire: VampireSubrace,
  Goblin: GoblinSubrace,
  Elf: ElfSubrace,
  WereBeast: WereBeastSubrace,
  Dragon: DragonSubrace,
  Angle: AngleSubrace,
  "Demi-God":DemigodSubrace,
  Demon:DemonSubrace,
  God:GodSubrace,
  "Primordial Being":PrimordialBeingSubrace,
};
