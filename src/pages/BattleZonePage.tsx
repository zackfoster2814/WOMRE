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
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-4">
              Battle Zone
            </h1>
            <p className="text-gray-300 text-lg">Choose your battle type</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setBattleType("pve")}
              className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-2xl p-12 transition-all duration-300 hover:scale-105 hover:border-blue-500 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-2">PvE</h2>
                <p className="text-gray-400">Player vs Environment</p>
              </div>
            </button>

            <button
              onClick={() => setBattleType("pvp")}
              className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-2xl p-12 transition-all duration-300 hover:scale-105 hover:border-red-500 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-2">PvP</h2>
                <p className="text-gray-400">Player vs Player</p>
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
            className="mb-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2"
          >
            <span>←</span> Back
          </button>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-4">
              PvP Battle
            </h1>
            <p className="text-gray-300 text-lg">Choose your battle mode</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setSelectedMode("stats-comparison")}
              className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-2xl p-12 transition-all duration-300 hover:scale-105 hover:border-purple-500 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Stats Comparison
                </h2>
                <p className="text-gray-400">
                  Compare player stats side by side
                </p>
              </div>
            </button>

            <button
              onClick={() => setSelectedMode("wheel-of-truth")}
              className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-2xl p-12 transition-all duration-300 hover:scale-105 hover:border-yellow-500 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="text-6xl mb-4">🎡</div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Wheel of Truth
                </h2>
                <p className="text-gray-400">Spin the wheel based on stats</p>
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
