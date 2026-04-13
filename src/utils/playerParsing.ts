import { Character, CharacterStats } from "../types/character";
import { CharacterParser } from "../utils/characterParser";
import { EffectResolver } from "../effects/resolver";
import { PvPPlayerData } from "../types/battleZone";
import { getRaceTierForTiebreak } from "../utils/combatStats";

export const parsePlayerFromText = (
  content: string,
  fallbackNo: number,
): PvPPlayerData | null => {
  try {
    const char = CharacterParser.parseCharacterFile(content);
    const effects = EffectResolver.calculateCharacterEffects(char, {
      isPvE: false,
    });
    const pvpStats: CharacterStats = {
      str: effects.totalStats.strength,
      spd: effects.totalStats.speed,
      dur: effects.totalStats.durability,
      iq: effects.totalStats.iq,
      biq: effects.totalStats.biq,
      ma: effects.totalStats.ma,
    };
    const pvpBaseStats: CharacterStats = { ...char.stats };
    const raceL = (char.race?.race || "").toLowerCase();
    if (raceL === "skeleton") {
      pvpBaseStats.iq = 1;
    } else if (raceL === "skeleton (lich)" || raceL === "skeleton (lich king)") {
      pvpBaseStats.iq = 8;
    }
    return {
      no: char.no || fallbackNo,
      name: char.name || `Player ${fallbackNo}`,
      username: char.username || "",
      race: char.race?.race || "Human",
      raceTier: getRaceTierForTiebreak(char),
      stats: pvpStats,
      baseStats: pvpBaseStats,
      breakdown: EffectResolver.getCharacterEffectBreakdown(char),
      character: char,
    };
  } catch {
    return null;
  }
};

// Re-resolve stats với allCharacters để cross-character effects (Cheater, v.v.) hoạt động đúng
export const reResolveWithAllChars = (
  player: PvPPlayerData,
  allChars: Character[],
): PvPPlayerData => {
  try {
    const char = player.character;
    if (!char) return player;
    const effects = EffectResolver.calculateCharacterEffects(
      char,
      { isPvE: false },
      allChars,
    );
    const pvpStats: CharacterStats = {
      str: effects.totalStats.strength,
      spd: effects.totalStats.speed,
      dur: effects.totalStats.durability,
      iq: effects.totalStats.iq,
      biq: effects.totalStats.biq,
      ma: effects.totalStats.ma,
    };
    return {
      ...player,
      stats: pvpStats,
      breakdown: EffectResolver.getCharacterEffectBreakdown(
        char,
        undefined,
        allChars,
      ),
    };
  } catch {
    return player;
  }
};
