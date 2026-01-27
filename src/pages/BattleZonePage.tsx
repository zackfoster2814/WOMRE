import { useState, useEffect, useMemo } from "react";
import { BattleType } from "../types";
import { CharacterStats } from "../types/character";
import { CharacterParser } from "../utils/characterParser";
import wheelBgImage from "../assets/img/wheel-bg.png";
import { BossBattleRoom } from "../components/BossBattleRoom";

// Types for PvE
interface BossStats {
  str: number | null;
  spd: number | null;
  dur: number | null;
  iq: number | null;
  biq: number | null;
  ma: number | null;
}

interface Boss {
  id: number;
  name: string;
  stats: BossStats;
  reward: string;
  punishment: string;
}

interface PlayerData {
  no: number;
  name: string;
  username: string;
  stats: CharacterStats;
  team?: number;
}

interface TeamMemberJson {
  name: string;
  username: string;
}

interface TeamJson {
  id: number;
  boss: string | null;
  members: TeamMemberJson[];
}

interface BattleView {
  teamId: number;
  boss: Boss | null;
  members: TeamMemberJson[];
  playerData: PlayerData[];
}

export const BattleZonePage = () => {
  const [battleType, setBattleType] = useState<BattleType | null>(null);

  if (!battleType) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-8"
        style={{
          backgroundImage: `url(${wheelBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-4">
              Battle Zone
            </h1>
            <p className="text-gray-300 text-lg">
              Choose your battle type
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setBattleType("pve")}
              className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-2xl p-12 transition-all duration-300 hover:scale-105 hover:border-blue-500 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-3xl font-bold text-white mb-2">PvE</h2>
                <p className="text-gray-400">Player vs Environment</p>
                <p className="text-sm text-gray-500 mt-2">(Coming Soon)</p>
              </div>
            </button>

            <button
              onClick={() => setBattleType("pvp")}
              className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-2xl p-12 transition-all duration-300 hover:scale-105 hover:border-red-500 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="text-6xl mb-4">⚔️</div>
                <h2 className="text-3xl font-bold text-white mb-2">PvP</h2>
                <p className="text-gray-400">Player vs Player</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (battleType === "pve") {
    return <PvEBattlePage onBack={() => setBattleType(null)} />;
  }

  return <PvPBattlePage onBack={() => setBattleType(null)} />;
};

interface PvPBattlePageProps {
  onBack: () => void;
}

const PvPBattlePage = ({ onBack }: PvPBattlePageProps) => {
  const [selectedMode, setSelectedMode] = useState<
    "stats-comparison" | "wheel-of-truth" | null
  >(null);

  if (!selectedMode) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-8"
        style={{
          backgroundImage: `url(${wheelBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="max-w-4xl w-full">
          <button
            onClick={onBack}
            className="mb-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2"
          >
            <span>←</span> Back
          </button>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-4">
              PvP Battle
            </h1>
            <p className="text-gray-300 text-lg">Choose your battle mode</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setSelectedMode("stats-comparison")}
              className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-2xl p-12 transition-all duration-300 hover:scale-105 hover:border-purple-500 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Stats Comparison
                </h2>
                <p className="text-gray-400">
                  Compare player stats side by side
                </p>
              </div>
            </button>

            <button
              onClick={() => setSelectedMode("wheel-of-truth")}
              className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-2xl p-12 transition-all duration-300 hover:scale-105 hover:border-yellow-500 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="text-6xl mb-4">🎡</div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Wheel of Truth
                </h2>
                <p className="text-gray-400">
                  Spin the wheel based on stats
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedMode === "stats-comparison") {
    return (
      <StatsComparisonMode onBack={() => setSelectedMode(null)} />
    );
  }

  return <WheelOfTruthMode onBack={() => setSelectedMode(null)} />;
};

interface BattleModeProps {
  onBack: () => void;
}

const StatsComparisonMode = ({ onBack }: BattleModeProps) => {
  return (
    <div
      className="min-h-screen py-4 px-4"
      style={{
        backgroundImage: `url(${wheelBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2"
        >
          <span>←</span> Back
        </button>

        <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 mb-8 text-center">
          Stats Comparison
        </h1>

        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-lg mb-4">
            Stats Comparison Mode - Under Development
          </p>
          <p className="text-gray-500 text-sm">
            This feature will allow you to compare two players stats side by
            side and determine the winner based on statistical advantage.
          </p>
        </div>
      </div>
    </div>
  );
};

const WheelOfTruthMode = ({ onBack }: BattleModeProps) => {
  return (
    <div
      className="min-h-screen py-4 px-4"
      style={{
        backgroundImage: `url(${wheelBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2"
        >
          <span>←</span> Back
        </button>

        <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 mb-8 text-center">
          Wheel of Truth
        </h1>

        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-lg mb-4">
            Wheel of Truth Mode - Under Development
          </p>
          <p className="text-gray-500 text-sm">
            This feature will use a wheel to determine battle outcomes based on
            player stats. Higher stats = better chance to win!
          </p>
        </div>
      </div>
    </div>
  );
};

// PvE Battle Page Component
const PvEBattlePage = ({ onBack }: BattleModeProps) => {
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [teams, setTeams] = useState<TeamJson[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "with-boss" | "no-boss">("with-boss");
  const [battleView, setBattleView] = useState<BattleView | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load bosses
        const bossRes = await fetch("/data/battles/bosses.json");
        const bossData = await bossRes.json();
        setBosses(bossData.bosses || []);

        // Load teams
        const teamRes = await fetch("/data/battles/teams.json");
        const teamData = await teamRes.json();
        setTeams(teamData.teams || []);

        // Load all players from individual files (like TeamBattlePage)
        const playerList: PlayerData[] = [];
        const fetchPromises: Promise<void>[] = [];

        for (let i = 1; i <= 260; i++) {
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
                    stats: char.stats,
                    team: char.team,
                  });
                }
              })
              .catch(() => {})
          );
        }

        await Promise.all(fetchPromises);
        setAllPlayers(playerList);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Create boss lookup map
  const bossMap = useMemo(() => {
    const map = new Map<string, Boss>();
    bosses.forEach((boss) => map.set(boss.name, boss));
    return map;
  }, [bosses]);

  // Create player lookup by username
  const playerByUsername = useMemo(() => {
    const map = new Map<string, PlayerData>();
    allPlayers.forEach((p) => {
      if (p.username) map.set(p.username.toLowerCase(), p);
    });
    return map;
  }, [allPlayers]);

  // Build battle views (teams with their assigned bosses)
  const battles = useMemo(() => {
    return teams.map((team): BattleView => {
      const boss = team.boss ? bossMap.get(team.boss) || null : null;

      // Match members with player data
      const playerData: PlayerData[] = [];
      team.members.forEach((member) => {
        const player = playerByUsername.get(member.username.toLowerCase());
        if (player) {
          playerData.push(player);
        }
      });

      return {
        teamId: team.id,
        boss,
        members: team.members,
        playerData,
      };
    });
  }, [teams, bossMap, playerByUsername]);

  // Filter battles
  const filteredBattles = useMemo(() => {
    switch (filterType) {
      case "with-boss":
        return battles.filter((b) => b.boss !== null);
      case "no-boss":
        return battles.filter((b) => b.boss === null);
      default:
        return battles;
    }
  }, [battles, filterType]);

  // Summary
  const summary = useMemo(() => {
    const withBoss = battles.filter((b) => b.boss !== null).length;
    const noBoss = battles.filter((b) => b.boss === null).length;
    return { total: battles.length, withBoss, noBoss };
  }, [battles]);

  // Calculate total stats
  const getTotalStats = (stats: BossStats | CharacterStats) => {
    return (
      (stats.str || 0) +
      (stats.spd || 0) +
      (stats.dur || 0) +
      (stats.iq || 0) +
      (stats.biq || 0) +
      (stats.ma || 0)
    );
  };

  // Start battle
  const startBattle = (battle: BattleView) => {
    if (!battle.boss) return;
    setBattleView(battle);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${wheelBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-4 px-4"
      style={{
        backgroundImage: `url(${wheelBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2"
          >
            <span>←</span> Back
          </button>

          <div className="flex gap-2">
            <span className="px-3 py-1 bg-purple-600/80 rounded-full text-white text-sm font-medium">
              Total: {summary.total}
            </span>
            <span className="px-3 py-1 bg-red-600/80 rounded-full text-white text-sm font-medium">
              Has Boss: {summary.withBoss}
            </span>
          </div>

          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Teams ({summary.total})</option>
            <option value="with-boss">Has Boss ({summary.withBoss})</option>
            <option value="no-boss">No Boss ({summary.noBoss})</option>
          </select>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 mb-4">
            Lair Battle
          </h1>
          <p className="text-gray-300 text-lg">
            Select a team to challenge their assigned boss
          </p>
        </div>

        {/* Battle Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBattles.map((battle) => {
            const hasBoss = battle.boss !== null;
            const bossTotalStats = battle.boss ? getTotalStats(battle.boss.stats) : 0;
            const teamTotalStats = battle.playerData.reduce(
              (sum, p) => sum + getTotalStats(p.stats),
              0
            );

            return (
              <div
                key={battle.teamId}
                className={`bg-gray-800/90 backdrop-blur-sm border-2 rounded-xl overflow-hidden transition-all hover:scale-[1.02] ${
                  hasBoss ? "border-red-500/50" : "border-gray-600"
                }`}
              >
                {/* Card Header */}
                <div
                  className={`px-4 py-3 ${
                    hasBoss ? "bg-red-600/20" : "bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-orange-400">
                        #{battle.teamId}
                      </span>
                      <span className="text-white font-medium">
                        Team {battle.teamId}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {battle.members.length} members
                    </span>
                  </div>
                  {hasBoss && (
                    <p className="text-sm text-gray-400 mt-1">
                      vs{" "}
                      <span className="text-red-400 font-medium">
                        {battle.boss!.name}
                      </span>
                    </p>
                  )}
                </div>

                {/* Card Content */}
                <div className="px-4 py-3">
                  {hasBoss && battle.boss ? (
                    <>
                      {/* Stats Comparison */}
                      <div className="grid grid-cols-6 gap-1 text-center text-xs mb-3">
                        {(["str", "spd", "dur", "iq", "biq", "ma"] as const).map(
                          (stat) => (
                            <div key={stat} className="bg-gray-700/50 rounded p-1">
                              <div className="text-gray-400 text-[10px]">
                                {stat.toUpperCase()}
                              </div>
                              <div className="text-red-400 font-bold text-xs">
                                {battle.boss!.stats[stat] ?? "?"}
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      {/* Total Stats */}
                      <div className="text-center text-sm mb-3">
                        <span className="text-red-400 font-bold">{bossTotalStats}</span>
                        <span className="text-gray-500 mx-2">vs</span>
                        <span className="text-green-400 font-bold">{teamTotalStats}</span>
                      </div>

                      {/* Reward Preview */}
                      <div className="text-xs text-gray-400 mb-3 line-clamp-2">
                        <span className="text-green-400">Reward:</span>{" "}
                        {battle.boss.reward}
                      </div>

                      {/* Battle Button */}
                      {battle.playerData.length > 0 && (
                        <button
                          onClick={() => startBattle(battle)}
                          className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg text-sm"
                        >
                          Enter Lair Battle
                        </button>
                      )}
                      {battle.playerData.length === 0 && (
                        <p className="text-center text-yellow-500 text-xs">
                          No player data found
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-gray-500 italic py-4">
                      No boss assigned
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredBattles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl">No battles found</p>
          </div>
        )}
      </div>

      {/* Battle Room Modal */}
      {battleView && battleView.boss && (
        <BossBattleRoom
          battle={battleView}
          onClose={() => setBattleView(null)}
        />
      )}
    </div>
  );
};
