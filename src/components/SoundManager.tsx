import { useState } from "react";

interface SoundManagerProps {
  customSfxUrl?: string;
  customSfxName?: string;
  onCustomSfxChange: (url: string | undefined, name?: string) => void;
}

export const SoundManager = ({
  customSfxUrl,
  customSfxName,
  onCustomSfxChange,
}: SoundManagerProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      alert("Please select an audio file");
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onCustomSfxChange(result, file.name);
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert("Failed to load audio file");
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const clearCustomSound = () => {
    onCustomSfxChange(undefined, undefined);
  };

  const testSound = () => {
    if (customSfxUrl) {
      const audio = new Audio(customSfxUrl);
      audio.volume = 0.5;
      audio.play().catch((err) => {
        console.error("Failed to play sound:", err);
        alert("Failed to play sound");
      });
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-none shadow-lg">
      <h3 className="text-lg font-bold mb-3 text-white flex items-center gap-2">
        Global Win Sound
      </h3>

      <div className="space-y-3">
        {customSfxUrl ? (
          <div className="bg-gray-700 p-3 rounded">
            <p
              className="text-sm text-green-400 mb-2 truncate"
              title={customSfxName}
            >
              ✓ {customSfxName || "Custom sound loaded"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={testSound}
                className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium transition-colors"
              >
                Test
              </button>
              <button
                onClick={clearCustomSound}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-white text-sm font-medium transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 bg-gray-700 p-3 rounded">
            Using default win sound
          </p>
        )}

        <label className="block">
          <span className="sr-only">Choose audio file</span>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="block w-full text-sm text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700
              file:cursor-pointer
              disabled:file:bg-gray-600 disabled:file:cursor-not-allowed"
          />
        </label>
        {isUploading && (
          <p className="text-sm text-gray-400">Loading audio...</p>
        )}
      </div>
    </div>
  );
};
