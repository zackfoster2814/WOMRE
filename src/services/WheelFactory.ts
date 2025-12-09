/**
 * WheelFactory Service
 * Dynamic wheel creation with lazy loading
 */

import { WheelStep, Section } from '@/Common/Types/Types';
import {
  fetchRaces,
  fetchSubraces,
  fetchArchetypes,
  fetchPowers,
  fetchGearsByLegacy,
  fetchHouses,
  fetchWeapons,
  fetchEnchants,
  fetchQuirks,
  fetchCharDevs,
  fetchPvE,
  fetchPlayers
} from './ApiService';

/**
 * Helper: Generate random color
 */
function getRandomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Helper: Extract clean data from Sequelize object
 */
function extractData(obj: any): any {
  return obj._dataValues || obj.dataValues || obj;
}

/**
 * WheelFactory class
 */
export class WheelFactory {
  /**
   * Create Race wheel
   */
  static async createRaceWheel(): Promise<WheelStep> {
    const races = await fetchRaces();

    return {
      key: 'race',
      title: 'Race',
      sections: races.map((race: any) => {
        const data = extractData(race);
        return {
          id: data.id,
          name: data.name,
          weight: data.weight,
          color: getRandomColor(),
          trait: data.trait,
          subrace: data.subrace_wheel,
          note: data.note
        };
      })
    };
  }

  /**
   * Create Subrace wheel for a specific race
   */
  static async createSubraceWheel(raceName: string): Promise<WheelStep> {
    const allSubraces = await fetchSubraces();

    // Build subraceMap grouped by race_id
    const subracesByRaceId: Record<number, Section[]> = {};

    allSubraces.forEach((subrace: any) => {
      const data = extractData(subrace);
      const raceId = data.race_id;

      if (!subracesByRaceId[raceId]) {
        subracesByRaceId[raceId] = [];
      }

      subracesByRaceId[raceId].push({
        id: data.id,
        name: data.name,
        trait: data.trait,
        weight: data.weight,
        color: getRandomColor()
      });
    });

    // Find race_id for this raceName
    const races = await fetchRaces();
    const race = races.find((r: any) => extractData(r).name === raceName);

    if (!race) {
      console.warn(`[WheelFactory] Race not found: ${raceName}`);
      return {
        key: 'subrace',
        title: 'Subrace',
        sections: []
      };
    }

    const raceId = extractData(race).id;
    const sections = subracesByRaceId[raceId] || [];

    return {
      key: 'subrace',
      title: `${raceName} Subrace`,
      sections
    };
  }

  /**
   * Create Archetype wheel
   */
  static async createArchetypeWheel(): Promise<WheelStep> {
    const archetypes = await fetchArchetypes();

    return {
      key: 'archetype',
      title: 'Archetype',
      sections: archetypes.map((archetype: any) => {
        const data = extractData(archetype);
        return {
          id: data.id,
          name: data.name,
          weight: data.weight,
          color: getRandomColor(),
          extraWheel: data.extra_wheel,
          description: data.description
        };
      })
    };
  }

  /**
   * Create Power wheel
   */
  static async createPowerWheel(): Promise<WheelStep> {
    const powers = await fetchPowers();

    return {
      key: 'power',
      title: 'Power',
      sections: powers.map((power: any) => {
        const data = extractData(power);
        return {
          id: data.id,
          name: data.name,
          effect: data.effect,
          weight: data.weight || 1,
          color: getRandomColor(),
          note: data.note
        };
      })
    };
  }

  /**
   * Create Gear wheel (normal or legacy)
   */
  static async createGearWheel(isLegacy: boolean = false): Promise<WheelStep> {
    const gears = await fetchGearsByLegacy(isLegacy ? 1 : 0);

    return {
      key: isLegacy ? 'legacy-gear' : 'gear',
      title: isLegacy ? 'Legacy Gear' : 'Gear',
      sections: gears.map((gear: any) => {
        const data = extractData(gear);
        return {
          id: data.id,
          name: data.name,
          effect: data.effect,
          type: data.type,
          weight: data.weight || 1,
          color: getRandomColor(),
          usableRate: data.usable_rate,
          note: data.note
        };
      })
    };
  }

  /**
   * Create House wheel
   */
  static async createHouseWheel(): Promise<WheelStep> {
    const houses = await fetchHouses();

    return {
      key: 'house',
      title: 'House',
      sections: houses.map((house: any) => {
        const data = extractData(house);
        return {
          id: data.id,
          name: data.name,
          weight: data.weight,
          color: getRandomColor(),
          description: data.description
        };
      })
    };
  }

  /**
   * Create Weapon wheel
   */
  static async createWeaponWheel(): Promise<WheelStep> {
    const weapons = await fetchWeapons();

    return {
      key: 'weapon',
      title: 'Weapon',
      sections: weapons.map((weapon: any) => {
        const data = extractData(weapon);
        return {
          id: data.id,
          name: data.name,
          weight: data.weight || 1,
          color: getRandomColor(),
          description: data.description,
          usableRate: data.usable_rate,
          tag: data.tag
        };
      })
    };
  }

