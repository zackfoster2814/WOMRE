import { useState } from "react";
import type { EffectSourceBreakdown } from "../effects/resolver";
import type { EffectSourceType } from "../effects/types";

interface StatModifiersTableProps {
  breakdown: EffectSourceBreakdown[];
  baseStats: {
    str: number;
    spd: number;
    dur: number;
    iq: number;
    biq: number;
    ma: number;
  };
  originalBaseStats?: {
    str: number;
    spd: number;
    dur: number;
    iq: number;
    biq: number;
    ma: number;
  };
  tournamentInfo?: {
    bracket?: string;
    round?: string;
  };
}

const sourceTypeLabels: Record<EffectSourceType, string> = {
  race: "Race",
  sub_race: "Sub-race",
  archetype: "Archetype",
  archetype_sub: "Archetype (sub)",
  house_sub: "House (sub)",
  quirk: "Quirk",
  power: "Power",
  summon: "Summon",
  gear: "Gear",
  weapon: "Weapon",
  rune: "Rune",
  runeword: "Runeword",
  house: "House",
  char_dev: "Char Dev",
  pvp_reward: "PvP Reward",
  pve_punishment: "PvE Punishment",
  pve_reward: "PvE Reward",
  other_source: "Nguồn khác",
  lover: "Lover",
  symbiosis: "Symbiosis",
};

const sourceTypeColors: Record<EffectSourceType, string> = {
  race: "text-amber-400",
  sub_race: "text-amber-300",
  archetype: "text-pink-400",
  archetype_sub: "text-pink-300",
  house_sub: "text-cyan-300",
  quirk: "text-purple-400",
  power: "text-red-400",
  summon: "text-red-300",
  gear: "text-blue-400",
  weapon: "text-yellow-400",
  rune: "text-orange-400",
  runeword: "text-orange-300",
  house: "text-cyan-400",
  char_dev: "text-teal-400",
  pvp_reward: "text-green-400",
  pve_punishment: "text-red-500",
  pve_reward: "text-green-400",
  other_source: "text-violet-400",
  lover: "text-pink-300",
  symbiosis: "text-red-300",
};

