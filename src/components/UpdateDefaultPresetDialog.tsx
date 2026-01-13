import { useState } from "react";
import { WheelItem } from "../types";

interface UpdateDefaultPresetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: WheelItem[];
  onConfirm: () => Promise<void>;
}

export const UpdateDefaultPresetDialog = ({
  isOpen,
  onClose,
  items,
  onConfirm,
}: UpdateDefaultPresetDialogProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleConfirm = async () => {
    setIsUpdating(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Failed to update default preset:", error);
      alert("Failed to update default preset: " + (error as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  const disabledCount = items.filter((item) => item.disabled).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 border-2 border-yellow-500">
        <h2 className="text-2xl font-bold text-white mb-4">
          ⚠️ Update Default Preset?
        </h2>

        <div className="bg-gray-700 p-4 rounded-lg mb-6">
          <p className="text-gray-300 mb-3">
            This will <span className="text-yellow-400 font-bold">permanently update</span> the default preset file with current item states:
          </p>
          <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
            <li>Total items: <span className="text-white font-semibold">{items.length}</span></li>
            <li>Disabled items: <span className="text-orange-400 font-semibold">{disabledCount}</span></li>
            <li>Active items: <span className="text-green-400 font-semibold">{items.length - disabledCount}</span></li>
          </ul>

          {disabledCount > 0 && (
            <div className="mt-3 p-2 bg-orange-900/30 border border-orange-500 rounded">
              <p className="text-orange-300 text-xs">
                📌 Disabled items will remain hidden when loading this preset next time.
              </p>
            </div>
          )}
        </div>

        <div className="bg-red-900/30 border border-red-500 rounded p-3 mb-4">
          <p className="text-red-300 text-sm">
            <span className="font-bold">⚠️ Warning:</span> This action will overwrite the default preset file. Make sure you have a backup if needed.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isUpdating}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? "Updating..." : "Update Preset"}
          </button>
        </div>
      </div>
    </div>
  );
};