  /**
   * Create Enchant wheel
   */
  static async createEnchantWheel(): Promise<WheelStep> {
    const enchants = await fetchEnchants();

    return {
      key: 'weapon-enchant',
      title: 'Weapon Enchant',
      sections: enchants.map((enchant: any) => {
        const data = extractData(enchant);
        return {
          id: data.id,
          name: data.name,
          effect: data.effect,
          weight: data.weight || 1,
          color: getRandomColor()
        };
      })
    };
  }

  /**
   * Create Quirk wheel
   */
  static async createQuirkWheel(): Promise<WheelStep> {
    const quirks = await fetchQuirks();

    return {
      key: 'quirk',
      title: 'Quirk',
      sections: quirks.map((quirk: any) => {
        const data = extractData(quirk);
        return {
          id: data.id,
          name: data.name,
          weight: data.weight,
          color: getRandomColor(),
          description: data.description
        };
      })
    };
  }

  /**
   * Create Character Development wheel
   */
  static async createCharDevWheel(): Promise<WheelStep> {
    const charDevs = await fetchCharDevs();

    return {
      key: 'char-dev',
      title: 'Character Development',
      sections: charDevs.map((charDev: any) => {
        const data = extractData(charDev);
        return {
          id: data.id,
          name: data.name,
          weight: data.weight,
          color: getRandomColor(),
          description: data.description
        };
      })
    };
  }

  /**
   * Create PvE wheel
   */
  static async createPvEWheel(): Promise<WheelStep> {
    const pveRounds = await fetchPvE();

    return {
      key: 'pve',
      title: 'PvE Round',
      sections: pveRounds.map((pve: any) => {
        const data = extractData(pve);
        return {
          id: data.id,
          name: data.name,
          weight: data.weight,
          color: getRandomColor(),
          description: data.description
        };
      })
    };
  }

  /**
   * Create Player wheel
   */
  static async createPlayerWheel(): Promise<WheelStep> {
    const players = await fetchPlayers();

    return {
      key: 'player',
      title: 'Player Selection',
      sections: players.map((player: any) => {
        const data = extractData(player);
        return {
          id: data.id,
          name: data.name,
          weight: 1,
          color: getRandomColor()
        };
      })
    };
  }

  /**
   * Create filtered wheel (remove already selected items)
   */
  static createFilteredWheel(
    baseWheel: WheelStep,
    excludeNames: string[]
  ): WheelStep {
    return {
      ...baseWheel,
      sections: baseWheel.sections.filter(
        section => !excludeNames.includes(section.name)
      )
    };
  }

  /**
   * Create count wheel (generic)
   */
  static createCountWheel(
    key: string,
    title: string,
    options: Array<{ count: number; weight: number; color: string; description: string }>
  ): WheelStep {
    return {
      key,
      title,
      sections: options.map((opt, idx) => ({
        id: `${key}-${idx}`,
        name: `${opt.count}`,
        weight: opt.weight,
        color: opt.color,
        description: opt.description
      }))
    };
  }

  /**
   * Create usability check wheel
   */
  static createUsabilityWheel(usableRate: number, itemName: string): WheelStep {
    const unusableRate = 100 - usableRate;

    return {
      key: 'usabilityCheck',
      title: `${itemName} - Usability Check`,
      sections: [
        {
          id: 'usable',
          name: 'Usable',
          weight: usableRate,
          color: '#4CAF50',
          description: `${usableRate}% chance to be usable`
        },
        {
          id: 'unusable',
          name: 'Unusable',
          weight: unusableRate,
          color: '#f44336',
          description: `${unusableRate}% chance to be unusable`
        }
      ]
    };
  }

  /**
   * Get subrace map (organized by race name)
   */
  static async getSubraceMap(): Promise<Record<string, Section[]>> {
    const allSubraces = await fetchSubraces();
    const races = await fetchRaces();

    // Build map: race_id -> race_name
    const raceIdToName: Record<number, string> = {};
    races.forEach((race: any) => {
      const data = extractData(race);
      raceIdToName[data.id] = data.name;
    });

    // Group subraces by race name
    const subraceMap: Record<string, Section[]> = {};

    allSubraces.forEach((subrace: any) => {
      const data = extractData(subrace);
      const raceName = raceIdToName[data.race_id];

      if (!raceName) return;

      if (!subraceMap[raceName]) {
        subraceMap[raceName] = [];
      }

      subraceMap[raceName].push({
        id: data.id,
        name: data.name,
        trait: data.trait,
        weight: data.weight,
        color: getRandomColor()
      });
    });

    return subraceMap;
  }
}
