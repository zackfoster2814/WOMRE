import {
  ROUND_256_FILE_ID,
  ROUND_128_FILE_ID,
  ROUND_64W_FILE_ID,
  ROUND_32W_FILE_ID,
  ROUND_16W_FILE_ID,
  ROUND_QFW_FILE_ID,
  ROUND_SFW_FILE_ID,
  ROUND_GFW_FILE_ID,
  ROUND_32L1_FILE_ID,
  ROUND_32L2_FILE_ID,
  ROUND_16L1_FILE_ID,
  ROUND_16L2_FILE_ID,
  ROUND_QFL1_FILE_ID,
  ROUND_QFL2_FILE_ID,
  ROUND_SFL1_FILE_ID,
  ROUND_SFL2_FILE_ID,
  ROUND_GFL1_FILE_ID,
  ROUND_GFL2_FILE_ID,
  ROUND_GF_FILE_ID,
  ROUND_BRONZE_FILE_ID,
} from "./googleDrive";

export interface PlayerRef {
  no: number;
  name: string;
  username: string;
}

export interface MatchData {
  matchNumber: number;
  player1: PlayerRef | null;
  player2: PlayerRef | null;
  winner: PlayerRef | null;
  score: string | null;
  specialEvent: string | null;
  note: string | null;
}

export interface Round256Data {
  totalPlayers: number;
  matches: MatchData[];
  drawOrder: number[];
  lastUpdated: string;
}

export interface RoundData {
  roundKey: string;
  matches: MatchData[];
  drawOrder: number[];
  lastUpdated: string;
}

export interface RoundSource {
  from: string;
  side: "winners" | "losers";
}

export interface RoundConfig {
  key: string;
  label: string;
  fileId: string;
  sources: RoundSource[];
  matchCount: number;
  // Match number tuyệt đối đầu tiên trong bracket
  matchStart: number;
}

