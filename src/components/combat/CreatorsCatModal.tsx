import { Dispatch, SetStateAction } from "react";
import { CharacterStats } from "../../types/character";
import { PvPPlayerData } from "../../types/battleZone";
import { WheelSpinItem } from "../../components/ProbabilityWheelModal";
import { _ALL_STAT_KEYS } from "../../constants/battleZone";
import { getRaceForStatRoll } from "../../utils/combatStats";

// ── Local types (mirror useWheelHandlers.ts) ─────────────────────────────────

type StatBubbleInput = {
  player: "player1" | "player2";
  text: string;
  isPositive: boolean;
};

type PreCombatModalState = {
  isOpen: boolean;
  title: string;
  description: string;
  items: WheelSpinItem[];
  side: "player1" | "player2";
  effectKey: string;
  onResult?: (result: {
    label: string;
    isSuccess: boolean;
    meta?: Record<string, unknown>;
  }) => void;
};

export type CreatorsCatModalState = {
  isOpen: boolean;
  playerLabel: "player1" | "player2";
  step:
    | "choose_effect"
    | "choose_stats"
    | "choose_power"
    | "choose_gear"
    | "choose_weapon"
    | "choose_archetypes"
    | "choose_runeword"
    | "spin_power"
    | "spin_archetype";
  selectedEffect: string;
  chosenStats: (keyof CharacterStats)[];
  chosenArchetypesToRemove: string[];
  rollQueue: (keyof CharacterStats)[];
  rollAccumulated: { stat: keyof CharacterStats; value: number }[];
  rollRaceName: string;
  rollTotal: number;
};

type SummoningScrollEntry = {
  statDeltas: Partial<Record<keyof CharacterStats, number>>;
  startScoreDelta: number;
  summonName: string;
} | null;

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CreatorsCatModalProps {
  player1: PvPPlayerData | null;
  player2: PvPPlayerData | null;
  setPlayer1: Dispatch<SetStateAction<PvPPlayerData | null>>;
  setPlayer2: Dispatch<SetStateAction<PvPPlayerData | null>>;
  creatorsCatModal: CreatorsCatModalState;
  setCreatorsCatModal: Dispatch<SetStateAction<CreatorsCatModalState>>;
  setSummoningScrollResult: Dispatch<
    SetStateAction<Record<string, SummoningScrollEntry>>
  >;
  setPreCombatModal: Dispatch<SetStateAction<PreCombatModalState>>;
  spawnStatBubbles: (bubbles: StatBubbleInput[]) => void;
}

// ── Static data ───────────────────────────────────────────────────────────────

const CREATORS_FAVOR_EFFECTS = [
  "Nhận +1 all stats",
  "Roll lại 3 chỉ số",
  "Tặng 1 Power chỉ định có trong vòng quay Power",
  "Tặng 1 Normal Gear chỉ định",
  "Tặng 1 Normal Weapon chỉ định và 100% dùng được",
  "Loại bỏ Archetype hiện tại, nhận 1 archetype random",
  "Tặng 2 random Power",
  "Nhận +2 vào 2 chỉ số chỉ định",
  "Tặng 1 Runeword",
];

const ALL_STATS: { key: keyof CharacterStats; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "spd", label: "SPD" },
  { key: "dur", label: "DUR" },
  { key: "iq", label: "IQ" },
  { key: "biq", label: "BIQ" },
  { key: "ma", label: "MA" },
];

