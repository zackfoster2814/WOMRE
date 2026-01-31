/**
 * Wiki Page
 *
 * Hiển thị tất cả thông tin về effects trong game
 * Không hiển thị weight
 */

import { useState, useMemo, useEffect } from 'react';
import { EffectRegistry } from '../effects/registry';
import { initializeEffectData } from '../effects/data';
import type { EffectRegistryEntry, EffectSourceType } from '../effects/types';

// Ensure effects are initialized
let effectsInitialized = false;
function ensureEffectsInitialized() {
  if (!effectsInitialized) {
    initializeEffectData();
    effectsInitialized = true;
  }
}

// Category configuration
const CATEGORIES: {
  id: EffectSourceType | 'house_sub' | 'archetype_sub';
  label: string;
  icon: string;
  color: string;
  description: string;
}[] = [
  { id: 'race', label: 'Races', icon: '🧬', color: 'bg-emerald-600', description: 'Các chủng tộc trong game' },
  { id: 'sub_race', label: 'Sub-Races', icon: '🌿', color: 'bg-emerald-500', description: 'Phân nhánh của các chủng tộc' },
  { id: 'archetype', label: 'Archetypes', icon: '⚔️', color: 'bg-amber-600', description: 'Các archetype định hình tính cách' },
  { id: 'house', label: 'Houses', icon: '🏰', color: 'bg-indigo-600', description: 'Các gia tộc trong game' },
  { id: 'house_sub', label: 'House Features', icon: '🛡️', color: 'bg-indigo-500', description: 'Tính năng đặc biệt của House' },
  { id: 'quirk', label: 'Quirks', icon: '🎭', color: 'bg-pink-600', description: 'Các quirk (tật/đặc điểm)' },
  { id: 'power', label: 'Powers', icon: '⚡', color: 'bg-yellow-600', description: 'Các sức mạnh đặc biệt' },
  { id: 'weapon', label: 'Weapons', icon: '🗡️', color: 'bg-red-600', description: 'Các vũ khí' },
  { id: 'gear', label: 'Gears', icon: '🎒', color: 'bg-orange-600', description: 'Các trang bị' },
  { id: 'rune', label: 'Runes', icon: '🔮', color: 'bg-purple-600', description: 'Các rune đơn lẻ' },
  { id: 'runeword', label: 'Runewords', icon: '✨', color: 'bg-purple-500', description: 'Kết hợp runes' },
  { id: 'char_dev', label: 'Character Development', icon: '📖', color: 'bg-cyan-600', description: 'Các sự kiện phát triển nhân vật' },
  { id: 'pvp_reward', label: 'PvP Rewards', icon: '🏆', color: 'bg-rose-600', description: 'Phần thưởng PvP' },
  { id: 'symbiosis', label: 'Symbiosis', icon: '🔗', color: 'bg-teal-600', description: 'Cộng sinh' },
];

// Format effect description with stat highlights
function formatDescription(description: string): React.ReactNode {
  // Highlight stat values like "+2", "-1", numbers
  const parts = description.split(/(\+\d+|-\d+|\d+%)/g);
  return parts.map((part, i) => {
    if (/^\+\d+$/.test(part)) {
      return <span key={i} className="text-green-400 font-semibold">{part}</span>;
    }
    if (/^-\d+$/.test(part)) {
      return <span key={i} className="text-red-400 font-semibold">{part}</span>;
    }
    if (/^\d+%$/.test(part)) {
      return <span key={i} className="text-blue-400 font-semibold">{part}</span>;
    }
    return part;
  });
}

