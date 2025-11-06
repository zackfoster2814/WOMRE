// ArchetypeExtraWheels.ts
import { Section, WheelStep } from "@/Common/Types/Types";

const getRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

// Extra Archetypes by Id Wheel
export async function getExtraArchetypeById(id: number): Promise<Section | null> {
  const  ExtraArchetype = await window.api.fetchExtraArchetypeById(id);
  if (!ExtraArchetype) {
    return null;
  }
  
  return ExtraArchetype.map((data: any) => {
    const ExtraArchetypeData = data.dataValues;
    return {
      id: ExtraArchetypeData.id,
      name: ExtraArchetypeData.name,
      archetype_id: ExtraArchetypeData.archetype_id,
      weight: ExtraArchetypeData.weight,
      effect: ExtraArchetypeData.effect,
      color: getRandomColor(),
    };
  });
}

export const archetypeExtraWheels: Record<string, WheelStep> = {
  Farmer:   getExtraArchetypeById(1),
  Trickster: getExtraArchetypeById(2),
  Wibu:   getExtraArchetypeById(3),
  Summoner:   getExtraArchetypeById(4),
  Instrument:  getExtraArchetypeById(5),
  HeroX: getExtraArchetypeById(6),
  Stands:   getExtraArchetypeById(7),
  Haki:   getExtraArchetypeById(8),
  DomainExpansion:  getExtraArchetypeById(9),
  Dojutsu:  getExtraArchetypeById(10),
  VampireTaste:   getExtraArchetypeById(11),
  Sentence:   getExtraArchetypeById(12),
  Bankai:   getExtraArchetypeById(13),
};
