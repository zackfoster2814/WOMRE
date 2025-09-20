import React, { useState } from "react";
import arrowImg from "@/assets/Images/arrow-2.png";
import { CANVAS_SIZE } from "@/utils/wheelUtils.ts";
import { Section, WheelStep } from "@/Common/Types/Types.ts";
import { useNavigate } from "react-router-dom";


interface CenterWheelProps {
  currentWheel: WheelStep;
  rolledResult: Section | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isSpinning: boolean;
  spin: () => void;
  nextStep: () => void;
  resetWheels: () => void;
  handleGetData: () => void;
  handleCharacterComplete: () => void;
}

interface CenterWheelProps {
  currentWheel: WheelStep;
  rolledResult: Section | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isSpinning: boolean;
  spin: () => void;
  nextStep: () => void;
  resetWheels: () => void;
  handleGetData: () => void;
  handleCharacterComplete: () => void;
}

export const CenterWheel: React.FC<CenterWheelProps> = ({
  currentWheel,
  rolledResult,
  canvasRef,
  isSpinning,
  spin,
  nextStep,
  resetWheels,
  handleGetData,
  handleCharacterComplete,
}) => {
  const navigate = useNavigate();
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleNextClick = () => {
    if (currentWheel.key === "pve") {
      handleCharacterComplete();
    } else {
      nextStep();
    }
  };

  const handleResetClick = () => {
    setShowResetDialog(true);
  };

  const handleConfirmReset = () => {
    resetWheels();
    setShowResetDialog(false);
  };

  const handleCancelReset = () => {
    setShowResetDialog(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      {/* Top Action Buttons */}
      <div className="flex gap-6">
        <button
          onClick={handleGetData}
          disabled={isSpinning}
          className="px-6 py-2 mb-4 min-w-[150px] max-w-[150px] bg-[#3a2a18] border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-110 transition disabled:opacity-40"
        >
          Get Data
        </button>
        <button
          onClick={() => navigate("/")}
          disabled={isSpinning}
          className="px-6 py-2 mb-4 min-w-[150px] max-w-[150px] bg-gray-700 border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-110 transition disabled:opacity-40"
        >
          Back
        </button>
        <button
          onClick={handleResetClick}
          disabled={isSpinning}
          className="px-6 py-2 mb-4 min-w-[150px] max-w-[150px] bg-red-700 border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-110 transition disabled:opacity-40"
        >
          Reset All
        </button>
      </div>

      {/* Wheel Title */}
      <h1 className="text-3xl font-bold mb-2 text-[#d4af37] drop-shadow-[0_0_15px_rgba(255,200,100,0.8)] tracking-widest">
        {currentWheel.title} Wheel
      </h1>

      {/* Result Display */}
      <div className="mb-4">
        <div
          className={`px-6 py-2 rounded-lg text-xl font-bold shadow-[0_0_15px_rgba(255,215,0,0.7)] 
          border-2 min-h-[48px] min-w-[300px] flex items-center justify-center
          ${
            rolledResult
              ? "border-[#d4af37] bg-black/60 text-amber-300"
              : "border-[#555] bg-black/30 text-gray-400"
          }`}
        >
          {rolledResult ? rolledResult.name : ""}
        </div>
      </div>

      {/* Wheel Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="rounded-full border-4 border-[#8a5b1a] shadow-[0_0_30px_rgba(200,50,50,0.6)] bg-black/40"
        />
        {/* Arrow Pointer */}
        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 ml-[-30px] text-red-500 drop-shadow-lg">
          <img src={arrowImg} alt="arrow" className="w-20 h-24 rotate-90" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-6 mt-6">
        <button
          onClick={spin}
          disabled={isSpinning}
          className="px-8 py-3 bg-[#3a2a18] border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-110 transition disabled:opacity-40"
        >
          {isSpinning ? "Spinning..." : "Roll"}
        </button>
        <button
          disabled={!rolledResult}
          onClick={handleNextClick}
          className="px-8 py-3 bg-green-700 border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-110 transition disabled:opacity-40"
        >
          {currentWheel.key === "pve" ? "Complete" : "Next"}
        </button>
      </div>

      {/* Progress Indicator */}
      {currentWheel.key && (
        <div className="mt-4 text-sm text-amber-300/70">
          Current: {currentWheel.key}
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#2a1810] border-2 border-[#8a5b1a] rounded-lg p-8 max-w-md mx-4 shadow-[0_0_30px_rgba(200,50,50,0.6)]">
            <h3 className="text-xl font-bold text-[#d4af37] mb-4 text-center">
              Confirm Reset
            </h3>
            <p className="text-[#f5e6d3] mb-6 text-center">
              Are you sure you want to reset all wheels? This will clear all
              progress and results.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleCancelReset}
                className="px-6 py-3 bg-gray-600 border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-105 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-6 py-3 bg-red-700 border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-105 transition"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
