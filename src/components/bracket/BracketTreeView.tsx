/**
 * BracketTreeView
 * Tournament bracket layout cho PC/desktop (≥lg breakpoint).
 *
 * Cấu trúc:
 * - R256 (match 1-128): Single elim, 128 trận, hiển thị dạng cột đơn, KHÔNG connector
 * - R128 (match 129-192): Single elim, 64 trận, cột đơn, KHÔNG connector
 * - R64 trở đi: Double Elimination bắt đầu
 *   + Winners Bracket (WB): R64 (32) → R32 (16) → R16 (8) → WB-QF (4) → WB-SF (2) → WB-Final (1)
 *   + Losers Bracket (LB): song song bên dưới WB
 *   + Grand Final (1 match)
 *
 * Lưu ý: Các round không liên kết logic (thứ tự cặp không quyết định đối thủ vòng sau),
 * nên KHÔNG có connector giữa R256 → R128, giữa R128 → R64.
 * Connector CHỈ có trong WB tree và LB tree (từ R64 trở đi).
 *
 * Match numbering (dựa theo data thực tế):
 * - R256: match 1-128     (128 matches)
 * - R128: match 129-192   (64 matches)
 * - WB R64: match 193-224 (32 matches)
 * - WB R32: match 225-240 (16 matches)
 * - WB R16: match 241-248 (8 matches)
 * - WB QF:  match 249-252 (4 matches)
 * - WB SF:  match 253-254 (2 matches)
 * - WB Final: match 255   (1 match)
 * - LB-R32-1: match 256-287 (32) | LB-R32-2: match 288-303 (16)
 * - LB-R16-1: match 304-311 (8)  | LB-R16-2: match 312-315 (4)
 * - LB-QF-1:  match 316-319 (4)  | LB-QF-2:  match 320-321 (2)
 * - LB-SF-1:  match 322-323 (2)  | LB-SF-2:  match 324 (1)
 * - LB-GF-1:  match 325 (1)      | LB-GF-2:  match 326 (1)
 * - Grand Final BO3: match 327-328 (2) | Bronze: match 329 (1)
 *
 * Nhưng vì data hiện tại chỉ có match 1-128 (R256) và chưa xác định numbering cho các round sau,
 * ta dùng numbering tổng quát và hiển thị TBD cho các slot chưa có data.
 */

import { useMemo, useRef, useEffect, useCallback, useState } from "react";
import { BracketBackground3D } from "./BracketBackground3D";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  // Label hiển thị thay vì matchNumber tuyệt đối (vd: "R128 #1")
  displayLabel?: string;
}

interface OpenMatchCtx {
  matchNumber: number;
  player1No: number;
  player2No: number;
  existingWinnerNo?: number;
  existingScore?: string | null;
  existingSpecialEvent?: string | null;
  existingNote?: string | null;
  displayLabel?: string;
}

export type BracketSection = "qualifying" | "winners";

