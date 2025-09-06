import React, { useState } from "react";

interface RightPanelProps {
  characterState: any;
  jumpToWheel: (wheelKey: string) => void;
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
      <div className="bg-black/90 text-white p-3 rounded-lg shadow-lg border border-amber-400 max-w-xs">
        <div className="font-bold text-amber-300 mb-1">
          {`${enchantNames} ${weapon.name}`}
        </div>
        <div
          className={`text-sm ${
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
}) => {
  const handleSectionClick = (sectionKey: string) => {
    jumpToWheel(sectionKey);
  };

  const getWeaponBorderClass = (weapon: any) => {
    if (!weapon.usable) {
      return "border-red-500 border-2 bg-red-900/20";
    }

    const isUnique = weapon.isUnique || weapon.type === "unique";
    const hasEnchants = weapon.enchants && weapon.enchants.length > 0;

    if (isUnique && hasEnchants) {
      // Unique weapon with enchants - Golden glow
      return "border-2 border-amber-400 bg-black/50 animate-pulse shadow-[0_0_15px_rgba(255,215,0,0.8)]";
    } else if (isUnique) {
      // Unique weapon only - Purple glow
      return "border-2 border-purple-400 bg-black/50 animate-pulse shadow-[0_0_15px_rgba(147,51,234,0.8)]";
    } else if (hasEnchants) {
      // Regular weapon with enchants - White glow
      return "border-2 border-white bg-black/50 animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.8)]";
    }

    return "border border-[#d4af37] bg-black/50";
  };

  return (
    <div className="w-[20%] flex flex-col gap-1 border-4 border-[#5a2d0c] p-4 rounded-xl shadow-[0_0_30px_rgba(200,50,0,0.8)] bg-black/70 h-full overflow-y-auto">
      {/* Weapons Section */}
      <div className="border-2 border-[#d4af37] p-4 rounded-md bg-black/50 text-xl min-h-[200px] max-h-[200px]">
        <p
          onClick={() => handleSectionClick("weapon")}
          className="font-bold underline text-[#f5e6d3] cursor-pointer hover:text-amber-400"
        >
          Weapons
        </p>
        <div className="pt-2 grid grid-cols-2 gap-2 min-h-[120px] max-h-[120px]">
          {Array.from({ length: 2 }).map((_, idx) => {
            const weapon = characterState.weapons[idx];
            return weapon ? (
              <WeaponTooltip key={idx} weapon={weapon}>
                <div
                  className={`flex min-h-[120px] max-h-[120px] flex-col items-center rounded p-2 transition-all duration-300 ${getWeaponBorderClass(
                    weapon
                  )}`}
                >
                  <div className="w-20 h-20 flex items-center justify-center text-white mb-2 rounded">
                    {weapon.image ? (
                      <img
                        src={weapon.image}
                        alt={weapon.name}
                        className="w-20 h-20 object-contain rounded"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-700 flex items-center justify-center text-xs text-center rounded">
                        No Img
                      </div>
                    )}
                  </div>
                  {/* Enchant indicator */}
                  {weapon.enchants && weapon.enchants.length > 0 && (
                    <div className="flex space-x-1 mt-1">
                      {weapon.enchants.map((_: any, enchantIdx: number) => (
                        <div
                          key={enchantIdx}
                          className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </WeaponTooltip>
            ) : (
              <div
                key={idx}
                className="flex flex-col items-center justify-center border border-gray-500 rounded p-2 bg-black/40 text-gray-400 min-h-[120px] max-h-[120px]"
              >
                Empty
              </div>
            );
          })}
        </div>
      </div>

      {/* Quirks Section */}
      <div className="border-2 border-[#d4af37] p-4 rounded-md bg-black/50 text-xl flex flex-col">
        <p
          onClick={() => handleSectionClick("quirk")}
          className="font-bold underline text-[#f5e6d3] cursor-pointer hover:text-amber-400"
        >
          Quirks
        </p>
        <ul className="ml-4 space-y-2 text-lg mt-3 overflow-y-auto max-h-[90px] min-h-[90px]">
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
      </div>

      {/* Gear Section */}
      <div className="border-2 border-[#d4af37] p-4 rounded-md bg-black/50 text-xl flex flex-col">
        <div className="flex flex-col min-h-[130px] max-h-[130px] overflow-y-auto">
          <p
            onClick={() => handleSectionClick("gear")}
            className="font-bold underline text-[#f5e6d3] cursor-pointer hover:text-amber-400"
          >
            Gear
          </p>
          <div className="max-h-40 overflow-y-auto pr-2">
            <ul className="list-disc pl-6 space-y-1">
              {/* Regular Gears */}
              {characterState.gears.map((gear: any, idx: number) => (
                <li key={idx} className="text-yellow-300">
                  {gear.name}
                  {!gear.usable && " - Unusable"}
                </li>
              ))}
              {/* Legacy Gears */}
              {characterState.legacyGears.map((gear: any, idx: number) => (
                <li
                  key={`legacy-${idx}`}
                  className="text-yellow-300 font-bold animate-pulse drop-shadow-[0_0_6px_gold]"
                >
                  {gear.name}
                  {!gear.usable && " - Unusable"}
                </li>
              ))}
              {characterState.gears.length === 0 &&
                characterState.legacyGears.length === 0 && (
                  <li className="text-gray-400">No gear</li>
                )}
            </ul>
          </div>
        </div>
      </div>

      {/* Powers Section */}
      <div className="border-2 border-[#d4af37] p-4 rounded-md bg-black/50 text-xl">
        <div className="flex flex-col">
          <p
            onClick={() => handleSectionClick("power")}
            className="font-bold underline text-[#f5e6d3] cursor-pointer hover:text-amber-400"
          >
            Powers ({characterState.powers?.length || 0})
          </p>
          <div className="max-h-40 overflow-y-auto pr-2">
            <ul className="list-disc pl-6 space-y-1 min-h-[130px] max-h-[130px] overflow-y-auto">
              {characterState.powers && characterState.powers.length > 0 ? (
                characterState.powers.map((power: any, idx: number) => (
                  <li key={idx} className="text-yellow-300">
                    {power.name}
                  </li>
                ))
              ) : (
                <li className="text-gray-400">No powers</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* PvE Section */}
      <div className="border-2 border-[#d4af37] p-4 rounded-md bg-black/50 text-xl">
        <div className="flex flex-col">
          <p
            onClick={() => handleSectionClick("pve")}
            className="font-bold underline text-[#f5e6d3] cursor-pointer hover:text-amber-400"
          >
            PvE
          </p>
          <span className="text-amber-300 mt-2">
            {characterState.results.pve || "???"}
          </span>
        </div>
      </div>
    </div>
  );
};
