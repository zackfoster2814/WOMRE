import { RemoveScroll } from "react-remove-scroll";
import { WheelItem } from "../types";

interface ResultDialogProps {
  item: WheelItem;
  itemColor: string;
  onClose: () => void;
  onRemove: () => void;
  onDisable: () => void;
}

export const ResultDialog = ({
  item,
  itemColor,
  onClose,
  onRemove,
  onDisable,
}: ResultDialogProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 border-2 border-yellow-500 animate-pulse-slow">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          🎉 Result
        </h2>

        <div className="bg-gray-700 p-6 rounded-lg mb-6">
          <div
            className="w-full h-6 rounded mb-4"
            style={{ backgroundColor: itemColor }}
          />
          <p className="text-3xl font-bold text-white text-center break-words">
            {item.name}
          </p>
          {item.effectDescription && (
            <RemoveScroll className="bg-gray-800 max-h-[8lh] whitespace-pre-line text-white overflow-y-auto py-4 my-2 break-words custom-scrollbar">
              {item.effectDescription}
            </RemoveScroll>
          )}
          <p className="text-sm text-gray-400 text-center mt-2">
            Weight: {item.weight}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onClose}
            className="col-span-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold transition-colors"
          >
            Close
          </button>
          <button
            onClick={onDisable}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-medium transition-colors"
          >
            ⊘ Disable
          </button>
          <button
            onClick={onRemove}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
          >
            🗑 Remove
          </button>
        </div>
      </div>
    </div>
  );
};
