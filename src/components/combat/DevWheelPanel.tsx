import { useState, useEffect, useRef } from "react";
import { getAssetPath } from "../../utils/basePath";
import { PvPPlayerData } from "../../types/battleZone";

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

  useEffect(() => {
    fetch(getAssetPath("/data/Round256.json"))
      .then((r) => r.json())
      .then((d) => setMpMatches(d.matches || []))
      .catch(() => {});
  }, []);

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

  const filteredMatches = mpMatches.filter((m) => {
    if (!m.player1 || !m.player2) return false;
    if (mpFilter === "pending" && m.winner) return false;
    if (mpSearch.trim()) {
      const q = mpSearch.toLowerCase();
      return (
        m.player1.name.toLowerCase().includes(q) ||
        m.player2.name.toLowerCase().includes(q) ||
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
          {/* Filter + Search */}
          <div className="p-2 space-y-1.5 border-b border-gray-800">
            <div className="flex gap-1">
              <button
                onClick={() => setMpFilter("pending")}
                className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${mpFilter === "pending" ? "bg-orange-700/60 text-orange-200" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}
              >
                Chưa đấu (
                {
                  mpMatches.filter((m) => m.player1 && m.player2 && !m.winner)
                    .length
                }
                )
              </button>
              <button
                onClick={() => setMpFilter("all")}
                className={`flex-1 py-1 text-xs rounded font-medium transition-colors ${mpFilter === "all" ? "bg-gray-600 text-white" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}
              >
                Tất cả ({mpMatches.filter((m) => m.player1 && m.player2).length}
                )
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
            {mpMatches.length === 0 ? (
              <div className="text-gray-500 text-xs text-center py-6">
                Đang tải...
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="text-gray-600 text-xs text-center py-6">
                Không có cặp nào
              </div>
            ) : (
              filteredMatches.map((m) => {
                const p1Data = allPlayers.find((p) => p.no === m.player1!.no);
                const p2Data = allPlayers.find((p) => p.no === m.player2!.no);
                const hasBoth = !!p1Data && !!p2Data;
                const isDone = !!m.winner;
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
                            {m.player1!.name}
                          </span>
                          <span className="text-gray-600 text-[10px]">vs</span>
                          <span className="text-red-300 text-[11px] font-medium truncate">
                            {m.player2!.name}
                          </span>
                        </div>
                      </div>
                      {isDone && (
                        <span className="text-green-600 text-[10px] shrink-0">
                          ✓
                        </span>
                      )}
                      {!hasBoth && (
                        <span className="text-gray-600 text-[10px] shrink-0">
                          N/A
                        </span>
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