const ALL_POWERS = [
  "Artist",
  "Writer",
  "Red Shift/LP1211-M",
  "Shooting for Victory",
  "Let's Pump Some Iron!",
  "U=ma2",
  "Healing Factor",
  "Hunter's Rewards",
  "Quirkful",
  "Quirkless",
  "Sybaurafarming",
  "Gourmand",
  "Lone Wolf",
  "Swinging Maestro",
  "The Coast is Clear!",
  "AIDS",
  "Angling and Scheming",
  "Quas",
  "Wex",
  "Exort",
  "Critical Strike",
  "Evasion",
  "Petrification",
  "Magma Strike",
  "EscAPADe",
  "Spirit Link",
  "The Sand of Time",
  "Memory Alter",
  "Frost Fingers",
  "Ice Hammer",
  "Storm Calling",
  "Spear of Fire",
  "Metamagic",
  "Gaze of the Abyss",
  "Memory Freeze",
  "Railroad Realm 🍀",
  "Mewing",
  "Master of War",
  "Armor Piercing",
  "Borrowed Time",
  "Bonk Bonk Bonk",
  "Accelerating Sorcery",
  "Homeguard",
  "Guidance",
  "Bash",
  "Hunter's Mark",
  "Gate to Heaven",
  "Ice Liquefactors",
  "Bloody Strike",
  "Divine Smite",
  "Fire Control",
  "Thunder Orb",
  "Water Breathing",
  "Mind Control",
  "Blood Manipulation",
  "Sonic Scream",
  "Drunken Boxing",
  "Cursed",
  "Divine Lightning",
  "Fist Fighting",
  "Enhanced Hearing",
  "Rampage",
  "Bloodlust",
  "Rickrolling",
  "Power Absorption",
  "Hand Washing",
  "67",
  "Power Negation",
  "Invulnerability",
  "Overdrive",
  "Age Manipulation",
  "Enlarging",
  "Shrinking",
  "Garlic Breath",
  "The Goat",
  "Fancy Feet",
  "Weapon Enhancing",
  "Body Enhancing",
  "Clear Mind",
  "Force Field",
  "Anti-Magic Barrier",
  "Black Magic",
  "The Great Storm",
  "Continental Super Storm",
  "Sacred Fire",
  "Capybara",
  "Tsunami Control",
  "Rising tide",
  "Seismic",
  "Night Vision",
  "Gotta go Fast",
  "Fair Duel",
  "Uno Reverse Card",
  "Burning Hand",
  "Tick-tock",
  "Frost Armor",
  "Lightning Enchant",
  "Chaos Enchantment",
  "Dream Manipulation",
  "Powerful Strike",
  "Fragrant",
  "Voidwalking",
  "Odin Blessing",
  "Misty Step Ahead",
  "Ballet Dancing",
  "Luck Manipulation",
  "Scrying",
  "Baldening",
  "Cold Breeze",
  "Bucking Bronco",
  "Detect Thoughts",
  "Arcana Blast",
  "Blood Frenzy",
  "Analysis Sins",
  "Cleaning Sins",
  "Hydrate",
  "Groundwork",
  "Dominator",
  "Ice Spike",
  "Stat Absorption",
  "Golden Vow",
  "Acid Breath",
  "Poison Breath",
  "Zoltraak",
  "Encroaching Shadow",
  "No Stopping Me",
  "Mystifying Murmur",
  "Spell Flux",
];

const ALL_NORMAL_GEAR = [
  "Fishing Rod",
  "Sổ tay",
  "Văn tế",
  "Silver Steed",
  "Wooden Shield",
  "Wizard Hat",
  "Love Letter",
  "Holy Symbol",
  "Fingerthing",
  "Healing Flasks",
  "Leather Jacket",
  "Baguette",
  "Frying Pan",
  "Spatula",
  "Gold Pine Resin",
  "Knight's Armor",
  "Cursed Charm",
  "Đai Trinh Tiết",
  "Swift Boots",
  "Kuro's Charm",
  "Buckler",
  "Soap",
  "Magical Scroll",
  "Ba hoa trắng",
  "Xương sống lưỡi",
  "Thuốc tráng dương",
  "Ancient Protector",
  "Cuộn khăn giấy",
  "Academie Ring",
  "Dark Lanthorn",
  "Lover's Glover",
  "Storage Room Key",
  "Giấy Nợ Gia Truyền",
  "Cursed Coin",
  "Shot Glass",
  "Empty Stein",
  "Golden Coin",
  "Kẹo",
  "Ớt",
  "Mì Tôm",
  "Bò Khô",
  "Radio",
  "Đá",
  "Beer",
  "Wine",
  "Kryptonite",
  "Glock",
  "Baron Buff",
  "Leviathan's Mark",
  "Darkin Blade",
  "Stellaron Hunter's Member Card",
  "Khung hình thờ",
  "Trứng Rồng",
  "Soul Sucker",
  "Soul of the Lazy Spirit",
  "Almighty Vampire's Blood",
  "King Gnome's Banana",
  "Human NPC's Axe",
  "God of War's Entry Ticket",
  "The First Dragon Scale",
];

