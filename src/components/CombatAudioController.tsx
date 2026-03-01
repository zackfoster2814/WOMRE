/**
 * CombatAudioController
 *
 * - Nhạc tự chạy ngay khi component mount (không cần mở panel)
 * - Panel button để control volume/seek
 * - Local tracks: Web Audio API + StereoPanner
 * - YouTube tracks: YT IFrame API ẩn, poll currentTime/duration/title
 * - Mỗi track chỉ có DUY NHẤT một audio instance, controls luôn render (hidden/visible qua CSS)
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ============================================================
// TYPES
// ============================================================

export interface CombatAudioTrack {
  id: string;
  itemName: string;
  type: "local" | "youtube";
  src?: string;
  playlistId?: string;
  videoId?: string;
  label: string;
}

interface TrackState {
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0–1 for local, 0–100 for youtube
  title: string;
}

const mkDefault = (ytVol = false): TrackState => ({
  isReady: false, isPlaying: false, currentTime: 0, duration: 0,
  volume: ytVol ? 80 : 0.8, title: "",
});

// ============================================================
// DETECT TRACKS FROM CHARACTER
// ============================================================

const KEO_PLAYLIST_ID = "PLnUioGkqqn5XwWaMlwhftWusPPK_KHz3T";
const OT_PLAYLIST_ID  = "PLI8ooDRiresrLRA0no6IA7KFZl0dvVp6E";
// Kẹo: 49 video IDs từ playlist PLnUioGkqqn5XwWaMlwhftWusPPK_KHz3T
const KEO_SEED = [
  "-6s_eRHYqVM", "-b4qvyf_vNU", "0VJZOF_SJKs", "0YdgmKjUG-o", "1u0ygl9vJHI",
  "4VKoHGN9FzU", "9ZKA9xaMLac", "9mA7h1jfxc8", "BNKr6ONy4_Q", "BwuLJf9gHSo",
  "DlZ0vjfmzV0", "ECZVU4x6Xq0", "GqIaese5_Ac", "HD52peTkszQ", "ISK0p7-CUw0",
  "K1hM4fEnCDk", "KOBT2yACJvA", "KypuJGsZ8pQ", "LvNEPB5x7T8", "NmHHvnobW2k",
  "RTYSgSQGij8", "RkXStDkolwE", "U07kJZp5b1o", "UBgulvgHPE4", "Vgs5p1sRw8k",
  "Vq2ShP3qC2M", "W08NL1mchhs", "XyPy4AWa9J0", "ZUpL9MIz5Io", "ZWY5WXssw_w",
  "ZcP5mB1gGHo", "bWO-YOfQ2xs", "by8l9xVxtfg", "cnwM6ujDrKI", "gQOFI4ATIOY",
  "gUr4qp6YGLs", "iuV5RXVvGLQ", "j-oB7Bbv4ig", "jhs45JW53P8", "kSjj0LlsqnI",
  "lFQLRusYtQA", "mjpUWO5MuPg", "njv-aZKJnn8", "p8VDTNYyKbo", "vsRS7oGqPTg",
  "xG94wlZai1I", "xvpverLphlo", "yJbGCwT7Kms", "zVB61Ta9TMs",
];
// Ớt: 11 video IDs từ playlist PLI8ooDRiresrLRA0no6IA7KFZl0dvVp6E
const OT_SEED  = [
  "iZzVHk2m0mI", "EMG5tRgyrR8", "QcTWqGk2kP4", "aqXvFPKCFzs", "VPzWsWhk1zA",
  "BrPhEJh9xj4", "OnxEaDIsgWY", "RvLzVhjOj90", "gQg6P4UtDrM", "mr9jN6lHuP8", "xhhW9ncf4WE",
];

export function detectCombatAudioTracks(character: any): CombatAudioTrack[] {
  if (!character) return [];
  const tracks: CombatAudioTrack[] = [];

  const powers: string[] = (character.powers || [])
    .filter((p: any) => !p.isLost)
    .map((p: any) => (typeof p === "string" ? p : p?.name ?? ""));

  if (powers.includes("67"))
    tracks.push({ id: "power-67", itemName: "67", type: "youtube", videoId: "ei7NmqtqgOs", label: "67" });
  if (powers.some(p => p.toLowerCase().includes("railroad realm")))
    tracks.push({ id: "power-railroad", itemName: "Railroad Realm 🍀", type: "youtube", videoId: "S49CN57Y58o", label: "Railroad Realm 🍀" });
  if (powers.some(p => p.toLowerCase().includes("tick-tock") || p.toLowerCase() === "tick tock"))
    tracks.push({ id: "power-ticktock", itemName: "Tick-tock", type: "youtube", videoId: "xyCQFLOSWGc", label: "Tick-tock" });

  const allGear = [
    ...(Array.isArray(character.gear?.normalGear) ? character.gear.normalGear : []),
    ...(Array.isArray(character.gear?.legacyGear) ? character.gear.legacyGear : []),
  ].filter((g: any) => !g.isLost);

  allGear.filter((g: any) => g.name === "Kẹo").forEach((_, i) => tracks.push({
    id: `gear-keo-${i}`, itemName: "Kẹo", type: "youtube",
    playlistId: KEO_PLAYLIST_ID,
    videoId: KEO_SEED[Math.floor(Math.random() * KEO_SEED.length)],
    label: `Kẹo #${i + 1} – Thắng Ngọt`,
  }));

  allGear.filter((g: any) => g.name === "Ớt").forEach((_, i) => tracks.push({
    id: `gear-ot-${i}`, itemName: "Ớt", type: "youtube",
    playlistId: OT_PLAYLIST_ID,
    videoId: OT_SEED[Math.floor(Math.random() * OT_SEED.length)],
    label: `Ớt #${i + 1} – Thắng Ngọt AI Cover`,
  }));

  return tracks;
}

// ============================================================
// HELPERS
// ============================================================

function fmtTime(sec: number): string {
  if (!isFinite(sec) || isNaN(sec) || sec < 0) return "0:00";
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}

const ACCENT_HEX = { blue: "#60a5fa", red: "#f87171" };

// ============================================================
// TRACK CONTROLS UI — pure display
// ============================================================

interface TrackControlsProps {
  state: TrackState;
  accent: "blue" | "red";
  isLocal: boolean;
  label: string;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
  onVolume: (v: number) => void;
}

const TrackControls = ({ state, accent, isLocal, label, onTogglePlay, onSeek, onVolume }: TrackControlsProps) => {
  const hex = ACCENT_HEX[accent];
  const accentBtn  = accent === "blue" ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-red-600 hover:bg-red-500 text-white";
  const disabledBtn = "bg-gray-700 text-gray-500 cursor-not-allowed";
  const displayLabel = state.title || label;
  const volMax  = isLocal ? 1 : 100;
  const volStep = isLocal ? 0.01 : 1;
  const volPct  = isLocal ? Math.round(state.volume * 100) : Math.round(state.volume);

  return (
    <div className="bg-gray-800/90 rounded-lg p-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <button onClick={onTogglePlay} disabled={!state.isReady}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] shrink-0 ${state.isReady ? accentBtn : disabledBtn}`}>
          {!state.isReady ? "⏳" : state.isPlaying ? "⏸" : "▶"}
        </button>
        <span className="text-white text-xs font-medium truncate flex-1" title={displayLabel}>{displayLabel}</span>
        <span className="text-gray-400 text-[10px] shrink-0 tabular-nums">
          {fmtTime(state.currentTime)} / {fmtTime(state.duration)}
        </span>
      </div>
      <input type="range" min={0} max={state.duration || 1} step={isLocal ? 0.1 : 1} value={state.currentTime}
        onChange={e => onSeek(Number(e.target.value))}
        className="w-full h-1 cursor-pointer rounded-full" style={{ accentColor: hex }} />
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500 text-[10px]">🔊</span>
        <input type="range" min={0} max={volMax} step={volStep} value={state.volume}
          onChange={e => onVolume(Number(e.target.value))}
          className="w-full h-1 cursor-pointer" style={{ accentColor: hex }} />
        <span className="text-gray-400 text-[10px] w-7 text-right tabular-nums">{volPct}%</span>
      </div>
    </div>
  );
};

// ============================================================
// LocalTrackCard — always mounted (audio lives), controls visibility via CSS
// ============================================================

interface LocalTrackCardProps {
  track: CombatAudioTrack;
  pan: number;
  accent: "blue" | "red";
  visible: boolean;
}

const LocalTrackCard = ({ track, pan, accent, visible }: LocalTrackCardProps) => {
  const [state, setState] = useState<TrackState>(mkDefault(false));
  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const gainRef   = useRef<GainNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);
  const ctxRef    = useRef<AudioContext | null>(null);

  useEffect(() => {
    const audio = new Audio(track.src!);
    audioRef.current = audio;

    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const srcNode = ctx.createMediaElementSource(audio);
      const panner  = ctx.createStereoPanner();
      panner.pan.value = pan;
      pannerRef.current = panner;
      const gain = ctx.createGain();
      gain.gain.value = 0.8;
      gainRef.current = gain;
      srcNode.connect(panner).connect(gain).connect(ctx.destination);
    } catch { /* no panning fallback */ }

    audio.addEventListener("timeupdate",    () => setState(s => ({ ...s, currentTime: audio.currentTime })));
    audio.addEventListener("durationchange",() => setState(s => ({ ...s, duration: audio.duration })));
    audio.addEventListener("loadeddata",    () => setState(s => ({ ...s, isReady: true })));
    audio.addEventListener("ended",  () => setState(s => ({ ...s, isPlaying: false })));
    audio.addEventListener("play",   () => setState(s => ({ ...s, isPlaying: true })));
    audio.addEventListener("pause",  () => setState(s => ({ ...s, isPlaying: false })));

    if (ctxRef.current?.state === "suspended") ctxRef.current.resume();
    audio.play().catch(() => {});

    return () => { audio.pause(); audio.src = ""; ctxRef.current?.close(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.src]);

  useEffect(() => { if (pannerRef.current) pannerRef.current.pan.value = pan; }, [pan]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current; if (!a) return;
    if (ctxRef.current?.state === "suspended") ctxRef.current.resume();
    if (a.paused) a.play().catch(() => {}); else a.pause();
  }, []);

  const handleSeek = useCallback((t: number) => {
    if (audioRef.current) audioRef.current.currentTime = t;
  }, []);

  const handleVolume = useCallback((v: number) => {
    setState(s => ({ ...s, volume: v }));
    if (gainRef.current) gainRef.current.gain.value = v;
  }, []);

  return (
    <div style={{ display: visible ? undefined : "none" }}>
      <TrackControls state={state} accent={accent} isLocal label={track.label}
        onTogglePlay={togglePlay} onSeek={handleSeek} onVolume={handleVolume} />
    </div>
  );
};

