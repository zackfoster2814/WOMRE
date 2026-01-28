import { useState, useMemo } from "react";
import { WheelItem } from "../types";
import { playCustomSound } from "../utils/audio";
import { generateColorsHex } from "../utils/colors";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import Papa from "papaparse";

interface ItemListProps {
  items: WheelItem[];
  onItemsChange: (items: WheelItem[]) => void;
  onShuffle: () => void;
  onDisableItem: (itemId: string) => void;
  onResetAllItems: () => void;
  onEnableAllItems: () => void;
  isSpinning?: boolean;
}

export const ItemList = ({
  items,
  onItemsChange,
  onShuffle,
  onDisableItem,
  onResetAllItems,
  onEnableAllItems,
  isSpinning = false,
}: ItemListProps) => {
  const [newItemName, setNewItemName] = useState("");
  const [newItemWeight, setNewItemWeight] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  // const [showPercentage, setShowPercentage] = useState(false);
  // const [editingItemId, setEditingItemId] = useState<string | null>(null);
  // const [editingValue, setEditingValue] = useState("");
  // const blurTimeoutRef = useRef<number | null>(null);

  // Generate colors in hex format for color pickers
  const generatedColorsHex = useMemo(
    () => generateColorsHex(items.length),
    [items.length]
  );

  // Get the actual color that will be displayed (in hex format for color picker)
  const getItemDisplayColor = (item: WheelItem, index: number): string => {
    return item.color || generatedColorsHex[index % generatedColorsHex.length];
  };

  const addItem = () => {
    if (!newItemName.trim()) return;

    // Replace comma with dot for decimal numbers
    const weightStr = newItemWeight.replace(",", ".");
    const weight = parseFloat(weightStr) || 1;
    const newItem: WheelItem = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      weight: Math.max(0.1, weight),
    };

    onItemsChange([...items, newItem]);
    setNewItemName("");
    setNewItemWeight("1");
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter((item) => item.id !== id));
  };

  const updateItemWeight = (id: string, weight: number) => {
    onItemsChange(
      items.map((item) =>
        item.id === id ? { ...item, weight: Math.max(0, weight) } : item
      )
    );
  };

  const updateItemName = (id: string, name: string) => {
    onItemsChange(
      items.map((item) => (item.id === id ? { ...item, name } : item))
    );
  };

  const updateItemColor = (id: string, color: string) => {
    onItemsChange(
      items.map((item) => (item.id === id ? { ...item, color } : item))
    );
  };

  const updateItemSound = (
    id: string,
    soundUrl: string | undefined,
    fileName?: string
  ) => {
    onItemsChange(
      items.map((item) =>
        item.id === id
          ? { ...item, customSound: soundUrl, customSoundName: fileName }
          : item
      )
    );
  };

  const handleSoundUpload = (id: string, file: File) => {
    if (!file.type.startsWith("audio/")) {
      alert("Please select an audio file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      updateItemSound(id, result, file.name);
    };
    reader.onerror = () => {
      alert("Failed to load audio file");
    };
    reader.readAsDataURL(file);
  };

  const testItemSound = (item: WheelItem) => {
    if (item.customSound) {
      playCustomSound(item.customSound);
    }
  };

  const bulkAdd = (text: string) => {
    let newItems: WheelItem[] = [];
    const trimmedText = text
      .split("\n")
      .map((line) => line.replace(/\t{2,}/g, "\t"))
      .join("\n");

    Papa.parse<[string, string?, string?, string?]>(trimmedText, {
      header: false,
      skipEmptyLines: "greedy",
      newline: "\n",
      delimitersToGuess: ["\t", ":"],
      quoteChar: "\0",
      transform: (value, columnIndex) => {
        if (columnIndex === 1 && typeof value === "string") {
          return value.replace(",", ".");
        }
        return value;
      },
      complete(results) {
        results.data.forEach((e) => {
          let weight = 1;

          if (e[1] && !Number.isNaN(Number.parseFloat(e[1]))) {
            weight = Number(e[1]);
          }

          // Disable because currently no support for data with header
          // let des = "";
          // if (e[2]?.length) des = e[2];
          // if (e[3]?.length) {
          //   // Usable
          //   if (
          //     e[3].includes("%", -1) &&
          //     !Number.isNaN(Number.parseInt(e[3].replace("%", "")))
          //   ) {
          //     des = `${e[2]}\nUsable: ${e[3]}`;
          //   }
          // }
          newItems.push({
            id: crypto.randomUUID(),
            name: e[0],
            weight: weight,
            // Disable because currently no support for data with header
            // effectDescription: des,
          });
        });
      },
    });

    onItemsChange([...items, ...newItems]);
  };

  const balanceWeights = () => {
    // Get all active items (not disabled, weight > 0)
    const activeItems = items.filter(
      (item) => !item.disabled && item.weight > 0
    );
    if (activeItems.length === 0) return;

    // Set all active items to equal weight of 1
    onItemsChange(
      items.map((item) =>
        !item.disabled && item.weight > 0 ? { ...item, weight: 1 } : item
      )
    );
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || isSpinning) return;

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    onItemsChange(reorderedItems);
  };

  // Calculate percentage for each item
  // const calculatePercentage = (itemWeight: number) => {
  //   const activeItems = items.filter(
  //     (item) => !item.disabled && item.weight > 0
  //   );
  //   const totalWeight = activeItems.reduce((sum, item) => sum + item.weight, 0);
  //   if (totalWeight === 0) return 0;
  //   return ((itemWeight / totalWeight) * 100).toFixed(1);
  // };

  // Calculate weight from percentage
  // const calculateWeightFromPercentage = (itemId: string, percentage: number) => {
  //   // Get all items except the one being edited
  //   const otherItems = items.filter(
  //     (item) => item.id !== itemId && !item.disabled && item.weight > 0
  //   );
  //   const otherTotalWeight = otherItems.reduce((sum, item) => sum + item.weight, 0);

  //   // If no other items have weight, just return the percentage as the weight
  //   if (otherTotalWeight === 0) {
  //     return percentage;
  //   }

  //   // Calculate: if we want this item to be X%, and other items sum to Y weight,
  //   // then this item's weight = (X / (100 - X)) * Y
  //   if (percentage >= 100) return otherTotalWeight * 99; // Cap at very high weight
  //   if (percentage <= 0) return 0;

  //   return (percentage / (100 - percentage)) * otherTotalWeight;
  // };

  return (
    <div className="space-y-3">
      {/* Add Items Section */}
      <div className="bg-gray-800 p-3 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold mb-2 text-white flex items-center gap-2">
          Add Items
        </h3>

        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !isSpinning && addItem()}
            placeholder="Item name"
            className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSpinning}
          />
          <input
            type="number"
            value={newItemWeight}
            onChange={(e) => setNewItemWeight(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !isSpinning && addItem()}
            placeholder="Weight"
            min="0.1"
            step="0.1"
            className="w-20 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSpinning}
          />
          <button
            onClick={addItem}
            disabled={isSpinning}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors text-sm disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>

        <details className="mb-2">
          <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
            Multi-line
          </summary>
          <textarea
            placeholder="Enter items, one per line&#10;Format: Name or Name: Weight or Name, Weight or paste from Excel (tab-separated)"
            className="w-full mt-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            rows={5}
            disabled={isSpinning}
            onBlur={(e) => {
              if (e.target.value.trim() && !isSpinning) {
                bulkAdd(e.target.value);
                e.target.value = "";
              }
            }}
          />
        </details>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onShuffle}
            disabled={items.length === 0 || isSpinning}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium transition-colors text-sm"
          >
            Shuffle
          </button>
          <button
            onClick={() => onItemsChange([])}
            disabled={items.length === 0 || isSpinning}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium transition-colors text-sm"
          >
            Clear All
          </button>
        </div>

        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 mb-2">
            More Actions
          </summary>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onResetAllItems}
              disabled={
                items.length === 0 ||
                !items.some((item) => item.disabled) ||
                isSpinning
              }
              className="px-2 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium transition-colors text-xs"
              title="Reset all disabled items"
            >
              Reset All
            </button>
            <button
              onClick={onEnableAllItems}
              disabled={
                items.length === 0 ||
                !items.some((item) => item.disabled) ||
                isSpinning
              }
              className="px-2 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium transition-colors text-xs"
              title="Enable all disabled items (including extinct races)"
            >
              Enable All
            </button>
            <button
              onClick={balanceWeights}
              disabled={items.length === 0 || isSpinning}
              className="px-2 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium transition-colors text-xs"
              title="Set all active items to equal weight"
            >
              Balance
            </button>
          </div>
        </details>
      </div>

      {/* Items List */}
      <div className="bg-gray-800 p-3 rounded-lg shadow-lg">
        {/* Header with Title and Search */}
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-lg font-bold text-white whitespace-nowrap">
            Items ({items.length})
          </h3>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="items-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="h-[500px] overflow-y-auto pr-2 custom-scrollbar"
              >
                {items.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No items added yet
                  </p>
                ) : (
                  <div className="space-y-1">
                    {items
                      .filter((item) =>
                        item.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                      )
                      .map((item, index) => {
                        // Get the original index from the full items array
                        const originalIndex = items.findIndex(
                          (i) => i.id === item.id
                        );
                        const displayColor = getItemDisplayColor(
                          item,
                          originalIndex
                        );

                        return (
                          <Draggable
                            key={item.id}
                            draggableId={item.id}
                            index={index}
                            isDragDisabled={isSpinning}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-1.5 rounded transition-colors ${
                                  snapshot.isDragging
                                    ? "bg-blue-600 shadow-lg"
                                    : item.disabled
                                    ? "bg-gray-800 opacity-60"
                                    : "bg-gray-700 hover:bg-gray-650"
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="color"
                                    value={displayColor}
                                    onChange={(e) =>
                                      updateItemColor(item.id, e.target.value)
                                    }
                                    className="w-7 h-7 rounded cursor-pointer border border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Pick color"
                                    disabled={item.disabled || isSpinning}
                                  />
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) =>
                                      updateItemName(item.id, e.target.value)
                                    }
                                    className="flex-1 px-2 py-1 text-sm bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                    disabled={item.disabled || isSpinning}
                                  />
                                  {/* {showPercentage ? (
                      <input
                        type="text"
                        value={
                          editingItemId === item.id
                            ? editingValue
                            : calculatePercentage(item.weight)
                        }
                        onFocus={() => {
                          // Cancel any pending blur action
                          if (blurTimeoutRef.current) {
                            clearTimeout(blurTimeoutRef.current);
                            blurTimeoutRef.current = null;
                          }
                          setEditingItemId(item.id);
                          setEditingValue(String(calculatePercentage(item.weight)));
                        }}
                        onBlur={() => {
                          // Delay blur to check if user is clicking another percentage input
                          blurTimeoutRef.current = setTimeout(() => {
                            setEditingItemId(null);
                            // Apply final value on blur
                            if (editingValue === '') {
                              updateItemWeight(item.id, 0);
                            } else {
                              const percentage = parseFloat(editingValue);
                              if (!isNaN(percentage)) {
                                const newWeight = calculateWeightFromPercentage(item.id, Math.min(percentage, 99.9));
                                updateItemWeight(item.id, newWeight);
                              }
                            }
                            blurTimeoutRef.current = null;
                          }, 100);
                        }}
                        onChange={(e) => {
                          const value = e.target.value;

                          // Allow empty string for clearing
                          if (value === '') {
                            setEditingValue('');
                            return;
                          }

                          // Only allow numbers and one decimal point
                          if (!/^\d*\.?\d*$/.test(value)) return;

                          // Limit to XX.X format (2 digits before decimal, 1 after)
                          const parts = value.split('.');
                          if (parts[0].length > 2) return;
                          if (parts.length > 1 && parts[1].length > 1) return;

                          const percentage = parseFloat(value);
                          // Allow typing but validate on blur
                          if (!isNaN(percentage) && percentage > 99.9) return;

                          setEditingValue(value);
                        }}
                        className="w-16 px-1.5 py-1 text-xs text-center bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Percentage (0 = hidden)"
                        placeholder="0.0"
                        disabled={item.disabled || isSpinning}
                      />
                    ) : ( */}
                                  <input
                                    type="number"
                                    value={item.weight}
                                    onChange={(e) => {
                                      // Replace comma with dot for decimal numbers
                                      const weightStr = e.target.value.replace(
                                        ",",
                                        "."
                                      );
                                      updateItemWeight(
                                        item.id,
                                        parseFloat(weightStr)
                                      );
                                    }}
                                    min="0"
                                    step="0.1"
                                    className="w-14 px-1.5 py-1 text-xs text-center bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Weight (0 = hidden)"
                                    disabled={item.disabled || isSpinning}
                                  />
                                  {/* )} */}
                                  {/* Sound controls - always show 2 buttons to prevent layout shift */}
                                  {item.customSound ? (
                                    <button
                                      onClick={() => testItemSound(item)}
                                      disabled={isSpinning}
                                      className="px-1.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed w-7"
                                      title={
                                        item.customSoundName || "Test sound"
                                      }
                                    >
                                      ▶
                                    </button>
                                  ) : (
                                    <label
                                      className={
                                        isSpinning
                                          ? "cursor-not-allowed"
                                          : "cursor-pointer"
                                      }
                                    >
                                      <span
                                        className={`px-1.5 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded text-white transition-colors inline-block w-7 text-center ${
                                          isSpinning
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                        }`}
                                        title="Add sound"
                                      >
                                        +
                                      </span>
                                      <input
                                        type="file"
                                        accept="audio/*"
                                        className="hidden"
                                        disabled={isSpinning}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file && !isSpinning) {
                                            handleSoundUpload(item.id, file);
                                          }
                                        }}
                                      />
                                    </label>
                                  )}
                                  {/* Always show remove sound button */}
                                  <button
                                    onClick={() =>
                                      updateItemSound(item.id, undefined)
                                    }
                                    disabled={!item.customSound || isSpinning}
                                    className="px-1.5 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed w-7"
                                    title={
                                      item.customSound
                                        ? "Remove sound"
                                        : "No sound"
                                    }
                                  >
                                    ×
                                  </button>
                                  <button
                                    onClick={() => onDisableItem(item.id)}
                                    disabled={isSpinning}
                                    className={`px-1.5 py-1 rounded text-white transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed w-7 ${
                                      item.disabled
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-orange-600 hover:bg-orange-700"
                                    }`}
                                    title={
                                      item.disabled
                                        ? "Enable item"
                                        : "Disable item"
                                    }
                                  >
                                    {item.disabled ? "✓" : "○"}
                                  </button>
                                  <button
                                    onClick={() => removeItem(item.id)}
                                    disabled={isSpinning}
                                    className="px-1.5 py-1 bg-red-600 hover:bg-red-700 rounded text-white transition-colors text-xs disabled:bg-gray-600 disabled:cursor-not-allowed w-7"
                                    title="Remove"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                    {provided.placeholder}
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};
