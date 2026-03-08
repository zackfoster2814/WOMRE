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
  description?: string; // Mô tả của item (hiển thị sau khi quay ra)
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
      <div className="bg-gray-900 border-2 border-purple-500/50 rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl">
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

        {/* Body: description bên trái, wheel bên phải */}
        <div className="flex gap-6 items-start mb-4">
          {/* Left: description + item list + result */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {description && (
              <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
            )}
            {result && (
              <div
                className={`p-3 rounded-lg ${
                  result.isSuccess
                    ? "bg-green-700/20 border border-green-500/60"
                    : "bg-red-700/20 border border-red-500/60"
                }`}
              >
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Kết quả</div>
                <div className="text-base font-bold text-white">{result.label}</div>
                {result.description && (
                  <div className="text-xs text-gray-300 mt-1 leading-relaxed">{result.description}</div>
                )}
              </div>
            )}
          </div>

          {/* Right: wheel */}
          <div className="shrink-0">
            <div className="w-64 h-64">
              <WheelCanvas
                items={wheelItems}
                isSpinning={isSpinning}
                onSpinComplete={handleSpinComplete}
                spinButtonClassName="hidden"
              />
            </div>
          </div>
        </div>

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
