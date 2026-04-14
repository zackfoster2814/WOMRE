import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { CharacterParser } from "../utils/characterParser";
import { Character } from "../types/character";
import { WheelCanvas } from "../components/WheelCanvas";
import { WheelItem } from "../types";
import { fetchAllPlayerTexts } from "../utils/googleDrive";
import { initializeEffectData } from "../effects/data";
import {
  StatsComparisonMode,
  type TournamentMatchContext,
  type TournamentSaveResult,
} from "./BattleZonePage";
import { WheelOfTruthMode } from "./WheelOfTruthMode";
import { BracketTreeView } from "../components/bracket/BracketTreeView";
import {
  readDriveFile,
  writeDriveFile,
  isDriveConfigured,
} from "../utils/googleDrive";
import { ROUND_256_FILE_ID } from "../config/googleDrive";
import {
  ROUND_CONFIGS,
  type RoundConfig,
  type RoundData,
  type MatchData as SharedMatchData,
  type Round256Data,
  type PlayerRef,
  ROUND_SECTION,
  ROUND_SEARCH_OPTIONS,
  BRANCH_OPTIONS,
  getRoundKeyByMatchNumber,
  searchMatches,
  type SearchType,
} from "../config/tournamentConfig";
import { TournamentLoadingScreen3D } from "../components/three/TournamentLoadingScreen3D";

// Initialize effects
let effectsInitialized = false;
function ensureEffectsInitialized() {
  if (!effectsInitialized) {
    initializeEffectData();
    effectsInitialized = true;
  }
}

// ===================== Types =====================

// MatchData local: extends SharedMatchData với displayLabel cho UI
type MatchData = SharedMatchData & { displayLabel?: string };


interface TournamentPlayer {
  id: number;
  name: string;
  username: string;
  character: Character;
}

// ===================== Main Component =====================

