/**
 * BattleWheelSpinner
 *
 * Layout 3 cột: [Stats P1] | [Vòng quay] | [Stats P2]
 * Sau khi spin xong → hiện nút "Next" để resolve round.
 */

import { useState, type ReactNode } from "react";
import { WheelCanvas } from "../WheelCanvas";
import type { WheelItem } from "../../types";

const STAT_LABELS: { key: string; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "spd", label: "SPD" },
  { key: "dur", label: "DUR" },
  { key: "iq",  label: "IQ"  },
  { key: "biq", label: "BIQ" },
  { key: "ma",  label: "MA"  },
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
  /** Spin buttons của round vừa resolve (hiện bên dưới stats P1) */
  p1SpinNodes?: ReactNode;
  /** Spin buttons của round vừa resolve (hiện bên dưới stats P2) */
  p2SpinNodes?: ReactNode;
  /** Block nút Next khi còn pending spins từ round trước */
  hasPendingSpins?: boolean;
  disabled?: boolean;
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
  hasPendingSpins = false,
  disabled = false,
  onSpinComplete,
}: BattleWheelSpinnerProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<"player1" | "player2" | null>(null);

  const total = p1Weight + p2Weight;
  const p1Pct = total > 0 ? (p1Weight / total) * 100 : 50;

  const items: WheelItem[] = [
    { id: "p1", name: p1Name, weight: p1Weight, color: "#3b82f6" },
    { id: "p2", name: p2Name, weight: p2Weight, color: "#ef4444" },
  ];

  const handleSpinComplete = (item: WheelItem) => {
    setIsSpinning(false);
    setSpinResult(item.id === "p1" ? "player1" : "player2");
  };

  const handleNext = () => {
    if (!spinResult) return;
    onSpinComplete(spinResult);
    setSpinResult(null);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Round label */}
      <div className="text-base font-black text-yellow-400 tracking-widest uppercase">
        {statLabel} Round
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 w-full items-center">
        {/* P1 stats */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-950/30 p-2 flex flex-col gap-0.5">
          <div className="text-blue-400 text-xs font-bold truncate mb-1 text-center">{p1Name}</div>
          {STAT_LABELS.map(({ key, label }) => {
            const val = p1AllStats?.[key] ?? (key === statKey ? p1Val : null);
            const isCurrent = key === statKey;
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
                  {val ?? "—"}
                  {isCurrent && p1Val > p2Val && (
                    <span className="text-yellow-400 text-[10px] ml-0.5">×2</span>
                  )}
                </span>
              </div>
            );
          })}
          <div className="text-center text-[11px] font-bold text-blue-400 mt-1">
            {p1Pct.toFixed(1)}%
          </div>
          {p1SpinNodes && (
            <div className="flex flex-wrap justify-center gap-1 mt-1 pt-1 border-t border-blue-500/20">
              {p1SpinNodes}
            </div>
          )}
        </div>

        {/* Wheel */}
        <div className="flex flex-col items-center gap-1" style={{ width: 260 }}>
          <div className="w-full">
            <WheelCanvas
              items={items}
              isSpinning={isSpinning}
              onSpinComplete={handleSpinComplete}
              spinButtonClassName="w-16 h-16 text-sm font-black"
              onSpin={() => {
                if (!disabled && !isSpinning && !spinResult) setIsSpinning(true);
              }}
            />
          </div>

          {/* Result + Next button */}
          {spinResult ? (
            <div className="flex flex-col items-center gap-1.5 mt-1">
              <div
                className={`text-sm font-black px-3 py-1 rounded-lg border ${
                  spinResult === "player1"
                    ? "text-blue-300 bg-blue-500/20 border-blue-500/40"
                    : "text-red-300 bg-red-500/20 border-red-500/40"
                }`}
              >
                {spinResult === "player1" ? p1Name : p2Name} thắng!
              </div>
              <button
                onClick={handleNext}
                disabled={hasPendingSpins}
                title={hasPendingSpins ? "Còn hiệu ứng chưa quay từ round trước" : undefined}
                className={`px-5 py-1.5 rounded-lg font-black text-sm transition-all shadow-lg ${
                  hasPendingSpins
                    ? "bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/40"
                    : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white hover:scale-105"
                }`}
              >
                {hasPendingSpins ? "Quay hiệu ứng trước..." : "Next →"}
              </button>
            </div>
          ) : !isSpinning ? (
            <div className="text-[10px] text-gray-600 italic">Nhấn SPIN để quay</div>
          ) : null}
        </div>

        {/* P2 stats */}
        <div className="rounded-xl border border-red-500/20 bg-red-950/30 p-2 flex flex-col gap-0.5">
          <div className="text-red-400 text-xs font-bold truncate mb-1 text-center">{p2Name}</div>
          {STAT_LABELS.map(({ key, label }) => {
            const val = p2AllStats?.[key] ?? (key === statKey ? p2Val : null);
            const isCurrent = key === statKey;
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
                  {val ?? "—"}
                  {isCurrent && p2Val > p1Val && (
                    <span className="text-yellow-400 text-[10px] ml-0.5">×2</span>
                  )}
                </span>
              </div>
            );
          })}
          <div className="text-center text-[11px] font-bold text-red-400 mt-1">
            {(100 - p1Pct).toFixed(1)}%
          </div>
          {p2SpinNodes && (
            <div className="flex flex-wrap justify-center gap-1 mt-1 pt-1 border-t border-red-500/20">
              {p2SpinNodes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
