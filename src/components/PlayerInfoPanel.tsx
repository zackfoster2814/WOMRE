import { useState, useEffect, useMemo } from "react";
import { Character } from "../types/character";
import { CharacterParser } from "../utils/characterParser";
import { EffectResolver } from "../effects/resolver";
import { initializeEffectData } from "../effects/data";
import type { CharacterEffects, CharacterStats as EffectStats, EffectSourceType } from "../effects/types";
import { getAssetPath, getPlayerNumbers } from "../utils/basePath";

// Initialize effect data once
let effectsInitialized = false;
function ensureEffectsInitialized() {
  if (!effectsInitialized) {
    initializeEffectData();
    effectsInitialized = true;
  }
}

interface PlayerSummary {
  no: number;
  name: string;
  username: string;
  race: string;
  house?: string;
  // Parasitic Status (for hosts who have a symbiote)
  isParasite?: boolean;
  parasiteInfo?: string[];
  // Symbiosis Status (for the symbiote itself)
  isSymbiosis?: boolean;
  symbiosisType?: string;
  symbiosisHost?: string;
}

type AttributeType =
  | "race"
  | "archetype"
  | "house"
  | "team"
  | "quirk"
  | "power"
  | "weapon"
  | "chardev";

interface PlayerInfoPanelProps {
  character: Character | null;
  isLoading?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onSelectPlayer: (playerNo: number) => void;
  onSpinAttribute?: (
    attributeType: AttributeType,
    character: Character,
  ) => void;
  onSaveCharacter?: (character: Character) => Promise<void>;
  isSaving?: boolean;
}

