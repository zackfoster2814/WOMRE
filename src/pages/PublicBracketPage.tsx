import { useState, useEffect, useMemo, useCallback } from "react";
import { readDriveFile } from "../utils/googleDrive";
import {
  loadAllBracketMatches,
  type MatchData,
  ROUND_SECTION,
  ROUND_SEARCH_OPTIONS,
  BRANCH_OPTIONS,
  getRoundKeyByMatchNumber,
  searchMatches,
  type SearchType,
} from "../config/tournamentConfig";
import { BracketTreeView } from "../components/bracket/BracketTreeView";

// ===================== Main Page =====================

export const PublicBracketPage = () => {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "completed">("all");
  const [bracketSection, setBracketSection] = useState<"qualifying" | "winners">("qualifying");

  // Search state
  const [searchRound, setSearchRound] = useState("all");
  const [searchBranch, setSearchBranch] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("playerName");
  const [searchOpen, setSearchOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const allMatches = await loadAllBracketMatches(readDriveFile);
      setMatches(allMatches);
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

  // Tính kết quả search
  const searchResults = useMemo(() => {
    const results = searchMatches(matches, { round: searchRound, branch: searchBranch, text: searchText, type: searchType });
    return results.length === 0 && !searchText.trim() && searchRound === "all" && searchBranch === "all" ? null : results;
  }, [matches, searchText, searchRound, searchBranch, searchType]);

  const highlightMatchNumbers = useMemo(
    () => searchResults ? new Set(searchResults.map((m) => m.matchNumber)) : undefined,
    [searchResults],
  );

  const focusMatchNumber = useMemo(() => {
    if (!searchResults || searchResults.length === 0) return null;
    return searchResults[0].matchNumber;
  }, [searchResults]);

  // Auto-switch tab khi focus match thuộc section khác
  useEffect(() => {
    if (focusMatchNumber == null) return;
    const rk = getRoundKeyByMatchNumber(focusMatchNumber);
    if (!rk) return;
    const targetSection = ROUND_SECTION[rk] ?? "qualifying";
    if (targetSection !== bracketSection) setBracketSection(targetSection);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMatchNumber]);

  const filteredMatches = useMemo(() => {
    const valid = matches.filter((m) => m.player1 && m.player2);
    switch (filterMode) {
      case "pending":
        return valid.filter((m) => !m.winner);
      case "completed":
        return valid.filter((m) => m.winner);
      default:
        return valid;
    }
  }, [matches, filterMode]);

  const stats = useMemo(() => {
    const complete = matches.filter((m) => m.player1 && m.player2);
    return {
      total: complete.length,
      completed: complete.filter((m) => m.winner).length,
      pending: complete.filter((m) => !m.winner).length,
    };
  }, [matches]);

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

  if (error && matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-purple-600 text-white rounded-none hover:bg-purple-500 transition-colors"
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
            className="absolute left-0 top-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-none transition-colors text-sm"
          >
            &larr; Players
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            PvP Tournament - Round 256
          </h1>
          <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-400">
            {lastRefresh && (
              <span>
                Refreshed: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Stats + Filter Bar */}
        <div className="flex items-center justify-between mb-4 bg-gray-800/50 rounded-none px-4 py-3">
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

        {/* Mobile: grid card layout (hidden trên desktop) */}
        <div className="lg:hidden">
          {filteredMatches.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-xl">
                {matches.length > 0
                  ? "No matches found for this filter."
                  : "No matches yet. Tournament draw has not started."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredMatches.map((match) => (
                <button
                  key={match.matchNumber}
                  onClick={() => setSelectedMatch(match)}
                  className={`text-left p-3 rounded-none border transition-all hover:scale-[1.02] ${
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
        </div>

        {/* Desktop: bracket tree view (hidden trên mobile) */}
        <div className="hidden lg:block">
          {/* Search bar */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen((o) => !o)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs border transition-all ${
                  searchOpen || searchResults
                    ? "bg-amber-600/20 border-amber-500/50 text-amber-300"
                    : "bg-gray-800/60 border-gray-700/40 text-gray-400 hover:text-white hover:bg-gray-700/60"
                }`}
              >
                <span>🔍</span>
                <span>Tìm kiếm</span>
                {searchResults && (
                  <span className="ml-1 bg-amber-500/30 text-amber-300 px-1.5 rounded-full text-[10px] font-bold">
                    {searchResults.length}
                  </span>
                )}
              </button>
              {searchResults && (
                <button
                  onClick={() => { setSearchText(""); setSearchRound("all"); setSearchBranch("all"); }}
                  className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Xoá tìm kiếm
                </button>
              )}
              {searchResults && searchResults.length > 0 && (
                <span className="text-[10px] text-amber-400/70">
                  Trận đầu tiên: #{searchResults[0].matchNumber}
                  {searchResults[0].player1 && searchResults[0].player2
                    ? ` · ${searchResults[0].player1.name} vs ${searchResults[0].player2.name}`
                    : ""}
                </span>
              )}
            </div>

            {searchOpen && (
              <div className="mt-2 p-3 bg-gray-900/80 border border-gray-700/50 rounded-none flex flex-wrap gap-2 items-end">
                {/* Dropdown: Round */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-medium">Vòng đấu</label>
                  <select
                    value={searchRound}
                    onChange={(e) => setSearchRound(e.target.value)}
                    className="bg-gray-800 border border-gray-600/50 text-gray-200 text-xs rounded-none px-2 py-1.5 focus:outline-none focus:border-amber-500/60 min-w-[140px]"
                  >
                    {ROUND_SEARCH_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Dropdown: Nhánh */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-medium">Nhánh</label>
                  <select
                    value={searchBranch}
                    onChange={(e) => setSearchBranch(e.target.value)}
                    className="bg-gray-800 border border-gray-600/50 text-gray-200 text-xs rounded-none px-2 py-1.5 focus:outline-none focus:border-amber-500/60 min-w-[140px]"
                  >
                    {BRANCH_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Dropdown: Loại tìm kiếm */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-medium">Tìm theo</label>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as typeof searchType)}
                    className="bg-gray-800 border border-gray-600/50 text-gray-200 text-xs rounded-none px-2 py-1.5 focus:outline-none focus:border-amber-500/60 min-w-[140px]"
                  >
                    <option value="playerName">Tên player</option>
                    <option value="playerNo">STT player</option>
                    <option value="matchNo">STT trận</option>
                  </select>
                </div>

                {/* Input */}
                <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
                  <label className="text-[10px] text-gray-500 font-medium">Từ khoá</label>
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder={
                      searchType === "playerName" ? "Nhập tên player..."
                      : searchType === "playerNo" ? "Nhập số thứ tự player..."
                      : "Nhập số trận..."
                    }
                    className="bg-gray-800 border border-gray-600/50 text-gray-200 text-xs rounded-none px-2 py-1.5 focus:outline-none focus:border-amber-500/60 placeholder-gray-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section tabs */}
          <div className="flex gap-1 mb-3">
            {([
              { key: "qualifying" as const, label: "Vòng Loại",   desc: "R256 · R128 · R64" },
              { key: "winners"   as const, label: "Double Elim", desc: "WB + LB + Finals" },
            ]).map((s) => (
              <button
                key={s.key}
                onClick={() => setBracketSection(s.key)}
                className={`flex flex-col items-start px-4 py-2 rounded-none text-sm font-medium transition-all border ${
                  bracketSection === s.key
                    ? "bg-purple-600/30 border-purple-500/60 text-purple-200 shadow"
                    : "bg-gray-800/60 border-gray-700/40 text-gray-400 hover:text-white hover:bg-gray-700/60"
                }`}
              >
                <span>{s.label}</span>
                <span className="text-[10px] font-normal opacity-60">{s.desc}</span>
              </button>
            ))}
          </div>
          {matches.length > 0 ? (
            <BracketTreeView
              matches={matches}
              filterMode={filterMode}
              section={bracketSection}
              onSelectMatch={setSelectedMatch}
              readOnly={true}
              highlightMatchNumbers={highlightMatchNumbers}
              focusMatchNumber={focusMatchNumber}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-xl">
                No matches yet. Tournament draw has not started.
              </p>
            </div>
          )}
        </div>

        {/* Refresh button */}
        <div className="text-center mt-6">
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-none hover:bg-gray-600 hover:text-white transition-colors text-sm"
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
      <div className="bg-gray-800 rounded-none border border-gray-600 max-w-lg w-full p-6 shadow-2xl">
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
            className={`flex items-center justify-between rounded-none px-4 py-3 ${
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
            className={`flex items-center justify-between rounded-none px-4 py-3 ${
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
            className="px-6 py-2 bg-gray-700 text-gray-300 rounded-none hover:bg-gray-600 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
