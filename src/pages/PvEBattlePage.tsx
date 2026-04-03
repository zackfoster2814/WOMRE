import { useState, useEffect, useMemo, useCallback } from "react";
import { CharacterStats } from "../types/character";
import { CharacterParser } from "../utils/characterParser";
import { EffectResolver } from "../effects/resolver";
import { initializeEffectData } from "../effects/data";
import wheelBgImage from "../assets/img/wheel-bg.png";
import { BossBattleRoom } from "../components/BossBattleRoom";
import { getAssetPath } from "../utils/basePath";
import {
  Boss,
  PlayerData,
  TeamJson,
  BattleResult,
  BattleView,
  BossStats,
  BattleModeProps,
} from "../types/battleZone";
import { fetchAllPlayerTexts } from "../utils/googleDrive";

let _pveEffectsInitialized = false;
function ensureEffectsInitialized() {
  if (!_pveEffectsInitialized) {
    initializeEffectData();
    _pveEffectsInitialized = true;
  }
}

// PvE Battle Page Component
const STAT_KEYS = ["str", "spd", "dur", "iq", "biq", "ma"] as const;
const STAT_LABELS: Record<string, string> = {
  str: "STR",
  spd: "SPD",
  dur: "DUR",
  iq: "IQ",
  biq: "BIQ",
  ma: "MA",
};

