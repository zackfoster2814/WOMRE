import type {
  Character,
  CharacterStats,
  CharacterRace,
  Gear,
  GearItem,
  Weapon,
  Rune,
  RuneItem,
  PvPReward,
  LossableItem,
  NestedArchetype,
  NestedHouse,
  TournamentInfo,
  TournamentStatus,
  TournamentRound,
  TournamentBracket,
} from "../types/character";

/**
 * Check if an item text contains "lost" markers
 * Patterns: (Đã mất), (đã mất), (Mất do ...), (đã mất do ...)
 */
function isLostItem(text: string): boolean {
  const lostPatterns = [
    /\(đã mất[^)]*\)/i, // (Đã mất) or (đã mất do ...)
    /\(mất do[^)]*\)/i, // (Mất do ...)
  ];
  return lostPatterns.some((pattern) => pattern.test(text));
}

/**
 * Parse an item string into a LossableItem
 */
function parseLossableItem(text: string): LossableItem {
  return {
    name: text,
    isLost: isLostItem(text),
  };
}

/**
 * Parse a gear item string into a GearItem
 */
function parseGearItem(text: string): GearItem {
  return {
    name: text,
    isLost: isLostItem(text),
  };
}

/**
 * Parse a rune item string into a RuneItem
 */
function parseRuneItem(text: string): RuneItem {
  return {
    name: text,
    isLost: isLostItem(text),
  };
}

export class CharacterParser {
  // Archetypes that have sub-wheels
  // Map: sub-type -> parent archetype
  private static readonly ARCHETYPE_SUB_TYPE_MAP: Record<string, string> = {
    // Wibu sub-types (Wibu Wheel)
    "Dược sư tự sự": "Wibu",
    JJK: "Wibu",
    Jojo: "Wibu",
    "My Hero Academia": "Wibu",
    MHA: "Wibu",
    "One Piece": "Wibu",
    Bleach: "Wibu",
    // Farmer sub-types (Farmer Wheel)
    "Normal Farmer": "Farmer",
    "Aura Farmer": "Farmer",
    // X sub-types (Hero X Wheel)
    "Lin Ling": "X",
    "E-Soul": "X",
    Ahu: "X",
    "Lucky Cyan": "X",
    Loli: "X",
    "The Johnnies": "X",
    Ghostblade: "X",
    "Dragon Boy": "X",
    Queen: "X",
    // Trickster sub-types (Trickster Wheel)
    "Ace of Spades": "Trickster",
    "King of Diamonds": "Trickster",
    "Queen of Clubs": "Trickster",
    "Jack of 97": "Trickster",
    "Ten of Hearts": "Trickster",
    // Power Ranger sub-types (Power Ranger Wheel)
    Red: "Power Ranger",
    Blue: "Power Ranger",
    Black: "Power Ranger",
    Yellow: "Power Ranger",
    Pink: "Power Ranger",
    Silver: "Power Ranger",
    // Superhero sub-types (Siêu Anh Hùng Wheel)
    "Captain America": "Superhero",
    "Iron Man": "Superhero",
    Batman: "Superhero",
    Superman: "Superhero",
    "Wonder Woman": "Superhero",
    Spiderman: "Superhero",
    "The Flash": "Superhero",
    Hulk: "Superhero",
  };

  // Sub-sub-types: sub-types that have their own wheels
  // Map: sub-sub-type -> parent sub-type
  private static readonly ARCHETYPE_SUB_SUB_TYPE_MAP: Record<string, string> = {
    // JJK -> Domain Expansion Wheel
    Infinity: "JJK",
    "Malevolent Shrine": "JJK",
    "Idle Death Gamble": "JJK",
    "Self-Embodiment of Perfection": "JJK",
    "Coffin of the Iron Mountain": "JJK",
    "Coffin of Iron Mountain": "JJK",
    "Deadly Sentencing": "JJK",
    // Jojo -> Stands Wheel
    "Hey Ya!": "Jojo",
    "Tusk Act II": "Jojo",
    "The World": "Jojo",
    "King Crimson": "Jojo",
    "Golden Experience Requiem": "Jojo",
    // MHA -> MHA Power Wheel
    Quirkless: "My Hero Academia",
    IQ: "My Hero Academia",
    "Dark Shadow": "My Hero Academia",
    Erasure: "My Hero Academia",
    Heal: "My Hero Academia",
    "Half-Cold Half-Hot": "My Hero Academia",
    Float: "My Hero Academia",
    Hellflame: "My Hero Academia",
    Rewind: "My Hero Academia",
    Overhaul: "My Hero Academia",
    "One For All": "My Hero Academia",
    "All For One": "My Hero Academia",
    // One Piece -> Haki Wheel
    Observation: "One Piece",
    Armament: "One Piece",
    "Observation + Armament": "One Piece",
    "Observation + Armament + King Conqueror": "One Piece",
    // Bleach -> Bankai Wheel
    Shinuchi: "Bleach",
    "Zanka no Tachi": "Bleach",
    "Daiguren Hyorinmaru": "Bleach",
    "Katen Kyokotsu": "Bleach",
    "Katen Kyokotsu: Karamatsu Shinju": "Bleach",
    "Gangaku Kairo": "Bleach",
  };

