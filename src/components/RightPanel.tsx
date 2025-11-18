import React, { useState } from "react";

// ============ SIZE CONFIGURATION ============
const SIZES = {
  // Container
  container: {
    gap: "gap-1",
    padding: "p-2",
    border: "border-2",
  },
  // Section Headers
  legend: {
    fontSize: "text-base",
    padding: "py-1 px-2",
    border: "border",
  },
  // Weapons Section
  weapons: {
    gridCols: "grid-cols-2",
    gap: "gap-2",
    minHeight: "min-h-[80px]",
    maxHeight: "max-h-[80px]",
    imageSize: "w-16 h-16",
    enchantDot: "w-1.5 h-1.5",
    enchantGap: "space-x-1",
    padding: "p-1.5",
    border: "border-2",
  },
  // Quirks Section
  quirks: {
    fontSize: "text-base",
    padding: "ml-4",
    gap: "space-y-1",
    minHeight: "min-h-[60px]",
    maxHeight: "max-h-[60px]",
  },
  // Gear Section
  gears: {
    fontSize: "text-sm",
    padding: "pl-6",
    gap: "space-y-1",
    minHeight: "min-h-[100px]",
    maxHeight: "max-h-[100px]",
    listPadding: "pr-2",
  },
  // Powers Section
  powers: {
    fontSize: "text-sm",
    padding: "pl-6",
    gap: "space-y-1",
    minHeight: "min-h-[80px]",
    maxHeight: "max-h-[80px]",
    listPadding: "pr-2",
  },
  // PvE Section
  pve: {
    fontSize: "text-sm",
    padding: "pl-6",
    gap: "space-y-1",
    minHeight: "min-h-[100px]",
    maxHeight: "max-h-[100px]",
    listPadding: "pr-2",
  },
  // Character Info Section
  characterInfo: {
    fontSize: "text-sm",
    padding: "p-2",
    minHeight: "min-h-[100px]",
  },
  // Tooltip
  tooltip: {
    padding: "p-3",
    maxWidth: "max-w-xs",
    titleSize: "text-base",
    textSize: "text-sm",
  },
};
// ==========================================

interface RightPanelProps {
  characterState: any;
  jumpToWheel: (wheelKey: string) => void;
  characterInfo: string;
  setCharacterInfo: (info: string) => void;
}

interface TooltipProps {
  weapon: any;
  children: React.ReactNode;
}

const WeaponTooltip: React.FC<TooltipProps> = ({ weapon, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getTooltipContent = () => {
    const enchantNames =
      weapon.enchants?.map((e: any) => e.name).join(" ") || "";
    const usabilityText = weapon.usable ? "Dùng được" : "Không dùng được";

    return (
      <div className={`bg-black/90 text-white ${SIZES.tooltip.padding} rounded-lg shadow-lg border border-amber-400 ${SIZES.tooltip.maxWidth}`}>
        <div className={`font-bold text-amber-300 mb-1 ${SIZES.tooltip.titleSize}`}>
          {`${enchantNames} ${weapon.name}`}
        </div>
        <div
          className={`${SIZES.tooltip.textSize} ${
            weapon.usable ? "text-green-400" : "text-red-400"
          }`}
        >
          {usabilityText}
        </div>
      </div>
    );
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 min-w-[200px]">
          {getTooltipContent()}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-amber-400"></div>
        </div>
      )}
    </div>
  );
};

