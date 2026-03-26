import { useState, useEffect, useRef } from "react";
import { readDriveFile } from "../../utils/googleDrive";
import {
  ROUND_256_FILE_ID,
  ROUND_128_FILE_ID,
  ROUND_64W_FILE_ID,
  ROUND_32W_FILE_ID,
  ROUND_16W_FILE_ID,
  ROUND_QFW_FILE_ID,
  ROUND_SFW_FILE_ID,
  ROUND_GFW_FILE_ID,
  ROUND_32L1_FILE_ID,
  ROUND_32L2_FILE_ID,
  ROUND_16L1_FILE_ID,
  ROUND_16L2_FILE_ID,
  ROUND_QFL1_FILE_ID,
  ROUND_QFL2_FILE_ID,
  ROUND_SFL1_FILE_ID,
  ROUND_SFL2_FILE_ID,
  ROUND_GFL1_FILE_ID,
  ROUND_GFL2_FILE_ID,
  ROUND_GF_FILE_ID,
  ROUND_BRONZE_FILE_ID,
} from "../../config/googleDrive";
import { PvPPlayerData } from "../../types/battleZone";

const ROUND_OPTIONS = [
  { label: "R256", fileId: ROUND_256_FILE_ID },
  { label: "R128", fileId: ROUND_128_FILE_ID },
  { label: "WB-R64", fileId: ROUND_64W_FILE_ID },
  { label: "WB-R32", fileId: ROUND_32W_FILE_ID },
  { label: "WB-R16", fileId: ROUND_16W_FILE_ID },
  { label: "WB-QF", fileId: ROUND_QFW_FILE_ID },
  { label: "WB-SF", fileId: ROUND_SFW_FILE_ID },
  { label: "WB-Final", fileId: ROUND_GFW_FILE_ID },
  { label: "LB-R32-1", fileId: ROUND_32L1_FILE_ID },
  { label: "LB-R32-2", fileId: ROUND_32L2_FILE_ID },
  { label: "LB-R16-1", fileId: ROUND_16L1_FILE_ID },
  { label: "LB-R16-2", fileId: ROUND_16L2_FILE_ID },
  { label: "LB-QF-1", fileId: ROUND_QFL1_FILE_ID },
  { label: "LB-QF-2", fileId: ROUND_QFL2_FILE_ID },
  { label: "LB-SF-1", fileId: ROUND_SFL1_FILE_ID },
  { label: "LB-SF-2", fileId: ROUND_SFL2_FILE_ID },
  { label: "LB-GF-1", fileId: ROUND_GFL1_FILE_ID },
  { label: "LB-GF-2", fileId: ROUND_GFL2_FILE_ID },
  { label: "Grand Final", fileId: ROUND_GF_FILE_ID },
  { label: "Hạng 3", fileId: ROUND_BRONZE_FILE_ID },
];

// ============================================================================
// Dev Mode: Floating Wheel Weight Panel
// ============================================================================
interface DevWheelPanelProps {
  pos: { x: number; y: number };
  onPosChange: (pos: { x: number; y: number }) => void;
  overrides: Record<string, Record<number, number>>;
  onOverrideChange: (effect: string, idx: number, val: number) => void;
  onReset: () => void;
  defaultItems: Record<string, { label: string; weight: number }[]>;
  // Matchup tab
  allPlayers: PvPPlayerData[];
  onLoadMatchup: (p1: PvPPlayerData, p2: PvPPlayerData) => void;
  // Skip round spins (optional — only used in StatsComparisonMode)
  skipRoundSpins?: boolean;
  onSkipRoundSpinsChange?: (val: boolean) => void;
}

