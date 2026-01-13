import { useState } from "react";

interface AudioControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onStopAudio: () => void;
  customSfxUrl?: string;
  customSfxName?: string;
  onCustomSfxChange: (url: string | undefined, name?: string) => void;
}

export const AudioControls = ({
  isMuted,
  onToggleMute,
  onStopAudio,
  customSfxUrl,
  customSfxName,
  onCustomSfxChange,
}: AudioControlsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      alert("Please select an audio file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onCustomSfxChange(result, file.name);
    };
    reader.onerror = () => {
      alert("Failed to load audio file");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium transition-all shadow-lg flex items-center gap-2"
      >
        Audio
        <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded-lg shadow-2xl p-3 w-64 z-50 border border-gray-700">
          <div className="space-y-2">
            {/* Sound On/Off */}
            <button
              onClick={onToggleMute}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                isMuted
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
              title={isMuted ? "Unmute audio" : "Mute audio"}
            >
              {isMuted ? "Sound Off" : "Sound On"}
            </button>

            {/* Stop Audio */}
            <button
              onClick={onStopAudio}
              className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-medium transition-colors"
              title="Stop current audio"
            >
              Stop Audio
            </button>

            {/* Divider */}
            <div className="border-t border-gray-700 my-2"></div>

            {/* Choose Global SFX */}
            <div className="space-y-2">
              <label className="block text-white text-sm font-semibold">
                Global Win Sound:
              </label>

              {customSfxUrl ? (
                <div className="space-y-2">
                  <div className="bg-gray-700 p-2 rounded text-xs text-gray-300 truncate">
                    {customSfxName || "Custom sound"}
                  </div>
                  <button
                    onClick={() => onCustomSfxChange(undefined)}
                    className="w-full px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-white text-sm font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="block">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors cursor-pointer text-center">
                    Choose Sound
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
