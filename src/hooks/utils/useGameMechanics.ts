import { useCallback } from "react";
import { gearWheel } from "@/Common/Config/GearConfig.ts";

// Types for game mechanics
interface EnchantProgress {
  current: number;
  total: number;
  collected: number;
  enchantNames: string[];
}

interface WeaponAnalysis {
  tags: string[];
  isMagic: boolean;
  isPhysical: boolean;
  hasBothTypes: boolean;
  usableRate: number;
  specialRules: string[];
}

interface PowerCalculation {
  basePowerCount: number;
  archetypeBonus: number;
  raceBonus: number;
  finalPowerCount: number;
  sources: string[];
}

interface ItemUsabilityCheck {
  itemName: string;
  baseUsableRate: number;
  modifiedUsableRate: number;
  modifiers: Array<{
    source: string;
    modifier: number;
    description: string;
  }>;
}

export const useGameMechanics = () => {
  // Helper function to get enchant progress info
  const getEnchantProgress = useCallback(
    (
      characterState: any,
      enchantStep: number,
      enchantCount: number
    ): EnchantProgress => {
      const currentEnchants = JSON.parse(
        characterState.results["temp-weapon-enchants"] || "[]"
      );

      return {
        current: enchantStep,
        total: enchantCount,
        collected: currentEnchants.length,
        enchantNames: currentEnchants.map((e: any) => e.name),
      };
    },
    []
  );

  // Get gears by specific tag
  const getGearsByTag = useCallback((tag: string) => {
    return gearWheel.sections.filter(
      (gear: any) =>
        gear.description?.toLowerCase().includes(tag.toLowerCase()) ||
        gear.tags?.includes(tag)
    );
  }, []);

  // Extract weapon tags from description
  const getWeaponTags = useCallback((weapon: any): string[] => {
    const tags = [];
    const description = weapon.description?.toLowerCase() || "";

    if (description.includes("magic")) tags.push("Magic");
    if (description.includes("physical")) tags.push("Physical");
    if (description.includes("ranged")) tags.push("Ranged");
    if (description.includes("melee")) tags.push("Melee");
    if (description.includes("holy")) tags.push("Holy");
    if (description.includes("dark")) tags.push("Dark");
    if (description.includes("elemental")) tags.push("Elemental");

    return tags;
  }, []);

  // Analyze weapon properties
  const analyzeWeapon = useCallback(
    (weapon: any): WeaponAnalysis => {
      const tags = getWeaponTags(weapon);
      const isMagic = tags.includes("Magic");
      const isPhysical = tags.includes("Physical");
      const hasBothTypes = isMagic && isPhysical;

      const specialRules = [];
      if (hasBothTypes) {
        specialRules.push("Weapon has both Magic and Physical properties");
        specialRules.push("Eligible for Noble Swordsman dual bonus");
      }
      if (isMagic && !isPhysical) {
        specialRules.push("Pure Magic weapon - eligible for Magic gear bonus");
      }
      if (isPhysical && !isMagic) {
        specialRules.push(
          "Pure Physical weapon - eligible for Physical gear bonus"
        );
      }

      return {
        tags,
        isMagic,
        isPhysical,
        hasBothTypes,
        usableRate: weapon.usableRate || 100,
        specialRules,
      };
    },
    [getWeaponTags]
  );

  // Calculate power count with all modifiers
  const calculatePowerCount = useCallback(
    (basePowerCount: number, characterState: any): PowerCalculation => {
      let archetypeBonus = 0;
      let raceBonus = 0;
      const sources = [`Base: ${basePowerCount}`];

      // Check for Dark Magician archetype bonus
      const hasDarkMagician = characterState.archetypes.some(
        (a: any) => a.name === "Dark Magician"
      );
      if (hasDarkMagician) {
        archetypeBonus += 2;
        sources.push("Dark Magician: +2");
      }

      // Add future race bonuses here
      // Currently no race-specific power bonuses implemented

      const finalPowerCount = basePowerCount + archetypeBonus + raceBonus;

      return {
        basePowerCount,
        archetypeBonus,
        raceBonus,
        finalPowerCount,
        sources,
      };
    },
    []
  );

  // Calculate item usability with modifiers
  const calculateItemUsability = useCallback(
    (item: any, characterState: any): ItemUsabilityCheck => {
      const baseUsableRate = item.usableRate || 100;
      let modifiedUsableRate = baseUsableRate;
      const modifiers: [] = [];

      // Add archetype modifiers
      characterState.archetypes.forEach((archetype: any) => {
        // Example: Some archetypes might modify usability rates
        // This can be expanded based on game rules
      });

      // Add race modifiers
      const race = characterState.results.race;
      // Example: Some races might have better/worse item compatibility
      // This can be expanded based on game rules

      // Ensure usability rate stays within 0-100 range
      modifiedUsableRate = Math.max(0, Math.min(100, modifiedUsableRate));

      return {
        itemName: item.name,
        baseUsableRate,
        modifiedUsableRate,
        modifiers,
      };
    },
    []
  );

  // Check if character meets requirements for specific mechanics
  const checkRequirements = useCallback(
    (requirement: string, characterState: any): boolean => {
      const { results, stats, archetypes, quirks } = characterState;

      switch (requirement) {
        case "noble-swordsman-weapon-gear-bonus":
          return archetypes.some((a: any) => a.name === "Noble Swordsman");

        case "vampire-unique-taste":
          return (
            results.race === "Vampire" &&
            results.uniqueVampireTrain === "Có Khẩu vị độc đáo"
          );

        case "skeleton-iq-bypass":
          return results.race === "Skeleton";

        case "uma-tracen-academy":
          return results.race === "Uma";

        case "angel-pacifist-auto":
          return results.race === "Angel";

        case "dark-magician-power-bonus":
          return archetypes.some((a: any) => a.name === "Dark Magician");

        case "bloodclan-berserker-auto-quirks":
          return archetypes.some((a: any) => a.name === "Bloodclan Berserker");

        case "npc-skip-chardev":
          return archetypes.some((a: any) => a.name === "NPC 💀");

        default:
          return false;
      }
    },
    []
  );

  // Calculate character combat stats with all modifiers
  const calculateCombatStats = useCallback((characterState: any) => {
    const baseStats = { ...characterState.stats };
    const modifiers = {
      strength: 0,
      speed: 0,
      durability: 0,
      iq: 0,
      battleIQ: 0,
      martialArts: 0,
    };

    // Apply quirk modifiers
    characterState.quirks.forEach((quirk: any) => {
      switch (quirk.name) {
        case "Bloodthirsty":
          modifiers.martialArts += 1;
          break;
        // Add more quirk modifiers as needed
      }
    });

    // Apply archetype modifiers
    characterState.archetypes.forEach((archetype: any) => {
      // Add archetype stat modifiers here
    });

    // Apply gear modifiers
    characterState.gears.forEach((gear: any) => {
      if (gear.usable) {
        // Add gear stat modifiers here based on gear effects
      }
    });

    // Calculate final stats
    const finalStats = Object.keys(baseStats).reduce((acc, statKey) => {
      const baseStat = parseInt(baseStats[statKey]) || 0;
      const modifier = modifiers[statKey as keyof typeof modifiers] || 0;
      acc[statKey] = Math.max(1, baseStat + modifier); // Minimum stat of 1
      return acc;
    }, {} as Record<string, number>);

    return {
      baseStats,
      modifiers,
      finalStats,
    };
  }, []);

  // Get character's special abilities summary
  const getSpecialAbilities = useCallback((characterState: any): string[] => {
    const abilities = [];

    // Check for archetype abilities
    characterState.archetypes.forEach((archetype: any) => {
      switch (archetype.name) {
        case "Warrior of Sunlight":
          abilities.push("Sacred Fire: +1 all stats vs Vampire/Demon");
          abilities.push("Fair Duel: Immune to stat debuffs from opponents");
          break;
        case "Noble Swordsman":
          abilities.push("Enhanced weapon-gear synergy");
          break;
        case "Knight of Gods":
          abilities.push("Holy Symbol against unholy creatures");
          break;
        case "Bloodclan Berserker":
          abilities.push("Cruelty: Coin flip for tied rounds");
          abilities.push("Bloodthirsty: +1 MA, bonus/penalty point mechanics");
          break;
        case "Dark Magician":
          abilities.push("Extra power rolls (+2)");
          break;
        case "Spy":
          abilities.push(
            `Target: ${characterState.results["house-spy-target"] || "Unknown"}`
          );
          break;
      }
    });

    // Check for race abilities
    switch (characterState.results.race) {
      case "Skeleton":
        abilities.push("IQ locked at 1");
        break;
      case "Angel":
        abilities.push("Pacifist archetype");
        break;
      case "Vampire":
        if (characterState.results.vampireTaste) {
          abilities.push(
            `Unique taste: ${characterState.results.vampireTaste}`
          );
        }
        break;
    }

    // Check for quirk abilities
    characterState.quirks.forEach((quirk: any) => {
      if (quirk.description) {
        abilities.push(`${quirk.name}: ${quirk.description}`);
      }
    });

    return abilities;
  }, []);

  // Validate character build for potential conflicts
  const validateCharacterBuild = useCallback(
    (characterState: any): string[] => {
      const warnings = [];

      // Check for stat conflicts
      const stats = characterState.stats;
      if (
        stats.iq &&
        parseInt(stats.iq) > 1 &&
        characterState.results.race === "Skeleton"
      ) {
        warnings.push("Skeleton should have IQ = 1");
      }

      // Check for archetype conflicts
      const archetypeNames = characterState.archetypes.map((a: any) => a.name);
      if (
        archetypeNames.includes("Pacifist") &&
        archetypeNames.includes("Bloodclan Berserker")
      ) {
        warnings.push(
          "Pacifist and Bloodclan Berserker archetypes may conflict"
        );
      }

      // Check for house conflicts
      const house = characterState.results.house;
      if (house === "Tracen Academy" && characterState.results.race !== "Uma") {
        warnings.push("Tracen Academy is typically for Uma race only");
      }

      // Check for gear-weapon synergy opportunities
      const hasNobleSwordsman = archetypeNames.includes("Noble Swordsman");
      if (hasNobleSwordsman && characterState.weapons.length === 0) {
        warnings.push("Noble Swordsman should have weapons for synergy");
      }

      return warnings;
    },
    []
  );

  // Calculate experience/progression points
  const calculateProgressionPoints = useCallback(
    (characterState: any): number => {
      let points = 0;

      // Base points for completion
      points += 10;

      // Bonus for stats
      Object.values(characterState.stats).forEach((stat: any) => {
        const statValue = parseInt(stat) || 0;
        points += statValue;
      });

      // Bonus for items
      points += characterState.gears.length * 2;
      points += characterState.legacyGears.length * 5;
      points += characterState.weapons.length * 3;
      points += characterState.enchants.length * 1;

      // Bonus for powers
      points += characterState.powers.length * 4;

      // Bonus for quirks
      points += characterState.quirks.length * 2;

      return points;
    },
    []
  );

  return {
    getEnchantProgress,
    getGearsByTag,
    getWeaponTags,
    analyzeWeapon,
    calculatePowerCount,
    calculateItemUsability,
    checkRequirements,
    calculateCombatStats,
    getSpecialAbilities,
    validateCharacterBuild,
    calculateProgressionPoints,
  };
};
