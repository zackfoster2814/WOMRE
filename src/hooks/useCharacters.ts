import { useState, useEffect } from 'react';
import type { Character } from '../types/character';
import { characterManager } from '../managers/CharacterManager';

export const useCharacters = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        setLoading(true);
        setError(null);
        await characterManager.loadCharacters();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load characters');
      } finally {
        setLoading(false);
      }
    };

    if (!characterManager.isLoaded()) {
      loadCharacters();
    } else {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    isLoaded: characterManager.isLoaded(),
    characterCount: characterManager.getCharacterCount()
  };
};

export const useCharactersList = () => {
  const { loading, error, isLoaded } = useCharacters();
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    if (isLoaded) {
      setCharacters(characterManager.getAllCharacters());
    }
  }, [isLoaded]);

  return {
    characters,
    loading,
    error,
    refresh: () => setCharacters(characterManager.getAllCharacters())
  };
};

export const useCharacter = (no: number | undefined) => {
  const { loading, error, isLoaded } = useCharacters();
  const [character, setCharacter] = useState<Character | null>(null);

  useEffect(() => {
    if (isLoaded && no !== undefined) {
      const char = characterManager.getCharacter(no);
      setCharacter(char || null);
    }
  }, [isLoaded, no]);

  return {
    character,
    loading,
    error
  };
};

export const useCharacterSearch = (query: string) => {
  const { loading, error, isLoaded } = useCharacters();
  const [results, setResults] = useState<Character[]>([]);

  useEffect(() => {
    if (isLoaded) {
      if (query.trim() === '') {
        setResults([]);
      } else {
        setResults(characterManager.searchCharacters(query));
      }
    }
  }, [isLoaded, query]);

  return {
    results,
    loading,
    error
  };
};

export const useCharacterFilter = (filters: {
  race?: string;
  archetype?: string;
  house?: string;
  team?: number;
  hasLover?: boolean;
}) => {
  const { loading, error, isLoaded } = useCharacters();
  const [results, setResults] = useState<Character[]>([]);

  useEffect(() => {
    if (isLoaded) {
      setResults(characterManager.filterCharacters(filters));
    }
  }, [isLoaded, filters]);

  return {
    results,
    loading,
    error
  };
};

export const useRandomCharacter = () => {
  const { isLoaded } = useCharacters();

  const getRandomCharacter = () => {
    if (!isLoaded) return null;
    return characterManager.getRandomCharacter();
  };

  return { getRandomCharacter };
};

export const useRandomCharacters = (count: number) => {
  const { isLoaded } = useCharacters();

  const getRandomCharacters = () => {
    if (!isLoaded) return [];
    return characterManager.getRandomCharacters(count);
  };

  return { getRandomCharacters };
};

export const useCharacterWheel = () => {
  const { isLoaded } = useCharacters();
  const [wheelCharacters, setWheelCharacters] = useState<Character[]>([]);

  const loadWheelCharacters = (count?: number) => {
    if (!isLoaded) return;

    if (count) {
      setWheelCharacters(characterManager.getRandomCharacters(count));
    } else {
      setWheelCharacters(characterManager.getAllCharacters());
    }
  };

  const getWheelItems = () => {
    return wheelCharacters.map(char => ({
      id: char.no,
      label: characterManager.getDisplayName(char),
      character: char
    }));
  };

  return {
    wheelCharacters,
    loadWheelCharacters,
    getWheelItems,
    isLoaded
  };
};

export const useCharacterStats = () => {
  const { loading, error, isLoaded } = useCharacters();
  const [stats, setStats] = useState<ReturnType<typeof characterManager.getStatsSummary> | null>(null);

  useEffect(() => {
    if (isLoaded) {
      setStats(characterManager.getStatsSummary());
    }
  }, [isLoaded]);

  return {
    stats,
    loading,
    error
  };
};
