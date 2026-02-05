import React, { useMemo } from "react";
import type { Character } from "../types/character";
import { EffectResolver } from "../effects/resolver";
import { initializeEffectData } from "../effects/data";
import type { CharacterEffects } from "../effects/types";

// Initialize effect data once
let effectsInitialized = false;
function ensureEffectsInitialized() {
  if (!effectsInitialized) {
    initializeEffectData();
    effectsInitialized = true;
  }
}

interface CharacterCardProps {
  character: Character;
  onClose?: () => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onClose,
}) => {
  // Initialize effects and calculate total stats
  ensureEffectsInitialized();

  const characterEffects: CharacterEffects = useMemo(() => {
    return EffectResolver.calculateCharacterEffects(character);
  }, [character]);

  const baseTotal = Object.values(character.stats).reduce(
    (sum, val) => sum + val,
    0,
  );

  const totalPower = Object.values(characterEffects.totalStats).reduce(
    (sum, val) => sum + val,
    0,
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4">
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
            {character.nestedArchetypes && character.nestedArchetypes.length > 0
              ? character.nestedArchetypes.map((arch, i) => (
                  <span
                    key={i}
                    className="bg-green-500 px-3 py-1 rounded-full text-sm"
                  >
                    {arch.name}
                    {arch.subType && ` → ${arch.subType}`}
                    {arch.subSubType && ` → ${arch.subSubType}`}
                  </span>
                ))
              : character.archetypes &&
                character.archetypes.map((archetype, i) => (
                  <span
                    key={i}
                    className="bg-green-500 px-3 py-1 rounded-full text-sm"
                  >
                    {archetype}
                  </span>
                ))}
            {character.nestedHouses && character.nestedHouses.length > 0
              ? character.nestedHouses
                  .filter((h) => !h.isLost)
                  .map((house, idx) => (
                    <span
                      key={idx}
                      className="bg-yellow-600 px-3 py-1 rounded-full text-sm"
                    >
                      {house.name}
                      {house.subType && ` → ${house.subType}`}
                    </span>
                  ))
              : character.houses &&
                character.houses
                  .filter((h) => !h.isLost)
                  .map((house, idx) => (
                    <span
                      key={idx}
                      className="bg-yellow-600 px-3 py-1 rounded-full text-sm"
                    >
                      {house.name}
                    </span>
                  ))}
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
            <h3 className="text-xl font-bold mb-3 text-gray-800">
              Stats (Base: {baseTotal} → Total: {totalPower})
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <StatBar
                label="STR"
                baseValue={character.stats.str}
                totalValue={characterEffects.totalStats.strength}
                max={15}
                color="bg-red-500"
              />
              <StatBar
                label="SPD"
                baseValue={character.stats.spd}
                totalValue={characterEffects.totalStats.speed}
                max={15}
                color="bg-yellow-500"
              />
              <StatBar
                label="DUR"
                baseValue={character.stats.dur}
                totalValue={characterEffects.totalStats.durability}
                max={15}
                color="bg-green-500"
              />
              <StatBar
                label="IQ"
                baseValue={character.stats.iq}
                totalValue={characterEffects.totalStats.iq}
                max={15}
                color="bg-blue-500"
              />
              <StatBar
                label="BIQ"
                baseValue={character.stats.biq}
                totalValue={characterEffects.totalStats.biq}
                max={15}
                color="bg-purple-500"
              />
              <StatBar
                label="MA"
                baseValue={character.stats.ma}
                totalValue={characterEffects.totalStats.ma}
                max={15}
                color="bg-pink-500"
              />
            </div>
          </div>

          {/* Quirks */}
          {character.quirks && character.quirks.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Quirks</h3>
              <div className="flex flex-wrap gap-2">
                {character.quirks.map((quirk, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1 rounded-full text-sm ${
                      quirk.isLost
                        ? "bg-gray-100 text-gray-400 line-through"
                        : "bg-gray-200"
                    }`}
                  >
                    {quirk.name}
                    {quirk.isLost && (
                      <span className="text-red-400 text-xs ml-1">
                        (đã mất)
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Powers */}
          {character.powers && character.powers.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Powers</h3>
              <ul className="list-disc list-inside space-y-1">
                {character.powers.map((power, i) => (
                  <li
                    key={i}
                    className={
                      power.isLost
                        ? "text-gray-400 line-through"
                        : "text-gray-700"
                    }
                  >
                    {power.name}
                    {power.isLost && (
                      <span className="text-red-400 text-xs ml-1">
                        (đã mất)
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gear */}
          {character.gear &&
            (character.gear.normalGear?.length > 0 ||
              character.gear.legacyGear?.length > 0) && (
              <div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">Gear</h3>
                {character.gear.normalGear?.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Normal Gear:
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {character.gear.normalGear.map((item, i) => (
                        <li
                          key={i}
                          className={`text-sm ${item.isLost ? "text-gray-400 line-through" : "text-gray-600"}`}
                        >
                          {item.name}
                          {item.isLost && (
                            <span className="text-red-400 text-xs ml-1">
                              (đã mất)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {character.gear.legacyGear?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-purple-700 mb-2">
                      Legacy Gear:
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {character.gear.legacyGear.map((item, i) => (
                        <li
                          key={i}
                          className={`text-sm ${item.isLost ? "text-gray-400 line-through" : "text-purple-600"}`}
                        >
                          {item.name}
                          {item.isLost && (
                            <span className="text-red-400 text-xs ml-1">
                              (đã mất)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

          {/* Weapons */}
          {character.weapons && character.weapons.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Weapons</h3>
              <div className="space-y-2">
                {character.weapons.map((weapon, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        weapon.type === "Unique"
                          ? "bg-orange-500 text-white"
                          : weapon.type === "Legacy"
                            ? "bg-purple-500 text-white"
                            : "bg-gray-300"
                      }`}
                    >
                      {weapon.type}
                    </span>
                    <span className="text-gray-700">{weapon.name}</span>
                    {weapon.usable === false && (
                      <span className="text-red-500 text-sm">
                        (không dùng được)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Runes */}
          {character.runes?.runes?.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Runes</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {character.runes.runes.map((rune, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1 rounded text-sm border ${
                      rune.isLost
                        ? "bg-gray-100 border-gray-300 text-gray-400 line-through"
                        : "bg-amber-100 border-amber-400"
                    }`}
                  >
                    {rune.name}
                    {rune.isLost && (
                      <span className="text-red-400 text-xs ml-1">
                        (đã mất)
                      </span>
                    )}
                  </span>
                ))}
              </div>
              {character.runes.runeword && (
                <p className="mt-2 text-sm">
                  <span className="font-semibold">Runeword:</span>{" "}
                  <span className="text-amber-700">
                    {character.runes.runeword}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Character Development */}
          {character.charDevs && character.charDevs.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">
                Character Development
              </h3>
              <div className="space-y-2">
                {character.charDevs.map((charDev, i) => (
                  <p
                    key={i}
                    className={`p-3 rounded ${
                      charDev.isLost
                        ? "bg-gray-100 text-gray-400 line-through"
                        : "text-gray-700 bg-blue-50"
                    }`}
                  >
                    {charDev.name}
                    {charDev.isLost && (
                      <span className="text-red-400 text-xs ml-1">
                        (đã mất)
                      </span>
                    )}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Lover */}
          {character.lover && character.lover.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Lover</h3>
              <div className="space-y-2">
                {character.lover.map((loverName, idx) => (
                  <p
                    key={idx}
                    className={
                      loverName.isLost
                        ? "text-pink-400 line-through"
                        : "text-pink-600"
                    }
                  >
                    ❤️ {loverName.name}
                    {loverName.isLost && (
                      <span className="text-red-400 text-xs ml-1">
                        (đã mất)
                      </span>
                    )}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* PvP Rewards */}
          {character.pvpRewards && character.pvpRewards.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">
                PvP Rewards
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {character.pvpRewards.map((reward, i) => (
                  <li key={i} className="text-green-700">
                    {reward.description}
                  </li>
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
  baseValue: number;
  totalValue: number;
  max: number;
  color: string;
}

const StatBar: React.FC<StatBarProps> = ({
  label,
  baseValue,
  totalValue,
  max,
  color,
}) => {
  const basePercentage = (baseValue / max) * 100;
  const totalPercentage = (totalValue / max) * 100;
  const diff = totalValue - baseValue;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm">
          <span className="text-gray-400">{baseValue}</span>
          <span className="text-gray-400 mx-1">→</span>
          <span
            className={`font-bold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-600"}`}
          >
            {totalValue}
          </span>
          {diff !== 0 && (
            <span
              className={`text-xs ml-1 ${diff > 0 ? "text-green-500" : "text-red-500"}`}
            >
              ({diff > 0 ? "+" : ""}
              {diff})
            </span>
          )}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 relative">
        {/* Base stat bar (lighter) */}
        <div
          className={`${color} opacity-30 h-2 rounded-full absolute`}
          style={{ width: `${Math.min(basePercentage, 100)}%` }}
        />
        {/* Total stat bar */}
        <div
          className={`${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(totalPercentage, 100)}%` }}
        />
      </div>
    </div>
  );
};
