/**
 * BattleWheelSpinner
 *
 * Vòng quay dùng chung cho combat: 2 ô (player1 vs player2) với weight tỷ lệ theo stat.
 * Dùng WheelCanvas — winner được trả về qua onSpinComplete.
 */

import { useState } from "react";
import { WheelCanvas } from "../WheelCanvas";
import type { WheelItem } from "../../types";

export interface BattleWheelSpinnerProps {
  p1Name: string;
  p2Name: string;
  /** Weight đã tính (có thể đã nhân x2 cho bên cao hơn) */
  p1Weight: number;
  p2Weight: number;
  statLabel: string;
  p1Val: number;
  p2Val: number;
  disabled?: boolean;
  onSpinComplete: (winner: "player1" | "player2") => void;
}

export function BattleWheelSpinner({
  p1Name,
  p2Name,
  p1Weight,
  p2Weight,
  statLabel,
  p1Val,
  p2Val,
  disabled = false,
  onSpinComplete,
}: BattleWheelSpinnerProps) {
  const [isSpinning, setIsSpinning] = useState(false);

  const total = p1Weight + p2Weight;
  const p1Pct = total > 0 ? (p1Weight / total) * 100 : 50;

  const items: WheelItem[] = [
    { id: "p1", name: p1Name, weight: p1Weight, color: "#3b82f6" },
    { id: "p2", name: p2Name, weight: p2Weight, color: "#ef4444" },
  ];

  const handleSpinComplete = (item: WheelItem) => {
    setIsSpinning(false);
    onSpinComplete(item.id === "p1" ? "player1" : "player2");
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-lg font-bold text-yellow-400">{statLabel} Round</div>

      {/* Stat values */}
      <div className="flex justify-center items-center gap-6">
        <div className="text-center">
          <div className="text-blue-400 text-xs truncate max-w-[110px]">{p1Name}</div>
          <div className="text-2xl font-bold text-blue-400">
            {p1Val}
            {p1Val > p2Val && (
              <span className="text-yellow-400 text-sm ml-1">×2={p1Val * 2}</span>
            )}
          </div>
          <div className="text-xs text-gray-400">({p1Pct.toFixed(1)}%)</div>
        </div>
        <div className="text-gray-500 text-sm">vs</div>
        <div className="text-center">
          <div className="text-red-400 text-xs truncate max-w-[110px]">{p2Name}</div>
          <div className="text-2xl font-bold text-red-400">
            {p2Val}
            {p2Val > p1Val && (
              <span className="text-yellow-400 text-sm ml-1">×2={p2Val * 2}</span>
            )}
          </div>
          <div className="text-xs text-gray-400">({(100 - p1Pct).toFixed(1)}%)</div>
        </div>
      </div>

      {/* Wheel canvas */}
      <div className="w-56 h-56">
        <WheelCanvas
          items={items}
          isSpinning={isSpinning}
          onSpinComplete={handleSpinComplete}
          onSpin={() => {
            if (!disabled && !isSpinning) setIsSpinning(true);
          }}
        />
      </div>
    </div>
  );
}
