import { useState, useEffect, useMemo, useCallback } from "react";
import { readDriveFile } from "../utils/googleDrive";
import { ROUND_256_FILE_ID } from "../config/googleDrive";

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

// ===================== Main Page =====================

export const PublicBracketPage = () => {
  const [roundData, setRoundData] = useState<Round256Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "completed">("all");

  const loadData = useCallback(async () => {
    try {
      const data = await readDriveFile<Round256Data>(ROUND_256_FILE_ID);
      setRoundData(data);
      setError(null);
      setLastRefresh(new Date());
    } catch (e) {
      setError("Failed to load bracket data from Google Drive");
      console.error("Load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading bracket data...</p>
        </div>
      </div>
    );
  }

  if (error && !roundData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6 relative">
          <button
            onClick={() => { window.location.hash = "#/players"; }}
            className="absolute left-0 top-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm"
          >
            &larr; Players
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            PvP Tournament - Round 256
          </h1>
          <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-400">
            {roundData?.lastUpdated && (
              <span>
                Updated: {new Date(roundData.lastUpdated).toLocaleString()}
              </span>
            )}
            {lastRefresh && (
              <span>
                Refreshed: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Stats + Filter Bar */}
        <div className="flex items-center justify-between mb-4 bg-gray-800/50 rounded-lg px-4 py-3">
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
                className={`px-3 py-1 text-xs rounded transition-colors ${
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
        {filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-xl">
              {roundData && roundData.matches.length > 0
                ? "No matches found for this filter."
                : "No matches yet. Tournament draw has not started."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
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
                  <span className="text-xs text-gray-400">Match #{match.matchNumber}</span>
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
                    <span className="text-xs text-gray-400">#{match.player1?.no || "-"}</span>
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
                    <span className="text-xs text-gray-400">#{match.player2?.no || "-"}</span>
                  </div>
                </div>
                {match.score && (
                  <div className="mt-1 text-center text-xs text-gray-400">{match.score}</div>
                )}
                {match.specialEvent && (
                  <div className="mt-1 text-center text-xs text-orange-400 truncate">
                    {match.specialEvent}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Refresh button */}
        <div className="text-center mt-6">
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors text-sm"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Match Detail Modal */}
      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
};

// ===================== Match Detail Modal (Read-Only) =====================

interface MatchDetailModalProps {
  match: MatchData;
  onClose: () => void;
}

const MatchDetailModal = ({ match, onClose }: MatchDetailModalProps) => {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-800 rounded-xl border border-gray-600 max-w-lg w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Match #{match.matchNumber}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Players */}
        <div className="space-y-3">
          {/* Player 1 */}
          <div
            className={`flex items-center justify-between rounded-lg px-4 py-3 ${
              match.winner?.no === match.player1?.no
                ? "bg-green-700/30 ring-2 ring-green-500"
                : "bg-gray-700/50"
            }`}
          >
            <div>
              <div className="text-white font-semibold text-lg">
                {match.player1?.name || "TBD"}
              </div>
              <div className="text-gray-400 text-sm">
                @{match.player1?.username || "-"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">No.{match.player1?.no || "-"}</div>
              {match.winner?.no === match.player1?.no && (
                <span className="text-green-400 text-xs font-bold">WINNER</span>
              )}
            </div>
          </div>

          <div className="text-center text-gray-500 font-bold text-lg">VS</div>

          {/* Player 2 */}
          <div
            className={`flex items-center justify-between rounded-lg px-4 py-3 ${
              match.winner?.no === match.player2?.no
                ? "bg-green-700/30 ring-2 ring-green-500"
                : "bg-gray-700/50"
            }`}
          >
            <div>
              <div className="text-white font-semibold text-lg">
                {match.player2?.name || "TBD"}
              </div>
              <div className="text-gray-400 text-sm">
                @{match.player2?.username || "-"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">No.{match.player2?.no || "-"}</div>
              {match.winner?.no === match.player2?.no && (
                <span className="text-green-400 text-xs font-bold">WINNER</span>
              )}
            </div>
          </div>
        </div>

        {/* Match Details */}
        <div className="mt-6 space-y-3">
          {match.score && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Score:</span>
              <span className="text-white text-sm font-medium">{match.score}</span>
            </div>
          )}
          {match.specialEvent && (
            <div className="flex items-start gap-2">
              <span className="text-gray-400 text-sm shrink-0">Special Event:</span>
              <span className="text-orange-400 text-sm font-medium">{match.specialEvent}</span>
            </div>
          )}
          {match.note && (
            <div className="flex items-start gap-2">
              <span className="text-gray-400 text-sm shrink-0">Note:</span>
              <span className="text-gray-300 text-sm">{match.note}</span>
            </div>
          )}
          {!match.winner && (
            <div className="text-center py-2">
              <span className="text-yellow-400 text-sm">Match not yet played</span>
            </div>
          )}
        </div>

        {/* Close button */}
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
