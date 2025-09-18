import React, { useRef, useState, useCallback } from "react";
import { raceWheel } from "@/Common/Config/RaceConfig";
import { subraceMap } from "@/Common/Config/SubRaceConfig";
import { STAT_WHEELS } from "@/utils/wheelUtils";
import { useRaceHandlers } from "@/hooks/handlers/useRaceHandlers";

interface LeftPanelProps {
  characterState: any;
  dispatch: React.Dispatch<any>;
  jumpToWheel: (wheelKey: string) => void;
  handleNextStep: (key: string, resultName: string) => void;
  statStep?: number;
  raceHandlers: ReturnType<typeof useRaceHandlers>;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  characterState,
  dispatch,
  jumpToWheel,
  handleNextStep,
  statStep = 0,
  raceHandlers,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shouldAutoFocus, setShouldAutoFocus] = useState(true);
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);

  // Uma ability names mapping
  const UMA_ABILITY_NAMES = {
    Maruzensky: "Red Shift/LP1211-M",
    "Mejiro Ryan": "Let's Pump Some Iron!",
    "Taiki Shuttle": "Shooting for Victory",
    "Gold Ship": "Training Restricted",
    "Agnes Tachyon": "U=ma2",
  };

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch({ type: "SET_CHARACTER_NAME", name: e.target.value });
    },
    [dispatch]
  );

  // Xử lý khi input mất focus
  const handleBlur = useCallback(() => {
    setShouldAutoFocus(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  }, []);

  // Xử lý phím Enter
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleBlur();
      }
    },
    [handleBlur]
  );

  const handleRaceChange = useCallback(
    (value: string) => {
      dispatch({ type: "SET_RESULT", key: "race", value });
      handleNextStep("race", value);
      handleBlur();
    },
    [dispatch, handleNextStep, handleBlur]
  );

  const handleRaceRoll = useCallback(() => {
    jumpToWheel("race");
    handleBlur();
  }, [jumpToWheel, handleBlur]);

  const handleSubraceChange = useCallback(
    (value: string) => {
      dispatch({ type: "SET_RESULT", key: "subrace", value });
      handleBlur();
    },
    [dispatch, handleBlur]
  );

  const handleUmaParentChange = useCallback(
    (parentKey: string, value: string) => {
      dispatch({ type: "SET_RESULT", key: parentKey, value });

      if (parentKey === "uma-parent-1") {
        // Reset parent 2 if same as parent 1
        if (characterState.results["uma-parent-2"] === value) {
          dispatch({ type: "SET_RESULT", key: "uma-parent-2", value: "" });
        }

        // Apply parent 1 abilities immediately
        if (value) {
          raceHandlers.applyUmaParentAbilities(value, dispatch);
        }
      } else if (parentKey === "uma-parent-2") {
        // Apply parent 2 abilities immediately
        if (value) {
          raceHandlers.applyUmaParentAbilities(value, dispatch);
        }

        // Set combined subrace
        const parent1 = characterState.results["uma-parent-1"];
        if (parent1) {
          dispatch({
            type: "SET_RESULT",
            key: "subrace",
            value: `${parent1} - ${value}`,
          });
        }
      }

      handleBlur();
    },
    [characterState.results, dispatch, handleBlur, raceHandlers]
  );

  const handleStatClick = useCallback(
    (statKey: string) => {
      jumpToWheel(statKey);
      handleBlur();
    },
    [jumpToWheel, handleBlur]
  );
  // Calculate total base stat
  const totalBaseStat = STAT_WHEELS.reduce((sum, statKey) => {
    const statValue = parseInt(characterState.stats[statKey], 10);
    return sum + (isNaN(statValue) ? 0 : statValue);
  }, 0);

  const handleArchetypeClick = useCallback(() => {
    jumpToWheel("archetype");
    handleBlur();
  }, [jumpToWheel, handleBlur]);

  const handleHouseClick = useCallback(() => {
    jumpToWheel("house");
    handleBlur();
  }, [jumpToWheel, handleBlur]);

  const handleCharDevClick = useCallback(() => {
    jumpToWheel("charDev");
    handleBlur();
  }, [jumpToWheel, handleBlur]);

  return (
    <div className="flex flex-col gap-4 border-2 border-[#5a2d0c] p-3 rounded-lg shadow-[0_0_20px_rgba(200,50,0,0.6)] bg-black/70">
      {/* Character Image Placeholder */}
      <div className="border-2 border-[#d4af37] bg-black/60 h-35 flex items-center justify-center rounded-md text-amber-200 font-bold text-xl shadow-[0_0_15px_rgba(255,215,0,0.5)]"></div>

      {/* Character Name Input */}
      <div className="border border-[#d4af37] p-2 text-center rounded bg-black/50 text-lg font-bold tracking-wide flex flex-col gap-2">
        <span>Tên nhân vật</span>
        <input
          type="text"
          ref={inputRef}
          value={characterState.characterName}
          onChange={handleNameChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tên nhân vật..."
          className="text-center bg-black/30 text-amber-200 border border-[#d4af37] rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
          autoComplete="off"
          spellCheck="false"
          autoFocus={shouldAutoFocus}
        />
      </div>

      {/* Race Selection */}
      <div className="border border-[#d4af37] p-2 flex items-center gap-2 rounded bg-black/50 text-lg">
        <label
          className="font-bold shrink-0 cursor-pointer hover:underline"
          onClick={handleRaceRoll}
        >
          Race
        </label>
        <select
          value={characterState.results.race || ""}
          onChange={(e) => handleRaceChange(e.target.value)}
          className="bg-black/30 text-amber-200 px-2 py-1 flex-1 "
        >
          <option value="" disabled>
            -- Chọn Race --
          </option>
          {raceWheel.sections.map((sec) => (
            <option key={sec.name} value={sec.name}>
              {sec.name}
            </option>
          ))}
        </select>
        {/* <button
          onClick={handleRaceRoll}
          className="px-2 py-1 bg-[#3a2a18] border border-[#8a5b1a] text-[#f5e6d3] font-bold rounded shadow hover:scale-110 transition"
        >
          Roll
        </button> */}
      </div>

      {/* Subrace/Uma Parents Selection */}
      {characterState.results.race === "Uma" ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-2 w-full">
            <select
              value={characterState.results["uma-parent-1"] || ""}
              onChange={(e) =>
                handleUmaParentChange("uma-parent-1", e.target.value)
              }
              className="bg-black/30 text-amber-200 border border-[#d4af37] rounded px-2 h-[45px] flex-1"
            >
              <option value="" disabled>
                -- Parent 1 --
              </option>
              {subraceMap["Uma"].map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <span className="text-amber-300 font-bold px-2">+</span>
            <select
              value={characterState.results["uma-parent-2"] || ""}
              onChange={(e) =>
                handleUmaParentChange("uma-parent-2", e.target.value)
              }
              className="bg-black/30 text-amber-200 border border-[#d4af37] rounded px-2 h-[45px] flex-1"
            >
              <option value="" disabled>
                -- Parent 2 --
              </option>
              {subraceMap["Uma"]
                .filter(
                  (s) => s.name !== characterState.results["uma-parent-1"]
                )
                .map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Uma Abilities Feedback */}
          {recentlyAdded.length > 0 && (
            <div className="bg-green-900/50 border border-green-500 p-2 rounded text-sm">
              <div className="text-green-300 font-bold mb-1">
                Abilities Added:
              </div>
              {recentlyAdded.map((ability, index) => (
                <div key={index} className="text-green-200 animate-pulse">
                  + {ability}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <select
          value={characterState.results.subrace || ""}
          onChange={(e) => handleSubraceChange(e.target.value)}
          className="bg-black/30 text-amber-200 border border-[#d4af37] rounded px-2 h-[45px] w-full"
        >
          <option value="" disabled>
            -- Chọn Subrace --
          </option>
          {(subraceMap[characterState.results.race] || []).map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      {/* Archetype */}
      <div className="border border-[#d4af37] p-2 flex justify-between rounded bg-black/50 text-lg">
        <span
          onClick={handleArchetypeClick}
          className="cursor-pointer hover:text-amber-400 hover:underline"
        >
          Archetype
        </span>
        <span className="text-amber-300">
          {characterState.archetypes.length > 0
            ? characterState.archetypes.map((a: any) => a.name).join(", ")
            : "???"}
        </span>
      </div>

      {/* House */}
      <div className="border border-[#d4af37] p-2 flex justify-between rounded bg-black/50 text-lg">
        <span
          onClick={handleHouseClick}
          className="cursor-pointer hover:text-amber-400 hover:underline"
        >
          House
        </span>
        <span className="text-amber-300">
          {characterState.results.house || "???"}
        </span>
      </div>

      {/* Character Development */}
      <div className="border border-[#d4af37] p-2 flex justify-between rounded bg-black/50 text-lg">
        <span
          onClick={handleCharDevClick}
          className="cursor-pointer hover:text-amber-400 hover:underline"
        >
          Char dev
        </span>
        <span className="text-amber-300">
          {characterState.charDevs.length > 0
            ? characterState.charDevs.map((dev: any) => dev.name).join(", ")
            : "???"}
        </span>
      </div>

      {/* Stats Section */}
      <fieldset className="border border-[#d4af37] p-4 flex flex-col gap-3 rounded bg-black/50 text-lg">
        <legend className="font-bold underline text-[#f5e6d3] text-xl mb-2">
          Stats
        </legend>

        {STAT_WHEELS.map((statKey) => {
          const colors: Record<string, string> = {
            strength: "text-red-400",
            speed: "text-green-400",
            durability: "text-blue-400",
            iq: "text-purple-300",
            battleIQ: "text-yellow-300",
            martialArts: "text-orange-400",
            
          };

          const displayNames: Record<string, string> = {
            strength: "Strength",
            speed: "Speed",
            durability: "Durability",
            iq: "IQ",
            battleIQ: "Battle IQ",
            martialArts: "Martial Arts",
          };

          return (
            <div
              key={statKey}
              className="flex justify-between cursor-pointer hover:text-amber-400 text-lg"
              onClick={() => handleStatClick(statKey)}
            >
              <span>{displayNames[statKey]}</span>
              <span className={colors[statKey]}>
                {characterState.stats[statKey] || "x"}
              </span>
            </div>
          );
        })}

        {/* Total Base Stat */}
        <div className="flex justify-between text-lg mt-2 pt-2 border-t border-[#d4af37]">
          <span className="font-bold">Total Base Stat</span>
          <span className="text-amber-300">{totalBaseStat}</span>
        </div>
      </div>
    </div>
  );
};