export const PvEBattlePage = ({ onBack, isWebView }: BattleModeProps) => {
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [teams, setTeams] = useState<TeamJson[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerData[]>([]);
  const [battleResults, setBattleResults] = useState<Map<number, BattleResult>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "with-boss" | "no-boss">(
    "with-boss",
  );
  const [battleView, setBattleView] = useState<BattleView | null>(null);
  const [battleSessionId, setBattleSessionId] = useState(0);
  const [devMode, setDevMode] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<BattleResult>({
    outcome: "win",
    rounds: { str: null, spd: null, dur: null, iq: null, biq: null, ma: null },
    tiebreak: null,
    notes: "",
  });

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load bosses
        const bossRes = await fetch(getAssetPath("/data/battles/bosses.json"));
        const bossData = await bossRes.json();
        setBosses(bossData.bosses || []);

        // Load teams
        const teamRes = await fetch(getAssetPath("/data/battles/teams.json"));
        const teamData = await teamRes.json();
        setTeams(teamData.teams || []);

        // Load battle results
        const battleRes = await fetch(
          getAssetPath("/data/battles/team-battles.json"),
        );
        const battleData = await battleRes.json();
        const resultsMap = new Map<number, BattleResult>();
        (battleData.battles || []).forEach(
          (b: { teamId: number; result: BattleResult | null }) => {
            if (b.result) resultsMap.set(b.teamId, b.result);
          },
        );
        setBattleResults(resultsMap);

        // Load all players from individual files (like TeamBattlePage)
        // Initialize effects for PvE stat calculation
        ensureEffectsInitialized();

        const playerList: PlayerData[] = [];
        const texts = await fetchAllPlayerTexts();
        // Parse tất cả characters trước để cross-character effects (In Love, v.v.) hoạt động đúng
        type ParsedEntry = { no: number; char: ReturnType<typeof CharacterParser.parseCharacterFile> };
        const parsedChars: ParsedEntry[] = [];
        for (const [i, content] of texts) {
          try {
            const char = CharacterParser.parseCharacterFile(content);
            parsedChars.push({ no: char.no || i, char });
          } catch {
            /* bỏ qua */
          }
        }
        const allChars = parsedChars.map((p) => p.char);

        for (const { no, char } of parsedChars) {
          try {
            const effects = EffectResolver.calculateCharacterEffects(
              char,
              { isPvE: true },
              allChars,
            );
            const pveStats: CharacterStats = {
              str: effects.totalStats.strength,
              spd: effects.totalStats.speed,
              dur: effects.totalStats.durability,
              iq: effects.totalStats.iq,
              biq: effects.totalStats.biq,
              ma: effects.totalStats.ma,
            };
            playerList.push({
              no,
              name: char.name || `Player ${no}`,
              username: char.username || "",
              stats: pveStats,
              baseStats: {
                str: effects.baseStats.strength,
                spd: effects.baseStats.speed,
                dur: effects.baseStats.durability,
                iq: effects.baseStats.iq,
                biq: effects.baseStats.biq,
                ma: effects.baseStats.ma,
              },
              statModifiers: effects.statModifiers.map((m) => ({
                stat: m.stat,
                value: m.value,
                isBase: m.isBase,
                source: m.source,
              })),
              team: char.team,
              quirks: char.quirks.map((q) => q.name),
              race: char.race?.race,
              subRace: char.race?.subRace,
              archetypes: char.archetypes,
              powers:
                char.powers?.filter((p) => !p.isLost).map((p) => p.name) || [],
              weapons:
                char.weapons
                  ?.filter((w) => !w.isLost && w.usable !== false)
                  .map((w) => w.name) || [],
              gear: [
                ...(char.gear?.normalGear || [])
                  .filter((g) => !g.isLost)
                  .map((g) => g.name),
                ...(char.gear?.legacyGear || [])
                  .filter((g) => !g.isLost)
                  .map((g) => g.name),
              ],
              effectBreakdown: EffectResolver.getCharacterEffectBreakdown(
                char,
                undefined,
                allChars,
              ),
            });
          } catch {
            /* bá» qua */
          }
        }
        setAllPlayers(playerList);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Create boss lookup map (case-insensitive)
  const bossMap = useMemo(() => {
    const map = new Map<string, Boss>();
    bosses.forEach((boss) => map.set(boss.name.toLowerCase(), boss));
    return map;
  }, [bosses]);

  // Create player lookup by username
  const playerByUsername = useMemo(() => {
    const map = new Map<string, PlayerData>();
    allPlayers.forEach((p) => {
      if (p.username) map.set(p.username.toLowerCase(), p);
    });
    return map;
  }, [allPlayers]);

  // Build battle views (teams with their assigned bosses)
  const battles = useMemo(() => {
    return teams.map((team): BattleView => {
      const boss = team.boss
        ? bossMap.get(team.boss.toLowerCase()) || null
        : null;

      // Match members with player data
      const playerData: PlayerData[] = [];
      team.members.forEach((member) => {
        if (member.username === "__dummy__") {
          playerData.push({
            no: 9999,
            name: "Dummy",
            username: "__dummy__",
            stats: { str: 3, spd: 3, dur: 3, iq: 3, biq: 3, ma: 3 },
            baseStats: { str: 3, spd: 3, dur: 3, iq: 3, biq: 3, ma: 3 },
          });
          return;
        }
        const player = playerByUsername.get(member.username.toLowerCase());
        if (player) {
          playerData.push(player);
        }
      });

      return {
        teamId: team.id,
        boss,
        members: team.members,
        playerData,
        result: battleResults.get(team.id) || null,
      };
    });
  }, [teams, bossMap, playerByUsername, battleResults]);

  // Filter battles
  const filteredBattles = useMemo(() => {
    switch (filterType) {
      case "with-boss":
        return battles.filter((b) => b.boss !== null);
      case "no-boss":
        return battles.filter((b) => b.boss === null);
      default:
        return battles;
    }
  }, [battles, filterType]);

  // Summary
  const summary = useMemo(() => {
    const withBoss = battles.filter((b) => b.boss !== null).length;
    const noBoss = battles.filter((b) => b.boss === null).length;
    return { total: battles.length, withBoss, noBoss };
  }, [battles]);

  // Dev mode toggle (z â†’ v â†’ m sequence)
  useEffect(() => {
    const SEQ = ["z", "v", "m"];
    let buf: string[] = [];
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        setDevMode((prev) => !prev);
        return;
      }
      buf.push(e.key.toLowerCase());
      if (buf.length > SEQ.length) buf = buf.slice(-SEQ.length);
      if (buf.join("") === SEQ.join("")) {
        buf = [];
        setDevMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Open edit form for a team
  const openEditForm = useCallback(
    (teamId: number) => {
      const existing = battleResults.get(teamId);
      if (existing) {
        setEditForm({ ...existing, rounds: { ...existing.rounds } });
      } else {
        setEditForm({
          outcome: "win",
          rounds: {
            str: null,
            spd: null,
            dur: null,
            iq: null,
            biq: null,
            ma: null,
          },
          tiebreak: null,
          notes: "",
        });
      }
      setEditingTeamId(teamId);
    },
    [battleResults],
  );

  // Save battle result
  const saveResult = useCallback(async () => {
    if (editingTeamId === null) return;
    const newResults = new Map(battleResults);
    newResults.set(editingTeamId, { ...editForm });
    setBattleResults(newResults);
    setEditingTeamId(null);

    // Save to team-battles.json via Tauri FS
    try {
      const res = await fetch(getAssetPath("/data/battles/team-battles.json"));
      const data = await res.json();
      const battles = data.battles || [];
      const idx = battles.findIndex(
        (b: { teamId: number }) => b.teamId === editingTeamId,
      );
      if (idx >= 0) {
        battles[idx].result = { ...editForm };
      }
      data.battles = battles;

      const { isTauri } = await import("../utils/tauriStorage");
      if (isTauri()) {
        const { writeTextFile } = await import("@tauri-apps/plugin-fs");
        const { resolveResource } = await import("@tauri-apps/api/path");
        const path = await resolveResource("data/battles/team-battles.json");
        await writeTextFile(path, JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error("Failed to save result:", err);
    }
  }, [editingTeamId, editForm, battleResults]);

  // Count races in entire season (for Sigrun boss effect)
  const seasonRaceCounts = useMemo(() => {
    let angel = 0;
    let god = 0;
    allPlayers.forEach((p) => {
      const race = p.race?.toLowerCase() || "";
      if (race === "angel") angel++;
      if (race === "god") god++;
    });
    return { angel, god, total: angel + god };
  }, [allPlayers]);

  // Calculate total stats
  const getTotalStats = (stats: BossStats | CharacterStats) => {
    return (
      (stats.str || 0) +
      (stats.spd || 0) +
      (stats.dur || 0) +
      (stats.iq || 0) +
      (stats.biq || 0) +
      (stats.ma || 0)
    );
  };

  // Start battle - increment session ID to force fresh component state
  const startBattle = (battle: BattleView) => {
    if (!battle.boss) return;
    setBattleSessionId((prev) => prev + 1);
    setBattleView(battle);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${wheelBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className={`${!isWebView ? "" : "hidden"} px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium transition-colors flex items-center gap-2`}
          >
            <span>â†</span> Back
          </button>

          <div className={`${!isWebView ? "" : "hidden"} flex gap-2`}>
            {devMode && (
              <span className="px-3 py-1 bg-yellow-600/80 rounded-full text-yellow-200 text-sm font-medium animate-pulse">
                DEV MODE
              </span>
            )}
            <span className="px-3 py-1 bg-purple-600/80 rounded-full text-white text-sm font-medium">
              Total: {summary.total}
            </span>
            <span className="px-3 py-1 bg-red-600/80 rounded-full text-white text-sm font-medium">
              Has Boss: {summary.withBoss}
            </span>
          </div>

          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className={`${!isWebView ? "" : "hidden"} px-4 py-2 bg-gray-800/80 border border-gray-600 rounded-none text-white focus:outline-none focus:ring-2 focus:ring-cyan-500`}
          >
            <option value="all">All Teams ({summary.total})</option>
            <option value="with-boss">Has Boss ({summary.withBoss})</option>
            <option value="no-boss">No Boss ({summary.noBoss})</option>
          </select>
        </div>

        <div className={`${!isWebView ? "" : "hidden"} text-center mb-8`}>
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 mb-4">
            Lair Battle
          </h1>
          <p className="text-gray-300 text-lg">
            Select a team to challenge their assigned boss
          </p>
        </div>

        {/* Battle Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBattles.map((battle) => {
            const hasBoss = battle.boss !== null;
            const bossTotalStats = battle.boss
              ? getTotalStats(battle.boss.stats)
              : 0;
            const teamTotalStats = battle.playerData.reduce(
              (sum, p) => sum + getTotalStats(p.stats),
              0,
            );
            const result = battle.result;

            return (
              <div
                key={battle.teamId}
                className={`bg-gray-800/90 backdrop-blur-sm border-2 rounded-none overflow-hidden transition-all hover:scale-[1.02] ${
                  result
                    ? result.outcome === "win"
                      ? "border-green-500/50"
                      : "border-red-500/50"
                    : hasBoss
                      ? "border-red-500/50"
                      : "border-gray-600"
                }`}
              >
                {/* Card Header */}
                <div
                  className={`px-4 py-3 ${
                    result
                      ? result.outcome === "win"
                        ? "bg-green-600/20"
                        : "bg-red-600/20"
                      : hasBoss
                        ? "bg-red-600/20"
                        : "bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-orange-400">
                        #{battle.teamId}
                      </span>
                      <span className="text-white font-medium">
                        Team {battle.teamId}
                      </span>
                      {result && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            result.outcome === "win"
                              ? "bg-green-500/30 text-green-300 border border-green-500/50"
                              : "bg-red-500/30 text-red-300 border border-red-500/50"
                          }`}
                        >
                          {result.outcome === "win" ? "WIN" : "LOSE"}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400 text-sm">
                      {battle.members.length} members
                    </span>
                  </div>
                  {hasBoss && (
                    <p className="text-sm text-gray-400 mt-1">
                      vs{" "}
                      <span className="text-red-400 font-medium">
                        {battle.boss!.name}
                      </span>
                    </p>
                  )}
                </div>

                {/* Card Content */}
                <div className="px-4 py-3">
                  {hasBoss && battle.boss ? (
                    <>
                      {/* Stats Comparison + Round Results */}
                      <div className="grid grid-cols-6 gap-1 text-center text-xs mb-3">
                        {STAT_KEYS.map((stat) => {
                          const roundResult = result?.rounds[stat];
                          return (
                            <div
                              key={stat}
                              className={`rounded p-1 ${
                                roundResult === "win"
                                  ? "bg-green-900/50 border border-green-500/30"
                                  : roundResult === "lose"
                                    ? "bg-red-900/50 border border-red-500/30"
                                    : roundResult === "tie"
                                      ? "bg-yellow-900/50 border border-yellow-500/30"
                                      : roundResult === "parry" ||
                                          roundResult === "other"
                                        ? "bg-gray-700/50 border border-yellow-500/30"
                                        : "bg-gray-700/50"
                              }`}
                            >
                              <div className="text-gray-400 text-[10px]">
                                {STAT_LABELS[stat]}
                              </div>
                              <div className="text-red-400 font-bold text-xs">
                                {battle.boss!.stats[stat] ?? "?"}
                              </div>
                              {roundResult && (
                                <div
                                  className={`text-[10px] font-bold mt-0.5 ${
                                    roundResult === "win"
                                      ? "text-green-400"
                                      : roundResult === "lose"
                                        ? "text-red-400"
                                        : "text-yellow-400"
                                  }`}
                                >
                                  {roundResult === "win"
                                    ? "W"
                                    : roundResult === "lose"
                                      ? "L"
                                      : roundResult === "parry"
                                        ? "P"
                                        : roundResult === "other"
                                          ? "O"
                                          : "T"}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Tiebreak */}
                      {result?.tiebreak && (
                        <div className="text-center text-xs mb-2">
                          <span className="text-gray-400">Tie-break: </span>
                          <span
                            className={`font-bold ${
                              result.tiebreak === "win"
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {result.tiebreak === "win" ? "Win" : "Lose"}
                          </span>
                        </div>
                      )}

                      {/* Total Stats */}
                      <div className="text-center text-sm mb-3">
                        <span className="text-red-400 font-bold">
                          {bossTotalStats}
                        </span>
                        <span className="text-gray-500 mx-2">vs</span>
                        <span className="text-green-400 font-bold">
                          {teamTotalStats}
                        </span>
                      </div>

                      {/* Result Notes */}
                      {result?.notes && (
                        <div className="text-xs text-gray-300 mb-3 bg-gray-700/30 rounded p-2 whitespace-pre-line">
                          {result.notes}
                        </div>
                      )}

                      {/* Reward/Punishment based on result */}
                      {result ? (
                        <div className="text-xs text-gray-400 mb-3 line-clamp-2">
                          <span
                            className={
                              result.outcome === "win"
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {result.outcome === "win"
                              ? "Reward:"
                              : "Punishment:"}
                          </span>{" "}
                          {result.outcome === "win"
                            ? battle.boss.reward
                            : battle.boss.punishment}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 mb-3 line-clamp-2">
                          <span className="text-green-400">Reward:</span>{" "}
                          {battle.boss.reward}
                        </div>
                      )}

                      {/* Battle Button */}
                      {battle.playerData.length > 0 && (
                        <button
                          disabled
                          onClick={() => startBattle(battle)}
                          className="w-full px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-500 text-white font-bold rounded-none transition-all transform shadow-lg text-sm"
                        >
                          Battle done!
                        </button>
                      )}
                      {battle.playerData.length === 0 && (
                        <p className="text-center text-yellow-500 text-xs">
                          No player data found
                        </p>
                      )}

                      {/* Dev Mode: Edit Result Button */}
                      {devMode && (
                        <button
                          onClick={() => openEditForm(battle.teamId)}
                          className="w-full mt-2 px-4 py-2 bg-yellow-600/30 hover:bg-yellow-600/50 border border-yellow-500/50 text-yellow-300 font-medium rounded-none transition-all text-sm"
                        >
                          {result ? "Edit Result" : "Add Result"}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-gray-500 italic py-4">
                      No boss assigned
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredBattles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl">No battles found</p>
          </div>
        )}
      </div>

      {/* Dev Mode: Edit Result Dialog */}
      {editingTeamId !== null && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[3000]">
          <div className="bg-gray-900 border border-yellow-500/50 rounded-none p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-yellow-400 mb-4">
              Edit Result - Team {editingTeamId}
            </h3>

            {/* Outcome */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-1">
                Outcome
              </label>
              <div className="flex gap-2">
                {(["win", "lose"] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() =>
                      setEditForm((prev) => ({ ...prev, outcome: o }))
                    }
                    className={`flex-1 px-3 py-2 rounded font-bold text-sm transition-all ${
                      editForm.outcome === o
                        ? o === "win"
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    {o === "win" ? "WIN" : "LOSE"}
                  </button>
                ))}
              </div>
            </div>

            {/* Round Results */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">Rounds</label>
              <div className="space-y-2">
                {STAT_KEYS.map((stat) => (
                  <div key={stat} className="flex items-center gap-2">
                    <span className="text-gray-300 text-sm w-10 font-medium">
                      {STAT_LABELS[stat]}
                    </span>
                    <div className="flex gap-1 flex-1">
                      {(
                        [
                          { val: "win" as const, label: "W", color: "green" },
                          { val: "lose" as const, label: "L", color: "red" },
                          { val: "tie" as const, label: "T", color: "yellow" },
                          { val: null, label: "-", color: "gray" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() =>
                            setEditForm((prev) => ({
                              ...prev,
                              rounds: { ...prev.rounds, [stat]: opt.val },
                            }))
                          }
                          className={`flex-1 px-2 py-1 rounded text-xs font-bold transition-all ${
                            editForm.rounds[stat] === opt.val
                              ? `bg-${opt.color}-600 text-white`
                              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                          }`}
                          style={
                            editForm.rounds[stat] === opt.val
                              ? {
                                  backgroundColor:
                                    opt.color === "green"
                                      ? "#16a34a"
                                      : opt.color === "red"
                                        ? "#dc2626"
                                        : opt.color === "yellow"
                                          ? "#ca8a04"
                                          : "#4b5563",
                                  color: "white",
                                }
                              : undefined
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tiebreak */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-1">
                Tie-break
              </label>
              <div className="flex gap-2">
                {(
                  [
                    { val: "win" as const, label: "Win" },
                    { val: "lose" as const, label: "Lose" },
                    { val: null, label: "None" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() =>
                      setEditForm((prev) => ({ ...prev, tiebreak: opt.val }))
                    }
                    className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                      editForm.tiebreak === opt.val
                        ? opt.val === "win"
                          ? "bg-green-600 text-white"
                          : opt.val === "lose"
                            ? "bg-red-600 text-white"
                            : "bg-gray-600 text-white"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-1">Notes</label>
              <textarea
                value={editForm.notes || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Ghi chÃº (ngÆ°á»i bá»‹ isekai, gear nháº­n, v.v.)"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-none text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-y"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setEditingTeamId(null)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-none font-medium text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveResult}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-none font-bold text-sm transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Battle Room Modal - key forces fresh state on each open */}
      {battleView && battleView.boss && (
        <BossBattleRoom
          key={`battle-${battleView.teamId}-${battleSessionId}`}
          battle={battleView}
          onClose={() => setBattleView(null)}
          seasonRaceCounts={seasonRaceCounts}
        />
      )}
    </div>
  );
};
