import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Player, PlayerStats } from "../types";
import wheelBgImage from "../assets/img/wheel-bg.png";

export const PlayerListPage = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const handleAddPlayer = (player: Player) => {
    setPlayers([...players, player]);
    setShowAddModal(false);
  };

  const handleUpdatePlayer = (updatedPlayer: Player) => {
    setPlayers(
      players.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
    );
    setEditingPlayer(null);
  };

  const handleDeletePlayer = (id: string) => {
    if (confirm("Are you sure you want to delete this player?")) {
      setPlayers(players.filter((p) => p.id !== id));
    }
  };

  return (
    <div
      className="min-h-screen py-4 px-4"
      style={{
        backgroundImage: `url(${wheelBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2"
            >
              <span>←</span> Back to Home
            </button>
            <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-teal-400 to-cyan-400">
              Player List
            </h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-medium transition-colors flex items-center gap-2"
            >
              <span>+</span> Add Player
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onEdit={() => setEditingPlayer(player)}
              onDelete={() => handleDeletePlayer(player.id)}
            />
          ))}
        </div>

        {players.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl mb-4">No players yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded text-white font-medium transition-colors"
            >
              Add Your First Player
            </button>
          </div>
        )}

        {showAddModal && (
          <PlayerModal
            onClose={() => setShowAddModal(false)}
            onSave={handleAddPlayer}
          />
        )}

        {editingPlayer && (
          <PlayerModal
            player={editingPlayer}
            onClose={() => setEditingPlayer(null)}
            onSave={handleUpdatePlayer}
          />
        )}
      </div>
    </div>
  );
};

interface PlayerCardProps {
  player: Player;
  onEdit: () => void;
  onDelete: () => void;
}

const PlayerCard = ({ player, onEdit, onDelete }: PlayerCardProps) => {
  const statLabels: { key: keyof PlayerStats; label: string; color: string }[] = [
    { key: "Str", label: "Strength", color: "text-red-400" },
    { key: "Spd", label: "Speed", color: "text-yellow-400" },
    { key: "Dur", label: "Durability", color: "text-blue-400" },
    { key: "IQ", label: "Intelligence", color: "text-purple-400" },
    { key: "BIQ", label: "Battle IQ", color: "text-pink-400" },
    { key: "MA", label: "Martial Arts", color: "text-orange-400" },
  ];

  const totalStats = Object.values(player.stats).reduce((a, b) => a + b, 0);
  const avgStat = (totalStats / 6).toFixed(1);

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{player.name}</h3>
          <p className="text-sm text-gray-400">
            Total: {totalStats} • Avg: {avgStat}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm transition-colors"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {statLabels.map(({ key, label, color }) => (
          <div key={key} className="flex items-center justify-between">
            <span className={`text-sm font-medium ${color}`}>{label}</span>
            <span className="text-white font-bold">{player.stats[key]}</span>
          </div>
        ))}
      </div>

      {player.notes && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400">{player.notes}</p>
        </div>
      )}
    </div>
  );
};

interface PlayerModalProps {
  player?: Player;
  onClose: () => void;
  onSave: (player: Player) => void;
}

const PlayerModal = ({ player, onClose, onSave }: PlayerModalProps) => {
  const [name, setName] = useState(player?.name || "");
  const [stats, setStats] = useState<PlayerStats>(
    player?.stats || {
      Str: 1,
      Spd: 1,
      Dur: 1,
      IQ: 1,
      BIQ: 1,
      MA: 1,
    }
  );
  const [notes, setNotes] = useState(player?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a player name");
      return;
    }

    const newPlayer: Player = {
      id: player?.id || crypto.randomUUID(),
      name: name.trim(),
      stats,
      notes: notes.trim() || undefined,
    };

    onSave(newPlayer);
  };

  const updateStat = (key: keyof PlayerStats, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setStats({ ...stats, [key]: numValue });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-4">
          {player ? "Edit Player" : "Add New Player"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Player Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter player name"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Stats
            </label>
            {(Object.keys(stats) as Array<keyof PlayerStats>).map((key) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-12 text-sm font-medium text-gray-300">
                  {key}:
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={stats[key]}
                  onChange={(e) => updateStat(key, e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-medium transition-colors"
            >
              {player ? "Update" : "Add"} Player
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
