/**
 * SandboxStatDisplay - Real-time stat display with effect breakdown
 */

import { useMemo, useState } from "react";
import type { Character, CharacterStats } from "../../types/character";
import { EffectResolver, type EffectSourceBreakdown } from "../../effects/resolver";

interface SandboxStatDisplayProps {
  character: Character | null;
}

const STAT_KEYS: { key: keyof CharacterStats; effectKey: string; label: string }[] = [
  { key: "str", effectKey: "strength", label: "STR" },
  { key: "spd", effectKey: "speed", label: "SPD" },
  { key: "dur", effectKey: "durability", label: "DUR" },
  { key: "iq", effectKey: "iq", label: "IQ" },
  { key: "biq", effectKey: "biq", label: "BIQ" },
  { key: "ma", effectKey: "ma", label: "MA" },
];

// Source type colors matching StatModifiersTable pattern
const SOURCE_COLORS: Record<string, string> = {
  race: "text-amber-400",
  sub_race: "text-amber-300",
  archetype: "text-pink-400",
  power: "text-red-400",
  gear: "text-blue-400",
  weapon: "text-yellow-400",
  rune: "text-orange-400",
  runeword: "text-orange-300",
  house: "text-cyan-400",
  house_sub: "text-cyan-300",
  char_dev: "text-teal-400",
  quirk: "text-purple-400",
  pvp_reward: "text-green-400",
  pve_reward: "text-green-300",
  pve_punishment: "text-red-500",
  other_source: "text-violet-400",
  symbiosis: "text-red-300",
  summon: "text-indigo-400",
};

export const SandboxStatDisplay = ({ character }: SandboxStatDisplayProps) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const { totalStats, baseStats, breakdown } = useMemo(() => {
    if (!character) {
      return {
        totalStats: null,
        baseStats: null,
        breakdown: [] as EffectSourceBreakdown[],
      };
    }

    const effects = EffectResolver.calculateCharacterEffects(character);
    const bd = EffectResolver.getCharacterEffectBreakdown(character);

    return {
      totalStats: effects.totalStats,
      baseStats: effects.baseStats,
      breakdown: bd,
    };
  }, [character]);

  if (!character || !totalStats || !baseStats) {
    return (
      <div className="text-center text-gray-500 text-sm py-4">
        Configure character to see stats
      </div>
    );
  }

  const totalPower = STAT_KEYS.reduce((sum, { effectKey }) => {
    return sum + (totalStats[effectKey as keyof typeof totalStats] || 0);
  }, 0);

  return (
    <div className="space-y-3">
      {/* Total Stats Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
            Total Stats
          </h3>
          <span className="text-xs text-gray-500">
            Power: {totalPower}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {STAT_KEYS.map(({ key, effectKey, label }) => {
            const base = character.stats[key];
            const total = totalStats[effectKey as keyof typeof totalStats] || 0;
            const diff = total - base;

            return (
              <div key={key} className="text-center bg-gray-700/50 rounded p-2">
                <div className="text-gray-400 text-xs">{label}</div>
                <div className="text-white font-bold text-lg">{total}</div>
                {diff !== 0 && (
                  <div
                    className={`text-xs ${diff > 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {diff > 0 ? "+" : ""}
                    {diff}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown Toggle */}
      {breakdown.length > 0 && (
        <div>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1"
          >
            <span className={`transition-transform ${showBreakdown ? "rotate-90" : ""}`}>
              ▶
            </span>
            Effect Breakdown ({breakdown.length} sources)
          </button>

          {showBreakdown && (
            <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
              {breakdown.map((source, idx) => {
                const colorClass = SOURCE_COLORS[source.type] || "text-gray-300";
                const hasStatChanges = source.statChanges.length > 0;

                return (
                  <div
                    key={`${source.type}-${source.name}-${idx}`}
                    className={`px-2 py-1.5 rounded text-xs ${
                      source.isActive
                        ? "bg-gray-700/50"
                        : "bg-gray-800/30 opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-medium ${colorClass}`}>
                        {source.name}
                      </span>
                      {hasStatChanges && (
                        <span className="text-gray-300 whitespace-nowrap">
                          {source.statChanges.map((sc, i) => {
                            const statLabel = STAT_KEYS.find(
                              (s) => s.effectKey === sc.stat,
                            )?.label || sc.stat.toUpperCase();
                            const prefix = sc.value > 0 ? "+" : "";
                            return (
                              <span
                                key={i}
                                className={`${sc.value > 0 ? "text-green-400" : "text-red-400"} ${i > 0 ? "ml-1" : ""}`}
                              >
                                {prefix}{sc.value} {statLabel}
                              </span>
                            );
                          })}
                        </span>
                      )}
                    </div>
                    {source.conditionalEffects && source.conditionalEffects.length > 0 && (
                      <div className="mt-0.5 text-gray-500">
                        {source.conditionalEffects.map((ce, i) => (
                          <div key={i}>{ce.description}</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
