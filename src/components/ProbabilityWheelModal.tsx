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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-surface/80 animate-fade-in">
      <div className="bg-slate-800/95 p-8 rounded-[24px] shadow-panel-l1 border border-primary/30 bevel-gold relative overflow-hidden w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="font-display text-3xl font-bold text-primary tracking-widest drop-shadow-md">{title}</h2>
          <button
            onClick={handleClose}
            disabled={isSpinning}
            className="text-gray-400 hover:text-primary disabled:opacity-30 transition-colors text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body: description trên, wheel dưới */}
        <div className="flex flex-col gap-6 mb-8 relative z-10">
          {description && (
            <p className="font-lore text-gray-300 text-base leading-relaxed text-center italic">{description}</p>
          )}

          {/* Wheel */}
          <div className="w-80 h-80 mx-auto">
            <WheelCanvas
              items={wheelItems}
              isSpinning={isSpinning}
              onSpinComplete={handleSpinComplete}
              spinButtonClassName="hidden"
              maxFontSize={26}
            />
          </div>

          {/* Result */}
          {result && (
            <div
              className={`p-4 rounded-xl text-center shadow-md animate-slide-in ${
                result.isSuccess
                  ? "bg-green-900/40 border-2 border-green-500/60 rune-glow"
                  : "bg-red-950/60 border-2 border-red-500/60 rune-glow-red"
              }`}
            >
              <div className="text-xs text-primary-dim mb-2 font-display tracking-widest uppercase">Outcome</div>
              <div className="text-2xl font-bold text-white font-lore drop-shadow-md">{result.label}</div>
              {result.description && (
                <div className="text-sm text-gray-300 mt-2 leading-relaxed font-sans">{result.description}</div>
              )}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center relative z-10">
          {!result ? (
            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className="px-8 py-3 btn-primary disabled:opacity-50 tracking-wider text-sm font-display uppercase"
            >
              {isSpinning ? "Commencing..." : "🎡 Spin"}
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              className="px-8 py-3 btn-primary tracking-wider text-sm font-display uppercase"
            >
              ✓ Confirm Void
            </button>
          )}
          <button
            onClick={handleClose}
            disabled={isSpinning}
            className="px-8 py-3 btn-secondary disabled:opacity-30 tracking-wider text-sm"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
