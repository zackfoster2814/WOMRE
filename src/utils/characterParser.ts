import type { Character, CharacterStats, CharacterRace, Gear, GearItem, Weapon, Rune, RuneItem, PvPReward, LossableItem } from '../types/character';

/**
 * Check if an item text contains "lost" markers
 * Patterns: (Đã mất), (đã mất), (Mất do ...), (đã mất do ...)
 */
function isLostItem(text: string): boolean {
  const lostPatterns = [
    /\(đã mất[^)]*\)/i,           // (Đã mất) or (đã mất do ...)
    /\(mất do[^)]*\)/i,           // (Mất do ...)
  ];
  return lostPatterns.some(pattern => pattern.test(text));
}

/**
 * Parse an item string into a LossableItem
 */
function parseLossableItem(text: string): LossableItem {
  return {
    name: text,
    isLost: isLostItem(text)
  };
}

/**
 * Parse a gear item string into a GearItem
 */
function parseGearItem(text: string): GearItem {
  return {
    name: text,
    isLost: isLostItem(text)
  };
}

/**
 * Parse a rune item string into a RuneItem
 */
function parseRuneItem(text: string): RuneItem {
  return {
    name: text,
    isLost: isLostItem(text)
  };
}

export class CharacterParser {
  /**
   * Parse character text file content into Character object
   */
  static parseCharacterFile(content: string): Character {
    const lines = content.split('\n').map(line => line.trim());

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
      if (lines[i].startsWith('Name:')) {
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
    const kyShinhIndex = this.findSectionIndex(lines, 'Ký Sinh:');
    const parasiteResult = this.parseParasiteInfo(lines, kyShinhIndex);

    // Check if this character IS a Symbiosis (has "Ký Sinh: Yes" and no Race section)
    const raceIndex = this.findSectionIndex(lines, 'Race:');
    const isSymbiosisChar = parasiteResult.isSymbiosis;

    if (isSymbiosisChar) {
      // This is a Symbiosis character
      character.isSymbiosis = true;
      character.symbiosisType = parasiteResult.symbiosisType;
      character.symbiosisHost = parasiteResult.symbiosisHost;
      character.isParasite = false;
      character.parasiteInfo = [];
      // Set race as Symbiosis
      character.race = { race: 'Symbiosis', subRace: parasiteResult.symbiosisType };
    } else {
      // This is a regular character (may or may not have a parasite)
      character.isParasite = parasiteResult.isParasite;
      character.parasiteInfo = parasiteResult.info;
      character.isSymbiosis = false;
    }

    // Parse Race (skip if already set for Symbiosis)
    if (!isSymbiosisChar) {
      character.race = this.parseRace(lines, raceIndex);
    }

    // Parse Archetypes (support multiple) - archetypes cannot be lost
    const archetypeIndex = this.findSectionIndex(lines, 'Archetype:');
    character.archetypes = this.parseListValueAsStrings(lines, archetypeIndex);

    // Parse Quirks
    const quirkIndex = this.findSectionIndex(lines, 'Quirk:');
    character.quirks = this.parseListValue(lines, quirkIndex);

    // Parse Stats
    character.stats = this.parseStats(lines);

    // Parse Houses - can have multiple, some may be lost (kicked out)
    const houseIndex = this.findSectionIndex(lines, 'Houses:');
    const housesRaw = this.parseListValueAsStrings(lines, houseIndex);
    character.houses = housesRaw.map(h => ({
      name: h,
      isLost: isLostItem(h)
    }));

    // Parse Gear
    character.gear = this.parseGear(lines);

    // Parse Weapons
    character.weapons = this.parseWeapons(lines);

    // Parse Runes
    character.runes = this.parseRunes(lines);

    // Parse Powers
    const powerIndex = this.findSectionIndex(lines, 'Power:');
    character.powers = this.parseListValue(lines, powerIndex);

    // Parse Character Development (support multiple)
    const charDevIndex = this.findSectionIndex(lines, 'Char dev:');
    character.charDevs = this.parseListValue(lines, charDevIndex);

    // Parse Team
    const teamIndex = this.findSectionIndex(lines, 'Team:');
    if (teamIndex >= 0 && lines[teamIndex + 1]) {
      const teamMatch = lines[teamIndex + 1].match(/\d+/);
      if (teamMatch) {
        character.team = parseInt(teamMatch[0]);
      }
    }

    // Parse Lover - lovers cannot be lost
    const loverIndex = this.findSectionIndex(lines, 'Lover:');
    const lovers = this.parseListValueAsStrings(lines, loverIndex);
    character.lover = lovers[0];

    // Parse PvP Rewards
    character.pvpRewards = this.parsePvPRewards(lines);

    return character as Character;
  }

  private static findSectionIndex(lines: string[], keyword: string): number {
    return lines.findIndex(line => line.includes(keyword));
  }

  private static parseParasiteInfo(lines: string[], startIndex: number): {
    isParasite: boolean;
    info: string[];
    isSymbiosis: boolean;
    symbiosisType?: string;
    symbiosisHost?: string;
  } {
    if (startIndex < 0) return { isParasite: false, info: [], isSymbiosis: false };

    const info: string[] = [];
    let hasContent = false;
    let isSymbiosis = false;
    let symbiosisType: string | undefined;
    let symbiosisHost: string | undefined;

    // Check if this line contains "Yes" indicating this IS a Symbiosis character
    const kyShinhLine = lines[startIndex];
    if (kyShinhLine && kyShinhLine.toLowerCase().includes('yes')) {
      isSymbiosis = true;
    }

    for (let i = startIndex + 1; i < Math.min(startIndex + 10, lines.length); i++) {
      const line = lines[i];

      // Stop at next section or code block end
      if (line.startsWith('```') && i > startIndex + 1) break;
      if (!line || line === '```') continue;

      // Parse list items starting with + or -
      const match = line.match(/^[+\-*]\s*(.+)/);
      if (match) {
        const value = match[1].trim();
        if (value) {
          info.push(value);
          hasContent = true;

          // For Symbiosis characters, first item is type, second is host
          if (isSymbiosis) {
            if (!symbiosisType) {
              symbiosisType = value;
            } else if (!symbiosisHost) {
              symbiosisHost = value;
            }
          }
        }
      } else if (line === '+' || line === '-') {
        // Just a + or - without content means placeholder
        continue;
      }
    }

    return { isParasite: hasContent && !isSymbiosis, info, isSymbiosis, symbiosisType, symbiosisHost };
  }

  private static parseRace(lines: string[], startIndex: number): CharacterRace {
    const race: CharacterRace = { race: '' };

    if (startIndex < 0) return race;

    for (let i = startIndex; i < Math.min(startIndex + 10, lines.length); i++) {
      const line = lines[i];

      const raceMatch = line.match(/Race:\s*(.+)/);
      if (raceMatch) {
        const fullRace = raceMatch[1].trim();

        // Check if this is a Reincarnator - format: "Reincarnator (Name) -> NewRace"
        const reincarnatorMatch = fullRace.match(/^Reincarnator\s*(\(.+\)\s*->\s*.*)$/i);
        if (reincarnatorMatch) {
          race.race = 'Reincarnator';
          race.reincarnatorInfo = reincarnatorMatch[1].trim();
        } else {
          race.race = fullRace;
        }
      }

      const subRaceMatch = line.match(/Sub-race:\s*(.+)/);
      if (subRaceMatch) {
        const subRace = subRaceMatch[1].trim();
        if (subRace && subRace !== '-') {
          race.subRace = subRace;
        }
      }
    }

    return race;
  }

  private static parseListValue(lines: string[], startIndex: number): LossableItem[] {
    if (startIndex < 0) return [];

    const values: LossableItem[] = [];

    for (let i = startIndex + 1; i < Math.min(startIndex + 20, lines.length); i++) {
      const line = lines[i];

      // Stop at next section or code block
      if (line.startsWith('```') && i > startIndex + 1) break;
      if (!line || line === '```') continue;

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

  private static parseListValueAsStrings(lines: string[], startIndex: number): string[] {
    if (startIndex < 0) return [];

    const values: string[] = [];

    for (let i = startIndex + 1; i < Math.min(startIndex + 20, lines.length); i++) {
      const line = lines[i];

      // Stop at next section or code block
      if (line.startsWith('```') && i > startIndex + 1) break;
      if (!line || line === '```') continue;

      // Parse list items starting with + or -
      const match = line.match(/^[+\-*]\s*(.+)/);
      if (match) {
        const value = match[1].trim();
        if (value) {
          values.push(value);
        }
      }
    }

    return values;
  }

  private static parseStats(lines: string[]): CharacterStats {
    const stats: CharacterStats = {
      str: 0,
      spd: 0,
      dur: 0,
      iq: 0,
      biq: 0,
      ma: 0
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

  private static parseGear(lines: string[]): Gear {
    const gear: Gear = {
      normalGear: [],
      legacyGear: []
    };

    const gearIndex = this.findSectionIndex(lines, 'Gear:');
    if (gearIndex < 0) return gear;

    let inNormalGear = false;
    let inLegacyGear = false;

    for (let i = gearIndex; i < Math.min(gearIndex + 30, lines.length); i++) {
      const line = lines[i];

      if (line.includes('Normal gear:')) {
        inNormalGear = true;
        inLegacyGear = false;
        continue;
      }

      if (line.includes('Legacy gear:')) {
        inNormalGear = false;
        inLegacyGear = true;
        continue;
      }

      if (line.startsWith('```') && i > gearIndex + 1) break;

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

    const weaponIndex = this.findSectionIndex(lines, 'Weapon');
    if (weaponIndex < 0) return weapons;

    let weaponType: 'Normal' | 'Unique' | 'Legacy' = 'Normal';

    // Determine weapon type from section header
    if (lines[weaponIndex].includes('Unique')) weaponType = 'Unique';
    if (lines[weaponIndex].includes('Legacy')) weaponType = 'Legacy';

    for (let i = weaponIndex + 1; i < Math.min(weaponIndex + 15, lines.length); i++) {
      const line = lines[i];

      if (line.startsWith('```') && i > weaponIndex + 1) break;

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
            usable: usableMatch ? !usableMatch[1].includes('không dùng') : undefined,
            isLost: lost || undefined
          });
        }
      }
    }

    return weapons;
  }

  private static parseRunes(lines: string[]): Rune {
    const rune: Rune = {
      runes: [],
      runeword: undefined
    };

    const runeIndex = this.findSectionIndex(lines, 'Rune:');
    if (runeIndex < 0) return rune;

    for (let i = runeIndex + 1; i < Math.min(runeIndex + 10, lines.length); i++) {
      const line = lines[i];

      if (line.startsWith('```') && i > runeIndex + 1) break;

      const runeMatch = line.match(/^[+\-*]\s*(.+)/);
      if (runeMatch) {
        const runeName = runeMatch[1].trim();
        if (runeName && !runeName.toLowerCase().includes('runeword')) {
          rune.runes.push(parseRuneItem(runeName));
        }
      }

      const runewordMatch = line.match(/Runeword:\s*(.+)/i);
      if (runewordMatch) {
        const runeword = runewordMatch[1].trim();
        if (runeword && runeword !== 'Không' && runeword !== '-') {
          rune.runeword = runeword;
        }
      }
    }

    return rune;
  }

  private static parsePvPRewards(lines: string[]): PvPReward[] {
    const rewards: PvPReward[] = [];

    const pvpIndex = this.findSectionIndex(lines, 'PvP Reward');
    if (pvpIndex < 0) return rewards;

    for (let i = pvpIndex + 1; i < Math.min(pvpIndex + 10, lines.length); i++) {
      const line = lines[i];

      if (line.startsWith('```') && i > pvpIndex + 1) break;

      const rewardMatch = line.match(/^[\-*]\s*(.+)/);
      if (rewardMatch) {
        const reward = rewardMatch[1].trim();
        if (reward) {
          rewards.push({
            description: reward,
            applied: false
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
    lines.push('');

    // Ký Sinh
    lines.push('```');
    lines.push('Ký Sinh:');
    lines.push(character.isParasite ? '+' : '+');
    lines.push('```');

    // Race
    lines.push('```');
    lines.push(`Race: ${character.race.race || ''}`);
    lines.push(`Sub-race: ${character.race.subRace || '-'}`);
    lines.push('```');
    lines.push('');

    // Archetypes
    lines.push('```');
    lines.push(`${character.archetypes?.length || 0} Archetype:`);
    if (character.archetypes && character.archetypes.length > 0) {
      character.archetypes.forEach(a => lines.push(`+ ${a}`));
    } else {
      lines.push('+');
    }
    lines.push('```');

    // Quirks
    lines.push('```');
    lines.push(`${character.quirks.length} Quirk:`);
    if (character.quirks.length > 0) {
      character.quirks.forEach(q => lines.push(`+ ${q.name}`));
    } else {
      lines.push('+');
    }
    lines.push('```');

    // Stats
    lines.push('```');
    lines.push(`Str: ${character.stats.str || ''}`);
    lines.push(`Spd: ${character.stats.spd || ''}`);
    lines.push(`Dur: ${character.stats.dur || ''}`);
    lines.push(`IQ: ${character.stats.iq || ''}`);
    lines.push(`BIQ: ${character.stats.biq || ''}`);
    lines.push(`MA: ${character.stats.ma || ''}`);
    lines.push('```');
    lines.push('');

    // Houses
    lines.push('```');
    lines.push('Houses:');
    if (character.houses && character.houses.length > 0) {
      character.houses.forEach(h => lines.push(`+ ${h.name}`));
    } else {
      lines.push('+');
    }
    lines.push('```');
    lines.push('');

    // Gear
    const totalGear = character.gear.normalGear.length + character.gear.legacyGear.length;
    lines.push('```');
    lines.push(`${totalGear} Gear:`);
    lines.push(` + ${character.gear.normalGear.length} Normal gear:`);
    if (character.gear.normalGear.length > 0) {
      character.gear.normalGear.forEach(g => lines.push(`  - ${g.name}`));
    } else {
      lines.push('  -');
    }
    lines.push(` + ${character.gear.legacyGear.length} Legacy gear:`);
    if (character.gear.legacyGear.length > 0) {
      character.gear.legacyGear.forEach(g => lines.push(`  - ${g.name}`));
    } else {
      lines.push('  -');
    }
    lines.push('```');
    lines.push('');

    // Weapons
    lines.push('```');
    lines.push(`${character.weapons.length} Normal Weapon`);
    if (character.weapons.length > 0) {
      character.weapons.forEach(w => {
        const usableText = w.usable === false ? ' (không dùng được)' : w.usable === true ? ' (Dùng được)' : '';
        lines.push(`+ ${w.name}${usableText}`);
      });
    } else {
      lines.push('+');
    }
    lines.push('```');
    lines.push('');

    // Runes
    lines.push('```');
    lines.push(`${character.runes.runes.length} Rune:`);
    if (character.runes.runes.length > 0) {
      character.runes.runes.forEach(r => lines.push(`+ ${r.name}`));
    } else {
      lines.push('+');
    }
    lines.push(`Runeword: ${character.runes.runeword || 'Không'}`);
    lines.push('```');
    lines.push('');

    // Powers
    lines.push('```');
    lines.push(`${character.powers.length} Power:`);
    if (character.powers.length > 0) {
      character.powers.forEach(p => lines.push(`+ ${p.name}`));
    } else {
      lines.push('+');
    }
    lines.push('```');
    lines.push('');

    // Char devs
    lines.push('```');
    lines.push(`${character.charDevs?.length || 0} Char dev:`);
    if (character.charDevs && character.charDevs.length > 0) {
      character.charDevs.forEach(c => lines.push(`+ ${c.name}`));
    } else {
      lines.push('+');
    }
    lines.push('```');
    lines.push('');

    // Team
    lines.push('```');
    lines.push(`Team: ${character.team || ''}`);
    lines.push('```');
    lines.push('');

    // Lover
    lines.push('```');
    lines.push('Lover:');
    lines.push(`+ ${character.lover || ''}`);
    lines.push('```');

    return lines.join('\n');
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
