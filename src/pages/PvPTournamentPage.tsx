import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { CharacterParser } from "../utils/characterParser";
import { Character, CharacterStats } from "../types/character";
import { WheelCanvas } from "../components/WheelCanvas";
import { WheelItem } from "../types";
import { getAssetPath } from "../utils/basePath";
import { EffectResolver } from "../effects/resolver";
import { initializeEffectData } from "../effects/data";
import StatModifiersTable from "../components/StatModifiersTable";
import {
  readDriveFile,
  writeDriveFile,
  isDriveConfigured,
} from "../utils/googleDrive";
import { ROUND_256_FILE_ID } from "../config/googleDrive";

// Initialize effects
let effectsInitialized = false;
function ensureEffectsInitialized() {
  if (!effectsInitialized) {
    initializeEffectData();
    effectsInitialized = true;
  }
}

// ===================== Types =====================

interface PlayerRef {
  no: number;
  name: string;
  username: string;
}

interface MatchData {
  matchNumber: number;
  player1: PlayerRef | null;
  player2: PlayerRef | null;
  winner: PlayerRef | null;
  score: string | null;
  specialEvent: string | null;
  note: string | null;
}

interface Round256Data {
  totalPlayers: number;
  matches: MatchData[];
  drawOrder: number[];
  lastUpdated: string;
}

interface TournamentPlayer {
  id: number;
  name: string;
  username: string;
  character: Character;
}

// Race tiers for tiebreaking (lower = stronger)
const RACE_TIERS: Record<string, number> = {
  God: 1,
  Dragon: 2,
  Primordial_Being: 3,
  Demon: 4,
  Angel: 5,
  Dryad: 6,
  Elf: 7,
  Troll: 8,
  Dwarf: 9,
  Orc: 10,
  Werebeast: 11,
  Gnome: 12,
  Uma: 13,
  Fairy: 14,
  Merfolk: 15,
  Undead: 16,
  Skeleton: 17,
  Vampire: 18,
  Reincarnator: 19,
  Human: 20,
  Halfling: 21,
  Goblin: 22,
};

const STAT_ORDER: { key: keyof CharacterStats; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "spd", label: "SPD" },
  { key: "dur", label: "DUR" },
  { key: "iq", label: "IQ" },
  { key: "biq", label: "BIQ" },
  { key: "ma", label: "MA" },
];

// ===================== Main Component =====================

