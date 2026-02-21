/**
 * EffectSelector - Searchable dropdown for selecting effects from registry
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { EffectRegistry } from "../../effects/registry";
import type { EffectSourceType } from "../../effects/types";

interface EffectSelectorProps {
  sourceType: EffectSourceType;
  label: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  disabled?: boolean;
  filterNames?: string[];
}

export const EffectSelector = ({
  sourceType,
  label,
  value,
  onChange,
  multiple = false,
  placeholder,
  disabled = false,
  filterNames,
}: EffectSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get all options from registry, optionally filtered
  const allOptions = useMemo(() => {
    let entries = EffectRegistry.getAllByType(sourceType)
      .map((e) => ({ name: e.name, description: e.description }));
    if (filterNames) {
      const allowed = new Set(filterNames);
      entries = entries.filter((e) => allowed.has(e.name));
    }
    return entries.sort((a, b) => a.name.localeCompare(b.name));
  }, [sourceType, filterNames]);

  // Filter options
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return allOptions;
    const term = searchTerm.toLowerCase();
    return allOptions.filter((o) => o.name.toLowerCase().includes(term));
  }, [allOptions, searchTerm]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedArray = Array.isArray(value) ? value : value ? [value] : [];

  const handleSelect = (name: string) => {
    if (multiple) {
      const arr = Array.isArray(value) ? value : [];
      if (arr.includes(name)) return; // already selected
      onChange([...arr, name]);
    } else {
      onChange(name);
      setIsOpen(false);
    }
    setSearchTerm("");
  };

  const handleRemove = (name: string) => {
    if (multiple) {
      const arr = Array.isArray(value) ? value : [];
      onChange(arr.filter((v) => v !== name));
    } else {
      onChange("");
    }
  };

  const handleClear = () => {
    onChange(multiple ? [] : "");
    setSearchTerm("");
  };

  // Available options (exclude already selected for multi-select)
  const availableOptions = multiple
    ? filteredOptions.filter((o) => !selectedArray.includes(o.name))
    : filteredOptions;

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs text-gray-400 mb-1">{label}</label>

      {/* Selected chips for multi-select */}
      {multiple && selectedArray.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {selectedArray.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-600 rounded text-xs text-gray-200"
            >
              {name}
              <button
                onClick={() => handleRemove(name)}
                className="text-gray-400 hover:text-red-400 ml-0.5"
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-1">
        <div className="relative flex-1">
          <input
            type="text"
            value={
              isOpen
                ? searchTerm
                : !multiple && selectedArray[0]
                  ? selectedArray[0]
                  : searchTerm
            }
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder || `Select ${label.toLowerCase()}...`}
            disabled={disabled}
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          {((!multiple && selectedArray[0]) || searchTerm) && (
            <button
              onClick={handleClear}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs px-1"
            >
              x
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && availableOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-gray-800 border border-gray-600 rounded-lg shadow-xl">
          {availableOptions.slice(0, 50).map((option) => (
            <button
              key={option.name}
              onClick={() => handleSelect(option.name)}
              className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 transition-colors flex justify-between items-start gap-2"
              title={option.description}
            >
              <span className="font-medium">{option.name}</span>
              {option.description && (
                <span className="text-xs text-gray-500 truncate max-w-[50%] text-right">
                  {option.description}
                </span>
              )}
            </button>
          ))}
          {availableOptions.length > 50 && (
            <div className="px-3 py-1.5 text-xs text-gray-500 text-center">
              +{availableOptions.length - 50} more... (type to filter)
            </div>
          )}
        </div>
      )}
    </div>
  );
};
