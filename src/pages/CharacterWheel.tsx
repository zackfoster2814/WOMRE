import React from "react";
import { useCharacterWheel } from "@/hooks/useCharacterWheel.ts";
import { useWheelAnimation } from "@/hooks/useWheelAnimation.ts";
import { useHouseAudios } from "@/Common/Config/HouseConfig.ts";
import { LeftPanel } from "@/components/LeftPanel.tsx";
import { CenterWheel } from "@/components/CenterWheel.tsx";
import { RightPanel } from "@/components/RightPanel.tsx";
import { CharacterDataDialog } from "@/components/CharacterDataDialog.tsx";
import { useNavigate } from "react-router-dom";

import wheelBg from "../assets/Backgrounds/wheel-bg.png";
import { Section } from "@/Common/Types/Types";
import Wheel from "@/components/Wheel";

export default function CharacterWheel() {
  const navigate = useNavigate();

  // Custom hooks chứa toàn bộ logic
  const {
    characterState,
    currentWheel,
    statStep,
    showDialog,
    dialogData,
    dispatch,
    jumpToWheel,
    handleNextStep: handleWheelStep,
    nextStep,
    resetWheels,
    handleGetData,
    handleCharacterComplete,
    setShowDialog,
    raceHandlers,
    audio,
  } = useCharacterWheel();

  const { audioRefs, audioSources } = useHouseAudios();

  // const { canvasRef, isSpinning, rolledResult, spin, resetAnimation } =
  //   useWheelAnimation(currentWheel);

  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);
  const [isSpinning, setIsSpinning] = React.useState(false);
  const [rolledResult, setRolledResult] = React.useState<Section | null>(null);
  const [showResetDialog, setShowResetDialog] = React.useState(false);

  // Handler for next step after spin result
  // const handleNextAfterSpin = React.useCallback(() => {
  //   if (!rolledResult || !currentWheel) return;
  //   handleWheelStep(currentWheel.key, rolledResult.name);
  //   resetAnimation();
  // }, [rolledResult, currentWheel, handleWheelStep, resetAnimation]);

  const handleNextAfterSpin = React.useCallback(() => {
    if (!rolledResult || !currentWheel) return;

    if (currentWheel.key === "pve") {
      handleCharacterComplete();
    } else {
      handleWheelStep(currentWheel.key, rolledResult.name);
    }
  }, [rolledResult, currentWheel, handleWheelStep]);

  const handleWheelRest = (result: number) => {
    audio(currentWheel.key, currentWheel.sections[result].name);
    setIsSpinning(false);
    setRolledResult(currentWheel.sections[result]);
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
    <div className="w-screen h-screen relative flex flex-col text-amber-200 font-serif overflow-auto">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${wheelBg})` }}
      />
      <div className="absolute inset-0 bg-black/70" />

      <div className="flex gap-3 h-fit z-10 px-2 relative mb-0.5">
        <button
          onClick={() => navigate("/")}
          disabled={isSpinning}
          className="px-2 min-w-[150px] max-w-[150px] bg-gray-700 border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-110 transition disabled:opacity-40"
        >
          Back
        </button>
        <button
          onClick={handleGetData}
          disabled={isSpinning}
          className="px-2 min-w-[150px] max-w-[150px] bg-[#3a2a18] border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-110 transition disabled:opacity-40"
        >
          Get Data
        </button>
        <button
          onClick={handleResetClick}
          disabled={isSpinning}
          className="px-2 min-w-[150px] max-w-[150px] bg-red-700 border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded-lg shadow hover:scale-110 transition disabled:opacity-40"
        >
          Reset All
        </button>
      </div>

      {/* Tooltip */}
      {hoverIndex != null &&
        (currentWheel.sections[hoverIndex].effect ||
          currentWheel.sections[hoverIndex].description) && (
          <div className="absolute space-y-4 top-8 left-0 whitespace-pre-line flex flex-col size-fit max-w-[600px] z-50 border-2 border-[#d4af37] bg-black/80 rounded-md p-4">
            <h1 className="text-4xl text-wrap wrap-break-word mb-4 font-bold text-amber-200">
              {currentWheel.sections[hoverIndex].name}
            </h1>
            {currentWheel.sections[hoverIndex].description && (
              <p>{currentWheel.sections[hoverIndex].description}</p>
            )}
            {currentWheel.sections[hoverIndex].effect && (
              <p className="space-y-2 text-amber-200">
                {currentWheel.sections[hoverIndex].effect}
              </p>
            )}
          </div>
        )}

      {/* Main Layout */}
      <div className="flex flex-1 z-10 justify-between">
        <div
          className="w-[30%]"
          style={
            {
              // Disable mouse event when spinning
              // pointerEvents: isSpinning ? "none" : "auto",
            }
          }
        >
          <LeftPanel
            characterState={characterState}
            dispatch={dispatch}
            jumpToWheel={jumpToWheel}
            handleNextStep={handleWheelStep}
            statStep={statStep}
            raceHandlers={raceHandlers}
          />
        </div>
        {/* <CenterWheel
          currentWheel={currentWheel}
          rolledResult={rolledResult}
          canvasRef={canvasRef}
          isSpinning={isSpinning}
          spin={spin}
          nextStep={handleNextAfterSpin}
          resetWheels={resetWheels}
          handleGetData={handleGetData}
          handleCharacterComplete={handleCharacterComplete}
        /> */}
        <div className="flex justify-center relative w-full">
          <Wheel
            width={850}
            height={850}
            title={currentWheel.title}
            items={currentWheel.sections}
            onStartSpin={() => {
              setIsSpinning(true);
            }}
            onMouseEnter={(index) => {
              setHoverIndex(index);
            }}
            onMouseLeave={() => {
              setHoverIndex(null);
            }}
            onRest={handleWheelRest}
            handleNext={handleNextAfterSpin}
          />
        </div>
        <div
          className="w-[30%]"
          style={
            {
              // pointerEvents: isSpinning ? "none" : "auto",
            }
          }
        >
          <RightPanel
            characterState={characterState}
            jumpToWheel={jumpToWheel}
          />
        </div>
      </div>

      {/* Audio Elements */}
      {Object.entries(audioSources).map(([house, src]) => (
        <audio key={house} ref={audioRefs[house]} src={src} preload="auto" />
      ))}

      {/* Dialog */}
      <CharacterDataDialog
        showDialog={showDialog}
        dialogData={dialogData}
        onClose={() => setShowDialog(false)}
      />

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
}