  /**
   * Parse character text file content into Character object
   */
  static parseCharacterFile(content: string): Character {
    const lines = content.split("\n").map((line) => line.trim());

    const character: Partial<Character> = {};

    // Parse No and Name - handle multiple formats
    // Format 1: "No.X" on line 0, "Name: ..." on line 1
    // Format 2: "Name: ..." on line 0 (No extracted from filename or Name line)
    const noMatch = lines[0].match(/No\.?(\d+)/);
    if (noMatch) {
      character.no = parseInt(noMatch[1]);
    }

    // Try to find Name line (could be line 0 or line 1)
    let nameLineIndex = -1;
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      if (lines[i].startsWith("Name:")) {
        nameLineIndex = i;
        break;
      }
    }

    if (nameLineIndex >= 0) {
      const nameLine = lines[nameLineIndex];
      // Match "Name: PlayerName (username)" - capture full username including leading dot
      const nameMatch = nameLine.match(/Name:\s*(.+?)\s*\(([^)]+)\)/);
      if (nameMatch) {
        character.name = nameMatch[1].trim();
        character.username = nameMatch[2].trim();
      } else {
        // Try simpler format "Name: PlayerName" - use name as username fallback
        const simpleMatch = nameLine.match(/Name:\s*(.+)/);
        if (simpleMatch) {
          character.name = simpleMatch[1].trim();
          // Use name as username if no explicit username in parentheses
          character.username = character.name;
        }
      }
    }

    // Parse Ký Sinh (Parasite) - check if this is a Symbiosis character or a host
    const kyShinhIndex = this.findSectionIndex(lines, "Ký Sinh:");
    const parasiteResult = this.parseParasiteInfo(lines, kyShinhIndex);

    // Check if this character IS a Symbiosis (has "Ký Sinh: Yes" and no Race section)
    const raceIndex = this.findSectionIndex(lines, "Race:");
    const isSymbiosisChar = parasiteResult.isSymbiosis;

    if (isSymbiosisChar) {
      // This is a Symbiosis character (the parasite itself)
      character.isSymbiosis = true;
      character.symbiosisType = parasiteResult.symbiosisType;
      character.symbiosisHost = parasiteResult.symbiosisHost;
      character.isParasite = false;
      character.parasiteInfo = [];
      // Set race as Symbiosis
      character.race = {
        race: "Symbiosis",
        subRace: parasiteResult.symbiosisType,
      };
    } else {
      // This is a regular character (may or may not be a host)
      character.isParasite = parasiteResult.isParasite;
      character.parasiteInfo = parasiteResult.info;
      character.parasiteName = parasiteResult.parasiteName;
      character.parasiteType = parasiteResult.symbiosisType; // Type of parasite attached
      character.isSymbiosis = false;
    }

    // Parse Race (skip if already set for Symbiosis)
    if (!isSymbiosisChar) {
      character.race = this.parseRace(lines, raceIndex);
    }

    // Parse Archetypes (support multiple) - archetypes cannot be lost
    const archetypeIndex = this.findSectionIndex(lines, "Archetype:");
    const archetypeResult = this.parseNestedArchetypes(lines, archetypeIndex);
    character.archetypes = archetypeResult.flat;
    character.nestedArchetypes = archetypeResult.nested;

    // Parse Quirks
    const quirkIndex = this.findSectionIndex(lines, "Quirk:");
    character.quirks = this.parseListValue(lines, quirkIndex);

    // Parse Stats
    character.stats = this.parseStats(lines);

    // Parse original base stats (before effects like Inversion)
    character.originalBaseStats = this.parseOriginalBaseStats(lines);

    // Parse flags (e.g., Giant bonus already applied)
    character.giantBonusApplied = this.parseFlag(lines, "GiantBonusApplied");

    // Parse Houses - can have multiple, some may be lost (kicked out)
    const houseIndex = this.findSectionIndex(lines, "Houses:");
    const houseResult = this.parseNestedHouses(lines, houseIndex);
    character.houses = houseResult.flat.map((h) => ({
      name: h,
      isLost: isLostItem(h),
    }));
    character.nestedHouses = houseResult.nested;

    // Parse Gear
    character.gear = this.parseGear(lines);

    // Parse Weapons
    character.weapons = this.parseWeapons(lines);

    // Parse Runes
    character.runes = this.parseRunes(lines);

    // Parse Powers
    const powerIndex = this.findSectionIndex(lines, "Power:");
    character.powers = this.parseListValue(lines, powerIndex);

    // Parse Character Development (support multiple)
    const charDevIndex = this.findSectionIndex(lines, "Char dev:");
    character.charDevs = this.parseListValue(lines, charDevIndex);

    // Parse Team
    const teamIndex = this.findSectionIndex(lines, "Team:");
    if (teamIndex >= 0 && lines[teamIndex + 1]) {
      const teamMatch = lines[teamIndex + 1].match(/\d+/);
      if (teamMatch) {
        character.team = parseInt(teamMatch[0]);
      }
    }

    // Parse Lover - lovers cannot be lost
    const loverIndex = this.findSectionIndex(lines, "Lover:");
    const lovers = this.parseListValue(lines, loverIndex);
    character.lover = lovers;

    // Parse PvP Rewards
    character.pvpRewards = this.parsePvPRewards(lines);

    // Parse Tournament Status
    character.tournament = this.parseTournamentInfo(lines);

    return character as Character;
  }

  private static findSectionIndex(lines: string[], keyword: string): number {
    return lines.findIndex((line) => line.includes(keyword));
  }

  /**
   * Parse a boolean flag from the file
   * Format: "FlagName: Yes" or "FlagName: true" (case insensitive)
   */
  private static parseFlag(lines: string[], flagName: string): boolean {
    for (const line of lines) {
      const match = line.match(new RegExp(`${flagName}:\\s*(yes|true)`, "i"));
      if (match) return true;
    }
    return false;
  }

  private static parseParasiteInfo(
    lines: string[],
    startIndex: number,
  ): {
    isParasite: boolean; // This character is a HOST (has a parasite on them)
    isSymbiosis: boolean; // This character IS a parasite (Symbiosis)
    info: string[];
    symbiosisType?: string; // Type of symbiosis (Mephisto, Diablo, 67, etc.)
    symbiosisHost?: string; // For Symbiosis: who they're attached to
    parasiteName?: string; // For Host: who is attached to them
  } {
    if (startIndex < 0)
      return { isParasite: false, info: [], isSymbiosis: false };

    const info: string[] = [];
    let hasContent = false;
    let isSymbiosis = false;
    let isHost = false;
    let symbiosisType: string | undefined;
    let symbiosisHost: string | undefined;
    let parasiteName: string | undefined;

    // Check if this line contains "Yes" indicating this IS a Symbiosis character
    const kyShinhLine = lines[startIndex];
    if (kyShinhLine && kyShinhLine.toLowerCase().includes("yes")) {
      isSymbiosis = true;
    }

    for (
      let i = startIndex + 1;
      i < Math.min(startIndex + 10, lines.length);
      i++
    ) {
      const line = lines[i];

      // Stop at next section or code block end
      if (line.startsWith("```") && i > startIndex + 1) break;
      if (!line || line === "```") continue;

      // Parse list items starting with + or -
      const match = line.match(/^[+\-*]\s*(.+)/);
      if (match) {
        const value = match[1].trim();
        if (value) {
          info.push(value);
          hasContent = true;

          // New format: "+ Loại: Mephisto", "+ Host: Name", "+ Parasite: Name"
          const loaiMatch = value.match(/^Loại:\s*(.+)/i);
          const hostMatch = value.match(/^Host:\s*(.+)/i);
          const parasiteMatch = value.match(/^Parasite:\s*(.+)/i);

          if (loaiMatch) {
            symbiosisType = loaiMatch[1].trim();
          } else if (hostMatch) {
            // This character IS a Symbiosis, attached to a host
            symbiosisHost = hostMatch[1].trim();
            isSymbiosis = true;
          } else if (parasiteMatch) {
            // This character is a HOST, has a parasite attached
            parasiteName = parasiteMatch[1].trim();
            isHost = true;
          } else if (isSymbiosis) {
            // Old format fallback for Symbiosis characters
            if (!symbiosisType) {
              symbiosisType = value;
            } else if (!symbiosisHost) {
              symbiosisHost = value;
            }
          }
        }
      } else if (line === "+" || line === "-") {
        // Just a + or - without content means placeholder
        continue;
      }
    }

    return {
      isParasite: isHost || (hasContent && !isSymbiosis),
      info,
      isSymbiosis,
      symbiosisType,
      symbiosisHost,
      parasiteName,
    };
  }

  private static parseRace(lines: string[], startIndex: number): CharacterRace {
    const race: CharacterRace = { race: "" };

    if (startIndex < 0) return race;

    for (let i = startIndex; i < Math.min(startIndex + 10, lines.length); i++) {
      const line = lines[i];

      const raceMatch = line.match(/Race:\s*(.+)/);
      if (raceMatch) {
        const fullRace = raceMatch[1].trim();

        // Check if this is a Reincarnator - format: "Reincarnator (Name) -> NewRace"
        const reincarnatorMatch = fullRace.match(
          /^Reincarnator\s*(\(.+\)\s*->\s*.*)$/i,
        );
        if (reincarnatorMatch) {
          race.race = "Reincarnator";
          race.reincarnatorInfo = reincarnatorMatch[1].trim();
        } else {
          race.race = fullRace;
        }
      }

      const subRaceMatch = line.match(/Sub-race:\s*(.+)/);
      if (subRaceMatch) {
        const subRace = subRaceMatch[1].trim();
        if (subRace && subRace !== "-") {
          race.subRace = subRace;
        }
      }
    }

    return race;
  }

  private static parseListValue(
    lines: string[],
    startIndex: number,
  ): LossableItem[] {
    if (startIndex < 0) return [];

    const values: LossableItem[] = [];

    for (
      let i = startIndex + 1;
      i < Math.min(startIndex + 20, lines.length);
      i++
    ) {
      const line = lines[i];

      // Stop at next section or code block
      if (line.startsWith("```") && i > startIndex + 1) break;
      if (!line || line === "```") continue;

      // Parse list items starting with + or -
      const match = line.match(/^[+\-*]\s*(.+)/);
      if (match) {
        const value = match[1].trim();
        if (value) {
          values.push(parseLossableItem(value));
        }
      }
    }

    return values;
  }

  // private static parseListValueAsStrings(
  //   lines: string[],
  //   startIndex: number,
  // ): string[] {
  //   if (startIndex < 0) return [];

  //   const values: string[] = [];

  //   for (
  //     let i = startIndex + 1;
  //     i < Math.min(startIndex + 20, lines.length);
  //     i++
  //   ) {
  //     const line = lines[i];

  //     // Stop at next section or code block
  //     if (line.startsWith("```") && i > startIndex + 1) break;
  //     if (!line || line === "```") continue;

  //     // Parse list items starting with + or -
  //     const match = line.match(/^[+\-*]\s*(.+)/);
  //     if (match) {
  //       const value = match[1].trim();
  //       if (value) {
  //         values.push(value);
  //       }
  //     }
  //   }

  //   return values;
  // }

  /**
   * Parse nested archetypes with sub-types
   * Format examples:
   *   + Wibu
   *    -> Jojo
   *     -> The World
   *   + Farmer
   *    -> Aura Farmer
   *
   * Also handles flat format where sub-types are listed separately:
   *   + Wibu
   *   + Jojo
   *   + The World
   * This will be merged into: Wibu -> Jojo -> The World
   *
   * Note: lines are trimmed, so we determine nesting by order of appearance:
   * - First -> after + is subType
   * - Second -> is subSubType
   */
  private static parseNestedArchetypes(
    lines: string[],
    startIndex: number,
  ): {
    flat: string[];
    nested: NestedArchetype[];
  } {
    if (startIndex < 0) return { flat: [], nested: [] };

    const flat: string[] = [];
    const nested: NestedArchetype[] = [];
    let currentArchetype: NestedArchetype | null = null;

    for (
      let i = startIndex + 1;
      i < Math.min(startIndex + 30, lines.length);
      i++
    ) {
      const line = lines[i];

      // Stop at next section or code block end
      if (line.startsWith("```") && i > startIndex + 1) break;
      if (!line || line === "```") continue;

      // Main archetype: starts with + (e.g., "+ Wibu")
      const mainMatch = line.match(/^[+]\s*(.+)/);
      if (mainMatch) {
        const name = mainMatch[1].trim();
        if (!name) continue;

        // Check if this is a sub-sub-type (e.g., "The World" is sub-sub of "Jojo")
        const subSubParent = this.ARCHETYPE_SUB_SUB_TYPE_MAP[name];
        if (
          subSubParent &&
          currentArchetype &&
          currentArchetype.subType === subSubParent &&
          !currentArchetype.subSubType
        ) {
          currentArchetype.subSubType = name;
          continue;
        }

        // Check if this is a sub-type of the current archetype
        const subParent = this.ARCHETYPE_SUB_TYPE_MAP[name];
        if (
          subParent &&
          currentArchetype &&
          currentArchetype.name === subParent &&
          !currentArchetype.subType
        ) {
          currentArchetype.subType = name;
          continue;
        }

        // This is a new main archetype
        // Save previous archetype
        if (currentArchetype) {
          nested.push(currentArchetype);
        }
        flat.push(name);
        currentArchetype = { name };
        continue;
      }

      // Sub-type: starts with -> or => (lines are trimmed so no leading spaces)
      // Patterns: "-> Jojo", "=> JJK"
      const subMatch = line.match(/^(?:->|=>)\s*(.+)/);
      if (subMatch && currentArchetype) {
        const subValue = subMatch[1].trim();
        if (subValue) {
          // Determine nesting by whether subType is already set
          if (!currentArchetype.subType) {
            // First -> is subType (e.g., "Jojo")
            currentArchetype.subType = subValue;
          } else if (!currentArchetype.subSubType) {
            // Second -> is subSubType (e.g., "The World")
            currentArchetype.subSubType = subValue;
          }
          // Ignore any further -> for this archetype
        }
        continue;
      }
    }

    // Don't forget the last archetype
    if (currentArchetype) {
      nested.push(currentArchetype);
    }

    return { flat, nested };
  }

  // Known houses that have sub-types
  // When we see one of these sub-types listed separately, we should merge it with the parent
  private static readonly HOUSE_SUB_TYPE_MAP: Record<string, string> = {
    // New London sub-types
    Thinkers: "New London",
    Frostlanders: "New London",
    "New Londoners": "New London",
    Winterhomers: "New London",
    Wanderers: "New London",
    Engineers: "New London",
    Workers: "New London",
    Children: "New London",
    "Faith Keepers": "New London",
    Venturers: "New London",
    // House Stark dire wolves
    "Grey Wind": "House Stark",
    Lady: "House Stark",
    Summer: "House Stark",
    Shaggydog: "House Stark",
    Ghost: "House Stark",
    Nymeria: "House Stark",
    // Golden Order shardbearers
    Godrick: "Golden Order",
    Malenia: "Golden Order",
    Radahn: "Golden Order",
    Morgott: "Golden Order",
    Mohg: "Golden Order",
    Rykard: "Golden Order",
  };

  /**
   * Parse nested houses with sub-types
   * Format examples:
   *   + New London
   *    -> Thinkers
   *   + House Stark
   *    -> Grey Wind
   *   + Golden Order (đổi nhà) -> Godrick
   *
   * Also handles flat format where sub-types are listed separately:
   *   + New London
   *   + Thinkers
   * This will be merged into: New London -> Thinkers
   */
  private static parseNestedHouses(
    lines: string[],
    startIndex: number,
  ): {
    flat: string[];
    nested: NestedHouse[];
  } {
    if (startIndex < 0) return { flat: [], nested: [] };

    const flat: string[] = [];
    const nested: NestedHouse[] = [];
    let currentHouse: NestedHouse | null = null;

    for (
      let i = startIndex + 1;
      i < Math.min(startIndex + 20, lines.length);
      i++
    ) {
      const line = lines[i];

      // Stop at next section or code block end
      if (line.startsWith("```") && i > startIndex + 1) break;
      if (!line || line === "```") continue;

      // Main house: starts with + (e.g., "+ New London")
      const mainMatch = line.match(/^[+]\s*(.+)/);
      if (mainMatch) {
        let name = mainMatch[1].trim();

        // Check for inline sub-type: "Golden Order (đổi nhà) -> Godrick"
        const inlineMatch = name.match(/^(.+?)\s*(?:\([^)]*\))?\s*->\s*(.+)$/);
        if (inlineMatch) {
          // Save previous house first
          if (currentHouse) {
            nested.push(currentHouse);
          }
          const mainName = inlineMatch[1].trim();
          const subType = inlineMatch[2].trim();
          flat.push(mainName);
          currentHouse = {
            name: mainName,
            subType,
            isLost: isLostItem(name),
          };
          continue;
        }

        // Check if this is a known sub-type that should be merged with previous house
        const parentHouse = this.HOUSE_SUB_TYPE_MAP[name];
        if (
          parentHouse &&
          currentHouse &&
          currentHouse.name === parentHouse &&
          !currentHouse.subType
        ) {
          // This is a sub-type of the current house, merge it
          currentHouse.subType = name;
          continue;
        }

        // Save previous house
        if (currentHouse) {
          nested.push(currentHouse);
        }

        if (name) {
          flat.push(name);
          currentHouse = { name, isLost: isLostItem(name) };
        }
        continue;
      }

      // Sub-type or stat bonus: starts with -> (with leading spaces)
      // Pattern: " -> Thinkers", " -> Grey Wind", " -> +4 Dura", " -> Nhận +2 Str", " -> Godrick (đã mất)"
      const subMatch = line.match(/^\s*->\s*(.+)/);
      if (subMatch && currentHouse) {
        const subValue = subMatch[1].trim();
        if (subValue) {
          // Check if this is a stat bonus
          // Patterns: "+4 Dura", "+6 Str", "-2 IQ", "Nhận +2 Str", etc.
          const statBonusMatch = subValue.match(/([+-]\d+)\s+(\w+)/);
          if (statBonusMatch) {
            // Extract the stat bonus part (e.g., "+2 Str" from "Nhận +2 Str")
            const bonusPart = statBonusMatch[0];
            if (!currentHouse.statBonuses) {
              currentHouse.statBonuses = [];
            }
            currentHouse.statBonuses.push(bonusPart);
          } else {
            // Check if subType is lost (e.g., "Godrick (đã mất)")
            const subTypeIsLost = isLostItem(subValue);
            // Strip "(đã mất...)" from subType name for registry lookup
            const cleanSubType = subValue
              .replace(/\s*\(đã mất[^)]*\)/gi, "")
              .replace(/\s*\(mất do[^)]*\)/gi, "")
              .trim();
            currentHouse.subType = cleanSubType;
            currentHouse.subTypeIsLost = subTypeIsLost;
          }
        }
        continue;
      }
    }

    // Don't forget the last house
    if (currentHouse) {
      nested.push(currentHouse);
    }

    return { flat, nested };
  }

  private static parseStats(lines: string[]): CharacterStats {
    const stats: CharacterStats = {
      str: 0,
      spd: 0,
      dur: 0,
      iq: 0,
      biq: 0,
      ma: 0,
    };

    for (const line of lines) {
      const strMatch = line.match(/Str:\s*(\d+)/i);
      if (strMatch) stats.str = parseInt(strMatch[1]);

      const spdMatch = line.match(/Spd:\s*(\d+)/i);
      if (spdMatch) stats.spd = parseInt(spdMatch[1]);

      const durMatch = line.match(/Dur:\s*(\d+)/i);
      if (durMatch) stats.dur = parseInt(durMatch[1]);

      const iqMatch = line.match(/^IQ:\s*(\d+)/i);
      if (iqMatch) stats.iq = parseInt(iqMatch[1]);

      const biqMatch = line.match(/BIQ:\s*(\d+)/i);
      if (biqMatch) stats.biq = parseInt(biqMatch[1]);

      const maMatch = line.match(/MA:\s*(\d+)/i);
      if (maMatch) stats.ma = parseInt(maMatch[1]);
    }

    return stats;
  }

  /**
   * Parse original base stats from annotations like "ban đầu là X"
   * Returns undefined if no original stats found
   */
  private static parseOriginalBaseStats(
    lines: string[],
  ): CharacterStats | undefined {
    const stats: Partial<CharacterStats> = {};
    let hasOriginal = false;

    for (const line of lines) {
      // Pattern: "Str: 2 ban đầu là 4" -> extract 4
      const strMatch = line.match(/Str:\s*\d+.*ban đầu là\s*(\d+)/i);
      if (strMatch) {
        stats.str = parseInt(strMatch[1]);
        hasOriginal = true;
      }

      const spdMatch = line.match(/Spd:\s*\d+.*ban đầu là\s*(\d+)/i);
      if (spdMatch) {
        stats.spd = parseInt(spdMatch[1]);
        hasOriginal = true;
      }

      const durMatch = line.match(/Dur:\s*\d+.*ban đầu là\s*(\d+)/i);
      if (durMatch) {
        stats.dur = parseInt(durMatch[1]);
        hasOriginal = true;
      }

      const iqMatch = line.match(/^IQ:\s*\d+.*ban đầu là\s*(\d+)/i);
      if (iqMatch) {
        stats.iq = parseInt(iqMatch[1]);
        hasOriginal = true;
      }

      const biqMatch = line.match(/BIQ:\s*\d+.*ban đầu là\s*(\d+)/i);
      if (biqMatch) {
        stats.biq = parseInt(biqMatch[1]);
        hasOriginal = true;
      }

      const maMatch = line.match(/MA:\s*\d+.*ban đầu là\s*(\d+)/i);
      if (maMatch) {
        stats.ma = parseInt(maMatch[1]);
        hasOriginal = true;
      }
    }

    if (!hasOriginal) return undefined;

    return {
      str: stats.str ?? 0,
      spd: stats.spd ?? 0,
      dur: stats.dur ?? 0,
      iq: stats.iq ?? 0,
      biq: stats.biq ?? 0,
      ma: stats.ma ?? 0,
    };
  }

  private static parseGear(lines: string[]): Gear {
    const gear: Gear = {
      normalGear: [],
      legacyGear: [],
    };

    const gearIndex = this.findSectionIndex(lines, "Gear:");
    if (gearIndex < 0) return gear;

    let inNormalGear = false;
    let inLegacyGear = false;

    for (let i = gearIndex; i < Math.min(gearIndex + 30, lines.length); i++) {
      const line = lines[i];

      if (line.includes("Normal gear:")) {
        inNormalGear = true;
        inLegacyGear = false;
        continue;
      }

      if (line.includes("Legacy gear:")) {
        inNormalGear = false;
        inLegacyGear = true;
        continue;
      }

      if (line.startsWith("```") && i > gearIndex + 1) break;

      const itemMatch = line.match(/^[\-*]\s*(.+)/);
      if (itemMatch) {
        const item = itemMatch[1].trim();
        if (item) {
          if (inNormalGear) {
            gear.normalGear.push(parseGearItem(item));
          } else if (inLegacyGear) {
            gear.legacyGear.push(parseGearItem(item));
          }
        }
      }
    }

    return gear;
  }

  private static parseWeapons(lines: string[]): Weapon[] {
    const weapons: Weapon[] = [];

    const weaponIndex = this.findSectionIndex(lines, "Weapon");
    if (weaponIndex < 0) return weapons;

    let weaponType: "Normal" | "Unique" | "Legacy" = "Normal";

    // Determine weapon type from section header
    if (lines[weaponIndex].includes("Unique")) weaponType = "Unique";
    if (lines[weaponIndex].includes("Legacy")) weaponType = "Legacy";

    for (
      let i = weaponIndex + 1;
      i < Math.min(weaponIndex + 15, lines.length);
      i++
    ) {
      const line = lines[i];

      if (line.startsWith("```") && i > weaponIndex + 1) break;

      const itemMatch = line.match(/^[+\-*]\s*(.+)/);
      if (itemMatch) {
        const weaponText = itemMatch[1].trim();
        if (weaponText) {
          const usableMatch = weaponText.match(/\((.+?)\)/);
          // Keep full name including notes
          const name = weaponText;
          // Check if weapon is lost
          const lost = isLostItem(weaponText);

          weapons.push({
            type: weaponType,
            name: name,
            usable: usableMatch
              ? !usableMatch[1].includes("không dùng")
              : undefined,
            isLost: lost || undefined,
          });
        }
      }
    }

    return weapons;
  }

  private static parseRunes(lines: string[]): Rune {
    const rune: Rune = {
      runes: [],
      runeword: undefined,
    };

    const runeIndex = this.findSectionIndex(lines, "Rune:");
    if (runeIndex < 0) return rune;

    for (
      let i = runeIndex + 1;
      i < Math.min(runeIndex + 10, lines.length);
      i++
    ) {
      const line = lines[i];

      if (line.startsWith("```") && i > runeIndex + 1) break;

      const runeMatch = line.match(/^[+\-*]\s*(.+)/);
      if (runeMatch) {
        const runeName = runeMatch[1].trim();
        if (runeName && !runeName.toLowerCase().includes("runeword")) {
          rune.runes.push(parseRuneItem(runeName));
        }
      }

      const runewordMatch = line.match(/Runeword:\s*(.+)/i);
      if (runewordMatch) {
        const runeword = runewordMatch[1].trim();
        if (runeword && runeword !== "Không" && runeword !== "-") {
          rune.runeword = runeword;
        }
      }
    }

    return rune;
  }

  /**
   * Parse Tournament Info
   * Format in file (standalone lines at top):
   * Status: Còn sống / Đã bị loại / Vô địch
   * Vòng thi đấu: - / 256 / 128 / 64 / 32 / 16 / 8 / tứ kết / bán kết / chung kết
   * Nhánh thi đấu: - / thắng / thua
   */
  private static parseTournamentInfo(
    lines: string[],
  ): TournamentInfo | undefined {
    let status: TournamentStatus = "alive";
    let round: TournamentRound = "-";
    let bracket: TournamentBracket = "-";
    let pvpWins: number | undefined;
    let foundAny = false;

    // Search for tournament info in the first 20 lines (they appear at the top)
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i].trim();

      // Parse Status (standalone line)
      const statusMatch = line.match(/^Status:\s*(.+)/i);
      if (statusMatch) {
        foundAny = true;
        const statusStr = statusMatch[1].trim().toLowerCase();
        if (statusStr.includes("vô địch") || statusStr === "champion") {
          status = "champion";
        } else if (statusStr.includes("loại") || statusStr === "eliminated") {
          status = "eliminated";
        } else {
          status = "alive";
        }
      }

      // Parse Round (Vòng thi đấu)
      const roundMatch = line.match(/^(?:Vòng thi đấu|Vòng|Round):\s*(.+)/i);
      if (roundMatch) {
        foundAny = true;
        const roundStr = roundMatch[1].trim().toLowerCase();
        if (roundStr === "-" || roundStr === "") {
          round = "-";
        } else if (roundStr.includes("chung kết") || roundStr === "final") {
          round = "final";
        } else if (roundStr.includes("bán kết") || roundStr === "semi") {
          round = "semi";
        } else if (roundStr.includes("tứ kết") || roundStr === "quarter") {
          round = "quarter";
        } else {
          // Try to parse numeric round: 256, 128, 64, 32, 16, 8
          const numMatch = roundStr.match(/(\d+)/);
          if (numMatch) {
            const num = numMatch[1] as TournamentRound;
            if (["256", "128", "64", "32", "16", "8"].includes(num)) {
              round = num;
            }
          }
        }
      }

      // Parse Bracket (Nhánh thi đấu)
      const bracketMatch = line.match(
        /^(?:Nhánh thi đấu|Nhánh|Bracket):\s*(.+)/i,
      );
      if (bracketMatch) {
        foundAny = true;
        const bracketStr = bracketMatch[1].trim().toLowerCase();
        if (bracketStr.includes("thắng") || bracketStr === "winner") {
          bracket = "winner";
        } else if (bracketStr.includes("thua") || bracketStr === "loser") {
          bracket = "loser";
        } else {
          bracket = "-";
        }
      }

      // Parse PvP Wins
      const winsMatch = line.match(/^(?:PvP Wins|Wins):\s*(\d+)/i);
      if (winsMatch) {
        foundAny = true;
        pvpWins = parseInt(winsMatch[1]);
      }
    }

    // Only return if we found at least one tournament field
    if (!foundAny) return undefined;

    return {
      status,
      round,
      bracket,
      pvpWins,
    };
  }

  private static parsePvPRewards(lines: string[]): PvPReward[] {
    const rewards: PvPReward[] = [];

    const pvpIndex = this.findSectionIndex(lines, "PvP Reward:");
    if (pvpIndex < 0) return rewards;

    for (let i = pvpIndex + 1; i < Math.min(pvpIndex + 10, lines.length); i++) {
      const line = lines[i];

      if (line.startsWith("```") && i > pvpIndex + 1) break;

      const rewardMatch = line.match(/^[\-*]\s*(.+)/);
      if (rewardMatch) {
        const reward = rewardMatch[1].trim();
        if (reward) {
          rewards.push({
            description: reward,
            applied: true,
          });
        }
      }
    }

    return rewards;
  }

  /**
   * Serialize Character object back to text file format
   */
  static serializeCharacter(character: Character): string {
    const lines: string[] = [];

    // Header
    lines.push(`No.${character.no}`);
    lines.push(`Name: ${character.name} (${character.username})`);
    lines.push("");

    // Ký Sinh
    lines.push("```");
    lines.push("Ký Sinh:");
    lines.push(character.isParasite ? "+" : "+");
    lines.push("```");

    // Race
    lines.push("```");
    lines.push(`Race: ${character.race.race || ""}`);
    lines.push(`Sub-race: ${character.race.subRace || "-"}`);
    lines.push("```");
    lines.push("");

    // Archetypes
    lines.push("```");
    lines.push(`${character.archetypes?.length || 0} Archetype:`);
    if (character.archetypes && character.archetypes.length > 0) {
      character.archetypes.forEach((a) => lines.push(`+ ${a}`));
    } else {
      lines.push("+");
    }
    lines.push("```");

    // Quirks
    lines.push("```");
    lines.push(`${character.quirks.length} Quirk:`);
    if (character.quirks.length > 0) {
      character.quirks.forEach((q) => lines.push(`+ ${q.name}`));
    } else {
      lines.push("+");
    }
    lines.push("```");

    // Stats
    lines.push("```");
    lines.push(`Str: ${character.stats.str || ""}`);
    lines.push(`Spd: ${character.stats.spd || ""}`);
    lines.push(`Dur: ${character.stats.dur || ""}`);
    lines.push(`IQ: ${character.stats.iq || ""}`);
    lines.push(`BIQ: ${character.stats.biq || ""}`);
    lines.push(`MA: ${character.stats.ma || ""}`);
    lines.push("```");
    lines.push("");

    // Houses
    lines.push("```");
    lines.push("Houses:");
    if (character.houses && character.houses.length > 0) {
      character.houses.forEach((h) => lines.push(`+ ${h.name}`));
    } else {
      lines.push("+");
    }
    lines.push("```");
    lines.push("");

    // Gear
    const totalGear =
      character.gear.normalGear.length + character.gear.legacyGear.length;
    lines.push("```");
    lines.push(`${totalGear} Gear:`);
    lines.push(` + ${character.gear.normalGear.length} Normal gear:`);
    if (character.gear.normalGear.length > 0) {
      character.gear.normalGear.forEach((g) => lines.push(`  - ${g.name}`));
    } else {
      lines.push("  -");
    }
    lines.push(` + ${character.gear.legacyGear.length} Legacy gear:`);
    if (character.gear.legacyGear.length > 0) {
      character.gear.legacyGear.forEach((g) => lines.push(`  - ${g.name}`));
    } else {
      lines.push("  -");
    }
    lines.push("```");
    lines.push("");

    // Weapons
    lines.push("```");
    lines.push(`${character.weapons.length} Normal Weapon`);
    if (character.weapons.length > 0) {
      character.weapons.forEach((w) => {
        const usableText =
          w.usable === false
            ? " (không dùng được)"
            : w.usable === true
              ? " (Dùng được)"
              : "";
        lines.push(`+ ${w.name}${usableText}`);
      });
    } else {
      lines.push("+");
    }
    lines.push("```");
    lines.push("");

    // Runes
    lines.push("```");
    lines.push(`${character.runes.runes.length} Rune:`);
    if (character.runes.runes.length > 0) {
      character.runes.runes.forEach((r) => lines.push(`+ ${r.name}`));
    } else {
      lines.push("+");
    }
    lines.push(`Runeword: ${character.runes.runeword || "Không"}`);
    lines.push("```");
    lines.push("");

    // Powers
    lines.push("```");
    lines.push(`${character.powers.length} Power:`);
    if (character.powers.length > 0) {
      character.powers.forEach((p) => lines.push(`+ ${p.name}`));
    } else {
      lines.push("+");
    }
    lines.push("```");
    lines.push("");

    // Char devs
    lines.push("```");
    lines.push(`${character.charDevs?.length || 0} Char dev:`);
    if (character.charDevs && character.charDevs.length > 0) {
      character.charDevs.forEach((c) => lines.push(`+ ${c.name}`));
    } else {
      lines.push("+");
    }
    lines.push("```");
    lines.push("");

    // Team
    lines.push("```");
    lines.push(`Team: ${character.team || ""}`);
    lines.push("```");
    lines.push("");

    // Lover
    lines.push("```");
    lines.push("Lover:");
    lines.push(`+ ${character.lover || ""}`);
    lines.push("```");

    lines.push("```");
    lines.push("PvP Reward:");
    lines.push(`+ ${character.pvpRewards || ""}`);
    lines.push("```");

    return lines.join("\n");
  }

  /**
   * Parse multiple character files
   */
  static parseMultipleFiles(fileContents: Map<string, string>): Character[] {
    const characters: Character[] = [];

    for (const [filename, content] of fileContents) {
      try {
        const character = this.parseCharacterFile(content);
        characters.push(character);
      } catch (error) {
        console.error(`Error parsing ${filename}:`, error);
      }
    }

    return characters.sort((a, b) => a.no - b.no);
  }
}
