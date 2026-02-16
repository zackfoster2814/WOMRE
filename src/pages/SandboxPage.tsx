/**
 * SandboxPage - Standalone sandbox for building and testing custom characters
 */

import { useState, useMemo, useCallback } from "react";
import type { Character, CharacterStats } from "../types/character";
import { EffectResolver } from "../effects/resolver";
import { initializeEffectData } from "../effects/data";
import { CharacterParser } from "../utils/characterParser";
import { getAssetPath } from "../utils/basePath";
import wheelBgImage from "../assets/img/wheel-bg.png";
import { CharacterBuilder, characterToBuilderState, type CharacterBuilderInitialState } from "../components/sandbox/CharacterBuilder";
import { SandboxStatDisplay } from "../components/sandbox/SandboxStatDisplay";
import {
  SandboxBattleArena,
  RACE_TIERS,
  type SandboxPlayerData,
} from "../components/sandbox/SandboxBattleArena";

// Initialize effect data
let effectsInitialized = false;
function ensureEffectsInitialized() {
  if (!effectsInitialized) {
    initializeEffectData();
    effectsInitialized = true;
  }
}

// Player loader search data
interface ExistingPlayer {
  no: number;
  name: string;
  username: string;
  race: string;
}

export const SandboxPage = () => {
  ensureEffectsInitialized();

  const [character1, setCharacter1] = useState<Character | null>(null);
  const [character2, setCharacter2] = useState<Character | null>(null);
  const [showBattle, setShowBattle] = useState(false);

  // Player loader state
  const [loadTarget, setLoadTarget] = useState<1 | 2 | null>(null);
  const [loadSearch, setLoadSearch] = useState("");
  const [existingPlayers, setExistingPlayers] = useState<ExistingPlayer[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  // Load existing player list (lazily on first "Load Player" click)
  const loadPlayerList = useCallback(async () => {
    if (existingPlayers.length > 0) return;
    setLoadingPlayers(true);
    try {
      const players: ExistingPlayer[] = [];
      const promises: Promise<void>[] = [];

      for (let i = 1; i <= 260; i++) {
        promises.push(
          fetch(getAssetPath(`/data/No${i}.txt`))
            .then(async (res) => {
              if (res.ok) {
                const content = await res.text();
                const char = CharacterParser.parseCharacterFile(content);
                players.push({
                  no: char.no || i,
                  name: char.name || `Player ${i}`,
                  username: char.username || "",
                  race: char.race?.race || "Human",
                });
              }
            })
            .catch(() => {}),
        );
      }

      await Promise.all(promises);
      players.sort((a, b) => a.no - b.no);
      setExistingPlayers(players);
    } finally {
      setLoadingPlayers(false);
    }
  }, [existingPlayers.length]);

  // Load a specific player into a builder slot
  const loadExistingPlayer = useCallback(
    async (playerNo: number, target: 1 | 2) => {
      try {
        const res = await fetch(getAssetPath(`/data/No${playerNo}.txt`));
        if (!res.ok) return;
        const content = await res.text();
        const char = CharacterParser.parseCharacterFile(content);
        if (target === 1) {
          setCharacter1(char);
          setBuilder1Key((k) => k + 1);
          setBuilder1Initial(characterToBuilderState(char));
        } else {
          setCharacter2(char);
          setBuilder2Key((k) => k + 1);
          setBuilder2Initial(characterToBuilderState(char));
        }
        setLoadTarget(null);
        setLoadSearch("");
      } catch (e) {
        console.error("Failed to load player:", e);
      }
    },
    [],
  );

  // Builder reset keys (force re-mount when loading existing player)
  const [builder1Key, setBuilder1Key] = useState(0);
  const [builder2Key, setBuilder2Key] = useState(0);
  const [builder1Initial, setBuilder1Initial] = useState<CharacterBuilderInitialState | null>(null);
  const [builder2Initial, setBuilder2Initial] = useState<CharacterBuilderInitialState | null>(null);

  // Calculate player data for battle
  const player1Data: SandboxPlayerData | null = useMemo(() => {
    if (!character1) return null;
    const effects = EffectResolver.calculateCharacterEffects(character1);
    const race = character1.race?.race || "Human";
    return {
      name: character1.name || "Player 1",
      race,
      raceTier: RACE_TIERS[race] || 99,
      stats: {
        str: effects.totalStats.strength,
        spd: effects.totalStats.speed,
        dur: effects.totalStats.durability,
        iq: effects.totalStats.iq,
        biq: effects.totalStats.biq,
        ma: effects.totalStats.ma,
      } as CharacterStats,
    };
  }, [character1]);

  const player2Data: SandboxPlayerData | null = useMemo(() => {
    if (!character2) return null;
    const effects = EffectResolver.calculateCharacterEffects(character2);
    const race = character2.race?.race || "Human";
    return {
      name: character2.name || "Player 2",
      race,
      raceTier: RACE_TIERS[race] || 99,
      stats: {
        str: effects.totalStats.strength,
        spd: effects.totalStats.speed,
        dur: effects.totalStats.durability,
        iq: effects.totalStats.iq,
        biq: effects.totalStats.biq,
        ma: effects.totalStats.ma,
      } as CharacterStats,
    };
  }, [character2]);

  // Filter existing players
  const filteredPlayers = useMemo(() => {
    if (!loadSearch) return existingPlayers.slice(0, 20);
    const term = loadSearch.toLowerCase();
    return existingPlayers
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.username.toLowerCase().includes(term) ||
          p.no.toString().includes(term),
      )
      .slice(0, 20);
  }, [existingPlayers, loadSearch]);

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{
        backgroundImage: `url(${wheelBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 mb-2">
            Sandbox Mode
          </h1>
          <p className="text-gray-400">
            Build custom characters and test battles
          </p>
        </div>

        {/* Main Layout: Two Builders Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Player 1 */}
          <div className="space-y-4">
            <CharacterBuilderWithState
              key={`p1-${builder1Key}`}
              label="Player 1"
              accentColor="blue"
              onCharacterChange={setCharacter1}
              onLoadExisting={() => {
                setLoadTarget(1);
                loadPlayerList();
              }}
              initialState={builder1Initial}
            />
            <div className="bg-gray-800/80 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4">
              <SandboxStatDisplay character={character1} />
            </div>
          </div>

          {/* Player 2 */}
          <div className="space-y-4">
            <CharacterBuilderWithState
              key={`p2-${builder2Key}`}
              label="Player 2"
              accentColor="red"
              onCharacterChange={setCharacter2}
              onLoadExisting={() => {
                setLoadTarget(2);
                loadPlayerList();
              }}
              initialState={builder2Initial}
            />
            <div className="bg-gray-800/80 backdrop-blur-sm border border-red-500/30 rounded-xl p-4">
              <SandboxStatDisplay character={character2} />
            </div>
          </div>
        </div>

        {/* Battle Section */}
        {character1 && character2 && (
          <div className="mb-8">
            {!showBattle ? (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowBattle(true)}
                  className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-2xl text-white font-bold text-2xl transition-all transform hover:scale-105 shadow-lg"
                >
                  ⚔️ BATTLE ⚔️
                </button>
              </div>
            ) : (
              <div className="bg-gray-800/80 backdrop-blur-sm border border-amber-500/30 rounded-xl p-6">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowBattle(false)}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Close Battle ✕
                  </button>
                </div>
                <SandboxBattleArena
                  player1={player1Data}
                  player2={player2Data}
                />
              </div>
            )}
          </div>
        )}

        {/* Load Player Modal */}
        {loadTarget !== null && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[3000]">
            <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  Load Player into {loadTarget === 1 ? "Player 1" : "Player 2"}
                </h3>
                <button
                  onClick={() => {
                    setLoadTarget(null);
                    setLoadSearch("");
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <input
                type="text"
                value={loadSearch}
                onChange={(e) => setLoadSearch(e.target.value)}
                placeholder="Search by name, username, or No..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-4"
                autoFocus
              />

              <div className="flex-1 overflow-y-auto space-y-1">
                {loadingPlayers ? (
                  <div className="text-center text-gray-400 py-8">
                    Loading players...
                  </div>
                ) : (
                  filteredPlayers.map((p) => (
                    <button
                      key={p.no}
                      onClick={() => loadExistingPlayer(p.no, loadTarget)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 rounded transition-colors flex items-center gap-3"
                    >
                      <span className="text-gray-500 w-8 text-right">
                        #{p.no}
                      </span>
                      <span className="font-medium flex-1">{p.name}</span>
                      <span className="text-gray-500 text-xs">{p.race}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Wrapper that passes initialState to CharacterBuilder
const CharacterBuilderWithState = ({
  label,
  accentColor,
  onCharacterChange,
  onLoadExisting,
  initialState,
}: {
  label: string;
  accentColor: "blue" | "red";
  onCharacterChange: (char: Character) => void;
  onLoadExisting: () => void;
  initialState: CharacterBuilderInitialState | null;
}) => {
  return (
    <CharacterBuilder
      label={initialState?.name || label}
      accentColor={accentColor}
      onCharacterChange={onCharacterChange}
      onLoadExisting={onLoadExisting}
      initialState={initialState}
    />
  );
};
