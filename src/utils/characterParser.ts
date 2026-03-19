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
  BattleLogEntry,
  TournamentRound,
  TournamentBracket,
} from "../types/character";

/**
 * Strip source annotation from item name.
 * Items may include provenance like "(Từ Storage Room Key)" or "(Từ House)" — these
 * are NOT part of the item name and must be removed before comparisons.
 * Patterns stripped: (Từ ...), (Nhận từ ...), (từ ...), (nhận từ ...)
 */
function stripSourceAnnotation(text: string): string {
  return text
    .replace(/\s*\([Tt]ừ [^)]+\)/g, '')
    .replace(/\s*\([Nn]hận [Tt]ừ [^)]+\)/g, '')
    .trim();
}

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
 * Check if a house text indicates the house is no longer active
 * Includes all patterns: bị đuổi, rời đi, đổi nhà, kinda homeless, no more home, đã mất
 */
function isLostHouse(text: string): boolean {
  const lostPatterns = [
    /\(đã mất[^)]*\)/i,
    /\(mất do[^)]*\)/i,
    /\(đã bị đuổi[^)]*\)/i,
    /\(bị đuổi[^)]*\)/i,
    /\(đuổi[^)]*\)/i,
    /\(đã rời[^)]*\)/i,
    /\(rời[^)]*\)/i,
    /\(đổi nhà[^)]*\)/i,
    /kinda\s*homeless/i,
    /no\s*more\s*home/i,
  ];
  return lostPatterns.some((pattern) => pattern.test(text));
}

/**
 * Clean house name by stripping annotations like (đã bị đuổi...), (nhận từ...), (từ...)
 * Returns only the core house name
 */
function cleanHouseName(name: string): string {
  return name
    .replace(/\s*\([^)]*\)/g, "") // Remove all parenthesized annotations
    .trim();
}

/**
 * Parse an item string into a LossableItem
 */
function parseLossableItem(text: string): LossableItem {
  return {
    name: stripSourceAnnotation(text),
    isLost: isLostItem(text),
  };
}

/**
 * Parse a gear item string into a GearItem
 */
function parseGearItem(text: string): GearItem {
  const usableMatch = text.match(/\((.+?)\)/);
  return {
    name: stripSourceAnnotation(text),
    isLost: isLostItem(text),
    usable: usableMatch
      ? !usableMatch[1].toLowerCase().includes("không dùng")
      : undefined,
  };
}

/**
 * Parse a rune item string into a RuneItem
 */
