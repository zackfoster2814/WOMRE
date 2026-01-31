import type { Character, CharacterSummary, CharacterDatabase } from '../types/character';
import { CharacterParser } from '../utils/characterParser';
import { getAssetPath } from '../utils/basePath';

export class CharacterManager {
  private characters: Map<number, Character> = new Map();
  private loaded: boolean = false;

  /**
   * Load all characters from data files
   */
  async loadCharacters(): Promise<void> {
    try {
      // Get list of character files
      const files = await this.getCharacterFiles();

      // Load and parse each file
      const fileContents = new Map<string, string>();

      for (const file of files) {
        try {
          const response = await fetch(file);
          const content = await response.text();
          fileContents.set(file, content);
        } catch (error) {
          console.error(`Error loading ${file}:`, error);
        }
      }

      // Parse characters
      const parsedCharacters = CharacterParser.parseMultipleFiles(fileContents);

      // Store in map
      this.characters.clear();
      for (const char of parsedCharacters) {
        this.characters.set(char.no, char);
      }

      this.loaded = true;
      console.log(`Loaded ${this.characters.size} characters`);
    } catch (error) {
      console.error('Error loading characters:', error);
      throw error;
    }
  }

  /**
   * Get list of character data files
   */
  private async getCharacterFiles(): Promise<string[]> {
    // In production, these files should be in public/data/
    const characterNumbers = [35, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50];
    return characterNumbers.map(no => getAssetPath(`/data/No${no}.txt`));
  }

  /**
   * Get character by number
   */
  getCharacter(no: number): Character | undefined {
    return this.characters.get(no);
  }

  /**
   * Get character by username
   */
  getCharacterByUsername(username: string): Character | undefined {
    for (const char of this.characters.values()) {
      if (char.username.toLowerCase() === username.toLowerCase()) {
        return char;
      }
    }
    return undefined;
  }

  /**
   * Get all characters
   */
  getAllCharacters(): Character[] {
    return Array.from(this.characters.values()).sort((a, b) => a.no - b.no);
  }

  /**
   * Get character summaries for display
   */
  getCharacterSummaries(): CharacterSummary[] {
    return this.getAllCharacters().map(char => ({
      no: char.no,
      name: char.name,
      username: char.username,
      race: char.race.race,
      archetypes: char.archetypes,
      nestedArchetypes: char.nestedArchetypes,
      team: char.team,
      house: char.houses?.find(h => !h.isLost)?.name,
      nestedHouses: char.nestedHouses
    }));
  }

  /**
   * Filter characters by various criteria
   */
  filterCharacters(filters: {
    race?: string;
    archetype?: string;
    house?: string;
    team?: number;
    hasLover?: boolean;
  }): Character[] {
    let results = this.getAllCharacters();

    if (filters.race) {
      results = results.filter(char =>
        char.race.race.toLowerCase().includes(filters.race!.toLowerCase())
      );
    }

    if (filters.archetype) {
      results = results.filter(char =>
        char.archetypes.some(a => a.toLowerCase().includes(filters.archetype!.toLowerCase()))
      );
    }

    if (filters.house) {
      results = results.filter(char =>
        char.houses?.some(h => !h.isLost && h.name.toLowerCase().includes(filters.house!.toLowerCase()))
      );
    }

    if (filters.team !== undefined) {
      results = results.filter(char => char.team === filters.team);
    }

    if (filters.hasLover !== undefined) {
      results = results.filter(char =>
        filters.hasLover ? !!char.lover : !char.lover
      );
    }

    return results;
  }

  /**
   * Get characters by team
   */
  getCharactersByTeam(team: number): Character[] {
    return this.getAllCharacters().filter(char => char.team === team);
  }

  /**
   * Get characters by house
   */
  getCharactersByHouse(house: string): Character[] {
    return this.getAllCharacters().filter(char =>
      char.houses?.some(h => !h.isLost && h.name.toLowerCase().includes(house.toLowerCase()))
    );
  }

  /**
   * Search characters by name or username
   */
  searchCharacters(query: string): Character[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllCharacters().filter(char =>
      char.name.toLowerCase().includes(lowerQuery) ||
      char.username.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get random character
   */
  getRandomCharacter(): Character | undefined {
    const characters = this.getAllCharacters();
    if (characters.length === 0) return undefined;

    const randomIndex = Math.floor(Math.random() * characters.length);
    return characters[randomIndex];
  }

  /**
   * Get random characters (for wheel)
   */
  getRandomCharacters(count: number): Character[] {
    const characters = this.getAllCharacters();
    const shuffled = [...characters].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, characters.length));
  }

  /**
   * Get character stats summary
   */
  getStatsSummary() {
    const characters = this.getAllCharacters();

    return {
      totalCharacters: characters.length,
      races: this.getUniqueValues(characters.map(c => c.race.race)),
      archetypes: this.getUniqueValues(characters.flatMap(c => c.archetypes)),
      houses: this.getUniqueValues(characters.flatMap(c => c.houses?.filter(h => !h.isLost).map(h => h.name) || [])),
      teams: this.getUniqueValues(characters.map(c => c.team).filter(Boolean) as number[]),
      withLovers: characters.filter(c => c.lover).length,
      withParasite: characters.filter(c => c.isParasite).length
    };
  }

  private getUniqueValues<T>(array: T[]): T[] {
    return Array.from(new Set(array));
  }

  /**
   * Export characters to JSON
   */
  exportToJSON(): CharacterDatabase {
    return {
      characters: this.getAllCharacters(),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Check if characters are loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get character count
   */
  getCharacterCount(): number {
    return this.characters.size;
  }

  /**
   * Calculate total combat power
   */
  getCharacterPower(char: Character): number {
    const stats = char.stats;
    return stats.str + stats.spd + stats.dur + stats.iq + stats.biq + stats.ma;
  }

  /**
   * Get strongest characters
   */
  getStrongestCharacters(count: number = 5): Character[] {
    return this.getAllCharacters()
      .sort((a, b) => this.getCharacterPower(b) - this.getCharacterPower(a))
      .slice(0, count);
  }

  /**
   * Get character display name (for wheel)
   */
  getDisplayName(char: Character): string {
    return `${char.name} (${char.username})`;
  }
}

// Singleton instance
export const characterManager = new CharacterManager();