export const RightPanel: React.FC<RightPanelProps> = ({
  characterState,
  jumpToWheel,
  characterInfo,
  setCharacterInfo,
}) => {
  const handleSectionClick = (sectionKey: string) => {
    jumpToWheel(sectionKey);
  };

  const getWeaponBorderClass = (weapon: any) => {
    if (!weapon.usable) {
      return `${SIZES.weapons.border} border-red-500 bg-red-900/20`;
    }

    const isUnique = weapon.isUnique || weapon.type === "unique";
    const hasEnchants = weapon.enchants && weapon.enchants.length > 0;

    if (isUnique && hasEnchants) {
      return `${SIZES.weapons.border} border-amber-400 bg-black/50 animate-pulse shadow-[0_0_15px_rgba(255,215,0,0.8)]`;
    } else if (isUnique) {
      return `${SIZES.weapons.border} border-purple-400 bg-black/50 animate-pulse shadow-[0_0_15px_rgba(147,51,234,0.8)]`;
    } else if (hasEnchants) {
      return `${SIZES.weapons.border} border-white bg-black/50 animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.8)]`;
    }

    return "border border-[#d4af37] bg-black/50";
  };

  return (
    <div className={`flex flex-col ${SIZES.container.gap} ${SIZES.container.border} border-[#5a2d0c] ${SIZES.container.padding} rounded-xl shadow-[0_0_30px_rgba(200,50,0,0.8)] bg-black/70 h-full overflow-y-auto`}>
      {/* Weapons Section */}
      <fieldset className={`${SIZES.legend.border} border-[#d4af37] ${SIZES.legend.padding} rounded-md bg-black/50 ${SIZES.legend.fontSize}`}>
        <legend
          onClick={() => handleSectionClick("weapon")}
          className="font-bold underline text-[#f5e6d3] cursor-pointer hover:text-amber-400"
        >
          Weapons
        </legend>
        <div className={`grid ${SIZES.weapons.gridCols} ${SIZES.weapons.gap} ${SIZES.weapons.minHeight} ${SIZES.weapons.maxHeight}`}>
          {Array.from({ length: 2 }).map((_, idx) => {
            const weapon = characterState.weapons[idx];
            return weapon ? (
              <WeaponTooltip key={idx} weapon={weapon}>
                <div
                  className={`flex ${SIZES.weapons.minHeight} ${SIZES.weapons.maxHeight} flex-col items-center rounded ${SIZES.weapons.padding} transition-all duration-300 ${getWeaponBorderClass(
                    weapon
                  )}`}
                >
                  <div className={`${SIZES.weapons.imageSize} flex items-center justify-center text-white rounded`}>
                    {weapon.image ? (
                      <img
                        src={weapon.image}
                        alt={weapon.name}
                        className={`${SIZES.weapons.imageSize} object-contain rounded`}
                      />
                    ) : (
                      <div className={`${SIZES.weapons.imageSize} bg-gray-700 flex items-center justify-center text-xs text-center rounded`}>
                        No Img
                      </div>
                    )}
                  </div>
                  {weapon.enchants && weapon.enchants.length > 0 && (
                    <div className={`flex ${SIZES.weapons.enchantGap} mt-1`}>
                      {weapon.enchants.map((_: any, enchantIdx: number) => (
                        <div
                          key={enchantIdx}
                          className={`${SIZES.weapons.enchantDot} bg-amber-400 rounded-full animate-pulse`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </WeaponTooltip>
            ) : (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center border border-gray-500 rounded ${SIZES.weapons.padding} bg-black/40 text-gray-400 ${SIZES.weapons.minHeight} ${SIZES.weapons.maxHeight}`}
              >
                Empty
              </div>
            );
          })}
        </div>
      </fieldset>

      {/* Quirks Section */}
      <fieldset className={`${SIZES.legend.border} border-[#d4af37] ${SIZES.legend.padding} rounded-md bg-black/50 ${SIZES.legend.fontSize} flex flex-col`}>
        <legend
          onClick={() => handleSectionClick("quirk")}
          className="font-bold underline text-[#f5e6d3] cursor-pointer hover:text-amber-400"
        >
          Quirks
        </legend>
        <ul className={`${SIZES.quirks.padding} ${SIZES.quirks.gap} ${SIZES.quirks.fontSize} overflow-y-auto ${SIZES.quirks.maxHeight} ${SIZES.quirks.minHeight}`}>
          {characterState.quirks.length > 0 ? (
            characterState.quirks.map((quirk: any, i: number) => (
              <li key={i} className="text-amber-300">
                • {quirk.name}
              </li>
            ))
          ) : (
            <li className="text-gray-400">No quirks</li>
          )}
        </ul>
      </fieldset>

      {/* Gear Section */}
      <fieldset className={`flex flex-col ${SIZES.gears.minHeight} ${SIZES.gears.maxHeight} overflow-y-auto ${SIZES.legend.border} border-[#d4af37] ${SIZES.legend.padding} rounded-md bg-black/50 ${SIZES.legend.fontSize}`}>
        <legend
          onClick={() => handleSectionClick("gear")}
          className="font-bold underline text-[#f5e6d3] cursor-pointer hover:text-amber-400"
        >
          Gear
        </legend>
        <div className="max-h-40 overflow-y-auto pr-2">
          <ul className={`list-disc ${SIZES.gears.padding} ${SIZES.gears.gap}`}>
            {characterState.gears.map((gear: any, idx: number) => (
              <li key={idx} className={`text-yellow-300 ${SIZES.gears.fontSize}`}>
                {gear.name}
                {!gear.usable && " - Unusable"}
              </li>
            ))}
            {characterState.legacyGears.map((gear: any, idx: number) => (
              <li
                key={`legacy-${idx}`}
                className={`text-yellow-300 font-bold animate-pulse drop-shadow-[0_0_6px_gold] ${SIZES.gears.fontSize}`}
              >
                {gear.name}
                {!gear.usable && " - Unusable"}
              </li>
            ))}
            {characterState.gears.length === 0 &&
              characterState.legacyGears.length === 0 && (
                <li className={`text-gray-400 ${SIZES.gears.fontSize}`}>No gear</li>
              )}
          </ul>
        </div>
      </fieldset>

      {/* Powers Section */}
      <fieldset className={`flex flex-col ${SIZES.legend.border} border-[#d4af37] ${SIZES.legend.padding} rounded-md bg-black/50 ${SIZES.legend.fontSize}`}>
        <legend
          onClick={() => handleSectionClick("power")}
          className="font-bold underline text-[#f5e6d3] cursor-pointer hover:text-amber-400"
        >
          Powers ({characterState.powers?.length || 0})
        </legend>
        <div className="max-h-40 overflow-y-auto pr-2">
          <ul className={`list-disc ${SIZES.powers.padding} ${SIZES.powers.gap} ${SIZES.powers.minHeight} ${SIZES.powers.maxHeight} overflow-y-auto`}>
            {characterState.powers && characterState.powers.length > 0 ? (
              characterState.powers.map((power: any, idx: number) => (
                <li key={idx} className={`text-yellow-300 ${SIZES.powers.fontSize}`}>
                  {power.name}
                </li>
              ))
            ) : (
              <li className={`text-gray-400 ${SIZES.powers.fontSize}`}>No powers</li>
            )}
          </ul>
        </div>
      </fieldset>

      {/* PvE Section */}
      <fieldset className={`flex flex-col ${SIZES.legend.border} border-[#d4af37] ${SIZES.legend.padding} rounded-md bg-black/50 ${SIZES.legend.fontSize}`}>
        <legend
          onClick={() => jumpToWheel("pve")}
          className="font-bold underline text-[#f5e6d3] cursor-pointer hover:text-amber-400"
        >
          PvE Scenarios
        </legend>
        <div className="max-h-40 overflow-y-auto pr-2">
          <ul className={`list-disc ${SIZES.pve.padding} ${SIZES.pve.gap} ${SIZES.pve.minHeight} ${SIZES.pve.maxHeight} overflow-y-auto`}>
            {characterState.pveRounds.length > 0 ? (
              characterState.pveRounds.map((pve: any, idx: number) => (
                <li key={idx} className={`text-yellow-300 ${SIZES.pve.fontSize}`}>
                  {pve.name}
                </li>
              ))
            ) : (
              <li className={`text-gray-400 ${SIZES.pve.fontSize}`}>No PvE scenarios</li>
            )}
          </ul>
        </div>
      </fieldset>

      {/* Character Info Section */}
      <fieldset className={`flex flex-col ${SIZES.legend.border} border-[#d4af37] ${SIZES.legend.padding} rounded-md bg-black/50 ${SIZES.legend.fontSize}`}>
        <legend className="font-bold text-[#f5e6d3]">
          Character Info
        </legend>
        <textarea
          value={characterInfo}
          onChange={(e) => setCharacterInfo(e.target.value)}
          className={`w-full ${SIZES.characterInfo.minHeight} ${SIZES.characterInfo.padding} ${SIZES.characterInfo.fontSize} bg-black/70 text-yellow-300 border border-[#d4af37] rounded resize-none focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400`}
          placeholder="Enter character information..."
        />
      </fieldset>
    </div>
  );
};