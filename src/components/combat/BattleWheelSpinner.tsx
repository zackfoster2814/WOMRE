/**
 * BattleWheelSpinner
 *
 * Layout 3 cột: [Stats P1] | [Vòng quay] | [Stats P2]
 * Sau khi spin xong → hiện nút "Next" để resolve round.
 */

import { useState, type ReactNode } from "react";
import { WheelCanvas } from "../WheelCanvas";
// import { ProbabilityWheel3D } from "../three/ProbabilityWheel3D";
import type { WheelItem } from "../../types";
// ProbabilityWheel3D removed — WheelCanvas used instead (3D had rendering/overflow bugs)

const STAT_LABELS: { key: string; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "spd", label: "SPD" },
  { key: "dur", label: "DUR" },
  { key: "iq", label: "IQ" },
  { key: "biq", label: "BIQ" },
  { key: "ma", label: "MA" },
];

export interface BattleWheelSpinnerProps {
  p1Name: string;
  p2Name: string;
  /** Weight đã tính (có thể đã nhân x2 cho bên cao hơn) */
  p1Weight: number;
  p2Weight: number;
  statLabel: string;
  statKey: string;
  p1Val: number;
  p2Val: number;
  p1AllStats?: Record<string, number>;
  p2AllStats?: Record<string, number>;
  /** Spin buttons của round hiện tại (hiện SAU khi main wheel xác định winner) */
  p1SpinNodes?: ReactNode;
  /** Spin buttons của round hiện tại (hiện SAU khi main wheel xác định winner) */
  p2SpinNodes?: ReactNode;
  /** Block nút Next khi còn pending spins round này chưa quay */
  hasCurrentPendingSpins?: boolean;
  disabled?: boolean;
  /** Gọi ngay khi main wheel xác định winner (trước khi user click Next) */
  onWinnerDetermined?: (winner: "player1" | "player2") => void;
  onSpinComplete: (winner: "player1" | "player2") => void;
}