const StatModifiersTable = ({
  breakdown,
  baseStats,
  originalBaseStats,
  tournamentInfo,
}: StatModifiersTableProps) => {
  const [allEffectsOpen, setAllEffectsOpen] = useState(false);
  const [conditionalOpen, setConditionalOpen] = useState(false);

  const statKeys: Array<
    "strength" | "speed" | "durability" | "iq" | "biq" | "ma"
  > = ["strength", "speed", "durability", "iq", "biq", "ma"];
  const statLabels = ["STR", "SPD", "DUR", "IQ", "BIQ", "MA"];

  // Filter sources with stat changes (exclude disabled sources like unusable weapons)
  const sourcesWithStats = breakdown.filter(
    (s) => s.statChanges.length > 0 && !s.isDisabled,
  );

  // Filter sources with conditional effects (effects that trigger on win/lose/combat)
  // Also exclude disabled sources
  const sourcesWithConditionalEffects = breakdown.filter(
    (s) =>
      s.conditionalEffects && s.conditionalEffects.length > 0 && !s.isDisabled,
  );

  // Calculate totals for each stat
  const totals = statKeys.map((statKey, idx) => {
    const baseValue =
      idx === 0
        ? baseStats.str
        : idx === 1
          ? baseStats.spd
          : idx === 2
            ? baseStats.dur
            : idx === 3
              ? baseStats.iq
              : idx === 4
                ? baseStats.biq
                : baseStats.ma;

    const bonusValue = sourcesWithStats.reduce((sum, source) => {
      const changes = source.statChanges.filter((c) => c.stat === statKey);
      return sum + changes.reduce((s, c) => s + (c.value || 0), 0);
    }, 0);

    return {
      base: baseValue,
      bonus: bonusValue,
      total: baseValue + bonusValue,
    };
  });

  // Get all stat changes for a source and stat (may have both base and non-base)
  const getStatChanges = (
    source: EffectSourceBreakdown,
    statKey: string,
  ): { value: number; isBase?: boolean }[] => {
    return source.statChanges.filter((c) => c.stat === statKey);
  };

  // Format a single stat change
  const formatSingleChange = (change: { value: number; isBase?: boolean }) => {
    const color = change.value > 0 ? "text-green-400" : "text-red-400";
    const prefix = change.value > 0 ? "+" : "";
    return (
      <span className={color}>
        {prefix}
        {change.value}
        {change.isBase && (
          <span
            className="text-yellow-400 text-[9px] ml-0.5"
            title="Base stat modifier"
          >
            B
          </span>
        )}
      </span>
    );
  };

  // Format stat changes (may show multiple: base + bonus)
  const formatStatChanges = (
    changes: { value: number; isBase?: boolean }[],
  ) => {
    const nonZero = changes.filter((c) => c.value !== 0);
    if (nonZero.length === 0) return <span className="text-gray-600">-</span>;
    return (
      <span className="flex flex-col items-center gap-0">
        {nonZero.map((c, i) => (
          <span key={i}>{formatSingleChange(c)}</span>
        ))}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-600">
            <th className="text-left py-1.5 px-2 text-gray-400 font-medium">
              Nguồn
            </th>
            {statLabels.map((label) => (
              <th
                key={label}
                className="text-center py-1.5 px-1.5 text-gray-400 font-medium w-10"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Original base stats row (before Inversion, if applicable) */}
          {originalBaseStats && (
            <tr className="border-b border-gray-700/50 bg-gray-700/30">
              <td className="py-1.5 px-2 text-gray-400 italic">Trước đó</td>
              {[
                originalBaseStats.str,
                originalBaseStats.spd,
                originalBaseStats.dur,
                originalBaseStats.iq,
                originalBaseStats.biq,
                originalBaseStats.ma,
              ].map((val, idx) => (
                <td
                  key={idx}
                  className="text-center py-1.5 px-1.5 text-gray-400 italic"
                >
                  {val === 0 ? "-" : val}
                </td>
              ))}
            </tr>
          )}

          {/* Base stats row */}
          <tr className="border-b border-gray-700/50">
            <td className="py-1.5 px-2 text-gray-300">
              {originalBaseStats ? "Hi\u1ec7n t\u1ea1i" : "ban \u0111\u1ea7u"}
            </td>
            {statKeys.map((_, idx) => (
              <td key={idx} className="text-center py-1.5 px-1.5 text-gray-300">
                {totals[idx].base}
              </td>
            ))}
          </tr>

          {/* Source rows */}
          {sourcesWithStats.map((source, idx) => (
            <tr key={idx} className="border-b border-gray-700/30">
              <td
                className={`py-1.5 px-2 ${sourceTypeColors[source.type]} max-w-[120px]`}
                title={source.description || source.name}
              >
                <span className="truncate block">{source.name}</span>
                {source.description && (
                  <span className="text-gray-500 text-[9px] leading-tight block truncate" title={source.description}>
                    {source.description}
                  </span>
                )}
              </td>
              {statKeys.map((statKey) => (
                <td key={statKey} className="text-center py-1.5 px-1.5">
                  {formatStatChanges(getStatChanges(source, statKey))}
                </td>
              ))}
            </tr>
          ))}

          {/* Separator */}
          <tr>
            <td colSpan={7} className="py-0.5">
              <div className="border-t border-gray-500"></div>
            </td>
          </tr>

          {/* Total row */}
          <tr className="font-bold">
            <td className="py-1.5 px-2 text-white">Tổng:</td>
            {totals.map((total, idx) => (
              <td
                key={idx}
                className={`text-center py-1.5 px-1.5 ${
                  total.bonus > 0
                    ? "text-green-400"
                    : total.bonus < 0
                      ? "text-red-400"
                      : "text-white"
                }`}
              >
                {total.total}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* All Effects Inventory */}
      {breakdown.length > 0 &&
        (() => {
          // Group all sources by type
          const grouped = new Map<EffectSourceType, EffectSourceBreakdown[]>();
          for (const source of breakdown) {
            const list = grouped.get(source.type) || [];
            list.push(source);
            grouped.set(source.type, list);
          }

          // Display order
          const typeOrder: EffectSourceType[] = [
            "race",
            "sub_race",
            "archetype",
            "archetype_sub",
            "quirk",
            "power",
            "summon",
            "weapon",
            "gear",
            "rune",
            "runeword",
            "house",
            "house_sub",
            "char_dev",
            "pvp_reward",
            "pve_reward",
            "pve_punishment",
            "other_source",
            "lover",
            "symbiosis",
          ];

          const formatStatSummary = (source: EffectSourceBreakdown) => {
            const nonZero = source.statChanges.filter((c) => c.value !== 0);
            if (nonZero.length === 0) return null;
            return nonZero
              .map((c) => {
                const statLabel =
                  c.stat === "strength"
                    ? "STR"
                    : c.stat === "speed"
                      ? "SPD"
                      : c.stat === "durability"
                        ? "DUR"
                        : c.stat === "iq"
                          ? "IQ"
                          : c.stat === "biq"
                            ? "BIQ"
                            : "MA";
                const prefix = c.value > 0 ? "+" : "";
                return `${prefix}${c.value} ${statLabel}`;
              })
              .join(", ");
          };

          const totalSources = breakdown.length;
          return (
            <div className="mt-4 pt-3 border-t border-gray-600">
              <button
                onClick={() => setAllEffectsOpen((v) => !v)}
                className="w-full flex items-center justify-between text-xs text-gray-300 font-medium mb-1 hover:text-white transition-colors"
              >
                <span>Tất cả hiệu ứng <span className="text-gray-500">({totalSources})</span></span>
                <span className="text-gray-500 text-[10px]">{allEffectsOpen ? "▲" : "▼"}</span>
              </button>
              {allEffectsOpen && (
                <div className="space-y-2 mt-2">
                  {typeOrder.map((type) => {
                    const sources = grouped.get(type);
                    if (!sources || sources.length === 0) return null;
                    return (
                      <div key={type}>
                        <div
                          className={`text-[10px] font-bold uppercase tracking-wider ${sourceTypeColors[type]} mb-0.5`}
                        >
                          {sourceTypeLabels[type]}
                        </div>
                        <div className="space-y-0.5">
                          {sources.map((source, idx) => {
                            const statSummary = formatStatSummary(source);
                            return (
                              <div
                                key={idx}
                                className={`flex items-start gap-1.5 text-[11px] px-1.5 py-0.5 rounded ${
                                  source.isDisabled
                                    ? "bg-gray-800/50 opacity-50 line-through"
                                    : "bg-gray-700/30"
                                }`}
                              >
                                <span
                                  className={`${sourceTypeColors[source.type]} shrink-0`}
                                >
                                  {source.name}
                                </span>
                                {statSummary && (
                                  <span className="text-gray-400 shrink-0">
                                    ({statSummary})
                                  </span>
                                )}
                                {source.description && (
                                  <span
                                    className="text-gray-500 truncate"
                                    title={source.description}
                                  >
                                    — {source.description}
                                  </span>
                                )}
                                {source.isDisabled && (
                                  <span className="text-red-500 text-[9px]">
                                    [OFF]
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

      {/* Conditional Effects Section */}
      {sourcesWithConditionalEffects.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-600">
          <button
            onClick={() => setConditionalOpen((v) => !v)}
            className="w-full flex items-center justify-between mb-1 hover:opacity-80 transition-opacity"
          >
            <h4 className="text-xs text-yellow-400 font-medium flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              hiệu ứng điều kiện <span className="text-yellow-600">({sourcesWithConditionalEffects.length})</span>
            </h4>
            <span className="text-gray-500 text-[10px]">{conditionalOpen ? "▲" : "▼"}</span>
          </button>
          {conditionalOpen && <div className="space-y-2 mt-1">
            {sourcesWithConditionalEffects.map((source, idx) => (
              <div
                key={idx}
                className="bg-gray-700/30 rounded px-2 py-1.5 border-l-2 border-yellow-500/50"
              >
                <span
                  className={`text-xs font-medium ${sourceTypeColors[source.type]}`}
                >
                  {source.name}
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {source.conditionalEffects?.map((ce, ceIdx) => {
                    // Check if this timing is currently active based on tournament info
                    const isActive = (() => {
                      if (!tournamentInfo) return false;
                      const { bracket, round } = tournamentInfo;
                      switch (ce.timing) {
                        case "on_loser_bracket":
                          return bracket === "loser";
                        case "on_winner_bracket":
                          return bracket === "winner";
                        case "on_finals":
                          return round === "final";
                        case "on_round_16":
                          return round === "16";
                        case "on_round_8":
                          return round === "8" || round === "quarter";
                        case "on_round_32":
                          return round === "32";
                        case "on_round_64":
                          return round === "64";
                        case "on_round_128":
                          return round === "128";
                        case "on_round_256":
                          return round === "256";
                        default:
                          return false;
                      }
                    })();

                    return (
                      <span
                        key={ceIdx}
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${
                          isActive
                            ? "bg-green-900/50 text-green-300 border-green-500/50"
                            : "bg-yellow-900/30 text-yellow-300 border-yellow-700/30"
                        }`}
                      >
                        {isActive && <span className="mr-1">✓</span>}
                        {ce.description}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>}
        </div>
      )}
    </div>
  );
};

export default StatModifiersTable;
export { sourceTypeColors };
export type { StatModifiersTableProps };