export interface BracketTreeViewProps {
  matches: MatchData[];
  filterMode: "all" | "pending" | "completed";
  section: BracketSection;
  onOpenMatch?: (ctx: OpenMatchCtx) => void;
  onSelectMatch?: (match: MatchData) => void;
  readOnly?: boolean;
  /** Tập matchNumber cần highlight (amber ring) */
  highlightMatchNumbers?: Set<number>;
  /** matchNumber cần pan đến giữa khung */
  focusMatchNumber?: number | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CARD_H = 110; // px — compact enough cho bracket
const CARD_W = 185; // px
const CARD_W_COLLAPSED = 28; // px - width khi round bị thu gọn
const COL_GAP_SINGLE = 14; // px gap giữa cột đơn (R256, R128)
const COL_GAP_TREE = 44; // px gap giữa cột trong DE tree
const LABEL_H = 26; // px
const PAD = 12; // px padding ngoài
const SECTION_GAP = 32; // px

// ── Grid layout cho DE section ────────────────────────────────────────────────
// Pitch tối thiểu = CARD_H + gap. Với 32 matches: GRID_H = 32 × MIN_PITCH
const MIN_PITCH = CARD_H + 6; // 86px — đủ để không chồng
const WB_GRID_H = 32 * MIN_PITCH; // 2752px — WB col0 có 32 matches
const LB_GRID_H = 16 * MIN_PITCH; // 1376px — LB col0 có 16 matches (max count)
const SLOT_H = MIN_PITCH; // dùng cho single-elim column spacing

// ── Single Elim Rounds (không connector giữa các round) ───────────────────────

const SINGLE_ROUNDS = [
  { label: "R256", matchStart: 1, count: 128 },
  { label: "R128", matchStart: 129, count: 64 },
];

// ── Double Elim Rounds ────────────────────────────────────────────────────────

// Winners Bracket rounds (từ R64 trở đi)
const WB_ROUNDS = [
  { label: "WB-R64", matchStart: 193, count: 32 },
  { label: "WB-R32", matchStart: 225, count: 16 },
  { label: "WB-R16", matchStart: 241, count: 8 },
  { label: "WB-QF", matchStart: 249, count: 4 },
  { label: "WB-SF", matchStart: 253, count: 2 },
  { label: "WB-Final", matchStart: 255, count: 1 },
];

// Losers Bracket rounds (10 rounds)
// counts: [16,16,8,8,4,4,2,2,1,1]
const LB_ROUNDS = [
  { label: "LB-R32-1", matchStart: 256, count: 16 }, // losers từ WB-R64 (256-271)
  { label: "LB-R32-2", matchStart: 272, count: 16 }, // WB-R32 losers + LB-R32-1 winners (272-287)
  { label: "LB-R16-1", matchStart: 288, count: 8 }, // LB-R32-2 winners (288-295)
  { label: "LB-R16-2", matchStart: 296, count: 8 }, // WB-R16 losers + LB-R16-1 winners (296-303)
  { label: "LB-QF-1", matchStart: 304, count: 4 }, // LB-R16-2 winners (304-307)
  { label: "LB-QF-2", matchStart: 308, count: 4 }, // WB-QF losers + LB-QF-1 winners (308-311)
  { label: "LB-SF-1", matchStart: 312, count: 2 }, // LB-QF-2 winners (312-313)
  { label: "LB-SF-2", matchStart: 314, count: 2 }, // WB-SF losers + LB-SF-1 winners (314-315)
  { label: "LB-GF-1", matchStart: 316, count: 1 }, // LB-SF-2 winners (316)
  { label: "LB-GF-2", matchStart: 317, count: 1 }, // WB-Final losers + LB-GF-1 winners (317)
];

// Grand Final (BO3 max 2 matches) + Bronze
const GF_ROUNDS = [
  { label: "GF", matchStart: 318, count: 2 }, // BO3: WB winner vs LB winner (318-319)
  { label: "Bronze", matchStart: 320, count: 1 }, // Tranh hạng 3 (320)
];

// ── Layout math ───────────────────────────────────────────────────────────────
// WB: col0=32matches, col1=16, col2=8, col3=4, col4=2, col5=1
// Pitch của WB col i = WB_GRID_H / count_i

function getWBPitch(colIndex: number): number {
  return WB_GRID_H / WB_ROUNDS[colIndex].count;
}

function getWBCenterY(colIndex: number, posInRound: number): number {
  const pitch = getWBPitch(colIndex);
  return pitch / 2 + posInRound * pitch;
}

function getWBTopY(colIndex: number, posInRound: number): number {
  return getWBCenterY(colIndex, posInRound) - CARD_H / 2;
}

// LB: counts = [16,16,8,8,4,4,2,2,1,1]
const LB_COUNTS = [16, 16, 8, 8, 4, 4, 2, 2, 1, 1];

function getLBPitch(colIndex: number): number {
  return LB_GRID_H / LB_COUNTS[colIndex];
}

function getLBCenterY(colIndex: number, posInRound: number): number {
  const pitch = getLBPitch(colIndex);
  return pitch / 2 + posInRound * pitch;
}

function getLBTopY(colIndex: number, posInRound: number): number {
  return getLBCenterY(colIndex, posInRound) - CARD_H / 2;
}

// ── Match Card ────────────────────────────────────────────────────────────────

interface MatchCardProps {
  match: MatchData;
  topPx: number;
  leftPx: number;
  dimmed: boolean;
  highlighted?: boolean;
  onOpen: (match: MatchData) => void;
}

function MatchCard({ match, topPx, leftPx, dimmed, highlighted, onOpen }: MatchCardProps) {
  const p1Won = match.winner?.no === match.player1?.no;
  const p2Won = match.winner?.no === match.player2?.no;
  const hasWinner = !!match.winner;
  const hasSpecial = !!match.specialEvent;
  const canClick = !dimmed && (match.player1 != null || match.player2 != null);

  return (
    <button
      onClick={() => canClick && onOpen(match)}
      disabled={!canClick}
      style={{
        position: "absolute",
        top: topPx,
        left: leftPx,
        width: CARD_W,
        height: CARD_H,
        zIndex: highlighted ? 6 : 2,
        opacity: dimmed ? 0.15 : 1,
        transition: "opacity 0.2s, transform 0.15s, box-shadow 0.15s",
        cursor: canClick ? "pointer" : "default",
        boxShadow: highlighted ? "0 0 0 2px #f59e0b, 0 0 18px 4px rgba(245,158,11,0.45)" : undefined,
      }}
      className={`
        text-left rounded-none border
        ${highlighted ? "border-amber-400" : hasWinner ? "bg-gray-800/95 border-green-600/60" : "bg-gray-800/95 border-gray-600/50"}
        ${!highlighted && canClick && !dimmed
            ? hasWinner
              ? "hover:border-green-400 hover:shadow-[0_0_12px_2px_rgba(74,222,128,0.25)] hover:scale-[1.03]"
              : "hover:border-purple-400 hover:shadow-[0_0_12px_2px_rgba(139,92,246,0.25)] hover:scale-[1.03]"
            : ""
        }
        backdrop-blur-sm overflow-hidden
      `}
    >
      <div className="flex items-center justify-between px-2 pt-1.5 pb-1">
        <span className="text-[9px] font-mono text-gray-500">
          {match.displayLabel ?? `#${match.matchNumber}`}
        </span>
        <div className="flex gap-1">
          {hasSpecial && (
            <span className="text-[8px] bg-orange-500/20 text-orange-300 px-1 rounded-full">
              ★
            </span>
          )}
          {hasWinner ? (
            <span className="text-[8px] bg-green-500/20 text-green-300 px-1.5 rounded-full font-medium">
              {match.score || "Done"}
            </span>
          ) : (
            <span className="text-[8px] bg-yellow-500/15 text-yellow-400/80 px-1.5 rounded-full">
              Pending
            </span>
          )}
        </div>
      </div>
      <div
        className={`mx-1.5 mb-0.5 px-2 py-1.5 rounded flex items-center gap-1.5 ${
          p1Won
            ? "bg-green-600/25 ring-1 ring-green-500/40"
            : p2Won
              ? "bg-gray-700/30 opacity-50"
              : "bg-gray-700/40"
        }`}
      >
        {p1Won && (
          <span className="text-green-400 text-[9px] font-bold shrink-0">
            W
          </span>
        )}
        <span
          className={`text-[12px] truncate leading-tight ${p1Won ? "text-green-200 font-semibold" : "text-gray-200"}`}
        >
          {match.player1?.name || "TBD"}
        </span>
      </div>
      <div className="text-center text-gray-600 text-[8px] font-bold tracking-widest py-0.5">
        VS
      </div>
      <div
        className={`mx-1.5 mt-0.5 px-2 py-1.5 rounded flex items-center gap-1.5 ${
          p2Won
            ? "bg-green-600/25 ring-1 ring-green-500/40"
            : p1Won
              ? "bg-gray-700/30 opacity-50"
              : "bg-gray-700/40"
        }`}
      >
        {p2Won && (
          <span className="text-green-400 text-[9px] font-bold shrink-0">
            W
          </span>
        )}
        <span
          className={`text-[12px] truncate leading-tight ${p2Won ? "text-green-200 font-semibold" : "text-gray-200"}`}
        >
          {match.player2?.name || "TBD"}
        </span>
      </div>
    </button>
  );
}

// ── TBD Slot ──────────────────────────────────────────────────────────────────

function TBDSlot({
  topPx,
  leftPx,
  matchNumber,
}: {
  topPx: number;
  leftPx: number;
  matchNumber: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: topPx,
        left: leftPx,
        width: CARD_W,
        height: CARD_H,
        zIndex: 2,
      }}
      className="rounded-none border border-gray-700/25 bg-gray-900/35 flex flex-col items-center justify-center gap-1"
    >
      <span className="text-[9px] font-mono text-gray-700">#{matchNumber}</span>
      <span className="text-[9px] text-gray-700">TBD</span>
    </div>
  );
}

