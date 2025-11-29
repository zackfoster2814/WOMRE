import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import menuBg from "../assets/Backgrounds/menu-bg.jpg";

interface PlayerData {
  id: number;
  stt: number;
  name: string;
  note: string;
  race_id: number;
  sub_race_id: number;
  house_id: number;
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
}

export default function PlayerEditor() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [editedPlayer, setEditedPlayer] = useState<PlayerData | null>(null);

  // Dropdown data
  const [races, setRaces] = useState<any[]>([]);
  const [subraces, setSubraces] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [powers, setPowers] = useState<any[]>([]);
  const [weapons, setWeapons] = useState<any[]>([]);
  const [archetypes, setArchetypes] = useState<any[]>([]);
  const [quirks, setQuirks] = useState<any[]>([]);
  const [gears, setGears] = useState<any[]>([]);

  // Player relationships
  const [playerPowers, setPlayerPowers] = useState<number[]>([]);
  const [playerWeapons, setPlayerWeapons] = useState<number[]>([]);
  const [playerArchetypes, setPlayerArchetypes] = useState<number[]>([]);
  const [playerQuirks, setPlayerQuirks] = useState<number[]>([]);
  const [playerGears, setPlayerGears] = useState<number[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Load all data on mount
  useEffect(() => {
    loadPlayers();
    loadRaces();
    loadSubraces();
    loadHouses();
    loadPowers();
    loadWeapons();
    loadArchetypes();
    loadQuirks();
    loadGears();
  }, []);

  const loadPlayers = async () => {
    try {
      const result = await window.api.fetchAllPlayers();
      console.log("Loaded players:", result);
      setPlayers(result || []);
    } catch (error) {
      console.error("Error loading players:", error);
    }
  };

  const loadRaces = async () => {
    try {
      console.log("Loading races...");
      const result = await window.api.fetchAllRaces();
      console.log("Races loaded:", result);
      setRaces(result || []);
    } catch (error) {
      console.error("Error loading races:", error);
    }
  };

  const loadSubraces = async () => {
    try {
      console.log("Loading subraces...");
      const result = await window.api.fetchAllSubraces();
      console.log("Subraces loaded:", result);
      setSubraces(result || []);
    } catch (error) {
      console.error("Error loading subraces:", error);
    }
  };

  const loadHouses = async () => {
    try {
      console.log("Loading houses...");
      const result = await window.api.fetchAllHouses();
      console.log("Houses loaded:", result);
      setHouses(result || []);
    } catch (error) {
      console.error("Error loading houses:", error);
    }
  };

  const loadPowers = async () => {
    try {
      console.log("Loading powers...");
      const result = await window.api.fetchAllPowers();
      console.log("Powers loaded:", result);
      setPowers(result || []);
    } catch (error) {
      console.error("Error loading powers:", error);
    }
  };

  const loadWeapons = async () => {
    try {
      console.log("Loading weapons...");
      const result = await window.api.fetchAllWeapons();
      console.log("Weapons loaded:", result);
      setWeapons(result || []);
    } catch (error) {
      console.error("Error loading weapons:", error);
    }
  };

  const loadArchetypes = async () => {
    try {
      console.log("Loading archetypes...");
      const result = await window.api.fetchAllArchetypes();
      console.log("Archetypes loaded:", result);
      setArchetypes(result || []);
    } catch (error) {
      console.error("Error loading archetypes:", error);
    }
  };

  const loadQuirks = async () => {
    try {
      console.log("Loading quirks...");
      const result = await window.api.fetchAllQuirks();
      console.log("Quirks loaded:", result);
      setQuirks(result || []);
    } catch (error) {
      console.error("Error loading quirks:", error);
    }
  };

  const loadGears = async () => {
    try {
      console.log("Loading gears...");
      const result = await window.api.fetchAllGears();
      console.log("Gears loaded:", result);
      setGears(result || []);
    } catch (error) {
      console.error("Error loading gears:", error);
    }
  };

  const loadPlayerRelationships = async (playerId: number) => {
    try {
      // Load player's powers
      const playerPowersData = await window.api.fetchAllPlayerPowers();
      const playerPowerIds = playerPowersData
        .filter((pp: any) => pp.player_id === playerId)
        .map((pp: any) => pp.power_id);
      setPlayerPowers(playerPowerIds);

      // Load player's weapons
      const playerWeaponsData = await window.api.fetchAllPlayerWeapons();
      const playerWeaponIds = playerWeaponsData
        .filter((pw: any) => pw.player_id === playerId)
        .map((pw: any) => pw.weapon_id);
      setPlayerWeapons(playerWeaponIds);

      // Load player's archetypes
      const playerArchetypesData = await window.api.fetchAllPlayerArchetypes();
      const playerArchetypeIds = playerArchetypesData
        .filter((pa: any) => pa.player_id === playerId)
        .map((pa: any) => pa.archetype_id);
      setPlayerArchetypes(playerArchetypeIds);

      // Load player's quirks
      const playerQuirksData = await window.api.fetchAllPlayerQuirks();
      const playerQuirkIds = playerQuirksData
        .filter((pq: any) => pq.player_id === playerId)
        .map((pq: any) => pq.quirk_id);
      setPlayerQuirks(playerQuirkIds);

      // Load player's gears
      const playerGearsData = await window.api.fetchAllPlayerGears();
      const playerGearIds = playerGearsData
        .filter((pg: any) => pg.player_id === playerId)
        .map((pg: any) => pg.gear_id);
      setPlayerGears(playerGearIds);
    } catch (error) {
      console.error("Error loading player relationships:", error);
    }
  };

  const handleSelectPlayer = async (player: PlayerData) => {
    setSelectedPlayer(player);
    setEditedPlayer({ ...player });
    setIsCreatingNew(false);
    await loadPlayerRelationships(player.id);
  };

  const handleCreateNew = () => {
    const newPlayer: PlayerData = {
      id: 0,
      stt: players.length + 1,
      name: "",
      note: "",
      race_id: 0,
      sub_race_id: 0,
      house_id: 0,
      base_strength: 0,
      base_speed: 0,
      base_iq: 0,
      base_biq: 0,
      base_durability: 0,
      base_martial_arts: 0,
      current_strength: 0,
      current_speed: 0,
      current_iq: 0,
      current_biq: 0,
      current_durability: 0,
      current_martial_arts: 0,
    };
    setSelectedPlayer(null);
    setEditedPlayer(newPlayer);
    setIsCreatingNew(true);
    setPlayerPowers([]);
    setPlayerWeapons([]);
    setPlayerArchetypes([]);
    setPlayerQuirks([]);
    setPlayerGears([]);
  };

  const handleInputChange = (field: keyof PlayerData, value: any) => {
    if (!editedPlayer) return;
    setEditedPlayer({
      ...editedPlayer,
      [field]: value,
    });
  };

  const togglePower = (powerId: number) => {
    setPlayerPowers((prev) =>
      prev.includes(powerId)
        ? prev.filter((id) => id !== powerId)
        : [...prev, powerId]
    );
  };

  const toggleWeapon = (weaponId: number) => {
    setPlayerWeapons((prev) =>
      prev.includes(weaponId)
        ? prev.filter((id) => id !== weaponId)
        : [...prev, weaponId]
    );
  };

  const toggleArchetype = (archetypeId: number) => {
    setPlayerArchetypes((prev) =>
      prev.includes(archetypeId)
        ? prev.filter((id) => id !== archetypeId)
        : [...prev, archetypeId]
    );
  };

  const toggleQuirk = (quirkId: number) => {
    setPlayerQuirks((prev) =>
      prev.includes(quirkId)
        ? prev.filter((id) => id !== quirkId)
        : [...prev, quirkId]
    );
  };

  const toggleGear = (gearId: number) => {
    setPlayerGears((prev) =>
      prev.includes(gearId)
        ? prev.filter((id) => id !== gearId)
        : [...prev, gearId]
    );
  };

  const handleSave = async () => {
    if (!editedPlayer) return;

    if (!editedPlayer.name.trim()) {
      alert("Vui lòng nhập tên player!");
      return;
    }

    setIsSaving(true);
    try {
      let result;
      let playerId;

      if (isCreatingNew) {
        result = await window.electron.ipcRenderer.invoke(
          "create-player",
          editedPlayer
        );
        if (result.success) {
          playerId = result.playerId;
        }
      } else {
        result = await window.electron.ipcRenderer.invoke(
          "update-player",
          editedPlayer
        );
        playerId = editedPlayer.id;
      }

      if (result.success) {
        // Save relationships
        await window.electron.ipcRenderer.invoke("save-player-relationships", {
          playerId,
          powers: playerPowers,
          weapons: playerWeapons,
          archetypes: playerArchetypes,
          quirks: playerQuirks,
          gears: playerGears,
        });

        alert(
          isCreatingNew
            ? "Đã tạo player mới thành công!"
            : "Đã lưu thay đổi thành công!"
        );
        loadPlayers();
        setSelectedPlayer(null);
        setEditedPlayer(null);
        setIsCreatingNew(false);
      } else {
        alert("Lỗi khi lưu: " + result.error);
      }
    } catch (error) {
      console.error("Error saving player:", error);
      alert("Lỗi khi lưu player!");
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle =
    "w-full px-3 py-2 bg-gray-800/60 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none";
  const labelStyle = "text-sm font-semibold text-purple-300 mb-1 block";
  const sectionStyle = "bg-black/40 p-4 rounded-xl border border-purple-500/30";

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${menuBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-purple-950/50 to-black/90" />

      {/* Back button */}
      <button
        onClick={() => navigate("/data")}
        className="absolute top-8 left-8 px-6 py-3 rounded-xl font-bold text-white bg-purple-900/80 border-2 border-purple-500/40 hover:scale-105 transition-all z-20"
      >
        ← BACK
      </button>

      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center p-8 pt-24 overflow-y-auto">
        {/* Title */}
        <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-8">
          CHỈNH SỬA PLAYER
        </h1>

        <div className="w-full max-w-7xl flex gap-8">
          {/* Left Panel - Player List */}
          <div className="w-80 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-purple-400">
                Danh sách Players
              </h2>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-all text-sm"
              >
                ➕ Tạo mới
              </button>
            </div>
            <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto bg-black/40 p-4 rounded-xl border border-purple-500/30">
              {players.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Chưa có player nào
                </p>
              ) : (
                players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleSelectPlayer(player)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedPlayer?.id === player.id
                        ? "bg-purple-900/80 border-purple-400"
                        : "bg-gray-900/60 border-gray-600 hover:border-purple-500"
                    }`}
                  >
                    <div className="text-white font-bold text-lg">
                      {player.name}
                    </div>
                    <div className="text-gray-400 text-sm">ID: {player.id}</div>
                    <div className="text-gray-400 text-xs mt-1">
                      STR: {player.current_strength} | SPD:{" "}
                      {player.current_speed}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Editor */}
          {editedPlayer ? (
            <div className="flex-1 space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-4">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-900/60 to-pink-900/60 p-4 rounded-xl border-2 border-purple-400/60">
                <h2 className="text-2xl font-black text-white">
                  {isCreatingNew
                    ? "🆕 TẠO PLAYER MỚI"
                    : `✏️ CHỈNH SỬA: ${selectedPlayer?.name}`}
                </h2>
              </div>

              {/* Basic Info */}
              <div className={sectionStyle}>
                <h3 className="text-xl font-bold text-purple-400 mb-4">
                  Thông tin cơ bản
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Tên Player *</label>
                    <input
                      type="text"
                      value={editedPlayer.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className={inputStyle}
                      placeholder="Nhập tên player..."
                      required
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>STT</label>
                    <input
                      type="number"
                      value={editedPlayer.stt}
                      onChange={(e) =>
                        handleInputChange("stt", parseInt(e.target.value))
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelStyle}>Ghi chú</label>
                    <textarea
                      value={editedPlayer.note}
                      onChange={(e) =>
                        handleInputChange("note", e.target.value)
                      }
                      className={inputStyle}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Race, Subrace, House */}
              <div className={sectionStyle}>
                <h3 className="text-xl font-bold text-purple-400 mb-4">
                  Race & House
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelStyle}>
                      Race ({races.length} available)
                    </label>
                    <select
                      value={editedPlayer.race_id}
                      onChange={(e) =>
                        handleInputChange("race_id", parseInt(e.target.value))
                      }
                      className={inputStyle}
                    >
                      <option value={0}>Chọn Race</option>
                      {races.map((race) => (
                        <option key={race.id} value={race.id}>
                          {race.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>
                      Subrace ({subraces.length} available)
                    </label>
                    <select
                      value={editedPlayer.sub_race_id}
                      onChange={(e) =>
                        handleInputChange(
                          "sub_race_id",
                          parseInt(e.target.value)
                        )
                      }
                      className={inputStyle}
                    >
                      <option value={0}>Chọn Subrace</option>
                      {subraces.map((subrace) => (
                        <option key={subrace.id} value={subrace.id}>
                          {subrace.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>
                      House ({houses.length} available)
                    </label>
                    <select
                      value={editedPlayer.house_id}
                      onChange={(e) =>
                        handleInputChange("house_id", parseInt(e.target.value))
                      }
                      className={inputStyle}
                    >
                      <option value={0}>Chọn House</option>
                      {houses.map((house) => (
                        <option key={house.id} value={house.id}>
                          {house.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Base Stats */}
              <div className={sectionStyle}>
                <h3 className="text-xl font-bold text-purple-400 mb-4">
                  Base Stats
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelStyle}>Strength</label>
                    <input
                      type="number"
                      value={editedPlayer.base_strength}
                      onChange={(e) =>
                        handleInputChange(
                          "base_strength",
                          parseInt(e.target.value)
                        )
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Speed</label>
                    <input
                      type="number"
                      value={editedPlayer.base_speed}
                      onChange={(e) =>
                        handleInputChange("base_speed", parseInt(e.target.value))
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Durability</label>
                    <input
                      type="number"
                      value={editedPlayer.base_durability}
                      onChange={(e) =>
                        handleInputChange(
                          "base_durability",
                          parseInt(e.target.value)
                        )
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>IQ</label>
                    <input
                      type="number"
                      value={editedPlayer.base_iq}
                      onChange={(e) =>
                        handleInputChange("base_iq", parseInt(e.target.value))
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Battle IQ</label>
                    <input
                      type="number"
                      value={editedPlayer.base_biq}
                      onChange={(e) =>
                        handleInputChange("base_biq", parseInt(e.target.value))
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Martial Arts</label>
                    <input
                      type="number"
                      value={editedPlayer.base_martial_arts}
                      onChange={(e) =>
                        handleInputChange(
                          "base_martial_arts",
                          parseInt(e.target.value)
                        )
                      }
                      className={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Current Stats */}
              <div className={sectionStyle}>
                <h3 className="text-xl font-bold text-purple-400 mb-4">
                  Current Stats
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelStyle}>Strength</label>
                    <input
                      type="number"
                      value={editedPlayer.current_strength}
                      onChange={(e) =>
                        handleInputChange(
                          "current_strength",
                          parseInt(e.target.value)
                        )
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Speed</label>
                    <input
                      type="number"
                      value={editedPlayer.current_speed}
                      onChange={(e) =>
                        handleInputChange(
                          "current_speed",
                          parseInt(e.target.value)
                        )
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Durability</label>
                    <input
                      type="number"
                      value={editedPlayer.current_durability}
                      onChange={(e) =>
                        handleInputChange(
                          "current_durability",
                          parseInt(e.target.value)
                        )
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>IQ</label>
                    <input
                      type="number"
                      value={editedPlayer.current_iq}
                      onChange={(e) =>
                        handleInputChange(
                          "current_iq",
                          parseInt(e.target.value)
                        )
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Battle IQ</label>
                    <input
                      type="number"
                      value={editedPlayer.current_biq}
                      onChange={(e) =>
                        handleInputChange(
                          "current_biq",
                          parseInt(e.target.value)
                        )
                      }
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Martial Arts</label>
                    <input
                      type="number"
                      value={editedPlayer.current_martial_arts}
                      onChange={(e) =>
                        handleInputChange(
                          "current_martial_arts",
                          parseInt(e.target.value)
                        )
                      }
                      className={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Powers */}
              <div className={sectionStyle}>
                <h3 className="text-xl font-bold text-purple-400 mb-4">
                  Powers ({playerPowers.length} selected)
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {powers.map((power) => (
                    <button
                      key={power.id}
                      onClick={() => togglePower(power.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        playerPowers.includes(power.id)
                          ? "bg-purple-600/60 border-purple-400"
                          : "bg-gray-800/40 border-gray-600 hover:border-purple-500"
                      }`}
                    >
                      <div className="text-white font-semibold">
                        {power.name}
                      </div>
                      {power.description && (
                        <div className="text-gray-400 text-xs mt-1 truncate">
                          {power.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weapons */}
              <div className={sectionStyle}>
                <h3 className="text-xl font-bold text-purple-400 mb-4">
                  Weapons ({playerWeapons.length} selected)
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {weapons.map((weapon) => (
                    <button
                      key={weapon.id}
                      onClick={() => toggleWeapon(weapon.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        playerWeapons.includes(weapon.id)
                          ? "bg-orange-600/60 border-orange-400"
                          : "bg-gray-800/40 border-gray-600 hover:border-orange-500"
                      }`}
                    >
                      <div className="text-white font-semibold">
                        {weapon.name}
                      </div>
                      {weapon.description && (
                        <div className="text-gray-400 text-xs mt-1 truncate">
                          {weapon.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Archetypes */}
              <div className={sectionStyle}>
                <h3 className="text-xl font-bold text-purple-400 mb-4">
                  Archetypes ({playerArchetypes.length} selected)
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {archetypes.map((archetype) => (
                    <button
                      key={archetype.id}
                      onClick={() => toggleArchetype(archetype.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        playerArchetypes.includes(archetype.id)
                          ? "bg-blue-600/60 border-blue-400"
                          : "bg-gray-800/40 border-gray-600 hover:border-blue-500"
                      }`}
                    >
                      <div className="text-white font-semibold">
                        {archetype.name}
                      </div>
                      {archetype.description && (
                        <div className="text-gray-400 text-xs mt-1 truncate">
                          {archetype.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quirks */}
              <div className={sectionStyle}>
                <h3 className="text-xl font-bold text-purple-400 mb-4">
                  Quirks ({playerQuirks.length} selected)
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {quirks.map((quirk) => (
                    <button
                      key={quirk.id}
                      onClick={() => toggleQuirk(quirk.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        playerQuirks.includes(quirk.id)
                          ? "bg-pink-600/60 border-pink-400"
                          : "bg-gray-800/40 border-gray-600 hover:border-pink-500"
                      }`}
                    >
                      <div className="text-white font-semibold">
                        {quirk.name}
                      </div>
                      {quirk.description && (
                        <div className="text-gray-400 text-xs mt-1 truncate">
                          {quirk.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gears */}
              <div className={sectionStyle}>
                <h3 className="text-xl font-bold text-purple-400 mb-4">
                  Gears ({playerGears.length} selected)
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {gears.map((gear) => (
                    <button
                      key={gear.id}
                      onClick={() => toggleGear(gear.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        playerGears.includes(gear.id)
                          ? "bg-green-600/60 border-green-400"
                          : "bg-gray-800/40 border-gray-600 hover:border-green-500"
                      }`}
                    >
                      <div className="text-white font-semibold">
                        {gear.name}
                      </div>
                      {gear.description && (
                        <div className="text-gray-400 text-xs mt-1 truncate">
                          {gear.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-bold text-xl text-white shadow-lg hover:scale-105 transition-all disabled:scale-100 disabled:cursor-not-allowed"
                >
                  {isSaving
                    ? "Đang lưu..."
                    : isCreatingNew
                    ? "➕ TẠO PLAYER MỚI"
                    : "💾 LƯU THAY ĐỔI"}
                </button>
                <button
                  onClick={() => {
                    setSelectedPlayer(null);
                    setEditedPlayer(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded-xl font-bold text-xl text-white shadow-lg hover:scale-105 transition-all"
                >
                  ❌ HỦY
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 text-2xl mb-4">
                  👈 Chọn player để chỉnh sửa
                </p>
                <p className="text-gray-500 text-sm">
                  Hoặc nhấn "Tạo mới" để tạo player mới
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
