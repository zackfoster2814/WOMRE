import { useState, useEffect, useMemo, useRef } from "react";
import {
  Character,
  CharacterStats,
  LossableItem,
  NestedArchetype,
  NestedHouse,
  Gear,
  Weapon,
  Rune,
  PvPReward,
  TournamentInfo,
} from "../types/character";
import { CharacterParser } from "../utils/characterParser";
import {
  EffectResolver,
  type EffectSourceBreakdown,
} from "../effects/resolver";
import { initializeEffectData } from "../effects/data";
import type {
  CharacterStats as EffectStats,
  EffectSourceType,
} from "../effects/types";
import wheelBgImage from "../assets/img/wheel-bg.png";
import {
  getAssetPath,
  getPlayerNumbers,
  clearPlayerNumbersCache,
} from "../utils/basePath";
import { isTauri } from "../utils/localStorage";

// Check if running in web-only mode
const isWebOnly = !isTauri();

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
  // Create a full character object for accurate effect calculation
  const character: Character = {
    no: player.no,
    name: player.name,
    username: player.username,
    isParasite: player.isParasite || false,
    race: { race: player.race, subRace: player.subRace },
    archetypes: player.archetypes || [],
    nestedArchetypes: player.nestedArchetypes,
    quirks: player.quirks || [],
    stats: player.stats,
    giantBonusApplied: player.giantBonusApplied,
    houses: player.houses || [],
    nestedHouses: player.nestedHouses,
    gear: player.gear || { normalGear: [], legacyGear: [] },
    weapons: player.weapons || [],
    runes: player.runes || { runes: [] },
    powers: player.powers || [],
    charDevs: player.charDevs || [],
    lover: player.lover,
    pvpRewards: player.pvpRewards,
  };
  const effects = EffectResolver.calculateCharacterEffects(character);
  return effects.totalStats;
}

interface PlayerSummary {
  no: number;
  name: string;
  username: string;
  race: string;
  subRace?: string;
  archetypes: string[];
  nestedArchetypes?: NestedArchetype[];
  quirks: LossableItem[];
  powers: LossableItem[];
  houses: LossableItem[];
  nestedHouses?: NestedHouse[];
  team?: number;
  stats: CharacterStats;
  gear: Gear;
  weapons: Weapon[];
  runes: Rune;
  charDevs: LossableItem[];
  lover?: LossableItem[];
  pvpRewards?: PvPReward[];
  giantBonusApplied?: boolean;
  isParasite?: boolean;
  parasiteInfo?: string[];
  parasiteName?: string;
  parasiteType?: string;
  isSymbiosis?: boolean;
  symbiosisType?: string;
  symbiosisHost?: string;
  // Tournament status
  tournament?: TournamentInfo;
}

// Types for team/boss data
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
  rules?: string[];
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

// House Lore Section Component
interface HouseLoreSectionProps {
  players: PlayerSummary[];
  onPlayerClick: (playerNo: number) => void;
}

interface HouseLoreData {
  houseName: string;
  description: string;
  effect: string;
  // Người phản bội - chọn lợi ích cá nhân thay vì tập thể
  traitor?: {
    name: string;
    username: string;
  };
  traitorEffect?: string;
  // Hiệu ứng cho toàn tộc (khi không có người phản bội hoặc hiệu ứng tập thể)
  collectiveEffect?: string;
  tooltipPlaceholder?: boolean;
  color: string;
  bgGradient: string;
  icon: string;
}