const ALL_NORMAL_WEAPONS = [
  "Banana Peel",
  "Broken Straight Sword",
  "Ukulele",
  "Uchigatana",
  "Kunai",
  "Drums",
  "Magical Staff",
  "Glass Bottle",
  "Wooden Sword",
  "Cursed Pennywort",
  "Slingshot",
  "B.F Sword",
  "Long Bow",
  "Hidden Blade",
  "Summoning Scroll",
  "Nunchuck",
  "Grimoire",
  "Whip",
  "Halberd",
  "Saxophone",
  "Guitar",
  "Flute",
  "Bass",
  "Long Sword",
  "Caestus",
  "War Axe",
  "Wand",
  "Morningstar",
  "Blood Sword",
  "Rapier",
  "Claymore",
  "Zweihänd'r",
  "Astrologer's Staff",
  "Backhand Blade",
  "Clawmark Seal",
];

const ALL_RUNEWORDS = [
  "Razorsharp",
  "Unbreakable",
  "Pennyworthy",
  "Double Claws",
  "Extraordinary",
  "Elven Night",
  "Blackjack",
  "Dead Touch",
  "Affection",
  "Highroller",
  "The Twin",
  "Redemption",
  "Flawless",
  "Death's Dance",
  "Undying Rage",
  "Cure",
  "Adventurous",
  "Resonance",
  "Kinetics",
  "Belligerence",
  "Constitution",
  "Sagacity",
  "Momentum",
  "Preservation",
  "Bastion",
  "Tenacity",
  "Dialectics",
  "Epiphany",
  "Metaphysics",
  "Luminescence",
  "Prudence",
  "Apotheosis",
];

const ALL_ARCHETYPES_WHEEL = [
  "Promised Consort",
  "Cinderheart",
  "Stargazer",
  "Superhero",
  "NPC 💀",
  "Slayer",
  "Gigachad",
  "Egoist",
  "Masochist",
  "Femboy",
  "Người Trong Ban Nhạc",
  "Hero Grave Keeper",
  "Dual Wielder",
  "Bookworm",
  "Gambler",
  "Pacifist",
  "Anti-Social",
  "Follower of the Two Fingers",
  "Devotee",
  "Atheist",
  "X",
  "Glass Cannon",
  "Mid",
  "Time Traveller",
  "Zealot",
  "Hand Fighter",
  "Loyal",
  "Conquerer",
  "Trickster",
  "Paladin",
  "Summoner",
  "Him",
  "Wibu",
  "Perfectionist",
  "Edgelord",
  "Hero of the Emirate🍀",
  "Fisher",
  "Farmer",
  "Chokevy",
  "Blacksmith",
  "Sentinel of Purity",
  "Infirmarian",
  "Gambler Bloodline",
  "Power Ranger",
  "Philosopher",
  "Herald",
  "Invoker",
  "Bravest of the Brave",
];

// ── Component ─────────────────────────────────────────────────────────────────

