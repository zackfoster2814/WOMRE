/**
 * CharacterBuilder - Full character configuration panel for sandbox
 */

import { useState, useEffect, useCallback } from "react";
import type {
  Character,
  CharacterStats,
} from "../../types/character";
import { EffectSelector } from "./EffectSelector";

export interface CharacterBuilderInitialState {
  name: string;
  baseStats: CharacterStats;
  raceName: string;
  subRaceName: string;
  archetypes: string[];
  archetypeSubs: string[];
  powers: string[];
  quirks: string[];
  weaponName: string;
  runeNames: string[];
  runeword: string;
  gearNames: string[];
  houseName: string;
  charDevNames: string[];
}

interface CharacterBuilderProps {
  label: string;
  accentColor: "blue" | "red";
  onCharacterChange: (char: Character) => void;
  onLoadExisting?: () => void;
  initialState?: CharacterBuilderInitialState | null;
}

const STAT_KEYS: { key: keyof CharacterStats; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "spd", label: "SPD" },
  { key: "dur", label: "DUR" },
  { key: "iq", label: "IQ" },
  { key: "biq", label: "BIQ" },
  { key: "ma", label: "MA" },
];

export const CharacterBuilder = ({
  label,
  accentColor,
  onCharacterChange,
  onLoadExisting,
  initialState,
}: CharacterBuilderProps) => {
  const [name, setName] = useState(initialState?.name || label);
  const [baseStats, setBaseStats] = useState<CharacterStats>(
    initialState?.baseStats || {
      str: 5,
      spd: 5,
      dur: 5,
      iq: 5,
      biq: 5,
      ma: 5,
    },
  );

  // Selections
  const [raceName, setRaceName] = useState<string>(initialState?.raceName || "");
  const [subRaceName, setSubRaceName] = useState<string>(initialState?.subRaceName || "");
  const [archetypes, setArchetypes] = useState<string[]>(initialState?.archetypes || []);
  const [archetypeSubs, setArchetypeSubs] = useState<string[]>(initialState?.archetypeSubs || []);
  const [powers, setPowers] = useState<string[]>(initialState?.powers || []);
  const [quirks, setQuirks] = useState<string[]>(initialState?.quirks || []);
  const [weaponName, setWeaponName] = useState<string>(initialState?.weaponName || "");
  const [runeNames, setRuneNames] = useState<string[]>(initialState?.runeNames || []);
  const [runeword, setRuneword] = useState<string>(initialState?.runeword || "");
  const [gearNames, setGearNames] = useState<string[]>(initialState?.gearNames || []);
  const [houseName, setHouseName] = useState<string>(initialState?.houseName || "");
  const [charDevNames, setCharDevNames] = useState<string[]>(initialState?.charDevNames || []);

  // Build Character object from selections
  const buildCharacter = useCallback((): Character => {
    // Build nestedArchetypes from archetypes + archetype subs
    const nestedArchetypes = archetypes.map((a) => ({
      name: a,
    }));
    // Add archetype subs as separate nested entries
    for (const sub of archetypeSubs) {
      nestedArchetypes.push({
        name: "Sandbox",
        subType: undefined,
        subSubType: sub,
      } as any);
    }

    return {
      no: 0,
      name: name || label,
      username: "sandbox",
      isParasite: false,
      race: {
        race: raceName || "Human",
        subRace: subRaceName || undefined,
      },
      archetypes,
      nestedArchetypes: nestedArchetypes.length > 0 ? nestedArchetypes : undefined,
      stats: { ...baseStats },
      quirks: quirks.map((q) => ({ name: q })),
      powers: powers.map((p) => ({ name: p })),
      weapons: weaponName
        ? [{ name: weaponName, type: "Normal" as const, usable: true }]
        : [],
      gear: {
        normalGear: gearNames.map((g) => ({ name: g })),
        legacyGear: [],
      },
      runes: {
        runes: runeNames.map((r) => ({ name: r })),
        runeword: runeword || undefined,
      },
      houses: houseName ? [{ name: houseName }] : [],
      nestedHouses: houseName ? [{ name: houseName }] : undefined,
      charDevs: charDevNames.map((cd) => ({ name: cd })),
      lover: [],
      tournament: { status: "alive" as const, round: "-" as const, bracket: "-" as const },
    };
  }, [
    name, label, baseStats, raceName, subRaceName, archetypes, archetypeSubs,
    powers, quirks, weaponName, runeNames, runeword, gearNames, houseName, charDevNames,
  ]);

  // Notify parent on change
  useEffect(() => {
    onCharacterChange(buildCharacter());
  }, [buildCharacter, onCharacterChange]);

  const updateStat = (key: keyof CharacterStats, delta: number) => {
    setBaseStats((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  };

  const setStatValue = (key: keyof CharacterStats, value: number) => {
    setBaseStats((prev) => ({
      ...prev,
      [key]: Math.max(0, value),
    }));
  };

  const borderColor = accentColor === "blue" ? "border-blue-500/50" : "border-red-500/50";
  const headerBg = accentColor === "blue" ? "bg-blue-600/20" : "bg-red-600/20";
  const headerText = accentColor === "blue" ? "text-blue-400" : "text-red-400";

  return (
    <div className={`bg-gray-800/80 backdrop-blur-sm border ${borderColor} rounded-xl overflow-hidden`}>
      {/* Header */}
      <div className={`${headerBg} px-4 py-3 flex items-center justify-between`}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`bg-transparent ${headerText} font-bold text-lg focus:outline-none w-full`}
          placeholder={label}
        />
        {onLoadExisting && (
          <button
            onClick={onLoadExisting}
            className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors whitespace-nowrap ml-2"
          >
            Load Player
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Base Stats */}
        <div>
          <h3 className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">
            Base Stats
          </h3>
          <div className="grid grid-cols-6 gap-2">
            {STAT_KEYS.map(({ key, label: statLabel }) => (
              <div key={key} className="text-center">
                <div className="text-gray-400 text-xs mb-1">{statLabel}</div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => updateStat(key, -1)}
                    className="px-1 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={baseStats[key]}
                    onChange={(e) =>
                      setStatValue(key, parseInt(e.target.value) || 0)
                    }
                    className="w-10 text-center bg-gray-700 border border-gray-600 rounded text-white text-sm py-0.5 focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => updateStat(key, 1)}
                    className="px-1 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Race */}
        <div className="grid grid-cols-2 gap-3">
          <EffectSelector
            sourceType="race"
            label="Race"
            value={raceName}
            onChange={(v) => setRaceName(v as string)}
          />
          <EffectSelector
            sourceType="sub_race"
            label="Sub-Race"
            value={subRaceName}
            onChange={(v) => setSubRaceName(v as string)}
          />
        </div>

        {/* Archetypes */}
        <EffectSelector
          sourceType="archetype"
          label="Archetypes"
          value={archetypes}
          onChange={(v) => setArchetypes(v as string[])}
          multiple
        />

        {/* Archetype Sub-types */}
        <EffectSelector
          sourceType="archetype_sub"
          label="Archetype Sub-types (MHA Power, Jojo Stand, etc.)"
          value={archetypeSubs}
          onChange={(v) => setArchetypeSubs(v as string[])}
          multiple
        />

        {/* Powers */}
        <EffectSelector
          sourceType="power"
          label="Powers"
          value={powers}
          onChange={(v) => setPowers(v as string[])}
          multiple
        />

        {/* Quirks */}
        <EffectSelector
          sourceType="quirk"
          label="Quirks"
          value={quirks}
          onChange={(v) => setQuirks(v as string[])}
          multiple
        />

        {/* Weapon */}
        <EffectSelector
          sourceType="weapon"
          label="Weapon"
          value={weaponName}
          onChange={(v) => setWeaponName(v as string)}
        />

        {/* Runes & Runeword */}
        <div className="grid grid-cols-2 gap-3">
          <EffectSelector
            sourceType="rune"
            label="Runes"
            value={runeNames}
            onChange={(v) => setRuneNames(v as string[])}
            multiple
          />
          <EffectSelector
            sourceType="runeword"
            label="Runeword"
            value={runeword}
            onChange={(v) => setRuneword(v as string)}
            disabled={!weaponName}
          />
        </div>

        {/* Gear */}
        <EffectSelector
          sourceType="gear"
          label="Gear"
          value={gearNames}
          onChange={(v) => setGearNames(v as string[])}
          multiple
        />

        {/* House */}
        <EffectSelector
          sourceType="house"
          label="House"
          value={houseName}
          onChange={(v) => setHouseName(v as string)}
        />

        {/* Char Dev */}
        <EffectSelector
          sourceType="char_dev"
          label="Character Development"
          value={charDevNames}
          onChange={(v) => setCharDevNames(v as string[])}
          multiple
        />
      </div>
    </div>
  );
};

// Export a function to pre-fill builder from an existing Character
export function characterToBuilderState(char: Character): CharacterBuilderInitialState {
  return {
    name: char.name,
    baseStats: { ...char.stats },
    raceName: char.race?.race || "",
    subRaceName: char.race?.subRace || "",
    archetypes: [...(char.archetypes || [])],
    archetypeSubs: (char.nestedArchetypes || [])
      .flatMap((n) => [n.subType, n.subSubType])
      .filter((s): s is string => !!s),
    powers: (char.powers || []).filter((p) => !p.isLost).map((p) => p.name),
    quirks: (char.quirks || []).filter((q) => !q.isLost).map((q) => q.name),
    weaponName: (char.weapons || []).find((w) => !w.isLost)?.name || "",
    runeNames: (char.runes?.runes || []).filter((r) => !r.isLost).map((r) => r.name),
    runeword: char.runes?.runeword || "",
    gearNames: [
      ...(char.gear?.normalGear || []),
      ...(char.gear?.legacyGear || []),
    ]
      .filter((g) => !g.isLost)
      .map((g) => g.name),
    houseName: (char.houses || []).find((h) => !h.isLost)?.name || "",
    charDevNames: (char.charDevs || []).filter((cd) => !cd.isLost).map((cd) => cd.name),
  };
}
