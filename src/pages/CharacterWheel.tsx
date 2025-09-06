import React from "react";
import { useCharacterWheel } from "@/hooks/useCharacterWheel.ts";
import { useWheelAnimation } from "@/hooks/useWheelAnimation.ts";
import { useHouseAudios } from "@/Common/Config/HouseConfig.ts";
import { LeftPanel } from "@/components/LeftPanel.tsx";
import { CenterWheel } from "@/components/CenterWheel.tsx";
import { RightPanel } from "@/components/RightPanel.tsx";
import { CharacterDataDialog } from "@/components/CharacterDataDialog.tsx";

export default function CharacterWheel() {
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
  } = useCharacterWheel();

  const { audioRefs, audioSources } = useHouseAudios();

  const { canvasRef, isSpinning, rolledResult, spin, resetAnimation } =
    useWheelAnimation(currentWheel);

  // Handler for next step after spin result
  const handleNextAfterSpin = React.useCallback(() => {
    if (!rolledResult || !currentWheel) return;
    handleWheelStep(currentWheel.key, rolledResult.name);
    resetAnimation();
  }, [rolledResult, currentWheel, handleWheelStep, resetAnimation]);

  return (
    <div className="w-screen h-screen relative flex flex-col text-amber-200 font-serif">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('./assets/Backgrounds/wheel-bg.png')" }}
      />
      <div className="absolute inset-0 bg-black/70" />

      {/* Main Layout */}
      <div className="flex flex-1 z-10">
        <LeftPanel
          characterState={characterState}
          dispatch={dispatch}
          jumpToWheel={jumpToWheel}
          handleNextStep={handleWheelStep}
          statStep={statStep}
          raceHandlers={raceHandlers}
        />

        <CenterWheel
          currentWheel={currentWheel}
          rolledResult={rolledResult}
          canvasRef={canvasRef}
          isSpinning={isSpinning}
          spin={spin}
          nextStep={handleNextAfterSpin}
          resetWheels={resetWheels}
          handleGetData={handleGetData}
          handleCharacterComplete={handleCharacterComplete}
        />

        <RightPanel characterState={characterState} jumpToWheel={jumpToWheel} />
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
    </div>
  );
}