export const DevWheelPanel = ({
  pos,
  onPosChange,
  overrides,
  onOverrideChange,
  onReset,
  defaultItems,
  allPlayers,
  onLoadMatchup,
  skipRoundSpins,
  onSkipRoundSpinsChange,
}: DevWheelPanelProps) => {
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [devTab, setDevTab] = useState<"weights" | "matchup">("matchup");
  const [mpMatches, setMpMatches] = useState<
    Array<{
      matchNumber: number;
      player1: { no: number; name: string } | null;
      player2: { no: number; name: string } | null;
      winner: { no: number } | null;
    }>
  >([]);
  const [mpFilter, setMpFilter] = useState<"all" | "pending">("pending");
  const [mpSearch, setMpSearch] = useState("");
  const [selectedRound, setSelectedRound] = useState(ROUND_OPTIONS[0].fileId);
  const [mpLoading, setMpLoading] = useState(false);

  useEffect(() => {
    setMpLoading(true);
    setMpMatches([]);
    readDriveFile<{ matches?: typeof mpMatches }>(selectedRound)
      .then((d) => {
        console.log("[DevPanel] raw data:", d);
        console.log("[DevPanel] first match:", (d.matches || [])[0]);
        setMpMatches(d.matches || []);
      })
      .catch((e) => console.error("[DevPanel] load error:", e))
      .finally(() => setMpLoading(false));
  }, [selectedRound]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      onPosChange({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };
    const onUp = () => {
      isDragging.current = false;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [onPosChange]);

  type AnyMatch = Record<string, any>;
  const filteredMatches = (mpMatches as unknown as AnyMatch[]).filter((m) => {
    const p1 = m.player1 ?? m.player1No;
    const p2 = m.player2 ?? m.player2No;
    if (!p1 || !p2) return false;
    if (mpFilter === "pending" && (m.winner ?? m.winnerNo)) return false;
    if (mpSearch.trim()) {
      const q = mpSearch.toLowerCase();
      const p1name = (typeof p1 === "object" ? p1.name : String(p1)) ?? "";
      const p2name = (typeof p2 === "object" ? p2.name : String(p2)) ?? "";
      return (
        p1name.toLowerCase().includes(q) ||
        p2name.toLowerCase().includes(q) ||
        String(m.matchNumber).includes(q)
      );
    }
    return true;
  });

  return (
    <div
      className="fixed z-[9999] w-80 bg-gray-950 border border-yellow-500/60 rounded-xl shadow-2xl select-none"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Header — drag handle */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-yellow-600/20 border-b border-yellow-500/40 rounded-t-xl cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <span className="text-yellow-300 font-bold text-sm">⚙ DEV MODE</span>
        <span className="text-yellow-500/60 text-xs">Ctrl+Shift+D</span>
      </div>

      {/* Skip round spins toggle */}
      {onSkipRoundSpinsChange && <div className="px-3 py-1.5 border-b border-yellow-500/30 flex items-center justify-between">
        <span className="text-xs text-gray-300">Skip Round Spins</span>
        <button
          onClick={() => onSkipRoundSpinsChange(!skipRoundSpins)}
          className={`px-2 py-0.5 text-xs rounded font-bold transition-colors ${
            skipRoundSpins
              ? "bg-green-600/60 text-green-200 border border-green-500/60"
              : "bg-gray-700 text-gray-500 border border-gray-600"
          }`}
        >
          {skipRoundSpins ? "ON" : "OFF"}
        </button>
      </div>}

      {/* Tabs */}
      <div className="flex border-b border-yellow-500/30">
        <button
          onClick={() => setDevTab("matchup")}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors ${devTab === "matchup" ? "bg-yellow-700/30 text-yellow-200" : "text-gray-500 hover:text-gray-300"}`}
        >
          ⚔ Cặp Đấu
        </button>
        <button
          onClick={() => setDevTab("weights")}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors ${devTab === "weights" ? "bg-yellow-700/30 text-yellow-200" : "text-gray-500 hover:text-gray-300"}`}
        >
          🎡 Wheel Weights
        </button>
      </div>

      {devTab === "matchup" && (
        <div className="flex flex-col" style={{ maxHeight: "70vh" }}>
          {/* Round selector */}
          <div className="px-2 pt-2 pb-1.5 border-b border-gray-800 flex gap-1.5">
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="flex-1 text-xs px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-yellow-200 focus:outline-none focus:border-yellow-500"
            >
              {ROUND_OPTIONS.map((r) => (
                <option key={r.fileId} value={r.fileId}>{r.label}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setMpLoading(true);
                setMpMatches([]);
                readDriveFile<{ matches?: typeof mpMatches }>(selectedRound)
                  .then((d) => setMpMatches(d.matches || []))
                  .catch(() => {})
                  .finally(() => setMpLoading(false));
              }}
              disabled={mpLoading}
              className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 disabled:opacity-40 transition-colors"
              title="Tải lại"
            >
              ↻
            </button>
          </div>
          {/* Filter + Search */}
          <div className="p-2 space-y-1.5 border-b border-gray-800">
            <div className="flex gap-1">
              <button
                onClick={() => setMpFilter("pending")}
                className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${mpFilter === "pending" ? "bg-orange-700/60 text-orange-200" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}
              >
                Chưa đấu ({(mpMatches as any[]).filter((m) => (m.player1 ?? m.player1No) && (m.player2 ?? m.player2No) && !(m.winner ?? m.winnerNo)).length})
              </button>
              <button
                onClick={() => setMpFilter("all")}
                className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${mpFilter === "all" ? "bg-gray-600 text-white" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}
              >
                Tất cả ({(mpMatches as any[]).filter((m) => (m.player1 ?? m.player1No) && (m.player2 ?? m.player2No)).length})
              </button>
            </div>
            <input
              type="text"
              value={mpSearch}
              onChange={(e) => setMpSearch(e.target.value)}
              placeholder="Tìm tên, số cặp..."
              className="w-full text-xs px-2 py-1.5 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Match list */}
          <div className="overflow-y-auto flex-1 p-1.5 space-y-1">
            {mpLoading ? (
              <div className="text-gray-500 text-xs text-center py-6 animate-pulse">
                Đang tải...
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="text-gray-600 text-xs text-center py-6">
                Không có cặp nào
              </div>
            ) : (
              filteredMatches.map((m) => {
                const p1no = typeof m.player1 === "object" ? m.player1?.no : m.player1;
                const p2no = typeof m.player2 === "object" ? m.player2?.no : m.player2;
                const p1name = typeof m.player1 === "object" ? m.player1?.name : undefined;
                const p2name = typeof m.player2 === "object" ? m.player2?.name : undefined;
                const p1Data = allPlayers.find((p) => p.no === p1no);
                const p2Data = allPlayers.find((p) => p.no === p2no);
                const hasBoth = !!p1Data && !!p2Data;
                const isDone = !!(m.winner ?? m.winnerNo);
                return (
                  <button
                    key={m.matchNumber}
                    disabled={!hasBoth}
                    onClick={() => {
                      if (p1Data && p2Data) onLoadMatchup(p1Data, p2Data);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg border transition-all ${
                      isDone
                        ? "border-gray-700/50 bg-gray-900/30 opacity-60"
                        : hasBoth
                          ? "border-yellow-600/30 bg-gray-900/60 hover:bg-yellow-900/20 hover:border-yellow-500/60"
                          : "border-gray-800 bg-gray-900/20 opacity-40 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-600 text-[10px] shrink-0 w-5 text-right">
                        {m.matchNumber}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-blue-300 text-[11px] font-medium truncate">
                            {p1name ?? p1Data?.name ?? `#${p1no}`}
                          </span>
                          <span className="text-gray-600 text-[10px]">vs</span>
                          <span className="text-red-300 text-[11px] font-medium truncate">
                            {p2name ?? p2Data?.name ?? `#${p2no}`}
                          </span>
                        </div>
                      </div>
                      {isDone && (
                        <span className="text-green-600 text-[10px] shrink-0">✓</span>
                      )}
                      {!hasBoth && (
                        <span className="text-gray-600 text-[10px] shrink-0">N/A</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {devTab === "weights" && (
        <>
          {/* Effect rows */}
          <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">
            {Object.entries(defaultItems).map(([effectName, items]) => (
              <div key={effectName}>
                <div className="text-yellow-400/80 text-xs font-bold mb-1">
                  {effectName}
                </div>
                {items.map((item, i) => {
                  const currentWeight =
                    overrides[effectName]?.[i] !== undefined
                      ? overrides[effectName][i]
                      : item.weight;
                  const isOverridden = overrides[effectName]?.[i] !== undefined;
                  return (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <span
                        className={`flex-1 text-[11px] truncate ${isOverridden ? "text-yellow-200" : "text-gray-400"}`}
                        title={item.label}
                      >
                        {item.label.replace(/\s*\(\d+%\)/, "")}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={currentWeight}
                        onChange={(e) => {
                          const v = Math.max(
                            0,
                            Math.min(100, Number(e.target.value)),
                          );
                          onOverrideChange(effectName, i, v);
                        }}
                        className={`w-14 text-center text-xs rounded px-1 py-0.5 border ${
                          isOverridden
                            ? "bg-yellow-900/40 border-yellow-500/60 text-yellow-200"
                            : "bg-gray-800 border-gray-600 text-gray-300"
                        } focus:outline-none focus:border-yellow-400`}
                      />
                      <span className="text-gray-500 text-[10px]">%</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-yellow-500/30">
            <button
              onClick={onReset}
              className="w-full text-xs py-1 rounded bg-gray-800 hover:bg-yellow-800/40 border border-gray-600 hover:border-yellow-500/60 text-gray-400 hover:text-yellow-300 transition-colors"
            >
              Reset tất cả về mặc định
            </button>
          </div>
        </>
      )}
    </div>
  );
};