// ── Vertical Round Divider ────────────────────────────────────────────────────

function RoundDivider({ leftX, height }: { leftX: number; height: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: leftX - 1,
        top: 0,
        width: 1,
        height,
        zIndex: 1,
        background:
          "linear-gradient(to bottom, rgba(124,58,237,0.0), rgba(124,58,237,0.35) 15%, rgba(124,58,237,0.35) 85%, rgba(124,58,237,0.0))",
        pointerEvents: "none",
      }}
    />
  );
}


// ── Main BracketTreeView ──────────────────────────────────────────────────────

// ── Tính tọa độ (leftPx, topPx) của một matchNumber trong canvas ─────────────
// Trả về null nếu matchNumber không thuộc section hiện tại
function getMatchCoords(
  matchNumber: number,
  section: BracketSection,
): { x: number; y: number } | null {
  // Qualifying: SINGLE_ROUNDS = [R256, R128] + WB_ROUNDS[0] = R64
  const QUALIFYING_ROUNDS = [SINGLE_ROUNDS[0], SINGLE_ROUNDS[1], WB_ROUNDS[0]];

  if (section === "qualifying") {
    let curLeft = PAD;
    for (let ri = 0; ri < QUALIFYING_ROUNDS.length; ri++) {
      const r = QUALIFYING_ROUNDS[ri];
      const colW = CARD_W;
      if (matchNumber >= r.matchStart && matchNumber < r.matchStart + r.count) {
        const i = matchNumber - r.matchStart;
        return { x: curLeft, y: PAD + i * SLOT_H };
      }
      curLeft += colW + COL_GAP_SINGLE;
    }
    return null;
  }

  // Winners section: WB + LB + GF
  const STEP_W = CARD_W * 2 + COL_GAP_TREE * 3;
  const wbColLefts = WB_ROUNDS.map((_, s) => PAD + s * STEP_W);
  const lbColLefts = LB_ROUNDS.map((_, li) => {
    const s = Math.floor(li / 2);
    const isL2 = li % 2 === 1;
    return wbColLefts[s] + (isL2 ? CARD_W + COL_GAP_TREE : 0);
  });
  const WB_GAP = 40;
  const wbOffsetY = PAD;
  const lbOffsetY = PAD + WB_GRID_H + WB_GAP;

  for (let ci = 0; ci < WB_ROUNDS.length; ci++) {
    const r = WB_ROUNDS[ci];
    if (matchNumber >= r.matchStart && matchNumber < r.matchStart + r.count) {
      const i = matchNumber - r.matchStart;
      return { x: wbColLefts[ci], y: wbOffsetY + getWBTopY(ci, i) };
    }
  }
  for (let ci = 0; ci < LB_ROUNDS.length; ci++) {
    const r = LB_ROUNDS[ci];
    if (matchNumber >= r.matchStart && matchNumber < r.matchStart + r.count) {
      const i = matchNumber - r.matchStart;
      return { x: lbColLefts[ci], y: lbOffsetY + getLBTopY(ci, i) };
    }
  }
  // GF + Bronze
  const gfLeft = PAD + WB_ROUNDS.length * STEP_W + SECTION_GAP;
  const totalDEH = WB_GRID_H + WB_GAP + LB_GRID_H;
  const gfCenterY = PAD + totalDEH / 2;
  const gfRound = GF_ROUNDS[0];
  if (matchNumber >= gfRound.matchStart && matchNumber < gfRound.matchStart + gfRound.count) {
    const i = matchNumber - gfRound.matchStart;
    return { x: gfLeft, y: gfCenterY - (gfRound.count * (CARD_H + 12)) / 2 + i * (CARD_H + 12) };
  }
  const bronzeRound = GF_ROUNDS[1];
  if (matchNumber === bronzeRound.matchStart) {
    const bronzeLeft = gfLeft + CARD_W + SECTION_GAP;
    return { x: bronzeLeft, y: gfCenterY - CARD_H / 2 };
  }
  return null;
}

