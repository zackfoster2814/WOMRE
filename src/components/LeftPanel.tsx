import React, { useRef, useState, useCallback } from "react";
import { raceWheel } from "@/Common/Config/RaceConfig";
import { subraceMap } from "@/Common/Config/SubRaceConfig";
import { STAT_WHEELS } from "@/utils/wheelUtils";
import { useRaceHandlers } from "@/hooks/handlers/useRaceHandlers";

// ============ SIZE CONFIGURATION ============
const SIZES = {
  // Container
  container: {
    gap: "gap-4",
    padding: "p-3",
    border: "border-2",
  },
  // Character Image
  image: {
    width: "w-43",
    height: "h-43",
    border: "border-2",
    fontSize: "text-lg",
  },
  // Name Input
  nameInput: {
    border: "border",
    padding: "p-1.5",
    fontSize: "text-base",
    inputPadding: "px-2 py-0.5",
  },
  // Race/Subrace Section
  raceSection: {
    border: "border",
    padding: "p-1.5",
    fontSize: "text-base",
    gap: "gap-2",
    selectPadding: "px-2 py-0.5",
    selectHeight: "h-[38px]",
  },
  // Uma Parents
  umaParents: {
    gap: "gap-2",
    selectHeight: "h-[38px]",
    selectPadding: "px-2",
  },
  // Info Rows (Archetype, House, Char Dev)
  infoRow: {
    border: "border",
    padding: "p-1.5",
    fontSize: "text-base",
  },
  // Stats Section
  stats: {
    border: "border",
    padding: "p-2.5",
    gap: "gap-2",
    fontSize: "text-base",
    legendSize: "text-lg",
    legendMargin: "mb-1.5",
  },
};
// ==========================================

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

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log("Name change:", e.target.value); // Debug log
      dispatch({ type: "SET_CHARACTER_NAME", name: e.target.value });
    },
    [dispatch]
  );

  const handleBlur = useCallback(() => {
    console.log("Input blur"); // Debug log
    setShouldAutoFocus(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur();
      }
    },
    []
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
        if (characterState.results["uma-parent-2"] === value) {
          dispatch({ type: "SET_RESULT", key: "uma-parent-2", value: "" });
        }
        if (value) {
          raceHandlers.applyUmaParentAbilities(value, dispatch);
        }
      } else if (parentKey === "uma-parent-2") {
        if (value) {
          raceHandlers.applyUmaParentAbilities(value, dispatch);
        }
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
    <div className={`flex flex-col ${SIZES.container.gap} ${SIZES.container.border} border-[#5a2d0c] ${SIZES.container.padding} rounded-lg shadow-[0_0_20px_rgba(200,50,0,0.6)] bg-black/70`}>
      {/* Character Name and Image Row */}
      <div className="flex gap-2">
        {/* Character Name Input */}
        <div className={`${SIZES.nameInput.border} border-[#d4af37] ${SIZES.nameInput.padding} text-center rounded bg-black/50 ${SIZES.nameInput.fontSize} font-bold tracking-wide flex flex-col gap-1.5 flex-1`}>
          <span>Tên nhân vật</span>
          <input
            type="text"
            ref={inputRef}
            value={characterState.characterName}
            onChange={handleNameChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tên nhân vật..."
            className={`text-center bg-black/30 text-amber-200 border border-[#d4af37] rounded ${SIZES.nameInput.inputPadding} focus:outline-none focus:ring-2 focus:ring-amber-400`}
            autoComplete="off"
            spellCheck="false"
            autoFocus={shouldAutoFocus}
          />
        </div>

        {/* Character Image Placeholder */}
        <div className={`${SIZES.image.border} border-[#d4af37] bg-black/60 ${SIZES.image.width} ${SIZES.image.height} flex items-center justify-center rounded-md text-amber-200 font-bold ${SIZES.image.fontSize} shadow-[0_0_15px_rgba(255,215,0,0.5)] shrink-0`}></div>
      </div>

      {/* Race Selection */}
      <div className={`${SIZES.raceSection.border} border-[#d4af37] ${SIZES.raceSection.padding} flex items-center ${SIZES.raceSection.gap} rounded bg-black/50 ${SIZES.raceSection.fontSize}`}>
        <label
          className="font-bold shrink-0 cursor-pointer hover:underline"
          onClick={handleRaceRoll}
        >
          Race
        </label>
        <select
          value={characterState.results.race || ""}
          onChange={(e) => handleRaceChange(e.target.value)}
          className={`bg-black/30 text-amber-200 ${SIZES.raceSection.selectPadding} ${SIZES.raceSection.selectHeight} flex-1`}
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
      </div>

      {/* Subrace/Uma Parents Selection */}
      {characterState.results.race === "Uma" ? (
        <div className="space-y-1.5">
          <div className={`flex justify-between items-center ${SIZES.umaParents.gap} w-full`}>
            <select
              value={characterState.results["uma-parent-1"] || ""}
              onChange={(e) =>
                handleUmaParentChange("uma-parent-1", e.target.value)
              }
              className={`bg-black/30 text-amber-200 border border-[#d4af37] rounded ${SIZES.umaParents.selectPadding} ${SIZES.umaParents.selectHeight} flex-1`}
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
              className={`bg-black/30 text-amber-200 border border-[#d4af37] rounded ${SIZES.umaParents.selectPadding} ${SIZES.umaParents.selectHeight} flex-1`}
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

          {recentlyAdded.length > 0 && (
            <div className="bg-green-900/50 border border-green-500 p-1.5 rounded text-xs">
              <div className="text-green-300 font-bold mb-0.5">
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
          className={`bg-black/30 text-amber-200 border border-[#d4af37] rounded ${SIZES.umaParents.selectPadding} ${SIZES.umaParents.selectHeight} w-full`}
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
      <div className={`${SIZES.infoRow.border} border-[#d4af37] ${SIZES.infoRow.padding} flex justify-between rounded bg-black/50 ${SIZES.infoRow.fontSize}`}>
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
      <div className={`${SIZES.infoRow.border} border-[#d4af37] ${SIZES.infoRow.padding} flex justify-between rounded bg-black/50 ${SIZES.infoRow.fontSize}`}>
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
      <div className={`${SIZES.infoRow.border} border-[#d4af37] ${SIZES.infoRow.padding} flex justify-between rounded bg-black/50 ${SIZES.infoRow.fontSize}`}>
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
      <fieldset className={`${SIZES.stats.border} border-[#d4af37] ${SIZES.stats.padding} flex flex-col ${SIZES.stats.gap} rounded bg-black/50 ${SIZES.stats.fontSize}`}>
        <legend className={`font-bold underline text-[#f5e6d3] ${SIZES.stats.legendSize} ${SIZES.stats.legendMargin}`}>
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
              className={`flex justify-between cursor-pointer hover:text-amber-400 ${SIZES.stats.fontSize}`}
              onClick={() => handleStatClick(statKey)}
            >
              <span>{displayNames[statKey]}</span>
              <span className={colors[statKey]}>
                {characterState.stats[statKey] || "x"}
              </span>
            </div>
          );
        })}
      </fieldset>
    </div>
  );
};