export function BattleWheelSpinner({
  p1Name,
  p2Name,
  p1Weight,
  p2Weight,
  statLabel,
  statKey,
  p1Val,
  p2Val,
  p1AllStats,
  p2AllStats,
  p1SpinNodes,
  p2SpinNodes,
  hasCurrentPendingSpins = false,
  disabled = false,
  onWinnerDetermined,
  onSpinComplete,
}: BattleWheelSpinnerProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<"player1" | "player2" | null>(null);

  // ── Debug weight override ────────────────────────────────────────────────
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugP1Input, setDebugP1Input] = useState("");
  const [debugP2Input, setDebugP2Input] = useState("");
  const [overrideP1, setOverrideP1] = useState<number | null>(null);
  const [overrideP2, setOverrideP2] = useState<number | null>(null);

  const effectiveP1Val = overrideP1 ?? p1Val;
  const effectiveP2Val = overrideP2 ?? p2Val;
  const effectiveP1W = effectiveP1Val > effectiveP2Val ? effectiveP1Val * 2 : effectiveP1Val;
  const effectiveP2W = effectiveP2Val > effectiveP1Val ? effectiveP2Val * 2 : effectiveP2Val;

  const effectiveTotal = effectiveP1W + effectiveP2W;
  const effectiveP1Pct = effectiveTotal > 0 ? (effectiveP1W / effectiveTotal) * 100 : 50;

  const hasOverride = overrideP1 !== null || overrideP2 !== null;

  const handleDebugOpen = () => {
    setDebugP1Input(String(p1Val));
    setDebugP2Input(String(p2Val));
    setDebugOpen(true);
  };

  const handleDebugApply = () => {
    const v1 = parseFloat(debugP1Input);
    const v2 = parseFloat(debugP2Input);
    if (!isNaN(v1)) setOverrideP1(v1);
    if (!isNaN(v2)) setOverrideP2(v2);
    setDebugOpen(false);
  };

  const handleDebugReset = () => {
    setOverrideP1(null);
    setOverrideP2(null);
    setDebugOpen(false);
  };

  // ── Wheel ────────────────────────────────────────────────────────────────
  const total = p1Weight + p2Weight;
  void total;

  // Nếu cả 2 weight = 0 (stat bằng 0) → dùng 50/50
  const safeP1W = effectiveP1W === 0 && effectiveP2W === 0 ? 1 : effectiveP1W;
  const safeP2W = effectiveP1W === 0 && effectiveP2W === 0 ? 1 : effectiveP2W;

  const items: WheelItem[] = [
    { id: "p1", name: p1Name, weight: safeP1W, color: "#3b82f6" },
    { id: "p2", name: p2Name, weight: safeP2W, color: "#ef4444" },
  ];

  const handleSpinComplete = (item: WheelItem) => {
    setIsSpinning(false);
    const winner = item.id === "p1" ? "player1" : "player2";
    setSpinResult(winner);
    onWinnerDetermined?.(winner);
  };

  const handleNext = () => {
    if (!spinResult) return;
    onSpinComplete(spinResult);
    setSpinResult(null);
  };

  return (
    <div className="flex flex-col items-center gap-2 relative">
      {/* Round label + debug button */}
      <div className="w-full flex items-center justify-center relative">
        <div className="text-base font-black text-yellow-400 tracking-widest uppercase">
          {statLabel} Round
        </div>
        {/* Debug button — top-right */}
        <button
          onClick={debugOpen ? () => setDebugOpen(false) : handleDebugOpen}
          title="Debug: chỉnh trọng số vòng quay"
          className={`absolute right-0 text-[11px] px-1.5 py-0.5 rounded border transition-colors ${
            hasOverride
              ? "bg-orange-700/60 text-orange-300 border-orange-500/60 hover:bg-orange-600/60"
              : debugOpen
              ? "bg-gray-700/80 text-gray-300 border-gray-500/60"
              : "bg-gray-800/60 text-gray-500 border-gray-700/40 hover:text-gray-300 hover:border-gray-600/60"
          }`}
        >
          ⚙{hasOverride ? " ✦" : ""}
        </button>
      </div>

      {/* Debug panel */}
      {debugOpen && (
        <div className="w-full bg-gray-900/95 border border-yellow-600/40 rounded px-3 py-2 flex flex-col gap-2">
          <div className="text-[10px] text-yellow-500/80 font-bold tracking-widest uppercase mb-0.5">
            Debug — Override trọng số
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-blue-400 font-bold">{p1Name}</label>
              <input
                type="number"
                value={debugP1Input}
                onChange={(e) => setDebugP1Input(e.target.value)}
                className="w-full px-2 py-1 bg-gray-800 border border-blue-700/50 rounded text-blue-200 text-xs text-center"
                placeholder={String(p1Val)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-red-400 font-bold">{p2Name}</label>
              <input
                type="number"
                value={debugP2Input}
                onChange={(e) => setDebugP2Input(e.target.value)}
                className="w-full px-2 py-1 bg-gray-800 border border-red-700/50 rounded text-red-200 text-xs text-center"
                placeholder={String(p2Val)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDebugApply}
              className="flex-1 px-2 py-1 bg-yellow-700/60 hover:bg-yellow-600/60 text-yellow-200 rounded text-[11px] font-bold border border-yellow-600/40 transition-colors"
            >
              Áp dụng
            </button>
            <button
              onClick={handleDebugReset}
              className="flex-1 px-2 py-1 bg-gray-700/60 hover:bg-gray-600/60 text-gray-300 rounded text-[11px] border border-gray-600/40 transition-colors"
            >
              Reset gốc
            </button>
          </div>
        </div>
      )}

      {/* 3-column layout */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 w-full items-center">
        {/* P1 stats */}
        <div className={`rounded-none border p-2 flex flex-col gap-0.5 ${hasOverride ? "border-blue-400/40 bg-blue-950/40" : "border-blue-500/20 bg-blue-950/30"}`}>
          <div className="text-blue-400 text-xs font-bold truncate mb-1 text-center">
            {p1Name}
          </div>
          {STAT_LABELS.map(({ key, label }) => {
            const val = key === statKey ? effectiveP1Val : (p1AllStats?.[key] ?? null);
            const isCurrent = key === statKey;
            const isOverridden = isCurrent && overrideP1 !== null;
            return (
              <div
                key={key}
                className={`flex justify-between items-center px-1.5 py-0.5 rounded text-xs ${
                  isCurrent
                    ? "bg-blue-500/20 border border-blue-500/40 font-black text-blue-200"
                    : "text-gray-500"
                }`}
              >
                <span className={isCurrent ? "text-yellow-400" : ""}>{label}</span>
                <span className={isCurrent ? "text-white text-sm" : ""}>
                  {isOverridden ? (
                    <span className="text-orange-300">{val}</span>
                  ) : (val ?? "—")}
                  {isCurrent && effectiveP1Val > effectiveP2Val && (
                    <span className="text-yellow-400 text-[10px] ml-0.5">×2</span>
                  )}
                </span>
              </div>
            );
          })}
          <div className="text-center text-[11px] font-bold text-blue-400 mt-1">
            {effectiveP1Pct.toFixed(1)}%
          </div>
          {spinResult && p1SpinNodes && (
            <div className="flex flex-wrap justify-center gap-1 mt-1 pt-1 border-t border-blue-500/20">
              {p1SpinNodes}
            </div>
          )}
        </div>

        {/* Wheel */}
        <div
          className="flex flex-col items-center gap-1 relative z-10"
          style={{ width: 240 }}
        >
          <div
            className="cursor-pointer hover:scale-105 transition-transform"
            style={{ width: 260, height: 260 }}
          >
            <WheelCanvas
              items={items}
              isSpinning={isSpinning}
              onSpinComplete={handleSpinComplete}
              onSpin={() => {
                if (!disabled && !isSpinning && !spinResult)
                  setIsSpinning(true);
              }}
              spinButtonClassName="w-12 h-12 text-xs"
            />
          </div>

          {/* Result + Next button */}
          {spinResult ? (
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`text-sm font-black px-3 py-1 rounded-none border ${
                  spinResult === "player1"
                    ? "text-blue-300 bg-blue-500/20 border-blue-500/40"
                    : "text-red-300 bg-red-500/20 border-red-500/40"
                }`}
              >
                {spinResult === "player1" ? p1Name : p2Name} thắng!
              </div>
              <button
                onClick={handleNext}
                disabled={hasCurrentPendingSpins}
                title={hasCurrentPendingSpins ? "Còn hiệu ứng round này chưa quay" : undefined}
                className={`px-5 py-1.5 rounded-none font-black text-sm transition-all shadow-lg ${
                  hasCurrentPendingSpins
                    ? "bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/40"
                    : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white hover:scale-105"
                }`}
              >
                {hasCurrentPendingSpins ? "Quay hiệu ứng round này trước..." : "Next →"}
              </button>
            </div>
          ) : !isSpinning ? (
            <div className="text-[10px] text-gray-600 italic">Nhấn SPIN để quay</div>
          ) : null}
        </div>

        {/* P2 stats */}
        <div className={`rounded-none border p-2 flex flex-col gap-0.5 ${hasOverride ? "border-red-400/40 bg-red-950/40" : "border-red-500/20 bg-red-950/30"}`}>
          <div className="text-red-400 text-xs font-bold truncate mb-1 text-center">
            {p2Name}
          </div>
          {STAT_LABELS.map(({ key, label }) => {
            const val = key === statKey ? effectiveP2Val : (p2AllStats?.[key] ?? null);
            const isCurrent = key === statKey;
            const isOverridden = isCurrent && overrideP2 !== null;
            return (
              <div
                key={key}
                className={`flex justify-between items-center px-1.5 py-0.5 rounded text-xs ${
                  isCurrent
                    ? "bg-red-500/20 border border-red-500/40 font-black text-red-200"
                    : "text-gray-500"
                }`}
              >
                <span className={isCurrent ? "text-yellow-400" : ""}>{label}</span>
                <span className={isCurrent ? "text-white text-sm" : ""}>
                  {isOverridden ? (
                    <span className="text-orange-300">{val}</span>
                  ) : (val ?? "—")}
                  {isCurrent && effectiveP2Val > effectiveP1Val && (
                    <span className="text-yellow-400 text-[10px] ml-0.5">×2</span>
                  )}
                </span>
              </div>
            );
          })}
          <div className="text-center text-[11px] font-bold text-red-400 mt-1">
            {(100 - effectiveP1Pct).toFixed(1)}%
          </div>
          {spinResult && p2SpinNodes && (
            <div className="flex flex-wrap justify-center gap-1 mt-1 pt-1 border-t border-red-500/20">
              {p2SpinNodes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