export function BracketTreeView({
  matches,
  filterMode,
  section,
  onOpenMatch,
  onSelectMatch,
  readOnly = false,
  highlightMatchNumbers,
  focusMatchNumber,
}: BracketTreeViewProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);

  // Pan + Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  // Reset pan/zoom khi đổi section
  const prevSection = useRef(section);
  if (prevSection.current !== section) {
    prevSection.current = section;
    // reset — dùng ref thay vì setState để tránh re-render thừa
  }

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Pinch-to-zoom or Ctrl+scroll → zoom
      const delta = -e.deltaY * 0.001;
      setZoom((z) => Math.min(3, Math.max(0.2, z + delta * z)));
    } else {
      // Scroll bình thường → pan
      setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      // Chỉ pan khi click vào background, không phải button/card
      if ((e.target as HTMLElement).closest("button")) return;
      isPanning.current = true;
      panStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
      e.preventDefault();
    },
    [pan],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.mx;
    const dy = e.clientY - panStart.current.my;
    setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Sync header scroll với pan.x
  useEffect(() => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = -pan.x / zoom;
    }
  }, [pan.x, zoom]);

  // Reset khi section đổi
  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Pan đến focusMatchNumber khi thay đổi
  useEffect(() => {
    if (focusMatchNumber == null) return;
    const coords = getMatchCoords(focusMatchNumber, section);
    if (!coords) return;
    const container = canvasContainerRef.current;
    if (!container) return;
    const vw = container.clientWidth;
    const vh = container.clientHeight;
    // Pan sao cho card center xuất hiện giữa khung
    const cardCenterX = coords.x + CARD_W / 2;
    const cardCenterY = coords.y + CARD_H / 2;
    setPan({
      x: vw / 2 - cardCenterX * zoom,
      y: vh / 2 - cardCenterY * zoom,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMatchNumber, section]);

  // R256 mặc định collapsed vì đã xong
  const [collapsedRounds, setCollapsedRounds] = useState<Set<string>>(
    () => new Set([]),
  );

  const toggleRound = useCallback((label: string) => {
    setCollapsedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const matchMap = useMemo(() => {
    const m = new Map<number, MatchData>();
    matches.forEach((match) => m.set(match.matchNumber, match));
    return m;
  }, [matches]);

  const handleOpen = (match: MatchData) => {
    if (readOnly) {
      onSelectMatch?.(match);
    } else {
      onOpenMatch?.({
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
  };

  // ── Layout theo section ───────────────────────────────────────────────────────

  interface HeaderCol {
    label: string;
    leftX: number;
    colW: number;
    toggleable?: boolean;
  }

  // Helper: render single-elim column list (qualifying hoặc riêng lẻ)
  const buildSingleSection = (
    rounds: typeof SINGLE_ROUNDS,
    maxRows: number, // số rows của cột cao nhất (để tính height)
  ) => {
    let curLeft = PAD;
    const colLefts: number[] = [];
    const colWidths: number[] = [];
    for (let ri = 0; ri < rounds.length; ri++) {
      colLefts.push(curLeft);
      const collapsed = collapsedRounds.has(rounds[ri].label);
      const colW = collapsed ? CARD_W_COLLAPSED : CARD_W;
      colWidths.push(colW);
      curLeft += colW + COL_GAP_SINGLE;
    }
    const canvasW = curLeft - COL_GAP_SINGLE + PAD;
    // Canvas height: tính theo match có data thực
    let maxY = PAD + CARD_H;
    for (let ri = 0; ri < rounds.length; ri++) {
      if (collapsedRounds.has(rounds[ri].label)) continue;
      const r = rounds[ri];
      for (let i = r.count - 1; i >= 0; i--) {
        const m = matchMap.get(r.matchStart + i);
        if (m && (m.player1 || m.player2)) {
          maxY = Math.max(maxY, PAD + i * SLOT_H + CARD_H);
          break;
        }
      }
    }
    const canvasH = Math.max(maxY, PAD + maxRows * SLOT_H) + PAD;
    const nodes: React.ReactNode[] = [];
    const headers: HeaderCol[] = [];

    for (let ri = 0; ri < rounds.length; ri++) {
      const r = rounds[ri];
      const leftX = colLefts[ri];
      const colW = colWidths[ri];
      const isCollapsed = collapsedRounds.has(r.label);
      headers.push({ label: r.label, leftX, colW, toggleable: true });
      if (ri > 0)
        nodes.push(
          <RoundDivider
            key={`sdiv-${ri}`}
            leftX={leftX - COL_GAP_SINGLE / 2}
            height={canvasH}
          />,
        );
      if (isCollapsed) {
        nodes.push(
          <div
            key={`col-${r.label}`}
            style={{
              position: "absolute",
              left: leftX,
              top: PAD,
              width: colW,
              height: canvasH - PAD * 2,
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(124,58,237,0.04)",
              borderRadius: 8,
              border: "1px solid rgba(124,58,237,0.12)",
              cursor: "pointer",
            }}
            onClick={() => toggleRound(r.label)}
            title={`Mở ${r.label}`}
          >
            <span
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                fontSize: 9,
                color: "rgba(167,139,250,0.5)",
                fontWeight: 700,
                letterSpacing: "0.12em",
                userSelect: "none",
              }}
            >
              {r.label} — {r.count} trận
            </span>
          </div>,
        );
        continue;
      }
      for (let i = 0; i < r.count; i++) {
        const matchNumber = r.matchStart + i;
        const match = matchMap.get(matchNumber);
        const topY = PAD + i * SLOT_H;
        const dimmed = match
          ? filterMode === "completed"
            ? !match.winner
            : filterMode === "pending"
              ? !!match.winner
              : false
          : false;
        if (match && (match.player1 || match.player2)) {
          nodes.push(
            <MatchCard
              key={`m-${matchNumber}`}
              match={match}
              topPx={topY}
              leftPx={leftX}
              dimmed={dimmed}
              highlighted={highlightMatchNumbers?.has(matchNumber)}
              onOpen={handleOpen}
            />,
          );
        } else {
          nodes.push(
            <TBDSlot
              key={`tbd-${matchNumber}`}
              topPx={topY}
              leftPx={leftX}
              matchNumber={matchNumber}
            />,
          );
        }
      }
    }
    return { nodes, headers, canvasW, canvasH };
  };

  // ── Tính canvas theo section ───────────────────────────────────────────────────

  // Qualifying: R256 + R128 + R64WB (single elim style, 3 cột, không connector)
  const QUALIFYING_ROUNDS = [
    SINGLE_ROUNDS[0], // R256: matchStart=1, count=128
    SINGLE_ROUNDS[1], // R128: matchStart=129, count=64
    WB_ROUNDS[0], // R64 WB: matchStart=193, count=32
  ];

  const sectionData = (() => {
    if (section === "qualifying") {
      return buildSingleSection(QUALIFYING_ROUNDS, 128);
    }

    // ── "winners" = Double Elim: WB trên, LB dưới, cột căn theo step ────────────
    // Mỗi step s (0..4): WB[s] và LB[s*2] (L1) cùng leftX, LB[s*2+1] (L2) kế tiếp
    // STEP_W = CARD_W (WB) + COL_GAP_TREE*2 (gap WB→LB pair) — LB pair nằm trong step
    // Trong 1 step: WB leftX = stepX, LB-L1 leftX = stepX, LB-L2 leftX = stepX + CARD_W + COL_GAP_TREE
    const STEP_W = CARD_W * 2 + COL_GAP_TREE * 3; // width của 1 step (WB + gap + L1 + gap + L2)

    // Tính leftX cho từng cột WB (6 cột, step 0..5)
    // Step 0..4: có cả WB và LB pair. Step 5 (WB-Final): chỉ có WB
    const wbColLefts: number[] = WB_ROUNDS.map((_, s) => PAD + s * STEP_W);

    // Tính leftX cho từng cột LB (10 cột = 5 pairs, step 0..4)
    // LB pair s: L1 = wbColLefts[s], L2 = wbColLefts[s] + CARD_W + COL_GAP_TREE
    const lbColLefts: number[] = LB_ROUNDS.map((_, li) => {
      const s = Math.floor(li / 2);
      const isL2 = li % 2 === 1;
      return wbColLefts[s] + (isL2 ? CARD_W + COL_GAP_TREE : 0);
    });

    const WB_GAP = 40;
    const wbOffsetY = PAD;
    const lbOffsetY = PAD + WB_GRID_H + WB_GAP;
    const totalDEH = WB_GRID_H + WB_GAP + LB_GRID_H;

    const isDimmed = (match: MatchData) => {
      if (filterMode === "completed") return !match.winner;
      if (filterMode === "pending") return !!match.winner;
      return false;
    };

    const nodes: React.ReactNode[] = [];
    const headers: HeaderCol[] = [];

    // Render WB cards
    WB_ROUNDS.forEach((round, ci) => {
      const leftX = wbColLefts[ci];
      headers.push({ label: round.label, leftX, colW: CARD_W, toggleable: true });
      for (let i = 0; i < round.count; i++) {
        const matchNumber = round.matchStart + i;
        const match = matchMap.get(matchNumber);
        const topY = wbOffsetY + getWBTopY(ci, i);
        const dimmed = match ? isDimmed(match) : false;
        if (match && (match.player1 || match.player2)) {
          nodes.push(<MatchCard key={`wbm-${matchNumber}`} match={match} topPx={topY} leftPx={leftX} dimmed={dimmed} highlighted={highlightMatchNumbers?.has(matchNumber)} onOpen={handleOpen} />);
        } else {
          nodes.push(<TBDSlot key={`wbtbd-${matchNumber}`} topPx={topY} leftPx={leftX} matchNumber={matchNumber} />);
        }
      }
    });

    // Render LB cards
    LB_ROUNDS.forEach((round, ci) => {
      const leftX = lbColLefts[ci];
      headers.push({ label: round.label, leftX, colW: CARD_W, toggleable: true });
      for (let i = 0; i < round.count; i++) {
        const matchNumber = round.matchStart + i;
        const match = matchMap.get(matchNumber);
        const topY = lbOffsetY + getLBTopY(ci, i);
        const dimmed = match ? isDimmed(match) : false;
        if (match && (match.player1 || match.player2)) {
          nodes.push(<MatchCard key={`lbm-${matchNumber}`} match={match} topPx={topY} leftPx={leftX} dimmed={dimmed} highlighted={highlightMatchNumbers?.has(matchNumber)} onOpen={handleOpen} />);
        } else {
          nodes.push(<TBDSlot key={`lbtbd-${matchNumber}`} topPx={topY} leftPx={leftX} matchNumber={matchNumber} />);
        }
      }
    });

    // WB/LB separator line
    const deRight = wbColLefts[wbColLefts.length - 1] + CARD_W;
    const sepY = wbOffsetY + WB_GRID_H + WB_GAP / 2;
    nodes.push(<div key="sep-wblb" style={{ position: "absolute", left: PAD, top: sepY, width: deRight - PAD, height: 1, background: "linear-gradient(to right, transparent, rgba(124,58,237,0.25) 10%, rgba(124,58,237,0.25) 90%, transparent)", zIndex: 1, pointerEvents: "none" }} />);

    // WB / LB labels
    nodes.push(<div key="lbl-wb" style={{ position: "absolute", left: PAD, top: wbOffsetY, zIndex: 4, pointerEvents: "none" }}><span style={{ fontSize: 9, color: "rgba(52,211,153,0.6)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>WB</span></div>);
    nodes.push(<div key="lbl-lb" style={{ position: "absolute", left: PAD, top: lbOffsetY, zIndex: 4, pointerEvents: "none" }}><span style={{ fontSize: 9, color: "rgba(251,146,60,0.6)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>LB</span></div>);

    // GF + Bronze — bên phải step cuối
    const gfLeft = PAD + WB_ROUNDS.length * STEP_W + SECTION_GAP;
    const gfCenterY = PAD + totalDEH / 2;
    const gfRound = GF_ROUNDS[0];
    const bronzeRound = GF_ROUNDS[1];

    nodes.push(<div key="sep-gf" style={{ position: "absolute", left: gfLeft - SECTION_GAP / 2, top: 0, width: 1, height: PAD + totalDEH + PAD, background: "linear-gradient(to bottom, transparent, rgba(251,191,36,0.35) 20%, rgba(251,191,36,0.35) 80%, transparent)", zIndex: 1, pointerEvents: "none" }} />);

    for (let i = 0; i < gfRound.count; i++) {
      const matchNumber = gfRound.matchStart + i;
      const match = matchMap.get(matchNumber);
      const topY = gfCenterY - (gfRound.count * (CARD_H + 12)) / 2 + i * (CARD_H + 12);
      const dimmed = match ? isDimmed(match) : false;
      if (match && (match.player1 || match.player2)) {
        nodes.push(<MatchCard key={`gf-${i}`} match={match} topPx={topY} leftPx={gfLeft} dimmed={dimmed} highlighted={highlightMatchNumbers?.has(matchNumber)} onOpen={handleOpen} />);
      } else {
        nodes.push(<TBDSlot key={`gf-tbd-${i}`} topPx={topY} leftPx={gfLeft} matchNumber={matchNumber} />);
      }
    }

    const bronzeLeft = gfLeft + CARD_W + SECTION_GAP;
    const bronzeTopY = gfCenterY - CARD_H / 2;
    const bronzeMatch = matchMap.get(bronzeRound.matchStart);
    const bronzeDimmed = bronzeMatch ? isDimmed(bronzeMatch) : false;
    nodes.push(<div key="sep-bronze" style={{ position: "absolute", left: bronzeLeft - SECTION_GAP / 2, top: 0, width: 1, height: PAD + totalDEH + PAD, background: "linear-gradient(to bottom, transparent, rgba(180,83,9,0.3) 20%, rgba(180,83,9,0.3) 80%, transparent)", zIndex: 1, pointerEvents: "none" }} />);
    if (bronzeMatch && (bronzeMatch.player1 || bronzeMatch.player2)) {
      nodes.push(<MatchCard key="bronze" match={bronzeMatch} topPx={bronzeTopY} leftPx={bronzeLeft} dimmed={bronzeDimmed} highlighted={highlightMatchNumbers?.has(bronzeRound.matchStart)} onOpen={handleOpen} />);
    } else {
      nodes.push(<TBDSlot key="bronze-tbd" topPx={bronzeTopY} leftPx={bronzeLeft} matchNumber={bronzeRound.matchStart} />);
    }

    headers.push({ label: "Grand Final", leftX: gfLeft, colW: CARD_W });
    headers.push({ label: "Tranh Hạng 3", leftX: bronzeLeft, colW: CARD_W });

    const canvasW = bronzeLeft + CARD_W + PAD;
    const canvasH = PAD + totalDEH + PAD;
    return { nodes, headers, canvasW, canvasH };
  })();

  const {
    nodes: canvasNodes,
    headers: headerCols,
    canvasW: totalCanvasWidth,
    canvasH: totalCanvasHeight,
  } = sectionData;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative w-full rounded-none border border-gray-700/40 flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 460px)", minHeight: 360 }}
    >
      {/* Three.js background */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <BracketBackground3D />
      </div>

      {/* ── Sticky header row ── */}
      <div
        ref={headerScrollRef}
        className="relative flex-shrink-0 overflow-hidden"
        style={{
          zIndex: 5,
          height: LABEL_H + 2,
          overflowX: "hidden",
          background: "rgba(9,11,17,0.92)",
          borderBottom: "1px solid rgba(124,58,237,0.3)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: totalCanvasWidth * zoom,
            height: LABEL_H,
          }}
        >
          {headerCols.map((col) => {
            const isCollapsed =
              !!col.toggleable && collapsedRounds.has(col.label);
            const scaledLeft = col.leftX * zoom + pan.x;
            const scaledW = col.colW * zoom;
            return (
              <div
                key={col.label}
                style={{
                  position: "absolute",
                  left: scaledLeft,
                  top: 0,
                  width: scaledW,
                  height: LABEL_H,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  overflow: "hidden",
                }}
              >
                {!isCollapsed && zoom > 0.5 && (
                  <span className="text-[10px] text-purple-400 font-bold tracking-wider select-none truncate">
                    {col.label}
                  </span>
                )}
                {col.toggleable && zoom > 0.4 && (
                  <button
                    onClick={() => toggleRound(col.label)}
                    title={
                      isCollapsed ? `Mở ${col.label}` : `Thu gọn ${col.label}`
                    }
                    style={{
                      flexShrink: 0,
                      width: 16,
                      height: 16,
                      borderRadius: 3,
                      border: "1px solid rgba(124,58,237,0.4)",
                      background: "rgba(124,58,237,0.15)",
                      color: "rgba(167,139,250,0.9)",
                      fontSize: 9,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    {isCollapsed ? "▶" : "◀"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Canvas pan+zoom area ── */}
      <div
        ref={canvasContainerRef}
        className="relative flex-1 min-h-0 overflow-hidden"
        style={{ zIndex: 1, cursor: isPanning.current ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transformOrigin: "0 0",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: totalCanvasWidth,
            height: totalCanvasHeight,
            willChange: "transform",
          }}
        >
          {canvasNodes}
        </div>
      </div>

      {/* ── Controls overlay ── */}
      <div
        className="absolute flex flex-col gap-1"
        style={{ zIndex: 10, bottom: 12, right: 12 }}
      >
        <button
          onClick={() => setZoom((z) => Math.min(3, z * 1.25))}
          title="Zoom in"
          className="w-8 h-8 rounded-none bg-gray-800/90 border border-gray-600/50 text-gray-300 hover:text-white hover:bg-gray-700 flex items-center justify-center text-lg font-bold"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.2, z * 0.8))}
          title="Zoom out"
          className="w-8 h-8 rounded-none bg-gray-800/90 border border-gray-600/50 text-gray-300 hover:text-white hover:bg-gray-700 flex items-center justify-center text-lg font-bold"
        >
          −
        </button>
        <button
          onClick={handleResetView}
          title="Reset view"
          className="w-8 h-8 rounded-none bg-gray-800/90 border border-gray-600/50 text-gray-400 hover:text-white hover:bg-gray-700 flex items-center justify-center text-xs font-bold"
        >
          ⌂
        </button>
        <div className="text-center text-[9px] text-gray-600 font-mono">
          {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
}
