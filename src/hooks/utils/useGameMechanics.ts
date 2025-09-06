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
  bonus: number;
  finalPowerCount: number;
  sources: string[];
}
interface CharDevCalculation {
  baseCharDevCount: number;
  bonus: number;
  finalPowerCount: number;
  sources: string[];
}

interface QuirkCalculation {
  baseQuirkCount: number;
  bonus: number;
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

interface ExtraGearCalculation {
  baseCount: number;
  bonusCount: number;
  finalCount: number;
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

  // Calculate extra gear bonuses based on character conditions
  const calculateExtraGear = useCallback(
    (baseGearCount: number, characterState: any): number => {
      let extraGearBonus = 0;
      console.log(characterState);

      if (
        characterState.results.race === "Goblin" &&
        characterState.results.subrace === "Goblin (5000)"
      ) {
        extraGearBonus++;
      }
      const isBlacksmith = characterState.archetypes.some(
        (archetype: any) => archetype.name === "Blacksmith"
      );
      if (isBlacksmith) {
        extraGearBonus += 2;
      }

      const isHouseLannister =
        characterState.results.house === "House Lannister";
      if (isHouseLannister) {
        extraGearBonus += 2;
      }
      const finalGearCount = Math.max(0, baseGearCount + extraGearBonus);

      return finalGearCount;
    },
    []
  );

  // Helper function for the simple interface
  const extraGear = useCallback(
    (baseGearCount: number, characterState: any): number => {
      return calculateExtraGear(baseGearCount, characterState);
    },
    [calculateExtraGear]
  );

  // Calculate power count with all modifiers
  const calculatePowerCount = useCallback(
    (basePowerCount: number, characterState: any): PowerCalculation => {
      let bonus = 0;
      const sources = [`Base: ${basePowerCount}`];

      // Check for Dark Magician archetype bonus
      const hasDarkMagician = characterState.archetypes.some(
        (a: any) => a.name === "Dark Magician"
      );
      if (hasDarkMagician) {
        bonus += 2;
        sources.push("Dark Magician: +2");
      }

      const elfSubraces = [
        "Wood Elf",
        "Sea Elf",
        "Moon Elf",
        "Sun Elf",
        "Star Elf",
      ];
      const isElf = elfSubraces.includes(characterState.results.subrace);

      if (isElf) {
        bonus++;
        sources.push(`${characterState.results.subrace}: +1`);
      }

      const isWeresheep = characterState.results.subrace === "Weresheep";
      if (isWeresheep) {
        bonus++;
        sources.push(`Weresheep: +1`);
      }

      const isAmethystDragon =
        characterState.results.subrace === "Amethyst Dragon";
      if (isAmethystDragon) {
        bonus += 5;
        sources.push(`Amethyst Dragon: +5`);
      }
      const dragonSubraces = [
        "Wood Elf",
        "Sea Elf",
        "Moon Elf",
        "Sun Elf",
        "Star Elf",
      ];
      const isDragonSub = dragonSubraces.includes(
        characterState.results.subrace
      );
      if (isDragonSub) {
        bonus++;
        sources.push(`${characterState.results.subrace}: +1`);
      }

      const isDominions = characterState.results.subrace === "Dominions";
      if (isDominions) {
        bonus += 2;
        sources.push(`${characterState.results.subrace}: +2`);
      }

      const isGodArtsandMagic =
        characterState.results.subrace === "Arts and Magic";
      if (isGodArtsandMagic) {
        bonus++;
        sources.push(`${characterState.results.subrace}: +1`);
      }

      const isZeus = characterState.results.subrace === "Zeus";
      if (isZeus) {
        bonus += 3;
        sources.push(`${characterState.results.subrace}: +3`);
      }
      const isPoseidon = characterState.results.subrace === "Poseidon";
      if (isPoseidon) {
        bonus += 2;
        sources.push(`${characterState.results.subrace}: +2`);
      }
      const isDemeter = characterState.results.subrace === "Demeter";
      if (isDemeter) {
        bonus += 3;
        sources.push(`${characterState.results.subrace}: +3`);
      }
      const isAres = characterState.results.subrace === "Ares";
      if (isAres) {
        bonus += 2;
        sources.push(`${characterState.results.subrace}: +2`);
      }

      const isHestia = characterState.results.subrace === "Hestia";
      if (isHestia) {
        bonus++;
        sources.push(`${characterState.results.subrace}: +1`);
      }

      const isHouseCaria = characterState.results.house === "House Caria";
      if (isHouseCaria) {
        bonus += 2;
        sources.push(`House Caria: +2`);
      }

      const isGoldenOrder = characterState.results.house === "Golden Order";
      if (isGoldenOrder) {
        bonus++;
        sources.push(`Golden Order: +1`);
      }

      const isWinterhold =
        characterState.results.house === "College of Winterhold";
      if (isWinterhold) {
        bonus++;
        sources.push(`Golden Order: +1`);
      }

      const finalPowerCount = Number(basePowerCount) + Number(bonus);

      return {
        basePowerCount,
        bonus,
        finalPowerCount,
        sources,
      };
    },
    []
  );

  const calculateQuirkCount = useCallback(
    (baseQuirkCount: number, characterState: any): QuirkCalculation => {
      let bonus = 0;
      const sources = [`Base: ${baseQuirkCount}`];

      const isZephyrianDragon =
        characterState.results.subrace === "Zephyrian Dragon";
      if (isZephyrianDragon) {
        bonus++;
        sources.push(`Zephyrian Dragon: +1`);
      }

      const isChaosDragon = characterState.results.subrace === "Chaos Dragon";
      if (isChaosDragon) {
        bonus += 3;
        sources.push(`Chaos Dragon: +1`);
      }

      const finalPowerCount = Number(baseQuirkCount) + Number(bonus);

      return {
        baseQuirkCount,
        bonus,
        finalPowerCount,
        sources,
      };
    },
    []
  );

  const calculateChardevCount = useCallback(
    (baseCharDevCount: number, characterState: any): CharDevCalculation => {
      let bonus = 0;
      const sources = [`Base: ${baseCharDevCount}`];

      const ishuman = characterState.results.race === "Human";
      if (ishuman) {
        bonus++;
        sources.push("Human: +1");
      }

      const isWereseal = characterState.results.subrace === "Wereseal";

      if (isWereseal) {
        bonus++;
        sources.push("Wereseal: +1");
      }

      const isIceDragon = characterState.results.subrace === "Ice Dragon";
      if (isIceDragon) {
        bonus++;
        sources.push("Ice Dragon: +1");
      }

      const finalPowerCount = Number(baseCharDevCount) + Number(bonus);

      return {
        baseCharDevCount,
        bonus,
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

        case "goblin-5000-extra-gear":
          return results.subrace === "Goblin (5000)";

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

    // Check for subrace abilities
    switch (characterState.results.subrace) {
      case "Goblin (5000)":
        abilities.push("Extra gear bonus (+1)");
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
    // Extra gear functions
    extraGear,
    calculateExtraGear,

    // Existing functions
    getEnchantProgress,
    getGearsByTag,
    getWeaponTags,
    analyzeWeapon,
    calculatePowerCount,
    calculateItemUsability,
    checkRequirements,
    calculateCombatStats,
    calculateChardevCount,
    calculateQuirkCount,
    getSpecialAbilities,
    validateCharacterBuild,
    calculateProgressionPoints,
  };
};
