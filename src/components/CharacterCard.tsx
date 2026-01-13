import React from 'react';
import type { Character } from '../types/character';

interface CharacterCardProps {
  character: Character;
  onClose?: () => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onClose }) => {
  const totalPower = Object.values(character.stats).reduce((sum, val) => sum + val, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold">{character.name}</h2>
              <p className="text-purple-200">@{character.username}</p>
              <p className="text-sm mt-2">No. {character.no}</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            )}
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            {character.isParasite && (
              <span className="bg-red-500 px-3 py-1 rounded-full text-sm">
                Ký Sinh
              </span>
            )}
            <span className="bg-blue-500 px-3 py-1 rounded-full text-sm">
              {character.race.race}
              {character.race.subRace && ` - ${character.race.subRace}`}
            </span>
            <span className="bg-green-500 px-3 py-1 rounded-full text-sm">
              {character.archetype}
            </span>
            {character.house && (
              <span className="bg-yellow-600 px-3 py-1 rounded-full text-sm">
                {character.house}
              </span>
            )}
            {character.team && (
              <span className="bg-indigo-500 px-3 py-1 rounded-full text-sm">
                Team {character.team}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Stats (Total: {totalPower})</h3>
            <div className="grid grid-cols-3 gap-4">
              <StatBar label="STR" value={character.stats.str} max={10} color="bg-red-500" />
              <StatBar label="SPD" value={character.stats.spd} max={10} color="bg-yellow-500" />
              <StatBar label="DUR" value={character.stats.dur} max={10} color="bg-green-500" />
              <StatBar label="IQ" value={character.stats.iq} max={10} color="bg-blue-500" />
              <StatBar label="BIQ" value={character.stats.biq} max={10} color="bg-purple-500" />
              <StatBar label="MA" value={character.stats.ma} max={10} color="bg-pink-500" />
            </div>
          </div>

          {/* Quirks */}
          {character.quirks.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Quirks</h3>
              <div className="flex flex-wrap gap-2">
                {character.quirks.map((quirk, i) => (
                  <span key={i} className="bg-gray-200 px-3 py-1 rounded-full text-sm">
                    {quirk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Powers */}
          {character.powers.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Powers</h3>
              <ul className="list-disc list-inside space-y-1">
                {character.powers.map((power, i) => (
                  <li key={i} className="text-gray-700">{power}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Weapons */}
          {character.weapons.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Weapons</h3>
              <div className="space-y-2">
                {character.weapons.map((weapon, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      weapon.type === 'Unique' ? 'bg-orange-500 text-white' :
                      weapon.type === 'Legacy' ? 'bg-purple-500 text-white' :
                      'bg-gray-300'
                    }`}>
                      {weapon.type}
                    </span>
                    <span className="text-gray-700">{weapon.name}</span>
                    {weapon.usable === false && (
                      <span className="text-red-500 text-sm">(không dùng được)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gear */}
          {(character.gear.normalGear.length > 0 || character.gear.legacyGear.length > 0) && (
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Gear</h3>
              {character.gear.normalGear.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-semibold text-gray-700 mb-2">Normal Gear:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {character.gear.normalGear.map((item, i) => (
                      <li key={i} className="text-gray-600 text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {character.gear.legacyGear.length > 0 && (
                <div>
                  <h4 className="font-semibold text-purple-700 mb-2">Legacy Gear:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {character.gear.legacyGear.map((item, i) => (
                      <li key={i} className="text-purple-600 text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Runes */}
          {character.runes.runes.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Runes</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {character.runes.runes.map((rune, i) => (
                  <span key={i} className="bg-amber-100 border border-amber-400 px-3 py-1 rounded text-sm">
                    {rune}
                  </span>
                ))}
              </div>
              {character.runes.runeword && (
                <p className="mt-2 text-sm">
                  <span className="font-semibold">Runeword:</span>{' '}
                  <span className="text-amber-700">{character.runes.runeword}</span>
                </p>
              )}
            </div>
          )}

          {/* Character Development */}
          {character.charDev && (
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Character Development</h3>
              <p className="text-gray-700 bg-blue-50 p-3 rounded">{character.charDev}</p>
            </div>
          )}

          {/* Lover */}
          {character.lover && (
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Lover</h3>
              <p className="text-pink-600">❤️ {character.lover}</p>
            </div>
          )}

          {/* PvP Rewards */}
          {character.pvpRewards && character.pvpRewards.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">PvP Rewards</h3>
              <ul className="list-disc list-inside space-y-1">
                {character.pvpRewards.map((reward, i) => (
                  <li key={i} className="text-green-700">{reward.description}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, max, color }) => {
  const percentage = (value / max) * 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
