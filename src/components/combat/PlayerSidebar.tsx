import { Dispatch, SetStateAction } from "react";
import { PvPPlayerData, CombatResult } from "../../types/battleZone";
import StatModifiersTable, { sourceTypeColors } from "../StatModifiersTable";
import { SidebarAvatarBanner } from "./SidebarAvatarBanner";
import { buildInventoryList } from "../../utils/combatStats";
import { detectCombatAudioTracks } from "../CombatAudioController";

export interface PlayerSidebarProps {
  player: PvPPlayerData | null;
  otherPlayer: PvPPlayerData | null;
  accent: "blue" | "red";
  audioResetKey: number;
  combatResult: CombatResult | null;
  masterVolume: number;
  bgmVolume: number;
  isTournamentMode: boolean;
  onClear: () => void;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  focused: boolean;
  setFocused: Dispatch<SetStateAction<boolean>>;
  filteredPlayers: PvPPlayerData[];
  onSelectPlayer: (p: PvPPlayerData) => void;
  tab: "effects" | "inventory";
  setTab: (tab: "effects" | "inventory") => void;
  disabledItems: Set<string>;
  toggleItem: (playerNo: number, sourceType: string, name: string) => void;
  placeholder?: string;
  selectTabOnPick?: "effects" | "inventory";
}

export function PlayerSidebar({
  player,
  otherPlayer,
  accent,
  audioResetKey,
  combatResult,
  masterVolume,
  bgmVolume,
  isTournamentMode,
  onClear,
  searchTerm,
  setSearchTerm,
  focused,
  setFocused,
  filteredPlayers,
  onSelectPlayer,
  tab = "effects",
  setTab,
  disabledItems,
  toggleItem,
  placeholder = "Tìm player...",
  selectTabOnPick = "effects" as "effects" | "inventory",
}: PlayerSidebarProps) {
  const items = player?.character ? buildInventoryList(player.character) : [];
  const audioTracks = detectCombatAudioTracks(player?.character, disabledItems, player?.no);
  const otherAudioTracks = detectCombatAudioTracks(otherPlayer?.character, undefined, otherPlayer?.no);

  const quirks = (player?.character?.quirks || [])
    .filter((q: any) => !q.isLost)
    .map((q: any) => (typeof q === "string" ? q : q.name).toLowerCase());
  const _isSilenced = quirks.includes("mute") || quirks.includes("deaf"); // badge only, không mute audio
  const isBlurred = quirks.includes("blind");

  const accentColor = accent === "blue" ? "blue" : "red";
  const borderClass = accent === "blue" ? "border-blue-500/30" : "border-red-500/30";
  const headerBorderClass = accent === "blue" ? "border-blue-500/20" : "border-red-500/20";
  const inputBorderClass = accent === "blue" ? "border-blue-600/40" : "border-red-600/40";
  const inputRingClass = accent === "blue" ? "focus:ring-blue-500" : "focus:ring-red-500";
  const noClass = accent === "blue" ? "text-blue-400" : "text-red-400";
  const activeTabClass = accent === "blue" ? "bg-blue-600 text-white" : "bg-red-600 text-white";

  return (
    <div
      className={`w-[360px] shrink-0 flex flex-col bg-gray-900/90 rounded-none border ${borderClass} max-h-[85vh] ${false && isBlurred ? "blur-sm pointer-events-none select-none" : ""}`}
    >
      {/* Avatar */}
      {player && (
        <SidebarAvatarBanner
          key={`${player.no}-${audioResetKey}`}
          player={player}
          accent={accentColor}
          audioTracks={audioTracks}
          otherSideHasAudio={otherAudioTracks.length > 0}
          audioStopped={!!combatResult}
          silenced={false}
          showSilencedBadge={_isSilenced}
          blurred={isBlurred}
          bgmVolumeScale={masterVolume * bgmVolume}
        />
      )}

      {/* Header: search + tab switcher */}
      <div className={`relative z-10 p-3 border-b ${headerBorderClass} shrink-0 space-y-2`}>
        <div className="relative">
          {player ? (
            <div className={`flex items-center gap-2 px-3 py-2 bg-gray-900/60 border ${inputBorderClass} rounded-none backdrop-blur-sm`}>
              <span className={`${noClass} text-xs font-mono`}>#{player.no}</span>
              <span className="text-white text-sm font-bold flex-1 truncate">{player.name}</span>
              {!isTournamentMode && (
                <button onClick={onClear} className="text-gray-500 hover:text-white text-xs shrink-0">
                  ✕
                </button>
              )}
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800 border ${inputBorderClass} rounded-none text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 ${inputRingClass}`}
              />
              {focused && filteredPlayers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-none shadow-xl max-h-56 overflow-y-auto">
                  {filteredPlayers.map((p) => (
                    <button
                      key={p.no}
                      onMouseDown={() => {
                        onSelectPlayer(p);
                        setSearchTerm(p.name);
                        setFocused(false);
                        setTab(selectTabOnPick);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-700 text-white text-sm flex justify-between items-center gap-2"
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className={`${noClass} font-mono text-xs shrink-0`}>#{p.no}</span>
                        <span className="truncate">{p.name}</span>
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">{p.race}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {player && (
          <div className="flex bg-gray-800/60 rounded-none p-0.5 gap-0.5">
            <button
              onClick={() => setTab("effects")}
              className={`flex-1 text-xs py-1 rounded-none font-medium transition-all ${tab === "effects" ? activeTabClass : "text-gray-400 hover:text-white"}`}
            >
              Hiệu ứng
            </button>
            <button
              onClick={() => setTab("inventory")}
              className={`flex-1 text-xs py-1 rounded-none font-medium transition-all ${tab === "inventory" ? activeTabClass : "text-gray-400 hover:text-white"}`}
            >
              Inventory{" "}
              {items.length > 0 && <span className="opacity-60">({items.length})</span>}
            </button>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto flex-1 p-3">
        {player ? (
          tab === "effects" ? (
            <StatModifiersTable
              breakdown={player.breakdown}
              baseStats={player.baseStats}
            />
          ) : (
            <div className="space-y-0.5">
              {items.length === 0 ? (
                <div className="text-gray-600 text-sm text-center py-8">Không có item</div>
              ) : (
                items.map((item, i) => {
                  const k = `${player.no}-${item.sourceType}-${item.name}`;
                  const disabled = disabledItems.has(k);
                  const colorClass =
                    (sourceTypeColors as Record<string, string>)[item.sourceType] || "text-gray-400";
                  return (
                    <button
                      key={i}
                      onClick={() => toggleItem(player.no, item.sourceType, item.name)}
                      className={`w-full text-left text-sm px-2 py-1.5 rounded transition-all ${disabled ? "opacity-35 bg-gray-800/20" : "hover:bg-gray-700/40 bg-gray-800/10"}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`${colorClass} ${disabled ? "line-through" : ""}`}>
                          {item.name}
                        </span>
                        <span className="text-gray-700 text-xs">[{item.sourceType}]</span>
                        {disabled && (
                          <span className="text-red-500 text-xs ml-auto">OFF</span>
                        )}
                      </div>
                      {item.description && !disabled && (
                        <div className="text-gray-500 text-xs mt-0.5 leading-snug">
                          {item.description}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )
        ) : (
          <div className="text-gray-600 text-xs text-center py-8">
            {placeholder.replace("Tìm ", "Chọn ").replace("...", " để xem")}
          </div>
        )}
      </div>
    </div>
  );
}
