import { useState } from "react";
import { BattleType } from "../types";
import wheelBgImage from "../assets/img/wheel-bg.png";
export type { TournamentMatchContext, TournamentSaveResult } from "../types/battleZone";
import { WheelOfTruthMode } from "./WheelOfTruthMode";
import { PvEBattlePage } from "./PvEBattlePage";
export { PvEBattlePage } from "./PvEBattlePage";
import { StatsComparisonMode } from "./StatsComparisonMode";

export { StatsComparisonMode } from "./StatsComparisonMode";


export const BattleZonePage = () => {
  const [battleType, setBattleType] = useState<BattleType | null>(null);

  if (!battleType) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-8"
        style={{
          backgroundImage: `url(${wheelBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-primary via-amber-400 to-orange-600 tracking-wider mb-4 drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              Battle Zone
            </h1>
            <p className="text-primary/70 font-display tracking-widest uppercase text-lg">Choose your battle type</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setBattleType("pve")}
              className="group relative overflow-hidden card-magic glass-l2 p-12 transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-bloom rounded-2xl border border-primary/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <h2 className="font-display text-4xl font-bold text-white mb-2 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">PvE</h2>
                <p className="text-gray-400 font-medium">Player vs Environment</p>
              </div>
            </button>

            <button
              onClick={() => setBattleType("pvp")}
              className="group relative overflow-hidden card-magic glass-l2 p-12 transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-bloom rounded-2xl border border-primary/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <h2 className="font-display text-4xl font-bold text-white mb-2 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">PvP</h2>
                <p className="text-gray-400 font-medium">Player vs Player</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (battleType === "pve") {
    return <PvEBattlePage onBack={() => setBattleType(null)} />;
  }

  return <PvPBattlePage onBack={() => setBattleType(null)} />;
};

interface PvPBattlePageProps {
  onBack: () => void;
}

const PvPBattlePage = ({ onBack }: PvPBattlePageProps) => {
  const [selectedMode, setSelectedMode] = useState<
    "stats-comparison" | "wheel-of-truth" | null
  >(null);

  if (!selectedMode) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-8"
        style={{
          backgroundImage: `url(${wheelBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="max-w-4xl w-full">
          <button
            onClick={onBack}
            className="mb-8 px-6 py-2 btn-secondary font-display font-bold tracking-widest text-sm transition-all hover:scale-105 flex items-center gap-2 self-start uppercase"
          >
            <span>←</span> TRỞ VỀ
          </button>

          <div className="text-center mb-12">
            <h1 className="font-display text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-primary via-amber-400 to-orange-600 tracking-wider mb-4 drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              PvP Battle
            </h1>
            <p className="text-primary/70 font-display tracking-widest uppercase text-lg">Choose your battle mode</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setSelectedMode("stats-comparison")}
              className="group relative overflow-hidden card-magic glass-l2 p-12 transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-bloom rounded-2xl border border-primary/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="text-6xl mb-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">📊</div>
                <h2 className="font-display text-3xl font-bold text-white mb-2">
                  Stats Comparison
                </h2>
                <p className="text-gray-400 font-medium">
                  Compare player stats side by side
                </p>
              </div>
            </button>

            <button
              onClick={() => setSelectedMode("wheel-of-truth")}
              className="group relative overflow-hidden card-magic glass-l2 p-12 transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-bloom rounded-2xl border border-primary/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="text-6xl mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]">🎡</div>
                <h2 className="font-display text-3xl font-bold text-white mb-2">
                  Wheel of Truth
                </h2>
                <p className="text-gray-400 font-medium">Spin the wheel based on stats</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedMode === "stats-comparison") {
    return <StatsComparisonMode onBack={() => setSelectedMode(null)} />;
  }

  return <WheelOfTruthMode onBack={() => setSelectedMode(null)} />;
};
