import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import menuBg from "../assets/Backgrounds/menu-bg.jpg";
import { CompleteCharacterInfo } from "@/types/characterTypes";

interface RoundResult {
  round: number;
  winner: "player1" | "player2";
  player1Stat: number;
  player2Stat: number;
  statType: string;
}

interface BattleResult {
  winner: "player1" | "player2" | "draw";
  player1Score: number;
  player2Score: number;
  rounds: RoundResult[];
}

export default function PvPBattle() {
  const navigate = useNavigate();
  const [player1, setPlayer1] = useState<CompleteCharacterInfo | null>(null);
  const [player2, setPlayer2] = useState<CompleteCharacterInfo | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [players, setPlayers] = useState<CompleteCharacterInfo[]>([]);
  const [showPlayer1Select, setShowPlayer1Select] = useState(false);
  const [showPlayer2Select, setShowPlayer2Select] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(0);

  const statTypes = [
    { key: "strength", label: "STR" },
    { key: "speed", label: "SPD" },
    { key: "durability", label: "DUR" },
    { key: "iq", label: "IQ" },
    { key: "battleIQ", label: "BIQ" },
    { key: "martialArts", label: "MA" },
  ];

  // Load saved players from database
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const result = await window.electron.ipcRenderer.invoke("get-all-players");
        console.log("PvP - Get all players result:", result);
        if (result.success) {
          console.log("PvP - Players data:", result.data);
          setPlayers(result.data);
        } else {
          console.error("PvP - Failed to load players:", result.error);
        }
      } catch (error) {
        console.error("Error loading players:", error);
      }
    };
    loadPlayers();
  }, []);

  // Draw weighted wheel based on two stat values
  const drawWheel = (stat1: number, stat2: number) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 150;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    // Calculate proportions
    const total = stat1 + stat2;
    const angle1 = (stat1 / total) * Math.PI * 2;
    const angle2 = (stat2 / total) * Math.PI * 2;

    // Draw Player 1 section (blue)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, 0, angle1);
    ctx.closePath();
    ctx.fillStyle = "#3B82F6";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Player 1 label
    ctx.save();
    ctx.rotate(angle1 / 2);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px Arial";
    ctx.fillText("P1", radius * 0.6, 5);
    ctx.font = "bold 16px Arial";
    ctx.fillText(`(${stat1})`, radius * 0.6, 25);
    ctx.restore();

    // Draw Player 2 section (red)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, angle1, angle1 + angle2);
    ctx.closePath();
    ctx.fillStyle = "#EF4444";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Player 2 label
    ctx.save();
    ctx.rotate(angle1 + angle2 / 2);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px Arial";
    ctx.fillText("P2", radius * 0.6, 5);
    ctx.font = "bold 16px Arial";
    ctx.fillText(`(${stat2})`, radius * 0.6, 25);
    ctx.restore();

    ctx.restore();

    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(centerX + radius + 10, centerY);
    ctx.lineTo(centerX + radius + 30, centerY - 15);
    ctx.lineTo(centerX + radius + 30, centerY + 15);
    ctx.closePath();
    ctx.fillStyle = "#FFD700";
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    if (player1 && player2 && currentRound < 6) {
      const statKey = statTypes[currentRound].key as keyof typeof player1.stats;
      const stat1 = parseInt(String(player1.stats[statKey])) || 1;
      const stat2 = parseInt(String(player2.stats[statKey])) || 1;
      drawWheel(stat1, stat2);
    }
  }, [angle, player1, player2, currentRound]);

  const spinWeightedWheel = (stat1: number, stat2: number): Promise<"player1" | "player2"> => {
    return new Promise((resolve) => {
      const spinDuration = 3000;
      const startTime = Date.now();
      const startAngle = angle;

      // Calculate weighted random result
      const total = stat1 + stat2;
      const random = Math.random();
      const player1Wins = random < stat1 / total;

      // Calculate target angle
      const angle1Proportion = (stat1 / total) * Math.PI * 2;
      let targetAngle;
      if (player1Wins) {
        // Land in player1 section (0 to angle1)
        targetAngle = Math.random() * angle1Proportion;
      } else {
        // Land in player2 section (angle1 to 2*PI)
        targetAngle = angle1Proportion + Math.random() * (Math.PI * 2 - angle1Proportion);
      }

      const totalRotation = Math.PI * 2 * 5 + targetAngle; // 5 full rotations + target

      const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);

        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentAngle = startAngle + totalRotation * easeOut;

        setAngle(currentAngle);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve(player1Wins ? "player1" : "player2");
        }
      };

      animate();
    });
  };

  const startBattle = async () => {
    if (!player1 || !player2) {
      alert("Vui lòng chọn đủ 2 nhân vật!");
      return;
    }

    setIsSpinning(true);
    setBattleResult(null);
    setCurrentRound(0);

    const rounds: RoundResult[] = [];
    let player1Score = 0;
    let player2Score = 0;

    // Play 6 rounds
    for (let i = 0; i < 6; i++) {
      setCurrentRound(i);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const statKey = statTypes[i].key as keyof typeof player1.stats;
      const stat1 = parseInt(String(player1.stats[statKey])) || 1;
      const stat2 = parseInt(String(player2.stats[statKey])) || 1;

      // Redraw wheel for current round
      drawWheel(stat1, stat2);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Spin wheel with weighted probability
      const winner = await spinWeightedWheel(stat1, stat2);
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (winner === "player1") {
        player1Score++;
      } else {
        player2Score++;
      }

      rounds.push({
        round: i + 1,
        winner,
        player1Stat: stat1,
        player2Stat: stat2,
        statType: statTypes[i].label,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Determine overall winner
    let overallWinner: "player1" | "player2" | "draw";
    if (player1Score > player2Score) {
      overallWinner = "player1";
    } else if (player1Score < player2Score) {
      overallWinner = "player2";
    } else {
      overallWinner = "draw";
    }

    setBattleResult({
      winner: overallWinner,
      player1Score,
      player2Score,
      rounds,
    });
    setIsSpinning(false);
    setCurrentRound(6);
  };

  const resetBattle = () => {
    setBattleResult(null);
    setCurrentRound(0);
    setAngle(0);
  };

  return (
    <div className="w-screen h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${menuBg})`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-red-950/50 to-black/90" />

      {/* Back button */}
      <button
        onClick={() => navigate("/battle")}
        className="absolute top-8 left-8 px-6 py-3 rounded-xl font-bold text-white bg-purple-900/80 border-2 border-purple-500/40 hover:scale-105 transition-all z-20"
      >
        ← BACK
      </button>

      {/* Main Content */}
      <div className="z-10 w-full h-full flex flex-col items-center justify-start gap-6 p-8 pt-20 overflow-y-auto">
        {/* Title */}
        <h1 className="text-4xl font-black bg-gradient-to-r from-red-400 via-pink-500 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]">
          PvP BATTLE - 6 ROUNDS
        </h1>

        {/* Battle Arena */}
        <div className="flex items-start justify-center gap-8 w-full max-w-7xl">
          {/* Player 1 */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <h2 className="text-xl font-bold text-blue-400">PLAYER 1</h2>

            <div className="w-full bg-blue-900/40 p-3 rounded-xl border-2 border-blue-500/40 max-h-[70vh] overflow-y-auto">
              {!player1 ? (
                <div className="w-full">
                  <button
                    onClick={() => setShowPlayer1Select(!showPlayer1Select)}
                    className="w-full p-3 bg-blue-700/60 hover:bg-blue-600/80 rounded-xl border-2 border-blue-400/40 hover:border-blue-300 transition-all text-white font-bold"
                  >
                    ➕ Chọn Player 1
                  </button>

                  {showPlayer1Select && (
                    <div className="mt-2 max-h-48 overflow-y-auto space-y-2 bg-black/40 p-2 rounded-xl">
                      {players.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setPlayer1(p);
                            setShowPlayer1Select(false);
                          }}
                          className="w-full p-2 bg-blue-900/60 hover:bg-blue-800/80 rounded-lg border border-blue-500/40 hover:border-blue-400 transition-all text-left"
                        >
                          <div className="text-white font-bold text-sm">{p.name}</div>
                          <div className="text-blue-300 text-xs">{p.race}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                <div className="text-center mb-2">
                  <div className="text-xl font-black text-white">{player1.name}</div>
                  <div className="text-blue-300 text-xs">{player1.race} - {player1.subrace}</div>
                  <div className="text-blue-200 text-xs">{player1.house}</div>
                </div>

                {/* Stats */}
                <div className="bg-black/40 p-2 rounded-lg space-y-1 text-xs mb-2">
                  <div className="text-yellow-400 font-bold text-sm mb-1">STATS</div>
                  <div className="text-white">STR: {player1.stats.strength}</div>
                  <div className="text-white">SPD: {player1.stats.speed}</div>
                  <div className="text-white">DUR: {player1.stats.durability}</div>
                  <div className="text-white">IQ: {player1.stats.iq}</div>
                  <div className="text-white">BIQ: {player1.stats.battleIQ}</div>
                  <div className="text-white">MA: {player1.stats.martialArts}</div>
                  <div className="text-green-400 font-bold mt-1">
                    TOTAL: {player1.stats.totalBaseStat}
                  </div>
                </div>

                {/* Powers */}
                {player1.powers && player1.powers.length > 0 && (
                  <div className="bg-purple-900/30 p-2 rounded-lg mb-2">
                    <div className="text-purple-400 font-bold text-xs mb-1">
                      POWERS ({player1.powers.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {player1.powers.map((power, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-purple-600/40 px-2 py-0.5 rounded text-white"
                        >
                          {power}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weapons */}
                {player1.weapons && player1.weapons.length > 0 && (
                  <div className="bg-orange-900/30 p-2 rounded-lg mb-2">
                    <div className="text-orange-400 font-bold text-xs mb-1">
                      WEAPONS ({player1.weapons.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {player1.weapons.map((weapon, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-orange-600/40 px-2 py-0.5 rounded text-white"
                        >
                          {weapon}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gears */}
                {player1.gears && player1.gears.length > 0 && (
                  <div className="bg-green-900/30 p-2 rounded-lg mb-2">
                    <div className="text-green-400 font-bold text-xs mb-1">
                      GEARS ({player1.gears.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {player1.gears.map((gear, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-green-600/40 px-2 py-0.5 rounded text-white"
                        >
                          {gear}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quirks */}
                {player1.quirks && player1.quirks.length > 0 && (
                  <div className="bg-pink-900/30 p-2 rounded-lg mb-2">
                    <div className="text-pink-400 font-bold text-xs mb-1">
                      QUIRKS ({player1.quirks.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {player1.quirks.map((quirk, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-pink-600/40 px-2 py-0.5 rounded text-white"
                        >
                          {quirk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Score */}
                {battleResult && (
                  <div className="bg-yellow-900/40 p-2 rounded-lg mt-2">
                    <div className="text-yellow-400 font-bold text-center text-lg">
                      SCORE: {battleResult.player1Score}/6
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setPlayer1(null)}
                  disabled={isSpinning}
                  className="w-full mt-2 py-1 bg-red-600/60 hover:bg-red-500/80 rounded-lg text-white text-xs disabled:opacity-50"
                >
                  Đổi
                </button>
              </div>
              )}
            </div>
          </div>

          {/* Center Wheel */}
          <div className="flex flex-col items-center gap-3">
            <div className="text-3xl font-black text-red-500">VS</div>

            {/* Current Round Indicator */}
            {isSpinning && currentRound < 6 && (
              <div className="bg-black/60 px-4 py-2 rounded-lg border-2 border-yellow-500">
                <div className="text-yellow-400 font-bold text-sm">
                  ROUND {currentRound + 1}/6
                </div>
                <div className="text-white text-xs text-center">
                  {statTypes[currentRound].label}
                </div>
              </div>
            )}

            {/* Wheel of Fortune */}
            <div className="relative">
              <canvas ref={canvasRef} width={360} height={360} className="rounded-full" />
              <div className="text-center mt-2">
                <div className="text-white text-sm font-bold">VÒNG QUAY TRỌNG SỐ</div>
                <div className="text-yellow-400 text-xs">Tỷ lệ dựa trên chỉ số</div>
              </div>
            </div>

            {/* Round Results */}
            {battleResult && battleResult.rounds.length > 0 && (
              <div className="bg-black/60 p-3 rounded-lg max-w-sm max-h-48 overflow-y-auto">
                <div className="text-white font-bold text-sm mb-2">ROUNDS HISTORY</div>
                {battleResult.rounds.map((round) => (
                  <div
                    key={round.round}
                    className={`text-xs mb-1 p-2 rounded ${
                      round.winner === "player1"
                        ? "bg-blue-900/40 text-blue-300"
                        : "bg-red-900/40 text-red-300"
                    }`}
                  >
                    <span className="font-bold">R{round.round} ({round.statType}):</span>{" "}
                    {round.player1Stat} vs {round.player2Stat} →{" "}
                    <span className="font-bold">
                      {round.winner === "player1" ? "P1" : "P2"} WIN
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Player 2 */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <h2 className="text-xl font-bold text-red-400">PLAYER 2</h2>

            <div className="w-full bg-red-900/40 p-3 rounded-xl border-2 border-red-500/40 max-h-[70vh] overflow-y-auto">
              {!player2 ? (
                <div className="w-full">
                  <button
                    onClick={() => setShowPlayer2Select(!showPlayer2Select)}
                    className="w-full p-3 bg-red-700/60 hover:bg-red-600/80 rounded-xl border-2 border-red-400/40 hover:border-red-300 transition-all text-white font-bold"
                  >
                    ➕ Chọn Player 2
                  </button>

                  {showPlayer2Select && (
                    <div className="mt-2 max-h-48 overflow-y-auto space-y-2 bg-black/40 p-2 rounded-xl">
                      {players.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setPlayer2(p);
                            setShowPlayer2Select(false);
                          }}
                          className="w-full p-2 bg-red-900/60 hover:bg-red-800/80 rounded-lg border border-red-500/40 hover:border-red-400 transition-all text-left"
                        >
                          <div className="text-white font-bold text-sm">{p.name}</div>
                          <div className="text-red-300 text-xs">{p.race}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                <div className="text-center mb-2">
                  <div className="text-xl font-black text-white">{player2.name}</div>
                  <div className="text-red-300 text-xs">{player2.race} - {player2.subrace}</div>
                  <div className="text-red-200 text-xs">{player2.house}</div>
                </div>

                {/* Stats */}
                <div className="bg-black/40 p-2 rounded-lg space-y-1 text-xs mb-2">
                  <div className="text-yellow-400 font-bold text-sm mb-1">STATS</div>
                  <div className="text-white">STR: {player2.stats.strength}</div>
                  <div className="text-white">SPD: {player2.stats.speed}</div>
                  <div className="text-white">DUR: {player2.stats.durability}</div>
                  <div className="text-white">IQ: {player2.stats.iq}</div>
                  <div className="text-white">BIQ: {player2.stats.battleIQ}</div>
                  <div className="text-white">MA: {player2.stats.martialArts}</div>
                  <div className="text-green-400 font-bold mt-1">
                    TOTAL: {player2.stats.totalBaseStat}
                  </div>
                </div>

                {/* Powers */}
                {player2.powers && player2.powers.length > 0 && (
                  <div className="bg-purple-900/30 p-2 rounded-lg mb-2">
                    <div className="text-purple-400 font-bold text-xs mb-1">
                      POWERS ({player2.powers.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {player2.powers.map((power, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-purple-600/40 px-2 py-0.5 rounded text-white"
                        >
                          {power}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weapons */}
                {player2.weapons && player2.weapons.length > 0 && (
                  <div className="bg-orange-900/30 p-2 rounded-lg mb-2">
                    <div className="text-orange-400 font-bold text-xs mb-1">
                      WEAPONS ({player2.weapons.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {player2.weapons.map((weapon, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-orange-600/40 px-2 py-0.5 rounded text-white"
                        >
                          {weapon}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gears */}
                {player2.gears && player2.gears.length > 0 && (
                  <div className="bg-green-900/30 p-2 rounded-lg mb-2">
                    <div className="text-green-400 font-bold text-xs mb-1">
                      GEARS ({player2.gears.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {player2.gears.map((gear, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-green-600/40 px-2 py-0.5 rounded text-white"
                        >
                          {gear}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quirks */}
                {player2.quirks && player2.quirks.length > 0 && (
                  <div className="bg-pink-900/30 p-2 rounded-lg mb-2">
                    <div className="text-pink-400 font-bold text-xs mb-1">
                      QUIRKS ({player2.quirks.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {player2.quirks.map((quirk, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-pink-600/40 px-2 py-0.5 rounded text-white"
                        >
                          {quirk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Score */}
                {battleResult && (
                  <div className="bg-yellow-900/40 p-2 rounded-lg mt-2">
                    <div className="text-yellow-400 font-bold text-center text-lg">
                      SCORE: {battleResult.player2Score}/6
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setPlayer2(null)}
                  disabled={isSpinning}
                  className="w-full mt-2 py-1 bg-red-600/60 hover:bg-red-500/80 rounded-lg text-white text-xs disabled:opacity-50"
                >
                  Đổi
                </button>
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Battle Controls */}
        <div className="flex gap-4">
          <button
            onClick={startBattle}
            disabled={!player1 || !player2 || isSpinning}
            className="px-10 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-xl text-white shadow-lg hover:scale-105 transition-all disabled:scale-100"
          >
            {isSpinning ? "🎰 ĐANG CHIẾN ĐẤU..." : "⚔️ BẮT ĐẦU 6 ROUNDS"}
          </button>

          {battleResult && (
            <button
              onClick={resetBattle}
              className="px-10 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-xl text-white shadow-lg hover:scale-105 transition-all"
            >
              🔄 CHIẾN ĐẤU MỚI
            </button>
          )}
        </div>

        {/* Battle Result */}
        {battleResult && (
          <div className="bg-black/70 p-6 rounded-3xl border-4 border-yellow-500/60 shadow-[0_0_50px_rgba(234,179,8,0.6)] max-w-3xl">
            <div className="text-center">
              <div
                className={`text-4xl font-black mb-3 ${
                  battleResult.winner === "player1"
                    ? "text-blue-400"
                    : battleResult.winner === "player2"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >
                {battleResult.winner === "player1"
                  ? `🏆 ${player1?.name} THẮNG!`
                  : battleResult.winner === "player2"
                  ? `🏆 ${player2?.name} THẮNG!`
                  : "⚖️ HÒA!"}
              </div>
              <div className="text-white text-xl font-bold">
                {battleResult.player1Score} - {battleResult.player2Score}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