export const PvPTournamentPage = () => {
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  // showIntro: chỉ bật nếu load data mất hơn 200ms (không có cache)
  const [showIntro, setShowIntro] = useState(false);
  const loadDoneRef = useRef(false);
  const [activeTab, setActiveTab] = useState<"create" | "bracket">("create");
  // Sub-tab trong Create: r256 | r128 | r64 | r32w | r32l | r16w | r16l | r8w | r8l | r4w | r4l
  const [createSubTab, setCreateSubTab] = useState<string>("r256");
  const [roundData, setRoundData] = useState<Round256Data | null>(null);
  // State cho các round sau R256
  const [allRoundData, setAllRoundData] = useState<Record<string, RoundData>>({});
  const [driveStatus, setDriveStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [tournamentBattle, setTournamentBattle] =
    useState<TournamentMatchContext | null>(null);
  const [devMode, setDevMode] = useState(() => localStorage.getItem("pvp_devmode") === "1");
  const devKeySeqRef = useRef<string[]>([]);
  const DEV_SEQUENCE = ["d", "e", "v", "m", "o", "d", "e"];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      devKeySeqRef.current = [...devKeySeqRef.current, key].slice(-DEV_SEQUENCE.length);
      if (devKeySeqRef.current.join("") === DEV_SEQUENCE.join("")) {
        setDevMode((prev) => {
          const next = !prev;
          localStorage.setItem("pvp_devmode", next ? "1" : "0");
          return next;
        });
        devKeySeqRef.current = [];
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const loadPlayers = async () => {
      loadDoneRef.current = false;
      setLoading(true);
      // Nếu sau 200ms vẫn chưa load xong → bật intro
      const introTimer = setTimeout(() => {
        if (!loadDoneRef.current) setShowIntro(true);
      }, 200);
      try {
        ensureEffectsInitialized();
        const allPlayers: TournamentPlayer[] = [];
        const maxPlayers = 256;
        const texts = await fetchAllPlayerTexts();
        const sorted = [...texts.entries()].sort(([a], [b]) => a - b);
        for (const [, content] of sorted) {
          if (allPlayers.length >= maxPlayers) break;
          try {
            const character = CharacterParser.parseCharacterFile(content);
            if (character.isSymbiosis || character.race?.race === "Symbiosis") continue;
            allPlayers.push({
              id: character.no,
              name: character.name,
              username: character.username,
              character,
            });
          } catch { /* bỏ qua */ }
        }
        setPlayers(allPlayers.slice(0, maxPlayers));
      } catch (error) {
        console.error("Error loading players:", error);
      } finally {
        loadDoneRef.current = true;
        clearTimeout(introTimer);
        setLoading(false);
      }
    };
    loadPlayers();
  }, []);

  useEffect(() => {
    const loadRoundData = async () => {
      try {
        setDriveStatus("Loading from Google Drive...");
        const raw = await readDriveFile<Record<string, unknown>>(ROUND_256_FILE_ID);
        const data: Round256Data = {
          totalPlayers: (raw.totalPlayers as number) || 256,
          matches: Array.isArray(raw.matches) ? raw.matches : [],
          drawOrder: Array.isArray(raw.drawOrder) ? raw.drawOrder : [],
          lastUpdated: (raw.lastUpdated as string) || new Date().toISOString(),
        };
        setRoundData(data);
        setDriveStatus(`Loaded from Google Drive (${data.matches.length} matches)`);
      } catch (err) {
        console.error("Failed to load from Drive:", err);
        setDriveStatus("Failed to load from Drive - using empty data");
        setRoundData({ totalPlayers: 256, matches: [], drawOrder: [], lastUpdated: new Date().toISOString() });
      }
    };
    loadRoundData();
  }, []);

  // Load dữ liệu cho tất cả các round sau R256
  useEffect(() => {
    const loadAll = async () => {
      const result: Record<string, RoundData> = {};
      await Promise.all(
        ROUND_CONFIGS.filter((c) => c.key !== "r256" && !c.fileId.startsWith("REPLACE_")).map(async (cfg) => {
          try {
            const raw = await readDriveFile<Record<string, unknown>>(cfg.fileId);
            result[cfg.key] = {
              roundKey: cfg.key,
              matches: Array.isArray(raw.matches) ? (raw.matches as MatchData[]) : [],
              drawOrder: Array.isArray(raw.drawOrder) ? (raw.drawOrder as number[]) : [],
              lastUpdated: (raw.lastUpdated as string) || new Date().toISOString(),
            };
          } catch {
            result[cfg.key] = { roundKey: cfg.key, matches: [], drawOrder: [], lastUpdated: new Date().toISOString() };
          }
        }),
      );
      setAllRoundData(result);
    };
    loadAll();
  }, []);

  const saveToDrive = useCallback(async (data: Round256Data) => {
    const config = isDriveConfigured();
    if (!config.canWrite) {
      setDriveStatus("Google Drive write not configured (no Client ID)");
      return false;
    }
    try {
      setSaving(true);
      setDriveStatus("Saving to Google Drive...");
      await writeDriveFile(ROUND_256_FILE_ID, { ...data, lastUpdated: new Date().toISOString() });
      setDriveStatus("Saved to Google Drive");
      return true;
    } catch (err) {
      console.error("Failed to save to Drive:", err);
      setDriveStatus(`Save failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const saveRoundToDrive = useCallback(async (roundKey: string, data: RoundData) => {
    const config = isDriveConfigured();
    if (!config.canWrite) return false;
    const cfg = ROUND_CONFIGS.find((c) => c.key === roundKey);
    if (!cfg) return false;
    try {
      setSaving(true);
      setDriveStatus("Saving to Google Drive...");
      await writeDriveFile(cfg.fileId, { ...data, lastUpdated: new Date().toISOString() });
      setDriveStatus("Saved to Google Drive");
      return true;
    } catch (err) {
      setDriveStatus(`Save failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  // Lấy danh sách PlayerRef từ một round theo side (winners/losers)
  const getPlayersFromRound = useCallback((from: string, side: "winners" | "losers"): PlayerRef[] => {
    const matches = from === "r256"
      ? (roundData?.matches ?? [])
      : (allRoundData[from]?.matches ?? []);
    return matches
      .filter((m) => m.player1 && m.player2 && m.winner)
      .map((m) => side === "winners" ? m.winner! : (m.winner?.no === m.player1?.no ? m.player2! : m.player1!));
  }, [roundData, allRoundData]);

  // Lấy toàn bộ PlayerRef eligible cho một vòng (mix nhiều nguồn)
  const getEligiblePlayers = useCallback((cfg: RoundConfig): PlayerRef[] => {
    const all: PlayerRef[] = [];
    for (const src of cfg.sources) {
      const list = getPlayersFromRound(src.from, src.side);
      all.push(...list);
    }
    // Deduplicate theo no
    const seen = new Set<number>();
    return all.filter((p) => { if (seen.has(p.no)) return false; seen.add(p.no); return true; });
  }, [getPlayersFromRound]);

  const handleSaveTournamentResult = useCallback(
    async (result: TournamentSaveResult) => {
      if (!tournamentBattle) return;
      const matchNo = tournamentBattle.matchNumber;

      // Tìm match thuộc round nào
      if (roundData?.matches.find((m) => m.matchNumber === matchNo)) {
        const winnerRef = roundData.matches.find((m) => m.matchNumber === matchNo)?.player1?.no === result.winnerNo
          ? roundData.matches.find((m) => m.matchNumber === matchNo)?.player1
          : roundData.matches.find((m) => m.matchNumber === matchNo)?.player2;
        const newMatches = roundData.matches.map((m) =>
          m.matchNumber === matchNo ? { ...m, winner: winnerRef ?? null, score: result.score, specialEvent: result.specialEvent, note: result.note } : m,
        );
        const newData: Round256Data = { ...roundData, matches: newMatches, lastUpdated: new Date().toISOString() };
        setRoundData(newData);
        setTournamentBattle(null);
        await saveToDrive(newData);
        return;
      }

      // Tìm trong allRoundData — matchNo là số tuyệt đối, cần convert về local
      for (const cfg of ROUND_CONFIGS) {
        if (cfg.key === "r256") continue;
        const rd = allRoundData[cfg.key];
        if (!rd) continue;
        // Convert matchNo tuyệt đối → local: localNo = matchNo - matchStart + 1
        const localNo = matchNo - cfg.matchStart + 1;
        if (localNo < 1 || localNo > cfg.matchCount) continue;
        const match = rd.matches.find((m) => m.matchNumber === localNo);
        if (match) {
          const winnerRef = match.player1?.no === result.winnerNo ? match.player1 : match.player2;
          const newMatches = rd.matches.map((m) =>
            m.matchNumber === localNo ? { ...m, winner: winnerRef ?? null, score: result.score, specialEvent: result.specialEvent, note: result.note } : m,
          );
          const newRd: RoundData = { ...rd, matches: newMatches, lastUpdated: new Date().toISOString() };
          setAllRoundData((prev) => ({ ...prev, [cfg.key]: newRd }));
          setTournamentBattle(null);
          await saveRoundToDrive(cfg.key, newRd);
          return;
        }
      }
      setTournamentBattle(null);
    },
    [roundData, allRoundData, tournamentBattle, saveToDrive, saveRoundToDrive],
  );

  const handleDevSaveResult = useCallback(
    async (matchNumberAbsolute: number, result: TournamentSaveResult) => {
      const matchNo = matchNumberAbsolute;
      // R256
      if (roundData?.matches.find((m) => m.matchNumber === matchNo)) {
        const m = roundData.matches.find((m) => m.matchNumber === matchNo)!;
        const winnerRef = result.winnerNo === 0 ? null : (m.player1?.no === result.winnerNo ? m.player1 : m.player2);
        const newMatches = roundData.matches.map((x) =>
          x.matchNumber === matchNo ? { ...x, winner: winnerRef ?? null, score: result.score, specialEvent: result.specialEvent, note: result.note } : x,
        );
        const newData: Round256Data = { ...roundData, matches: newMatches, lastUpdated: new Date().toISOString() };
        setRoundData(newData);
        await saveToDrive(newData);
        return;
      }
      // Các round sau
      for (const cfg of ROUND_CONFIGS) {
        if (cfg.key === "r256") continue;
        const rd = allRoundData[cfg.key];
        if (!rd) continue;
        const localNo = matchNo - cfg.matchStart + 1;
        if (localNo < 1 || localNo > cfg.matchCount) continue;
        const match = rd.matches.find((m) => m.matchNumber === localNo);
        if (match) {
          const winnerRef = result.winnerNo === 0 ? null : (match.player1?.no === result.winnerNo ? match.player1 : match.player2);
          const newMatches = rd.matches.map((m) =>
            m.matchNumber === localNo ? { ...m, winner: winnerRef ?? null, score: result.score, specialEvent: result.specialEvent, note: result.note } : m,
          );
          const newRd: RoundData = { ...rd, matches: newMatches, lastUpdated: new Date().toISOString() };
          setAllRoundData((prev) => ({ ...prev, [cfg.key]: newRd }));
          await saveRoundToDrive(cfg.key, newRd);
          return;
        }
      }
    },
    [roundData, allRoundData, saveToDrive, saveRoundToDrive],
  );

  const handleNextMatch = useCallback(
    async (result: TournamentSaveResult) => {
      if (!tournamentBattle) return;
      await handleSaveTournamentResult(result);
      // Build allMatches với matchNumber tuyệt đối để tìm next
      const allMatchesAbsolute: (MatchData & { _cfg?: RoundConfig })[] = [
        ...(roundData?.matches ?? []).map((m) => ({ ...m })),
        ...ROUND_CONFIGS.filter((c) => c.key !== "r256").flatMap((cfg) =>
          (allRoundData[cfg.key]?.matches ?? []).map((m) => ({
            ...m,
            matchNumber: (m.matchNumber - 1) + cfg.matchStart,
            displayLabel: `${cfg.label} #${m.matchNumber}`,
            _cfg: cfg,
          })),
        ),
      ];
      const currentMatchNo = tournamentBattle.matchNumber;
      const nextMatch = allMatchesAbsolute.find(
        (m) => m.matchNumber > currentMatchNo && m.player1 && m.player2 && !m.winner,
      );
      if (nextMatch) {
        setTournamentBattle({
          matchNumber: nextMatch.matchNumber,
          player1No: nextMatch.player1!.no,
          player2No: nextMatch.player2!.no,
          displayLabel: nextMatch.displayLabel,
        });
      }
    },
    [tournamentBattle, roundData, allRoundData, handleSaveTournamentResult],
  );

  const exportLocal = useCallback(() => {
    if (!roundData) return;
    const blob = new Blob([JSON.stringify(roundData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Round256-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [roundData]);

  const importLocal = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as Round256Data;
        setRoundData(data);
        setDriveStatus("Imported from local file");
      } catch {
        setDriveStatus("Failed to import file");
      }
    };
    input.click();
  }, []);

  // Hiển thị màn hình intro 3D tương tác
  if (showIntro) {
    return (
      <TournamentLoadingScreen3D
        loading={loading}
        onSkip={() => setShowIntro(false)}
      />
    );
  }

  if (tournamentBattle) {
    const useWheelOfTruth = tournamentBattle.matchNumber >= 193;
    const BattleMode = useWheelOfTruth ? WheelOfTruthMode : StatsComparisonMode;
    return (
      <BattleMode
        onBack={() => setTournamentBattle(null)}
        tournamentMatch={tournamentBattle}
        onSaveTournamentResult={handleSaveTournamentResult}
        onNextMatch={handleNextMatch}
      />
    );
  }

  const activeRoundCfg = ROUND_CONFIGS.find((c) => c.key === createSubTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 pt-16">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-white mb-2">
          PvP Tournament
          {devMode && (
            <span className="ml-3 text-sm font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 align-middle">
              DEV
            </span>
          )}
        </h1>
        <p className="text-center text-gray-300 mb-2">
          {players.length} players (excluding Symbiosis)
        </p>

        <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
          <span
            className={`text-xs px-2 py-1 rounded ${
              driveStatus.includes("Saved") || driveStatus.includes("Loaded")
                ? "bg-green-600/30 text-green-400"
                : driveStatus.includes("Failed") || driveStatus.includes("not configured")
                  ? "bg-red-600/30 text-red-400"
                  : "bg-yellow-600/30 text-yellow-400"
            }`}
          >
            {driveStatus || "Ready"}
          </span>
          {saving && <span className="text-yellow-400 text-xs animate-pulse">Saving...</span>}
          <button onClick={exportLocal} className="text-xs text-blue-400 hover:text-blue-300 underline">
            Export JSON
          </button>
          <button onClick={importLocal} className="text-xs text-blue-400 hover:text-blue-300 underline">
            Import JSON
          </button>
        </div>

        {/* Main tabs: Create / Bracket */}
        <div className="flex gap-2 mb-4 justify-center">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-8 py-3 rounded-xl font-display uppercase tracking-widest font-bold transition-all duration-300 ${
              activeTab === "create" 
                ? "bg-primary/20 text-primary border-b-2 border-primary shadow-[0_0_15px_rgba(255,209,108,0.3)]" 
                : "bg-surface/60 text-gray-400 border-b-2 border-transparent hover:text-primary hover:bg-surface/80"
            }`}
          >
            Create
          </button>
          <button
            onClick={() => setActiveTab("bracket")}
            className={`px-8 py-3 rounded-xl font-display uppercase tracking-widest font-bold transition-all duration-300 ${
              activeTab === "bracket" 
                ? "bg-primary/20 text-primary border-b-2 border-primary shadow-[0_0_15px_rgba(255,209,108,0.3)]" 
                : "bg-surface/60 text-gray-400 border-b-2 border-transparent hover:text-primary hover:bg-surface/80"
            }`}
          >
            Bracket
            {roundData && roundData.matches.length > 0 && (
              <span className="ml-2 bg-purple-500/30 text-purple-300 text-xs px-1.5 py-0.5 rounded">
                {roundData.matches.filter((m) => m.winner).length}/{roundData.matches.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "create" && (
          <>
            {/* Round selector — dropdown có nhóm */}
            {(() => {
              const groups = [
                { label: "Vòng loại", keys: ["r256", "r128"] },
                { label: "R64 / R32", keys: ["r64w", "r32l1", "r32w", "r32l2"] },
                { label: "R16", keys: ["r16w", "r16l1", "r16l2"] },
                { label: "Tứ Kết", keys: ["qfw", "qfl1", "qfl2"] },
                { label: "Bán Kết", keys: ["sfw", "sfl1", "sfl2"] },
                { label: "Chung Kết Nhánh", keys: ["gfw", "gfl1", "gfl2"] },
                { label: "Finals", keys: ["bronze", "gf"] },
              ];
              const activeRd = createSubTab === "r256" ? roundData : allRoundData[createSubTab];
              const activeDone = activeRd?.matches.filter((m) => m.winner).length ?? 0;
              const activeTotal = activeRd?.matches.length ?? 0;
              const activeCfg = ROUND_CONFIGS.find((c) => c.key === createSubTab);
              return (
                <div className="flex items-center gap-3 mb-6">
                  <select
                    value={createSubTab}
                    onChange={(e) => setCreateSubTab(e.target.value)}
                    className="flex-1 max-w-xs px-3 py-2 rounded-none bg-gray-800 border border-purple-600/40 text-white text-sm font-medium focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {groups.map((g) => (
                      <optgroup key={g.label} label={g.label}>
                        {g.keys.map((key) => {
                          const cfg = ROUND_CONFIGS.find((c) => c.key === key);
                          if (!cfg) return null;
                          const rd = key === "r256" ? roundData : allRoundData[key];
                          const done = rd?.matches.filter((m) => m.winner).length ?? 0;
                          const total = rd?.matches.length ?? 0;
                          const badge = total > 0 ? ` (${done}/${total})` : "";
                          return (
                            <option key={key} value={key}>
                              {cfg.label}{badge}
                            </option>
                          );
                        })}
                      </optgroup>
                    ))}
                  </select>
                  {/* Progress badge của round đang chọn */}
                  {activeTotal > 0 && (
                    <span className="text-sm text-gray-400">
                      <span className={`font-semibold ${activeDone === activeTotal ? "text-green-400" : "text-purple-300"}`}>
                        {activeDone}
                      </span>
                      <span className="text-gray-600">/{activeTotal}</span>
                      <span className="ml-1 text-xs text-gray-500">
                        {activeCfg?.label}
                      </span>
                    </span>
                  )}
                </div>
              );
            })()}

            {/* R256: dùng CreateTab cũ */}
            {createSubTab === "r256" && (
              <CreateTab
                players={players}
                roundData={roundData}
                setRoundData={setRoundData}
                saveToDrive={saveToDrive}
                devMode={devMode}
              />
            )}

            {/* GF: dùng GrandFinalTab riêng */}
            {createSubTab === "gf" && (
              <GrandFinalTab
                wbWinner={getPlayersFromRound("gfw", "winners")[0] ?? null}
                lbWinner={getPlayersFromRound("gfl2", "winners")[0] ?? null}
                roundData={allRoundData["gf"] ?? null}
                setRoundData={(data: RoundData) => setAllRoundData((prev) => ({ ...prev, gf: data }))}
                saveRoundToDrive={saveRoundToDrive}
                onOpenMatch={setTournamentBattle}
              />
            )}

            {/* Bronze: dùng BronzeFinalTab riêng */}
            {createSubTab === "bronze" && (
              <BronzeFinalTab
                player1={getPlayersFromRound("gfw", "losers")[0] ?? null}
                player2={getPlayersFromRound("gfl1", "losers")[0] ?? null}
                roundData={allRoundData["bronze"] ?? null}
                setRoundData={(data: RoundData) => setAllRoundData((prev) => ({ ...prev, bronze: data }))}
                saveRoundToDrive={saveRoundToDrive}
                onOpenMatch={setTournamentBattle}
              />
            )}

            {/* Các round sau: dùng GenericRoundCreateTab */}
            {createSubTab !== "r256" && createSubTab !== "gf" && createSubTab !== "bronze" && activeRoundCfg && (
              <GenericRoundCreateTab
                config={activeRoundCfg}
                eligiblePlayers={getEligiblePlayers(activeRoundCfg)}
                roundData={allRoundData[activeRoundCfg.key] ?? null}
                setRoundData={(data) => setAllRoundData((prev) => ({ ...prev, [activeRoundCfg.key]: data }))}
                saveRoundToDrive={saveRoundToDrive}
                devMode={devMode}
              />
            )}
          </>
        )}

        {activeTab === "bracket" && (
          <BracketTab
            roundData={roundData}
            allRoundData={allRoundData}
            onOpenMatch={setTournamentBattle}
            devMode={devMode}
            onDevSaveResult={handleDevSaveResult}
          />
        )}
      </div>
    </div>
  );
};

// ===================== Create Tab =====================

interface CreateTabProps {
  players: TournamentPlayer[];
  roundData: Round256Data | null;
  setRoundData: (data: Round256Data) => void;
  saveToDrive: (data: Round256Data) => Promise<boolean>;
  devMode?: boolean;
}

const CreateTab = ({
  players,
  roundData,
  setRoundData,
  saveToDrive,
  devMode,
}: CreateTabProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelItems, setWheelItems] = useState<WheelItem[]>([]);
  const [lastDrawnPlayer, setLastDrawnPlayer] =
    useState<TournamentPlayer | null>(null);
  const [autoDrawing, setAutoDrawing] = useState(false);
  const autoDrawQueueRef = useRef<number[]>([]);
  const autoDrawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<Round256Data | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  const drawnPlayerIds = useMemo(() => {
    if (!roundData) return new Set<number>();
    return new Set(roundData.drawOrder);
  }, [roundData]);

  const remainingPlayers = useMemo(() => {
    return players.filter((p) => !drawnPlayerIds.has(p.id));
  }, [players, drawnPlayerIds]);

  const currentSlot = roundData?.drawOrder.length ?? 0;
  const currentMatchNumber = Math.floor(currentSlot / 2) + 1;
  const isFillingPlayer2 = currentSlot % 2 === 1;

  useEffect(() => {
    const items: WheelItem[] = remainingPlayers.map((p) => ({
      id: `player-${p.id}`,
      name: `No.${p.id} ${p.name}`,
      weight: 1,
    }));
    setWheelItems(items);
  }, [remainingPlayers]);

  const debouncedSave = useCallback(
    (data: Round256Data) => {
      pendingSaveRef.current = data;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const delay = autoDrawQueueRef.current.length > 0 ? 10000 : 500;
      saveTimerRef.current = setTimeout(async () => {
        const dataToSave = pendingSaveRef.current;
        if (!dataToSave || isSavingRef.current) return;
        isSavingRef.current = true;
        pendingSaveRef.current = null;
        await saveToDrive(dataToSave);
        isSavingRef.current = false;
        if (pendingSaveRef.current) debouncedSave(pendingSaveRef.current);
      }, delay);
    },
    [saveToDrive],
  );

  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const dataToSave = pendingSaveRef.current;
    if (!dataToSave) return;
    pendingSaveRef.current = null;
    isSavingRef.current = true;
    await saveToDrive(dataToSave);
    isSavingRef.current = false;
  }, [saveToDrive]);

  const handleSpinComplete = useCallback(
    (item: WheelItem) => {
      if (!roundData) return;
      const playerId = parseInt(item.id.replace("player-", ""));
      const drawnPlayer = players.find((p) => p.id === playerId);
      if (!drawnPlayer) return;

      setLastDrawnPlayer(drawnPlayer);
      const newDrawOrder = [...roundData.drawOrder, playerId];
      const newMatches = [...roundData.matches];
      const matchIdx = Math.floor((newDrawOrder.length - 1) / 2);
      const isPlayer1 = (newDrawOrder.length - 1) % 2 === 0;

      if (isPlayer1) {
        newMatches.push({
          matchNumber: matchIdx + 1,
          player1: {
            no: drawnPlayer.id,
            name: drawnPlayer.name,
            username: drawnPlayer.username,
          },
          player2: null,
          winner: null,
          score: null,
          specialEvent: null,
          note: null,
        });
      } else {
        if (newMatches[matchIdx]) {
          newMatches[matchIdx] = {
            ...newMatches[matchIdx],
            player2: {
              no: drawnPlayer.id,
              name: drawnPlayer.name,
              username: drawnPlayer.username,
            },
          };
        }
      }

      const newData: Round256Data = {
        ...roundData,
        matches: newMatches,
        drawOrder: newDrawOrder,
        lastUpdated: new Date().toISOString(),
      };

      setRoundData(newData);
      setIsSpinning(false);
      debouncedSave(newData);

      if (autoDrawQueueRef.current.length > 0) {
        autoDrawQueueRef.current = autoDrawQueueRef.current.filter(
          (id) => id !== playerId,
        );
        if (autoDrawQueueRef.current.length > 0) {
          autoDrawTimerRef.current = setTimeout(() => {
            if (autoDrawQueueRef.current.length > 0) setIsSpinning(true);
            else {
              setAutoDrawing(false);
              flushSave();
            }
          }, 800);
        } else {
          setAutoDrawing(false);
          flushSave();
        }
      }
    },
    [roundData, players, setRoundData, debouncedSave, flushSave],
  );

  const startAutoDraw = useCallback(() => {
    if (!roundData || remainingPlayers.length === 0 || isSpinning) return;
    autoDrawQueueRef.current = remainingPlayers.map((p) => p.id);
    setAutoDrawing(true);
    setIsSpinning(true);
  }, [roundData, remainingPlayers, isSpinning]);

  // DevMode: draw tất cả instant, không animation
  const devDrawAll = useCallback(async () => {
    if (!roundData || remainingPlayers.length === 0) return;
    const shuffled = [...remainingPlayers].sort(() => Math.random() - 0.5);
    let currentDrawOrder = [...roundData.drawOrder];
    let currentMatches = [...roundData.matches];
    for (const p of shuffled) {
      currentDrawOrder = [...currentDrawOrder, p.id];
      const matchIdx = Math.floor((currentDrawOrder.length - 1) / 2);
      const isP1 = (currentDrawOrder.length - 1) % 2 === 0;
      if (isP1) {
        currentMatches = [...currentMatches, {
          matchNumber: matchIdx + 1,
          player1: { no: p.id, name: p.name, username: p.username },
          player2: null, winner: null, score: null, specialEvent: null, note: null,
        }];
      } else if (currentMatches[matchIdx]) {
        currentMatches = currentMatches.map((m, i) =>
          i === matchIdx ? { ...m, player2: { no: p.id, name: p.name, username: p.username } } : m
        );
      }
    }
    const newData: Round256Data = { ...roundData, matches: currentMatches, drawOrder: currentDrawOrder, lastUpdated: new Date().toISOString() };
    setRoundData(newData);
    setLastDrawnPlayer(shuffled[shuffled.length - 1]);
    await saveToDrive(newData);
  }, [roundData, remainingPlayers, setRoundData, saveToDrive]);

  const stopAutoDraw = useCallback(() => {
    autoDrawQueueRef.current = [];
    setAutoDrawing(false);
    if (autoDrawTimerRef.current) {
      clearTimeout(autoDrawTimerRef.current);
      autoDrawTimerRef.current = null;
    }
    flushSave();
  }, [flushSave]);

  const resetDraw = useCallback(async () => {
    if (!confirm("Reset all draw data? This cannot be undone.")) return;
    const newData: Round256Data = {
      totalPlayers: 256,
      matches: [],
      drawOrder: [],
      lastUpdated: new Date().toISOString(),
    };
    setRoundData(newData);
    setLastDrawnPlayer(null);
    await saveToDrive(newData);
  }, [setRoundData, saveToDrive]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gray-800/50 rounded-none p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            Drawing Slot #{currentSlot + 1}
            <span className="text-sm font-normal text-gray-400 ml-2">
              (Match #{currentMatchNumber} -{" "}
              {isFillingPlayer2 ? "Player 2" : "Player 1"})
            </span>
          </h2>
          <span className="text-gray-300">
            {remainingPlayers.length} remaining
          </span>
        </div>

        {remainingPlayers.length > 0 ? (
          <div className="max-w-md mx-auto">
            <WheelCanvas
              items={wheelItems}
              isSpinning={isSpinning}
              onSpinComplete={handleSpinComplete}
              onSpin={() => {
                if (remainingPlayers.length > 0 && !isSpinning)
                  setIsSpinning(true);
              }}
              spinButtonClassName="w-20 h-20 text-lg"
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-green-400 text-xl">
              All {roundData?.drawOrder.length || 0} players drawn!
            </p>
          </div>
        )}

        {lastDrawnPlayer && (
          <div className="mt-4 p-3 bg-yellow-600/20 border border-yellow-600 rounded-none">
            <p className="text-yellow-400 text-center">
              Last Drawn:{" "}
              <span className="font-bold">
                No.{lastDrawnPlayer.id} {lastDrawnPlayer.name}
              </span>
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-center gap-2 flex-wrap">
          {remainingPlayers.length > 0 && !autoDrawing && (
            <button
              onClick={() => { if (!isSpinning) setIsSpinning(true); }}
              disabled={isSpinning}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Draw 1
            </button>
          )}
          {remainingPlayers.length > 0 && !autoDrawing && (
            devMode ? (
              <button
                onClick={devDrawAll}
                disabled={isSpinning}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-none text-sm font-mono disabled:opacity-50 border border-red-500/50"
              >
                [DEV] Draw All Instant ({remainingPlayers.length})
              </button>
            ) : (
              <button
                onClick={startAutoDraw}
                disabled={isSpinning}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Auto Draw All ({remainingPlayers.length})
              </button>
            )
          )}
          {autoDrawing && (
            <button
              onClick={stopAutoDraw}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-none text-sm animate-pulse"
            >
              Stop Auto Draw
            </button>
          )}
          <button
            onClick={resetDraw}
            disabled={isSpinning || autoDrawing}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-none p-4 border border-gray-700/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Matches</h2>
          <span className="text-sm text-gray-400 bg-gray-700/50 px-2.5 py-1 rounded-full font-mono">
            {roundData?.matches.length || 0}
          </span>
        </div>
        <div className="max-h-[600px] overflow-y-auto space-y-1.5 pr-1">
          {roundData?.matches
            .slice()
            .reverse()
            .map((match) => (
              <div
                key={match.matchNumber}
                className={`px-3 py-2.5 rounded-none border transition-colors ${
                  match.player2
                    ? "bg-gray-700/30 border-gray-600/30"
                    : "bg-yellow-900/15 border-yellow-600/30 animate-pulse"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-gray-500 w-5">
                    {match.matchNumber}
                  </span>
                  <div className="flex-1 text-sm">
                    <span className="text-blue-300 font-medium">
                      <span className="text-blue-500/60 text-xs mr-1">
                        {match.player1?.no}.
                      </span>
                      {match.player1?.name || "???"}
                    </span>
                  </div>
                  <span className="text-gray-600 text-[10px] font-bold tracking-wider">
                    VS
                  </span>
                  <div className="flex-1 text-sm text-right">
                    {match.player2 ? (
                      <span className="text-red-300 font-medium">
                        {match.player2.name}
                        <span className="text-red-500/60 text-xs ml-1">
                          .{match.player2.no}
                        </span>
                      </span>
                    ) : (
                      <span className="text-yellow-500/60 text-xs italic">
                        Waiting...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          {(!roundData || roundData.matches.length === 0) && (
            <p className="text-gray-500 text-center py-8 text-sm">
              Spin the wheel to start drawing players
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ===================== Bronze Final Tab =====================

interface BronzeFinalTabProps {
  player1: PlayerRef | null;
  player2: PlayerRef | null;
  roundData: RoundData | null;
  setRoundData: (data: RoundData) => void;
  saveRoundToDrive: (key: string, data: RoundData) => Promise<boolean>;
  onOpenMatch: (match: TournamentMatchContext) => void;
}

const BronzeFinalTab = ({
  player1,
  player2,
  roundData,
  setRoundData,
  saveRoundToDrive,
  onOpenMatch,
}: BronzeFinalTabProps) => {
  const cfg = ROUND_CONFIGS.find((c) => c.key === "bronze")!;
  const match = roundData?.matches.find((m) => m.matchNumber === 1) ?? null;
  const canCreate = !!player1 && !!player2;

  const handleCreate = async () => {
    if (!player1 || !player2) return;
    const newMatch: MatchData = { matchNumber: 1, player1, player2, winner: null, score: null, specialEvent: null, note: null };
    const newData: RoundData = { roundKey: "bronze", matches: [newMatch], drawOrder: [], lastUpdated: new Date().toISOString() };
    setRoundData(newData);
    await saveRoundToDrive("bronze", newData);
  };

  const handleReset = async () => {
    if (!confirm("Reset kết quả Tranh Hạng 3?")) return;
    const newData: RoundData = { roundKey: "bronze", matches: [], drawOrder: [], lastUpdated: new Date().toISOString() };
    setRoundData(newData);
    await saveRoundToDrive("bronze", newData);
  };

  const openMatch = () => {
    if (!match) return;
    onOpenMatch({
      matchNumber: cfg.matchStart,
      player1No: match.player1?.no ?? 0,
      player2No: match.player2?.no ?? 0,
      existingWinnerNo: match.winner?.no,
      existingScore: match.score,
      existingSpecialEvent: match.specialEvent,
      existingNote: match.note,
      displayLabel: `${cfg.label} #1`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Players */}
      <div className="grid grid-cols-2 gap-3 text-center">
        {[player1, player2].map((p, i) => (
          <div key={i} className={`rounded-none p-3 border ${p ? "bg-gray-800/60 border-gray-700/50" : "bg-gray-800/30 border-gray-700/30"}`}>
            <div className="text-xs text-amber-600 font-bold mb-1">Hạng {i === 0 ? "3" : "4"} ứng viên</div>
            <div className="text-white font-semibold">{p?.name ?? "Chưa có"}</div>
            {p && <div className="text-gray-400 text-xs">#{p.no}</div>}
          </div>
        ))}
      </div>

      {/* Winner banner */}
      {match?.winner && (
        <div className="text-center py-3 rounded-none bg-amber-900/30 border border-amber-700/40">
          <div className="text-amber-400 text-xs font-bold tracking-widest mb-1">HẠNG 3</div>
          <div className="text-white text-xl font-bold">{match.winner.name}</div>
          <div className="text-amber-400 text-sm">#{match.winner.no}</div>
        </div>
      )}

      {/* Create / Reset */}
      {!match ? (
        <button
          onClick={handleCreate}
          disabled={!canCreate}
          className="w-full py-3 bg-amber-700 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-none transition-colors"
        >
          {canCreate ? "Tạo trận Tranh Hạng 3" : "Chờ kết quả Chung Kết Nhánh Thắng + Nhánh Thua"}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-gray-800/60 rounded-none p-4 border border-amber-700/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-amber-500 font-bold">Tranh Hạng 3</span>
              {match.winner
                ? <span className="text-xs bg-green-700/30 text-green-400 px-2 py-0.5 rounded">Done</span>
                : <span className="text-xs bg-yellow-700/30 text-yellow-400 px-2 py-0.5 rounded">Pending</span>}
            </div>
            <div className="space-y-2 mb-3">
              {[match.player1, match.player2].map((p) => p && (
                <div key={p.no} className={`flex items-center justify-between px-3 py-2 rounded ${match.winner?.no === p.no ? "bg-green-700/30 ring-1 ring-green-500" : "bg-gray-700/50"}`}>
                  <span className="text-white text-sm">{p.name}</span>
                  <div className="flex items-center gap-2">
                    {match.winner?.no === p.no && <span className="text-green-400 text-xs font-bold">HẠNG 3</span>}
                    <span className="text-gray-400 text-xs">#{p.no}</span>
                  </div>
                </div>
              ))}
            </div>
            {!match.winner && (
              <button onClick={openMatch} className="w-full py-2 bg-amber-700/80 hover:bg-amber-600 text-white text-sm rounded-none transition-colors">
                Nhập kết quả
              </button>
            )}
            {match.score && <div className="text-center text-xs text-gray-400 mt-1">Score: {match.score}</div>}
          </div>
          <button onClick={handleReset} className="text-xs text-red-400 hover:text-red-300 underline">
            Reset Tranh Hạng 3
          </button>
        </div>
      )}
    </div>
  );
};

// ===================== Grand Final Tab =====================

interface GrandFinalTabProps {
  wbWinner: PlayerRef | null;
  lbWinner: PlayerRef | null;
  roundData: RoundData | null;
  setRoundData: (data: RoundData) => void;
  saveRoundToDrive: (key: string, data: RoundData) => Promise<boolean>;
  onOpenMatch: (match: TournamentMatchContext) => void;
}

const GrandFinalTab = ({
  wbWinner,
  lbWinner,
  roundData,
  setRoundData,
  saveRoundToDrive,
  onOpenMatch,
}: GrandFinalTabProps) => {
  const gfCfg = ROUND_CONFIGS.find((c) => c.key === "gf")!;
  const matches = roundData?.matches ?? [];
  const game1 = matches.find((m) => m.matchNumber === 1) ?? null;
  const game2 = matches.find((m) => m.matchNumber === 2) ?? null;

  // WB winner thắng GF #1 → vô địch luôn
  const wbWonGame1 = game1?.winner && wbWinner && game1.winner.no === wbWinner.no;
  // LB winner thắng GF #1 → cần game 2
  const lbWonGame1 = game1?.winner && lbWinner && game1.winner.no === lbWinner.no;
  // Champion
  const champion = wbWonGame1 ? wbWinner : game2?.winner ?? null;

  const canCreate = !!wbWinner && !!lbWinner;

  const handleCreateMatches = async () => {
    if (!wbWinner || !lbWinner) return;
    const newMatches: MatchData[] = [
      { matchNumber: 1, player1: wbWinner, player2: lbWinner, winner: null, score: null, specialEvent: null, note: null },
      { matchNumber: 2, player1: wbWinner, player2: lbWinner, winner: null, score: null, specialEvent: null, note: null },
    ];
    const newData: RoundData = { roundKey: "gf", matches: newMatches, drawOrder: [], lastUpdated: new Date().toISOString() };
    setRoundData(newData);
    await saveRoundToDrive("gf", newData);
  };

  const handleResetMatches = async () => {
    if (!confirm("Reset kết quả Grand Final?")) return;
    const newData: RoundData = { roundKey: "gf", matches: [], drawOrder: [], lastUpdated: new Date().toISOString() };
    setRoundData(newData);
    await saveRoundToDrive("gf", newData);
  };

  const openMatch = (match: MatchData) => {
    onOpenMatch({
      matchNumber: (match.matchNumber - 1) + gfCfg.matchStart,
      player1No: match.player1?.no ?? 0,
      player2No: match.player2?.no ?? 0,
      existingWinnerNo: match.winner?.no,
      existingScore: match.score,
      existingSpecialEvent: match.specialEvent,
      existingNote: match.note,
      displayLabel: `${gfCfg.label} #${match.matchNumber}`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Players */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className={`rounded-none p-3 border ${wbWinner ? "bg-green-900/20 border-green-700/40" : "bg-gray-800/50 border-gray-700/40"}`}>
          <div className="text-xs text-green-400 font-bold mb-1">Nhánh Thắng</div>
          <div className="text-white font-semibold">{wbWinner?.name ?? "Chưa có"}</div>
          {wbWinner && <div className="text-gray-400 text-xs">#{wbWinner.no}</div>}
        </div>
        <div className={`rounded-none p-3 border ${lbWinner ? "bg-orange-900/20 border-orange-700/40" : "bg-gray-800/50 border-gray-700/40"}`}>
          <div className="text-xs text-orange-400 font-bold mb-1">Nhánh Thua</div>
          <div className="text-white font-semibold">{lbWinner?.name ?? "Chưa có"}</div>
          {lbWinner && <div className="text-gray-400 text-xs">#{lbWinner.no}</div>}
        </div>
      </div>

      {/* Champion banner */}
      {champion && (
        <div className="text-center py-4 rounded-none bg-gradient-to-r from-yellow-900/40 via-yellow-700/30 to-yellow-900/40 border border-yellow-500/50">
          <div className="text-yellow-300 text-xs font-bold tracking-widest mb-1">VÔ ĐỊCH</div>
          <div className="text-white text-2xl font-bold">{champion.name}</div>
          <div className="text-yellow-400 text-sm">#{champion.no}</div>
        </div>
      )}

      {/* Create / Reset */}
      {matches.length === 0 ? (
        <button
          onClick={handleCreateMatches}
          disabled={!canCreate}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-none transition-colors"
        >
          {canCreate ? "Tạo 2 trận Grand Final" : "Chờ kết quả nhánh thắng + nhánh thua"}
        </button>
      ) : (
        <button onClick={handleResetMatches} className="text-xs text-red-400 hover:text-red-300 underline">
          Reset Grand Final
        </button>
      )}

      {/* Match cards */}
      {game1 && (
        <div className="space-y-3">
          {/* GF #1 */}
          <div className="bg-gray-800/60 rounded-none p-4 border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-purple-400 font-bold">GF #1</span>
              {game1.winner
                ? <span className="text-xs bg-green-700/30 text-green-400 px-2 py-0.5 rounded">Done</span>
                : <span className="text-xs bg-yellow-700/30 text-yellow-400 px-2 py-0.5 rounded">Pending</span>}
            </div>
            <div className="space-y-2 mb-3">
              {[game1.player1, game1.player2].map((p) => p && (
                <div key={p.no} className={`flex items-center justify-between px-3 py-2 rounded ${game1.winner?.no === p.no ? "bg-green-700/30 ring-1 ring-green-500" : "bg-gray-700/50"}`}>
                  <span className="text-white text-sm">{p.name}</span>
                  <div className="flex items-center gap-2">
                    {game1.winner?.no === p.no && <span className="text-green-400 text-xs font-bold">WIN</span>}
                    <span className="text-gray-400 text-xs">#{p.no}</span>
                  </div>
                </div>
              ))}
            </div>
            {!game1.winner && (
              <button onClick={() => openMatch(game1)} className="w-full py-2 bg-purple-600/80 hover:bg-purple-500 text-white text-sm rounded-none transition-colors">
                Nhập kết quả GF #1
              </button>
            )}
            {game1.score && <div className="text-center text-xs text-gray-400 mt-1">Score: {game1.score}</div>}
          </div>

          {/* GF #2 */}
          {lbWonGame1 && game2 && (
            <div className="bg-gray-800/60 rounded-none p-4 border border-orange-700/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-orange-400 font-bold">GF #2 (Reset Bracket)</span>
                {game2.winner
                  ? <span className="text-xs bg-green-700/30 text-green-400 px-2 py-0.5 rounded">Done</span>
                  : <span className="text-xs bg-orange-700/30 text-orange-400 px-2 py-0.5 rounded">Cần đánh</span>}
              </div>
              <div className="space-y-2 mb-3">
                {[game2.player1, game2.player2].map((p) => p && (
                  <div key={p.no} className={`flex items-center justify-between px-3 py-2 rounded ${game2.winner?.no === p.no ? "bg-green-700/30 ring-1 ring-green-500" : "bg-gray-700/50"}`}>
                    <span className="text-white text-sm">{p.name}</span>
                    <div className="flex items-center gap-2">
                      {game2.winner?.no === p.no && <span className="text-green-400 text-xs font-bold">WIN</span>}
                      <span className="text-gray-400 text-xs">#{p.no}</span>
                    </div>
                  </div>
                ))}
              </div>
              {!game2.winner && (
                <button onClick={() => openMatch(game2)} className="w-full py-2 bg-orange-600/80 hover:bg-orange-500 text-white text-sm rounded-none transition-colors">
                  Nhập kết quả GF #2
                </button>
              )}
              {game2.score && <div className="text-center text-xs text-gray-400 mt-1">Score: {game2.score}</div>}
            </div>
          )}

          {/* GF #1 chưa có kết quả: ẩn GF #2 */}
          {!game1.winner && (
            <div className="bg-gray-800/30 rounded-none p-4 border border-dashed border-gray-700/40 text-center text-gray-600 text-sm">
              GF #2 — chờ kết quả GF #1
            </div>
          )}

          {/* WB winner thắng GF #1: không cần GF #2 */}
          {wbWonGame1 && (
            <div className="bg-gray-800/30 rounded-none p-4 border border-dashed border-gray-700/40 text-center text-gray-500 text-sm">
              GF #2 — không cần (Nhánh Thắng vô địch)
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===================== Generic Round Create Tab =====================

interface GenericRoundCreateTabProps {
  config: RoundConfig;
  eligiblePlayers: PlayerRef[];
  roundData: RoundData | null;
  setRoundData: (data: RoundData) => void;
  saveRoundToDrive: (key: string, data: RoundData) => Promise<boolean>;
  devMode?: boolean;
}

const GenericRoundCreateTab = ({
  config,
  eligiblePlayers,
  roundData,
  setRoundData,
  saveRoundToDrive,
  devMode,
}: GenericRoundCreateTabProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastDrawnPlayer, setLastDrawnPlayer] = useState<PlayerRef | null>(null);
  const [autoDrawing, setAutoDrawing] = useState(false);
  const autoDrawQueueRef = useRef<number[]>([]);
  const autoDrawTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<RoundData | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  const drawOrder = roundData?.drawOrder ?? [];
  const matches = roundData?.matches ?? [];

  const drawnIds = useMemo(() => new Set(drawOrder), [drawOrder]);
  const remainingPlayers = useMemo(
    () => eligiblePlayers.filter((p) => !drawnIds.has(p.no)),
    [eligiblePlayers, drawnIds],
  );

  const currentSlot = drawOrder.length;
  const currentMatchNumber = Math.floor(currentSlot / 2) + 1;
  const isFillingPlayer2 = currentSlot % 2 === 1;

  const wheelItems = useMemo<WheelItem[]>(
    () => remainingPlayers.map((p) => ({ id: `player-${p.no}`, name: `No.${p.no} ${p.name}`, weight: 1 })),
    [remainingPlayers],
  );

  const debouncedSave = useCallback(
    (data: RoundData) => {
      pendingSaveRef.current = data;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const delay = autoDrawQueueRef.current.length > 0 ? 10000 : 500;
      saveTimerRef.current = setTimeout(async () => {
        const dataToSave = pendingSaveRef.current;
        if (!dataToSave || isSavingRef.current) return;
        isSavingRef.current = true;
        pendingSaveRef.current = null;
        await saveRoundToDrive(config.key, dataToSave);
        isSavingRef.current = false;
        if (pendingSaveRef.current) debouncedSave(pendingSaveRef.current);
      }, delay);
    },
    [saveRoundToDrive, config.key],
  );

  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
    const dataToSave = pendingSaveRef.current;
    if (!dataToSave) return;
    pendingSaveRef.current = null;
    isSavingRef.current = true;
    await saveRoundToDrive(config.key, dataToSave);
    isSavingRef.current = false;
  }, [saveRoundToDrive, config.key]);

  const handleSpinComplete = useCallback(
    (item: WheelItem) => {
      const playerId = parseInt(item.id.replace("player-", ""));
      const drawnPlayer = eligiblePlayers.find((p) => p.no === playerId);
      if (!drawnPlayer) return;

      setLastDrawnPlayer(drawnPlayer);
      const newDrawOrder = [...drawOrder, playerId];
      const newMatches = [...matches];
      const matchIdx = Math.floor((newDrawOrder.length - 1) / 2);
      const isPlayer1 = (newDrawOrder.length - 1) % 2 === 0;

      if (isPlayer1) {
        newMatches.push({
          matchNumber: matchIdx + 1,
          player1: { no: drawnPlayer.no, name: drawnPlayer.name, username: drawnPlayer.username },
          player2: null,
          winner: null,
          score: null,
          specialEvent: null,
          note: null,
        });
      } else {
        if (newMatches[matchIdx]) {
          newMatches[matchIdx] = {
            ...newMatches[matchIdx],
            player2: { no: drawnPlayer.no, name: drawnPlayer.name, username: drawnPlayer.username },
          };
        }
      }

      const newData: RoundData = {
        roundKey: config.key,
        matches: newMatches,
        drawOrder: newDrawOrder,
        lastUpdated: new Date().toISOString(),
      };

      setRoundData(newData);
      setIsSpinning(false);
      debouncedSave(newData);

      if (autoDrawQueueRef.current.length > 0) {
        autoDrawQueueRef.current = autoDrawQueueRef.current.filter((id) => id !== playerId);
        if (autoDrawQueueRef.current.length > 0) {
          autoDrawTimerRef.current = setTimeout(() => {
            if (autoDrawQueueRef.current.length > 0) setIsSpinning(true);
            else { setAutoDrawing(false); flushSave(); }
          }, 800);
        } else {
          setAutoDrawing(false);
          flushSave();
        }
      }
    },
    [drawOrder, matches, eligiblePlayers, config.key, setRoundData, debouncedSave, flushSave],
  );

  const startAutoDraw = useCallback(() => {
    if (remainingPlayers.length === 0 || isSpinning) return;
    autoDrawQueueRef.current = remainingPlayers.map((p) => p.no);
    setAutoDrawing(true);
    setIsSpinning(true);
  }, [remainingPlayers, isSpinning]);

  const stopAutoDraw = useCallback(() => {
    autoDrawQueueRef.current = [];
    setAutoDrawing(false);
    if (autoDrawTimerRef.current) { clearTimeout(autoDrawTimerRef.current); autoDrawTimerRef.current = null; }
    flushSave();
  }, [flushSave]);

  // DevMode: draw tất cả instant
  const devDrawAll = useCallback(async () => {
    if (remainingPlayers.length === 0) return;
    const shuffled = [...remainingPlayers].sort(() => Math.random() - 0.5);
    let currentDrawOrder = [...(roundData?.drawOrder ?? [])];
    let currentMatches = [...(roundData?.matches ?? [])];
    for (const p of shuffled) {
      currentDrawOrder = [...currentDrawOrder, p.no];
      const matchIdx = Math.floor((currentDrawOrder.length - 1) / 2);
      const isP1 = (currentDrawOrder.length - 1) % 2 === 0;
      if (isP1) {
        currentMatches = [...currentMatches, {
          matchNumber: matchIdx + 1,
          player1: { no: p.no, name: p.name, username: p.username },
          player2: null, winner: null, score: null, specialEvent: null, note: null,
        }];
      } else if (currentMatches[matchIdx]) {
        currentMatches = currentMatches.map((m, i) =>
          i === matchIdx ? { ...m, player2: { no: p.no, name: p.name, username: p.username } } : m
        );
      }
    }
    const newData: RoundData = { roundKey: config.key, matches: currentMatches, drawOrder: currentDrawOrder, lastUpdated: new Date().toISOString() };
    setRoundData(newData);
    setLastDrawnPlayer(shuffled[shuffled.length - 1]);
    await saveRoundToDrive(config.key, newData);
  }, [remainingPlayers, roundData, config.key, setRoundData, saveRoundToDrive]);

  const resetDraw = useCallback(async () => {
    if (!confirm(`Reset toàn bộ dữ liệu vòng ${config.label}? Không thể hoàn tác.`)) return;
    const newData: RoundData = { roundKey: config.key, matches: [], drawOrder: [], lastUpdated: new Date().toISOString() };
    setRoundData(newData);
    setLastDrawnPlayer(null);
    await saveRoundToDrive(config.key, newData);
  }, [config.key, config.label, setRoundData, saveRoundToDrive]);

  // Hiện thông báo nếu chưa đủ nguồn players
  const sourceSummary = config.sources.map((s) => {
    const label = ROUND_CONFIGS.find((c) => c.key === s.from)?.label ?? s.from;
    return `${label} (${s.side === "winners" ? "thắng" : "thua"})`;
  }).join(" + ");

  return (
    <div>
      {/* Thông tin nguồn players */}
      <div className="mb-4 px-4 py-2.5 bg-gray-800/60 rounded-none border border-gray-700/50 text-sm text-gray-300 text-center">
        Nguồn: <span className="text-yellow-300 font-medium">{sourceSummary || "Tất cả players"}</span>
        {" — "}
        <span className="text-white font-bold">{eligiblePlayers.length}</span> người eligible
        {eligiblePlayers.length === 0 && config.sources.length > 0 && (
          <span className="ml-2 text-red-400 text-xs">(Vòng trước chưa có kết quả)</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-none p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              Drawing Slot #{currentSlot + 1}
              <span className="text-sm font-normal text-gray-400 ml-2">
                (Match #{currentMatchNumber} — {isFillingPlayer2 ? "Player 2" : "Player 1"})
              </span>
            </h2>
            <span className="text-gray-300">{remainingPlayers.length} remaining</span>
          </div>

          {eligiblePlayers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">Chưa có players eligible.</p>
              <p className="text-gray-600 text-sm mt-1">Hoàn thành vòng trước để mở khóa.</p>
            </div>
          ) : remainingPlayers.length > 0 ? (
            <div className="max-w-md mx-auto">
              <WheelCanvas
                items={wheelItems}
                isSpinning={isSpinning}
                onSpinComplete={handleSpinComplete}
                onSpin={() => { if (remainingPlayers.length > 0 && !isSpinning) setIsSpinning(true); }}
                spinButtonClassName="w-20 h-20 text-lg"
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-green-400 text-xl">
                All {drawOrder.length} players drawn!
              </p>
            </div>
          )}

          {lastDrawnPlayer && (
            <div className="mt-4 p-3 bg-yellow-600/20 border border-yellow-600 rounded-none">
              <p className="text-yellow-400 text-center">
                Last Drawn: <span className="font-bold">No.{lastDrawnPlayer.no} {lastDrawnPlayer.name}</span>
              </p>
            </div>
          )}

          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            {remainingPlayers.length > 0 && !autoDrawing && eligiblePlayers.length > 0 && (
              <button
                onClick={() => { if (!isSpinning) setIsSpinning(true); }}
                disabled={isSpinning}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Draw 1
              </button>
            )}
            {remainingPlayers.length > 0 && !autoDrawing && eligiblePlayers.length > 0 && (
              devMode ? (
                <button
                  onClick={devDrawAll}
                  disabled={isSpinning}
                  className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-none text-sm font-mono disabled:opacity-50 border border-red-500/50"
                >
                  [DEV] Draw All Instant ({remainingPlayers.length})
                </button>
              ) : (
                <button
                  onClick={startAutoDraw}
                  disabled={isSpinning}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Auto Draw All ({remainingPlayers.length})
                </button>
              )
            )}
            {autoDrawing && (
              <button
                onClick={stopAutoDraw}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-none text-sm animate-pulse"
              >
                Stop Auto Draw
              </button>
            )}
            {matches.length > 0 && (
              <button
                onClick={resetDraw}
                disabled={isSpinning || autoDrawing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Match list */}
        <div className="bg-gray-800/50 rounded-none p-4 border border-gray-700/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Matches</h2>
            <span className="text-sm text-gray-400 bg-gray-700/50 px-2.5 py-1 rounded-full font-mono">
              {matches.length}
            </span>
          </div>
          <div className="max-h-[600px] overflow-y-auto space-y-1.5 pr-1">
            {matches
              .slice()
              .reverse()
              .map((match) => (
                <div
                  key={match.matchNumber}
                  className={`px-3 py-2.5 rounded-none border transition-colors ${
                    match.player2
                      ? "bg-gray-700/30 border-gray-600/30"
                      : "bg-yellow-900/15 border-yellow-600/30 animate-pulse"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-gray-500 w-5">{match.matchNumber}</span>
                    <div className="flex-1 text-sm">
                      <span className="text-blue-300 font-medium">
                        <span className="text-blue-500/60 text-xs mr-1">{match.player1?.no}.</span>
                        {match.player1?.name || "???"}
                      </span>
                    </div>
                    <span className="text-gray-600 text-[10px] font-bold tracking-wider">VS</span>
                    <div className="flex-1 text-sm text-right">
                      {match.player2 ? (
                        <span className="text-red-300 font-medium">
                          {match.player2.name}
                          <span className="text-red-500/60 text-xs ml-1">.{match.player2.no}</span>
                        </span>
                      ) : (
                        <span className="text-yellow-500/60 text-xs italic">Waiting...</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            {matches.length === 0 && (
              <p className="text-gray-500 text-center py-8 text-sm">
                Spin the wheel to start drawing players
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================== Bracket Tab =====================

interface BracketTabProps {
  roundData: Round256Data | null;
  allRoundData: Record<string, RoundData>;
  onOpenMatch: (ctx: TournamentMatchContext) => void;
  devMode?: boolean;
  onDevSaveResult?: (matchNumberAbsolute: number, result: TournamentSaveResult) => Promise<void>;
}

const BRACKET_SECTIONS = [
  { key: "qualifying" as const, label: "Vòng Loại",    desc: "R256 · R128 · R64" },
  { key: "winners" as const,    label: "Double Elim",  desc: "WB + LB + Finals" },
] as const;

const BracketTab = ({ roundData, allRoundData, onOpenMatch, devMode, onDevSaveResult }: BracketTabProps) => {
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "completed">("all");
  const [bracketSection, setBracketSection] = useState<"qualifying" | "winners">("qualifying");
  // Search
  const [searchRound, setSearchRound] = useState("all");
  const [searchBranch, setSearchBranch] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("playerName");
  const [searchOpen, setSearchOpen] = useState(false);
  // DevMode: quick result panel
  const [devPanel, setDevPanel] = useState<{ match: MatchData & { displayLabel?: string }; matchNumberAbsolute: number } | null>(null);
  const [devScore, setDevScore] = useState("");

  // Merge tất cả matches từ R256 + allRoundData, offset matchNumber theo matchStart của từng round
  const allMergedMatches = useMemo(() => {
    const result: MatchData[] = [];
    // R256: matchNumber đã đúng (1-128), hiển thị "R256 #1"
    if (roundData) {
      for (const m of roundData.matches)
        result.push({ ...m, displayLabel: `R256 #${m.matchNumber}` });
    }
    // Các round sau: offset matchNumber để BracketTreeView đặt đúng vị trí
    // displayLabel hiển thị local number + tên round
    for (const cfg of ROUND_CONFIGS) {
      if (cfg.key === "r256") continue;
      const rd = allRoundData[cfg.key];
      if (!rd) continue;
      for (const m of rd.matches) {
        result.push({
          ...m,
          matchNumber: (m.matchNumber - 1) + cfg.matchStart,
          displayLabel: `${cfg.label} #${m.matchNumber}`,
        });
      }
    }
    return result;
  }, [roundData, allRoundData]);

  const filteredMatches = useMemo(() => {
    const matches = allMergedMatches.filter((m) => m.player1 && m.player2);
    switch (filterMode) {
      case "pending":
        return matches.filter((m) => !m.winner);
      case "completed":
        return matches.filter((m) => m.winner);
      default:
        return matches;
    }
  }, [allMergedMatches, filterMode]);

  const stats = useMemo(() => {
    const complete = allMergedMatches.filter((m) => m.player1 && m.player2);
    return {
      total: complete.length,
      completed: complete.filter((m) => m.winner).length,
      pending: complete.filter((m) => !m.winner).length,
    };
  }, [allMergedMatches]);

  const searchResults = useMemo(() => {
    const results = searchMatches(allMergedMatches, { round: searchRound, branch: searchBranch, text: searchText, type: searchType });
    return results.length === 0 && !searchText.trim() && searchRound === "all" && searchBranch === "all" ? null : results;
  }, [allMergedMatches, searchText, searchRound, searchBranch, searchType]);

  const highlightMatchNumbers = useMemo(
    () => searchResults ? new Set(searchResults.map((m) => m.matchNumber)) : undefined,
    [searchResults],
  );

  const focusMatchNumber = useMemo(
    () => searchResults && searchResults.length > 0 ? searchResults[0].matchNumber : null,
    [searchResults],
  );

  useEffect(() => {
    if (focusMatchNumber == null) return;
    const rk = getRoundKeyByMatchNumber(focusMatchNumber);
    if (!rk) return;
    const targetSection = ROUND_SECTION[rk] ?? "qualifying";
    if (targetSection !== bracketSection) setBracketSection(targetSection);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMatchNumber]);

  if (!roundData || roundData.matches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-xl">
          No matches yet. Go to Create tab to draw players.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 bg-gray-800/60 rounded-none p-3 border border-gray-700/50">
        <div className="flex gap-5 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-gray-400">Total</span>
            <span className="text-white font-bold text-base">
              {stats.total}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-green-400/80">Done</span>
            <span className="text-green-300 font-bold text-base">
              {stats.completed}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-yellow-400/80">Pending</span>
            <span className="text-yellow-300 font-bold text-base">
              {stats.pending}
            </span>
          </div>
          {stats.total > 0 && (
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-600">
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">
                {Math.round((stats.completed / stats.total) * 100)}%
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-1 bg-gray-900/50 rounded-none p-0.5">
          {(["all", "pending", "completed"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 text-xs rounded-none font-medium transition-all ${
                filterMode === mode
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: grid card layout (hidden trên desktop) */}
      <div className="lg:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1">
          {filteredMatches.map((match) => {
            const p1Won = match.winner?.no === match.player1?.no;
            const p2Won = match.winner?.no === match.player2?.no;
            return (
              <button
                key={match.matchNumber}
                onClick={() => {
                  if (devMode && match.player1 && match.player2) {
                    setDevPanel({ match, matchNumberAbsolute: match.matchNumber });
                    setDevScore("");
                  } else {
                    onOpenMatch({
                      matchNumber: match.matchNumber,
                      player1No: match.player1?.no ?? 0,
                      player2No: match.player2?.no ?? 0,
                      existingWinnerNo: match.winner?.no,
                      existingScore: match.score,
                      existingSpecialEvent: match.specialEvent,
                      existingNote: match.note,
                      displayLabel: match.displayLabel,
                    });
                  }
                }}
                className={`text-left p-3 rounded-none border-2 transition-all hover:scale-[1.02] hover:shadow-lg ${
                  match.winner
                    ? "bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-green-600/40 hover:border-green-400"
                    : devMode
                      ? "bg-gradient-to-br from-gray-800 to-gray-850 border-red-700/50 hover:border-red-400"
                      : "bg-gradient-to-br from-gray-800 to-gray-850 border-gray-600/50 hover:border-purple-400"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-gray-500">
                    {match.displayLabel ?? `#${match.matchNumber}`}
                  </span>
                  <div className="flex gap-1">
                    {match.specialEvent && (
                      <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded-full font-medium">
                        Special
                      </span>
                    )}
                    {match.winner ? (
                      <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-full font-medium">
                        {match.score || "Done"}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded-full font-medium">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div
                    className={`flex items-center justify-between rounded-none px-2.5 py-1.5 transition-colors ${
                      p1Won
                        ? "bg-green-600/20 ring-1 ring-green-500/60"
                        : p2Won
                          ? "bg-gray-700/30 opacity-60"
                          : "bg-gray-700/40"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {p1Won && (
                        <span className="text-green-400 text-xs shrink-0">W</span>
                      )}
                      <span
                        className={`text-sm truncate ${p1Won ? "text-green-200 font-semibold" : "text-white"}`}
                      >
                        {match.player1?.name || "TBD"}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-1">
                      {match.player1?.no || "-"}
                    </span>
                  </div>
                  <div className="text-center text-gray-600 text-[10px] font-bold tracking-wider">
                    VS
                  </div>
                  <div
                    className={`flex items-center justify-between rounded-none px-2.5 py-1.5 transition-colors ${
                      p2Won
                        ? "bg-green-600/20 ring-1 ring-green-500/60"
                        : p1Won
                          ? "bg-gray-700/30 opacity-60"
                          : "bg-gray-700/40"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {p2Won && (
                        <span className="text-green-400 text-xs shrink-0">W</span>
                      )}
                      <span
                        className={`text-sm truncate ${p2Won ? "text-green-200 font-semibold" : "text-white"}`}
                      >
                        {match.player2?.name || "TBD"}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-1">
                      {match.player2?.no || "-"}
                    </span>
                  </div>
                </div>
                {match.specialEvent && (
                  <div className="mt-1.5 text-center text-[10px] text-orange-300/80 truncate italic">
                    {match.specialEvent}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: bracket tree view (hidden trên mobile) */}
      <div className="hidden lg:block">
        {/* Search bar */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen((o) => !o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs border transition-all ${
                searchOpen || searchResults
                  ? "bg-amber-600/20 border-amber-500/50 text-amber-300"
                  : "bg-gray-800/60 border-gray-700/40 text-gray-400 hover:text-white hover:bg-gray-700/60"
              }`}
            >
              <span>🔍</span>
              <span>Tìm kiếm</span>
              {searchResults && (
                <span className="ml-1 bg-amber-500/30 text-amber-300 px-1.5 rounded-full text-[10px] font-bold">
                  {searchResults.length}
                </span>
              )}
            </button>
            {searchResults && (
              <button
                onClick={() => { setSearchText(""); setSearchRound("all"); setSearchBranch("all"); }}
                className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
              >
                Xoá tìm kiếm
              </button>
            )}
            {searchResults && searchResults.length > 0 && (
              <span className="text-[10px] text-amber-400/70">
                Trận đầu: #{searchResults[0].matchNumber}
                {searchResults[0].player1 && searchResults[0].player2
                  ? ` · ${searchResults[0].player1.name} vs ${searchResults[0].player2.name}`
                  : ""}
              </span>
            )}
          </div>
          {searchOpen && (
            <div className="mt-2 p-3 bg-gray-900/80 border border-gray-700/50 rounded-none flex flex-wrap gap-2 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-500 font-medium">Vòng đấu</label>
                <select
                  value={searchRound}
                  onChange={(e) => setSearchRound(e.target.value)}
                  className="bg-gray-800 border border-gray-600/50 text-gray-200 text-xs rounded-none px-2 py-1.5 focus:outline-none focus:border-amber-500/60 min-w-[140px]"
                >
                  {ROUND_SEARCH_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-500 font-medium">Nhánh</label>
                <select
                  value={searchBranch}
                  onChange={(e) => setSearchBranch(e.target.value)}
                  className="bg-gray-800 border border-gray-600/50 text-gray-200 text-xs rounded-none px-2 py-1.5 focus:outline-none focus:border-amber-500/60 min-w-[140px]"
                >
                  {BRANCH_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-500 font-medium">Tìm theo</label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as SearchType)}
                  className="bg-gray-800 border border-gray-600/50 text-gray-200 text-xs rounded-none px-2 py-1.5 focus:outline-none focus:border-amber-500/60 min-w-[140px]"
                >
                  <option value="playerName">Tên player</option>
                  <option value="playerNo">STT player</option>
                  <option value="matchNo">STT trận</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
                <label className="text-[10px] text-gray-500 font-medium">Từ khoá</label>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={
                    searchType === "playerName" ? "Nhập tên player..."
                    : searchType === "playerNo" ? "Nhập STT player..."
                    : "Nhập số trận..."
                  }
                  className="bg-gray-800 border border-gray-600/50 text-gray-200 text-xs rounded-none px-2 py-1.5 focus:outline-none focus:border-amber-500/60 placeholder-gray-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 mb-3">
          {BRACKET_SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setBracketSection(s.key)}
              className={`flex flex-col items-start px-4 py-2 rounded-none text-sm font-medium transition-all border ${
                bracketSection === s.key
                  ? "bg-purple-600/30 border-purple-500/60 text-purple-200 shadow"
                  : "bg-gray-800/60 border-gray-700/40 text-gray-400 hover:text-white hover:bg-gray-700/60"
              }`}
            >
              <span>{s.label}</span>
              <span className="text-[10px] font-normal opacity-60">{s.desc}</span>
            </button>
          ))}
        </div>
        <BracketTreeView
          matches={allMergedMatches}
          filterMode={filterMode}
          section={bracketSection}
          highlightMatchNumbers={highlightMatchNumbers}
          focusMatchNumber={focusMatchNumber}
          onOpenMatch={devMode ? (ctx) => {
            const match = allMergedMatches.find((m) => m.matchNumber === ctx.matchNumber);
            if (match?.player1 && match?.player2) {
              setDevPanel({ match, matchNumberAbsolute: ctx.matchNumber });
              setDevScore("");
            } else {
              onOpenMatch(ctx);
            }
          } : onOpenMatch}
          readOnly={false}
        />
      </div>

      {/* DevMode quick-result panel */}
      {devMode && devPanel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setDevPanel(null)}
        >
          <div
            className="bg-gray-900 border border-red-500/50 rounded-none p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-mono text-red-400 bg-red-500/15 px-2 py-0.5 rounded">DEV</span>
                <span className="ml-2 text-sm text-gray-400 font-mono">{devPanel.match.displayLabel ?? `#${devPanel.matchNumberAbsolute}`}</span>
              </div>
              <button onClick={() => setDevPanel(null)} className="text-gray-500 hover:text-white text-lg">✕</button>
            </div>
            <p className="text-xs text-gray-500 mb-3 text-center">Chọn người thắng</p>
            <div className="flex flex-col gap-2 mb-4">
              {[devPanel.match.player1, devPanel.match.player2].map((p) => {
                if (!p) return null;
                const isWinner = devPanel.match.winner?.no === p.no;
                return (
                  <button
                    key={p.no}
                    onClick={async () => {
                      if (!onDevSaveResult) return;
                      await onDevSaveResult(devPanel.matchNumberAbsolute, { winnerNo: p.no, score: devScore || null, specialEvent: null, note: null });
                      setDevPanel(null);
                    }}
                    className={`w-full px-4 py-3 rounded-none text-left font-semibold transition-all border-2 ${
                      isWinner
                        ? "bg-green-600/30 border-green-500 text-green-300"
                        : "bg-gray-800 border-gray-600 text-white hover:border-red-400 hover:bg-red-900/20"
                    }`}
                  >
                    {isWinner && <span className="text-green-400 mr-2">W</span>}
                    {p.name} <span className="text-gray-500 text-xs font-mono ml-1">#{p.no}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Score (vd: 4-2)"
                value={devScore}
                onChange={(e) => setDevScore(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-none px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-400"
              />
              {devPanel.match.winner && (
                <button
                  onClick={async () => {
                    if (!onDevSaveResult) return;
                    await onDevSaveResult(devPanel.matchNumberAbsolute, { winnerNo: 0, score: null, specialEvent: null, note: null });
                    setDevPanel(null);
                  }}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-none text-xs"
                >
                  Xoá KQ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
