import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface PlayerData {
  id: number;
  name: string;
  note: string;
  race_name: string;
  subrace_name: string;
  house_name: string;
  base_strength: number;
  base_speed: number;
  base_iq: number;
  base_biq: number;
  base_durability: number;
  base_martial_arts: number;
  current_strength: number;
  current_speed: number;
  current_iq: number;
  current_biq: number;
  current_durability: number;
  current_martial_arts: number;
  pvp_reward: string;
  tailored_reward: string;
  tournament_status: number;
}

export default function PlayerInfo() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayerData();
  }, [id]);

  const fetchPlayerData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Fetch player data
      const players = window.api ? await window.api.fetchAllPlayers() : [];
      const playerData = players.find((p: any) => {
        const data = p._dataValues || p.dataValues || p;
        return data.id === parseInt(id);
      });

      if (!playerData) {
        alert("Player not found!");
        navigate("/data");
        return;
      }

      const cleanPlayer = playerData._dataValues || playerData.dataValues || playerData;

      // Fetch race, subrace, and house names
      const [races, subraces, houses] = await Promise.all([
        window.api ? window.api.fetchAllRaces() : [],
        window.api ? window.api.fetchAllSubraces() : [],
        window.api ? window.api.fetchAllHouses() : [],
      ]);

      const race = races.find((r: any) => {
        const raceData = r._dataValues || r.dataValues || r;
        return raceData.id === cleanPlayer.race_id;
      });

      const subrace = subraces.find((s: any) => {
        const subraceData = s._dataValues || s.dataValues || s;
        return subraceData.id === cleanPlayer.sub_race_id;
      });

      const house = houses.find((h: any) => {
        const houseData = h._dataValues || h.dataValues || h;
        return houseData.id === cleanPlayer.house_id;
      });

      // Create clean player object with only necessary fields
      setPlayer({
        id: cleanPlayer.id,
        name: cleanPlayer.name,
        note: cleanPlayer.note,
        race_name: race ? (race._dataValues || race.dataValues || race).name : "Unknown",
        subrace_name: subrace ? (subrace._dataValues || subrace.dataValues || subrace).name : "Unknown",
        house_name: house ? (house._dataValues || house.dataValues || house).name : "Unknown",
        base_strength: cleanPlayer.base_strength,
        base_speed: cleanPlayer.base_speed,
        base_iq: cleanPlayer.base_iq,
        base_biq: cleanPlayer.base_biq,
        base_durability: cleanPlayer.base_durability,
        base_martial_arts: cleanPlayer.base_martial_arts,
        current_strength: cleanPlayer.current_strength,
        current_speed: cleanPlayer.current_speed,
        current_iq: cleanPlayer.current_iq,
        current_biq: cleanPlayer.current_biq,
        current_durability: cleanPlayer.current_durability,
        current_martial_arts: cleanPlayer.current_martial_arts,
        pvp_reward: cleanPlayer.pvp_reward,
        tailored_reward: cleanPlayer.tailored_reward,
        tournament_status: cleanPlayer.tournament_status,
      });
    } catch (error) {
      console.error("Error fetching player data:", error);
      alert(`Error fetching player: ${error}`);
      navigate("/data");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ label, baseValue, currentValue }: { label: string; baseValue: number; currentValue: number }) => {
    const diff = currentValue - baseValue;
    return (
      <div className="bg-[#2b1d42] rounded-lg p-4 border border-[#8a5b1a]">
        <h3 className="text-[#d4af37] font-bold text-lg mb-2">{label}</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-400 text-sm">Base</div>
            <div className="text-white text-2xl font-bold">{baseValue}</div>
          </div>
          <div className="text-[#d4af37] text-3xl">→</div>
          <div>
            <div className="text-gray-400 text-sm">Current</div>
            <div className="text-white text-2xl font-bold">{currentValue}</div>
          </div>
          {diff !== 0 && (
            <div className={`text-sm font-semibold ${diff > 0 ? "text-green-400" : "text-red-400"}`}>
              {diff > 0 ? "+" : ""}{diff}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-[#1a1029] to-[#2b1d42] flex items-center justify-center">
        <div className="text-2xl text-[#d4af37] font-semibold animate-pulse">
          Loading Player Data...
        </div>
      </div>
    );
  }

  if (!player) {
    return null;
  }

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-[#1a1029] to-[#2b1d42] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#8a5b1a]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/data")}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors border border-[#8a5b1a]"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-[#d4af37] drop-shadow-[0_0_15px_rgba(255,200,100,0.8)]">
            {player.name}
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Basic Info Card */}
          <div className="bg-[#2b1d42] rounded-lg p-4 border border-[#8a5b1a]">
            <div className="flex items-center gap-8 flex-wrap">
              <div>
                <span className="text-gray-400 text-sm">Race:</span>
                <span className="text-white ml-2 font-semibold">{player.race_name}</span>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Subrace:</span>
                <span className="text-white ml-2 font-semibold">{player.subrace_name}</span>
              </div>
              <div>
                <span className="text-gray-400 text-sm">House:</span>
                <span className="text-white ml-2 font-semibold">{player.house_name}</span>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Tournament Status:</span>
                <span className="text-white ml-2 font-semibold">{player.tournament_status}</span>
              </div>
            </div>
            {player.note && (
              <div className="mt-3 pt-3 border-t border-[#8a5b1a]/30">
                <span className="text-gray-400 text-sm">Note:</span>
                <p className="text-white text-sm mt-1">{player.note}</p>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Strength" baseValue={player.base_strength} currentValue={player.current_strength} />
            <StatCard label="Speed" baseValue={player.base_speed} currentValue={player.current_speed} />
            <StatCard label="IQ" baseValue={player.base_iq} currentValue={player.current_iq} />
            <StatCard label="BIQ" baseValue={player.base_biq} currentValue={player.current_biq} />
            <StatCard label="Durability" baseValue={player.base_durability} currentValue={player.current_durability} />
            <StatCard label="Martial Arts" baseValue={player.base_martial_arts} currentValue={player.current_martial_arts} />
          </div>

          {/* Rewards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#2b1d42] rounded-lg p-6 border border-[#8a5b1a]">
              <h2 className="text-xl font-bold text-[#d4af37] mb-4">PVP Reward</h2>
              <p className="text-white whitespace-pre-wrap">{player.pvp_reward || "No reward"}</p>
            </div>
            <div className="bg-[#2b1d42] rounded-lg p-6 border border-[#8a5b1a]">
              <h2 className="text-xl font-bold text-[#d4af37] mb-4">Tailored Reward</h2>
              <p className="text-white whitespace-pre-wrap">{player.tailored_reward || "No reward"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