// matchStart: số thứ tự tuyệt đối trong bracket (để BracketTreeView đặt đúng vị trí)
// R256: 1-128, R128: 129-192
// WB: r64w=193, r32w=225, r16w=241, qfw=249, sfw=253, gfw=255
// LB: r32l1=256, r32l2=272, r16l1=288, r16l2=296, qfl1=304, qfl2=308, sfl1=312, sfl2=314, gfl1=316, gfl2=317
// GF: gf=318, bronze=320
export const ROUND_CONFIGS: RoundConfig[] = [
  // ── Single Elimination ──────────────────────────────────────────
  {
    key: "r256", label: "R256",
    fileId: ROUND_256_FILE_ID,
    sources: [],
    matchCount: 128, matchStart: 1,
  },
  {
    key: "r128", label: "R128",
    fileId: ROUND_128_FILE_ID,
    sources: [{ from: "r256", side: "winners" }],
    matchCount: 64, matchStart: 129,
  },
  // ── Winners Bracket ─────────────────────────────────────────────
  {
    key: "r64w", label: "R64 WB",
    fileId: ROUND_64W_FILE_ID,
    sources: [{ from: "r128", side: "winners" }],
    matchCount: 32, matchStart: 193,
  },
  {
    key: "r32w", label: "R32 Nhánh Thắng",
    fileId: ROUND_32W_FILE_ID,
    sources: [{ from: "r64w", side: "winners" }],
    matchCount: 16, matchStart: 225,
  },
  {
    key: "r16w", label: "R16 Nhánh Thắng",
    fileId: ROUND_16W_FILE_ID,
    sources: [{ from: "r32w", side: "winners" }],
    matchCount: 8, matchStart: 241,
  },
  {
    key: "qfw", label: "Tứ Kết Nhánh Thắng",
    fileId: ROUND_QFW_FILE_ID,
    sources: [{ from: "r16w", side: "winners" }],
    matchCount: 4, matchStart: 249,
  },
  {
    key: "sfw", label: "Bán Kết Nhánh Thắng",
    fileId: ROUND_SFW_FILE_ID,
    sources: [{ from: "qfw", side: "winners" }],
    matchCount: 2, matchStart: 253,
  },
  {
    key: "gfw", label: "Chung Kết Nhánh Thắng",
    fileId: ROUND_GFW_FILE_ID,
    sources: [{ from: "sfw", side: "winners" }],
    matchCount: 1, matchStart: 255,
  },
  // ── Losers Bracket ──────────────────────────────────────────────
  {
    key: "r32l1", label: "R32 Nhánh Thua 1",
    fileId: ROUND_32L1_FILE_ID,
    sources: [{ from: "r64w", side: "losers" }],
    matchCount: 16, matchStart: 256,
  },
  {
    key: "r32l2", label: "R32 Nhánh Thua 2",
    fileId: ROUND_32L2_FILE_ID,
    sources: [
      { from: "r32w", side: "losers" },
      { from: "r32l1", side: "winners" },
    ],
    matchCount: 16, matchStart: 272,
  },
  {
    key: "r16l1", label: "R16 Nhánh Thua 1",
    fileId: ROUND_16L1_FILE_ID,
    sources: [{ from: "r32l2", side: "winners" }],
    matchCount: 8, matchStart: 288,
  },
  {
    key: "r16l2", label: "R16 Nhánh Thua 2",
    fileId: ROUND_16L2_FILE_ID,
    sources: [
      { from: "r16w", side: "losers" },
      { from: "r16l1", side: "winners" },
    ],
    matchCount: 8, matchStart: 296,
  },
  {
    key: "qfl1", label: "Tứ Kết Nhánh Thua 1",
    fileId: ROUND_QFL1_FILE_ID,
    sources: [{ from: "r16l2", side: "winners" }],
    matchCount: 4, matchStart: 304,
  },
  {
    key: "qfl2", label: "Tứ Kết Nhánh Thua 2",
    fileId: ROUND_QFL2_FILE_ID,
    sources: [
      { from: "qfw", side: "losers" },
      { from: "qfl1", side: "winners" },
    ],
    matchCount: 4, matchStart: 308,
  },
  {
    key: "sfl1", label: "Bán Kết Nhánh Thua 1",
    fileId: ROUND_SFL1_FILE_ID,
    sources: [{ from: "qfl2", side: "winners" }],
    matchCount: 2, matchStart: 312,
  },
  {
    key: "sfl2", label: "Bán Kết Nhánh Thua 2",
    fileId: ROUND_SFL2_FILE_ID,
    sources: [
      { from: "sfw", side: "losers" },
      { from: "sfl1", side: "winners" },
    ],
    matchCount: 2, matchStart: 314,
  },
  {
    key: "gfl1", label: "Chung Kết Nhánh Thua 1",
    fileId: ROUND_GFL1_FILE_ID,
    sources: [{ from: "sfl2", side: "winners" }],
    matchCount: 1, matchStart: 316,
  },
  {
    key: "gfl2", label: "Chung Kết Tổng Nhánh Thua",
    fileId: ROUND_GFL2_FILE_ID,
    sources: [
      { from: "gfw", side: "losers" },
      { from: "gfl1", side: "winners" },
    ],
    matchCount: 1, matchStart: 317,
  },
  // ── Grand Final & Bronze ─────────────────────────────────────────
  {
    key: "gf", label: "Chung Kết Tổng (BO3)",
    fileId: ROUND_GF_FILE_ID,
    sources: [
      { from: "gfw", side: "winners" },
      { from: "gfl2", side: "winners" },
    ],
    matchCount: 2, matchStart: 318,
  },
  {
    key: "bronze", label: "Tranh Hạng 3",
    fileId: ROUND_BRONZE_FILE_ID,
    sources: [
      { from: "gfw", side: "losers" },
      { from: "gfl1", side: "losers" },
    ],
    matchCount: 1, matchStart: 320,
  },
];

