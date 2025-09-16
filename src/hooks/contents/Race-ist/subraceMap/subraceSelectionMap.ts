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
import { WereBeastSubrace } from "./wereBeastSubraceMap";
import { VampireSubrace } from "./vampireSubrace";
import { GoblinSubrace } from "./goblinSubrace";
import { ElfSubrace } from "./elfSubrace";
import { DragonSubrace } from "./dragonSubrace";
import { AngleSubrace } from "./AngleSubrace";
import { DemigodSubrace } from "./DemigodSubrace";
import { DemonSubrace } from "./demonSubrace";
import { GodSubrace } from "./godSubrace";
import { PrimordialBeingSubrace } from "./primordialbeingSubrace";


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
