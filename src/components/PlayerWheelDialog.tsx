import { useState, useMemo, useCallback } from "react";
import { WheelCanvas } from "./WheelCanvas";
import { WheelItem } from "../types";
import type { PlayerSummary } from "../types/player";

// ─── Types ──────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "alive" | "dead";

type HouseMode = "include" | "exclude";
type RaceMode = "include" | "exclude";

interface PlayerWheelDialogProps {
  players: PlayerSummary[];
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isPlayerDead(player: PlayerSummary): boolean {
  if (player.tournament?.status === "eliminated") return true;
  // Symbiosis: dead if host is dead (caller pre-filters, but guard here too)
  return false;
}

function getActiveHouses(player: PlayerSummary): string[] {
  return (player.houses ?? []).filter((h) => !h.isLost).map((h) => h.name);
}

// ─── Sub-component: Toggle Chip ───────────────────────────────────────────────

const Chip = ({
  label,
  active,
  onClick,
  color = "amber",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: "amber" | "purple" | "cyan" | "red" | "green";
}) => {
  const palette: Record<string, string> = {
    amber: active
      ? "bg-amber-600/40 border-amber-400/80 text-amber-200"
      : "bg-surface/40 border-outline-dim text-gray-400 hover:border-amber-500/40 hover:text-amber-300",
    purple: active
      ? "bg-purple-600/40 border-purple-400/80 text-purple-200"
      : "bg-surface/40 border-outline-dim text-gray-400 hover:border-purple-500/40 hover:text-purple-300",
    cyan: active
      ? "bg-cyan-600/40 border-cyan-400/80 text-cyan-200"
      : "bg-surface/40 border-outline-dim text-gray-400 hover:border-cyan-500/40 hover:text-cyan-300",
    red: active
      ? "bg-red-600/40 border-red-400/80 text-red-200"
      : "bg-surface/40 border-outline-dim text-gray-400 hover:border-red-500/40 hover:text-red-300",
    green: active
      ? "bg-green-600/40 border-green-400/80 text-green-200"
      : "bg-surface/40 border-outline-dim text-gray-400 hover:border-green-500/40 hover:text-green-300",
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 border rounded-sm text-xs font-mono tracking-wide transition-all ${palette[color]}`}
    >
      {label}
    </button>
  );
};

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export const PlayerWheelDialog = ({
  players,
  onClose,
}: PlayerWheelDialogProps) => {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("alive");

  // House filter
  const [houseMode, setHouseMode] = useState<HouseMode>("include");
  const [selectedHouses, setSelectedHouses] = useState<string[]>([]);

  // Race filter
  const [raceMode, setRaceMode] = useState<RaceMode>("include");
  const [selectedRaces, setSelectedRaces] = useState<string[]>([]);

  // Manual exclusions (player nos)
  const [excludedNos, setExcludedNos] = useState<Set<number>>(new Set());

  // Symbiosis filter (defaults to false)
  const [showSymbiosis, setShowSymbiosis] = useState(false);

  // Wheel spinning state
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerItem, setWinnerItem] = useState<WheelItem | null>(null);
  const [winnerPlayer, setWinnerPlayer] = useState<PlayerSummary | null>(null);

  // Collapse panels
  const [showHousePanel, setShowHousePanel] = useState(false);
  const [showRacePanel, setShowRacePanel] = useState(false);
  const [showExcludePanel, setShowExcludePanel] = useState(false);

  // ── Available options ─────────────────────────────────────────────────────

  const availableHouses = useMemo(() => {
    const set = new Set<string>();
    players.forEach((p) => getActiveHouses(p).forEach((h) => set.add(h)));
    return Array.from(set).sort();
  }, [players]);

  const availableRaces = useMemo(() => {
    const seen = new Map<string, string>();
    players.forEach((p) => {
      if (!p.race || p.race === "Unknown") return;
      const key = p.race.toLowerCase();
      if (!seen.has(key)) seen.set(key, p.race);
    });
    return Array.from(seen.values()).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    );
  }, [players]);

  // ── Computed pool ─────────────────────────────────────────────────────────

  const filteredPool = useMemo<PlayerSummary[]>(() => {
    let pool = players;

    // 1) Status filter
    if (statusFilter === "alive") {
      pool = pool.filter((p) => !isPlayerDead(p));
    } else if (statusFilter === "dead") {
      pool = pool.filter((p) => isPlayerDead(p));
    }

    // 2) House filter
    if (selectedHouses.length > 0) {
      pool = pool.filter((p) => {
        const houses = getActiveHouses(p);
        const hasMatch = selectedHouses.some((h) => houses.includes(h));
        return houseMode === "include" ? hasMatch : !hasMatch;
      });
    }

    // 3) Race filter
    if (selectedRaces.length > 0) {
      pool = pool.filter((p) => {
        const raceKey = (p.race ?? "").toLowerCase();
        const hasMatch = selectedRaces.some(
          (r) => r.toLowerCase() === raceKey,
        );
        return raceMode === "include" ? hasMatch : !hasMatch;
      });
    }

    // 4) Manual exclusions
    pool = pool.filter((p) => !excludedNos.has(p.no));

    // 5) Symbiosis filter
    if (!showSymbiosis) {
      pool = pool.filter((p) => !p.isSymbiosis);
    }

    return pool;
  }, [players, statusFilter, selectedHouses, houseMode, selectedRaces, raceMode, excludedNos, showSymbiosis]);

  // ── Wheel items derived from pool ─────────────────────────────────────────

  const wheelItems = useMemo<WheelItem[]>(() => {
    return filteredPool.map((p) => ({
      id: String(p.no),
      name: `${p.name}`,
      weight: 1,
    }));
  }, [filteredPool]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleHouse = useCallback((h: string) => {
    setSelectedHouses((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h],
    );
  }, []);

  const toggleRace = useCallback((r: string) => {
    setSelectedRaces((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  }, []);

  const toggleExclude = useCallback((no: number) => {
    setExcludedNos((prev) => {
      const next = new Set(prev);
      if (next.has(no)) next.delete(no);
      else next.add(no);
      return next;
    });
  }, []);

  const handleSpin = () => {
    if (isSpinning || wheelItems.length === 0) return;
    setWinnerItem(null);
    setWinnerPlayer(null);
    setIsSpinning(true);
  };

  const handleSpinComplete = (item: WheelItem) => {
    setIsSpinning(false);
    setWinnerItem(item);
    const player = players.find((p) => String(p.no) === item.id) ?? null;
    setWinnerPlayer(player);
  };

  const handleRemoveWinner = () => {
    if (winnerItem) {
      const no = parseInt(winnerItem.id, 10);
      setExcludedNos((prev) => new Set([...prev, no]));
      setWinnerItem(null);
      setWinnerPlayer(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9000]"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-6xl mx-4 rounded-sm border border-primary/30 shadow-panel-l1 overflow-hidden flex flex-col"
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1c1428 50%, #0e1a2e 100%)",
          maxHeight: "95vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎡</span>
            <h2 className="text-xl font-bold text-primary font-display tracking-widest uppercase">
              Player Wheel
            </h2>
            <span className="text-xs font-mono text-gray-400 ml-2">
              {wheelItems.length} players in pool
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row gap-0 min-h-0">
          {/* Left: Filters */}
          <div className="w-full lg:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-primary/20 p-4 space-y-4 overflow-y-auto">

            {/* ── Status Filter ── */}
            <div>
              <p className="text-xs font-display uppercase tracking-widest text-primary-dim mb-2">
                Trạng thái
              </p>
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    { val: "all", label: "Tất cả", color: "amber" },
                    { val: "alive", label: "Còn sống", color: "green" },
                    { val: "dead", label: "Đã chết", color: "red" },
                  ] as const
                ).map(({ val, label, color }) => (
                  <Chip
                    key={val}
                    label={label}
                    active={statusFilter === val}
                    onClick={() => setStatusFilter(val)}
                    color={color}
                  />
                ))}
              </div>
            </div>

            {/* ── Symbiosis Toggle ── */}
            <div>
              <p className="text-xs font-display uppercase tracking-widest text-primary-dim mb-2">
                Hỗ trợ
              </p>
              <Chip
                label={showSymbiosis ? "Bật Symbiosis" : "Tắt Symbiosis"}
                active={showSymbiosis}
                onClick={() => setShowSymbiosis(!showSymbiosis)}
                color="cyan"
              />
            </div>

            {/* ── House Filter ── */}
            <div>
              <button
                onClick={() => setShowHousePanel((v) => !v)}
                className="w-full flex items-center justify-between text-xs font-display uppercase tracking-widest text-purple-300 hover:text-purple-200 transition-colors mb-2"
              >
                <span>
                  ⊳ Nhà{" "}
                  {selectedHouses.length > 0 && (
                    <span className="ml-1 bg-purple-600/40 text-purple-200 px-1.5 rounded text-[10px]">
                      {selectedHouses.length}
                    </span>
                  )}
                </span>
                <span className="text-gray-500">{showHousePanel ? "▲" : "▼"}</span>
              </button>

              {showHousePanel && (
                <div className="space-y-2">
                  {/* Mode toggle */}
                  <div className="flex gap-2">
                    <Chip
                      label="Thuộc"
                      active={houseMode === "include"}
                      onClick={() => setHouseMode("include")}
                      color="purple"
                    />
                    <Chip
                      label="Không thuộc"
                      active={houseMode === "exclude"}
                      onClick={() => setHouseMode("exclude")}
                      color="red"
                    />
                  </div>
                  {/* House checkboxes */}
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {availableHouses.map((h) => (
                      <label
                        key={h}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer transition-colors text-sm ${
                          selectedHouses.includes(h)
                            ? "bg-purple-600/25 text-purple-200"
                            : "hover:bg-white/5 text-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedHouses.includes(h)}
                          onChange={() => toggleHouse(h)}
                          className="w-3.5 h-3.5 accent-purple-500"
                        />
                        <span className="flex-1">{h}</span>
                        <span className="text-xs text-gray-500">
                          {
                            players.filter((p) =>
                              getActiveHouses(p).includes(h),
                            ).length
                          }
                        </span>
                      </label>
                    ))}
                    {availableHouses.length === 0 && (
                      <p className="text-gray-500 text-xs italic px-2">
                        Không có nhà
                      </p>
                    )}
                  </div>
                  {selectedHouses.length > 0 && (
                    <button
                      onClick={() => setSelectedHouses([])}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Xoá bộ lọc nhà
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Race Filter ── */}
            <div>
              <button
                onClick={() => setShowRacePanel((v) => !v)}
                className="w-full flex items-center justify-between text-xs font-display uppercase tracking-widest text-cyan-300 hover:text-cyan-200 transition-colors mb-2"
              >
                <span>
                  ⟡ Chủng tộc{" "}
                  {selectedRaces.length > 0 && (
                    <span className="ml-1 bg-cyan-600/40 text-cyan-200 px-1.5 rounded text-[10px]">
                      {selectedRaces.length}
                    </span>
                  )}
                </span>
                <span className="text-gray-500">{showRacePanel ? "▲" : "▼"}</span>
              </button>

              {showRacePanel && (
                <div className="space-y-2">
                  {/* Mode toggle */}
                  <div className="flex gap-2">
                    <Chip
                      label="Thuộc"
                      active={raceMode === "include"}
                      onClick={() => setRaceMode("include")}
                      color="cyan"
                    />
                    <Chip
                      label="Không thuộc"
                      active={raceMode === "exclude"}
                      onClick={() => setRaceMode("exclude")}
                      color="red"
                    />
                  </div>
                  {/* Race checkboxes */}
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {availableRaces.map((r) => (
                      <label
                        key={r}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer transition-colors text-sm ${
                          selectedRaces.some(
                            (s) => s.toLowerCase() === r.toLowerCase(),
                          )
                            ? "bg-cyan-600/25 text-cyan-200"
                            : "hover:bg-white/5 text-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRaces.some(
                            (s) => s.toLowerCase() === r.toLowerCase(),
                          )}
                          onChange={() => toggleRace(r)}
                          className="w-3.5 h-3.5 accent-cyan-500"
                        />
                        <span className="flex-1">{r}</span>
                        <span className="text-xs text-gray-500">
                          {
                            players.filter(
                              (p) =>
                                (p.race ?? "").toLowerCase() ===
                                r.toLowerCase(),
                            ).length
                          }
                        </span>
                      </label>
                    ))}
                  </div>
                  {selectedRaces.length > 0 && (
                    <button
                      onClick={() => setSelectedRaces([])}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Xoá bộ lọc chủng tộc
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Exclusion List ── */}
            <div>
              <button
                onClick={() => setShowExcludePanel((v) => !v)}
                className="w-full flex items-center justify-between text-xs font-display uppercase tracking-widest text-red-300 hover:text-red-200 transition-colors mb-2"
              >
                <span>
                  ✕ Loại trừ{" "}
                  {excludedNos.size > 0 && (
                    <span className="ml-1 bg-red-600/40 text-red-200 px-1.5 rounded text-[10px]">
                      {excludedNos.size}
                    </span>
                  )}
                </span>
                <span className="text-gray-500">
                  {showExcludePanel ? "▲" : "▼"}
                </span>
              </button>

              {showExcludePanel && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 italic">
                    Chọn player để loại khỏi vòng quay:
                  </p>
                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                    {filteredPool.concat(
                      // Also show already-excluded players so they can be re-added
                      players.filter(
                        (p) =>
                          excludedNos.has(p.no) &&
                          !filteredPool.some((fp) => fp.no === p.no),
                      ),
                    ).sort((a, b) => a.no - b.no).map((p) => {
                      const excluded = excludedNos.has(p.no);
                      return (
                        <label
                          key={p.no}
                          className={`flex items-center gap-2 px-2 py-1 rounded-sm cursor-pointer transition-colors text-xs ${
                            excluded
                              ? "bg-red-900/30 text-red-300 line-through opacity-60"
                              : "hover:bg-white/5 text-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={excluded}
                            onChange={() => toggleExclude(p.no)}
                            className="w-3.5 h-3.5 accent-red-500"
                          />
                          <span className="text-gray-500 font-mono w-8 flex-shrink-0">
                            #{p.no}
                          </span>
                          <span className="flex-1 truncate">{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  {excludedNos.size > 0 && (
                    <button
                      onClick={() => setExcludedNos(new Set())}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Xoá tất cả loại trừ
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Pool Summary ── */}
            <div className="mt-4 pt-4 border-t border-primary/10">
              <p className="text-xs font-mono text-gray-500">
                Pool:{" "}
                <span className="text-primary font-bold">
                  {wheelItems.length}
                </span>{" "}
                players
              </p>
              {wheelItems.length === 0 && (
                <p className="text-xs text-red-400 mt-1">
                  ⚠ Không có player nào phù hợp
                </p>
              )}
            </div>
          </div>

          {/* Right: Wheel + Result */}
          <div className="flex-1 flex flex-col items-center justify-start p-4 gap-4 overflow-y-auto">
            {/* Wheel Canvas */}
            <div className="w-full max-w-lg">
              {wheelItems.length > 0 ? (
                <WheelCanvas
                  items={wheelItems}
                  isSpinning={isSpinning}
                  onSpinComplete={handleSpinComplete}
                  onSpin={handleSpin}
                  spinButtonClassName="w-20 h-20 text-lg"
                  maxFontSize={14}
                />
              ) : (
                <div className="flex items-center justify-center h-64 border border-dashed border-primary/20 rounded-sm">
                  <p className="text-gray-500 text-sm">
                    Không có player nào trong pool
                  </p>
                </div>
              )}
            </div>

            {/* Spin button (extra, below canvas) */}
            {wheelItems.length > 0 && (
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                className="px-10 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold font-display tracking-widest text-lg rounded-sm shadow-bloom transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed border border-amber-400/40"
              >
                {isSpinning ? "Đang quay..." : "🎡 QUAY!"}
              </button>
            )}

            {/* Winner Card */}
            {winnerItem && winnerPlayer && !isSpinning && (
              <div className="w-full max-w-md glass-l2 border border-amber-400/50 rounded-sm p-6 shadow-bloom text-center animate-[fade-in_0.4s_ease]">
                <p className="text-xs font-display uppercase tracking-widest text-amber-400 mb-3">
                  ✨ Kết quả ✨
                </p>
                <p className="text-3xl font-bold text-white font-lore drop-shadow-md mb-1">
                  {winnerPlayer.name}
                </p>
                <p className="text-sm text-gray-400 font-mono mb-1">
                  @{winnerPlayer.username} · No.{winnerPlayer.no}
                </p>
                <p className="text-xs text-amber-300/70 mb-4">
                  {winnerPlayer.race}
                  {winnerPlayer.subRace ? ` (${winnerPlayer.subRace})` : ""}
                </p>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleRemoveWinner}
                    className="px-4 py-2 bg-red-800/40 border border-red-500/50 hover:bg-red-700/50 text-red-300 text-sm font-display tracking-wide transition-all rounded-sm"
                  >
                    ✕ Loại khỏi pool
                  </button>
                  <button
                    onClick={() => {
                      setWinnerItem(null);
                      setWinnerPlayer(null);
                    }}
                    className="px-4 py-2 bg-surface/60 border border-outline-dim hover:bg-white/10 text-gray-300 text-sm font-display tracking-wide transition-all rounded-sm"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
