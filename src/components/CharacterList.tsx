import React, { useState, useEffect } from 'react';
import type { Character, CharacterSummary } from '../types/character';
import { characterManager } from '../managers/CharacterManager';
import { CharacterCard } from './CharacterCard';

export const CharacterList: React.FC = () => {
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRace, setFilterRace] = useState('');
  const [filterHouse, setFilterHouse] = useState('');

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setLoading(true);
      await characterManager.loadCharacters();
      setCharacters(characterManager.getCharacterSummaries());
    } catch (error) {
      console.error('Error loading characters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterClick = (no: number) => {
    const char = characterManager.getCharacter(no);
    if (char) {
      setSelectedCharacter(char);
    }
  };

  const filteredCharacters = characters.filter(char => {
    const matchesSearch = searchQuery === '' ||
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRace = filterRace === '' ||
      char.race.toLowerCase().includes(filterRace.toLowerCase());

    const matchesHouse = filterHouse === '' ||
      char.house?.toLowerCase().includes(filterHouse.toLowerCase());

    return matchesSearch && matchesRace && matchesHouse;
  });

  const uniqueRaces = Array.from(new Set(characters.map(c => c.race)));
  const uniqueHouses = Array.from(new Set(characters.map(c => c.house).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading characters...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Character Database</h1>
        <p className="text-gray-600">Total: {characters.length} characters</p>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search by name or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={filterRace}
          onChange={(e) => setFilterRace(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Races</option>
          {uniqueRaces.map(race => (
            <option key={race} value={race}>{race}</option>
          ))}
        </select>

        <select
          value={filterHouse}
          onChange={(e) => setFilterHouse(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Houses</option>
          {uniqueHouses.map(house => (
            <option key={house} value={house}>{house}</option>
          ))}
        </select>
      </div>

      {/* Character Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCharacters.map(char => (
          <div
            key={char.no}
            onClick={() => handleCharacterClick(char.no)}
            className="bg-white rounded-none shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-gray-800">{char.name}</h3>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                #{char.no}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-3">@{char.username}</p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {char.race}
                </span>
                {char.nestedArchetypes && char.nestedArchetypes.length > 0 ? (
                  char.nestedArchetypes.map((arch, i) => (
                    <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {arch.name}
                      {arch.subType && ` → ${arch.subType}`}
                      {arch.subSubType && ` → ${arch.subSubType}`}
                    </span>
                  ))
                ) : char.archetypes && char.archetypes.map((archetype, i) => (
                  <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {archetype}
                  </span>
                ))}
              </div>

              {char.house && (
                <div className="text-xs text-gray-600">
                  🏰 {char.house}
                </div>
              )}

              {char.team && (
                <div className="text-xs text-gray-600">
                  👥 Team {char.team}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredCharacters.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No characters found matching your filters.
        </div>
      )}

      {/* Character Detail Modal */}
      {selectedCharacter && (
        <CharacterCard
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
    </div>
  );
};