/** Load toàn bộ bracket từ Drive, trả về mảng matches đã merge với matchNumber tuyệt đối */
export async function loadAllBracketMatches(
  readDriveFileFn: <T>(fileId: string) => Promise<T>,
): Promise<MatchData[]> {
  const results = await Promise.allSettled(
    ROUND_CONFIGS.map((cfg) =>
      readDriveFileFn<Record<string, unknown>>(cfg.fileId),
    ),
  );

  const allMatches: MatchData[] = [];
  results.forEach((result, i) => {
    const cfg = ROUND_CONFIGS[i];
    if (result.status !== "fulfilled") return;
    const raw = result.value;
    const matches: MatchData[] = Array.isArray(raw.matches) ? (raw.matches as MatchData[]) : [];
    // Đảm bảo matchNumber là tuyệt đối (dùng matchStart làm base nếu match lưu số local 1-based)
    matches.forEach((m) => {
      const absNum =
        m.matchNumber >= cfg.matchStart
          ? m.matchNumber
          : cfg.matchStart + m.matchNumber - 1;
      allMatches.push({ ...m, matchNumber: absNum });
    });
  });

  return allMatches;
}

// ── Search helpers (dùng chung cho PublicBracketPage + PvPTournamentPage) ─────

export const ROUND_SECTION: Record<string, "qualifying" | "winners"> = {
  r256: "qualifying", r128: "qualifying", r64w: "qualifying",
  r32w: "winners", r16w: "winners", qfw: "winners", sfw: "winners", gfw: "winners",
  r32l1: "winners", r32l2: "winners", r16l1: "winners", r16l2: "winners",
  qfl1: "winners", qfl2: "winners", sfl1: "winners", sfl2: "winners",
  gfl1: "winners", gfl2: "winners", gf: "winners", bronze: "winners",
};

export const ROUND_SEARCH_OPTIONS = [
  { value: "all", label: "Tất cả vòng" },
  ...ROUND_CONFIGS.map((c) => ({ value: c.key, label: c.label })),
];

export const BRANCH_OPTIONS = [
  { value: "all",     label: "Tất cả nhánh" },
  { value: "winners", label: "Nhánh Thắng (WB)" },
  { value: "losers",  label: "Nhánh Thua (LB)" },
];

export const WB_KEYS = new Set(["r64w","r32w","r16w","qfw","sfw","gfw","gf","bronze"]);
export const LB_KEYS = new Set(["r32l1","r32l2","r16l1","r16l2","qfl1","qfl2","sfl1","sfl2","gfl1","gfl2"]);

export function getRoundKeyByMatchNumber(matchNumber: number): string | null {
  for (const c of ROUND_CONFIGS) {
    if (matchNumber >= c.matchStart && matchNumber < c.matchStart + c.matchCount) return c.key;
  }
  return null;
}

export type SearchType = "playerName" | "playerNo" | "matchNo";

export function searchMatches(
  matches: MatchData[],
  opts: { round: string; branch: string; text: string; type: SearchType },
): MatchData[] {
  const text = opts.text.trim().toLowerCase();
  if (!text && opts.round === "all" && opts.branch === "all") return [];

  return matches.filter((m) => {
    if (opts.round !== "all") {
      const cfg = ROUND_CONFIGS.find((c) => c.key === opts.round);
      if (!cfg) return false;
      if (m.matchNumber < cfg.matchStart || m.matchNumber >= cfg.matchStart + cfg.matchCount) return false;
    }
    if (opts.branch !== "all") {
      const rk = getRoundKeyByMatchNumber(m.matchNumber);
      if (!rk) return false;
      const isSingleElim = rk === "r256" || rk === "r128";
      if (isSingleElim) return false;
      if (opts.branch === "winners" && !WB_KEYS.has(rk)) return false;
      if (opts.branch === "losers" && !LB_KEYS.has(rk)) return false;
    }
    if (text) {
      if (opts.type === "matchNo") return String(m.matchNumber) === text;
      if (opts.type === "playerNo") {
        const no = parseInt(text);
        return m.player1?.no === no || m.player2?.no === no;
      }
      return (
        m.player1?.name?.toLowerCase().includes(text) ||
        m.player2?.name?.toLowerCase().includes(text) ||
        m.player1?.username?.toLowerCase().includes(text) ||
        m.player2?.username?.toLowerCase().includes(text)
      ) ?? false;
    }
    return true;
  });
}
