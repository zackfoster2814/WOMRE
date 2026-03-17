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
import { EffectResolver } from "../effects/resolver";
import { initializeEffectData } from "../effects/data";
import type {
  CharacterStats as EffectStats,
  EffectSourceType,
} from "../effects/types";
import StatModifiersTable from "../components/StatModifiersTable";
import wheelBgImage from "../assets/img/wheel-bg.png";
import {
  getAssetPath,
  getAvatarUrl,
  AVATAR_EXTENSIONS,
} from "../utils/basePath";
import {
  fetchAllPlayerTexts,
  fetchPlayerText,
  clearPlayerIndexCache,
} from "../utils/googleDrive";
import { isTauri } from "../utils/localStorage";
import { PvEBattlePage } from "./BattleZonePage";
import { BattleType } from "../types";

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
    tournament: player.tournament,
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
  isReincarnator?: boolean;
  actualRace?: string;
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
    playerNo: number;
  };
  traitorEffect?: string;
  // Hiệu ứng cho toàn tộc (khi không có người phản bội hoặc hiệu ứng tập thể)
  collectiveEffect?: string;
  // Evidence images: prefix and count for houselore folder (e.g., prefix "lannister", count 3 -> lannister-1.png, lannister-2.png, lannister-3.png)
  evidencePrefix?: string;
  evidenceCount?: number;
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
        playerNo: 160,
      },
      traitorEffect: "Đã kích hoạt: +2 all base stat (chỉ bản thân)",
      evidencePrefix: "lannister",
      evidenceCount: 3,
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
        playerNo: 226,
      },
      traitorEffect: "Đã kích hoạt: +2 all base stat (chỉ bản thân)",
      evidencePrefix: "uchiha",
      evidenceCount: 1,
      color: "purple",
      bgGradient: "from-purple-900/80 to-red-900/80",
      icon: "",
    },
  ];

  const [evidenceModal, setEvidenceModal] = useState<{
    houseName: string;
    images: string[];
  } | null>(null);

  // Build evidence image URLs from prefix and count
  const getEvidenceImages = (house: HouseLoreData): string[] => {
    if (!house.evidencePrefix || !house.evidenceCount) return [];
    return Array.from({ length: house.evidenceCount }, (_, i) =>
      getAssetPath(`/data/houselore/${house.evidencePrefix}-${i + 1}.png`),
    );
  };

  // Find players belonging to each house
  const getHouseMembers = (houseName: string) => {
    return players.filter((p) =>
      p.houses?.some((h) => !h.isLost && h.name === houseName),
    );
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="text-center mb-2">
        <h2 className="text-3xl font-bold text-purple-300 mb-1">
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
          const houseEvidence = getEvidenceImages(house);

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
                {/* Description - fixed height for alignment */}
                <div className="flex items-center" style={{ minHeight: 60 }}>
                  <p className="text-gray-300 text-sm leading-relaxed text-center w-full">
                    {house.description}
                  </p>
                </div>

                {/* Base Effect - fixed height for alignment */}
                <div
                  className="bg-black/30 rounded-lg p-3 flex flex-col justify-center"
                  style={{ minHeight: 72 }}
                >
                  <p className="text-xs text-gray-400 mb-1">Hiệu ứng cơ bản:</p>
                  <p className={`text-${house.color}-300 font-medium text-sm`}>
                    {house.effect}
                  </p>
                </div>

                {/* Traitor / Collective Section - fixed height for alignment */}
                <div style={{ minHeight: 240 }}>
                  {house.traitor ? (
                    <div className="bg-gradient-to-r from-red-900/40 to-red-800/40 border-2 border-red-500/50 rounded-lg p-4 relative overflow-hidden h-full">
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
                        <div className="flex items-center justify-end mb-3">
                          {houseEvidence.length > 0 && (
                            <button
                              onClick={() =>
                                setEvidenceModal({
                                  houseName: house.houseName,
                                  images: houseEvidence,
                                })
                              }
                              className="text-red-400 text-xs cursor-pointer border-b border-dotted border-red-400 hover:text-red-300 hover:border-red-300 transition-colors"
                            >
                              [Bằng chứng]
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-3 bg-black/30 rounded-lg p-3">
                          {/* Traitor Avatar */}
                          <img
                            src={getAssetPath(
                              `/data/avatars/no${house.traitor.playerNo}.png`,
                            )}
                            alt={house.traitor.name}
                            className="w-14 h-14 rounded-full border-2 border-red-500/50 object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
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
                    <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-500/30 rounded-lg p-4 h-full flex flex-col justify-center">
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
                </div>

                {/* Members List - Full names */}
                {members.length > 0 && (
                  <div className="pt-4 border-t border-gray-600">
                    <p className="text-xs text-gray-400 mb-2">
                      Thành viên ({members.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {members.map((member) => (
                        <button
                          key={member.no}
                          onClick={() => onPlayerClick(member.no)}
                          className="px-2 py-1 bg-gray-700/50 hover:bg-gray-600/50 rounded text-xs text-white transition-colors"
                          title={`No.${member.no} - ${member.name} (@${member.username})`}
                        >
                          {member.name} ({member.username})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Evidence Modal */}
      {evidenceModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setEvidenceModal(null)}
        >
          <div
            className="bg-gray-900 border border-gray-600 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-400">
                Bằng chứng - {evidenceModal.houseName}
              </h3>
              <button
                onClick={() => setEvidenceModal(null)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4">
              {evidenceModal.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Bằng chứng ${idx + 1}`}
                  className="w-full rounded-lg border border-gray-700"
                />
              ))}
            </div>
          </div>
        </div>
      )}
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
    "no" | "name" | "race" | "team" | "totalBaseStats" | "totalStats"
  >("no");
  const [selectedRaces, setSelectedRaces] = useState<string[]>([]);
  const [showRaceFilter, setShowRaceFilter] = useState(false);
  const [showRaceStats, setShowRaceStats] = useState(false);
  const [selectedHouses, setSelectedHouses] = useState<string[]>([]);
  const [showHouseFilter, setShowHouseFilter] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  const [showRanking, setShowRanking] = useState(false);

  const raceFilterRef = useRef<HTMLDivElement>(null);
  const houseFilterRef = useRef<HTMLDivElement>(null);
  const teamFilterRef = useRef<HTMLDivElement>(null);
  // @ts-ignore
  const [battleType, setBattleType] = useState<BattleType | null>(null);

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        raceFilterRef.current &&
        !raceFilterRef.current.contains(e.target as Node)
      ) {
        setShowRaceFilter(false);
      }
      if (
        houseFilterRef.current &&
        !houseFilterRef.current.contains(e.target as Node)
      ) {
        setShowHouseFilter(false);
      }
      if (
        teamFilterRef.current &&
        !teamFilterRef.current.contains(e.target as Node)
      ) {
        setShowTeamFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // View mode: "players", "teams", or "house-lore"
  const [viewMode, setViewMode] = useState<"players" | "teams" | "house-lore">(
    "players",
  );

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Load teams and bosses data
      let teamsData: TeamJson[] = [];
      try {
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

      // Load players từ Google Drive
      const playerList: PlayerSummary[] = [];
      const texts = await fetchAllPlayerTexts();
      for (const [playerNo, content] of texts) {
        try {
          const char = CharacterParser.parseCharacterFile(content);
          const username = char.username || "";
          const teamId = usernameToTeam.get(username.toLowerCase()) ?? char.team;
          playerList.push({
            no: char.no || playerNo,
            name: char.name || `Player ${playerNo}`,
            username,
            race: char.race?.race || "Unknown",
            subRace: char.race?.subRace,
            isReincarnator: char.race?.race === "Reincarnator",
            actualRace: char.race?.actualRace,
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
        } catch { /* bỏ qua */ }
      }
      setPlayers(playerList.sort((a, b) => a.no - b.no));
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Refresh player list
  const refreshPlayers = () => {
    setPlayers([]);
    setIsLoading(true);
    // Clear cache để force reload dữ liệu mới nhất
    clearPlayerIndexCache();
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
      const texts = await fetchAllPlayerTexts();
      for (const [playerNo, content] of texts) {
        try {
          const char = CharacterParser.parseCharacterFile(content);
          const username = char.username || "";
          const teamId = usernameToTeam.get(username.toLowerCase()) ?? char.team;
          playerList.push({
            no: char.no || playerNo,
            name: char.name || `Player ${playerNo}`,
            username,
            race: char.race?.race || "Unknown",
            subRace: char.race?.subRace,
            isReincarnator: char.race?.race === "Reincarnator",
            actualRace: char.race?.actualRace,
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
        } catch { /* bỏ qua */ }
      }
      setPlayers(playerList.sort((a, b) => a.no - b.no));
      setIsLoading(false);
    };
    loadPlayers();
  };

  // Load full character data when clicking on a player
  const handleSelectPlayer = async (playerNo: number) => {
    setIsLoadingDetail(true);
    try {
      const content = await fetchPlayerText(playerNo);
      const character = CharacterParser.parseCharacterFile(content);
      setSelectedPlayer(character);
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
        case "totalBaseStats":
          return getTotalStats(b.stats) - getTotalStats(a.stats);
        case "totalStats": {
          const aTotalEffects = calculateTotalStats(a);
          const bTotalEffects = calculateTotalStats(b);
          const aSum = Object.values(aTotalEffects).reduce((s, v) => s + v, 0);
          const bSum = Object.values(bTotalEffects).reduce((s, v) => s + v, 0);
          return bSum - aSum;
        }
        default:
          return a.no - b.no;
      }
    });

    return result;
  }, [
    players,
    searchTerm,
    sortBy,
    selectedRaces,
    selectedTeams,
    selectedHouses,
  ]);

  // Ranking: all players sorted by total stats (with effects) descending
  const rankedPlayers = useMemo(() => {
    return players
      .map((p) => {
        const totalEffects = calculateTotalStats(p);
        const totalSum = Object.values(totalEffects).reduce((s, v) => s + v, 0);
        return { ...p, totalSum };
      })
      .sort((a, b) => b.totalSum - a.totalSum);
  }, [players]);

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
            <button
              onClick={() => { window.location.hash = "#/bracket"; }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium transition-colors"
            >
              PvP Bracket
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
                <option value="totalBaseStats">Sort by Total Base Stats</option>
                <option value="totalStats">Sort by Total Stats</option>
              </select>
              {/* Race Filter Button */}
              <div className="relative" ref={raceFilterRef}>
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
                  <div className="absolute top-full right-0 mt-2 z-[2000] bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-3 min-w-[250px] max-h-[400px] overflow-y-auto">
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
              <div className="relative" ref={houseFilterRef}>
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
                  <div className="absolute top-full right-0 mt-2 z-[2000] bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-3 min-w-[250px] max-h-[400px] overflow-y-auto">
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
              <div className="relative" ref={teamFilterRef}>
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
                  <div className="absolute top-full right-0 mt-2 z-[2000] bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-3 min-w-[200px] max-h-[400px] overflow-y-auto">
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
            <div className="flex flex-wrap gap-4 items-center justify-center"></div>
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
            <PvEBattlePage onBack={() => setBattleType(null)} isWebView />
          ) : viewMode === "house-lore" ? (
            <HouseLoreSection
              players={players}
              onPlayerClick={handleSelectPlayer}
            />
          ) : null}
        </div>
      </div>

      {/* Floating Ranking Button */}
      {viewMode === "players" && (
        <button
          onClick={() => setShowRanking(!showRanking)}
          className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-xl font-bold transition-all hover:scale-110 ${
            showRanking
              ? "bg-red-600 hover:bg-red-500"
              : "bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500"
          }`}
          style={{ zIndex: 1000 }}
          title="Bảng xếp hạng"
        >
          {showRanking ? "✕" : "🏆"}
        </button>
      )}

      {/* Ranking Panel */}
      {showRanking && viewMode === "players" && (
        <div
          className="fixed bottom-24 right-6 w-80 max-h-[70vh] bg-gray-900 border border-gray-600 rounded-xl shadow-2xl overflow-hidden flex flex-col"
          style={{ zIndex: 999 }}
        >
          <div className="bg-gradient-to-r from-amber-600/80 to-orange-600/80 px-4 py-3 border-b border-gray-600">
            <h3 className="text-white font-bold text-sm">
              Bảng xếp hạng - Total Stats
            </h3>
            <p className="text-amber-200 text-xs">
              {rankedPlayers.length} players
            </p>
          </div>
          <div className="overflow-y-auto flex-1">
            {rankedPlayers.map((player, idx) => (
              <button
                key={player.no}
                onClick={() => handleSelectPlayer(player.no)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700/50 transition-colors border-b border-gray-800/50 ${
                  idx < 3 ? "bg-amber-900/20" : ""
                }`}
              >
                <span
                  className={`w-8 text-right text-xs font-bold flex-shrink-0 ${
                    idx === 0
                      ? "text-yellow-400"
                      : idx === 1
                        ? "text-gray-300"
                        : idx === 2
                          ? "text-amber-600"
                          : "text-gray-500"
                  }`}
                >
                  {idx + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">
                    {player.name}
                  </p>
                  <p className="text-gray-500 text-[10px] truncate">
                    {player.username}
                  </p>
                </div>
                <span className="text-teal-400 text-xs font-bold flex-shrink-0">
                  {player.totalSum}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          character={selectedPlayer}
          isLoading={isLoadingDetail}
          onClose={() => setSelectedPlayer(null)}
          allPlayers={players}
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
      {/* {selectedBoss && (
        <BossDetailModal
          boss={selectedBoss}
          onClose={() => setSelectedBoss(null)}
        />
      )} */}
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
          <div className="mt-0 pt-2 border-t border-gray-600">
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
          {player.isReincarnator && player.actualRace && (
            <span className="text-amber-300 ml-1">→ {player.actualRace}</span>
          )}
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
// Player Detail Modal Component
interface PlayerDetailModalProps {
  character: Character;
  isLoading: boolean;
  onClose: () => void;
  allPlayers?: PlayerSummary[];
}

const PlayerDetailModal = ({
  character,
  isLoading,
  onClose,
  allPlayers,
}: PlayerDetailModalProps) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [openArchetypeTooltip, setOpenArchetypeTooltip] = useState<
    string | null
  >(null);
  const [openHouseTooltip, setOpenHouseTooltip] = useState<string | null>(null);
  const [avatarExtIndex, setAvatarExtIndex] = useState(0);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "battlelog">("info");

  // Reset avatar state when character changes
  useEffect(() => {
    setAvatarExtIndex(0);
    setAvatarLoaded(false);
  }, [character.no]);

  const avatarAllFailed = avatarExtIndex >= AVATAR_EXTENSIONS.length;

  // Helper functions
  const hasArchetypeSubTypes = (arch: NestedArchetype) =>
    arch.subType || arch.subSubType;
  const hasHouseSubTypes = (house: NestedHouse) => house.subType;

  // Convert allPlayers to Character[] for cross-character effect resolution (e.g., Cheater debuff on lovers)
  const allCharacters = useMemo(() => {
    if (!allPlayers) return undefined;
    return allPlayers.map(
      (p): Character => ({
        no: p.no,
        name: p.name,
        username: p.username,
        isParasite: p.isParasite || false,
        race: { race: p.race, subRace: p.subRace },
        archetypes: p.archetypes || [],
        nestedArchetypes: p.nestedArchetypes,
        quirks: p.quirks || [],
        stats: p.stats,
        giantBonusApplied: p.giantBonusApplied,
        houses: p.houses || [],
        nestedHouses: p.nestedHouses,
        gear: p.gear || { normalGear: [], legacyGear: [] },
        weapons: p.weapons || [],
        runes: p.runes || { runes: [] },
        powers: p.powers || [],
        charDevs: p.charDevs || [],
        lover: p.lover,
        pvpRewards: p.pvpRewards,
        tournament: p.tournament,
      }),
    );
  }, [allPlayers]);

  // Calculate total stats with effects
  const characterEffects = useMemo(() => {
    ensureEffectsInitialized();
    return EffectResolver.calculateCharacterEffects(
      character,
      undefined,
      allCharacters,
    );
  }, [character, allCharacters]);

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
      allCharacters,
    );
  }, [character, tournamentInfo, allCharacters]);

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
        className="bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-teal-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className="text-white/80 font-bold bg-white/20 px-3 py-1 rounded">
                No.{character.no}
              </span>
              {character.team && (
                <span className="text-white/80 font-medium bg-white/20 px-3 py-1 rounded">
                  Team {character.team}
                </span>
              )}
              {/* Archetype badges */}
              {character.archetypes &&
                character.archetypes.length > 0 &&
                character.archetypes.map((arch, idx) => (
                  <span
                    key={`arch-${idx}`}
                    className="text-white/90 font-medium bg-pink-500/40 px-2 py-0.5 rounded text-sm"
                  >
                    {arch}
                  </span>
                ))}
              {/* House badges */}
              {character.nestedHouses &&
                character.nestedHouses.length > 0 &&
                character.nestedHouses
                  .filter((h) => !h.isLost)
                  .map((house, idx) => (
                    <span
                      key={`house-${idx}`}
                      className="text-white/90 font-medium bg-cyan-500/40 px-2 py-0.5 rounded text-sm"
                    >
                      {house.name}
                    </span>
                  ))}
            </div>
            <h2 className="text-2xl font-bold text-white">{character.name}</h2>
            {character.username && (
              <p className="text-white/70">{character.username}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-3xl font-light transition-colors flex-shrink-0 ml-4"
          >
            &times;
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-gray-700 bg-gray-800/80 sticky top-[72px] z-10">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "info"
                ? "text-white border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setActiveTab("battlelog")}
            className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === "battlelog"
                ? "text-white border-b-2 border-orange-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Battle Log
            {character.battleLog && character.battleLog.length > 0 && (
              <span className="bg-orange-500/20 text-orange-300 text-xs px-1.5 py-0.5 rounded">
                {character.battleLog.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
        {/* Tab Content: Info */}
        {activeTab === "info" && (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Avatar, Basic Info & Stats */}
          <div className="space-y-6">
            {/* Character Avatar */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex justify-center">
                <div className="w-[250px] h-[250px] lg:w-[300px] lg:h-[300px] rounded-lg overflow-hidden border-2 border-gray-600 bg-gray-800">
                  {!avatarAllFailed ? (
                    <>
                      {!avatarLoaded && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
                        </div>
                      )}
                      <img
                        key={avatarExtIndex}
                        src={getAvatarUrl(character.no, avatarExtIndex)}
                        alt={`Avatar of ${character.name}`}
                        className={`w-full h-full object-cover ${avatarLoaded ? "block" : "hidden"}`}
                        onLoad={() => setAvatarLoaded(true)}
                        onError={() => { setAvatarExtIndex((i) => i + 1); setAvatarLoaded(false); }}
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-800/50">
                      <span className="text-6xl mb-3">👤</span>
                      <p className="text-sm text-center px-4">Chưa có avatar</p>
                      <p className="text-xs text-gray-600 mt-1">
                        no{character.no}.[png/jpg/gif/webp]
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

            {/* PvP Rewards */}
            {character.pvpRewards && character.pvpRewards.length > 0 && (
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-green-400">&#9733;</span> PvP Rewards (
                  {character.pvpRewards.length})
                </h3>
                <div className="space-y-2">
                  {character.pvpRewards.map((reward, idx) => (
                    <p
                      key={idx}
                      className={`flex items-center gap-2 ${
                        reward.isLost
                          ? "text-gray-500 line-through"
                          : "text-green-300"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          reward.isLost ? "bg-red-500" : "bg-green-500"
                        }`}
                      />
                      <span className="flex-1">
                        {reward.description}
                        {reward.isLost && (
                          <span className="ml-1 text-red-400 text-xs">
                            (đã mất)
                          </span>
                        )}
                        {!reward.isLost && (
                          <StatModifierBadge
                            name={reward.description}
                            sourceType="pvp_reward"
                          />
                        )}
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
        )}

        {/* Tab Content: Battle Log */}
        {activeTab === "battlelog" && (
        <div className="p-6">
          <div className="bg-gray-700/50 rounded-lg p-4">
            {character.battleLog && character.battleLog.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-600">
                      <th className="text-left py-2 px-2">#</th>
                      <th className="text-left py-2 px-2">Loại</th>
                      <th className="text-left py-2 px-2">Vòng</th>
                      <th className="text-left py-2 px-2">Đối thủ</th>
                      <th className="text-left py-2 px-2">Kết quả</th>
                      <th className="text-left py-2 px-2">Tỉ số</th>
                      <th className="text-left py-2 px-2">Reward/Punishment</th>
                      <th className="text-left py-2 px-2">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {character.battleLog.map((entry, idx) => {
                      const isWin = entry.result.toLowerCase().includes("win");
                      const isLose = entry.result.toLowerCase().includes("lose");
                      return (
                        <tr
                          key={idx}
                          className="border-b border-gray-700/50 hover:bg-gray-600/30"
                        >
                          <td className="py-2 px-2 text-gray-400">{idx + 1}</td>
                          <td className="py-2 px-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                entry.type === "PvE"
                                  ? "bg-purple-500/20 text-purple-300"
                                  : "bg-blue-500/20 text-blue-300"
                              }`}
                            >
                              {entry.type}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-gray-400">
                            {entry.round || "-"}
                          </td>
                          <td className="py-2 px-2 text-white font-medium">
                            {entry.opponent}
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                isWin
                                  ? "bg-green-500/20 text-green-300"
                                  : isLose
                                    ? "bg-red-500/20 text-red-300"
                                    : "bg-gray-500/20 text-gray-300"
                              }`}
                            >
                              {entry.result}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-gray-300">
                            {entry.score}
                          </td>
                          <td className="py-2 px-2 text-gray-300 text-xs">
                            {entry.reward && (
                              <span className="text-green-300">{entry.reward}</span>
                            )}
                            {entry.punishment && (
                              <span className="text-red-300">{entry.punishment}</span>
                            )}
                            {!entry.reward && !entry.punishment && "-"}
                          </td>
                          <td className="py-2 px-2 text-gray-400 text-xs">
                            {entry.note || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">
                Player chưa có lịch sử đấu
              </p>
            )}
          </div>
        </div>
        )}
        </div>
      </div>
    </div>
  );
};