// Effect Card Component
function EffectCard({ entry }: { entry: EffectRegistryEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get stat effects summary
  const statEffects = useMemo(() => {
    const effects: string[] = [];
    for (const effect of entry.effects) {
      if (effect.type === 'stat_modifier' && effect.timing === 'immediate' && effect.value !== undefined) {
        const prefix = effect.value > 0 ? '+' : '';
        const statMap: Record<string, string> = {
          strength: 'STR', speed: 'SPD', durability: 'DUR',
          iq: 'IQ', biq: 'BIQ', ma: 'MA', all: 'All Stats',
          highest: 'Highest', lowest: 'Lowest', random: 'Random'
        };
        const statName = statMap[effect.stat as string] || effect.stat;
        effects.push(`${prefix}${effect.value} ${statName}`);
      }
    }
    return effects;
  }, [entry.effects]);

  // Check if has complex effects
  const hasComplexEffects = entry.effects.some(e =>
    e.type !== 'stat_modifier' ||
    e.timing !== 'immediate' ||
    e.conditions?.length ||
    e.customHandler
  );

  return (
    <div
      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer border border-gray-700 hover:border-gray-600"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-white font-medium text-lg">{entry.name}</h3>
          {statEffects.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {statEffects.map((effect, i) => (
                <span
                  key={i}
                  className={`text-xs px-2 py-0.5 rounded ${
                    effect.startsWith('+') ? 'bg-green-900/50 text-green-400' :
                    effect.startsWith('-') ? 'bg-red-900/50 text-red-400' :
                    'bg-blue-900/50 text-blue-400'
                  }`}
                >
                  {effect}
                </span>
              ))}
            </div>
          )}
        </div>
        {hasComplexEffects && (
          <span className="text-yellow-500 text-sm ml-2" title="Has special effects">
            ⚙️
          </span>
        )}
      </div>

      {entry.description && (
        <p className="text-gray-400 text-sm mt-2">
          {formatDescription(entry.description)}
        </p>
      )}

      {isExpanded && entry.effects.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <h4 className="text-xs text-gray-500 uppercase mb-2">Effects Detail</h4>
          <div className="space-y-1">
            {entry.effects.map((effect, i) => (
              <div key={i} className="text-xs text-gray-400 bg-gray-900 rounded px-2 py-1">
                <span className="text-purple-400">{effect.type}</span>
                {effect.stat && <span className="text-blue-400 ml-2">{effect.stat}</span>}
                {effect.value !== undefined && (
                  <span className={effect.value >= 0 ? 'text-green-400 ml-2' : 'text-red-400 ml-2'}>
                    {effect.value >= 0 ? '+' : ''}{effect.value}
                  </span>
                )}
                {effect.timing && effect.timing !== 'immediate' && (
                  <span className="text-yellow-400 ml-2">@{effect.timing}</span>
                )}
                {effect.target && effect.target !== 'self' && (
                  <span className="text-orange-400 ml-2">→{effect.target}</span>
                )}
                {effect.customHandler && (
                  <span className="text-pink-400 ml-2">[{effect.customHandler}]</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Category Section Component
function CategorySection({
  category,
  entries,
  searchQuery
}: {
  category: typeof CATEGORIES[0];
  entries: EffectRegistryEntry[];
  searchQuery: string;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(e =>
      e.name.toLowerCase().includes(query) ||
      e.description?.toLowerCase().includes(query)
    );
  }, [entries, searchQuery]);

  if (filteredEntries.length === 0) return null;

  return (
    <section className="mb-8" id={category.id}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`w-full flex items-center gap-3 p-4 rounded-lg ${category.color} hover:opacity-90 transition-opacity`}
      >
        <span className="text-2xl">{category.icon}</span>
        <div className="flex-1 text-left">
          <h2 className="text-xl font-bold text-white">{category.label}</h2>
          <p className="text-white/70 text-sm">{category.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-white/20 px-2 py-1 rounded text-white text-sm">
            {filteredEntries.length} items
          </span>
          <span className={`text-white transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
            ▼
          </span>
        </div>
      </button>

      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {filteredEntries.map((entry) => (
            <EffectCard key={entry.name} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}

// Main Wiki Page Component
export function WikiPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    ensureEffectsInitialized();
  }, []);

  // Get all entries grouped by category
  const entriesByCategory = useMemo(() => {
    const result: Record<string, EffectRegistryEntry[]> = {};

    for (const category of CATEGORIES) {
      const entries = EffectRegistry.getAllByType(category.id as EffectSourceType);
      // Sort alphabetically
      result[category.id] = entries.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, []);

  // Count total entries
  const totalEntries = useMemo(() => {
    return Object.values(entriesByCategory).reduce((sum, entries) => sum + entries.length, 0);
  }, [entriesByCategory]);

  // Scroll to category
  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(categoryId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <span>📚</span>
                <span>Wheel of Multiverse Wiki</span>
              </h1>
              <p className="text-gray-400 mt-1">
                {totalEntries} effects across {CATEGORIES.length} categories
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search effects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Quick Nav */}
          <div className="flex flex-wrap gap-2 mt-4">
            {CATEGORIES.map((cat) => {
              const count = entriesByCategory[cat.id]?.length || 0;
              if (count === 0) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    activeCategory === cat.id
                      ? `${cat.color} text-white`
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {cat.icon} {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {CATEGORIES.map((category) => {
          const entries = entriesByCategory[category.id] || [];
          if (entries.length === 0) return null;
          return (
            <CategorySection
              key={category.id}
              category={category}
              entries={entries}
              searchQuery={searchQuery}
            />
          );
        })}

        {/* No Results */}
        {searchQuery && Object.values(entriesByCategory).every(entries =>
          entries.filter(e =>
            e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.description?.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0
        ) && (
          <div className="text-center py-16">
            <span className="text-6xl">🔍</span>
            <p className="text-gray-400 mt-4 text-lg">
              No results found for "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            >
              Clear Search
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
          <p>Wheel of Multiverse Season 3 - Wiki</p>
          <p className="text-sm mt-1">Data extracted from game files</p>
        </div>
      </footer>
    </div>
  );
}
