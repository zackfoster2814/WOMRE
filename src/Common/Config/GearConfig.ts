import { get } from "lodash";
import { WheelStep } from "../Types/Types";

export const gearCountWheel: WheelStep = {
  key: "gear-count",
  title: "Gear Count",
  sections: [
    {
      id: "g0",
      name: "0 Gear",
      weight: 20,
      color: "#CCCCCC",
      description: "Không nhận gear.",
    },
    {
      id: "g1",
      name: "1 Gear",
      weight: 30,
      color: "#A2D149",
      description: "Nhận 1 gear.",
    },
    {
      id: "g2",
      name: "2 Gear",
      weight: 25,
      color: "#FFD700",
      description: "Nhận 2 gear.",
    },
    {
      id: "g3",
      name: "3 Gear",
      weight: 15,
      color: "#87CEEB",
      description: "Nhận 3 gear.",
    },
    {
      id: "g4",
      name: "4 Gear",
      weight: 10,
      color: "#FF69B4",
      description: "Nhận 4 gear.",
    },
  ],
};

export const legacyGearCountWheel: WheelStep = {
  key: "legacy-gear-count",
  title: "Legacy Gear Count",
  sections: [
    {
      id: "lg0",
      name: "0 Legacy",
      weight: 88,
      color: "#CCCCCC",
      description: "Không nhận legacy gear.",
    },
    {
      id: "lg1",
      name: "1 Legacy",
      weight: 12,
      color: "#FFD700",
      description: "Nhận 1 legacy gear.",
    },
  ],
};

const getRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}
export async function getGearsbyLegacy(id: number): Promise<WheelStep> {
  const Gears = window.api ? await window.api.fetchGearByLegacy(id) : [];

  if (!Gears || Gears.length === 0) {
    return {
      key: id === 0 ? 'gear' : 'legacy-gear',
      title: id === 0 ? 'Gear' : 'Legacy Gear',
      sections: []
    };
  }

  const sections = Gears.map((data: any) => {
    const gearsData = data.dataValues || data;
    return {
      id: gearsData.id,
      name: gearsData.name,
      effect: gearsData.effect,
      type: gearsData.type,
      is_special: gearsData.is_special,
      note: gearsData.note,
      usage_percentage: gearsData.usage_percentage,
      color: getRandomColor(),
      weight: gearsData.weight || 1,
    };
  });

  return {
    key: id === 0 ? 'gear' : 'legacy-gear',
    title: id === 0 ? 'Gear' : 'Legacy Gear',
    sections
  };
}

// Initialize as empty wheels - will be populated when needed
export let gearWheel: WheelStep = {
  key: 'gear',
  title: 'Gear',
  sections: []
};

export let legacyGearWheel: WheelStep = {
  key: 'legacy-gear',
  title: 'Legacy Gear',
  sections: []
};

// Initialize gears on module load
(async () => {
  gearWheel = await getGearsbyLegacy(0);
  legacyGearWheel = await getGearsbyLegacy(1);
})();