function parseRuneItem(text: string): RuneItem {
  return {
    name: stripSourceAnnotation(text),
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
      character.wrathStacks = parasiteResult.wrathStacks; // Diablo Wrath stacks
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

    // Parse final stats (stats marked with "(final)" that already include all bonuses)
    character.finalStats = this.parseFinalStats(lines);

    // Parse flags (e.g., Giant bonus already applied)
    character.giantBonusApplied = this.parseFlag(lines, "GiantBonusApplied");

    // Detect houseBonusApplied from stat annotations containing "+X từ House"
    character.houseBonusApplied = this.detectHouseBonusApplied(lines);

    // Parse Houses - can have multiple, some may be lost (kicked out)
    const houseIndex = this.findSectionIndex(lines, "Houses:");
    const houseResult = this.parseNestedHouses(lines, houseIndex);
    // Derive houses from nested (which has proper isLost detection)
    character.houses = houseResult.nested.map((h) => ({
      name: h.name,
      isLost: h.isLost,
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

    // Extract adaptKnownPowers từ power "Adapt -> X -> Y"
    for (const p of character.powers) {
      if (/^Adapt\s*->/i.test(p.name)) {
        character.adaptKnownPowers = p.name
          .split("->")
          .slice(1)
          .map((s) => s.trim())
          .filter(Boolean);
        // Normalize tên power về "Adapt" để resolver lookup đúng
        p.name = "Adapt";
        break;
      }
    }

    // Parse Summons (block riêng: "Summon:\n+ Numby\n+ Igris")
    const summonIndex = this.findSectionIndex(lines, "Summon:");
    if (summonIndex >= 0) {
      character.summons = this.parseListValue(lines, summonIndex);
    }

    // Parse Character Development (support multiple)
    const charDevIndex = this.findSectionIndex(lines, "Char dev:");
    character.charDevs = this.parseListValue(lines, charDevIndex);

    // Parse Team - format: "Team: 25" (number on same line)
    const teamIndex = this.findSectionIndex(lines, "Team:");
    if (teamIndex >= 0) {
      const teamMatch = lines[teamIndex].match(/Team:\s*(\d+)/);
      if (teamMatch) {
        character.team = parseInt(teamMatch[1]);
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

    // Parse Spirit souls từ "Add info" block
    character.spiritSouls = this.parseSpiritSouls(lines);

    // Parse Other Source Mods từ "Nguồn khác:" block
    character.otherSourceMods = this.parseOtherSourceMods(lines);
    if (character.otherSourceMods && character.otherSourceMods.length > 0) {
      console.log(`[Parser] ${character.name} otherSourceMods:`, character.otherSourceMods);
    }

    // Parse Battle Log
    character.battleLog = this.parseBattleLog(lines);

    // Extract PvE stat modifiers from battle log (punishment/reward)
    if (character.battleLog) {
      const statMap: Record<string, string> = {
        str: "str",
        strength: "str",
        spd: "spd",
        speed: "spd",
        dur: "dur",
        dura: "dur",
        durability: "dur",
        iq: "iq",
        biq: "biq",
        ma: "ma",
        all: "all",
      };
      const punishments: { stat: string; value: number }[] = [];

      for (const entry of character.battleLog) {
        // Process both punishment and reward fields
        const fields = [entry.punishment, entry.reward].filter(Boolean);
        for (const field of fields) {
          // Split multi-line items (joined by "; ")
          const items = field!.split(/;\s*/);
          for (const item of items) {
            // Format 1: "-X vào stat ... (STAT)" or "+X stat cao nhất/thấp nhất (STAT)"
            // e.g., "-2 vào stat thấp nhất (Str)", "Nhận +1 stat cao nhất (spd)"
            const specificMatch = item.match(
              /([+-]?\d+)\s+(?:vào\s+)?stat\s+.+?\((\w+)\)/i,
            );
            if (specificMatch) {
              const value = parseInt(specificMatch[1]);
              const stat = statMap[specificMatch[2].toLowerCase()];
              if (stat && stat !== "all") {
                punishments.push({ stat, value });
              }
              continue;
            }
            // Format 2: "-X All Stats" or "+X All Stats"
            const allMatch = item.match(/([+-]?\d+)\s+All\s+Stats/i);
            if (allMatch) {
              const value = parseInt(allMatch[1]);
              for (const s of ["str", "spd", "dur", "iq", "biq", "ma"]) {
                punishments.push({ stat: s, value });
              }
              continue;
            }
            // Format 3: "+X STAT" or "-X STAT", e.g., "+2 Str", "-1 MA"
            const simpleMatch = item.match(/([+-]\d+)\s+(\w+)/i);
            if (simpleMatch) {
              const value = parseInt(simpleMatch[1]);
              const stat = statMap[simpleMatch[2].toLowerCase()];
              if (stat && stat !== "all") {
                punishments.push({ stat, value });
              }
            }
          }
        }
      }
      if (punishments.length > 0) {
        character.pvePunishments = punishments;
      }
    }

    return character as Character;
  }

  private static findSectionIndex(lines: string[], keyword: string): number {
    return lines.findIndex((line) => line.includes(keyword));
  }

  /**
   * Parse Spirit souls from "Add info" block
   * Formats: "Spirit souls: X" or "Spirit (Soul Stack: X)"
   */
  private static parseSpiritSouls(lines: string[]): number | undefined {
    const addInfoIdx = lines.findIndex((l) => l.includes("Add info:"));
    if (addInfoIdx < 0) return undefined;
    for (let i = addInfoIdx + 1; i < Math.min(addInfoIdx + 20, lines.length); i++) {
      // Format cũ: "Spirit souls: X"
      const oldMatch = lines[i].match(/Spirit\s+souls?\s*:\s*(\d+)/i);
      if (oldMatch) return parseInt(oldMatch[1]);
      // Format mới: "Spirit (Soul Stack: X)"
      const newMatch = lines[i].match(/Spirit\s*\(\s*Soul\s+Stack\s*:\s*(\d+)\s*\)/i);
      if (newMatch) return parseInt(newMatch[1]);
      // Stop at next section delimiter
      if (lines[i].startsWith("======")) break;
    }
    return undefined;
  }

  /**
   * Parse "Nguồn khác:" block from "Add info"
   * Format:
   *   Nguồn khác:
   *   - -1 Dura
   *   - +2 BIQ
   *   - +1 All stats
   * Returns array of { stat, value, source? } modifiers
   */
  private static parseOtherSourceMods(
    lines: string[],
  ): { stat: string; value: number; source?: string }[] | undefined {
    // Tìm "Nguồn khác:" ở bất kỳ đâu trong file (trước Battle Log)
    const battleLogIdx = lines.findIndex((l) => l.includes("Battle Log:"));
    const searchEnd = battleLogIdx >= 0 ? battleLogIdx : lines.length;
    let nguonKhacIdx = -1;
    for (let i = 0; i < searchEnd; i++) {
      if (/Other\s+Source\s*:/i.test(lines[i])) {
        nguonKhacIdx = i;
        break;
      }
    }
    if (nguonKhacIdx < 0) return undefined;

    const statMap: Record<string, string> = {
      str: "str", strength: "str",
      spd: "spd", speed: "spd",
      dur: "dur", dura: "dur", durability: "dur",
      iq: "iq",
      biq: "biq",
      ma: "ma",
      all: "all",
    };

    const result: { stat: string; value: number; source?: string }[] = [];

    for (let i = nguonKhacIdx + 1; i < Math.min(nguonKhacIdx + 30, lines.length); i++) {
      const line = lines[i].trim();
      // Dừng ở block delimiter hoặc dòng trống tiếp theo sau backtick
      if (!line || line.startsWith("======") || line.startsWith("```")) break;
      // Bỏ qua dòng không phải list item (dòng chỉ có dấu - trắng cũng bỏ qua)
      if (!line.startsWith("-")) continue;

      // Bóc tách phần source trong ngoặc: "- -1 Dura (từ X)"
      const sourceMatch = line.match(/\(([^)]+)\)\s*$/);
      const source = sourceMatch ? sourceMatch[1].trim() : undefined;
      const cleanLine = sourceMatch ? line.slice(0, sourceMatch.index).trim() : line;

      // Bóc dấu - đầu dòng list: "- -1 Dura" → "-1 Dura"
      const item = cleanLine.replace(/^-\s*/, "").trim();

      // "+1 All stats" hoặc "-2 All stats"
      const allMatch = item.match(/^([+-]?\d+)\s+All\s+[Ss]tats?/i);
      if (allMatch) {
        const value = parseInt(allMatch[1]);
        for (const s of ["str", "spd", "dur", "iq", "biq", "ma"]) {
          result.push({ stat: s, value, source });
        }
        continue;
      }

      // "+2 BIQ", "-1 Dura", "+1 Str", "+3 base speed", etc.
      const simpleMatch = item.match(/^([+-]?\d+)\s+(?:base\s+)?(\w+)/i);
      if (simpleMatch) {
        const value = parseInt(simpleMatch[1]);
        const stat = statMap[simpleMatch[2].toLowerCase()];
        if (stat && stat !== "all") {
          result.push({ stat, value, source });
        }
      }
    }

    return result.length > 0 ? result : undefined;
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

  /**
   * Detect if house bonus was pre-applied to stats
   * "+X từ House" annotations are notes only — stats are base values, bonus NOT pre-applied
   * Always returns false so effect system applies house bonuses normally
   */
  private static detectHouseBonusApplied(_lines: string[]): boolean {
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
    wrathStacks?: number; // For Diablo: number of Wrath stacks
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
    let wrathStacks: number | undefined;

    // Check if this line contains "Yes" indicating this IS a Symbiosis character
    const kyShinhLine = lines[startIndex];
    if (kyShinhLine && kyShinhLine.toLowerCase().includes("yes")) {
      isSymbiosis = true;
    }

    for (
      let i = startIndex + 1;
      i < Math.min(startIndex + 15, lines.length);
      i++
    ) {
      const line = lines[i];

      // Stop at next section or code block end
      if (line.startsWith("```") && i > startIndex + 1) break;
      if (!line || line === "```") continue;

      // Check for continuation line with Stack Wrath (-> Stack Wrath: X)
      const wrathMatch = line.match(/^\s*->\s*Stack\s*Wrath:\s*(\d+)/i);
      if (wrathMatch) {
        wrathStacks = parseInt(wrathMatch[1]);
        continue;
      }

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
      wrathStacks,
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
        const reincarnatorMatch = fullRace.match(/^Reincarnator\s*(.*)$/i);
        if (reincarnatorMatch && reincarnatorMatch[1].trim()) {
          race.race = "Reincarnator";
          const info = reincarnatorMatch[1].trim();
          race.reincarnatorInfo = info;
          // Extract actual race: find -> outside parentheses
          // e.g. "(Nasume) -> Elf" => "Elf", "(Zed) -> Vampire (Khẩu vị: Bắp Cải)" => "Vampire"
          const afterParens = info.replace(/^\([^)]*\)\s*/, "");
          const arrowMatch = afterParens.match(/^->\s*(.+)/);
          if (arrowMatch) {
            // Take the first word(s) before any parenthesized annotation
            const actualRaceRaw = arrowMatch[1].trim();
            const cleanRace = actualRaceRaw.replace(/\s*\(.*\)\s*$/, "").trim();
            race.actualRace = cleanRace || actualRaceRaw;
          }
        } else if (fullRace.match(/^Reincarnator\s*$/i)) {
          race.race = "Reincarnator";
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
    let currentItem: string | null = null;

    for (
      let i = startIndex + 1;
      i < Math.min(startIndex + 30, lines.length);
      i++
    ) {
      const line = lines[i];

      // Stop at next section or code block
      if (line.startsWith("```") && i > startIndex + 1) break;
      if (!line || line === "```") continue;

      // Check for continuation line (starts with -> or whitespace followed by ->)
      const continuationMatch = line.match(/^\s*->\s*(.+)/);
      if (continuationMatch && currentItem) {
        // Append continuation to current item
        currentItem += " -> " + continuationMatch[1].trim();
        continue;
      }

      // If we have a pending item, save it before processing new item
      if (currentItem) {
        values.push(parseLossableItem(currentItem));
        currentItem = null;
      }

      // Parse list items starting with + or -
      const match = line.match(/^[+\-*]\s*(.+)/);
      if (match) {
        const value = match[1].trim();
        if (value) {
          currentItem = value;
        }
      }
    }

    // Don't forget the last item
    if (currentItem) {
      values.push(parseLossableItem(currentItem));
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

        // Detect if house is lost (bị đuổi, rời đi, đổi nhà, etc.)
        const houseLost = isLostHouse(name);
        // Clean the house name (strip annotations)
        const cleanName = cleanHouseName(name);

        // Check for inline sub-type: "Golden Order (đổi nhà) -> Godrick"
        const inlineMatch = name.match(/^(.+?)\s*(?:\([^)]*\))?\s*->\s*(.+)$/);
        if (inlineMatch) {
          // Save previous house first
          if (currentHouse) {
            nested.push(currentHouse);
          }
          const mainName = cleanHouseName(inlineMatch[1].trim());
          const subType = cleanHouseName(inlineMatch[2].trim());
          flat.push(mainName);
          const inlineLostType = /kinda\s*homeless/i.test(name)
            ? ("kinda_homeless" as const)
            : /no\s*more\s*home/i.test(name)
              ? ("no_more_home" as const)
              : undefined;
          currentHouse = {
            name: mainName,
            subType,
            isLost: houseLost,
            lostType: inlineLostType,
          };
          continue;
        }

        // Check if this is a known sub-type that should be merged with previous house
        const parentHouse = this.HOUSE_SUB_TYPE_MAP[cleanName];
        if (
          parentHouse &&
          currentHouse &&
          currentHouse.name === parentHouse &&
          !currentHouse.subType
        ) {
          // This is a sub-type of the current house, merge it
          currentHouse.subType = cleanName;
          continue;
        }

        // Save previous house
        if (currentHouse) {
          nested.push(currentHouse);
        }

        if (cleanName) {
          flat.push(cleanName);
          const lostType = /kinda\s*homeless/i.test(name)
            ? ("kinda_homeless" as const)
            : /no\s*more\s*home/i.test(name)
              ? ("no_more_home" as const)
              : undefined;
          currentHouse = { name: cleanName, isLost: houseLost, lostType };
        }
        continue;
      }

      // Sub-type or stat bonus: starts with -> (with leading spaces)
      // Pattern: " -> Thinkers", " -> Grey Wind", " -> +4 Dura", " -> Nhận +2 Str", " -> Godrick (đã mất)"
      const subMatch = line.match(/^\s*->\s*(.+)/);
      if (subMatch && currentHouse) {
        const subValue = subMatch[1].trim();
        if (subValue) {
          // Check if this is a sub-type with bonus notation (e.g., "Lady (+2)")
          const subTypeBonusMatch = subValue.match(/^([A-Za-z][^(]*?)\s*\(([+-]?\d+)\)\s*$/);
          if (subTypeBonusMatch) {
            const subTypeName = subTypeBonusMatch[1].trim();
            const bonusVal = parseInt(subTypeBonusMatch[2], 10);
            currentHouse.subType = subTypeName;
            currentHouse.subTypeBonus = bonusVal;
          } else {
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
      const strMatch = line.match(/Str:\s*(-?\d+)/i);
      if (strMatch) stats.str = parseInt(strMatch[1]);

      const spdMatch = line.match(/Spd:\s*(-?\d+)/i);
      if (spdMatch) stats.spd = parseInt(spdMatch[1]);

      const durMatch = line.match(/Dur:\s*(-?\d+)/i);
      if (durMatch) stats.dur = parseInt(durMatch[1]);

      const iqMatch = line.match(/^IQ:\s*(-?\d+)/i);
      if (iqMatch) stats.iq = parseInt(iqMatch[1]);

      const biqMatch = line.match(/BIQ:\s*(-?\d+)/i);
      if (biqMatch) stats.biq = parseInt(biqMatch[1]);

      const maMatch = line.match(/MA:\s*(-?\d+)/i);
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

  /**
   * Parse stats marked with "(final)" - these already include all bonuses
   * Returns undefined if no final stats found
   */
  private static parseFinalStats(
    lines: string[],
  ): Partial<Record<keyof CharacterStats, boolean>> | undefined {
    const finalStats: Partial<Record<keyof CharacterStats, boolean>> = {};
    let hasAny = false;

    const statPatterns: Array<{ key: keyof CharacterStats; pattern: RegExp }> =
      [
        { key: "str", pattern: /Str:.*\(final\)/i },
        { key: "spd", pattern: /Spd:.*\(final\)/i },
        { key: "dur", pattern: /Dur:.*\(final\)/i },
        { key: "iq", pattern: /^IQ:.*\(final\)/i },
        { key: "biq", pattern: /BIQ:.*\(final\)/i },
        { key: "ma", pattern: /MA:.*\(final\)/i },
      ];

    for (const line of lines) {
      for (const { key, pattern } of statPatterns) {
        if (pattern.test(line)) {
          finalStats[key] = true;
          hasAny = true;
        }
      }
    }

    return hasAny ? finalStats : undefined;
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

      // Check for sub-effect lines like "-> +1 all stats" — attach to last gear item
      const subEffectMatch = line.match(/^->\s*(.+)/);
      if (subEffectMatch) {
        const subEffect = subEffectMatch[1].trim();
        const lastList = inLegacyGear
          ? gear.legacyGear
          : inNormalGear
            ? gear.normalGear
            : null;
        if (lastList && lastList.length > 0) {
          const lastItem = lastList[lastList.length - 1];
          if (!lastItem.subEffects) lastItem.subEffects = [];
          lastItem.subEffects.push(subEffect);
        }
        continue;
      }

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

    // Parse header to determine weapon counts per type
    // Formats: "1 Normal Weapon + 1 Unique Weapon:", "2 Normal Weapon", "1 Unique Weapon"
    const header = lines[weaponIndex];
    let normalCount = 0;
    let uniqueCount = 0;
    let legacyCount = 0;

    // Match patterns like "1 Normal Weapon", "2 Unique Weapon", etc.
    const normalMatch = header.match(/(\d+)\s*Normal\s*Weapon/i);
    const uniqueMatch = header.match(/(\d+)\s*Unique\s*Weapon/i);
    const legacyMatch = header.match(/(\d+)\s*Legacy\s*Weapon/i);

    if (normalMatch) normalCount = parseInt(normalMatch[1], 10);
    if (uniqueMatch) uniqueCount = parseInt(uniqueMatch[1], 10);
    if (legacyMatch) legacyCount = parseInt(legacyMatch[1], 10);

    // If no specific counts found, fall back to simple detection
    if (normalCount === 0 && uniqueCount === 0 && legacyCount === 0) {
      if (header.includes("Unique")) uniqueCount = 99;
      else if (header.includes("Legacy")) legacyCount = 99;
      else normalCount = 99;
    }

    // Track how many of each type have been assigned
    let normalAssigned = 0;
    let uniqueAssigned = 0;
    let legacyAssigned = 0;

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
          const name = stripSourceAnnotation(weaponText);
          // Check if weapon is lost
          const lost = isLostItem(weaponText);

          // Assign type based on order: Normal first, then Unique, then Legacy
          let weaponType: "Normal" | "Unique" | "Legacy" = "Normal";
          if (normalAssigned < normalCount) {
            weaponType = "Normal";
            normalAssigned++;
          } else if (uniqueAssigned < uniqueCount) {
            weaponType = "Unique";
            uniqueAssigned++;
          } else if (legacyAssigned < legacyCount) {
            weaponType = "Legacy";
            legacyAssigned++;
          }

          weapons.push({
            type: weaponType,
            name: name,
            usable: usableMatch
              ? !usableMatch[1].toLowerCase().includes("không dùng")
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
   * Vòng thi đấu: 256 / 256 / 128 / 64 / 32 / 16 / 8 / tứ kết / bán kết / chung kết
   * Nhánh thi đấu: - / thắng / thua
   */
  private static parseBattleLog(lines: string[]): BattleLogEntry[] | undefined {
    const entries: BattleLogEntry[] = [];

    // Find "Battle Log:" marker
    const logIndex = lines.findIndex((l) => l === "Battle Log:");
    if (logIndex < 0) return undefined;

    let currentEntry: Partial<BattleLogEntry> | null = null;
    const extraLines: string[] = [];
    let currentMultiLineField: "reward" | "punishment" | null = null;
    const multiLineItems: string[] = [];

    const flushMultiLine = () => {
      if (currentEntry && currentMultiLineField && multiLineItems.length > 0) {
        currentEntry[currentMultiLineField] = multiLineItems.join("; ");
      }
      currentMultiLineField = null;
      multiLineItems.length = 0;
    };

    for (let i = logIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line === "======") break;
      if (line === "```" || line === "") continue;

      // Battle type header (e.g., "PvE:", "PvP:")
      const typeMatch = line.match(/^(PvE|PvP):$/i);
      if (typeMatch) {
        flushMultiLine();
        // Save previous entry
        if (currentEntry?.type) {
          if (extraLines.length > 0) {
            currentEntry.note = [currentEntry.note, ...extraLines]
              .filter(Boolean)
              .join("; ");
          }
          entries.push(currentEntry as BattleLogEntry);
          extraLines.length = 0;
        }
        currentEntry = {
          type: typeMatch[1],
          opponent: "",
          result: "",
          score: "",
        };
        continue;
      }

      if (!currentEntry) continue;

      // Multi-line sub-items (+ prefix under Reward/Punishment)
      const subItemMatch = line.match(/^\+\s*(.+)/);
      if (subItemMatch && currentMultiLineField) {
        multiLineItems.push(subItemMatch[1].trim());
        continue;
      }

      // Parse fields
      const fieldMatch = line.match(/^-\s*(.+?):\s*(.*)$/);
      if (fieldMatch) {
        flushMultiLine();
        const key = fieldMatch[1].toLowerCase();
        const value = fieldMatch[2].trim();
        if (key === "đối thủ") {
          currentEntry.opponent = value;
        } else if (key === "kết quả") {
          currentEntry.result = value;
        } else if (key === "tỉ số") {
          currentEntry.score = value;
        } else if (key === "reward") {
          if (value) {
            currentEntry.reward = value;
          } else {
            // Multi-line reward — following lines start with "+"
            currentMultiLineField = "reward";
          }
        } else if (key === "punishment") {
          if (value) {
            currentEntry.punishment = value;
          } else {
            // Multi-line punishment
            currentMultiLineField = "punishment";
          }
        } else if (key === "vòng") {
          currentEntry.round = value;
        } else if (key === "note") {
          currentEntry.note = value;
        }
      } else if (line.startsWith("-")) {
        flushMultiLine();
        // Extra lines without key:value format (e.g., "- Bị Isekai trong trận")
        extraLines.push(line.replace(/^-\s*/, ""));
      }
    }

    // Save last entry
    flushMultiLine();
    if (currentEntry?.type) {
      if (extraLines.length > 0) {
        currentEntry.note = [currentEntry.note, ...extraLines]
          .filter(Boolean)
          .join("; ");
      }
      entries.push(currentEntry as BattleLogEntry);
    }

    return entries.length > 0 ? entries : undefined;
  }

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

      // Match lines starting with -, *, or +
      const rewardMatch = line.match(/^[\-*+]\s*(.+)/);
      if (rewardMatch) {
        let reward = rewardMatch[1].trim();
        if (reward) {
          // Check if reward is lost
          const lost = isLostItem(reward);

          // Clean up the description: remove trailing commas, parentheses, etc.
          reward = reward
            .replace(/[,)]+$/, "") // Remove trailing comma or closing parenthesis
            .replace(/\s*\(đã mất\)\s*/gi, "") // Remove "đã mất" marker
            .trim();

          // Normalize format: "+ 1 Power" -> "+1 Power", "1 Power" -> "+1 Power"
          reward = reward
            .replace(/^\+\s+/, "+") // "+ 1" -> "+1"
            .replace(/^(\d)/, "+$1"); // "1 Power" -> "+1 Power"

          if (reward) {
            rewards.push({
              description: reward,
              applied: !lost,
              isLost: lost || undefined,
            });
          }
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
