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
import { BracketTreeView } from "../components/bracket/BracketTreeView";
import {
  readDriveFile,
  writeDriveFile,
  isDriveConfigured,
} from "../utils/googleDrive";
import {
  ROUND_256_FILE_ID,
  ROUND_128_FILE_ID,
  ROUND_64_FILE_ID,
  ROUND_32W_FILE_ID,
  ROUND_32L_FILE_ID,
  ROUND_16W_FILE_ID,
  ROUND_16L_FILE_ID,
  ROUND_8W_FILE_ID,
  ROUND_8L_FILE_ID,
  ROUND_4W_FILE_ID,
  ROUND_4L_FILE_ID,
} from "../config/googleDrive";

// Initialize effects
let effectsInitialized = false;
function ensureEffectsInitialized() {
  if (!effectsInitialized) {
    initializeEffectData();
    effectsInitialized = true;
  }
}

// ===================== Types =====================

interface PlayerRef {
  no: number;
  name: string;
  username: string;
}

interface MatchData {
  matchNumber: number;
  player1: PlayerRef | null;
  player2: PlayerRef | null;
  winner: PlayerRef | null;
  score: string | null;
  specialEvent: string | null;
  note: string | null;
}

interface Round256Data {
  totalPlayers: number;
  matches: MatchData[];
  drawOrder: number[];
  lastUpdated: string;
}

// Generic round data — dùng chung cho tất cả các vòng sau R256
interface RoundData {
  roundKey: string;
  matches: MatchData[];
  drawOrder: number[];
  lastUpdated: string;
}

// Nguồn players: lấy winners hoặc losers từ vòng nào
type PlayerSource =
  | { from: "r256"; side: "winners" }
  | { from: "r128"; side: "winners" | "losers" }
  | { from: "r64"; side: "winners" | "losers" }
  | { from: "r32w"; side: "winners" | "losers" }
  | { from: "r32l"; side: "winners" }
  | { from: "r16w"; side: "winners" | "losers" }
  | { from: "r16l"; side: "winners" }
  | { from: "r8w"; side: "winners" | "losers" }
  | { from: "r8l"; side: "winners" }
  | { from: "r4w"; side: "winners" | "losers" }
  | { from: "r4l"; side: "winners" };

interface RoundConfig {
  key: string;
  label: string;
  fileId: string;
  // Danh sách nguồn players (có thể mix nhiều nguồn)
  sources: PlayerSource[];
  // Số matches tối đa của vòng này
  matchCount: number;
}

