import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Character, CharacterStats } from "../types/character";
import { CharacterParser } from "../utils/characterParser";
import { EffectResolver, type EffectSourceBreakdown } from "../effects/resolver";
import { initializeEffectData } from "../effects/data";
import type { CharacterStats as EffectStats, EffectSourceType } from "../effects/types";
import wheelBgImage from "../assets/img/wheel-bg.png";

// Initialize effect data once
let effectsInitialized = false;
function ensureEffectsInitialized() {
  if (!effectsInitialized) {
    initializeEffectData();
    effectsInitialized = true;
  }
}

// Helper to calculate total stats from effect system
function calculateTotalStats(player: PlayerSummary): EffectStats {
  ensureEffectsInitialized();
  // Create a minimal character object for effect calculation
  const minimalCharacter: Character = {
    no: player.no,
    name: player.name,
    username: player.username,
    isParasite: player.isParasite || false,
    race: { race: player.race, subRace: player.subRace },
    archetypes: player.archetypes || [],
    quirks: player.quirks || [],
    stats: player.stats,
    house: player.house,
    gear: { normalGear: [], legacyGear: [] },
    weapons: [],
    runes: { runes: [] },
    powers: player.powers || [],
    charDevs: [],
  };
  const effects = EffectResolver.calculateCharacterEffects(minimalCharacter);
  return effects.totalStats;
}

interface PlayerSummary {
  no: number;
  name: string;
  username: string;
  race: string;
  subRace?: string;
  archetypes: string[];
  quirks: string[];
  powers: string[];
  house?: string;
  team?: number;
  stats: CharacterStats;
  isParasite?: boolean;
  parasiteInfo?: string[];
  isSymbiosis?: boolean;
  symbiosisType?: string;
  symbiosisHost?: string;
}

