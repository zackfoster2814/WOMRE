import { useState, useMemo, useEffect } from "react";
import { WheelItem, WheelPreset, SpinHistoryEntry } from "../types";
// Temporarily commented out - PlayerInfoPanel is hidden for release
// import { Character } from "../types/character";
import { WheelCanvas } from "../components/WheelCanvas";
import { ItemList } from "../components/ItemList";
import { PresetManager } from "../components/PresetManager";
import { ResultDialog } from "../components/ResultDialog";
import { AudioControls } from "../components/AudioControls";
import { HistoryModal } from "../components/HistoryModal";
import { BackgroundMusicPlayer } from "../components/BackgroundMusicPlayer";
import { QuickPresetSelector } from "../components/QuickPresetSelector";
// Temporarily commented out - PlayerInfoPanel is hidden for release
// import { PlayerInfoPanel } from "../components/PlayerInfoPanel";
// import { CharacterParser } from "../utils/characterParser";
import { setAudioMuted, stopCurrentAudio } from "../utils/audio";
import { generateColors } from "../utils/colors";
import {
  isTauri,
  exportHistoryToLocal,
  openFolder,
  // saveCharacterToLocal,
} from "../utils/localStorage";
import wheelBgImage from "../assets/img/wheel-bg.png";
import { initializeEffectData } from "../effects/data";
// Temporarily disabled hover tooltip
// import { EffectRegistry } from "../effects";
// import { getAssetPath } from "../utils/basePath";
// Temporarily disabled hover tooltip
// import { RemoveScroll } from "react-remove-scroll";

