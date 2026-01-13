import { useState, useEffect } from "react";
import { fetchDefaultPresets, DefaultPreset } from "../data/defaultPresets";
import { WheelPreset, WheelItem } from "../types";
import { UpdateDefaultPresetDialog } from "./UpdateDefaultPresetDialog";

interface QuickPresetSelectorProps {
  onLoadPreset: (preset: WheelPreset) => void;
  isSpinning: boolean;
  items: WheelItem[];
}

export const QuickPresetSelector = ({
  onLoadPreset,
  isSpinning,
  items,
}: QuickPresetSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultPresets, setDefaultPresets] = useState<DefaultPreset[]>([]);
  const [updateDefaultDialog, setUpdateDefaultDialog] = useState(false);

  useEffect(() => {
    const loadPresets = async () => {
      const presets = await fetchDefaultPresets();
      setDefaultPresets(presets);
    };
    loadPresets();
  }, []);

  const handleSelectPreset = (preset: DefaultPreset) => {
    const updatedItems: WheelItem[] = preset.items.map((item) => ({
      id: crypto.randomUUID(),
      name: item.name,
      weight: item.weight,
      color: item.color,
      customSound: item.customSound,
      customSoundName: item.customSoundName,
      disabled: item.disabled,
    }));

    const wheelPreset: WheelPreset = {
      id: crypto.randomUUID(),
      name: preset.name,
      items: updatedItems,
      wheelName: preset.wheelName,
      customSfxUrl: preset.customSfxUrl,
    };

    onLoadPreset(wheelPreset);
    setIsOpen(false);
  };

  const handleUpdateDefaultPreset = async () => {
    // Create updated default presets JSON
    const updatedDefaultPresets = [
      {
        id: "race",
        name: "Race Preset",
        description: "Race Wheel (23 races)",
        wheelName: "Race",
        items: items.map(item => ({
          name: item.name,
          weight: item.weight,
          ...(item.color && { color: item.color }),
          ...(item.disabled && { disabled: item.disabled }),
        })),
      },
    ];

    // Create JSON content
    const jsonContent = JSON.stringify(updatedDefaultPresets, null, 2);

    // Download as file
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "default-presets.json";
    link.click();
    URL.revokeObjectURL(url);

    alert("✅ Default preset file downloaded!\n\nReplace the file at:\npublic/data/default-presets.json");
  };

  return (
    <>
      {/* Float Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {isOpen ? (
          /* Expanded Menu */
          <div className="bg-gray-800 rounded-lg shadow-2xl w-80 max-h-[70vh] flex flex-col border border-gray-700">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">Quick Presets</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Preset List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {defaultPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  disabled={isSpinning}
                  className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-semibold text-white text-sm mb-1">
                    {preset.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer - Update Button */}
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={() => setUpdateDefaultDialog(true)}
                disabled={isSpinning}
                className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📥 Update Default Preset
              </button>
            </div>
          </div>
        ) : (
          /* Minimized Button */
          <button
            onClick={() => setIsOpen(true)}
            disabled={isSpinning}
            className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="Quick Presets"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Update Default Preset Dialog */}
      <UpdateDefaultPresetDialog
        isOpen={updateDefaultDialog}
        onClose={() => setUpdateDefaultDialog(false)}
        items={items}
        onConfirm={handleUpdateDefaultPreset}
      />
    </>
  );
};