// ============================================================
// YouTubeTrackCard — always mounted (YT player lives), controls visibility via CSS
// ============================================================

interface YouTubeTrackCardProps {
  track: CombatAudioTrack;
  accent: "blue" | "red";
  visible: boolean;
}

const YouTubeTrackCard = ({ track, accent, visible }: YouTubeTrackCardProps) => {
  const [state, setState] = useState<TrackState>(mkDefault(true));
  const playerRef  = useRef<any>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const containerId = useRef(`yt-${track.id}-${Math.random().toString(36).slice(2, 7)}`).current;

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p || !mountedRef.current) return;
      try {
        const ct    = p.getCurrentTime?.() ?? 0;
        const dur   = p.getDuration?.() ?? 0;
        const ytSt  = p.getPlayerState?.();
        const vdata = p.getVideoData?.();
        setState(s => ({
          ...s, currentTime: ct,
          duration: dur > 0 ? dur : s.duration,
          isPlaying: ytSt === 1,
          title: vdata?.title || s.title,
        }));
      } catch { /* ignore */ }
    }, 500);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const initPlayer = () => {
      if (playerRef.current) return;
      let el = document.getElementById(containerId);
      if (!el) {
        el = document.createElement("div");
        el.id = containerId;
        (el as HTMLElement).style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;top:-9999px;left:-9999px;";
        document.body.appendChild(el);
      }
      playerRef.current = new (window as any).YT.Player(containerId, {
        height: "1", width: "1",
        videoId: track.videoId,
        playerVars: {
          autoplay: 1, controls: 0, disablekb: 1, fs: 0, rel: 0,
          ...(track.playlistId ? { list: track.playlistId, listType: "playlist" } : {}),
        },
        events: {
          onReady: (e: any) => {
            if (!mountedRef.current) return;
            e.target.setVolume(80);
            e.target.playVideo();
            setState(s => ({ ...s, isReady: true }));
            startPolling();
          },
          onStateChange: (e: any) => {
            if (!mountedRef.current) return;
            setState(s => ({ ...s, isPlaying: e.data === 1 }));
          },
        },
      });
    };

    if ((window as any).YT?.Player) {
      initPlayer();
    } else {
      if (!document.getElementById("yt-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const prevCb = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => { prevCb?.(); initPlayer(); };
      const t = setInterval(() => {
        if ((window as any).YT?.Player) { clearInterval(t); initPlayer(); }
      }, 300);
      return () => { clearInterval(t); };
    }

    return () => {
      mountedRef.current = false;
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      playerRef.current?.destroy?.();
      playerRef.current = null;
      document.getElementById(containerId)?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = useCallback(() => {
    const p = playerRef.current; if (!p) return;
    if (state.isPlaying) p.pauseVideo?.(); else p.playVideo?.();
  }, [state.isPlaying]);

  const handleSeek = useCallback((t: number) => {
    playerRef.current?.seekTo?.(t, true);
    setState(s => ({ ...s, currentTime: t }));
  }, []);

  const handleVolume = useCallback((v: number) => {
    setState(s => ({ ...s, volume: v }));
    playerRef.current?.setVolume?.(v);
  }, []);

  return (
    <div style={{ display: visible ? undefined : "none" }}>
      <TrackControls state={state} accent={accent} isLocal={false} label={track.label}
        onTogglePlay={togglePlay} onSeek={handleSeek} onVolume={handleVolume} />
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export interface CombatAudioControllerProps {
  tracks: CombatAudioTrack[];
  otherSideHasAudio: boolean;
  side: "left" | "right";
  accent: "blue" | "red";
}

export const CombatAudioController = ({
  tracks,
  otherSideHasAudio,
  side,
  accent,
}: CombatAudioControllerProps) => {
  const [open, setOpen] = useState(false);

  // Stabilize tracks reference so keys never change after initial render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableTracks = useMemo(() => tracks, []);

  if (stableTracks.length === 0) return null;

  const pan = otherSideHasAudio ? (side === "left" ? -1 : 1) : 0;
  const panLabel = otherSideHasAudio
    ? (side === "left" ? "📢 Kênh trái" : "📢 Kênh phải")
    : "📢 Stereo";

  const accentBtn   = accent === "blue" ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-red-600 hover:bg-red-500 text-white";
  const borderClass = accent === "blue" ? "border-blue-500/40" : "border-red-500/40";
  const panelSide   = side === "right" ? "right-0" : "left-0";

  return (
    <div className="relative">
      {/*
        Track cards always stay mounted → audio/YT player always alive.
        Panel visibility is controlled by CSS display:none, NOT by conditional render.
        This ensures exactly ONE audio instance per track at all times.
      */}
      <div
        className={`absolute z-50 bottom-full mb-1 ${panelSide} w-72 bg-gray-900 border ${borderClass} rounded-xl shadow-2xl p-2 space-y-2`}
        style={{ display: open ? undefined : "none" }}
      >
        <div className="flex items-center justify-between pb-1 border-b border-gray-700/50">
          <span className="text-gray-300 text-[10px] font-semibold uppercase tracking-wide">{panLabel}</span>
          <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white text-xs leading-none">✕</button>
        </div>

        {stableTracks.map(track =>
          track.type === "local"
            ? <LocalTrackCard key={track.id} track={track} pan={pan} accent={accent} visible />
            : <YouTubeTrackCard key={track.id} track={track} accent={accent} visible />
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${accentBtn}`}
        title={`${stableTracks.length} track đang phát`}
      >
        🎵 {stableTracks.length}
      </button>
    </div>
  );
};