const HouseLoreSection = ({
  players,
  onPlayerClick,
}: HouseLoreSectionProps) => {
  const houseLoreData: HouseLoreData[] = [
    {
      houseName: "House Baratheon",
      description: "Ours Is The Fury.",
      effect: "+1 Str, +1 BIQ, +1 MA, Base Stat thấp nhất +2",
      collectiveEffect: "Đã kích hoạt: +1 all base stat cho toàn tộc",
      color: "amber",
      bgGradient: "from-amber-900/80 to-yellow-900/80",
      icon: "",
    },
    {
      houseName: "House Lannister",
      description: "Hear Me Roar!",
      effect: "Nhận 3 Gear 'Golden Coin' và 2 Gear ngẫu nhiên",
      traitor: {
        name: "Dung",
        username: "haruharu9127",
      },
      traitorEffect: "Đã kích hoạt: +2 all base stat (chỉ bản thân)",
      tooltipPlaceholder: true,
      color: "red",
      bgGradient: "from-red-900/80 to-amber-900/80",
      icon: "",
    },
    {
      houseName: "Uchiha",
      description:
        "They stayed with me my whole life only to leave me at my death – my tears",
      effect:
        "+2 Dura, +2 BIQ. Mỗi khi đánh bại đối thủ, nhận +1 Stat cao nhất",
      traitor: {
        name: "2FaceCat",
        username: "2facecat.",
      },
      traitorEffect: "Đã kích hoạt: +2 all base stat (chỉ bản thân)",
      tooltipPlaceholder: true,
      color: "purple",
      bgGradient: "from-purple-900/80 to-red-900/80",
      icon: "",
    },
  ];

  // Find players belonging to each house
  const getHouseMembers = (houseName: string) => {
    return players.filter((p) =>
      p.houses?.some((h) => !h.isLost && h.name === houseName),
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-purple-300 mb-2">
          Chuyện bộ tộc
        </h2>
      </div>

      {/* House Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {houseLoreData.map((house) => {
          const members = getHouseMembers(house.houseName);
          const traitorPlayer = house.traitor
            ? players.find(
                (p) =>
                  p.username.toLowerCase() ===
                  house.traitor!.username.toLowerCase(),
              )
            : null;

          return (
            <div
              key={house.houseName}
              className={`bg-gradient-to-br ${house.bgGradient} border border-gray-600 rounded-xl overflow-hidden shadow-xl`}
            >
              {/* House Header */}
              <div
                className={`bg-${house.color}-600/30 px-6 py-4 border-b border-gray-600`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{house.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {house.houseName}
                    </h3>
                    <span className={`text-${house.color}-300 text-sm`}>
                      {members.length} thành viên
                    </span>
                  </div>
                </div>
              </div>

              {/* House Content */}
              <div className="p-6 space-y-4">
                {/* Description */}
                <p className="text-gray-300 text-sm leading-relaxed">
                  {house.description}
                </p>

                {/* Base Effect */}
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Hiệu ứng cơ bản:</p>
                  <p className={`text-${house.color}-300 font-medium text-sm`}>
                    {house.effect}
                  </p>
                </div>

                {/* Traitor Section - Người phản bội */}
                {house.traitor ? (
                  <div className="bg-gradient-to-r from-red-900/40 to-red-800/40 border-2 border-red-500/50 rounded-lg p-4 relative overflow-hidden">
                    {/* Warning stripes background */}
                    <div className="absolute inset-0 opacity-5">
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(45deg, transparent, transparent 10px, #ef4444 10px, #ef4444 20px)",
                        }}
                      ></div>
                    </div>

                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2"></div>
                        {house.tooltipPlaceholder && (
                          <div className="group relative">
                            <span className="text-gray-400 text-xs cursor-help border-b border-dotted border-gray-400">
                              [Bằng chứng]
                            </span>
                            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                              Hình ảnh sẽ được thêm sau
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 bg-black/30 rounded-lg p-3">
                        <div className="flex-1">
                          <p className="text-red-300 font-bold text-lg">
                            {house.traitor.name}
                          </p>
                          <p className="text-red-400/70 text-xs">
                            @{house.traitor.username}
                          </p>
                        </div>
                      </div>

                      {traitorPlayer && (
                        <button
                          onClick={() => onPlayerClick(traitorPlayer.no)}
                          className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                        >
                          Xem thông tin
                        </button>
                      )}

                      <div className="mt-3 pt-3 border-t border-red-500/30">
                        <p className="text-red-300 text-sm font-medium flex items-center gap-2">
                          {house.traitorEffect}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-400 text-xs font-medium uppercase tracking-wider">
                        Hiệu ứng toàn tộc
                      </span>
                    </div>
                    <p className="text-green-300 text-sm font-medium">
                      {house.collectiveEffect}
                    </p>
                  </div>
                )}

                {/* Members Preview */}
                {members.length > 0 && (
                  <div className="pt-4 border-t border-gray-600">
                    <p className="text-xs text-gray-400 mb-2">Thành viên:</p>
                    <div className="flex flex-wrap gap-2">
                      {members.slice(0, 6).map((member) => (
                        <button
                          key={member.no}
                          onClick={() => onPlayerClick(member.no)}
                          className="px-2 py-1 bg-gray-700/50 hover:bg-gray-600/50 rounded text-xs text-white transition-colors"
                          title={`${member.name} (@${member.username})`}
                        >
                          {member.name}
                        </button>
                      ))}
                      {members.length > 6 && (
                        <span className="px-2 py-1 text-gray-400 text-xs">
                          +{members.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const PlayerListPage = () => {
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
  const [showRaceStats, setShowRaceStats] = useState(false);
  const [selectedHouses, setSelectedHouses] = useState<string[]>([]);
  const [showHouseFilter, setShowHouseFilter] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [showTeamFilter, setShowTeamFilter] = useState(false);

  // View mode: "players", "teams", or "house-lore"
  const [viewMode, setViewMode] = useState<"players" | "teams" | "house-lore">(
    "players",
  );

  // Team/Boss data
  const [teams, setTeams] = useState<TeamJson[]>([]);
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null);
  const [teamFilterType, setTeamFilterType] = useState<
    "all" | "with-boss" | "no-boss"
  >("all");

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Load teams and bosses data
      let teamsData: TeamJson[] = [];
      try {
        const [teamsRes, bossesRes] = await Promise.all([
          fetch(getAssetPath("/data/battles/teams.json")),
          fetch(getAssetPath("/data/battles/bosses.json")),
        ]);

        if (teamsRes.ok) {
          const teamsJson = await teamsRes.json();
          teamsData = teamsJson.teams || [];
          setTeams(teamsData);
        }

        if (bossesRes.ok) {
          const bossesData = await bossesRes.json();
          setBosses(bossesData.bosses || []);
        }
      } catch (error) {
        console.error("Failed to load team/boss data:", error);
      }

      // Build username to team mapping
      const usernameToTeam = new Map<string, number>();
      teamsData.forEach((team) => {
        team.members.forEach((member) => {
          usernameToTeam.set(member.username.toLowerCase(), team.id);
        });
      });

      // Load players
      const playerList: PlayerSummary[] = [];

      // Get player numbers from player-index.json
      const playerNumbers = await getPlayerNumbers();
      const fetchPromises: Promise<void>[] = [];

      for (const playerNo of playerNumbers) {
        fetchPromises.push(
          fetch(getAssetPath(`/data/No${playerNo}.txt`))
            .then(async (response) => {
              if (response.ok) {
                const content = await response.text();
                const char = CharacterParser.parseCharacterFile(content);
                const username = char.username || "";
                // Get team from teams.json mapping
                const teamId = usernameToTeam.get(username.toLowerCase());
                playerList.push({
                  no: char.no || playerNo,
                  name: char.name || `Player ${playerNo}`,
                  username: username,
                  race: char.race?.race || "Unknown",
                  subRace: char.race?.subRace,
                  archetypes: char.archetypes || [],
                  nestedArchetypes: char.nestedArchetypes,
                  quirks: char.quirks || [],
                  powers: char.powers || [],
                  houses: char.houses || [],
                  nestedHouses: char.nestedHouses,
                  team: teamId,
                  stats: char.stats,
                  gear: char.gear,
                  weapons: char.weapons,
                  runes: char.runes,
                  charDevs: char.charDevs || [],
                  lover: char.lover,
                  pvpRewards: char.pvpRewards,
                  giantBonusApplied: char.giantBonusApplied,
                  isParasite: char.isParasite,
                  parasiteInfo: char.parasiteInfo,
                  parasiteName: char.parasiteName,
                  parasiteType: char.parasiteType,
                  isSymbiosis: char.isSymbiosis,
                  symbiosisType: char.symbiosisType,
                  symbiosisHost: char.symbiosisHost,
                  tournament: char.tournament,
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

    loadData();
  }, []);

  // Refresh player list
  const refreshPlayers = () => {
    setPlayers([]);
    setIsLoading(true);
    // Clear cache to get fresh player list
    clearPlayerNumbersCache();
    // Trigger re-fetch by clearing and re-running
    const loadPlayers = async () => {
      // Reload teams data
      let teamsData: TeamJson[] = [];
      try {
        const teamsRes = await fetch(getAssetPath("/data/battles/teams.json"), {
          cache: "no-store",
        });
        if (teamsRes.ok) {
          const teamsJson = await teamsRes.json();
          teamsData = teamsJson.teams || [];
          setTeams(teamsData);
        }
      } catch (error) {
        console.error("Failed to reload teams:", error);
      }

      // Build username to team mapping
      const usernameToTeam = new Map<string, number>();
      teamsData.forEach((team) => {
        team.members.forEach((member) => {
          usernameToTeam.set(member.username.toLowerCase(), team.id);
        });
      });

      const playerList: PlayerSummary[] = [];
      // Force reload player numbers from file
      const playerNumbers = await getPlayerNumbers(true);
      const fetchPromises: Promise<void>[] = [];

      for (const playerNo of playerNumbers) {
        fetchPromises.push(
          fetch(getAssetPath(`/data/No${playerNo}.txt`), { cache: "no-store" })
            .then(async (response) => {
              if (response.ok) {
                const content = await response.text();
                const char = CharacterParser.parseCharacterFile(content);
                const username = char.username || "";
                const teamId = usernameToTeam.get(username.toLowerCase());
                playerList.push({
                  no: char.no || playerNo,
                  name: char.name || `Player ${playerNo}`,
                  username: username,
                  race: char.race?.race || "Unknown",
                  subRace: char.race?.subRace,
                  archetypes: char.archetypes || [],
                  nestedArchetypes: char.nestedArchetypes,
                  quirks: char.quirks || [],
                  powers: char.powers || [],
                  houses: char.houses || [],
                  nestedHouses: char.nestedHouses,
                  team: teamId,
                  stats: char.stats,
                  gear: char.gear,
                  weapons: char.weapons,
                  runes: char.runes,
                  charDevs: char.charDevs || [],
                  lover: char.lover,
                  pvpRewards: char.pvpRewards,
                  giantBonusApplied: char.giantBonusApplied,
                  isParasite: char.isParasite,
                  parasiteInfo: char.parasiteInfo,
                  parasiteName: char.parasiteName,
                  parasiteType: char.parasiteType,
                  isSymbiosis: char.isSymbiosis,
                  symbiosisType: char.symbiosisType,
                  symbiosisHost: char.symbiosisHost,
                  tournament: char.tournament,
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
      const response = await fetch(getAssetPath(`/data/No${playerNo}.txt`));
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

  // Calculate race statistics
  const raceStats = useMemo(() => {
    const stats: Record<string, number> = {};
    players.forEach((p) => {
      const race = p.race || "Unknown";
      stats[race] = (stats[race] || 0) + 1;
    });
    // Sort by count descending
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .map(([race, count]) => ({
        race,
        count,
        percentage: (count / players.length) * 100,
      }));
  }, [players]);

  // Toggle race selection
  const toggleRaceFilter = (race: string) => {
    setSelectedRaces((prev) =>
      prev.includes(race) ? prev.filter((r) => r !== race) : [...prev, race],
    );
  };

  // Get unique houses from all players
  const availableHouses = useMemo(() => {
    const houseSet = new Set<string>();
    players.forEach((p) => {
      p.houses?.forEach((h) => {
        if (!h.isLost && h.name.trim()) {
          houseSet.add(h.name);
        }
      });
    });
    const sortedHouses = Array.from(houseSet).sort();
    // Check if there are players without house
    const hasNoHouse = players.some(
      (p) =>
        !p.houses || p.houses.length === 0 || p.houses.every((h) => h.isLost),
    );
    if (hasNoHouse) {
      sortedHouses.push("No House");
    }
    return sortedHouses;
  }, [players]);

  // Toggle house selection
  const toggleHouseFilter = (house: string) => {
    setSelectedHouses((prev) =>
      prev.includes(house) ? prev.filter((h) => h !== house) : [...prev, house],
    );
  };

  // Get unique teams from all players
  const availableTeams = useMemo(() => {
    const teamSet = new Set<number>();
    players.forEach((p) => {
      if (p.team !== undefined && p.team !== null) {
        teamSet.add(p.team);
      }
    });
    const sortedTeams = Array.from(teamSet).sort((a, b) => a - b);
    return sortedTeams;
  }, [players]);

  // Check if there are players without team
  const hasNoTeam = useMemo(() => {
    return players.some((p) => p.team === undefined || p.team === null);
  }, [players]);

  // Toggle team selection
  const toggleTeamFilter = (team: number | "no-team") => {
    if (team === "no-team") {
      setSelectedTeams((prev) =>
        prev.includes(-1) ? prev.filter((t) => t !== -1) : [...prev, -1],
      );
    } else {
      setSelectedTeams((prev) =>
        prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team],
      );
    }
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

    // Apply house filter if any houses are selected
    if (selectedHouses.length > 0) {
      result = result.filter((p) => {
        // Handle "No House" filter for players without active house
        const activeHouses = p.houses?.filter((h) => !h.isLost) || [];
        if (selectedHouses.includes("No House") && activeHouses.length === 0) {
          return true;
        }
        return activeHouses.some((h) => selectedHouses.includes(h.name));
      });
    }

    // Apply team filter if any teams are selected
    if (selectedTeams.length > 0) {
      result = result.filter((p) => {
        // Handle "No Team" filter (using -1 as marker)
        if (
          selectedTeams.includes(-1) &&
          (p.team === undefined || p.team === null)
        ) {
          return true;
        }
        return (
          p.team !== undefined &&
          p.team !== null &&
          selectedTeams.includes(p.team)
        );
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
  }, [players, searchTerm, sortBy, selectedRaces, selectedTeams]);
  // }, [players, searchTerm, sortBy, selectedRaces, selectedHouses]);

  // Create boss lookup map
  const bossMap = useMemo(() => {
    const map = new Map<string, Boss>();
    bosses.forEach((boss) => map.set(boss.name, boss));
    return map;
  }, [bosses]);

  // Create player lookup by username
  const playerByUsername = useMemo(() => {
    const map = new Map<string, PlayerSummary>();
    players.forEach((p) => {
      if (p.username) map.set(p.username.toLowerCase(), p);
    });
    return map;
  }, [players]);

  // Build team views with boss and player data
  const teamViews = useMemo(() => {
    return teams.map((team) => {
      const boss = team.boss ? bossMap.get(team.boss) || null : null;
      const memberData: PlayerSummary[] = [];
      team.members.forEach((member) => {
        const player = playerByUsername.get(member.username.toLowerCase());
        if (player) memberData.push(player);
      });
      return { ...team, bossData: boss, memberData };
    });
  }, [teams, bossMap, playerByUsername]);

  // Filter teams
  const filteredTeams = useMemo(() => {
    switch (teamFilterType) {
      case "with-boss":
        return teamViews.filter((t) => t.bossData !== null);
      case "no-boss":
        return teamViews.filter((t) => t.bossData === null);
      default:
        return teamViews;
    }
  }, [teamViews, teamFilterType]);

  // Team summary
  const teamSummary = useMemo(() => {
    const withBoss = teamViews.filter((t) => t.bossData !== null).length;
    const noBoss = teamViews.filter((t) => t.bossData === null).length;
    return { total: teamViews.length, withBoss, noBoss };
  }, [teamViews]);

  // Helper to calculate total stats
  const getTotalStatsHelper = (stats: CharacterStats | BossStats) => {
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
      className="h-screen flex flex-col"
      style={{
        backgroundImage: `url(${wheelBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Fixed Header - add left padding for menu button in app mode */}
      <header
        className={`flex-shrink-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 px-4 py-3 overflow-visible relative z-[50] ${!isWebOnly ? "pl-40" : ""}`}
      >
        <div className="max-w-7xl mx-auto overflow-visible">
          <div className="flex items-center justify-center gap-6 mb-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("players")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  viewMode === "players"
                    ? "bg-teal-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Players
              </button>
              <button
                onClick={() => setViewMode("teams")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  viewMode === "teams"
                    ? "bg-orange-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Teams
              </button>
              <button
                onClick={() => setViewMode("house-lore")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  viewMode === "house-lore"
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                House Lore
              </button>
            </div>
            <button
              onClick={refreshPlayers}
              disabled={isLoading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2"
            >
              <span className={isLoading ? "animate-spin" : ""}>&#8635;</span>{" "}
              Refresh
            </button>
          </div>

          {/* Controls - Different for Players vs Teams vs House Lore */}
          {viewMode === "players" ? (
            /* Player Controls */
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
                  onClick={() => {
                    setShowRaceFilter(!showRaceFilter);
                    setShowHouseFilter(false);
                    setShowTeamFilter(false);
                  }}
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
                              isSelected
                                ? "bg-amber-600/30"
                                : "hover:bg-gray-700"
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

              {/* House Filter Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowHouseFilter(!showHouseFilter);
                    setShowRaceFilter(false);
                    setShowTeamFilter(false);
                  }}
                  className={`px-4 py-2 border rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    selectedHouses.length > 0
                      ? "bg-cyan-600/80 border-cyan-500 text-white"
                      : "bg-gray-800/80 border-gray-600 text-white hover:bg-gray-700/80"
                  }`}
                >
                  <span>🏠 House Filter</span>
                  {selectedHouses.length > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {selectedHouses.length}
                    </span>
                  )}
                </button>

                {/* House Filter Dropdown */}
                {showHouseFilter && (
                  <div className="absolute top-full right-0 mt-2 z-[9999] bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-3 min-w-[250px] max-h-[400px] overflow-y-auto">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-600">
                      <span className="text-white font-medium text-sm">
                        Filter by House
                      </span>
                      {selectedHouses.length > 0 && (
                        <button
                          onClick={() => setSelectedHouses([])}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {availableHouses.map((house) => {
                        const count =
                          house === "No House"
                            ? players.filter(
                                (p) =>
                                  !p.houses ||
                                  p.houses.length === 0 ||
                                  p.houses.every((h) => h.isLost),
                              ).length
                            : players.filter((p) =>
                                p.houses?.some(
                                  (h) => !h.isLost && h.name === house,
                                ),
                              ).length;
                        const isSelected = selectedHouses.includes(house);
                        return (
                          <label
                            key={house}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-cyan-600/30"
                                : "hover:bg-gray-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleHouseFilter(house)}
                              className="w-4 h-4 rounded border-gray-500 text-cyan-500 focus:ring-cyan-500 bg-gray-700"
                            />
                            <span className="text-white text-sm flex-1">
                              {house}
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

              {/* Team Filter Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowTeamFilter(!showTeamFilter);
                    setShowRaceFilter(false);
                    setShowHouseFilter(false);
                  }}
                  className={`px-4 py-2 border rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    selectedTeams.length > 0
                      ? "bg-purple-600/80 border-purple-500 text-white"
                      : "bg-gray-800/80 border-gray-600 text-white hover:bg-gray-700/80"
                  }`}
                >
                  <span>👥 Team Filter</span>
                  {selectedTeams.length > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {selectedTeams.length}
                    </span>
                  )}
                </button>

                {/* Team Filter Dropdown */}
                {showTeamFilter && (
                  <div className="absolute top-full right-0 mt-2 z-[9999] bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-3 min-w-[200px] max-h-[400px] overflow-y-auto">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-600">
                      <span className="text-white font-medium text-sm">
                        Filter by Team
                      </span>
                      {selectedTeams.length > 0 && (
                        <button
                          onClick={() => setSelectedTeams([])}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {/* No Team option */}
                      {hasNoTeam && (
                        <label
                          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                            selectedTeams.includes(-1)
                              ? "bg-purple-600/30"
                              : "hover:bg-gray-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTeams.includes(-1)}
                            onChange={() => toggleTeamFilter("no-team")}
                            className="w-4 h-4 rounded border-gray-500 text-purple-500 focus:ring-purple-500 bg-gray-700"
                          />
                          <span className="text-white text-sm flex-1">
                            No Team
                          </span>
                          <span className="text-gray-400 text-xs">
                            (
                            {
                              players.filter(
                                (p) => p.team === undefined || p.team === null,
                              ).length
                            }
                            )
                          </span>
                        </label>
                      )}
                      {availableTeams.map((team) => {
                        const count = players.filter(
                          (p) => p.team === team,
                        ).length;
                        const isSelected = selectedTeams.includes(team);
                        return (
                          <label
                            key={team}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-purple-600/30"
                                : "hover:bg-gray-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleTeamFilter(team)}
                              className="w-4 h-4 rounded border-gray-500 text-purple-500 focus:ring-purple-500 bg-gray-700"
                            />
                            <span className="text-white text-sm flex-1">
                              Team {team}
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
              <button
                onClick={() => setShowRaceStats(true)}
                className="px-4 py-2 bg-amber-600/80 hover:bg-amber-700/80 border border-amber-500 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
              >
                <span>📊</span> Race Stats
              </button>
              <span className="text-gray-400">
                {filteredPlayers.length} players found
              </span>
            </div>
          ) : viewMode === "teams" ? (
            /* Team Controls */
            <div className="flex flex-wrap gap-4 items-center justify-center">
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-purple-600/80 rounded-full text-white text-sm font-medium">
                  Total: {teamSummary.total}
                </span>
                <span className="px-3 py-1 bg-red-600/80 rounded-full text-white text-sm font-medium">
                  Fighting Boss: {teamSummary.withBoss}
                </span>
                <span className="px-3 py-1 bg-gray-600/80 rounded-full text-white text-sm font-medium">
                  No Boss: {teamSummary.noBoss}
                </span>
              </div>
              <select
                value={teamFilterType}
                onChange={(e) =>
                  setTeamFilterType(e.target.value as typeof teamFilterType)
                }
                className="px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Teams ({teamSummary.total})</option>
                <option value="with-boss">
                  Fighting Boss ({teamSummary.withBoss})
                </option>
                <option value="no-boss">No Boss ({teamSummary.noBoss})</option>
              </select>
            </div>
          ) : viewMode === "house-lore" ? (
            /* House Lore Controls */
            <div className="flex flex-wrap gap-4 items-center justify-center"></div>
          ) : null}
        </div>
      </header>

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mb-4" />
              <p className="text-gray-400 text-xl">Loading data...</p>
            </div>
          ) : viewMode === "players" ? (
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
          ) : viewMode === "teams" ? (
            <>
              {/* Team Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTeams.map((team) => (
                  <TeamBattleCard
                    key={team.id}
                    team={team}
                    onBossClick={() =>
                      team.bossData && setSelectedBoss(team.bossData)
                    }
                    getTotalStats={getTotalStatsHelper}
                    onMemberClick={handleSelectPlayer}
                  />
                ))}
              </div>

              {/* No teams message */}
              {filteredTeams.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-xl">No teams found</p>
                </div>
              )}
            </>
          ) : viewMode === "house-lore" ? (
            <HouseLoreSection
              players={players}
              onPlayerClick={handleSelectPlayer}
            />
          ) : null}
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

      {/* Race Statistics Dialog */}
      {showRaceStats && (
        <RaceStatsDialog
          raceStats={raceStats}
          totalPlayers={players.length}
          onClose={() => setShowRaceStats(false)}
        />
      )}

      {/* Boss Detail Modal */}
      {selectedBoss && (
        <BossDetailModal
          boss={selectedBoss}
          onClose={() => setSelectedBoss(null)}
        />
      )}
    </div>
  );
};

// Race Statistics Dialog Component
interface RaceStatsDialogProps {
  raceStats: { race: string; count: number; percentage: number }[];
  totalPlayers: number;
  onClose: () => void;
}

const RaceStatsDialog = ({
  raceStats,
  totalPlayers,
  onClose,
}: RaceStatsDialogProps) => {
  const topRace = raceStats[0];
  const maxCount = topRace?.count || 1;

  // Color palette for bars
  const getBarColor = (index: number) => {
    const colors = [
      "bg-amber-500",
      "bg-teal-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-red-500",
      "bg-orange-500",
      "bg-cyan-500",
      "bg-indigo-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📊</span> Race Statistics
            </h2>
            <p className="text-white/70 text-sm">
              Total: {totalPlayers} players
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-3xl font-light transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Top Race Highlight */}
        {topRace && (
          <div className="px-6 py-4 bg-amber-500/20 border-b border-amber-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-400 text-sm font-medium">
                  Most Popular Race
                </p>
                <p className="text-2xl font-bold text-white">{topRace.race}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-400">
                  {topRace.count}
                </p>
                <p className="text-sm text-gray-400">
                  {topRace.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Race List */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          <div className="space-y-2">
            {raceStats.map((stat, index) => (
              <div key={stat.race} className="flex items-center gap-3">
                <span className="w-6 text-gray-500 text-sm text-right">
                  #{index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium">
                      {stat.race}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {stat.count} ({stat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getBarColor(index)} transition-all duration-500`}
                      style={{ width: `${(stat.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Races</span>
              <span className="text-white font-medium">{raceStats.length}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Average per Race</span>
              <span className="text-white font-medium">
                {(totalPlayers / raceStats.length).toFixed(1)} players
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mini Hexagon Radar Chart for Player Card
const MiniHexagonChart = ({
  stats,
  totalStats,
}: {
  stats: CharacterStats;
  totalStats: EffectStats;
}) => {
  const size = 70;
  const center = size / 2;
  const maxRadius = size / 2 - 8;
  const fixedMaxStat = 15; // Fixed max stat value

  const statConfig = [
    {
      key: "str" as keyof CharacterStats,
      effectKey: "strength" as keyof EffectStats,
      color: "#f87171",
    },
    {
      key: "spd" as keyof CharacterStats,
      effectKey: "speed" as keyof EffectStats,
      color: "#fbbf24",
    },
    {
      key: "dur" as keyof CharacterStats,
      effectKey: "durability" as keyof EffectStats,
      color: "#60a5fa",
    },
    {
      key: "iq" as keyof CharacterStats,
      effectKey: "iq" as keyof EffectStats,
      color: "#a78bfa",
    },
    {
      key: "biq" as keyof CharacterStats,
      effectKey: "biq" as keyof EffectStats,
      color: "#f472b6",
    },
    {
      key: "ma" as keyof CharacterStats,
      effectKey: "ma" as keyof EffectStats,
      color: "#fb923c",
    },
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
      } ${player.tournament?.status == "eliminated" ? "opacity-50 border-red-600" : ""}`}
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
                {player.symbiosisType} → {player.symbiosisHost}
                {/* Tooltip */}
                <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
                  <div className="bg-gray-900 border border-red-500/50 rounded-lg p-2 shadow-xl min-w-[150px] max-w-[250px]">
                    <div className="text-xs text-red-300 font-semibold mb-1">
                      Ký Sinh Trùng:
                    </div>
                    <div className="text-xs text-gray-300">
                      Loại: {player.symbiosisType}
                    </div>
                    <div className="text-xs text-gray-300">
                      Vật chủ: {player.symbiosisHost}
                    </div>
                  </div>
                </div>
              </span>
            )}
            {/* Badge for host character (has a parasite) */}
            {player.isParasite && player.parasiteName && (
              <span
                className="text-xs font-medium text-green-400 bg-green-400/20 px-2 py-0.5 rounded cursor-help relative group"
                title={`Bị ký sinh bởi ${player.parasiteName} (${player.parasiteType})`}
              >
                ({player.parasiteType}){/* Tooltip */}
                <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
                  <div className="bg-gray-900 border border-green-500/50 rounded-lg p-2 shadow-xl min-w-[150px] max-w-[250px]">
                    <div className="text-xs text-green-300 font-semibold mb-1">
                      Bị Ký Sinh bởi:
                    </div>
                    <div className="text-xs text-gray-300">
                      Loại: {player.parasiteType}
                    </div>
                    <div className="text-xs text-gray-300">
                      Ký sinh: {player.parasiteName}
                    </div>
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
            const effectKey =
              key === "str"
                ? "strength"
                : key === "spd"
                  ? "speed"
                  : key === "dur"
                    ? "durability"
                    : key;
            const totalValue = totalStats[effectKey as keyof EffectStats] || 0;
            const diff = totalValue - baseValue;
            return (
              <div key={key} className="flex justify-between">
                <span className={color}>{label}</span>
                <span className="text-white font-medium">
                  <span className="text-gray-500">{baseValue}</span>
                  <span className="text-gray-600 mx-0.5">→</span>
                  <span
                    className={
                      diff > 0
                        ? "text-green-400"
                        : diff < 0
                          ? "text-red-400"
                          : "text-white"
                    }
                  >
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
  sourceType,
}: {
  name: string;
  sourceType: EffectSourceType;
}) => {
  const summary = EffectResolver.getEffectSummary(name, sourceType);
  if (!summary) return null;

  // For conditional effects, show "conditional" in different color
  if (summary === "conditional") {
    return (
      <span className="text-[10px] text-yellow-400 ml-1">
        {/* (conditional) */}
      </span>
    );
  }

  return <span className="text-[10px] text-emerald-400 ml-1">({summary})</span>;
};

// Info button component for showing hierarchy popup
const InfoButton = ({
  onClick,
}: {
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    onClick={onClick}
    className="ml-1 w-4 h-4 rounded-full bg-gray-600 hover:bg-indigo-500 text-gray-300 hover:text-white text-[10px] font-bold transition-colors inline-flex items-center justify-center"
    title="Xem chi tiết"
  >
    ?
  </button>
);

// Inline tooltip component to show full archetype/house hierarchy
const HierarchyTooltip = ({
  isOpen,
  onClose,
  item,
  type,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: NestedArchetype | NestedHouse;
  type: "archetype" | "house";
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // Delay adding listener to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={tooltipRef}
      className="absolute left-full top-0 ml-2 z-[100] bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-2 min-w-[180px] whitespace-nowrap"
      onClick={(e) => e.stopPropagation()}
    >
      {type === "archetype" ? (
        <div className="space-y-1">
          {/* Level 1: Main archetype */}
          <div className="flex items-center gap-1.5">
            <span className="text-indigo-400 font-medium text-xs">
              {(item as NestedArchetype).name}
            </span>
            <StatModifierBadge
              name={(item as NestedArchetype).name}
              sourceType="archetype"
            />
          </div>
          {/* Level 2: Sub-type */}
          {(item as NestedArchetype).subType && (
            <div className="flex items-center gap-1.5 ml-3">
              <span className="text-gray-500 text-xs">→</span>
              <span className="text-pink-400 text-xs">
                {(item as NestedArchetype).subType}
              </span>
              <StatModifierBadge
                name={(item as NestedArchetype).subType!}
                sourceType="archetype_sub"
              />
            </div>
          )}
          {/* Level 3: Sub-sub-type */}
          {(item as NestedArchetype).subSubType && (
            <div className="flex items-center gap-1.5 ml-6">
              <span className="text-gray-500 text-xs">→</span>
              <span className="text-purple-400 text-xs">
                {(item as NestedArchetype).subSubType}
              </span>
              <StatModifierBadge
                name={(item as NestedArchetype).subSubType!}
                sourceType="archetype_sub"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {/* Level 1: Main house */}
          <div className="flex items-center gap-1.5">
            <span
              className={`font-medium text-xs ${(item as NestedHouse).isLost ? "text-gray-500 line-through" : "text-yellow-400"}`}
            >
              {(item as NestedHouse).name}
            </span>
            {/* Show stat badge if not lost, or if kinda_homeless (keeps stats) */}
            {(!(item as NestedHouse).isLost ||
              (item as NestedHouse).lostType === "kinda_homeless") && (
              <StatModifierBadge
                name={(item as NestedHouse).name}
                sourceType="house"
              />
            )}
            {(item as NestedHouse).isLost && (
              <span
                className={`text-[10px] ${(item as NestedHouse).lostType === "kinda_homeless" ? "text-yellow-400" : "text-red-400"}`}
              >
                {(item as NestedHouse).lostType === "kinda_homeless"
                  ? "(rời nhà - giữ stat)"
                  : "(đuổi)"}
              </span>
            )}
          </div>
          {/* Level 2: Sub-type */}
          {(item as NestedHouse).subType && !(item as NestedHouse).isLost && (
            <div className="flex items-center gap-1.5 ml-3">
              <span className="text-gray-500 text-xs">→</span>
              <span className="text-cyan-400 text-xs">
                {(item as NestedHouse).subType}
              </span>
              <StatModifierBadge
                name={(item as NestedHouse).subType!}
                sourceType="house_sub"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Stat Modifiers Table Component
const StatModifiersTable = ({
  breakdown,
  baseStats,
  originalBaseStats,
  tournamentInfo,
}: {
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
}) => {
  const statKeys: Array<
    "strength" | "speed" | "durability" | "iq" | "biq" | "ma"
  > = ["strength", "speed", "durability", "iq", "biq", "ma"];
  const statLabels = ["STR", "SPD", "DUR", "IQ", "BIQ", "MA"];

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
    lover: "text-pink-300",
    symbiosis: "text-red-300",
  };

  // Filter sources with stat changes
  const sourcesWithStats = breakdown.filter((s) => s.statChanges.length > 0);

  // Filter sources with conditional effects (effects that trigger on win/lose/combat)
  const sourcesWithConditionalEffects = breakdown.filter(
    (s) => s.conditionalEffects && s.conditionalEffects.length > 0,
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
      const change = source.statChanges.find((c) => c.stat === statKey);
      return sum + (change?.value || 0);
    }, 0);

    return {
      base: baseValue,
      bonus: bonusValue,
      total: baseValue + bonusValue,
    };
  });

  // Get stat value for a source
  const getStatValue = (
    source: EffectSourceBreakdown,
    statKey: string,
  ): number | null => {
    const change = source.statChanges.find((c) => c.stat === statKey);
    return change ? change.value : null;
  };

  // Format stat value with color
  const formatStatValue = (value: number | null) => {
    if (value === null || value === 0)
      return <span className="text-gray-600">-</span>;
    const color = value > 0 ? "text-green-400" : "text-red-400";
    const prefix = value > 0 ? "+" : "";
    return (
      <span className={color}>
        {prefix}
        {value}
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
              {originalBaseStats ? "Hiện tại" : "ban đầu"}
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
                className={`py-1.5 px-2 ${sourceTypeColors[source.type]} truncate max-w-[120px]`}
                title={source.name}
              >
                {source.name}
              </td>
              {statKeys.map((statKey) => (
                <td key={statKey} className="text-center py-1.5 px-1.5">
                  {formatStatValue(getStatValue(source, statKey))}
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

      {/* Conditional Effects Section */}
      {sourcesWithConditionalEffects.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-600">
          <h4 className="text-xs text-yellow-400 font-medium mb-2 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Hiệu ứng điều kiện
          </h4>
          <div className="space-y-2">
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
          </div>
        </div>
      )}
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
  const [openArchetypeTooltip, setOpenArchetypeTooltip] = useState<
    string | null
  >(null);
  const [openHouseTooltip, setOpenHouseTooltip] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  // Reset avatar state when character changes
  useEffect(() => {
    setAvatarError(false);
    setAvatarLoaded(false);
  }, [character.no]);

  // Try multiple image extensions
  const getAvatarUrl = () => {
    return getAssetPath(`/data/avatars/no${character.no}.png`);
  };

  // Helper functions
  const hasArchetypeSubTypes = (arch: NestedArchetype) =>
    arch.subType || arch.subSubType;
  const hasHouseSubTypes = (house: NestedHouse) => house.subType;

  // Calculate total stats with effects
  const characterEffects = useMemo(() => {
    ensureEffectsInitialized();
    return EffectResolver.calculateCharacterEffects(character);
  }, [character]);

  // Get tournament info for conditional effects checking
  const tournamentInfo = useMemo(() => {
    if (!character.tournament) return undefined;
    return {
      bracket: character.tournament.bracket,
      round: character.tournament.round,
    };
  }, [character.tournament]);

  // Get effect breakdown for summary
  const effectBreakdown = useMemo(() => {
    return EffectResolver.getCharacterEffectBreakdown(
      character,
      tournamentInfo,
    );
  }, [character, tournamentInfo]);

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
          {/* Left Column - Avatar, Basic Info & Stats */}
          <div className="space-y-6">
            {/* Character Avatar */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex justify-center">
                <div className="w-[250px] h-[250px] lg:w-[300px] lg:h-[300px] rounded-lg overflow-hidden border-2 border-gray-600 bg-gray-800">
                  {!avatarError ? (
                    <>
                      {!avatarLoaded && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
                        </div>
                      )}
                      <img
                        src={getAvatarUrl()}
                        alt={`Avatar of ${character.name}`}
                        className={`w-full h-full object-cover ${avatarLoaded ? "block" : "hidden"}`}
                        onLoad={() => setAvatarLoaded(true)}
                        onError={() => setAvatarError(true)}
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-800/50">
                      <span className="text-6xl mb-3">👤</span>
                      <p className="text-sm text-center px-4">Chưa có avatar</p>
                      <p className="text-xs text-gray-600 mt-1">
                        no{character.no}.png
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Info - Each item on separate row */}
            <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
              {/* Race */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm min-w-[80px]">
                  Race:
                </span>
                <span className="text-amber-400 text-sm">
                  {character.race?.race || "-"}
                  {character.race?.reincarnatorInfo && (
                    <span className="text-amber-300 ml-1">
                      {character.race.reincarnatorInfo}
                    </span>
                  )}
                  <StatModifierBadge
                    name={character.race?.race || ""}
                    sourceType="race"
                  />
                </span>
              </div>

              {/* Sub-race */}
              {character.race?.subRace && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm min-w-[80px]">
                    Sub-race:
                  </span>
                  <span className="text-amber-300 text-sm">
                    {character.race.subRace}
                    {character.race.subRace
                      .split(/\s*\+\s*/)
                      .map((subRace, idx) => (
                        <StatModifierBadge
                          key={idx}
                          name={subRace.trim()}
                          sourceType="sub_race"
                        />
                      ))}
                  </span>
                </div>
              )}

              {/* Archetypes */}
              <div className="flex items-start gap-2">
                <span className="text-gray-400 text-sm min-w-[80px]">
                  Archetype:
                </span>
                {character.nestedArchetypes &&
                character.nestedArchetypes.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {character.nestedArchetypes.map((arch, idx) => (
                      <span
                        key={idx}
                        className="text-pink-400 text-sm inline-flex items-center relative"
                      >
                        {arch.name}
                        <StatModifierBadge
                          name={arch.name}
                          sourceType="archetype"
                        />
                        {hasArchetypeSubTypes(arch) && (
                          <>
                            <InfoButton
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenArchetypeTooltip(
                                  openArchetypeTooltip === arch.name
                                    ? null
                                    : arch.name,
                                );
                                setOpenHouseTooltip(null);
                              }}
                            />
                            <HierarchyTooltip
                              isOpen={openArchetypeTooltip === arch.name}
                              onClose={() => setOpenArchetypeTooltip(null)}
                              item={arch}
                              type="archetype"
                            />
                          </>
                        )}
                        {idx < character.nestedArchetypes!.length - 1
                          ? ","
                          : ""}
                      </span>
                    ))}
                  </div>
                ) : character.archetypes && character.archetypes.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {character.archetypes.map((archetype, idx) => (
                      <span key={idx} className="text-pink-400 text-sm">
                        {archetype}
                        <StatModifierBadge
                          name={archetype}
                          sourceType="archetype"
                        />
                        {idx < character.archetypes.length - 1 ? "," : ""}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-pink-400 text-sm">-</span>
                )}
              </div>

              {/* Houses */}
              <div className="flex items-start gap-2">
                <span className="text-gray-400 text-sm min-w-[80px]">
                  House:
                </span>
                {character.nestedHouses && character.nestedHouses.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {character.nestedHouses.map((house, idx) => (
                      <span
                        key={idx}
                        className={`text-sm inline-flex items-center relative ${
                          house.isLost && house.lostType !== "kinda_homeless"
                            ? "text-gray-500 line-through"
                            : house.isLost &&
                                house.lostType === "kinda_homeless"
                              ? "text-yellow-500"
                              : "text-cyan-400"
                        }`}
                      >
                        {house.name}
                        {house.isLost && (
                          <span
                            className={`ml-1 text-xs ${house.lostType === "kinda_homeless" ? "text-yellow-400" : "text-red-400"}`}
                          >
                            {house.lostType === "kinda_homeless"
                              ? "(rời nhà)"
                              : "(đuổi)"}
                          </span>
                        )}
                        {(!house.isLost ||
                          house.lostType === "kinda_homeless") && (
                          <StatModifierBadge
                            name={house.name}
                            sourceType="house"
                          />
                        )}
                        {hasHouseSubTypes(house) && !house.isLost && (
                          <>
                            <InfoButton
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenHouseTooltip(
                                  openHouseTooltip === house.name
                                    ? null
                                    : house.name,
                                );
                                setOpenArchetypeTooltip(null);
                              }}
                            />
                            <HierarchyTooltip
                              isOpen={openHouseTooltip === house.name}
                              onClose={() => setOpenHouseTooltip(null)}
                              item={house}
                              type="house"
                            />
                          </>
                        )}
                        {idx < character.nestedHouses!.length - 1 ? "," : ""}
                      </span>
                    ))}
                  </div>
                ) : character.houses && character.houses.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {character.houses.map((house, idx) => (
                      <span
                        key={idx}
                        className={`text-sm ${
                          house.isLost
                            ? "text-gray-500 line-through"
                            : "text-cyan-400"
                        }`}
                      >
                        {house.name}
                        {house.isLost && (
                          <span className="ml-1 text-red-400 text-xs">
                            (đuổi)
                          </span>
                        )}
                        {!house.isLost && (
                          <StatModifierBadge
                            name={house.name}
                            sourceType="house"
                          />
                        )}
                        {idx < character.houses.length - 1 ? "," : ""}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-cyan-400 text-sm">-</span>
                )}
              </div>

              {/* Parasite Status */}
              {character.isParasite && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm min-w-[80px]">
                    Ký sinh:
                  </span>
                  <span className="text-green-400 text-sm">Có</span>
                </div>
              )}

              {/* Tournament Status */}
              {character.tournament && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm min-w-[80px]">
                      Status:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        character.tournament.status === "champion"
                          ? "text-yellow-400"
                          : character.tournament.status === "eliminated"
                            ? "text-red-400"
                            : "text-green-400"
                      }`}
                    >
                      {character.tournament.status === "champion"
                        ? "Vô địch"
                        : character.tournament.status === "eliminated"
                          ? "Đã bị loại"
                          : "Còn sống"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm min-w-[80px]">
                      Vòng:
                    </span>
                    <span className="text-purple-400 text-sm">
                      {character.tournament.round === "-"
                        ? "-"
                        : character.tournament.round === "quarter"
                          ? "Tứ kết"
                          : character.tournament.round === "semi"
                            ? "Bán kết"
                            : character.tournament.round === "final"
                              ? "Chung kết"
                              : `Vòng ${character.tournament.round}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm min-w-[80px]">
                      Nhánh:
                    </span>
                    <span
                      className={`text-sm ${
                        character.tournament.bracket === "winner"
                          ? "text-green-400"
                          : character.tournament.bracket === "loser"
                            ? "text-orange-400"
                            : "text-gray-400"
                      }`}
                    >
                      {character.tournament.bracket === "winner"
                        ? "Nhánh thắng"
                        : character.tournament.bracket === "loser"
                          ? "Nhánh thua"
                          : "-"}
                    </span>
                  </div>
                </>
              )}
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
                      ? "bg-teal-500 text-white"
                      : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                  }`}
                >
                  {showBreakdown ? "Hide Sources" : "Show Sources"}
                </button>
              </div>

              {/* Breakdown Panel - Table View */}
              {showBreakdown && effectBreakdown.length > 0 && (
                <div className="mb-4 p-3 bg-gray-800/70 rounded-lg border border-gray-600">
                  <p className="text-xs text-gray-400 mb-2 font-medium">
                    Stat Modifiers Sources:
                  </p>
                  <StatModifiersTable
                    breakdown={effectBreakdown}
                    baseStats={character.stats}
                    originalBaseStats={character.originalBaseStats}
                    tournamentInfo={tournamentInfo}
                  />
                </div>
              )}

              <div className="space-y-3">
                {stats.map((stat) => {
                  const diff = stat.totalValue - stat.baseValue;
                  const isNegative = stat.totalValue < 0;
                  return (
                    <div
                      key={stat.key}
                      className={`flex items-center gap-3 ${isNegative ? "opacity-50" : ""}`}
                    >
                      <span
                        className={`w-24 text-sm font-medium ${stat.color}`}
                      >
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
                        {/* Total stat bar - hide if negative */}
                        {!isNegative && (
                          <div
                            className={`h-full ${stat.bg} transition-all duration-500`}
                            style={{
                              width: `${((stat.totalValue || 0) / maxStat) * 100}%`,
                            }}
                          />
                        )}
                      </div>
                      <span className="text-white font-bold w-20 text-right text-sm">
                        <span className="text-gray-500">{stat.baseValue}</span>
                        <span className="text-gray-600 mx-0.5">→</span>
                        <span
                          className={
                            diff > 0
                              ? "text-green-400"
                              : diff < 0
                                ? "text-red-400"
                                : "text-white"
                          }
                        >
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
                      className={`px-3 py-1 rounded-full text-sm ${
                        quirk.isLost
                          ? "bg-gray-600/30 text-gray-500 line-through"
                          : "bg-purple-500/30 text-purple-300"
                      }`}
                    >
                      {quirk.name}
                      {quirk.isLost && (
                        <span className="ml-1 text-red-400 text-xs">
                          (đã mất)
                        </span>
                      )}
                      {!quirk.isLost && (
                        <StatModifierBadge
                          name={quirk.name}
                          sourceType="quirk"
                        />
                      )}
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
                          className={`px-3 py-1 rounded text-sm ${
                            gear.isLost
                              ? "bg-gray-600/20 text-gray-500 line-through"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          {gear.name}
                          {gear.isLost && (
                            <span className="ml-1 text-red-400 text-xs">
                              (đã mất)
                            </span>
                          )}
                          {!gear.isLost && (
                            <StatModifierBadge
                              name={gear.name}
                              sourceType="gear"
                            />
                          )}
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
                          className={`px-3 py-1 rounded text-sm ${
                            gear.isLost
                              ? "bg-gray-600/20 text-gray-500 line-through"
                              : "bg-purple-500/20 text-purple-300"
                          }`}
                        >
                          {gear.name}
                          {gear.isLost && (
                            <span className="ml-1 text-red-400 text-xs">
                              (đã mất)
                            </span>
                          )}
                          {!gear.isLost && (
                            <StatModifierBadge
                              name={gear.name}
                              sourceType="gear"
                            />
                          )}
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
                        <StatModifierBadge
                          name={weapon.name}
                          sourceType="weapon"
                        />
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
                          className={`px-3 py-1 rounded text-sm ${
                            rune.isLost
                              ? "bg-gray-600/20 text-gray-500 line-through"
                              : "bg-orange-500/20 text-orange-300"
                          }`}
                        >
                          {rune.name}
                          {rune.isLost && (
                            <span className="ml-1 text-red-400 text-xs">
                              (đã mất)
                            </span>
                          )}
                          {!rune.isLost && (
                            <StatModifierBadge
                              name={rune.name}
                              sourceType="rune"
                            />
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                  {character.runes.runeword && (
                    <p className="text-sm text-gray-300">
                      Runeword:{" "}
                      <span className="text-orange-400 font-medium">
                        {character.runes.runeword}
                        <StatModifierBadge
                          name={character.runes.runeword}
                          sourceType="runeword"
                        />
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
                      className={`px-3 py-1 rounded-full text-sm ${
                        power.isLost
                          ? "bg-gray-600/20 text-gray-500 line-through"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {power.name}
                      {power.isLost && (
                        <span className="ml-1 text-red-400 text-xs">
                          (đã mất)
                        </span>
                      )}
                      {!power.isLost && (
                        <StatModifierBadge
                          name={power.name}
                          sourceType="power"
                        />
                      )}
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
                    <p
                      key={idx}
                      className={`${charDev.isLost ? "text-gray-500 line-through" : "text-gray-300"}`}
                    >
                      • {charDev.name}
                      {charDev.isLost && (
                        <span className="ml-1 text-red-400 text-xs">
                          (đã mất)
                        </span>
                      )}
                      {!charDev.isLost && (
                        <StatModifierBadge
                          name={charDev.name}
                          sourceType="char_dev"
                        />
                      )}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Lover */}
            {character.lover && character.lover.length > 0 && (
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-pink-400">&#9829;</span> Lover
                </h3>
                <div className="space-y-2">
                  {character.lover.map((loverItem, idx) => (
                    <p
                      key={idx}
                      className={
                        loverItem.isLost
                          ? "text-pink-400 line-through"
                          : "text-pink-300"
                      }
                    >
                      ❤️ {loverItem.name}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Team Battle Card Component
interface TeamBattleCardProps {
  team: TeamJson & { bossData: Boss | null; memberData: PlayerSummary[] };
  onBossClick: () => void;
  getTotalStats: (stats: CharacterStats | BossStats) => number;
  onMemberClick: (playerNo: number) => void;
}

const TeamBattleCard = ({
  team,
  onBossClick,
  getTotalStats,
  onMemberClick,
}: TeamBattleCardProps) => {
  const hasBoss = team.bossData !== null;
  const bossTotalStats = team.bossData ? getTotalStats(team.bossData.stats) : 0;
  const MAX_TEAM_MEMBERS = 8;

  // Calculate team total stats
  const teamTotalStats = useMemo(() => {
    return team.memberData.reduce((sum, p) => sum + getTotalStats(p.stats), 0);
  }, [team.memberData, getTotalStats]);

  // Determine battle status
  const battleStatus = hasBoss
    ? teamTotalStats > bossTotalStats
      ? "winning"
      : teamTotalStats < bossTotalStats
        ? "losing"
        : "even"
    : "pending";

  return (
    <div
      className={`bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl ${
        hasBoss ? "ring-2 ring-red-500/30" : "ring-1 ring-gray-700"
      }`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          {/* Left: Team Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-black text-white">{team.id}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Team {team.id}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                  {team.members.length}/{MAX_TEAM_MEMBERS}
                </span>
              </div>
              {hasBoss ? (
                <button
                  className="text-sm text-red-400 hover:text-red-300 font-medium flex items-center gap-1 transition-colors"
                  onClick={onBossClick}
                >
                  <span>vs</span>
                  <span className="underline decoration-dotted">
                    {team.bossData!.name}
                  </span>
                  <span className="text-xs">&#8599;</span>
                </button>
              ) : (
                <span className="text-sm text-gray-500">Chua co Boss</span>
              )}
            </div>
          </div>

          {/* Right: Stats Comparison */}
          {hasBoss && (
            <div className="flex items-center gap-3 text-sm">
              <div className="text-right">
                <div className="text-gray-500 text-xs">Team</div>
                <div className="text-green-400 font-bold text-lg">
                  {teamTotalStats}
                </div>
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  battleStatus === "winning"
                    ? "bg-green-500/20 text-green-400"
                    : battleStatus === "losing"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {battleStatus === "winning"
                  ? ">"
                  : battleStatus === "losing"
                    ? "<"
                    : "="}
              </div>
              <div className="text-left">
                <div className="text-gray-500 text-xs">Boss</div>
                <div className="text-red-400 font-bold text-lg">
                  {bossTotalStats}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content - Always visible */}
      <div className="px-5 py-4 space-y-4">
        {/* Boss Stats Row */}
        {hasBoss && team.bossData && (
          <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-red-400">
                Boss: {team.bossData.name}
              </h4>
              <span className="text-xs text-gray-500">
                Total: {bossTotalStats}
              </span>
            </div>
            <div className="flex gap-2">
              {[
                {
                  label: "STR",
                  value: team.bossData.stats.str,
                  color: "text-red-400",
                },
                {
                  label: "SPD",
                  value: team.bossData.stats.spd,
                  color: "text-yellow-400",
                },
                {
                  label: "DUR",
                  value: team.bossData.stats.dur,
                  color: "text-blue-400",
                },
                {
                  label: "IQ",
                  value: team.bossData.stats.iq,
                  color: "text-purple-400",
                },
                {
                  label: "BIQ",
                  value: team.bossData.stats.biq,
                  color: "text-pink-400",
                },
                {
                  label: "MA",
                  value: team.bossData.stats.ma,
                  color: "text-orange-400",
                },
              ].map((stat) => (
                <div key={stat.label} className="flex-1 text-center">
                  <div
                    className={`${stat.color} text-[10px] font-medium opacity-70`}
                  >
                    {stat.label}
                  </div>
                  <div className="text-white font-bold">
                    {stat.value ?? "?"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Boss Placeholder */}
        {!hasBoss && (
          <div className="bg-gray-700/30 rounded-xl p-6 border border-dashed border-gray-600 text-center">
            <div className="text-gray-500 text-4xl mb-2">?</div>
            <p className="text-gray-500 text-sm">Chua duoc phan cong Boss</p>
          </div>
        )}

        {/* Rewards Row */}
        {hasBoss && team.bossData && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-green-400">&#10003;</span>
                <span className="text-green-400 text-xs font-semibold">
                  THANG
                </span>
              </div>
              <p className="text-green-300/90 text-sm leading-relaxed">
                {team.bossData.reward}
              </p>
            </div>
            <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-400">&#10007;</span>
                <span className="text-red-400 text-xs font-semibold">THUA</span>
              </div>
              <p className="text-red-300/90 text-sm leading-relaxed">
                {team.bossData.punishment}
              </p>
            </div>
          </div>
        )}

        {/* Team Members */}
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <span>&#9733;</span> Thanh vien ({team.members.length}/
            {MAX_TEAM_MEMBERS})
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {/* Filled slots */}
            {team.members.map((member, idx) => {
              const playerData = team.memberData.find(
                (p) =>
                  p.username.toLowerCase() === member.username.toLowerCase(),
              );
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-gray-700/40 hover:bg-gray-700/60 rounded-lg px-3 py-2 cursor-pointer transition-colors"
                  onClick={() => playerData && onMemberClick(playerData.no)}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500/30 to-cyan-500/30 flex items-center justify-center text-teal-400 text-xs font-bold">
                    {playerData ? playerData.no : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                      {member.name}
                    </div>
                    <div className="text-gray-500 text-xs truncate">
                      @{member.username}
                    </div>
                  </div>
                  {playerData && (
                    <div className="text-teal-400 text-xs font-bold">
                      {getTotalStats(playerData.stats)}
                    </div>
                  )}
                </div>
              );
            })}
            {/* Empty slots */}
            {Array.from({ length: MAX_TEAM_MEMBERS - team.members.length }).map(
              (_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="flex items-center gap-3 bg-gray-800/30 rounded-lg px-3 py-2 border border-dashed border-gray-700"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-700/30 flex items-center justify-center text-gray-600 text-xs">
                    +
                  </div>
                  <span className="text-gray-600 text-sm">Slot trong</span>
                </div>
              ),
            )}
          </div>
        </div>
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
        className="bg-gray-800/95 backdrop-blur-sm border border-red-500/50 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 flex items-center justify-between sticky top-0">
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
            <BossStatBadgeLarge
              label="STR"
              value={boss.stats.str}
              color="text-red-400"
            />
            <BossStatBadgeLarge
              label="SPD"
              value={boss.stats.spd}
              color="text-yellow-400"
            />
            <BossStatBadgeLarge
              label="DUR"
              value={boss.stats.dur}
              color="text-blue-400"
            />
            <BossStatBadgeLarge
              label="IQ"
              value={boss.stats.iq}
              color="text-purple-400"
            />
            <BossStatBadgeLarge
              label="BIQ"
              value={boss.stats.biq}
              color="text-pink-400"
            />
            <BossStatBadgeLarge
              label="MA"
              value={boss.stats.ma}
              color="text-orange-400"
            />
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
          <div className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-500/50">
            <h4 className="text-red-400 font-bold mb-2">Punishment (Lose)</h4>
            <p className="text-red-300 text-sm">{boss.punishment}</p>
          </div>

          {/* Battle Rules */}
          {boss.rules && boss.rules.length > 0 && (
            <div className="mb-4 p-4 rounded-lg bg-purple-500/20 border border-purple-500/50">
              <h4 className="text-purple-400 font-bold mb-2">
                ⚔️ Battle Rules
              </h4>
              <ul className="text-purple-300 text-sm space-y-1">
                {boss.rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    <span>{rule}</span>
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

// Larger Stat Badge for Boss Modal
const BossStatBadgeLarge = ({
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
