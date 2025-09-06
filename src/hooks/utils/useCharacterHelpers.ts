import { useCallback } from "react";
import { exportCharacter } from "@/Common/exportCharacter.ts";

// Types for character helpers
interface CompleteCharacterInfo {
  name: string;
  race: string;
  subrace: string;
  archetype: string;
  stats: Record<string, string>;
  quirks: string[];
  house: string;
  gears: Array<{
    name: string;
    usable: boolean;
  }>;
  legacyGears: Array<{
    name: string;
    usable: boolean;
  }>;
  weapons: Array<{
    name: string;
    usable: boolean;
    enchants: any[];
  }>;
  enchants: string[];
  powers: string[];
  charDevs: string[];
  pve: string;
  // Additional archetype-specific results
  trickstersCard?: string;
  slayerRace?: string;
  demonSubrace?: string;
  maraisRace1?: string;
  maraisRace2?: string;
  goldenOrderRune?: string;
  starkWolf?: string;
  ashinaSword?: string;
  dessendreSkill?: string;
  houseSpyTarget?: string;
  // Uma parents
  umaParent1?: string;
  umaParent2?: string;
  // Vampire specific
  uniqueVampireTrain?: string;
  vampireTaste?: string;
  // Wibu series
  wibuSeries?: string;
}

interface CharacterSummary {
  name: string;
  race: string;
  archetype: string;
  level: string;
  itemCount: number;
  powerCount: number;
  completionPercentage: number;
  specialAbilities: any[];
  warnings: string[];
}

interface CharacterValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
}

interface ExportOptions {
  format: "json" | "txt" | "csv";
  includeMetadata: boolean;
  compressData: boolean;
  timestamp: boolean;
}

