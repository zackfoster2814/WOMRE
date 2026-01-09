import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import menuBg from "../assets/Backgrounds/menu-bg.jpg";
import { CompleteCharacterInfo } from "@/types/characterTypes";

interface BattleResult {
  winner: "player" | "monster" | "draw";
  playerTotal: number;
  monsterTotal: number;
  details: string[];
}

export default function PvEBattle() {
  const navigate = useNavigate();
  const [player, setPlayer] = useState<CompleteCharacterInfo | null>(null);
  const [monster, setMonster] = useState<any>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [isBattling, setIsBattling] = useState(false);
  const [players, setPlayers] = useState<CompleteCharacterInfo[]>([]);

  // Load saved players from database
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const result = await window.electron.ipcRenderer.invoke("get-all-players");
        console.log("PvE - Get all players result:", result);
        if (result.success) {
          console.log("PvE - Players data:", result.data);
          setPlayers(result.data);
        } else {
          console.error("PvE - Failed to load players:", result.error);
        }
      } catch (error) {
        console.error("Error loading players:", error);
      }
    };
    loadPlayers();
  }, []);

  // Load random monster from PvE wheel
  const loadRandomMonster = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke("get-pve-monsters");
      if (result.success && result.data.length > 0) {
        const randomMonster = result.data[Math.floor(Math.random() * result.data.length)];
        setMonster(randomMonster);
      }
    } catch (error) {
      console.error("Error loading monster:", error);
    }
  };

  useEffect(() => {
    loadRandomMonster();
  }, []);

  const calculateCharacterTotal = (char: CompleteCharacterInfo): number => {
    const stats = char.stats;
    // Parse base stats
    let total = 0;
    total += parseInt(stats.strength) || 0;
    total += parseInt(stats.speed) || 0;
    total += parseInt(stats.durability) || 0;
    total += parseInt(stats.iq) || 0;
    total += parseInt(stats.battleIQ) || 0;
    total += parseInt(stats.martialArts) || 0;

    // Apply modifiers
    if (stats.modifiers && stats.modifiers.length > 0) {
      stats.modifiers.forEach((mod) => {
        if (mod.isPermanent) {
          total += mod.value;
        }
      });
    }

    return total;
  };

  const startBattle = async () => {
    if (!player || !monster) {
      alert("Vui lòng chọn nhân vật!");
      return;
    }

    setIsBattling(true);
    const details: string[] = [];

    // Calculate player total
    const playerTotal = calculateCharacterTotal(player);
    details.push(`${player.name}: ${playerTotal} điểm tổng`);

    // Calculate monster stats (random base stats)
    const monsterStats = {
      strength: Math.floor(Math.random() * 10) + 1,
      speed: Math.floor(Math.random() * 10) + 1,
      durability: Math.floor(Math.random() * 10) + 1,
      iq: Math.floor(Math.random() * 10) + 1,
      battleIQ: Math.floor(Math.random() * 10) + 1,
      martialArts: Math.floor(Math.random() * 10) + 1,
    };

    const monsterTotal =
      monsterStats.strength +
      monsterStats.speed +
      monsterStats.durability +
      monsterStats.iq +
      monsterStats.battleIQ +
      monsterStats.martialArts;

    details.push(`${monster.name}: ${monsterTotal} điểm tổng`);

    // Apply buffs from powers
    let playerBuffed = playerTotal;
    if (player.powers && player.powers.length > 0) {
      const buffValue = player.powers.length * 2; // Each power gives +2
      playerBuffed += buffValue;
      details.push(`✨ Buff từ ${player.powers.length} Power: +${buffValue}`);
    }

    // Determine winner
    let winner: "player" | "monster" | "draw";
    if (playerBuffed > monsterTotal) {
      winner = "player";
      details.push(`🏆 ${player.name} THẮNG!`);
    } else if (playerBuffed < monsterTotal) {
      winner = "monster";
      details.push(`💀 ${monster.name} THẮNG!`);
    } else {
      winner = "draw";
      details.push("⚖️ HÒA!");
    }

    setTimeout(async () => {
      setBattleResult({
        winner,
        playerTotal: playerBuffed,
        monsterTotal,
        details,
      });
      setIsBattling(false);

      // Save battle result to database
      try {
        const matchData = {
          player_id: player.id || 0,
          player_name: player.name,
          monster_id: monster.id || 0,
          monster_name: monster.name,
          player_total: playerBuffed,
          monster_total: monsterTotal,
          winner: winner,
          details: JSON.stringify({
            playerStats: playerTotal,
            monsterStats: monsterStats,
            buff: player.powers?.length ? player.powers.length * 2 : 0,
            details: details,
          }),
        };

        const result = await window.electron.ipcRenderer.invoke(
          "save-pve-match-result",
          matchData
        );

        if (result.success) {
          console.log("✅ PvE match result saved to database:", result.data);
        } else {
          console.error("❌ Failed to save PvE match result:", result.error);
        }
      } catch (error) {
        console.error("Error saving PvE match result:", error);
      }
    }, 2000);
  };

  const resetBattle = () => {
    setBattleResult(null);
    loadRandomMonster();
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
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-green-950/50 to-black/90" />

      {/* Back button */}
      <button
        onClick={() => navigate("/battle")}
        className="absolute top-8 left-8 px-6 py-3 rounded-xl font-bold text-white bg-purple-900/80 border-2 border-purple-500/40 hover:scale-105 transition-all z-20"
      >
        ← BACK
      </button>

      {/* Main Content */}
      <div className="z-10 w-full h-full flex flex-col items-center justify-center gap-8 p-8">
        {/* Title */}
        <h1 className="text-5xl font-black bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(52,211,153,0.8)]">
          PvE BATTLE - VÒNG LOẠI
        </h1>

        {/* Battle Arena */}
        <div className="flex items-center justify-center gap-16 w-full max-w-7xl">
          {/* Player Side */}
          <div className="flex-1 flex flex-col items-center gap-6">
            <h2 className="text-3xl font-bold text-blue-400">PLAYER</h2>

            {/* Player selection */}
            {!player ? (
              <div className="w-full max-h-96 overflow-y-auto space-y-3 bg-black/40 p-4 rounded-2xl border-2 border-blue-500/30">
                <p className="text-white text-sm mb-3">Chọn nhân vật:</p>
                {players.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-yellow-400 text-sm">Chưa có nhân vật nào!</p>
                    <p className="text-gray-400 text-xs mt-2">
                      Hãy tạo nhân vật mới từ Character Wheel
                    </p>
                  </div>
                ) : (
                  players.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        console.log("Selected player:", p);
                        setPlayer(p);
                      }}
                      className="w-full p-4 bg-blue-900/60 hover:bg-blue-800/80 rounded-xl border-2 border-blue-500/40 hover:border-blue-400 transition-all text-left"
                    >
                      <div className="text-white font-bold text-lg">{p.name}</div>
                      <div className="text-blue-300 text-sm">
                        {p.race} - {p.archetype}
                      </div>
                      <div className="text-blue-200 text-xs mt-1">
                        Total: {calculateCharacterTotal(p)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="w-96 bg-blue-900/60 p-6 rounded-2xl border-4 border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                <div className="text-center mb-4">
                  <div className="text-3xl font-black text-white mb-2">{player.name}</div>
                  <div className="text-blue-300 text-sm">
                    {player.race} - {player.archetype}
                  </div>
                </div>
                <div className="bg-black/40 p-4 rounded-xl space-y-2 text-sm">
                  <div className="text-white">STR: {player.stats.strength}</div>
                  <div className="text-white">SPD: {player.stats.speed}</div>
                  <div className="text-white">DUR: {player.stats.durability}</div>
                  <div className="text-white">IQ: {player.stats.iq}</div>
                  <div className="text-white">BIQ: {player.stats.battleIQ}</div>
                  <div className="text-white">MA: {player.stats.martialArts}</div>
                  <div className="text-green-400 font-bold mt-3">
                    TOTAL: {calculateCharacterTotal(player)}
                  </div>
                  {player.powers && player.powers.length > 0 && (
                    <div className="text-purple-400 text-xs mt-2">
                      Powers: {player.powers.length}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setPlayer(null)}
                  className="w-full mt-4 py-2 bg-red-600/60 hover:bg-red-500/80 rounded-lg text-white text-sm"
                >
                  Đổi nhân vật
                </button>
              </div>
            )}
          </div>

          {/* VS Divider */}
          <div className="text-6xl font-black text-red-500 animate-pulse">VS</div>

          {/* Monster Side */}
          <div className="flex-1 flex flex-col items-center gap-6">
            <h2 className="text-3xl font-bold text-red-400">MONSTER</h2>

            {monster ? (
              <div className="w-96 bg-red-900/60 p-6 rounded-2xl border-4 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                <div className="text-center mb-4">
                  <div className="text-3xl font-black text-white mb-2">{monster.name}</div>
                  <div className="text-red-300 text-xs px-4">{monster.description}</div>
                </div>
                <div className="bg-black/40 p-4 rounded-xl text-sm">
                  <div className="text-red-200 text-center">
                    Hệ thống sẽ tính toán chỉ số khi chiến đấu
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-96 h-64 bg-red-900/30 rounded-2xl border-4 border-red-500/20 flex items-center justify-center">
                <span className="text-red-300">Đang tải quái vật...</span>
              </div>
            )}
          </div>
        </div>

        {/* Battle Controls */}
        <div className="flex gap-6">
          <button
            onClick={startBattle}
            disabled={!player || !monster || isBattling}
            className="px-12 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-2xl font-bold text-2xl text-white shadow-lg hover:scale-105 transition-all disabled:scale-100"
          >
            {isBattling ? "⚔️ ĐANG CHIẾN ĐẤU..." : "⚔️ BẮT ĐẦU CHIẾN ĐẤU"}
          </button>

          {battleResult && (
            <button
              onClick={resetBattle}
              className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-2xl font-bold text-2xl text-white shadow-lg hover:scale-105 transition-all"
            >
              🔄 CHIẾN ĐẤU MỚI
            </button>
          )}
        </div>

        {/* Battle Result */}
        {battleResult && (
          <div className="bg-black/70 p-8 rounded-3xl border-4 border-yellow-500/60 shadow-[0_0_50px_rgba(234,179,8,0.6)] max-w-2xl">
            <div className="text-center mb-6">
              <div
                className={`text-5xl font-black mb-4 ${
                  battleResult.winner === "player"
                    ? "text-green-400"
                    : battleResult.winner === "monster"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >
                {battleResult.winner === "player"
                  ? "🏆 CHIẾN THẮNG!"
                  : battleResult.winner === "monster"
                  ? "💀 THẤT BẠI!"
                  : "⚖️ HÒA!"}
              </div>
            </div>
            <div className="space-y-3">
              {battleResult.details.map((detail, idx) => (
                <div key={idx} className="text-white text-lg text-center">
                  {detail}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
