/**
 * CharacterBuilder - Full character configuration panel for sandbox
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Character, CharacterStats } from "../../types/character";
import { EffectSelector } from "./EffectSelector";
import { EffectRegistry } from "../../effects/registry";

// ============================================================================
// CONSTRAINT MAPS: Race → Sub-Races, Archetype → Sub-Types
// ============================================================================

const RACE_SUB_RACES: Record<string, string[]> = {
  Goblin: ["1", "50", "100", "1000", "5000", "10000", "100000"],
  Elf: [
    "High Elf",
    "Dark Elf",
    "Wood Elf",
    "Sea Elf",
    "Moon Elf",
    "Sun Elf",
    "Star Elf",
    "Lythari",
  ],
  Dwarf: [
    "Lùn núi",
    "Lùn xám",
    "Cổ Lùn",
    "Lùn thường",
    "Mountain Dwarf",
    "Gray Dwarf",
    "Ancient Dwarf",
  ],
  Troll: ["Regular Troll", "Ice Troll", "Mountain Troll", "Lich Troll"],
  Dragon: [
    "Crimson Dragon",
    "Stone Dragon",
    "Amethyst Dragon",
    "Ancient Dragon",
    "Undead Dragon",
    "Zephyrian Dragon",
    "Tideborn Dragon",
    "Thunder Dragon",
    "Flame Dragon",
    "Ice Dragon",
    "Chaos Dragon",
  ],
  Angel: [
    "Angels",
    "Archangels",
    "Principalities",
    "Powers",
    "Virtues",
    "Dominions",
    "Ophanim",
    "Cherubim",
  ],
  Human: ["Trắng", "Vàng", "Đen"],
  Vampire: [
    "Body Count 1-2",
    "Body Count 10+",
    "Body Count 50+",
    "Body Count 500+",
    "Body Count 2000+",
    "Body Count 10000+",
    "Body Count 50000+",
  ],
  Primordial_Being: ["Air", "Water", "Fire", "Earth"],
  Uma: [
    "Maruzensky",
    "Mejiro Ryan",
    "Taiki Shuttle",
    "Haru Urara",
    "Oguri Cap",
    "Gold Ship",
    "Symboli Rudolf",
    "Silence Suzuka",
    "Mejiro McQueen",
    "Mihono Bourbon",
    "Tokai Teio",
    "Agnes Tachyon",
    "Nice Nature",
    "Special Week",
    "Rice Shower",
    "Mayano Top Gun",
    "Biwa Hayahide",
    "El Condor Pasa",
    "Nagi",
    "Mork",
    "Seiun Sky",
  ],
  Demon: [
    "Lucifer",
    "Beelzebub",
    "Leviathan",
    "Behemoth",
    "Mammon",
    "Belphegor",
    "Asmodeus",
  ],
  Werebeast: [
    "Wereraven",
    "Werewolf",
    "Wererat",
    "Wereboar",
    "Werebear",
    "Werebat",
    "Werecapybara",
    "Weresheep",
    "Wereseal",
  ],
  "Demi-God": [
    "Cursed Sword",
    "War",
    "Love",
    "Time",
    "Fortune",
    "Secret Evil",
    "Knowledge",
    "Arts and Magic",
    "Wilderness and Sea",
    "Creation",
    "Moon",
  ],
  God: [
    "Odin",
    "Týr",
    "Frigg",
    "Baldur",
    "Loki",
    "Freyja",
    "Eir",
    "Bragi",
    "Thor",
  ],
};

// Archetype → which archetype_sub names are valid
const ARCHETYPE_SUBS: Record<string, string[]> = {
  Wibu: [
    "Dược sư tự sự",
    "JJK",
    "Jojo",
    "My Hero Academia",
    "One Piece",
    "Bleach",
  ],
  Farmer: ["Normal Farmer", "thường", "Aura Farmer"],
  Trickster: [
    "Ace of Spades",
    "King of Diamonds",
    "Queen of Clubs",
    "Jack of 97",
    "Ten of Hearts",
  ],
  "Power Ranger": ["Red", "Blue", "Black", "Yellow", "Pink", "Silver"],
  Superhero: [
    "Captain America",
    "Iron Man",
    "Batman",
    "Superman",
    "Wonder Woman",
    "Spiderman",
    "The Flash",
    "Hulk",
  ],
  X: [
    "Lin Ling",
    "E-Soul",
    "Ahu",
    "Lucky Cyan",
    "Loli",
    "The Johnnies",
    "Ghostblade",
    "Dragon Boy",
    "Queen",
    "X",
  ],
};

// Wibu sub-types → their sub-sub-types
const WIBU_SUB_SUBS: Record<string, string[]> = {
  JJK: [
    "Infinity",
    "Malevolent Shrine",
    "Idle Death Gamble",
    "Self-Embodiment of Perfection",
    "Coffin of the Iron Mountain",
    "Deadly Sentencing",
  ],
  Jojo: [
    "Hey Ya!",
    "Tusk Act II",
    "The World",
    "King Crimson",
    "Golden Experience Requiem",
  ],
  "My Hero Academia": [
    "Quirkless",
    "IQ",
    "Dark Shadow",
    "Erasure",
    "Heal",
    "Half-Cold Half-Hot",
    "Float",
    "Hellflame",
    "Rewind",
    "Overhaul",
    "One For All",
    "All For One",
  ],
  "One Piece": [
    "Observation",
    "Armament",
    "Observation + Armament",
    "Observation + Armament + King Conqueror",
  ],
  Bleach: [
    "Shinuchi (Bankai)",
    "Zanka no Tachi (Bankai)",
    "Daiguren Hyorinmaru (Bankai)",
    "Katen Kyokotsu: Karamatsu Shinju (Bankai)",
    "Gangaku Kairo (Bankai)",
  ],
};

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
  onLoadRandom?: () => void;
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
  onLoadRandom,
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
  const [raceName, setRaceName] = useState<string>(
    initialState?.raceName || "",
  );
  const [subRaceName, setSubRaceName] = useState<string>(
    initialState?.subRaceName || "",
  );
  const [archetypes, setArchetypes] = useState<string[]>(
    initialState?.archetypes || [],
  );
  const [archetypeSubs, setArchetypeSubs] = useState<string[]>(
    initialState?.archetypeSubs || [],
  );
  const [powers, setPowers] = useState<string[]>(initialState?.powers || []);
  const [quirks, setQuirks] = useState<string[]>(initialState?.quirks || []);
  const [weaponName, setWeaponName] = useState<string>(
    initialState?.weaponName || "",
  );
  const [runeNames, setRuneNames] = useState<string[]>(
    initialState?.runeNames || [],
  );
  const [runeword, setRuneword] = useState<string>(
    initialState?.runeword || "",
  );
  const [gearNames, setGearNames] = useState<string[]>(
    initialState?.gearNames || [],
  );
  const [houseName, setHouseName] = useState<string>(
    initialState?.houseName || "",
  );
  const [charDevNames, setCharDevNames] = useState<string[]>(
    initialState?.charDevNames || [],
  );

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
      nestedArchetypes:
        nestedArchetypes.length > 0 ? nestedArchetypes : undefined,
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
      tournament: {
        status: "alive" as const,
        round: "-" as const,
        bracket: "-" as const,
      },
    };
  }, [
    name,
    label,
    baseStats,
    raceName,
    subRaceName,
    archetypes,
    archetypeSubs,
    powers,
    quirks,
    weaponName,
    runeNames,
    runeword,
    gearNames,
    houseName,
    charDevNames,
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

  // ============================================================================
  // CONSTRAINT LOGIC
  // ============================================================================

  // Valid sub-races based on selected race
  const validSubRaces = useMemo(() => {
    if (!raceName) return undefined; // show all
    return RACE_SUB_RACES[raceName] || [];
  }, [raceName]);

  // Auto-clear sub-race when race changes and sub-race is no longer valid
  useEffect(() => {
    if (subRaceName && validSubRaces && !validSubRaces.includes(subRaceName)) {
      setSubRaceName("");
    }
  }, [raceName, validSubRaces, subRaceName]);

  // Valid archetype sub-types based on selected archetypes
  const validArchetypeSubs = useMemo(() => {
    if (archetypes.length === 0) return [];
    const allowed: string[] = [];
    for (const arch of archetypes) {
      // Direct sub-types of this archetype
      const directSubs = ARCHETYPE_SUBS[arch];
      if (directSubs) {
        allowed.push(...directSubs);
      }
    }
    // Also add sub-sub-types if a wibu sub-type is selected
    for (const sub of archetypeSubs) {
      const subSubs = WIBU_SUB_SUBS[sub];
      if (subSubs) {
        allowed.push(...subSubs);
      }
    }
    return allowed;
  }, [archetypes, archetypeSubs]);

  // Auto-clear archetype subs when archetypes change
  useEffect(() => {
    if (archetypeSubs.length > 0 && archetypes.length > 0) {
      // Build full allowed set (direct subs only, not sub-subs which depend on current selection)
      const directAllowed = new Set<string>();
      for (const arch of archetypes) {
        const directSubs = ARCHETYPE_SUBS[arch];
        if (directSubs) directSubs.forEach((s) => directAllowed.add(s));
      }
      // Keep subs that are either direct subs or sub-subs of kept subs
      const kept = archetypeSubs.filter((s) => {
        if (directAllowed.has(s)) return true;
        // Check if it's a valid sub-sub of any kept direct sub
        for (const ds of archetypeSubs) {
          if (directAllowed.has(ds) && WIBU_SUB_SUBS[ds]?.includes(s))
            return true;
        }
        return false;
      });
      if (kept.length !== archetypeSubs.length) {
        setArchetypeSubs(kept);
      }
    } else if (archetypes.length === 0 && archetypeSubs.length > 0) {
      setArchetypeSubs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archetypes]);

  // Random character generator
  const randomize = useCallback(() => {
    // Random stats 1-10
    const randStat = () => Math.floor(Math.random() * 10) + 1;
    setBaseStats({
      str: randStat(),
      spd: randStat(),
      dur: randStat(),
      iq: randStat(),
      biq: randStat(),
      ma: randStat(),
    });

    // Random race
    const allRaces = EffectRegistry.getAllByType("race").map((e) => e.name);
    const randomRace =
      allRaces[Math.floor(Math.random() * allRaces.length)] || "Human";
    setRaceName(randomRace);

    // Random sub-race for this race
    const subs = RACE_SUB_RACES[randomRace];
    if (subs && subs.length > 0 && Math.random() > 0.3) {
      setSubRaceName(subs[Math.floor(Math.random() * subs.length)]);
    } else {
      setSubRaceName("");
    }

    // Random archetype (pick 1)
    const allArchetypes = EffectRegistry.getAllByType("archetype").map(
      (e) => e.name,
    );
    const randomArch =
      allArchetypes[Math.floor(Math.random() * allArchetypes.length)];
    setArchetypes(randomArch ? [randomArch] : []);

    // Random archetype sub if applicable
    const archSubs = randomArch ? ARCHETYPE_SUBS[randomArch] : undefined;
    if (archSubs && archSubs.length > 0) {
      const randomSub = archSubs[Math.floor(Math.random() * archSubs.length)];
      const subSubs = WIBU_SUB_SUBS[randomSub];
      if (subSubs && subSubs.length > 0) {
        // Pick a sub-sub too
        const randomSubSub =
          subSubs[Math.floor(Math.random() * subSubs.length)];
        setArchetypeSubs([randomSub, randomSubSub]);
      } else {
        setArchetypeSubs([randomSub]);
      }
    } else {
      setArchetypeSubs([]);
    }

    // Random 0-3 powers
    const allPowers = EffectRegistry.getAllByType("power").map((e) => e.name);
    const numPowers = Math.floor(Math.random() * 4);
    const shuffledPowers = [...allPowers].sort(() => Math.random() - 0.5);
    setPowers(shuffledPowers.slice(0, numPowers));

    // Random 0-2 quirks
    const allQuirks = EffectRegistry.getAllByType("quirk").map((e) => e.name);
    const numQuirks = Math.floor(Math.random() * 3);
    const shuffledQuirks = [...allQuirks].sort(() => Math.random() - 0.5);
    setQuirks(shuffledQuirks.slice(0, numQuirks));

    // Random weapon (50% chance)
    const allWeapons = EffectRegistry.getAllByType("weapon").map((e) => e.name);
    if (Math.random() > 0.5 && allWeapons.length > 0) {
      setWeaponName(allWeapons[Math.floor(Math.random() * allWeapons.length)]);
    } else {
      setWeaponName("");
    }

    // Random 0-2 gear
    const allGear = EffectRegistry.getAllByType("gear").map((e) => e.name);
    const numGear = Math.floor(Math.random() * 3);
    const shuffledGear = [...allGear].sort(() => Math.random() - 0.5);
    setGearNames(shuffledGear.slice(0, numGear));

    // Random house (60% chance)
    const allHouses = EffectRegistry.getAllByType("house").map((e) => e.name);
    if (Math.random() > 0.4 && allHouses.length > 0) {
      setHouseName(allHouses[Math.floor(Math.random() * allHouses.length)]);
    } else {
      setHouseName("");
    }

    // Clear runes/runeword/chardev for simplicity
    setRuneNames([]);
    setRuneword("");
    setCharDevNames([]);

    // Random name
    setName(`Random #${Math.floor(Math.random() * 9999)}`);
  }, []);

  const borderColor =
    accentColor === "blue" ? "border-blue-500/50" : "border-red-500/50";
  const headerBg = accentColor === "blue" ? "bg-blue-600/20" : "bg-red-600/20";
  const headerText = accentColor === "blue" ? "text-blue-400" : "text-red-400";

  return (
    <div
      className={`bg-gray-800/80 backdrop-blur-sm border ${borderColor} rounded-none overflow-hidden`}
    >
      {/* Header */}
      <div
        className={`${headerBg} px-4 py-3 flex items-center justify-between`}
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`bg-transparent ${headerText} font-bold text-lg focus:outline-none w-full`}
          placeholder={label}
        />
        <div className="flex gap-1.5 ml-2 shrink-0">
          <button
            onClick={randomize}
            className="text-xs px-3 py-1 bg-amber-700/60 hover:bg-amber-600/60 text-amber-200 rounded transition-colors whitespace-nowrap"
            title="Random sandbox build"
          >
            Random
          </button>
          {onLoadRandom && (
            <button
              onClick={onLoadRandom}
              className="text-xs px-3 py-1 bg-green-700/60 hover:bg-green-600/60 text-green-200 rounded transition-colors whitespace-nowrap"
              title="Load a random existing player"
            >
              Random Player
            </button>
          )}
          {onLoadExisting && (
            <button
              onClick={onLoadExisting}
              className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors whitespace-nowrap"
            >
              Load Player
            </button>
          )}
        </div>
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
            filterNames={validSubRaces}
            disabled={
              !raceName ||
              (validSubRaces !== undefined && validSubRaces.length === 0)
            }
            placeholder={
              !raceName
                ? "Select race first..."
                : validSubRaces?.length === 0
                  ? "No sub-races"
                  : undefined
            }
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
          filterNames={
            validArchetypeSubs.length > 0 ? validArchetypeSubs : undefined
          }
          disabled={archetypes.length === 0 || validArchetypeSubs.length === 0}
          placeholder={
            archetypes.length === 0
              ? "Select archetype first..."
              : validArchetypeSubs.length === 0
                ? "No sub-types for this archetype"
                : undefined
          }
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
export function characterToBuilderState(
  char: Character,
): CharacterBuilderInitialState {
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
    runeNames: (char.runes?.runes || [])
      .filter((r) => !r.isLost)
      .map((r) => r.name),
    runeword: char.runes?.runeword || "",
    gearNames: [
      ...(char.gear?.normalGear || []),
      ...(char.gear?.legacyGear || []),
    ]
      .filter((g) => !g.isLost)
      .map((g) => g.name),
    houseName: (char.houses || []).find((h) => !h.isLost)?.name || "",
    charDevNames: (char.charDevs || [])
      .filter((cd) => !cd.isLost)
      .map((cd) => cd.name),
  };
}
