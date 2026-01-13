import type { Character, CharacterStats, CharacterRace, Gear, Weapon, Rune, PvPReward } from '../types/character';

export class CharacterParser {
  /**
   * Parse character text file content into Character object
   */
  static parseCharacterFile(content: string): Character {
    const lines = content.split('\n').map(line => line.trim());

    const character: Partial<Character> = {};

    // Parse No and Name
    const noMatch = lines[0].match(/No\.(\d+)/);
    if (noMatch) {
      character.no = parseInt(noMatch[1]);
    }

    const nameMatch = lines[1]?.match(/Name:\s*(.+?)\s*\((.+?)\)/);
    if (nameMatch) {
      character.name = nameMatch[1].trim();
      character.username = nameMatch[2].trim();
    }

    // Parse Ký Sinh (Parasite)
    const kyShinhIndex = this.findSectionIndex(lines, 'Ký Sinh:');
    character.isParasite = this.checkBooleanValue(lines, kyShinhIndex);

    // Parse Race
    const raceIndex = this.findSectionIndex(lines, 'Race:');
    character.race = this.parseRace(lines, raceIndex);

    // Parse Archetype
    const archetypeIndex = this.findSectionIndex(lines, 'Archetype:');
    character.archetype = this.parseListValue(lines, archetypeIndex)[0] || '';

    // Parse Quirks
    const quirkIndex = this.findSectionIndex(lines, 'Quirk:');
    character.quirks = this.parseListValue(lines, quirkIndex);

    // Parse Stats
    character.stats = this.parseStats(lines);

    // Parse House
    const houseIndex = this.findSectionIndex(lines, 'Houses:');
    const houses = this.parseListValue(lines, houseIndex);
    character.house = houses[0];

    // Parse Gear
    character.gear = this.parseGear(lines);

    // Parse Weapons
    character.weapons = this.parseWeapons(lines);

    // Parse Runes
    character.runes = this.parseRunes(lines);

    // Parse Powers
    const powerIndex = this.findSectionIndex(lines, 'Power:');
    character.powers = this.parseListValue(lines, powerIndex);

    // Parse Character Development
    const charDevIndex = this.findSectionIndex(lines, 'Char dev:');
    const charDevs = this.parseListValue(lines, charDevIndex);
    character.charDev = charDevs[0];

    // Parse Team
    const teamIndex = this.findSectionIndex(lines, 'Team:');
    if (teamIndex >= 0 && lines[teamIndex + 1]) {
      const teamMatch = lines[teamIndex + 1].match(/\d+/);
      if (teamMatch) {
        character.team = parseInt(teamMatch[0]);
      }
    }

    // Parse Lover
    const loverIndex = this.findSectionIndex(lines, 'Lover:');
    const lovers = this.parseListValue(lines, loverIndex);
    character.lover = lovers[0];

    // Parse PvP Rewards
    character.pvpRewards = this.parsePvPRewards(lines);

    return character as Character;
  }

  private static findSectionIndex(lines: string[], keyword: string): number {
    return lines.findIndex(line => line.includes(keyword));
  }

  private static checkBooleanValue(lines: string[], startIndex: number): boolean {
    if (startIndex < 0) return false;
    for (let i = startIndex + 1; i < Math.min(startIndex + 5, lines.length); i++) {
      if (lines[i] === '+' || lines[i].startsWith('+')) return true;
      if (lines[i] === '-' || lines[i].startsWith('-')) return false;
    }
    return false;
  }

  private static parseRace(lines: string[], startIndex: number): CharacterRace {
    const race: CharacterRace = { race: '' };

    if (startIndex < 0) return race;

    for (let i = startIndex; i < Math.min(startIndex + 10, lines.length); i++) {
      const line = lines[i];

      const raceMatch = line.match(/Race:\s*(.+)/);
      if (raceMatch) {
        race.race = raceMatch[1].trim();
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

  private static parseListValue(lines: string[], startIndex: number): string[] {
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

      const iqMatch = line.match(/IQ:\s*(\d+)/i);
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
            gear.normalGear.push(item);
          } else if (inLegacyGear) {
            gear.legacyGear.push(item);
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
          const name = weaponText.replace(/\s*\(.+?\)\s*$/, '').trim();

          weapons.push({
            type: weaponType,
            name: name,
            usable: usableMatch ? !usableMatch[1].includes('không dùng') : undefined
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
          rune.runes.push(runeName);
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
