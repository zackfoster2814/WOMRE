import { useState, useEffect } from "react";
import { isTauri } from "../utils/localStorage";
import {
  loadSettings,
  patchSettings,
  type TournamentMode,
} from "../utils/appSettings";
import { setAudioMuted, setAudioVolume } from "../utils/audio";

// Fullscreen helpers
const isFullscreen = () => !!document.fullscreenElement;

const requestFullscreen = async () => {
  if (isTauri()) {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().setFullscreen(true);
    } catch {
      await document.documentElement.requestFullscreen?.();
    }
  } else {
    await document.documentElement.requestFullscreen?.();
  }
};

const exitFullscreen = async () => {
  if (isTauri()) {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().setFullscreen(false);
    } catch {
      await document.exitFullscreen?.();
    }
  } else {
    await document.exitFullscreen?.();
  }
};

export const SettingsPage = () => {
  const [settings, setSettings] = useState(loadSettings);
  const [fullscreen, setFullscreen] = useState(isFullscreen);

  // Sync fullscreen state khi user nhấn F11 hay Esc
  useEffect(() => {
    const onFsChange = () => setFullscreen(isFullscreen());
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Apply audio settings khi mount
  useEffect(() => {
    setAudioMuted(settings.muted);
    setAudioVolume(settings.volume / 100);
  }, []);

  const update = (patch: Parameters<typeof patchSettings>[0]) => {
    const next = patchSettings(patch);
    setSettings(next);
    if (patch.muted !== undefined) setAudioMuted(patch.muted);
    if (patch.volume !== undefined) setAudioVolume(patch.volume / 100);
  };

  const toggleFullscreen = async () => {
    if (fullscreen) {
      await exitFullscreen();
    } else {
      await requestFullscreen();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white px-6 py-10">
      <div className="max-w-lg mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-primary/20 pb-4">
          <h1 className="font-display text-2xl text-primary tracking-widest uppercase">
            Settings
          </h1>
        </div>

        {/* Display */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
            Màn hình
          </h2>

          <div className="flex items-center justify-between glass-l2 rounded-xl px-5 py-4 border border-primary/10">
            <div>
              <p className="text-sm font-medium text-white">Chế độ màn hình</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {fullscreen ? "Toàn màn hình" : "Cửa sổ"}
              </p>
            </div>
            <button
              onClick={toggleFullscreen}
              className={`relative w-28 h-9 rounded-lg border text-xs font-bold tracking-wider transition-all duration-200
                ${fullscreen
                  ? "bg-primary/20 border-primary/60 text-primary"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white"
                }`}
            >
              {fullscreen ? "Toàn màn hình" : "Cửa sổ"}
            </button>
          </div>
        </section>

        {/* Audio */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
            Âm thanh
          </h2>

          {/* Mute toggle */}
          <div className="flex items-center justify-between glass-l2 rounded-xl px-5 py-4 border border-primary/10">
            <div>
              <p className="text-sm font-medium text-white">Tắt tiếng</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Tắt toàn bộ âm thanh trong app
              </p>
            </div>
            {/* Toggle switch */}
            <button
              onClick={() => update({ muted: !settings.muted })}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200
                ${settings.muted ? "bg-error/70" : "bg-primary/40"}`}
              aria-label="Toggle mute"
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
                  ${settings.muted ? "translate-x-6" : "translate-x-0.5"}`}
              />
            </button>
          </div>

          {/* Volume slider */}
          <div
            className={`glass-l2 rounded-xl px-5 py-4 border border-primary/10 transition-opacity duration-200
              ${settings.muted ? "opacity-40 pointer-events-none" : "opacity-100"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-white">Âm lượng</p>
              <span className="text-sm font-mono text-primary w-10 text-right">
                {settings.volume}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base">🔈</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={settings.volume}
                onChange={(e) => update({ volume: Number(e.target.value) })}
                className="flex-1 h-1.5 accent-primary cursor-pointer"
              />
              <span className="text-base">🔊</span>
            </div>
          </div>
        </section>

        {/* Tournament */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
            Tournament
          </h2>

          <div className="glass-l2 rounded-xl px-5 py-4 border border-primary/10 space-y-3">
            <p className="text-sm font-medium text-white">Chế độ thi đấu</p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  {
                    value: "qualifier" as TournamentMode,
                    label: "Vòng loại",
                    desc: "R256 + R128 Single Elim",
                  },
                  {
                    value: "double_elim" as TournamentMode,
                    label: "Double Elim",
                    desc: "Winners + Losers Bracket",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ tournamentMode: opt.value })}
                  className={`rounded-xl px-4 py-3 text-left border transition-all duration-200
                    ${settings.tournamentMode === opt.value
                      ? "bg-primary/15 border-primary/60 shadow-[0_0_12px_rgba(255,209,108,0.15)]"
                      : "bg-white/3 border-white/10 hover:border-white/25"
                    }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      settings.tournamentMode === opt.value
                        ? "text-primary"
                        : "text-gray-300"
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
