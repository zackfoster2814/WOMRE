/**
 * ProbabilityWheelModal
 *
 * Modal hiển thị vòng quay xác suất cho các combat effects.
 * Nhận vào danh sách items (label + weight), spin, trả về item thắng.
 */

import { useState } from "react";
import { WheelCanvas } from "./WheelCanvas";
import type { WheelItem } from "../types";

export interface WheelSpinItem {
  label: string;
  weight: number; // Tương ứng với xác suất (weight / totalWeight)
  color?: string;
  isSuccess?: boolean; // Đánh dấu outcome "thành công"
  /** Arbitrary metadata for custom effects (e.g. Dothraki ruleIndex) */
  meta?: Record<string, unknown>;
}

interface ProbabilityWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  items: WheelSpinItem[];
  onResult: (item: WheelSpinItem) => void;
}

export const ProbabilityWheelModal = ({
  isOpen,
  onClose,
  title,
  description,
  items,
  onResult,
}: ProbabilityWheelModalProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<WheelSpinItem | null>(null);

  if (!isOpen) return null;

  const wheelItems: WheelItem[] = items.map((item, idx) => ({
    id: `item-${idx}`,
    name: item.label,
    weight: item.weight,
    color: item.color,
  }));

  const handleSpin = () => {
    if (isSpinning || result) return;
    setIsSpinning(true);
  };

  const handleSpinComplete = (winnerItem: WheelItem) => {
    setIsSpinning(false);
    const matched = items.find((i) => i.label === winnerItem.name);
    if (matched) {
      setResult(matched);
    }
  };

  const handleConfirm = () => {
    if (result) {
      onResult(result);
    }
    setResult(null);
    onClose();
  };

  const handleClose = () => {
    if (isSpinning) return;
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border-2 border-purple-500/50 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-purple-300">{title}</h2>
          <button
            onClick={handleClose}
            disabled={isSpinning}
            className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {description && (
          <p className="text-gray-400 text-sm mb-4">{description}</p>
        )}

        {/* Probability display */}
        {/* <div className="flex flex-wrap gap-2 mb-4 justify-center">
          {items.map((item, idx) => {
            const totalWeight = items.reduce((s, i) => s + i.weight, 0);
            const pct = Math.round((item.weight / totalWeight) * 100);
            return (
              <span
                key={idx}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  item.isSuccess
                    ? "bg-green-700/60 text-green-300"
                    : "bg-gray-700/60 text-gray-300"
                }`}
              >
                {item.label}: {pct}%
              </span>
            );
          })}
        </div> */}

        {/* Wheel */}
        <div className="flex justify-center mb-4">
          <div className="w-64 h-64">
            <WheelCanvas
              items={wheelItems}
              isSpinning={isSpinning}
              onSpinComplete={handleSpinComplete}
              spinButtonClassName="hidden"
            />
          </div>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`text-center mb-4 p-3 rounded-lg ${
              result.isSuccess
                ? "bg-green-700/30 border border-green-500"
                : "bg-red-700/30 border border-red-500"
            }`}
          >
            <div className="text-lg font-bold text-white">{result.label}</div>
            {/* {result.isSuccess ? (
              <div className="text-green-400 text-sm">✓ Hiệu ứng kích hoạt!</div>
            ) : (
              <div className="text-red-400 text-sm">✗ Không có gì xảy ra</div>
            )} */}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 justify-center">
          {!result ? (
            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-white font-bold transition-all"
            >
              {isSpinning ? "Đang quay..." : "🎡 Quay"}
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold transition-all"
            >
              ✓ Xác nhận
            </button>
          )}
          <button
            onClick={handleClose}
            disabled={isSpinning}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 rounded-lg text-white font-medium transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
