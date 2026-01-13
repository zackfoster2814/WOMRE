import { useState } from "react";
import { SpinHistoryEntry } from "../types";
import { isTauri, getHistoryDir, openFolder } from "../utils/localStorage";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SpinHistoryEntry[];
  onClearHistory: () => void;
  onExportHistory: (filename?: string) => void;
}

export const HistoryModal = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onExportHistory,
}: HistoryModalProps) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFileName, setExportFileName] = useState("");

  if (!isOpen) return null;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleOpenHistoryFolder = async () => {
    try {
      const historyPath = await getHistoryDir();
      await openFolder(historyPath);
    } catch (error) {
      console.error("Failed to open history folder:", error);
      alert("Failed to open history folder. Please check the console for details.");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Spin History</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl leading-none"
              title="Close"
            >
              ×
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Total spins: {history.length}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No spin history yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Start spinning to see your history here!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...history].reverse().map((entry, index) => (
                <div
                  key={entry.id}
                  className="bg-gray-700 p-4 rounded-lg hover:bg-gray-650 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Index */}
                    <div className="text-gray-400 font-mono text-sm w-12 text-right">
                      #{history.length - index}
                    </div>

                    {/* Color */}
                    <div
                      className="w-6 h-6 rounded border-2 border-gray-500 flex-shrink-0"
                      style={{ backgroundColor: entry.itemColor || "#3b82f6" }}
                    />

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {entry.itemName}
                      </p>
                      {entry.wheelName && (
                        <p className="text-blue-400 text-xs truncate">
                          {entry.wheelName}
                        </p>
                      )}
                      <p className="text-gray-400 text-xs">
                        {formatTime(entry.timestamp)}
                      </p>
                    </div>

                    {/* Weight */}
                    <div className="text-right">
                      <p className="text-gray-300 text-sm">Weight</p>
                      <p className="text-white font-semibold">
                        {entry.itemWeight}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => {
                const defaultName = `wheel-history-${new Date().toISOString().split("T")[0]}`;
                setExportFileName(defaultName);
                setShowExportDialog(true);
              }}
              disabled={history.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium transition-colors"
            >
              Export CSV
            </button>
            {isTauri() && (
              <button
                onClick={handleOpenHistoryFolder}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-medium transition-colors"
              >
                Open Folder
              </button>
            )}
            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={history.length === 0}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium transition-colors"
            >
              Clear History
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Clear Dialog */}
      {showConfirmDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center"
          onClick={() => setShowConfirmDialog(false)}
        >
          <div
            className="bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-3">Confirm Clear History</h3>
            <p className="text-gray-300 mb-2">
              Are you sure you want to clear all spin history?
            </p>
            <p className="text-yellow-400 text-sm mb-6">
              This action cannot be undone. All {history.length} entries will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearHistory();
                  setShowConfirmDialog(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center"
          onClick={() => setShowExportDialog(false)}
        >
          <div
            className="bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-3">Export History</h3>
            <p className="text-gray-300 mb-4">Enter a name for the CSV file:</p>
            <input
              type="text"
              value={exportFileName}
              onChange={(e) => setExportFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && exportFileName.trim()) {
                  onExportHistory(exportFileName.trim());
                  setShowExportDialog(false);
                }
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              placeholder="wheel-history-2026-01-09"
              autoFocus
            />
            <p className="text-gray-400 text-xs mb-4">
              .csv extension will be added automatically
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExportDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (exportFileName.trim()) {
                    onExportHistory(exportFileName.trim());
                    setShowExportDialog(false);
                  }
                }}
                disabled={!exportFileName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium transition-colors"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
