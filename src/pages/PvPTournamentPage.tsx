import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { CharacterParser } from "../utils/characterParser";
import { Character, CharacterStats } from "../types/character";
import { WheelCanvas } from "../components/WheelCanvas";
import { WheelItem } from "../types";
import { getAssetPath } from "../utils/basePath";
import { EffectResolver } from "../effects/resolver";
import { initializeEffectData } from "../effects/data";
import StatModifiersTable, {
  sourceTypeColors,
} from "../components/StatModifiersTable";
import {
  ProbabilityWheelModal,
  type WheelSpinItem,
} from "../components/ProbabilityWheelModal";
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

  useEffect(() => {
    const loadRoundData = async () => {
      try {
        setDriveStatus("Loading from Google Drive...");
        const raw =
          await readDriveFile<Record<string, unknown>>(ROUND_256_FILE_ID);
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
  const [autoDrawing, setAutoDrawing] = useState(false);
  const autoDrawQueueRef = useRef<number[]>([]);
  const autoDrawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<Round256Data | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  const drawnPlayerIds = useMemo(() => {
    if (!roundData) return new Set<number>();
    return new Set(roundData.drawOrder);
  }, [roundData]);

  const remainingPlayers = useMemo(() => {
    return players.filter((p) => !drawnPlayerIds.has(p.id));
  }, [players, drawnPlayerIds]);

  const currentSlot = roundData?.drawOrder.length ?? 0;
  const currentMatchNumber = Math.floor(currentSlot / 2) + 1;
  const isFillingPlayer2 = currentSlot % 2 === 1;

  useEffect(() => {
    const items: WheelItem[] = remainingPlayers.map((p) => ({
      id: `player-${p.id}`,
      name: `No.${p.id} ${p.name}`,
      weight: 1,
    }));
    setWheelItems(items);
  }, [remainingPlayers]);

  const debouncedSave = useCallback(
    (data: Round256Data) => {
      pendingSaveRef.current = data;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const delay = autoDrawQueueRef.current.length > 0 ? 10000 : 500;
      saveTimerRef.current = setTimeout(async () => {
        const dataToSave = pendingSaveRef.current;
        if (!dataToSave || isSavingRef.current) return;
        isSavingRef.current = true;
        pendingSaveRef.current = null;
        await saveToDrive(dataToSave);
        isSavingRef.current = false;
        if (pendingSaveRef.current) debouncedSave(pendingSaveRef.current);
      }, delay);
    },
    [saveToDrive],
  );

  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const dataToSave = pendingSaveRef.current;
    if (!dataToSave) return;
    pendingSaveRef.current = null;
    isSavingRef.current = true;
    await saveToDrive(dataToSave);
    isSavingRef.current = false;
  }, [saveToDrive]);

  const handleSpinComplete = useCallback(
    (item: WheelItem) => {
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
      debouncedSave(newData);

      if (autoDrawQueueRef.current.length > 0) {
        autoDrawQueueRef.current = autoDrawQueueRef.current.filter(
          (id) => id !== playerId,
        );
        if (autoDrawQueueRef.current.length > 0) {
          autoDrawTimerRef.current = setTimeout(() => {
            if (autoDrawQueueRef.current.length > 0) setIsSpinning(true);
            else {
              setAutoDrawing(false);
              flushSave();
            }
          }, 800);
        } else {
          setAutoDrawing(false);
          flushSave();
        }
      }
    },
    [roundData, players, setRoundData, debouncedSave, flushSave],
  );

  const startAutoDraw = useCallback(() => {
    if (!roundData || remainingPlayers.length === 0 || isSpinning) return;
    autoDrawQueueRef.current = remainingPlayers.map((p) => p.id);
    setAutoDrawing(true);
    setIsSpinning(true);
  }, [roundData, remainingPlayers, isSpinning]);

  const stopAutoDraw = useCallback(() => {
    autoDrawQueueRef.current = [];
    setAutoDrawing(false);
    if (autoDrawTimerRef.current) {
      clearTimeout(autoDrawTimerRef.current);
      autoDrawTimerRef.current = null;
    }
    flushSave();
  }, [flushSave]);

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
              spinButtonClassName="w-20 h-20 text-lg"
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-green-400 text-xl">
              All {roundData?.drawOrder.length || 0} players drawn!
            </p>
          </div>
        )}

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

        <div className="mt-4 flex justify-center gap-2">
          {remainingPlayers.length > 0 && !autoDrawing && (
            <button
              onClick={startAutoDraw}
              disabled={isSpinning}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Auto Draw All ({remainingPlayers.length})
            </button>
          )}
          {autoDrawing && (
            <button
              onClick={stopAutoDraw}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm animate-pulse"
            >
              Stop Auto Draw
            </button>
          )}
          <button
            onClick={resetDraw}
            disabled={isSpinning || autoDrawing}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Matches</h2>
          <span className="text-sm text-gray-400 bg-gray-700/50 px-2.5 py-1 rounded-full font-mono">
            {roundData?.matches.length || 0}
          </span>
        </div>
        <div className="max-h-[600px] overflow-y-auto space-y-1.5 pr-1">
          {roundData?.matches
            .slice()
            .reverse()
            .map((match) => (
              <div
                key={match.matchNumber}
                className={`px-3 py-2.5 rounded-lg border transition-colors ${
                  match.player2
                    ? "bg-gray-700/30 border-gray-600/30"
                    : "bg-yellow-900/15 border-yellow-600/30 animate-pulse"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-gray-500 w-5">
                    {match.matchNumber}
                  </span>
                  <div className="flex-1 text-sm">
                    <span className="text-blue-300 font-medium">
                      <span className="text-blue-500/60 text-xs mr-1">
                        {match.player1?.no}.
                      </span>
                      {match.player1?.name || "???"}
                    </span>
                  </div>
                  <span className="text-gray-600 text-[10px] font-bold tracking-wider">
                    VS
                  </span>
                  <div className="flex-1 text-sm text-right">
                    {match.player2 ? (
                      <span className="text-red-300 font-medium">
                        {match.player2.name}
                        <span className="text-red-500/60 text-xs ml-1">
                          .{match.player2.no}
                        </span>
                      </span>
                    ) : (
                      <span className="text-yellow-500/60 text-xs italic">
                        Waiting...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          {(!roundData || roundData.matches.length === 0) && (
            <p className="text-gray-500 text-center py-8 text-sm">
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
      <div className="flex items-center justify-between mb-5 bg-gray-800/60 rounded-xl p-3 border border-gray-700/50">
        <div className="flex gap-5 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-gray-400">Total</span>
            <span className="text-white font-bold text-base">
              {stats.total}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-green-400/80">Done</span>
            <span className="text-green-300 font-bold text-base">
              {stats.completed}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-yellow-400/80">Pending</span>
            <span className="text-yellow-300 font-bold text-base">
              {stats.pending}
            </span>
          </div>
          {stats.total > 0 && (
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-600">
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">
                {Math.round((stats.completed / stats.total) * 100)}%
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-1 bg-gray-900/50 rounded-lg p-0.5">
          {(["all", "pending", "completed"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                filterMode === mode
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[70vh] overflow-y-auto pr-1">
        {filteredMatches.map((match) => {
          const p1Won = match.winner?.no === match.player1?.no;
          const p2Won = match.winner?.no === match.player2?.no;
          return (
            <button
              key={match.matchNumber}
              onClick={() => setSelectedMatch(match)}
              className={`text-left p-3 rounded-xl border-2 transition-all hover:scale-[1.02] hover:shadow-lg ${
                match.winner
                  ? "bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-green-600/40 hover:border-green-400"
                  : "bg-gradient-to-br from-gray-800 to-gray-850 border-gray-600/50 hover:border-purple-400"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-gray-500">
                  #{match.matchNumber}
                </span>
                <div className="flex gap-1">
                  {match.specialEvent && (
                    <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded-full font-medium">
                      Special
                    </span>
                  )}
                  {match.winner ? (
                    <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-full font-medium">
                      {match.score || "Done"}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded-full font-medium">
                      Pending
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-0.5">
                <div
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
                    p1Won
                      ? "bg-green-600/20 ring-1 ring-green-500/60"
                      : p2Won
                        ? "bg-gray-700/30 opacity-60"
                        : "bg-gray-700/40"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {p1Won && (
                      <span className="text-green-400 text-xs shrink-0">W</span>
                    )}
                    <span
                      className={`text-sm truncate ${p1Won ? "text-green-200 font-semibold" : "text-white"}`}
                    >
                      {match.player1?.name || "TBD"}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-1">
                    {match.player1?.no || "-"}
                  </span>
                </div>
                <div className="text-center text-gray-600 text-[10px] font-bold tracking-wider">
                  VS
                </div>
                <div
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
                    p2Won
                      ? "bg-green-600/20 ring-1 ring-green-500/60"
                      : p1Won
                        ? "bg-gray-700/30 opacity-60"
                        : "bg-gray-700/40"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {p2Won && (
                      <span className="text-green-400 text-xs shrink-0">W</span>
                    )}
                    <span
                      className={`text-sm truncate ${p2Won ? "text-green-200 font-semibold" : "text-white"}`}
                    >
                      {match.player2?.name || "TBD"}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-1">
                    {match.player2?.no || "-"}
                  </span>
                </div>
              </div>
              {match.specialEvent && (
                <div className="mt-1.5 text-center text-[10px] text-orange-300/80 truncate italic">
                  {match.specialEvent}
                </div>
              )}
            </button>
          );
        })}
      </div>

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

// ===================== Inventory helpers =====================

interface InventoryItem {
  sourceType: string;
  name: string;
}

function buildInventoryList(char: Character): InventoryItem[] {
  const items: InventoryItem[] = [];
  const add = (sourceType: string, name: string) => {
    if (name) items.push({ sourceType, name });
  };

  if (char.race?.race) add("race", char.race.race);
  if (char.race?.subRace) add("sub_race", char.race.subRace);
  for (const a of Array.isArray(char.archetypes) ? char.archetypes : [])
    add("archetype", a);
  for (const na of Array.isArray(char.nestedArchetypes)
    ? char.nestedArchetypes
    : []) {
    if (na.subType) add("archetype_sub", na.subType);
  }
  for (const q of Array.isArray(char.quirks) ? char.quirks : []) {
    if (!q.isLost) add("quirk", q.name);
  }
  for (const p of Array.isArray(char.powers) ? char.powers : []) {
    if (!p.isLost) add("power", typeof p === "string" ? p : p.name);
  }
  for (const w of Array.isArray(char.weapons) ? char.weapons : []) {
    const name = typeof w === "string" ? w : w?.name;
    if (name) add("weapon", name);
  }
  for (const g of [
    ...(char.gear?.normalGear || []),
    ...(char.gear?.legacyGear || []),
  ]) {
    if (!g.isLost) add("gear", g.name);
  }
  for (const r of Array.isArray(char.runes?.runes) ? char.runes!.runes : []) {
    if (!r.isLost) add("rune", r.name);
  }
  if (char.runes?.runeword) add("runeword", char.runes.runeword);
  for (const h of Array.isArray(char.houses) ? char.houses : []) {
    if (!h.isLost) add("house", h.name);
  }
  for (const nh of Array.isArray(char.nestedHouses) ? char.nestedHouses : []) {
    if (!nh.isLost && nh.subType && !nh.subTypeIsLost)
      add("house_sub", nh.subType);
  }
  for (const cd of Array.isArray(char.charDevs) ? char.charDevs : []) {
    if (!cd.isLost) add("char_dev", cd.name);
  }
  for (const l of Array.isArray(char.lover) ? char.lover : []) {
    if (!l.isLost) add("lover", l.name);
  }
  return items;
}

function applyDisabledItems(
  char: Character,
  playerId: number,
  disabledItems: Set<string>,
): Character {
  if (disabledItems.size === 0) return char;

  const dis = (sourceType: string, name: string) =>
    disabledItems.has(`${playerId}-${sourceType}-${name}`);

  return {
    ...char,
    race:
      dis("race", char.race?.race || "") ||
      dis("sub_race", char.race?.subRace || "")
        ? {
            ...char.race!,
            race: dis("race", char.race?.race || "")
              ? ""
              : char.race?.race || "",
            subRace: dis("sub_race", char.race?.subRace || "")
              ? undefined
              : char.race?.subRace,
          }
        : char.race,
    archetypes: (char.archetypes || []).filter((a) => !dis("archetype", a)),
    nestedArchetypes: (char.nestedArchetypes || []).map((na) => ({
      ...na,
      subType: dis("archetype_sub", na.subType || "") ? undefined : na.subType,
    })),
    quirks: (char.quirks || []).map((q) =>
      dis("quirk", q.name) ? { ...q, isLost: true } : q,
    ),
    powers: (char.powers || []).map((p) => {
      const name = typeof p === "string" ? p : p.name;
      return dis("power", name)
        ? typeof p === "string"
          ? { name: p, isLost: true }
          : { ...p, isLost: true }
        : p;
    }),
    weapons: (char.weapons || []).map((w) => {
      const name = typeof w === "string" ? w : w?.name;
      return dis("weapon", name || "")
        ? typeof w === "string"
          ? ({ name: w, isLost: true } as any)
          : { ...w, isLost: true }
        : w;
    }),
    gear: char.gear
      ? {
          ...char.gear,
          normalGear: (char.gear.normalGear || []).map((g) =>
            dis("gear", g.name) ? { ...g, isLost: true } : g,
          ),
          legacyGear: (char.gear.legacyGear || []).map((g) =>
            dis("gear", g.name) ? { ...g, isLost: true } : g,
          ),
        }
      : char.gear,
    runes: char.runes
      ? {
          ...char.runes,
          runes: (char.runes.runes || []).map((r) =>
            dis("rune", r.name) ? { ...r, isLost: true } : r,
          ),
          runeword: dis("runeword", char.runes.runeword || "")
            ? undefined
            : char.runes.runeword,
        }
      : char.runes,
    houses: (char.houses || []).map((h) =>
      dis("house", h.name) ? { ...h, isLost: true } : h,
    ),
    charDevs: (char.charDevs || []).map((cd) =>
      dis("char_dev", cd.name) ? { ...cd, isLost: true } : cd,
    ),
    lover: (char.lover || []).map((l) =>
      dis("lover", l.name) ? { ...l, isLost: true } : l,
    ),
  };
}

// ===================== Inventory Section =====================

interface InventorySectionProps {
  player: TournamentPlayer;
  items: InventoryItem[];
  disabledItems: Set<string>;
  onToggleItem: (playerId: number, sourceType: string, name: string) => void;
  side: "left" | "right";
}

const InventorySection = ({
  player,
  items,
  disabledItems,
  onToggleItem,
  side,
}: InventorySectionProps) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-gray-800/70 rounded-xl border border-gray-700/60 p-3 shadow-inner">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between text-sm font-medium text-gray-300 hover:text-white mb-2 transition-colors ${
          side === "right" ? "flex-row-reverse" : ""
        }`}
      >
        <span>📋 Inventory ({items.length} items)</span>
        <span className="text-gray-500">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="max-h-64 overflow-y-auto space-y-1 pr-1 text-sm">
          {items.map((item, i) => {
            const key = `${player.id}-${item.sourceType}-${item.name}`;
            const isDisabled = disabledItems.has(key);
            const colorClass =
              (sourceTypeColors as Record<string, string>)[item.sourceType] ||
              "text-gray-400";

            return (
              <button
                key={i}
                onClick={() =>
                  onToggleItem(player.id, item.sourceType, item.name)
                }
                className={`w-full text-left px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-xs ${
                  isDisabled
                    ? "bg-gray-900/50 line-through opacity-60"
                    : "hover:bg-gray-700/50 bg-gray-800/30"
                } ${side === "right" ? "flex-row-reverse" : ""}`}
              >
                <span className={`font-medium ${colorClass}`}>{item.name}</span>
                <span className="text-gray-600 opacity-70">
                  [{item.sourceType}]
                </span>
                {isDisabled && (
                  <span className="ml-auto text-red-400 text-[10px] font-bold">
                    DISABLED
                  </span>
                )}
              </button>
            );
          })}
        </div>
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
  const [stepStarted, setStepStarted] = useState(false);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [battleDone, setBattleDone] = useState(false);
  const [overallWinner, setOverallWinner] = useState<"p1" | "p2" | null>(null);
  const [tieBreaker, setTieBreaker] = useState<string | null>(null);
  const [specialEvent, setSpecialEvent] = useState(match.specialEvent || "");
  const [note, setNote] = useState(match.note || "");
  const [showEffects, setShowEffects] = useState(true);
  const [disabledItems, setDisabledItems] = useState<Set<string>>(new Set());

  const [roundSpinModal, setRoundSpinModal] = useState<{
    isOpen: boolean;
    title: string;
    items: WheelSpinItem[];
    roundIndex: number;
    side: "p1" | "p2";
  }>({ isOpen: false, title: "", items: [], roundIndex: -1, side: "p1" });

  const [roundSpinResults, setRoundSpinResults] = useState<
    Record<string, { label: string; isSuccess: boolean }>
  >({});

  const player1 = useMemo(
    () => players.find((p) => p.id === match.player1?.no),
    [players, match],
  );
  const player2 = useMemo(
    () => players.find((p) => p.id === match.player2?.no),
    [players, match],
  );

  const itemsP1 = useMemo(
    () => (player1 ? buildInventoryList(player1.character) : []),
    [player1],
  );
  const itemsP2 = useMemo(
    () => (player2 ? buildInventoryList(player2.character) : []),
    [player2],
  );

  const p1Stats = useMemo(() => {
    if (!player1) return null;
    const char = applyDisabledItems(
      player1.character,
      player1.id,
      disabledItems,
    );
    const effects = EffectResolver.calculateCharacterEffects(char, {
      isPvE: false,
    });
    return {
      str: effects.totalStats.strength,
      spd: effects.totalStats.speed,
      dur: effects.totalStats.durability,
      iq: effects.totalStats.iq,
      biq: effects.totalStats.biq,
      ma: effects.totalStats.ma,
    } as CharacterStats;
  }, [player1, disabledItems]);

  const p2Stats = useMemo(() => {
    if (!player2) return null;
    const char = applyDisabledItems(
      player2.character,
      player2.id,
      disabledItems,
    );
    const effects = EffectResolver.calculateCharacterEffects(char, {
      isPvE: false,
    });
    return {
      str: effects.totalStats.strength,
      spd: effects.totalStats.speed,
      dur: effects.totalStats.durability,
      iq: effects.totalStats.iq,
      biq: effects.totalStats.biq,
      ma: effects.totalStats.ma,
    } as CharacterStats;
  }, [player2, disabledItems]);

  const p1Breakdown = useMemo(() => {
    if (!player1) return null;
    return EffectResolver.getCharacterEffectBreakdown(
      applyDisabledItems(player1.character, player1.id, disabledItems),
    );
  }, [player1, disabledItems]);

  const p2Breakdown = useMemo(() => {
    if (!player2) return null;
    return EffectResolver.getCharacterEffectBreakdown(
      applyDisabledItems(player2.character, player2.id, disabledItems),
    );
  }, [player2, disabledItems]);

  const p1BaseStats = useMemo(
    () => player1?.character.stats ?? null,
    [player1],
  );
  const p2BaseStats = useMemo(
    () => player2?.character.stats ?? null,
    [player2],
  );

  useEffect(() => {
    if (match.winner && p1Stats && p2Stats && !battleDone) {
      runBattleInstant();
    }
  }, [match.winner, p1Stats, p2Stats, battleDone]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const toggleItem = (playerId: number, sourceType: string, name: string) => {
    const key = `${playerId}-${sourceType}-${name}`;
    setDisabledItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getPerRoundEffects = (char: Character | undefined) => {
    if (!char) return { onWin: [] as string[], onLose: [] as string[] };
    const sources = [
      ...(char.quirks || [])
        .filter((q) => !q.isLost)
        .map((q) => q.name.toLowerCase()),
      ...(char.archetypes || []).map((a) => a.toLowerCase()),
      ...(char.powers || [])
        .filter((p) => (typeof p === "object" ? !p.isLost : true))
        .map((p) => (typeof p === "string" ? p : p.name).toLowerCase()),
    ];
    const onWin: string[] = [];
    const onLose: string[] = [];
    if (sources.some((s) => s.includes("critical strike")))
      onWin.push("Critical Strike");
    if (sources.some((s) => s.includes("evasion"))) onLose.push("Evasion");
    if (sources.some((s) => s === "gambler")) onWin.push("Gambler");
    return { onWin, onLose };
  };

  const p1Effects = getPerRoundEffects(player1?.character);
  const p2Effects = getPerRoundEffects(player2?.character);
  const hasAnySpinEffects =
    p1Effects.onWin.length > 0 ||
    p1Effects.onLose.length > 0 ||
    p2Effects.onWin.length > 0 ||
    p2Effects.onLose.length > 0;

  const CRIT_ITEMS: WheelSpinItem[] = [
    {
      label: "Crit! +1 bonus (20%)",
      weight: 20,
      isSuccess: true,
      color: "#f59e0b",
    },
    { label: "Miss (80%)", weight: 80, isSuccess: false, color: "#6b7280" },
  ];
  const EVASION_ITEMS: WheelSpinItem[] = [
    {
      label: "Evade! +1 điểm (20%)",
      weight: 20,
      isSuccess: true,
      color: "#10b981",
    },
    { label: "Không (80%)", weight: 80, isSuccess: false, color: "#6b7280" },
  ];
  const GAMBLER_ITEMS: WheelSpinItem[] = [
    { label: "+2 điểm (50%)", weight: 50, isSuccess: true, color: "#f59e0b" },
    { label: "+0 điểm (50%)", weight: 50, isSuccess: false, color: "#ef4444" },
  ];

  const computeRoundPoints = (
    side: "p1" | "p2",
    winner: "p1" | "p2" | "tie",
    roundIdx: number,
    effects: { onWin: string[]; onLose: string[] },
  ): { pts: number; pending: boolean } => {
    const isWinner = winner === side;
    const isLoser = winner !== side && winner !== "tie";
    const hasGambler = effects.onWin.includes("Gambler");
    const hasCrit = effects.onWin.includes("Critical Strike");
    const hasEvasion = effects.onLose.includes("Evasion");
    const gamblerSpun = roundSpinResults[`${roundIdx}-Gambler-${side}`];
    const critSpun = roundSpinResults[`${roundIdx}-Critical Strike-${side}`];
    const evasionSpun = roundSpinResults[`${roundIdx}-Evasion-${side}`];

    if (isWinner) {
      if (hasGambler && !gamblerSpun) return { pts: 1, pending: true };
      let base = hasGambler ? (gamblerSpun?.isSuccess ? 2 : 0) : 1;
      if (hasCrit && !critSpun) return { pts: base, pending: true };
      if (hasCrit && critSpun?.isSuccess) base += 1;
      return { pts: base, pending: false };
    }
    if (isLoser && hasEvasion) {
      if (!evasionSpun) return { pts: 0, pending: true };
      if (evasionSpun.isSuccess) return { pts: 1, pending: false };
    }
    return { pts: isWinner ? 1 : 0, pending: false };
  };

  const effectiveScores = useMemo(() => {
    let s1 = 0,
      s2 = 0;
    for (let i = 0; i <= currentRound && i < rounds.length; i++) {
      const r = rounds[i];
      const p1 = computeRoundPoints("p1", r.winner, i, p1Effects);
      const p2 = computeRoundPoints("p2", r.winner, i, p2Effects);
      s1 += p1.pts;
      s2 += p2.pts;
    }
    return { s1, s2 };
  }, [rounds, currentRound, roundSpinResults, p1Effects, p2Effects]);

  const makeSpinButton = (
    effectName: string,
    side: "p1" | "p2",
    roundIdx: number,
  ) => {
    const key = `${roundIdx}-${effectName}-${side}`;
    const result = roundSpinResults[key];
    const items =
      effectName === "Critical Strike"
        ? CRIT_ITEMS
        : effectName === "Evasion"
          ? EVASION_ITEMS
          : GAMBLER_ITEMS;

    if (result) {
      return (
        <button
          key={effectName}
          onClick={() =>
            setRoundSpinModal({
              isOpen: true,
              title: effectName,
              items,
              roundIndex: roundIdx,
              side,
            })
          }
          className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-bold border transition-colors ${
            result.isSuccess
              ? "bg-amber-600/30 text-amber-300 border-amber-500/40 hover:bg-amber-600/50"
              : "bg-gray-700/60 text-gray-400 border-gray-600/40 hover:bg-gray-700/80"
          }`}
          title={`${result.label} — click để quay lại`}
        >
          {result.isSuccess ? "✦" : "·"}{" "}
          {effectName === "Critical Strike"
            ? "Crit"
            : effectName === "Evasion"
              ? "Evade"
              : "Gambler"}
        </button>
      );
    }

    return (
      <button
        key={effectName}
        onClick={() =>
          setRoundSpinModal({
            isOpen: true,
            title: effectName,
            items,
            roundIndex: roundIdx,
            side,
          })
        }
        className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-bold border border-amber-500/50 bg-amber-600/20 text-amber-400 hover:bg-amber-600/40 animate-pulse transition-colors"
        title={`Quay ${effectName}`}
      >
        ◎{" "}
        {effectName === "Critical Strike"
          ? "Crit?"
          : effectName === "Evasion"
            ? "Evade?"
            : "Gambler?"}
      </button>
    );
  };

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
      const r1 = player1?.character.race?.race || "Human";
      const r2 = player2?.character.race?.race || "Human";
      const t1 = RACE_TIERS[r1] || 20;
      const t2 = RACE_TIERS[r2] || 20;
      setTieBreaker(`Race tier: ${r1}(${t1}) vs ${r2}(${t2})`);
      setOverallWinner(t1 <= t2 ? "p1" : "p2");
    }
  };

  const startBattle = () => {
    if (!p1Stats || !p2Stats) return;
    setCurrentRound(-1);
    setBattleDone(false);
    setOverallWinner(null);
    setTieBreaker(null);
    setP1Score(0);
    setP2Score(0);
    setStepStarted(true);

    const results: RoundResult[] = [];
    for (const { key, label } of STAT_ORDER) {
      const v1 = p1Stats[key];
      const v2 = p2Stats[key];
      let winner: "p1" | "p2" | "tie";
      if (v1 > v2) winner = "p1";
      else if (v2 > v1) winner = "p2";
      else winner = "tie";
      results.push({ stat: key, label, p1Value: v1, p2Value: v2, winner });
    }
    setRounds(results);
  };

  const nextRound = () => {
    const nextIdx = currentRound + 1;
    if (nextIdx >= rounds.length) return;
    setCurrentRound(nextIdx);
    const r = rounds[nextIdx];
    const newP1 = p1Score + (r.winner === "p1" ? 1 : 0);
    const newP2 = p2Score + (r.winner === "p2" ? 1 : 0);
    setP1Score(newP1);
    setP2Score(newP2);

    if (nextIdx === rounds.length - 1) {
      setBattleDone(true);
      if (newP1 > newP2) setOverallWinner("p1");
      else if (newP2 > newP1) setOverallWinner("p2");
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
        className={`flex gap-4 items-start justify-center max-h-[90vh] transition-all duration-300 ${
          showEffects ? "w-full max-w-[95vw]" : "w-full max-w-4xl"
        }`}
      >
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

        <div className="bg-gray-900/95 backdrop-blur-sm rounded-2xl border border-gray-600/50 flex-1 min-w-0 max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/50 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-red-900/20">
            <h2 className="text-lg font-bold text-white">
              <span className="text-gray-400 font-normal text-sm mr-2">
                Match
              </span>
              #{match.matchNumber}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              ×
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
              {/* Left column */}
              <div className="space-y-4">
                <PlayerCard
                  player={player1}
                  playerRef={match.player1}
                  stats={p1Stats}
                  side="left"
                  isWinner={overallWinner === "p1"}
                />

                {player1 && itemsP1.length > 0 && (
                  <InventorySection
                    player={player1}
                    items={itemsP1}
                    disabledItems={disabledItems}
                    onToggleItem={toggleItem}
                    side="left"
                  />
                )}
              </div>

              {/* Center */}
              <div className="flex flex-col items-center justify-center pt-10 min-w-[100px]">
                {battleDone ? (
                  <div className="text-center">
                    <div className="text-3xl font-black text-white tracking-wider">
                      <span className="text-blue-400">
                        {hasAnySpinEffects ? effectiveScores.s1 : p1Score}
                      </span>
                      <span className="text-gray-600 mx-1">:</span>
                      <span className="text-red-400">
                        {hasAnySpinEffects ? effectiveScores.s2 : p2Score}
                      </span>
                    </div>
                    {tieBreaker && (
                      <div className="text-[10px] text-yellow-400/80 mt-1 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                        {tieBreaker}
                      </div>
                    )}
                    {overallWinner && (
                      <div
                        className={`text-sm font-bold mt-2 px-3 py-1 rounded-lg ${
                          overallWinner === "p1"
                            ? "text-blue-300 bg-blue-500/15"
                            : "text-red-300 bg-red-500/15"
                        }`}
                      >
                        {overallWinner === "p1"
                          ? match.player1?.name
                          : match.player2?.name}{" "}
                        WINS
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-2xl font-black text-gray-500 tracking-widest">
                    VS
                  </div>
                )}
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <PlayerCard
                  player={player2}
                  playerRef={match.player2}
                  stats={p2Stats}
                  side="right"
                  isWinner={overallWinner === "p2"}
                />

                {player2 && itemsP2.length > 0 && (
                  <InventorySection
                    player={player2}
                    items={itemsP2}
                    disabledItems={disabledItems}
                    onToggleItem={toggleItem}
                    side="right"
                  />
                )}
              </div>
            </div>

            <div className="mt-3">
              <button
                onClick={() => setShowEffects(!showEffects)}
                className="w-full text-center text-xs text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-lg py-1.5 px-3 border border-gray-700 hover:border-gray-600 transition-all"
              >
                {showEffects ? "Ẩn hiệu ứng ◀▶" : "Xem hiệu ứng ◀▶"}
              </button>
            </div>

            {rounds.length > 0 && (
              <div className="mt-4 bg-gray-800/40 rounded-xl p-3 space-y-1.5">
                {rounds.map((round, idx) => {
                  const revealed = idx <= currentRound;
                  const p1Win = revealed && round.winner === "p1";
                  const p2Win = revealed && round.winner === "p2";
                  const tie = revealed && round.winner === "tie";
                  const p1Pts = revealed
                    ? computeRoundPoints("p1", round.winner, idx, p1Effects)
                    : null;
                  const p2Pts = revealed
                    ? computeRoundPoints("p2", round.winner, idx, p2Effects)
                    : null;

                  return (
                    <div
                      key={round.stat}
                      className={`transition-all duration-500 ${revealed ? "opacity-100" : "opacity-15"}`}
                    >
                      <div className="grid grid-cols-[1fr_70px_1fr] gap-2 items-center">
                        <div
                          className={`text-right text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${
                            p1Win
                              ? "bg-blue-500/25 text-blue-300 ring-1 ring-blue-500/40"
                              : tie
                                ? "bg-yellow-500/15 text-yellow-400"
                                : revealed
                                  ? "text-gray-500"
                                  : "text-gray-600"
                          }`}
                        >
                          {round.p1Value}
                          {p1Win && p1Pts && p1Pts.pts !== 1 && (
                            <span className="ml-1.5 text-[10px] text-blue-400">
                              W({p1Pts.pts > 0 ? "+" : ""}
                              {p1Pts.pts})
                            </span>
                          )}
                        </div>
                        <div className="text-center text-[11px] font-bold text-gray-400 tracking-wider">
                          {round.label}
                        </div>
                        <div
                          className={`text-left text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${
                            p2Win
                              ? "bg-red-500/25 text-red-300 ring-1 ring-red-500/40"
                              : tie
                                ? "bg-yellow-500/15 text-yellow-400"
                                : revealed
                                  ? "text-gray-500"
                                  : "text-gray-600"
                          }`}
                        >
                          {p2Win && p2Pts && p2Pts.pts !== 1 && (
                            <span className="mr-1.5 text-[10px] text-red-400">
                              W({p2Pts.pts > 0 ? "+" : ""}
                              {p2Pts.pts})
                            </span>
                          )}
                          {round.p2Value}
                        </div>
                      </div>

                      {revealed && (p1Win || p2Win) && (
                        <div className="flex justify-between mt-0.5 px-1">
                          <div className="flex gap-1">
                            {p1Win &&
                              p1Effects.onWin.map((eff) =>
                                makeSpinButton(eff, "p1", idx),
                              )}
                            {p2Win &&
                              p1Effects.onLose.map((eff) =>
                                makeSpinButton(eff, "p1", idx),
                              )}
                          </div>
                          <div className="flex gap-1">
                            {p2Win &&
                              p2Effects.onWin.map((eff) =>
                                makeSpinButton(eff, "p2", idx),
                              )}
                            {p1Win &&
                              p2Effects.onLose.map((eff) =>
                                makeSpinButton(eff, "p2", idx),
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

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

            <div className="mt-5 flex justify-center gap-3 flex-wrap">
              {!stepStarted && !battleDone && (
                <>
                  <button
                    onClick={startBattle}
                    disabled={!p1Stats || !p2Stats}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
                  >
                    ⚔ Bắt đầu
                  </button>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setManualWinner("p1")}
                      className="px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg text-xs border border-blue-500/30 transition-colors"
                    >
                      {match.player1?.name} Win
                    </button>
                    <button
                      onClick={() => setManualWinner("p2")}
                      className="px-3 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded-lg text-xs border border-red-500/30 transition-colors"
                    >
                      {match.player2?.name} Win
                    </button>
                  </div>
                </>
              )}

              {stepStarted && !battleDone && (
                <button
                  onClick={nextRound}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all"
                >
                  Round {currentRound + 2}/{rounds.length} ▶ Next
                </button>
              )}

              {battleDone && overallWinner && (
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all"
                >
                  Save Result
                </button>
              )}

              {(battleDone || stepStarted) && (
                <button
                  onClick={() => {
                    setBattleDone(false);
                    setOverallWinner(null);
                    setRounds([]);
                    setCurrentRound(-1);
                    setP1Score(0);
                    setP2Score(0);
                    setTieBreaker(null);
                    setStepStarted(false);
                    setRoundSpinResults({});
                  }}
                  className="px-3 py-2 bg-gray-700/60 hover:bg-gray-600/60 text-gray-300 rounded-lg text-xs border border-gray-600/50 transition-colors"
                >
                  ↺ Re-battle
                </button>
              )}
            </div>
          </div>
        </div>

        <ProbabilityWheelModal
          isOpen={roundSpinModal.isOpen}
          onClose={() =>
            setRoundSpinModal((prev) => ({ ...prev, isOpen: false }))
          }
          title={roundSpinModal.title}
          description={`Round ${roundSpinModal.roundIndex + 1} — ${
            roundSpinModal.side === "p1"
              ? match.player1?.name
              : match.player2?.name
          }`}
          items={roundSpinModal.items}
          onResult={(item) => {
            const key = `${roundSpinModal.roundIndex}-${roundSpinModal.title}-${roundSpinModal.side}`;
            setRoundSpinResults((prev) => ({
              ...prev,
              [key]: { label: item.label, isSuccess: !!item.isSuccess },
            }));
            setRoundSpinModal((prev) => ({ ...prev, isOpen: false }));
          }}
        />

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

// ===================== Player Card (đã gỡ inventory) =====================

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
  const barBg = side === "left" ? "bg-blue-500" : "bg-red-500";
  const borderGlow = isWinner
    ? "border-green-400 shadow-lg shadow-green-500/30"
    : side === "left"
      ? "border-blue-600/40"
      : "border-red-600/40";

  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all bg-gray-800/70 backdrop-blur ${borderGlow} ${
        side === "right" ? "text-right" : ""
      }`}
    >
      <div
        className={`flex items-center gap-2 mb-1 ${side === "right" ? "flex-row-reverse" : ""}`}
      >
        <span className="text-[11px] font-mono text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded">
          No.{playerRef?.no || "?"}
        </span>
        {isWinner && (
          <span className="text-yellow-400 text-xs font-bold bg-yellow-500/15 px-2 py-0.5 rounded-full">
            WINNER
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold text-white truncate">
        {playerRef?.name || "TBD"}
      </h3>
      <p className="text-xs text-gray-500">{playerRef?.username || ""}</p>
      <p
        className={`text-xs mt-1 ${side === "left" ? "text-blue-300/80" : "text-red-300/80"}`}
      >
        {race}
        {subRace ? ` / ${subRace}` : ""}
      </p>

      {stats && (
        <div className="mt-3 space-y-1.5">
          {STAT_ORDER.map(({ key, label }) => (
            <div
              key={key}
              className={`flex items-center gap-2 text-sm ${side === "right" ? "flex-row-reverse" : ""}`}
            >
              <span className="text-gray-500 w-8 text-[11px] font-bold">
                {label}
              </span>
              <div className="flex-1 bg-gray-700/60 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barBg} transition-all duration-500`}
                  style={{
                    width: `${Math.min(stats[key] * 5, 100)}%`,
                    ...(side === "right" ? { marginLeft: "auto" } : {}),
                  }}
                />
              </div>
              <span className="text-white font-mono w-7 text-center text-sm font-bold">
                {stats[key]}
              </span>
            </div>
          ))}
          <div
            className={`flex items-center gap-2 pt-1 border-t border-gray-700/50 ${
              side === "right" ? "flex-row-reverse" : ""
            }`}
          >
            <span className="text-gray-500 w-8 text-[10px] font-bold">TTL</span>
            <div className="flex-1" />
            <span
              className={`font-mono w-7 text-center text-sm font-bold ${
                side === "left" ? "text-blue-300" : "text-red-300"
              }`}
            >
              {STAT_ORDER.reduce((sum, { key }) => sum + (stats[key] || 0), 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
