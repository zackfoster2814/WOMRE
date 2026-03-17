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
import { getAssetPath } from "../utils/basePath";

// ============================================================
// TYPES
// ============================================================

export interface CombatAudioTrack {
  id: string;
  itemName: string;
  type: "local" | "youtube";
  src?: string;
  /** Local file path — nếu có, ưu tiên dùng thay vì YouTube */
  localSrc?: string;
  /** Danh sách local files để random khi bài kết thúc */
  localPlaylist?: string[];
  /** Folder prefix cho localPlaylist */
  localPlaylistFolder?: string;
  playlistId?: string;
  videoId?: string;
  label: string;
  loop?: boolean;
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
  isReady: false,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: ytVol ? 80 : 0.8,
  title: "",
});

// ============================================================
// DETECT TRACKS FROM CHARACTER
// ============================================================

// Local file lists — fallback to YouTube nếu folder trống
const KEO_LOCAL_FILES = [
  "01 - Ngọt - Thấy Chưa (Official Music Video).ogg",
  "02 - Ngọt - Thấy Chưa.ogg",
  "03 - Ngọt - Mấy Khi (Official Music Video).ogg",
  "04 - Ngọt - LẦN CUỐI (đi bên em xót xa người ơi).ogg",
  "05 - Ngọt - Em dạo này (Official Music Video).ogg",
  "06 - Ngọt - CHUYỂN KÊNH (sản phẩm này không phải là thuốc).ogg",
  // "07 - Ngọt vc. Đen - Cho Tôi Lang Thang.ogg",
  "08 - Ngọt - Em Trang Trí.ogg",
  "09 - Ngọt - Đốt.ogg",
  "10 - Ngọt - Cho.ogg",
  "11 - Ngọt - để quên.ogg",
  "12 - Ngọt - HẾT THỜI.ogg",
  "13 - Ngọt - NỨT (đôi chân đôi tay đôi mắt trái tim).ogg",
  "14 - Ngọt - (bé).ogg",
  "15 - Ngọt -  (sau đây là) DỰ BÁO THỜI TIẾT (cho các vùng vào ngày mai).ogg",
  "16 - Ngọt - Mấy Khi ｜ Director's Cut.ogg",
  "17 - Ngọt - CHUÔNG BÁO THỨC (sáng rồi).ogg",
  "18 - Ngọt - Tìm Người Nhà.ogg",
  "19 - Ngọt - VÉ ĐI THIÊN ĐƯỜNG (một chiều).ogg",
  "20 - Ngọt - GIẢ VỜ.ogg",
  "21 - Ngọt - EM CÓ CHẮC KHÔNG (？) (bài ca rebound).ogg",
  "22 - Ngọt - MÀU (đen trắng).ogg",
  "23 - Ngọt -  (tôi) ĐI TRÚ ĐÔNG (Official Music Video).ogg",
  "24 - Ngọt - MẾU MÁO (T.T).ogg",
  "25 - Ngọt - Một ngày không mưa.ogg",
  "26 - Ngọt - Mèo hoang.ogg",
  "27 - Ngọt - Kẻ thù.ogg",
  "28 - Ngọt - Kho báu.ogg",
  "29 - Ngọt - Xin cho tôi.ogg",
  "30 - Ngọt - Em Dạo Này (bản CNGDC).ogg",
  "31 - Ngọt - Kẻ Thù (bản CNGDC).ogg",
  "32 - Ngọt - Bartender (Official Music Video).ogg",
  "33 - Ngọt - Bartender (bản CNGDC).ogg",
  "34 - Ngọt - Mèo Hoang (bản CNGDC).ogg",
  "35 - Ngọt - Ng`bthg Hà Nội 23⧸9⧸2017.ogg",
  "36 - Ngọt - Drama Queen.ogg",
  "37 - Ngọt - Khắp Xung Quanh.ogg",
  "38 - Ngọt - Những Chuyến Phiêu Lưu.ogg",
  "39 - Ngọt - À Ơi.ogg",
  "40 - Ngọt - Xanh.ogg",
  "41 - Ngọt - Be Cool.ogg",
  "42 - Ngọt - Vì Ai.ogg",
  "43 - Ngọt - Xanh (fingerstyle).ogg",
  "44 - Ngọt - Không Làm Gì (Official Music Video).ogg",
  "45 - Ngọt - Cho Tôi Đi Theo (trực tiếp tại Bữa Trưa Vui Vẻ VTV6).ogg",
  "47 - Ngọt - Cá hồi.ogg",
  "48 - Ngọt - Cho Tôi Đi Theo.ogg",
  "49 - Ngọt - Khắp Xung Quanh.ogg",
  "50 - Ngọt - Cá Hồi.ogg",
];