export const PlayerInfoPanel = ({
  character,
  isLoading = false,
  isOpen,
  onToggle,
  onSelectPlayer,
  onSpinAttribute,
  onSaveCharacter,
  isSaving = false,
}: PlayerInfoPanelProps) => {
  const [activeTab, setActiveTab] = useState<"list" | "info">("list");
  const [playerList, setPlayerList] = useState<PlayerSummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load player list on mount
  useEffect(() => {
    const loadPlayerList = async () => {
      setIsLoadingList(true);

      try {
        // Get player numbers using shared utility
        const playerNumbers = await getPlayerNumbers();

        // Fetch all player files in parallel
        const fetchPromises = playerNumbers.map(
          async (no): Promise<PlayerSummary | null> => {
            try {
              const response = await fetch(getAssetPath(`/data/No${no}.txt`));
              if (response.ok) {
                const content = await response.text();
                const char = CharacterParser.parseCharacterFile(content);
                // Get first active house (not lost)
                const activeHouse = char.houses?.find(h => !h.isLost);
                return {
                  no: char.no || no,
                  name: char.name || `Player ${no}`,
                  username: char.username || "",
                  race: char.race?.race || "",
                  house: activeHouse?.name,
                  isParasite: char.isParasite,
                  parasiteInfo: char.parasiteInfo,
                  isSymbiosis: char.isSymbiosis,
                  symbiosisType: char.symbiosisType,
                  symbiosisHost: char.symbiosisHost,
                };
              }
            } catch (error) {
              console.error(`Failed to load player ${no}:`, error);
            }
            return null;
          },
        );

        const results = await Promise.all(fetchPromises);
        const validPlayers = results.filter(
          (p): p is PlayerSummary => p !== null,
        );
        setPlayerList(validPlayers.sort((a, b) => a.no - b.no));
      } catch (error) {
        console.error("Failed to load player list:", error);
      } finally {
        setIsLoadingList(false);
      }
    };

    if (isOpen && playerList.length === 0) {
      loadPlayerList();
    }
  }, [isOpen, playerList.length]);

  // Switch to info tab when character is loaded
  useEffect(() => {
    if (character) {
      setActiveTab("info");
    }
  }, [character]);

  const filteredPlayers = playerList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.no.toString().includes(searchTerm),
  );

  const handleSelectPlayer = (playerNo: number) => {
    onSelectPlayer(playerNo);
    setActiveTab("info");
  };

  return (
    <>
      {/* Backdrop overlay when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Slide Panel */}
      <div
        className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full w-80 bg-gray-800/95 backdrop-blur-sm border-r border-gray-600 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <h3 className="text-white font-bold text-lg">Players</h3>
            <button
              onClick={onToggle}
              className="text-white/70 hover:text-white transition-colors p-1"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-600 flex-shrink-0">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "list"
                  ? "text-purple-400 border-b-2 border-purple-400 bg-gray-700/50"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              List ({playerList.length})
            </button>
            <button
              onClick={() => setActiveTab("info")}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "info"
                  ? "text-purple-400 border-b-2 border-purple-400 bg-gray-700/50"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Info
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "list" ? (
              <div className="p-3">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search player..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
                />

                {isLoadingList ? (
                  <div className="text-center text-gray-400 py-8 animate-pulse">
                    Loading players...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPlayers.map((player) => (
                      <button
                        key={player.no}
                        onClick={() => handleSelectPlayer(player.no)}
                        className={`w-full text-left p-3 rounded-lg transition-all hover:scale-[1.02] ${
                          character?.no === player.no
                            ? "bg-purple-600/50 border border-purple-500"
                            : "bg-gray-700/50 hover:bg-gray-600/50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium text-sm">
                                No.{player.no} - {player.name}
                              </p>
                              {/* Symbiosis Badge - for the parasite itself */}
                              {player.isSymbiosis && (
                                <span
                                  className="px-1.5 py-0.5 bg-red-600/80 rounded text-[10px] text-white font-medium"
                                  title={`Type: ${player.symbiosisType || "Unknown"}\nHost: ${player.symbiosisHost || "Unknown"}`}
                                >
                                  Symbiosis
                                </span>
                              )}
                              {/* Host Badge - for characters who have a parasite */}
                              {player.isParasite && !player.isSymbiosis && (
                                <div className="relative group/badge">
                                  <span className="px-1.5 py-0.5 bg-green-600/80 rounded text-[10px] text-white font-medium cursor-help">
                                    Host
                                  </span>
                                  {player.parasiteInfo &&
                                    player.parasiteInfo.length > 0 && (
                                      <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover/badge:block">
                                        <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 shadow-xl min-w-[150px]">
                                          <p className="text-gray-400 text-[10px] mb-1">
                                            Parasites:
                                          </p>
                                          {player.parasiteInfo.map(
                                            (info, idx) => (
                                              <p
                                                key={idx}
                                                className="text-white text-xs"
                                              >
                                                • {info}
                                              </p>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                            <p className="text-gray-400 text-xs">
                              @{player.username}
                            </p>
                          </div>
                          <div className="text-right">
                            {player.race && (
                              <p className="text-cyan-400 text-xs">
                                {player.race}
                              </p>
                            )}
                            {player.house && (
                              <p className="text-yellow-400 text-xs">
                                {player.house}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-gray-400 animate-pulse">
                      Loading player data...
                    </div>
                  </div>
                ) : !character ? (
                  <div className="h-full flex items-center justify-center p-4">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-3">👤</div>
                      <p className="text-lg mb-2">No Player Selected</p>
                      <p className="text-sm">Select a player from the list</p>
                    </div>
                  </div>
                ) : (
                  <PlayerContent
                    character={character}
                    onSpinAttribute={
                      onSpinAttribute
                        ? (type) => onSpinAttribute(type, character)
                        : undefined
                    }
                    onSave={
                      onSaveCharacter
                        ? () => onSaveCharacter(character)
                        : undefined
                    }
                    isSaving={isSaving}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toggle Tab - Always visible on edge */}
      <button
        onClick={onToggle}
        className={`fixed top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
          isOpen ? "left-80" : "left-0"
        }`}
      >
        <div className="bg-purple-600 hover:bg-purple-700 text-white py-4 px-2 rounded-r-lg shadow-lg flex flex-col items-center gap-1 transition-colors">
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-xs font-medium writing-vertical">Players</span>
        </div>
      </button>

      <style>{`
        .writing-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </>
  );
};

// Clickable attribute field component
const ClickableField = ({
  label,
  value,
  colorClass = "text-white",
  onClick,
  subValue,
}: {
  label: string;
  value: string;
  colorClass?: string;
  onClick?: () => void;
  subValue?: string;
}) => (
  <div
    className={`bg-gray-700/50 rounded-lg p-3 ${onClick ? "cursor-pointer hover:bg-gray-600/50 transition-colors group" : ""}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      {onClick && (
        <span className="text-gray-500 text-xs group-hover:text-purple-400 transition-colors">
          🎡 Spin
        </span>
      )}
    </div>
    <p className={`font-medium ${colorClass}`}>
      {value || "-"}
      {subValue && (
        <span className="text-cyan-400 text-sm ml-2">{subValue}</span>
      )}
    </p>
  </div>
);

// Helper component to display stat modifier badge
const StatModifierBadge = ({
  name,
  sourceType
}: {
  name: string;
  sourceType: EffectSourceType;
}) => {
  const summary = EffectResolver.getEffectSummary(name, sourceType);
  if (!summary) return null;

  return (
    <span className="text-[10px] text-emerald-400 ml-1">
      ({summary})
    </span>
  );
};

// Separated content component for character display
const PlayerContent = ({
  character,
  onSpinAttribute,
  onSave,
  isSaving = false,
}: {
  character: Character;
  onSpinAttribute?: (type: AttributeType) => void;
  onSave?: () => void;
  isSaving?: boolean;
}) => {
  // Initialize effects
  ensureEffectsInitialized();

  // Calculate effects
  const characterEffects: CharacterEffects = useMemo(() => {
    return EffectResolver.calculateCharacterEffects(character);
  }, [character]);

  const { stats } = character;
  const baseTotal =
    stats.str + stats.spd + stats.dur + stats.iq + stats.biq + stats.ma;
  const totalStats = Object.values(characterEffects.totalStats).reduce(
    (sum, val) => sum + val,
    0,
  );

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Character Name Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg p-3 -mx-1">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-bold text-lg">
              No.{character.no} - {character.name}
            </h4>
            <p className="text-purple-300 text-sm">@{character.username}</p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            {/* Symbiosis Badge - for the parasite itself */}
            {character.isSymbiosis && (
              <span className="px-2 py-1 bg-red-600/80 rounded text-xs text-white font-medium">
                Symbiosis
              </span>
            )}
            {/* Host Badge - for characters who have a parasite */}
            {character.isParasite && !character.isSymbiosis && (
              <span className="px-2 py-1 bg-green-600/80 rounded text-xs text-white font-medium">
                Host
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Symbiosis Info - for the parasite itself */}
      {character.isSymbiosis && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3">
          <p className="text-red-400 text-xs mb-2">Symbiosis Info</p>
          <div className="space-y-1">
            <p className="text-white text-sm">
              <span className="text-gray-400">Type:</span>{" "}
              {character.symbiosisType || "-"}
            </p>
            <p className="text-white text-sm">
              <span className="text-gray-400">Host:</span>{" "}
              {character.symbiosisHost || "-"}
            </p>
          </div>
        </div>
      )}

      {/* Parasite Info - for hosts who have parasites */}
      {character.isParasite &&
        !character.isSymbiosis &&
        character.parasiteInfo &&
        character.parasiteInfo.length > 0 && (
          <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3">
            <p className="text-green-400 text-xs mb-2">Parasites</p>
            <div className="space-y-1">
              {character.parasiteInfo.map((info, idx) => (
                <p key={idx} className="text-white text-sm">
                  • {info}
                </p>
              ))}
            </div>
          </div>
        )}

      {/* Race & Sub-race - Clickable */}
      <div
        className={`bg-gray-700/50 rounded-lg p-3 ${onSpinAttribute ? "cursor-pointer hover:bg-gray-600/50 transition-colors group" : ""}`}
        onClick={onSpinAttribute ? () => onSpinAttribute("race") : undefined}
      >
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-xs mb-1">Race</p>
          {onSpinAttribute && (
            <span className="text-gray-500 text-xs group-hover:text-purple-400 transition-colors">
              🎡 Spin
            </span>
          )}
        </div>
        <p className="font-medium text-white">
          {character.race.race || "-"}
          <StatModifierBadge name={character.race.race} sourceType="race" />
        </p>
        {character.race.subRace && (
          <p className="text-cyan-400 text-sm mt-1">
            Sub-race: {character.race.subRace}
            {character.race.subRace.split(/\s*\+\s*/).map((subRace, idx) => (
              <StatModifierBadge key={idx} name={subRace.trim()} sourceType="sub_race" />
            ))}
          </p>
        )}
      </div>

      {/* Archetypes - Clickable */}
      <div
        className={`bg-gray-700/50 rounded-lg p-3 ${onSpinAttribute ? "cursor-pointer hover:bg-gray-600/50 transition-colors group" : ""}`}
        onClick={
          onSpinAttribute ? () => onSpinAttribute("archetype") : undefined
        }
      >
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-xs mb-1">
            Archetypes ({character.archetypes?.length || 0})
          </p>
          {onSpinAttribute && (
            <span className="text-gray-500 text-xs group-hover:text-purple-400 transition-colors">
              🎡 Spin
            </span>
          )}
        </div>
        {character.archetypes && character.archetypes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {character.archetypes.map((archetype, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-indigo-600/50 rounded text-xs text-indigo-200"
              >
                {archetype}
                <StatModifierBadge name={archetype} sourceType="archetype" />
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">-</p>
        )}
      </div>

      {/* Houses & Team - Clickable */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className={`bg-gray-700/50 rounded-lg p-3 ${onSpinAttribute ? "cursor-pointer hover:bg-gray-600/50 transition-colors group" : ""}`}
          onClick={onSpinAttribute ? () => onSpinAttribute("house") : undefined}
        >
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-xs mb-1">Houses ({character.houses?.length || 0})</p>
            {onSpinAttribute && (
              <span className="text-gray-500 text-xs group-hover:text-purple-400 transition-colors">
                🎡
              </span>
            )}
          </div>
          {character.houses && character.houses.length > 0 ? (
            <div className="space-y-1">
              {character.houses.map((house, idx) => (
                <p
                  key={idx}
                  className={`font-medium ${house.isLost ? "text-gray-500 line-through" : "text-yellow-400"}`}
                >
                  {house.name}
                  {house.isLost && <span className="text-red-400 text-xs ml-1">(đuổi)</span>}
                  {!house.isLost && <StatModifierBadge name={house.name} sourceType="house" />}
                </p>
              ))}
            </div>
          ) : (
            <p className="font-medium text-yellow-400">-</p>
          )}
        </div>
        <ClickableField
          label="Team"
          value={character.team ? `Team ${character.team}` : ""}
          colorClass="text-blue-400"
          onClick={onSpinAttribute ? () => onSpinAttribute("team") : undefined}
        />
      </div>

      {/* Stats - Hexagon Radar Chart */}
      <div className="bg-gray-700/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-400 text-xs">Stats</p>
          <p className="text-gray-400 text-xs">
            Base: {baseTotal} → Total: <span className="text-green-400 font-medium">{totalStats}</span>
          </p>
        </div>
        <HexagonStats stats={stats} totalStats={characterEffects.totalStats} />
      </div>

      {/* Quirks */}
      <div className="bg-gray-700/50 rounded-lg p-3">
        <p className="text-gray-400 text-xs mb-2">
          Quirks ({character.quirks?.length || 0})
        </p>
        {character.quirks && character.quirks.length > 0 ? (
          <div className="space-y-1">
            {character.quirks.map((quirk, idx) => (
              <p
                key={idx}
                className={`text-sm ${quirk.isLost ? "text-gray-500 line-through" : "text-white"}`}
              >
                • {quirk.name}
                {quirk.isLost && <span className="text-red-400 text-xs ml-1">(đã mất)</span>}
                {!quirk.isLost && <StatModifierBadge name={quirk.name} sourceType="quirk" />}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">-</p>
        )}
      </div>

      {/* Powers */}
      <div className="bg-gray-700/50 rounded-lg p-3">
        <p className="text-gray-400 text-xs mb-2">
          Powers ({character.powers?.length || 0})
        </p>
        {character.powers && character.powers.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {character.powers.map((power, idx) => (
              <span
                key={idx}
                className={`px-2 py-1 rounded text-xs ${
                  power.isLost
                    ? "bg-gray-600/30 text-gray-500 line-through"
                    : "bg-purple-600/50 text-purple-200"
                }`}
              >
                {power.name}
                {power.isLost && <span className="text-red-400 text-xs ml-1">(đã mất)</span>}
                {!power.isLost && <StatModifierBadge name={power.name} sourceType="power" />}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">-</p>
        )}
      </div>

      {/* Weapons */}
      <div className="bg-gray-700/50 rounded-lg p-3">
        <p className="text-gray-400 text-xs mb-2">
          Weapons ({character.weapons?.length || 0})
        </p>
        {character.weapons && character.weapons.length > 0 ? (
          <div className="space-y-1">
            {character.weapons.map((weapon, idx) => (
              <p
                key={idx}
                className="text-white text-sm flex items-center gap-2"
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    weapon.usable === false ? "bg-red-500" : "bg-green-500"
                  }`}
                />
                <span className="flex-1">
                  {weapon.name}
                  <StatModifierBadge name={weapon.name} sourceType="weapon" />
                </span>
                <span className="text-gray-500 text-xs">({weapon.type})</span>
              </p>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">-</p>
        )}
      </div>

      {/* Gear */}
      <div className="bg-gray-700/50 rounded-lg p-3">
        <p className="text-gray-400 text-xs mb-2">
          Gear (
          {(character.gear?.normalGear?.length || 0) + (character.gear?.legacyGear?.length || 0)})
        </p>
        {character.gear?.normalGear && character.gear.normalGear.length > 0 && (
          <div className="mb-2">
            <p className="text-gray-500 text-xs mb-1">
              Normal ({character.gear.normalGear.length})
            </p>
            <div className="space-y-1">
              {character.gear.normalGear.map((gear, idx) => (
                <p
                  key={idx}
                  className={`text-sm ${gear.isLost ? "text-gray-500 line-through" : "text-white"}`}
                >
                  • {gear.name}
                  {gear.isLost && <span className="text-red-400 text-xs ml-1">(đã mất)</span>}
                  {!gear.isLost && <StatModifierBadge name={gear.name} sourceType="gear" />}
                </p>
              ))}
            </div>
          </div>
        )}
        {character.gear?.legacyGear && character.gear.legacyGear.length > 0 && (
          <div>
            <p className="text-gray-500 text-xs mb-1">
              Legacy ({character.gear.legacyGear.length})
            </p>
            <div className="space-y-1">
              {character.gear.legacyGear.map((gear, idx) => (
                <p
                  key={idx}
                  className={`text-sm ${gear.isLost ? "text-gray-500 line-through" : "text-yellow-400"}`}
                >
                  • {gear.name}
                  {gear.isLost && <span className="text-red-400 text-xs ml-1">(đã mất)</span>}
                  {!gear.isLost && <StatModifierBadge name={gear.name} sourceType="gear" />}
                </p>
              ))}
            </div>
          </div>
        )}
        {(!character.gear?.normalGear || character.gear.normalGear.length === 0) &&
          (!character.gear?.legacyGear || character.gear.legacyGear.length === 0) && (
            <p className="text-gray-500 text-sm">-</p>
          )}
      </div>

      {/* Runes */}
      <div className="bg-gray-700/50 rounded-lg p-3">
        <p className="text-gray-400 text-xs mb-2">
          Runes ({character.runes?.runes?.length || 0})
        </p>
        {character.runes?.runes && character.runes.runes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {character.runes.runes.map((rune, idx) => (
              <span
                key={idx}
                className={`px-2 py-1 rounded text-xs ${
                  rune.isLost
                    ? "bg-gray-600/30 text-gray-500 line-through"
                    : "bg-orange-600/50 text-orange-200"
                }`}
              >
                {rune.name}
                {rune.isLost && <span className="text-red-400 text-xs ml-1">(đã mất)</span>}
                {!rune.isLost && <StatModifierBadge name={rune.name} sourceType="rune" />}
              </span>
            ))}
          </div>
        )}
        <p className="text-gray-500 text-xs">
          Runeword:{" "}
          <span className="text-orange-400">
            {character.runes.runeword || "Không"}
            {character.runes.runeword && <StatModifierBadge name={character.runes.runeword} sourceType="runeword" />}
          </span>
        </p>
      </div>

      {/* Character Development */}
      <div className="bg-gray-700/50 rounded-lg p-3">
        <p className="text-gray-400 text-xs mb-2">
          Char Dev ({character.charDevs?.length || 0})
        </p>
        {character.charDevs && character.charDevs.length > 0 ? (
          <div className="space-y-1">
            {character.charDevs.map((charDev, idx) => (
              <p
                key={idx}
                className={`text-sm italic ${charDev.isLost ? "text-gray-500 line-through" : "text-white"}`}
              >
                • {charDev.name}
                {charDev.isLost && <span className="text-red-400 text-xs ml-1">(đã mất)</span>}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">-</p>
        )}
      </div>

      {/* Lover */}
      <div className="bg-gray-700/50 rounded-lg p-3">
        <p className="text-gray-400 text-xs mb-1">Lover</p>
        <p
          className={`font-medium ${character.lover ? "text-pink-400" : "text-gray-500"}`}
        >
          {character.lover || "-"}
        </p>
      </div>

      {/* Save Button - Fixed at bottom */}
      {onSave && (
        <div className="fixed bottom-0 left-0 w-80 p-4 bg-gradient-to-t from-gray-800 to-gray-800/95 border-t border-gray-600">
          <button
            onClick={onSave}
            disabled={isSaving}
            className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isSaving
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl"
            }`}
          >
            {isSaving ? (
              <>
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                Save to File
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// Hexagon Radar Chart component
const HexagonStats = ({
  stats,
  totalStats,
}: {
  stats: {
    str: number;
    spd: number;
    dur: number;
    iq: number;
    biq: number;
    ma: number;
  };
  totalStats: EffectStats;
}) => {
  const maxValue = 15; // Increased to accommodate buffed stats
  const centerX = 100;
  const centerY = 100;
  const maxRadius = 70;

  // 6 stats arranged in hexagon (starting from top, going clockwise)
  // Map base stat keys to effect stat keys
  const statConfig = [
    { key: "str", effectKey: "strength", label: "STR", color: "#ef4444", angle: -90 },
    { key: "spd", effectKey: "speed", label: "SPD", color: "#22c55e", angle: -30 },
    { key: "dur", effectKey: "durability", label: "DUR", color: "#3b82f6", angle: 30 },
    { key: "iq", effectKey: "iq", label: "IQ", color: "#eab308", angle: 90 },
    { key: "biq", effectKey: "biq", label: "BIQ", color: "#a855f7", angle: 150 },
    { key: "ma", effectKey: "ma", label: "MA", color: "#ec4899", angle: 210 },
  ];

  // Calculate point position
  const getPoint = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(rad),
      y: centerY + radius * Math.sin(rad),
    };
  };

  // Generate hexagon grid lines
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridPaths = gridLevels.map((level) => {
    const points = statConfig.map((s) => getPoint(s.angle, maxRadius * level));
    return points.map((p) => `${p.x},${p.y}`).join(" ");
  });

  // Generate base stat polygon (lighter, background)
  const baseStatPoints = statConfig.map((s) => {
    const value = stats[s.key as keyof typeof stats] || 0;
    const radius = (value / maxValue) * maxRadius;
    return getPoint(s.angle, radius);
  });
  const baseStatPath = baseStatPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Generate total stat polygon (main, foreground)
  const totalStatPoints = statConfig.map((s) => {
    const value = totalStats[s.effectKey as keyof typeof totalStats] || 0;
    const radius = (value / maxValue) * maxRadius;
    return getPoint(s.angle, radius);
  });
  const totalStatPath = totalStatPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Generate axis lines
  const axisLines = statConfig.map((s) => {
    const end = getPoint(s.angle, maxRadius);
    return { start: { x: centerX, y: centerY }, end };
  });

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 200" className="w-full max-w-[200px]">
        {/* Grid hexagons */}
        {gridPaths.map((path, idx) => (
          <polygon
            key={idx}
            points={path}
            fill="none"
            stroke="#4b5563"
            strokeWidth="1"
            opacity={0.5}
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((line, idx) => (
          <line
            key={idx}
            x1={line.start.x}
            y1={line.start.y}
            x2={line.end.x}
            y2={line.end.y}
            stroke="#4b5563"
            strokeWidth="1"
            opacity={0.5}
          />
        ))}

        {/* Base stat polygon (lighter, background) */}
        <polygon
          points={baseStatPath}
          fill="rgba(156, 163, 175, 0.2)"
          stroke="#9ca3af"
          strokeWidth="1"
          strokeDasharray="4 2"
        />

        {/* Total stat polygon (main, foreground) */}
        <polygon
          points={totalStatPath}
          fill="rgba(34, 197, 94, 0.3)"
          stroke="#22c55e"
          strokeWidth="2"
        />

        {/* Total stat points */}
        {totalStatPoints.map((point, idx) => (
          <circle
            key={idx}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={statConfig[idx].color}
            stroke="white"
            strokeWidth="1"
          />
        ))}

        {/* Labels */}
        {statConfig.map((s, idx) => {
          const labelPos = getPoint(s.angle, maxRadius + 22);
          const baseValue = stats[s.key as keyof typeof stats] || 0;
          const totalValue = totalStats[s.effectKey as keyof typeof totalStats] || 0;
          const diff = totalValue - baseValue;
          return (
            <g key={idx}>
              <text
                x={labelPos.x}
                y={labelPos.y - 8}
                textAnchor="middle"
                className="text-[10px] font-bold fill-current"
                style={{ fill: s.color }}
              >
                {s.label}
              </text>
              <text
                x={labelPos.x}
                y={labelPos.y + 4}
                textAnchor="middle"
                className="text-[9px]"
                style={{ fill: "#9ca3af" }}
              >
                {baseValue}
              </text>
              <text
                x={labelPos.x}
                y={labelPos.y + 14}
                textAnchor="middle"
                className="text-[10px] font-bold"
                style={{ fill: diff > 0 ? "#22c55e" : diff < 0 ? "#ef4444" : "#ffffff" }}
              >
                → {totalValue}
                {diff !== 0 && (
                  <tspan style={{ fill: diff > 0 ? "#22c55e" : "#ef4444", fontSize: "8px" }}>
                    {" "}({diff > 0 ? "+" : ""}{diff})
                  </tspan>
                )}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
