import React from "react";
import { PvPPlayerData } from "../../types/battleZone";
import {
  getAvatarUrl,
  getRandomAvatarUrl,
  AVATAR_EXTENSIONS,
} from "../../utils/basePath";
import {
  CombatAudioController,
  type CombatAudioTrack,
} from "../CombatAudioController";

interface SidebarAvatarBannerProps {
  player: PvPPlayerData;
  accent: "blue" | "red";
  audioTracks?: CombatAudioTrack[];
  otherSideHasAudio?: boolean;
  audioStopped?: boolean;
  silenced?: boolean;
  blurred?: boolean;
  bgmVolumeScale?: number;
}

export const SidebarAvatarBanner = ({
  player,
  accent,
  audioTracks,
  otherSideHasAudio,
  audioStopped,
  silenced,
  blurred,
  bgmVolumeScale = 1,
}: SidebarAvatarBannerProps) => {
  const [extIndex, setExtIndex] = React.useState(0);
  const [phase, setPhase] = React.useState<"player" | "random">("player");
  const [randomExtIndex, setRandomExtIndex] = React.useState(0);
  const side = accent === "blue" ? "left" : "right";
  const tracks = audioTracks ?? [];

  const playerSrc =
    phase === "player" && extIndex < AVATAR_EXTENSIONS.length
      ? getAvatarUrl(player.no, extIndex)
      : null;
  const randomSrc =
    phase === "random" && randomExtIndex < AVATAR_EXTENSIONS.length
      ? getRandomAvatarUrl(player.no, randomExtIndex)
      : null;
  const avatarSrc = playerSrc ?? randomSrc;

  const handleAvatarError = () => {
    if (phase === "player") {
      const next = extIndex + 1;
      if (next < AVATAR_EXTENSIONS.length) {
        setExtIndex(next);
      } else {
        setPhase("random");
        setRandomExtIndex(0);
      }
    } else {
      setRandomExtIndex((i) => i + 1);
    }
  };

  return (
    // Outer wrapper — không overflow-hidden để panel popup không bị clip
    <div className="relative shrink-0">
      {/* Mute/Deaf badge */}
      {silenced && (
        <div className="absolute top-2 left-2 z-30 flex items-center gap-1 bg-black/70 rounded px-2 py-0.5 text-xs text-gray-300 font-semibold">
          🔇 Silenced
        </div>
      )}
      {/* Avatar area — overflow-hidden chỉ áp dụng ở đây */}
      <div
        className={`relative rounded-t-2xl overflow-hidden h-72 bg-gray-800 ${false && blurred ? "blur-sm" : ""}`}
      >
        {avatarSrc ? (
          <img
            key={avatarSrc}
            src={avatarSrc}
            alt={player.name}
            className="w-full h-full object-cover object-top"
            onError={handleAvatarError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-6xl font-black select-none">
            {player.name.charAt(0).toUpperCase()}
          </div>
        )}
        {/* Gradient mờ dần từ 40% xuống đáy — phần dưới avatar tự nhiên fade vào nền */}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
      </div>
      {/* Audio button — nằm ngoài overflow-hidden, absolute so với outer wrapper */}
      {tracks.length > 0 && (
        <div className="absolute bottom-6 right-2 z-20">
          <CombatAudioController
            tracks={tracks}
            otherSideHasAudio={otherSideHasAudio ?? false}
            side={side}
            accent={accent}
            stopped={audioStopped}
            silenced={silenced}
            volumeScale={bgmVolumeScale}
          />
        </div>
      )}
    </div>
  );
};