export const useCharacterHelpers = () => {
  // Get complete character information
  const getCompleteCharacterInfo = useCallback(
    (characterState: any): CompleteCharacterInfo => {
      return {
        name: characterState.characterName,
        race: characterState.results.race,
        subrace: characterState.results.subrace,
        archetype: characterState.archetypes.map((a: any) => a.name).join(", "),
        stats: characterState.stats,
        quirks: characterState.quirks.map((q: any) => q.name),
        house: characterState.results.house,
        gears: characterState.gears.map((g: any) => ({
          name: g.name,
          usable: g.usable,
        })),
        legacyGears: characterState.legacyGears.map((g: any) => ({
          name: g.name,
          usable: g.usable,
        })),
        weapons: characterState.weapons.map((w: any) => ({
          name: w.name,
          usable: w.usable,
          enchants: w.enchants || [],
        })),
        enchants: characterState.enchants.map((e: any) => e.name),
        powers: characterState.powers.map((p: any) => p.name),
        charDevs: characterState.charDevs.map((c: any) => c.name),
        pve: characterState.results.pve,
        // Additional archetype results
        trickstersCard: characterState.results["trickster-card"],
        slayerRace: characterState.results["slayer-race"],
        demonSubrace: characterState.results["demon-subrace"],
        maraisRace1: characterState.results["marais-race-1"],
        maraisRace2: characterState.results["marais-race-2"],
        goldenOrderRune: characterState.results["golden-order-rune"],
        starkWolf: characterState.results["stark-wolf"],
        ashinaSword: characterState.results["ashina-sword"],
        dessendreSkill: characterState.results["dessendre-skill"],
        houseSpyTarget: characterState.results["house-spy-target"],
        // Uma parents
        umaParent1: characterState.results["uma-parent-1"],
        umaParent2: characterState.results["uma-parent-2"],
        // Vampire specific
        uniqueVampireTrain: characterState.results["uniqueVampireTrain"],
        vampireTaste: characterState.results["vampireTaste"],
        // Wibu series
        wibuSeries: characterState.results["wibu-series"],
      };
    },
    []
  );

  // Generate character summary
  const generateCharacterSummary = useCallback(
    (characterState: any): CharacterSummary => {
      const totalItems =
        characterState.gears.length +
        characterState.legacyGears.length +
        characterState.weapons.length;

      const powerCount = characterState.powers.length;

      // Calculate completion percentage
      let completionPoints = 0;
      const maxPoints = 8;

      if (characterState.characterName) completionPoints++;
      if (characterState.results.race) completionPoints++;
      if (characterState.archetypes.length > 0) completionPoints++;
      if (Object.values(characterState.stats).every((s: any) => s !== ""))
        completionPoints++;
      if (characterState.quirks.length > 0) completionPoints++;
      if (characterState.results.house) completionPoints++;
      if (characterState.powers.length > 0) completionPoints++;
      if (characterState.results.pve) completionPoints++;

      const completionPercentage = Math.round(
        (completionPoints / maxPoints) * 100
      );

      // Determine character "level" based on items and powers
      let level = "Novice";
      const totalScore = totalItems + powerCount * 2;
      if (totalScore >= 20) level = "Master";
      else if (totalScore >= 15) level = "Expert";
      else if (totalScore >= 10) level = "Veteran";
      else if (totalScore >= 5) level = "Apprentice";

      // Get special abilities
      const specialAbilities: string[] = [];
      characterState.archetypes.forEach((archetype: any) => {
        specialAbilities.push(archetype.name);
      });

      // Get warnings
      const warnings = [];
      if (characterState.weapons.some((w: any) => !w.usable)) {
        warnings.push("Has unusable weapons");
      }
      if (characterState.gears.some((g: any) => !g.usable)) {
        warnings.push("Has unusable gear");
      }
      if (
        characterState.stats.iq === "1" &&
        characterState.results.race !== "Skeleton"
      ) {
        warnings.push("Very low IQ for non-Skeleton race");
      }

      return {
        name: characterState.characterName || "Unnamed Character",
        race: characterState.results.race || "Unknown",
        archetype:
          characterState.archetypes.map((a: any) => a.name).join(", ") ||
          "None",
        level,
        itemCount: totalItems,
        powerCount,
        completionPercentage,
        specialAbilities,
        warnings,
      };
    },
    []
  );

  // Validate character data
  const validateCharacter = useCallback(
    (characterState: any): CharacterValidation => {
      const errors = [];
      const warnings = [];
      const missingFields = [];

      // Check required fields
      if (
        !characterState.characterName ||
        characterState.characterName.trim() === ""
      ) {
        errors.push("Character name is required");
        missingFields.push("characterName");
      }

      if (!characterState.results.race) {
        errors.push("Race must be selected");
        missingFields.push("race");
      }

      // Check stats completion
      const incompleteStats = Object.entries(characterState.stats)
        .filter(([_, value]) => !value)
        .map(([key, _]) => key);

      if (incompleteStats.length > 0) {
        errors.push(`Missing stats: ${incompleteStats.join(", ")}`);
        missingFields.push(...incompleteStats);
      }

      // Check archetype
      if (characterState.archetypes.length === 0) {
        errors.push("At least one archetype must be selected");
        missingFields.push("archetype");
      }

      // Check PvE selection
      if (!characterState.results.pve) {
        warnings.push("PvE scenario not selected");
        missingFields.push("pve");
      }

      // Validation warnings
      if (characterState.quirks.length === 0) {
        warnings.push("No quirks selected - character may be less interesting");
      }

      if (characterState.powers.length === 0) {
        warnings.push("No powers selected - character may be weaker");
      }

      if (characterState.weapons.length === 0) {
        warnings.push("No weapons equipped");
      }

      // Race-specific validations
      if (
        characterState.results.race === "Skeleton" &&
        characterState.stats.iq !== "1"
      ) {
        warnings.push("Skeleton race should have IQ = 1");
      }

      if (
        characterState.results.race === "Uma" &&
        characterState.results.house !== "Tracen Academy"
      ) {
        warnings.push("Uma race typically belongs to Tracen Academy");
      }

      // Archetype-specific validations
      const archetypeNames = characterState.archetypes.map((a: any) => a.name);
      if (
        archetypeNames.includes("Noble Swordsman") &&
        characterState.weapons.length === 0
      ) {
        warnings.push("Noble Swordsman should have weapons for synergy");
      }

      const isValid = errors.length === 0;

      return {
        isValid,
        errors,
        warnings,
        missingFields,
      };
    },
    []
  );

  // Format character data for export
  const formatCharacterForExport = useCallback(
    (
      characterState: any,
      options: ExportOptions = {
        format: "json",
        includeMetadata: true,
        compressData: false,
        timestamp: true,
      }
    ): string => {
      const characterInfo = getCompleteCharacterInfo(characterState);

      // Add metadata if requested
      if (options.includeMetadata) {
        const metadata = {
          exportDate: new Date().toISOString(),
          version: "1.0",
          source: "Character Wheel Generator",
        };
        (characterInfo as any).metadata = metadata;
      }

      switch (options.format) {
        case "json":
          return JSON.stringify(
            characterInfo,
            null,
            options.compressData ? 0 : 2
          );

        case "txt":
          return formatAsText(characterInfo);

        case "csv":
          return formatAsCSV(characterInfo);

        default:
          return JSON.stringify(characterInfo, null, 2);
      }
    },
    [getCompleteCharacterInfo]
  );

  // Format as readable text
  const formatAsText = useCallback(
    (characterInfo: CompleteCharacterInfo): string => {
      const lines = [];

      lines.push(`=== CHARACTER SHEET ===`);
      lines.push(`Name: ${characterInfo.name}`);
      lines.push(`Race: ${characterInfo.race}`);
      if (characterInfo.subrace)
        lines.push(`Subrace: ${characterInfo.subrace}`);
      lines.push(`Archetype: ${characterInfo.archetype}`);
      lines.push(`House: ${characterInfo.house}`);
      lines.push("");

      lines.push("=== STATS ===");
      Object.entries(characterInfo.stats).forEach(([stat, value]) => {
        lines.push(`${stat}: ${value}`);
      });
      lines.push("");

      if (characterInfo.quirks.length > 0) {
        lines.push("=== QUIRKS ===");
        characterInfo.quirks.forEach((quirk) => lines.push(`- ${quirk}`));
        lines.push("");
      }

      if (characterInfo.gears.length > 0) {
        lines.push("=== GEAR ===");
        characterInfo.gears.forEach((gear) => {
          lines.push(`- ${gear.name}${gear.usable ? "" : " (Unusable)"}`);
        });
        lines.push("");
      }

      if (characterInfo.legacyGears.length > 0) {
        lines.push("=== LEGACY GEAR ===");
        characterInfo.legacyGears.forEach((gear) => {
          lines.push(`- ${gear.name}${gear.usable ? "" : " (Unusable)"}`);
        });
        lines.push("");
      }

      if (characterInfo.weapons.length > 0) {
        lines.push("=== WEAPONS ===");
        characterInfo.weapons.forEach((weapon) => {
          lines.push(`- ${weapon.name}${weapon.usable ? "" : " (Unusable)"}`);
          if (weapon.enchants.length > 0) {
            weapon.enchants.forEach((enchant) => {
              lines.push(`  + ${enchant.name || enchant}`);
            });
          }
        });
        lines.push("");
      }

      if (characterInfo.powers.length > 0) {
        lines.push("=== POWERS ===");
        characterInfo.powers.forEach((power) => lines.push(`- ${power}`));
        lines.push("");
      }

      if (characterInfo.charDevs.length > 0) {
        lines.push("=== CHARACTER DEVELOPMENT ===");
        characterInfo.charDevs.forEach((charDev) => lines.push(`- ${charDev}`));
        lines.push("");
      }

      lines.push("=== PvE SCENARIO ===");
      lines.push(characterInfo.pve || "Not selected");

      return lines.join("\n");
    },
    []
  );

  // Format as CSV
  const formatAsCSV = useCallback(
    (characterInfo: CompleteCharacterInfo): string => {
      const rows = [];

      // Header
      rows.push("Field,Value");

      // Basic info
      rows.push(`Name,"${characterInfo.name}"`);
      rows.push(`Race,"${characterInfo.race}"`);
      rows.push(`Subrace,"${characterInfo.subrace || ""}"`);
      rows.push(`Archetype,"${characterInfo.archetype}"`);
      rows.push(`House,"${characterInfo.house}"`);

      // Stats
      Object.entries(characterInfo.stats).forEach(([stat, value]) => {
        rows.push(`${stat},"${value}"`);
      });

      // Lists
      rows.push(`Quirks,"${characterInfo.quirks.join("; ")}"`);
      rows.push(`Powers,"${characterInfo.powers.join("; ")}"`);
      rows.push(
        `Gear,"${characterInfo.gears
          .map((g) => `${g.name}${g.usable ? "" : " (Unusable)"}`)
          .join("; ")}"`
      );
      rows.push(
        `Weapons,"${characterInfo.weapons
          .map((w) => `${w.name}${w.usable ? "" : " (Unusable)"}`)
          .join("; ")}"`
      );
      rows.push(`PvE,"${characterInfo.pve || ""}"`);

      return rows.join("\n");
    },
    []
  );

  // Import character data
  const importCharacterData = useCallback((jsonData: string): any => {
    try {
      const data = JSON.parse(jsonData);

      // Validate imported data structure
      if (!data.name || !data.race) {
        throw new Error("Invalid character data: missing required fields");
      }

      // Convert back to character state format
      const characterState = {
        characterName: data.name,
        results: {
          race: data.race,
          subrace: data.subrace,
          house: data.house,
          pve: data.pve,
          // Add other result fields
        },
        stats: data.stats || {},
        quirks: data.quirks?.map((name: string) => ({ name })) || [],
        gears: data.gears || [],
        legacyGears: data.legacyGears || [],
        weapons: data.weapons || [],
        enchants: data.enchants?.map((name: string) => ({ name })) || [],
        powers: data.powers?.map((name: string) => ({ name })) || [],
        charDevs: data.charDevs?.map((name: string) => ({ name })) || [],
        archetypes: data.archetype ? [{ name: data.archetype }] : [],
      };

      return characterState;
    } catch (error) {
      throw new Error(`Failed to import character data: ${error}`);
    }
  }, []);

  // Handle character export
  const handleCharacterExport = useCallback((characterState: any): void => {
    exportCharacter(characterState);
  }, []);

  // Generate shareable character URL/code
  const generateShareableCode = useCallback((characterState: any): string => {
    const essentialData = {
      n: characterState.characterName,
      r: characterState.results.race,
      s: characterState.results.subrace,
      a: characterState.archetypes.map((a: any) => a.name).join(","),
      st: Object.values(characterState.stats).join(","),
      h: characterState.results.house,
      p: characterState.results.pve,
    };

    // Compress and encode the data
    const jsonString = JSON.stringify(essentialData);
    return btoa(jsonString); // Base64 encode
  }, []);

  // Decode shareable character code
  const decodeShareableCode = useCallback((code: string): any => {
    try {
      const jsonString = atob(code); // Base64 decode
      const data = JSON.parse(jsonString);

      // Convert back to partial character state
      return {
        characterName: data.n || "",
        results: {
          race: data.r || "",
          subrace: data.s || "",
          house: data.h || "",
          pve: data.p || "",
        },
        stats: data.st
          ? {
              strength: data.st.split(",")[0] || "",
              speed: data.st.split(",")[1] || "",
              durability: data.st.split(",")[2] || "",
              iq: data.st.split(",")[3] || "",
              battleIQ: data.st.split(",")[4] || "",
              martialArts: data.st.split(",")[5] || "",
            }
          : {},
        archetypes: data.a
          ? data.a.split(",").map((name: string) => ({ name }))
          : [],
      };
    } catch (error) {
      throw new Error("Invalid shareable code");
    }
  }, []);

  // Calculate character power level
  const calculateCharacterPowerLevel = useCallback(
    (characterState: any): number => {
      let powerLevel = 0;

      // Base stats contribution
      Object.values(characterState.stats).forEach((stat: any) => {
        powerLevel += parseInt(stat) || 0;
      });

      // Items contribution
      powerLevel +=
        characterState.gears.filter((g: any) => g.usable).length * 5;
      powerLevel +=
        characterState.legacyGears.filter((g: any) => g.usable).length * 10;
      powerLevel +=
        characterState.weapons.filter((w: any) => w.usable).length * 8;

      // Powers contribution
      powerLevel += characterState.powers.length * 12;

      // Archetype contribution
      powerLevel += characterState.archetypes.length * 15;

      // Quirks contribution (can be positive or negative)
      powerLevel += characterState.quirks.length * 3;

      return Math.max(0, powerLevel);
    },
    []
  );

  return {
    getCompleteCharacterInfo,
    generateCharacterSummary,
    validateCharacter,
    formatCharacterForExport,
    formatAsText,
    formatAsCSV,
    importCharacterData,
    handleCharacterExport,
    generateShareableCode,
    decodeShareableCode,
    calculateCharacterPowerLevel,
  };
};