const ROUND_CONFIGS: RoundConfig[] = [
  {
    key: "r256",
    label: "R256",
    fileId: ROUND_256_FILE_ID,
    sources: [], // R256 dùng tất cả players gốc
    matchCount: 128,
  },
  {
    key: "r128",
    label: "R128",
    fileId: ROUND_128_FILE_ID,
    sources: [{ from: "r256", side: "winners" }],
    matchCount: 64,
  },
  {
    key: "r64",
    label: "R64",
    fileId: ROUND_64_FILE_ID,
    sources: [{ from: "r128", side: "winners" }],
    matchCount: 64,
  },
  {
    key: "r32w",
    label: "R32 Nhánh Thắng",
    fileId: ROUND_32W_FILE_ID,
    sources: [{ from: "r64", side: "winners" }],
    matchCount: 16,
  },
  {
    key: "r32l",
    label: "R32 Nhánh Thua",
    fileId: ROUND_32L_FILE_ID,
    // (4) losers R32W + (5) winners R32L-round1 → nhưng R32L là vòng đầu tiên của LB
    // LB-R1: losers R64 (32) + losers R128 (64) = 96 → sai
    // Theo flow: R64 cho 32W + 32L; R32L là: 32 losers R64 + 32 losers R128 đánh nhau
    sources: [
      { from: "r64", side: "losers" },
      { from: "r128", side: "losers" },
    ],
    matchCount: 32,
  },
  {
    key: "r16w",
    label: "R16 Nhánh Thắng",
    fileId: ROUND_16W_FILE_ID,
    sources: [{ from: "r32w", side: "winners" }],
    matchCount: 8,
  },
  {
    key: "r16l",
    label: "R16 Nhánh Thua",
    fileId: ROUND_16L_FILE_ID,
    // (4) losers R32W + (5) winners R32L
    sources: [
      { from: "r32w", side: "losers" },
      { from: "r32l", side: "winners" },
    ],
    matchCount: 16,
  },
  {
    key: "r8w",
    label: "R8 Nhánh Thắng",
    fileId: ROUND_8W_FILE_ID,
    sources: [{ from: "r16w", side: "winners" }],
    matchCount: 4,
  },
  {
    key: "r8l",
    label: "R8 Nhánh Thua",
    fileId: ROUND_8L_FILE_ID,
    sources: [
      { from: "r16w", side: "losers" },
      { from: "r16l", side: "winners" },
    ],
    matchCount: 8,
  },
  {
    key: "r4w",
    label: "R4 Nhánh Thắng",
    fileId: ROUND_4W_FILE_ID,
    sources: [{ from: "r8w", side: "winners" }],
    matchCount: 2,
  },
  {
    key: "r4l",
    label: "R4 Nhánh Thua",
    fileId: ROUND_4L_FILE_ID,
    sources: [
      { from: "r8w", side: "losers" },
      { from: "r8l", side: "winners" },
    ],
    matchCount: 4,
  },
];

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

      // Tìm trong allRoundData
      for (const [key, rd] of Object.entries(allRoundData)) {
        const match = rd.matches.find((m) => m.matchNumber === matchNo);
        if (match) {
          const winnerRef = match.player1?.no === result.winnerNo ? match.player1 : match.player2;
          const newMatches = rd.matches.map((m) =>
            m.matchNumber === matchNo ? { ...m, winner: winnerRef ?? null, score: result.score, specialEvent: result.specialEvent, note: result.note } : m,
          );
          const newRd: RoundData = { ...rd, matches: newMatches, lastUpdated: new Date().toISOString() };
          setAllRoundData((prev) => ({ ...prev, [key]: newRd }));
          setTournamentBattle(null);
          await saveRoundToDrive(key, newRd);
          return;
        }
      }
      setTournamentBattle(null);
    },
    [roundData, allRoundData, tournamentBattle, saveToDrive, saveRoundToDrive],
  );

  const handleNextMatch = useCallback(
    async (result: TournamentSaveResult) => {
      if (!tournamentBattle) return;
      await handleSaveTournamentResult(result);
      const allMatches = [
        ...(roundData?.matches ?? []),
        ...Object.values(allRoundData).flatMap((rd) => rd.matches),
      ];
      const currentMatchNo = tournamentBattle.matchNumber;
      const nextMatch = allMatches.find(
        (m) => m.matchNumber > currentMatchNo && m.player1 && m.player2 && !m.winner,
      );
      if (nextMatch) {
        setTournamentBattle({
          matchNumber: nextMatch.matchNumber,
          player1No: nextMatch.player1!.no,
          player2No: nextMatch.player2!.no,
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

  // Hiển thị màn hình intro video chỉ khi data cần load (showIntro=true) và chưa bỏ qua
  if (showIntro) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
        {/* YouTube iframe full screen */}
        <iframe
          src="https://www.youtube.com/embed/8FrhYIFDTTc?autoplay=1&controls=0&modestbranding=1&rel=0"
          className="w-full h-full absolute inset-0"
          style={{ border: "none" }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
        {/* Overlay */}
        <div className="absolute bottom-10 right-10 z-10">
          {loading ? (
            <div className="text-white/50 text-sm">Đang tải dữ liệu...</div>
          ) : (
            <button
              onClick={() => setShowIntro(false)}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white text-lg rounded-lg backdrop-blur border border-white/30 transition"
            >
              Bỏ qua
            </button>
          )}
        </div>
      </div>
    );
  }

  if (tournamentBattle) {
    return (
      <StatsComparisonMode
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
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === "create" ? "bg-purple-600 text-white shadow-lg" : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            Create
          </button>
          <button
            onClick={() => setActiveTab("bracket")}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === "bracket" ? "bg-purple-600 text-white shadow-lg" : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
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
            {/* Round sub-tabs */}
            <div className="flex gap-1 mb-6 justify-center flex-wrap">
              {ROUND_CONFIGS.map((cfg) => {
                const isActive = createSubTab === cfg.key;
                const rd = cfg.key === "r256" ? roundData : allRoundData[cfg.key];
                const done = rd?.matches.filter((m) => m.winner).length ?? 0;
                const total = rd?.matches.length ?? 0;
                return (
                  <button
                    key={cfg.key}
                    onClick={() => setCreateSubTab(cfg.key)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      isActive ? "bg-purple-600 text-white shadow-md" : "bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    {cfg.label}
                    {total > 0 && (
                      <span className={`ml-1.5 text-xs px-1 py-0.5 rounded ${isActive ? "bg-purple-400/30 text-purple-200" : "bg-gray-700 text-gray-400"}`}>
                        {done}/{total}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* R256: dùng CreateTab cũ */}
            {createSubTab === "r256" && (
              <CreateTab
                players={players}
                roundData={roundData}
                setRoundData={setRoundData}
                saveToDrive={saveToDrive}
              />
            )}

            {/* Các round sau: dùng GenericRoundCreateTab */}
            {createSubTab !== "r256" && activeRoundCfg && (
              <GenericRoundCreateTab
                config={activeRoundCfg}
                eligiblePlayers={getEligiblePlayers(activeRoundCfg)}
                roundData={allRoundData[activeRoundCfg.key] ?? null}
                setRoundData={(data) => setAllRoundData((prev) => ({ ...prev, [activeRoundCfg.key]: data }))}
                saveRoundToDrive={saveRoundToDrive}
              />
            )}
          </>
        )}

        {activeTab === "bracket" && (
          <BracketTab roundData={roundData} onOpenMatch={setTournamentBattle} />
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
}

const CreateTab = ({
  players,
  roundData,
  setRoundData,
  saveToDrive,
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
      <div className="bg-gray-800/50 rounded-lg p-4">
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
          <div className="mt-4 p-3 bg-yellow-600/20 border border-yellow-600 rounded-lg">
            <p className="text-yellow-400 text-center">
              Last Drawn:{" "}
              <span className="font-bold">
                No.{lastDrawnPlayer.id} {lastDrawnPlayer.name}
              </span>
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-center gap-2">
          {remainingPlayers.length > 0 && !autoDrawing && (
            <button
              onClick={startAutoDraw}
              disabled={isSpinning}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Auto Draw All ({remainingPlayers.length})
            </button>
          )}
          {autoDrawing && (
            <button
              onClick={stopAutoDraw}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm animate-pulse"
            >
              Stop Auto Draw
            </button>
          )}
          <button
            onClick={resetDraw}
            disabled={isSpinning || autoDrawing}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
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
                className={`px-3 py-2.5 rounded-lg border transition-colors ${
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

// ===================== Generic Round Create Tab =====================

interface GenericRoundCreateTabProps {
  config: RoundConfig;
  eligiblePlayers: PlayerRef[];
  roundData: RoundData | null;
  setRoundData: (data: RoundData) => void;
  saveRoundToDrive: (key: string, data: RoundData) => Promise<boolean>;
}

const GenericRoundCreateTab = ({
  config,
  eligiblePlayers,
  roundData,
  setRoundData,
  saveRoundToDrive,
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
      <div className="mb-4 px-4 py-2.5 bg-gray-800/60 rounded-lg border border-gray-700/50 text-sm text-gray-300 text-center">
        Nguồn: <span className="text-yellow-300 font-medium">{sourceSummary || "Tất cả players"}</span>
        {" — "}
        <span className="text-white font-bold">{eligiblePlayers.length}</span> người eligible
        {eligiblePlayers.length === 0 && config.sources.length > 0 && (
          <span className="ml-2 text-red-400 text-xs">(Vòng trước chưa có kết quả)</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-lg p-4">
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
            <div className="mt-4 p-3 bg-yellow-600/20 border border-yellow-600 rounded-lg">
              <p className="text-yellow-400 text-center">
                Last Drawn: <span className="font-bold">No.{lastDrawnPlayer.no} {lastDrawnPlayer.name}</span>
              </p>
            </div>
          )}

          <div className="mt-4 flex justify-center gap-2">
            {remainingPlayers.length > 0 && !autoDrawing && eligiblePlayers.length > 0 && (
              <button
                onClick={startAutoDraw}
                disabled={isSpinning}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Auto Draw All ({remainingPlayers.length})
              </button>
            )}
            {autoDrawing && (
              <button
                onClick={stopAutoDraw}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm animate-pulse"
              >
                Stop Auto Draw
              </button>
            )}
            {matches.length > 0 && (
              <button
                onClick={resetDraw}
                disabled={isSpinning || autoDrawing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Match list */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
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
                  className={`px-3 py-2.5 rounded-lg border transition-colors ${
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
  onOpenMatch: (ctx: TournamentMatchContext) => void;
}

const BracketTab = ({ roundData, onOpenMatch }: BracketTabProps) => {
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "completed">(
    "all",
  );

  const filteredMatches = useMemo(() => {
    if (!roundData) return [];
    const matches = roundData.matches.filter((m) => m.player1 && m.player2);
    switch (filterMode) {
      case "pending":
        return matches.filter((m) => !m.winner);
      case "completed":
        return matches.filter((m) => m.winner);
      default:
        return matches;
    }
  }, [roundData, filterMode]);

  const stats = useMemo(() => {
    if (!roundData) return { total: 0, completed: 0, pending: 0 };
    const complete = roundData.matches.filter((m) => m.player1 && m.player2);
    return {
      total: complete.length,
      completed: complete.filter((m) => m.winner).length,
      pending: complete.filter((m) => !m.winner).length,
    };
  }, [roundData]);

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
      <div className="flex items-center justify-between mb-5 bg-gray-800/60 rounded-xl p-3 border border-gray-700/50">
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
        <div className="flex gap-1 bg-gray-900/50 rounded-lg p-0.5">
          {(["all", "pending", "completed"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
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
                onClick={() =>
                  onOpenMatch({
                    matchNumber: match.matchNumber,
                    player1No: match.player1?.no ?? 0,
                    player2No: match.player2?.no ?? 0,
                    existingWinnerNo: match.winner?.no,
                    existingScore: match.score,
                    existingSpecialEvent: match.specialEvent,
                    existingNote: match.note,
                  })
                }
                className={`text-left p-3 rounded-xl border-2 transition-all hover:scale-[1.02] hover:shadow-lg ${
                  match.winner
                    ? "bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-green-600/40 hover:border-green-400"
                    : "bg-gradient-to-br from-gray-800 to-gray-850 border-gray-600/50 hover:border-purple-400"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-gray-500">
                    #{match.matchNumber}
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
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
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
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
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
        <BracketTreeView
          matches={roundData.matches}
          filterMode={filterMode}
          onOpenMatch={onOpenMatch}
          readOnly={false}
        />
      </div>

    </div>
  );
};
