import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { CharacterParser } from "../utils/characterParser";
import { Character } from "../types/character";
import { WheelCanvas } from "../components/WheelCanvas";
import { WheelItem } from "../types";
import { getAssetPath } from "../utils/basePath";
import { initializeEffectData } from "../effects/data";
import {
  StatsComparisonMode,
  type TournamentMatchContext,
  type TournamentSaveResult,
} from "./BattleZonePage";
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

// ===================== Main Component =====================

export const PvPTournamentPage = () => {
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"create" | "bracket">("create");
  const [roundData, setRoundData] = useState<Round256Data | null>(null);
  const [driveStatus, setDriveStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [tournamentBattle, setTournamentBattle] =
    useState<TournamentMatchContext | null>(null);

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

  const handleSaveTournamentResult = useCallback(
    async (result: TournamentSaveResult) => {
      if (!roundData || !tournamentBattle) return;
      const winnerRef = roundData.matches
        .find((m) => m.matchNumber === tournamentBattle.matchNumber)
        ?.player1?.no === result.winnerNo
        ? roundData.matches.find(
            (m) => m.matchNumber === tournamentBattle.matchNumber,
          )?.player1
        : roundData.matches.find(
            (m) => m.matchNumber === tournamentBattle.matchNumber,
          )?.player2;

      const newMatches = roundData.matches.map((m) =>
        m.matchNumber === tournamentBattle.matchNumber
          ? {
              ...m,
              winner: winnerRef ?? null,
              score: result.score,
              specialEvent: result.specialEvent,
              note: result.note,
            }
          : m,
      );
      const newData: Round256Data = {
        ...roundData,
        matches: newMatches,
        lastUpdated: new Date().toISOString(),
      };
      setRoundData(newData);
      setTournamentBattle(null);
      await saveToDrive(newData);
    },
    [roundData, tournamentBattle, saveToDrive],
  );

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

  // Navigate into BattleZone for a specific match
  if (tournamentBattle) {
    return (
      <StatsComparisonMode
        onBack={() => setTournamentBattle(null)}
        tournamentMatch={tournamentBattle}
        onSaveTournamentResult={handleSaveTournamentResult}
      />
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
            roundData={roundData}
            onOpenMatch={setTournamentBattle}
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
  roundData: Round256Data | null;
  onOpenMatch: (ctx: TournamentMatchContext) => void;
}

const BracketTab = ({ roundData, onOpenMatch }: BracketTabProps) => {
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
              onClick={() =>
                onOpenMatch({
                  matchNumber: match.matchNumber,
                  player1No: match.player1?.no ?? 0,
                  player2No: match.player2?.no ?? 0,
                  existingWinnerNo: match.winner?.no,
                  existingScore: match.score,
                  existingSpecialEvent: match.specialEvent,
                  existingNote: match.note,
                })
              }
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

    </div>
  );
};
