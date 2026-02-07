import { useEffect } from "react";

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  folderPath?: string;
  onOpenFolder?: () => void;
}

export const SuccessDialog = ({
  isOpen,
  onClose,
  title,
  message,
  folderPath,
  onOpenFolder,
}: SuccessDialogProps) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-[2001] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-green-600 px-6 py-4 rounded-t-lg flex items-center gap-3">
          <span className="text-3xl">✓</span>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-200 text-base mb-4 whitespace-pre-wrap">
            {message}
          </p>

          {folderPath && (
            <div className="bg-gray-700 p-3 rounded mb-4">
              <div className="text-xs text-gray-400 mb-1">Location:</div>
              <div className="text-sm text-gray-200 break-all font-mono">
                {folderPath}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {onOpenFolder && (
              <button
                onClick={() => {
                  onOpenFolder();
                  onClose();
                }}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                Open Folder
              </button>
            )}
            <button
              onClick={onClose}
              className={`${
                onOpenFolder ? "flex-1" : "w-full"
              } px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
