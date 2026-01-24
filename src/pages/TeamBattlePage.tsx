import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CharacterStats } from "../types/character";
import { CharacterParser } from "../utils/characterParser";
import { getAssetPath } from "../utils/basePath";
import { isTauri } from "../utils/localStorage";
import wheelBgImage from "../assets/img/wheel-bg.png";

// Check if running in web-only mode
const isWebOnly = !isTauri();

// Types for data from JSON files
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

interface TeamMemberJson {
  name: string;
  username: string;
}

interface TeamJson {
  id: number;
  boss: string | null;
  members: TeamMemberJson[];
}

interface TeamsData {
  teams: TeamJson[];
}

interface BossesData {
  bosses: Boss[];
}

// Player data from files
interface PlayerData {
  no: number;
  name: string;
  username: string;
  stats: CharacterStats;
  team?: number;
}

// Combined battle view
interface BattleView {
  teamId: number;
  boss: Boss | null;
  members: TeamMemberJson[];
  playerData: PlayerData[];
}

export const TeamBattlePage = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamJson[]>([]);
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<"all" | "with-boss" | "no-boss">("all");
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load teams.json
        const teamsResponse = await fetch(getAssetPath("/data/battles/teams.json"));
        if (teamsResponse.ok) {
          const teamsData: TeamsData = await teamsResponse.json();
          setTeams(teamsData.teams);
        }

        // Load bosses.json
        const bossesResponse = await fetch(getAssetPath("/data/battles/bosses.json"));
        if (bossesResponse.ok) {
          const bossesData: BossesData = await bossesResponse.json();
          setBosses(bossesData.bosses);
        }

        // Load all players to get stats
        const playerList: PlayerData[] = [];
        const fetchPromises: Promise<void>[] = [];

        for (let i = 1; i <= 256; i++) {
          fetchPromises.push(
            fetch(getAssetPath(`/data/No${i}.txt`))
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
        setPlayers(playerList);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
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
    players.forEach((p) => {
      if (p.username) map.set(p.username.toLowerCase(), p);
    });
    return map;
  }, [players]);

  // Build battle views
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

  // Summary stats
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

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url(${wheelBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Header */}
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            {!isWebOnly && (
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2"
              >
                <span>&larr;</span> Back to Home
              </button>
            )}
            {isWebOnly && <div />}
            <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 italic">
              Team vs Boss Battles
            </h1>
            <div />
          </div>

          {/* Summary Stats */}
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-purple-600/80 rounded-full text-white text-sm font-medium">
                Total Teams: {summary.total}
              </span>
              <span className="px-3 py-1 bg-red-600/80 rounded-full text-white text-sm font-medium">
                Fighting Boss: {summary.withBoss}
              </span>
              <span className="px-3 py-1 bg-gray-600/80 rounded-full text-white text-sm font-medium">
                No Boss: {summary.noBoss}
              </span>
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Teams ({summary.total})</option>
              <option value="with-boss">Fighting Boss ({summary.withBoss})</option>
              <option value="no-boss">No Boss Assigned ({summary.noBoss})</option>
            </select>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4" />
            <p className="text-gray-400 text-xl">Loading battles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBattles.map((battle) => (
              <BattleCard
                key={battle.teamId}
                battle={battle}
                isExpanded={expandedTeam === battle.teamId}
                onToggle={() =>
                  setExpandedTeam(expandedTeam === battle.teamId ? null : battle.teamId)
                }
                getTotalStats={getTotalStats}
                onBossClick={() => battle.boss && setSelectedBoss(battle.boss)}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredBattles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl">No teams found</p>
          </div>
        )}
      </main>

      {/* Boss Detail Modal */}
      {selectedBoss && (
        <BossDetailModal boss={selectedBoss} onClose={() => setSelectedBoss(null)} />
      )}
    </div>
  );
};

// Battle Card Component
interface BattleCardProps {
  battle: BattleView;
  isExpanded: boolean;
  onToggle: () => void;
  getTotalStats: (stats: BossStats | CharacterStats) => number;
  onBossClick: () => void;
}