export const PlayerListPage = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Character | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "no" | "name" | "race" | "team" | "totalStats"
  >("no");
  const [selectedRaces, setSelectedRaces] = useState<string[]>([]);
  const [showRaceFilter, setShowRaceFilter] = useState(false);

  // Load all players on mount
  useEffect(() => {
    const loadPlayers = async () => {
      setIsLoading(true);
      const playerList: PlayerSummary[] = [];

      // Scan for player files from No1 to No256
      const fetchPromises: Promise<void>[] = [];

      for (let i = 1; i <= 256; i++) {
        fetchPromises.push(
          fetch(`/data/No${i}.txt`)
            .then(async (response) => {
              if (response.ok) {
                const content = await response.text();
                const char = CharacterParser.parseCharacterFile(content);
                playerList.push({
                  no: char.no || i,
                  name: char.name || `Player ${i}`,
                  username: char.username || "",
                  race: char.race?.race || "Unknown",
                  subRace: char.race?.subRace,
                  archetypes: char.archetypes || [],
                  quirks: char.quirks || [],
                  powers: char.powers || [],
                  house: char.house,
                  team: char.team,
                  stats: char.stats,
                  isParasite: char.isParasite,
                  parasiteInfo: char.parasiteInfo,
                  isSymbiosis: char.isSymbiosis,
                  symbiosisType: char.symbiosisType,
                  symbiosisHost: char.symbiosisHost,
                });
              }
            })
            .catch(() => {
              // File doesn't exist, skip
            }),
        );
      }

      await Promise.all(fetchPromises);
      setPlayers(playerList.sort((a, b) => a.no - b.no));
      setIsLoading(false);
    };

    loadPlayers();
  }, []);

  // Refresh player list
  const refreshPlayers = () => {
    setPlayers([]);
    setIsLoading(true);
    // Trigger re-fetch by clearing and re-running
    const loadPlayers = async () => {
      const playerList: PlayerSummary[] = [];
      const fetchPromises: Promise<void>[] = [];

      for (let i = 1; i <= 256; i++) {
        fetchPromises.push(
          fetch(`/data/No${i}.txt`, { cache: "no-store" })
            .then(async (response) => {
              if (response.ok) {
                const content = await response.text();
                const char = CharacterParser.parseCharacterFile(content);
                playerList.push({
                  no: char.no || i,
                  name: char.name || `Player ${i}`,
                  username: char.username || "",
                  race: char.race?.race || "Unknown",
                  subRace: char.race?.subRace,
                  archetypes: char.archetypes || [],
                  quirks: char.quirks || [],
                  powers: char.powers || [],
                  house: char.house,
                  team: char.team,
                  stats: char.stats,
                  isParasite: char.isParasite,
                  parasiteInfo: char.parasiteInfo,
                  isSymbiosis: char.isSymbiosis,
                  symbiosisType: char.symbiosisType,
                  symbiosisHost: char.symbiosisHost,
                });
              }
            })
            .catch(() => {}),
        );
      }

      await Promise.all(fetchPromises);
      setPlayers(playerList.sort((a, b) => a.no - b.no));
      setIsLoading(false);
    };
    loadPlayers();
  };

  // Load full character data when clicking on a player
  const handleSelectPlayer = async (playerNo: number) => {
    setIsLoadingDetail(true);
    try {
      const response = await fetch(`/data/No${playerNo}.txt`);
      if (response.ok) {
        const content = await response.text();
        const character = CharacterParser.parseCharacterFile(content);
        setSelectedPlayer(character);
      }
    } catch (error) {
      console.error("Failed to load player:", error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Get unique races from all players (including Unknown for players without race)
  const availableRaces = useMemo(() => {
    const races = new Set(
      players.map((p) => p.race).filter((r) => r && r !== "Unknown"),
    );
    const sortedRaces = Array.from(races).sort();
    // Check if there are players with Unknown/empty race
    const hasUnknown = players.some((p) => !p.race || p.race === "Unknown");
    if (hasUnknown) {
      sortedRaces.push("Unknown");
    }
    return sortedRaces;
  }, [players]);

  // Toggle race selection
  const toggleRaceFilter = (race: string) => {
    setSelectedRaces((prev) =>
      prev.includes(race) ? prev.filter((r) => r !== race) : [...prev, race],
    );
  };

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let result = players.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.race.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.no.toString().includes(searchTerm),
    );

    // Apply race filter if any races are selected
    if (selectedRaces.length > 0) {
      result = result.filter((p) => {
        // Handle "Unknown" filter for players with empty or "Unknown" race
        if (
          selectedRaces.includes("Unknown") &&
          (!p.race || p.race === "Unknown")
        ) {
          return true;
        }
        return selectedRaces.includes(p.race);
      });
    }

    // Helper function to calculate total stats
    const getTotalStats = (stats: CharacterStats) =>
      (stats.str || 0) +
      (stats.spd || 0) +
      (stats.dur || 0) +
      (stats.iq || 0) +
      (stats.biq || 0) +
      (stats.ma || 0);

    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "race":
          return a.race.localeCompare(b.race);
        case "team":
          return (a.team || 999) - (b.team || 999);
        case "totalStats":
          return getTotalStats(b.stats) - getTotalStats(a.stats); // Descending order
        default:
          return a.no - b.no;
      }
    });

    return result;
  }, [players, searchTerm, sortBy, selectedRaces]);

  return (
    <div
      className="h-screen flex flex-col"
      style={{
        backgroundImage: `url(${wheelBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Fixed Header */}
      <header className="flex-shrink-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 px-4 py-3 overflow-visible relative z-[100]">
        <div className="max-w-7xl mx-auto overflow-visible">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2"
            >
              <span>&larr;</span> Back to Home
            </button>
            <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-teal-400 to-cyan-400 italic">
              Player List
            </h1>
            <button
              onClick={refreshPlayers}
              disabled={isLoading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2"
            >
              <span className={isLoading ? "animate-spin" : ""}>&#8635;</span>{" "}
              Refresh
            </button>
          </div>

          {/* Search and Sort Controls */}
          <div className="flex flex-wrap gap-4 items-center justify-center overflow-visible">
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-lg text-white w-64 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="no">Sort by No.</option>
              <option value="name">Sort by Name</option>
              <option value="race">Sort by Race</option>
              <option value="team">Sort by Team</option>
              <option value="totalStats">Sort by Total Stats</option>
            </select>
            {/* Race Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowRaceFilter(!showRaceFilter)}
                className={`px-4 py-2 border rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  selectedRaces.length > 0
                    ? "bg-amber-600/80 border-amber-500 text-white"
                    : "bg-gray-800/80 border-gray-600 text-white hover:bg-gray-700/80"
                }`}
              >
                <span>🏷️ Race Filter</span>
                {selectedRaces.length > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {selectedRaces.length}
                  </span>
                )}
              </button>

              {/* Race Filter Dropdown */}
              {showRaceFilter && (
                <div className="absolute top-full right-0 mt-2 z-[9999] bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-3 min-w-[250px] max-h-[400px] overflow-y-auto">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-600">
                    <span className="text-white font-medium text-sm">
                      Filter by Race
                    </span>
                    {selectedRaces.length > 0 && (
                      <button
                        onClick={() => setSelectedRaces([])}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {availableRaces.map((race) => {
                      const count =
                        race === "Unknown"
                          ? players.filter(
                              (p) => !p.race || p.race === "Unknown",
                            ).length
                          : players.filter((p) => p.race === race).length;
                      const isSelected = selectedRaces.includes(race);
                      return (
                        <label
                          key={race}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                            isSelected ? "bg-amber-600/30" : "hover:bg-gray-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRaceFilter(race)}
                            className="w-4 h-4 rounded border-gray-500 text-amber-500 focus:ring-amber-500 bg-gray-700"
                          />
                          <span className="text-white text-sm flex-1">
                            {race}
                          </span>
                          <span className="text-gray-400 text-xs">
                            ({count})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <span className="text-gray-400">
              {filteredPlayers.length} players found
            </span>
          </div>
        </div>
      </header>

      {/* Scrollable Player List Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mb-4" />
              <p className="text-gray-400 text-xl">Loading players...</p>
            </div>
          ) : (
            <>
              {/* Player Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPlayers.map((player) => (
                  <PlayerCard
                    key={player.no}
                    player={player}
                    onClick={() => handleSelectPlayer(player.no)}
                    isSelected={selectedPlayer?.no === player.no}
                  />
                ))}
              </div>

              {/* No players message */}
              {filteredPlayers.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-xl">
                    {searchTerm
                      ? "No players match your search"
                      : "No players found"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          character={selectedPlayer}
          isLoading={isLoadingDetail}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
};

// Mini Hexagon Radar Chart for Player Card
const MiniHexagonChart = ({ stats, totalStats }: { stats: CharacterStats; totalStats: EffectStats }) => {
  const size = 70;
  const center = size / 2;
  const maxRadius = size / 2 - 8;
  const fixedMaxStat = 15; // Fixed max stat value

  const statConfig = [
    { key: "str" as keyof CharacterStats, effectKey: "strength" as keyof EffectStats, color: "#f87171" },
    { key: "spd" as keyof CharacterStats, effectKey: "speed" as keyof EffectStats, color: "#fbbf24" },
    { key: "dur" as keyof CharacterStats, effectKey: "durability" as keyof EffectStats, color: "#60a5fa" },
    { key: "iq" as keyof CharacterStats, effectKey: "iq" as keyof EffectStats, color: "#a78bfa" },
    { key: "biq" as keyof CharacterStats, effectKey: "biq" as keyof EffectStats, color: "#f472b6" },
    { key: "ma" as keyof CharacterStats, effectKey: "ma" as keyof EffectStats, color: "#fb923c" },
  ];

  const getHexagonPoints = (radius: number) => {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(" ");
  };

  // Base stat polygon points
  const getBaseStatPoints = () => {
    const points: string[] = [];
    statConfig.forEach((stat, i) => {
      const value = stats[stat.key] || 0;
      const radius = (value / fixedMaxStat) * maxRadius;
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    });
    return points.join(" ");
  };

  // Total stat polygon points
  const getTotalStatPoints = () => {
    const points: string[] = [];
    statConfig.forEach((stat, i) => {
      const value = totalStats[stat.effectKey] || 0;
      const radius = (value / fixedMaxStat) * maxRadius;
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    });
    return points.join(" ");
  };

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      {/* Background hexagons */}
      <polygon
        points={getHexagonPoints(maxRadius)}
        fill="none"
        stroke="#374151"
        strokeWidth="1"
      />
      <polygon
        points={getHexagonPoints(maxRadius * 0.5)}
        fill="none"
        stroke="#374151"
        strokeWidth="0.5"
      />
      {/* Base stat polygon (lighter, background) */}
      <polygon
        points={getBaseStatPoints()}
        fill="rgba(156, 163, 175, 0.2)"
        stroke="#9ca3af"
        strokeWidth="0.5"
        strokeDasharray="2 1"
      />
      {/* Total stat polygon (main, foreground) */}
      <polygon
        points={getTotalStatPoints()}
        fill="rgba(34, 197, 94, 0.3)"
        stroke="#22c55e"
        strokeWidth="1.5"
      />
      {/* Stat points for total stats */}
      {statConfig.map((stat, i) => {
        const value = totalStats[stat.effectKey] || 0;
        const radius = (value / fixedMaxStat) * maxRadius;
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return <circle key={stat.key} cx={x} cy={y} r="2" fill={stat.color} />;
      })}
    </svg>
  );
};

// Player Card Component
interface PlayerCardProps {
  player: PlayerSummary;
  onClick: () => void;
  isSelected: boolean;
}

const PlayerCard = ({ player, onClick, isSelected }: PlayerCardProps) => {
  const baseTotal = Object.values(player.stats).reduce((a, b) => a + b, 0);
  const totalStats = useMemo(() => calculateTotalStats(player), [player]);
  const totalStatsSum = Object.values(totalStats).reduce((a, b) => a + b, 0);

  const statLabels = [
    { key: "str" as keyof CharacterStats, label: "STR", color: "text-red-400" },
    {
      key: "spd" as keyof CharacterStats,
      label: "SPD",
      color: "text-yellow-400",
    },
    {
      key: "dur" as keyof CharacterStats,
      label: "DUR",
      color: "text-blue-400",
    },
    {
      key: "iq" as keyof CharacterStats,
      label: "IQ",
      color: "text-purple-400",
    },
    {
      key: "biq" as keyof CharacterStats,
      label: "BIQ",
      color: "text-pink-400",
    },
    {
      key: "ma" as keyof CharacterStats,
      label: "MA",
      color: "text-orange-400",
    },
  ];

  return (
    <div
      onClick={onClick}
      className={`bg-gray-800/80 backdrop-blur-sm border rounded-lg p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl ${
        isSelected
          ? "border-teal-500 ring-2 ring-teal-500/50"
          : "border-gray-700 hover:border-gray-500"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold text-teal-400 bg-teal-400/20 px-2 py-0.5 rounded">
              No.{player.no}
            </span>
            {player.team && (
              <span className="text-xs font-medium text-purple-400 bg-purple-400/20 px-2 py-0.5 rounded">
                Team {player.team}
              </span>
            )}
            {/* Badge for Symbiosis character (the parasite itself) */}
            {player.isSymbiosis && (
              <span
                className="text-xs font-medium text-red-400 bg-red-400/20 px-2 py-0.5 rounded cursor-help relative group"
                title={`${player.symbiosisType} → ${player.symbiosisHost}`}
              >
                Symbiosis
                {/* Tooltip */}
                <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
                  <div className="bg-gray-900 border border-red-500/50 rounded-lg p-2 shadow-xl min-w-[150px] max-w-[250px]">
                    <div className="text-xs text-red-300 font-semibold mb-1">
                      Ký Sinh Trùng:
                    </div>
                    <div className="text-xs text-gray-300">
                      Type: {player.symbiosisType}
                    </div>
                    <div className="text-xs text-gray-300">
                      Host: {player.symbiosisHost}
                    </div>
                  </div>
                </div>
              </span>
            )}
            {/* Badge for host character (has a parasite) */}
            {player.isParasite &&
              player.parasiteInfo &&
              player.parasiteInfo.length > 0 && (
                <span
                  className="text-xs font-medium text-green-400 bg-green-400/20 px-2 py-0.5 rounded cursor-help relative group"
                  title={player.parasiteInfo.join("\n")}
                >
                  Host
                  {/* Tooltip */}
                  <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
                    <div className="bg-gray-900 border border-green-500/50 rounded-lg p-2 shadow-xl min-w-[150px] max-w-[250px]">
                      <div className="text-xs text-green-300 font-semibold mb-1">
                        Bị Ký Sinh bởi:
                      </div>
                      {player.parasiteInfo.map((info, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-gray-300 whitespace-nowrap"
                        >
                          {info}
                        </div>
                      ))}
                    </div>
                  </div>
                </span>
              )}
          </div>
          <h3 className="text-lg font-bold text-white truncate">
            {player.name}
          </h3>
          {player.username && (
            <p className="text-sm text-gray-400 truncate">{player.username}</p>
          )}
        </div>
      </div>

      {/* Race & Archetypes */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs font-medium text-amber-400 bg-amber-400/20 px-2 py-1 rounded">
          {player.race || "Unknown Race"}
        </span>
        {player.archetypes &&
          player.archetypes.length > 0 &&
          player.archetypes.map((archetype, idx) => (
            <span
              key={idx}
              className="text-xs font-medium text-pink-400 bg-pink-400/20 px-2 py-1 rounded truncate max-w-[140px]"
            >
              {archetype}
            </span>
          ))}
      </div>

      {/* Stats with Hexagon Chart */}
      <div className="flex items-center gap-3">
        <MiniHexagonChart stats={player.stats} totalStats={totalStats} />
        <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          {statLabels.map(({ key, label, color }) => {
            const baseValue = player.stats[key] || 0;
            const effectKey = key === 'str' ? 'strength' : key === 'spd' ? 'speed' : key === 'dur' ? 'durability' : key;
            const totalValue = totalStats[effectKey as keyof EffectStats] || 0;
            const diff = totalValue - baseValue;
            return (
              <div key={key} className="flex justify-between">
                <span className={color}>{label}</span>
                <span className="text-white font-medium">
                  <span className="text-gray-500">{baseValue}</span>
                  <span className="text-gray-600 mx-0.5">→</span>
                  <span className={diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-white'}>
                    {totalValue}
                  </span>
                </span>
              </div>
            );
          })}
          <div className="col-span-2 border-t border-gray-600 mt-1 pt-1 flex justify-between">
            <span className="text-gray-400">Total</span>
            <span>
              <span className="text-gray-500">{baseTotal}</span>
              <span className="text-gray-600 mx-0.5">→</span>
              <span className="text-teal-400 font-bold">{totalStatsSum}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component to display stat modifier badge inline
const StatModifierBadge = ({
  name,
  sourceType
}: {
  name: string;
  sourceType: EffectSourceType;
}) => {
  const summary = EffectResolver.getEffectSummary(name, sourceType);
  if (!summary) return null;

  return (
    <span className="text-[10px] text-emerald-400 ml-1">
      ({summary})
    </span>
  );
};

// Effect Source Item Component for breakdown display
const EffectSourceItem = ({ source }: { source: EffectSourceBreakdown }) => {
  const statAbbrev: Record<string, string> = {
    strength: 'STR',
    speed: 'SPD',
    durability: 'DUR',
    iq: 'IQ',
    biq: 'BIQ',
    ma: 'MA'
  };

  const sourceTypeLabels: Record<EffectSourceType, string> = {
    race: 'Race',
    sub_race: 'Sub-race',
    archetype: 'Archetype',
    quirk: 'Quirk',
    power: 'Power',
    gear: 'Gear',
    weapon: 'Weapon',
    rune: 'Rune',
    runeword: 'Runeword',
    house: 'House',
    char_dev: 'Char Dev',
    pvp_reward: 'PvP Reward',
    lover: 'Lover',
    symbiosis: 'Symbiosis'
  };

  const sourceTypeColors: Record<EffectSourceType, string> = {
    race: 'text-amber-400',
    sub_race: 'text-amber-300',
    archetype: 'text-pink-400',
    quirk: 'text-purple-400',
    power: 'text-red-400',
    gear: 'text-blue-400',
    weapon: 'text-yellow-400',
    rune: 'text-orange-400',
    runeword: 'text-orange-300',
    house: 'text-cyan-400',
    char_dev: 'text-gray-400',
    pvp_reward: 'text-green-400',
    lover: 'text-pink-300',
    symbiosis: 'text-red-300'
  };

  const statChangeSummary = source.statChanges.map(change => {
    const prefix = change.value > 0 ? '+' : '';
    return `${prefix}${change.value} ${statAbbrev[change.stat] || change.stat}`;
  }).join(', ');

  if (!statChangeSummary) return null;

  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <span className="text-gray-500 w-16">{sourceTypeLabels[source.type]}</span>
        <span className={sourceTypeColors[source.type]}>{source.name}</span>
      </div>
      <span className={`font-medium ${
        source.statChanges.some(c => c.value > 0) && source.statChanges.some(c => c.value < 0)
          ? 'text-yellow-400'
          : source.statChanges.every(c => c.value > 0)
            ? 'text-green-400'
            : 'text-red-400'
      }`}>
        {statChangeSummary}
      </span>
    </div>
  );
};

// Player Detail Modal Component
interface PlayerDetailModalProps {
  character: Character;
  isLoading: boolean;
  onClose: () => void;
}

const PlayerDetailModal = ({
  character,
  isLoading,
  onClose,
}: PlayerDetailModalProps) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Calculate total stats with effects
  const characterEffects = useMemo(() => {
    ensureEffectsInitialized();
    return EffectResolver.calculateCharacterEffects(character);
  }, [character]);

  // Get effect breakdown for summary
  const effectBreakdown = useMemo(() => {
    return EffectResolver.getCharacterEffectBreakdown(character);
  }, [character]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  const stats = [
    {
      key: "str",
      effectKey: "strength" as keyof EffectStats,
      label: "Strength",
      baseValue: character.stats.str,
      totalValue: characterEffects.totalStats.strength,
      color: "text-red-400",
      bg: "bg-red-400",
    },
    {
      key: "spd",
      effectKey: "speed" as keyof EffectStats,
      label: "Speed",
      baseValue: character.stats.spd,
      totalValue: characterEffects.totalStats.speed,
      color: "text-yellow-400",
      bg: "bg-yellow-400",
    },
    {
      key: "dur",
      effectKey: "durability" as keyof EffectStats,
      label: "Durability",
      baseValue: character.stats.dur,
      totalValue: characterEffects.totalStats.durability,
      color: "text-blue-400",
      bg: "bg-blue-400",
    },
    {
      key: "iq",
      effectKey: "iq" as keyof EffectStats,
      label: "IQ",
      baseValue: character.stats.iq,
      totalValue: characterEffects.totalStats.iq,
      color: "text-purple-400",
      bg: "bg-purple-400",
    },
    {
      key: "biq",
      effectKey: "biq" as keyof EffectStats,
      label: "Battle IQ",
      baseValue: character.stats.biq,
      totalValue: characterEffects.totalStats.biq,
      color: "text-pink-400",
      bg: "bg-pink-400",
    },
    {
      key: "ma",
      effectKey: "ma" as keyof EffectStats,
      label: "Martial Arts",
      baseValue: character.stats.ma,
      totalValue: characterEffects.totalStats.ma,
      color: "text-orange-400",
      bg: "bg-orange-400",
    },
  ];

  const maxStat = Math.max(...stats.map((s) => s.totalValue || 0), 15);
  const baseTotal = stats.reduce((sum, s) => sum + (s.baseValue || 0), 0);
  const totalStatsSum = stats.reduce((sum, s) => sum + (s.totalValue || 0), 0);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-teal-600 px-6 py-4 flex items-center justify-between sticky top-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-white/80 font-bold bg-white/20 px-3 py-1 rounded">
                No.{character.no}
              </span>
              {character.team && (
                <span className="text-white/80 font-medium bg-white/20 px-3 py-1 rounded">
                  Team {character.team}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">{character.name}</h2>
            {character.username && (
              <p className="text-white/70">{character.username}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-3xl font-light transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info & Stats */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-teal-400">&#9733;</span> Basic Info
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start justify-between">
                  <span className="text-gray-400 text-sm">Race</span>
                  <span className="text-amber-400 text-sm text-right">
                    {character.race?.race || "-"}
                    <StatModifierBadge name={character.race?.race || ""} sourceType="race" />
                  </span>
                </div>
                {character.race?.subRace && (
                  <div className="flex items-start justify-between">
                    <span className="text-gray-400 text-sm">Sub-race</span>
                    <span className="text-amber-300 text-sm text-right">
                      {character.race.subRace}
                      {character.race.subRace.split(/\s*\+\s*/).map((subRace, idx) => (
                        <StatModifierBadge key={idx} name={subRace.trim()} sourceType="sub_race" />
                      ))}
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <span className="text-gray-400 text-sm">Archetypes</span>
                  <div className="text-right">
                    {character.archetypes && character.archetypes.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {character.archetypes.map((archetype, idx) => (
                          <span key={idx} className="text-pink-400 text-sm">
                            {archetype}
                            <StatModifierBadge name={archetype} sourceType="archetype" />
                            {idx < character.archetypes.length - 1 ? "," : ""}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-pink-400 text-sm">-</span>
                    )}
                  </div>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-gray-400 text-sm">House</span>
                  <span className="text-cyan-400 text-sm text-right">
                    {character.house || "-"}
                    {character.house && <StatModifierBadge name={character.house} sourceType="house" />}
                  </span>
                </div>
                {character.isParasite && (
                  <InfoItem
                    label="Status"
                    value="Ky Sinh"
                    color="text-green-400"
                  />
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-teal-400">&#9733;</span> Stats
                </h3>
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    showBreakdown
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {showBreakdown ? 'Hide Sources' : 'Show Sources'}
                </button>
              </div>

              {/* Breakdown Panel */}
              {showBreakdown && effectBreakdown.length > 0 && (
                <div className="mb-4 p-3 bg-gray-800/70 rounded-lg border border-gray-600">
                  <p className="text-xs text-gray-400 mb-2 font-medium">Stat Modifiers Sources:</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {effectBreakdown.map((source, idx) => (
                      <EffectSourceItem key={idx} source={source} />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {stats.map((stat) => {
                  const diff = stat.totalValue - stat.baseValue;
                  return (
                    <div key={stat.key} className="flex items-center gap-3">
                      <span className={`w-24 text-sm font-medium ${stat.color}`}>
                        {stat.label}
                      </span>
                      <div className="flex-1 bg-gray-600 rounded-full h-3 overflow-hidden relative">
                        {/* Base stat bar (lighter) */}
                        <div
                          className={`h-full ${stat.bg} opacity-30 absolute`}
                          style={{
                            width: `${((stat.baseValue || 0) / maxStat) * 100}%`,
                          }}
                        />
                        {/* Total stat bar */}
                        <div
                          className={`h-full ${stat.bg} transition-all duration-500`}
                          style={{
                            width: `${((stat.totalValue || 0) / maxStat) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-white font-bold w-20 text-right text-sm">
                        <span className="text-gray-500">{stat.baseValue}</span>
                        <span className="text-gray-600 mx-0.5">→</span>
                        <span className={diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-white'}>
                          {stat.totalValue}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-600 flex justify-between">
                <span className="text-gray-400">Total Stats</span>
                <span className="text-white font-bold">
                  <span className="text-gray-500">{baseTotal}</span>
                  <span className="text-gray-600 mx-1">→</span>
                  <span className="text-green-400">{totalStatsSum}</span>
                </span>
              </div>
            </div>

            {/* Quirks */}
            {character.quirks && character.quirks.length > 0 && (
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-teal-400">&#9733;</span> Quirks
                </h3>
                <div className="flex flex-wrap gap-2">
                  {character.quirks.map((quirk, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-purple-500/30 text-purple-300 rounded-full text-sm"
                    >
                      {quirk}
                      <StatModifierBadge name={quirk} sourceType="quirk" />
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Equipment & Abilities */}
          <div className="space-y-6">
            {/* Gear */}
            {(character.gear?.normalGear?.length > 0 ||
              character.gear?.legacyGear?.length > 0) && (
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-teal-400">&#9733;</span> Gear
                </h3>
                {character.gear.normalGear?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-400 mb-2">Normal Gear</p>
                    <div className="flex flex-wrap gap-2">
                      {character.gear.normalGear.map((gear, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded text-sm"
                        >
                          {gear}
                          <StatModifierBadge name={gear} sourceType="gear" />
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {character.gear.legacyGear?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Legacy Gear</p>
                    <div className="flex flex-wrap gap-2">
                      {character.gear.legacyGear.map((gear, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded text-sm"
                        >
                          {gear}
                          <StatModifierBadge name={gear} sourceType="gear" />
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Weapons */}
            {character.weapons && character.weapons.length > 0 && (
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-teal-400">&#9733;</span> Weapons
                </h3>
                <div className="space-y-2">
                  {character.weapons.map((weapon, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-3 py-2 rounded ${
                        weapon.type === "Unique"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : weapon.type === "Legacy"
                            ? "bg-purple-500/20 text-purple-300"
                            : "bg-gray-600/50 text-gray-300"
                      }`}
                    >
                      <span>
                        {weapon.name}
                        <StatModifierBadge name={weapon.name} sourceType="weapon" />
                      </span>
                      <span className="text-xs opacity-70">{weapon.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Runes */}
            {character.runes &&
              (character.runes.runes?.length > 0 ||
                character.runes.runeword) && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-teal-400">&#9733;</span> Runes
                  </h3>
                  {character.runes.runes?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {character.runes.runes.map((rune, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded text-sm"
                        >
                          {rune}
                          <StatModifierBadge name={rune} sourceType="rune" />
                        </span>
                      ))}
                    </div>
                  )}
                  {character.runes.runeword && (
                    <p className="text-sm text-gray-300">
                      Runeword:{" "}
                      <span className="text-orange-400 font-medium">
                        {character.runes.runeword}
                        <StatModifierBadge name={character.runes.runeword} sourceType="runeword" />
                      </span>
                    </p>
                  )}
                </div>
              )}

            {/* Powers */}
            {character.powers && character.powers.length > 0 && (
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-teal-400">&#9733;</span> Powers
                </h3>
                <div className="flex flex-wrap gap-2">
                  {character.powers.map((power, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm"
                    >
                      {power}
                      <StatModifierBadge name={power} sourceType="power" />
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Character Development */}
            {character.charDevs && character.charDevs.length > 0 && (
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-teal-400">&#9733;</span> Character
                  Development ({character.charDevs.length})
                </h3>
                <div className="space-y-2">
                  {character.charDevs.map((charDev, idx) => (
                    <p key={idx} className="text-gray-300">
                      • {charDev}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Lover */}
            {character.lover && (
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-pink-400">&#9829;</span> Lover
                </h3>
                <p className="text-pink-300">{character.lover}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Info Item Helper Component
const InfoItem = ({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string;
  color?: string;
}) => (
  <div>
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className={`font-medium ${color}`}>{value}</p>
  </div>
);
