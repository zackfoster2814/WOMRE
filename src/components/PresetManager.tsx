import { useState } from "react";
import { WheelPreset, WheelItem } from "../types";
import { PresetSettingsModal } from "./PresetSettingsModal";

interface PresetManagerProps {
  items: WheelItem[];
  customSfxUrl?: string;
  wheelName?: string;
  onLoadPreset: (preset: WheelPreset) => void;
  onItemsChange: (items: WheelItem[]) => void;
  isSpinning?: boolean;
}

export const PresetManager = ({
  items,
  customSfxUrl,
  wheelName,
  onLoadPreset,
  onItemsChange,
  isSpinning = false,
}: PresetManagerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        disabled={isSpinning}
      >
        Preset Settings
      </button>

      <PresetSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        items={items}
        customSfxUrl={customSfxUrl}
        wheelName={wheelName}
        onLoadPreset={onLoadPreset}
        onItemsChange={onItemsChange}
      />
    </>
  );
};