const BattleCard = ({ battle, isExpanded, onToggle, getTotalStats, onBossClick }: BattleCardProps) => {
  const hasBoss = battle.boss !== null;
  const bossTotalStats = battle.boss ? getTotalStats(battle.boss.stats) : 0;

  // Calculate team total stats
  const teamTotalStats = useMemo(() => {
    return battle.playerData.reduce((sum, p) => sum + getTotalStats(p.stats), 0);
  }, [battle.playerData, getTotalStats]);

  return (
    <div
      className={`bg-gray-800/90 backdrop-blur-sm border-2 rounded-xl overflow-hidden transition-all ${
        hasBoss ? "border-red-500/50" : "border-gray-600"
      }`}
    >
      {/* Card Header */}
      <div
        className={`px-4 py-3 cursor-pointer transition-colors ${
          hasBoss ? "bg-red-600/20 hover:bg-red-600/30" : "bg-gray-700/50 hover:bg-gray-700/70"
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-orange-400">#{battle.teamId}</span>
            <div>
              <h3 className="text-lg font-bold text-white">Team {battle.teamId}</h3>
              <p className="text-sm text-gray-400">
                {hasBoss ? (
                  <>
                    vs{" "}
                    <span
                      className="text-red-400 font-medium hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBossClick();
                      }}
                    >
                      {battle.boss!.name}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500 italic">No boss assigned</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {battle.members.length} members
            </span>
            <span className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>
              ▼
            </span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="px-4 py-4">
        {/* Boss Stats */}
        {hasBoss && battle.boss && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Boss Stats</h4>
            <div className="grid grid-cols-6 gap-2 text-center">
              <StatBadge label="STR" value={battle.boss.stats.str} color="text-red-400" />
              <StatBadge label="SPD" value={battle.boss.stats.spd} color="text-yellow-400" />
              <StatBadge label="DUR" value={battle.boss.stats.dur} color="text-blue-400" />
              <StatBadge label="IQ" value={battle.boss.stats.iq} color="text-purple-400" />
              <StatBadge label="BIQ" value={battle.boss.stats.biq} color="text-pink-400" />
              <StatBadge label="MA" value={battle.boss.stats.ma} color="text-orange-400" />
            </div>
            <div className="text-center mt-2">
              <span className="text-gray-400 text-sm">Boss Total: </span>
              <span className="text-red-400 font-bold">{bossTotalStats}</span>
              {battle.playerData.length > 0 && (
                <>
                  <span className="text-gray-500 mx-2">vs</span>
                  <span className="text-gray-400 text-sm">Team Total: </span>
                  <span className="text-green-400 font-bold">{teamTotalStats}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Reward & Punishment */}
        {hasBoss && battle.boss && (
          <div className="grid grid-cols-2 gap-4">
            {/* Reward */}
            <div className="p-3 rounded-lg border bg-green-500/10 border-green-500/50">
              <h4 className="text-sm font-bold mb-1 text-green-400">Reward (Win)</h4>
              <p className="text-sm text-green-300 line-clamp-3">{battle.boss.reward}</p>
            </div>

            {/* Punishment */}
            <div className="p-3 rounded-lg border bg-red-500/10 border-red-500/50">
              <h4 className="text-sm font-bold mb-1 text-red-400">Punishment (Lose)</h4>
              <p className="text-sm text-red-300 line-clamp-3">{battle.boss.punishment}</p>
            </div>
          </div>
        )}

        {/* Expanded: Team Members */}
        {isExpanded && (
          <div className={`mt-4 pt-4 border-t border-gray-600 ${!hasBoss ? "mt-0 pt-0 border-t-0" : ""}`}>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Team Members ({battle.members.length})</h4>
            {battle.members.length > 0 ? (
              <div className="space-y-2">
                {battle.members.map((member, idx) => {
                  const playerData = battle.playerData.find(
                    (p) => p.username.toLowerCase() === member.username.toLowerCase()
                  );
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-700/50 rounded px-3 py-2"
                    >
                      <div>
                        {playerData && (
                          <span className="text-teal-400 text-xs mr-2">No.{playerData.no}</span>
                        )}
                        <span className="text-white font-medium">{member.name}</span>
                        <span className="text-gray-400 text-sm ml-2">({member.username})</span>
                      </div>
                      {playerData && (
                        <div className="text-xs text-gray-400">
                          Total:{" "}
                          <span className="text-white font-medium">
                            {getTotalStats(playerData.stats)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No members in this team</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Boss Detail Modal
interface BossDetailModalProps {
  boss: Boss;
  onClose: () => void;
}

const BossDetailModal = ({ boss, onClose }: BossDetailModalProps) => {
  const totalStats =
    (boss.stats.str || 0) +
    (boss.stats.spd || 0) +
    (boss.stats.dur || 0) +
    (boss.stats.iq || 0) +
    (boss.stats.biq || 0) +
    (boss.stats.ma || 0);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800/95 backdrop-blur-sm border border-red-500/50 rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Boss #{boss.id}</p>
            <h2 className="text-xl font-bold text-white">{boss.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-3xl font-light transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Stats */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-white mb-3">Stats</h3>
          <div className="grid grid-cols-6 gap-3 text-center mb-4">
            <StatBadgeLarge label="STR" value={boss.stats.str} color="text-red-400" />
            <StatBadgeLarge label="SPD" value={boss.stats.spd} color="text-yellow-400" />
            <StatBadgeLarge label="DUR" value={boss.stats.dur} color="text-blue-400" />
            <StatBadgeLarge label="IQ" value={boss.stats.iq} color="text-purple-400" />
            <StatBadgeLarge label="BIQ" value={boss.stats.biq} color="text-pink-400" />
            <StatBadgeLarge label="MA" value={boss.stats.ma} color="text-orange-400" />
          </div>
          <div className="text-center mb-6">
            <span className="text-gray-400">Total: </span>
            <span className="text-2xl font-bold text-white">{totalStats}</span>
          </div>

          {/* Reward */}
          <div className="mb-4 p-4 rounded-lg bg-green-500/20 border border-green-500/50">
            <h4 className="text-green-400 font-bold mb-2">Reward (Win)</h4>
            <p className="text-green-300 text-sm">{boss.reward}</p>
          </div>

          {/* Punishment */}
          <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50">
            <h4 className="text-red-400 font-bold mb-2">Punishment (Lose)</h4>
            <p className="text-red-300 text-sm">{boss.punishment}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Badge Component
const StatBadge = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null;
  color: string;
}) => (
  <div className="bg-gray-700/50 rounded px-2 py-1">
    <div className={`text-xs font-medium ${color}`}>{label}</div>
    <div className="text-white font-bold">{value ?? "?"}</div>
  </div>
);

// Larger Stat Badge for Modal
const StatBadgeLarge = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null;
  color: string;
}) => (
  <div className="bg-gray-700/50 rounded-lg px-3 py-2">
    <div className={`text-sm font-medium ${color}`}>{label}</div>
    <div className="text-white font-bold text-xl">{value ?? "?"}</div>
  </div>
);
