import { useState, useEffect } from "react";
import { WheelPreset, WheelItem } from "../types";
import { fetchDefaultPresets, DefaultPreset } from "../data/defaultPresets";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  savePresetToFile as savePresetToFileWeb,
  loadPresetFromFile as loadPresetFromFileWeb,
  savePresetToStorage,
  getPresetsFromStorage,
  deletePresetFromStorage,
} from "../utils/storage";
import {
  isTauri,
  savePresetToLocal,
  getPresetsFromLocal,
  loadPresetFromLocal,
  deletePresetFromLocal,
  getLocalPresetsDir,
  exportPresetToShared,
  importPreset,
  openFolder,
} from "../utils/localStorage";
import { SuccessDialog } from "./SuccessDialog";
import { UpdateDefaultPresetDialog } from "./UpdateDefaultPresetDialog";

interface PresetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: WheelItem[];
  customSfxUrl?: string;
  wheelName?: string;
  onLoadPreset: (preset: WheelPreset) => void;
  onItemsChange: (items: WheelItem[]) => void;
}

export const PresetSettingsModal = ({
  isOpen,
  onClose,
  items,
  customSfxUrl,
  wheelName,
  onLoadPreset,
  onItemsChange,
}: PresetSettingsModalProps) => {
  const [presetName, setPresetName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedPresets, setSavedPresets] = useState<WheelPreset[]>([]);
  const [localPresetsPath, setLocalPresetsPath] = useState<string>("");
  const [searchPresetQuery, setSearchPresetQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"saved" | "color" | "weight">(
    "saved"
  );
  const [defaultPresets, setDefaultPresets] = useState<DefaultPreset[]>([]);

  // Success dialog state
  const [successDialog, setSuccessDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    folderPath?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  // Confirm delete dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    presetId: string;
    presetName: string;
  }>({
    isOpen: false,
    presetId: "",
    presetName: "",
  });

  // Confirm load preset dialog state
  const [loadConfirm, setLoadConfirm] = useState<{
    isOpen: boolean;
    preset: WheelPreset | null;
  }>({
    isOpen: false,
    preset: null,
  });

  // Edit preset dialog state
  const [editPreset, setEditPreset] = useState<{
    isOpen: boolean;
    presetId: string;
    currentName: string;
    newName: string;
  }>({
    isOpen: false,
    presetId: "",
    currentName: "",
    newName: "",
  });

  const [updateDefaultDialog, setUpdateDefaultDialog] = useState(false);

  // Color presets
  const colorPresets = {
    vibrant: ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"],
    pastel: ["#fca5a5", "#fde047", "#86efac", "#93c5fd", "#c4b5fd", "#f9a8d4"],
    neon: ["#ff006e", "#fb5607", "#ffbe0b", "#8338ec", "#3a86ff", "#06ffa5"],
    ocean: ["#0077b6", "#00b4d8", "#90e0ef", "#caf0f8", "#48cae4", "#023e8a"],
    sunset: ["#ff6d00", "#ff9e00", "#ffc300", "#ffea00", "#ff3d00", "#dd2c00"],
    forest: ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2", "#b7e4c7"],
    grayscale: [
      "#111827",
      "#374151",
      "#6b7280",
      "#9ca3af",
      "#d1d5db",
      "#f3f4f6",
    ],
    candy: ["#ff69b4", "#ff1493", "#ff6eb4", "#ffb6c1", "#ffc0cb", "#ff85c0"],
    tropical: [
      "#00ced1",
      "#20b2aa",
      "#48d1cc",
      "#40e0d0",
      "#00ffff",
      "#afeeee",
    ],
    autumn: ["#d2691e", "#cd853f", "#daa520", "#b8860b", "#bc8f8f", "#f4a460"],
    lavender: [
      "#e6e6fa",
      "#d8bfd8",
      "#dda0dd",
      "#ee82ee",
      "#da70d6",
      "#ba55d3",
    ],
    fire: ["#ff4500", "#ff6347", "#ff7f50", "#ff8c00", "#ffa500", "#ffb347"],
  };

  // Load default presets on mount
  useEffect(() => {
    const loadDefaultPresets = async () => {
      const presets = await fetchDefaultPresets();
      setDefaultPresets(presets);
    };
    loadDefaultPresets();
  }, []);

  // Load presets when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPresets();
    } else {
      // Reset confirm dialogs when modal closes
      setDeleteConfirm({ isOpen: false, presetId: "", presetName: "" });
      setLoadConfirm({ isOpen: false, preset: null });
      setEditPreset({
        isOpen: false,
        presetId: "",
        currentName: "",
        newName: "",
      });
    }
  }, [isOpen]);

  const loadPresets = async () => {
    if (isTauri()) {
      const presets = await getPresetsFromLocal();
      setSavedPresets(presets);
      try {
        const localPath = await getLocalPresetsDir();
        setLocalPresetsPath(localPath);
      } catch (err) {
        console.error("Failed to get local presets path:", err);
      }
    } else {
      const presets = await getPresetsFromStorage();
      setSavedPresets(presets);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim() || items.length === 0) return;

    setIsSaving(true);
    try {
      // Check if preset name already exists
      const existingPreset = savedPresets.find(
        (p) => p.name.toLowerCase() === presetName.trim().toLowerCase()
      );

      if (existingPreset) {
        // Overwrite existing preset
        const preset: WheelPreset = {
          id: existingPreset.id,
          name: presetName.trim(),
          items,
          customSfxUrl,
          wheelName,
        };

        if (isTauri()) {
          await savePresetToLocal(preset);
          const presets = await getPresetsFromLocal();
          setSavedPresets(presets);
          const presetsDir = await getLocalPresetsDir();
          const presetPath = `${presetsDir}\\${preset.id}`;

          setSuccessDialog({
            isOpen: true,
            title: "Preset Updated!",
            message: `"${preset.name}" has been overwritten successfully.`,
            folderPath: presetPath,
          });
        } else {
          await savePresetToStorage(preset);
          const presets = await getPresetsFromStorage();
          setSavedPresets(presets);
          alert("Preset updated successfully!");
        }
      } else {
        // Create new preset
        const preset: WheelPreset = {
          id: crypto.randomUUID(),
          name: presetName.trim(),
          items,
          customSfxUrl,
          wheelName,
        };

        if (isTauri()) {
          await savePresetToLocal(preset);
          const presets = await getPresetsFromLocal();
          setSavedPresets(presets);
          const presetsDir = await getLocalPresetsDir();
          const presetPath = `${presetsDir}\\${preset.id}`;

          setSuccessDialog({
            isOpen: true,
            title: "Preset Saved!",
            message: `"${preset.name}" has been saved successfully.`,
            folderPath: presetPath,
          });
        } else {
          await savePresetToStorage(preset);
          const presets = await getPresetsFromStorage();
          setSavedPresets(presets);
          alert("Preset saved successfully!");
        }
      }

      setPresetName("");
    } catch (error) {
      console.error("Save error:", error);
      alert(
        `Failed to save preset: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadPreset = async (preset: WheelPreset) => {
    // Show confirmation dialog if there are existing items
    if (items.length > 0) {
      setLoadConfirm({
        isOpen: true,
        preset,
      });
    } else {
      // Load directly if no items exist
      await confirmLoadPreset(preset);
    }
  };

  const confirmLoadPreset = async (presetToLoad?: WheelPreset) => {
    const preset = presetToLoad || loadConfirm.preset;
    if (!preset) return;

    if (isTauri()) {
      const loadedPreset = await loadPresetFromLocal(preset.id);
      if (loadedPreset) {
        onLoadPreset(loadedPreset);
        onClose();
      } else {
        alert("Failed to load preset");
      }
    } else {
      onLoadPreset(preset);
      onClose();
    }
    setLoadConfirm({ isOpen: false, preset: null });
  };

  const handleDeletePreset = async (presetId: string, presetName: string) => {
    setDeleteConfirm({
      isOpen: true,
      presetId,
      presetName,
    });
  };

  const confirmDeletePreset = async () => {
    try {
      if (isTauri()) {
        await deletePresetFromLocal(deleteConfirm.presetId);
        const presets = await getPresetsFromLocal();
        setSavedPresets(presets);
      } else {
        await deletePresetFromStorage(deleteConfirm.presetId);
        const presets = await getPresetsFromStorage();
        setSavedPresets(presets);
      }
      setDeleteConfirm({ isOpen: false, presetId: "", presetName: "" });
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete preset");
    }
  };

  const handleEditPreset = (presetId: string, currentName: string) => {
    setEditPreset({
      isOpen: true,
      presetId,
      currentName,
      newName: currentName,
    });
  };

  const confirmEditPreset = async () => {
    if (
      !editPreset.newName.trim() ||
      editPreset.newName === editPreset.currentName
    ) {
      setEditPreset({
        isOpen: false,
        presetId: "",
        currentName: "",
        newName: "",
      });
      return;
    }

    try {
      if (isTauri()) {
        const preset = await loadPresetFromLocal(editPreset.presetId);
        if (preset) {
          const updatedPreset = { ...preset, name: editPreset.newName.trim() };
          await savePresetToLocal(updatedPreset);
          const presets = await getPresetsFromLocal();
          setSavedPresets(presets);
        }
      } else {
        const presets = await getPresetsFromStorage();
        const preset = presets.find((p) => p.id === editPreset.presetId);
        if (preset) {
          const updatedPreset = { ...preset, name: editPreset.newName.trim() };
          await savePresetToStorage(updatedPreset);
          const updatedPresets = await getPresetsFromStorage();
          setSavedPresets(updatedPresets);
        }
      }
      setEditPreset({
        isOpen: false,
        presetId: "",
        currentName: "",
        newName: "",
      });
    } catch (error) {
      console.error("Edit error:", error);
      alert("Failed to rename preset");
    }
  };

  const handleExportPreset = async (preset: WheelPreset) => {
    try {
      if (isTauri()) {
        const exportPath = await exportPresetToShared(preset.id);
        setSuccessDialog({
          isOpen: true,
          title: "Preset Exported!",
          message: `"${preset.name}" has been exported successfully.\n\nYou can now share this folder with others.`,
          folderPath: exportPath,
        });
      } else {
        await savePresetToFileWeb(preset);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("❌ Failed to export preset");
    }
  };

  const handleImportPreset = async () => {
    setIsLoading(true);
    try {
      if (isTauri()) {
        const imported = await importPreset();
        if (imported) {
          const presets = await getPresetsFromLocal();
          setSavedPresets(presets);
          alert(`✅ Preset "${imported.name}" imported successfully!`);
        }
      } else {
        const preset = await loadPresetFromFileWeb();
        if (preset) {
          await savePresetToStorage(preset);
          const presets = await getPresetsFromStorage();
          setSavedPresets(presets);
          alert(`✅ Preset "${preset.name}" imported successfully!`);
        }
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("❌ Failed to import preset");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPresetsFolder = async () => {
    try {
      // Initialize directory if it doesn't exist
      const { initLocalPresetsDirectory } = await import(
        "../utils/localStorage"
      );
      await initLocalPresetsDirectory();

      // Get and open the presets directory
      const presetsDir = await getLocalPresetsDir();
      await openFolder(presetsDir);
    } catch (error) {
      console.error("Failed to open presets folder:", error);
      alert("❌ Không thể mở thư mục presets");
    }
  };

  const handlePresetDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedPresets = Array.from(savedPresets);
    const [removed] = reorderedPresets.splice(result.source.index, 1);
    reorderedPresets.splice(result.destination.index, 0, removed);

    setSavedPresets(reorderedPresets);
  };

  const applyColorPreset = (presetName: keyof typeof colorPresets) => {
    const colors = colorPresets[presetName];
    onItemsChange(
      items.map((item, index) => ({
        ...item,
        color: colors[index % colors.length],
      }))
    );
  };

  const applyWeightPreset = (presetId: string) => {
    const preset = defaultPresets.find((p) => p.id === presetId);
    if (!preset) return;

    const updatedItems: WheelItem[] = preset.items.map((item) => ({
      id: crypto.randomUUID(),
      name: item.name,
      weight: item.weight,
      color: item.color,
      customSound: item.customSound,
      customSoundName: item.customSoundName,
      disabled: item.disabled,
    }));

    const wheelPreset: WheelPreset = {
      id: crypto.randomUUID(),
      name: preset.name,
      items: updatedItems,
      wheelName: preset.wheelName,
      customSfxUrl: preset.customSfxUrl,
    };

    onLoadPreset(wheelPreset);
  };

  const handleUpdateDefaultPreset = async () => {
    // Create updated default presets JSON
    const updatedDefaultPresets = [
      {
        id: "race",
        name: "Race Preset",
        description: "Race Wheel (23 races)",
        wheelName: "Race",
        items: items.map(item => ({
          name: item.name,
          weight: item.weight,
          ...(item.color && { color: item.color }),
          ...(item.disabled && { disabled: item.disabled }),
        })),
      },
    ];

    // Create JSON content
    const jsonContent = JSON.stringify(updatedDefaultPresets, null, 2);

    // Download as file
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "default-presets.json";
    link.click();
    URL.revokeObjectURL(url);

    alert("✅ Default preset file downloaded!\n\nReplace the file at:\npublic/data/default-presets.json");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 shadow-2xl p-6 w-full max-w-2xl h-full overflow-y-auto animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Preset Settings</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors text-xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "saved"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Saved Presets
          </button>
          <button
            onClick={() => setActiveTab("color")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "color"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Color Presets
          </button>
          <button
            onClick={() => setActiveTab("weight")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "weight"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Default Presets
          </button>
        </div>

        {/* Saved Presets Tab */}
        {activeTab === "saved" && (
          <div>
            {/* Save New Preset */}
            <div className="bg-gray-700 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Save Current Setup
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                  placeholder="Enter preset name..."
                  className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSavePreset}
                  disabled={
                    !presetName.trim() || items.length === 0 || isSaving
                  }
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium transition-colors"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            {/* Import and Open Folder Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={handleImportPreset}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium transition-colors"
              >
                {isLoading ? "Importing..." : "Import from File"}
              </button>
              {isTauri() && (
                <button
                  onClick={handleOpenPresetsFolder}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white font-medium transition-colors"
                  title="Mở thư mục presets để quản lý file"
                >
                  📁 Open Presets Folder
                </button>
              )}
            </div>

            {/* Presets Path Info (Tauri only) */}
            {isTauri() && localPresetsPath && (
              <div className="mb-4 p-3 bg-gray-700 rounded">
                <div className="font-semibold text-white mb-1">
                  Presets Location:
                </div>
                <div className="text-gray-400 text-sm break-all">
                  {localPresetsPath}
                </div>
              </div>
            )}

            {/* Saved Presets List */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Saved Presets ({savedPresets.length})
              </h3>

              {/* Search Input */}
              <div className="mb-3">
                <input
                  type="text"
                  value={searchPresetQuery}
                  onChange={(e) => setSearchPresetQuery(e.target.value)}
                  placeholder="Search presets..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <DragDropContext onDragEnd={handlePresetDragEnd}>
                <Droppable droppableId="presets-list">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="max-h-120 overflow-y-auto pr-2 custom-scrollbar space-y-2"
                    >
                      {savedPresets.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">
                          No saved presets yet
                        </p>
                      ) : (
                        savedPresets
                          .filter((preset) =>
                            preset.name
                              .toLowerCase()
                              .includes(searchPresetQuery.toLowerCase())
                          )
                          .map((preset, index) => (
                            <Draggable
                              key={preset.id}
                              draggableId={preset.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-4 rounded transition-colors ${
                                    snapshot.isDragging
                                      ? "bg-blue-600 shadow-lg"
                                      : "bg-gray-700 hover:bg-gray-650"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-white font-medium text-lg truncate flex-1">
                                      {preset.name}
                                    </span>
                                    <span className="text-gray-400 text-sm ml-2">
                                      {preset.items.length} items
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        onClick={() => handleLoadPreset(preset)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors"
                                      >
                                        Load
                                      </button>
                                      <button
                                        onClick={() => {
                                          onLoadPreset(preset);
                                          setPresetName(preset.name);
                                        }}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-medium transition-colors"
                                        title="Load and prepare to overwrite this preset"
                                      >
                                        Update
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <button
                                        onClick={() =>
                                          handleEditPreset(
                                            preset.id,
                                            preset.name
                                          )
                                        }
                                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white font-medium transition-colors text-sm"
                                        title="Rename preset"
                                      >
                                        Rename
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleExportPreset(preset)
                                        }
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white font-medium transition-colors text-sm"
                                        title={
                                          isTauri()
                                            ? "Export preset"
                                            : "Export to file"
                                        }
                                      >
                                        Export
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeletePreset(
                                            preset.id,
                                            preset.name
                                          )
                                        }
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium transition-colors text-sm"
                                        title="Delete preset"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        )}

        {/* Color Presets Tab */}
        {activeTab === "color" && (
          <div>
            <p className="text-gray-300 mb-4">
              Apply color schemes to your items
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(colorPresets).map(([name, colors]) => (
                <button
                  key={name}
                  onClick={() =>
                    applyColorPreset(name as keyof typeof colorPresets)
                  }
                  disabled={items.length === 0}
                  className="flex flex-col items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <div className="flex gap-1">
                    {colors.slice(0, 6).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-white text-sm font-medium capitalize">
                    {name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Default Presets Tab */}
        {activeTab === "weight" && (
          <div>
            <p className="text-gray-300 mb-4">
              Apply default presets to your items. This will replace all current
              items.
            </p>

            {/* Update Default Preset Button */}
            <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
              <p className="text-yellow-300 text-sm mb-3">
                💾 Save current item states (including disabled items) back to default preset file:
              </p>
              <button
                onClick={() => setUpdateDefaultDialog(true)}
                className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-bold transition-colors"
              >
                📥 Update Default Preset File
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {defaultPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyWeightPreset(preset.id)}
                  className="p-6 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
                >
                  <div className="text-xl font-bold text-white mb-2">
                    {preset.name}
                  </div>
                  <div className="text-gray-300 text-sm">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={successDialog.isOpen}
        onClose={() => setSuccessDialog({ ...successDialog, isOpen: false })}
        title={successDialog.title}
        message={successDialog.message}
        folderPath={successDialog.folderPath}
        onOpenFolder={
          successDialog.folderPath
            ? async () => {
                try {
                  await openFolder(successDialog.folderPath!);
                } catch (error) {
                  console.error("Failed to open folder:", error);
                  alert(
                    "Failed to open folder. Please navigate to it manually."
                  );
                }
              }
            : undefined
        }
      />

      {/* Edit Preset Dialog */}
      {editPreset.isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center"
          onClick={() =>
            setEditPreset({
              isOpen: false,
              presetId: "",
              currentName: "",
              newName: "",
            })
          }
        >
          <div
            className="bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-3">Rename Preset</h3>
            <p className="text-gray-300 mb-2">
              Enter a new name for the preset:
            </p>
            <input
              type="text"
              value={editPreset.newName}
              onChange={(e) =>
                setEditPreset({ ...editPreset, newName: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && confirmEditPreset()}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 mb-4"
              placeholder="Preset name..."
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setEditPreset({
                    isOpen: false,
                    presetId: "",
                    currentName: "",
                    newName: "",
                  })
                }
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmEditPreset}
                disabled={!editPreset.newName.trim()}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {deleteConfirm.isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center"
          onClick={() =>
            setDeleteConfirm({ isOpen: false, presetId: "", presetName: "" })
          }
        >
          <div
            className="bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-3">
              Confirm Delete
            </h3>
            <p className="text-gray-300 mb-2">
              Are you sure you want to delete this preset?
            </p>
            <p className="text-white font-semibold mb-6 bg-gray-700 p-3 rounded">
              "{deleteConfirm.presetName}"
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDeleteConfirm({
                    isOpen: false,
                    presetId: "",
                    presetName: "",
                  })
                }
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePreset}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Load Dialog */}
      {loadConfirm.isOpen && loadConfirm.preset && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center"
          onClick={() => setLoadConfirm({ isOpen: false, preset: null })}
        >
          <div
            className="bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-3">Load Preset?</h3>
            <p className="text-gray-300 mb-2">
              Loading this preset will replace your current wheel setup.
            </p>
            <p className="text-white font-semibold mb-2 bg-gray-700 p-3 rounded">
              "{loadConfirm.preset.name}"
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Current: {items.length} items → New:{" "}
              {loadConfirm.preset.items.length} items
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLoadConfirm({ isOpen: false, preset: null })}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmLoadPreset()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors"
              >
                Load
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Default Preset Dialog */}
      <UpdateDefaultPresetDialog
        isOpen={updateDefaultDialog}
        onClose={() => setUpdateDefaultDialog(false)}
        items={items}
        onConfirm={handleUpdateDefaultPreset}
      />
    </div>
  );
};
