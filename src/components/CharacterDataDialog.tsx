import React from "react";
import { CharacterDataDialogProps } from "@/types/characterTypes";

export const CharacterDataDialog: React.FC<CharacterDataDialogProps> = ({
  showDialog,
  dialogData,
  onClose,
}) => {
  if (!showDialog) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-black/90 border-2 border-[#d4af37] p-6 rounded-lg w-3/4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-300">Character Data</h2>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-300 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="bg-gray-900 rounded p-4 max-h-[60vh] overflow-y-auto">
          <pre className="text-white text-sm whitespace-pre-wrap">
            {JSON.stringify(dialogData, null, 2)}
          </pre>
        </div>

        <div className="flex gap-4 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg hover:bg-gray-600 transition"
          >
            Close
          </button>

          <button
            onClick={() => {
              if (dialogData) {
                const dataStr = JSON.stringify(dialogData, null, 2);
                const blob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${dialogData.name || "character"}_data.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            }}
            className="px-4 py-2 bg-blue-700 border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg hover:bg-blue-600 transition"
          >
            Download JSON
          </button>
        </div>
      </div>
    </div>
  );
};
