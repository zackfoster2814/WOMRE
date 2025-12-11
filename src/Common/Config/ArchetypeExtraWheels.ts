// ArchetypeExtraWheels.ts
import { Section, WheelStep } from "@/Common/Types/Types.js";

const getRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

// Extra Archetypes by Id Wheel
export async function getExtraArchetypeById(id: number): Promise<Section[]> {
  const ExtraArchetype = window.api ? await window.api.fetchExtraArchetypeById(id) : [];

  if (!ExtraArchetype || ExtraArchetype.length === 0) {
    return [];
  }
  
    return [{
      id: ExtraArchetype.dataValues.id,
      name: ExtraArchetype.dataValues.name,
      archetype_id: ExtraArchetype.dataValues.archetype_id,
      weight: ExtraArchetype.dataValues.weight,
      effect: ExtraArchetype.dataValues.effect,
      color: getRandomColor(),
  }];
} 


// Export individual wheels as placeholders
// These will be populated dynamically at runtime
export const heroXWheel: WheelStep = {
  key: "hero_x",
  title: "Hero X",
  sections: []
};

export const vampireTasteWheel: WheelStep = {
  key: "vampire_taste",
  title: "Vampire Taste",
  sections: []
};

export const uniqueVampireTrainWheel: WheelStep = {
  key: "unique_vampire_train",
  title: "Unique Vampire Train",
  sections: []
};

export const archetypeExtraWheels: Record<string, Promise<Section[]>> = {
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

// Helper function to initialize wheels dynamically
export async function initializeExtraWheels() {
  heroXWheel.sections = await getExtraArchetypeById(6);
  vampireTasteWheel.sections = await getExtraArchetypeById(11);
  // uniqueVampireTrainWheel can be populated if needed
}
