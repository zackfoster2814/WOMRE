import { useState, useEffect, useCallback } from "react";
import { CharacterParser } from "../utils/characterParser";
import { Character } from "../types/character";
import { WheelCanvas } from "../components/WheelCanvas";
import { WheelItem } from "../types";

interface TournamentPlayer {
  id: number;
  name: string;
  username: string;
  character: Character;
}

interface Match {
  id: number;
  player1: TournamentPlayer | null;
  player2: TournamentPlayer | null;
  winner: TournamentPlayer | null;
  round: number;
  bracket: "winners" | "losers" | "grand_final";
}

interface TournamentState {
  phase: "drawing" | "tournament";
  currentRound: number;
  totalRounds: number;
  matches: Match[];
  drawnPlayers: TournamentPlayer[];
  remainingPlayers: TournamentPlayer[];
  currentDrawingSlot: number;
  eliminatedInRound1: TournamentPlayer[];
  eliminatedInRound2: TournamentPlayer[];
  losersBracket: Match[];
  isDoubleElimination: boolean;
}

export const PvPTournamentPage = () => {
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelItems, setWheelItems] = useState<WheelItem[]>([]);
  const [lastDrawnPlayer, setLastDrawnPlayer] = useState<TournamentPlayer | null>(null);
  const [showBracket, setShowBracket] = useState(false);

  // Load all players (excluding Symbiosis) - exactly 256 players
  useEffect(() => {
    const loadPlayers = async () => {
      setLoading(true);
      try {
        const allPlayers: TournamentPlayer[] = [];
        const maxPlayers = 256; // Exactly 256 players for tournament
        let fileIndex = 1;

        // Load No*.txt files until we have 256 non-Symbiosis players
        while (allPlayers.length < maxPlayers && fileIndex <= 400) {
          try {
            const response = await fetch(`/data/No${fileIndex}.txt`);
            if (response.ok) {
              const content = await response.text();
              const character = CharacterParser.parseCharacterFile(content);

              // Skip Symbiosis characters
              if (character.isSymbiosis || character.race?.race === "Symbiosis") {
                fileIndex++;
                continue;
              }

              allPlayers.push({
                id: character.no,
                name: character.name,
                username: character.username,
                character,
              });
            }
          } catch {
            // File doesn't exist, continue
          }
          fileIndex++;
        }

        // Only take first 256 if we got more
        setPlayers(allPlayers.slice(0, maxPlayers));
      } catch (error) {
        console.error("Error loading players:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, []);

  // Initialize tournament
  const initTournament = useCallback(() => {
    if (players.length === 0) return;

    // Shuffle players for random initial seeding
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    // For 256 players:
    // Round 1: 256 -> 128 (128 matches) - Single Elimination
    // Round 2: 128 -> 64 (64 matches) - Single Elimination
    // Round 3+: Double Elimination begins with 64 players

    setTournament({
      phase: "drawing",
      currentRound: 1,
      totalRounds: Math.ceil(Math.log2(players.length)) + 2, // Extra rounds for double elimination
      matches: [],
      drawnPlayers: [],
      remainingPlayers: shuffled,
      currentDrawingSlot: 1,
      eliminatedInRound1: [],
      eliminatedInRound2: [],
      losersBracket: [],
      isDoubleElimination: false,
    });

    // Update wheel items
    updateWheelItems(shuffled);
  }, [players]);

  // Update wheel items based on remaining players
  const updateWheelItems = (remainingPlayers: TournamentPlayer[]) => {
    const items: WheelItem[] = remainingPlayers.map((p) => ({
      id: `player-${p.id}`,
      name: p.name,
      weight: 1,
    }));
    setWheelItems(items);
  };

  // Handle spin completion
  const handleSpinComplete = (item: WheelItem) => {
    if (!tournament) return;

    const playerId = parseInt(item.id.replace("player-", ""));
    const drawnPlayer = tournament.remainingPlayers.find((p) => p.id === playerId);

    if (!drawnPlayer) return;

    setLastDrawnPlayer(drawnPlayer);

    // Update tournament state
    const newRemaining = tournament.remainingPlayers.filter((p) => p.id !== playerId);
    const newDrawn = [...tournament.drawnPlayers, drawnPlayer];

    setTournament({
      ...tournament,
      drawnPlayers: newDrawn,
      remainingPlayers: newRemaining,
      currentDrawingSlot: tournament.currentDrawingSlot + 1,
    });

    updateWheelItems(newRemaining);
    setIsSpinning(false);
  };

  // Start spinning
  const handleSpin = () => {
    if (!tournament || tournament.remainingPlayers.length === 0 || isSpinning) return;
    setIsSpinning(true);
  };

  // Generate bracket from drawn players
  const generateBracket = () => {
    if (!tournament || tournament.drawnPlayers.length < 2) return;

    const matches: Match[] = [];
    const drawnPlayers = tournament.drawnPlayers;

    // Create Round 1 matches (pairs in draw order)
    for (let i = 0; i < drawnPlayers.length; i += 2) {
      matches.push({
        id: matches.length + 1,
        player1: drawnPlayers[i] || null,
        player2: drawnPlayers[i + 1] || null,
        winner: null,
        round: 1,
        bracket: "winners",
      });
    }

    setTournament({
      ...tournament,
      phase: "tournament",
      matches,
    });
    setShowBracket(true);
  };

  // Quick draw all remaining players
  const quickDrawAll = () => {
    if (!tournament) return;

    // Shuffle remaining players and add to drawn
    const shuffled = [...tournament.remainingPlayers].sort(() => Math.random() - 0.5);
    const newDrawn = [...tournament.drawnPlayers, ...shuffled];

    setTournament({
      ...tournament,
      drawnPlayers: newDrawn,
      remainingPlayers: [],
      currentDrawingSlot: newDrawn.length + 1,
    });

    updateWheelItems([]);
  };

  // Reset tournament
  const resetTournament = () => {
    setTournament(null);
    setLastDrawnPlayer(null);
    setShowBracket(false);
    setWheelItems([]);
  };

  // Export bracket to JSON
  const exportBracket = () => {
    if (!tournament) return;

    const data = {
      totalPlayers: tournament.drawnPlayers.length,
      bracket: tournament.drawnPlayers.map((p, idx) => ({
        seed: idx + 1,
        playerId: p.id,
        name: p.name,
        username: p.username,
      })),
      matches: tournament.matches,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pvp-bracket-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading players...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 pt-16">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-white mb-2">
          PvP Tournament Bracket Draw
        </h1>
        <p className="text-center text-gray-300 mb-6">
          {players.length} players (excluding Symbiosis)
        </p>

        {/* Tournament Format Info */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 text-white">
          <h3 className="font-bold text-yellow-400 mb-2">Tournament Format:</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Round 1 & 2: Single Elimination (256 → 128 → 64)</li>
            <li>Round 3+: Double Elimination (losers get second chance)</li>
            <li>Grand Finals: Winner of Winners Bracket vs Winner of Losers Bracket</li>
          </ul>
        </div>

        {!tournament ? (
          // Start Tournament Button
          <div className="text-center">
            <button
              onClick={initTournament}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-xl rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              Start Bracket Draw
            </button>
          </div>
        ) : showBracket ? (
          // Show Bracket View
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Tournament Bracket</h2>
              <div className="space-x-2">
                <button
                  onClick={exportBracket}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Export Bracket
                </button>
                <button
                  onClick={resetTournament}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Round 1 Matches */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 max-h-[70vh] overflow-y-auto">
              {tournament.matches.map((match) => (
                <div
                  key={match.id}
                  className="bg-gray-800 rounded-lg p-3 border border-gray-700"
                >
                  <div className="text-xs text-gray-400 mb-1">Match #{match.id}</div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between bg-gray-700/50 rounded px-2 py-1">
                      <span className="text-sm text-white truncate">
                        {match.player1?.name || "TBD"}
                      </span>
                      <span className="text-xs text-gray-400">
                        #{match.player1?.id || "-"}
                      </span>
                    </div>
                    <div className="text-center text-gray-500 text-xs">VS</div>
                    <div className="flex items-center justify-between bg-gray-700/50 rounded px-2 py-1">
                      <span className="text-sm text-white truncate">
                        {match.player2?.name || "TBD"}
                      </span>
                      <span className="text-xs text-gray-400">
                        #{match.player2?.id || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Drawing Phase
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Wheel Section */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">
                  Drawing Slot #{tournament.currentDrawingSlot}
                </h2>
                <span className="text-gray-300">
                  {tournament.remainingPlayers.length} remaining
                </span>
              </div>

              {tournament.remainingPlayers.length > 0 ? (
                <div className="max-w-md mx-auto">
                  <WheelCanvas
                    items={wheelItems}
                    isSpinning={isSpinning}
                    onSpinComplete={handleSpinComplete}
                    onSpin={handleSpin}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-green-400 text-xl mb-4">All players drawn!</p>
                  <button
                    onClick={generateBracket}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold rounded-lg"
                  >
                    Generate Bracket
                  </button>
                </div>
              )}

              {/* Last Drawn */}
              {lastDrawnPlayer && (
                <div className="mt-4 p-3 bg-yellow-600/20 border border-yellow-600 rounded-lg">
                  <p className="text-yellow-400 text-center">
                    Last Drawn: <span className="font-bold">{lastDrawnPlayer.name}</span>{" "}
                    (#{lastDrawnPlayer.id})
                  </p>
                </div>
              )}

              {/* Quick Actions */}
              {tournament.remainingPlayers.length > 0 && (
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    onClick={quickDrawAll}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                  >
                    Quick Draw All
                  </button>
                  <button
                    onClick={resetTournament}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* Drawn Players List */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h2 className="text-xl font-bold text-white mb-4">
                Drawn Order ({tournament.drawnPlayers.length} players)
              </h2>
              <div className="max-h-[500px] overflow-y-auto space-y-1">
                {tournament.drawnPlayers.map((player, idx) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded ${
                      idx % 2 === 0 ? "bg-gray-700/50" : "bg-gray-700/30"
                    } ${
                      idx % 2 === 0 ? "border-l-4 border-blue-500" : "border-l-4 border-red-500"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm w-8">#{idx + 1}</span>
                      <span className="text-white">{player.name}</span>
                    </div>
                    <span className="text-gray-400 text-sm">No.{player.id}</span>
                  </div>
                ))}
                {tournament.drawnPlayers.length === 0 && (
                  <p className="text-gray-400 text-center py-4">
                    Spin the wheel to start drawing players
                  </p>
                )}
              </div>

              {/* Match Preview */}
              {tournament.drawnPlayers.length >= 2 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-2">Match Preview</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {Array.from(
                      { length: Math.floor(tournament.drawnPlayers.length / 2) },
                      (_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 bg-gray-700/30 rounded text-sm"
                        >
                          <span className="text-blue-400 truncate flex-1">
                            {tournament.drawnPlayers[i * 2]?.name}
                          </span>
                          <span className="text-gray-500 mx-2">vs</span>
                          <span className="text-red-400 truncate flex-1 text-right">
                            {tournament.drawnPlayers[i * 2 + 1]?.name}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