export const PvPTournamentPage = () => {
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"create" | "bracket">("create");
  const [roundData, setRoundData] = useState<Round256Data | null>(null);
  const [driveStatus, setDriveStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Load players
  useEffect(() => {
    const loadPlayers = async () => {
      setLoading(true);
      try {
        ensureEffectsInitialized();
        const allPlayers: TournamentPlayer[] = [];
        const maxPlayers = 256;
        let fileIndex = 1;

        while (allPlayers.length < maxPlayers && fileIndex <= 400) {
          try {
            const response = await fetch(
              getAssetPath(`/data/No${fileIndex}.txt`),
            );
            if (response.ok) {
              const content = await response.text();
              const character = CharacterParser.parseCharacterFile(content);
              if (
                character.isSymbiosis ||
                character.race?.race === "Symbiosis"
              ) {
                fileIndex++;
                continue;
              }
              allPlayers.push({
                id: character.no,
                name: character.name,
                username: character.username,
                character,
              });
            }
          } catch {
            // File doesn't exist
          }
          fileIndex++;
        }
        setPlayers(allPlayers.slice(0, maxPlayers));
      } catch (error) {
        console.error("Error loading players:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPlayers();
  }, []);

  // Load round data from Google Drive
  useEffect(() => {
    const loadRoundData = async () => {
      try {
        setDriveStatus("Loading from Google Drive...");
        const raw =
          await readDriveFile<Record<string, unknown>>(ROUND_256_FILE_ID);
        // Normalize from any format (old or new)
        const data: Round256Data = {
          totalPlayers: (raw.totalPlayers as number) || 256,
          matches: Array.isArray(raw.matches) ? raw.matches : [],
          drawOrder: Array.isArray(raw.drawOrder) ? raw.drawOrder : [],
          lastUpdated: (raw.lastUpdated as string) || new Date().toISOString(),
        };
        setRoundData(data);
        setDriveStatus(
          `Loaded from Google Drive (${data.matches.length} matches)`,
        );
      } catch (err) {
        console.error("Failed to load from Drive:", err);
        setDriveStatus("Failed to load from Drive - using empty data");
        setRoundData({
          totalPlayers: 256,
          matches: [],
          drawOrder: [],
          lastUpdated: new Date().toISOString(),
        });
      }
    };
    loadRoundData();
  }, []);

  // Save to Google Drive
  const saveToDrive = useCallback(async (data: Round256Data) => {
    const config = isDriveConfigured();
    if (!config.canWrite) {
      setDriveStatus("Google Drive write not configured (no Client ID)");
      return false;
    }
    try {
      setSaving(true);
      setDriveStatus("Saving to Google Drive...");
      const updatedData = { ...data, lastUpdated: new Date().toISOString() };
      await writeDriveFile(ROUND_256_FILE_ID, updatedData);
      setDriveStatus("Saved to Google Drive");
      return true;
    } catch (err) {
      console.error("Failed to save to Drive:", err);
      setDriveStatus(
        `Save failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  // Export as local file (fallback)
  const exportLocal = useCallback(() => {
    if (!roundData) return;
    const blob = new Blob([JSON.stringify(roundData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Round256-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [roundData]);

  // Import from local file
  const importLocal = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as Round256Data;
        setRoundData(data);
        setDriveStatus("Imported from local file");
      } catch (err) {
        setDriveStatus("Failed to import file");
      }
    };
    input.click();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading players...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 pt-16">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-white mb-2">
          PvP Tournament - Round 256
        </h1>
        <p className="text-center text-gray-300 mb-2">
          {players.length} players (excluding Symbiosis)
        </p>

        {/* Drive Status */}
        <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
          <span
            className={`text-xs px-2 py-1 rounded ${
              driveStatus.includes("Saved") || driveStatus.includes("Loaded")
                ? "bg-green-600/30 text-green-400"
                : driveStatus.includes("Failed") ||
                    driveStatus.includes("not configured")
                  ? "bg-red-600/30 text-red-400"
                  : "bg-yellow-600/30 text-yellow-400"
            }`}
          >
            {driveStatus || "Ready"}
          </span>
          {saving && (
            <span className="text-yellow-400 text-xs animate-pulse">
              Saving...
            </span>
          )}
          <button
            onClick={exportLocal}
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Export JSON
          </button>
          <button
            onClick={importLocal}
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Import JSON
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 justify-center">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === "create"
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            Create
          </button>
          <button
            onClick={() => setActiveTab("bracket")}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === "bracket"
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            Bracket
            {roundData && roundData.matches.length > 0 && (
              <span className="ml-2 bg-purple-500/30 text-purple-300 text-xs px-1.5 py-0.5 rounded">
                {roundData.matches.filter((m) => m.winner).length}/
                {roundData.matches.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "create" ? (
          <CreateTab
            players={players}
            roundData={roundData}
            setRoundData={setRoundData}
            saveToDrive={saveToDrive}
          />
        ) : (
          <BracketTab
            players={players}
            roundData={roundData}
            setRoundData={setRoundData}
            saveToDrive={saveToDrive}
          />
        )}
      </div>
    </div>
  );
};

// ===================== Create Tab =====================

interface CreateTabProps {
  players: TournamentPlayer[];
  roundData: Round256Data | null;
  setRoundData: (data: Round256Data) => void;
  saveToDrive: (data: Round256Data) => Promise<boolean>;
}

const CreateTab = ({
  players,
  roundData,
  setRoundData,
  saveToDrive,
}: CreateTabProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelItems, setWheelItems] = useState<WheelItem[]>([]);
  const [lastDrawnPlayer, setLastDrawnPlayer] =
    useState<TournamentPlayer | null>(null);

  // Determine which players are already drawn
  const drawnPlayerIds = useMemo(() => {
    if (!roundData) return new Set<number>();
    return new Set(roundData.drawOrder);
  }, [roundData]);

  // Remaining players (not yet drawn)
  const remainingPlayers = useMemo(() => {
    return players.filter((p) => !drawnPlayerIds.has(p.id));
  }, [players, drawnPlayerIds]);

  // Current draw slot
  const currentSlot = roundData?.drawOrder.length ?? 0;

  // Current match being filled
  const currentMatchNumber = Math.floor(currentSlot / 2) + 1;
  const isFillingPlayer2 = currentSlot % 2 === 1;

  // Update wheel items when remaining players change
  useEffect(() => {
    const items: WheelItem[] = remainingPlayers.map((p) => ({
      id: `player-${p.id}`,
      name: `No.${p.id} ${p.name}`,
      weight: 1,
    }));
    setWheelItems(items);
  }, [remainingPlayers]);

  // Handle spin completion
  const handleSpinComplete = useCallback(
    async (item: WheelItem) => {
      if (!roundData) return;

      const playerId = parseInt(item.id.replace("player-", ""));
      const drawnPlayer = players.find((p) => p.id === playerId);
      if (!drawnPlayer) return;

      setLastDrawnPlayer(drawnPlayer);

      const newDrawOrder = [...roundData.drawOrder, playerId];
      const newMatches = [...roundData.matches];

      const matchIdx = Math.floor((newDrawOrder.length - 1) / 2);
      const isPlayer1 = (newDrawOrder.length - 1) % 2 === 0;

      if (isPlayer1) {
        // Create new match with player1
        newMatches.push({
          matchNumber: matchIdx + 1,
          player1: {
            no: drawnPlayer.id,
            name: drawnPlayer.name,
            username: drawnPlayer.username,
          },
          player2: null,
          winner: null,
          score: null,
          specialEvent: null,
          note: null,
        });
      } else {
        // Fill player2 in existing match
        if (newMatches[matchIdx]) {
          newMatches[matchIdx] = {
            ...newMatches[matchIdx],
            player2: {
              no: drawnPlayer.id,
              name: drawnPlayer.name,
              username: drawnPlayer.username,
            },
          };
        }
      }

      const newData: Round256Data = {
        ...roundData,
        matches: newMatches,
        drawOrder: newDrawOrder,
        lastUpdated: new Date().toISOString(),
      };

      setRoundData(newData);
      setIsSpinning(false);

      // Auto-save to Drive
      await saveToDrive(newData);
    },
    [roundData, players, setRoundData, saveToDrive],
  );

  // Quick draw all
  const quickDrawAll = useCallback(async () => {
    if (!roundData) return;

    const shuffled = [...remainingPlayers].sort(() => Math.random() - 0.5);
    const newDrawOrder = [...roundData.drawOrder];
    const newMatches = [...roundData.matches];

    for (const p of shuffled) {
      newDrawOrder.push(p.id);
      const matchIdx = Math.floor((newDrawOrder.length - 1) / 2);
      const isPlayer1 = (newDrawOrder.length - 1) % 2 === 0;

      if (isPlayer1) {
        newMatches.push({
          matchNumber: matchIdx + 1,
          player1: { no: p.id, name: p.name, username: p.username },
          player2: null,
          winner: null,
          score: null,
          specialEvent: null,
          note: null,
        });
      } else if (newMatches[matchIdx]) {
        newMatches[matchIdx] = {
          ...newMatches[matchIdx],
          player2: { no: p.id, name: p.name, username: p.username },
        };
      }
    }

    const newData: Round256Data = {
      ...roundData,
      matches: newMatches,
      drawOrder: newDrawOrder,
      lastUpdated: new Date().toISOString(),
    };

    setRoundData(newData);
    await saveToDrive(newData);
  }, [roundData, remainingPlayers, setRoundData, saveToDrive]);

  // Reset draw
  const resetDraw = useCallback(async () => {
    if (!confirm("Reset all draw data? This cannot be undone.")) return;
    const newData: Round256Data = {
      totalPlayers: 256,
      matches: [],
      drawOrder: [],
      lastUpdated: new Date().toISOString(),
    };
    setRoundData(newData);
    setLastDrawnPlayer(null);
    await saveToDrive(newData);
  }, [setRoundData, saveToDrive]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Wheel Section */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            Drawing Slot #{currentSlot + 1}
            <span className="text-sm font-normal text-gray-400 ml-2">
              (Match #{currentMatchNumber} -{" "}
              {isFillingPlayer2 ? "Player 2" : "Player 1"})
            </span>
          </h2>
          <span className="text-gray-300">
            {remainingPlayers.length} remaining
          </span>
        </div>

        {remainingPlayers.length > 0 ? (
          <div className="max-w-md mx-auto">
            <WheelCanvas
              items={wheelItems}
              isSpinning={isSpinning}
              onSpinComplete={handleSpinComplete}
              onSpin={() => {
                if (remainingPlayers.length > 0 && !isSpinning)
                  setIsSpinning(true);
              }}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-green-400 text-xl">
              All {roundData?.drawOrder.length || 0} players drawn!
            </p>
          </div>
        )}

        {/* Last Drawn */}
        {lastDrawnPlayer && (
          <div className="mt-4 p-3 bg-yellow-600/20 border border-yellow-600 rounded-lg">
            <p className="text-yellow-400 text-center">
              Last Drawn:{" "}
              <span className="font-bold">
                No.{lastDrawnPlayer.id} {lastDrawnPlayer.name}
              </span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex justify-center gap-2">
          {remainingPlayers.length > 0 && (
            <button
              onClick={quickDrawAll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              Quick Draw All ({remainingPlayers.length})
            </button>
          )}
          <button
            onClick={resetDraw}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Match List (being created) */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h2 className="text-xl font-bold text-white mb-4">
          Matches ({roundData?.matches.length || 0})
        </h2>
        <div className="max-h-[600px] overflow-y-auto space-y-2">
          {roundData?.matches
            .slice()
            .reverse()
            .map((match) => (
              <div
                key={match.matchNumber}
                className={`p-3 rounded-lg border ${
                  match.player2
                    ? "bg-gray-700/50 border-gray-600"
                    : "bg-yellow-900/20 border-yellow-600/50"
                }`}
              >
                <div className="text-xs text-gray-400 mb-1">
                  Match #{match.matchNumber}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-sm">
                    <span className="text-blue-400">
                      No.{match.player1?.no} {match.player1?.name || "???"}
                    </span>
                  </div>
                  <span className="text-gray-500 text-xs">VS</span>
                  <div className="flex-1 text-sm text-right">
                    <span className="text-red-400">
                      {match.player2
                        ? `No.${match.player2.no} ${match.player2.name}`
                        : "Waiting..."}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          {(!roundData || roundData.matches.length === 0) && (
            <p className="text-gray-400 text-center py-4">
              Spin the wheel to start drawing players
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ===================== Bracket Tab =====================

interface BracketTabProps {
  players: TournamentPlayer[];
  roundData: Round256Data | null;
  setRoundData: (data: Round256Data) => void;
  saveToDrive: (data: Round256Data) => Promise<boolean>;
}

const BracketTab = ({
  players,
  roundData,
  setRoundData,
  saveToDrive,
}: BracketTabProps) => {
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "completed">(
    "all",
  );

  const filteredMatches = useMemo(() => {
    if (!roundData) return [];
    const matches = roundData.matches.filter((m) => m.player1 && m.player2);
    switch (filterMode) {
      case "pending":
        return matches.filter((m) => !m.winner);
      case "completed":
        return matches.filter((m) => m.winner);
      default:
        return matches;
    }
  }, [roundData, filterMode]);

  const stats = useMemo(() => {
    if (!roundData) return { total: 0, completed: 0, pending: 0 };
    const complete = roundData.matches.filter((m) => m.player1 && m.player2);
    return {
      total: complete.length,
      completed: complete.filter((m) => m.winner).length,
      pending: complete.filter((m) => !m.winner).length,
    };
  }, [roundData]);

  const handleMatchUpdate = useCallback(
    async (updatedMatch: MatchData) => {
      if (!roundData) return;
      const newMatches = roundData.matches.map((m) =>
        m.matchNumber === updatedMatch.matchNumber ? updatedMatch : m,
      );
      const newData: Round256Data = {
        ...roundData,
        matches: newMatches,
        lastUpdated: new Date().toISOString(),
      };
      setRoundData(newData);
      setSelectedMatch(null);
      await saveToDrive(newData);
    },
    [roundData, setRoundData, saveToDrive],
  );

  if (!roundData || roundData.matches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-xl">
          No matches yet. Go to Create tab to draw players.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4 text-sm">
          <span className="text-gray-400">
            Total: <span className="text-white font-bold">{stats.total}</span>
          </span>
          <span className="text-green-400">
            Completed: <span className="font-bold">{stats.completed}</span>
          </span>
          <span className="text-yellow-400">
            Pending: <span className="font-bold">{stats.pending}</span>
          </span>
        </div>
        <div className="flex gap-1">
          {(["all", "pending", "completed"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1 text-xs rounded ${
                filterMode === mode
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Match Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-[70vh] overflow-y-auto">
        {filteredMatches.map((match) => (
          <button
            key={match.matchNumber}
            onClick={() => setSelectedMatch(match)}
            className={`text-left p-3 rounded-lg border transition-all hover:scale-[1.02] ${
              match.winner
                ? "bg-green-900/20 border-green-700/50 hover:border-green-500"
                : "bg-gray-800 border-gray-700 hover:border-purple-500"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">
                Match #{match.matchNumber}
              </span>
              {match.winner && (
                <span className="text-xs bg-green-600/30 text-green-400 px-1.5 py-0.5 rounded">
                  Done
                </span>
              )}
              {match.specialEvent && (
                <span className="text-xs bg-orange-600/30 text-orange-400 px-1.5 py-0.5 rounded">
                  Special
                </span>
              )}
            </div>
            <div className="space-y-1">
              <div
                className={`flex items-center justify-between rounded px-2 py-1 ${
                  match.winner?.no === match.player1?.no
                    ? "bg-green-700/30 ring-1 ring-green-500"
                    : "bg-gray-700/50"
                }`}
              >
                <span className="text-sm text-white truncate">
                  {match.player1?.name || "TBD"}
                </span>
                <span className="text-xs text-gray-400">
                  #{match.player1?.no || "-"}
                </span>
              </div>
              <div className="text-center text-gray-500 text-xs">VS</div>
              <div
                className={`flex items-center justify-between rounded px-2 py-1 ${
                  match.winner?.no === match.player2?.no
                    ? "bg-green-700/30 ring-1 ring-green-500"
                    : "bg-gray-700/50"
                }`}
              >
                <span className="text-sm text-white truncate">
                  {match.player2?.name || "TBD"}
                </span>
                <span className="text-xs text-gray-400">
                  #{match.player2?.no || "-"}
                </span>
              </div>
            </div>
            {match.score && (
              <div className="mt-1 text-center text-xs text-gray-400">
                {match.score}
              </div>
            )}
            {match.specialEvent && (
              <div className="mt-1 text-center text-xs text-orange-400 truncate">
                {match.specialEvent}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Battle Modal */}
      {selectedMatch && (
        <BattleModal
          match={selectedMatch}
          players={players}
          onClose={() => setSelectedMatch(null)}
          onSave={handleMatchUpdate}
        />
      )}
    </div>
  );
};

// ===================== Battle Modal =====================

interface BattleModalProps {
  match: MatchData;
  players: TournamentPlayer[];
  onClose: () => void;
  onSave: (match: MatchData) => void;
}

interface RoundResult {
  stat: keyof CharacterStats;
  label: string;
  p1Value: number;
  p2Value: number;
  winner: "p1" | "p2" | "tie";
}

const BattleModal = ({ match, players, onClose, onSave }: BattleModalProps) => {
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [currentRound, setCurrentRound] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [battleDone, setBattleDone] = useState(false);
  const [overallWinner, setOverallWinner] = useState<"p1" | "p2" | null>(null);
  const [tieBreaker, setTieBreaker] = useState<string | null>(null);
  const [specialEvent, setSpecialEvent] = useState(match.specialEvent || "");
  const [note, setNote] = useState(match.note || "");
  const [showEffects, setShowEffects] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Find full player data
  const player1 = useMemo(
    () => players.find((p) => p.id === match.player1?.no),
    [players, match],
  );
  const player2 = useMemo(
    () => players.find((p) => p.id === match.player2?.no),
    [players, match],
  );

  // Calculate stats
  const p1Stats = useMemo(() => {
    if (!player1) return null;
    const effects = EffectResolver.calculateCharacterEffects(
      player1.character,
      { isPvE: false },
    );
    return {
      str: effects.totalStats.strength,
      spd: effects.totalStats.speed,
      dur: effects.totalStats.durability,
      iq: effects.totalStats.iq,
      biq: effects.totalStats.biq,
      ma: effects.totalStats.ma,
    } as CharacterStats;
  }, [player1]);

  const p2Stats = useMemo(() => {
    if (!player2) return null;
    const effects = EffectResolver.calculateCharacterEffects(
      player2.character,
      { isPvE: false },
    );
    return {
      str: effects.totalStats.strength,
      spd: effects.totalStats.speed,
      dur: effects.totalStats.durability,
      iq: effects.totalStats.iq,
      biq: effects.totalStats.biq,
      ma: effects.totalStats.ma,
    } as CharacterStats;
  }, [player2]);

  // Effect breakdowns for display
  const p1Breakdown = useMemo(() => {
    if (!player1) return null;
    return EffectResolver.getCharacterEffectBreakdown(player1.character);
  }, [player1]);

  const p2Breakdown = useMemo(() => {
    if (!player2) return null;
    return EffectResolver.getCharacterEffectBreakdown(player2.character);
  }, [player2]);

  const p1BaseStats = useMemo(() => {
    if (!player1) return null;
    const s = player1.character.stats;
    return {
      str: s.str,
      spd: s.spd,
      dur: s.dur,
      iq: s.iq,
      biq: s.biq,
      ma: s.ma,
    };
  }, [player1]);

  const p2BaseStats = useMemo(() => {
    if (!player2) return null;
    const s = player2.character.stats;
    return {
      str: s.str,
      spd: s.spd,
      dur: s.dur,
      iq: s.iq,
      biq: s.biq,
      ma: s.ma,
    };
  }, [player2]);

  // If match already has a winner, show result directly
  useEffect(() => {
    if (match.winner && p1Stats && p2Stats) {
      runBattleInstant();
    }
  }, [match.winner, p1Stats, p2Stats]);

  // Close on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const runBattleInstant = () => {
    if (!p1Stats || !p2Stats) return;
    const results: RoundResult[] = [];
    let s1 = 0,
      s2 = 0;

    for (const { key, label } of STAT_ORDER) {
      const v1 = p1Stats[key];
      const v2 = p2Stats[key];
      let winner: "p1" | "p2" | "tie";
      if (v1 > v2) {
        winner = "p1";
        s1++;
      } else if (v2 > v1) {
        winner = "p2";
        s2++;
      } else {
        winner = "tie";
      }
      results.push({ stat: key, label, p1Value: v1, p2Value: v2, winner });
    }

    setRounds(results);
    setP1Score(s1);
    setP2Score(s2);
    setCurrentRound(5);
    setBattleDone(true);

    if (s1 > s2) setOverallWinner("p1");
    else if (s2 > s1) setOverallWinner("p2");
    else {
      // Tiebreaker by race tier
      const r1 = player1?.character.race?.race || "Human";
      const r2 = player2?.character.race?.race || "Human";
      const t1 = RACE_TIERS[r1] || 20;
      const t2 = RACE_TIERS[r2] || 20;
      setTieBreaker(`Race tier: ${r1}(${t1}) vs ${r2}(${t2})`);
      setOverallWinner(t1 <= t2 ? "p1" : "p2");
    }
  };

  const runBattle = () => {
    if (!p1Stats || !p2Stats || isAnimating) return;

    setIsAnimating(true);
    setCurrentRound(-1);
    setBattleDone(false);
    setOverallWinner(null);
    setTieBreaker(null);

    const results: RoundResult[] = [];
    let s1 = 0,
      s2 = 0;

    for (const { key, label } of STAT_ORDER) {
      const v1 = p1Stats[key];
      const v2 = p2Stats[key];
      let winner: "p1" | "p2" | "tie";
      if (v1 > v2) {
        winner = "p1";
        s1++;
      } else if (v2 > v1) {
        winner = "p2";
        s2++;
      } else {
        winner = "tie";
      }
      results.push({ stat: key, label, p1Value: v1, p2Value: v2, winner });
    }

    setRounds(results);

    // Animate
    let round = 0;
    let animS1 = 0,
      animS2 = 0;
    const animate = () => {
      if (round < 6) {
        setCurrentRound(round);
        const r = results[round];
        if (r.winner === "p1") animS1++;
        else if (r.winner === "p2") animS2++;
        setP1Score(animS1);
        setP2Score(animS2);
        round++;
        setTimeout(animate, 600);
      } else {
        setBattleDone(true);
        setIsAnimating(false);
        if (s1 > s2) setOverallWinner("p1");
        else if (s2 > s1) setOverallWinner("p2");
        else {
          const r1 = player1?.character.race?.race || "Human";
          const r2 = player2?.character.race?.race || "Human";
          const t1 = RACE_TIERS[r1] || 20;
          const t2 = RACE_TIERS[r2] || 20;
          setTieBreaker(`Race tier: ${r1}(${t1}) vs ${r2}(${t2})`);
          setOverallWinner(t1 <= t2 ? "p1" : "p2");
        }
      }
    };
    setTimeout(animate, 300);
  };

  const handleSave = () => {
    if (!overallWinner) return;
    const winnerRef = overallWinner === "p1" ? match.player1 : match.player2;
    onSave({
      ...match,
      winner: winnerRef,
      score: specialEvent ? null : `${p1Score}-${p2Score}`,
      specialEvent: specialEvent || null,
      note: note || null,
    });
  };

  // Set winner manually (for special events like instant kill)
  const setManualWinner = (who: "p1" | "p2") => {
    setBattleDone(true);
    setOverallWinner(who);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-3000 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`flex gap-3 items-start justify-center max-h-[90vh] transition-all duration-300 ${
          showEffects ? "w-full max-w-[95vw]" : "w-full max-w-4xl"
        }`}
      >
        {/* Left Effects Panel */}
        {showEffects && p1Breakdown && p1BaseStats && (
          <div className="w-[420px] shrink-0 bg-gray-900 rounded-2xl border border-blue-500/50 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 p-3 border-b border-blue-500/30 rounded-t-2xl z-10">
              <h4 className="text-sm font-bold text-blue-400">
                {match.player1?.name || "Player 1"}
              </h4>
            </div>
            <div className="p-3">
              <StatModifiersTable
                breakdown={p1Breakdown}
                baseStats={p1BaseStats}
                tournamentInfo={{ round: "256" }}
              />
            </div>
          </div>
        )}

        {/* Main Battle Modal */}
        <div
          ref={modalRef}
          className="bg-gray-900 rounded-2xl border border-gray-700 flex-1 min-w-0 max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
            <h2 className="text-lg font-bold text-white">
              Match #{match.matchNumber}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              &times;
            </button>
          </div>

          {/* Players */}
          <div className="p-4">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
              {/* Player 1 */}
              <PlayerCard
                player={player1}
                playerRef={match.player1}
                stats={p1Stats}
                side="left"
                isWinner={overallWinner === "p1"}
              />

              {/* VS / Score */}
              <div className="flex flex-col items-center justify-center pt-6">
                <div className="text-2xl font-bold text-white mb-1">
                  {battleDone ? `${p1Score} - ${p2Score}` : "VS"}
                </div>
                {tieBreaker && (
                  <div className="text-xs text-yellow-400 text-center">
                    {tieBreaker}
                  </div>
                )}
                {overallWinner && battleDone && (
                  <div
                    className={`text-sm font-bold mt-1 ${
                      overallWinner === "p1" ? "text-blue-400" : "text-red-400"
                    }`}
                  >
                    {overallWinner === "p1"
                      ? match.player1?.name
                      : match.player2?.name}{" "}
                    WINS!
                  </div>
                )}
              </div>

              {/* Player 2 */}
              <PlayerCard
                player={player2}
                playerRef={match.player2}
                stats={p2Stats}
                side="right"
                isWinner={overallWinner === "p2"}
              />
            </div>

            {/* Effects Breakdown Toggle */}
            <div className="mt-3">
              <button
                onClick={() => setShowEffects(!showEffects)}
                className="w-full text-center text-xs text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-lg py-1.5 px-3 border border-gray-700 hover:border-gray-600 transition-all"
              >
                {showEffects ? "Ẩn hiệu ứng ◀▶" : "Xem hiệu ứng ◀▶"}
              </button>
            </div>

            {/* Rounds */}
            {rounds.length > 0 && (
              <div className="mt-4 space-y-1">
                {rounds.map((round, idx) => (
                  <div
                    key={round.stat}
                    className={`grid grid-cols-[1fr_80px_1fr] gap-2 items-center transition-all duration-300 ${
                      idx <= currentRound ? "opacity-100" : "opacity-20"
                    }`}
                  >
                    <div
                      className={`text-right text-sm font-bold px-2 py-1.5 rounded ${
                        idx <= currentRound && round.winner === "p1"
                          ? "bg-blue-600/30 text-blue-400"
                          : idx <= currentRound && round.winner === "tie"
                            ? "bg-yellow-600/20 text-yellow-400"
                            : "text-gray-400"
                      }`}
                    >
                      {round.p1Value}
                    </div>
                    <div className="text-center text-xs font-bold text-gray-300">
                      {round.label}
                    </div>
                    <div
                      className={`text-left text-sm font-bold px-2 py-1.5 rounded ${
                        idx <= currentRound && round.winner === "p2"
                          ? "bg-red-600/30 text-red-400"
                          : idx <= currentRound && round.winner === "tie"
                            ? "bg-yellow-600/20 text-yellow-400"
                            : "text-gray-400"
                      }`}
                    >
                      {round.p2Value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Special Event & Note */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Special Event
                </label>
                <input
                  type="text"
                  value={specialEvent}
                  onChange={(e) => setSpecialEvent(e.target.value)}
                  placeholder="e.g. Instant Kill (Ragnarok's Cobra)"
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Note</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Additional notes..."
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex justify-center gap-3">
              {!battleDone && (
                <>
                  <button
                    onClick={runBattle}
                    disabled={isAnimating || !p1Stats || !p2Stats}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                  >
                    Battle!
                  </button>
                  <button
                    onClick={() => setManualWinner("p1")}
                    className="px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs"
                  >
                    {match.player1?.name} Wins (Manual)
                  </button>
                  <button
                    onClick={() => setManualWinner("p2")}
                    className="px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs"
                  >
                    {match.player2?.name} Wins (Manual)
                  </button>
                </>
              )}
              {battleDone && overallWinner && (
                <button
                  onClick={handleSave}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm"
                >
                  Save Result
                </button>
              )}
              {battleDone && (
                <button
                  onClick={() => {
                    setBattleDone(false);
                    setOverallWinner(null);
                    setRounds([]);
                    setCurrentRound(-1);
                    setP1Score(0);
                    setP2Score(0);
                    setTieBreaker(null);
                  }}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs"
                >
                  Re-battle
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Effects Panel */}
        {showEffects && p2Breakdown && p2BaseStats && (
          <div className="w-[420px] shrink-0 bg-gray-900 rounded-2xl border border-red-500/50 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 p-3 border-b border-red-500/30 rounded-t-2xl z-10">
              <h4 className="text-sm font-bold text-red-400">
                {match.player2?.name || "Player 2"}
              </h4>
            </div>
            <div className="p-3">
              <StatModifiersTable
                breakdown={p2Breakdown}
                baseStats={p2BaseStats}
                tournamentInfo={{ round: "256" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===================== Player Card =====================

interface PlayerCardProps {
  player: TournamentPlayer | undefined;
  playerRef: PlayerRef | null;
  stats: CharacterStats | null;
  side: "left" | "right";
  isWinner: boolean;
}

const PlayerCard = ({
  player,
  playerRef,
  stats,
  side,
  isWinner,
}: PlayerCardProps) => {
  const race = player?.character.race?.race || "???";
  const subRace = player?.character.race?.subRace || "";

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        isWinner
          ? "bg-green-900/20 border-green-500 shadow-lg shadow-green-500/20"
          : "bg-gray-800/50 border-gray-700"
      } ${side === "right" ? "text-right" : ""}`}
    >
      <div
        className={`flex items-center gap-2 mb-2 ${side === "right" ? "flex-row-reverse" : ""}`}
      >
        <span className="text-xs text-gray-400">No.{playerRef?.no || "?"}</span>
        {isWinner && <span className="text-yellow-400 text-sm">WINNER</span>}
      </div>
      <h3 className="text-lg font-bold text-white truncate">
        {playerRef?.name || "TBD"}
      </h3>
      <p className="text-sm text-gray-400">{playerRef?.username || ""}</p>
      <p className="text-xs text-purple-400 mt-1">
        {race}
        {subRace ? ` (${subRace})` : ""}
      </p>

      {stats && (
        <div className="mt-3 space-y-1">
          {STAT_ORDER.map(({ key, label }) => (
            <div
              key={key}
              className={`flex items-center gap-2 text-sm ${side === "right" ? "flex-row-reverse" : ""}`}
            >
              <span className="text-gray-400 w-8">{label}</span>
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${side === "left" ? "bg-blue-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(stats[key] * 5, 100)}%` }}
                />
              </div>
              <span className="text-white font-mono w-6 text-center">
                {stats[key]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