const OT_LOCAL_FILES = [
  "01 - Lần Cuối - Bocchi (AI cover).ogg",
  "02 - Trước Khi Em Tồn Tại (Peter Griffin Cover).ogg",
  "03 - CHẾT TRUYỀN THÔNG - VŨ ĐINH TRỌNG THẮNG ( Arisu AI Cover ).ogg",
  "04 - Trước Khi Em Tồn Tại - Tokai Teio (AI cover).ogg",
  "05 - Em dạo này (Ngọt) - Mejiro McQueen (AI Cover).ogg",
  "06 - LẦN CUỐI - Tokai Teio (AI Cover).ogg",
  "07 - Kẻ Thù - Ngọt (Sorasaki Hina AI Cover).ogg",
  "08 - Mèo Hoang - Ngọt (Takanashi Hoshino AI Cover).ogg",
  "09 - Lần Cuối - Drake x Ngọt (AI Cover).ogg",
  "10 - Peter Griffin Hát Chuyển Kênh.ogg",
  "11 - Ngọt - Hết Thời (Tokai Teio Cover).ogg",
];

// YouTube fallback seeds
const KEO_PLAYLIST_ID = "PLnUioGkqqn5XwWaMlwhftWusPPK_KHz3T";
const OT_PLAYLIST_ID = "PLI8ooDRiresrLRA0no6IA7KFZl0dvVp6E";
const KEO_YT_SEED = [
  "-6s_eRHYqVM",
  "-b4qvyf_vNU",
  "0VJZOF_SJKs",
  "0YdgmKjUG-o",
  "1u0ygl9vJHI",
  "4VKoHGN9FzU",
  "9ZKA9xaMLac",
  "9mA7h1jfxc8",
  "BNKr6ONy4_Q",
  "BwuLJf9gHSo",
  "DlZ0vjfmzV0",
  "ECZVU4x6Xq0",
  "GqIaese5_Ac",
  "HD52peTkszQ",
  "ISK0p7-CUw0",
  "K1hM4fEnCDk",
  "KOBT2yACJvA",
  "KypuJGsZ8pQ",
  "LvNEPB5x7T8",
  "NmHHvnobW2k",
  "RTYSgSQGij8",
  "RkXStDkolwE",
  "U07kJZp5b1o",
  "UBgulvgHPE4",
  "Vgs5p1sRw8k",
  "Vq2ShP3qC2M",
  "W08NL1mchhs",
  "XyPy4AWa9J0",
  "ZUpL9MIz5Io",
  "ZWY5WXssw_w",
  "ZcP5mB1gGHo",
  "bWO-YOfQ2xs",
  "by8l9xVxtfg",
  "cnwM6ujDrKI",
  "gQOFI4ATIOY",
  "gUr4qp6YGLs",
  "iuV5RXVvGLQ",
  "j-oB7Bbv4ig",
  "jhs45JW53P8",
  "kSjj0LlsqnI",
  "lFQLRusYtQA",
  "mjpUWO5MuPg",
  "njv-aZKJnn8",
  "p8VDTNYyKbo",
  "vsRS7oGqPTg",
  "xG94wlZai1I",
  "xvpverLphlo",
  "yJbGCwT7Kms",
  "zVB61Ta9TMs",
];
const OT_YT_SEED = [
  "iZzVHk2m0mI",
  "EMG5tRgyrR8",
  "QcTWqGk2kP4",
  "aqXvFPKCFzs",
  "VPzWsWhk1zA",
  "BrPhEJh9xj4",
  "OnxEaDIsgWY",
  "RvLzVhjOj90",
  "gQg6P4UtDrM",
  "mr9jN6lHuP8",
  "xhhW9ncf4WE",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function detectCombatAudioTracks(character: any): CombatAudioTrack[] {
  if (!character) return [];
  const tracks: CombatAudioTrack[] = [];

  const quirks: string[] = (character.quirks || [])
    .filter((q: any) => !q.isLost)
    .map((q: any) =>
      (typeof q === "string" ? q : (q?.name ?? "")).toLowerCase(),
    );

  if (quirks.some((q) => q === "raumanian" || q === "raumanian🍀"))
    tracks.push({
      id: "quirk-raumanian",
      itemName: "Raumanian🍀",
      type: "local",
      src: "/assets/combatSFX/Raumanian.ogg",
      label: "Raumanian🍀 – Khúc Tình Ca Thanh Hoá",
      loop: true,
    });

  const powers: string[] = (character.powers || [])
    .filter((p: any) => !p.isLost)
    .map((p: any) => (typeof p === "string" ? p : (p?.name ?? "")));

  if (powers.includes("67"))
    tracks.push({
      id: "power-67",
      itemName: "67",
      type: "local",
      src: "/assets/combatSFX/67_sfx.ogg",
      label: "67",
      loop: true,
    });

  if (powers.some((p) => p.toLowerCase().includes("railroad realm")))
    tracks.push({
      id: "power-railroad",
      itemName: "Railroad Realm 🍀",
      type: "local",
      src: "/assets/combatSFX/railroad.ogg",
      label: "Railroad Realm 🍀",
      loop: true,
    });

  if (
    powers.some(
      (p) =>
        p.toLowerCase().includes("tick-tock") ||
        p.toLowerCase() === "tick tock",
    )
  )
    tracks.push({
      id: "power-ticktock",
      itemName: "Tick-tock",
      type: "local",
      src: "/assets/combatSFX/ticktock.ogg",
      label: "Tick-tock",
      loop: true,
    });

  const allGear = [
    ...(Array.isArray(character.gear?.normalGear)
      ? character.gear.normalGear
      : []),
    ...(Array.isArray(character.gear?.legacyGear)
      ? character.gear.legacyGear
      : []),
  ].filter((g: any) => !g.isLost);

  allGear
    .filter((g: any) => g.name === "Kẹo")
    .forEach((_, i) => {
      if (KEO_LOCAL_FILES.length > 0) {
        const file = randomFrom(KEO_LOCAL_FILES);
        tracks.push({
          id: `gear-keo-${i}`,
          itemName: "Kẹo",
          type: "local",
          src: `/assets/combatSFX/NhacNgot/${file}`,
          label: `Kẹo #${i + 1} – ${file.replace(/^\d+ - /, "").replace(".ogg", "")}`,
          localPlaylist: KEO_LOCAL_FILES,
          localPlaylistFolder: "/assets/combatSFX/NhacNgot/",
        });
      } else {
        tracks.push({
          id: `gear-keo-${i}`,
          itemName: "Kẹo",
          type: "youtube",
          playlistId: KEO_PLAYLIST_ID,
          videoId: randomFrom(KEO_YT_SEED),
          label: `Kẹo #${i + 1} – Thắng Ngọt`,
        });
      }
    });

  allGear
    .filter((g: any) => g.name === "Ớt")
    .forEach((_, i) => {
      if (OT_LOCAL_FILES.length > 0) {
        const file = randomFrom(OT_LOCAL_FILES);
        tracks.push({
          id: `gear-ot-${i}`,
          itemName: "Ớt",
          type: "local",
          src: `/assets/combatSFX/NhacNgotAI/${file}`,
          label: `Ớt #${i + 1} – ${file.replace(/^\d+ - /, "").replace(".ogg", "")}`,
          localPlaylist: OT_LOCAL_FILES,
          localPlaylistFolder: "/assets/combatSFX/NhacNgotAI/",
        });
      } else {
        tracks.push({
          id: `gear-ot-${i}`,
          itemName: "Ớt",
          type: "youtube",
          playlistId: OT_PLAYLIST_ID,
          videoId: randomFrom(OT_YT_SEED),
          label: `Ớt #${i + 1} – Thắng Ngọt AI Cover`,
        });
      }
    });

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

const TrackControls = ({
  state,
  accent,
  isLocal,
  label,
  onTogglePlay,
  onSeek,
  onVolume,
}: TrackControlsProps) => {
  const hex = ACCENT_HEX[accent];
  const accentBtn =
    accent === "blue"
      ? "bg-blue-600 hover:bg-blue-500 text-white"
      : "bg-red-600 hover:bg-red-500 text-white";
  const disabledBtn = "bg-gray-700 text-gray-500 cursor-not-allowed";
  const displayLabel = state.title || label;
  const volMax = isLocal ? 1 : 100;
  const volStep = isLocal ? 0.01 : 1;
  const volPct = isLocal
    ? Math.round(state.volume * 100)
    : Math.round(state.volume);

  return (
    <div className="bg-gray-800/90 rounded-lg p-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePlay}
          disabled={!state.isReady}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] shrink-0 ${state.isReady ? accentBtn : disabledBtn}`}
        >
          {!state.isReady ? "⏳" : state.isPlaying ? "⏸" : "▶"}
        </button>
        <span
          className="text-white text-xs font-medium truncate flex-1"
          title={displayLabel}
        >
          {displayLabel}
        </span>
        <span className="text-gray-400 text-[10px] shrink-0 tabular-nums">
          {fmtTime(state.currentTime)} / {fmtTime(state.duration)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={state.duration || 1}
        step={isLocal ? 0.1 : 1}
        value={state.currentTime}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="w-full h-1 cursor-pointer rounded-full"
        style={{ accentColor: hex }}
      />
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500 text-[10px]">🔊</span>
        <input
          type="range"
          min={0}
          max={volMax}
          step={volStep}
          value={state.volume}
          onChange={(e) => onVolume(Number(e.target.value))}
          className="w-full h-1 cursor-pointer"
          style={{ accentColor: hex }}
        />
        <span className="text-gray-400 text-[10px] w-7 text-right tabular-nums">
          {volPct}%
        </span>
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
  stopped?: boolean;
  silenced?: boolean;
  volumeScale?: number;
}

const LocalTrackCard = ({
  track,
  pan,
  accent,
  visible,
  stopped,
  silenced,
  volumeScale = 1,
}: LocalTrackCardProps) => {
  const [state, setState] = useState<TrackState>(mkDefault(false));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const trackRef = useRef(track);
  trackRef.current = track;

  useEffect(() => {
    const audio = new Audio(getAssetPath(track.src!));
    if (track.loop) audio.loop = true;
    audioRef.current = audio;

    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const srcNode = ctx.createMediaElementSource(audio);
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      pannerRef.current = panner;
      const gain = ctx.createGain();
      gain.gain.value = 0.8;
      gainRef.current = gain;
      srcNode.connect(panner).connect(gain).connect(ctx.destination);
    } catch {
      /* no panning fallback */
    }

    const onEnded = () => {
      const t = trackRef.current;
      if (
        t.localPlaylist &&
        t.localPlaylist.length > 0 &&
        t.localPlaylistFolder
      ) {
        // Random bài tiếp theo (tránh trùng bài hiện tại nếu có thể)
        const currentFile = t.src?.split("/").pop() ?? "";
        const others = t.localPlaylist.filter((f) => f !== currentFile);
        const nextFile = randomFrom(
          others.length > 0 ? others : t.localPlaylist,
        );
        const nextSrc = getAssetPath(`${t.localPlaylistFolder}${nextFile}`);
        const a = audioRef.current;
        if (a) {
          a.src = nextSrc;
          a.load();
          a.play().catch(() => {});
          setState((s) => ({
            ...s,
            currentTime: 0,
            duration: 0,
            title: nextFile.replace(/^\d+ - /, "").replace(".ogg", ""),
          }));
        }
      } else {
        setState((s) => ({ ...s, isPlaying: !t.loop }));
      }
    };

    audio.addEventListener("timeupdate", () =>
      setState((s) => ({ ...s, currentTime: audio.currentTime })),
    );
    audio.addEventListener("durationchange", () =>
      setState((s) => ({ ...s, duration: audio.duration })),
    );
    audio.addEventListener("loadeddata", () =>
      setState((s) => ({ ...s, isReady: true })),
    );
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", () =>
      setState((s) => ({ ...s, isPlaying: true })),
    );
    audio.addEventListener("pause", () =>
      setState((s) => ({ ...s, isPlaying: false })),
    );

    if (ctxRef.current?.state === "suspended") ctxRef.current.resume();
    audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.src = "";
      try {
        ctxRef.current?.close();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.src]);

  useEffect(() => {
    if (pannerRef.current) pannerRef.current.pan.value = pan;
  }, [pan]);
  useEffect(() => {
    if (stopped) audioRef.current?.pause();
  }, [stopped]);
  useEffect(() => {
    if (gainRef.current)
      gainRef.current.gain.value = silenced ? 0 : state.volume * volumeScale;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [silenced, volumeScale]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (ctxRef.current?.state === "suspended") ctxRef.current.resume();
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, []);

  const handleSeek = useCallback((t: number) => {
    if (audioRef.current) audioRef.current.currentTime = t;
  }, []);

  const handleVolume = useCallback(
    (v: number) => {
      setState((s) => ({ ...s, volume: v }));
      if (gainRef.current) gainRef.current.gain.value = v * volumeScale;
    },
    [volumeScale],
  );

  return (
    <div style={{ display: visible ? undefined : "none" }}>
      <TrackControls
        state={state}
        accent={accent}
        isLocal
        label={track.label}
        onTogglePlay={togglePlay}
        onSeek={handleSeek}
        onVolume={handleVolume}
      />
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
  stopped?: boolean;
  silenced?: boolean;
  volumeScale?: number;
}

const YouTubeTrackCard = ({
  track,
  accent,
  visible,
  stopped,
  silenced,
  volumeScale = 1,
}: YouTubeTrackCardProps) => {
  const [state, setState] = useState<TrackState>(mkDefault(true));
  const playerRef = useRef<any>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const containerId = useRef(
    `yt-${track.id}-${Math.random().toString(36).slice(2, 7)}`,
  ).current;

  // Stop nhạc khi user rời trang (tab ẩn / navigate ra ngoài)
  useEffect(() => {
    const stopAudio = () => playerRef.current?.pauseVideo?.();
    window.addEventListener("beforeunload", stopAudio);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAudio();
    });
    return () => {
      window.removeEventListener("beforeunload", stopAudio);
    };
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p || !mountedRef.current) return;
      try {
        const ct = p.getCurrentTime?.() ?? 0;
        const dur = p.getDuration?.() ?? 0;
        const ytSt = p.getPlayerState?.();
        const vdata = p.getVideoData?.();
        setState((s) => ({
          ...s,
          currentTime: ct,
          duration: dur > 0 ? dur : s.duration,
          isPlaying: ytSt === 1,
          title: vdata?.title || s.title,
        }));
      } catch {
        /* ignore */
      }
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
        (el as HTMLElement).style.cssText =
          "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;top:-9999px;left:-9999px;";
        document.body.appendChild(el);
      }
      playerRef.current = new (window as any).YT.Player(containerId, {
        height: "1",
        width: "1",
        videoId: track.videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          ...(track.loop ? { loop: 1, playlist: track.videoId } : {}),
          ...(track.playlistId
            ? { list: track.playlistId, listType: "playlist" }
            : {}),
        },
        events: {
          onReady: (e: any) => {
            if (!mountedRef.current) return;
            e.target.setVolume(80);
            e.target.playVideo();
            setState((s) => ({ ...s, isReady: true }));
            startPolling();
          },
          onStateChange: (e: any) => {
            if (!mountedRef.current) return;
            setState((s) => ({ ...s, isPlaying: e.data === 1 }));
            // Nếu video kết thúc (state=0) và track có loop → play lại
            if (e.data === 0 && track.loop) {
              e.target.seekTo(0);
              e.target.playVideo();
            }
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
      (window as any).onYouTubeIframeAPIReady = () => {
        prevCb?.();
        initPlayer();
      };
      const t = setInterval(() => {
        if ((window as any).YT?.Player) {
          clearInterval(t);
          initPlayer();
        }
      }, 300);
      return () => {
        clearInterval(t);
      };
    }

    return () => {
      mountedRef.current = false;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      try {
        playerRef.current?.stopVideo?.();
      } catch {
        /* ignore */
      }
      playerRef.current?.destroy?.();
      playerRef.current = null;
      document.getElementById(containerId)?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stopped) playerRef.current?.pauseVideo?.();
  }, [stopped]);
  useEffect(() => {
    if (silenced) playerRef.current?.setVolume?.(0);
    else playerRef.current?.setVolume?.(state.volume * volumeScale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [silenced, volumeScale]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (state.isPlaying) p.pauseVideo?.();
    else p.playVideo?.();
  }, [state.isPlaying]);

  const handleSeek = useCallback((t: number) => {
    playerRef.current?.seekTo?.(t, true);
    setState((s) => ({ ...s, currentTime: t }));
  }, []);

  const handleVolume = useCallback(
    (v: number) => {
      setState((s) => ({ ...s, volume: v }));
      playerRef.current?.setVolume?.(v * volumeScale);
    },
    [volumeScale],
  );

  return (
    <div style={{ display: visible ? undefined : "none" }}>
      <TrackControls
        state={state}
        accent={accent}
        isLocal={false}
        label={track.label}
        onTogglePlay={togglePlay}
        onSeek={handleSeek}
        onVolume={handleVolume}
      />
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
  stopped?: boolean;
  silenced?: boolean;
  volumeScale?: number; // 0–1, nhân với volume của từng track
}

export const CombatAudioController = ({
  tracks,
  otherSideHasAudio,
  side,
  accent,
  stopped,
  silenced,
  volumeScale = 1,
}: CombatAudioControllerProps) => {
  const [open, setOpen] = useState(false);

  // Stabilize tracks reference so keys never change after initial render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableTracks = useMemo(() => tracks, []);

  if (stableTracks.length === 0) return null;

  const pan = otherSideHasAudio ? (side === "left" ? -1 : 1) : 0;
  const panLabel = otherSideHasAudio
    ? side === "left"
      ? "📢 Kênh trái"
      : "📢 Kênh phải"
    : "📢 Stereo";

  const accentBtn =
    accent === "blue"
      ? "bg-blue-600 hover:bg-blue-500 text-white"
      : "bg-red-600 hover:bg-red-500 text-white";
  const borderClass =
    accent === "blue" ? "border-blue-500/40" : "border-red-500/40";
  const panelSide = side === "right" ? "right-0" : "left-0";

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
          <span className="text-gray-300 text-[10px] font-semibold uppercase tracking-wide">
            {panLabel}
          </span>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-500 hover:text-white text-xs leading-none"
          >
            ✕
          </button>
        </div>

        {stableTracks.map((track) =>
          track.type === "local" ? (
            <LocalTrackCard
              key={track.id}
              track={track}
              pan={pan}
              accent={accent}
              visible
              stopped={stopped}
              silenced={silenced}
              volumeScale={volumeScale}
            />
          ) : (
            <YouTubeTrackCard
              key={track.id}
              track={track}
              accent={accent}
              visible
              stopped={stopped}
              silenced={silenced}
              volumeScale={volumeScale}
            />
          ),
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${accentBtn}`}
        title={`${stableTracks.length} track đang phát`}
      >
        🎵 {stableTracks.length}
      </button>
    </div>
  );
};