export const WheelPage = () => {
  const [items, setItems] = useState<WheelItem[]>([
    { id: "1", name: "Option 1", weight: 1 },
    { id: "2", name: "Option 2", weight: 1 },
    { id: "3", name: "Option 3", weight: 1 },
    { id: "4", name: "Option 4", weight: 1 },
  ]);
  const [isSpinning, setIsSpinning] = useState(false);

  // Dispatch custom event when spinning state changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('wheelSpinningChange', { detail: { isSpinning } }));
  }, [isSpinning]);
  const [customSfxUrl, setCustomSfxUrl] = useState<string>();
  const [customSfxName, setCustomSfxName] = useState<string>();
  const [isMuted, setIsMuted] = useState(false);
  const [currentItem, setCurrentItem] = useState<WheelItem | null>(null);
  const [winningItem, setWinningItem] = useState<WheelItem | null>(null);
  const [spinHistory, setSpinHistory] = useState<SpinHistoryEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [wheelName, setWheelName] = useState("");
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [backgroundMusicUrl, setBackgroundMusicUrl] = useState<string | null>(
    null,
  );
  const [startAngle, setStartAngle] = useState(0);
  const [angleInputValue, setAngleInputValue] = useState("0");
  // Temporarily commented out - PlayerInfoPanel is hidden for release
  // const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
  //   null,
  // );
  // Temporarily commented out - PlayerInfoPanel is hidden for release
  // const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);
  // const [showPlayerPanel, setShowPlayerPanel] = useState(false);
  // const [isSavingCharacter, setIsSavingCharacter] = useState(false);
  // Temporarily disabled hover tooltip
  // const tooltipRef = useRef<HTMLDivElement | null>(null);
  // const [isCurrentItemResultHover, setIsCurrentItemResultHover] =
  //   useState(false);

  useEffect(() => {
    initializeEffectData();
  }, []);

  // Generate colors for items that don't have custom colors
  const generatedColors = useMemo(
    () => generateColors(items.length),
    [items.length],
  );

  // Temporarily commented out - PlayerInfoPanel is hidden for release
  // Fetch character data based on item name
  // const fetchCharacterData = useCallback(async (itemName: string) => {
  //   // Try to extract No. from item name (e.g., "No.35" or just "35" or "No35")
  //   const noMatch = itemName.match(/No\.?(\d+)/i) || itemName.match(/^(\d+)$/);
  //   if (!noMatch) {
  //     setSelectedCharacter(null);
  //     return;
  //   }
  //
  //   const characterNo = noMatch[1];
  //   setIsLoadingCharacter(true);
  //
  //   try {
  //     const response = await fetch(getAssetPath(`/data/No${characterNo}.txt`));
  //     if (!response.ok) {
  //       setSelectedCharacter(null);
  //       return;
  //     }
  //
  //     const content = await response.text();
  //     const character = CharacterParser.parseCharacterFile(content);
  //     setSelectedCharacter(character);
  //   } catch (error) {
  //     console.error("Failed to fetch character data:", error);
  //     setSelectedCharacter(null);
  //   } finally {
  //     setIsLoadingCharacter(false);
  //   }
  // }, []);

  // Handle selecting a player from the list
  // Temporarily commented out - PlayerInfoPanel is hidden for release
  // const handleSelectPlayer = useCallback(async (playerNo: number) => {
  //   setIsLoadingCharacter(true);
  //
  //   try {
  //     const response = await fetch(getAssetPath(`/data/No${playerNo}.txt`));
  //     if (!response.ok) {
  //       setSelectedCharacter(null);
  //       return;
  //     }
  //
  //     const content = await response.text();
  //     const character = CharacterParser.parseCharacterFile(content);
  //     setSelectedCharacter(character);
  //   } catch (error) {
  //     console.error("Failed to fetch character data:", error);
  //     setSelectedCharacter(null);
  //   } finally {
  //     setIsLoadingCharacter(false);
  //   }
  // }, []);

  // Get the actual color that will be displayed on the wheel
  const getCurrentItemColor = (): string => {
    if (!currentItem) return "#3b82f6";
    if (currentItem.color) return currentItem.color;

    const index = items.findIndex((item) => item.id === currentItem.id);
    if (index === -1) return "#3b82f6";

    return generatedColors[index % generatedColors.length];
  };

  // Get the actual color for winning item
  const getWinningItemColor = (): string => {
    if (!winningItem) return "#3b82f6";
    if (winningItem.color) return winningItem.color;

    const index = items.findIndex((item) => item.id === winningItem.id);
    if (index === -1) return "#3b82f6";

    return generatedColors[index % generatedColors.length];
  };

  const handleSpin = () => {
    if (items.length === 0 || isSpinning) return;
    setIsSpinning(true);
  };

  const handleSpinComplete = (item: WheelItem) => {
    setIsSpinning(false);
    setWinningItem(item);

    // Temporarily commented out - PlayerInfoPanel is hidden for release
    // Check if we were spinning for an attribute
    // if (spinningAttribute && selectedCharacter) {
    //   // Update the character with the spin result
    //   const updatedCharacter = { ...selectedCharacter };
    //   const resultValue = item.name;
    //
    //   switch (spinningAttribute.type) {
    //     case "race":
    //       updatedCharacter.race = {
    //         ...updatedCharacter.race,
    //         race: resultValue,
    //       };
    //       break;
    //     case "archetype":
    //       if (!updatedCharacter.archetypes.includes(resultValue)) {
    //         updatedCharacter.archetypes = [
    //           ...updatedCharacter.archetypes,
    //           resultValue,
    //         ];
    //       }
    //       break;
    //     case "house":
    //       updatedCharacter.house = resultValue;
    //       break;
    //     case "team":
    //       // Extract team number from result (e.g., "Team 1" -> 1)
    //       const teamMatch = resultValue.match(/\d+/);
    //       updatedCharacter.team = teamMatch
    //         ? parseInt(teamMatch[0])
    //         : undefined;
    //       break;
    //     case "quirk":
    //       if (!updatedCharacter.quirks.includes(resultValue)) {
    //         updatedCharacter.quirks = [...updatedCharacter.quirks, resultValue];
    //       }
    //       break;
    //     case "power":
    //       if (!updatedCharacter.powers.includes(resultValue)) {
    //         updatedCharacter.powers = [...updatedCharacter.powers, resultValue];
    //       }
    //       break;
    //     case "weapon":
    //       const newWeapon = {
    //         name: resultValue,
    //         type: "Normal" as const,
    //         usable: true,
    //       };
    //       updatedCharacter.weapons = [...updatedCharacter.weapons, newWeapon];
    //       break;
    //     case "chardev":
    //       if (!updatedCharacter.charDevs.includes(resultValue)) {
    //         updatedCharacter.charDevs = [
    //           ...updatedCharacter.charDevs,
    //           resultValue,
    //         ];
    //       }
    //       break;
    //   }
    //
    //   setSelectedCharacter(updatedCharacter);
    //   setSpinningAttribute(null);
    //
    //   // Open player panel to show updated info
    //   setShowPlayerPanel(true);
    // } else {
    //   // Normal spin - fetch character data for the winning item
    //   fetchCharacterData(item.name);
    // }

    // Normal spin - fetch character data for the winning item
    // fetchCharacterData(item.name);

    // Get the actual color being displayed
    const actualColor =
      item.color ||
      (() => {
        const index = items.findIndex((i) => i.id === item.id);
        if (index === -1) return "#3b82f6";
        return generatedColors[index % generatedColors.length];
      })();

    // Log to history with limit to prevent performance issues
    const historyEntry: SpinHistoryEntry = {
      id: crypto.randomUUID(),
      itemName: item.name,
      itemWeight: item.weight,
      itemColor: actualColor,
      timestamp: Date.now(),
      wheelName: wheelName || undefined,
    };
    setSpinHistory((prev) => {
      const MAX_HISTORY_ENTRIES = 1000;
      const newHistory = [...prev, historyEntry];
      // Keep only the most recent MAX_HISTORY_ENTRIES
      if (newHistory.length > MAX_HISTORY_ENTRIES) {
        return newHistory.slice(-MAX_HISTORY_ENTRIES);
      }
      return newHistory;
    });
  };

  const handleCloseDialog = () => {
    setWinningItem(null);
  };

  const handleRemoveWinningItem = () => {
    if (winningItem) {
      setItems(items.filter((item) => item.id !== winningItem.id));
      setWinningItem(null);
    }
  };

  const handleDisableWinningItem = () => {
    if (winningItem) {
      setItems(
        items.map((item) =>
          item.id === winningItem.id ? { ...item, disabled: true } : item,
        ),
      );
      setWinningItem(null);
    }
  };

  const handleDisableItem = (itemId: string) => {
    setItems(
      items.map((item) =>
        item.id === itemId ? { ...item, disabled: !item.disabled } : item,
      ),
    );
  };

  const handleResetAllItems = () => {
    setItems(items.map((item) => ({ ...item, disabled: false })));
  };

  const handleEnableAllItems = () => {
    setItems(items.map((item) => ({ ...item, disabled: false })));
  };

  const handleShuffle = () => {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setItems(shuffled);
  };

  const handleLoadPreset = (preset: WheelPreset) => {
    setItems(preset.items);
    setCustomSfxUrl(preset.customSfxUrl);
    setWheelName(preset.wheelName || preset.name);
  };

  // Temporarily commented out - PlayerInfoPanel is hidden for release
  // Map attribute types to preset IDs
  // const attributePresetMap: Record<string, string> = {
  //   race: "race",
  //   archetype: "archetype",
  //   house: "houses",
  //   team: "teams",
  //   quirk: "quirk",
  //   power: "power",
  //   weapon: "weapon-normal",
  //   chardev: "chardev",
  // };

  // State for tracking which attribute is being spun
  // const [spinningAttribute, setSpinningAttribute] = useState<{
  //   type: string;
  //   characterNo: number;
  // } | null>(null);

  // Handle spin attribute from player panel
  // const handleSpinAttribute = useCallback(
  //   async (attributeType: string, character: Character) => {
  //     const presetId = attributePresetMap[attributeType];
  //     if (!presetId) return;
  //
  //     try {
  //       // Load default presets
  //       const response = await fetch(
  //         getAssetPath("/data/default-presets.json"),
  //       );
  //       if (!response.ok) return;
  //
  //       const presets = await response.json();
  //       const preset = presets.find((p: { id: string }) => p.id === presetId);
  //
  //       if (preset) {
  //         // Load the preset items with IDs
  //         const itemsWithIds = preset.items.map(
  //           (item: { name: string; weight: number; disabled?: boolean }) => ({
  //             ...item,
  //             id: crypto.randomUUID(),
  //           }),
  //         );
  //
  //         setItems(itemsWithIds);
  //         setWheelName(preset.wheelName || preset.name);
  //         setCustomSfxUrl(preset.customSfxUrl);
  //
  //         // Track which attribute we're spinning for
  //         setSpinningAttribute({
  //           type: attributeType,
  //           characterNo: character.no,
  //         });
  //
  //         // Close player panel to show wheel
  //         setShowPlayerPanel(false);
  //       }
  //     } catch (error) {
  //       console.error("Failed to load preset:", error);
  //     }
  //   },
  //   [],
  // );

  // Handle save character to file
  // const handleSaveCharacter = useCallback(async (character: Character) => {
  //   setIsSavingCharacter(true);
  //
  //   try {
  //     const content = CharacterParser.serializeCharacter(character);
  //     const filename = `No${character.no}.txt`;
  //
  //     if (isTauri()) {
  //       // Save directly to data folder in Tauri app
  //       await saveCharacterToLocal(content, filename);
  //     } else {
  //       // Browser fallback - download as file
  //       const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  //       const url = URL.createObjectURL(blob);
  //       const link = document.createElement("a");
  //       link.href = url;
  //       link.download = filename;
  //       document.body.appendChild(link);
  //       link.click();
  //       document.body.removeChild(link);
  //       URL.revokeObjectURL(url);
  //     }
  //
  //     // Show success notification
  //     setShowExportSuccess(true);
  //     setTimeout(() => setShowExportSuccess(false), 3000);
  //   } catch (error) {
  //     console.error("Failed to save character:", error);
  //     alert("Failed to save character: " + (error as Error).message);
  //   } finally {
  //     setIsSavingCharacter(false);
  //   }
  // }, []);

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    setAudioMuted(newMutedState);
  };

  const handleStopAudio = () => {
    stopCurrentAudio();
  };

  const handleClearHistory = () => {
    setSpinHistory([]);
  };

  const handleExportHistory = async (filename?: string) => {
    if (spinHistory.length === 0) return;

    // Create CSV content
    const headers = [
      "#",
      "Item Name",
      "Weight",
      "Color",
      "Wheel Name",
      "Date & Time",
    ];
    const rows = spinHistory.map((entry, index) => [
      index + 1,
      `"${entry.itemName.replace(/"/g, '""')}"`, // Escape quotes
      entry.itemWeight,
      entry.itemColor || "",
      entry.wheelName ? `"${entry.wheelName.replace(/"/g, '""')}"` : "",
      new Date(entry.timestamp).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    // Use provided filename or default
    const finalFilename = filename
      ? filename
      : `wheel-history-${new Date().toISOString().split("T")[0]}`;

    if (isTauri()) {
      // Save to local file system (Tauri)
      try {
        const historyDir = await exportHistoryToLocal(csv, finalFilename);

        // Show success notification with clickable action
        setShowExportSuccess(true);

        // Store the history directory path for opening
        const openHistoryFolder = async () => {
          try {
            await openFolder(historyDir);
          } catch (error) {
            console.error("Failed to open folder:", error);
            alert("Failed to open folder. Please navigate to it manually.");
          }
        };

        // Make the success notification clickable
        (window as any).__openHistoryFolder = openHistoryFolder;

        setTimeout(() => {
          setShowExportSuccess(false);
          delete (window as any).__openHistoryFolder;
        }, 5000);
      } catch (error) {
        console.error("Failed to export history:", error);
        alert("Failed to export history: " + (error as Error).message);
      }
    } else {
      // Fallback to browser download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${finalFilename}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success notification
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 3000);
    }
  };

  // Temporarily disabled hover tooltip
  // const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
  //   if (!tooltipRef.current) return;
  //   tooltipRef.current.scrollTop += e.deltaY;
  // };

  // const description = useMemo(() => {
  //   if (!currentItem?.name) return null;

  //   const searchResults = EffectRegistry.searchExact(currentItem.name);
  //   if (searchResults.length) return searchResults[0].description;

  //   return currentItem.effectDescription;
  // }, [currentItem]);

  return (
    <div
      className="min-h-screen py-2 px-4"
      style={{
        backgroundImage: `url(${wheelBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2 pl-44">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Wheel of Multiverse
            </h1>
            <AudioControls
              isMuted={isMuted}
              onToggleMute={toggleMute}
              onStopAudio={handleStopAudio}
              customSfxUrl={customSfxUrl}
              customSfxName={customSfxName}
              onCustomSfxChange={(url, name) => {
                setCustomSfxUrl(url);
                setCustomSfxName(name);
              }}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pl-44">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <p className="text-gray-400 text-xs sm:text-sm whitespace-nowrap">
                V3.0 Lite Edition
              </p>
              <span className="text-gray-600 hidden sm:inline">•</span>
              <input
                type="text"
                value={wheelName}
                onChange={(e) => setWheelName(e.target.value)}
                className="px-2 sm:px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                placeholder="Wheel name..."
                style={{ minWidth: "150px" }}
                disabled={isSpinning}
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
              <label className="px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white font-medium transition-colors text-xs sm:text-sm flex items-center gap-2 cursor-pointer flex-1 sm:flex-initial justify-center">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
                <span className="hidden sm:inline">Background Music</span>
                <span className="sm:hidden">Music</span>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setBackgroundMusicUrl(url);
                    }
                  }}
                />
              </label>
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-medium transition-colors text-xs sm:text-sm flex items-center gap-2 flex-1 sm:flex-initial justify-center"
              >
                History ({spinHistory.length})
              </button>
            </div>
          </div>
        </header>

        {/* Player Info Panel - Temporarily hidden for release */}
        {/* <PlayerInfoPanel
          character={selectedCharacter}
          isLoading={isLoadingCharacter}
          isOpen={showPlayerPanel}
          onToggle={() => setShowPlayerPanel(!showPlayerPanel)}
          onSelectPlayer={handleSelectPlayer}
          onSpinAttribute={handleSpinAttribute}
          onSaveCharacter={handleSaveCharacter}
          isSaving={isSavingCharacter}
        /> */}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_500px] xl:grid-cols-[1fr_550px] gap-6">
          {/* Left column: Wheel */}
          <div className="space-y-4">
            <div className="p-3 sm:p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <WheelCanvas
                    items={items}
                    isSpinning={isSpinning}
                    onSpinComplete={handleSpinComplete}
                    customSfxUrl={customSfxUrl}
                    onCurrentItemChange={setCurrentItem}
                    onSpin={handleSpin}
                    startAngle={startAngle}
                  />
                  {/* Start Angle Control - Below wheel */}
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <input
                      type="number"
                      value={angleInputValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAngleInputValue(value);

                        if (value === "" || value === "-") {
                          setStartAngle(0);
                        } else {
                          const val = parseInt(value);
                          if (!isNaN(val)) {
                            setStartAngle(val);
                          }
                        }
                      }}
                      disabled={isSpinning}
                      className="w-24 sm:w-36 px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-center text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={() => {
                        setStartAngle(0);
                        setAngleInputValue("0");
                      }}
                      disabled={isSpinning}
                      className="px-2 sm:px-3 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 rounded text-white text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Reset angle to 0"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Current Item Display - Responsive size */}
                <div className="w-full md:w-64 flex flex-col justify-center">
                  {currentItem ? (
                    <div className="bg-gray-700 p-4 sm:p-6 rounded-lg border-4 border-yellow-500 shadow-lg h-auto md:h-64 flex flex-col">
                      <p className="text-sm text-gray-400 mb-3 font-semibold">
                        RESULT
                      </p>
                      <div
                        className="w-full h-6 rounded mb-4 flex-shrink-0"
                        style={{
                          backgroundColor: getCurrentItemColor(),
                        }}
                      />
                      <div className="flex-1 flex flex-col items-center justify-center min-h-[3rem] relative">
                        <p className="text-lg sm:text-xl font-bold text-white text-center break-words px-2">
                          {currentItem.name}
                        </p>
                      </div>
                      <div className="flex-shrink-0 mt-4">
                        <p className="text-sm sm:text-base text-gray-400">
                          Weight:{" "}
                          <span className="text-white font-semibold">
                            {currentItem.weight}
                          </span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-700 p-4 sm:p-6 rounded-lg border-4 border-gray-600 shadow-lg h-auto md:h-64 flex items-center justify-center min-h-[12rem]">
                      <p className="text-base sm:text-lg text-gray-500">
                        No selection
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Controls */}
          <div className="flex flex-col gap-6">
            <ItemList
              items={items}
              onItemsChange={setItems}
              onShuffle={handleShuffle}
              onDisableItem={handleDisableItem}
              onResetAllItems={handleResetAllItems}
              onEnableAllItems={handleEnableAllItems}
              isSpinning={isSpinning}
            />

            <div className="flex-1 flex items-end">
              <PresetManager
                items={items}
                customSfxUrl={customSfxUrl}
                wheelName={wheelName}
                onLoadPreset={handleLoadPreset}
                onItemsChange={setItems}
                isSpinning={isSpinning}
              />
            </div>
          </div>
        </div>

        {/* Result Dialog */}
        {winningItem && (
          <ResultDialog
            item={winningItem}
            itemColor={getWinningItemColor()}
            onClose={handleCloseDialog}
            onRemove={handleRemoveWinningItem}
            onDisable={handleDisableWinningItem}
          />
        )}

        {/* History Modal */}
        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={spinHistory}
          onClearHistory={handleClearHistory}
          onExportHistory={handleExportHistory}
        />

        {/* Export Success Notification */}
        {showExportSuccess && (
          <div className="fixed top-4 right-4 z-[70] animate-fade-in">
            <div
              className={`bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 ${
                isTauri()
                  ? "cursor-pointer hover:bg-green-700 transition-colors"
                  : ""
              }`}
              onClick={() => {
                if (isTauri() && (window as any).__openHistoryFolder) {
                  (window as any).__openHistoryFolder();
                }
              }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div>
                <p className="font-semibold">Export Successful!</p>
                <p className="text-sm text-green-100">
                  {isTauri()
                    ? "Click to open folder"
                    : "CSV file has been downloaded"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Background Music Player */}
        <BackgroundMusicPlayer
          audioUrl={backgroundMusicUrl || undefined}
          onClose={() => setBackgroundMusicUrl(null)}
        />

        {/* Quick Preset Selector */}
        <QuickPresetSelector
          onLoadPreset={handleLoadPreset}
          isSpinning={isSpinning}
          items={items}
        />
      </div>
    </div>
  );
};