export function CreatorsCatModal({
  player1,
  player2,
  setPlayer1,
  setPlayer2,
  creatorsCatModal,
  setCreatorsCatModal,
  setSummoningScrollResult,
  setPreCombatModal,
  spawnStatBubbles,
}: CreatorsCatModalProps) {
  if (!creatorsCatModal.isOpen) return null;

  const pLabel = creatorsCatModal.playerLabel;
  const pName = pLabel === "player1" ? player1?.name : player2?.name;
  const pChar = pLabel === "player1" ? player1?.character : player2?.character;
  const setPlayer = pLabel === "player1" ? setPlayer1 : setPlayer2;

  const ALL_ARCHETYPES = pChar?.archetypes || [];

  const applyEffect = (effect: string) => {
    if (effect === "Nhận +1 all stats") {
      setSummoningScrollResult((prev) => {
        const existing = prev[pLabel];
        const base = existing?.statDeltas || {};
        const newDeltas = { ...base };
        for (const k of _ALL_STAT_KEYS)
          newDeltas[k] = (newDeltas[k] || 0) + 1;
        return {
          ...prev,
          [pLabel]: {
            statDeltas: newDeltas,
            startScoreDelta: existing?.startScoreDelta || 0,
            summonName: existing?.summonName || "Creator's Cat",
          },
        };
      });
      spawnStatBubbles([
        {
          player: pLabel,
          text: "Creator's Favor: +1 All Stats",
          isPositive: true,
        },
      ]);
      setCreatorsCatModal((p) => ({ ...p, isOpen: false }));
    } else if (effect === "Roll lại 3 chỉ số") {
      setCreatorsCatModal((p) => ({
        ...p,
        step: "choose_stats",
        selectedEffect: effect,
        chosenStats: [],
      }));
    } else if (
      effect === "Tặng 1 Power chỉ định có trong vòng quay Power"
    ) {
      setCreatorsCatModal((p) => ({
        ...p,
        step: "choose_power",
        selectedEffect: effect,
      }));
    } else if (effect === "Tặng 1 Normal Gear chỉ định") {
      setCreatorsCatModal((p) => ({
        ...p,
        step: "choose_gear",
        selectedEffect: effect,
      }));
    } else if (
      effect === "Tặng 1 Normal Weapon chỉ định và 100% dùng được"
    ) {
      setCreatorsCatModal((p) => ({
        ...p,
        step: "choose_weapon",
        selectedEffect: effect,
      }));
    } else if (
      effect ===
      "Loại bỏ Archetype hiện tại, nhận 1 archetype random"
    ) {
      setCreatorsCatModal((p) => ({
        ...p,
        step: "choose_archetypes",
        selectedEffect: effect,
        chosenArchetypesToRemove: [],
      }));
    } else if (effect === "Tặng 2 random Power") {
      // Mở wheel power 2 lần
      const spinPowerWheel = (
        remaining: number,
        accumulated: string[],
      ) => {
        setPreCombatModal({
          isOpen: true,
          title: `Creator's Favor: Power Wheel (${3 - remaining}/2)`,
          description: `${pName} — Quay Power Wheel (lần ${3 - remaining}/2)`,
          items: ALL_POWERS.map((p) => ({
            label: p,
            weight: 1,
            isSuccess: true,
            color: "#a855f7",
          })),
          side: pLabel,
          effectKey: `creators-cat-power-${pLabel}-${remaining}`,
          onResult: (result) => {
            const newAccumulated = [...accumulated, result.label];
            if (remaining - 1 > 0) {
              spinPowerWheel(remaining - 1, newAccumulated);
            } else {
              // Apply cả 2 powers
              setPlayer((prev) => {
                if (!prev?.character) return prev;
                return {
                  ...prev,
                  character: {
                    ...prev.character,
                    powers: [
                      ...(prev.character.powers || []),
                      ...newAccumulated.map((n) => ({
                        name: n,
                        isLost: false,
                      })),
                    ],
                  },
                };
              });
              spawnStatBubbles(
                newAccumulated.map((n) => ({
                  player: pLabel,
                  text: `Creator's Favor: +Power ${n}`,
                  isPositive: true,
                })),
              );
              setCreatorsCatModal((p) => ({ ...p, isOpen: false }));
            }
          },
        });
      };
      spinPowerWheel(2, []);
      setCreatorsCatModal((p) => ({ ...p, isOpen: false }));
    } else if (effect === "Nhận +2 vào 2 chỉ số chỉ định") {
      setCreatorsCatModal((p) => ({
        ...p,
        step: "choose_stats",
        selectedEffect: effect,
        chosenStats: [],
      }));
    } else if (effect === "Tặng 1 Runeword") {
      setCreatorsCatModal((p) => ({
        ...p,
        step: "choose_runeword",
        selectedEffect: effect,
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-pink-500/40 rounded-none p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-pink-400 text-xl">🐱</span>
          <h2 className="text-white font-bold text-lg">
            Creator's Cat — {pName}
          </h2>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Creator's Favor: Chọn 1 hiệu ứng cho{" "}
          <span className="text-pink-300 font-semibold">
            {pName}
          </span>
        </p>

        {creatorsCatModal.step === "choose_effect" && (
          <div className="flex flex-col gap-2">
            {CREATORS_FAVOR_EFFECTS.map((eff) => (
              <button
                key={eff}
                onClick={() => applyEffect(eff)}
                className="text-left px-4 py-2 bg-gray-800 hover:bg-pink-900/40 border border-gray-700 hover:border-pink-500/60 rounded-none text-sm text-white transition-all"
              >
                {eff}
              </button>
            ))}
          </div>
        )}

        {creatorsCatModal.step === "choose_stats" && (
          <div>
            <p className="text-gray-400 text-sm mb-3">
              {creatorsCatModal.selectedEffect ===
              "Roll lại 3 chỉ số"
                ? "Chọn 3 chỉ số để roll lại (theo race weights):"
                : "Chọn 2 chỉ số để nhận +2:"}
            </p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {ALL_STATS.map(({ key, label }) => {
                const selected =
                  creatorsCatModal.chosenStats.includes(key);
                const maxCount =
                  creatorsCatModal.selectedEffect ===
                  "Roll lại 3 chỉ số"
                    ? 3
                    : 2;
                // Skeleton: IQ cố định 1, không cho chọn khi Roll lại
                const isSkeletonIQ =
                  creatorsCatModal.selectedEffect ===
                    "Roll lại 3 chỉ số" &&
                  key === "iq" &&
                  (pChar?.race?.race || "").toLowerCase() ===
                    "skeleton";
                return (
                  <button
                    key={key}
                    disabled={isSkeletonIQ}
                    onClick={() => {
                      setCreatorsCatModal((p) => {
                        const already = p.chosenStats.includes(key);
                        if (already)
                          return {
                            ...p,
                            chosenStats: p.chosenStats.filter(
                              (s) => s !== key,
                            ),
                          };
                        if (p.chosenStats.length >= maxCount)
                          return p;
                        return {
                          ...p,
                          chosenStats: [...p.chosenStats, key],
                        };
                      });
                    }}
                    className={`px-3 py-2 rounded-none text-sm font-bold transition-all ${isSkeletonIQ ? "opacity-30 cursor-not-allowed bg-gray-700 text-gray-500 border border-gray-600" : selected ? "bg-pink-600 text-white border border-pink-400" : "bg-gray-800 text-gray-300 border border-gray-700 hover:border-pink-500/50"}`}
                  >
                    {label}
                    {isSkeletonIQ ? " (cố định)" : ""}
                  </button>
                );
              })}
            </div>
            {(() => {
              const maxCount =
                creatorsCatModal.selectedEffect ===
                "Roll lại 3 chỉ số"
                  ? 3
                  : 2;
              const ready =
                creatorsCatModal.chosenStats.length === maxCount;
              return (
                <button
                  disabled={!ready}
                  onClick={() => {
                    if (
                      creatorsCatModal.selectedEffect ===
                      "Nhận +2 vào 2 chỉ số chỉ định"
                    ) {
                      setSummoningScrollResult((prev) => {
                        const existing = prev[pLabel];
                        const base = existing?.statDeltas || {};
                        const newDeltas = { ...base };
                        for (const k of creatorsCatModal.chosenStats)
                          newDeltas[k] = (newDeltas[k] || 0) + 2;
                        return {
                          ...prev,
                          [pLabel]: {
                            statDeltas: newDeltas,
                            startScoreDelta:
                              existing?.startScoreDelta || 0,
                            summonName:
                              existing?.summonName ||
                              "Creator's Cat",
                          },
                        };
                      });
                      spawnStatBubbles(
                        creatorsCatModal.chosenStats.map((k) => ({
                          player: pLabel,
                          text: `Creator's Favor: +2 ${k.toUpperCase()}`,
                          isPositive: true,
                        })),
                      );
                      setCreatorsCatModal((p) => ({
                        ...p,
                        isOpen: false,
                      }));
                    } else {
                      // Roll lại 3 chỉ số — dùng rollQueue state machine
                      const raceName = getRaceForStatRoll(
                        pChar as any,
                      );
                      setCreatorsCatModal((p) => ({
                        ...p,
                        isOpen: false,
                        rollQueue: [...p.chosenStats],
                        rollAccumulated: [],
                        rollRaceName: raceName,
                        rollTotal: p.chosenStats.length,
                      }));
                    }
                  }}
                  className="w-full px-4 py-2 bg-pink-700 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-none text-sm font-bold transition-all"
                >
                  Xác nhận ({creatorsCatModal.chosenStats.length}/
                  {maxCount})
                </button>
              );
            })()}
          </div>
        )}

        {creatorsCatModal.step === "choose_power" && (
          <div>
            <p className="text-gray-400 text-sm mb-3">
              Chọn Power từ danh sách:
            </p>
            <div className="max-h-64 overflow-y-auto flex flex-col gap-1 mb-3">
              {ALL_POWERS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPlayer((prev) => {
                      if (!prev?.character) return prev;
                      return {
                        ...prev,
                        character: {
                          ...prev.character,
                          powers: [
                            ...(prev.character.powers || []),
                            { name: p, isLost: false },
                          ],
                        },
                      };
                    });
                    spawnStatBubbles([
                      {
                        player: pLabel,
                        text: `Creator's Favor: +Power ${p}`,
                        isPositive: true,
                      },
                    ]);
                    setCreatorsCatModal((prev) => ({
                      ...prev,
                      isOpen: false,
                    }));
                  }}
                  className="text-left px-3 py-1.5 bg-gray-800 hover:bg-purple-900/40 border border-gray-700 hover:border-purple-500/60 rounded text-xs text-white transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {creatorsCatModal.step === "choose_gear" && (
          <div>
            <p className="text-gray-400 text-sm mb-3">
              Chọn Normal Gear:
            </p>
            <div className="max-h-64 overflow-y-auto flex flex-col gap-1 mb-3">
              {ALL_NORMAL_GEAR.map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setPlayer((prev) => {
                      if (!prev?.character) return prev;
                      const updatedGear = {
                        ...(prev.character as any).gear,
                        normalGear: [
                          ...((prev.character as any).gear
                            ?.normalGear || []),
                          { name: g, isLost: false },
                        ],
                      };
                      return {
                        ...prev,
                        character: {
                          ...prev.character,
                          gear: updatedGear,
                        } as any,
                      };
                    });
                    spawnStatBubbles([
                      {
                        player: pLabel,
                        text: `Creator's Favor: +Gear ${g}`,
                        isPositive: true,
                      },
                    ]);
                    setCreatorsCatModal((prev) => ({
                      ...prev,
                      isOpen: false,
                    }));
                  }}
                  className="text-left px-3 py-1.5 bg-gray-800 hover:bg-green-900/40 border border-gray-700 hover:border-green-500/60 rounded text-xs text-white transition-all"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {creatorsCatModal.step === "choose_weapon" && (
          <div>
            <p className="text-gray-400 text-sm mb-3">
              Chọn Normal Weapon (100% dùng được):
            </p>
            <div className="max-h-64 overflow-y-auto flex flex-col gap-1 mb-3">
              {ALL_NORMAL_WEAPONS.map((w) => (
                <button
                  key={w}
                  onClick={() => {
                    setPlayer((prev) => {
                      if (!prev?.character) return prev;
                      const updatedWeapons = [
                        ...((prev.character as any).weapons || []),
                        {
                          name: w,
                          type: "Normal",
                          usable: true,
                          isLost: false,
                        },
                      ];
                      return {
                        ...prev,
                        character: {
                          ...prev.character,
                          weapons: updatedWeapons,
                        } as any,
                      };
                    });
                    spawnStatBubbles([
                      {
                        player: pLabel,
                        text: `Creator's Favor: +Weapon ${w} (dùng được)`,
                        isPositive: true,
                      },
                    ]);
                    setCreatorsCatModal((prev) => ({
                      ...prev,
                      isOpen: false,
                    }));
                  }}
                  className="text-left px-3 py-1.5 bg-gray-800 hover:bg-blue-900/40 border border-gray-700 hover:border-blue-500/60 rounded text-xs text-white transition-all"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {creatorsCatModal.step === "choose_archetypes" && (
          <div>
            <p className="text-gray-400 text-sm mb-3">
              Chọn Archetype muốn loại bỏ:
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {ALL_ARCHETYPES.map((a: string) => {
                const selected =
                  creatorsCatModal.chosenArchetypesToRemove.includes(
                    a,
                  );
                return (
                  <button
                    key={a}
                    onClick={() =>
                      setCreatorsCatModal((p) => ({
                        ...p,
                        chosenArchetypesToRemove: selected
                          ? p.chosenArchetypesToRemove.filter(
                              (x) => x !== a,
                            )
                          : [...p.chosenArchetypesToRemove, a],
                      }))
                    }
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${selected ? "bg-red-700 text-white border border-red-400" : "bg-gray-800 text-gray-300 border border-gray-700 hover:border-red-500/50"}`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => {
                // Loại bỏ archetypes đã chọn, sau đó mở archetype wheel
                const toRemove = new Set(
                  creatorsCatModal.chosenArchetypesToRemove,
                );
                setPlayer((prev) => {
                  if (!prev?.character) return prev;
                  return {
                    ...prev,
                    character: {
                      ...prev.character,
                      archetypes: (
                        prev.character.archetypes || []
                      ).filter((a) => !toRemove.has(a)),
                    },
                  };
                });
                // Mở archetype wheel
                setPreCombatModal({
                  isOpen: true,
                  title: "Creator's Favor: Archetype Wheel",
                  description: `${pName} — Quay để nhận 1 Archetype mới`,
                  items: ALL_ARCHETYPES_WHEEL.map((a) => ({
                    label: a,
                    weight: 1,
                    isSuccess: true,
                    color: "#f59e0b",
                  })),
                  side: pLabel,
                  effectKey: `creators-cat-archetype-${pLabel}`,
                  onResult: (result) => {
                    setPlayer((prev) => {
                      if (!prev?.character) return prev;
                      return {
                        ...prev,
                        character: {
                          ...prev.character,
                          archetypes: [
                            ...(prev.character.archetypes || []),
                            result.label,
                          ],
                        },
                      };
                    });
                    spawnStatBubbles([
                      {
                        player: pLabel,
                        text: `Creator's Favor: +Archetype ${result.label}`,
                        isPositive: true,
                      },
                    ]);
                  },
                });
                setCreatorsCatModal((p) => ({
                  ...p,
                  isOpen: false,
                }));
              }}
              className="w-full px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-none text-sm font-bold transition-all"
            >
              Loại bỏ đã chọn & Quay Archetype Wheel
            </button>
          </div>
        )}

        {creatorsCatModal.step === "choose_runeword" && (
          <div>
            <p className="text-gray-400 text-sm mb-3">
              Chọn Runeword mới (runeword cũ sẽ bị xóa):
            </p>
            <div className="max-h-64 overflow-y-auto flex flex-col gap-1 mb-3">
              {ALL_RUNEWORDS.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setPlayer((prev) => {
                      if (!prev?.character) return prev;
                      // Xóa runeword cũ, thêm runeword mới (simplified — just set runeword name)
                      const updatedRunes = {
                        ...((prev.character as any).runes || {}),
                        runeword: r,
                      };
                      return {
                        ...prev,
                        character: {
                          ...prev.character,
                          runes: updatedRunes,
                        } as any,
                      };
                    });
                    spawnStatBubbles([
                      {
                        player: pLabel,
                        text: `Creator's Favor: Runeword → ${r}`,
                        isPositive: true,
                      },
                    ]);
                    setCreatorsCatModal((prev) => ({
                      ...prev,
                      isOpen: false,
                    }));
                  }}
                  className="text-left px-3 py-1.5 bg-gray-800 hover:bg-yellow-900/40 border border-gray-700 hover:border-yellow-500/60 rounded text-xs text-white transition-all"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() =>
            setCreatorsCatModal((p) => ({ ...p, isOpen: false }))
          }
          className="mt-4 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-none text-xs transition-all"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
